# P31ca.org Design Specification v1.0
**For Template Generation** | P31 Labs, Inc. | Generated 2026-05-03

---

## 1. SITE ARCHITECTURE & FLOWCHART

### 1.1 Navigation Structure

```
ENTRY POINTS
├── / (Hub/Index) ────────┬── Live surfaces grid
│                         ├── Product filter (LIVE/BUILDING/HARDWARE/RESEARCH/TOOL)
│                         ├── Whitepapers section
│                         └── EBC Footer (Build/Create/Connect)
│
├── /phos ────────────────┬── Voice-first navigation wrapper (NEW)
│                         ├── Greeting → Intent question
│                         ├── 3 Choice cards (Self/Family/Pro)
│                         └── Voice input option
│
├── /welcome ─────────────┬── Threshold onboarding
│                         ├── PHOS chips mount (inference-based)
│                         └── Quick links
│
└── /mesh-start ──────────┬── Authentication entry
                          └── K4 personal mesh onboarding

LIVE SURFACES (18 Public)
├── /passport ──────────── Cognitive Passport generator
├── /lab ───────────────── Tools directory/explorer  
├── /glass-box ─────────── Transparency terminal
├── /dome ──────────────── K4 cockpit (Three.js)
├── /welcome ───────────── Family onboarding
├── /bonding ───────────── Molecular protocol (external)
├── /ops ───────────────── Operator shell (G.O.D.)
├── /delta.html ────────── Wye→Delta story
├── /connect.html ─────── K4 navigator
├── /demos ─────────────── Visual demos gallery
├── /doc-library ───────── Searchable documentation
├── /fleet-portal.html ─── Fleet URL index
├── /geodesic-math ─────── Icosahedron math
├── /planetary-onboard ─── Threshold onboarding
├── /geodesic.html ─────── Campaign page
├── /tomography.html ───── Larmor ring viz
├── /initial-build.html ── Build tracker
└── /mesh-start ────────── Mesh entry

PRODUCT PAGES (*-about.html)
├── 33 live product about pages
├── Registry-driven from scripts/hub/registry.mjs
└── Auto-generated via generate-about-pages.mjs

ARCHIVED (concept/draft status)
├── 162 files in public/archive/2025-early/
├── Not linked from navigation
└── 321 broken link warnings (acceptable)
```

### 1.2 User Flow Diagram

```
[Entry: /phos or /welcome]
         │
         ▼
[GREETING] ──────800ms──────▶ [INTENT QUESTION]
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
              [SELF]              [FAMILY]             [PRO]
                 │                    │                   │
                 ▼                    ▼                   ▼
           /passport               /lab            /glass-box
                 │                    │                   │
                 └────────────────────┼───────────────────┘
                                      ▼
                           [PHOS Content Mount]
                                      │
                         ┌───────────┴───────────┐
                         ▼                       ▼
                   [Navigation]            [Safe Mode Trigger]
                         │                       │
                         ▼                       ▼
                    PHOS Footer         Gray Rock Interface
```

---

## 2. DESIGN SYSTEM & STYLE SHEETS

### 2.1 Color Palette (Universal Canon)

**Hub Theme (Default Dark)**
```css
--p31-void: #0f1115;           /* Deep void - page background */
--p31-surface: #161920;        /* Cards, panels */
--p31-surface2: #1c2028;      /* Elevated surfaces */
--p31-coral: #cc6247;         /* CTAs, warnings, accent */
--p31-teal: #25897d;          /* Links, interactive */
--p31-cyan: #4db8a8;          /* Highlights, focus states */
--p31-cloud: #d8d6d0;         /* Primary text */
--p31-butter: #cda852;        /* Warm accents, prototyping */
--p31-lavender: #8b7cc9;      /* Hub-specific, secondary */
--p31-phosphorus: #3ba372;    /* Success, live status */
--p31-muted: #6b7280;         /* Secondary text */
--p31-border-subtle: rgba(255, 255, 255, 0.06);
--p31-glass-surface: rgba(255, 255, 255, 0.04);
--p31-glass-border: rgba(255, 255, 255, 0.08);
```

**Org Theme (Light Mode - phosphorus31.org)**
```css
--p31-void: #f5f4f0;          /* Cream background */
--p31-surface: #ffffff;       /* White cards */
--p31-surface2: #ebeae4;      /* Subtle elevation */
--p31-cloud: #1e293b;         /* Dark text */
--p31-muted: #64748b;         /* Secondary text */
--p31-border-subtle: rgba(15, 23, 42, 0.09);
```

