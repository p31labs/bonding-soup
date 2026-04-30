#!/usr/bin/env node
/**
 * k4-personal bundle only (wrangler dry-run) — no live GET /api/health or /api/mesh.
 * Use on laptops without mesh network: npm run verify:mesh-offline
 * Full gate: npm run verify:mesh (adds verify-mesh-live.mjs).
 */
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

execSync("node scripts/verify-k4-personal.mjs", { cwd: root, stdio: "inherit", env: process.env });
console.log("verify-mesh-offline: OK — k4-personal dry-run only");
