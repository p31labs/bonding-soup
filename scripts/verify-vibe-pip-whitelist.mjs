#!/usr/bin/env node
/**
 * verify-vibe-pip-whitelist.mjs
 *
 * P31 PiP CLI substrate ↔ command-center whitelist gate.
 * Phase: VIBE-2D of `docs/CWP-P31-VIBE-2026-06.md` §8 (extended in §20).
 *
 * Two contracts in one run — both name-and-shame on drift:
 *
 *   Contract 1 — COMMANDS ⊆ ACTIONS
 *     The PiP CLI substrate (`command-center-terminal.html`) renders a
 *     `COMMANDS` array of clickable cards. Each card POSTs `{ action: c.key }`
 *     to /api/run, validated against `ACTIONS` from
 *     `scripts/command-center/actions.registry.mjs` (server-side execFile
 *     whitelist). Every `key` MUST exist as an ACTIONS key, otherwise the
 *     card is dead-on-click ("bad action" 400).
 *
 *   Contract 2 — VIEW_SLUGS ≡ DOC_SLUG_ALLOWLIST
 *     The substrate's `view` mode-tab (VIBE-3H §18) renders a `<select>`
 *     populated from the `VIEW_SLUGS` array. Each option's `slug` POSTs to
 *     /api/view-doc?slug=<slug>, gated by `DOC_SLUG_ALLOWLIST` inside
 *     `scripts/p31-local-command-center.mjs`. The two MUST be set-equal —
 *     a substrate-only slug is dead-on-pick (403 not allowlisted), and a
 *     server-only slug is invisible to the operator (no UI affordance).
 *
 * The substrate is the authoritative consumer in both cases: drift is a
 * substrate bug to fix (rename / extend), not a verifier weakness.
 *
 * Skip behaviour: if `command-center-terminal.html`,
 * `scripts/p31-local-command-center.mjs`, or the actions registry is absent
 * (partial clone), exit 0 with a skip notice.
 */

import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HOME_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const TERMINAL_HTML = join(HOME_ROOT, "command-center-terminal.html");
const REGISTRY = join(HOME_ROOT, "scripts/command-center/actions.registry.mjs");
const SERVER_MJS = join(HOME_ROOT, "scripts/p31-local-command-center.mjs");

if (!existsSync(TERMINAL_HTML)) {
  console.log("verify-vibe-pip-whitelist: skip — command-center-terminal.html not present (partial clone)");
  process.exit(0);
}
if (!existsSync(REGISTRY)) {
  console.log("verify-vibe-pip-whitelist: skip — actions.registry.mjs not present (partial clone)");
  process.exit(0);
}
if (!existsSync(SERVER_MJS)) {
  console.log("verify-vibe-pip-whitelist: skip — p31-local-command-center.mjs not present (partial clone)");
  process.exit(0);
}

const html = readFileSync(TERMINAL_HTML, "utf8");
const serverSrc = readFileSync(SERVER_MJS, "utf8");

// ---------------------------------------------------------------------------
// Contract 1 — COMMANDS[].key ⊆ Object.keys(ACTIONS)
// ---------------------------------------------------------------------------
const cmdMatch = html.match(/const\s+COMMANDS\s*=\s*\[([\s\S]*?)\];/);
if (!cmdMatch) {
  console.error("verify-vibe-pip-whitelist: FAIL — could not locate `const COMMANDS = [...]` in command-center-terminal.html");
  process.exit(1);
}
const cmdBody = cmdMatch[1];
const keyRe = /key\s*:\s*"([^"]+)"/g;
const substrateKeys = [];
let km;
while ((km = keyRe.exec(cmdBody)) !== null) substrateKeys.push(km[1]);

if (substrateKeys.length === 0) {
  console.error("verify-vibe-pip-whitelist: FAIL — COMMANDS array parsed but yielded zero `key` entries (regex / source drift)");
  process.exit(1);
}

const { ACTIONS } = await import(REGISTRY);
const allowedActions = new Set(Object.keys(ACTIONS));