### 2.2 Typography Scale

```css
--p31-font-sans: "Atkinson Hyperlegible", system-ui, sans-serif;
--p31-font-mono: "JetBrains Mono", monospace;

/* Scale */
--p31-text-xs: 0.75rem;       /* 12px - Captions, labels */
--p31-text-sm: 0.875rem;      /* 14px - Body small, navigation */
--p31-text-base: 1rem;        /* 16px - Body */
--p31-text-md: 1.0625rem;     /* 17px - Slightly emphasized */
--p31-text-lg: 1.125rem;      /* 18px - Lead text */
--p31-text-xl: 1.25rem;       /* 20px - Subheadings */
--p31-text-2xl: 1.5rem;       /* 24px - Section headings */
--p31-text-3xl: 1.875rem;     /* 30px - Major headings */
--p31-text-4xl: 2.25rem;      /* 36px - Hero text */

/* Line Heights */
--p31-leading-tight: 1.25;     /* Headings, buttons */
--p31-leading-snug: 1.4;       /* Navigation, chips */
--p31-leading-normal: 1.6;   /* Body text */
--p31-leading-relaxed: 1.75; /* Long-form reading */

/* Letter Spacing */
--p31-tracking-tight: -0.02em;   /* Headlines */
--p31-tracking-normal: 0;         /* Body */
--p31-tracking-wide: 0.08em;    /* Labels */
--p31-tracking-caps: 0.12em;     /* All-caps, mono */
```

### 2.3 Spacing Scale

```css
--p31-space-1: 0.25rem;   /* 4px  */
--p31-space-2: 0.5rem;  /* 8px  */
--p31-space-3: 0.75rem; /* 12px */
--p31-space-4: 1rem;    /* 16px */
--p31-space-5: 1.25rem; /* 20px */
--p31-space-6: 1.5rem;  /* 24px */
--p31-space-8: 2rem;    /* 32px */
--p31-space-10: 2.5rem; /* 40px */
--p31-space-12: 3rem;   /* 48px */
--p31-space-16: 4rem;   /* 64px */
```

### 2.4 Border Radius

```css
--p31-radius-sm: 4px;       /* Buttons, inputs */
--p31-radius-md: 8px;       /* Cards, panels */
--p31-radius-lg: 12px;      /* Larger cards */
--p31-radius-xl: 16px;      /* Modals, dialogs */
--p31-radius-2xl: 1.25rem;  /* Hero cards */
--p31-radius-full: 9999px;  /* Pills, avatars */
```

### 2.5 Shadows & Elevation

```css
--p31-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.06);
--p31-shadow-md: 0 4px 14px rgba(0, 0, 0, 0.08);
--p31-shadow-lg: 0 12px 40px rgba(0, 0, 0, 0.12);
--p31-shadow-glowTeal: 0 0 24px rgba(37, 137, 125, 0.25);

/* Glass Panel Pattern */
.glass-panel {
  background: color-mix(in srgb, var(--p31-surface2) 78%, transparent);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--p31-glass-border);
}
```

### 2.6 Animation Timing

```css
--p31-duration-instant: 100ms;   /* Micro-interactions */
--p31-duration-fast: 150ms;      /* Hover, focus */
--p31-duration-normal: 250ms;    /* Transitions */
--p31-duration-slow: 400ms;      /* Page transitions */
--p31-duration-glacial: 800ms;   /* Hero reveals */

--p31-ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
--p31-ease-emphasized: cubic-bezier(0.2, 0, 0, 1);
--p31-ease-decelerate: cubic-bezier(0, 0, 0.2, 1);
```

### 2.7 Z-Index Scale

```css
--p31-z-base: 0;
--p31-z-dropdown: 50;
--p31-z-sticky: 100;
--p31-z-overlay: 200;
--p31-z-modal: 300;
--p31-z-toast: 400;
```

### 2.8 Focus States (Accessibility)

```css
--p31-focus-ring: 2px;
--p31-focus-offset: 2px;
--p31-focus-color-hub: rgba(77, 184, 168, 0.55);

/* Focus visible pattern */
:focus-visible {
  outline: var(--p31-focus-ring) solid var(--p31-focus-color-hub);
  outline-offset: var(--p31-focus-offset);
}
```

---

## 3. PAGE LAYOUT SPECIFICATIONS

### 3.1 PHOS Wrapper (/phos.html)

