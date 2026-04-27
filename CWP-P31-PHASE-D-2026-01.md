# CWP-P31-PHASE-D-2026-01: Product Completion Program

**Document:** Controlled Work Package — Umbrella Program  
**Author:** Will Johnson / Opus (Architect)  
**Date:** 2026-04-27  
**Status:** OPEN  
**Predecessor:** CWP-P31-DEPLOY-2026-02 (CLOSED — production aligned)  
**Scope:** Complete all remaining product tracks to close the gap between "built in repo" and "shipped, wired, verified"

---

## 0. Executive Summary

The deploy sprint (CWP-DEPLOY-2026-02) closed the infrastructure gap. What remains is product completion: hub truth, identity, education, and hardware. These four tracks have real dependencies — you can't trust hub counts until ECO is reconciled, you can't promise identity until passkey is wired, you can't gate education until you decide auth policy, and firmware is its own world.

This CWP sequences all four tracks into one program with hard gates. Tracks that can run in parallel are marked. Tracks that block each other are sequenced. Every track ends with a verify command and a production deploy.

**Estimated total duration:** 2–3 weeks of focused work (not calendar time — Deep Work blocks per the Buffer Schedule).

---

## 1. Program Architecture

```
Track A ─── ECO / Cockpit Grid ─────── Hub truth, one source, quiet diffs
   │
Track B ─── Passkey E2E ────────────── Identity wired, connect.html live
   │
Track C ─── E3+ Education Portal ───── Auth, D1, student flow (GATED on policy decisions)
   │
Track D ─── Node Zero Firmware ──────── Parallel — different repo, different brain mode
```

### Dependency Map

```
                    ┌──────────┐
                    │ Track A  │  ECO / Cockpit
                    │ (hub     │  
                    │  truth)  │  
                    └────┬─────┘
                         │ hub counts correct
                         ▼
                    ┌──────────┐     ┌──────────┐
                    │ Track B  │     │ Track D  │
                    │ Passkey  │     │ Node Zero│  ← runs in parallel,
                    │ E2E      │     │ Firmware │    no shared files
                    └────┬─────┘     └──────────┘
                         │ identity path live
                         ▼
                    ┌──────────┐
                    │ Track C  │  E3+ Education
                    │ (needs   │  (auth depends on
                    │  auth)   │   passkey path)
                    └──────────┘
```

**Track A first** because everything downstream trusts hub counts and card state.  
**Track B second** because identity is the next product milestone and C depends on it.  
**Track C third** because it needs auth policy decisions that A and B inform.  
**Track D anytime** — firmware is a sibling, not a blocker. Pick it up when you're in hardware brain mode.

---

## 2. Track A — ECO / Cockpit Grid Reconciliation

**Objective:** Reconcile the 22 legacy mvpData IDs with the cockpit grid so `diff-index-sources` stops warning and the hub has one source of truth.

**Why first:** Every hub operation (hub:ci, about page generation, glass probes, product counts in docs) is noisy or wrong until this is done. It's tech debt that makes everything else harder to verify.

**Estimated effort:** Half day to one day.

### Known State

From the agent sessions, `diff-index-sources.mjs` reports 22 IDs in legacy `mvpData` but not on `COCKPIT_PRODUCT_IDS`:

```
book, appointment-tracker, love-ledger, medical-tracker, somatic-anchor,
legal-evidence, kids-growth, contact-locker, sleep-tracker, budget-tracker,
simple-sovereignty, node-one, node-zero, sovereign, bridge, mission-control,
quantum-life-os, qg-ide, forge, prism, tether, echo, kinematics
```

Inverse: `p31-delta-hiring` is on cockpit but not in legacy mvpData.

### Decision Framework

For each of the 22 IDs, one of three dispositions:

