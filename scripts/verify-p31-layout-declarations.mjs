#!/usr/bin/env node
/**
 * verify:p31-layout-declarations
 * Every p31ca Astro page must declare its layout template via @p31-layout:
 * Valid values: Focus | Workshop | Gallery
 *
 * Focus    — 1 column, 1 action. Onboarding, legal, single-task.
 * Workshop — Sidebar + main. Cockpit, NOC, messaging, orchestrator.
 * Gallery  — Progressive grid. Hub cards, papers, assets, integrations.
 *
 * Gate behavior:
 *   - FAIL  if a page declares @p31-layout with an invalid value
 *   - WARN  if a page has no @p31-layout declaration (coverage gap)
 *   - PASS  if all scanned pages have valid declarations
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'fs';
import { join, extname, relative } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const PAGES_DIR = join(ROOT, 'andromeda', '04_SOFTWARE', 'p31ca', 'src', 'pages');

const VALID_LAYOUTS = new Set(['Focus', 'Workshop', 'Gallery']);
const LAYOUT_RE = /@p31-layout:\s*(\S+)/;

let passed = 0, warned = 0, failed = 0;
const missing = [], invalid = [], declared = [];

function pass(msg)  { console.log(`  ✓ ${msg}`); passed++; }
function warn(msg)  { console.log(`  ⚠ ${msg}`); warned++; }
function fail(msg)  { console.error(`  ✗ ${msg}`); failed++; }

function scanPages(dir, depth = 0) {
  if (!existsSync(dir) || depth > 3) return;
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('.') || entry === 'node_modules') continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) { scanPages(full, depth + 1); continue; }
    if (extname(entry) !== '.astro') continue;

    const rel = relative(ROOT, full).split('/').join('/');
    const src = readFileSync(full, 'utf-8');
    const m = src.match(LAYOUT_RE);
    if (!m) {
      missing.push(rel);
    } else {
      const val = m[1].trim();
      if (!VALID_LAYOUTS.has(val)) {
        invalid.push({ rel, val });
      } else {
        declared.push({ rel, val });
      }
    }
  }
}

console.log('verify:p31-layout-declarations — P31 Surface Layout Enforcement');
scanPages(PAGES_DIR);

const total = missing.length + invalid.length + declared.length;

for (const { rel, val } of invalid) {
  fail(`${rel}: invalid @p31-layout "${val}" (must be Focus | Workshop | Gallery)`);
}

for (const { rel, val } of declared) {
  pass(`${rel}: @p31-layout: ${val}`);
}

for (const rel of missing) {
  warn(`${rel}: missing @p31-layout declaration`);
}

const coverage = total > 0 ? Math.round((declared.length / total) * 100) : 0;
console.log(`\n  Coverage: ${declared.length}/${total} pages declared (${coverage}%)`);
console.log(`  Passed: ${passed} | Warned: ${warned} | Failed: ${failed}`);

if (failed > 0) {
  console.error(`\nverify:p31-layout-declarations: FAIL — ${failed} invalid declaration(s)`);
  process.exit(1);
} else if (warned > 0) {
  console.log(`\nverify:p31-layout-declarations: OK (${warned} page(s) missing declaration — add @p31-layout to frontmatter comment)`);
} else {
  console.log(`\nverify:p31-layout-declarations: ALL OK — ${declared.length}/${total} pages declared`);
}
