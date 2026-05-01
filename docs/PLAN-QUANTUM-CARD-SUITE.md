# Plan: Quantum card suite (production staging)

**Status:** Phase 0 — core package + machine gate (`verify:quantum-deck`).  
**Normative ship bar:** `docs/P31-ENGINEERING-STANDARD.md` · alignment: `p31-alignment.json`.

## Job inventory (staged)

| ID | Owner | Gate | Notes |
|----|--------|------|--------|
| QD-0 | Core | `npm run verify:quantum-deck` | `packages/quantum-deck` — deck + CSPRNG shuffle + `p31.quantumDeckSave/0.1.0` stub |
| QD-1 | Hub | `verify:public-app-shell` (future) | Static `quantum-deck.html` or suite shell — `/p31-style.css`, `data-p31-appearance` |
| QD-2 | Registry | `scripts/hub/verify.mjs` | New id in `registry.mjs` + `hub-app-ids.mjs`; see `docs/P31-HUB-CARD-ECOSYSTEM.md` |
| QD-3 | Kids / Phos | `verify:phos-play-session-bridge` | Any `play_session` export must stay non-evaluative per `docs/P31-PHOS-PLAY-SESSION-BRIDGE.md` |
| QD-4 | Multiplayer | geodesic-room pattern | Optional DO + wire — `docs/GEODESIC-GAME-ENGINE-INTEGRATION.md` as template |
| QD-5 | Operator | command-center | `home-verify-quantum-deck` in Essentials/slices |

## Tech contracts

- **RNG:** `globalThis.crypto.getRandomValues` — same honesty posture as `magic-crystal.html` (“not destiny”).
- **No gambling:** align with `family.html` / creator-economy — no loot boxes, no paid random unlocks.
- **Naming:** do not collide with **tetra-hub** (`p31.tetraHub/1.0.0` mesh aggregator); card product uses **quantum-deck** / **deck-suite** ids.

## Ecosystem equilibrium (Tier S1 rollout — landed)

| Mechanism | What |
|-----------|------|
| `scripts/sync-atmosphere-hub-routes.mjs` | Merges every `hub-app-ids` registry id into `docs/p31-atmosphere-routes.json` (ramp classify: lobby / lab / garden / legal). Runs at start of **`verify:atmosphere-ramp`**. |
| `public/lib/p31-quantum-grandfather-boot.mjs` | Grandfather **`--p31-grandfather-phase`** driver; TRIM locked with dome constants + **`verify-quantum-clock`**. |
| Astro `BaseLayout.astro` | Loads grandfather on all hub layout pages (`/`, `/dome`, …). |
| S1 static hubs | `connect`, `mesh-start`, `planetary-onboard`, `k4market`, `geodesic`, `tomography`, `quantum-family`, `quantum-clock` explainer embed the same boot. |
| Shell template | `design-assets/templates/p31-static-product-shell-snippet.html` — copy scaffold for new `public/*.html`. |

## References

- SIC / K₄ metaphor: `docs/SIC-POVM-K4-ARCHITECTURE.md`
- Quantum clock coherence: `docs/PLAN-QUANTUM-CLOCK.md`
- Prior synthesis: agent plan (quantum solitaire + integrated suite)

Last updated: 2026-04-30
