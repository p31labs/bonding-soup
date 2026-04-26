# Plan — full ecosystem to 11/10 (“everything connected”)

**Status:** master program plan. **Updated:** 2026-04-26.  
**Companion:** **`docs/ECOSYSTEM-PRODUCTION-11.md`** (matrix, probes, deploy order, DoD sentence).  
**Execution log (what ran, what’s red):** **`docs/PLAN-11-10-EXECUTION-LOG.md`**.  
**Inventory:** **`docs/MVP-DELIVERABLES-INVENTORY.md`** (tiered LIVE vs adjacent).

This plan sequences **all workstreams** that turn the repo’s *intent* into **provable live parity**: contracts, hub, identity, K₄, rooms, operator, agents, money, satellites, product truth (ECO), and security.

---

## 0. North star

**11/10 achieved when:**

1. **`MESH_LIVE_STRICT=1`** CI path is green on the branch you ship.  
2. **`P31_GLASS_STRICT=1 npm run ecosystem:glass`** is green, **or** every red probe has a **written exception** (owner, expiry, link to issue/CWP).  
3. **p31ca production** serves the **same** `dist/` that passed **`verify-p31ca-dist`** (short URLs, trust bundle, mesh mirror, security.txt).  
4. **`p31-constants.json`** `mesh.*` and `payment.*` URLs **resolve** from the public internet as advertised.  
5. **Hub product index** and **ECO/mvpData** are either **merged** or **explicitly** dual-track with no broken registry links.

---

## 1. Program structure

| Track | Owns | Primary artifacts |
|--------|------|-------------------|
| **A — Contracts & CI** | Ground-truth, economy, public surface, ecosystem JSON, root verify | `p31.ground-truth.json`, `p31-ecosystem.json`, `p31-public-surface.json`, workflows |
| **B — Hub (Pages)** | Astro build, `_redirects`, static HTML, dist gate | `p31ca/dist/`, `verify-p31ca-dist.mjs` |
| **C — Identity** | Passkey Worker + zone route + clients | `workers/passkey`, onboard, `auth.html`, `p31-mesh-constants.json` |
| **D — K₄ edge** | personal, cage, hubs | `k4-*` packages, `verify-constants` alignment |
| **E — Collaboration** | Geodesic room + static coach | `geodesic-room`, `geodesic-campaign.json`, `geodesic.html` |
| **F — Operator** | Command-center, `/ops/`, glass ingest | `command-center`, `ops/index.astro`, `ops-glass-probes.json` |
| **G — Agent / orchestration** | Agent hub, orchestrator URL reality | `p31-agent-hub`, cortex/worker that serves `p31-orchestrator.*` |
| **H — Monetary** | Donate-api (Stripe Checkout), MAP invariants | `donate-api.phosphorus31.org`, `verify:monetary` |
| **I — Satellites** | BONDING, phosphorus31.org, archive, Google bridge | bonding deploy, `p31-google-bridge`, WCD-33 archive |
| **J — Product truth** | Registry vs mvpData vs COCKPIT | `diff-index-sources`, ECO CWP, hub registry |
| **K — Security & compliance** | `security:check`, worker allowlist, secrets | `SECURITY-RUNBOOK.md`, `EDGE-SECURITY.md` |

Tracks **A–B** are **foundational** (everything else assumes them). **C–H** are **edge**. **I–K** are **parallel** once A/B are stable.

---

## 2. Phases (sequenced)

### Phase 0 — Baseline freeze (1–2 sessions)

**Goal:** No ship without a green local ladder.

- [ ] `npm run apply:constants` committed; **`src` + `public` mesh JSON** match (`verify-constants`).  
- [ ] `npm run release:check` green (includes p31ca build + `verify-p31ca-dist`).  
- [ ] Document current **`ecosystem:glass`** output → `/tmp/p31_glass_report.json` as **baseline snapshot** (attach to ticket or shift log).

**Exit:** Baseline report filed; reds are **enumerated**, not vague.

---

### Phase 1 — Hub truth on the internet

**Goal:** What Tier 6b promises is **actually** on `p31ca.org`.

- [ ] Deploy **`p31ca` `dist/`** (Pages) — **`npm run deploy:p31ca`** or CI auto-deploy.  
- [ ] Re-run **`P31_GLASS_STRICT=1 ecosystem:glass`**; **pages** + **contracts** groups green.  
- [ ] Spot-check: `/passport`, `/family-pack`, `/privacy`, `/p31-public-surface.json`, `/.well-known/security.txt`, `/p31-mesh-constants.json`.

