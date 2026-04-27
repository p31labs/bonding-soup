#!/usr/bin/env node
/**
 * Optional live probe: k4-personal /api/health + /api/mesh vs p31-constants.json mesh.k4PersonalWorkerUrl.
 * Default: exit 0 even on failure (informational). Set MESH_LIVE_STRICT=1 to fail CI on drift.
 * GET retries: meshGet retries once on 502/503/504/429 or a single TypeError; disable: P31_MESH_RETRY_GET=0
 * Latency: p31-facts.json mesh.k4PersonalProbeBudgetMs (warn if exceeded). P31_MESH_PROBE_BUDGET_MS overrides.
 * MESH_BUDGET_STRICT=1 → exit 1 when duration exceeds budget (and budget is set).
 * Implementation: @p31/mesh (packages/p31-mesh).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveK4PersonalBaseUrl } from "@p31/mesh/config";
import { runK4PersonalMeshProbe } from "@p31/mesh/probe";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const strict = process.env.MESH_LIVE_STRICT === "1";
const budgetStrict = process.env.MESH_BUDGET_STRICT === "1";

/**
 * @returns {number | undefined} ms
 */
function loadK4ProbeBudgetMs() {
  const env = process.env.P31_MESH_PROBE_BUDGET_MS;
  if (env && String(env).trim() !== "") {
    const n = parseInt(String(env), 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  const factsPath = path.join(root, "p31-facts.json");
  if (!fs.existsSync(factsPath)) return undefined;
  try {
    const j = JSON.parse(fs.readFileSync(factsPath, "utf8"));
    const b = j?.mesh?.k4PersonalProbeBudgetMs;
    if (typeof b === "number" && Number.isFinite(b) && b > 0) return b;
  } catch {
    /* */
  }
  return undefined;
}

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
  const budgetMs = loadK4ProbeBudgetMs();
  const result = await runK4PersonalMeshProbe({ baseUrl: base });
  const ms = typeof result.durationMs === "number" ? ` (${result.durationMs}ms)` : "";
  const over =
    budgetMs != null && typeof result.durationMs === "number" && result.durationMs > budgetMs;
  if (over) {
    const msg = `SLOW: ${result.durationMs}ms > budget ${budgetMs}ms (p31-facts or P31_MESH_PROBE_BUDGET_MS)`;
    console.error("verify-mesh-live:", msg);
    if (budgetStrict) {
      process.exit(1);
    }
  }
  if (result.ok) {
    console.log("verify-mesh-live: OK", base + ms);
    process.exit(0);
  }
  const primary = result.errors[0] || "probe failed";
  if (strict) bail(1, primary + ms);
  bail(0, primary + ms + " [non-strict: exit 0]");
}

main().catch((e) => {
  console.error("verify-mesh-live:", e);
  process.exit(strict ? 1 : 0);
});
