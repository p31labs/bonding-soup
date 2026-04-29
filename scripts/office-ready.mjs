#!/usr/bin/env node
/**
 * One-shot readiness for p31-office + Zenodo wrapper paths (no network).
 *   npm run office:ready
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { getOperatorJoyLine } from "./lib/operator-joy.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const venvPy = path.join(root, "Discovery", ".venv", "bin", "python");
const zenodo = path.join(root, "p31labs", "scripts", "zenodo_scan_local.py");

let exit = 0;
function fail(msg) {
  console.error("office:ready —", msg);
  exit = 1;
}

function ok(msg) {
  console.log("office:ready ✓", msg);
}

function main() {
  if (!fs.existsSync(venvPy)) {
    fail(`missing ${path.relative(root, venvPy)} — run: npm run office:install`);
    console.error("\nFix: npm run office:install");
    process.exit(1);
  }
  ok(`venv python: ${path.relative(root, venvPy)}`);

  if (!fs.existsSync(zenodo)) {
    fail(`missing ${path.relative(root, zenodo)} — Zenodo scan wrapper unavailable`);
  } else {
    ok(`zenodo script: ${path.relative(root, zenodo)}`);
  }

  const r = spawnSync(venvPy, ["-m", "p31_office.cli", "doctor"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const out = `${r.stdout || ""}${r.stderr || ""}`.trim();
  if (out) console.log(out);
  if (r.status !== 0) {
    fail("p31_office.cli doctor exited non-zero");
  } else {
    ok("p31-office doctor passed");
  }

  if (exit) {
    console.error("\noffice:ready: fix issues above, then: npm run office -- discovery assemble --help");
  } else if (process.stdout.isTTY && process.env.CI !== "true" && process.env.P31_SKIP_JOY !== "1") {
    const j = getOperatorJoyLine(root, { roll: false, short: true });
    if (process.env.NO_COLOR) console.log("\n◆ " + j + "\n");
    else console.log(`\n\x1b[35m◆\x1b[0m ${j}\n`);
  }
  process.exit(exit);
}

main();
