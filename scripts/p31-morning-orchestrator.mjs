#!/usr/bin/env node
/**
 * p31-morning-orchestrator — Unified daily automation routine
 * 
 * Runs all GOLD tier automations + convergence check + health metrics.
 * Designed for morning operator routine or CI cron job.
 * 
 * Phases:
 *   1. Health check (operator spoon status from SIMPLEX)
 *   2. Office automation (compliance sentinel, office:check)
 *   3. Technical automation (TRIPER status, GitHub org diff)
 *   4. Grant automation (deadline tracking, draft status)
 *   5. Convergence check (all paths → M3 readiness)
 *   6. Report generation (unified morning report)
 * 
 * Usage:
 *   npm run morning               # Full orchestration
 *   npm run morning -- --quick    # Health + convergence only (2 min)
 *   npm run morning -- --spoon-deficit  # Skip heavy tasks if low spoons
 *   npm run morning -- --json     # CI output
 * 
 * Environment:
 *   SIMPLEX_WEBHOOK_URL - For telemetry fetch
 *   OPERATOR_SECRET - For SIMPLEX auth
 *   P31_MORNING_QUICK=1 - Skip slow verifiers
 *   P31_SPOON_DEFICIT=1 - Health-first mode
 * 
 * Related:
 *   - scripts/p31-reports.mjs (report generation)
 *   - scripts/p31-converge.mjs (convergence tracking)
 *   - .github/workflows/p31-morning-orchestrator.yml (CI automation)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const QUICK = args.includes("--quick") || process.env.P31_MORNING_QUICK === "1";
const SPOON_DEFICIT = args.includes("--spoon-deficit") || process.env.P31_SPOON_DEFICIT === "1";
const JSON_OUT = args.includes("--json");
const SKIP_GRANTS = args.includes("--skip-grants");
const SKIP_TECHNICAL = args.includes("--skip-technical");
const SKIP_OFFICE = args.includes("--skip-office");

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 1: HEALTH CHECK (SIMPLEX telemetry)
// ═══════════════════════════════════════════════════════════════════════════════

async function phaseHealth() {
  const results = { phase: "health", status: "ok", spoons: null, accommodations: [] };
  
  // Try to fetch from SIMPLEX if configured
  if (process.env.SIMPLEX_WEBHOOK_URL) {
    try {
      const response = await fetch(`${process.env.SIMPLEX_WEBHOOK_URL}/api/telemetry/spoons?hours=24`, {
        headers: { "Authorization": `Bearer ${process.env.OPERATOR_SECRET}` }
      });
      if (response.ok) {
        const data = await response.json();
        results.spoons = data.latest?.level || "unknown";
        results.accommodations = data.accommodations || [];
      }
    } catch {
      results.status = "degraded";
    }
  } else {
    // Local heuristic - check recent reports
    const reportsDir = path.join(ROOT, ".p31", "reports");
    if (fs.existsSync(reportsDir)) {
      const files = fs.readdirSync(reportsDir).filter(f => f.endsWith(".json")).sort().reverse();
      if (files.length) {
        const latest = JSON.parse(fs.readFileSync(path.join(reportsDir, files[0]), "utf8"));
        results.spoons = latest.spoonLevel || "unknown";
      }
    }
  }
  
  // Auto-detect spoon deficit
  if (results.spoons === "critical" || results.spoons === "low") {
    results.recommendation = "SPOON_DEFICIT_MODE: Run light tasks only";
  }
  
  return results;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 2: OFFICE AUTOMATION
// ═══════════════════════════════════════════════════════════════════════════════

function phaseOffice() {
  const results = { phase: "office", status: "ok", checks: [] };
  
  if (SPOON_DEFICIT || SKIP_OFFICE) {
    results.status = "skipped";
    results.reason = SPOON_DEFICIT ? "spoon_deficit" : "flag_skip_office";
    return results;
  }
  
  // Compliance sentinel (dry-run)
  const sentinel = runCommand("npm", ["run", "compliance:sentinel:dry", "--", "--json"], { quiet: true });
  results.checks.push({ name: "compliance-sentinel", ...sentinel });
  
  // Office check
  const office = runCommand("npm", ["run", "office:check:json"], { quiet: true });
  results.checks.push({ name: "office-check", ...office });
  
  // Foundry RAG index status
  const ragIndex = path.join(ROOT, ".p31-foundry", "rag-index.json");
  results.checks.push({ 
    name: "foundry-rag", 
    status: fs.existsSync(ragIndex) ? "ok" : "needs-index",
    path: ragIndex
  });
  
  if (results.checks.some(c => c.status !== 0 && c.status !== "ok")) {
    results.status = "attention";
  }
  
  return results;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 3: TECHNICAL AUTOMATION
// ═══════════════════════════════════════════════════════════════════════════════

function phaseTechnical() {
  const results = { phase: "technical", status: "ok", checks: [] };
  
  if (SPOON_DEFICIT || SKIP_TECHNICAL) {
    results.status = "skipped";
    results.reason = SPOON_DEFICIT ? "spoon_deficit" : "flag_skip_technical";
    return results;
  }
  
  if (QUICK) {
    // Quick mode: just check TRIPER status, don't run full cert
    const triper = runCommand("npm", ["run", "triper:status", "--", "--json"], { quiet: true });
    results.checks.push({ name: "triper-status", ...triper });
  } else {
    // Full mode: verify mesh, check GitHub org
    const mesh = runCommand("npm", ["run", "verify:mesh-offline"], { quiet: true, timeout: 60000 });
    results.checks.push({ name: "mesh-verify", ...mesh });
  }
  
  // GitHub org diff (always light)
  const github = runCommand("npm", ["run", "github:org:diff:summary"], { quiet: true });
  results.checks.push({ name: "github-org-diff", ...github });
  
  if (results.checks.some(c => c.status !== 0)) {
    results.status = "attention";
  }
  
  return results;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 4: GRANT AUTOMATION
// ═══════════════════════════════════════════════════════════════════════════════

function phaseGrants() {
  const results = { phase: "grants", status: "ok", checks: [] };
  
  if (SKIP_GRANTS) {
    results.status = "skipped";
    results.reason = "flag_skip_grants";
    return results;
  }
  
  // Grant status
  const status = runCommand("npm", ["run", "grant:status", "--", "--json"], { quiet: true });
  results.checks.push({ name: "grant-status", ...status });
  
  // Check if NLnet draft needs generation
  const draftsDir = path.join(ROOT, "docs/grants/auto-drafts");
  const nlnetDrafts = fs.existsSync(draftsDir) 
    ? fs.readdirSync(draftsDir).filter(f => f.includes("nlnet"))
    : [];
  
  results.checks.push({
    name: "nlnet-draft-exists",
    status: nlnetDrafts.length > 0 ? "ok" : "needs-generation",
    count: nlnetDrafts.length
  });
  
  return results;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 5: CONVERGENCE CHECK
// ═══════════════════════════════════════════════════════════════════════════════

function phaseConvergence() {
  const results = { phase: "convergence", status: "ok", ready: {} };
  
  const converge = runCommand("node", ["scripts/p31-converge.mjs", "--json"], { quiet: true });
  
  try {
    const stdout = converge.stdout || "";
    const jsonStart = stdout.indexOf("{");
    if (jsonStart < 0) throw new Error("no JSON found");
    const data = JSON.parse(stdout.slice(jsonStart));
    results.milestones = data.milestones?.map(m => ({
      id: m.id,
      name: m.name,
      ready: m.convergence?.ready || false,
      daysLeft: m.daysLeft
    })) || [];
    
    results.criticalPath = results.milestones.filter(m => m.daysLeft <= 7);
  } catch (e) {
    results.status = "error";
    results.error = "Failed to parse convergence output: " + e.message;
  }
  
  return results;
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY: Run command
// ═══════════════════════════════════════════════════════════════════════════════

function runCommand(cmd, args, opts = {}) {
  const { quiet = false, timeout = 30000 } = opts;
  
  const result = spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: "utf8",
    timeout,
    stdio: quiet ? ["pipe", "pipe", "pipe"] : "inherit"
  });
  
  return {
    status: result.status ?? 1,
    stdout: result.stdout,
    stderr: result.stderr,
    timedOut: result.error?.code === "ETIMEDOUT"
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  const startTime = Date.now();
  
  if (!JSON_OUT) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("         P31 MORNING ORCHESTRATOR");
    console.log(`         Mode: ${QUICK ? "QUICK" : SPOON_DEFICIT ? "SPOON-DEFICIT" : "FULL"}`);
    console.log(`         Date: ${new Date().toISOString().slice(0, 10)}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  }
  
  const report = {
    timestamp: new Date().toISOString(),
    mode: QUICK ? "quick" : SPOON_DEFICIT ? "spoon-deficit" : "full",
    phases: {}
  };
  
  // Phase 1: Health (always)
  if (!JSON_OUT) console.log("[1/5] Health check...");
  report.phases.health = await phaseHealth();
  
  // Auto-enable spoon deficit if detected
  if (report.phases.health.spoons === "critical" && !SPOON_DEFICIT) {
    if (!JSON_OUT) console.log("⚠️  Auto-enabling SPOON_DEFICIT mode");
    process.env.P31_SPOON_DEFICIT = "1";
  }
  
  // Phase 2-5
  if (!JSON_OUT) console.log("[2/5] Office automation...");
  report.phases.office = phaseOffice();
  
  if (!JSON_OUT) console.log("[3/5] Technical automation...");
  report.phases.technical = phaseTechnical();
  
  if (!JSON_OUT) console.log("[4/5] Grant automation...");
  report.phases.grants = phaseGrants();
  
  if (!JSON_OUT) console.log("[5/5] Convergence check...");
  report.phases.convergence = phaseConvergence();
  
  // Summary
  const duration = Date.now() - startTime;
  report.durationMs = duration;
  
  // Status aggregation
  const statuses = Object.values(report.phases).map(p => p.status);
  report.overall = statuses.every(s => s === "ok" || s === "skipped") ? "ok" : 
                   statuses.some(s => s === "critical") ? "critical" : "attention";
  
  // Output
  if (JSON_OUT) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    renderReport(report);
  }
  
  // Exit code for CI
  process.exit(report.overall === "critical" ? 2 : report.overall === "attention" ? 1 : 0);
}

function renderReport(report) {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("ORCHESTRATION COMPLETE");
  console.log(`Duration: ${(report.durationMs / 1000).toFixed(1)}s`);
  console.log(`Overall: ${report.overall.toUpperCase()}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  
  // Health
  const h = report.phases.health;
  console.log(`Health: ${h.spoons?.toUpperCase() || "UNKNOWN"}`);
  if (h.accommodations.length) {
    console.log(`Accommodations active: ${h.accommodations.length}`);
  }
  console.log();
  
  // Critical items
  const c = report.phases.convergence;
  if (c.criticalPath?.length) {
    console.log("🔴 CRITICAL PATH (< 7 days):");
    for (const m of c.criticalPath) {
      console.log(`   ${m.id}: ${m.name} (${m.daysLeft} days) ${m.ready ? "✓" : "⏳"}`);
    }
    console.log();
  }
  
  // Action items
  console.log("ACTION ITEMS:");
  
  const office = report.phases.office;
  if (office.checks?.some(c => c.name === "nlnet-draft-exists" && c.status === "needs-generation")) {
    console.log("   • Generate NLnet draft: npm run grant:draft -- --target nlnet-ngi-zero-commons");
  }
  
  const grants = report.phases.grants;
  if (grants.checks?.some(c => c.name === "grant-status")) {
    console.log("   • Check grant deadlines: npm run grant:status");
  }
  
  const tech = report.phases.technical;
  if (tech.status === "attention") {
    console.log("   • Technical issues detected: npm run protocol:status");
  }
  
  if (report.overall === "ok") {
    console.log("   • All systems operational — proceed with morning");
  }
  
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Commands:");
  console.log("   npm run converge              # Full convergence view");
  console.log("   npm run command-center:open   # GUI control panel");
  console.log("   npm run morning -- --quick    # Tomorrow's light check");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main().catch(err => {
  console.error("Orchestrator error:", err.message);
  process.exit(1);
});
