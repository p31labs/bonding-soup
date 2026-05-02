# P31 Nonprofit Operations · Master Index

**Schema:** `p31.nonprofit.operations/1.0.0`
**Last updated:** 2026-05-01
**Owner:** `operator@phosphorus31.org`

This is the single navigation point for everything operational about P31 Labs, Inc.
Each ground-truth contract is the canonical source; runbooks tell you what to *do* with it; automation scripts execute the routine work.

---

## Why this exists

P31 Labs intends to scale to a meaningful nonprofit. At meaningful scale, operational friction compounds. The cost of *not* having the scaffolding is paid every week the org grows without it: missed filings, donor trust erosion, board paralysis, mission drift.

This system was built **before** the friction. Better to have it and not need it than the other way around. Every contract here is in canonical form so any future board member, agent, or successor can pick up where the founder left off.

---

## The seven canonical contracts

All live under `andromeda/04_SOFTWARE/p31ca/ground-truth/nonprofit/`:

| Contract | What it governs | Schema |
|---|---|---|
| `governance.json` | Board, officers, COI, meetings, document retention, succession | `p31.nonprofit.governance/1.0.0` |
| `compliance.json` | Federal 990, 41-state charitable solicitation, filing calendar | `p31.nonprofit.compliance/1.0.0` |
| `financials.json` | Chart of accounts, expense ratios, fund accounting, audit | `p31.nonprofit.financials/1.0.0` |
| `donor-policy.json` | Gift acceptance, receipts, refunds, stewardship, ethical screening | `p31.nonprofit.donorPolicy/1.0.0` |
| `programs.json` | Mission, theory of change, program portfolio, KPIs, impact | `p31.nonprofit.programs/1.0.0` |
| `grants.json` | Pipeline, candidate funders, post-award discipline | `p31.nonprofit.grants/1.0.0` |
| `legal.json` | IP, trademarks, contracts, privacy, terms, regulatory | `p31.nonprofit.legal/1.0.0` |
| `risk.json` | Risk register (9 risks), incident response, BCP, insurance | `p31.nonprofit.risk/1.0.0` |
| `people.json` | Roles, current roster, open positions, onboarding/offboarding | `p31.nonprofit.people/1.0.0` |

Edit the JSON; the runbooks and public surfaces follow.

---

## Critical-path gaps (right now)

Updated 2026-05-01: Form 1023 filed, GA state-level 501 approved, Treasurer + Secretary seats filled. Three of the original seven gaps are closed. Remaining gaps in dependency order:

1. **Vice-Chair seat** (`people.json` → `openPositions[vice-chair-001]`) — blocks succession plan activation. With Treasurer + Secretary seated, this is now the *last* P0 governance gap.
2. **Banking** (`financials.json` → `bankingAndPayments.primaryBank`) — HCB unresponsive; needs alternative. Without this, no Stripe verification, no donations land.
3. **D&O insurance** (`risk.json` → `insurance.neededPolicies[0]`) — should be in force before any non-family director joins. Estimated $800/year, $1M coverage.
4. **GA charitable solicitation registration** (`compliance.json` → `state.charitableSolicitation` → GA row) — $35; required before soliciting from GA residents.
5. **Independent director recruitment** (`people.json` → `openPositions[independent-director-001]`) — P1 priority; current board has 2 family members (founder + mom) plus Tyler. Form 990 governance section + future-audit independence ratio benefit from at least one fully-independent director.
6. **Board-adopted policies still pending** (`governance.json` → `policies.pending`):
   - whistleblower
   - document-retention (drafted in canon; needs board adoption)
   - gift-acceptance (drafted in `donor-policy.json`; needs board adoption)
   - executive-compensation-review
   - code-of-ethics
7. **Operator confirmations needed** (TBD entries in canon):
   - `governance.json` `entity.irsApplicationFiledDate` + `stateNonprofitApprovedDate`
   - `governance.json` `currentMembers` legal names for mom-001 and tyler-001
   - `people.json` `currentRoster` join dates
   - `compliance.json` `federal.form1023.filedDate`
   - Confirm whether Tyler is independent (family/business relationship to founder)
   - Confirm whether mom-001 default Treasurer / tyler-001 default Secretary assignment matches their preferences (swap by editing both `governance.json` `officers.current` and `people.json` `currentRoster.roles[]`)

---

## Filing calendar

Generated mechanically from `compliance.json`. Run `npm run nonprofit:calendar` for the live list. As of 2026-05-01:

