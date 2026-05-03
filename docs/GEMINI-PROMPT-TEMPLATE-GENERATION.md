# Gemini Pro Prompt: P31ca.org Template Generation
**Date:** 2026-05-03  
**Project:** P31 Labs — Open-source assistive technology for neurodivergent individuals  
**Mission:** Build, Create, Connect  

---

## ROLE DEFINITION

You are a senior UI/UX engineer specializing in accessible, neurodivergent-friendly web interfaces. You write production-quality HTML, CSS, and vanilla JavaScript. You prioritize clarity over cleverness, accessibility over aesthetics, and function over flourish.

You are implementing the P31ca.org design system — a "quantum material" interface that adapts to cognitive needs. Every component must work in "Gray Rock" mode (minimal stimulation) first, then layer on enhancements.

---

## PROJECT CONTEXT

### Operator Profile (The User We Serve)
- **Primary audience:** Neurodivergent individuals (AuDHD, autism, ADHD, anxiety)
- **Secondary:** Parents, professionals, clinicians supporting neurodivergent people
- **Key need:** Interfaces that don't overwhelm, that carry context, that require no explanation
- **Spoon theory:** Users may have limited cognitive energy; every interaction should be frictionless

### Design Philosophy
1. **Gray Rock First:** Everything starts inert. No motion, no glow, no sound until user engages.
2. **Progressive Disclosure:** Show only what's needed. The PHOS wrapper asks "Whose mesh are we building today?" — not 20 menu options.
3. **Voice-First:** Users can speak their intent. No hunting through navigation.
4. **Safe Mode:** One click/tap removes all stimulation — high contrast, no animation, minimal UI.
5. **Never Dark Pattern:** No engagement hacking, no notifications, no "growth" tricks.

---

## DESIGN SYSTEM SPECIFICATION

### Color Palette (Hub Theme — Dark Default)

```css
/* Core tokens */
--p31-void: #0f1115;           /* Page background */
--p31-surface: #161920;        /* Cards, panels */
--p31-surface2: #1c2028;       /* Elevated surfaces */
--p31-coral: #cc6247;          /* CTAs, warmth, accent */
--p31-teal: #25897d;           /* Links, trust, primary actions */
--p31-cyan: #4db8a8;           /* Highlights, focus states */
--p31-cloud: #d8d6d0;          /* Primary text */
--p31-butter: #cda852;         /* Soft attention, prototyping */
--p31-lavender: #8b7cc9;       /* Wonder, depth, secondary */
--p31-phosphorus: #3ba372;     /* Success, live status, belonging */
--p31-muted: #6b7280;          /* Secondary text */
--p31-border-subtle: rgba(255, 255, 255, 0.06);
--p31-glass-surface: rgba(255, 255, 255, 0.04);
```

### Typography

```css
--p31-font-sans: "Atkinson Hyperlegible", system-ui, sans-serif;
--p31-font-mono: "JetBrains Mono", monospace;

/* Scale */
--p31-text-xs: 0.75rem;        /* 12px - captions */
--p31-text-sm: 0.875rem;       /* 14px - body small */
--p31-text-base: 1rem;         /* 16px - body */
--p31-text-lg: 1.125rem;       /* 18px - lead */
--p31-text-xl: 1.25rem;        /* 20px - subheadings */
--p31-text-2xl: 1.5rem;        /* 24px - section headings */
--p31-text-3xl: 1.875rem;      /* 30px - major headings */
--p31-text-4xl: 2.25rem;       /* 36px - hero */

/* Line heights */
--p31-leading-tight: 1.25;     /* Headings, buttons */
--p31-leading-snug: 1.4;       /* Navigation */
--p31-leading-normal: 1.6;     /* Body text */
--p31-leading-relaxed: 1.75;   /* Long-form reading */
```

### Spacing

```css
--p31-space-1: 0.25rem;   /* 4px */
--p31-space-2: 0.5rem;    /* 8px */
--p31-space-3: 0.75rem;   /* 12px */
--p31-space-4: 1rem;      /* 16px */
--p31-space-5: 1.25rem;   /* 20px */
--p31-space-6: 1.5rem;    /* 24px */
--p31-space-8: 2rem;      /* 32px */
--p31-space-10: 2.5rem;   /* 40px */
--p31-space-12: 3rem;    /* 48px */
```

### Border Radius

