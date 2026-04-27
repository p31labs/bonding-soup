# CWP-P31-DEPLOY-2026-02: Production Deployment Sprint

**Document:** Controlled Work Package  
**Author:** Will Johnson / Opus (Architect)  
**Date:** 2026-04-27  
**Status:** OPEN  
**Scope:** Close the gap between local-green and production-live across p31ca, command-center Worker, BONDING relay, and Andromeda CI  
**Estimated Duration:** 1 session (4–6 hours focused) or 2 sessions split across Deep Work 1 + Deep Work 2  

---

## 0. Executive Summary

Multiple agent sessions shipped significant infrastructure — education series, mission trio, dome deep-linking, SOULSAFE tetra, hiring integration, responsive CSS, 424/32 BONDING test baseline, CI workflow fixes. All verified locally. None deployed to production.

This CWP closes that gap in six sequential phases with hard gates between each. Every phase has a Cursor Composer prompt ready to paste. The sprint ends with production URLs matching what CI produces and all temporary workarounds removed.

**Out of scope (explicitly deferred to Phase D track selection):** Passkey Worker e2e wiring, ECO/cockpit 22-ID reconciliation, E3+ education portal (auth/D1), Poets room implementation, geodesic-room Worker, Node Zero firmware, 501(c)(3) filing.

---

## 1. Sprint Architecture

```
Phase 1 ─── Local Gate ──────────── npm run p31:all green
   │
Phase 2 ─── Git Hygiene ─────────── Andromeda commit + push + PR
   │
Phase 3 ─── p31ca Deploy ────────── Cloudflare Pages production
   │
Phase 4 ─── Workers Deploy ──────── command-center + relay smoke
   │
Phase 5 ─── Post-Deploy Cleanup ─── Remove workarounds, re-verify
   │
Phase 6 ─── Baseline Lock ──────── Constants, docs, memory update
```

**Hard rule:** No phase starts until the prior phase's Definition of Done is met. If a phase fails, fix in place — do not skip forward.

---

## 2. Preconditions (before starting)

| # | Check | How |
|---|-------|-----|
| P1 | Chromebook is on power + Wi-Fi | Physical |
| P2 | Terminal open in bonding-soup home root (`/home/p31` or equivalent) | `pwd` |
| P3 | Andromeda checkout is at `andromeda/` or `04_SOFTWARE/` relative to home | `ls andromeda/04_SOFTWARE/p31ca/package.json` |
| P4 | `wrangler whoami` returns your Cloudflare account | Terminal |
| P5 | GitHub CLI authenticated | `gh auth status` |
| P6 | No uncommitted work you care about losing | `git status` in both home and andromeda |

If any precondition fails, fix it before proceeding.

---

## 3. Phase 1 — Local Gate

**Objective:** Confirm the full verification suite passes end-to-end on current hardware after the Vitest 120s timeout fix.

**Why this is first:** If local isn't green, deploying ships broken artifacts. This phase costs 10–15 minutes and prevents every downstream problem.

### Steps

1. `cd` to bonding-soup home root
2. `npm run p31:all`
3. Wait for completion (may take 5–8 minutes on Chromebook with cold starts)
4. Capture exit code: `echo $?`

### Definition of Done

- `p31:all` exits 0
- No test failures in output
- No verify step errors

### If it fails

- Read the failing step name from output
- If Vitest timeout: check `vitest.config.mjs` has `testTimeout: 120000`
- If Playwright launch: set `P31_K4MARKET_SMOKE_SKIP_ON_LAUNCH_FAIL=1` and re-run (Chromebook headless can be flaky)
- If verify:command-center: check if it's the cold-start subprocess issue — re-run once before investigating

### Cursor Composer Prompt

```
## Task: Run full local verification gate

Run `npm run p31:all` from the repo root. Wait for it to complete — it may take 5-8 minutes.

If it exits 0, report "Phase 1 PASS" with the full summary output.

If it fails:
1. Report the exact failing step name and error
2. Do NOT attempt to fix anything without reporting first
3. If the failure is a Vitest timeout in verify:command-center, check that vitest.config.mjs has testTimeout: 120000. If it does and it still fails, re-run that single step once before reporting.
4. If it's a Playwright launch failure, set P31_K4MARKET_SMOKE_SKIP_ON_LAUNCH_FAIL=1 and re-run.
```

