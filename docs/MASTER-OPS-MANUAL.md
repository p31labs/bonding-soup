# Master Ops Manual — Registry Pointer
**Canonical source:** `p31-constants.json`

This document serves as a pointer to the single source of truth for all operator-locked numbers, public URLs, schema IDs, and organizational identifiers.

## Single Source of Truth

**File:** `/home/p31/p31-constants.json`

All operational constants are maintained in this file. After any edit:
```bash
npm run apply:constants   # Propagate to derived files
npm run verify:constants  # Validate alignment
```

## Current Critical Identifiers (2026-04-30)

| Category | Key | Value | Notes |
|----------|-----|-------|-------|
| Organization | Legal name | P31 Labs, Inc. | Georgia nonprofit corporation |
| Organization | EIN | 42-1888158 | Assigned 2026-04-13 |
| Organization | Incorporation date | 2026-04-03 | Georgia Secretary of State |
| Tax status | 501(c)(3) | filed_pending_irs | Form 1023-EZ filed 2026-04-30 |
| Tax status | Pay.gov Tracking ID | 281TLBGO | $275 fee paid |
| Tax status | Agency Tracking ID | 77374172589 | IRS processing |
| SAM | UEI | NQKVWH6AKB58 | Assigned 2026-04-30 |
| Research | ORCID (Operator) | 0009-0002-2492-9079 | |
| Bonding | Test baseline | 424 tests, 32 suites | as of 2026-04-30 |
| Physics | Larmor frequency | 863 Hz | ³¹P in Earth's magnetic field |
| Cognitive Passport | Edition | 5.1 | Long form |
| Cognitive Passport | Schema | p31.cognitivePassport/1.0.0 | |
| Ground Truth | Schema | p31.ground-truth/1.0.0 | |

See `p31-constants.json` for full structure (organization, contact, payment, bonding, physics, cognitivePassport, groundTruth, edge, mesh, research, operations, documentation, integrations).

## Derived Artifacts

`npm run apply:constants` writes:
- `andromeda/04_SOFTWARE/p31ca/ground-truth/p31.ground-truth.json`
- `andromeda/04_SOFTWARE/p31ca/src/data/p31-mesh-constants.json`
- `andromeda/04_SOFTWARE/p31ca/public/p31-mesh-constants.json`
- `andromeda/04_SOFTWARE/p31ca/src/data/p31-integrations.json`
- `andromeda/04_SOFTWARE/p31ca/public/p31-integrations.json`
- `andromeda/04_SOFTWARE/p31ca/public/dev-workbench.html`
- `cognitive-passport/index.html`
- `src/p31-constants-generated.ts`

## Filing Records

501(c)(3) application artifacts are stored in:
- `docs/501c3-filing/FILING-CONFIRMATION.md` — comprehensive filing package summary
- `docs/501c3-filing/emails/` — prepared outreach correspondence
- Confirmation PDFs (to be saved): Pay.gov `281TLBGO`, SAM UEI `NQKVWH6AKB58`

## Update Workflow

1. Edit `p31-constants.json`
2. Run `npm run apply:constants`
3. Run `npm run verify:constants` (must pass)
4. Commit with message referencing affected system (e.g., "update organization status501c3 filed_pending_irs")
5. For tax status changes: also update `docs/501c3-filing/FILING-CONFIRMATION.md`
6. For UEI changes: also update grant application templates in `docs/grants/`

## Verification Commands

| Command | Purpose |
|---------|---------|
| `npm run verify:constants` | Cross-check all generated files against source |
| `npm run verify` | Full pipeline including constants check |
| `npm run polish` | apply:constants + build:fleet-portal + doc-library sync + release:local |

## Last Updated

2026-04-30 — Added 501(c)(3) filed status (Pay.gov 281TLBGO, Agency 77374172589), SAM UEI NQKVWH6AKB58.
