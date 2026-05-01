#!/usr/bin/env node
/**
 * P31 reports daemon — sleeps until the next slot boundary (09 / 13 / 19 local),
 * runs `npm run reports:auto`, repeats. Stops cleanly on SIGINT / SIGTERM.
 *
 *   npm run reports:daemon                      # foreground
 *   npm run reports:daemon -- --slots 9,13,19   # custom slots (24h)
 *   npm run reports:daemon -- --once            # run next slot once and exit
 *   npm run reports:daemon -- --status          # print last heartbeat + exit
 *
 * Heartbeat: ~/.p31/reports-daemon.json (no secrets).
 *
 * Missed-slot policy: on startup, if today's morning slot has elapsed and no
 * morning report exists, files one tagged `kind=morning, summary.note="backfill"`
 * before scheduling the next slot.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const HEARTBEAT = path.join(os.homedir(), ".p31", "reports-daemon.json");

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--") continue;
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) { out[key] = next; i++; }
      else out[key] = true;
    } else out._.push(a);
  }
  return out;
}

function slotKindForHour(h, slots) {
  // Map hour -> aggregate kind. Default: 9→morning, 13→midday, 19→evening.
  const map = slots || { 9: "morning", 13: "midday", 19: "evening" };
  return map[h] || "custom";
}

function nextSlot(now, slotMap) {
  const hours = Object.keys(slotMap).map((h) => Number(h)).sort((a, b) => a - b);
  for (const h of hours) {
    const candidate = new Date(now);
    candidate.setHours(h, 0, 30, 0); // +30s grace so kind detection is stable
    if (candidate > now) return { ts: candidate, hour: h, kind: slotMap[h] };
  }
  // wrap to tomorrow
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(hours[0], 0, 30, 0);
  return { ts: tomorrow, hour: hours[0], kind: slotMap[hours[0]] };
}

function writeHeartbeat(state) {
  fs.mkdirSync(path.dirname(HEARTBEAT), { recursive: true });
  fs.writeFileSync(HEARTBEAT, JSON.stringify({ schema: "p31.reportsDaemon/0.1.0", ...state }, null, 2) + "\n", "utf8");
}

function readHeartbeat() {
  if (!fs.existsSync(HEARTBEAT)) return null;
  try { return JSON.parse(fs.readFileSync(HEARTBEAT, "utf8")); } catch { return null; }
}

function runReportsAuto(kind, { force = false } = {}) {
  return new Promise((resolve) => {
    const args = [path.join(root, "scripts/p31-reports.mjs"), kind || "auto", "--brief"];
    if (force) args.push("--force");
    const child = spawn("node", args, { cwd: root, stdio: "pipe" });
    let out = "";
    child.stdout.on("data", (b) => { out += b.toString(); });
    child.stderr.on("data", (b) => { out += b.toString(); });
    child.on("close", (code) => resolve({ code, output: out }));
  });
}

async function backfillMissedToday(slotMap) {
  // For any slot whose hour has passed today and which has no report today, file one (no force needed).
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
  const { loadAllEnvelopes } = await import("./lib/reports/filing.mjs");
  const all = loadAllEnvelopes();
  const filed = new Set(all.filter((e) => e.ts.startsWith(today)).map((e) => e.kind));
  const hours = Object.keys(slotMap).map((h) => Number(h)).sort((a, b) => a - b);
  const backfills = [];
  for (const h of hours) {
    const kind = slotMap[h];
    if (h <= now.getHours() && !filed.has(kind)) {
      const r = await runReportsAuto(kind, { force: false });
      backfills.push({ kind, hour: h, exit: r.code });
    }
  }
  return backfills;
}

const args = parseArgs(process.argv.slice(2));

if (args.status) {
  const hb = readHeartbeat();
  if (!hb) {
    console.log("reports:daemon: no heartbeat yet (~/.p31/reports-daemon.json missing)");
    process.exit(1);
  }
  console.log(JSON.stringify(hb, null, 2));
  process.exit(0);
}

let slotMap = { 9: "morning", 13: "midday", 19: "evening" };
if (args.slots && typeof args.slots === "string") {
  slotMap = {};
  const order = ["morning", "midday", "evening"];
  args.slots.split(",").map((s) => Number(s.trim())).filter(Number.isFinite).sort((a,b)=>a-b).forEach((h, i) => {
    slotMap[h] = order[i] || `custom-${i+1}`;
  });
}

let stop = false;
process.on("SIGINT", () => { stop = true; console.log("\nreports:daemon: SIGINT — stopping after current step"); });
process.on("SIGTERM", () => { stop = true; });

console.log(`reports:daemon: pid=${process.pid} slots=${JSON.stringify(slotMap)}`);
writeHeartbeat({ pid: process.pid, started: new Date().toISOString(), slots: slotMap, state: "starting" });

(async () => {
  // 1) Backfill missed today
  const missed = await backfillMissedToday(slotMap);
  if (missed.length) console.log(`reports:daemon: backfilled missed slots: ${missed.map((m) => m.kind).join(", ")}`);

  while (!stop) {
    const now = new Date();
    const slot = nextSlot(now, slotMap);
    const sleepMs = Math.max(1000, slot.ts.getTime() - now.getTime());
    writeHeartbeat({
      pid: process.pid,
      now: now.toISOString(),
      nextSlot: { ts: slot.ts.toISOString(), kind: slot.kind, hour: slot.hour },
      state: "waiting",
      slots: slotMap,
      missed,
    });
    console.log(`reports:daemon: next ${slot.kind} at ${slot.ts.toISOString()} (sleep ${(sleepMs/1000).toFixed(0)}s)`);
    if (args.once) {
      // sleep until then, run, exit
      await new Promise((r) => setTimeout(r, sleepMs));
      const out = await runReportsAuto(slot.kind);
      console.log(out.output.trimEnd());
      writeHeartbeat({ pid: process.pid, lastRun: { kind: slot.kind, ts: new Date().toISOString(), exit: out.code }, state: "exited-once", slots: slotMap });
      process.exit(out.code || 0);
    }
    await sleep(sleepMs, () => stop);
    if (stop) break;
    const out = await runReportsAuto(slot.kind);
    console.log(out.output.trimEnd());
    writeHeartbeat({
      pid: process.pid,
      lastRun: { kind: slot.kind, ts: new Date().toISOString(), exit: out.code },
      state: "ran",
      slots: slotMap,
    });
    // small post-run delay to cross the slot boundary
    await sleep(60_000, () => stop);
  }
  writeHeartbeat({ pid: process.pid, stopped: new Date().toISOString(), state: "stopped", slots: slotMap });
  console.log("reports:daemon: stopped");
})();

function sleep(ms, shouldStop) {
  return new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      if (shouldStop && shouldStop()) return resolve();
      if (Date.now() - start >= ms) return resolve();
      setTimeout(tick, Math.min(1000, ms));
    };
    tick();
  });
}
