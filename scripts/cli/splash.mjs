/**
 * Entry splash + optional “load” beat — TTY + full mode, or `p31 art` (force).
 */

import process from "node:process";
import { stdoutColumns, useFullBoot } from "./tty.mjs";
import { BANNER_HERO, BANNER_COMPACT, BANNER_MINI, TAGLINE, SUBHEAD } from "./art/banner.mjs";
import { cyan, dim, green, bold, yellow, magentaBright, magenta, blue } from "./theme.mjs";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Paint raw banner lines (hero / compact / mini). Shared by splash + boot.
 *
 * @param {NodeJS.WriteStream} out
 * @param {string} raw
 */
export function writeColoredBannerLines(out, raw) {
  const lines = raw.split("\n");
  for (const line of lines) {
    if (!line.trim()) {
      out.write("\n");
      continue;
    }
    if (line.includes("#")) out.write(bold(cyan(line)) + "\n");
    else if (line.includes("∘")) out.write(yellow(line) + "\n");
    else if (line.includes("═") || line.includes("─")) out.write(magentaBright(line) + "\n");
    else if (/[/\\|]/.test(line)) out.write(magenta(line) + "\n");
    else out.write(cyan(line) + "\n");
  }
}

/**
 * @param {{ force?: boolean }} opts — `force` shows full art even when P31_CLI_MINIMAL=1 (e.g. `p31 art`)
 */
export function shouldShowSplash(opts = {}) {
  if (opts.force) {
    if (process.env.CI === "true") return false;
    return true;
  }
  return useFullBoot() && process.env.P31_CLI_PLAIN !== "1";
}

/**
 * @param {NodeJS.WriteStream} [out]
 * @param {{ force?: boolean }} [opts]
 */
export async function printSplash(out = process.stdout, opts = {}) {
  if (!shouldShowSplash(opts)) {
    out.write(dim("P31 CLI") + "\n");
    return;
  }

  const w = stdoutColumns();
  let raw;
  if (w >= 76) raw = BANNER_HERO;
  else if (w >= 52) raw = BANNER_COMPACT;
  else raw = BANNER_MINI;

  writeColoredBannerLines(out, raw);

  out.write("\n");
  out.write(bold(green(TAGLINE)) + "\n");
  out.write(dim(SUBHEAD) + "\n");

  await sleep(45);
  out.write(dim("  ⟢ ") + cyan("channel open") + dim(" · ") + green("phosphorus") + dim(" · ") + blue("K₄") + "\n\n");
}
