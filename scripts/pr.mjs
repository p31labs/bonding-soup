#!/usr/bin/env node
/**
 * P31 home: if andromeda/.git + scripts/gh-pr-automerge.mjs exist, ship from that repo in one call.
 *   npm run pr
 * Title = last commit on that branch; base = main. Override: P31_PR_IN_HOME=1 to use home root only.
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
const useAndromeda =
  process.env.P31_PR_IN_HOME !== "1" && existsSync(path.join(andromedaRoot, ".git")) && existsSync(andromedaScript);
const homeScript = path.join(homeRoot, "scripts", "gh-pr-automerge.mjs");
const workRoot = useAndromeda ? andromedaRoot : homeRoot;
const targetScript = useAndromeda ? andromedaScript : homeScript;
const extra = process.argv.slice(2).filter((x) => x !== "--");

function hasValue(flag) {
  const i = extra.indexOf(flag);
  return i >= 0 && extra[i + 1] && !String(extra[i + 1]).startsWith("-");
}
if (extra[0] === "-h" || extra[0] === "--help") {
  console.log(`npm run pr
  → from ${workRoot} (andromeda when present). Add flags after: npm run pr -- --base master
  P31_PR_IN_HOME=1  → use bonding-soup root only
  npm run fix:gh  → gh auth setup-git (credential noise / gitci)
`);
  process.exit(0);
}
if (!existsSync(targetScript)) {
  console.error("pr: missing", targetScript, "— need andromeda tree or run from monorepo clone: pnpm pr");
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
