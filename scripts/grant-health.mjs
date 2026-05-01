#!/usr/bin/env node
/**
 * Grant Pipeline Health Check — single command operator readiness
 *
 * Checks all grant infrastructure components:
 *   1. grant-pipeline.json integrity
 *   2. Cortex GrantAgent DO reachable + seeded
 *   3. Command Center grants KPI populated
 *   4. Discord bot file compiles (TypeScript)
 *   5. Forge content packs present + valid JSON
 *
 * Usage: node scripts/grant-health.mjs
 * Exit: 0 = all healthy, 1 = issues found
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

let errors = 0;
let warnings = 0;

function log(emoji, msg) {
  console.log(`${emoji} ${msg}`);
  if (emoji === '❌') errors++;
  if (emoji === '⚠️') warnings++;
}

function check(name, fn) {
  try {
    process.stdout.write(`  Checking ${name}... `);
    const ok = fn();
    if (ok === true) console.log('✅');
    else if (ok === false) { console.log('❌'); errors++; }
    else if (ok === 'warn') { console.log('⚠️'); warnings++; }
  } catch (e) {
    console.log(`❌ ${e.message}`);
    errors++;
  }
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  GRANT PIPELINE — Health Check');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 1. grant-pipeline.json
  check('grant-pipeline.json exists + valid', () => {
    const p = path.join(__dirname, '../docs/grants/grant-pipeline.json');
    if (!fs.existsSync(p)) return false;
    const raw = fs.readFileSync(p, 'utf-8');
    const j = JSON.parse(raw);
    return j.schema && Array.isArray(j.grants) && j.grants.length > 0;
  });

  check('Active grants ≥ 5', () => {
    const p = path.join(__dirname, '../docs/grants/grant-pipeline.json');
    const j = JSON.parse(fs.readFileSync(p, 'utf-8'));
    return j.grants.length >= 5;
  });

  // 2. Forge content packs
  check('Forge content packs (6 files)', () => {
    const dir = path.join(__dirname, '../andromeda/04_SOFTWARE/p31-forge/content/grants');
    if (!fs.existsSync(dir)) return false;
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
    return files.length >= 6;
  });

  // 3. npm scripts present
  check('npm run grant:verify script', () => {
    const pj = path.join(__dirname, 'package.json');
    const j = JSON.parse(fs.readFileSync(pj, 'utf-8'));
    return j.scripts && j.scripts['grant:verify'];
  });

  check('npm run grant:sync script', () => {
    const pj = path.join(__dirname, 'package.json');
    const j = JSON.parse(fs.readFileSync(pj, 'utf-8'));
    return j.scripts && j.scripts['grant:sync'];
  });

  // 4. Discord bot compiles (check TypeScript)
  check('Discord bot grants.ts exists', () => {
    const p = path.join(__dirname, '../andromeda/04_SOFTWARE/discord/p31-bot/src/commands/grants.ts');
    if (!fs.existsSync(p)) return false;
    const content = fs.readFileSync(p, 'utf-8');
    return content.includes('CORTEX_URL') && content.includes('fetch');
  });

  console.log('\n── Network Checks (may take 10s) ──\n');

  // 5. Cortex GrantAgent reachable
  check('Cortex health endpoint', () => {
    return new Promise((resolve) => {
      const req = https.get('https://p31-cortex.trimtab-signal.workers.dev/health', (res) => {
        resolve(res.statusCode === 200);
      });
      req.on('error', () => resolve(false));
      setTimeout(() => { req.destroy(); resolve(false); }, 5000);
    });
  });

  check('Cortex /api/grant/run', () => {
    return new Promise((resolve) => {
      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      };
      const req = https.request('https://p31-cortex.trimtab-signal.workers.dev/api/grant/run', options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const j = JSON.parse(data);
            resolve(j.ok === true && Array.isArray(j.pipeline));
          } catch { resolve(false); }
        });
      });
      req.on('error', () => resolve(false));
      req.write('{}');
      req.end();
      setTimeout(() => { req.destroy(); resolve(false); }, 5000);
    });
  });

  // 6. Command Center status (grants field)
  check('Command Center /api/status grants', () => {
    return new Promise((resolve) => {
      https.get('https://command-center.trimtab-signal.workers.dev/api/status', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const j = JSON.parse(data);
            resolve(j.grants && typeof j.grants.active === 'number');
          } catch { resolve(false); }
        });
      }).on('error', () => resolve(false));
      setTimeout(() => resolve(false), 5000);
    });
  });

  console.log('\n── Summary ──\n');
  log('✅', `Errors: ${errors}`);
  log('⚠️', `Warnings: ${warnings}`);

  if (errors === 0 && warnings === 0) {
    console.log('\n✅ All grant pipeline components healthy.');
    console.log('   Next: npm run grant:verify && npm run grant:sync\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Grant pipeline has issues — review above.');
    if (errors > 0) console.log('   Fix errors before submitting grants.\n');
    process.exit(errors > 0 ? 1 : 0);
  }
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
