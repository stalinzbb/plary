# Contributing to Plary

Thanks for your interest. Plary is a small, deliberately simple codebase — the
best contributions keep it that way.

## Getting a dev environment

Follow [SELF_HOSTING.md](SELF_HOSTING.md) — it is the canonical setup guide
(your own Supabase project, Figma OAuth app, and local dev server). Short
version once configured:

```bash
cd web && npm install && npm run dev     # web app on :3000
npm run build                            # plugin (from repo root, uses localhost API)
```

## Making changes

- Branch from `main`, open a PR against `main`.
- Keep diffs small and focused; match the surrounding code style.
- The manual testing checklist in the README is the acceptance bar — run the
  parts your change touches.

## Keep the docs in sync — update checklist

When your change touches one of these areas, the listed files must change in
the same PR. Reviewers will ask.

| If you change… | Also update… |
| --- | --- |
| Database schema | Add a new file in `supabase/migrations/` **and** fold the same change into `supabase/setup.sql` (fresh installs run only setup.sql) **and** the Data Model section in `README.md` |
| Environment variables (add/rename/remove) | `web/.env.local.example`, the Environment Variables table in `README.md`, and `SELF_HOSTING.md` step 3 |
| API routes | The API route tables in `README.md` |
| Plugin ↔ UI message types | The message-type table in `README.md` |
| Auth flows (web login, plugin auth, Figma OAuth) | The Auth Model section in `README.md` and `SELF_HOSTING.md` |
| `plugin/manifest.json` requirements for forks | `SELF_HOSTING.md` step 4 |
| Setup steps or their order | `SELF_HOSTING.md` (and its Troubleshooting section if a new failure mode exists) |

Do **not** commit `plugin/code.js` — CI rebuilds and commits it on pushes to
`main` (see `.github/workflows/build-plugin.yml`).

## Good first contributions

- **Row Level Security policies** — the app currently relies entirely on
  app-layer access control via the service-role key (see the README security
  note). A defense-in-depth RLS policy set is the most valuable open item.
- **Database-agnostic backend** — the app is coupled to Supabase (auth,
  storage, client). An abstraction layer is a large but well-scoped project.
- Troubleshooting additions to `SELF_HOSTING.md` from your own install
  experience.

## Reporting issues

Use the issue templates. For self-hosting problems, the Self-hosting help
template asks for the details that make your issue answerable in one round.
