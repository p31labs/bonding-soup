# CWP — P31 Production Equilibrium — Final Wrap-Up (2026-04-28)

**CWP ID:** `CWP-P31-PROD-EQUILIBRIUM-WRAPUP-2026-04-28`  
**Status:** closed (as-built)  
**Owner:** Program integrator (human) + agent mesh (execution)  
**Primary outcome:** a **machine-enforced production readiness scoring system** plus a **portfolio-wide scoreboard** that converges proof, not vibes.

---

## 1) Executive summary (what shipped)

This wrap-up closes a program slice whose goal was to move P31 from “many surfaces” to **near-production equilibrium**: a portfolio that can be **scored**, **verified**, and **iterated** without drifting canonical truth.

### 1.1 Canonical artefacts introduced

- **`p31-production-readiness.json`** (`p31.productionReadiness/1.0.0`)
  - Declares the **PRS rubric** (10 dimensions × 10 points).
  - Contains **one row per hub card** (from `andromeda/04_SOFTWARE/p31ca/scripts/hub/hub-app-ids.mjs`).
  - Contains **one row per `workersVerified` Worker** (from `p31-live-fleet.json`).
  - Each row includes **scores**, **proof pointers**, and explicit **`nextSteps`** (remaining work).

- **`scripts/verify-production-readiness.mjs`**
  - Enforces coverage: **no missing hub ids**, **no missing live-fleet verified workers**, **no duplicate ids**.
  - Enforces numeric validity: each dimension is an integer **0..10**, total **0..100**.
  - Prints a **top-10** ranking for quick operator review.

- **Ship bar integration**
  - Root `package.json` includes **`verify:production-readiness`** inside **`npm run verify`**.
  - `p31-alignment.json` registers the PRS file + derivation edge documenting the proof hook.

### 1.2 What this achieves (why it matters)

- **Portfolio honesty:** the hub grid can no longer silently expand without a corresponding PRS row.
- **Parallel convergence:** multiple agents can work in parallel on different products, but **all merges must reconcile** against the same scoreboard + proof ladder.
- **Equilibrium definition becomes operational:** “production” is not a label; it is **a score band + proof commands + explicit remaining steps**.

---

## 2) Definition of done (closure criteria)

This CWP is complete when all of the following are true:

1. **PRS is canonical**
   - `p31-production-readiness.json` exists and validates under `verify:production-readiness`.

2. **PRS is enforced**
   - `npm run verify` runs `verify:production-readiness` and passes on a full checkout.

3. **Alignment registry knows about PRS**
   - `p31-alignment.json` lists the PRS file as a source and documents the derivation/proof hook.

4. **Reportability exists**
   - Operators can generate a ranked report from the JSON (mean, tier distribution, top/bottom).

### 2.1 Proof commands (closure)

Minimum proof (developer laptop / integrator):

```bash
npm run verify:alignment
npm run verify:production-readiness
```

Full home proof (includes PRS + the rest of the ship bar):

```bash
npm run verify
```

Stricter edge truth (when you want “live world” pressure):

```bash
P31_GLASS_STRICT=1 npm run ecosystem:glass
```

CI parity / release muscle (pick the bar you treat as non-negotiable):

```bash
MESH_LIVE_STRICT=1 npm run p31:ci
# or
MESH_LIVE_STRICT=1 npm run p31:all
```

---

## 3) System state at wrap-up (read this like an operator dashboard)

### 3.1 What is “most production-ready” right now (by PRS totals)

At the time of scoring, the top platform surfaces cluster around:

- **`p31ca` (Pages/hub + ground-truth spine)** — highest composite readiness among tracked pages.
- **`k4-personal` (mesh spine)** — highest readiness among tracked Workers.

This is consistent with the architecture: the hub and the personal mesh Worker are the **dual foundations** for most user journeys.

### 3.2 Portfolio shape (expected, not a surprise)

The mean score will be pulled down by a large cockpit grid containing many **P3/P4 concept cards**. That is healthy **if and only if** copy/status does not overclaim production.

**Governance rule going forward:** if a hub card says “live,” it must point to **proof** (probe, verifier, or test) or the label must be corrected.

---

## 4) Work completed vs deferred (explicit)

### 4.1 Completed in this slice

- PRS schema + scoreboard + enforcement in default verify.
- Initial scoring pass across:
  - all hub cards
  - all `workersVerified` Workers
- Alignment registry updates for discoverability.

### 4.2 Deferred (intentionally not claimed as “done”)

These remain real engineering programs; PRS makes them legible as **nextSteps**, not hidden debt:

- **Room-scale / WS hardening** for C.A.R.S. beyond current gates.
- **Education E3+** policy + portal completion (stateful progress + governance).
- **Hardware milestones** (Node Zero / Node One class work).
- **Passkey end-to-end** flows beyond stub/guardrails (if you want “Phase 5” fully real).
- **Monetary incident maturity** beyond health probes (webhook failure drills, idempotency proofs).

