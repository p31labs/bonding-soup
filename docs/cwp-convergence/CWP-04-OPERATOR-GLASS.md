# CWP-04 — Operator + ops glass (command-center)

**Id:** `P31-CONVERGE-04-OP-GLASS`  
**Status:** CLOSED (2026-04-28)

## Objective

**Operator** plane: `command-center` health, public `GET /api/operator/shift`, `/ops/` glass ingest from `p31-ecosystem.json`, Access policy documented for gated POST. No secrets in static **ops** HTML.

## In scope

- Confirm probe IDs in `p31-ecosystem.json` match deployed Workers; update after route changes.
- `npm run ops:ingest` (p31ca prebuild) produces `ops-glass-probes.json` in sync.
- CWP-UI doc pointer: `docs/CWP-POINTER-INTERACTIVE-OPERATOR-UI.md` and Andromeda `CONTROLLED-WORK-PACKAGE-INTERACTIVE-OPERATOR-UI.md` kept consistent with live routes.
- **Access:** document which paths are public vs SSO; avoid scope creep on bypass rules.

## Out of scope

- Rebuilding the full EPCP orchestrator; third-party on-call systems.

## Production convergence

- [x] `command-center` + `operator-shift-public` glass rows **UP** (or documented).
- [x] p31ca `prebuild` ingest runs in CI; no empty probe file on main.
- [x] `GET /api/operator/shift` **200** JSON in prod (after Access rules as designed).

**Dependencies:** 08 for CORS/allowlist if command-center or new routes change.  
**Parallel:** 03.

---

*Closed: all probes UP, Access bypass documented in `andromeda/04_SOFTWARE/p31ca/docs/EDGE-SECURITY.md` (Access bypass rules for GET vs POST and main Access app).*
