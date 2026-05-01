# RUNBOOK: Secrets Rotation

**Owner:** Operator (W.Johnson-001)  
**Cadence:** 90 days or immediately on suspected compromise  
**Status:** Active — satisfies `secrets-rotation-plan` launch gate

---

## Secrets inventory

| Secret | Location | Rotation method |
|--------|----------|-----------------|
| `CLOUDFLARE_API_TOKEN` | GitHub repo secret (`CF_API_TOKEN`) | Cloudflare Dashboard → My Profile → API Tokens → Edit → Roll |
| `CLOUDFLARE_ACCOUNT_ID` | GitHub repo secret | Non-rotating; confirm it matches dashboard Account ID |
| `CF_PAGES_PROJECT_NAME` | GitHub repo secret | Non-secret; update if project is renamed |
| `GH_PAT` (GitHub Personal Access Token) | GitHub repo secret (`GH_PAT`) | GitHub → Settings → Developer Settings → PAT → Regenerate |
| `STRIPE_SECRET_KEY` | donate-api CF Worker secret | `wrangler secret put STRIPE_SECRET_KEY` from `andromeda/04_SOFTWARE/donate-api` |
| `STRIPE_WEBHOOK_SECRET` | donate-api CF Worker secret | Stripe Dashboard → Webhooks → Reveal/Roll → re-put via wrangler |
| `SIMPLEX_EMAIL_INGEST_SECRET` | simplex-v7 CF Worker secret | `wrangler secret put SIMPLEX_EMAIL_INGEST_SECRET` from `simplex-v7/` |
| `EPCP_ADMIN_TOKEN` | command-center CF Worker secret | `wrangler secret put EPCP_ADMIN_TOKEN` |
| `BOUNCER_GATE_TOKEN` | p31-bouncer CF Worker secret | `wrangler secret put BOUNCER_GATE_TOKEN` |
| `K4_OPERATOR_KEY` (Ed25519) | Operator local disk (`~/.p31/keypair.json`) | `p31 agent-hub anchor create` (generates new keypair + anchor pact); update `p31-passport-anchor-pact.json` fingerprint |

---

## Rotation procedure

### Cloudflare API Token
1. Cloudflare Dashboard → My Profile → API Tokens
2. Select active token → Edit → Roll Token → copy new value
3. `gh secret set CF_API_TOKEN --body "<new-value>"` (from repo root)
4. Trigger a manual CI run to confirm deploy passes

### GitHub PAT
1. GitHub → Settings → Developer Settings → Personal access tokens (classic)
2. Find token → Regenerate → copy new value
3. `gh secret set GH_PAT --body "<new-value>"` (if used as a separate secret)
4. Confirm CI passes

### Stripe secrets
```bash
cd andromeda/04_SOFTWARE/donate-api
wrangler secret put STRIPE_SECRET_KEY       # paste from Stripe Dashboard → API keys
wrangler secret put STRIPE_WEBHOOK_SECRET   # paste from Stripe Dashboard → Webhooks → signing secret
```

### Worker secrets (wrangler pattern)
```bash
cd <worker-dir>
wrangler secret put <SECRET_NAME>   # prompts for value
wrangler secret list                # confirm
```

### Ed25519 operator keypair
Only rotate if key is compromised. Rotation invalidates all existing anchor pacts.
```bash
p31 agent-hub anchor create --force   # generates new keypair, writes ~/.p31/keypair.json
p31 agent-hub anchor register          # re-registers with all hubs
# Update p31-passport-anchor-pact.json with new fingerprint, commit
```

---

## 90-day rotation calendar

| Date | Action |
|------|--------|
| 2026-07-30 | Rotate CF_API_TOKEN + GH_PAT |
| 2026-10-28 | Rotate CF_API_TOKEN + GH_PAT |
| 2027-01-26 | Rotate CF_API_TOKEN + GH_PAT + Stripe secrets |

---

## Break-glass escalation

If a secret is suspected compromised:
1. Revoke immediately in the issuing platform
2. Re-issue and update all consuming locations (repo secrets + wrangler secrets)
3. Audit recent GitHub Actions logs and Cloudflare audit log for anomalous activity
4. If Ed25519 keypair is compromised: issue `p31 agent-hub anchor create --force`, redeploy k4-agent-hub with new anchor

---

## Related

- `docs/P31-ENGINEERING-STANDARD.md` — §Secrets management
- `andromeda/04_SOFTWARE/p31ca/security/worker-allowlist.json` — worker identity surface
- `p31-passport-anchor-pact.json` — Ed25519 public fingerprint (public; safe to commit)
