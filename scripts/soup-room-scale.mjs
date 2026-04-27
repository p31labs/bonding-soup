#!/usr/bin/env node
/**
 * Room-scale gate: WS protocol probe + pointer to manual runbook.
 * Retries the probe once on failure (timing flake when the machine is under load).
 *   npm run soup:room-scale
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function runProbe() {
  return spawnSync("npm", ["run", "test:mock-ws"], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  }).status;
}

async function main() {
  let st = runProbe();
  if (st !== 0) {
    console.warn(
      "soup-room-scale: first probe failed — retry once after 400ms (timing flake under load)",
    );
    await delay(400);
    st = runProbe();
  }
  if (st !== 0) {
    process.exit(st ?? 1);
  }
  console.log(
    "\nsoup-room-scale: protocol probe OK. Manual runbook: docs/SOUP-ROOM-SCALE-RUNBOOK.md\n",
  );
}

main();
