/**
 * P31 Psychological E2E — Scorer  (Layer 5)
 * Maps StepObservation + PersonaRecord → StepScore with per-criterion citations.
 * Every deduction and bonus has a maximum cap and a citation.
 */
import { fittsCategory, hickCategory, clsCategory, ci95 } from "./science-core.mjs";

// ─── Grade mapping ─────────────────────────────────────────────────────────────

const GRADE_THRESHOLDS = [
  { min: 93, label: "A",  symbol: "●" },
  { min: 85, label: "A-", symbol: "●" },
  { min: 77, label: "B+", symbol: "◕" },
  { min: 70, label: "B",  symbol: "◕" },
  { min: 63, label: "B-", symbol: "◑" },
  { min: 55, label: "C+", symbol: "◑" },
  { min: 47, label: "C",  symbol: "◔" },
  { min: 40, label: "C-", symbol: "◔" },
  { min: 30, label: "D",  symbol: "○" },
  { min:  0, label: "F",  symbol: "✗" },
];

export function gradeLabel(score) {
  for (const t of GRADE_THRESHOLDS) {
    if (score >= t.min) return t.label;
  }
  return "F";
}

// ─── Penalty helpers ───────────────────────────────────────────────────────────

function deduct(deductions, criterion, citation, penalty, detail) {
  if (penalty <= 0) return 0;
  const capped = Math.round(Math.min(penalty, 30)); // global single-criterion cap
  deductions.push({ criterion, citation, deduction: capped, detail });
  return capped;
}

function bonus(bonuses, criterion, citation, amount, detail) {
  bonuses.push({ criterion, citation, bonus: amount, detail });
  return amount;
}

// ─── Core scorer ──────────────────────────────────────────────────────────────

/**
 * Score one step for one persona.
 * @param {object} obs      StepObservation (from observer.mjs)
 * @param {object} persona  PersonaRecord (from persona-engine.mjs)
 * @returns {object}        StepScore
 */
