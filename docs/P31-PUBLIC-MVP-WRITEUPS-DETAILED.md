---

# 8. Planetary Onboarding

## 8.1 Purpose

Planetary Onboarding is a **threshold-based entry system** that guides new users through four progressive doors based on their intent and readiness. Unlike traditional funnels that push toward conversion, this system meets users where they are and only advances them when they're ready.

## 8.2 The Four Doors

```
┌─────────────────────────────────────────────────────────────────┐
│                    PLANETARY ONBOARDING                         │
│                                                                 │
│      Gray Rock void. Still K₄. Four doors. Choose.            │
│                                                                 │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌──────┐│
│  │     🚪        │ │     🚪        │ │     🚪        │ │  🚪  ││
│  │   DOOR 1      │ │   DOOR 2      │ │   DOOR 3      │ │Door 4││
│  │               │ │               │ │               │ │      ││
│  │  UNDERSTAND   │ │     USE       │ │    BUILD      │ │ KNOW ││
│  │               │ │               │ │               │ │SOMEONE│
│  │  What is P31? │ │  Try the      │ │  Make things  │ │ Join ││
│  │  Why exists?  │ │  tools        │ │  with P31     │ │ mesh  ││
│  │               │ │               │ │               │ │      ││
│  │ [Explore]     │ │ [Enter Lab]   │ │ [Developer]   │ │[Code] ││
│  └───────────────┘ └───────────────┘ └───────────────┘ └──────┘│
│                                                                 │
│  Door 4 requires room code or invite URL.                      │
│  No funnel. No pressure. Your pace.                            │
└─────────────────────────────────────────────────────────────────┘
```

## 8.3 Door Specifications

### 8.3.1 Door 1: Understand

