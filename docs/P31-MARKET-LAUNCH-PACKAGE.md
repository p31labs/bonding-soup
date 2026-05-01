# P31 Labs — market launch package (comprehensive)

**Document:** `p31.marketLaunchPackage/1.0.0` (human canon; pairs with machine proofs below).  
**Last updated:** 2026-04-30  
**Audience:** Operator, launch coordinator, grant reviewers, technical partners, press-friendly readers who need one spine document.

---

## 0. How to use this file

| Need | Go to | Do not duplicate here |
|------|--------|------------------------|
| **What ships today (URLs, tiers, tests)** | §2 + **`docs/MVP-DELIVERABLES-INVENTORY.md`** | Operator-locked numbers |
| **Entity, EIN, 501(c)(3) status, Zenodo counts** | §2.1 + **`docs/MVP-DELIVERABLES-INVENTORY.md`**, **`p31-constants.json`**, **`docs/DELIVERABLE-P31-FACTS.md`** | Tax or legal claims beyond “pending” |
| **Voice & forbidden words** | §5 + **`docs/PUBLIC-VOICE.md`**, **`docs/p31-public-voice-guardrails.json`** | Long copy samples |
| **Visual system** | §5 + **`docs/P31-BRAND-GUIDELINES.md`**, **`docs/ETHICAL-STYLE-MAP.md`** | Hex tokens (use canon + `apply:p31-style`) |
| **Money routes (Stripe, Sponsors, donate-api)** | §6 + **`docs/ENTERPRISE-LAUNCH-PREP.md`**, **`ground-truth/creator-economy.json`** (p31ca) | Payment URLs (ground-truth + deploy canon win) |
| **Edge readiness (“11/10”)** | §8 + **`docs/ECOSYSTEM-PRODUCTION-11.md`**, **`p31-ecosystem.json`**, **`p31-live-fleet.json`** | Worker inventory counts as gospel |
| **CI / release tiers** | §8 + **`docs/P31-RELEASE-LADDER-CI.md`**, **`docs/P31-ENGINEERING-STANDARD.md`** | Per-job YAML detail |
| **Launch score + human gates** | §7 + **`docs/P31-LAUNCH-READINESS.md`**, **`p31-launch-readiness-config.json`**, **`p31-launch-checklist.json`** | Lane weight arithmetic |
| **Funding-blocked work** | §9 + **`docs/FUNDING-GATED-ACTION-ITEMS.md`** | Dollar estimates (live in that file) |
| **Mission assembly** | **`docs/P31-MISSION-SYSTEM-DELIVERABLE.md`**, **`docs/P31-CREATE-CONNECT-ETHICAL-MONETIZATION.md`** | Full keystone tables |
| **Machine path (TypeScript / hub)** | **`p31-constants.json`** → `documentation.marketLaunchPackage` | Propagates to **`src/p31-constants-generated.ts`** via **`npm run apply:constants`** |

**After edits:** `npm run build:doc-index` (ship bar) so the doc library picks up this file.

---

## 1. Executive snapshot

**Mission (plain language):** Build tools for cognitive access, family-scale mesh, and open research—ship them with a reproducible quality bar, honest disclosure about assistive-tech use, and ethical monetization defaults (creator share, transparent contracts).

**What “launch” means here:** Not a single billboard moment—a **coordinated public posture**: live surfaces match promises, money paths are documented and tested, voice matches build, and operators can run **readiness audits** and **post-deploy smoke** on demand.

**North-star outcomes (market-facing):**

1. **Trust** — Public contracts (`p31-public-surface.json`, privacy/terms, security.txt) + green engineering bar (`npm run verify` and hub `hub:ci` where applicable).  
2. **Demonstrability** — BONDING + hub + passport + research DOIs are demo-ready with evidence rows in **`docs/MVP-DELIVERABLES-INVENTORY.md`**.  
3. **Repeatability** — Release ladder P0–P3 and ecosystem deploy order are documented; launch readiness lanes give a numeric score and “next one thing.”  
4. **Sustainability** — Subscription stack documented (**`docs/DELIVERABLE-SUBSCRIPTION-STACK.md`**, **`p31-subscriptions.json`**); public support paths wired per **`docs/ENTERPRISE-LAUNCH-PREP.md`** and creator-economy mirror.

