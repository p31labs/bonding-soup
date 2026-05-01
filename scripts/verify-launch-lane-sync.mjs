#!/usr/bin/env node
/**
 * Confirms committed `p31-launch-lane.json` matches `buildLaunchLaneDocument(prs,fleet)`.
 * Skip partial clone missing inputs: exits 0 with message when PRS/fleet/files absent.
 *
 * npm run verify:launch-lane-sync
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildLaunchLaneDocument } from "./lib/build-p31-launch-lane.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function die(msg, code = 1) {
  console.error("verify-launch-lane-sync:", msg);
  process.exit(code);
}

function main() {
  const lanePath = path.join(root, "p31-launch-lane.json");
  const prsPath = path.join(root, "p31-production-readiness.json");
  const fleetPath = path.join(root, "p31-live-fleet.json");

  if (!fs.existsSync(lanePath)) {
    console.log("verify-launch-lane-sync: SKIP — p31-launch-lane.json missing (npm run generate:launch-lane)");
    process.exit(0);
  }
  if (!fs.existsSync(prsPath) || !fs.existsSync(fleetPath)) {
    console.log("verify-launch-lane-sync: SKIP — PRS or fleet JSON missing");
    process.exit(0);
  }

  const prs = JSON.parse(fs.readFileSync(prsPath, "utf8"));
  const fleet = JSON.parse(fs.readFileSync(fleetPath, "utf8"));
  if (!prs.launchGovernance) {
    die("p31-production-readiness.json lacks launchGovernance");
  }

  let expected;
  try {
    expected = buildLaunchLaneDocument(prs, fleet);
  } catch (e) {
    die(e instanceof Error ? e.message : String(e));
  }

  const actual = JSON.parse(fs.readFileSync(lanePath, "utf8"));
  const a = JSON.stringify(expected, null, 2) + "\n";
  const b = JSON.stringify(actual, null, 2) + "\n";
  if (a !== b) {
    die(
      "p31-launch-lane.json is stale — run: npm run generate:launch-lane\n(diff: committed file vs fresh build from PRS + p31-live-fleet.json)",
    );
  }
  console.log("verify-launch-lane-sync: OK — manifest matches PRS + live fleet");
}

main();
