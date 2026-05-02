#!/usr/bin/env node
/**
 * verify-phos-voice.mjs — ship-bar gate for the PHOS voice pipeline.
 *
 * Runs five checks (in order, fast-fail):
 *
 *   1. Build is in sync (drift detection).
 *      Re-runs scripts/build-phos-voice-json.mjs --check; fails if the on-disk
 *      JSON does not match what would be emitted from PHOS-VOICE-DRAFT.md §4.
 *      This means: never edit the JSON directly; always edit §4 and run
 *      `npm run build:phos-voice`.
 *
 *   2. Schema shape.
 *      Every slot has _tag, greeting, hint, fallback, links. Every link has
 *      string label + string href. _tag is OPERATOR-VOICE or DRAFT-AGENT-SIMULATED.
 *
 *   3. Tier-0 vocabulary discipline (PHOS-VOICE-DRAFT §2.12).
 *      Banned: K₄, Posner, synergetics, jitterbug, Larmor, isostatic,
 *      sovereignty, tetrahedral, decoherence, naval/military/submarine words.
 *      Banned patterns: "Don't miss", "Only today", "Epic", "Beat everyone",
 *      "Prove you're a real fan", any manufactured urgency.
 *      Scans greeting + hint + fallback + every link.label.
 *      Scope: stranger-facing fields only (since we cannot know reader's CogPass
 *      preferredTone at build time, we apply Tier-0 to all slots).
 *
 *   4. OPERATOR-VOICE preservation (SHA lock).
 *      For every slot tagged OPERATOR-VOICE, computes SHA-256 of the canonical
 *      content (greeting + hint + fallback + JSON-stringified links). Compares
 *      to docs/PHOS-VOICE-DRAFT.lock.json. If a SHA differs, an agent has
 *      modified an OPERATOR-VOICE slot and must update the lock file in the
 *      same commit (which makes the change reviewable in the diff). Bootstrap:
 *      missing slots in the lock file are auto-suggested with `--update-lock`.
 *
 *   5. Slot coverage vs busBar.slots in ground-truth.
 *      Every busBar.slots key SHOULD have a voice entry (warning, not failure;
 *      _default catches missing slots at runtime). Missing entries print a
 *      "warning: no voice entry for slot \`/foo\`" diagnostic.
 *
 * Sample output (success):
 *   verify-phos-voice: OK
 *     drift check       PHOS-VOICE-DRAFT.md §4 ≡ p31-phos-voice.json
 *     schema            13 slots (1 OPERATOR-VOICE · 12 DRAFT-AGENT-SIMULATED)
 *     vocabulary        clean (Tier-0)
 *     OPERATOR-VOICE    1 SHA verified (PHOS-VOICE-DRAFT.lock.json)
 *     busBar coverage   11/11 slots covered
 *
 * CLI:
 *   node scripts/verify-phos-voice.mjs               — verify
 *   node scripts/verify-phos-voice.mjs --update-lock — write SHAs to lock file
 *                                                       (for new OPERATOR-VOICE
 *                                                        promotions; review the
 *                                                        diff before committing)
 */

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const VOICE_JSON = path.join(
  root,
  "andromeda/04_SOFTWARE/p31ca/public/lib/p31-phos-voice.json",
);
const LOCK = path.join(root, "docs/PHOS-VOICE-DRAFT.lock.json");
const GROUND_TRUTH = path.join(
  root,
  "andromeda/04_SOFTWARE/p31ca/ground-truth/p31.ground-truth.json",
);

const BANNED_WORDS = [
  // Operator-internal vocabulary (per §2.12)
  "K₄",
  "Posner",
  "synergetics",
  "jitterbug",
  "Larmor",
  "isostatic",
  "sovereignty",
  "tetrahedral",
  "decoherence",
  // Naval/military (per §2.14)
  "submarine",
  "periscope",
  "torpedo",
  "admiral",
  "frigate",
  "destroyer",
  "captain's log",
  "battle stations",
];

const BANNED_PATTERNS = [
  /don['']t miss/i,
  /only today/i,
  /\bepic\b/i,
  /beat everyone/i,
  /prove you['']re a real fan/i,
  /act now/i,
  /limited time/i,
  /\blast chance\b/i,
];

const VALID_TAGS = new Set(["OPERATOR-VOICE", "DRAFT-AGENT-SIMULATED"]);

const args = new Set(process.argv.slice(2));
const UPDATE_LOCK = args.has("--update-lock");

function die(msg) {
  console.error("verify-phos-voice: FAIL —", msg);
  process.exit(1);
}

function pass(line) {
  console.log("  " + line);
}

function warn(line) {
  console.warn("  warning: " + line);
}

