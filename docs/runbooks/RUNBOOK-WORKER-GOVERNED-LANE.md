# Worker governed lane — operations index

**SKU set:** All `kind: worker` rows in `p31-production-readiness.json` plus governed `pages` ids listed in `launchGovernance.governedPagesIds` (currently `p31ca`).

**Gate:** `npm run verify:production-readiness` enforces:

- every governed row totals **≥ `minGovernedScore`** (default **85**);
- every PRS dimension **≥ `minGovernedFloorPerDimension`** (default **6**).

**Machine index:** `npm run generate:launch-lane` → root `p31-launch-lane.json` (`p31.launchLane/0.1.0`) merges PRS scores + `p31-live-fleet.json` deploy hints.

**Smoke (static hub):** `npm run test:launch-lane:smoke` — Playwright loads six market-adjacent Pages from `andromeda/04_SOFTWARE/p31ca/public/`. Skip in sandboxes: `P31_SKIP_LAUNCH_LANE_SMOKE=1`.

**Manifest drift:** `npm run verify:launch-lane-sync` (also runs inside root `npm run verify`) — fails if `p31-launch-lane.json` is stale vs PRS+fleet; heal with `npm run generate:launch-lane`.

**Per-Worker deep dives:** Start from [WORKER-SKELETON.md](./WORKER-SKELETON.md). Class-specific reds stay in [RUNBOOK-MESH-RED.md](./RUNBOOK-MESH-RED.md), [RUNBOOK-PAYMENTS-RED.md](./RUNBOOK-PAYMENTS-RED.md), [RUNBOOK-PASSKEYS-RED.md](./RUNBOOK-PASSKEYS-RED.md), [RUNBOOK-HUB-RED.md](./RUNBOOK-HUB-RED.md).

**PRS normalization utility:** `node scripts/apply-prs-launch-governance.mjs` — reapplies score floor after manual edits (re-runnable).

**Spine:** [P31 deploy canon](../P31-DEPLOY-CANON.md) · `npm run connection`
