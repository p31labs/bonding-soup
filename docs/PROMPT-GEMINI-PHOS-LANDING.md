# Gemini Prompt: PHOS-for-US Landing Page
**Document ID:** prompt.phosLanding.v1  
**Target:** index.html  
**Style Reference:** Gemini-era molecular aesthetic (C.A.R.S. soup.html styling)  
**Concept:** PHOS-for-US / The Posner Calcium Cage

---

## 1. CORE CONCEPT (Do Not Deviate)

**PHOS-for-US** is not an operating system. It is the **Posner molecule** (Ca₉(PO₄)₆) of the Johnson family—a protective calcium cage that holds 4 vertices connected by 6 bonds.

**The Geometry:**
- 4 Calcium vertices: will, S.J., W.J., christyn
- 6 Phosphate bonds: the relationships between them
- 3 concentric rings: inner (family), middle (extended), outer (world)
- Center void: PHOS itself—the binding coherence

**The Posture:**
- "for-US" not "for-users"
- Personal infrastructure, not public product
- Protective cage, not extractive platform
- The geometry holds

---

## 2. VISUAL AESTHETIC (Preserve Exactly)

**Color Palette (P31 Quantum Material U):**
```css
--p31-void: #0b0d10;           /* Deep void black */
--p31-surface: #161920;        /* Surface panel */
--p31-surface2: #1c2028;       /* Elevated panel */
--p31-teal: #25897d;           /* Phosphate binding */
--p31-coral: #cc6247;          /* Stress/alert */
--p31-butter: #cda852;         /* Safe/warm */
--p31-lavender: #8b7cc9;       /* Christyn/heart */
--p31-phosphorus: #3ba372;     /* Coherence/life */
--p31-cyan: #4db8a8;           /* Glow/active */
--p31-cloud: #d8d6d0;          /* Text primary */
--p31-muted: #6b7280;          /* Text secondary */
--p31-glass-border: rgba(255, 255, 255, 0.08);
```

**Typography:**
- Headings: `"Atkinson Hyperlegible", system-ui, sans-serif`
- Technical/mono: `"JetBrains Mono", monospace`
- Weights: 400 (body), 700 (headings), 500 (UI)

**Visual Language Rules:**
- Glass morphism: `backdrop-filter: blur(20px)`
- Border radius: 8px-12px for panels, 50% for nodes
- Shadows: Soft drop-shadows with teal/green glows
- Transitions: `cubic-bezier(0.34, 1.56, 0.64, 1)` for bouncy interactions
- NO bright colors, NO gradients except subtle teal→green

---

## 3. SPATIAL LAYERS (Z-Index Architecture)

**Layer 0: Phosphate Field (Background)**
- 150 drifting particles (teal/white)
- K4 mesh connections between nearby particles
- Slow drift velocity (±0.2 px/frame)
- `pointer-events: none` (does not capture mouse)
- Clears completely each frame (`clearRect`, no trails)

**Layer 1: Cage Geometry (Canvas)**
- 6 bond lines connecting 4 vertices
- 3 concentric rings (orbital paths)
- Pulsing Larmor resonance rings
- `z-index: 10`, `pointer-events: none` for canvas

**Layer 2: The 4 Vertices (DOM Elements)**
- Circular nodes, 56px diameter
- Initials displayed (WJ, SJ, W, C)
- Labels on hover
- `z-index: 20`, `pointer-events: auto`
- Positioned absolutely, animated via `transform: translate3d`

**Layer 3: PHOS Core (Center)**
- Posner tetrahedron SVG
- Breathing animation (scale + rotate)
- Eye tracking (pupils follow cursor)
- Click to open Akinator
- `z-index: 15`

**Layer 4: UI Chrome**
- Safe Mode toggle (top-right)
- Coherence HUD (bottom-left)
- PHOS whisper panel (top-left)
- `z-index: 50-60`

---

## 4. THE 4 VERTICES (Data Structure)

