#!/usr/bin/env node

/**
 * scripts/verify-p31-style.mjs
 *
 * Verifies P31 Shared Surface design system token adherence.
 */

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

console.log('Running verify:p31-style...');

// Check canonical CSS exists
const canonicalCssPath = resolve(projectRoot, 'shared/styles/p31-style.css');
if (!existsSync(canonicalCssPath)) {
  console.error('  ❌ Canonical CSS not found at shared/styles/p31-style.css');
  process.exit(1);
}

const canonicalCss = readFileSync(canonicalCssPath, 'utf-8');

// Define canonical tokens that must exist
const requiredTokens = [
  '--p31-void', '--p31-surface', '--p31-surface2',
  '--p31-coral', '--p31-teal', '--p31-cyan',
  '--p31-cloud', '--p31-butter', '--p31-lavender',
  '--p31-phosphorus', '--p31-muted',
  '--p31-border-subtle',
  '--p31-glass-surface', '--p31-glass-border',
  '--p31-radius-sm', '--p31-radius-md', '--p31-radius-lg',
  '--p31-text-xs', '--p31-text-sm', '--p31-text-base',
  '--p31-font-sans', '--p31-font-mono',
  '--p31-space-1', '--p31-space-4', '--p31-space-8',
  '--p31-duration-normal', '--p31-ease-standard',
  '--p31-z-sticky', '--p31-focus-color-hub'
];

console.log('  Checking canonical tokens...');
const missingTokens = requiredTokens.filter(token => !canonicalCss.includes(token));
if (missingTokens.length > 0) {
  console.error('  ❌ Missing required tokens: ' + missingTokens.join(', '));
  process.exit(1);
}
console.log('  ✅ All ' + requiredTokens.length + ' required tokens present.');

// Check package-specific CSS files for hardcoded hex
const packages = ['p31ca-org', 'phosphorus31-org'];
for (const pkg of packages) {
  const packageRoot = resolve(projectRoot, 'packages', pkg);
  if (!existsSync(packageRoot)) continue;

  let findResult;
  try {
    findResult = execSync('find "' + packageRoot + '" -name "*.css" -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/.astro/*" 2>/dev/null', { encoding: 'utf-8' });
  } catch (e) {
    continue;
  }
  
  const cssFiles = findResult.trim().split('\n').filter(Boolean);
  
  for (const cssFile of cssFiles) {
    if (cssFile.includes('shared/styles')) continue;
    
    const content = readFileSync(cssFile, 'utf-8');
    const lines = content.split('\n');
    let hasHardcodedHex = false;
    let violations = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      if (trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('//')) continue;
      if (!trimmed) continue;
      if (trimmed.includes(':root') || trimmed.includes('--p31-')) continue;
      
      const hexMatches = line.match(/#[0-9a-fA-F]{3,8}(?![^;}]*var\(--p31-)/g);
      if (hexMatches && hexMatches.length > 0) {
        hasHardcodedHex = true;
        violations.push('    Line ' + (i + 1) + ': ' + line.trim());
      }
    }
    
    if (hasHardcodedHex) {
      console.error('  ❌ ' + cssFile + ': Found hardcoded hex values. Use P31 design tokens instead.');
      for (const v of violations) console.error(v);
      process.exit(1);
    }
  }
}

console.log('  ✅ No hardcoded hex values found in package CSS files.');
console.log('  ✅ P31 Shared Surface style verification passed.');
process.exit(0);
