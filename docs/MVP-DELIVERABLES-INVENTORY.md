# P31 Labs — MVP deliverables inventory

**Last updated:** 2026-04-26  
**Entity:** P31 Labs, Inc. (Georgia nonprofit corporation, incorporated 2026-04-03; EIN 42-1888158 assigned 2026-04-13). **IRS 501(c)(3) determination:** pending (`p31-constants.json` → `organization.status501c3`).  
**Audience:** Internal ops, grant reviewers, Gemini/Opus handoff, investor/funder one-pagers  

**Canonical numbers:** Operator-locked fields live in **`p31-constants.json`**; run **`npm run apply:constants`** / **`npm run verify:constants`**. Edition namespaces: **`docs/CANONICAL-NUMBERING.md`**.

---

## Tier 1 — LIVE and production-verified

Deployed, CI-verifiable, and demonstrable today (URLs and baselines cross-check with `p31-constants.json` and `p31.ground-truth.json` where applicable).

| # | Deliverable | URL / anchor | Evidence |
|---|------------|--------------|----------|
| 1 | **BONDING** — molecular builder | `https://bonding.p31ca.org` | Shipped 2026-03-10. **413 tests / 30 suites** (canonical baseline). K₄ bond model, multiplayer relay (KV polling, room codes), timestamped session export (registry: evidence-friendly logging), offline/local mock relay. R3F + Zustand + Vitest. Hub registry: LIVE. |
| 2 | **p31ca.org technical hub** | `https://p31ca.org` | Astro 5. **Prebuild:** `verify:ground-truth` → **`verify:synergetic`** (multi-dome Three pins + Spaceship `package.json`) → hub data → hub verify → build. **`p31.ground-truth.json`**, **`synergetic-manifest.json`**, passport mirror, `/dome`, static catalog. |
| 3 | **Cognitive Passport (public)** | `https://p31ca.org/passport` | Authoring: `cognitive-passport/index.html` → mirror `p31ca/public/passport-generator.html`. **Long-form edition 5.1** (H1 in **`P31 COGNITIVE PASSPORT — v5.md`**); JSON schema **`p31.cognitivePassport/1.0.0`**. **`npm run verify:passport`** / sync scripts. |
| 4 | **Spaceship Earth PWA** | Launcher `spaceship-earth.html` on hub; app deploy separate host | Package `@p31/spaceship-earth` (`npm run build`, `npm test`). **Synergetic manifest** locks `three` to **`^0.159.0`**. Security/audit notes: e.g. `spaceship-earth/WCD-30-SECURITY-REPORT.md`. |
| 5 | **Zenodo publication series** (defensive + IV + **V–XX**) | DOIs in `p31-constants.json` → `research.papers`; batch log `andromeda/docs/files/zenodo_results.json` | ORCID **0009-0002-2492-9079**. Defensive **10.5281/zenodo.18627420**; Paper IV **10.5281/zenodo.19503542** (2026-04-10); Papers **V–XX** published **2026-04-26** (Zenodo deposit IDs **19782969**–**19783001** per results file). |
| 6 | **Quantum branding kit** | Cross-site | K₄ / **31P** visual language on p31ca, BONDING, and related surfaces (mark + palette consistency per hub/registry). |

---

## Tier 2 — LIVE infrastructure (edge fleet)

Backend Workers and related edge surface — operational, instrumented, production. **Fleet count snapshot:** **10** (`p31-constants.json` → `edge.workerFleetCount`; not auto-verified against Cloudflare API in repo).

| # | Worker / host | Role | Key signals |
|---|---------------|------|-------------|
| 7 | **EPCP command-center** | Fleet view, KPIs, D1 audit, R2, panic | Example: `command-center.trimtab-signal.workers.dev`. Cloudflare Access + admin tokens. |
| 8 | **k4-cage** | K₄ mesh, rooms, telemetry | `/api/`, `/ws/`, health, admin; DO / bindings per package. |
| 9 | **bonding-relay** | BONDING multiplayer relay | KV polling, room codes (see BONDING package / workers). |
| 10 | **telemetry-worker** | Unified telemetry ingest | Internal fanout tokens; feeds fleet patterns. |
| 11 | **donate-api** | Donations pipeline | Stripe configuration per deploy. |
| 12 | **`api.phosphorus31.org`** | Stripe direct (HCB pivot) | Worker host; **`p31-constants.json`** → `payment.stripeWorkerHost`. |
| 13 | **genesis-gate** | Governance / telemetry plane | Bearer / admin patterns. |
| 14 | **bouncer** | Gate / auth proxy | `BOUNCER_GATE_TOKEN` pattern. |
| 15 | **p31-agent-hub** | Agent ↔ cage | Service bindings. |
| 16 | **p31-cortex** | Cortex services | Bearer / DO patterns per package. |

**Shared patterns:** KV status, D1 append-only audit (e.g. `epcp-audit`), R2 forensics, service bindings between packages. Detail map: **`docs/REVIEW-SUPPLEMENT-B-WORKERS-AND-PACKAGES.md`**.

---

## Tier 3 — Production-adjacent (focused sprint)

