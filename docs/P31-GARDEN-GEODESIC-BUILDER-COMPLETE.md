
---

# 5. Geodesic Builder

## 5.1 Overview

The **Geodesic Builder** is P31's **collaborative 3D construction environment** for building with platonic solids (tetrahedron, octahedron, icosahedron, cube). It operates in two modes:

| Mode | Trigger | Coach | Content |
|------|---------|-------|---------|
| **On-ramp** | No `?room=` or invalid | **ON** (5-track tutorial) | Seeded tet, progressive unlocks |
| **K₄ Live** | Valid `?room=<id>` | **OFF** (expert) | Family K₄ cage, multiplayer WebSocket |

## 5.2 Campaign Tracks

### Track 0: Explorer (Look)

**Goal:** Learn to navigate 3D space

```javascript
const TRACK_EXPLORER = {
  id: 'explorer',
  label: 'Explorer',
  emoji: '👁️',
  unlock: [],
  steps: [
    {
      id: 'e1',
      msg: 'Drag to rotate the view',
      emoji: '👁️',
      waitFor: 'orbit',
      // Fires on OrbitControls 'start' (first orbit only)
    },
    {
      id: 'e2', 
      msg: 'Scroll or pinch to zoom',
      emoji: '🔍',
      waitFor: 'zoom',
      celebration: 'Nice!',
      // Fires on wheel OR pinch-to-zoom
    }
  ]
};
```

### Track 1: Scootch (Move)

**Goal:** Learn to drag shapes

```javascript
const TRACK_SCOOTCH = {
  id: 'scootch',
  label: 'Scootch',
  emoji: '🦀',
  unlock: [],
  steps: [
    {
      id: 's1',
      msg: 'Drag the green shape to the ring',
      emoji: '🎯',
      waitFor: 'ring_reached',
      celebration: 'Great!',
      // Placement ring appears on XZ plane
      // Check: distance(shapes[0], RING_POS) < threshold
    }
  ]
};
```

### Track 2: Sticky (Connect)

**Goal:** Learn auto-snap between shapes

```javascript
const TRACK_STICKY = {
  id: 'sticky',
  label: 'Sticky',
  emoji: '🧲',
  unlock: ['btn-snap'],  // Unlocks auto-snap toggle
  steps: [
    {
      id: 'st1',
      msg: 'Turn on Auto-snap',
      emoji: '🧲',
      waitFor: 'snap_enabled'
    },
    {
      id: 'st2',
      msg: 'Connect two shapes',
      emoji: '🔗',
      waitFor: 'snap_used',
      celebration: 'Connected!',
      // Fires when tryCornerSnap() applies real snap delta
    }
  ]
};
```

### Track 3: Builder (Build)

**Goal:** Add new shapes

```javascript
const TRACK_BUILDER = {
  id: 'builder',
  label: 'Builder',
  emoji: '🏗️',
  unlock: ['btn-oct', 'btn-ico', 'btn-cube'],  // New shapes
  steps: [
    {
      id: 'b1',
      msg: 'Add an octahedron',
      emoji: '💠',
      waitFor: 'shape_added:oct'
    },
    {
      id: 'b2',
      msg: 'Tap anywhere to continue',
      emoji: '👆',
      waitFor: 'any_tap',
      celebration: 'Builder unlocked!'
    }
  ]
};
```

### Track 4: Mesh (Share)

**Goal:** Join live collaboration

```javascript
const TRACK_MESH = {
  id: 'mesh',
  label: 'Mesh',
  emoji: '🔺',
  unlock: ['btn-join-room'],  // Live room button
  steps: [
    {
      id: 'm1',
      msg: 'Join a live room to build together',
      emoji: '🌐',
      waitFor: 'any_tap',
      celebration: 'Ready to mesh!'
    }
  ]
};
```

## 5.3 Shape Types

```typescript
type ShapeType = 'tet' | 'oct' | 'ico' | 'cube';

interface ShapeDefinition {
  type: ShapeType;
  name: string;
  vertices: number;
  edges: number;
  faces: number;
  geometry: string;  // Three.js geometry constructor
}

const SHAPE_DEFINITIONS: Record<ShapeType, ShapeDefinition> = {
  tet: {
    type: 'tet',
    name: 'Tetrahedron',
    vertices: 4,
    edges: 6,
    faces: 4,
    geometry: 'TetrahedronGeometry(1)'
  },
  oct: {
    type: 'oct',
    name: 'Octahedron',
    vertices: 6,
    edges: 12,
    faces: 8,
    geometry: 'OctahedronGeometry(1)'
  },
  ico: {
    type: 'ico',
    name: 'Icosahedron',
    vertices: 12,
    edges: 30,
    faces: 20,
    geometry: 'IcosahedronGeometry(1)'
  },
  cube: {
    type: 'cube',
    name: 'Cube',
    vertices: 8,
    edges: 12,
    faces: 6,
    geometry: 'BoxGeometry(1.5, 1.5, 1.5)'
  }
};
```

