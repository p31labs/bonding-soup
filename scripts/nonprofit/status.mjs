#!/usr/bin/env node
// npm run nonprofit:status
// One-screen ops dashboard — gaps, deadlines, pipeline.

import { loadAllContracts } from './lib/load-contracts.mjs';

const ANSI = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code, s) => ANSI ? `\x1b[${code}m${s}\x1b[0m` : s;
const dim = s => c('2', s);
const red = s => c('31', s);
const yellow = s => c('33', s);
const green = s => c('32', s);
const cyan = s => c('36', s);
const bold = s => c('1', s);

const all = loadAllContracts();
if (!all.governance) {
  console.error('Nonprofit contracts not found — partial clone? skipping');
  process.exit(0);
}

const { governance, compliance, financials, donorPolicy, programs, grants, legal, risk, people } = {
  governance: all.governance,
  compliance: all.compliance,
  financials: all.financials,
  donorPolicy: all['donor-policy'],
  programs: all.programs,
  grants: all.grants,
  legal: all.legal,
  risk: all.risk,
  people: all.people
};

const today = new Date();

console.log(bold(`\n  P31 Labs, Inc. · Operations Status`));
console.log(dim(`  ${governance.entity.legalName} · EIN ${governance.entity.ein}`));
console.log(dim(`  fiscal year ${governance.entity.fiscalYearEnd} · ${today.toISOString().slice(0, 10)}\n`));

// ─── Section 1: Entity status ──────────────────────────────
console.log(cyan('  ENTITY'));
console.log(`    State of incorporation:  ${governance.entity.stateOfIncorporation}`);
console.log(`    Incorporation date:      ${governance.entity.incorporationDate}`);
const irsStatus = governance.entity.irsStatus;
const irsColor = irsStatus === 'approved' ? green : irsStatus === 'pending' ? yellow : red;
console.log(`    IRS 501(c)(3) status:    ${irsColor(irsStatus)}`);

// ─── Section 2: Critical-path gaps ─────────────────────────
console.log(`\n  ${cyan('CRITICAL GAPS')} ${dim('(P0 blockers)')}`);
const gaps = [];

const seatedBoardCount = governance.board.currentMembers.length;
const minMembers = governance.board.minimumMembers;
if (seatedBoardCount < minMembers) {
  gaps.push(red(`✗ Board: ${seatedBoardCount} of ${minMembers} minimum seated`));
}

const officersWithoutPerson = (governance.officers.current || []).filter(o => !o.personId);
if (officersWithoutPerson.length) {
  gaps.push(red(`✗ Officers vacant: ${officersWithoutPerson.map(o => o.title).join(', ')}`));
}

if (governance.entity.irsStatus === 'pending' && !compliance.federal.form1023.filed) {
  gaps.push(red(`✗ Form 1023 not yet filed`));
}

const bankStatus = financials.bankingAndPayments?.primaryBank?.accountStatus;
if (bankStatus !== 'open') {
  gaps.push(red(`✗ Primary bank account: ${bankStatus || 'unknown'}`));
}

const policiesPending = governance.policies?.pending || [];
if (policiesPending.length) {
  gaps.push(yellow(`◯ Board policies pending adoption: ${policiesPending.length} (${policiesPending.slice(0, 3).join(', ')}${policiesPending.length > 3 ? '...' : ''})`));
}

const insuranceP0 = (risk.insurance?.neededPolicies || []).filter(p => p.priority === 'P0');
const insuranceCurrent = (risk.insurance?.currentPolicies || []).map(p => p.type);
const missingP0Insurance = insuranceP0.filter(p => !insuranceCurrent.includes(p.type));
if (missingP0Insurance.length) {
  gaps.push(yellow(`◯ Insurance pending: ${missingP0Insurance.map(p => p.type).join(', ')}`));
}

if (gaps.length) {
  gaps.forEach(g => console.log(`    ${g}`));
} else {
  console.log(green(`    ✓ No P0 gaps`));
}

