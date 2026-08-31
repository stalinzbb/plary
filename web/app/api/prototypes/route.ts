import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/api/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { getConnectionStatus } from "@/lib/figma/connections";
import { escapeSearchTerm, isValidFigmaUrl } from "@/lib/api/query";

async function attachCollections(
  supabase: ReturnType<typeof createServiceClient>,
  prototypes: any[],
) {
  const ids = prototypes.map((p) => p.id);
  if (ids.length === 0) return;

  const { data: memberships } = await supabase
    .from("prototype_collections")
    .select("prototype_id, collection_id, created_at, collections(name)")
    .in("prototype_id", ids)
    .order("created_at", { ascending: false });

  const map = new Map<string, { id: string; name: string; created_at: string }[]>();
  (memberships ?? []).forEach((m: any) => {
    if (!map.has(m.prototype_id)) map.set(m.prototype_id, []);
    map.get(m.prototype_id)!.push({
      id: m.collection_id,
      name: m.collections?.name ?? "",
      created_at: m.created_at,
    });
  });

  for (const p of prototypes) {
    p.collections = map.get(p.id) ?? [];
  }
}

export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (userId instanceof NextResponse) return userId;

  // Require a healthy Figma OAuth connection to save (data-integrity gate)
  const connection = await getConnectionStatus(userId);
  if (!connection.connected) {
    return NextResponse.json(
      { error: "Figma account not connected. Connect your Figma account in Plary Settings.", error_code: "figma_not_connected" },
      { status: 403 },
    );
  }
  if (connection.health === "needs_reconnect") {
    return NextResponse.json(
      { error: "Figma account needs reconnection. Reconnect your Figma account in Plary Settings.", error_code: "figma_needs_reconnect" },
      { status: 403 },
    );
  }

  const body = await request.json();
  const supabase = createServiceClient();

  // Resolve collection_ids from names if provided
  let collectionIds: string[] = body.collection_ids ?? [];

  if (body.collection_names && body.collection_names.length > 0) {
    const names: string[] = body.collection_names.map((n: string) => n.trim().replace(/\s+/g, " "));
    for (const name of names) {
      // Try insert first (upsert pattern)
      const { data: inserted } = await supabase
        .from("collections")
        .insert({ user_id: userId, name })
        .select("id")
        .single();

      if (inserted) {
        collectionIds.push(inserted.id);
      } else {
        const { data: existing } = await supabase
          .from("collections")
          .select("id")
          .eq("user_id", userId)
          .ilike("name", name)
          .single();
        if (existing) collectionIds.push(existing.id);
      }
    }
  }

  // Deduplicate
  collectionIds = [...new Set(collectionIds)];

  // Log Figma user identity mismatch with OAuth connection
  const oauthFigmaUserId = connection.figma_user?.id;
  if (body.figma_user_id && oauthFigmaUserId && body.figma_user_id !== oauthFigmaUserId) {
    console.warn(
      "[plugin-save] Figma user mismatch. Plary user:", userId,
      "OAuth figma_user:", oauthFigmaUserId,
      "Plugin-reported figma_user:", body.figma_user_id,
    );
  }

  if (body.figma_url == null && body.figma_file_key == null) {
    return NextResponse.json(
      { error: "A Figma URL or file key is required", error_code: "missing_figma_link" },
      { status: 400 },
    );
  }

  if (body.figma_url != null && !isValidFigmaUrl(body.figma_url)) {
    return NextResponse.json(
      { error: "figma_url must be an https figma.com URL", error_code: "invalid_figma_url" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("prototypes")
    .insert({
      user_id: userId,
      title: body.title,
      description: body.description ?? null,
      figma_url: body.figma_url ?? null,
      figma_file_key: body.figma_file_key ?? null,
      figma_node_id: body.figma_node_id ?? null,
      saved_by_figma_user_id: body.figma_user_id ?? null,
      thumbnail_url: body.thumbnail_url ?? null,
      kind: body.kind ?? "prototype",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message, error_code: "create_prototype_error" }, { status: 500 });
  }

  // Insert junction rows
  if (collectionIds.length > 0) {
    await supabase.from("prototype_collections").insert(
      collectionIds.map((cid) => ({
        user_id: userId,
        prototype_id: data.id,
        collection_id: cid,
      })),
    );
  }

  await attachCollections(supabase, [data]);

  return NextResponse.json(data, { status: 201 });
}

export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (userId instanceof NextResponse) return userId;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const archived = searchParams.get("archived");
  const kind = searchParams.get("kind");
  const cursor = searchParams.get("cursor");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 50);

  const supabase = createServiceClient();
  let query = supabase.from("prototypes").select("*").eq("user_id", userId);

  if (archived !== "true") {
    query = query.eq("archived", false);
  }

  if (q) {
    const safe = escapeSearchTerm(q);
    if (safe) {
      query = query.or(`title.ilike.%${safe}%,description.ilike.%${safe}%`);
    }
  }

  if (kind) {
    query = query.eq("kind", kind);
  }

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  query = query.order("created_at", { ascending: false }).limit(limit + 1);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message, error_code: "list_prototypes_error" }, { status: 500 });
  }

  const prototypes = (data ?? []).slice(0, limit);
  const hasMore = (data ?? []).length > limit;

  await attachCollections(supabase, prototypes);

  const response = NextResponse.json(prototypes);
  if (hasMore) {
    const lastCreatedAt = prototypes[prototypes.length - 1]?.created_at;
    if (lastCreatedAt) {
      response.headers.set("X-Next-Cursor", lastCreatedAt);
    }
  }

  return response;
}
