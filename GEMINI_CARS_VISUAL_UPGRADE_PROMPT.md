# Gemini Prompt: C.A.R.S. Visual System Upgrade

## Context

**C.A.R.S.** (Context-Aware Relational Substrate / Social Molecules) is a 2D canvas-based physics simulation representing a family K₄ mesh topology. It has 4 vertices (family members) connected by 6 edges (relationships) with spring physics.

**Current State:** Physics are solid. Visuals are quantum-molecular but need polish.

**Goal:** Elevate the visual system to match the sophistication of the physics engine.

---

## Current Implementation Snippets

### 1. Node Structure (Data)
```javascript
const nodes = [
  { id: 'W', label: 'FORGE', color: '#25897d', x: 0, y: 0, vx: 0, vy: 0 },
  { id: 'C', label: 'COUNSEL', color: '#cc6247', x: 0, y: 0, vx: 0, vy: 0 },
  { id: 'SJ', label: 'SCHOLAR', color: '#3ba372', x: 0, y: 0, vx: 0, vy: 0 },
  { id: 'WJ', label: 'SCRIBE', color: '#8b7cc9', x: 0, y: 0, vx: 0, vy: 0 }
];

const edges = [
  { source: 0, target: 1, weight: 8 },
  { source: 0, target: 2, weight: 10 },
  { source: 0, target: 3, weight: 7 },
  { source: 1, target: 2, weight: 6 },
  { source: 1, target: 3, weight: 9 },
  { source: 2, target: 3, weight: 5 }
];
```

### 2. Current Draw Functions (Working Base)
```javascript
const time = Date.now() * 0.001;

function drawQuantumEdges() {
  edges.forEach((e, idx) => {
    const n1 = nodes[e.source];
    const n2 = nodes[e.target];
    const dist = Math.hypot(n2.x - n1.x, n2.y - n1.y);
    const energyIntensity = Math.max(0.3, 1 - dist / 400);
    
    // Gradient connection
    const grad = ctx.createLinearGradient(n1.x, n1.y, n2.x, n2.y);
    grad.addColorStop(0, `${n1.color}44`);
    grad.addColorStop(0.5, `rgba(77, 184, 168, ${energyIntensity * 0.6})`);
    grad.addColorStop(1, `${n2.color}44`);
    
    ctx.beginPath();
    ctx.moveTo(n1.x, n1.y);
    ctx.lineTo(n2.x, n2.y);
    ctx.strokeStyle = grad;
    ctx.lineWidth = e.weight * 1.5;
    ctx.lineCap = 'round';
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(77, 184, 168, 0.4)';
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Flowing particles
    const flowOffset = (time * 50 + idx * 100) % dist;
    const particleX = n1.x + (n2.x - n1.x) * (flowOffset / dist);
    const particleY = n1.y + (n2.y - n1.y) * (flowOffset / dist);
    
    ctx.beginPath();
    ctx.arc(particleX, particleY, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#4db8a8';
    ctx.fill();
    ctx.shadowBlur = 0;
  });
}

function drawQuantumNodes() {
  nodes.forEach((n, idx) => {
    const pulseScale = 1 + Math.sin(time * 2 + idx) * 0.05;
    const outerRadius = 35 * pulseScale;
    
    // Rotating orbital
    ctx.save();
    ctx.translate(n.x, n.y);
    ctx.rotate(time * 0.5 + idx * Math.PI / 2);
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius, 0, Math.PI * 1.5);
    ctx.strokeStyle = `${n.color}33`;
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.stroke();
    ctx.restore();
    
    // Glow ring
    ctx.beginPath();
    ctx.arc(n.x, n.y, 30 * pulseScale, 0, Math.PI * 2);
    const glowGrad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 30 * pulseScale);
    glowGrad.addColorStop(0, `${n.color}88`);
    glowGrad.addColorStop(0.7, `${n.color}22`);
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.fill();
    
    // Core sphere
    ctx.beginPath();
    ctx.arc(n.x, n.y, 22, 0, Math.PI * 2);
    const coreGrad = ctx.createRadialGradient(n.x - 7, n.y - 7, 0, n.x, n.y, 22);
    coreGrad.addColorStop(0, lightenColor(n.color, 40));
    coreGrad.addColorStop(0.3, n.color);
    coreGrad.addColorStop(1, darkenColor(n.color, 30));
    ctx.fillStyle = coreGrad;
    ctx.fill();
    
    // Label
    ctx.shadowBlur = 10;
    ctx.shadowColor = n.color;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(n.id, n.x, n.y + 1);
    ctx.shadowBlur = 0;
    
    // Full label
    ctx.fillStyle = 'rgba(216, 214, 208, 0.8)';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillText(n.label, n.x, n.y + 38);
  });
}
```

