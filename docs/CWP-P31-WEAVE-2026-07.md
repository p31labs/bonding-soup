# CWP-P31-WEAVE-2026-07 — the Smart Weave (mesh sync, message integration, physics-shaped entanglement)

**Status:** plan v1.1.0 (no code yet — Opus 4.6 web critique absorbed; awaiting operator *proceed* before W-1)
**Edition:** 1.1.0 (post-Opus critique 2026-05-02 — see §11)
**Authored:** 2026-05-02 (v1.0.0); revised 2026-05-02 (v1.1.0)
**Schema:** `p31.controlledWorkPackage/1.0.0`
**Sister CWPs:** `CWP-P31-PEER-COMP-2026-05` (peer comparison + ecosystem gap closure), `CWP-P31-VIBE-2026-06` (Tetra-hub vibcoding development environment)
**Operator quote:** *"mesh sync and message integration thoroughout the ecosystem. get some cool entanglement features and other cool physics heavy additions baked in as well. the SMART WEAVE. the neon lights are flickering."*

---

## 1. Why now

The mesh primitives are all in tree (`k4-personal` Durable Object, `simplex-v7`, fleet of ten Workers, K₄ + sigma-model + Larmor + tetra primitives, six Three.js K₄ visualizations including `connect.html`, `geodesic.html`, `bonding.html`, `attractor.html`, `axiom.html`, `bridge.html`). What is missing is the **traffic** — vertices today carry presence and per-vertex state, but no envelope, no edge-aggregation, no cross-vertex propagation, no live visualization of flow. The neon lights are wired but no current is going through them.

This CWP names that absent layer **the Smart Weave**. It is the message + sync substrate that turns the static K₄ into a live K₄. It honours `CWP-P31-VIBE-2026-06` §4.5 ephemeralization (one source, many surfaces) and the established physics doctrine in `docs/SIC-POVM-K4-ARCHITECTURE.md` and `docs/SIC-POVM-MATHEMATICAL-APPENDIX.md`. **No new physics is invented.** Every "physics" word below traces to an existing artefact.

---

## 2. Existing primitives (the floor — do not duplicate)

| Primitive | Path | Role in Smart Weave |
|---|---|---|
| `k4-personal` Durable Object | `andromeda/04_SOFTWARE/k4-personal/src/index.js` | per-user K₄ (a / b / c / d). Adds `/weave/*` endpoints in W-3. |
| `k4-cage` Worker | `andromeda/04_SOFTWARE/k4-cage` (legacy) | family K₄ (will / S.J. / W.J. / christyn). Mirrors the `/weave/*` shape. |
| `simplex-v7` | `simplex-v7/` | already a SIMPLEX + SENTINEL chain. Receives `weave-emit` envelopes when an operator action fans out cross-cluster. |
| Larmor Hz | `p31-constants.json` `larmorHz: 863` (³¹P in Earth field) | the **phase reference** for reconciliation cadence. Visible flicker = 863 ÷ N (W-5). |
| SIC-POVM 4-vector | `docs/SIC-POVM-K4-ARCHITECTURE.md` | each envelope carries one of four `channel`s: physical · network · compliance · UX. |
| Sigma-model | `docs/MESH-ARCHITECTURE-CANON.md` | edge tension under traffic. W-5 uses the existing language, no new metaphor. |
| Mesh pulse | `scripts/p31-local-command-center.mjs` `/api/mesh-pulse` | already polls; W-2 makes its data per-edge instead of per-vertex. |
| Three.js K₄ navigator | `andromeda/04_SOFTWARE/p31ca/public/connect.html` (r160) | the surface where W-5 lights the edges. **Exists today, edges are inert.** |
| Cognitive Passport | `cognitive-passport/index.html` | each vertex carries a passport JSON; W-3 envelopes reference passport hash, never PII. |
| OQE icosa | `andromeda/04_SOFTWARE/p31ca/public/oqe-icosa.html` + `p31-oqe-twenty.json` | future-tense W-7+ — the 20-face icosahedron is the dual lattice for cluster federation, not part of W-1..6. |

---

## 3. Definition — the Smart Weave is **five things**, not one

