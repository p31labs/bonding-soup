#!/usr/bin/env node
/**
 * market-launch-rehearsal — Full M3 convergence dry-run
 * 
 * Rehearses every component of public market launch without executing.
 * Validates all paths converge at M3 (2026-06-15).
 * 
 * Phases:
 *   1. Grants rehearsal — All applications ready for submit
 *   2. Technical rehearsal — TRIPER cert + mesh live + security
 *   3. Org rehearsal — All filings current, board docs ready
 *   4. Launch rehearsal — All 10 gates MET, smoke tests pass
 *   5. Convergence gate — Final M3 readiness check
 * 
 * Usage:
 *   npm run launch:rehearsal          # Full dry-run
 *   npm run launch:rehearsal -- --phase grants   # Single phase
 *   npm run launch:rehearsal -- --json           # CI output
 *   npm run launch:rehearsal -- --fail-fast      # Stop on first issue
 * 
 * Exit codes:
 *   0 = All rehearsals passed (ready for launch)
 *   1 = Warnings (launch possible but not ideal)
 *   2 = Blockers (launch would fail)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const JSON_OUT = args.includes("--json");
const FAIL_FAST = args.includes("--fail-fast");
const PHASE_FILTER = args.find(a => a.startsWith("--phase"))?.split("=")[1] || null;

// ═══════════════════════════════════════════════════════════════════════════════
// REHEARSAL PHASES
// ═══════════════════════════════════════════════════════════════════════════════

const PHASES = {
  grants: {
    name: "Grants Rehearsal",
    description: "All funding applications ready for submission",
    checks: [
      { id: "nlnet-draft", name: "NLnet application drafted", cmd: ["test", "-f", "docs/grants/nlnet-ngi-zero-commons-application.md"] },
      { id: "nlnet-review", name: "NLnet draft reviewed (operator)", manual: true },
      { id: "asan-ready", name: "ASAN application ready to submit on open", cmd: ["npm", "run", "grant:draft:dry", "--", "--target", "asan-disability-justice"] },
      { id: "grant-calendar", name: "Grant calendar current", cmd: ["npm", "run", "verify:grants"] },
    ]
  },
  
  technical: {
    name: "Technical Rehearsal", 
    description: "All systems certified and live",
    checks: [
      { id: "triper-cert", name: "TRIPER certification < 24h old", cmd: ["npm", "run", "verify:triper"] },
      { id: "mesh-live", name: "K4 mesh live verification passing", cmd: ["npm", "run", "verify:mesh-offline"] },
      { id: "security-pass", name: "p31ca security:check passing", cmd: ["npm", "run", "security:check"], skip: true }, // May not exist at home root
      { id: "worker-allowlist", name: "Worker allowlist verified", cmd: ["npm", "run", "verify:ecosystem"] },
      { id: "github-org-sync", name: "GitHub org metadata in sync", cmd: ["npm", "run", "github:org:diff:summary"] },
    ]
  },
  
  org: {
    name: "Org Rehearsal",
    description: "Legal entity and compliance ready",
    checks: [
      { id: "board-notice", name: "Annual board meeting notice generated", cmd: ["test", "-f", "docs/board/BOARD-MEETING-NEXT-NOTICE.md"] },
      { id: "coi-forms", name: "Conflict of Interest forms ready", manual: true },
      { id: "compliance-current", name: "No overdue compliance items", cmd: ["npm", "run", "compliance:sentinel:dry"] },
      { id: "501c3-status", name: "501(c)(3) status tracked", manual: true },
    ]
  },
  
  launch: {
    name: "Launch Rehearsal",
    description: "Public readiness gates",
    checks: [
      { id: "launch-gates", name: "10/10 launch gates MET", cmd: ["npm", "run", "launch:check"] },
      { id: "public-voice", name: "Public voice verification passing", cmd: ["npm", "run", "verify:public-voice"] },
      { id: "glass-box", name: "Glass box transparency live", manual: true },
      { id: "initial-build", name: "Initial Build campaign ready", manual: true },
      { id: "family-pack", name: "Family Sovereign Pack distributed", manual: true },
    ]
  },
  
  convergence: {
    name: "Convergence Gate",
    description: "Final M3 readiness check",
    checks: [
      { id: "m3-ready", name: "M3 milestone convergence check", cmd: ["npm", "run", "converge:m3"] },
      { id: "auto-gates", name: "Launch auto-gates passing", cmd: ["npm", "run", "launch:auto-gates:dry"] },
      { id: "orchestrator", name: "Morning orchestrator passing", cmd: ["npm", "run", "morning:quick"], allowExit: [0, 1] },
      { id: "green-board", name: "Green board status check", cmd: ["npm", "run", "green-board:strict"] },
    ]
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// RUN CHECK
// ═══════════════════════════════════════════════════════════════════════════════

function runCheck(check) {
  if (check.skip) {
    return { status: "skipped", reason: "check_not_available" };
  }
  
  if (check.manual) {
    return { status: "manual", note: "Requires operator verification" };
  }
  
  const start = Date.now();
  const result = spawnSync(check.cmd[0], check.cmd.slice(1), {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 60000,
    stdio: ["pipe", "pipe", "pipe"]
  });
  
  const duration = Date.now() - start;
  const allowedExits = check.allowExit || [0];
  const passed = allowedExits.includes(result.status);
  
  return {
    status: passed ? "pass" : "fail",
    exitCode: result.status,
    duration,
    stderr: result.stderr?.slice(0, 200)
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

function main() {
  const startTime = Date.now();
  const report = {
    timestamp: new Date().toISOString(),
    targetDate: "2026-06-15",
    phases: {}
  };
  
  let hasFailures = false;
  let hasManual = false;
  
  for (const [phaseId, phase] of Object.entries(PHASES)) {
    if (PHASE_FILTER && phaseId !== PHASE_FILTER) continue;
    
    if (!JSON_OUT) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`${phase.name.toUpperCase()}`);
      console.log(phase.description);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    }
    
    const phaseReport = {
      name: phase.name,
      description: phase.description,
      checks: []
    };
    
    for (const check of phase.checks) {
      if (!JSON_OUT) {
        process.stdout.write(`  ${check.name} ... `);
      }
      
      const result = runCheck(check);
      phaseReport.checks.push({
        id: check.id,
        name: check.name,
        ...result
      });
      
      if (!JSON_OUT) {
        if (result.status === "pass") console.log("✅ PASS");
        else if (result.status === "fail") console.log("❌ FAIL");
        else if (result.status === "manual") console.log("⚠️  MANUAL");
        else if (result.status === "skipped") console.log("⏭️  SKIP");
        
        if (result.stderr) {
          console.log(`     ${result.stderr}`);
        }
      }
      
      if (result.status === "fail") hasFailures = true;
      if (result.status === "manual") hasManual = true;
      
      if (FAIL_FAST && result.status === "fail") {
        break;
      }
    }
    
    phaseReport.summary = {
      total: phase.checks.length,
      pass: phaseReport.checks.filter(c => c.status === "pass").length,
      fail: phaseReport.checks.filter(c => c.status === "fail").length,
      manual: phaseReport.checks.filter(c => c.status === "manual").length,
      skipped: phaseReport.checks.filter(c => c.status === "skipped").length
    };
    
    report.phases[phaseId] = phaseReport;
    
    if (FAIL_FAST && hasFailures) {
      break;
    }
  }
  
  // Overall assessment
  const totalChecks = Object.values(report.phases).reduce((sum, p) => sum + p.checks.length, 0);
  const totalPass = Object.values(report.phases).reduce((sum, p) => sum + p.summary.pass, 0);
  const totalFail = Object.values(report.phases).reduce((sum, p) => sum + p.summary.fail, 0);
  const totalManual = Object.values(report.phases).reduce((sum, p) => sum + p.summary.manual, 0);
  
  report.overall = {
    totalChecks,
    passed: totalPass,
    failed: totalFail,
    manual: totalManual,
    status: totalFail > 0 ? "BLOCKED" : totalManual > 0 ? "READY_WITH_MANUAL" : "READY"
  };
  
  report.duration = Date.now() - startTime;
  
  // Output
  if (JSON_OUT) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    renderReport(report);
  }
  
  // Exit code
  const exitCode = report.overall.status === "BLOCKED" ? 2 : 
                   report.overall.status === "READY_WITH_MANUAL" ? 1 : 0;
  process.exit(exitCode);
}

function renderReport(report) {
  console.log("\n" + "═".repeat(56));
  console.log("MARKET LAUNCH REHEARSAL COMPLETE");
  console.log("═".repeat(56));
  console.log();
  
  console.log(`Overall: ${report.overall.status}`);
  console.log(`Checks: ${report.overall.passed}/${report.overall.totalChecks} passed`);
  if (report.overall.failed) console.log(`Failed: ${report.overall.failed}`);
  if (report.overall.manual) console.log(`Manual: ${report.overall.manual} (operator verification required)`);
  console.log(`Duration: ${(report.duration / 1000).toFixed(1)}s`);
  console.log();
  
  if (report.overall.status === "READY") {
    console.log("🎉 ALL SYSTEMS READY FOR M3 CONVERGENCE");
    console.log("   Target: 2026-06-15");
    console.log("   Action: Proceed to market launch");
  } else if (report.overall.status === "READY_WITH_MANUAL") {
    console.log("⚠️  READY WITH MANUAL ITEMS");
    console.log("   Complete manual checks before launch:");
    for (const [phaseId, phase] of Object.entries(report.phases)) {
      const manual = phase.checks.filter(c => c.status === "manual");
      for (const m of manual) {
        console.log(`   • ${phase.name}: ${m.name}`);
      }
    }
  } else {
    console.log("❌ LAUNCH BLOCKED");
    console.log("   Failed checks:");
    for (const [phaseId, phase] of Object.entries(report.phases)) {
      const failed = phase.checks.filter(c => c.status === "fail");
      for (const f of failed) {
        console.log(`   • ${phase.name}: ${f.name}`);
      }
    }
    console.log();
    console.log("Commands to resolve:");
    console.log("   npm run converge              # View all paths");
    console.log("   npm run triper:full          # Complete certification");
    console.log("   npm run launch:auto-gates    # Auto-check gates");
  }
  
  console.log();
  console.log("═".repeat(56));
}

main();
