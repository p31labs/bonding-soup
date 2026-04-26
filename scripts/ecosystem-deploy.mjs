#!/usr/bin/env node
/**
 * Ordered deploy plan from p31-ecosystem.json — does not run Cloudflare by default.
 *   node scripts/ecosystem-deploy.mjs plan
 *   node scripts/ecosystem-deploy.mjs dry-run
 *   P31_ECOSYSTEM_DEPLOY=I_UNDERSTAND node scripts/ecosystem-deploy.mjs execute
 * Optional: P31_ECOSYSTEM_CONTINUE=1 runs all steps and exits non-zero if any failed (default: stop on first failure).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const manifestPath = path.join(root, "p31-ecosystem.json");

const cmd = process.argv[2] || "plan";
const allowExec = process.env.P31_ECOSYSTEM_DEPLOY === "I_UNDERSTAND";

if (!fs.existsSync(manifestPath)) {
  console.error("ecosystem-deploy: missing", manifestPath);
  process.exit(1);
}

const m = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const deployables = m.deployables || [];

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function runShell(title, command, cwd) {
  console.log(`\n▶ ${title}\n  cwd: ${cwd}\n  ${command}\n`);
  if (!allowExec) {
    console.log("  (skipped — dry-run; set P31_ECOSYSTEM_DEPLOY=I_UNDERSTAND to execute)\n");
    return 0;
  }
  const r = spawnSync(command, { cwd, shell: true, stdio: "inherit" });
  return r.status ?? 1;
}

if (cmd === "plan" || cmd === "dry-run") {
  console.log("P31 ecosystem deploy order (from p31-ecosystem.json)\n");
  let n = 0;
  for (const d of deployables) {
    const ok = exists(d.cwd);
    n += 1;
    console.log(`- [${n}/${deployables.length}] [${ok ? "ok" : "SKIP"}] ${d.id}: ${d.description || ""}`);
    console.log(`    ${d.cwd} → ${d.command}`);
  }
  if (cmd === "dry-run") {
    console.log(
      "\nDry-run only lists steps. To run: P31_ECOSYSTEM_DEPLOY=I_UNDERSTAND node scripts/ecosystem-deploy.mjs execute"
    );
  }
  process.exit(0);
}

if (cmd === "execute") {
  if (!allowExec) {
    console.error(
      "Refusing to run deploy. Export P31_ECOSYSTEM_DEPLOY=I_UNDERSTAND and ensure wrangler/Cloudflare auth."
    );
    process.exit(1);
  }
  const continueOnError = process.env.P31_ECOSYSTEM_CONTINUE === "1";
  let code = 0;
  let i = 0;
  for (const d of deployables) {
    i += 1;
    if (!exists(d.cwd)) {
      console.log(`[${i}/${deployables.length}] Skip ${d.id} — missing path ${d.cwd}`);
      continue;
    }
    const cwd = path.join(root, d.cwd);
    const label = `[${i}/${deployables.length}] ${d.id}`;
    const c = runShell(label, d.command, cwd);
    if (c !== 0) {
      code = c;
      console.error(`${label} failed with exit ${c}`);
      if (!continueOnError) {
        process.exit(code);
      }
    }
  }
  if (code !== 0 && continueOnError) {
    console.error("ecosystem-deploy: finished with errors (P31_ECOSYSTEM_CONTINUE=1)");
    process.exit(code);
  }
  console.log("ecosystem-deploy: all steps completed");
  process.exit(0);
}

console.error("Usage: node scripts/ecosystem-deploy.mjs [plan|dry-run|execute]");
process.exit(1);
