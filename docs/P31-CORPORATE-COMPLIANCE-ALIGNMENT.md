# P31 Labs, Inc. — Corporate Compliance & Governance Alignment

**Document:** P31-CORPORATE-COMPLIANCE-ALIGNMENT  
**Date:** 2026-05-06  
**Entity:** P31 Labs, Inc., Georgia Domestic Nonprofit Corporation  
**EIN:** 42-1888158  
**Incorporated:** April 3, 2026  

---

## 1. FORMATION STATUS

| Step | Required | Status | Date | Notes |
|------|----------|--------|------|-------|
| Articles of Incorporation | GA SoS filing | ✅ Complete | Apr 3, 2026 | Filed with GA Secretary of State |
| Newspaper Publication | O.C.G.A. requires notice | ✅ Initiated | Apr 3, 2026 | Tribune & Georgian contacted; $40 fee |
| EIN | IRS | ✅ Assigned | Apr 13, 2026 | 42-1888158 |
| Initial Annual Registration | GA SoS within 90 days | ⚠️ DUE | Jul 2, 2026 | 3 officers required, $30 fee |
| Bank Account | Mercury | ✅ Approved | Apr 13, 2026 | IO card active, Choice Financial / Column N.A. |
| Bylaws | Internal | ✅ Draft exists | Feb 2026 | Single-member board. Needs expansion for 1023-EZ. |
| Conflict of Interest Policy | IRS requirement | ✅ Draft exists | Feb 2026 | Includes lived-experience clause |
| Board Resolution (initial) | Internal | 🔴 Not filed | — | Needs: authorize filings, approve officers, adopt policies |
| Form 1023-EZ | IRS 501(c)(3) | 🔴 Not filed | — | $275 fee. 27-month window closes ~Jul 3, 2028 |
| GA State Tax Exemption | GA DOR | 🔴 Blocked | — | Requires IRS determination letter |
| Charitable Solicitation (C-100) | GA SoS Securities & Charities | 🔴 Not filed | — | $35 fee. Required before soliciting GA donations. |
| SAM.gov Registration | Federal grants | ✅ Submitted | Apr 2026 | Pending processing |

---

## 2. COMPLIANCE CALENDAR

### Recurring Annual Obligations

| Obligation | Due Date | Fee | Agency | Form |
|-----------|----------|-----|--------|------|
| GA Annual Registration | Jan 1 – Apr 1 each year | $30 | GA Secretary of State | eCorp online or CD-227 |
| IRS Form 990-N (e-Postcard) | 4.5 months after FY end (May 15) | $0 | IRS | Online only |
| GA State Income Tax Filing | Uses IRS 990 | $0 | GA Dept of Revenue | Copy of 990 |
| Charitable Solicitation Renewal | Every 24 months from approval | $20 | GA SoS Securities & Charities | Renewal + financials |
| Registered Agent Confirmation | During annual registration | — | GA SoS | Part of AR |

### One-Time (Not Yet Complete)

| Obligation | Deadline | Fee | Priority |
|-----------|----------|-----|----------|
| Initial Annual Registration | Jul 2, 2026 (90 days from incorporation) | $30 | 🔴 CRITICAL |
| Form 1023-EZ | ~Jul 3, 2028 (27-month window) | $275 | 🟡 HIGH |
| Form C-100 (Charitable Solicitation) | Before soliciting donations | $35 | 🟡 HIGH (already accepting Stripe/Ko-fi) |
| GA State Tax Exemption Application | After IRS determination letter | $0 | 🟢 After 1023-EZ |
| Board expansion to 3+ directors | Before 1023-EZ filing | $0 | 🟡 HIGH |

---

## 3. GOVERNANCE STRUCTURE

### 3.1 Current Board

| Role | Person | Status |
|------|--------|--------|
| CEO / Sole Director | Will Johnson | Active |
| Secretary | Will Johnson | Active (GA requires different person from CEO per §14-3-840 as amended 2023) |
| CFO/Treasurer | (vacant) | Required per GA law |

**CRITICAL:** O.C.G.A. §14-3-840 (as amended 2023 Ga. Laws 260) requires three distinct officer positions: CEO, Secretary, and CFO. CEO and Secretary must be different individuals. For 1023-EZ, IRS strongly prefers 3+ unrelated directors.

### 3.2 Board Expansion Plan

| Seat | Candidate | Relationship | Status |
|------|-----------|-------------|--------|
| Director 1 (Chair/CEO) | Will Johnson | Founder | Active |
| Director 2 (Independent) | Tyler Cisco | Beta tester, Tailscale mesh | Candidate — needs formal appointment |
| Director 3 (Independent) | Hunter McFeron | GA Tools for Life | Candidate — needs outreach |
| Director 4 (if desired) | (open) | Must be unrelated to Will | Strengthens 1023-EZ |

**IRS relatedness rules:** Board members must be unrelated to each other and to the CEO. Tyler and Hunter are unrelated to Will and each other.

### 3.3 Required Governance Documents

| Document | Status | Location |
|----------|--------|----------|
| Articles of Incorporation | ✅ Filed | GA SoS records |
| Bylaws | ✅ Draft | Generated Feb 2026 — needs board expansion |
| Conflict of Interest Policy | ✅ Draft | Modeled on IRS 1023 Instructions Appendix A |
| Whistleblower Policy | 🔴 Not drafted | Required for 1023-EZ |
| Document Retention/Destruction Policy | 🔴 Not drafted | Required for 1023-EZ |
| Gift Acceptance Policy | 🔴 Not drafted | Best practice |
| Executive Compensation Policy | 🔴 Not drafted | Required for 1023-EZ |
| Initial Board Resolution | 🔴 Not adopted | Authorizes all filings, adopts policies |
| Meeting Minutes Template | 🔴 Not created | Required for annual meetings |

