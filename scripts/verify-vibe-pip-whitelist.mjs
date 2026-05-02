#!/usr/bin/env node
/**
 * verify-vibe-pip-whitelist.mjs
 *
 * P31 PiP CLI substrate ↔ command-center whitelist gate.
 * Phase: VIBE-2D of `docs/CWP-P31-VIBE-2026-06.md` §8.
 *
 * Contract:
 *   The PiP CLI substrate (`command-center-terminal.html`, served at
 *   :3131/term + /terminal + /vibe) renders a `COMMANDS` array of clickable
 *   cards. Each card POSTs `{ action: c.key }` to /api/run, which validates
 *   `id` against `ACTIONS` from `scripts/command-center/actions.registry.mjs`
 *   (the canonical execFile whitelist; see `scripts/p31-local-command-center.mjs`
 *   line ~1289 — `if (!id || !ACTIONS[id])`).
 *
 *   Therefore every entry's `key` field MUST exist as a key in ACTIONS,
 *   otherwise the card is dead-on-click ("bad action" 400). This gate
 *   asserts that invariant so future edits to either side cannot silently
 *   drift the substrate's runnable surface.
 *
 *   The substrate is the authoritative consumer: any drift is a substrate
 *   bug to fix (either retitle the COMMANDS key to a registered action ID
 *   or extend ACTIONS), not a verifier weakness.
 *
 * Skip behaviour: if `command-center-terminal.html` is absent (partial
 * clone), exit 0 with a skip notice. The actions registry import is wrapped
 * for the same reason.
 */

import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HOME_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const TERMINAL_HTML = join(HOME_ROOT, "command-center-terminal.html");
const REGISTRY = join(HOME_ROOT, "scripts/command-center/actions.registry.mjs");

if (!existsSync(TERMINAL_HTML)) {
  console.log("verify-vibe-pip-whitelist: skip — command-center-terminal.html not present (partial clone)");
  process.exit(0);
}
if (!existsSync(REGISTRY)) {
  console.log("verify-vibe-pip-whitelist: skip — actions.registry.mjs not present (partial clone)");
  process.exit(0);
}

const html = readFileSync(TERMINAL_HTML, "utf8");

// Locate `const COMMANDS = [ … ];` in the embedded <script> block. The array
// is plain object literals; we extract every `key: "…"` value inside it.
const arrMatch = html.match(/const\s+COMMANDS\s*=\s*\[([\s\S]*?)\];/);
if (!arrMatch) {
  console.error("verify-vibe-pip-whitelist: FAIL — could not locate `const COMMANDS = [...]` in command-center-terminal.html");
  process.exit(1);
}
const body = arrMatch[1];
const keyRe = /key\s*:\s*"([^"]+)"/g;
const substrateKeys = [];
let m;
while ((m = keyRe.exec(body)) !== null) substrateKeys.push(m[1]);

if (substrateKeys.length === 0) {
  console.error("verify-vibe-pip-whitelist: FAIL — COMMANDS array parsed but yielded zero `key` entries (regex / source drift)");
  process.exit(1);
}

const { ACTIONS } = await import(REGISTRY);
const allowed = new Set(Object.keys(ACTIONS));

const drift = substrateKeys.filter((k) => !allowed.has(k));

if (drift.length === 0) {
  console.log(
    `verify-vibe-pip-whitelist: OK — ${substrateKeys.length} substrate commands, all in actions registry`
  );
  process.exit(0);
}

console.error(`verify-vibe-pip-whitelist: FAIL — drift: [${drift.join(", ")}]`);
console.error("");
console.error(`  substrate: command-center-terminal.html (COMMANDS[].key, ${substrateKeys.length} entries)`);
console.error(`  whitelist: scripts/command-center/actions.registry.mjs (ACTIONS, ${allowed.size} entries)`);
console.error(`  flow:      terminal POSTs { action: c.key } → /api/run validates ACTIONS[id]`);
console.error("");
console.error("  Each drift key above is dead-on-click in the PiP CLI today (400 'bad action').");
console.error("  Resolution paths (do not modify command-center-terminal.html or p31-local-command-center.mjs):");
console.error("    1. Add the missing entries to ACTIONS in scripts/command-center/actions.registry.mjs.");
console.error("    2. OR retitle COMMANDS[].key in the substrate so it matches an existing action ID.");
console.error("");
process.exit(1);
