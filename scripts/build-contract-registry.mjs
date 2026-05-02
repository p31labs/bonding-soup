#!/usr/bin/env node
/**
 * Builds contracts/p31.contractRegistry.json from p31-alignment.json sources (JSON artifacts)
 * + schema extraction, merges SMART EVM suite from contracts/p31-smart-evm.json (refreshed via solc).
 * Mirrors to p31ca public/ when present.
 *
 *   node scripts/build-contract-registry.mjs           # write
 *   node scripts/build-contract-registry.mjs --print   # stdout summary only
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { regenerateSmartEvmManifest } from "./build-smart-evm-manifest.mjs";
import { buildStamp } from "./lib/build-stamp.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const OUT_REL = path.join("contracts", "p31-contract-registry.json");
const ALIGN_REL = "p31-alignment.json";

/**
 * @param {string} absPath
 * @param {string} relPath
 * @returns {{ schemas: string[] }}
 */
function extractSchemas(absPath, relPath) {
  const raw = fs.readFileSync(absPath, "utf8");
  let j;
  try {
    j = JSON.parse(raw);
  } catch {
    return { schemas: [] };
  }
  const schemas = [];
  if (typeof j.schema === "string") schemas.push(j.schema);

  if (relPath === "p31-constants.json" || relPath.endsWith("/p31-constants.json")) {
    if (j.cognitivePassport?.jsonSchema) schemas.push(j.cognitivePassport.jsonSchema);
    if (j.integrations?.schema) schemas.push(j.integrations.schema);
    if (j.groundTruth?.schema) schemas.push(j.groundTruth.schema);
  }

  if (typeof j.$id === "string") {
    const m = j.$id.match(/(p31\.[a-zA-Z][a-zA-Z0-9._-]*\/[0-9.]+)/);
    if (m) schemas.push(m[1]);
  }
  if (j.properties?.schema?.const && typeof j.properties.schema.const === "string") {
    schemas.push(j.properties.schema.const);
  }

  return { schemas: [...new Set(schemas)] };
}

/**
 * @param {any[]} derivations
 * @param {string} relPath
 * @returns {string[]}
 */
function verifyHintsForPath(derivations, relPath) {
  const hints = [];
  for (const d of derivations || []) {
    const from = d.from || [];
    if (!from.includes(relPath) || !d.verify) continue;
    for (const part of String(d.verify).split("&&")) {
      const p = part.trim();
      if (p.startsWith("npm run ")) hints.push(p.slice("npm run ".length).trim());
      else if (p.length) hints.push(p);
    }
  }
  return [...new Set(hints)];
}

export function buildContractRegistryPayload(rootDir) {
  const alignPath = path.join(rootDir, ALIGN_REL);
  if (!fs.existsSync(alignPath)) {
    throw new Error(`missing ${ALIGN_REL}`);
  }
  const alignment = JSON.parse(fs.readFileSync(alignPath, "utf8"));
  const derivations = alignment.derivations || [];
  const contracts = [];

  for (const s of alignment.sources || []) {
    const rel = s.path;
    if (!rel || typeof rel !== "string") continue;
    if (!rel.endsWith(".json")) continue;
    const abs = path.join(rootDir, rel);
    if (!fs.existsSync(abs)) {
      if (s.optional) continue;
      continue;
    }
    const { schemas } = extractSchemas(abs, rel);
    const verifyHints = verifyHintsForPath(derivations, rel);
    contracts.push({
      id: s.id,
      path: rel,
      role: typeof s.role === "string" ? s.role : "",
      schemas,
      primarySchema: schemas[0] || null,
      verifyHints,
      optional: Boolean(s.optional),
    });
  }

  contracts.sort((a, b) => (a.primarySchema || a.path).localeCompare(b.primarySchema || b.path));

  /** @type {Record<string, unknown>} */
  const builder = {
    uiPath: "/contract-builder.html",
    shortPath: "/contracts",
    anchor: "p31.contractBuilder/0.1.0",
    note: "JSON rows from p31-alignment.json; EVM SMART suite from contracts/p31-smart-evm.json — npm run build:contract-registry",
    smartSuite: "SMART",
    smartSuiteExpanded: "Sovereign · Manifest · Access · Root · Treasury",
  };

  /** @type {Record<string, unknown>} */
  const payload = {
    schema: "p31.contractRegistry/1.0.0",
    version: "1.0.0",
    // No generatedAt: deterministic build for drift detection; git log is the audit trail.
    // (Same pattern as scripts/build-phos-voice-json.mjs line 205.)
    builder,
    count: contracts.length,
    contracts,
  };

  const evmPath = path.join(rootDir, "contracts", "p31-smart-evm.json");
  if (fs.existsSync(evmPath)) {
    let evm;
    try {
      evm = JSON.parse(fs.readFileSync(evmPath, "utf8"));
    } catch (e) {
      throw new Error(`contracts/p31-smart-evm.json: ${e.message}`);
    }
    if (evm.schema !== "p31.evmContractSuite/0.1.0" || !Array.isArray(evm.contracts)) {
      throw new Error("contracts/p31-smart-evm.json must be p31.evmContractSuite/0.1.0 with contracts[]");
    }
    payload.evm = evm;
    payload.evmContractCount = evm.contracts.length;
  }

  return payload;
}

function writeOutputs(payload) {
  const outAbs = path.join(root, OUT_REL);
  fs.mkdirSync(path.dirname(outAbs), { recursive: true });
  const body = JSON.stringify(payload, null, 2) + "\n";
  fs.writeFileSync(outAbs, body, "utf8");
  console.log("build-contract-registry: wrote", OUT_REL, `(${payload.count} contracts)`);

  const hubPub = path.join(root, "andromeda", "04_SOFTWARE", "p31ca", "public", "p31-contract-registry.json");
  if (fs.existsSync(path.dirname(hubPub))) {
    fs.writeFileSync(hubPub, body, "utf8");
    console.log("build-contract-registry: mirrored →", path.relative(root, hubPub));
  }
}

function printSummary(payload) {
  const evmN = payload.evm && Array.isArray(payload.evm.contracts) ? payload.evm.contracts.length : 0;
  console.log(`p31.contractRegistry — ${payload.count} JSON contracts + ${evmN} EVM (SMART)\n`);
  for (const c of payload.contracts) {
    const sch = c.primarySchema || "(no top-level schema extracted)";
    console.log(`  ${sch}`);
    console.log(`    path: ${c.path}`);
    if (c.verifyHints.length) console.log(`    verify: ${c.verifyHints.join(" · ")}`);
  }
}

function main() {
  const printOnly = process.argv.includes("--print");
  regenerateSmartEvmManifest(root);
  const payload = buildContractRegistryPayload(root);
  if (printOnly) {
    printSummary(payload);
    return;
  }
  writeOutputs(payload);
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (invoked) main();
