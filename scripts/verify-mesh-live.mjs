#!/usr/bin/env node
/**
 * Optional live probe: k4-personal /api/health + /api/mesh vs p31-constants.json mesh.k4PersonalWorkerUrl.
 * Default: exit 0 even on failure (informational). Set MESH_LIVE_STRICT=1 to fail CI on drift.
 * GET retries: meshGet retries once on 502/503/504/429 or a single TypeError; disable: P31_MESH_RETRY_GET=0
 * Implementation: @p31/mesh (packages/p31-mesh).
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveK4PersonalBaseUrl } from "@p31/mesh/config";
import { runK4PersonalMeshProbe } from "@p31/mesh/probe";

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

const resolved = resolveK4PersonalBaseUrl(root);
if (resolved.skipReason) {
  const reason =
    resolved.skipReason === "no p31-constants.json"
      ? "skip (no p31-constants.json)"
      : resolved.skipReason === "no mesh.k4PersonalWorkerUrl"
        ? "skip (no mesh.k4PersonalWorkerUrl)"
        : `skip (${resolved.skipReason})`;
  bail(0, reason);
}

const base = /** @type {string} */ (resolved.baseUrl);

async function main() {
  const result = await runK4PersonalMeshProbe({ baseUrl: base });
  if (result.ok) {
    console.log("verify-mesh-live: OK", base);
    process.exit(0);
  }
  const primary = result.errors[0] || "probe failed";
  if (strict) bail(1, primary);
  bail(0, primary + " [non-strict: exit 0]");
}

main().catch((e) => {
  console.error("verify-mesh-live:", e);
  process.exit(strict ? 1 : 0);
});
