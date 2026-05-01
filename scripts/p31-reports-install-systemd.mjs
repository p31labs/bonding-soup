#!/usr/bin/env node
/**
 * Install systemd-user units for P31 reports automation. Idempotent.
 *
 * Writes:
 *   ~/.config/systemd/user/p31-reports-{morning,midday,evening,weekly}.service
 *   ~/.config/systemd/user/p31-reports-{morning,midday,evening,weekly}.timer
 *
 * Then prints the enable lines for the operator.
 *
 *   npm run reports:install-systemd               # dry-run preview
 *   npm run reports:install-systemd -- --apply    # actually write the files
 *   npm run reports:install-systemd -- --uninstall # remove files (no service stop)
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function parseArgs(argv) {
  const out = {};
  for (const a of argv) if (a.startsWith("--")) out[a.slice(2)] = true;
  return out;
}
const args = parseArgs(process.argv.slice(2));

const UNIT_DIR = path.join(os.homedir(), ".config", "systemd", "user");
const NODE_BIN = process.execPath; // honor whichever node you ran with

const SLOTS = [
  { id: "morning", desc: "P31 morning report",  cmd: "morning",  oncalendar: "*-*-* 09:00:00" },
  { id: "midday",  desc: "P31 midday report",   cmd: "midday",   oncalendar: "*-*-* 13:00:00" },
  { id: "evening", desc: "P31 evening report",  cmd: "evening",  oncalendar: "*-*-* 19:00:00" },
  { id: "weekly",  desc: "P31 weekly digest",   cmd: "weekly",   oncalendar: "Sun *-*-* 20:00:00" },
];

function serviceUnit(slot) {
  return `[Unit]
Description=${slot.desc}
After=network.target

[Service]
Type=oneshot
WorkingDirectory=${root}
ExecStart=${NODE_BIN} ${path.join(root, "scripts/p31-reports.mjs")} ${slot.cmd} --brief
StandardOutput=append:%h/.p31/reports.systemd.log
StandardError=append:%h/.p31/reports.systemd.log

[Install]
WantedBy=default.target
`;
}

function timerUnit(slot) {
  return `[Unit]
Description=${slot.desc} (timer)

[Timer]
OnCalendar=${slot.oncalendar}
Persistent=true
Unit=p31-reports-${slot.id}.service

[Install]
WantedBy=timers.target
`;
}

function planFiles() {
  const files = [];
  for (const s of SLOTS) {
    files.push({ path: path.join(UNIT_DIR, `p31-reports-${s.id}.service`), content: serviceUnit(s) });
    files.push({ path: path.join(UNIT_DIR, `p31-reports-${s.id}.timer`), content: timerUnit(s) });
  }
  return files;
}

if (args.uninstall) {
  let removed = 0;
  for (const f of planFiles()) {
    if (fs.existsSync(f.path)) { fs.unlinkSync(f.path); removed++; }
  }
  console.log(`reports:install-systemd: removed ${removed} files from ${UNIT_DIR}`);
  console.log("Disable timers manually:");
  for (const s of SLOTS) console.log(`  systemctl --user disable --now p31-reports-${s.id}.timer`);
  process.exit(0);
}

const files = planFiles();
if (!args.apply) {
  console.log(`reports:install-systemd: dry-run — would write ${files.length} files to ${UNIT_DIR}`);
  for (const f of files) console.log(`  · ${f.path}`);
  console.log("\nRun with --apply to write them.");
  process.exit(0);
}

fs.mkdirSync(UNIT_DIR, { recursive: true });
fs.mkdirSync(path.join(os.homedir(), ".p31"), { recursive: true });
let wrote = 0;
for (const f of files) {
  const prev = fs.existsSync(f.path) ? fs.readFileSync(f.path, "utf8") : null;
  if (prev === f.content) continue;
  fs.writeFileSync(f.path, f.content, "utf8");
  wrote++;
}

console.log(`reports:install-systemd: wrote ${wrote} files to ${UNIT_DIR}`);
console.log("\nNext steps:");
console.log("  systemctl --user daemon-reload");
for (const s of SLOTS) console.log(`  systemctl --user enable --now p31-reports-${s.id}.timer`);
console.log("\nList timers:   systemctl --user list-timers | grep p31-reports");
console.log("Tail logs:     tail -f ~/.p31/reports.systemd.log");
console.log("Disable later: npm run reports:install-systemd -- --uninstall");
