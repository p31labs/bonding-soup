#!/usr/bin/env node
/**
 * P31 launch readiness — single command, ten lanes, three modes, one report.
 *
 *   npm run launch:audit            # fast, read-only, default mode
 *   npm run launch:gate             # gate mode (all critical human gates required)
 *   npm run launch:rehearsal        # strict rehearsal (ecosystem:glass + full verify)
 *   npm run launch:next             # one-line "do this next"
 *
 *   node scripts/p31-launch-readiness.mjs --json    # machine output
 *   node scripts/p31-launch-readiness.mjs --brief   # spoon-mode (next-one only)
 *   node scripts/p31-launch-readiness.mjs --no-log  # don't append to ~/.p31/launch-log.jsonl
 *
 * Output:
 *   - JSON:   /tmp/p31_launch_readiness.json (override with P31_LAUNCH_REPORT)
 *   - HTML:   launch-readiness.html (root) + p31ca public mirror when present
 *   - Log:    ~/.p31/launch-log.jsonl (append; not committed)
 */
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runCheck } from "./lib/launch/lane-runners.mjs";
import { buildNarrative, nextOne } from "./lib/launch/narrate.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const REPORT_OUT = process.env.P31_LAUNCH_REPORT || "/tmp/p31_launch_readiness.json";
const HTML_OUT_ROOT = path.join(root, "launch-readiness.html");
const HTML_OUT_HUB = path.join(root, "andromeda/04_SOFTWARE/p31ca/public/launch-readiness.html");
const LOG_DIR = path.join(os.homedir(), ".p31");
const LOG_FILE = path.join(LOG_DIR, "launch-log.jsonl");
const GLASS_REPORT = process.env.P31_GLASS_REPORT || "/tmp/p31_glass_report.json";
const CONFIG_PATH = path.join(root, "p31-launch-readiness-config.json");

function parseArgs() {
  const argv = process.argv.slice(2);
  let mode = "audit";
  let json = false;
  let brief = false;
  let noLog = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--mode" && argv[i + 1]) {
      mode = argv[++i];
    } else if (a === "--json") json = true;
    else if (a === "--brief") brief = true;
    else if (a === "--no-log") noLog = true;
  }
  if (!["audit", "rehearsal", "gate"].includes(mode)) {
    console.error(`launch-readiness: invalid mode ${mode}`);
    process.exit(2);
  }
  return { mode, json, brief, noLog };
}

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error("launch-readiness: missing p31-launch-readiness-config.json");
    process.exit(1);
  }
  const j = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  if (j.schema !== "p31.launchReadinessConfig/0.1.0") {
    console.error("launch-readiness: bad schema", j.schema);
    process.exit(1);
  }
  return j;
}

function readGlassReport(mode) {
  if (mode === "rehearsal") {
    const r = spawnSync("npm", ["run", "ecosystem:glass"], { cwd: root, stdio: "inherit" });
    if (r.status !== 0) {
      console.warn("launch-readiness: ecosystem:glass exited non-zero (continuing rehearsal)");
    }
  }
  if (!fs.existsSync(GLASS_REPORT)) return null;
  try {
    return JSON.parse(fs.readFileSync(GLASS_REPORT, "utf8"));
  } catch {
    return null;
  }
}

