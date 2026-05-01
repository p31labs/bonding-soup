#!/usr/bin/env node
/**
 * Glass Anomaly Detector
 * Tracks rolling health history of glass probes and detects anomalies.
 * Generates GitHub issues for consecutive failures.
 * 
 * Usage: node glass-anomaly-detector.mjs [--check-only] [--create-issue]
 * 
 * Exit codes:
 *   0 - Success (no critical anomalies or checks completed)
 *   1 - Error (file not found, JSON parse error, etc.)
 *   2 - Critical anomalies detected (when not in check-only mode)
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();
const HISTORY_FILE = path.join(ROOT, ".glass-history.json");
const ISSUE_TEMPLATE = path.join(ROOT, ".github", "ISSUE_TEMPLATE", "glass-anomaly.md");
const HISTORY_DAYS = 7;
const CONSECUTIVE_FAILURE_THRESHOLD = 3;

function loadHistory() {
  if (fs.existsSync(HISTORY_FILE)) {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
  }
  return { probes: {}, runs: [] };
}

function saveHistory(history) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

function pruneHistory(history) {
  const cutoff = Date.now() - (HISTORY_DAYS * 24 * 60 * 60 * 1000);
  history.runs = history.runs.filter(r => new Date(r.timestamp).getTime() > cutoff);
  for (const id of Object.keys(history.probes)) {
    history.probes[id].history = history.probes[id].history.filter(h => h.timestamp > cutoff);
    if (history.probes[id].history.length === 0) {
      delete history.probes[id];
    }
  }
}

function getCurrentGlassReport() {
  // Run ecosystem-glass or check existing /tmp/p31_glass_report.json
  const glassReport = path.join("/tmp", "p31_glass_report.json");
  if (fs.existsSync(glassReport)) {
    return JSON.parse(fs.readFileSync(glassReport, "utf8"));
  }
  // Try to generate via npm script
  try {
    execSync("npm run ecosystem:glass -- --output=/tmp/p31_glass_report.json 2>/dev/null", {
      stdio: "pipe",
      timeout: 30000
    });
    if (fs.existsSync(glassReport)) {
      return JSON.parse(fs.readFileSync(glassReport, "utf8"));
    }
  } catch (e) {
    // Fallback: try to read from p31ca dist
    const p31caGlass = path.join(ROOT, "andromeda", "04_SOFTWARE", "p31ca", "dist", "p31_glass_report.json");
    if (fs.existsSync(p31caGlass)) {
      return JSON.parse(fs.readFileSync(p31caGlass, "utf8"));
    }
  }
  return null;
}

function detectAnomalies(history, currentReport) {
  if (!currentReport || !currentReport.probes) {
    return { anomalies: [], summary: "No current glass report available" };
  }
  
  const anomalies = [];
  const now = new Date().toISOString();
  
  for (const probe of currentReport.probes) {
    const id = probe.id;
    const status = probe.status; // up, auth, warn, down, skipped
    
    if (!history.probes[id]) {
      history.probes[id] = { id, history: [], consecutiveFailures: 0 };
    }
    
    const probeHistory = history.probes[id];
    const entry = { timestamp: now, status, latency: probe.latencyMs, message: probe.message };
    probeHistory.history.push(entry);
    
    // Keep only recent history
    const cutoff = Date.now() - (HISTORY_DAYS * 24 * 60 * 60 * 1000);
    probeHistory.history = probeHistory.history.filter(h => new Date(h.timestamp).getTime() > cutoff);
    
    // Check for failure
    const isFailure = status === "down" || status === "skipped";
    
    if (isFailure) {
      probeHistory.consecutiveFailures = (probeHistory.consecutiveFailures || 0) + 1;
    } else {
      probeHistory.consecutiveFailures = 0;
    }
    
    // Detect anomaly
    if (probeHistory.consecutiveFailures >= CONSECUTIVE_FAILURE_THRESHOLD) {
      anomalies.push({
        probeId: id,
        probeUrl: probe.url,
        currentStatus: status,
        consecutiveFailures: probeHistory.consecutiveFailures,
        firstFailureInSeries: probeHistory.history
          .filter(h => h.status === "down" || h.status === "skipped")
          .slice(-probeHistory.consecutiveFailures)[0]?.timestamp,
        message: probe.message,
        severity: probeHistory.consecutiveFailures >= 5 ? "critical" : "warning"
      });
    }
    
    // Detect status change (recovery or degradation)
    const prevStatus = probeHistory.history[probeHistory.history.length - 2]?.status;
    if (prevStatus && prevStatus !== status) {
      if (status === "up" && (prevStatus === "down" || prevStatus === "skipped")) {
        anomalies.push({
          probeId: id,
          type: "recovery",
          previousStatus: prevStatus,
          currentStatus: status,
          message: `Recovered from ${prevStatus}`
        });
      } else if (status === "down" && prevStatus === "up") {
        anomalies.push({
          probeId: id,
          type: "degradation",
          previousStatus: prevStatus,
          currentStatus: status,
          message: "Just went down"
        });
      }
    }
  }
  
  return { anomalies, summary: `Checked ${currentReport.probes?.length || 0} probes`, history };
}

function createGitHubIssue(anomalies) {
  const critical = anomalies.filter(a => a.severity === "critical");
  const warnings = anomalies.filter(a => a.severity === "warning" && a.type !== "recovery");
  const recoveries = anomalies.filter(a => a.type === "recovery");
  
  let body = "## Glass Probe Anomaly Report\n\n";
  body += `**Detected:** ${new Date().toISOString().split("T")[0]}\n\n`;
  
  if (critical.length > 0) {
    body += "### 🔴 Critical Issues\n\n";
    for (const a of critical) {
      body += `- **${a.probeId}** (${a.probeUrl}) - ${a.consecutiveFailures} consecutive failures\n`;
      body += `  - First failure: ${a.firstFailureInSeries}\n`;
      if (a.message) body += `  - ${a.message}\n`;
      body += "\n";
    }
  }
  
  if (warnings.length > 0) {
    body += "### 🟡 Warnings\n\n";
    for (const a of warnings) {
      if (a.type === "degradation") {
        body += `- **${a.probeId}** just went down\n`;
      } else if (a.type !== "recovery") {
        body += `- **${a.probeId}** - ${a.consecutiveFailures} consecutive failures\n`;
      }
    }
    body += "\n";
  }
  
  if (recoveries.length > 0) {
    body += "### 🟢 Recoveries\n\n";
    for (const a of recoveries) {
      body += `- **${a.probeId}** recovered\n`;
    }
    body += "\n";
  }
  
  body += "### Recommended Actions\n\n";
  body += "1. Check worker logs for errors\n";
  body += "2. Verify deploy status on Cloudflare\n";
  body += "3. Review recent commits affecting the failing probe\n";
  body += "4. Check for upstream API or network issues\n";
  
  const issue = {
    title: `[Glass] ${critical.length > 0 ? "🔴 Critical" : "🟡 Warning"}: ${critical.length + warnings.length} probe anomalies`,
    body,
    labels: ["glass", "anomaly", ...(critical.length > 0 ? ["P0"] : [])]
  };
  
  return issue;
}

function createIssueCLI(issue) {
  const ghCliCommand = `gh issue create --title "${issue.title.replace(/"/g, "\\\"")}" --label "${issue.labels.join(",")}" --body '${issue.body.replace(/'/g, "'\\''")}'`;
  try {
    execSync(ghCliCommand, { stdio: "inherit", timeout: 15000 });
    return true;
  } catch (e) {
    console.error("Failed to create GitHub issue:", e.message);
    return false;
  }
}

function main() {
  let exitCode = 0;
  
  try {
    const checkOnly = process.argv.includes("--check-only");
    const createIssue = process.argv.includes("--create-issue");
    
    console.log("Glass Anomaly Detector");
    console.log(`Mode: ${checkOnly ? "CHECK ONLY" : "UPDATE HISTORY"}`);
    
    const history = loadHistory();
    const currentReport = getCurrentGlassReport();
    
    if (!currentReport) {
      console.error("❌ Could not obtain glass probe report");
      exitCode = 1;
      process.exit(exitCode);
    }
    
    const { anomalies, summary, history: updatedHistory } = detectAnomalies(history, currentReport);
    
    console.log(`\n${summary}`);
    console.log(`Anomalies detected: ${anomalies.length}`);
    
    for (const a of anomalies) {
      if (a.type === "recovery") {
        console.log(`  🟢 RECOVERY: ${a.probeId} (${a.previousStatus} → ${a.currentStatus})`);
      } else if (a.type === "degradation") {
        console.log(`  🟡 DEGRADATION: ${a.probeId} just went down`);
      } else if (a.severity === "critical") {
        console.log(`  🔴 CRITICAL: ${a.probeId} - ${a.consecutiveFailures} consecutive failures`);
      } else {
        console.log(`  🟡 WARNING: ${a.probeId} - ${a.consecutiveFailures} consecutive failures`);
      }
    }
    
    if (!checkOnly) {
      saveHistory(updatedHistory);
      console.log(`\n✓ History updated (${HISTORY_FILE})`);
    }
    
    // Determine if we should create an issue or exit with error code
    const hasCritical = anomalies.some(a => a.severity === "critical");
    const shouldCreateIssue = createIssue || (!checkOnly && hasCritical);
    
    if (anomalies.length > 0 && shouldCreateIssue) {
      const issue = createGitHubIssue(anomalies);
      console.log("\nGitHub Issue:");
      console.log(issue.body);
      
      if (createIssue) {
        console.log("\nCreating GitHub issue...");
        if (createIssueCLI(issue)) {
          console.log("✓ Issue created");
        } else {
          console.log("⚠ Failed to create issue");
          // Don't exit with error for GitHub failure - the detection worked
        }
      } else {
        console.log("\nRun with --create-issue to open GitHub issue");
      }
    }
    
    // Set exit code for CI: fail if critical anomalies found (unless check-only)
    if (hasCritical && !checkOnly) {
      exitCode = 2;  // Critical anomalies detected
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    exitCode = 1;
  } finally {
    process.exit(exitCode);
  }
}

main();