---

## 4. Phase 2 — Git Hygiene (Andromeda)

**Objective:** Get Andromeda main pushed to origin with all current work committed, and unblock the PR merge.

**Why before deploy:** Cloudflare Pages may build from the repo. Even if it doesn't, deploying from a dirty tree with unpushed commits is a configuration management violation.

### Known State (from agent sessions)

- Local `andromeda/main` is 1 commit ahead of `origin/main`
- `hub-landing.json` and `ops-glass-probes.json` have local changes (timestamp churn from verify runs)
- PR #58 is already merged
- Branch protection requires `build-and-test`, `code-quality`, `compliance-check` — new workflows exist but check name matching may need admin confirmation

### Steps

1. `cd andromeda`
2. `git status` — inventory what's modified/untracked
3. If `hub-landing.json` and `ops-glass-probes.json` changes are ONLY timestamp churn from verify/ingest: `git checkout -- 04_SOFTWARE/p31ca/src/data/hub-landing.json 04_SOFTWARE/p31ca/src/data/ops-glass-probes.json`
4. If there are real changes beyond timestamps: commit them with message `chore: sync hub-landing + ops-glass data after education/hiring/mission-trio`
5. `git log origin/main..HEAD --oneline` — confirm what's ahead
6. `git push origin main`
7. If push is rejected (branch protection): `gh pr create --base main --head main --title "Deploy: education + hiring + mission-trio + responsive" --body "CWP-P31-DEPLOY-2026-02 Phase 2"` and then admin-merge or get review
8. Confirm: `git log origin/main..HEAD --oneline` returns empty

### Definition of Done

- `git status` is clean in andromeda
- `origin/main` matches local `main`
- No commits ahead of origin

### Cursor Composer Prompt

```
## Task: Git hygiene for Andromeda repo

Working directory: the Andromeda repo (contains 04_SOFTWARE/p31ca).

1. Run `git status` and `git log origin/main..HEAD --oneline`. Report what you see.
2. If hub-landing.json or ops-glass-probes.json are the only modified files, inspect the diffs. If changes are ONLY timestamp fields (e.g. "generatedAt", "ingestedAt"), discard them: `git checkout -- <path>`.
3. If there are substantive changes, stage and commit: `git add -A && git commit -m "chore: sync hub data after education/hiring/mission-trio sprint"`
4. Push: `git push origin main`
5. If push fails due to branch protection, report the exact error. Do NOT force push.
6. Confirm: `git log origin/main..HEAD --oneline` should be empty. `git status` should be clean.

Report final state of both commands.
```

---

## 5. Phase 3 — Deploy p31ca to Cloudflare Pages

**Objective:** Ship all local work to production: education series, dome fix, hiring, responsive CSS, mission trio footer, hub registry updates.

**This is the highest-value phase.** Everything built in the last sprint becomes real here.

### Steps

1. `cd 04_SOFTWARE/p31ca`
2. Pre-deploy verification:
   - `npm run verify` — exit 0
   - `npm run build` — exit 0, `dist/` exists
   - `npm run hub:ci` — exit 0
3. Deploy: `npx wrangler pages deploy dist/ --project-name=p31ca --branch=production`
4. Post-deploy smoke (all must return 200, no redirect loops):

| URL | Expected |
|-----|----------|
| `https://p31ca.org/` | 200 |
| `https://p31ca.org/dome/` | 200 (was redirect loop — now fixed) |
| `https://p31ca.org/education/` | 200 (new) |
| `https://p31ca.org/education/about.html` | 200 (new) |
| `https://p31ca.org/hiring` | 301 → `/delta-hiring/index.html` |
| `https://p31ca.org/delta-hiring/` | 200 |
| `https://p31ca.org/connect.html` | 200 |
| `https://p31ca.org/build` | 200 or redirect to `/build/` |
| `https://p31ca.org/ops/` | 200 |
| `https://bonding.p31ca.org/` | 200 (separate project, just confirm still live) |

### Definition of Done

- All smoke URLs return expected status codes
- `/dome/` does NOT loop
- `/education/` serves content
- `/hiring` redirects correctly
- No console errors on root page load

### Cursor Composer Prompt

