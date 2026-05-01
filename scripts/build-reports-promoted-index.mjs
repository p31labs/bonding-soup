#!/usr/bin/env node
/**
 * Scan docs/reports/promoted/ for *.md files (created by `npm run reports:promote`)
 * and write docs/reports/promoted/index.json (`p31.reportsPromoted/0.1.0`).
 *
 * Each entry: { id, file, ts, kind, severity, headline, bytes }.
 * The body (markdown) is NOT included — readers fetch the .md directly.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const DIR = path.join(root, "docs", "reports", "promoted");
const OUT = path.join(DIR, "index.json");

if (!fs.existsSync(DIR)) {
  fs.mkdirSync(DIR, { recursive: true });
}

function parseMd(filePath) {
  const txt = fs.readFileSync(filePath, "utf8");
  // Renderer outputs known shape; parse defensively.
  const idMatch = txt.match(/\*\*id:\*\*\s*`([^`]+)`/);
  const tsMatch = txt.match(/\*\*ts:\*\*\s*([0-9T:.\-Z]+)/);
  const kindMatch = txt.match(/\*\*kind:\*\*\s*`([^`]+)`/);
  const sevMatch = txt.match(/\*\*severity:\*\*\s*([A-Za-z]+)|\*\*roll-up:\*\*\s*([A-Za-z]+)/);
  const headlineMatch = txt.match(/^#\s+P31\s+\w+\s+report\s+—\s+(.+)$/m);
  return {
    id: idMatch?.[1] || path.basename(filePath, ".md"),
    file: "/" + path.relative(root, filePath).split(path.sep).join("/"),
    ts: tsMatch?.[1] || null,
    kind: kindMatch?.[1] || null,
    severity: (sevMatch?.[1] || sevMatch?.[2] || "info").toLowerCase(),
    headline: headlineMatch?.[1]?.trim() || path.basename(filePath, ".md"),
    bytes: fs.statSync(filePath).size,
  };
}

const files = fs.readdirSync(DIR)
  .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
  .sort();

const entries = files.map((f) => parseMd(path.join(DIR, f)))
  .sort((a, b) => (b.ts || "").localeCompare(a.ts || ""));

const index = {
  schema: "p31.reportsPromoted/0.1.0",
  version: "1.0.0",
  generatedAt: new Date().toISOString(),
  count: entries.length,
  entries,
};

fs.writeFileSync(OUT, JSON.stringify(index, null, 2) + "\n", "utf8");
console.log(`build-reports-promoted-index: ${entries.length} promoted reports → ${path.relative(root, OUT)}`);
