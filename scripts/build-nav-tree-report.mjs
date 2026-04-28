#!/usr/bin/env node
/**
 * Offline HTML link crawl → navigation tree report (internal nav + externals bucket).
 *
 * Usage: node scripts/build-nav-tree-report.mjs [--out docs/P31-USER-NAV-TREE.md]
 *
 * semantics:
 * - Strips `<script>`, `<style>`, `<template>` before scraping `<a href>` (fixes template echoes; ignores inert templates).
 * - Resolves `_redirects` (Cloudflare Pages) when a root path has no `.html` on disk.
 * - Optional `suppressDescentRelPrefixes`: record edge into subtree but **do not** crawl pages there (Soup → k4market only).
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");

/** Quoted or unquoted `href` (HTML5 permits bare tokens). Group 1 = quoted; group 2 = unquoted */
const HREF_RE =
  /<a\s[^>]*\bhref\s*=\s*(?:["']([^"']+)["']|([^\s>]+))/gi;

const SKIP_DIR_NAMES = new Set(["node_modules", ".git", "dist", ".cache", "__pycache__"]);

function parseArgs() {
  const out = { file: path.join(repoRoot, "docs/P31-USER-NAV-TREE.md") };
  const a = process.argv.slice(2);
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--out" && a[i + 1]) {
      out.file = path.isAbsolute(a[i + 1]) ? a[i + 1] : path.join(repoRoot, a[i + 1]);
      i++;
    }
  }
  return out;
}

function readText(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return null;
  }
}

function stripForHrefScrape(html) {
  return String(html)
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<template\b[^>]*>[\s\S]*?<\/template>/gi, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");
}

/** Canonical `/path` keys for `_redirects` lookups (trail slash removed except `/`). */
function normalizeRedirectSourceKey(pathLike) {
  let s = String(pathLike ?? "")
    .trim()
    .replace(/\\/g, "/");
  if (!s.startsWith("/")) s = "/" + s;
  if (s.length > 1 && s.endsWith("/")) s = s.slice(0, -1);
  return s;
}

/** Parse Cloudflare Pages `_redirects`; paths must use URI encoding — no raw spaces in the pattern column. */
function loadRedirectsMap(webRootAbs) {
  const mp = new Map();
  const txt = readText(path.join(webRootAbs, "_redirects"));
  if (!txt) return mp;
  const rowRe = /^(\/[^\s]+)\s+(\/\S+|https?:\/\/\S+)/;
  for (let line of txt.split("\n")) {
    line = line.replace(/\t/g, " ").trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(rowRe);
    if (m) {
      const from = normalizeRedirectSourceKey(m[1]);
      const dest = m[2].trim();
      if (dest.startsWith("/") || dest.startsWith("http")) mp.set(from, dest);
      continue;
    }
    /* Fallback — lose multi-token paths without %20 */
    const parts = line.split(/\s+/).filter(Boolean);
    if (parts.length >= 2 && parts[0].startsWith("/")) {
      const from = normalizeRedirectSourceKey(parts[0]);
      const dest = parts[1];
      if (dest.startsWith("/") || dest.startsWith("http")) mp.set(from, dest);
    }
  }
  return mp;
}

function listHtmlFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  const st = fs.statSync(dir);
  if (st.isFile() && dir.endsWith(".html")) {
    acc.push(dir);
    return acc;
  }
  if (!st.isDirectory()) return acc;
  const base = path.basename(dir);
  if (SKIP_DIR_NAMES.has(base)) return acc;
  if (base === "phosphorus31.org") return acc;
  for (const name of fs.readdirSync(dir)) listHtmlFiles(path.join(dir, name), acc);
  return acc;
}

/** Bonding Soup “island”: root *.html + docs/** + cognitive-passport + spikes (NOT monorepo crawl) */
function collectBondingHtmlUniverse(rr) {
  const set = new Set();
  const rootHtml = fs.readdirSync(rr).filter((n) => n.endsWith(".html"));
  for (const n of rootHtml) set.add(n);
  for (const d of ["docs", "cognitive-passport", "spikes"]) {
    const abs = path.join(rr, d);
    if (fs.existsSync(abs)) {
      for (const f of listHtmlFiles(abs)) {
        set.add(path.relative(rr, f).split(path.sep).join("/"));
      }
    }
  }
  return set;
}

