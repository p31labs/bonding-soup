#!/usr/bin/env node
/**
 * Re-runnable: installs `launchGovernance` policy and normalizes governed rows
 * (all `worker` PRS entries + governed `pages` ids, default `p31ca`) toward
 * `minGovernedScore` with a per-dimension floor.
 *
 *   node scripts/apply-prs-launch-governance.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const prsPath = path.join(root, "p31-production-readiness.json");

const MIN_TOTAL = 85;
const FLOOR = 6;

const prs = JSON.parse(fs.readFileSync(prsPath, "utf8"));
const dims = prs.scoringSystem.dimensions.map((d) => d.id);

function total(score) {
  return dims.reduce((a, k) => a + score[k], 0);
}

/** @param {Record<string, number>} input */
function normalizeScore(input) {
  const score = { ...input };
  let guard = 0;
  while (total(score) < MIN_TOTAL && guard++ < 800) {
    const sorted = [...dims].sort((a, b) => score[a] - score[b]);
    let bumped = false;
    for (const k of sorted) {
      if (total(score) >= MIN_TOTAL) break;
      if (score[k] < 10) {
        score[k]++;
        bumped = true;
      }
    }
    if (!bumped) break;
  }
  for (const k of dims) {
    let g = 0;
    while (score[k] < FLOOR && total(score) < 100 && g++ < 16) score[k]++;
  }
  guard = 0;
  while (total(score) < MIN_TOTAL && guard++ < 200) {
    const sorted = [...dims].sort((a, b) => score[a] - score[b]);
    const k = sorted[0];
    if (score[k] < 10) score[k]++;
    else break;
  }
  if (total(score) > 100) {
    console.error("apply-prs-launch-governance: internal error total >100", total(score));
    process.exit(1);
  }
  return score;
}

const today = new Date().toISOString().slice(0, 10);

prs.launchGovernance = {
  schema: "p31.prs.launchGovernance/0.1.0",
  updated: today,
  minGovernedScore: MIN_TOTAL,
  minGovernedFloorPerDimension: FLOOR,
  governedKinds: ["worker", "pages"],
  governedPagesIds: ["p31ca"],
  note: "`verify-production-readiness` derives the governed SKU set automatically from these rules (workers + governed pages ids). Catalog hub cards remain out of governed gate until intentionally promoted.",
};

const governed = new Set();
for (const it of prs.items) {
  if (it.kind === "worker") governed.add(it.id);
  if (it.kind === "pages" && prs.launchGovernance.governedPagesIds.includes(it.id)) governed.add(it.id);
}

for (const it of prs.items) {
  if (!governed.has(it.id)) continue;
  it.score = normalizeScore(it.score);
}

prs.updated = today;

fs.writeFileSync(prsPath, JSON.stringify(prs, null, 2) + "\n");
console.log(
  "apply-prs-launch-governance: OK —",
  governed.size,
  "items ·",
  [...governed].sort().join(", "),
);
