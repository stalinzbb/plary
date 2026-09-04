// Run: npx tsx lib/api/alert.test.ts
import assert from "node:assert";
import { alertFailOpen } from "./alert";

// The webhook URL is read per call, so setting it here is enough.
process.env.ALERT_WEBHOOK_URL = "http://127.0.0.1:9/hook";

let calls = 0;
globalThis.fetch = (async () => {
  calls++;
  return new Response("ok");
}) as typeof fetch;

// Two alerts for the same key inside the window => one webhook POST
alertFailOpen("token-version", "boom");
alertFailOpen("token-version", "boom again");
assert.equal(calls, 1);

// A different key has its own throttle
alertFailOpen("rate-limit:login", "boom");
assert.equal(calls, 2);

// With no webhook configured it logs only, and never throws
delete process.env.ALERT_WEBHOOK_URL;
alertFailOpen("session-create", "boom");
alertFailOpen("session-create", "boom");
assert.equal(calls, 2);

console.log("alert.test.ts: all assertions passed");
