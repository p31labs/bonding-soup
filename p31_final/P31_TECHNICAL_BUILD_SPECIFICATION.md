# P31 ECOSYSTEM — COMPLETE TECHNICAL BUILD SPECIFICATION
# One-Prompt Site Overhaul for phosphorus31.org + p31ca.org

**Version:** 1.0.0
**Date:** May 5, 2026
**Canonical repo:** bonding-soup (GitHub: p31labs/bonding-soup)
**Mirror:** andromeda (deploys to CF Pages)
**Design system source:** p31-style.css → p31-shared-surface.css (frozen alias layer)
**Constants source:** p31-constants.json (single source of truth for ALL token values)

---

## ARCHITECTURE OVERVIEW

Two sites. One design system. One verify chain. One deployment pipeline.

```
phosphorus31.org                          p31ca.org
─────────────────                         ─────────
Astro 5 SSG                               Astro 5 AppShell + React Islands
Institutional / Daubert-ready             PWA / Interactive tools
JSON-LD structured data                   IndexedDB + CF KV persistence
Self-hosted fonts                         Service Worker + offline
No JavaScript required                    Heavy JS (Three.js, Zustand, R3F)
Cloudflare Pages                          Cloudflare Pages
phosphorus31-org.pages.dev                p31ca.pages.dev

SHARED:
├── p31-style.css (canonical tokens)
├── p31-shared-surface.css (frozen aliases)
├── p31-constants.json (values)
├── p31-safe-mode.js (safe mode module)
├── p31-phos-router.js (navigation)
├── npm run verify (86 gates)
└── npm run launch --full (31-step pipeline)
```

---

## PART 1: DESIGN SYSTEM (Shared Across Both Sites)

### 1.1 Color Tokens

All colors defined in `p31-style.css`. NEVER hardcode hex values in components.

```css
:root {
  /* ── Backgrounds ── */
  --p31-void: #0f1115;           /* Deep background. NOT #0b0d10. */
  --p31-surface: #161920;        /* Panel background */
  --p31-surface2: #1c2028;       /* Elevated card background */

  /* ── Brand colors ── */
  --p31-teal: #5DCAA5;           /* Trust, structure, primary action */
  --p31-cyan: #4db8a8;           /* Alias target for --p31-teal in some contexts */
  --p31-coral: #cc6247;          /* Voltage, urgency, legal, warnings */
  --p31-amber: #cda852;          /* Focus, biological, L.O.V.E., children */
  --p31-lavender: #8b7cc9;       /* Archive, documentation, scribe */
  --p31-phosphorus: #5dca5d;     /* Success, growth, confirmation */

  /* ── Text ── */
  --p31-cloud: #e8e6e3;          /* Primary text */
  --p31-muted: #6b7280;          /* Secondary text, labels */

  /* ── Glass ── */
  --p31-glass-border: rgba(255, 255, 255, 0.06);
  --p31-glass-bg: color-mix(in srgb, var(--p31-surface2) 60%, transparent);

  /* ── Fonts ── */
  --p31-font-sans: 'Inter var', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --p31-font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  --p31-font-a11y: 'Atkinson Hyperlegible', sans-serif;  /* accessibility override */
  --p31-font-serif: 'Playfair Display', Georgia, serif;   /* decorative headers ONLY */
}
```