**Target User**: Curious visitors, researchers, journalists
**Goal**: Explain P31's mission without demanding action
**Content**:
- Mission statement
- Founding story (W.J.'s diagnosis → creation)
- Architecture overview (K₄ mesh)
- Team/family context
- Roadmap/vision

**Entry Triggers**:
- Direct navigation to `/welcome`
- PHOS selection: "Explore P31"
- External links (press, social)

### 8.3.2 Door 2: Use

**Target User**: Individuals and families ready to engage
**Goal**: Get immediate value from tools
**Content**:
- Cognitive Passport generator
- C.A.R.S. Social Molecules entry
- Quickstart guides
- Demo videos

**Entry Triggers**:
- PHOS selection: "For Myself" or "For My Family"
- Door 1 "Ready to try" advancement

### 8.3.3 Door 3: Build

**Target User**: Developers, integrators, researchers
**Goal**: Enable building on/with P31
**Content**:
- API documentation
- SDK downloads
- Integration guides
- GitHub repositories
- Contribution guidelines

**Entry Triggers**:
- PHOS selection: "I'm a Professional"
- Door 2 "Go deeper" advancement

### 8.3.4 Door 4: Know Someone

**Target User**: Friends of existing mesh members
**Goal**: Controlled network expansion
**Content**:
- Room code entry
- Invite URL validation
- Waitlist (if no invite)
- Community guidelines

**Entry Triggers**:
- PHOS selection: "Join a mesh" (requires intent signal)
- Direct invite URL (`/planetary-onboard?invite=xxx`)
- Room code input

**Gate**:
```javascript
function canEnterDoor4(inviteCode?: string, roomCode?: string): boolean {
  if (inviteCode) {
    return validateInviteToken(inviteCode);
  }
  if (roomCode) {
    return validateRoomCode(roomCode);
  }
  return false; // Door 4 is gated
}

// User can request waitlist if gated
function requestWaitlist(email: string, reason: string): Promise<void> {
  return submitToWaitlist({ email, reason, requestedAt: new Date() });
}
```

## 8.4 UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  🔺 P31                                                         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │           Gray Rock void. Still K₄.                     │   │
│  │                                                         │   │
│  │     ┌─────┐   ┌─────┐   ┌─────┐   ┌─────┐             │   │
│  │     │  1  │   │  2  │   │  3  │   │  4  │             │   │
│  │     │ 🚪  │   │ 🚪  │   │ 🚪  │   │ 🔒  │             │   │
│  │     └─────┘   └─────┘   └─────┘   └─────┘             │   │
│  │                                                         │   │
│  │   Understand    Use      Build     Know Someone        │   │
│  │                                                         │   │
│  │  Door 4 is locked. You need a room code or invite.     │   │
│  │                                                         │   │
│  │  [Enter room code]  or  [Request access]               │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Select a door to begin. No wrong choice.                      │
│  [Need help? Talk to PHOS ↗]                                   │
└─────────────────────────────────────────────────────────────────┘
```

## 8.5 Query Parameters

| Parameter | Effect | Example |
|-----------|--------|---------|
| `?welcome=kid` | Opens Door 2 with family emphasis | `/planetary-onboard?welcome=kid` |
| `?a=child` | Same as above, shorthand | `/planetary-onboard?a=child` |
| `?invite=xxx` | Pre-fills Door 4 with invite | `/planetary-onboard?invite=abc123` |
| `?room=xxx` | Pre-fills Door 4 with room | `/planetary-onboard?room=xyz789` |
| `?door=2` | Opens directly to Door 2 | `/planetary-onboard?door=2` |

---

# 9. Starfield Ambient Background

## 9.1 Purpose

The Starfield is a **2D canvas-based ambient background system** that provides visual atmosphere while communicating system state. It responds to:
- Cognitive state (spoon count from CogPass)
- System voltage (operational health)
- Real-time "mesh touches" (events)

## 9.2 Architecture

### 9.2.1 Rendering System

```javascript
class Starfield {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.connections = [];
    this.config = DEFAULT_CONFIG;
    
    // Layers
    this.layers = {
      stars: [],       // Background particles
      connections: [], // Lines between nearby stars
      hearth: null,    // Central breathing element
      bursts: []       // Event-based animations
    };
    
    this.init();
  }
  
  init() {
    this.resize();
    this.createParticles();
    this.bindEvents();
    this.animate();
  }
  
  createParticles() {
    const count = this.config.count;
    this.particles = [];
    
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * this.config.speed,
        vy: (Math.random() - 0.5) * this.config.speed,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * this.config.baseAlpha,
        hue: this.sampleHue(),
        pulsePhase: Math.random() * Math.PI * 2
      });
    }
  }
  
  sampleHue() {
    // P31 palette distribution
    const coralRatio = this.config.coralRatio;
    const roll = Math.random();
    
    if (roll < coralRatio) {
      // Coral range (0-20°)
      return Math.random() * 20;
    } else if (roll < coralRatio + 0.5) {
      // Teal range (160-180°)
      return 160 + Math.random() * 20;
    } else {
      // Onyx/Pearl range (200-240°)
      return 200 + Math.random() * 40;
    }
  }
  
  animate() {
    const { ctx, width, height } = this;
    
    // Clear with trail effect
    ctx.fillStyle = `rgba(10, 10, 26, ${this.config.dimFactor})`;
    ctx.fillRect(0, 0, width, height);
    
    // Update and draw particles
    for (const p of this.particles) {
      // Move
      p.x += p.vx;
      p.y += p.vy;
      
      // Wrap around
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;
      
      // Pulse
      p.pulsePhase += this.config.breathRate;
      const pulse = Math.sin(p.pulsePhase) * 0.3 + 0.7;
      
      // Draw
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 70%, 60%, ${p.alpha * pulse})`;
      ctx.fill();
    }
    
    // Draw connections
    this.drawConnections();
    
    // Draw hearth
    this.drawHearth();
    
    // Draw bursts
    this.drawBursts();
    
    requestAnimationFrame(() => this.animate());
  }
  
  drawConnections() {
    const { ctx, config } = this;
    const connR = config.connR;
    
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const p1 = this.particles[i];
        const p2 = this.particles[j];
        
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < connR) {
          const alpha = (1 - dist / connR) * 0.2;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `hsla(170, 50%, 50%, ${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }
  
  drawHearth() {
    const { ctx, config } = this;
    const cx = this.width / 2;
    const cy = this.height / 2;
    
    // Breathing glow
    const breath = Math.sin(Date.now() * config.breathRate * 10) * 0.5 + 0.5;
    const radius = 30 + breath * 10;
    const alpha = config.hearthA * (0.5 + breath * 0.5);
    
    // Outer glow
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 3);
    gradient.addColorStop(0, `hsla(170, 70%, 50%, ${alpha})`);
    gradient.addColorStop(0.5, `hsla(170, 50%, 40%, ${alpha * 0.5})`);
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Core
    ctx.fillStyle = `hsla(170, 90%, 70%, ${alpha * 2})`;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}
```

### 9.2.2 Spoon-Based Configuration

```javascript
// Configuration based on cognitive energy level
const SPOON_CONFIGS = {
  // Critical low energy (0-3 spoons)
  critical: {
    count: 12,
    speed: 0.005,
    connR: 30,
    hearthA: 0.01,
    tealGlowA: 0.008,
    coralRatio: 0.1,
    baseAlpha: 0.06,
    breathRate: 0.0004,
    dimFactor: 0.15,
    description: 'Minimal movement, gentle breathing, low stimulation'
  },
  
  // Low energy (4-7 spoons)
  low: {
    count: 25,
    speed: 0.03,
    connR: 40,
    hearthA: 0.02,
    tealGlowA: 0.012,
    coralRatio: 0.6,
    baseAlpha: 0.1,
    breathRate: 0.0006,
    dimFactor: 0.4,
    description: 'Moderate activity, visible connections, warm tones'
  },
  
  // Normal energy (8-12 spoons)
  normal: {
    count: 50,
    speed: 0.08,
    connR: 60,
    hearthA: 0.035,
    tealGlowA: 0.016,
    coralRatio: 0.3,
    baseAlpha: 0.18,
    breathRate: 0.00075,
    dimFactor: 0.7,
    description: 'Full mesh visualization, active connections, balanced palette'
  },
  
  // Safe mode override
  safe: {
    count: 0,
    speed: 0,
    connR: 0,
    hearthA: 0,
    baseAlpha: 0,
    description: 'No animation — static or disabled'
  }
};

function configFromSpoons(spoons, safeMode = false) {
  if (safeMode) return SPOON_CONFIGS.safe;
  if (spoons <= 3) return SPOON_CONFIGS.critical;
  if (spoons <= 7) return SPOON_CONFIGS.low;
  return SPOON_CONFIGS.normal;
}
```

### 9.2.3 Mesh Touches (Event Responses)

```javascript
// Real-time event burst types
const BURST_TYPES = {
  MEDICATION: {
    emoji: '💊',
    color: '#4ecdc4',
    particleCount: 20,
    velocity: 2,
    decay: 2000
  },
  
  COMMIT: {
    emoji: '💻',
    color: '#ff6b6b',
    particleCount: 15,
    velocity: 3,
    decay: 1500
  },
  
  BIRTHDAY: {
    emoji: '🎂',
    color: '#ffe66d',
    particleCount: 30,
    velocity: 4,
    decay: 5000,
    gravity: -0.1 // Float upward
  },
  
  ACHIEVEMENT: {
    emoji: '🏆',
    color: '#ffd700',
    particleCount: 25,
    velocity: 2.5,
    decay: 3000
  },
  
  LOVE: {
    emoji: '💓',
    color: '#ff6b6b',
    particleCount: 12,
    velocity: 1.5,
    decay: 4000,
    pulse: true
  },
  
  SPOON_CHANGE: {
    // Visual indicator for spoon count change
    ringExpand: true,
    color: '#4ecdc4',
    decay: 1000
  }
};

class BurstManager {
  constructor(starfield) {
    this.starfield = starfield;
    this.bursts = [];
  }
  
  fire(type, x, y) {
    const config = BURST_TYPES[type];
    const burst = {
      type,
      x,
      y,
      createdAt: Date.now(),
      particles: this.createBurstParticles(config),
      config
    };
    
    this.bursts.push(burst);
  }
  
  createBurstParticles(config) {
    return Array.from({ length: config.particleCount }, () => ({
      x: 0,
      y: 0,
      vx: (Math.random() - 0.5) * config.velocity,
      vy: (Math.random() - 0.5) * config.velocity,
      size: Math.random() * 3 + 1,
      alpha: 1
    }));
  }
  
  update() {
    const now = Date.now();
    
    this.bursts = this.bursts.filter(burst => {
      const age = now - burst.createdAt;
      
      if (age > burst.config.decay) {
        return false;
      }
      
      const progress = age / burst.config.decay;
      
      // Update burst particles
      for (const p of burst.particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha = 1 - progress;
        
        if (burst.config.gravity) {
          p.vy += burst.config.gravity;
        }
      }
      
      return true;
    });
  }
  
  draw(ctx) {
    for (const burst of this.bursts) {
      for (const p of burst.particles) {
        ctx.beginPath();
        ctx.arc(burst.x + p.x, burst.y + p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = burst.config.color + 
          Math.floor(p.alpha * 255).toString(16).padStart(2, '0');
        ctx.fill();
      }
    }
  }
}
```

## 9.3 Integration API

```javascript
// Global starfield instance
let globalStarfield = null;

// Initialize
function initStarfield(canvasId, options = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;
  
  if (prefersReducedMotion && !options.force) {
    // Static fallback
    canvas.style.background = 'radial-gradient(circle at center, #1a1a2e 0%, #0a0a0a 100%)';
    return null;
  }
  
  globalStarfield = new Starfield(canvas, options);
  return globalStarfield;
}

// Update from CogPass
function updateFromCogPass(cogPass) {
  if (!globalStarfield) return;
  
  const spoons = cogPass?.cognitive?.workingMemory * 2 || 8;
  const safeMode = cogPass?.emergency?.urgentMode || false;
  
  const config = configFromSpoons(spoons, safeMode);
  globalStarfield.updateConfig(config);
}

// Fire burst from event
function fireBurst(type, element) {
  if (!globalStarfield) return;
  
  const rect = element.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  
  globalStarfield.burstManager.fire(type, x, y);
}

// Ingest touch hints from external systems
function ingestTouchHints(hints) {
  if (!globalStarfield) return;
  
  for (const hint of hints) {
    setTimeout(() => {
      fireBurst(hint.type, { 
        getBoundingClientRect: () => ({
          left: hint.x || window.innerWidth / 2,
          top: hint.y || window.innerHeight / 2,
          width: 0,
          height: 0
        })
      });
    }, hint.delay || 0);
  }
}
```

---

# 10. Quantum Material U

## 10.1 Purpose

Quantum Material U is a **design system framework** that adapts Material 3's grammar (elevation, state layers, shape, motion) using P31's K₄ color anchors. It prioritizes **Gray Rock** (inert, low-stimulation defaults) and personalizes based on the Cognitive Passport.

## 10.2 Core Principles

### 10.2.1 Hard Guards

```css
/* NEVER show brand chroma at Layer 1 */
.layer-1 {
  /* Allowed: neutral surfaces only */
  background: var(--p31-onyx);
  color: var(--p31-pearl);
  
  /* Forbidden at this layer: */
  /* background: var(--p31-coral); */
}

/* Motion respects system preference */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 10.2.2 Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    QUANTUM MATERIAL U LAYERS                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  LAYER 4: INTERACTIVE (Highest intensity)                    │
│  ├── Primary actions (coral at 80% opacity)                  │
│  ├── Destructive actions (alert tones)                       │
│  └── Celebration states (chords)                             │
│                                                              │
│  LAYER 3: COMMUNICATION                                      │
│  ├── Accent colors (teal for info)                          │
│  ├── Success states (green family)                           │
│  └── Warning states (yellow family)                         │
│                                                              │
│  LAYER 2: NAVIGATION                                         │
│  ├── Active states (teal-60)                                 │
│  ├── Selected states (onyx-80)                               │
│  └── Hover states (state-layer at 8%)                       │
│                                                              │
│  LAYER 1: STRUCTURAL (Gray Rock default)                     │
│  ├── Surfaces: Onyx, Pearl variants                          │
│  ├── Text: High contrast only                                │
│  └── NO chroma, NO gradients, NO shadows                     │
│                                                              │
│  FOUNDATION: TONAL PALETTE                                   │
│  ├── Derived from K₄ anchors via color-mix()                 │
│  ├── 0-100 scale per anchor                                  │
│  └── Consistent luminance ramps                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 10.3 Token System

### 10.3.1 CSS Custom Properties

```css
/* Generated from p31-universal-canon.json */
:root {
  /* K₄ Anchors */
  --p31-coral: #ff6b6b;
  --p31-teal: #4ecdc4;
  --p31-onyx: #1a1a2e;
  --p31-pearl: #f7f7f7;
  
  /* Tonal Palette (color-mix derived) */
  --p31-coral-0: #fff0f0;
  --p31-coral-10: #ffd6d6;
  --p31-coral-20: #ffadad;
  --p31-coral-30: #ff8585;
  --p31-coral-40: #ff6b6b;
  --p31-coral-50: #e05a5a;
  --p31-coral-60: #c24949;
  --p31-coral-70: #a33838;
  --p31-coral-80: #822828;
  --p31-coral-90: #611818;
  --p31-coral-100: #400808;
  
  --p31-teal-0: #f0fffd;
  --p31-teal-10: #d6f7f4;
  --p31-teal-20: #adefe9;
  --p31-teal-30: #85e7de;
  --p31-teal-40: #4ecdc4;
  --p31-teal-50: #42b5ad;
  --p31-teal-60: #369d96;
  --p31-teal-70: #2a857f;
  --p31-teal-80: #1e6d68;
  --p31-teal-90: #125551;
  --p31-teal-100: #063d3a;
  
  /* Elevation (shadow) System */
  --p31-shadow-1: 0 1px 2px rgba(0,0,0,0.1);
  --p31-shadow-2: 0 2px 4px rgba(0,0,0,0.1);
  --p31-shadow-3: 0 4px 8px rgba(0,0,0,0.15);
  --p31-shadow-4: 0 8px 16px rgba(0,0,0,0.15);
  
  /* State Layer Opacities */
  --p31-hover-state: 0.08;
  --p31-focus-state: 0.12;
  --p31-pressed-state: 0.12;
  --p31-dragged-state: 0.16;
  
  /* Spacing Scale */
  --p31-space-1: 4px;
  --p31-space-2: 8px;
  --p31-space-3: 12px;
  --p31-space-4: 16px;
  --p31-space-5: 24px;
  --p31-space-6: 32px;
  --p31-space-7: 48px;
  --p31-space-8: 64px;
  
  /* Typography Scale */
  --p31-text-xs: 0.75rem;   /* 12px */
  --p31-text-sm: 0.875rem;  /* 14px */
  --p31-text-base: 1rem;    /* 16px */
  --p31-text-lg: 1.125rem;  /* 18px */
  --p31-text-xl: 1.25rem;   /* 20px */
  --p31-text-2xl: 1.5rem;   /* 24px */
  --p31-text-3xl: 1.875rem; /* 30px */
  
  /* Motion */
  --p31-duration-instant: 0ms;
  --p31-duration-fast: 100ms;
  --p31-duration-normal: 200ms;
  --p31-duration-slow: 300ms;
  --p31-easing-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --p31-easing-decelerate: cubic-bezier(0, 0, 0.2, 1);
  --p31-easing-accelerate: cubic-bezier(0.4, 0, 1, 1);
}
```

### 10.3.2 Component Classes

```css
/* Card Component */
.p31-q-card {
  background: var(--p31-onyx-95);
  border-radius: 12px;
  padding: var(--p31-space-4);
  border: 1px solid var(--p31-onyx-90);
}

.p31-q-card--elevated {
  box-shadow: var(--p31-shadow-2);
}

.p31-q-card--filled {
  background: var(--p31-onyx-90);
}

.p31-q-card--outlined {
  border: 1px solid var(--p31-onyx-80);
  background: transparent;
}

/* Button Component */
.p31-q-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--p31-space-2) var(--p31-space-4);
  border-radius: 8px;
  font-size: var(--p31-text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: 
    background var(--p31-duration-fast) var(--p31-easing-standard),
    transform var(--p31-duration-fast) var(--p31-easing-standard);
}

.p31-q-button--filled {
  background: var(--p31-teal-40);
  color: var(--p31-onyx);
}

.p31-q-button--filled:hover {
  background: var(--p31-teal-50);
}

.p31-q-button--tonal {
  background: var(--p31-teal-90);
  color: var(--p31-teal-10);
}

.p31-q-button--outlined {
  background: transparent;
  border: 1px solid var(--p31-onyx-70);
  color: var(--p31-pearl);
}

.p31-q-button--text {
  background: transparent;
  color: var(--p31-teal-40);
}

/* State layers */
.p31-q-button:hover::before {
  content: '';
  position: absolute;
  inset: 0;
  background: currentColor;
  opacity: var(--p31-hover-state);
  border-radius: inherit;
}

/* Chip Component */
.p31-q-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--p31-space-1);
  padding: var(--p31-space-1) var(--p31-space-3);
  border-radius: 16px;
  font-size: var(--p31-text-sm);
}

.p31-q-chip--assist {
  background: var(--p31-onyx-90);
  border: 1px solid var(--p31-onyx-80);
}

.p31-q-chip--filter {
  background: var(--p31-teal-90);
  color: var(--p31-teal-10);
}

.p31-q-chip--filter[aria-selected="true"] {
  background: var(--p31-teal-40);
  color: var(--p31-onyx);
}

.p31-q-chip--input {
  background: var(--p31-onyx-95);
  border: 1px solid var(--p31-onyx-80);
}

.p31-q-chip--suggestion {
  background: transparent;
  border: 1px solid var(--p31-onyx-70);
}
```

## 10.4 Passport Personalization

```javascript
// Map CogPass attributes to theme adjustments
function generateThemeFromPassport(passport) {
  const base = getComputedStyle(document.documentElement);
  const adjustments = {};
  
  // Sensory sensitivity affects contrast
  const visualSensory = passport.cognitive.sensoryProfile?.visual;
  if (visualSensory === 'sensitive') {
    adjustments['--p31-contrast-ratio'] = '4.5'; // Lower than 7:1
    adjustments['--p31-motion-scale'] = '0.5';
  } else if (visualSensory === 'seeking') {
    adjustments['--p31-contrast-ratio'] = '7';
    adjustments['--p31-motion-scale'] = '1.2';
  }
  
  // Processing speed affects animation duration
  const processingSpeed = passport.cognitive.processingSpeed;
  if (processingSpeed === 'deliberate') {
    adjustments['--p31-duration-scale'] = '1.5';
  } else if (processingSpeed === 'fast') {
    adjustments['--p31-duration-scale'] = '0.8';
  }
  
  // Attention pattern affects focus indicators
  const attention = passport.cognitive.attentionPattern;
  if (attention === 'variable') {
    adjustments['--p31-focus-indicator-width'] = '3px';
    adjustments['--p31-focus-indicator-style'] = 'dashed';
  }
  
  return adjustments;
}

// Apply theme
function applyPersonalizedTheme(passport) {
  const adjustments = generateThemeFromPassport(passport);
  const root = document.documentElement;
  
  for (const [property, value] of Object.entries(adjustments)) {
    root.style.setProperty(property, value);
  }
  
  // Store for reapplication
  localStorage.setItem('p31-theme-adjustments', JSON.stringify(adjustments));
}
```

---

# 11. Synergetic Geodesic Stack

## 11.1 Purpose

The Synergetic Geodesic Stack provides **shared 3D collaborative spaces** for families and teams. Based on Buckminster Fuller's geodesic principles, it creates persistent, interactive 3D rooms where users can add, move, and manipulate shapes together in real-time.

## 11.2 Technical Stack

### 11.2.1 GeodesicRoom Durable Object

```typescript
// Cloudflare Durable Object v0.2.1
interface GeodesicRoom {
  id: string;
  createdAt: number;
  maxShapes: 50;  // Maxwell rigidity cap
  
  shapes: Map<string, Shape>;
  clients: Map<string, ClientInfo>;
  
  // Wire protocol
  handleWebSocket(request: Request): WebSocket;
  broadcast(message: WireMessage): void;
  
  // Shape operations
  addShape(shape: Shape): Result<Shape, Error>;
  moveShape(id: string, pose: Pose): Result<Shape, Error>;
  removeShape(id: string): Result<void, Error>;
  resetShapes(): Result<void, Error>;
}

interface Shape {
  id: string;
  type: 'tetrahedron' | 'cube' | 'sphere' | 'octahedron' | 'icosahedron';
  pose: {
    x: number;
    y: number;
    z: number;
    rotX: number;
    rotY: number;  // Tabletop rotation
    rotZ: number;
    scale: number;
  };
  color: {
    h: number;  // Hue 0-360
    s: number;  // Saturation 0-100
    l: number;  // Lightness 0-100
  };
  owner: string;  // Client ID
  createdAt: number;
}

interface WireMessage {
  type: 'hello' | 'add_shape' | 'move_shape' | 'remove_shape' | 
        'reset_shapes' | 'sync' | 'error';
  timestamp: number;
  payload: unknown;
}

// Hello response includes all current shapes
interface HelloResponse {
  type: 'hello';
  payload: {
    roomId: string;
    clientId: string;
    shapes: Shape[];
    maxShapes: number;
  };
}
```

### 11.2.2 Client-Side Wire Protocol

```javascript
// Wire protocol: p31.geodesicRoomWire/0.2.1
class GeodesicWire {
  constructor(roomId, clientId) {
    this.roomId = roomId;
    this.clientId = clientId;
    this.ws = null;
    this.shapes = new Map();
    this.callbacks = new Map();
  }
  
  async connect() {
    const url = `wss://geodesic-room.trimtab-signal.workers.dev/ws/${this.roomId}`;
    this.ws = new WebSocket(url);
    
    this.ws.onopen = () => {
      // Send hello
      this.send({
        type: 'hello',
        payload: { clientId: this.clientId }
      });
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };
  }
  
  handleMessage(message) {
    switch (message.type) {
      case 'hello':
        // Initial sync
        message.payload.shapes.forEach(s => {
          this.shapes.set(s.id, s);
        });
        this.emit('sync', this.shapes);
        break;
        
      case 'add_shape':
        this.shapes.set(message.payload.id, message.payload);
        this.emit('shape_added', message.payload);
        break;
        
      case 'move_shape':
        const shape = this.shapes.get(message.payload.id);
        if (shape) {
          shape.pose = message.payload.pose;
          this.emit('shape_moved', shape);
        }
        break;
        
      case 'remove_shape':
        this.shapes.delete(message.payload.id);
        this.emit('shape_removed', message.payload);
        break;
        
      case 'reset_shapes':
        this.shapes.clear();
        this.emit('reset');
        break;
    }
  }
  
  // Shape operations
  addShape(shapeType, pose, color) {
    return this.send({
      type: 'add_shape',
      payload: {
        type: shapeType,
        pose,
        color
      }
    });
  }
  
  moveShape(shapeId, newPose) {
    return this.send({
      type: 'move_shape',
      payload: {
        id: shapeId,
        pose: newPose
      }
    });
  }
  
  removeShape(shapeId) {
    return this.send({
      type: 'remove_shape',
      payload: { id: shapeId }
    });
  }
  
  resetShapes() {
    return this.send({ type: 'reset_shapes' });
  }
  
  send(message) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        ...message,
        timestamp: Date.now()
      }));
    }
  }
}
```

## 11.3 UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  SYNERGETIC GEODESIC ROOM — Shared 3D Space                      │
│  Room: family-kitchen-2026    |    3 builders present             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │                    THREE.JS VIEWPORT                    │    │
│  │                                                         │    │
│  │         ◯                                               │    │
│  │        /|\                                              │    │
│  │       / | \     ◯────◯                                  │    │
│  │      ◯──┼──◯   /      /|                                │    │
│  │         |     ◯────◯ ◯                                │    │
│  │              (Shapes in 3D space)                     │    │
│  │                                                         │    │
│  │    [Drag to rotate] [Scroll to zoom] [Click to select]│    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  SHAPE PALETTE  (50 max)  [████████░░░░░░░░░░░░] 24    │    │
│  │                                                          │    │
│  │  [△ Tetra] [☐ Cube] [○ Sphere] [◇ Octa] [⬡ Icosa]     │    │
│  │  [Color: ●────●────●]  [Size: ──●──]                   │    │
│  │                                                          │    │
│  │  [Add to Room]                                           │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  BUILDERS                                                │    │
│  │  ● will (you)  ○ sj  ○ wj  [Invite +]                    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  [Reset All] [Export JSON] [Leave Room]                         │
└─────────────────────────────────────────────────────────────────┘
```

