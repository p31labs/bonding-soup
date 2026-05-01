#!/usr/bin/env node
/**
 * Post-deploy verify — runs after Cloudflare Pages / Workers deploy completes.
 * Goal: prove the LIVE edge matches what the repo just pushed, without human poking.
 *
 *   1. Wait for CDN propagation (default 45s; override --wait-seconds or P31_POST_DEPLOY_WAIT).
 *   2. launch-smoke-net (MAP /donate, donate-api /health, creator-economy.json).
 *   3. ecosystem-glass strict (P31_GLASS_STRICT=1) over p31-ecosystem.json glassProbes.
 *   4. Optional freshness probe — fetch hub /p31-public-surface.json + /creator-economy.json;
 *      report build/updated stamps (best-effort; non-fatal if header absent).
 *
 * Exit non-zero on any FAIL so CI / local autopilot stops loudly.
 *
 * Skip lanes individually:
 *   P31_POST_DEPLOY_SKIP_SMOKE=1
 *   P31_POST_DEPLOY_SKIP_GLASS=1
 *   P31_POST_DEPLOY_SKIP_FRESHNESS=1
 */
import { execSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function arg(name, fallback) {
  const idx = process.argv.indexOf(name);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}

const waitSeconds = Number(
  arg("--wait-seconds", process.env.P31_POST_DEPLOY_WAIT ?? "45"),
);
const skipSmoke = process.env.P31_POST_DEPLOY_SKIP_SMOKE === "1";
const skipGlass = process.env.P31_POST_DEPLOY_SKIP_GLASS === "1";
const skipFreshness = process.env.P31_POST_DEPLOY_SKIP_FRESHNESS === "1";

function step(title, command, extraEnv) {
  console.log(`\n\x1b[36m▶\x1b[0m ${title}`);
  const env = extraEnv ? { ...process.env, ...extraEnv } : process.env;
  execSync(command, { cwd: root, stdio: "inherit", env });
}

const FRESHNESS_TARGETS = [
  { name: "hub /p31-public-surface.json", url: "https://p31ca.org/p31-public-surface.json" },
  { name: "hub /creator-economy.json", url: "https://p31ca.org/creator-economy.json" },
  { name: "hub /p31-mesh-constants.json", url: "https://p31ca.org/p31-mesh-constants.json" },
];

async function freshness() {
  console.log("\n\x1b[36m▶\x1b[0m hub freshness (best-effort)");
  let rowsLogged = 0;
  for (const t of FRESHNESS_TARGETS) {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 12_000);
    try {
      const r = await fetch(t.url, {
        method: "GET",
        redirect: "follow",
        signal: ctrl.signal,
        headers: { Accept: "application/json,*/*" },
      });
      clearTimeout(tid);
      const updated = r.headers.get("last-modified") || r.headers.get("date") || "";
      const ageHdr = r.headers.get("age") || "";
      const cf = r.headers.get("cf-cache-status") || "";
      console.log(
        `  ${t.name.padEnd(38)} ${r.status} updated=${updated} cf=${cf}${ageHdr ? " age=" + ageHdr : ""}`,
      );
      rowsLogged++;
    } catch (e) {
      clearTimeout(tid);
      console.log(`  ${t.name.padEnd(38)} ERR ${e?.message || e}`);
    }
  }
  if (rowsLogged === 0) {
    console.log("  (no freshness rows — skipping)");
  }
}

async function main() {
  console.log(
    `post-deploy-verify: wait=${waitSeconds}s smoke=${!skipSmoke} glass=${!skipGlass} freshness=${!skipFreshness}`,
  );

  if (waitSeconds > 0) {
    console.log(`\n\x1b[36m▶\x1b[0m waiting ${waitSeconds}s for edge propagation`);
    await delay(waitSeconds * 1000);
  }

  if (!skipSmoke) {
    step("launch-smoke-net (MAP + donate-api + creator economy)", "node scripts/launch-smoke-net.mjs");
  } else {
    console.log("\n\x1b[33m▶\x1b[0m skip smoke (P31_POST_DEPLOY_SKIP_SMOKE=1)");
  }

  if (!skipGlass) {
    step(
      "ecosystem-glass strict (every probe in p31-ecosystem.json)",
      "node scripts/ecosystem-glass.mjs",
      { P31_GLASS_STRICT: "1" },
    );
  } else {
    console.log("\n\x1b[33m▶\x1b[0m skip glass (P31_POST_DEPLOY_SKIP_GLASS=1)");
  }

  if (!skipFreshness) {
    await freshness();
  } else {
    console.log("\n\x1b[33m▶\x1b[0m skip freshness (P31_POST_DEPLOY_SKIP_FRESHNESS=1)");
  }

  console.log("\n\x1b[32m✓ post-deploy verify complete\x1b[0m\n");
}

main().catch((e) => {
  console.error("\n\x1b[31m✗ post-deploy verify FAILED\x1b[0m");
  console.error(e && e.message ? e.message : e);
  process.exit(1);
});
