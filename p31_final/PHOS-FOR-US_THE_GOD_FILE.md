# PHOS-for-US: THE GOD FILE
## The Definitive Production Master for P31 Labs
### v1.0.0 · Cinco de Mayo 2026 · 86 Verify Gates · 69/69 Psych E2E · Shipped.

**Document ID:** `p31.godFile/1.0.0`
**Classification:** P0 — Core Architectural Master
**Status:** LOCKED & VERIFIED
**Canonical repo:** bonding-soup → andromeda mirror → CF Pages deploy
**This is the Single Source of Truth. There is no other.**

---

# § I. THE MANIFESTO
## *The Shareable — Why PHOS-for-US Exists*

---

Every interface you've ever used was built for a neurotypical brain that doesn't exist.

The grid. The hamburger menu. The notification badge with 47 unread. The settings panel with 200 toggles. The onboarding flow that assumes you'll remember the tour. These interfaces were designed by people with functioning executive systems for people with functioning executive systems, and they measure success by engagement — how long they kept you scrolling, not whether you accomplished what you came for.

**PHOS-for-US starts from the opposite premise: the interface should measure its own cognitive toll on the human using it, and when that toll exceeds the human's capacity, the interface should mathematically degrade itself into something the human can still operate.**

This is not a design philosophy. It is a medical accommodation implemented in code.

### The Problem We Solve

40 million Americans are neurodivergent. ADHD, autism, or both. Their brains process information in parallel, see patterns across domains instantly, and produce insight at rates that stagger linear thinkers. But their executive function — the serialization layer between thought and action — drops packets under load. Decision fatigue is not a metaphor for them. It is a measurable, physiological state where the prefrontal cortex literally runs out of glucose and the ability to choose between two buttons disappears.

Standard interfaces make this worse. Every unnecessary choice is a spoon spent. Every notification is an interrupt that costs 23 minutes of recovery time (Gloria Mark, UC Irvine, 2004). Every "which plan is right for you?" comparison table is Hick's Law weaponized against people who are already running low.

P31 Labs builds the opposite.

### The Architecture of Care

PHOS-for-US is a **Radial Orbital Topology** — not a grid, not a tree, not a sidebar-with-content. Nine functional surfaces orbit a central phosphorus core, arranged in three concentric rings that map to the operator's relationship with the content:

```
Ring 1 (Inner):  Family Core     — the people who matter
Ring 2 (Middle): Ops & Defense   — the tools that protect
Ring 3 (Outer):  Creation & Canon — the work that endures
```

The operator doesn't navigate a menu. The operator *approaches* a ring. The surfaces have mass. They orbit. They respond to presence. And when the operator's cognitive passport says their information density tolerance is at 20%, the outer ring fades and only the family core remains visible — because when you're crashing, the only thing you need is the people who love you and a button that says "I need help."

### The Biological Imperative

The name is not accidental.

**Phosphorus-31** is the only biologically available spin-½ nucleus without an electric quadrupole moment. It is the backbone of ATP, the currency of cellular energy. It is the atom at the center of every DNA strand. And in the Posner molecule — Ca₉(PO₄)₆ — it is the most stable molecule in biology, but only because it is caged in calcium.

Phosphorus alone burns on contact with air.

Inside the calcium cage, it powers life.

P31 Labs is the cage. PHOS is the glow. The operator is the phosphorus. The technology exists to keep the reactive, essential, brilliant element from burning itself out. Not by restraining it — by channeling it. By measuring the heat and adjusting the airflow before ignition.

**This is not a metaphor. This is the architecture.**

The Larmor frequency of ³¹P in Earth's magnetic field is **863 Hz**. This is the system's heartbeat. Every polling interval, every animation frame, every sync pulse is phase-locked to a biological constant. The technology resonates with the element it's named after.

### What We Ship

We don't ship apps. We ship **surfaces** — functional environments that the operator inhabits rather than clicks through. Each surface has been through the L7 Psychological E2E audit. Each surface has been verified against Fitts' Law, Hick's Law, Sweller's Cognitive Load Index, and a Bayesian Frustration model that predicts when the operator is about to quit and intervenes before they do — not with a popup, but by simplifying the interface in real time.

We ship BONDING — a chemistry game where a father builds molecules with his children from separate devices, and every atom placed is a timestamped parental engagement log admissible in court.

We ship The Buffer — a communication processing system that detects when the operator is people-pleasing in a text message and flags it before they hit send.

