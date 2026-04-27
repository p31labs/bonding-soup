# CWP-01 — Education E3+ portal (gated)

**Id:** `P31-CONVERGE-01-EDU-E3`  
**Status:** OPEN — **P0 policy skeleton** in `docs/EDU-E3-POLICY-2026-01.md` (fill decisions to unblock code)  
**Normative plan:** `docs/PLAN-P31-LABS-EDUCATION-SITE.md` (E0–E2 shipped)

## Objective

Ship **E3+**: authenticated learner flow + persistent progress where policy allows, reusing `workers/passkey/` and static `/education/*` for public read.

## In scope

- Policy freeze doc (`docs/EDU-E3-POLICY-*.md` or ADR): COPPA-style posture, data location, auth path, PII fields, v1 acceptance.
- Route + Worker design: new bindings → `security/worker-allowlist.json`, `ground-truth` or alignment rows.
- Portal UI: `/education/portal/*` (or agreed paths); same-origin passkey; no long-lived secrets in static HTML.
- D1/DO (or local-first) per policy; rate limits; no wildcard credentialed CORS on auth.

## Out of scope (v1)

- Full LMS, third-party learning cloud, training on user content, Stripe inside curriculum pages (use MAP/donate path).

## Phases

| Phase | Output |
|-------|--------|
| P0 | Policy doc merged — **`docs/EDU-E3-POLICY-2026-01.md`** (5 decisions filled + sign-off) |
| P1 | ADR: routes, Worker name, schema sketch |
| P2 | Worker + health; allowlist; wrangler dry-run in CI |
| P3 | Portal shell + one happy-path progress write/read |
| P4 | `security:check`, e2e if added, `release:public` when hub touches |

## Dependencies

- **Requires:** passkey route live; `p31-constants` `mesh.passkeyApiBasePath` correct.
- **Blocks:** nothing upstream for *policy writing*; code blocks on P0.

## Production convergence

- [ ] `docs/PLAN-P31-LABS-EDUCATION-SITE.md` E3 section updated to match ship.
- [ ] `npm run verify:education` (p31ca) + `verify:ground-truth` if routes added.
- [ ] `npm run security:check` in p31ca with new Worker row.
- [ ] `npm run deploy` p31ca after verify.
- [ ] `GET /education/portal/` (or final path) **200/302** to auth as designed; public catalog still 200.
- [ ] `p31-alignment.json` derivation row if new source files.

**Parallel:** 02, 05, 06, 10.
