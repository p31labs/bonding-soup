/**
 * P31 Psychological E2E — Aggregator  (Layer 6)
 * Run-level statistics across all sessions.
 * Produces the RunReport used by both the Glass Box emitter and the CLI output.
 */
import { ci95 } from "./science-core.mjs";
import { gradeLabel } from "./scorer.mjs";

/**
 * Aggregate all sessions into a RunReport.
 * @param {object[]} sessions   array of SessionResult from scorer.aggregateSession()
 * @param {object}   opts       { runId, startedAt, durationMs }
 * @returns {object}            RunReport
 */
export function aggregateRun(sessions, opts = {}) {
  const valid = sessions.filter(Boolean);
  if (valid.length === 0) {
    return {
      runId: opts.runId || "none",
      startedAt: opts.startedAt || new Date().toISOString(),
      durationMs: opts.durationMs || 0,
      sessionCount: 0,
      stepCount: 0,
      scoreStats: { mean: 0, sd: 0, p5: 0, p25: 0, median: 0, p75: 0, p95: 0 },
      byGrade: {},
      byNDProfile: {},
      criticalFindings: [],
      worstPage: null,
      bestPage: null,
      headline: "No sessions completed.",
      severity: "low",
    };
  }

  // Flatten all step scores
  const allStepScores = valid.flatMap((s) => s.stepScores || []);
  const allScores = allStepScores.map((s) => s.score).sort((a, b) => a - b);
  const n = allScores.length;

  const mean = allScores.reduce((a, b) => a + b, 0) / n;
  const variance = allScores.reduce((s, x) => s + (x - mean) ** 2, 0) / (n - 1 || 1);
  const sd = Math.sqrt(variance);

  const pct = (p) => allScores[Math.floor(p * n)] ?? allScores[n - 1];

  const [ciLo, ciHi] = ci95(allScores);

  // Grade distribution
  const byGrade = {};
  for (const s of allScores) {
    const g = gradeLabel(s);
    byGrade[g] = (byGrade[g] || 0) + 1;
  }

  // ND profile groupings
  const byNDProfile = {};
  for (const sess of valid) {
    const label = sess.persona.label;
    if (!byNDProfile[label]) byNDProfile[label] = { count: 0, scores: [] };
    byNDProfile[label].count++;
    for (const ss of sess.stepScores) byNDProfile[label].scores.push(ss.score);
  }
  for (const [, v] of Object.entries(byNDProfile)) {
    const s = v.scores.sort((a, b) => a - b);
    v.mean = Math.round(s.reduce((a, b) => a + b, 0) / s.length * 10) / 10;
    v.worst = s[0];
    delete v.scores;
  }

  // Critical findings: step scores < 50
  const criticalSteps = allStepScores
    .filter((s) => s.score < 50)
    .map((s) => ({
      url: s.url,
      score: s.score,
      grade: s.grade,
      topDeduction: s.deductions?.[0]?.criterion,
      citation: s.deductions?.[0]?.citation,
      detail: s.deductions?.[0]?.detail,
      cogLoadIndex: s.cogLoadIndex,
      overloadEvent: s.overloadEvent,
    }));

  // Page-level stats
  const byPage = {};
  for (const s of allStepScores) {
    if (!byPage[s.url]) byPage[s.url] = [];
    byPage[s.url].push(s.score);
  }
  const pageStats = Object.entries(byPage).map(([url, scores]) => ({
    url,
    mean: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10,
    n: scores.length,
  }));
  pageStats.sort((a, b) => a.mean - b.mean);

  const worstPage = pageStats[0]     || null;
  const bestPage  = pageStats[pageStats.length - 1] || null;

  const abandonedCount = valid.filter((s) => s.abandoned).length;

  // Severity: any critical finding → high; abandoned > 20% → medium; else low
  let severity = "low";
  if (criticalSteps.length > 0) severity = "high";
  else if (abandonedCount > valid.length * 0.2) severity = "medium";

  // Headline
  const meanRounded = Math.round(mean * 10) / 10;
  const headline = [
    `${valid.length} sessions · ${n} steps · mean ${meanRounded} [${ciLo}–${ciHi}]`,
    criticalSteps.length ? `· ${criticalSteps.length} critical` : "",
    abandonedCount ? `· ${abandonedCount} abandoned` : "",
    worstPage ? `· worst: ${worstPage.url} (${worstPage.mean})` : "",
  ].filter(Boolean).join(" ");

  return {
    runId: opts.runId || crypto.randomUUID?.() || "run",
    startedAt: opts.startedAt || new Date().toISOString(),
    durationMs: opts.durationMs || 0,
    sessionCount: valid.length,
    stepCount: n,
    abandonedCount,
    scoreStats: {
      mean:   Math.round(mean * 10) / 10,
      sd:     Math.round(sd  * 10) / 10,
      ci95:   [ciLo, ciHi],
      p5:     pct(0.05),
      p25:    pct(0.25),
      median: pct(0.50),
      p75:    pct(0.75),
      p95:    pct(0.95),
    },
    byGrade,
    byNDProfile,
    criticalFindings: criticalSteps.slice(0, 10), // top 10 for report
    allCriticalCount: criticalSteps.length,
    worstPage,
    bestPage,
    headline,
    severity,
    sessions: valid.map(({ stepScores: _, ...s }) => s), // strip step detail for top-level
  };
}
