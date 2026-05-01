# EPCP (Command Center) — TRIPER Pre-flight Checklist

## Structural (automated — `npm run test:triper:epcp`)
- [ ] scripts/command-center/ directory intact
- [ ] actions.registry.mjs exists and exports ACTIONS
- [ ] TRIPER actions present in CC registry
- [ ] fleet-portal.html exists
- [ ] Operator shift scripts (shift-in/shift-out) wired
- [ ] No raw API keys in actions.registry.mjs or fleet-portal.html

## Execution (automated — `npm run triper:exec epcp`)
- [ ] command-center server smoke passes
- [ ] integration-local passes
- [ ] verify:glass-box passes

## Manual (operator sign-off)
- [ ] Local CC starts at http://127.0.0.1:3131 (`npm run command-center`)
- [ ] TRIPER status button appears in CC
- [ ] verify button works (runs npm run verify)
- [ ] release:check button works
- [ ] Operator shift-in/shift-out updates audit log
- [ ] Glass box terminal shows synthetic CLI playbacks
- [ ] Fleet portal shows all 12 live workers
- [ ] Human-in-the-loop gate is active (automation gate locked by default)
- [ ] No plaintext secrets visible in CC output

## Regression Guards
- [ ] test:command-center:integration not removed
- [ ] verify:command-center chains test:unit + smoke + integration + verify:p31-mesh
- [ ] reports:morning wired (daily ops)
- [ ] reports:evening wired

## Sign-off
```
Operator: W.JOHNSON-001
Date: ___________
CC accessible at :3131: YES / NO
TRIPER cert: PASS / FAIL
Notes: ___________
```
