#!/usr/bin/env node
/**
 * office-generate — Generate board and legal documents from templates
 * 
 * Pulls data from p31-protocol-registry.json and p31-constants.json
 * to generate pre-filled board notices, COI forms, consent, resolutions.
 * 
 * Usage:
 *   npm run office:notice
 *   npm run office:coi
 *   npm run office:consent
 *   npm run office:resolution
 * 
 * Or directly:
 *   node scripts/office-generate.mjs --template board-notice --output docs/board/NOTICE.md
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const TEMPLATE = args.find(a => a.startsWith("--template"))?.split("=")[1] || args[args.indexOf("--template") + 1];
const OUTPUT = args.find(a => a.startsWith("--output"))?.split("=")[1] || args[args.indexOf("--output") + 1];

const TEMPLATES = {
  "board-notice": {
    title: "Notice of Annual Board Meeting",
    filename: "BOARD-MEETING-NEXT-NOTICE.md",
    content: (data) => `# NOTICE OF ANNUAL BOARD MEETING

**P31 Labs, Inc.**
EIN: ${data.ein}
State of Incorporation: ${data.state}

---

**DATE:** ${data.meetingDate}
**TIME:** 10:00 AM EST
**LOCATION:** Virtual (Google Meet — link TBD)

---

## PURPOSE

1. Review of 2026 operations
2. Grant pipeline status
3. Budget approval (pending NLnet decision)
4. 501(c)(3) application update
5. Strategic planning for H2 2026

---

## MATERIALS

- Annual report (to be distributed 48h prior)
- Financial summary
- Grant calendar 2026

---

## RSVP

Please confirm attendance by replying to this notice.

---

Generated: ${data.generated}
Next notice due: ${data.nextNoticeDue}
`
  },
  
  "coi-form": {
    title: "Conflict of Interest Disclosure",
    filename: "COI-DISCLOSURE-2026.md",
    content: (data) => `# CONFLICT OF INTEREST DISCLOSURE

**P31 Labs, Inc.**
EIN: ${data.ein}

---

**Director/Officer:** _________________________
**Date:** ${data.generated}

---

## DISCLOSURES

Check all that apply:

- [ ] I have no financial interests that conflict with P31 Labs
- [ ] I have the following interests to disclose:
  - _______________________________
  - _______________________________

## SIGNATURE

_________________________________
Signature

---

*Filed with board secretary. Annual update required.*
`
  },
  
  "written-consent": {
    title: "Written Consent in Lieu of Meeting",
    filename: "WRITTEN-CONSENT-NEXT.md",
    content: (data) => `# WRITTEN CONSENT IN LIEU OF MEETING

**P31 Labs, Inc.**
EIN: ${data.ein}

---

**Date:** ${data.generated}
**Matter:** [DESCRIBE ACTION]

---

The undersigned, constituting a majority of the Board of Directors of P31 Labs, Inc., hereby consent to the following action:

**RESOLVED:** [ACTION DESCRIPTION]

---

**CONSENTING DIRECTORS:**

1. _________________________ Date: _________
2. _________________________ Date: _________
3. _________________________ Date: _________

---

*Effective upon majority signature. File with corporate records.*
`
  },
  
  "resolution": {
    title: "Board Resolution",
    filename: "BOARD-RESOLUTION-NEXT.md",
    content: (data) => `# BOARD RESOLUTION

**P31 Labs, Inc.**
EIN: ${data.ein}

---

**Resolution No.:** 2026-___
**Date Adopted:** ${data.meetingDate || "[DATE]"}

---

## WHEREAS

[Background/context for resolution]

## RESOLVED

That the Board of Directors of P31 Labs, Inc. hereby:

1. [ACTION ITEM 1]
2. [ACTION ITEM 2]
3. [ACTION ITEM 3]

## CERTIFICATION

This resolution was adopted by the Board of Directors on the date stated above.

---

**CERTIFIED BY:**

_________________________
Secretary/Treasurer

Date: ${data.generated}

---

*File with corporate records. 7-year retention required.*
`
  }
};

function loadOrgData() {
  try {
    const registry = JSON.parse(fs.readFileSync(path.join(ROOT, "p31-protocol-registry.json"), "utf8"));
    const constants = JSON.parse(fs.readFileSync(path.join(ROOT, "p31-constants.json"), "utf8"));
    
    return {
      legalName: registry.officeCalendar?.entity?.legalName || "P31 Labs, Inc.",
      ein: registry.officeCalendar?.entity?.ein || constants.organization?.ein || "[EIN]",
      state: registry.officeCalendar?.entity?.stateOfIncorporation || "Georgia",
      meetingDate: new Date().toISOString().slice(0, 10),
      generated: new Date().toISOString().slice(0, 10),
      nextNoticeDue: "[CALCULATE 30 DAYS BEFORE MEETING]"
    };
  } catch (err) {
    console.error("Error loading org data:", err.message);
    return {
      legalName: "P31 Labs, Inc.",
      ein: "42-1888158",
      state: "Georgia",
      meetingDate: new Date().toISOString().slice(0, 10),
      generated: new Date().toISOString().slice(0, 10),
      nextNoticeDue: "[DATE]"
    };
  }
}

function main() {
  if (!TEMPLATE || !TEMPLATES[TEMPLATE]) {
    console.error("Usage: node office-generate.mjs --template <name> --output <path>");
    console.error("\nAvailable templates:");
    Object.keys(TEMPLATES).forEach(t => console.error(`  ${t.padEnd(15)} - ${TEMPLATES[t].title}`));
    process.exit(1);
  }
  
  const template = TEMPLATES[TEMPLATE];
  const orgData = loadOrgData();
  const content = template.content(orgData);
  
  const outputPath = OUTPUT || path.join(ROOT, "docs/board", template.filename);
  
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, content, "utf8");
  
  console.log(`✅ Generated: ${outputPath}`);
  console.log(`   Template: ${template.title}`);
  console.log(`   Organization: ${orgData.legalName}`);
  console.log(`\nNext steps:`);
  console.log(`   1. Review and edit the generated document`);
  console.log(`   2. Add specific details (dates, names, amounts)`);
  console.log(`   3. Run: npm run office:check (compliance alignment)`);
}

main();
