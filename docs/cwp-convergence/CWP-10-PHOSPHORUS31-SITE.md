# CWP-10 — Phosphorus31.org (org site, parallel)

**Id:** `P31-CONVERGE-10-PHOS31`  
**Status:** OPEN (when staffed)

## Objective

**phosphorus31.org** (and org API hosts in constants) have their **own** verify/deploy/docs per `P31-ROOT-MAP` — not mixed with p31ca in the same PR unless the operator **explicitly** wants one release.

## In scope

- Constants: `p31-constants` org appearance tokens; any `phosphorus31.org` URL in `p31-facts` / alignment **matches** live.
- Donate / API hosts: `donate-api.phosphorus31.org` health in 06 overlap — reference here, implement in 06/07 as applicable.
- Design tokens: `data-p31-appearance="org"` per canon.

## Out of scope

- duplicating the technical hub; **p31ca.org** remains the engineering hub.

## Production convergence

- [ ] Org site deploy runbook in tree (or Andromeda path) is **one command** the operator can repeat.
- [ ] `npm run doctor` or alignment points to the right package path for phosphorus31.
- [ ] `verify:ecosystem` / glass includes org URL row if in manifest.

**Parallel:** all; **no** hard dep on 01–09 except **constants** accuracy.