## 5.4 Maxwell Rigidity

```javascript
/**
 * Calculate Maxwell rigidity for the structure
 * 
 * 3D rigidity criterion: E = 3V - 6
 * Where V = vertices, E = edges
 * 
 * rigid = E >= 3V - 6
 */
function calculateRigidity(shapes) {
  // Start with K₄ cage
  let V = 4;  // 4 cage vertices
  let E = 6;  // 6 cage edges
  let F = 4;  // 4 tetrahedron faces
  
  // Add shape contributions
  for (const shape of shapes) {
    const def = SHAPE_DEFINITIONS[shape.type];
    V += def.vertices;
    E += def.edges;
    F += def.faces;
  }
  
  const expectedEdges = 3 * V - 6;
  const rigid = E >= expectedEdges;
  const isostaticDistance = E - expectedEdges;
  
  return {
    V, E, F,
    rigid,
    expectedEdges,
    isostaticDistance,
    classification: isostaticDistance < 0 
      ? 'mechanism' 
      : isostaticDistance === 0 
        ? 'isostatic' 
        : 'overconstrained'
  };
}

// Example coherence display
function updateRigidityDisplay(rigidity) {
  const { V, E, F, rigid, isostaticDistance } = rigidity;
  
  return `
    <div class="rigidity ${rigid ? 'rigid' : 'flexible'}">
      <span class="maxwell">V=${V} E=${E} F=${F}</span>
      <span class="status">${rigid ? 'RIGID' : 'FLEXIBLE'}</span>
      <span class="delta">Δ = ${isostaticDistance > 0 ? '+' : ''}${isostaticDistance}</span>
    </div>
  `;
}
```

## 5.5 WebSocket Wire Protocol

### Client → Server

```typescript
type ClientMessage =
  | { type: 'SET_VERTEX'; id: 'v0'|'v1'|'v2'|'v3'; x: number; y: number; z: number }
  | { type: 'ADD_SHAPE'; shapeId: string; shapeType: ShapeType; x: number; y: number; z: number; rotY?: number }
  | { type: 'MOVE_SHAPE'; shapeId: string; x: number; y: number; z: number; rotY?: number }
  | { type: 'REMOVE_SHAPE'; shapeId: string }
  | { type: 'RESET_SHAPES' }
  | { type: 'RESET' }
  | { type: 'ping' };
```

### Server → Client

```typescript
type ServerMessage =
  | { type: 'hello'; state: Record<string, Vertex>; shapes: Record<string, Shape>; version: number; clientId: string; rigidity: RigidityInfo }
  | { type: 'op'; op: ClientMessage; version: number; ts: number; clientId: string; rigidity?: RigidityInfo }
  | { type: 'joined'; clientId: string; ts: number }
  | { type: 'left'; clientId: string; ts: number }
  | { type: 'pong' }
  | { type: 'error'; code: string; message: string; max?: number };
```

## 5.6 K₄ Cage (Family Tetrahedron)

```javascript
const K4_CAGE = {
  vertices: [
    { id: 'v0', label: 'will',     x: -5, y:  5, z:  5, color: 0x4ecdc4 },  // Teal
    { id: 'v1', label: 'sj',       x: -5, y: -5, z: -5, color: 0xff6b6b },  // Coral
    { id: 'v2', label: 'wj',       x:  5, y:  5, z: -5, color: 0xffe66d },  // Butter
    { id: 'v3', label: 'christyn', x:  5, y: -5, z:  5, color: 0x9b59b6 }   // Purple
  ],
  
  // All 6 edges of K₄
  edges: [
    ['v0', 'v1'], ['v0', 'v2'], ['v0', 'v3'],
    ['v1', 'v2'], ['v1', 'v3'],
    ['v2', 'v3']
  ]
};

// In live mode, vertices are draggable
// Labels follow the family vertex colors
```

## 5.7 Three.js Implementation

