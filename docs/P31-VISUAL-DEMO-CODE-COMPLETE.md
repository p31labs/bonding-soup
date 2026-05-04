
---

# 3. C.A.R.S. Social Molecules

## 3.1 Atom and Bond Interfaces

```typescript
// soupPhysics.ts — Core physics types
export interface Atom {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  element: string;
  color: string;
  radius: number;
  mass: number;
  charge: number;
}

export interface Bond {
  atom1: Atom;
  atom2: Atom;
  restLength: number;
  strength: number;
}

export interface PhysicsConfig {
  width: number;
  height: number;
  physicsHz: number;
  renderHz: number;
  cellSize: number;
  debug?: boolean;
  lodThresholds: {
    fpsLow: number;
    consecutiveFrames: number;
  };
}
```

## 3.2 SoupPhysics Engine

```typescript
export class SoupPhysics {
  private atoms: Atom[] = [];
  private bonds: Bond[] = [];
  private spatialGrid = new Map<string, Atom[]>();
  private physicsAccumulator = 0;
  private lodLevel = 0;
  private consecutiveLowFps = 0;
  private lastFps = 60;
  private frameCount = 0;
  private physicsCount = 0;
  private lastFrameTime = performance.now();

  constructor(private config: PhysicsConfig) {}

  getWorldSize(): { width: number; height: number } {
    return { width: this.config.width, height: this.config.height };
  }

  addMolecule(atoms: Atom[], bonds: Bond[] = []) {
    this.atoms.push(...atoms);
    this.bonds.push(...bonds);
  }

  removeMolecule(atomIds: string[]) {
    this.atoms = this.atoms.filter(atom => !atomIds.includes(atom.id));
    this.bonds = this.bonds.filter(bond =>
      !atomIds.includes(bond.atom1.id) && !atomIds.includes(bond.atom2.id)
    );
  }

  update(deltaTime: number) {
    // Accumulate time for fixed physics timestep
    this.physicsAccumulator += deltaTime / 1000;

    // Run physics at target Hz (skip if lagging)
    let physicsTicks = 0;
    while (this.physicsAccumulator >= (1 / this.config.physicsHz) && physicsTicks < 5) {
      this.fixedUpdate(1 / this.config.physicsHz);
      this.physicsAccumulator -= (1 / this.config.physicsHz);
      this.physicsCount++;
      physicsTicks++;
    }

    // Update performance monitoring
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFrameTime >= 1000) {
      this.lastFps = Math.round((this.frameCount * 1000) / (now - this.lastFrameTime));
      this.updateLOD();
      this.frameCount = 0;
      this.lastFrameTime = now;
    }
  }

  private fixedUpdate(dt: number) {
    // Clear spatial grid
    this.spatialGrid.clear();

    // Update atom positions and build spatial grid
    this.atoms.forEach(atom => {
      this.updateAtomPhysics(atom, dt);

      // Add to spatial grid for collision detection
      const cellX = Math.floor(atom.x / this.config.cellSize);
      const cellY = Math.floor(atom.y / this.config.cellSize);
      const cellKey = `${cellX},${cellY}`;

      if (!this.spatialGrid.has(cellKey)) {
        this.spatialGrid.set(cellKey, []);
      }
      this.spatialGrid.get(cellKey)!.push(atom);
    });

    // Update bonds (spring forces)
    this.bonds.forEach(bond => {
      this.updateBond(bond);
    });

    // Handle collisions using spatial hashing
    this.handleCollisions();
  }

  private updateAtomPhysics(atom: Atom, dt: number) {
    // Apply velocity damping based on LOD
    const damping = 0.98 - (this.lodLevel * 0.05);
    atom.vx *= damping;
    atom.vy *= damping;

    // Update position
    atom.x += atom.vx * dt * 100;
    atom.y += atom.vy * dt * 100;

    // Boundary wrapping (toroidal world)
    if (atom.x < 0) atom.x += this.config.width;
    if (atom.x >= this.config.width) atom.x -= this.config.width;
    if (atom.y < 0) atom.y += this.config.height;
    if (atom.y >= this.config.height) atom.y -= this.config.height;
  }

  private updateBond(bond: Bond) {
    const dx = bond.atom2.x - bond.atom1.x;
    const dy = bond.atom2.y - bond.atom1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      const force = (distance - bond.restLength) * bond.strength * (1 - this.lodLevel * 0.2);
      const fx = (dx / distance) * force;
      const fy = (dy / distance) * force;

      bond.atom1.vx += fx / bond.atom1.mass;
      bond.atom1.vy += fy / bond.atom1.mass;
      bond.atom2.vx -= fx / bond.atom2.mass;
      bond.atom2.vy -= fy / bond.atom2.mass;
    }
  }

  private handleCollisions() {
    const processedPairs = new Set<string>();

    this.atoms.forEach(atom => {
      const cellX = Math.floor(atom.x / this.config.cellSize);
      const cellY = Math.floor(atom.y / this.config.cellSize);

      // Check neighboring cells (3x3 grid)
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const neighborCellKey = `${cellX + dx},${cellY + dy}`;
          const neighbors = this.spatialGrid.get(neighborCellKey);

          if (neighbors) {
            neighbors.forEach(otherAtom => {
              if (atom.id === otherAtom.id) return;

              const pairKey = [atom.id, otherAtom.id].sort().join('-');
              if (processedPairs.has(pairKey)) return;
              processedPairs.add(pairKey);

              this.resolveCollision(atom, otherAtom);
            });
          }
        }
      }
    });
  }

  private resolveCollision(atom1: Atom, atom2: Atom) {
    const dx = atom2.x - atom1.x;
    const dy = atom2.y - atom1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = atom1.radius + atom2.radius;

    if (distance < minDistance && distance > 0) {
      // Separate overlapping atoms
      const overlap = minDistance - distance;
      const separationX = (dx / distance) * overlap * 0.5;
      const separationY = (dy / distance) * overlap * 0.5;

      atom1.x -= separationX;
      atom1.y -= separationY;
      atom2.x += separationX;
      atom2.y += separationY;

      // Apply repulsive force
      const force = overlap * 0.1 * (1 - this.lodLevel * 0.3);
      const fx = (dx / distance) * force;
      const fy = (dy / distance) * force;

      atom1.vx -= fx / atom1.mass;
      atom1.vy -= fy / atom1.mass;
      atom2.vx += fx / atom2.mass;
      atom2.vy += fy / atom2.mass;
    }
  }

  private updateLOD() {
    if (this.lastFps < this.config.lodThresholds.fpsLow) {
      this.consecutiveLowFps++;
      if (this.consecutiveLowFps >= this.config.lodThresholds.consecutiveFrames) {
        this.lodLevel = Math.min(2, this.lodLevel + 1);
        this.consecutiveLowFps = 0;
        this.config.cellSize = Math.min(100, this.config.cellSize * 1.5);
      }
    } else {
      this.consecutiveLowFps = 0;
      if (this.lastFps > this.config.lodThresholds.fpsLow + 10 && this.lodLevel > 0) {
        this.lodLevel = Math.max(0, this.lodLevel - 1);
        this.config.cellSize = Math.max(25, this.config.cellSize / 1.5);
      }
    }
  }

  getAtoms(): Atom[] { return this.atoms; }
  getBonds(): Bond[] { return this.bonds; }
  getLODLevel(): number { return this.lodLevel; }
  getFPS(): number { return this.lastFps; }
  
  getStats() {
    return {
      atoms: this.atoms.length,
      bonds: this.bonds.length,
      lodLevel: this.lodLevel,
      fps: this.lastFps,
      physicsHz: this.physicsCount,
      cellSize: this.config.cellSize
    };
  }
}

// Default C.A.R.S. configuration
export const DEFAULT_SOUP_CONFIG: PhysicsConfig = {
  width: 4000,
  height: 4000,
  physicsHz: 30,
  renderHz: 60,
  cellSize: 50,
  lodThresholds: {
    fpsLow: 50,
    consecutiveFrames: 3
  }
};
```

