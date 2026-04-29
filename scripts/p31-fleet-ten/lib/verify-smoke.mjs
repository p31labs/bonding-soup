#!/usr/bin/env node
/**
 * Smoke-test each fleet model.
 * - Most personas: expect a literal `OK_<NAME>` marker on a single line.
 * - p31-triage: expect strict JSON matching the 4-tier voltage contract
 *   ({voltage, score, spoon_cost, summary, action, reasons[], escalate, suggested_next, rationale}).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fleetRoot = path.join(__dirname, "..");
const models = JSON.parse(fs.readFileSync(path.join(fleetRoot, "models.json"), "utf8"));

function run(model, prompt) {
  const r = spawnSync("ollama", ["run", model, prompt], {
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
    timeout: 240000,
  });
  if (r.error) throw r.error;
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout || `exit ${r.status}`);
    process.exit(r.status ?? 1);
  }
  return (r.stdout || "").trim();
}

function tryParseJsonObject(text) {
  try {
    return JSON.parse(text);
  } catch {
    /* fall through */
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

function validateTriageJson(obj) {
  if (!obj || typeof obj !== "object") return "not an object";
  const voltage = obj.voltage;
  if (!["GREEN", "YELLOW", "RED", "CRITICAL"].includes(voltage)) {
    return `voltage must be GREEN|YELLOW|RED|CRITICAL (got ${JSON.stringify(voltage)})`;
  }
  const score = obj.score;
  if (typeof score !== "number" || score < 1 || score > 10) {
    return `score must be number 1-10 (got ${JSON.stringify(score)})`;
  }
  const spoon = obj.spoon_cost;
  if (typeof spoon !== "number" || spoon < 0 || spoon > 10) {
    return `spoon_cost must be number 0-10 (got ${JSON.stringify(spoon)})`;
  }
  const action = obj.action;
  if (!["none", "respond", "buffer", "alert", "route_to_counsel"].includes(action)) {
    return `action must be one of none|respond|buffer|alert|route_to_counsel (got ${JSON.stringify(action)})`;
  }
  if (typeof obj.summary !== "string" || !obj.summary.length) return "summary must be non-empty string";
  if (typeof obj.rationale !== "string" || !obj.rationale.length) return "rationale must be non-empty string";
  return null;
}

let failed = 0;
for (const m of models) {
  process.stdout.write(`\n━━ smoke ${m.id} ━━\n`);
  const out = run(m.id, m.verifyPrompt);
  console.log(out.slice(0, 600));
  let ok = false;
  let why = "";
  if (m.id === "p31-triage") {
    const parsed = tryParseJsonObject(out);
    const err = validateTriageJson(parsed);
    ok = err === null;
    why = err || "";
  } else {
    const token = `OK_${m.id.replace("p31-", "").toUpperCase()}`;
    ok = out.includes(token);
    why = ok ? "" : `expected token ${token} in output`;
  }
  if (!ok) {
    console.error(`FAIL: ${m.id} — ${why}`);
    failed++;
  }
}
if (failed) process.exit(1);
console.log("\nverify-smoke: all models passed");
