#!/usr/bin/env node
/**
 * Open a PR into the repo default branch if the current branch has none (idempotent).
 * Safe to run after every push. Skips main/master, missing gh, or unauthenticated gh.
 * CI: set GITHUB_REF_NAME (and optionally GITHUB_REPOSITORY) — uses GH_TOKEN from env.
 */
import { execFileSync, execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function sh(cmd, args, opts = {}) {
  return execFileSync(cmd, args, {
    encoding: "utf8",
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
    ...opts,
  }).trim();
}

function hasGh() {
  try {
    execSync("gh --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function ghCmd(args, extraEnv) {
  return sh("gh", args, { env: { ...process.env, ...extraEnv } });
}

function ghAuthed() {
  try {
    ghCmd(["api", "user", "--jq", ".login"]);
    return true;
  } catch {
    return false;
  }
}

function getBranch() {
  if (process.env.GITHUB_REF_NAME) return process.env.GITHUB_REF_NAME;
  return sh("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
}

function getDefaultBase() {
  if (process.env.P31_PR_BASE) return process.env.P31_PR_BASE;
  try {
    const b = ghCmd(["repo", "view", "--json", "defaultBranchRef", "-q", ".name"]);
    if (b) return b;
  } catch {
    /* */
  }
  return "main";
}

function openPrCount(headBranch) {
  const out = ghCmd([
    "pr",
    "list",
    "-H",
    headBranch,
    "--state",
    "open",
    "--json",
    "number",
  ]);
  try {
    const a = JSON.parse(out || "[]");
    return Array.isArray(a) ? a.length : 0;
  } catch {
    return 0;
  }
}

function main() {
  const branch = getBranch();
  if (branch === "main" || branch === "master" || branch === "HEAD") {
    console.log("ensure-pr: skip (branch is " + branch + ")");
    process.exit(0);
  }

  if (!hasGh()) {
    console.log("ensure-pr: gh not in PATH, skip");
    process.exit(0);
  }
  if (!ghAuthed()) {
    console.log("ensure-pr: gh not logged in, skip (run: gh auth login)");
    process.exit(0);
  }

  if (openPrCount(branch) > 0) {
    console.log("ensure-pr: open PR already exists for " + branch);
    process.exit(0);
  }

  const base = getDefaultBase();
  const extra = {
    ...process.env,
    CI: process.env.CI || "true",
    GH_PROMPT_DISABLED: "1",
  };

  const title = sh("git", ["log", "-1", "--pretty=%s"]);
  const body =
    "Opened automatically by **p31-pr-on-push** (or `npm run pr:ensure`).\n\n" +
    "Set auto PR after local auto-push: `npm run git:autopr:on` (with `git:autopush:on`).";

  const args = [
    "pr",
    "create",
    "--base",
    base,
    "--head",
    branch,
    "--title",
    title,
    "--body",
    body,
  ];

  try {
    const out = execFileSync("gh", args, {
      encoding: "utf8",
      cwd: root,
      stdio: ["ignore", "pipe", "pipe"],
      env: extra,
    });
    if (out) process.stdout.write(out);
    console.log("ensure-pr: created PR → base " + base);
  } catch (e) {
    const err = e && (e.stderr || e.message);
    console.error("ensure-pr: gh pr create failed:", (err || e).toString().trim());
    process.exit(1);
  }
  process.exit(0);
}

main();
