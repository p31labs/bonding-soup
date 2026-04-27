# CWP-05 — Geodesic campaign + room Worker

**Id:** `P31-CONVERGE-05-GEODESIC`  
**Status:** OPEN (incremental)

## Objective

**Single contract** across `geodesic-campaign.json`, `public/geodesic.html` inline campaign, `packages/shared` types, and **geodesic-room** Worker wire (`p31.geodesicRoomWire`); static + DO story stays aligned with `docs/GEODESIC-*.md`.

## In scope

- `npm run verify:geodesic-campaign` (p31ca prebuild) always green.
- GeodesicRoom DO: health URL in glass; WS URL in constants / mesh JSON if surfaced to hub.
- No duplicate Larmor/trim numbers: `verify:quantum-clock` path respected.

## Out of scope

- Full game engine in hub; that’s a separate doc (`GEODESIC-GAME-ENGINE-INTEGRATION.md`).

## Production convergence

- [ ] `verify:geodesic-campaign` + `verify:synergetic` + dist checks on ship.
- [ ] `geodesic-room` glass probe (or `p31-ecosystem` row) **UP** for prod URL.
- [ ] `npm run deploy` p31ca when static campaign HTML changes.
- [ ] Worker deploy for geodesic-room per monorepo deploy order.

**Dependencies:** 03 (mesh/glass), 08 (Worker allowlist).  
**Parallel:** 01, 03.
