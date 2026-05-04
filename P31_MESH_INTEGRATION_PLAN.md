# P31 Mesh Integration & Standardization Plan
**Document ID:** p31.meshIntegration/1.0.0  
**Date:** 2026-05-04  
**Status:** Audit Complete — Implementation Phase

---

## 1. CURRENT STATE AUDIT

### 1.1 Starfield Implementation Matrix

| File | Current Starfield | Type | Stars | K4 Connections | Status |
|------|-------------------|------|-------|----------------|--------|
| index.html | ✅ Full Smart Starfield | Canvas 2D | 150 | Yes (max 3) | ✅ Canonical |
| soup.html | ✅ QuantumFoam + Physics | Canvas 2D | 70 | No (different system) | ⚠️ Needs sync |
| agents.html | ❌ Missing | — | — | — | 🔴 Add |
| fleet-portal.html | ❌ Missing | — | — | — | 🔴 Add |
| glass-box.html | ❌ Missing | — | — | — | 🔴 Add |
| phos-core-docs.html | ❌ Missing | — | — | — | 🔴 Add |
| psych-e2e-live.html | ❌ Missing | — | — | — | 🔴 Add |
| (18 other files) | ❌ Unknown/None | — | — | — | 🔴 Audit needed |

### 1.2 QMU Token Audit

**Canonical Token Set (index.html standard):**
```css
--p31-void: #0f1115;
--p31-surface: #161920;
--p31-surface2: #1c2028;
--p31-cyan: #4db8a8;
--p31-coral: #cc6247;
--p31-butter: #cda852;
--p31-lavender: #8b7cc9;
--p31-phosphorus: #3ba372;
--p31-cloud: #d8d6d0;
--p31-muted: #6b7280;
--p31-glass-border: rgba(255, 255, 255, 0.08);
```

**Files Needing QMU Updates:**
- [ ] agents.html — Legacy hex values suspected
- [ ] fleet-portal.html — Check p31-style.css refs
- [ ] glass-box.html — Has inline styles
- [ ] command-center-cli.html — Unknown state
- [ ] command-center-terminal.html — Unknown state
- [ ] All other HTML files (18 remaining)

### 1.3 PHOS Integration Status

| File | PHOS Core | Safe Mode | PHOS Mascot | Status |
|------|-----------|-----------|-------------|--------|
| index.html | ✅ | ✅ | ✅ Large | ✅ Complete |
| soup.html | ✅ | ✅ | ✅ Small | ✅ Complete |
| agents.html | ✅ | ✅ | ❌ | ⚠️ Needs mascot |
| fleet-portal.html | ✅ | ✅ | ❌ | ⚠️ Needs mascot |
| glass-box.html | ✅ | ✅ | ❌ | ⚠️ Needs mascot |
| phos-core-docs.html | ✅ | ✅ | ✅ | ✅ Complete |
| (18 others) | ❌ | ❌ | ❌ | 🔴 Add all |

---

## 2. IMPLEMENTATION PLAN

### PHASE 1: Smart Starfield Module (Priority: HIGH)

**Goal:** Create reusable SmartStarfield class that can be embedded in any surface.

**Architecture:**
```javascript
// public/lib/p31-smart-starfield.js
class SmartStarfield {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.stars = [];
    this.options = {
      starCount: options.starCount || 150,
      connectionDistance: options.connectionDistance || 100,
      maxConnections: options.maxConnections || 3,
      coherenceSource: options.coherenceSource || null, // element ID to read %
      pulseSync: options.pulseSync || true,
      ...options
    };
  }
  
  init() { /* init stars */ }
  draw() { /* draw with K4 connections */ }
  resize() { /* handle DPR + resize */ }
  destroy() { /* Gray Rock cleanup */ }
}

// Usage in any HTML file:
// const sf = new SmartStarfield('starfieldCanvas', { starCount: 150 });
// sf.init(); sf.animate();
```

**Deliverables:**
1. `public/lib/p31-smart-starfield.js` — Reusable module
2. Update `index.html` to use module (extract from inline)
3. Update `soup.html` to use module (replace QuantumFoam)
4. Add to all other HTML files

### PHASE 2: QMU Token Standardization (Priority: HIGH)

**Goal:** All 24 HTML files use canonical QMU tokens.

**Approach:**
1. Create `public/lib/p31-qmu-tokens.css` — Universal token file
2. Each HTML file adds: `<link rel="stylesheet" href="/lib/p31-qmu-tokens.css">`
3. Remove inline token definitions from all files
4. Use CSS custom properties consistently

**Migration Strategy:**
```bash
# Files to update (24 total)
agents.html
command-center-cli.html
command-center-terminal.html
demo-tour.html
fleet-portal.html
garden-phos-probe.html
glass-box.html
glass-box-widget.html
launch-readiness.html
launch.html
p31-cheat-sheet.html
p31-device-setup.html
p31-personal-howto.html
p31-quantum-material-u.html
p31-slicer.html
p31-sovereign-lab.html
p31-sovereign-lab-v2.html
phos-core-docs.html
phos-mascot.html
poets-room.html
psych-e2e-docs.html
psych-e2e-live.html
soup.html
index.html (already canonical)
```

### PHASE 3: PHOS Integration Completeness (Priority: MEDIUM)

**Goal:** Every surface has PHOS protection.

