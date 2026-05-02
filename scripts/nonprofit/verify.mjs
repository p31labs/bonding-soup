#!/usr/bin/env node
// npm run verify:nonprofit
// Validate ground-truth contracts: schema shape + cross-references.

import { loadAllContracts, contractsAvailable } from './lib/load-contracts.mjs';

const ANSI = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code, s) => ANSI ? `\x1b[${code}m${s}\x1b[0m` : s;
const red = s => c('31', s);
const green = s => c('32', s);
const yellow = s => c('33', s);
const dim = s => c('2', s);

if (!contractsAvailable()) {
  console.log(yellow('verify:nonprofit: contracts not all present (partial clone?) — skipping'));
  process.exit(0);
}

const all = loadAllContracts();
const errors = [];
const warnings = [];

function check(condition, message, severity = 'error') {
  if (!condition) {
    if (severity === 'error') errors.push(message);
    else warnings.push(message);
  }
}

// ─── Schema shape per contract ─────────────────────────────
for (const [name, contract] of Object.entries(all)) {
  check(contract.$schema, `${name}.json: missing $schema`);
  check(contract._meta, `${name}.json: missing _meta`);
  check(contract._meta?.lastUpdated, `${name}.json: missing _meta.lastUpdated`);
  check(contract._meta?.owner, `${name}.json: missing _meta.owner`);
}

// ─── governance.json ───────────────────────────────────────
const g = all.governance;
check(g.entity?.ein === '42-1888158', `governance: EIN mismatch (expected 42-1888158)`);
check(g.entity?.legalName === 'P31 Labs, Inc.', `governance: legal name mismatch`);
check(g.entity?.stateOfIncorporation === 'GA', `governance: state mismatch`);

const officerTitles = (g.officers?.current || []).map(o => o.title);
const requiredOfficers = g.officers?.required || [];
for (const title of requiredOfficers) {
  check(
    officerTitles.includes(title),
    `governance: required officer "${title}" not present in current[]`
  );
}

const boardIds = new Set((g.board?.currentMembers || []).map(m => m.id));
const officerPersonIds = (g.officers?.current || []).map(o => o.personId).filter(Boolean);
for (const pid of officerPersonIds) {
  check(boardIds.has(pid), `governance: officer personId "${pid}" not in board.currentMembers`);
}

if (g.officers?.presidentCannotBeSecretary) {
  const president = (g.officers.current || []).find(o => o.title === 'President');
  const secretary = (g.officers.current || []).find(o => o.title === 'Secretary');
  if (president?.personId && secretary?.personId) {
    check(
      president.personId !== secretary.personId,
      `governance: President and Secretary cannot be the same person (separation-of-duties)`
    );
  }
}

if (g.officers?.presidentCannotBeTreasurer) {
  const president = (g.officers.current || []).find(o => o.title === 'President');
  const treasurer = (g.officers.current || []).find(o => o.title === 'Treasurer');
  if (president?.personId && treasurer?.personId) {
    check(
      president.personId !== treasurer.personId,
      `governance: President and Treasurer cannot be the same person`
    );
  }
}

