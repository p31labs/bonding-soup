#!/usr/bin/env node
/**
 * Fails if p31.ground-truth.json drifts from p31-constants.json (no Cloudflare API).
 * When only Andromeda is checked out, skips if p31-constants.json is missing.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildCanonicalNumbering, buildMissionSnippet } from "./lib/p31-constants-fragment.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const constantsPath = path.join(root, "p31-constants.json");
const gtPath = path.join(root, "andromeda/04_SOFTWARE/p31ca/ground-truth/p31.ground-truth.json");
const genTs = path.join(root, "src", "p31-constants-generated.ts");

function sameJson(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function main() {
  if (!fs.existsSync(constantsPath)) {
    console.log("verify-constants: skip — no p31-constants.json (partial clone?)");
    process.exit(0);
  }
  if (!fs.existsSync(gtPath)) {
    console.log("verify-constants: skip — no", gtPath);
    process.exit(0);
  }
  const c = JSON.parse(fs.readFileSync(constantsPath, "utf8"));
  const gt = JSON.parse(fs.readFileSync(gtPath, "utf8"));
  const expect = buildCanonicalNumbering(c);
  let fail = 0;
  if (!sameJson(gt.canonicalNumbering, expect)) {
    console.error("verify-constants: canonicalNumbering != p31-constants.json");
    console.error("Expected:", JSON.stringify(expect, null, 2));
    console.error("Got:     ", JSON.stringify(gt.canonicalNumbering, null, 2));
    fail = 1;
  }
  if (gt.schema !== c.groundTruth.schema) {
    console.error("verify-constants: ground-truth .schema should be", c.groundTruth.schema, "got", gt.schema);
    fail = 1;
  }
  if (gt.version !== c.groundTruth.fileVersion) {
    console.error("verify-constants: ground-truth .version should be", c.groundTruth.fileVersion, "got", gt.version);
    fail = 1;
  }
  if (buildMissionSnippet(c) !== gt.mission) {
    console.error("verify-constants: mission string out of date — run: npm run apply:constants");
    fail = 1;
  }
  if (fs.existsSync(genTs)) {
    const ts = fs.readFileSync(genTs, "utf8");
    if (!ts.includes(c.organization.ein) || !ts.includes(String(c.physics.larmorHz))) {
      console.error("verify-constants: src/p31-constants-generated.ts missing EIN or larmor — run: npm run apply:constants");
      fail = 1;
    }
    const mvp = c.documentation?.mvpInventory;
    if (mvp && !ts.includes(mvp)) {
      console.error(
        "verify-constants: generated TS missing documentation.mvpInventory path — run: npm run apply:constants"
      );
      fail = 1;
    }
  } else {
    console.warn("verify-constants: warn — no", genTs, "(run apply:constants once)");
  }
  if (fail) {
    process.exit(1);
  }
  console.log("verify-constants: OK (aligned with p31-constants.json)");
}

main();
