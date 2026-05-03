# C.A.R.S. / Social Molecules — Complete Technical Specification
**Collaborative Affective Realtime Sim**  
**Version:** 1.0.0  
**Date:** 2026-05-03

---

## 1. OVERVIEW

**C.A.R.S.** = **C**ollaborative **A**ffective **R**ealtime **S**im

C.A.R.S. is the multiplayer, persistent molecular environment at the heart of BONDING. It's a living "Soup" where molecules (representing emotional states and interpersonal connections) drift, interact, react, and form an evolving landscape of shared emotional history.

### Core Concepts

| Concept | Description |
|---------|-------------|
| **Social Molecules** | People's emotional states rendered as simulated molecules |
| **Ghost Molecules** | Interpolated representations of other players' molecules |
| **The Soup** | The 4000×4000 persistent world where molecules live |
| **Affective Chemistry** | Emotions as chemical properties (polarity, mass, charge) |
| **Collaborative** | WebSocket rooms for shared family experiences |

### Naming

```
C.A.R.S. → Collaborative Affective Realtime Sim

Collaborative  → WebSocket rooms, roster, playerState, shared reactions
Affective      → Personalities, emotional kinematics, valence/arousal/cognitive
Realtime       → Game loop + heartbeats + network interpolation (~2 Hz)
Sim            → Atoms, bonds, SoupPhysics, reactions, LOD
```

---

## 2. ARCHITECTURE

### 2.1 System Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         C.A.R.S. ENGINE                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐ │
│  │  SoupPhysics    │  │  Personalities  │  │  Reactions              │ │
│  │                 │  │  Engine         │  │  Engine                 │ │
│  │  - Atoms        │  │                 │  │                         │ │
│  │  - Bonds        │  │  - Archetypes   │  │  - Reaction profiles    │ │
│  │  - Spatial grid │  │  - Valence      │  │  - Compatibility      │ │
│  │  - Collisions   │  │  - Arousal      │  │  - Synthesis chains     │ │
│  │  - LOD          │  │  - Cognitive    │  │                         │ │
│  └────────┬────────┘  └─────────────────┘  └─────────────────────────┘ │
│           │                                                             │
│           ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      SoupEngine                                 │   │
│  │                                                                 │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │   │
│  │  │  Molecules  │  │    Zones    │  │    WebSocket Layer      │  │   │
│  │  │  (local)    │  │  (4 zones)  │  │  - Ghost molecules      │  │   │
│  │  │             │  │             │  │  - Network roster         │  │   │
│  │  │  + atoms    │  │  - Calm     │  │  - Ping system          │  │   │
│  │  │  + bonds    │  │  - Lab      │  │  - Event log              │  │   │
│  │  │  + personality│ - Kitchen   │  │  - 2 Hz updates           │  │   │
│  │  │  + element  │  │  - Deep     │  │  - Interpolation          │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘  │   │
│  │                                                                 │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │   │
│  │  │ Soundtrack  │  │  Particles  │  │   Persistence           │  │   │
│  │  │  Engine     │  │  System     │  │   Layer                 │  │   │
│  │  │             │  │             │  │                         │  │   │
│  │  │  - Molecule │  │  - Birth    │  │  - localStorage save    │  │   │
│  │  │    chords   │  │  - Reactions│  │  - Export/import        │  │   │
│  │  │  - Zone     │  │  - Ambient  │  │  - Ghost constellation  │  │   │
│  │  │    audio    │  │  - Fades    │  │                         │  │   │
│  │  │  - 863 Hz   │  │             │  │                         │  │   │
│  │  │    Larmor   │  │             │  │                         │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 File Structure

```
src/
├── soup.ts                 # Main SoupEngine orchestration
├── soupPhysics.ts          # Physics core (atoms, bonds, collisions)
├── personalities.ts        # Emotional archetypes and affective state
├── reactions.ts            # Chemical reaction system
├── soundtrack.ts           # Generative audio engine
├── particles.ts            # Visual particle effects
└── persistence.ts          # Save/load molecule state

cars-contract/
└── p31.carsWire.json       # WebSocket protocol specification

spikes/mock-ws-server/
└── server.js               # Mock WebSocket server for testing
```

---

## 3. THE SOUP WORLD

### 3.1 World Architecture

| Property | Value |
|----------|-------|
| **Dimensions** | 4000×4000 pixels |
| **Viewport** | 800×600 pixels (pannable/zoomable) |
| **Background** | #0a0a0f (deep void) |
| **Parallax** | 0.3× camera speed for depth |

### 3.2 Camera System

