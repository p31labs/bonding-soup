# ADR: ECO / mvpData / COCKPIT dual-track (hub product index)

**Status:** Accepted (legacy lane retired 2026-04-27 — CWP-P31-PHASE-D Track A)  
**Date:** 2026-04-27  
**Scope:** p31ca technical hub home — product grid, registry, and former legacy MVP index

---

## Context

1. The **Cockpit home** grid is driven from **`andromeda/04_SOFTWARE/p31ca/scripts/hub/registry.mjs`** and **`hub-app-ids.mjs`** → generated **`src/data/hub-landing.json`** (see **`docs/P31-HUB-CARD-ECOSYSTEM.md`**).  
2. **Retirement:** **`public/legacy-mvp-hub.html`** was **removed**; requests to **`/legacy-mvp-hub.html`** or **`/legacy-mvp-hub`** are **301 → `/`**. A second **`mvpData`** list no longer ships in the repo.  
3. In p31ca **prebuild**, **`scripts/hub/diff-index-sources.mjs`**: if a legacy `mvpData` file is absent, no dual-track mvp set is compared. Where **`--strict-mvp`** is used, `mvpData` ids must still exist in **`registry.mjs`**. **Warnings** (e.g. `mvpData` id not on **`HUB_ALL_CARD_ORDER`**, or inline `coreProducts` in `index.astro`) still mean real drift.  
4. **Phase 9** in **`docs/PLAN-11-10-FULL-ECOSYSTEM.md`** (registry vs mvpData vs COCKPIT) is **satisfied** for the static legacy file by this retirement; remaining work is hub/registry hygiene only.

## Decision

**Single lane** for the product index on the public hub:

| Lane | Source of truth | Use |
|------|------------------|-----|
| **A — Public hub grid (COCKPIT)** | `registry.mjs` + `hub-app-ids.mjs` (`HUB_COCKPIT_ORDER` + prototypes) + `hub-landing.json` | **Authoritative** for what appears on the current hub home and for **ground-truth** `registryAppUrlInvariants`. |
| **B — (retired)** | ~~`mvpData` in `legacy-mvp-hub.html`~~ | **Removed**; do not reintroduce a second static list without a new ADR. |

**Rule:** New cards, `appUrl`s, and about-page contracts follow **lane A** and **`docs/P31-HUB-CARD-ECOSYSTEM.md`**. **Warnings** from **diff-index-sources** mean real drift (e.g. inline `coreProducts` in `index.astro` per the script, or mvp reintroduced and not matching `HUB_ALL_CARD_ORDER`).

**Exit criteria (revisit this ADR when):** A new second product list is proposed (e.g. labs vs hub) and needs a **written split** with two machine-verified id sets.

## Consequences

- **CI / local:** `npm run prebuild` in p31ca: no more legacy **info** line for `mvpData` omission counts unless a legacy mvp file returns.  
- **Strict gate (optional):** `diff-index-sources.mjs --strict-mvp` if `mvpData` is ever reintroduced.  
- **Agents / operators:** Hub grid truth is **registry + hub-app-ids + hub-landing**; legacy static path was **`/legacy-mvp-hub.html` → 301 `/`**.

## References

- `andromeda/04_SOFTWARE/p31ca/scripts/hub/diff-index-sources.mjs`  
- `docs/P31-HUB-CARD-ECOSYSTEM.md`  
- `docs/PLAN-11-10-FULL-ECOSYSTEM.md` (Phase 9 — Product truth)  
- `docs/ECOSYSTEM-PRODUCTION-11.md` (ECO vs COCKPIT note)