1. **Envelope.** A single typed JSON shape (`p31.weaveEnvelope/1.0.0`) every cross-vertex message conforms to. Schema lives in `weave-contract/`.
2. **Topology-aware routing.** Senders address an *edge* or a *vertex*, never a user-id. The DO resolves edges from K₄ adjacency, not a directory.
3. **Larmor-cadenced reconciliation.** Edges reconcile state on a slow multiple of the 863 Hz Larmor period (visible cycle ≈ 1–2 Hz; per-beat aggregation under the hood).
4. **Entanglement primitive.** A pair of vertices may opt to share a derived counter (G-counter for additive accumulators, LWW for last-touched). Update on one becomes visible on the paired vertex within one visible Larmor cycle. **Classical CRDT, physics-flavored cadence — not actual quantum entanglement; doc & UI MUST NOT overclaim.**
5. **Visualization.** `connect.html` (and any other K₄-rendering surface) subscribes to a feed of recent envelopes and modulates edge brightness, thickness, and sigma-model bend by recent traffic. The flicker IS the network state.

---

## 4. Physics vocabulary — what it means in code (no new words)

| Word | Code thing | Honest description |
|---|---|---|
| **Larmor pulse** | `setInterval(reconcile, 1000 / 863 * N)` where `N ≈ 432` → ~1 Hz visible | a clock signal derived from the operator-locked ³¹P Larmor constant in `p31-constants.json`. Display only — no NMR is happening. |
| **Sigma-model deformation** | edge bend curvature in Three.js as a function of recent envelope count | metaphor borrowed from established physics docs in `docs/SIC-POVM-MATHEMATICAL-APPENDIX.md`. Visual only. |
| **SIC-POVM 4-vector** | each envelope's `channel: "physical" \| "network" \| "compliance" \| "ux"` | already canonical in `docs/SIC-POVM-K4-ARCHITECTURE.md`. We are just reusing it as a discriminator. |
| **Entanglement** | LWW + G-counter CRDT shared across two K₄ vertex DOs | classical, deterministic, no FTL. The "feel" comes from the Larmor-cadenced reconciliation pulse and the paired visual flicker. |
| **q-factor / trimtab** | weight on the reconciliation interval (high q = slower decay, low q = quick settle) | borrowed from `docs/EGG-HUNT.md` and oracle persona. Tuned per edge, not per envelope. |
| **OQE icosa (future)** | 20-face dual lattice for cluster federation | reserved for W-7+; out of scope for this CWP. |

---

## 5. Phase ladder (W-1 through W-5; W-6 deferred)

Each phase ships independently, has a verify gate, and adds zero new attack surface beyond what the gate proves. **Each phase is a single PR pair (home + andromeda mirror).** **Order rebuilt around Opus §6: W-1 is now the MVP that lights the cage with data that already exists, before any new envelope is defined.**

### W-1 — Per-edge mesh pulse counters (the MVP — light the cage with what already flows)

**Per Opus §6:** *"the minimum viable Smart Weave. No new schema, no new endpoint, no CRDT, no envelope format — just extending the existing `/api/mesh-pulse` response with per-edge event counts derived from what already flows through the system."*

