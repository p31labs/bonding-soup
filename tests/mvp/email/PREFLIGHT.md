# simplex-email — TRIPER Pre-flight Checklist

## Structural (automated — `npm run test:triper:email`)
- [ ] src/index.ts exists and is non-trivial
- [ ] wrangler.toml has name + compatibility_date
- [ ] No SMTP credentials in source or config
- [ ] No .env files committed
- [ ] No full child names in source

## Execution (automated — `npm run triper:exec email`)
- [ ] simplex-email typecheck (tsc) passes

## Manual (operator sign-off)
- [ ] Email routing config is correct for p31 domain
- [ ] simplex-email wrangler worker name matches deploy target
- [ ] Secrets (HMAC key, etc.) are set in CF dashboard, not source
- [ ] Email Worker is deployed and reachable

## Sign-off
```
Operator: W.JOHNSON-001
Date: ___________
TRIPER cert: PASS / FAIL
Notes: ___________
```
