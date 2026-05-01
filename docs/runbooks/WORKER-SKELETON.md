# Worker runbook skeleton (P31)

Copy this outline per Worker when elevating a SKU into the **launch-governed lane** (see `p31-production-readiness.json` → `launchGovernance` and `RUNBOOK-WORKER-GOVERNED-LANE.md`).

## Identity

| Field | Value |
|-------|--------|
| Worker name | e.g. `k4-personal` |
| Repo path | e.g. `andromeda/04_SOFTWARE/k4-personal` |
| Prod URL | mirror `p31-constants.json` + `p31-live-fleet.json` |

## Health & contracts

- **GET** health path(s): list exact routes and expected status + JSON shape summary.
- **Schema / version**: link to any `p31.*` JSON contract or prose spec.

## Secrets & config

- Enumerate `wrangler secret` names (not values). Link to `p31-env-manifest.json` or private vault index.

## Deploy

- Command: `pnpm` / `npm` / `wrangler deploy …` (canonical one-liner).
- **Preview** vs **production** account/zone notes.

## Rollback

- Prior version tag or `wrangler rollback` steps; data migration reversibility (KV/D1/Durable Object).

## Observability

- **`wrangler tail`** filters; log field names; dashboards (if any).
- **Synthetic probe**: path + expected (used by `npm run ecosystem:glass` when configured).

## Incident

- Classify: 5xx spike, auth failure, quota, bad deploy. First 3 actions.
- Escalation: single owner + backup.

## Verify hooks (repo)

- Replace with real commands for this Worker, e.g. `npm run verify:mesh`, `npm run verify:edge-lab`, `npm run verify:production-readiness` (fleet-wide guard).
