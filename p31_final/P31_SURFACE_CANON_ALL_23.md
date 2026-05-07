# P31 SURFACE CANON — ALL 23 PUBLIC FACES
## One God Doc Per Deployed Surface

**Document ID:** `p31.surfaceCanon/1.0.0`
**Date:** May 5, 2026
**Surfaces:** 23 (21 on p31ca.org + 1 subdomain + 1 separate domain)
**Source:** public-line.json (31 entries, 23 public-facing)
**Verify:** `npm run verify:public-line` (must pass before any surface ships)

---

## HOW TO READ THIS DOCUMENT

Each surface gets a standardized spec block:

```
SURFACE: [name]
ROUTE:   [URL path]
GATE:    [live | alpha | stub]
RING:    [inner | middle | outer] (Ca₉ orbital position)
PHOS:    [intent ID in phos-intent-catalog.json]
PERSONAS: [who sees this surface]
PURPOSE: [one sentence]
ARCHITECTURE: [framework, key libraries, data sources]
STATES:  [empty | loading | error | normal — if interactive]
KEY TOKENS: [which design tokens are prominent]
A11Y:    [accessibility requirements specific to this surface]
VERIFY:  [which verify gates cover this surface]
REBUILD: [what an agent needs to rebuild from scratch]
```

---

## SURFACE 01: Ca₉ ORBITAL ROOT

```
ROUTE:    /
GATE:     live
RING:     — (IS the core)
PHOS:     welcome
PERSONAS: all (will, sj, wj, brenda, public)
```

**Purpose:** The gravity well. 9 calcium nodes orbit the phosphorus core in 3 concentric rings. This IS the P31 navigation paradigm — not a landing page, but a spatial environment.

**Architecture:**
- Astro page (index.astro) with hybrid DOM/Canvas rendering
- Z=0: WebGL/Canvas starfield (150 particles, O(n²) proximity lines)
- Z=5: Native 2D canvas with DPR scaling — Bézier tethers + Packet light-streaks
- Z=10: 9 HTML `<a>` tags with `transform: translate3d()` — the functional layer
- Z=40: K₄ PHOS SVG mascot — JS parallax (sin/cos), cursor tracking (Math.atan2)
- Z=100: PHOS Router (fixed position, appears on orb click)
- Z=300: SOULSAFE fallback grid (CSS Grid, static, high-contrast)

**Orbital mechanics:**
```
Ring 1 (inner/family):  clockwise, period 60s, radius 120px
Ring 2 (middle/ops):    counter-clockwise, period 90s, radius 200px
Ring 3 (outer/creation): clockwise, period 120s, radius 280px
Elliptical compression: y *= 0.6
Node position: x = cx + r*cos(θ), y = cy + r*sin(θ)*0.6
```

**States:** N/A (always renders — orbitals or safe mode grid)

**Key tokens:** --p31-void (background), --p31-teal (core glow, Ring 2), --p31-amber (Ring 1), --p31-lavender (Ring 3)

**A11Y:** All 9 nodes are real `<a>` tags (screen-reader accessible). Skip link present. Safe mode auto-engages on `prefers-reduced-motion`. Safe mode grid has 44px minimum tap targets.

**Verify:** verify:public-line, verify:phos-router, verify:safe-mode, verify:a11y

**Rebuild:** Read §II of the God File (Z-stack spec) + PHOS Specification §7 (visual identity). The root page is the most complex surface — rebuild last, not first.

---

## SURFACE 02: COGNITIVE PASSPORT

```
ROUTE:    /passport
GATE:     live (Gate 2 complete)
RING:     inner (family core)
PHOS:     passport
PERSONAS: will, brenda, public
```

**Purpose:** Generate and store a local identity context card (CogPass v4.1) that controls how every other surface adapts to the operator's cognitive state.

