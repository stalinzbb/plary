import { Badge } from "@/components/ui/badge";
import { SiteNav, SiteFooter } from "@/components/marketing/site-chrome";

export const metadata = {
  title: "Changelog — Plary",
  description: "What's new in Plary — features, fixes, and improvements.",
};

type Entry = {
  date: string;
  tag: "New" | "Improved" | "Fixed" | "Security";
  title: string;
  items: string[];
};

const tagVariant = {
  New: "primary",
  Improved: "info",
  Fixed: "warning",
  Security: "success",
} as const;

const entries: Entry[] = [
  {
    date: "July 17, 2026",
    tag: "Security",
    title: "Instant token revocation and hardened APIs",
    items: [
      "Regenerating your plugin token in Settings now instantly revokes every previously issued token.",
      "Sign-in endpoints are rate-limited to keep abuse out.",
      "Closed an auth edge case and tightened input validation across the API after a full security audit.",
    ],
  },
  {
    date: "July 17, 2026",
    tag: "New",
    title: "A brand new website",
    items: [
      "Redesigned landing page, login, and a public privacy policy.",
      "Standardized design tokens and shared components across the whole app.",
    ],
  },
  {
    date: "July 10, 2026",
    tag: "Improved",
    title: "Community-ready Figma plugin",
    items: [
      "The plugin no longer relies on private Figma APIs — it's ready for the Figma Community.",
      "Files are now identified by smart name matching across your teams, with a paste-the-URL fallback.",
    ],
  },
  {
    date: "May 11, 2026",
    tag: "New",
    title: "One-click plugin sign-in",
    items: [
      "Connect the Figma plugin to your Plary account with a single click — no more copy-pasting tokens.",
      "Log out and switch accounts directly from the plugin.",
      "Fixed session handling so you stay signed in reliably on the web.",
    ],
  },
  {
    date: "April 2026",
    tag: "New",
    title: "Plary beta launch",
    items: [
      "Save any Figma frame or prototype in one click from the plugin.",
      "Browse, search, and filter your library on the web.",
      "Organize saves into collections, with live Figma embeds and dark mode.",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav />
      <main className="flex-1">
        <section className="mx-auto w-full max-w-3xl px-6 pt-16 sm:pt-24">
          <Badge variant="primary">Changelog</Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            What&apos;s new in Plary
          </h1>
          <p className="mt-4 text-muted-foreground">
            We ship in small, frequent releases. The highlights land here.
          </p>

          <div className="mt-14 space-y-0 border-l border-border pb-24">
            {entries.map((entry) => (
              <article
                key={entry.title}
                className="relative pb-14 pl-8 last:pb-0"
              >
                <span
                  aria-hidden
                  className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background"
                />
                <div className="flex flex-wrap items-center gap-3">
                  <time className="text-xs font-medium text-muted-foreground">
                    {entry.date}
                  </time>
                  <Badge variant={tagVariant[entry.tag]}>{entry.tag}</Badge>
                </div>
                <h2 className="mt-2 text-lg font-semibold tracking-tight">
                  {entry.title}
                </h2>
                <ul className="mt-3 space-y-2">
                  {entry.items.map((item) => (
                    <li
                      key={item}
                      className="text-sm leading-relaxed text-muted-foreground"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
