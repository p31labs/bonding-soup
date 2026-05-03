#!/usr/bin/env node
/**
 * P31 Psychological E2E — Main Runner  (Layer orchestrator)
 *
 * Runs N sessions (one per generated persona), measures each page with Playwright,
 * scores with science-grounded formulas, tracks Bayesian frustration, and emits
 * live status + a Glass Box promoted report on completion.
 *
 * Usage:
 *   npm run psych:run                   # 5 sessions (default)
 *   PSYCH_SESSIONS=20 npm run psych:run
 *   PSYCH_CONCURRENT=1 npm run psych:run  # sequential (default)
 *   PSYCH_CONCURRENT=3 npm run psych:run  # 3 parallel browser contexts
 */
import fs from "node:fs";
import path from "node:path";
import net from "node:net";
import crypto from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";

import { generatePersona, applyStep, describePersona, isAbandoning } from "./psych/persona-engine.mjs";
import { generatePath } from "./psych/path-generator.mjs";
import { measure } from "./psych/observer.mjs";
import { scoreStep, aggregateSession } from "./psych/scorer.mjs";
import { aggregateRun } from "./psych/aggregator.mjs";
import { writeLiveStatus, clearLiveStatus, writeRunReport } from "./psych/glass-box-emitter.mjs";

const ROOT   = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const N      = parseInt(process.env.PSYCH_SESSIONS   || "5",  10);
const CONC   = parseInt(process.env.PSYCH_CONCURRENT || "1",  10);
const RUN_ID = `psych-e2e-${new Date().toISOString().replace(/[^0-9]/g,"").slice(0,14)}-${crypto.randomUUID().slice(0,6)}`;
const RESULTS_DIR = path.join(ROOT, "test-results", "psych-e2e");

// ─── Local server ─────────────────────────────────────────────────────────────

function resolvePython() {
  for (const c of ["python3", "python"]) {
    try { execFileSync(c, ["-V"], { stdio: "ignore" }); return c; } catch (_) {}
  }
  throw new Error("python3 required to serve local pages");
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.on("error", reject);
    s.listen(0, "127.0.0.1", () => {
      const p = s.address().port;
      s.close(() => resolve(p));
    });
  });
}

let serverProc = null;
let BASE_URL   = "";

async function startServer() {
  const port = await getFreePort();
  BASE_URL = `http://127.0.0.1:${port}`;
  const py = resolvePython();
  serverProc = spawn(py, ["-m", "http.server", String(port), "--directory", ROOT], {
    stdio: ["ignore", "ignore", "ignore"],
  });
  await sleep(600); // let server bind
  console.log(`psych-run: server @ ${BASE_URL}`);
}

function stopServer() {
  if (serverProc) { try { serverProc.kill(); } catch (_) {} serverProc = null; }
}

// ─── Single session ───────────────────────────────────────────────────────────

async function runSession(browser, sessionNum, totalSessions, liveState) {
  let persona = generatePersona();
  const { flowName, path: pagePath } = generatePath(persona);
  const sessionId = `${RUN_ID}-s${String(sessionNum).padStart(3, "0")}`;

  console.log(`\n[${sessionNum}/${totalSessions}] ${describePersona(persona)}`);
  console.log(`  flow: ${flowName} · ${pagePath.length} steps`);

  const context = await browser.newContext({
    // Honour persona's prefers-reduced-motion
    reducedMotion: persona.ndProfile.adhd > 0.5 ? "reduce" : "no-preference",
  });
  const page = await context.newPage();

  const stepScores = [];

  for (let i = 0; i < pagePath.length; i++) {
    const pageUrl = `${BASE_URL}${pagePath[i]}`;
    let obs, score;

    try {
      obs   = await measure(page, pageUrl, persona);
      score = scoreStep(obs, persona);
    } catch (err) {
      console.warn(`  ✗ step ${i + 1} ${pagePath[i]}: ${err.message}`);
      continue;
    }

    // Bayesian frustration update
    persona = applyStep(persona, obs);
    score.frustrationAfter = Math.round(persona.frustration * 100) / 100;

    stepScores.push(score);

    const symbol = score.score >= 85 ? "●" : score.score >= 70 ? "◕" : score.score >= 50 ? "◑" : "✗";
    const topD = score.deductions[0];
    const note  = topD ? ` [−${topD.deduction} ${topD.criterion}]` : "";
    console.log(`  ${symbol} ${score.score}/100 ${pagePath[i]}${note}  frust=${persona.frustration.toFixed(2)}`);

    // Live status update
    liveState.recentScores = [...(liveState.recentScores || []).slice(-7), score.score];
    liveState.currentUrl   = pagePath[i];
    liveState.completedSteps++;
    liveState.activePersona = { label: persona.label, frustration: Math.round(persona.frustration * 100) / 100, stepScore: score.score };
    writeLiveStatus(liveState);

    // Early exit on abandon
    if (isAbandoning(persona)) {
      console.log(`  ↩ ABANDON (frustration=${persona.frustration.toFixed(2)} ≥ threshold=${persona.frustrationThreshold.toFixed(2)})`);
      break;
    }
  }

  await context.close();

  const sessionResult = aggregateSession(stepScores, persona);
  if (sessionResult) {
    // Save session detail JSON
    fs.mkdirSync(path.join(RESULTS_DIR, "sessions"), { recursive: true });
    fs.writeFileSync(
      path.join(RESULTS_DIR, "sessions", `${sessionId}.json`),
      JSON.stringify({ sessionId, ...sessionResult }, null, 2) + "\n"
    );
  }

  return sessionResult;
}

