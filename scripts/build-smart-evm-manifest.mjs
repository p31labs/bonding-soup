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
import crypto from "node:crypto";
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

/**
 * Source fingerprint = sha256 over (suite version + solidity pin + ordered .sol contents).
 * Stable for a given source set, so we can skip the 5× `npx solc@0.8.24` invocations
 * (~30-40s total) when nothing changed. Cached output stays bit-identical because the
 * generation is already deterministic (no generatedAt field).
 *
 * Bypass with P31_FORCE_SMART_EVM_BUILD=1 (forces full solc run regardless of cache).
 *
 * @param {string} rootDir
 * @returns {string}
 */
function computeSourceFingerprint(rootDir) {
  const h = crypto.createHash("sha256");
  h.update("p31.evmContractSuite/0.1.0\0");
  h.update("solidity:0.8.24\0");
  for (const row of SUITE) {
    const solPath = path.join(rootDir, "packages", "p31-sovereign-chain", "src", `${row.name}.sol`);
    if (!fs.existsSync(solPath)) {
      throw new Error(`build-smart-evm: missing ${path.relative(rootDir, solPath)}`);
    }
    h.update(row.letter + "\0" + row.name + "\0" + row.role + "\0");
    h.update(fs.readFileSync(solPath));
    h.update("\0");
  }
  return h.digest("hex");
}

export function regenerateSmartEvmManifest(rootDir = root) {
  if (process.env.P31_SKIP_SMART_EVM_BUILD === "1") {
    console.log("build-smart-evm: skip (P31_SKIP_SMART_EVM_BUILD=1)");
    return;
  }
  const outPath = path.join(rootDir, "contracts", "p31-smart-evm.json");
  const force = process.env.P31_FORCE_SMART_EVM_BUILD === "1";
  const sourceFingerprint = computeSourceFingerprint(rootDir);

  // Fast path: cached output present + fingerprint matches → skip the 5× npx solc calls.
  // This cut warm `npm run launch -- --full` from ~110s to ~70s (the build was a third of total).
  if (!force && fs.existsSync(outPath)) {
    try {
      const prev = JSON.parse(fs.readFileSync(outPath, "utf8"));
      if (
        prev &&
        prev.schema === "p31.evmContractSuite/0.1.0" &&
        prev.sourceFingerprint === sourceFingerprint &&
        Array.isArray(prev.contracts) &&
        prev.contracts.length === SUITE.length
      ) {
        console.log(
          "build-smart-evm: skip — fingerprint unchanged (" + prev.contracts.length + " contracts) → contracts/p31-smart-evm.json",
        );
        return;
      }
    } catch {
      // fall through and rebuild
    }
  }

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
    // sourceFingerprint enables the cache skip above (avoids 5× npx solc on every launch run).
    sourceFingerprint,
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
