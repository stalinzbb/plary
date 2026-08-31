import { NextResponse } from "next/server";
import { getUserId } from "@/lib/api/auth";
import { createServiceClient } from "@/lib/supabase/service";

// Register a Figma team so resolve-file can enumerate its files.
// The REST API has no "list my teams" endpoint, so the user pastes
// their team URL once (e.g. https://www.figma.com/files/team/123456789/Name).
export async function POST(request: Request) {
  const userId = await getUserId(request);
  if (userId instanceof NextResponse) return userId;

  const body = await request.json().catch(() => null);
  const teamUrl: string = body?.team_url ?? "";
  const match = teamUrl.match(/figma\.com\/files\/(?:\d+\/)?team\/(\d+)/);
  if (!match) {
    return NextResponse.json(
      { error: "Not a Figma team URL", error_code: "invalid_team_url" },
      { status: 400 },
    );
  }
  const teamId = match[1];

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("figma_connections")
    .select("team_ids")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Figma account not connected", error_code: "figma_not_connected" },
      { status: 403 },
    );
  }

  const teamIds: string[] = data.team_ids ?? [];
  if (!teamIds.includes(teamId)) {
    const { error: updateError } = await supabase
      .from("figma_connections")
      .update({ team_ids: [...teamIds, teamId], updated_at: new Date().toISOString() })
      .eq("user_id", userId);
    if (updateError) {
      return NextResponse.json({ error: "Failed to save team" }, { status: 500 });
    }
  }

  return NextResponse.json({ team_id: teamId });
}
