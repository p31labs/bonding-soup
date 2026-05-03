/**
 * P31 Psychological E2E — Science Core  (Layer 1)
 * Pure mathematical functions. Zero side effects. Zero deps. Every constant cited.
 *
 * Citations:
 *  [Fitts1954]    Fitts, P.M. (1954). The information capacity of the human motor
 *                 system in controlling the amplitude of movement. JEP 47(6), 381–391.
 *  [MacKenzie1992] MacKenzie, I.S. (1992). Fitts' law as a research and design tool
 *                 in HCI. HCI 7(1), 91–139.  (ID = log₂(D/W + 1) correction)
 *  [Hick1952]     Hick, W.E. (1952). On the rate of gain of information. QJEP 4(1).
 *  [Shannon1948]  Shannon, C.E. (1948). A mathematical theory of communication. BSTJ 27.
 *  [Miller1956]   Miller, G.A. (1956). The magical number seven, plus or minus two.
 *                 Psychological Review 63(2), 81–97.
 *  [Sweller1988]  Sweller, J. (1988). Cognitive load during problem solving: Effects on
 *                 learning. Cognitive Science 12(2), 257–285.
 *  [SvMP1998]     Sweller, J., van Merriënboer, J.J.G. & Paas, F.G.W.C. (1998). Cognitive
 *                 architecture and instructional design. Educational Psychology Review 10(3),
 *                 251–296.  (IL/EL/GL three-component model)
 *  [WCAG22]       W3C (2023). Web Content Accessibility Guidelines (WCAG) 2.2.
 *                 https://www.w3.org/TR/WCAG22/
 *  [GoogleCLS]    Google (2020). Cumulative Layout Shift. web.dev/cls.
 *  [Barkley1997]  Barkley, R.A. (1997). Behavioral inhibition, sustained attention, and
 *                 executive functions. Psychological Bulletin 121(1), 65–94.
 *                 (ADHD executive function theory; WM capacity direction confirmed by
 *                  Martinussen et al. 2005 meta-analysis, JCPP 46(4), 441–451)
 *  [Craik1982]    Craik, F.I.M. & Byrd, M. (1982). Aging and cognitive deficits.
 *                 Aging and Cognitive Processes, 191–211.
 *                 (Aging WM theory; −2 chunk offset is a modelling proxy, not a
 *                  literal claim from this paper)
 *  [Aron1997]     Aron, E.N. & Aron, A. (1997). Sensory-processing sensitivity and its
 *                 relation to introversion and emotionality. JPSP 73(2), 345–368.
 */

// ─── Fitts' Law ────────────────────────────────────────────────────────────────

/**
 * Index of Difficulty  [MacKenzie1992 correction to Fitts1954]
 * ID = log₂(D/W + 1)
 * @param {number} D  amplitude / distance to target (px)
 * @param {number} W  width of target (px)
 * @returns {number}  bits
 */
export function fittsID(D, W) {
  if (W <= 0 || D < 0) return 0;
  return Math.log2(D / W + 1);
}

/**
 * Movement Time  [Fitts1954]
 * MT = a + b × ID
 * Empirical constants from desktop pointing literature:
 *   a ≈ 200 ms  (movement initiation)
 *   b ≈ 100 ms/bit
 * @returns {number}  milliseconds
 */
export function fittsMT(D, W, a = 200, b = 100) {
  return a + b * fittsID(D, W);
}

/** @returns {'comfortable'|'slow'|'difficult'} */
export function fittsCategory(mt) {
  if (mt < 600) return "comfortable";   // < 600 ms
  if (mt < 1200) return "slow";         // 600–1200 ms
  return "difficult";                    // > 1200 ms
}

// ─── Hick's Law ────────────────────────────────────────────────────────────────

/**
 * Reaction Time for n choices  [Hick1952]
 * RT = b × log₂(n + 1)
 * b ≈ 150 ms/bit  (Hick 1952 Table 1 mean)
 * @param {number} n  number of equally probable choices
 * @returns {number}  milliseconds
 */
