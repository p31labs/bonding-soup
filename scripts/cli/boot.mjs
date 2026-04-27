/**
 * Staged boot sequence (TTY + full mode only).
 */

import process from "node:process";
import { stdoutColumns, useFullBoot } from "./tty.mjs";
import { BANNER_COMPACT, TAGLINE } from "./art/banner.mjs";
import { cyan, dim, green, bold } from "./theme.mjs";

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
  const banner =
    w < 56
      ? dim("── P31 ──")
      : BANNER_COMPACT.split("\n")
          .map((line) => dim(line))
          .join("\n");

  out.write("\n" + banner + "\n");
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
