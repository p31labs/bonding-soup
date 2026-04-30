#!/usr/bin/env node
/**
 * P31 home verification and optional p31ca build.
 *
 * - **k4-personal:** after root `verify`, if `andromeda/04_SOFTWARE/k4-personal` exists,
 *   runs `verify-k4-personal.mjs` then `verify-mesh-live.mjs`. In **CI**, `MESH_LIVE_STRICT=1`
 *   (fails if prod URL in `p31-constants.json` does not serve /api/health + /api/mesh).
 *   Locally, strict defaults **off** unless `MESH_LIVE_STRICT=1` or you run `npm run verify:mesh`.
 * - **Full tree** (`andromeda/04_SOFTWARE/p31ca` present): `npm run verify` at root, then
 *   p31ca `npm run verify` (prebuild + Astro build). Optional --content.
 * - **Home-only** (no p31ca): root `npm run verify` only (alignment, facts, p31-env, passport, constants, ecosystem, map pipeline, p31-style; p31ca-contracts/egg-hunt skip inside scripts when missing;
 *   doc index + **verify:simplex** + **verify:simplex-email** + **verify:simplex-bootstrap** + tsc + soup:prep:check). No hub build. Same as local partial clone.
 *
 * Root install: **npm** + `package-lock.json` in CI. `pnpm-lock.yaml` at repo root is not used here.
 *
 * Flags:
 *   --content, -c     Run hub:about:generate + hub:about:enrich before p31ca build (mutates public/*-about.html)
 *   --security, -s    After p31ca `verify`, run p31ca `security:check` (B+C+E; Phase A skipped — verify already ran)
 *   --no-security     In CI, skip the security suite (p31ca must exist; rare escape hatch)
 *   --skip-soup-tsc   Skip root `npm run build` (tsc only for bonding-soup); root verify subset adds **`verify:delta-language`** + **`verify:public-voice`** + **`verify:atmosphere-ramp`** after **`verify:fleet-portal`**
 *   --skip-install    Do not run npm install / npm ci in p31ca
 *   --install, -i     (local) Force `npm install` in p31ca even if node_modules exists
 *   --skip-root-verify   Skip `npm run verify` (split CI: a prior job already passed it)
 *   --skip-npm-ci        Skip root `npm ci` (split CI: a prior step already ran it)
 *
 * In **CI** (GITHUB_ACTIONS/CI), when p31ca is present, the security suite runs after hub verify unless
 * `--no-security` is set.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const p31ca = path.join(root, "andromeda/04_SOFTWARE/p31ca");
const k4Personal = path.join(root, "andromeda/04_SOFTWARE/k4-personal");

const args = new Set(process.argv.slice(2));
const withContent = args.has("--content") || args.has("-c");
const withSecurity =
  (args.has("--security") || args.has("-s")) &&
  !args.has("--no-security");
const skipRootTsc = args.has("--skip-soup-tsc");
const skipRootVerify = args.has("--skip-root-verify");
const skipRootNpmCi = args.has("--skip-npm-ci");
const skipInstall = args.has("--skip-install");
const forceInstall = args.has("--install") || args.has("-i");
const isCI = process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";
/** In CI, gate on live k4-personal unless explicitly disabled */
const strictMeshDefault = isCI ? "1" : "0";
const hasP31ca = fs.existsSync(p31ca);
/** After hub verify, run p31ca `security:check` (B+C+E; skip-A). On in CI when p31ca exists; local needs `--security`. */
const runSecuritySuite =
  hasP31ca && !args.has("--no-security") && (withSecurity || isCI);

function run(title, command, cwd = root, extraEnv) {
  console.log(`\n\x1b[36m▶\x1b[0m ${title}`);
  const env = extraEnv ? { ...process.env, ...extraEnv } : process.env;
  execSync(command, { cwd, stdio: "inherit", env });
}

function maybeK4Personal() {
  if (!fs.existsSync(k4Personal)) {
    return;
  }
  run("k4-personal bundle (wrangler dry-run)", "node scripts/verify-k4-personal.mjs", root);
  const strict =
    process.env.MESH_LIVE_STRICT !== undefined
      ? process.env.MESH_LIVE_STRICT
      : strictMeshDefault;
  run(
    `mesh live vs p31-constants (MESH_LIVE_STRICT=${strict})`,
    "node scripts/verify-mesh-live.mjs",
    root,
    { MESH_LIVE_STRICT: strict }
  );
}

function main() {
  if (isCI && !skipRootNpmCi) {
    run("root: npm ci (workspace)", "npm ci", root);
  } else if (isCI && skipRootNpmCi) {
    console.log("\n\x1b[36m▶\x1b[0m p31-ci: skip root npm ci (--skip-npm-ci; workflow preflight already installed deps)\n");
  }

  if (!skipRootVerify) {
    if (!skipRootTsc) {
      run(
        "Root verify (full ship bar — see root package.json `verify`)",
        "npm run verify",
        root
      );
    } else {
      run("Passport mirror (root → p31ca)", "npm run verify:passport", root);
      run("P31 constants vs ground-truth", "npm run verify:constants", root);
      run("p31ca contracts (ground-truth + synergetic)", "npm run verify:p31ca-contracts", root);
      run("quantum egg hunt (manifest + Larmor)", "npm run verify:egg-hunt", root);
      run("planetary onboard (threshold HTML anchors)", "npm run verify:onboarding", root);
      run("fleet portal (ATC + glass strip anchors)", "npm run verify:fleet-portal", root);
      run("DELTA lexicon JSON (+ hub mirror when present)", "npm run verify:delta-language", root);
      run("PUBLIC voice Tier B/C guardrails", "npm run verify:public-voice", root);
      run("Atmosphere ramp + routes vs canon", "npm run verify:atmosphere-ramp", root);
    }
  } else {
    console.log(
      "\n\x1b[36m▶\x1b[0m p31-ci: skip root verify (--skip-root-verify; preflight or split CI job already passed `npm run verify`)\n"
    );
  }

  maybeK4Personal();

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

  if (runSecuritySuite) {
    run(
      "p31ca security suite (SCA + workers/CORS + crypto; Phase A skipped — verify already passed)",
      "npm run security:check",
      p31ca
    );
  }

  const tail =
    runSecuritySuite ? " (hub + security)\n" : " (full)\n";
  console.log("\n\x1b[32m✓ p31 ci complete" + tail);
}

main();
