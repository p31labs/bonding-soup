#!/usr/bin/env node
/**
 * Static gate for the public Glass Box terminal:
 *  - glass-box.html exists at repo root
 *  - declares schema p31.glassBox/0.1.0
 *  - contains the SYNTHETIC + LIVE banners
 *  - no obvious operator secrets / private routes / tokens
 *  - terminal scripts include the four documented public surfaces
 *  - if mirrored into p31ca/public/, the mirror byte-matches the source
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const SRC = path.join(root, "glass-box.html");
const SRC_WIDGET = path.join(root, "glass-box-widget.html");
const HUB_DST = path.join(root, "andromeda", "04_SOFTWARE", "p31ca", "public", "glass-box.html");
const HUB_DST_WIDGET = path.join(root, "andromeda", "04_SOFTWARE", "p31ca", "public", "glass-box-widget.html");

function fail(m) { console.error("verify-glass-box:", m); process.exit(1); }
function note(m) { console.log("verify-glass-box:", m); }

if (!fs.existsSync(SRC)) fail("missing glass-box.html at repo root");
if (!fs.existsSync(SRC_WIDGET)) fail("missing glass-box-widget.html at repo root");
const html = fs.readFileSync(SRC, "utf8");
const widget = fs.readFileSync(SRC_WIDGET, "utf8");

const required = [
  "p31.glassBox/0.1.0",
  "SYNTHETIC: test playback",
  "LIVE: reports feed",
  "p31.glassBoxSnapshot/0.1.0",
  '"verify:alignment"',
  '"verify:contract-registry"',
  '"launch:audit"',
  '"reports:simulate:incident-day"',
  '"ecosystem:glass"',
  "no tracking · no analytics · no secrets",
  "verify-pulse.json",
  "promoted/index.json",
  "PULSE: ",
  "/demos/index.html",
];
for (const tok of required) {
  if (!html.includes(tok)) fail(`glass-box.html missing required token: ${tok}`);
}

// Widget required tokens (smaller surface).
for (const tok of [
  "P31 Glass Box",
  "verify-pulse.json",
  "reports/index.json",
  "no tracking · no analytics · no secrets",
  "/demos/index.html",
]) {
  if (!widget.includes(tok)) fail(`glass-box-widget.html missing required token: ${tok}`);
}

// Forbidden tokens — anything that smells like a secret leak.
const forbidden = [
  /BEGIN PRIVATE KEY/i,
  /AKIA[0-9A-Z]{16}/,             // AWS access key id
  /AIza[0-9A-Za-z_\-]{35}/,       // Google API key shape
  /sk_live_[0-9a-zA-Z]{20,}/,     // Stripe live secret
  /xox[baprs]-[A-Za-z0-9-]{10,}/, // Slack token
  /ghp_[A-Za-z0-9]{30,}/,         // GitHub PAT
  /CLOUDFLARE_API_TOKEN/i,
  /\.p31\/operator-shift/i,       // operator-local archive paths must not be embedded
  /\.p31\/launch-log/i,
];
for (const re of forbidden) {
  if (re.test(html)) fail(`glass-box.html contains forbidden token: ${re}`);
  if (re.test(widget)) fail(`glass-box-widget.html contains forbidden token: ${re}`);
}

// Mirror integrity: if the hub mirror exists, it must equal the source.
if (fs.existsSync(HUB_DST)) {
  const dst = fs.readFileSync(HUB_DST, "utf8");
  if (dst !== html) fail("p31ca/public/glass-box.html drifted — run npm run build:glass-box");
  note("mirror OK — p31ca/public/glass-box.html in sync");
}
if (fs.existsSync(HUB_DST_WIDGET)) {
  const dstW = fs.readFileSync(HUB_DST_WIDGET, "utf8");
  if (dstW !== widget) fail("p31ca/public/glass-box-widget.html drifted — run npm run build:glass-box");
  note("mirror OK — p31ca/public/glass-box-widget.html in sync");
}

note("OK — schema p31.glassBox/0.1.0 · main " + html.length + "b · widget " + widget.length + "b · no secret patterns");
