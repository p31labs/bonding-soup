/**
 * TTY and boot-mode helpers for the P31 CLI.
 */

import process from "node:process";

/** @returns {boolean} */
export function stdoutIsTTY() {
  return Boolean(process.stdout.isTTY);
}

/**
 * Rich boot sequence (banner + staged lines). Off for pipes, CI, or P31_CLI_MINIMAL=1.
 * @returns {boolean}
 */
export function useFullBoot() {
  return Boolean(
    process.stdout.isTTY && process.env.CI !== "true" && process.env.P31_CLI_MINIMAL !== "1"
  );
}

/**
 * ANSI styling (respect NO_COLOR / FORCE_COLOR).
 * @returns {boolean}
 */
export function useColor() {
  if (process.env.NO_COLOR != null && process.env.NO_COLOR !== "") {
    return false;
  }
  if (process.env.FORCE_COLOR === "0") {
    return false;
  }
  return Boolean(process.stdout.isTTY || process.env.FORCE_COLOR);
}

/** @returns {number} */
export function stdoutColumns() {
  return typeof process.stdout.columns === "number" && process.stdout.columns > 0
    ? process.stdout.columns
    : 80;
}
