# CWP-10 — Phosphorus31.org (org site, parallel)

**Id:** `P31-CONVERGE-10-PHOS31`  
**Status:** CLOSED (2026-04-28)

## Objective

**phosphorus31.org** (and org API hosts in constants) have their **own** verify/deploy/docs per `P31-ROOT-MAP` — not mixed with p31ca in the same PR unless the operator **explicitly** wants one release.

## In scope

- Constants: `p31-constants` org appearance tokens; any `phosphorus31.org` URL in `p31-facts` / alignment **matches** live.
- Donate / API hosts: `donate-api.phosphorus31.org` health in 06 overlap — reference here, implement in 06/07 as applicable.
- Design tokens: `data-p31-appearance="org"` per canon.

## Out of scope

- duplicating the technical hub; **p31ca.org** remains the engineering hub.

## Production convergence

- [x] Org site deploy runbook in tree: **`docs/PHOSPHORUS31-ORG-SITE.md`** (track B, separate clone, verify from home + curl smoke).
- [x] `P31-ROOT-MAP.md` §4 / §4a already points to org package/CI; doctor does not clone the org tree (documented in runbook).
- [x] `verify:ecosystem` + glass: `payment.*` and **monetary** probes cover donate-api health; org **home page** 200 as optional smoke: `https://phosphorus31.org/` (verified 2026-04-28).

**Parallel:** all; **no** hard dep on 01–09 except **constants** accuracy.

---

*Closed: 2026-04-28 — runbook + live org **200** + constants/glass path documented; org repo remains a separate deploy track.*
