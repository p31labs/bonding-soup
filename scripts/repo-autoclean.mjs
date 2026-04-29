#!/usr/bin/env node
/**
 * Prune **local** branches already merged into the default base (default **main**).
 * Dry-run unless **`--apply`**. Never deletes the current branch.
 *
 *   npm run automation:autoclean
 *   npm run automation:autoclean:apply
 *
 * Env: **P31_AUTOCLEAN_BASE** (override base, e.g. `master`).
 */
import { execFileSync } from "node:child_process";
import process from "node:process";

const apply = process.argv.includes("--apply");
const base = (process.env.P31_AUTOCLEAN_BASE || "main").trim() || "main";

function sh(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { encoding: "utf8", cwd: process.cwd(), ...opts }).trim();
}

function main() {
  let current;
  try {
    current = sh("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
  } catch {
    console.error("repo-autoclean: not a git repo or git missing");
    process.exit(1);
  }

  try {
    sh("git", ["fetch", "--prune", "origin"]);
  } catch {
    console.warn("repo-autoclean: fetch --prune failed (offline?) — continuing with local data");
  }

  let mergedRaw;
  try {
    mergedRaw = sh("git", ["branch", "--merged", base]);
  } catch {
    console.error(`repo-autoclean: no merged data for base "${base}" — try: git fetch origin ${base}`);
    process.exit(1);
  }

  const merged = mergedRaw
    .split("\n")
    .map((s) => s.replace(/^\*\s*/, "").trim())
    .filter((b) => b && b !== base && b !== "master" && b !== current);

  if (merged.length === 0) {
    console.log(`repo-autoclean: nothing merged into ${base} to remove (current: ${current})`);
    process.exit(0);
  }

  for (const b of merged) {
    if (apply) {
      try {
        sh("git", ["branch", "-d", b]);
        console.log("repo-autoclean: deleted", b);
      } catch (e) {
        console.warn("repo-autoclean: could not delete", b, String(e && e.message ? e.message : e));
      }
    } else {
      console.log("repo-autoclean: [dry-run] would delete", b);
    }
  }

  if (!apply) {
    console.log("repo-autoclean: run with --apply (or npm run automation:autoclean:apply) to delete");
  }
}

main();
