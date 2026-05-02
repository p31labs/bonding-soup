#!/usr/bin/env node
// npm run nonprofit:report -- [--year YYYY] [--out path]
// Assemble an annual impact report from the canonical contracts.

import fs from 'node:fs';
import path from 'node:path';
import { loadAllContracts, ROOT_DIR } from './lib/load-contracts.mjs';

const args = process.argv.slice(2);
function arg(name, fallback) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
}

const year = parseInt(arg('year', new Date().getFullYear()), 10);
const out = arg('out');

const all = loadAllContracts();
if (!all.governance) {
  console.error('Nonprofit contracts not found');
  process.exit(1);
}

const { governance, programs, financials, grants, donorPolicy, risk, people } = {
  governance: all.governance,
  programs: all.programs,
  financials: all.financials,
  grants: all.grants,
  donorPolicy: all['donor-policy'],
  risk: all.risk,
  people: all.people
};

const md = `# ${governance.entity.legalName} · Annual Impact Report ${year}

> ${programs.mission.statement}

**Report period:** January 1, ${year} – December 31, ${year}
**Published:** ${new Date().toISOString().slice(0, 10)}
**Entity:** ${governance.entity.legalName}, ${governance.entity.stateOfIncorporation} nonprofit corporation
**EIN:** ${governance.entity.ein}
**IRS 501(c)(3) status:** ${governance.entity.irsStatus}

---

## Letter from the Board Chair

[ Operator-drafted letter goes here. Tone: honest, calm, direct. Acknowledge what worked, what didn't, what's next. ~500 words. ]

---

## Mission progress

**Vision:** ${programs.mission.vision}

**Theory of change:** ${programs.theoryOfChange.problemStatement}

**Intervention:** ${programs.theoryOfChange.intervention}

### Short-term outcome pulse

${programs.theoryOfChange.shortTermOutcomes.map((o, i) => `${i + 1}. ${o}\n   *Status: [Operator: provide qualitative + quantitative pulse]*`).join('\n\n')}

---

## Programs

${programs.programs.map(p => `### ${p.name}

${p.shortDescription}

- **Phase:** ${p.phase}
- **Year started:** ${p.yearStarted}
- **Indirect staff time:** ${p.indirectStaffTimePctOfTotal}%
- **Primary beneficiary:** ${p.primaryBeneficiary}
- **Public surface:** ${p.publicSurface}

**Key performance indicators:**

| KPI | Target | Status |
|---|---|---|
${(p.outcomeKpis || []).map(k => `| ${k.kpi} | ${k.target} | ${k.current ?? '*pending measurement*'} |`).join('\n')}
`).join('\n')}

---

## Financials

**Fiscal year ending:** ${financials.fiscalYear.endDate}

**Expense ratio targets:**

| Category | Target | Status |
|---|---|---|
| Program services | >= ${(financials.expenseRatioTargets.programServices.min * 100).toFixed(0)}% | *to be reported* |
| Management & general | <= ${(financials.expenseRatioTargets.managementAndGeneral.max * 100).toFixed(0)}% | *to be reported* |
| Fundraising | <= ${(financials.expenseRatioTargets.fundraising.max * 100).toFixed(0)}% | *to be reported* |

**Form 990:** [link when filed]

**Audit:** ${financials.audit.currentlyAudited ? 'External audit completed; report at /financials/audit-' + year + '.pdf' : 'Internal review only; external audit triggered at $250k revenue threshold'}

---

## Governance

**Board roster as of fiscal year end:**

${governance.board.currentMembers.map(m => `- **${m.name}** — ${m.role} (term: ${m.electedDate} – ${m.termEnds})`).join('\n')}

${governance.board.vacantSeats ? `**${governance.board.vacantSeats} seat(s) vacant** as of report date.` : '**Board fully seated.**'}

**Officers:**

${(governance.officers.current || []).map(o => `- **${o.title}:** ${o.personId ? governance.board.currentMembers.find(m => m.id === o.personId)?.name || '(seated)' : '(vacant)'}`).join('\n')}

**Board policies in force:**

${(governance.policies.adopted || []).map(p => `- ${p}`).join('\n')}

**Pending adoption:** ${(governance.policies.pending || []).join(', ') || 'none'}

---

## Donors and supporters

[Operator-drafted donor recognition section, with consent-based naming]

**Donor policy:** all gifts subject to ${donorPolicy.giftAcceptance.acceptedTypes.length}-type acceptance criteria; declined-gift log published per ethical-screening commitment.

**Privacy commitments preserved:** donor list never sold, never rented, never exchanged.

---

## Lessons learned

[Honest section. What didn't work. What we'd do differently. This is mission-critical for credibility and for the operator-led ethos.]

---

## Roadmap

### Year ${year + 1} priorities

1. [Operator: top 3-5 priorities based on programs.json + grants.json]
2.
3.

### Top risks (from risk register)

${(risk.riskRegister || []).filter(r => r.impact === 'critical' || r.impact === 'high').slice(0, 5).map(r => `- **${r.id} · ${r.title}** — likelihood ${r.likelihood}, impact ${r.impact}\n  Mitigation status: ${r.currentMitigationStatus}`).join('\n\n')}

---

## Transparency commitments preserved

${(financials.transparencyCommitments || []).map(t => `- ${t}`).join('\n')}

---

## Contact

**General:** hello@phosphorus31.org
**Press:** brand@phosphorus31.org
**Donor questions:** treasurer@phosphorus31.org
**Security:** security@phosphorus31.org

This report is published at https://phosphorus31.org/annual-report-${year} and as a PDF in our public docs library.

---

*Generated mechanically from canonical sources by \`npm run nonprofit:report\`. Human review before publication is required — this is a starting structure, not a finished narrative. Draft, edit, board-approve, then publish.*

*Source contracts:*
- governance.json
- compliance.json
- financials.json
- donor-policy.json
- programs.json
- grants.json
- risk.json
- people.json
`;

if (out) {
  const outPath = path.resolve(out);
  fs.writeFileSync(outPath, md);
  console.log(`report: written to ${outPath}`);
  console.log(`  ${md.split('\n').length} lines, ${md.length} chars`);
  console.log(`  Edit, review, board-approve, then publish.`);
} else {
  console.log(md);
}
