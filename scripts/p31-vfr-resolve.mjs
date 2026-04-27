/**
 * P31 VFR control law: AUTO vs MANUAL with voltage (depth %) and frequency (bus Hz).
 *
 * - voltage 0–100: depth (parallel gates always on when present); root verify from 45%+, glass from 80%+
 * - frequency Hz: 50 = cruise/loose mesh, 60 = nominal, ≥65 = strict live mesh; 400 = same as strict
 */
import fs from "node:fs";
import path from "node:path";

const defaultManualPath = () =>
  process.env.P31_VFR_FILE ||
  (process.env.HOME || process.env.USERPROFILE
    ? path.join(process.env.HOME || process.env.USERPROFILE || "", ".p31", "vfr.json")
    : "");

/**
 * @typedef {object} VfrPlan
 * @property {"auto" | "manual"} mode
 * @property {number} voltagePercent
 * @property {number} frequencyHz
 * @property {boolean} runParallelGates
 * @property {boolean} runMesh
 * @property {boolean} meshLiveStrict
 * @property {boolean} runRootVerify
 * @property {boolean} runGlass
 * @property {boolean} runPasskeyDryRun
 * @property {string} summary
 */

/**
 * @param {object} o
 * @param {"auto" | "manual"} o.mode
 * @param {number} [o.voltagePercent] manual: override
 * @param {number} [o.frequencyHz] manual: override
 * @param {boolean} [o.autoGlass] AUTO: run glass
 * @param {import("node:fs")} [o.fs] test only
 * @param {string} [o.manualPath] default ~/.p31/vfr.json
 * @returns {VfrPlan}
 */
export function resolveVfrSync(o) {
  const fsm = o.fs || fs;
  if (o.mode === "auto") {
    const autoGlass = o.autoGlass === true || String(process.env.P31_VFR_AUTO_GLASS) === "1";
    const skipPk = String(process.env.P31_VFR_SKIP_PASSKEY) === "1";
    return {
      mode: "auto",
      voltagePercent: 100,
      frequencyHz: 60,
      runParallelGates: true,
      runMesh: true,
      meshLiveStrict: true,
      runRootVerify: true,
      runGlass: autoGlass,
      runPasskeyDryRun: !skipPk,
      summary:
        "AUTO: V=100% F=60Hz — parallel + mesh (strict) + root verify; glass " +
        (autoGlass ? "on" : "off (P31_VFR_AUTO_GLASS=1 for glass); passkey dry-run " + (skipPk ? "off" : "on")),
    };
  }

  let v = o.voltagePercent;
  let f = o.frequencyHz;
  const p = o.manualPath || defaultManualPath();

  if (v == null && p && fsm.existsSync(p)) {
    try {
      const raw = JSON.parse(String(fsm.readFileSync(p, "utf8")));
      if (raw.voltagePercent != null) v = Number(raw.voltagePercent);
      if (raw.frequencyHz != null) f = Number(raw.frequencyHz);
    } catch {
      // ignore
    }
  }
  if (v == null) v = process.env.P31_VFR_VOLTAGE != null ? Number(process.env.P31_VFR_VOLTAGE) : 60;
  if (f == null) f = process.env.P31_VFR_FREQUENCY != null ? Number(process.env.P31_VFR_FREQUENCY) : 50;

  v = Math.max(0, Math.min(100, Number.isFinite(v) ? v : 60));
  f = Number.isFinite(f) ? f : 50;

  const meshLiveStrict = f >= 65;
  const runMesh = v >= 15;
  const runRootVerify = v >= 45;
  const runGlass = v >= 80;
  const runPasskeyDryRun = v >= 20 && String(process.env.P31_VFR_SKIP_PASSKEY) !== "1";

  return {
    mode: "manual",
    voltagePercent: v,
    frequencyHz: f,
    runParallelGates: true,
    runMesh,
    meshLiveStrict,
    runRootVerify,
    runGlass,
    runPasskeyDryRun,
    summary: `MANUAL: V=${v}% F=${f}Hz — mesh ${runMesh ? (meshLiveStrict ? "strict" : "loose") : "off"}, root ${runRootVerify}, glass ${runGlass}, passkey ${runPasskeyDryRun ? "on" : "off"} (${p || "env only"})`,
  };
}