```javascript
class GeodesicBuilder {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.mode = options.mode || 'campaign'; // 'campaign' | 'live'
    this.roomId = options.roomId || null;
    
    // Three.js setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0a);
    
    this.camera = new THREE.PerspectiveCamera(60, canvas.width / canvas.height, 0.1, 1000);
    this.camera.position.set(0, 15, 25);
    
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(canvas.width, canvas.height);
    
    // Controls
    this.controls = new THREE.OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    
    // Lighting
    const ambient = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambient);
    
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(10, 20, 10);
    this.scene.add(dir);
    
    // State
    this.shapes = new Map();
    this.cage = new Map();
    this.selectedShape = null;
    
    // Raycaster
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    // Initialize
    if (this.mode === 'live') {
      this.initK4Cage();
      this.connectWebSocket();
    } else {
      this.seedCampaign();
    }
    
    this.bindEvents();
    this.animate();
  }
  
  initK4Cage() {
    // Create 4 draggable vertices
    for (const v of K4_CAGE.vertices) {
      const geometry = new THREE.SphereGeometry(0.5, 32, 32);
      const material = new THREE.MeshPhongMaterial({
        color: v.color,
        emissive: v.color,
        emissiveIntensity: 0.2
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(v.x, v.y, v.z);
      mesh.userData = { type: 'vertex', id: v.id, label: v.label };
      
      this.scene.add(mesh);
      this.cage.set(v.id, mesh);
      
      // Add label
      const label = this.createLabel(v.label);
      label.position.set(v.x, v.y + 0.8, v.z);
      this.scene.add(label);
    }
    
    // Create edges between vertices
    for (const [a, b] of K4_CAGE.edges) {
      const vA = this.cage.get(a).position;
      const vB = this.cage.get(b).position;
      
      const geometry = new THREE.BufferGeometry().setFromPoints([vA, vB]);
      const material = new THREE.LineBasicMaterial({ 
        color: 0x4ecdc4, 
        transparent: true, 
        opacity: 0.3 
      });
      const line = new THREE.Line(geometry, material);
      line.userData = { type: 'edge', a, b };
      
      this.scene.add(line);
    }
  }
  
  createShape(id, type, x, y, z, rotY = 0) {
    let geometry;
    switch (type) {
      case 'tet': geometry = new THREE.TetrahedronGeometry(1); break;
      case 'oct': geometry = new THREE.OctahedronGeometry(1); break;
      case 'ico': geometry = new THREE.IcosahedronGeometry(1); break;
      case 'cube': geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5); break;
    }
    
    const material = new THREE.MeshPhongMaterial({
      color: 0x4ecdc4,
      transparent: true,
      opacity: 0.8
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotY;
    mesh.userData = { type: 'shape', id, shapeType: type };
    
    this.scene.add(mesh);
    this.shapes.set(id, mesh);
    
    return mesh;
  }
  
  createLabel(text) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, 256, 64);
    
    ctx.font = 'bold 32px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(text, 128, 44);
    
    const texture = new THREE.CanvasTexture(canvas);
    return new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
  }
  
  bindEvents() {
    let dragged = null;
    let dragPlane = null;
    
    this.canvas.addEventListener('pointerdown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      
      this.raycaster.setFromCamera(this.mouse, this.camera);
      
      // Check shapes and cage vertices
      const targets = [
        ...Array.from(this.shapes.values()),
        ...Array.from(this.cage.values())
      ];
      
      const hits = this.raycaster.intersectObjects(targets);
      
      if (hits.length > 0) {
        dragged = hits[0].object;
        
        // Create drag plane
        dragPlane = new THREE.Plane();
        dragPlane.setFromNormalAndCoplanarPoint(
          this.camera.getWorldDirection(new THREE.Vector3()),
          dragged.position
        );
        
        this.canvas.setPointerCapture(e.pointerId);
      }
    });
    
    this.canvas.addEventListener('pointermove', (e) => {
      if (!dragged || !dragPlane) return;
      
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      
      this.raycaster.setFromCamera(this.mouse, this.camera);
      
      const target = new THREE.Vector3();
      this.raycaster.ray.intersectPlane(dragPlane, target);
      
      if (target) {
        dragged.position.copy(target);
        
        // Update label if cage vertex
        if (dragged.userData.type === 'vertex') {
          // Find and update label position
          // (Implementation detail)
        }
        
        // Send update via WebSocket if live mode
        if (this.mode === 'live' && this.ws) {
          this.throttledUpdate(dragged.userData, target);
        }
      }
    });
    
    this.canvas.addEventListener('pointerup', (e) => {
      if (dragged) {
        this.canvas.releasePointerCapture(e.pointerId);
        dragged = null;
        dragPlane = null;
      }
    });
  }
  
  throttledUpdate(userData, position) {
    // Throttle to ~20Hz
    if (this._updateTimeout) return;
    
    this._updateTimeout = setTimeout(() => {
      this._updateTimeout = null;
    }, 50);
    
    if (userData.type === 'vertex') {
      this.send({
        type: 'SET_VERTEX',
        id: userData.id,
        x: position.x,
        y: position.y,
        z: position.z
      });
    } else if (userData.type === 'shape') {
      this.send({
        type: 'MOVE_SHAPE',
        shapeId: userData.id,
        x: position.x,
        y: position.y,
        z: position.z
      });
    }
  }
  
  animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
```