export function hickRT(n, b = 150) {
  if (n <= 0) return 0;
  return b * Math.log2(n + 1);
}

/** @returns {'easy'|'medium'|'hard'} */
export function hickCategory(rt) {
  if (rt < 300) return "easy";    // ≤ 2 choices
  if (rt < 600) return "medium";  // 3–8 choices
  return "hard";                   // > 8 choices
}

// ─── Shannon Entropy ───────────────────────────────────────────────────────────

/**
 * Shannon entropy  [Shannon1948]
 * H = −Σ p(x) × log₂ p(x)
 * @param {string[]} tokens
 * @returns {number}  bits
 */
export function shannonEntropy(tokens) {
  if (!tokens || tokens.length === 0) return 0;
  const freq = Object.create(null);
  for (const t of tokens) freq[t] = (freq[t] || 0) + 1;
  const N = tokens.length;
  return -Object.values(freq).reduce((sum, count) => {
    const p = count / N;
    return sum + p * Math.log2(p);
  }, 0) || 0; // coerce -0 → +0
}

/**
 * Normalized entropy H / log₂(N) → [0, 1]
 * 0 = perfectly repetitive; 1 = maximum variety (high cognitive density)
 */
export function shannonNorm(tokens) {
  if (!tokens || tokens.length <= 1) return 0;
  const H = shannonEntropy(tokens);
  return H / Math.log2(tokens.length);
}

// ─── WCAG 2.2 Contrast ─────────────────────────────────────────────────────────

/**
 * Relative luminance of sRGB hex colour  [WCAG22 G18]
 * L = 0.2126R + 0.7152G + 0.0722B  (linearized)
 * @param {string} hex  e.g. "#0f1115"
 * @returns {number}  [0, 1]
 */
export function relativeLuminance(hex) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  // IEC 61966-2-1 threshold: 0.04045 (pre-2021 WCAG errata used 0.03928; corrected here)
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * Contrast ratio between two hex colours  [WCAG22 1.4.3]
 * ratio = (L_lighter + 0.05) / (L_darker + 0.05)
 * @returns {number}  [1, 21]
 */