## 3.3 Emotional Zones Configuration

```typescript
// Zone definitions for C.A.R.S.
export interface Zone {
  name: string;
  x: number;
  y: number;
  radius: number;
  effects: {
    velocityMultiplier: number;
    cognitiveLoadModifier: number;
    arousalModifier: number;
  };
  visualEffects?: {
    breathingRhythm?: {
      enabled: boolean;
      pattern: number[]; // [inhale, hold, exhale] in seconds
      phase: number;
      amplitude: number;
    };
    particleDensity?: number;
    lighting?: {
      brightness: number;
      color: string;
    };
  };
}

// Default zones (diamond layout)
const DEFAULT_ZONES: Zone[] = [
  {
    name: 'calm',
    x: 0.2, y: 0.5, // Left
    radius: 0.28,
    effects: {
      velocityMultiplier: 0.4,
      cognitiveLoadModifier: -0.3,
      arousalModifier: -0.2
    },
    visualEffects: {
      breathingRhythm: {
        enabled: true,
        pattern: [4, 4, 6], // 4s inhale, 4s hold, 6s exhale
        phase: 0,
        amplitude: 0.15
      },
      particleDensity: 1.5,
      lighting: { brightness: 1.2, color: '#1a1a2a' }
    }
  },
  {
    name: 'lab',
    x: 0.5, y: 0.25, // Top
    radius: 0.28,
    effects: {
      velocityMultiplier: 1.0,
      cognitiveLoadModifier: 0.2,
      arousalModifier: 0.1
    },
    visualEffects: {
      particleDensity: 0.8,
      lighting: { brightness: 1.3, color: '#2a2a3a' }
    }
  },
  {
    name: 'kitchen',
    x: 0.8, y: 0.5, // Right
    radius: 0.28,
    effects: {
      velocityMultiplier: 1.0,
      cognitiveLoadModifier: 0.1,
      arousalModifier: -0.1
    },
    visualEffects: {
      particleDensity: 1.2,
      lighting: { brightness: 1.1, color: '#3a2a1a' }
    }
  },
  {
    name: 'deep',
    x: 0.5, y: 0.75, // Bottom
    radius: 0.28,
    effects: {
      velocityMultiplier: 0.6,
      cognitiveLoadModifier: 0.3,
      arousalModifier: 0.0
    },
    visualEffects: {
      particleDensity: 0.3,
      lighting: { brightness: 0.7, color: '#0a0a1a' }
    }
  }
];
```

