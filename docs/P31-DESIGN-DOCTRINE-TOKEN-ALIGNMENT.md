# Design Doctrine & Token Alignment

**Document:** P31-DESIGN-DOCTRINE-TOKEN-ALIGNMENT  
**Date:** 2026-05-06  
**Scope:** Gray Rock → Alive principle, p31-universal-canon.json → CSS generation pipeline, token sweep verification, soup-quantum.css binding  
**Baseline:** production-2026-04-28 tag (29/29 scorecard PASS, zero hardcoded hex in src/)

---

## 0. THE PRINCIPLE

**Gray Rock** is the default state. Every surface loads minimal, quiet, low-stimulation. This is not a design choice — it's a medical necessity. Overstimulation triggers decoherence. The system protects the operator by starting calm.

**Alive** is the engagement state. When the user demonstrates intent (interaction, navigation, creation), the surface wakes up. Molecules fade in. Sidebars reveal. Color emerges. The transition is earned, not imposed.

**Normative document:** `docs/P31-DESIGN-DOCTRINE.md`  
**CSS implementation:** `cognitive-passport/p31-style.css` (generated, 44 patterns)  
**Generator:** `scripts/lib/p31-style-generate.mjs`

---

## 1. TOKEN FLOW

```
p31-universal-canon.json          (source of truth — colors, type, space)
        │
        ▼
npm run apply:p31-style           (generator script)
        │
        ├──► cognitive-passport/p31-style.css    (44 component patterns)
        ├──► soup-quantum.css                    (breath/coherence bindings) ← GAP
        │
        ▼
consumed by:
├── p31ca.org (hub) — mirrors p31-style.css
├── bonding.p31ca.org/soup — imports soup-quantum.css
├── phosphorus31.org — Astro BaseLayout includes p31-style.css
├── command-center V2 — inlines spinner SVGs
├── OrchestratorDashboard — full canon rewrite (is:global, a11y, reduced-motion)
└── design-assets/ (SVGs, forge, Ko-fi engine) ← GAP: hardcoded hex
```

### 1.1 Gaps in Token Flow

**Gap 1: soup-quantum.css fallbacks are hardcoded.**  
`soup-quantum.css` defines CSS custom properties that bind to SoupEngine state (breath phase, coherence ψ, zone temperature). The fallback values are hardcoded hex. If `p31-universal-canon.json` changes, these fallbacks drift silently.

**Fix:** Extend `apply:p31-style` to also generate soup-quantum.css fallback values from the canon. One generator, two outputs.

**Gap 2: design-assets/ HTML files hardcode hex.**  
`design-assets/spinners/*.svg`, `design-assets/forge/apex-forge.html`, `design-assets/kofi/kofi-engine.html` all contain hardcoded color values.

**Fix:** Either generate SVG color fills from the canon at build time (like `apply:p31-style` but for assets), or add `verify:design-tokens` that extracts hex values and warns on drift.

**Gap 3: Command Center V2 inlines spinner SVGs.**  
If the spinner SVGs drift from canon, the command center's inline copies drift too.

**Fix:** Command center build step should copy from `design-assets/spinners/` rather than maintaining independent copies. Or the spinners should be in a shared assets package.

---

## 2. CSS COMPONENT PATTERNS (44 total)

Categories in `p31-style.css`:

| Category | Count | Examples |
|----------|-------|---------|
| State classes | 4 | `.p31-gray-rock`, `.p31-alive`, `.p31-focal`, `.p31-reveal` |
| Layout templates | 3 | Focus (1-col), Workshop (sidebar+main), Gallery (grid) |
| Surface components | 10+ | `.p31-surface-card`, `.p31-glass-panel`, `.p31-badge` |
| Typography | 6+ | Heading hierarchy (h1-h6 on P31 scale) |
| Buttons | 4+ | `.p31-btn-primary`, `.p31-btn-ghost`, etc. |
| Status indicators | 4+ | `.p31-status-up`, `.p31-status-down`, etc. |
| Utility overrides | 6+ | User preference overrides (contrast, density, motion) |
| Reveal/transition | 3+ | `.p31-reveal-on-intent`, `.p31-fade-in`, `.p31-collapse` |

