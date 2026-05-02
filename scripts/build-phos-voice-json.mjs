#!/usr/bin/env node
/**
 * build-phos-voice-json.mjs — emits p31-phos-voice.json from PHOS-VOICE-DRAFT.md §4.
 *
 * Pipeline:
 *
 *   docs/PHOS-VOICE-DRAFT.md §4
 *      │
 *      │  parse §4 slot blocks (### `/path` + tag blockquote + 4 bullets)
 *      ▼
 *   andromeda/04_SOFTWARE/p31ca/public/lib/p31-phos-voice.json
 *      │
 *      │  fetched at runtime by p31-phos-guide.mjs tryLoadVoiceJson()
 *      ▼
 *   PHOS guide on every page (BaseLayout-loaded) renders the right voice
 *
 * Slot block format (parser is strict; do not freestyle):
 *
 *   ### `/path-or-_default`
 *
 *   > **tag:** `OPERATOR-VOICE` *(optional source note)*
 *
 *   - **greeting:** `"JSON-encoded string"`
 *   - **hint:** `"JSON-encoded string with \\n newlines"`
 *   - **fallback:** `"JSON-encoded string"`
 *   - **links:** `[{"label":"...","href":"/..."}, ...]`
 *
 * The tag MUST be exactly OPERATOR-VOICE or DRAFT-AGENT-SIMULATED. Anything
 * else fails the build (typo guard). Per-slot field values are JSON literals
 * inside backticks so multiline strings, escape sequences, and arrays all work
 * uniformly.
 *
 * The emitted JSON shape merges with DEFAULT_VOICE in p31-phos-guide.mjs
 * setVoice() — top-level keys are pathnames, values are { greeting, hint,
 * fallback, links, _tag, _tagSource? }. The underscore-prefixed metadata
 * fields are passed through harmlessly by voiceForPage() and surfaced by
 * verify:phos-voice for tamper detection.
 *
 * CLI:
 *   node scripts/build-phos-voice-json.mjs        — write the JSON
 *   node scripts/build-phos-voice-json.mjs --check — dry run; exits 1 if drift
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const SOURCE = path.join(root, "docs/PHOS-VOICE-DRAFT.md");
const TARGET = path.join(
  root,
  "andromeda/04_SOFTWARE/p31ca/public/lib/p31-phos-voice.json",
);

const VALID_TAGS = new Set(["OPERATOR-VOICE", "DRAFT-AGENT-SIMULATED"]);
const REQUIRED_FIELDS = ["greeting", "hint", "fallback", "links"];

const args = new Set(process.argv.slice(2));
const CHECK_ONLY = args.has("--check");

function die(msg) {
  console.error("build-phos-voice-json: FAIL —", msg);
  process.exit(1);
}

function readSection4(md) {
  // Extract §4 block: from `## 4.` to next `## ` heading.
  const startRe = /^## 4\.\s/m;
  const endRe = /^## (?!4\.)/m;
  const startMatch = md.match(startRe);
  if (!startMatch) die("could not find `## 4.` heading in PHOS-VOICE-DRAFT.md");
  const after = md.slice(startMatch.index);
  const endMatch = after.slice(1).match(endRe);
  const section = endMatch ? after.slice(0, endMatch.index + 1) : after;
  // Strip fenced code blocks (``` … ```) so the parser does not pick up
  // illustrative examples in the §4 prose preamble. Slot headings live in
  // raw markdown only.
  return section.replace(/```[\s\S]*?```/g, "");
}

function parseSlotBlocks(section4) {
  // Slot heading: ### `/path-or-_default`
  // We split on those headings and parse each block independently.
  const slotHeadingRe = /^### `([^`]+)`\s*$/gm;
  const blocks = [];
  let m;
  let lastIndex = 0;
  let lastSlot = null;
  while ((m = slotHeadingRe.exec(section4)) !== null) {
    if (lastSlot) {
      blocks.push({
        slot: lastSlot,
        body: section4.slice(lastIndex, m.index),
      });
    }
    lastSlot = m[1];
    lastIndex = m.index + m[0].length;
  }
  if (lastSlot) {
    blocks.push({ slot: lastSlot, body: section4.slice(lastIndex) });
  }
  return blocks;
}

function parseSlotBody(slot, body) {
  // Tag blockquote: > **tag:** `OPERATOR-VOICE` *(optional source)*
  const tagRe = /^>\s*\*\*tag:\*\*\s*`([^`]+)`(?:\s*\*\(([^)]*)\)\*)?/m;
  const tagMatch = body.match(tagRe);
  if (!tagMatch) die(`slot \`${slot}\` missing required \`> **tag:** \`...\`\` blockquote`);
  const tag = tagMatch[1];
  const tagSource = tagMatch[2] || null;
  if (!VALID_TAGS.has(tag)) {
    die(
      `slot \`${slot}\` has invalid tag "${tag}". Allowed: ${[...VALID_TAGS].join(", ")}`,
    );
  }

  const out = { _tag: tag };
  if (tagSource) out._tagSource = tagSource;

  for (const field of REQUIRED_FIELDS) {
    // - **greeting:** `<json-literal>`
    // The backtick-wrapped literal MUST be valid JSON (string, array, object).
    const fieldRe = new RegExp(
      `^- \\*\\*${field}:\\*\\*\\s+\`([\\s\\S]*?)\`\\s*$`,
      "m",
    );
    const fm = body.match(fieldRe);
    if (!fm) die(`slot \`${slot}\` missing required field "${field}"`);
    let value;
    try {
      value = JSON.parse(fm[1]);
    } catch (e) {
      die(
        `slot \`${slot}\`.${field}: backtick-wrapped value is not valid JSON (${e.message}).\n  Got: ${fm[1].slice(0, 120)}${fm[1].length > 120 ? "…" : ""}`,
      );
    }
    if (field === "links") {
      if (!Array.isArray(value)) die(`slot \`${slot}\`.links must be an array`);
      for (const link of value) {
        if (!link || typeof link !== "object") {
          die(`slot \`${slot}\`.links contains non-object entry`);
        }
        if (typeof link.label !== "string" || typeof link.href !== "string") {
          die(
            `slot \`${slot}\`.links entry must have string {label, href}: ${JSON.stringify(link)}`,
          );
        }
      }
    } else {
      if (typeof value !== "string") {
        die(
          `slot \`${slot}\`.${field} must be a string (got ${typeof value})`,
        );
      }
    }
    out[field] = value;
  }
  return out;
}

function build() {
  if (!fs.existsSync(SOURCE)) die(`source missing: ${SOURCE}`);
  const md = fs.readFileSync(SOURCE, "utf8");

  const section4 = readSection4(md);
  const blocks = parseSlotBlocks(section4);
  if (blocks.length === 0) {
    die("§4 has no `### `/path`` slot headings");
  }

  const voice = {};
  let opCount = 0;
  let draftCount = 0;
  for (const { slot, body } of blocks) {
    if (voice[slot]) {
      die(
        `duplicate slot \`${slot}\` in §4 — each path may only be defined once`,
      );
    }
    const parsed = parseSlotBody(slot, body);
    voice[slot] = parsed;
    if (parsed._tag === "OPERATOR-VOICE") opCount += 1;
    else draftCount += 1;
  }

  // Stable key order for deterministic output (alphabetical, with _default first).
  const ordered = {};
  if (voice._default) ordered._default = voice._default;
  for (const k of Object.keys(voice).sort()) {
    if (k !== "_default") ordered[k] = voice[k];
  }

  const header = {
    _meta: {
      schema: "p31.phosVoice/1.0.0",
      source: "docs/PHOS-VOICE-DRAFT.md §4",
      generator: "scripts/build-phos-voice-json.mjs",
      slotCount: Object.keys(ordered).length,
      operatorVoiceCount: opCount,
      draftCount,
      doctrine:
        "The operator's hand is the source of truth. Agent drafts unblock implementation; the operator promotes them by rewriting and changing _tag to OPERATOR-VOICE. verify:phos-voice fails if any OPERATOR-VOICE line is silently rewritten by an agent. (no generatedAt: deterministic build for drift detection; git log + lock file are the audit trail.)",
    },
    ...ordered,
  };

  const json = JSON.stringify(header, null, 2) + "\n";

  if (CHECK_ONLY) {
    if (!fs.existsSync(TARGET)) {
      die(
        `--check: target missing (${path.relative(root, TARGET)}); run without --check to emit`,
      );
    }
    const onDisk = fs.readFileSync(TARGET, "utf8");
    if (onDisk !== json) {
      die(
        `--check: ${path.relative(root, TARGET)} drift from PHOS-VOICE-DRAFT.md §4. Run \`npm run build:phos-voice\` to regenerate.`,
      );
    }
    console.log(
      "build-phos-voice-json: --check OK —",
      ordered._meta?.slotCount || Object.keys(ordered).length,
      "slots,",
      opCount,
      "OPERATOR-VOICE,",
      draftCount,
      "DRAFT-AGENT-SIMULATED",
    );
    process.exit(0);
  }

  // Skip write in partial clones (no andromeda)
  const targetDir = path.dirname(TARGET);
  if (!fs.existsSync(targetDir)) {
    console.log(
      "build-phos-voice-json: skip — no andromeda/p31ca tree (partial clone)",
    );
    process.exit(0);
  }

  fs.writeFileSync(TARGET, json, "utf8");
  console.log(
    "build-phos-voice-json: OK →",
    path.relative(root, TARGET),
    "·",
    Object.keys(ordered).length - 1, // exclude _meta
    "slots ·",
    opCount,
    "OPERATOR-VOICE ·",
    draftCount,
    "DRAFT-AGENT-SIMULATED",
  );
}

build();