```css
--p31-radius-sm: 4px;       /* Buttons, inputs */
--p31-radius-md: 8px;       /* Cards, panels */
--p31-radius-lg: 12px;      /* Larger cards */
--p31-radius-xl: 16px;      /* Modals */
--p31-radius-2xl: 1.25rem;  /* Hero cards */
--p31-radius-full: 9999px;  /* Pills, avatars */
```

### Shadows & Elevation

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

### Animations (Respect prefers-reduced-motion)

```css
--p31-duration-fast: 150ms;
--p31-duration-normal: 250ms;
--p31-duration-slow: 400ms;

--p31-ease-standard: cubic-bezier(0.4, 0, 0.2, 1);

/* Mandatory reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## COMPONENT LIBRARY

### 1. PHOS Choice Card (Primary Navigation Pattern)

**Use case:** The main navigation interface — users pick their intent.

**HTML Structure:**
```html
<a href="/destination" class="phos-choice" data-choice="self|family|pro">
  <span class="phos-choice-icon">🙋</span>
  <span class="phos-choice-text">
    <span class="phos-choice-label">For Myself</span>
    <span class="phos-choice-hint">Cognitive passport, sovereign tools</span>
  </span>
  <span class="phos-choice-arrow">→</span>
</a>
```

**CSS Specification:**
```css
.phos-choice {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  color: inherit;
  text-decoration: none;
  transition: all 200ms ease;
}

.phos-choice:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(37, 137, 125, 0.5);
  transform: translateY(-2px);
}

.phos-choice-icon {
  font-size: 1.75rem;
  flex-shrink: 0;
}

.phos-choice-label {
  display: block;
  font-size: 1.1rem;
  font-weight: 600;
}

.phos-choice-hint {
  display: block;
  font-size: 0.85rem;
  color: #888;
  font-family: var(--p31-font-mono);
}

.phos-choice-arrow {
  margin-left: auto;
  opacity: 0.4;
  transition: opacity 200ms ease;
}

.phos-choice:hover .phos-choice-arrow {
  opacity: 0.8;
}
```

### 2. Primary Button

```html
<button class="btn-primary">Create your context card →</button>
```

```css
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 3rem;
  padding: 0.6rem 1.25rem;
  border-radius: 0.65rem;
  background: color-mix(in srgb, var(--p31-teal) 88%, transparent);
  border: 1px solid color-mix(in srgb, var(--p31-teal) 45%, transparent);
  color: var(--p31-cloud);
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: filter 140ms ease;
  width: 100%;
}

.btn-primary:hover {
  filter: brightness(1.07);
}

.btn-primary:focus-visible {
  outline: 2px solid var(--p31-cyan);
  outline-offset: 2px;
}
```

### 3. Status Badges

```html
<span class="badge badge-live">LIVE</span>
<span class="badge badge-research">RESEARCH</span>
<span class="badge badge-hardware">HARDWARE</span>
```

```css
.badge {
  display: inline-flex;
  align-items: center;
  font-family: var(--p31-font-mono);
  font-size: 10px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 9999px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

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

### 4. Glass Panel Card

```html
<article class="glass-card">
  <h3>Product Name</h3>
  <p>Description text</p>
  <div class="glass-card__meta">
    <span class="badge badge-live">LIVE</span>
  </div>
</article>
```

```css
.glass-card {
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  background: color-mix(in srgb, var(--p31-surface2) 78%, transparent);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  transition: all 200ms ease;
}

.glass-card:hover {
  transform: translateY(-4px);
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 0 16px 44px rgba(0, 0, 0, 0.3);
}
```

### 5. Safe Mode Button

```html
<button class="btn-safe" aria-label="Enter safe mode">Safe Mode</button>
```

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
  cursor: pointer;
  transition: all 200ms ease;
}

.btn-safe:hover {
  background: rgba(255, 100, 100, 0.15);
  border-color: rgba(255, 100, 100, 0.5);
}
```

### 6. Voice Input Button

```html
<button class="voice-btn" aria-label="Speak to navigate" aria-pressed="false">
  <span class="voice-icon">🎤</span>
  <span class="voice-label">Or just speak</span>
</button>
```

```css
.voice-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);
  color: inherit;
  cursor: pointer;
  transition: all 200ms ease;
}

