#!/usr/bin/env node
/**
 * verify:grants — CI gate for grant pipeline integrity
 *
 * Checks:
 *  1. All active grants in grant-pipeline.json have content packs in p31-forge/content/grants/
 *  2. All grant application markdown files exist and are non-empty
 *  3. Grant deadlines are in the future (no past-due active grants without explanation)
 *  4. Grant pipeline JSON is valid and matches schema
 *
 * Run: node verify-grants.js
 * Exit code: 0 if all checks pass, 1 if any fail
 */

const fs = require('fs');
const path = require('path');

const PIPELINE_JSON = path.join(__dirname, '../docs/grants/grant-pipeline.json');
const FORGE_GRANTS_DIR = path.join(__dirname, '../andromeda/04_SOFTWARE/p31-forge/content/grants');
const GRANTS_DOCS_DIR = path.join(__dirname, '../docs/grants');

let errors = 0;
let warnings = 0;

function log(level, msg) {
  const prefix = level === 'ERROR' ? '❌' : level === 'WARN' ? '⚠️' : '✅';
  console.log(`${prefix} ${msg}`);
  if (level === 'ERROR') errors++;
  if (level === 'WARN') warnings++;
}

function die(msg) {
  log('ERROR', msg);
  process.exit(1);
}

// 1. Load grant pipeline JSON
let pipeline;
try {
  const raw = fs.readFileSync(PIPELINE_JSON, 'utf-8');
  pipeline = JSON.parse(raw);
  log('OK', `grant-pipeline.json loaded (schema: ${pipeline.schema || 'unknown'})`);
} catch (e) {
  die(`Failed to read grant-pipeline.json: ${e.message}`);
}

// Validate required top-level fields
if (!pipeline.grants || !Array.isArray(pipeline.grants)) {
  die('grant-pipeline.json missing required .grants array');
}

// 2. Load forge content directory
const forgeGrants = {};
try {
  const files = fs.readdirSync(FORGE_GRANTS_DIR);
  for (const f of files) {
    if (f.endsWith('.json')) {
      const key = f.replace('.json', '');
      forgeGrants[key] = path.join(FORGE_GRANTS_DIR, f);
    }
  }
  log('OK', `Found ${Object.keys(forgeGrants).length} grant content packs in p31-forge/`);
} catch (e) {
  die(`Cannot read p31-forge/content/grants/: ${e.message}`);
}

// 3. Check each active grant against pipeline
console.log('\n── Active grant checks ──\n');

for (const g of pipeline.grants) {
  if (!g.id || !g.title || !g.deadline) {
    log('ERROR', `Grant missing required fields: ${JSON.stringify(g)}`);
    continue;
  }

  const today = new Date();
  today.setHours(0,0,0,0);
  const due = new Date(g.deadline);
  const daysLeft = Math.ceil((due - today) / 86400000);

  console.log(`→ ${g.title} (${g.id})`);

  // Content pack presence
  if (g.contentPack) {
    const expectedKey = path.basename(g.contentPack, '.json');
    if (!forgeGrants[expectedKey]) {
      log('ERROR', `  Content pack missing at ${g.contentPack}`);
    } else {
      log('OK', `  Content pack: ${expectedKey}.json`);
    }
  }

  // Application markdown (if referenced)
  if (g.applicationPath) {
    const appPath = path.join(__dirname, '..', g.applicationPath);
    if (!fs.existsSync(appPath)) {
      log('ERROR', `  Application file missing: ${g.applicationPath}`);
    } else {
      const stat = fs.statSync(appPath);
      if (stat.size === 0) {
        log('ERROR', `  Application file is empty: ${g.applicationPath}`);
      } else {
        log('OK', `  Application: ${g.applicationPath} (${stat.size} bytes)`);
      }
    }
  }

  // Deadline sanity
  if (daysLeft < 0 && g.status !== 'submitted_awaiting_decision' && g.status !== 'contact_initiated') {
    log('ERROR', `  Deadline PAST: ${g.deadline} (${Math.abs(daysLeft)} days ago). Status says ${g.status}`);
  } else if (daysLeft >= 0 && daysLeft <= 7 && g.status !== 'submitted_awaiting_decision') {
    log('WARN', `  Deadline approaching: ${daysLeft} days (${g.deadline}) — status ${g.status}`);
  } else {
    log('OK', `  Deadline: ${g.deadline} (${daysLeft > 0 ? daysLeft + ' days' : 'today'})`);
  }
}

// 4. Check archived grants don't have active content packs
console.log('\n── Archived grant sanity ──\n');

if (pipeline.archived && Array.isArray(pipeline.archived)) {
  for (const a of pipeline.archived) {
    console.log(`→ ${a.title} (${a.id}) [archived]`);
    // Archived grants should NOT have content packs
    if (a.contentPack) {
      const expectedKey = path.basename(a.contentPack, '.json');
      if (forgeGrants[expectedKey]) {
        log('WARN', `  Has content pack (${expectedKey}.json) but marked archived — consider removing`);
      }
    }
  }
}

// 5. Stats summary
console.log('\n── Pipeline stats ──\n');
const active = pipeline.grants.length;
const pastDue = pipeline.grants.filter(g => {
  const due = new Date(g.deadline);
  const today = new Date();
  today.setHours(0,0,0,0);
  return due < today && !['submitted_awaiting_decision', 'contact_initiated'].includes(g.status);
}).length;
const needingNarrative = pipeline.grants.filter(g => g.status === 'draft_complete_narrative_pending').length;

console.log(`Active grants: ${active}`);
console.log(`Past-due (action needed): ${pastDue}`);
console.log(`Narrative pending (operator): ${needingNarrative}`);
console.log(`Next deadline: ${pipeline.pipelineStats?.nextDeadline || 'unknown'}`);

// Final exit
if (errors > 0) {
  console.log(`\n❌ ${errors} error(s) found — fix before submitting any grant.`);
  process.exit(1);
} else if (warnings > 0) {
  console.log(`\n⚠️ ${warnings} warning(s) — review recommended.`);
  process.exit(0);
} else {
  console.log('\n✅ All grant pipeline checks passed.');
  process.exit(0);
}
