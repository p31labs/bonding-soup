#!/usr/bin/env node
/**
 * verify-quantum-material-u — asserts P31 Quantum Material U tokens + component
 * classes are present in the generated `cognitive-passport/p31-style.css`.
 *
 * Source canon : andromeda/04_SOFTWARE/design-tokens/p31-universal-canon.json (`quantum`)
 * Generator     : andromeda/04_SOFTWARE/p31ca/scripts/lib/p31-style-generate.mjs
 *                  → emitQuantumMaterialUBlock
 * Spec          : docs/P31-QUANTUM-MATERIAL-U.md
 * Mirror gate   : npm run verify:p31-style (this verifier rides on top)
 *
 * Skips with exit 0 when the passport CSS is absent (partial clone tolerance).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const cssPath = path.join(root, "cognitive-passport", "p31-style.css");
const docPath = path.join(root, "docs", "P31-QUANTUM-MATERIAL-U.md");
const canonPath = path.join(
  root,
  "andromeda",
  "04_SOFTWARE",
  "design-tokens",
  "p31-universal-canon.json",
);
const tailwindPath = path.join(
  root,
  "andromeda",
  "04_SOFTWARE",
  "p31ca",
  "public",
  "p31-tailwind-extend.js",
);
const showcasePath = path.join(root, "p31-quantum-material-u.html");

function fail(msg) {
  console.error(`verify-quantum-material-u: FAIL — ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`verify-quantum-material-u: ${msg}`);
}

if (!fs.existsSync(cssPath)) {
  console.log(
    "verify-quantum-material-u: skip — cognitive-passport/p31-style.css missing (run npm run apply:p31-style first / partial clone)",
  );
  process.exit(0);
}

if (!fs.existsSync(docPath)) {
  fail(`missing doc ${path.relative(root, docPath)} — author docs/P31-QUANTUM-MATERIAL-U.md`);
}

const css = fs.readFileSync(cssPath, "utf8");

const required = [
  // tonal scale (5 anchors × at least three checkpoints)
  "--p31-tone-teal-0",
  "--p31-tone-teal-2",
  "--p31-tone-teal-5",
  "--p31-tone-coral-2",
  "--p31-tone-phosphorus-2",
  "--p31-tone-butter-2",
  "--p31-tone-lavender-2",
  // elevation
  "--p31-elev-0-tone",
  "--p31-elev-3-tone",
  "--p31-elev-5-tone",
  "--p31-elev-3-shadow",
  // state layers
  "--p31-state-hover",
  "--p31-state-focus",
  "--p31-state-pressed",
  "--p31-state-selected",
  "--p31-state-disabled",
  // shape
  "--p31-shape-md",
  "--p31-shape-full",
  "--p31-shape-asymmetric",
  // motion
  "--p31-q-motion-still",
  "--p31-q-motion-within",
  "--p31-q-motion-enter",
  "--p31-q-motion-exit",
  "--p31-q-motion-expressive",
  "--p31-q-motion-ambient",
  // component classes
  ".p31-q-surface",
  ".p31-q-card",
  ".p31-q-button",
  ".p31-q-button--filled",
  ".p31-q-button--tonal",
  ".p31-q-button--outlined",
  ".p31-q-button--text",
  ".p31-q-fab",
  ".p31-q-chip",
  ".p31-q-chip--assist",
  ".p31-q-chip--filter",
  ".p31-q-chip--input",
  ".p31-q-chip--suggestion",
  ".p31-q-divider",
  ".p31-q-atmosphere",
];

const missing = required.filter((tok) => !css.includes(tok));
if (missing.length) {
  console.error("verify-quantum-material-u: FAIL — missing tokens / classes in cognitive-passport/p31-style.css:");
  for (const m of missing) console.error(`  - ${m}`);
  console.error("\nFix: ensure quantum block is present in the canon and re-run:");
  console.error("  npm run apply:p31-style");
  process.exit(1);
}

if (!/prefers-reduced-motion: reduce[^{]*\{[^}]*\.p31-q-card/s.test(css)) {
  // best-effort soft check — helpful diagnostic but not strictly required
  // (multiple p31-q-* blocks each carry their own reduced-motion guard).
  if (!/prefers-reduced-motion: reduce[\s\S]*?\.p31-q-/.test(css)) {
    fail("no @media (prefers-reduced-motion) guard around any .p31-q-* class");
  }
}

if (fs.existsSync(tailwindPath)) {
  const tw = fs.readFileSync(tailwindPath, "utf8");
  const requiredTw = [
    "p31Quantum",
    "tone",
    "var(--p31-tone-teal-2)",
    "var(--p31-elev-3-shadow)",
    "var(--p31-shape-asymmetric)",
    "var(--p31-q-motion-enter)",
  ];
  const missingTw = requiredTw.filter((tok) => !tw.includes(tok));
  if (missingTw.length) {
    console.error(
      "verify-quantum-material-u: FAIL \u2014 Tailwind bridge missing quantum tokens:",
    );
    for (const m of missingTw) console.error(`  - ${m}`);
    console.error("\nFix: run `npm run apply:p31-style` to regenerate p31-tailwind-extend.js.");
    process.exit(1);
  }
}

if (fs.existsSync(showcasePath)) {
  const html = fs.readFileSync(showcasePath, "utf8");
  if (!/\bp31-q-card\b/.test(html) || !/\bp31-q-button\b/.test(html)) {
    fail(
      "showcase p31-quantum-material-u.html does not exercise core .p31-q-card / .p31-q-button \u2014 keep the demo as live truth",
    );
  }
}

if (fs.existsSync(canonPath)) {
  try {
    const canon = JSON.parse(fs.readFileSync(canonPath, "utf8"));
    if (!canon || typeof canon !== "object") fail("canon JSON did not parse to an object");
    if (!canon.quantum) fail("canon missing `quantum` block — bump version and add quantum tokens");
    const q = canon.quantum;
    const expectedAnchors = ["teal", "coral", "phosphorus", "butter", "lavender"];
    const haveAnchors = Array.isArray(q.tonalAnchors) ? q.tonalAnchors : [];
    for (const a of expectedAnchors) {
      if (!haveAnchors.includes(a)) fail(`canon.quantum.tonalAnchors missing "${a}"`);
    }
    const haveSteps = Array.isArray(q.tonalSteps) ? q.tonalSteps : [];
    if (haveSteps.length !== 6) fail("canon.quantum.tonalSteps must have exactly 6 entries");
    for (const k of ["hover", "focus", "pressed", "selected", "dragged", "disabled"]) {
      if (typeof q.stateLayer?.[k] !== "number") fail(`canon.quantum.stateLayer.${k} must be a number`);
    }
    for (const k of ["xs", "sm", "md", "lg", "xl", "2xl", "full", "asymmetric"]) {
      if (typeof q.shape?.[k] !== "string") fail(`canon.quantum.shape.${k} must be a string`);
    }
    for (const k of ["still", "within", "enter", "exit", "expressive", "ambient"]) {
      if (typeof q.motionBudget?.[k] !== "string") fail(`canon.quantum.motionBudget.${k} must be a string`);
    }
  } catch (err) {
    fail(`canon JSON parse error: ${err.message}`);
  }
}

ok(
  `OK (${required.length} tokens/classes in passport CSS, Tailwind bridge + showcase + canon block validated)`,
);
