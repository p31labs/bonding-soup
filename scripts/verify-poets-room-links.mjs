#!/usr/bin/env node
/**
 * Poets room lobby — relative href targets must exist under the home repo root.
 * Skips bare https? URLs (hub / external); allows local dev footers that are intentional.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const poetsPath = path.join(root, "poets-room.html");

/** href values we do not require on disk (local command center, external hub) */
const URL_ALLOWLIST = new Set(["http://127.0.0.1:3131/"]);

function die(msg) {
  console.error("verify-poets-room-links:", msg);
  process.exit(1);
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
}

main();
