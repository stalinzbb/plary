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

// Revoke every plugin token for the user without minting a new one (plugin Log out).
// getUserId accepts the plugin's own Bearer token, so the plugin can call this
// with the token it is about to discard.
export async function DELETE(request: NextRequest) {
  const userId = await getUserId(request);
  if (userId instanceof NextResponse) return userId;

  await revokePluginTokens(userId);
  return NextResponse.json({ success: true });
}

// Regenerate: revoke all existing plugin tokens, then mint a fresh one.
export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (userId instanceof NextResponse) return userId;

  await revokePluginTokens(userId);
  const token = await generatePluginToken(userId);
  return NextResponse.json({ token });
}