**Purpose:** Voice-first navigation shell — the entry point for intent-based routing.

**Layout Structure:**
```
┌─────────────────────────────────────────┐
│  [P31 Logo]              [Safe Mode]    │  ← Header (fixed)
├─────────────────────────────────────────┤
│                                         │
│         Hello.                          │  ← Greeting (800ms)
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Whose mesh are we building today?      │  ← Question (persistent)
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ 🙋  For Myself                  │    │
│  │     Passport, sovereign tools → │    │  ← Choice Card 1
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ 🏠  For My Family               │    │
│  │     Bonding, coordination    →  │    │  ← Choice Card 2
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ 💼  I'm a Professional          │    │
│  │     Research, documentation →   │    │  ← Choice Card 3
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │        [🔴]                   │    │  ← Voice Button
│  │   Or just speak               │    │
│  │   "I need help with my IEP"   │    │
│  └─────────────────────────────────┘    │
│                                         │
│  "I need help..." → For My Family       │  ← Transcript (live)
│                                         │
├─────────────────────────────────────────┤
│  P31 Labs · Hub · Welcome               │  ← Footer
└─────────────────────────────────────────┘
```

**Specifications:**
- **Container:** max-width: 600px, centered, padding: 1.5rem
- **Background:** #0b0d10 (clean void, NO grid pattern)
- **Header:** Logo left (36px mark), Safe Mode button right
- **Greeting:** Auto-advances after 800ms, fade out
- **Question:** 1.5-2rem font, font-weight: 400
- **Choice Cards:** 
  - Full width, stacked vertically
  - Padding: 1.25rem 1.5rem
  - Border: 1px solid rgba(255,255,255,0.12)
  - Border-radius: 12px
  - Background: rgba(255,255,255,0.03)
  - Hover: translateY(-2px), border-color: teal
  - Icon: 1.75rem left
  - Label: 1.1rem, font-weight: 600
  - Hint: 0.85rem, monospace, muted color
  - Arrow: right side, opacity 0.4 → 0.8 on hover
- **Voice Section:** 
  - Dashed border box
  - 64px circular button
  - "Or just speak" label
  - Example hint in italics
- **Safe Mode:** 
  - Trigger: URL ?safe=1 or ?urgent=1, or button click
  - Removes all animations
  - Simplified navigation
  - High contrast

### 3.2 Hub Landing Page (/index.astro)

**Purpose:** Main entry point — product catalog, research papers, navigation.

