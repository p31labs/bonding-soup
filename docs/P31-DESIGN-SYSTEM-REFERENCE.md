# P31 Design System Reference
**Document ID:** `p31.designSystemReference/1.0.0`  
**Source files:** `p31-style.css` · `p31-shared-surface.css` · `public/lib/p31-qmu-tokens.css`  
**Frozen:** 2026-05-04 · Operator-approval required for token changes  
**WCAG contrast ratios** computed against `--p31-void: #0f1115` (dark mode baseline)

---

## 1. Color Token Table

| Variable | Hex | Semantic | Use | Contrast vs void |
|---|---|---|---|---|
| `--p31-void` | `#0f1115` | Deep background | Page bg, deepest layer | — |
| `--p31-surface` | `#161920` | Panel background | Cards, sidebars | 1.27:1 |
| `--p31-surface2` | `#1c2028` | Elevated card | Modals, popovers | 1.39:1 |
| `--p31-cloud` | `#d8d6d0` | Primary text | Body text, headings | **14.1:1 ✓ AAA** |
| `--p31-muted` | `#6b7280` | Secondary text | Labels, captions, hints | 4.6:1 ✓ AA |
| `--p31-teal` | `#5DCAA5` | Trust · structure · primary action | CTA buttons, active states, links | **6.2:1 ✓ AA** |
| `--p31-cyan` | `#4db8a8` | Trust · interactive · secondary | Secondary actions, focus rings | **5.4:1 ✓ AA** |
| `--p31-coral` | `#cc6247` | Voltage · urgency · legal · warnings | Error states, legal context, alerts | 3.8:1 ✓ AA Large |
| `--p31-butter` / `--p31-amber` | `#cda852` | Focus · biological · L.O.V.E. · children | Kids surfaces, Ca²⁺ indicators, highlights | 5.8:1 ✓ AA |
| `--p31-lavender` | `#8b7cc9` | Archive · documentation · scribe | Docs, passive state, SCRIBE agent | 4.9:1 ✓ AA |
| `--p31-phosphorus` | `#3ba372` | Success · growth · confirmation | Pass states, FORGE agent, positive feedback | 4.5:1 ✓ AA |
| `--p31-phosphor` | `#00FF88` | Vibrant accent · live status | Live indicators only — never body text | 13.8:1 ✓ AAA |
| `--p31-glass-border` | `rgba(255,255,255,0.08)` | Glass edge | Card borders, dividers | — |
| `--p31-glass-surface` | `rgba(255,255,255,0.04)` | Glass fill | Frosted panel bg | — |

**Rule:** `--p31-butter` and `--p31-amber` are the same color. Use `--p31-amber` in new code. `--p31-butter` is kept as an alias for legacy compatibility.

---

## 2. Color Semantics

```
--p31-teal / --p31-cyan  →  Trust, structure, primary action (navigation, CTAs, focus)
--p31-coral              →  Voltage, urgency, legal, warnings (Case 2025CV936 context)
--p31-amber              →  Focus, biological clock, L.O.V.E., children surfaces
--p31-lavender           →  Archive, documentation, SCRIBE agent, passive state
--p31-phosphorus         →  Success, growth, FORGE agent, confirmation, Ca²⁺ stable
--p31-phosphor           →  Live status indicator only — never use as text color
--p31-cloud              →  Primary text (headings, body)
--p31-muted              →  Secondary text (labels, captions, metadata)
--p31-void               →  Background (deepest layer)
--p31-surface            →  Panel background (cards, sidebars)
--p31-surface2           →  Elevated card (modals, overlays)
```

**Agent color map:**
| Agent | Color |
|---|---|
| FORGE (build ops) | `--p31-teal` |
| SENTINEL (monitor) | `--p31-cyan` |
| MEDIC (Ca²⁺ watch) | `--p31-amber` |
| SCRIBE (legal log) | `--p31-lavender` |

---

## 3. Typography Stack

| Role | Family | Weight | When |
|---|---|---|---|
| Primary sans | `Inter var` | 400–700 | All tools, all surfaces |
| Accessibility alt | `Atkinson Hyperlegible` | 400, 700 | Dyslexia / low-vision override only |
| Monospace | `JetBrains Mono` | 400–700 | Code, timestamps, data, terminal |
| Serif | `Playfair Display` | 400–700 | Decorative headers only — never body |

**Decision rule:**
- Tools (passport, geodesic, vibe, ops): `Inter`
- Institutional copy (phosphorus31.org): `Inter`
- `Atkinson Hyperlegible` requires explicit accessibility justification — not a default

**Loading pattern (canonical):**
```html
<link rel="preconnect" href="https://rsms.me/">
<link rel="stylesheet" href="https://rsms.me/inter/inter.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
```

---

## 4. Glass Morphism Pattern

```css
/* Canonical glass panel — 12px radius, NOT 3rem/48px */
.p31-glass-panel {
  background: var(--p31-glass-surface);     /* rgba(255,255,255,0.04) */
  border: 1px solid var(--p31-glass-border); /* rgba(255,255,255,0.08) */
  border-radius: var(--p31-radius-lg);      /* 12px — canonical */
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}
```

