#!/usr/bin/env node
/**
 * P31 reports inbox watcher — drop a file in ~/.p31/inbox/urgent/ and an urgent
 * report is filed automatically. The original is moved to ~/.p31/inbox/processed/.
 *
 * File formats accepted:
 *   - *.txt / *.md  : first line = headline, rest = details. Optional front-matter
 *                     via `severity: high\ncategory: incident\n---\n` at top.
 *   - *.json        : { headline, severity?, category?, details? }
 *
 *   npm run reports:inbox                    # one-shot: drain inbox now
 *   npm run reports:inbox -- --watch         # poll every 10s until SIGINT
 *   npm run reports:inbox -- --watch --interval 5
 *   npm run reports:inbox -- --dir <path>    # alternate inbox dir (e.g. cloud-synced)
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

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
const args = parseArgs(process.argv.slice(2));

const INBOX = args.dir ? path.resolve(args.dir) : path.join(os.homedir(), ".p31", "inbox", "urgent");
const PROCESSED = args.dir ? path.join(path.dirname(INBOX), "processed") : path.join(os.homedir(), ".p31", "inbox", "processed");

fs.mkdirSync(INBOX, { recursive: true });
fs.mkdirSync(PROCESSED, { recursive: true });

function parseEntry(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const raw = fs.readFileSync(filePath, "utf8").trim();
  if (ext === ".json") {
    try {
      const j = JSON.parse(raw);
      if (!j.headline) throw new Error("json must include `headline`");
      return { headline: j.headline, severity: j.severity, category: j.category, details: j.details };
    } catch (e) { return { error: `bad json: ${e.message}` }; }
  }
  // txt / md
  let body = raw;
  let meta = {};
  const blockMatch = raw.match(/^([\s\S]+?)\n---\n([\s\S]*)$/);
  if (blockMatch) {
    const head = blockMatch[1];
    body = blockMatch[2];
    for (const line of head.split("\n")) {
      const m = line.match(/^(\w+):\s*(.+)$/);
      if (m) meta[m[1].toLowerCase()] = m[2].trim();
    }
  }
  const lines = body.trim().split("\n");
  const headline = (meta.headline || lines.shift() || "").trim();
  const details = lines.join("\n").trim();
  if (!headline) return { error: "empty file (need a headline on the first line)" };
  return { headline, severity: meta.severity, category: meta.category, details };
}

function fileUrgent(entry) {
  return new Promise((resolve) => {
    const args = [
      path.join(root, "scripts/p31-reports.mjs"),
      "urgent",
      entry.headline,
      "--severity", entry.severity || "high",
      "--category", entry.category || "incident",
    ];
    if (entry.details) { args.push("--details", entry.details); }
    const child = spawn("node", args, { cwd: root, stdio: "pipe" });
    let out = "";
    child.stdout.on("data", (b) => out += b.toString());
    child.stderr.on("data", (b) => out += b.toString());
    child.on("close", (code) => resolve({ code, output: out }));
  });
}

async function drainInbox() {
  const files = fs.readdirSync(INBOX).filter((f) => /\.(txt|md|json)$/i.test(f)).sort();
  if (!files.length) {
    console.log(`reports:inbox: empty (${INBOX})`);
    return 0;
  }
  let processed = 0;
  for (const f of files) {
    const full = path.join(INBOX, f);
    const entry = parseEntry(full);
    if (entry.error) {
      console.error(`  ✗ ${f}: ${entry.error}`);
      const dest = path.join(PROCESSED, `error-${Date.now()}-${f}`);
      fs.renameSync(full, dest);
      continue;
    }
    const r = await fileUrgent(entry);
    const ok = r.code === 0;
    console.log(`  ${ok ? "✓" : "✗"} ${f} → urgent: ${entry.headline} (${entry.severity || "high"})`);
    if (!ok) console.log(r.output.split("\n").slice(-5).map((l) => "    " + l).join("\n"));
    const dest = path.join(PROCESSED, `${ok ? "ok" : "err"}-${Date.now()}-${f}`);
    fs.renameSync(full, dest);
    processed++;
  }
  return processed;
}

(async () => {
  if (!args.watch) {
    const n = await drainInbox();
    console.log(`reports:inbox: processed ${n} file(s) from ${INBOX}`);
    return;
  }
  const seconds = Number(args.interval) || 10;
  console.log(`reports:inbox: watching ${INBOX} every ${seconds}s (SIGINT to stop)`);
  let stop = false;
  process.on("SIGINT", () => { stop = true; });
  process.on("SIGTERM", () => { stop = true; });
  while (!stop) {
    await drainInbox();
    await new Promise((r) => setTimeout(r, seconds * 1000));
  }
  console.log("reports:inbox: stopped");
})();