---

# 6. Integration Points

## 6.1 Garden ↔ Geodesic Metaphor

```
Physical Garden                    Digital Geodesic
─────────────────────────────────────────────────────
Sunflower fortress (enclosure)  →  K₄ cage (4-vertex room)
S.J.'s square (ownership)         →  Personal shape collection
W.J.'s square (ownership)       →  Personal shape collection  
Yes zone (free picking)         →  Free build mode (no coach)
Sensory barefoot path           →  Starfield touch response
Wind library (sound)            →  Audio synthesis
Named tree                      →  Named vertex/avatar
Seasonal planting               →  Shape evolution/fading
```

## 6.2 Phos ↔ Garden State

```javascript
// Garden observation becomes Phos input
const gardenObservation = {
  child_id: 'wj-001',
  garden_state: {
    molecules_today: ['H2O', 'CO2'],
    current_action: 'building',
    sensory_profile: 'moss_cool',
    location: 'wj-square'
  },
  input: 'I built two waters',
  pre_reader: true
};

// Phos responds (non-evaluative, mirroring)
// "Two waters. The garden is wet today."
// "Carbon dioxide likes to float up. You built it anyway."
```

## 6.3 Shared Atmosphere Configuration

```json
{
  "id": "garden-warm",
  "starfieldPreset": "soup",
  "radiusToken": "xl",
  "typeScaleRem": "lg", 
  "motionBudget": 4,
  "soundProfile": "organic",
  "paletteEmphasis": "phosphorus"
}
```

---

# 7. Implementation Code

## 7.1 Campaign Event System

```javascript
class CampaignManager {
  constructor(builder) {
    this.builder = builder;
    this.trackIdx = 0;
    this.stepIdx = 0;
    this.done = false;
    
    // Load saved progress
    const saved = localStorage.getItem('geodesic:progress:v1');
    if (saved) {
      const data = JSON.parse(saved);
      this.trackIdx = data.track || 0;
      this.stepIdx = data.step || 0;
      this.done = data.done || false;
    }
    
    if (!this.done) {
      this.renderCoach();
    }
  }
  
  fireEvent(type) {
    if (this.done || this.builder.mode === 'live') return;
    
    const track = CAMPAIGN.tracks[this.trackIdx];
    if (!track) return;
    
    const step = track.steps[this.stepIdx];
    if (!step) return;
    
    // Check match
    let matches = false;
    if (step.waitFor === type) matches = true;
    else if (step.waitFor.startsWith('shape_count:') && type.startsWith('shape_count:')) {
      const n = parseInt(type.split(':')[1]);
      const target = parseInt(step.waitFor.split(':')[1]);
      if (n >= target) matches = true;
    }
    else if (step.waitFor === 'any_tap' && type === 'any_tap') matches = true;
    
    if (matches) {
      // Show celebration
      if (step.celebration) {
        this.showToast(step.celebration);
      }
      
      // Advance
      this.stepIdx++;
      if (this.stepIdx >= track.steps.length) {
        this.trackIdx++;
        this.stepIdx = 0;
        
        // Unlock tools for new track
        if (this.trackIdx < CAMPAIGN.tracks.length) {
          this.unlockThrough(this.trackIdx);
        } else {
          this.done = true;
        }
      }
      
      this.save();
      this.renderCoach();
    }
  }
  
  unlockThrough(trackIdx) {
    for (let i = 0; i <= trackIdx && i < CAMPAIGN.tracks.length; i++) {
      const unlocks = CAMPAIGN.tracks[i].unlock || [];
      for (const id of unlocks) {
        const el = document.getElementById(id);
        if (el) el.classList.remove('locked');
      }
    }
  }
  
  save() {
    localStorage.setItem('geodesic:progress:v1', JSON.stringify({
      track: this.trackIdx,
      step: this.stepIdx,
      done: this.done,
      schema: 'geodesic:progress:v1'
    }));
  }
  
  skip() {
    this.done = true;
    this.save();
    this.unlockThrough(CAMPAIGN.tracks.length - 1);
    document.getElementById('coach').style.display = 'none';
  }
  
  showToast(message) {
    const toast = document.getElementById('coach-toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2200);
  }
  
  renderCoach() {
    const track = CAMPAIGN.tracks[this.trackIdx];
    const step = track?.steps[this.stepIdx];
    if (!step) return;
    
    document.getElementById('coach-emoji').textContent = step.emoji;
    document.getElementById('coach-msg').textContent = step.msg;
    document.getElementById('coach-progress').textContent = 
      `${this.stepIdx + 1}/${track.steps.length}`;
  }
}
```