```
## Task: Deploy p31ca to Cloudflare Pages

Working directory: 04_SOFTWARE/p31ca

### Pre-deploy gate (must all exit 0)
1. `npm run verify`
2. `npm run build` — confirm dist/ contains index.html
3. `npm run hub:ci`

If ANY step fails, stop and report the error. Do not deploy.

### Deploy
4. `npx wrangler pages deploy dist/ --project-name=p31ca --branch=production`

If wrangler prompts for auth or the project name doesn't exist, stop and report. Do NOT create a new project.

### Post-deploy smoke
Run each curl and report status code + final URL:

```bash
for url in \
  "https://p31ca.org/" \
  "https://p31ca.org/dome/" \
  "https://p31ca.org/education/" \
  "https://p31ca.org/education/about.html" \
  "https://p31ca.org/hiring" \
  "https://p31ca.org/delta-hiring/" \
  "https://p31ca.org/connect.html" \
  "https://p31ca.org/ops/" \
  "https://bonding.p31ca.org/"; do
  echo "--- $url ---"
  curl -sL -o /dev/null -w "status: %{http_code}  final: %{url_effective}\n" "$url"
done
```

Expected:
- All 200 except /hiring which should 301 → /delta-hiring/index.html
- /dome/ must NOT redirect-loop (this was the bug we fixed)

### Report
Table of each URL, status, final URL. Flag any failures. Do not proceed to other tasks.
```

---

## 6. Phase 4 — Workers Deploy

**Objective:** Deploy the command-center Worker so `/api/operator/shift` is live at edge, and confirm BONDING relay health.

### 4A: Command-Center Worker

**Known state:** CWP closed at v1.0.3 in-repo. Worker code exists. Deploy is the only remaining step.

1. Locate the command-center Worker source (likely `andromeda/04_SOFTWARE/` or a dedicated workers dir — check `wrangler.toml`)
2. `npx wrangler deploy` from the Worker directory
3. Smoke:
   - `curl -s https://<command-center-worker-url>/api/operator/shift` → should return JSON (public GET)
   - Confirm CORS headers present for listed origins

### 4B: BONDING Relay Health

**Known state:** `bonding-relay.trimtab-signal.workers.dev/health` returned 200 in agent session. Root GET returns 404 (expected — no index route).

1. `curl -s https://bonding-relay.trimtab-signal.workers.dev/health` → 200
2. If 200: relay is live, no action needed
3. If not 200: check if relay Worker needs redeployment from bonding source

### Definition of Done

- Command-center Worker is deployed and `/api/operator/shift` returns valid JSON on GET
- BONDING relay `/health` returns 200
- Glass probe `operator-shift-public` in `p31-ecosystem.json` would pass if `ecosystem:glass` ran against live edge

### Cursor Composer Prompt

```
## Task: Deploy command-center Worker and verify relay health

### 4A: Command-Center Worker

1. Find the command-center Worker source. Check these locations:
   - `andromeda/04_SOFTWARE/` for a wrangler.toml mentioning "command-center"
   - Home repo workers/ or scripts/ directories
   - `grep -r "operator/shift" --include="*.ts" --include="*.js" -l` to find the source

2. Once located, `cd` to its directory and run `npx wrangler deploy`

3. After deploy, smoke test:
   ```bash
   curl -sv https://epcp-command-center.<your-subdomain>.workers.dev/api/operator/shift 2>&1 | grep -E "< HTTP|{" 
   ```
   Should return HTTP 200 with JSON body.

If you can't find the Worker source or wrangler.toml, report what you found and stop.

### 4B: BONDING Relay

4. `curl -s -o /dev/null -w "%{http_code}" https://bonding-relay.trimtab-signal.workers.dev/health`
   - Expected: 200
   - If not 200: report status code, do not attempt to fix

