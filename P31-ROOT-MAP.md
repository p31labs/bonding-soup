# P31 workspace map (all roots, parallel paths)

This file is the **single map of record** for what lives under **`/home/p31`**: one home directory, **several code lines** that share mission and vocabulary but do **not** have to merge into one repo.

## 1. Spine (what ties everything together)

| Layer | Idea |
|--------|------|
| **Mission** | Build, create, connect — decentralized family / community mesh (see `CLAUDE.md`, `.cursorrules`). |
| **Edge** | Cloudflare Workers, KV, DO where needed; rate limits and CORS at the door. |
| **WCD lineage** | `docs/` — WCD-31 physics, WCD-32 ghosts/WS, WCD-33 archive; implementation may live in more than one tree. |

## 2. Primary vertical — **this folder** (standalone BONDING Soup)

**Owns:** the **thin, shippable** sim + demo + archive worker at repo root.

| Path | Role |
|------|------|
| `package.json` | `bonding-soup` — `npm run build` → `tsc` → `dist/` |
| `src/` | Engine (`soup.ts`, `soupPhysics.ts`, `reactions.ts`, …), persistence, memory panel, demo glue |
| `soup-demo.html` | Browser entry; `?ws=` / `?debug` |
| `dist/` | Compiled JS (regenerate after `src/` edits) |
| `wcd33-global-archive/` | WCD-33 Worker (KV, rate limits, CORS). See `wcd33-global-archive/DEPLOY.md` |
| `spikes/` | Time-boxed harnesses (mock WS `8082`, Posner spike, interpolation, spatial chat) |
| `README.md` | **Runbook** for this vertical only |

**Convergence hooks:** `window.BONDING_ARCHIVE_URL` → deployed `wcd33-soup-archive`; optional `?ws=` → local or live multiplayer test.

## 3. Parallel path — **`andromeda/04_SOFTWARE/`** (P31 Labs monorepo)

**Owns:** the **large** pnpm workspace (Turbo, multiple apps and workers). **Not** the same package as root `bonding-soup`, but **thematically aligned** (BONDING app, K₄ cages, command centers, telemetry, donate API, etc.).

**Entry:** `andromeda/04_SOFTWARE/README.md`, `SETUP.md`, `pnpm-workspace.yaml`. The **Cognitive Passport** subsection in `04_SOFTWARE/README.md` explains how the p31ca mirror relates to root `cognitive-passport/` when both trees exist.

**Examples of top-level packages** (not exhaustive): `bonding`, `frontend`, `k4-cage`, `k4-personal`, `k4-hubs`, `t4-cage`, `unified-k4-cage`, `cloudflare-worker`, `command-center`, `sovereign-command-center`, `genesis-gate`, `donate-api`, `p31-forge`, `p31-state`, `p31ca`, `telemetry-worker`, `workers`, `packages`, `discord`, …

**p31ca static hub** (under `p31ca/public/`): `index.html` (vector catalog), `lattice.html` (3D Fibonacci sphere), `passport-generator.html` — last is a **deploy mirror** of root `cognitive-passport/index.html` (header/footer transform: **`p31ca/scripts/passport-p31ca-transform.mjs`**, re-exported at root `scripts/`); from repo root **`npm run sync:passport`** / **`npm run verify:passport`**; from **`andromeda/04_SOFTWARE/p31ca`**, **`npm run passport:sync`** / **`npm run passport:verify`**. **`npm run deploy`** in `p31ca` runs **`passport:verify`** first (`predeploy`).

**Rule of thumb:** new **product** or **full-stack** work often lands **here**. The **root** `src/` Soup is the **lightweight** vertical for engine + demo + archive without the monorepo weight.

## 4. Parallel path — **`phosphorus31.org/`**

**Owns:** a **separate** site / engine / packages tree (e.g. UI, SUPER-CENTAUR, shared packages). Same **brand orbit**, **different** root `package.json` and deploy story. Treat as its own product unless you explicitly unify.

## 5. Narrative & spec — **`docs/`** (this root)

Design notes, WCD readiness, websocket spec, roadmap, affective-chemistry spec. **Source of intent**; implementation may be in **root** `src/`, **andromeda**, or both.

## 6. Operator & agent context (not application code)

| File | Role |
|------|------|
| `AGENTS.md` | Short **multi-root** agent orientation (read this, then `P31-ROOT-MAP`, passport sync rules) |
| `CLAUDE.md` / `.cursorrules` | Mesh, Spoons, legal/ops ground truth for agents |
| `.cursor/rules/cognitive-passport-mirror.mdc` | When editing the passport HTML or p31ca mirror: sync/verify, no hand-diverging mirror |
| `P31 COGNITIVE PASSPORT — v5.md` | Full human/operator life context document (source of record for the narrative) |
| `cognitive-passport/index.html` | **Generator** (machine slice: MD + JSON + agent block). Local: `npm run demo` → `/cognitive-passport/index.html`. **Does not** replace the v5 doc. Deploy mirror: `p31ca/public/passport-generator.html`; live: **https://p31ca.org/passport** |
| `Neuro-Inclusive Mesh Dashboard Design.txt`, … | Product / onboarding design drafts |
| `validate-p31-full.sh`, `audit_runner.py` | Validation / audit automation |
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
