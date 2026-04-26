# P31 workspace map (all roots, parallel paths)

This file is the **single map of record** for what lives under **`/home/p31`**: one home directory, **several code lines** that share mission and vocabulary but do **not** have to merge into one repo.

## 1. Spine (what ties everything together)

| Layer | Idea |
|--------|------|
| **Ship bar** | **`docs/P31-ENGINEERING-STANDARD.md`** (home) + **`andromeda/docs/ENTERPRISE_QUALITY.md`** (monorepo): `verify`, `release:check`, no secrets in git, single canon JSON. **New clone:** `npm run setup` (root + `apply:constants` + `verify` + p31ca install + optional **`git:hooks`**, when present — see `README.md`). |
| **Ecosystem + monetary gates** | **`p31-ecosystem.json`** (glass deploy templates), **`p31-live-fleet.json`** (one-file bundle of live sites + Worker URLs + allowlist), **`npm run verify:map-pipeline`** (Andromeda MAP, part of default **`npm run verify`** when andromeda exists), **`npm run verify:monetary`** (full: ecosystem + constants + MAP + economy), **`npm run ecosystem:glass`**. **`.githooks/pre-commit`** runs `verify:monetary` on staged payment/creator-economy paths. Full **`p31ca`** contract checks (incl. **`verify:economy`**, **ground-truth** ↔ **public** `creator-economy.json`) ship from the [Andromeda](https://github.com/p31labs/andromeda) repo; `andromeda/` is often **gitignored** in this home checkout—land hub-side verifier edits there. |
| **Mission** | Build, create, connect — decentralized family / community mesh (see `CLAUDE.md`, `.cursorrules`). |
| **p31ca.org contract (machine-routable)** | **`andromeda/04_SOFTWARE/p31ca/ground-truth/p31.ground-truth.json`** — must stay in lockstep with `p31ca/public/_redirects`, invariants in `scripts/hub/registry.mjs`, and pinned 3D entry files. Verify: from **`p31ca`**, `npm run verify:ground-truth` (also part of `prebuild`). **Multi-dome surfaces (Three pins + PWA):** same folder **`synergetic-manifest.json`** — `npm run verify:synergetic` (also `prebuild`). **`docs/CANONICAL-NUMBERING.md`** defines version **namespaces** (ground-truth semver vs CogPass edition vs WCD, etc.). |
| **Edge** | Cloudflare Workers, KV, DO where needed; rate limits and CORS at the door. |
| **WCD lineage** | `docs/` — WCD-31 physics, WCD-32 ghosts/WS, WCD-33 archive; implementation may live in more than one tree. |

## 2. Primary vertical — **this folder** (standalone BONDING Soup)

**Owns:** the **thin, shippable** sim + demo + archive worker at repo root.

| Path | Role |
|------|------|
| `package.json` | `bonding-soup` — `npm run build` → `tsc` → `dist/` |
| `src/` | Engine (`soup.ts`, `soupPhysics.ts`, `reactions.ts`, …), persistence, memory panel, demo glue |
| `soup-demo.html` | Browser entry; `?ws=` / `?debug` — same **`npm run demo`** server as **Cognitive Passport**; also links to **p31ca** `planetary-onboard.html`, `initial-build.html`, and `mesh-start.html` (under `andromeda/04_SOFTWARE/p31ca/public/`) for **Personal Agent Room** (`CWP-P31-PAR-2026-01`, `CWP-31/`) and **Initial Build** (`CWP-P31-IB-2026-01`, `CWP-32/`; live **https://p31ca.org/build**). |
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

**Rule of thumb:** new **product** or **full-stack** work often lands **here**. The **root** `src/` Soup is the **lightweight** vertical for engine + demo + archive without the monorepo weight.

## 4. Parallel path — **`phosphorus31.org/`**

**Owns:** a **separate** site / engine / packages tree (e.g. UI, SUPER-CENTAUR, shared packages). Same **brand orbit**, **different** root `package.json` and deploy story. Treat as its own product unless you explicitly unify.

**Parallel shipping:** updates here do **not** go through the **p31ca** or **Andromeda `04_SOFTWARE/p31ca`** pipeline. If two agents (or you + automation) are moving fast, use **separate PRs / deploy targets** so `p31ca.org` and `phosphorus31.org` stay independent unless you **intentionally** coordinate a single release.

## 4a. Site update tracks (bake into workflow, not a one-off)

| Track | What ships | Default commands / CI (when applicable) |
|--------|------------|----------------------------------------|
| **A — Technical hub** | **`p31ca.org`** (Astro hub, `*-about.html`, passport mirror) | `andromeda/04_SOFTWARE/p31ca`: `npm run hub:ci`, passport verify/sync, `npm run deploy`; workflows **`p31ca-hub.yml`**, **P31 Automation** / Pages. Registry: `p31ca/scripts/hub/`. |
| **B — Public org / programs site** | **`phosphorus31.org`** | That repo’s own `package.json`, CI, and `DEPLOY` docs — **not** the p31ca path above. |
| **C — P31 home vertical** | Soup, passport authoring, wcd33 archive | Root `npm run verify` / `release:check`, `wcd33-global-archive` per its `DEPLOY.md`. |

**Rule:** “Site update” in standups means: pick **A**, **B**, or **C** (or more than one **explicitly**), run the matching checks, then deploy the matching project name on Cloudflare — never assume one build updates every domain.

## 5. Narrative & spec — **`docs/`** (this root)

Design notes, WCD readiness, websocket spec, roadmap, affective-chemistry spec. **Source of intent**; implementation may be in **root** `src/`, **andromeda**, or both.

**K₄ / SIC-POVM metaphor, vibe+agentic workflow, youth path:** **`docs/SIC-POVM-K4-ARCHITECTURE.md`**, **`docs/AGENTIC-VIBE-INFRASTRUCTURE.md`**, **`docs/PLAN-KIDS-VIBE-CODING.md`**. **Quantum egg + Larmor UI coherence (CI: `verify:egg-hunt`):** **`docs/EGG-HUNT.md`**, manifest **`docs/egg-hunt-manifest.json`**.

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
| `validate-p31-full.sh`, `audit_runner.py` | Extended validation: local passport + constants + p31ca contracts, then live mesh audits + report JSON (`/tmp/p31_validation_report.json`). Faster path: **`npm run verify`**. |
| `playwright/` | Browser tests (e.g. `visual.test.ts`) |

## 7. When to work where

| Goal | Start here |
|------|------------|
| **New agent / IDE session** (where am I, what to sync) | `AGENTS.md` → this map → target tree |
| Tweak **Soup** physics, rehydration, WCD-33 client, **soup-demo** | Root `src/`, `soup-demo.html`, `wcd33-global-archive/` |
| **Deploy** archive Worker | `wcd33-global-archive/DEPLOY.md` |
| **Full** BONDING app / Vite / HUD / org integration | `andromeda/04_SOFTWARE/bonding` (or `frontend` as per that repo) |
| **K₄ / cage / hubs** | `k4-cage`, `k4-hubs`, `t4-cage`, etc. under `andromeda/04_SOFTWARE/` |
| **Spikes / proofs** | `spikes/`, `docs/technical-spikes-backlog.md` |

## 8. Intentional non-goals

- **Merging** root Soup into Andromeda (or the reverse) is a **project decision**, not required for coherence.
- **One Git repo** is not implied by this map; the map is for **human navigation** across co-located trees.

---

*Last: root `README.md` = how to run **this** vertical; **this file** = how the whole **workspace** fits together.*