---

# 12. Mesh Personal Start Pages

## 12.1 Purpose

Personal Start Pages are **individual entry points** for each mesh member (will, S.J., W.J., christyn) that provide:
- Personalized context and tools
- Quick access to relevant family resources
- Direct links to their specific configurations

## 12.2 Page Structure

### 12.2.1 Generic Template

```
┌─────────────────────────────────────────────────────────────────┐
│  🔺 P31 — [Member Name]'s Start Page                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Good [time], [Name].                                   │    │
│  │                                                         │    │
│  │  Your current status: [STATUS]                          │    │
│  │  Last active: [TIME]                                    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  QUICK ACCESS                                            │    │
│  │                                                          │    │
│  │  [🧠 My Passport]  [🏠 Family Mesh]  [💼 My Projects]    │    │
│  │                                                          │    │
│  │  [Recent Activity]                                       │    │
│  │  • [Activity 1]                                          │    │
│  │  • [Activity 2]                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  FAMILY CONNECTIONS                                      │    │
│  │                                                          │    │
│  │  ○ [Member 1]  ○ [Member 2]  ○ [Member 3]               │    │
│  │  [Send ping]                                             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 12.2.2 Member-Specific Variants

**will (Operator)**:
- Operator desk link
- System status overview
- Deployment controls
- Glass Box access

**S.J.**:
- Age-appropriate interface
- Creative tools prominence
- Learning resources
- Sibling connection

**W.J.**:
- Age-appropriate interface  
- Creative tools prominence
- Learning resources
- Sibling connection

**christyn**:
- Family coordination tools
- Household management
- Calendar integration
- Emergency contacts

## 12.3 Durable Object Integration

Each member has a corresponding entry in the K₄ Personal Durable Object:

```typescript
interface PersonalMeshEntry {
  userId: string;
  vertex: 'will' | 'sj' | 'wj' | 'christyn';
  