.voice-btn:hover {
  border-color: rgba(37, 137, 125, 0.4);
  background: rgba(37, 137, 125, 0.05);
}

.voice-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 2px solid rgba(37, 137, 125, 0.4);
  background: rgba(37, 137, 125, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.voice-btn.listening .voice-icon {
  border-color: rgba(204, 98, 71, 0.6);
  animation: pulse-ring 1.5s ease-out infinite;
}

@keyframes pulse-ring {
  0% { box-shadow: 0 0 0 0 rgba(204, 98, 71, 0.4); }
  100% { box-shadow: 0 0 0 20px rgba(204, 98, 71, 0); }
}

.voice-label {
  font-size: 0.8rem;
  color: #666;
  font-family: var(--p31-font-mono);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
```

---

## PAGE TEMPLATES TO GENERATE

### Template 1: PHOS Navigation Wrapper (`phos.html`)

**Purpose:** Voice-first entry point. Users say/click their intent.

**Layout:**
```
┌─────────────────────────────────────────┐
│ [P31 Logo]              [Safe Mode]     │  ← Header
├─────────────────────────────────────────┤
│                                         │
│  Whose mesh are we building today?      │  ← Question
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🙋  For Myself               →  │   │
│  │     Passport, tools              │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ 🏠  For My Family            →  │   │
│  │     Bonding, coordination        │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ 💼  I'm a Professional       →  │   │
│  │     Research, docs               │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │         [🎤]                   │   │
│  │    Or just speak                │   │
│  │    "I need help with..."         │   │
│  └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│  P31 Labs · Hub · Welcome               │  ← Footer
└─────────────────────────────────────────┘
```

**Requirements:**
- Clean void background (#0b0d10), NO grid pattern
- Auto-advance greeting (800ms) → question
- Three choice cards stacked vertically
- Voice button below cards
- Safe Mode button in header (triggers gray rock)
- All transitions respect prefers-reduced-motion
- Focus visible on all interactive elements

### Template 2: Welcome Page (`welcome.html`)

**Purpose:** Family-friendly onboarding. Warm, approachable.

**Layout:**
```
┌─────────────────────────────────────────┐
│                                         │
│           [P31 Logo]                    │
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
│  │ Explore the tools            →  │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ See what's live              →  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Context card →  Lab →  Glass Box →    │
│  Join mesh →  EDE →                     │
│                                         │
│  Free · No login · No tracking         │
│  Georgia nonprofit · EIN 42-1888158    │
│                                         │
└─────────────────────────────────────────┘
```

**Requirements:**
- Centered layout, max-width 26rem
- Logo: 44px SVG (P31 mark with teal/coral/gold)
- Primary CTA: teal background, full width
- Secondary CTAs: outlined style
- Quick links: inline, monospace, teal color
- Subtle ambient gradient (no grid)

### Template 3: Product About Page (`{product}-about.html`)

**Purpose:** Technical documentation for each product.

**Layout:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ [P31] P31 Labs                                        [Launch Product]   │
├─────────────────────────────────────────────────────────────────────────┤
│ STATUS · Product                                                        │
│                                                                         │
│ [Icon]  Product Name                                                    │
│         Tagline goes here                                               │
│         [LIVE] [tag1] [tag2]                                            │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│ ─────────────── What it is ───────────────                              │
│ Description text...                                                     │
│                                                                         │
│ ─────────────── Core features ───────────────                           │
│ ● Feature one                                                           │
│ ● Feature two                                                           │
│                                                                         │
│ ┌─────────────┐ ┌─────────────┐                                        │
│ │ Status      │ │ Tech stack  │                                        │
│ │ [LIVE]      │ │ • React     │  ← Sidebar (sticky)                    │
│ │ Deployed    │ │ • Three.js  │                                        │
│ └─────────────┘ └─────────────┘                                        │
├─────────────────────────────────────────────────────────────────────────┤
│ [Build]      [Create]      [Connect]                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

**Requirements:**
- Two-column layout: content (70%) + sidebar (30%)
- Sticky sidebar (top: 88px)
- Status badge color-coded by status
- Feature list with dot markers
- Tech stack: monospace list
- EBC footer fixed bottom

---

## CODING STANDARDS

### HTML Requirements
1. **Semantic elements:** `<header>`, `<main>`, `<footer>`, `<article>`, `<nav>`
2. **ARIA labels:** All interactive elements must have aria-label or visible text
3. **Focus management:** Skip link as first focusable element
4. **Language:** `lang="en"` on `<html>`
5. **Viewport:** `viewport-fit=cover` for mobile safe areas

### CSS Requirements
1. **Custom properties:** Use --p31-* tokens, never hardcode colors
2. **Color-mix():** For tonal variations (modern browser support)
3. **Reduced motion:** `@media (prefers-reduced-motion: reduce)` must disable animations
4. **Focus states:** `focus-visible` not `focus` (remove outlines on mouse click)
5. **No !important:** Except in reduced-motion media query
6. **Mobile-first:** Base styles for mobile, min-width media queries for larger

### JavaScript Requirements
1. **Vanilla JS:** No frameworks, no jQuery
2. **Progressive enhancement:** Page works without JS
3. **Event delegation:** For dynamic content
4. **LocalStorage:** Check for availability before using (try/catch)
5. **Speech API:** Check for `window.SpeechRecognition` before using

### Accessibility Checklist
- [ ] WCAG 2.1 AA compliant
- [ ] Color contrast ratio ≥ 4.5:1 for text
- [ ] Keyboard navigable (Tab order matches visual order)
- [ ] Screen reader tested
- [ ] Reduced motion respected
- [ ] No seizure-inducing flashes

---

## FILE STRUCTURE

```
public/
├── phos.html                    # PHOS navigation wrapper
├── welcome.html                 # Family onboarding
├── index.html                   # Hub landing (Astro)
├── p31-style.css                # Universal design tokens
├── lib/
│   ├── p31-phos-core.mjs        # PHOS inference engine
│   ├── p31-phos-ui.mjs          # PHOS UI components
│   └── p31-subject-prefs.js     # Cognitive preferences
└── *-about.html                 # Product pages (33 files)
```

---

## DELIVERABLES EXPECTED

For each template, provide:

1. **Complete HTML file** — Valid, semantic, accessible
2. **Embedded CSS** — In `<style>` or linked to p31-style.css
3. **Vanilla JS** — For interactivity (voice, state management)
4. **Responsive** — Works on 320px to 2560px widths
5. **Gray Rock support** — Test by adding `?alive=0` or pressing Safe Mode

---

## EXAMPLE: Voice Recognition Implementation

```javascript
class PHOSVoice {
  constructor(onResult, onError) {
    this.recognition = null;
    this.onResult = onResult;
    this.onError = onError;
    this.init();
  }
  
  init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported');
      return;
    }
    
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
    
    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      this.onResult(transcript);
    };
    
    this.recognition.onerror = (event) => {
      this.onError(event.error);
    };
  }
  
  start() {
    if (this.recognition) {
      this.recognition.start();
      return true;
    }
    return false;
  }
  
  stop() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }
}

