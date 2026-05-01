# P31 Labs, Inc. — Legal Counsel Review Checklist
**Organization:** P31 Labs, Inc.  
**EIN:** 42-1888158  
**State of incorporation:** Georgia domestic nonprofit corporation  
**Incorporated:** 2026-04-03  
**501(c)(3) status:** Application filed 2026-04-30 (Form 1023-EZ, Pay.gov tracking ID 281TLBGO) — PENDING  
**Review document prepared:** 2026-05-01  
**Review document version:** 1.0  

---

## Purpose

This document is a structured pre-launch review checklist for the five public legal/compliance pages published by P31 Labs, Inc. at p31ca.org. It is designed for use by the pro-se operator or, if retained, outside counsel, to verify that the legal copy is accurate, complete, and appropriate before public market launch.

**This checklist is not a substitute for legal advice.** Items marked "Needs counsel" should be reviewed by a licensed Georgia attorney before relying on the relevant page.

---

## Document Inventory

| Document | URL | File path | Effective date |
|---|---|---|---|
| Terms of Use | https://p31ca.org/terms | `public/terms.html` | 2026-05-01 |
| Privacy Policy | https://p31ca.org/privacy | `public/privacy.html` | 2026-05-01 |
| Security Disclosure Policy | https://p31ca.org/security | `public/security-disclosure.html` | 2026-05-01 |
| Accessibility Statement | https://p31ca.org/accessibility | `public/accessibility.html` | 2026-05-01 |
| Machine-readable contact | https://p31ca.org/.well-known/security.txt | `public/.well-known/security.txt` | — |

---

## Terms of Use — Review Checklist

- [ ] **Org identity is accurate.** Legal name "P31 Labs, Inc.", EIN 42-1888158, Georgia domestic nonprofit corporation, incorporated 2026-04-03.
- [ ] **Services scope is complete.** All public surfaces (p31ca.org, bonding.p31ca.org, donate-api.phosphorus31.org, k4-personal/cage/hubs/agent-hub Workers) are listed and described accurately.
- [ ] **501(c)(3) pending language is correct.** The terms do NOT call P31 Labs tax-exempt. Donations are stated as not deductible until a determination letter is issued.
- [ ] **No professional advice disclaimer is accurate.** Cognitive Passport is described as a self-documentation tool, not a clinical or diagnostic instrument. BONDING is described as educational. k4 mesh is described as technical infrastructure.
- [ ] **Payments section accurately describes the Stripe flow.** Card data never touches P31 Labs systems. P31 Labs receives only limited transaction metadata from Stripe.
- [ ] **Acceptable use covers the actual threat surface.** Authorization bypass, DoS testing, Ed25519 session tampering, misrepresentation are all enumerated.
- [ ] **Age / COPPA posture is consistent with privacy policy.** Under-13 posture is stated. k4-agent-hub family dock is correctly characterized as an operator-side API requiring guardian authorization.
- [ ] **Open-source license notice is accurate.** GitHub org URL (github.com/p31labs) is correct. Notice correctly states licenses are per-repository.
- [ ] **Intellectual property section correctly states marks are unregistered.** No registered trademark claims are made.
- [ ] **Warranties disclaimer uses all-caps.** Georgia and most other states require conspicuousness for disclaimer of implied warranties to be enforceable.
- [ ] **Limitation of liability uses all-caps.** Same conspicuousness requirement.
- [ ] **Governing law is Georgia.** Confirm this is appropriate for the operator's circumstances. *Note: venue/forum selection clauses in consumer contracts can be challenged; counsel should assess whether this is enforceable against non-Georgia users.*
- [ ] **30-day informal dispute resolution notice period.** Confirm this is consistent with any applicable state consumer protection requirements.
- [ ] **Contact address and email are correct.** will@p31ca.org, p31ca.org.
- [ ] **Effective date matches the published date.** 2026-05-01.

