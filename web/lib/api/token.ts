import { SignJWT, jwtVerify } from "jose";
import { createServiceClient } from "@/lib/supabase/service";
import { alertFailOpen } from "./alert";

const secret = () => new TextEncoder().encode(process.env.PLARY_TOKEN_SECRET!);

// Plugin tokens live in figma.clientStorage and are reused across sessions.
// 30d (down from 365d) bounds the exposure window of a leaked token; the
// version claim below makes explicit revocation possible before then.
const TOKEN_TTL = "30d";

// A token with no `v` claim (minted before versioning) and a user with no
// version row both resolve to 1, so old tokens stay valid until first revoke.
export function tokenVersionMatches(
  claim: number | undefined,
  current: number | undefined,
): boolean {
  return (claim ?? 1) === (current ?? 1);
}

async function getTokenVersion(userId: string): Promise<number | undefined> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("plugin_token_versions")
    .select("version")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    // ponytail: fail-open — a DB blip must not log every plugin user out.
    // Revocation is best-effort; the 30d TTL is the hard exposure bound.
    alertFailOpen("token-version", error.message);
    return undefined;
  }
  return data?.version;
}

export async function generatePluginToken(userId: string): Promise<string> {
  const version = (await getTokenVersion(userId)) ?? 1;
  return new SignJWT({ sub: userId, v: version })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(secret());
}

export async function verifyPluginToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    const userId = payload.sub as string | undefined;
    if (!userId) return null;
    const current = await getTokenVersion(userId);
    if (!tokenVersionMatches(payload.v as number | undefined, current)) {
      return null; // revoked
    }
    return userId;
  } catch {
    return null;
  }
}

// Invalidates every existing plugin token for the user by bumping the version.
export async function revokePluginTokens(userId: string): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.rpc("bump_token_version", {
    p_user_id: userId,
  });
  if (error) {
    console.error("[token] revoke error:", error.message);
    throw new Error("Failed to revoke tokens");
  }
}
