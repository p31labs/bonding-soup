/**
 * Lane check executors for p31.launchReadiness/0.1.0.
 * Each runner returns { status: "pass"|"warn"|"fail"|"skip", reason: string, evidence?: any }.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

/** @typedef {{ id: string, kind: string, [k: string]: any }} Check */
/** @typedef {{ status: "pass"|"warn"|"fail"|"skip", reason: string, evidence?: any, durationMs?: number }} CheckResult */

/**
 * @param {string} cmd
 * @param {string} cwd
 * @param {number} timeoutMs
 */
function runCmd(cmd, cwd, timeoutMs = 120_000) {
  const started = Date.now();
  const r = spawnSync(cmd, {
    cwd,
    shell: true,
    stdio: "pipe",
    encoding: "utf8",
    timeout: timeoutMs,
  });
  const durationMs = Date.now() - started;
  const out = (r.stdout || "") + (r.stderr || "");
  return { status: r.status ?? null, output: out.slice(-2_000), durationMs, signal: r.signal };
}

/**
 * @param {Check} check
 * @param {{ root: string, mode: string, glassReport: any|null, allowSkip: Set<string> }} ctx
 * @returns {CheckResult}
 */
export function runCheck(check, ctx) {
  switch (check.kind) {
    case "cmd":
      return runCmdCheck(check, ctx);
    case "file-exists":
      return runFileExistsCheck(check, ctx);
    case "json-key":
      return runJsonKeyCheck(check, ctx);
    case "no-glob":
      return runNoGlobCheck(check, ctx);
    case "glass-probe":
      return runGlassProbeCheck(check, ctx);
    case "human-checklist":
      return runHumanChecklist(check, ctx);
    default:
      return { status: "fail", reason: `unknown check kind: ${check.kind}` };
  }
}

function runCmdCheck(check, ctx) {
  if (check.optional && !canRunCmd(check.command, ctx)) {
    return { status: "skip", reason: "optional path missing for command" };
  }
  if (ctx.allowSkip.has(check.id)) {
    return { status: "skip", reason: `mode '${ctx.mode}' allows skip` };
  }
  const r = runCmd(check.command, ctx.root, check.timeoutMs || 180_000);
  if (r.signal === "SIGTERM") {
    return { status: "fail", reason: `timeout: ${check.command}`, durationMs: r.durationMs };
  }
  if (r.status === 0) {
    return { status: "pass", reason: check.command, durationMs: r.durationMs };
  }
  return {
    status: "fail",
    reason: `exit ${r.status} from ${check.command}`,
    evidence: { tail: r.output },
    durationMs: r.durationMs,
  };
}

function canRunCmd(command, ctx) {
  // For optional p31ca commands, ensure the prefix exists.
  if (command.includes("--prefix andromeda/04_SOFTWARE/p31ca")) {
    return fs.existsSync(path.join(ctx.root, "andromeda/04_SOFTWARE/p31ca/package.json"));
  }
  return true;
}

function runFileExistsCheck(check, ctx) {
  const p = path.join(ctx.root, check.path);
  if (fs.existsSync(p)) return { status: "pass", reason: check.path };
  if (check.optional) return { status: "skip", reason: `optional file missing: ${check.path}` };
  return { status: "fail", reason: `missing: ${check.path}` };
}

function runJsonKeyCheck(check, ctx) {
  const p = path.join(ctx.root, check.path);
  if (!fs.existsSync(p)) {
    return { status: check.optional ? "skip" : "fail", reason: `missing file: ${check.path}` };
  }
  try {
    const j = JSON.parse(fs.readFileSync(p, "utf8"));
    const v = check.key.split(".").reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), j);
    if (v === undefined || v === null || v === "") {
      return { status: "fail", reason: `key empty: ${check.path}#${check.key}` };
    }
    return { status: "pass", reason: `${check.path}#${check.key}=${typeof v === "string" ? v : JSON.stringify(v)}` };
  } catch (e) {
    return { status: "fail", reason: `parse error ${check.path}: ${e.message}` };
  }
}

function runNoGlobCheck(check, ctx) {
  // Only check exact filename at root (e.g. ".env") — never traverse.
  const p = path.join(ctx.root, check.glob);
  if (fs.existsSync(p)) {
    return { status: "fail", reason: `committed secret risk: ${check.glob} present at root` };
  }
  return { status: "pass", reason: `no ${check.glob} at root` };
}

function runGlassProbeCheck(check, ctx) {
  if (!ctx.glassReport) {
    return { status: "skip", reason: "no /tmp/p31_glass_report.json (run npm run ecosystem:glass)" };
  }
  const probes = Array.isArray(ctx.glassReport.probes) ? ctx.glassReport.probes : [];
  const row = probes.find((p) => p && (p.id === check.probeId || p.name === check.probeId));
  if (!row) return { status: "warn", reason: `probe not found: ${check.probeId}` };
  if (row.state === "up" || row.status === "up" || row.level === "up") {
    return { status: "pass", reason: `${check.probeId}: up` };
  }
  return { status: "fail", reason: `${check.probeId}: ${row.level || row.state || row.status || "unknown"}` };
}

function runHumanChecklist(check, ctx) {
  const p = path.join(ctx.root, check.path);
  if (!fs.existsSync(p)) {
    return { status: "fail", reason: `missing checklist: ${check.path}` };
  }
  let j;
  try {
    j = JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    return { status: "fail", reason: `parse error: ${e.message}` };
  }
  const gates = Array.isArray(j.gates) ? j.gates : [];
  if (!gates.length) return { status: "fail", reason: "no gates" };
  const total = gates.length;
  const met = gates.filter((g) => g.status === "met").length;
  const blocked = gates.filter((g) => g.status === "blocked");
  const pendingCritical = gates.filter((g) => g.critical && g.status !== "met");
  const ratio = met / total;

  const evidence = {
    total,
    met,
    blocked: blocked.map((g) => g.id),
    pendingCritical: pendingCritical.map((g) => g.id),
  };

  if (ctx.mode === "gate" && pendingCritical.length > 0) {
    return { status: "fail", reason: `gate mode: ${pendingCritical.length} critical gates not met`, evidence };
  }
  if (blocked.length > 0) {
    return { status: "fail", reason: `${blocked.length} blocked gates`, evidence };
  }
  if (pendingCritical.length > 0) {
    return { status: "warn", reason: `${pendingCritical.length} critical gates pending`, evidence };
  }
  if (ratio < 1) return { status: "warn", reason: `${total - met} gates pending (non-critical)`, evidence };
  return { status: "pass", reason: `all ${total} gates met`, evidence };
}
