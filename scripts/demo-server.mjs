#!/usr/bin/env node
/**
 * Serves the P31 home repo root with Python http.server.
 * - Always uses this repo as document root (safe even if npm cwd is wrong in edge cases;
 *   still run from the repo: `cd …/p31` or `npm run demo --prefix /path/to/p31`).
 * - Port: P31_DEMO_PORT (default 8080) — use when 8080 is already in use, e.g. P31_DEMO_PORT=8090
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

if (!fs.existsSync(path.join(root, "soup.html"))) {
  console.error("demo: expected soup.html at repo root:\n  " + root);
  process.exit(1);
}

const raw = String(process.env.P31_DEMO_PORT ?? "8080").trim();
const portN = Number.parseInt(raw, 10);
if (!Number.isFinite(portN) || portN < 1 || portN > 65535) {
  console.error("demo: P31_DEMO_PORT must be 1–65535 (got " + JSON.stringify(process.env.P31_DEMO_PORT) + ")");
  process.exit(1);
}
const port = String(portN);

const base = "http://127.0.0.1:" + port;
console.log("");
console.log("P31 static demo  —  Python http.server, repo root");
console.log("  " + root);
console.log("  " + base + "/soup.html");
if (port === "8080") {
  console.log("  Port 8080 busy?  P31_DEMO_PORT=8090 npm run demo");
} else {
  console.log("  (P31_DEMO_PORT=" + port + ")");
}
console.log("");

const child = spawn("python3", ["-m", "http.server", port], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) process.exit(1);
  process.exit(code == null ? 1 : code);
});