  // Personal configuration
  preferences: {
    theme: string;
    accessibility: AccessibilityConfig;
    notifications: NotificationConfig;
  };
  
  // Agent routing
  agentEndpoints: {
    calendar: string;
    tasks: string;
    notes: string;
  };
  
  // Family connections (edges)
  bonds: {
    target: string;
    strength: number;
    lastInteraction: number;
  }[];
}
```

---

(Remaining MVP specifications continue...)

---

# Summary: MVP Production Readiness

## Quality Gates

| MVP | Gate 1 | Gate 2 | Gate 3 | Status |
|-----|--------|--------|--------|--------|
| PHOS | ✓ | ✓ | ✓ | **Production** |
| Cognitive Passport | ✓ | ✓ | ✓ | **Production** |
| C.A.R.S. | ✓ | ✓ | ○ | Beta |
| Glass Box | ✓ | ✓ | ○ | Beta |
| K₄ Market | ✓ | ✓ | ○ | Beta |
| Fleet Portal | ✓ | ✓ | ✓ | **Production** |
| Delta Language | ✓ | ○ | ○ | Alpha |
| Planetary Onboarding | ✓ | ✓ | ✓ | **Production** |
| Starfield | ✓ | ✓ | ✓ | **Production** |
| Quantum Material U | ✓ | ✓ | ○ | Beta |
| Synergetic | ✓ | ○ | ○ | Alpha |
| Mesh Personal | ✓ | ✓ | ○ | Beta |

**Legend**:
- ✓ Passes all checks
- ○ Partial implementation
- ✗ Fails critical checks

## Production Line Criteria

For an MVP to enter the production line:
1. All Gate 3 checks pass (verify-public-line)
2. Lighthouse scores ≥ 90 across all categories
3. Psych E2E passes for 3+ personas
4. Console zero errors
5. Screen reader pass (NVDA/VoiceOver)
6. Documentation complete (this doc)
7. Emergency rollback tested

---

*Document: P31-PUBLIC-MVP-WRITEUPS-DETAILED.md*
*Version: 1.0.0*
*Generated: 2026-05-03*
*Schema: p31.mvpSpecifications/1.0.0*