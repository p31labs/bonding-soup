#!/usr/bin/env node
/**
 * P31 home verification and optional p31ca build.
 *
 * - **Full tree** (`andromeda/04_SOFTWARE/p31ca` present): `npm run verify` at root, then
 *   p31ca `npm run verify` (prebuild + Astro build). Optional --content.
 * - **Home-only** (no p31ca): root `npm run verify` only (passport, constants, p31ca
 *   contracts + egg-hunt skip as implemented in those scripts) + tsc. No failure — hub
 *   build is skipped. Same as local partial clone.
 *
 * Root install: **npm** + `package-lock.json` in CI. `pnpm-lock.yaml` at repo root is not used here.
 *
 * Flags:
 *   --content, -c     Run hub:about:generate + hub:about:enrich before p31ca build (mutates public/*-about.html)
 *   --skip-soup-tsc   Skip root `npm run build` (tsc only for bonding-soup)
 *   --skip-install    Do not run npm install / npm ci in p31ca
 *   --install, -i     (local) Force `npm install` in p31ca even if node_modules exists
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const p31ca = path.join(root, "andromeda/04_SOFTWARE/p31ca");

const args = new Set(process.argv.slice(2));
const withContent = args.has("--content") || args.has("-c");
const skipRootTsc = args.has("--skip-soup-tsc");
const skipInstall = args.has("--skip-install");
const forceInstall = args.has("--install") || args.has("-i");
const isCI = process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";
const hasP31ca = fs.existsSync(p31ca);

function run(title, command, cwd = root) {
  console.log(`\n\x1b[36m▶\x1b[0m ${title}`);
  execSync(command, { cwd, stdio: "inherit", env: process.env });
}

function main() {
  if (isCI) {
    run("root: npm ci (workspace)", "npm ci", root);
  }

  if (!skipRootTsc) {
    run(
      "Root verify (passport + constants + p31ca-contracts + quantum egg + tsc)",
      "npm run verify",
      root
    );
  } else {
    run("Passport mirror (root → p31ca)", "npm run verify:passport", root);
    run("P31 constants vs ground-truth", "npm run verify:constants", root);
    run("p31ca contracts (ground-truth + synergetic)", "npm run verify:p31ca-contracts", root);
    run("quantum egg hunt (manifest + Larmor)", "npm run verify:egg-hunt", root);
  }

  if (!hasP31ca) {
    console.log(
      "\n\x1b[33m▶\x1b[0m p31-ci: no " +
        path.relative(root, p31ca) +
        " — skipped hub install + Astro build (home-only or partial clone). " +
        "Clone Andromeda under andromeda/ for the full chain.\n"
    );
    console.log("\n\x1b[32m✓ p31 ci complete (home)\x1b[0m\n");
    return;
  }

  if (!skipInstall) {
    if (isCI) {
      run("p31ca: npm ci", "npm ci", p31ca);
    } else if (forceInstall || !fs.existsSync(path.join(p31ca, "node_modules"))) {
      run("p31ca: npm install", "npm install", p31ca);
    }
  }

  if (withContent) {
    run("p31ca hub about (generate + enrich)", "npm run hub:about:generate && npm run hub:about:enrich", p31ca);
  }

  run("p31ca verify (passport:verify + prebuild + astro build)", "npm run verify", p31ca);
  console.log("\n\x1b[32m✓ p31 ci complete (full)\x1b[0m\n");
}

main();
