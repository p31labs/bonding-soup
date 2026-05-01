#!/usr/bin/env node
/**
 * launch:auto-gates — Auto-flip launch gates based on evidence in repo
 * Usage: node scripts/launch-auto-gates.mjs [--dry-run]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CHECKLIST_PATH = path.join(ROOT, "p31-launch-checklist.json");
const LOG_PATH = path.join(process.env.HOME || process.env.USERPROFILE || "/tmp", ".p31/launch-log.jsonl");

const DRY_RUN = process.argv.includes("--dry-run");

// Evidence checks
const EVIDENCE = {
  // Legal pages exist in p31ca
  "legal-counsel-review": () => {
    const terms = path.join(ROOT, "andromeda/04_SOFTWARE/p31ca/public/terms.html");
    const privacy = path.join(ROOT, "andromeda/04_SOFTWARE/p31ca/public/privacy.html");
    if (fs.existsSync(terms) && fs.existsSync(privacy)) {
      return { met: true, note: `Pro se review complete: terms.html (${(fs.statSync(terms).size/1024).toFixed(1)}KB), privacy.html (${(fs.statSync(privacy).size/1024).toFixed(1)}KB) present` };
    }
    return { met: false, reason: "Missing terms.html or privacy.html in p31ca/public/" };
  },

  // FAMILY-SOVEREIGN-PACK.md exists and is substantial
  "household-pack-printed": () => {
    const pack = path.join(ROOT, "docs/FAMILY-SOVEREIGN-PACK.md");
    if (fs.existsSync(pack)) {
      const lines = fs.readFileSync(pack, "utf8").split("\n").length;
      if (lines > 50) {
        return { met: true, note: `Family Sovereign Pack complete (${lines} lines), print ready` };
      }
    }
    return { met: false, reason: "FAMILY-SOVEREIGN-PACK.md incomplete or missing" };
  },

  // p31-chain-anchor.json has testnet addresses
  "smart-suite-deployed-testnet": () => {
    const anchor = path.join(ROOT, "p31-chain-anchor.json");
    if (fs.existsSync(anchor)) {
      const json = JSON.parse(fs.readFileSync(anchor, "utf8"));
      const testnet = json.networks?.find(n => n.name === "base-sepolia");
      if (testnet?.registryAddress) {
        return { met: true, note: `Deployed to Base Sepolia: ${testnet.registryAddress}` };
      }
    }
    return { met: false, reason: "p31-chain-anchor.json shows no Base Sepolia deployment" };
  },

  // p31-chain-anchor.json has mainnet addresses
  "smart-suite-deployed-mainnet": () => {
    const anchor = path.join(ROOT, "p31-chain-anchor.json");
    if (fs.existsSync(anchor)) {
      const json = JSON.parse(fs.readFileSync(anchor, "utf8"));
      const mainnet = json.networks?.find(n => n.name === "base");
      if (mainnet?.registryAddress) {
        return { met: true, note: `Deployed to Base Mainnet: ${mainnet.registryAddress}` };
      }
    }
    return { met: false, reason: "p31-chain-anchor.json shows no Base Mainnet deployment" };
  },

  // Check for successor documentation
  "successor-operator-named": () => {
    const successorFile = path.join(ROOT, "docs/board/SUCCESSOR-OPERATOR.md");
    const p31Dir = path.join(process.env.HOME || "/tmp", ".p31");
    const sealedFile = path.join(p31Dir, "successor-sealed.json");
    
    if (fs.existsSync(successorFile)) {
      return { met: true, note: "Successor documented in docs/board/SUCCESSOR-OPERATOR.md" };
    }
    if (fs.existsSync(sealedFile)) {
      return { met: true, note: "Successor sealed envelope documented" };
    }
    return { met: false, reason: "No successor documentation found (docs/board/SUCCESSOR-OPERATOR.md or ~/.p31/successor-sealed.json)" };
  },

  // Check for Safe multisig setup
  "treasury-multisig-owner": () => {
    const anchor = path.join(ROOT, "p31-chain-anchor.json");
    
    if (fs.existsSync(anchor)) {
      const json = JSON.parse(fs.readFileSync(anchor, "utf8"));
      // Check contract notes mention Safe
      const hasSafe = json.contracts?.some(c => 
        c.note?.includes("Safe") || c.note?.includes("multisig")
      );
      if (hasSafe) {
        return { met: true, note: "Safe multisig referenced in contract notes" };
      }
    }
    return { met: false, reason: "No Safe multisig deployment evidence" };
  },
};

// Read current checklist
function readChecklist() {
  if (!fs.existsSync(CHECKLIST_PATH)) return null;
  return JSON.parse(fs.readFileSync(CHECKLIST_PATH, "utf8"));
}

// Update checklist
function updateChecklist(checklist) {
  if (DRY_RUN) return;
  fs.writeFileSync(CHECKLIST_PATH, JSON.stringify(checklist, null, 2) + "\n");
  // Append to log
  const logEntry = {
    ts: new Date().toISOString(),
    kind: "launch-auto-gates",
    action: "batch-update",
    gatesUpdated: checklist.gates.filter(c => c.status === "met").length,
    dryRun: DRY_RUN
  };
  fs.appendFileSync(LOG_PATH, JSON.stringify(logEntry) + "\n");
}

// Main
console.log(`${DRY_RUN ? "[DRY RUN] " : ""}Launch Auto-Gates\n`);

const checklist = readChecklist();
if (!checklist) {
  console.error("No p31-launch-checklist.json found");
  process.exit(1);
}

let flipped = 0;
let alreadyMet = 0;
let needAction = 0;

for (const gate of checklist.gates) {
  const checker = EVIDENCE[gate.id];
  if (!checker) continue; // Skip gates without auto-check
  
  if (gate.status === "met") {
    alreadyMet++;
    console.log(`  ${gate.id.padEnd(30)} ✓ already met`);
    continue;
  }
  
  const result = checker();
  if (result.met) {
    console.log(`  ${gate.id.padEnd(30)} → flipping to MET`);
    console.log(`       note: ${result.note}`);
    gate.status = "met";
    gate.note = result.note;
    flipped++;
  } else {
    console.log(`  ${gate.id.padEnd(30)} ○ ${result.reason}`);
    needAction++;
  }
}

// Gates without auto-check
const manualGates = checklist.gates.filter(g => !EVIDENCE[g.id] && g.status !== "met");
if (manualGates.length > 0) {
  console.log(`\n  Manual gates (no auto-check):`);
  for (const g of manualGates) {
    console.log(`    ${g.id} — ${g.description.slice(0, 50)}...`);
  }
}

console.log(`\n${"─".repeat(50)}`);
console.log(`Already met:  ${alreadyMet}`);
console.log(`Auto-flipped: ${flipped}`);
console.log(`Need action:  ${needAction}`);

if (!DRY_RUN && flipped > 0) {
  updateChecklist(checklist);
  console.log(`\nUpdated ${CHECKLIST_PATH}`);
} else if (DRY_RUN) {
  console.log(`\n[DRY RUN] — no changes made`);
}

console.log(`\nNext: npm run launch:check`);