### Report
- Command-center Worker: deployed Y/N, shift endpoint status code, response snippet
- BONDING relay: /health status code
```

---

## 7. Phase 5 — Post-Deploy Cleanup

**Objective:** Remove temporary workarounds that were added while waiting for deploy, and re-verify.

### Steps

1. **Dome workaround removal:**
   - Open `04_SOFTWARE/p31ca/scripts/verify-stack-links.mjs`
   - Remove the temporary optional dome entries that were added to prevent false failures pre-deploy
   - `npm run verify` — must still pass with dome entries removed (because `/dome/` is now live and correct)

2. **diff-index-sources check:**
   - `npm run verify` output includes `diff-index-sources` — confirm the mvpData vs COCKPIT warning is the expected 22-ID informational line, not a new regression

3. **Verify ground-truth:**
   - `npm run verify:ground-truth` — exit 0

4. **Full re-verify:**
   - `npm run verify` from p31ca — exit 0
   - `MESH_LIVE_STRICT=1 npm run verify` from home root (now that production is deployed, strict mesh should pass)

### Definition of Done

- No temporary workarounds remain in verify scripts
- `verify` passes without optional/skip flags
- `MESH_LIVE_STRICT=1` passes (live URLs respond correctly)

### Cursor Composer Prompt

```
## Task: Post-deploy cleanup — remove workarounds and re-verify

Working directory: 04_SOFTWARE/p31ca

### Step 1: Remove dome workaround
1. Open `scripts/verify-stack-links.mjs`
2. Search for any dome-related entries that are marked as optional, skippable, or commented with "temporary" / "workaround" / "until deploy"
3. Remove those entries
4. Run `npm run verify:ground-truth` — must exit 0
5. Run `npm run verify` — must exit 0

### Step 2: Strict mesh verification
From the home/root repo:
6. `MESH_LIVE_STRICT=1 npm run verify`
   - If this fails on specific URLs, report which URLs and their status codes
   - Do NOT disable strict mode — the point is to confirm production matches

### Step 3: Commit cleanup
7. If any files changed in steps 1-2:
   `git add -A && git commit -m "chore: remove post-deploy dome workarounds, strict mesh green"`
8. `git push origin main`

### Report
- Which workaround entries were removed (quote the lines)
- verify exit code
- strict mesh exit code
- Any URLs that failed strict check
```

---

## 8. Phase 6 — Baseline Lock

**Objective:** Update canonical numbers, docs, and memory to reflect production state.

### Steps

1. **BONDING test baseline:** Confirm `p31-constants.json` says `424 tests / 32 suites`. If tests were added during this sprint, re-run `npm test` in `04_SOFTWARE/bonding/` and update constants if the count changed.

2. **Hub product count:** Confirm hub registry has 26 products (or current count). Update any docs that reference old counts.

3. **Home repo remote:** 
   - If bonding-soup home root still has no git remote:
     - `git remote add origin https://github.com/p31labs/bonding-soup.git` (or the correct URL)
     - OR set `p31-github.json → homeRepository` and run `npm run git:remotes`
   - `git push origin main`

4. **Docs update:** In AGENTS.md or P31-ROOT-MAP.md, update the "last deploy" date or version marker if one exists.

5. **Commit + push:** All repos clean, all pushed.

### Definition of Done

- `p31-constants.json` reflects actual test counts
- All repos have remotes configured
- All repos are pushed with clean `git status`
- Production URLs match local build

### Cursor Composer Prompt

```
## Task: Lock baselines and push all repos

### Bonding baseline
1. `cd 04_SOFTWARE/bonding && npm test` — capture test count and suite count
2. If different from p31-constants.json bonding.testBaseline, update the constant
3. If constant changed: `npm run apply:constants` from root

### Home repo remote
4. From home root: `git remote -v`
   - If no origin: `git remote add origin https://github.com/p31labs/bonding-soup.git`
   - Adjust URL if the actual repo name differs
5. `git add -A && git commit -m "chore: baseline lock after CWP-P31-DEPLOY-2026-02"` (if there are changes)
6. `git push origin main`

### Final state check
7. In EACH repo (home, andromeda, bonding):
   - `git status` → clean
   - `git log origin/main..HEAD --oneline` → empty
