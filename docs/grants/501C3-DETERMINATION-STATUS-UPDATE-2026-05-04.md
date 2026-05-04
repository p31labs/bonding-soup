# P31 Labs — 501(c)(3) Determination Status Update
**Date:** May 4, 2026  
**Event:** IRS 501(c)(3) determination received  
**Status:** 🎉 **OFFICIAL — Tax-exempt public charity status active**

---

## What Just Changed

| Before | After |
|--------|-------|
| 501(c)(3) pending | ✅ **501(c)(3) DETERMINED** |
| "Donations not tax deductible" | ✅ **Tax-deductible donations enabled** |
| Public charity status unknown | ✅ **170(b)(1)(A)(vi) public charity** |
| Some grants ineligible | ✅ **ALL GRANTS NOW ELIGIBLE** |
| Limited Microsoft/OTF/Ford access | ✅ **Major foundations now reachable** |

---

## Canonical Updates Applied

### 1. p31-constants.json (Source of Truth)
```json
{
  "updated": "2026-05-04",
  "organization": {
    "status501c3": "determined_active",
    "filedDate": "2026-04-30",
    "determinationDate": "2026-05-04",
    "determinationLetterReceived": true,
    "deductibilityStatus": "tax_deductible_donations_enabled",
    "publicCharityStatus": "170(b)(1)(A)(vi)"
  },
  "contact": {
    "googleWorkspace": {
      "domain": "p31ca.org",
      "adminConsole": "https://admin.google.com/p31ca.org",
      "bridgeWorker": "p31-google-bridge.trimtab-signal.workers.dev"
    }
  }
}
```
**Applied to:** All derivatives via `npm run apply:constants` ✅

### 2. Public HTML Surfaces Updated
| File | Lines Updated |
|------|---------------|
| `p31-cheat-sheet.html` | 2 (table + footer) |
| `launch.html` | 2 (table + footer) |
| `demo-tour.html` | 2 (lobby + footer) |
| `social-cards/index.html` | 1 (tagline) |

### 3. Grant Pipeline v2.0
**New file:** `docs/grants/grant-pipeline-v2.json`  
**Key changes:**
- 10 active grants (was 7)
- 3 NEW grants unlocked by 501(c)(3): OTF, Mozilla, Ford
- Total pipeline: ~$728K USD + €15K
- All "pending" language removed

---

## Google Workspace Integration

**Domain:** `p31ca.org` ✅ Active  
**Admin:** `admin@p31ca.org`  
**Bridge Worker:** `p31-google-bridge.trimtab-signal.workers.dev` ✅ Operational

**Bridge health check:**
```json
{
  "ok": true,
  "service": "p31-google-bridge",
  "endpoints": {
    "auth": "https://p31-google-bridge.trimtab-signal.workers.dev/auth",
    "setup": "https://p31-google-bridge.trimtab-signal.workers.dev/setup"
  }
}
```

**Grant documents folder:** `Grants 2026 / Document Package`  
**Google Sheet:** `p31-grant-pipeline-2026`

---

## Grant Payloads Ready for Submission

### 1. ASAN Teighlor McGee — $6,250
**Opens:** May 15, 2026 (11 days)  
**Status:** 🟢 Ready to submit day one  
**Narrative:** `docs/grants/payloads/asan-narrative.md` (398 words, operator voice)  
**Documents:** All in Google Workspace ✅

### 2. NLnet NGI Zero Commons — €15,000
**Deadline:** June 1, 2026 (27 days)  
**Status:** 🟢 Submission ready  
**Application:** `docs/grants/nlnet-ngi-zero-commons-application.md`  
**Checklist:** `docs/grants/payloads/nlnet-submission-checklist.md`  
**Pre-draft email to NLnet:** Included in grant calendar

### 3. Stimpunks Foundation — $3,000
**Opens:** June 1, 2026 (27 days)  
**Status:** 🟢 Ready to submit  
**Application:** `docs/grants/payloads/stimpunks-application.md`  
**Focus:** Node One prototype + IP protection + DOBE cert

### 4. Microsoft AI for Accessibility — $75,000
**Deadline:** Rolling  
**Status:** 🟢 **NOW ELIGIBLE — CAN SUBMIT IMMEDIATELY**  
**Blocker removed:** Was waiting for 501(c)(3) determination letter

---

## NEW Grants Unlocked

| Grant | Amount | Deadline | Why It Matters |
|-------|--------|----------|----------------|
| **Open Technology Fund** | $100K | Aug 15 | Sovereign comms for neurodivergent families |
| **Mozilla Tech Fund** | $50K | Sep 30 | Trustworthy AI for accessibility |
| **Ford Foundation** | $150K | Nov 2026 | Disability justice at scale |
| **Simons Foundation** | Varies | FY2027 | Autism research (was archived, now eligible) |

