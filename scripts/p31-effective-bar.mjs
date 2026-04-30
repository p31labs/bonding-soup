#!/usr/bin/env node
/**
 * Effective ship bar for *this* checkout — which `npm run verify` steps run vs skip vs degraded.
 *   node scripts/p31-effective-bar.mjs
 *   node scripts/p31-effective-bar.mjs --json
 * @see scripts/p31-ci.mjs (partial clone), verify-* skip messages
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { canonicalPassportTransformPath } from "./passport-p31ca-transform.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

/** @typedef {"run"|"skip"|"degraded"} BarStatus */

/**
 * @param {string} r
 */
function parseVerifyScripts(r) {
  const parts = r.split("&&").map((s) => s.trim());
  /** @type {string[]} */
  const out = [];
  for (const p of parts) {
    const m = p.match(/^npm run ([\w:-]+)$/);
    if (m) out.push(m[1]);
  }
  return out;
}

/**
 * @param {string} rootDir
 */
export function buildWorkspaceProbe(rootDir) {
  const andromeda = path.join(rootDir, "andromeda");
  const p31ca = path.join(andromeda, "04_SOFTWARE", "p31ca");
  const hasAndromeda = fs.existsSync(andromeda);
  const hasP31ca = fs.existsSync(p31ca);
  let andromedaGit = false;
  if (hasAndromeda) {
    try {
      execFileSync("git", ["-C", andromeda, "rev-parse", "--is-inside-work-tree"], {
        stdio: "pipe",
        encoding: "utf8",
      });
      andromedaGit = true;
    } catch {
      andromedaGit = false;
    }
  }
  const sharedSchema = path.join(
    rootDir,
    "andromeda/04_SOFTWARE/packages/shared/src/cognitive-passport-schema.ts",
  );
  const profilesTs = path.join(
    rootDir,
    "andromeda/04_SOFTWARE/packages/shared/src/cognitive-passport-profiles.ts",
  );
  const passportDest = path.join(p31ca, "public", "passport-generator.html");
  const venvPy = path.join(rootDir, "Discovery", ".venv", "bin", "python");
  const zenodoScript = path.join(rootDir, "p31labs", "scripts", "zenodo_scan_local.py");

  return {
    hasAndromeda,
    hasP31ca,
    andromedaGit,
    skipDocMirror: process.env.P31_SKIP_DOC_LIB_MIRROR === "1",
    hasSharedSchema: fs.existsSync(sharedSchema),
    hasProfilesTs: fs.existsSync(profilesTs),
    hasPassportDest: fs.existsSync(passportDest),
    hasPassportTransform: fs.existsSync(canonicalPassportTransformPath),
    hasK4Personal: fs.existsSync(path.join(andromeda, "04_SOFTWARE", "k4-personal")),
    hasPlanetaryOnboard: fs.existsSync(
      path.join(p31ca, "public", "planetary-onboard.html"),
    ),
    hasHubFleetPortal: fs.existsSync(path.join(p31ca, "public", "fleet-portal.html")),
    hasOfficeVenv: fs.existsSync(venvPy),
    hasZenodoScript: fs.existsSync(zenodoScript),
  };
}

/**
 * @param {string} script
 * @param {ReturnType<typeof buildWorkspaceProbe>} w
 * @returns {{ status: BarStatus; reason: string }}
 */
export function classifyVerifyStep(script, w) {
  switch (script) {
    case "verify:alignment":
    case "verify:facts":
    case "verify:subscriptions":
    case "verify:p31-env":
    case "verify:shipbox":
    case "verify:constants":
    case "verify:mesh-canon":
    case "verify:ecosystem":
    case "verify:production-readiness":
    case "verify:command-center":
    case "verify:cars-wire":
    case "verify:poets-room":
    case "build:doc-index":
    case "verify:doc-index":
    case "verify:simplex":
    case "verify:simplex-email":
    case "verify:simplex-bootstrap":
    case "build":
    case "soup:prep:check":
    case "verify:runbooks":
    case "verify:delta-language":
    case "verify:public-voice":
    case "verify:atmosphere-ramp":
    case "verify:starfield":
    case "verify:fleet-ten":
    case "verify:ollama-mcp":
    case "verify:ollama-tunnel-config":
    case "verify:edge-lab":
      return { status: "run", reason: "always scheduled on home verify bar" };

    case "verify:passport":
      if (!w.hasPassportDest)
        return { status: "skip", reason: "no p31ca mirror (partial clone); see verify-passport-sync.mjs" };
      if (!w.hasPassportTransform)
        return {
          status: "skip",
          reason: "passport transform missing (partial clone)",
        };
      return { status: "run", reason: "mirror + transform present" };

    case "verify:cognitive-passport-schema":
      if (!w.hasSharedSchema)
        return { status: "skip", reason: "no @p31/shared schema file (partial clone)" };
      return { status: "run", reason: "" };

    case "verify:cognitive-passport-profiles":
      if (!w.hasProfilesTs)
        return { status: "skip", reason: "no cognitive-passport-profiles.ts (partial clone)" };
      return { status: "run", reason: "" };

    case "verify:map-pipeline":
      if (!w.hasAndromeda)
        return { status: "skip", reason: "no andromeda/ (MAP lives under monorepo)" };
      return { status: "run", reason: "andromeda present" };

    case "verify:p31-style":
    case "verify:style-alignment":
      if (!w.hasP31ca)
        return { status: "skip", reason: "no p31ca tree (verify-p31-style / style-alignment skip)" };
      return { status: "run", reason: "" };

    case "verify:p31ca-contracts":
      if (!w.hasP31ca) return { status: "skip", reason: "no p31ca (partial clone)" };
      return { status: "run", reason: "" };

    case "verify:egg-hunt":
      if (!w.hasAndromeda)
        return {
          status: "degraded",
          reason: "andromeda-only manifest entries skipped (verify-egg-hunt.mjs)",
        };
      return { status: "run", reason: "full manifest checks" };

    case "verify:onboarding":
      if (!w.hasPlanetaryOnboard)
        return { status: "skip", reason: "no planetary-onboard.html in p31ca public" };
      return { status: "run", reason: "" };

    case "verify:fleet-portal":
      if (w.hasHubFleetPortal)
        return {
          status: "run",
          reason: "root + hub fleet-portal.html checked (verify-fleet-portal.mjs)",
        };
      return {
        status: "degraded",
        reason: "hub mirror absent — only root fleet-portal.html required",
      };

    case "verify:doc-library:p31ca-mirror":
      if (w.skipDocMirror) return { status: "skip", reason: "P31_SKIP_DOC_LIB_MIRROR=1" };
      if (!w.hasP31ca) return { status: "skip", reason: "no p31ca tree" };
      if (!w.andromedaGit)
        return { status: "skip", reason: "andromeda/ not a git work tree (cannot enforce mirror commit)" };
      return { status: "run", reason: "sync + git drift check" };

    case "verify:github-org":
      return { status: "run", reason: "repos-metadata.json + GitHub topic/description rules" };

    default:
      return { status: "run", reason: "unknown script — assumed run (update p31-effective-bar.mjs)" };
  }
}