## 3.4 WebSocket Multiplayer Wire Protocol

```typescript
// WebSocket message types for C.A.R.S. multiplayer
interface WireMessage {
  type: 'moleculeStateUpdate' | 'ping' | 'eventLog' | 'heartbeat' | 'connectionInit';
  timestamp: number;
  data: any;
}

interface MoleculeState {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  element: string;
  personality: string;
}

// Ghost molecule tracking
interface GhostMolecule {
  networkX: number;
  networkY: number;
  lastNetworkX: number;
  lastNetworkY: number;
  interpolatedX: number;
  interpolatedY: number;
  interpolationProgress: number;
  isInterpolating: boolean;
  lastUpdate: number;
  element: string;
  personality: string;
}

// Ping effect
interface Ping {
  id: string;
  targetId: string;
  emoji: string;
  position: { x: number; y: number };
  createdAt: number;
  expiresAt: number;
}
```

---

# 4. Atmosphere Client System

## 4.1 Registry Loading

```javascript
// p31-atmosphere-client.js — Runtime atmosphere resolution
let _cache = null;
let forcedAssetBase = null;

/**
 * Configure base URL for atmosphere assets (for bundling)
 * @param {string | URL} base
 */
export function configureAtmosphereAssetsBase(base) {
  _cache = null;
  if (base instanceof URL) {
    forcedAssetBase = base;
    return;
  }
  if (typeof base === "string" && window.location?.href) {
    const u = base.endsWith("/") ? base : base + "/";
    forcedAssetBase = new URL(u, window.location.href);
    return;
  }
  forcedAssetBase = null;
}

/**
 * Load atmosphere registry (ramps + routes + preset caps)
 * @returns {Promise<{ ramps: object[]; routes: object[]; presetCaps: Record<string, object> }>}
 */
export async function loadAtmosphereRegistry() {
  if (_cache) return _cache;
  
  const base = forcedAssetBase || new URL("./", import.meta.url);
  
  const [rampRes, routeRes, capRes] = await Promise.all([
    fetch(new URL("p31-atmosphere-ramp.json", base), { cache: "no-store" }),
    fetch(new URL("p31-atmosphere-routes.json", base), { cache: "no-store" }),
    fetch(new URL("p31-canon-starfield-presets.json", base), { cache: "no-store" }),
  ]);
  
  if (!rampRes.ok) throw new Error("atmosphere: ramp json " + rampRes.status);
  if (!routeRes.ok) throw new Error("atmosphere: routes json " + routeRes.status);
  if (!capRes.ok) throw new Error("atmosphere: preset caps json " + capRes.status);
  
  const rampDoc = await rampRes.json();
  const routeDoc = await routeRes.json();
  const capDoc = await capRes.json();
  
  const ramps = Array.isArray(rampDoc.ramps) ? rampDoc.ramps : [];
  const routes = Array.isArray(routeDoc.routes) ? routeDoc.routes : [];
  const presetCaps = capDoc.presets && typeof capDoc.presets === "object" ? capDoc.presets : {};
  
  _cache = { ramps, routes, presetCaps };
  return _cache;
}

/**
 * Resolve atmosphere configuration for a surface
 * @param {string} surfaceId
 * @returns {Promise<{ ramp: object; route: object; presetCaps: object | null } | null>}
 */
export async function resolveAtmosphere(surfaceId) {
  const { ramps, routes, presetCaps } = await loadAtmosphereRegistry();
  const route = routes.find((r) => r.surfaceId === surfaceId);
  if (!route) return null;
  
  const ramp = ramps.find((x) => x.id === route.rampId);
  if (!ramp) return null;
  
  const key = ramp.starfieldPreset;
  const caps = key && presetCaps[key] ? presetCaps[key] : null;
  
  return { ramp, route, presetCaps: caps };
}

/**
 * Determine starfield mount mode from resolved atmosphere
 * @returns {'none'|'animated'|'static'}
 */
export function starfieldMountMode(resolved) {
  if (!resolved) return "none";
  const aod = resolved.route?.starfieldAOD;
  if (aod === "off") return "none";
  if (aod === "degraded") return "static";
  return "animated";
}

/**
 * Apply resolved atmosphere to starfield config
 */
export function mergeResolvedIntoStarfieldConfig(config, resolved) {
  const out = { ...config };
  if (!resolved || !resolved.ramp) return out;
  
  const mb = Math.max(0, Math.min(12, Number(resolved.ramp.motionBudget) || 0));
  const t = mb / 12;
  const caps = resolved.presetCaps;
  
  if (caps && typeof caps.baseAlphaCap === "number") {
    const headroom = 0.45 + 0.55 * t;
    out.baseAlpha = Math.min(out.baseAlpha, caps.baseAlphaCap * headroom);
  }
  
  out.speed = Number(out.speed) * (0.2 + 0.8 * Math.max(0.2, t));
  return out;
}

/**
 * Apply CSS tokens from ramp to :root
 */
export function applyRampCssHints(root, resolved) {
  if (!root || !resolved?.ramp) return;
  const r = resolved.ramp;
  
  if (r.radiusToken) {
    root.style.setProperty("--p31-atmosphere-radius-token", String(r.radiusToken));
  }
  if (r.typeScaleRem) {
    root.style.setProperty("--p31-atmosphere-type-step", String(r.typeScaleRem));
  }
  
  root.dataset.p31AtmosphereRamp = String(r.id || "");
  root.dataset.p31SoundProfile = String(r.soundProfile || "");
}
```

