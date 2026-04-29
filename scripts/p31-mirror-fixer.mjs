#!/usr/bin/env node
/**
 * Doc-library hub mirror — dry-run by default; optional --apply stages git add in andromeda/.
 *   node scripts/p31-mirror-fixer.mjs           # print status + suggested git commands (exit 0)
 *   node scripts/p31-mirror-fixer.mjs --check   # exit 1 if drift after sync (like verify step)
 *   node scripts/p31-mirror-fixer.mjs --apply   # sync + git add mirror paths (no commit)
 */
import { execFileSync, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { HUB_MIRROR_GIT_PATHSPECS } from "./lib/doc-library-hub-mirror.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const p31ca = path.join(root, "andromeda", "04_SOFTWARE", "p31ca");
const andromeda = path.join(root, "andromeda");

const argv = new Set(process.argv.slice(2));
const apply = argv.has("--apply");
const check = argv.has("--check");

function main() {
  if (process.env.P31_SKIP_DOC_LIB_MIRROR === "1") {
    console.log("p31-mirror-fixer: skip — P31_SKIP_DOC_LIB_MIRROR=1");
    process.exit(0);
  }
  if (!fs.existsSync(p31ca)) {
    console.log("p31-mirror-fixer: skip — no p31ca tree");
    process.exit(0);
  }
  try {
    execFileSync("git", ["-C", andromeda, "rev-parse", "--is-inside-work-tree"], {
      stdio: "pipe",
      encoding: "utf8",
    });
  } catch {
    console.log("p31-mirror-fixer: skip — andromeda/ is not a git work tree");
    process.exit(0);
  }

  console.log("p31-mirror-fixer: running npm run sync:doc-library:p31ca …");
  execSync("npm run sync:doc-library:p31ca", {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      P31_SYNC_DOC_LIB_SKIP_BUILD: process.env.P31_SYNC_DOC_LIB_SKIP_BUILD || "1",
    },
  });

  const out = execFileSync(
    "git",
    ["-C", andromeda, "status", "--porcelain", "--", ...HUB_MIRROR_GIT_PATHSPECS],
    { encoding: "utf8" },
  );
  const lines = out
    .split("\n")
    .map((l) => l.trimEnd())
    .filter(Boolean);

  if (lines.length === 0) {
    console.log("p31-mirror-fixer: OK — no drift after sync");
    process.exit(0);
  }

  console.log("\np31-mirror-fixer: unstaged/staged changes under mirror paths:");
  for (const line of lines) console.log(" ", line);

  const addCmd = [
    "git",
    "-C",
    andromeda,
    "add",
    "--",
    ...HUB_MIRROR_GIT_PATHSPECS,
  ];
  console.log("\nSuggested repair (stage only):");
  console.log(" ", addCmd.map((s) => (s.includes(" ") ? JSON.stringify(s) : s)).join(" "));
  console.log('  then: cd andromeda && git commit -m "chore(p31ca): sync doc-library hub mirror"\n');

  if (apply) {
    console.log("p31-mirror-fixer: --apply → git add …");
    execFileSync("git", ["-C", andromeda, "add", "--", ...HUB_MIRROR_GIT_PATHSPECS], {
      stdio: "inherit",
    });
    console.log("p31-mirror-fixer: staged mirror paths (review + commit in andromeda/)");
    process.exit(0);
  }

  if (check) {
    console.error("p31-mirror-fixer: --check failed — mirror drift remains");
    process.exit(1);
  }

  console.log("p31-mirror-fixer: dry-run complete (exit 0). Use --apply to stage or --check to fail CI.");
  process.exit(0);
}

main();
