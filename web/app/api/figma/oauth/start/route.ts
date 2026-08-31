import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/api/auth";
import { createOAuthState } from "@/lib/figma/state";
import { buildAuthorizationUrl } from "@/lib/figma/oauth";

export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (userId instanceof NextResponse) return userId;

  const state = await createOAuthState(userId);

  // Derive from the request origin — localhost in dev, the deployed domain in
  // prod. A NEXT_PUBLIC_SITE_URL copied from .env.local into Vercel was
  // sending production users to localhost, so the env var is no longer used.
  const siteUrl = request.nextUrl.origin;
  const redirectUri = `${siteUrl}/api/figma/oauth/callback`;

  const url = buildAuthorizationUrl(state, redirectUri);

  const response = NextResponse.redirect(url);
  response.cookies.set("figma_oauth_redirect_uri", redirectUri, {
    httpOnly: true,
    sameSite: "lax",
    path: "/api/figma/oauth",
    maxAge: 600, // 10 min, matches state TTL
  });
  return response;
}
