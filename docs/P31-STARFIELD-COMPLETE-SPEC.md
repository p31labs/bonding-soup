# P31 Starfield — Complete Technical Specification
**Ambient canvas mesh (“weather,” not notifications)**  
**Version:** 1.1.0  
**Date:** 2026-05-03

---

## 1. OVERVIEW

The P31 Starfield is a 2D canvas-based ambient background system that creates a living, breathing "molecular mesh" visualization. It responds to the operator's cognitive state (spoon count), system voltage, and real-time events — creating ambient "weather" rather than intrusive notifications.

### Philosophy
- **Weather, not notifications:** The starfield creates ambient atmosphere, not alerts
- **Spoon-responsive:** Particle density, speed, and color shift based on operator energy
- **Calm technology:** Respects `prefers-reduced-motion`, safe mode dims everything
- **Living mesh:** Particles form transient connections, breathe, and respond to touch

---

## 2. ARCHITECTURE

### 2.1 Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    P31 STARFIELD SYSTEM                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐      ┌──────────────────────────────┐ │
│  │  p31-starfield  │      │      p31-mesh-touches        │ │
│  │     .js         │◄────►│        .js                  │ │
│  │                 │      │  (moon, FERS, birthdays,     │ │
│  │  - init         │      │   calcium window, deep      │ │
│  │  - config       │      │   work, empty room, etc)   │ │
│  │  - render loop  │      │                              │ │
│  └─────────────────┘      └──────────────────────────────┘ │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────┐      ┌──────────────────────────────┐ │
│  │   Canvas 2D     │      │     External Inputs          │ │
│  │   Context       │◄─────┤  - API: api.phosphorus31.org │ │
│  │                 │      │  - localStorage             │ │
│  │  - Particles    │      │  - BroadcastChannel         │ │
│  │  - Connections  │      │  - Pointer/touch events     │ │
│  │  - Bursts       │      │                              │ │
│  │  - Hearth glow  │      │                              │ │
│  └─────────────────┘      └──────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 File Structure

```
design-assets/starfield/
├── p31-starfield.js              # Core engine (ES module)
├── p31-starfield.css             # Canvas sizing + reduced-motion
├── demo.html                     # Interactive demo
└── p31-starfield-static-plate.js # Non-module fallback

design-assets/atmosphere/
├── p31-mesh-touches.js           # Touch behaviors (23 types)
├── p31-atmosphere-hints-boot.js  # Boot helpers
└── p31-canon-starfield-presets.json # Voltage presets
```

---

## 3. CONFIGURATION SYSTEM

### 3.1 StarfieldConfig Interface

```typescript
interface StarfieldConfig {
  count: number;        // Particle count (12-100)
  speed: number;        // Drift speed (0.005-0.3)
  connR: number;        // Connection radius (30-120)
  hearthA: number;      // Hearth alpha (0.01-0.08)
  tealGlowA: number;    // Teal glow alpha (0.008-0.04)
  coralRatio: number;   // Coral particle ratio (0.1-0.92)
  baseAlpha: number;    // Base particle alpha (0.06-0.35)
  breathRate: number;   // Hearth breath rate (0.0004-0.001)
  dimFactor: number;    // Global dim (0.15-1.0)
}
```

### 3.2 Spoon-Based States

| Spoons | State | Particles | Speed | Coral | Visual Character |
|--------|-------|-----------|-------|-------|------------------|
| 10-12+ | Nominal | ~80 | 0.15 | 15% | Bright, fast, teal-dominant |
| 5-7 | Moderate | ~50 | 0.08 | 30% | Medium, calmer |
| ≤3 | Depleted | ~25 | 0.03 | 60% | Sparse, slow, coral-heavy |
| Safe mode | Safe | ~12 | 0.005 | 10% | Nearly static, very dim |

### 3.3 Configuration Factory

```javascript
// configFromSpoons(spoons, safeMode)
export function configFromSpoons(spoons, safeMode = false) {
  const s = Math.max(0, Math.min(12, Number(spoons) || 8));
  
  if (safeMode) {
    return {
      count: 12,
      speed: 0.005,
      connR: 30,
      hearthA: 0.01,
      tealGlowA: 0.008,
      coralRatio: 0.1,
      baseAlpha: 0.06,
      breathRate: 0.0004,
      dimFactor: 0.15,
    };
  }
  
  if (s <= 3) {
    return {
      count: 25,
      speed: 0.03,
      connR: 40,
      hearthA: 0.02,
      tealGlowA: 0.012,
      coralRatio: 0.6,
      baseAlpha: 0.1,
      breathRate: 0.0006,
      dimFactor: 0.4,
    };
  }
  
  if (s <= 7) {
    return {
      count: 50,
      speed: 0.08,
      connR: 60,
      hearthA: 0.035,
      tealGlowA: 0.016,
      coralRatio: 0.3,
      baseAlpha: 0.18,
      breathRate: 0.00075,
      dimFactor: 0.7,
    };
  }
  
  // Default: 8+ spoons
  return {
    count: 80,
    speed: 0.15,
    connR: 80,
    hearthA: 0.04,
    tealGlowA: 0.02,
    coralRatio: 0.15,
    baseAlpha: 0.25,
    breathRate: 0.0008,
    dimFactor: 1,
  };
}
```

### 3.4 Voltage Modifiers

```javascript
export function applyVoltageToConfig(voltage, base) {
  const v = String(voltage || "GREEN").toUpperCase();
  const c = { ...base };
  
  if (v === "AMBER") {
    c.coralRatio = Math.min(0.85, c.coralRatio + 0.2);
    c.dimFactor *= 0.92;
  }
  
  if (v === "RED") {
    c.coralRatio = Math.min(0.92, c.coralRatio + 0.35);
    c.dimFactor *= 0.88;
  }
  
  return c;
}
```

| Voltage | Effect |
|---------|--------|
| GREEN | Nominal — no change |
| AMBER | +20% coral ratio, slightly dimmer |
| RED | +35% coral ratio, dimmer, hostile ring on burst |

---

