# CWP-06 — Monetary + MAP (donate, creator economy)

**Id:** `P31-CONVERGE-06-MONETARY`  
**Status:** OPEN (guardrails)

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

- [ ] `https://p31ca.org/creator-economy.json` matches ground truth (CI proves).
- [ ] `payment.donateApiHealthUrl` (or current health URL) returns **200** in glass / manual curl.
- [ ] `npm run verify:map-pipeline` + `verify:monetary` on release PRs touching **payment/**.
- [ ] `prebuild` githooks: monetary hook as already configured in home.

**Dependencies:** 08 for new Worker payment routes.  
**Parallel:** 01, 07.