// ─── Section 3: Filing calendar (next 90d) ─────────────────
console.log(`\n  ${cyan('UPCOMING DEADLINES')} ${dim('(next 90 days)')}`);
const cutoff = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
const upcoming = (compliance.filingCalendar?.deadlines || [])
  .filter(d => {
    const dt = new Date(d.date);
    return dt >= today && dt <= cutoff && !d.filed;
  })
  .sort((a, b) => new Date(a.date) - new Date(b.date))
  .slice(0, 5);

if (upcoming.length) {
  upcoming.forEach(d => {
    const dt = new Date(d.date);
    const days = Math.ceil((dt - today) / (1000 * 60 * 60 * 24));
    const urgent = days <= 14 ? red : days <= 30 ? yellow : green;
    console.log(`    ${dim(d.date)}  ${urgent(String(days).padStart(3) + 'd')}  ${d.type.padEnd(28)}  ${dim(d.owner || '')}`);
  });
} else {
  console.log(dim('    (none in window — see npm run nonprofit:calendar for full list)'));
}

// ─── Section 4: Programs ───────────────────────────────────
console.log(`\n  ${cyan('PROGRAMS')}`);
(programs.programs || []).forEach(p => {
  const phase = p.phase || 'unknown';
  const phaseColor = phase.includes('shipping') ? green : phase.includes('alpha') ? yellow : dim;
  console.log(`    ${p.id.padEnd(28)}  ${phaseColor(phase.padEnd(20))}  ${dim(p.indirectStaffTimePctOfTotal + '% staff time')}`);
});

// ─── Section 5: Grants ─────────────────────────────────────
console.log(`\n  ${cyan('GRANTS PIPELINE')}`);
const candidates = (grants.candidateFunders || []).length;
const active = (grants.activePipeline || []).length;
const submitted = (grants.submitted || []).length;
const awarded = (grants.awarded || []).length;
console.log(`    Candidates researched: ${dim(String(candidates))}`);
console.log(`    Active drafting:       ${dim(String(active))}`);
console.log(`    Submitted:             ${dim(String(submitted))}`);
console.log(`    Awarded:               ${active === 0 && submitted === 0 ? dim('0') : green(String(awarded))}`);

// ─── Section 6: Risk register summary ──────────────────────
console.log(`\n  ${cyan('TOP RISKS')} ${dim('(by impact)')}`);
const topRisks = (risk.riskRegister || [])
  .filter(r => r.impact === 'critical' || r.impact === 'high')
  .slice(0, 5);
topRisks.forEach(r => {
  const status = r.currentMitigationStatus || 'unknown';
  const statusColor = status.startsWith('good') ? green : status.startsWith('partial') ? yellow : red;
  console.log(`    ${r.id}  ${r.title.padEnd(48).slice(0, 48)}  ${statusColor(status)}`);
});

// ─── Section 7: Charitable solicitation states ─────────────
const stateTracker = compliance.state?.charitableSolicitation?.tracker || [];
const required = stateTracker.filter(s => s.required);
const registered = required.filter(s => s.registered);
console.log(`\n  ${cyan('STATE REGISTRATIONS')}`);
console.log(`    Required:    ${dim(String(required.length) + ' states')}`);
console.log(`    Registered:  ${registered.length === 0 ? red('0') : green(String(registered.length))}`);
if (registered.length < required.length) {
  const fees = compliance.state?.charitableSolicitation?.summary?.estimatedFirstYearFees || 0;
  console.log(`    Pending est. first-year fees: ${dim('$' + fees)}`);
}

// ─── Footer ────────────────────────────────────────────────
console.log(`\n  ${dim('Run ' + bold('npm run nonprofit:calendar') + dim(' for full deadline list'))}`);
console.log(`  ${dim('Run ' + bold('npm run verify:nonprofit') + dim(' to validate all contracts'))}`);
console.log(`  ${dim('Master index: docs/P31-NONPROFIT-OPERATIONS.md')}\n`);
