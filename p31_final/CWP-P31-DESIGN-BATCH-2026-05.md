# P31 CONTROLLED WORK PACKAGES — DESIGN SYSTEM CONVERGENCE BATCH
# CWP-P31-DESIGN-2026-05

**Date:** May 4, 2026
**Issued by:** Opus 4.6 (Architect)
**Executing agent:** Local fleet (Kimi K2.5 / Qwen3 8B / Cursor Sonnet)
**Authority:** bonding-soup canonical over all parallel implementations
**Prerequisite commit:** 2ba1c93 (psych E2E merge complete)

---

## DESIGN DIRECTIVE

Gemini/Kimi established a strong visual direction — glass morphism, soft panels, backdrop-filter blur, rounded corners, semantic color mapping, safe mode toggling, K₄ branding. **The aesthetic is correct. The token values were wrong.**

These CWPs tell the local agent: **use the canonical token values but preserve the Kimi/Gemini visual sensibility.** The design system is called "P31 Shared Surface" (not "Quantum Material U"). The source of truth is `p31-shared-surface.css` and `p31-constants.json`. No hardcoded hex values. No inline `:root` blocks. Every surface imports from the canonical source.

---

## CWP-DESIGN-01: CANONICAL STYLE GUIDE DOCUMENT

**Intent:** Create a single-page design reference that any agent can read before touching CSS.

**Spoon estimate:** 1 🥄