**Architecture:**
- Standalone HTML (passport.html) — pending Astro migration
- React-free — vanilla JS with state management
- Storage: localStorage key `p31_cognitive_passport`
- Schema: `p31.cognitivePassport/1.1.0`
- Output: JSON with preferences.informationDensity (0-100) and routing.safeModeTrigger

**States:**
1. **Empty:** "No passport created yet" + primary CTA button
2. **Loading:** Skeleton shimmer matching card shape (disabled in safe mode)
3. **Error:** Storage unavailable (private browsing) + "Continue without saving" button
4. **Normal:** Density slider (0=Gray Rock, 100=High Ops) + JSON preview + Save + Copy

**Key tokens:** --p31-teal (slider accent, save confirmation), --p31-coral (error state border), --p31-void (JSON preview background)

**A11Y:** Slider has aria-valuemin/max/now + aria-label. Save notice uses aria-live="polite". OG meta tags present. Skip link. 44px minimum on all buttons and slider.

**Verify:** verify:passport, verify:cognitive-passport-schema, verify:safe-mode

**Rebuild:** Read Design Forge → "Interactive Tool Page" template. Replace [STORAGE_KEY] with `p31_cognitive_passport`. The slider controls information density; the output is a JSON schema consumed by every other surface's persona engine.

---

## SURFACE 03: GEODESIC BUILDER

```
ROUTE:    /dome#geodesic
GATE:     live
RING:     middle (ops/defense)
PHOS:     geodesic
PERSONAS: will, sj, public
```

**Purpose:** Three.js interactive geodesic dome builder. Add tetrahedra, watch rigidity emerge. The geometric proof of K₄ — 4 vertices, 6 edges, isostatic.

**Architecture:**
- Standalone HTML (geodesic.html) — pending Astro migration
- Three.js r128 (CDN: cdnjs.cloudflare.com) — NOT r142+ (no CapsuleGeometry)
- Scene: camera, renderer, OrbitControls
- Tetrahedron primitives added via "Add Tetrahedron" button
- Rigidity badge: shows "RIGID (Isostatic)" in --p31-phosphorus when structure is stable

**States:** N/A (always renders — Three.js scene or safe mode static)

**Safe mode:** Full WebGL teardown via `p31:safe-mode` event:
```javascript
document.addEventListener('p31:safe-mode', (e) => {
  if (e.detail.active) {
    cancelAnimationFrame(animationId);
    renderer.dispose(); renderer.forceContextLoss();
    renderer.domElement.remove();
    scene.clear(); controls.dispose();
  }
});
```

**Key tokens:** --p31-teal (wireframe), --p31-phosphorus (rigidity badge), --p31-lavender (accent)

**A11Y:** "Add Tetrahedron" button has 44px target. Safe mode button present. `prefers-reduced-motion` auto-triggers safe mode.

**Verify:** verify:geodesic-wire-fixtures, verify:safe-mode

**Rebuild:** Import Three.js r128. Create scene with PerspectiveCamera + WebGLRenderer + OrbitControls. Add tetrahedron geometry on button click. Check isostatic condition (edges ≥ 2n-3 for 2D, ≥ 3n-6 for 3D). Display rigidity badge accordingly.

---

## SURFACE 04: GLASS BOX

```
ROUTE:    /dome#glass
GATE:     live
RING:     middle (transparency)
PHOS:     glass-box
PERSONAS: will, public
```

**Purpose:** Transparency dashboard. Shows exactly what the system measures. Verify pulse, promoted reports, design health metrics. No hidden data. Build in the light.

**Architecture:**
- Standalone HTML (glass-box.html) with JS
- Fetches: docs/glass-box-pulse.json, docs/reports-promoted.json, docs/design-health.json
- Auto-refreshes every 90 seconds
- Mirror: p31ca/public/glass-box.html (kept in sync via build:glass-box)

**Panels:**
1. Verify Pulse — last verify run timestamp + pass/fail status
2. Promoted Reports — curated report links
3. Design Health — safe mode compliance (4/4), PHOS router coverage (4/4), token compliance (0 violations), touch targets (4/4)

