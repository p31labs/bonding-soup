#!/usr/bin/env node
/**
 * Assert docs/doc-library/index.json exists, vendor UMD is present, and Minisearch
 * returns the same field config as the browser worker (smoke: ≥1 hit for a query).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import MiniSearch from "minisearch";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const p = path.join(root, "docs", "doc-library", "index.json");
const vend = path.join(root, "docs/doc-library/vendor/minisearch-6.3.0.umd.min.js");
if (!fs.existsSync(vend) || fs.statSync(vend).size < 8000) {
  console.error("verify-doc-index: missing or tiny vendor/minisearch-6.3.0.umd.min.js");
  process.exit(1);
}

if (!fs.existsSync(p)) {
  console.error("verify-doc-index: missing docs/doc-library/index.json — run npm run build:doc-index");
  process.exit(1);
}
const j = JSON.parse(fs.readFileSync(p, "utf8"));
if (j.schema !== "p31.docLibrary/1.0.0" || !Array.isArray(j.documents)) {
  console.error("verify-doc-index: bad schema or missing documents[]");
  process.exit(1);
}
if (j.count !== j.documents.length) {
  console.error("verify-doc-index: count !== documents.length");
  process.exit(1);
}
if (typeof j.fingerprint !== "string" || !/^[0-9a-f]{64}$/.test(j.fingerprint)) {
  console.error("verify-doc-index: missing or invalid fingerprint (expected sha256 hex)");
  process.exit(1);
}
if (j.count < 3) {
  console.error("verify-doc-index: too few documents (minimum 3)");
  process.exit(1);
}

const mini = new MiniSearch({
  idField: "id",
  fields: ["title", "text", "h2text", "path"],
  storeFields: ["title", "path", "preview", "h2"],
});
try {
  mini.addAll(j.documents);
} catch (e) {
  console.error("verify-doc-index: Minisearch addAll failed —", (e && e.message) || e);
  process.exit(1);
}
const smoke = mini.search("P31", {
  prefix: true,
  fuzzy: 0.2,
  boost: { title: 2.2, h2text: 1.4, path: 1.2, text: 1 },
});
if (smoke.length < 1) {
  console.error("verify-doc-index: minisearch smoke expected ≥1 hit for query P31");
  process.exit(1);
}

const workerPath = path.join(root, "docs/doc-library/doc-search-worker.js");
if (!fs.existsSync(workerPath) || fs.statSync(workerPath).size < 200) {
  console.error("verify-doc-index: doc-search-worker.js missing or empty");
  process.exit(1);
}

console.log("verify-doc-index: ok —", j.count, "documents, minisearch smoke", smoke.length, "hit(s), vendor+worker");
