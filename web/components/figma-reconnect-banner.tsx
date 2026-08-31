"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// Shown on every app page when the Figma connection can't do what the
// product needs (stale scopes or undecryptable tokens) — otherwise users
// only find out when a save quietly stops auto-detecting. (#49)
export function FigmaReconnectBanner() {
  const [stale, setStale] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/figma/oauth/status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.connected && data.health === "needs_reconnect") setStale(true);
      })
      .catch(() => {
        // Non-fatal — no banner
      });
  }, []);

  // Settings already shows the badge and Reconnect button
  if (!stale || dismissed || pathname === "/settings") return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-warning-foreground/20 bg-warning p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning-foreground" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-warning-foreground">
            Reconnect your Figma account
          </p>
          <p className="mt-1 text-xs text-warning-foreground/80">
            Plary&apos;s Figma permissions changed, so your connection needs a
            one-time refresh. Until then, auto-detected links and metadata
            won&apos;t work.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={() => router.push("/settings")}
          >
            Reconnect in Settings
          </Button>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-md p-1 text-warning-foreground hover:bg-warning-foreground/10"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
