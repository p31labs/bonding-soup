#!/usr/bin/env node
/**
 * Mirrors docs/p31-delta-language.json + docs/p31-delta-glossary.html into p31ca public/.
 * Hub glossary uses absolute JSON path. Run after editing the canonical docs:
 *   npm run sync:delta-language
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildDeltaLanguageHubStrings } from "./lib/build-delta-language-hub.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const p31caPublic = path.join(root, "andromeda", "04_SOFTWARE", "p31ca", "public");

function main() {
  if (!fs.existsSync(p31caPublic)) {
    console.log("sync-delta-language-p31ca: skip — no", path.relative(root, p31caPublic));
    return;
  }

  const { json, html } = buildDeltaLanguageHubStrings(root);
  const jsonDst = path.join(p31caPublic, "p31-delta-language.json");
  const htmlDst = path.join(p31caPublic, "delta-language.html");
  fs.writeFileSync(jsonDst, json, "utf8");
  fs.writeFileSync(htmlDst, html, "utf8");

  console.log(
    "sync-delta-language-p31ca: OK →",
    path.relative(root, jsonDst),
    "+",
    path.relative(root, htmlDst)
  );
}

main();
