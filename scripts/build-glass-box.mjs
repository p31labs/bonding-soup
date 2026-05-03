#!/usr/bin/env node
/**
 * Mirror glass-box.html (and the public reports index it reads) into the
 * p31ca hub's public/ tree so https://p31ca.org/glass-box serves the same
 * page as the local demo. Skips silently if the hub tree is absent.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const HUB_PUBLIC = path.join(root, "andromeda", "04_SOFTWARE", "p31ca", "public");

if (!fs.existsSync(path.join(root, "glass-box.html"))) {
  console.error("build-glass-box: missing glass-box.html at repo root");
  process.exit(1);
}
if (!fs.existsSync(HUB_PUBLIC)) {
  console.log("build-glass-box: skip — andromeda/04_SOFTWARE/p31ca/public not present (partial clone)");
  process.exit(0);
}

/** @param {string} src @param {string} dst @param {string} label */
function mirror(src, dst, label) {
  if (!fs.existsSync(src)) return { wrote: false, missing: true, label };
  const txt = fs.readFileSync(src, "utf8");
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  const prev = fs.existsSync(dst) ? fs.readFileSync(dst, "utf8") : null;
  if (prev !== txt) { fs.writeFileSync(dst, txt, "utf8"); return { wrote: true, label }; }
  return { wrote: false, label };
}

const ops = [
  mirror(path.join(root, "glass-box.html"), path.join(HUB_PUBLIC, "glass-box.html"), "glass-box.html"),
  mirror(path.join(root, "glass-box-widget.html"), path.join(HUB_PUBLIC, "glass-box-widget.html"), "glass-box-widget.html"),
  mirror(path.join(root, "docs", "reports", "index.json"), path.join(HUB_PUBLIC, "reports", "index.json"), "reports/index.json"),
  mirror(path.join(root, "docs", "verify-pulse.json"), path.join(HUB_PUBLIC, "verify-pulse.json"), "verify-pulse.json"),
  mirror(path.join(root, "docs", "reports", "promoted", "index.json"), path.join(HUB_PUBLIC, "reports", "promoted", "index.json"), "reports/promoted/index.json"),
];

const summary = ops.map((o) => o.missing ? `(skip ${o.label})` : o.wrote ? `wrote ${o.label}` : `${o.label} unchanged`).join(" · ");
console.log("build-glass-box:", summary, "→ p31ca/public/");