8. Report the final state of all three.
```

---

## 9. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Wrangler auth expired | Medium | Blocks Phase 3+4 | `wrangler login` before starting |
| Branch protection blocks push | Medium | Blocks Phase 2 | Admin-merge or temporarily adjust ruleset |
| Playwright flaky on Chromebook | High | Blocks Phase 1 | Use skip flags for headless-sensitive tests |
| p31ca Pages project name mismatch | Low | Blocks Phase 3 | `wrangler pages project list` to confirm exact name |
| Command-center Worker source not found | Low | Blocks Phase 4A | `grep -r` across both repos; may be in a separate checkout |
| BONDING relay down | Low | Phase 4B reports failure | Not blocking — relay is separate infra, report and track |
| Strict mesh fails on URLs not yet propagated | Medium | Blocks Phase 5 | Wait 2-5 minutes post-deploy for CDN propagation, then retry |

---

## 10. Deferred Work (Phase D — Pick One Track After This CWP Closes)

These are explicitly NOT in this sprint. They are documented here so the brain can release them.

| Track | Description | Entry Point |
|-------|-------------|-------------|
| **Passkey e2e** | Wire identity path end-to-end: connect.html → passkey Worker → k4-personal subject_id | CWP-P31-PAR-2026-01 deliverable D-PA3 |
| **ECO/Cockpit merge** | Reconcile 22 legacy mvpData IDs with cockpit grid | `diff-index-sources.mjs` output as starting inventory |
| **E3+ Education** | Auth portal, D1 database, new Workers | docs/PLAN-P31-LABS-EDUCATION-SITE.md Phase E3 |
| **Poets Room** | Lobby exists; needs registry, public/poets.html, hub IDs | docs/P31-HUB-CARD-ECOSYSTEM.md |
| **Geodesic Room Worker** | Wire protocol spec'd in `@p31/shared/geodesic-room-wire`; Worker not deployed | docs/GEODESIC-GAME-ENGINE-INTEGRATION.md |
| **Node Zero firmware** | Waveshare ESP32-S3, LVGL, lv_init() fix confirmed | Separate firmware repo |
| **Grants** | Awesome Foundation (April deliberation); Stimpunks paused until June 1 | Grant pipeline doc |
| **501(c)(3)** | Direct filing path after EIN received (42-1888158) | P31 Labs incorporation docs |

---

## 11. Sprint Checklist (tear-off)

Print this or keep it open. Check each box as you go.

```
PRECONDITIONS
[ ] Power + Wi-Fi
[ ] Terminal in home root
[ ] Andromeda checkout accessible
[ ] wrangler whoami → correct account
[ ] gh auth status → authenticated
[ ] git status clean in both repos

PHASE 1 — LOCAL GATE
[ ] npm run p31:all → exit 0
[ ] No test failures

PHASE 2 — GIT HYGIENE
[ ] Andromeda: discard timestamp churn OR commit real changes
[ ] git push origin main → success
[ ] git log origin/main..HEAD → empty

PHASE 3 — P31CA DEPLOY
[ ] npm run verify → exit 0
[ ] npm run build → exit 0
[ ] npm run hub:ci → exit 0
[ ] wrangler pages deploy → success
[ ] p31ca.org/ → 200
[ ] p31ca.org/dome/ → 200 (no loop)
[ ] p31ca.org/education/ → 200
[ ] p31ca.org/hiring → 301 → /delta-hiring/
[ ] p31ca.org/connect.html → 200
[ ] p31ca.org/ops/ → 200
[ ] bonding.p31ca.org/ → 200

PHASE 4 — WORKERS DEPLOY
[ ] Command-center Worker source located
[ ] wrangler deploy → success
[ ] /api/operator/shift GET → 200 + JSON
[ ] bonding-relay /health → 200

PHASE 5 — POST-DEPLOY CLEANUP
[ ] Dome workaround entries removed from verify-stack-links.mjs
[ ] npm run verify → exit 0 (no workarounds)
[ ] MESH_LIVE_STRICT=1 npm run verify → exit 0
[ ] Cleanup committed + pushed

PHASE 6 — BASELINE LOCK
[ ] BONDING test count verified in p31-constants.json
[ ] Home repo remote configured
[ ] All repos pushed, git status clean
[ ] CWP status → CLOSED
```

---

## 12. Closure

**Closed by:** _______________  
**Date:** _______________  
**Final BONDING baseline:** ___ tests / ___ suites  
**Final hub product count:** ___  
**All production URLs green:** [ ] Yes / [ ] No (list exceptions)  
**Next track selected (Phase D):** _______________  

---

*CWP-P31-DEPLOY-2026-02 — Production Deployment Sprint*  
*"Green locally means nothing. Green in production means everything."*
