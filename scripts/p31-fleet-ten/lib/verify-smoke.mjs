#!/usr/bin/env node
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

let failed = 0;
for (const m of models) {
  process.stdout.write(`\n━━ smoke ${m.id} ━━\n`);
  const out = run(m.id, m.verifyPrompt);
  console.log(out.slice(0, 400));
  let ok = false;
  if (m.id === "p31-triage") {
    try {
      const j = JSON.parse(out);
      ok = j.ok === true && j.model === "triage";
    } catch {
      ok = false;
    }
  } else {
    const token = `OK_${m.id.replace("p31-", "").toUpperCase()}`;
    ok = out.includes(token);
  }
  if (!ok) {
    console.error(`FAIL: ${m.id} — expected marker not found in output above`);
    failed++;
  }
}
if (failed) process.exit(1);
console.log("\nverify-smoke: all models passed");