---

## Design Direction

**Inspiration:**
- Quantum Field Theory visualizations
- Neural network graphs (beautiful data viz)
- Sci-fi HUD interfaces (Minority Report, Iron Man)
- Molecular dynamics simulations
- Breathing, organic motion

**Color Palette (P31 Canon):**
```css
--p31-void: #0b0d10;     /* Background */
--p31-teal: #25897d;     /* W / FORGE */
--p31-coral: #cc6247;    /* C / COUNSEL */
--p31-phosphorus: #3ba372; /* SJ / SCHOLAR */
--p31-lavender: #8b7cc9; /* WJ / SCRIBE */
--p31-cyan: #4db8a8;     /* Accent / Glow */
--p31-cloud: #d8d6d0;    /* Text */
```

---

## Specific Upgrades Needed

### 1. **Edges: Energy Tethers**
- Replace straight lines with bezier curves (slight organic bend)
- Multiple particle streams per edge (not just 2)
- Particles should vary in size (leading larger, trailing smaller)
- Add "energy pulse" wave that travels down the connection
- Connection strength should affect visual thickness AND glow intensity

### 2. **Nodes: Molecular Spheres**
- Add specular highlight (shiny spot) for 3D effect
- Inner core should pulse with energy
- Multiple orbital rings at different speeds/directions
- Add subtle "aura" particles orbiting close to surface
- Labels should have background pill for readability

### 3. **System Effects**
- Background should have subtle "quantum foam" (tiny jittering dots)
- When nodes get close, edges should brighten
- Add "coherence burst" effect when dragging (particles spray briefly)
- Trail effects on dragged nodes

### 4. **Performance**
- Use `ctx.save()`/`ctx.restore()` sparingly
- Batch similar draw operations
- Consider offscreen canvas for static elements

---

## Output Format

Provide:
1. **Complete replacement** for `drawQuantumEdges()` function
2. **Complete replacement** for `drawQuantumNodes()` function
3. **New helper functions** (color utils, effects, etc.)
4. **Visual preview description** of what the changes accomplish

**Constraints:**
- Must work with existing physics system
- Must respect `safe-mode` (no animations when body has `.safe-mode`)
- Must use existing color palette
- Must maintain 60fps performance

---

## Success Criteria

When complete, the C.A.R.S. visualization should look like:
> "A living molecular simulation where 4 glowing spheres orbit in space, connected by pulsing energy tethers. The spheres have depth, shine, and rotating rings. The connections flow with particles. Everything breathes and moves organically. It looks like it belongs in a high-end data visualization or sci-fi interface."

---

## Current Render Loop Context

```javascript
function animate() {
  if(document.body.classList.contains('safe-mode')) return;
  
  // Background starfield (z-index: 1)
  if(starfieldActive) drawStars();
  
  // Physics update
  physicsStep();
  
  // Molecule rendering (z-index: 2) - THIS IS WHAT TO UPGRADE
  draw(); // Calls drawQuantumEdges() + drawQuantumNodes()
  
  animationId = requestAnimationFrame(animate);
}
```

---

**Execute:** Generate production-ready replacement functions that elevate C.A.R.S. to visual excellence.
