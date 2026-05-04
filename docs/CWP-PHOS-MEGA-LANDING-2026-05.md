# CWP-P31-PHOS-MEGA-LANDING-2026-05
**Controlled Work Package: PHOS Spatial Navigation Landing Page**
**Classification:** P0 - Product Defining  
**Target:** Gemini Review & Implementation  
**Vision:** Make PHOS the centerpiece; 9 MVPs as orbital protectors; spatial molecular navigation

---

## 1. EXECUTIVE SUMMARY

Transform `index.html` from a static landing page into a **spatial, molecular navigation system** where PHOS is the central sun and 9 MVPs orbit as protective nodes. The experience should feel like a standalone app—fun, discoverable, and deeply interactive.

**Core Philosophy:**
- No cards. No traditional grids. Pure spatial relationships.
- Everything floats, pulses, breathes, connects.
- Every interaction teaches the user about P31's ecosystem.
- The page IS the product—not a brochure for it.

---

## 2. THE 9 MVP ORBITAL NODES

The 9 MVPs become 3D orbital nodes arranged in a **K4 tetrahedral geometry** (4 vertices + center + 4 extended). Each node has:

### Node Hierarchy (Distance from PHOS Center)

| Ring | Distance | Nodes | Purpose |
|------|----------|-------|---------|
| **Core** | 0px | PHOS | Central sun, the operating system itself |
| **Inner** | 200px | 4 nodes | Family mesh essentials |
| **Outer** | 350px | 4 nodes | Professional/power tools |

### The 9 Nodes Defined

