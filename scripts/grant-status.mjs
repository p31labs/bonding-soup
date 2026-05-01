#!/usr/bin/env node
/**
 * grant-status — Active grant opportunities dashboard
 * 
 * Shows current P31 grant pipeline with deadlines, amounts, and status.
 * 
 * Usage:
 *   npm run grant:status
 *   npm run grant:status -- --json
 *   npm run grant:status -- --urgent
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const JSON_OUT = args.includes("--json");
const URGENT_ONLY = args.includes("--urgent");

const today = new Date();
const GRANTS = [
  {
    id: "nlnet-ngi-zero-commons",
    funder: "NLnet Foundation",
    program: "NGI Zero Commons",
    amount: "€15,000",
    deadline: "2026-06-01",
    status: "active",
    priority: "P0",
    daysLeft: Math.ceil((new Date("2026-06-01") - today) / (1000 * 60 * 60 * 24)),
    focus: "Open protocol specification for K4 mesh",
    fit: "High — aligns with 22 Zenodo DOIs on synergetic geometry",
    draftStatus: fs.existsSync(path.join(ROOT, "docs/grants/nlnet-ngi-zero-commons-application.md")) ? "exists" : "missing",
    autoDraftReady: true,
  },
  {
    id: "asan-disability-justice",
    funder: "ASAN (Autistic Self Advocacy Network)",
    program: "Teighlor McGee Disability Justice Mini-Grant",
    amount: "$6,250",
    opens: "2026-05-15",
    status: "opens_soon",
    priority: "P1",
    daysToOpen: Math.ceil((new Date("2026-05-15") - today) / (1000 * 60 * 60 * 24)),
    focus: "Autistic-led assistive technology",
    fit: "High — operator-founded, AuDHD-designed tech",
    draftStatus: "can_prep",
    autoDraftReady: true,
  },
  {
    id: "stimpunks-foundation",
    funder: "Stimpunks Foundation",
    program: "Direct Support Grant",
    amount: "$3,000",
    opens: "2026-06-01",
    status: "opens_soon",
    priority: "P2",
    daysToOpen: Math.ceil((new Date("2026-06-01") - today) / (1000 * 60 * 60 * 24)),
    focus: "Hardware + IP protection for assistive tech",
    fit: "Medium — needs provisional patent filed first",
    draftStatus: "blocked",
    blockers: ["provisional-patent-not-filed", "hardware-prototype-not-built"],
    autoDraftReady: false,
  },
  {
    id: "awesome-foundation",
    funder: "Awesome Foundation",
    program: "Monthly Grant",
    amount: "$1,000",
    status: "decision_pending",
    priority: "P3",
    focus: "Unrestricted community project",
    fit: "Low — small amount, high effort",
    draftStatus: "na",
    autoDraftReady: false,
  },
  {
    id: "p31ca-initial-build",
    funder: "P31 Labs Internal",
    program: "Initial Build Campaign",
    amount: "$500-$2,000",
    status: "internal",
    priority: "P1",
    focus: "First 50 room codes + Super-Centaur pack",
    fit: "Critical — market launch dependency",
    draftStatus: "in_progress",
    autoDraftReady: false,
  }
];

function formatMoney(amount) {
  return amount.replace(/[^\d,.$€]/g, "");
}

function urgencyColor(days) {
  if (days <= 7) return "🔴";
  if (days <= 14) return "🟡";
  return "🟢";
}

function renderTable() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("                 P31 GRANT OPPORTUNITIES");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const active = GRANTS.filter(g => g.status === "active" && (!URGENT_ONLY || g.daysLeft <= 14));
  const upcoming = GRANTS.filter(g => g.status === "opens_soon" && (!URGENT_ONLY || g.daysToOpen <= 14));
  const other = GRANTS.filter(g => !["active", "opens_soon"].includes(g.status));

  if (active.length) {
    console.log("🎯 ACTIVE — Submit Now\n");
    for (const g of active) {
      const color = urgencyColor(g.daysLeft);
      console.log(`${color} ${g.funder}`);
      console.log(`   Program: ${g.program}`);
      console.log(`   Amount:  ${g.amount}`);
      console.log(`   Due:     ${g.deadline} (${g.daysLeft} days)`);
      console.log(`   Focus:   ${g.focus}`);
      console.log(`   Draft:   ${g.draftStatus === "exists" ? "✓ Exists" : "⚠ Auto-draft ready"}`);
      console.log(`   Command: npm run grant:draft -- --target ${g.id}\n`);
    }
  }

  if (upcoming.length) {
    console.log("⏰ OPENING SOON — Prep Now\n");
    for (const g of upcoming) {
      console.log(`🟡 ${g.funder}`);
      console.log(`   Program: ${g.program}`);
      console.log(`   Amount:  ${g.amount}`);
      console.log(`   Opens:   ${g.opens} (${g.daysToOpen} days)`);
      console.log(`   Focus:   ${g.focus}`);
      if (g.blockers) {
        console.log(`   ⚠️ Blockers: ${g.blockers.join(", ")}`);
      }
      console.log(`   Command: npm run grant:draft:dry -- --target ${g.id}\n`);
    }
  }

  if (!URGENT_ONLY && other.length) {
    console.log("📋 OTHER\n");
    for (const g of other) {
      console.log(`⚪ ${g.funder} — ${g.status.replace("_", " ")}`);
      console.log(`   Amount: ${g.amount}, Priority: ${g.priority}\n`);
    }
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Quick commands:");
  console.log("  npm run grant:draft -- --target nlnet-ngi-zero-commons");
  console.log("  npm run grant:draft:dry -- --target asan-disability-justice");
  console.log("  npm run office:check");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

function renderJson() {
  const output = {
    generated: today.toISOString(),
    summary: {
      active: GRANTS.filter(g => g.status === "active").length,
      openingSoon: GRANTS.filter(g => g.status === "opens_soon").length,
      urgent: GRANTS.filter(g => (g.daysLeft || 999) <= 14 || (g.daysToOpen || 999) <= 14).length,
      totalPipeline: GRANTS.reduce((sum, g) => sum + parseInt(g.amount.replace(/[^\d]/g, "") || 0), 0),
    },
    grants: GRANTS
  };
  console.log(JSON.stringify(output, null, 2));
}

if (JSON_OUT) {
  renderJson();
} else {
  renderTable();
}
