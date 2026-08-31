"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoaderCircle, CheckCircle2, AlertCircle, LogIn } from "lucide-react";
import { AuthProviders } from "@/components/auth-providers";

type State =
  | { kind: "checking" }
  | { kind: "authorizing" }
  | { kind: "success" }
  | { kind: "login"; email: string; sending: boolean; sent: boolean; error: string | null }
  | { kind: "expired" }
  | { kind: "error"; message: string };

function AuthFlow() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const [state, setState] = useState<State>({ kind: "checking" });

  useEffect(() => {
    if (!sessionId) {
      setState({ kind: "error", message: "Missing session. Close this tab and try again from the plugin." });
      return;
    }

    const supabase = createClient();

    // Check if there's a code from magic link redirect
    const code = searchParams.get("code");
    const run = async () => {
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setState({ kind: "authorizing" });
        try {
          const res = await fetch("/api/plugin/auth/authorize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: sessionId }),
          });

          if (res.ok) {
            setState({ kind: "success" });
          } else if (res.status === 410) {
            setState({ kind: "expired" });
          } else {
            setState({ kind: "error", message: "Failed to connect. Close this tab and try again from the plugin." });
          }
        } catch {
          setState({ kind: "error", message: "Network error. Check your connection and try again." });
        }
      } else {
        setState({ kind: "login", email: "", sending: false, sent: false, error: null });
      }
    };

    run();
  }, [sessionId, searchParams]);

  const handleSendLink = async () => {
    if (state.kind !== "login") return;
    const email = state.email.trim();
    if (!email) {
      setState({ ...state, error: "Enter your email address." });
      return;
    }

    setState({ ...state, sending: true, error: null });
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(`/plugin/auth?session=${sessionId}`)}` },
    });

    if (error) {
      setState({ ...state, sending: false, error: error.message });
    } else {
      setState({ ...state, sending: false, sent: true });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-4 text-center">
          <h1 className="text-lg font-semibold tracking-tight">Plary</h1>
          <p className="text-xs text-muted-foreground">Figma plugin connection</p>
        </div>

        {state.kind === "checking" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <LoaderCircle className="size-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Checking your session...</p>
          </div>
        )}

        {state.kind === "authorizing" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <LoaderCircle className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Connecting to plugin...</p>
          </div>
        )}

        {state.kind === "success" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle2 className="size-10 text-success-foreground" />
            <p className="text-sm font-medium">Connected!</p>
            <p className="text-xs text-muted-foreground text-center">
              You can close this tab and return to Figma.
            </p>
          </div>
        )}

        {state.kind === "login" && (
          <div className="flex flex-col gap-4 py-2">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <LogIn className="size-4" />
              <span>Sign in to Plary</span>
            </div>

            {state.sent ? (
              <div className="flex flex-col items-center gap-3 py-2">
                <CheckCircle2 className="size-8 text-success-foreground" />
                <p className="text-sm text-center">Check your email for a magic link.</p>
                <p className="text-xs text-muted-foreground text-center">
                  After clicking the link, you&apos;ll return here and the plugin will connect automatically.
                </p>
              </div>
            ) : (
              <>
                <AuthProviders
                  redirectTo={`${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback?redirect=${encodeURIComponent(`/plugin/auth?session=${sessionId}`)}`}
                />
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={state.email}
                    onChange={(e) => setState({ ...state, email: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && handleSendLink()}
                    autoFocus
                  />
                </div>
                {state.error && (
                  <p className="text-xs text-destructive">{state.error}</p>
                )}
                <Button onClick={handleSendLink} disabled={state.sending} className="w-full">
                  {state.sending ? "Sending..." : "Send magic link"}
                </Button>
              </>
            )}
          </div>
        )}

        {state.kind === "expired" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <AlertCircle className="size-10 text-warning-foreground" />
            <p className="text-sm font-medium">Session expired</p>
            <p className="text-xs text-muted-foreground text-center">
              Close this tab and click &quot;Login with Plary&quot; in the plugin again.
            </p>
          </div>
        )}

        {state.kind === "error" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <AlertCircle className="size-10 text-destructive" />
            <p className="text-sm font-medium">Something went wrong</p>
            <p className="text-xs text-muted-foreground text-center">{state.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PluginAuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-muted/30">
          <LoaderCircle className="size-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AuthFlow />
    </Suspense>
  );
}
