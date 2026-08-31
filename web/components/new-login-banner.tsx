"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface NewLoginBannerProps {
  detected: boolean;
}

export function NewLoginBanner({ detected }: NewLoginBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!detected || dismissed) return null;

  const handleDismiss = async () => {
    try {
      await fetch("/api/auth/session/notify", { method: "POST" });
    } catch {
      // Non-fatal — banner still dismisses locally
    }
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-warning-foreground/20 bg-warning p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning-foreground" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-warning-foreground">
            New login detected
          </p>
          <p className="mt-1 text-xs text-warning-foreground/80">
            A new sign-in was detected on your account. If this wasn&apos;t you,
            sign out and consider changing your email.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 rounded-md p-1 text-warning-foreground hover:bg-warning-foreground/10"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
