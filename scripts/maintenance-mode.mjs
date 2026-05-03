#!/usr/bin/env node
/**
 * Toggle maintenance mode for a surface.
 *
 * Usage:
 *   node scripts/maintenance-mode.mjs /glass-box on
 *   node scripts/maintenance-mode.mjs /glass-box off
 *
 * "on"  — sets gate to "maintenance" in docs/public-line.json.
 *          Operator should also toggle the Cloudflare Worker route for production
 *          (see docs/MAINTENANCE-SCHEDULE.md §3 for Wrangler command).
 * "off" — restores prior gate (saved as priorGate) in docs/public-line.json.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const PL_FILE = path.join(root, "docs", "public-line.json");

function usage() {
  console.error("Usage: node scripts/maintenance-mode.mjs <path> [on|off]");
  console.error("  <path>   page path as it appears in public-line.json, e.g. /glass-box");
  console.error("  on       withdraw surface — sets gate=maintenance");
  console.error("  off      restore surface — restores priorGate");
  process.exit(1);
}

const [,, pagePath, action] = process.argv;
if (!pagePath || !["on", "off"].includes(action)) usage();

if (!fs.existsSync(PL_FILE)) {
  console.error("maintenance-mode: docs/public-line.json not found");
  process.exit(1);
}

const pl = JSON.parse(fs.readFileSync(PL_FILE, "utf8"));
const entry = pl.pages.find(p => p.path === pagePath);

if (!entry) {
  console.error(`maintenance-mode: path "${pagePath}" not found in public-line.json`);
  console.error("Add it first via npm run audit:pages or manually.");
  process.exit(1);
}

if (action === "on") {
  if (entry.gate === "maintenance") {
    console.log(`maintenance-mode: ${pagePath} is already in maintenance.`);
    process.exit(0);
  }
  entry.priorGate = entry.gate;
  entry.maintenanceSince = new Date().toISOString();
  entry.gate = "maintenance";
  console.log(`maintenance-mode: ${pagePath} → maintenance (was ${entry.priorGate})`);
  console.log("  Next: toggle Cloudflare Worker route for production traffic.");
  console.log("  See docs/MAINTENANCE-SCHEDULE.md §3.");
} else {
  if (entry.gate !== "maintenance") {
    console.log(`maintenance-mode: ${pagePath} is not in maintenance (gate=${entry.gate}).`);
    process.exit(0);
  }
  const restored = entry.priorGate || "gate2";
  entry.gate = restored;
  delete entry.priorGate;
  delete entry.maintenanceSince;
  console.log(`maintenance-mode: ${pagePath} → ${restored} (restored)`);
}

pl.updatedAt = new Date().toISOString();
fs.writeFileSync(PL_FILE, JSON.stringify(pl, null, 2) + "\n", "utf8");
console.log(`maintenance-mode: wrote docs/public-line.json`);
