/**
 * BONDING Particle Effects System
 * Visual effects for molecular reactions and events
 * Provides "glow" for synthesis and "shatter" for decomposition
 */

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  type: 'glow' | 'shatter' | 'spark' | 'wave';
}

export interface ParticleEffect {
  type: 'synthesis_glow' | 'decomposition_shatter' | 'acid_base_neutralize' | 'combustion_burst';
  position: { x: number; y: number };
  duration: number;
  particles: Particle[];
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private effects: ParticleEffect[] = [];
  private particleId = 0;

  /**
   * Create a synthesis glow effect (falling in love)
   */
  createSynthesisGlow(position: { x: number; y: number }) {
    const effect: ParticleEffect = {
      type: 'synthesis_glow',
      position,
      duration: 2000, // 2 seconds
      particles: []
    };

    // Create glowing particles that radiate outward
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const distance = 20 + Math.random() * 30;
      const particle: Particle = {
        id: `glow_${this.particleId++}`,
        x: position.x + Math.cos(angle) * distance,
        y: position.y + Math.sin(angle) * distance,
        vx: Math.cos(angle) * 0.5,
        vy: Math.sin(angle) * 0.5,
        life: 0,
        maxLife: 2000,
        size: 3 + Math.random() * 4,
        color: '#FFD700', // Gold
        alpha: 1.0,
        type: 'glow'
      };
      effect.particles.push(particle);
    }