function sha256Hex(s) {
  return createHash("sha256").update(s, "utf8").digest("hex");
}

function canonicalText(slot) {
  // Hash a stable representation: ordered fields, JSON-encoded values.
  return [
    slot.greeting,
    slot.hint,
    slot.fallback,
    JSON.stringify(slot.links),
  ].join("\n---\n");
}

function main() {
  // 0. Existence / partial-clone skip
  if (!fs.existsSync(VOICE_JSON)) {
    console.log(
      "verify-phos-voice: skip — no andromeda/p31ca tree (partial clone)",
    );
    process.exit(0);
  }

  // 1. Drift check (re-run build with --check)
  const driftResult = spawnSync(
    process.execPath,
    [path.join(__dirname, "build-phos-voice-json.mjs"), "--check"],
    { encoding: "utf8" },
  );
  if (driftResult.status !== 0) {
    process.stderr.write(driftResult.stderr || "");
    die(
      "build is out of sync — PHOS-VOICE-DRAFT.md §4 differs from p31-phos-voice.json. Run `npm run build:phos-voice` to regenerate.",
    );
  }

  // 2. Schema shape
  let voice;
  try {
    voice = JSON.parse(fs.readFileSync(VOICE_JSON, "utf8"));
  } catch (e) {
    die(`could not parse p31-phos-voice.json: ${e.message}`);
  }
  const meta = voice._meta;
  if (!meta || meta.schema !== "p31.phosVoice/1.0.0") {
    die(`missing or wrong _meta.schema (expected "p31.phosVoice/1.0.0")`);
  }
  const slotKeys = Object.keys(voice).filter((k) => !k.startsWith("_meta"));
  if (slotKeys.length === 0) die("no slots emitted");
  let opCount = 0;
  let draftCount = 0;
  for (const slotKey of slotKeys) {
    const slot = voice[slotKey];
    if (!slot || typeof slot !== "object") die(`slot \`${slotKey}\` is not an object`);
    if (!VALID_TAGS.has(slot._tag))
      die(`slot \`${slotKey}\` has invalid _tag: ${slot._tag}`);
    if (typeof slot.greeting !== "string")
      die(`slot \`${slotKey}\`.greeting is not a string`);
    if (typeof slot.hint !== "string")
      die(`slot \`${slotKey}\`.hint is not a string`);
    if (typeof slot.fallback !== "string")
      die(`slot \`${slotKey}\`.fallback is not a string`);
    if (!Array.isArray(slot.links))
      die(`slot \`${slotKey}\`.links is not an array`);
    for (const link of slot.links) {
      if (
        !link ||
        typeof link.label !== "string" ||
        typeof link.href !== "string"
      ) {
        die(
          `slot \`${slotKey}\`.links has malformed entry: ${JSON.stringify(link)}`,
        );
      }
    }
    if (slot._tag === "OPERATOR-VOICE") opCount += 1;
    else draftCount += 1;
  }

  // 3. Vocabulary discipline (Tier-0 across all slots)
  const violations = [];
  for (const slotKey of slotKeys) {
    const slot = voice[slotKey];
    const surfaces = [
      ["greeting", slot.greeting],
      ["hint", slot.hint],
      ["fallback", slot.fallback],
      ...slot.links.map((link, i) => [`links[${i}].label`, link.label]),
    ];
    for (const [field, text] of surfaces) {
      const lower = text.toLowerCase();
      for (const banned of BANNED_WORDS) {
        if (lower.includes(banned.toLowerCase())) {
          violations.push(
            `${slotKey}.${field}: banned word "${banned}" in "${text.slice(0, 60)}…"`,
          );
        }
      }
      for (const pat of BANNED_PATTERNS) {
        if (pat.test(text)) {
          violations.push(
            `${slotKey}.${field}: banned pattern ${pat} in "${text.slice(0, 60)}…"`,
          );
        }
      }
    }
  }
  if (violations.length) {
    console.error(
      "verify-phos-voice: FAIL — Tier-0 vocabulary violations:",
    );
    for (const v of violations) console.error("  ✗", v);
    process.exit(1);
  }

  // 4. OPERATOR-VOICE SHA lock
  const opSlots = slotKeys.filter((k) => voice[k]._tag === "OPERATOR-VOICE");
  const expectedShas = {};
  for (const slotKey of opSlots) {
    expectedShas[slotKey] = sha256Hex(canonicalText(voice[slotKey]));
  }

  if (UPDATE_LOCK) {
    const lockPayload = {
      _meta: {
        schema: "p31.phosVoiceLock/1.0.0",
        purpose:
          "SHA-256 lock for OPERATOR-VOICE slots in docs/PHOS-VOICE-DRAFT.md §4. Any change to an OPERATOR-VOICE slot's content must be accompanied by a matching SHA update in this file (which makes the change visible in `git diff`). Generated by `npm run verify:phos-voice -- --update-lock` — review the diff before committing.",
        generatedAt: new Date().toISOString(),
        slotCount: opSlots.length,
      },
      operatorVoiceShas: expectedShas,
    };
    fs.writeFileSync(LOCK, JSON.stringify(lockPayload, null, 2) + "\n", "utf8");
    console.log(
      "verify-phos-voice: --update-lock OK →",
      path.relative(root, LOCK),
      "·",
      opSlots.length,
      "SHAs written. Review `git diff " + path.relative(root, LOCK) + "` before committing.",
    );
    process.exit(0);
  }

  let lockData = null;
  if (fs.existsSync(LOCK)) {
    try {
      lockData = JSON.parse(fs.readFileSync(LOCK, "utf8"));
    } catch (e) {
      die(`could not parse lock file ${path.relative(root, LOCK)}: ${e.message}`);
    }
  }
  if (!lockData) {
    die(
      `lock file missing: ${path.relative(root, LOCK)} — run \`npm run verify:phos-voice -- --update-lock\` to bootstrap (review the diff before committing).`,
    );
  }
  const lockShas = lockData.operatorVoiceShas || {};
  const lockKeys = Object.keys(lockShas).sort();
  const opKeys = opSlots.slice().sort();

  // Lock must contain exactly the OPERATOR-VOICE keys (no more, no less)
  if (
    lockKeys.length !== opKeys.length ||
    lockKeys.some((k, i) => k !== opKeys[i])
  ) {
    die(
      `lock file slot set differs from OPERATOR-VOICE slots:\n  lock:    ${JSON.stringify(lockKeys)}\n  current: ${JSON.stringify(opKeys)}\nRun \`npm run verify:phos-voice -- --update-lock\` and review the diff. If an agent changed an OPERATOR-VOICE tag → DRAFT (or vice versa), the operator must approve.`,
    );
  }
  for (const slotKey of opKeys) {
    if (lockShas[slotKey] !== expectedShas[slotKey]) {
      die(
        `OPERATOR-VOICE slot \`${slotKey}\` content changed (SHA drift).\n  expected: ${lockShas[slotKey]}\n  actual:   ${expectedShas[slotKey]}\nThis means an agent (or commit) modified canonical operator-authored copy. If the change is intentional + operator-approved, run \`npm run verify:phos-voice -- --update-lock\` and commit the lock update alongside the §4 edit so the diff is reviewable.`,
      );
    }
  }

  // 5. busBar coverage (warning, not failure)
  let coverage = "n/a";
  if (fs.existsSync(GROUND_TRUTH)) {
    try {
      const ground = JSON.parse(fs.readFileSync(GROUND_TRUTH, "utf8"));
      const slotsObj = ground?.busBar?.slots || {};
      const groundSlotPaths = Object.values(slotsObj)
        .map((s) => s?.href)
        .filter((h) => typeof h === "string" && h.startsWith("/"))
        // Strip trailing slash and query for matching
        .map((h) => h.replace(/\/$/, "").split("?")[0])
        .filter(Boolean);
      const voicePaths = new Set(
        slotKeys.map((k) => k.replace(/\/$/, "")).filter((k) => k.startsWith("/")),
      );
      // Mirror p31-phos-guide.mjs voiceForPage() normalization: strip .html so
      // a busBar slot href like "/ede.html" matches a voice key "/ede".
      const missing = groundSlotPaths.filter((p) => {
        if (voicePaths.has(p)) return true === false;
        const noHtml = p.replace(/\.html$/, "");
        if (noHtml !== p && voicePaths.has(noHtml)) return false;
        return !voicePaths.has(p);
      });
      const total = groundSlotPaths.length;
      const covered = total - missing.length;
      coverage = `${covered}/${total} slots covered`;
      for (const m of missing) {
        warn(`no voice entry for busBar slot \`${m}\` (will fall back to _default)`);
      }
    } catch (_) {
      // best effort; coverage check is informational
    }
  }

  console.log("verify-phos-voice: OK");
  pass(`drift check       PHOS-VOICE-DRAFT.md §4 ≡ p31-phos-voice.json`);
  pass(
    `schema            ${slotKeys.length} slots (${opCount} OPERATOR-VOICE · ${draftCount} DRAFT-AGENT-SIMULATED)`,
  );
  pass(`vocabulary        clean (Tier-0)`);
  pass(
    `OPERATOR-VOICE    ${opCount} SHA verified (${path.relative(root, LOCK)})`,
  );
  pass(`busBar coverage   ${coverage}`);
}

main();