```typescript
// Smooth interpolation with damping
const damping = 0.1;
const targetX = newestMolecule.x - viewportWidth / 2;
const targetY = newestMolecule.y - viewportHeight / 2;

camera.x += (targetX - camera.x) * damping;
camera.y += (targetY - camera.y) * damping;

// 2-second ease when creating new molecule
```

### 3.3 Molecule Lifecycle

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  BORN   │───►│  LIVES  │───►│ REACTS  │───►│  FADES  │───►│DISCOVERED│
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
     │              │              │              │              │
     ▼              ▼              ▼              ▼              ▼
 Flash          Drift         Merge        Opacity       Named
 + spin       physics       animation     100%→30%      tag
 Audio                        New          30 days       Pulse
 stinger                    product        old          outline
```

---

## 4. PHYSICS SYSTEM

### 4.1 Core Interfaces

```typescript
interface Atom {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  element: string;    // 'H', 'C', 'N', 'O', 'P', etc.
  color: string;
  radius: number;
  mass: number;
  charge: number;
}

interface Bond {
  atom1: Atom;
  atom2: Atom;
  restLength: number;
  strength: number;
}

interface PhysicsConfig {
  width: number;           // 4000
  height: number;          // 4000
  physicsHz: number;       // 30
  renderHz: number;        // 60
  cellSize: number;        // 200 (spatial hashing)
  lodThresholds: {
    fpsLow: number;        // 45
    consecutiveFrames: number; // 3
  };
}
```

### 4.2 Polarity Forces

```typescript
// Polar clustering (water finds water)
const F_attract = (k_p * μ1 * μ2) / r²;
// where k_p = 0.08, μ = molecular polarity

// Nonpolar repulsion
const F_repel = k_n * e^(-r/λ);
// where k_n = 0.12, λ = 100px
```

### 4.3 Ionic Vibration

```typescript
// Crystalline lattice vibration
const x = A * sin(ωt + φ);
// A = 5px, ω = 2π/3 rad/tick, φ = per-molecule phase
```

### 4.4 Mass-Velocity Relationship

```typescript
// Complex molecules move slower
const v_max = v0 / sqrt(m);
// v0 = 2.0 units/tick, m = atomic mass units
```

### 4.5 Spatial Hashing

```typescript
// O(1) collision detection
const cellX = Math.floor(atom.x / cellSize);
const cellY = Math.floor(atom.y / cellSize);
const cellKey = `${cellX},${cellY}`;
```

---

## 5. ZONES

### 5.1 Zone Overview

| Zone | Location | Size | Key Feature |
|------|----------|------|-------------|
| **Calm Zone** | Center (2000, 2000) | 600px radius | Breathing pacer (4-4-6 rhythm) |
| **Lab** | Upper-left (0-1500, 0-1500) | 1500×1500 | Builder's Station, full stats UI |
| **Kitchen** | Lower-right (2500-4000, 2500-4000) | 1500×1500 | Food molecule gravity well |
| **The Deep** | Outer band (500px from edge) | 500px wide | 863 Hz Larmor frequency |

### 5.2 Calm Zone

```typescript
// 4-4-6 breathing rhythm
const rhythm = {
  inhale: 4000,   // 4 seconds
  hold: 4000,     // 4 seconds  
  exhale: 6000,   // 6 seconds
  total: 14000    // 14 second cycle
};

// Effects
velocityMultiplier: 0.4,
reactionEnergyIncrease: 0.20,
backgroundLightness: 0.02,  // #121218
particleDensity: 1.5,       // +50%
```

### 5.3 The Lab

```typescript
// High cognitive load for analysis
background: '#1a1a22',
reactionSpeed: 0.75,  // 25% slower
uiOverlays: {
  enabled: true,
  stats: true,
  builderStation: true
}
```

### 5.4 The Kitchen

```typescript
// Food molecule gravity well
const F_food = 0.05 / r;  // attractor at (3250, 3250)

// Warmer tones
background: '#1f1a18',
interactionRadius: 1.15  // +15%
```

### 5.5 The Deep

```typescript
// Outer edge of consciousness
background: '#080812',
velocityMultiplier: 0.6,
particleDensity: 0.25,

// Posner molecules orbit center
const orbitRadius = 1800;  // ±200px
const orbitPeriod = 400;   // seconds

// 863 Hz Larmor frequency of ³¹P
audioFrequency: 863;  // Hz, mixed at -20dB
```

---

## 6. MOLECULE BEHAVIORS

### 6.1 Personality Archetypes

```typescript
// Personalities drive physics behavior
interface Personality {
  name: string;
  valence: number;      // -1 (negative) to +1 (positive)
  arousal: number;      // 0 (calm) to 1 (excited)
  cognitiveLoad: number; // 0 (simple) to 1 (complex)
  polarity: number;      // 0 (nonpolar) to 1 (polar)
}