---

# 5. Mesh Touch System

## 5.1 Touch Types and Effects

```javascript
// p31-mesh-touches.js — Real-time event effects for starfield

export const STORAGE = {
  lastMedTs: 'p31_last_med_ts',
  meshActivity: 'p31_mesh_activity',
  fixedConstellation: 'p31_fixed_constellation',
};

// Burst type definitions
const BURST_TYPES = {
  ping: {
    color: [77, 184, 168],   // Teal
    count: 15,
    spread: 120,
    position: 'random',      // Random position in center area
  },
  med: {
    color: [59, 163, 114],   // Phosphor green
    count: 8,
    spread: 70,
    position: 'bottom',      // Near bottom (medication reminder)
  },
  agent: {
    color: [77, 184, 168],   // Teal
    count: 6,
    spread: 45,
    position: 'upperRight',
  },
  hostile: {
    color: [204, 98, 71],    // Coral/Red
    count: 18,
    spread: 200,
    position: 'center',
    flashWave: true,
  },
  love: {
    color: [205, 168, 82],     // Butter yellow
    count: 12,
    spread: 100,
    position: 'center',
  },
  bonding: {
    color: [59, 163, 114],     // Phosphor
    count: 10,
    spread: 85,
    position: 'center',
  },
  touch: {
    color: [77, 184, 168],     // Teal
    count: 6,
    spread: 36,
    position: 'pointer',       // At pointer position
  },
};

// Time-based touch effects
export function birthdayTouchMode() {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const date = now.getDate();     // 1-31
  
  // Example: Special modes for specific dates
  if (month === 4 && date === 3) {
    return 'bash'; // Special birthday mode
  }
  if (month === 3 && date === 15) {
    return 'willow'; // Another special mode
  }
  return null;
}

// FERS (legal filing) countdown drift
export function fersDriftBias(now, filed) {
  const daysRemaining = getFersDaysRemaining(now);
  const urgency = Math.max(0, 1 - daysRemaining / 60);
  return {
    fx: filed ? 0 : urgency * 0.15,
    fy: filed ? 0 : urgency * 0.05,
  };
}

// Moon phase affects opacity
export function moonOpacityMultiplier() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  
  // Approximate moon phase (0 = new, 1 = full)
  const synodic = 29.53059;
  const knownNewMoon = new Date(2000, 0, 6, 18, 14); // Known new moon
  const daysSince = (now - knownNewMoon) / (1000 * 60 * 60 * 24);
  const phase = (daysSince % synodic) / synodic;
  const fullness = 1 - Math.abs(phase - 0.5) * 2;
  
  return 0.85 + fullness * 0.15; // 0.85 to 1.0
}

// Calcium window (medication timing)
export function calciumWindowActive(nowMs, lastMedTs) {
  if (!lastMedTs) return false;
  const hoursSince = (nowMs - lastMedTs) / (1000 * 60 * 60);
  // Active if between 2-4 hours post-medication
  return hoursSince >= 2 && hoursSince <= 4;
}

export function calciumHearthGoldMix(windowActive, vyvanseSafe) {
  if (!windowActive) return 0;
  return vyvanseSafe ? 0.35 : 0.15;
}

// Mesh activity tracking
export function recordMeshActivity(type) {
  try {
    const key = STORAGE.meshActivity;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.push({ type, ts: Date.now() });
    // Keep last 100
    const trimmed = existing.slice(-100);
    localStorage.setItem(key, JSON.stringify(trimmed));
  } catch {
    /* ignore */
  }
}

// Constellation persistence (fixed stars)
export function pushConstellationPoint(nx, ny) {
  try {
    const key = STORAGE.fixedConstellation;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.push({ x: nx, y: ny, a: 0.8 });
    // Keep last 50
    const trimmed = existing.slice(-50);
    localStorage.setItem(key, JSON.stringify(trimmed));
  } catch {
    /* ignore */
  }
}

export function loadConstellation() {
  try {
    const key = STORAGE.fixedConstellation;
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

// Breath rate from heart rate (for co-regulation)
export function breathRateFromHeartRate(hr) {
  if (!hr || hr < 40) return null;
  // Target 4-4-6 breath cycle (14s total)
  // ~4 breaths per minute for HRV coherence
  return 0.000714; // 14s cycle in ms
}
```

