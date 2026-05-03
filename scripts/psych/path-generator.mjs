/**
 * P31 Psychological E2E — Path Generator  (Layer 3)
 * Generates realistic navigation paths per persona using task-flow templates
 * and Markov-weighted random walks.
 *
 * Task flows represent goal-oriented user journeys grounded in information
 * architecture research (Rosenfeld & Morville 2002; Nielsen 2000).
 */

// ─── Page inventory ────────────────────────────────────────────────────────────

export const PAGES = {
  hub:     ["/soup.html"],
  doc:     ["/docs/doc-library/index.html"],
  product: [
    "/fleet-portal.html",
    "/cognitive-passport/index.html",
    "/glass-box.html",
    "/p31-cheat-sheet.html",
  ],
  tool:    [
    "/p31-personal-howto.html",
    "/p31-device-setup.html",
  ],
  demo:    ["/demos/index.html"],
};

export const ALL_PAGES = Object.values(PAGES).flat();

// ─── Task flows ────────────────────────────────────────────────────────────────

// Each flow is an ordered sequence of page paths representing a plausible
// goal-oriented navigation. Weights are used when randomising step count.

export const TASK_FLOWS = {
  // T1: "Find documentation"  — high-C, methodical
  docs: [
    "/soup.html",
    "/docs/doc-library/index.html",
    "/docs/doc-library/index.html",
  ],
  // T2: "Explore a product"  — high-O, curious
  product: [
    "/soup.html",
    "/fleet-portal.html",
    "/cognitive-passport/index.html",
    "/glass-box.html",
  ],
  // T3: "Glass Box monitoring"  — operator / developer
  glassBox: [
    "/soup.html",
    "/glass-box.html",
    "/fleet-portal.html",
  ],
  // T4: "Developer onboarding"  — high-C, technical
  devSetup: [
    "/soup.html",
    "/cognitive-passport/index.html",
    "/p31-device-setup.html",
    "/p31-personal-howto.html",
    "/fleet-portal.html",
  ],
  // T5: "Wander"  — ADHD / high-O, non-linear
  wander: ALL_PAGES,
};

// ─── Markov-weighted path generation ───────────────────────────────────────────

/**
 * Pick a random element with probability proportional to weights.
 * @param {string[]} items
 * @param {number[]} weights  must sum to > 0
 */
function weightedPick(items, weights) {
  let r = Math.random(), cumulative = 0;
  for (let i = 0; i < items.length; i++) {
    cumulative += weights[i];
    if (r < cumulative) return items[i];
  }
  return items[items.length - 1];
}

/**
 * Select the task flow for this persona.
 * Uses persona.taskWeights (set by persona-engine) to pick a flow.
 */
function selectFlow(persona) {
  const { taskWeights } = persona;
  const keys    = Object.keys(taskWeights);
  const weights = keys.map((k) => taskWeights[k]);
  const total   = weights.reduce((a, b) => a + b, 0);
  const normalised = weights.map((w) => w / total);
  const key = weightedPick(keys, normalised);
  return { flowName: key, pages: TASK_FLOWS[key] || TASK_FLOWS.wander };
}

/**
 * Determine step count for this persona + flow.
 * High-O explores more; High-N or ADHD may exit early.
 * Constrained to [2, 8].
 */
function stepCount(persona, flowPages) {
  const base = flowPages.length;
  const explorationBonus = Math.round(persona.ocean.O * 2);
  const adhdPenalty      = Math.round(persona.ndProfile.adhd * 1.5);
  const nPenalty         = Math.round(persona.ocean.N * 1);
  const raw = base + explorationBonus - adhdPenalty - nPenalty;
  return Math.max(2, Math.min(8, raw));
}

/**
 * Generate a path (array of URL strings) for the given persona.
 * @param {object} persona  PersonaRecord from persona-engine
 * @returns {{ flowName: string, path: string[] }}
 */
export function generatePath(persona) {
  const { flowName, pages } = selectFlow(persona);
  const n = stepCount(persona, pages);

  const path = [];
  let lastPage = null;

  for (let i = 0; i < n; i++) {
    if (flowName === "wander" || flowName === "product") {
      // Markov-style: each step picks from full pool, weighted away from last page
      const candidates = pages.filter((p) => p !== lastPage);
      const pool = candidates.length > 0 ? candidates : pages;
      // ADHD: uniform random; Methodical: prefer earlier in list (structured)
      let weights;
      if (persona.ndProfile.adhd > 0.5) {
        weights = pool.map(() => 1);
      } else {
        // Methodical personas weight towards the first pages in the pool
        weights = pool.map((_, idx) => Math.max(0.2, 1 - idx * 0.1 * persona.ocean.C));
      }
      const total = weights.reduce((a, b) => a + b, 0);
      const norm = weights.map((w) => w / total);
      const page = weightedPick(pool, norm);
      path.push(page);
      lastPage = page;
    } else {
      // Ordered flow: follow the task sequence, loop if needed
      const page = pages[i % pages.length];
      path.push(page);
      lastPage = page;
    }
  }

  return { flowName, path };
}