**Layout Structure:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ [P31]  Instruments ▾   [Context] [Dome] [Demos] [Glass] [Journey] [Ops] │  ← Nav
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                    [K4 Tetrahedron SVG]                                 │
│                                                                         │
│                       P31 Labs                                          │
│          Open-source assistive technology                             │
│              Rooms · Full catalog · Dome                              │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ BONDING              Cognitive Passport      Dome / Cockpit     │  │
│  │ Known molecular...   8 profiles...           16 face nodes...   │  │
│  │ [Live]               [Live]                  [Live]             │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                         ↑ Lobby Doors (6 cards)                       │
├─────────────────────────────────────────────────────────────────────────┤
│  ──────────────── Priority ─────────────────                           │
│  ┌─────────────────────┐  ┌─────────────────────┐                       │
│  │ /ops Operator Shell │  │ Why a mesh?         │                       │
│  │ G.O.D. — glass...   │  │ Wye→Delta story...  │                       │
│  │ [Open /ops →]       │  │ [Wye → Delta]       │                       │
│  └─────────────────────┘  └─────────────────────┘                       │
├─────────────────────────────────────────────────────────────────────────┤
│  Filter: [All] [LIVE] [BUILDING] [HARDWARE] [RESEARCH] [TOOL]          │
│                                                                         │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐                        │
│  │ BONDING    │ │ MOLECULES   │ │ EDE        │                        │
│  │ [LIVE]     │ │ [BUILDING]  │ │ [LIVE]     │  ← Product Grid        │
│  │ ...        │ │ ...         │ │ ...        │                        │
│  └────────────┘ └────────────┘ └────────────┘                        │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  ─────────────── Whitepapers ───────────────                          │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ Paper title...                                      DOI: xxx   │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  EDE · ship bar              Local: npm run command-center            │
├─────────────────────────────────────────────────────────────────────────┤
│  P31 Labs, Inc.  Manifesto · Roadmap · CoC · Status · ... /dome       │  ← Footer
│  GitHub · ORCID · Ko-fi · phosphorus31.org                            │
├─────────────────────────────────────────────────────────────────────────┤
│ [Build]      [Create]      [Connect]                                  │  ← EBC Rail
└─────────────────────────────────────────────────────────────────────────┘
```

**Key Specifications:**
- **Navigation:** Fixed top, glass panel, backdrop-blur
- **Hero:** Centered K4 SVG (120px), Playfair Display italic for "P31 Labs"
- **Lobby Doors:** 6 large tap targets, border-left accent color
- **Product Grid:** Filterable, status badges, tech tags
- **Filter Bar:** Horizontal pill buttons, aria-pressed states
- **Research Section:** DOI links, paper count meta
- **EBC Footer:** Fixed bottom (mobile) or inline (desktop), three columns

### 3.3 Welcome Page (/welcome.html)

**Purpose:** Family-friendly onboarding — threshold entry.

**Layout:**
```
┌─────────────────────────────────────────┐
│                                         │
│           [P31 Logo - 44px]           │
│                                         │
│   For every family figuring it out      │
│   as they go.                           │
│                                         │
│   Free tools that carry the context     │
│   for you — no account needed.          │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Create your context card     →  │   │  ← Primary CTA
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ Explore the tools            →  │   │  ← Secondary CTA
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ See what's live              →  │   │  ← Tertiary CTA
│  └─────────────────────────────────┘   │
│                                         │
│  Context card →  Lab →  Glass Box →     │  ← Quick links
│  Join mesh →  EDE →                     │
│                                         │
│  Free · No login · No tracking          │
│  Georgia nonprofit · EIN 42-1888158     │
│                                         │
└─────────────────────────────────────────┘
```

**Specifications:**
- **Container:** max-width: 26rem, centered
- **Logo:** 44px SVG with teal/coral/gold P31 mark
- **Headline:** clamp(1.45rem, 4.5vw, 1.75rem), font-weight: 700
- **Promise text:** 0.975rem, leading: 1.65
- **Primary CTA:** 
  - Background: --p31-teal
  - Min-height: 3rem
  - Border-radius: 0.65rem
  - Full width
- **Secondary CTAs:** 
  - Background: rgba(255,255,255,0.04)
  - Border: 1px solid rgba(255,255,255,0.12)
- **Quick links:** Inline, monospace, teal color

### 3.4 Operator Shell (/ops/index.astro)

**Purpose:** Technical dashboard for operators.

**Layout:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ CWP-P31-UI-2026-01                    [Calm] [Standard] [Deep] [Focus]   │
├─────────────────────────────────────────────────────────────────────────┤
│ ● System pulse: k4-personal · 200 · orchestrator · 200                 │
├─────────────────────────────────────────────────────────────────────────┤
│ G.O.D. — operator shell                                                 │
│ Grounded Operator Deck                                                  │
├─────────────────────────────────────────────────────────────────────────┤
│ Local + lattice (never leave the stack)                                 │
│ [Local command center] [G.O.D. edge] [andromeda]                        │
├─────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│ │ Cognitive    │ │ K4           │ │ Orchestrator │ │ Lab          │    │
│ │ passport     │ │ navigator    │ │              │ │              │    │
│ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘    │
├─────────────────────────────────────────────────────────────────────────┤
│ Glass box (read-only GETs)                                              │
│ ┌──────────┬──────────┬───────┬──────┬───────┬────────────────────────┐  │
│ │ Id       │ Group    │ Level │ HTTP │ ms   │ URL                    │  │
│ ├──────────┼──────────┼───────┼──────┼───────┼────────────────────────┤  │
│ │ ...      │ ...      │ ...   │ ...  │ ...  │ ...                    │  │
│ └──────────┴──────────┴───────┴──────┴───────┴────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────┤
│ [⌂ Hub] [◇ Fleet] [◎ Orch] [✦ EPCP]                                    │  ← Thumb rail
└─────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Density modes:** Calm/Standard/Deep — affects spacing and font sizes
- **Focus mode:** Hides auxiliary content
- **Ambient strip:** Live status of edge services
- **Glass table:** Auto-refreshing probe results
- **Thumb rail:** Fixed bottom on mobile, 4 quick actions

### 3.5 About Pages (*-about.html)

**Purpose:** Product documentation — technical specs, features, how-to.

**Layout:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ [P31] P31 Labs                                        [Launch Product]   │
├─────────────────────────────────────────────────────────────────────────┤
│ STATUS · Product                                                        │
│                                                                         │
│ [Icon]  Product Name                                                    │
│         Tagline goes here                                               │
│         [LIVE] [tag1] [tag2] [tag3]                                     │
│                                                                         │
│ [⛌ Launch Product]                                                      │
├─────────────────────────────────────────────────────────────────────────┤
│ ─────────────── What it is ───────────────                              │
│ Description text explaining the product purpose...                      │
│                                                                         │
│ ─────────────── Core features ───────────────                           │
│ ● Feature one                                                           │
│ ● Feature two                                                           │
│ ● Feature three                                                         │
│                                                                         │
│ ─────────────── How to use ───────────────                              │
│ 1. Step one                                                             │
│ 2. Step two                                                             │
│ 3. Step three                                                           │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                        │
│ │ Status      │ │ Tech stack  │ │ Links       │                        │
│ │ [LIVE]      │ │ • Item      │ │ Launch      │  ← Sidebar             │
│ │ ...         │ │ • Item      │ │ Source      │                        │
│ └─────────────┘ └─────────────┘ └─────────────┘                        │
├─────────────────────────────────────────────────────────────────────────┤
│ [Build]      [Create]      [Connect]                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Two-column layout:** Content left (70%), sidebar right (30%)
- **Sticky sidebar:** top: 88px
- **Status badge:** Color-coded by status (live=phosphorus, research=cyan, hardware=butter)
- **Feature mesh:** Vertical timeline with colored nodes
- **Tech stack:** Monospace list with bullet markers
- **EBC Footer:** Fixed bottom

---

## 4. COMPONENT LIBRARY

### 4.1 Buttons

**Primary Button:**
```css
.btn-primary {
  background: color-mix(in srgb, var(--p31-teal) 88%, transparent);
  border: 1px solid color-mix(in srgb, var(--p31-teal) 45%, transparent);
  color: var(--p31-cloud);
  font-weight: 700;
  min-height: 3rem;
  padding: 0.6rem 1.25rem;
  border-radius: 0.65rem;
  transition: filter 140ms ease;
}
.btn-primary:hover {
  filter: brightness(1.07);
}
```

**Secondary Button:**
```css
.btn-secondary {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: var(--p31-cloud);
  min-height: 2.85rem;
  padding: 0.6rem 1.25rem;
  border-radius: 0.65rem;
  transition: all 140ms ease;
}
.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}
```

**Safe Mode Button:**
```css
.btn-safe {
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(255, 100, 100, 0.3);
  border-radius: 6px;
  background: rgba(255, 100, 100, 0.08);
  color: #ff8080;
  font-family: var(--p31-font-mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

### 4.2 Cards

**Product Card:**
```css
.product-card {
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  transition: all 200ms ease;
}
.product-card:hover {
  transform: translateY(-4px);
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 0 16px 44px rgba(0, 0, 0, 0.3);
}
```

**Choice Card (PHOS):**
```css
.choice-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  transition: all 200ms ease;
}
.choice-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(37, 137, 125, 0.5);
  transform: translateY(-2px);
}
```

### 4.3 Status Badges

```css
.badge-live {
  background: color-mix(in srgb, var(--p31-phosphorus) 12%, transparent);
  color: var(--p31-phosphorus);
  border: 1px solid color-mix(in srgb, var(--p31-phosphorus) 30%, transparent);
}

.badge-research {
  background: color-mix(in srgb, var(--p31-cyan) 12%, transparent);
  color: var(--p31-cyan);
  border: 1px solid color-mix(in srgb, var(--p31-cyan) 30%, transparent);
}

.badge-hardware {
  background: color-mix(in srgb, var(--p31-butter) 12%, transparent);
  color: var(--p31-butter);
  border: 1px solid color-mix(in srgb, var(--p31-butter) 30%, transparent);
}
```

### 4.4 Navigation Patterns

**Hub Navigation:**
- Fixed position, z-index: 50
- Glass panel background with backdrop-blur
- Left: Logo + Instruments dropdown
- Right: Context Card, Dome, Demos, Glass, Journey, Ops, Authenticate

**Footer Navigation (EBC):**
- Fixed bottom on mobile
- Three columns: Build / Create / Connect
- Links to /build, /geodesic.html, /mesh

**Thumb Rail (Mobile):**
- Fixed bottom, z-index: 40
- 4 icons: Hub, Fleet, Orchestrator, EPCP
- Touch-optimized (min 3.4rem height)

---

## 5. INTERACTION PATTERNS

### 5.1 Voice Input

**States:**
1. **Idle:** Microphone icon, dashed border
2. **Listening:** Red pulsing ring, "Listening..." text
3. **Processing:** Transcript appears, matching intent
4. **Matched:** Intent highlighted, auto-navigate after 800ms

**Error Handling:**
- "Didn't catch that. Try again?"
- Suggest specific phrases: "myself", "family", "professional"

### 5.2 Safe Mode (Gray Rock)

**Triggers:**
- URL parameter: `?safe=1`, `?urgent=1`, `?crisis=1`
- Button click: "Safe Mode" header button
- Voice input: Crisis words detected

**Effects:**
- Background: #050505 (near black)
- All animations disabled
- Minimal UI: 3 large buttons only
- No decorative elements
- High contrast text

### 5.3 Page Transitions

**PHOS Routing:**
1. User selects choice
2. Show routing spinner: "Calibrating to [destination]..."
3. 800ms delay for cognitive pacing
4. Navigate to destination

**Content Loading:**
- Fade in: 500ms ease-out
- Loading placeholder during fetch
- Error state with retry option

---

## 6. ACCESSIBILITY REQUIREMENTS

### 6.1 Essential Checklist

- [ ] All interactive elements have focus states
- [ ] Color contrast ratio ≥ 4.5:1 for text
- [ ] Focus order matches visual order
- [ ] Skip links present for keyboard users
- [ ] Reduced motion respected (`prefers-reduced-motion`)
- [ ] Voice input alternative always available
- [ ] Screen reader announcements for dynamic content

### 6.2 ARIA Patterns

```html
<!-- Choice cards -->
<a href="/passport" class="choice-card" aria-label="For Myself - Cognitive passport and sovereign tools">

<!-- Voice button -->
<button aria-label="Speak to navigate" aria-pressed="false">

<!-- Status live region -->
<div aria-live="polite" aria-atomic="true">
  <!-- Dynamic content updates here -->
</div>
```

### 6.3 Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Move between interactive elements |
| Enter/Space | Activate button or link |
| Escape | Exit safe mode (if held 2 seconds) |
| Arrow keys | Navigate choice cards |

---

## 7. RESPONSIVE BREAKPOINTS

```css
/* Mobile First */
/* Base: < 640px */

/* sm: 640px */
@media (min-width: 640px) { }

/* md: 768px */
@media (min-width: 768px) { }

/* lg: 1024px */
@media (min-width: 1024px) {
  /* Hub grid: 3 columns */
  /* Two-column about layout */
}

/* xl: 1280px */
@media (min-width: 1280px) { }

/* 2xl: 1536px */
@media (min-width: 1536px) { }
```

---

## 8. ASSETS & RESOURCES

### 8.1 Fonts (Google Fonts)

```html
<link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
```

### 8.2 Icons

- Emoji for PHOS choice cards (🙋 🏠 💼)
- SVG for K4 tetrahedron (hub landing)
- Lucide icons (optional, if needed)

### 8.3 External Libraries

- **Three.js:** /dome, tomography (r183)
- **p31-style.css:** Universal design tokens
- **No frameworks:** Vanilla JS for PHOS

---

## 9. FILE STRUCTURE

```
public/
├── phos.html                 # PHOS navigation wrapper
├── welcome.html              # Family onboarding
├── index.html                # Hub landing (Astro builds this)
├── p31-style.css             # Universal design tokens
├── lib/
│   ├── p31-phos-core.mjs     # PHOS inference engine
│   ├── p31-phos-ui.mjs       # PHOS UI components
│   └── p31-subject-prefs.js  # Cognitive preferences
├── *-about.html              # 33 product about pages
└── archive/2025-early/       # 162 archived files
```

---

## 10. PRODUCTION GATES

### 10.1 Public Line Requirements

Before any page ships to public:

1. **Link validation:** No broken internal links
2. **Console zero:** No JavaScript errors
3. **Lighthouse:** Performance ≥ 90, Accessibility = 100
4. **PHOS integration:** Must use PHOS wrapper or link to it
5. **Metadata:** Open Graph tags, canonical URLs
6. **Mobile:** Responsive at all breakpoints
7. **Accessibility:** Passes axe-core audit

### 10.2 Verification Commands

```bash
# Check all gates
npm run release:check

# Build and verify
npm run hub:ci

# Internal link check
npm run verify:internal-hub-links
```

---

**END OF SPECIFICATION**

For questions: docs/P31-ENGINEERING-STANDARD.md
Last updated: 2026-05-03