---

## 2. Positioning & segments

### 2.1 Core positioning

| Pillar | Claim (accurate, falsifiable) | Proof hook |
|--------|------------------------------|-------------|
| **Sovereign edge stack** | Hub + Workers + contracts in one alignment system | **`p31-alignment.json`**, **`docs/P31-ALIGNMENT-SYSTEM.md`**, **`fleet-portal.html`** |
| **Assistive-by-design** | AI as equipment, not hero; disability-first narrative | **`docs/PUBLIC-VOICE.md`** |
| **Open research spine** | Zenodo series + ORCID | **`docs/MVP-DELIVERABLES-INVENTORY.md`** Tier 1 row 5; constants `research.papers` |
| **Playable public science** | BONDING shipped with high automated test count | MVP inventory Tier 1 row 1 |
| **501(c)(3) path** | Incorporated nonprofit; IRS determination pending | MVP inventory header; do not imply determination is final |

### 2.2 Ideal customer / partner profiles (ICP)

| Segment | What they buy / fund | Primary surfaces | CTA style |
|---------|----------------------|------------------|-----------|
| **Grants & foundations** | Evidence, reproducibility, inclusion story | MVP inventory “Grant-ready MVP summary”, Zenodo, hub trust bundle | Constraint-first; cite verify bar + DOIs |
| **Developers & OSS** | APIs, Workers, monorepo discipline | GitHub org, **`/integrations`**, fleet portal | Technical precision; no vague “solutions” |
| **Families / cognitive tooling** | Passport, mesh onboarding, BONDING | **`/passport`**, **`mesh-start.html`**, bonding vertical | Safety-first; no surveillance framing (**`docs/PUBLIC-VOICE.md`**) |
| **Sponsors & small donors** | Operating runway | Ko-fi, GitHub Sponsors, MAP donate surfaces | Transparent use of funds; Larmor framing per **`docs/FUNDING-GATED-ACTION-ITEMS.md`** where relevant |
| **Press & curators** | One link bundle | This doc + **`docs/README-REVIEW-DOCS.md`** | Link index, not hype |

---

## 3. Product & proof matrix (launch shelf)

Use **`docs/MVP-DELIVERABLES-INVENTORY.md`** as the authoritative table. For launch messaging, group as:

| Shelf | User-facing label | Inventory tiers | Launch note |
|-------|-------------------|-----------------|-------------|
| **Play** | BONDING | Tier 1 | Lead demo for “shipped + tested” |
| **Hub** | p31ca technical hub | Tier 1 | Lead for “contracts + catalog + tools” |
| **Access** | Cognitive Passport | Tier 1 | Lead for “documentation of cognitive needs as first-class” |
| **Research** | Zenodo + ORCID | Tier 1 | Lead for “verifiable academic/public record” |
| **Edge** | Worker fleet | Tier 2 | Lead for “live infrastructure” only after glass/smoke green |
| **Scale pack** | PWA / room / mesh | Tier 3–4 | Position as roadmap with **`docs/DELIVERABLE-BONDING-HOME-SCALE-PACK.md`** |

**Demo script (15 minutes):** Hub home → BONDING live URL → Passport generator → one fleet/agents page → one research DOI landing → donate/support path (see §6). Close with “full proof is `npm run verify` in the open repo.”

---

## 4. Narrative arc (story beats)

Use in decks, grant narratives, and long-form posts—always run the **hardware store test** and **Tier A** reader pass from **`docs/PUBLIC-VOICE.md`**.

1. **Constraint** — Real limits (health, time, separation, budget).  
2. **Response** — Tools built because they were needed first-party.  
3. **Proof** — Open repo, tests, DOIs, live URLs—not vanity metrics.  
4. **Invitation** — Use the hub, read the contracts, fund hardware or filings via listed channels.  
5. **Honesty** — Pending determinations and unfunded items stay explicit (**`docs/FUNDING-GATED-ACTION-ITEMS.md`**).

