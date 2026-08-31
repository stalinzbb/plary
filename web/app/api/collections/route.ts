import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/api/auth";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (userId instanceof NextResponse) return userId;

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("collections")
    .select("*")
    .eq("user_id", userId)
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message, error_code: "list_collections_error" }, { status: 500 });
  }

  const collections = data ?? [];

  if (collections.length > 0) {
    const collectionIds = collections.map((c) => c.id);

    // Get counts per collection via junction table
    const { data: counts } = await supabase
      .from("prototype_collections")
      .select("collection_id")
      .in("collection_id", collectionIds);

    const countMap = new Map<string, number>();
    (counts ?? []).forEach((pc) => {
      countMap.set(pc.collection_id, (countMap.get(pc.collection_id) ?? 0) + 1);
    });

    // Get up to 3 preview thumbnails per collection via junction table
    const { data: memberships } = await supabase
      .from("prototype_collections")
      .select("collection_id, created_at, prototypes(thumbnail_url, created_at)")
      .in("collection_id", collectionIds)
      .not("prototypes.thumbnail_url", "is", null)
      .order("created_at", { ascending: false });

    const thumbnailsMap = new Map<string, string[]>();
    (memberships ?? []).forEach((m: any) => {
      const existing = thumbnailsMap.get(m.collection_id) ?? [];
      if (existing.length < 3 && m.prototypes?.thumbnail_url) {
        existing.push(m.prototypes.thumbnail_url);
        thumbnailsMap.set(m.collection_id, existing);
      }
    });

    for (const c of collections) {
      (c as any).design_count = countMap.get(c.id) ?? 0;
      (c as any).preview_thumbnails = thumbnailsMap.get(c.id) ?? [];
    }
  }

  return NextResponse.json(collections);
}

export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (userId instanceof NextResponse) return userId;

  const body = await request.json();
  const normalized = (body.name ?? "").trim().replace(/\s+/g, " ");

  if (!normalized) {
    return NextResponse.json({ error: "Collection name is required.", error_code: "validation_error" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: inserted, error: insertError } = await supabase
    .from("collections")
    .insert({ user_id: userId, name: normalized, description: body.description ?? null })
    .select()
    .single();

  if (inserted) {
    return NextResponse.json({ ...inserted, design_count: 0, preview_thumbnails: [] }, { status: 201 });
  }

  if (insertError) {
    const { data: existing } = await supabase
      .from("collections")
      .select("*")
      .eq("user_id", userId)
      .ilike("name", normalized)
      .single();

    if (existing) {
      return NextResponse.json({ ...existing, design_count: 0, preview_thumbnails: [] });
    }
  }

  return NextResponse.json(
    { error: "Could not create collection.", error_code: "create_collection_error" },
    { status: 500 },
  );
}
