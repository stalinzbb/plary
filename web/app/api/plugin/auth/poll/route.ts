import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { generatePluginToken } from "@/lib/api/token";
import { checkRateLimit, clientIp } from "@/lib/api/rate-limit";

export async function GET(request: NextRequest) {
  // Unauthenticated; polled every 2s (~30/min per active session). Cap high
  // enough for several concurrent sessions behind one NAT, low enough to stop
  // session-id spraying.
  const allowed = await checkRateLimit("plugin_auth_poll", clientIp(request), 60, 120);
  if (!allowed) {
    return NextResponse.json({ status: "pending" }, { status: 429 });
  }

  const sessionId = request.nextUrl.searchParams.get("session");
  if (!sessionId) {
    return NextResponse.json({ status: "expired" });
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("plugin_auth_sessions")
    .select("id, user_id, status, expires_at")
    .eq("session_id", sessionId)
    .single();

  if (error || !data) {
    return NextResponse.json({ status: "expired" });
  }

  if (data.status === "expired" || data.expires_at < now) {
    if (data.status !== "expired") {
      await supabase
        .from("plugin_auth_sessions")
        .update({ status: "expired" })
        .eq("session_id", sessionId);
    }
    return NextResponse.json({ status: "expired" });
  }

  if (data.status === "pending") {
    return NextResponse.json({ status: "pending" });
  }

  // status === "ready"
  if (!data.user_id) {
    return NextResponse.json({ status: "expired" });
  }

  const token = await generatePluginToken(data.user_id);

  // Delete the session — single-use
  await supabase
    .from("plugin_auth_sessions")
    .delete()
    .eq("session_id", sessionId);

  return NextResponse.json({ status: "ready", token });
}
