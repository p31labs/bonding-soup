# P31 Labs, Inc. — Board Document Index

**Entity:** P31 Labs, Inc. · EIN 42-1888158 · GA SOS Control #26082141  
**State:** Georgia nonprofit corporation · Incorporated 2026-04-03

---

## Document status

| Document | Status | Where to sign |
|---------|--------|--------------|
| [BOARD-MEETING-001-AGENDA.md](BOARD-MEETING-001-AGENDA.md) | ✅ Ready | Use at meeting |
| [BOARD-MEETING-001-MINUTES.md](BOARD-MEETING-001-MINUTES.md) | ⬜ Fill at meeting | Secretary fills during/after |
| [WAIVER-OF-NOTICE-MEETING-001.md](WAIVER-OF-NOTICE-MEETING-001.md) | ⬜ All 3 directors sign | Before or at meeting |
| [WRITTEN-CONSENT-ORGANIZATIONAL-ACTIONS.md](WRITTEN-CONSENT-ORGANIZATIONAL-ACTIONS.md) | ⬜ All 3 directors sign | Use ONLY if no meeting held |
| [BYLAWS-ADOPTION-CERTIFICATE.md](BYLAWS-ADOPTION-CERTIFICATE.md) | ⬜ Secretary + President sign | After bylaws vote |
| [DIRECTOR-CONSENT-TO-SERVE.md](DIRECTOR-CONSENT-TO-SERVE.md) | ⬜ Each director signs own copy | At or before meeting |
| [CONFLICT-OF-INTEREST-DISCLOSURE-FORM.md](CONFLICT-OF-INTEREST-DISCLOSURE-FORM.md) | ⬜ Each director completes | Annually; at meeting |
| [WHISTLEBLOWER-POLICY.md](WHISTLEBLOWER-POLICY.md) | ⬜ Board adopts | Agenda item 10 |
| [DOCUMENT-RETENTION-POLICY.md](DOCUMENT-RETENTION-POLICY.md) | ⬜ Board adopts | Agenda item 10 |
| [C-100-EXEMPTION-MEMO.md](C-100-EXEMPTION-MEMO.md) | ⬜ President + Secretary sign | After meeting |
| [BOARD-RESOLUTION-TEMPLATES.md](BOARD-RESOLUTION-TEMPLATES.md) | ✅ Reference | Use for future resolutions |
| [ANNUAL-MEETING-NOTICE-TEMPLATE.md](ANNUAL-MEETING-NOTICE-TEMPLATE.md) | ✅ Reference | Use for 2026 annual meeting |

---

## Documents in phosphorus31.org/docs/ (canonical)

| Document | Notes |
|---------|-------|
| `P31_Labs_Bylaws_Final.md` | **Adopt at Meeting #001.** EIN field shows "Pending" — update to 42-1888158 after adoption. |
| `nonprofit-conflict-of-interest-policy-final.md` | **Adopt at Meeting #001.** |

---

## Meeting #001 checklist (minimum viable)

Use this order at the meeting:

1. ☐ Confirm quorum (2 of 3 directors)
2. ☐ Accept signed Waivers of Notice
3. ☐ Adopt Bylaws → Secretary certifies
4. ☐ Set staggered director terms
5. ☐ Elect officers (President, Secretary, Treasurer)
6. ☐ Adopt Conflict of Interest Policy → collect disclosure forms
7. ☐ Ratify prior actions (articles, EIN, 501c3, SAM, Stripe, Ko-fi, sites)
8. ☐ Legal review authorization → flip `legal-counsel-review` gate
9. ☐ Name successor operator → flip `successor-operator-named` gate
10. ☐ Adopt Whistleblower + Document Retention policies
11. ☐ Bank account authorization
12. ☐ Set next annual meeting date
13. ☐ Secretary prepares Minutes → all directors review

---

## After the meeting

- [ ] Secretary distributes signed minutes to all directors
- [ ] Each director returns signed Consent to Serve
- [ ] Each director completes and returns COI Disclosure Form
- [ ] Secretary certifies Bylaws Adoption Certificate
- [ ] President signs C-100 Exemption Memo; file in entity records
- [ ] President runs: `npm run launch:check -- legal-counsel-review met --note "Board Meeting #001 [date]"`
- [ ] President runs: `npm run launch:check -- successor-operator-named met --note "Package stored [method] [date]"`
- [ ] President updates bylaws EIN field from "Pending" to 42-1888158

---

## Storage

Physical originals: 401 Powder Horn Rd, Saint Marys, GA 31558  
Digital: this repository (unsigned templates) + off-repo encrypted store (signed originals)  
Retention: Permanent (Bylaws, Minutes, Consents, COI forms) — per Document Retention Policy