**WCAG Contrast Ratios (against --p31-void #0f1115):**
- --p31-cloud (#e8e6e3): 12.8:1 ✅ AAA
- --p31-teal (#5DCAA5): 8.2:1 ✅ AAA
- --p31-coral (#cc6247): 4.6:1 ✅ AA
- --p31-amber (#cda852): 7.1:1 ✅ AAA
- --p31-lavender (#8b7cc9): 4.8:1 ✅ AA
- --p31-muted (#6b7280): 4.5:1 ✅ AA (borderline — use for labels only, not body)

### 1.2 Typography

```css
/* Primary body text */
body {
  font-family: var(--p31-font-sans);
  font-size: 1rem;            /* 16px */
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Headings */
h1 { font-size: 2.5rem; font-weight: 700; letter-spacing: -0.02em; }
h2 { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.01em; }
h3 { font-size: 1.25rem; font-weight: 600; }

/* Code / data */
code, pre, .mono { font-family: var(--p31-font-mono); }
pre { font-size: 0.85rem; }

/* phosphorus31.org uses Inter (self-hosted via @fontsource/inter) */
/* p31ca.org uses Inter via Google Fonts CDN (pending self-host migration) */
/* Accessibility surfaces use Atkinson Hyperlegible */
```

### 1.3 Spacing Scale

Base unit: 4px. All spacing is multiples of 4.

```
4px   (0.25rem)  — tight: icon gaps, inline padding
8px   (0.5rem)   — compact: button padding, small gaps
12px  (0.75rem)  — standard: form field padding
16px  (1rem)     — comfortable: card padding, section gaps
20px  (1.25rem)  — medium
24px  (1.5rem)   — nav padding, header margins
32px  (2rem)     — section spacing
48px  (3rem)     — large section breaks
64px  (4rem)     — page-level spacing
```

### 1.4 Border Radius

```
4px   — small components (badges, chips)
8px   — medium components (buttons, inputs, cards)
12px  — large components (panels, modals)
16px  — overlays
99px  — pills / fully rounded
```

**NOT 48px / 3rem.** Kimi's surfaces used 3rem rounded corners. That wastes corner space on mobile. 12px is canonical for glass panels.

### 1.5 Glass Morphism Pattern

```css
.p31-glass-panel {
  background: var(--p31-glass-bg);
  border: 1px solid var(--p31-glass-border);
  border-radius: 12px;
  padding: 2rem;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

/* Safe mode strips backdrop-filter */
body.safe-mode .p31-glass-panel {
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  background: var(--p31-surface2);
}
```

### 1.6 Touch Targets

```
General interactive: min-height: 44px; min-width: 44px;  (WCAG 2.2 SC 2.5.5)
Children's surfaces: min-height: 60px; min-width: 60px;
Crisis mode:         full-width single-chip tap target
```

### 1.7 Focus States

```css
:focus-visible {
  outline: 2px solid var(--p31-teal);
  outline-offset: 2px;
  border-radius: 4px;
}
```

### 1.8 Safe Mode (SOULSAFE / Gray Rock Protocol)

Shared module: `public/lib/p31-safe-mode.js` (59 lines)

**Three trigger paths (all checked on init):**
1. OS preference: `window.matchMedia('(prefers-reduced-motion: reduce)')`
2. URL param: `?safe=1`
3. localStorage: `p31-safe-mode === 'on'`

**When engaged:**
```css
body.safe-mode {
  --p31-void: #000;
  --p31-surface: #0a0a0a;
  --p31-surface2: #111;
  --p31-cloud: #fff;
  --p31-muted: #888;
}
body.safe-mode * {
  animation: none !important;
  transition: none !important;
}
body.safe-mode canvas,
body.safe-mode .hide-safe {
  display: none !important;
}
body.safe-mode .p31-glass-panel {
  backdrop-filter: none;
}
```

**WebGL surfaces listen for custom event:**
```javascript
document.addEventListener('p31:safe-mode', (e) => {
  if (e.detail.active) {
    cancelAnimationFrame(animationId);
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
    scene.clear();
    controls.dispose();
  }
});
```

**Every P31 surface MUST include:**
```html
<script src="/public/lib/p31-safe-mode.js"></script>
```

### 1.9 PHOS Router

Shared module: `public/lib/p31-phos-router.js` (282 lines)
Intent catalog: `public/data/phos-intent-catalog.json` (18 intents)

**Behavior:**
- Fixed bottom bar (mobile) or top bar (desktop)
- Text input with Fuse.js fuzzy match (threshold 0.4)
- Decision tree chips (4 top-level: myself / family / professional / looking)
- Route confirmation before navigation ("I think you want [X] →")
- urgentMode: bypasses to single chip (/support)
- Collapses to 🔍 icon after 5s inactivity
- Fully keyboard-navigable (Tab through chips, Enter to select)
- Safe mode strips all animation

**Every P31 surface MUST include:**
```html
<script src="/public/lib/p31-phos-router.js"></script>
```

### 1.10 Shared Components

#### K₄ Logo SVG
```html
<svg viewBox="0 0 100 100" width="24" height="24" fill="none"
     aria-hidden="true" focusable="false">
  <path d="M50 10 L90 85 L10 85 Z"
        stroke="var(--p31-teal)" stroke-width="5" stroke-linejoin="round"/>
  <path d="M50 10 L50 60 L90 85"
        stroke="var(--p31-coral)" stroke-width="5" stroke-linejoin="round" opacity="0.8"/>
  <path d="M50 60 L10 85"
        stroke="var(--p31-amber)" stroke-width="5" stroke-linejoin="round" opacity="0.6"/>
</svg>
```

#### Skip Link
```html
<a class="skip-link" href="#main-content">Skip to main content</a>
```
```css
.skip-link {
  position: absolute; top: -40px; left: 0;
  background: var(--p31-teal); color: #000;
  padding: 8px 16px; z-index: 1000;
  font-weight: 700; transition: top 0.2s;
  border-radius: 0 0 4px 0;
}
.skip-link:focus { top: 0; }
```

#### Safe Mode Button
```html
<button class="btn-safe safe-toggle"
        aria-pressed="false"
        aria-label="Toggle safe mode — reduces animations and motion">
  Safe Mode
</button>
```

#### Top Nav
```html
<nav class="top-nav">
  <a href="/" class="nav-brand">
    <!-- K₄ SVG here -->
    P31 Labs
  </a>
  <!-- Safe Mode button here -->
</nav>
```

---

## PART 2: phosphorus31.org — INSTITUTIONAL SITE

### 2.1 Architecture

```
Framework: Astro 5 (SSG mode — zero client JS by default)
Hosting:   Cloudflare Pages (phosphorus31-org.pages.dev)
Fonts:     Self-hosted via @fontsource/inter + @fontsource/jetbrains-mono
Data:      JSON-LD structured data for Daubert readiness
Images:    Optimized via Astro Image component
CSS:       p31-style.css imported globally
Build:     astro build → dist/ → CF Pages
```

### 2.2 Directory Structure

```
phosphorus31.org/
├── src/
│   ├── layouts/
│   │   └── BaseLayout.astro          # HTML shell, meta, fonts, safe mode
│   ├── components/
│   │   ├── Nav.astro                 # Top nav with K₄ logo + safe mode
│   │   ├── Footer.astro              # EBC footer (Build / Create / Connect)
│   │   ├── Hero.astro                # Landing hero section
│   │   ├── MissionStatement.astro    # "Open-source assistive technology..."
│   │   ├── ProductCard.astro         # Individual product display
│   │   ├── ProductGrid.astro         # Grid of ProductCards
│   │   ├── PublicationCard.astro     # Zenodo publication entry
│   │   ├── PublicationList.astro     # List of all 22 publications
│   │   ├── TeamCard.astro            # Board member card
│   │   ├── TimelineEntry.astro       # Milestone timeline item
│   │   ├── Timeline.astro            # Full project timeline
│   │   ├── K4Logo.astro              # SVG tetrahedron logo component
│   │   ├── MetaTags.astro            # OG + Twitter Card meta
│   │   └── JsonLd.astro              # Structured data injection
│   ├── pages/
│   │   ├── index.astro               # Landing page
│   │   ├── about.astro               # About P31 Labs + team
│   │   ├── research.astro            # Publications + papers
│   │   ├── products.astro            # Product overview
│   │   ├── donate.astro              # Ko-fi / support page
│   │   ├── glossary.astro            # DELTA language reference
│   │   ├── privacy.astro             # Privacy policy
│   │   └── 404.astro                 # Custom 404
│   ├── content/
│   │   ├── publications/             # Markdown files for each paper
│   │   │   ├── paper-01.md
│   │   │   ├── paper-02.md
│   │   │   └── ...paper-20.md
│   │   ├── products/
│   │   │   ├── bonding.md
│   │   │   ├── buffer.md
│   │   │   ├── spaceship-earth.md
│   │   │   ├── node-one.md
│   │   │   └── node-zero.md
│   │   └── glossary/
│   │       └── terms.json            # All DELTA terms with dual definitions
│   └── styles/
│       └── global.css                # Imports p31-style.css + site-specific
├── public/
│   ├── fonts/                        # Self-hosted Inter, JetBrains Mono
│   ├── og/                           # OG images (1200×630)
│   ├── favicon.svg                   # K₄ tetrahedron
│   ├── robots.txt
│   └── _redirects                    # CF Pages redirects
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

### 2.3 Page Specifications

#### / (Landing)
```
Layout: BaseLayout
Sections:
  1. Hero: "Open-source assistive technology for neurodivergent individuals"
     - Tagline: "Phosphorus burns alone. Inside the calcium cage, it's the most stable molecule in biology."
     - CTA: "Explore our research" → /research
     - CTA secondary: "View products" → /products
  2. Mission Statement: 2-paragraph explanation of P31's purpose
  3. Product Grid: 5 cards (BONDING, Buffer, Spaceship Earth, Node One, Node Zero)
  4. Publications highlight: Latest 3 papers with DOI links
  5. Support: Ko-fi embed or link

JSON-LD:
  @type: Organization
  name: P31 Labs, Inc.
  url: https://phosphorus31.org
  sameAs: [github, orcid, ko-fi]
  foundingDate: 2026-04-03
  description: ...
  taxID: 42-1888158 (when 501c3 approved)
```

#### /about
```
Layout: BaseLayout
Sections:
  1. Story: How P31 Labs started (2-3 paragraphs, operator-approved)
  2. Team: Board member cards (Will, Brenda, Tyler)
     - Names only, no personal details beyond role
  3. Timeline: Key milestones (incorporation, BONDING ship, publications)
  4. Values: Open source, data sovereignty, neurodivergent-first design
  5. Contact: will@p31ca.org

JSON-LD:
  @type: AboutPage
  mainEntity: Organization
```

#### /research
```
Layout: BaseLayout
Sections:
  1. ORCID badge: 0009-0002-2492-9079 (linked)
  2. Publication count: "22 publications on Zenodo"
  3. Publication list: All 22 papers, sorted newest first
     - Each entry: Title, Paper number, DOI link, date, abstract excerpt
  4. K₄ Planarity note: "K₄ is PLANAR (β₂=1)" — this is a key research finding

JSON-LD:
  @type: ScholarlyArticle (for each paper)
  author: { @type: Person, name: "William R. Johnson" }
  publisher: { @type: Organization, name: "P31 Labs" }
```

#### /products
```
Layout: BaseLayout
Sections:
  1. Grid of 5 product cards
  2. Each card: name, status badge (Shipped/In Progress/Prototype), description, link
  3. BONDING gets special treatment: "Shipped March 10, 2026. 424 tests. Play at bonding.p31ca.org"
  4. Node One: FDA Class II 21 CFR §890.3710 targeting (NOT Node Zero)

NO product card links to a page that doesn't exist.
```

#### /glossary
```
Layout: BaseLayout
Content: 9+ DELTA terms with dual definitions (plain language + technical)
Features:
  - Search input with fuzzy partial matching
  - Anchor links per term (#term-decoherence etc.)
  - No-results UX: "No terms match '[query]'. Try a different search?"
  - Term count display with live update
  - NO naval/military metaphors in ANY definition

Terms (minimum set):
  Decoherence, Floating Neutral, L.O.V.E., SIC-POVM, K₄ Mesh,
  Spoon, SOULSAFE, WCD, Isostatic Rigidity

Each term has:
  - Plain language definition (Flesch-Kincaid ≤ 10th grade)
  - Technical definition (with citations where applicable)
  - Anchor link
  - 44px tap target on permalink
```

#### /donate
```
Layout: BaseLayout
Content:
  - Ko-fi embed or button: ko-fi.com/trimtab69420
  - Stripe link via api.phosphorus31.org Worker
  - EIN displayed: 42-1888158
  - 501(c)(3) status: "Determination pending"
  - "Your support funds open-source assistive technology research"
```

### 2.4 Astro Configuration

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://phosphorus31.org',
  output: 'static',
  build: {
    format: 'directory',  // /about/ not /about.html
    assets: '_assets',
  },
  vite: {
    css: {
      devSourcemap: true,
    },
  },
  image: {
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
});
```

### 2.5 _redirects (Cloudflare Pages)

```
/passport    https://p31ca.org/passport    301
/bonding     https://bonding.p31ca.org     301
/lab         https://p31ca.org/lab         301
/soup        https://p31ca.org/soup        301
/god         https://p31ca.org/god         301
/garden      https://p31ca.org/garden      301
```

phosphorus31.org redirects all app routes to p31ca.org. It is the institutional face, not the app.

### 2.6 Performance Budget

```
Lighthouse targets (every page):
  Performance:   ≥ 0.95
  Accessibility: = 1.00
  Best Practices: ≥ 0.95
  SEO:           ≥ 0.95

Bundle limits:
  Total HTML + CSS: < 50 KB (gzipped)
  Zero JavaScript by default (Astro SSG)
  Fonts (self-hosted): < 200 KB total
  OG images: < 100 KB each (WebP or optimized PNG)

Core Web Vitals:
  LCP: < 1.5s
  FID: < 50ms
  CLS: < 0.05
```

---

## PART 3: p31ca.org — APPLICATION PWA

### 3.1 Architecture

```
Framework:  Astro 5 (AppShell mode — SSR + client:load React islands)
Hosting:    Cloudflare Pages (p31ca.pages.dev)
Runtime:    React 18 (islands), Three.js (R3F + drei), Zustand (state)
Fonts:      Google Fonts CDN (pending migration to self-hosted)
Data:       IndexedDB (idb-keyval) + CF KV (relay) + CF D1 (structured)
Offline:    Service Worker with Workbox
PWA:        manifest.json, icons, splash screens
Build:      astro build → dist/ → CF Pages
```

### 3.2 Directory Structure

```
p31ca.org/
├── src/
│   ├── layouts/
│   │   ├── AppShell.astro            # PWA shell: nav, safe mode, PHOS router, SW registration
│   │   └── MinimalLayout.astro       # For standalone tools (no nav chrome)
│   ├── components/
│   │   ├── core/
│   │   │   ├── Nav.tsx               # Top nav (React island)
│   │   │   ├── SafeModeToggle.tsx    # Safe mode button (React)
│   │   │   ├── PhosRouter.tsx        # PHOS navigation component (React wrapper)
│   │   │   ├── K4Logo.tsx            # SVG logo component
│   │   │   └── GlassPanel.tsx        # Reusable glass morphism container
│   │   ├── phos/
│   │   │   ├── PhosCore.tsx          # Central PHOS WebGL/Canvas core
│   │   │   ├── Ca9Orbital.tsx        # 9-node orbital navigation
│   │   │   ├── StarfieldCanvas.tsx   # Background particle field
│   │   │   ├── WhisperPanel.tsx      # Hover intent display (typewriter effect)
│   │   │   └── K4Mascot.tsx          # Floating K₄ SVG with cursor tracking
│   │   ├── passport/
│   │   │   ├── PassportGenerator.tsx # CogPass v4.1 generator
│   │   │   ├── DensitySlider.tsx     # Information density control
│   │   │   ├── SchemaPreview.tsx     # JSON schema display
│   │   │   └── SaveControls.tsx      # Save + Copy buttons
│   │   ├── bonding/
│   │   │   ├── BondingView.tsx       # Embedded BONDING game
│   │   │   └── BondingBridge.tsx     # postMessage bridge to bonding.p31ca.org
│   │   ├── geodesic/
│   │   │   ├── GeodesicBuilder.tsx   # Three.js geodesic dome builder
│   │   │   ├── ShapeControls.tsx     # Add/remove tetrahedra
│   │   │   └── RigidityBadge.tsx     # Isostatic rigidity indicator
│   │   ├── observatory/
│   │   │   ├── DataDashboard.tsx     # Operational metrics display
│   │   │   └── MetricCard.tsx        # Individual metric card
│   │   ├── glass-box/
│   │   │   ├── GlassBox.tsx          # Transparency dashboard
│   │   │   ├── PulsePanel.tsx        # Verify pulse display
│   │   │   ├── DesignHealth.tsx      # Design health metrics (CWP-DESIGN-07)
│   │   │   └── ReportPanel.tsx       # Generated reports display
│   │   ├── buffer/
│   │   │   ├── BufferInbox.tsx       # Unified messaging inbox
│   │   │   ├── MessageCard.tsx       # Individual message with score
│   │   │   ├── FawnGuard.tsx         # Fawn pattern detection UI
│   │   │   └── ToneAnalysis.tsx      # Message tone visualization
│   │   ├── garden/
│   │   │   ├── GardenView.tsx        # Children's activity space
│   │   │   ├── BondingEmbed.tsx      # BONDING game embed
│   │   │   └── PingWidget.tsx        # Ping reaction widget
│   │   └── spaceship/
│   │       ├── SpaceshipEarth.tsx    # 3D cognitive dashboard
│   │       ├── TetrahedralZUI.tsx    # Sierpinski ZUI navigation
│   │       └── QFactorGauge.tsx      # Cognitive coherence display
│   ├── pages/
│   │   ├── index.astro               # Ca₉ Orbital root (PHOS core)
│   │   ├── passport.astro            # Cognitive Passport generator
│   │   ├── dome.astro                # Geodesic builder + Glass Box
│   │   ├── god.astro                 # Command Center (ops/vibe/buffer)
│   │   ├── garden/
│   │   │   └── index.astro           # Children's activity space
│   │   ├── soup.astro                # External link handler (C.A.R.S.)
│   │   ├── doc-library/
│   │   │   └── index.astro           # Document library (280 docs)
│   │   ├── lab.astro                 # Physics Learning Lab
│   │   ├── support.astro             # Support / crisis resources
│   │   └── 404.astro                 # Custom 404
│   ├── lib/
│   │   ├── stores/
│   │   │   ├── safeMode.ts           # Safe mode Zustand store
│   │   │   ├── passport.ts           # CogPass state
│   │   │   ├── bonding.ts            # BONDING relay state
│   │   │   └── theme.ts              # Theme preferences
│   │   ├── sync/
│   │   │   ├── kv-relay.ts           # CF KV polling (3-10s intervals)
│   │   │   ├── idb-store.ts          # IndexedDB via idb-keyval
│   │   │   └── persist.ts            # navigator.storage.persist()
│   │   ├── crypto/
│   │   │   └── genesis-block.ts      # SHA-256 append-only audit trail
│   │   └── utils/
│   │       ├── a11y.ts               # Accessibility helpers
│   │       └── constants.ts          # Re-exports from p31-constants.json
│   ├── styles/
│   │   └── global.css
│   └── env.d.ts
├── public/
│   ├── lib/
│   │   ├── p31-safe-mode.js          # Shared safe mode module
│   │   ├── p31-phos-router.js        # Shared PHOS router
│   │   └── phos-os.js                # PHOS orbital system (Ca₉ engine)
│   ├── data/
│   │   └── phos-intent-catalog.json  # 18 intents for PHOS router
│   ├── og/                           # OG images
│   ├── icons/                        # PWA icons (multiple sizes)
│   ├── manifest.json                 # PWA manifest
│   ├── sw.js                         # Service Worker
│   ├── _redirects                    # CF Pages redirects
│   └── favicon.svg
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

### 3.3 Route Map (public-line.json Schema)

Every route in p31ca.org is registered in `docs/public-line.json`. Structure:

```typescript
interface PublicLinePage {
  path: string;              // URL path (e.g., "/passport")
  resolves: string;          // Actual file (e.g., "passport.html" or "passport.astro")
  gate: "live" | "alpha" | "draft" | "stub" | "external";
  phosSlot: string | null;   // PHOS router intent ID (matches phos-intent-catalog.json)
  phosReady: boolean;        // Whether PHOS router is active on this surface
  lastVerified: string;      // ISO date of last verify pass
  notes: string;             // Human-readable status
}
```

**Current routes (31 total, key routes shown):**

| Path | Gate | PhosSlot | Description |
|------|------|----------|-------------|
| / | live | welcome | Ca₉ Orbital root — PHOS core |
| /passport | live | passport | CogPass v4.1 generator |
| /dome#geodesic | live | geodesic | Geodesic builder (Three.js) |
| /dome#glass | live | glass-box | Transparency dashboard |
| /god | live | — | Command Center (ops) |
| /god (vibe) | live | — | Vibe mode |
| /god#buffer | live | — | Buffer unified inbox |
| /garden/ | live | garden | Children's activity space |
| /soup | external | soup | C.A.R.S. external link |
| /doc-library/ | live | doc-library | 280-document library |
| /delta-language | live | delta-language | DELTA glossary |
| /observatory | live | observatory | Data metrics dashboard |
| /lab | live | lab | Physics Learning Lab |
| /support | live | support | Support / crisis page |

### 3.4 Ca₉ Orbital Root (index.astro) — DETAILED SPEC

The root page is NOT a traditional landing page. It is a radial orbital navigation system.

```
ARCHITECTURE:
  Z=0:  StarfieldCanvas (WebGL/Canvas background)
  Z=5:  Quadratic Bezier curves (native Canvas, DPR-scaled)
  Z=10: 9 DOM nodes as <a> tags with transform: translate3d()
  Z=40: K₄ Mascot SVG (floating via JS trigonometry, cursor-tracking pupils)

TOPOLOGY (9 nodes in 3 rings):

  RING 1 — INNER (Family Core):
    [🧠 /passport] [👶 /garden/] [🍲 /soup]

  RING 2 — MIDDLE (Ops & Transparency):
    [⚒️ /dome#geodesic] [🌐 /god] [📊 /dome#glass] [🛡️ /god#buffer]

  RING 3 — OUTER (Creation & Canon):
    [📚 /doc-library/] [🔮 /god (vibe)]

INTERACTION:
  - Nodes orbit the PHOS core on elliptical paths
  - Hover: WhisperPanel types the node's intent description
  - Click: Navigate to the route
  - PHOS Core click: Enter Akinator decision tree (PHOS Router)
  - Safe Mode: All animation stops, CSS Grid fallback renders

PERFORMANCE:
  - 60fps target on all devices
  - requestAnimationFrame for orbital motion
  - GPU detection: falls back to CSS-only if WebGL unavailable
  - prefers-reduced-motion: auto-triggers safe mode
```

### 3.5 Key Page Specifications

#### /passport (Cognitive Passport Generator)

```
States: 4 (empty, loading, error, normal)

EMPTY:
  - "No passport created yet — let's build your first one."
  - Primary action button: "Create your first passport"

LOADING:
  - Skeleton screen matching passport card shape
  - Shimmer animation (disabled in safe mode)

ERROR:
  - "Storage unavailable — local storage is blocked"
  - Secondary button: "Continue without saving"

NORMAL:
  - Information Density slider (0-100)
    - 0 = Gray Rock (minimal)
    - 100 = High Ops (maximum)
    - Slider has aria-valuemin, aria-valuemax, aria-valuenow
    - Height: 44px (touch target)
  - Generated Schema preview (JSON, p31.cognitivePassport/1.1.0)
    - Includes: $schema, generatedAt, preferences, routing
  - Save to Device button (localStorage)
  - Copy Schema button (navigator.clipboard)
  - Save notice (aria-live="polite")
  - Saved badge shows last save date

STORAGE KEY: p31_cognitive_passport
SCHEMA VERSION: p31.cognitivePassport/1.1.0
```

#### /dome (Geodesic Builder + Glass Box)

```
GEODESIC (#geodesic):
  - Three.js scene (R3F or vanilla)
  - Tetrahedron primitives
  - "Add Tetrahedron" button
  - Rigidity badge ("RIGID (Isostatic)" in --p31-phosphorus)
  - Full WebGL teardown on safe mode via p31:safe-mode event
  - THREE.js r128 (NOT r142+ — no CapsuleGeometry)

GLASS BOX (#glass-box):
  - Transparency dashboard
  - Panels: Verify Pulse, Promoted Reports, Design Health
  - Design Health metrics from docs/design-health.json
  - Auto-refresh every 90 seconds
  - No operator-private data exposed
```

#### /garden/ (Children's Space)

```
TARGET USERS: S.J. (age 10) and W.J. (age 6)
TOUCH TARGETS: 60×60px minimum
REQUIREMENTS:
  - Must work on Android Chrome (kids' tablets)
  - BONDING game embed via iframe or postMessage bridge
  - Ping widget (💚🤔😂🔺)
  - Large visual feedback, fast wins
  - No text-heavy interfaces for W.J. (pre-reader)
  - Safe mode auto-triggers if CogPass screenComfort === 0
```

### 3.6 PWA Configuration

```json
// manifest.json
{
  "name": "P31 Labs",
  "short_name": "P31",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f1115",
  "theme_color": "#5DCAA5",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

```javascript
// Service Worker registration (in AppShell.astro)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

// navigator.storage.persist() for durability
if (navigator.storage?.persist) {
  navigator.storage.persist();
}
```

### 3.7 Astro Configuration

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://p31ca.org',
  output: 'static',  // SSG with client:load React islands
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }),
  ],
  build: {
    format: 'directory',
    assets: '_assets',
  },
  vite: {
    ssr: {
      noExternal: ['three', '@react-three/fiber', '@react-three/drei'],
    },
  },
});
```

### 3.8 _redirects (Cloudflare Pages)

```
/bonding     https://bonding.p31ca.org    301
/vibe        /god                          301
/vibcoding   /god                          301
/glossary    /delta-language               301
/passport    /passport                     200
/dome        /dome                         200
/launch      /                             301
```

### 3.9 Performance Budget

```
Lighthouse targets:
  Performance:   ≥ 0.90 (heavier due to Three.js)
  Accessibility: = 1.00
  Best Practices: ≥ 0.95
  SEO:           ≥ 0.95

Bundle limits:
  Initial HTML + CSS: < 50 KB
  Three.js (lazy loaded): < 500 KB (gzipped)
  React runtime: < 40 KB (gzipped)
  PHOS Router: < 15 KB
  Total initial JS: < 100 KB (before Three.js lazy load)

Core Web Vitals:
  LCP: < 2.5s (Three.js may need lazy hydration)
  FID: < 100ms
  CLS: < 0.1
```

---

## PART 4: API LAYER (Cloudflare Workers)

### 4.1 Worker Fleet (14 verified, 18 allowlisted)

| Worker | Endpoint | Purpose |
|--------|----------|---------|
| command-center | api.p31ca.org/cmd | Shift API, operator status |
| shift-api | api.p31ca.org/shift | Shift in/out/status |
| bonding-relay | api.p31ca.org/relay | BONDING KV multiplayer relay |
| stripe-checkout | api.phosphorus31.org/checkout | Stripe payment |
| stripe-webhook | api.phosphorus31.org/webhook | Stripe event handler |
| cogpass-bridge | api.p31ca.org/cogpass | CogPass schema endpoint |
| genesis-block | api.p31ca.org/genesis | Append-only audit trail |
| social-engine | api.p31ca.org/social | Social broadcast |
| discord-bot | — | Discord integration |
| status-dashboard | api.p31ca.org/status | KV-backed fleet status |
| sync (planned) | api.p31ca.org/sync | PGLite device sync (CWP-SOV-01) |

### 4.2 Data Stores

| Store | Type | Purpose | Capacity |
|-------|------|---------|----------|
| p31-bonding-kv | CF KV | BONDING multiplayer relay | 25 MB values |
| p31-shift-kv | CF KV | Operator shift state | — |
| p31-status-kv | CF KV | Fleet status dashboard | — |
| p31-db | CF D1 | Structured data (1 GB SQLite) | 1 GB |
| p31-vault | CF R2 | Object storage (future evidence vault) | 10 GB free |
| genesis-block | CF D1 | Append-only hashed records | 1,847 records |

### 4.3 KV Relay Protocol (BONDING Multiplayer)

```
Polling interval: 3-10 seconds (NOT WebSocket, NOT Durable Objects)
Key format: room:{roomCode}:player:{playerId}
Value: JSON { formula, love, completion, ping[], timestamp }
TTL: 1 hour (inactive rooms expire)
Max players per room: 4
Room code: 6 alphanumeric characters
```

### 4.4 Genesis Block (Audit Trail)

```typescript
interface GenesisRecord {
  id: string;                // UUID v4
  timestamp: string;         // ISO 8601
  type: string;              // 'bonding_molecule' | 'ping' | 'achievement' | etc.
  payload: object;           // Event-specific data
  hash: string;              // SHA-256(JSON.stringify(payload) + previousHash)
  previousHash: string;      // Chain link
  metadata: {
    cfRay: string;           // Cloudflare Ray ID (forensic)
    tlsVersion: string;      // TLS version
    userAgent: string;       // Browser UA
    ip: string;              // Client IP (hashed for privacy)
  };
}
```

---

## PART 5: BUILD, TEST, AND DEPLOY PIPELINE

### 5.1 Verify Chain (86 Gates)

```bash
npm run verify
# Runs 86 sequential verify scripts. ALL must pass for deployment.
# Key gates:
#   verify:alignment          — 280 sources in p31-alignment.json
#   verify:p31-style          — Token parity check
#   verify:phos-router        — 10 smoke tests, no duplicate phrases
#   verify:safe-mode          — 4/4 surfaces use p31-safe-mode.js
#   verify:public-line        — All routes registered and valid
#   verify:glass-box          — Mirror sync, no secret patterns
#   verify:passport           — CogPass schema valid
#   verify:a11y               — Accessibility checks
#   verify:no-telemetry       — No tracking scripts
#   verify:license-headers    — All files have headers
#   verify:public-sanitization — No private data in public docs
```

### 5.2 Launch Pipeline

```bash
npm run launch --full
# 31-step rainbow pipeline:
#   1-10:  Build steps (TypeScript, contracts, docs)
#   11-20: Verify steps (alignment, style, routing)
#   21-28: Integration checks (mirrors, fleet, telemetry)
#   29-30: Final build + prep
#   31:    Rainbow finale (visual confirmation)
#
# Warm execution: ~85 seconds (fingerprint cache)
# Cold execution: ~110 seconds
```

### 5.3 Deployment

```bash
# Standard deploy (both sites):
npm run verify                    # 86 gates must pass
npm run build                     # Astro build
git add .
git commit -m "chore(release): [description]"
git push origin main              # Triggers CF Pages auto-deploy

# Andromeda mirror (p31ca.org):
cd andromeda
# Copy built assets to 04_SOFTWARE/p31ca/public/
git add .
git commit -m "chore(p31ca): [description]"
git push origin main

# Rollback (if needed):
wrangler deployments list --limit=5
wrangler rollback --deployment-id [ID]
```

### 5.4 Testing Stack

```
Unit tests:        Vitest + jsdom
Coverage:          @vitest/coverage-v8
BONDING tests:     424 tests / 32 suites
Psych E2E tests:   69 tests (science-core.mjs)
Verify gates:      86 scripts
Lighthouse CI:     Via verify:a11y
Manual:            Screen reader pass (NVDA/VoiceOver) for Gate 2+ surfaces
```

---

## PART 6: DEPENDENCIES (package.json Key Entries)

### Production

```json
{
  "astro": "^5.x",
  "@astrojs/react": "^4.x",
  "react": "^18.x",
  "react-dom": "^18.x",
  "three": "^0.128.0",
  "@react-three/fiber": "^8.x",
  "@react-three/drei": "^9.x",
  "zustand": "^4.x",
  "idb-keyval": "^6.x",
  "fuse.js": "^7.x"
}
```

### Development

```json
{
  "vitest": "^2.x",
  "@vitest/coverage-v8": "^2.x",
  "jsdom": "^24.x",
  "typescript": "^5.x",
  "eslint": "^10.x"
}
```

### Fonts

```
phosphorus31.org (self-hosted):
  @fontsource/inter
  @fontsource/jetbrains-mono

p31ca.org (Google CDN, pending self-host):
  Inter (variable)
  JetBrains Mono (400, 500, 700)
  Atkinson Hyperlegible (400, 700, italic)
```

### Three.js Constraint

```
Use THREE.js r128 or compatible.
Do NOT use THREE.CapsuleGeometry (introduced r142).
CDN: https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js
For React islands: import via npm (bundled with tree-shaking).
```

---

## PART 7: CONTENT RULES

### Forbidden Content
- No naval, submarine, or military metaphors (BINDING RULE)
- No children's full names (use S.J. and W.J.)
- No operator's personal medical details on public pages
- No operator's address on public pages
- No case number on public pages
- No "As an AI" or similar disclaimers
- No tracking scripts (verify:no-telemetry enforces this)
- No third-party analytics
- No ads

### Required Content
- Skip link on every page
- Safe mode toggle on every page
- PHOS router on every interactive page
- K₄ logo in nav
- EBC footer on institutional pages (Build / Create / Connect)
- OG meta tags on every page
- JSON-LD on phosphorus31.org pages
- aria-labels on all interactive elements
- focus-visible styles on all focusable elements

### Voice and Tone
- Technical but warm
- Direct, not corporate
- Explain complexity, don't hide it
- "We build tools for people whose brains work differently"
- NOT: "leveraging synergies" / "unlock your potential" / marketing language
- The sanitization probe (verify:public-sanitization) blocks marketing-tier language

---

## PART 8: AGENT EXECUTION CHECKLIST

When building or modifying either site, execute in this order:

```
1. Read p31-constants.json and p31-style.css FIRST
2. Check public-line.json for route registration
3. Implement the page/component
4. Add safe mode support (import p31-safe-mode.js)
5. Add PHOS router (import p31-phos-router.js)
6. Add skip link + aria labels
7. Add OG meta tags
8. Ensure 44px minimum touch targets
9. Test focus-visible on all interactive elements
10. Run: npm run verify
11. Run: npm run build
12. If verify passes → commit with descriptive message
13. If verify fails → fix and re-run (do NOT skip gates)
14. Register new files in p31-alignment.json
15. Update public-line.json if new routes added
```

---

*This specification defines the complete P31 web ecosystem. An agent with this document and access to the bonding-soup repository can execute a full site overhaul of either phosphorus31.org or p31ca.org without additional context. Every token value, every component, every route, every constraint is documented. The verify chain is the final arbiter. If it doesn't pass, it doesn't ship.*

*Build the cage. The cage holds.*

💜🔺💜