## 5.2 Inter-Tab Communication

```javascript
// Mesh touch broadcast channel (cross-tab synchronization)
const CHANNEL_NAME = 'p31-mesh-touch';

export function installMeshTouchChannel(handler) {
  if (typeof BroadcastChannel === 'undefined') {
    // Fallback: storage events
    window.addEventListener('storage', (e) => {
      if (e.key === 'p31-mesh-touch-fallback') {
        try {
          const msg = JSON.parse(e.newValue || '{}');
          handler(msg);
        } catch {
          /* ignore */
        }
      }
    });
    return () => {};
  }
  
  const ch = new BroadcastChannel(CHANNEL_NAME);
  ch.onmessage = (ev) => handler(ev.data);
  
  return () => {
    ch.close();
  };
}

export function broadcastMeshTouch(msg) {
  if (typeof BroadcastChannel !== 'undefined') {
    const ch = new BroadcastChannel(CHANNEL_NAME);
    ch.postMessage(msg);
    ch.close();
  } else {
    // Fallback
    try {
      localStorage.setItem('p31-mesh-touch-fallback', JSON.stringify(msg));
    } catch {
      /* ignore */
    }
  }
}

// Merge API touch hints
export function mergeApiTouchHints(apiState) {
  const hints = {};
  if (!apiState || typeof apiState !== 'object') return hints;
  
  // Extract relevant state for visual effects
  if (apiState.current_spoons != null) {
    hints.spoons = apiState.current_spoons;
  }
  if (apiState.safe_mode_active != null) {
    hints.safeMode = apiState.safe_mode_active;
  }
  if (apiState.system_voltage != null) {
    hints.voltage = apiState.system_voltage;
  }
  if (apiState.resting_hr != null) {
    hints.restingHr = apiState.resting_hr;
  }
  if (apiState.bereavement_active != null) {
    hints.bereavementActive = apiState.bereavement_active;
  }
  
  return hints;
}
```