**INNER RING (Family Essentials):**
1. **COG** (🧠 Cognitive Passport) - Identity, accessibility profiles, accommodations
2. **SOUP** (🍲 C.A.R.S.) - Bonding, family coordination, neurodivergent tools  
3. **PHOS** (👶 Children's Companion) - S.J. & W.J.'s interface, kid-safe mode
4. **MESH** (🌐 K4 Personal) - Family network topology, live mesh status

**OUTER RING (Pro/Power Tools):**
5. **GLASS** (📊 Transparency) - Glass box, audits, open infrastructure
6. **SENTINEL** (🛡️ Security) - Swarm monitoring, threat detection, passkeys
7. **FORGE** (⚒️ Builder Tools) - Geodesic creator, room builder, dev tools
8. **ORACLE** (🔮 Intelligence) - Agent swarm, inference, LLM orchestration

**CENTER:**
9. **CORE** (⭐ PHOS) - The operating system hub, measurement apparatus, Akinator engine

---

## 3. SPATIAL NAVIGATION SYSTEM

### 3.1 Visual Architecture

```
                    [ORACLE]
                       |
                       | 350px
                       |
        [MESH] ---- [PHOS/CORE] ---- [FORGE]
           |     \      |      /     |
         200px    \   200px   /    350px
                   \   |   /
                    \ | /
                   [SOUP]
                     |
                   [GLASS]
                     |
                   [COG]
                     |
                   [SENTINEL]
```

### 3.2 Molecular Aesthetic

- **Nodes:** Glowing spheres with internal structure (like electron orbitals)
- **Connections:** Pulsing energy beams between related nodes
- **Background:** Deep starfield with K4 mesh constellations
- **PHOS Center:** A beating, multi-layered core with orbital rings
- **Particles:** Ambient "data dust" flowing between nodes

### 3.3 Physics & Animation

- **Orbital Drift:** Nodes slowly orbit PHOS (60-120s per revolution)
- **Breathing:** All nodes pulse in coherence (synced to simulated "mesh heartbeat")
- **Connections:** Spring physics between related nodes
- **Mouse Influence:** Cursor creates gravitational field (nodes gently attracted/repelled)
- **Idle Mode:** When inactive, camera slowly pans, nodes orbit faster

---

## 4. INTERACTION MODEL

### 4.1 Hover States (Discovery)

| Element | Hover Effect | PHOS Response |
|---------|--------------|---------------|
| **Node** | Scale 1.3x, glow intensifies, orbital ring appears | PHOS "looks" at node (eye tracking) |
| **Connection** | Beam brightens, data particles flow faster | PHOS whispers the relationship |
| **PHOS Core** | Core beats faster, rings expand | "I'm listening..." |
| **Empty Space** | Cursor leaves subtle trail | Ambient curiosity |

**PHOS Prompt System (on node hover):**
- Speech bubble appears from PHOS
- Contextual question or invitation
- Examples:
  - Hover COG: *"Need to update your passport?"*
  - Hover SOUP: *"Family dinner coordination?"*
  - Hover FORGE: *"Build something today?"*
  - Hover ORACLE: *"Ask me anything..."*

### 4.2 Click Actions (Navigation)

| Click Target | Single Click | Double Click |
|--------------|--------------|--------------|
| **Node** | Expand node details (preview panel) | Navigate to MVP |
| **PHOS Core** | Activate Akinator (20 questions mode) | Full PHOS panel expand |
| **Connection** | Show relationship info | Jump to integration docs |
| **Background** | Create new "wish" particle | Open random MVP |

### 4.3 Gesture & Keyboard

- **Drag:** Pan camera through 3D space
- **Scroll:** Zoom in/out (15%-200% scale)
- **Right-click:** Context menu (quick actions)
- **Space:** Pause/play orbital animation
- **Tab:** Cycle focus between nodes
- **Enter:** Activate focused node
- **Escape:** Return to center view

---

## 5. AKINATOR ENGINE INTEGRATION

### 5.1 The 20-Questions Resolver

When user clicks PHOS core or presses `/`, activate Akinator mode:

```
PHOS: "What are we building today?"
      [SELF] [FAMILY] [PRO] [EXPLORING]
      
User: FAMILY

PHOS: "What kind of family moment?"
      [COORDINATION] [BONDING] [LEARNING] [SUPPORT]
      
User: BONDING

PHOS: "What energy level?"
      [HIGH/ACTIVE] [CALM/QUIET] [CREATIVE] [ROUTINE]
      
User: CREATIVE

PHOS: → Recommends: "SOUP - Geodesic Builder" 
      "Build a 3D world together. Your kids love this."
```

### 5.2 Intent Confidence Display

- Real-time Bayesian probability meter
- Visual "thought cloud" showing decision tree
- Confidence threshold animation (fills up as questions answered)
- "I'm 87% sure you want..." 

### 5.3 Learning System

- Every interaction trains PHOS
- "Was this right? [👍] [👎]" feedback
- Weekly "PHOS has learned 12 new patterns" celebration

---

## 6. BOT SWARM VISUALIZATION

### 6.1 The Swarm Layer

Between nodes and background, a layer of "agent particles":

| Agent Type | Visual | Behavior | Count |
|------------|--------|----------|-------|
| **SCRIBE** | 📝 Floating text fragments | Cluster around content nodes | ~20 |
| **SENTINEL** | 🛡️ Shield motes | Orbit protectively, pulse on alert | ~12 |
| **HERALD** | 📢 Small sound waves | Emanate from active nodes | ~8 |
| **FORGE** | ⚡ Tiny lightning | Spark when building | ~6 |
| **MEDIC** | 💚 Green crosses | Float to "wounded" areas | ~4 |

### 6.2 Swarm Behaviors

- **Flocking:** Basic boids algorithm (separation, alignment, cohesion)
- **Node Attraction:** Swarm agents drift toward their "home" node type
- **Alert Mode:** When issue detected, SENTINELs converge and pulse red
- **Celebration:** On achievement, all agents do "firework" burst
- **Cursor Interaction:** Agents gently avoid or follow cursor based on type

---

## 7. GAMIFICATION & REWARDS

### 7.1 Progression Systems

**Explorer Badges:**
- 🌱 **First Contact** - Hover all 9 nodes
- 🔗 **Connection Weaver** - Click 10 node connections  
- 🎯 **Intent Master** - Complete 5 Akinator resolutions
- 🌌 **Deep Space** - Zoom to 50% and back
- ⚡ **Speed Runner** - Navigate to any MVP in <3 seconds

**Operator Titles:**
- Visitor → Navigator → Pilot → Commander → Architect → Mesh Lord

### 7.2 Daily Rewards

- **Daily Login:** Streak counter, small animation celebration
- **Discovery Bonus:** First hover of a new node each day
- **Weekly Recap:** "You explored 47 connections this week"

### 7.3 Collectibles

- **Data Fragments:** Tiny lore snippets hidden in particle effects
- **Node Skins:** Open alternate visual themes for MVPs
- **PHOS Moods:** Different core personalities (playful, serious, mysterious)

---

## 8. TECHNICAL ARCHITECTURE

### 8.1 Rendering Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Background** | Canvas 2D | Starfield, K4 mesh, ambient particles |
| **Connections** | SVG | Node relationship beams (DOM-accessible) |
| **Nodes** | DOM + CSS 3D | MVP buttons (interactive, accessible) |
| **Swarm** | Canvas 2D overlay | Agent particles (boids simulation) |
| **PHOS Core** | Canvas 2D or WebGL | Central animated character |
| **UI Chrome** | DOM | Akinator panel, speech bubbles, HUD |

### 8.2 State Management

```javascript
// PHOS Spatial State
const phosState = {
  camera: { x, y, zoom, targetZoom },
  nodes: [
    { id, angle, distance, velocity, expanded, focused }
  ],
  connections: [
    { source, target, strength, active }
  ],
  swarm: [
    { type, x, y, vx, vy, targetNode }
  ],
  user: {
    explorationCount,
    badges: [],
    preferences,
    lastVisit
  },
  akinator: {
    active,
    questionIndex,
    currentIntent,
    confidence,
    path: []
  }
};
```

### 8.3 Performance Budget

- **Target:** 60fps on mid-range devices
- **Particle Limit:** Max 200 swarm agents
- **Animation:** Use `transform` and `opacity` only (GPU-accelerated)
- **Lazy Loading:** MVP content loads on first click
- **Safe Mode:** Reduced particles, no physics, static layout

---

## 9. IMPLEMENTATION PHASES

### Phase 1: Foundation (Week 1)
- [ ] Canvas starfield background (reuse existing, enhance)
- [ ] PHOS core visual (centered, pulsing)
- [ ] 9 nodes positioned in K4 geometry
- [ ] Basic orbital animation
- [ ] Mouse hover detection

### Phase 2: Interactions (Week 2)
- [ ] Hover-to-expand node details
- [ ] PHOS speech bubble system
- [ ] Click to navigate (single/double)
- [ ] Camera pan/zoom
- [ ] Connection beam visualization

### Phase 3: Intelligence (Week 3)
- [ ] Akinator engine integration
- [ ] Intent resolution UI
- [ ] PHOS prompt generation
- [ ] Learning feedback loop

### Phase 4: Swarm & Polish (Week 4)
- [ ] Agent particle system
- [ ] Boids flocking behavior
- [ ] Gamification layer (badges, progress)
- [ ] Sound design (ambient, interactions)
- [ ] Accessibility audit

---

## 10. DESIGN PRINCIPLES

1. **Joy Through Discovery:** Every interaction should surprise and delight
2. **Progressive Disclosure:** Simple at first, depth on exploration
3. **No Dead Ends:** Every path leads somewhere meaningful
4. **Accessibility First:** Spatial but keyboard-navigable, screen-reader friendly
5. **Performance is Design:** 60fps is a feature
6. **Mobile-First Spatial:** Touch gestures, pinch-to-zoom, gyro parallax

---

## 11. SUCCESS METRICS

- **Engagement:** Average 3+ minutes on landing page
- **Exploration:** 80% of users hover all 9 nodes in first visit
- **Conversion:** 40% click through to an MVP
- **Return:** 60% return within 7 days
- **Delight:** "This is so cool" feedback threshold

---

## 12. APPENDIX: CODE ARCHITECTURE SKETCH

```javascript
// Main PHOS Spatial Controller
class PHOSSpatialController {
  constructor() {
    this.canvas = document.getElementById('spatial-canvas');
    this.nodes = this.initializeNodes();
    this.swarm = new SwarmSystem();
    this.akinator = new AkinatorEngine();
    this.camera = { x: 0, y: 0, zoom: 1 };
    this.loop = this.loop.bind(this);
  }
  
  initializeNodes() {
    return NINE_MVPS.map((mvp, i) => new OrbitalNode({
      id: mvp.id,
      angle: (i / 9) * Math.PI * 2,
      distance: i < 4 ? 200 : 350,
      data: mvp
    }));
  }
  
  loop() {
    this.updatePhysics();
    this.render();
    requestAnimationFrame(this.loop);
  }
}

// Individual Node Class
class OrbitalNode {
  constructor(config) {
    this.angle = config.angle;
    this.distance = config.distance;
    this.element = this.createDOMElement();
    this.connections = [];
  }
  
  update(time) {
    // Orbital drift
    this.angle += 0.0005;
    this.x = Math.cos(this.angle) * this.distance;
    this.y = Math.sin(this.angle) * this.distance;
    
    // Breathing pulse
    this.pulse = Math.sin(time * 0.002) * 0.1 + 1;
  }
}
```

---

**END OF SPECIFICATION**

Ready for Gemini review and implementation planning.
