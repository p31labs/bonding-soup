# C.A.R.S. — TRIPER Pre-flight Checklist

Run before certifying C.A.R.S. engine for mesh integration.

## Structural (automated — `npm run test:triper:cars`)
- [ ] soup.ts, soupPhysics.ts, reactions.ts all exist
- [ ] Wire contract references correct file paths
- [ ] No blocking fs calls in soup.ts (10ms CPU constraint)
- [ ] World bounds locked in contract (1600×800)
- [ ] heartbeatIntervalMs locked (5000)

## Execution (automated — `npm run triper:exec cars`)
- [ ] `npm run build` (tsc → dist/) passes
- [ ] `npm run soup:prep:check` passes
- [ ] verify:cars-wire passes

## Manual (operator sign-off)
- [ ] `soup.html` loads at `/` in browser
- [ ] Molecules animate on canvas
- [ ] Physics: molecules bounce off walls correctly
- [ ] No NaN/Infinity in molecule positions after 60s
- [ ] Memory stable over 5 minutes (no visible leak)
- [ ] Lab telemetry stream (Sovereign Lab) does not break SoupEngine
- [ ] `dist/soup.js` is importable as an ES module

## Regression Guards
- [ ] Package description still references C.A.R.S.
- [ ] Package name still `bonding-soup` (npm identity)
- [ ] Wire contract schema version still `p31.carsWire/0.1.0`
- [ ] Mock server still referenced at `spikes/mock-ws-server/server.js`

## Sign-off
```
Operator: W.JOHNSON-001
Date: ___________
TRIPER cert: PASS / FAIL
Notes: ___________
```