**Tag-out boundaries:**
- DO NOT create a new design system. Document the existing one.
- DO NOT change any token values. Read them from `p31-shared-surface.css` and `p31-constants.json`.
- DO NOT create a Storybook or component library (that's a separate CWP).

**Deliverable:** `docs/P31-DESIGN-SYSTEM-REFERENCE.md`

**Content required:**

1. **Token table** — every CSS custom property in p31-shared-surface.css with:
   - Variable name
   - Hex value
   - Semantic meaning (what it represents)
   - Where to use it (background, text, accent, border, etc.)
   - WCAG contrast ratio against --p31-void (pre-computed)

2. **Color semantics** (from Kimi's mapping, verified against canonical):
   ```
   --p31-teal / --p31-cyan    → Trust, structure, primary action
   --p31-coral                 → Voltage, urgency, legal, warnings
   --p31-amber (was --p31-butter) → Focus, biological, L.O.V.E., children
   --p31-lavender              → Archive, documentation, scribe
   --p31-phosphorus            → Success, growth, confirmation
   --p31-cloud                 → Primary text
   --p31-muted                 → Secondary text, labels
   --p31-void                  → Background (deep)
   --p31-surface               → Panel background
   --p31-surface2              → Elevated card background
   ```

3. **Typography stack:**
   - Primary: `Inter var` (canonical) OR `Atkinson Hyperlegible` (accessibility override)
   - Mono: `JetBrains Mono` (code, data, timestamps)
   - Serif: `Playfair Display` (decorative headers only, never body)
   - Decision rule: if the surface is a tool (passport, geodesic), use Inter. If the surface is institutional (phosphorus31.org), use Inter. Atkinson Hyperlegible is approved for surfaces specifically targeting users with dyslexia or low vision.

4. **Glass morphism pattern:**
   ```css
   .p31-glass-panel {
     background: var(--p31-surface);
     border: 1px solid var(--p31-glass-border);
     border-radius: 12px;          /* NOT 3rem — 12px is the canonical radius */
     backdrop-filter: blur(20px);
     -webkit-backdrop-filter: blur(20px);
   }
   ```
   Note: Kimi used `rounded-[3rem]` (48px). This is too aggressive — it wastes corner space on mobile. 12px is the canonical radius. 8px for small components. 16px for modals/overlays.

5. **Safe mode contract:**
   ```css
   body.safe-mode {
     /* MUST strip */
     animation: none !important;
     transition: none !important;
   }
   body.safe-mode canvas { display: none !important; }
   body.safe-mode .hide-safe { display: none !important; }
   body.safe-mode .p31-glass-panel { backdrop-filter: none; }
   /* WebGL surfaces: call engageSafeMode() which does full context teardown */
   ```

6. **Touch target minimums:**
   - General: 44×44px (WCAG 2.2 SC 2.5.5)
   - Children (S.J./W.J. surfaces): 60×60px
   - Crisis mode (W-CRISIS): single-chip, full-width tap target

7. **Spacing scale:** 4px base, multiples of 4. `4, 8, 12, 16, 20, 24, 32, 48, 64`.

8. **Naming corrections table** (from convergence log — copy verbatim).

**Acceptance criteria:**
- [ ] Document exists at the specified path
- [ ] Every token in p31-shared-surface.css appears in the token table
- [ ] WCAG contrast ratios computed and listed (use science-core.mjs `wcagContrast()`)
- [ ] No mention of "Quantum Material U" or "QMU" — use "P31 Shared Surface"
- [ ] No mention of "PhosOS" — use "PHOS"
- [ ] Registered in p31-alignment.json as a source

---

## CWP-DESIGN-02: SURFACE TOKEN MIGRATION (4 Bin A Survivors)

**Intent:** Replace all inline `:root` CSS blocks in the 4 surviving Kimi surfaces with imports from the canonical stylesheet.

**Spoon estimate:** 2 🥄🥄

**Tag-out boundaries:**
- DO NOT change the layout, structure, or functionality of any surface.
- DO NOT add new features. This is a token migration only.
- DO NOT remove the safe mode button or safe mode CSS — migrate it to use the canonical contract.
- DO NOT change the Atkinson Hyperlegible font — it was verified correct for accessibility.

**Surfaces:**
1. `public/passport.html`
2. `public/geodesic.html`
3. `public/delta-language.html`
4. `public/observatory.html`

**For each surface, execute these steps in order:**

### Step 1: Remove the inline `:root` block
Every Kimi surface has this pattern at the top of `<style>`:
```css
:root {
  --p31-void: #0f1115; /* CORRECTED per canon */
  --p31-surface: #161920; --p31-surface2: #1c2028;
  --p31-teal: var(--p31-cyan); /* CORRECTED */
  --p31-coral: #cc6247; --p31-butter: #cda852;
  /* ... etc */
}
```
**Delete this entire block.** Replace with:
```html
<link rel="stylesheet" href="/p31-shared-surface.css">
```

### Step 2: Fix any remaining hardcoded hex
Run this check:
```bash
grep -E "color:\s*#[0-9a-fA-F]{3,8}" public/<surface>.html | grep -v ":root"
```
Any match = a hardcoded color that needs to become a `var(--p31-*)` reference. Replace it.

### Step 3: Rename `--p31-butter` → `--p31-amber`
If the surface CSS uses `var(--p31-butter)`, the canonical name is `--p31-amber`. Check if p31-shared-surface.css defines an alias. If not, add one:
```css
/* In p31-shared-surface.css — alias for Kimi compatibility */
--p31-butter: var(--p31-amber);
```

### Step 4: Verify the Google Fonts import
Kimi surfaces load fonts via:
```html
<link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:..." rel="stylesheet">
```
This is acceptable for standalone HTML surfaces. When these migrate to Astro (CWP-DESIGN-04), the font will be self-hosted. For now, keep the external import.

### Step 5: Replace the `p31-atmosphere-core.js` script tag
Each surface has:
```html
<script src="/lib/p31-atmosphere-core.js"></script>
```
Replace with:
```html
<!-- PHOS Router: pending CWP-P31-PHOS-ROUTER-2026-05 -->
<!-- <script src="/lib/p31-phos-router.js"></script> -->
```
This disables the Kimi PHOS orb until the canonical router is built. The surfaces work without it — the orb was navigation chrome, not functionality.

### Step 6: Run verify
```bash
npm run verify:p31-style   # Token parity check
npm run verify:alignment   # Source registry
```

**Acceptance criteria (per surface):**
- [ ] No inline `:root` block
- [ ] `<link rel="stylesheet" href="/p31-shared-surface.css">` present
- [ ] Zero hardcoded hex outside of `:root` (grep returns empty)
- [ ] Safe mode button still functional
- [ ] `npm run verify:p31-style` passes
- [ ] Visual appearance unchanged (screenshot comparison)

---

## CWP-DESIGN-03: PHOS ROUTER COMPONENT (Phase 1 — Text + Chips)

**Intent:** Build the PHOS Router as specified in `docs/CWP-P31-PHOS-ROUTER-2026-05.md`. Phase 1 only: text input + suggested chips. No voice.

**Spoon estimate:** 3 🥄🥄🥄

**Tag-out boundaries:**
- DO NOT implement voice input (that's Phase 3 of the PHOS Router CWP).
- DO NOT implement LLM inference (that's P1, not P0).
- DO NOT make PHOS the only navigation path. Every surface must remain reachable by direct URL.
- DO NOT use the name "PhosOS," "Jarvis," or "Akinator" anywhere in code or comments.

**Architecture (from CWP-P31-PHOS-ROUTER-2026-05.md):**

```
p31-phos-router.js
├── Intent catalog: /data/phos-intent-catalog.json
│   ~50 phrase→surface mappings
│   Schema: { phrases: ["find my passport", "cogpass", "identity card"], surface: "/passport.html", label: "Cognitive Passport", icon: "🧬" }
│
├── Decision tree chips (3-4 levels):
│   Level 0: "I'm here for..." → myself / my family / professional / just looking
│   Level 1 (myself): → tools / research / support / donate
│   Level 1 (family): → bonding game / medication / school resources
│   Level 1 (professional): → publications / API / open source
│   Level 1 (just looking): → show top 4 surfaces
│   Terminal: suggested surface with confirm/cancel
│
├── Text input: Fuse.js fuzzy match against intent catalog
│   threshold: 0.4 (permissive — better to show a close match than nothing)
│   keys: ["phrases", "label"]
│   result: sorted by score, top 3 shown as chips
│
├── Route confirmation: always show destination before navigating
│   "I think you want [Cognitive Passport] →" [Go] [Not this]
│
├── Safe mode: if body.safe-mode, skip all animation, reduce to chips only
├── urgentMode: if data-p31-urgent="true" on body, bypass everything → /support (one chip)
└── Fallback: STANDARD_CHIPS (top 4 by traffic: /passport, /bonding, /lab, /welcome)
```

**UI specification:**

```
┌─────────────────────────────────────────┐
│ [🔍 What are you looking for?        ] │  ← text input, always visible
├─────────────────────────────────────────┤
│  [For myself]  [For my family]          │  ← chip row, tappable
│  [Professional]  [Just looking]         │
├─────────────────────────────────────────┤
│  Suggested: Cognitive Passport →  [Go]  │  ← appears after input/chip selection
└─────────────────────────────────────────┘
```

- Position: fixed bottom of viewport (mobile) or top bar (desktop)
- Z-index: 100 (above content, below modals)
- Collapse to a single icon (🔍) after 5s of inactivity
- Expand on tap/focus
- Close on Escape key
- Fully keyboard-navigable (Tab through chips, Enter to select)
- `aria-label="P31 navigation assistant"` on the container
- `role="search"` on the text input

**Files to create:**
1. `public/lib/p31-phos-router.js` — the component (~200 lines)
2. `public/data/phos-intent-catalog.json` — the intent mapping (~50 entries)
3. `scripts/verify-phos-router.mjs` — verify script that checks:
   - Every surface in public-line.json has ≥1 intent catalog entry
   - No duplicate phrases across surfaces
   - Fuse.js threshold produces reasonable results for test queries

**Acceptance criteria:**
- [ ] Text input fuzzy-matches against intent catalog
- [ ] Decision tree chips render and narrow correctly
- [ ] Route confirmation shows before any navigation
- [ ] urgentMode bypasses to single chip
- [ ] Safe mode strips all animation
- [ ] Keyboard-only navigation works end-to-end
- [ ] `npm run verify:phos-router` passes
- [ ] Works on Android Chrome (the kids' tablets)
- [ ] No external API calls — everything is local/static

---

## CWP-DESIGN-04: ASTRO MIGRATION PREP (4 Survivors)

**Intent:** Prepare the 4 Bin A survivors for migration from standalone HTML into the Astro 5 pipeline on phosphorus31.org / p31ca.org.

**Spoon estimate:** 2 🥄🥄

**Tag-out boundaries:**
- DO NOT actually migrate to Astro in this CWP. Only prepare.
- DO NOT change visual appearance.
- DO NOT create new Astro components from scratch — extract from existing HTML.

**For each surface, produce:**

1. **Component extraction map** — identify which parts of the HTML become:
   - `<BaseLayout>` content (header, footer, nav, safe mode)
   - Page-specific `<Content>` (the actual surface)
   - Shared components (K₄ SVG, glass panels, safe mode button)

2. **Dependency audit:**
   - External CDN scripts (Three.js for geodesic) — replace with npm packages
   - Google Fonts — replace with self-hosted `@fontsource/atkinson-hyperlegible`
   - Inline scripts — extract to `.ts` modules

3. **Route mapping:**
   ```
   passport.html    → /passport    (p31ca.org)
   geodesic.html    → /geodesic    (p31ca.org)
   delta-language.html → /glossary  (phosphorus31.org — institutional content)
   observatory.html → /observatory  (p31ca.org — operator tool)
   ```

4. **public-line.json registration** — add each surface as `gate: "draft"`:
   ```json
   {
     "path": "/passport",
     "gate": "draft",
     "owner": "operator",
     "phosReady": false,
     "phosSlot": "passport",
     "psychScore": null,
     "notes": "Kimi Bin A survivor. Token migration done (CWP-DESIGN-02). Pending Astro migration."
   }
   ```

**Deliverable:** `docs/ASTRO-MIGRATION-MAP.md` with the above for all 4 surfaces.

**Acceptance criteria:**
- [ ] Document exists with extraction maps for all 4 surfaces
- [ ] All external dependencies identified with npm replacements
- [ ] Route mapping confirmed (no collisions with existing routes)
- [ ] All 4 surfaces registered in public-line.json as draft
- [ ] `npm run verify:public-line` passes

---

## CWP-DESIGN-05: GATE 2 POLISH (Passport + Glossary)

**Intent:** Bring `/passport` and `/glossary` (delta-language) to Gate 2 (Implementation Complete). These are the first two surfaces to reach Gate 3 per the convergence directive: "Two perfect surfaces beat five good ones."

**Spoon estimate:** 3 🥄🥄🥄 (per surface, 6 total)

**Tag-out boundaries:**
- DO NOT add new features. Polish only.
- DO NOT change the core functionality (passport generates CogPass, glossary searches terms).
- DO NOT skip the screen reader pass — this is an accessibility nonprofit.

**Gate 2 checklist (per surface):**

### Passport (`/passport`)
- [ ] All four states implemented:
  - Empty: "No passport created yet — let's build your first one." + primary action button
  - Loading: skeleton screen matching the passport card shape
  - Error: "Something went wrong generating your passport. Try again?" + retry button
  - Normal: the passport generator
- [ ] Lighthouse CI assertions pass:
  - Performance ≥ 0.90
  - Accessibility = 1.00
  - Best Practices ≥ 0.95
  - SEO ≥ 0.95
- [ ] Manual screen reader pass (NVDA or VoiceOver):
  - [ ] All interactive elements have accessible names
  - [ ] Slider is operable via keyboard (arrow keys adjust)
  - [ ] Focus order follows visual order
  - [ ] Save action announced
- [ ] Console errors: zero
- [ ] All text meets WCAG AA contrast (4.5:1 body, 3:1 large)
- [ ] Touch targets ≥ 44×44px
- [ ] `prefers-reduced-motion` honored
- [ ] OG image generated (1200×630, P31 branded)
- [ ] Meta description and title set
- [ ] `<h1>` present, heading hierarchy correct

### Glossary (`/glossary` / delta-language)
- [ ] All four states implemented:
  - Empty: search input with placeholder "Search P31 terminology..."
  - Loading: N/A (static content, instant)
  - Error: N/A (no network dependency)
  - No results: "No terms match '[query]'. Try a different search?" (not blank)
- [ ] Same Lighthouse/a11y/console/contrast/target checklist as above
- [ ] Content review:
  - [ ] No naval/military metaphors in any definition
  - [ ] "Floating Neutral" defined as electrical engineering term (not naval)
  - [ ] Every term has a plain-language definition + a technical definition
  - [ ] Flesch-Kincaid reading level ≤ 10th grade for plain-language definitions
- [ ] Search works with partial matches ("decoher" matches "Decoherence")
- [ ] Each term linkable via anchor (`/glossary#decoherence`)

**Acceptance criteria:**
- [ ] Both surfaces pass all Gate 2 checklist items
- [ ] Lighthouse CI reports attached as artifacts
- [ ] Screen reader notes filed in `docs/a11y/`
- [ ] public-line.json updated to `gate: "gate2"` for both
- [ ] `npm run verify:public-line` passes

---

## CWP-DESIGN-06: SAFE MODE STANDARDIZATION

**Intent:** Ensure every surface in the ecosystem implements safe mode identically.

**Spoon estimate:** 1 🥄

**Tag-out boundaries:**
- DO NOT add safe mode to surfaces that don't have it yet — only standardize existing implementations.
- DO NOT change the safe mode behavior (grayscale + strip animations + destroy WebGL).

**The canonical safe mode contract:**

```javascript
// p31-safe-mode.js — shared across all surfaces

export function initSafeMode() {
  const btn = document.getElementById('safeModeBtn');
  if (!btn) return;

  // Check OS preference
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) engage();

  // Check URL param
  if (new URLSearchParams(location.search).has('safe')) engage();

  // Check localStorage
  if (localStorage.getItem('p31-safe-mode') === 'on') engage();

  btn.addEventListener('click', toggle);
}

function engage() {
  document.body.classList.add('safe-mode');
  localStorage.setItem('p31-safe-mode', 'on');
  // Dispatch event for surfaces that need custom teardown (WebGL)
  document.dispatchEvent(new CustomEvent('p31:safe-mode', { detail: { active: true } }));
}

function disengage() {
  document.body.classList.remove('safe-mode');
  localStorage.setItem('p31-safe-mode', 'off');
  document.dispatchEvent(new CustomEvent('p31:safe-mode', { detail: { active: false } }));
}

function toggle() {
  document.body.classList.contains('safe-mode') ? disengage() : engage();
}
```

**WebGL surfaces (geodesic, observatory) listen for the event:**
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

**For each Bin A surface:**
1. Replace inline safe mode JS with `<script src="/lib/p31-safe-mode.js"></script>`
2. Verify safe mode persists across page navigation (localStorage)
3. Verify `?safe=1` URL param triggers safe mode on load
4. Verify `prefers-reduced-motion` triggers safe mode on load

**Deliverable:**
1. `public/lib/p31-safe-mode.js` — the shared module
2. Updated 4 Bin A surfaces using the shared module
3. `scripts/verify-safe-mode.mjs` — verify script checking all surfaces

**Acceptance criteria:**
- [ ] All 4 surfaces use the shared safe mode module
- [ ] Safe mode persists across navigation
- [ ] URL param `?safe=1` works on all surfaces
- [ ] `prefers-reduced-motion` auto-triggers on all surfaces
- [ ] WebGL surfaces (geodesic) fully destroy context on safe mode
- [ ] `npm run verify:safe-mode` passes

---

## CWP-DESIGN-07: GLASS BOX INTEGRATION FOR DESIGN METRICS

**Intent:** Wire the psych E2E science-core metrics into the Glass Box transparency dashboard so design quality is publicly visible.

**Spoon estimate:** 2 🥄🥄

**Tag-out boundaries:**
- DO NOT expose operator-private data (legal, medical, financial).
- DO NOT expose raw test scores — expose aggregated grades only.
- DO NOT make the Glass Box a dependency for any surface — it's observability, not functionality.

**Metrics to expose:**
```json
{
  "designHealth": {
    "contrastAA": { "passing": 4, "total": 4, "grade": "A" },
    "touchTargets": { "violations": 0, "grade": "A" },
    "safeModeCompliance": { "surfaces": 4, "compliant": 4, "grade": "A" },
    "lighthousePerf": { "mean": 92, "worst": 88, "grade": "A-" },
    "lighthouseA11y": { "mean": 100, "worst": 100, "grade": "A" },
    "psychE2ePassRate": { "passing": 69, "total": 69, "grade": "A" },
    "tokenCompliance": { "hardcodedHex": 0, "grade": "A" }
  }
}
```

**Deliverable:** Update `glass-box-emitter.mjs` to include design health metrics in the Glass Box JSON payload. Update `psych-e2e-live.html` (or equivalent) to display them.

**Acceptance criteria:**
- [ ] Glass Box JSON includes `designHealth` section
- [ ] All grades computed from real verify/test data
- [ ] Zero operator-private data exposed
- [ ] `npm run verify:glass-box` passes

---

## EXECUTION ORDER

```
CWP-DESIGN-01 (Style Guide)          → Agent reads this before touching any CSS
CWP-DESIGN-06 (Safe Mode)            → Shared module, unblocks all other CWPs
CWP-DESIGN-02 (Token Migration)      → 4 surfaces use canonical tokens
CWP-DESIGN-03 (PHOS Router Phase 1)  → Text + chips navigation
CWP-DESIGN-05 (Gate 2 Polish)        → Passport + Glossary to Gate 2
CWP-DESIGN-04 (Astro Migration Prep) → Document only, no code change
CWP-DESIGN-07 (Glass Box Design)     → Observability, do last
```

**Total spoon budget:** 14 🥄 (~3 days at 5 spoons/day, or 2 days at 7 spoons/day if calcium is stable)

---

## THE RULE

The aesthetic is Gemini's. The tokens are bonding-soup's. The verify chain is the arbiter. If `npm run verify:p31-style` fails, the surface does not ship. No exceptions. No "it looks close enough." The cage holds because the tokens hold.

💜🔺💜