| Disposition | Meaning | Action |
|-------------|---------|--------|
| **PROMOTE** | Real product, has a page or worker or is actively planned | Add to `COCKPIT_PRODUCT_IDS` in `build-landing-data.mjs`, ensure registry entry + about page |
| **ARCHIVE** | Was an idea, not actively built, not shipping soon | Remove from mvpData, add to a `ARCHIVED_PRODUCT_IDS` list (or just delete) |
| **MERGE** | Duplicate or subset of another product | Remove from mvpData, note in the surviving product's registry entry |

### Pre-work (Will — human decision)

Before running any Composer prompt, classify each ID. Here's a starter based on what I know:

| ID | Likely Disposition | Reasoning |
|----|-------------------|-----------|
| `node-one` | PROMOTE | Hardware product, actively designed |
| `node-zero` | PROMOTE | Maker variant, firmware sprint active |
| `legal-evidence` | PROMOTE | Genesis Block is real, has legal basis docs |
| `kids-growth` | PROMOTE | In PLAN-KIDS-VIBE-CODING, real product intent |
| `mission-control` | MERGE → cockpit/ops | Ops page exists at /ops/ |
| `quantum-life-os` | ARCHIVE | Umbrella concept, not a standalone product |
| `qg-ide` | ARCHIVE | No implementation evidence |
| `sovereign` | MERGE → SOULSAFE or k4-personal | Concept absorbed into personal agent story |
| `bridge` | MERGE → connect or mesh | Concept, not standalone |
| `book` | ? | Need your call |
| `appointment-tracker` | ? | Need your call |
| `love-ledger` | ? | L.O.V.E. economy — PROMOTE or MERGE into wallet? |
| `medical-tracker` | ? | Calcium logging feature — MERGE into BONDING/cockpit? |
| `somatic-anchor` | ? | Need your call |
| `contact-locker` | ? | Need your call |
| `sleep-tracker` | ? | Need your call |
| `budget-tracker` | ? | Need your call |
| `simple-sovereignty` | ? | Need your call |
| `forge` | ? | Need your call |
| `prism` | ? | Need your call |
| `tether` | ? | Need your call |
| `echo` | ? | Need your call |
| `kinematics` | ? | Affective Chemistry spec? PROMOTE or research-only? |

**Action item:** Fill in the `?` rows with PROMOTE / ARCHIVE / MERGE before running the Composer prompt. This is a human decision — the agent shouldn't decide what your products are.

### Steps (after classification)

1. Update `COCKPIT_PRODUCT_IDS` in `build-landing-data.mjs` with PROMOTE list
2. For each PROMOTE: ensure `registry.mjs` has an entry (appUrl, description, related[])
3. For each ARCHIVE/MERGE: remove from `mvpData` in `legacy-mvp-hub.html`
4. Run `npm run hub:build` → regenerate `hub-landing.json`
5. Run `npm run hub:about:generate` → regenerate all about pages
6. Run `npm run verify` → must exit 0
7. Run `diff-index-sources.mjs` → should show NO warnings (or only the expected informational line)
8. Commit, push, deploy

### Definition of Done

- `diff-index-sources` produces zero warnings
- `npm run verify` exits 0
- Hub product count matches reality
- Every PROMOTE ID has a registry entry + about page
- No ARCHIVE/MERGE IDs remain in active hub data

### Composer Prompt (paste after filling in dispositions)

