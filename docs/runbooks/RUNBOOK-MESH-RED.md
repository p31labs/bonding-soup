# Runbook: Mesh red (k4-personal + related Workers)

**When to use:** `npm run verify:mesh` fails in CI, **`k4-personal-*`** glass rows are down, or live `/api/health` / `/api/mesh` do not match **`p31-constants.json`**.

**Canonical context:** Personal mesh worker lives under **`andromeda/04_SOFTWARE/k4-personal`** (see [AGENTS.md](../../AGENTS.md) §k4-personal). URL truth: **`p31-constants.json`** → **`mesh.k4PersonalWorkerUrl`** (apply with **`npm run apply:constants`** after edits).

---

## 1. Reproduce with ship-bar commands (home repo root)

| Step | Command | Pass |
|------|---------|------|
| A | `npm run verify:mesh` | Exit 0 (default **`MESH_LIVE_STRICT=1`** inside the script unless you override env) |
| B | `MESH_LIVE_STRICT=0 npm run verify:mesh` | Exit 0 — confirms dry-run + bundle OK while isolating **live** drift vs offline |
| C | `npm run verify:constants` | Exit 0 — templates and payment/mesh fields aligned |
| D | `npm run verify:k4-personal` | Exit 0 — **`wrangler deploy --dry-run`** for k4-personal (skips if tree missing) |

**Live-only detail:** `verify:mesh` runs **`verify-mesh-live.mjs`**, which probes **`GET /api/health`** and **`GET /api/mesh`** against the resolved base URL (see **`packages/p31-mesh`** probe). **`MESH_BUDGET_STRICT=1`** fails the step if latency exceeds the configured budget.

---

## 2. Glass box (same URLs as CI operators care about)

| Step | Command | Pass |
|------|---------|------|
| E | `npm run ecosystem:glass` | Table shows **`k4-personal-api-health`** and **`k4-personal-api-mesh`** (and other mesh group rows) as up |
| F | `P31_GLASS_STRICT=1 npm run ecosystem:glass` | Exit 0 — fails if any non-auth probe is down |

Probe definitions: **`p31-ecosystem.json`** → **`glassProbes`** (after edits run **`npm run verify:ecosystem`**).

---

## 3. If the Worker bundle is suspect (monorepo present)

| Step | Command | Pass |
|------|---------|------|
| G | `pnpm install` then `pnpm --filter k4-personal verify` from **`andromeda/04_SOFTWARE`** | Exit 0 per [k4-personal README](../../andromeda/04_SOFTWARE/k4-personal/README.md) |

Home root **`npm run verify:k4-personal`** delegates to k4-personal’s **`npm run verify`** when local Wrangler is installed there.

---

## 4. Deploy / rollback (not automatic)

Ordered deploy list: **`npm run ecosystem:plan`** (inspect **`p31-ecosystem.json`** **`deployables`**). Execute production steps only with the guard documented in **`p31-env-manifest.json`** (**`P31_ECOSYSTEM_DEPLOY`**) and [P31 deploy canon](../P31-DEPLOY-CANON.md).

**Dashboard:** Cloudflare Workers → **k4-personal** (worker name from **`k4-personal/wrangler.toml`**) → Logs / Deployments.
