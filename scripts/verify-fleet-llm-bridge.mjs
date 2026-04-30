#!/usr/bin/env node
/**
 * Internal fleet (models.json) ↔ Continue.dev config ↔ operator rule pairing.
 * Large LLMs are out of scope here — this script enforces that *repo-bound* surfaces
 * stay aligned so cloud tools do not silently inherit stale persona sets.
 *
 * Skip: andromeda/04_SOFTWARE/continue-p31/config.yaml missing (partial clone).
 * Skip: P31_SKIP_FLEET_LLM_BRIDGE=1
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const modelsPath = path.join(root, "scripts", "p31-fleet-ten", "models.json");
const continuePath = path.join(root, "andromeda", "04_SOFTWARE", "continue-p31", "config.yaml");
const rulePath = path.join(root, ".cursor", "rules", "p31-ollama-fleet.mdc");

function die(msg) {
  console.error("verify-fleet-llm-bridge:", msg);
  process.exit(1);
}

function loadFleetIds() {
  if (!fs.existsSync(modelsPath)) die(`missing ${path.relative(root, modelsPath)}`);
  const models = JSON.parse(fs.readFileSync(modelsPath, "utf8"));
  if (!Array.isArray(models) || models.length !== 10) die("models.json must list exactly 10 personas");
  const ids = [];
  for (const m of models) {
    if (!m.id || typeof m.id !== "string" || !m.id.startsWith("p31-")) die(`bad id ${JSON.stringify(m?.id)}`);
    ids.push(m.id);
  }
  return [...new Set(ids)].sort();
}

function loadContinueModelIds() {
  const raw = fs.readFileSync(continuePath, "utf8");
  const re = /^\s*model:\s*(p31-[\w-]+)\s*$/gim;
  const found = [];
  let m;
  while ((m = re.exec(raw)) !== null) found.push(m[1]);
  return [...new Set(found)].sort();
}

function ruleMentionsAllFleetIds(ids) {
  if (!fs.existsSync(rulePath)) die(`missing ${path.relative(root, rulePath)}`);
  const body = fs.readFileSync(rulePath, "utf8");
  for (const id of ids) {
    if (!body.includes(id)) die(`.cursor/rules/p31-ollama-fleet.mdc must mention fleet id ${id} (pairing table or source-of-truth list)`);
  }
}

function main() {
  if (process.env.P31_SKIP_FLEET_LLM_BRIDGE === "1") {
    console.log("verify-fleet-llm-bridge: skip — P31_SKIP_FLEET_LLM_BRIDGE=1");
    return;
  }
  if (!fs.existsSync(continuePath)) {
    console.log("verify-fleet-llm-bridge: skip — no", path.relative(root, continuePath));
    return;
  }

  const fleet = loadFleetIds();
  const cont = loadContinueModelIds();
  if (cont.length !== 10) die(`continue-p31/config.yaml: expected 10 model: p31-* lines, found ${cont.length}`);

  const a = fleet.join("\n");
  const b = cont.join("\n");
  if (a !== b) {
    die(
      "fleet ids ≠ continue model ids.\n  models.json: " +
        fleet.join(", ") +
        "\n  config.yaml: " +
        cont.join(", ") +
        "\n  Heal: align continue-p31/config.yaml with scripts/p31-fleet-ten/models.json"
    );
  }

  ruleMentionsAllFleetIds(fleet);

  console.log("verify-fleet-llm-bridge: OK — 10 personas ≡ Continue models; rule doc references each id");
}

main();
