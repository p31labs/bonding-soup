#!/usr/bin/env node
/**
 * Invoked by setup.sh — optional pulls + `ollama create` for each fleet model.
 * Emits PARAMETER lines from models.json before the SYSTEM block so per-persona
 * temperature / top_p / top_k / num_ctx / repeat_penalty / stop tokens stay versioned.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { buildSystemPrompt } from "./merge-system-prompt.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fleetRoot = path.join(__dirname, "..");
const models = JSON.parse(fs.readFileSync(path.join(fleetRoot, "models.json"), "utf8"));

const OLLAMA_QWEN_CODER = process.env.OLLAMA_QWEN_CODER || "qwen2.5-coder:7b";
const OLLAMA_QWEN3 = process.env.OLLAMA_QWEN3 || "qwen3:8b";
const OLLAMA_PHI_QUICK = process.env.OLLAMA_PHI_QUICK || "phi4-mini:latest";

const fromMap = {
  "qwen2.5-coder:7b": OLLAMA_QWEN_CODER,
  "qwen3:8b": OLLAMA_QWEN3,
  "phi4-mini:latest": OLLAMA_PHI_QUICK,
};

const PARAM_KEYS = ["temperature", "top_p", "top_k", "num_ctx", "repeat_penalty"];

function renderParameters(m) {
  const lines = [];
  const params = m.parameters || {};
  for (const key of PARAM_KEYS) {
    if (params[key] === undefined) continue;
    if (typeof params[key] !== "number" || !Number.isFinite(params[key])) {
      throw new Error(`Model ${m.id}: parameter ${key} must be a finite number`);
    }
    lines.push(`PARAMETER ${key} ${params[key]}`);
  }
  if (Array.isArray(m.stop)) {
    for (const tok of m.stop) {
      if (typeof tok !== "string" || !tok.length) continue;
      const escaped = tok.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      lines.push(`PARAMETER stop "${escaped}"`);
    }
  }
  return lines.join("\n");
}

function runOllamaCreate(name, modelfileBody) {
  const tmp = path.join(
    os.tmpdir(),
    `p31-fleet-${name}-${process.pid}-${Date.now()}.Modelfile`
  );
  fs.writeFileSync(tmp, modelfileBody, "utf8");
  const r = spawnSync("ollama", ["create", name, "-f", tmp], {
    stdio: "inherit",
    encoding: "utf8",
  });
  try {
    fs.unlinkSync(tmp);
  } catch {
    /* ignore */
  }
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function runPull(base) {
  console.log(`\n━━ ollama pull ${base} ━━`);
  const r = spawnSync("ollama", ["pull", base], { stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const pull = process.argv.includes("--pull");
if (pull) {
  const bases = new Set();
  for (const m of models) {
    bases.add(fromMap[m.from] || m.from);
  }
  for (const b of bases) runPull(b);
}

for (const m of models) {
  const from = fromMap[m.from] || m.from;
  const system = buildSystemPrompt(m.roleFile);
  if (system.includes('"""')) {
    throw new Error(`System text for ${m.id} contains forbidden triple-double-quote sequence`);
  }
  const paramBlock = renderParameters(m);
  const modelfile =
    `FROM ${from}\n` +
    (paramBlock ? `${paramBlock}\n` : "") +
    `SYSTEM """\n${system}\n"""\n`;
  console.log(`\n━━ ollama create ${m.id} ━━`);
  runOllamaCreate(m.id, modelfile);
}
console.log("\nFleet models created:", models.map((x) => x.id).join(", "));