**Key tokens:** --p31-teal (pass), --p31-coral (fail), --p31-amber (warning)

**A11Y:** All panels labeled. Status dots have semantic meaning + text labels (not color-only).

**Verify:** verify:glass-box (checks mirror sync + no secret patterns)

**Rebuild:** Fetch the 3 JSON files. Render panels. Wire auto-refresh. Run build:glass-box to sync mirror.

---

## SURFACE 05: COMMAND CENTER (OPS)

```
ROUTE:    /god
GATE:     live
RING:     middle (ops/defense)
PHOS:     command-center
PERSONAS: will
```

**Purpose:** Operator's central command. Fleet status, shift management, system health at a glance. Operator-only surface — not visible to public persona.

**Architecture:**
- Single HTML page with multiple panels
- Fetches shift state from api.p31ca.org/shift
- Displays: worker fleet status, shift in/out controls, system metrics

**Key tokens:** --p31-teal (operational), --p31-coral (alerts), --p31-amber (warnings)

**A11Y:** Operator-only, but still meets 44px targets and focus-visible. Keyboard navigable.

**Verify:** verify:command-center

---

## SURFACE 06: VIBE MODE

```
ROUTE:    /god (alternate mode)
GATE:     live
RING:     outer (creation)
PHOS:     vibe
PERSONAS: will
```

**Purpose:** Creative/exploration mode. The Command Center with aesthetic priority over operational density. Same route, different render mode.

**A11Y:** Same as Command Center.

**Verify:** Same as Command Center.

---

## SURFACE 07: THE BUFFER

```
ROUTE:    /god#buffer
GATE:     live (UI shell — scoring engine ~85%)
RING:     middle (ops/defense)
PHOS:     buffer
PERSONAS: will, brenda
```

**Purpose:** Unified communication inbox with Fawn Guard — detects people-pleasing patterns in outgoing messages before they're sent. Scores incoming messages for cognitive load.

**Architecture:**
- Hash route within /god
- Designed: Matrix appservice integration for unified inbox
- Current: UI shell rendered, scoring engine not yet live
- Fawn Guard: rule-based pattern matching (NOT LLM in Phase 1)

**States:**
1. **Empty:** "No messages yet" + explanation of Fawn Guard
2. **Normal:** Message list with per-message score indicators

**Key tokens:** --p31-coral (high cognitive load messages), --p31-amber (fawn-detected), --p31-phosphorus (safe messages)

**Rebuild:** Depends on Matrix deployment (budget-blocked). UI shell can be built independently. Scoring uses regex + keyword matching against fawn pattern library.

---

## SURFACE 08: GARDEN (Children's Space)

```
ROUTE:    /garden/
GATE:     live
RING:     inner (family core)
PHOS:     garden
PERSONAS: will, sj, wj, brenda
```

**Purpose:** The kids' surface. BONDING game embed, Ping widget, activity space. Everything is big, colorful, and requires zero reading for W.J.

