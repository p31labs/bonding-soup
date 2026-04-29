#!/usr/bin/env node
/**
 * Local parity with p31:all Semgrep step — prints install hint when CLI missing.
 * Default: exit 0 (non-blocking). CI: use p31-ci.yml Semgrep install; this is for devs.
 *   npm run verify:semgrep-parity
 *   npm run verify:semgrep-parity -- --strict   # exit 1 if missing (optional gate)
 */
import process from "node:process";
import { resolveSemgrepBin } from "./resolve-semgrep-bin.mjs";

const strict = process.argv.includes("--strict");

const bin = resolveSemgrepBin();
if (bin) {
  console.log("verify:semgrep-parity: OK —", bin, "on PATH (matches p31-all SAST step when p31ca present)");
  process.exit(0);
}

const msg =
  "verify:semgrep-parity: Semgrep CLI not found — p31:all skips SAST locally. Install: pipx install semgrep  (then ~/.local/bin on PATH)  ·  see AGENTS.md §0";
console[strict ? "error" : "warn"](msg);
process.exit(strict ? 1 : 0);