**Exit:** All **pages/contract** probes green (or single known infra issue with owner).

**Depends on:** Phase 0.

---

### Phase 2 — Identity hardening

**Goal:** Passkey is **real** for onboard + return auth, not stub-only.

- [ ] **`p31-passkey`** deployed with **production** `RP_ID` and zone route **`p31ca.org/api/passkey/*`**.  
- [ ] D1 schema applied; KV namespace bound.  
- [ ] Manual smoke: onboard Phase 5 + **`/auth`** on production device.  
- [ ] Glass: **`p31ca-passkey-register-begin`** stays green with **`challenge`** in JSON.

**Exit:** Two-device note in runbook (e.g. “works on iOS Safari + desktop Chrome”) or documented limitation.

**Depends on:** Phase 1 (same-origin hub).

---

### Phase 3 — K₄ edge parity

**Goal:** Constants, hubs wiring, and live Workers are **one story**.

- [ ] `mesh.k4PersonalWorkerUrl`, `k4CageWorkerUrl`, `k4HubsWorkerUrl` — health + mesh endpoints per **`verify:mesh`** / glass.  
- [ ] **`k4-hubs`** `PERSONAL_MESH_URL` matches **`p31-constants.json`** (automated: `verify-constants`).  
- [ ] Deploy **k4-personal → k4-cage → k4-hubs** when changing URLs; then **redeploy hub** if static pages embed old defaults.

**Exit:** **mesh** group in glass all **UP**; personal `/api/mesh` shape stable for PAR docs.

**Depends on:** Phase 0; coordinate with Phase 1 if mesh-start or hub copy changes.

---

### Phase 4 — Geodesic + campaign contract

**Goal:** Builder + DO version + static campaign **agree**.

- [ ] **`geodesic-room`** Worker deployed; **`geodesic.html`** WS host matches live Worker.  
- [ ] **`verify:geodesic-campaign`** green after any campaign edit.  
- [ ] Optional: engine integration per **`docs/GEODESIC-GAME-ENGINE-INTEGRATION.md`**.

**Exit:** Glass **geodesic-room-worker** UP; in-browser room smoke passes.

**Depends on:** Phase 1 for static asset delivery.

---

### Phase 5 — Operator shell + EPCP

**Goal:** Operator can **see** fleet health and **tag** shift without spelunking.

- [ ] **command-center** deployed; health + public shift endpoints green.  
- [ ] **`/ops/`** prebuild ingest includes latest **`p31-ecosystem.json`** probes (POST probes where applicable).  
- [ ] Access policy documented for **POST** shift (who has operator role).  
- [ ] Local **`operator:shift-in` / `out`** still works for spoon-safe audits.

**Exit:** **command-center** probes green; `/ops/` glass table matches CLI glass for the same probe set.

**Depends on:** Phase 1 (ops is on hub).

---

### Phase 6 — Agent hub + orchestrator closure

**Goal:** No “mystery URL” for **`p31-orchestrator.trimtab-signal.workers.dev`**.

- [ ] Identify **canonical repo + `wrangler.toml`** that deploys the orchestrator **name** behind that URL (e.g. cortex/workers — **confirm in Andromeda**, do not guess).  
- [ ] Add **`deployables`** row if missing; add **README “source of truth”** one-liner.  
- [ ] Glass: orchestrator probe **auth or 200** — document expected behavior.

**Exit:** New engineer can find **one** path from git → deploy → URL.

**Depends on:** Phase 0.

---

### Phase 7 — Monetary rail completeness

**Goal:** **`payment.*`** health URLs are **true** from the public internet.

- [ ] **`donate-api.phosphorus31.org/health`** green (already often true).  
- [x] **`payment.*`** aligned with **donate-api** only (no phantom `api.phosphorus31.org` until that Worker + DNS exist).  
- [ ] **`npm run verify:monetary`** in pre-merge habit for any payment/constants/ecosystem edit.

**Exit:** **monetary** glass group green; MAP static checks still green.

**Depends on:** Phase 0; **independent** of hub deploy except for **creator-economy.json** on p31ca.

---

### Phase 8 — Satellites & bridges

**Goal:** Verticals and bridges don’t **contradict** the hub spine.

