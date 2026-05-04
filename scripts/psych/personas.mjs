/**
 * P31 Psychological E2E Persona Layer (L1)
 * 
 * Autoethnographic grounding: Each persona is a verified facet of
 * operator W.Johnson-001's lived neurodivergent experience.
 * 
 * Schema: p31.psychPersona/2.0.0
 */

export const personas = {
  // Persona 1: W — The Operator (Base State)
  'W': {
    id: 'W',
    name: 'W (Base State)',
    description: '43M, late-diagnosed AuDHD (2025), hypoparathyroidism E20.9',
    autoethnographyVerified: true,
    source: 'operator-self-report-2025-04',
    
    // Physiological (L2)
    calcium: { normal: 7.9, range: [7.8, 8.2] },
    spoons: { min: 4, max: 12, current: 8 },
    
    // Cognitive (L3)
    cognitiveProfile: {
      workingMemory: 7, // 7±2 chunks
      attentionSpan: 180, // seconds sustained
      taskSwitchCost: 3000, // ms recovery
      literalInterpretation: false,
      hyperfocusCapacity: true
    },
    
    // Accommodations (L5)
    accommodations: ['phos-router', 'clear-labels'],
    
    // Thresholds (L6)
    thresholds: {
      abandonment: 10, // seconds to first interaction
      shutdown: 300, // seconds to task completion
      errorRate: 0.05 // 5%
    },
    
    // Browser simulation
    browserContext: {},
    
    // Triggers (for test generation)
    triggers: {
      submarineMetaphors: true,
      openEndedQuestions: true,
      nestedMenusNoExit: true
    },
    
    // Input modifiers (L4)
    inputModifiers: {
      clickDelay: 200, // ms
      coordJitter: 0, // px
      keyMistakeRate: 0.02 // 2%
    }
  },

  // Persona 2: W-CRISIS — The Calcium Crash
  'W-CRISIS': {
    id: 'W-CRISIS',
    name: 'W-CRISIS (Calcium 6.8)',
    description: 'Neurological symptoms active, brain fog, hand tremor',
    autoethnographyVerified: true,
    source: 'operator-medical-log-2026-03-15',
    
    calcium: { normal: 6.8, range: [6.5, 7.0], crisis: true },
    spoons: { min: 1, max: 3, current: 1 },
    
    cognitiveProfile: {
      workingMemory: 3,
      attentionSpan: 60,
      taskSwitchCost: 8000,
      literalInterpretation: true,
      hyperfocusCapacity: false
    },
    
    accommodations: ['safe-mode', 'reduced-motion', 'webgl-destruction', 'single-chip'],
    
    thresholds: {
      abandonment: 15,
      shutdown: 120,
      errorRate: 0.15
    },
    
    browserContext: {
      // Simulate visual field blur for brain fog
      colorScheme: 'dark'
    },
    
    physiologicalEffects: {
      brainFog: true,
      handTremor: true,
      fatigue: 0.7
    },
    
    triggers: {
      gpuDrain: 'CRITICAL', // WebGL must destroy, not hide
      animation: 'CRITICAL',
      complexNavigation: 'CRITICAL'
    },
    
    inputModifiers: {
      clickDelay: 800,
      coordJitter: 15,
      keyMistakeRate: 0.15
    }
  },

  // Persona 3: S.J. — The Child (ADHD, 8yo)
  'S.J.': {
    id: 'S.J.',
    name: 'S.J. (8yo, ADHD-C)',
    description: 'High energy, low frustration tolerance, 90s attention span',
    autoethnographyVerified: true, // Parental observation
    source: 'operator-child-observation-2025-2026',
    
    calcium: null, // Not applicable
    spoons: { min: 6, max: 10, current: 8 },
    
    cognitiveProfile: {
      workingMemory: 5,
      attentionSpan: 90,
      taskSwitchCost: 5000,
      literalInterpretation: true,
      hyperfocusCapacity: false // ADHD-C, not hyperfocus type
    },
    
    accommodations: ['large-targets', 'no-text-input', 'gamification-ethical'],
    
    thresholds: {
      abandonment: 5,
      shutdown: 60,
      errorRate: 0.08
    },
    
    browserContext: {
      viewport: { width: 1024, height: 768 }, // Child device
      touchEnabled: true
    },
    
    triggers: {
      smallTouchTargets: 'CRITICAL', // Must be 60px+
      textInputRequired: 'FAIL', // Cannot complete
      moreThan3Taps: 'WARN'
    },
    
    inputModifiers: {
      clickDelay: 150,
      coordJitter: 10,
      keyMistakeRate: 0.08
    }
  },

  // Persona 4: W.J. — The Child (Autistic, 10yo)
  'W.J.': {
    id: 'W.J.',
    name: 'W.J. (10yo, Autistic)',
    description: 'Pattern-seeker, noise-sensitive, literal interpreter',
    autoethnographyVerified: true,
    source: 'operator-child-observation-2025-2026',
    
    calcium: null,
    spoons: { min: 4, max: 8, current: 6 },
    
    cognitiveProfile: {
      workingMemory: 8, // High for patterns
      attentionSpan: 300, // Long for special interest
      taskSwitchCost: 10000, // Very high
      literalInterpretation: true,
      hyperfocusCapacity: true
    },
    
    accommodations: ['low-blue-light', 'no-flashing', 'predictable-motion', 'literal-language'],
    
    thresholds: {
      abandonment: 8,
      shutdown: 180,
      errorRate: 0.05
    },
    
    browserContext: {
      reducedMotion: 'reduce'
    },
    
    triggers: {
      sarcasm: 'FAIL', // Breaks trust
      idioms: 'CONFUSE', // "Floating neutral" without naval ref
      metaphors: 'FAIL',
      unexpectedMotion: 'CRITICAL'
    },
    
    inputModifiers: {
      clickDelay: 300,
      coordJitter: 0,
      keyMistakeRate: 0.05 // Literal errors, not random
    }
  },

  // Persona 5: BRENDA — The Co-Parent (NT, High Stress)
  'BRENDA': {
    id: 'BRENDA',
    name: 'Brenda (NT, Situational)',
    description: 'Neurotypical but sleep-deprived, custody-case stress load',
    autoethnographyVerified: true,
    source: 'operator-partner-observation',
    
    calcium: null,
    spoons: { min: 3, max: 6, current: 4 },
    
    cognitiveProfile: {
      workingMemory: 5, // Temporarily impaired
      attentionSpan: 120,
      taskSwitchCost: 4000,
      literalInterpretation: false,
      hyperfocusCapacity: false
    },
    
    accommodations: ['no-domain-knowledge-assumed', 'clear-steps'],
    
    thresholds: {
      abandonment: 8,
      shutdown: 240,
      errorRate: 0.10
    },
    
    browserContext: {},
    
    triggers: {
      jargon: 'FAIL',
      assumedKnowledge: 'FAIL',
      hiddenSteps: 'FAIL'
    },
    
    inputModifiers: {
      clickDelay: 400,
      coordJitter: 5,
      keyMistakeRate: 0.05
    }
  },

  // Persona 6: W-SHUTDOWN — The Dissociative State
  'W-SHUTDOWN': {
    id: 'W-SHUTDOWN',
    name: 'W-SHUTDOWN (CPTSD Freeze)',
    description: 'Complex PTSD freeze response, selective mutism equivalent',
    autoethnographyVerified: true,
    source: 'operator-trauma-log-2024-2025',
    
    calcium: { normal: 7.5, range: [7.5, 8.0] }, // Secondary to freeze
    spoons: { min: 0, max: 1, current: 0 },
    
    cognitiveProfile: {
      workingMemory: 2,
      attentionSpan: 30,
      taskSwitchCost: 30000, // Cannot switch
      literalInterpretation: true,
      hyperfocusCapacity: false
    },
    
    accommodations: ['safe-mode', 'single-chip-only', 'no-text-input', 'no-forms', 'now-or-never-time'],
    
    thresholds: {
      abandonment: 20,
      shutdown: 30, // Very short window
      errorRate: 0.50 // High error acceptable if accommodated
    },
    
    browserContext: {
      reducedMotion: 'reduce',
      colorScheme: 'dark'
    },
    
    triggers: {
      multiStep: 'CRITICAL', // Cannot complete
      openEnded: 'CRITICAL',
      timePressure: 'CRITICAL',
      moreThanOneOption: 'OVERWHELM'
    },
    
    inputModifiers: {
      clickDelay: 2000,
      coordJitter: 0,
      keyMistakeRate: 0.0 // Cannot type
    }
  },

  // Persona 7: W-HYPERFOCUS — The Deep Dive
  'W-HYPERFOCUS': {
    id: 'W-HYPERFOCUS',
    name: 'W-HYPERFOCUS (6hr Lock)',
    description: 'AuDHD hyperfocus, ignores bodily signals',
    autoethnographyVerified: true,
    source: 'operator-self-report-2024-present',
    
    calcium: { normal: 7.8, range: [7.5, 8.0] }, // May crash during focus
    spoons: { min: 8, max: 12, current: 12 }, // Infinite while focused
    
    cognitiveProfile: {
      workingMemory: 10, // Exceptional in-focus
      attentionSpan: 21600, // 6 hours
      taskSwitchCost: 60000, // Cannot be interrupted
      literalInterpretation: false,
      hyperfocusCapacity: true
    },
    
    accommodations: ['break-reminders', 'gentle-interrupt', 'session-restore'],
    
    thresholds: {
      abandonment: 300, // Long to start, then infinite
      shutdown: 21600, // 6 hours
      errorRate: 0.00 // Near-perfect while focused
    },
    
    browserContext: {},
    
    triggers: {
      forcedLogout: 'CRITICAL', // Violates autonomy
      modalInterrupt: 'CRITICAL',
      lostWork: 'TRAUMA'
    },
    
    inputModifiers: {
      clickDelay: 50,
      coordJitter: 0,
      keyMistakeRate: 0.00
    }
  }
};

