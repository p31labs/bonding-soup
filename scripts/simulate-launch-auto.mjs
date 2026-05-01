#!/usr/bin/env node
/**
 * Read-only preview of `npm run launch:auto` — print the chain that would run, with current
 * preflight signals (last verify status from /tmp, last commit SHA, dirty tree, andromeda presence,
 * ecosystem-glass last report freshness). Does not invoke release:public.
 *
 *   npm run sim:launch
 *   npm run sim:launch -- --json
 *   P31_SIM_OUT=/tmp/p31-sim-launch.json npm run sim:launch
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const args = process.argv.slice(2);
const jsonMode = args.includes("--json");

const STEPS = [
  {
    id: "release-public-verify",
    title: "release:public — root verify (P0 ship bar)",
    command: "npm run verify",
    cwd: ".",
    skipsIf: null,
  },
  {
    id: "k4-personal",
    title: "k4-personal wrangler dry-run",
    command: "node scripts/verify-k4-personal.mjs",
    cwd: ".",
    skipsIf: () => !fs.existsSync(path.join(root, "andromeda/04_SOFTWARE/k4-personal")),
  },
  {
    id: "mesh-live",
    title: "mesh live vs constants (MESH_LIVE_STRICT=1)",
    command: "node scripts/verify-mesh-live.mjs",
    cwd: ".",
    env: { MESH_LIVE_STRICT: "1" },
  },
  {
    id: "hub-ci",
    title: "p31ca hub:ci — about generate + verify + Astro build",
    command: "npm run hub:ci",
    cwd: "andromeda/04_SOFTWARE/p31ca",
    skipsIf: () => !fs.existsSync(path.join(root, "andromeda/04_SOFTWARE/p31ca")),
  },
  {
    id: "security-check",
    title: "p31ca security suite (SCA + Workers + crypto)",
    command: "npm run security:check",
    cwd: "andromeda/04_SOFTWARE/p31ca",
    skipsIf: () => !fs.existsSync(path.join(root, "andromeda/04_SOFTWARE/p31ca")),
  },
  {
    id: "ecosystem-glass-strict",
    title: "ecosystem-glass strict (every probe in p31-ecosystem.json)",
    command: "P31_GLASS_STRICT=1 node scripts/ecosystem-glass.mjs",
    cwd: ".",
  },
  {
    id: "launch-rehearsal",
    title: "launch-readiness rehearsal (lanes + glass refresh)",
    command: "node scripts/p31-launch-readiness.mjs --mode rehearsal --no-log",
    cwd: ".",
  },
];

function gitInfo() {
  try {
    const sha = execSync("git rev-parse HEAD", { cwd: root }).toString().trim();
    const branch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: root })
      .toString()
      .trim();
    const status = execSync("git status --porcelain", { cwd: root }).toString().trim();
    const dirtyCount = status === "" ? 0 : status.split("\n").length;
    const aheadBehind = (() => {
      try {
        const r = execSync("git rev-list --left-right --count @{upstream}...HEAD", { cwd: root })
          .toString()
          .trim();
        const [b, a] = r.split(/\s+/).map(Number);
        return { ahead: a, behind: b };
      } catch {
        return null;
      }
    })();
    return { sha, branch, dirtyFiles: dirtyCount, aheadBehind };
  } catch {
    return null;
  }
}

function readJsonIfFresh(p, maxAgeMs = 24 * 3600 * 1000) {
  if (!fs.existsSync(p)) return { exists: false };
  const st = fs.statSync(p);
  const ageMs = Date.now() - st.mtimeMs;
  const fresh = ageMs <= maxAgeMs;
  let summary = null;
  try {
    const j = JSON.parse(fs.readFileSync(p, "utf8"));
    summary = {
      schema: j.schema || j.summary?.schema || null,
      score: j.summary?.score ?? null,
      ready: j.summary?.ready ?? null,
      probes: Array.isArray(j.probes)
        ? { total: j.probes.length, down: j.probes.filter((x) => x.state === "down").length }
        : null,
    };
  } catch {
    /* ignore */
  }
  return { exists: true, fresh, ageMs, mtime: st.mtime, path: p, summary };
}

