import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SiteNav, SiteFooter } from "@/components/marketing/site-chrome";

export const metadata = {
  title: "Pricing — Plary",
  description:
    "Plary is free while in beta. Save and search every Figma design you've ever made — no credit card required.",
};

// ponytail: placeholder Pro pricing — real numbers live in docs/CONTENT-NEEDED.md
const plans = [
  {
    name: "Beta",
    price: "$0",
    period: "while in beta",
    description:
      "Everything Plary does today. For designers building their library now.",
    cta: "Start your library",
    href: "/login",
    highlighted: true,
    badge: "Available now",
    features: [
      "Unlimited saved designs",
      "Unlimited collections",
      "Search across every file and team",
      "Live Figma embeds",
      "One-click save from the plugin",
      "Magic-link sign in — no passwords",
    ],
  },
  {
    name: "Pro",
    price: "$8",
    period: "per month, planned",
    description:
      "For designers who live in their library. Everything in Beta, plus what you ask for most.",
    cta: "Join the beta first",
    href: "/login",
    highlighted: false,
    badge: "Coming later",
    features: [
      "Everything in the free beta",
      "Shared team libraries",
      "Advanced search and tags",
      "Priority support",
      "Early access to new features",
    ],
  },
];

const faqs = [
  {
    q: "Is Plary really free right now?",
    a: "Yes. Everything Plary does today is free while we're in beta — no credit card, no trial countdown, no feature gates.",
  },
  {
    q: "What happens to my library when paid plans launch?",
    a: "Your library is yours. Beta users will keep a generous free tier, and we'll give plenty of notice before anything changes.",
  },
  {
    q: "Can I cancel anytime?",
    a: "There's nothing to cancel today. When Pro launches, it will be monthly with cancel-anytime — no lock-in.",
  },
  {
    q: "Do you store my design files?",
    a: "No. Plary stores references — title, link, thumbnail — and renders live Figma embeds. Your files stay in Figma.",
  },
  {
    q: "Is there a team plan?",
    a: "Shared team libraries are planned for Pro. If your team needs this, sign up and tell us — it directly shapes the roadmap.",
  },
  {
    q: "Do you offer discounts for students or educators?",
    a: "When paid plans launch, yes — education discounts are planned. During beta everyone pays the same: nothing.",
  },
];

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 pt-16 text-center sm:pt-24">
          <Badge variant="primary">Pricing</Badge>
          <h1 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
            Free while we build.
            <br className="hidden sm:block" /> Fair when we&apos;re done.
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-lg text-muted-foreground">
            Plary is in open beta — every feature, free, no credit card. Paid
            plans come later, and beta users get looked after.
          </p>
        </section>

        <section className="mx-auto mt-14 grid max-w-4xl gap-6 px-6 sm:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={
                plan.highlighted
                  ? "relative rounded-3xl border-2 border-primary bg-card p-8 shadow-[0px_2px_4px_rgba(16,17,26,0.04),0px_24px_48px_-12px_rgba(16,17,26,0.16)]"
                  : "relative rounded-3xl border border-border bg-card p-8 opacity-90"
              }
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{plan.name}</h2>
                <Badge variant={plan.highlighted ? "primary" : "neutral"}>
                  {plan.badge}
                </Badge>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-semibold tracking-tight">
                  {plan.price}
                </span>
                <span className="text-sm text-muted-foreground">
                  {plan.period}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {plan.description}
              </p>
              <Link
                href={plan.href}
                className={
                  plan.highlighted
                    ? "mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                    : "mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
                }
              >
                {plan.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <ul className="mt-7 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-foreground/90">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="mx-auto max-w-3xl px-6 py-20 sm:py-28">
          <h2 className="text-center text-2xl font-semibold tracking-tight">
            Pricing questions
          </h2>
          <div className="mt-10 space-y-8">
            {faqs.map(({ q, a }) => (
              <div key={q}>
                <h3 className="text-sm font-medium">{q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {a}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