// Example archetypes
const archetypes = {
  water: { valence: 0, arousal: 0.3, cognitiveLoad: 0.2, polarity: 1 },
  methane: { valence: 0, arousal: 0.2, cognitiveLoad: 0.1, polarity: 0 },
  serotonin: { valence: 0.8, arousal: 0.5, cognitiveLoad: 0.6, polarity: 0.7 },
  cortisol: { valence: -0.6, arousal: 0.9, cognitiveLoad: 0.7, polarity: 0.4 },
  posner: { valence: 0.9, arousal: 0.1, cognitiveLoad: 0.9, polarity: 0.5 }
};
```

### 6.2 Reaction System

```typescript
interface ReactionCandidate {
  moleculeA: Molecule;
  moleculeB: Molecule;
  compatibility: number;  // 0-1
  activationEnergy: number;
  products: Molecule[];
}

interface ReactionEvent {
  type: 'synthesis' | 'decomposition' | 'exchange';
  reactants: string[];  // molecule IDs
  products: string[];   // molecule IDs
  energy: number;
  timestamp: number;
}

// Visual reaction sequence
// 1. Molecules approach along bezier curves
// 2. Merge with particle burst (20 particles, 1.5s lifetime)
// 3. Reactants de-render over 0.8s
// 4. Products born with inherited momentum + 20% thermal noise
```

### 6.3 Reaction Proximity Glow

```typescript
// Glowing tether between compatible molecules
const I = I0 * e^(-d/r_i);
// I0 = base intensity, d = distance, r_i = interaction radius
```

---

## 7. MULTIPLAYER / WEBSOCKET

### 7.1 Wire Protocol

```json
{
  "schema": "p31.carsWire/0.1.0",
  "heartbeatIntervalMs": 5000,
  "moleculeBroadcastIntervalMs": 500,
  "soupEngine": {
    "handlesIncomingTypes": [
      "moleculeStateUpdate",
      "ping",
      "eventLog",
      "connectionInit",
      "heartbeat"
    ]
  },
  "mockServer": {
    "sendsToClientTypes": [
      "connectionInit",
      "moleculeStateUpdate",
      "heartbeat",
      "ping",
      "eventLog"
    ],
    "acceptsClientParsingTypes": [
      "playerState",
      "heartbeat",
      "ping",
      "labTelemetry"
    ]
  }
}
```

### 7.2 Ghost Molecules

```typescript
interface GhostMolecule {
  networkX: number;
  networkY: number;
  lastNetworkX: number;
  lastNetworkY: number;
  interpolatedX: number;
  interpolatedY: number;
  interpolationProgress: number;
  element: string;
  personality: string;
}

// Interpolation at 2 Hz
const updateRate = 500;  // ms
const interpolationSpeed = 0.15;  // per frame
```

### 7.3 Ping System

```typescript
interface Ping {
  targetId: string;
  emoji: string;
  timestamp: number;
}

// Limit: 5 pings per minute per player
// Visual: Emoji particles arc toward target
// Orbit: 15-25px radius, tight and fast
```

### 7.4 Event Log

```typescript
interface EventLogEntry {
  id: string;
  type: string;
  actorId: string;
  targetId: string | null;
  message: string;  // e.g., "Will pinged Bash's Water 💚"
  timestamp: number;
}
```

---

## 8. AUDIO SYSTEM

### 8.1 Molecular Audio

```typescript
// Every molecule is an audio emitter
const moleculeAudio = {
  gain: -30,  // dB (quiet)
  pan: basedOnScreenPosition,  // -1 (left) to +1 (right)
  chord: basedOnGeometry,  // triangle=major, square=minor, complex=7th/9th
};

// Zoom-based scaling
if (zoom > 2.0) {
  isolatedChordGain = -10;  // dB
  applyLowPassFilterToDistant();
} else if (zoom < 0.5) {
  blendIntoAmbientWash();
}
```

### 8.2 Zone Audio

| Zone | Audio Characteristic |
|------|---------------------|
| Calm Zone | 60 BPM metronome locked to 4-4-6 rhythm |
| The Deep | 863 Hz Larmor tone at -20dB |
| General | Dynamic range compression (-25dB to -15dB) |

### 8.3 Audio Constraints

```typescript
// Hard limits for performance
const MAX_OSCILLATORS = 8;

// Voice stealing when limit reached
// Quietest active voice is repurposed

