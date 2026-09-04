import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/api/auth";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  // Cookie-only: this route is called by the browser pairing page, and a leaked
  // plugin token must not be able to approve new pairings (i.e. mint more tokens).
  if (request.headers.get("authorization")) {
    return NextResponse.json({ error: "Unauthorized", error_code: "unauthorized" }, { status: 401 });
  }

  const userId = await getUserId(request);
  if (userId instanceof NextResponse) return userId;

  let sessionId: string;
  try {
    const body = await request.json();
    sessionId = body.session_id;
  } catch {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  if (!sessionId || typeof sessionId !== "string") {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  // Look up the session
  const { data, error } = await supabase
    .from("plugin_auth_sessions")
    .select("id, status, expires_at")
    .eq("session_id", sessionId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (data.status === "ready") {
    return NextResponse.json({ error: "Session already consumed" }, { status: 404 });
  }

  if (data.status === "expired" || data.expires_at < now) {
    await supabase
      .from("plugin_auth_sessions")
      .update({ status: "expired" })
      .eq("session_id", sessionId);
    return NextResponse.json({ error: "Session expired" }, { status: 410 });
  }

  // Mark as ready with the authenticated user
  const { error: updateError } = await supabase
    .from("plugin_auth_sessions")
    .update({ user_id: userId, status: "ready" })
    .eq("session_id", sessionId);

  if (updateError) {
    return NextResponse.json({ error: "Failed to authorize session" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