**Rule:** Agents pick from these patterns. They do not invent new surface styles. If a pattern is missing, it's added to the generator and the style sheet regenerates. No inline styles. No ad-hoc colors. No hardcoded hex in component files.

---

## 3. PASSPORT → CSS BRIDGE

`p31-subject-prefs.js` reads CogPass profile (from localStorage or mesh-start) and sets custom properties on `:root`:

| Property | Source | Purpose |
|----------|--------|---------|
| `--p31-user-contrast` | CogPass accessibility.contrast | High/normal/low contrast mode |
| `--p31-user-density` | CogPass accessibility.density | Compact/comfortable/spacious layout |
| `--p31-user-motion` | CogPass accessibility.motion | Full/reduced/none animation |
| `--p31-user-theme` | CogPass preferences.theme | Light/dark/system |

CSS responds via `var()` with Gray Rock defaults as fallbacks. No JavaScript runtime decisions about appearance — CSS handles it all through custom property cascading.

**Verify:** `verify:cognitive-passport-profiles` ensures profile presets match the properties that `p31-subject-prefs.js` reads. If a profile adds a new accessibility field, the prefs script must be updated.

---

## 4. LAYOUT TEMPLATES

Every P31 surface is one of three layouts. Agents do not invent layouts.

**Focus** — One column, one thing. Used for: onboarding, breathing room, legal documents, single-task flows. The operator sees one action. Executive dysfunction cannot freeze on choices because there's only one.

**Workshop** — Sidebar + main content. Used for: Soup demo, Spaceship Earth cockpit, SIMPLEX dashboard. The sidebar reveals on intent (hover, swipe, or explicit toggle). Default state: collapsed.

**Gallery** — Grid with progressive reveal. Used for: hub cards, molecule library, achievement grid. Items fade in on scroll. Not all items visible at once — prevents overwhelm.

**Verify:** Any new surface must declare its layout template in the component's top-level comment. `verify:p31-style` can be extended to grep for layout declarations.

---

## 5. SOUP AS THE PROOF

`soup.html` (deployed at bonding.p31ca.org/soup) is the reference implementation of the doctrine:

- **Gray Rock on load:** Minimal UI, muted colors, status bar shows one number (FPS)
- **Molecules fade in as engagement begins:** First molecule appears on first user action
- **Status bar collapses to one number:** Expanded status only on hover/tap
- **Sidebar reveals on intent:** Not on load
- **`?perf=1` probe:** Performance metrics overlay for testing
- **`?alive=1` bypass:** Skip Gray Rock, go straight to Alive (for demos)

**Production tag state (2026-04-28):** Soup implements Gray Rock first paint. Token sweep complete — zero `text-white`/`text-cloud`/`bg-void` in p31ca/src. All surfaces on `--p31-*` tokens.

---

## 6. WCD SEQUENCE

| WCD | Scope | Effort | Dep |
|-----|-------|--------|-----|
| WCD-DESIGN-01 | Extend `apply:p31-style` to generate soup-quantum.css fallbacks | 0.5 day | None |
| WCD-DESIGN-02 | `verify:design-tokens` — SVG/HTML hex vs p31-style.css | 0.5 day | None |
| WCD-DESIGN-03 | Design-assets SVG generation from canon (spinners, forge, Ko-fi) | 1 day | WCD-DESIGN-01 |
| WCD-DESIGN-04 | Command Center V2 spinner copy pipeline | 0.5 day | WCD-DESIGN-03 |
| WCD-DESIGN-05 | Layout template declaration enforcement in verify | 0.5 day | None |

---

*Gray Rock on load. Alive on intent. The doctrine is the architecture.*