---

## 5) Handoff: how the next agents should operate (Sierpiński convergence rules)

### 5.1 The invariant triangle (3 parallel vertices → 1 apex)

For any production push, split work into **three parallel tracks** that only merge at a single apex proof:

- **Vertex A — Truth:** constants/fleet/ecosystem/hub registry/ground-truth alignment.
- **Vertex B — Edge:** Workers/DO/bindings/routes/performance/failure behavior.
- **Vertex C — Evidence:** tests/smoke/e2e/security gates/glass probes.

**Apex merge requires one proof class** (choose deliberately):

- **P0 apex:** `npm run verify` + strict glass (optional but recommended frequently)
- **P1 apex:** `MESH_LIVE_STRICT=1 npm run p31:ci`
- **P2 apex:** `MESH_LIVE_STRICT=1 npm run p31:all`

### 5.2 PRS workflow (how scores change)

When an agent improves a product:

1. Implement the work (code/deploy/docs as needed).
2. Add/adjust **proof hooks** (probe, verifier, test).
3. Update **`p31-production-readiness.json`**:
   - bump relevant dimensions
   - update `nextSteps` to reflect new frontier
4. Run:
   - `npm run verify:production-readiness`
   - `npm run verify` (or the apex proof for that stage)

**Rule:** PRS totals must move for a reason that a third party can audit in CI logs.

---

## 6) Risk register (top hazards at equilibrium boundary)

1. **Implied production via marketing copy** on P4 cards → trust damage.  
   Mitigation: honesty pass + registry status discipline.

2. **Flaky live probes** causing “red world” noise → operators ignore dashboards.  
   Mitigation: strict vs loose modes; probe timeouts; separate DNS vs workers.dev checks.

3. **Passkey boundary confusion** (same-origin vs workers.dev vs zone routes).  
   Mitigation: explicit RP_ID policy doc + failing tests for wrong assumptions.

4. **Monetary path incidents** without runbooks → panic deploys.  
   Mitigation: short incident checklist + webhook replay guidance.

5. **Parallel agents diverging canonical truth** → silent drift.  
   Mitigation: alignment derivations + “one source per concern” edits only.

---

## 7) Final operator checklist (30 seconds)

- [ ] `npm run verify` is green on the integration branch.
- [ ] `npm run verify:production-readiness` is green.
- [ ] If claiming “live edge”: `P31_GLASS_STRICT=1 npm run ecosystem:glass` is green.
- [ ] Hub cards labeled “live” have proof or are corrected.
- [ ] `p31-production-readiness.json` updated if readiness changed.

---

## 8) Appendix — SME agent prompts (reuse)

These prompts are intentionally short and strict; they are meant to be pasted into dedicated SME agents.

### 8.1 PRS maintainer agent

```text
ROLE: PRS maintainer.
TASK: Update p31-production-readiness.json so scores match observable proof only.
RULES: No score inflation without a verifier/probe/test; keep nextSteps honest.
PROOF: npm run verify:production-readiness && npm run verify
```

### 8.2 Alignment agent

```text
ROLE: Alignment engineer.
TASK: Fix drift between p31-constants.json, p31-live-fleet.json, ecosystem probes, and hub ground-truth.
RULES: One canonical source per concern; add derivations when introducing sinks.
PROOF: npm run verify:ecosystem && npm run verify:p31ca-contracts
```

### 8.3 Mesh spine agent

```text
ROLE: Cloudflare Workers engineer (k4 trio).
TASK: Harden contracts for health/mesh; reduce unknown failure classes; improve runbooks.
RULES: No URL changes without constants→apply→live-fleet alignment.
PROOF: mesh verify + strict glass mesh group green
```

### 8.4 Security agent

```text
ROLE: Edge security owner.
TASK: Keep allowlist/inventory truthful; validate passkey trust boundary; avoid secrets in static surfaces.
PROOF: p31ca security:check class gates + pqc:verify when touching crypto surfaces
```

### 8.5 Monetary agent

```text
ROLE: Stripe/Workers payments reliability.
TASK: Make donate-api boring: health, checkout, webhook correctness, incident checklist.
PROOF: strict glass monetary probes + targeted tests
```

---

## 9) Document control

- **Canonical path:** `docs/CWP-P31-PROD-EQUILIBRIUM-WRAPUP-2026-04-28.md`
- **Related machine artefacts:** `p31-production-readiness.json`, `p31-alignment.json`, `package.json` verify bar
- **Related operator docs (existing):** `docs/P31-ALIGNMENT-SYSTEM.md`, `docs/ECOSYSTEM-PRODUCTION-11.md`, `docs/PRODUCTION-STATE-2026-04-28.md`
