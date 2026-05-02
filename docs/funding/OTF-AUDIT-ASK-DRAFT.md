# Open Technology Fund (OTF) — security audit funding ask (draft)

**Status:** Draft. Not yet submitted.
**Target program:** OTF Security Audit Fund (or current equivalent — the program name has shifted across years; the operator confirms the current name at submission time)
**Typical award size:** USD $10,000 – $30,000
**Submission cadence:** Rolling intake; OTF's specific Security Audit and Red Team programs have varied since 2023. Confirm current openness at https://www.opentech.fund/funds/.
**Companion to:** `docs/security/audit-rfp-template.md`, `docs/security/audit-rfp-cover-letter.md`, `docs/funding/NLnet-AUDIT-ASK-DRAFT.md`
**Phase:** PEER-2B of `docs/CWP-P31-PEER-COMP-2026-05.md`

---

## 0. Why OTF specifically

OTF has historically funded:
- Tools for at-risk users (journalists, activists, dissidents — overlap with P31's "operator with a chronic condition + custody case" posture is non-trivial)
- Privacy-respecting protocols (Signal received OTF support; Tor received OTF support)
- Audits of edge-deployed cryptographic and identity infrastructure
- US-based and international applicants

P31's profile is partial-fit:
- Open source ✓
- Privacy-respecting by design ✓
- Anti-surveillance posture ✓ (no telemetry; CogPass on-device only; CI-enforced)
- At-risk user category ✓ (operator's medical condition + active civil case create real adversarial pressure on operator information posture)
- Anti-censorship: not a primary P31 mission; we focus on family-scale resilience, not circumvention

The audit ask is a natural OTF fit because OTF specifically funds independent security review for projects whose users would be harmed by a defect.

---

## 1. Project name

**P31 Labs — Family-scale K₄ mesh substrate**

---

## 2. Project summary (≤ 250 words)

P31 Labs builds a family-scale edge-deployed substrate for assistive AI personas, K₄ family meshes, and operator-condition-aware tooling. The substrate runs on Cloudflare Workers, serves a four-person family mesh including two minor children, and exposes a public hub at `p31ca.org` that any walk-in visitor can use without an account. The stack is fully open source. CI enforces public voice doctrine, no-telemetry policy, reproducible builds, accessibility audits, license clarity, and (as of 2026-05-02) a no-telemetry gate.

The operator is a neurodivergent founder with hypoparathyroidism (calcium-critical condition with serious adversarial information posture) operating under custody-related civil case pressure. P31 is therefore designed assuming the operator is a credible target for both legal and informal information requests. The substrate's architecture (no telemetry; on-device CogPass; per-user Durable Object isolation) is responsive to that threat model.

We request funding for an independent third-party security audit of seven deployed surfaces. The audit will be commissioned from a vendor with prior at-risk-user audit experience (Trail of Bits, NCC Group, Cure53, or Open Privacy Research Society). The full report will be published per Signal Foundation cadence at `https://p31ca.org/security`. The remediation diff will also be public.

P31 Labs, Inc. is a US 501(c)(3)-pending nonprofit (EIN 42-1888158).

---

## 3. Project narrative

(Operator drafts the long-form narrative here; this section borrows heavily from `docs/CWP-P31-PEER-COMP-2026-05.md` §1 and §3 and from `docs/P31-MANIFESTO.md`. Keep within OTF's word limit, currently 1500 words for Security Audit Fund applications.)

### 3.1 The problem this audit addresses

P31's substrate handles:
- A **passkey-bound family mesh** for an operator and two minor children — a defect here lets a remote attacker join a family mesh under a false identity.
- A **persona prompt system** — a defect here lets an attacker get the operator's confidential legal-drafting persona (`p31-counsel`) to invent a court docket or undermine a pro-se filing.
- A **donate Stripe boundary** — a defect here exposes 501(c)(3) donor identity.
- A **local command center** — a defect here gives shell access on the operator's primary machine.
- A **Cognitive Passport schema and reader** — a defect here lets a malicious tool inject false personalization or surveillance into a user's local device.

The operator is one person and cannot self-audit competently. The substrate is shipped to the operator's family today and to any walk-in visitor on `p31ca.org`. The audit is the missing layer.

### 3.2 At-risk user framing (OTF's hot button)

The operator is at-risk by virtue of:
- A condition (hypoparathyroidism, ICD-10 E20.9) where information distortion can lead to medical harm
- An active civil case (Johnson v. Johnson, 2025CV936) where misinformation about the operator's behavior is an existing adversarial reality
- Children in the cage who would be targets if a parent's mesh were compromised

P31 is not a tool *for* journalists or dissidents broadly, but the threat model is structurally similar: a small actor with hostile information environments, building tools that must not lie or leak.

### 3.3 What the audit will produce

Same deliverables as the NLnet ask: full public report, remediation diff, 90-day re-test, transparency-report disclosure. (See `docs/security/audit-rfp-template.md` §3 for vendor-side deliverables.)

---

## 4. Budget

| Item | USD |
|------|-----|
| Third-party security audit (vendor TBD per RFP) | $14,000 |
| Operator time for remediation (10% of award) | $1,500 |
| Public-report production (typesetting, hosting) | $500 |
| **Total** | **$16,000** |

(NLnet ask is in EUR; OTF ask is in USD; we may submit to both with non-overlapping line items if both programs invite it. Default is one funder per audit cycle.)

---

## 5. Applicant qualifications

(Operator drafts; mirrors the NLnet ask §3 with OTF-relevant emphasis on the operator's threat-model awareness and previous open-source publication.)

---

## 6. Sustainability

After the audit:
- Annual re-audit cadence is the goal (Phase 4 of the parent CWP). If self-funded by then, we proceed; if not, we apply again.
- Internal ongoing security work continues at zero cost (operator + agent system + CI gates).
- Findings get public advisories with `P31SA-YYYY-NNN` IDs.
- The next transparency report (annual) carries the audit results forward.

This is not a one-and-done ask. It is the **first** audit. The cadence is what we commit to.

---

## 7. Risks

| Risk | Mitigation |
|------|------------|
| Vendor unavailability | RFP goes to 5 vendors; we are flexible on dates. |
| Findings reveal a defect with active exploit window | Coordinate publication date with vendor; 90-day standard CVD window applies; rotate keys and roll the substrate before publication if needed. |
| Operator spoon deficit during remediation window | Remediation budget is line-itemed; operator may extend by funding allocation; emergency remediation may be deferred to next agent cycle if operator is unavailable. |
| Award too small for full scope | RFP §2 is structured so we can drop surfaces 5-7 and audit 1-4 (operator-confidential / mesh-state critical path) within smaller budget. |

---

## 8. Letters of support (planned)

(Same as NLnet ask §9.)

---

## 9. Open questions for OTF

(Operator removes before submission.)

1. Confirm Security Audit Fund (or successor program name) is currently accepting applications.
2. Confirm acceptance of US 501(c)(3)-pending status (we are pending IRS determination but operating as a Georgia nonprofit).
3. Confirm OTF's preference for sole-operator vs. multi-person applicants.
4. Confirm OTF's standard milestone-reporting cadence.
5. Confirm OTF accepts fully public reports (some programs have an embargoed-reports-only requirement; we cannot accept that — public report is non-negotiable).

---

*Funding ask draft 1.0.0 — 2026-05-02. Companion to `docs/CWP-P31-PEER-COMP-2026-05.md` PEER-2B. Operator review required before submission.*
