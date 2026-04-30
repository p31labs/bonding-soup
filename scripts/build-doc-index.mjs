#!/usr/bin/env node
/**
 * Build searchable JSON index for docs/doc-library (p31.docLibrary/1.0.0).
 * Reads docs/doc-index.manifest.json — add optional dirs only when present.
 * fingerprint = sha256 of ordered document bodies — stable generatedAt when sources unchanged.
 *
 * After a real write (not fingerprint skip): when `andromeda/04_SOFTWARE/p31ca` exists, runs
 * `npm run sync:doc-library:p31ca` with P31_SYNC_DOC_LIB_SKIP_BUILD=1 so hub `/doc-library` stays aligned
 * (test:simulations, verify mirror). Opt out: P31_DOC_INDEX_NO_AUTO_SYNC=1.
 */
import crypto from "node:crypto";
import { execFileSync, execSync } from "node:child_process";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "docs", "doc-library");
const outJson = path.join(outDir, "index.json");
const manifestPath = path.join(root, "docs", "doc-index.manifest.json");

function mdToPlain(md) {
  let s = md.replace(/\r\n/g, "\n");
  s = s.replace(/```[\s\S]*?```/g, " ");
  s = s.replace(/`[^`]+`/g, (m) => m.slice(1, -1));
  s = s.replace(/\[([^\]]+)]\([^)]+\)/g, "$1");
  s = s.replace(/^#{1,6}\s+.+$/gm, " ");
  s = s.replace(/^\s*[-*+]\s+/gm, " ");
  s = s.replace(/^\s*\d+\.\s+/gm, " ");
  s = s.replace(/[`*_#>|]+/g, " ");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

function stripFrontMatter(s) {
  if (!s.startsWith("---\n") && !s.startsWith("---\r\n")) return s;
  const end = s.indexOf("\n---", 3);
  if (end === -1) return s;
  return s.slice(end + 4).replace(/^\s+/, "");
}

function titleFromMd(md, fallback) {
  const body = stripFrontMatter(md);
  const m = body.match(/^#\s+(.+)$/m);
  if (m) return m[1].trim();
  return fallback;
}

function h2List(md) {
  const h = [];
  const re = /^##\s+(.+)$/gm;
  let r;
  while ((r = re.exec(md)) !== null) h.push(r[1].trim());
  return h.slice(0, 40);
}

/** First substantive line after H1 (for constellation preview). */
function leadLine(md) {
  const body = stripFrontMatter(md);
  const lines = body.split(/\r?\n/).map((l) => l.trim());
  let i = 0;
  if (lines[0]?.startsWith("#")) i = 1;
  for (; i < lines.length; i++) {
    const l = lines[i];
    if (!l || l.startsWith("```")) continue;
    if (l.startsWith("#")) continue;
    return l.length > 200 ? l.slice(0, 200) + "…" : l;
  }
  return "";
}

function normalizeMdRef(raw, selfRel) {
  const clean = String(raw).trim().split("#")[0].split("?")[0];
  if (!clean.endsWith(".md") || /^\w+:\/\//.test(clean)) return null;
  const dir = path.dirname(selfRel);
  const joined = path.normalize(path.join(dir, clean)).split(path.sep).join("/");
  return joined.replace(/^\.\//, "");
}

/**
 * Outgoing references to other indexed markdown paths (markdown links + `path.md` backticks).
 */
function extractReferences(md, selfRel, pathSet) {
  const out = new Set();
  const add = (raw) => {
    const n = normalizeMdRef(raw, selfRel);
    if (n && pathSet.has(n) && n !== selfRel) out.add(n);
  };
  const reLink = /\]\(([^)\s]+\.md[^)]*)\)/g;
  let m;
  while ((m = reLink.exec(md)) !== null) add(m[1]);
  const reTick = /`([^`\n]+\.md)`/g;
  while ((m = reTick.exec(md)) !== null) add(m[1]);
  return [...out].sort();
}

function assignCluster(rel, title, haystack) {
  const s = `${rel} ${title} ${haystack}`.toLowerCase();
  const rules = [
    ["legal", [/fers\b/, /\bssa\b/, /custody/, /\blegal\b/, /2025cv/, /johnson v\.?\s+johnson/, /benefits?\b/]],
    ["identity", [/cognitive passport/, /audience matrix/, /soulsafe/, /mesh-architecture-canon/, /serialization_profile/, /\bpassport\b/]],
    ["agent_crew", [/simplex/, /sentinel/, /\bherald\b/, /\bscholar\b/, /\bforge\b/, /agent crew/, /composer briefing/]],
    ["products", [/bonding/, /\bc\.a\.r\.s\.?\b/, /soup\.html/, /\bdome\b/, /k4market/, /geodesic/, /cars-naming/]],
    [
      "infrastructure",
      [/deploy.?canon/, /alignment/, /ecosystem/, /fleet.?portal/, /p31-constants/, /engineering.?standard/, /\bagents\.md\b/, /root-?map/, /wrangler/, /worker.?allowlist/],
    ],
    ["research", [/zenodo/, /orcid/, /\bpaper\b/, /sovereign stack/, /arxiv/]],
    ["design", [/design doctrine/, /ethical.?style/, /gray rock/, /p31-universal-canon/, /design.?token/, /canonical numbering/]],
    ["operations", [/startup.?package/, /command.?center/, /parallel.?work/, /operator shift/, /runbook/, /how-?to/, /\bverify\b/]],
  ];
  for (const [name, patterns] of rules) {
    if (patterns.some((re) => re.test(s))) return name;
  }
  return "misc";
}

/** Stable [0,1) from id — constellation seeds must not use Math.random() or fingerprint drifts every build. */
function deterministicUnitInterval(seedStr, salt) {
  const h = crypto.createHash("sha256").update(seedStr).update("\0").update(salt).digest();
  return h.readUInt32BE(0) / 0x100000000;
}

function gitLastCommitMs(relFromRoot) {
  try {
    const o = execFileSync("git", ["log", "-1", "--format=%ct", "--", relFromRoot], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    const t = parseInt(o, 10);
    if (Number.isFinite(t)) return t * 1000;
  } catch {
    /* not a git checkout or file not tracked */
  }
  return null;
}

function layoutConstellation(documents, edgePairs, iterations = 130) {
  const nodes = documents.map((d) => ({
    id: d.id,
    x: 0.15 + deterministicUnitInterval(d.id, "layout-x") * 0.7,
    y: 0.15 + deterministicUnitInterval(d.id, "layout-y") * 0.7,
  }));
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const kRep = 0.00012;
  const kSpring = 0.055;
  const ideal = 0.13;
  for (let it = 0; it < iterations; it++) {
    const fx = new Map(nodes.map((n) => [n.id, 0]));
    const fy = new Map(nodes.map((n) => [n.id, 0]));
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let dist = Math.hypot(dx, dy) + 0.018;
        const f = kRep / (dist * dist);
        const mx = (dx / dist) * f;
        const my = (dy / dist) * f;
        fx.set(a.id, fx.get(a.id) + mx);
        fy.set(a.id, fy.get(a.id) + my);
        fx.set(b.id, fx.get(b.id) - mx);
        fy.set(b.id, fy.get(b.id) - my);
      }
    }
    for (const [u, v] of edgePairs) {
      const a = byId.get(u);
      const b = byId.get(v);
      if (!a || !b) continue;
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      let dist = Math.hypot(dx, dy) + 0.001;
      const diff = dist - ideal;
      const f = kSpring * diff;
      const mx = (dx / dist) * f;
      const my = (dy / dist) * f;
      fx.set(a.id, fx.get(a.id) + mx);
      fy.set(a.id, fy.get(a.id) + my);
      fx.set(b.id, fx.get(b.id) - mx);
      fy.set(b.id, fy.get(b.id) - my);
    }
    const pull = 0.006;
    for (const n of nodes) {
      let vx = fx.get(n.id) - (n.x - 0.5) * pull;
      let vy = fy.get(n.id) - (n.y - 0.5) * pull;
      const cap = 0.045;
      vx = Math.max(-cap, Math.min(cap, vx));
      vy = Math.max(-cap, Math.min(cap, vy));
      n.x = Math.min(0.985, Math.max(0.015, n.x + vx));
      n.y = Math.min(0.985, Math.max(0.015, n.y + vy));
    }
  }
  return nodes;
}

function buildTags(cluster, rel, daysSince) {
  const tags = [];
  if (cluster && cluster !== "misc") tags.push(cluster);
  if (/legal|ssa|custody|2025cv/i.test(rel)) tags.push("legal");
  if (/simplex|sentinel|herald|scholar|forge/i.test(rel)) tags.push("agent");
  if (/\/public\/|k4-personal|k4-cage|wrangler|dist\//i.test(rel)) tags.push("shipped");
  if (daysSince != null && daysSince > 30) tags.push("stale");
  return [...new Set(tags)];
}

function skipName(name, patterns) {
  if (patterns.some((p) => name.includes(p))) return true;
  return false;
}

async function walkMarkdownFiles(dir, acc, { excludeSubstrings, namePatterns }) {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (skipName(e.name, namePatterns)) continue;
    const p = path.join(dir, e.name);
    const rel = path.relative(root, p).split(path.sep).join("/");
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name.startsWith(".")) continue;
      if (excludeSubstrings.some((x) => rel.includes(x))) continue;
      await walkMarkdownFiles(p, acc, { excludeSubstrings, namePatterns });
    } else if (e.isFile() && e.name.endsWith(".md")) {
      if (excludeSubstrings.some((x) => rel.includes(x))) continue;
      acc.push(p);
    }
  }
}

async function main() {
  const manifest = JSON.parse(await fsp.readFile(manifestPath, "utf8"));
  const excl = manifest.excludePathSubstrings || [];
  const namePatterns = manifest.excludeNamePatterns || [];
  const files = new Set();

  const docsDir = path.join(root, manifest.include.docsDirRecursive);
  if (fs.existsSync(docsDir)) {
    const acc = [];
    await walkMarkdownFiles(docsDir, acc, { excludeSubstrings: excl, namePatterns });
    acc.forEach((p) => files.add(p));
  }

  for (const name of manifest.include.rootMarkdown) {
    if (skipName(name, namePatterns)) continue;
    const p = path.join(root, name);
    if (fs.existsSync(p)) files.add(p);
  }

  for (const opt of manifest.include.optionalDirs || []) {
    const p = path.join(root, opt.path);
    if (fs.existsSync(p)) {
      const acc = [];
      await walkMarkdownFiles(p, acc, { excludeSubstrings: excl, namePatterns });
      acc.forEach((f) => files.add(f));
    }
  }

  const list = [...files].sort((a, b) => a.localeCompare(b));
  const documents = [];

  function fingerprintDocuments(docs) {
    const h = crypto.createHash("sha256");
    for (const d of docs) {
      h.update(d.id);
      h.update("\0");
      h.update(d.text);
      h.update("\0");
      h.update((d.references && d.references.join(",")) || "");
      h.update("\0");
      h.update(String(d.x ?? ""));
      h.update("\0");
      h.update(String(d.y ?? ""));
      h.update("\0");
    }
    return h.digest("hex");
  }

  const pathSet = new Set(list.map((fp) => path.relative(root, fp).split(path.sep).join("/")));
  const rawRows = [];

  for (const filePath of list) {
    const raw = await fsp.readFile(filePath, "utf8");
    const rel = path.relative(root, filePath).split(path.sep).join("/");
    const base = path.basename(filePath);
    const title = titleFromMd(raw, base.replace(/\.md$/i, ""));
    const plain = mdToPlain(stripFrontMatter(raw));
    const h2 = h2List(stripFrontMatter(raw));
    const preview = plain.length > 420 ? plain.slice(0, 420) + "…" : plain;
    const h2text = h2.join(" · ");
    const lines = raw.split(/\r?\n/).length;
    const gitMs = gitLastCommitMs(rel);
    let mtimeMs = null;
    try {
      mtimeMs = fs.statSync(filePath).mtimeMs;
    } catch {
      /* */
    }
    const lastMs = gitMs ?? mtimeMs;
    const daysSince =
      lastMs != null ? Math.floor((Date.now() - lastMs) / 86400000) : null;
    const references = extractReferences(raw, rel, pathSet);
    const cluster = assignCluster(rel, title, plain.slice(0, 2800));
    const tags = buildTags(cluster, rel, daysSince);
    const previewLead = leadLine(raw);
    const tagsText = tags.join(" ");
    rawRows.push({
      id: rel,
      path: rel,
      title,
      text: plain,
      h2,
      h2text,
      preview,
      previewLead,
      chars: plain.length,
      lines,
      references,
      cluster,
      tags,
      tagsText,
      updatedAt: lastMs != null ? new Date(lastMs).toISOString() : null,
      daysSinceCommit: daysSince,
    });
  }

  const edgePairs = [];
  const edgeSeen = new Set();
  for (const d of rawRows) {
    for (const r of d.references) {
      const a = d.id < r ? d.id : r;
      const b = d.id < r ? r : d.id;
      const k = a + "\0" + b;
      if (!edgeSeen.has(k)) {
        edgeSeen.add(k);
        edgePairs.push([d.id, r]);
      }
    }
  }

  const pos = layoutConstellation(rawRows, edgePairs);
  const posMap = new Map(pos.map((p) => [p.id, p]));
  for (const d of rawRows) {
    const p = posMap.get(d.id);
    documents.push({
      ...d,
      x: p ? Math.round(p.x * 10000) / 10000 : 0.5,
      y: p ? Math.round(p.y * 10000) / 10000 : 0.5,
    });
  }

  const fp = fingerprintDocuments(documents);
  /** When fingerprint matches, skip write — daysSinceCommit/updatedAt vary with Date.now()/git but are excluded from fp, which otherwise churns the hub mirror every verify. */
  try {
    const prev = JSON.parse(await fsp.readFile(outJson, "utf8"));
    if (prev && prev.fingerprint === fp) {
      console.log(
        "build-doc-index: skip write — fingerprint unchanged (" +
          documents.length +
          " documents) →",
        path.relative(root, outJson),
      );
      return;
    }
  } catch {
    /* no previous index */
  }

  const generatedAt = new Date().toISOString();

  const payload = {
    schema: "p31.docLibrary/1.0.0",
    generatedAt,
    fingerprint: fp,
    count: documents.length,
    constellation: {
      layoutVersion: 1,
      note: "x,y normalized 0–1; edges from references[]; springs+repulsion at build time",
      clusterLabels: {
        identity: "Identity",
        agent_crew: "Agent crew",
        products: "Products",
        infrastructure: "Infrastructure",
        legal: "Legal / benefits",
        research: "Research",
        design: "Design",
        operations: "Operations",
        misc: "Other",
      },
    },
    documents,
  };

  await fsp.mkdir(outDir, { recursive: true });
  await fsp.writeFile(outJson, JSON.stringify(payload, null, 0), "utf8");
  const kb = (Buffer.byteLength(JSON.stringify(payload), "utf8") / 1024).toFixed(1);
  console.log("build-doc-index: wrote", documents.length, "documents,", kb, "kb → docs/doc-library/index.json");

  const p31caRoot = path.join(root, "andromeda", "04_SOFTWARE", "p31ca");
  if (process.env.P31_DOC_INDEX_NO_AUTO_SYNC !== "1" && fs.existsSync(p31caRoot)) {
    try {
      execSync("npm run sync:doc-library:p31ca", {
        cwd: root,
        stdio: "inherit",
        env: { ...process.env, P31_SYNC_DOC_LIB_SKIP_BUILD: "1" },
      });
      console.log("build-doc-index: auto-synced doc-library → p31ca public (hub mirror)");
    } catch (e) {
      console.error("build-doc-index: auto-sync failed — run npm run sync:doc-library:p31ca manually");
      throw e;
    }
  }
}

main().catch((e) => {
  console.error("build-doc-index:", e);
  process.exit(1);
});