const git = gitInfo();
const lastReadiness = readJsonIfFresh("/tmp/p31_launch_readiness.json");
const lastGlass = readJsonIfFresh("/tmp/p31_glass_report.json");
const constantsExist = fs.existsSync(path.join(root, "p31-constants.json"));
const ecosystemExist = fs.existsSync(path.join(root, "p31-ecosystem.json"));
const andromedaPresent = fs.existsSync(path.join(root, "andromeda/04_SOFTWARE/p31ca"));

const steps = STEPS.map((s) => ({
  id: s.id,
  title: s.title,
  command: s.command,
  cwd: s.cwd,
  env: s.env || null,
  skip: typeof s.skipsIf === "function" ? !!s.skipsIf() : false,
}));

const blockers = [];
if (git?.dirtyFiles && git.dirtyFiles > 0) {
  blockers.push(`git working tree has ${git.dirtyFiles} dirty file(s) — commit or stash before launch`);
}
if (!constantsExist) blockers.push("p31-constants.json missing");
if (!ecosystemExist) blockers.push("p31-ecosystem.json missing");
if (!andromedaPresent) {
  blockers.push("andromeda/ missing — partial clone; hub:ci + security:check will skip (P3 not deployable)");
}
if (lastGlass.exists && lastGlass.summary?.probes?.down) {
  blockers.push(
    `last ecosystem-glass had ${lastGlass.summary.probes.down} probe(s) down — strict run will fail`,
  );
}

const manifest = {
  schema: "p31.launchAutoSimulation/1.0.0",
  generatedAt: new Date().toISOString(),
  git,
  preflight: {
    constants: constantsExist,
    ecosystem: ecosystemExist,
    andromeda: andromedaPresent,
    lastReadiness,
    lastGlass,
  },
  blockers,
  steps,
  totals: {
    steps: steps.length,
    skips: steps.filter((s) => s.skip).length,
    blockers: blockers.length,
  },
};

const sharedOut = process.env.P31_SIM_OUT;
if (sharedOut) {
  fs.mkdirSync(path.dirname(sharedOut), { recursive: true });
  fs.writeFileSync(sharedOut, JSON.stringify(manifest, null, 2) + "\n", "utf8");
}

// Blockers are operational state (e.g. dirty tree mid-work), not test failures —
// always exit 0 unless P31_SIM_LAUNCH_STRICT=1, so this can ride in the omnibus.
const STRICT = process.env.P31_SIM_LAUNCH_STRICT === "1";

if (jsonMode) {
  console.log(JSON.stringify(manifest, null, 2));
  process.exit(STRICT && blockers.length > 0 ? 1 : 0);
}

console.log("\nsimulate-launch-auto: chain preview\n");
if (git) {
  console.log(
    `git ${git.branch}@${git.sha.slice(0, 8)} dirty=${git.dirtyFiles}` +
      (git.aheadBehind ? ` ↑${git.aheadBehind.ahead} ↓${git.aheadBehind.behind}` : ""),
  );
}
if (lastReadiness.exists) {
  console.log(
    `last readiness: score=${lastReadiness.summary?.score ?? "?"} ready=${lastReadiness.summary?.ready ?? "?"} mtime=${lastReadiness.mtime?.toISOString?.() ?? "?"}`,
  );
}
if (lastGlass.exists) {
  console.log(
    `last glass: probes=${lastGlass.summary?.probes?.total ?? "?"} down=${lastGlass.summary?.probes?.down ?? "?"} mtime=${lastGlass.mtime?.toISOString?.() ?? "?"}`,
  );
}
console.log("");
console.log("Steps:");
for (const s of steps) {
  console.log(
    `  ${s.skip ? "[SKIP]" : "[ RUN]"} ${s.id.padEnd(28)} — ${s.title}` +
      (s.cwd && s.cwd !== "." ? `   cwd=${s.cwd}` : ""),
  );
}
if (blockers.length > 0) {
  console.log("\nBlockers (would not stop launch:auto unless step itself fails):");
  for (const b of blockers) console.log(`  · ${b}`);
}
console.log("");
process.exit(STRICT && blockers.length > 0 ? 1 : 0);
