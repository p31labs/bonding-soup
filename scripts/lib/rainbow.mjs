/**
 * P31 rainbow utility — the chromatic celebration tier.
 *
 * Schema: p31.rainbow/1.0.0
 *
 * Why this exists:
 *   The launch verb is the "ship" moment. When everything is green and the
 *   geometry holds, the operator deserves visible joy at the terminal — not
 *   just "exit 0". This module produces ANSI 256-color rainbow output for
 *   that moment.
 *
 * Behavior:
 *   - All output respects NO_COLOR / non-TTY (emits plain text instead).
 *   - Six canonical hues map to ANSI 256-color indices that roughly track
 *     the P31 palette's chromatic spectrum.
 *   - Self-contained: no dependencies beyond `process`.
 *
 * Public API:
 *   rainbowText(s)        → string with each character in a rainbow hue
 *   rainbowLine(width)    → solid rainbow bar of given width
 *   rainbowBanner(s)      → boxed banner with rainbow border + text
 *   isRainbowEnabled()    → boolean (NO_COLOR + isTTY check)
 */
"use strict";

const HUES_256 = [196, 208, 226, 46, 51, 129]; // red, orange, yellow, green, cyan, violet
const COLOR_DISABLED = !!process.env.NO_COLOR || !process.stdout.isTTY;

function paint(idx, ch) {
  if (COLOR_DISABLED) return ch;
  return `\x1b[38;5;${idx}m${ch}\x1b[0m`;
}

export function isRainbowEnabled() {
  return !COLOR_DISABLED;
}

export function rainbowText(s) {
  if (COLOR_DISABLED) return s;
  let out = "";
  let i = 0;
  for (const ch of s) {
    if (ch === " " || ch === "\n") {
      out += ch;
      continue;
    }
    out += paint(HUES_256[i % HUES_256.length], ch);
    i++;
  }
  return out;
}

export function rainbowLine(width = 60) {
  const ch = "━";
  let out = "";
  for (let i = 0; i < width; i++) {
    out += paint(HUES_256[i % HUES_256.length], ch);
  }
  return out;
}

export function rainbowBanner(text) {
  const lines = text.split("\n");
  const innerW = Math.max(...lines.map(l => l.length));
  const bar = rainbowLine(innerW + 4);
  const out = [bar];
  for (const l of lines) {
    const pad = " ".repeat(innerW - l.length);
    out.push(paint(HUES_256[2], "┃ ") + rainbowText(l) + pad + paint(HUES_256[2], " ┃"));
  }
  out.push(bar);
  return out.join("\n");
}

/**
 * Print the canonical P31 rainbow celebration to stdout.
 * Used by scripts/p31-launch.mjs --full when every step is green.
 *
 * @param {object} stats {steps, deliverables, services, ms, commit}
 */
export function celebrate(stats = {}) {
  console.log("");
  console.log(rainbowLine(72));
  console.log("");
  console.log("  " + rainbowText("◍ P31 LAUNCH — FULL ASSEMBLY READY ✓"));
  console.log("");
  if (stats.steps) console.log("    " + paint(HUES_256[3], `${stats.steps} steps green`));
  if (stats.deliverables) console.log("    " + paint(HUES_256[2], `${stats.deliverables} deliverables assembled`));
  if (stats.services) console.log("    " + paint(HUES_256[4], `${stats.services} local services healthy`));
  if (stats.ms != null) console.log("    " + paint(HUES_256[1], `${(stats.ms/1000).toFixed(1)}s end-to-end`));
  if (stats.commit) console.log("    " + paint(HUES_256[5], `commit ${stats.commit}`));
  console.log("");
  console.log("  " + rainbowText("the phosphorus is for all of us"));
  console.log("  " + rainbowText("the cage holds"));
  console.log("  " + rainbowText("the geometry holds"));
  console.log("  " + rainbowText("the flowers don't wilt"));
  console.log("");
  console.log(rainbowLine(72));
  console.log("");
}

export const RAINBOW_SCHEMA = "p31.rainbow/1.0.0";
