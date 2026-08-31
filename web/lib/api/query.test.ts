// Run: npx tsx lib/api/query.test.ts   (asserts throw on regression)
import assert from "node:assert";
import { escapeSearchTerm, isValidFigmaUrl } from "./query";

// escapeSearchTerm neutralizes PostgREST .or() structure + LIKE wildcards
assert.equal(escapeSearchTerm("hello"), "hello");
assert.equal(escapeSearchTerm("x),user_id.neq.0,(y").includes(")"), false);
assert.equal(escapeSearchTerm("x),user_id.neq.0,(y").includes("("), false);
assert.equal(escapeSearchTerm("50%_off"), "50\\%\\_off");

// isValidFigmaUrl accepts only https figma.com hosts
assert.equal(isValidFigmaUrl("https://www.figma.com/design/abc"), true);
assert.equal(isValidFigmaUrl("https://figma.com/proto/abc"), true);
assert.equal(isValidFigmaUrl("javascript:alert(1)"), false);
assert.equal(isValidFigmaUrl("http://figma.com/x"), false); // not https
assert.equal(isValidFigmaUrl("https://evil.com/figma.com"), false);
assert.equal(isValidFigmaUrl("https://notfigma.com"), false);
assert.equal(isValidFigmaUrl(null), false);

console.log("query.test.ts: all assertions passed");
