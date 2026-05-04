/**
 * P31 Psychological E2E — Persona Engine  (Layer 2)
 * OCEAN personality sampling, ND overlays, and Bayesian frustration state machine.
 *
 * Personality model: Big Five (Costa & McCrae 1992) — O/C/E/A/N on [0,1]
 * ND base rates from population literature (Polanczyk 2015; CDC 2023; Aron 1997)
 */
import { millerCapacity, bayesUpdate } from "./science-core.mjs";
import crypto from "node:crypto";

// ─── Gaussian sampling ─────────────────────────────────────────────────────────

/** Box-Muller transform → approximately N(mean, sigma), clamped to [min, max]. */
function gauss(mean, sigma, min = 0, max = 1) {
  // Box-Muller transform (Box & Muller 1958)
  const u1 = Math.max(1e-10, Math.random());
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.min(max, Math.max(min, mean + sigma * z));
}

// ─── OCEAN generation ──────────────────────────────────────────────────────────

// Population norms: mean 0.50, σ 0.20 (proxy for general adult population)
const OCEAN_SIGMA = 0.20;

export function generateOCEAN() {
  return {
    O: gauss(0.50, OCEAN_SIGMA), // Openness to Experience
    C: gauss(0.50, OCEAN_SIGMA), // Conscientiousness
    E: gauss(0.50, OCEAN_SIGMA), // Extraversion
    A: gauss(0.50, OCEAN_SIGMA), // Agreeableness
    N: gauss(0.50, OCEAN_SIGMA), // Neuroticism
  };
}

// ─── Neurodivergent profile ────────────────────────────────────────────────────

// Base rate estimates (approximate population prevalences):
//   ADHD:     5–7%   (Polanczyk et al. 2015, JCPP 56(1))
//   ASD:      ~2%    (CDC Autism Data, 2023)
//   Dyslexia: 10–15% (Shaywitz 2003)
//   DCD:      5–6%   (Blank et al. 2019, EJPN)
//   SPS:      15–20% (Aron 1997)
const ND_BASE_RATES = {
  adhd:     0.06,
  asd:      0.02,
  dyslexia: 0.12,
  dcd:      0.06,
  sps:      0.18,
};

export function generateNDProfile() {
  return {
    adhd:     Math.random() < ND_BASE_RATES.adhd     ? gauss(0.70, 0.20, 0.30, 1.0) : 0,
    asd:      Math.random() < ND_BASE_RATES.asd      ? gauss(0.60, 0.20, 0.30, 1.0) : 0,
    dyslexia: Math.random() < ND_BASE_RATES.dyslexia ? gauss(0.50, 0.20, 0.20, 1.0) : 0,
    dcd:      Math.random() < ND_BASE_RATES.dcd      ? gauss(0.50, 0.20, 0.20, 1.0) : 0,
    sps:      Math.random() < ND_BASE_RATES.sps      ? gauss(0.60, 0.15, 0.30, 1.0) : 0,
  };
}

// ─── Device selection ─────────────────────────────────────────────────────────

const DEVICES   = ["desktop", "mobile", "tablet", "keyboard-only"];
const DEV_WGTS  = [0.55,       0.30,     0.10,     0.05];

function weightedPick(items, weights) {
  let r = Math.random(), c = 0;
  for (let i = 0; i < items.length; i++) {
    c += weights[i];
    if (r < c) return items[i];
  }
  return items[items.length - 1];
}

// ─── PersonaRecord ─────────────────────────────────────────────────────────────

/**
 * Generate a single PersonaRecord.
 * All derived values carry their formula/citation in comments.
 * @returns {import("./types.d.ts").PersonaRecord}
 */
/**
 * Generate a single PersonaRecord.
 * All derived values carry their formula/citation in comments.
 * @param {string|null} overrideId  Optional persona ID (e.g. 'W-FLARE' for testing)
 * @returns {import("./types.d.ts").PersonaRecord}
 */