**Open issues / Terms:**
- The limitation of liability cap ($50 or 12 months of payments) has not been reviewed by counsel. For a nonprofit with no paid consumer subscriptions, the practical effect may be zero; confirm this is sufficient and enforceable.
- Forum selection clause targeting Georgia courts — confirm this is appropriate and not unconscionable given the user base.

---

## Privacy Policy — Review Checklist

- [ ] **"Not yet tax-exempt" is stated in terms; privacy does not make tax status claims.** Verify no tax exemption claim appears in privacy copy.
- [ ] **Static page localStorage description is accurate.** localStorage/sessionStorage are client-side only, never transmitted. This was verified against actual implementation.
- [ ] **Cloudflare as separate data controller is correctly disclosed.** Cloudflare logs are attributed to Cloudflare's own policy, not P31 Labs's.
- [ ] **k4-personal / k4-cage / k4-hubs data description is accurate.** Operator-provided content in Cloudflare KV / Durable Objects, under authenticated operator account. Verify against actual Worker implementation.
- [x] **k4-agent-hub session data description is accurate.** Session tokens, Ed25519 key fingerprints, skill usage logs, dock session metadata. 24h operator (SESSION_TTL_SECONDS env, default 86400) / 8h family dock (28800s hardcoded in handleFamilyDock). TTLs verified against dock-protocol.js:193 and index.js:378.
- [ ] **BONDING multiplayer data description is accurate.** Room codes and molecular snapshots in KV with TTL. No account required. Verify against bonding Worker implementation.
- [ ] **Stripe transaction metadata description is accurate.** P31 Labs receives amount, timestamp, Stripe customer ID. Card numbers never touch P31 Labs. Verify against Stripe dashboard and donate-api Worker code.
- [ ] **Google Fonts IP disclosure is present.** IP address sent to Google when font loads. Cloudflare CDN may cache. Both conditions stated.
- [ ] **"No advertising trackers" claim is accurate.** Verify that no analytics scripts (GA4, Meta Pixel, Hotjar, etc.) are loaded on any p31ca.org page.
- [ ] **No newsletter / CRM / email marketing list claim is accurate.** Verify no email capture forms on any surface.
- [ ] **Data retention table is accurate.** All categories covered: localStorage, k4 mesh content, agent sessions (24h/8h), BONDING rooms, donation records (7 years), Cloudflare logs.
- [ ] **User rights section covers access, correction, deletion, restriction.** Operator-controlled data deletable via API. Other requests via email.
- [ ] **GDPR posture is appropriate.** Policy states no formal EU representative and no systematic targeting of EEA users. *Needs counsel: if any future marketing activities target EEA users, a more complete GDPR compliance posture (including SCCs, formal representative, ROPA) will be required.*
- [ ] **Contact email and subject line convention are correct.** will@p31ca.org, subject [privacy].
- [ ] **Effective date is 2026-05-01.**

**Open issues / Privacy:**
- GDPR: If user base materially includes EEA residents, the good-faith posture in the current policy may be insufficient. Obtain counsel review before any EU-targeted outreach.
- CCPA / California: If California residents use the services and P31 Labs meets CCPA thresholds (unlikely for a small nonprofit at launch, but worth monitoring), additional disclosures may be required.
- 501(c)(3) determination: When a determination letter is issued, update the privacy policy to reflect any change in how donation data is handled for tax acknowledgment purposes.

---

## Security Disclosure Policy — Review Checklist

- [ ] **In-scope surface list is complete and accurate.** All five primary surfaces listed. GitHub org listed.
- [ ] **Out-of-scope list is specific enough to prevent confusion.** Cloudflare platform issues, Stripe issues, social engineering, DoS testing, scanner output without verification — all excluded.
- [ ] **Acknowledgment SLA is reasonable and achievable.** 5 business days. Confirm operator can actually monitor will@p31ca.org within that window.
- [ ] **90-day coordinated disclosure timeline is stated.** Consistent with common industry practice (Google Project Zero model).
- [ ] **Safe harbor language is appropriately scoped.** P31 Labs authorizes research within the policy; explicitly does not authorize access to third-party systems. Confirm language is not over-broad.
- [ ] **No bounty promise is made.** Policy correctly states no paid bounty program. No implied financial obligation.
- [ ] **/.well-known/security.txt file exists and is consistent with this policy.** *Action required: verify security.txt file is published and contains matching contact info and policy URL.*
- [ ] **GitHub Security Advisory option is mentioned.** Private advisory submission via GitHub is listed as an alternative channel.

