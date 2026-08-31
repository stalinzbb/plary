import { NextResponse } from "next/server";
import { getUserId } from "@/lib/api/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { getValidAccessToken } from "@/lib/figma/connections";
import { PROJECT_METADATA_SCOPE } from "@/lib/figma/oauth";

const FIGMA_API_BASE = "https://api.figma.com/v1";

// ponytail: 10 min — long enough to absorb repeat plugin opens, short enough
// that a newly created team file resolves within a coffee break
const CACHE_TTL_MS = 10 * 60_000;

type TeamFile = { key: string; name: string };

function matchStatus(files: TeamFile[], fileName: string) {
  const matches = files.filter((f) => f.name === fileName).map((f) => f.key);
  if (matches.length === 1) return { status: "resolved", file_key: matches[0] };
  return { status: matches.length === 0 ? "not_found" : "ambiguous" };
}

// Resolve the file key for the file currently open in the plugin.
// Community plugins can't read figma.fileKey, but they can read the file
// name — so we match it against the files in the user's registered teams.
// Statuses: resolved | not_connected | needs_reconnect | token_unusable |
//           no_teams | not_found | ambiguous | rate_limited
export async function POST(request: Request) {
  const userId = await getUserId(request);
  if (userId instanceof NextResponse) return userId;

  const body = await request.json().catch(() => null);
  const fileName: string = body?.file_name ?? "";
  if (!fileName) {
    return NextResponse.json({ error: "file_name is required" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: conn } = await supabase
    .from("figma_connections")
    .select("scopes, team_ids")
    .eq("user_id", userId)
    .single();

  if (!conn) return NextResponse.json({ status: "not_connected" });
  if (!conn.scopes?.includes(PROJECT_METADATA_SCOPE)) {
    // Connection predates the project-metadata scope — user must reconnect Figma
    return NextResponse.json({ status: "needs_reconnect" });
  }
  const teamIds: string[] = conn.team_ids ?? [];
  if (teamIds.length === 0) return NextResponse.json({ status: "no_teams" });

  // Warm cache: repeat opens within the TTL make no Figma calls and skip the
  // token dance entirely. team_ids is the snapshot the listing was built
  // from, so registering a new team invalidates by mismatch. (#52)
  const { data: cached } = await supabase
    .from("figma_file_cache")
    .select("team_ids, files, fetched_at")
    .eq("user_id", userId)
    .maybeSingle();

  const cacheFresh =
    cached &&
    Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS &&
    [...teamIds].sort().join() === [...(cached.team_ids ?? [])].sort().join();

  if (cacheFresh) {
    return NextResponse.json(matchStatus(cached.files ?? [], fileName));
  }

  // Distinct from needs_reconnect: the scopes are fine but the token failed
  // to decrypt or refresh (reason logged by getValidAccessToken). Only one of
  // the two is reliably fixed by reconnecting — don't conflate them. (#48)
  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) return NextResponse.json({ status: "token_unusable" });

  const headers = { Authorization: `Bearer ${accessToken}` };
  const files: TeamFile[] = [];
  let rateLimited = false;

  for (const teamId of teamIds) {
    const projRes = await fetch(`${FIGMA_API_BASE}/teams/${teamId}/projects`, { headers });
    if (projRes.status === 429) { rateLimited = true; continue; }
    if (!projRes.ok) continue;
    const { projects } = await projRes.json();

    const fileLists = await Promise.all(
      (projects ?? []).map(async (p: { id: string }) => {
        const res = await fetch(`${FIGMA_API_BASE}/projects/${p.id}/files`, { headers });
        if (res.status === 429) rateLimited = true;
        if (!res.ok) return [];
        const { files: projectFiles } = await res.json();
        return projectFiles ?? [];
      }),
    );

    for (const file of fileLists.flat()) {
      files.push({ key: file.key, name: file.name });
    }
  }

  if (!rateLimited) {
    // Non-fatal if the write fails (e.g. migration 00014 not applied yet) —
    // resolution still works, it just refetches on every open.
    const { error: cacheError } = await supabase.from("figma_file_cache").upsert({
      user_id: userId,
      team_ids: teamIds,
      files,
      fetched_at: new Date().toISOString(),
    });
    if (cacheError) {
      console.error("[resolve-file] cache write failed:", cacheError.message);
    }
  }

  const result = matchStatus(files, fileName);
  if (result.status === "not_found" && rateLimited) {
    // The listing is partial — "not found" would be a lie. A unique match
    // from partial data is still a match, so those return resolved above.
    // ponytail: no stale-cache fallback here; add one if 429s prove common.
    return NextResponse.json({ status: "rate_limited" });
  }
  return NextResponse.json(result);
}