// Cluster additive synthesis when zoomed out
```

---

## 9. PERFORMANCE BUDGET

### 9.1 Render Limits

| Metric | Limit |
|--------|-------|
| Max molecules (viewport) | 200 |
| LOD threshold distance | 600px → dots, 1000px → points |
| Physics tick rate | 30 Hz |
| Render frame rate | 60 fps |
| Spatial hash cell size | 200px |
| Texture memory | 32MB |
| JS heap | 150MB |
| Post-processing resolution | 1024×768 max |

### 9.2 LOD System

```typescript
// Level of Detail transitions
if (distance > 600px) {
  // Collapse to 3px colored dot, alpha = 0.4
} else if (distance > 1000px) {
  // Collapse to 1px point, alpha = 0.2
}

// Smooth interpolation to avoid popping
```

### 9.3 Decoupled Physics

```typescript
// Physics at 30 Hz, render at 60 Hz
const physicsDt = 1 / 30;  // seconds
const renderDt = 1 / 60;   // seconds

// Visual interpolator smooths physics data
```

---

## 10. ERA PROGRESSION

### 10.1 Six Eras

| Era | Trigger | Visual | Audio |
|-----|---------|--------|-------|
| **Primordial** | 0-5 molecules | Empty void, dust only | Minimal clicks |
| **Simple** | 6-15 molecules | Diatomic gases, field lines | Single drones |
| **Organic** | 16-30 molecules | Carbon hexagons, clustering | Harmonic intervals |
| **Complex** | 31-50 molecules | Chain reactions, zone boundaries | Chords |
| **Living** | 51-100 molecules | Flocking, full generative music | Rich harmonics |
| **Consciousness** | 100+ or Posner | 863 Hz global, autonomous camera | 863 Hz pad |

### 10.2 Era Effects

```typescript
// Consciousness Era (100+ molecules or Posner synthesized)
const consciousnessEffects = {
  larmorFrequency: 863,  // Hz global
  posnerOrbit: {
    center: { x: 2000, y: 2000 },
    radius: 1800,
    pulsing: true,
    whiteLight: true
  },
  physicsAdjustment: {
    allVectorsTowardDeep: true
  },
  fadedMolecules: {
    flashOriginalColor: true,
    interval: '10 minutes'
  },
  camera: {
    autonomousDriftWhenIdle: true,
    breathingMotion: true
  }
};
```

---

## 11. SPATIAL CHAT

### 11.1 Message Orbit

```typescript
// Elliptical orbit around molecules
const r = (θ) => (a * (1 - e²)) / (1 + e * cos(θ));
// a = 40px (semi-major axis)
// e = 0.3 (eccentricity)
```

### 11.2 Message Aging

| Age | Orbital Radius | Opacity |
|-----|---------------|---------|
| < 1 hour | 20-40px | 1.0 |
| 1-7 days | 40-120px (linear) | 1.0 → 0.1 |
| 30+ days | 120px | 0.1 (ghost) |

### 11.3 Ping System

```typescript
// Pings vs messages
const ping = {
  orbitRadius: { min: 15, max: 25 },  // Tighter
  opacity: 1.0,  // Higher
  speed: 'faster',
  limit: 50  // per molecule
};
```

---

## 12. SOUNDTRACK SYSTEM

### 12.1 Generative Audio

```typescript
class SoundtrackEngine {
  // Per-molecule chords
  playMoleculeChord(molecule: Molecule, position: { x, y }) {
    const chord = getChordForGeometry(molecule.geometry);
    const pan = (position.x / screenWidth) * 2 - 1;  // -1 to +1
    const gain = -30;  // dB
    
    // Triangle = major, square = minor, complex = 7th/9th
  }
  
  // Zone overrides
  applyZoneOverride(zone: Zone) {
    if (zone.name === 'Calm Zone') {
      this.bpm = 60;
      this.rhythm = [4, 4, 6];  // inhale, hold, exhale
    }
    if (zone.name === 'Deep') {
      this.larmorTone = 863;  // Hz
      this.larmorGain = -20;  // dB
    }
  }
  
  // Dynamic range compression
  compress(output: AudioNode) {
    // Maintain -25dB to -15dB regardless of density
  }
}
```

---

## 13. PERSISTENCE

### 13.1 Save System

```typescript
interface SavedMolecule {
  id: string;
  atoms: Atom[];
  bonds: Bond[];
  personality: string;
  name?: string;  // User-named
  creationTime: number;
  reactionHistory: ReactionEvent[];
}

// Save to localStorage
const saveKey = 'p31.soup.molecules';
localStorage.setItem(saveKey, JSON.stringify(molecules));

