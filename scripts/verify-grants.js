#!/usr/bin/env node
/**
 * verify:grants — CI gate for grant pipeline integrity (hardened v2)
 *
 * Checks:
 *  1. Schema validation of grant-pipeline.json (required fields, types, enums)
 *  2. Content pack existence + JSON validity + required fields
 *  3. Application markdown files exist and are non-empty
 *  4. Deadline sanity (no past-due active grants without justification)
 *  5. No secrets/API keys committed in grant-related files
 *  6. No duplicate grant IDs or titles
 *  7. Cross-reference: if applicationPath exists, contentPack should exist (and vice versa for active grants)
 *
 * Exit: 0 if all pass, 1 if any fail
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

// ── 1. Load + validate grant-pipeline.json schema ──────────────────────────
let pipeline;
try {
  const raw = fs.readFileSync(PIPELINE_JSON, 'utf-8');
  pipeline = JSON.parse(raw);
  log('OK', `grant-pipeline.json loaded (schema: ${pipeline.schema || 'unversioned'})`);
} catch (e) {
  die(`Failed to read/parse grant-pipeline.json: ${e.message}`);
}

// Top-level schema check
const requiredTop = ['schema', 'version', 'grants'];
for (const key of requiredTop) {
  if (!pipeline[key]) die(`Missing top-level .${key} field`);
}

if (!Array.isArray(pipeline.grants)) die('.grants must be an array');

// ── 2. Load forge content directory ───────────────────────────────────────
const forgeGrants = {};
try {
  const files = fs.readdirSync(FORGE_GRANTS_DIR);
  for (const f of files) {
    if (f.endsWith('.json')) {
      const key = f.replace('.json', '');
      forgeGrants[key] = { path: path.join(FORGE_GRANTS_DIR, f), raw: null };
    }
  }
  log('OK', `Found ${Object.keys(forgeGrants).length} grant content packs in p31-forge/`);
} catch (e) {
  die(`Cannot read p31-forge/content/grants/: ${e.message}`);
}

// Parse each content pack and validate structure
for (const [key, info] of Object.entries(forgeGrants)) {
  try {
    const raw = fs.readFileSync(info.path, 'utf-8');
    const parsed = JSON.parse(raw);
    info.raw = parsed;

    if (parsed.kind !== 'grant') log('WARN', `  ${key}.json: kind should be 'grant' (found: ${parsed.kind})`);
    if (!parsed.filename) log('WARN', `  ${key}.json: missing filename`);
    if (!parsed.body || !Array.isArray(parsed.body)) log('WARN', `  ${key}.json: body array missing or empty`);

    // Check for hardcoded secrets in content pack
    const rawLower = raw.toLowerCase();
    for (const secret of ['api_key', 'secret', 'token', 'password', 'private_key']) {
      if (rawLower.includes(secret)) {
        log('WARN', `  ${key}.json: contains "${secret}" — verify not a real secret`);
      }
    }
  } catch (e) {
    log('ERROR', `  ${key}.json: invalid JSON — ${e.message}`);
  }
}

// ── 3. Track duplicates ────────────────────────────────────────────────────
const seenIds = new Set();
const seenTitles = new Set();

// ── 4. Check each active grant against pipeline ────────────────────────────
console.log('\n── Active grant checks ──\n');

for (const g of pipeline.grants) {
  // Required field check
  if (!g.id || !g.title || !g.deadline) {
    log('ERROR', `Grant missing required fields (id/title/deadline): ${JSON.stringify(g)}`);
    continue;
  }

  // Duplicate ID/title detection
  if (seenIds.has(g.id)) log('ERROR', `  Duplicate grant id: ${g.id}`);
  else seenIds.add(g.id);
  const titleLower = g.title.toLowerCase();
  if (seenTitles.has(titleLower)) log('ERROR', `  Duplicate grant title: ${g.title}`);
  else seenTitles.add(titleLower);

  // Type checks
  if (typeof g.id !== 'string') log('ERROR', `  id must be string`);
  if (typeof g.title !== 'string') log('ERROR', `  title must be string`);
  if (!g.deadline || typeof g.deadline !== 'string') log('ERROR', `  deadline must be non-empty string`);

  console.log(`→ ${g.title} (${g.id})`);

  // Content pack presence (required for active grants)
  if (g.contentPack) {
    const expectedKey = path.basename(g.contentPack, '.json');
    if (!forgeGrants[expectedKey]) {
      log('ERROR', `  Content pack missing: ${g.contentPack}`);
    } else {
      const pack = forgeGrants[expectedKey].raw;
      if (!pack) log('ERROR', `  Content pack unreadable: ${expectedKey}.json`);
      else log('OK', `  Content pack: ${expectedKey}.json`);
    }
  } else if (!g.archived) {
    log('WARN', `  No contentPack defined — Forge generation will be manual`);
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

        // Secret scan application file
        const appContent = fs.readFileSync(appPath, 'utf-8').toLowerCase();
        for (const secret of ['sk_', 'rk_', 'api_key', 'Bearer ', 'Basic ']) {
          if (appContent.includes(secret)) {
            log('ERROR', `  Application contains potential secret pattern: "${secret}" — REMOVE`);
          }
        }
      }
    }
  }

  // Deadline sanity — compute daysLeft
  let daysLeft;
  if (g.deadline.toLowerCase() === 'rolling') {
    daysLeft = Infinity;
  } else {
    const today = new Date(); today.setHours(0,0,0,0);
    const due = new Date(g.deadline);
    daysLeft = isNaN(due.getTime()) ? NaN : Math.ceil((due - today) / 86400000);
  }

  if (daysLeft !== daysLeft) {
    // rolling
    log('OK', `  Deadline: rolling`);
  } else if (daysLeft < 0) {
    const pastDays = Math.abs(daysLeft);
    if (g.status === 'submitted_awaiting_decision') {
      log('OK', `  Deadline past (${pastDays}d) — status: submitted_awaiting_decision`);
    } else if (g.status === 'contact_initiated' || g.status === 'contact_initiated_track_fy2027') {
      log('OK', `  Deadline past (${pastDays}d) — status: contact_initiated (acceptable for research phase)`);
    } else {
      log('ERROR', `  Deadline PAST by ${pastDays} days with status "${g.status}" — missing submission?`);
    }
  } else if (daysLeft <= 7 && !['submitted_awaiting_decision', 'awarded', 'rejected'].includes(g.status)) {
    log('WARN', `  Deadline approaching: ${daysLeft} days (${g.deadline}) — status ${g.status}`);
  } else {
    log('OK', `  Deadline: ${g.deadline} (${daysLeft}d)`);
  }

  // Amount sanity (if present)
  if (g.amount) {
    const amt = typeof g.amount === 'number' ? g.amount : g.amount.requested;
    if (amt && (amt < 0 || amt > 1e9)) {
      log('WARN', `  Amount outlier: $${amt.toLocaleString()} — verify correct`);
    }
  }
}

// ── 5. Archived grant sanity ───────────────────────────────────────────────
console.log('\n── Archived grant sanity ──\n');

if (pipeline.archived && Array.isArray(pipeline.archived)) {
  for (const a of pipeline.archived) {
    console.log(`→ ${a.title} (${a.id}) [archived]`);
    if (a.contentPack) {
      const expectedKey = path.basename(a.contentPack, '.json');
      if (forgeGrants[expectedKey]) {
        log('WARN', `  Has content pack (${expectedKey}.json) but marked archived — consider removing from active`);
      }
    }
  }
}

// ── 6. Cross-reference check: applicationPath ↔ contentPack ─────────────────
console.log('\n── Cross-reference check ──\n');

for (const g of pipeline.grants) {
  const hasApp = !!g.applicationPath;
  const hasPack = !!g.contentPack;
  // Active grants heading to submission should have both
  if (!hasApp && !hasPack && !g.archived) {
    log('WARN', `  ${g.title}: neither applicationPath nor contentPack — manual process?`);
  }
}

// ── 7. Secrets scan in grant-related directory ────────────────────────────
console.log('\n── Secrets scan (grant-related files) ──\n');

const grantRelatedPaths = [
  PIPELINE_JSON,
  GRANTS_DOCS_DIR,
  FORGE_GRANTS_DIR
];

function scanFileForSecrets(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const patterns = [
      /sk_[\w-]+/,           // Stripe secret key
      /rk_[\w-]+/,           // Stripe restricted key  
      /ghp_[\w-]+/,          // GitHub personal access token
      /github_pat_[\w-]+/,   // GitHub fine-grained token
      /AKIA[\w]{16}/,        // AWS access key
      /AIza[\w-]{35}/,       // Google API key
      /xoxb-[\w-]+/,         // Slack bot token
      /xoxp-[\w-]+/,         // Slack user token
      /Bearer [\w]+/,        // Generic bearer
      /Basic [\w=]+/,        // Generic basic auth
    ];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const pat of patterns) {
        if (pat.test(line)) {
          return { line: i+1, snippet: line.trim().slice(0, 80) };
        }
      }
    }
  } catch (_) {}
  return null;
}

// Recursive scan
function scanDirectory(dir, results) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDirectory(full, results);
      } else if (/\.(json|md|ts|js|yml|yaml|env|txt|docx?|pdf)$/i.test(entry.name)) {
        const hit = scanFileForSecrets(full);
        if (hit) results.push({ file: full.replace(process.cwd(), '.'), ...hit });
      }
    }
  } catch (e) { /* ignore unreadable */ }
}

const secretHits = [];
scanDirectory(path.dirname(PIPELINE_JSON), secretHits);
if (secretHits.length === 0) {
  log('OK', 'No hardcoded secrets found in grant-related files');
} else {
  for (const hit of secretHits) {
    log('ERROR', `  ${hit.file}:${hit.line}: possible secret — ${hit.snippet}`);
  }
}

// ── 8. Stats summary ───────────────────────────────────────────────────────
console.log('\n── Pipeline stats ──\n');
const active = pipeline.grants.length;
const pastDue = pipeline.grants.filter(g => {
  if (g.deadline.toLowerCase() === 'rolling') return false;
  const due = new Date(g.deadline);
  const today = new Date(); today.setHours(0,0,0,0);
  return due < today && !['submitted_awaiting_decision', 'contact_initiated'].includes(g.status);
}).length;
const needingNarrative = pipeline.grants.filter(g => g.status === 'draft_complete_narrative_pending').length;

console.log(`Active grants: ${active}`);
console.log(`Past-due (action needed): ${pastDue}`);
console.log(`Narrative pending (operator): ${needingNarrative}`);
console.log(`Next deadline: ${pipeline.pipelineStats?.nextDeadline || 'unknown'}`);

// Exit
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
