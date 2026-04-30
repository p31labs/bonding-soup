# P31 Universal UI Vision — one sky, twenty-three windows

**Role:** Design constitution for what **holds P31 surfaces together visually** — not twenty-three palettes that happen to share teal, but **one night sky** seen through twenty-three windows.

**Pairs with (normative layout / tokens / ethics):**

- **`docs/P31-DESIGN-DOCTRINE.md`** — Gray Rock → Alive, components  
- **`docs/ETHICAL-STYLE-MAP.md`** — motion, voice, no dark patterns  
- **`andromeda/04_SOFTWARE/design-tokens/p31-universal-canon.json`** — typography, palette, ring appearances  
- **`design-assets/starfield/`** — ambient mesh (`p31-starfield.js`), **`docs/P31-STARFIELD-MESH-TOUCHES.md`**  
- **`p31-alignment.json`** — source id **`p31-universal-ui-vision-md`**
- **`docs/P31-DELTA-LANGUAGE.md`** + **`docs/p31-delta-language.json`** — speakable vocabulary (anchors, terms, forbidden phrases); glossary **`docs/p31-delta-glossary.html`** / hub **`/delta-language.html`**; **`verify:delta-language`**

---

## 1. Paradigm shift

**Before:** Each surface has its own emotional register, spatial metaphor, and interaction model — internally coherent, but nothing answers *what holds them together visually*.

**After:** **P31 UI is a single night sky.** The Hub, Dome, C.A.R.S., Command Center, Poets Room, Physics Learn, Doc Library, and every other seed are **windows** onto the same sky — same stars, same physics, same void, same warmth rising from below (hearth / Alive). **Altitude** is the unlock: you are not “switching apps”; you are **zooming in or out** on the same space.

| Window | Altitude (indicative) |
|--------|------------------------|
| Hub | Widest zoom — whole institution / catalog |
| Dome / synergetic stack | Medium zoom — system topology, hemisphere |
| C.A.R.S. / BONDING | Warm zoom — reactions near hearth glow |
| Command Center | Instrument glass — same sky, **precision mode** |
| Single bond in BONDING | Tightest zoom — one molecule, one edge |

The void behind every viewport is the **same** void. The particles are the **same** particles. The teal is the **same** teal.

---

## 2. Five minds — reading orders, not separate silos

Surfaces map to **audiences** as **reading orders** of the same underlying truth — not separate content universes.

| Mind | Lens | Notes |
|------|------|--------|
| Poet / Sun | Feeling, metaphor | Poets Room: quiet band of the sky |
| Physicist / Moon | Proof, measure | Physics Learn: meter ↔ measure |
| Operator | Ship bar, verify, mesh | Command center, desk, runbooks |
| Builder | Forge, integrate, ship | Initial build, labs, hub tools |
| Parent / Gate | Safety, thresholds | Onboarding doors, youth paths |

**Physics Learn** and **Poets Room** are the same K₄ / Larmor / Fuller story read through different lenses. The bridge is explicit navigation: a **translate** affordance — e.g. “You read this as poetry — read it as physics?” and the converse — linked between **`poets-room.html`** and **`docs/physics-learn/`** (same truth, different lens).

---

## 3. Starfield as Layer 1.5

Layers stay as in **P31-DESIGN-DOCTRINE** (Gray Rock void → Alive). The starfield is **not** Layer 1 (the void) and **not** Layer 2 (interactive Alive chrome).

**Layer 1.5 — atmosphere**

- Luminance only; **no brand chroma** competing with teal/coral  
- Pausable; never the loudest layer  
- **`prefers-reduced-motion`**: degrade to static or off  
- Optional global off-switch for operator preference  

You do not notice air until it is gone — same for Layer 1.5.

---

## 4. Jarring cuts (diagnosis and fix)

A **jarring cut** is any moment the operator feels they **changed apps** instead of **walked to another room** in the same building.

**Observed mismatches (examples):**

- Command Center vs Operator Desk: starfield vs none — different visual universes  
- Hub (dark) vs **phosphorus31.org** (light): mode switch without warning  
- Doc Library (calm Gray Rock) → hub cards with louder marketing energy  

**Fix:** **Shared sky, always.** Transitions should feel like rooms in one structure: consistent sky layer (or deliberate static plate where motion would wrong-fit), predictable chroma hierarchy, no teleport.

---

## 5. Command Center and Operator Desk — static star plate

These surfaces are **breaker panels** — industrial, precision-first. They share the same sky as Soup and Hub but **not** the same motion budget.

- **Static star plate:** fixed field of dots (like a chart painted on a control-room ceiling) — **no drifting particles**  
- Lower contrast than Soup’s ambient field  
- Same celestial logic as everywhere else: **same sky, different mode** — precision, not ambience  

Animated starfields remain appropriate for narrative / exploratory seeds (Soup, onboarding, poets room) where drift supports mood.

---

## 6. Return ribbon — “you can always get home”

**Same five links, same order, same treatment** on every seed (footer or persistent strip):

`soup` · `hub` · `passport` · `connection` · `mesh`

**Spec (target):**

- **Order:** fixed as above  
- **Typography:** JetBrains Mono, **11px**, muted (same hierarchy as footer chrome in canon)  
- **Position:** bottom of viewport (sticky footer where layout allows)  
- **Behavior:** identical hover/focus affordances across surfaces  

This doubles as an **AuDHD navigation accommodation**: exits are always in the same place — you cannot be lost in P31 because the doors are invariant.

---

## 7. First-screen sentence (“which mind is host?”)

Every **major seed** should answer on first screen (above the fold): **which mind is hosting this room** — one short sentence, consistent placement (e.g. under title or in Gray Rock band). Operators and newcomers orient without hunting.

---

## 8. Starfield manifest (design tokens)

**Intent:** one manifest (extend **`p31-universal-canon.json`** or adjacent JSON consumed by `apply:p31-style`) defining:

| Concern | Example knobs |
|---------|----------------|
| Presets | `soup`, `command-center`, `operator-desk`, `hub` |
| Opacity ceilings | per preset |
| Max FPS / throttle | idle-friendly |
| Off switch | operator flag / `localStorage` |
| Reduced motion | media query → static plate or hide |

Implementation tracks **`verify:p31-style`** / starfield verify where touched — **human** check remains primary for “same night.”

---

## 9. Single coherence WCD (collapsed P0 + P1)

Engineering discipline often separates “coherence only” from “sky contract.” For **operator bandwidth**, treat **one pass**:

1. **Return ribbon** on every in-scope page — five links, order above, mono 11px muted, bottom.  
2. **First-screen sentence** on every major seed — host mind explicit.  
3. **Starfield manifest** in tokens — presets (soup / cc / desk / hub), opacities, max FPS, off, `prefers-reduced-motion`.  
4. **Static star plate** variant for Command Center and Operator Desk (and any other breaker-panel surfaces).  
5. **Poet ↔ physicist translate link** between Poets Room and Physics Learn (bidirectional where both exist).

**Verify (human, not automated):** Open surfaces in sequence. Ask: **Does every page feel like the same night?** Same sky, different altitude, **no jarring cuts.** Ship bar stays green; this checklist is **experience QA.**

---

## 10. Closing frame

**One sky. Twenty-three windows. Same particles. Same void. Same warmth from below. Different altitude. Different lens. Same home.**

Registry: **`p31-alignment.json`** → **`p31-universal-ui-vision-md`**. Map: **`P31-ROOT-MAP.md`** §1 spine.
