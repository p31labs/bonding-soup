#!/usr/bin/env node
/**
 * One-shot compliance sweep for p31ca Tailwind product pages.
 * Adds per-page: Gray Rock JS, OG meta, canonical, skip link, viewport-fit=cover, main#id.
 * Safe to re-run — idempotent (checks before inserting).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, "..", "andromeda", "04_SOFTWARE", "p31ca", "public");

if (!fs.existsSync(PUBLIC)) {
  console.error("fix-compliance: p31ca/public not found");
  process.exit(1);
}

const GRAY_ROCK = `<script>(function(){var r=document.documentElement;if(/[?&]alive=1(?:&|$)/.test(location.search))return;r.classList.add("p31-gray-rock");function wake(){r.classList.remove("p31-gray-rock")}document.addEventListener("pointerdown",wake,{once:true,capture:true});document.addEventListener("keydown",wake,{once:true,capture:true})})();</script>`;

const SKIP_LINK = `<a href="#main" style="position:absolute;left:-9999px;top:0;padding:0.5rem 1rem;background:var(--p31-void);color:var(--p31-teal);font-size:0.875rem;z-index:9999;border-radius:0 0 4px 4px;text-decoration:none" onfocus="this.style.left='0'" onblur="this.style.left='-9999px'">Skip to main content</a>`;

function escAttr(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function extractMeta(html, name) {
  const m = html.match(new RegExp(`<meta\\s+name="${name}"\\s+content="([^"]*)"`, "i"))
    || html.match(new RegExp(`<meta\\s+content="([^"]*)"\\s+name="${name}"`, "i"));
  return m ? m[1] : "";
}

function extractTitle(html) {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  return m ? m[1].replace(/\s+\|\s+P31 Labs.*$/, "").trim() : "";
}

let fixed = 0, skipped = 0;

const files = fs.readdirSync(PUBLIC).filter(f => f.endsWith(".html") && !f.includes("/"));

for (const file of files.sort()) {
  const filepath = path.join(PUBLIC, file);
  let html = fs.readFileSync(filepath, "utf8");
  let changed = false;

  // 1. Gray Rock JS — skip if already present
  if (!html.includes("p31-gray-rock")) {
    // Insert after <meta charset line
    html = html.replace(
      /(<meta\s+charset="[^"]*"[^>]*>)/i,
      `$1\n${GRAY_ROCK}`
    );
    changed = true;
  }

  // 2. viewport-fit=cover — add if viewport meta exists but lacks it
  if (html.includes('name="viewport"') && !html.includes("viewport-fit=cover")) {
    html = html.replace(
      /(<meta\s+name="viewport"\s+content="width=device-width,?\s*initial-scale=1(?:\.0)?)"(\s*\/>|>)/i,
      '$1, viewport-fit=cover"$2'
    );
    changed = true;
  }

  // 3. OG + Twitter meta — skip if og:type already present
  if (!html.includes("og:type")) {
    const title = escAttr(extractTitle(html));
    const desc = escAttr(extractMeta(html, "description") || title);
    const url = `https://p31ca.org/${file}`;
    const ogBlock = [
      `<meta property="og:type" content="website">`,
      `<meta property="og:title" content="${title}">`,
      `<meta property="og:description" content="${desc}">`,
      `<meta property="og:url" content="${url}">`,
      `<meta name="twitter:card" content="summary_large_image">`,
      `<meta name="twitter:title" content="${title}">`,
      `<meta name="twitter:description" content="${desc}">`,
    ].join("\n");

    // Insert after description meta, before preconnect, or before </head> as final fallback
    if (html.match(/<meta\s+name="description"/i)) {
      html = html.replace(
        /(<meta\s+name="description"[^>]*>)/i,
        `$1\n${ogBlock}`
      );
    } else if (html.match(/<link\s+rel="preconnect"/i)) {
      html = html.replace(/(<link\s+rel="preconnect")/, `${ogBlock}\n$1`);
    } else {
      html = html.replace(/<\/head>/i, `${ogBlock}\n</head>`);
    }
    changed = true;
  }

  // 4. Canonical — skip if already present
  if (!html.includes('rel="canonical"')) {
    const canonUrl = `https://p31ca.org/${file}`;
    const canonTag = `<link rel="canonical" href="${canonUrl}">`;
    // Insert after description meta, or before </head> as fallback
    if (html.match(/<meta\s+name="description"/i)) {
      html = html.replace(
        /(<meta\s+name="description"[^>]*>)/i,
        `$1\n${canonTag}`
      );
    } else {
      html = html.replace(/<\/head>/i, `${canonTag}\n</head>`);
    }
    changed = true;
  }

  // 5. Skip link — skip if already present
  if (!html.match(/skip.link|skip-link|p31-doc-skip|ag-skip|href="#main"|href="#hubs"/i)) {
    html = html.replace(
      /(<body[^>]*>)/,
      `$1\n${SKIP_LINK}`
    );
    changed = true;
  }

  // 6. Ensure <main> has id="main" — only if <main> exists without it
  if (html.includes("<main") && !html.match(/<main[^>]*\bid="main"/)) {
    html = html.replace(/<main(\s)/, '<main id="main"$1');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filepath, html);
    fixed++;
    console.log(`  ✅ ${file}`);
  } else {
    skipped++;
  }
}

console.log(`\nDone: ${fixed} fixed, ${skipped} already compliant.`);
