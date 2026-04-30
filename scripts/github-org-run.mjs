#!/usr/bin/env node
/**
 * One-shot GitHub org alignment: CI-shaped check, dry-run plan, or full apply.
 *
 *   node scripts/github-org-run.mjs check   — strict repos-metadata + REPOS.md (same as CI)
 *   node scripts/github-org-run.mjs plan    — check + bootstrap + metadata/sync dry-run
 *   node scripts/github-org-run.mjs apply --yes  — check + bootstrap + publish (metadata + sync push)
 *
 * apply also accepts P31_GITHUB_ORG_APPLY=1 instead of --yes.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { assertFromDisk } from "./verify-github-org-metadata.mjs";
import { ensureDotgithubClone } from "./github-org-bootstrap.mjs";
import { appendSocialEvent } from "./lib/p31-social-events.mjs";
import { getGithubOrgValve } from "./lib/github-org-valve.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const automation = path.join(root, "scripts", "github-org-automation.mjs");

function runNode(scriptPath, args, env = {}) {
  const r = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
  return r.status === 0 ? 0 : r.status ?? 1;
}

function main() {
  const cmd = process.argv[2];
  const rest = process.argv.slice(3);

  if (!cmd || cmd === "-h" || cmd === "--help") {
    console.log(`Usage:
  node scripts/github-org-run.mjs check
  node scripts/github-org-run.mjs plan
  node scripts/github-org-run.mjs apply --yes

apply: requires --yes or P31_GITHUB_ORG_APPLY=1, valve mode apply (or P31_GITHUB_ORG_VALVE_BYPASS=1).
`);
    process.exit(cmd ? 0 : 1);
  }

  if (cmd === "check") {
    process.env.P31_GITHUB_ORG_STRICT_REPOS_MD = "1";
    try {
      assertFromDisk(root);
      console.log("github-org-run: check OK (strict REPOS.md)");
      appendSocialEvent({
        kind: "github-org.check_ok",
        source: "github-org-run",
        payload: { valve: getGithubOrgValve().mode },
      });
    } catch (e) {
      console.error(e && e.message ? e.message : e);
      process.exit(1);
    }
    process.exit(0);
  }

  if (cmd === "plan") {
    process.env.P31_GITHUB_ORG_STRICT_REPOS_MD = "1";
    try {
      assertFromDisk(root);
    } catch (e) {
      console.error(e && e.message ? e.message : e);
      process.exit(1);
    }
    const dest = ensureDotgithubClone();
    let code = runNode(automation, ["metadata", "--dry-run"]);
    if (code !== 0) process.exit(code);
    code = runNode(automation, ["sync", "--repo-dir", dest, "--dry-run"]);
    if (code === 0) {
      appendSocialEvent({
        kind: "github-org.plan_ok",
        source: "github-org-run",
        payload: { valve: getGithubOrgValve().mode },
      });
    }
    process.exit(code);
  }

  if (cmd === "apply") {
    const ok =
      rest.includes("--yes") ||
      process.env.P31_GITHUB_ORG_APPLY === "1" ||
      process.env.P31_GITHUB_ORG_APPLY === "true";
    if (!ok) {
      console.error("github-org-run: apply requires --yes or P31_GITHUB_ORG_APPLY=1");
      process.exit(1);
    }
    const bypass = process.env.P31_GITHUB_ORG_VALVE_BYPASS === "1";
    const valve = getGithubOrgValve();
    if (!bypass && valve.mode !== "apply") {
      appendSocialEvent({
        kind: "github-org.apply_blocked",
        source: "github-org-run",
        payload: { valve: valve.mode, hint: "node scripts/github-org-valve-cli.mjs set apply" },
      });
      console.error(
        `github-org-run: valve is "${valve.mode}" — open apply valve or set P31_GITHUB_ORG_VALVE_BYPASS=1`
      );
      process.exit(1);
    }
    process.env.P31_GITHUB_ORG_STRICT_REPOS_MD = "1";
    try {
      assertFromDisk(root);
    } catch (e) {
      console.error(e && e.message ? e.message : e);
      process.exit(1);
    }
    const dest = ensureDotgithubClone();
    process.env.P31_GITHUB_ORG_REPO = dest;
    const code = runNode(automation, ["all", "--repo-dir", dest, "--push"]);
    if (code === 0) {
      appendSocialEvent({
        kind: "github-org.apply_ok",
        source: "github-org-run",
        payload: { valve: valve.mode, bypass },
      });
    }
    process.exit(code);
  }

  console.error("github-org-run: unknown command", JSON.stringify(cmd));
  process.exit(1);
}

main();