---

## 5. Voice, brand, and ethics (non-negotiables)

| Topic | Canonical doc | Automation |
|-------|----------------|--------------|
| **Sentence-level voice** | **`docs/PUBLIC-VOICE.md`** | `npm run verify:public-voice` |
| **UI / motion / psychology** | **`docs/ETHICAL-STYLE-MAP.md`** | `npm run verify:p31-style` |
| **Brand kit** | **`docs/P31-BRAND-GUIDELINES.md`** | Hub **`/branding/`** |
| **DELTA lexicon** (topology words) | **`docs/P31-DELTA-LANGUAGE.md`** | `npm run verify:delta-language` |

**Launch copy checklist (manual):**

- [ ] No radioactive words from PUBLIC-VOICE avoid-list unless quoted as “do not use.”  
- [ ] Minors: follow repo policy (initials only in public examples—**`AGENTS.md`** / **`.cursorrules`**).  
- [ ] No fabricated legal outcomes or user counts.  
- [ ] Generative-AI assistance disclosed where it shaped public-facing content.

---

## 6. Monetization & conversion map

| Layer | Source of truth | Launch action |
|-------|-----------------|---------------|
| **Public creator economy** | p31ca `ground-truth/creator-economy.json` + public mirror | Quote only what CI verifies (`verify:economy`) |
| **MAP / donate surfaces** | **`docs/ENTERPRISE-LAUNCH-PREP.md`** § Monetary endpoints | Confirm `curl` / `launch:smoke:net` after deploy |
| **Stripe Checkout Worker** | `donate-api` + health URLs in constants | Same |
| **GitHub Sponsors** | ENTERPRISE-LAUNCH-PREP table | Badge/link on repos and hub footers where approved |
| **Ko-fi** | **`docs/FUNDING-GATED-ACTION-ITEMS.md`** | Campaigns tied to tangible gates (hardware, filings) |

**Operator grant / subject binding:** Follow hub implementation notes in ENTERPRISE-LAUNCH-PREP (`localStorage.p31_subject_id` pattern)—do not improvise new tracking identifiers in marketing copy.

---

## 7. Launch readiness (engineering + human gates)

**System:** Ten weighted lanes + checklist gates—**`docs/P31-LAUNCH-READINESS.md`**.

| Mode | Command | When |
|------|---------|------|
| Audit | `npm run launch:audit` | Weekly / pre-announcement |
| Rehearsal | `npm run launch:rehearsal` | After infra changes |
| Gate | `npm run launch:gate` | “We say we’re live” moment |
| Next action | `npm run launch:next` | Spoon-preserving ops |
| Heal statics | `npm run launch:sync` | Constants / registry / fleet portal / doc index |

**Human checklist:** Flip rows in **`p31-launch-checklist.json`** via **`scripts/p31-launch-checklist.mjs`**; keep notes in **`~/.p31/launch-log.jsonl`**.

---

## 8. Technical spine (what “green” means)

| Concern | Doc / artifact | Command |
|---------|----------------|---------|
| **Default merge bar** | **`docs/P31-RELEASE-LADDER-CI.md`** | `npm run verify` (P0) |
| **Release-capable** | Same | `MESH_LIVE_STRICT=1 npm run p31:ci` (P1) when full tree |
| **Full operator bar** | Same | `npm run p31:all` (P2) |
| **Pre-Pages / deploy rehearsal** | Same + **`docs/P31-DEPLOY-CANON.md`** | `npm run release:public` (P3) — **requires TRIPER cert <24h** |
| **MVP certification (TRIPER)** | **`docs/P31-TRIPER-SYSTEM.md`** | `npm run test:triper:cert` — 9 MVP suites + combined cross-MVP gate + 70 mutation sentinels; cert logged, `release:public` blocks if stale |
| **Ecosystem connectivity** | **`docs/ECOSYSTEM-PRODUCTION-11.md`** | `npm run verify:ecosystem`; glass: `P31_GLASS_STRICT=1 npm run ecosystem:glass` |
| **Post-deploy** | **`docs/ENTERPRISE-LAUNCH-PREP.md`** | `npm run launch:smoke:net` (optional skip env documented there) |

