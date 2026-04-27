/**
 * Single resolver for mesh latency budgets in p31-facts.json (mesh.k4PersonalProbeBudgetMs, mesh.glassProbeBudgetMs)
 * and env overrides. Used by verify-mesh-live, ecosystem-glass, and mesh:budgets.
 */
import fs from "node:fs";
import path from "node:path";

/**
 * @param {string} rootDir
 * @returns {Record<string, unknown> | null}
 */
function readFactsMeshBlock(rootDir) {
  const p = path.join(rootDir, "p31-facts.json");
  if (!fs.existsSync(p)) return null;
  try {
    const j = JSON.parse(fs.readFileSync(p, "utf8"));
    const m = j?.mesh;
    return m && typeof m === "object" ? /** @type {Record<string, unknown>} */ (m) : null;
  } catch {
    return null;
  }
}

/**
 * verify-mesh-live. Env P31_MESH_PROBE_BUDGET_MS wins when a positive integer.
 * @param {string} rootDir
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {number | undefined} ms; undefined = no SLO
 */
export function resolveK4PersonalProbeBudgetMs(rootDir, env = process.env) {
  const e = env.P31_MESH_PROBE_BUDGET_MS;
  if (e && String(e).trim() !== "") {
    const n = parseInt(String(e), 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  const m = readFactsMeshBlock(rootDir);
  const b = m?.k4PersonalProbeBudgetMs;
  if (typeof b === "number" && Number.isFinite(b) && b > 0) return b;
  return undefined;
}

/**
 * ecosystem-glass per-row budget. Env P31_GLASS_BUDGET_MS wins when a positive integer;
 * 0 or invalid with env set disables facts for this run. No env → p31-facts, else 0.
 * @param {string} rootDir
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {number} ms; 0 = off
 */
export function resolveGlassProbeBudgetMs(rootDir, env = process.env) {
  const e = env.P31_GLASS_BUDGET_MS;
  if (e != null && String(e).trim() !== "") {
    const n = parseInt(String(e), 10);
    if (Number.isFinite(n) && n > 0) return n;
    return 0;
  }
  const m = readFactsMeshBlock(rootDir);
  const b = m?.glassProbeBudgetMs;
  if (typeof b === "number" && Number.isFinite(b) && b > 0) return b;
  return 0;
}
