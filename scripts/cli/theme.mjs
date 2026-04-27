/**
 * Minimal ANSI helpers — zero dependencies. Do not use color as the only signal.
 */

import { useColor } from "./tty.mjs";

function wrap(code, s) {
  if (!useColor()) return s;
  return "\x1b[" + code + "m" + s + "\x1b[0m";
}

/** @param {string} s */
export function bold(s) {
  return wrap("1", s);
}

/** @param {string} s */
export function dim(s) {
  return wrap("2", s);
}

/** @param {string} s */
export function cyan(s) {
  return wrap("36", s);
}

/** @param {string} s */
export function green(s) {
  return wrap("32", s);
}

/** @param {string} s */
export function yellow(s) {
  return wrap("33", s);
}

/** @param {string} s */
export function red(s) {
  return wrap("31", s);
}