// Usage
const voice = new PHOSVoice(
  (text) => console.log('Heard:', text),
  (err) => console.error('Voice error:', err)
);
```

---

## VERIFICATION CHECKLIST

Before submitting generated templates:

- [ ] All links point to valid destinations (or # for placeholders)
- [ ] Console shows zero errors
- [ ] Lighthouse accessibility score = 100
- [ ] Works in Firefox, Chrome, Safari
- [ ] Works on iPhone SE (375px) and iPad Pro (1024px)
- [ ] Respects `prefers-reduced-motion: reduce`
- [ ] Safe Mode removes all animations
- [ ] Voice button hidden if SpeechRecognition unavailable

---

## REFERENCE DOCUMENTS

- **Full spec:** `docs/P31CA-DESIGN-SPECIFICATION.md`
- **Quantum Material U:** `docs/P31-QUANTUM-MATERIAL-U.md`
- **Engineering standard:** `docs/P31-ENGINEERING-STANDARD.md`
- **Existing PHOS:** `andromeda/04_SOFTWARE/p31ca/public/phos.html`

---

## TASK

Generate the three templates specified above:
1. `phos.html` — PHOS navigation wrapper
2. `welcome.html` — Family onboarding
3. `product-about-template.html` — Reusable product page

Use the exact specifications provided. Prioritize accessibility, clarity, and the Gray Rock first principle. No external dependencies beyond Google Fonts and the p31-style.css token file.

**Output format:** Complete, self-contained HTML files with embedded CSS and JavaScript. Include comments explaining intent for complex sections.