function gitInfo() {
  try {
    const head = execFileSync("git", ["-C", root, "rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();
    const branch = execFileSync("git", ["-C", root, "rev-parse", "--abbrev-ref", "HEAD"], { encoding: "utf8" }).trim();
    return { head, branch };
  } catch {
    return { head: null, branch: null };
  }
}

function colorFor(status) {
  if (status === "pass") return "\x1b[32m";
  if (status === "warn") return "\x1b[33m";
  if (status === "fail") return "\x1b[31m";
  if (status === "skip") return "\x1b[90m";
  return "";
}

/**
 * @param {any} cfg
 * @param {string} mode
 */
function runLanes(cfg, mode) {
  const allowSkip = new Set((cfg.modes && cfg.modes[mode] && cfg.modes[mode].allowSkip) || []);
  const glassReport = readGlassReport(mode);
  const ctx = { root, mode, glassReport, allowSkip };

  const lanes = [];
  let totalScore = 0;
  const blockers = [];
  const warnings = [];
  let humanGatesPending = 0;

  for (const lane of cfg.lanes) {
    const checks = [];
    let passes = 0;
    let total = 0;
    let critFail = false;
    for (const check of lane.checks) {
      const result = runCheck(check, ctx);
      checks.push({
        id: check.id,
        kind: check.kind,
        status: result.status,
        reason: result.reason || "",
        evidence: result.evidence,
        durationMs: result.durationMs,
        critical: !!check.critical,
      });
      if (result.status === "skip") continue;
      total++;
      if (result.status === "pass") passes++;
      else if (result.status === "warn") passes += 0.5;
      if (result.status === "fail" && check.critical) critFail = true;
    }
    const ratio = total > 0 ? passes / total : 0;
    const weight = lane.weight || 0;
    const laneScore = critFail ? 0 : weight * ratio;

    let status;
    if (critFail) {
      status = "fail";
    } else if (ratio === 1) status = "pass";
    else if (ratio >= 0.5) status = "warn";
    else status = "fail";

    if (status === "fail") {
      blockers.push(`${lane.id}: ${checks.find((c) => c.status === "fail")?.reason || "lane fail"}`);
    } else if (status === "warn") {
      const w = checks.find((c) => c.status === "warn") || checks.find((c) => c.status === "fail");
      if (w) warnings.push(`${lane.id}: ${w.reason}`);
    }

    if (lane.id === "human-gate") {
      const ev = checks[0]?.evidence;
      if (ev) humanGatesPending = (ev.pendingCritical?.length || 0) + (ev.blocked?.length || 0);
    }

    lanes.push({ id: lane.id, title: lane.title, weight, score: Number(laneScore.toFixed(2)), status, checks });
    totalScore += laneScore;
  }

  const ready = totalScore >= cfg.thresholds.ready && blockers.length === 0;
  return { lanes, score: Number(totalScore.toFixed(2)), blockers, warnings, humanGatesPending, ready };
}

function writeJsonReport(report) {
  fs.mkdirSync(path.dirname(REPORT_OUT), { recursive: true });
  fs.writeFileSync(REPORT_OUT, JSON.stringify(report, null, 2) + "\n", "utf8");
}

function writeHtmlDashboards(report) {
  const html = renderHtml(report);
  fs.writeFileSync(HTML_OUT_ROOT, html, "utf8");
  if (fs.existsSync(path.dirname(HTML_OUT_HUB))) {
    fs.writeFileSync(HTML_OUT_HUB, html, "utf8");
  }
}

function appendLog(report) {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
  const entry = {
    ts: report.generatedAt,
    mode: report.mode,
    score: report.summary.score,
    ready: report.summary.ready,
    blockers: report.summary.blockers,
    git: report.git,
    nextOne: report.nextOne,
  };
  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + "\n", "utf8");
}

function renderHtml(report) {
  const s = report.summary;
  const tier = s.ready ? "go" : s.score >= 75 ? "hold" : "no-go";
  const lanesHtml = report.lanes
    .map((L) => {
      const checks = L.checks
        .map(
          (c) =>
            `<li class="lr-check lr-${c.status}"><code>${escapeHtml(c.id)}</code> · ${escapeHtml(c.status)} · ${escapeHtml(
              c.reason || ""
            )}</li>`
        )
        .join("");
      return `<section class="lr-lane lr-${L.status}">
        <h3><span class="lr-dot lr-${L.status}"></span> ${escapeHtml(L.title)} <small>(${L.score}/${L.weight})</small></h3>
        <ul>${checks}</ul></section>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="en" data-p31-appearance="hub" style="color-scheme: dark;">
<head>
<meta charset="utf-8" />
<script>(function(){var r=document.documentElement;if(/[?&]alive=1(?:&|$)/.test(location.search))return;r.classList.add("p31-gray-rock");function wake(){r.classList.remove("p31-gray-rock")}document.addEventListener("pointerdown",wake,{once:true,capture:true});document.addEventListener("keydown",wake,{once:true,capture:true})})();</script>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
<meta name="color-scheme" content="dark" />
<meta name="theme-color" content="#0f1115" />
<title>P31 — launch readiness · ${tier.toUpperCase()} (${s.score}/100)</title>
<meta name="description" content="P31 launch readiness — ${s.ready ? "ready" : "hold"}; auto-generated p31.launchReadiness/0.1.0." />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />
<style>
  :root { --void:#0f1115; --cloud:#e5e7eb; --muted:#9ca3af; --cyan:#2dd4bf; }
  body { margin:0; background:var(--void); color:var(--cloud); font-family:"Atkinson Hyperlegible",ui-sans-serif,system-ui,sans-serif; line-height:1.55; }
  main { max-width:64rem; margin:0 auto; padding:2.25rem 1rem 4rem; }
  h1 { font-size:1.5rem; margin:0 0 0.5rem; letter-spacing:-0.02em; }
  .lr-meta { color:var(--muted); font-size:0.85rem; font-family:"JetBrains Mono",ui-monospace,monospace; margin-bottom:1.5rem; }
  .lr-headline { padding:1rem 1.25rem; border-radius:0.625rem; border:1px solid rgba(148,163,184,0.25); background:rgba(255,255,255,0.02); margin-bottom:1.5rem; }
  .lr-headline.go { border-color:rgba(45,212,191,0.55); }
  .lr-headline.hold { border-color:rgba(251,191,36,0.45); }
  .lr-headline.no-go { border-color:rgba(239,68,68,0.55); }
  .lr-tier { font-weight:700; letter-spacing:0.04em; text-transform:uppercase; }
  .lr-tier.go { color:#34d399; } .lr-tier.hold { color:#fcd34d; } .lr-tier.no-go { color:#fca5a5; }
  .lr-score { font-family:"JetBrains Mono",ui-monospace,monospace; font-size:1.25rem; }
  .lr-narrative { white-space:pre-wrap; margin:0.5rem 0 0; color:var(--cloud); font-size:0.95rem; }
  .lr-next { margin-top:0.5rem; padding:0.65rem 0.9rem; border-radius:0.4rem; background:rgba(45,212,191,0.08); color:#a7f3d0; font-family:"JetBrains Mono",ui-monospace,monospace; font-size:0.85rem; }
  section.lr-lane { padding:0.85rem 1rem; border-radius:0.5rem; border:1px solid rgba(148,163,184,0.18); margin-bottom:0.75rem; background:rgba(15,17,21,0.55); }
  section.lr-lane h3 { margin:0 0 0.45rem; font-size:1rem; }
  section.lr-lane.pass { border-color:rgba(45,212,191,0.45); }
  section.lr-lane.warn { border-color:rgba(251,191,36,0.45); }
  section.lr-lane.fail { border-color:rgba(239,68,68,0.55); }
  section.lr-lane ul { margin:0; padding-left:1.1rem; font-size:0.85rem; }
  .lr-check { font-family:"JetBrains Mono",ui-monospace,monospace; word-break:break-word; }
  .lr-pass { color:#a7f3d0; } .lr-warn { color:#fcd34d; } .lr-fail { color:#fca5a5; } .lr-skip { color:var(--muted); }
  .lr-dot { display:inline-block; width:0.6rem; height:0.6rem; border-radius:999px; margin-right:0.4rem; vertical-align:middle; }
  .lr-dot.pass { background:#34d399; } .lr-dot.warn { background:#fbbf24; } .lr-dot.fail { background:var(--p31-coral); }
  footer { margin-top:2rem; color:var(--muted); font-size:0.8rem; }
  footer a { color:var(--cyan); }
</style></head>
<body>
<main>
  <header>
    <h1>Launch readiness</h1>
    <div class="lr-meta">${escapeHtml(report.generatedAt)} · mode <code>${escapeHtml(report.mode)}</code> · git <code>${escapeHtml(report.git.branch || "?")}@${escapeHtml(report.git.head || "?")}</code></div>
  </header>
  <div class="lr-headline ${tier}">
    <div><span class="lr-tier ${tier}">${tier.toUpperCase()}</span> · <span class="lr-score">${s.score} / 100</span> · ${report.lanes.filter((L) => L.status === "pass").length}/${report.lanes.length} lanes green${s.humanGatesPending ? " · " + s.humanGatesPending + " human gates pending" : ""}</div>
    <p class="lr-narrative">${escapeHtml(report.narrative)}</p>
    <div class="lr-next">▶ ${escapeHtml(report.nextOne)}</div>
  </div>
  ${lanesHtml}
  <footer>
    Machine source <code>/tmp/p31_launch_readiness.json</code> (local; not publicly served — <code>npm run launch:audit</code> regenerates) ·
    Config <code>p31-launch-readiness-config.json</code> ·
    Checklist <code>p31-launch-checklist.json</code> ·
    <a href="/contracts">/contracts</a> · <a href="/fleet-portal">/fleet-portal</a>
  </footer>
</main>
</body></html>`;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function printConsole(report, opts) {
  const s = report.summary;
  const tier = s.ready ? "GO" : s.score >= 75 ? "HOLD" : "NO-GO";
  const tierColor = tier === "GO" ? "\x1b[32m" : tier === "HOLD" ? "\x1b[33m" : "\x1b[31m";
  console.log(
    `\n${tierColor}${tier}\x1b[0m  score \x1b[1m${s.score}\x1b[0m/100  · mode \x1b[1m${report.mode}\x1b[0m  · ${report.lanes.filter((L) => L.status === "pass").length}/${report.lanes.length} lanes green`
  );
  for (const L of report.lanes) {
    const c = colorFor(L.status);
    console.log(`${c}● \x1b[0m${L.title.padEnd(60)} ${c}${L.status.padEnd(5)}\x1b[0m  ${L.score}/${L.weight}`);
    if (L.status !== "pass") {
      for (const check of L.checks) {
        if (check.status !== "pass" && check.status !== "skip") {
          console.log(`   ${colorFor(check.status)}↳ ${check.id}: ${check.reason}\x1b[0m`);
        }
      }
    }
  }
  console.log("\n" + report.narrative);
  console.log("\n▶ next: " + report.nextOne + "\n");
  if (!opts.brief) {
    console.log(`report  ${REPORT_OUT}`);
    console.log(`html    ${HTML_OUT_ROOT}`);
  }
}

async function main() {
  const opts = parseArgs();
  const cfg = loadConfig();

  const result = runLanes(cfg, opts.mode);

  const report = {
    schema: "p31.launchReadiness/0.1.0",
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    mode: opts.mode,
    git: gitInfo(),
    summary: {
      score: result.score,
      max: 100,
      ready: result.ready,
      blockers: result.blockers,
      warnings: result.warnings,
      humanGatesPending: result.humanGatesPending,
    },
    lanes: result.lanes,
  };
  report.narrative = buildNarrative(report);
  report.nextOne = nextOne(report);

  writeJsonReport(report);
  writeHtmlDashboards(report);
  if (!opts.noLog) appendLog(report);

  if (opts.json) {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  } else if (opts.brief) {
    console.log(report.nextOne);
  } else {
    printConsole(report, opts);
  }

  // Exit semantics:
  //   audit + rehearsal: exit 0 unless any blocker (so you can re-run)
  //   gate: exit 1 unless ready
  if (opts.mode === "gate") {
    process.exit(report.summary.ready ? 0 : 1);
  } else {
    process.exit(report.summary.blockers.length > 0 ? 1 : 0);
  }
}

main();