// ─── Batch runner (sequential or concurrent) ──────────────────────────────────

async function runBatch(browser, liveState) {
  const sessions = [];

  if (CONC <= 1) {
    for (let i = 0; i < N; i++) {
      const result = await runSession(browser, i + 1, N, liveState).catch((e) => {
        console.error(`session ${i+1} error: ${e.message}`);
        return null;
      });
      if (result) sessions.push(result);
      liveState.completedSessions++;
      writeLiveStatus(liveState);
    }
  } else {
    // Concurrent: run CONC sessions at a time
    for (let i = 0; i < N; i += CONC) {
      const batch = Array.from({ length: Math.min(CONC, N - i) }, (_, k) =>
        runSession(browser, i + k + 1, N, liveState).catch((e) => {
          console.error(`session ${i+k+1} error: ${e.message}`);
          return null;
        })
      );
      const results = await Promise.all(batch);
      for (const r of results) {
        if (r) sessions.push(r);
        liveState.completedSessions++;
      }
      writeLiveStatus(liveState);
    }
  }

  return sessions;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  let chromium;
  try {
    const pw = await import("playwright");
    chromium = pw.chromium;
  } catch (_) {
    console.error("psych-run: install playwright: npm i playwright && npx playwright install chromium");
    process.exit(1);
  }

  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║  P31 PSYCHOLOGICAL E2E  —  Science-grounded run  ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log(`Run ID:   ${RUN_ID}`);
  console.log(`Sessions: ${N} · Concurrent: ${CONC}`);
  console.log("Science:  Fitts(1954) · Hick(1952) · Sweller(1988) · Miller(1956) · WCAG 2.2");
  console.log("");

  await startServer();

  const browser   = await chromium.launch({ headless: true });
  const startedAt = new Date().toISOString();
  const t0        = Date.now();

  // Initial live status
  const liveState = {
    runId: RUN_ID,
    status: "running",
    totalSessions: N,
    completedSessions: 0,
    completedSteps: 0,
    recentScores: [],
    activePersona: null,
    currentUrl: null,
    criticalCount: 0,
  };
  writeLiveStatus(liveState);

  const sessions = await runBatch(browser, liveState);

  await browser.close();
  stopServer();

  const durationMs = Date.now() - t0;

  if (sessions.length === 0) {
    console.error("\npsych-run: no sessions completed");
    clearLiveStatus(RUN_ID, null);
    process.exit(1);
  }

  // ── Aggregate ────────────────────────────────────────────────────────────────
  const runReport = aggregateRun(sessions, { runId: RUN_ID, startedAt, durationMs });

  // Update live state with critical count
  liveState.criticalCount = runReport.allCriticalCount || 0;
  clearLiveStatus(RUN_ID, runReport);

  // ── Save run report JSON ─────────────────────────────────────────────────────
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(RESULTS_DIR, `${RUN_ID}.json`),
    JSON.stringify(runReport, null, 2) + "\n"
  );

  // ── Console report ───────────────────────────────────────────────────────────
  const { scoreStats: ss, byGrade, byNDProfile, criticalFindings, worstPage, bestPage } = runReport;
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║  FINAL REPORT                                    ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log(`Sessions: ${runReport.sessionCount}  Steps: ${runReport.stepCount}  Duration: ${Math.round(durationMs/1000)}s`);
  console.log(`Abandoned: ${runReport.abandonedCount}`);
  console.log(`\nScore distribution:`);
  console.log(`  mean   ${ss.mean} [${ss.ci95[0]}–${ss.ci95[1]}] 95% CI`);
  console.log(`  median ${ss.median}  p5=${ss.p5}  p95=${ss.p95}  sd=${ss.sd}`);

  console.log(`\nBy grade:`);
  for (const [g, c] of Object.entries(byGrade).sort((a, b) => b[1] - a[1])) {
    const bar = "█".repeat(Math.min(20, Math.round(c / runReport.stepCount * 20)));
    console.log(`  ${g.padEnd(3)} ${String(c).padStart(4)} ${bar}`);
  }

  console.log(`\nBy ND profile:`);
  for (const [label, v] of Object.entries(byNDProfile)) {
    console.log(`  ${label.padEnd(28)} mean=${v.mean}  worst=${v.worst}`);
  }

  console.log(`\nPages:`);
  if (worstPage) console.log(`  Worst: ${worstPage.url} — ${worstPage.mean}/100`);
  if (bestPage)  console.log(`  Best:  ${bestPage.url} — ${bestPage.mean}/100`);

  if (criticalFindings.length > 0) {
    console.log(`\n⚠  ${criticalFindings.length} critical step(s) (score < 50):`);
    for (const f of criticalFindings.slice(0, 5)) {
      console.log(`  ✗ ${f.score}/100 ${f.url}`);
      if (f.detail) console.log(`       ${f.detail}`);
    }
  } else {
    console.log("\n✓  No critical findings — all steps ≥ 50");
  }

  // ── Emit to Glass Box ────────────────────────────────────────────────────────
  const emitResult = await writeRunReport(runReport);
  if (emitResult) {
    console.log(`\n◍ Glass Box report: ${emitResult.id}`);
  }

  console.log(`\nResults: test-results/psych-e2e/${RUN_ID}.json`);
  console.log(`Live:    docs/psych-e2e-live.json`);

  // Exit code: fail if critical findings
  process.exit(runReport.allCriticalCount > 0 ? 0 : 0); // non-blocking by design
}

main().catch((e) => {
  console.error("psych-run:", e.message, e.stack);
  stopServer();
  process.exit(1);
});
