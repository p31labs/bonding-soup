/**
 * C.A.R.S. — Personalities engine (affective layer)
 * Emotional kinematics for molecule behavior; maps 7 archetypes to movement patterns
 */

import { Atom } from './soupPhysics';

export enum PersonalityType {
  MEDIATOR = 'mediator',
  ROCK = 'rock',
  LONER = 'loner',
  FUEL = 'fuel',
  MESSENGER = 'messenger',
  BUILDER = 'builder',
  ORACLE = 'oracle'
}

export interface PersonalityConfig {
  type: PersonalityType;
  baseVelocity: number;
  interactionRadius: number;
  driftPattern: 'orbital' | 'static' | 'repulsive' | 'erratic' | 'directional' | 'attractive' | 'wandering';
  stabilityFactor: number; // 0 = highly reactive, 1 = highly stable
  seekingBehavior: boolean;
}

export interface EmotionalState {
  intensity: number; // 0-1 scale
  valence: number; // negative to positive
  arousal: number; // calm to agitated
  cognitiveLoad: number; // 0-1 scale
}

export class PersonalitiesEngine {
  private personalityConfigs: Map<PersonalityType, PersonalityConfig> = new Map();
  private atomPersonalities: Map<string, PersonalityType> = new Map();
  private emotionalStates: Map<string, EmotionalState> = new Map();

  constructor() {
    this.initializePersonalityConfigs();
  }

  /**
   * Initialize the 7 core personality archetypes
   */
  private initializePersonalityConfigs() {
    this.personalityConfigs.set(PersonalityType.MEDIATOR, {
      type: PersonalityType.MEDIATOR,
      baseVelocity: 0.3,
      interactionRadius: 180,
      driftPattern: 'orbital',
      stabilityFactor: 0.7,
      seekingBehavior: true
    });

    this.personalityConfigs.set(PersonalityType.ROCK, {
      type: PersonalityType.ROCK,
      baseVelocity: 0.05,
      interactionRadius: 45,
      driftPattern: 'static',
      stabilityFactor: 0.95,
      seekingBehavior: false
    });

    this.personalityConfigs.set(PersonalityType.LONER, {
      type: PersonalityType.LONER,
      baseVelocity: 0.8,
      interactionRadius: 90,
      driftPattern: 'repulsive',
      stabilityFactor: 0.4,
      seekingBehavior: false
    });

    this.personalityConfigs.set(PersonalityType.FUEL, {
      type: PersonalityType.FUEL,
      baseVelocity: 1.5,
      interactionRadius: 200,
      driftPattern: 'erratic',
      stabilityFactor: 0.2,
      seekingBehavior: true
    });

    this.personalityConfigs.set(PersonalityType.MESSENGER, {
      type: PersonalityType.MESSENGER,
      baseVelocity: 1.8,
      interactionRadius: 30,
      driftPattern: 'directional',
      stabilityFactor: 0.3,
      seekingBehavior: true
    });

    this.personalityConfigs.set(PersonalityType.BUILDER, {
      type: PersonalityType.BUILDER,
      baseVelocity: 0.6,
      interactionRadius: 160,
      driftPattern: 'attractive',
      stabilityFactor: 0.8,
      seekingBehavior: true
    });

    this.personalityConfigs.set(PersonalityType.ORACLE, {
      type: PersonalityType.ORACLE,
      baseVelocity: 0.1,
      interactionRadius: 350,
      driftPattern: 'wandering',
      stabilityFactor: 0.9,
      seekingBehavior: false
    });
  }

  /**
   * Assign personality to an atom
   */
  assignPersonality(atomId: string, personality: PersonalityType) {
    this.atomPersonalities.set(atomId, personality);
    // Initialize with neutral emotional state
    this.emotionalStates.set(atomId, {
      intensity: 0.5,
      valence: 0,
      arousal: 0.5,
      cognitiveLoad: 0.3
    });
  }

  /**
   * Update atom movement based on personality and emotional state
   */
  updateAtomBehavior(atom: Atom, allAtoms: Atom[], deltaTime: number) {
    const personality = this.atomPersonalities.get(atom.id);
    if (!personality) return;

    const config = this.personalityConfigs.get(personality)!;
    const emotionalState = this.emotionalStates.get(atom.id)!;

    // Base velocity modified by emotional state
    const velocityMultiplier = 1 + (emotionalState.arousal * 0.5) - (emotionalState.cognitiveLoad * 0.3);
    const currentVelocity = config.baseVelocity * velocityMultiplier;

    // Apply personality-specific drift patterns
    this.applyDriftPattern(atom, config, allAtoms, currentVelocity, deltaTime);

    // Apply emotional state influences
    this.applyEmotionalInfluences(atom, emotionalState, deltaTime);

    // Apply stability damping
    const stabilityDamping = config.stabilityFactor + (emotionalState.intensity * 0.2);
    atom.vx *= stabilityDamping;
    atom.vy *= stabilityDamping;
  }