| # | Deliverable | Current state | Gap to “fully production” |
|---|------------|---------------|---------------------------|
| 17 | **phosphorus31.org** | Live; **parallel** repo and deploy vs p31ca | Keep pipelines explicit; content/deploy checklist per site owner. |
| 18 | **WCD-33 Soup archive Worker** | `wcd33-global-archive/DEPLOY.md`, KV, CORS | Confirm production Worker URL, health checks, and client `BONDING_ARCHIVE_URL` wiring. |
| 19 | **Root BONDING Soup engine** | `tsc`, `soup-demo.html`, archive hook | Full molecular/world MVP still roadmap Phase 3–4 (`docs/development-roadmap.md`); **core engine** is buildable now. |
| 20 | **Children’s picture book** | *Mother Nature and Father Time: The Spark and the Cage* — illustrated PDF / flipbook tracks | Print + public flipbook polish as needed. |
| 21 | **Ko-fi** | **`https://ko-fi.com/trimtab69420`** (`p31-constants.json` → `contact.kofiUrl`) | Low-friction; align with grant/funder CTAs. |
| 22 | **Paper XII — Sovereign Stack** | **Live** — DOI **10.5281/zenodo.19782969** (2026-04-26); see `research.papers` | Optional: add Zenodo **cites** relations from XI/XIX (and related papers) to XII if metadata was frozen before XII minted. |

---

## Tier 4 — Active development

| # | Deliverable | Status | Timeline signal |
|---|------------|--------|-------------------|
| 23 | **Node Zero firmware** | Active sprint: Waveshare ESP32-S3-Touch-LCD-3.5B, ESP-IDF, LVGL, display driver bring-up | Prototype / firmware phase — not a consumer SKU in-repo yet. |
| 24 | **The Buffer** | Hub registry LIVE; product ~85% (communication processing, Fawn Guard, etc.) | Integration + test pass. |
| 25 | **EPCP unified dashboard** (phased plan) | Command-center Worker is foundation | Federated health → pipelines → gated actions → accessibility polish. |
| 26 | **sovereign-command-center** | Next.js; separate deploy | Integrate vs EPCP shell — product decision. |

---

## Tier 5 — Research / concept

| # | Deliverable | Notes |
|---|------------|-------|
| 27 | **The Soup** — spatial chat | Designed; not blocking shipping paths. |
| 28 | **Molecule soundtracks** | Per-element audio — designed. |
| 29 | **Breathing room** | Rhythmic presence — designed. |
| 30 | **Calcium logging** | Med → visualization — designed (operator medical context in `CLAUDE.md`). |
| 31 | **Whale Channel** | Low-frequency, high-context comms — concept. |
| 32 | **Thick Click** | Proprioceptive input — concept. |
| 33 | **Module Maker** | User-defined reaction rules — concept. |
| 34 | **LoRa transport** | Meshtastic / mesh-without-internet — concept. |

---

## Grant-ready MVP summary (five bullets)

For a funder who needs **what exists today** (facts aligned with **`p31-constants.json`** and review docs):

1. **BONDING** — Shipped, **413 tests / 30 suites**, multiplayer relay, 3D builder, difficulty tiers (**Seed / Sprout / Sapling** per engine). **`https://bonding.p31ca.org`**.
2. **P31 technical hub** — Product catalog, **Cognitive Passport** generator (**edition 5.1** long-form; schema **`p31.cognitivePassport/1.0.0`**), **`/dome`**, CI chain including **ground-truth**, **synergetic manifest**, and **constants** verification. **`https://p31ca.org`**.
3. **Spaceship Earth** — PWA command-center experience (R3F, PGlite, geodesic observatory patterns). Launcher on hub; **`verify:synergetic`** pins Three **`^0.159.0`** against **`spaceship-earth/package.json`**.
4. **Research foundation** — Zenodo series with locked DOIs (**defensive**, Paper **IV**, Papers **V–XX** batch 2026-04-26), ORCID **0009-0002-2492-9079**, K₄ / information-framing line documented in bundle + supplements.
5. **Edge infrastructure** — **10-worker** production fleet snapshot: telemetry, k4 mesh, relays, Stripe host **`api.phosphorus31.org`**, governance/operator Workers, D1/R2 patterns per **`REVIEW-SUPPLEMENT-B`**.

**Entity (accurate for filings):** P31 Labs, Inc., Georgia nonprofit corporation, **EIN 42-1888158**; **501(c)(3) determination pending**. Open-source and assistive-technology-aligned mission per org docs.

---

## Operational controls

- **Master Ops Manual** — `p31-constants.json` → `operations`: 1,445 lines, 11 CWPs, 41 WCDs (narrative source; not duplicated here).
- **WCD Batch 3 (26–32)** — closed; root `tsc` clean per review snapshot.
- **Extended local audit:** **`npm run validate:full`** — same root checks as **`npm run verify`** plus live edge probes and JSON report (needs network).
- **CI (home root):** **`npm run p31:ci`** → `scripts/p31-ci.mjs`: **`npm run verify`** (passport, **`verify:constants`**, **`verify:p31ca-contracts`**, **`tsc`**) → p31ca **`npm run verify`** (includes **`prebuild`**: ground-truth, **synergetic**, hub, Astro build). GitHub **`p31-ci.yml`** also triggers on **`p31-constants.json`**, **`tsconfig.json`**, **`src/**/*.ts`**, and constants scripts.
- **Review set:** **`docs/README-REVIEW-DOCS.md`** → bundle + supplements A–C + **this inventory**.
- **Agent coordination:** Triad / lanes per **`GEMINI-OPUS-REVIEW-BUNDLE.md`** and **`AGENTS.md`**.

---

*Tier labels are operational (what to demo vs what backs it). Registry **LIVE** flags for static hub tools are not a substitute for per-product QA; see individual packages and audit notes.*
