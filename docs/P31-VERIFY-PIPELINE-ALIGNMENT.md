# Verify Pipeline — Completeness & Alignment

**Document:** P31-VERIFY-PIPELINE-ALIGNMENT  
**Date:** 2026-05-06  
**Scope:** Every verify step on the ship bar, gaps, proposed additions, geometric structure  
**Baseline:** `npm run p31:all` exit 0 at production-2026-04-28

---

## 1. CURRENT SHIP BAR

`npm run verify` runs the full pipeline. Every step is required. Failure = no ship.

| # | Verify Step | What It Checks |
|---|-------------|---------------|
| 1 | verify:alignment | p31-alignment.json structural integrity |
| 2 | verify:facts | Factual claims in docs match code |
| 3 | verify:p31-env | Environment variables present |
| 4 | verify:shipbox | Ship-blocking conditions all clear |
| 5 | verify:passport | CogPass document valid |
| 6 | verify:cognitive-passport-schema | @p31/shared schema structure |
| 7 | verify:cognitive-passport-profiles | Profile presets match schema |
| 8 | verify:constants | p31-constants.json integrity |
| 9 | verify:ecosystem | p31-ecosystem.json glass probes |
| 10 | verify:map-pipeline | P31-ROOT-MAP.md paths resolve |
| 11 | verify:p31-style | p31-style.css generation matches canon |
| 12 | verify:style-alignment | All surfaces use --p31-* tokens (no hardcoded hex) |
| 13 | verify:command-center | Command center Worker routes + V2 UI |
| 14 | verify:p31ca-contracts | p31ca hub ground truth + registry |
| 15 | verify:egg-hunt | Easter eggs present and functional |
| 16 | verify:cars-wire | Triple-lock: carsWire.json ↔ mock-ws-server ↔ SoupEngine |
| 17 | verify:poets-room | Poets room content integrity |
| 18 | build:doc-index | Documentation index generation |
| 19 | verify:doc-index | Doc index structure valid |
| 20 | verify:simplex | SIMPLEX v7 scaffold (82 tests, routes, agents) |
| 21 | build (tsc) | TypeScript compilation clean |
| 22 | soup:prep:check | Soup deployment preparation |

**Total: 22 verify steps + build + soup check**

Additionally per-product:
- BONDING: `npx vitest run` → 424 tests / 32 suites
- Spaceship Earth: `npx vitest run` → 7 suites
- SIMPLEX v7: `npx vitest run` → 82 tests

---

## 2. GAPS — WHAT'S NOT VERIFIED

| Surface | Risk | Proposed Verify | Priority |
|---------|------|----------------|----------|
| Design-assets hex alignment | Silent drift from canon | `verify:design-tokens` | High |
| Ko-fi product names vs ethical map | Draft names ship to production | `verify:kofi-products` | Medium |
| SIMPLEX v7 route parity with live API | Deploy conflict | `verify:simplex-routes` | High (before deploy) |
| CogPass generator HTML vs @p31/shared profiles | Generator emits ghost profiles | Extend `verify:passport` | Medium |
| Node Zero MQTT topics vs SENTINEL | Topic schema drift | `verify:mqtt-topics` | Low (future) |
| HA scene names vs sentinel.ts | YAML ↔ TypeScript drift | `verify:ha-scenes` | Low (future) |
| Meshtastic integration | No coverage | Future | Low |
| Cross-repo merge discipline | Manual, error-prone | Document in P31-PARALLEL-WORK-TRACKS.md | Medium |
| Paper release gate | No automated check | Manual (operator decision) | N/A |
| Passkey WebAuthn ceremony | No e2e test | `verify:passkey-roundtrip` | High (when deployed) |
| CARS SoupEngine health | No dedicated probe | `verify:cars-engine-probe` | Medium |
| Legacy name references in docs | Naming drift | `verify:product-names` (grep for retired names) | Medium |

---

## 3. PROPOSED ADDITIONS (ORDERED BY VALUE)

### Tier 1 — Add Now (high risk if missing)

**verify:design-tokens**  
Extract hex values from `design-assets/` SVGs and HTML. Compare to `p31-style.css` custom properties. Warn on drift. Prevents silent visual regression.

**verify:simplex-routes**  
Fetch known endpoint patterns from live `api.phosphorus31.org` Worker. Compare to simplex-v7 route table. Must pass before deploy. Prevents route collision.

**verify:passkey-roundtrip**  
Full WebAuthn register → authenticate ceremony against passkey Worker. Asserts subject_id minted. Asserts k4-personal binding. Gate for auth-dependent surfaces.

### Tier 2 — Add When Relevant (medium risk)

**verify:ha-scenes**  
Parse `scenes.reference.yaml` entity IDs. Compare to `P31_SCENE_ENTITY` constant in `sentinel.ts`. Catches config drift between YAML and TypeScript.

**verify:passport-profiles-generator**  
Import CogPass profiles from @p31/shared. Check that generator preset IDs match. Prevent ghost profiles that exist in generator but not in schema.

**verify:product-names**  
Grep all active docs for retired names (PHENIX, Cognitive Shield, The Scope, Vertex One, Omega Protocol, Proof of Care). Warn on any hit. Prevents naming drift.

**verify:cars-engine-probe**  
New glass probe: SoupEngine tick executing, breath cycle within ±500ms, coherence ψ calculable, relay polling active.

### Tier 3 — Future (low risk now)

**verify:mqtt-topics** — Node Zero firmware ↔ SENTINEL. Add when both are wired.  
**verify:meshtastic** — When Meshtastic integration exists.  
**verify:kofi-products** — When Ko-fi product catalog finalizes.

---

## 4. SCHEMA VERSIONING CONTRACT

**Problem:** No cross-schema version check. If `p31.cognitivePassport` bumps to 2.0.0, nothing forces `p31.carsWire` or `p31.ground-truth` to verify compatibility.

**Fix:** `SCHEMA_VERSIONS` constant in @p31/shared:

```typescript
export const SCHEMA_VERSIONS = {
  'p31.cognitivePassport': '1.0.0',
  'p31.carsWire': '0.1.0',
  'p31.alignment': '1.0.0',
  'p31.ground-truth': '1.0.0',
  'p31.simplex-d1': '1.0.0',
} as const;
```

Every verify script that touches a schema imports this constant and asserts its version matches. Schema bump → compile error → dependent code must update. Same pattern as the design token pipeline fix.

---

## 5. CI INTEGRATION

`npm run p31:ci` is the CI entry point:

```
npm run verify        → full pipeline (22 steps)
npm run p31ca:build   → hub prebuild (ground truth, registry)
npm run build         → Astro build
npx vitest run        → all test suites
```

**All steps must exit 0.** Any failure blocks merge.

---

## 6. THE GEOMETRIC STRUCTURE

The verify pipeline is not a flat checklist. It's a dependency graph:

```
verify:constants ──┐
verify:alignment ──┤
verify:p31-env ────┤
                   ├──► verify:shipbox (gate)
verify:passport ───┤
verify:ecosystem ──┘
                   
verify:cognitive-passport-schema ──┐
verify:cognitive-passport-profiles ┤
                                   ├──► verify:simplex
verify:cars-wire ──────────────────┘
                   
verify:p31-style ──────┐
verify:style-alignment ┤
                       ├──► verify:design-tokens (proposed)
verify:command-center ─┘

build (tsc) ──► soup:prep:check ──► SHIP
```

The ship bar is a directed acyclic graph. Edges are dependencies. The verify step order in `package.json` reflects the topological sort.

---

*Every node verified. Every edge tested. The graph passes. Ship.*
