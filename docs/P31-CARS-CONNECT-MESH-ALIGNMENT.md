# C.A.R.S. — Connect · Mesh · Optimization · Alignment · Integration

**Document:** P31-CARS-CONNECT-MESH-ALIGNMENT  
**Date:** 2026-05-06  
**Scope:** Canonical alignment of all CARS layers — naming, wire protocol, SoupEngine, connect surface, mesh topology, optimization targets, and integration map  
**Operator:** Will Johnson, P31 Labs Inc. (EIN 42-1888158)

---

## 0. NAMING RESOLUTION

This document codifies the decision from the May 2 ecosystem refactor:

**BONDING** is the product. **C.A.R.S.** (Collaborative Affective Realtime Sim) is the internal engineering framework — the engine under the hood.

| Surface | Canonical Name | Internal Reference |
|---------|---------------|-------------------|
| Game at bonding.p31ca.org | BONDING | — |
| Simulation engine (SoupEngine class) | — | C.A.R.S. |
| NPM package | bonding-soup | — |
| Spatial world layer | The Soup | CARS social-molecules layer |
| Wire protocol | — | p31.carsWire/0.1.0 |
| Connect surface | connect.html | Mesh/CAGE handshake page |

The `docs/CARS-NAMING.md` in bonding-soup must reflect this: "BONDING is the product name used in all external-facing contexts. C.A.R.S. is the engineering framework name used in code, specs, and internal documentation." Update and close.

---

## 1. ARCHITECTURE — THE THREE LAYERS

C.A.R.S. operates as three concentric layers. Each layer has its own transport, tick rate, and verification path.

### Layer 1: Local Sim (SoupEngine core)

The single-player molecular simulation. Runs entirely in-browser. No network required.

**Source:** `src/soup.ts` (SoupEngine class)  
**Physics:** `src/soup-physics.ts` (deterministic, no rigid-body — emergent ecosystem driven by chemical properties + personality archetypes)  
**Reactions:** `src/reactions.ts` (thermodynamic context from SoupEngine)  
**Tick:** requestAnimationFrame → `SoupEngine.tick(dtMs)`  
**State:** Local Zustand store. Persisted via IndexedDB (idb-keyval) + `navigator.storage.persist()`  

Key constants (from spec):

| Constant | Value | Purpose |
|----------|-------|---------|
| BREATH_CYCLE_MS | 10000 | 4s inhale + 2s hold + 4s exhale |
| COHERENCE_PSI_FULL | 0.85 | Threshold for "fully coherent" state |
| COHERENCE_PSI_WARM | 0.5 | Threshold for "warm" state |
| FADE_HALF_LIFE_MS | 5000 | Ghost molecule fade curve |
| FADE_GHOST_ALPHA | 0.18 | Minimum ghost opacity before removal |
| ROOM_BASELINE_T | 295.15 K | 22°C baseline temperature |

Zone temperatures: Calm = 293.15 K (20°C), Warmth = 297.15 K (24°C), Belonging = 300.15 K (27°C).

**Verification:** `npm run verify:simulations` (chained check including soup engine sims)  
**TRIPER suite:** `tests/mvp/cars/cars.triper.test.mjs`

### Layer 2: Relay Mesh (Cloudflare KV polling)

The multiplayer layer. NOT real-time WebSocket streaming. Polling at 3–10 second intervals via Cloudflare KV.

**Transport:** Cloudflare KV polling (NOT Durable Objects, NOT WebSocket — this is a hard architectural constraint)  
**Relay Worker:** bonding-relay.trimtab-signal.workers.dev  
**Health probe:** /health endpoint  
**Tick:** 3–10s polling interval (adaptive based on activity)  
**Message format:** p31.carsWire/0.1.0 schema  

The relay is a bulletin board. Each player builds independently in a shared room. The relay broadcasts formula completion, LOVE earned, and ping reactions. No CRDT. No merge logic. No co-editing. This simplicity is what makes it work.

**Key message types** (from p31.carsWire.json, triple-locked):

