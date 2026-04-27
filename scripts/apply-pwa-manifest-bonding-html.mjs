#!/usr/bin/env node
/**
 * BONDING home static HTML: add relative <link rel="manifest" href=…> to p31-bonding.webmanifest (idempotent).
 * Run: node scripts/apply-pwa-manifest-bonding-html.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(__dirname, "..");
const MANIFEST = path.join(REPO, "p31-bonding.webmanifest");
const DIRS = [
  path.join(REPO, "cognitive-passport"),
  path.join(REPO, "docs", "physics-learn"),
  path.join(REPO, "docs", "doc-library"),
  path.join(REPO, "spikes"),
];
const EXTRA = [
  "soup.html",
  "poets-room.html",
  "p31-personal-howto.html",
  "fleet-portal.html",
].map((f) => path.join(REPO, f));

const SKIP_DIR = new Set(["node_modules", "dist", ".git"]);

function walkHtml(dir, out) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    if (name.isDirectory() && SKIP_DIR.has(name.name)) continue;
    const p = path.join(dir, name.name);
    if (name.isDirectory()) walkHtml(p, out);
    else if (name.name.endsWith(".html")) out.add(p);
  }
}

/** @param {string} html @param {string} href */
function ensureManifestLink(html, href) {
  if (/\brel=["']manifest["']/.test(html)) return html;
  const line = `  <link rel="manifest" href="${href}" crossorigin="anonymous" />\n`;
  const theme = html.match(/<meta[^>]*\bname=["']theme-color["'][^>]*\/?\s*>/i);
  if (theme) {
    return html.replace(theme[0], `${theme[0]}\n${line.trimEnd()}`);
  }
  const m = html.match(/<meta[^>]*\bcharset=[^>]*\/?\s*>/i);
  if (m) {
    return html.replace(m[0], `${m[0]}\n${line.trimEnd()}`);
  }
  const i = html.indexOf("<head");
  if (i === -1) return html;
  const j = html.indexOf(">", i);
  if (j === -1) return html;
  return html.slice(0, j + 1) + "\n" + line + html.slice(j + 1);
}

/** @param {string} html */
function ensureAppleCapable(html) {
  if (/name=["']apple-mobile-web-app-capable["']/i.test(html)) return html;
  const line = `  <meta name="apple-mobile-web-app-capable" content="yes" />\n`;
  const theme = html.match(/<meta[^>]*\bname=["']theme-color["'][^>]*\/?\s*>/i);
  if (theme) return html.replace(theme[0], `${theme[0]}\n${line.trimEnd()}`);
  return ensureAfterCharset(html, line);
}

/** @param {string} html */
function ensureAppleTitle(html) {
  if (/name=["']apple-mobile-web-app-title["']/i.test(html)) return html;
  const line = `  <meta name="apple-mobile-web-app-title" content="P31 home" />\n`;
  const cap = html.match(
    /<meta[^>]*\bname=["']apple-mobile-web-app-capable["'][^>]*\/?\s*>/i,
  );
  if (cap) return html.replace(cap[0], `${cap[0]}\n${line.trimEnd()}`);
  const theme = html.match(/<meta[^>]*\bname=["']theme-color["'][^>]*\/?\s*>/i);
  if (theme) return html.replace(theme[0], `${theme[0]}\n${line.trimEnd()}`);
  return ensureAfterCharset(html, line);
}

/** @param {string} html @param {string} line */
function ensureAfterCharset(html, line) {
  const m = html.match(/<meta[^>]*\bcharset=[^>]*\/?\s*>/i);
  if (m) return html.replace(m[0], `${m[0]}\n${line.trimEnd()}`);
  return html;
}

/** @param {string} html @param {string} href */
function ensureAppleTouchIcon(html, href) {
  if (/\brel=["']apple-touch-icon["']/.test(html)) return html;
  const line = `  <link rel="apple-touch-icon" href="${href}" />\n`;
  const man = html.match(/<link[^>]*\brel=["']manifest["'][^>]*>/i);
  if (man) return html.replace(man[0], `${man[0]}\n${line.trimEnd()}`);
  const theme = html.match(/<meta[^>]*\bname=["']theme-color["'][^>]*\/?\s*>/i);
  if (theme) return html.replace(theme[0], `${theme[0]}\n${line.trimEnd()}`);
  return ensureAfterCharset(html, line);
}

/**
 * @param {string} html
 * @param {{ manifestHref: string, iconHref: string }} p
 */
function patchHtml(html, p) {
  let out = html;
  out = ensureManifestLink(out, p.manifestHref);
  out = ensureAppleCapable(out);
  out = ensureAppleTitle(out);
  out = ensureAppleTouchIcon(out, p.iconHref);
  return out;
}

const files = new Set();
if (fs.existsSync(MANIFEST)) {
  for (const d of DIRS) walkHtml(d, files);
  for (const f of EXTRA) {
    if (fs.existsSync(f)) files.add(f);
  }
}

let changed = 0;
let total = 0;
const ICON_FILE = path.join(REPO, "p31-bonding-icons", "p31-icon.svg");

for (const file of files) {
  total += 1;
  const manifestHref = path
    .relative(path.dirname(file), MANIFEST)
    .replace(/\\/g, "/");
  const iconHref = path
    .relative(path.dirname(file), ICON_FILE)
    .replace(/\\/g, "/");
  const before = fs.readFileSync(file, "utf8");
  const after = patchHtml(before, { manifestHref, iconHref });
  if (after !== before) {
    fs.writeFileSync(file, after, "utf8");
    changed += 1;
    console.log("pwa-bonding:", path.relative(REPO, file), "→", manifestHref);
  }
}
console.log(
  `apply-pwa-manifest-bonding-html: ${total} html, ${changed} updated`,
);
