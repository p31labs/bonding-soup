#!/usr/bin/env node
/**
 * Canonical home `p31-live-fleet.json` → p31ca `public/p31-live-fleet.json`, then
 * npm run build:fleet-entities updates p31-fleet-entities.json and public/agent stubs;
 * same behavior as the live-fleet step in npm run polish.
 *
 * Env:
 *   P31_SYNC_LIVE_FLEET_SKIP_ENTITIES=1 — copy only (emergency; hub:ci will still run build in prebuild)
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const p31caRoot = path.join(root, "andromeda", "04_SOFTWARE", "p31ca");
const fleetSrc = path.join(root, "p31-live-fleet.json");
const fleetDst = path.join(p31caRoot, "public", "p31-live-fleet.json");

function main() {
  if (!fs.existsSync(fleetSrc)) {
    console.error("sync-live-fleet-p31ca: missing", path.relative(root, fleetSrc));
    process.exit(1);
  }
  if (!fs.existsSync(p31caRoot)) {
    console.log("sync-live-fleet-p31ca: skip — no p31ca tree (partial clone)");
    process.exit(0);
  }
  if (!fs.existsSync(path.dirname(fleetDst))) {
    console.error("sync-live-fleet-p31ca: missing", path.relative(root, path.dirname(fleetDst)));
    process.exit(1);
  }

  fs.copyFileSync(fleetSrc, fleetDst);
  console.log("sync-live-fleet-p31ca: OK →", path.relative(root, fleetDst));

  if (process.env.P31_SYNC_LIVE_FLEET_SKIP_ENTITIES === "1") {
    console.log("sync-live-fleet-p31ca: skip build:fleet-entities (P31_SYNC_LIVE_FLEET_SKIP_ENTITIES=1)");
    return;
  }

  execSync("npm run build:fleet-entities", { cwd: p31caRoot, stdio: "inherit" });
  console.log("sync-live-fleet-p31ca: fleet entities + agent stubs regenerated");
}

main();
