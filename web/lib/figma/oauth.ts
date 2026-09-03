const FIGMA_AUTH_URL = "https://www.figma.com/oauth";
const FIGMA_TOKEN_URL = "https://api.figma.com/v1/oauth/token";
const FIGMA_REFRESH_URL = "https://api.figma.com/v1/oauth/refresh";
const FIGMA_API_BASE = "https://api.figma.com/v1";

interface FigmaTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: "bearer";
}

interface FigmaUser {
  id: string;
  email: string;
  handle: string;
  img_url: string;
}

function getOAuthCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.FIGMA_CLIENT_ID;
  const clientSecret = process.env.FIGMA_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("FIGMA_CLIENT_ID and FIGMA_CLIENT_SECRET must be set");
  }
  return { clientId, clientSecret };
}

// Single source of truth: requested here, stored verbatim by the OAuth callback.
export const FIGMA_SCOPES = [
  "current_user:read",
  "file_metadata:read",
  "file_content:read",
];

export function buildAuthorizationUrl(state: string, redirectUri: string): string {
  const { clientId } = getOAuthCredentials();
  const scopes = FIGMA_SCOPES;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes.join(" "),
    state,
    response_type: "code",
  });
  return `${FIGMA_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCode(
  code: string,
  redirectUri: string,
): Promise<FigmaTokenResponse> {
  const { clientId, clientSecret } = getOAuthCredentials();
  const res = await fetch(FIGMA_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Figma token exchange failed: ${res.status} ${text} (redirectUri: ${redirectUri})`);
  }
  return res.json();
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<FigmaTokenResponse> {
  const { clientId, clientSecret } = getOAuthCredentials();
  const res = await fetch(FIGMA_REFRESH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Figma token refresh failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function getFigmaUser(accessToken: string): Promise<FigmaUser> {
  const res = await fetch(`${FIGMA_API_BASE}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Figma user fetch failed: ${res.status}`);
  }
  return res.json();
}
