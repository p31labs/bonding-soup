# CWP-05 — Geodesic campaign + room Worker

**Id:** `P31-CONVERGE-05-GEODESIC`  
**Status:** CLOSED (2026-04-28)

## Objective

**Single contract** across `geodesic-campaign.json`, `public/geodesic.html` inline campaign, `packages/shared` types, and **geodesic-room** Worker wire (`p31.geodesicRoomWire/0.2.1` incl. shape `rotY`); static + DO story stays aligned with `docs/GEODESIC-*.md`.

## In scope

- `npm run verify:geodesic-campaign` (p31ca prebuild) always green.
- GeodesicRoom DO: health URL in glass; WS URL in constants / mesh JSON if surfaced to hub.
- No duplicate Larmor/trim numbers: `verify:quantum-clock` path respected.

## Out of scope

- Full game engine in hub; that’s a separate doc (`GEODESIC-GAME-ENGINE-INTEGRATION.md`).

## Production convergence

- [x] `verify:geodesic-campaign` + `verify:synergetic` (p31ca prebuild) on ship; dist checks via `npm run verify` in p31ca.
- [x] `geodesic-room-worker` in `p31-ecosystem.json` / glass — **UP** 200 (prod: `geodesic-room.trimtab-signal.workers.dev/`).
- [x] `npm run deploy` p31ca when static campaign HTML changes (standard hub pipeline).
- [x] Worker: `andromeda/04_SOFTWARE/geodesic-room` per **ECOSYSTEM-PRODUCTION-11** deploy order; allowlist in `security:workers` as part of release hygiene (**CWP-08**).

**Dependencies:** 03 (mesh/glass), 08 (Worker allowlist).  
**Parallel:** 01, 03.

---

*Closed: 2026-04-28 — `verify:geodesic-campaign` OK; glass geodesic-room **UP**; static/wire/ground-truth alignment enforced in p31ca prebuild. Future static or Worker changes: same bar + 08 allowlist on new routes.*
