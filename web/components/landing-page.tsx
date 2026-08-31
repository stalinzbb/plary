import Link from "next/link";
import {
  ArrowRight,
  Zap,
  FolderOpen,
  Search,
  Eye,
  Shield,
  MousePointerClick,
  Save,
  Library,
  Layers,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SiteNav, SiteFooter } from "@/components/marketing/site-chrome";
import { cn } from "@/lib/utils";

/* ---------- content ---------- */

const steps = [
  {
    icon: MousePointerClick,
    step: "01",
    title: "Select a frame",
    description:
      "Pick any frame or prototype flow in Figma — the Plary plugin detects it automatically.",
  },
  {
    icon: Save,
    step: "02",
    title: "Hit save",
    description:
      "Title, link, and thumbnail are captured for you. Add a note or drop it into a collection.",
  },
  {
    icon: Library,
    step: "03",
    title: "Find it later",
    description:
      "Your whole design history in one searchable library — across every file and every team.",
  },
];

const features = [
  {
    icon: Zap,
    title: "One-click save from Figma",
    description:
      "Save the selected frame or prototype straight from the plugin. No exporting, no screenshots, no drag-and-drop into a folder you'll never open again.",
    large: true,
  },
  {
    icon: Search,
    title: "Search that actually finds things",
    description:
      "Search by title or description, filter by screens or prototypes. The design you vaguely remember from March is three keystrokes away.",
    large: true,
  },
  {
    icon: FolderOpen,
    title: "Collections",
    description:
      "Client work, inspiration, experiments — grouped and separate.",
  },
  {
    icon: Eye,
    title: "Live Figma embeds",
    description:
      "Open any save and see the live embed, right inside Plary.",
  },
  {
    icon: Shield,
    title: "Magic-link sign in",
    description: "No passwords to remember, leak, or reset.",
  },
  {
    icon: Layers,
    title: "Works across teams",
    description: "One library spanning every file and team you touch.",
  },
];

const faqs = [
  {
    q: "What exactly is Plary?",
    a: "Plary is a personal design library for Figma. A small plugin saves any frame or prototype in one click; the web app is where you browse, search, and organize everything you've saved.",
  },
  {
    q: "Do I need to install anything?",
    a: "Just the Plary plugin in Figma. The library itself lives in your browser — nothing to install on your machine.",
  },
  {
    q: "Does Plary copy my design files?",
    a: "No. Plary stores a reference — title, link, and thumbnail — and renders live Figma embeds. Your files stay in Figma, under Figma's permissions.",
  },
  {
    q: "What happens if a file is moved or renamed?",
    a: "Your save keeps working — it points at the Figma file itself, not a snapshot of its name or location.",
  },
  {
    q: "Is Plary free?",
    a: "Yes — Plary is completely free while in beta. No credit card, no trial clock.",
  },
  {
    q: "How do I sign in?",
    a: "With a magic link sent to your email. The same link creates your account the first time — there are no passwords anywhere in Plary.",
  },
  {
    q: "Can my team use it?",
    a: "Plary is personal-first today: your library is yours. Shared team libraries are on the roadmap — tell us if you need them and we'll bump the priority.",
  },
  {
    q: "What if I stop using it?",
    a: "Your designs never leave Figma, so there's nothing to export or migrate. Delete your account and your saved references are gone.",
  },
];

/* ---------- decorative product preview ---------- */

const previewCards = [
  { g: "from-primary/30 to-primary/5", w: "w-3/4", label: "Checkout flow v3" },
  { g: "from-info/60 to-info/10", w: "w-1/2", label: "Onboarding" },
  { g: "from-success/60 to-success/10", w: "w-2/3", label: "Dashboard" },
  { g: "from-warning/60 to-warning/10", w: "w-3/5", label: "Mobile nav" },
  { g: "from-muted-foreground/20 to-muted-foreground/5", w: "w-1/2", label: "Settings" },
  { g: "from-primary/15 to-info/25", w: "w-2/3", label: "Empty states" },
  { g: "from-info/40 to-success/15", w: "w-3/4", label: "Pricing page" },
  { g: "from-warning/40 to-primary/10", w: "w-1/2", label: "Email templates" },
];

function LibraryPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0px_2px_4px_rgba(16,17,26,0.04),0px_16px_32px_-8px_rgba(16,17,26,0.16)]">
      {/* window chrome */}
      <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20" />
        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20" />
        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20" />
        <div className="ml-4 flex h-6 max-w-sm flex-1 items-center gap-2 rounded-full bg-muted px-3">
          <Search className="h-3 w-3 text-muted-foreground/60" />
          <span className="text-[11px] text-muted-foreground/60">
            Search your library…
          </span>
        </div>
      </div>
      <div className="flex">
        {/* sidebar */}
        <div className="hidden w-40 shrink-0 border-r border-border p-4 sm:block">
          <div className="space-y-3">
            <div className="h-2 w-16 rounded-full bg-foreground/70" />
            <div className="h-2 w-20 rounded-full bg-muted-foreground/25" />
            <div className="h-2 w-14 rounded-full bg-muted-foreground/25" />
            <div className="h-2 w-18 rounded-full bg-muted-foreground/25" />
          </div>
          <div className="mt-6 h-2 w-12 rounded-full bg-muted-foreground/15" />
          <div className="mt-3 space-y-2.5">
            <div className="h-2 w-20 rounded-full bg-muted-foreground/25" />
            <div className="h-2 w-16 rounded-full bg-muted-foreground/25" />
          </div>
        </div>
        {/* grid */}
        <div className="flex-1 p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {previewCards.map(({ g, w, label }) => (
              <div key={label}>
                <div
                  className={cn(
                    "aspect-[4/3] rounded-lg bg-gradient-to-br ring-1 ring-inset ring-foreground/5",
                    g
                  )}
                />
                <div className="mt-2 text-[10px] font-medium text-foreground/70">
                  {label}
                </div>
                <div className={cn("mt-1 h-1.5 rounded-full bg-muted", w)} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- page ---------- */

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          {/* backdrop: radial glow + grid */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
          >
            <div className="absolute left-1/2 top-0 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,var(--color-primary),transparent)] opacity-[0.14] blur-3xl" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:56px_56px] opacity-[0.35] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
          </div>

          <div className="mx-auto max-w-6xl px-6 pt-20 text-center sm:pt-28">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
              <Link
                href="/changelog"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:text-foreground"
              >
                <Sparkles className="h-3 w-3 text-primary" />
                Now in beta — free while we build
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <h1 className="mx-auto mt-6 max-w-3xl animate-in fade-in slide-in-from-bottom-4 text-4xl font-semibold tracking-tight leading-[1.08] duration-700 fill-mode-both [animation-delay:100ms] sm:text-6xl">
              Every Figma design you&apos;ve ever made.{" "}
              <span className="bg-gradient-to-r from-primary via-info-foreground to-primary bg-clip-text text-transparent">
                One search away.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl animate-in fade-in slide-in-from-bottom-4 text-lg leading-relaxed text-muted-foreground duration-700 fill-mode-both [animation-delay:200ms]">
              Plary is your personal design library. Save any frame or
              prototype in one click from Figma — and find it months later in
              seconds, not scrolling sessions.
            </p>
            <div className="mt-9 flex animate-in fade-in slide-in-from-bottom-4 flex-col items-center justify-center gap-3 duration-700 fill-mode-both [animation-delay:300ms] sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-[0px_1px_2px_rgba(16,17,26,0.24),0px_8px_16px_-4px_rgba(16,17,26,0.24)] transition-all hover:bg-primary/90 hover:shadow-[0px_1px_2px_rgba(16,17,26,0.24),0px_12px_24px_-6px_rgba(16,17,26,0.3)]"
              >
                Start your library — free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center rounded-xl border border-border bg-card px-6 py-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
              >
                See how it works
              </a>
            </div>
            <p className="mt-4 animate-in fade-in text-xs text-muted-foreground duration-700 fill-mode-both [animation-delay:400ms]">
              Free during beta · No credit card · Magic-link sign in
            </p>

            {/* Product preview */}
            <div className="relative mx-auto mt-16 max-w-4xl animate-in fade-in slide-in-from-bottom-8 pb-8 duration-1000 fill-mode-both [animation-delay:300ms] sm:mt-20">
              <div
                aria-hidden
                className="absolute -inset-x-10 -top-10 bottom-0 -z-10 rounded-[2.5rem] bg-gradient-to-b from-primary/15 via-info/10 to-transparent blur-2xl"
              />
              <LibraryPreview />
            </div>
          </div>
        </section>

        {/* Problem → solution */}
        <section className="border-t border-border bg-muted/30">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 sm:py-24 lg:grid-cols-2 lg:gap-16">
            <div>
              <Badge variant="primary">The problem</Badge>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
                Your best work is buried in a hundred Figma files
              </h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                That onboarding flow you nailed last year? It&apos;s somewhere in
                a client file, three teams ago, on page 14, in a frame called
                &ldquo;Final_v2_REAL&rdquo;. Figma is where designs live —
                but it was never built to be your memory.
              </p>
            </div>
            <div>
              <Badge variant="success">The fix</Badge>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
                A library that remembers, so you don&apos;t have to
              </h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Save frames the moment they matter — one click, from inside
                Figma. Plary captures the title, link, and thumbnail, and files
                it into a searchable library that spans every file and team
                you&apos;ve ever worked in.
              </p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-20">
          <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
            <div className="text-center">
              <Badge variant="primary">How it works</Badge>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-4xl">
                Three steps. Ten seconds.
              </h2>
            </div>
            <div className="relative mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
              {/* connecting line */}
              <div
                aria-hidden
                className="absolute left-[16%] right-[16%] top-6 hidden border-t border-dashed border-border sm:block"
              />
              {steps.map(({ icon: Icon, step, title, description }) => (
                <div key={title} className="relative text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card text-primary shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="mt-4 text-xs font-medium tracking-widest text-primary">
                    {step}
                  </div>
                  <h3 className="mt-1 font-medium">{title}</h3>
                  <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features — bento */}
        <section id="features" className="scroll-mt-20 border-t border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
            <div className="text-center">
              <Badge variant="primary">Features</Badge>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-4xl">
                Built for how designers actually work
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
                No new workflow to learn. Plary sits inside the tools you
                already use and quietly builds your library as you go.
              </p>
            </div>
            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map(({ icon: Icon, title, description, large }) => (
                <div
                  key={title}
                  className={cn(
                    "rounded-2xl border border-border bg-card p-6 shadow-[0px_1px_2px_rgba(16,17,26,0.04)] transition-shadow hover:shadow-[0px_2px_4px_rgba(16,17,26,0.04),0px_8px_16px_-4px_rgba(16,17,26,0.08)]",
                    large && "sm:col-span-2 sm:p-8"
                  )}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <h3 className={cn("mt-4 font-medium", large && "text-lg")}>
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20">
          <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
            <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
              <div>
                <Badge variant="primary">FAQ</Badge>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
                  Questions, answered
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  Something else on your mind? Plary is in active development —
                  your questions shape what we build next.
                </p>
              </div>
              <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
                {faqs.map(({ q, a }) => (
                  <div key={q}>
                    <h3 className="text-sm font-medium">{q}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-16 text-center shadow-[0px_2px_4px_rgba(16,17,26,0.04),0px_24px_48px_-12px_rgba(16,17,26,0.12)] sm:py-20">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_-10%,var(--color-primary),transparent)] opacity-[0.12]"
            />
            <h2 className="relative text-2xl font-semibold tracking-tight sm:text-4xl">
              Stop losing your best work
            </h2>
            <p className="relative mx-auto mt-4 max-w-md text-muted-foreground">
              Your library starts with the next frame you save. Free while in
              beta — no credit card, no catch.
            </p>
            <Link
              href="/login"
              className="relative mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-[0px_1px_2px_rgba(16,17,26,0.24),0px_8px_16px_-4px_rgba(16,17,26,0.24)] transition-colors hover:bg-primary/90"
            >
              Start your library — free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
