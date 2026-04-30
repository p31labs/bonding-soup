#!/usr/bin/env node
/**
 * Auto trigger for GitHub org alignment (cron, git hook, fleet scheduler).
 * Respects ~/.p31/github-org-valve.json — never runs apply.
 *
 *   closed   → noop + social event (skipped)
 *   dry-run  → npm run github:org:plan (safe)
 *   apply    → same as dry-run here (full apply stays manual / CI PAT)
 *
 * Env:
 *   P31_GITHUB_ORG_AUTO_QUIET=1  — minimal stdout (for logs)
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getGithubOrgValve } from "./lib/github-org-valve.mjs";
import { appendSocialEvent } from "./lib/p31-social-events.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const runScript = path.join(root, "scripts", "github-org-run.mjs");

function log(...a) {
  if (process.env.P31_GITHUB_ORG_AUTO_QUIET === "1") return;
  console.log(...a);
}

function main() {
  const v = getGithubOrgValve();
  if (v.mode === "closed") {
    appendSocialEvent({
      kind: "github-org.auto_skipped",
      source: "github-org-auto",
      payload: { reason: "valve_closed" },
    });
    log("github-org-auto: skipped (valve closed)");
    process.exit(0);
  }

  appendSocialEvent({
    kind: "github-org.auto_trigger",
    source: "github-org-auto",
    payload: { valve: v.mode },
  });

  const r = spawnSync(process.execPath, [runScript, "plan"], {
    cwd: root,
    stdio: process.env.P31_GITHUB_ORG_AUTO_QUIET === "1" ? "pipe" : "inherit",
    env: process.env,
  });
  const code = r.status === 0 ? 0 : r.status ?? 1;
  if (code === 0) {
    appendSocialEvent({
      kind: "github-org.auto_plan_ok",
      source: "github-org-auto",
      payload: { valve: v.mode },
    });
    log("github-org-auto: plan OK");
  } else {
    appendSocialEvent({
      kind: "github-org.auto_plan_fail",
      source: "github-org-auto",
      payload: { valve: v.mode, code },
    });
    log("github-org-auto: plan failed code", code);
  }
  process.exit(code);
}

main();