export function scoreStep(obs, persona) {
  let score = 100;
  const deductions = [];
  const bonuses    = [];

  // ── 1. Fitts' Law — motor difficulty  [Fitts1954; MacKenzie1992] ─────────────
  if (persona.motorMultiplier !== null) {
    const cat = fittsCategory(obs.fittsMeanMT);
    if (cat === "slow") {
      const d = deduct(deductions, "fitts-slow", "Fitts (1954)",
        (obs.fittsMeanMT - 600) / 100 * 3 * persona.motorMultiplier,
        `mean MT=${obs.fittsMeanMT}ms — slow pointing (600–1200ms)`);
      score -= d;
    } else if (cat === "difficult") {
      const d = deduct(deductions, "fitts-difficult", "Fitts (1954)",
        (obs.fittsMeanMT - 1200) / 100 * 5 * persona.motorMultiplier,
        `mean MT=${obs.fittsMeanMT}ms — difficult pointing (>1200ms)`);
      score -= d;
    }
  }

  // ── 2. Hick's Law — decision time  [Hick1952] ────────────────────────────────
  const hickCat = hickCategory(obs.hickDecisionRT);
  const nWeight = 1 + persona.ocean.N * 0.5; // Neuroticism amplifies decision anxiety
  if (hickCat === "medium") {
    const d = deduct(deductions, "hick-medium", "Hick (1952)",
      Math.max(0, (obs.hickDecisionRT - 300) / 100) * 2 * nWeight,
      `RT=${obs.hickDecisionRT}ms (${obs.navChoiceCount} choices) — medium decision load`);
    score -= d;
  } else if (hickCat === "hard") {
    const d = deduct(deductions, "hick-hard", "Hick (1952)",
      Math.max(0, (obs.hickDecisionRT - 600) / 100) * 4 * nWeight,
      `RT=${obs.hickDecisionRT}ms (${obs.navChoiceCount} choices) — hard decision load`);
    score -= d;
  }

  // ── 3. Cognitive Overload  [Sweller1988 + Miller1956] ────────────────────────
  if (obs.overloadEvent) {
    const overflow = Math.max(0, obs.cogLoadIndex - persona.wmCapacity);
    const d = deduct(deductions, "clt-overload",
      "Sweller (1988); Miller (1956)",
      overflow * 5,
      `CLI=${obs.cogLoadIndex} > WM=${persona.wmCapacity.toFixed(1)} — working memory overflow`);
    score -= d;
  }

  // ── 4. Load time — frustration [Nah 2004 load-tolerance threshold] ──────────
  if (obs.loadTimeMs > 2000) {
    // Penalty scales with Neuroticism (high-N less tolerant of wait)
    const excess = obs.loadTimeMs - 2000;
    const d = deduct(deductions, "slow-load", "Nah (2004)",
      Math.log2(excess / 500 + 1) * persona.ocean.N * 8,
      `load=${obs.loadTimeMs}ms — exceeds 2s comfort threshold`);
    score -= d;
  } else if (obs.loadTimeMs < 500) {
    const b = bonus(bonuses, "fast-load", "web.dev/lcp", 4,
      `load=${obs.loadTimeMs}ms — fast load`);
    score += b;
  }

  // ── 5. Motion violation  [WCAG22 SC 2.3.3; Barkley1997] ─────────────────────
  if (obs.motionViolation) {
    const adhdWeight = Math.max(0.3, persona.ndProfile.adhd);
    const d = deduct(deductions, "motion-violation",
      "WCAG 2.2 SC 2.3.3; Barkley (1997)",
      15 * adhdWeight,
      `unreduced motion (${obs.animationCount} animations) — ADHD trigger`);
    score -= d;
  }

  // ── 6. CLS — layout instability  [GoogleCLS2020; ADHD attention capture] ─────
  const clsCat = clsCategory(obs.layoutShiftCLS);
  const adhdSensitivity = 1 + persona.ndProfile.adhd * 0.8;
  if (clsCat === "poor") {
    const d = deduct(deductions, "cls-poor", "Google CLS (2020)",
      obs.layoutShiftCLS * 80 * adhdSensitivity,
      `CLS=${obs.layoutShiftCLS.toFixed(3)} — poor (>0.25)`);
    score -= d;
  } else if (clsCat === "needs-improvement") {
    const d = deduct(deductions, "cls-medium", "Google CLS (2020)",
      obs.layoutShiftCLS * 40 * adhdSensitivity,
      `CLS=${obs.layoutShiftCLS.toFixed(3)} — needs improvement (0.1–0.25)`);
    score -= d;
  } else if (obs.layoutShiftCLS > 0.05 && persona.ndProfile.adhd > 0.5) {
    // CLS < 0.1 but ADHD-relevant threshold
    const d = deduct(deductions, "cls-adhd-threshold",
      "Google CLS (2020); Barkley (1997)",
      obs.layoutShiftCLS * 20,
      `CLS=${obs.layoutShiftCLS.toFixed(3)} — above ADHD sensitivity threshold (0.05)`);
    score -= d;
  }

  // ── 7. Contrast violations  [WCAG22 SC 1.4.3] ────────────────────────────────
  if (obs.contrastViolations > 0) {
    const cvdWeight = persona.colorVision !== "normal" ? 2.0 : 1.0;
    const spsWeight = 1 + persona.ndProfile.sps * 0.4;
    const d = deduct(deductions, "contrast-fail",
      "WCAG 2.2 SC 1.4.3",
      obs.contrastViolations * 6 * cvdWeight * spsWeight,
      `${obs.contrastViolations} contrast violation(s) — WCAG AA fails`);
    score -= d;
  }

  // ── 8. ARIA coverage  [WCAG22 SC 4.1.2] ──────────────────────────────────────
  if (!obs.ariaOK) {
    const cvdPenalty = persona.colorVision !== "normal" ? 1.5 : 1.0;
    const gap = Math.max(0, 0.80 - obs.ariaLabelCoverage);
    const d = deduct(deductions, "aria-gap",
      "WCAG 2.2 SC 4.1.2",
      gap * 25 * cvdPenalty,
      `ARIA coverage=${(obs.ariaLabelCoverage * 100).toFixed(0)}% — below 80% threshold`);
    score -= d;
  }

  // ── 9. Target size  [WCAG22 SC 2.5.8] ────────────────────────────────────────
  if (obs.targetSizeViolations > 0) {
    const dcdWeight = Math.max(0.3, persona.ndProfile.dcd || 0.3);
    const d = deduct(deductions, "target-size",
      "WCAG 2.2 SC 2.5.8 (24×24 px minimum)",
      Math.min(obs.targetSizeViolations * 2, 15) * dcdWeight,
      `${obs.targetSizeViolations} targets < 24×24px`);
    score -= d;
  }

  // ── 10. Font size  [WCAG22 SC 1.4.4 + geriatric vision research] ─────────────
  if (obs.smallestFontPx < 14) {
    const d = deduct(deductions, "small-font",
      "WCAG 2.2 SC 1.4.4; Legge (2007)",
      (14 - obs.smallestFontPx) * 2,
      `min font=${obs.smallestFontPx}px — below 14px legibility threshold`);
    score -= d;
  }

  // ── 11. Heading hierarchy  [WCAG22 SC 1.3.1] ─────────────────────────────────
  if (!obs.headingHierarchyOK) {
    const d = deduct(deductions, "heading-skip",
      "WCAG 2.2 SC 1.3.1",
      5,
      "heading level skip detected — damages screen reader / cognitive navigation");
    score -= d;
  }

  // ── 12. Skip link  [WCAG22 SC 2.4.1] ─────────────────────────────────────────
  if (obs.skipLinkPresent) {
    const b = bonus(bonuses, "skip-link", "WCAG 2.2 SC 2.4.1", 3, "skip link present");
    score += b;
  } else {
    const d = deduct(deductions, "no-skip-link", "WCAG 2.2 SC 2.4.1", 5,
      "no skip link — keyboard-only users must tab through full navigation");
    score -= d;
  }

  // ── Clamp and grade ────────────────────────────────────────────────────────────
  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    url: obs.url,
    ts: obs.ts,
    score,
    grade: gradeLabel(score),
    deductions,
    bonuses,
    // Key formula outputs for Glass Box display
    fittsMeanMT: obs.fittsMeanMT,
    hickDecisionRT: obs.hickDecisionRT,
    cogLoadIndex: obs.cogLoadIndex,
    wmCapacity: persona.wmCapacity,
    overloadEvent: obs.overloadEvent,
    layoutShiftCLS: obs.layoutShiftCLS,
    loadTimeMs: obs.loadTimeMs,
    motionViolation: obs.motionViolation,
    contrastViolations: obs.contrastViolations,
    shannonH: obs.shannonH,
    frustrationAfter: null, // filled in by runner after applyStep()
  };
}

