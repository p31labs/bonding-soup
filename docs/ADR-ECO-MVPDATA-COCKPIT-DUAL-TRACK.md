# ADR: ECO / mvpData / COCKPIT dual-track (hub product index)

**Status:** Accepted  
**Date:** 2026-04-27  
**Scope:** p31ca technical hub home — product grid, registry, and legacy MVP index

---

## Context

1. The **Cockpit home** grid is driven from **`andromeda/04_SOFTWARE/p31ca/scripts/hub/registry.mjs`** and **`hub-app-ids.mjs`** → generated **`src/data/hub-landing.json`** (see **`docs/P31-HUB-CARD-ECOSYSTEM.md`**).  
2. **`public/legacy-mvp-hub.html`** still carries an **`mvpData`** index — a second, overlapping list of product ids.  
3. **`scripts/hub/diff-index-sources.mjs`** compares `mvpData` ids to the registry; when they differ, it **warns** (it does not fail the default prebuild). The script itself prints that mismatch is **expected until ECO CWP merge**.  
4. **Phase 9** in **`docs/PLAN-11-10-FULL-ECOSYSTEM.md`** calls for resolving registry vs mvpData vs COCKPIT — or explicitly **dual-tracking** with an ADR.

## Decision

Until an explicit **ECO** (or equivalent) work package **merges** the two lanes:

| Lane | Source of truth | Use |
|------|------------------|-----|
| **A — Public hub grid (COCKPIT)** | `registry.mjs` + `hub-app-ids.mjs` (`HUB_COCKPIT_ORDER` + prototypes) + `hub-landing.json` | **Authoritative** for what appears on the current hub home and for **ground-truth** `registryAppUrlInvariants`. |
| **B — Legacy MVP index** | `mvpData` in `legacy-mvp-hub.html` | **Secondary**; treat as **lab / legacy** layout or historical mvpData — **not** a second registry of record. New products **must not** be added only to `mvpData`. |

**Rule:** New cards, `appUrl`s, and about-page contracts follow **lane A** and **`docs/P31-HUB-CARD-ECOSYSTEM.md`**. Warnings from **diff-index-sources** are **known noise** during dual-track, not a surprise defect.

**Exit criteria (revisit this ADR when):** `mvpData` is removed or **fully** aligned with the registry, **or** a written **split** documents two intentional product lists (e.g. “labs” vs “hub”) with two machine-verified id sets.

## Consequences

- **CI / local:** `npm run prebuild` in p31ca may still show **info** lines from `diff-index-sources` — **do not** silence them with blind “fixes” in `mvpData` without a product decision.  
- **Strict gate (optional):** `diff-index-sources.mjs --strict-mvp` is for **cleanup sprints** when intentionally shrinking drift.  
- **Agents / operators:** If someone asks “why two lists?” — point here and to **`PLAN-11-10` § Phase 9**.

## References

- `andromeda/04_SOFTWARE/p31ca/scripts/hub/diff-index-sources.mjs`  
- `docs/P31-HUB-CARD-ECOSYSTEM.md`  
- `docs/PLAN-11-10-FULL-ECOSYSTEM.md` (Phase 9 — Product truth)  
- `docs/ECOSYSTEM-PRODUCTION-11.md` (ECO vs COCKPIT note)
