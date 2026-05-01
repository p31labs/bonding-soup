#!/usr/bin/env node
/**
 * Validate docs/reports/promoted/index.json shape + that every entry's
 * referenced .md exists (drift guard).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const FILE = path.join(root, "docs", "reports", "promoted", "index.json");

function fail(m) { console.error("verify-reports-promoted-index:", m); process.exit(1); }

if (!fs.existsSync(FILE)) {
  console.log("verify-reports-promoted-index: skip — promoted/index.json not present (run npm run build:reports-promoted)");
  process.exit(0);
}
let j;
try { j = JSON.parse(fs.readFileSync(FILE, "utf8")); } catch (e) { fail("invalid JSON: " + e.message); }
if (j.schema !== "p31.reportsPromoted/0.1.0") fail(`schema must be p31.reportsPromoted/0.1.0 (got ${j.schema})`);
if (!Array.isArray(j.entries)) fail("entries[] required");
const seen = new Set();
for (const e of j.entries) {
  if (!e.id || !e.file) fail(`entry missing id/file: ${JSON.stringify(e)}`);
  if (seen.has(e.id)) fail(`duplicate id: ${e.id}`);
  seen.add(e.id);
  const abs = path.join(root, e.file.replace(/^\//, ""));
  if (!fs.existsSync(abs)) fail(`missing markdown: ${e.file}`);
}
console.log("verify-reports-promoted-index: OK —", j.count, "promoted reports");
