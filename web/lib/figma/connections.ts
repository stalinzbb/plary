import { createServiceClient } from "@/lib/supabase/service";
import { encryptToken, decryptToken } from "./encryption";
import { refreshAccessToken, FIGMA_SCOPES } from "./oauth";

export interface FigmaConnection {
  user_id: string;
  figma_user_id: string;
  figma_email: string | null;
  figma_display_name: string | null;
  figma_avatar_url: string | null;
  scopes: string[];
  health: "connected" | "needs_reconnect";
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

interface StoredTokens {
  access_token: string;
  refresh_token?: string;
  expires_at: Date;
}

export async function storeConnection(
  userId: string,
  figmaUser: { id: string; email?: string; handle?: string; img_url?: string },
  tokens: StoredTokens,
  scopes: string[],
): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("figma_connections").upsert({
    user_id: userId,
    figma_user_id: figmaUser.id,
    figma_email: figmaUser.email ?? null,
    figma_display_name: figmaUser.handle ?? null,
    figma_avatar_url: figmaUser.img_url ?? null,
    access_token_encrypted: encryptToken(tokens.access_token),
    refresh_token_encrypted: tokens.refresh_token
      ? encryptToken(tokens.refresh_token)
      : null,
    scopes,
    expires_at: tokens.expires_at.toISOString(),
    health: "connected",
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Failed to store Figma connection: ${error.message}`);
}

export async function getValidAccessToken(userId: string): Promise<string | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("figma_connections")
    .select("access_token_encrypted, refresh_token_encrypted, expires_at")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;

  try {
    const accessToken = decryptToken(data.access_token_encrypted);
    const expiresAt = data.expires_at ? new Date(data.expires_at) : null;

    // Return token if it's still valid with 60s buffer
    if (expiresAt && expiresAt.getTime() > Date.now() + 60_000) {
      return accessToken;
    }

    // Token expired or close to expiry — refresh
    if (!data.refresh_token_encrypted) {
      await markNeedsReconnect(userId);
      return null;
    }

    const refreshToken = decryptToken(data.refresh_token_encrypted);
    const newTokens = await refreshAccessToken(refreshToken);

    // Store new tokens
    const expiresAtDate = new Date(Date.now() + newTokens.expires_in * 1000);
    await supabase
      .from("figma_connections")
      .update({
        access_token_encrypted: encryptToken(newTokens.access_token),
        refresh_token_encrypted: newTokens.refresh_token
          ? encryptToken(newTokens.refresh_token)
          : data.refresh_token_encrypted,
        expires_at: expiresAtDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    return newTokens.access_token;
  } catch (e) {
    // Usually a FIGMA_ENCRYPTION_KEY mismatch (row encrypted under a different key)
    // or a failed refresh. Without this log the caller just sees needs_reconnect,
    // which is indistinguishable from a missing scope.
    console.error("[figma-connections] token unusable for", userId, "-", e instanceof Error ? e.message : String(e));
    await markNeedsReconnect(userId);
    return null;
  }
}

export async function getConnectionStatus(
  userId: string,
): Promise<
  | { connected: false }
  | {
      connected: true;
      figma_user: {
        id: string;
        email: string | null;
        display_name: string | null;
        avatar_url: string | null;
      };
      health: string | null;
      scopes: string[];
      expires_at: string | null;
    }
> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("figma_connections")
    .select(
      "figma_user_id, figma_email, figma_display_name, figma_avatar_url, health, scopes, expires_at",
    )
    .eq("user_id", userId)
    .single();

  if (error || !data) return { connected: false };

  // A row written before a scope was added to FIGMA_SCOPES still says
  // "connected" in the column, but can't do what the product needs — report
  // it as needs_reconnect so every consumer (Settings badge, web banner,
  // plugin strip) prompts without its own scope logic. (#49)
  const scopes: string[] = data.scopes ?? [];
  const health = FIGMA_SCOPES.every((s) => scopes.includes(s))
    ? data.health
    : "needs_reconnect";

  return {
    connected: true,
    figma_user: {
      id: data.figma_user_id,
      email: data.figma_email,
      display_name: data.figma_display_name,
      avatar_url: data.figma_avatar_url,
    },
    health,
    scopes,
    expires_at: data.expires_at,
  };
}

export async function disconnect(userId: string): Promise<void> {
  const supabase = createServiceClient();

  // Figma has no token revoke endpoint — just delete the connection.
  // The access token expires naturally (usually 1 hour) and the refresh
  // token becomes invalid once the connection row is gone.
  await supabase.from("figma_connections").delete().eq("user_id", userId);
}

async function markNeedsReconnect(userId: string): Promise<void> {
  const supabase = createServiceClient();
  await supabase
    .from("figma_connections")
    .update({
      health: "needs_reconnect",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
}
