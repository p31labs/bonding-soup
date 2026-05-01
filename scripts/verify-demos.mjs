#!/usr/bin/env node
/**
 * Static gate for the public visual demos:
 *   - all four pages present
 *   - declared schema markers
 *   - no obvious operator secrets / private routes / token shapes
 *   - alignment-graph references p31-alignment.json
 *   - if mirrored into p31ca/public/demos/, mirrors byte-match
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const SRC_DIR = path.join(root, "demos");
const HUB_DIR = path.join(root, "andromeda", "04_SOFTWARE", "p31ca", "public", "demos");

function fail(m) { console.error("verify-demos:", m); process.exit(1); }
function note(m) { console.log("verify-demos:", m); }

const FILES = [
  { name: "index.html",            schema: "p31.demosIndex/0.1.0",        require: ["Share kit", "K₄ family mesh", "Alignment graph", "Larmor pulse", "Glass box"] },
  { name: "k4-mesh.html",          schema: "p31.k4MeshDemo/0.1.0",        require: ["K₄ family mesh", "tetrahedr", "auto-rotate"] },
  { name: "alignment-graph.html",  schema: "p31.alignmentGraphDemo/0.1.0", require: ["p31-alignment.json", "ephemeralization", "repulsion"] },
  { name: "larmor-pulse.html",     schema: "p31.larmorPulseDemo/0.1.0",   require: ["863", "Larmor", "p31-constants.json"] },
];

const FORBIDDEN = [
  /BEGIN PRIVATE KEY/i,
  /AKIA[0-9A-Z]{16}/,
  /AIza[0-9A-Za-z_\-]{35}/,
  /sk_live_[0-9a-zA-Z]{20,}/,
  /xox[baprs]-[A-Za-z0-9-]{10,}/,
  /ghp_[A-Za-z0-9]{30,}/,
  /CLOUDFLARE_API_TOKEN/i,
  /\.p31\/operator-shift/i,
  /\.p31\/launch-log/i,
];

if (!fs.existsSync(SRC_DIR)) fail("demos/ missing at repo root");

let totalBytes = 0;
for (const f of FILES) {
  const p = path.join(SRC_DIR, f.name);
  if (!fs.existsSync(p)) fail(`missing demos/${f.name}`);
  const txt = fs.readFileSync(p, "utf8");
  totalBytes += txt.length;
  if (!txt.includes(f.schema)) fail(`demos/${f.name} missing schema marker ${f.schema}`);
  for (const tok of f.require) if (!txt.includes(tok)) fail(`demos/${f.name} missing required token: ${tok}`);
  for (const re of FORBIDDEN) if (re.test(txt)) fail(`demos/${f.name} contains forbidden token: ${re}`);
  if (fs.existsSync(HUB_DIR)) {
    const dst = path.join(HUB_DIR, f.name);
    if (fs.existsSync(dst)) {
      const dstTxt = fs.readFileSync(dst, "utf8");
      if (dstTxt !== txt) fail(`p31ca/public/demos/${f.name} drifted — run npm run build:demos`);
    }
  }
}

// Captions doc must exist (not a render gate but a share-kit sanity check).
const caps = path.join(SRC_DIR, "SOCIAL-CAPTIONS.md");
if (!fs.existsSync(caps)) fail("demos/SOCIAL-CAPTIONS.md missing");

note(`OK — 4 demos · ${totalBytes.toLocaleString()} bytes total · share kit present`);
