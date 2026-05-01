#!/usr/bin/env node
/**
 * Dry-run bundle for workers/tetra-hub (no Cloudflare API deploy).
 * Skip: P31_SKIP_TETRA_HUB=1
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

if (process.env.P31_SKIP_TETRA_HUB === "1") {
  console.log("verify-tetra-hub: SKIP (P31_SKIP_TETRA_HUB=1)");
  process.exit(0);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const prefix = path.join(root, "workers", "tetra-hub");

const r = spawnSync("npm", ["run", "check", "--prefix", prefix], {
  stdio: "inherit",
  cwd: root,
  env: process.env,
  windowsHide: true,
});
process.exit(r.status === 0 ? 0 : r.status ?? 1);