// ─── compliance.json ───────────────────────────────────────
const cmp = all.compliance;
const STATES = new Set('AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' '));
const tracker = cmp.state?.charitableSolicitation?.tracker || [];
for (const entry of tracker) {
  check(
    STATES.has(entry.state),
    `compliance: invalid state code "${entry.state}" in charitableSolicitation.tracker`
  );
}

// Filing calendar entries should have valid dates and required owners
const today = new Date();
const deadlines = cmp.filingCalendar?.deadlines || [];
for (const d of deadlines) {
  check(d.date && /^\d{4}-\d{2}-\d{2}$/.test(d.date), `compliance: filing date format invalid: ${JSON.stringify(d)}`);
  check(d.type, `compliance: filing missing type: ${JSON.stringify(d)}`);
  check(d.action, `compliance: filing missing action: ${JSON.stringify(d)}`);
  check(d.owner, `compliance: filing missing owner: ${JSON.stringify(d)}`);
  if (d.date) {
    const dt = new Date(d.date);
    if (dt < today && !d.filed) {
      warnings.push(`compliance: deadline ${d.date} (${d.type}) is in the past and not marked filed`);
    }
  }
}

// ─── financials.json ───────────────────────────────────────
const f = all.financials;
const ratios = f.expenseRatioTargets;
if (ratios) {
  check(ratios.programServices?.min >= 0.65, `financials: programServices.min should be >= 65% (Charity Navigator floor)`);
  check(ratios.fundraising?.max <= 0.15, `financials: fundraising.max should be <= 15%`);
  check(ratios.managementAndGeneral?.max <= 0.20, `financials: managementAndGeneral.max should be <= 20%`);
}

// ─── donor-policy.json ─────────────────────────────────────
const dp = all['donor-policy'];
check(dp.taxReceipts?.issuedFor, `donor-policy: missing taxReceipts.issuedFor`);
check(dp.refundPolicy?.windowDays >= 7, `donor-policy: refund window should be >= 7 days`);
check(dp.privacy?.donorListNeverSold === true, `donor-policy: donor list privacy must be true`);

// ─── programs.json ─────────────────────────────────────────
const p = all.programs;
check(p.mission?.statement, `programs: missing mission.statement`);
const programIds = new Set();
for (const prog of p.programs || []) {
  check(prog.id, `programs: program missing id`);
  if (prog.id) {
    check(!programIds.has(prog.id), `programs: duplicate program id "${prog.id}"`);
    programIds.add(prog.id);
  }
  check(prog.publicSurface, `programs: program "${prog.id}" missing publicSurface URL`);
  check(prog.theoryOfChange || p.theoryOfChange, `programs: theory of change required`, 'warning');
}

// ─── grants.json ───────────────────────────────────────────
const gr = all.grants;
check(Array.isArray(gr.activePipeline), `grants: activePipeline must be array`);
check(Array.isArray(gr.candidateFunders), `grants: candidateFunders must be array`);
check(gr.fitCriteria?.mustHave?.length > 0, `grants: fitCriteria.mustHave must have entries`);

// ─── risk.json ─────────────────────────────────────────────
const r = all.risk;
const riskIds = new Set();
for (const risk of r.riskRegister || []) {
  check(risk.id, `risk: missing id`);
  check(risk.id && /^R-\d{3}$/.test(risk.id), `risk: id "${risk.id}" should match R-NNN`);
  if (risk.id) {
    check(!riskIds.has(risk.id), `risk: duplicate id "${risk.id}"`);
    riskIds.add(risk.id);
  }
  check(Array.isArray(risk.mitigation) && risk.mitigation.length > 0, `risk: ${risk.id} missing mitigation entries`);
  check(['low', 'medium', 'high'].includes(risk.likelihood), `risk: ${risk.id} likelihood must be low/medium/high`);
  check(['low', 'medium', 'high', 'critical'].includes(risk.impact), `risk: ${risk.id} impact must be low/medium/high/critical`);
}

// ─── people.json ───────────────────────────────────────────
const pp = all.people;
const rosterIds = new Set();
for (const member of pp.currentRoster || []) {
  check(member.id, `people: roster entry missing id`);
  if (member.id) {
    check(!rosterIds.has(member.id), `people: duplicate roster id "${member.id}"`);
    rosterIds.add(member.id);
  }
}

// Founder must be in both governance.board.currentMembers AND people.currentRoster
for (const m of (g.board?.currentMembers || [])) {
  check(rosterIds.has(m.id), `people: governance board member "${m.id}" not in people.currentRoster`);
}

// ─── Cross-contract references ─────────────────────────────
// Programs referenced in grants.json should exist
// (none yet, but skeleton ready)

// EIN consistency
const einRefs = [
  { name: 'governance', ein: g.entity?.ein },
  { name: 'donor-policy', ein: dp.taxReceipts?.language?.body?.find(b => b.includes('EIN'))?.match(/\d{2}-\d{7}/)?.[0] }
];
const eins = new Set(einRefs.map(e => e.ein).filter(Boolean));
check(eins.size === 1, `cross: EIN inconsistent across contracts: ${[...eins].join(', ')}`);

// ─── Output ────────────────────────────────────────────────
const total = Object.keys(all).length;
const totalChecks = errors.length + warnings.length + 50; // approximate

console.log(`\n${green('verify:nonprofit')}: ${total} contracts loaded`);
console.log(dim(`  9 contracts × schema shape × cross-references`));

if (warnings.length) {
  console.log(`\n${yellow('warnings:')}`);
  warnings.forEach(w => console.log(`  ${yellow('◯')} ${w}`));
}

if (errors.length) {
  console.log(`\n${red('errors:')}`);
  errors.forEach(e => console.log(`  ${red('✗')} ${e}`));
  console.log(`\n${red('verify:nonprofit failed')}: ${errors.length} error(s)\n`);
  process.exit(1);
}

console.log(`\n${green('  ✓ all contracts valid')} ${dim('(' + warnings.length + ' warnings)')}\n`);
process.exit(0);
