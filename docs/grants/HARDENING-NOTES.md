# Harden + Polish — Grant Pipeline

## Changes made in this session

### 1. Rate limiting on GrantAgent /api/grant/init
- **File:** `andromeda/04_SOFTWARE/p31-cortex/src/do/grant-agent.ts:17-26`
- **Limit:** 10 init calls per minute per IP (Cloudflare CF-Connecting-IP)
- **Prevents:** Accidentally triggering hundreds of grant seeds in a loop
- **Headers:** `Retry-After: 60` on 429 response

### 2. Input validation (GrantAgentDO.handleInit)
Validates before DB insert:
- `title`: required, 1–200 chars
- `amount`: numeric, 0–100M range
- `deadline`: parseable ISO date (stores YYYY-MM-DD only)
- `status`: enum ["researching","assembling","submitted","awarded","rejected"]
- `requirements`: array (max 20 items, strings ≤200 chars — enforced downstream)
- Rejects malformed JSON or missing required fields with 400 + `{error, reason}`

### 3. Idempotent sync with backoff (sync-grants.js)
- Reads existing grants via `/api/deadlines?category=grant` before POST
- Upsert semantics: existing → skip (or `--force` to overwrite)
- Exponential backoff: 2s → 4s → 8s (max 10s), up to 3 retries on 5xx/network
- Honors `Retry-After` header if present
- `--dry-run` shows plan without touching DB
- `--skip-existing` (default) safe; `--force` overwrites
- Status mapping: pipeline `draft_*` → GrantAgent `researching/assembling`

### 4. Command Center active-status filter widened
- **File:** `andromeda/04_SOFTWARE/cloudflare-worker/command-center/src/index.js:863`
- Now includes `submitted` and `active` in active grant count (previously only `pending/assembling/researching`)
- KPI reflects grants that are actually in-flight, not just drafting

### 5. verify:grants extended schema checks
- Added JSON schema validation for grant-pipeline.json (required top-level fields)
- Checks amount objects have `requested` + `currency`
- Validates date formats are ISO (YYYY-MM-DD or `rolling`)
- Warns on future-dated deadlines >3 years out (likely typo)

### 6. Content pack sanity
All 6 content packs validated:
- `nlnet.json`, `asan.json`, `stimpunks.json` — present with `kind: "grant"`
- `gates.json` — exists but not in pipeline (archived)
- New packs: `awesome.json`, `microsoft.json`

### 7. Security posture
- No secrets in any new file (verified via grep -i token/key/secret)
- All HTTP calls use HTTPS endpoints only
- GrantAgent /init not exposed to public internet without auth (Cortex DO internal binding)
- Discord bot fetch uses same-origin policy via CORS (grant-agent allows bot origin)
- Command center pinger uses 5s timeout, non-blocking (failure doesn't break dashboard)

---

## Verification checklist

```bash
# 1. Schema + file integrity
npm run grant:verify

# 2. Dry-run sync (see what would change)
npm run grant:sync:dry

# 3. Live sync (idempotent — safe to run multiple times)
npm run grant:sync

# 4. Trigger sweep + inspect pipeline
npm run grant:run | jq '.pipeline[] | {title, status, due_date, metadata: (.metadata | fromjson | .funder)}'

# 5. Command Center enrichment (wait ≤5min for health pinger)
curl -s https://command-center.trimtab-signal.workers.dev/api/status | jq '.grants'

# 6. Discord bot (post-deploy)
#    !grants → live GrantAgent data
```

---

## Outstanding items (future hardening)

| Item | Priority | Notes |
|------|----------|-------|
| Deploy p31-forge Worker (KV + secrets) | HIGH | `/compile` endpoint not live yet — content packs can't be generated on demand |
| Grant-radar cron enable | MEDIUM | Uncomment `crons = ["0 9 * * *"]` in p31-forge wrangler.toml after KV created |
| Grant submission receipt attachment | LOW | Extend GrantAgent `metadata` with `submissionConfirmation?: {url, date, confirmNumber}` |
| Grant budget template generatio