```
## Task: CWP-P31-PHASE-D Track A — ECO / Cockpit Grid Reconciliation

The hub has 22 IDs in legacy mvpData that are not on COCKPIT_PRODUCT_IDS. Here are the dispositions:

PROMOTE (add to cockpit + registry):
- [LIST YOUR PROMOTE IDs HERE]

ARCHIVE (remove from mvpData entirely):
- [LIST YOUR ARCHIVE IDs HERE]

MERGE (remove from mvpData, note in surviving product):
- [LIST YOUR MERGE IDs AND TARGETS HERE, e.g. "mission-control → ops page"]

### Steps

1. Open `04_SOFTWARE/p31ca/scripts/hub/build-landing-data.mjs`
   - Add each PROMOTE ID to `COCKPIT_PRODUCT_IDS`
   - Report the new total count

2. For each PROMOTE ID that lacks a registry entry:
   - Add to `scripts/hub/registry.mjs` with appUrl, description, and related[]
   - If the product has no public page yet, use appUrl: null and add a TODO comment

3. Open `04_SOFTWARE/p31ca/public/legacy-mvp-hub.html`
   - Remove all ARCHIVE and MERGE IDs from the mvpData array
   - For MERGE IDs, add a comment in the surviving product's registry entry noting what was merged

4. Regenerate:
   ```bash
   cd 04_SOFTWARE/p31ca
   npm run hub:build
   npm run hub:about:generate
   ```

5. Verify:
   ```bash
   npm run verify
   node scripts/diff-index-sources.mjs
   ```
   - verify must exit 0
   - diff-index-sources should produce no [warn] lines

6. If diff-index-sources still warns, report which IDs and why.

7. Do NOT commit yet — report the full diff summary so we can review before committing.

### Report
- New cockpit product count
- IDs added to registry (with appUrl)
- IDs removed from mvpData
- verify exit code
- diff-index-sources output (full)
```

---

## 3. Track B — Passkey E2E Identity Path

**Objective:** Wire the passkey/WebAuthn flow end-to-end: connect.html → passkey Worker → k4-personal subject_id. Remove the "CAGE WORKER PENDING" state.

**Why second:** Identity is the gate for personalization, per-user rooms, and education auth (Track C). Also the most visible "unfinished" story in the product — connect.html literally says PENDING.

**Estimated effort:** 1–2 days.

### Known State (from agent sessions and CWP-P31-PAR-2026-01)

- **k4-personal Worker** exists: personal K₄ API, SQLite DO, chat/history/state/reminders/energy/bio/tetra/manifest, GET /u/:userId/home, CORS
- **Passkey Worker** exists at `andromeda/04_SOFTWARE/cloudflare-worker/passkey/` — has wrangler.toml, source
- **p31ca** has `connect.html` with "CAGE WORKER PENDING" copy, `lib/p31-subject-id.js` with subject_id handling
- **planetary-onboard.html** Phase 5 is WebAuthn — blocked until passkey Worker is live
- **CWP-P31-PAR-2026-01** defines deliverables D-PA1 through D-PA9 covering the full scope
- Browser crypto: `crypto.subtle` for passkey, classical only (no PQC on the wire per SOP)

### Architecture (from existing docs)

```
User → connect.html → passkey Worker (WebAuthn registration/authentication)
                              ↓
                       subject_id issued
                              ↓
                  k4-personal Worker (personal room, SQLite DO)
                              ↓
                  p31ca surfaces (mesh-start, onboard, initial-build)
```

### Pre-work (discovery — let the agent do this)

The passkey Worker may or may not be deployment-ready. The Composer prompt below starts with an audit before attempting any wiring.

### Steps

1. Audit passkey Worker: source, wrangler.toml, dependencies, what endpoints exist
2. Deploy passkey Worker (if it builds clean)
3. Wire connect.html: replace PENDING state with live passkey registration/auth flow
4. Wire subject_id propagation: passkey → p31-subject-id.js → k4-personal
5. Update planetary-onboard.html Phase 5
6. Verify: ground-truth, e2e if tests exist, manual flow test
7. Deploy p31ca with updated connect.html

### Definition of Done

- Passkey Worker deployed and responding
- connect.html shows registration/auth UI (not PENDING)
- Subject_id flows from passkey to k4-personal
- `npm run verify` exits 0
- Ground-truth updated for new routes/contracts

### Composer Prompt

