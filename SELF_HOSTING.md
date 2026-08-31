# Self-hosting Plary

Run Plary for yourself or your organization: your own database, your own web app,
your own Figma plugin. Everything is under your control except two Figma-side
requirements called out at the end.

Time budget for a first install: about an hour.

## What you'll set up

1. A Supabase project (database, auth, thumbnail storage) — free tier works
2. A Figma OAuth app (lets Plary read prototype metadata on each user's behalf)
3. The Next.js web app, run locally or deployed (Vercel or any Next.js host)
4. The Figma plugin, built against your deployment and imported in development mode

## 1. Database (Supabase)

> **No third-party cloud allowed?** Supabase is itself open source and
> [self-hostable](https://supabase.com/docs/guides/self-hosting) (Docker
> Compose). The entire Plary stack — database, auth, storage, web app — can run
> on your own infrastructure; the steps below are the same, with your own
> Supabase URL and keys. Plary is coupled to Supabase (auth, storage, client
> library), so other databases are not supported out of the box.

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor**, paste the entire contents of [`supabase/setup.sql`](supabase/setup.sql),
   and run it. It is idempotent and creates all tables, functions, and the public
   `thumbnails` storage bucket.
3. **Authentication → Sign In / Up**: make sure the Email provider is enabled
   (magic links are the default login).
4. **Authentication → URL Configuration → Redirect URLs**: add
   - `http://localhost:3000/**` (local development)
   - `https://<your-app-domain>/auth/callback` (once deployed)
5. From **Settings → API**, note three values for step 3: the project URL, the
   `anon` key, and the `service_role` key.

> **Security note:** Plary has no Row Level Security policies — access control is
> enforced by the server using the `service_role` key, which bypasses all database
> security. Keep that key server-side only, and treat any leak of it as a full
> database compromise.

**Optional — restrict signups to your email domain:** magic links auto-create an
account for any address. `setup.sql` ends with a commented-out trigger that
rejects signups outside an allowlist of domains; uncomment it and edit the domain
list to lock the app to your organization.

## 2. Figma OAuth app

Plary calls the Figma REST API on each user's behalf (prototype metadata,
identity verification). Your deployment needs its own OAuth app.

1. Sign in at [figma.com/developers/apps](https://www.figma.com/developers/apps).
   **Use an org-owned or admin account, not a personal one** — if the app owner
   leaves, the app and every user's Figma connection dies with their account.
2. **Create a new app**: name, logo.
3. Add OAuth redirect URIs:
   - `https://<your-app-domain>/api/figma/oauth/callback`
   - `http://localhost:3000/api/figma/oauth/callback` (if you'll run local dev)
4. Copy the **Client ID** and **Client Secret**. The secret may be shown only
   once — store both in a password manager.
5. **Publish the app** in the dev console. An unpublished app works only for its
   creator; every other user's connect flow fails at the callback.

Scopes are requested at authorization time (nothing to configure in the console):
`current_user:read`, `file_metadata:read`, `file_content:read`,
`project_metadata:read`.

## 3. Web app

```bash
cd web
cp .env.local.example .env.local
```

Fill in `.env.local` — the template documents where each value comes from. The
two generated secrets:

```bash
openssl rand -hex 32   # PLARY_TOKEN_SECRET
```

```bash
openssl rand -hex 32   # FIGMA_ENCRYPTION_KEY
```

Save both in a password manager. They must match between local dev and your
deployment when they share one database.

Run locally:

```bash
cd web && npm install && npm run dev
```

Open http://localhost:3000, sign in with a magic link, and connect Figma from
Settings to confirm the OAuth app works.

Deploy: any Next.js host works. On Vercel, set the root directory to `web/` and
add the same environment variables in the dashboard. After deploying, add the
production redirect URLs from steps 1.4 and 2.3.

Optional login customization:

- `NEXT_PUBLIC_AUTH_PROVIDERS=google,azure` renders SSO buttons on the login
  pages. Each listed provider must also be enabled in Supabase → Authentication
  → Providers.
- Custom SMTP (login emails from your domain), email templates, and SAML SSO
  (Supabase paid tier) are configured entirely in the Supabase dashboard.
- `NEXT_PUBLIC_SUPPORT_EMAIL` sets the contact address on the privacy page.

## 4. Plugin

Edit [`plugin/manifest.json`](plugin/manifest.json):

1. **Delete the `id` line.** It identifies the upstream published plugin; Figma
   assigns yours a new one.
2. Replace `networkAccess.allowedDomains` with your two URLs:
   ```json
   "allowedDomains": [
     "https://<your-app-domain>",
     "https://<your-project-ref>.supabase.co"
   ]
   ```
3. Add `"enablePrivatePluginApi": true`. Private/development plugins may read
   `figma.fileKey` directly, so your users skip the file-key workarounds
   (team registration, URL pasting) that the Community build needs.

Build from the repo root:

```bash
PLARY_API_BASE=https://<your-app-domain> npm run build
```

(The build fails with a clear error if `PLARY_API_BASE` isn't in your
`allowedDomains` — that's the manifest check saving you from silent network
failures inside Figma.)

Import in the **Figma desktop app**: any file → **Plugins → Development →
Import plugin from manifest…** → select `plugin/manifest.json`. Then run it,
click "Login with Plary", and save a frame end-to-end.

## 5. Distributing to your organization

A development-mode import only exists on machines where someone imported the
manifest. For org-wide rollout:

- **Figma Organization / Enterprise plans** can publish the plugin privately:
  **Plugins → Development → Manage plugins in development → Publish**, set
  visibility to **"Only your organization"**. Org-private plugins skip Figma's
  Community review and are available to members immediately from the in-file
  plugin browser. Published updates roll out automatically — no re-imports.
  `enablePrivatePluginApi` remains valid for org-private plugins.
- On Enterprise, admins may restrict who can publish plugins, and orgs running
  "approved plugins only" mode must approve the plugin in the Admin console
  before members can run it.
- **Starter / Professional plans** have no private publishing — each user
  imports the manifest manually (a one-time step per machine).

Optional CI: the `Plugin Build` workflow builds against the repository variable
`PLARY_API_BASE` — set it in your fork's GitHub settings (Settings → Secrets and
variables → Actions → Variables) to make CI build against your deployment. Delete
`.github/workflows/supabase-keepalive.yml` or repoint it at your own URL (it is
gated to the upstream repo and does nothing in forks by default).

## The two things Figma still controls

- Private org-wide plugin distribution requires a Figma Organization or
  Enterprise plan (development-mode imports are free but per-machine).
- Your OAuth app is subject to Figma's platform policies. Publishing it in the
  dev console is sufficient for org-internal use today, but that is Figma's
  call, not this project's.

## Troubleshooting

- **Plugin buttons do nothing / network errors in Figma**: your app or Supabase
  URL is missing from `manifest.json` `allowedDomains`. Fix, rebuild, re-import.
- **Figma connect fails at the callback**: the OAuth app isn't published, or the
  redirect URI doesn't exactly match `https://<your-app-domain>/api/figma/oauth/callback`.
- **Magic link lands on an error page**: the redirect URL isn't in Supabase
  Authentication → URL Configuration.
- **Thumbnails 404**: the `thumbnails` bucket is missing or not public — re-run
  `setup.sql`.
- **Plugin says logged out after switching between local and deployed builds**:
  both builds must share the same `PLARY_TOKEN_SECRET` (and database).
