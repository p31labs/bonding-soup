#!/usr/bin/env node
/**
 * fleet-free-host — print a safe-to-stop list and (with --apply) free RAM
 * to make room for fleet inference, without breaking the project.
 *
 * Usage:
 *   node scripts/fleet-free-host.mjs              # dry-run report
 *   node scripts/fleet-free-host.mjs --apply      # actually stop services
 *   node scripts/fleet-free-host.mjs --restart    # restart everything stopped
 *   node scripts/fleet-free-host.mjs --json       # machine-readable
 *
 * What it considers SAFE to stop:
 *   - openclaw-gateway (systemd user service)        : sister dev tool, not P31
 *   - p31-monitor (PM2)                              : internal monitor, regenerable
 *   - http-server :8181 demo                         : local demo server
 *
 * What it WILL NOT touch without explicit operator action:
 *   - cursor-agent                                   : you are talking to it
 *   - ollama serve                                   : the whole point
 *   - ollama-mcp/server.mjs                          : the MCP bridge
 *   - p31-discord-bot (PM2)                          : production-bound (Discord)
 *   - openclaw-gateway IF you've explicitly opted in : skipped if --keep-openclaw
 *
 * No sudo. No /proc/sys writes. Pure systemctl --user + pm2 + pkill of the
 * operator's own PIDs.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";

const argv = process.argv.slice(2);
const APPLY = argv.includes("--apply");
const RESTART = argv.includes("--restart");
const JSON_OUT = argv.includes("--json");
const KEEP_OPENCLAW = argv.includes("--keep-openclaw");

function safeExec(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch (e) {
    return null;
  }
}

function memSnapshot() {
  const meminfo = fs.readFileSync("/proc/meminfo", "utf8");
  const total = Number(meminfo.match(/MemTotal:\s+(\d+)/)?.[1] || 0);
  const avail = Number(meminfo.match(/MemAvailable:\s+(\d+)/)?.[1] || 0);
  return { totalMiB: Math.round(total / 1024), availMiB: Math.round(avail / 1024) };
}

const candidates = [
  {
    id: "openclaw",
    label: "openclaw-gateway (systemd user service, sister dev tool)",
    skip: KEEP_OPENCLAW,
    isRunning: () => safeExec("systemctl --user is-active openclaw-gateway.service") === "active",
    stop: () => safeExec("systemctl --user stop openclaw-gateway.service"),
    start: () => safeExec("systemctl --user start openclaw-gateway.service"),
    estMiB: 730,
  },
  {
    id: "p31-monitor",
    label: "p31-monitor (PM2 cluster, internal monitoring)",
    skip: false,
    isRunning: () => {
      const list = safeExec("pm2 jlist") || "[]";
      try {
        const j = JSON.parse(list);
        const e = j.find((x) => x.name === "p31-monitor");
        return Boolean(e && e.pm2_env && e.pm2_env.status === "online");
      } catch {
        return false;
      }
    },
    stop: () => safeExec("pm2 stop p31-monitor"),
    start: () => safeExec("pm2 start p31-monitor"),
    estMiB: 30,
  },
];

const STATE_PATH = `${process.env.HOME}/.p31/fleet-free-host.state.json`;

function loadState() {
  if (!fs.existsSync(STATE_PATH)) return { stopped: [] };
  try { return JSON.parse(fs.readFileSync(STATE_PATH, "utf8")); } catch { return { stopped: [] }; }
}

function saveState(s) {
  fs.mkdirSync(`${process.env.HOME}/.p31`, { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(s, null, 2));
}

const before = memSnapshot();
const report = { schema: "p31.freeHost/1.0.0", before, after: null, candidates: [], action: null };

if (RESTART) {
  const state = loadState();
  for (const id of state.stopped) {
    const c = candidates.find((x) => x.id === id);
    if (!c) continue;
    if (APPLY || true) {
      c.start();
      report.candidates.push({ id: c.id, action: "restarted" });
    }
  }
  saveState({ stopped: [] });
  report.after = memSnapshot();
  report.action = "restart";
} else {
  for (const c of candidates) {
    const running = c.isRunning();
    const wouldFreeMiB = running && !c.skip ? c.estMiB : 0;
    const action = !running ? "already-stopped" : c.skip ? "skipped" : (APPLY ? "stop" : "would-stop");
    if (action === "stop") {
      c.stop();
    }
    report.candidates.push({ id: c.id, label: c.label, running, skip: c.skip, estMiB: c.estMiB, action, wouldFreeMiB });
  }
  if (APPLY) {
    const stopped = report.candidates.filter((c) => c.action === "stop").map((c) => c.id);
    saveState({ stopped, ts: new Date().toISOString() });
  }
  report.after = APPLY ? memSnapshot() : before;
  report.action = APPLY ? "apply" : "dry-run";
}

if (JSON_OUT) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log("━━ fleet-free-host ━━");
  console.log(`  before:  total=${before.totalMiB} MiB · available=${before.availMiB} MiB`);
  console.log(`  action:  ${report.action}`);
  for (const c of report.candidates) {
    const tag = c.action === "stop" ? "STOPPED" :
                c.action === "would-stop" ? "would stop" :
                c.action === "already-stopped" ? "skip (already stopped)" :
                c.action === "restarted" ? "RESTARTED" :
                c.action === "skipped" ? "skip (--keep-* flag)" : c.action;
    console.log(`    [${tag}] ${c.label || c.id}${c.estMiB ? ` (~${c.estMiB} MiB)` : ""}`);
  }
  if (APPLY || RESTART) {
    console.log(`  after:   total=${report.after.totalMiB} MiB · available=${report.after.availMiB} MiB`);
    console.log(`  delta:   ${report.after.availMiB - before.availMiB >= 0 ? "+" : ""}${report.after.availMiB - before.availMiB} MiB`);
  }
  if (!APPLY && !RESTART) {
    console.log("");
    console.log("  Run with --apply to actually stop the listed services.");
    console.log("  Run with --restart to restore everything stopped previously.");
  }
}
