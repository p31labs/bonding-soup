# CWP-09 — Registry + hub ECO (one card, one about)

**Id:** `P31-CONVERGE-09-REGISTRY-ECO`  
**Status:** CLOSED (2026-04-28)

## Objective

**After legacy sunset (complete):** every hub product id lives in `hub-app-ids.mjs` + `registry.mjs` 1:1, `hub-landing` generated, about pages present; **no** reintroduction of a second `mvpData` file without a new ADR. `diff-index-sources` stays clean.

## In scope

- Playbook: add/remove card: edit `hub-app-ids` + `registry` + `ground-truth` invariants as needed, `hub:build`, about gen, `verify`.
- `docs/P31-HUB-CARD-ECOSYSTEM.md` as normative.
- ECO WBS items from `CONTROLLED-WORK-PACKAGE-ECOSYSTEM-INTEGRATION.md` only as still applicable post–legacy delete.

## Out of scope

- Rebuilding legacy `legacy-mvp-hub` (retired); dual-track mvp is **not** coming back ungated.

## Production convergence

- [x] `node scripts/hub/diff-index-sources.mjs` — no [warn] for inline `index.astro` core products; no spurious mvp (file absent = OK).
- [x] `npm run hub:ci` (p31ca) on registry PRs.
- [x] `p31-alignment` derivation `registry-cockpit-vs-legacy-mvpdata` matches current story (to field updated in home).

**Base status:** legacy sunset **shipped**; **ongoing** hygiene for new cards is covered by `docs/P31-HUB-CARD-ECOSYSTEM.md` (Maintenance) + same verify chain.

---

*Closed: legacy sunset shipped, diff-index clean, one hub source of truth; add/remove card playbook: `docs/P31-HUB-CARD-ECOSYSTEM.md` § Maintenance.*
