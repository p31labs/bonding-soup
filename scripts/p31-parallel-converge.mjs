#!/usr/bin/env node
/**
 * Parallel tracks → one convergence (exit + JSON report).
 * A=ECO/parity, B=passkey bundle, C=education surface, D=node-zero package, + stack links.
 * Optional serial cap: P31_CONVERGE_VERIFY=1 runs root `npm run verify` after parallel wave.
 *
 * P31_CONVERGE_SKIP_PASSKEY=1  — skip passkey wrangler --dry-run (slow / offline).
 * P31_CONVERGE_STACK=1         — run andromeda verify-stack-links (network; many 15s probes; default off).
 * P31_CONVERGE_SKIP_CONSTANTS=1 — skip verify-constants.
 * P31_CONVERGE_VERIFY=1        — after parallel wave, run full root `npm run verify` (serial cap).
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const p31ca = path.join(root, "andromeda", "04_SOFTWARE", "p31ca");
const andromeda = path.join(root, "andromeda");
const stackLinks = path.join(andromeda, "04_SOFTWARE", "scripts", "verify-stack-links.mjs");
const passkey = path.join(p31ca, "workers", "passkey");
const nodeZeroPkg = path.join(andromeda, "04_SOFTWARE", "packages", "node-zero", "package.json");
const educationDir = path.join(p31ca, "public", "education");
const eduPlan = path.join(root, "docs", "PLAN-P31-LABS-EDUCATION-SITE.md");
const isWin = process.platform === "win32";
const npmCmd = isWin ? "npm.cmd" : "npm";
const npxCmd = isWin ? "npx.cmd" : "npx";

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function runSync(name, file, args, cwd, quiet = true, env) {
  const t0 = Date.now();
  const merged = env ? { ...process.env, ...env } : process.env;
  try {
    const out = execFileSync(file, args, {
      cwd,
      encoding: "utf8",
      maxBuffer: 8 * 1024 * 1024,
      env: merged,
    });
    return { track: name, ok: true, ms: Date.now() - t0, out: quiet ? out.slice(-1500) : out, err: "" };
  } catch (e) {
    const st = e && /** @type {{ stdout?: string; stderr?: string; status?: number; message?: string }} */ (e);
    return {
      track: name,
      ok: false,
      ms: Date.now() - t0,
      out: st.stdout || "",
      err: (st.stderr || st.message || String(e)) + (st.status != null ? `\nexit ${st.status}` : ""),
    };
  }
}

function npmRun(cwd, script) {
  return runSync(`npm:${script}`, npmCmd, ["run", script], cwd, false);
}

/**
 * T1 ECO / cockpit parity (diff-index + dual-track info).
 */
function trackA_Eco() {
  if (!exists(p31ca)) {
    return Promise.resolve({ track: "A ECO diff-index", ok: false, err: "missing p31ca tree" });
  }
  return Promise.resolve(
    runSync("A ECO diff-index", process.execPath, [path.join(p31ca, "scripts", "hub", "diff-index-sources.mjs")], p31ca, false),
  );
}

/**
 * T2 passkey worker bundle (dry-run).
 */
function trackB_Passkey() {
  if (!exists(passkey)) {
    return Promise.resolve({ track: "B passkey wrangler", ok: true, skipped: true, out: "no passkey path" });
  }
  if (process.env.P31_CONVERGE_SKIP_PASSKEY === "1") {
    return Promise.resolve({ track: "B passkey wrangler", ok: true, skipped: true, out: "P31_CONVERGE_SKIP_PASSKEY=1" });
  }
  return Promise.resolve(
    runSync("B passkey wrangler", npxCmd, ["wrangler", "deploy", "--dry-run", "-e", "production"], passkey, true),
  );
}

/**
 * T3 education: static tree + plan doc (presence, not policy).
 */
