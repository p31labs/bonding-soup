# P31 LABS — SUCCESSOR OPERATOR PACKAGE
## ⚠ SENSITIVE — STORE OFF-REPO (encrypted file, sealed envelope, or attorney's file)

**Entity:** P31 Labs, Inc.  
**EIN:** 42-1888158  
**State:** Georgia (GA) nonprofit corporation  
**Incorporated:** 2026-04-03  
**501(c)(3) filed:** 2026-04-30 (Pay.gov 281TLBGO; pending IRS determination)  
**Primary operator:** William R. Johnson (W.Johnson-001)  
**Package version:** 1.0  
**Package date:** _______________  
**Next review due:** _______________ (max 12 months from package date)

---

## SECTION 1 — OPERATOR STATUS SIGNALS

Before activating succession, confirm the situation:

| Signal | Meaning | Response |
|--------|---------|----------|
| Operator explicitly named you as successor | Planned handoff | Proceed to Section 4 with operator assistance if possible |
| Operator is hospitalized, unresponsive, or unreachable >48h | Medical/acute emergency | Activate Tier 1 contacts immediately; proceed to Section 4 |
| Operator is deceased | Permanent succession | Contact Tier 3 (legal); convene board within 30 days |
| Operator requests voluntary step-down | Graceful transition | Operator signs written notice; proceed jointly |

---

## SECTION 2 — PRIMARY SUCCESSOR OPERATOR

> Fill this in before storing the package. Have the named person sign below.

**Full legal name:** _______________________________________________

**Relationship to operator:** _______________________________________________

**Primary phone:** _______________________________________________

**Backup phone:** _______________________________________________

**Email:** _______________________________________________

**Physical address:** _______________________________________________

**Signed (successor accepts designation):** _____________________________ Date: ___________

**Signed (operator designation):** _____________________________ Date: ___________

---

## SECTION 3 — ALTERNATE SUCCESSOR OPERATOR (recommended)

**Full legal name:** _______________________________________________

**Relationship to operator:** _______________________________________________

**Primary phone:** _______________________________________________

**Email:** _______________________________________________

**Signed (alternate accepts designation):** _____________________________ Date: ___________

---

## SECTION 4 — BREAK-GLASS CONTACTS

### Tier 1 — Reach within 2 hours (medical / acute emergency)

**Contact 1**

| Field | Value |
|-------|-------|
| Name | _______________________________________________ |
| Relationship | _______________________________________________ |
| Primary phone | _______________________________________________ |
| Backup phone | _______________________________________________ |
| Email | _______________________________________________ |
| Knows package location? | Yes / No |
| Medical authority (accompanies to hospital) | Yes / No |
| Note | _______________________________________________ |

**Contact 2**

| Field | Value |
|-------|-------|
| Name | _______________________________________________ |
| Relationship | _______________________________________________ |
| Primary phone | _______________________________________________ |
| Backup phone | _______________________________________________ |
| Email | _______________________________________________ |
| Knows package location? | Yes / No |
| Medical authority | Yes / No |
| Note | _______________________________________________ |

---

### Tier 2 — Technical systems (reach within 24 hours)

**Contact 1 — Infrastructure advisor**

| Field | Value |
|-------|-------|
| Name | _______________________________________________ |
| Relationship | _______________________________________________ |
| Phone | _______________________________________________ |
| Email | _______________________________________________ |
| Can advise on | Cloudflare / GitHub / Stripe / Other: ___________ |
| Current access level | Admin / Read-only / None (recovery only) |
| Note | _______________________________________________ |

**Contact 2 — (Optional additional)**

| Field | Value |
|-------|-------|
| Name | _______________________________________________ |
| Phone | _______________________________________________ |
| Email | _______________________________________________ |
| Role | _______________________________________________ |

---

### Tier 3 — Legal and organizational (reach within 72 hours)

**Registered agent**

| Field | Value |
|-------|-------|
| Name / firm | _______________________________________________ |
| Phone | _______________________________________________ |
| Email | _______________________________________________ |
| GA SOS filing number | _______________________________________________ |
| Note | Notify of operator change if >30 days unavailable |

**Board member / director 1**

| Field | Value |
|-------|-------|
| Name | _______________________________________________ |
| Phone | _______________________________________________ |
| Email | _______________________________________________ |
| Role on board | _______________________________________________ |

**Board member / director 2**

| Field | Value |
|-------|-------|
| Name | _______________________________________________ |
| Phone | _______________________________________________ |
| Email | _______________________________________________ |
| Role on board | _______________________________________________ |

**Legal counsel (if retained)**

| Field | Value |
|-------|-------|
| Name | _______________________________________________ |
| Firm | _______________________________________________ |
| Phone | _______________________________________________ |
| Email | _______________________________________________ |

---

## SECTION 5 — OPERATOR MEDICAL CONTEXT

> For first responders, hospital staff, and successor. Keep this section current.

