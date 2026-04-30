# Plan: P31 Quantum Clock — build, integration, and coherence

**Status:** **Q0–Q2 + Q4 (static page)** — Library + `verify:quantum-clock` + **hub + dome** as before. **Public explainer:** `p31ca/public/quantum-clock.html`, short URL **`/quantum-clock`** (301) + `p31.ground-truth` routes/redirects and `fileSnippets.quantumClock.page`. **Not** a product card yet unless added to the hub registry. Physics display and Larmor **coherence** remain the same story (`p31-constants.json`, dome hub, egg-hunt, tomography, soundtrack).

**Normative context:** Larmor and UI numbers are **pedagogical / coherence** artifacts, not clinical or metrology. Same contract as `docs/SIC-POVM-K4-ARCHITECTURE.md` and Larmor lines in `docs/EGG-HUNT.md`.

**Last updated:** 2026-04-27

---

## 1. Why this exists (problem statement)

P31 already carries a **31P Larmor** reference in Earth’s field (**863 Hz**) and **derived** cockpit frequencies. Those pieces are **scattered** across C.A.R.S., p31ca **dome/landing**, **static tomography**, **soundtrack zones**, and **somatic** tools. Operators and future agents have no **named module** that explains:

- which clock is “running” in the UI;
- which events are **continuous** (rhythmic) vs **one-shot** (episodic);
- how to add a new surface without **breaking** `verify:egg-hunt` or **drifting** Hz between files.

**Grandfather** and **Cuckoo** are **interface metaphors** for two scheduling modes, not new physics.

---

## 2. Glossary (normative for this plan)

| Term | Meaning in P31 |
|------|----------------|
| **Quantum clock (product name)** | A small **client-side library** + optional **thin UI** that exposes **one monotonic time base** and **two consumption modes** (see below), always **sourced** from the same constant pipeline as Larmor. “Quantum” = **coherence across surfaces** and **P31/31P** narrative — **not** a claim of atomic time or quantum metrology. |
| **Grandfather mode** | **Continuous, low-level rhythm**: phase advances as \(\phi = 2\pi f t\) (or equivalent) with \(f\) from **operator-locked** or **derived** Hz. Long “pendulum” — stable, always present, **reduced motion**-aware. **Maps to** trim floor **0.86 Hz** (`TRIM_HZ_MIN`) and **display** 863 Hz line where appropriate. |
| **Cuckoo mode** | **Episodic chimes**: discrete callbacks when something **meaningful** happens — timer expiry, **telemetry** change threshold, **mesh** line change, user **breath** phase edge, or **soft** “hour” in operator-shift logging. **Does not** require wall-clock NTP. |
| **Rhythmic** | **Periodic / streaming**: rAF, `AudioContext` time, Larmor line audio, 4-4-6 **breath** cadence, **0.86 Hz** torus in tomography, **calm** zone `rhythmPattern` in `SoundtrackEngine`. |
| **Episodic** | **Sparse / event-driven**: WebSocket **sync** in Soup, `setInterval(…, 60000)` in `landing-cockpit.ts` for Q-factor/spoons, one-shot **haptics**, deploy notifications, “chime” toasts. |

---

## 3. Current state (codebase — what is already true)

### 3.1 Single source of truth (canonical 863)

| Location | Role |
|----------|------|
| `p31-constants.json` → `physics.larmorHz`, `larmorLabel` | Operator-edited; drives TS via `apply:constants` |
| `src/p31-constants-generated.ts` | Generated; **BONDING** `SoundtrackEngine` “deep” zone `baseFrequency` |
| `soup.html` | Fetches JSON; Larmor **strip** when `larmorHz` present |
| `docs/physics-learn/physics-engine.js` | **u8-larmor** unit; loads Hz from same JSON when available |
| `docs/egg-hunt-manifest.json` + `scripts/verify-egg-hunt.mjs` | **Coherence:** `{value}Hz` in **dome.astro** + **index.astro** paths |

### 3.2 Derived & cockpit (p31ca, not in home constants file today)

| Location | Role |
|----------|------|
| `p31ca/src/lib/dome/p31-dome-constants.ts` | `P31_LARMOR_HZ = 863`, `TRIM_HZ_MIN = 0.86`, `trimHzFromKnob(t)`, `breathInhaleHz` / `breathExhaleHz` (863/5, 863/10) — **this is the closest existing “clock kernel”** |
| `p31ca/src/lib/dome/cockpit-shared.ts` | `formatTrimHz`, `TELEMETRY_URLS`, cache helpers |
| `p31ca/src/scripts/landing-cockpit.ts` | Trim **knob** → Hz; `playBreath` with breath freqs; **periodic** `setInterval(60000)` / `30000` for **telemetry** (Cuckoo-adjacent polling) |
| `p31ca/src/pages/dome.astro`, `index.astro` | Static **863Hz** display strings (egg-hunt) |
| `p31ca/public/tomography.html` | **`const LARMOR_HZ = 0.86`** in animation loop for ring rotation | 

