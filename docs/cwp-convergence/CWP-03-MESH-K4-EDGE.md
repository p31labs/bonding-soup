# CWP-03 — Mesh / K₄ edge alignment

**Id:** `P31-CONVERGE-03-MESH-K4`  
**Status:** CLOSED (2026-04-28)

## Objective

**Live mesh URLs in `p31-constants.json` ↔ Workers**; glass probes **UP**; `verify:mesh` / `verify:ecosystem` pass; no drift between registry marketing copy and health endpoints.

## In scope

- k4-personal, k4-cage, k4-hubs: health + mesh payloads per constants.
- `p31-ecosystem.json` glassProbes: fix or **document** intentional DOWN (e.g. orchestrator 401).
- `apply:constants` + mirror to p31ca `p31-mesh-constants.json` when mesh URLs change.
- k4-hubs `PERSONAL_MESH_URL` and cage alignment per `P31-ALIGNMENT-SYSTEM` Workers section.

## Out of scope

- Rewriting mesh algorithms; changing legal case state.

## Phases

| Phase | Action |
|-------|--------|
| A | `npm run verify:constants` + `verify:ecosystem` (root) clean |
| B | `MESH_LIVE_STRICT=1` path documented for CI parity |
| C | `ecosystem:glass` all green or exception list in `ECOSYSTEM-PRODUCTION-11` |

## Dependencies

- Mesh Workers deployed; secrets in wrangler, not git.

## Production convergence

- [x] Root `npm run verify:ecosystem` OK (`MESH_LIVE_STRICT=1` for strict parity).
- [x] `npm run verify:mesh` (k4-personal wrangler dry-run + live `/api/health` + `/api/mesh` where applicable) OK.
- [x] `ecosystem:glass` 23 up / 0 down; optional HA-LAN skip documented in `docs/ECOSYSTEM-PRODUCTION-11.md` section 5.
- [x] `p31-live-fleet.json` and constants in sync (polish or `apply:constants` when URL changes).

**Parallel:** 04, 05, 08.

---

*Closed: 2026-04-28 — `verify:ecosystem`, `MESH_LIVE_STRICT=1` `verify:mesh`, full glass green; one `skipIfEmpty` probe (Home Assistant LAN) documented in `ECOSYSTEM-PRODUCTION-11`.*
