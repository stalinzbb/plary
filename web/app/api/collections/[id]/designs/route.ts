import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/api/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { escapeSearchTerm } from "@/lib/api/query";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId(request);
  if (userId instanceof NextResponse) return userId;

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const archived = searchParams.get("archived");
  const kind = searchParams.get("kind");
  const cursor = searchParams.get("cursor");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 50);

  const supabase = createServiceClient();

  // Get prototype IDs in this collection via junction table
  const { data: memberships } = await supabase
    .from("prototype_collections")
    .select("prototype_id")
    .eq("collection_id", id);

  const prototypeIds = (memberships ?? []).map((m) => m.prototype_id);

  if (prototypeIds.length === 0) {
    return NextResponse.json([]);
  }

  let query = supabase
    .from("prototypes")
    .select("*")
    .eq("user_id", userId)
    .in("id", prototypeIds);

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
    return NextResponse.json({ error: error.message, error_code: "list_designs_error" }, { status: 500 });
  }

  // Attach collections to each prototype
  const prototypes = (data ?? []).slice(0, limit);
  const hasMore = (data ?? []).length > limit;
  const allIds = prototypes.map((p) => p.id);

  if (allIds.length > 0) {
    const { data: allMemberships } = await supabase
      .from("prototype_collections")
      .select("prototype_id, collection_id, created_at, collections(name)")
      .in("prototype_id", allIds)
      .order("created_at", { ascending: false });

    const map = new Map<string, { id: string; name: string; created_at: string }[]>();
    (allMemberships ?? []).forEach((m: any) => {
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

  const response = NextResponse.json(prototypes);
  if (hasMore) {
    const lastCreatedAt = prototypes[prototypes.length - 1]?.created_at;
    if (lastCreatedAt) {
      response.headers.set("X-Next-Cursor", lastCreatedAt);
    }
  }

  return response;
}
