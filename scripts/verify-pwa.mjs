#!/usr/bin/env node
/**
 * Static gate for the P31 PWA layer.
 * Verifies:
 *   - pwa/ source files present (sw.js, p31-pwa.js, icon, 4 manifests)
 *   - each manifest is valid JSON with required PWA fields
 *   - each PWA-installable surface declares manifest link + apple-touch-icon + theme-color + sw register hook
 *   - if mirrored into app folders (cognitive-passport, social-cards, demos),
 *     the per-app sw.js + p31-pwa.js byte-match the canonical source
 *   - if p31ca/public is present, /pwa/ mirror byte-matches
 *
 * Source of truth: pwa/. Build: npm run build:pwa.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const SRC = path.join(root, "pwa");
const HUB_PUBLIC = path.join(root, "andromeda", "04_SOFTWARE", "p31ca", "public");

function fail(m) { console.error("verify-pwa:", m); process.exit(1); }
function note(m) { console.log("verify-pwa:", m); }

if (!fs.existsSync(SRC)) fail("pwa/ source directory missing");

const SRC_FILES = [
  "sw.js",
  "p31-pwa.js",
  "p31-tetra-icon.svg",
  "manifest-cogpass.json",
  "manifest-social-cards.json",
  "manifest-same-shape.json",
  "manifest-the-pulse.json",
];

for (const f of SRC_FILES) {
  if (!fs.existsSync(path.join(SRC, f))) fail(`missing pwa/${f}`);
}

// Validate each manifest is valid JSON with required PWA fields
const REQUIRED_FIELDS = ["id", "name", "short_name", "description", "start_url", "scope", "display", "background_color", "theme_color", "icons"];
const MANIFESTS = [
  { file: "manifest-cogpass.json",       expectId: "p31.cogpass",      expectScope: "/cognitive-passport/" },
  { file: "manifest-social-cards.json",  expectId: "p31.socialCards",  expectScope: "/social-cards/" },
  { file: "manifest-same-shape.json",    expectId: "p31.sameShape",    expectScope: "/demos/" },
  { file: "manifest-the-pulse.json",     expectId: "p31.thePulse",     expectScope: "/demos/" },
];
for (const m of MANIFESTS) {
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(path.join(SRC, m.file), "utf8"));
  } catch (e) {
    fail(`pwa/${m.file} is not valid JSON: ${e.message}`);
  }
  for (const k of REQUIRED_FIELDS) {
    if (!(k in parsed)) fail(`pwa/${m.file} missing required field "${k}"`);
  }
  if (parsed.id !== m.expectId) fail(`pwa/${m.file} id mismatch — got "${parsed.id}", want "${m.expectId}"`);
  if (parsed.scope !== m.expectScope) fail(`pwa/${m.file} scope mismatch — got "${parsed.scope}", want "${m.expectScope}"`);
  if (!Array.isArray(parsed.icons) || parsed.icons.length === 0) fail(`pwa/${m.file} must declare at least one icon`);
  if (!parsed.icons.some((i) => i.src && i.src.endsWith(".svg"))) {
    fail(`pwa/${m.file} should reference the canonical pwa/p31-tetra-icon.svg`);
  }
  // Sanity: theme/background colors are valid hex
  if (!/^#[0-9a-fA-F]{6}$/.test(parsed.theme_color)) fail(`pwa/${m.file} theme_color invalid hex`);
  if (!/^#[0-9a-fA-F]{6}$/.test(parsed.background_color)) fail(`pwa/${m.file} background_color invalid hex`);
}

// Each surface that wants to be installable declares the contract
const SURFACES = [
  { html: "cognitive-passport/index.html", manifest: "/pwa/manifest-cogpass.json" },
  { html: "social-cards/index.html",        manifest: "/pwa/manifest-social-cards.json" },
  { html: "demos/the-same-shape.html",      manifest: "/pwa/manifest-same-shape.json" },
  { html: "demos/the-pulse.html",           manifest: "/pwa/manifest-the-pulse.json" },
];
const SURFACE_TOKENS = [
  "rel=\"manifest\"",
  "rel=\"apple-touch-icon\"",
  "name=\"theme-color\"",
  "p31-pwa.js",
];
for (const s of SURFACES) {
  const p = path.join(root, s.html);
  if (!fs.existsSync(p)) fail(`PWA surface missing: ${s.html}`);
  const txt = fs.readFileSync(p, "utf8");
  if (!txt.includes(s.manifest)) fail(`${s.html} does not link manifest ${s.manifest}`);
  for (const tok of SURFACE_TOKENS) {
    if (!txt.includes(tok)) fail(`${s.html} missing PWA contract token: ${tok}`);
  }
}

// Per-app sw.js + p31-pwa.js mirror (after build:pwa)
const APP_TARGETS = ["cognitive-passport", "social-cards", "demos"];
const FILES_TO_MIRROR = ["sw.js", "p31-pwa.js"];
let mirroredOk = 0, mirroredMissing = 0;
for (const app of APP_TARGETS) {
  const dir = path.join(root, app);
  if (!fs.existsSync(dir)) continue;
  for (const f of FILES_TO_MIRROR) {
    const dst = path.join(dir, f);
    if (!fs.existsSync(dst)) {
      mirroredMissing++;
      fail(`${app}/${f} not mirrored — run npm run build:pwa`);
    }
    const srcBuf = fs.readFileSync(path.join(SRC, f));
    const dstBuf = fs.readFileSync(dst);
    if (!srcBuf.equals(dstBuf)) fail(`${app}/${f} drifted from pwa/${f} — run npm run build:pwa`);
    mirroredOk++;
  }
}

// Hub mirror (optional; skip if absent)
if (fs.existsSync(HUB_PUBLIC)) {
  const HUB_PWA = path.join(HUB_PUBLIC, "pwa");
  if (!fs.existsSync(HUB_PWA)) fail("p31ca/public/pwa missing — run npm run build:pwa");
  for (const f of SRC_FILES) {
    const dst = path.join(HUB_PWA, f);
    if (!fs.existsSync(dst)) fail(`p31ca/public/pwa/${f} missing — run npm run build:pwa`);
    const srcBuf = fs.readFileSync(path.join(SRC, f));
    const dstBuf = fs.readFileSync(dst);
    if (!srcBuf.equals(dstBuf)) fail(`p31ca/public/pwa/${f} drifted — run npm run build:pwa`);
  }
}

note(`OK — ${SRC_FILES.length} pwa source files · ${MANIFESTS.length} manifests · ${SURFACES.length} installable surfaces · ${mirroredOk} per-app mirrors`);