const cmdDrift = substrateKeys.filter((k) => !allowedActions.has(k));
if (cmdDrift.length > 0) {
  console.error(`verify-vibe-pip-whitelist: FAIL — Contract 1 drift: [${cmdDrift.join(", ")}]`);
  console.error("");
  console.error(`  substrate: command-center-terminal.html (COMMANDS[].key, ${substrateKeys.length} entries)`);
  console.error(`  whitelist: scripts/command-center/actions.registry.mjs (ACTIONS, ${allowedActions.size} entries)`);
  console.error(`  flow:      terminal POSTs { action: c.key } → /api/run validates ACTIONS[id]`);
  console.error("");
  console.error("  Each drift key above is dead-on-click in the PiP CLI today (400 'bad action').");
  console.error("  Resolution paths (do not modify command-center-terminal.html or p31-local-command-center.mjs):");
  console.error("    1. Add the missing entries to ACTIONS in scripts/command-center/actions.registry.mjs.");
  console.error("    2. OR retitle COMMANDS[].key in the substrate so it matches an existing action ID.");
  console.error("");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Contract 2 — VIEW_SLUGS[].slug ≡ Object.keys(DOC_SLUG_ALLOWLIST)
// ---------------------------------------------------------------------------
const viewMatch = html.match(/const\s+VIEW_SLUGS\s*=\s*\[([\s\S]*?)\];/);
if (!viewMatch) {
  console.error("verify-vibe-pip-whitelist: FAIL — could not locate `const VIEW_SLUGS = [...]` in command-center-terminal.html");
  process.exit(1);
}
const viewBody = viewMatch[1];
const slugRe = /slug\s*:\s*"([^"]+)"/g;
const substrateSlugs = [];
let sm;
while ((sm = slugRe.exec(viewBody)) !== null) substrateSlugs.push(sm[1]);

if (substrateSlugs.length === 0) {
  console.error("verify-vibe-pip-whitelist: FAIL — VIEW_SLUGS array parsed but yielded zero `slug` entries (regex / source drift)");
  process.exit(1);
}

const allowMatch = serverSrc.match(/const\s+DOC_SLUG_ALLOWLIST\s*=\s*\{([\s\S]*?)\};/);
if (!allowMatch) {
  console.error("verify-vibe-pip-whitelist: FAIL — could not locate `const DOC_SLUG_ALLOWLIST = {…}` in scripts/p31-local-command-center.mjs");
  process.exit(1);
}
const allowBody = allowMatch[1];
// Accept both quoted ("boot-up": …) and unquoted (manifesto: …) keys, anchored
// to a fresh line/comma so we don't pick up inline string values.
const allowKeyRe = /(?:^|,|\{)\s*(?:"([^"]+)"|([A-Za-z_][\w-]*))\s*:/g;
const serverSlugs = [];
let am;
while ((am = allowKeyRe.exec(allowBody)) !== null) {
  serverSlugs.push(am[1] ?? am[2]);
}

if (serverSlugs.length === 0) {
  console.error("verify-vibe-pip-whitelist: FAIL — DOC_SLUG_ALLOWLIST parsed but yielded zero keys (regex / source drift)");
  process.exit(1);
}

const substrateSet = new Set(substrateSlugs);
const serverSet = new Set(serverSlugs);
const substrateOnly = [...substrateSet].filter((s) => !serverSet.has(s));
const serverOnly = [...serverSet].filter((s) => !substrateSet.has(s));

if (substrateOnly.length > 0 || serverOnly.length > 0) {
  console.error("verify-vibe-pip-whitelist: FAIL — Contract 2 drift (VIEW_SLUGS ⟷ DOC_SLUG_ALLOWLIST not symmetric)");
  console.error("");
  console.error(`  substrate-only: [${substrateOnly.join(", ") || "(none)"}]  → dead-on-pick (403 not allowlisted)`);
  console.error(`  server-only:    [${serverOnly.join(", ") || "(none)"}]  → invisible (no UI affordance)`);
  console.error("");
  console.error(`  substrate: command-center-terminal.html (VIEW_SLUGS[].slug, ${substrateSlugs.length} entries)`);
  console.error(`  whitelist: scripts/p31-local-command-center.mjs (DOC_SLUG_ALLOWLIST, ${serverSlugs.length} entries)`);
  console.error(`  flow:      terminal GETs /api/view-doc?slug=<slug> → server validates DOC_SLUG_ALLOWLIST[slug]`);
  console.error("");
  console.error("  Resolution paths:");
  console.error("    1. Add the missing entries to DOC_SLUG_ALLOWLIST in scripts/p31-local-command-center.mjs (and ensure the doc path exists).");
  console.error("    2. OR add/remove the VIEW_SLUGS entry in command-center-terminal.html so the two sides match.");
  console.error("");
  process.exit(1);
}

console.log(
  `verify-vibe-pip-whitelist: OK — ${substrateKeys.length} substrate commands, ${substrateSlugs.length} view slugs, all in sync`
);
process.exit(0);