**Open issues / Security:**
- Verify /.well-known/security.txt is actually deployed and reachable at https://p31ca.org/.well-known/security.txt.
- Consider adding a PGP public key to security.txt for encrypted report submission if sensitive vulnerability reports are received.

---

## Accessibility Statement — Review Checklist

- [ ] **Conformance claim is "partial" — not "full".** Do not overstate conformance. Current claim is "partial conformance with WCAG 2.1 Level AA." This is accurate.
- [ ] **WCAG version and level are stated.** WCAG 2.1, Level AA.
- [ ] **Known limitations are honestly documented.** BONDING 3D canvas, legacy demo pages, reduced-motion, skip navigation, touch target size — all listed.
- [ ] **Assistive technology testing list is honest.** NVDA + Firefox, VoiceOver + Safari, keyboard-only, Windows High Contrast, 200% zoom. TalkBack not tested — stated.
- [ ] **Third-party content is disclosed.** Tailwind CDN, Google Fonts, Stripe Checkout, Cloudflare challenge pages — all noted with appropriate scope limitations.
- [ ] **Feedback contact is provided.** will@p31ca.org, subject [accessibility], with specific information requested in a report.
- [ ] **Alternative format offer is made.** Statement offers to provide content in alternative format if the barrier is blocking a task.
- [ ] **No ADA compliance claim is made.** The statement does not claim full ADA Title III compliance. *Needs counsel: as a nonprofit operating a public-facing website, P31 Labs should assess its ADA Title III obligations as it grows.*

**Open issues / Accessibility:**
- ADA Title III applicability to nonprofits operating websites has been litigated inconsistently. Counsel should assess exposure as the user base grows.
- BONDING 3D canvas: the lack of screen-reader-accessible fallback for molecular data is a known material gap. Prioritize a data-table fallback.
- Consider a formal accessibility audit (automated + manual) by a third-party accessibility specialist once budget allows.

---

## Georgia-Specific Items

- [ ] **Legal name matches Secretary of State filing.** "P31 Labs, Inc." — verify against SOS record.
- [ ] **EIN is correct.** 42-1888158 — verify against IRS CP575E determination letter.
- [ ] **Governing law clause specifies Georgia.** Terms of Use, Section 11.
- [ ] **Nonprofit status disclosure is accurate.** All public pages avoid claiming tax-exempt status. 501(c)(3) application is described as pending.
- [ ] **Georgia Charitable Solicitations Act — C-100 registration. ⚠️ ACT BEFORE PROMOTING DONATE LINK WIDELY.**
  - **Statute:** O.C.G.A. § 43-17-1 et seq. Requires registration before soliciting charitable contributions from Georgia residents.
  - **Exemption (O.C.G.A. § 43-17-9):** Organizations that received less than **$25,000** in total contributions during the immediately preceding fiscal year AND do not compensate any person primarily to conduct solicitations are exempt from registration.
  - **P31 Labs basis for exemption (2026):** Incorporated 2026-04-03. First fiscal year ends 2026-12-31. Prior fiscal year contributions = $0 (no prior year). No professional fundraiser employed. P31 Labs likely qualifies for the small-org exemption **for the current fiscal year.**
  - **Required action (choose one):**
    1. **Document exemption:** Write a one-page internal memo stating the exemption basis (prior-year contributions < $25K; no compensated solicitor), keep it in entity records. Re-assess at 2026-12-31 — if total 2026 contributions approach $25K, file C-100 before January 1, 2027.
    2. **File C-100 preemptively:** $35 fee at sos.georgia.gov/corporations-divisions/charities. Eliminates ambiguity; valid if 501(c)(3) is pending (file as "pending exemption").
  - **Verify current threshold** at sos.georgia.gov/corporations-divisions/charities — confirm $25K figure has not changed since this review (2026-05-01).