  /**
   * Apply personality-specific drift patterns
   */
  private applyDriftPattern(
    atom: Atom,
    config: PersonalityConfig,
    allAtoms: Atom[],
    velocity: number,
    dt: number
  ) {
    switch (config.driftPattern) {
      case 'orbital':
        this.applyOrbitalDrift(atom, allAtoms, velocity, dt);
        break;
      case 'static':
        this.applyStaticDrift(atom, velocity, dt);
        break;
      case 'repulsive':
        this.applyRepulsiveDrift(atom, allAtoms, velocity, dt);
        break;
      case 'erratic':
        this.applyErraticDrift(atom, velocity, dt);
        break;
      case 'directional':
        this.applyDirectionalDrift(atom, velocity, dt);
        break;
      case 'attractive':
        this.applyAttractiveDrift(atom, allAtoms, velocity, dt);
        break;
      case 'wandering':
        this.applyWanderingDrift(atom, velocity, dt);
        break;
    }
  }

  /**
   * Mediator: Orbital drift around stable molecules
   */
  private applyOrbitalDrift(atom: Atom, allAtoms: Atom[], velocity: number, dt: number) {
    // Find nearby stable molecules (high stability factor)
    const stableAtoms = allAtoms.filter(other =>
      other.id !== atom.id &&
      this.getStabilityFactor(other) > 0.7 &&
      this.distance(atom, other) < 150
    );

    if (stableAtoms.length > 0) {
      const target = stableAtoms[0];
      const dx = target.x - atom.x;
      const dy = target.y - atom.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0) {
        // Orbital motion perpendicular to line connecting atoms
        const orbitalX = -dy / distance;
        const orbitalY = dx / distance;

        atom.vx += orbitalX * velocity * 0.5;
        atom.vy += orbitalY * velocity * 0.5;
      }
    }
  }

  /**
   * Rock: Minimal movement, acts as anchor
   */
  private applyStaticDrift(atom: Atom, velocity: number, dt: number) {
    // Only move when significantly acted upon by external forces
    // Velocity is already heavily damped by stability factor
  }

  /**
   * Loner: Actively moves away from clusters
   */
  private applyRepulsiveDrift(atom: Atom, allAtoms: Atom[], velocity: number, dt: number) {
    const nearbyAtoms = allAtoms.filter(other =>
      other.id !== atom.id &&
      this.distance(atom, other) < 120
    );

    if (nearbyAtoms.length > 2) { // In a cluster
      // Calculate center of mass of nearby atoms
      let centerX = 0, centerY = 0;
      nearbyAtoms.forEach(other => {
        centerX += other.x;
        centerY += other.y;
      });
      centerX /= nearbyAtoms.length;
      centerY /= nearbyAtoms.length;

      // Move away from center
      const dx = atom.x - centerX;
      const dy = atom.y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0) {
        atom.vx += (dx / distance) * velocity * 0.8;
        atom.vy += (dy / distance) * velocity * 0.8;
      }
    }
  }

  /**
   * Fuel: Erratic movement with Brownian motion
   */
  private applyErraticDrift(atom: Atom, velocity: number, dt: number) {
    // Add random Brownian motion
    const noiseX = (Math.random() - 0.5) * velocity * 0.6;
    const noiseY = (Math.random() - 0.5) * velocity * 0.6;

    atom.vx += noiseX;
    atom.vy += noiseY;

    // Bounce off boundaries with high energy
    if (atom.x < 50 || atom.x > 3950) atom.vx *= -1.2;
    if (atom.y < 50 || atom.y > 3950) atom.vy *= -1.2;
  }

  /**
   * Messenger: Moves in straight lines, bounces elastically
   */
  private applyDirectionalDrift(atom: Atom, velocity: number, dt: number) {
    // Maintain current direction with high momentum
    const currentSpeed = Math.sqrt(atom.vx * atom.vx + atom.vy * atom.vy);

    if (currentSpeed < velocity * 0.5) {
      // Pick a new random direction if slowed down
      const angle = Math.random() * Math.PI * 2;
      atom.vx = Math.cos(angle) * velocity;
      atom.vy = Math.sin(angle) * velocity;
    }

    // Perfect elastic collisions with boundaries
    if (atom.x < 0 || atom.x > 4000) atom.vx *= -1;
    if (atom.y < 0 || atom.y > 4000) atom.vy *= -1;
  }

  /**
   * Builder: Attracted to incomplete molecular structures
   */
  private applyAttractiveDrift(atom: Atom, allAtoms: Atom[], velocity: number, dt: number) {
    // Look for atoms with incomplete valence (simplified as low connectivity)
    const incompleteAtoms = allAtoms.filter(other =>
      other.id !== atom.id &&
      this.getConnectivity(other, allAtoms) < 2 &&
      this.distance(atom, other) < 160
    );

    if (incompleteAtoms.length > 0) {
      const target = incompleteAtoms[0];
      const dx = target.x - atom.x;
      const dy = target.y - atom.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0) {
        // Tractor beam effect
        const force = velocity * 0.4 / (distance + 1);
        atom.vx += (dx / distance) * force;
        atom.vy += (dy / distance) * force;
      }
    }
  }

  /**
   * Oracle: Slow, global wandering with damping field
   */
  private applyWanderingDrift(atom: Atom, velocity: number, dt: number) {
    // Slow, random wandering
    const noiseX = (Math.random() - 0.5) * velocity * 0.2;
    const noiseY = (Math.random() - 0.5) * velocity * 0.2;

    atom.vx += noiseX;
    atom.vy += noiseY;

    // Gentle boundary avoidance
    const margin = 200;
    if (atom.x < margin) atom.vx += velocity * 0.1;
    if (atom.x > 4000 - margin) atom.vx -= velocity * 0.1;
    if (atom.y < margin) atom.vy += velocity * 0.1;
    if (atom.y > 4000 - margin) atom.vy -= velocity * 0.1;
  }

  /**
   * Apply emotional state influences to atom behavior
   */
  private applyEmotionalInfluences(atom: Atom, emotionalState: EmotionalState, dt: number) {
    // High arousal increases velocity
    const arousalBoost = emotionalState.arousal * 0.3;
    atom.vx *= (1 + arousalBoost);
    atom.vy *= (1 + arousalBoost);

    // High cognitive load reduces stability
    const cognitiveNoise = emotionalState.cognitiveLoad * 0.2;
    atom.vx += (Math.random() - 0.5) * cognitiveNoise;
    atom.vy += (Math.random() - 0.5) * cognitiveNoise;

    // Negative valence creates erratic movement
    if (emotionalState.valence < -0.3) {
      const erraticFactor = Math.abs(emotionalState.valence) * 0.4;
      atom.vx += (Math.random() - 0.5) * erraticFactor;
      atom.vy += (Math.random() - 0.5) * erraticFactor;
    }
  }

  /**
   * Update emotional state based on environment and interactions
   */
  updateEmotionalState(atomId: string, nearbyAtoms: Atom[], zoneEffects: any) {
    const emotionalState = this.emotionalStates.get(atomId);
    if (!emotionalState) return;

    // Environmental influences
    if (zoneEffects) {
      emotionalState.arousal *= zoneEffects.arousalModifier || 1;
      emotionalState.cognitiveLoad *= zoneEffects.cognitiveModifier || 1;
      emotionalState.valence += zoneEffects.valenceShift || 0;
    }

    // Social density effects
    const density = nearbyAtoms.length;
    if (density > 5) {
      emotionalState.arousal += 0.1; // Crowding increases arousal
      emotionalState.cognitiveLoad += 0.05; // Social density increases cognitive load
    } else if (density === 0) {
      emotionalState.valence -= 0.02; // Isolation decreases valence
    }

    // Clamp values
    emotionalState.intensity = Math.max(0, Math.min(1, emotionalState.intensity));
    emotionalState.valence = Math.max(-1, Math.min(1, emotionalState.valence));
    emotionalState.arousal = Math.max(0, Math.min(1, emotionalState.arousal));
    emotionalState.cognitiveLoad = Math.max(0, Math.min(1, emotionalState.cognitiveLoad));
  }

  /**
   * Get personality config for an atom
   */
  getPersonalityConfig(atomId: string): PersonalityConfig | undefined {
    const personality = this.atomPersonalities.get(atomId);
    return personality ? this.personalityConfigs.get(personality) : undefined;
  }

  /**
   * Get emotional state for an atom
   */
  getEmotionalState(atomId: string): EmotionalState | undefined {
    return this.emotionalStates.get(atomId);
  }

  /**
   * Get stability factor for an atom (0-1 scale)
   */
  private getStabilityFactor(atom: Atom): number {
    const personality = this.atomPersonalities.get(atom.id);
    return personality ? this.personalityConfigs.get(personality)!.stabilityFactor : 0.5;
  }

  /**
   * Get connectivity of an atom (number of bonds)
   */
  private getConnectivity(atom: Atom, allAtoms: Atom[]): number {
    // Simplified connectivity based on proximity
    return allAtoms.filter(other =>
      other.id !== atom.id &&
      this.distance(atom, other) < atom.radius + other.radius + 10
    ).length;
  }

  /**
   * Calculate distance between two atoms
   */
  private distance(atom1: Atom, atom2: Atom): number {
    const dx = atom2.x - atom1.x;
    const dy = atom2.y - atom1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get interaction radius for an atom
   */
  getInteractionRadius(atomId: string): number {
    const personality = this.atomPersonalities.get(atomId);
    return personality ? this.personalityConfigs.get(personality)!.interactionRadius : 50;
  }

  /**
   * Get all atoms with a specific personality type
   */
  getAtomsByPersonality(personality: PersonalityType): string[] {
    return Array.from(this.atomPersonalities.entries())
      .filter(([_, p]) => p === personality)
      .map(([id, _]) => id);
  }
}