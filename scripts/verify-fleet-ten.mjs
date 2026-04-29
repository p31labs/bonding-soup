#!/usr/bin/env node
/**
 * Static checks for local Ollama fleet (scripts/p31-fleet-ten/).
 * Does not invoke Ollama — use scripts/p31-fleet-ten/verify.sh when models are installed.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "p31-fleet-ten");
const modelsPath = path.join(root, "models.json");

function main() {
  if (!fs.existsSync(modelsPath)) {
    console.error("verify-fleet-ten: missing models.json");
    process.exit(1);
  }
  const models = JSON.parse(fs.readFileSync(modelsPath, "utf8"));
  if (!Array.isArray(models) || models.length !== 10) {
    console.error("verify-fleet-ten: models.json must be an array of length 10");
    process.exit(1);
  }
  const shared = ["_shared-operator-root.txt", "_shared-fleet-root.txt"];
  for (const s of shared) {
    const p = path.join(root, "prompts", s);
    if (!fs.existsSync(p) || fs.statSync(p).size < 80) {
      console.error("verify-fleet-ten: missing or empty", s);
      process.exit(1);
    }
  }
  for (const m of models) {
    if (!m.id || !m.roleFile) {
      console.error("verify-fleet-ten: model entry missing id or roleFile", m);
      process.exit(1);
    }
    const rp = path.join(root, "prompts", m.roleFile);
    if (!fs.existsSync(rp) || fs.statSync(rp).size < 40) {
      console.error("verify-fleet-ten: missing or empty role", m.roleFile);
      process.exit(1);
    }
  }
  for (const sh of ["setup.sh", "verify.sh", "benchmark.sh"]) {
    const p = path.join(root, sh);
    if (!fs.existsSync(p)) {
      console.error("verify-fleet-ten: missing", sh);
      process.exit(1);
    }
    try {
      execFileSync("bash", ["-n", p], { stdio: "pipe" });
    } catch {
      console.error("verify-fleet-ten: bash -n failed for", sh);
      process.exit(1);
    }
  }
  console.log("verify-fleet-ten: OK (static)");
}

main();
