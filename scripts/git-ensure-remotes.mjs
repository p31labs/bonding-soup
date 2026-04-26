#!/usr/bin/env node
/**
 * Idempotent: ensure git remotes for P31 home (root) and nested andromeda/.
 * Config: p31-github.json (homeRepository, andromedaRepository) or env:
 *   P31_HOME_GITHUB=org/repo   e.g. p31labs/bonding-soup
 *   P31_ANDROMEDA_GITHUB=org/repo  (default p31labs/andromeda)
 * Flags: --force   re-point origin if URL differs (use with care)
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const configPath = path.join(root, "p31-github.json");

const args = new Set(process.argv.slice(2));
const force = args.has("--force");

function runGit(cwd, parts, silent = false) {
  execSync(`git ${parts.join(" ")}`, {
    cwd,
    stdio: silent ? "pipe" : "inherit",
    encoding: "utf8",
  });
}

function getRemoteUrl(cwd, name) {
  try {
    return execSync(`git remote get-url ${name}`, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

function setRemote(cwd, name, orgRepo) {
  const want = `https://github.com/${orgRepo}.git`;
  const have = getRemoteUrl(cwd, name);
  const rel = path.relative(root, cwd) || ".";
  if (have == null) {
    console.log(`git-ensure-remotes: ${rel}  →  git remote add ${name} ${want}`);
    runGit(cwd, ["remote", "add", name, want]);
    return;
  }
  const normalized = have.replace(/\.git$/, "").toLowerCase();
  const w = want.replace(/\.git$/, "").toLowerCase();
  if (normalized === w) {
    console.log(`git-ensure-remotes: ${name} OK in ${rel} (${want})`);
    return;
  }
  if (force) {
    console.warn(`git-ensure-remotes: re-pointing ${name} in ${rel} from ${have} to ${want} (--force)`);
    runGit(cwd, ["remote", "set-url", name, want]);
  } else {
    console.warn(
      `git-ensure-remotes: ${name} in ${rel} is ${have}, expected ${want} — set P31_HOME_GITHUB or p31-github.json, or use --force`
    );
  }
}

function readJsonConfig() {
  if (!fs.existsSync(configPath)) {
    return { homeRepository: null, andromedaRepository: "p31labs/andromeda" };
  }
  return JSON.parse(fs.readFileSync(configPath, "utf8"));
}

function main() {
  const cfg = readJsonConfig();
  const homeRepo = process.env.P31_HOME_GITHUB || cfg.homeRepository;
  const andromedaRepo = process.env.P31_ANDROMEDA_GITHUB || cfg.andromedaRepository || "p31labs/andromeda";

  try {
    execSync("git rev-parse --is-inside-work-tree", { cwd: root, stdio: "pipe" });
  } catch {
    console.error("git-ensure-remotes: not a git repository at", root);
    process.exit(1);
  }

  if (homeRepo) {
    setRemote(root, "origin", homeRepo);
  } else {
    const o = getRemoteUrl(root, "origin");
    if (o) {
      console.log("git-ensure-remotes: home origin:", o, "(set P31_HOME_GITHUB or p31-github.json homeRepository to manage)");
    } else {
      console.log("git-ensure-remotes: no home origin — set p31-github.json homeRepository or P31_HOME_GITHUB=org/repo");
    }
  }

  const andromedaRoot = path.join(root, "andromeda");
  if (fs.existsSync(path.join(andromedaRoot, ".git"))) {
    setRemote(andromedaRoot, "origin", andromedaRepo);
  } else {
    console.log("git-ensure-remotes: no andromeda/.git — skip nested Andromeda remote");
  }

  console.log("git-ensure-remotes: done");
}

main();
