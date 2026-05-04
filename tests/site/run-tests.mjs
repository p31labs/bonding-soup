#!/usr/bin/env node
/**
 * P31 Site Test Runner
 * Runs the comprehensive site test suite
 * 
 * Usage:
 *   node tests/site/run-tests.mjs        # Run all tests
 *   node tests/site/run-tests.mjs --json  # Output JSON for CI
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const args = process.argv.slice(2);
const jsonMode = args.includes('--json');

console.log('═══════════════════════════════════════════════════════════');
console.log('P31 Site Test Suite');
console.log('═══════════════════════════════════════════════════════════\n');

try {
  // Check if vitest is available
  const vitestPath = path.join(ROOT, 'node_modules/.bin/vitest');
  if (!fs.existsSync(vitestPath)) {
    console.error('❌ Vitest not found. Run: npm install');
    process.exit(1);
  }

  // Run tests with site-specific config
  const result = execSync(
    `${vitestPath} run --config vitest.site.config.mjs`,
    {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: jsonMode ? 'pipe' : 'inherit',
    }
  );

  if (jsonMode) {
    console.log(result);
  }

  console.log('\n✅ All tests passed');
  process.exit(0);
} catch (error) {
  if (jsonMode) {
    console.error(error.stdout || error.message);
  }
  console.error('\n❌ Tests failed');
  process.exit(1);
}
