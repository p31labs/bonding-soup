#!/usr/bin/env node
/**
 * Tag in / out for operator focus (local audit trail, glass box shows last state).
 *   node scripts/operator-shift.mjs in [--note "…"]
 *   node scripts/operator-shift.mjs out [--note "…"]
 *   node scripts/operator-shift.mjs status
 * Log: ~/.p31/operator-shift.jsonl (not committed)
 */
import fs from "node:fs";
import path from "node:path";
import os, { homedir } from "node:os";

const sub = process.argv[2] || "status";
const rest = process.argv.slice(3);
let note = "";
for (let i = 0; i < rest.length; i++) {
  if (rest[i] === "--note" && rest[i + 1]) {
    note = rest[i + 1];
    i++;
  }
}

const dir = path.join(homedir(), ".p31");
const logFile = path.join(dir, "operator-shift.jsonl");

function ensureDir() {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readLines() {
  if (!fs.existsSync(logFile)) return [];
  return fs
    .readFileSync(logFile, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean);
}

function parseArgsNote() {
  return note || process.env.P31_SHIFT_NOTE || "";
}

function append(entry) {
  ensureDir();
  fs.appendFileSync(logFile, JSON.stringify(entry) + "\n", "utf8");
}

if (sub === "in" || sub === "out") {
  const entry = {
    t: new Date().toISOString(),
    action: sub,
    user: process.env.USER || process.env.USERNAME || "unknown",
    host: os.hostname(),
    note: parseArgsNote(),
  };
  append(entry);
  console.log(`Operator ${sub === "in" ? "tagged IN" : "tagged OUT"} — ${logFile}`);
  process.exit(0);
}

if (sub === "status") {
  const lines = readLines();
  let lastIn = null;
  let lastOut = null;
  for (const line of lines) {
    try {
      const e = JSON.parse(line);
      if (e.action === "in") lastIn = e;
      if (e.action === "out") lastOut = e;
    } catch {
      /* ignore */
    }
  }
  let state = "unknown";
  if (lastIn && lastOut) {
    state = new Date(lastIn.t) > new Date(lastOut.t) ? "in" : "out";
  } else if (lastIn) state = "in";
  else if (lastOut) state = "out";
  console.log(`Operator shift: ${state}`);
  if (lastIn) console.log(`  Last IN:  ${lastIn.t} ${lastIn.note || ""}`);
  if (lastOut) console.log(`  Last OUT: ${lastOut.t} ${lastOut.note || ""}`);
  console.log(`  Log: ${logFile}`);
  process.exit(0);
}

if (sub === "tail") {
  const n = Math.min(20, readLines().length);
  const lines = readLines().slice(-n);
  for (const line of lines) {
    console.log(line);
  }
  process.exit(0);
}

console.error("Usage: node scripts/operator-shift.mjs [in|out|status|tail] [--note \"…\"]");
process.exit(1);
