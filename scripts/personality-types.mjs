/**
 * Personality Types for LLM Users
 * Defines the spectrum of human personalities that interact with LLM-based systems
 */

export const PERSONALITY_TYPES = {
  POWER_USER: {
    name: "Power User",
    description: "Developer/researcher who uses LLMs intensively for work",
    traits: ["impatient", "keyboard-heavy", "feature-focused", "efficiency-driven"],
    criteria: {
      maxWaitTime: 2000, // ms
      maxClicks: 3,
      keyboardNavRequired: true,
      skipLinksRequired: true,
      searchShortcuts: true,
      noAnimationTolerance: true,
    },
    navigationPattern: "linear-fast",
    frustrationTriggers: ["slow-load", "excessive-clicks", "no-keyboard-shortcuts", "verbose-ui"],
    successFactors: ["quick-access", "keyboard-shortcuts", "minimal-ui", "fast-search"],
  },

  NEURODIVERGENT_ADHD: {
    name: "ADHD User",
    description: "User with ADHD - needs focus, minimal distractions",
    traits: ["distractible", "impulsive", "seeks-novelty", "time-blind"],
    criteria: {
      maxAnimations: 5,
      maxColors: 4,
      reducedMotionRequired: true,
      clearFocusIndicators: true,
      minimalFlash: true,
      oneTaskAtATime: true,
    },
    navigationPattern: "scattered-jumps",
    frustrationTriggers: ["flashing-content", "autoplay", "too-many-options", "slow-feedback"],
    successFactors: ["clear-sections", "progress-indicators", "reduced-motion", "focus-mode"],
  },

  NEURODIVERGENT_AUTISM: {
    name: "Autistic User",
    description: "User on the autism spectrum - needs predictability and consistency",
    traits: ["pattern-seeking", "detail-oriented", "routine-dependent", "sensory-sensitive"],
    criteria: {
      predictableLayout: true,
      consistentPatterns: true,
      ariaLabelsRequired: true,
      noSurpriseChanges: true,
      textAlternatives: true,
      logicalTabOrder: true,
    },
    navigationPattern: "systematic-explore",
    frustrationTriggers: ["layout-shifts", "unexpected-changes", "vague-labels", "inconsistent-ui"],
    successFactors: ["predictable-nav", "clear-labels", "consistent-design", "detailed-docs"],
  },

  ELDERLY: {
    name: "Elderly User",
    description: "Older adult with potential vision/motor limitations",
    traits: ["cautious", "text-focused", "needs-larger-text", "slower-interaction"],
    criteria: {
      minFontSize: 16,
      highContrastRequired: true,
      largeClickTargets: true,
      simpleLanguage: true,
      visibleFocusRing: true,
      noTimeouts: true,
    },
    navigationPattern: "slow-methodical",
    frustrationTriggers: ["small-text", "low-contrast", "tiny-buttons", "timed-actions"],
    successFactors: ["large-text", "clear-buttons", "simple-nav", "patient-ui"],
  },

  CHILD: {
    name: "Child User",
    description: "Young user (6-12) exploring with guardian guidance",
    traits: ["playful", "visual-learner", "short-attention", "needs-guidance"],
    criteria: {
      simpleLanguage: true,
      largeVisuals: true,
      clearInstructions: true,
      parentalControls: true,
      funElements: true,
      errorForgiving: true,
    },
    navigationPattern: "playful-explore",
    frustrationTriggers: ["complex-text", "boring-ui", "hard-errors", "no-feedback"],
    successFactors: ["colorful-ui", "simple-words", "visual-cues", "gentle-guidance"],
  },

  ACCESSIBILITY_DEPENDENT: {
    name: "Screen Reader User",
    description: "User who depends entirely on screen readers for navigation",
    traits: ["voice-driven", "linear-nav", "skip-links-needed", "aria-dependent"],
    criteria: {
      ariaLabelsRequired: true,
      roleAttributes: true,
      skipLinksRequired: true,
      headingStructure: true,
      landmarkRegions: true,
      noEmptyButtons: true,
    },
    navigationPattern: "linear-tab",
    frustrationTriggers: ["missing-alt", "empty-links", "no-headings", "aria-missing"],
    successFactors: ["semantic-html", "aria-complete", "skip-nav", "logical-order"],
  },

  IMPATIENT: {
    name: "Impatient User",
    description: "User who wants instant results, abandons slow experiences",
    traits: ["fast-paced", "result-driven", "zero-tolerance", "abandons-easily"],
    criteria: {
      maxWaitTime: 1500,
      instantFeedback: true,
      noLoadingStates: true,
      directActions: true,
      minimalSteps: true,
    },
    navigationPattern: "quick-scan",
    frustrationTriggers: ["slow-page", "many-steps", "loading-spinners", "confirmation-dialogs"],
    successFactors: ["instant-load", "one-click", "fast-results", "no-delays"],
  },

  METHODICAL: {
    name: "Methodical User",
    description: "Analytical user who reads everything carefully",
    traits: ["thorough", "reads-carefully", "checks-details", "slow-deliberate"],
    criteria: {
      detailedDocs: true,
      clearErrorMessages: true,
      undoPossibility: true,
      confirmationPrompts: true,
      progressIndicators: true,
    },
    navigationPattern: "read-all",
    frustrationTriggers: ["unclear-errors", "no-undo", "hidden-info", "rushed-flow"],
    successFactors: ["detailed-info", "clear-errors", "undo-buttons", "progress-bars"],
  },

  STRESSED: {
    name: "Stressed User",
    description: "User under time pressure or emotional stress",
    traits: ["hurried", "error-prone", "needs-help", "easily-confused"],
    criteria: {
      clearCTAButtons: true,
      helpAvailable: true,
      forgivingErrors: true,
      undoPossible: true,
      simpleWorkflow: true,
    },
    navigationPattern: "panic-click",
    frustrationTriggers: ["complex-forms", "hidden-help", "strict-errors", "no-undo"],
    successFactors: ["big-buttons", "help-text", "simple-flow", "gentle-errors"],
  },

  CURIOUS_EXPLORER: {
    name: "Curious Explorer",
    description: "User who explores features and discovers new things",
    traits: ["exploratory", "clicks-everything", "tries-features", "learns-by-doing"],
    criteria: {
      discoverableFeatures: true,
      tooltips: true,
      clearLabels: true,
      noBrokenLinks: true,
      consistentBehavior: true,
    },
    navigationPattern: "random-wander",
    frustrationTriggers: ["broken-links", "unclear-purpose", "hidden-features", "inconsistent-ui"],
    successFactors: ["clear-labels", "working-links", "tooltips", "predictable-ui"],
  },
};

export function getPersonalityTypes() {
  return Object.values(PERSONALITY_TYPES);
}

export function getPersonalityByName(name) {
  return PERSONALITY_TYPES[name] || null;
}