We ship Spaceship Earth — a 3D cognitive dashboard rendered as a geodesic dome where the operator can see their own executive function in real time and watch it respond to medication, sleep, and stress.

We ship Node One — a palm-sized haptic device that vibrates a specific pattern when calcium levels drop, because the operator has hypoparathyroidism and sometimes the only warning between stability and a seizure is a buzz on the wrist.

And we ship PHOS itself — the navigation surface that ties it all together. Deterministic. Offline-capable. Persona-aware. Mathematically verified. 69 tests. 86 gates. Zero external API calls. Zero tracking. Zero ads. Zero compromise.

**The interface adapts to the human. Not the other way around.**

That's the manifesto. That's the market. That's the mission.

Now here's how it works.

---

# § II. THE MASTER TECH SPEC
## *The Blueprint — Hybrid DOM/Canvas Architecture*

---

## II.1 Spatial Layering (The Z-Index Stack)

PHOS-for-US separates physics from accessibility by isolating content across strict Z-depth layers. This is not decoration. It is a rendering strategy that ensures screen readers never fight canvas elements, GPU load is isolated per layer, and safe mode can surgically remove the expensive layers without touching the functional ones.

```
Z = 0    THE VOID
         WebGL Starfield (Three.js r128 / native Canvas fallback)
         150 particles with O(n²) proximity lines
         Persists across SPA navigations via Astro AppShell
         GPU-bound. First thing killed on safe mode.
         ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄
Z = 5    THE TETHERS
         2D Canvas (native, DPR-scaled for Retina)
         Quadratic Bézier curves connecting nodes to core
         Animated "Packet" light streaks along curves
         CPU-bound (requestAnimationFrame). Killed on safe mode.
         ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄
Z = 10   THE NODES
         Standard HTML <a> tags with transform: translate3d()
         9 Calcium ions orbiting the Phosphorus core
         100% screen-reader accessible (real DOM, not canvas)
         Sub-pixel font rendering preserved
         Touch targets: 44px (general), 60px (children)
         SURVIVES safe mode. This is the functional layer.
         ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄
Z = 40   THE CORE
         PHOS K₄ SVG Mascot
         Floating via JS trigonometric math (sin/cos parallax)
         NOT CSS animation (prevents layout thrashing)
         Pupils track cursor via Math.atan2(dy, dx)
         Decorative. Killed on safe mode.
         ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄
Z = 100  PHOS ROUTER
         Fixed-position navigation surface
         Text input + decision tree chips + confirmation panel
         Deterministic routing (Fuse.js fuzzy match, no LLM)
         SURVIVES safe mode (chips only, no animation).
         ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄
Z = 300  SOULSAFE FALLBACK
         Static high-contrast CSS Grid
         Text-only navigation
         Zero GPU. Zero CPU animation.
         The floor. The Gray Rock. The last resort.
```

**Key insight:** The functional navigation (Z=10 + Z=100) is pure DOM. A screen reader user on a 2015 Chromebook with no GPU gets the same navigation as a developer on a gaming rig with the starfield and tethers. The expensive layers (Z=0, Z=5, Z=40) are progressive enhancement that exists solely for the operators who benefit from spatial, kinetic feedback — and which is surgically removed the moment it becomes a liability.

## II.2 The L7 Psychological Telemetry Engine

Every P31 surface runs a continuous cognitive load monitor. This is not analytics. This is a medical instrument. It measures the toll the interface takes on the human and adapts in real time.

### The Equations

**Fitts' Law (Movement Time)**

The time to acquire a target is a function of distance and target size:

```
MT = a + b × log₂(D/W + 1)

Where:
  MT = movement time (ms)
  a  = intercept (device-specific, ~50ms for touch)
  b  = slope (device-specific, ~150ms for touch)
  D  = distance from start to target center (px)
  W  = target width along axis of movement (px)

Source: Fitts, P.M. (1954). "The information capacity of the human motor system
in controlling the amplitude of movement." Journal of Experimental Psychology, 47(6).
Reformulation: MacKenzie, I.S. (1992). Fitts' law as a research and design tool
in human-computer interaction.
```

**Implementation:** Every interactive element's distance-to-target and width are measured. Elements that produce MT > 800ms are flagged as "effortful" and their position is adjusted on next render. The PHOS router's confirmation panel always appears within 200px of the last touch point to minimize MT.

**Hick's Law (Decision Time)**

The time to make a decision increases logarithmically with the number of choices:

