#!/usr/bin/env node
/**
 * Print hex HMAC-SHA256 of a JSON body for X-Phos-Signature (same as simplex-worker verify).
 *
 * Usage (from simplex-v7/):
 *   PHOS_HMAC_SECRET='your-secret' node scripts/phos-sign.mjs [path/to/body.json]
 *
 * Body file must be exact bytes sent in POST (pretty-print is fine if client sends same).
 */
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const secret = process.env.PHOS_HMAC_SECRET?.trim();
if (!secret) {
  console.error('Missing PHOS_HMAC_SECRET in environment.');
  process.exit(1);
}

const file = resolve(process.argv[2] ?? 'scripts/phos-example-body.json');
const body = readFileSync(file, 'utf8');
const sig = createHmac('sha256', secret).update(body, 'utf8').digest('hex');

console.log('X-Phos-Signature:', sig);
console.log('');
console.log(`curl -sS -X POST "${process.env.PHOS_URL ?? 'https://api.phosphorus31.org'}/api/phos/respond" \\`);
console.log('  -H "Content-Type: application/json" \\');
console.log(`  -H "X-Phos-Signature: ${sig}" \\`);
console.log(`  -d @${file}`);
