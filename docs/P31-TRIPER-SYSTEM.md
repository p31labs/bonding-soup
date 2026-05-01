# P31 TRIPER — Technical Readiness Inspection Program for Equipment Readiness

**Established:** 2026-04-30  
**Status:** Active  
**Maintainer:** W.JOHNSON-001

---

## Why TRIPER

The US Navy runs SSGNs and SSBNs through exhaustive **TRIPER** cycles before any patrol: specialized inspectors examine each system independently before the boat integrates into the fleet. No system is assumed good because the last patrol was fine. No stone unturned. Every detail tested. The downtime is built in — the inspection itself is the mission.

P31 adopts the same philosophy. Each MVP is a **system**. Before it merges into the family K₄ mesh, it runs through its own specialized TRIPER suite. The combined suite only runs after every individual TRIPER is green.

**Not a QA layer. A certification program.**

---

## TRIPER Acronym

Each suite is organized into six sections:

| Phase | Letter | Focus |
|-------|--------|-------|
| Task | **T** | Core unit functionality — does the thing do the thing |
| Resilience | **R** | Fallback paths, chaos, offline modes, circuit breakers |
| Interface | **I** | Wire contracts, API surface, schema compliance |
| Purity | **P** | Safety invariants, privacy guards, no-leaked-secrets, Ca limits |
| End-to-End | **E** | Full workflow from source to output |
| Regression | **R** | Guard rails on known failure points, baseline locks |

---

## MVP Suites

| Suite | File | MVP |
|-------|------|-----|
| `test:triper:bonding` | `tests/mvp/bonding/bonding.triper.test.mjs` | BONDING molecular builder |
| `test:triper:cars` | `tests/mvp/cars/cars.triper.test.mjs` | Root C.A.R.S. engine |
| `test:triper:personal` | `tests/mvp/personal/personal.triper.test.mjs` | Personal scope (SIMPLEX + Passport + K₄) |
| `test:triper:hub` | `tests/mvp/hub/hub.triper.test.mjs` | p31ca technical hub |
| `test:triper:mesh` | `tests/mvp/mesh/mesh.triper.test.mjs` | K₄ mesh (cage + hubs + personal) |
| `test:triper:simplex` | `tests/mvp/simplex/simplex.triper.test.mjs` | SIMPLEX-v7 + SENTINEL agent |
| `test:triper:email` | `tests/mvp/email/email.triper.test.mjs` | simplex-email Worker |
| `test:triper:epcp` | `tests/mvp/epcp/epcp.triper.test.mjs` | EPCP command center |
| `test:triper:geodesic` | `tests/mvp/geodesic/geodesic.triper.test.mjs` | GeodesicRoom WS |

---

## Run Commands

```bash
# Run a single MVP TRIPER
npm run test:triper:bonding
npm run test:triper:cars
npm run test:triper:personal
npm run test:triper:hub
npm run test:triper:mesh
npm run test:triper:simplex
npm run test:triper:email
npm run test:triper:epcp
npm run test:triper:geodesic

# Run all TRIPERs sequentially (gate: all must pass before combined)
npm run test:triper

# Combined suite (family mesh integration tests — runs after all TRIPERs green)
npm run test:triper:combined

# Mutation sentinels (70 negative assertions — proves invariants have teeth)
npm run test:triper:sentinels

# Full certification run (TRIPER + combined + sentinels + cert log)
npm run test:triper:cert
```

---

## Gate System

```
TRIPER:BONDING  ─┐
TRIPER:CARS     ─┤
TRIPER:PERSONAL ─┤
TRIPER:HUB      ─┼──► GATE ──► COMBINED SUITE ──► MESH INTEGRATION
TRIPER:MESH     ─┤
TRIPER:SIMPLEX  ─┤
TRIPER:EMAIL    ─┤
TRIPER:EPCP     ─┤
TRIPER:GEODESIC ─┘
```

If any TRIPER fails, the gate blocks the combined suite.  
TRIPER failures are per-MVP — a MESH failure doesn't block BONDING certification.

---

## Graduation Criteria

A system achieves **TRIPER Certified** when:

1. All T-R-I-P-E-R sections are green
2. No skipped tests (`.skip`, `.todo` are logged as warnings)
3. Test count meets or exceeds the documented baseline
4. No secrets, credentials, or full child names in any test output
5. The certification is logged to `tests/triper/logs/` with timestamp

**Certification is not permanent.** Any change to the system's source files triggers re-certification before that system can be merged into the mesh.

### `release:public` cert gate

`npm run release:public` is the highest-stakes command (pre-deploy checklist). It reads the latest cert from `tests/triper/logs/` and **blocks if**:

- No cert log exists → `npm run test:triper:cert`
- Cert `gateStatus` is not `AUTHORIZED` → fix failing suites, re-cert
- Cert age > 24 hours → re-run `npm run test:triper:cert`

Skip: `--skip-triper` flag or `P31_SKIP_TRIPER=1` env (CI only — never skip locally before a real deploy).

---

## Updating TRIPERs

TRIPERs are living documents. After every incident:
1. Root cause → add a Regression test
2. New invariant discovered → add to Purity section
3. Wire contract change → update Interface section
4. Baseline count changes → update the lock in constants
5. New invariant added to TRIPER → add a corresponding sentinel in `mutation-sentinels.test.mjs`

**The TRIPER evolves with the system it inspects. The sentinels prove the TRIPER is still sharp.**

---

## File Locations

```
tests/
  mvp/
    bonding/         bonding.triper.test.mjs
    cars/            cars.triper.test.mjs
    personal/        personal.triper.test.mjs
    hub/             hub.triper.test.mjs
    mesh/            mesh.triper.test.mjs
    simplex/         simplex.triper.test.mjs
    email/           email.triper.test.mjs
    epcp/            epcp.triper.test.mjs
    geodesic/        geodesic.triper.test.mjs
  triper/
    triper-runner.mjs          master runner with gate check
    mutation-sentinels.test.mjs  70 negative assertions — red-green proof each invariant has teeth
    logs/                      certification logs (gitignored)
  combined/
    combined.suite.test.mjs    cross-MVP integration (family mesh gate)
vitest.triper.config.mjs  vitest config for all TRIPER suites + sentinels
```
