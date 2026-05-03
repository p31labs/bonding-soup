# P31 Maintenance Schedule

**Owner:** Operator (W.Johnson-001)
**Last updated:** 2026-05-03
**Enforcement:** `docs/public-line.json` + `npm run verify:public-line`

---

## §1. Tiers

| Gate | Meaning | Public? |
|------|---------|---------|
| `live` | Past Gate 3. Meets all standards. | ✅ Yes |
| `gate3` | 7-day staging soak + non-owner review pending | ❌ No |
| `gate2` | Implementation complete; Lighthouse + a11y + screen reader passed | ❌ No |
| `gate1` | Design complete; not yet implemented or missing standards | ❌ No |
| `maintenance` | Temporarily withdrawn; `/maintenance.html` served | ❌ No |
| `alpha` | Operator-only; never in PHOS nav | ❌ No |
| `external` | Different origin; not managed by this gate | — |
| `gap` | PHOS slot with no page — P0 build gap | 🚨 Fix immediately |

---

## §2. Automated cadence

| Frequency | What runs | Where output lands |
|-----------|-----------|-------------------|
| Daily | `verify:verify-pulse` (heartbeat) | Glass Box |
| Weekly (Monday 06:00 UTC) | `npm run psych:run` — scores all `gate=live` pages | Glass Box psych E2E report |
| Monthly (1st of month) | `npm run release:check` full ladder | Operator reviews output |

Any page scoring < 75 on the weekly psych run is **automatically flagged** as a maintenance candidate in the Glass Box report. The operator makes the final call to demote or accept.

---

## §3. Maintenance mode toggle

**Pull a page immediately:**
```bash
npm run maintenance:on -- /glass-box
```

**For production traffic** (Cloudflare), toggle the Worker route:
```bash
# Put maintenance Worker in front of the surface
wrangler routes add "p31ca.org/glass-box*" maintenance-worker --env production

# Restore
wrangler routes delete "p31ca.org/glass-box*" maintenance-worker --env production
```
The maintenance Worker returns fully self-contained HTML (no external assets), so it never fails to render.

**Restore a page:**
```bash
npm run maintenance:off -- /glass-box
```
Re-verify before restoring:
```bash
npm run verify:public-line && npm run psych:run
```

---

## §4. Three-gate promotion checklist

A surface moves from `gate1` → `gate2` → `gate3` → `live`. **No skipping.**

### Gate 1 → Gate 2 (Implementation Complete)
- [ ] All 4 states implemented: empty, loading, error, normal
- [ ] Lighthouse CI passes (perf ≥ 0.90, a11y = 1.00, LCP ≤ 2500ms, CLS ≤ 0.10)
- [ ] Manual screen reader pass: NVDA (desktop) + VoiceOver iOS (mobile)
- [ ] Keyboard-only navigation verified end-to-end
- [ ] Copy reviewed by someone who isn't the implementer
- [ ] Zero console errors/warnings in production build
- [ ] `phosReady` set to true (§4 PHOS voice copy written)

### Gate 2 → Gate 3 (Staging Soak)
- [ ] Surface deployed to staging / behind feature flag
- [ ] 7-day soak with at least the operator as internal user
- [ ] Telemetry wired (error reporting + analytics events for top 3–5 user actions)
- [ ] Documentation page exists and is reachable from the surface
- [ ] Non-owner reviewer signs off (written note in GitHub issue or commit message)

### Gate 3 → Live (Production)
- [ ] `docs/public-line.json` entry updated to `"gate": "live"`
- [ ] `docs/flags.json` entry updated to `"enabled": true`
- [ ] `npm run verify:public-line` passes clean
- [ ] `npm run psych:run` scores ≥ 80 for this surface
- [ ] `npm run release:check` passes end-to-end

---

## §5. Complaint / regression protocol

1. **On complaint or automated flag (psych score < 75):**
   - `npm run maintenance:on -- /path` — pulls the page immediately
   - Toggle Cloudflare Worker route (§3)
   - Log the issue in the production tracker (GitHub issue)

2. **During repair:**
   - Fix the root cause — no "cosmetic patches" on a live page
   - Re-run Gate 2 checklist (even for a fix — stability > speed)
   - 2-day re-soak minimum before restore

3. **On restore:**
   - `npm run maintenance:off -- /path`
   - Remove Cloudflare Worker route
   - `npm run verify:public-line && npm run psych:run`
   - If psych score ≥ 80: proceed
   - Commit public-line.json with `fix(public-line): restore /path after <description>`

---

## §6. Quarterly drift audit

**Run manually on the 1st of each quarter:**
```bash
npm run audit:pages       # full table: every registered surface
npm run psych:run:full    # 20-session deep scan
npm run release:check     # full gate ladder
```

Review output. For any surface below 80 psych OR below Gate 2 standards:
- Either fix and restore to live, OR
- Move to `gate1` and remove from public nav

---

## §7. P0 gaps (must fix before `release:check` passes)

| Path | Issue | Status |
|------|-------|--------|
| `/research` | No page exists. PHOS bus bar slot 5 routes to 404. | **Open** — build research index or add `_redirects → /lab` as interim |

Update this table as gaps are resolved.