    this.effects.push(effect);
    return effect;
  }

  /**
   * Create a decomposition shatter effect (grief/burnout)
   */
  createDecompositionShatter(position: { x: number; y: number }) {
    const effect: ParticleEffect = {
      type: 'decomposition_shatter',
      position,
      duration: 1500, // 1.5 seconds
      particles: []
    };

    // Create shattering particles that fly outward
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      const particle: Particle = {
        id: `shatter_${this.particleId++}`,
        x: position.x,
        y: position.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 1500,
        size: 2 + Math.random() * 3,
        color: Math.random() > 0.5 ? '#FF6B6B' : '#4A90E2', // Red or blue fragments
        alpha: 1.0,
        type: 'shatter'
      };
      effect.particles.push(particle);
    }

    this.effects.push(effect);
    return effect;
  }

  /**
   * Create combustion burst effect (anger catharsis)
   */
  createCombustionBurst(position: { x: number; y: number }) {
    const effect: ParticleEffect = {
      type: 'combustion_burst',
      position,
      duration: 1000, // 1 second
      particles: []
    };

    // Create explosive burst of sparks
    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      const particle: Particle = {
        id: `spark_${this.particleId++}`,
        x: position.x,
        y: position.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 1000,
        size: 1 + Math.random() * 2,
        color: '#FF4500', // Orange-red
        alpha: 1.0,
        type: 'spark'
      };
      effect.particles.push(particle);
    }

    this.effects.push(effect);
    return effect;
  }

  /**
   * Create acid-base neutralization wave
   */
  createNeutralizationWave(position: { x: number; y: number }) {
    const effect: ParticleEffect = {
      type: 'acid_base_neutralize',
      position,
      duration: 1800, // 1.8 seconds
      particles: []
    };

    // Create expanding wave of neutralizing particles
    for (let ring = 0; ring < 3; ring++) {
      const ringParticles = 8 + ring * 4;
      for (let i = 0; i < ringParticles; i++) {
        const angle = (i / ringParticles) * Math.PI * 2;
        const delay = ring * 200; // Staggered rings
        const particle: Particle = {
          id: `wave_${this.particleId++}`,
          x: position.x,
          y: position.y,
          vx: Math.cos(angle) * 0.8,
          vy: Math.sin(angle) * 0.8,
          life: -delay, // Negative life for delayed start
          maxLife: 1800 - delay,
          size: 2 + ring,
          color: ring === 0 ? '#FF6B6B' : ring === 1 ? '#FFD700' : '#4A90E2', // Red → Gold → Blue
          alpha: 0.8,
          type: 'wave'
        };
        effect.particles.push(particle);
      }
    }

    this.effects.push(effect);
    return effect;
  }

  /**
   * Update all particle effects
   */
  update(deltaTime: number) {
    // Update individual particles
    this.particles.forEach(particle => {
      particle.life += deltaTime;
      const lifeRatio = particle.life / particle.maxLife;

      // Update position
      particle.x += particle.vx * deltaTime * 0.1;
      particle.y += particle.vy * deltaTime * 0.1;

      // Apply physics based on type
      switch (particle.type) {
        case 'glow':
          // Gentle pulsing and slow outward drift
          particle.alpha = 1 - lifeRatio;
          particle.vx *= 0.98;
          particle.vy *= 0.98;
          break;
        case 'shatter':
          // Accelerate outward and fade
          particle.alpha = 1 - lifeRatio;
          particle.vx *= 0.95;
          particle.vy *= 0.95;
          // Add gravity
          particle.vy += 0.01;
          break;
        case 'spark':
          // Quick burst with gravity
          particle.alpha = 1 - lifeRatio * lifeRatio; // Fade faster at end
          particle.vy += 0.02; // Gravity
          break;
        case 'wave':
          // Controlled expansion
          if (particle.life > 0) {
            const expandSpeed = 1.5;
            const angle = Math.atan2(particle.vy, particle.vx);
            const distance = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
            const newDistance = distance + expandSpeed * deltaTime * 0.1;
            particle.vx = Math.cos(angle) * newDistance;
            particle.vy = Math.sin(angle) * newDistance;
            particle.alpha = 1 - lifeRatio;
          }
          break;
      }
    });

    // Remove dead particles
    this.particles = this.particles.filter(p => p.life < p.maxLife);

    // Update effects and add their particles
    this.effects.forEach(effect => {
      effect.duration -= deltaTime;
      if (effect.duration <= 0) {
        // Remove completed effect
        const index = this.effects.indexOf(effect);
        if (index > -1) {
          this.effects.splice(index, 1);
        }
      }
    });

    // Add active effect particles to main particle array
    this.effects.forEach(effect => {
      effect.particles.forEach(particle => {
        if (particle.life >= 0 && particle.life < particle.maxLife) {
          // Check if particle is already in main array
          const existingIndex = this.particles.findIndex(p => p.id === particle.id);
          if (existingIndex === -1) {
            this.particles.push(particle);
          }
        }
      });
    });
  }

  /**
   * Render all particles to canvas
   */
  render(ctx: CanvasRenderingContext2D) {
    this.particles.forEach(particle => {
      ctx.save();
      ctx.globalAlpha = particle.alpha;

      // Draw particle based on type
      switch (particle.type) {
        case 'glow':
          // Soft glowing circle
          const glowGradient = ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, particle.size * 2
          );
          glowGradient.addColorStop(0, particle.color);
          glowGradient.addColorStop(1, 'transparent');
          ctx.fillStyle = glowGradient;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'shatter':
          // Sharp fragment
          ctx.fillStyle = particle.color;
          ctx.fillRect(particle.x - particle.size/2, particle.y - particle.size/2, particle.size, particle.size);
          break;

        case 'spark':
          // Bright spark with trail
          ctx.strokeStyle = particle.color;
          ctx.lineWidth = particle.size;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(particle.x - particle.vx * 2, particle.y - particle.vy * 2);
          ctx.stroke();

          // Spark head
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'wave':
          // Expanding ring segment
          ctx.strokeStyle = particle.color;
          ctx.lineWidth = particle.size;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.stroke();
          break;
      }

      ctx.restore();
    });
  }

  /**
   * Trigger effect based on reaction type
   */
  triggerReactionEffect(reactionType: string, position: { x: number; y: number }) {
    switch (reactionType) {
      case 'synthesis':
        return this.createSynthesisGlow(position);
      case 'decomposition':
        return this.createDecompositionShatter(position);
      case 'combustion':
        return this.createCombustionBurst(position);
      case 'acid_base':
        return this.createNeutralizationWave(position);
      case 'ping':
        return this.createSynthesisGlow(position); // Subtle ping indicator
      default:
        return this.createSynthesisGlow(position); // Default to glow
    }
  }

  /**
   * Get current particle count
   */
  getParticleCount(): number {
    return this.particles.length;
  }

  /**
   * Get active effects count
   */
  getActiveEffectsCount(): number {
    return this.effects.length;
  }

  /**
   * Clear all particles and effects
   */
  clear() {
    this.particles = [];
    this.effects = [];
  }
}

// Export singleton instance
export const particleSystem = new ParticleSystem();