// Fail-open protections (token revocation check, rate limiter, web session
// tracking) keep working when the DB blips, but nobody should find out by
// accident. Every such path calls this: a searchable console line, plus an
// optional webhook so an outage is a page, not a log entry.
// Edge-safe on purpose — session.ts is imported by middleware.ts.
// ponytail: fire-and-forget fetch; if drops are observed on Vercel, wrap in
// next/server `after()`. Swap for a real error tracker when one exists.
const lastSent = new Map<string, number>();
const MIN_INTERVAL_MS = 60_000; // per-instance throttle so a 2s poll loop can't spam

export function alertFailOpen(where: string, detail: string): void {
  console.error(`[FAIL-OPEN] ${where}: ${detail}`);
  const url = process.env.ALERT_WEBHOOK_URL;
  if (!url) return;
  const now = Date.now();
  if (now - (lastSent.get(where) ?? 0) < MIN_INTERVAL_MS) return;
  lastSent.set(where, now);
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: `Plary fail-open — ${where}: ${detail}` }),
  }).catch(() => {});
}
