#!/usr/bin/env node
/**
 * verify-license-headers.mjs — PEER-1J (CWP-P31-PEER-COMP-2026-05).
 *
 * Walks the home tree, classifies tracked source files under the rules in
 * docs/LICENSE-POLICY.md, and reports:
 *   - Missing header  (warning, does not fail in v1)
 *   - Wrong header    (error, fails the gate — file claims a license that
 *                     conflicts with the policy and is not on the named
 *                     exception list)
 *   - Unknown ext     (info, logged for review)
 *
 * v1 posture is intentionally permissive. Strict mode comes after a header
 * sweep in Phase 2. The verifier exists today so that:
 *   1. We can never silently drift away from the policy.
 *   2. New contributors see a real check on their PRs.
 *   3. The number of un-headered files is visible and shrinkable.
 *
 * Use `npm run verify:license-headers -- --strict` to fail on missing headers
 * (will be the default once the sweep lands).
 *
 * Use `--verbose` to print one line per checked file.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const STRICT = process.argv.includes("--strict") || process.env.P31_LICENSE_STRICT === "1";
const VERBOSE = process.argv.includes("--verbose");

// ----- Policy ----------------------------------------------------------------

// Recognized SPDX identifiers that are acceptable per LICENSE-POLICY.md.
const ACCEPTED = new Set([
  "MIT",
  "MIT-0",
  "CC0-1.0",
  "CC-BY-4.0",
  "CC-BY-SA-4.0",
  "MPL-2.0",
  "Apache-2.0", // common in transitive vendored libs
  "BSD-2-Clause",
  "BSD-3-Clause",
  "ISC", // common in ecosystem
]);

// Default license for the home repo (per LICENSE-POLICY.md §1).
const DEFAULT_LICENSE = "MIT";

// Path globs that opt into a non-default license per LICENSE-POLICY.md §3.
const EXPECTED_BY_PATH = [
  // CC0 — schemas and persona prompts
  { match: /\/cognitive-passport\/.*\.schema\.json$/i, expected: "CC0-1.0" },
  { match: /\/cognitive-passport-v.*\.schema\.json$/i, expected: "CC0-1.0" },
  { match: /\/scripts\/p31-fleet-ten\/prompts\/.*\.txt$/i, expected: "CC0-1.0" },
  // CC BY 4.0 — Code of Conduct (Contributor Covenant adaptation)
  { match: /\/docs\/CODE-OF-CONDUCT\.md$/i, expected: "CC-BY-4.0" },
  // CC BY-SA 4.0 — prose docs (Manifesto, Roadmap, etc.) — but Markdown is exempt by default
  { match: /\/docs\/.*\.md$/i, expected: null /* exempt class */ },
];

// Directories whose contents are exempt from the gate entirely.
const EXEMPT_DIR = [
  /\/node_modules\//,
  /\/dist\//,
  /\/build\//,
  /\/\.cache\//,
  /\/\.git\//,
  /\/coverage\//,
  /\/\.next\//,
  /\/\.astro\//,
  /\/vendor\//i,
  /\/third_?party\//i,
  /\/external\//i,
  /\/__fixtures__\//,
  /\/fixtures\//,
  /\/test-data\//,
  /\/test-corpus\//,
  /\/\.cursor\//,
  /\/andromeda\//, // separate repo with its own policy
  /\/phosphorus31\.org\//, // separate tree
  /\/Discovery\/\.venv\//,
  /\/wcd33-global-archive\//,
  /\/p31ca\//,
];

// Filename / extension classes that are exempt entirely.
const EXEMPT_FILE = [
  /^LICENSE(\..+)?$/,
  /^LICENSE-MIT$/,
  /^README\.md$/i,
  /^CHANGELOG\.md$/i,
  /^AGENTS\.md$/i,
  /^CLAUDE\.md$/i,
  /^\.cursorrules$/,
  /^\.gitignore$/,
  /^\.gitattributes$/,
  /^\.npmrc$/,
  /^\.editorconfig$/,
  /^\.env(\..+)?$/,
  /^\.nvmrc$/,
  /^\.prettierrc$/,
  /^\.prettierignore$/,
  /^tsconfig.*\.json$/i,
  /^package(-lock)?\.json$/,
  /^pnpm-lock\.yaml$/,
  /^yarn\.lock$/,
  /^Cargo\.lock$/,
  /^.*\.generated\.(js|mjs|ts|json|html|css)$/i,
  /^.*-vendored\..*$/i,
  /^docs\/security\/HALL-OF-FAME\.md$/i, // header table
  /^docs\/security\/advisories\/_template\.md$/i,
  /^.*\.png$/i,
  /^.*\.jpg$/i,
  /^.*\.jpeg$/i,
  /^.*\.webp$/i,
  /^.*\.gif$/i,
  /^.*\.ico$/i,
  /^.*\.svg$/i, // optional XML comment header — not required
  /^.*\.pdf$/i,
  /^.*\.woff2?$/i,
  /^.*\.ttf$/i,
  /^.*\.otf$/i,
  /^.*\.eot$/i,
  /^.*\.zip$/i,
  /^.*\.tar(\.gz)?$/i,
  /^.*\.wasm$/i,
];

