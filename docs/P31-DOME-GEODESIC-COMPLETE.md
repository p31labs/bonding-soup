
---

# 7. State Snapshot System

## 7.1 HTTP GET Endpoint

```typescript
// GET /api/geodesic/:room/state
// Returns current room state without WebSocket

interface StateSnapshotResponse {
  vertices: Record<string, {
    x: number;
    y: number;
    z: number;
    label?: string;
  }>;
  shapes: Record<string, {
    shapeId: string;
    shapeType: 'tet' | 'oct' | 'ico' | 'cube';
    x: number;
    y: number;
    z: number;
    rotY?: number;
    owner: string;
  }>;
  version: number;
  connections: number;      // Active WebSocket clients
  rigidity: {
    V: number;              // Total vertices
    E: number;              // Total edges
    F: number;              // Total faces
    rigid: boolean;         // Maxwell criterion
  };
}
```

## 7.2 Client Fetch Implementation

```javascript
// Read-only state polling for spectator views
async function fetchRoomState(roomId, options = {}) {
  const baseUrl = options.workerUrl || 'https://geodesic-room.trimtab-signal.workers.dev';
  const url = `${baseUrl}/api/geodesic/${encodeURIComponent(roomId)}/state`;
  
  const res = await fetch(url, {
    credentials: 'omit',
    cache: 'no-store',
    headers: {
      'Accept': 'application/json'
    }
  });
  
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  
  return await res.json();
}

// Usage: Display room stats without joining
async function displayRoomStats(roomId) {
  const state = await fetchRoomState(roomId);
  
  console.log('Room:', roomId);
  console.log('Connected users:', state.connections);
  console.log('Shapes:', Object.keys(state.shapes).length);
  console.log('Version:', state.version);
  console.log('Rigidity:', state.rigidity.rigid ? 'RIGID' : 'UNDERCONSTRAINED');
  
  return state;
}
```

## 7.3 Solo JSON Snapshot (Export/Import)

```javascript
// Schema: p31.geodesicBuildSnapshot/1.0.0
// For single-user save/load (not network state)

const GEODESIC_BUILD_SNAPSHOT_SCHEMA = "p31.geodesicBuildSnapshot/1.0.0";

interface GeodesicBuildSnapshot {
  schema: "p31.geodesicBuildSnapshot/1.0.0";
  savedAt: string;           // ISO timestamp
  intent: string;            // Human description
  
  // Camera position
  camera: {
    x: number;
    y: number;
    z: number;
    targetX: number;
    targetY: number;
    targetZ: number;
  };
  
  // Shape positions and rotations
  shapes: Array<{
    id: string;
    type: 'tet' | 'oct' | 'ico' | 'cube';
    x: number;
    y: number;
    z: number;
    rotY: number;           // Tabletop rotation
  }>;
  
  // K₄ cage positions
  cage: {
    v0: { x, y, z };
    v1: { x, y, z };
    v2: { x, y, z };
    v3: { x, y, z };
  };
  
  // Settings
  wireframe: boolean;
  solid: boolean;
  snap: boolean;
  
  // Derived metadata
  derived: {
    shapeCount: number;
    maxwell: {
      V: number;
      E: number;
      F: number;
      rigid: boolean;
    };
  };
}

// Export current scene
function exportSnapshot(sceneData) {
  const snapshot = {
    schema: GEODESIC_BUILD_SNAPSHOT_SCHEMA,
    savedAt: new Date().toISOString(),
    intent: "Portable solo build — share or resume later",
    
    camera: sceneData.camera,
    shapes: sceneData.shapes,
    cage: sceneData.cage,
    wireframe: sceneData.wireframe,
    solid: sceneData.solid,
    snap: sceneData.snap,
    derived: {
      shapeCount: sceneData.shapes.length,
      maxwell: calculateMaxwell(sceneData.shapes)
    }
  };
  
  const json = JSON.stringify(snapshot, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  // Trigger download
  const a = document.createElement('a');
  a.href = url;
  a.download = `geodesic-build-${Date.now()}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
}

