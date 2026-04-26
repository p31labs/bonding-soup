#!/usr/bin/env node
/**
 * Point this repo at .githooks/ so the monetary pre-commit runs after `npm run setup` or `npm run git:hooks`.
 * No-op if not a git work tree or .githooks/pre-commit is missing. Safe to run repeatedly.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const pre = path.join(root, ".githooks", "pre-commit");

if (!fs.existsSync(pre)) {
  console.log("git-hooks-config: no .githooks/pre-commit — skip");
  process.exit(0);
}

try {
  execSync("git rev-parse --is-inside-work-tree", { cwd: root, stdio: "pipe" });
} catch {
  console.log("git-hooks-config: not a git work tree — skip");
  process.exit(0);
}

try {
  execSync("git config core.hooksPath .githooks", { cwd: root, stdio: "inherit" });
} catch (e) {
  console.error("git-hooks-config: failed to set core.hooksPath", e);
  process.exit(1);
}

console.log("git-hooks-config: core.hooksPath = .githooks  (P31_SKIP_MONETARY_HOOK=1 to bypass on commit)");
process.exit(0);
