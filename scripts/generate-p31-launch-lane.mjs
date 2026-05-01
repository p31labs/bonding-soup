#!/usr/bin/env node
/**
 * Builds `p31-launch-lane.json` — machine-readable governed lane overlay
 * (workers + curated pages ids from `launchGovernance` in p31-production-readiness.json +
 * URLs from `p31-live-fleet.json`).
 *
 *   npm run generate:launch-lane
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildLaunchLaneDocument } from "./lib/build-p31-launch-lane.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const prsPath = path.join(root, "p31-production-readiness.json");
const fleetPath = path.join(root, "p31-live-fleet.json");
const outPath = path.join(root, "p31-launch-lane.json");

const prs = JSON.parse(fs.readFileSync(prsPath, "utf8"));
const fleet = JSON.parse(fs.readFileSync(fleetPath, "utf8"));

if (!prs.launchGovernance) {
  console.error(
    "generate-launch-lane: missing launchGovernance in PRS JSON — run scripts/apply-prs-launch-governance.mjs first",
  );
  process.exit(1);
}

const doc = buildLaunchLaneDocument(prs, fleet);
fs.writeFileSync(outPath, JSON.stringify(doc, null, 2) + "\n");
console.log("generate-launch-lane: wrote", path.relative(root, outPath), "—", doc.governed.length, "SKU(s)");
