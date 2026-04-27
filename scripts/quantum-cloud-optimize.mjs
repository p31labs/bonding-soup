#!/usr/bin/env node
/**
 * P31 "quantum" Cloudflare coherence pass — one holistic audit of the edge surface:
 * Wrangler files, placeholder resource IDs, compatibility dates, optional observability,
 * deploy path existence vs p31-ecosystem.json, and fleet codePath presence.
 *
 * "Quantum" here matches P31 usage: *coherence across surfaces* (Larmor, egg-hunt, clock),
 * not a quantum computer.
 *
 * Usage:
 *   npm run quantum:cloud
 *   node scripts/quantum-cloud-optimize.mjs --json
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const jsonOut = process.argv.includes("--json");

const SKIPPED = new Set("node_modules .git .cache .wrangler dist build .next .turbo .astro playwright".split(" "));

function* walk(dir) {
  let st;
  try {
    st = fs.statSync(dir);
  } catch {
    return;
  }
  if (!st.isDirectory()) return;
  const base = path.basename(dir);
  if (SKIPPED.has(base)) return;
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = path.join(dir, name);
    let s2;
    try {
      s2 = fs.statSync(p);
    } catch {
      continue;
    }
    if (s2.isDirectory()) yield* walk(p);
    else if (name === "wrangler.toml") yield p;
  }
}

const WRANGLER_ROOTS = [path.join(root, "andromeda"), path.join(root, "wcd33-global-archive")].filter((r) =>
  fs.existsSync(r)
);

const PLACEHOLDER_PATTERNS = [
  { re: /id\s*=\s*["']00000000-0000-0000-0000-000000000000["']/g, id: "zero-uuid" },
  { re: /id\s*=\s*["']xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx["']/g, id: "placeholder-hex" },
  { re: /id\s*=\s*["'][^"']*REPLACEME[^"']*["']/gi, id: "REPLACEME" },
  { re: /database_id\s*=\s*["'][^"']*placeholder[^"']*["']/gi, id: "d1-placeholder-word" },
];

function scanWranglerFile(absPath) {
  const text = fs.readFileSync(absPath, "utf8");
  const rel = path.relative(root, absPath);
  const nameM = text.match(/^name\s*=\s*["']([^"']+)["']/m);
  const mainM = text.match(/^main\s*=\s*["']([^"']+)["']/m);
  const pagesM = text.match(/pages_build_output_dir\s*=\s*["']([^"']+)["']/m);
  const name = nameM ? nameM[1] : null;
  const main = mainM ? mainM[1] : null;
  const pagesOut = pagesM ? pagesM[1] : null;
  const isPagesProject = Boolean(pagesOut) && !main;
  const compatM = text.match(/compatibility_date\s*=\s*["']([^"']+)["']/);
  const compatibilityDate = compatM ? compatM[1] : null;
  const hasObs = /^\[observability\]/m.test(text) && /enabled\s*=\s*true/m.test(text);
  const hasPlacement = /^\[placement\]/m.test(text);
  const hasNodeCompat = /compatibility_flags\s*=\s*\[[^\]]*nodejs_compat[^\]]*\]/m.test(text);

  const placeholderHits = [];
  for (const { re, id } of PLACEHOLDER_PATTERNS) {
    const m = text.match(re);
    if (m) placeholderHits.push({ kind: id, count: m.length });
  }

  return {
    rel,
    name,
    kind: isPagesProject ? "pages" : "worker",
    main,
    pagesOut,
    compatibilityDate,
    hasObservability: hasObs,
    hasSmartPlacement: hasPlacement,
    hasNodejsCompat: hasNodeCompat,
    placeholderHits,
  };
}

function readJson(p) {
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function resolveEcosystemCwd(cwd) {
  if (path.isAbsolute(cwd)) return cwd;
  if (cwd.startsWith("andromeda/")) return path.join(root, cwd);
  return path.join(root, cwd);
}

const report = {
  schema: "p31.quantumCloudOptimize/1.0.0",
  generatedAt: new Date().toISOString(),
  roots: WRANGLER_ROOTS.map((r) => path.relative(root, r)),
  wranglers: [],
  ecosystemDeploy: { ok: [], missing: [] },
  fleetPaths: { ok: [], missing: [] },
  issues: [],
  coherenceScore: 100,
};

// --- Wranglers
for (const r of WRANGLER_ROOTS) {
  for (const f of walk(r)) {
    try {
      const row = scanWranglerFile(f);
      report.wranglers.push(row);
    } catch (e) {
      report.issues.push({ level: "P0", where: path.relative(root, f), message: String(e) });
    }
  }
}
report.wranglers.sort((a, b) => a.rel.localeCompare(b.rel));

// --- p31-ecosystem.json deploy cwd
const eco = readJson(path.join(root, "p31-ecosystem.json"));
if (eco?.deploy && Array.isArray(eco.deploy)) {
  for (const step of eco.deploy) {
    if (!step.cwd) continue;
    const abs = resolveEcosystemCwd(step.cwd);
    if (fs.existsSync(abs)) report.ecosystemDeploy.ok.push({ id: step.id, cwd: step.cwd });
    else {
      report.ecosystemDeploy.missing.push({ id: step.id, cwd: step.cwd });
      report.issues.push({
        level: "P0",
        where: "p31-ecosystem.json",
        message: `deploy step "${step.id}" missing cwd: ${step.cwd}`,
      });
    }
  }
}

// --- p31-live-fleet.json codePath under Andromeda
const fleet = readJson(path.join(root, "p31-live-fleet.json"));
if (fleet?.workersAllowlisted) {
  for (const w of fleet.workersAllowlisted) {
    if (!w.codePath || w.id === "p31ca") continue;
    if (/\(/.test(w.codePath)) {
      report.fleetPaths.ok.push({ id: w.id, path: w.codePath, note: "skipped (non-path note in codePath)" });
      continue;
    }
    let rel = w.codePath;
    if (rel.startsWith("andromeda/")) {
      // ok
    } else if (rel.startsWith("04_SOFTWARE/")) {
      rel = `andromeda/${rel}`;
    } else {
      rel = `andromeda/04_SOFTWARE/${rel.replace(/^\//, "")}`;
    }
    const abs = path.join(root, rel.split("/").join(path.sep));
    if (fs.existsSync(abs)) report.fleetPaths.ok.push({ id: w.id, path: rel });
    else {
      report.fleetPaths.missing.push({ id: w.id, path: rel });
      report.issues.push({ level: "P1", where: "p31-live-fleet.json", message: `fleet codePath not found: ${w.id} → ${rel}` });
    }
  }
}

// --- Score (simple penalty model)
let score = 100;
for (const w of report.wranglers) {
  for (const ph of w.placeholderHits) {
    score -= 15 * (ph.count || 1);
    report.issues.push({
      level: "P0",
      where: w.rel,
      message: `placeholder resource id pattern: ${ph.kind}`,
    });
  }
  if (w.kind === "worker" && !w.compatibilityDate) {
    score -= 2;
    report.issues.push({
      level: "P1",
      where: w.rel,
      message: "worker missing top-level compatibility_date (set a recent date for predictable runtime)",
    });
  }
}
for (const m of report.ecosystemDeploy.missing) {
  score -= 10;
}
for (const m of report.fleetPaths.missing) {
  score -= 3;
}
report.coherenceScore = Math.max(0, Math.min(100, score));

report.stats = {
  wranglerCount: report.wranglers.length,
  workers: report.wranglers.filter((w) => w.kind === "worker").length,
  pagesProjects: report.wranglers.filter((w) => w.kind === "pages").length,
  withObservability: report.wranglers.filter((w) => w.hasObservability).length,
  withSmartPlacement: report.wranglers.filter((w) => w.hasSmartPlacement).length,
  withNodejsCompat: report.wranglers.filter((w) => w.hasNodejsCompat).length,
  placeholderBlocks: report.wranglers.filter((w) => w.placeholderHits.length).length,
  ecosystemMissing: report.ecosystemDeploy.missing.length,
  fleetPathMissing: report.fleetPaths.missing.length,
};

if (jsonOut) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.issues.filter((i) => i.level === "P0").length > 0 ? 1 : 0);
}

console.log("P31 edge coherence pass (Cloudflare / Wrangler) <3");
console.log("— \"Quantum\" = cross-surface alignment, not a QPU. —\n");
console.log(`  Coherence score: ${report.coherenceScore}/100`);
console.log(`  wrangler.toml found: ${report.stats.wranglerCount} (workers ${report.stats.workers}, pages ${report.stats.pagesProjects})`);
console.log(
  `  observability: ${report.stats.withObservability} | smart placement: ${report.stats.withSmartPlacement} | nodejs_compat: ${report.stats.withNodejsCompat}`
);
console.log(`  ecosystem deploy paths missing: ${report.stats.ecosystemMissing}`);
console.log(`  live-fleet codePaths missing (partial clone): ${report.stats.fleetPathMissing}\n`);

if (report.issues.length === 0) {
  console.log("  No issues. Edge tensor looks isostatic. Run: npm run security:check (p31ca) for PQC + CORS + allowlist.");
} else {
  for (const i of report.issues) {
    console.log(`  [${i.level}] ${i.where}\n         ${i.message}`);
  }
}

console.log(
  "\n  Next: p31ca `npm run security:check` (SCA, worker inventory, PQC gate) · `npm run ecosystem:plan` · `npm run inventory:cf`"
);
process.exit(report.issues.filter((i) => i.level === "P0").length > 0 ? 1 : 0);
