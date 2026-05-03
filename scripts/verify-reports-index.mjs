#!/usr/bin/env node
/**
 * Validate docs/reports/index.json shape (committed metadata; no body).
 * Run after npm run reports:index.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const FILE = path.join(root, "docs", "reports", "index.json");

function fail(m) { console.error("verify-reports-index:", m); process.exit(1); }

if (!fs.existsSync(FILE)) {
  console.log("verify-reports-index: skip — no docs/reports/index.json (run npm run reports:index)");
  process.exit(0);
}
let j;
try { j = JSON.parse(fs.readFileSync(FILE, "utf8")); } catch (e) { fail("invalid JSON: " + e.message); }
if (j.schema !== "p31.reportsIndex/0.1.0") fail(`schema must be p31.reportsIndex/0.1.0 (got ${j.schema})`);
if (typeof j.count !== "number") fail("count required");
if (!Array.isArray(j.recent)) fail("recent[] required");

const seen = new Set();
const allowedKinds = new Set(["morning", "midday", "evening", "urgent", "weekly", "custom", "psych-e2e"]);
for (const r of j.recent) {
  if (!r.id || !r.kind || !r.ts) fail(`recent row missing id/kind/ts: ${JSON.stringify(r)}`);
  if (!allowedKinds.has(r.kind)) fail(`recent row bad kind: ${r.kind}`);
  if (seen.has(r.id)) fail(`duplicate id: ${r.id}`);
  seen.add(r.id);
  if (typeof r.headline !== "string") fail(`row ${r.id} headline must be string`);
}
console.log("verify-reports-index: OK —", j.count, "reports indexed (", j.recent.length, "in recent[])");
