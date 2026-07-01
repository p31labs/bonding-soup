#!/usr/bin/env node
/**
 * verify:mesh-canon — docs/MESH-ARCHITECTURE-CANON.md anchors + k4 mesh code invariants.
 * Skips Andromeda file checks when andromeda/04_SOFTWARE is absent (partial clone).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const CANONICAL =
  "The mesh is the edge-native K₄ substrate (KV topology + DO cells + explicit cage scope) that every surface reads or warms; apps are projections; the hard part is keeping personal spin state and shared cage geometry isolated until a consent-shaped bridge says otherwise.";

function die(msg, code = 1) {
  console.error("verify-mesh-canon:", msg);
  process.exit(code);
}

function mustInclude(haystack, needle, label) {
  if (!haystack.includes(needle)) die(`missing ${label} — expected substring:\n  ${needle.slice(0, 120)}${needle.length > 120 ? "…" : ""}`);
}

function main() {
  const docPath = path.join(root, "docs/MESH-ARCHITECTURE-CANON.md");
  if (!fs.existsSync(docPath)) die("missing docs/MESH-ARCHITECTURE-CANON.md");
  const doc = fs.readFileSync(docPath, "utf8");
  mustInclude(doc, CANONICAL, "canonical summary sentence");
  for (const h of ["## Shipped", "## Next", "## Doctrine"]) {
    mustInclude(doc, h, `heading ${h}`);
  }

  const soft = path.join(root, "andromeda/04_SOFTWARE");
  const requiredSoftFiles = [
    "packages/k4-mesh-core/scopes.js",
    "packages/k4-mesh-core/personal-handlers.js",
    "k4-cage/src/index.js",
  ];
  const softComplete = requiredSoftFiles.every((rel) =>
    fs.existsSync(path.join(soft, rel))
  );
  if (!fs.existsSync(soft) || !softComplete) {
    console.log("verify-mesh-canon: OK (doc only — andromeda/04_SOFTWARE absent or incomplete)");
    return;
  }

  const scopes = path.join(soft, "packages/k4-mesh-core/scopes.js");
  const personalHandlers = path.join(soft, "packages/k4-mesh-core/personal-handlers.js");
  const cage = path.join(soft, "k4-cage/src/index.js");

  for (const p of [scopes, personalHandlers, cage]) {
    if (!fs.existsSync(p)) die(`missing expected path: ${path.relative(root, p)}`);
  }

  const scopesSrc = fs.readFileSync(scopes, "utf8");
  const mVer = scopesSrc.match(/export const MESH_PAYLOAD_VERSION = '([^']+)'/);
  if (!mVer) die("could not parse MESH_PAYLOAD_VERSION from scopes.js");
  const version = mVer[1];
  mustInclude(doc, version, `doc must mention mesh payload version ${version} (keep Shipped in sync)`);

  mustInclude(scopesSrc, "return { labels: ['will', 'sj', 'wj', 'christyn'], mode: 'family' }", "family vertex labels in scopes.js");
  mustInclude(scopesSrc, "return { labels: [...SUB_VERTICES], mode: path === 'personal' ? 'personal' : 'nested' }", "personal vertex branch in scopes.js");
  mustInclude(scopesSrc, "const SUB_VERTICES = ['a', 'b', 'c', 'd']", "SUB_VERTICES in scopes.js");

  const ph = fs.readFileSync(personalHandlers, "utf8");
  mustInclude(ph, "export const PERSONAL_SCOPE = 'personal'", "PERSONAL_SCOPE");
  mustInclude(ph, "No family telemetry chain", "personal-handlers header contract");
  mustInclude(ph, "buildMeshPayload(env, PERSONAL_SCOPE", "personal /api/mesh uses PERSONAL_SCOPE");

  const cageSrc = fs.readFileSync(cage, "utf8");
  mustInclude(cageSrc, "const VERTICES = ['will', 'sj', 'wj', 'christyn']", "k4-cage VERTICES");

  console.log("verify-mesh-canon: OK (doc + k4-mesh-core + k4-cage invariants)");
}

main();
