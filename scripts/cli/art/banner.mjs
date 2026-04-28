/**
 * P31 CLI ASCII — geometric tetrahedron + ASCII # wordmark (no ambiguous block glyphs, no ▓/░).
 * Tiered by terminal width in splash.mjs + boot.mjs.
 */

/** ~76 cols: frame + tetrahedron wireframe + “P31” in # only (reads clearly everywhere). */
export const BANNER_HERO = [
  "  ════════════════════════════════════════════════════════════════════════════",
  "                                   ∘",
  "                            /|\\",
  "                           / | \\",
  "                          /  |  \\",
  "                         /___|___\\",
  "                        /\\   |   /\\",
  "                       /__\\__|__/__\\",
  "                         \\_____________/",
  "  ────────────────────────────────────────────────────────────────────────────",
  "",
  "           #####       ####        ##    ",
  "           #   #           #         #   ",
  "           #####       ####          #   ",
  "           #           #             #   ",
  "           #           ####      #####   ",
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
