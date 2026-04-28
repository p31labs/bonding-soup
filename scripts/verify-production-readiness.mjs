import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function readJson(relPath) {
  const abs = path.join(ROOT, relPath);
  return JSON.parse(fs.readFileSync(abs, "utf8"));
}

function readText(relPath) {
  const abs = path.join(ROOT, relPath);
  return fs.readFileSync(abs, "utf8");
}

function fail(msg) {
  console.error(`verify-production-readiness: FAIL: ${msg}`);
  process.exit(1);
}

function isObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function sumScore(score, dimIds) {
  let total = 0;
  for (const k of dimIds) total += score[k];
  return total;
}

function tierFor(total) {
  if (total >= 85) return "P0";
  if (total >= 70) return "P1";
  if (total >= 50) return "P2";
  if (total >= 25) return "P3";
  return "P4";
}

function uniq(arr) {
  return Array.from(new Set(arr));
}

function parseHubIdsFromHubAppIds(text) {
  // Extract string literals inside HUB_COCKPIT_ORDER = [ ... ] (and prototypes if present).
  const m = text.match(/export const HUB_COCKPIT_ORDER\s*=\s*\[([\s\S]*?)\];/);
  if (!m) fail("Could not parse HUB_COCKPIT_ORDER from hub-app-ids.mjs");
  const body = m[1];
  const ids = [];
  for (const mm of body.matchAll(/"([^"]+)"/g)) ids.push(mm[1]);
  if (!ids.length) fail("Parsed 0 hub ids from HUB_COCKPIT_ORDER");
  return ids;
}

const prs = readJson("p31-production-readiness.json");
if (!isObject(prs)) fail("Root must be a JSON object");
if (prs.schema !== "p31.productionReadiness/1.0.0") fail(`Unexpected schema: ${prs.schema}`);
if (!Array.isArray(prs.items)) fail("items must be an array");
if (!isObject(prs.scoringSystem)) fail("scoringSystem must be an object");
if (!Array.isArray(prs.scoringSystem.dimensions)) fail("scoringSystem.dimensions must be an array");

const dimIds = prs.scoringSystem.dimensions.map((d) => d?.id);
const requiredDims = [
  "liveReachable",
  "deployability",
  "verificationHooks",
  "testingDepth",
  "contractsSchemas",
  "observability",
  "securityPosture",
  "operationalClarity",
  "uxCompleteness",
  "ephemeralizationAlignment",
];
for (const k of requiredDims) {
  if (!dimIds.includes(k)) fail(`Missing scoring dimension id: ${k}`);
}

const ids = [];
for (const it of prs.items) {
  if (!isObject(it)) fail("Each item must be an object");
  if (typeof it.id !== "string" || !it.id.trim()) fail("Each item must have a non-empty string id");
  ids.push(it.id);
  if (!isObject(it.score)) fail(`Item ${it.id}: score must be an object`);
  for (const k of requiredDims) {
    const v = it.score[k];
    if (!Number.isInteger(v)) fail(`Item ${it.id}: score.${k} must be an integer`);
    if (v < 0 || v > 10) fail(`Item ${it.id}: score.${k} out of range 0..10 (${v})`);
  }
  const total = sumScore(it.score, requiredDims);
  if (total < 0 || total > 100) fail(`Item ${it.id}: total score out of 0..100 (${total})`);
  const tier = tierFor(total);
  if (!Array.isArray(it.nextSteps) || it.nextSteps.length < 1) {
    fail(`Item ${it.id}: nextSteps must be a non-empty array (use ['none'] if complete)`);
  }
  if (total === 100 && it.nextSteps.some((s) => String(s).toLowerCase().includes("add"))) {
    // Not a hard fail; PRS can keep "keep current" even at 100, but avoid implying unfinished work.
  }
  if (it.kind === "meta") fail(`Item ${it.id}: kind 'meta' is not allowed in canonical scoring`);
  // Optional but helpful: warn if item tier is P4 but marked liveReachable high.
  if (tier === "P4" && it.score.liveReachable >= 7) {
    fail(`Item ${it.id}: tier would be P4 but liveReachable=${it.score.liveReachable}; raise other dims or lower liveReachable`);
  }
}

const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dupes.length) fail(`Duplicate item ids: ${uniq(dupes).join(", ")}`);

const hubIds = parseHubIdsFromHubAppIds(readText("andromeda/04_SOFTWARE/p31ca/scripts/hub/hub-app-ids.mjs"));
const hubIdSet = new Set(hubIds);

const hubCardIds = new Set(prs.items.filter((it) => it.kind === "hubCard").map((it) => it.id));
const missingHubCards = hubIds.filter((id) => !hubCardIds.has(id));
if (missingHubCards.length) fail(`Missing hubCard rows for ids: ${missingHubCards.join(", ")}`);

const extraHubCards = Array.from(hubCardIds).filter((id) => !hubIdSet.has(id));
if (extraHubCards.length) fail(`Extra hubCard ids not in hub-app-ids.mjs: ${extraHubCards.join(", ")}`);

const liveFleet = readJson("p31-live-fleet.json");
if (!Array.isArray(liveFleet.workersVerified)) fail("p31-live-fleet.json workersVerified must be an array");
const liveWorkerIds = liveFleet.workersVerified.map((w) => w?.id).filter(Boolean);
const workerIds = new Set(prs.items.filter((it) => it.kind === "worker").map((it) => it.id));
const missingWorkers = liveWorkerIds.filter((id) => !workerIds.has(id));
if (missingWorkers.length) fail(`Missing worker rows for live-fleet workersVerified ids: ${missingWorkers.join(", ")}`);

const totals = prs.items.map((it) => ({
  id: it.id,
  kind: it.kind,
  total: sumScore(it.score, requiredDims),
  tier: tierFor(sumScore(it.score, requiredDims)),
}));
totals.sort((a, b) => b.total - a.total);

const top = totals.slice(0, 10);
console.log(`verify-production-readiness: OK — ${prs.items.length} items`);
console.log(`verify-production-readiness: hub cards covered — ${hubIds.length}`);
console.log(`verify-production-readiness: live workers covered — ${liveWorkerIds.length}`);
console.log("verify-production-readiness: top 10 by score:");
for (const t of top) console.log(`- ${t.id} (${t.kind}) ${t.total}/100 ${t.tier}`);

