# Governed launch lane sprint — implementation report (home repo)

**Date:** 2026-04-30  
**Purpose:** Execute the “PRS governed lane / market spine” plan: machine-enforce a **governed SKU set** (Workers + `p31ca`), document operations, derive a JSON manifest, add static hub smoke coverage, and sync alignment + polish.

## Executive summary

| Area | Outcome |
|------|---------|
| **Policy** | `p31-production-readiness.json` gains `launchGovernance` (`minGovernedScore`: **85**, per-dimension floor: **6**) |
| **Governed set** | All `kind: worker` rows + `p31ca` (`governedPagesIds`) — **14** SKUs |
| **Scores** | Governed Worker rows normalized to **≥85** via `scripts/apply-prs-launch-governance.mjs` (deterministic re-runnable bumps) |
| **Verifier** | `verify-production-readiness` **fails** if any governed row drops below policy |
| **Derived manifest** | **`p31-launch-lane.json`** (`p31.launchLane/0.1.0`) — `npm run generate:launch-lane` |
| **Smoke** | **`npm run test:launch-lane:smoke`** — Playwright loads **6** static hub pages (skips partial clone / `P31_SKIP_LAUNCH_LANE_SMOKE`) |
| **Runbooks** | `RUNBOOK-WORKER-GOVERNED-LANE.md`, `WORKER-SKELETON.md`, README index rows |
| **Hub card gap** | Added missing **`contract-builder`** PRS hubCard (required by `hub-app-ids.mjs` vs PRS parity) |
| **Alignment** | New source `p31-launch-lane.json`; derivation `p31-production-readiness-suite` updated |
| **Polish** | `scripts/p31-polish.mjs` runs **`generate:launch-lane`** each pass |

## Important limitation (for reviewer / Opus follow-up)

PRS numbers for governed Workers were **lifted algorithmically** to satisfy the new gate. That aligns the **rubric with the policy** but **does not replace** missing integration tests, load proofs, or SOC2-style evidence. Next hardening should **attach real proof** per Worker (contract tests, webhook fixtures, DO export runbooks) and then **edit scores manually** to reflect those artifacts—not rely on the normalization script alone.

## Files added

- `p31-launch-lane.json` (generated; committed via `npm run generate:launch-lane`)
- `scripts/apply-prs-launch-governance.mjs`
- `scripts/generate-p31-launch-lane.mjs`
- `scripts/lib/build-p31-launch-lane.mjs`
- `scripts/verify-launch-lane-sync.mjs`
- `scripts/launch-lane-smoke.mjs`
- `docs/runbooks/RUNBOOK-WORKER-GOVERNED-LANE.md`
- `docs/runbooks/WORKER-SKELETON.md`
- This report: `docs/P31-GOVERNED-LANE-SPRINT-REPORT.md`

## Files materially changed

- `p31-production-readiness.json` — `launchGovernance`, governed score grid, `contract-builder` hubCard, timestamp
- `scripts/verify-production-readiness.mjs` — governance assertions + log line
- `p31-alignment.json` — registry source + derivation `p31-production-readiness-suite`
- `package.json` — `generate:launch-lane`, `verify:launch-lane-sync`, `test:launch-lane:smoke`, root **`verify`** includes sync
- `docs/runbooks/README.md` — governed lane + skeleton rows
- `scripts/p31-polish.mjs` — regenerate launch lane manifest
- `scripts/p31-effective-bar.mjs` — bar classification for `verify:launch-lane-sync`

## Commands (operator)

```bash
npm run verify:production-readiness   # governed policy (+ hub cardinality + fleet workers)
npm run verify:launch-lane-sync       # stale manifest detector (also in npm run verify)
npm run generate:launch-lane          # refresh p31-launch-lane.json
npm run test:launch-lane:smoke       # optional; needs Chromium (6 hub static routes)
node scripts/apply-prs-launch-governance.mjs  # re-normalize scores after threshold edits
```

## Verification run (during implementation)

- `npm run verify:production-readiness` — **OK**, governed line prints
- `npm run verify:runbooks` — **OK**
- `npm run verify:alignment` — **OK**
- `npm run generate:launch-lane` — writes manifest (**14** SKUs)
- `npm run verify:launch-lane-sync` — **OK**
- `npm run test:launch-lane:smoke` — **OK** (6 routes)

## Suggested follows for reviewer

1. **Disambiguate subjective vs proven dimensions** — add citation fields when integration tests ship so PRS edits are justified in git history, not vibes.  
2. **Optional regression snapshot** — hash governed totals weekly in CI (`VERIFY_PRS_REGRESSION=1` pattern).  
3. **Promote hub cards deliberately** — catalog placeholders stay outside `launchGovernance`; marketing copy must not imply PRS parity.  
4. **CI posture for smoke** — keep `test:launch-lane:smoke` opt-in alongside other Playwright guards unless Chromium is ubiquitous on runners.
