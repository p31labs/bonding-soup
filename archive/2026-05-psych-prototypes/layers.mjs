/**
 * P31 Psychological E2E 7-Layer Architecture (L1-L7)
 * 
 * L1: Persona Layer (handled in personas.mjs)
 * L2: Physiological Layer
 * L3: Cognitive Layer
 * L4: Interface Layer
 * L5: Accommodation Layer
 * L6: Measurement Layer
 * L7: Reporting Layer
 * 
 * Schema: p31.psychLayers/2.0.0
 */

import { getPersonaState } from './personas.mjs';

export class SevenLayerStack {
  constructor() {
    this.layers = {
      l2: new PhysiologicalLayer(),
      l3: new CognitiveLayer(),
      l4: new InterfaceLayer(),
      l5: new AccommodationLayer(),
      l6: new MeasurementLayer(),
      l7: new ReportingLayer()
    };
  }

  async execute(persona, surface, testCase) {
    // L2: Apply physiological state
    const physioState = await this.layers.l2.simulate(persona);
    
    // L3: Apply cognitive load
    const cognitiveState = await this.layers.l3.simulate(persona, physioState);
    
    // L4: Execute interface interactions
    const interactionResult = await this.layers.l4.execute(persona, surface, testCase);
    
    // L5: Verify accommodations
    const accommodations = await this.layers.l5.verify(persona, interactionResult);
    
    // L6: Collect measurements
    const metrics = await this.layers.l6.collect(persona, interactionResult);
    
    // L7: Generate report
    const report = await this.layers.l7.generate(persona, surface, metrics, accommodations);
    
    return {
      l2: physioState,
      l3: cognitiveState,
      l4: interactionResult,
      l5: accommodations,
      l6: metrics,
      l7: report
    };
  }
}

/**
 * L2: Physiological Layer
 * Simulates hypoparathyroidism and related physiological states
 */
class PhysiologicalLayer {
  async simulate(persona) {
    const state = getPersonaState(persona.id);
    
    return {
      calcium: state.calcium,
      spoons: state.spoons,
      fatigue: this.calculateFatigue(state),
      tremor: this.calculateTremor(state),
      brainFog: this.calculateBrainFog(state),
      
      // Visual simulation parameters
      visualEffects: this.getVisualEffects(state, persona),
      
      // Motor simulation parameters
      motorEffects: this.getMotorEffects(state, persona)
    };
  }

  calculateFatigue(state) {
    const baseFatigue = 1.0 - (state.spoons / 12); // 0-1 scale
    const calciumFatigue = state.calcium && state.calcium < 8.0 
      ? (8.0 - state.calcium) * 0.1 
      : 0;
    return Math.min(1.0, baseFatigue + calciumFatigue);
  }

  calculateTremor(state) {
    if (!state.calcium) return 0;
    return state.calcium < 7.0 ? 15 : state.calcium < 8.0 ? 5 : 0;
  }

  calculateBrainFog(state) {
    if (!state.calcium) return state.cognitiveLoad > 1.5 ? 0.5 : 0;
    return state.calcium < 7.0 ? 0.8 : state.calcium < 8.0 ? 0.3 : 0;
  }

  getVisualEffects(state, persona) {
    const effects = [];
    
    if (state.calcium && state.calcium < 7.5) {
      effects.push({ type: 'blur', amount: '2px' });
    }
    
    if (persona.accommodations.includes('low-blue-light')) {
      effects.push({ type: 'color-adjust', filter: 'sepia(0.3)' });
    }
    
    return effects;
  }

  getMotorEffects(state, persona) {
    return {
      tremorAmplitude: this.calculateTremor(state),
      reactionDelay: persona.inputModifiers.clickDelay,
      precision: 1.0 - (this.calculateFatigue(state) * 0.3)
    };
  }
}

/**
 * L3: Cognitive Layer
 * Simulates executive function, working memory, attention
 */
class CognitiveLayer {
  async simulate(persona, physioState) {
    const profile = persona.cognitiveProfile;
    
    // Working memory capacity affected by physiology
    const effectiveWM = Math.floor(
      profile.workingMemory * (1 - physioState.brainFog * 0.5)
    );
    
    // Attention span affected by fatigue
    const effectiveAttention = Math.floor(
      profile.attentionSpan * (1 - physioState.fatigue * 0.6)
    );
    
    // Task switching cost multiplier
    const switchCost = profile.taskSwitchCost * (1 + physioState.fatigue);
    
    return {
      workingMemory: effectiveWM,
      attentionSpan: effectiveAttention,
      taskSwitchCost: switchCost,
      literalInterpretation: profile.literalInterpretation,
      hyperfocusActive: this.detectHyperfocus(persona, physioState),
      decisionParalysisThreshold: effectiveWM + 2 // Miller's Law threshold
    };
  }

