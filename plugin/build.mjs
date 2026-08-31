import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const API_BASE = process.env.PLARY_API_BASE || "http://localhost:3000";
const { version } = JSON.parse(readFileSync(join(__dirname, "package.json"), "utf-8"));

console.log(`[build] API_BASE=${API_BASE} VERSION=${version}`);

// Figma blocks requests to any domain missing from manifest allowedDomains, and it
// fails silently inside the plugin — catch the mismatch at build time instead.
if (!API_BASE.startsWith("http://localhost")) {
  const manifest = JSON.parse(readFileSync(join(__dirname, "manifest.json"), "utf-8"));
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

writeFileSync(join(__dirname, "code.js"), replaced, "utf-8");