## 5.3 Bonding Molecule Geometry

```javascript
// K₄ bonding visualization
export function bondingMoleculeGeometry(key) {
  const geometries = {
    'tetrahedron': {
      angles: [0, Math.PI * 2/3, Math.PI * 4/3, 0], // 4 vertices
      r: 40,
    },
    'k4': {
      angles: [0, Math.PI/2, Math.PI, Math.PI * 3/2], // Square projection
      r: 45,
    },
    'family': {
      angles: [0, 2.1, 4.2, 0.5], // Asymmetric (organic)
      r: 42,
    },
  };
  return geometries[key] || geometries['k4'];
}

// Poets room particle color
export function poetsParticleColor(tone) {
  const colors = {
    fuller: [77, 184, 168],      // Teal (Bucky)
    operator: [204, 98, 71],     // Coral (W.J.)
    children: [205, 168, 82],    // Butter (S.J./W.J.)
  };
  return colors[tone] || colors['fuller'];
}

// Mesh edges cold check (family connectivity)
export function meshEdgesCold48h(nowMs) {
  try {
    const activity = JSON.parse(localStorage.getItem(STORAGE.meshActivity) || '[]');
    if (activity.length === 0) return true;
    
    const lastActivity = activity[activity.length - 1]?.ts || 0;
    const hoursSince = (nowMs - lastActivity) / (1000 * 60 * 60);
    return hoursSince > 48;
  } catch {
    return false;
  }
}
```

---

# 6. Visual Demo Gallery

## 6.1 Demo Index Page

