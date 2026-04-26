#!/usr/bin/env node
/**
 * P31 home: open PR + auto-merge via gh-pr-automerge.mjs.
 *   npm run pr
 * Repo selection (first match):
 *   P31_PR_IN_HOME=1      → bonding-soup root
 *   P31_PR_IN_ANDROMEDA=1 → andromeda monorepo
 *   else: git top-level of process.cwd() — if andromeda, use it; if home root, use bonding-soup
 *   else: legacy — prefer andromeda when .git + script exist (old default)
 * Title = last commit on that branch unless --title. base = main unless --base.
 * Help: npm run pr -- -h
 */
import { existsSync } from "node:fs";
import { execFileSync, execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const homeRoot = path.join(__dirname, "..");
const andromedaRoot = path.join(homeRoot, "andromeda");
const andromedaScript = path.join(andromedaRoot, "scripts", "gh-pr-automerge.mjs");
const homeScript = path.join(homeRoot, "scripts", "gh-pr-automerge.mjs");

const extra = process.argv.slice(2).filter((x) => x !== "--");

function gitTopLevel(cwd) {
  try {
    return path.resolve(
      execSync("git rev-parse --show-toplevel", {
        cwd,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      }).trim()
    );
  } catch {
    return "";
  }
}

const andromedaHasGit = existsSync(path.join(andromedaRoot, ".git"));
const andromedaHasScript = existsSync(andromedaScript);
const homeHasScript = existsSync(homeScript);

let useAndromeda;
if (process.env.P31_PR_IN_HOME === "1") {
  useAndromeda = false;
} else if (process.env.P31_PR_IN_ANDROMEDA === "1") {
  useAndromeda = true;
} else {
  const cwdRoot = gitTopLevel(process.cwd());
  const ar = path.resolve(andromedaRoot);
  const hr = path.resolve(homeRoot);
  if (cwdRoot && cwdRoot === ar && andromedaHasGit && andromedaHasScript) {
    useAndromeda = true;
  } else if (cwdRoot && cwdRoot === hr && homeHasScript) {
    useAndromeda = false;
  } else {
    useAndromeda = andromedaHasGit && andromedaHasScript;
  }
}

const workRoot = useAndromeda ? andromedaRoot : homeRoot;
const targetScript = useAndromeda ? andromedaScript : homeScript;

function hasValue(flag) {
  const i = extra.indexOf(flag);
  return i >= 0 && extra[i + 1] && !String(extra[i + 1]).startsWith("-");
}

if (extra[0] === "-h" || extra[0] === "--help") {
  const repoLabel = useAndromeda ? "andromeda (monorepo)" : "bonding-soup home";
  console.log(`npm run pr
  → cwd git root → ${repoLabel}; runs: ${path.relative(homeRoot, targetScript)}
  Flags after --: npm run pr -- --base master --title "…"
  P31_PR_IN_HOME=1        → force bonding-soup
  P31_PR_IN_ANDROMEDA=1   → force andromeda
  npm run fix:gh          → gh auth setup-git (credential noise / gitci)
`);
  process.exit(0);
}

if (!existsSync(targetScript)) {
  console.error(
    "pr: missing",
    targetScript,
    "— install script or clone tree; for home-only: ensure scripts/gh-pr-automerge.mjs exists"
  );
  process.exit(1);
}

const argv = [targetScript];
if (!hasValue("--base")) {
  argv.push("--base", "main");
}
if (!hasValue("--title")) {
  const t = execSync("git log -1 --pretty=%s", { cwd: workRoot, encoding: "utf8" }).trim() || "chore: ship";
  argv.push("--title", t);
}
argv.push(...extra);

execFileSync(process.execPath, argv, { stdio: "inherit", cwd: workRoot });
