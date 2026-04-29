# P31 workspace map (all roots, parallel paths)

This file is the **single map of record** for what lives under **`/home/p31`**: one home directory, **several code lines** that share mission and vocabulary but do **not** have to merge into one repo.

## 1. Spine (what ties everything together)

| Layer | Idea |
|--------|------|
| **Ship bar** | **`docs/P31-ENGINEERING-STANDARD.md`** (home) + **`andromeda/docs/ENTERPRISE_QUALITY.md`** (monorepo): `verify` (includes **`verify:runbooks`** for incident **`docs/runbooks/`** index links), **`npm run p31:effective-bar`** (prints run/skip/degraded matrix for this checkout), `release:check`, no secrets in git, single canon JSON. **Alignment graph (sources → sinks, ephemeralization):** **`p31-alignment.json`**, **`docs/P31-ALIGNMENT-SYSTEM.md`**. **New clone:** `npm run setup` (root + `apply:constants` + `verify` + p31ca install + optional **`git:hooks`**, when present — see `README.md`). **Doc search (local):** **`docs/doc-library/index.html`** with **`npm run demo`**; physics progression labs **`docs/physics-learn/index.html`**; hub **K4 market** viz (Andromeda) **`andromeda/04_SOFTWARE/p31ca/public/k4market.html`**. Index from **`docs/doc-index.manifest.json`** via **`npm run build:doc-index`**; headless checks **`npm run test:doc-library:e2e`**, **`npm run test:physics-learn:e2e`**, **`npm run test:k4market:smoke`** (needs **`andromeda/`**); optional **`validate:full`** scorecard flags **`P31_DOC_LIBRARY_E2E`**, **`P31_PHYSICS_LEARN_E2E`**, **`P31_K4MARKET_SMOKE`**; doc index spec **`docs/PLAN-DOCUMENT-LIBRARY.md`**. The same `demo` / `build:doc-index` + shortcut story is one click from **`soup.html`**, **`p31-personal-howto.html`**, and **`npm run command-center`**. **P31 Labs education (E0) on the hub:** **`https://p31ca.org/education/`** (short **`/learn`**, **`/edu`**) — **`docs/PLAN-P31-LABS-EDUCATION-SITE.md`**; `verify:ground-truth` in p31ca. |
| **Ecosystem + monetary gates** | **`p31-ecosystem.json`** (glass deploy templates), **`p31-live-fleet.json`** (one-file bundle; mesh URLs must match **`p31-constants.json`** — `verify:ecosystem`), **`npm run verify:map-pipeline`** (Andromeda MAP, part of default **`npm run verify`** when andromeda exists), **`npm run verify:monetary`**, **`npm run ecosystem:glass`**. **Worker inventory of record:** **`andromeda/04_SOFTWARE/p31ca/security/worker-allowlist.json`** — new Worker → new row; **`npm run security:workers`** in **`p31ca`**; registered in **`p31-alignment.json`**. **`.githooks/pre-commit`** runs `verify:monetary` on staged payment/creator-economy paths. Full **`p31ca`** contract checks (incl. **`verify:economy`**, **ground-truth** ↔ **public** `creator-economy.json`) ship from the [Andromeda](https://github.com/p31labs/andromeda) repo; `andromeda/` is often **gitignored** in this home checkout—land hub-side verifier edits there. |
| **Mission** | Build, create, connect — decentralized family / community mesh (see `CLAUDE.md`, `.cursorrules`). **Ephemeralization + ethical money:** **`docs/P31-CREATE-CONNECT-ETHICAL-MONETIZATION.md`**. **Program prep / assemble:** **`docs/P31-MISSION-SYSTEM-DELIVERABLE.md`**. **Home scale & PWA pack (manifest):** **`docs/DELIVERABLE-BONDING-HOME-SCALE-PACK.md`**. |
| **Machine-claim invariants (deliverable 1)** | **`p31.facts/1.0.0`:** **`p31-facts.json`**, enforced by **`scripts/verify-facts.mjs`**, `npm run verify:facts` — required paths, `p31-constants.json` mesh HTTPS URLs + org fields, no banned credential substrings in policy files, optional mesh SLO numbers. On **`npm run verify`** right after **`verify:alignment`**. All-in-one: **`docs/DELIVERABLE-P31-FACTS.md`**. **VS Code:** task **P31: verify facts**. |
| **Handoff snapshot (deliverable 2)** | **`p31.shipbox/1.0.0`:** **`scripts/p31-shipbox.mjs`** — `npm run p31:shipbox` prints JSON (package, git head, public `p31-constants` slice, `filesPresent`). `npm run verify:shipbox` — structural assert, no file write. **`docs/DELIVERABLE-SHIPBOX.md`**. **VS Code:** **P31: verify shipbox**. On **`npm run verify`** after **`verify:facts`**. |
| **Funding gates (what’s blocked on money)** | Canonical checklist: **`docs/FUNDING-GATED-ACTION-ITEMS.md`** (hardware + legal/IP + domains; grant/Ko-fi gated). |
| **AI subscription stack (economical + powerful)** | Canonical contract: **`docs/DELIVERABLE-SUBSCRIPTION-STACK.md`** + **`p31-subscriptions.json`**; verifier: **`npm run verify:subscriptions`**. |
| **p31ca.org contract (machine-routable)** | **`andromeda/04_SOFTWARE/p31ca/ground-truth/p31.ground-truth.json`** — must stay in lockstep with `p31ca/public/_redirects`, invariants in `scripts/hub/registry.mjs`, and pinned 3D entry files. Verify: from **`p31ca`**, `npm run verify:ground-truth` (also part of `prebuild`). **Multi-dome surfaces (Three pins + PWA):** same folder **`synergetic-manifest.json`** — `npm run verify:synergetic` (also `prebuild`). **`docs/CANONICAL-NUMBERING.md`** defines version **namespaces** (ground-truth semver vs CogPass edition vs WCD, etc.). |
| **Edge** | Cloudflare Workers, KV, DO where needed; rate limits and CORS at the door. |
| **WCD lineage** | `docs/` — WCD-31 physics, WCD-32 ghosts/WS, WCD-33 archive; implementation may live in more than one tree. |

## 2. Primary vertical — **this folder** (C.A.R.S. · `bonding-soup`)

**C.A.R.S.** — **Collaborative Affective Realtime Sim** — see **`docs/CARS-NAMING.md`**. Repo package name stays **`bonding-soup`** (`package.json`).

**Owns:** the **thin, shippable** sim + demo + archive worker at repo root.

| Path | Role |
|------|------|
| `package.json` | `bonding-soup` — `npm run build` → `tsc` → `dist/` |
| `src/` | Engine (`soup.ts`, `soupPhysics.ts`, `reactions.ts`, …), persistence, memory panel, demo glue |
| `soup.html` | Browser entry; `?ws=` / `?debug` — same **`npm run demo`** server as **Cognitive Passport**; also links to **p31ca** `planetary-onboard.html`, `initial-build.html`, and `mesh-start.html` (under `andromeda/04_SOFTWARE/p31ca/public/`) for **Personal Agent Room** (`CWP-P31-PAR-2026-01`, `CWP-31/`) and **Initial Build** (`CWP-P31-IB-2026-01`, `CWP-32/`; live **https://p31ca.org/build**). Styling and ethical psych layer: **`soup-quantum.css`**, normative map **`docs/ETHICAL-STYLE-MAP.md`**; **`npm run sync:soup-bonding`** for **`bonding.p31ca.org/soup`**. **When-scale roadmap:** **`docs/PLAN-BONDING-SOUP-WHEN-SCALE.md`**. |
| `dist/` | Compiled JS (regenerate after `src/` edits) |
| `wcd33-global-archive/` | WCD-33 Worker (KV, rate limits, CORS). See `wcd33-global-archive/DEPLOY.md` |
| `spikes/` | Time-boxed harnesses (mock WS `8082`, Posner spike, interpolation, spatial chat) |
| `README.md` | **Runbook** for this vertical only |

**Convergence hooks:** `window.BONDING_ARCHIVE_URL` → deployed `wcd33-soup-archive`; optional `?ws=` → local or live multiplayer test.

## 3. Parallel path — **`andromeda/04_SOFTWARE/`** (P31 Labs monorepo)

**GitHub:** [https://github.com/p31labs/andromeda](https://github.com/p31labs/andromeda) (separate remote from this home repo; `andromeda/` is often gitignored here).

**Owns:** the **large** pnpm workspace (Turbo, multiple apps and workers). **Not** the same package as root `bonding-soup`, but **thematically aligned** (BONDING app, K₄ cages, command centers, telemetry, donate API, etc.).

**Entry:** `andromeda/04_SOFTWARE/README.md`, `SETUP.md`, `pnpm-workspace.yaml`. The **Cognitive Passport** subsection in `04_SOFTWARE/README.md` explains how the p31ca mirror relates to root `cognitive-passport/` when both trees exist.

**Examples of top-level packages** (not exhaustive): `bonding`, `frontend`, `k4-cage`, `k4-personal`, `k4-hubs`, `t4-cage`, `unified-k4-cage`, `cloudflare-worker`, `command-center`, `sovereign-command-center`, `genesis-gate`, `donate-api`, `p31-forge`, `p31-state`, `p31ca`, `telemetry-worker`, `workers`, `packages`, `discord`, …

**p31ca static hub** (under `p31ca/public/`): `index.html` (vector catalog), `lattice.html` (3D Fibonacci sphere), `passport-generator.html` — last is a **deploy mirror** of root `cognitive-passport/index.html` (header/footer transform: **`p31ca/scripts/passport-p31ca-transform.mjs`**, re-exported at root `scripts/`); from repo root **`npm run sync:passport`** / **`npm run verify:passport`**; from **`andromeda/04_SOFTWARE/p31ca`**, **`npm run passport:sync`** / **`npm run passport:verify`**. **`npm run deploy`** in `p31ca` runs **`passport:verify`** first (`predeploy`).

**Rule of thumb:** new **product** or **full-stack** work often lands **here**. The **root** `src/` engine is the **lightweight** vertical for C.A.R.S. + demo + archive without the monorepo weight.

## 4. Parallel path — **`phosphorus31.org/`**

**Owns:** a **separate** site / engine / packages tree (e.g. UI, SUPER-CENTAUR, shared packages). Same **brand orbit**, **different** root `package.json` and deploy story. Treat as its own product unless you explicitly unify.

**Parallel shipping:** updates here do **not** go through the **p31ca** or **Andromeda `04_SOFTWARE/p31ca`** pipeline. If two agents (or you + automation) are moving fast, use **separate PRs / deploy targets** so `p31ca.org` and `phosphorus31.org` stay independent unless you **intentionally** coordinate a single release.

## 4a. Site update tracks (bake into workflow, not a one-off)

| Track | What ships | Default commands / CI (when applicable) |
|--------|------------|----------------------------------------|
| **A — Technical hub** | **`p31ca.org`** (Astro hub, `*-about.html`, passport mirror) | `andromeda/04_SOFTWARE/p31ca`: `npm run hub:ci`, passport verify/sync, `npm run deploy`; workflows **`p31ca-hub.yml`**, **P31 Automation** / Pages. Registry + home grid id order: `scripts/hub/registry.mjs` and `scripts/hub/hub-app-ids.mjs` — **`docs/P31-HUB-CARD-ECOSYSTEM.md`**. From **home root** (Andromeda present): **`npm run hub:diff:p31ca`** or **`npm run p31 -- hub-diff`** — ground-truth + Worker SPA launches + hub-landing diff (no Astro build). |
| **B — Public org / programs site** | **`phosphorus31.org`** | That repo’s own `package.json`, CI, and `DEPLOY` docs — **not** the p31ca path above. |
| **C — P31 home vertical** | C.A.R.S. (`soup.html`), passport authoring, wcd33 archive | Root `npm run verify` / `release:check`, `wcd33-global-archive` per its `DEPLOY.md`. |

**Rule:** “Site update” in standups means: pick **A**, **B**, or **C** (or more than one **explicitly**), run the matching checks, then deploy the matching project name on Cloudflare — never assume one build updates every domain.

**Deploy spine (which CI/manual/local path hits `p31ca.org`, secrets names, ecosystem-order caveat):** **`docs/P31-DEPLOY-CANON.md`**.

**CONNECTION (mission Connect, operator wiring):** **`npm run connection`** — ties deploy canon, ecosystem **`deployables`**, **`P31_*`** catalog, edge commands, live hub URLs (**`scripts/p31-connection.mjs`**); echoed briefly after **`npm run doctor`**.

## 5a. Python **`p31-office`** + **`p31-foundry`** (local ops + document spine)

| Path | Role |
|------|------|
| **`packages/p31-office/`** | **`p31-office`**: discovery PDF assembly, Zenodo scan wrapper, doctor — **`packages/p31-office/README.md`**, **`packages/p31-office/examples/discovery_assembly.json`**. |
| **`packages/p31-foundry/`** | **`p31-foundry`**: ingest, manifest, pipelines, **`push`**, **`job`** (create/get/**list**), local `.p31-foundry`, optional **`events.jsonl`** — **`packages/p31-foundry/README.md`**. **Spec:** **`docs/P31-DOCUMENT-FOUNDRY.md`**. **Worker (R2 + queue + `GET /v1/jobs`):** **`packages/p31-foundry/worker/`** — **`foundry:worker:install`**, **`foundry:worker:dev`**, **`foundry:worker:check`**. |
| **`Discovery/assemble_supplemental_exhibits.py`** | Thin **shim** → `p31_office.discovery.assembler` (adds `packages/p31-office/src` to `sys.path` when not installed). |

**Install from repo root:** `npm run office:install` (creates **`Discovery/.venv`** if needed, then editable-installs **`p31-office`** and **`p31-foundry`**). **Run:** `npm run office`, `npm run foundry`, **`npm run foundry:doctor`**. **Shim without venv:** **`Discovery/assemble_supplemental_exhibits.py`** prepends `packages/p31-office/src`.

**Zenodo:** `p31-office zenodo scan -- --mode full` forwards to **`p31labs/scripts/zenodo_scan_local.py`** (or **`P31_REPO_ROOT`**).

## 5. Narrative & spec — **`docs/`** (this root)

Design notes, WCD readiness, websocket spec, roadmap, affective-chemistry spec. **Source of intent**; implementation may be in **root** `src/`, **andromeda**, or both.

**K₄ / SIC-POVM metaphor, vibe+agentic workflow, youth path:** **`docs/SIC-POVM-K4-ARCHITECTURE.md`**, **`docs/AGENTIC-VIBE-INFRASTRUCTURE.md`**, **`docs/PLAN-KIDS-VIBE-CODING.md`**. **Ethical UI (P31 token semantics, motion, “rewards” — no dark patterns; agent checklist):** **`docs/ETHICAL-STYLE-MAP.md`**. **Quantum egg + Larmor UI coherence (CI: `verify:egg-hunt`):** **`docs/EGG-HUNT.md`**, manifest **`docs/egg-hunt-manifest.json`**. 

**External model / handoff review (Gemini, Opus, etc.):** start at **`docs/README-REVIEW-DOCS.md`** — index to **`docs/GEMINI-OPUS-REVIEW-BUNDLE.md`**, workflow / Workers / CWP supplements, and **`docs/MVP-DELIVERABLES-INVENTORY.md`** (tiered LIVE/MVP + grant summary). **Human onboarding (Tyler / collaborators):** **`docs/HANDOFF-TYLER-P31.md`** — live URLs, both repos, PR pointer, verify commands, operator triangle. **Updated 2026-04-25:** see **`p31-constants.json`** for operator-locked numbers; **`docs/CANONICAL-NUMBERING.md`** for namespaces. **`npm run apply:constants`** / **`verify:constants`** keep `ground-truth` aligned.

**Multi-dome / Spaceship Earth synthesis:** **`docs/WORK-PACKAGE-SYNERGETIC-GEODESIC-STACK.md`** — proposed epics: synergetic manifest + CI verifier, shared icosa / panel geometry, tensegrity seam in the observatory stack, p31ca ↔ PWA deep links, optional ethical “Fate 20” layer.

**p31ca GEODESIC (static builder) on-ramp + K4 live room:** **`docs/GEODESIC-CAMPAIGN.md`** — progressive 5-track coach, tool locks, Durable Object room, `p31.ground-truth` route `geodesic`. **External engines (Unity, Godot, …):** **`docs/GEODESIC-GAME-ENGINE-INTEGRATION.md`** — same `wss` + JSON as the browser; package **`andromeda/04_SOFTWARE/geodesic-room/`**.

## 6. Operator & agent context (not application code)

| File | Role |
|------|------|
| `AGENTS.md` | Short **multi-root** agent orientation (read this, then `P31-ROOT-MAP`, passport sync rules) |
| `CLAUDE.md` / `.cursorrules` | Mesh, Spoons, legal/ops ground truth for agents |
| `.cursor/rules/cognitive-passport-mirror.mdc` | When editing the passport HTML or p31ca mirror: sync/verify, no hand-diverging mirror |
| `P31 COGNITIVE PASSPORT — v5.md` | Full human/operator life context (source of record). **Authoritative edition = H1** (e.g. v5.1); see **`docs/CANONICAL-NUMBERING.md`**. |
| `cognitive-passport/index.html` | **Generator** (machine slice: MD + JSON + agent block). Local: `npm run demo` → `/cognitive-passport/index.html`. **Does not** replace the v5 doc. Deploy mirror: `p31ca/public/passport-generator.html`; live: **https://p31ca.org/passport** |
| `Neuro-Inclusive Mesh Dashboard Design.txt`, … | Product / onboarding design drafts |
| `validate-p31-full.sh`, `audit_runner.py` | Extended validation: same local gates as **`npm run verify`**, plus doc-library rebuild/verify in scorecard, then live mesh audits + report JSON (`/tmp/p31_validation_report.json`). Faster path: **`npm run verify`**. |
| `playwright/` | Browser tests (e.g. `visual.test.ts`) |

## 7. When to work where

| Goal | Start here |
|------|------------|
| **New agent / IDE session** (where am I, what to sync) | `AGENTS.md` → this map → target tree |
| Tweak **C.A.R.S.** physics, rehydration, WCD-33 client, **`soup.html`** | Root `src/`, `soup.html`, `wcd33-global-archive/` |
| **Deploy** archive Worker | `wcd33-global-archive/DEPLOY.md` |
| **SIMPLEX crew + SENTINEL**, Context resolution | `simplex-v7/` — **`DEPLOY.md`**, **`npm run verify:simplex`**. **`simplex-email/`**: inbound HERALD Email Worker — **`simplex-email/README.md`**, **`npm run verify:simplex-email`**. Automated CF bring-up (**D1/KV/queue/schema**): **`npm run simplex:bootstrap:apply`** (see **`DEPLOY.md`** §0); ship bar **`verify:simplex-bootstrap`** after **`verify:simplex-email`**. |
| **Full** BONDING app / Vite / HUD / org integration | `andromeda/04_SOFTWARE/bonding` (or `frontend` as per that repo) |
| **K₄ / cage / hubs** | `k4-cage`, `k4-hubs`, `t4-cage`, etc. under `andromeda/04_SOFTWARE/` |
| **Spikes / proofs** | `spikes/`, `docs/technical-spikes-backlog.md` |
| **Court discovery PDFs** (WRJ-S01..S18 + combined volume) | **`packages/p31-office`** + **`Discovery/`** raw PDFs — `npm run office -- discovery assemble --help` |

## 8. Intentional non-goals

- **Merging** root C.A.R.S. / `bonding-soup` vertical into Andromeda (or the reverse) is a **project decision**, not required for coherence.
- **One Git repo** is not implied by this map; the map is for **human navigation** across co-located trees.

---

*Last: root `README.md` = how to run **this** vertical; **this file** = how the whole **workspace** fits together.*
