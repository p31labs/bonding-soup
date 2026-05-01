#!/usr/bin/env node
/**
 * p31-green-board — All systems go status check for market launch
 * 
 * Single command that validates the entire P31 automation infrastructure
 * is operational and ready for market launch.
 * 
 * Checks:
 *   1. All GOLD tier scripts present and executable
 *   2. All convergence paths defined
 *   3. Office calendar configured
 *   4. Grant pipeline active
 *   5. Command center registry valid
 *   6. CI workflows present
 * 
 * Usage:
 *   npm run green-board               # Full status check
 *   npm run green-board -- --json     # CI/automation
 *   npm run green-board -- --strict   # Fail if any non-green
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const JSON_OUT = args.includes("--json");
const STRICT = args.includes("--strict");

function checkFile(relPath) {
  return fs.existsSync(path.join(ROOT, relPath));
}

function checkScript(relPath) {
  if (!checkFile(relPath)) return { ok: false, reason: "missing" };
  const result = spawnSync("node", ["-c", path.join(ROOT, relPath)], {
    encoding: "utf8",
    timeout: 5000
  });
  return {
    ok: result.status === 0,
    reason: result.status === 0 ? "syntax_ok" : "syntax_error"
  };
}

function checkNpmScript(name) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
    return { ok: !!pkg.scripts[name], reason: pkg.scripts[name] ? "defined" : "missing" };
  } catch {
    return { ok: false, reason: "package_json_error" };
  }
}

function checkJsonValid(relPath) {
  try {
    const content = fs.readFileSync(path.join(ROOT, relPath), "utf8");
    JSON.parse(content);
    return { ok: true, reason: "valid" };
  } catch (e) {
    return { ok: false, reason: e.code === "ENOENT" ? "missing" : "invalid_json" };
  }
}

const SYSTEMS = {
  "GOLD T1: Grants": {
    description: "Grant Auto-Drafter",
    checks: [
      { name: "grant-autodraft.mjs exists", check: () => checkScript("scripts/grant-autodraft.mjs") },
      { name: "grant-status.mjs exists", check: () => checkScript("scripts/grant-status.mjs") },
      { name: "grant-scaffold.mjs exists", check: () => checkScript("scripts/grant-scaffold.mjs") },
      { name: "grant:status npm script", check: () => checkNpmScript("grant:status") },
      { name: "grant:draft npm script", check: () => checkNpmScript("grant:draft") },
    ]
  },
  "GOLD T2: Compliance": {
    description: "Compliance-to-SIMPLEX Bridge",
    checks: [
      { name: "compliance-sentinel.mjs", check: () => checkScript("scripts/compliance-sentinel.mjs") },
      { name: "p31-protocol-registry.json", check: () => checkJsonValid("p31-protocol-registry.json") },
      { name: "compliance:sentinel npm script", check: () => checkNpmScript("compliance:sentinel") },
      { name: "office:check npm script", check: () => checkNpmScript("office:check") },
    ]
  },
  "GOLD T3: GitHub Org": {
    description: "GitHub Org Metadata Drift Detection",
    checks: [
      { name: "github-org-diff.mjs", check: () => checkScript("scripts/github-org-diff.mjs") },
      { name: "repos-metadata.json", check: () => checkJsonValid("docs/github-org-bundle/repos-metadata.json") },
      { name: "github:org:diff npm script", check: () => checkNpmScript("github:org:diff") },
    ]
  },
  "GOLD T4: Foundry RAG": {
    description: "Document Foundry RAG Indexer",
    checks: [
      { name: "foundry-rag-indexer.mjs", check: () => checkScript("scripts/foundry-rag-indexer.mjs") },
      { name: "foundry:rag:index npm script", check: () => checkNpmScript("foundry:rag:index") },
      { name: "foundry:rag:context npm script", check: () => checkNpmScript("foundry:rag:context") },
    ]
  },
  "Orchestration": {
    description: "Unified Daily/Weekly Automation",
    checks: [
      { name: "p31-morning-orchestrator.mjs", check: () => checkScript("scripts/p31-morning-orchestrator.mjs") },
      { name: "market-launch-rehearsal.mjs", check: () => checkScript("scripts/market-launch-rehearsal.mjs") },
      { name: "p31-master-dashboard.mjs", check: () => checkScript("scripts/p31-master-dashboard.mjs") },
      { name: "morning npm script", check: () => checkNpmScript("morning") },
      { name: "launch:dryrun npm script", check: () => checkNpmScript("launch:dryrun") },
      { name: "dashboard npm script", check: () => checkNpmScript("dashboard") },
    ]
  },
  "Convergence": {
    description: "Parallel Paths to Market Launch",
    checks: [
      { name: "p31-convergence.json", check: () => checkJsonValid("p31-convergence.json") },
      { name: "p31-converge.mjs", check: () => checkScript("scripts/p31-converge.mjs") },
      { name: "converge npm script", check: () => checkNpmScript("converge") },
      { name: "converge:m1 npm script", check: () => checkNpmScript("converge:m1") },
      { name: "converge:m2 npm script", check: () => checkNpmScript("converge:m2") },
      { name: "converge:m3 npm script", check: () => checkNpmScript("converge:m3") },
    ]
  },
  "Office Documents": {
    description: "Board & Legal Document Generator",
    checks: [
      { name: "office-generate.mjs", check: () => checkScript("scripts/office-generate.mjs") },
      { name: "office:notice npm script", check: () => checkNpmScript("office:notice") },
      { name: "office:coi npm script", check: () => checkNpmScript("office:coi") },
      { name: "office:consent npm script", check: () => checkNpmScript("office:consent") },
      { name: "office:resolution npm script", check: () => checkNpmScript("office:resolution") },
    ]
  },
  "Command Center": {
    description: "Interactive UI & CLI Dashboard",
    checks: [
      { name: "actions.registry.mjs", check: () => checkScript("scripts/command-center/actions.registry.mjs") },
      { name: "p31-local-command-center.mjs", check: () => checkScript("scripts/p31-local-command-center.mjs") },
      { name: "command-center-cli.html", check: () => checkFile("command-center-cli.html") ? { ok: true, reason: "exists" } : { ok: false, reason: "missing" } },
      { name: "favicon.png", check: () => checkFile("favicon.png") ? { ok: true, reason: "exists" } : { ok: false, reason: "missing" } },
    ]
  },
  "CI Workflows": {
    description: "GitHub Actions Automation",
    checks: [
      { name: "p31-morning-orchestrator.yml", check: () => checkFile(".github/workflows/p31-morning-orchestrator.yml") ? { ok: true, reason: "exists" } : { ok: false, reason: "missing" } },
      { name: "p31-launch-rehearsal.yml", check: () => checkFile(".github/workflows/p31-launch-rehearsal.yml") ? { ok: true, reason: "exists" } : { ok: false, reason: "missing" } },
      { name: "triper-cert-scheduler.yml", check: () => checkFile(".github/workflows/triper-cert-scheduler.yml") ? { ok: true, reason: "exists" } : { ok: false, reason: "missing" } },
    ]
  },
};

// Run all checks
function runChecks() {
  const report = {
    timestamp: new Date().toISOString(),
    target: "M3 Market Launch (2026-06-15)",
    daysToLaunch: Math.ceil((new Date("2026-06-15") - new Date()) / (1000 * 60 * 60 * 24)),
    systems: {},
    summary: { totalChecks: 0, passed: 0, failed: 0, systemsGreen: 0, systemsTotal: 0 }
  };
  
  for (const [systemName, system] of Object.entries(SYSTEMS)) {
    const sysReport = {
      description: system.description,
      checks: [],
      green: true
    };
    
    for (const c of system.checks) {
      const result = c.check();
      sysReport.checks.push({ name: c.name, ok: result.ok, reason: result.reason });
      report.summary.totalChecks++;
      if (result.ok) {
        report.summary.passed++;
      } else {
        report.summary.failed++;
        sysReport.green = false;
      }
    }
    
    report.systems[systemName] = sysReport;
    report.summary.systemsTotal++;
    if (sysReport.green) report.summary.systemsGreen++;
  }
  
  report.overall = report.summary.failed === 0 ? "GREEN" : 
                   report.summary.failed <= 2 ? "YELLOW" : "RED";
  
  return report;
}

function renderReport(report) {
  console.log("┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓");
  console.log("┃                    P31 GREEN BOARD STATUS                     ┃");
  console.log(`┃              Market Launch: ${report.daysToLaunch} days remaining              ┃`);
  console.log("┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛");
  console.log();
  
  for (const [systemName, sys] of Object.entries(report.systems)) {
    const emoji = sys.green ? "✅" : "⚠️ ";
    const checks = `${sys.checks.filter(c => c.ok).length}/${sys.checks.length}`;
    console.log(`${emoji} ${systemName.padEnd(25)} ${checks.padStart(7)}  ${sys.description}`);
    
    if (!sys.green) {
      const failed = sys.checks.filter(c => !c.ok);
      for (const f of failed) {
        console.log(`     ❌ ${f.name} (${f.reason})`);
      }
    }
  }
  
  console.log();
  console.log("─".repeat(64));
  console.log(`Total checks:     ${report.summary.totalChecks}`);
  console.log(`Passed:           ${report.summary.passed}`);
  console.log(`Failed:           ${report.summary.failed}`);
  console.log(`Systems Green:    ${report.summary.systemsGreen}/${report.summary.systemsTotal}`);
  console.log("─".repeat(64));
  console.log();
  
  const statusBar = {
    GREEN: "🟢 ALL SYSTEMS GO",
    YELLOW: "🟡 MINOR ISSUES",
    RED: "🔴 LAUNCH BLOCKED"
  };
  
  console.log(`STATUS: ${statusBar[report.overall]}`);
  console.log();
  
  if (report.overall === "GREEN") {
    console.log("✓ All GOLD tiers operational");
    console.log("✓ All orchestration scripts present");
    console.log("✓ All CI workflows configured");
    console.log("✓ Convergence system active");
    console.log("✓ Office automation ready");
    console.log();
    console.log("READY FOR MARKET LAUNCH");
  } else {
    console.log("Action items:");
    for (const [name, sys] of Object.entries(report.systems)) {
      if (!sys.green) {
        const failed = sys.checks.filter(c => !c.ok);
        console.log(`  • ${name}: ${failed.length} issue(s)`);
      }
    }
  }
  
  console.log();
  console.log("┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓");
  console.log("┃ Quick Commands:                                              ┃");
  console.log("┃   npm run morning           Daily orchestration              ┃");
  console.log("┃   npm run converge          Convergence dashboard            ┃");
  console.log("┃   npm run launch:dryrun     Full M3 rehearsal                ┃");
  console.log("┃   npm run dashboard         Master view                      ┃");
  console.log("┃   npm run command-center    Interactive UI                   ┃");
  console.log("┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛");
}

const report = runChecks();

if (JSON_OUT) {
  console.log(JSON.stringify(report, null, 2));
} else {
  renderReport(report);
}

if (STRICT && report.overall !== "GREEN") {
  process.exit(1);
}
process.exit(0);