---

## 4. FINANCIAL INFRASTRUCTURE

### 4.1 Current State

| System | Status | Details |
|--------|--------|---------|
| Mercury Bank | ✅ Live | Operating account, IO card active |
| Stripe | ✅ Live | Connected via api.phosphorus31.org Worker |
| Ko-fi | ✅ Live | ko-fi.com/trimtab69420 |
| Accounting | 🔴 None | No bookkeeping system in place |
| 990 preparation | 🔴 None | FY2026 will need 990-N at minimum |

### 4.2 Financial Reporting Requirements

**Year 1 (FY2026):** If gross receipts ≤ $50,000, file Form 990-N (e-Postcard). No financial statements required. Due May 15, 2027.

**Charitable Solicitation:** If received/collected > $0 in preceding FY, must file financial statements with C-100 renewal. If > $1M, audited statements required.

### 4.3 Accounting Setup Needed

| Need | Solution | Effort |
|------|----------|--------|
| Chart of accounts | Wave (free) or GnuCash (open-source) | 2 hours |
| Transaction categorization | Link Mercury → accounting software | 1 hour |
| Monthly reconciliation | Automated Mercury CSV export → categorize | 30 min/month |
| Donation tracking | Stripe webhooks → Mercury → receipt generation | Already partly wired |
| Grant expense tracking | Per-grant cost center in accounting | 1 hour per grant |

---

## 5. TRANSPARENCY PAGE SPEC

`phosphorus31.org/transparency` — required for grant reviewer credibility.

### Content (in order):

1. **Mission statement** — one paragraph
2. **Board of Directors** — names, independence designations, bios
3. **Leadership/Staff** — Will Johnson, Founder/CEO
4. **Governing Documents** — Articles of Incorporation (stamped copy), Bylaws PDF
5. **Board-Adopted Policies** — COI, whistleblower, document retention, gift acceptance, exec comp, internal controls
6. **Financials** — 990-N (when filed), annual report, audited statements (when applicable)
7. **Legal Identity** — Legal name, EIN 42-1888158, state of incorporation, IRS determination letter (when issued), GA SoS entity ID, GA charitable solicitation number
8. **Third-Party Links** — Candid profile (apply for Seal), IRS TEOS, ProPublica Nonprofit Explorer
9. **P31-Specific** — GitHub repo links, licenses (open-source), WCAG 2.2 AA accessibility statement, security contact (PGP B8C0CE8E)
10. **Records Request** — Plain-language IRC §6104 / O.C.G.A. Title 14 statement, contact email

---

## 6. GRANT REPORTING REQUIREMENTS

### Active/Pending Grants

| Grant | Amount | Status | Reporting Requirements |
|-------|--------|--------|----------------------|
| Awesome Foundation | $1,000 | April deliberation | No formal reporting — brief update email |
| Stimpunks | $3,000 | Paused Jun 1 | TBD — typically narrative + budget report |

### Standard Grant Report Template

Every grant report should include:

1. **Cover page** — Grant name, period, P31 Labs info, EIN
2. **Narrative report** — Activities completed, milestones achieved, challenges, impact
3. **Financial report** — Budget vs actuals, per-line-item breakdown
4. **Metrics** — Users served, code shipped (commits, test counts), publications, events
5. **Attachments** — Screenshots, test reports, Zenodo DOIs, media coverage

---

## 7. WCD SEQUENCE

| WCD | Scope | Effort | Priority |
|-----|-------|--------|----------|
| WCD-CORP-01 | Initial Board Resolution (authorize all filings, adopt policies) | 2 hours | 🔴 CRITICAL |
| WCD-CORP-02 | GA Initial Annual Registration (3 officers, $30) | 30 min | 🔴 DUE Jul 2 |
| WCD-CORP-03 | Board expansion (Tyler formal appointment, Hunter outreach) | 1 day | 🟡 Before 1023-EZ |
| WCD-CORP-04 | Whistleblower Policy draft | 1 hour | 🟡 Before 1023-EZ |
| WCD-CORP-05 | Document Retention Policy draft | 1 hour | 🟡 Before 1023-EZ |
| WCD-CORP-06 | Executive Compensation Policy draft | 1 hour | 🟡 Before 1023-EZ |
| WCD-CORP-07 | Gift Acceptance Policy draft | 1 hour | 🟡 Before 1023-EZ |
| WCD-CORP-08 | Form C-100 (Charitable Solicitation Registration, $35) | 2 hours | 🟡 HIGH |
| WCD-CORP-09 | Form 1023-EZ filing ($275) | 4-8 hours | 🟡 After board expansion |
| WCD-CORP-10 | Transparency page on phosphorus31.org | 4 hours | 🟡 After governance docs |
| WCD-CORP-11 | Accounting system setup (Wave or GnuCash) | 2 hours | 🟢 This month |
| WCD-CORP-12 | Monthly report generator automation | 4 hours | 🟢 Build once |
| WCD-CORP-13 | Grant report template (Word) | 2 hours | 🟢 Before next grant report |

**July 2, 2026 is the hard wall.** Initial Annual Registration must be filed. Everything else sequences around it.

---

*Incorporated. EIN assigned. Bank open. Now: govern it, report it, protect it.*