### 3.3 Audio & somatic (rhythmic)

| Location | Role |
|----------|------|
| `src/soundtrack.ts` | Zone profiles: `deep.baseFrequency` = Larmor; `calm` 4-4-6 `rhythmPattern` |
| `p31ca/public/somatic-anchor*.html`, about | 863 Hz **OscillatorNode** + breath |
| `p31ca/public/quantum-family-about.html` (copy) | “863 Hz Larmor + 432 Hz base” in Sound Garden (copy only unless implemented in page) |

### 3.4 Gaps and risks (must drive the build)

1. **Duplication:** `tomography.html` **hardcodes** `0.86` instead of importing **`TRIM_HZ_MIN`** or a build-time constant. If `p31-dome-constants` changes, **visual drift** is possible. **Action:** part of “Quantum Clock E0” is either a **shared build snippet**, **verifier** that `0.86` and `TRIM_HZ_MIN` match, or a **small generated** `public` fragment from the same source as `p31-dome-constants.ts` (align with **Fuller** one-source pattern in `p31-alignment.json`).
2. **No unified API** for “phase of grandfather” vs “next cuckoo” — every surface reimplements.
3. **No schema** in `p31-constants` for optional **clock preferences** (e.g. enable chimes, reduced motion) — would avoid magic numbers in new UIs.
4. **Episodic** events are **not** namespaced: mixing **60s health poll** and **user breath edge** in one “events” list would confuse a11y and analytics.

---

## 4. Target architecture

### 4.1 Layer diagram

```
p31-constants.json (physics.larmorHz, optional clock prefs)
        │
        ├─► apply:constants → p31-constants-generated (home)
        │
        └─► p31ca: shared kernel (proposed: src/lib/quantum-clock/ or extend p31-dome-constants)
                    │
    ┌───────────────┴───────────────┐
    │                               │
Grandfather (phase)            Cuckoo (events)
    │                               │
rAF / AudioContext t       EventTarget or tiny bus
    │                               │
dome, tomography,          landing telemetry, mesh,
optional global strip      future Worker push, operator shift
```

### 4.2 Time authority (single rule)

- **All rhythmic phase** for P31 “quantum” UIs should use **monotonic** time: `performance.now()` and/or `AudioContext.currentTime` after a **user gesture** for audio, never `Date.now()` for phase accumulation (avoids **tab throttling** surprises for **core** display — optional wall-clock for **labels** only).
- **863 Hz** is a **label + audio reference**; **0.86 Hz** is a **display rotation** reference (Grandfather “slow” tick). The relationship is already **intentional** in code: `TRIM_HZ_MIN` = **floor** of the log trim sweep from `0.86` to `863` (see `trimHzFromKnob`).

### 4.3 Grandfather (rhythmic) — concrete outputs

| Output | Contract |
|--------|----------|
| `getPhase(tMs, fHz) → 0..2π` or unit circle | Pure function; testable |
| `getTrimPhase(tMs, knob01)` | Uses `trimHzFromKnob` for \(f\) |
| Optional **visual** | Expose `beatIndex` (integer) for slow Hz only — **respect `prefers-reduced-motion`**: opacity-only or static ring when reduced |

### 4.4 Cuckoo (episodic) — concrete outputs

| Source | Suggested first integration |
|--------|-----------------------------|
| **Existing landing intervals** | Wrap `setInterval` targets in a **`ChimeScheduler`** with **id** (`telemetry`, `mesh`) and **jitter** (optional) to avoid **thundering herd** if multiple tabs |
| **Breath** | `playBreath` already time-boxed; emit **`breath:edge`** (inhale↔exhale) for optional UI |
| **Mesh / k4** | Reuse `formatMeshHudLine` string change → one **cuckoo** call (debounced) |
| **Network** | Never require sub-second accuracy; **degrade** to cache like `fetchWithCache` already does |

**Explicit non-goals for v1:** server-authoritative “atomic clock” sync, blockchain timestamps, or push notifications without existing Worker product story.

---

## 5. Data model (optional schema extension)

**Location:** new block under `p31-constants.json`, e.g. `physics.quantumClock` or top-level `quantumClock` (versioned).

**Sketch (illustrative — finalize in implementation):**

```json
{
  "schema": "p31.quantumClock/0.1.0",
  "grandfather": {
    "defaultFaceHz": "trimMin",
    "trimMin": 0.86,
    "larmorDisplayHz": 863
  },
  "cuckoo": {
    "enabled": true,
    "kinds": ["telemetry", "mesh", "breath"]
  },
  "accessibility": {
    "respectReducedMotion": true,
    "chimeMode": "haptic+toast"
  }
}
```

- **Version** in `p31-constants` **or** a dedicated **`ground-truth` `fileSnippets`** row if the hub must prove copy on a public page.
- **Derive** `trimMin` and `larmorDisplayHz` from **existing** `physics` where possible to avoid a **second** source of 863/0.86.

---

## 6. Phased program (ship bars)

