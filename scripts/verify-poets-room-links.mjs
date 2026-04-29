#!/usr/bin/env node
/**
 * Poets Room — relative href targets in poets-room.html must exist.
 * Skips bare https? URLs (hub / external); allows local dev footers that are intentional.
 * Validates poets-room-quotes.json shape only (not prose); container, not content.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const poetsPath = path.join(root, "poets-room.html");
const quotesPath = path.join(root, "poets-room-quotes.json");

/** href values we do not require on disk (local command center, external hub) */
const URL_ALLOWLIST = new Set(["http://127.0.0.1:3131/"]);

function die(msg) {
  console.error("verify-poets-room-links:", msg);
  process.exit(1);
}

function verifyQuotesFile() {
  if (!fs.existsSync(quotesPath)) die("missing poets-room-quotes.json");
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(quotesPath, "utf8"));
  } catch (e) {
    die(`poets-room-quotes.json: invalid JSON (${String(e)})`);
  }
  const quotes = raw && raw.quotes;
  if (!Array.isArray(quotes) || quotes.length < 5) {
    die("poets-room-quotes.json: expected quotes[] with at least 5 entries");
  }
  for (let i = 0; i < quotes.length; i++) {
    const q = quotes[i];
    if (!q || typeof q.text !== "string" || !q.text.trim()) {
      die(`poets-room-quotes.json: quotes[${i}] missing non-empty text`);
    }
    if (typeof q.attribution !== "string" || !q.attribution.trim()) {
      die(`poets-room-quotes.json: quotes[${i}] missing non-empty attribution`);
    }
  }
  console.log(`verify-poets-room-links: quotes OK (${quotes.length} entries, schema not linted)`);
}

function main() {
  if (!fs.existsSync(poetsPath)) die("missing poets-room.html");
  const html = fs.readFileSync(poetsPath, "utf8");
  const hrefRe = /href=["']([^"']+)["']/g;
  let m;
  const missing = [];
  while ((m = hrefRe.exec(html)) !== null) {
    const href = m[1].trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:")) continue;
    if (href.startsWith("http://") || href.startsWith("https://")) {
      if (URL_ALLOWLIST.has(href)) continue;
      continue;
    }
    const resolved = path.normalize(path.join(root, href));
    if (!resolved.startsWith(root)) die(`suspicious href outside repo: ${href}`);
    if (!fs.existsSync(resolved)) missing.push({ href, resolved });
  }
  if (missing.length) {
    for (const { href, resolved } of missing) {
      console.error(`  missing: ${href} → ${resolved}`);
    }
    die(`${missing.length} relative link(s) broken in poets-room.html`);
  }
  console.log("verify-poets-room-links: OK — relative targets exist");
  verifyQuotesFile();
}

main();
