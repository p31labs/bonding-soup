#!/usr/bin/env node
/**
 * Validate p31-launch-readiness-config.json + p31-launch-checklist.json shape.
 * (Does NOT execute the runner — that's `npm run launch:audit`.)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const ALLOWED_KINDS = new Set([
  "cmd",
  "file-exists",
  "json-key",
  "no-glob",
  "glass-probe",
  "human-checklist",
]);

function fail(msg) {
  console.error("verify-launch-readiness-config:", msg);
  process.exit(1);
}

function validateConfig() {
  const p = path.join(root, "p31-launch-readiness-config.json");
  if (!fs.existsSync(p)) fail("missing p31-launch-readiness-config.json");
  const j = JSON.parse(fs.readFileSync(p, "utf8"));
  if (j.schema !== "p31.launchReadinessConfig/0.1.0") fail(`bad schema: ${j.schema}`);
  if (typeof j.thresholds?.ready !== "number") fail("thresholds.ready required");
  if (!Array.isArray(j.lanes) || j.lanes.length < 8) fail("lanes[] must have at least 8 entries");

  let totalWeight = 0;
  const seen = new Set();
  for (const L of j.lanes) {
    if (!L.id || !L.title) fail(`lane missing id/title: ${JSON.stringify(L)}`);
    if (seen.has(L.id)) fail(`duplicate lane id: ${L.id}`);
    seen.add(L.id);
    if (typeof L.weight !== "number" || L.weight <= 0) fail(`lane ${L.id}: weight must be > 0`);
    totalWeight += L.weight;
    if (!Array.isArray(L.checks) || L.checks.length === 0) fail(`lane ${L.id}: checks[] required`);
    const checkIds = new Set();
    for (const c of L.checks) {
      if (!c.id || !c.kind) fail(`lane ${L.id}: check missing id/kind`);
      if (checkIds.has(c.id)) fail(`lane ${L.id}: duplicate check id ${c.id}`);
      checkIds.add(c.id);
      if (!ALLOWED_KINDS.has(c.kind)) fail(`lane ${L.id}: unknown check kind ${c.kind}`);
      if (c.kind === "cmd" && !c.command) fail(`lane ${L.id}: cmd check ${c.id} missing command`);
      if (c.kind === "file-exists" && !c.path) fail(`lane ${L.id}: file-exists ${c.id} missing path`);
      if (c.kind === "json-key" && (!c.path || !c.key)) fail(`lane ${L.id}: json-key ${c.id} missing path/key`);
      if (c.kind === "glass-probe" && !c.probeId) fail(`lane ${L.id}: glass-probe ${c.id} missing probeId`);
      if (c.kind === "no-glob" && !c.glob) fail(`lane ${L.id}: no-glob ${c.id} missing glob`);
    }
  }
  if (totalWeight !== 100) fail(`lane weights must sum to 100 (got ${totalWeight})`);
}

function validateChecklist() {
  const p = path.join(root, "p31-launch-checklist.json");
  if (!fs.existsSync(p)) fail("missing p31-launch-checklist.json");
  const j = JSON.parse(fs.readFileSync(p, "utf8"));
  if (j.schema !== "p31.launchChecklist/0.1.0") fail(`bad checklist schema: ${j.schema}`);
  if (!Array.isArray(j.gates) || j.gates.length === 0) fail("checklist.gates[] required");
  const seen = new Set();
  for (const g of j.gates) {
    if (!g.id || !g.title || !g.status) fail(`gate missing id/title/status: ${JSON.stringify(g)}`);
    if (seen.has(g.id)) fail(`duplicate gate id: ${g.id}`);
    seen.add(g.id);
    if (!["met", "pending", "blocked"].includes(g.status)) fail(`gate ${g.id}: bad status ${g.status}`);
  }
}

function main() {
  validateConfig();
  validateChecklist();
  console.log("verify-launch-readiness-config: OK");
}

main();
