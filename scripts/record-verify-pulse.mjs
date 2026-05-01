#!/usr/bin/env node
/**
 * Append one entry to docs/verify-pulse.json (`p31.verifyPulse/0.1.0`).
 * Records: ts, git head, branch, durationMs, stepCount, command, exit.
 * Trims history to last `limit` entries (default 20).
 *
 *   npm run pulse                          # auto-record (zero duration; assumes you just ran verify)
 *   npm run pulse -- --ms 12345 --steps 22 # record a real timed run
 *   npm run pulse -- --command "release:check" --steps 30 --ms 50000
 *
 * Convenience wrapper:
 *   npm run verify:pulse                   # runs verify, records a pulse on success
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const FILE = path.join(root, "docs", "verify-pulse.json");

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--") continue;
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) { out[key] = next; i++; }
      else out[key] = true;
    }
  }
  return out;
}

function git(args, fallback = "") {
  try { return execFileSync("git", ["-C", root, ...args], { encoding: "utf8" }).trim(); }
  catch { return fallback; }
}

const args = parseArgs(process.argv.slice(2));
const limit = Number(args.limit) || 20;

let pulse;
try {
  pulse = JSON.parse(fs.readFileSync(FILE, "utf8"));
} catch {
  pulse = { schema: "p31.verifyPulse/0.1.0", version: "1.0.0", limit, count: 0, lastSuccess: null, history: [] };
}
if (pulse.schema !== "p31.verifyPulse/0.1.0") {
  console.error("record-verify-pulse: schema mismatch:", pulse.schema);
  process.exit(2);
}

const entry = {
  ts: new Date().toISOString(),
  command: args.command || "verify",
  exit: Number(args.exit) || 0,
  durationMs: Number(args.ms) || 0,
  stepCount: Number(args.steps) || 0,
  git: { head: git(["rev-parse", "--short", "HEAD"], "unknown"), branch: git(["rev-parse", "--abbrev-ref", "HEAD"], "unknown") },
};

pulse.history = [entry, ...(pulse.history || [])].slice(0, limit);
pulse.count = pulse.history.length;
pulse.limit = limit;
pulse.generatedAt = entry.ts;
if (entry.exit === 0) pulse.lastSuccess = { ts: entry.ts, git: entry.git, command: entry.command };

fs.writeFileSync(FILE, JSON.stringify(pulse, null, 2) + "\n", "utf8");

console.log(`record-verify-pulse: ${entry.command} exit=${entry.exit} ms=${entry.durationMs} steps=${entry.stepCount} git=${entry.git.head} → ${path.relative(root, FILE)}`);
console.log(`record-verify-pulse: history=${pulse.count}/${pulse.limit} lastSuccess=${pulse.lastSuccess?.ts || "—"}`);