```html
<!-- demos/index.html — Visual demo gallery entry point -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>P31 visual demos — two artifacts that hold the whole thesis</title>
  <style>
    :root {
      --bg: #07090a;
      --panel: #0f1411;
      --panel-hi: #131a16;
      --line: #20302480;
      --green: #62d979;
      --green-dim: #3aa653;
      --teal: #25897d;
      --cyan: #4db8a8;
      --amber: #f0b25a;
      --butter: #cda852;
      --coral: #cc6247;
      --grey: #aab2ad;
      --grey-dim: #6c7773;
      --ink: #e7eee9;
      --mono: ui-monospace, "SF Mono", Menlo, Consolas, "Roboto Mono", monospace;
    }
    
    * { box-sizing: border-box }
    html, body { 
      margin: 0; 
      padding: 0; 
      background: var(--bg); 
      color: var(--ink); 
      font-family: var(--mono); 
      font-size: 14px; 
      line-height: 1.5 
    }
    
    a { color: var(--green); text-decoration: none }
    a:hover { text-decoration: underline }
    
    .wrap { 
      max-width: 1180px; 
      margin: 0 auto; 
      padding: 32px 20px 60px 
    }
    
    /* Header */
    header { 
      padding: 18px 0 30px; 
      border-bottom: 1px solid var(--line); 
      margin-bottom: 30px 
    }
    
    header h1 { 
      margin: 0 0 8px 0; 
      font-size: 22px; 
      letter-spacing: 0.04em 
    }
    
    header h1 .glow { 
      color: var(--green); 
      text-shadow: 0 0 14px #62d97955 
    }
    
    header p { 
      margin: 6px 0; 
      color: var(--grey); 
      max-width: 740px 
    }
    
    .badges { 
      display: flex; 
      gap: 8px; 
      flex-wrap: wrap; 
      margin-top: 10px 
    }
    
    .badge { 
      background: var(--panel); 
      border: 1px solid var(--line); 
      padding: 3px 10px; 
      border-radius: 99px; 
      font-size: 11px; 
      color: var(--grey) 
    }
    
    .badge.live { 
      color: var(--green); 
      border-color: var(--green-dim) 
    }
    
    /* Featured artifacts grid */
    .featured {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
      margin-bottom: 40px;
    }
    
    @media (max-width: 860px) {
      .featured { grid-template-columns: 1fr; }
    }
    
    .feature {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 14px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: border-color 0.25s ease, transform 0.25s ease;
    }
    
    .feature:hover { 
      border-color: var(--teal); 
      transform: translateY(-2px); 
    }
    
    .feature .preview {
      aspect-ratio: 16 / 9;
      position: relative;
      overflow: hidden;
      border-bottom: 1px solid var(--line);
      background: #050708;
    }
    
    .feature .preview iframe {
      width: 200%;
      height: 200%;
      border: 0;
      display: block;
      pointer-events: none;
      transform: scale(0.5);
      transform-origin: top left;
    }
    
    .feature .preview .mask {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(7,9,10,0) 50%, rgba(7,9,10,0.85));
      pointer-events: none;
    }
    
    .feature .body { 
      padding: 20px 22px 24px; 
      display: flex; 
      flex-direction: column; 
      gap: 10px; 
      flex: 1 
    }
    
    .feature .tag { 
      font-size: 11px; 
      letter-spacing: 0.06em; 
      color: var(--grey-dim); 
      text-transform: uppercase 
    }
    
    .feature h2 { 
      margin: 0; 
      font-size: 20px; 
      color: var(--ink); 
      font-weight: 600; 
      letter-spacing: 0.02em 
    }
    
    .feature h2 .accent { color: var(--teal); }
    
    .feature .lede { 
      color: var(--grey); 
      font-size: 13.5px; 
      line-height: 1.55; 
      margin: 0; 
    }
    
    .feature .actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: auto;
      padding-top: 14px;
    }
    
    .feature .actions a, .feature .actions button {
      background: #1a2420;
      color: var(--ink);
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 7px 14px;
      font-size: 12.5px;
      font-family: var(--mono);
      cursor: pointer;
      text-decoration: none;
    }
    
    .feature .actions a.primary { 
      background: #1f3326; 
      color: var(--green); 
      border-color: var(--green-dim); 
      font-weight: 600; 
    }
    
    /* Glass box tile */
    .third {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 18px 22px;
      display: grid;
      grid-template-columns: 90px 1fr auto;
      gap: 18px;
      align-items: center;
      margin-bottom: 30px;
    }
    
    .third .icon {
      width: 90px;
      height: 60px;
      border-radius: 8px;
      background: #050708;
      border: 1px solid var(--line);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: var(--green);
    }
    
    .third h3 { 
      margin: 0 0 4px; 
      color: var(--green); 
      font-size: 14px; 
    }
    
    .third p { 
      margin: 0; 
      color: var(--grey); 
      font-size: 12.5px; 
      line-height: 1.45; 
    }
  </style>
</head>
<body>
<div class="wrap">

<header>
  <h1>◍ <span class="glow">P31 visual demos</span> — two artifacts hold the whole thesis</h1>
  <p>Consolidated from four atomic demos down to two interactive educational artifacts. Each one is single-file, no telemetry, no analytics, no servers.</p>
  <div class="badges">
    <span class="badge live">2 live artifacts</span>
    <span class="badge">single-file HTML</span>
    <span class="badge">no tracking</span>
    <span class="badge">CC-BY 4.0 — share + remix</span>
  </div>
</header>

<div class="featured">

  <!-- Featured 1: The Same Shape -->
  <article class="feature">
    <div class="preview">
      <span style="position: absolute; top: 14px; left: 16px; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--grey-dim); pointer-events: none;">artifact 01</span>
      <iframe src="./the-same-shape.html" title="The Same Shape — preview" loading="lazy"></iframe>
      <div class="mask"></div>
    </div>
    <div class="body">
      <span class="tag">geometry · the central thesis · 4 panels in lockstep</span>
      <h2>The Same Shape <span class="accent">— K₄ at four orders of magnitude</span></h2>
      <p class="lede">The same minimum-complete graph (4 vertices, 6 edges, no central hub) rendered as a <strong>family mesh</strong>, a <strong>Platonic tetrahedron</strong>, a <strong>SIC-POVM in d=2</strong>, and a <strong>Posner phosphate cluster</strong>. Drag any panel — all four rotate in lockstep.</p>
      <div class="actions">
        <a class="primary" href="./the-same-shape.html">open artifact</a>
        <a href="https://github.com/p31labs/bonding-soup/blob/main/demos/the-same-shape.html" target="_blank">source</a>
      </div>
    </div>
  </article>

  <!-- Featured 2: The Pulse -->
  <article class="feature">
    <div class="preview">
      <span style="position: absolute; top: 14px; left: 16px; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--grey-dim); pointer-events: none;">artifact 02</span>
      <iframe src="./the-pulse.html" title="The Pulse — preview" loading="lazy"></iframe>
      <div class="mask"></div>
    </div>
    <div class="body">
      <span class="tag">ephemeralization · live · edit one number</span>
      <h2>The Pulse <span class="accent">— one number, every screen</span></h2>
      <p class="lede">The Larmor frequency of phosphorus-31 (<strong>863 Hz</strong>) lives in <code>p31-constants.json</code>. Edit it on the page. Watch the pulse rate change. Watch the alignment DAG light up. Watch <strong>20+ surfaces</strong> update their displayed value.</p>
      <div class="actions">
        <a class="primary" href="./the-pulse.html">open artifact</a>
        <a href="https://github.com/p31labs/bonding-soup/blob/main/demos/the-pulse.html" target="_blank">source</a>
      </div>
    </div>
  </article>

</div>

<!-- Glass Box tile -->
<div class="third">
  <div class="icon">◇</div>
  <div>
    <h3>Glass box terminal</h3>
    <p>Public, read-only operating surface that streams P31's tests, simulations, and reports as they happen.</p>
  </div>
  <div style="display: flex; gap: 8px; flex-shrink: 0;">
    <a href="../glass-box.html" style="background: #1a2420; color: var(--ink); border: 1px solid var(--line); border-radius: 6px; padding: 6px 12px; font-size: 12px; text-decoration: none;">open</a>
    <a href="../glass-box-widget.html" style="background: #1a2420; color: var(--ink); border: 1px solid var(--line); border-radius: 6px; padding: 6px 12px; font-size: 12px; text-decoration: none;">embed</a>
  </div>
</div>

</div>
</body>
</html>
```

