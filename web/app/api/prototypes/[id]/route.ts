import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/api/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { isValidFigmaUrl } from "@/lib/api/query";

async function getCollections(supabase: ReturnType<typeof createServiceClient>, prototypeId: string) {
  const { data } = await supabase
    .from("prototype_collections")
    .select("collection_id, created_at, collections(name)")
    .eq("prototype_id", prototypeId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((m: any) => ({
    id: m.collection_id,
    name: m.collections?.name ?? "",
    created_at: m.created_at,
  }));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId(request);
  if (userId instanceof NextResponse) return userId;

  const { id } = await params;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("prototypes")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message, error_code: "prototype_not_found" }, { status: 404 });
  }

  // Fetch user email
  const { data: userData } = await supabase
    .schema("auth")
    .from("users")
    .select("email")
    .eq("id", data.user_id)
    .single();

  const collections = await getCollections(supabase, data.id);

  return NextResponse.json({
    ...data,
    user_email: userData?.email ?? null,
    collections,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId(request);
  if (userId instanceof NextResponse) return userId;

  const { id } = await params;
  const body = await request.json();
  const supabase = createServiceClient();

  // Verify prototype belongs to this user before making any changes
  const { data: prototype, error: lookupError } = await supabase
    .from("prototypes")
    .select("id")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (lookupError || !prototype) {
    return NextResponse.json({ error: "Prototype not found", error_code: "prototype_not_found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.figma_url !== undefined) {
    if (body.figma_url !== null && !isValidFigmaUrl(body.figma_url)) {
      return NextResponse.json(
        { error: "figma_url must be an https figma.com URL", error_code: "invalid_figma_url" },
        { status: 400 },
      );
    }
    updates.figma_url = body.figma_url;
  }
  if (body.thumbnail_url !== undefined) updates.thumbnail_url = body.thumbnail_url;
  if (body.last_viewed_at !== undefined) updates.last_viewed_at = body.last_viewed_at;
  if (body.kind !== undefined) updates.kind = body.kind;

  if (Object.keys(updates).length > 1) {
    const { error } = await supabase
      .from("prototypes")
      .update(updates)
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json({ error: error.message, error_code: "update_prototype_error" }, { status: 500 });
    }
  }

  // Replace collection memberships if collection_ids provided
  if (body.collection_ids !== undefined) {
    const ids: string[] = body.collection_ids;

    // Verify all submitted collection IDs belong to this user
    if (ids.length > 0) {
      const { data: ownedCollections } = await supabase
        .from("collections")
        .select("id")
        .eq("user_id", userId)
        .in("id", ids);

      const ownedIds = new Set((ownedCollections ?? []).map((c) => c.id));
      const invalidIds = ids.filter((cid) => !ownedIds.has(cid));

      if (invalidIds.length > 0) {
        return NextResponse.json(
          { error: "One or more collections do not exist or are not yours.", error_code: "invalid_collections" },
          { status: 403 },
        );
      }
    }

    // Delete existing memberships
    await supabase
      .from("prototype_collections")
      .delete()
      .eq("prototype_id", id);

    // Insert new ones
    if (ids.length > 0) {
      await supabase.from("prototype_collections").insert(
        ids.map((cid) => ({
          user_id: userId,
          prototype_id: id,
          collection_id: cid,
        })),
      );
    }
  }

  const collections = await getCollections(supabase, id);

  return NextResponse.json({ id, ...updates, collections });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId(request);
  if (userId instanceof NextResponse) return userId;

  const { id } = await params;
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("prototypes")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message, error_code: "delete_prototype_error" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
