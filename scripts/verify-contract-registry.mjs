#!/usr/bin/env node
/**
 * Ensures contracts/p31-contract-registry.json matches generator output from p31-alignment.json.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildContractRegistryPayload } from "./build-contract-registry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const OUT = path.join(root, "contracts", "p31-contract-registry.json");

function stableStringify(obj) {
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) return `[${obj.map(stableStringify).join(",")}]`;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => JSON.stringify(k) + ":" + stableStringify(obj[k])).join(",")}}`;
}

function stripVolatileRegistry(obj) {
  const o = JSON.parse(JSON.stringify(obj));
  delete o.generatedAt;
  if (o.evm && typeof o.evm === "object") delete o.evm.generatedAt;
  return o;
}

function main() {
  const expected = stripVolatileRegistry(buildContractRegistryPayload(root));
  if (!fs.existsSync(OUT)) {
    console.error("verify-contract-registry: missing contracts/p31-contract-registry.json — run: npm run build:contract-registry");
    process.exit(1);
  }
  const disk = stripVolatileRegistry(JSON.parse(fs.readFileSync(OUT, "utf8")));
  if (disk.schema !== "p31.contractRegistry/1.0.0") {
    console.error("verify-contract-registry: bad schema on disk", disk.schema);
    process.exit(1);
  }
  if (stableStringify(expected) !== stableStringify(disk)) {
    console.error("verify-contract-registry: drift — run: npm run build:contract-registry");
    process.exit(1);
  }

  const hubPub = path.join(root, "andromeda", "04_SOFTWARE", "p31ca", "public", "p31-contract-registry.json");
  if (fs.existsSync(hubPub)) {
    const hub = stripVolatileRegistry(JSON.parse(fs.readFileSync(hubPub, "utf8")));
    if (stableStringify(expected) !== stableStringify(hub)) {
      console.error("verify-contract-registry: hub public mirror drift — run: npm run build:contract-registry");
      process.exit(1);
    }
  }

  const evmC = disk.evmContractCount ?? (disk.evm && disk.evm.contracts ? disk.evm.contracts.length : 0);
  console.log("verify-contract-registry: OK —", disk.count, "JSON +", evmC, "EVM");
}

main();
