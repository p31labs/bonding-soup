# P31 deploy spine (canonical)

**Purpose:** One place for **who deploys what**, **which workflow fires**, and **which secrets** touch production—so overlapping paths (local Wrangler, bonding-soup Actions, Andromeda Actions) do not drift into conflicting lore.

**Related:** **`docs/P31-ENGINEERING-STANDARD.md`** (gates and secrets overview). **`docs/P31-RELEASE-LADDER-CI.md`** (PR/main/nightly/proof tiers + branch protection names + deploy-day order). **`npm run connection`** (CONNECTION spine — ties this doc to ecosystem, env catalog, and hub URLs via **`scripts/p31-connection.mjs`**). **`P31_*` environment catalog:** root **`p31-env-manifest.json`**, **`npm run list:p31-env`**, **`npm run verify:p31-env`**. **Incident runbooks (mesh / hub / payments / passkeys / glass strict):** **`docs/runbooks/README.md`**.

---

## Production URL

**Hub:** `https://p31ca.org` (Cloudflare Pages project **`p31ca`**, branch **`main`**).

---

## Flow (repos and triggers)

```mermaid
flowchart TB
  subgraph andromeda["Repository: andromeda"]
    PR[pull_request or push main\npaths: 04_SOFTWARE/p31ca/**]
    PR --> HUB[p31ca-hub.yml job verify]
    HUB --> HC[hub:ci → dist/]
    PUSH{{push to main}} --> DEP_A[Deploy Pages\nwrangler pages deploy dist]
    HC --> DEP_A
  end
  subgraph bonding["Repository: bonding-soup home"]
    WD[workflow_dispatch only\np31-pages-deploy.yml]
    WD --> CI[node scripts/p31-ci.mjs]
    CI --> DEP_H[wrangler pages deploy\n--commit-dirty=true]
  end
  subgraph local["Developer workstation"]
    DP[npm run deploy:p31ca]
    DP --> DP2[npm run deploy\nin andromeda/04_SOFTWARE/p31ca]
  end
  DEP_A --> ORIGIN[(p31ca.org)]
  DEP_H --> ORIGIN
  DP2 --> ORIGIN
```

---

## Matrix (operator view)

| Path | Repository | Trigger | Build | Deploy command | Typical use |
|------|------------|---------|-------|----------------|-------------|
| **Andromeda CI** | `p31labs/andromeda` | PR + push `main` when `04_SOFTWARE/p31ca/**` changes | `hub:ci` in workflow | `pages deploy dist --project-name=p31ca --branch=main` (no dirty flag; clean CI tree) | Default production cadence when merging hub work in Andromeda |
| **Manual Pages + smoke** | `p31labs/bonding-soup` (home) | `workflow_dispatch` only | Full repo **`p31-ci.mjs`** then deploy from nested `p31ca` | Same project/branch; **`--commit-dirty=true`** because checkout may carry local soup changes | Operator backup: redeploy after verifying full home stack; optional Playwright prod smoke |
| **Local CLI** | Home checkout with Andromeda present | Manual | Whatever **`p31ca` package `deploy`** runs after your local verify | Same Pages project | Fast path when token is local; must match **`p31ca/DEPLOY.md`** |

**Secrets (GitHub Actions):** **`CLOUDFLARE_API_TOKEN`** (Pages deploy). **`CLOUDFLARE_ACCOUNT_ID`** where Wrangler needs it. Same names in both repos’ workflows; configure per repository in GitHub **Settings → Secrets**.

**Not a third production path:** **`npm run ecosystem:deploy`** (ordered **`deployables[].steps`** argv arrays from **`p31-ecosystem.json`** — no shell; executed sequentially per deployable) is for multi-service rollout with an explicit guard—see **`scripts/ecosystem-deploy.mjs`** and **`P31_ECOSYSTEM_DEPLOY`** in **`p31-env-manifest.json`**.

---

## Social automation

Scheduled GitHub “social dispatch” workflows are **not** authoritative for production posting. Prefer **`social.p31ca.org`** (Worker) per existing deprecation notes in Andromeda **`social-dispatch.yml`** (manual **`workflow_dispatch`** only; no cron).
