#!/usr/bin/env node
/**
 * BONDING home static HTML: viewport-fit + body.p31-mesh-m-first (cognitive-passport, docs, soup, spikes, etc.)
 * Idempotent. Inserts a viewport meta after charset if none exists (mobile-readable spikes).
 * Run: node scripts/apply-mesh-m-first-bonding-html.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(__dirname, "..");

const DIRS = [
  path.join(REPO, "cognitive-passport"),
  path.join(REPO, "docs", "physics-learn"),
  path.join(REPO, "docs", "doc-library"),
  path.join(REPO, "spikes"),
];

const EXTRA = ["soup.html", "poets-room.html", "p31-personal-howto.html"].map((f) => path.join(REPO, f));

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

/** @param {string} html */
function ensureHasViewportMeta(html) {
  if (/\bname=["']viewport["']/i.test(html)) return html;
  const v = '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />';
  if (/<meta\s+charset=/i.test(html)) {
    return html.replace(
      /(<meta\s+charset=["'][^"']*["']\s*\/?>)/i,
      (m) => `${m}\n  ${v}`,
    );
  }
  return html.replace(/<head(\s[^>]*)?>/i, (h) => `${h}\n  ${v}`);
}

/** @param {string} html */
function ensureViewportFit(html) {
  return html.replace(
    /(<meta\s+[^>]*\bname=["']viewport["'][^>]*\bcontent=)(["'])([^"']*)\2/gi,
    (full, pfx, q, content) => {
      if (/\bviewport-fit=cover\b/.test(String(content))) return full;
      const c = String(content).trim();
      if (!c) return full;
      return `${pfx}${q}${c}, viewport-fit=cover${q}`;
    },
  );
}

/** @param {string} html */
function ensureBodyClass(html) {
  if (/<body[^>]*\bp31-mesh-m-first\b/i.test(html)) return html;
  return html.replace(/<body(\s+[^>]*?)?\s*>/is, (match, inner) => {
    const s = (inner || "").trim();
    if (!s) return '<body class="p31-mesh-m-first">';
    const m = s.match(/\bclass=(["'])([^"']*)\1/i);
    if (m) {
      if (/\bp31-mesh-m-first\b/.test(m[2])) return match;
      const merged = `${m[2]} p31-mesh-m-first`.replace(/\s+/g, " ").trim();
      const next = s.replace(
        /\bclass=(["'])[^"']*\1/i,
        `class=${m[1]}${merged}${m[1]}`,
      );
      return `<body ${next}>`;
    }
    return `<body class="p31-mesh-m-first" ${s}>`;
  });
}

const files = new Set();
for (const d of DIRS) walkHtml(d, files);
for (const f of EXTRA) {
  if (fs.existsSync(f)) files.add(f);
}

let changed = 0;
let total = 0;
for (const file of files) {
  total += 1;
  const before = fs.readFileSync(file, "utf8");
  let after = before;
  after = ensureHasViewportMeta(after);
  after = ensureViewportFit(after);
  after = ensureBodyClass(after);
  if (after !== before) {
    fs.writeFileSync(file, after, "utf8");
    changed += 1;
    console.log("mesh-m-first:", path.relative(REPO, file));
  }
}
console.log(
  `apply-mesh-m-first-bonding-html: ${total} html, ${changed} updated`,
);
