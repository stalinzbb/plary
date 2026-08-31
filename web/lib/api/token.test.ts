// Run: npx tsx lib/api/token.test.ts
import assert from "node:assert";
import { tokenVersionMatches } from "./token";

// Legacy token (no v) + no version row => both default to 1 => valid
assert.equal(tokenVersionMatches(undefined, undefined), true);
// Legacy token still valid before first revoke
assert.equal(tokenVersionMatches(undefined, 1), true);
// Matching versions => valid
assert.equal(tokenVersionMatches(2, 2), true);
// After a revoke bumped the DB to 2, a v1 (incl. legacy) token is rejected
assert.equal(tokenVersionMatches(1, 2), false);
assert.equal(tokenVersionMatches(undefined, 2), false);
// A stale higher claim never matches a lower current
assert.equal(tokenVersionMatches(3, 2), false);

console.log("token.test.ts: all assertions passed");
