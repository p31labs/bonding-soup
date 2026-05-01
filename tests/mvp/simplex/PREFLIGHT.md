# SIMPLEX-v7 — TRIPER Pre-flight Checklist

**Operator intelligence layer. HMAC gates and auth are non-negotiable.**

## Structural (automated — `npm run test:triper:simplex`)
- [ ] src/index.ts, agents/types.ts, lib/skill-runner.ts, skills/router.ts all exist
- [ ] wrangler.toml exists with name + compatibility_date
- [ ] All 20+ test files present
- [ ] hmac-worker.test.ts covers HMAC SHA256
- [ ] operator-auth.test.ts covers auth gates
- [ ] phos-safety.test.ts covers safety rules
- [ ] No hardcoded HMAC secrets in source
- [ ] No raw secrets in wrangler.toml

## Execution (automated — `npm run triper:exec simplex`)
- [ ] simplex-v7 typecheck (tsc) passes
- [ ] All 20+ vitest tests pass:
  - [ ] hostile.test.ts
  - [ ] voltage.test.ts
  - [ ] hmac-worker.test.ts
  - [ ] medication-rules.test.ts
  - [ ] q-factor.test.ts
  - [ ] registry.test.ts
  - [ ] fers-countdown.test.ts
  - [ ] biometric-spoons.test.ts
  - [ ] context-fallback.test.ts
  - [ ] accommodation-sync.test.ts
  - [ ] schema-sql.test.ts
  - [ ] json-extract.test.ts
  - [ ] operator-auth.test.ts
  - [ ] phos-safety.test.ts
  - [ ] phos-config.test.ts
  - [ ] phos-hmac-parity.test.ts
  - [ ] mesh-remembrance.test.ts
  - [ ] breakers.test.ts
  - [ ] health-runtime.test.ts
  - [ ] email-ingest-logic.test.ts
- [ ] verify:simplex-bootstrap passes (CF dry-run)

## Manual (operator sign-off)
- [ ] HMAC keys are set in CF environment (not source)
- [ ] Operator auth gate rejects unauthenticated requests
- [ ] Skill router handles all documented routes
- [ ] Circuit breakers trip correctly under load
- [ ] Memory safe: no KV key leakage between operator sessions

## Regression Guards
- [ ] Total test count still ≥20 (no silent deletions)
- [ ] accommodation-sync.test.ts not deleted (AuDHD coverage)
- [ ] mesh-remembrance.test.ts not deleted (bereavement state)
- [ ] fers-countdown.test.ts not deleted (retirement tracking)

## Sign-off
```
Operator: W.JOHNSON-001
Date: ___________
All 20+ tests: PASS / FAIL
HMAC rotation: current / overdue
TRIPER cert: PASS / FAIL
Notes: ___________
```
