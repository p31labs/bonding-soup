# CWP-07 — BONDING satellite (bonding.p31ca.org)

**Id:** `P31-CONVERGE-07-BONDING`  
**Status:** CLOSED (2026-04-28)

## Objective

**bonding.p31ca.org** (and BONDING-related URLs in `p31-constants` / `p31-ecosystem`) are **green in glass**, registry links are not stale, and deploy is documented separately from p31ca hub (may share CI).

## In scope

- Glass row for BONDING public URL; `bonding.publicUrl` in constants.
- Cross-links from hub / fleet portal **verified** in `build:fleet-portal` / alignment if registry points to BONDING.
- Docs: BONDING deploy lives per `P31-ROOT-MAP` (not mixed into p31ca PRs without intent).

## Out of scope

- Merging p31ca and BONDING codebases; **separate** deploy story unless operator chooses one release train.

## Production convergence

- [x] `p31-alignment` / `p31-facts` bond URL matches live.
- [x] Ecosystem glass or manual curl: bonding site **200**.
- [x] `npm run verify:ecosystem` includes bonding URL set you maintain.

**Parallel:** 10; **soft dependency** on 09 for hub card truth.

---

*Closed: glass UP, `p31-constants.json` `bonding.publicUrl` and `testBaseline` aligned, relay `/health` 200.*