```
## Task: CWP-P31-PHASE-D Track B — Passkey E2E Audit + Wiring

### Phase 1: Audit (do this FIRST, report before changing anything)

1. Find the passkey Worker:
   ```bash
   find /home/p31/andromeda -path "*/passkey/wrangler.toml" -o -path "*/passkey/wrangler.jsonc" 2>/dev/null
   ```

2. Inspect it:
   ```bash
   cat <passkey-worker-dir>/wrangler.toml
   ls <passkey-worker-dir>/src/
   cat <passkey-worker-dir>/package.json
   ```
   Report: worker name, entry point, bindings (KV/DO/D1), routes if any.

3. Check if it builds:
   ```bash
   cd <passkey-worker-dir>
   npm install 2>&1 | tail -5
   npx wrangler deploy --dry-run 2>&1 | tail -20
   ```
   Report: does it build? Any missing bindings or config?

4. Audit connect.html for passkey references:
   ```bash
   grep -n "PENDING\|passkey\|webauthn\|CAGE\|subject_id\|p31-subject-id" /home/p31/andromeda/04_SOFTWARE/p31ca/public/connect.html
   ```

5. Audit p31-subject-id.js:
   ```bash
   cat /home/p31/andromeda/04_SOFTWARE/p31ca/src/lib/p31-subject-id.js 2>/dev/null || \
   find /home/p31/andromeda -name "p31-subject-id*" 2>/dev/null
   ```

6. Check CWP-P31-PAR-2026-01 deliverables:
   ```bash
   find /home/p31 -name "*CONTROLLED-WORK-PACKAGE-PERSONAL-AGENT*" -o -name "*CWP-31*" 2>/dev/null | head -5
   cat <found-path>/deliverables-matrix.json 2>/dev/null | head -40
   ```

### STOP HERE AND REPORT

Provide:
- Passkey Worker: location, name, bindings, build status (clean/broken)
- connect.html: current state of CAGE/PENDING references
- subject_id: current implementation state
- CWP-PAR deliverables: which are done (D-PA1 through D-PA9), which are open
- Your assessment: what's the minimum wiring needed to get passkey → subject_id → k4-personal working?

Do NOT deploy or modify any files until reporting. This is an audit phase.
```

**Note:** After the audit reports back, I'll generate the Phase 2 Composer prompt (deploy + wire) based on what the audit finds. The passkey Worker may need real code work, not just config.

---

## 4. Track C — E3+ Education Portal

**Objective:** Move education from static HTML (E0–E2, shipped in deploy sprint) to an authenticated portal with persistent student state.

**Why third:** Depends on auth (Track B passkey) and policy decisions. This is the track most likely to stall on decisions rather than code.

**Estimated effort:** 3–5 days of code, but gated on decisions that may take longer.

### Known State

- E0–E2 static shipped: discover pages, 3 tracks, 6 modules, 4 labs, curriculum.json, catalog.json
- E3 portal placeholder exists but explicitly not shipped
- `docs/PLAN-P31-LABS-EDUCATION-SITE.md` defines E3 scope
- Needs: auth (passkey/subject_id), D1 database (student progress), new Workers

### Policy Decisions Required (Will — before any code)

| Decision | Options | Implication |
|----------|---------|-------------|
| **Who holds student data?** | k4-personal DO per student / shared D1 / both | Architecture choice. DO = private-first. D1 = queryable. |
| **Auth mechanism** | Passkey only / passkey + magic link / open with optional passkey | Passkey-only is cleanest but excludes users without devices. |
| **Age gating** | COPPA considerations for kids < 13 | If S.J. and W.J. use it, this is real. Parental consent flow? |
| **Content licensing** | CC-BY-SA / proprietary / mixed | Affects what goes in catalog.json vs behind auth |
| **Progress persistence** | Local-first (IndexedDB) / edge (D1/DO) / both | Local-first is faster to ship and COPPA-simpler |

**Action item:** Answer these five questions before generating any E3 Composer prompt. Writing code before policy is how you get a rewrite.

### Steps (after policy decisions)

1. Design the data model (student record schema, progress events)
2. Create or extend the Worker (likely k4-personal or a new education-specific Worker)
3. Build the auth gate on E3 pages (passkey flow from Track B)
4. Build progress tracking UI (modules → labs → completion)
5. Wire D1 or DO for persistence
6. Verify: security:check, e2e, manual student flow
7. Deploy

