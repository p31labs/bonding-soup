#!/usr/bin/env node
/**
 * CWP mobile ops — Phase 3: Command mode (operator scripts, deploy chain, glass, edge shift).
 * Usage: node scripts/mobile-ops-phase3-check.mjs [--skip-glass] [--skip-shift]
 */
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const p31caPkg = path.join(root, "andromeda", "04_SOFTWARE", "p31ca", "package.json");
const ecopath = path.join(root, "p31-ecosystem.json");

const optSkipGlass = process.argv.includes("--skip-glass");
const optSkipShift = process.argv.includes("--skip-shift");

const REQUIRED_ROOT_SCRIPTS = [
  "morning",
  "p31:converge",
  "p31:all",
  "ecosystem:glass",
  "operator:shift-status",
  "operator:shift-in",
  "operator:shift-out",
  "p31:ci",
  "verify",
];

async function main() {
  console.log("P31 mobile ops — Phase 3 (Command mode) check\n");

  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const sc = pkg.scripts || {};
  for (const name of REQUIRED_ROOT_SCRIPTS) {
    if (!sc[name]) {
      console.error(`Missing package.json script: "${name}"`);
      process.exit(1);
    }
  }
  console.log("[ok]  Home package.json: " + REQUIRED_ROOT_SCRIPTS.length + " required scripts present");

  if (fs.existsSync(p31caPkg)) {
    const p = JSON.parse(fs.readFileSync(p31caPkg, "utf8"));
    const sp = p.scripts || {};
    if (sp.predeploy && sp.deploy) {
      console.log("[ok]  p31ca: predeploy + deploy defined");
      if (!String(sp.predeploy).includes("verify")) {
        console.warn("  (warn) predeploy does not look like it runs verify");
      }
    } else {
      console.error("[x]  p31ca: missing predeploy and/or deploy");
      process.exit(1);
    }
  } else {
    console.log("[--]  p31ca path absent — skip deploy chain (partial clone OK)");
  }

  let shiftUrl = "https://command-center.trimtab-signal.workers.dev/api/operator/shift";
  try {
    const eco = JSON.parse(fs.readFileSync(ecopath, "utf8"));
    const p = (eco.glassProbes || []).find((/** @type {{ id?: string }} */ g) => g.id === "operator-shift-public");
    if (p && p.url) shiftUrl = p.url;
  } catch {
    /* keep default */
  }

  if (!optSkipGlass) {
    console.log("\n→ ecosystem:glass (this may take ~10s)…");
    try {
      const out = execFileSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "ecosystem:glass"], {
        cwd: root,
        encoding: "utf8",
        maxBuffer: 32 * 1024 * 1024,
        env: { ...process.env, FORCE_COLOR: "0" },
      });
      const strip = out.replace(/\x1b\[[0-9;]*m/g, "");
      const m = strip.match(/Summary:\s*(\d+)\s*up,?\s*(\d+)\s*auth/i);
      const down = /(\d+)\s*down/.exec(strip);
      if (m) {
        console.log(`[ok]  Glass: ${m[1]} up (auth: ${m[2]})`);
      } else {
        console.log("[ok]  Glass: completed (summary line not parsed — read full output in CI)");
      }
      if (down) console.log(`      down: ${down[1]}`);
      const sk = strip.match(/(\d+)\s*skipped/i);
      if (sk) console.log(`      skipped: ${sk[1]}`);
    } catch (e) {
      const st = e && /** @type {{ status?: number; stderr?: string }} */ (e);
      console.error("ecosystem:glass failed", st.status, st.stderr?.slice(0, 200));
      process.exit(1);
    }
  } else {
    console.log("[--]  skip ecosystem:glass (--skip-glass)");
  }

  if (!optSkipShift) {
    console.log("\n→ GET operator shift (edge)…");
    try {
      const r = await fetch(shiftUrl, { signal: AbortSignal.timeout(20000) });
      const t = await r.text();
      if (r.status !== 200) {
        console.error(`[x]  shift: HTTP ${r.status}`);
        process.exit(1);
      }
      try {
        const j = JSON.parse(t);
        if (j && typeof j.state === "string") {
          console.log("      state: " + j.state);
        }
      } catch {
        if (t.length < 5) console.warn("  (warn) shift body not JSON (unexpected)");
      }
      console.log("[ok]  shift: HTTP 200, JSON or text length " + t.length);
    } catch (err) {
      console.error("[x]  shift fetch failed:", err);
      process.exit(1);
    }
  } else {
    console.log("\n[--]  skip shift (--skip-shift)");
  }

  console.log("\nPhase 3 check: OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