## 4. RENDERING SYSTEM

### 4.1 Visual Layers (Bottom to Top)

```
1. CLEAR — Canvas cleared each frame
2. HEARTH GLOW — Bottom-centered radial gradient (coral)
3. TEAL GLOW — Upper-left radial gradient (trust)
4. ACCOMMODATION NIGHT — Subtle white shimmer (if active)
5. FLASH WAVE — Hostile ring expansion (RED voltage)
6. CONNECTION LINES — Between nearby particles
7. REMEMBRANCE STARS — Warm white fixed points
8. CONSTELLATION — User-defined fixed stars
9. BONDING OVERLAY — K4 molecule visualization
10. EMPTY ROOM ORB — Converged particles (cold mesh)
11. PARTICLES — Ambient drifting dots
12. BURSTS — Event-driven particle explosions
```

### 4.2 Color Palette

```javascript
const TEAL = [77, 184, 168];        // Trust, calm — #4db8a8
const CORAL = [204, 98, 71];        // Warmth, urgency — #cc6247
const PHOSPHOR = [59, 163, 114];   // Belonging, success — #3ba372
const BUTTER = [205, 168, 82];     // Soft attention — #cda852
const WHITE = [255, 255, 255];     // Genesis flash
const GOLD = [175, 200, 140];      // Calcium window active

// Remembrance (warm white for memorial)
const REMEMBRANCE_RGB = [245, 240, 232]; // #f5f0e8
```

### 4.3 Particle System

```javascript
// Particle structure
{
  x: number,        // Position
  y: number,
  r: number,        // Radius (0.35-1.55)
  vx: number,       // Velocity
  vy: number,
  a: number,        // Alpha
  color: [r,g,b],   // RGB array
  life: null,       // null = ambient, number = burst
  birthdayPin: null // Birthday mode positioning
}
```

### 4.4 Connection Algorithm

```javascript
// Draw lines between nearby particles
for (let i = 0; i < particles.length; i++) {
  for (let j = i + 1; j < particles.length; j++) {
    const a = particles[i];
    const b = particles[j];
    
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < connectionRadius) {
      // Line opacity based on distance (closer = brighter)
      const alpha = 0.042 * (1 - distance / connectionRadius);
      drawLine(a, b, alpha);
    }
  }
}
```

### 4.5 Hearth Breath

The hearth glow pulses using a sine wave based on the breath rate:

```javascript
const breathPhase = Math.sin(t * breathRate) * 0.5 + 0.5;
const hearthAlpha = cfg.hearthA * (0.8 + breathPhase * 0.4);

// Radial gradient from bottom center
const gradient = ctx.createRadialGradient(
  w / 2, h * 0.92, 0,      // Center (bottom)
  w / 2, h * 0.92, h * 0.75 // Radius
);
```

---

## 5. EVENT BURSTS

### 5.1 Burst Types

| Type | Trigger | Color | Count | Visual |
|------|---------|-------|-------|--------|
| `ping` | System pulse | Teal | 15 | Random center burst |
| `med` | Medication taken | Phosphor | 8 | Bottom center, logs time |
| `agent` | AI agent activity | Teal | 6 | Upper right |
| `hostile` | Security event | Coral | 18 | Ring wave + explosion |
| `love` | L.O.V.E. token | Butter | 12 | Warm burst |
| `bonding` | Family connection | Phosphor | 10 | K4 molecule |
| `touch` | User tap | Teal | 6 | Tap location |

### 5.2 Burst Implementation

```javascript
function fireBurst(type, meta = {}) {
  let cx = w / 2;
  let cy = h / 2;
  let color = TEAL;
  let count = 12;
  let spread = 90;
  
  switch (type) {
    case 'ping':
      color = TEAL;
      count = 15;
      spread = 120;
      cx = w * (0.28 + Math.random() * 0.44);
      cy = h * (0.28 + Math.random() * 0.44);
      break;
      
    case 'med':
      color = PHOSPHOR;
      count = 8;
      spread = 70;
      cx = w * 0.5;
      cy = h * 0.72;
      // Log to localStorage
      localStorage.setItem('p31.lastMedTs', String(Date.now()));
      break;
      
    case 'hostile':
      flashWave = { t: 0, cx: w / 2, cy: h / 2 };
      color = CORAL;
      count = 18;
      spread = 200;
      break;
  }
  
  // Create burst particles
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * spread * 0.35;
    
    bursts.push({
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      r: Math.random() * 1.8 + 0.6,
      vx: Math.cos(angle) * (0.4 + Math.random() * 1.2),
      vy: Math.sin(angle) * (0.4 + Math.random() * 1.2),
      a: 0.75,
      color: [...color],
      life: 1,
    });
  }
}
```

---
## 6. MESH TOUCHES (23 Behaviors)

### 6.1 Touch Categories

```javascript
// From p31-mesh-touches.js

// 1. Celestial
moonOpacityMultiplier()       // Moon phase dims field
birthdayTouchMode()           // Birthday patterns (bash, willow, whisper)

// 2. Physiological  
calciumWindowActive()         // Gold hearth during Ca window
calciumHearthGoldMix()        // Blend coral → gold
calciumNightDose()            // Night medication shimmer

// 3. Temporal
fersDriftBias()               // Seasonal drift (FERS filing)
recordMeshActivity()          // Activity constellation

// 4. Cognitive
loadConstellation()           // Persistent user stars
pushConstellationPoint()      // Add star on med/agent

// 5. State
meshEdgesCold48h()            // Empty room detection
breathRateFromHeartRate()     // Hearth from resting HR

// 6. System
poetsParticleColor()          // Tone-matched poet star
bondingMoleculeGeometry()     // K4 molecule for bonding
mergeApiTouchHints()          // Combine all hints
```

### 6.2 Empty Room Convergence

When all mesh edges are cold for 48h, particles converge to center:

