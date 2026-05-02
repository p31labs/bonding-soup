#!/usr/bin/env node
/**
 * Static structural verifier for the fleet test corpus.
 *
 * Checks that test-corpus.json is well-formed and that every persona it
 * references exists in models.json (no orphan corpus rows; no untested personas).
 *
 * Skip: P31_SKIP_FLEET_CORPUS=1 or files missing (partial clone).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const CORPUS = path.join(root, "scripts", "p31-fleet-ten", "test-corpus.json");
const MODELS = path.join(root, "scripts", "p31-fleet-ten", "models.json");

if (process.env.P31_SKIP_FLEET_CORPUS === "1") {
  console.log("verify-fleet-corpus: skip — P31_SKIP_FLEET_CORPUS=1");
  process.exit(0);
}
if (!fs.existsSync(CORPUS) || !fs.existsSync(MODELS)) {
  console.log("verify-fleet-corpus: skip — corpus or models.json missing");
  process.exit(0);
}

let fail = 0;
function ok(m) { console.log("  [ OK ]", m); }
function bad(m) { console.log("  [FAIL]", m); fail++; }

const corpus = JSON.parse(fs.readFileSync(CORPUS, "utf8"));
const models = JSON.parse(fs.readFileSync(MODELS, "utf8"));

if (corpus.schema && /^p31\.fleetTestCorpus\//.test(corpus.schema)) ok(`schema: ${corpus.schema}`);
else bad("missing/invalid schema (expected p31.fleetTestCorpus/*)");

const modelIds = new Set(models.map((m) => m.id));
const corpusIds = new Set();
for (const set of corpus.promptSets || []) {
  if (!set.personaId) { bad("promptSet missing personaId"); continue; }
  corpusIds.add(set.personaId);
  if (!modelIds.has(set.personaId)) bad(`${set.personaId}: not in models.json`);
  if (!Array.isArray(set.prompts) || set.prompts.length === 0) bad(`${set.personaId}: no prompts`);
  for (const p of set.prompts || []) {
    if (!p.id || !p.prompt || !Array.isArray(p.judgeRubric)) {
      bad(`${set.personaId}/${p.id || "?"}: missing id/prompt/judgeRubric`);
    } else if (p.judgeRubric.length < 2) {
      bad(`${set.personaId}/${p.id}: rubric too short (need ≥2 criteria)`);
    }
  }
}

const orphans = [...modelIds].filter((id) => !corpusIds.has(id));
const phantoms = [...corpusIds].filter((id) => !modelIds.has(id));
if (orphans.length === 0) ok(`coverage: ${corpusIds.size}/${modelIds.size} personas have prompts`);
else bad(`coverage gap: ${orphans.join(", ")} have no prompts`);
if (phantoms.length === 0) ok("no phantom personas in corpus");
else bad(`phantom personas in corpus: ${phantoms.join(", ")}`);

const sensitive = ["p31-counsel", "p31-triage", "p31-phos"];
for (const s of sensitive) {
  const set = corpus.promptSets.find((x) => x.personaId === s);
  if (set && !set._warning) bad(`${s}: missing _warning field (operator-confidential persona must declare cloud safety in corpus)`);
}
if (sensitive.every((s) => corpus.promptSets.find((x) => x.personaId === s)?._warning)) {
  ok("operator-confidential personas declare _warning fields");
}

console.log("");
if (fail > 0) {
  console.error(`verify-fleet-corpus: FAIL (${fail} issue(s))`);
  process.exit(1);
}
console.log("verify-fleet-corpus: OK");
