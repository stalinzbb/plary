import { execSync } from "child_process";
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const API_BASE = process.env.PLARY_API_BASE || "http://localhost:3000";
const { version } = JSON.parse(readFileSync(join(__dirname, "package.json"), "utf-8"));

// Variant build: any of these overrides the tracked manifest at build time and
// writes a complete plugin (manifest + code.js + ui.html) to plugin/dist/ instead
// of touching tracked files. Lets one repo build for several deployments
// (self-hosters, org instances) with no manifest edits.
//   PLARY_PLUGIN_ID, PLARY_PLUGIN_NAME, PLARY_SUPABASE_URL (+ PLARY_API_BASE)
const OVERRIDES = {
  id: process.env.PLARY_PLUGIN_ID,
  name: process.env.PLARY_PLUGIN_NAME,
  supabaseUrl: process.env.PLARY_SUPABASE_URL,
};
const VARIANT = Object.values(OVERRIDES).some(Boolean);
const manifest = JSON.parse(readFileSync(join(__dirname, "manifest.json"), "utf-8"));
if (VARIANT) {
  if (OVERRIDES.id) manifest.id = OVERRIDES.id;
  if (OVERRIDES.name) manifest.name = OVERRIDES.name;
  manifest.networkAccess.allowedDomains = [API_BASE, OVERRIDES.supabaseUrl].filter(Boolean)
    .map((u) => u.replace(/\/$/, ""));
  manifest.enablePrivatePluginApi = true;
}

console.log(`[build] API_BASE=${API_BASE} VERSION=${version}${VARIANT ? " (variant → dist/)" : ""}`);

// Figma blocks requests to any domain missing from manifest allowedDomains, and it
// fails silently inside the plugin — catch the mismatch at build time instead.
if (!API_BASE.startsWith("http://localhost")) {
  const allowed = manifest.networkAccess?.allowedDomains ?? [];
  if (!allowed.some((d) => API_BASE.startsWith(d.replace(/\/$/, "")))) {
    throw new Error(
      `build: PLARY_API_BASE=${API_BASE} is not in manifest.json networkAccess.allowedDomains ` +
        `(${JSON.stringify(allowed)}). Self-hosting? Edit manifest.json: replace allowedDomains ` +
        `with your app URL and your Supabase URL — see SELF_HOSTING.md.`,
    );
  }
}

// Compile normally using tsconfig.json
execSync("npx tsc -p tsconfig.json", { stdio: "inherit", cwd: __dirname });

// Inject API_BASE and VERSION into the compiled output
const code = readFileSync(join(__dirname, "code.js"), "utf-8");
const replaced = code
  .replace('"__PLARY_API_BASE__"', JSON.stringify(API_BASE))
  .replace('"__PLARY_VERSION__"', JSON.stringify(version));

// A silently un-replaced placeholder ships a plugin that can't reach the API
const leftover = replaced.match(/__PLARY_[A-Z_]+__/);
if (leftover) throw new Error(`build: placeholder ${leftover[0]} was not replaced`);

if (VARIANT) {
  const dist = join(__dirname, "dist");
  mkdirSync(dist, { recursive: true });
  writeFileSync(join(dist, "code.js"), replaced, "utf-8");
  writeFileSync(join(dist, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf-8");
  copyFileSync(join(__dirname, "ui.html"), join(dist, "ui.html"));
  // tsc already wrote the placeholder-bearing code.js in place — restore it from git
  execSync("git checkout -- code.js", { cwd: __dirname, stdio: "ignore" });
  console.log(`[build] wrote ${dist}/{manifest.json,code.js,ui.html} — import dist/manifest.json in Figma`);
} else {
  writeFileSync(join(__dirname, "code.js"), replaced, "utf-8");
}
