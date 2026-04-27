#!/usr/bin/env node
/**
 * One-shot local environment alignment: Node version, root deps, soup:prep (dist/ + Soup assets), generated artifacts, verify, p31ca deps.
 * Idempotent. Does not run wrangler, mesh live strict checks, or pnpm for full Andromeda (use setup:andromeda).
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const major = process.version.match(/^v(\d+)/);
if (!major || Number(major[1]) < 20) {
  console.error("setup: need Node 20+ (see .nvmrc). Current:", process.version);
  process.exit(1);
}

function run(cmd, cwd = root) {
  console.log(`\n\x1b[36m▶\x1b[0m ${cmd}\n`);
  execSync(cmd, { cwd, stdio: "inherit" });
}

function exists(p) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

run("npm install", root);
run("npm run soup:prep", root);
run("node scripts/apply-constants.mjs", root);

const canon = path.join(root, "andromeda/04_SOFTWARE/design-tokens/p31-universal-canon.json");
if (exists(canon)) {
  run("node scripts/apply-p31-style.mjs", root);
}

run("npm run verify", root);

const p31ca = path.join(root, "andromeda/04_SOFTWARE/p31ca");
if (exists(path.join(p31ca, "package.json"))) {
  run("npm install", p31ca);
  console.log(
    "\nHub build (optional):  cd andromeda/04_SOFTWARE/p31ca  &&  npm run build\n" +
      "Full monorepo pnpm:     npm run setup:andromeda\n"
  );
} else {
  console.log(
    "\nNo p31ca tree at andromeda/04_SOFTWARE/p31ca — root verify is home-only. Clone Andromeda for the full hub.\n"
  );
}

console.log("Local demo:  npm run demo  →  http://127.0.0.1:8080/soup.html  (docs/SOUP-LOCAL-DEMO.md; P31_DEMO_PORT if :8080 busy)\n");

try {
  execSync("node scripts/git-hooks-config.mjs", { cwd: root, stdio: "inherit" });
} catch {
  /* not a git checkout or git missing */
}

try {
  execSync("node scripts/git-ensure-remotes.mjs", { cwd: root, stdio: "inherit" });
} catch {
  /* optional; P31_HOME_GITHUB or p31-github.json homeRepository configures origin */
}