| Type | Direction | Payload |
|------|-----------|---------|
| connectionInit | server → client | roster array |
| heartbeat | server → client | rising peerCount |
| moleculeStateUpdate | bidirectional | formula, completion, LOVE |
| ping | client → server → peers | reaction emoji (💚🤔😂🔺) |
| localRunbook | server → client | zone/difficulty config |

**Verification:** `npm run verify:cars-wire` (locks message type strings between mock-ws-server and SoupEngine)  
**Triple-lock:** Listed in `p31-alignment.json` as `cars-wire-triple-lock`  
**Mock server:** `Spikes/mock-ws-server/server.js`

### Layer 3: Connect Surface (Mesh Handshake)

The authentication and identity layer. Currently in CAGE WORKER PENDING state.

**Surface:** p31ca.org/connect.html  
**Worker:** `04_SOFTWARE/cloudflare-worker/passkey/` (WebAuthn ceremony)  
**Agent binding:** k4-personal Worker (subject_id minting)  
**Status:** Passkey Worker exists in repo. Routes not live. connect.html not linked from hub nav (hub routes Connect → /mesh).

Connect flow (target state):

1. User hits connect.html
2. WebAuthn register/begin → register/finish (passkey ceremony)
3. subject_id minted and bound to k4-personal Worker storage
4. CogPass profile resolved from subject_id
5. SoupEngine receives localRunbook with user's zone/difficulty preferences
6. Ghost molecule identity established for relay mesh

**Dependencies:** Blocks Education E3 portal, Poets/personal pages, any "personal" surface requiring auth.

---

## 2. OPTIMIZATION TARGETS

### 2.1 SoupEngine Performance

**Problem:** SoupEngine tick allocates objects per frame. At molecule counts > 50, GC pressure causes jank.

**Fix (same pattern as Spaceship Earth Phase 2 GC patch):**

- Hoist 6 scratch objects to module scope (vec3 temps, matrix temps, color temps)
- Replace `new Vector3()` / `new Color()` in animate loop with scratch object reuse
- Pool MeshDistortMaterial instances — one per element type, not per atom
- LOD already spec'd in soup-physics.ts — implement 3-tier: full (< 20 molecules), reduced (20–50), billboard (50+)