---

# Appendix: Quick Reference

## Color Tokens

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `--p31-teal` | #4ecdc4 | 77, 184, 168 | Primary accent, healthy state |
| `--p31-coral` | #ff6b6b | 204, 98, 71 | Depleted state, hearth glow |
| `--p31-onyx` | #1a1a2e | 26, 26, 46 | Background, structural |
| `--p31-pearl` | #f7f7f7 | 247, 247, 247 | Text, foreground |
| `--p31-phosphor` | #3ba372 | 59, 163, 114 | Success, bonding |
| `--p31-butter` | #cda852 | 205, 168, 82 | Warmth, love |

## State Mappings

| Spoons | State | Particles | Speed | Color Mix |
|--------|-------|-----------|-------|-----------|
| 8-12 | Nominal | 80 | 0.15 | 15% coral |
| 4-7 | Moderate | 50 | 0.08 | 30% coral |
| 0-3 | Depleted | 25 | 0.03 | 60% coral |
| Safe | Minimal | 12 | 0.005 | 10% coral |

## File Locations

```
/design-assets/
  ├── starfield/
  │   ├── p31-starfield.js          # Core engine
  │   ├── p31-starfield.css         # Base styles
  │   └── demo.html                 # Interactive demo
  ├── atmosphere/
  │   ├── p31-atmosphere-client.js  # Registry resolver
  │   ├── p31-atmosphere-ramp.json  # Ramp definitions
  │   └── p31-atmosphere-routes.json # Route mappings
  └── starfield/
      └── p31-mesh-touches.js       # Touch event system

/demos/
  ├── index.html                    # Demo gallery
  ├── the-same-shape.html           # K₄ visualization
  └── the-pulse.html                # Larmor pulse

/glass-box.html                     # Transparency terminal
```

---

*Document: P31-VISUAL-DEMO-CODE-COMPLETE.md*
*Version: 1.0.0*
*Generated: 2026-05-03*
*Schema: p31.visualDemoCode/1.0.0*