#!/usr/bin/env node
/**
 * Automate P31 GitHub org hygiene: sync REPOS.md + profile map into p31labs/.github,
 * and apply repo descriptions/topics from docs/github-org-bundle/repos-metadata.json via gh.
 *
 * Usage:
 *   node scripts/github-org-automation.mjs verify
 *   node scripts/github-org-automation.mjs sync [--repo-dir DIR] [--push] [--dry-run]
 *   node scripts/github-org-automation.mjs metadata [--dry-run]
 *   node scripts/github-org-automation.mjs all [--repo-dir DIR] [--push] [--dry-run]
 *
 * Env:
 *   P31_GITHUB_ORG_REPO  — default directory for sync (same as --repo-dir)
 *   P31_ORG_DOTGITHUB    — override org/repo slug for clone hint (default from p31-github.json orgDotGithubRepository)
 *   P31_GITHUB_ORG_PUSH  — if "1", sync commits and pushes (same as --push)
 *   P31_SKIP_GITHUB_ORG_VERIFY — set to "1" to skip bundle JSON validation
 *   Default --repo-dir: .p31-work/dotgithub-sync under repo root if it exists and P31_GITHUB_ORG_REPO unset
 */
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { assertFromDisk } from "./verify-github-org-metadata.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const BUNDLE = path.join(root, "docs", "github-org-bundle");
const REPOS_MD_SRC = path.join(BUNDLE, "REPOS.md");
const PROFILE_SNIPPET_SRC = path.join(BUNDLE, "profile-repository-map.md");
const METADATA_SRC = path.join(BUNDLE, "repos-metadata.json");

const MARK_START = "<!-- P31_ORG_MAP_AUTO_START -->";
const MARK_END = "<!-- P31_ORG_MAP_AUTO_END -->";

function bundleVerify() {
  if (process.env.P31_SKIP_GITHUB_ORG_VERIFY === "1") return;
  assertFromDisk(root);
}

function defaultOrgRepoDir() {
  const env = process.env.P31_GITHUB_ORG_REPO;
  if (env) return env;
  const d = path.join(root, ".p31-work", "dotgithub-sync");
  if (fs.existsSync(path.join(d, ".git"))) return d;
  return "";
}

function getGitIdentityForCommit() {
  const name =
    process.env.P31_GIT_USER_NAME ||
    spawnSync("git", ["-C", root, "config", "user.name"], { encoding: "utf8" }).stdout.trim();
  const email =
    process.env.P31_GIT_USER_EMAIL ||
    spawnSync("git", ["-C", root, "config", "user.email"], { encoding: "utf8" }).stdout.trim();
  if (!name || !email) {
    if (process.env.GITHUB_ACTIONS === "true") {
      return { name: "github-actions[bot]", email: "github-actions[bot]@users.noreply.github.com" };
    }
    console.error(
      "github-org-automation: set git user for commits: P31_GIT_USER_NAME + P31_GIT_USER_EMAIL, or git config user.name/user.email in bonding-soup"
    );
    process.exit(1);
  }
  return { name, email };
}

function readGithubConfig() {
  const fallback = "p31labs/.github";
  const p = path.join(root, "p31-github.json");
  let orgDot = process.env.P31_ORG_DOTGITHUB || fallback;
  if (fs.existsSync(p)) {
    try {
      const j = JSON.parse(fs.readFileSync(p, "utf8"));
      orgDot = process.env.P31_ORG_DOTGITHUB || j.orgDotGithubRepository || orgDot;
    } catch {
      /* keep env or fallback */
    }
  }
  return { orgDotGithubRepository: orgDot };
}

