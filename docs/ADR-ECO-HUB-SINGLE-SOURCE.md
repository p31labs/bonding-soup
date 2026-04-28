# ADR — ECO hub grid: single source of truth (cockpit parity)

**Status:** Accepted (2026-04-27)  
**Scope:** p31ca.org **/** product grid, about pages, and hub verify chain  
**Related:** `docs/P31-HUB-CARD-ECOSYSTEM.md`, `docs/ECO-P0-1-SNAPSHOT.md`, `docs/P31-ALIGNMENT-SYSTEM.md`

## Context

Older experiments used a parallel **`mvpData`** blob (static HTML) for the home catalog. That **diverged** from **`HUB_COCKPIT_ORDER`** / **`hub-app-ids.mjs`**, creating agent confusion and duplicate maintenance.

## Decision

1. **Single authoritative graph:** `scripts/hub/registry.mjs` (+ **`scripts/hub/hub-app-ids.mjs`** order) drives **`src/data/hub-landing.json`** via **`scripts/hub/build-landing-data.mjs`** (`npm run hub:build` / postinstall).

2. **`src/pages/index.astro`** imports **`hub-landing.json`** only — no inline product arrays (CWP D2).

3. **Legacy retired:** `public/legacy-mvp-hub.html` (and any **`mvpData`** homepage) is **removed**, not dual-maintained.

4. **Ground truth:** **`ground-truth/p31.ground-truth.json`** **`routes.registry`** + **`registryAppUrlInvariants`** stay aligned with **`registry.mjs`** (`npm run verify:ground-truth`).

5. **Drift guard:** `scripts/hub/diff-index-sources.mjs` runs in **prebuild**: **`hub-landing`** core product **ids** and **order** === **`HUB_COCKPIT_ORDER`**; optional legacy **`mvpData`** parse only if someone reintroduces the file (should stay absent).

6. **About enrich:** `scripts/enrich-mvp-about-pages.mjs` reads **`hub-landing.json`** targets only (name is historical).

## Consequences

- **Agents and humans** should treat **`hub-landing.json`** + **`hub-app-ids.mjs`** + **`registry.mjs`** as the cockpit contract — not Web3 indexers, not a second HTML catalog.
- New cards: edit **registry + hub-app-ids**, run **`npm run hub:about:generate`** (and verify), **`hub:build`** refreshes JSON.

## Compliance

- **`p31-alignment.json`** derivation **`hub-landing-data`** / **`registry-cockpit-vs-legacy-mvpdata`**  
- Prebuild: **`verify-ground-truth`** → **`hub:build`** → **`hub:verify`** → **`diff-index-sources`**
