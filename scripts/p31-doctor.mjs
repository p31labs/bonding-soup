#!/usr/bin/env node
/**
 * One-shot friction check: Node, git remotes, gh auth, CONNECTION brief, optional live probes.
 *   npm run doctor
 *   npm run doctor -- --verify     # chain npm run verify after checks
 *   npm run doctor -- --mesh       # strict mesh probe (needs network + prod URL)
 *   npm run doctor -- --fun        # after all checks (and --verify if passed), print one calm joy line
 */
import { execFileSync, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { printConnectionBrief } from "./p31-connection.mjs";
import { getOperatorJoyLine } from "./lib/operator-joy.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const argvRaw = process.argv.slice(2);
const wantFun = argvRaw.includes("--fun");
const args = new Set(argvRaw.filter((x) => x !== "--" && x !== "--fun"));

function ok(msg) {
  console.log("\x1b[32m✓\x1b[0m", msg);
}
function warn(msg) {
  console.log("\x1b[33m⚠\x1b[0m", msg);
}
function fail(msg) {
  console.error("\x1b[31m✗\x1b[0m", msg);
}

function sh(cmd, cwd = root) {
  return execSync(cmd, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

let exit = 0;
const major = process.version.match(/^v(\d+)/);
if (!major || Number(major[1]) < 20) {
  fail(`Node 20+ required (.nvmrc). Got ${process.version}`);
  exit = 1;
} else {
  ok(`Node ${process.version}`);
}

try {
  execFileSync(process.execPath, [path.join(root, "scripts/git-ensure-remotes.mjs")], {
    cwd: root,
    stdio: "inherit",
  });
  ok("git remotes (git-ensure-remotes)");
} catch {
  warn("git-ensure-remotes failed — check p31-github.json / P31_HOME_GITHUB");
  exit = 1;
}

try {
  const origin = sh("git remote get-url origin");
  ok(`home origin: ${origin}`);
} catch {
  warn("no git remote origin on home root");
  exit = 1;
}

try {
  sh("gh api user --jq .login");
  ok("gh CLI authenticated");
} catch {
  warn("gh not logged in — run: gh auth login   then: npm run fix:gh");
  exit = 1;
}

const andr = path.join(root, "andromeda");
if (fs.existsSync(path.join(andr, ".git"))) {
  try {
    const o = sh("git remote get-url origin", andr);
    ok(`andromeda origin: ${o}`);
  } catch {
    warn("andromeda: no origin — run npm run git:remotes from home");
    exit = 1;
  }
}

printConnectionBrief();

if (args.has("--mesh")) {
  try {
    execFileSync(process.execPath, [path.join(root, "scripts/verify-mesh-live.mjs")], {
      cwd: root,
    stdio: "inherit",
    env: { ...process.env, MESH_LIVE_STRICT: "1" },
  });
    ok("mesh live (strict)");
  } catch {
    fail("mesh live strict failed — offline? use: npm run release:local");
    exit = 1;
  }
}

console.log(
  "\n\x1b[36mNext\x1b[0m  npm run connection  ·  pnpm pr  ·  npm run release:all  ·  loose mesh: npm run release:local"
);
console.log(
  "        Family handoff (after deploy): https://p31ca.org/family-pack\n" +
    "        Still manual: passkey Worker deploy, personal-tetra same-origin bundling, ECO hub index merge (see AGENTS.md)."
);

if (args.has("--verify")) {
  console.log("\n\x1b[36m▶\x1b[0m npm run verify\n");
  try {
    execSync("npm run verify", { cwd: root, stdio: "inherit" });
    ok("npm run verify");
  } catch {
    fail("npm run verify failed");
    process.exit(1);
  }
}

if (wantFun && exit === 0) {
  const line = getOperatorJoyLine(root, { roll: false, short: true });
  if (process.env.NO_COLOR) {
    console.log("\n◆ " + line + "\n");
  } else {
    console.log(`\n\x1b[35m◆\x1b[0m ${line}\n`);
  }
}

process.exit(exit);
