#!/usr/bin/env node
/**
 * Idempotent omnibus sync — runs every safe sync:* script across the home repo.
 * After it completes cleanly, the workspace's derived artefacts are aligned with
 * canonical sources (p31-constants.json, doc-library, live-fleet, atmosphere, etc.).
 *
 *   npm run sync:all
 *   npm run sync:all -- --skip-passport       # individual lane skips
 *   npm run sync:all -- --no-build            # skip build:contract-registry / build:fleet-portal / build:doc-index
 *   P31_SYNC_ALL_DRY=1 npm run sync:all       # echo-only (no exec)
 *
 * Verifies clean tree afterwards (warns) and writes a manifest at
 *   ~/.p31/syncs/all-<utc>/manifest.json
 *
 * Lanes use existing npm scripts only — does not introduce new sync logic.
 */
import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const args = new Set(process.argv.slice(2));
const dry = process.env.P31_SYNC_ALL_DRY === "1";
const noBuild = args.has("--no-build");

const LANES = [
  { id: "apply-constants", cmd: "npm run apply:constants", skipFlag: "--skip-constants" },
  { id: "build-contract-registry", cmd: "npm run build:contract-registry", skipFlag: "--skip-registry", build: true },
  { id: "sync-chain-anchor", cmd: "npm run sync:chain-anchor:p31ca", skipFlag: "--skip-chain-anchor" },
  { id: "build-fleet-portal", cmd: "npm run build:fleet-portal", skipFlag: "--skip-fleet-portal", build: true },
  { id: "sync-live-fleet", cmd: "npm run sync:live-fleet:p31ca", skipFlag: "--skip-live-fleet" },
  { id: "build-doc-index", cmd: "npm run build:doc-index", skipFlag: "--skip-doc-index", build: true },
  { id: "sync-doc-library", cmd: "npm run sync:doc-library:p31ca", skipFlag: "--skip-doc-library" },
  { id: "sync-delta-language", cmd: "npm run sync:delta-language", skipFlag: "--skip-delta-language" },
  { id: "sync-atmosphere", cmd: "npm run sync:atmosphere", skipFlag: "--skip-atmosphere" },
  { id: "sync-atmosphere-hub-routes", cmd: "npm run sync:atmosphere-hub-routes", skipFlag: "--skip-atmosphere-hub" },
  { id: "sync-passport", cmd: "npm run sync:passport", skipFlag: "--skip-passport" },
  { id: "sync-discord-bot-swarm", cmd: "npm run sync:discord-bot-swarm", skipFlag: "--skip-discord-swarm" },
  { id: "sync-p31-starfield", cmd: "npm run sync:p31-starfield", skipFlag: "--skip-starfield" },
];

const stamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
const sandbox = path.join(os.homedir(), ".p31", "syncs", `all-${stamp}`);
fs.mkdirSync(sandbox, { recursive: true });

const ranLanes = [];

function safeSpawn(cmd) {
  return spawnSync(cmd, {
    cwd: root,
    shell: true,
    stdio: "inherit",
    env: process.env,
  });
}

function gitDirtyCount() {
  try {
    const out = execSync("git status --porcelain", { cwd: root }).toString().trim();
    return out === "" ? 0 : out.split("\n").length;
  } catch {
    return null;
  }
}

const dirtyBefore = gitDirtyCount();

for (const lane of LANES) {
  if (args.has(lane.skipFlag)) {
    console.log(`\n[skip] ${lane.id} (${lane.skipFlag})`);
    ranLanes.push({ ...lane, skipped: true });
    continue;
  }
  if (noBuild && lane.build) {
    console.log(`\n[skip] ${lane.id} (--no-build)`);
    ranLanes.push({ ...lane, skipped: true });
    continue;
  }
  console.log(`\n\x1b[36m▶\x1b[0m ${lane.id}\n  ${lane.cmd}`);
  if (dry) {
    ranLanes.push({ ...lane, exitCode: null, dryRun: true });
    continue;
  }
  const started = Date.now();
  const r = safeSpawn(lane.cmd);
  const dur = Date.now() - started;
  ranLanes.push({ ...lane, exitCode: r.status, durationMs: dur });
  if (r.status !== 0) {
    console.error(`\n\x1b[31m✗\x1b[0m ${lane.id} exit ${r.status}`);
    break;
  }
}

const dirtyAfter = gitDirtyCount();

const manifest = {
  schema: "p31.syncAll/1.0.0",
  generatedAt: new Date().toISOString(),
  dry,
  noBuild,
  dirtyBefore,
  dirtyAfter,
  lanes: ranLanes.map((l) => ({
    id: l.id,
    command: l.cmd,
    skipped: !!l.skipped,
    dryRun: !!l.dryRun,
    exitCode: l.exitCode ?? null,
    durationMs: l.durationMs ?? null,
  })),
  totals: {
    lanes: ranLanes.length,
    failures: ranLanes.filter((l) => l.exitCode != null && l.exitCode !== 0).length,
    skips: ranLanes.filter((l) => l.skipped).length,
  },
};

const manifestPath = path.join(sandbox, "manifest.json");
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");

console.log("\nsync-all summary:");
for (const l of ranLanes) {
  const tag = l.skipped
    ? "[SKIP]"
    : l.dryRun
      ? "[DRY ]"
      : l.exitCode === 0
        ? "\x1b[32m[ OK ]\x1b[0m"
        : "\x1b[31m[FAIL]\x1b[0m";
  console.log(`  ${tag} ${l.id}`);
}
console.log(
  `\ngit dirty: before=${dirtyBefore} after=${dirtyAfter}` +
    (dirtyAfter != null && dirtyAfter > (dirtyBefore || 0)
      ? `  (\x1b[33m+${dirtyAfter - (dirtyBefore || 0)} files modified — commit derived changes\x1b[0m)`
      : ""),
);
console.log(`manifest ${path.relative(root, manifestPath)}`);

process.exit(manifest.totals.failures === 0 ? 0 : 1);
