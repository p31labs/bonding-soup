#!/usr/bin/env node
/**
 * Build searchable JSON index for docs/doc-library (p31.docLibrary/1.0.0).
 * Reads docs/doc-index.manifest.json — add optional dirs only when present.
 * fingerprint = sha256 of ordered document bodies — stable generatedAt when sources unchanged.
 */
import crypto from "node:crypto";
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
    }
    return h.digest("hex");
  }

  for (const filePath of list) {
    const raw = await fsp.readFile(filePath, "utf8");
    const rel = path.relative(root, filePath).split(path.sep).join("/");
    const base = path.basename(filePath);
    const title = titleFromMd(raw, base.replace(/\.md$/i, ""));
    const plain = mdToPlain(stripFrontMatter(raw));
    const h2 = h2List(stripFrontMatter(raw));
    const preview = plain.length > 420 ? plain.slice(0, 420) + "…" : plain;
    const h2text = h2.join(" · ");
    documents.push({
      id: rel,
      path: rel,
      title,
      text: plain,
      h2,
      h2text,
      preview,
      chars: plain.length,
    });
  }

  const fp = fingerprintDocuments(documents);
  let generatedAt = new Date().toISOString();
  try {
    const prev = JSON.parse(await fsp.readFile(outJson, "utf8"));
    if (prev && prev.fingerprint === fp && prev.generatedAt) {
      generatedAt = prev.generatedAt;
    }
  } catch {
    /* no previous index */
  }

  const payload = {
    schema: "p31.docLibrary/1.0.0",
    generatedAt,
    fingerprint: fp,
    count: documents.length,
    documents,
  };

  await fsp.mkdir(outDir, { recursive: true });
  await fsp.writeFile(outJson, JSON.stringify(payload, null, 0), "utf8");
  const kb = (Buffer.byteLength(JSON.stringify(payload), "utf8") / 1024).toFixed(1);
  console.log("build-doc-index: wrote", documents.length, "documents,", kb, "kb → docs/doc-library/index.json");
}

main().catch((e) => {
  console.error("build-doc-index:", e);
  process.exit(1);
});