| Phase | Scope | Ship bar | Primary artefacts |
|-------|--------|----------|-------------------|
| **Q0** | **Coherence only** | `npm run verify` + `verify:egg-hunt` + **new** `verify:quantum-clock` (or expand `verify-constants` / a tiny script) | **Eliminate** unverified drift: `tomography.html` `0.86` **matches** `TRIM_HZ_MIN` (or generated). Document relationship **863** vs **0.86** in this file §3. **No** new public route. |
| **Q1** | **Kernel** | p31ca `tsc` + unit tests for phase math | `src/lib/quantum-clock/index.ts` (or extend `p31-dome-constants.ts` with namespaced exports only — avoid breaking imports). Export: `getGrandfatherPhase`, `createCuckooBus`, `nowMs`. |
| **Q2** | **Adopt in one rhythmic surface** | `hub:ci` or targeted build | **Either** `tomography.html` (use kernel bundle / inline generated constants) **or** `mesh-living-background.ts` (single shared phase for particles + optional HUD). **Ethics pass:** `docs/ETHICAL-STYLE-MAP.md` for motion. |
| **Q3** | **Adopt in one episodic path** | Same | Refactor `landing-cockpit.ts` polling to **cuckoo** bus + existing handlers (no user-visible “clock” name required). |
| **Q4** | **Optional public face** | `ground-truth` + `registry` if it becomes a **product card** | e.g. `/quantum-clock` **static** explainer: Grandfather + Cuckoo, links to `physics-learn`, **no** new Worker. |

**Home-only clones** without `andromeda/`: Q0 can still add **verifier** that greps or compares **two** values if `p31ca` is absent (skip) — pattern already in `verify-egg-hunt`.

---

## 7. Integration map (P31 system)

| System | Action |
|--------|--------|
| **`p31-alignment.json`** | Add **derivation** row: `p31-dome-constants` / `quantum-clock` → `tomography`, optional `soup` strip |
| **Root `npm run verify`** | Wire `verify:quantum-clock` when script exists; keep **off** the critical path until Q0 is stable (or make it **soft** like other optional steps) — follow **`docs/P31-ALIGNMENT-SYSTEM.md`** |
| **Egg-hunt** | **Do not** add new required `{larmor}Hz` files unless a new page shows Larmor; if **863** appears in new public HTML, update **manifest** |
| **Ground-truth** | Only if **Q4** adds routes or `fileSnippets` for copy |
| **Security** | **No** secrets in static clock; cuckoo over **fetch** reuses **existing** CORS/timeout patterns from `cockpit-shared.ts` |

---

## 8. Testing strategy

1. **Unit:** `getPhase(0, 0.86)` and after **1000 s** (expect wrap / continuity); `trimHzFromKnob(0) === 0.86`, `trimHzFromKnob(1) === 863`.
2. **Integration (Playwright, optional):** one e2e that **opens tomography** (or minimal test page) and asserts **one** rAF frame runs without throw when `prefers-reduced-motion` is forced.
3. **CI:** if static HTML must contain `0.86`, add **one** grep or JSON compare in `verify:quantum-clock`.

---

## 9. Open questions (resolve before Q4)

1. Should **863** and **0.86** be **generated** into `p31-constants.json` as explicit fields (`displaySlowHz`) so **static** `public/*.html` can **fetch** one JSON? (Adds network; better for **single** truth, worse for **offline** first paint — **compromise:** inline **micro** JSON in build from `apply:constants` **mirror** in p31ca public, already used for mesh constants pattern.)
2. Is **Cuckoo** ever allowed to use **system notification** (browser `Notification` API) — likely **out of scope** (permission friction, youth policy in **`PLAN-KIDS-VIBE-CODING.md`**).
3. **C.A.R.S.** `SoupEngine` — should **Larmor strip** get a **shared** thin client from the same package as p31ca, or stay **duplicated** with **one** Hz fetch only (minimal footprint)?

---

## 10. Next actions (ordered)

1. **Implement Q0** verifier + **fix** `tomography.html` to reference **`TRIM_HZ_MIN` equivalence** (import path or build step — choose smallest diff that p31ca `hub:build` accepts).
2. **Extract** (or name) `src/lib/quantum-clock` with **re-exports** from `p31-dome-constants` to avoid a big rename blast.
3. **Wire** one Cuckoo consumer in `landing-cockpit.ts` (telemetry tick).
4. **Revisit** this doc **Status** and **Q4** public route only if a **hub** card is desired.

**Related docs:** `docs/SIC-POVM-K4-ARCHITECTURE.md`, `docs/SIC-POVM-MATHEMATICAL-APPENDIX.md`, `docs/EGG-HUNT.md`, `docs/ETHICAL-STYLE-MAP.md`, `P31-ROOT-MAP.md` (K₄ + hub). **Spike (geometry, not time):** `spikes/d20-geodesic-icosahedron/` (d20 faces vs Larmor are **orthogonal**; do not conflate in UI without explicit copy).