// 30-day half-life for fading
const HALF_LIFE_DAYS = 30;
```

### 13.2 Constellation

```typescript
// User-created persistent stars
const constellation = {
  points: [
    { x: 0.5, y: 0.5, a: 0.8 },  // Normalized 0-1
  ],
  load: () => { /* from localStorage */ },
  save: () => { /* to localStorage */ }
};
```

---

## 14. IMPLEMENTATION

### 14.1 Complete SoupEngine API

```typescript
class SoupEngine {
  constructor(
    config: PhysicsConfig,
    wsUrl: string,
    networkPlay: NetworkPlayOptions | null
  );
  
  // Molecule management
  addMolecule(molecule: Molecule): void;
  removeMolecule(id: string): void;
  getMolecule(id: string): Molecule | undefined;
  
  // Game loop
  update(deltaTime: number): void;
  render(ctx: CanvasRenderingContext2D): void;
  
  // Network
  connectWebSocket(): void;
  disconnectWebSocket(): void;
  sendPing(targetId: string, emoji: string): void;
  
  // Events
  onReaction?: (event: ReactionEvent) => void;
  onMoleculeCreated?: (molecule: Molecule) => void;
  onNetworkWarmEdge?: () => void;
  
  // Breathing clock (4-4-6)
  private breathClockMs: number;
  private static readonly BREATH_INHALE_MS = 4000;
  private static readonly BREATH_HOLD_MS = 4000;
  private static readonly BREATH_EXHALE_MS = 6000;
  
  // Coherence signal
  private coherenceLastState: string;  // "" | "warming" | "coherent"
}
```

### 14.2 Network Play Options

```typescript
interface NetworkPlayOptions {
  room: string;        // Family room name
  displayName: string; // Player name
}

// URL format for family play
// ws://host:port/?room=FAMILY_ROOM&name=PLAYER_NAME
```

### 14.3 HTML Integration

```html
<!DOCTYPE html>
<html class="soup-app soup-app--gray-rock" lang="en">
<head>
  <title>C.A.R.S.</title>
  <link rel="stylesheet" href="soup-quantum.css">
</head>
<body>
  <div id="container">
    <canvas id="soup-canvas"></canvas>
  </div>
  
  <script type="module">
    import { SoupEngine } from './src/soup.ts';
    
    const engine = new SoupEngine(
      { width: 4000, height: 4000, physicsHz: 30, renderHz: 60, cellSize: 200 },
      'ws://127.0.0.1:8082',
      { room: 'family_kitchen', displayName: 'Will' }
    );
    
    // Game loop
    function loop() {
      engine.update(16.67);
      engine.render(ctx);
      requestAnimationFrame(loop);
    }
    
    loop();
  </script>
</body>
</html>
```

---

## 15. ACCESSIBILITY

### 15.1 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .soup-molecule {
    animation: none !important;
    transition: none !important;
  }
  
  /* Disable parallax */
  .soup-background {
    transform: none !important;
  }
}
```

### 15.2 Keyboard Navigation

| Key | Action |
|-----|--------|
| Arrow keys | Pan camera |
| +/- | Zoom in/out |
| Tab | Focus molecules |
| Enter | Select/tap molecule |
| Space | Send ping to selected |

### 15.3 Screen Reader

```html
<div role="region" aria-label="C.A.R.S. molecular environment">
  <div aria-live="polite" aria-atomic="true">
    <!-- Reaction announcements -->
  </div>
</div>
```

---

## 16. DEPLOYMENT

### 16.1 Live URL

**Production:** `https://bonding.p31ca.org/soup`

### 16.2 Local Development

```bash
# Terminal 1: Static server
npm run demo  # Port 8080

# Terminal 2: WebSocket server
node spikes/mock-ws-server/server.js  # Port 8082

# Open browser
http://localhost:8080/soup.html?room=test&name=dev
```

### 16.3 Build Commands

```bash
# Compile TypeScript
npm run soup:prep

# Verify without rebuild
npm run soup:prep:check

# Sync to bonding vertical
npm run sync:soup-bonding
```

---

## 17. REFERENCES

| Document | Purpose |
|----------|---------|
| `docs/CARS-NAMING.md` | Product naming canonical |
| `docs/soup-world-design.md` | World architecture, zones, audio |
| `cars-contract/p31.carsWire.json` | WebSocket protocol spec |
| `src/soup.ts` | Main SoupEngine implementation |
| `src/soupPhysics.ts` | Physics core |
| `spikes/mock-ws-server/server.js` | Test server |

---

**END OF SPECIFICATION**
