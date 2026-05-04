/**
 * P31 Psychological E2E — Observer  (Layer 4)
 * Playwright DOM measurements → StepObservation.
 * All measurements map directly to science-core formulas.
 */
import {
  fittsMT,
  hickRT,
  intrinsicLoad,
  extraneousLoad,
  germaneLoad,
  cognitiveLoadIndex,
  shannonNorm,
  targetSizePass,
} from "./science-core.mjs";

// ─── DOM measurement script (injected into browser context) ───────────────────

const MEASURE_DOM = /* js */ `
(function () {
  const body = document.body;
  if (!body) return {};

  // 1. Interactive elements
  const interactiveAll = Array.from(
    body.querySelectorAll('a, button, input, select, textarea, [role="button"], [role="link"], [tabindex]')
  ).filter((el) => {
    const s = window.getComputedStyle(el);
    return s.display !== "none" && s.visibility !== "hidden" && el.offsetParent !== null;
  });
  const interactiveCount = interactiveAll.length;

  // 2. Target sizes for Fitts + WCAG 2.5.8
  const rects = interactiveAll.map((el) => {
    const r = el.getBoundingClientRect();
    return { w: r.width, h: r.height, x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });

  // Mean target width and worst-case Fitts MT (using sequential element distances)
  let totalW = 0, totalD = 0, pairCount = 0, smallTargets = 0;
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    totalW += r.w;
    if (r.w < 24 || r.h < 24) smallTargets++;
    if (i > 0) {
      const prev = rects[i - 1];
      const d = Math.sqrt((r.x - prev.x) ** 2 + (r.y - prev.y) ** 2);
      totalD += d;
      pairCount++;
    }
  }
  const meanW = rects.length ? totalW / rects.length : 40;
  const meanD = pairCount   ? totalD / pairCount     : 200;

  // 3. Nav choice count (Hick's Law) — largest visible nav/menu
  const navEls = [
    ...Array.from(document.querySelectorAll('nav')),
    ...Array.from(document.querySelectorAll('[role="navigation"]')),
    ...Array.from(document.querySelectorAll('[role="menu"]')),
  ];
  let navChoiceCount = 0;
  for (const nav of navEls) {
    const items = nav.querySelectorAll('a, button, [role="menuitem"]');
    if (items.length > navChoiceCount) navChoiceCount = items.length;
  }
  if (navChoiceCount === 0) navChoiceCount = Math.min(8, interactiveCount);

  // 4. Animation count
  const animations = document.getAnimations ? document.getAnimations().length : 0;

  // 5. Heading count + hierarchy
  const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  const headingCount = headings.length;
  let headingHierarchyOK = true;
  const levels = headings.map((h) => parseInt(h.tagName[1]));
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] - levels[i - 1] > 1) { headingHierarchyOK = false; break; }
  }

  // 6. ARIA label coverage
  const ariaLabeled = interactiveAll.filter(
    (el) => el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || el.title || el.textContent.trim()
  ).length;
  const ariaLabelCoverage = interactiveCount ? ariaLabeled / interactiveCount : 1;

  // 7. Skip link
  const skipLinkPresent = !!document.querySelector('a[href="#main"], a[href="#content"], .p31-doc-skip');

  // 8. Smallest readable font size
  const textEls = Array.from(body.querySelectorAll('p, li, span, td, div')).filter(
    (el) => el.children.length === 0 && el.textContent.trim().length > 5
  ).slice(0, 40);
  let smallestFontPx = 999;
  for (const el of textEls) {
    const fs = parseFloat(window.getComputedStyle(el).fontSize) || 16;
    if (fs < smallestFontPx) smallestFontPx = fs;
  }
  if (smallestFontPx === 999) smallestFontPx = 16;

  // 9. Reduced-motion — check if any CSS animation ignores prefers-reduced-motion
  //    [Opus2026 correction]: Safe-mode aware detection
  const motionViolation = (() => {
    if (!document.getAnimations) return false;
    const total = document.getAnimations().length;
    const safeMode = document.body.classList.contains('safe-mode');
    // If safe mode is engaged and animations remain, it is a hard violation
    if (safeMode && total > 0) return true;
    // Without safe mode, conservative heuristic: >3 animations is suspicious
    return total > 3;
  })();

  // 10. Text token entropy (Shannon)
  const rawText = (body.innerText || "").replace(/\\s+/g, " ").slice(0, 3000);
  const tokens = rawText.toLowerCase().match(/\\b[a-z]{3,}\\b/g) || [];

  // 11. Colour pairs for contrast — sample main text vs background
  //     We test up to 8 random text elements; any fail counts as a violation.
  let contrastViolations = 0;
  const sampleEls = textEls.slice(0, 8);
  for (const el of sampleEls) {
    const cs = window.getComputedStyle(el);
    const fg = cs.color;
    const bg = cs.backgroundColor;
    if (fg && bg && fg !== "rgba(0, 0, 0, 0)" && bg !== "rgba(0, 0, 0, 0)") {
      // Parse rgb(r,g,b) — [Opus2026 correction]: handles Chrome's spaced output
      const parseRgb = (s) => { const m = s.match(/rgb[a]?\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)/i); return m ? [+m[1],+m[2],+m[3]] : null; };
      const fgRgb = parseRgb(fg);  // no .replace needed with improved regex
      const bgRgb = parseRgb(bg);
      if (fgRgb && bgRgb) {
        const lin = (c) => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
        const lum = ([r,g,b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
        const L1 = lum(fgRgb), L2 = lum(bgRgb);
        const ratio = (Math.max(L1,L2) + 0.05) / (Math.min(L1,L2) + 0.05);
        const fontSize = parseFloat(window.getComputedStyle(el).fontSize) || 16;
        const threshold = fontSize >= 18 ? 3.0 : 4.5;
        if (ratio < threshold) contrastViolations++;
      }
    }
  }

  return {
    interactiveCount,
    meanTargetW: meanW,
    meanTargetD: meanD,
    targetSizeViolations: smallTargets,
    navChoiceCount,
    animationCount: animations,
    headingCount,
    headingHierarchyOK,
    ariaLabelCoverage: Math.round(ariaLabelCoverage * 100) / 100,
    skipLinkPresent,
    smallestFontPx: Math.round(smallestFontPx),
    motionViolation,
    tokens,
    contrastViolations,
  };
})();
`;

