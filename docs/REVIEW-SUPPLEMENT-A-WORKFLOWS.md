# Supplement A — GitHub Actions inventory (for Gemini / Opus)

**Scope:** Workflows present under the P31 workspace as of **April 25, 2026**. Paths are **relative to the repository** that contains them; the P31 home checkout and Andromeda checkout may differ.

**Convention:** `name:` in each YAML is the display name in GitHub’s UI.

---

## A.1 P31 home root (when `.github` lives at workspace root)

| File | Purpose |
|------|---------|
| `p31-ci.yml` | Path-filtered CI + **`workflow_dispatch`**: runs `node scripts/p31-ci.mjs` on push/PR to `main`/`master` when `andromeda/04_SOFTWARE/p31ca/**`, passport, **`p31-constants.json`**, **`tsconfig.json`**, **`src/**/*.ts`**, constants scripts (`verify-constants`, `apply-constants`, `verify-p31ca-contracts`, `scripts/lib/**`), **`validate-p31-full.sh`**, or CI scripts change. Driver runs root **`npm ci`** then **`npm run verify`** (passport + constants + p31ca contracts + `tsc`) then p31ca **`npm ci`** + verify/build. |

**Local equivalent:** `npm run p31:ci` (or `npm run verify:all`, `npm run release:check` — aliases).

---

## A.2 Andromeda root workflows (`andromeda/.github/workflows/`)

| File | Purpose |
|------|---------|
| `p31-automation.yml` | PR/push verify + **manual dispatch** deploy toggles: bouncer, command-center, Starlight docs, p31ca Pages, phosphorus31 Pages, `p31ca_strict_passport`. Central “deploy dashboard” workflow. |
| `p31ca-hub.yml` | Hub pipeline for p31ca — build, verify, deploy path. |
| `monorepo-verify.yml` | Cross-package Turbo / pnpm verification (deploy guard, monetary surface script, build/test). |
| `uptime.yml` | Cron-based health: bonding, phosphorus31.org, bonding-relay. |
| `deploy-workers.yml` | Cloudflare Worker deployments. |
| `cloudflare-secrets-smoke.yml` | Verifies secrets availability. |
| `donate-api.yml` | Donate API Worker. |
| `build-portable.yml` | Portable build. |
| `coverage.yml` | Test coverage. |
| `omnibus-frontend.yml` | Omnibus + frontend. |
| `phosphorus31-site.yml` | phosphorus31.org. |
| `ci.yml` | Root Andromeda CI (see `name:` in file). |
| `social-dispatch.yml`, `broadcast.yml`, `posner-sync-fallback.yml`, `sce-pacemaker.yml` | Cross-cutting or scheduled jobs. |

---

## A.3 `04_SOFTWARE/.github/workflows/`

| File | Purpose |
|------|---------|
| `ci.yml` | Often Spaceship / monorepo package CI (see file header). |
| `deploy-spaceship.yml` | Spaceship Earth. |
| `release.yml` | Release pipeline. |
| `grant-radar.yml` | Grant automation. |
| `social-dispatch.yml` | Social dispatch. |
| `nightly-qsuite.yml` | Nightly suite. |
| `posner-sync-fallback.yml` (and related) | See `andromeda/.github/workflows/`. |

**Also:** `andromeda/04_SOFTWARE/spaceship-earth/.github/workflows/test.yml` — package-local tests.

---

## A.4 Other / nested

| File | Purpose |
|------|---------|
| `andromeda/trimtab-signal/.github/workflows/deploy.yml` | trimtab-signal. |
| `andromeda/04_SOFTWARE/.github/dependabot.yml` | Dependency updates. |

---

## A.5 Relationship: local vs CI

| Local command | CI / workflow |
|---------------|----------------|
| `npm run p31:ci` | `p31-ci.yml` (home) |
| `cd andromeda/04_SOFTWARE/p31ca && npm run hub:ci` / `ci` | `p31ca-hub.yml` |
| `pnpm` + Turbo at Andromeda root | `monorepo-verify.yml` |
| Uptime | `uptime.yml` |

---

## A.6 Design notes

1. **Manual dispatch** on `p31-automation.yml` — boolean toggles per deploy target; reduces accidental production deploys from casual merges.
2. **Path filtering** on home `p31-ci.yml` — limits runs to relevant diffs; **`workflow_dispatch`** reruns full home CI without waiting for a matching path push.
3. **Fork safety (CWP G8):** fork PRs must not *require* Cloudflare API secrets; workflows should **degrade** when secrets are absent.
4. **Two different `ci.yml` names** may exist in different directories — disambiguate by path.

---

*See `REVIEW-SUPPLEMENT-B` for the Workers / Pages map.*
