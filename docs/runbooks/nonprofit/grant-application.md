# Grant Application Runbook

**When to use:** new funder added to active pipeline.
**Owner:** Operator (until development staff hired).
**Pre-requisite reading:** `grants.json`, `programs.json`, `financials.json`.

---

## Stage 1 — Researching (week 0)

```bash
# 1. Add candidate funder to grants.json activePipeline
# Fields: name, fit, estimatedAmount, deadline, contact, requirements

# 2. Verify fit against grants.json fitCriteria.mustHave
# Automatic decline if any "automaticDecline" criterion triggered
```

**Checklist:**
- [ ] Read funder's most recent IRS Form 990 (Schedule I) — what do they actually fund?
- [ ] Identify program officer (if accessible) — name + role
- [ ] Pull 3 examples of funded projects with similar size/scope
- [ ] Confirm current funding cycle, deadline, and submission portal
- [ ] Confirm whether LOI required before full proposal

## Stage 2 — Drafting (weeks 1–4)

If LOI required, draft LOI first (1–3 pages):
- Mission summary (from `programs.json` mission.statement)
- Specific program/project being funded
- Amount requested + use of funds
- Theory of change excerpt
- Why this funder, this project, this moment

For full proposal, use template at `/scripts/nonprofit/templates/grant-proposal.md`. Standard sections:

1. **Executive summary** (1 page max)
2. **Organization background** (founder story, lived-experience-led, current scale)
3. **Statement of need** (problem your funded work addresses)
4. **Project description** (specific deliverables, timeline)
5. **Theory of change / logic model** (`programs.json` `theoryOfChange` adapted)
6. **Outcomes + measurement** (KPIs from `programs.json`)
7. **Sustainability** (what happens after grant period)
8. **Budget + budget narrative** (use template at `/scripts/nonprofit/templates/grant-budget.json`)
9. **Organization financials** (last completed year + current year forecast)
10. **Board roster + key staff bios**
11. **Letters of support** (allied organizations, beneficiaries with consent)

**Voice check:** before submission, run through `docs/PUBLIC-VOICE.md` rules. No hype words, no FOMO, no manufactured urgency.

## Stage 3 — Submission

```bash
# Update grants.json
# Move funder from "activePipeline" to "submitted"
# Record: submission date, amount requested, decision-expected date
```

**Pre-submission checklist:**
- [ ] All required documents attached
- [ ] Word/page counts respected (over-limit submissions rejected)
- [ ] Budget reconciles (line items sum to total)
- [ ] Contact information correct (program officer's preferred email/phone)
- [ ] Org legal name + EIN match exactly
- [ ] If pending 501(c)(3) — disclose status; offer fiscal sponsor option if funder requires

## Stage 4 — Awaiting decision

Decision SLAs vary; typical 6 weeks (small foundations) to 6 months (large foundations).

- **Do not** follow up before stated decision date unless the funder invites it
- **Do** prepare contingency plan: if denied, what's the next funder + when do you apply

## Stage 5 — Award

```bash
# Move funder from "submitted" to "awarded" in grants.json
# Within 30 days: kickoff meeting + tracker setup
```

**Post-award discipline** (`grants.json` `postAwardDiscipline`):
- [ ] Restricted-fund account set up in `financials.json` if grant is project-restricted
- [ ] Deliverable tracker created (each deliverable + due date + owner)
- [ ] Internal report draft deadlines set 30 days before funder deadlines
- [ ] Burn-rate alerts configured (monthly check; flag if >15% deviation)
- [ ] Scope-change protocol acknowledged (any deviation > $1000 or > 10% requires funder approval)

## Stage 6 — Reporting + closeout

Interim and final reports use template at `/scripts/nonprofit/templates/interim-report.md`.

Required content (varies by funder):
- Activities completed in reporting period
- Outcomes achieved (quantitative + qualitative)
- Budget actuals vs. plan
- Challenges + adjustments
- Lessons learned
- Plan for next period (or sustainability plan for final)

## Stage 7 — Rejection

```bash
# Move funder from "submitted" to "rejected"
# Record: feedback received (if any), date, reason
```

**Always:**
- Send a thank-you to the program officer (relationship-preserving)
- Ask for feedback if not provided (briefly, once, no pressure)
- Add learnings to internal "lessons" file
- Don't re-apply within the funder's exclusion period (typically 12 months)

## Ethical rejections (we decline an award)

```bash
# Move funder to grants.json ethicalConsiderations.fundingDeclines.log
# Record: rationale, board decision date, public summary (if appropriate)
```

We document declines publicly (anonymized when funder requires) so peer organizations have shared reference. See `donor-policy.json` `ethicalScreening`.

## Cross-references

- `grants.json` — pipeline state
- `programs.json` — theory of change source language
- `financials.json` — restricted-fund accounting hooks
- `legal.json` — IP/license terms in funded work (AGPL by default)
- Templates: `/scripts/nonprofit/templates/`