// Import and apply snapshot
function importSnapshot(jsonString, renderer) {
  const data = JSON.parse(jsonString);
  
  if (data.schema !== GEODESIC_BUILD_SNAPSHOT_SCHEMA) {
    throw new Error('Invalid schema: ' + data.schema);
  }
  
  // Apply camera
  renderer.camera.position.set(
    data.camera.x,
    data.camera.y,
    data.camera.z
  );
  renderer.controls.target.set(
    data.camera.targetX,
    data.camera.targetY,
    data.camera.targetZ
  );
  
  // Clear existing shapes
  renderer.clearShapes();
  
  // Recreate shapes
  for (const shape of data.shapes) {
    renderer.createShape(shape.id, {
      shapeType: shape.type,
      x: shape.x,
      y: shape.y,
      z: shape.z,
      rotY: shape.rotY
    });
  }
  
  // Apply cage positions
  for (const [id, pos] of Object.entries(data.cage)) {
    const mesh = renderer.vertexMeshes.get(id);
    if (mesh) {
      mesh.position.set(pos.x, pos.y, pos.z);
    }
  }
  
  // Apply settings
  renderer.setWireframe(data.wireframe);
  renderer.setSolid(data.solid);
  renderer.setSnap(data.snap);
}
```

---

# 8. Rigidity Calculations

## 8.1 Maxwell Criterion

```javascript
/**
 * Calculate Maxwell rigidity for a structure
 * 
 * In 3D, a structure is rigid if: E = 3V - 6
 * Where:
 *   V = number of vertices
 *   E = number of edges (bars)
 * 
 * If E < 3V - 6: mechanism (underconstrained, can move)
 * If E > 3V - 6: overconstrained (redundant bars)
 * If E = 3V - 6: isostatic (exactly rigid, "just enough")
 */

function calculateRigidity(shapes) {
  // Start with K₄ cage
  let V = 4;  // 4 cage vertices
  let E = 6;  // 6 cage edges (complete graph K₄)
  let F = 4;  // 4 tetrahedron faces
  
  // Add contributions from each shape
  for (const shape of shapes) {
    switch (shape.type) {
      case 'tet':  // Tetrahedron
        V += 4;   // 4 vertices
        E += 6;   // 6 edges
        F += 4;   // 4 triangular faces
        break;
        
      case 'oct':  // Octahedron
        V += 6;   // 6 vertices
        E += 12;  // 12 edges
        F += 8;   // 8 triangular faces
        break;
        
      case 'ico':  // Icosahedron
        V += 12;  // 12 vertices
        E += 30;  // 30 edges
        F += 20;  // 20 triangular faces
        break;
        
      case 'cube': // Cube
        V += 8;   // 8 vertices
        E += 12;  // 12 edges
        F += 6;   // 6 square faces
        break;
    }
  }
  
  // Maxwell criterion for 3D rigidity
  const expectedEdges = 3 * V - 6;
  const rigid = E >= expectedEdges;
  
  // Calculate "distance" from isostatic
  // 0 = perfectly isostatic (rigid, no redundancy)
  // negative = underconstrained (mechanism)
  // positive = overconstrained (redundant)
  const isostaticDistance = E - expectedEdges;
  
  return {
    V,                  // Vertices
    E,                  // Edges
    F,                  // Faces
    rigid,              // Boolean: meets minimum rigidity
    expectedEdges,      // Target for isostatic
    isostaticDistance,  // Deviation from perfect rigidity
    
    // Interpretation
    classification: isostaticDistance < 0 
      ? 'mechanism' 
      : isostaticDistance === 0 
        ? 'isostatic' 
        : 'overconstrained'
  };
}

// Example usage
const shapes = [
  { type: 'tet' },
  { type: 'tet' },
  { type: 'oct' }
];

const rigidity = calculateRigidity(shapes);
console.log(rigidity);
// {
//   V: 14,              // 4 cage + 4 + 4 + 6
//   E: 24,              // 6 + 6 + 6 + 12
//   F: 16,              // 4 + 4 + 4 + 8
//   rigid: true,
//   expectedEdges: 36,  // 3*14 - 6
//   isostaticDistance: -12,  // Underconstrained!
//   classification: 'mechanism'
// }
```

## 8.2 Visual Coherence Metric

```javascript
/**
 * Coherence score for the room
 * A subjective "quality of build" metric (0-1)
 * Based on shape count and rigidity
 */
function coherenceHint(state) {
  const n = Object.keys(state.shapes || {}).length;
  const rigidBonus = state.rigidity?.rigid ? 0.12 : 0;
  
  // Base coherence: 0.15 minimum + 0.02 per shape + rigidity bonus
  // Capped at 1.0
  return Math.min(1, Math.max(0, 0.15 + n * 0.02 + rigidBonus));
}

