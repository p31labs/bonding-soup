# Phosphorus31.org (org / programs site) — deploy runbook (home → operator)

**Track B** in **`P31-ROOT-MAP.md`** (site update track table): **`phosphorus31.org`** is **not** built from **`andromeda/04_SOFTWARE/p31ca`**. It has its own repository, `package.json`, and CI. Do not assume `npm run deploy` in p31ca updates the org site.

## When the org tree is on disk

1. `cd` to the **phosphorus31.org** clone (separate remote from BONDING Soup; often **not** present in a **home-only** checkout).
2. Open that repo’s **`package.json`**, **`DEPLOY`**, or **`README`** and run the same deploy script your CI uses (e.g. `npm run build` + Cloudflare Pages/Workers, as **that** project defines).
3. Ship **p31ca.org** and **phosphorus31.org** in **separate PRs** unless you **intentionally** align one release.

## Verification from the home (bonding-soup) repo

These **do** apply without the org tree checked in:

- **`p31-constants.json`** — `organization` + **`payment`**: `donateApiHealthUrl` / `stripeApiHealthUrl` must match the live **donate** Worker; run **`npm run apply:constants`** after edits.
- **`npm run doctor`** (root) — reports whether **Andromeda** / p31ca paths exist; it does not clone **phosphorus31.org** (see also **`P31-ROOT-MAP.md` §4**).
- **`npm run ecosystem:glass`** — **monetary** group includes **`https://donate-api.phosphorus31.org/health`** (and workers.dev mirror where configured). Shared with **CWP-06** (monetary/MAP).
- **Smoke:** `curl -sI -o /dev/null -w '%{http_code}\n' https://phosphorus31.org/` — expect **200** when the org Pages stack is up.

**Normative context:** `docs/ECOSYSTEM-PRODUCTION-11.md` (separate `api.phosphorus31.org` is **not** implied until that stack exists).

**Version:** 1.0.0 — 2026-04-28 (CWP-10)
