# HUB — TRIPER Pre-flight Checklist

**Creator covenant: 0% platform fee. Public forever. No backsliding.**

## Structural (automated — `npm run test:triper:hub`)
- [ ] p31ca directory structure intact
- [ ] ground-truth.json exists and is parseable
- [ ] creator-economy.json: platformFee.rate === 0
- [ ] creator-economy.json: revenueShare.creator === 1.0
- [ ] creator-economy.json: geodesicRoom.accessFee === 0.0
- [ ] creator-economy.json: schema === "p31.creatorEconomy/1.0.0"
- [ ] creator-economy.json: transparency.ciVerified === true
- [ ] Ground truth and public/ copies have same fee values
- [ ] No credentials in public/ directory
- [ ] Worker allowlist current

## Execution (automated — `npm run triper:exec hub`)
- [ ] verify:p1ca-contracts passes (when p31ca present)
- [ ] verify:p31-style passes (design tokens)
- [ ] verify:ground-truth passes (when p31ca present)

## Manual (operator sign-off)
- [ ] p31ca.org/passport loads
- [ ] p31ca.org/creator-economy.json served with CORS *
- [ ] p31ca.org/fleet-portal loads and shows live workers
- [ ] Hub search (doc-library) returns results
- [ ] No 404s on featured paths: /cars, /fleet, /agents, /contracts, /glass-box
- [ ] Visual: design tokens render correctly (Quantum Material U)
- [ ] Mobile: hub is usable at 320px

## Creator Covenant Guard (IMMUTABLE)
- [ ] Platform fee is 0% and has NOT changed since v1.0.0
- [ ] Creator share is 100% and has NOT changed
- [ ] Room access is free
- [ ] 30-day notice policy is documented in the JSON

## Regression Guards
- [ ] verify:monetary not removed from package.json
- [ ] verify:p31ca-contracts not removed
- [ ] Creator economy version still 1.0.0

## Sign-off
```
Operator: W.JOHNSON-001
Date: ___________
Creator covenant confirmed: YES / NO
TRIPER cert: PASS / FAIL
Notes: ___________
```
