#!/usr/bin/env node
/**
 * P31 "everything" gate — one command for the full local/CI bar:
 *  1. `p31-ci.mjs` with MESH_LIVE_STRICT=1 + `--security` (root verify, k4-personal + mesh, p31ca build, security B+C+E)
 *  2. `validate-p31-full.sh` — scorecard + extended audits (report under /tmp/p31_validation_report.json)
 *  3. p31ca `fleet:probe` — soft (non-fatal; matches p31-ci.yml fleet step)
 *  3b. `ecosystem-glass.mjs` — soft; live GETs in p31-ecosystem.json; report includes `skipped[]` for `skipIfEmpty`; writes /tmp/p31_glass_report.json
 *  4. Playwright E2E — (a) home **`npm run test:doc-library:e2e`** + **`npm run test:physics-learn:e2e`** + **`npm run test:k4market:smoke`** + **`npm run test:oqe-icosa:e2e`**;
 *     (b) p31ca if `playwright.config.ts` exists. Subprocess sets **CI=true**; p31ca uses `astro preview` so preview
 *     is not a stale 127.0.0.1:4321 from a prior run. Both respect **`--skip-e2e`**.
 *  5. p31ca `security:lint` — soft (script uses || true)
 *  6. Semgrep SAST — same rules as p31-security.yml sast job, if `semgrep` is on PATH (CI installs via workflow step)
 *
 * Flags: --skip-validate, --skip-fleet, --skip-e2e, --skip-sast, --skip-lint, --skip-ecosystem-glass
 * Env: P31_CI_USE_PREFLIGHT=1 — call p31-ci with --skip-root-verify --skip-npm-ci (GitHub Actions
 *   job 2 after job 1 already ran `npm ci` + `npm run verify`).
 * Env: P31_HUB_SIMULATIONS=1 — after home Playwright e2e, run npm run test:simulations (hub mirror dry-runs + wire fixtures).
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { resolveSemgrepBin } from "./resolve-semgrep-bin.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const p31ca = path.join(root, "andromeda/04_SOFTWARE/p31ca");

const args = new Set(process.argv.slice(2));
const skipValidate = args.has("--skip-validate");
const skipFleet = args.has("--skip-fleet");
const skipE2e = args.has("--skip-e2e");
const skipSast = args.has("--skip-sast");
const skipLint = args.has("--skip-lint");
const skipEcosystemGlass = args.has("--skip-ecosystem-glass");
const hasP31ca = fs.existsSync(p31ca);

const validateScript = path.join(root, "validate-p31-full.sh");

/**
 * @param {string} title
 * @param {string} command
 * @param {object} [opts]
 * @param {string} [opts.cwd]
 * @param {Record<string,string>} [opts.env]
 * @param {boolean} [opts.soft] non-fatal
 */
function run(title, command, opts = {}) {
  const { cwd = root, env, soft = false } = opts;
  const merged = env ? { ...process.env, ...env } : process.env;
  console.log(`\n\x1b[36m▶\x1b[0m ${title}`);
  try {
    execSync(command, { cwd, stdio: "inherit", env: merged, shell: true });
    return true;
  } catch (e) {
    if (soft) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`\x1b[33m⚠\x1b[0m ${title} — non-fatal: ${msg}`);
      return false;
    }
    throw e;
  }
}

function buildP31CiCommand() {
  const usePreflight = process.env.P31_CI_USE_PREFLIGHT === "1";
  if (usePreflight) {
    return "node scripts/p31-ci.mjs --security --skip-root-verify --skip-npm-ci";
  }
  return "node scripts/p31-ci.mjs --security";
}