---

## 9. Dependencies, budget, and sequencing

All **money-blocked** items (hardware, IP filings, domains, tablets, etc.) live in **`docs/FUNDING-GATED-ACTION-ITEMS.md`**—keep launch promises aligned: if an item is gated, the public story says “next when funded,” not “shipping Tuesday.”

**Internal AI / tool budget** (separate from donor story): **`docs/DELIVERABLE-SUBSCRIPTION-STACK.md`** + **`p31-subscriptions.json`** + `npm run verify:subscriptions`.

---

## 10. Go-to-market channels & owners

| Channel | Primary asset | Cadence suggestion |
|---------|---------------|---------------------|
| **Technical hub** | p31ca.org product grid + `/fleet`, `/agents` | Ship notes when registry/ground-truth changes |
| **GitHub** | `p31labs` org README + repo About lines | **`docs/P31-GITHUB-ORG-REPOS.md`** automation |
| **Research** | Zenodo + ORCID | Deposit on tagged releases per ENTERPRISE-LAUNCH-PREP Zenodo section |
| **Org marketing site** | phosphorus31.org (parallel repo) | Do not conflate deploy with hub; see **`P31-ROOT-MAP.md`** |
| **Discord / community** | Bot swarm + manifest | `npm run verify:discord-bot`; **`p31-discord-bot-swarm.json`** |
| **Grants** | MVP inventory + review bundle | **`docs/README-REVIEW-DOCS.md`** |

---

## 11. Phased launch checklist (timeboxed)

Adapt dates to your window. Each row should have one DRI (directly responsible individual).

### Phase A — Foundation (T−60 to T−30)

- [ ] **`npm run verify`** green on `main`; **`hub:ci`** green if p31ca touched.  
- [ ] **`npm run launch:audit`** ≥ target score; file `/tmp/p31_launch_readiness.json` with release.  
- [ ] MVP inventory Tier 1 URLs spot-checked from a clean browser profile.  
- [ ] PUBLIC-VOICE pair check on hub pages you will push in launch wave.  
- [ ] Funding-gated doc reconciled with public copy (no promised hardware without budget).

### Phase B — Packaging (T−30 to T−7)

- [ ] **One-pager PDF** (optional): export from MVP inventory “Grant-ready” bullets + entity block.  
- [ ] **Screenshots / screen recording** for BONDING + hub + passport (store in non-repo media library or licensed repo path per your policy).  
- [ ] **Press / partner FAQ** (short): What is P31? What ships? How is AI used? How to donate? Where is code?  
- [ ] **Changelog / “what changed”** for this launch slice—hub `changelog` policy if publishing.  
- [ ] **Discord / status** copy drafted if you announce in social channels.

### Phase C — Rehearsal (T−7)

- [ ] **`npm run launch:rehearsal`** (glass refresh + lanes).  
- [ ] **`npm run launch:gate`** or explicit walkthrough of **`p31-launch-checklist.json`** critical rows.  
- [ ] Deploy rehearsal per **`docs/P31-DEPLOY-CANON.md`** if hub release included.  
- [ ] **`npm run launch:smoke:net`** against production URLs.

### Phase D — Launch day

- [ ] Tag / release artifact (git tag + release notes).  
- [ ] Publish blog/changelog/Discord post using §4 beats + §5 checks.  
- [ ] Monitor: glass probes, donate-api health, error logs (command-center patterns).

### Phase E — Stabilization (T+7 to T+30)

- [ ] Triaged issues from launch traffic; update MVP inventory tiers if reality shifted.  
- [ ] Grant follow-ups with DOI + commit SHA citations.  
- [ ] Retro: update **`p31-launch-readiness-config.json`** if new blockers discovered.

---

## 12. Risk register (market-facing)

