#!/usr/bin/env node
/**
 * Mirrors docs/p31-delta-language.json + docs/p31-delta-glossary.html into p31ca public/.
 * Hub glossary uses absolute JSON path. Run after editing the canonical docs:
 *   npm run sync:delta-language
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const p31caPublic = path.join(root, "andromeda", "04_SOFTWARE", "p31ca", "public");

function main() {
  const jsonSrc = path.join(root, "docs", "p31-delta-language.json");
  const htmlSrc = path.join(root, "docs", "p31-delta-glossary.html");
  if (!fs.existsSync(jsonSrc)) {
    console.error("sync-delta-language-p31ca: missing", jsonSrc);
    process.exit(1);
  }
  if (!fs.existsSync(htmlSrc)) {
    console.error("sync-delta-language-p31ca: missing", htmlSrc);
    process.exit(1);
  }
  if (!fs.existsSync(p31caPublic)) {
    console.log("sync-delta-language-p31ca: skip — no", path.relative(root, p31caPublic));
    return;
  }

  const jsonDst = path.join(p31caPublic, "p31-delta-language.json");
  fs.copyFileSync(jsonSrc, jsonDst);

  let html = fs.readFileSync(htmlSrc, "utf8");
  html = html.replace(
    /<meta\s+name="p31-delta-json-href"\s+content="[^"]*"\s*\/?>/,
    '<meta name="p31-delta-json-href" content="/p31-delta-language.json" />'
  );
  html = html.replace(
    `<a id="delta-spec-md" href="./P31-DELTA-LANGUAGE.md">`,
    `<a id="delta-spec-md" href="https://github.com/p31labs/bonding-soup/blob/main/docs/P31-DELTA-LANGUAGE.md">`
  );
  const htmlDst = path.join(p31caPublic, "delta-language.html");
  fs.writeFileSync(htmlDst, html, "utf8");

  console.log(
    "sync-delta-language-p31ca: OK →",
    path.relative(root, jsonDst),
    "+",
    path.relative(root, htmlDst)
  );
}

main();