function extractHrefs(html) {
  const out = [];
  const clean = stripForHrefScrape(html);
  HREF_RE.lastIndex = 0;
  let m;
  while ((m = HREF_RE.exec(clean)) !== null) {
    const h = String(m[1] || m[2] || "").trim();
    if (h.includes("${") || h.includes("{%") || h.includes("href.replace")) continue;
    out.push(h);
  }
  return out;
}

/**
 * Resolve `href` vs `webRootAbs` filesystem + optional `_redirects` map + follow one-hop external redirect to same-origin path.
 */
function resolveInternalHtmlPath(fromAbsPath, rawHref, webRootAbs, redirectMap, depth = 0) {
  const raw = String(rawHref || "").trim();
  if (!raw || raw.startsWith("javascript:") || raw.startsWith("blob:")) return { kind: "skip" };
  if (raw.startsWith("mailto:")) return { kind: "mailto", raw };
  if (raw.startsWith("tel:")) return { kind: "tel", raw };

  const stripHashQuery = (s) => decodeURIComponent(String(s).split("#")[0].split("?")[0]);

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      const u = new URL(raw);
      if ((u.hostname === "127.0.0.1" || u.hostname === "localhost") && u.pathname.startsWith("/")) {
        const inner = stripHashQuery(u.pathname);
        return resolveInternalHtmlPath(fromAbsPath, inner, webRootAbs, redirectMap, depth + 1);
      }
      return { kind: "external", raw };
    } catch {
      return { kind: "bad", raw };
    }
  }

  let p = stripHashQuery(raw);
  if (!p) return { kind: "same_page_anchor", raw };

  try {
    if (p.endsWith(".md")) return { kind: "markdown_href", raw };

    if (p.startsWith("//")) return { kind: "external", raw };

    if (p.endsWith(".nvmrc") || /\.(?:ya?ml|toml)$/i.test(p)) return { kind: "misc_asset", raw };
    /** @type {string} */
    let abs;
    if (p.startsWith("/")) {
      if (p === "/") return { kind: "site_root", raw };

      abs = resolveAbsPathAgainstRoot(webRootAbs, p.slice(1), redirectMap, depth);
      if (!abs) return { kind: "broken", raw, note: "unresolved / path" };

      let result = finalizeHtmlAbs(abs);
      if (result.kind === "ok") return { kind: "ok", raw, targetFs: result.abs };
      try {
        if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return { kind: "misc_asset", raw };
      } catch {
        /* ignore */
      }
      return { kind: "broken", raw, note: result.note ?? "missing" };
    }

    abs = path.normalize(path.join(path.dirname(fromAbsPath), p));
    if (!abs.startsWith(webRootAbs)) {
      abs = path.normalize(path.join(webRootAbs, p));
    }
    let finalized = finalizeHtmlAbs(abs);
    if (finalized.kind === "ok") return { kind: "ok", raw, targetFs: finalized.abs };
    try {
      if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return { kind: "misc_asset", raw };
    } catch {
      /* ignore */
    }

    /** `_redirects` by site route — try again using path under `webRootAbs` → `/posix/rel`. */
    if (abs.startsWith(webRootAbs)) {
      let relTry = path.relative(webRootAbs, abs).split(path.sep).join("/");
      if (relTry && !relTry.startsWith("..")) {
        let via = resolveAbsPathAgainstRoot(webRootAbs, relTry, redirectMap, depth);
        if (!via && relTry.endsWith("/"))
          via = resolveAbsPathAgainstRoot(webRootAbs, relTry.replace(/\/+$/, ""), redirectMap, depth);

        if (via) {
          finalized = finalizeHtmlAbs(via);
          if (finalized.kind === "ok") return { kind: "ok", raw, targetFs: finalized.abs };
          try {
            if (fs.existsSync(via) && fs.statSync(via).isFile()) return { kind: "misc_asset", raw };
          } catch {
            /* ignore */
          }
        }
      }
    }
    return { kind: "broken", raw, note: finalized.note };
  } catch {
    return { kind: "bad", raw };
  }
}

