# Quantum egg hunt

**Meaning (not marketing):** These are the repo’s **intentional off-path states**—extra routes, dev-phase URLs, and weak links. The manifest uses a **SIC-POVM** metaphor: each row behaves like a rank-1 effect in a 4-vertex (K₄) product story, with **Larmor frequency** **locked** to `p31-constants.json` → `physics.larmorHz` in the **dome** and **hub** trim UI. For a compact **four-vector** map (physical / network / compliance / UX) without prose bloat, see **`docs/SIC-POVM-K4-ARCHITECTURE.md`**. For **definitions** of POVM / SIC / the qubit \(|\langle\psi_j|\psi_k\rangle|^2 = 1/3\) identity, see **`docs/SIC-POVM-MATHEMATICAL-APPENDIX.md`**.

**What runs in CI** (`docs/egg-hunt-manifest.json`, schema **`p31.quantumEggHunt/1.0.0`):

1. **Operators** (substring anchors per file).
2. **Pauli check** — `hub-landing.json` must not contain `"/orchestrator"` (orchestrator page stays out of the hub-landing *subspace*).
3. **Larmor coherence** — the string **`{larmor}Hz`** from `p31-constants.json` must appear in `dome.astro` and `index.astro` (ties UI to the same canonical 31P line as the rest of P31).

**Verify as presence (OQE for joy):** Most verify steps ask “does it work?” Egg-hunt asks “**is it still there?**” Removing an anchor string is a regression the same way removing a test would be—the manifest is **Objective Quality Evidence** that intentional off-path / human touches were not optimized away.

**Physics Learn (repo-local) eggs** — same manifest; no `andromeda/` required:

| ID | Operator | Vertex | Trigger | Source file |
|----|----------|--------|---------|-------------|
| PHYSICS-FULLER-EGG | weak-coupling | 4 | Screen-reader-only Fuller quotation | `docs/physics-learn/index.html` |
| PHYSICS-COORD-EGG | weak-coupling | 4 | Home lat/lon signature in HTML comment | `docs/physics-learn/index.html` |
| PHYSICS-LARMOR-MS-EGG | povm-measurement | 2 | `863ms` animation on `.p31-egg-larmor-ms` (Larmor as *timebase* in CSS) | `docs/physics-learn/index.html` |

**Also manifest-locked (joy + ops):**

| ID | What | Where |
|----|------|-------|
| SOUP-LOV-REACTION | Li+V → `LOV` synthesis label + disclaimer | `src/reactions.ts` |
| SOUP-LOV-SPAWN | `?egglov=1` seeds Li+V (`spawnEggLovSandbox`) | `soup.html` + `SoupEngine` |
| SIMPLEX-ORACLE-SPOON-EGG | At **0/12** spoons, ORACLE output appends *“Empty cup, full day. Rest.”* (online + offline stub) | `simplex-v7/src/agents/runner.ts` |

**Sketch / not yet manifest-locked:** further ORACLE template prose beyond the single benediction line; additional hub-only eggs.

**Why eggs stay in CI:** They are load-bearing **play**—curiosity on-ramps that cost no “should I open this?” decision. They do not replace accommodations; they prove there is still person left after risk, law, and medicine are served.

| ID | Operator (basis tag) | Vertex | Trigger | Source file |
|----|----------------------|--------|---------|-------------|
| SOUP-DBG-WS | parametric-superposition | 1 | `?debug`, `?ws=` | `soup.html` |
| SOUP-ARCHIVE | parametric-superposition | 1 | `BONDING_ARCHIVE_URL` | `soup.html` |
| DOME | povm-measurement | 2 | `/dome` + Layer 0, axe, shortcuts | `p31ca/…/dome.astro` |
| HUB-LAYER0 | povm-measurement | 2 | Hub `/` trim → Layer 0 | `p31ca/…/index.astro` |
| ORCH-PAGE | dark-eigenstate | 3 | `GET /orchestrator` | `p31ca/…/orchestrator.astro` |
| ORCH-WORKER | entangled-channel | 3 | fetches p31-orchestrator worker | `p31ca/…/OrchestratorDashboard.astro` |
| HUB-PAULI-ORCH | pauli-exclusion | — | hub JSON ⊥ `/orchestrator` | `p31ca/src/data/hub-landing.json` |
| LEGACY-LATTICE-LINK | weak-coupling | 4 | OQE nav → lattice | `p31ca/public/oqe-icosa.html` |
| LATTICE-WONKY | weak-coupling | 4 | lattice → `wonky.html` | `p31ca/public/lattice.html` |

**Path prefix:** `andromeda/04_SOFTWARE/p31ca/` in full checkouts. **Base URL** for the shipped hub: `https://p31ca.org`.

**Operator map (p31ca.org, no surprise — static routes exist):** `/` hub · `/dome` · `/orchestrator` (not on hub-landing) · `lattice.html` · `wonky.html` · `soup.html` is repo-local (BONDING demo, not the hub). Legacy `legacy-mvp-hub.html` was retired; `/legacy-mvp-hub.html` → 301 `/`. Passport generator: `passport-generator.html` and root `cognitive-passport/`.

**Risk / hardening:** The **orchestrator** static page is **unlisted**, not private: anyone with the URL can load it. Treat **`p31-orchestrator` worker** APIs as the trust boundary: enforce **auth / rate limits / audit** on the Worker, not in static HTML. `entangled-channel` remains **nonlocal** (browser → worker); CORS and deployment own exposure.

**CI / tree:** P31 home often **omits** `andromeda/` in the **remote** clone. **`npm run verify`** and **`p31-ci`** then **skip** mirror-only checks: no `p31ca` public tree means **`verify:passport`** and **`verify:p31ca-contracts`** and **andromeda-scoped** egg/Larmor lines skip; Bonding `tsc` and repo-local egg anchors still run. When `p31ca` is present, the full root verify + **p31ca Astro** build runs. GitHub **P31 CI** uses **npm** + root **`package-lock.json`** (not pnpm at root for this workflow).

**Commands:** `npm run verify:egg-hunt` (script `verify-egg-hunt.mjs`); alias: `npm run verify:quantum-egg` (same).

**Output:** Default success line uses ⟨ ⟩ and ×. In **`CI=true`** or **GitHub Actions**, or with **`QUANTUM_EGG_ASCII=1`**, the line is plain ASCII (`verify-quantum-egg: OK …`).

**When editing:** change **manifest** first; the **Larmor** check will fail if you retune Hz in UI but not in `p31-constants.json` (or the reverse via `apply:constants`).
