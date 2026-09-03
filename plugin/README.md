# Plary Figma Plugin

The Plary plugin runs inside Figma and saves the currently selected frame, screen, or prototype starting point to your Plary library — capturing title, description, Figma URL, node metadata, kind (prototype/screen), collections, and a PNG thumbnail.

## Build

```bash
npm install
npm run build
```

The API base URL is injected at build time via the `PLARY_API_BASE` environment variable (defaults to `http://localhost:3000`):

```bash
PLARY_API_BASE=https://<your-deployed-url> npm run build
```

Self-hosting? `manifest.json` needs edits first (generate a new `id`, set `allowedDomains`) — see [SELF_HOSTING.md](../SELF_HOSTING.md).

Production builds happen automatically: `.github/workflows/build-plugin.yml` rebuilds `code.js` with the production API base (the `PLARY_API_BASE` repository variable) on every push to `main` and commits it back.

Use `npm run watch` for local development, then import via **Plugins → Development → Import plugin from manifest** in Figma.

## Auth

The plugin requires two things before saving is enabled:

1. **A Plary token** — click "Login with Plary" in the plugin; a browser opens to authorize and the plugin receives a JWT automatically (stored in `figma.clientStorage`). A "Paste token instead" fallback accepts a token copied from the web app Settings page.
2. **A Figma OAuth connection** — connect your Figma account in the Plary web app Settings. Saving is gated on a healthy connection, and the Figma desktop user must match the connected account.

Note: the plugin reads `figma.fileKey` directly and therefore requires `enablePrivatePluginApi: true` in `manifest.json` (development import or org-private publish — not Figma Community).

## Full docs

See the [root README](../README.md) for the complete architecture, API reference, and setup instructions.
