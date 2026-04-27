#!/usr/bin/env node
/**
 * P31 full automation — parallel gates + optional verify + optional glass.
 * Prefer `npm run vfr:auto` / `vfr:manual` for AUTO/MANUAL V+F control.
 *
 * This module also exports runFullAutomation() for VFR and CI.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const p31ca = path.join(root, "andromeda", "04_SOFTWARE", "p31ca");
const andromeda = path.join(root, "andromeda");
const stackLinks = path.join(andromeda, "04_SOFTWARE", "scripts", "verify-stack-links.mjs");
const passkey = path.join(p31ca, "workers", "passkey");
const isWin = process.platform === "win32";
const npmCmd = isWin ? "npm.cmd" : "npm";
const npxCmd = isWin ? "npx.cmd" : "npx";

/**
 * @typedef {object} FullAutoOpts
 * @property {boolean} [skipRootVerify]
 * @property {boolean} [runGlass]
 * @property {boolean} [runMesh]
 * @property {boolean} [meshLiveStrict] when runMesh, pass MESH_LIVE_STRICT to verify-mesh
 * @property {boolean} [runPasskeyDryRun] npx wrangler deploy --dry-run in passkey worker (can be slow)
 * @property {string} [reportPath]
 * @property {boolean} [verbose]
 */

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {string} name
 * @param {string} file
 * @param {string[]} args
 * @param {string} cwd
 * @param {boolean} [quiet]
 * @param {NodeJS.ProcessEnv} [env]
 */
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
    return { name, ok: true, ms: Date.now() - t0, out: quiet ? out.slice(-2000) : out, err: "" };
  } catch (e) {
    const st = e && /** @type {{ stdout?: string; stderr?: string; status?: number; message?: string }} */ (e);
    return {
      name,
      ok: false,
      ms: Date.now() - t0,
      out: st.stdout || "",
      err: (st.stderr || st.message || String(e)) + (st.status != null ? `\nexit ${st.status}` : ""),
    };
  }
}

/**
 * @param {string} cwd
 * @param {string} script
 */
function npmRun(cwd, script) {
  return runSync(
    `npm run ${script}`,
    npmCmd,
    ["run", script],
    cwd,
    false,
  );
}

/**
 * @param {string} name
 * @param {string} cwd
 * @param {string[]} args
 */
function npxRun(name, cwd, args) {
  return runSync(name, npxCmd, args, cwd, true);
}

/**
 * @param {FullAutoOpts} [opts]
 * @param {string} [opts.fromEnv] if set, read legacy P31_FULL_AUTO_* from env
 * @returns {Promise<{ failed: number, results: object[] }>}
 */
export async function runFullAutomation(opts = {}) {
  const o = { ...opts };
  if (o.fromEnv) {
    o.skipRootVerify = process.env.P31_FULL_AUTO_SKIP_ROOT_VERIFY === "1";
    o.runGlass = process.env.P31_FULL_AUTO_GLASS === "1";
    o.runMesh = process.env.P31_FULL_AUTO_MESH !== "0";
    o.runPasskeyDryRun = process.env.P31_VFR_SKIP_PASSKEY !== "1";
    if (process.env.P31_FULL_AUTO_REPORT) o.reportPath = process.env.P31_FULL_AUTO_REPORT;
  } else {
    o.runMesh = o.runMesh !== false;
    o.runGlass = o.runGlass === true;
    o.skipRootVerify = o.skipRootVerify === true;
    if (o.runPasskeyDryRun === undefined) o.runPasskeyDryRun = true;
  }

  const results = [];
  const parallel = [];

  if (exists(p31ca)) {
    parallel.push(
      Promise.resolve(
        runSync("diff-index-sources", process.execPath, [path.join(p31ca, "scripts", "hub", "diff-index-sources.mjs")], p31ca, true),
      ),
    );
  } else {
    results.push({ name: "p31ca tree", ok: false, err: "missing andromeda/04_SOFTWARE/p31ca" });
  }

  if (exists(stackLinks)) {
    parallel.push(Promise.resolve(runSync("verify-stack-links", process.execPath, [stackLinks], andromeda, true)));
  }

  if (exists(passkey) && o.runPasskeyDryRun !== false) {
    parallel.push(
      Promise.resolve(
        npxRun("passkey wrangler --dry-run", passkey, ["wrangler", "deploy", "--dry-run", "-e", "production"]),
      ),
    );
  } else if (exists(passkey) && o.runPasskeyDryRun === false) {
    results.push({ name: "passkey wrangler --dry-run", ok: true, skipped: true, out: "skipped (VFR runPasskeyDryRun)" });
  }

  const done = await Promise.all(parallel);
  results.push(...done);

  if (o.runMesh !== false) {
    const meshEnv = { MESH_LIVE_STRICT: o.meshLiveStrict === false ? "0" : "1" };
    const mesh = runSync(
      "verify:mesh",
      process.execPath,
      [path.join(root, "scripts", "verify-mesh.mjs")],
      root,
      false,
      meshEnv,
    );
    results.push(mesh);
  }

  if (o.skipRootVerify) {
    results.push({ name: "root verify", ok: true, skipped: true, out: "skipped (VFR / P31_FULL_AUTO)" });
  } else {
    const v = npmRun(root, "verify");
    results.push({ name: "root verify", ok: v.ok, ms: v.ms, out: v.out, err: v.err });
  }

  if (o.runGlass) {
    const g = npmRun(root, "ecosystem:glass");
    results.push({ name: "ecosystem:glass", ok: g.ok, ms: g.ms, out: g.out, err: g.err });
  }

  const outPath = o.reportPath || process.env.P31_FULL_AUTO_REPORT || path.join("/tmp", "p31_full_automation_report.json");
  let failed = 0;
  for (const r of results) {
    if (r.skipped) {
      if (o.verbose !== false) console.log(`[skip] ${r.name}: ${r.out}`);
      continue;
    }
    if (r.ok) {
      if (o.verbose !== false) console.log(`[ok]   ${r.name} (${r.ms != null ? r.ms + "ms" : "—"})`);
    } else {
      failed++;
      if (o.verbose !== false) {
        console.log(`[FAIL] ${r.name} (${r.ms != null ? r.ms + "ms" : "—"})`);
        if (r.err) console.log(r.err.slice(0, 3000));
      }
    }
  }

  try {
    fs.writeFileSync(
      outPath,
      JSON.stringify(
        { at: new Date().toISOString(), failed, results: results.map((x) => ({ name: x.name, ok: x.ok, ms: x.ms, skipped: x.skipped })) },
        null,
        2,
      ),
      "utf8",
    );
    if (o.verbose !== false) console.log(`\nReport: ${outPath}`);
  } catch (e) {
    console.warn("Could not write report:", e);
  }

  if (o.verbose !== false && failed) {
    console.log(`\n${failed} gate(s) failed — lower V% in manual, or vfr:manual with ~/.p31/vfr.json.`);
  }

  return { failed, results, reportPath: outPath };
}

async function main() {
  console.log("P31 full automation — parallel gates + optional verify + optional glass\n");
  const { failed } = await runFullAutomation({ fromEnv: true, verbose: true });
  if (failed) {
    process.exit(1);
  }
  console.log("\nP31 full automation: all gates passed.");
  process.exit(0);
}

const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
