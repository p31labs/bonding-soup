# CWP-06 — Monetary + MAP (donate, creator economy)

**Id:** `P31-CONVERGE-06-MONETARY`  
**Status:** CLOSED (2026-04-28)

## Objective

**Ethical creator economy** + **MAP pipeline** stay machine-verified: `creator-economy.json` = ground truth; `verify:map-pipeline` + `verify:monetary` (home); donate-api + Stripe health URLs in `p31-constants.json` **payment.***; no fee drift without intentional commit.

## In scope

- Hub donate card + about pages ↔ registry; public JSON on hub.
- `verify:economy` in p31ca; root `verify:monetary` when payment files change.
- Document 30-day notice in contract if terms change.
- BONDING `creator-economy` and p31ca mirror in sync (alignment derivation).

## Out of scope

- HCB/Stripe org onboarding drama (ops); this CWP is **wiring + verify**.

## Production convergence

- [x] `https://p31ca.org/creator-economy.json` matches ground truth (CI: `verify:economy` in p31ca; `verify:monetary` chains it).
- [x] `payment.donateApiHealthUrl` / `donate-api` rows **200** in `ecosystem:glass` (and workers.dev twin).
- [x] `npm run verify:map-pipeline` + `verify:monetary` on root `npm run verify`.
- [x] Pre-commit monetary hook in home (`verify:monetary` when payment files staged) unchanged.

**Dependencies:** 08 for new Worker payment routes.  
**Parallel:** 01, 07.

---

*Closed: 2026-04-28 — `verify:map-pipeline` OK, `verify:monetary` OK (ecosystem + constants + p31ca `verify:economy`); glass monetary + creator-economy contract rows UP 200.*