| Risk | Mitigation | Doc |
|------|------------|-----|
| **Over-claiming health or legal** | Constraint-first copy; no docket fabrication | **`docs/PUBLIC-VOICE.md`**, operator rules |
| **501(c)(3) confusion** | State “pending” explicitly | MVP inventory |
| **Donate / tax wording** | Use hub + counsel-approved phrasing only | ENTERPRISE-LAUNCH-PREP, counsel workflows |
| **Kid-safety optics** | No analytics brag; parent-visible safety | PUBLIC-VOICE, **`docs/SOULSAFE-TETRA-SPEC.md`** where `/chat` is in scope |
| **Partial clone / missing Andromeda** | CI and docs explain skipped steps | **`docs/P31-RELEASE-LADDER-CI.md`** |

---

## 13. Metrics (lightweight, honest)

Prefer **instrumentation** over vanity:

- **Engineering:** `verify` green rate on `main`; P1 job pass rate on full checkouts.  
- **Product:** Glass probe pass rate (`ecosystem:glass`); post-deploy smoke script results.  
- **Research:** Zenodo views/downloads (external); citations over quarters.  
- **Support:** Ko-fi / Sponsors / Stripe events (treasury owner only—do not publicize granular revenue without policy).

Avoid publishing **DAU/MAU** unless measured and true.

---

## 14. Artifact index (what “the package” contains on disk)

| Artifact | Role |
|----------|------|
| **This file** | GTM + ops spine + links |
| **`docs/MVP-DELIVERABLES-INVENTORY.md`** | SKU / proof catalog |
| **`docs/README-REVIEW-DOCS.md`** | Handoff bundle for external reviewers |
| **`docs/GEMINI-OPUS-REVIEW-BUNDLE.md`** | If present—model review packet |
| **`fleet-portal.html`** | Operator URL index (regenerate: `npm run build:fleet-portal`) |
| **`p31-launch-readiness-config.json`** | Machine-scored lanes |
| **`p31-launch-checklist.json`** | Human gates |
| **`docs/ENTERPRISE-LAUNCH-PREP.md`** | D1 / Pages / Zenodo / smoke |
| **`docs/ECOSYSTEM-PRODUCTION-11.md`** | “Everything connected” matrix |

---

## 15. Appendix — command quick reference

```bash
# Quality bar
npm run verify

# Atomic auto-pilot (pre-deploy gate — single command)
npm run launch:auto

# Launch readiness (lanes / spoon mode)
npm run launch:audit
npm run launch:next
npm run launch:gate

# Ecosystem truth
npm run verify:ecosystem
P31_GLASS_STRICT=1 npm run ecosystem:glass

# Post-deploy (auto-runs in CI; manual local)
npm run post-deploy:verify
npm run launch:smoke:net

# Doc library (after editing docs)
npm run build:doc-index && npm run verify:doc-index
```

---

## 17. Automation envelope

**Goal:** human intervention only when judgment, identity, or money assignment is required. Everything verifiable runs on commands or schedules.

### Fully automated (no human action in normal operation)

