# Runbook: Payments red (donate-api / monetary pipeline)

**When to use:** **`npm run verify:monetary`** fails, **`donate-api-*`** glass probes are down, donors report checkout errors, or Stripe webhook deliveries fail.

**Canonical deep dive:** **`andromeda/04_SOFTWARE/donate-api/RUNBOOK-PAYMENTS-DOWN.md`** (curl targets, webhook signature triage, rollback). Deploy secrets: **`andromeda/04_SOFTWARE/donate-api/DEPLOY.md`**.

---

## 1. Home repo — monetary gate

| Step | Command | Pass |
|------|---------|------|
| A | `npm run verify:monetary` | Exit 0 — runs **`verify:ecosystem`**, **`verify:constants`**, **`verify-map-pipeline`** (MAP surface), and **`verify:economy`** in p31ca when present |
| B | `npm run verify:constants` | Exit 0 — **`payment.*`** URLs in **`p31-constants.json`** match templates used by glass |
| C | `npm run verify:ecosystem` | Exit 0 — **`p31-ecosystem.json`** glass URLs expand correctly |

---

## 2. Glass box — donate-api

Probes **`donate-api-health`** and **`donate-api-health-workers-dev`** in **`p31-ecosystem.json`** use **`{{payment.*}}`** from constants.

| Step | Command | Pass |
|------|---------|------|
| D | `P31_GLASS_STRICT=1 npm run ecosystem:glass` | Exit 0 — both donate probes **UP** |

---

## 3. Worker + Stripe (manual, per existing RUNBOOK)

Follow **`andromeda/04_SOFTWARE/donate-api/RUNBOOK-PAYMENTS-DOWN.md`** §2–§4 for:

- **`curl`** health checks to **`https://donate-api.phosphorus31.org/health`** and **`https://donate-api.trimtab-signal.workers.dev/health`**
- Cloudflare **donate-api** logs
- Stripe Dashboard webhook deliveries and **`STRIPE_WEBHOOK_SECRET`** rotation (**`wrangler secret put`** per **`DEPLOY.md`**)

---

## 4. Deploy ordering

Inspect **`npm run ecosystem:plan`** for the **`donate-api`** deployable entry in **`p31-ecosystem.json`**. Do not run **`npm run ecosystem:deploy`** without the **`P31_ECOSYSTEM_DEPLOY`** guard documented in **`p31-env-manifest.json`** and [P31 deploy canon](../P31-DEPLOY-CANON.md).
