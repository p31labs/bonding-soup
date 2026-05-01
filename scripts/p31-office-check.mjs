#!/usr/bin/env node
/**
 * p31-office-check — Compliance calendar checker
 * Reads from p31-protocol-registry.json officeCalendar
 * 
 * Usage:
 *   node scripts/p31-office-check.mjs              # Check all deadlines
 *   node scripts/p31-office-check.mjs --urgent-only  # Only urgent/overdue
 *   node scripts/p31-office-check.mjs --json        # JSON output
 *   node scripts/p31-office-check.mjs --generate   # Auto-generate needed docs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const URGENT_ONLY = args.includes("--urgent-only");
const JSON_OUTPUT = args.includes("--json");
const GENERATE = args.includes("--generate");

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function daysUntil(dateStr) {
  const deadline = new Date(dateStr);
  const now = new Date();
  return Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
}

function formatDays(days) {
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "TODAY";
  if (days === 1) return "1 day";
  return `${days} days`;
}

// Load registry
const registryPath = path.join(ROOT, "p31-protocol-registry.json");
const registry = readJson(registryPath);

if (!registry || !registry.officeCalendar) {
  console.error("Error: officeCalendar not found in p31-protocol-registry.json");
  process.exit(1);
}

const calendar = registry.officeCalendar;
const entity = calendar.entity;
const deadlines = calendar.deadlines || [];

// Categorize deadlines
const now = new Date();
const categories = {
  overdue: [],
  urgent: [],
  upcoming: [],
  future: []
};

for (const d of deadlines) {
  const days = daysUntil(d.date);
  const item = { ...d, daysUntil: days };
  
  if (days < 0) {
    categories.overdue.push(item);
  } else if (d.urgent || days <= 3) {
    categories.urgent.push(item);
  } else if (days <= 30) {
    categories.upcoming.push(item);
  } else {
    categories.future.push(item);
  }
}

// Sort by days until
for (const cat of Object.values(categories)) {
  cat.sort((a, b) => a.daysUntil - b.daysUntil);
}

// Output
if (JSON_OUTPUT) {
  console.log(JSON.stringify({
    entity,
    timestamp: now.toISOString(),
    summary: {
      total: deadlines.length,
      overdue: categories.overdue.length,
      urgent: categories.urgent.length,
      upcoming: categories.upcoming.length,
      future: categories.future.length
    },
    categories
  }, null, 2));
  process.exit(0);
}

// Human-readable output
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`  P31 Office Compliance Check`);
console.log(`  ${entity.legalName}`);
console.log(`  EIN: ${entity.ein}`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

if (categories.overdue.length) {
  console.log(`🔴 OVERDUE (${categories.overdue.length}):`);
  for (const d of categories.overdue) {
    console.log(`   ${d.id}`);
    console.log(`      ${formatDays(d.daysUntil)} — ${d.action}`);
    if (d.contact) console.log(`      Contact: ${d.contact}`);
    console.log("");
  }
}

if (categories.urgent.length) {
  console.log(`⚠️  URGENT (${categories.urgent.length}):`);
  for (const d of categories.urgent) {
    const amount = d.amount ? ` [${d.amount}]` : "";
    const critical = d.critical ? " [CRITICAL]" : "";
    console.log(`   ${d.id}${critical}${amount}`);
    console.log(`      ${formatDays(d.daysUntil)} — ${d.action}`);
    if (d.draft) console.log(`      Draft: ${d.draft}`);
    if (d.template) console.log(`      Template: ${d.template}`);
    console.log("");
  }
}

if (!URGENT_ONLY && categories.upcoming.length) {
  console.log(`📅 UPCOMING (${categories.upcoming.length}):`);
  for (const d of categories.upcoming.slice(0, 5)) {
    const amount = d.amount ? ` [${d.amount}]` : "";
    console.log(`   ${d.id}${amount}`);
    console.log(`      ${formatDays(d.daysUntil)} — ${d.action}`);
    console.log("");
  }
}

if (!URGENT_ONLY && categories.future.length) {
  console.log(`📆 FUTURE (${categories.future.length}):`);
  for (const d of categories.future.slice(0, 3)) {
    console.log(`   ${d.id} — ${formatDays(d.daysUntil)}`);
  }
  console.log("");
}

// Suggested actions
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log("SUGGESTED ACTIONS:");

// Check for board meeting within 45 days
const boardMeeting = deadlines.find(d => d.id.includes("board-meeting") && daysUntil(d.date) <= 45 && daysUntil(d.date) > 0);
if (boardMeeting) {
  console.log(`\n1. Board meeting ${formatDays(boardMeeting.daysUntil)}:`);
  console.log(`   npm run office:notice`);
  console.log(`   # Then: Edit docs/board/BOARD-MEETING-XXX-NOTICE.md`);
}

// Check for COI forms needed
const coiDeadline = deadlines.find(d => d.id.includes("conflict-interest"));
if (coiDeadline && daysUntil(coiDeadline.date) <= 30) {
  console.log(`\n2. Conflict of Interest forms due ${formatDays(daysUntil(coiDeadline.date))}:`);
  console.log(`   npm run office:coi`);
  console.log(`   # Generates form for each director`);
}

console.log(`\n3. Check all compliance:`);
console.log(`   npm run office:check`);

console.log(`\n4. Generate documents:`);
console.log(`   npm run foundry -- run office-generate --template board-notice`);
console.log(`   npm run foundry -- run office-generate --template coi-form`);

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

// Exit code based on urgency
const hasCritical = categories.overdue.length > 0 || categories.urgent.some(d => d.critical);
if (hasCritical) {
  console.log("\n❌ CRITICAL ITEMS PENDING");
  process.exit(1);
} else if (categories.urgent.length > 0) {
  console.log("\n⚠️  URGENT ITEMS PENDING");
  process.exit(2);
} else {
  console.log("\n✓ All clear");
  process.exit(0);
}