| Date | Type | Action | Owner |
|---|---|---|---|
| 2026-12-31 | fiscal year-end | Close books | Treasurer |
| 2027-01-31 | 1099-MISC | Issue if any contractors >= $600 | Treasurer (conditional) |
| 2027-04-01 | GA annual registration | File with SOS, $30 fee | Secretary |
| 2027-04-03 | Annual COI attestation | All board members re-sign | Secretary |
| 2027-04-03 | Annual board meeting | Schedule + 14-day notice | Secretary |
| 2027-05-15 | Form 990-N (e-postcard) | File | Treasurer |

State charitable solicitation renewals layer in once each is registered. Calendar updates per state on each registration.

---

## Runbooks

Step-by-step operator procedures. Each one assumes spoon-deficit: terminal output sufficient.

| Runbook | When to use | Path |
|---|---|---|
| Board meeting | Quarterly + annual + special | `docs/runbooks/nonprofit/board-meeting.md` |
| Donor receipt | New donation; Jan 31 batch | `docs/runbooks/nonprofit/donor-receipt.md` |
| Grant application | New funder pursued | `docs/runbooks/nonprofit/grant-application.md` |
| Incident response | P0–P3 trigger | `docs/runbooks/nonprofit/incident-response.md` |
| Filing calendar | Monthly review | `docs/runbooks/nonprofit/filing-calendar.md` |
| Onboarding | New board / staff / contractor | `docs/runbooks/nonprofit/onboarding.md` |

---

## Automation

Run from the workspace root.

| Command | What it does |
|---|---|
| `npm run nonprofit:calendar` | Render upcoming filing deadlines (next 365 days) |
| `npm run nonprofit:receipt` | Generate a tax-deductible donation receipt |
| `npm run nonprofit:report` | Assemble annual impact report from canonical sources |
| `npm run nonprofit:status` | One-screen ops dashboard (gaps, deadlines, pipeline) |
| `npm run verify:nonprofit` | Schema + cross-reference check on all contracts |

---

## Verification

`npm run verify:nonprofit` (also runs as part of `npm run verify`) checks:

- Every JSON validates against its declared schema
- Every cross-reference resolves (e.g., `people.json` officer ID exists in `governance.json`)
- Every state in `compliance.json` `state.charitableSolicitation.tracker` is a real US state code
- Every program in `programs.json` has a `publicSurface` URL
- Every risk in `risk.json` has a mitigation entry
- Filing calendar entries are sorted and have non-past dates (or marked `filed: true`)

---

## Operator-friendly summary

> If you're reading this and feeling overwhelmed: you don't have to do all of this today.
> The contracts are the map; the runbooks are the path; the automation is the vehicle.
> Use `npm run nonprofit:status` to see what is *actually* due in the next 30 days.
> Everything else is for the future-you (or future-board-member) who will need it.
> The point of the scaffolding is that it's there *when* you need it, not that you use it now.

---

## How to extend

When the org needs a new operational concern (e.g., "how do we handle international donors"):

1. **Identify which contract owns it** — usually `donor-policy.json` or `compliance.json`
2. **Edit the JSON** with the new policy/data
3. **Document** the *what* and *why* in the relevant runbook
4. **Add to alignment registry** (`p31-alignment.json`) if the change spans contracts
5. **Run `npm run verify:nonprofit`** to catch broken cross-refs
6. **Commit** as a single change so reviewers see the full picture

---

## Cross-references to other P31 systems

- **Engineering ship bar** — `verify:nonprofit` is on the same bar as `verify:alignment`
- **Stylebook** — public-facing surfaces (`/governance/`, `/financials/`, `/impact/`) follow stylebook tokens
- **Voice & tone** — donor receipts, grant applications, public reports use `docs/PUBLIC-VOICE.md` rules
- **Alignment registry** — every contract here has a registered source ID + verification edge in `p31-alignment.json`
- **Cognitive passport** — board-member onboarding can include passport practice (operator dogfood)

---

## Mission lock

This entire system is structurally biased *against* mission drift. The principles encoded in `programs.json` `mission.values` are intentionally hard to change:

- Material mission changes require board supermajority + 60-day public-comment period
- AGPL licensing on hub products discourages enterprise extraction
- Donor-policy ethical screening can decline misaligned major gifts
- Board recruitment targets explicitly include lived-experience over pedigree

When future board members or donors push toward "let's pivot to enterprise SaaS," the canon will tell you why we don't.
