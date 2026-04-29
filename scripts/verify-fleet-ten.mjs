#!/usr/bin/env node
/**
 * Static checks for local Ollama fleet (scripts/p31-fleet-ten/).
 * Does not invoke Ollama — use scripts/p31-fleet-ten/verify.sh when models are installed.
 *
 * Asserts:
 *  - models.json is an array of length 10
 *  - shared preamble files exist (operator + fleet)
 *  - each entry has id, from, roleFile, parameters{}, stop[], verifyPrompt
 *  - role file exists and is non-trivial
 *  - parameters.{temperature,top_p,top_k,num_ctx,repeat_penalty} are finite numbers when present
 *  - setup.sh / verify.sh / benchmark.sh parse via `bash -n`
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "p31-fleet-ten");
const modelsPath = path.join(root, "models.json");

const PARAM_KEYS = ["temperature", "top_p", "top_k", "num_ctx", "repeat_penalty"];

function fail(msg) {
  console.error("verify-fleet-ten:", msg);
  process.exit(1);
}

function main() {
  if (!fs.existsSync(modelsPath)) fail("missing models.json");

  let models;
  try {
    models = JSON.parse(fs.readFileSync(modelsPath, "utf8"));
  } catch (e) {
    fail(`models.json not valid JSON: ${e.message}`);
  }
  if (!Array.isArray(models) || models.length !== 10) {
    fail("models.json must be an array of length 10");
  }

  const ids = new Set();
  for (const m of models) {
    if (!m || typeof m !== "object") fail("model entry not an object");
    if (typeof m.id !== "string" || !m.id.startsWith("p31-")) {
      fail(`model entry id must start with p31- (got ${JSON.stringify(m.id)})`);
    }
    if (ids.has(m.id)) fail(`duplicate model id ${m.id}`);
    ids.add(m.id);
    if (typeof m.from !== "string" || !m.from.length) {
      fail(`${m.id}: missing from base tag`);
    }
    if (typeof m.roleFile !== "string" || !m.roleFile.endsWith(".role.txt")) {
      fail(`${m.id}: roleFile must end with .role.txt`);
    }
    if (typeof m.verifyPrompt !== "string" || m.verifyPrompt.length < 10) {
      fail(`${m.id}: verifyPrompt missing or too short`);
    }
    if (!m.parameters || typeof m.parameters !== "object" || Array.isArray(m.parameters)) {
      fail(`${m.id}: parameters must be an object`);
    }
    for (const k of PARAM_KEYS) {
      if (m.parameters[k] === undefined) continue;
      if (typeof m.parameters[k] !== "number" || !Number.isFinite(m.parameters[k])) {
        fail(`${m.id}: parameters.${k} must be a finite number`);
      }
    }
    if (m.stop !== undefined) {
      if (!Array.isArray(m.stop)) fail(`${m.id}: stop must be an array of strings if present`);
      for (const s of m.stop) {
        if (typeof s !== "string") fail(`${m.id}: stop entries must be strings`);
      }
    }
    const rp = path.join(root, "prompts", m.roleFile);
    if (!fs.existsSync(rp) || fs.statSync(rp).size < 40) {
      fail(`missing or empty role file ${m.roleFile}`);
    }
  }

  for (const s of ["_shared-operator-root.txt", "_shared-fleet-root.txt"]) {
    const p = path.join(root, "prompts", s);
    if (!fs.existsSync(p) || fs.statSync(p).size < 80) {
      fail(`missing or empty ${s}`);
    }
  }

  for (const sh of ["setup.sh", "verify.sh", "benchmark.sh"]) {
    const p = path.join(root, sh);
    if (!fs.existsSync(p)) fail(`missing ${sh}`);
    try {
      execFileSync("bash", ["-n", p], { stdio: "pipe" });
    } catch {
      fail(`bash -n failed for ${sh}`);
    }
  }

  console.log(`verify-fleet-ten: OK (static, ${models.length} personas)`);
}

main();
