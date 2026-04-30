#!/usr/bin/env node
/**
 * Validates docs/p31-delta-language.json shape and keeps hub mirrors in sync when p31ca exists.
 *   npm run verify:delta-language
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildDeltaLanguageHubStrings } from "./lib/build-delta-language-hub.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function die(msg) {
  console.error("verify-delta-language:", msg);
  process.exit(1);
}

function loadJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    die(`${path.relative(root, p)}: ${e.message}`);
  }
}

function main() {
  const mdPath = path.join(root, "docs", "P31-DELTA-LANGUAGE.md");
  const jsonPath = path.join(root, "docs", "p31-delta-language.json");
  const glossaryPath = path.join(root, "docs", "p31-delta-glossary.html");

  if (!fs.existsSync(mdPath)) die(`missing ${path.relative(root, mdPath)}`);
  if (!fs.existsSync(jsonPath)) die(`missing ${path.relative(root, jsonPath)}`);
  if (!fs.existsSync(glossaryPath)) die(`missing ${path.relative(root, glossaryPath)}`);

  const reg = loadJson(jsonPath);
  if (reg.schema !== "p31.deltaLanguage/1.0.0") die(`expected schema p31.deltaLanguage/1.0.0`);
  if (!reg.version || typeof reg.version !== "string") die("registry.version required");

  const terms = reg.terms;
  if (!Array.isArray(terms) || terms.length < 25) die("terms[] must have at least 25 entries");
  const ids = new Set();
  for (const t of terms) {
    if (!t.id || !t.label || !t.group || !t.definition) die(`term missing id/label/group/definition: ${JSON.stringify(t)}`);
    if (ids.has(t.id)) die(`duplicate term id: ${t.id}`);
    ids.add(t.id);
  }

  const anchors = reg.anchors;
  if (!Array.isArray(anchors) || anchors.length < 3) die("anchors[] must have at least 3 entries");
  for (const a of anchors) {
    if (!a.id || !a.label || !a.definition) die(`anchor missing id/label/definition: ${JSON.stringify(a)}`);
  }

  const forbidden = reg.forbidden;
  if (!Array.isArray(forbidden) || forbidden.length < 2) die("forbidden[] must have at least 2 rows");

  const phrases = reg.surfacePhrases;
  if (!Array.isArray(phrases) || phrases.length < 2) die("surfacePhrases[] must list multiple surfaces");

  const md = fs.readFileSync(mdPath, "utf8");
  if (!md.includes("docs/p31-delta-language.json")) die("P31-DELTA-LANGUAGE.md must cite docs/p31-delta-language.json");
  if (!md.includes(reg.version)) die(`prose version must mention registry version ${reg.version}`);

  const glossary = fs.readFileSync(glossaryPath, "utf8");
  if (!glossary.includes('name="p31-delta-json-href"')) die("glossary must include meta p31-delta-json-href");
  if (!glossary.includes("p31-delta-language.json")) die("glossary meta must reference p31-delta-language.json");

  const hubJson = path.join(root, "andromeda", "04_SOFTWARE", "p31ca", "public", "p31-delta-language.json");
  const hubHtml = path.join(root, "andromeda", "04_SOFTWARE", "p31ca", "public", "delta-language.html");

  const hubJsonExists = fs.existsSync(hubJson);
  const hubHtmlExists = fs.existsSync(hubHtml);
  if (hubJsonExists || hubHtmlExists) {
    const { json: expJson, html: expHtml } = buildDeltaLanguageHubStrings(root);
    if (hubJsonExists) {
      const hubTxt = fs.readFileSync(hubJson, "utf8").replace(/\r\n/g, "\n").trimEnd();
      if (expJson.trimEnd() !== hubTxt) {
        die("hub p31-delta-language.json differs from docs — run: npm run sync:delta-language");
      }
    }
    if (hubHtmlExists) {
      const hh = fs.readFileSync(hubHtml, "utf8").replace(/\r\n/g, "\n");
      if (hh !== expHtml) {
        die("hub delta-language.html differs from sync output — run: npm run sync:delta-language");
      }
    }
  }

  console.log(
    "verify-delta-language: OK —",
    terms.length,
    "terms,",
    anchors.length,
    "anchors, schema",
    reg.schema
  );
}

main();