- [ ] **Georgia nonprofit dissolution rules.** Confirm that the Articles of Incorporation contain appropriate language regarding distribution of assets upon dissolution consistent with IRS 501(c)(3) requirements (assets must go to another 501(c)(3) or government entity).
- [ ] **Board of directors disclosure.** Articles name 3 directors. Board has not formally convened as of this review. Confirm that public-facing documents do not make representations about board actions that have not occurred.

---

## COPPA Checklist (Children's Online Privacy)

- [ ] **No consumer-facing collection of personal information from under-13 users.** Static pages use only localStorage (client-side). Workers require operator authentication. BONDING multiplayer requires no account.
- [ ] **"Not directed to children under 13" statement is present in Terms.** Terms Section 7.
- [ ] **"Not directed to children under 13" posture is present in Privacy.** Privacy Section 3.
- [ ] **k4-agent-hub minor vertex activation requires guardian Ed25519 signature.** This is a technical gate. Verify that the Worker implementation actually enforces this and cannot be bypassed.
- [ ] **Cognitive Passport: no server-side data collection.** The generator runs entirely in the browser. No personal data is transmitted to P31 Labs. Verify this is true in the deployed code (no fetch/XHR calls on form submission).
- [ ] **Deletion procedure for inadvertent under-13 data is stated.** Privacy Section 3 states we will delete upon notification. Ensure this can actually be executed operationally.
- [ ] **No age gate or age verification mechanism is implemented.** The policy relies on parental supervision rather than a technical age gate. This is an acceptable COPPA posture for a site not directed to children, but must be consistent with actual site design.

**Open issues / COPPA:**
- If BONDING or any future feature adds chat, user profiles, or persistent identifiers for casual/anonymous users, re-evaluate COPPA exposure immediately.
- The "family cage wire" feature (k4-agent-hub family dock) is the highest-risk area for COPPA. Confirm the guardian token gate is implemented and enforced in code, not just described in documentation.

---

## Payment Processing Checklist

- [ ] **Stripe Checkout is used for all donation card processing.** P31 Labs does not handle card data directly. No custom card form on our servers.
- [ ] **PCI DSS scope.** Because all cardholder data entry occurs on Stripe's hosted page, P31 Labs is outside PCI DSS cardholder data scope. Confirm with Stripe's compliance documentation if needed.
- [ ] **501(c)(3) pending language is consistent across terms, privacy, and any donation page.** Donations are not deductible until a determination letter is received.
- [ ] **Stripe account is in the name of P31 Labs, Inc.** Verify that the Stripe account is linked to EIN 42-1888158 and not to a personal account or prior fiscal sponsor.
- [ ] **Stripe webhook secret is properly configured and not exposed in source code.** Verify donate-api Worker does not log or expose the webhook signing secret.
- [ ] **Refund policy is stated.** Terms Section 5 states donations are non-refundable except at P31 Labs's discretion or as required by law.
- [ ] **Donation receipts.** Once 501(c)(3) is granted, donor receipts must comply with IRS substantiation requirements. Prepare a receipt template in advance.

---

## AI / Agent Services Checklist (k4-agent-hub)

