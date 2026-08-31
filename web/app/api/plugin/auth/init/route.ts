import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { checkRateLimit, clientIp } from "@/lib/api/rate-limit";

export async function POST(request: Request) {
  // Unauthenticated + writes a row each call — cap per IP.
  const allowed = await checkRateLimit("plugin_auth_init", clientIp(request), 60, 20);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const supabase = createServiceClient();

  // Opportunistic cleanup of abandoned sessions (incl. daily keep-alive pings)
  await supabase.from("plugin_auth_sessions").delete().lt("expires_at", new Date().toISOString());

  const { error } = await supabase.from("plugin_auth_sessions").insert({
    session_id: sessionId,
    status: "pending",
    expires_at: expiresAt,
  });

  if (error) {
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }

  return NextResponse.json({ session_id: sessionId, expires_at: expiresAt });
}