export function wcagContrast(hex1, hex2) {
  const L1 = relativeLuminance(hex1);
  const L2 = relativeLuminance(hex2);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * WCAG 2.2 AA/AAA contrast pass  [WCAG22 SC 1.4.3]
 * AA normal: 4.5:1  |  AA large: 3:1  |  AAA normal: 7:1  |  AAA large: 4.5:1
 */
export function wcagContrastPass(hex1, hex2, level = "AA", large = false) {
  const ratio = wcagContrast(hex1, hex2);
  const threshold = level === "AAA" ? (large ? 4.5 : 7.0) : (large ? 3.0 : 4.5);
  return ratio >= threshold;
}

// ─── Cognitive Load Theory ─────────────────────────────────────────────────────

/**
 * Cognitive Load Index  [Sweller1988]
 * CLI = IL + EL + GL  [SvMP1998 three-component model]
 * IL = Intrinsic Load   (content complexity)
 * EL = Extraneous Load  (poor design — animations, layout shift, violations)
 * GL = Germane Load     (learning investment — ARIA quality, semantic structure)
 * @returns {number}  total cognitive load (compare against Miller capacity)
 */
export function cognitiveLoadIndex(IL, EL, GL) {
  return IL + EL + GL;
}

/**
 * Intrinsic Load  — proxy from heading density + interactive element count
 * Normalised to [0, 5] chunks  (5 = maximum before design overhaul needed)
 */
export function intrinsicLoad(headingCount, interactiveCount) {
  return Math.min(5, headingCount * 0.3 + interactiveCount * 0.15);
}

/**
 * Extraneous Load  — from animation count, CLS, WCAG violations
 * Normalised to [0, 6] chunks
 */
export function extraneousLoad(animationCount, cls, wcagViolations) {
  return Math.min(6, animationCount * 0.4 + cls * 8 + wcagViolations * 0.6);
}

/**
 * Germane Load  — proxy from ARIA coverage and heading hierarchy
 * Good structure = low GL (well-scaffolded cognition), poor = high GL
 * Normalised to [0, 3] chunks
 */
export function germaneLoad(ariaLabelCoverage, hasHeadingHierarchy) {
  const ariaGap = Math.max(0, 1 - ariaLabelCoverage);
  return Math.min(3, ariaGap * 2 + (hasHeadingHierarchy ? 0 : 1));
}

// ─── Miller's Law ──────────────────────────────────────────────────────────────

/**
 * Working Memory Capacity in chunks  [Miller1956]
 * Base: 7 ± 2.  ND modifiers (direction from literature; magnitudes are modelling proxies):
 *   ADHD:    −2 chunks  [Martinussen2005 meta-analysis confirms direction; Barkley1997 theory]
 *   Elderly: −2 chunks  [Craik1982 direction; magnitude is proxy]
 * @param {{ adhd?: number, elderly?: number }} profile  values 0–1
 * @returns {number}  chunks, clamped [3, 9]
 */
export function millerCapacity(profile = {}) {
  let capacity = 7;
  if (profile.adhd)    capacity -= 2 * profile.adhd;
  if (profile.elderly) capacity -= 2 * profile.elderly;
  return Math.max(3, Math.min(9, capacity));
}

// ─── Bayesian Frustration ──────────────────────────────────────────────────────

/**
 * Single-step Bayesian update on frustration probability
 * P(F|obs) = P(obs|F)·P(F) / [P(obs|F)·P(F) + P(obs|¬F)·P(¬F)]
 *
 * @param {number} prior       P(frustrated) before this observation  [0,1]
 * @param {number} likelihood  P(observation | frustrated)  [0,1]
 * @returns {number}           updated P(frustrated)  [0,1]
 */
export function bayesUpdate(prior, likelihood) {
  const pNotF = 1 - prior;
  const pObsNotF = 1 - likelihood;
  const numerator = prior * likelihood;
  const denominator = numerator + pNotF * pObsNotF;
  if (denominator === 0) return prior;
  return numerator / denominator;
}

// ─── CLS Categories ────────────────────────────────────────────────────────────

/** [GoogleCLS 2020] */
export function clsCategory(cls) {
  if (cls < 0.1) return "good";
  if (cls < 0.25) return "needs-improvement";
  return "poor";
}

// ─── WCAG 2.5.8 Target Size ────────────────────────────────────────────────────

/**
 * Minimum target size check  [WCAG22 SC 2.5.8]
 * Minimum: 24 × 24 CSS pixels
 */
export function targetSizePass(widthPx, heightPx) {
  return widthPx >= 24 && heightPx >= 24;
}

// ─── Bootstrap 95% CI ──────────────────────────────────────────────────────────

/**
 * Parametric 95% CI from a sample of scores
 * Uses normal approximation: x̄ ± 1.96 × σ/√n
 * @param {number[]} scores
 * @returns {[number, number]}  [lo, hi]
 */
export function ci95(scores) {
  if (!scores || scores.length === 0) return [0, 100];
  const n = scores.length;
  const mean = scores.reduce((a, b) => a + b, 0) / n;
  if (n === 1) return [Math.max(0, mean - 10), Math.min(100, mean + 10)];
  const variance = scores.reduce((s, x) => s + (x - mean) ** 2, 0) / (n - 1);
  const se = Math.sqrt(variance / n);
  return [
    Math.max(0, Math.round((mean - 1.96 * se) * 10) / 10),
    Math.min(100, Math.round((mean + 1.96 * se) * 10) / 10),
  ];
}
