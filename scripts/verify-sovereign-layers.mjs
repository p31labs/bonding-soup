#!/usr/bin/env node
/**
 * Validates p31-sovereign-layers.json (p31.sovereignLayers/0.1.0).
 * Ensures every layer with status "shipped" has existing repoPaths (when listed).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const MANIFEST = path.join(root, "p31-sovereign-layers.json");

const ALLOWED_STATUS = new Set(["shipped", "partial", "planned"]);
const ALLOWED_KIND = new Set([
  "compute-storage",
  "chain-commitment",
  "chain-pointer",
  "distribution",
  "identity",
  "payments-fiat",
  "payments-chain",
  "storage-decentralized",
  "governance",
  "observability",
]);

function main() {
  if (!fs.existsSync(MANIFEST)) {
    console.error("verify-sovereign-layers: missing p31-sovereign-layers.json");
    process.exit(1);
  }
  let data;
  try {
    data = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  } catch (e) {
    console.error("verify-sovereign-layers: invalid JSON", e.message);
    process.exit(1);
  }

  if (data.schema !== "p31.sovereignLayers/0.1.0") {
    console.error("verify-sovereign-layers: schema must be p31.sovereignLayers/0.1.0");
    process.exit(1);
  }
  if (!Array.isArray(data.layers) || data.layers.length < 8) {
    console.error("verify-sovereign-layers: layers[] must exist with full stack depth");
    process.exit(1);
  }
  const human = path.join(root, data.humanDoc || "");
  if (!data.humanDoc || !fs.existsSync(human)) {
    console.error("verify-sovereign-layers: humanDoc must exist:", data.humanDoc);
    process.exit(1);
  }

  const ids = new Set();
  let fail = 0;

  for (const L of data.layers) {
    if (!L.id || !L.title || !L.kind || !L.status) {
      console.error("verify-sovereign-layers: layer missing id/title/kind/status", L);
      fail = 1;
      continue;
    }
    if (ids.has(L.id)) {
      console.error("verify-sovereign-layers: duplicate layer id", L.id);
      fail = 1;
    }
    ids.add(L.id);
    if (!ALLOWED_STATUS.has(L.status)) {
      console.error("verify-sovereign-layers: bad status", L.id, L.status);
      fail = 1;
    }
    if (!ALLOWED_KIND.has(L.kind)) {
      console.error("verify-sovereign-layers: bad kind", L.id, L.kind);
      fail = 1;
    }
    if (!Array.isArray(L.primitives) || L.primitives.length === 0) {
      console.error("verify-sovereign-layers: primitives[] required", L.id);
      fail = 1;
    }
    if (!Array.isArray(L.repoPaths)) {
      console.error("verify-sovereign-layers: repoPaths must be array", L.id);
      fail = 1;
      continue;
    }
    if (L.status === "shipped") {
      for (const rel of L.repoPaths) {
        const p = path.join(root, rel);
        if (!fs.existsSync(p)) {
          console.error("verify-sovereign-layers: shipped layer missing path", L.id, rel);
          fail = 1;
        }
      }
    }
  }

  if (fail) process.exit(1);
  console.log("verify-sovereign-layers: OK —", data.layers.length, "layers");
  process.exit(0);
}

main();