  detectHyperfocus(persona, physioState) {
    return persona.id === 'W-HYPERFOCUS' && physioState.spoons > 8;
  }
}

/**
 * L4: Interface Layer
 * Executes real Playwright interactions with persona adaptations
 */
class InterfaceLayer {
  async execute(persona, surface, testCase) {
    // This is handled in the main runner; this layer provides modifiers
    return {
      personaId: persona.id,
      surface,
      testCase: testCase?.name || 'default',
      modifiers: persona.inputModifiers,
      expectedPath: this.predictPath(persona, surface)
    };
  }

  predictPath(persona, surface) {
    // Predict likely interaction path based on persona
    const paths = {
      '/geodesic.html': {
        'W-CRISIS': ['load', 'phos-suggest-safe-mode', 'engage-safe-mode', 'verify-webgl-destroyed'],
        'W': ['load', 'interact-3d', 'add-shape', 'maxwell-check']
      },
      '/passport.html': {
        'S.J.': ['load', 'slider-move', 'save', 'done'],
        'W-HYPERFOCUS': ['load', 'deep-config', '45min-pass', 'break-prompt']
      }
    };
    
    return paths[surface]?.[persona.id] || ['load', 'interact', 'complete'];
  }
}

/**
 * L5: Accommodation Layer
 * Verifies system adaptations are active
 */
class AccommodationLayer {
  async verify(persona, interactionResult) {
    const accommodations = [];
    const required = persona.accommodations || [];
    
    // Check each required accommodation
    for (const acc of required) {
      const status = await this.checkAccommodation(acc, interactionResult);
      accommodations.push({
        type: acc,
        required: true,
        active: status.active,
        effective: status.effective,
        violations: status.violations || []
      });
    }
    
    // Auto-detect additional accommodations
    if (persona.id === 'W-CRISIS' && interactionResult.webglActive) {
      accommodations.push({
        type: 'webgl-destruction',
        required: true,
        active: false,
        effective: false,
        violations: ['P0: WebGL context alive during crisis state']
      });
    }
    
    return accommodations;
  }

  async checkAccommodation(type, interactionResult) {
    const checks = {
      'safe-mode': {
        active: interactionResult.safeModeEnabled || false,
        effective: interactionResult.safeModeEnabled && !interactionResult.animationsRunning
      },
      'reduced-motion': {
        active: interactionResult.reducedMotionQuery || false,
        effective: !interactionResult.motionDetected
      },
      'webgl-destruction': {
        active: !interactionResult.webglActive,
        effective: !interactionResult.webglActive && interactionResult.gpuIdle
      },
      'single-chip': {
        active: interactionResult.phosChipCount === 1,
        effective: interactionResult.phosChipCount === 1
      },
      'large-targets': {
        active: interactionResult.minTargetSize >= 60,
        effective: interactionResult.minTargetSize >= 60
      }
    };
    
    return checks[type] || { active: false, effective: false };
  }
}

/**
 * L6: Measurement Layer
 * Collects accessibility and cognitive metrics
 */
class MeasurementLayer {
  async collect(persona, interactionResult) {
    const raw = interactionResult.metrics || {};
    
    // Calculate cognitive proxy metrics
    const confusionScore = this.calculateConfusion(raw);
    const frustrationScore = this.calculateFrustration(raw);
    
    return {
      // Primary metrics
      timeToFirstInteraction: raw.timeToFirstInteraction,
      timeToCompletion: raw.timeToCompletion,
      errorRate: raw.errorRate || 0,
      backtrackCount: raw.backtrackCount || 0,
      
      // Cognitive proxies
      pauseFrequency: raw.pauses?.length || 0,
      avgPauseDuration: this.average(raw.pauses),
      rageClickCount: raw.rageClicks || 0,
      confusionScore,
      frustrationScore,
      
      // Shannon entropy reduction (if PHOS used)
      phosQuestionsUsed: raw.phosQuestions,
      initialIntentCount: raw.initialOptions,
      finalIntentCount: raw.finalOptions,
      entropyReduction: this.calculateEntropyReduction(raw),
      
      // Compliance
      wcag21aa: raw.wcagViolations?.length === 0,
      cognitiveAccessibility: confusionScore < 0.5 && frustrationScore < 0.3
    };
  }

