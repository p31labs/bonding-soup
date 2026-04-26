#!/usr/bin/env node
/**
 * Optional live probe: k4-personal /api/health + /api/mesh vs p31-constants.json mesh.k4PersonalWorkerUrl.
 * Default: exit 0 even on failure (informational). Set MESH_LIVE_STRICT=1 to fail CI on drift.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const strict = process.env.MESH_LIVE_STRICT === "1";

function bail(code, msg) {
  if (msg) {
    if (code !== 0) console.error("verify-mesh-live:", msg);
    else console.log("verify-mesh-live:", msg);
  }
  process.exit(code);
}

const constantsPath = path.join(root, "p31-constants.json");
if (!fs.existsSync(constantsPath)) {
  bail(0, "skip (no p31-constants.json)");
}

const c = JSON.parse(fs.readFileSync(constantsPath, "utf8"));
const base = c.mesh?.k4PersonalWorkerUrl;
if (!base) {
  bail(0, "skip (no mesh.k4PersonalWorkerUrl)");
}

async function get(suffix) {
  const u = new URL(suffix, base);
  const r = await fetch(u, { method: "GET" });
  const text = await r.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { r, text, json };
}

async function main() {
  const health = await get("/api/health");
  if (health.r.status !== 200) {
    const msg = `GET /api/health → HTTP ${health.r.status} (deploy: pnpm --filter k4-personal deploy from andromeda/04_SOFTWARE)`;
    if (strict) bail(1, msg);
    bail(0, msg + " [non-strict: exit 0]");
  }
  if (health.json?.service !== "k4-personal" || health.json?.scope !== "personal") {
    const msg = `GET /api/health body unexpected: ${String(health.text).slice(0, 200)}`;
    if (strict) bail(1, msg);
    bail(0, msg + " [non-strict: exit 0]");
  }

  const mesh = await get("/api/mesh");
  if (mesh.r.status !== 200) {
    const msg = `GET /api/mesh → HTTP ${mesh.r.status}`;
    if (strict) bail(1, msg);
    bail(0, msg + " [non-strict: exit 0]");
  }

  console.log("verify-mesh-live: OK", base);
  process.exit(0);
}

main().catch((e) => {
  console.error("verify-mesh-live:", e);
  process.exit(strict ? 1 : 0);
});