// File extensions we consider "source" (subject to the missing-header warning).
const SOURCE_EXT = new Set([
  ".js",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".jsx",
  ".py",
  ".rs",
  ".go",
  ".astro",
  ".css",
  ".html", // hub static pages — header optional but allowed
]);

// Markdown is exempt by class (prose license is named in §3.4).

// ----- File listing ----------------------------------------------------------

function listFiles() {
  // Use `git ls-files` so we honor .gitignore and only see tracked files.
  const res = spawnSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
    cwd: root,
    encoding: "utf8",
  });
  if (res.status !== 0) {
    console.error("verify-license-headers: git ls-files failed:", res.stderr.slice(0, 400));
    process.exit(2);
  }
  return res.stdout.split("\n").filter(Boolean);
}

function isExemptDir(rel) {
  const slashed = "/" + rel;
  return EXEMPT_DIR.some((re) => re.test(slashed));
}

function isExemptFile(rel) {
  const base = path.basename(rel);
  if (EXEMPT_FILE.some((re) => re.test(base))) return true;
  // also: any markdown not inside docs/security/advisories/ is class-exempt
  if (rel.endsWith(".md")) return true;
  return false;
}

function expectedFor(rel) {
  const slashed = "/" + rel;
  for (const rule of EXPECTED_BY_PATH) {
    if (rule.match.test(slashed)) return rule.expected;
  }
  return DEFAULT_LICENSE;
}

function detectHeader(content) {
  // Look in first 30 lines or first 2KB, whichever is smaller.
  const head = content.slice(0, 2048);
  const m = head.match(/SPDX-License-Identifier:\s*([A-Za-z0-9.\-+_]+)/);
  if (m) return m[1];
  // JSON files: also check for a top-level $comment with SPDX text.
  if (/^[\s\n]*\{/.test(content)) {
    const j = head.match(/SPDX-License-Identifier:\s*([A-Za-z0-9.\-+_]+)/);
    if (j) return j[1];
  }
  return null;
}

// ----- Main ------------------------------------------------------------------

function main() {
  const files = listFiles();
  let checked = 0;
  let missing = 0;
  let conflicts = [];
  let unknown = 0;
  const missingList = [];

  for (const rel of files) {
    if (isExemptDir(rel)) continue;
    if (isExemptFile(rel)) continue;

    const ext = path.extname(rel).toLowerCase();

    const expected = expectedFor(rel);
    if (expected === null) continue; // exempt class via path rule

    if (!SOURCE_EXT.has(ext) && !rel.endsWith(".json")) {
      unknown++;
      if (VERBOSE) console.log("  unknown-ext:", rel);
      continue;
    }

    let content;
    try {
      content = fs.readFileSync(path.join(root, rel), "utf8");
    } catch {
      continue;
    }
    checked++;

    const found = detectHeader(content);
    if (!found) {
      missing++;
      if (missingList.length < 30) missingList.push(rel);
      if (VERBOSE) console.log("  missing-header:", rel, "(expected " + expected + ")");
      continue;
    }
    if (!ACCEPTED.has(found)) {
      conflicts.push({ rel, found, expected, why: "unrecognized SPDX id" });
      continue;
    }
    if (found !== expected) {
      conflicts.push({ rel, found, expected, why: "differs from policy default for this path" });
      continue;
    }
    if (VERBOSE) console.log("  ok:", rel, "(" + found + ")");
  }

  console.log(
    `verify-license-headers: scanned ${checked} source files (${unknown} unknown-ext skipped).`
  );

  if (conflicts.length > 0) {
    console.error("verify-license-headers: FAIL — header CONFLICTS detected:");
    for (const c of conflicts) {
      console.error(`  ${c.rel}: found "${c.found}", expected "${c.expected}" — ${c.why}`);
    }
    console.error("Resolve by editing the file header or by adding an exception to docs/LICENSE-POLICY.md §3.");
    process.exit(1);
  }

  if (missing > 0) {
    const head = missingList.slice(0, 10).join("\n  ");
    if (STRICT) {
      console.error(`verify-license-headers: FAIL (strict) — ${missing} file(s) missing header:`);
      console.error("  " + head);
      if (missing > 10) console.error(`  …and ${missing - 10} more`);
      console.error(
        'Add `SPDX-License-Identifier: ' +
          DEFAULT_LICENSE +
          '` to the top of each, or rerun without --strict.'
      );
      process.exit(1);
    }
    console.warn(`verify-license-headers: WARN — ${missing} file(s) missing header (run with --strict to fail).`);
    if (VERBOSE) console.warn("  " + head);
  }

  console.log("verify-license-headers: OK — no policy conflicts.");
}

main();
