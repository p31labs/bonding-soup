#!/usr/bin/env node
/**
 * Minimum-friction local gate: environment doctor, then full hub chain with **loose** live mesh.
 *   npm run frictionless
 * For CI/prod parity (strict mesh): npm run release:all
 */
import { execSync } from "node:child_process";
import path from "path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

execSync("node scripts/p31-doctor.mjs", { cwd: root, stdio: "inherit" });
console.log("\n\x1b[36m▶\x1b[0m npm run release:local (MESH_LIVE_STRICT=0)\n");
execSync("npm run release:local", { cwd: root, stdio: "inherit" });
console.log(
  "\n\x1b[32m✓\x1b[0m frictionless complete.  Ship PR: \x1b[1mpnpm pr\x1b[0m  ·  Strict mesh: \x1b[1mnpm run release:all\x1b[0m"
);