| Trigger | What runs | Where |
|---------|-----------|-------|
| Push / PR to `main` | `P31 / root verify` + `P31 / full stack` | **`.github/workflows/p31-ci.yml`** |
| Push to `main` (after CI green) | Hub build → `wrangler pages deploy` → **`post-deploy:verify`** (smoke + strict glass + freshness) | **`.github/workflows/p31-autodeploy-hub.yml`** |
| Daily 09:30 UTC | **P31 live drift** — `verify:ecosystem` + `launch-smoke-net` + strict `ecosystem-glass` (read-only; includes `social-worker-health` + `social-worker-status` probes) | **`.github/workflows/p31-live-drift.yml`** |
| Push / PR (root verify) | **`verify:social-engine`** — char limits + voice guardrails + numerical drift on the deployed social worker copy | **`scripts/verify-social-engine.mjs`** |
| Push / PR (root verify) | **`verify:simulations`** — confirms simulator chain compiles, social waves render with **0** char-limit failures, launch:auto preview emits valid manifest | **`scripts/verify-simulations.mjs`** |
| Cron (in-Worker) | Mon/Wed/Fri 17:00 UTC + daily 17:20 UTC + monthly 13:00 UTC — multi-platform broadcasts + Discord notifications + Ko-fi digest | **`andromeda/04_SOFTWARE/cloudflare-worker/social-drop-automation/worker.js`** |
| Weekly Sun 14:00 UTC | **P31 simulation sweep** — `verify:simulations` + `sim:all` (social wave preview, launch chain preview, reports cadence); uploads sandbox artifact | **`.github/workflows/p31-sim-weekly.yml`** |
| Weekly Mon 06:00 UTC | Fleet ground-truth + LLM bridge sweep | **`.github/workflows/p31-fleet-ground-truth.yml`** |
| Weekly Semgrep | SAST when p31ca present | **`.github/workflows/p31-security.yml`** |
| Local `npm run launch:auto` | release:public + strict glass + readiness rehearsal — atomic preflight | **`scripts/p31-launch-auto.mjs`** |
| Local `npm run post-deploy:verify` | wait → smoke → strict glass → freshness probes | **`scripts/p31-post-deploy-verify.mjs`** |
| Local `npm run sim:all` | Runs every simulator (social waves, launch chain, hub mirrors, reports cadence) into `~/.p31/simulations/all-<utc>/manifest.json` | **`scripts/p31-simulate-all.mjs`** |
| Local `npm run sync:all` | Idempotent omnibus over `apply:constants` + `build:contract-registry` + `sync:chain-anchor` + `build:fleet-portal` + `sync:live-fleet` + `build:doc-index` + `sync:doc-library` + `sync:delta-language` + `sync:atmosphere(+hub-routes)` + `sync:passport` + `sync:discord-bot-swarm` + `sync:p31-starfield` | **`scripts/p31-sync-all.mjs`** |
| Local `npm run sim:social` | Renders every social wave + 7-day schedule preview to `~/.p31/simulations/social-<utc>/{manifest.json,preview.md}` (no fetch, no POST) | **`scripts/simulate-social-engine.mjs`** |
| Local `npm run sim:launch` | Read-only chain preview of `launch:auto` with current preflight signals | **`scripts/simulate-launch-auto.mjs`** |

### Disable knobs (repo Variables)

- `P31_DISABLE_AUTODEPLOY=1` — pause hub autodeploy.
- `P31_DISABLE_LIVE_DRIFT=1` — pause daily drift workflow.
- `P31_POST_DEPLOY_SKIP_*` — per-lane skip env for `post-deploy:verify` (smoke / glass / freshness).
- `P31_SOCIAL_STRICT=1` — escalate social verifier warns (voice + drift) to fails.
- `P31_SOCIAL_SKIP_VOICE / _LIMITS / _DRIFT=1` — per-lane skip for `verify:social-engine`.
- `P31_SOCIAL_FORCE_WORKERS_DEV=1` — operator CLI skips zone route, hits `*.workers.dev` directly.
- `P31_DISABLE_SIM_WEEKLY=1` — pause weekly simulation sweep workflow.
- `P31_SIM_OUT=<path>` — override single-file output sink for `sim:social` / `sim:launch` (used by orchestrator + verifier).
- `P31_SYNC_ALL_DRY=1` — `sync:all` echoes lanes without executing.

### Truly human (cannot be automated safely)

