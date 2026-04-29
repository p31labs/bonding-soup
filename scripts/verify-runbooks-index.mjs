#!/usr/bin/env node
/**
 * Ensures docs/runbooks/README.md table links resolve to files on disk.
 *   npm run verify:runbooks
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const readme = path.join(root, "docs", "runbooks", "README.md");

function die(msg) {
  console.error("verify-runbooks-index:", msg);
  process.exit(1);
}

function main() {
  if (!fs.existsSync(readme)) die(`missing ${path.relative(root, readme)}`);
  const text = fs.readFileSync(readme, "utf8");
  /** @type {string[]} */
  const targets = [];
  const re = /\]\(\.\/([^)]+\.md)\)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    targets.push(m[1]);
  }
  if (targets.length === 0) die("no ./RUNBOOK-*.md links found in README table");
  const base = path.join(root, "docs", "runbooks");
  const missing = [];
  for (const rel of targets) {
    const abs = path.join(base, rel);
    if (!fs.existsSync(abs)) missing.push(path.relative(root, abs));
  }
  if (missing.length) {
    console.error("verify-runbooks-index: missing files:");
    for (const p of missing) console.error(" ", p);
    process.exit(1);
  }
  console.log("verify-runbooks-index: OK —", targets.length, "runbook links");
}

main();
