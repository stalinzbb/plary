"use client";

import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";

// Self-host knob: NEXT_PUBLIC_AUTH_PROVIDERS="google,azure" renders one OAuth button
// per provider (which must also be enabled in the Supabase dashboard). Unset → renders
// nothing and login stays magic-link only.
const PROVIDERS = (process.env.NEXT_PUBLIC_AUTH_PROVIDERS ?? "")
  .split(",")
  .map((p) => p.trim().toLowerCase())
  .filter(Boolean);

const LABELS: Record<string, string> = {
  google: "Google",
  azure: "Microsoft",
  github: "GitHub",
  okta: "Okta",
};

export function AuthProviders({ redirectTo }: { redirectTo: string }) {
  if (PROVIDERS.length === 0) return null;

  const signIn = async (provider: string) => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      // ponytail: provider strings are pass-through; Supabase rejects unknown ones
      provider: provider as Parameters<typeof supabase.auth.signInWithOAuth>[0]["provider"],
      options: { redirectTo },
    });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {PROVIDERS.map((p) => (
          <Button
            key={p}
            type="button"
            variant="outline"
            className="h-10 w-full"
            onClick={() => signIn(p)}
          >
            Continue with {LABELS[p] ?? p.charAt(0).toUpperCase() + p.slice(1)}
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