| Domain | Why a human is required | Linked process |
|--------|------------------------|----------------|
| **Legal copy / docket statements** | No fabrication; counsel review | **`docs/PUBLIC-VOICE.md`**, counsel workflow |
| **Tier A voice pass** (hardware-store test, local run-in) | Judgment about congruence | **`docs/PUBLIC-VOICE.md`** |
| **501(c)(3) / IRS / Stripe identity changes** | Statutory; identity-bound | **`docs/ENTERPRISE-LAUNCH-PREP.md`** |
| **Secret rotation triggers** | Operator decides cadence + revocation | **`docs/ENTERPRISE-LAUNCH-PREP.md`** § Secret rotation |
| **DNS / Cloudflare zone routes** | Account-level config; outside repo scope | Cloudflare dashboard |
| **Funding / Ko-fi / Sponsors / grants narrative** | Money-blocked; mission/ethics judgment | **`docs/FUNDING-GATED-ACTION-ITEMS.md`** |
| **Zenodo deposit + DOI minting** | Cite commit SHA; archival decision | **`docs/ENTERPRISE-LAUNCH-PREP.md`** § Zenodo |
| **Family / minors policy** | Operator-level discretion | **`AGENTS.md`**, **`.cursorrules`** |

When any of those change, run **`npm run launch:auto`** then **`launch:check`** and flip the human gate row (**`p31-launch-checklist.json`**) so the readiness score reflects reality.

### Failure routes (when something is red)

| Failure | What to do |
|---------|------------|
| **Daily drift workflow** red | Read uploaded `p31-glass-report.json` artifact; fix the affected Worker / page; re-run **`npm run launch:auto`** + redeploy. |
| **Post-deploy verify** red after autodeploy | The deploy completed but live state is wrong: rollback via Cloudflare Pages history or re-deploy after fix. **`docs/runbooks/RUNBOOK-HUB-RED.md`**. |
| **Pre-deploy `launch:auto`** red | Do not deploy — the offending command shows in console; fix and re-run. |
| **Live drift but CI green** | Repo and deploy are consistent; live URL drift is upstream (CDN cache, third-party). Use **`npm run ecosystem:glass`** locally and re-check. |

---

## 16. Revision log

| Date | Change |
|------|--------|
| 2026-04-30 | Initial comprehensive package (`P31-MARKET-LAUNCH-PACKAGE.md`). |
| 2026-04-30 | Wired into **`p31-constants.json`** (`documentation.marketLaunchPackage`), **`p31-facts.json`** `pathsMustExist`, **`p31-alignment.json`** sources, **`AGENTS.md`**, **`P31-ROOT-MAP.md`**, review bundle + engineering standard + MVP inventory cross-links; **`verify-constants`** checks generated TS includes the path. |
| 2026-04-30 | Added §17 automation envelope. New scripts **`launch:auto`**, **`post-deploy:verify`**, **`launch:smoke:net`** (npm). Workflow **`p31-autodeploy-hub.yml`** now runs post-deploy verify after wrangler. New workflow **`p31-live-drift.yml`** runs daily strict glass + smoke. Disable knobs documented (`P31_DISABLE_AUTODEPLOY`, `P31_DISABLE_LIVE_DRIFT`, `P31_POST_DEPLOY_SKIP_*`). |
| 2026-04-30 | Wove social engine into automation envelope: **`verify:social-engine`** (char limits, voice, numerical drift) chained in root `verify`; new operator CLI scripts **`social:health/status/waves/preflight`**; glass probes **`social-worker-health`** + **`social-worker-status`** added to **`p31-ecosystem.json`** (daily drift covers them). Verifier caught and operator-fixed **3 Twitter overruns + 4 stale "488 tests" claims** in the deployed wave content (canon now `424 tests / 32 suites`). |
| 2026-04-30 | Simulation + sync omnibus: **`scripts/simulate-social-engine.mjs`** renders every wave + 7-day schedule preview (per-platform char checks, voice scan, no fetch); **`scripts/simulate-launch-auto.mjs`** prints `launch:auto` chain with preflight signals; **`scripts/p31-simulate-all.mjs`** orchestrates social + launch + doc-library + delta + reports into one sandbox; **`scripts/p31-sync-all.mjs`** chains every safe `sync:*` + builds with skip flags + dry mode; **`scripts/verify-simulations.mjs`** static gate joins root `verify`. New workflow **`.github/workflows/p31-sim-weekly.yml`** (Sun 14:00 UTC) uploads simulation sandbox. New scripts wired into **`p31-alignment.json`** (5 sources). |

---

*Build, create, connect—then prove it with the same bar you ship.*
