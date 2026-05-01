#!/usr/bin/env node
/**
 * Mirror demos/* into the p31ca public tree at /demos/* and copy
 * p31-alignment.json so /demos/alignment-graph.html can read it via
 * a relative ./p31-alignment.json fetch on production. Skips if hub
 * tree is absent.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const SRC_DIR = path.join(root, "demos");
const HUB_PUBLIC = path.join(root, "andromeda", "04_SOFTWARE", "p31ca", "public");
const DST_DIR = path.join(HUB_PUBLIC, "demos");
const SRC_ALIGN = path.join(root, "p31-alignment.json");
const DST_ALIGN = path.join(DST_DIR, "p31-alignment.json");

if (!fs.existsSync(SRC_DIR)) { console.error("build-demos: missing demos/ at repo root"); process.exit(1); }
if (!fs.existsSync(HUB_PUBLIC)) { console.log("build-demos: skip — p31ca/public not present (partial clone)"); process.exit(0); }

fs.mkdirSync(DST_DIR, { recursive: true });

let wrote = 0, unchanged = 0;
for (const f of fs.readdirSync(SRC_DIR)) {
  const src = path.join(SRC_DIR, f);
  if (!fs.statSync(src).isFile()) continue;
  const dst = path.join(DST_DIR, f);
  const txt = fs.readFileSync(src);
  const prev = fs.existsSync(dst) ? fs.readFileSync(dst) : null;
  if (prev && prev.equals(txt)) { unchanged++; continue; }
  fs.writeFileSync(dst, txt);
  wrote++;
}

// Copy p31-alignment.json so /demos/ can fetch it relatively.
if (fs.existsSync(SRC_ALIGN)) {
  const txt = fs.readFileSync(SRC_ALIGN);
  const prev = fs.existsSync(DST_ALIGN) ? fs.readFileSync(DST_ALIGN) : null;
  if (!(prev && prev.equals(txt))) { fs.writeFileSync(DST_ALIGN, txt); wrote++; } else unchanged++;
}

console.log(`build-demos: wrote ${wrote} · unchanged ${unchanged} → ${path.relative(root, DST_DIR)}`);