**Diagnosis:** Hypoparathyroidism (ICD-10 E20.9)  
**Critical:** Serum calcium must remain 8.0–9.0 mg/dL. Low calcium = medical emergency.  
**Symptoms of hypocalcemia emergency:** Muscle cramps, numbness/tingling, tetany, seizure.  
**Emergency action:** Call 911. Inform hospital of hypoparathyroidism. IV calcium gluconate if severe.

**Current medications and dosages:**

| Medication | Dose | Frequency | Notes |
|-----------|------|-----------|-------|
| ___________ | _____ | __________ | _______________ |
| ___________ | _____ | __________ | _______________ |
| ___________ | _____ | __________ | _______________ |

**Medication location (carried on person):** _______________________________________________

**Pharmacy name and phone:** _______________________________________________

**Primary physician:** _______________________________________________  
**Physician phone:** _______________________________________________  
**Hospital preference:** _______________________________________________

**Cognitive note:** AuDHD (late diagnosis 2025). In acute situations: present information in writing, one item at a time. Verbal rapid-fire is harder to process. The operator is highly capable; the serialization bottleneck is sensory, not cognitive.

**Health care proxy / medical power of attorney (if executed):**  
Document location: _______________________________________________  
Proxy name: _______________________________________________

---

## SECTION 6 — CHILDREN (MINORS)

> Complete only if applicable to custody and emergency child care.

**S.J.** (initials only) — DOB 2016-03-10  
**W.J.** (initials only) — DOB 2019-08-08

**Current custody arrangement:** _______________________________________________  
**Custody order location (physical copy):** _______________________________________________  
**Family law attorney:** _______________________________________________  
**Attorney phone:** _______________________________________________

**Emergency child care contact (if operator is hospitalized):**

| Field | Value |
|-------|-------|
| Name | _______________________________________________ |
| Relationship | _______________________________________________ |
| Phone | _______________________________________________ |
| Authority | Court-authorized / designated by operator |

---

## SECTION 7 — CREDENTIAL RECOVERY PATHS

> Do NOT write actual credentials here. Write WHERE credentials are stored and who holds recovery keys.

**Cloudflare account email:** _______________________________________________  
**Cloudflare 2FA backup codes location:** _______________________________________________  
**Person holding decryption key (if encrypted):** _______________________________________________

**GitHub organization:** p31labs  
**GitHub 2FA backup codes location:** _______________________________________________  
**GitHub recovery email:** _______________________________________________

**Stripe account email:** _______________________________________________  
**Stripe 2FA recovery:** _______________________________________________

**Password manager / vault used:** _______________________________________________  
**Master password / recovery key location:** _______________________________________________  
**Person who can verify vault access:** _______________________________________________

**CF Worker secrets — source of truth:** `andromeda/04_SOFTWARE/` per-worker `wrangler.toml`  
**Secrets are stored in:** Cloudflare dashboard (Worker → Settings → Variables)  
**To list active Workers:** `wrangler list` (requires authenticated CF account)

---

## SECTION 8 — IMMEDIATE ACTIVATION CHECKLIST

When the successor operator takes control:

- [ ] Retrieve this package
- [ ] Call Tier 1 contacts; confirm operator status and whereabouts
- [ ] Log in to Cloudflare dashboard — verify fleet is green (no failed Workers)
- [ ] Check GitHub Actions: `github.com/p31labs/andromeda/actions` — any failing CI?
- [ ] Check donate-api health: `curl https://donate-api.phosphorus31.org/health`
- [ ] Read `p31-live-fleet.json` for current deployed Worker URLs
- [ ] Read `docs/P31-ENGINEERING-STANDARD.md` for ship bar and deploy process
- [ ] Do not deploy or make changes until you understand the system — the edge fleet auto-runs
- [ ] If legal action is needed: call Tier 3 contacts; do not make statements on behalf of the entity without counsel
- [ ] If >30 days: notify GA registered agent of operator status change
- [ ] If >60 days: convene board to formally ratify succession

**Do not panic.** The infrastructure is serverless and largely self-maintaining. The biggest risk is an expiring Cloudflare token causing CI to fail — not a live-system outage.

---

## SECTION 9 — PACKAGE STORAGE LOCATIONS

Record where this package is stored so multiple Tier 1 contacts can find it:

| Copy | Storage method | Location / key holder |
|------|---------------|----------------------|
| 1 | _______________ | _______________________________________________ |
| 2 | _______________ | _______________________________________________ |
| 3 (optional) | _______________ | _______________________________________________ |

---

## SECTION 10 — PACKAGE SIGNATURE AND WITNESS

This package was completed, reviewed, and stored on:

**Date:** _______________________________________________

**Operator signature:** _____________________________ 

**Witness 1 (optional):** _____________________________ Date: ___________

**Witness 2 (optional):** _____________________________ Date: ___________

---

*Once stored: flip gate with `npm run launch:check -- successor-operator-named met --note "Package v1.0 stored [method] YYYY-MM-DD"`*
