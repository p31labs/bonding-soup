# Runbook: Hub red (p31ca.org Pages / hub build)

**When to use:** **`https://p31ca.org/`** or critical hub routes fail, **`hub:ci`** fails locally or in Andromeda Actions, or **`release:public`** / **`p31:ci`** dies on the p31ca phase.

**Canonical context:** Static + Astro hub: **`andromeda/04_SOFTWARE/p31ca/`** — [P31 deploy canon](../P31-DEPLOY-CANON.md) (Andromeda CI vs home manual deploy). Operator UI: **`https://p31ca.org/ops/`** (also printed by **`npm run connection`**).

---

## 1. Fast local triage (home repo root)

| Step | Command | Pass |
|------|---------|------|
| A | `npm run hub:diff:p31ca` | Exit 0 — ground-truth + Worker SPA launch + hub index diff (cheaper than full build) |
| B | `npm run verify` | Exit 0 — full home bar including **`verify:p31ca-contracts`** when Andromeda is present |

---

## 2. Full hub build (inside p31ca package)

Run from **`andromeda/04_SOFTWARE/p31ca`**:

| Step | Command | Pass |
|------|---------|------|
| C | `npm run hub:ci` | Exit 0 — about-page generation + **`npm run verify`** (**prebuild** + Astro **`build`**) |
| D | `npm run security:check` | Exit 0 — SCA + worker inventory + PQC gate (Phase B+C+E; see **`andromeda/04_SOFTWARE/p31ca/docs/SECURITY-RUNBOOK.md`**) |

**Full public gate (home root):** `npm run release:public` — root **`verify`**, strict mesh, **`hub:ci`**, then **`security:check`** (optional **`--no-security`** only for narrow debugging; see **`scripts/p31-release-public.mjs`**).

---

## 3. Deploy after green

| Step | Command | Notes |
|------|---------|--------|
| E | `npm run deploy:p31ca` | Home root: runs p31ca **`npm run deploy`** (Wrangler Pages — needs **`CLOUDFLARE_API_TOKEN`**; see **`p31ca/DEPLOY.md`**) |

**CI path:** Andromeda **`p31ca-hub.yml`** — merge to **`main`** with **`04_SOFTWARE/p31ca/**`** changes triggers **`hub:ci`** and Pages deploy per [deploy canon](../P31-DEPLOY-CANON.md).

---

## 4. Live checks

| Step | Location | Pass |
|------|----------|------|
| F | Browser: **`https://p31ca.org/`** | Hub HTML loads |
| G | Browser: **`https://p31ca.org/ops/`** | Operator / glass-oriented UI per p31ca routing |

Glass probe **`p31ca-hub-root`** in **`p31-ecosystem.json`** tracks the same origin.