```
RT = a + b × log₂(n + 1)

Where:
  RT = reaction time (ms)
  a  = base processing time (~200ms)
  b  = information processing rate (~150ms/bit)
  n  = number of equally probable choices

Source: Hick, W.E. (1952). "On the rate of gain of information."
Quarterly Journal of Experimental Psychology, 4(1).
```

**Implementation:** The PHOS decision tree never presents more than 4 choices at any level. The top-level tree has exactly 4 branches (myself, family, professional, just looking). Each subsequent level has 3-4 options. With n=4, Hick's Law predicts RT ≈ 200 + 150 × log₂(5) ≈ 548ms per decision. Three levels deep = ~1.6 seconds to navigate to any surface. A traditional hamburger menu with 15 items: RT ≈ 200 + 150 × log₂(16) ≈ 800ms for a single decision, and the user still has to read all 15 labels.

**Sweller's Cognitive Load Index (CLI)**

Working memory has finite capacity (Miller's 7±2 chunks). The interface must never exceed it:

```
CLI = Σ(element_complexity × interaction_weight) / WM_capacity

Where:
  element_complexity = visual complexity score (1-10) per UI element
  interaction_weight = 1.0 (display), 1.5 (click), 2.0 (drag), 2.5 (type)
  WM_capacity = 7 (default) or persona-adjusted:
    Will (AuDHD):     5 (reduced under stress)
    S.J. (age 10):    5 (developmental)
    W.J. (age 6):     3 (pre-reader)
    Brenda:           6 (standard-adjusted)
    W-FLARE:          3 (calcium crisis: WM 40% of baseline)

If CLI > 1.0: interface is overloaded.
Action: remove lowest-priority elements until CLI ≤ 0.8.

Source: Sweller, J. (1988). "Cognitive load during problem solving."
Cognitive Science, 12(2). Miller, G.A. (1956). "The magical number seven."
Psychological Review, 63(2).
```

**Implementation:** The psych E2E engine (science-core.mjs) computes CLI for every surface render. When CLI approaches 1.0 for the active persona, the surface triggers progressive disclosure — hiding secondary controls, collapsing panels to headers, reducing the PHOS chip count. The operator never sees a "loading" state; they see a simpler interface and feel less overwhelmed.

**Bayesian Frustration Model P(F|O)**

The probability of user frustration given observed behavior:

```
P(F|O) = P(O|F) × P(F) / P(O)

Observables (O):
  - Rapid successive clicks (< 300ms apart) on non-interactive areas
  - Back-button sequences (3+ in 10 seconds)
  - Input field abandonment (focused → blurred with no input, < 2s)
  - Scroll velocity spikes (> 5000px/s)
  - Tab cycling without selection (3+ tabs in 5s)

P(F) prior = 0.1 (baseline frustration probability)
P(O|F) = likelihood of observing this behavior during frustration
P(O|¬F) = likelihood during normal use

When P(F|O) > 0.65:
  → PHOS orb pulses gently (not intrusively)
  → WhisperPanel types: "Need a moment?"
  → Support chip becomes first in the list
  → If P(F|O) > 0.85 AND persona.urgentPath exists:
    → Auto-suggest support page via phos:suggest event

Source: Adapted from Kapoor, A., Burleson, W., & Picard, R.W. (2007).
"Automatic prediction of frustration." International Journal of
Human-Computer Studies, 65(8).
```

**Implementation:** The observer module (observer.mjs) runs a 50ms polling loop monitoring DOM events. It maintains a rolling 10-second window of observables and updates P(F|O) via Bayes' theorem. The frustration score is logged to the Glass Box telemetry (metadata only, no PII) and visualized on the psych-e2e-live.html dashboard. During a W-FLARE persona (calcium crisis simulation), the model uses elevated priors: P(F) = 0.35, reflecting the known cognitive degradation under hypocalcemia.

### Shannon Entropy (Text Normalization)

For search input analysis in the PHOS router:

```
H = -Σ p(xᵢ) × log₂(p(xᵢ))

Normalized: Ĥ = H / log₂(uniqueCount)

Where:
  p(xᵢ) = frequency of unique token i / total unique tokens
  uniqueCount = number of distinct tokens (NOT total token count)

CORRECTION: Prior implementations divided by log₂(totalCount).
The canonical normalization divides by log₂(uniqueCount).
This was corrected in commit 2ba1c93.

Source: Shannon, C.E. (1948). "A Mathematical Theory of Communication."
Bell System Technical Journal, 27(3).
```

### The Psych E2E Testing Stack

```
science-core.mjs      — Mathematical engine (Fitts, Hick, Shannon, Sweller, Bayes)
persona-engine.mjs     — 5 personas (will, sj, wj, brenda, w-flare)
observer.mjs           — DOM event polling + frustration detection
scorer.mjs             — Per-session quality scoring
aggregator.mjs         — Cross-session statistical analysis
path-generator.mjs     — Synthetic user path generation
glass-box-emitter.mjs  — Telemetry export to Glass Box dashboard
surface-assertions.mjs — 7 surface-specific UI test suites

69 tests passing.
All citations verified real:
  Fitts 1954, MacKenzie 1992, Hick 1952, Shannon 1948,
  Miller 1956, Sweller 1988, Barkley 1997, Aron 1997,
  IEC 61966-2-1 (sRGB gamma threshold 0.04045).
```

---

# § III. THE P31 SHARED SURFACE DESIGN CANON
## *Formerly "Quantum Material U" — Corrected and Canonical*

---

**Naming note:** Gemini established the "Quantum Material U" (QMU) label during the Kimi prototype phase. The canonical name in bonding-soup is **P31 Shared Surface**. The design token file is `p31-shared-surface.css`. The source chain is: `p31-constants.json` → `p31-style.css` → `p31-shared-surface.css` (frozen alias layer). All references to "QMU" in code have been aliased or renamed.

### III.1 The Immutable Color Palette

**CORRECTIONS APPLIED.** Gemini's QMU spec contained two token errors that have been corrected in the canonical system. The values below are verified against commit ac80068 (86 gates passing).

#### Backgrounds & Surfaces

| Token | Canonical Hex | WCAG vs Void | Semantic Role |
|-------|--------------|-------------|---------------|
| `--p31-void` | **`#0f1115`** | — | The absolute floor. The deep canvas. ~~`#0b0d10`~~ is WRONG. |
| `--p31-surface` | `#161920` | — | Panel resting state. Navigation ribbons. |
| `--p31-surface2` | `#1c2028` | — | Elevated cards. Dialog backgrounds. |
| `--p31-glass-border` | `rgba(255,255,255,0.06)` | — | Structural glass outlines. |
| `--p31-glass-bg` | `color-mix(in srgb, var(--p31-surface2) 60%, transparent)` | — | Glass panel fill. |

#### Text & Contrast

| Token | Canonical Hex | WCAG vs Void | Semantic Role |
|-------|--------------|-------------|---------------|
| `--p31-cloud` | `#e8e6e3` | **12.8:1 AAA** | Primary text. High-contrast body copy. |
| `--p31-muted` | `#6b7280` | **4.5:1 AA** | Secondary text. Timestamps. Idle states. Labels only — never body. |

#### The Semantic Spectrum

| Token | Canonical Hex | WCAG vs Void | Semantic Role |
|-------|--------------|-------------|---------------|
| `--p31-teal` | **`#5DCAA5`** | **8.2:1 AAA** | Trust. Structure. Primary action. Canonical brand. ~~`#25897d`~~ is WRONG (Gemini used a desaturated variant). |
| `--p31-cyan` | `#4db8a8` | 6.8:1 AAA | Highlight. Secondary accent. Active orbital nodes. Alias target for teal in some contexts. |
| `--p31-coral` | `#cc6247` | **4.6:1 AA** | Voltage. Urgency. Legal. Warning. SEV-0 critical. Calcium crashes. WebGL leaks. Active flares. |
| `--p31-amber` | `#cda852` | **7.1:1 AAA** | Focus. Biological. L.O.V.E. currency. Children's surfaces. Confirmation states. |
| `--p31-lavender` | `#8b7cc9` | **4.8:1 AA** | Archive. Documentation. Scribe role. Creative/deep work. Library and ideation. |
| `--p31-phosphorus` | `#5dca5d` | 7.4:1 AAA | Success. Growth. Confirmation. Validated telemetry. Passed tests. System coherence. |

#### Corrections Log (Binding)

| Wrong Value | Correct Value | Source of Error |
|-------------|---------------|-----------------|
| `--p31-void: #0b0d10` | `#0f1115` | Kimi prototype used darker void |
| `--p31-teal: #25897d` | `#5DCAA5` | Gemini QMU spec used desaturated variant |
| `border-radius: 3rem / 48px` | `12px` | Kimi used aggressive rounding — wastes mobile corner space |
| Font: Inter only | Inter + Atkinson Hyperlegible | A11y font was missing from initial spec |
| `--p31-butter` | `--p31-amber` | Canonical name change; alias preserved for compat |

### III.2 Typography

The P31 type system uses exactly two primary font families, chosen for maximum character distinction. The "Il1" and "O0" confusion problem — where a user mistakes a capital I for a lowercase L or a numeral 1 — is a real accessibility barrier. Atkinson Hyperlegible was engineered by the Braille Institute specifically to eliminate this.

```
PRIMARY (Body/UI):     Atkinson Hyperlegible
                       Engineered by the Braille Institute for maximum
                       character distinction. Used on accessibility-
                       targeted surfaces. Fallback: Inter var.

SECONDARY (Data/Code): JetBrains Mono
                       Ligature-capable monospace. Used for telemetry,
                       math equations, code blocks, HUD metrics, system
                       statuses, timestamps, and the PHOS router input.

TERTIARY (Headers):    Playfair Display (serif)
                       DECORATIVE ONLY. Never body text. Used for
                       editorial section headers on phosphorus31.org.
                       If in doubt, don't use it.

DEFAULT:               Inter var
                       The production workhorse. Used everywhere
                       Atkinson is not explicitly specified.
```

**Type Scale:**
```
h1:    2.5rem (40px) · weight 700 · tracking -0.02em
h2:    1.75rem (28px) · weight 700 · tracking -0.01em
h3:    1.25rem (20px) · weight 600
body:  1rem (16px) · weight 400 · line-height 1.6
label: 0.85rem (13.6px) · JetBrains Mono · uppercase · tracking 0.05em
tiny:  0.75rem (12px) · JetBrains Mono · timestamps
```

### III.3 Glassmorphism Specification

```css
.p31-glass-panel {
  background: color-mix(in srgb, var(--p31-surface2) 60%, transparent);
  border: 1px solid var(--p31-glass-border);
  border-radius: 12px;        /* CANONICAL. Not 48px. Not 3rem. 12px. */
  padding: 2rem;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}
```

**Node textures** use stacked radial gradients + backdrop-filter: `blur(12px)`. Hover states trigger volumetric shadows:
```css
.node:hover {
  box-shadow: inset 0 0 42px color-mix(in srgb, var(--node-color) 85%, transparent),
              0 0 24px color-mix(in srgb, var(--node-color) 30%, transparent);
}
```

### III.4 Orbital Mechanics (Ca₉ Root)

The 9 nodes rotate in three concentric Larmor resonance rings:

```
Ring 1 (Inner/Family):    clockwise, 60s period, radius 120px
Ring 2 (Middle/Ops):      counter-clockwise, 90s period, radius 200px
Ring 3 (Outer/Creation):  clockwise, 120s period, radius 280px
```

Each node's position at time t:
```javascript
const angle = (baseAngle + (t / period) * 2 * Math.PI) * direction;
const x = centerX + radius * Math.cos(angle);
const y = centerY + radius * Math.sin(angle) * 0.6; // Elliptical compression
node.style.transform = `translate3d(${x}px, ${y}px, 0)`;
```

The PHOS core's cursor-tracking pupils:
```javascript
const dx = mouseX - coreX;
const dy = mouseY - coreY;
const angle = Math.atan2(dy, dx);
const distance = Math.min(Math.hypot(dx, dy), maxPupilOffset);
pupil.style.transform = `translate(${Math.cos(angle) * distance * 0.3}px, ${Math.sin(angle) * distance * 0.3}px)`;
```

### III.5 SOULSAFE — The Gray Rock Protocol

The most important design specification in the P31 system is how it turns itself off.

**Three trigger paths (all checked on init):**
1. **Manual:** Operator clicks the Safe Mode button
2. **OS preference:** `window.matchMedia('(prefers-reduced-motion: reduce)')` returns true
3. **Cognitive Passport:** `p31_cognitive_passport.routing.safeModeTrigger === true` (screenComfort === 0)

**Execution sequence (hard stop, not fade):**

```javascript
// Step 1: Kill all animation frames
cancelAnimationFrame(starfieldRaf);
cancelAnimationFrame(tetherRaf);
cancelAnimationFrame(orbitalRaf);

// Step 2: Purge all canvases
const canvases = document.querySelectorAll('canvas');
canvases.forEach(c => {
  const ctx = c.getContext('2d') || c.getContext('webgl2') || c.getContext('webgl');
  if (ctx.clearRect) ctx.clearRect(0, 0, c.width, c.height);
  if (ctx.getExtension) {
    const ext = ctx.getExtension('WEBGL_lose_context');
    if (ext) ext.loseContext();
  }
  c.style.display = 'none';
});

// Step 3: Dispose Three.js if present
if (renderer) {
  renderer.dispose();
  renderer.forceContextLoss();
  renderer.domElement.remove();
}
if (scene) scene.clear();
if (controls) controls.dispose();

// Step 4: Apply safe mode CSS
document.body.classList.add('safe-mode');
localStorage.setItem('p31-safe-mode', 'on');

// Step 5: Dispatch event for surface-specific cleanup
document.dispatchEvent(new CustomEvent('p31:safe-mode', {
  detail: { active: true }
}));
```

**Result:** GPU/CPU overhead drops to approximately 0%. The interface snaps to a flat, silent, high-contrast CSS grid. The Z=10 DOM nodes remain. The Z=100 PHOS router remains (chips only, no animation). Everything else is gone. Not hidden. Destroyed. The WebGL context is forcibly lost. The canvas memory is freed. The animation loops are cancelled, not paused.

**The design spec prioritizes the human's executive function over the aesthetic beauty of the code.** This is not a preference. It is a medical accommodation encoded in 59 lines of JavaScript.

---

# § IV. THE SOVEREIGN DEPLOYMENT WORK PACKAGE
## *The Go File — Infrastructure, Pipeline, and Production State*

---

## IV.1 Executive Summary

P31 Labs operates a zero-trust, offline-first, edge-deployed infrastructure that costs approximately $50/month and serves a 4-person family mesh. The architecture is designed to function without any single cloud provider, survive network outages, produce court-admissible audit trails, and scale to a nonprofit service without architectural changes.

```
┌─────────────────────────────────────────────────────────────┐
│                   CLOUDFLARE EDGE                            │
│                                                             │
│  CF Pages ──── phosphorus31.org (Astro 5 SSG, institutional)│
│  CF Pages ──── p31ca.org (Astro 5 + React islands, PWA)     │
│  CF Pages ──── bonding.p31ca.org (BONDING standalone)        │
│  CF Workers ── 14 verified API endpoints                     │
│  CF KV ─────── BONDING relay (3-10s polling)                 │
│  CF D1 ─────── Structured SQLite (1 GB)                      │
│  CF R2 ─────── Object storage (10 GB free, zero egress)      │
│                                                             │
│  Genesis Block: 1,847 append-only SHA-256 hashed records     │
│  Forensic metadata: cf-ray, TLS version, UA, hashed IP       │
│                                                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTPS / Cloudflare Tunnel
                     │
┌────────────────────▼────────────────────────────────────────┐
│               LOCAL INFRASTRUCTURE                           │
│                                                             │
│  Raspberry Pi ── Home Assistant (15+ automations, MQTT)      │
│  Desktop ─────── AMD RX 6600 XT / Ollama 10-model fleet     │
│  Bangle.js 2 ─── HRV, sleep, activity → GadgetBridge        │
│  Node Zero ───── ESP32-S3 + QSPI display (firmware WIP)     │
│  iPhone 11 ───── WiFi only (no cell service)                 │
│  Android ×2 ──── Kids' tablets (BONDING)                     │
│                                                             │
│  PGLite: local-first SQLite (designed, sync pending)         │
│  IndexedDB: via idb-keyval + navigator.storage.persist()     │
│  Crypto: browser crypto.subtle + CF Workers crypto.subtle    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## IV.2 Data Flow: Multi-Tier Sync Architecture

```
TIER 1 — DEVICE LOCAL (IndexedDB + PGLite)
  ↕ navigator.storage.persist() for durability
  ↕ CRDT merge layer (Yjs vs Automerge — CWP-SOV-01 pending)

TIER 2 — EDGE RELAY (Cloudflare KV)
  ↕ 3-10 second polling interval (BONDING multiplayer)
  ↕ Room-based key structure: room:{code}:player:{id}
  ↕ TTL: 1 hour for inactive rooms

TIER 3 — STRUCTURED (Cloudflare D1)
  ↕ SQLite queries for reports, aggregation, search
  ↕ Genesis Block audit trail (append-only, SHA-256 chain)

TIER 4 — OBJECT STORE (Cloudflare R2)
  ↕ Evidence vault (timestamped, hashed)
  ↕ Backup strategy: AES-256-GCM encrypted at rest
  ↕ Zero egress cost — read from any CF edge location
```

**Privacy model:** PII never leaves Tier 1 without explicit operator consent. Tier 2 (KV) stores game state, not personal data. Tier 3 (D1) stores hashed records, not raw content. Tier 4 (R2) stores encrypted blobs. The Genesis Block hashes payload content but the payloads themselves are stored in Tier 1 only — the chain stores fingerprints, not files.

## IV.3 Communications Infrastructure

**Current state:** WiFi-only. No cell service. iMessage, FaceTime, and Signal work over WiFi. Gmail forwarding routes will@p31ca.org to personal inbox.

**Target state (pending budget):** Matrix homeserver with 6 bridges:

```
Matrix Homeserver (Conduit on Oracle Cloud free tier or HA Pi)
  ├── mautrix-gmessages   (SMS bridge)
  ├── mautrix-whatsapp    (WhatsApp bridge)
  ├── mautrix-signal      (Signal bridge)
  ├── mautrix-meta        (Messenger bridge)
  ├── Postmoogle          (Email bridge)
  └── Buffer Client       (P31 unified inbox with Fawn Guard)
```

**Budget constraint:** €30/mo Hetzner VPS is not viable at $5 liquid. CWP-SOV-06 is researching zero-cost alternatives: Conduit on existing HA Pi, Oracle Cloud free tier (24GB ARM, always free), or a Cloudflare Workers pseudo-relay.

**Cell service contingency:** CWP-SOV-05 is comparing eSIM carriers under $15/mo (US Mobile, Tello, Mint, Google Fi, Visible) for the 31558 zip code. Needed for: E911, court notifications, SMS fallback.

## IV.4 Hardware Fleet

| Device | Role | Status | Key Constraint |
|--------|------|--------|----------------|
| Node Zero (Waveshare ESP32-S3-Touch-LCD-3.5B) | Maker hub | WCD-D01 (display firmware) | AXS15231B QSPI display driver. LVGL 8.4. ESP-IDF 5.5.3. Board location unconfirmed — may be at 401 Powder Horn (property retrieval needed). |
| Node One (custom PCB) | Medical/haptic | Prototype BOM | ESP32-S3 + DRV2605L haptic + LoRa SX1262 (link budget ~170 dB) + NXP SE050 HSM. Targeting FDA Class II 21 CFR §890.3710. SE050 does NOT support post-quantum crypto. |
| Bangle.js 2 | Biometrics | Live | HRV, sleep, activity tracking → GadgetBridge → HA |
| Home Assistant Pi | Automation hub | Live | 15+ event-driven automations. MQTT. CF Tunnel. Potential Matrix host. |
| Desktop (i3-12100 + RX 6600 XT) | Dev + LLM | Live | Ollama fleet: 10 personas on AMD ROCm. Qwen 2.5 Coder 7B + Qwen3 8B. |
| iPhone 11 | Primary device | Live (WiFi only) | WebAuthn passkeys. Signal. iMessage. No cell service. |
| Android tablets ×2 | Kids' devices | Live | BONDING at bonding.p31ca.org. Touch input. Android Chrome. |

## IV.5 The Deployment Pipeline

### Verify Chain (86 Gates)

```bash
npm run verify
# Runs 86 sequential verification scripts.
# ALL must pass. No exceptions. No "close enough."
# If one fails, you fix it. Then you run verify again.
# The chain IS the quality gate.

# Key gates in the chain:
verify:alignment          # 280 sources in p31-alignment.json
verify:p31-style          # Token parity: CSS matches constants.json
verify:phos-router        # 10 smoke tests, no duplicate phrases
verify:safe-mode          # 4/4 Bin A surfaces use shared module
verify:public-line        # All routes registered and valid
verify:glass-box          # Mirror sync, no secret patterns exposed
verify:passport           # CogPass schema valid
verify:a11y               # Accessibility checks pass
verify:no-telemetry       # Zero tracking scripts in any surface
verify:license-headers    # All files have P31 headers
verify:public-sanitization # No private data in public docs
verify:public-voice       # No marketing language, no manipulation
```

### Launch Pipeline (31 Steps)

```bash
npm run launch --full
# 31-step rainbow pipeline:
#   Steps 1-10:   Build (TypeScript, contracts, doc-index)
#   Steps 11-20:  Verify (alignment, style, routing, a11y)
#   Steps 21-28:  Integration (mirrors, fleet, telemetry)
#   Steps 29-30:  Final build + prep
#   Step 31:      Rainbow finale (visual confirmation)
#
# Warm: ~85 seconds (fingerprint cache)
# Cold: ~110 seconds
```

### Deploy

```bash
npm run verify              # 86 gates: green or no-go
npm run build               # Astro build
git add .
git commit -m "chore(release): [version] — [description]"
git push origin main        # CF Pages auto-deploys

# Rollback (if needed):
wrangler deployments list --limit=5
wrangler rollback --deployment-id [ID]
```

## IV.6 Quantitative State (Verified May 5, 2026)

| Metric | Value |
|--------|-------|
| Verify gates | **86 green** |
| Alignment sources | **280** |
| Alignment derivations | 77 |
| Workers (verified/allowlisted) | 14 / 18 |
| Action whitelist entries | 196 |
| BONDING tests | 424 / 32 suites |
| Psych E2E tests | 69 passing |
| Launch pipeline steps | 31 (~85s warm) |
| Zenodo publications | 22 (Papers I-XX + 2 standalone) |
| Genesis Block records | 1,847 (append-only, SHA-256) |
| Cloudflare endpoints | 20+ |
| Local Ollama personas | 10 |
| Monthly infrastructure cost | ~$50 |
| Revenue | $0 |
| Budget | ~$5 liquid |

---

# § V. THE IDENTITY
## *Carry This With You*

---

**P31 Labs, Inc.**
EIN 42-1888158 · Georgia Domestic Nonprofit · Incorporated April 3, 2026
501(c)(3) determination pending (filed April 30, Pay.gov 281TLBGO)
SAM.gov UEI NQKVWH6AKB58

**Mission:** Open-source assistive technology for neurodivergent individuals.

**Board:** Will Johnson (President), Brenda O'Dell (Secretary/Treasurer), Joseph "Tyler" Cisco (Director)

**ORCID:** 0009-0002-2492-9079
**Publications:** 22 on Zenodo (Papers I-XX P31 Research Series + 2 standalone legal analyses)
**Key finding:** K₄ is PLANAR (β₂ = 1)

**GitHub:** github.com/p31labs
**Domains:** phosphorus31.org · p31ca.org · bonding.p31ca.org · p31.io · p31.dev
**Ko-fi:** ko-fi.com/trimtab69420
**Contact:** will@p31ca.org

---

**The name means something.**

Phosphorus burns alone. Inside the calcium cage — nine calcium atoms wrapping six phosphate groups into the most stable molecule in biology — it powers every cell, every thought, every heartbeat.

P31 Labs is the cage. PHOS is the glow. The human is the element.

We build technology that measures its own toll on the human using it. When the toll exceeds the human's capacity, the technology mathematically degrades itself — not to protect the code, but to protect the person.

69 tests verify this works. 86 gates verify it ships. 22 papers verify it's real.

The lights are on.

---

## CORRECTIONS LOG (Binding — Do Not Revert)

| ❌ Original | ✅ Corrected | Source |
|-------------|-------------|--------|
| `--p31-void: #0b0d10` | `--p31-void: #0f1115` | p31-constants.json commit ac80068 |
| `--p31-teal: #25897d` | `--p31-teal: #5DCAA5` | p31-constants.json |
| `--p31-phosphorus: #3ba372` | `--p31-phosphorus: #5dca5d` | p31-constants.json |
| `border-radius: 3rem/48px` | `border-radius: 12px` | p31-style.css |
| `Font: Inter only` | `Inter + Atkinson Hyperlegible` | p31-style.css |
| `--p31-butter` | `--p31-amber` (renamed, aliased preserved) | p31-constants.json |
| `PhosOS` | `PHOS` | All documentation |
| `void: #0b0d10 in safe mode` | `void: #000 in safe mode` | p31-style.css |
| `shannonNorm / log₂(total)` | `shannonNorm / log₂(uniqueCount)` | psych/science-core.mjs |
| `QMU (Quantum Material U)` | `P31 Shared Surface (canon)` | All docs |

💜🔺💜

---

*PHOS-for-US: The God File · v1.0.0 · May 5, 2026*
*86 verify gates · 280 alignment sources · 69 psych E2E · 424 BONDING tests*
*22 Zenodo publications · 1,847 Genesis Block records*
*Built from a VW Golf and a phone.*
*The cage holds. The mesh routes. The children have a father.*