```javascript
// Phase 1: converging
for (const p of particles) {
  p.x += (center.x - p.x) * 0.008;
  p.y += (center.y - p.y) * 0.008;
}

// When close enough, becomes merged orb
if (maxDistance < 28) {
  mergedOrb = { x: center.x, y: center.y, r: 6, a: 0.85 };
  emptyRoomPhase = "merged";
}

// Phase 2: merged — single pulsing orb

// Phase 3: explode (when edges warm)
seedAmbient();  // Respawn particles
fireBurst("ping");
```

---

## 7. API REFERENCE

### 7.1 Initialization

```javascript
import { initStarfield, resolveStarfieldConfig } from './p31-starfield.js';

// Get config from API
const { config, hints } = await resolveStarfieldConfig(
  'https://api.phosphorus31.org/api/state'
);

// Or use spoon-based config
import { configFromSpoons } from './p31-starfield.js';
const config = configFromSpoons(8, false); // 8 spoons, not safe mode

// Initialize
const canvas = document.getElementById('starfield');
const api = initStarfield(canvas, config, {
  surface: 'hub',           // 'hub' | 'poets' | 'ops'
  touchRipple: true,        // Enable tap bursts
  connectionAudio: true,    // Audio feedback on connections
  poetsMode: false,         // Reduced particles + poet star
  poetsQuoteTone: 'fuller', // 'fuller' | 'operator' | 'children'
  pulsePollUrl: null,       // Optional command center URL
});
```

### 7.2 Runtime API

```javascript
// Update config
api.setConfig({ count: 50, coralRatio: 0.3 });

// Fire bursts
api.fireBurst('ping');
api.fireBurst('med');
api.fireBurst('love');
api.fireBurst('hostile');

// Mesh touch integration
api.ingestTouchHints({
  calciumWindowActive: true,
  restingHr: 62,
  bereavementActive: false,
});

// Pulse effects
api.pulseCommit();                    // Commit shimmer
api.pulseGenesis();                   // White flash on random particle
api.pulseAccommodationShimmer();      // 5s white shimmer
api.spoonSunrise();                   // Respawn with fade-in

// State toggles
api.setDeepWork(true);                // Disable connections
api.setAccommodationNight(true);      // Night shimmer
api.setBondingMolecule('family');     // K4 overlay
api.setPoetsTone('children');         // Change poet color

// Audio
api.playBookmarkChime();              // 863Hz Larmor tone

// Proximity
api.setPhysicalK4Proximity(true);     // NFC tag detected

// Cleanup
api.destroy();
```

---

## 8. HTML/CSS INTEGRATION

### 8.1 Basic Setup

```html
<!DOCTYPE html>
<html lang="en" data-p31-appearance="hub">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Starfield Demo</title>
  <link rel="stylesheet" href="p31-starfield.css">
  <style>
    /* Page background */
    html, body {
      margin: 0;
      min-height: 100vh;
      background: #05080c;
      color: #e8e6e3;
    }
    
    /* Starfield container */
    #starfield-wrap {
      position: fixed;
      inset: 0;
      z-index: 0;
      pointer-events: none;
    }
    
    /* Content above starfield */
    #content {
      position: relative;
      z-index: 1;
      pointer-events: auto;
    }
  </style>
</head>
<body>
  <!-- Starfield layer -->
  <div id="starfield-wrap">
    <canvas id="sf" class="p31-starfield-canvas" aria-hidden="true"></canvas>
  </div>
  
  <!-- Your content -->
  <main id="content">
    <h1>Your Page Content</h1>
  </main>

  <script type="module">
    import { initStarfield, configFromSpoons } from './p31-starfield.js';
    
    const canvas = document.getElementById('sf');
    const config = configFromSpoons(10, false); // 10 spoons, nominal
    
    const api = initStarfield(canvas, config, {
      touchRipple: true,
      connectionAudio: false,
    });
    
    // Example: Fire burst on button click
    document.getElementById('trigger').addEventListener('click', () => {
      api.fireBurst('ping');
    });
  </script>
</body>
</html>
```

### 8.2 CSS Reference

```css
/* p31-starfield.css */

/* Canvas fills container */
.p31-starfield-canvas {
  display: block;
  width: 100%;
  height: 100%;
  vertical-align: top;
}

/* Fixed full-viewport layer */
.p31-starfield-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .p31-starfield-canvas {
    animation: none;
  }
}
```

---

## 9. DEPLOYMENT

### 9.1 Sync Command

```bash
# Copy to hub public/lib/
npm run sync:p31-starfield

# Verifies with
npm run verify:starfield
```

### 9.2 Files Deployed

```
andromeda/04_SOFTWARE/p31ca/public/lib/
├── p31-starfield.js
├── p31-starfield.css
├── p31-mesh-touches.js
└── starfield-demo.html
```

### 9.3 Live Demo

**URL:** `https://p31ca.org/lib/starfield-demo.html`

---

## 10. COMPLETE SOURCE CODE

### 10.1 p31-starfield.js (Complete)

