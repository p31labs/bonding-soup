#!/usr/bin/env node
/**
 * After docs/doc-library is built, ensure the p31ca public mirror matches `sync:doc-library:p31ca`.
 * Runs sync (idempotent), then fails if the Andromeda git work tree still has unstaged mirror drift.
 *
 * Skips: no p31ca tree, andromeda/ not a git work tree, or P31_SKIP_DOC_LIB_MIRROR=1.
 * Home CI (no andromeda): skip. Full dev tree: enforces two-repo discipline for hub deploy.
 */
import { execFileSync, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const p31ca = path.join(root, "andromeda", "04_SOFTWARE", "p31ca");
const andromeda = path.join(root, "andromeda");

const MIRROR_PATHSPECS = [
  "04_SOFTWARE/p31ca/public/doc-library",
  "04_SOFTWARE/p31ca/public/p31-bonding.webmanifest",
  "04_SOFTWARE/p31ca/public/p31-bonding-icons",
  "04_SOFTWARE/p31ca/public/cognitive-passport",
];

function main() {
  if (process.env.P31_SKIP_DOC_LIB_MIRROR === "1") {
    console.log("verify-doc-library-p31ca-mirror: skip — P31_SKIP_DOC_LIB_MIRROR=1");
    return;
  }
  if (!fs.existsSync(p31ca)) {
    console.log("verify-doc-library-p31ca-mirror: skip — no p31ca tree");
    return;
  }
  try {
    execFileSync("git", ["-C", andromeda, "rev-parse", "--is-inside-work-tree"], {
      cwd: root,
      stdio: "pipe",
    });
  } catch {
    console.log("verify-doc-library-p31ca-mirror: skip — andromeda/ is not a git work tree");
    return;
  }

  execSync("npm run sync:doc-library:p31ca", { cwd: root, stdio: "inherit" });

  const out = execFileSync(
    "git",
    ["-C", andromeda, "status", "--porcelain", "--", ...MIRROR_PATHSPECS],
    { cwd: root, encoding: "utf8" }
  );
  const lines = out
    .split("\n")
    .map((l) => l.trimEnd())
    .filter(Boolean);

  if (lines.length === 0) {
    console.log("verify-doc-library-p31ca-mirror: OK — hub mirror matches sync output");
    return;
  }

  console.error(
    "verify-doc-library-p31ca-mirror: FAIL — Andromeda p31ca mirror paths differ from sync (stage + commit in andromeda):"
  );
  for (const line of lines) console.error(" ", line);
  console.error("\nRepair: cd andromeda && git add 04_SOFTWARE/p31ca/public/doc-library \\");
  console.error("  04_SOFTWARE/p31ca/public/p31-bonding.webmanifest \\");
  console.error("  04_SOFTWARE/p31ca/public/p31-bonding-icons \\");
  console.error("  04_SOFTWARE/p31ca/public/cognitive-passport && git commit -m \"chore(p31ca): sync doc-library hub mirror\"");
  console.error("Bypass (local only): P31_SKIP_DOC_LIB_MIRROR=1 npm run verify");
  process.exit(1);
}

main();
