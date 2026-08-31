import { NextRequest, NextResponse } from "next/server";
import { validateOAuthState, consumeOAuthState } from "@/lib/figma/state";
import { exchangeCode, getFigmaUser, FIGMA_SCOPES } from "@/lib/figma/oauth";
import { storeConnection } from "@/lib/figma/connections";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const siteUrl = request.nextUrl.origin;

  if (error || !code || !state) {
    const detail = error || "Missing code or state";
    return NextResponse.redirect(
      new URL(`/settings?figma=error&detail=${encodeURIComponent(detail)}`, siteUrl),
    );
  }

  // Validate state WITHOUT consuming — if the exchange fails the state survives for retry
  const userId = await validateOAuthState(state);
  if (!userId) {
    return NextResponse.redirect(
      new URL("/settings?figma=expired", siteUrl),
    );
  }

  try {
    const redirectUri = `${siteUrl}/api/figma/oauth/callback`;

    const tokens = await exchangeCode(code, redirectUri);

    // Consume state now that exchange succeeded
    await consumeOAuthState(state);

    const figmaUser = await getFigmaUser(tokens.access_token);
    console.log("[figma-oauth-callback] Figma user:", figmaUser.id, figmaUser.email);

    await storeConnection(
      userId,
      {
        id: figmaUser.id,
        email: figmaUser.email,
        handle: figmaUser.handle,
        img_url: figmaUser.img_url,
      },
      {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000),
      },
      FIGMA_SCOPES,
    );

    console.log("[figma-oauth-callback] Connection stored, redirecting to settings");

    const response = NextResponse.redirect(
      new URL("/settings?figma=connected", siteUrl),
    );
    response.cookies.delete("figma_oauth_redirect_uri");
    return response;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[figma-oauth-callback] Callback error:", msg);
    return NextResponse.redirect(
      new URL(`/settings?figma=error&detail=${encodeURIComponent(msg)}`, siteUrl),
    );
  }
}
