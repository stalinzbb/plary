"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, KeyRound, User, ExternalLink, AlertTriangle, XCircle } from "lucide-react";

// Map known OAuth error codes to copy a user can act on; anything unknown
// falls through raw (with the console fallback for an empty detail).
// access_denied covers both "user declined" and "org policy blocked" —
// Figma doesn't distinguish them at the callback. (#46)
function figmaErrorMessage(detail: string | null): string {
  if (!detail) return "Connection failed, check the console.";
  if (detail === "access_denied") {
    return "Figma didn't grant access. If you're on a work account, your Figma organization may restrict third-party apps — ask a Figma admin to approve Plary, or connect a personal Figma account instead. (access_denied)";
  }
  if (/invalid.?scope/i.test(detail)) {
    return `Plary asked Figma for a permission its app registration doesn't include. This is a Plary configuration problem — nothing on your end. (${detail})`;
  }
  return detail;
}

export function SettingsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [regenerateConfirm, setRegenerateConfirm] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [figmaLoading, setFigmaLoading] = useState(true);
  const [figmaConnected, setFigmaConnected] = useState(false);
  const [figmaHealth, setFigmaHealth] = useState<string | null>(null);
  const [figmaDisplayName, setFigmaDisplayName] = useState<string | null>(null);
  const [figmaEmail, setFigmaEmail] = useState<string | null>(null);
  const [figmaAvatarUrl, setFigmaAvatarUrl] = useState<string | null>(null);
  const [figmaDisconnecting, setFigmaDisconnecting] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data } = await supabase.auth.getUser();
        setUserEmail(data.user?.email ?? null);
      } catch {
        setUserEmail(null);
      } finally {
        setProfileLoading(false);
      }
    }
    loadProfile();
  }, [supabase]);

  const fetchToken = useCallback(async () => {
    setTokenLoading(true);
    setRegenerateConfirm(false);
    try {
      const res = await fetch("/api/token");
      if (!res.ok) throw new Error("Failed to fetch token");
      const data = await res.json();
      setToken(data.token);
    } catch {
      setToken(null);
    } finally {
      setTokenLoading(false);
    }
  }, []);

  // Regenerate revokes every existing plugin token (POST bumps the version),
  // then returns a fresh one — the old token stops working immediately.
  const regenerateToken = useCallback(async () => {
    setTokenLoading(true);
    setRegenerateConfirm(false);
    try {
      const res = await fetch("/api/token", { method: "POST" });
      if (!res.ok) throw new Error("Failed to regenerate token");
      const data = await res.json();
      setToken(data.token);
    } catch {
      setToken(null);
    } finally {
      setTokenLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  const fetchFigmaStatus = useCallback(async () => {
    setFigmaLoading(true);
    try {
      const res = await fetch("/api/figma/oauth/status");
      if (res.ok) {
        const data = await res.json();
        setFigmaConnected(data.connected);
        setFigmaHealth(data.health ?? null);
        if (data.figma_user) {
          setFigmaDisplayName(data.figma_user.display_name);
          setFigmaEmail(data.figma_user.email);
          setFigmaAvatarUrl(data.figma_user.avatar_url);
        }
      }
    } catch {
      // Non-fatal
    } finally {
      setFigmaLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFigmaStatus();
  }, [fetchFigmaStatus]);

  const [figmaError, setFigmaError] = useState<string | null>(null);

  // Handle OAuth callback redirect params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const figma = params.get("figma");
    if (figma === "connected" || figma === "error" || figma === "expired") {
      if (figma === "error") {
        setFigmaError(figmaErrorMessage(params.get("detail")));
      }
      // Refresh status and clean URL
      fetchFigmaStatus();
      router.replace("/settings");
    }
  }, [fetchFigmaStatus, router]);

  const handleConnectFigma = () => {
    window.location.href = "/api/figma/oauth/start";
  };

  const handleDisconnectFigma = async () => {
    setFigmaDisconnecting(true);
    try {
      await fetch("/api/figma/oauth/disconnect", { method: "POST" });
      setFigmaConnected(false);
      setFigmaHealth(null);
      setFigmaDisplayName(null);
      setFigmaEmail(null);
      setFigmaAvatarUrl(null);
    } catch {
      // Non-fatal
    } finally {
      setFigmaDisconnecting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Even if the fetch fails, redirect to login
    }
    router.push("/login");
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Manage your profile, plugin token, and account."
      />

      <div className="mt-8 max-w-3xl space-y-6">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]">
          <h2 className="text-base font-semibold tracking-tight">Profile</h2>
          {profileLoading ? (
            <div className="mt-3 space-y-2">
              <Skeleton className="h-4 w-48 rounded" />
              <Skeleton className="h-3 w-32 rounded" />
            </div>
          ) : userEmail ? (
            <div className="mt-3 space-y-1">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{userEmail}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Signed in with magic link
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Unable to load profile.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]">
          <h2 className="text-base font-semibold tracking-tight">Plugin setup</h2>
          <ol className="mt-4 space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li>Install the Plary plugin in Figma (Plugins &rarr; Development &rarr; Import plugin from manifest).</li>
            <li>Copy the plugin token below.</li>
            <li>Open the plugin in Figma and paste the token when prompted.</li>
            <li>Select a frame or prototype in Figma and save it.</li>
          </ol>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]">
          <h2 className="text-base font-semibold tracking-tight">Plugin Token</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Paste this token into the Plary Figma plugin to connect it to your
            account.
          </p>
          {tokenLoading ? (
            <Skeleton className="mt-4 h-9 w-full rounded-lg" />
          ) : token === null ? (
            <div className="mt-4">
              <EmptyState
                icon={KeyRound}
                title="Could not load token"
                description="Try regenerating to create a new one."
                action={
                  <Button size="sm" onClick={fetchToken}>
                    Regenerate
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <code className="flex-1 rounded-lg bg-muted px-4 py-2.5 text-xs font-mono select-all break-all">
                  {token}
                </code>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="icon-sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(token);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  {regenerateConfirm ? (
                    <>
                      <Button size="sm" variant="destructive" onClick={regenerateToken}>
                        Confirm
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setRegenerateConfirm(false)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setRegenerateConfirm(true)}>
                      Regenerate
                    </Button>
                  )}
                </div>
              </div>
              {regenerateConfirm && (
                <p className="text-xs text-destructive">
                  This will generate a new token. You&apos;ll need to paste the new token in the Figma plugin.
                </p>
              )}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]">
          <h2 className="text-base font-semibold tracking-tight">Connected Accounts</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Connect your Figma account for enhanced features like automatic
            metadata enrichment and server-rendered thumbnails.
          </p>
          {figmaError && (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
              <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{figmaError}</span>
            </div>
          )}
          {figmaLoading ? (
            <Skeleton className="mt-4 h-12 w-full rounded-lg" />
          ) : figmaConnected ? (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                {figmaAvatarUrl && (
                  <img
                    src={figmaAvatarUrl}
                    alt=""
                    className="h-8 w-8 rounded-full"
                  />
                )}
                <div className="flex-1 min-w-0">
                  {figmaDisplayName && (
                    <p className="text-sm font-medium truncate">
                      {figmaDisplayName}
                    </p>
                  )}
                  {figmaEmail && (
                    <p className="text-xs text-muted-foreground truncate">
                      {figmaEmail}
                    </p>
                  )}
                </div>
                <Badge variant={figmaHealth === "connected" ? "success" : "warning"}>
                  {figmaHealth === "needs_reconnect" && (
                    <AlertTriangle className="mr-1 h-3 w-3" />
                  )}
                  {figmaHealth === "connected" ? "Connected" : "Reconnect needed"}
                </Badge>
              </div>
              <div className="flex gap-2">
                {(figmaHealth === "needs_reconnect") && (
                  <Button size="sm" variant="outline" onClick={handleConnectFigma}>
                    Reconnect
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive"
                  onClick={handleDisconnectFigma}
                  disabled={figmaDisconnecting}
                >
                  {figmaDisconnecting ? "Disconnecting..." : "Disconnect"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              <Button size="sm" onClick={handleConnectFigma}>
                <ExternalLink className="mr-1 h-3.5 w-3.5" />
                Connect Figma
              </Button>
              <p className="text-xs text-muted-foreground">
                On a work account? Your Figma organization may need an admin to
                approve Plary before connecting works.
              </p>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]">
          <h2 className="text-base font-semibold tracking-tight">Account</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">You are signed in.</p>
          <Button variant="outline" onClick={handleSignOut} className="mt-4">
            Sign out
          </Button>
        </section>
      </div>
    </div>
  );
}
