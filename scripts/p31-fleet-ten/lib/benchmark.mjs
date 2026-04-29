#!/usr/bin/env node
/**
 * Rough tok/s estimate: chars/sec on stdout from a short generation pass.
 * VRAM: best-effort via `nvidia-smi` when present.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fleetRoot = path.join(__dirname, "..");
const models = JSON.parse(fs.readFileSync(path.join(fleetRoot, "models.json"), "utf8"));

const BENCH_PROMPT =
  "Write exactly 120 words on why deterministic local verify scripts beat silent drift. No title line.";

function nvidiaSummary() {
  const r = spawnSync("nvidia-smi", ["--query-gpu=memory.used,memory.total", "--format=csv,noheader,nounits"], {
    encoding: "utf8",
  });
  if (r.status !== 0) return "(nvidia-smi unavailable)";
  return r.stdout.trim().replace(/\n/g, " | ");
}

for (const m of models) {
  const t0 = Date.now();
  const r = spawnSync("ollama", ["run", m.id, BENCH_PROMPT], {
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
    timeout: 300000,
  });
  const dt = (Date.now() - t0) / 1000;
  const text = (r.stdout || "").trim();
  const chars = text.length;
  const cps = dt > 0 ? (chars / dt).toFixed(0) : "0";
  const tokApprox = dt > 0 ? ((chars / 4) / dt).toFixed(1) : "0";
  console.log(
    JSON.stringify({
      model: m.id,
      seconds: Number(dt.toFixed(2)),
      outChars: chars,
      charsPerSec: Number(cps),
      approxTokPerSec: Number(tokApprox),
      exit: r.status,
    })
  );
}

console.log("\nGPU mem snapshot:", nvidiaSummary());
