#!/usr/bin/env node
/**
 * Home `p31-live-fleet.json` is the single write contract; hub ships a byte-mirror +
 * derived fleet-entities + agent stubs. Runs `sync:live-fleet:p31ca` (idempotent), then
 * fails if the Andromeda work tree still drifts — same discipline as doc-library mirror.
 *
 * Skips: P31_SKIP_LIVE_FLEET_MIRROR=1, no p31ca, andromeda/ not a git work tree.
 * Home CI without andromeda: skip. Full tree: forces two-repo commit before green verify.
 */
import { execFileSync, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { LIVE_FLEET_HUB_MIRROR_GIT_PATHSPECS } from "./lib/live-fleet-hub-mirror-pathspecs.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const p31ca = path.join(root, "andromeda", "04_SOFTWARE", "p31ca");
const andromeda = path.join(root, "andromeda");

function main() {
  if (process.env.P31_SKIP_LIVE_FLEET_MIRROR === "1") {
    console.log("verify-live-fleet-p31ca-mirror: skip — P31_SKIP_LIVE_FLEET_MIRROR=1");
    return;
  }
  if (!fs.existsSync(p31ca)) {
    console.log("verify-live-fleet-p31ca-mirror: skip — no p31ca tree");
    return;
  }
  try {
    execFileSync("git", ["-C", andromeda, "rev-parse", "--is-inside-work-tree"], {
      cwd: root,
      stdio: "pipe",
    });
  } catch {
    console.log("verify-live-fleet-p31ca-mirror: skip — andromeda/ is not a git work tree");
    return;
  }

  execSync("npm run sync:live-fleet:p31ca", { cwd: root, stdio: "inherit" });

  const out = execFileSync(
    "git",
    ["-C", andromeda, "status", "--porcelain", "--", ...LIVE_FLEET_HUB_MIRROR_GIT_PATHSPECS],
    { cwd: root, encoding: "utf8" }
  );
  const lines = out
    .split("\n")
    .map((l) => l.trimEnd())
    .filter(Boolean);

  if (lines.length === 0) {
    console.log("verify-live-fleet-p31ca-mirror: OK — hub mirror + fleet entities match home live-fleet");
    return;
  }

  console.error(
    "verify-live-fleet-p31ca-mirror: FAIL — Andromeda paths differ from home p31-live-fleet.json (after sync):"
  );
  for (const line of lines) console.error(" ", line);
  console.error("\nRepair:");
  console.error("  1. Edit canonical  p31-live-fleet.json  at P31 home root (mesh must match p31-constants — npm run verify:ecosystem).");
  console.error("  2. npm run sync:live-fleet:p31ca");
  console.error("  3. cd andromeda && git add " + LIVE_FLEET_HUB_MIRROR_GIT_PATHSPECS.join(" ") + " && git commit -m \"chore(p31ca): sync live-fleet mirror\"");
  console.error("Or full operator lane: npm run polish");
  console.error("\nBypass (local only): P31_SKIP_LIVE_FLEET_MIRROR=1 npm run verify");
  process.exit(1);
}

main();
