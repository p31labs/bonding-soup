# Plan 11/10 — execution log

**Updated:** 2026-04-26 (automation pass). **Normative plan:** `PLAN-11-10-FULL-ECOSYSTEM.md`. **Glass report:** `/tmp/p31_glass_report.json` after `npm run ecosystem:glass`.

## Phase 0 — Baseline

| Check | Status |
|--------|--------|
| `npm run apply:constants` | Green |
| `npm run verify:constants` | Green |
| `npm run release:check` | Green |
| `MESH_LIVE_STRICT=1` p31-ci | Green |
| Baseline glass snapshot | Written to `/tmp/p31_glass_report.json` |

## Phase 1 — Hub on the internet

| Check | Status |
|--------|--------|
| `npm run deploy:p31ca` (Pages) | **Run** — `wrangler pages deploy dist` |
| Short URLs + trust bundle live | **Green** after deploy + redirect fix |
| **Redirect loop fix** | Removed `_redirects` rules that fought CF Pages **308** `*.html` → clean path (`/privacy`, `/terms`, `/contact`, `/accessibility`, `/auth`, `/delta`). See `p31ca/public/_redirects` comments. |

## Phase 2 — Identity (passkey)

| Check | Status |
|--------|--------|
| Zone route `p31ca.org/api/passkey/*` | Glass: **UP** (register-begin returns `challenge`) |
| D1/KV | Operator: confirm `workers/passkey` README applied in prod |
| Manual onboard + `/auth` | **Operator** — two-device smoke |

## Phase 3 — K₄ edge

| Check | Status |
|--------|--------|
| Glass mesh probes | **UP** (personal, cage, hubs, passkey, geodesic, agent-hub) |
| `k4-hubs` `PERSONAL_MESH_URL` | Enforced by `verify-constants` vs `p31-constants.json` |

## Phase 4 — Geodesic

| Check | Status |
|--------|--------|
| Geodesic room Worker | Glass **UP** |
| `verify:geodesic-campaign` | Green in prebuild |

## Phase 5 — Operator

| Check | Status |
|--------|--------|
| command-center health + shift | Glass **UP** |
| `/ops/` glass ingest | Prebuild runs `ops:ingest` when home `p31-ecosystem.json` present |

## Phase 6 — Orchestrator source of truth

| Check | Status |
|--------|--------|
| Git → deploy → URL | **`andromeda/04_SOFTWARE/workers/wrangler-orchestrator.toml`** → Worker name **`p31-orchestrator`**. Deploy: `npx wrangler deploy --config wrangler-orchestrator.toml`. Listed in **`p31-ecosystem.json`** `deployables`. |

## Phase 7 — Monetary

| Check | Status |
|--------|--------|
| donate-api health | Glass **UP** |
| **stripe-api-health** | **Removed** from glass: no separate `api.phosphorus31.org` Worker. **`payment.stripeApiHealthUrl`** = **`donate-api.phosphorus31.org/health`** (same Worker as donate-api). |

## Phase 8 — Satellites

| Check | Status |
|--------|--------|
| BONDING probe | Glass **UP** |
| Google bridge / archive | Documented in plan; deployables in `p31-ecosystem.json` |

## Phase 9 — Product truth (ECO)

| Check | Status |
|--------|--------|
| mvpData vs COCKPIT | **Waived** pending ECO CWP — see **`docs/ADR-0001-ECO-MVP-DUAL-TRACK.md`** |

## Phase 10 — Security

| Check | Status |
|--------|--------|
| `p31ca` `npm run security:check` | **PASSED** (skip-A; P1 CORS warnings documented) |

## Strict glass

- **`P31_GLASS_STRICT=1`**: monetary tier uses **donate-api** probes only (custom domain + workers.dev).
