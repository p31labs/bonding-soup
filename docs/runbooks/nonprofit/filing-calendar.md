# Filing Calendar Runbook

**When to use:** monthly review of upcoming deadlines.
**Owner:** Secretary (filings) + Treasurer (financial filings).
**Pre-requisite reading:** `compliance.json` → `filingCalendar`.

---

## Monthly review (first of each month)

```bash
# Print all deadlines in the next 90 days
npm run nonprofit:calendar

# Or full year
npm run nonprofit:calendar -- --window 365
```

For each deadline:
- [ ] Confirmed owner is available
- [ ] Materials being prepared
- [ ] Calendar reminder set 14 days before
- [ ] Calendar reminder set 1 day before

## Adding a new deadline

When a new filing requirement is identified (new state registration, new program-required filing, etc.):

```bash
# Edit compliance.json filingCalendar.deadlines[]
# Required fields:
#   date (YYYY-MM-DD)
#   type (filing category)
#   action (what to do)
#   owner (role responsible)
#   conditional (boolean, optional)
#   extensionPossible (boolean, optional)
#   fee (number, optional)

npm run verify:nonprofit   # check it parses
git commit -m "compliance: add <X> deadline"
```

## Filing types and pre-flight checklists

### Form 990-N (e-postcard)

**When:** annually, due May 15 of year following fiscal year end (Dec 31). Threshold: gross receipts ≤ $50,000.

```bash
# Pre-flight (1 month before)
[ ] Confirmed gross receipts <= $50k (otherwise 990-EZ or 990 required)
[ ] EIN handy
[ ] Officer name + address handy
[ ] Mission statement (one line)
[ ] No financial detail required for 990-N

# Filing
# IRS website: irs.gov/charities-non-profits/annual-electronic-notice-form-990-n-e-postcard
# Takes 5 minutes
```

### Form 990-EZ

**When:** annually if gross receipts $50k–$200k. More involved.

```bash
# Pre-flight (2 months before)
[ ] Books closed for fiscal year
[ ] Treasurer report assembled
[ ] All program activities documented
[ ] Compensation of officers/key staff calculated
[ ] Board roster current
[ ] Any unrelated business income identified

# Engage:
[ ] CPA (recommended for first 990-EZ; estimated $500-1500)
```

### Form 990 (full)

**When:** annually if gross receipts > $200k OR assets > $500k. Substantial form.

```bash
# Pre-flight (3 months before)
[ ] External audit underway (if revenue > $250k OR state-required)
[ ] All schedules identified (most common: A, B, D, F, G, I, J, M, O)
[ ] Schedule J — compensation of 5 highest-paid
[ ] Schedule B — major donors (typically not public)
[ ] CPA engaged

# Estimated cost: $2-5k for CPA preparation
# Estimated time: 40-80 hours of internal preparation
```

### GA Annual Registration (Secretary of State)

**When:** January 1 – April 1 each year. $30 fee. Penalty for late filing.

```bash
# 5-minute online filing
# https://ecorp.sos.ga.gov/

[ ] Confirm registered agent info current
[ ] Confirm principal office info current
[ ] Confirm officers/directors info current
[ ] Pay $30 via credit card
```

### State charitable solicitation renewals

**When:** varies by state. Most states require annual renewal.

For each registered state:
```bash
[ ] Confirm registration period not lapsed
[ ] Compile required attachments (often Form 990, financial summary, board list)
[ ] Pay fee (varies $0-$200)
[ ] File via state portal or mail
[ ] Update compliance.json tracker entry with new "lastFiled" date
```

### Form 8868 (extension request)

When you can't file 990 on time:
```bash
# File Form 8868 by original 990 due date
# Grants 6-month extension (automatic, no reason required)
# Does NOT extend payment due dates if any tax owed
```

### 1099-NEC issuance (January 31)

For each contractor paid >= $600 in calendar year:
```bash
[ ] Pull contractor list from financials.json contractors
[ ] Sum payments per contractor for the year
[ ] If sum >= $600: issue 1099-NEC
[ ] File copy with IRS by January 31
[ ] Send copy to contractor by January 31
```

## When you miss a deadline

It happens. Don't panic.

```bash
# 1. File as soon as possible
# 2. Pay any late fee
# 3. Document why missed (in incident log if it triggered investigation)
# 4. Update compliance.json with new "filed" timestamp
# 5. Add a calendar reminder earlier next year
```

**Most agencies do not impose criminal liability for late filing.** They impose fees. The cost compounds with each year missed. File now; appeal penalties later if grounds exist.

**The exception is Form 990 — three consecutive years of non-filing automatically revokes 501(c)(3) status.** Reinstatement is possible but costly and time-consuming. Never let 990 lapse.

## Moving entries through the calendar

```bash
# When a deadline is filed:
# Edit compliance.json filing entry:
#   "filed": true,
#   "filedDate": "2026-12-15",
#   "filedBy": "treasurer",
#   "confirmation": "<reference number>"

# Add the next year's same filing as a new entry
# (Don't replace; we keep the historical record)
```

## Cross-references

- `compliance.json` — canonical filing schedule
- `financials.json` — fiscal year + revenue tracking
- `governance.json` — annual board meeting deadline alignment
- `npm run nonprofit:calendar` — automation