// Display in UI
function updateCoherenceDisplay(coherence) {
  const el = document.getElementById('coherence-bar');
  const pct = Math.round(coherence * 100);
  
  el.style.width = pct + '%';
  el.style.backgroundColor = coherence > 0.7 
    ? '#4ecdc4'  // Teal: good
    : coherence > 0.4 
      ? '#cda852'  // Butter: moderate
      : '#cc6247'; // Coral: needs work
  
  document.getElementById('coherence-text').textContent = 
    `${pct}% coherence`;
}
```

---

# 9. WebSocket Integration

## 9.1 Complete Integration Example

```javascript
// Complete Geodesic room integration
class GeodesicApp {
  constructor() {
    this.roomId = null;
    this.client = null;
    this.renderer = null;
    this.isLiveMode = false;
  }
  
  async init() {
    // Check URL for room
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('room');
    
    if (roomId && this.isValidRoomId(roomId)) {
      this.enterLiveMode(roomId);
    } else {
      this.enterCampaignMode();
    }
  }
  
  isValidRoomId(id) {
    return /^[a-zA-Z0-9_-]{1,64}$/.test(id);
  }
  
  enterLiveMode(roomId) {
    this.roomId = roomId;
    this.isLiveMode = true;
    
    // Hide campaign UI
    document.getElementById('coach').style.display = 'none';
    document.getElementById('toolbar-campaign').style.display = 'none';
    document.getElementById('toolbar-live').style.display = 'flex';
    
    // Update HUD
    document.getElementById('hud-text').innerHTML = 
      `Live room: <strong>${roomId}</strong> · ` +
      `<span id="connection-status">Connecting…</span>`;
    
    // Create renderer
    const canvas = document.getElementById('canvas');
    this.renderer = new GeodesicRenderer(canvas, null);
    this.renderer.animate();
    
    // Create client
    this.client = new GeodesicClient(roomId, {
      onHello: (msg) => this.onConnected(msg),
      onOp: (msg) => this.onOp(msg),
      onJoined: (id) => this.onUserJoined(id),
      onLeft: (id) => this.onUserLeft(id),
      onError: (err) => this.onError(err),
      onClose: () => this.onDisconnected()
    });
    
    // Link renderer to client
    this.renderer.client = this.client;
    
    // Connect
    this.client.connect();
  }
  
  enterCampaignMode() {
    this.isLiveMode = false;
    
    // Load campaign progress
    const progress = this.loadCampaignProgress();
    
    // Create campaign UI
    document.getElementById('coach').style.display = 'block';
    document.getElementById('toolbar-campaign').style.display = 'flex';
    document.getElementById('toolbar-live').style.display = 'none';
    
    // Create renderer (no client)
    const canvas = document.getElementById('canvas');
    this.renderer = new GeodesicRenderer(canvas, null);
    
    // Add seeded tetrahedron
    this.renderer.addShape('seed', {
      shapeType: 'tet',
      x: 0, y: 0, z: 0,
      rotY: 0
    });
    
    // Initialize or resume campaign
    if (progress?.done) {
      this.skipCampaign();
    } else {
      this.initCampaign(progress?.track || 0, progress?.step || 0);
    }
    
    this.renderer.animate();
  }
  
  onConnected(msg) {
    document.getElementById('connection-status').textContent = 
      `${msg.clientId.slice(0, 8)} · v${msg.version}`;
    
    // Update rigidity display
    this.updateRigidityDisplay(msg.rigidity);
    
    // Setup renderer with initial state
    this.renderer.onHello(msg);
  }
  
  onOp(msg) {
    // Operation received from server
    this.renderer.onOp(msg);
    
    // Update version display
    document.getElementById('version-display').textContent = 
      `v${msg.version}`;
    
    // Update rigidity if changed
    if (msg.rigidity) {
      this.updateRigidityDisplay(msg.rigidity);
    }
  }
  
  onUserJoined(clientId) {
    this.showToast(`User joined: ${clientId.slice(0, 8)}`);
  }
  
  onUserLeft(clientId) {
    this.showToast(`User left: ${clientId.slice(0, 8)}`);
  }
  
  onError(err) {
    console.error('Geodesic error:', err);
    if (err.code === 'SHAPE_CAP') {
      alert('Room is at maximum capacity (50 shapes). Remove shapes to add more.');
    }
  }
  
  onDisconnected() {
    document.getElementById('connection-status').textContent = 'Reconnecting…';
  }
  
