# NLnet — security audit funding ask (draft)

**Status:** Draft. Not yet submitted.
**Target program:** NLnet NGI Zero Core or NGI Zero Commons Fund (security audit small-grant track)
**Typical award size:** €15,000
**Submission cadence:** NLnet has a rolling intake; targeted call windows quarterly. Operator confirms current call window before submission.
**Companion to:** `docs/security/audit-rfp-template.md`, `docs/security/audit-rfp-cover-letter.md`
**Phase:** PEER-2B of `docs/CWP-P31-PEER-COMP-2026-05.md`

---

## 0. Why NLnet specifically

NLnet has historically funded:
- Small open-source projects with public-interest mission alignment
- Security audits of edge / privacy / federation infrastructure
- Solo and small-team European projects, but increasingly US projects too (P31 is US-based; eligibility is per-call)
- Nonprofits and individuals (no corporate gatekeeping)

P31's profile is on-fit:
- Open source (`p31labs/bonding-soup`, `p31labs/andromeda`)
- Privacy-respecting by design (no telemetry; local-first; CogPass)
- Family-scale assistive tooling (NGI 'Improve internet trust' angle)
- Solo operator (matches NLnet's small-grant scale)
- Already shipping (not just a proposal)

---

## 1. Project name

**P31 Labs — Family-scale K₄ mesh substrate**

---

## 2. Abstract (≤ 300 words)

P31 Labs builds a family-scale edge-deployed substrate for assistive AI personas, K₄ family meshes, and operator-condition-aware tooling. The substrate runs on Cloudflare Workers, serves a four-person family mesh, and exposes a public hub at `p31ca.org` that any walk-in visitor can use without an account. The stack is open source on GitHub; CI enforces a public voice doctrine, no-telemetry policy, reproducible builds, accessibility audits, and license clarity.

We are requesting funding for a **third-party security audit** of seven deployed surfaces (~19K LOC + ~1K prompt-text across `simplex-v7`, `passkey`, `k4-personal`, the local command center, the Ollama persona prompt boundaries, the Cognitive Passport, and the donate-api Worker). The audit will be commissioned from one of: Trail of Bits, NCC Group, Cure53, Doyensec, or Open Privacy Research Society. The full report will be published per Signal Foundation cadence at `https://p31ca.org/security`.

This audit is the central deliverable of Phase 2 of our public CWP `CWP-P31-PEER-COMP-2026-05`. Phase 1 (transparency layer) shipped 2026-05-02 and includes the public roadmap, code of conduct, security advisory framework, accessibility baseline, manifesto, and reproducible-build gate. Phase 2 makes the *external* verification of those internal commitments possible.

P31 Labs, Inc. is a Georgia 501(c)(3)-pending nonprofit (EIN 42-1888158, incorporated 2026-04-03). One unpaid operator (founder W. Johnson) does the work; no salaries are sought from this grant.

---

## 3. Have you been involved with projects or organizations relevant to this project before?

The operator has been the sole engineer on P31 Labs from incorporation through Phase 1 ship (2025-09 → 2026-05). Prior software engineering experience: [operator fills in — career summary]. Open source publishing began with the P31 substrate.

---

## 4. Requested support

| Item | Amount |
|------|--------|
| Third-party security audit (vendor TBD per RFP) | €13,000 |
| Operator time for remediation (10% of award) | €1,500 |
| Public-report production (typesetting, hosting) | €500 |
| **Total** | **€15,000** |

---

## 5. Compare your own project to existing or historical efforts

The peer comparison is documented in detail in `docs/CWP-P31-PEER-COMP-2026-05.md` §3 (Mozilla, Signal, Apple, Meta) and §4 (24-row gap matrix). Headline:

- **Mozilla** publishes audits, does public Standards work, ships a manifesto. Practice we adopt: annual transparency report; Code of Conduct enforcement; public security advisory cadence.
- **Signal Foundation** publishes audits regularly, has a manifesto-equivalent (the "Why Signal" docs), publishes financials. Practice we adopt: third-party audit cadence; sub-medical-grade hardware-bound key storage.
- **Apple** publishes Security Research, does internal red team, ships a bug bounty. Practice we adopt: published advisory IDs (we use `P31SA-YYYY-NNN`).
- **Meta** publishes a transparency report. Practice we explicitly **reject**: telemetry / engagement copy / phone-number identity.

P31's contribution that none of them have:
- The operator-condition-aware persona system (`_shared-operator-root.txt` preamble in every prompt)
- The K₄ family mesh as architectural primitive (not a consumer messaging app — explicitly *not*)
- The Cognitive Passport (portable personalization in user-owned localStorage; never transmitted)
- A measurable public-voice doctrine (CI-enforced; not just style guide language)
- Sub-medical-grade design (deliberately not a regulated medical device)

---

## 6. What are significant technical challenges you expect to solve?

**During the audit window:**

1. Demonstrating that the **Ollama persona prompt boundary** is robust against prompt injection. The audit will test whether `p31-counsel`, `p31-triage`, and `p31-phos` (operator-confidential personas) can be tricked into:
   - Inventing a court docket
   - Producing medical advice
   - Using forbidden language patterns (submarine metaphors, urgency engagement)
   - Surveilling children
2. Validating the **WebAuthn / passkey ceremony** end-to-end against the spec, including:
   - Challenge TTL enforcement
   - Origin binding
   - Resident credential handling
   - Cross-device signal flow
3. Reviewing the **`k4-personal` Durable Object cage isolation** so no user can read another user's mesh state.
4. Reviewing the **Stripe donate flow** so donor identity is bounded by Stripe and not leaked elsewhere.
5. Stress-testing the **local command center** `execFile` whitelist for shell injection paths.

**After the audit window (operator follow-through, separately funded):**

- Remediate every P0 / P1 finding within 90 days
- Publish the full report and the remediation diff
- Re-test report from the vendor 90 days after initial report
- Update transparency report to disclose findings, remediation, and re-test outcome

---

## 7. Plan and timeline

| Phase | Work | Duration |
|-------|------|----------|
| **Pre-grant** | RFP package complete (template + cover letter + funding ask) — done 2026-05-02 | Done |
| **Grant submission** | Submit to NLnet at next open call | 1 week |
| **Grant decision wait** | NLnet typical 8-12 weeks | 8-12 weeks |
| **Vendor solicitation** | Send RFP to 3-5 vendors; pick one | 2-4 weeks |
| **Engagement signing** | Contract, scope confirmation, kickoff | 1-2 weeks |
| **Audit** | Vendor work | 4-6 weeks |
| **Operator remediation** | Address P0 / P1 findings | 4-6 weeks (overlaps re-test) |
| **Re-test** | Vendor confirms fixes | 2-4 weeks (within 90-day window) |
| **Public report publication** | Hub `/security` page + transparency report update | 1 week |

Total elapsed: ~6-9 months from grant submission. Audit work itself: ~6-12 weeks of vendor calendar.

---

## 8. Comparison to commercial alternatives (NLnet's "why public funding" question)

A commercial vendor cannot fund this audit because:
- P31 has no revenue. Fees are zero (per `andromeda/04_SOFTWARE/p31ca/ground-truth/creator-economy.json`); donations are nominal.
- The operator is one neurodivergent person with a chronic medical condition; building a sales motion to extract audit funding from a paying customer would consume more spoons than the work itself.
- The substrate is family-scale; it does not have a "10x growth" story to attract VC. (We consider this a feature.)

Public funding (NLnet, OTF, family foundations) is the correct mechanism because the *output* of this audit is a public good: a more trustworthy substrate that other family-scale nonprofits can adopt and audit themselves.

---

## 9. Letters of support (planned)

The operator will solicit letters of support from:

- [Family / academic reference, neurodivergent advocacy connection]
- [Open source maintainer who knows the operator's work]
- [Future: prior NLnet grantee who has worked with the audit vendor]

Letters are not in this draft; they will be attached at submission.

---

## 10. Open questions for NLnet

(Operator should remove these before submission; they are notes for the agent / operator review pass.)

1. Confirm 2026 call windows align with our Phase 2 timeline.
2. Confirm US-based applicants are eligible for the call we target.
3. Clarify whether NLnet prefers to disburse in tranches (typical: 50% on signing, 30% mid-engagement, 20% on report publication).
4. Confirm whether NLnet's SBIR-style milestone reports are required.

---

*Funding ask draft 1.0.0 — 2026-05-02. Companion to `docs/CWP-P31-PEER-COMP-2026-05.md` PEER-2B. Operator review required before submission.*
