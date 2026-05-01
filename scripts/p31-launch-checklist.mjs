#!/usr/bin/env node
/**
 * Flip a human-gate checklist row.
 *
 *   npm run launch:check                              # status table
 *   npm run launch:check -- <id> met|pending|blocked  # change status
 *   npm run launch:check -- <id> met --note "why"     # change + note
 *   npm run launch:check -- --list-ids                # list ids
 *
 * Appends every change to ~/.p31/launch-log.jsonl (not committed).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const FILE = path.join(root, "p31-launch-checklist.json");
const LOG_DIR = path.join(os.homedir(), ".p31");
const LOG_FILE = path.join(LOG_DIR, "launch-log.jsonl");

const ALLOWED = new Set(["met", "pending", "blocked"]);

function read() {
  if (!fs.existsSync(FILE)) {
    console.error("launch:check: missing p31-launch-checklist.json");
    process.exit(1);
  }
  const j = JSON.parse(fs.readFileSync(FILE, "utf8"));
  if (j.schema !== "p31.launchChecklist/0.1.0") {
    console.error("launch:check: bad schema", j.schema);
    process.exit(1);
  }
  return j;
}

function write(j) {
  fs.writeFileSync(FILE, JSON.stringify(j, null, 2) + "\n", "utf8");
}

function listIds() {
  const j = read();
  for (const g of j.gates) console.log(g.id);
}

function showTable() {
  const j = read();
  const padId = Math.max(...j.gates.map((g) => g.id.length));
  console.log(`\nP31 launch checklist  (${j.gates.length} gates)\n`);
  for (const g of j.gates) {
    const dot = g.status === "met" ? "\x1b[32m●\x1b[0m" : g.status === "blocked" ? "\x1b[31m●\x1b[0m" : "\x1b[33m○\x1b[0m";
    const crit = g.critical ? "\x1b[1m*\x1b[0m" : " ";
    console.log(`${dot} ${crit} ${g.id.padEnd(padId)}  ${g.status.padEnd(8)}  ${g.title}`);
    if (g.note) console.log(`         note: ${g.note}`);
  }
  console.log("\n* = critical (gate mode requires 'met')");
  console.log("Use:  npm run launch:check -- <id> met|pending|blocked [--note '…']");
}

function setStatus(id, status, noteArg) {
  if (!ALLOWED.has(status)) {
    console.error(`launch:check: invalid status '${status}' (use met|pending|blocked)`);
    process.exit(2);
  }
  const j = read();
  const g = j.gates.find((x) => x.id === id);
  if (!g) {
    console.error(`launch:check: unknown id '${id}'`);
    process.exit(2);
  }
  const previous = g.status;
  g.status = status;
  g.updatedAt = new Date().toISOString();
  if (noteArg !== undefined) g.note = noteArg;
  write(j);

  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
  fs.appendFileSync(
    LOG_FILE,
    JSON.stringify({
      ts: g.updatedAt,
      kind: "launch-checklist",
      id,
      from: previous,
      to: status,
      note: noteArg || g.note || null,
    }) + "\n",
    "utf8"
  );
  console.log(`launch:check: ${id}  ${previous} → ${status}${noteArg ? "  (" + noteArg + ")" : ""}`);
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("--list-ids")) {
    listIds();
    return;
  }
  if (args.length === 0) {
    showTable();
    return;
  }
  let id = null;
  let status = null;
  let note;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--") continue;
    if (a === "--note" && args[i + 1] !== undefined) {
      note = args[++i];
    } else if (id === null) id = a;
    else if (status === null) status = a;
  }
  if (id && status) {
    setStatus(id, status, note);
    return;
  }
  console.error("launch:check: provide <id> <status> or no args for table");
  process.exit(2);
}

main();