// ─── CLS measurement (async, post-navigation) ─────────────────────────────────

const MEASURE_CLS = /* js */ `
new Promise((resolve) => {
  let cls = 0;
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) cls += entry.value;
      }
    });
    observer.observe({ type: "layout-shift", buffered: true });
    setTimeout(() => { observer.disconnect(); resolve(cls); }, 250);
  } catch (e) {
    resolve(0);
  }
});
`;

// ─── Main measure function ─────────────────────────────────────────────────────

/**
 * Navigate to `url` on `page` and collect all science-relevant metrics.
 * @param {import('playwright').Page} page
 * @param {string} url         absolute URL e.g. http://127.0.0.1:8080/soup.html
 * @param {object} persona     PersonaRecord
 * @returns {Promise<object>}  StepObservation
 */
export async function measure(page, url, persona) {
  const t0 = Date.now();

  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 15_000,
  }).catch(() => {});

  const loadTimeMs = Date.now() - t0;

  // Wait briefly for any async rendering
  await page.waitForTimeout(200);

  // DOM measurements — pass script string directly to browser context
  let dom = {};
  try {
    dom = await page.evaluate(MEASURE_DOM) ?? {};
  } catch (_) {}

  // CLS (layout shift) — async observer
  let layoutShiftCLS = 0;
  try {
    layoutShiftCLS = await page.evaluate(MEASURE_CLS) ?? 0;
  } catch (_) {}

  layoutShiftCLS = Math.round((layoutShiftCLS || 0) * 1000) / 1000;

  // ── Science formula results ──────────────────────────────────────────────────

  const meanW = dom.meanTargetW || 40;
  const meanD = dom.meanTargetD || 200;
  const motorMult = persona.motorMultiplier ?? 1.0;

  // Fitts' mean MT with persona motor multiplier
  const fittsMeanMT = fittsMT(meanD, meanW) * motorMult;

  // Hick RT at largest nav choice point
  const hickDecisionRT = hickRT(dom.navChoiceCount || 4);

  // Cognitive load components  [Sweller1988]
  const IL = intrinsicLoad(dom.headingCount || 0, dom.interactiveCount || 0);
  const EL = extraneousLoad(dom.animationCount || 0, layoutShiftCLS, dom.contrastViolations || 0);
  const GL = germaneLoad(dom.ariaLabelCoverage ?? 1, dom.headingHierarchyOK ?? true);
  const cogLoadIndex = cognitiveLoadIndex(IL, EL, GL);

  // Shannon entropy of page text
  const shannonH = shannonNorm(dom.tokens || []);

  // Overload event: CLI > WM capacity  [Miller1956 + Sweller1988]
  const overloadEvent = cogLoadIndex > persona.wmCapacity;

  // ARIA quality score  (0 = none, 1 = all labelled)
  const ariaOK = (dom.ariaLabelCoverage ?? 1) >= 0.80;

  return {
    url,
    ts: new Date().toISOString(),
    loadTimeMs,
    animationCount: dom.animationCount || 0,
    layoutShiftCLS,
    interactiveCount: dom.interactiveCount || 0,
    navChoiceCount: dom.navChoiceCount || 0,
    smallestFontPx: dom.smallestFontPx || 16,
    ariaLabelCoverage: dom.ariaLabelCoverage ?? 1,
    ariaOK,
    skipLinkPresent: dom.skipLinkPresent ?? false,
    headingCount: dom.headingCount || 0,
    headingHierarchyOK: dom.headingHierarchyOK ?? true,
    contrastViolations: dom.contrastViolations || 0,
    targetSizeViolations: dom.targetSizeViolations || 0,
    motionViolation: dom.motionViolation ?? false,
    shannonH,
    // Derived formula outputs
    fittsMeanMT: Math.round(fittsMeanMT),
    hickDecisionRT: Math.round(hickDecisionRT),
    cogLoadIndex: Math.round(cogLoadIndex * 100) / 100,
    IL: Math.round(IL * 100) / 100,
    EL: Math.round(EL * 100) / 100,
    GL: Math.round(GL * 100) / 100,
    overloadEvent,
  };
}
