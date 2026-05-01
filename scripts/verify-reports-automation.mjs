#!/usr/bin/env node
/**
 * Static gate for reports automation:
 *  - reports.mjs subcommands present
 *  - simulate scenarios match the documented set
 *  - daemon heartbeat schema (if file exists) is parseable
 *  - systemd units (if installed) reference the in-tree node binary
 *  - inbox dirs exist or are skip-creatable
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function fail(m) { console.error("verify-reports-automation:", m); process.exit(1); }
function note(m) { console.log("verify-reports-automation:", m); }

const required = [
  "scripts/p31-reports.mjs",
  "scripts/p31-reports-simulate.mjs",
  "scripts/p31-reports-daemon.mjs",
  "scripts/p31-reports-install-systemd.mjs",
  "scripts/p31-reports-inbox.mjs",
  "scripts/p31-reports-from-glass.mjs",
  "scripts/lib/reports/sections.mjs",
  "scripts/lib/reports/filing.mjs",
  "scripts/lib/reports/render.mjs",
];
for (const f of required) {
  if (!fs.existsSync(path.join(root, f))) fail(`missing ${f}`);
}

const sim = fs.readFileSync(path.join(root, "scripts/p31-reports-simulate.mjs"), "utf8");
for (const k of ["steady-week", "incident-day", "drift-down", "urgent-storm"]) {
  if (!sim.includes(`"${k}"`)) fail(`simulate missing scenario '${k}'`);
}

const heartbeat = path.join(os.homedir(), ".p31", "reports-daemon.json");
if (fs.existsSync(heartbeat)) {
  try {
    const j = JSON.parse(fs.readFileSync(heartbeat, "utf8"));
    if (j.schema !== "p31.reportsDaemon/0.1.0") fail(`heartbeat schema mismatch: ${j.schema}`);
    note(`heartbeat OK — state=${j.state}`);
  } catch (e) { fail(`heartbeat unparseable: ${e.message}`); }
}

const unitDir = path.join(os.homedir(), ".config", "systemd", "user");
if (fs.existsSync(unitDir)) {
  const units = fs.readdirSync(unitDir).filter((f) => f.startsWith("p31-reports-"));
  if (units.length) {
    for (const u of units) {
      const txt = fs.readFileSync(path.join(unitDir, u), "utf8");
      if (u.endsWith(".service") && !txt.includes(path.join(root, "scripts/p31-reports.mjs"))) {
        fail(`unit ${u} does not reference repo path ${root} (was the repo moved?)`);
      }
    }
    note(`systemd units present (${units.length})`);
  }
}

const inbox = path.join(os.homedir(), ".p31", "inbox", "urgent");
if (fs.existsSync(inbox)) note(`inbox present at ${inbox}`);

note("OK");
