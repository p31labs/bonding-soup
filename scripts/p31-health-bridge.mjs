#!/usr/bin/env node
/**
 * p31-health-bridge — Aggregate operator health data for the rest of the system.
 *
 * Reads spoon-state.json, operator-shift.jsonl, and a health event log;
 * produces ~/.p31/health-summary.json (consumed by reports, glass box, command center)
 * and prints a CLI status view.
 *
 *   npm run health:bridge                # status view only
 *   npm run health:bridge -- --summary   # write summary JSON; print table
 *   npm run health:bridge -- --log       # add a health event
 *     --type calcium|spoons|sleep|meds|note
 *     --value <number or string>
 *     --note "optional note"
 *   npm run health:bridge -- --init      # (re)create config defaults
 *   npm run health:bridge -- --json      # JSON stdout only
 *
 * Files:
 *   - p31-health-config.json            thresholds & targets
 *   - ~/.p31/health.jsonl               append-only event log
 *   - ~/.p31/health-summary.json        machine-readable output
 *   - andromeda/spoon-state.json        current spoon level (legacy)
 *   - ~/.p31/operator-shift.jsonl       operator focus log
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const HOME = os.homedir();
const P31_DIR = path.join(HOME, ".p31");

const CONFIG_REL = "p31-health-config.json";
const SPOON_PATH = path.join(ROOT, "..", "andromeda", "spoon-state.json");
const EVENT_LOG = path.join(P31_DIR, "health.jsonl");
const SUMMARY_FILE = path.join(P31_DIR, "health-summary.json");
const SHIFT_LOG = path.join(P31_DIR, "operator-shift.jsonl");

const EVENT_TYPES = ["calcium", "spoons", "sleep", "meds", "note"];
const LEVEL_NAMES = { 5: "full", 4: "good", 3: "moderate", 2: "low", 1: "depleted" };

function readJson(p) {
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; }
}

function readLines(p) {
  if (!fs.existsSync(p)) return [];
  return fs.readFileSync(p, "utf8").trim().split("\n").filter(Boolean);
}

function linesToEvents(lines) {
  return lines.map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function resolvePath(p) {
  if (p.startsWith("~/")) return path.join(HOME, p.slice(2));
  return path.resolve(ROOT, p);
}

function parseArgs(argv) {
  const out = { cmd: "status", type: null, value: null, note: "", json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--") continue;
    if (a === "--json") { out.json = true; continue; }
    if (a === "--summary") { out.cmd = "summary"; continue; }
    if (a === "--init") { out.cmd = "init"; continue; }
    if (a === "--log") { out.cmd = "log"; continue; }
    if (a === "--type" && argv[i + 1]) { out.type = argv[++i]; continue; }
    if (a === "--value" && argv[i + 1]) { out.value = argv[++i]; continue; }
    if (a === "--note" && argv[i + 1]) { out.note = argv[++i]; continue; }
  }
  return out;
}

function getSpoonLevel() {
  const s = readJson(SPOON_PATH);
  if (s && typeof s.level === "number") return s.level;
  return null;
}

function getShiftStatus() {
  const lines = readLines(SHIFT_LOG);
  if (!lines.length) return { state: "unknown", lastIn: null, lastOut: null };
  let lastIn = null, lastOut = null;
  for (const line of lines) {
    try {
      const e = JSON.parse(line);
      if (e.action === "in") lastIn = e;
      if (e.action === "out") lastOut = e;
    } catch {}
  }
  let state = "unknown";
  if (lastIn && lastOut) {
    state = new Date(lastIn.t) > new Date(lastOut.t) ? "in" : "out";
  } else if (lastIn) state = "in";
  else if (lastOut) state = "out";
  return { state, lastIn, lastOut };
}

function getConfig() {
  const p = path.join(ROOT, CONFIG_REL);
  return readJson(p) || {};
}

function loadEvents(retentionDays) {
  const lines = readLines(EVENT_LOG);
  const events = linesToEvents(lines);
  if (!retentionDays || retentionDays <= 0) return events;
  const cutoff = Date.now() - retentionDays * 86400 * 1000;
  return events.filter((e) => new Date(e.t).getTime() >= cutoff);
}

function computeTrends(events) {
  const spoons = events.filter((e) => e.type === "spoons" && typeof e.value === "number");
  const calcium = events.filter((e) => e.type === "calcium" && typeof e.value === "number");
  const sleep = events.filter((e) => e.type === "sleep" && typeof e.value === "number");

  function avg(arr) {
    if (!arr.length) return null;
    return arr.reduce((s, e) => s + e.value, 0) / arr.length;
  }

  function last(arr) {
    if (!arr.length) return null;
    return arr[arr.length - 1].value;
  }

  function recentAvg(arr, days) {
    const cutoff = Date.now() - days * 86400 * 1000;
    const recent = arr.filter((e) => new Date(e.t).getTime() >= cutoff);
    return avg(recent);
  }

  return {
    spoons: {
      current: getSpoonLevel(),
      avg7d: recentAvg(spoons, 7),
      avg30d: recentAvg(spoons, 30),
      lastReported: last(spoons),
      events7d: spoons.filter((e) => new Date(e.t).getTime() >= Date.now() - 7 * 86400 * 1000).length,
    },
    calcium: {
      avg7d: recentAvg(calcium, 7),
      avg30d: recentAvg(calcium, 30),
      lastValue: last(calcium),
      events7d: calcium.filter((e) => new Date(e.t).getTime() >= Date.now() - 7 * 86400 * 1000).length,
    },
    sleep: {
      avg7d: recentAvg(sleep, 7),
      avg30d: recentAvg(sleep, 30),
      lastValue: last(sleep),
      events7d: sleep.filter((e) => new Date(e.t).getTime() >= Date.now() - 7 * 86400 * 1000).length,
    },
  };
}

function assessCalcium(config, trends) {
  const cc = config.calcium || {};
  const last = trends.calcium.lastValue;
  if (last === null) return { status: "unknown", label: "Unknown", note: "No calcium readings logged" };
  if (last <= cc.criticalLow) return { status: "critical", label: "CRITICAL LOW", note: `Ca ${last} mg/dL — below critical threshold ${cc.criticalLow}` };
  if (last <= cc.targetLow) return { status: "caution", label: "Low", note: `Ca ${last} mg/dL — below target range ${cc.targetLow}–${cc.targetHigh}` };
  if (last >= cc.criticalHigh) return { status: "critical", label: "CRITICAL HIGH", note: `Ca ${last} mg/dL — above critical threshold ${cc.criticalHigh}` };
  if (last >= cc.targetHigh) return { status: "caution", label: "Elevated", note: `Ca ${last} mg/dL — above target range ${cc.targetLow}–${cc.targetHigh}` };
  return { status: "ok", label: "In range", note: `Ca ${last} mg/dL in target ${cc.targetLow}–${cc.targetHigh}` };
}

function assessSpoons(config, trends) {
  const sc = config.spoons || {};
  const current = trends.spoons.current;
  if (current === null) return { status: "unknown", label: "Unknown", note: "No spoon level set" };
  const name = sc.levelNames && sc.levelNames[String(current)] ? sc.levelNames[String(current)] : `Level ${current}`;
  if (current <= (sc.deficitThreshold || 2)) return { status: "critical", label: "Deficit", note: `Spoons at ${current} (${name}) — deficit mode` };
  if (current <= (sc.cautionThreshold || 3)) return { status: "caution", label: "Low", note: `Spoons at ${current} (${name}) — conserve energy` };
  return { status: "ok", label: "Good", note: `Spoons at ${current} (${name})` };
}

function assessSleep(config, trends) {
  const sc = config.sleep || {};
  const avg = trends.sleep.avg7d;
  if (avg === null) return { status: "unknown", label: "Unknown", note: "No sleep data logged" };
  if (avg < (sc.minimumHours || 5)) return { status: "critical", label: "Severe deficit", note: `Avg ${avg.toFixed(1)}h sleep — below minimum` };
  if (avg < (sc.targetHours || 7)) return { status: "caution", label: "Below target", note: `Avg ${avg.toFixed(1)}h sleep — below ${sc.targetHours || 7}h target` };
  return { status: "ok", label: "Adequate", note: `Avg ${avg.toFixed(1)}h sleep — at or above target` };
}

function buildSummary(config, shift, trends) {
  const calcium = assessCalcium(config, trends);
  const spoons = assessSpoons(config, trends);
  const sleep = assessSleep(config, trends);

  const flags = [];
  if (calcium.status === "critical") flags.push("calcium_critical");
  if (spoons.status === "critical") flags.push("spoon_deficit");
  if (sleep.status === "critical") flags.push("sleep_deficit");
  if (shift.state === "in") flags.push("operator_focused");
  if (shift.state === "out") flags.push("operator_away");
  if (shift.state === "unknown") flags.push("operator_status_unknown");

  return {
    schema: "p31.healthSummary/1.0.0",
    generated: new Date().toISOString(),
    operator: {
      shift: {
        state: shift.state,
        since: shift.lastIn?.t || null,
        note: shift.lastIn?.note || "",
      },
    },
    calcium,
    spoons,
    sleep,
    flags,
    trends: {
      spoons7d: trends.spoons.avg7d,
      spoons30d: trends.spoons.avg30d,
      calcium7d: trends.calcium.avg7d,
      calcium30d: trends.calcium.avg30d,
      sleep7d: trends.sleep.avg7d,
      sleep30d: trends.sleep.avg30d,
    },
    overall: (calcium.status === "critical" || spoons.status === "critical" || sleep.status === "critical")
      ? "critical"
      : (calcium.status === "caution" || spoons.status === "caution" || sleep.status === "caution")
        ? "caution"
        : (calcium.status === "unknown" || spoons.status === "unknown" || sleep.status === "unknown")
          ? "unknown"
          : "ok",
  };
}

function printStatus(summary, jsonOnly) {
  if (jsonOnly) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  const color = (s, c) => {
    const m = { red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m", cyan: "\x1b[36m", gray: "\x1b[90m", bold: "\x1b[1m", reset: "\x1b[0m" };
    return `${m[c] || ""}${s}${m.reset}`;
  };

  const badge = (status) => {
    if (status === "ok") return color("✓", "green");
    if (status === "caution") return color("·", "yellow");
    if (status === "critical") return color("✗", "red");
    return color("?", "gray");
  };

  console.log(`\n  ${color("p31-health-bridge", "cyan")} ${color(new Date().toISOString().slice(0, 10), "gray")}`);
  console.log(`  ${color("─".repeat(48), "gray")}`);
  console.log(`  ${badge(summary.overall)} Overall: ${color(summary.overall.toUpperCase(), summary.overall === "critical" ? "red" : summary.overall === "caution" ? "yellow" : summary.overall === "ok" ? "green" : "gray")}`);

  const line = (icon, label, status, note) => {
    const st = status === "critical" ? "red" : status === "caution" ? "yellow" : status === "ok" ? "green" : "gray";
    console.log(`  ${badge(status)} ${icon} ${color(label.padEnd(14), "bold")} ${note}`);
  };

  line("🫀", "Calcium", summary.calcium.status, summary.calcium.note);
  line("🥄", "Spoons", summary.spoons.status, summary.spoons.note);
  line("🛌", "Sleep", summary.sleep.status, summary.sleep.note);
  line("🎯", "Shift", summary.operator.shift.state === "unknown" ? "notice" : "ok",
    summary.operator.shift.state !== "unknown"
      ? `Operator ${summary.operator.shift.state}`
      : "Shift status unknown");

  if (summary.trends.spoons7d !== null) {
    console.log(`  ${color("Trends (7d avg)", "gray")}: spoons ${summary.trends.spoons7d.toFixed(1)} · Ca ${summary.trends.calcium7d ? summary.trends.calcium7d.toFixed(1) + " mg/dL" : "—"} · sleep ${summary.trends.sleep7d ? summary.trends.sleep7d.toFixed(1) + "h" : "—"}`);
  }

  if (summary.flags.length) {
    console.log(`  ${color("Flags:", "yellow")} ${summary.flags.join(", ")}`);
  }

  console.log(`  ${color("─".repeat(48), "gray")}`);
  console.log(`  Health summary: ${color(SUMMARY_FILE, "cyan")}`);
  console.log(`  Event log:      ${color(EVENT_LOG, "cyan")}`);
  console.log(`  Config:         ${color(path.join(ROOT, CONFIG_REL), "cyan")}\n`);
}

async function cmdLog(opts) {
  if (!opts.type || !EVENT_TYPES.includes(opts.type)) {
    console.error(`Usage: npm run health:bridge -- --log --type ${EVENT_TYPES.join("|")} --value <value>`);
    process.exit(1);
  }
  const val = opts.type === "note" ? (opts.value || opts.note || "") : opts.value;
  if (val === null || val === undefined || val === "") {
    console.error(`Missing --value for type "${opts.type}"`);
    process.exit(1);
  }
  ensureDir(P31_DIR);
  const entry = {
    schema: "p31.healthEvent/1.0.0",
    t: new Date().toISOString(),
    type: opts.type,
    value: opts.type === "spoons" || opts.type === "calcium" || opts.type === "sleep" ? Number(val) : val,
    note: opts.note || "",
  };
  fs.appendFileSync(EVENT_LOG, JSON.stringify(entry) + "\n", "utf8");
  console.log(`Logged health event: ${opts.type} = ${entry.value}`);
}

async function cmdInit() {
  const p = path.join(ROOT, CONFIG_REL);
  if (fs.existsSync(p)) {
    console.log(`Config already exists at ${p}`);
    return;
  }
  const defaults = {
    schema: "p31.healthConfig/1.0.0",
    description: "Operator health thresholds and targets.",
    updated: new Date().toISOString().slice(0, 10),
    calcium: { criticalLow: 8.0, targetLow: 8.3, targetHigh: 9.0, criticalHigh: 9.5, unit: "mg/dL" },
    spoons: { levelNames: { "5": "full", "4": "good", "3": "moderate", "2": "low", "1": "depleted" }, deficitThreshold: 2, cautionThreshold: 3 },
    sleep: { targetHours: 7, minimumHours: 5 },
    medication: { calciumSupplementsDaily: true },
    healthEventRetentionDays: 90,
  };
  fs.writeFileSync(p, JSON.stringify(defaults, null, 2) + "\n", "utf8");
  console.log(`Created config at ${p}`);
}

async function cmdSummary() {
  ensureDir(P31_DIR);
  const config = getConfig();
  const shift = getShiftStatus();
  const events = loadEvents(config.healthEventRetentionDays || 90);
  const trends = computeTrends(events);
  const summary = buildSummary(config, shift, trends);

  fs.writeFileSync(SUMMARY_FILE, JSON.stringify(summary, null, 2) + "\n", "utf8");
  ensureDir(P31_DIR);

  const args = parseArgs(process.argv.slice(2));
  printStatus(summary, args.json);
}

async function cmdStatus() {
  ensureDir(P31_DIR);
  const config = getConfig();
  const shift = getShiftStatus();
  const events = loadEvents(config.healthEventRetentionDays || 90);
  const trends = computeTrends(events);
  const summary = buildSummary(config, shift, trends);

  const args = parseArgs(process.argv.slice(2));
  printStatus(summary, args.json);

  const reportPath = process.env.P31_GLASS_REPORT;
  if (reportPath && fs.existsSync(reportPath)) {
    const glass = readJson(reportPath);
    if (glass) {
      glass.healthSummary = summary;
      try { fs.writeFileSync(reportPath, JSON.stringify(glass, null, 2) + "\n", "utf8"); } catch {}
    }
  }
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(`Usage:
  npm run health:bridge                 Show health status
  npm run health:bridge -- --summary    Write health-summary.json + show status
  npm run health:bridge -- --json       Output as JSON only
  npm run health:bridge -- --init       Create default config
  npm run health:bridge -- --log --type spoons --value 4 --note "Feeling ok"
  npm run health:bridge -- --log --type calcium --value 8.5
  npm run health:bridge -- --log --type sleep --value 6.5
  npm run health:bridge -- --log --type note --value "Had calcium supplement"`);
    return;
  }

  const opts = parseArgs(argv);
  switch (opts.cmd) {
    case "init":
      await cmdInit();
      break;
    case "log":
      await cmdLog(opts);
      break;
    case "summary":
      await cmdSummary();
      break;
    default:
      await cmdStatus();
      break;
  }
}

main().catch((e) => {
  console.error("health-bridge error:", e.message);
  process.exit(1);
});
