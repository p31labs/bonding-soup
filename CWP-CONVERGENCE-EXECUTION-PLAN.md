# CWP Convergence Execution Plan

**Date:** 2026-04-27  
**Input:** `docs/cwp-convergence/INDEX.md` (11 CWPs)  
**Strategy:** Close easy wins first → hygiene → real product work  

---

## Wave 1 — Verification Closes (same day, < 2 hours total)

These CWPs are functionally complete from today's sprint. Close them with a
verify pass and a one-line footer in each file.

### CWP-04: Operator Glass — CLOSE

Already shipped: command-center Worker deployed, `GET /api/operator/shift` →
200 JSON (Access bypass), `/ops/` glass ingest working, `operator-shift-public`
probe UP.

**Remaining:** Document the Access bypass decision in `p31ca/docs/EDGE-SECURITY.md`
(which paths are public vs SSO). One paragraph, not a project.

```
## Composer prompt: Close CWP-04 Operator Glass

1. Open `andromeda/04_SOFTWARE/p31ca/docs/EDGE-SECURITY.md`
2. Add a section "## Access bypass rules" documenting:
   - `GET /api/operator/shift` — public via separate Access app "Public operator shift"
     (Bypass policy, Include = Everyone, path-scoped)
   - All other command-center paths remain behind "command-center" Access app (Allow Admins)
   - POST /api/operator/shift — Access-gated (not bypassed)
3. Run: `npm run verify` in p31ca — exit 0
4. Run: `npm run ecosystem:glass 2>&1 | grep -E "operator-shift|command-center"`
   — both rows should show UP
5. Update `docs/cwp-convergence/CWP-04-OPERATOR-GLASS.md`:
   - Change Status: OPEN → CLOSED (2026-04-28)
   - Check all convergence boxes
   - Add footer: "Closed: all probes UP, Access bypass documented in EDGE-SECURITY.md"
6. Report changes. Do not commit yet.
```

### CWP-07: BONDING Satellite — CLOSE

Already shipped: bonding.p31ca.org → 200, relay /health → 200, constants
`bonding.publicUrl` = `https://bonding.p31ca.org`, glass row exists.

```
## Composer prompt: Close CWP-07 BONDING Satellite

1. Verify alignment:
   ```bash
   cd /home/p31
   node -e "const c=JSON.parse(require('fs').readFileSync('p31-constants.json','utf8')); console.log('publicUrl:', c.bonding?.publicUrl); console.log('testBaseline:', JSON.stringify(c.bonding?.testBaseline))"
   ```
   Expected: publicUrl = https://bonding.p31ca.org, testBaseline = 424/32

2. Verify glass:
   ```bash
   npm run ecosystem:glass 2>&1 | grep -i bonding
   ```
   Expected: bonding URL row UP 200

3. Verify live:
   ```bash
   curl -s -o /dev/null -w "%{http_code}" "https://bonding.p31ca.org/"
   curl -s -o /dev/null -w "%{http_code}" "https://bonding-relay.trimtab-signal.workers.dev/health"
   ```
   Expected: 200, 200

4. Update `docs/cwp-convergence/CWP-07-BONDING-SATELLITE.md`:
   - Status: OPEN → CLOSED (2026-04-28)
   - Check all convergence boxes
   - Footer: "Closed: glass UP, constants aligned, relay /health 200"

5. Report. Do not commit yet.
```

### CWP-09: Registry/Hub ECO — CLOSE

Already shipped: legacy-mvp-hub.html deleted, redirects live, diff-index-sources
clean, ADR updated, one source of truth.

```
## Composer prompt: Close CWP-09 Registry/Hub ECO

1. Confirm diff-index is clean:
   ```bash
   cd andromeda/04_SOFTWARE/p31ca && node scripts/hub/diff-index-sources.mjs
   ```
   Expected: "OK (ground truth + hub-landing alignment)" with no [warn] lines

2. Confirm legacy redirects are live:
   ```bash
   curl -sI "https://p31ca.org/legacy-mvp-hub.html" | head -3
   curl -sI "https://p31ca.org/legacy-mvp-hub" | head -3
   ```
   Expected: 301 → /

3. Confirm add/remove card playbook exists:
   ```bash
   grep -l "add.*card\|remove.*card\|new.*product" andromeda/04_SOFTWARE/p31ca/docs/*.md /home/p31/docs/*.md 2>/dev/null | head -5
   ```
   If P31-HUB-CARD-ECOSYSTEM.md has the playbook: done. If not: add a
   3-line "How to add a card" section (edit hub-app-ids + registry + ground-truth,
   hub:build, about gen, verify).

4. Update `docs/cwp-convergence/CWP-09-REGISTRY-HUB-ECO.md`:
   - Status: OPEN → CLOSED (2026-04-28)
   - Check all convergence boxes
   - Footer: "Closed: legacy sunset shipped, diff-index clean, one hub source of truth"

5. Report. Do not commit yet.
```

---

## Wave 2 — Quick Sprints (1–2 days)

### CWP-03: Mesh/K4 Edge — verify + document exceptions

Run full glass, document any intentionally-down probes in ECOSYSTEM-PRODUCTION-11,
verify:mesh + verify:ecosystem, close.

### CWP-11: Repo Hygiene — PR triage + auto-merge

Triage Andromeda PRs #16, #33, #34, #57 (close stale, rebase active).
Drop the Andromeda stash. Configure auto-merge in repo settings if org allows.
Document the process in the CWP file. Close.

### CWP-06: Monetary/MAP — audit + verify

Check if verify:map-pipeline and verify:monetary scripts exist. Run them.
Confirm creator-economy.json matches live. Confirm donate-api health.
Fill any verify gaps. Close.

---

## Wave 3 — Real Product Work (1–2 weeks)

### CWP-05: Geodesic Rooms

Audit the geodesic-room Worker. Deploy if ready. Add glass probe. Wire
static campaign page to live Worker. Verify shared types match.

### CWP-10: Phosphorus31 Site

Document the deploy runbook. Verify constants match live org URLs.
Confirm donate-api.phosphorus31.org health. Close.

### CWP-01: Education E3+ (policy-gated)

**Cannot start code until 5 policy questions are answered:**
1. Who holds student data? (k4-personal DO / shared D1 / both)
2. Auth mechanism? (passkey only / passkey + magic link / open + optional)
3. Age gating? (COPPA out-of-scope / compliant / 13+ only)
4. Content licensing? (CC-BY-SA / proprietary / mixed)
5. Progress persistence? (local-first / edge / both)

Write answers in `docs/EDU-E3-POLICY-2026-01.md`, commit, THEN generate
Composer prompts for P1–P4.

### CWP-02: Node Zero (hardware, parallel always)

Pick up when the board is plugged in. NZ-01 through NZ-05.

---

## Wave 4 — Ongoing

### CWP-08: Security/Compliance

Mark as ONGOING, not CLOSED. security:check runs on every release that
touches Workers, deps, CORS, or headers. Document the recurring process.

---

## Summary

| Wave | CWPs | Effort | Outcome |
|------|------|--------|---------|
| 1 | 04, 07, 09 | < 2 hours | 3 CWPs closed, open count drops to 8 |
| 2 | 03, 11, 06 | 1–2 days | 3 more closed, open count drops to 5 |
| 3 | 05, 10, 01 | 1–2 weeks | Product work, policy-gated | 
| 4 | 08 | Ongoing | Recurring gate |
| — | 02 | Parallel | Hardware-dependent |

**Start Wave 1 now. It's < 2 hours and you close 3 CWPs today.**
