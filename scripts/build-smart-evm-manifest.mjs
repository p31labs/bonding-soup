#!/usr/bin/env node
/**
 * Builds contracts/p31-smart-evm.json — SMART on-chain suite (ABIs via solcjs).
 *
 *   node scripts/build-smart-evm-manifest.mjs
 *
 * Uses `npx solc@0.8.24` (no global Foundry required for this step).
 * Full compile + tests: npm run verify:sovereign-chain (needs `forge`).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildStamp } from "./lib/build-stamp.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const srcDir = path.join(root, "packages", "p31-sovereign-chain", "src");
const dest = path.join(root, "contracts", "p31-smart-evm.json");

/** @type {{ letter: string, name: string, role: string }[]} */
const SUITE = [
  { letter: "S", name: "P31TransparencyAnchor", role: "Sovereign — append-only digest + URI commitments." },
  { letter: "M", name: "P31ManifestRegistry", role: "Manifest — stable manifest id → latest digest + URI head." },
  { letter: "A", name: "P31AccessAllowlist", role: "Access — owner-managed capability allowlist per address." },
  { letter: "R", name: "P31ContentRoot", role: "Root — owner-managed key → content CID (IPFS / Arweave)." },
  { letter: "T", name: "P31TreasuryConfig", role: "Treasury — Safe + USDC + home chain id; lockable." },
];

/**
 * @param {string} solPath
 * @param {string} contractName
 * @returns {any[]}
 */
function abiViaSolc(solPath, contractName) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "p31-solc-"));
  try {
    const r = spawnSync(
      "npx",
      ["--yes", "solc@0.8.24", "--abi", solPath, "-o", tmp],
      { encoding: "utf8", stdio: "pipe", shell: process.platform === "win32" },
    );
    if (r.status !== 0) {
      throw new Error((r.stderr || r.stdout || "").trim() || "solc failed");
    }
    const expect = `${contractName}_sol_${contractName}.abi`;
    const p = path.join(tmp, expect);
    let abiPath = fs.existsSync(p) ? p : null;
    if (!abiPath) {
      const files = fs.readdirSync(tmp).filter((f) => f.endsWith(".abi"));
      if (files.length === 1) abiPath = path.join(tmp, files[0]);
    }
    if (!abiPath || !fs.existsSync(abiPath)) {
      throw new Error(`solc output missing for ${contractName} (expected ${expect}, got ${fs.readdirSync(tmp).join(",")})`);
    }
    return JSON.parse(fs.readFileSync(abiPath, "utf8"));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

export function regenerateSmartEvmManifest(rootDir = root) {
  if (process.env.P31_SKIP_SMART_EVM_BUILD === "1") {
    console.log("build-smart-evm: skip (P31_SKIP_SMART_EVM_BUILD=1)");
    return;
  }
  const outPath = path.join(rootDir, "contracts", "p31-smart-evm.json");
  const contracts = [];
  for (const row of SUITE) {
    const solPath = path.join(srcDir, `${row.name}.sol`);
    if (!fs.existsSync(solPath)) {
      throw new Error(`build-smart-evm: missing ${path.relative(rootDir, solPath)}`);
    }
    const abi = abiViaSolc(solPath, row.name);
    contracts.push({
      letter: row.letter,
      name: row.name,
      source: `packages/p31-sovereign-chain/src/${row.name}.sol`,
      role: row.role,
      abi,
    });
  }

  const payload = {
    schema: "p31.evmContractSuite/0.1.0",
    suite: "SMART",
    suiteExpanded: "Sovereign · Manifest · Access · Root · Treasury",
    solidity: "0.8.24",
    package: "packages/p31-sovereign-chain",
    verifyScript: "verify:sovereign-chain",
    // No generatedAt: deterministic build for drift detection; git log is the audit trail.
    // (Same pattern as scripts/build-phos-voice-json.mjs line 205.)
    contracts,
  };
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log("build-smart-evm: wrote contracts/p31-smart-evm.json —", contracts.length, "contracts");
}

function main() {
  regenerateSmartEvmManifest();
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (invoked) main();