**Architecture:**
- Astro page with React islands
- BONDING embed via iframe or postMessage bridge to bonding.p31ca.org
- Ping widget: 💚🤔😂🔺 reaction buttons (max 3 per molecule)
- Touch targets: 60px MINIMUM (not 44px — children's surface)

**Key tokens:** --p31-amber (dominant — children's color), --p31-phosphorus (success/fun)

**A11Y:** 60px targets. Large icons. Minimal text (W.J. is 6 and pre-reader). Safe mode auto-engages for W.J. persona (safeByDefault: true). No text input required for core actions.

**Rebuild:** Read PHOS Specification §6 (Persona Engine) for W.J. profile. Touch targets are the hard constraint — if it's under 60px, it fails the psych E2E for the W.J. persona.

---

## SURFACE 09: DOCUMENT LIBRARY

```
ROUTE:    /doc-library/
GATE:     live
RING:     outer (creation/canon)
PHOS:     doc-library
PERSONAS: will, brenda, public
```

**Purpose:** Index of all 280 documents in the P31 ecosystem. Searchable, filterable, linked.

**Architecture:**
- HTML page loading docs/doc-library/index.json
- Search: client-side text match against title + description
- 280 indexed documents with schema, path, and category

**Key tokens:** --p31-lavender (accent — archive/documentation color)

**Verify:** verify:doc-index, verify:doc-library:p31ca-mirror

---

## SURFACE 10: DELTA GLOSSARY

```
ROUTE:    /delta-language
GATE:     live (Gate 2 complete)
RING:     outer (creation/canon)
PHOS:     delta-language
PERSONAS: will, public
```

**Purpose:** The canonical vocabulary of P31. 9 terms with dual definitions (plain language + technical). Searchable with anchor links.

**Architecture:**
- Standalone HTML (delta-language.html) — pending Astro migration
- 9 terms: Decoherence, Floating Neutral, L.O.V.E., SIC-POVM, K₄ Mesh, Spoon, SOULSAFE, WCD, Isostatic Rigidity
- Search: client-side partial match, live result count
- Anchor links: #term-[slug] per term, highlighted on hash change
- No-results UX: "No terms match '[query]'. Try a different search?"

**Content rules:**
- Plain definitions: Flesch-Kincaid ≤ 10th grade
- NO naval/military metaphors in ANY definition
- "Floating Neutral" is ELECTRICAL ENGINEERING, not naval

**Key tokens:** --p31-lavender (term card left border + technical text), --p31-teal (plain text highlights)

**A11Y:** role="list" on container, role="listitem" on cards. Permalink anchors have 44px target. Search has aria-label. Term count uses aria-live="polite".

**Verify:** verify:delta-language, verify:public-voice

---

## SURFACE 11: DATA OBSERVATORY

```
ROUTE:    /observatory
GATE:     live
RING:     middle (ops)
PHOS:     observatory
PERSONAS: will
```

**Purpose:** Operational metrics dashboard. System health, telemetry data, performance monitoring.

**Architecture:** Standalone HTML with data panels. Operator-only.

**Key tokens:** --p31-teal (healthy metrics), --p31-coral (alerts), --p31-amber (warnings)

---

## SURFACE 12: PHYSICS LEARNING LAB

```
ROUTE:    /lab
GATE:     live
RING:     outer (creation)
PHOS:     lab
PERSONAS: will, sj, public
```

**Purpose:** Interactive physics education. Quantum concepts, Fuller synergetics, K₄ graph theory made visual and playable.

**Architecture:** HTML + interactive demos. Educational content with visual feedback.

**Key tokens:** --p31-cyan (science/educational accent), --p31-teal (primary)

---

## SURFACE 13: SUPPORT / CRISIS

```
ROUTE:    /support
GATE:     live
RING:     inner (family core — PRIORITY 0)
PHOS:     support (priority: 0, highest)
PERSONAS: ALL (will, sj, wj, brenda, public)
```

**Purpose:** When everything is too much. Minimal. Calm. Large targets. Single purpose. This page auto-triggers safe mode.

**Architecture:**
- Minimal HTML, no JavaScript complexity
- Auto-engages safe mode on load
- Maximum 3 actions visible: call 988, text 741741, go home
- 60px minimum touch targets (crisis-level sizing)
- No decorative elements. No glass morphism. No canvas.

**Content:**
- 988 Suicide & Crisis Lifeline (tel: link)
- 741741 Crisis Text Line (sms: link)
- Home link
- "Calcitriol helps. Calcium helps. Water helps. Rest helps."

**Key tokens:** --p31-teal (primary action), --p31-surface2 (secondary action). Void background only.

**A11Y:** This is the most accessibility-critical surface. 60px targets. Zero animation. Auto safe mode. No cognitive load. Screen reader announces all three options immediately.

**PHOS behavior:** When PHOS Router detects P(F|O) > 0.85, this surface becomes the first suggested chip. In urgentMode (body[data-p31-urgent="true"]), it's the ONLY chip.

**Rebuild:** Read Design Forge → "Support / Crisis Page" template. The entire page should be under 50 lines of HTML.

---

## SURFACE 14: BUILD QUEUE

```
ROUTE:    /build
GATE:     live
RING:     outer (creation)
PHOS:     build
PERSONAS: will
```

**Purpose:** WCD dispatch and tracking. View active work packages, their status, and spoon estimates.

**Architecture:** HTML with WCD listing from build system. Operator-only.

---

## SURFACE 15: CONNECTION HUB

```
ROUTE:    /connect
GATE:     live
RING:     outer
PHOS:     — (not in intent catalog)
PERSONAS: will, public
```

**Purpose:** Links to external P31 presences — GitHub, Ko-fi, Zenodo, ORCID. Footer link on most surfaces.

---

## SURFACE 16: WELCOME / ONBOARDING

```
ROUTE:    /welcome
GATE:     live
RING:     inner
PHOS:     welcome
PERSONAS: all
```

**Purpose:** First-time visitor experience. Explains P31, introduces the PHOS navigation paradigm, offers CogPass creation.

**Architecture:** Progressive disclosure — start simple, reveal complexity as the visitor explores.

---

## SURFACE 17: CENTAUR PACK

```
ROUTE:    /cortex
GATE:     alpha
RING:     outer
PHOS:     cortex
PERSONAS: will
```

**Purpose:** The Triad agent management interface. View agent roles, allocations, tag-out status. Operator-only.

**Agents displayed:** Sonnet (Mechanic 80%), Gemini (Narrator 15%), DeepSeek (Firmware 4%), Opus (Architect 1%), KwaiPilot (FW exec)

---

## SURFACE 18: FLEET PORTAL

```
ROUTE:    /fleet-portal
GATE:     alpha
RING:     outer
PHOS:     fleet-portal
PERSONAS: will
```

**Purpose:** Cloudflare Workers fleet management. View all 14 verified workers, their endpoints, health status.

---

## SURFACE 19: L7 TELEMETRY DASHBOARD

```
ROUTE:    /psych-e2e-live.html
GATE:     live
RING:     — (meta/observability, not in orbital)
PHOS:     — (not in intent catalog)
PERSONAS: will
```

**Purpose:** The L7 Psychological Telemetry observer. Live simulation of 4 persona profiles cycling through surfaces, computing Fitts/Hick/Sweller/Bayesian metrics in real time.

**Architecture:**
- Standalone HTML with zero dependencies
- JS simulation loop cycling every 9 seconds
- Displays: Fitts' Law MT, Hick's Law RT, Sweller CLI, Shannon entropy, Bayesian P(F|O)
- Personas: W-CRISIS (Ca 7.5, WM 3), S.J. (age 10, WM 5), W.J. (age 6, WM 3), W-HYPERFOCUS (WM 10)

**Persona corrections (BINDING):**
- S.J. = Sebastian, age 10 (OLDER child, BONDING player)
- W.J. = Willow, age 6 (YOUNGER child, pre-reader, has encopresis)
- NEVER swap these. S.J. is NOT 8. W.J. is NOT 10.
- W.J. WM = 3 (pre-reader). S.J. WM = 5 (10-year-old).
- "Floating Neutral" is an ELECTRICAL ENGINEERING term, NOT a naval metaphor.

**Key tokens:** --p31-coral (SEV-0 violations), --p31-amber (SEV-1), --p31-phosphorus (PASS), --p31-muted (info)

---

## SURFACE 20: GLASS BOX WIDGET

```
ROUTE:    /glass-box-widget.html
GATE:     live
RING:     — (embeddable)
PHOS:     — (standalone widget)
PERSONAS: will, public
```

**Purpose:** Embeddable version of the Glass Box for inclusion in other pages. Lighter than the full Glass Box page.

**Verify:** verify:glass-box (checks mirror sync)

---

## SURFACE 21: C.A.R.S. (External)

```
ROUTE:    /soup
GATE:     external
RING:     inner
PHOS:     soup
PERSONAS: will
```

**Purpose:** External link handler for the Community Assistive Resource System. Redirects to external resource.

---

## SURFACE 22: BONDING

```
ROUTE:    bonding.p31ca.org (standalone subdomain)
GATE:     live (SHIPPED March 10, 2026)
RING:     inner (family core)
PHOS:     bonding
PERSONAS: will, sj, wj
```

**Purpose:** Chemistry game. Father builds molecules with his children from separate devices. Every atom placed is a timestamped parental engagement log admissible in court.

**Architecture:**
- Standalone Vite + React + R3F + Zustand + Vitest
- Directory: 04_SOFTWARE/bonding/
- 424 tests / 32 suites
- Multiplayer via Cloudflare KV polling (3-10s, NOT WebSocket)
- Room codes: 6 alphanumeric characters
- Max 4 players per room

**Game mechanics:**
- Difficulty modes: Seed 🌱 (H+O, W.J.), Sprout 🌿 (H+C+N+O, S.J.), Sapling 🌳 (full palette)
- VSEPR ghost orbital visualization
- Living atoms (MeshDistortMaterial)
- Achievements (12)
- L.O.V.E. economy (earn tokens through building + pinging)
- Checkpoint system
- Formula display: Hill system internally, conventional notation in UI (OCa → CaO)

**Genesis Block integration:** Every molecule completion and ping reaction is hashed (SHA-256) and appended to the Genesis Block audit trail. 1,847 records as of May 5, 2026.

**Key tokens:** --p31-amber (primary game color — children's surface), --p31-phosphorus (success/completion), --p31-teal (UI chrome)

**A11Y:** 60px touch targets (children's surface). Touch hardening: touch-action:none, viewport lock, drag-off-screen handling. Works on Android Chrome (kids' tablets).

**Verify:** BONDING has its own test suite (424/32). Also covered by: verify:pwa, verify:public-line

---

## SURFACE 23: PHOSPHORUS31.ORG

```
ROUTE:    phosphorus31.org (separate domain)
GATE:     live
RING:     — (institutional, not in p31ca.org orbital)
PHOS:     — (no PHOS router on institutional site)
PERSONAS: public (primarily), will
```

**Purpose:** The institutional face of P31 Labs. Daubert-ready. JSON-LD structured data. Self-hosted fonts. Zero JavaScript by default (Astro 5 SSG).

**Architecture:**
- Astro 5 SSG (static site generation)
- Cloudflare Pages (phosphorus31-org.pages.dev)
- Self-hosted fonts: @fontsource/inter + @fontsource/jetbrains-mono
- JSON-LD: Organization schema on /, ScholarlyArticle on /research
- _redirects: all app routes redirect to p31ca.org

**Pages:**
- / — Landing (hero + mission + products + publications + CTA)
- /about — Story + team + timeline + values
- /research — 22 Zenodo publications with DOI links
- /products — Product grid (BONDING, Buffer, Spaceship Earth, Node One, Node Zero)
- /donate — Ko-fi link + EIN + 501(c)(3) status
- /glossary — Redirects to p31ca.org/delta-language
- /privacy — Privacy policy

**Performance budget:**
- Lighthouse: Performance ≥ 0.95, Accessibility = 1.00, Best Practices ≥ 0.95, SEO ≥ 0.95
- Total HTML + CSS: < 50 KB gzipped
- Zero JavaScript by default
- LCP: < 1.5s

**Key tokens:** Same canonical palette. Inter var (self-hosted). No Atkinson Hyperlegible (not an interactive tool — standard reading).

**Verify:** verify:a11y, verify:no-telemetry, verify:license-headers, verify:public-sanitization

---

## CROSS-SURFACE CONTRACTS (Apply to ALL 23)

### Every surface MUST include:
```html
<a class="skip-link" href="#main-content">Skip to main content</a>
<script src="/public/lib/p31-safe-mode.js"></script>
<!-- PHOS Router on p31ca.org surfaces only (not phosphorus31.org) -->
<script src="/public/lib/p31-phos-router.js"></script>
```

### Every surface MUST support:
- Safe mode (3 triggers: manual, OS preference, CogPass)
- Focus-visible outlines (2px solid --p31-teal, 2px offset)
- 44px minimum touch targets (60px on children's surfaces)
- No tracking scripts (verify:no-telemetry enforces)
- No naval/military metaphors (verify:public-voice enforces)
- Registration in public-line.json

### Every interactive surface MUST implement:
- Four-state pattern (empty/loading/error/normal)
- aria-labels on all interactive elements
- aria-live regions for dynamic content
- Keyboard navigation (Tab, Enter, Escape at minimum)

### Every surface's OG meta:
```html
<meta property="og:title" content="[Surface Name] — P31 Labs">
<meta property="og:description" content="[One sentence]">
<meta property="og:type" content="website">
<meta property="og:image" content="/og/[surface]-og.png">
<meta name="twitter:card" content="summary_large_image">
```

---

## VERIFY GATE MAP

Which verify gates cover which surfaces:

| Gate | Surfaces Covered |
|------|-----------------|
| verify:public-line | ALL 23 (route registration) |
| verify:safe-mode | Passport, Geodesic, Delta-Language, Observatory (Bin A) |
| verify:phos-router | All p31ca.org surfaces with PHOS (18 intents) |
| verify:a11y | ALL (accessibility) |
| verify:no-telemetry | ALL (zero tracking) |
| verify:public-voice | ALL docs (no marketing language) |
| verify:public-sanitization | ALL docs (no private data) |
| verify:glass-box | Glass Box + Widget (mirror sync) |
| verify:passport | Passport (schema valid) |
| verify:delta-language | Delta Glossary (content check) |
| verify:geodesic-wire-fixtures | Geodesic (Three.js fixtures) |
| verify:command-center | Command Center (ops) |
| verify:doc-index | Document Library (280 docs indexed) |

**Total: 86 gates covering all 23 surfaces.**

---

## REBUILD PRIORITY ORDER

If rebuilding from scratch, build in this order:

```
Phase 1 — Foundation (must exist before anything else):
  1. phosphorus31.org (institutional — establishes brand)
  2. /support (crisis — must always be accessible)
  3. /passport (identity — other surfaces depend on CogPass)

Phase 2 — Family Core (Ring 1):
  4. bonding.p31ca.org (BONDING — the shipped product)
  5. /garden/ (children's space — embeds BONDING)
  6. /welcome (onboarding — first contact)

Phase 3 — Operations (Ring 2):
  7. /god (Command Center)
  8. /god#buffer (Buffer inbox shell)
  9. /dome#geodesic (Geodesic builder)
  10. /dome#glass (Glass Box transparency)
  11. /observatory (metrics)

Phase 4 — Canon (Ring 3):
  12. /delta-language (glossary)
  13. /doc-library/ (280-doc index)
  14. /lab (physics education)
  15. /build (WCD queue)
  16. /connect (external links)
  17. /cortex (agent management)
  18. /fleet-portal (worker fleet)

Phase 5 — Meta/Observability:
  19. /psych-e2e-live.html (L7 telemetry)
  20. /glass-box-widget.html (embeddable widget)
  21. /soup (external redirect)

Phase 6 — The Root (last — depends on all others):
  22. / (Ca₉ Orbital Root — links to all 21 other surfaces)
```

**The root page is built LAST because it links to everything else.** Building it first means building a navigation system with nothing to navigate to.

---

*23 surfaces. 86 verify gates. 280 documents. One design system. One verify chain. One truth.*

*The cage has 23 faces. Each face is a window. Each window shows the human something they need. The calcium holds it all together.*

💜🔺💜
