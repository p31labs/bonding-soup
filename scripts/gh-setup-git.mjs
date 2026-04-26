#!/usr/bin/env node
/**
 * One-shot: `gh auth setup-git` (fixes bad credential helpers / "gitci" typos). npm run fix:gh
 */
import { execSync } from "node:child_process";
try {
  execSync("gh auth setup-git", { stdio: "inherit" });
  console.log("fix:gh: done — see https://cli.github.com/manual/gh_auth_setup-git");
} catch (e) {
  process.exit(e?.status ?? 1);
}
