#!/usr/bin/env node
/**
 * grant-scaffold — Create new grant skeleton from template
 * 
 * Interactive wizard to scaffold a new grant application file
 * with proper P31 headers, sections, and placeholders.
 * 
 * Usage:
 *   npm run grant:scaffold
 *   npm run grant:scaffold -- --template nlnet --output my-grant.md
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const TEMPLATES = {
  nlnet: {
    name: "NLnet / NGI Zero",
    sections: ["Synopsis", "Motivation", "Project description", "Why NLnet", "Deliverables", "Timeline", "Budget", "Risks", "References"],
    maxLength: "2000 words",
    tone: "technical + commons impact"
  },
  asan: {
    name: "ASAN Disability Justice",
    sections: ["Narrative", "Need Statement", "Project Approach", "Community Impact", "Budget", "Timeline"],
    maxLength: "500 words narrative",
    tone: "personal + community justice"
  },
  general: {
    name: "General / Foundation",
    sections: ["Executive Summary", "Problem", "Solution", "Team", "Budget", "Outcomes", "Sustainability"],
    maxLength: "varies",
    tone: "clear + outcomes-focused"
  }
};

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, answer => {
    rl.close();
    resolve(answer.trim());
  }));
}

async function main() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("         P31 GRANT SCAFFOLD WIZARD");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Template selection
  console.log("Available templates:");
  Object.entries(TEMPLATES).forEach(([k, v]) => {
    console.log(`  ${k.padEnd(10)} — ${v.name}`);
  });
  
  const templateKey = await ask("\nSelect template (nlnet/asan/general): ") || "general";
  const template = TEMPLATES[templateKey] || TEMPLATES.general;

  // Basic info
  const funder = await ask("Funder name: ");
  const program = await ask("Program name: ");
  const amount = await ask("Amount (e.g., $5,000 or €10,000): ");
  const deadline = await ask("Deadline (YYYY-MM-DD or 'rolling'): ");
  
  // Generate filename
  const safeFunder = (funder || "unknown").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 20);
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `${safeFunder}-${timestamp}.md`;
  const outputPath = path.join(ROOT, "docs/grants/scaffolded", filename);

  // Generate content
  let content = `# GRANT APPLICATION\n`;
  content += `# ${funder || "[FUNDER]"} — ${program || "[PROGRAM]"}\n\n`;
  content += `**Status:** DRAFT (scaffolded ${timestamp})\n`;
  content += `**Amount Requested:** ${amount || "[AMOUNT]"}\n`;
  content += `**Deadline:** ${deadline || "[DEADLINE]"}\n`;
  content += `**Template:** ${template.name}\n\n`;
  content += `---\n\n`;

  content += `## Organization\n\n`;
  content += `- **Legal name:** P31 Labs, Inc. (EIN 42-1888158)\n`;
  content += `- **Status:** 501(c)(3) pending (incorporated GA 2026-04-03)\n`;
  content += `- **Contact:** william@p31labs.org\n`;
  content += `- **Website:** https://p31ca.org\n\n`;

  content += `## Mission Alignment\n\n`;
  content += `> Build, Create, Connect — assistive technology for neurodivergent individuals.\n`;
  content += `> Research-backed: 22 Zenodo DOIs on synergetic geometry, quantum information, and agent systems.\n\n`;

  for (const section of template.sections) {
    content += `## ${section}\n\n`;
    content += `[OPERATOR: Write ${template.tone} content here. `;
    content += `Max length: ${template.maxLength}]\n\n`;
    content += `**Guidance:**\n`;
    content += `- Be specific about deliverables\n`;
    content += `- Cite P31 research (Zenodo papers) where relevant\n`;
    content += `- Include concrete timeline milestones\n\n`;
  }

  content += `---\n\n`;
  content += `## Attachments\n\n`;
  content += `- [ ] Board resolution (if required)\n`;
  content += `- [ ] Budget spreadsheet\n`;
  content += `- [ ] 501(c)(3) determination letter (when received)\n`;
  content += `- [ ] References / Letters of support\n\n`;

  content += `## Pre-Submit Checklist\n\n`;
  content += `- [ ] Word count verified (${template.maxLength})\n`;
  content += `- [ ] Voice check: ${template.tone}\n`;
  content += `- [ ] Budget math correct\n`;
  content += `- [ ] Deadline confirmed: ${deadline || "[TBD]"}\n`;
  content += `- [ ] Run: npm run office:check (compliance)\n`;
  content += `- [ ] Final review by second reader (if available)\n\n`;

  // Write file
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, content, "utf8");

  console.log(`\n✅ Scaffolded: ${outputPath}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Edit the file in your authentic voice`);
  console.log(`  2. Run npm run office:check for deadline alignment`);
  console.log(`  3. Consider npm run grant:draft -- --target <existing> for auto-fill`);
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

main().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
