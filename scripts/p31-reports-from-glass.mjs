#!/usr/bin/env node
/**
 * Bridge: read /tmp/p31_glass_report.json and, if any probe is `down` or `auth`-failed,
 * file a single urgent report summarizing them. Idempotent within a 30-min window
 * (won't re-fire for the same fingerprint). Designed to run AFTER `npm run ecosystem:glass`.
 *
 *   npm run reports:from-glass
 *   npm run reports:from-glass -- --report /custom/path.json
 *   npm run reports:from-glass -- --threshold 1   # min down rows to fire (default 1)
 *   npm run reports:from-glass -- --window 30     # dedupe window in minutes
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const FP_FILE = path.join(os.homedir(), ".p31", "reports-from-glass.fingerprint");

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
const reportPath = args.report || process.env.P31_GLASS_REPORT || "/tmp/p31_glass_report.json";
const threshold = Number(args.threshold) || 1;
const windowMin = Number(args.window) || 30;

if (!fs.existsSync(reportPath)) {
  console.log(`reports:from-glass: skip — no glass report at ${reportPath}`);
  process.exit(0);
}
let glass;
try { glass = JSON.parse(fs.readFileSync(reportPath, "utf8")); } catch (e) { console.error("reports:from-glass: bad json:", e.message); process.exit(2); }

const probes = Array.isArray(glass.probes) ? glass.probes : [];
const down = probes.filter((p) => /^(down|auth|fail)$/i.test(p.state || p.status || ""));
if (down.length < threshold) {
  console.log(`reports:from-glass: ok — down=${down.length} (< threshold ${threshold})`);
  process.exit(0);
}

const ids = down.map((p) => p.id || p.name || p.url || "?").sort().join(",");
const fp = `${ids}::${down.length}`;
let prev = null;
if (fs.existsSync(FP_FILE)) {
  try { prev = JSON.parse(fs.readFileSync(FP_FILE, "utf8")); } catch {}
}
if (prev && prev.fp === fp && Date.now() - new Date(prev.ts).getTime() < windowMin * 60 * 1000) {
  console.log(`reports:from-glass: dedupe — same fingerprint within ${windowMin}min, skipping`);
  process.exit(0);
}

const severity = down.length >= 3 ? "critical" : "high";
const headline = `glass: ${down.length} probe${down.length === 1 ? "" : "s"} ${down.length >= 3 ? "down (CRIT)" : "down"}`;
const details = [
  `Fired by reports:from-glass at ${new Date().toISOString()}`,
  `Source: ${reportPath}`,
  "",
  "Affected probes:",
  ...down.map((p) => `  · ${(p.state || p.status || "?").toUpperCase().padEnd(6)} ${p.id || p.name || ""}  ${p.url || ""}`),
  "",
  "Suggested next steps:",
  "  1. npm run ecosystem:glass             # re-confirm",
  "  2. tail -n 100 wrangler tail logs",
  "  3. npm run runbooks                     # find the matching runbook",
].join("\n");

const child = spawn("node", [
  path.join(root, "scripts/p31-reports.mjs"),
  "urgent",
  headline,
  "--severity", severity,
  "--category", "incident",
  "--details", details,
], { cwd: root, stdio: "inherit" });

child.on("close", (code) => {
  if (code === 0) {
    fs.mkdirSync(path.dirname(FP_FILE), { recursive: true });
    fs.writeFileSync(FP_FILE, JSON.stringify({ fp, ts: new Date().toISOString(), count: down.length }, null, 2) + "\n", "utf8");
    console.log(`reports:from-glass: filed urgent (${severity}) — fingerprint cached for ${windowMin}min`);
  }
  process.exit(code || 0);
});
