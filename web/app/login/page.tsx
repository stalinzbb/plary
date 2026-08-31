"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/browser";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { MailCheck, ArrowLeft, Zap, Search, FolderOpen } from "lucide-react";
import { AuthProviders } from "@/components/auth-providers";

const highlights = [
  { icon: Zap, text: "Save any frame in one click from Figma" },
  { icon: Search, text: "Search your entire design history in seconds" },
  { icon: FolderOpen, text: "Organize with collections across every team" },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reason = params.get("reason");
    if (reason === "session_expired") {
      setError("Your session has expired. Please sign in again.");
    } else if (reason === "auth_error") {
      setError("There was a problem with the sign-in link. It may have expired. Please request a new one.");
    } else if (reason === "exchange_failed") {
      setError("The sign-in link could not be used. It may already have been used. Please request a new one.");
    } else if (reason === "missing_code") {
      setError("Invalid sign-in link. Please request a new one.");
    }
  }, []);

  const sendLink = async () => {
    setError(null);
    setSending(true);

    const supabase = createClient();
    const { error: sendError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    setSending(false);

    if (sendError) {
      setError(sendError.message);
    } else {
      setSent(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendLink();
  };

  const handleChangeEmail = () => {
    setSent(false);
    setError(null);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left — form */}
      <div className="flex flex-col px-6 py-8 sm:px-10">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Plary
        </Link>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <Image
            src="/plary-logo.svg"
            alt="Plary"
            width={36}
            height={36}
            className="dark:invert"
          />
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">
            {sent ? "Check your email" : "Sign in to Plary"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {sent
              ? "Click the link in your email to sign in. It expires in a few minutes."
              : "No password needed — we'll email you a magic link. New here? The same link creates your account."}
          </p>

          {sent ? (
            <div className="mt-8 rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <MailCheck className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">Magic link sent</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {email}
                  </p>
                </div>
              </div>
              <div className="mt-5 flex gap-2">
                <Button variant="outline" size="sm" onClick={handleChangeEmail}>
                  <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                  Change email
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={sendLink}
                  disabled={sending}
                >
                  {sending ? "Sending..." : "Resend link"}
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <AuthProviders redirectTo={`${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback`} />
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button type="submit" className="h-10 w-full" disabled={sending}>
                {sending ? "Sending..." : "Continue with email"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                By continuing you agree to our{" "}
                <Link
                  href="/privacy"
                  className="underline underline-offset-2 transition-colors hover:text-foreground"
                >
                  privacy policy
                </Link>
                .
              </p>
            </form>
          )}
        </div>
      </div>

      {/* Right — brand panel */}
      <div className="relative hidden overflow-hidden border-l border-border bg-muted/30 lg:flex lg:flex-col lg:justify-center lg:px-14">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-0 h-[480px] w-[480px] translate-x-1/4 -translate-y-1/4 rounded-full bg-[radial-gradient(closest-side,var(--color-primary),transparent)] opacity-[0.14] blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:48px_48px] opacity-30 [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,black,transparent)]" />
        </div>
        <div className="relative max-w-md">
          <h2 className="text-2xl font-semibold tracking-tight leading-snug">
            Your entire Figma history,
            <br />
            one search away.
          </h2>
          <ul className="mt-8 space-y-5">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-primary shadow-sm">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm text-foreground/85">{text}</span>
              </li>
            ))}
          </ul>
          <p className="mt-10 text-xs text-muted-foreground">
            Free while in beta · No credit card required
          </p>
        </div>
      </div>
    </div>
  );
}
