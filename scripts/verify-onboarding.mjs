#!/usr/bin/env node
/**
 * Threshold onboarding — structural checks on public/planetary-onboard.html
 * (four doors, key links, room-code path, WebAuthn API string for CI presence).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const htmlPath = path.join(root, "andromeda", "04_SOFTWARE", "p31ca", "public", "planetary-onboard.html");

const MUST = [
  "id=\"door-understand\"",
  "id=\"door-use\"",
  "id=\"door-build\"",
  "id=\"door-know\"",
  "data-door=\"understand\"",
  "PublicKeyCredential",
  "bonding.p31ca.org",
  "github.com/p31labs",
  "p31ca.org/passport",
  "42-1888158",
];

function die(msg) {
  console.error("verify-onboarding:", msg);
  process.exit(1);
}

function main() {
  if (!fs.existsSync(htmlPath)) {
    console.log("verify-onboarding: skip — no", path.relative(root, htmlPath));
    process.exit(0);
  }
  const body = fs.readFileSync(htmlPath, "utf8");
  for (const frag of MUST) {
    if (!body.includes(frag)) {
      die(`missing required anchor: ${JSON.stringify(frag)}`);
    }
  }

  console.log("verify-onboarding: OK");
}

main();
