/**
 * Staged boot sequence (TTY + full mode only).
 */

import process from "node:process";
import { stdoutColumns, useFullBoot } from "./tty.mjs";
import { BANNER_HERO, BANNER_COMPACT, BANNER_MINI, TAGLINE } from "./art/banner.mjs";
import { cyan, dim, green, bold } from "./theme.mjs";
import { writeColoredBannerLines } from "./splash.mjs";

const STAGE_MS = 55;
const MAX_BOOT_MS = 1800;

/**
 * @param {{ write: (s: string) => void }} out
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * @param {{ write: (s: string) => void }} out
 */
export async function runBoot(out = process.stdout) {
  const full = useFullBoot();
  const t0 = Date.now();

  const stages = [
    ["INIT", "calibrating local mesh context"],
    ["MESH", "K₄ topology · loopback bindings"],
    ["READY", "handoff to operator"],
  ];

  if (!full) {
    out.write(dim("P31 CLI · ") + green("ready") + "\n");
    return;
  }

  const w = stdoutColumns();
  let raw;
  if (w >= 76) raw = BANNER_HERO;
  else if (w >= 52) raw = BANNER_COMPACT;
  else raw = BANNER_MINI;

  out.write("\n");
  writeColoredBannerLines(out, raw);
  out.write("\n");
  out.write(dim(TAGLINE) + "\n\n");

  let elapsed = 0;
  for (const [code, msg] of stages) {
    if (Date.now() - t0 > MAX_BOOT_MS) break;
    out.write(cyan(bold(code.padEnd(6, " "))) + dim(" · ") + msg + "\n");
    elapsed += STAGE_MS;
    if (elapsed < MAX_BOOT_MS) {
      await sleep(STAGE_MS);
    }
  }

  out.write("\n" + green("●") + " " + bold("online") + "\n\n");
}