**Standard PHOS Package for any surface:**
```html
<!-- 1. Safe Mode Toggle -->
<button id="safeToggle" class="safe-toggle">Safe Mode</button>

<!-- 2. PHOS Mascot (small variant for non-landing pages) -->
<div class="phos-mascot-mini" onclick="phosInteract()">
  <svg><!-- PHOS tetrahedron --></svg>
</div>

<!-- 3. PHOS Atmosphere Core -->
<script src="/lib/p31-atmosphere-core.js"></script>

<!-- 4. Safe Mode Script -->
<script>
  document.getElementById('safeToggle').onclick = () => {
    document.body.classList.toggle('safe-mode');
    // Any canvas/WebGL destruction here
  };
</script>
```

### PHASE 4: Mesh Entanglement Messaging (Priority: MEDIUM)

**Goal:** Real-time mesh state communication across surfaces.

**Architecture:**
```javascript
// Mesh Entanglement Protocol (MEP)
// Using BroadcastChannel API (same-origin) or localStorage fallback

class MeshEntanglement {
  constructor(surfaceId) {
    this.surfaceId = surfaceId;
    this.channel = new BroadcastChannel('p31_mesh');
    this.listeners = new Map();
    this.init();
  }
  
  init() {
    this.channel.onmessage = (e) => this.handleMessage(e.data);
  }
  
  emit(type, payload) {
    this.channel.postMessage({
      type,
      payload,
      source: this.surfaceId,
      timestamp: Date.now()
    });
  }
  
  on(type, callback) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(callback);
  }
  
  handleMessage(msg) {
    // Don't echo own messages
    if (msg.source === this.surfaceId) return;
    
    const handlers = this.listeners.get(msg.type) || [];
    handlers.forEach(h => h(msg.payload, msg.source));
  }
}

// Message Types:
// - 'coherence:update' — Share coherence % across surfaces
// - 'safe-mode:change' — Sync safe mode across tabs
// - 'phos:speak' — PHOS messages appear on all surfaces
// - 'mesh:ping' — Heartbeat/liveness check
// - 'node:drag' — Real-time node position sync (C.A.R.S.)
```

**Features to Wire:**
1. Coherence value syncs across all open surfaces
2. Safe Mode toggles sync across all tabs
3. PHOS speech appears on all surfaces simultaneously
4. C.A.R.S. node positions broadcast in real-time
5. Mesh health heartbeat every 30 seconds

---

## 3. EXECUTION ORDER

### Sprint 1: Foundation (Days 1-2)
1. ✅ AUDIT — Document current state (DONE)
2. 🔨 CREATE — `p31-smart-starfield.js` module
3. 🔨 CREATE — `p31-qmu-tokens.css` universal tokens
4. 🔨 CREATE — `p31-mesh-entanglement.js` messaging module

### Sprint 2: Core Surfaces (Days 3-4)
1. 🔄 UPDATE — index.html → use starfield module
2. 🔄 UPDATE — soup.html → use starfield module + keep physics
3. 🔄 UPDATE — agents.html → add starfield + PHOS + QMU
4. 🔄 UPDATE — fleet-portal.html → add starfield + PHOS + QMU
5. 🔄 UPDATE — glass-box.html → add starfield + PHOS + QMU

### Sprint 3: Secondary Surfaces (Days 5-6)
1. 🔄 UPDATE — Remaining 18 HTML files
2. 🔄 BATCH — QMU token updates
3. 🔄 BATCH — PHOS integration

### Sprint 4: Mesh Features (Days 7-8)
1. 🔨 IMPLEMENT — Mesh entanglement on all surfaces
2. 🔨 IMPLEMENT — Coherence sync
3. 🔨 IMPLEMENT — Safe mode sync
4. 🔨 IMPLEMENT — PHOS broadcast

### Sprint 5: Validation (Day 9)
1. ✅ TEST — All 24 surfaces render correctly
2. ✅ TEST — Starfield present on all
3. ✅ TEST — PHOS integration working
4. ✅ TEST — Mesh messaging functional
5. ✅ TEST — Safe mode destroys all animations

---

## 4. ACCEPTANCE CRITERIA

- [ ] All 24 HTML files have smart starfield (150 stars, K4 connections)
- [ ] All 24 HTML files use canonical QMU tokens
- [ ] All 24 HTML files have PHOS integration (safe mode + mascot)
- [ ] Mesh entanglement syncs coherence across surfaces
- [ ] Safe mode on one surface triggers safe mode on all (same-origin)
- [ ] PHOS speech broadcasts to all open surfaces
- [ ] 60fps maintained on all surfaces
- [ ] Gray Rock protocol properly destroys all canvas contexts

---

## 5. TECHNICAL NOTES

### Starfield Performance Budget
- Max 150 stars per surface
- Max 3 connections per star
- O(n²) distance check optimized with early exit
- Use `requestAnimationFrame` with visibility check
- `ctx.clearRect()` not `fillRect()` for transparency

### QMU Token Inheritance
```css
/* p31-qmu-tokens.css */
:root {
  --p31-void: #0f1115;
  /* ... all tokens ... */
}

/* Surface override allowed for specific accents */
.surface-specific {
  --p31-accent-surface: color-mix(in srgb, var(--p31-cyan) 80%, var(--p31-void));
}
```

### Mesh Messaging Fallback
```javascript
// If BroadcastChannel not available (older browsers)
window.addEventListener('storage', (e) => {
  if (e.key === 'p31_mesh_message') {
    handleMessage(JSON.parse(e.newValue));
  }
});

// Emit via localStorage
localStorage.setItem('p31_mesh_message', JSON.stringify(msg));
```

---

**Next Action:** Create `p31-smart-starfield.js` module and begin Phase 1 implementation.