export function generatePersona(overrideId = null) {
  const ocean = generateOCEAN();
  const ndProfile = generateNDProfile();
  const deviceProfile = weightedPick(DEVICES, DEV_WGTS);

  // Working memory capacity  [Miller1956 + Barkley1997]
  const wmCapacity = millerCapacity({ adhd: ndProfile.adhd });

  // Fitts' Law motor multiplier:
  //   DCD increases MT  (Smits-Engelsman et al. 2015, DMCN review)
  //   Mobile increases MT × 1.3  (touch pointing literature)
  //   Keyboard-only: Fitts MT doesn't apply (separate navigation model)
  let motorMultiplier = 1.0;
  if (ndProfile.dcd > 0) motorMultiplier += 0.8 * ndProfile.dcd;
  if (deviceProfile === "mobile") motorMultiplier *= 1.3;
  if (deviceProfile === "keyboard-only") motorMultiplier = null; // pointer model N/A

  // Frustration threshold = P(frustrated) at which user abandons
  // Base 0.75 reduced by N (Neuroticism amplifies frustration response)
  // and ADHD (lower impulse control, lower tolerance for friction)
  const frustrationThreshold = Math.max(0.35, 0.80 - 0.30 * ocean.N - 0.20 * ndProfile.adhd);

  // Colour vision: ~1.5% population (Birch 2012)
  const colorVision = Math.random() < 0.015
    ? (Math.random() < 0.5 ? "deuteranopia" : "protanopia")
    : "normal";

  // Starting frustration: Neuroticism × 0.1 (high-N starts more vigilant/tense)
  const frustration = ocean.N * 0.10;

  // Human-readable label
  const traits = [];
  if (ndProfile.adhd > 0.5)    traits.push("ADHD");
  if (ndProfile.asd > 0.5)     traits.push("ASD");
  if (ndProfile.dyslexia > 0.4) traits.push("Dyslexic");
  if (ndProfile.sps > 0.5)     traits.push("SPS");
  if (ndProfile.dcd > 0.4)     traits.push("DCD");
  if (ocean.N > 0.70)          traits.push("High-N");
  if (ocean.N < 0.30)          traits.push("Low-N");
  if (ocean.C > 0.70)          traits.push("Methodical");
  if (ocean.O > 0.70)          traits.push("Explorer");
  if (traits.length === 0)     traits.push("Neurotypical");
  const label = traits.join(" ");

  // Task preference weights (used by path-generator to select flow type):
  //   High-C → systematic (T1 docs, T4 dev)
  //   High-O → exploratory (T2 product, T5 wander)
  //   ADHD   → scattered wander with high abandon probability
  const taskWeights = {
    docs:      Math.max(0.05, ocean.C * 0.4 + (1 - ndProfile.adhd) * 0.2),
    product:   Math.max(0.05, ocean.O * 0.4 + ocean.E * 0.2),
    glassBox:  Math.max(0.05, ocean.O * 0.3 + (1 - ocean.N) * 0.2),
    devSetup:  Math.max(0.05, ocean.C * 0.3 + (1 - ocean.N) * 0.1),
    wander:    Math.max(0.10, ndProfile.adhd * 0.5 + (1 - ocean.C) * 0.3),
  };

  // PersonaRecord structure (base)
  let record = {
    id: crypto.randomUUID(),
    ocean,
    ndProfile,
    wmCapacity,
    motorMultiplier,
    colorVision,
    deviceProfile,
    frustrationThreshold,
    frustration,
    abandoned: false,
    label,
    taskWeights,
    stepsCompleted: 0,
    frustrationHistory: [frustration],
    qualityControlDegraded: false,  // Default: normal output reliability
  };

  // ─── W-FLARE persona injection [Opus2026 correction] ─────────────────────────
  // Simulates the operator's calcium flare state: producing output but quality
  // control is degraded. This tests MEDIC agent's threshold detection.
  if (overrideId === 'W-FLARE') {
    record.id = 'W-FLARE';
    record.label = 'W-FLARE (Calcium 7.2)';
    record.wmCapacity = Math.max(3, record.wmCapacity * 0.6); // 40% cognitive hit
    record.frustrationThreshold = 0.4; // Highly volatile
    record.qualityControlDegraded = true; // Output is generated, but unreliable
  }

  return record;
}

// ─── Bayesian step update ──────────────────────────────────────────────────────

