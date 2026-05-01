#!/usr/bin/env node
/**
 * Atomic auto-pilot pre-deploy gate. Single command, no interactive prompts.
 *
 *   1. release:public  — root verify + k4-personal + strict mesh + p31ca hub:ci + security:check
 *   2. ecosystem-glass — strict (P31_GLASS_STRICT=1); fail if any live probe is down
 *   3. launch-readiness rehearsal — refresh /tmp/p31_glass_report.json + lane sweep
 *
 * Exit non-zero on the first failure; print one summary line at the end.
 *
 * Flags (passthrough to release:public unless noted):
 *   --content              run p31ca ci:content instead of hub:ci (about enrich)
 *   --skip-install         pass through
 *   --no-security          pass through
 *   --skip-glass           skip step 2 (offline operator runs)
 *   --skip-readiness       skip step 3
 *
 * After GREEN: deploy hub via npm run deploy:p31ca (or wait for autodeploy after CI green).
 * Then npm run post-deploy:verify (auto-run by GitHub Actions autodeploy too).
 */
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const args = new Set(process.argv.slice(2));
const skipGlass = args.has("--skip-glass");
const skipReadiness = args.has("--skip-readiness");

const passthrough = ["--content", "--skip-install", "--no-security"]
  .filter((f) => args.has(f))
  .join(" ");

function step(title, command, extraEnv) {
  console.log(`\n\x1b[36m▶ launch-auto: ${title}\x1b[0m`);
  const env = extraEnv ? { ...process.env, ...extraEnv } : process.env;
  execSync(command, { cwd: root, stdio: "inherit", env });
}

function main() {
  const started = Date.now();

  step(
    "release:public (verify + mesh + hub:ci + security)",
    `node scripts/p31-release-public.mjs ${passthrough}`.trim(),
  );

  if (!skipGlass) {
    step(
      "ecosystem-glass strict",
      "node scripts/ecosystem-glass.mjs",
      { P31_GLASS_STRICT: "1" },
    );
  } else {
    console.log("\n\x1b[33m▶\x1b[0m skip ecosystem-glass (--skip-glass)");
  }

  if (!skipReadiness) {
    step(
      "launch-readiness rehearsal (lanes + glass refresh)",
      "node scripts/p31-launch-readiness.mjs --mode rehearsal --no-log",
    );
  } else {
    console.log("\n\x1b[33m▶\x1b[0m skip readiness (--skip-readiness)");
  }

  const dur = Math.round((Date.now() - started) / 1000);
  console.log(
    `\n\x1b[32m✓ launch-auto pre-deploy gate GREEN (${dur}s)\x1b[0m\n` +
      `  Next: deploy (hub autodeploy after CI, or npm run deploy:p31ca)\n` +
      `  Then: npm run post-deploy:verify\n`,
  );
}

main();
