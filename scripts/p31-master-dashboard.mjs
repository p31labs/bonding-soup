#!/usr/bin/env node
/**
 * p31-master-dashboard — Real-time system status across all tiers
 * 
 * Shows unified view of:
 *   - GOLD tier automation status
 *   - Convergence paths progress
 *   - Health metrics (spoons, accommodations)
 *   - Active alerts and blockers
 * 
 * Usage:
 *   npm run dashboard           # Interactive dashboard
 *   npm run dashboard -- --json        # API output
 *   npm run dashboard -- --refresh 5   # Auto-refresh every 5 sec
 *   npm run dashboard -- --web        # Export HTML for command center
 * 
 * Related:
 *   - scripts/p31-morning-orchestrator.mjs (data source)
 *   - scripts/p31-converge.mjs (convergence data)
 *   - Command Center web UI integration
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const JSON_OUT = args.includes("--json");
const WEB_EXPORT = args.includes("--web");
const REFRESH = parseInt(args.find(a => a.startsWith("--refresh"))?.split("=")[1] || "0");

// ═══════════════════════════════════════════════════════════════════════════════
// DATA COLLECTION
// ═══════════════════════════════════════════════════════════════════════════════

function collectDashboardData() {
  const data = {
    timestamp: new Date().toISOString(),
    tiers: {},
    convergence: {},
    health: {},
    alerts: []
  };
  
  // GOLD Tier 1: Grants
  data.tiers.grants = collectGrantData();
  
  // GOLD Tier 2: Compliance
  data.tiers.compliance = collectComplianceData();
  
  // GOLD Tier 3: GitHub Org
  data.tiers.github = collectGithubData();
  
  // GOLD Tier 4: Foundry RAG
  data.tiers.foundry = collectFoundryData();
  
  // Convergence
  data.convergence = collectConvergenceData();
  
  // Health (SIMPLEX or local)
  data.health = collectHealthData();
  
  // Alerts aggregation
  data.alerts = aggregateAlerts(data);
  
  return data;
}

function collectGrantData() {
  const draftsDir = path.join(ROOT, "docs/grants/auto-drafts");
  const nlnetExists = fs.existsSync(path.join(ROOT, "docs/grants/nlnet-ngi-zero-commons-application.md"));
  
  return {
    status: "active",
    pipeline: [
      { id: "nlnet", name: "NLnet (€15K)", status: nlnetExists ? "drafted" : "needs-draft", deadline: "2026-06-01", daysLeft: 31 },
      { id: "asan", name: "ASAN ($6.25K)", status: "ready-to-open", deadline: "2026-05-15", daysLeft: 14 },
      { id: "stimpunks", name: "Stimpunks ($3K)", status: "blocked", blockers: ["provisional-patent"], deadline: "2026-06-01", daysLeft: 31 }
    ],
    command: "npm run grant:status"
  };
}

function collectComplianceData() {
  // Read office calendar for urgent items
  try {
    const registry = JSON.parse(fs.readFileSync(path.join(ROOT, "p31-protocol-registry.json"), "utf8"));
    const urgent = registry.officeCalendar?.deadlines?.filter(d => {
      const days = Math.ceil((new Date(d.date) - new Date()) / (1000 * 60 * 60 * 24));
      return days <= 14;
    }) || [];
    
    return {
      status: urgent.length > 0 ? "attention" : "ok",
      urgentItems: urgent.length,
      sentinelActive: true,
      command: "npm run office:check"
    };
  } catch {
    return { status: "unknown", urgentItems: 0, sentinelActive: false };
  }
}

function collectGithubData() {
  const metadataPath = path.join(ROOT, "docs/github-org-bundle/repos-metadata.json");
  const metadataExists = fs.existsSync(metadataPath);
  
  return {
    status: metadataExists ? "ready" : "needs-setup",
    reposCount: metadataExists ? JSON.parse(fs.readFileSync(metadataPath, "utf8")).repos?.length || 0 : 0,
    diffAvailable: true,
    command: "npm run github:org:diff:summary"
  };
}

function collectFoundryData() {
  const ragIndex = path.join(ROOT, ".p31-foundry", "rag-index.json");
  const indexExists = fs.existsSync(ragIndex);
  
  return {
    status: indexExists ? "ready" : "needs-index",
    indexed: indexExists,
    artifactsDir: path.join(ROOT, ".p31-foundry", "artifacts"),
    command: "npm run foundry:rag:index"
  };
}

function collectConvergenceData() {
  const result = spawnSync("node", ["scripts/p31-converge.mjs", "--json"], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 10000,
    stdio: ["pipe", "pipe", "pipe"]
  });
  
  try {
    const stdout = result.stdout || "";
    const jsonStart = stdout.indexOf("{");
    if (jsonStart < 0) return { paths: [], milestones: [] };
    return JSON.parse(stdout.slice(jsonStart));
  } catch {
    return { paths: [], milestones: [] };
  }
}

function collectHealthData() {
  // Try to read latest morning report
  const reportsDir = path.join(ROOT, ".p31", "reports");
  if (fs.existsSync(reportsDir)) {
    const files = fs.readdirSync(reportsDir).filter(f => f.endsWith(".json")).sort().reverse();
    if (files.length) {
      try {
        const report = JSON.parse(fs.readFileSync(path.join(reportsDir, files[0]), "utf8"));
        return {
          spoons: report.spoonLevel || "unknown",
          lastReport: files[0],
          accommodations: report.accommodations?.length || 0
        };
      } catch {}
    }
  }
  
  return { spoons: "unknown", lastReport: null, accommodations: 0 };
}

function aggregateAlerts(data) {
  const alerts = [];
  
  // Critical deadlines
  data.tiers.grants.pipeline.forEach(g => {
    if (g.daysLeft <= 7 && g.status !== "submitted") {
      alerts.push({
        severity: "critical",
        category: "grants",
        message: `${g.name} deadline in ${g.daysLeft} days`,
        action: `npm run grant:draft -- --target ${g.id}`
      });
    }
  });
  
  // Compliance issues
  if (data.tiers.compliance.urgentItems > 0) {
    alerts.push({
      severity: "warning",
      category: "compliance",
      message: `${data.tiers.compliance.urgentItems} urgent compliance items`,
      action: "npm run office:check"
    });
  }
  
  // Index issues
  if (!data.tiers.foundry.indexed) {
    alerts.push({
      severity: "notice",
      category: "foundry",
      message: "RAG index needs rebuild",
      action: "npm run foundry:rag:index"
    });
  }
  
  return alerts;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════════════════════════

function renderDashboard(data) {
  console.clear();
  
  console.log("┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓");
  console.log("┃                          P31 MASTER DASHBOARD                              ┃");
  console.log(`┃                     ${data.timestamp.slice(0, 19)}                        ┃`);
  console.log("┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛");
  console.log();
  
  // Health summary
  const spoonEmoji = { critical: "🔴", low: "🟡", medium: "🟢", high: "✨", unknown: "⚪" }[data.health.spoons] || "⚪";
  console.log(`HEALTH  ${spoonEmoji} Spoons: ${data.health.spoons.toUpperCase()} | Accommodations: ${data.health.accommodations}`);
  console.log();
  
  // GOLD Tiers
  console.log("━".repeat(76));
  console.log("GOLD TIER AUTOMATION");
  console.log("━".repeat(76));
  console.log();
  
  // Tier 1: Grants
  const g = data.tiers.grants;
  console.log(`T1: GRANTS          [${g.status.toUpperCase()}]`);
  g.pipeline.forEach(p => {
    const emoji = p.status === "submitted" ? "✅" : p.daysLeft <= 7 ? "🔴" : p.daysLeft <= 14 ? "🟡" : "⏳";
    console.log(`   ${emoji} ${p.name} (${p.deadline}, ${p.daysLeft}d) ${p.blockers ? `[BLOCKED: ${p.blockers.join(",")}]` : ""}`);
  });
  console.log(`   → ${g.command}`);
  console.log();
  
  // Tier 2: Compliance
  const c = data.tiers.compliance;
  console.log(`T2: COMPLIANCE      [${c.status.toUpperCase()}]  Sentinel: ${c.sentinelActive ? "✅" : "❌"}`);
  if (c.urgentItems > 0) console.log(`   ⚠️  ${c.urgentItems} items need attention`);
  console.log(`   → ${c.command}`);
  console.log();
  
  // Tier 3: GitHub
  const gh = data.tiers.github;
  console.log(`T3: GITHUB ORG      [${gh.status.toUpperCase()}]  ${gh.reposCount} repos tracked`);
  console.log(`   → ${gh.command}`);
  console.log();
  
  // Tier 4: Foundry
  const f = data.tiers.foundry;
  console.log(`T4: FOUNDRY RAG     [${f.status.toUpperCase()}]  Indexed: ${f.indexed ? "✅" : "❌"}`);
  console.log(`   → ${f.command}`);
  console.log();
  
  // Convergence
  console.log("━".repeat(76));
  console.log("CONVERGENCE PATHS");
  console.log("━".repeat(76));
  console.log();
  
  if (data.convergence.milestones) {
    data.convergence.milestones.forEach(m => {
      const status = m.convergence?.ready ? "✅ READY" : m.daysLeft <= 0 ? "🔴 OVERDUE" : m.daysLeft <= 7 ? "🟡 URGENT" : "⏳ ON TRACK";
      console.log(`${m.id}: ${m.name} (${m.daysLeft}d) ${status}`);
    });
  }
  console.log();
  
  // ALERTS
  if (data.alerts.length) {
    console.log("━".repeat(76));
    console.log("ACTIVE ALERTS");
    console.log("━".repeat(76));
    console.log();
    
    data.alerts.forEach(a => {
      const emoji = a.severity === "critical" ? "🔴" : a.severity === "warning" ? "🟡" : "⚪";
      console.log(`${emoji} [${a.category.toUpperCase()}] ${a.message}`);
      console.log(`   Action: ${a.action}`);
    });
    console.log();
  }
  
  // Footer
  console.log("━".repeat(76));
  console.log("QUICK ACTIONS");
  console.log("   npm run morning:quick       Light health check (2 min)");
  console.log("   npm run converge            Full convergence view");
  console.log("   npm run launch:rehearsal    Market launch dry-run");
  console.log("━".repeat(76));
  
  if (REFRESH > 0) {
    console.log(`\n[Auto-refresh: ${REFRESH}s - Ctrl+C to exit]`);
  }
}

function generateWebDashboard(data) {
  // Generate HTML for command center web view
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>P31 Master Dashboard</title>
  <meta charset="utf-8">
  <style>
    body { font-family: system-ui, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; }
    .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
    .tier { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 4px; }
    .status-ok { border-left: 4px solid green; }
    .status-attention { border-left: 4px solid orange; }
    .alert-critical { color: #d32f2f; font-weight: bold; }
    .alert-warning { color: #f57c00; }
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>P31 Master Dashboard</h1>
    <p>Generated: ${data.timestamp}</p>
  </div>
  
  <div class="tier status-${data.tiers.grants.status === 'active' ? 'ok' : 'attention'}">
    <h2>GOLD T1: Grants</h2>
    <ul>
      ${data.tiers.grants.pipeline.map(p => 
        `<li>${p.name} - ${p.status} (${p.daysLeft} days)</li>`
      ).join('')}
    </ul>
    <p><code>npm run grant:status</code></p>
  </div>
  
  <div class="tier status-${data.tiers.compliance.status}">
    <h2>GOLD T2: Compliance</h2>
    <p>Urgent items: ${data.tiers.compliance.urgentItems}</p>
    <p><code>npm run office:check</code></p>
  </div>
  
  <div class="tier status-${data.tiers.github.status === 'ready' ? 'ok' : 'attention'}">
    <h2>GOLD T3: GitHub Org</h2>
    <p>Repos tracked: ${data.tiers.github.reposCount}</p>
    <p><code>npm run github:org:diff:summary</code></p>
  </div>
  
  <div class="tier status-${data.tiers.foundry.indexed ? 'ok' : 'attention'}">
    <h2>GOLD T4: Foundry RAG</h2>
    <p>Indexed: ${data.tiers.foundry.indexed ? 'Yes' : 'No'}</p>
    <p><code>npm run foundry:rag:index</code></p>
  </div>
  
  <h2>Active Alerts</h2>
  ${data.alerts.length ? data.alerts.map(a => 
    `<p class="alert-${a.severity}">[${a.category}] ${a.message}</p>`
  ).join('') : '<p>No active alerts</p>'}
</body>
</html>`;
  
  const outputPath = path.join(ROOT, "p31-master-dashboard.html");
  fs.writeFileSync(outputPath, html, "utf8");
  console.log(`Dashboard exported: ${outputPath}`);
  return outputPath;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

function main() {
  const data = collectDashboardData();
  
  if (JSON_OUT) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }
  
  if (WEB_EXPORT) {
    const outputPath = generateWebDashboard(data);
    console.log(`\nOpen in browser: file://${outputPath}`);
    return;
  }
  
  renderDashboard(data);
  
  if (REFRESH > 0) {
    setTimeout(() => {
      main();
    }, REFRESH * 1000);
  }
}

main();