/**
 * Get current state for a persona (simulates variation)
 */
export function getPersonaState(personaId) {
  const persona = personas[personaId];
  if (!persona) return null;

  // Simulate variation within ranges
  const calcium = persona.calcium 
    ? persona.calcium.normal + (Math.random() - 0.5) * 0.4
    : null;
  
  const spoons = Math.floor(
    persona.spoons.min + Math.random() * (persona.spoons.max - persona.spoons.min)
  );

  const cognitiveLoad = persona.cognitiveProfile.workingMemory < 5 
    ? 2.0 + Math.random() 
    : 1.0 + (Math.random() * 0.5);

  return {
    calcium: calcium ? parseFloat(calcium.toFixed(1)) : null,
    spoons,
    cognitiveLoad: parseFloat(cognitiveLoad.toFixed(2)),
    timestamp: new Date().toISOString()
  };
}

/**
 * Get all persona IDs
 */
export function getAllPersonaIds() {
  return Object.keys(personas);
}

/**
 * Verify autoethnographic grounding
 */
export function verifyAutoethnography() {
  const verification = {};
  for (const [id, persona] of Object.entries(personas)) {
    verification[id] = {
      name: persona.name,
      verified: persona.autoethnographyVerified,
      source: persona.source,
      clinicalPrecision: persona.calcium !== null || persona.id.includes('W')
    };
  }
  return verification;
}
