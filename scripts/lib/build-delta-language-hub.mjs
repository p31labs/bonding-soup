/**
 * Canonical DELTA lexicon payload as written by sync:delta-language → p31ca public/.
 * Single source for sync + verify + hub simulations.
 */
import fs from "node:fs";
import path from "node:path";

/** @param {string} s */
export function normNl(s) {
  return s.replace(/\r\n/g, "\n");
}

/**
 * @param {string} root — repo root (bonding-soup)
 * @returns {{ json: string, html: string }}
 */
export function buildDeltaLanguageHubStrings(root) {
  const jsonPath = path.join(root, "docs", "p31-delta-language.json");
  const glossaryPath = path.join(root, "docs", "p31-delta-glossary.html");
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`build-delta-language-hub: missing ${path.relative(root, jsonPath)}`);
  }
  if (!fs.existsSync(glossaryPath)) {
    throw new Error(`build-delta-language-hub: missing ${path.relative(root, glossaryPath)}`);
  }

  const json = normNl(fs.readFileSync(jsonPath, "utf8"));
  let html = normNl(fs.readFileSync(glossaryPath, "utf8"));
  html = html.replace(
    /<meta\s+name="p31-delta-json-href"\s+content="[^"]*"\s*\/?>/,
    '<meta name="p31-delta-json-href" content="/p31-delta-language.json" />'
  );
  html = html.replace(
    `<a id="delta-spec-md" href="./P31-DELTA-LANGUAGE.md">`,
    `<a id="delta-spec-md" href="https://github.com/p31labs/bonding-soup/blob/main/docs/P31-DELTA-LANGUAGE.md">`
  );
  return { json, html };
}
