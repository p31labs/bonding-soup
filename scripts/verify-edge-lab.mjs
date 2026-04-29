#!/usr/bin/env node
/**
 * Dry-run bundle for packages/cf-edge-lab (no Cloudflare API deploy).
 * Registry: p31-alignment.json id cf-edge-lab-worker-suite
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const r = spawnSync("npm", ["run", "check", "--prefix", path.join(root, "packages", "cf-edge-lab")], {
  stdio: "inherit",
  cwd: root,
  env: process.env,
  windowsHide: true,
});
process.exit(r.status === 0 ? 0 : r.status ?? 1);