- [ ] **k4-agent-hub is described as a technical operator-side API.** Not a consumer product. Terms and Privacy both describe it as such.
- [ ] **Ed25519 session authentication is described accurately.** Key fingerprints (not private keys) stored in Durable Objects. Sessions expire. Private keys never leave the user's device.
- [ ] **Skill usage logs are disclosed.** Privacy Section 2b states skill usage logs are stored per-vertex in Durable Objects SQLite.
- [x] **Session expiry is accurate.** 24h operator (86400s default, overridable via SESSION_TTL_SECONDS env), 8h family dock (28800s hardcoded). Verified against dock-protocol.js and index.js:378 on 2026-05-01.
- [x] **LLM routing disclosure.** Privacy Section 2b now describes the Ollama default (locally-operated) and the operator-configurable remote endpoint path. Users of remotely-configured instances are directed to consult the instance operator's configuration. *Action complete 2026-05-01. If a specific third-party LLM API (e.g. Anthropic, OpenAI) is configured in production, add that provider name to the Privacy Policy Third-Party Services section.*
- [ ] **No "AI advice" claims.** No public-facing page claims that agent outputs constitute professional advice of any kind.
- [ ] **Automated decision-making.** *Needs counsel: If k4-agent-hub makes automated decisions with legal or significant personal effects (outside the current technical API scope), GDPR Article 22 and analogous laws may apply.*
- [ ] **Child vertices in k4-agent-hub.** Guardian token gate is described in Terms and Privacy. Confirm implementation enforces this technically and does not rely solely on documentation.

---

## Open Issues Requiring Counsel Review

The following items are flagged as genuinely uncertain and should be reviewed by a licensed Georgia attorney, preferably with nonprofit and technology practice experience, before launch:

1. **Georgia Charitable Solicitations Act registration (C-100). ⚠️ NEAR-TERM ACTION.** P31 Labs appears to qualify for the O.C.G.A. § 43-17-9 small-org exemption (prior-year contributions < $25K; no compensated solicitor) — but exemption must be documented in entity records. Choose: (a) write a one-page exemption memo and re-assess at 2026-12-31, or (b) file C-100 preemptively ($35). Do not promote the donate link in a paid/broad campaign until one of these is complete. See Georgia-Specific Items section above for full analysis.

2. **Initial board meeting. ⚠️ NEAR-TERM ACTION.** Articles name 3 directors (W.Johnson-001, Joseph Tyler Cisco, Brenda O'Dell). Board has not formally convened. Hold the meeting using `docs/board/BOARD-MEETING-001-AGENDA.md` — it covers officer election, 501(c)(3) and SAM ratification, C-100 authorization, successor designation, and legal-counsel-review gate flip. Minutes must be kept. This is what closes the gap between actions taken and board authorization on record.

3. **ADA Title III.** Website accessibility obligations for nonprofits under Title III of the Americans with Disabilities Act are fact-specific and have been litigated inconsistently across circuits. Counsel should assess current exposure and a remediation roadmap.

4. **GDPR.** The current policy takes a minimal good-faith posture. If marketing activities ever target EEA users, a more robust GDPR compliance framework will be required, including potentially a formal EU representative and Standard Contractual Clauses.

5. **LLM / AI routing data flows.** Privacy policy updated 2026-05-01 with Ollama/remote-endpoint disclosure. If a named third-party LLM API (Anthropic, OpenAI, etc.) is configured in production, add that provider to the Privacy Policy Third-Party Services section before exposing to non-operator users.

6. **Forum selection clause enforceability.** The Terms of Use Georgia forum selection clause may not be enforceable against non-Georgia consumers in all jurisdictions. Assess whether mandatory arbitration is appropriate at scale.

7. **Limitation of liability cap.** The $50 / 12-month payments cap has not been reviewed by counsel. Confirm it is enforceable in Georgia for a nonprofit.

8. **501(c)(3) determination letter.** When issued: update all public "pending" donation language, register with Candid/GuideStar, begin issuing IRS substantiation language on receipts, confirm retroactive effective date (should be back to April 3, 2026 incorporation).

---

## Sign-Off Block

| Role | Name | Date | Signature |
|---|---|---|---|
| Operator / Pro-se review | | | |
| Outside counsel (optional) | | | |
| Technology review (code accuracy) | | | |

**Notes:**

_Use this block to document when the review was completed, any items that were resolved during review, and any items that were accepted as open risks with documented rationale._

---

*End of review document. P31 Labs, Inc. — EIN 42-1888158. This document is an internal compliance checklist and is not legal advice.*
