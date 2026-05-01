# Grant Pipeline — Operator Quick Start

## Overview

The P31 grant pipeline is now fully wired: single-source `docs/grants/grant-pipeline.json` → Cortex GrantAgent DO → Command Center dashboard + Discord bot.

## Files Added/Modified in This Session

| File | Purpose |
|------|---------|
| `docs/grants/grant-pipeline.json` | Single source of truth for all grant opportunities |
| `andromeda/04_SOFTWARE/p31-forge/content/grants/awesome.json` | Awesome Foundation content pack |
| `andromeda/04_SOFTWARE/p31-forge/content/grants/microsoft.json` | Microsoft AI for Accessibility content pack |
| `andromeda/04_SOFTWARE/p31-forge/content/grants/stimpunks.json` | Stimpunks Foundation content pack |
| `scripts/verify-grants.js` | CI gate — checks pipeline integrity |
| `andromeda/04_SOFTWARE/p31-cortex/scripts/sync-grants.js` | Sync pipeline JSON → GrantAgent DB |
| `andromeda/04_SOFTWARE/discord/p31-bot/src/commands/grants.ts` | Now fetches live from GrantAgent (was static) |
| `andromeda/04_SOFTWARE/cloudflare-worker/command-center/src/epcp-dashboard.js` | Added grants KPI cards + upcoming table |
| `andromeda/04_SOFTWARE/cloudflare-worker/command-center/src/index.js` | Health pinger now enriches status with grant data |
| `.github/workflows/grant-radar.yml` | Fixed syntax (node → python3) |

## One-Line Commands

```bash
# 1. Verify pipeline integrity (pre-commit hook candidate)
npm run grant:verify

# 2. Seed GrantAgent DB from canonical JSON (run after any pipeline edit)
npm run grant:sync

# 3. Dry-run seed (see what would change)
npm run grant:sync:dry

# 4. Trigger GrantAgent deadline sweep + get pipeline summary
npm run grant:run

# 5. Open command center (localhost:3131) to see grant KPI dashboard
npm run command-center

# 6. View grant pipeline JSON
cat docs/grants/grant-pipeline.json | jq '.grants[] | {id, title, funder, deadline, status}'
```

## The Flow

```
Operator edits docs/grants/grant-pipeline.json  (single source of truth)
         ↓
npm run grant:sync  (POST /api/grant/init for each grant entry)
         ↓
Cortex GrantAgent DO stores grants in D1 DB
         ↓
npm run grant:run  (POST /api/grant/run) triggers:
   • Mark overdue grants
   • Fire scheduled alerts
   • Flag grants needing assembly (deadline ≤ 21d)
   • Return pipeline summary JSON
         ↓
Command Center health pinger (every 5min) calls /api/grant/run
   → enriches /api/status with {grants: {active, daysToNextDeadline, upcoming[]}}
   → displays on dashboard
   → Discord bot fetches same endpoint
```

## Immediate Action Items (Today)

1. **Fix grant-radar cron**  
   - Issue: Workflow runs `node grant_radar.py` but file is Python  
   - Status: FIXED in this session (workflow now `cd .. && python3 grant_radar.py`)  
   - Verify: Check Actions tab → last run should succeed

2. **Seed GrantAgent**  
   ```bash
   npm run grant:sync
   ```
   - Creates 7 grant records in D1 (`p31-cortex` database)
   - Sets alerts for each (14d, 7d, 3d, 1d pre-deadline)
   - Safe to run multiple times — idempotent by title

3. **Review NLnet draft for operator voice**  
   - File: `docs/grants/nlnet-ngi-zero-commons-application.md`
   - Hard deadline: **June 1, 2026** (31 days from today)
   - Only blocker: rewrite paragraph starting "I built this because I needed it." in your own words.
   - After voice check: **SUBMIT** at nlnet.nl (NGI Zero Commons)

4. **Write ASAN 500-word narrative**  
   - Opens: May 15, 2026 (14 days from today)  
   - Points: AuDHD + hypoparathyroidism lived experience | BONDING prevents surveillance capitalism on kids | Cognitive Passport as structured self-advocacy
   - Budget: $6,250 (detailed in grant-pipeline.json)
   - Write directly in `docs/grants/asan-narrative.md` then fold into content pack if desired

5. **Command Center**  
   - Run `npm run command-center` locally → http://127.0.0.1:3131  
   - See grants KPI: Active count, days to next deadline, upcoming table  
   - Or visit `https://command-center.trimtab-signal.workers.dev`

6. **Discord**  
   - `!grants` now shows live data from GrantAgent (no code change needed — just deploy Discord bot with updated file)

## Grant Pipeline Status (After Sync)

| Grant | Amount | Deadline | Status |
|-------|--------|----------|--------|
| NLnet NGI Zero Commons | €15K | Jun 1, 2026 | Draft complete — voice review |
| ASAN Teighlor McGee | $6.25K | Jul 31, 2026 | Portal opens May 15 — narrative pending |
| Stimpunks Foundation | $3K | Jun 1, 2026 | Content pack ready |
| Microsoft AI for Accessibility | $75K | Rolling | Content pack ready (wait 501c3) |
| Awesome Foundation | $1K | Apr 30, 2026 | Submitted — awaiting decision |
| NIDILRR Switzer Fellowship | $80K/yr | Feb 1, 2027 | Contact initiated |
| NIDILRR FIP Development | $250K/yr × 3 | Mar 15, 2027 | Contact initiated |

**Total reachable (next 12mo): ~$100K+**

## Missing Pieces (Future Work)

- [ ] Grant budget template CSV (exists in `andromeda/docs/corporate/suite/grant-budget-template.csv` but not integrated into Forge)
- [ ] Grant submission receipt tracking (attach PDF confirmations to grant record in GrantAgent)
- [ ] Grant-related social engine waves (announcement for submitted/awarded)
- [ ] Public grant tracker page (`p31ca.org/grants`)
- [ ] Grant-specific CI gate (`npm run verify` includes `verify:grants` already added)
- [ ] Google.org / Apple Accessibility / Cloudflare for Startups programs (research phase)

## Verification

```bash
# All grant checks pass
npm run grant:verify

# Integration check
curl -s https://p31-cortex.trimtab-signal.workers.dev/api/grant/run | jq '.pipeline | length'
# → should print 7

# Command center grants KPI
curl -s https://command-center.trimtab-signal.workers.dev/api/status | jq '.grants'
# → {active, daysToNextDeadline, upcoming: [...]}
```

---

**Last updated:** 2026-05-01 by Kilo automation  
**Canonical source:** `docs/grants/grant-pipeline.json`  