### Definition of Done

- E3 portal loads behind auth
- Student can register, complete a module, see progress persisted
- Progress survives browser close (edge persistence, not just localStorage)
- COPPA compliance documented (even if "not applicable" — document why)
- `npm run verify` + `security:check` pass
- Curriculum.json and catalog.json updated for E3 content

### Composer Prompt

**Not generated yet.** This prompt depends on:
1. Track B (passkey) being complete
2. Policy decisions above being answered

When both are done, say "Composer prompt for E3" and I'll generate it with the right architecture baked in.

---

## 5. Track D — Node Zero Firmware

**Objective:** Get Node Zero firmware to a stable display + touch + audio state on the Waveshare ESP32-S3-Touch-LCD-3.5B.

**Why parallel:** Different repo, different toolchain (ESP-IDF, C/C++, LVGL), different hardware. Zero shared files with Tracks A–C. Run this when you're in firmware brain mode — early morning flow blocks are ideal.

**Estimated effort:** Ongoing (firmware is iterative), but the immediate milestone is: display renders, touch works, audio plays.

### Known State

- Hardware: Waveshare ESP32-S3-Touch-LCD-3.5B, AXS15231B QSPI display
- Toolchain: ESP-IDF 5.5.3, LVGL 8.4
- Root cause of initial crash: missing `lv_init()` before `lv_disp_drv_register()` — FIXED
- Agent: KwaiPilot tagged for firmware execution (Triad allocation: 4%)
- WCDs: FW01–FW03 exist for KwaiPilot

### Milestones

| Milestone | Description | Verify |
|-----------|-------------|--------|
| **NZ-01: Display** | LVGL renders a test screen on AXS15231B | Visual confirmation + boot log |
| **NZ-02: Touch** | I2C touch input registers on display | Touch event logged to serial |
| **NZ-03: Audio** | ES8311 codec plays a test tone | Audible confirmation |
| **NZ-04: Integration** | Display + touch + audio work together in one firmware | Combined boot test |
| **NZ-05: P31 UI** | LVGL renders P31 branding (K₄ tetrahedron, 863 Hz reference) | Visual confirmation |

### Composer Prompt (for KwaiPilot or firmware-mode agent)

```
## Task: Node Zero Firmware — Milestone NZ-01 (Display)

Hardware: Waveshare ESP32-S3-Touch-LCD-3.5B
Display: AXS15231B QSPI
Toolchain: ESP-IDF 5.5.3 + LVGL 8.4

### Context
The previous crash was caused by missing lv_init() before lv_disp_drv_register().
That is fixed. The next step is confirming the display renders correctly.

### Steps

1. Locate the firmware source:
   ```bash
   find /home/p31 -name "sdkconfig" -path "*node*zero*" 2>/dev/null | head -5
   find /home/p31 -name "CMakeLists.txt" -path "*node*zero*" 2>/dev/null | head -5
   ```

2. Inspect the display driver config:
   - Check `lv_conf.h` for display resolution, color depth, buffer size
   - Check QSPI pin configuration matches Waveshare datasheet
   - Check `lv_init()` is called before any display driver registration

3. Build:
   ```bash
   cd <firmware-dir>
   idf.py build 2>&1 | tail -30
   ```
   Report: build success/fail, binary size, any warnings

4. If build succeeds, report the flash command (do NOT flash — that's a human step):
   ```bash
   idf.py -p /dev/ttyUSB0 flash monitor
   ```

### Report
- Firmware source location
- Display config: resolution, color depth, QSPI pins
- Build result
- Any warnings or known issues
- Flash command for Will to run manually
```

**Note:** Firmware work happens on the physical device. The Composer agent can build and diagnose, but flashing and visual confirmation require Will at the Chromebook with the board connected.

---

## 6. Sprint Calendar

