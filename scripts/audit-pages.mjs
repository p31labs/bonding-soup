#!/usr/bin/env node
/**
 * Full static audit of all p31ca HTML pages.
 * Outputs a printable table to stdout + docs/page-audit.json.
 *
 * Checks per file (no browser / Playwright):
 *   - File size (stubs < 10 KB flagged)
 *   - og:title + og:description present
 *   - data-p31-appearance attribute (P31 compliance marker)
 *   - Skip link present (a href="#main" or similar)
 *   - Placeholder content (TODO, "coming soon", lorem ipsum, etc.)
 *   - Registered in docs/public-line.json
 *   - phosReady status
 *   - Gate classification
 *
 * Usage:
 *   node scripts/audit-pages.mjs
 *   node scripts/audit-pages.mjs --json-only   # suppress table, only write JSON
 *   node scripts/audit-pages.mjs --unregistered-only  # show only unregistered pages
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const PUBLIC_DIR = path.join(root, "andromeda/04_SOFTWARE/p31ca/public");
const PL_FILE = path.join(root, "docs/public-line.json");
const FLAGS_FILE = path.join(root, "docs/flags.json");
const OUTPUT_FILE = path.join(root, "docs/page-audit.json");

const args = process.argv.slice(2);
const jsonOnly = args.includes("--json-only");
const unregisteredOnly = args.includes("--unregistered-only");

// ── Load public-line.json ─────────────────────────────────────────────────────
let pl = { pages: [] };
if (fs.existsSync(PL_FILE)) {
  try { pl = JSON.parse(fs.readFileSync(PL_FILE, "utf8")); }
  catch (e) { console.error("WARN: could not parse docs/public-line.json:", e.message); }
}

// ── Load flags.json ───────────────────────────────────────────────────────────
let flags = { surfaces: {} };
if (fs.existsSync(FLAGS_FILE)) {
  try { flags = JSON.parse(fs.readFileSync(FLAGS_FILE, "utf8")); }
  catch (e) { console.error("WARN: could not parse docs/flags.json:", e.message); }
}

// Build lookup: resolves filename → public-line entry
const byResolves = new Map();
const byPath = new Map();
for (const entry of pl.pages) {
  byPath.set(entry.path, entry);
  if (entry.resolves && !entry.resolves.startsWith("http")) {
    // resolves may be "welcome.html" or "stylebook/index.html"
    byResolves.set(entry.resolves, entry);
  }
}

// Build flag lookup: id → flag entry
const flagMap = new Map();
for (const [id, flag] of Object.entries(flags.surfaces || {})) {
  flagMap.set(id, flag);
}

// PLACEHOLDER patterns to detect stub content in visible text (run against stripped text)
const PLACEHOLDER_PATTERNS = [
  /lorem ipsum/i,
  /coming soon/i,
  /under construction/i,
  /not yet implemented/i,
  /sample content/i,
  /\[INSERT/i,
];

// Extract visible text content: strip script/style blocks, then strip tags
function extractTextContent(html) {
  return html
    .replace(/<script\b[^]*?<\/script>/gi, " ")
    .replace(/<style\b[^]*?<\/style>/gi, " ")
    .replace(/<!--[^]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ");
}

// STUB_SIZE threshold in bytes
const STUB_THRESHOLD = 10_000;

// ── Static analysis of a single HTML file ────────────────────────────────────
function analyzeFile(filePath) {
  const relPath = path.relative(PUBLIC_DIR, filePath);
  const sizeBytes = fs.statSync(filePath).size;

  let html = "";
  try { html = fs.readFileSync(filePath, "utf8"); }
  catch (e) { return null; }

  const hasOgTitle = /<meta[^>]+property=["']og:title["'][^>]*>/i.test(html);
  const hasOgDesc = /<meta[^>]+property=["']og:description["'][^>]*>/i.test(html);
  const hasP31Appearance = /data-p31-appearance/i.test(html);
  const hasSkipLink = /href=["']#main["']/i.test(html) || /href=["']#content["']/i.test(html);
  const hasCanonical = /<link[^>]+rel=["']canonical["']/i.test(html);

  // Title extraction
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "";

  // Redirect stub detection (meta http-equiv="refresh")
  const isRedirectStub = /http-equiv=["']refresh["']/i.test(html);

  // Placeholder check — run on visible text only to avoid input[placeholder] false positives
  const textContent = extractTextContent(html);
  const isPlaceholder = PLACEHOLDER_PATTERNS.some(p => p.test(textContent));

  // Small-file stub check (but exclude maintenance.html and glass-box-widget.html which are intentionally small)
  // maintenance.html and glass-box-widget.html are intentionally small by design;
  // welcome.html is a thin PHOS shell (~8KB is correct for this pattern)
  const INTENTIONALLY_SMALL = new Set(["maintenance.html", "glass-box-widget.html", "welcome.html"]);
  const isSmallStub = sizeBytes < STUB_THRESHOLD && !INTENTIONALLY_SMALL.has(relPath);

  return {
    relPath,
    sizeBytes,
    sizeKb: Math.round(sizeBytes / 1024 * 10) / 10,
    title,
    hasOgTitle,
    hasOgDesc,
    hasP31Appearance,
    hasSkipLink,
    hasCanonical,
    isPlaceholder,
    isSmallStub,
    isRedirectStub,
  };
}

// ── Scan all HTML files (depth 2) ─────────────────────────────────────────────
function scanHtmlFiles(dir, maxDepth = 2, depth = 0) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory() && depth < maxDepth) {
      results.push(...scanHtmlFiles(full, maxDepth, depth + 1));
    } else if (stat.isFile() && entry.endsWith(".html")) {
      results.push(full);
    }
  }
  return results;
}

// ── Build the full audit record for each file ────────────────────────────────
function buildAudit(filePath) {
  const analysis = analyzeFile(filePath);
  if (!analysis) return null;

  const { relPath } = analysis;

  // Find the public-line entry — try by resolves first, then by path
  let plEntry = byResolves.get(relPath);

  // Also try subdirectory patterns
  if (!plEntry) {
    // relPath might be "stylebook/index.html" → path is "/stylebook/"
    const parts = relPath.split("/");
    if (parts.length === 2 && parts[1] === "index.html") {
      plEntry = byPath.get(`/${parts[0]}/`);
    }
  }

  const gate = plEntry?.gate ?? "unregistered";
  const phosReady = plEntry?.phosReady ?? false;
  const phosSlot = plEntry?.phosSlot ?? null;
  const p0Gap = plEntry?.p0Gap ?? false;
  const notes = plEntry?.notes ?? "";
  const publicPath = plEntry?.path ?? null;

  // Flag check
  const id = relPath.replace(/\.html$/, "").replace(/\/index$/, "");
  const flagEntry = flagMap.get(id) ?? null;
  const flagEnabled = flagEntry?.enabled ?? null;

  // Issues list
  const issues = [];
  if (analysis.isRedirectStub) {
    issues.push("redirect-stub");
  } else {
    if (!analysis.hasOgTitle || !analysis.hasOgDesc) issues.push("no-og");
    if (!analysis.hasP31Appearance && gate === "live") issues.push("no-p31-appearance");
    if (!analysis.hasSkipLink && gate === "live") issues.push("no-skip-link");
    if (analysis.isSmallStub) issues.push(`small(${analysis.sizeKb}KB)`);
    if (analysis.isPlaceholder) issues.push("placeholder-content");
    if (gate === "unregistered") issues.push("unregistered");
    if (gate === "live" && !phosReady && phosSlot) issues.push("phos-slot-not-ready");
    if (p0Gap) issues.push("P0-GAP");
  }

  return {
    relPath,
    publicPath,
    gate,
    phosReady,
    phosSlot,
    p0Gap,
    flagEnabled,
    sizeKb: analysis.sizeKb,
    title: analysis.title,
    hasOgTitle: analysis.hasOgTitle,
    hasOgDesc: analysis.hasOgDesc,
    hasP31Appearance: analysis.hasP31Appearance,
    hasSkipLink: analysis.hasSkipLink,
    hasCanonical: analysis.hasCanonical,
    isSmallStub: analysis.isSmallStub,
    isPlaceholder: analysis.isPlaceholder,
    isRedirectStub: analysis.isRedirectStub,
    issues,
    notes,
  };
}

// ── Check for public-line entries with no file ────────────────────────────────
function findMissingFiles() {
  const missing = [];
  for (const entry of pl.pages) {
    if (!entry.resolves || entry.resolves.startsWith("http")) continue;
    if (entry.gate === "alpha" || entry.gate === "external") continue;
    const fullPath = path.join(PUBLIC_DIR, entry.resolves);
    if (!fs.existsSync(fullPath)) {
      missing.push({ path: entry.path, resolves: entry.resolves, gate: entry.gate, p0Gap: entry.p0Gap ?? false });
    }
  }
  return missing;
}

// ── Table formatting ──────────────────────────────────────────────────────────
const GATE_ICONS = {
  live: "✅",
  gate3: "🟡",
  gate2: "🟡",
  gate1: "🔴",
  maintenance: "🔧",
  alpha: "🔒",
  external: "🔗",
  gap: "🚨",
  unregistered: "❓",
};

function padEnd(s, n) { return String(s).padEnd(n); }
function padStart(s, n) { return String(s).padStart(n); }

function printTable(records) {
  const header = [
    padEnd("FILE", 40),
    padEnd("GATE", 13),
    padStart("SIZE", 7),
    padEnd("PHOS", 5),
    padEnd("OG", 3),
    padEnd("P31", 4),
    padEnd("SKP", 4),
    "ISSUES",
  ].join(" ");
  const sep = "─".repeat(header.length);

  console.log("\n" + sep);
  console.log(header);
  console.log(sep);

  for (const r of records) {
    if (unregisteredOnly && r.gate !== "unregistered") continue;

    const icon = GATE_ICONS[r.gate] ?? "❓";
    const gateStr = `${icon} ${r.gate}${r.p0Gap ? "(P0)" : ""}`;
    const line = [
      padEnd(r.relPath, 40),
      padEnd(gateStr, 13),
      padStart(r.sizeKb + "KB", 7),
      padEnd(r.phosReady ? "✓" : "✗", 5),
      padEnd((r.hasOgTitle && r.hasOgDesc) ? "✓" : "✗", 3),
      padEnd(r.hasP31Appearance ? "✓" : "✗", 4),
      padEnd(r.hasSkipLink ? "✓" : "✗", 4),
      r.issues.length ? r.issues.join(", ") : "—",
    ].join(" ");
    console.log(line);
  }

  console.log(sep + "\n");
}

// ── Main ──────────────────────────────────────────────────────────────────────
const allFiles = scanHtmlFiles(PUBLIC_DIR);
const records = allFiles.map(buildAudit).filter(Boolean);

// Sort: gate=live first, then by gate, then alphabetically
const GATE_ORDER = { live: 0, gate3: 1, gate2: 2, gate1: 3, maintenance: 4, alpha: 5, external: 6, gap: 7, unregistered: 8 };
records.sort((a, b) => {
  const go = (GATE_ORDER[a.gate] ?? 9) - (GATE_ORDER[b.gate] ?? 9);
  return go !== 0 ? go : a.relPath.localeCompare(b.relPath);
});

// Missing file entries (in public-line but file doesn't exist)
const missingFiles = findMissingFiles();

// Summary stats
const gateCounts = {};
for (const r of records) {
  gateCounts[r.gate] = (gateCounts[r.gate] ?? 0) + 1;
}
const issueCount = records.filter(r => r.issues.length > 0).length;
const totalLive = gateCounts.live ?? 0;
const totalUnregistered = gateCounts.unregistered ?? 0;

// Output
if (!jsonOnly) {
  console.log(`\n▶ P31CA PAGE AUDIT — ${new Date().toISOString().split("T")[0]}`);
  console.log(`  ${allFiles.length} HTML files scanned`);
  console.log(`  ${pl.pages.length} entries in public-line.json`);
  console.log(`  ${Object.entries(gateCounts).map(([g, n]) => `${n} ${g}`).join("  ·  ")}`);
  if (missingFiles.length > 0) {
    console.log(`\n  🚨 ${missingFiles.length} PUBLIC-LINE ENTRIES WITH NO FILE:`);
    for (const m of missingFiles) {
      console.log(`     ${m.path} → ${m.resolves} (${m.gate}${m.p0Gap ? ", P0 GAP" : ""})`);
    }
  }

  printTable(records);

  // Summary by category
  console.log("SUMMARY");
  console.log("───────────────────────────────────────");
  console.log(`  Total files scanned:   ${allFiles.length}`);
  console.log(`  Live (gate=live):       ${totalLive}`);
  console.log(`  In gate1/2/3:           ${(gateCounts.gate1 ?? 0) + (gateCounts.gate2 ?? 0) + (gateCounts.gate3 ?? 0)}`);
  console.log(`  Alpha (operator-only):  ${gateCounts.alpha ?? 0}`);
  console.log(`  Maintenance:            ${gateCounts.maintenance ?? 0}`);
  const redirectStubCount = records.filter(r => r.isRedirectStub).length;
  const trueUnregistered = records.filter(r => r.gate === "unregistered" && !r.isRedirectStub).length;
  const aboutPageCount = records.filter(r => r.gate === "unregistered" && !r.isRedirectStub && r.relPath.endsWith("-about.html")).length;
  console.log(`  Unregistered (total):   ${totalUnregistered}`);
  console.log(`    └ redirect stubs:     ${redirectStubCount}  (agent/ dirs — navigation helpers)`);
  console.log(`    └ about pages:        ${aboutPageCount}  (*-about.html — product detail pages)`);
  console.log(`    └ other content:      ${trueUnregistered - aboutPageCount}  (need classification)`);
  console.log(`  Files with issues:      ${issueCount}`);
  console.log(`  Missing files (P-L):    ${missingFiles.length}`);
  console.log("");
  console.log("  TOP ISSUES:");
  const issueCounts = {};
  for (const r of records) {
    for (const issue of r.issues) {
      const key = issue.replace(/\(\d+(\.\d+)?KB\)/, "(SIZE)");
      issueCounts[key] = (issueCounts[key] ?? 0) + 1;
    }
  }
  for (const [issue, count] of Object.entries(issueCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${String(count).padStart(3)}  ${issue}`);
  }
  console.log("");
}

// Write JSON output
const auditJson = {
  generatedAt: new Date().toISOString(),
  totalFiles: allFiles.length,
  publicLineEntries: pl.pages.length,
  gateCounts,
  missingFiles,
  pages: records,
};
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(auditJson, null, 2));
if (!jsonOnly) {
  console.log(`  ✓ Wrote ${OUTPUT_FILE}`);
  console.log("");
}
