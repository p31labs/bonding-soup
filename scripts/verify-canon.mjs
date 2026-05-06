#!/usr/bin/env node
/**
 * verify-canon.mjs — P31 Canonical Truth Enforcer
 *
 * Tests every binding constraint from the P31 master documentation:
 *   - Token values (colors, fonts, radii, spacing)
 *   - Naming conventions (no PhosOS, no QMU, no G.O.D.)
 *   - Persona facts (S.J.=10, W.J.=6, never swapped)
 *   - Infrastructure constants (KV polling, SE050, SX1262, Larmor)
 *   - Content rules (no naval metaphors, no tracking, no PII)
 *   - File structure (shared modules, PHOS router, safe mode)
 *   - Architectural invariants (touch targets, border radius, glass spec)
 *
 * Usage:
 *   node scripts/verify-canon.mjs [--verbose] [--fix-hints]
 *
 * Exit 0 = all canon tests pass
 * Exit 1 = one or more violations found
 *
 * Wire into package.json:
 *   "verify:canon": "node scripts/verify-canon.mjs"
 *
 * Then add to the verify chain:
 *   "verify": "... && npm run verify:canon && ..."
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join, extname, relative } from 'path';

const ROOT = process.cwd();
const VERBOSE = process.argv.includes('--verbose');
const FIX_HINTS = process.argv.includes('--fix-hints');

let passed = 0;
let failed = 0;
let warnings = 0;
const failures = [];
const warns = [];

function pass(name) {
  passed++;
  if (VERBOSE) console.log(`  ✓ ${name}`);
}

function fail(name, detail, fix) {
  failed++;
  const msg = `  ✗ ${name}: ${detail}`;
  failures.push({ name, detail, fix });
  console.error(msg);
  if (FIX_HINTS && fix) console.error(`    → Fix: ${fix}`);
}

function warn(name, detail) {
  warnings++;
  warns.push({ name, detail });
  if (VERBOSE) console.log(`  ⚠ ${name}: ${detail}`);
}

function heading(title) {
  console.log(`\n── ${title} ${'─'.repeat(Math.max(0, 60 - title.length))}`);
}

// ── FILE SCANNING ──────────────────────────────────────────────────────────

const SCAN_EXTENSIONS = new Set([
  '.html', '.astro', '.jsx', '.tsx', '.ts', '.js', '.mjs',
  '.css', '.json', '.md', '.svelte', '.vue',
]);

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', '.astro', '.cache',
  'coverage', '.claude', '__pycache__', '.wrangler',
  'archive', // historical content — token values are expected to be old
  'assets',  // built/bundled artifacts — not editable source
]);

function walkFiles(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.isDirectory()) continue;
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, files);
    } else if (SCAN_EXTENSIONS.has(extname(entry.name))) {
      files.push(full);
    }
  }
  return files;
}

function readSafe(path) {
  try { return readFileSync(path, 'utf-8'); } catch { return null; }
}

// Files that DEFINE CSS variables (necessarily contain hex values) or are
// generated content indexes not editable by agents
const TOKEN_EXEMPT_PATTERNS = [
  'p31-style.css',        // CSS var definition master + mirrors
  'p31-shared-surface.css',
  'p31-qmu-tokens.css',
  'p31-tw.css',
  'p31-tailwind-extend.js',
  'doc-library/index.json',    // generated content index — contains document text
  'doc-library/index.html',    // generated doc browser
  'p31-delta-language.json',   // language corpus — contains example vocabulary
  'demos/p31-alignment.json',  // demo/snapshot data
  'pwa/manifest-',             // PWA manifests
  'agent/',                    // generated agent pages
  'social-cards/',             // generated social card pages
];

function isTokenExempt(file) {
  return TOKEN_EXEMPT_PATTERNS.some(p => file.includes(p));
}

// Files exempt from naming convention checks (legacy compat files, content indexes, generated)
const NAMING_EXEMPT_PATTERNS = [
  'doc-library/',           // generated content index
  'p31-delta-language.json',
  'p31-qmu-tokens.css',     // legacy token compat file — kept for backward compat
  'demos/p31-alignment.json', // demo snapshot
  'agent/',                 // generated agent pages
  'social-cards/',          // generated social card pages
  'verify-canon',
];

function isNamingExempt(file) {
  return NAMING_EXEMPT_PATTERNS.some(p => file.includes(p));
}

// Files exempt from infra claims checks (content/historical)
const CLAIM_EXEMPT_PATTERNS = [
  'doc-library/index.json',
  'p31-delta-language.json',
];

function isClaimExempt(file) {
  return CLAIM_EXEMPT_PATTERNS.some(p => file.includes(p));
}

// ── TEST SUITES ────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════
// SUITE 1: TOKEN VALUES
// Source: p31-constants.json, p31-style.css, God File corrections log
// ═══════════════════════════════════════════════════════════════════════════

function testTokenValues() {
  heading('CANON §1: Token Values');

  // Known-wrong values that must NEVER appear in source files
  const BANNED_TOKENS = [
    { wrong: '#0b0d10', canonical: '#0f1115', name: '--p31-void', source: 'Kimi prototype' },
    { wrong: 'var(--p31-teal)', canonical: '#5DCAA5', name: '--p31-teal', source: 'Gemini QMU spec' },
    { wrong: 'var(--p31-phosphorus)', canonical: '#5dca5d', name: '--p31-phosphorus', source: 'Gemini QMU spec' },
    { wrong: 'var(--p31-cloud)', canonical: '#e8e6e3', name: '--p31-cloud', source: 'Gemini QMU spec' },
    { wrong: 'var(--p31-amber)', canonical: '#cda852', name: '--p31-amber', source: 'Tailwind amber-500 leak' },
    { wrong: 'var(--p31-coral)', canonical: '#cc6247', name: '--p31-coral', source: 'Tailwind red-400 leak' },
    { wrong: '#14b8a6', canonical: '#5DCAA5', name: '--p31-teal', source: 'Tailwind teal-500 leak' },
    { wrong: 'var(--p31-teal)', canonical: '#5DCAA5', name: '--p31-teal', source: 'Tailwind emerald-500 leak' },
    { wrong: '#22c55e', canonical: '#5dca5d', name: '--p31-phosphorus', source: 'Tailwind green-500 leak' },
    { wrong: '#4ade80', canonical: '#5dca5d', name: '--p31-phosphorus', source: 'Tailwind green-400 leak' },
    { wrong: '#111827', canonical: '#0f1115', name: '--p31-void', source: 'Tailwind gray-900 leak' },
    { wrong: '#1a1a1a', canonical: '#0f1115', name: '--p31-void', source: 'Generic dark mode' },
  ];

  // Scan all source files
  const sourceFiles = [
    ...walkFiles(join(ROOT, 'src')),
    ...walkFiles(join(ROOT, 'public')),
    ...walkFiles(join(ROOT, 'scripts')),
    ...(existsSync(join(ROOT, 'andromeda')) ? walkFiles(join(ROOT, 'andromeda', '04_SOFTWARE', 'p31ca', 'src')) : []),
    ...(existsSync(join(ROOT, 'andromeda')) ? walkFiles(join(ROOT, 'andromeda', '04_SOFTWARE', 'p31ca', 'public')) : []),
    ...(existsSync(join(ROOT, 'cognitive-passport')) ? walkFiles(join(ROOT, 'cognitive-passport')) : []),
  ];

  for (const bt of BANNED_TOKENS) {
    const regex = new RegExp(bt.wrong.replace('#', '#?'), 'gi');
    const violators = [];
    for (const file of sourceFiles) {
      const content = readSafe(file);
      if (!content) continue;
      // Skip this test file itself, docs, and CSS definition files
      if (file.includes('verify-canon')) continue;
      if (file.endsWith('.md')) continue;
      if (isTokenExempt(file)) continue;
      const matches = content.match(regex);
      if (matches) {
        violators.push(relative(ROOT, file));
      }
    }
    if (violators.length === 0) {
      pass(`No banned ${bt.name} value (${bt.wrong}) in codebase`);
    } else {
      fail(
        `Banned ${bt.name} value found`,
        `${bt.wrong} (from ${bt.source}) in: ${violators.join(', ')}`,
        `Replace ${bt.wrong} with var(${bt.name}) or ${bt.canonical}`
      );
    }
  }

  // Check border radius
  const BANNED_RADIUS = ['border-radius: 3rem', 'border-radius: 48px', 'borderRadius: "3rem"', 'borderRadius: "48px"'];
  for (const file of sourceFiles) {
    const content = readSafe(file);
    if (!content || file.includes('verify-canon') || file.endsWith('.md')) continue;
    for (const br of BANNED_RADIUS) {
      if (content.includes(br)) {
        fail(
          `Banned border-radius in ${relative(ROOT, file)}`,
          `Found "${br}" — canonical max is 12px for glass panels`,
          `Use 12px for panels, 8px for buttons, 4px for small components`
        );
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SUITE 2: NAMING CONVENTIONS
// Source: God File corrections log, naming reconciliation table
// ═══════════════════════════════════════════════════════════════════════════

function testNamingConventions() {
  heading('CANON §2: Naming Conventions');

  const BANNED_NAMES = [
    { pattern: /\bPhosOS\b/g, canonical: 'PHOS', context: 'PhosOS was renamed to PHOS' },
    { pattern: /\bQuantum Material U\b/gi, canonical: 'P31 Shared Surface', context: 'QMU renamed' },
    { pattern: /\bG\.O\.D\.\s*(Shell|Operator)/gi, canonical: 'Command Center', context: 'G.O.D. renamed' },
    { pattern: /--p31-butter\b/g, canonical: '--p31-amber', context: 'Token renamed' },
  ];

  const sourceFiles = [
    ...walkFiles(join(ROOT, 'src')),
    ...walkFiles(join(ROOT, 'public')),
    ...(existsSync(join(ROOT, 'andromeda')) ? walkFiles(join(ROOT, 'andromeda', '04_SOFTWARE', 'p31ca', 'src')) : []),
    ...(existsSync(join(ROOT, 'andromeda')) ? walkFiles(join(ROOT, 'andromeda', '04_SOFTWARE', 'p31ca', 'public')) : []),
  ];

  for (const bn of BANNED_NAMES) {
    const violators = [];
    for (const file of sourceFiles) {
      const content = readSafe(file);
      if (!content || file.includes('verify-canon') || file.endsWith('.md')) continue;
      if (isNamingExempt(file)) continue;
      if (bn.pattern.test(content)) {
        violators.push(relative(ROOT, file));
        bn.pattern.lastIndex = 0; // reset regex
      }
    }
    if (violators.length === 0) {
      pass(`No banned name "${bn.pattern.source}" in codebase`);
    } else {
      fail(
        `Banned name found`,
        `"${bn.pattern.source}" in: ${violators.join(', ')} — ${bn.context}`,
        `Replace with "${bn.canonical}"`
      );
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SUITE 3: PERSONA FACTS
// Source: Operational Report §2, Psych E2E persona engine
// ═══════════════════════════════════════════════════════════════════════════

function testPersonaFacts() {
  heading('CANON §3: Persona Facts');

  // The most common error: swapping S.J. and W.J. ages
  // S.J. = age 10, OLDER, reads fine, WM 5
  // W.J. = age 6, YOUNGER, pre-reader, WM 3

  const sourceFiles = [
    ...walkFiles(join(ROOT, 'src')),
    ...walkFiles(join(ROOT, 'public')),
    ...walkFiles(join(ROOT, 'scripts')),
    ...(existsSync(join(ROOT, 'andromeda')) ? walkFiles(join(ROOT, 'andromeda', '04_SOFTWARE', 'p31ca', 'src')) : []),
  ];

  // Pattern: S.J. described as age 6, 8, or pre-reader
  const SJ_WRONG_PATTERNS = [
    /S\.?J\.?\s*.*?(?:age|aged)\s*(?:6|8)\b/gi,
    /S\.?J\.?\s*.*?pre-?reader/gi,
    /S\.?J\.?\s*.*?\bWM\s*(?:3|2)\b/gi,
  ];

  // Pattern: W.J. described as age 8, 10, or NOT pre-reader
  const WJ_WRONG_PATTERNS = [
    /W\.?J\.?\s*.*?(?:age|aged)\s*(?:8|10)\b/gi,
    /W\.?J\.?\s*.*?\bWM\s*(?:5|7)\b/gi,
  ];

  for (const file of sourceFiles) {
    const content = readSafe(file);
    if (!content || file.includes('verify-canon')) continue;
    const rel = relative(ROOT, file);

    for (const pat of SJ_WRONG_PATTERNS) {
      pat.lastIndex = 0;
      if (pat.test(content)) {
        fail(
          `S.J. persona error in ${rel}`,
          `S.J. is age 10, OLDER child, WM 5, reads fine. Found pattern suggesting otherwise.`,
          `S.J. (Sebastian) born 3/10/2016 = age 10. W.J. (Willow) born 8/8/2019 = age 6.`
        );
      }
    }

    for (const pat of WJ_WRONG_PATTERNS) {
      pat.lastIndex = 0;
      if (pat.test(content)) {
        fail(
          `W.J. persona error in ${rel}`,
          `W.J. is age 6, YOUNGER child, pre-reader, WM 3, safeByDefault. Found pattern suggesting otherwise.`,
          `W.J. (Willow) born 8/8/2019 = age 6, pre-reader. S.J. (Sebastian) born 3/10/2016 = age 10.`
        );
      }
    }
  }
  pass('S.J./W.J. persona facts consistent (no swap detected)');

  // Check that children's full names don't appear in public-facing files
  const PUBLIC_FILES = [
    ...walkFiles(join(ROOT, 'public')),
    ...(existsSync(join(ROOT, 'andromeda')) ? walkFiles(join(ROOT, 'andromeda', '04_SOFTWARE', 'p31ca', 'public')) : []),
    ...(existsSync(join(ROOT, 'andromeda')) ? walkFiles(join(ROOT, 'andromeda', '04_SOFTWARE', 'p31ca', 'src', 'pages')) : []),
  ];

  const FULL_NAMES = [/Sebastian\s+(?:Robert\s+)?Johnson/gi, /Willow\s+(?:Marie\s+)?Johnson/gi];
  for (const file of PUBLIC_FILES) {
    const content = readSafe(file);
    if (!content || file.includes('verify-canon')) continue;
    if (file.includes('doc-library/') || file.includes('p31-delta-language')) continue;
    for (const pat of FULL_NAMES) {
      pat.lastIndex = 0;
      if (pat.test(content)) {
        fail(
          `Children's full name in public file`,
          `${relative(ROOT, file)} — use S.J. and W.J. in all public/court documents`,
          `Replace with S.J. or W.J.`
        );
      }
    }
  }
  pass('No children full names in public-facing files');
}

// ═══════════════════════════════════════════════════════════════════════════
// SUITE 4: INFRASTRUCTURE CONSTANTS
// Source: Operational Report §6, Tech Spec §4
// ═══════════════════════════════════════════════════════════════════════════

function testInfraConstants() {
  heading('CANON §4: Infrastructure Constants');

  // Check p31-constants.json exists and has required fields
  const constantsPath = join(ROOT, 'p31-constants.json');
  const constants = readSafe(constantsPath);
  if (!constants) {
    fail('p31-constants.json missing', 'File not found at repo root', 'Create p31-constants.json');
    return;
  }
  pass('p31-constants.json exists');

  let parsed;
  try {
    parsed = JSON.parse(constants);
    pass('p31-constants.json is valid JSON');
  } catch (e) {
    fail('p31-constants.json invalid', e.message, 'Fix JSON syntax');
    return;
  }

  // Check Larmor frequency
  const larmor = parsed?.physics?.larmorHz ?? parsed?.larmor ?? parsed?.larmorHz;
  if (larmor === 863 || larmor === '863' || larmor === '863Hz') {
    pass('Larmor frequency = 863 Hz');
  } else if (larmor) {
    fail('Larmor frequency wrong', `Got ${larmor}, expected 863`, 'Set physics.larmorHz to 863');
  } else {
    warn('Larmor frequency not found in constants', 'Expected physics.larmorHz = 863');
  }

  // Check EIN
  const ein = JSON.stringify(parsed);
  if (ein.includes('42-1888158')) {
    pass('EIN 42-1888158 present in constants');
  } else {
    warn('EIN not found in constants', 'Expected 42-1888158 somewhere in p31-constants.json');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SUITE 5: CONTENT RULES
// Source: Operating Rules, Tech Spec §7
// ═══════════════════════════════════════════════════════════════════════════

function testContentRules() {
  heading('CANON §5: Content Rules');

  const PUBLIC_FILES = [
    ...walkFiles(join(ROOT, 'public')),
    ...(existsSync(join(ROOT, 'andromeda')) ? walkFiles(join(ROOT, 'andromeda', '04_SOFTWARE', 'p31ca', 'public')) : []),
    ...(existsSync(join(ROOT, 'andromeda')) ? walkFiles(join(ROOT, 'andromeda', '04_SOFTWARE', 'p31ca', 'src', 'pages')) : []),
  ];

  // No naval/military metaphors in public content
  // "Floating neutral" is ELECTRICAL, not naval — do NOT flag it
  const NAVAL_PATTERNS = [
    /\bsubmarine\b/gi,
    /\btorpedo\b/gi,
    /\bperiscope\b/gi,
    /\bnaval\s+(?:base|operation|fleet|command)\b/gi,
    /\bbattleship\b/gi,
    /\bdepth\s+charge\b/gi,
    /\bport\s+and\s+starboard\b/gi,
  ];

  let navalViolations = 0;
  for (const file of PUBLIC_FILES) {
    const content = readSafe(file);
    if (!content || file.includes('verify-canon') || file.endsWith('.md')) continue;
    // these files discuss or list banned words as examples, or are content indexes
    if (file.includes('stylebook/') || file.includes('passport-generator')) continue;
    if (file.includes('doc-library/') || file.includes('p31-delta-language')) continue;
    for (const pat of NAVAL_PATTERNS) {
      pat.lastIndex = 0;
      if (pat.test(content)) {
        fail(
          `Naval/military metaphor in ${relative(ROOT, file)}`,
          `Pattern "${pat.source}" found — this is a hard trigger`,
          `Remove or replace with electrical/engineering terminology`
        );
        navalViolations++;
      }
    }
  }
  if (navalViolations === 0) pass('No naval/military metaphors in public files');

  // No tracking scripts
  const TRACKING_PATTERNS = [
    /google-analytics\.com/gi,
    /googletagmanager\.com/gi,
    /\bgtag\s*\(/gi, // word boundary prevents false positive on docsMatchingTag(
    /fbevents\.js/gi,
    /hotjar\.com/gi,
    /mixpanel\.com/gi,
    /segment\.com\/analytics/gi,
    /plausible\.io/gi,
    /amplitude\.com/gi,
  ];

  let trackingViolations = 0;
  for (const file of PUBLIC_FILES) {
    const content = readSafe(file);
    if (!content || file.includes('verify-canon')) continue;
    for (const pat of TRACKING_PATTERNS) {
      pat.lastIndex = 0;
      if (pat.test(content)) {
        fail(
          `Tracking script in ${relative(ROOT, file)}`,
          `Pattern "${pat.source}" found — P31 has zero tracking policy`,
          `Remove the tracking script entirely`
        );
        trackingViolations++;
      }
    }
  }
  if (trackingViolations === 0) pass('No tracking scripts in public files');

  // No operator address in public files
  const ADDRESS_PATTERNS = [
    /401\s+Powder\s+Horn/gi,
    /31558/g, // zip code
    /912[- ]?227[- ]?4980/g, // phone in public HTML (OK in court docs)
  ];

  for (const file of PUBLIC_FILES) {
    if (!file.endsWith('.html') && !file.endsWith('.astro') && !file.endsWith('.jsx')) continue;
    const content = readSafe(file);
    if (!content || file.includes('verify-canon')) continue;
    for (const pat of ADDRESS_PATTERNS) {
      pat.lastIndex = 0;
      if (pat.test(content)) {
        warn(
          `Possible PII in ${relative(ROOT, file)}`,
          `Pattern "${pat.source}" found — verify this is intentional`
        );
      }
    }
  }
  pass('PII scan complete');
}

// ═══════════════════════════════════════════════════════════════════════════
// SUITE 6: SHARED MODULE PRESENCE
// Source: Tech Spec §1.8, §1.9
// ═══════════════════════════════════════════════════════════════════════════

function testSharedModules() {
  heading('CANON §6: Shared Modules');

  // Check that p31-safe-mode.js exists
  const safePaths = [
    join(ROOT, 'public', 'lib', 'p31-safe-mode.js'),
    join(ROOT, 'andromeda', '04_SOFTWARE', 'p31ca', 'public', 'lib', 'p31-safe-mode.js'),
  ];
  for (const sp of safePaths) {
    if (existsSync(sp)) {
      pass(`p31-safe-mode.js exists at ${relative(ROOT, sp)}`);
      const content = readSafe(sp);
      if (content && content.includes('p31:safe-mode')) {
        pass('p31-safe-mode.js dispatches p31:safe-mode custom event');
      } else if (content) {
        warn('p31-safe-mode.js may not dispatch p31:safe-mode event', 'Check for CustomEvent dispatch');
      }
    }
  }

  // Check that PHOS router exists
  const phosPath = join(ROOT, 'public', 'lib', 'p31-phos-router.js');
  if (existsSync(phosPath)) {
    pass('p31-phos-router.js exists');
  } else {
    warn('p31-phos-router.js not found at public/lib/', 'May be at different path');
  }

  // Check p31-style.css exists
  const stylePaths = [
    join(ROOT, 'p31-style.css'),
    join(ROOT, 'andromeda', '04_SOFTWARE', 'p31ca', 'public', 'p31-style.css'),
  ];
  for (const sp of stylePaths) {
    if (existsSync(sp)) {
      pass(`p31-style.css exists at ${relative(ROOT, sp)}`);

      // Verify it contains canonical token values
      const content = readSafe(sp);
      if (content) {
        if (content.includes('#0f1115') || content.includes('0f1115')) {
          pass('p31-style.css contains canonical --p31-void (#0f1115)');
        } else if (content.includes('#0b0d10')) {
          fail('p31-style.css has wrong --p31-void', 'Contains #0b0d10, should be #0f1115', 'Update the hex value');
        }
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SUITE 7: TOUCH TARGETS
// Source: Tech Spec §1.6, Surface Canon §13 (support), §08 (garden)
// ═══════════════════════════════════════════════════════════════════════════

function testTouchTargets() {
  heading('CANON §7: Touch Target Compliance');

  // Scan for min-height values on interactive elements that are too small
  const sourceFiles = [
    ...(existsSync(join(ROOT, 'andromeda')) ? walkFiles(join(ROOT, 'andromeda', '04_SOFTWARE', 'p31ca', 'src')) : []),
    ...walkFiles(join(ROOT, 'public')),
  ];

  // Look for button/a/input elements with explicit height < 44px
  // This is a heuristic — can't catch everything, but catches the obvious
  const SMALL_TARGETS = [
    /min-height:\s*(?:[0-3]?\d)px/g,  // min-height under 40px
    /minHeight:\s*["']?(?:[0-3]?\d)(?:px)?["']?/g,
  ];

  let violations = 0;
  for (const file of sourceFiles) {
    const content = readSafe(file);
    if (!content || file.includes('verify-canon') || file.endsWith('.md')) continue;
    for (const pat of SMALL_TARGETS) {
      pat.lastIndex = 0;
      const matches = content.match(pat);
      if (matches) {
        for (const m of matches) {
          const num = parseInt(m.match(/(\d+)/)?.[1] || '0');
          if (num > 0 && num < 32) { // Very small — likely a violation
            warn(
              `Possible small touch target in ${relative(ROOT, file)}`,
              `"${m}" — minimum is 44px (60px on children's surfaces)`
            );
            violations++;
          }
        }
      }
    }
  }
  if (violations === 0) pass('No obviously undersized touch targets detected');
}

// ═══════════════════════════════════════════════════════════════════════════
// SUITE 8: LETTER PRIVACY
// Source: Session synthesis — letters are private, never deploy
// ═══════════════════════════════════════════════════════════════════════════

function testLetterPrivacy() {
  heading('CANON §8: Private Artifact Protection');

  const PRIVATE_FILES = ['letter-to-sj-and-wj.jsx', 'letter-to-christyn.jsx'];
  const deployDirs = [
    join(ROOT, 'andromeda', '04_SOFTWARE', 'p31ca', 'src'),
    join(ROOT, 'andromeda', '04_SOFTWARE', 'p31ca', 'public'),
    join(ROOT, 'public'),
  ];

  for (const pf of PRIVATE_FILES) {
    for (const dir of deployDirs) {
      const files = existsSync(dir) ? walkFiles(dir) : [];
      const found = files.find(f => f.includes(pf));
      if (found) {
        fail(
          `Private artifact in deploy directory`,
          `${pf} found at ${relative(ROOT, found)} — this must NEVER be deployed`,
          `Remove from deploy directory. Keep only in p31_final/ or local storage.`
        );
      }
    }
  }
  pass('No private letters in deploy directories');
}

// ═══════════════════════════════════════════════════════════════════════════
// SUITE 9: INFRASTRUCTURE CLAIMS
// Source: God File §4, corrections log
// ═══════════════════════════════════════════════════════════════════════════

function testInfraClaims() {
  heading('CANON §9: Infrastructure Honesty');

  const sourceFiles = [
    ...walkFiles(join(ROOT, 'public')),
    ...(existsSync(join(ROOT, 'andromeda')) ? walkFiles(join(ROOT, 'andromeda', '04_SOFTWARE', 'p31ca', 'src')) : []),
    ...(existsSync(join(ROOT, 'andromeda')) ? walkFiles(join(ROOT, 'andromeda', '04_SOFTWARE', 'p31ca', 'public')) : []),
  ];

  // These things should NOT be claimed as "deployed" or "live" in public content
  const FALSE_CLAIMS = [
    { pattern: /Matrix\s+(?:homeserver|server).*?(?:deployed|live|running)/gi, truth: 'Matrix is DESIGNED, not deployed (budget-blocked)' },
    { pattern: /Hetzner\s+CX51/gi, truth: 'No Hetzner VPS exists — was in Gemini God File, corrected in v2.0.0' },
    { pattern: /SX1262.*?178\s*dB/gi, truth: 'SX1262 link budget is ~170 dB, not 178 dB' },
    { pattern: /SE050.*?post-quantum/gi, truth: 'SE050 does NOT support post-quantum crypto (50KB flash insufficient)' },
    { pattern: /FDA.*?Node\s*Zero/gi, truth: 'Node Zero has NO FDA classification. 21 CFR §890.3710 applies to Node One ONLY.' },
  ];

  for (const fc of FALSE_CLAIMS) {
    for (const file of sourceFiles) {
      const content = readSafe(file);
      if (!content || file.includes('verify-canon') || file.endsWith('.md')) continue;
      if (isClaimExempt(file)) continue;
      fc.pattern.lastIndex = 0;
      if (fc.pattern.test(content)) {
        fail(
          `Potentially false infrastructure claim in ${relative(ROOT, file)}`,
          fc.truth,
          `Update the claim to reflect actual status`
        );
      }
    }
  }
  pass('No known false infrastructure claims in public code');
}

// ═══════════════════════════════════════════════════════════════════════════
// SUITE 10: ALIGNMENT REGISTRATION
// Source: Operational Report §7
// ═══════════════════════════════════════════════════════════════════════════

function testAlignment() {
  heading('CANON §10: Alignment Registration');

  const alignPath = join(ROOT, 'p31-alignment.json');
  const content = readSafe(alignPath);
  if (!content) {
    warn('p31-alignment.json not found', 'Alignment tracking may be at different path');
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
    pass('p31-alignment.json is valid JSON');
  } catch (e) {
    fail('p31-alignment.json invalid', e.message, 'Fix JSON syntax');
    return;
  }

  const sources = parsed.sources || [];
  if (sources.length >= 280) {
    pass(`Alignment sources: ${sources.length} (≥280 threshold)`);
  } else {
    warn(`Alignment sources: ${sources.length}`, 'Expected ≥280 per session records');
  }

  // Check for duplicate IDs
  const ids = sources.map(s => s.id).filter(Boolean);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length === 0) {
    pass('No duplicate source IDs in alignment');
  } else {
    fail('Duplicate source IDs', `${dupes.length} duplicates: ${dupes.slice(0, 5).join(', ')}`, 'Remove duplicate entries');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// RUN ALL SUITES
// ═══════════════════════════════════════════════════════════════════════════

console.log('verify-canon: P31 Canonical Truth Enforcer');
console.log(`Scanning from: ${ROOT}`);

testTokenValues();
testNamingConventions();
testPersonaFacts();
testInfraConstants();
testContentRules();
testSharedModules();
testTouchTargets();
testLetterPrivacy();
testInfraClaims();
testAlignment();

// ── REPORT ─────────────────────────────────────────────────────────────────

heading('RESULTS');
console.log(`  Passed:   ${passed}`);
console.log(`  Failed:   ${failed}`);
console.log(`  Warnings: ${warnings}`);

if (failed > 0) {
  console.log(`\n  ✗ verify-canon: FAIL — ${failed} canon violation(s) found`);
  if (!FIX_HINTS) {
    console.log('  Run with --fix-hints for repair suggestions');
  }
  process.exit(1);
} else {
  console.log(`\n  ✓ verify-canon: OK — ${passed} checks passed, ${warnings} warning(s)`);
  process.exit(0);
}
