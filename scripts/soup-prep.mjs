#!/usr/bin/env node
/**
 * Build TypeScript → dist/, verify soup.html import graph + static assets co-play needs.
 *   npm run soup:prep
 *   npm run soup:prep:check   # no tsc — use right after npm run verify (or CI)
 *
 * Flags: --check  same as prep:check (skip build)
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const args = process.argv.slice(2);
const checkOnly = args.includes("--check");

function warn(msg) {
  console.warn("\x1b[33msoup:prep:\x1b[0m " + msg);
}

if (!checkOnly) {
  const build = spawnSync("npm", ["run", "build"], { cwd: root, stdio: "inherit", env: process.env });
  if (build.status !== 0) process.exit(build.status ?? 1);
}

const distModules = [
  "dist/soup.js",
  "dist/tutorial.js",
  "dist/performance-dashboard.js",
  "dist/particles.js",
  "dist/memory-panel.js",
];

const staticForSoup = [
  "cognitive-passport/p31-style.css",
  "cognitive-passport/p31-responsive-surface.css",
  "soup-quantum.css",
  "p31-constants.json",
  "p31-bonding.webmanifest",
  "p31-bonding-icons/p31-icon.svg",
];

let missing = false;
for (const rel of distModules) {
  if (!fs.existsSync(path.join(root, rel))) {
    console.error("soup:prep: missing " + rel + (checkOnly ? " (run npm run soup:prep without --check)" : " after build"));
    missing = true;
  }
}
for (const rel of staticForSoup) {
  if (!fs.existsSync(path.join(root, rel))) {
    console.error("soup:prep: missing static asset " + rel);
    missing = true;
  }
}
if (missing) process.exit(1);

const wsPkg = path.join(root, "node_modules", "ws", "package.json");
if (!fs.existsSync(wsPkg)) {
  warn("root has no `ws` — install devDependencies (`npm install`) before mock WebSocket / npm run test:mock-ws.");
}

const py = spawnSync("python3", ["--version"], { cwd: root, stdio: "ignore" });
if (py.status !== 0) {
  warn("python3 not found — `npm run demo` needs Python 3 (see scripts/demo-server.mjs; default :8080, override P31_DEMO_PORT).");
}

console.log("\nSoup prep OK — dist/ and static paths are ready.");
console.log("  · Static server:    npm run demo  →  http://127.0.0.1:8080/soup.html  (P31_DEMO_PORT=… if :8080 busy)");
console.log("  · Co-play WS:       node spikes/mock-ws-server/server.js  (uses root node_modules/ws)");
console.log("  · Room-scale gate:  npm run soup:room-scale  (docs/SOUP-ROOM-SCALE-RUNBOOK.md)");
console.log("  · Quick re-check:   npm run soup:prep:check  (after verify, no rebuild)\n");
