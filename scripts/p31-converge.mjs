#!/usr/bin/env node
/**
 * p31-converge — Parallel paths convergence tracker
 * 
 * Tracks four parallel work streams toward market launch:
 *   - grants: Funding acquisition
 *   - technical: TRIPER + mesh certification  
 *   - org: Compliance + filings
 *   - launch: Market readiness gates
 * 
 * Convergence milestones:
 *   M1: Pre-submission ready (2026-05-25)
 *   M2: Technical certification (2026-05-15)
 *   M3: Public launch (2026-06-15)
 * 
 * Usage:
 *   npm run converge
 *   npm run converge -- --path grants
 *   npm run converge -- --milestone M1
 *   npm run converge -- --json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const JSON_OUT = args.includes("--json");
const PATH_FILTER = args.find(a => a.startsWith("--path"))?.split("=")[1] || null;
const MILESTONE_FILTER = args.find(a => a.startsWith("--milestone"))?.split("=")[1] || null;

function readConfig() {
  const configPath = path.join(ROOT, "p31-convergence.json");
  return JSON.parse(fs.readFileSync(configPath, "utf8"));
}

function statusEmoji(status) {
  return { ready: "✅", "in_progress": "🔄", pending: "⏳", blocked: "🚫", met: "✓" }[status] || "⚪";
}

function pathProgress(path) {
  const items = path.workItems;
  const done = items.filter(i => i.status === "met" || i.status === "ready").length;
  const blocked = items.filter(i => i.status === "blocked").length;
  const total = items.length;
  return { done, blocked, total, pct: Math.round((done / total) * 100) };
}

function milestoneReady(milestone, paths) {
  const results = [];
  let allReady = true;

  for (const req of milestone.requires) {
    const path = paths.find(p => p.id === req.path);
    const items = path?.workItems || [];
    
    for (const itemId of req.items) {
      const item = items.find(i => i.id === itemId);
      const ready = item && (item.status === "ready" || item.status === "met");
      results.push({
        path: req.path,
        item: itemId,
        title: item?.title || "?",
        ready,
        status: item?.status || "missing"
      });
      if (!ready) allReady = false;
    }
  }

  return { ready: allReady, items: results };
}

function daysUntil(dateStr) {
  const days = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  return days;
}

function renderConvergence(config) {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("           P31 PARALLEL PATHS → MARKET LAUNCH");
  console.log(`           Target: ${config.target.date} (${daysUntil(config.target.date)} days)`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const paths = PATH_FILTER 
    ? config.paths.filter(p => p.id === PATH_FILTER)
    : config.paths;

  // Paths status
  console.log("PARALLEL PATHS\n");
  for (const p of paths) {
    const prog = pathProgress(p);
    const bar = "█".repeat(prog.pct / 10) + "░".repeat(10 - prog.pct / 10);
    
    console.log(`${p.name} ${prog.blocked > 0 ? "🚫" : ""}`);
    console.log(`  [${bar}] ${prog.pct}% (${prog.done}/${prog.total})`);
    
    for (const item of p.workItems) {
      const emoji = statusEmoji(item.status);
      const blocking = item.blocking ? " [BLOCKING]" : "";
      const due = item.due ? ` (due ${item.due})` : "";
      console.log(`    ${emoji} ${item.title}${blocking}${due}`);
    }
    
    if (p.commands.status) {
      console.log(`  → ${p.commands.status}`);
    }
    console.log();
  }

  // Milestones
  const milestones = MILESTONE_FILTER
    ? config.milestones.filter(m => m.id === MILESTONE_FILTER)
    : config.milestones;

  console.log("CONVERGENCE MILESTONES\n");
  for (const m of milestones) {
    const days = daysUntil(m.date);
    const check = milestoneReady(m, config.paths);
    const status = check.ready ? "✅ READY TO CONVERGE" : days < 0 ? "🔴 OVERDUE" : days < 7 ? "🟡 URGENT" : "🟢 ON TRACK";
    
    console.log(`${m.id}: ${m.name}`);
    console.log(`   Date: ${m.date} (${days} days) ${status}`);
    console.log(`   ${m.description}`);
    
    if (!check.ready) {
      console.log("   Blockers:");
      for (const item of check.items.filter(i => !i.ready)) {
        console.log(`     • ${item.path}: ${item.title} (${item.status})`);
      }
    }
    
    if (m.gateCommand) {
      console.log(`   → ${m.gateCommand}`);
    }
    console.log();
  }

  // Convergence rules
  console.log("CONVERGENCE RULES");
  for (const rule of config.convergenceRules) {
    console.log(`  • ${rule}`);
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Commands:");
  console.log("  npm run converge -- --path grants     # Single path view");
  console.log("  npm run converge -- --milestone M2    # Milestone gate check");
  console.log("  npm run converge -- --json            # Machine readable");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

function renderJson(config) {
  const output = {
    generated: new Date().toISOString(),
    target: config.target,
    paths: config.paths.map(p => ({
      ...p,
      progress: pathProgress(p)
    })),
    milestones: config.milestones.map(m => ({
      ...m,
      convergence: milestoneReady(m, config.paths),
      daysLeft: daysUntil(m.date)
    }))
  };
  console.log(JSON.stringify(output, null, 2));
}

// Main
const config = readConfig();

if (JSON_OUT) {
  renderJson(config);
} else {
  renderConvergence(config);
}