Assuming Deep Work blocks per the Buffer Schedule (9:30–12:00 and 2:30–4:30):

| Week | Deep Work 1 (AM) | Deep Work 2 (PM) | Gate |
|------|------------------|-------------------|------|
| **Week 1, Days 1–2** | Track A: ECO/cockpit | Track D: Node Zero (if hardware available) | A done → diff-index clean |
| **Week 1, Days 3–5** | Track B: Passkey audit + deploy | Track B: connect.html wiring | B audit complete |
| **Week 2, Days 1–2** | Track B: subject_id + k4-personal | Track B: verify + deploy | B done → identity live |
| **Week 2, Days 3–5** | Track C: policy decisions + data model | Track C: Worker + auth gate | C decisions made |
| **Week 3, Days 1–3** | Track C: progress UI + persistence | Track C: verify + deploy | C done → education live |

Track D (Node Zero) fills PM blocks whenever hardware is plugged in and the AM track doesn't overflow. It's the release valve — different brain mode, different repo, no merge risk.

---

## 7. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| ECO dispositions take too long (Will can't decide) | Medium | Blocks A, delays everything | Timebox to 30 min. If unsure, ARCHIVE — you can always PROMOTE later. |
| Passkey Worker has breaking issues | Medium | Blocks B and C | Audit phase catches this before committing to wiring. Fallback: local-first subject_id (no edge auth) as interim. |
| E3 policy decisions stall | High | Blocks C indefinitely | Separate policy decisions from code. Answer the 5 questions in a doc, then code is straightforward. |
| Branch protection blocks merges | High (proven) | Delays every deploy | Admin-merge or fix ruleset check names (same pattern as #59/#60). |
| Node Zero hardware not available | Medium | Blocks D | D is parallel and optional — no downstream impact. |
| Scope creep from "whole pie" framing | High | Sprint never ends | Each track has explicit DoD. Track is CLOSED when DoD is met, not when it's "perfect." |

---

## 8. Program Checklist

```
TRACK A — ECO / COCKPIT
[ ] Dispositions decided (Will: PROMOTE / ARCHIVE / MERGE for 22 IDs)
[ ] COCKPIT_PRODUCT_IDS updated
[ ] Registry entries created for PROMOTE IDs
[ ] Legacy mvpData cleaned
[ ] hub:build + hub:about:generate
[ ] npm run verify → exit 0
[ ] diff-index-sources → no warnings
[ ] Committed + pushed + deployed

TRACK B — PASSKEY E2E
[ ] Passkey Worker audited (location, bindings, build status)
[ ] Passkey Worker deployed
[ ] connect.html: PENDING removed, live auth UI
[ ] subject_id flows passkey → p31-subject-id.js → k4-personal
[ ] planetary-onboard Phase 5 updated
[ ] npm run verify → exit 0
[ ] Ground-truth updated
[ ] Committed + pushed + deployed

TRACK C — E3+ EDUCATION
[ ] Policy decisions answered (5 questions)
[ ] Data model designed
[ ] Worker created/extended
[ ] Auth gate on E3 pages
[ ] Progress tracking UI
[ ] Persistence wired (D1/DO)
[ ] security:check passes
[ ] npm run verify → exit 0
[ ] Committed + pushed + deployed

TRACK D — NODE ZERO FIRMWARE
[ ] NZ-01: Display renders
[ ] NZ-02: Touch input works
[ ] NZ-03: Audio plays
[ ] NZ-04: Integration test
[ ] NZ-05: P31 UI branding
```

---

## 9. Closure

**Closed by:** _______________  
**Date:** _______________  
**Tracks completed:** A [ ] B [ ] C [ ] D [ ]  
**Final hub product count:** ___  
**All production URLs green:** [ ] Yes / [ ] No  
**Glass probe count:** ___ up / ___ skip  
**Next program:** _______________  

---

*CWP-P31-PHASE-D-2026-01 — Product Completion Program*  
*"The whole pie. One slice at a time. Every slice verified before the next."*
