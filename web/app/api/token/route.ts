import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/api/auth";
import { generatePluginToken, revokePluginTokens } from "@/lib/api/token";

// Display the current plugin token (mints at the current version — no side effects).
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (userId instanceof NextResponse) return userId;

  const token = await generatePluginToken(userId);
  return NextResponse.json({ token });
}

// Regenerate: revoke all existing plugin tokens, then mint a fresh one.
export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (userId instanceof NextResponse) return userId;

  await revokePluginTokens(userId);
  const token = await generatePluginToken(userId);
  return NextResponse.json({ token });
}
