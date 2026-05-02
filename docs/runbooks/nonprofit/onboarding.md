# Onboarding Runbook

**When to use:** new board member, staff, contractor, or volunteer joining.
**Owner:** Secretary (board) / Operator (staff/contractor) / Volunteer Coordinator (when seated).
**Pre-requisite reading:** `people.json` → `onboarding`, role-specific section.

---

## Common to all roles

```bash
# 1. Identity verification (varies by role)
# 2. Code-of-ethics acknowledgment (signed)
# 3. Confidentiality agreement (signed)
# 4. Add to relevant communication channels
# 5. Welcome packet (mission, programs, current state)
# 6. Schedule check-in at 30/60/90 days
```

---

## Board member onboarding

**Within 7 days of election:**

- [ ] Conflict-of-interest disclosure form signed + dated
- [ ] Confidentiality acknowledgment signed
- [ ] D&O insurance certificate provided (when policy in force)
- [ ] Bylaws + governance.json read
- [ ] Last 4 quarters of board minutes shared
- [ ] Form 990 (most recent year) shared
- [ ] Mission + programs.json walkthrough (30-min call with Chair)
- [ ] Add to:
  - [ ] Board email list
  - [ ] Board meeting calendar
  - [ ] Shared board docs folder (read-only access)
- [ ] Update `governance.json` `board.currentMembers[]`
- [ ] Update `people.json` `currentRoster[]`
- [ ] Public announcement (with consent): website + announcement email

**At 30 days:**

- [ ] First board meeting attended
- [ ] Q&A session with Chair
- [ ] Operator state-of-org briefing (60 min)

**At 90 days:**

- [ ] Self-assessment of fit + capacity
- [ ] Honest conversation: should I stay? if so, what's my contribution focus?

---

## Staff (W-2 employee) onboarding

**Day 0 (offer accepted):**

- [ ] Offer letter signed (with start date, salary, benefits)
- [ ] I-9 form completed (with eligibility documents reviewed in person or via authorized E-Verify)
- [ ] W-4 form completed
- [ ] State-equivalent withholding form (GA-V4 or comparable)
- [ ] Direct deposit authorization
- [ ] Emergency contact form
- [ ] Benefits enrollment (when offered)

**Week 1:**

- [ ] Code-of-ethics acknowledgment
- [ ] Confidentiality / NDA signed
- [ ] DPA signed if accessing donor or beneficiary data
- [ ] Equipment provisioned (laptop, accounts, accommodations)
- [ ] Access to:
  - [ ] Email
  - [ ] Cloudflare account (read or write per role)
  - [ ] GitHub org (read or write per role)
  - [ ] Shared password vault (entries scoped to role)
  - [ ] Stripe (read-only unless treasurer)
- [ ] First-day welcome session with Operator
- [ ] Org chart shown; reporting line confirmed

**Week 1–4:**

- [ ] Programs.json walkthrough
- [ ] Risk register walkthrough (`risk.json`)
- [ ] Voice & tone briefing (`docs/PUBLIC-VOICE.md`)
- [ ] Stylebook walkthrough if doing public-surface work
- [ ] Cognitive passport (the dogfood — read or generate own)

**Day 30 / 60 / 90:**

- [ ] Check-in: what's working, what's not, what's missing
- [ ] Adjust onboarding for next hire based on feedback

---

## Contractor (1099) onboarding

**Day 0:**

- [ ] Contractor agreement signed (template at `/scripts/nonprofit/templates/contracts/contractor-1099.md`)
- [ ] W-9 form on file
- [ ] Scope of work document with deliverable + payment milestones
- [ ] Code-of-ethics acknowledgment

**Day 0 (continued):**

- [ ] DPA signed if accessing sensitive data
- [ ] Access provisioned (scoped narrowly to deliverables)

**During engagement:**

- [ ] Milestone payments per agreement
- [ ] Document any scope changes in writing (amendment)

**On engagement end:**

- [ ] Final deliverables received + accepted
- [ ] Final payment processed
- [ ] Access revoked
- [ ] Knowledge transfer documented
- [ ] If 1099-NEC threshold ($600/year) crossed: file by January 31

---

## Volunteer onboarding

**Day 0:**

- [ ] Volunteer agreement signed
- [ ] Code-of-ethics acknowledgment
- [ ] Background check if working with vulnerable populations (children, donors-as-individuals)
- [ ] Role-specific training materials provided

**Ongoing:**

- [ ] Time tracking (if grant-required for in-kind reporting)
- [ ] Quarterly check-in
- [ ] Recognition (per `donor-policy.json` recognition tiers — volunteers are gift-of-time donors)

---

## Advisor onboarding

**Day 0:**

- [ ] Advisor agreement (lighter than contractor; no fiduciary duty)
- [ ] Confidentiality agreement
- [ ] Mission + current state briefing (30 min)

**Ongoing:**

- [ ] Quarterly informal touch-in
- [ ] Public listing on /team page if comfortable

---

## Founder / officer onboarding

When founder steps into a new officer role, or when a new officer joins:

```bash
# Update governance.json officers.current
# If new person:
#   - Full board onboarding (above) PLUS
#   - Officer-specific onboarding for the role:
#     - Treasurer: financials.json walkthrough, banking access, Stripe access
#     - Secretary: governance.json walkthrough, document-retention practice, minutes templates
#     - President/Chair: full canonical reading, mission lock briefing
```

---

## Departure / offboarding (separate runbook)

See `docs/runbooks/nonprofit/offboarding.md` (TODO when first separation occurs).

Quick principles:
- Access revoked within 4 hours of separation
- Final paycheck per state law (GA: next regular pay date)
- Knowledge transfer documented (don't lose tribal knowledge)
- Continued obligations (NDA, IP) reaffirmed in writing
- Records archived per document-retention policy
- Update website + org chart
- Update `people.json`

---

## What "good onboarding" looks like

A new member should be able to:

1. Tell you the mission in their own words by day 7
2. Read any canonical contract and understand it by day 14
3. Have done one productive thing (board: voted on something; staff: shipped something) by day 30
4. Articulate where they fit and what they'll contribute by day 90

If any of these is missing, the onboarding failed and the cause is *probably* the org's onboarding, not the person.

---

## Cross-references

- `people.json` — onboarding section, role checklists
- `governance.json` — board-specific requirements (COI, term, etc.)
- `legal.json` — contracts, NDAs, DPAs, IP-assignment
- `risk.json` — D&O insurance trigger
- Templates: `/scripts/nonprofit/templates/onboarding/`
