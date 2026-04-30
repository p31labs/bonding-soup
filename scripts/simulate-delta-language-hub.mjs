#!/usr/bin/env node
/**
 * Compare canonical DELTA hub artifacts (from docs/) to p31ca/public without writing.
 * Skips: no p31ca tree, missing hub files, P31_SKIP_DELTA_HUB_SIMULATE=1.
 * Soft: P31_DELTA_HUB_SIMULATE_SOFT=1 → print drift, exit 0.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildDeltaLanguageHubStrings, normNl } from "./lib/build-delta-language-hub.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const p31caPublic = path.join(root, "andromeda", "04_SOFTWARE", "p31ca", "public");

function main() {
  if (process.env.P31_SKIP_DELTA_HUB_SIMULATE === "1") {
    console.log("simulate-delta-language-hub: skip — P31_SKIP_DELTA_HUB_SIMULATE=1");
    return;
  }
  if (!fs.existsSync(p31caPublic)) {
    console.log("simulate-delta-language-hub: skip — no p31ca public");
    return;
  }

  const hubJson = path.join(p31caPublic, "p31-delta-language.json");
  const hubHtml = path.join(p31caPublic, "delta-language.html");
  if (!fs.existsSync(hubJson) || !fs.existsSync(hubHtml)) {
    console.log("simulate-delta-language-hub: skip — hub DELTA files missing (run sync:delta-language)");
    return;
  }

  let expected;
  try {
    expected = buildDeltaLanguageHubStrings(root);
  } catch (e) {
    console.error("simulate-delta-language-hub:", e instanceof Error ? e.message : e);
    process.exit(1);
    return;
  }

  const actualJson = normNl(fs.readFileSync(hubJson, "utf8"));
  const actualHtml = normNl(fs.readFileSync(hubHtml, "utf8"));
  const drift = [];
  if (actualJson.trimEnd() !== expected.json.trimEnd()) {
    drift.push("p31-delta-language.json");
  }
  if (actualHtml !== expected.html) {
    drift.push("delta-language.html");
  }

  const soft = process.env.P31_DELTA_HUB_SIMULATE_SOFT === "1";
  if (drift.length === 0) {
    console.log("simulate-delta-language-hub: OK — hub matches canonical DELTA build");
    return;
  }
  console.error("simulate-delta-language-hub: DRIFT —", drift.join(", "));
  console.error("  Repair: npm run sync:delta-language");
  if (!soft) process.exit(1);
}

main();