function trackC_Education() {
  const bits = [];
  if (exists(educationDir)) {
    const n = fs.readdirSync(educationDir).length;
    bits.push(`public/education (${n} entries)`);
  } else {
    bits.push("public/education: missing");
  }
  if (exists(eduPlan)) bits.push("PLAN-P31-LABS-EDUCATION-SITE.md: ok");
  else bits.push("PLAN-P31-LABS-EDUCATION-SITE.md: missing");
  const ok = exists(educationDir) && exists(eduPlan);
  return Promise.resolve({
    track: "C education (static + plan)",
    ok,
    ms: 0,
    out: bits.join("; "),
    err: ok ? "" : "need education dir and/or plan doc",
  });
}

/**
 * T4 node-zero: monorepo package present (firmware is elsewhere).
 */
function trackD_NodeZero() {
  const ok = exists(nodeZeroPkg);
  return Promise.resolve({
    track: "D node-zero (package pointer)",
    ok,
    ms: 0,
    out: ok ? path.relative(root, path.dirname(nodeZeroPkg)) : "packages/node-zero not found",
    err: ok ? "" : "missing",
  });
}

/**
 * Andromeda stack link verifier — network-heavy; opt-in.
 */
function trackStack() {
  if (process.env.P31_CONVERGE_STACK !== "1") {
    return Promise.resolve({
      track: "stack verify-stack-links",
      ok: true,
      skipped: true,
      out: "set P31_CONVERGE_STACK=1 to probe connect-the-stack URLs",
    });
  }
  if (!exists(stackLinks)) {
    return Promise.resolve({ track: "stack verify-stack-links", ok: true, skipped: true, out: "no script" });
  }
  return Promise.resolve(
    runSync("stack verify-stack-links", process.execPath, [stackLinks], andromeda, true),
  );
}

/**
 * Light constants gate (fast, home root).
 */
function trackConstants() {
  if (process.env.P31_CONVERGE_SKIP_CONSTANTS === "1") {
    return Promise.resolve({ track: "constants", ok: true, skipped: true, out: "P31_CONVERGE_SKIP_CONSTANTS=1" });
  }
  return Promise.resolve(
    runSync("constants", process.execPath, [path.join(root, "scripts", "verify-constants.mjs")], root, true),
  );
}

async function main() {
  const t0 = Date.now();
  console.log("P31 parallel converge — A/B/C/D + stack + constants (then optional verify)\n");

  const parallel = await Promise.all([
    trackA_Eco(),
    trackB_Passkey(),
    trackC_Education(),
    trackD_NodeZero(),
    trackStack(),
    trackConstants(),
  ]);

  const serial = [];
  if (process.env.P31_CONVERGE_VERIFY === "1") {
    serial.push(npmRun(root, "verify"));
  }

  const all = [...parallel, ...serial];
  let failed = 0;
  for (const r of all) {
    if (r.skipped) {
      console.log(`[skip] ${r.track}: ${r.out}`);
      continue;
    }
    if (r.ok) {
      console.log(`[ok]   ${r.track} (${r.ms}ms)`);
    } else {
      failed++;
      console.log(`[FAIL] ${r.track} (${r.ms}ms)`);
      if (r.err) console.log(r.err.slice(0, 2000));
    }
  }

  const reportPath = process.env.P31_CONVERGE_REPORT || path.join("/tmp", "p31_parallel_converge.json");
  const payload = {
    at: new Date().toISOString(),
    wallMs: Date.now() - t0,
    failed,
    parallel: parallel.map((r) => ({ track: r.track, ok: r.ok, skipped: r.skipped, ms: r.ms })),
    serial: serial.map((r) => ({ track: r.track, ok: r.ok, ms: r.ms })),
  };
  try {
    fs.writeFileSync(reportPath, JSON.stringify(payload, null, 2), "utf8");
    console.log(`\nConverge report: ${reportPath}`);
  } catch (e) {
    console.warn("Report write failed:", e);
  }

  if (failed) {
    console.log("\nConverge: FAILED — fix tracks above, or P31_CONVERGE_SKIP_PASSKEY=1 for offline passkey dry-run.");
    process.exit(1);
  }
  if (!process.env.P31_CONVERGE_VERIFY) {
    console.log("\nTip: P31_CONVERGE_VERIFY=1 to run root `verify` after this parallel wave.");
  }
  console.log("\nConverge: OK (parallel paths aligned).");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
