#!/usr/bin/env node
/**
 * grant-autodraft — Auto-generate grant applications from P31 corpus
 * 
 * Uses RAG (Retrieval Augmented Generation) over:
 *   - Zenodo publication series (22 papers)
 *   - Technical docs (K4 agent hubs, mesh architecture)
 *   - MVP deliverables inventory
 *   - p31-constants.json (org details, financials)
 * 
 * Generates draft narratives that the operator reviews/edits before submission.
 * 
 * Usage:
 *   npm run grant:draft -- --target nlnet-ngi-zero-commons
 *   npm run grant:draft -- --target asan-disability-justice --voice personal
 *   npm run grant:draft -- --target stimpunks-foundation --focus hardware
 * 
 * Output: docs/grants/auto-drafts/<target>-<timestamp>.md
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const TARGET = args.find(a => a.startsWith("--target"))?.split("=")[1] || args[args.indexOf("--target") + 1];
const VOICE = args.find(a => a.startsWith("--voice"))?.split("=")[1] || "operator";
const FOCUS = args.find(a => a.startsWith("--focus"))?.split("=")[1] || null;
const DRY_RUN = args.includes("--dry-run");

if (!TARGET) {
  console.error("Usage: npm run grant:draft -- --target <grant-id> [--voice personal|technical] [--focus hardware|software|education]");
  console.error("\nAvailable targets:");
  console.error("  nlnet-ngi-zero-commons     — €15,000, deadline June 1");
  console.error("  asan-disability-justice    — $6,250, opens May 15");
  console.error("  stimpunks-foundation       — $3,000, opens June 1");
  console.error("  awesome-foundation         — $1,000, decision pending");
  process.exit(1);
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION — Grant target definitions
// ═══════════════════════════════════════════════════════════════════════════════

const GRANT_TARGETS = {
  "nlnet-ngi-zero-commons": {
    name: "NLnet NGI Zero Commons",
    amount: "€15,000",
    deadline: "2026-06-01",
    hardDeadline: true,
    focus: "Open protocol specification for K4 mesh (wire format, federation)",
    audience: "technical reviewers, open source funders",
    tone: "technical precision + commons value",
    sections: ["Motivation", "Project description", "Why NLnet", "Deliverables", "Timeline", "Budget"],
    corpusWeight: { technical: 0.7, personal: 0.2, financial: 0.1 },
    existingDraft: "docs/grants/nlnet-ngi-zero-commons-application.md"
  },
  "asan-disability-justice": {
    name: "ASAN Teighlor McGee Disability Justice Mini-Grant",
    amount: "$6,250",
    opens: "2026-05-15",
    focus: "Autistic-led assistive technology for neurodivergent individuals",
    audience: "disability justice advocates, autistic community",
    tone: "lived experience + community impact",
    sections: ["Narrative", "Need", "Approach", "Impact", "Budget"],
    corpusWeight: { personal: 0.5, technical: 0.3, mvp: 0.2 },
    narrativeLength: "500 words",
    operatorVoice: true
  },
  "stimpunks-foundation": {
    name: "Stimpunks Foundation Grant",
    amount: "$3,000",
    opens: "2026-06-01",
    focus: "Hardware + IP protection for assistive technology",
    audience: "neurodivergence-focused funders",
    tone: "constraint-first + pragmatic solutions",
    sections: ["Project summary", "Why needed", "Plan", "Budget"],
    corpusWeight: { technical: 0.4, personal: 0.3, financial: 0.3 },
    fundingGated: ["provisional-patent", "hardware-prototype"]
  },
  "awesome-foundation": {
    name: "Awesome Foundation",
    amount: "$1,000",
    status: "decision_pending",
    focus: "Unrestricted, quick-turn community projects",
    audience: "general public, innovation enthusiasts",
    tone: "accessible + tangible outcomes",
    sections: ["One-sentence pitch", "What will you do", "Why awesome"],
    corpusWeight: { mvp: 0.4, personal: 0.4, technical: 0.2 },
    brevity: "short form"
  }
};

const target = GRANT_TARGETS[TARGET];
if (!target) {
  console.error(`Unknown target: ${TARGET}`);
  console.error(`Available: ${Object.keys(GRANT_TARGETS).join(", ")}`);
  process.exit(1);
}

// ═══════════════════════════════════════════════════════════════════════════════
// CORPUS INDEXER — Build RAG context from P31 knowledge base
// ═══════════════════════════════════════════════════════════════════════════════

function readJson(p) {
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; }
}

function readFile(p, limitLines = null) {
  try {
    const content = fs.readFileSync(p, "utf8");
    if (!limitLines) return content;
    return content.split("\n").slice(0, limitLines).join("\n");
  } catch { return null; }
}

function findZenodoPapers() {
  const constants = readJson(path.join(ROOT, "p31-constants.json"));
  if (!constants?.research?.papers) return [];
  return constants.research.papers.map(p => ({
    id: p.id,
    series: p.series,
    title: p.title,
    doi: p.doi,
    published: p.published,
    url: `https://doi.org/${p.doi}`
  }));
}

function extractCorpus() {
  const corpus = {
    organization: {},
    technical: [],
    personal: [],
    mvps: [],
    financial: {},
    papers: []
  };

  // 1. Organization details from constants
  const constants = readJson(path.join(ROOT, "p31-constants.json"));
  if (constants?.organization) {
    corpus.organization = {
      legalName: constants.organization.legalName,
      ein: constants.organization.ein,
      incorporated: constants.organization.incorporationDate,
      state: constants.organization.stateOfIncorporation,
      status501c3: constants.organization.status501c3,
      filedDate: constants.organization.filedDate
    };
  }
  if (constants?.research) {
    corpus.organization.orcid = constants.research.orcid;
    corpus.organization.zenodoCount = constants.research.zenodoPublicationCount;
  }
  if (constants?.contact) {
    corpus.organization.primaryEmail = constants.contact.primaryEmail;
  }

  // 2. Technical docs
  const techDocs = [
    "docs/P31-K4-AGENT-HUBS.md",
    "docs/MESH-ARCHITECTURE-CANON.md",
    "docs/SIC-POVM-K4-ARCHITECTURE.md",
    "docs/P31-TRIPER-SYSTEM.md"
  ];
  for (const doc of techDocs) {
    const content = readFile(path.join(ROOT, doc), 100);
    if (content) {
      corpus.technical.push({ source: doc, excerpt: content.slice(0, 2000) });
    }
  }

  // 3. MVP inventory
  const mvpContent = readFile(path.join(ROOT, "docs/MVP-DELIVERABLES-INVENTORY.md"), 80);
  if (mvpContent) {
    corpus.mvps.push({ source: "MVP-DELIVERABLES-INVENTORY.md", excerpt: mvpContent });
  }

  // 4. Personal narrative (if voice=personal)
  if (VOICE === "personal" || VOICE === "operator") {
    const passportPath = path.join(ROOT, "P31 COGNITIVE PASSPORT — v5.md");
    if (fs.existsSync(passportPath)) {
      const passport = readFile(passportPath, 50);
      corpus.personal.push({ source: "Cognitive Passport v5", excerpt: passport });
    }
  }

  // 5. Zenodo papers bibliography
  corpus.papers = findZenodoPapers();

  // 6. Existing grant draft (if exists)
  if (target.existingDraft) {
    const existing = readFile(path.join(ROOT, target.existingDraft), 150);
    if (existing) {
      corpus.existingDraft = existing;
    }
  }

  return corpus;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROMPT BUILDER — Construct context-aware prompts for p31-narrator
// ═══════════════════════════════════════════════════════════════════════════════

function buildPrompt(corpus, section) {
  const org = corpus.organization;
  
  let context = `GRANT APPLICATION DRAFT: ${target.name}\n`;
  context += `Amount: ${target.amount}\n`;
  context += `Organization: ${org.legalName} (EIN ${org.ein})\n`;
  context += `Status: ${org.status501c3}, filed ${org.filedDate}\n`;
  context += `Research: ${org.zenodoCount} Zenodo DOIs, ORCID ${org.orcid}\n\n`;

  // Technical context
  if (target.corpusWeight.technical > 0 && corpus.technical.length) {
    context += `TECHNICAL ARCHITECTURE:\n`;
    for (const t of corpus.technical.slice(0, 2)) {
      context += `--- ${t.source} ---\n${t.excerpt.slice(0, 800)}\n\n`;
    }
  }

  // MVP proof
  if (target.corpusWeight.mvp > 0 && corpus.mvps.length) {
    context += `PROOF OF CAPABILITY (MVP Inventory):\n`;
    context += corpus.mvps[0].excerpt.slice(0, 1000);
    context += "\n\n";
  }

  // Personal narrative
  if (target.corpusWeight.personal > 0 && corpus.personal.length) {
    context += `OPERATOR CONTEXT:\n`;
    context += corpus.personal[0].excerpt.slice(0, 600);
    context += "\n\n";
  }

  // Research foundation
  if (corpus.papers.length) {
    context += `RESEARCH FOUNDATION:\n`;
    context += `Published ${corpus.papers.length} papers including:\n`;
    for (const p of corpus.papers.slice(0, 5)) {
      context += `  - ${p.title} (DOI: ${p.doi})\n`;
    }
    context += "\n";
  }

  // Existing draft (if adapting)
  if (corpus.existingDraft) {
    context += `EXISTING DRAFT (adapt from):\n`;
    context += corpus.existingDraft.slice(0, 1500);
    context += "\n\n";
  }

  context += `SECTION TO WRITE: ${section}\n`;
  context += `Target tone: ${target.tone}\n`;
  context += `Target audience: ${target.audience}\n`;
  context += `Focus: ${FOCUS || target.focus}\n\n`;

  if (target.narrativeLength) {
    context += `Length: ${target.narrativeLength}\n`;
  }

  if (target.operatorVoice) {
    context += `\nIMPORTANT: Write in first person as the operator. Use authentic voice — mention AuDHD, hypoparathyroidism, and late diagnosis only if they shape the why, not as sympathy play.\n`;
  }

  context += `\nWrite the ${section} section now. Be specific, avoid generic filler. Cite actual P31 capabilities and research.\n`;

  return context;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GENERATION — Call p31-narrator via Ollama or write structured draft
// ═══════════════════════════════════════════════════════════════════════════════

function generateViaTemplate(corpus) {
  // Template-based generation (no Ollama dependency for v1)
  // Uses structured templates filled from corpus
  
  const org = corpus.organization;
  const dateStr = new Date().toISOString().split("T")[0];
  
  let draft = `# GRANT APPLICATION DRAFT\n`;
  draft += `# ${target.name}\n`;
  draft += `# Generated: ${dateStr}\n`;
  draft += `# Status: REQUIRES OPERATOR REVIEW\n\n`;
  
  draft += `---\n\n`;
  draft += `**Organization:** ${org.legalName}\n`;
  draft += `**EIN:** ${org.ein}\n`;
  draft += `**Contact:** ${org.primaryEmail}\n`;
  draft += `**Amount Requested:** ${target.amount}\n`;
  if (target.deadline) {
    draft += `**Deadline:** ${target.deadline}${target.hardDeadline ? " (HARD)" : ""}\n`;
  }
  if (target.opens) {
    draft += `**Opens:** ${target.opens}\n`;
  }
  draft += `\n`;

  // Generate each section
  for (const section of target.sections) {
    draft += `## ${section}\n\n`;
    
    // Section-specific content from corpus
    switch (section.toLowerCase()) {
      case "motivation":
      case "narrative":
      case "why needed":
        draft += `[AUTO-DRAFTED from corpus]\n\n`;
        draft += `${org.legalName} was incorporated ${org.incorporated} in ${org.state} `;
        draft += `to build assistive technology for neurodivergent individuals. `;
        if (corpus.personal.length) {
          draft += `The founder's lived experience as a late-diagnosed AuDHD adult `;
          draft += `shapes the constraint-first design philosophy.\n\n`;
        }
        if (corpus.mvps.length) {
          draft += `To date, we have shipped ${org.zenodoCount > 0 ? `${org.zenodoCount} research publications and ` : ""}`;
          draft += `multiple production systems including the K4 mesh architecture `;
          draft += `documented in technical specification P31-K4-AGENT-HUBS.\n\n`;
        }
        draft += `[OPERATOR: Replace bracketed text with authentic narrative. `;
        draft += `Draft ready in ${target.existingDraft || "N/A"}]\n\n`;
        break;
        
      case "project description":
      case "approach":
      case "plan":
        draft += `[AUTO-DRAFTED from technical corpus]\n\n`;
        draft += `**Technical Architecture:**\n\n`;
        for (const t of corpus.technical.slice(0, 2)) {
          draft += `- ${t.source}: ${t.excerpt.slice(0, 200)}...\n`;
        }
        draft += `\n[OPERATOR: Expand with specific deliverables per ${target.focus}]\n\n`;
        break;
        
      case "deliverables":
        draft += `[AUTO-GENERATED from MVP inventory]\n\n`;
        draft += `1. Protocol specification (JSON Schema + Markdown)\n`;
        draft += `2. Reference implementation (TypeScript/Workers)\n`;
        draft += `3. Documentation and examples\n`;
        draft += `4. [OPERATOR: Add grant-specific deliverables]\n\n`;
        break;
        
      case "budget":
        draft += `[AUTO-SCAFFOLDED]\n\n`;
        draft += `| Category | Amount | Notes |\n`;
        draft += `|----------|--------|-------|\n`;
        draft += `| Personnel | [TBD] | Founder time |\n`;
        draft += `| Hardware | [TBD] | Per funding-gated list |\n`;
        draft += `| IP/Filing | [TBD] | Provisional patents |\n`;
        draft += `| Operations | [TBD] | Infrastructure |\n`;
        draft += `| **Total** | ${target.amount} | |\n\n`;
        draft += `[OPERATOR: Fill from docs/FUNDING-GATED-ACTION-ITEMS.md]\n\n`;
        break;
        
      case "timeline":
        draft += `[AUTO-SCAFFOLDED]\n\n`;
        draft += `- Month 1-2: [OPERATOR: Define]\n`;
        draft += `- Month 3-4: [OPERATOR: Define]\n`;
        draft += `- Month 5-6: [OPERATOR: Define]\n\n`;
        break;
        
      default:
        draft += `[OPERATOR WRITE: ${section}]\n\n`;
        draft += `Guidance: ${target.tone}\n\n`;
    }
  }

  draft += `---\n\n`;
  draft += `## NEXT STEPS\n\n`;
  draft += `1. **Review**: Read and edit each section in authentic voice\n`;
  draft += `2. **Verify**: Check ${target.existingDraft || "grant requirements"} for compliance\n`;
  draft += `3. **Budget**: Fill financial details from FUNDING-GATED-ACTION-ITEMS.md\n`;
  if (target.operatorVoice) {
    draft += `4. **Voice**: Ensure AuDHD/spoon narrative sounds like you, not generic\n`;
  }
  draft += `5. **Submit**: Copy to grant portal before ${target.deadline || target.opens}\n\n`;

  return draft;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN — Execute draft generation
// ═══════════════════════════════════════════════════════════════════════════════

console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`  GRANT AUTO-DRAFT`);
console.log(`  ${target.name}`);
console.log(`  Target: ${target.amount}`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

console.log("[1/4] Extracting corpus from P31 knowledge base...");
const corpus = extractCorpus();
console.log(`      ✓ Organization: ${corpus.organization.legalName}`);
console.log(`      ✓ Papers: ${corpus.papers.length}`);
console.log(`      ✓ Technical docs: ${corpus.technical.length}`);
console.log(`      ✓ MVPs: ${corpus.mvps.length}`);
if (corpus.existingDraft) console.log(`      ✓ Existing draft: ${target.existingDraft}`);

console.log("\n[2/4] Building structured draft...");
const draft = generateViaTemplate(corpus);

console.log("[3/4] Preparing output...");
const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outputDir = path.join(ROOT, "docs/grants/auto-drafts");
const outputPath = path.join(outputDir, `${TARGET}-${timestamp}.md`);

if (!DRY_RUN) {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, draft, "utf8");
  console.log(`      ✓ Written: ${outputPath}`);
} else {
  console.log(`      [DRY RUN] Would write: ${outputPath}`);
}

console.log("\n[4/4] Updating grant-scaffold...");
const scaffoldPath = path.join(ROOT, "grant_pack_skeleton.json");
if (fs.existsSync(scaffoldPath)) {
  const scaffold = readJson(scaffoldPath);
  if (scaffold) {
    scaffold.grantTarget = TARGET;
    scaffold.draftPath = DRY_RUN ? `[DRY] ${outputPath}` : outputPath;
    scaffold.sections.forEach(s => {
      if (target.sections.includes(s.id) || target.sections.includes(s.label)) {
        s.draftGenerated = true;
      }
    });
    if (!DRY_RUN) {
      fs.writeFileSync(scaffoldPath, JSON.stringify(scaffold, null, 2), "utf8");
    }
    console.log(`      ✓ Scaffold updated`);
  }
}

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log("DRAFT COMPLETE");
console.log(`\n${DRY_RUN ? "[DRY RUN — no files written]" : `Output: ${outputPath}`}`);
console.log("\nNext:");
console.log(`  1. Edit the draft in your voice`);
console.log(`  2. Run: npm run office:check`);
console.log(`  3. Submit before ${target.deadline || target.opens}`);
console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

if (target.hardDeadline) {
  const daysLeft = Math.ceil((new Date(target.deadline) - new Date()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 14) {
    console.log(`\n⚠️  HARD DEADLINE in ${daysLeft} days — prioritize review`);
  }
}
