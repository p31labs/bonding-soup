#!/usr/bin/env node
/**
 * One-shot “make it green + synced” for P31 home + nested Andromeda p31ca.
 * - Regenerates constants-derived artifacts (mesh JSON, ground-truth header, TS export).
 * - Mirrors p31-live-fleet.json into the hub public tree when both paths exist.
 * - Runs sync:doc-library:p31ca when p31ca exists (build:doc-index + mirror to public/doc-library/).
 * - Runs release:local (verify + p31ca build + security:check, loose mesh strict).
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function run(title, cmd, cwd = root) {
  console.log(`\n\x1b[36m▶\x1b[0m ${title}`);
  execSync(cmd, { cwd, stdio: "inherit" });
}

function main() {
  run("apply:constants", "npm run apply:constants", root);

  const fleetSrc = path.join(root, "p31-live-fleet.json");
  const fleetDst = path.join(root, "andromeda/04_SOFTWARE/p31ca/public/p31-live-fleet.json");
  if (fs.existsSync(fleetSrc) && fs.existsSync(path.dirname(fleetDst))) {
    fs.copyFileSync(fleetSrc, fleetDst);
    console.log("\n\x1b[32m✓\x1b[0m synced p31-live-fleet.json → andromeda/04_SOFTWARE/p31ca/public/");
  }

  const p31caRoot = path.join(root, "andromeda", "04_SOFTWARE", "p31ca");
  if (fs.existsSync(p31caRoot) && process.env.P31_POLISH_SKIP_DOC_LIB !== "1") {
    run(
      "sync:doc-library:p31ca (build:doc-index + hub /doc-library mirror)",
      "npm run sync:doc-library:p31ca",
      root
    );
  } else if (!fs.existsSync(p31caRoot)) {
    console.log("\n\x1b[33m▶\x1b[0m polish: skip sync:doc-library:p31ca — no andromeda/04_SOFTWARE/p31ca\n");
  }

  run("release:local (verify + hub build + security)", "npm run release:local", root);
  console.log("\n\x1b[32m✓\x1b[0m p31-polish: complete\n");
}

main();