function resolveAbsPathAgainstRoot(webRootAbs, posixNoLeadingSlash, redirectMap, depth) {
  if (depth > 8) return null;
  const direct = path.normalize(path.join(webRootAbs, posixNoLeadingSlash));
  const fin = finalizeHtmlAbs(direct);
  if (fin.kind === "ok") return fin.abs;

  const key = normalizeRedirectSourceKey("/" + posixNoLeadingSlash.replace(/^\/+/, ""));
  let dest = redirectMap.get(key);

  if (dest && dest.startsWith("/")) {
    const nextAbs = resolveAbsPathAgainstRoot(webRootAbs, dest.slice(1), redirectMap, depth + 1);
    if (nextAbs) return nextAbs;
  }
  /* try basename.html for clean URLs */
  const bare = posixNoLeadingSlash.replace(/\.html$/i, "");
  const htmlTry = path.join(webRootAbs, bare + ".html");
  const finH = finalizeHtmlAbs(htmlTry);
  if (finH.kind === "ok") return finH.abs;

  const idxTry = path.join(webRootAbs, bare, "index.html");
  const finI = finalizeHtmlAbs(idxTry);
  if (finI.kind === "ok") return finI.abs;

  const fallbackDest = redirectMap.get(key);
  return fallbackDest && fallbackDest.startsWith("/")
    ? path.normalize(path.join(webRootAbs, fallbackDest.replace(/^\//, "")))
    : null;
}

function finalizeHtmlAbs(abs) {
  if (abs == null || typeof abs !== "string") return { kind: "bad", note: "invalid path" };
  if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
    if (!abs.endsWith(".html")) return { kind: "bad", note: "not html extension" };
    return { kind: "ok", abs };
  }

  const withHtml = abs.endsWith(".html") ? abs : `${abs}.html`;
  if (fs.existsSync(withHtml) && fs.statSync(withHtml).isFile()) return { kind: "ok", abs: path.normalize(withHtml) };

  const idx = path.join(abs.replace(/\\/g, "/").endsWith(".html") ? path.dirname(abs) : abs, "index.html");
  if (fs.existsSync(idx) && fs.statSync(idx).isFile()) return { kind: "ok", abs: path.normalize(idx) };

  return { kind: "bad", note: "missing" };
}

function crawlWebRoot(opts) {
  const {
    webRootAbs,
    label,
    seedRelPaths,
    discoverAllHtml = true,
    knownHtmlSet = null,
    suppressDescentRelPrefixes = [],
  } = opts;

  const redirectMap = loadRedirectsMap(webRootAbs);

  /** @type Map<string, Map<string, string>> from page → resolved target → sample raw href */
  const adjacency = new Map();
  /** @type Set<string> */
  const reachable = new Set();
  /** @type Array<{from: string, raw: string}> */
  const external = [];
  /** @type Array<{from: string, raw: string}> */
  const siteRoots = [];
  /** @type Array<{from: string, raw: string}> */
  const mdRefs = [];
  /** @type Array<{from: string, raw: string}> */
  const miscRefs = [];
  /** @type Array<{from: string, raw: string, note?: string}> */
  const broken = [];

  function posixRel(abs) {
    return path.relative(webRootAbs, abs).split(path.sep).join("/");
  }

  const queue = [];
  function enqueue(relPosix) {
    const abs = path.join(webRootAbs, relPosix);
    const st = fs.existsSync(abs) ? fs.statSync(abs) : null;
    if (!st || !st.isFile()) {
      broken.push({ from: "_seed_", raw: relPosix, note: "seed missing" });
      return;
    }
    if (!reachable.has(relPosix)) {
      reachable.add(relPosix);
      queue.push(relPosix);
    }
  }

  let allKnownHtml = knownHtmlSet ?? new Set();
  if (!knownHtmlSet && discoverAllHtml) {
    allKnownHtml = new Set(
      listHtmlFiles(webRootAbs).map((fp) => posixRel(path.resolve(fp))),
    );
  }

  for (const s of seedRelPaths) enqueue(s.replace(/\\/g, "/"));

  function suppressedDescent(toRelPosix, fromRelPosix) {
    for (const pref of suppressDescentRelPrefixes) {
      if (toRelPosix.startsWith(pref) && !fromRelPosix.startsWith(pref)) return true;
    }
    return false;
  }

  while (queue.length) {
    const fromRel = queue.shift();
    const fromAbs = path.join(webRootAbs, fromRel);
    const html = readText(fromAbs);
    if (!html) continue;

    if (!adjacency.has(fromRel)) adjacency.set(fromRel, new Map());

    const hrefs = extractHrefs(html);
    const seenPair = adjacency.get(fromRel);

    for (const raw of hrefs) {
      const t = resolveInternalHtmlPath(fromAbs, raw, webRootAbs, redirectMap);

      if (t.kind === "skip" || t.kind === "same_page_anchor") continue;
      if (t.kind === "mailto" || t.kind === "tel") continue;
      if (t.kind === "markdown_href") {
        mdRefs.push({ from: fromRel, raw: t.raw });
        continue;
      }
      if (t.kind === "misc_asset") {
        miscRefs.push({ from: fromRel, raw: t.raw });
        continue;
      }
      if (t.kind === "site_root") {
        siteRoots.push({ from: fromRel, raw: t.raw });
        continue;
      }
      if (t.kind === "external") {
        external.push({ from: fromRel, raw: t.raw });
        continue;
      }
      if (t.kind === "bad") {
        broken.push({ from: fromRel, raw: t.raw });
        continue;
      }
      if (t.kind === "broken") {
        broken.push({ from: fromRel, raw: t.raw, note: /** @type {*} */ (t).note });
        continue;
      }

      const targetAbs = /** @type {string} */ (/** @type {*} */ (t).targetFs);
      const toRel = posixRel(targetAbs);
      if (!toRel.endsWith(".html")) continue;

      const edgeKey = toRel;
      if (!seenPair.has(edgeKey)) seenPair.set(edgeKey, raw);

      if (!reachable.has(toRel)) {
        reachable.add(toRel);
        if (suppressedDescent(toRel, fromRel)) continue;
        queue.push(toRel);
      }
    }
  }

  const unreachable = [];
  if (discoverAllHtml) {
    for (const h of allKnownHtml) {
      if (!reachable.has(h)) unreachable.push(h);
    }
  }

  return {
    label,
    webRootAbs,
    edges: adjacency,
    reachable: [...reachable].sort(),
    allHtml: [...allKnownHtml].sort(),
    unreachable,
    broken,
    external,
    mdRefs,
    miscRefs,
    siteRoots,
    redirectMapSize: redirectMap.size,
    seedRelPaths,
    suppressDescentRelPrefixes,
  };
}

function nodeId(rel) {
  return `n${crypto.createHash("sha1").update(rel).digest("hex").slice(0, 10)}`;
}

function buildMermaid(fromCrawl, maxEdges = 100) {
  const lines = ["flowchart LR"];
  const picks = [...fromCrawl.reachable].slice(0, 48).sort();
  const ids = new Map();
  for (const p of picks) ids.set(p, nodeId(p));
  for (const p of picks) lines.push(`  ${ids.get(p)}["${String(p).replace(/"/g, "'").slice(0, 46)}…"]`);

  let e = 0;
  outer: for (const [from, pmap] of fromCrawl.edges) {
    if (!ids.has(from)) continue;
    for (const to of pmap.keys()) {
      if (!ids.has(to)) continue;
      lines.push(`  ${ids.get(from)} --> ${ids.get(to)}`);
      e++;
      if (e >= maxEdges) break outer;
    }
  }
  return lines.join("\n");
}

function degreeStats(crawl) {
  const outDeg = new Map();
  for (const p of crawl.reachable) outDeg.set(p, 0);
  for (const [from, pmap] of crawl.edges) {
    outDeg.set(from, pmap.size);
  }
  return outDeg;
}

async function main() {
  const { file: outFile } = parseArgs();
  const genDir = path.join(repoRoot, "docs", "generated");
  fs.mkdirSync(genDir, { recursive: true });

  const bondingSeeds = [
    "soup.html",
    "fleet-portal.html",
    "cognitive-passport/index.html",
    "docs/doc-library/index.html",
    "docs/physics-learn/index.html",
    "p31-personal-howto.html",
    "p31-device-setup.html",
    "poets-room.html",
  ];

  const bonding = crawlWebRoot({
    webRootAbs: repoRoot,
    label: "C.A.R.S. / bonding-soup (repo root demo server)",
    seedRelPaths: bondingSeeds,
    discoverAllHtml: true,
    knownHtmlSet: collectBondingHtmlUniverse(repoRoot),
    suppressDescentRelPrefixes: ["andromeda/"],
  });

  /** @type {Awaited<ReturnType<typeof crawlWebRoot>> | null} */
  let p31ca = null;
  const p31caPublic = path.join(repoRoot, "andromeda", "04_SOFTWARE", "p31ca", "public");
  if (fs.existsSync(path.join(p31caPublic, "welcome.html"))) {
    const seeds = ["welcome.html", "bonding.html", "connect.html", "education/index.html", "education/portal/index.html"];
    const existing = seeds.filter((p) => fs.existsSync(path.join(p31caPublic, p)));
    p31ca = crawlWebRoot({
      webRootAbs: p31caPublic,
      label: "p31ca.org Pages build (`public/` as served root)",
      seedRelPaths: existing,
      discoverAllHtml: true,
      knownHtmlSet: null,
      suppressDescentRelPrefixes: [],
    });
  }

  function exportTsv(relPath, crawl) {
    const rows = ["from_rel\tresolved_rel\tsample_raw_href"];
    for (const [from, pmap] of [...crawl.edges.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      for (const [toRel, sampleRaw] of [...pmap.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
        rows.push(`${from}\t${toRel.replace(/\t/g, " ")}\t${String(sampleRaw).replace(/\t/g, " ")}`);
      }
    }
    const absOut = path.join(repoRoot, relPath);
    fs.mkdirSync(path.dirname(absOut), { recursive: true });
    fs.writeFileSync(absOut, rows.join("\n"), "utf8");
    return relPath;
  }

  exportTsv("docs/generated/nav-edges-bonding.tsv", bonding);
  if (p31ca) exportTsv("docs/generated/nav-edges-p31ca-public.tsv", p31ca);

  /** @param {Awaited<ReturnType<crawlWebRoot>>} crawl */
  function section(crawl, maxEdgeRows) {
    ml.push(`## ${crawl.label}`);
    ml.push("");
    ml.push(`**Filesystem root:** \`${path.relative(repoRoot, crawl.webRootAbs) || "."}\``);
    ml.push("");
    ml.push(`**Seeds:** ${crawl.seedRelPaths.map((s) => `\`${s}\``).join(", ")}`);
    if (crawl.suppressDescentRelPrefixes?.length) {
      ml.push("");
      ml.push(`**Traversal stops at edges into:** ${crawl.suppressDescentRelPrefixes.map((p) => `\`${p}*\``).join(", ")} *(pages still counted as reachable targets from outside; crawler does not open them).*`);
    }
    ml.push("");
    ml.push("| Metric | Count | Notes |");
    ml.push("|--------|------:|-------|");
    ml.push(`| HTML in crawl universe | ${crawl.allHtml.length} | |`);
    ml.push(`| Reachable internally | ${crawl.reachable.length} | BFS from seeds |`);
    ml.push(`| Orphans | ${crawl.unreachable.length} | in universe only |`);
    ml.push(`| Broken (no file after redirects) | ${crawl.broken.length} | |`);
    ml.push(`| Outbound https / other hosts | ${crawl.external.length} | |`);
    ml.push(`| \`/\` SPA home links | ${crawl.siteRoots.length} | not missing — deploy root |`);
    ml.push(`| \`.md\` anchors | ${crawl.mdRefs.length} | prose, not shipped HTML routes |`);
    ml.push(`| Non-HTML file links | ${crawl.miscRefs?.length ?? 0} | e.g. \`.nvmrc\`, config |`);
    ml.push(`| \`_redirects\` entries loaded | ${crawl.redirectMapSize} | |`);
    ml.push("");

    if (crawl.unreachable.length) {
      ml.push(`### Orphan HTML (${crawl.unreachable.length}) — not reached from seeds`);
      ml.push("");
      for (const u of crawl.unreachable.slice(0, 80)) ml.push(`- \`${u}\``);
      if (crawl.unreachable.length > 80)
        ml.push(`- … *${crawl.unreachable.length - 80} more (see crawl universe glob)*`);
      ml.push("");
    }

    if (crawl.mdRefs.length && crawl.mdRefs.length <= 25) {
      ml.push(`### Markdown-linked (not counted as broken)`);
      ml.push("");
      for (const m of crawl.mdRefs) ml.push(`- \`${m.from}\` → \`${m.raw}\``);
      ml.push("");
    } else if (crawl.mdRefs.length) {
      ml.push(`### Markdown-linked: ${crawl.mdRefs.length} anchors (skipped for HTML QA)`);
      ml.push("");
    }

    if (crawl.broken.length) {
      ml.push("### Broken filesystem targets");
      ml.push("");
      ml.push("| From | href | note |");
      ml.push("|------|------|------|");
      for (const b of crawl.broken.slice(0, 60)) {
        const rr = String(b.raw ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
        ml.push(`| \`${b.from}\` | \`${rr}\` | ${(b.note || "").replace(/\|/g, "\\|")} |`);
      }
      if (crawl.broken.length > 60) ml.push(`| … | … | *truncated (${crawl.broken.length - 60} more)* |`);
      ml.push("");
    }

    const outDeg = degreeStats(crawl);
    const fan = [...outDeg.entries()]
      .filter(([p]) => p.endsWith(".html"))
      .sort((a, b) => b[1] - a[1]);
    ml.push("### Fan-out (distinct internal `.html` targets)");
    ml.push("");
    ml.push("| Page | Out-degree |");
    ml.push("|------|------------|");
    for (const [p, d] of fan.slice(0, 42)) ml.push(`| \`${p}\` | ${d} |`);
    if (fan.length > 42) ml.push("| … | *see TSV* |");
    ml.push("");

    ml.push(`### Edge sample (${Math.min(maxEdgeRows, 160)} rows; full dump → generated TSV)`);
    ml.push("");
    ml.push("| From | href | → |");
    ml.push("|------|------|---|");

    let n = 0;
    outer: for (const [from, pmap] of [...crawl.edges.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      for (const [toRel, rawKey] of [...pmap.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
        ml.push(`| \`${from}\` | ${String(rawKey).replace(/\|/g, "\\|")} | \`${toRel}\` |`);
        n++;
        if (n >= maxEdgeRows) break outer;
      }
    }
    ml.push("");

    ml.push(`### Mermaid (reachable spine excerpt — readability)`);
    ml.push("");
    ml.push("```mermaid");
    ml.push(buildMermaid(crawl, 112));
    ml.push("```");
    ml.push("");
  }

  const ml = [];

  ml.push("# P31 user navigation tree & link audit");
  ml.push("");
  ml.push(`**Generated:** ${new Date().toISOString()} — rerun \`npm run nav:report\`.`);
  ml.push("");
  ml.push("| Artifact | Purpose |");
  ml.push("|----------|---------|");
  ml.push("| This file | Human review: fan-out, orphans, jitterbug-style traversal |");
  ml.push("| `docs/generated/nav-edges-bonding.tsv` | Directed edges BondingSoup |");
  ml.push("| `docs/generated/nav-edges-p31ca-public.tsv` | Directed edges hub `public/` |");
  ml.push("");
  ml.push("## Concepts");
  ml.push("");
  ml.push("| Term | Definition |");
  ml.push("|------|-------------|");
  ml.push("| **Directed graph** | Page = vertex; `<a href>` = tagged edge toward another asset |");
  ml.push("| **Fan-out** | Immediate choices on one page (= out-degree toward local `.html` files) |");
  ml.push(
    "| **Jitterbug traversal** | Any user session = a walk along directed edges — Fuller's jitterbug unfolds the same polyhedron combinatorially; here we unfold *every* instantaneous choice per page.",
  );
  ml.push("| **Orphans** | Files in crawl universe whose graph has no inbound path from seeded entry points |");
  ml.push("");

  section(bonding, 140);
  if (p31ca) section(p31ca, 140);
  else {
    ml.push("## p31ca `public/`");
    ml.push("");
    ml.push("*No `andromeda/04_SOFTWARE/p31ca/public/` checkout — omit hub graph.*");
    ml.push("");
  }

  ml.push("## Combined rollup");
  ml.push("");
  ml.push("| Zone | Universe | Reachable | Orphans | Broken | External hosts | SPA `/` refs | `.md` hrefs |");
  ml.push("|------|----------|-----------|---------|--------|----------------|-------------|-----------|");

  ml.push(
    `| Bonding static | ${bonding.allHtml.length} | ${bonding.reachable.length} | ${bonding.unreachable.length} | ${bonding.broken.length} | ${bonding.external.length} | ${bonding.siteRoots.length} | ${bonding.mdRefs.length} |`,
  );
  if (p31ca) {
    ml.push(
      `| p31ca Pages | ${p31ca.allHtml.length} | ${p31ca.reachable.length} | ${p31ca.unreachable.length} | ${p31ca.broken.length} | ${p31ca.external.length} | ${p31ca.siteRoots.length} | ${p31ca.mdRefs.length} |`,
    );
  }

  ml.push("");
  ml.push("*CI exit code follows script: warnings only (`npm run nav:report` exits 0). Use manual review of Broken table.*");

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, ml.join("\n"), "utf8");
  console.log("wrote:", outFile);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
