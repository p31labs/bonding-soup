#!/usr/bin/env node
/**
 * When @p31/shared is present: typecheck + vitest for audience matrix module.
 * Matrix source of truth: docs/COGNITIVE-PASSPORT-AUDIENCE-MATRIX.md v1.0.0
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const sharedRoot = path.join(root, "andromeda", "04_SOFTWARE", "packages", "shared");
const profilesTs = path.join(sharedRoot, "src", "cognitive-passport-profiles.ts");

function main() {
  if (!fs.existsSync(profilesTs)) {
    console.log("verify-cognitive-passport-profiles: skip — no profiles module (partial clone)");
    process.exit(0);
  }
  execSync("npx tsc --project tsconfig.json --noEmit", {
    cwd: sharedRoot,
    stdio: "inherit",
  });
  execSync("npx vitest run src/cognitive-passport-profiles.test.ts", {
    cwd: sharedRoot,
    stdio: "inherit",
  });
  console.log("verify-cognitive-passport-profiles: OK — matrix types + tests");
}

main();