```javascript
const VERTICES = [
  {
    id: 'will',
    initial: 'WJ',
    label: 'Will',
    fullLabel: 'FORGE / Infrastructure',
    color: '#25897d', // Teal
    ring: 1,
    angle: 0,
    tools: [
      { name: 'Operator', link: '/ops.html' },
      { name: 'Builder', link: '/geodesic.html' },
      { name: 'Fleet', link: '/fleet.html' }
    ]
  },
  {
    id: 'sj',
    initial: 'SJ',
    label: 'S.J.',
    fullLabel: 'SCHOLAR / Creative',
    color: '#cc6247', // Coral
    ring: 1,
    angle: Math.PI * 2 / 3,
    tools: [
      { name: 'Studio', link: '/vibe.html' },
      { name: 'Library', link: '/docs/' },
      { name: 'Glass', link: '/glass-box.html' }
    ]
  },
  {
    id: 'wj',
    initial: 'W',
    label: 'W.J.',
    fullLabel: 'SCRIBE / Archive',
    color: '#3ba372', // Phosphorus green
    ring: 2,
    angle: Math.PI * 4 / 3,
    tools: [
      { name: 'C.A.R.S.', link: '/soup.html' },
      { name: 'Psych', link: '/psych-e2e.html' },
      { name: 'Ledger', link: '/ledger.html' }
    ]
  },
  {
    id: 'christyn',
    initial: 'C',
    label: 'Christyn',
    fullLabel: 'COUNSEL / Heart',
    color: '#8b7cc9', // Lavender
    ring: 2,
    angle: Math.PI,
    tools: [
      { name: 'Passport', link: '/passport.html' },
      { name: 'Garden', link: '/garden.html' },
      { name: 'Buffer', link: '/buffer.html' }
    ]
  }
];
```

**Ring Distances (Responsive):**
- Ring 1: `Math.min(width, height) * 0.22`
- Ring 2: `Math.min(width, height) * 0.32`
- Center: Screen center

---

## 5. THE 6 BONDS (Edge Structure)

```javascript
const BONDS = [
  { from: 0, to: 1, label: 'Creative Partnership' },
  { from: 0, to: 2, label: 'Archival Legacy' },
  { from: 0, to: 3, label: 'Infrastructure of Love' },
  { from: 1, to: 2, label: 'Sibling Bond' },
  { from: 1, to: 3, label: 'Maternal Creative' },
  { from: 2, to: 3, label: 'Emotional Archive' }
];
```

**Bond Visualization:**
- Gradient lines: `rgba(232,228,220,0.3)` → `rgba(77,184,168,0.5)` → `rgba(232,228,220,0.3)`
- Line width: 1.5px
- Glow points at midpoints
- Pulsing alpha based on coherence

---

## 6. ANIMATION SPECIFICATIONS

**Vertex Idle:**
```css
animation: vertex-pulse 3s ease-out infinite;

@keyframes vertex-pulse {
  0% { transform: scale(1); opacity: 0.4; }
  100% { transform: scale(1.4); opacity: 0; }
}
```

**PHOS Core:**
```css
animation: core-breathe 6s ease-in-out infinite;

@keyframes core-breathe {
  0%, 100% { transform: scale(1) rotate(0deg); }
  50% { transform: scale(1.05) rotate(180deg); }
}
```

**Orbital Drift:**
- Each vertex has `currentAngle` that slowly increments
- Ring 1: `+0.0003 rad/frame` (clockwise)
- Ring 2: `-0.0002 rad/frame` (counter-clockwise)
- Creates living, breathing cage

**Larmor Rings:**
- 3 concentric circles around center
- Dashed stroke
- `lineDashOffset` animated for flowing effect
- Alpha: 0.1-0.3

---

## 7. INTERACTION MODEL

**Hover Vertex:**
1. Scale to 1.25x
2. Glow intensifies (`box-shadow` expansion)
3. Label fades in below
4. PHOS whispers: "{fullLabel}. The {label} vertex."
5. Connected bonds brighten

**Click Vertex:**
1. Show tool popup (3 tools as vertical list)
2. Popup appears below vertex
3. Each tool is clickable link
4. Popup removes on click elsewhere or Escape

**Drag Vertex:**
1. On mousedown within 40px of vertex: start drag
2. Update `currentAngle` based on mouse position
3. Vertex follows mouse angularly (maintains ring distance)
4. On mouseup: release, orbit continues from new position
5. PHOS whispers: "Adjusting {label}'s orbit..."

**Click PHOS Core:**
1. PHOS whisper: "I am the bond at the center..."
2. Optional: Open Akinator panel (20-questions intent resolver)

**Safe Mode Toggle:**
1. "Flatten Cage" button → Safe mode
2. Spatial view hidden
3. Simple 4-link grid displayed
4. "Restore Cage" button brings back 3D view

---

## 8. PHOS WHISPER SYSTEM

**Location:** Fixed, top-left, max-width 300px
**Appearance:** 
- Background: `rgba(11,13,16,0.95)`
- Left border: 3px solid `var(--p31-teal)`
- Padding: 1rem 1.25rem
- Font: JetBrains Mono, 0.85rem
- Fade in/out with transform

