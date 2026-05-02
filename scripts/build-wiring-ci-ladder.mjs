#!/usr/bin/env node
/**
 * build-wiring-ci-ladder.mjs — regenerate §9 of docs/P31-WIRING-DIAGRAM.md
 * from the canonical npm `verify` chain in package.json.
 *
 * Why this exists: the wiring diagram's CI ladder used to drift the moment
 * a new verify gate was added to the chain. Now §9 is a generated artifact;
 * the source of truth is package.json `scripts.verify`. Run after editing
 * the chain (or in CI) to keep them aligned.
 *
 * Modes:
 *   node scripts/build-wiring-ci-ladder.mjs           (rewrite the diagram)
 *   node scripts/build-wiring-ci-ladder.mjs --check   (exit 1 on drift)
 *
 * Idempotence: a second invocation produces no diff.
 *
 * Annotation rune contract: only U+2190 (←) is recognized as the comment
 * separator on §9 ladder lines (e.g. "├── verify:foo  ← does X"). Other
 * arrows (→, <-, --, etc.) are not parsed and any trailing text after
 * them will be silently dropped on next regen. If you want to preserve
 * an annotation, use ← exactly. The Phase 4b spec audit (2026-05-01)
 * recommended this be documented explicitly here.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PKG_PATH = path.join(ROOT, "package.json");
const DIAGRAM_PATH = path.join(ROOT, "docs/P31-WIRING-DIAGRAM.md");

const HEADER_LINE = "npm run verify  (root, ordered)";
const COMMENT_COLUMN = 30;

function parseVerifyChain(pkgJson) {
  const verify = pkgJson?.scripts?.verify;
  if (typeof verify !== "string") {
    throw new Error("package.json scripts.verify is missing or not a string");
  }
  const matches = verify.match(/npm run [A-Za-z0-9_:.\-]+/g) || [];
  const gates = matches.map((m) => m.replace(/^npm run\s+/, ""));
  if (!gates.length) {
    throw new Error("no `npm run <gate>` invocations found in scripts.verify");
  }
  return gates;
}

function locateBlock(diagramText) {
  const lines = diagramText.split("\n");
  let openIdx = -1;
  let headerIdx = -1;
  let closeIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trimEnd() === "```" && headerIdx === -1) {
      // open fence candidate; check next line
      if (i + 1 < lines.length && lines[i + 1].trim() === HEADER_LINE) {
        openIdx = i;
        headerIdx = i + 1;
      }
    } else if (headerIdx !== -1 && lines[i].trimEnd() === "```") {
      closeIdx = i;
      break;
    }
  }

  if (openIdx === -1 || headerIdx === -1 || closeIdx === -1) {
    throw new Error(
      `could not locate fenced §9 CI ladder block in ${path.relative(ROOT, DIAGRAM_PATH)} ` +
        `(expected fenced block whose first line is exactly: "${HEADER_LINE}")`
    );
  }
  return { openIdx, headerIdx, closeIdx, lines };
}

function extractExistingComments(blockLines) {
  // blockLines covers content between header and close fence (exclusive).
  // Each existing entry looks like: "├── <gate><pad>← <comment>"  or  "└── <gate>" (no comment)
  const map = new Map();
  for (const raw of blockLines) {
    const m = raw.match(/^(?:├──|└──)\s+([A-Za-z0-9_:.\-]+)(?:\s*←\s*(.+?))?\s*$/);
    if (!m) continue;
    const [, gate, comment] = m;
    if (comment) map.set(gate, comment.trim());
  }
  return map;
}

function renderLadder(gates, commentMap) {
  // Guarantee at least one space between the gate name and `←` even when the
  // gate is longer than COMMENT_COLUMN. Compute an effective column wide
  // enough for the longest annotated gate in the chain.
  const widest = gates.reduce(
    (w, g) => (commentMap.has(g) ? Math.max(w, g.length) : w),
    0
  );
  const col = Math.max(COMMENT_COLUMN, widest + 2);
  const out = [];
  for (let i = 0; i < gates.length; i++) {
    const last = i === gates.length - 1;
    const prefix = last ? "└── " : "├── ";
    const gate = gates[i];
    const comment = commentMap.get(gate);
    const padded = comment ? gate.padEnd(col) : gate;
    const suffix = comment ? `← ${comment}` : "";
    out.push(`${prefix}${padded}${suffix}`.replace(/\s+$/, ""));
  }
  return out;
}

function regenerate(diagramText, gates) {
  const { openIdx, headerIdx, closeIdx, lines } = locateBlock(diagramText);
  const existingBody = lines.slice(headerIdx + 1, closeIdx);
  const commentMap = extractExistingComments(existingBody);
  const newBody = renderLadder(gates, commentMap);

  const before = lines.slice(0, headerIdx + 1);
  const after = lines.slice(closeIdx);
  const next = [...before, ...newBody, ...after].join("\n");
  return next;
}

function diffSummary(a, b) {
  const aLines = a.split("\n");
  const bLines = b.split("\n");
  const max = Math.max(aLines.length, bLines.length);
  const drift = [];
  for (let i = 0; i < max; i++) {
    if (aLines[i] !== bLines[i]) {
      drift.push({ line: i + 1, was: aLines[i] ?? "(eof)", now: bLines[i] ?? "(eof)" });
      if (drift.length >= 8) break;
    }
  }
  return drift;
}

function main() {
  const argv = process.argv.slice(2);
  const checkMode = argv.includes("--check");

  const pkg = JSON.parse(fs.readFileSync(PKG_PATH, "utf8"));
  const diagram = fs.readFileSync(DIAGRAM_PATH, "utf8");
  const gates = parseVerifyChain(pkg);

  let next;
  try {
    next = regenerate(diagram, gates);
  } catch (e) {
    console.error("build-wiring-ci-ladder: FAIL —", e.message);
    process.exit(1);
  }

  if (checkMode) {
    if (next === diagram) {
      console.log(
        `build-wiring-ci-ladder: OK — §9 in sync with package.json verify chain (${gates.length} gates)`
      );
      process.exit(0);
    }
    const drift = diffSummary(diagram, next);
    console.error(
      `build-wiring-ci-ladder: DRIFT — §9 of docs/P31-WIRING-DIAGRAM.md is out of sync with package.json scripts.verify`
    );
    console.error(`  expected ${gates.length} gates in execution order`);
    for (const d of drift) {
      console.error(`  line ${d.line}:`);
      console.error(`    on disk:    ${d.was}`);
      console.error(`    regenerate: ${d.now}`);
    }
    console.error(
      `  fix: run  npm run build:wiring-ci-ladder  to regenerate §9 in place, then commit the diff.`
    );
    process.exit(1);
  }

  if (next === diagram) {
    console.log(
      `build-wiring-ci-ladder: no change — §9 already mirrors ${gates.length} gates`
    );
    process.exit(0);
  }
  fs.writeFileSync(DIAGRAM_PATH, next);
  console.log(
    `build-wiring-ci-ladder: regenerated §9 with ${gates.length} gates`
  );
  process.exit(0);
}

main();
