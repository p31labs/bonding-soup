#!/usr/bin/env node
// npm run nonprofit:calendar
// Print upcoming filing deadlines from compliance.json.

import { loadContract } from './lib/load-contracts.mjs';

const args = process.argv.slice(2);
let windowDays = 365;
let showAll = false;
const i = args.indexOf('--window');
if (i >= 0 && args[i + 1]) windowDays = parseInt(args[i + 1], 10);
if (args.includes('--all')) showAll = true;

const compliance = loadContract('compliance');
if (!compliance) {
  console.error('compliance.json not found — partial clone? skipping');
  process.exit(0);
}

const today = new Date();
today.setHours(0, 0, 0, 0);
const cutoff = new Date(today.getTime() + windowDays * 24 * 60 * 60 * 1000);

const deadlines = (compliance.filingCalendar?.deadlines || [])
  .filter(d => {
    if (showAll) return true;
    const dt = new Date(d.date);
    return dt >= today && dt <= cutoff;
  })
  .sort((a, b) => new Date(a.date) - new Date(b.date));

const ANSI = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code, s) => ANSI ? `\x1b[${code}m${s}\x1b[0m` : s;
const dim = s => c('2', s);
const red = s => c('31', s);
const yellow = s => c('33', s);
const green = s => c('32', s);
const bold = s => c('1', s);

const ein = compliance._meta?.ein || '42-1888158';
const entity = 'P31 Labs, Inc.';

console.log(bold(`\n  ${entity} · Filing Calendar`));
console.log(dim(`  EIN ${ein} · window: next ${windowDays} days · today ${today.toISOString().slice(0, 10)}\n`));

if (!deadlines.length) {
  console.log(green('  ✓ No deadlines in window. Sanity-check: have you added new filings recently?\n'));
  process.exit(0);
}

let lastMonth = '';
for (const d of deadlines) {
  const dt = new Date(d.date);
  const month = dt.toLocaleString('en-US', { year: 'numeric', month: 'long' });
  if (month !== lastMonth) {
    console.log(`  ${bold(month)}`);
    lastMonth = month;
  }
  const days = Math.ceil((dt - today) / (1000 * 60 * 60 * 24));
  let urgency = '';
  if (days < 0) urgency = red(`OVERDUE ${Math.abs(days)}d`);
  else if (days <= 14) urgency = red(`${days}d`);
  else if (days <= 60) urgency = yellow(`${days}d`);
  else urgency = green(`${days}d`);
  
  const cond = d.conditional ? dim(' (conditional)') : '';
  const ext = d.extensionPossible ? dim(' [extension OK]') : '';
  const fee = d.fee ? dim(` $${d.fee}`) : '';
  const filed = d.filed ? green(' ✓ filed') : '';
  
  console.log(`    ${dim(d.date)}  ${urgency.padEnd(20)}  ${d.type.padEnd(28)}  ${d.action}${cond}${ext}${fee}${filed}`);
  console.log(`    ${' '.repeat(13)} ${dim('owner: ' + (d.owner || 'unassigned'))}`);
}

const states = compliance.state?.charitableSolicitation?.tracker || [];
const unregistered = states.filter(s => s.required && !s.registered);
if (unregistered.length) {
  console.log(`\n  ${bold('Charitable solicitation registrations pending:')} ${yellow(unregistered.length + ' states')}`);
  console.log(dim(`    Run npm run nonprofit:status for the full breakdown\n`));
} else {
  console.log();
}
