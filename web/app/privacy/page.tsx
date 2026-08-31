import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Privacy Policy — Plary" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Plary
      </Link>

      <div className="mt-8 flex items-center gap-2.5">
        <Image src="/plary-logo.svg" alt="Plary" width={24} height={24} className="dark:invert" />
        <h1 className="text-xl font-semibold tracking-tight">Privacy Policy</h1>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: May 7, 2026</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed">
        <p>
          Plary is a personal design library tool. This policy explains what data
          the Plary Figma plugin and web application handle.
        </p>

        <section>
          <h2 className="text-sm font-medium">Data the plugin collects</h2>
          <p className="mt-2 text-muted-foreground">
            When you save a design from Figma using the Plary plugin:
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-muted-foreground">
            <li>
              <span className="text-foreground font-medium">Design metadata</span> — the
              selected node&apos;s name, type, and ID; the current Figma page name; and the
              Figma file key (if available).
            </li>
            <li>
              <span className="text-foreground font-medium">Figma URL</span> — the
              auto-detected or manually entered Figma URL for the selected design.
            </li>
            <li>
              <span className="text-foreground font-medium">Thumbnail</span> — a PNG export
              of the selected node at 2× scale.
            </li>
            <li>
              <span className="text-foreground font-medium">Your content</span> — the title,
              description, and collection names you enter.
            </li>
            <li>
              <span className="text-foreground font-medium">Authentication token</span> — a
              personal token generated in the Plary web app, stored locally in
              Figma&apos;s clientStorage.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-sm font-medium">Where data goes</h2>
          <p className="mt-2 text-muted-foreground">All data is sent exclusively to:</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-muted-foreground">
            <li>
              <span className="text-foreground font-medium">The Plary API server</span>{" "}
              (deployed on Vercel) — to create and update saved designs.
            </li>
            <li>
              <span className="text-foreground font-medium">Supabase Storage</span> — to
              upload thumbnail images. Thumbnails are stored in a publicly readable
              bucket — anyone with a thumbnail&apos;s exact URL can view the image, though
              URLs are not listed or shared anywhere.
            </li>
          </ul>
          <p className="mt-2 text-muted-foreground">
            No data is sent to analytics services, advertising networks, or
            third-party trackers.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-medium">Data stored</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-muted-foreground">
            <li>
              Your saved designs, thumbnails, and collection organization are stored in
              a Supabase Postgres database and Supabase Storage bucket.
            </li>
            <li>
              If you connect a Figma account, Plary stores your Figma account&apos;s email,
              display name, and avatar URL, plus your Figma OAuth access and refresh
              tokens. The tokens are encrypted at rest (AES-256-GCM).
            </li>
            <li>
              When you sign in to the web app, Plary records a session entry that
              includes your IP address and browser user agent. This is used for session
              management and new-login detection.
            </li>
            <li>
              You can delete any design or collection at any time from the Plary web
              app.
            </li>
            <li>
              Authentication is handled via Supabase Auth (magic link). No passwords are
              stored.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-sm font-medium">Data sharing</h2>
          <p className="mt-2 text-muted-foreground">
            Plary does not share your designs or personal data with any third party.
            Your designs are only visible to you.
          </p>
        </section>

        {process.env.NEXT_PUBLIC_SUPPORT_EMAIL && (
          <section>
            <h2 className="text-sm font-medium">Contact</h2>
            <p className="mt-2 text-muted-foreground">
              For questions about this policy:{" "}
              <a
                href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}`}
                className="text-foreground underline underline-offset-2"
              >
                {process.env.NEXT_PUBLIC_SUPPORT_EMAIL}
              </a>
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
