import { createClient } from "@/lib/supabase/server";
import { verifyPluginToken } from "./token";
import { NextResponse } from "next/server";

export async function getUserId(
  request: Request,
): Promise<string | NextResponse> {
  const authHeader = request.headers.get("authorization");

  // Plugin auth: bearer token
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const userId = await verifyPluginToken(token);
    if (!userId) {
      return NextResponse.json({ error: "Invalid token", error_code: "invalid_token" }, { status: 401 });
    }
    return userId;
  }

  // Web app auth: resolve from the Supabase session cookie.
  // SECURITY: never trust an inbound x-user-id header here — middleware does
  // not set it for /api requests, so any value present is client-forged.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized", error_code: "unauthorized" }, { status: 401 });
  }
  return user.id;
}
