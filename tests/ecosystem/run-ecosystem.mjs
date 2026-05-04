#!/usr/bin/env node
/**
 * Ecosystem test runner — runs ecosystem.test.mjs via Vitest.
 *
 * Usage:
 *   node tests/ecosystem/run-ecosystem.mjs           # all tests (L10 offline)
 *   P31_OFFLINE=0 node tests/ecosystem/run-ecosystem.mjs  # include live probes
 *   npm run test:ecosystem
 *   npm run test:ecosystem:live     (sets P31_OFFLINE=0)
 */

import { spawnSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const offline = process.env.P31_OFFLINE !== "0";

if (offline) {
  console.log("P31 Ecosystem Tests (offline mode — L10 live probes skipped)");
  console.log("  Set P31_OFFLINE=0 to run live HTTP probes\n");
} else {
  console.log("P31 Ecosystem Tests (LIVE mode — all probes active)\n");
}

const result = spawnSync(
  "npx",
  [
    "vitest",
    "run",
    "tests/ecosystem/ecosystem.test.mjs",
    "--config", "vitest.ecosystem.config.mjs",
    "--reporter=verbose",
  ],
  {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env, P31_OFFLINE: offline ? "1" : "0" },
  }
);

process.exit(result.status ?? 1);
