import { createServiceClient } from "@/lib/supabase/service";

const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function createOAuthState(userId: string): Promise<string> {
  const supabase = createServiceClient();
  const state = crypto.randomUUID();

  // Best-effort cleanup of expired states
  await supabase
    .from("oauth_states")
    .delete()
    .lt("created_at", new Date(Date.now() - STATE_TTL_MS).toISOString());

  const { error } = await supabase.from("oauth_states").insert({
    user_id: userId,
    state,
  });

  if (error) throw new Error(`Failed to create OAuth state: ${error.message}`);
  return state;
}

export async function consumeOAuthState(state: string): Promise<string | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("oauth_states")
    .select("user_id, created_at")
    .eq("state", state)
    .single();

  if (error || !data) return null;

  // Check TTL
  const createdAt = new Date(data.created_at);
  if (Date.now() - createdAt.getTime() > STATE_TTL_MS) {
    await supabase.from("oauth_states").delete().eq("state", state);
    return null;
  }

  // Consume (one-time use)
  await supabase.from("oauth_states").delete().eq("state", state);
  return data.user_id;
}

export async function validateOAuthState(state: string): Promise<string | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("oauth_states")
    .select("user_id, created_at")
    .eq("state", state)
    .single();

  if (error || !data) return null;

  // Check TTL
  const createdAt = new Date(data.created_at);
  if (Date.now() - createdAt.getTime() > STATE_TTL_MS) {
    await supabase.from("oauth_states").delete().eq("state", state);
    return null;
  }

  // Validate only — do not delete (caller must consume after success)
  return data.user_id;
}
