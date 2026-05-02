#!/usr/bin/env node
/**
 * Test corpus runner: takes the canonical test-corpus.json, iterates each
 * prompt for one or more personas, calls the cloud-vs-local harness, and
 * writes a structured per-persona JSON result + an aggregated markdown report.
 *
 * Usage:
 *   node lib/run-comparison.mjs --persona p31-quick
 *   node lib/run-comparison.mjs --all
 *   node lib/run-comparison.mjs --persona p31-quick --skip-cloud
 *   node lib/run-comparison.mjs --persona p31-quick --out-dir /tmp/p31-bench
 *   node lib/run-comparison.mjs --persona p31-quick --lite  # uses qwen3:0.6b shadow
 *
 * Output (default --out-dir = ./out/fleet-comparison):
 *   results/<persona>/<promptId>.json     — raw per-prompt comparison
 *   reports/<persona>.md                  — operator-readable summary
 *   index.md                              — cross-persona dashboard
 *
 * The harness already enforces the operator-confidential ban for
 * p31-counsel/p31-triage/p31-phos when ANTHROPIC_API_KEY is set; corpus
 * fixtures for those personas are SAFE for cloud comparison (see corpus
 * doctrine block).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fleetRoot = path.join(__dirname, "..");
const repoRoot = path.join(fleetRoot, "..", "..");
const CORPUS_PATH = path.join(fleetRoot, "test-corpus.json");
const HARNESS = path.join(fleetRoot, "lib", "cloud-vs-local.mjs");

function parseArgs(argv) {
  const out = { personas: [], all: false, skipCloud: false, outDir: null, lite: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--persona") out.personas.push(argv[++i]);
    else if (a === "--all") out.all = true;
    else if (a === "--skip-cloud") out.skipCloud = true;
    else if (a === "--out-dir") out.outDir = argv[++i];
    else if (a === "--lite") out.lite = true;
    else if (a === "--help" || a === "-h") {
      console.log("usage: run-comparison.mjs (--persona <id> ... | --all) [--skip-cloud] [--out-dir <dir>] [--lite]");
      process.exit(0);
    }
  }
  return out;
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function judge(response, rubric) {
  if (!response || typeof response !== "string") {
    return { matched: 0, of: rubric.length, hits: [], notes: ["no response"] };
  }
  const text = response.toLowerCase();
  const hits = [];
  let matched = 0;
  for (const r of rubric) {
    const lower = r.toLowerCase();
    const keywords = lower
      .replace(/[(){}[\],.:;]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 4 && !["should", "must", "does", "have", "with", "this", "that", "from", "into"].includes(w))
      .slice(0, 3);
    const matchedKeywords = keywords.filter((k) => text.includes(k));
    const matchRatio = keywords.length > 0 ? matchedKeywords.length / keywords.length : 0;
    if (matchRatio >= 0.5) {
      matched++;
      hits.push(r);
    }
  }
  return { matched, of: rubric.length, hits };
}

async function runOnePrompt({ personaId, prompt, skipCloud }) {
  const args = [HARNESS, "--persona", personaId, "--prompt", prompt.prompt];
  if (skipCloud) args.push("--skip-cloud");
  const r = spawnSync("node", args, {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    timeout: 180000,
  });
  let parsed = null;
  try { parsed = JSON.parse(r.stdout); } catch { parsed = { error: "parse failure", stdout: r.stdout, stderr: r.stderr }; }
  return { promptId: prompt.id, prompt: prompt.prompt, rubric: prompt.judgeRubric, harnessResult: parsed };
}

function fmtMs(s) { return s ? `${s.toFixed(2)}s` : "—"; }
function trunc(s, n) { if (!s) return "—"; const t = s.replace(/\n/g, " ⏎ "); return t.length > n ? t.slice(0, n) + "…" : t; }

function renderPersonaReport(personaId, set, runs) {
  const lines = [];
  lines.push(`# ${personaId} — fleet comparison report`);
  lines.push("");
  lines.push(`**Specialty:** ${set.specialty}`);
  if (set._warning) lines.push(`> ${set._warning}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push("| Prompt | Local | Cloud | Local rubric hits | Cloud rubric hits |");
  lines.push("|---|---|---|---|---|");
  for (const run of runs) {
    const h = run.harnessResult || {};
    const local = h.local || {};
    const cloud = h.cloud || {};
    const localResp = local.ok ? local.response : `❌ ${local.error || "n/a"}`;
    const cloudResp = cloud.ok ? cloud.response : `⊘ ${cloud.error || "skipped"}`;
    const localJudge = local.ok ? judge(local.response, run.rubric) : { matched: 0, of: run.rubric.length };
    const cloudJudge = cloud.ok ? judge(cloud.response, run.rubric) : { matched: 0, of: run.rubric.length };
    lines.push(`| \`${run.promptId}\` | ${local.ok ? `${fmtMs(local.seconds)} · ${local.outChars || 0}c` : "❌"} | ${cloud.ok ? `${fmtMs(cloud.seconds)} · ${cloud.outChars || 0}c` : "⊘"} | ${localJudge.matched}/${localJudge.of} | ${cloudJudge.matched}/${cloudJudge.of} |`);
  }
  lines.push("");
  lines.push("## Per-prompt detail");
  lines.push("");
  for (const run of runs) {
    const h = run.harnessResult || {};
    const local = h.local || {};
    const cloud = h.cloud || {};
    lines.push(`### \`${run.promptId}\``);
    lines.push("");
    lines.push("**Prompt:**");
    lines.push("");
    lines.push("```");
    lines.push(run.prompt);
    lines.push("```");
    lines.push("");
    lines.push("**Rubric:**");
    for (const r of run.rubric) lines.push(`- ${r}`);
    lines.push("");
    lines.push(`**Local lane (${local.model || "—"}, ${fmtMs(local.seconds)}):**`);
    lines.push("");
    lines.push("```");
    lines.push(local.ok ? (local.response || "(empty)") : `ERROR: ${local.error}`);
    lines.push("```");
    lines.push("");
    lines.push(`**Cloud lane (${cloud.model || "—"}, ${fmtMs(cloud.seconds)}):**`);
    lines.push("");
    lines.push("```");
    lines.push(cloud.ok ? (cloud.response || "(empty)") : `SKIPPED/ERROR: ${cloud.error}`);
    lines.push("```");
    lines.push("");
    if (local.ok) {
      const j = judge(local.response, run.rubric);
      lines.push(`**Local rubric hits: ${j.matched}/${j.of}** ${j.hits.length > 0 ? "— " + j.hits.map((h) => `\`${h.slice(0, 40)}\``).join(", ") : ""}`);
      lines.push("");
    }
    if (cloud.ok) {
      const j = judge(cloud.response, run.rubric);
      lines.push(`**Cloud rubric hits: ${j.matched}/${j.of}** ${j.hits.length > 0 ? "— " + j.hits.map((h) => `\`${h.slice(0, 40)}\``).join(", ") : ""}`);
      lines.push("");
    }
    lines.push("---");
    lines.push("");
  }
  lines.push("");
  lines.push("> Rubric hits are heuristic keyword matching only — operator must spot-check each output for true quality. Latency and char count are exact.");
  return lines.join("\n");
}

async function main() {
  if (!fs.existsSync(CORPUS_PATH)) {
    console.error(`error: corpus missing at ${CORPUS_PATH}`);
    process.exit(2);
  }
  const corpus = JSON.parse(fs.readFileSync(CORPUS_PATH, "utf8"));
  const args = parseArgs(process.argv.slice(2));
  const outDir = args.outDir || path.join(repoRoot, "out", "fleet-comparison");
  ensureDir(outDir);
  ensureDir(path.join(outDir, "results"));
  ensureDir(path.join(outDir, "reports"));

  const targetPersonas = args.all ? corpus.promptSets.map((s) => s.personaId) : args.personas;
  if (targetPersonas.length === 0) {
    console.error("error: pass --persona <id> at least once or use --all");
    process.exit(2);
  }

  const dashboardRows = [];
  for (const personaId of targetPersonas) {
    const set = corpus.promptSets.find((s) => s.personaId === personaId);
    if (!set) { console.error(`skip: ${personaId} not in corpus`); continue; }
    console.error(`▸ ${personaId} — ${set.prompts.length} prompt(s)`);
    ensureDir(path.join(outDir, "results", personaId));
    const runs = [];
    for (const prompt of set.prompts) {
      console.error(`    · ${prompt.id}`);
      const r = await runOnePrompt({ personaId, prompt, skipCloud: args.skipCloud });
      runs.push(r);
      fs.writeFileSync(path.join(outDir, "results", personaId, `${prompt.id}.json`), JSON.stringify(r, null, 2));
    }
    const report = renderPersonaReport(personaId, set, runs);
    const reportPath = path.join(outDir, "reports", `${personaId}.md`);
    fs.writeFileSync(reportPath, report);
    dashboardRows.push({ personaId, set, runs, reportPath: path.relative(outDir, reportPath) });
  }

  const dashboard = [
    "# Fleet comparison dashboard",
    "",
    `Generated for personas: ${dashboardRows.map((d) => `\`${d.personaId}\``).join(", ")}`,
    "",
    "| Persona | Prompts | Local OK | Cloud OK | Avg local rubric | Avg cloud rubric | Report |",
    "|---|---|---|---|---|---|---|",
  ];
  for (const row of dashboardRows) {
    const local = row.runs.filter((r) => r.harnessResult?.local?.ok).length;
    const cloud = row.runs.filter((r) => r.harnessResult?.cloud?.ok).length;
    const avgLocal = (() => {
      const okRuns = row.runs.filter((r) => r.harnessResult?.local?.ok);
      if (okRuns.length === 0) return "—";
      const s = okRuns.reduce((acc, r) => acc + judge(r.harnessResult.local.response, r.rubric).matched / r.rubric.length, 0);
      return `${(100 * s / okRuns.length).toFixed(0)}%`;
    })();
    const avgCloud = (() => {
      const okRuns = row.runs.filter((r) => r.harnessResult?.cloud?.ok);
      if (okRuns.length === 0) return "—";
      const s = okRuns.reduce((acc, r) => acc + judge(r.harnessResult.cloud.response, r.rubric).matched / r.rubric.length, 0);
      return `${(100 * s / okRuns.length).toFixed(0)}%`;
    })();
    dashboard.push(`| \`${row.personaId}\` | ${row.runs.length} | ${local}/${row.runs.length} | ${cloud}/${row.runs.length} | ${avgLocal} | ${avgCloud} | [report](${row.reportPath}) |`);
  }
  dashboard.push("");
  dashboard.push("> Rubric hits are heuristic; operator spot-check is the source of truth. Latency in per-persona reports is exact.");
  fs.writeFileSync(path.join(outDir, "index.md"), dashboard.join("\n"));

  console.error("");
  console.error(`✓ wrote ${dashboardRows.length} persona report(s) + dashboard → ${path.relative(repoRoot, outDir)}`);
}

main().catch((e) => { console.error("run-comparison: fatal:", e); process.exit(1); });