  calculateConfusion(raw) {
    const pauseWeight = Math.min(1.0, (raw.pauses?.length || 0) * 0.2);
    const scrollWeight = raw.fullPageScrolls ? 0.3 : 0;
    return Math.min(1.0, pauseWeight + scrollWeight);
  }

  calculateFrustration(raw) {
    const rageWeight = Math.min(1.0, (raw.rageClicks || 0) * 0.3);
    const errorWeight = Math.min(0.5, (raw.errorRate || 0));
    return Math.min(1.0, rageWeight + errorWeight);
  }

  calculateEntropyReduction(raw) {
    if (!raw.initialOptions || !raw.finalOptions) return null;
    const initialBits = Math.log2(raw.initialOptions);
    const finalBits = Math.log2(raw.finalOptions);
    return {
      initialBits,
      finalBits,
      bitsReduced: initialBits - finalBits,
      questionsUsed: raw.phosQuestions || 0
    };
  }

  average(arr) {
    if (!arr || arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }
}

/**
 * L7: Reporting Layer
 * Drift detection and operator alerts
 */
class ReportingLayer {
  async generate(persona, surface, metrics, accommodations) {
    const result = this.determineResult(metrics, persona);
    const violations = this.detectViolations(metrics, persona, accommodations);
    const alert = this.generateAlert(metrics, persona, violations);
    
    return {
      schema: 'p31.psychE2eResult/2.0.0',
      timestamp: new Date().toISOString(),
      persona: persona.id,
      surface,
      result,
      metrics,
      accommodations: accommodations.map(a => ({
        type: a.type,
        active: a.active,
        effective: a.effective
      })),
      violations,
      operatorAlert: alert,
      driftDetected: violations.length > 0,
      canonicalUpdateRequired: violations.some(v => v.severity === 'P0' || v.severity === 'P1')
    };
  }

  determineResult(metrics, persona) {
    const t = persona.thresholds;
    
    if (metrics.timeToFirstInteraction > t.abandonment) return 'FAIL';
    if (metrics.timeToCompletion > t.shutdown) return 'FAIL';
    if (metrics.errorRate > 0.2) return 'FAIL';
    if (metrics.rageClickCount > 2) return 'WARN';
    if (metrics.confusionScore > 0.7) return 'WARN';
    
    return 'PASS';
  }

  detectViolations(metrics, persona, accommodations) {
    const violations = [];
    
    // P0: Medical/crisis level
    if (persona.id === 'W-CRISIS') {
      const webglAcc = accommodations.find(a => a.type === 'webgl-destruction');
      if (!webglAcc?.effective) {
        violations.push({
          severity: 'P0',
          code: 'WEBGL-CRISIS',
          message: 'WebGL context not destroyed in safe mode - GPU drain during calcium crisis',
          autoethnography: 'Operator experienced GPU fan noise triggering panic during 2025 crash'
        });
      }
    }
    
    // P1: Cognitive shutdown risk
    if (metrics.timeToCompletion > 300) {
      violations.push({
        severity: 'P1',
        code: 'SHUTDOWN-RISK',
        message: 'Task completion >5 minutes - dissociation risk for CPTSD profile'
      });
    }
    
    if (metrics.errorRate > 0.2) {
      violations.push({
        severity: 'P1',
        code: 'INTERFACE-FAILURE',
        message: 'Error rate >20% - interface not accessible to this cognitive profile'
      });
    }
    
    // P2: Access barriers
    if (persona.id === 'S.J.' && metrics.minTargetSize < 60) {
      violations.push({
        severity: 'P2',
        code: 'TOO-SMALL',
        message: 'Touch target <60px - child motor control accommodation failed'
      });
    }
    
    // P3: Friction
    if (metrics.confusionScore > 0.5) {
      violations.push({
        severity: 'P3',
        code: 'COGNITIVE-FRICTION',
        message: 'Multiple confusion pauses detected - UX refinement recommended'
      });
    }
    
    return violations;
  }

  generateAlert(metrics, persona, violations) {
    const p0 = violations.find(v => v.severity === 'P0');
    if (p0) return `P0: ${p0.message}`;
    
    const p1 = violations.find(v => v.severity === 'P1');
    if (p1) return `P1: ${p1.message}`;
    
    if (persona.id === 'W-HYPERFOCUS' && metrics.timeToCompletion > 2700) {
      return 'P2: Hyperfocus session >45min without break prompt';
    }
    
    return null;
  }
}
