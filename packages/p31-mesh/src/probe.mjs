/**
 * Live probes for k4-personal: GET /api/health + GET /api/mesh
 */
import { meshGet } from "./client.mjs";
import { validateK4PersonalHealth } from "./schemas.mjs";

/**
 * @typedef {object} ProbeStepResult
 * @property {boolean} ok
 * @property {number} status
 * @property {string} [textPreview]
 * @property {string} [error]
 */

/**
 * @typedef {object} K4PersonalMeshProbeResult
 * @property {boolean} ok
 * @property {string} baseUrl
 * @property {ProbeStepResult} health
 * @property {ProbeStepResult} mesh
 * @property {string[]} errors - Human-readable failures
 */

/**
 * @param {object} opts
 * @param {string} opts.baseUrl
 * @param {typeof fetch} [opts.fetch]
 * @param {number} [opts.timeoutMs]
 * @returns {Promise<K4PersonalMeshProbeResult>}
 */
export async function runK4PersonalMeshProbe(opts) {
  const { baseUrl, fetch: fetchImpl, timeoutMs } = opts;
  const base = baseUrl.replace(/\/+$/, "");
  const errors = [];

  /** @type {ProbeStepResult} */
  let health = { ok: false, status: 0, error: "not run" };
  /** @type {ProbeStepResult} */
  let mesh = { ok: false, status: 0, error: "not run" };

  try {
    const h = await meshGet(base, "/api/health", { fetch: fetchImpl, timeoutMs });
    health = {
      ok: h.status === 200,
      status: h.status,
      textPreview: h.text ? h.text.slice(0, 200) : "",
    };
    if (h.status !== 200) {
      errors.push(
        `GET /api/health → HTTP ${h.status} (deploy: pnpm --filter k4-personal deploy from andromeda/04_SOFTWARE)`
      );
    } else {
      const v = validateK4PersonalHealth(h.json);
      if (!v.ok) {
        health.ok = false;
        errors.push(`GET /api/health body unexpected: ${health.textPreview}`);
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    health = { ok: false, status: 0, error: msg };
    errors.push(`GET /api/health failed: ${msg}`);
  }

  try {
    const m = await meshGet(base, "/api/mesh", { fetch: fetchImpl, timeoutMs });
    mesh = {
      ok: m.status === 200,
      status: m.status,
      textPreview: m.text ? m.text.slice(0, 200) : "",
    };
    if (m.status !== 200) {
      errors.push(`GET /api/mesh → HTTP ${m.status}`);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    mesh = { ok: false, status: 0, error: msg };
    errors.push(`GET /api/mesh failed: ${msg}`);
  }

  const ok = health.ok && mesh.ok;
  return { ok, baseUrl: base, health, mesh, errors };
}

/**
 * Map probe result to process exit code for CI-style runners.
 * @param {K4PersonalMeshProbeResult} result
 * @param {boolean} strict
 * @returns {0 | 1}
 */
export function probeExitCode(result, strict) {
  if (result.ok) return 0;
  return strict ? 1 : 0;
}