**Measurement:** `?perf=1` query param on bonding.p31ca.org/soup already exists. Target: 60fps with 50 local + 20 ghost molecules on Android tablet (Bash/Willow's devices).

### 2.2 Relay Optimization

**Problem:** KV polling at fixed interval wastes reads when room is idle, lags when room is active.

**Fix — Adaptive polling:**

| Room Activity | Poll Interval | Trigger |
|--------------|---------------|---------|
| Active (message in last 10s) | 3s | Any moleculeStateUpdate or ping |
| Warm (message in last 60s) | 5s | Decay from active |
| Idle (no messages > 60s) | 10s | Decay from warm |
| Background (tab hidden) | 30s | visibilitychange event |

**KV read budget:** Free tier = 100K reads/day. At 3s polling with 2 players, that's ~57,600 reads/day. Safe. At 10 players it breaks. The PLAN-BONDING-SOUP-WHEN-SCALE.md Phase 1 gate (`soup:room-scale`) is the trigger to evaluate Durable Objects migration.

### 2.3 Ghost Molecule Interpolation

**Problem:** At 2 Hz network updates, ghost molecules teleport visibly.

**Fix:** SoupEngine already has `computeMoleculeFadeAlpha()` for opacity. Add position interpolation:

- Store last 2 network positions per ghost
- Lerp between them over the poll interval
- On stale data (> 2 intervals missed), begin fade using existing FADE_HALF_LIFE_MS curve
- At FADE_GHOST_ALPHA (0.18), stop rendering (already spec'd)

### 2.4 Breath Sync Across Devices

**Problem:** Two devices in the same room should show synchronized breathing. Clock skew between devices causes drift.

**Fix:** Server heartbeat includes `serverClockMs`. Client computes offset on each heartbeat. `tickBreath(clockMs)` uses adjusted clock. Drift tolerance: ±200ms (imperceptible in 10s breath cycle).

---

## 3. ALIGNMENT CONTRACTS

### 3.1 Schema Registry

All CARS-related schemas and their verification paths:

| Schema | Location | Version | Verify Command |
|--------|----------|---------|---------------|
| p31.carsWire | cars-contract/p31.carsWire.json | 0.1.0 | verify:cars-wire |
| p31.alignment | p31-alignment.json | 1.0.0 | verify:alignment |
| p31.cognitivePassport | @p31/shared/cognitive-passport-schema.ts | current | verify:cognitive-passport-schema |
| p31.ground-truth | andromeda/.../p31.ground-truth.json | current | p31ca prebuild |

**Gap identified (May 2 refactor):** No schema versioning contract across schemas. When p31.cognitivePassport bumps to 2.0.0, nothing forces p31.carsWire to check compatibility.

**Resolution:** SCHEMA_VERSIONS constant in @p31/shared. All verify scripts assert against it. Schema bump → compile error until dependents update. This is the same pattern as the design token flow fix.

### 3.2 Triple-Lock Verification

The cars-wire triple-lock ensures message type strings are consistent across three surfaces:

1. `cars-contract/p31.carsWire.json` (canonical schema)
2. `Spikes/mock-ws-server/server.js` (test server)
3. `src/soup.ts` (SoupEngine client)

If any surface adds, removes, or renames a message type, `npm run verify:cars-wire` fails. This is non-negotiable. No message type changes without all three surfaces updating atomically.

### 3.3 TRIPER Checks (5 assertions)

From `tests/mvp/cars/cars.triper.test.mjs`:

1. `soup.ts` exists (SoupEngine entry point present)
2. SoupEngine file references WebSocket handling
3. SoupEngine incoming types are non-empty array
4. SoupEngine does NOT send labTelemetry (Sovereign Lab boundary — CARS is not telemetry)
5. No blocking sync `fs` calls (Cloudflare 10ms CPU limit compliance)

### 3.4 Design Token Alignment

CARS surfaces consume `p31-style.css` generated from `p31-universal-canon.json`. The `soup-quantum.css` file binds CSS custom properties to SoupEngine breath/coherence state:

```
--p31-breath-phase → SoupEngine.tickBreath().phase
--p31-coherence-psi → SoupEngine.tickCoherence().psi
--p31-zone-temperature → SoupEngine.getZoneTemperature()
```

**Gap:** `soup-quantum.css` hardcodes fallback hex values. These must derive from `p31-universal-canon.json` via the same `apply:p31-style` pipeline that generates `p31-style.css`.

**Fix:** Extend `apply:p31-style` to also generate `soup-quantum.css` fallback values. Add to `verify:design-tokens`.

---

## 4. INTEGRATION MAP

### 4.1 Inbound Integrations (things that feed into CARS)

| Source | Data | Entry Point | Status |
|--------|------|-------------|--------|
| CogPass v4.1 | User profile, zone prefs, difficulty | SoupEngine.parseLocalRunbook() | Schema done, runtime not wired |
| connect.html / Passkey | subject_id, auth state | Ghost molecule identity | CAGE WORKER PENDING |
| Command Center Worker | Operator shift state | localRunbook enrichment | Live (public /api/operator/shift) |
| BONDING game | Molecules built, achievements, LOVE | Local Zustand → SoupEngine state | Live |
| Breathing room | 4-4-6 rhythm input | SoupEngine.tickBreath() | Spec'd, not wired to device sync |
| Calcium logging | Med adherence | Molecule brightness modifier | Concept (partially in MEDIC agent) |

### 4.2 Outbound Integrations (things CARS feeds)

| Target | Data | Exit Point | Status |
|--------|------|-----------|--------|
| Spaceship Earth dashboard | Coherence (ψ), zone temps, molecule count | SoupEngine.tickCoherence() | Spec'd, SE in progress |
| LOVE ledger | Tokens earned per molecule/ping/reaction | SoupEngine events → Zustand | Live in BONDING |
| Relay mesh (other players) | moleculeStateUpdate, ping | KV write via relay Worker | Live |
| Andromeda mirror | soup/index.html forwards to notifyWarmEdge() | SoupEngine.onNetworkWarmEdge | Wired |
| p31-ecosystem.json glass probes | CARS health status | Probe endpoint | Needs new `cars-engine` probe |
| Personal start pages (mesh-start.html) | Soup demo link | Static link | Live |
| Planetary onboard | Door 4 gates room code/invite URL | URL params → SoupEngine room join | Wired |

### 4.3 Cross-Product Boundaries

**CARS ≠ Social Media Engine.** These are completely different systems sharing only the p31-alignment.json registry:

| | C.A.R.S. (SoupEngine) | Social Media Engine |
|---|---|---|
| Runtime | Browser (TypeScript/HTML) | Cloudflare Worker (Node.js) |
| Core | SoupEngine class | WAVE_CONTENT in worker.js |
| Network | KV polling + ghost molecules | HTTP APIs to Twitter/Bluesky/Mastodon |
| Verify | verify:cars-wire | verify:social-engine |
| Deploy | bonding.p31ca.org/soup | social.p31ca.org |

**CARS ≠ Sovereign Lab telemetry.** TRIPER check #4 enforces this: SoupEngine must never send labTelemetry. The Sovereign Lab boundary is a hard wall.

---

## 5. CONNECT SURFACE — IMPLEMENTATION PLAN

The connect.html → CARS pipeline is the critical path that unblocks auth-gated surfaces.

### Phase 1: Passkey Ceremony (blocks everything)

**Worker:** `04_SOFTWARE/cloudflare-worker/passkey/`  
**Routes (4):**

| Route | Method | Purpose |
|-------|--------|---------|
| /register/begin | POST | Generate WebAuthn challenge |
| /register/finish | POST | Verify attestation, mint subject_id |
| /authenticate/begin | POST | Generate assertion challenge |
| /authenticate/finish | POST | Verify assertion, return session |

**Storage decision (open):** KV vs D1 for credential records. KV is simpler (key = subject_id, value = credential blob). D1 enables relational queries (which credentials belong to which device). Recommendation: KV for Phase 1, migrate to D1 at scale.

**DoD:** connect.html performs full register → authenticate round-trip. subject_id minted and bound to k4-personal. New glass probe `passkey-roundtrip` green.

### Phase 2: CogPass Resolution

Once subject_id exists, resolve the user's CogPass v4.1 profile:

1. k4-personal Worker fetches profile from storage
2. Profile serialized as localRunbook payload
3. SoupEngine.parseLocalRunbook() ingests zone preferences, difficulty, display name
4. Ghost molecule identity established (display name + color from profile)

### Phase 3: Hub Nav Wiring

connect.html is currently orphaned — hub routes Connect → /mesh, not to connect.html.

**Fix:** Hub registry entry for connect surface. Hub card links to /connect. /mesh becomes an alias or redirects. The `scripts/hub/registry.mjs` entry:

```js
{
  id: 'connect',
  name: 'Connect',
  path: '/connect.html',
  status: 'live', // after Phase 1 deploys
  category: 'mesh',
  description: 'Passkey authentication and mesh identity'
}
```

---

## 6. MESH TOPOLOGY

The P31 mesh is a Delta topology (resilient, decentralized) replacing Wye topology (centralized, fragile). CARS is the social layer of this mesh.

### Current mesh nodes:

| Node | Type | Endpoint | Status |
|------|------|----------|--------|
| bonding-relay | CF Worker | bonding-relay.trimtab-signal.workers.dev | Live |
| command-center | CF Worker | command-center.trimtab-signal.workers.dev | Live |
| k4-personal | CF Worker | (KV-backed personal agent) | Deployed |
| k4-cage | CF Worker | qFactor + routing_protocol + HEAD/CORS/COOP | Live |
| passkey | CF Worker | (WebAuthn ceremony) | Repo exists, not deployed |
| bonding.p31ca.org | CF Pages | BONDING game + /soup | Live |
| p31ca.org | CF Pages | Hub + connect + education + dome | Live |
| phosphorus31.org | CF Pages | Institutional (Astro 5) | Live |

### Mesh health verification:

The 10-worker Cloudflare production fleet + KV-backed status dashboard is live. Glass probes in `p31-ecosystem.json` monitor health. Missing probe: `cars-engine` (SoupEngine-specific health — verify tick rate, ghost count, coherence ψ).

**Action:** Add `cars-engine` glass probe. Probe checks: SoupEngine.tick() executing, breath cycle within ±500ms of expected, coherence ψ calculable, relay polling active. Report via existing glass infrastructure.

---

## 7. ORDERED WCD SEQUENCE

| WCD | Scope | Effort | Dependencies |
|-----|-------|--------|-------------|
| WCD-CARS-OPT-01 | SoupEngine GC fix (scratch objects, material pooling) | 0.5 day | None |
| WCD-CARS-OPT-02 | Adaptive polling (3/5/10/30s intervals) | 0.5 day | None |
| WCD-CARS-OPT-03 | Ghost molecule position interpolation | 0.5 day | WCD-CARS-OPT-02 |
| WCD-CARS-OPT-04 | Breath sync (server clock offset) | 0.5 day | WCD-CARS-OPT-02 |
| WCD-CARS-ALIGN-01 | CARS-NAMING.md update + SCHEMA_VERSIONS constant | 0.5 day | None |
| WCD-CARS-ALIGN-02 | soup-quantum.css token derivation from canon | 0.5 day | WCD-CARS-ALIGN-01 |
| WCD-CARS-ALIGN-03 | cars-engine glass probe | 0.5 day | WCD-CARS-OPT-01 |
| WCD-CARS-CONNECT-01 | Passkey Worker deploy (4 WebAuthn routes) | 2 days | None |
| WCD-CARS-CONNECT-02 | CogPass → localRunbook pipeline | 1 day | WCD-CARS-CONNECT-01 |
| WCD-CARS-CONNECT-03 | Hub nav wiring (registry entry, /mesh alias) | 0.5 day | WCD-CARS-CONNECT-01 |
| WCD-CARS-INTEG-01 | Spaceship Earth ← SoupEngine coherence feed | 1 day | SE in progress |
| WCD-CARS-INTEG-02 | LOD implementation (3-tier molecule rendering) | 1 day | WCD-CARS-OPT-01 |

**Critical path:** WCD-CARS-CONNECT-01 unblocks the most downstream work. Everything auth-gated (Education E3, Poets, personal surfaces) is waiting on passkey.

**Parallel tracks:** OPT-01 through OPT-04 and ALIGN-01 through ALIGN-03 can run independently of the CONNECT sequence.

---

## 8. VERIFY BAR

After all WCDs close, the full CARS verify bar:

```bash
npm run verify:cars-wire          # Triple-lock message types
npm run verify:simulations        # SoupEngine sim checks
npm run verify:alignment          # p31-alignment.json integrity
npm run verify:design-tokens      # soup-quantum.css ← canon
npm run verify:cognitive-passport-schema  # CogPass schema
npm run verify:cognitive-passport-profiles  # CogPass profiles
npx vitest run                    # BONDING test suite (424/32 baseline)
# New:
npm run verify:passkey-roundtrip  # WebAuthn ceremony e2e
npm run verify:cars-engine-probe  # Glass probe health
```

All green. Then tag.

---

## 9. SOURCES

| Source | Location | What It Provided |
|--------|----------|-----------------|
| CARS-NAMING.md | bonding-soup/docs/ | Layer definitions, acronym breakdown |
| P31-CARS-SOCIAL-MOLECULES-SPEC.md | bonding-soup/docs/ | SoupEngine API, social molecule spec |
| soup-world-design.md | bonding-soup/docs/ | Physics engine, zone aesthetics |
| p31.carsWire.json | bonding-soup/cars-contract/ | Wire protocol schema |
| cars.triper.test.mjs | bonding-soup/tests/mvp/cars/ | 5 TRIPER assertions |
| PLAN-BONDING-SOUP-WHEN-SCALE.md | bonding-soup/docs/ | Phase gates, room-scale trigger |
| May 2 ecosystem refactor (chat) | Opus session | Naming resolution, schema gaps, design token flow |
| April 27 audit (chat) | Opus session | Track table, connect.html state, passkey Worker status |
| production-2026-04-28 tag | Both repos | Baseline state, glass scorecard |

---

*The mesh holds. The verify bar passes. The engine runs.*