```javascript
/**
 * P31 Starfield — canvas 2D ambient mesh (weather, not notifications).
 * Mesh touches: docs/P31-STARFIELD-MESH-TOUCHES.md + p31-mesh-touches.js
 */
import * as MT from "./p31-mesh-touches.js";

export const P31_STARFIELD_VERSION = "1.1.0";

/** @typedef {{ count: number; speed: number; connR: number; hearthA: number; tealGlowA: number; coralRatio: number; baseAlpha: number; breathRate: number; dimFactor: number; }} StarfieldConfig */

export const DEFAULT_STARFIELD_CONFIG = /** @type {StarfieldConfig} */ ({
  count: 80,
  speed: 0.15,
  connR: 80,
  hearthA: 0.04,
  tealGlowA: 0.02,
  coralRatio: 0.15,
  baseAlpha: 0.25,
  breathRate: 0.0008,
  dimFactor: 1,
});

const TEAL = [77, 184, 168];
const CORAL = [204, 98, 71];
const PHOSPHOR = [59, 163, 114];
const BUTTER = [205, 168, 82];
const WHITE = [255, 255, 255];
const GOLD = [175, 200, 140];

/** Consecrated / remembered vertices */
export const P31_REMEMBRANCE_WARM_WHITE = "#f5f0e8";
export const REMEMBRANCE_RGB = [245, 240, 232];

export function configFromSpoons(spoons, safeMode = false) {
  const s = Math.max(0, Math.min(12, Number(spoons) || 8));
  if (safeMode) {
    return {
      count: 12,
      speed: 0.005,
      connR: 30,
      hearthA: 0.01,
      tealGlowA: 0.008,
      coralRatio: 0.1,
      baseAlpha: 0.06,
      breathRate: 0.0004,
      dimFactor: 0.15,
    };
  }
  if (s <= 3) {
    return {
      count: 25,
      speed: 0.03,
      connR: 40,
      hearthA: 0.02,
      tealGlowA: 0.012,
      coralRatio: 0.6,
      baseAlpha: 0.1,
      breathRate: 0.0006,
      dimFactor: 0.4,
    };
  }
  if (s <= 7) {
    return {
      count: 50,
      speed: 0.08,
      connR: 60,
      hearthA: 0.035,
      tealGlowA: 0.016,
      coralRatio: 0.3,
      baseAlpha: 0.18,
      breathRate: 0.00075,
      dimFactor: 0.7,
    };
  }
  return { ...DEFAULT_STARFIELD_CONFIG };
}

export function applyVoltageToConfig(voltage, base) {
  const v = String(voltage || "GREEN").toUpperCase();
  const c = { ...base };
  if (v === "AMBER") {
    c.coralRatio = Math.min(0.85, c.coralRatio + 0.2);
    c.dimFactor *= 0.92;
  }
  if (v === "RED") {
    c.coralRatio = Math.min(0.92, c.coralRatio + 0.35);
    c.dimFactor *= 0.88;
  }
  return c;
}

export async function resolveStarfieldConfig(apiUrl) {
  const url =
    apiUrl ||
    (typeof window !== "undefined" && window.__P31_STARFIELD_API__) ||
    "https://api.phosphorus31.org/api/state";
  try {
    const r = await fetch(url, { credentials: "omit", cache: "no-store" });
    if (!r.ok) throw new Error(String(r.status));
    const j = await r.json();
    const st = j?.state ?? j;
    const spoons = st?.current_spoons ?? st?.currentSpoons ?? 8;
    const safe = !!(st?.safe_mode_active ?? st?.safeModeActive);
    const voltage = st?.system_voltage ?? st?.systemVoltage ?? "GREEN";
    let cfg = configFromSpoons(spoons, safe);
    cfg = applyVoltageToConfig(voltage, cfg);
    const hints = MT.mergeApiTouchHints(st);
    return { config: cfg, hints };
  } catch {
    return { config: { ...DEFAULT_STARFIELD_CONFIG }, hints: {} };
  }
}

export async function resolveStarfieldConfigFlat(apiUrl) {
  const r = await resolveStarfieldConfig(apiUrl);
  return r.config;
}

function makeAmbient(w, h, cfg, coralRatio, birthdayMode) {
  const isCoral = Math.random() < coralRatio;
  let x = Math.random() * w;
  let y = Math.random() * h;
  if (birthdayMode === "bash") {
    const strip = Math.floor(Math.random() * 12);
    x = (strip / 12) * w * 0.85 + w * 0.075;
    y = (Math.random() * h * 0.35 + h * 0.55) * (0.92 + Math.random() * 0.08);
  } else if (birthdayMode === "willow") {
    const pair = Math.floor(Math.random() * 40);
    const px = (pair % 10) / 10;
    x = px * w * 0.9 + w * 0.05;
    y = ((pair % 2) * 0.04 + 0.45 + (Math.floor(pair / 10) % 5) * 0.08) * h;
  }
  return {
    x,
    y,
    r: Math.random() * 1.2 + 0.35,
    vx: (Math.random() - 0.5) * cfg.speed * 2,
    vy: (Math.random() - 0.5) * cfg.speed * 2,
    a: Math.random() * cfg.baseAlpha + 0.05,
    color: isCoral ? [...CORAL] : [...TEAL],
    life: null,
    birthdayPin: birthdayMode || null,
  };
}

export function initStarfield(canvas, config, options = {}) {
  const ctx = canvas.getContext("2d");
  const surface = options.surface || "hub";
  const poetsMode = !!options.poetsMode;
  const allowRipple = options.touchRipple !== false;

  if (!ctx) {
    return createNoopApi();
  }

  let cfg = { ...config };
  let w = 0;
  let h = 0;
  let dpr = 1;
  let particles = [];
  let bursts = [];
  let fixedStars = MT.loadConstellation();
  let remembranceStars = [];
  let flashWave = null;
  let raf = 0;
  let running = true;
  let lastT = performance.now();
  let reducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let touchHints = {};
  let birthdayMode = MT.birthdayTouchMode();
  let fersBias = MT.fersDriftBias(new Date(), false);
  let moonMul = MT.moonOpacityMultiplier();
  let calciumGold = 0;
  let deepWork = false;
  let restingHrBr = null;
  let emptyRoomPhase = "off";
  let emptyRoomCenter = { x: 0, y: 0 };
  let mergedOrb = null;
  let sessionStart = performance.now();
  let sessionWarmthBonus = 0;
  let shimmerUntil = 0;
  let commitPulseUntil = 0;
  let sunrisePhase = null;
  let accommodationNight = false;
  let bondingOverlay = null;
  let bondingOverlayUntil = 0;
  let physicalK4Near = false;
  let physicalK4NearUntil = 0;
  let lastProximityNotifyMs = 0;
  let genesisFlashIdx = -1;
  let genesisFlashFrames = 0;
  let prevConnKeys = new Set();
  let audioCtx = null;
  let audioWarm = false;
  let poetsTone = options.poetsQuoteTone || "fuller";
  let poetParticle = null;

  const connAudio = !!options.connectionAudio && surface !== "poets";

  function layout() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.max(1, rect.width);
    h = Math.max(1, rect.height);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    emptyRoomCenter = { x: w / 2, y: h / 2 };
  }

  function warmAudio() {
    if (audioWarm || typeof AudioContext === "undefined") return;
    try {
      audioCtx = new AudioContext();
      audioWarm = true;
    } catch {
      /* ignore */
    }
  }

  function playTick(freq = 880, dur = 0.012) {
    if (!connAudio || reducedMotion || !audioCtx) return;
    try {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      g.gain.value = 0.02;
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start();
      o.stop(audioCtx.currentTime + dur);
    } catch {
      /* ignore */
    }
  }

  function playTone(freq, dur, vol = 0.08) {
    if (!audioCtx) return;
    try {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      g.gain.value = vol;
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start();
      o.stop(audioCtx.currentTime + dur);
    } catch {
      /* ignore */
    }
  }

  function makeBurstParticle(cx0, cy0, color, spread) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * spread * 0.35;
    return {
      x: cx0 + Math.cos(angle) * dist,
      y: cy0 + Math.sin(angle) * dist,
      r: Math.random() * 1.8 + 0.6,
      vx: Math.cos(angle) * (0.4 + Math.random() * 1.2),
      vy: Math.sin(angle) * (0.4 + Math.random() * 1.2),
      a: 0.75,
      color: [...color],
      life: 1,
    };
  }

  function seedAmbient() {
    particles = [];
    birthdayMode = MT.birthdayTouchMode();
    fersBias = MT.fersDriftBias(new Date(), !!touchHints.fersFiled);
    moonMul = MT.moonOpacityMultiplier();
    const mobile =
      typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches;
    const n = poetsMode ? 16 : mobile ? Math.round(cfg.count * 0.62) : cfg.count;
    for (let i = 0; i < n; i++) particles.push(makeAmbient(w, h, cfg, cfg.coralRatio, birthdayMode));
    if (poetsMode) {
      const col = MT.poetsParticleColor(poetsTone);
      poetParticle = {
        x: w * 0.5,
        y: h * 0.42,
        r: 2.2,
        vx: (Math.random() - 0.5) * cfg.speed * 0.35,
        vy: (Math.random() - 0.5) * cfg.speed * 0.35,
        a: 0.42,
        color: col,
        life: null,
        poet: true,
      };
    } else poetParticle = null;
  }

  function syncAmbientCount() {
    const mobile =
      typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches;
    const target = poetsMode ? 12 : mobile ? Math.round(cfg.count * 0.62) : cfg.count;
    while (particles.length > target) particles.pop();
    while (particles.length < target)
      particles.push(makeAmbient(w, h, cfg, cfg.coralRatio, birthdayMode));
    for (const p of particles) {
      if (p.poet) continue;
      p.vx = (Math.random() - 0.5) * cfg.speed * 2;
      p.vy = (Math.random() - 0.5) * cfg.speed * 2;
      p.color = Math.random() < cfg.coralRatio ? [...CORAL] : [...TEAL];
    }
  }

  function ingestHints(h) {
    touchHints = { ...touchHints, ...h };
    if (Array.isArray(h.remembranceFixedStars) && h.remembranceFixedStars.length > 0) {
      remembranceStars = h.remembranceFixedStars.map((p) => ({
        x: p.x,
        y: p.y,
        a: p.a,
      }));
    }
    if (h.restingHr != null) {
      const br = MT.breathRateFromHeartRate(h.restingHr);
      restingHrBr = br;
    }

    let lastMed = null;
    try {
      lastMed = Number(localStorage.getItem(MT.STORAGE.lastMedTs)) || null;
    } catch {
      lastMed = null;
    }
    let active =
      h.calciumWindowActive === true ||
      (h.calciumWindowActive !== false && MT.calciumWindowActive(Date.now(), lastMed));
    if (h.calciumWindowActive === false) active = false;
    calciumGold = MT.calciumHearthGoldMix(active, h.vyvanseSafe !== false);

    if (h.sentinelScene === "deep-work" || h.sentinelScene === "deep_work") deepWork = true;
    else if (h.sentinelScene) deepWork = false;

    let cold =
      h.meshAllEdgesCold48h === true ||
      (h.meshAllEdgesCold48h !== false && MT.meshEdgesCold48h(Date.now()));
    if (h.meshAllEdgesCold48h === false) cold = false;

    if (cold) {
      if (emptyRoomPhase === "off") emptyRoomPhase = "converging";
    } else if (emptyRoomPhase === "merged") {
      emptyRoomPhase = "explode";
    } else {
      emptyRoomPhase = "off";
      mergedOrb = null;
    }
  }

  function draw(t, dt) {
    const step = typeof dt === "number" && dt > 0 ? dt : 1;
    ctx.clearRect(0, 0, w, h);

    const breathRate = restingHrBr != null && !reducedMotion ? restingHrBr : cfg.breathRate;
    const breathPhase = Math.sin(t * breathRate) * 0.5 + 0.5;

    let dim = cfg.dimFactor * moonMul;
    if (sunrisePhase != null) {
      dim *= Math.min(1, sunrisePhase);
      sunrisePhase = Math.min(1, sunrisePhase + 0.022 * step);
      if (sunrisePhase >= 1) sunrisePhase = null;
    }

    const shimmer =
      shimmerUntil > t ? Math.sin(((t - (shimmerUntil - 5000)) / 5000) * Math.PI) * 0.15 + 1 : 1;
    const commitBoost = commitPulseUntil > t ? 1.1 : 1;

    sessionWarmthBonus = Math.min(0.05, Math.floor((t - sessionStart) / 3e5) * 0.01);

    const hearthAlpha =
      (cfg.hearthA + sessionWarmthBonus) * (0.8 + breathPhase * 0.4) * dim * shimmer * commitBoost;

    if (calciumGold > 0.05) {
      const grd = ctx.createRadialGradient(w / 2, h * 0.92, 0, w / 2, h * 0.92, h * 0.75);
      grd.addColorStop(0, `rgba(${GOLD[0]},${GOLD[1]},${GOLD[2]},${hearthAlpha * calciumGold})`);
      grd.addColorStop(0.35, `rgba(204,98,71,${hearthAlpha * (1 - calciumGold * 0.85)})`);
      grd.addColorStop(0.65, `rgba(204,98,71,${hearthAlpha * 0.35})`);
      grd.addColorStop(1, "rgba(5,8,12,0)");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);
    } else {
      const grd = ctx.createRadialGradient(w / 2, h * 0.92, 0, w / 2, h * 0.92, h * 0.75);
      grd.addColorStop(0, `rgba(204,98,71,${hearthAlpha})`);
      grd.addColorStop(0.5, `rgba(204,98,71,${hearthAlpha * 0.35})`);
      grd.addColorStop(1, "rgba(5,8,12,0)");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);
    }

    const grd2 = ctx.createRadialGradient(w * 0.42, h * 0.22, 0, w * 0.42, h * 0.22, h * 0.48);
    grd2.addColorStop(0, `rgba(37,137,125,${cfg.tealGlowA * dim})`);
    grd2.addColorStop(1, "rgba(5,8,12,0)");
    ctx.fillStyle = grd2;
    ctx.fillRect(0, 0, w, h);

    if (accommodationNight && !reducedMotion) {
      const glow = 0.04 * Math.sin((t / 1200) * Math.PI * 2) + 0.04;
      ctx.fillStyle = `rgba(255,255,255,${glow * dim})`;
      ctx.fillRect(0, 0, w, h);
    }

    if (flashWave && !reducedMotion) {
      flashWave.t += 0.028 * step;
      if (flashWave.t < 1) {
        const R = flashWave.t * Math.max(w, h) * 0.85;
        const alpha = (1 - flashWave.t) * 0.14;
        ctx.beginPath();
        ctx.arc(flashWave.cx, flashWave.cy, R, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(204,98,71,${alpha})`;
        ctx.lineWidth = 2.5 * (1 - flashWave.t);
        ctx.stroke();
      } else {
        flashWave = null;
      }
    }

    const effConn = deepWork ? 0 : poetsMode ? 0 : cfg.connR;

    const all = particles.concat(bursts);
    if (poetParticle) all.push(poetParticle);

    const currConn = new Set();
    if (effConn > 0 && !reducedMotion) {
      for (let i = 0; i < all.length; i++) {
        for (let j = i + 1; j < all.length; j++) {
          const a = all[i];
          const b = all[j];
          if (a.poet || b.poet) continue;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          let cr = effConn;
          if (a.life != null || b.life != null) cr *= 1.45;
          if (d2 > cr * cr) continue;
          const k = i < j ? `${i}-${j}` : `${j}-${i}`;
          currConn.add(k);
          const d = Math.sqrt(d2);
          let lineA = 0.042 * (1 - d / cr) * dim;
          if (a.life != null) lineA *= a.life * 2.5;
          if (b.life != null) lineA *= b.life * 2.5;
          const mc = a.life != null ? a.color : b.color;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(${mc[0]},${mc[1]},${mc[2]},${Math.min(lineA, 0.14)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
      if (connAudio && audioCtx && currConn.size > prevConnKeys.size) {
        let newN = 0;
        for (const k of currConn) {
          if (!prevConnKeys.has(k)) newN++;
        }
        if (newN > 0)
          playTick(660 + Math.min(220, newN * 30), 0.01 + Math.min(0.02, newN * 0.002));
      }
      prevConnKeys = currConn;
    } else {
      prevConnKeys = new Set();
    }

    const bereavementDim =
      touchHints.bereavementActive === true ? Math.min(1, dim * 1.08) : dim;
    for (const fs of remembranceStars) {
      ctx.beginPath();
      ctx.arc(fs.x * w, fs.y * h, 1.35, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${REMEMBRANCE_RGB[0]},${REMEMBRANCE_RGB[1]},${REMEMBRANCE_RGB[2]},${fs.a * bereavementDim})`;
      ctx.fill();
    }
    for (const fs of fixedStars) {
      ctx.beginPath();
      ctx.arc(fs.x * w, fs.y * h, 1.1, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(77,184,168,${fs.a * dim})`;
      ctx.fill();
    }

    if (bondingOverlay && bondingOverlayUntil > t && bondingOverlay.angles) {
      const cx = w * 0.5;
      const cy = h * 0.48;
      const rr = bondingOverlay.r || 40;
      ctx.strokeStyle = `rgba(59,163,114,${0.35 * dim})`;
      ctx.lineWidth = 1.2;
      for (let i = 0; i < bondingOverlay.angles.length; i++) {
        for (let j = i + 1; j < bondingOverlay.angles.length; j++) {
          const a1 = bondingOverlay.angles[i];
          const a2 = bondingOverlay.angles[j];
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a1) * rr, cy + Math.sin(a1) * rr);
          ctx.lineTo(cx + Math.cos(a2) * rr, cy + Math.sin(a2) * rr);
          ctx.stroke();
        }
      }
      for (const a of bondingOverlay.angles) {
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59,163,114,${0.55 * dim})`;
        ctx.fill();
      }
    }

    if (emptyRoomPhase === "converging" && !reducedMotion && !poetsMode) {
      const cx = emptyRoomCenter.x;
      const cy = emptyRoomCenter.y;
      for (const p of particles) {
        if (p.poet) continue;
        p.x += (cx - p.x) * 0.008 * step;
        p.y += (cy - p.y) * 0.008 * step;
      }
      let maxd = 0;
      for (const p of particles) {
        const d = Math.hypot(p.x - cx, p.y - cy);
        if (d > maxd) maxd = d;
      }
      if (maxd < 28 && particles.length > 1) {
        mergedOrb = { x: cx, y: cy, r: 6, a: 0.85 };
        emptyRoomPhase = "merged";
      }
    }

    if (emptyRoomPhase === "explode") {
      seedAmbient();
      fireBurst("ping", {});
      emptyRoomPhase = "off";
      mergedOrb = null;
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      if (!reducedMotion && emptyRoomPhase !== "merged") {
        p.x += (p.vx + fersBias.fx * cfg.speed * 8) * step;
        p.y += (p.vy + fersBias.fy * cfg.speed * 8) * step;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;
      }
      let col = p.color;
      if (genesisFlashIdx === i && genesisFlashFrames > 0) col = WHITE;
      const pa = p.a * dim * (0.72 + breathPhase * 0.28);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${pa})`;
      ctx.fill();
    }
    if (genesisFlashFrames > 0) genesisFlashFrames--;

    if (mergedOrb && emptyRoomPhase === "merged") {
      ctx.beginPath();
      ctx.arc(mergedOrb.x, mergedOrb.y, mergedOrb.r + breathPhase * 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(77,184,168,${mergedOrb.a * dim})`;
      ctx.fill();
    }

    if (poetParticle && !reducedMotion) {
      const pp = poetParticle;
      pp.x += pp.vx * step;
      pp.y += pp.vy * step;
      if (pp.x < 40) pp.vx = Math.abs(pp.vx);
      if (pp.x > w - 40) pp.vx = -Math.abs(pp.vx);
      if (pp.y < 40) pp.vy = Math.abs(pp.vy);
      if (pp.y > h - 40) pp.vy = -Math.abs(pp.vy);
      ctx.beginPath();
      ctx.arc(pp.x, pp.y, pp.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${pp.color[0]},${pp.color[1]},${pp.color[2]},${pp.a * dim})`;
      ctx.fill();
    }

    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i];
      if (!reducedMotion) {
        b.x += b.vx * step;
        b.y += b.vy * step;
        b.vx *= Math.pow(0.97, step);
        b.vy *= Math.pow(0.97, step);
        b.life -= 0.014 * step;
      } else {
        b.life -= 0.06;
      }
      if (b.life <= 0) {
        bursts.splice(i, 1);
        continue;
      }
      const ba = b.a * b.life * dim;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * b.life + 0.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${b.color[0]},${b.color[1]},${b.color[2]},${ba})`;
      ctx.fill();
    }
  }

  function frame(now) {
    if (!running) return;
    const dt = Math.min(3, (now - lastT) / 16.67);
    lastT = now;
    draw(now, dt);
    if (!reducedMotion) {
      raf = requestAnimationFrame(frame);
    }
  }

  function onResize() {
    layout();
    seedAmbient();
    fixedStars = MT.loadConstellation();
    if (reducedMotion) draw(0, 1);
  }

  function onVis() {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(raf);
    } else {
      running = true;
      lastT = performance.now();
      if (!reducedMotion) raf = requestAnimationFrame(frame);
      else draw(0, 1);
    }
  }

  function fireBurst(type, _meta = {}) {
    if (reducedMotion && type !== "hostile") return;
    let cx0 = w / 2;
    let cy0 = h / 2;
    let color = TEAL;
    let count = 12;
    let spread = 90;
    if (type === "ping") {
      color = TEAL;
      count = 15;
      spread = 120;
      cx0 = w * (0.28 + Math.random() * 0.44);
      cy0 = h * (0.28 + Math.random() * 0.44);
    } else if (type === "med") {
      color = PHOSPHOR;
      count = 8;
      spread = 70;
      cx0 = w * 0.5;
      cy0 = h * 0.72;
      try {
        localStorage.setItem(MT.STORAGE.lastMedTs, String(Date.now()));
      } catch {
        /* ignore */
      }
      MT.recordMeshActivity("med");
      MT.pushConstellationPoint(cx0 / w, cy0 / h);
      fixedStars = MT.loadConstellation();
    } else if (type === "agent") {
      color = TEAL;
      count = 6;
      spread = 45;
      cx0 = w * 0.72;
      cy0 = h * 0.22;
      MT.recordMeshActivity("agent");
    } else if (type === "hostile") {
      flashWave = { t: 0, cx: w / 2, cy: h / 2 };
      color = CORAL;
      count = 18;
      spread = 200;
    } else if (type === "love") {
      color = BUTTER;
      count = 12;
      spread = 100;
    } else if (type === "bonding") {
      color = PHOSPHOR;
      count = 10;
      spread = 85;
      MT.recordMeshActivity("bonding");
    } else if (type === "touch") {
      color = TEAL;
      count = 6;
      spread = 36;
    }
    for (let i = 0; i < count; i++) {
      bursts.push(makeBurstParticle(cx0, cy0, color, spread));
    }
  }

  function pointerRipple(ev) {
    if (!allowRipple || reducedMotion) return;
    const rect = canvas.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    warmAudio();
    fireBurst("touch", { x, y });
  }

  layout();
  seedAmbient();

  const mqRm = window.matchMedia("(prefers-reduced-motion: reduce)");
  const onRm = () => {
    reducedMotion = mqRm.matches;
  };
  if (typeof mqRm.addEventListener === "function") mqRm.addEventListener("change", onRm);
  else mqRm.addListener(onRm);

  window.addEventListener("resize", onResize);
  document.addEventListener("visibilitychange", onVis);
  if (allowRipple) canvas.addEventListener("pointerdown", pointerRipple);

  function onPageShow(ev) {
    if (!ev || !ev.persisted) return;
    running = true;
    lastT = performance.now();
    if (!reducedMotion) raf = requestAnimationFrame(frame);
    else draw(0, 1);
  }
  function onPageHide() {
    running = false;
    cancelAnimationFrame(raf);
  }
  window.addEventListener("pageshow", onPageShow);
  window.addEventListener("pagehide", onPageHide);

  if (reducedMotion) {
    draw(0, 1);
  } else {
    raf = requestAnimationFrame(frame);
  }

  let pulseTimer = null;
  if (options.pulsePollUrl && typeof options.pulsePollUrl === "string") {
    const pu = options.pulsePollUrl;
    async function pollPulse() {
      try {
        const r = await fetch(pu, { credentials: "omit", cache: "no-store" });
        if (r.status === 204 || r.status === 404) return;
        const j = await r.json();
        if (j && j.type === "bookmark") {
          warmAudio();
          try {
            audioCtx?.resume?.();
          } catch {
            /* ignore */
          }
          playTone(863, 0.1, 0.07);
        }
      } catch {
        /* offline */
      }
    }
    pulseTimer = setInterval(() => void pollPulse(), 9000);
    void pollPulse();
  }

  const uninstallChannel = MT.installMeshTouchChannel((msg) => {
    if (!msg || typeof msg !== "object") return;
    if (msg.type === "commit") {
      commitPulseUntil = performance.now() + 220;
    } else if (msg.type === "genesis") {
      genesisFlashIdx = particles.length ? Math.floor(Math.random() * particles.length) : -1;
      genesisFlashFrames = 2;
    } else if (msg.type === "shimmer") {
      shimmerUntil = performance.now() + 5000;
    } else if (msg.type === "sunrise") {
      sunrisePhase = 0.001;
      seedAmbient();
    } else if (msg.type === "warm-edge") {
      cfg.connR *= 1.35;
      setTimeout(() => {
        cfg.connR = Math.min(120, cfg.connR / 1.35);
      }, 380);
    }
  });

  function destroyInner() {
    running = false;
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", onResize);
    document.removeEventListener("visibilitychange", onVis);
    window.removeEventListener("pageshow", onPageShow);
    window.removeEventListener("pagehide", onPageHide);
    if (allowRipple) canvas.removeEventListener("pointerdown", pointerRipple);
    if (typeof mqRm.removeEventListener === "function") mqRm.removeEventListener("change", onRm);
    else mqRm.removeListener(onRm);
    uninstallChannel();
    if (pulseTimer) clearInterval(pulseTimer);
    try {
      audioCtx?.close();
    } catch {
      /* ignore */
    }
  }

  return {
    destroy: destroyInner,
    setConfig: (partial) => {
      cfg = { ...cfg, ...partial };
      syncAmbientCount();
      if (reducedMotion) draw(0, 1);
    },
    fireBurst,
    ingestTouchHints: ingestHints,
    pulseCommit: () => {
      commitPulseUntil = performance.now() + 220;
      MT.broadcastMeshTouch({ type: "commit" });
    },
    pulseGenesis: () => {
      genesisFlashIdx = particles.length ? Math.floor(Math.random() * particles.length) : -1;
      genesisFlashFrames = 2;
      MT.broadcastMeshTouch({ type: "genesis" });
    },
    pulseAccommodationShimmer: () => {
      shimmerUntil = performance.now() + 5000;
      MT.broadcastMeshTouch({ type: "shimmer" });
    },
    spoonSunrise: () => {
      sunrisePhase = 0.02;
      seedAmbient();
      MT.broadcastMeshTouch({ type: "sunrise" });
    },
    notifyWarmEdge: () => {
      MT.broadcastMeshTouch({ type: "warm-edge" });
      cfg.connR = Math.min(120, cfg.connR * 1.35);
      setTimeout(() => syncAmbientCount(), 400);
    },
    setBondingMolecule: (key) => {
      const g = MT.bondingMoleculeGeometry(key);
      if (g) {
        bondingOverlay = { angles: g.angles, r: g.r };
        bondingOverlayUntil = performance.now() + 2000;
      }
    },
    setDeepWork: (on) => {
      deepWork = !!on;
    },
    setPoetsTone: (tone) => {
      poetsTone = tone || "fuller";
      if (poetParticle) poetParticle.color = [...MT.poetsParticleColor(poetsTone)];
    },
    playBookmarkChime: () => {
      warmAudio();
      playTone(863, 0.1, 0.07);
    },
    setAccommodationNight: (night) => {
      accommodationNight = !!night;
    },
    setPhysicalK4Proximity: (near) => {
      physicalK4Near = !!near;
      physicalK4NearUntil = performance.now() + (physicalK4Near ? 14e3 : 0);
      if (!physicalK4Near || reducedMotion) return;
      const now = performance.now();
      if (now - lastProximityNotifyMs < 4e3) return;
      lastProximityNotifyMs = now;
      MT.broadcastMeshTouch({ type: "warm-edge" });
      cfg.connR = Math.min(120, cfg.connR * 1.08);
      setTimeout(() => syncAmbientCount(), 500);
    },
  };
}

function createNoopApi() {
  const noop = () => {};
  return {
    destroy: noop,
    setConfig: noop,
    fireBurst: noop,
    ingestTouchHints: noop,
    pulseCommit: noop,
    pulseGenesis: noop,
    pulseAccommodationShimmer: noop,
    spoonSunrise: noop,
    notifyWarmEdge: noop,
    setBondingMolecule: noop,
    setDeepWork: noop,
    setPoetsTone: noop,
    playBookmarkChime: noop,
    setAccommodationNight: noop,
    setPhysicalK4Proximity: noop,
  };
}

export default {
  initStarfield,
  resolveStarfieldConfig,
  resolveStarfieldConfigFlat,
  configFromSpoons,
  applyVoltageToConfig,
  DEFAULT_STARFIELD_CONFIG,
  P31_STARFIELD_VERSION,
};
```

### 10.2 p31-starfield.css (Complete)

```css
/**
 * P31 Starfield — canvas base layer (pair with p31-starfield.js).
 * Include after void/surface background on the host page.
 */

.p31-starfield-canvas {
  display: block;
  width: 100%;
  height: 100%;
  vertical-align: top;
}

/* Fixed full-viewport ambient (hub, ops shell) */
.p31-starfield-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

@media (prefers-reduced-motion: reduce) {
  .p31-starfield-canvas {
    animation: none;
  }
}
```

---

## 11. VERIFICATION

```bash
# Verify starfield files are present
npm run verify:starfield

# Sync to hub
npm run sync:p31-starfield
```

---

## 12. REFERENCES

- **Spec:** `docs/P31-STARFIELD.md`
- **Mesh touches (23 behaviors):** `docs/P31-STARFIELD-MESH-TOUCHES.md`
- **Live demo:** `https://p31ca.org/lib/starfield-demo.html`
- **Canon:** `design-assets/atmosphere/p31-canon-starfield-presets.json`

---

**END OF SPECIFICATION**
