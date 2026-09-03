# Decisions

Major product and architecture decisions, newest first. Each entry: what was
decided, why, what it replaced, and what would make us revisit it. Agents and
contributors: read this before proposing changes to anything listed here.

Format: `## YYYY-MM-DD — Title` · Decision · Why · Rejected · Revisit when.

---

## 2026-09-02 — Private-plugin mode only; Community mode dropped

**Decision.** Every deployment (dev/reference, self-hosted, org) runs the plugin
with `enablePrivatePluginApi: true` and reads `figma.fileKey` directly. The
Community-mode file-key fallback (server name-match via `resolve-file`, team
registration, URL-paste) is removed.

**Why.** The fallback existed only because Community plugins can't read
`figma.fileKey`. Keeping both modes meant the dev deployment tested a code path
the org and self-hosters never used (the plugin-ID bug shipped that way). One
mode = dev is a faithful staging for everyone, and a few hundred lines less.

**Rejected.** Keeping Community publishing (reach) — the project's audience is
teams that self-host; a Community listing pointed at one hosted instance was
never the goal.

**Archived.** Tag `community-mode-last` + branch `archive/community-mode` on
`plary-dev`; tag `v1.0.8-community` on the public repo. Restore with
`git checkout community-mode-last -- <paths>`.

**Revisit when.** A Community listing becomes a distribution goal again.

## 2026-09-02 — Org-only behavior: flags upstream, secrets in the fork

**Decision.** Features an org wants but the reference deployment doesn't run go
**upstream behind an env-var flag** (server reads it; the plugin gets a
`features` object from the status endpoint). Only genuinely private code
(proprietary integrations) lives in the org fork, isolated in its own files.

**Why.** Keeps `plary-dg` at one config commit so upstream pulls never
conflict. Flagged code is public in the open-source repo — acceptable for
anything shareable.

**Rejected.** Feature branches in the fork — accumulate merge conflicts;
unreviewed auth changes reach the team first (see plary-dg#1, rerouted).

## 2026-09-01 — Three repos: dev (canonical) → public (snapshot) → org (fork)

**Decision.** `plary-dev` (private) is canonical; `plary` (public) receives
squashed tree exports, never direct merges; `plary-dg` (private) is a config
fork of `plary` that pulls upstream.

**Why.** `plary-dev` history contains a (revoked) leaked-secrets blob and must
never go public. Squashed exports give a clean public history.

**Rejected.** Making the public repo canonical now — deferred until a few
exports have gone smoothly (it removes the export chore; the private notes
would move to a separate place).

**Revisit when.** Direct edits to the public repo become frequent, or a second
org deployment appears (then build-time manifest generation beats forks).

## 2026-08-31 — Open source under MIT, self-hosting as the product story

**Decision.** MIT license; SELF_HOSTING.md is the primary onboarding doc;
best-effort support via GitHub issues.

**Why.** Adoption over control; single-maintainer support expectations set
explicitly.

## 2026-08-30 — Supabase keys: publishable/secret format; legacy JWT keys disabled

**Decision.** Switched to `sb_publishable_` / `sb_secret_` keys; legacy
anon/service_role JWT keys disabled after the git-history leak.

**Why.** Individually revocable without a JWT-secret rotation (no downtime);
kills the leaked pair for good.

## 2026-05 — No Row Level Security; app-layer auth via secret key

**Decision.** Server routes use the secret key; all authorization is in
application code. RLS is not enabled.

**Why.** Prototype speed. Documented loudly in README as a known trade-off.

**Revisit when.** Any deployment serves users who don't fully trust the
server, or as the first hardening step for an org instance (enabling RLS with
no policies is a free improvement — it denies the publishable key).

## 2026-05 — Plugin auth: browser-initiated polling, JWT in clientStorage

**Decision.** "Login with Plary" opens the browser; plugin polls a one-time
session; JWT (30d, versioned for revocation) stored in `figma.clientStorage`.

**Why.** No copy-pasting tokens; revocation via version bump.

**Rejected.** Paste-token only (kept as fallback).