## 7.2 Auto-Snap Implementation

```javascript
function tryCornerSnap(draggedShape, otherShapes, threshold = 0.5) {
  const draggedCorners = getCorners(draggedShape);
  
  for (const other of otherShapes) {
    if (other === draggedShape) continue;
    
    const otherCorners = getCorners(other);
    
    for (const dc of draggedCorners) {
      for (const oc of otherCorners) {
        const dist = dc.world.distanceTo(oc.world);
        
        if (dist < threshold) {
          // Snap!
          const delta = oc.world.clone().sub(dc.world);
          draggedShape.position.add(delta);
          
          // Fire event for campaign
          campaign.fireEvent('snap_used');
          
          return true;
        }
      }
    }
  }
  
  return false;
}

function getCorners(mesh) {
  const box = new THREE.Box3().setFromObject(mesh);
  const corners = [
    new THREE.Vector3(box.min.x, box.min.y, box.min.z),
    new THREE.Vector3(box.max.x, box.min.y, box.min.z),
    new THREE.Vector3(box.min.x, box.max.y, box.min.z),
    new THREE.Vector3(box.max.x, box.max.y, box.min.z),
    new THREE.Vector3(box.min.x, box.min.y, box.max.z),
    new THREE.Vector3(box.max.x, box.min.y, box.max.z),
    new THREE.Vector3(box.min.x, box.max.y, box.max.z),
    new THREE.Vector3(box.max.x, box.max.y, box.max.z)
  ];
  
  return corners.map(c => ({
    local: c.clone(),
    world: c.applyMatrix4(mesh.matrixWorld)
  }));
}
```

---

# Appendix: Quick Reference

## Garden Plants by Season

| Season | Plant | Zone 8b Notes |
|--------|-------|---------------|
| Spring | Snapdragons, strawberries, tomatoes | March equinox planting |
| Summer | Sunflowers, zinnias, cosmos, pole beans | Mid-April direct seed |
| Fall | Fringe tree, satsuma, moonflower seed saving | September equinox |
| Winter | Blueberries, figs, named-tree ceremony | December solstice |

## Geodesic Limits

| Limit | Value |
|-------|-------|
| Shapes per room | 50 (SHAPE_CAP) |
| WebSocket clients | 32 per room |
| Room ID length | 1-64 chars `[a-zA-Z0-9_-]` |
| Position bounds | ±50 units |
| Snap threshold | 0.5 units |

## Wire Protocol Versions

| Component | Schema |
|-----------|--------|
| Garden Zone | `p31.gardenZone/1.0.0` |
| Garden Log | `p31.phos.gardenState/1.0.0` |
| Geodesic Room | `p31.geodesicRoomWire/0.2.1` |
| Geodesic Snapshot | `p31.geodesicBuildSnapshot/1.0.0` |
| Campaign Progress | `geodesic:progress:v1` |

## File Locations

```
/home/p31/
├── docs/PLAN-KIDS-PHYSICAL-GARDEN.md          # This garden plan
├── garden-phos-probe.html                     # Operator Phos probe
├── design-assets/atmosphere/
│   ├── p31-atmosphere-ramp.json              # garden-warm ramp
│   └── p31-atmosphere-routes.json            # surface routing
└── andromeda/04_SOFTWARE/p31ca/
    ├── ground-truth/garden-zone-8b.json      # Garden manifest
    ├── public/geodesic.html                  # Geodesic builder
    └── public/quantum-family.html           # Garden Log section
```

---

*Document: P31-GARDEN-GEODESIC-BUILDER-COMPLETE.md*
*Version: 1.0.0*
*Generated: 2026-05-03*
*Garden Zone: 8b/9a (Camden County, GA)*
*Wire Schema: p31.geodesicRoomWire/0.2.1*