  updateRigidityDisplay(rigidity) {
    const el = document.getElementById('rigidity-display');
    if (!el) return;
    
    const { V, E, F, rigid } = rigidity;
    const expected = 3 * V - 6;
    
    el.innerHTML = `
      <div class="rigidity-bar ${rigid ? 'rigid' : 'flexible'}">
        <span class="metric">V=${V} E=${E} F=${F}</span>
        <span class="status">${rigid ? 'RIGID' : 'FLEXIBLE'}</span>
      </div>
      <div class="maxwell">Target: E = 3V - 6 = ${expected}</div>
    `;
  }
  
  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  const app = new GeodesicApp();
  app.init();
});
```

---

# 10. Related Work Packages

## 10.1 Synergetic Multi-Dome Stack

The GEODESIC is part of the larger **Synergetic Multi-Dome Stack**:

| Component | Path | Role |
|-----------|------|------|
| **Astro K₄ "Sovereign Cockpit"** | `src/pages/dome.astro` | Three.js r183, tetra, loading ritual |
| **Static Data Dome** | `public/observatory.html` | Icosahedron panels, node cards |
| **Platonic Builder** | `public/geodesic.html` | Icosa/tetra/octa snap space |
| **Spaceship Earth PWA** | `spaceship-earth/` | Rooms: observatory, geodesic, etc. |
| **Bridge Page** | `public/spaceship-earth.html` | PWA entry point |

## 10.2 Integration Points

### From p31ca to Spaceship Earth
```
https://p31ca.org/geodesic?room=k4-family
↓
https://<spaceship-host>/#observatory?src=p31ca&route=geodesic.html
```

### From Spaceship Earth to p31ca
```javascript
// "Open in hub" link generation
function generateHubLink(surface) {
  const links = {
    'observatory': '/observatory-about.html',
    'dome': '/dome',
    'geodesic': '/geodesic'
  };
  return `https://p31ca.org${links[surface]}`;
}
```

---

# Appendix: Quick Reference

## Wire Protocol Summary

| Direction | Type | Fields | Purpose |
|-----------|------|--------|---------|
| Client → Server | `SET_VERTEX` | `id, x, y, z` | Move K₄ cage vertex |
| Client → Server | `ADD_SHAPE` | `shapeId, shapeType, x, y, z, rotY?` | Create shape |
| Client → Server | `MOVE_SHAPE` | `shapeId, x, y, z, rotY?` | Update shape pose |
| Client → Server | `REMOVE_SHAPE` | `shapeId` | Delete shape |
| Client → Server | `RESET_SHAPES` | — | Clear all shapes |
| Client → Server | `RESET` | — | Reset cage to defaults |
| Server → Client | `hello` | `state, shapes, version, clientId, rigidity` | Initial state |
| Server → Client | `op` | `op, version, ts, clientId, rigidity` | Applied operation |
| Server → Client | `joined` / `left` | `clientId, ts` | Presence |
| Server → Client | `error` | `code, message, max?` | Error (e.g., SHAPE_CAP) |

## Limits

| Limit | Value | Notes |
|-------|-------|-------|
| Shapes per room | 50 | Maxwell rigidity cap |
| WebSocket clients | 32 | Per room |
| Room ID length | 1-64 | `[a-zA-Z0-9_-]` |
| Position bounds | ±50 | Clamped server-side |
| `rotY` | radians | Optional, defaults 0 |

## File Locations

```
andromeda/04_SOFTWARE/
├── geodesic-room/
│   ├── src/index.ts           # Durable Object implementation
│   ├── wrangler.toml          # Deployment config
│   └── README.md              # Worker docs
├── p31ca/public/
│   ├── geodesic.html          # Main builder (campaign + live)
│   ├── observatory.html       # Icosa data dome
│   └── spaceship-earth.html   # PWA bridge
├── packages/shared/src/
│   ├── geodesic-room-wire.ts  # TypeScript types
│   └── geodesic-build-snapshot.ts # Solo export types
└── ground-truth/
    ├── p31.ground-truth.json   # Route verification
    └── geodesic-build-snapshot.json # Export schema
```

---

*Document: P31-DOME-GEODESIC-COMPLETE.md*
*Version: 1.0.0*
*Generated: 2026-05-03*
*Schema: p31.domeGeodesicSpec/1.0.0*
*Wire Version: p31.geodesicRoomWire/0.2.1*