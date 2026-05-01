# BONDING — TRIPER Pre-flight Checklist

Run before certifying BONDING for mesh integration.

## Structural (automated — `npm run test:triper:bonding`)
- [ ] K₄ topology: 4 vertices, 6 edges
- [ ] Wire contract: all SoupEngine message types present
- [ ] Family vertex naming: initials only (S.J., W.J.)
- [ ] Bonding relay URL is HTTPS on trimtab-signal account
- [ ] 424-test baseline locked in constants

## Execution (automated — `npm run triper:exec bonding`)
- [ ] Mock WS probe passes (relay contract smoke)
- [ ] BONDING monorepo: 424+ tests pass (when andromeda present)
- [ ] verify:cars-wire passes

## Manual (operator sign-off)
- [ ] `soup.html` loads locally (`npm run demo`, port 8080)
- [ ] Room creation works (create room → share code)
- [ ] Bond visualization renders without console errors
- [ ] Session export produces valid JSON
- [ ] Offline mode: relay falls back to mock without crashing
- [ ] No child full names visible in any UI surface
- [ ] Remembrance warm white (#f5f0e8) renders correctly in bereavement mode
- [ ] Mobile view (320px) is usable

## Regression Guards
- [ ] Heartbeat interval has not changed (5000ms)
- [ ] World bounds locked (1600×800)
- [ ] moleculeStateUpdate still in SoupEngine incoming types
- [ ] playerState still in browser client outbound types

## Sign-off
```
Operator: W.JOHNSON-001
Date: ___________
TRIPER cert: PASS / FAIL
Notes: ___________
```