/**
 * @param {string} rootDir
 * @param {{ json?: boolean }} opts
 */
export function buildEffectiveBarReport(rootDir, opts = {}) {
  const pkgPath = path.join(rootDir, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const verifyLine = pkg.scripts?.verify;
  if (typeof verifyLine !== "string") throw new Error("package.json missing scripts.verify");

  const fromPkg = parseVerifyScripts(verifyLine);
  const alignPath = path.join(rootDir, "p31-alignment.json");
  let alignScripts = null;
  if (fs.existsSync(alignPath)) {
    const align = JSON.parse(fs.readFileSync(alignPath, "utf8"));
    const pipe = align.verifyPipeline;
    if (pipe?.prelude && Array.isArray(pipe.scripts)) {
      alignScripts = [pipe.prelude, ...pipe.scripts];
    }
  }

  const w = buildWorkspaceProbe(rootDir);
  const mismatch =
    alignScripts &&
    (alignScripts.length !== fromPkg.length ||
      alignScripts.some((s, i) => s !== fromPkg[i]));

  /** @type {{ script: string; status: BarStatus; reason: string }[]} */
  const steps = fromPkg.map((script) => {
    const { status, reason } = classifyVerifyStep(script, w);
    return { script, status, reason };
  });

  return {
    schema: "p31.effectiveBar/1.0.0",
    root: rootDir,
    workspace: w,
    verifySteps: steps,
    alignmentVerifyMismatch: mismatch || false,
    p31CiHubPhases: {
      rootVerify: "npm run verify (or skipped with --skip-root-verify)",
      k4PersonalMesh: w.hasK4Personal
        ? "verify-k4-personal + verify-mesh-live when k4-personal exists"
        : "skipped — no andromeda/04_SOFTWARE/k4-personal",
      p31caBuild: w.hasP31ca ? "npm run verify in p31ca after npm ci/install" : "skipped — no p31ca",
      securitySuite: w.hasP31ca ? "p31ca security:check in CI (p31-ci.mjs)" : "skipped",
    },
    p31AllExtras: [
      "validate-p31-full.sh",
      "fleet:probe (soft)",
      "Playwright home + p31ca e2e",
      "ecosystem-glass.mjs (soft)",
      "Semgrep (soft if CLI missing)",
    ],
  };
}

function printTable(report) {
  console.log("━ P31 effective bar — npm run verify ━\n");
  if (report.alignmentVerifyMismatch) {
    console.warn(
      "⚠ p31-alignment.json verifyPipeline order differs from package.json verify — update one of them.\n",
    );
  }
  const w = report.workspace;
  console.log("Workspace:");
  console.log(
    `  andromeda/: ${w.hasAndromeda ? "yes" : "no"}  ·  p31ca: ${w.hasP31ca ? "yes" : "no"}  ·  andromeda git: ${w.andromedaGit ? "yes" : "no"}`,
  );
  console.log(
    `  office venv: ${w.hasOfficeVenv ? "yes" : "no"}  ·  zenodo_scan_local.py: ${w.hasZenodoScript ? "yes" : "no"}`,
  );
  console.log("");
  for (const row of report.verifySteps) {
    const tag =
      row.status === "run" ? "RUN " : row.status === "skip" ? "SKIP" : "DEG ";
    console.log(`  [${tag}] ${row.script}`);
    if (row.reason) console.log(`         ${row.reason}`);
  }
  console.log("\n— p31-ci (release:check) after verify —");
  console.log(" ", JSON.stringify(report.p31CiHubPhases));
  console.log("\n— p31:all adds (see scripts/p31-all.mjs) —");
  for (const line of report.p31AllExtras) console.log("   ·", line);
  console.log("");
}

function main() {
  const json = process.argv.includes("--json");
  const report = buildEffectiveBarReport(root, { json });
  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printTable(report);
  }
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  main();
}
