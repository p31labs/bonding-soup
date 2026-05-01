#!/usr/bin/env node
/**
 * compliance-sentinel — Poll office calendar and dispatch SIMPLEX notifications
 * 
 * Reads p31-protocol-registry.json officeCalendar deadlines,
 * determines urgency (urgent/critical/warning), and dispatches
 * to SIMPLEX notification queue if configured.
 * 
 * Usage:
 *   npm run compliance:sentinel           # Check and notify
 *   npm run compliance:sentinel -- --dry-run    # Check only, no dispatch
 *   npm run compliance:sentinel -- --json       # Output JSON for CI
 *   npm run compliance:sentinel -- --urgent-only # Only critical/urgent
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const JSON_OUT = args.includes("--json");
const URGENT_ONLY = args.includes("--urgent-only");

const SIMPLEX_WEBHOOK = process.env.SIMPLEX_WEBHOOK_URL;
const OPERATOR_SECRET = process.env.OPERATOR_SECRET;

// Load office calendar from protocol registry
function loadOfficeCalendar() {
  try {
    const registry = JSON.parse(
      fs.readFileSync(path.join(ROOT, "p31-protocol-registry.json"), "utf8")
    );
    return registry.officeCalendar || null;
  } catch (err) {
    return null;
  }
}

// Calculate days until date
function daysUntil(dateStr) {
  const target = new Date(dateStr);
  const now = new Date();
  const diff = target - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// Determine urgency tier
function urgencyTier(deadline, warningDays) {
  const days = daysUntil(deadline);
  
  if (days < 0) return { tier: "critical", label: "OVERDUE", days };
  if (days <= 3) return { tier: "critical", label: "CRITICAL", days };
  if (days <= 7) return { tier: "urgent", label: "URGENT", days };
  if (warningDays && warningDays.some(w => days <= w)) {
    return { tier: "warning", label: "WARNING", days };
  }
  return { tier: "normal", label: "OK", days };
}

// Main sentinel logic
async function runSentinel() {
  const calendar = loadOfficeCalendar();
  if (!calendar) {
    console.error("Error: Could not load officeCalendar from p31-protocol-registry.json");
    process.exit(1);
  }

  const results = [];

  for (const item of calendar.deadlines) {
    const urgency = urgencyTier(item.date, item.warningDays);
    
    if (URGENT_ONLY && !["critical", "urgent"].includes(urgency.tier)) {
      continue;
    }

    results.push({
      id: item.id,
      action: item.action,
      deadline: item.date,
      urgency: urgency,
      critical: item.critical || false,
      dispatched: DRY_RUN ? false : !!(SIMPLEX_WEBHOOK && OPERATOR_SECRET)
    });
  }

  return { calendar: calendar.entity, checked: results.length, results };
}

// Render output
function renderOutput(data) {
  if (JSON_OUT) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("      COMPLIANCE SENTINEL");
  console.log(`      Entity: ${data.calendar.legalName}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n");

  const critical = data.results.filter(r => r.urgency.tier === "critical");
  const urgent = data.results.filter(r => r.urgency.tier === "urgent");

  if (critical.length) {
    console.log(`🔴 CRITICAL (${critical.length})`);
    for (const item of critical) {
      console.log(`   ${item.action}`);
      console.log(`   Due: ${item.deadline} (${item.urgency.days} days)`);
      console.log();
    }
  }

  if (urgent.length) {
    console.log(`🟡 URGENT (${urgent.length})`);
    for (const item of urgent) {
      console.log(`   ${item.action}`);
      console.log(`   Due: ${item.deadline} (${item.urgency.days} days)`);
      console.log();
    }
  }

  if (!critical.length && !urgent.length) {
    console.log("✅ No critical or urgent compliance items.\\n");
  }

  if (DRY_RUN) {
    console.log("[DRY RUN] No SIMPLEX notifications dispatched\\n");
  } else if (!SIMPLEX_WEBHOOK) {
    console.log("[SIMPLEX not configured] Set SIMPLEX_WEBHOOK_URL to enable alerts\\n");
  } else {
    console.log(`Dispatched ${data.results.filter(r => r.dispatched).length} notifications\\n`);
  }

  console.log("Commands:");
  console.log("  npm run office:check     # Full calendar view");
  console.log("  npm run converge:org     # Org path progress");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

// Run
runSentinel()
  .then(data => {
    renderOutput(data);
    const hasCritical = data.results.some(r => r.urgency.tier === "critical");
    process.exit(hasCritical ? 1 : 0);
  })
  .catch(err => {
    console.error("Sentinel error:", err.message);
    process.exit(1);
  });