// P(obs | frustrated) likelihoods — engineering estimates, calibratable against
// user research data when available. Direction informed by:
//   Load tolerance: Nah (2004), Int. J. HCI 17(2)
//   ADHD attention/motion: Martinussen et al. (2005), Loh et al. (2010) review
//   WCAG contrast + CVD: Legge & Rubin (1986) threshold studies
// These are NOT posterior-validated population values.
const LIKELIHOODS = {
  slowLoad:      0.90, // > 3s load — high frustration signal (Nah 2004, load tolerance)
  fastLoad:      0.05, // < 500ms  — reduces frustration
  overload:      0.95, // CLI > WM  — cognitive overload near-certain frustration
  clsBad:        0.80, // CLS > 0.1 — layout instability
  clsADHD:       0.92, // CLS > 0.05 for ADHD — attention capture by movement
  motionViolADHD:0.95, // Unreduced motion for ADHD — strong trigger
  contrastFail:  0.88, // WCAG contrast failure
  ariaViolCVD:   0.82, // Missing ARIA for colour-vision deficient
  skipLinkGood:  0.08, // Skip link present — reduces frustration slightly
  targetSmall:   0.75, // Target size violation — increases frustration (DCD)
};

/**
 * Apply one step's observations to the persona state (Bayesian frustration update).
 * Returns new (immutable) PersonaRecord.
 */
export function applyStep(persona, obs) {
  let p = persona.frustration;
  const { ndProfile, colorVision, wmCapacity } = persona;

  // Load time
  if (obs.loadTimeMs > 3000) {
    p = bayesUpdate(p, LIKELIHOODS.slowLoad);
  } else if (obs.loadTimeMs < 500) {
    p = bayesUpdate(p, LIKELIHOODS.fastLoad);
  }

  // Cognitive overload
  if (obs.cogLoadIndex > wmCapacity) {
    p = bayesUpdate(p, LIKELIHOODS.overload);
  }

  // CLS
  if (obs.layoutShiftCLS > 0.05 && ndProfile.adhd > 0.3) {
    p = bayesUpdate(p, LIKELIHOODS.clsADHD * ndProfile.adhd);
  } else if (obs.layoutShiftCLS > 0.1) {
    p = bayesUpdate(p, LIKELIHOODS.clsBad);
  }

  // Motion violation
  if (obs.motionViolation && ndProfile.adhd > 0.3) {
    p = bayesUpdate(p, LIKELIHOODS.motionViolADHD * ndProfile.adhd);
  }

  // Contrast failures
  if (obs.contrastViolations > 0) {
    const weight = colorVision !== "normal" ? 1.0 : 0.7;
    p = bayesUpdate(p, LIKELIHOODS.contrastFail * weight);
  }

  // ARIA gaps for CVD users
  if (colorVision !== "normal" && obs.ariaLabelCoverage < 0.7) {
    p = bayesUpdate(p, LIKELIHOODS.ariaViolCVD);
  }

  // Target size violations (DCD)
  if (obs.targetSizeViolations > 0 && ndProfile.dcd > 0.3) {
    p = bayesUpdate(p, LIKELIHOODS.targetSmall * ndProfile.dcd);
  }

  // Skip link good → slight relief
  if (obs.skipLinkPresent) {
    p = bayesUpdate(p, LIKELIHOODS.skipLinkGood);
  }

  p = Math.min(1, Math.max(0, p));
  const abandoned = p >= persona.frustrationThreshold;

  return {
    ...persona,
    frustration: p,
    stepsCompleted: persona.stepsCompleted + 1,
    frustrationHistory: [...persona.frustrationHistory, p],
    abandoned,
  };
}

/** Whether this persona has crossed their abandon threshold. */
export function isAbandoning(persona) {
  return persona.abandoned;
}

/** One-line human description for logs and Glass Box display. */
export function describePersona(persona) {
  const { ocean, ndProfile, wmCapacity, deviceProfile, colorVision } = persona;
  const parts = [persona.label];
  parts.push(`O=${ocean.O.toFixed(2)} C=${ocean.C.toFixed(2)} N=${ocean.N.toFixed(2)}`);
  parts.push(`WM=${wmCapacity.toFixed(1)}`);
  parts.push(deviceProfile);
  if (ndProfile.adhd  > 0) parts.push(`adhd=${ndProfile.adhd.toFixed(1)}`);
  if (ndProfile.asd   > 0) parts.push(`asd=${ndProfile.asd.toFixed(1)}`);
  if (ndProfile.sps   > 0) parts.push(`sps=${ndProfile.sps.toFixed(1)}`);
  if (colorVision !== "normal") parts.push(colorVision);
  return parts.join(" · ");
}