function main() {
  const ciEnv = { MESH_LIVE_STRICT: "1" };
  run(
    "P31 CI (root verify, mesh, p31ca build, security)",
    buildP31CiCommand(),
    {
      env: ciEnv,
    }
  );

  if (!skipValidate) {
    if (!fs.existsSync(validateScript)) {
      throw new Error(`validate: missing ${validateScript}`);
    }
    run("validate-p31-full (mesh scorecard + audits)", `bash "${validateScript}"`);
  }

  if (hasP31ca && !skipFleet) {
    run("p31ca mesh fleet health probe (informational)", "npm run fleet:probe", { cwd: p31ca, soft: true });
  }

  if (!skipE2e) {
    const homeE2e = fs.existsSync(path.join(root, "scripts", "doc-library-e2e.mjs"));
    const p31caE2e = hasP31ca && fs.existsSync(path.join(p31ca, "playwright.config.ts"));
    if (homeE2e) {
      run("Playwright install (chromium) — home static e2e", "npx playwright install --with-deps chromium", { cwd: root });
      run("Doc library E2E (static server + /docs/doc-library/)", "npm run test:doc-library:e2e", {
        cwd: root,
        env: { ...process.env, CI: "true" },
      });
      const physE2e = fs.existsSync(path.join(root, "scripts", "physics-learn-e2e.mjs"));
      if (physE2e) {
        run("Physics learn E2E (static server + /docs/physics-learn/)", "npm run test:physics-learn:e2e", {
          cwd: root,
          env: { ...process.env, CI: "true" },
        });
      }
      const k4Smoke = fs.existsSync(path.join(root, "scripts", "k4market-smoke.mjs"));
      if (k4Smoke) {
        run("K4 market smoke (static server + p31ca k4market.html)", "npm run test:k4market:smoke", {
          cwd: root,
          env: { ...process.env, CI: "true" },
        });
      }
      const oqeE2e = fs.existsSync(path.join(root, "scripts", "oqe-icosa-e2e.mjs"));
      if (oqeE2e) {
        run("OQE icosa E2E (static server CWD p31ca/public + oqe-icosa.html)", "npm run test:oqe-icosa:e2e", {
          cwd: root,
          env: { ...process.env, CI: "true" },
        });
      }
      if (process.env.P31_HUB_SIMULATIONS === "1") {
        run(
          "Hub simulations (doc-library + DELTA mirrors + geodesic wire fixtures)",
          "npm run test:simulations",
          { cwd: root }
        );
      }
    }
    if (p31caE2e) {
      run("Playwright install (chromium) — p31ca (test:e2e:install)", "npm run test:e2e:install", { cwd: p31ca });
      run("Playwright E2E (p31ca preview + tests)", "npm run test:e2e", {
        cwd: p31ca,
        env: { ...process.env, CI: "true" },
      });
    } else if (hasP31ca) {
      console.log("\n\x1b[33m▶\x1b[0m Playwright: no playwright.config.ts in p31ca — skipped");
    }
  }

  if (hasP31ca && !skipLint) {
    run("p31ca security:lint (eslint, non-blocking)", "npm run security:lint", { cwd: p31ca, soft: true });
  }

  if (hasP31ca && !skipSast) {
    const bin = resolveSemgrepBin();
    if (bin) {
      // Matches .github/workflows/p31-security.yml sast job (report-only, soft exit)
      const q = (s) => `"${s.replace(/"/g, '\\"')}"`;
      const argsLine = [q("p/javascript"), q("p/typescript"), q("p/security-audit")].map(
        (c) => `--config ${c}`
      );
      const safeBin = JSON.stringify(bin);
      const cmd = `${safeBin} scan ${argsLine.join(" ")} src workers`;
      run("Semgrep SAST (p/javascript + p/typescript + p/security-audit)", cmd, { cwd: p31ca, soft: true });
    } else {
      console.log(
        "\n\x1b[33m▶\x1b[0m Semgrep: CLI not found (install: pipx install semgrep — ~/.local/bin on PATH) — skipped"
      );
    }
  }

  if (!skipEcosystemGlass) {
    run(
      "Ecosystem glass box (live probes + skipped[] + /tmp/p31_glass_report.json)",
      "node scripts/ecosystem-glass.mjs",
      { soft: true }
    );
  }

  console.log("\n\x1b[32m✓ p31:all complete\x1b[0m\n");
}

main();
