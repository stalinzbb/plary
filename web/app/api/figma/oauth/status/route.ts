import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/api/auth";
import { getConnectionStatus } from "@/lib/figma/connections";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (userId instanceof NextResponse) return userId;

  const status = await getConnectionStatus(userId);

  // Also fetch the Plary user email so the plugin can show it
  let plaryUserEmail: string | null = null;
  try {
    const supabase = createServiceClient();
    const { data: userData } = await supabase
      .schema("auth")
      .from("users")
      .select("email")
      .eq("id", userId)
      .single();
    plaryUserEmail = userData?.email ?? null;
  } catch { /* non-fatal */ }

  if (!status.connected) {
    return NextResponse.json({ connected: false, plary_user_email: plaryUserEmail });
  }

  return NextResponse.json({ ...status, plary_user_email: plaryUserEmail });
}
