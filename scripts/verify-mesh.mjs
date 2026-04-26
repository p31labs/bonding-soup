#!/usr/bin/env node
/**
 * One command: k4-personal wrangler dry-run + live GET /api/health + /api/mesh (vs p31-constants).
 * Default: MESH_LIVE_STRICT=1. Set MESH_LIVE_STRICT=0 to allow offline / flaky network.
 */
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const env = { ...process.env };
if (env.MESH_LIVE_STRICT === undefined) {
  env.MESH_LIVE_STRICT = "1";
}

execSync("node scripts/verify-k4-personal.mjs", { cwd: root, stdio: "inherit", env });
execSync("node scripts/verify-mesh-live.mjs", { cwd: root, stdio: "inherit", env });
