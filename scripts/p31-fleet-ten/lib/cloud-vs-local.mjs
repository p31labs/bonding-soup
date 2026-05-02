#!/usr/bin/env node
/**
 * Cloud-vs-local A/B harness for the P31 fleet-ten personas.
 *
 * Usage:
 *   node lib/cloud-vs-local.mjs --persona p31-mechanic --prompt "Refactor this..."
 *   node lib/cloud-vs-local.mjs --persona p31-counsel --prompt-file path/to/prompt.txt
 *   node lib/cloud-vs-local.mjs --persona p31-quick --prompt "ok" --json out/run.json
 *
 * Required envs for cloud lane:
 *   ANTHROPIC_API_KEY  — enables Claude side; without it, cloud lane is skipped
 *
 * Optional envs:
 *   OLLAMA_BASE        — default http://127.0.0.1:11434
 *   ANTHROPIC_MODEL    — default claude-sonnet-4-5
 *   P31_BENCH_TIMEOUT  — per-call timeout ms (default 120000)
 *
 * Output: a single JSON object with both runs side-by-side. Always exits 0
 * unless both lanes hard-fail (the point is to *compare*, not to gate).
 *
 * Doctrine:
 *   - This script does NOT pick a winner. Quality judgment stays with the
 *     operator. Output is structured for fast eyeball-diff.
 *   - The persona's full prompt (shared preamble + role file) is baked into
 *     the local model via `ollama create`; we send only the user message.
 *   - For the cloud side, we manually compose a system message that mirrors
 *     the same shared preamble + role file, so both lanes see the same
 *     personality contract. Lane B cloud route does NOT carry the same
 *     legal/operator-confidential guards — never use this harness with
 *     p31-counsel / p31-triage / p31-phos prompts that contain sensitive
 *     content. Same hard ban as scripts/ollama-tunnel.sh.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fleetRoot = path.join(__dirname, "..");
const repoRoot = path.join(fleetRoot, "..", "..");

const SENSITIVE_PERSONAS = new Set(["p31-counsel", "p31-triage", "p31-phos"]);

function parseArgs(argv) {
  const out = { persona: null, prompt: null, promptFile: null, json: null, skipCloud: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--persona") out.persona = argv[++i];
    else if (a === "--prompt") out.prompt = argv[++i];
    else if (a === "--prompt-file") out.promptFile = argv[++i];
    else if (a === "--json") out.json = argv[++i];
    else if (a === "--skip-cloud") out.skipCloud = true;
    else if (a === "--help" || a === "-h") {
      console.log("usage: cloud-vs-local.mjs --persona <id> (--prompt <text> | --prompt-file <path>) [--json <outpath>] [--skip-cloud]");
      process.exit(0);
    }
  }
  return out;
}

async function loadPersonaSystemPrompt(personaId) {
  const models = JSON.parse(fs.readFileSync(path.join(fleetRoot, "models.json"), "utf8"));
  const m = models.find((x) => x.id === personaId);
  if (!m) throw new Error(`unknown persona: ${personaId}`);
  const { buildSystemPrompt } = await import(path.join(fleetRoot, "lib", "merge-system-prompt.mjs"));
  return { model: m, system: buildSystemPrompt(m.roleFile) };
}

async function runLocal({ personaId, userPrompt, timeoutMs }) {
  const base = process.env.OLLAMA_BASE || "http://127.0.0.1:11434";
  const t0 = Date.now();
  const ctl = new AbortController();
  const tk = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(`${base}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: personaId, prompt: userPrompt, stream: false, keep_alive: 0 }),
      signal: ctl.signal,
    });
    const dt = (Date.now() - t0) / 1000;
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      return { ok: false, lane: "local", model: personaId, seconds: dt, error: `${res.status} ${res.statusText}: ${errBody.slice(0, 400)}` };
    }
    const j = await res.json();
    return {
      ok: true,
      lane: "local",
      model: personaId,
      seconds: Number(dt.toFixed(2)),
      response: j.response,
      outChars: (j.response || "").length,
      evalCount: j.eval_count,
      evalDurationMs: j.eval_duration ? Math.round(j.eval_duration / 1e6) : null,
      tokPerSec: j.eval_count && j.eval_duration ? Number((j.eval_count / (j.eval_duration / 1e9)).toFixed(2)) : null,
    };
  } catch (e) {
    return { ok: false, lane: "local", model: personaId, error: e.message };
  } finally {
    clearTimeout(tk);
  }
}

async function runCloud({ system, userPrompt, timeoutMs }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false, lane: "cloud", error: "ANTHROPIC_API_KEY not set; skipping" };
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";
  const t0 = Date.now();
  const ctl = new AbortController();
  const tk = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system,
        messages: [{ role: "user", content: userPrompt }],
      }),
      signal: ctl.signal,
    });
    const dt = (Date.now() - t0) / 1000;
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      return { ok: false, lane: "cloud", model, seconds: dt, error: `${res.status} ${res.statusText}: ${errBody.slice(0, 400)}` };
    }
    const j = await res.json();
    const text = (j.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
    return {
      ok: true,
      lane: "cloud",
      model,
      seconds: Number(dt.toFixed(2)),
      response: text,
      outChars: text.length,
      inputTokens: j.usage?.input_tokens,
      outputTokens: j.usage?.output_tokens,
      stopReason: j.stop_reason,
    };
  } catch (e) {
    return { ok: false, lane: "cloud", model: "anthropic", error: e.message };
  } finally {
    clearTimeout(tk);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.persona) {
    console.error("error: --persona <id> required");
    process.exit(2);
  }
  const userPrompt = args.prompt || (args.promptFile ? fs.readFileSync(args.promptFile, "utf8") : null);
  if (!userPrompt) {
    console.error("error: --prompt <text> or --prompt-file <path> required");
    process.exit(2);
  }
  const { system } = await loadPersonaSystemPrompt(args.persona);
  const timeoutMs = Number(process.env.P31_BENCH_TIMEOUT || 120000);

  if (SENSITIVE_PERSONAS.has(args.persona) && !args.skipCloud && process.env.ANTHROPIC_API_KEY) {
    console.error(`error: ${args.persona} is operator-confidential; pass --skip-cloud to run local-only`);
    process.exit(3);
  }

  const local = await runLocal({ personaId: args.persona, userPrompt, timeoutMs });
  const cloud = args.skipCloud ? { ok: false, lane: "cloud", error: "skipped (--skip-cloud)" } : await runCloud({ system, userPrompt, timeoutMs });

  const result = {
    schema: "p31.cloudVsLocal/1.0.0",
    persona: args.persona,
    promptChars: userPrompt.length,
    promptSnippet: userPrompt.slice(0, 200),
    local,
    cloud,
    note: "Operator judges output quality; harness reports latency + size only.",
  };

  const json = JSON.stringify(result, null, 2);
  if (args.json) {
    fs.mkdirSync(path.dirname(args.json), { recursive: true });
    fs.writeFileSync(args.json, json);
    console.log(`wrote ${args.json}`);
  } else {
    console.log(json);
  }
}

main().catch((e) => {
  console.error("cloud-vs-local: fatal:", e);
  process.exit(1);
});