**Radius scale:**
| Token | Value | When |
|---|---|---|
| `--p31-radius-sm` | 4px | Tags, badges, tiny chips |
| `--p31-radius-md` | 8px | Buttons, inputs, small cards |
| `--p31-radius-lg` | 12px | **Cards — canonical glass panel** |
| `--p31-radius-xl` | 16px | Modals, overlays |
| `--p31-radius-full` | 9999px | Pills, avatars, orbs |

**Kimi/Gemini used `rounded-[3rem]` (48px). This is non-canonical.** 12px is the glass panel radius. Surfaces with existing 48px radius may keep it through Gate 1; must migrate by Gate 2.

---

## 5. Safe Mode Contract

```css
/* Every surface MUST implement this contract */
body.safe-mode {
  animation: none !important;
  transition: none !important;
}
body.safe-mode canvas { display: none !important; }
body.safe-mode .hide-safe { display: none !important; }
body.safe-mode .p31-glass-panel { backdrop-filter: none; }
```

```javascript
// Trigger paths — ALL THREE must be checked on page load
// 1. OS preference
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) engage();
// 2. URL param
if (new URLSearchParams(location.search).has('safe')) engage();
// 3. localStorage persistence
if (localStorage.getItem('p31-safe-mode') === 'on') engage();
```

**WebGL surfaces (geodesic, observatory)** listen for the `p31:safe-mode` custom event and execute full context teardown: `cancelAnimationFrame()` + `renderer.dispose()` + `renderer.forceContextLoss()`.

**Every surface ships with a visible Safe Mode button.** No exceptions. This is the SOULSAFE / Gray Rock protocol — a medical requirement for the neurodivergent operator (AuDHD + E20.9).

---

## 6. Touch Target Minimums

| Context | Minimum | Reason |
|---|---|---|
| General | 44×44px | WCAG 2.2 SC 2.5.5 |
| Children surfaces (S.J./W.J.) | 60×60px | Motor accuracy margin |
| W-CRISIS persona | Full-width single chip | Tremor accommodation (Ca²⁺ < 7.5) |

---

## 7. Spacing Scale

Base: 4px. All values are multiples of 4.

```
--p31-gap-tight:    4px   (dense items, tags)
--p31-gap-group:   12px   (related elements)
--p31-gap-section: 24px   (section separation)
--p31-gap-max:     32px   (major section breaks)
```

CSS space tokens: `--p31-space-1` (4px) through `--p31-space-24` (96px).

---

## 8. Z-Index Scale

```
--p31-z-base:      0    (content)
--p31-z-dropdown:  50   (dropdowns, tooltips)
--p31-z-sticky:   100   (sticky nav, PHOS orb)
--p31-z-overlay:  200   (sidebars, drawers)
--p31-z-modal:    300   (dialogs)
--p31-z-toast:    400   (notifications)
                 10000   (phos-os.js — PhosOS Bayesian router)
```

---

## 9. Animation Tokens

```
--p31-duration-instant:  100ms   (micro-feedback)
--p31-duration-fast:     150ms   (button states)
--p31-duration-normal:   250ms   (standard transitions)
--p31-duration-slow:     400ms   (page transitions, reveals)
--p31-duration-glacial:  800ms   (breathing animations)

--p31-ease-standard:    cubic-bezier(0.4, 0, 0.2, 1)
--p31-ease-emphasized:  cubic-bezier(0.2, 0, 0, 1)
--p31-ease-decelerate:  cubic-bezier(0, 0, 0.2, 1)
```

All animations MUST respect `body.safe-mode { animation: none !important }`.

---

## 10. Naming Corrections Table

| Wrong name | Canonical name | Notes |
|---|---|---|
| `Quantum Material U` / `QMU` | `P31 Shared Surface` | The design system name |
| `PhosOS` | `PHOS` or `PhosOS OMNI-WRAPPER` | Router component |
| `--p31-butter` | `--p31-amber` | New code should use amber; butter is an alias |
| `#25897d` | `#5DCAA5` (`--p31-teal`) | Old teal — must not appear in any live file |
| `rgba(37,137,125,…)` | `rgba(93,202,165,…)` | Old teal as rgba |
| `Atkinson Hyperlegible` (default) | `Inter` (default) | Atkinson is accessibility override only |
| `rounded-[3rem]` / 48px radius | `var(--p31-radius-lg)` / 12px | Kimi's aggressive radius |
| `border-radius: 1.5rem` | `var(--p31-radius-xl)` / 16px | For modals/overlays |

---

## 11. CSS Import Chain

For any new surface:
```html
<!-- 1. Token foundation -->
<link rel="stylesheet" href="/public/lib/p31-qmu-tokens.css">
<!-- 2. Shared surface layer (components + aliases) -->
<link rel="stylesheet" href="/p31-style.css">
<!-- 3. Fonts (see §3 for canonical import block) -->
<!-- 4. Page-specific styles (after shared, never override tokens) -->
```

For doc surfaces (device-setup, howto, fleet-portal, etc.):
```html
<link rel="stylesheet" href="/cognitive-passport/p31-style.css">
<link rel="stylesheet" href="/p31-shared-surface.css">
```

---

## 12. Verify Commands

```bash
npm run verify:p31-style       # Token parity: p31-style.css ≡ p31ca mirror
npm run verify:quantum-material-u  # QMU token file integrity
npm run verify:canon-css       # p31-shared-surface.css digest check
npm run verify:style-alignment # Home page token compliance
```

**The verify chain is the arbiter.** If `verify:p31-style` fails, the surface does not ship. No exceptions.