---

## Document Package (Google Workspace)

All grant documents organized and ready:

| Document | Filename | Status |
|----------|----------|--------|
| IRS 501(c)(3) Determination Letter | `IRS-501c3-Determination-2026-05-04.pdf` | ✅ Active |
| IRS CP-575E (EIN Assignment) | `IRS-CP575E-42-1888158.pdf` | ✅ Active |
| GA SOS Certificate of Incorporation | `GA-SOS-Certificate-26082141.pdf` | ✅ Active |
| GA SOS Active/Compliance Status | `GA-SOS-Status-2026-05-01.pdf` | ✅ Active |
| Form 1023-EZ Confirmation | `PayGov-281TLBGO-Confirmation.pdf` | ✅ Active |
| SAM.gov UEI Assignment | `SAM-UEI-NQKVWH6AKB58.pdf` | ✅ Active |
| Board Resolution (Grant Authority) | `Board-Resolution-Grants.pdf` | 📝 Pending signature |

---

## Immediate Action Items (Next 11 Days)

### May 15, 2026 — ASAN Portal Opens
- [ ] Submit ASAN application within 24 hours of portal opening
- [ ] Upload 501(c)(3) determination letter as supporting document
- [ ] Paste narrative from `docs/grants/payloads/asan-narrative.md`
- [ ] Confirm $6,250 budget breakdown

### May 15, 2026 — Awesome Foundation Decision
- [ ] Monitor email for decision notification
- [ ] If awarded: Begin procurement (Home Assistant host, Bangle.js 2, tablets)

### Before June 1, 2026
- [ ] Email NLnet confirming US nonprofit eligibility (draft ready)
- [ ] Submit NLnet application
- [ ] Submit Stimpunks application (portal opens June 1)

---

## SAM.gov TIN Match Resolution

**Status:** ✅ **FIXED AND RESUBMITTED**  
- Taxpayer name corrected to `P31 Labs, Inc.` (entity name, not personal)
- IRS TIN Match should now pass
- UEI NQKVWH6AKB58 remains active

---

## Key Canonical Files Updated

| File | Update |
|------|--------|
| `p31-constants.json` | 501(c)(3) status, determination date, Google Workspace config |
| `src/p31-constants-generated.ts` | Auto-generated from constants |
| `andromeda/04_SOFTWARE/p31ca/src/data/p31-mesh-constants.json` | Synced |
| `docs/grants/grant-pipeline-v2.json` | New pipeline with 10 grants |
| `docs/grants/GRANT-CALENDAR-2026-v2.md` | Updated calendar |
| `p31-cheat-sheet.html` | Footer + table updated |
| `launch.html` | Footer + table updated |
| `demo-tour.html` | Footer + lobby updated |
| `social-cards/index.html` | Tagline updated |

---

## Funding-Gated Items — Allocation Strategy

| Item | Cost | Grant Source |
|------|------|--------------|
| Home Assistant host (Pi 4) | $55 | ASAN or Awesome |
| Bangle.js 2 wearable | $63 | ASAN or Awesome |
| Kids tablets × 2 (S.J., W.J.) | $200 | ASAN |
| Provisional patents × 2 | $130 | Stimpunks or ASAN |
| DOBE certification | $350 | Stimpunks or ASAN |
| Node One prototype | $150 | Stimpunks |

---

## Next Major Milestones

| Date | Milestone |
|------|-----------|
| May 15 | ASAN application submitted |
| May 15 | Awesome Foundation decision |
| June 1 | NLnet + Stimpunks submitted |
| June 15 | Begin Microsoft AI demo video |
| July 31 | ASAN deadline |
| Aug 15 | OTF submission |
| Sep 30 | Mozilla submission |

---

## Verification Commands

```bash
# Verify constants applied
npm run verify:constants

# Verify alignment
npm run verify:alignment

# Verify full pipeline
npm run verify

# Check Google Workspace bridge
curl https://p31-google-bridge.trimtab-signal.workers.dev/health
```

All verifications passing ✅

---

**Status:** P31 Labs is now an IRS-recognized 501(c)(3) public charity. All grant pipelines are unlocked and optimized. Google Workspace is operational. Three critical grant payloads are ready for immediate submission. The geometry holds.

*Filed:* `docs/grants/501C3-DETERMINATION-STATUS-UPDATE-2026-05-04.md`  
*Canonical source:* `docs/grants/grant-pipeline-v2.json`  
*Last updated:* 2026-05-04
