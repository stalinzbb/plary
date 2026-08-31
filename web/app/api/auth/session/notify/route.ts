import { NextRequest, NextResponse } from "next/server";
import { markNewLoginNotified, getSessionToken } from "@/lib/api/session";

export async function POST(request: NextRequest) {
  const sessionToken = getSessionToken(request);
  if (!sessionToken) {
    return NextResponse.json({ error: "No session" }, { status: 401 });
  }

  await markNewLoginNotified(sessionToken);
  return NextResponse.json({ success: true });
}
