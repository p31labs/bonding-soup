#!/usr/bin/env node
/**
 * Compiles and tests packages/p31-sovereign-chain with Foundry when `forge` is available.
 * Skip (exit 0) when forge is missing unless P31_SOVEREIGN_CHAIN_STRICT=1.
 *
 * CI: install foundry-rs/foundry-toolchain before `npm run verify`.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const pkg = path.join(root, "packages", "p31-sovereign-chain");

function hasForge() {
  const r = spawnSync("forge", ["--version"], { encoding: "utf8" });
  return r.status === 0;
}

function run(cwd, args, inherit = true) {
  return spawnSync(args[0], args.slice(1), {
    cwd,
    stdio: inherit ? "inherit" : "pipe",
    encoding: "utf8",
  });
}

function ensureForgeStd() {
  const marker = path.join(pkg, "lib", "forge-std", "src", "Test.sol");
  if (fs.existsSync(marker)) return true;
  const inst = run(pkg, ["forge", "install", "foundry-rs/forge-std@v1.9.4", "--no-commit"], true);
  return inst.status === 0;
}

function validateManifest() {
  const p = path.join(root, "p31-chain-anchor.json");
  if (!fs.existsSync(p)) {
    console.error("verify-sovereign-chain: missing p31-chain-anchor.json");
    return false;
  }
  let j;
  try {
    j = JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    console.error("verify-sovereign-chain: invalid JSON in p31-chain-anchor.json", e.message);
    return false;
  }
  if (j.schema !== "p31.chainAnchor/0.1.0") {
    console.error("verify-sovereign-chain: p31-chain-anchor.json schema must be p31.chainAnchor/0.1.0");
    return false;
  }
  const hasContracts =
    Array.isArray(j.contracts) &&
    j.contracts.length > 0 &&
    j.contracts.every((c) => c && typeof c.name === "string");
  if ((!j.contract?.name && !hasContracts) || !Array.isArray(j.networks)) {
    console.error("verify-sovereign-chain: manifest must include contract.name or contracts[] and networks[]");
    return false;
  }
  return true;
}

function main() {
  if (process.env.P31_SKIP_SOVEREIGN_CHAIN === "1") {
    console.log("verify-sovereign-chain: skip (P31_SKIP_SOVEREIGN_CHAIN=1)");
    process.exit(0);
  }

  if (!validateManifest()) process.exit(1);

  if (!fs.existsSync(pkg)) {
    console.error("verify-sovereign-chain: missing packages/p31-sovereign-chain");
    process.exit(1);
  }

  if (!hasForge()) {
    const msg =
      "verify-sovereign-chain: forge not found — install https://book.getfoundry.sh or set P31_SKIP_SOVEREIGN_CHAIN=1";
    if (process.env.P31_SOVEREIGN_CHAIN_STRICT === "1") {
      console.error(msg);
      process.exit(1);
    }
    console.log(msg + " (non-strict skip)");
    process.exit(0);
  }

  if (!ensureForgeStd()) {
    console.error("verify-sovereign-chain: forge install forge-std failed");
    process.exit(1);
  }

  const build = run(pkg, ["forge", "build"], true);
  if (build.status !== 0) process.exit(build.status ?? 1);

  const test = run(pkg, ["forge", "test", "-vv"], true);
  if (test.status !== 0) process.exit(test.status ?? 1);

  console.log("verify-sovereign-chain: OK — forge build + test");
  process.exit(0);
}

main();
