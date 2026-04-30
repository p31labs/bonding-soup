#!/usr/bin/env node
/**
 * Ensure a local clone of p31labs/.github exists for github-org sync (default: .p31-work/dotgithub-sync).
 * Idempotent; safe to run before github:org:sync / publish.
 *
 * Usage:
 *   node scripts/github-org-bootstrap.mjs           # clone if missing, print path
 *   node scripts/github-org-bootstrap.mjs --path    # print resolved path only (no network)
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function readOrgDotGithubSlug() {
  const fallback = "p31labs/.github";
  const p = path.join(root, "p31-github.json");
  if (!fs.existsSync(p)) return process.env.P31_ORG_DOTGITHUB || fallback;
  try {
    const j = JSON.parse(fs.readFileSync(p, "utf8"));
    return process.env.P31_ORG_DOTGITHUB || j.orgDotGithubRepository || fallback;
  } catch {
    return process.env.P31_ORG_DOTGITHUB || fallback;
  }
}

/** Resolved clone directory (env P31_GITHUB_ORG_REPO or .p31-work/dotgithub-sync). */
export function getDotgithubDest() {
  const env = process.env.P31_GITHUB_ORG_REPO;
  if (env) return path.resolve(env);
  return path.join(root, ".p31-work", "dotgithub-sync");
}

/**
 * @param {{ quiet?: boolean }} [opts]
 * @returns {string} absolute path to clone
 */
export function ensureDotgithubClone(opts = {}) {
  const dest = getDotgithubDest();
  const orgRepo = readOrgDotGithubSlug();
  const gitDir = path.join(dest, ".git");

  if (fs.existsSync(gitDir)) {
    if (!opts.quiet) {
      console.log("github-org-bootstrap: using existing clone →", dest);
    }
    return dest;
  }

  if (fs.existsSync(dest)) {
    const entries = fs.readdirSync(dest);
    if (entries.length > 0) {
      console.error(
        "github-org-bootstrap: path exists but is not a git repo — remove or set P31_GITHUB_ORG_REPO:\n  " + dest
      );
      process.exit(1);
    }
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const url = `https://github.com/${orgRepo}.git`;
  if (!opts.quiet) {
    console.log("github-org-bootstrap: cloning", url, "→", dest);
  }
  execFileSync("git", ["clone", "--depth", "1", url, dest], { stdio: "inherit" });
  if (!opts.quiet) {
    console.log("github-org-bootstrap: ready →", dest);
  }
  return dest;
}

function main() {
  const arg = process.argv[2];
  if (arg === "--path") {
    console.log(getDotgithubDest());
    return;
  }
  if (arg === "-h" || arg === "--help") {
    console.log(`Usage:
  node scripts/github-org-bootstrap.mjs [--path]
Env: P31_GITHUB_ORG_REPO (override clone dir), P31_ORG_DOTGITHUB (override org/repo slug for clone URL)
`);
    return;
  }
  ensureDotgithubClone({ quiet: false });
  console.log(getDotgithubDest());
}

const entryAbs = process.argv[1] ? path.resolve(process.argv[1]) : "";
const thisAbs = path.resolve(fileURLToPath(import.meta.url));
if (entryAbs && entryAbs === thisAbs) main();
