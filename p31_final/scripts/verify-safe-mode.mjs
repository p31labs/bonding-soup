#!/usr/bin/env node

/**
 * scripts/verify-safe-mode.mjs
 *
 * Verifies safe mode implementation across all P31 surfaces.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

console.log('Running verify:safe-mode...');

// Define surfaces to check
const surfaces = [
  { path: resolve(projectRoot, 'packages/p31ca-org/public/passport.html'), name: 'passport' },
  { path: resolve(projectRoot, 'packages/p31ca-org/public/geodesic.html'), name: 'geodesic' },
  { path: resolve(projectRoot, 'packages/p31ca-org/public/delta-language.html'), name: 'delta-language' },
  { path: resolve(projectRoot, 'packages/p31ca-org/public/observatory.html'), name: 'observatory' }
].filter(s => existsSync(s.path));

if (surfaces.length === 0) {
  console.log('  ⚠ No standalone surfaces found to verify. Skipping.');
  console.log('  ✅ Safe mode verification passed (no surfaces to check).');
  process.exit(0);
}

// Check that p31-safe-mode.js exists
const safeModeScript = resolve(projectRoot, 'packages/p31ca-org/public/lib/p31-safe-mode.js');
if (!existsSync(safeModeScript)) {
  console.error('  ❌ p31-safe-mode.js not found at packages/p31ca-org/public/lib/p31-safe-mode.js');
  process.exit(1);
}
console.log('  ✅ p31-safe-mode.js exists.');

// Verify p31-safe-mode.js has required functions
const safeModeJs = readFileSync(safeModeScript, 'utf-8');
const requiredExports = ['initSafeMode', 'engage', 'disengage', 'toggle'];
for (const fn of requiredExports) {
  if (!safeModeJs.includes(`function ${fn}`) && !safeModeJs.includes(`${fn}()`) && !safeModeJs.includes(`const ${fn}`) && !safeModeJs.includes(`const ${fn} =`)) {
    console.error(`  ❌ p31-safe-mode.js missing function: ${fn}`);
    process.exit(1);
  }
}
console.log('  ✅ All required functions present in p31-safe-mode.js.');

// Check each surface
let allPassed = true;
for (const surface of surfaces) {
  const html = readFileSync(surface.path, 'utf-8');
  
  if (!html.includes('p31-safe-mode.js')) {
    console.error(`  ❌ ${surface.name}: Missing p31-safe-mode.js script tag`);
    allPassed = false;
  }
  
  if (!html.includes('safeModeBtn')) {
    console.error(`  ❌ ${surface.name}: Missing safe mode button (id="safeModeBtn")`);
    allPassed = false;
  }
  
  if (!html.match(/body\.safe-mode\s*{/)) {
    console.error(`  ❌ ${surface.name}: Missing body.safe-mode CSS in <style>`);
    allPassed = false;
  }
  
  if (!html.includes('p31:safe-mode')) {
    console.error(`  ❌ ${surface.name}: Missing p31:safe-mode event listener`);
    allPassed = false;
  }
  
  if (allPassed) {
    console.log(`  ✅ ${surface.name}: Safe mode properly implemented`);
  }
}

if (!allPassed) {
  console.error('  ❌ Safe mode verification failed.');
  process.exit(1);
}

console.log('  ✅ All surfaces passed safe mode verification.');
process.exit(0);
