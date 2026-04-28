/**
 * P31 CLI ASCII — geometric tetrahedron + ASCII # wordmark (no ambiguous block glyphs, no ▓/░).
 * Tiered by terminal width in splash.mjs + boot.mjs.
 */

import { P31_HASH_WORDMARK, TETRA_LINES } from "../ascii-boot.mjs";

/** Full-width telemetry frame + shared wordmark (_ascii-boot.mjs_) — splash only tints ANSI in splash.mjs */
export const BANNER_HERO = [
  "  ════════════════════════════════════════════════════════════════════════════",
  TETRA_LINES,
  "  ────────────────────────────────────────────────────────────────────────────",
  "",
  ...P31_HASH_WORDMARK.split("\n").map((l) => "   " + l),
  "  ════════════════════════════════════════════════════════════════════════════",
].join("\n");

/** ~52–75 cols: compact tetra + short mark */
export const BANNER_COMPACT = [
  "        ∘",
  "       /|\\",
  "      /_|_\\",
  "     /__|__\\",
  "  ───────────────",
  "   ###   ##   #   ",
  "   # #    #   #   ",
  "   ##   ##   #   ",
  "  ───────────────",
].join("\n");

/** Narrow: icon + text */
export const BANNER_MINI = [
  "",
  "  ∘  P31  ·  K₄  ·  tetra mesh",
  "  ───────────────────────────",
].join("\n");

export const TAGLINE = "local mesh · build · connect";

export const SUBHEAD = "andromeda node · K₄ edges · zero-budget edge";