function gh(args, input = null) {
  const r = spawnSync("gh", args, {
    input: input ?? undefined,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  if (r.error) throw r.error;
  if (r.status !== 0) {
    const err = (r.stderr || r.stdout || "").trim() || `gh exited ${r.status}`;
    throw new Error(err);
  }
  return r.stdout;
}

function ensureGhAuth() {
  try {
    gh(["api", "user", "--jq", ".login"]);
  } catch {
    console.error("github-org-automation: gh not authenticated — run: gh auth login");
    process.exit(1);
  }
}

function loadProfileSnippet() {
  let t = fs.readFileSync(PROFILE_SNIPPET_SRC, "utf8");
  t = t.replace(/^<!--[\s\S]*?-->\s*\n?/, "");
  return `${MARK_START}\n${t.trim()}\n${MARK_END}\n`;
}

function mergeProfileReadme(profileReadmePath, block) {
  let existing = "";
  if (fs.existsSync(profileReadmePath)) {
    existing = fs.readFileSync(profileReadmePath, "utf8");
  }
  const re = new RegExp(
    `${MARK_START.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${MARK_END.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
    "m"
  );
  if (re.test(existing)) {
    return existing.replace(re, block.trimEnd() + "\n");
  }
  return (existing.trimEnd() + "\n\n" + block).trimEnd() + "\n";
}

function copyReposMd(destRoot) {
  fs.copyFileSync(REPOS_MD_SRC, path.join(destRoot, "REPOS.md"));
}

function syncCommand({ repoDir, dryRun, push }) {
  bundleVerify();
  if (!fs.existsSync(REPOS_MD_SRC)) {
    console.error("github-org-automation: missing", REPOS_MD_SRC);
    process.exit(1);
  }
  if (!repoDir) {
    const cfg = readGithubConfig();
    console.error(
      "github-org-automation: sync needs a clone of the org profile repo.\n" +
        `  Example: git clone https://github.com/${cfg.orgDotGithubRepository}.git .p31-work/dotgithub-sync\n` +
        "  Then: npm run github:org:sync -- --push\n" +
        "  Or set P31_GITHUB_ORG_REPO"
    );
    process.exit(1);
  }
  const abs = path.resolve(repoDir);
  if (!fs.existsSync(path.join(abs, ".git"))) {
    console.error("github-org-automation: not a git repo:", abs);
    process.exit(1);
  }

  const profileDir = path.join(abs, "profile");
  const profileReadme = path.join(profileDir, "README.md");
  const block = loadProfileSnippet();

  if (dryRun) {
    console.log("[dry-run] would write:", path.join(abs, "REPOS.md"));
    console.log("[dry-run] would merge profile map into:", profileReadme);
    console.log("--- snippet ---\n" + block + "---");
    return;
  }

  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
  }

  copyReposMd(abs);
  const merged = mergeProfileReadme(profileReadme, block);
  fs.writeFileSync(profileReadme, merged, "utf8");

  execFileSync("git", ["-C", abs, "add", "REPOS.md", "profile/README.md"], { stdio: "inherit" });
  const st = spawnSync("git", ["-C", abs, "diff", "--cached", "--quiet"], { encoding: "utf8" });
  if (st.status === 0) {
    console.log("github-org-automation: sync — no changes to commit.");
    return;
  }
  const { name, email } = getGitIdentityForCommit();
  const gitEnv = {
    ...process.env,
    GIT_AUTHOR_NAME: name,
    GIT_AUTHOR_EMAIL: email,
    GIT_COMMITTER_NAME: name,
    GIT_COMMITTER_EMAIL: email,
  };
  execFileSync(
    "git",
    ["-C", abs, "commit", "-m", "chore(org): sync P31 repository map [automated]"],
    { stdio: "inherit", env: gitEnv }
  );
  if (push) {
    execFileSync("git", ["-C", abs, "push"], { stdio: "inherit" });
    console.log("github-org-automation: pushed", abs);
  } else {
    console.log("github-org-automation: committed locally; run with --push or git push");
  }
}

function metadataCommand({ dryRun }) {
  bundleVerify();
  if (!fs.existsSync(METADATA_SRC)) {
    console.error("github-org-automation: missing", METADATA_SRC);
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(METADATA_SRC, "utf8"));
  const org = data.organization || "p31labs";
  const repos = data.repos || [];

  for (const r of repos) {
    if (r.skip) continue;
    const full = `${org}/${r.name}`;
    const desc = String(r.description || "").slice(0, 350);
    const homepage = r.homepage ? String(r.homepage) : "";

    if (dryRun) {
      console.log(`[dry-run] PATCH ${full} description=${JSON.stringify(desc)} homepage=${homepage}`);
      if (r.topics?.length) console.log(`[dry-run] PUT ${full}/topics`, r.topics);
      continue;
    }

    try {
      const patch = { description: desc };
      if (homepage) patch.homepage = homepage;
      gh(["api", `repos/${full}`, "-X", "PATCH", "--input", "-"], JSON.stringify(patch));

      if (r.topics && r.topics.length) {
        const body = JSON.stringify({ names: r.topics });
        gh(["api", `repos/${full}/topics`, "-X", "PUT", "--input", "-"], body);
      }
      console.log("github-org-automation: updated", full);
    } catch (e) {
      const msg = e && e.message ? e.message : String(e);
      console.warn("github-org-automation: skip", full, "-", msg);
    }
  }
}

function parseArgs(argv) {
  const out = { dryRun: false, push: false, repoDir: process.env.P31_GITHUB_ORG_REPO || "" };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") out.dryRun = true;
    else if (a === "--push") out.push = true;
    else if (a === "--repo-dir" && argv[i + 1]) {
      out.repoDir = argv[++i];
    }
  }
  if (process.env.P31_GITHUB_ORG_PUSH === "1") out.push = true;
  if (!out.repoDir) out.repoDir = defaultOrgRepoDir();
  return out;
}

function main() {
  const cmd = process.argv[2];
  const opts = parseArgs(process.argv);

  if (cmd === "verify") {
    try {
      assertFromDisk(root);
      console.log("github-org-automation: bundle OK (repos-metadata.json + rules)");
    } catch (e) {
      console.error(e && e.message ? e.message : e);
      process.exit(1);
    }
    return;
  }
  if (cmd === "sync") {
    syncCommand(opts);
    return;
  }
  if (cmd === "metadata") {
    if (!opts.dryRun) ensureGhAuth();
    metadataCommand(opts);
    return;
  }
  if (cmd === "all") {
    if (!opts.dryRun) ensureGhAuth();
    metadataCommand(opts);
    syncCommand(opts);
    return;
  }

  console.log(`Usage:
  node scripts/github-org-automation.mjs verify
  node scripts/github-org-automation.mjs sync [--repo-dir DIR] [--push] [--dry-run]
  node scripts/github-org-automation.mjs metadata [--dry-run]
  node scripts/github-org-automation.mjs all [--repo-dir DIR] [--push] [--dry-run]

Env: P31_GITHUB_ORG_REPO (default: .p31-work/dotgithub-sync if present), P31_GITHUB_ORG_PUSH=1,
     P31_ORG_DOTGITHUB, P31_SKIP_GITHUB_ORG_VERIFY=1, P31_GITHUB_ORG_STRICT_REPOS_MD=1 (verify script)
`);
  process.exit(cmd ? 1 : 0);
}

main();
