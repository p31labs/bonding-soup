#!/usr/bin/env node
/**
 * Minimum-friction local gate: environment doctor, then full hub chain with **loose** live mesh.
 *   npm run frictionless
 * For CI/prod parity (strict mesh): npm run release:all
 */
import { execSync } from "node:child_process";
import path from "path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { getOperatorJoyLine } from "./lib/operator-joy.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

execSync("node scripts/p31-doctor.mjs", { cwd: root, stdio: "inherit" });
console.log("\n\x1b[36m▶\x1b[0m npm run release:local (MESH_LIVE_STRICT=0)\n");
execSync("npm run release:local", { cwd: root, stdio: "inherit" });
console.log(
  "\n\x1b[32m✓\x1b[0m frictionless complete.  Ship PR: \x1b[1mpnpm pr\x1b[0m  ·  Strict mesh: \x1b[1mnpm run release:all\x1b[0m"
);
if (process.stdout.isTTY && process.env.CI !== "true" && process.env.P31_SKIP_JOY !== "1") {
  const j = getOperatorJoyLine(root, { roll: true, short: true });
  if (process.env.NO_COLOR) console.log("\n◆ " + j + "\n");
  else console.log(`\n\x1b[35m◆\x1b[0m ${j}\n`);
}
