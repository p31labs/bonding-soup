#!/usr/bin/env node
/**
 * CONNECTION spine — one panel tying deploy canon, ecosystem deployables, env catalog,
 * edge coherence entrypoints, and operator surfaces (local command center + live hub).
 *
 *   npm run connection
 *   npm run connection -- --brief    # short lines (e.g. after doctor)
 *   npm run connection -- --json     # machine summary
 *
 * CLI: npm run p31 -- connect
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { getOperatorJoyLine } from "./lib/operator-joy.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function readJson(rel) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
  } catch {
    return null;
  }
}

/**
 * @param {unknown} glassProbes
 * @returns {Record<string, number>}
 */
function countGlassByGroup(glassProbes) {
  const o = /** @type {Record<string, number>} */ ({});
  if (!Array.isArray(glassProbes)) return o;
  for (const row of glassProbes) {
    const g =
      row && typeof row === "object" && !Array.isArray(row) && typeof row.group === "string" && row.group.trim()
        ? row.group.trim()
        : "ungrouped";
    o[g] = (o[g] || 0) + 1;
  }
  return o;
}

/**
 * @param {unknown} deployables
 * @param {number} max
 */
function deployablePreviewIds(deployables, max) {
  if (!Array.isArray(deployables)) return [];
  const out = [];
  for (const d of deployables) {
    if (out.length >= max) break;
    if (d && typeof d === "object" && !Array.isArray(d) && typeof d.id === "string" && d.id.trim()) {
      out.push(d.id.trim());
    }
  }
  return out;
}

/**
 * Single JSON for CLI (`connection --json`), local command center boot + GET /api/connection-summary.
 * @returns {Record<string, unknown>}
 */
export function getConnectionSummary() {
  const eco = readJson("p31-ecosystem.json");
  const envM = readJson("p31-env-manifest.json");
  const constants = readJson("p31-constants.json");
  const glassByGroup = countGlassByGroup(eco?.glassProbes);
  return {
    schema: "p31.connectionSummary/1.0.1",
    name: "CONNECTION",
    deployablesCount: eco?.deployables?.length ?? 0,
    glassProbesCount: eco?.glassProbes?.length ?? 0,
    p31EnvCatalogEntries: envM?.variables?.length ?? 0,
    ecosystemSchema: typeof eco?.schema === "string" ? eco.schema : null,
    ecosystemUpdated: typeof eco?.updated === "string" ? eco.updated : null,
    glassByGroup,
    deployablePreview: deployablePreviewIds(eco?.deployables, 12),
    glassReportDefault: "/tmp/p31_glass_report.json",
    hubUrl: "https://p31ca.org/",
    opsUrl: "https://p31ca.org/ops/",
    connectLiveUrl: "https://p31ca.org/connect.html",
    deployCanonDoc: "docs/P31-DEPLOY-CANON.md",
    runbooksIndexDoc: "docs/runbooks/README.md",
    engineeringStandardDoc: "docs/P31-ENGINEERING-STANDARD.md",
    meshPersonalWorkerUrl: constants?.mesh?.k4PersonalWorkerUrl ?? null,
  };
}

export function printConnectionBrief() {
  const s = /** @type {Record<string, string | number | null>} */ (getConnectionSummary());
  const gN =
    s.glassByGroup && typeof s.glassByGroup === "object" && !Array.isArray(s.glassByGroup)
      ? Object.keys(s.glassByGroup).length
      : 0;
  console.log(
    "\n\x1b[36mCONNECTION\x1b[0m  " +
      `${s.deployablesCount} deployables · ${s.glassProbesCount} glass probes (${gN} groups) · ${s.p31EnvCatalogEntries} P31_* catalog rows`
  );
  console.log("           docs/P31-DEPLOY-CANON.md  ·  npm run connection  (full panel)");
}

export function printConnectionFull() {
  const s = getConnectionSummary();
  console.log("");
  console.log("\x1b[1m━━━ P31 CONNECTION ━━━\x1b[0m");
  console.log(
    "\x1b[90mConnect\x1b[0m = verify · deploy spine · ecosystem order · env catalog · edge coherence · operator UI."
  );
  console.log("");
  console.log("\x1b[36mDocs\x1b[0m     " + s.deployCanonDoc + " — CI vs manual vs local CLI");
  console.log("         " + s.runbooksIndexDoc + " — mesh · hub · payments · passkeys · glass strict");
  console.log("         " + s.engineeringStandardDoc + " — gates and secrets");
  console.log("");
  console.log(
    "\x1b[36mCounts\x1b[0m   ecosystem deployables: " +
      s.deployablesCount +
      "  ·  glass probes: " +
      s.glassProbesCount +
      "  ·  P31_* docs: " +
      s.p31EnvCatalogEntries
  );
  const gbg = /** @type {Record<string, number>} */ (s.glassByGroup && typeof s.glassByGroup === "object" ? s.glassByGroup : {});
  const gParts = Object.keys(gbg)
    .sort((a, b) => gbg[b] - gbg[a] || a.localeCompare(b))
    .map((k) => k + ":" + gbg[k]);
  console.log(
    "\x1b[36mGlass\x1b[0m    groups (" +
      gParts.length +
      "): " +
      (gParts.length ? gParts.join(" · ") : "—") +
      "  ·  registry updated: " +
      (typeof s.ecosystemUpdated === "string" ? s.ecosystemUpdated : "—")
  );
  const prev = Array.isArray(s.deployablePreview) ? s.deployablePreview : [];
  if (prev.length) {
    console.log("\x1b[36mDeploy\x1b[0m   spine head: " + prev.slice(0, 6).join(", ") + (prev.length > 6 ? " …" : ""));
  }
  console.log("");
  console.log("\x1b[36mCommands\x1b[0m npm run verify");
  console.log("         npm run ecosystem:plan  ·  npm run quantum:cloud  ·  npm run ecosystem:glass");
  console.log("         npm run list:p31-env  ·  npm run command-center  →  http://127.0.0.1:3131  ·  desk: …/desk  (`p31 open desk`)");
  console.log("");
  console.log("\x1b[36mLive\x1b[0m     " + s.hubUrl + " · " + s.opsUrl + " · " + s.connectLiveUrl);
  if (s.meshPersonalWorkerUrl) {
    console.log("         k4-personal: " + s.meshPersonalWorkerUrl);
  }
  console.log("");
  if (process.stdout.isTTY && process.env.CI !== "true" && process.env.P31_SKIP_JOY !== "1") {
    const j = getOperatorJoyLine(root, { roll: false, short: true });
    if (process.env.NO_COLOR) {
      console.log("◆ " + j + "\n");
    } else {
      console.log("\x1b[35m◆\x1b[0m " + j + "\n");
    }
  }
}

function printJson() {
  console.log(JSON.stringify(getConnectionSummary(), null, 2));
}

function isPrimaryCli() {
  const a = process.argv[1];
  if (!a) return false;
  try {
    return import.meta.url === pathToFileURL(path.resolve(a)).href;
  } catch {
    return false;
  }
}

function main() {
  const argv = new Set(process.argv.slice(2));
  if (argv.has("--json")) {
    printJson();
    return;
  }
  if (argv.has("--brief")) {
    printConnectionBrief();
    return;
  }
  printConnectionFull();
}

if (isPrimaryCli()) {
  main();
}