// ─── Session aggregation ──────────────────────────────────────────────────────

/**
 * Aggregate step scores across a session into session-level stats.
 * @param {object[]} stepScores
 * @param {object}   persona
 * @returns {object} SessionResult
 */
export function aggregateSession(stepScores, persona) {
  if (!stepScores || stepScores.length === 0) return null;
  const scores = stepScores.map((s) => s.score);
  const mean   = scores.reduce((a, b) => a + b, 0) / scores.length;
  const [ciLo, ciHi] = ci95(scores);

  const criticalSteps = stepScores.filter((s) => s.score < 50);
  const worstStep = stepScores.reduce((a, b) => a.score < b.score ? a : b);
  const bestStep  = stepScores.reduce((a, b) => a.score > b.score ? a : b);

  // Most frequent deduction across steps
  const deductionCounts = {};
  for (const ss of stepScores) {
    for (const d of ss.deductions) {
      deductionCounts[d.criterion] = (deductionCounts[d.criterion] || 0) + 1;
    }
  }
  const topDeduction = Object.entries(deductionCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  return {
    persona: { id: persona.id, label: persona.label, wmCapacity: persona.wmCapacity },
    stepCount: stepScores.length,
    abandoned: persona.abandoned,
    mean: Math.round(mean * 10) / 10,
    ci95: [ciLo, ciHi],
    grade: gradeLabel(Math.round(mean)),
    criticalCount: criticalSteps.length,
    worstUrl: worstStep?.url,
    worstScore: worstStep?.score,
    bestUrl: bestStep?.url,
    bestScore: bestStep?.score,
    topDeduction,
    frustrationPeak: Math.max(...persona.frustrationHistory),
    frustrationFinal: persona.frustration,
    stepScores,
  };
}
