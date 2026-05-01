# PERSONAL — TRIPER Pre-flight Checklist

**Operator-sensitive: Ca limits, medication, spoon budget, HMAC integrity.**

## Structural (automated — `npm run test:triper:personal`)
- [ ] All 20 SIMPLEX-v7 test files present
- [ ] Cognitive Passport schema is p31.cognitivePassport/1.0.0
- [ ] Passport generator → hub mirror parity
- [ ] phos-safety.test.ts covers Ca limits
- [ ] medication-rules.test.ts covers scheduling
- [ ] biometric-spoons.test.ts covers spoon metrics
- [ ] operator-auth.test.ts covers auth gates
- [ ] hmac-worker.test.ts covers HMAC SHA256
- [ ] No hardcoded HMAC secrets in index.ts
- [ ] k4-personal URL is HTTPS

## Execution (automated — `npm run triper:exec personal`)
- [ ] verify:passport passes
- [ ] verify:cognitive-passport-schema passes
- [ ] verify:cognitive-passport-profiles passes (when andromeda present)
- [ ] verify:k4-personal wrangler dry-run passes (when k4-personal present)

## Safety Invariants (CRITICAL — operator review required)
- [ ] Ca range 8.0–9.0 mg/dL is the operative window in phos-safety tests
- [ ] Medication rules: no conflicting schedules exist
- [ ] Spoon budget baseline is calibrated to current operator state
- [ ] AuDHD accommodation table is current (accommodation-sync.test.ts)
- [ ] FERS countdown date is accurate
- [ ] Bereavement KV key is configured (`mesh_bereavement_until`)

## Privacy Guards
- [ ] No full child names in any personal scope output
- [ ] Operator email not in any public-facing surface
- [ ] HMAC keys come from CF environment bindings only
- [ ] No `.env` files committed in simplex-v7/ or simplex-email/

## Manual (operator sign-off)
- [ ] Cognitive Passport generator opens at `/cognitive-passport/index.html`
- [ ] Passport JSON export is valid against the 1.0.0 schema
- [ ] Hub mirror at `/passport` reflects latest personal scope

## Regression Guards
- [ ] q-factor.test.ts not deleted (biocomputation baseline)
- [ ] voltage.test.ts not deleted (cognitive voltage assessment)
- [ ] fers-countdown.test.ts not deleted (retirement tracking)
- [ ] mesh-remembrance.test.ts not deleted (bereavement state)

## Sign-off
```
Operator: W.JOHNSON-001
Date: ___________
Ca level at cert time: _____ mg/dL (must be 8.0–9.0)
Spoon level: ___ / 10
TRIPER cert: PASS / FAIL
Notes: ___________
```
