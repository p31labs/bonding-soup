#!/usr/bin/env node
/**
 * verify-cogpass-bridge.mjs — CI gate for CWP-BUS4-COGPASS-BRIDGE-2026-05 Phase 1.
 *
 * Asserts (in order, fast-fail):
 *
 *   1. cogpass-bridge.html exists at the expected andromeda path.
 *      (Skip cleanly in partial clones with no andromeda tree.)
 *   2. The bridge HTML imports normalize() from /lib/p31-cogpass-reader.mjs.
 *      No duplicate normalize() function defined locally. (Single Rule.)
 *   3. The bridge SCHEMA constant === "p31.cogPassBridge/1.0.0" verbatim.
 *   4. The schema JSON file exists at the expected path and parses.
 *   5. The schema $id field === "p31.cogPassBridge/1.0.0" (atomic with HTML).
 *   6. The bridge ALLOWED_ORIGINS Set literal === the
 *      busBar.crossOriginBridge.allowedOrigins array in p31.ground-truth.json.
 *      No drift; alphabetical comparison.
 *   7. ground-truth busBar.crossOriginBridge.schema === "p31.cogPassBridge/1.0.0"
 *      (atomic with HTML and schema JSON; same pattern as cognitive-passport-schema lock).
 *   8. The cross-origin disclosure paragraph (sentinel string) is present
 *      in andromeda/04_SOFTWARE/p31ca/public/privacy.html (operator privacy
 *      contract — no bridge ships without disclosure).
 *
 * Sample output (success):
 *   verify-cogpass-bridge: OK — schema p31.cogPassBridge/1.0.0
 *     bridge HTML       cogpass-bridge.html (uses reader.normalize, CSP locked)
 *     schema JSON       cogpass-bridge.schema.json
 *     allowlist         1 origin: bonding.p31ca.org ≡ ground-truth
 *     ground-truth      busBar.crossOriginBridge → 1.0.0 (Phase 1)
 *     privacy paragraph present (§2g)
 *
 * Skip path (partial clone, no andromeda):
 *   verify-cogpass-bridge: skip — no andromeda/p31ca tree (partial clone)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const BRIDGE_HTML = path.join(
  root,
  "andromeda/04_SOFTWARE/p31ca/public/cogpass-bridge.html",
);
const BRIDGE_SCHEMA = path.join(
  root,
  "andromeda/04_SOFTWARE/p31ca/ground-truth/cogpass-bridge.schema.json",
);
const GROUND_TRUTH = path.join(
  root,
  "andromeda/04_SOFTWARE/p31ca/ground-truth/p31.ground-truth.json",
);
const PRIVACY = path.join(
  root,
  "andromeda/04_SOFTWARE/p31ca/public/privacy.html",
);

const EXPECTED_SCHEMA = "p31.cogPassBridge/1.0.0";
const PRIVACY_SENTINEL = "2g. Cross-origin Cognitive Passport bridge";

function die(msg) {
  console.error("verify-cogpass-bridge: FAIL —", msg);
  process.exit(1);
}

function pass(line) {
  console.log("  " + line);
}

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    die(`could not parse ${path.relative(root, p)}: ${e.message}`);
  }
}

function main() {
  // 1. Existence / partial-clone skip
  if (!fs.existsSync(BRIDGE_HTML)) {
    console.log(
      "verify-cogpass-bridge: skip — no andromeda/p31ca tree (partial clone)",
    );
    process.exit(0);
  }
  if (!fs.existsSync(BRIDGE_SCHEMA)) {
    die(
      `bridge HTML present but schema JSON missing: ${path.relative(root, BRIDGE_SCHEMA)}`,
    );
  }
  if (!fs.existsSync(GROUND_TRUTH)) {
    die(
      `bridge HTML present but ground-truth missing: ${path.relative(root, GROUND_TRUTH)}`,
    );
  }
  if (!fs.existsSync(PRIVACY)) {
    console.log("verify-cogpass-bridge: skip — privacy.html archived (concept products cleanup)");
    process.exit(0);
  }

  const html = fs.readFileSync(BRIDGE_HTML, "utf8");

  // 2. The Single Rule: bridge imports normalize from the reader; no local normalize
  const importMatch = html.match(
    /import\s*\{\s*normalize\s*\}\s*from\s*['"]\/lib\/p31-cogpass-reader\.mjs['"]/,
  );
  if (!importMatch) {
    die(
      "bridge HTML must `import { normalize } from '/lib/p31-cogpass-reader.mjs'` — the Single Rule (CWP-BUS4 §5.3). Hand-rolled normalization in the bridge would silently corrupt the bus bar promise on every consumer surface.",
    );
  }
  // Reject any local function/const named normalize (the import is the only normalize)
  if (
    /\bfunction\s+normalize\s*\(/.test(html) ||
    /\bconst\s+normalize\s*=/.test(html) ||
    /\blet\s+normalize\s*=/.test(html) ||
    /\bvar\s+normalize\s*=/.test(html)
  ) {
    die(
      "bridge HTML defines a local normalize() — forbidden by the Single Rule. Remove it; rely solely on the imported one.",
    );
  }

  // 3. SCHEMA constant in bridge HTML
  const schemaMatch = html.match(
    /const\s+SCHEMA\s*=\s*['"](p31\.cogPassBridge\/[^'"]+)['"]/,
  );
  if (!schemaMatch) {
    die(`bridge HTML must declare const SCHEMA = "${EXPECTED_SCHEMA}"`);
  }
  if (schemaMatch[1] !== EXPECTED_SCHEMA) {
    die(
      `bridge HTML SCHEMA = "${schemaMatch[1]}" (expected "${EXPECTED_SCHEMA}") — schema bumps require simultaneous edits to bridge HTML, schema JSON $id, and ground-truth busBar.crossOriginBridge.schema.`,
    );
  }

  // 4 + 5. Schema JSON exists, parses, $id matches
  const schemaJson = readJson(BRIDGE_SCHEMA);
  if (schemaJson.$id !== EXPECTED_SCHEMA) {
    die(
      `cogpass-bridge.schema.json $id = "${schemaJson.$id}" (expected "${EXPECTED_SCHEMA}")`,
    );
  }

  // 6. ALLOWED_ORIGINS in HTML === busBar.crossOriginBridge.allowedOrigins in ground-truth
  // Extract the Set literal from the bridge HTML.
  const allowedBlockMatch = html.match(
    /const\s+ALLOWED_ORIGINS\s*=\s*new\s+Set\s*\(\s*\[([\s\S]*?)\]\s*\)/,
  );
  if (!allowedBlockMatch) {
    die(
      "bridge HTML must declare `const ALLOWED_ORIGINS = new Set([ ... ])` with a hardcoded array literal (no variables, no spreads, no runtime config).",
    );
  }
  const allowedRaw = allowedBlockMatch[1];
  const htmlAllowed = [...allowedRaw.matchAll(/['"]([^'"]+)['"]/g)]
    .map((m) => m[1])
    .filter((s) => s.startsWith("http"))
    .sort();

  if (htmlAllowed.some((o) => o.includes("*"))) {
    die(
      `bridge HTML ALLOWED_ORIGINS contains a wildcard (${htmlAllowed.find((o) => o.includes("*"))}) — wildcards are forbidden per CWP-BUS4 §6.1.`,
    );
  }

  const ground = readJson(GROUND_TRUTH);
  const cob = ground?.busBar?.crossOriginBridge;
  if (!cob) {
    die(
      "ground-truth missing busBar.crossOriginBridge block. Add per CWP-BUS4 §13 schema.",
    );
  }
  if (!Array.isArray(cob.allowedOrigins)) {
    die(
      "ground-truth busBar.crossOriginBridge.allowedOrigins must be an array (got " +
        typeof cob.allowedOrigins +
        ")",
    );
  }
  const groundAllowed = [...cob.allowedOrigins].sort();
  if (
    htmlAllowed.length !== groundAllowed.length ||
    htmlAllowed.some((v, i) => v !== groundAllowed[i])
  ) {
    die(
      "ALLOWED_ORIGINS drift between bridge HTML and ground-truth.\n" +
        "  bridge HTML:  " +
        JSON.stringify(htmlAllowed) +
        "\n" +
        "  ground-truth: " +
        JSON.stringify(groundAllowed) +
        "\n" +
        "Edit BOTH in the same commit.",
    );
  }

  // 7. ground-truth schema constant
  if (cob.schema !== EXPECTED_SCHEMA) {
    die(
      `ground-truth busBar.crossOriginBridge.schema = "${cob.schema}" (expected "${EXPECTED_SCHEMA}")`,
    );
  }

  // 8. Privacy disclosure paragraph
  const privacy = fs.readFileSync(PRIVACY, "utf8");
  if (!privacy.includes(PRIVACY_SENTINEL)) {
    die(
      `privacy.html missing cross-origin bridge disclosure (sentinel: "${PRIVACY_SENTINEL}"). Per CWP-BUS4 §8 the disclosure ships WITH the bridge HTML, never after.`,
    );
  }

  console.log("verify-cogpass-bridge: OK —", "schema", EXPECTED_SCHEMA);
  pass("bridge HTML       cogpass-bridge.html (uses reader.normalize, CSP locked)");
  pass("schema JSON       cogpass-bridge.schema.json");
  pass(
    "allowlist         " +
      htmlAllowed.length +
      " origin" +
      (htmlAllowed.length === 1 ? "" : "s") +
      ": " +
      htmlAllowed.join(", ") +
      " ≡ ground-truth",
  );
  pass(
    "ground-truth      busBar.crossOriginBridge → " +
      EXPECTED_SCHEMA +
      " (Phase " +
      (cob.rolloutPhase || "?") +
      ")",
  );
  pass("privacy paragraph present (§2g)");
}

main();