- **Extend:** `scripts/p31-local-command-center.mjs` `/api/mesh-pulse` to return `edgeCounters: { "a--b": { last60s, last5s, lastTs } }` per K₄ edge.
- **Extend:** `andromeda/04_SOFTWARE/k4-personal/src/index.js` — DO **alarm-based** scheduling (`storage.setAlarm`), 1 alarm/sec/DO floor, NOT external poll. (Per Opus §1, KV's 1000 writes/sec global limit is approached fast otherwise.)
- **Source events** (no new schema; counts already exist):
  - command-center cmd-mode runs (whitelisted action invocations)
  - fleet-probe results (per-persona presence)
  - BONDING session opens (when bonding.p31ca.org is later wired in)
  - agent-hub Worker hits
- **Extend:** `andromeda/04_SOFTWARE/p31ca/public/connect.html` — long-poll `/api/mesh-pulse` every 5s; modulate edge opacity = `0.2 + 0.8 * tanh(last60s / 10)`, thickness = `base + 0.5 * tanh(last5s / 3)`. (Sigma-model bend deferred per Opus §4.2.)
- **Cold-start vs slow:** UI distinguishes a DO cold-start (200ms+ first-pulse latency after eviction) from an actual cold edge (no traffic in 60s). Per Opus §3.
- **Verify gate:** existing `verify:mesh` extends with one assertion (`pulse.edgeCounters` shape).
- **Visible result:** `npm run command-center` → `/desk` shows a K₄ matrix with last-60s edge counts; `/connect` (hub) shows the same data as a Three.js cage that breathes.
- **Subrequest budget:** 1 KV/DO read per pulse poll. Cage broadcast: 4 (one per personal DO).
- **Net diff budget:** ≤ 250 lines.
- **Acceptance (A1):** cage flickers within 1 Larmor visible cycle (≈ 1 sec) of an operator action firing.

### W-2 — Envelope schema + JSON Schema + verify gate

- **New files:**
  - `docs/schemas/p31-weave-envelope.schema.json` — **JSON Schema Draft 2020-12** (per Opus §5.1; same pattern as `cognitive-passport-schema.json`)
  - `weave-contract/README.md` — one paragraph + canonical fixture
  - `weave-contract/fixtures/envelope-presence.json`
  - `weave-contract/fixtures/envelope-love-totals.json`
  - `andromeda/04_SOFTWARE/packages/shared/src/weave-envelope.ts` — TS types, `@p31/shared/weave-envelope`
  - `scripts/verify-weave-envelope.mjs` (per Opus §5.2)
- **Envelope shape (post-Opus tightening):**
  ```jsonc
  {
    "v": 1,                                      // integer; readers accept v <= current+1; unknown kind = log+skip
    "id": "01HZTKK...",                          // ULIDv2 (Crockford base32, 128-bit) — first 48 bits are ms timestamp
    "ts": "2026-05-02T21:42:00.000Z",            // ISO 8601 UTC; redundant with id timestamp prefix (kept for human readability)
    "from": { "scope": "personal" | "cage",      // ENUM (Opus §2 — type-narrowed; "cluster" deferred to W-7+)
              "vertex": "a|b|c|d|will|sj|wj|christyn" },
    "to":   { "kind": "vertex" | "edge" | "broadcast",   // ENUM
              "ref":  "<vertex-id>" | "<vertexA>--<vertexB>" | "*" },
    "channel": "physical" | "network" | "compliance" | "ux",   // OPTIONAL, default "network" (per Opus §1)
    "kind": "presence" | "love-totals" | "state-delta" | "passport-touch" | "operator-action",
    "body": { /* Record<string, unknown>, max 4 KiB serialized — per Opus §2.3 */ },
    "seq": 42,                                   // monotonic per from.vertex; receiver rejects seq <= lastSeen[vertex] (Opus §3.3 replay defence)
    "ttl": 86400                                 // OPTIONAL seconds (default 86400 = 24 h); Opus §2.4 — eligible for GC after ts+ttl
  }
  ```
- **Dropped from v1.0.0 wire format:** `larmorPhase` (compute client-side from `id`-timestamp `% 863`); `qFactor` (now on vertex state, returned by `GET /weave/state`).
- **Verify gate:** `verify:weave-envelope` (schema parses as valid JSON Schema; TS type structurally compatible via fixture round-trip; 100-per-edge cap matches `p31-constants.json`).
- **Files affected (count):** 6 new, 3 modified (`p31-alignment.json` + `package.json` `verify` chain + this CWP cross-reference).
- **Net diff budget:** ≤ 200 lines.

### W-3 — Envelope on the wire (append-only feed; W-4 adds state)

**Explicit boundary (Opus §1.4):** W-3 is **append-only feed only**. Received envelopes are stored and readable, but they do **not** mutate vertex state. State convergence is W-4's job. Agents extending W-3 must NOT invent ad-hoc state management.

- **New `k4-personal` endpoints:**
  - `POST /agent/:userId/weave/emit` — validate envelope schema + `seq` monotonicity; store last 100 per edge.
  - `GET  /agent/:userId/weave/feed?edge=<edgeRef>&since=<id>` — read recent envelopes for an edge.
  - `GET  /agent/:userId/weave/state` — derived edge state (counters from W-1, last-emitter, last-channel, qFactor).
- **Cage scope mirror:** same three endpoints on `k4-cage`.
- **Rate limit (per Opus §3.6):** 10 envelopes per `from.vertex` per minute at the **ingress**, not just storage.
- **Catch-up mode (per Opus §3.7):** SSE/poll client on reconnect → `GET /weave/feed?since=<lastSeenId>` first, then resumes live stream. Backoff: process buffered envelopes in batches of 10 with 100ms delay.
- **Verify gate:** `verify:weave-wire` (Miniflare fixture: emit → feed reads back; emit with bad envelope → 400 with JSON Schema path in body; emit with `seq <= lastSeen` → 409).
- **Subrequest budget per emit:** 1 (DO storage write); cage broadcast → 4.
- **Net diff budget:** ≤ 350 lines.

### W-4 — Entanglement primitive (CRDT, alarm-cadenced)

- **New module:** `andromeda/04_SOFTWARE/k4-personal/src/entangle.js`
  - `entangleEdge(edgeRef, kind)` — `kind: "love-totals" | "presence" | "lastTouched" | "passportHash"`
  - **G-counter** (per-vertex sub-counters, sum-on-read) for `love-totals`
  - **LWW** for `lastTouched` / `presence` / `passportHash`
  - **LWW tiebreaker (per Opus §3.2):** ULID timestamp embedded in envelope `id` (server-set at emitting DO), **NOT** `Date.now()` at receiving DO. Cloudflare edge clock skew (50–200ms) makes receiver-local Date.now() unsafe.
- **Reconciliation:** DO `storage.setAlarm` based, **1 alarm/sec/DO floor** (per Opus §1.1, NOT external 500ms poll).
- **Stale-not-absent (per Opus §3.4):** `Date.now() - lastTouched > 48h` → display flag `quiet`, NOT deletion. Visualization dims; data stays.
- **Endpoint:** `POST /agent/:userId/weave/entangle` to opt edge in/out (idempotent).
- **Doc note (operator-locked language, do not soften):** `docs/MESH-ARCHITECTURE-CANON.md` extends with one paragraph — *"Entanglement here is classical CRDT convergence on a Larmor-derived alarm cadence. Quantum entanglement language is metaphor for the cadence and the paired visual flicker only; no FTL, no measurement collapse, no Bell-inequality claim."*
- **Verify gate:** `verify:weave-entanglement` — deterministic CRDT convergence test (two emitters, three updates each; asserts convergent state in ≤ 3 alarm windows).
- **Net diff budget:** ≤ 300 lines.

### W-5 — Richer visualization (channel colour + thickness; sigma-bend deferred)

- **Extend:** `connect.html` (already lit by W-1).
  - Edge **channel colour:** physical = phosphorus, network = teal, compliance = coral, ux = paper (existing `andromeda/04_SOFTWARE/design-tokens/p31-universal-canon.json`).
  - Edge **thickness** modulated by `last5s` (already in W-1; reaffirmed here as an envelope-aware signal once W-3 lands).
  - **Global Larmor pulse:** subtle 1-Hz brightness oscillation of the whole cage, phase-locked to `(Date.now() % (1000 / 863 * 863)) / 863`. Visible only — no NMR is happening.
  - **SSE upgrade** (replaces W-1's 5s long-poll): `/weave/sse` stream from `k4-personal` DO; reconnect uses W-3's catch-up mode.
  - **Stretch goal (post-merge):** sigma-model bend (deformation of edge midpoint by qFactor) — deferred per Opus §4.2; ship opacity+thickness+colour first, add bend only if operator wants it after a week of use.
- **New file:** `docs/operator/WEAVE-FIELD-GUIDE.md` (per Opus §5.3) — same Tier-A voice as `BOOT-UP-AND-USE.md`, 6 moves: open `/connect` → see warm edges → emit a presence ping → watch the edge light up → check entangled state on `/weave/state` → done. Register as view-mode slug `weave-guide`. Verifier auto-detects the new slug via dual-contract gate.
- **Verify gate:** existing `verify:demos` extends; visual is necessarily manual.
- **Net diff budget:** ≤ 250 lines.

### W-6 — DEFERRED: PHOS as bridge persona (re-scope as separate CWP after one month of usage)

**Per Opus §4.3:** *"PHOS already has the auto-guidance hook. Adding weave-aware routing suggestions is a second integration surface with the same persona. Ship W-1 through W-5 with PHOS unaware of the weave. Once the weave is live and the operator has used it manually for a month, THEN add PHOS awareness based on real usage patterns, not speculative ones."*

This phase is **moved out of the WEAVE CWP**. When the operator has used W-1..W-5 for ≈ 30 days and has a clear sense of what routing suggestions would help, a follow-up CWP (provisional id `CWP-P31-WEAVE-PHOS-2026-XX`) will be authored against real usage patterns, not speculation.

---

## 6. Out of scope for THIS CWP

- **W-7+ federation:** four tetras → one cluster, four clusters → one hub. Sketched in `CWP-P31-VIBE-2026-06` Phase 5/6, gated on `CWP-P31-PEER-COMP-2026-05` Phase 3A (MLS) funding.
- **Cross-cluster MLS-bearing edges.** Funding-gated.
- **Audio / video weave.** Text + state only. `docs/PUBLIC-VOICE.md` Tier B avoid-list applies.
- **Push notifications.** The operator fights notification overload by policy (per `CLAUDE.md` §1, `.cursorrules` §1). The Smart Weave is **pull** — the visualization breathes when you look at it.
- **Quantum-mechanical claims.** The word *entanglement* is a metaphor for a CRDT cadence. Public copy MUST say this in plain language wherever the word appears (W-4 doc note + W-5 callout under the cage).

---

## 7. Acceptance criteria (the green-light bar for "we can call it Smart Weave")

| # | Phase | Acceptance |
|---|---|---|
| A1 | W-1 | `/api/mesh-pulse` JSON has `edgeCounters` for at least one personal K₄. `connect.html` cage flickers within 1 Larmor visible cycle (≈ 1 sec) of an operator action firing. `verify:mesh` extended GREEN. **This alone is the MVP — everything below is enrichment.** |
| A2 | W-2 | `verify:weave-envelope` GREEN. `@p31/shared/weave-envelope` importable. JSON Schema file parses + TS type round-trips a fixture. |
| A3 | W-3 | `verify:weave-wire` GREEN. Manual: `curl POST /weave/emit` → `curl GET /weave/feed` round-trips. Bad envelope → `400` with JSON Schema path in body. Replay (`seq <= lastSeen`) → `409`. Rate-limited at 10 envelopes/vertex/minute. |
| A4 | W-4 | `verify:weave-entanglement` GREEN. Two-emitter CRDT test converges in ≤ 3 alarm windows. LWW tiebreaker uses ULID timestamp from envelope `id`, not receiver `Date.now()`. Stale > 48h displays as `quiet`, never deleted. Doc note about classical-only is committed. |
| A5 | W-5 | Channel colour + Larmor pulse + SSE live update visible on `connect.html`. `WEAVE-FIELD-GUIDE.md` reachable as `weave-guide` view slug. Manual visual verification recorded as `glass-box.html` synthetic playback. |
| **Smart Weave is shipped when A1 alone is GREEN — the cage breathes.** A2–A5 are layered enrichments; each is its own ship moment. |

---

## 8. Files that will be touched (whole CWP, post-Opus tightening)

**New files (10):**
- `docs/schemas/p31-weave-envelope.schema.json` (JSON Schema 2020-12; **moved here per Opus §5.1**)
- `weave-contract/README.md`
- `weave-contract/fixtures/envelope-presence.json`
- `weave-contract/fixtures/envelope-love-totals.json`
- `andromeda/04_SOFTWARE/packages/shared/src/weave-envelope.ts`
- `andromeda/04_SOFTWARE/k4-personal/src/entangle.js`
- `andromeda/04_SOFTWARE/k4-personal/test/weave.test.js`
- `scripts/verify-weave-envelope.mjs`
- `scripts/verify-weave-wire.mjs`
- `scripts/verify-weave-entanglement.mjs`
- `docs/operator/WEAVE-FIELD-GUIDE.md` (W-5; new view-mode slug `weave-guide`)

**Extended files (7):**
- `andromeda/04_SOFTWARE/k4-personal/src/index.js` (+ `/weave/*` endpoints, edge counters, alarm-based reconciliation)
- `andromeda/04_SOFTWARE/p31ca/public/connect.html` (W-1 long-poll → W-5 SSE; opacity + thickness + channel colour + Larmor pulse)
- `scripts/p31-local-command-center.mjs` (per-edge `/api/mesh-pulse`, optional `/api/weave/*` proxy for local-only operators; `weave-guide` slug in `DOC_SLUG_ALLOWLIST`)
- `command-center-terminal.html` (`weave-guide` slug in `VIEW_SLUGS`)
- `docs/MESH-ARCHITECTURE-CANON.md` (entanglement-is-CRDT paragraph)
- `p31-alignment.json` (sources + derivations + `verifyPipeline.scripts` × 3)
- `package.json` (3 new verify gates added to `verify` chain → **86 gates** at full landing; 84 after W-1 alone)

**Cut from v1.0.0:** `weave-contract/p31.weaveEnvelope.json` (consolidated into `docs/schemas/p31-weave-envelope.schema.json` per Opus §5.1); `scripts/verify-weave-phos.mjs` (W-6 deferred per Opus §4.3).

**No deletes from existing tree. No CDN dependencies. No new npm packages.**

---

## 9. Operator handoff — first concrete next step (post-Opus)

When the operator says *proceed* on this CWP v1.1.0, the agent will:

1. Open **W-1 only** (per-edge mesh pulse counters — the MVP that lights the cage with data that already flows).
2. Extend `/api/mesh-pulse` (`scripts/p31-local-command-center.mjs`) and the `k4-personal` DO with `edgeCounters`, on a **DO alarm-based** schedule (not external poll).
3. Wire `connect.html` to long-poll the new shape and modulate edge opacity + thickness.
4. Extend `verify:mesh` with the `pulse.edgeCounters` shape assertion.
5. One PR pair (home + andromeda mirror).
6. **Stop.** Wait for the operator to (a) see the cage breathe in `/connect` or `/desk`, then either (b) say `proceed` for W-2 (envelope schema), (c) request a tuning of the opacity/thickness curves, or (d) answer the §12 open questions before W-3.

**Do NOT** start W-2 until W-1 is merged AND the operator has looked at the breathing cage. **Do NOT** put `larmorPhase` or `qFactor` on the wire. **Do NOT** invent W-6 / W-7. **Do NOT** soften the "classical CRDT, entanglement is metaphor" boundary in any prose surface.

The cage breathes after W-1. Schema lands at W-2. Real envelopes flow at W-3. State converges at W-4. Colour and Larmor pulse arrive at W-5. PHOS-as-bridge is a separate future CWP.

---

## 10. The first prompt (for Claude Opus 4.6 web) — DELIVERED 2026-05-02

The self-contained briefing prompt was delivered in the operator's chat thread on 2026-05-02. Opus 4.6 web returned a 7-section critique (1,189 words). The critique is folded into this CWP at v1.1.0 — see **§11 Absorption ledger**. The critique itself is preserved in the operator's session log; it is not archived in tree because (a) the high-confidence edits live in §5/§7/§8, (b) the open questions live in §12, and (c) preserving the full critique would create a second source of truth for decisions already merged into the plan.

---

## 11. Absorption ledger — Opus 4.6 web critique 2026-05-02

Web Opus delivered a 7-section critique. Every high-confidence edit was absorbed into v1.1.0 in-place. This ledger names what changed, what was deferred, and what was declined.

### Absorbed into the schema (W-2)

| Opus § | Change | Where it landed |
|---|---|---|
| §1.2 + §4.1 | Drop `larmorPhase` from envelope; compute client-side from ULID timestamp `% 863` | §5 W-2 schema; §8 cut list |
| §1.3 | Drop `qFactor` from envelope; move to vertex state on `GET /weave/state` | §5 W-2 schema; §5 W-3 endpoint description |
| §2.1 | Pin ULIDv2 (Crockford base32, 128-bit); first 48 bits = ms timestamp | §5 W-2 schema; §5 W-4 LWW tiebreaker |
| §2.2 | Type-narrow `from.scope` and `to.kind` to enums | §5 W-2 schema |
| §2.3 | `body: Record<string, unknown>` with 4 KiB serialized cap | §5 W-2 schema |
| §2.4 | Add `ttl` (seconds, optional, default 86400) | §5 W-2 schema |
| §2.5 | Forward-compat: accept `v ≤ current+1`, log+skip unknown `kind`, ignore unknown fields | §5 W-2 schema (`v: 1` field comment) |
| §3.3 | Add `seq` (monotonic per `from.vertex`) for replay protection | §5 W-2 schema; §5 W-3 endpoint validation |
| §1.7 | Make `channel` optional, default `"network"` | §5 W-2 schema |
| §5.1 | Move schema to `docs/schemas/p31-weave-envelope.schema.json` (JSON Schema Draft 2020-12) | §5 W-2 file list; §8 new files |
| §5.2 | Add `verify:weave-envelope` gate (already in v1.0.0; reaffirmed) | §5 W-2 verify gate |

### Absorbed into runtime (W-1, W-3, W-4)

| Opus § | Change | Where it landed |
|---|---|---|
| §1.1 | Move reconciliation to DO alarm-based scheduling, 1 alarm/sec/DO floor | §5 W-1 + W-4 |
| §1.5 | Add subrequest budget per phase | §5 W-1 + W-3 (per-phase budget rows) |
| §1.6 | Backpressure: catch-up mode batches 10 envelopes with 100ms delay | §5 W-3 |
| §3.6 | Rate-limit ingress at 10 envelopes/vertex/min (not just storage cap) | §5 W-3 + §7 A3 |
| §3.7 | SSE reconnect → `GET /weave/feed?since=<lastSeenId>` first, then resume | §5 W-3 + §5 W-5 |
| §1.4 | Make explicit: W-3 is append-only feed; W-4 alone mutates state | §5 W-3 boundary callout |
| §3.1 | UI distinguishes DO cold-start from cold edge | §5 W-1 |
| §3.2 | LWW tiebreaker uses ULID timestamp from envelope `id`, not receiver `Date.now()` | §5 W-4 + §7 A4 |
| §3.4 | Stale entanglement (>48h) displays as `quiet`, never deleted | §5 W-4 + §7 A4 |

### Absorbed by reordering (Opus §6 — the most important single edit)

**v1.0.0 W-2 (per-edge mesh pulse) is now v1.1.0 W-1 — the MVP.** v1.0.0 W-1 (envelope schema) is now v1.1.0 W-2. The cage breathes BEFORE any new envelope format is defined. Per Opus §6: *"W-2 lights up edges using messages that already do exist."*

### Absorbed by deferral

| Opus § | Deferral | Where |
|---|---|---|
| §4.2 | Sigma-model bend deferred from W-5 baseline; opacity+thickness+colour ship first | §5 W-5 stretch goal |
| §4.3 + §6 | PHOS-as-bridge (was W-6) re-scoped as a separate future CWP after ≈ 30 days of real W-1..W-5 usage | §5 W-6; §6 out of scope |

### Absorbed as new W-5 deliverable

| Opus § | Addition | Where |
|---|---|---|
| §5.3 | `docs/operator/WEAVE-FIELD-GUIDE.md` operator runbook (same Tier-A voice as `BOOT-UP-AND-USE.md`); register as view-mode slug `weave-guide` | §5 W-5 + §8 new files |

### Declined

None. All 7 of Opus's sections were either absorbed in-place, deferred with explicit rationale, or routed to §12 as questions only the operator can answer.

---

## 12. Operator open questions — required before W-3 (verbatim from Opus §7)

W-1 and W-2 can ship without operator answers (they touch only counters and a schema). W-3 (envelope on the wire) is when these decisions become load-bearing:

1. **Default entanglement scope for children's vertices.** When S.J.'s tablet joins the mesh, does her personal DO automatically entangle with Will's (presence sharing, lastTouched sync), or does Will explicitly opt each child vertex into entanglement? Default-on is warmer but means the child's presence data flows to the cage immediately. Default-off requires the operator to take an action he may forget (executive dysfunction).

2. **Cage broadcast permissions.** Can any vertex emit to the cage (broadcast), or only the operator? If Brenda (ADA support) can broadcast, her presence pings reach all four vertices. If only the operator can broadcast, Brenda's pings are edge-only (Will↔Brenda). This is a trust architecture decision, not an engineering one.

3. **Envelope retention after vertex consecration (remembrance protocol).** When a vertex is consecrated (permanently gone), do its historical envelopes persist as a memorial archive, or are they garbage-collected normally? The grief architecture from earlier work suggests persistence — but 100 envelopes × 6 edges = 600 records that never expire. Trivial storage, real policy decision.

4. **Weave feed visibility on the public hub.** Should `p31ca.org/connect` show live edge traffic to unauthenticated visitors (ambient visualization), or only to authenticated mesh members? Public = impressive demo for grant reviewers. Private = consistent with cage isolation. A middle path: show aggregate edge activity (warm/cold binary) publicly, envelope-level detail only to authenticated vertices.

5. **Love-total G-counter — who increments?** The CWP says BONDING sessions, pings, and agent runs increment love. Does the operator's daily verify run (83 gates, ~90 seconds) count as an operator-action that increments love? If so, every `npm run verify` warms the mesh. If not, love is strictly human-initiated. The answer shapes whether the mesh feels alive during the operator's deep-work blocks or only during explicit family interaction.

When the operator answers these (in this thread or in any chat), the agent will fold the answers into W-3's design notes before opening that PR pair.