- [ ] **BONDING** — `bonding.publicUrl` probe green; version/test baseline in **`p31-constants.json`** if you market it.  
- [ ] **phosphorus31.org** — separate deploy checklist; no accidental coupling in same PR unless coordinated (**AGENTS** rule).  
- [ ] **WCD-33 archive** — production URL + `BONDING_ARCHIVE_URL` / client wiring per **`MVP-DELIVERABLES-INVENTORY`**.  
- [ ] **Google bridge** — `p31-google-bridge` deploy matches **`auth.html`** base URL; OAuth allowlist in wrangler matches production origins.

**Exit:** Each satellite has **one** health or human smoke path documented.

**Depends on:** Phase 1 for hub CTAs pointing out.

---

### Phase 9 — Product truth (ECO / COCKPIT / mvpData)

**Goal:** Stop **living with** `diff-index-sources` warnings unless they are **policy**.

- [ ] Decide: **merge** mvpData into COCKPIT index, or **split** “labs” vs “hub” registries with **two** machine lists.  
- [ ] If merge: run **`--strict-mvp`** in CI when ready; fix duplicates and dead registry ids.  
- [ ] Update **hub about** / generated copy so grant-facing text matches registry.

**Exit:** `diff-index-sources` **clean** or **waived** with ADR-style note in **`docs/`** (short).

**Depends on:** Phase 1 (hub build uses generated data).

---

### Phase 10 — Security & continuous assurance

**Goal:** Dependency and worker inventory stay **honest**.

- [ ] **`npm run security:check`** on any week touching `p31ca` deps or Workers.  
- [ ] New Worker → **`security:workers`** + **allowlist** before merge (**AGENTS**).  
- [ ] Quarterly: rotate Cloudflare / Stripe secrets per **`P31-ENGINEERING-STANDARD.md`** §5.

**Exit:** CI or calendar reminder; no silent drift on P0 vulns.

**Depends on:** Andromeda + home CI wiring.

---

## 3. Cadence (how to run the program)

| Cadence | Action |
|---------|--------|
| **Every merge to main** | `release:check` (or stricter `p31:ci` if that’s branch policy). |
| **Every hub release** | Deploy Pages **last** after Workers/constants that hub references. |
| **Weekly** | `ecosystem:glass` + skim `/tmp/p31_glass_report.json`; file issues for new reds. |
| **Before grant / demo** | `P31_GLASS_STRICT=1` + update **`MVP-DELIVERABLES-INVENTORY`** Tier 1–2 table if URLs changed. |

---

## 4. RACI (lightweight)

| Item | **Responsible** | **Accountable** | **Consulted** | **Informed** |
|------|-----------------|----------------|---------------|--------------|
| Constants + ground-truth | Agent / engineer | Operator | — | Family stakeholders only if copy changes |
| Cloudflare deploys | Operator (token) | Operator | — | — |
| Glass probe set | Engineer | Operator | — | — |
| ECO/registry merge | Engineer | Operator | Product/docs | Grant writer if narrative shifts |
| Security exceptions | Engineer | Operator | Security runbook | — |

---

## 5. Risk register (top)

| Risk | Mitigation |
|------|------------|
| **Stale Pages** | Deploy `dist/` same day as Worker URL changes; `verify-p31ca-dist` blocks incomplete bundles. |
| **Constants drift** | `apply:constants` + `verify-constants`; never hand-edit generated mesh JSON. |
| **Orchestrator ambiguity** | Phase 6 closure — single deploy path documented. |
| **Stripe host down** | Phase 7; glass strict fails loud. |
| **Scope creep** | Tier 4–5 in MVP inventory **out of** 11/10 unless explicitly pulled in. |

---

## 6. “All of it” checklist (single page)

When **every** box is true, you are at **11/10**:

- [ ] Phase 0–10 exit criteria satisfied **or** waived in writing.  
- [ ] **`docs/ECOSYSTEM-PRODUCTION-11.md`** §7 Definition of Done satisfied.  
- [ ] **`docs/MVP-DELIVERABLES-INVENTORY.md`** Tier 1–2 matches reality (URLs, counts).  
- [ ] No **unexplained** red rows in strict glass.  
- [ ] Operator can run **`release:check`** + **`ecosystem:glass`** without context recovery.

---

## 7. Related links

- **`docs/P31-ENGINEERING-STANDARD.md`** — normative gates.  
- **`AGENTS.md`** — workspace map, deploy shortcuts, security suite.  
- **`P31-ROOT-MAP.md`** — which tree to edit for which surface.  
- **`docs/ENTERPRISE-LAUNCH-PREP.md`** — launch hygiene.  
- **`docs/HANDOFF-PROMPT-COMMAND-CENTER.md`** — external operator handoff.