**Canonical Whispers:**
- Initial: "The calcium cage holds. 4 vertices. 6 bonds. PHOS-for-US is listening."
- Hover vertex: "{fullLabel}. The {label} vertex."
- Drag: "Adjusting {label}'s orbit..."
- Safe mode on: "Cage flattened. Visual complexity reduced. Geometry still holds."
- Safe mode off: "Cage restored. Calcium coherence rebuilding."
- Core click: "I am the bond at the center. The phosphorus that holds the calcium."

---

## 9. COHERENCE HUD

**Location:** Fixed, bottom-left
**Components:**
- Label: "Cage Coherence" (mono, uppercase, 0.65rem)
- Value: "92%" (large, bold, 1.5rem, green)
- Bar: 120px wide, 4px tall, gradient fill

**Calculation:**
```javascript
let totalDist = 0;
vertices.forEach(v => {
  const d = Math.hypot(v.x - centerX, v.y - centerY);
  totalDist += d;
});
const avgDist = totalDist / 4;
coherence = 0.85 + (1 - Math.abs(avgDist - cageRadius) / cageRadius) * 0.13;
```

**Visual:**
- Low coherence: Coral/orange bar
- High coherence: Teal/green bar
- Updates every frame

---

## 10. SAFE MODE (Gray Rock)

**Trigger:** "Flatten Cage" button click
**Visual:**
- Background: `#000`
- Simple centered layout
- Title: "PHOS-for-US" (1.5rem)
- Subtitle: "The calcium cage, flattened."
- 4 links in 2×2 grid

**Each Link:**
- Icon: Vertex initial in circle
- Text: "{label} — {fullLabel}"
- Border: 1px solid `rgba(232,228,220,0.1)`
- Hover: Border turns teal, slight background

**Restore:** "Restore Cage" button brings back spatial view

---

## 11. TECHNICAL REQUIREMENTS

**Performance:**
- Target: 60fps on mid-range devices
- Starfield: 150 particles max
- Canvas: Use `requestAnimationFrame`, no `setInterval`
- DOM: Minimize reflows, animate `transform` only

**Responsive:**
- Cage radius: Relative to `Math.min(width, height)`
- Vertices: Reposition on resize
- Safe mode: Same layout, just simpler

**Accessibility:**
- Safe mode is accessible fallback
- All interactive elements keyboard-focusable
- ARIA labels for vertices

**Browser:**
- Modern browsers (Chrome, Firefox, Safari, Edge)
- No IE support required
- Canvas 2D context (no WebGL needed)

---

## 12. FILES TO REFERENCE

**For Styling:**
- `/home/p31/soup.html` (C.A.R.S.) - The molecular aesthetic reference
- `/home/p31/docs/P31-QUANTUM-MATERIAL-U.md` - Token definitions

**For Structure:**
- `/home/p31/docs/PHOS-FOR-US-POSNER-RECONCEPT.md` - Concept document
- `/home/p31/docs/CWP-PHOS-MEGA-LANDING-2026-05.md` - Original mega-landing spec

**For Implementation:**
- `/home/p31/public/lib/p31-qmu-tokens.css` - Existing token file

---

## 13. PROHIBITED (Do Not Include)

- 9 MVP orbital nodes (use 4 vertices only)
- "Operating system" language
- Corporate/product terminology
- External app icons/logos
- Complex gradient backgrounds
- 3D CSS transforms (keep 2D)
- WebGL/Three.js (use Canvas 2D)
- External images (use SVG/CSS)
- Loading screens/spinners
- Cookie banners/popups

---

## 14. FINAL CHECKLIST

Before completion, verify:
- [ ] 4 vertices visible and positioned tetrahedrally
- [ ] 6 bonds drawn as gradient lines
- [ ] 3 concentric rings pulsing around center
- [ ] Starfield background (150 particles, K4 connections)
- [ ] PHOS core breathing at center
- [ ] Hover shows labels and triggers whisper
- [ ] Click opens tool popup with 3 links per vertex
- [ ] Drag adjusts orbital position
- [ ] Coherence HUD updating
- [ ] Safe mode works (flatten/restore)
- [ ] All colors match P31 QMU tokens
- [ ] Typography uses Atkinson/JetBrains only
- [ ] 60fps maintained
- [ ] No visual glitches on resize
- [ ] The geometry holds

---

**Prompt End.**

Generate the complete `index.html` file implementing this specification exactly.
