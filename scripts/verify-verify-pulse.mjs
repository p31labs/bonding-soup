#!/usr/bin/env node
/**
 * Validate docs/verify-pulse.json shape (committed heartbeat; metadata only).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const FILE = path.join(root, "docs", "verify-pulse.json");

function fail(m) { console.error("verify-verify-pulse:", m); process.exit(1); }

if (!fs.existsSync(FILE)) {
  console.log("verify-verify-pulse: skip — docs/verify-pulse.json not present (run npm run pulse to seed)");
  process.exit(0);
}
let j;
try { j = JSON.parse(fs.readFileSync(FILE, "utf8")); } catch (e) { fail("invalid JSON: " + e.message); }
if (j.schema !== "p31.verifyPulse/0.1.0") fail(`schema must be p31.verifyPulse/0.1.0 (got ${j.schema})`);
if (typeof j.limit !== "number" || j.limit < 1 || j.limit > 200) fail("limit must be 1..200");
if (!Array.isArray(j.history)) fail("history[] required");
if (j.history.length > j.limit) fail(`history exceeds limit (${j.history.length} > ${j.limit})`);
for (const [i, h] of j.history.entries()) {
  if (!h.ts || !h.git || typeof h.exit !== "number") fail(`history[${i}] missing ts/git/exit`);
  if (typeof h.durationMs !== "number" || typeof h.stepCount !== "number") fail(`history[${i}] missing durationMs/stepCount`);
}
console.log("verify-verify-pulse: OK —", j.count, "entries · last:", j.history[0]?.ts || "—", "·", j.history[0]?.git?.head || "—");
