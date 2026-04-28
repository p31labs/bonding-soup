#!/usr/bin/env node
/**
 * P31 home → p31ca public doc-library mirror (Phase 3 in PLAN-DOCUMENT-LIBRARY).
 * 1) npm run build:doc-index
 * 2) Copy index.json, app.js, doc-search-worker.js, vendor/
 * 3) Emit index.html from home template with <base> + /p31-style.css + p31ca-safe footer links
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const p31ca = path.join(root, "andromeda", "04_SOFTWARE", "p31ca");
const out = path.join(p31ca, "public", "doc-library");
const homeIndex = path.join(root, "docs", "doc-library", "index.html");
const org = "p31labs";
const repo = "bonding-soup";
const githubBlob = (p) => `https://github.com/${org}/${repo}/blob/main/${p.replace(/^\/+/, "")}`;

if (!fs.existsSync(p31ca)) {
  console.error("sync-doc-library-p31ca: missing p31ca tree; skip (partial clone).");
  process.exit(0);
}

async function main() {
  console.log("sync-doc-library-p31ca: build:doc-index …");
  execSync("npm run build:doc-index", { cwd: root, stdio: "inherit" });
  await fsp.mkdir(out, { recursive: true });

  const copy = (rel) => {
    const from = path.join(root, "docs", "doc-library", rel);
    const to = path.join(out, rel);
    if (!fs.existsSync(from)) {
      throw new Error("missing " + from);
    }
    fs.copyFileSync(from, to);
  };

  copy("index.json");
  copy("app.js");
  copy("doc-search-worker.js");
  const vendor = path.join(root, "docs", "doc-library", "vendor");
  const outVendor = path.join(out, "vendor");
  await fsp.mkdir(outVendor, { recursive: true });
  for (const n of await fsp.readdir(vendor)) {
    fs.copyFileSync(path.join(vendor, n), path.join(outVendor, n));
  }

  /** Minimal home assets so /doc-library/ resolves under p31ca dist (verify-internal-hub-links). */
  const copyIntoPublic = async (fromRel, toRel) => {
    const from = path.join(root, fromRel);
    const to = path.join(p31ca, "public", toRel);
    if (!fs.existsSync(from)) {
      throw new Error(`sync-doc-library-p31ca: missing ${fromRel}`);
    }
    await fsp.mkdir(path.dirname(to), { recursive: true });
    await fsp.copyFile(from, to);
  };
  await copyIntoPublic("p31-bonding.webmanifest", "p31-bonding.webmanifest");
  await copyIntoPublic("p31-bonding-icons/p31-icon.svg", "p31-bonding-icons/p31-icon.svg");
  await copyIntoPublic(
    "cognitive-passport/p31-responsive-surface.css",
    "cognitive-passport/p31-responsive-surface.css"
  );
  await copyIntoPublic(
    "cognitive-passport/lib/p31-subject-prefs.js",
    "cognitive-passport/lib/p31-subject-prefs.js"
  );

  let html = await fsp.readFile(homeIndex, "utf8");
  if (html.includes('<base ')) {
    throw new Error("home doc-library index already has <base>; re-read template");
  }
  html = html.replace("<head>", '<head>\n  <base href="/doc-library/" />');
  html = html.replace(
    'href="../../cognitive-passport/p31-style.css"',
    'href="/p31-style.css"'
  );
  html = html.replace(
    'href="../../p31-bonding.webmanifest"',
    'href="/p31-bonding.webmanifest"'
  );
  html = html.replace(
    'href="../../p31-bonding-icons/p31-icon.svg"',
    'href="/p31-bonding-icons/p31-icon.svg"'
  );
  html = html.replace(
    'href="../../cognitive-passport/p31-responsive-surface.css"',
    'href="/cognitive-passport/p31-responsive-surface.css"'
  );
  html = html.replace(
    'src="../../cognitive-passport/lib/p31-subject-prefs.js"',
    'src="/cognitive-passport/lib/p31-subject-prefs.js"'
  );
  // Hub footer: file links → GitHub (canonical) or p31ca static
  const repl = [
    ['href="../physics-learn/index.html"', `href="${githubBlob("docs/physics-learn/index.html")}"`],
    [
      'href="../../andromeda/04_SOFTWARE/p31ca/public/k4market.html"',
      'href="/k4market.html"',
    ],
    ['href="../P31-DEPLOY-CANON.md"', `href="${githubBlob("docs/P31-DEPLOY-CANON.md")}"`],
    ['href="../PLAN-BONDING-SOUP-WHEN-SCALE.md"', `href="${githubBlob("docs/PLAN-BONDING-SOUP-WHEN-SCALE.md")}"`],
    ['href="../../poets-room.html"', 'href="/"'],
    ['href="../../soup.html"', 'href="https://bonding.p31ca.org"'],
    ['href="../../P31-ROOT-MAP.md"', `href="${githubBlob("P31-ROOT-MAP.md")}"`],
    ['href="../../AGENTS.md"', `href="${githubBlob("AGENTS.md")}"`],
    [
      'href="../../andromeda/04_SOFTWARE/p31ca/public/initial-build.html"',
      'href="/initial-build.html"',
    ],
    [
      'href="../../andromeda/04_SOFTWARE/p31ca/public/connect.html"',
      'href="/connect.html"',
    ],
    ['href="../../docs/P31-PERSONAL-HOW-TO.md"', `href="${githubBlob("docs/P31-PERSONAL-HOW-TO.md")}"`],
    ['href="../../p31-personal-howto.html"', `href="${githubBlob("p31-personal-howto.html")}"`],
  ];
  for (const [a, b] of repl) {
    if (!html.includes(a)) {
      console.warn("sync-doc-library-p31ca: pattern not found (skipped):", a.slice(0, 50));
    } else {
      html = html.split(a).join(b);
    }
  }
  html = html.replace(
    '<p class="lede">From the repo root: <code>npm run demo</code> then <code>…/docs/doc-library/</code>. Refresh the index: <code>npm run build:doc-index</code>.</p>',
    '<p class="lede" role="note">Hub mirror: this index is synced from the P31 home repo; clone <a href="https://github.com/p31labs/bonding-soup" rel="noopener">bonding-soup</a> for the full <code>demo</code> + command-center path. From the repo root: <code>npm run demo</code> then <code>…/docs/doc-library/</code>. Refresh: <code>npm run build:doc-index</code> + <code>npm run sync:doc-library:p31ca</code>.</p>'
  );
  await fsp.writeFile(path.join(out, "index.html"), html, "utf8");
  console.log("sync-doc-library-p31ca: OK →", path.relative(root, out));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
