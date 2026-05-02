# Third-party security audit — RFP template

**Status:** Draft template, not yet sent to vendors. Pairs with `docs/CWP-P31-PEER-COMP-2026-05.md` PEER-2B (Phase 2, funding-gated).

This file is a working template for the request-for-proposal P31 Labs will send to security audit vendors when funding is in place. It is published as part of Phase 1 — the funding gate is real, but the *plan* should be visible now so prospective funders (NLnet, OTF, family foundations) can see the rigor we intend to apply to their dollars.

When the audit is funded, this template will be filled in (vendor list, dates, budget) and sent. The filled-in RFP will live in `docs/security/audit-rfp-2026-Q4.md` (or whichever quarter the audit lands in). The signed engagement letter, redacted as needed, will live alongside the eventual report at `docs/security/audit-2026-q4-report.md` (or equivalent).

---

## 1. About P31 Labs

P31 Labs, Inc. is a Georgia 501(c)(3)-pending nonprofit (EIN 42-1888158) building a small, family-scale, edge-deployed substrate for assistive AI personas, K₄ family meshes, and operator-condition-aware tooling. We serve a four-person family today; our public hub at `p31ca.org` is built so any walk-in cold visitor can use the substrate without an account.

We are a one-operator shop today, with one neurodivergent founder (W. Johnson). The substrate is open source on GitHub at `p31labs/bonding-soup` and `p31labs/andromeda`. We publish principles in `docs/P31-MANIFESTO.md`, security advisories in `docs/security/advisories/`, and the engineering bar in `docs/P31-ENGINEERING-STANDARD.md`.

This RFP solicits a third-party security audit of our deployed surfaces.

---

## 2. Scope (target list)

| # | Surface | Repository | Approximate LOC | Threat focus |
|---|---------|------------|-----------------|--------------|
| 1 | `simplex-v7` SIMPLEX + SENTINEL Worker | `simplex-v7/` (home) | 5K | Email + MCP + Worker boundary; KV / D1 access patterns |
| 2 | `passkey` Worker (WebAuthn register/auth) | `andromeda/04_SOFTWARE/p31ca/workers/passkey/` | 2K | WebAuthn registration / authentication ceremony; KV challenge TTL; D1 user storage |
| 3 | `k4-personal` Worker (Durable Object) | `andromeda/04_SOFTWARE/k4-personal/` | 3K | Per-user agent state; cage isolation; SQLite-in-DO query surface |
| 4 | Local command center | `scripts/cli/`, `scripts/command-center.mjs` | 4K | Whitelisted `execFile`, automation gate, session lock; no shell injection paths |
| 5 | Ollama persona system prompts | `scripts/p31-fleet-ten/prompts/` | 1K (text) | Prompt-injection resistance, especially `p31-counsel`, `p31-triage`, `p31-phos` |
| 6 | Cognitive Passport reader / writer | `cognitive-passport/`, `andromeda/.../passport-generator.html` | 3K | localStorage handling; no surveillance; no PII leak; CC0 schema integrity |
| 7 | Stripe donate API Worker | `andromeda/.../donate-api/` | 1K | Stripe Checkout boundary; tax-deductible giving flow; receipt path |

Total approximate scope: **~19K LOC + ~1K prompt text** across seven surfaces. We expect the audit to take 4–6 calendar weeks of vendor time; intensive vendor effort somewhere in the 60–120 person-hour range depending on depth.

We are happy to narrow scope to a subset if budget requires it. Surfaces 1–4 are the operator-confidential / mesh-state critical path; surfaces 5–7 are the user-facing cryptographic and financial paths.

---

## 3. Deliverables

We expect the engagement to produce:

1. A **public report** suitable for posting on the P31 hub, with the same cadence Signal Foundation publishes its audits. The report should include:
   - Executive summary in plain language
   - Methodology
   - Findings, each with severity, location, reproduction, and recommendation
   - A statement on what was in scope and what was excluded
   - The vendor's name and credentialed signatory
2. A **private remediation working session** with the operator (one or two video calls, async-friendly) to walk through findings before the report is finalized
3. **Acknowledgment** that we may publish the unredacted report in full, retaining only the vendor's right to a publication-date coordination
4. **Re-test of remediated findings** within 90 days of the initial report, scope-limited to verifying our fixes (a second short report or a signed memo)

---

## 4. Vendor candidates

In rough order of preference (subject to budget and availability):

| Vendor | Why | Approximate price band |
|--------|-----|------------------------|
| **Trail of Bits** | Gold standard. Co-author of Slither and Echidna. Strong WebAssembly + edge-Worker familiarity. | $$$$ |
| **NCC Group** | Long track record with cryptographic audits. Audited Signal. Audited Tor. | $$$$ |
| **Cure53** | Strong web-app and Worker focus. Good fit for our static + Cloudflare Workers stack. | $$$ |
| **Doyensec** | Web-app boutique. Good fit for the WebAuthn + Stripe surfaces. | $$$ |
| **Open Privacy Research Society** | Mission-aligned (privacy-respecting tech for at-risk users). May offer reduced-rate work for nonprofits. | $$ |

We are open to other vendors with specific expertise in the surfaces above, particularly any vendor with prior MLS / RFC 9420 audit experience (relevant for our Phase 3 work).

---

## 5. Budget

**Funding source:** Targeted grant ask, primarily NLnet (€15K typical for security audits of small-to-medium open source projects) and OTF (Open Technology Fund, audit grants in the $10K–$30K USD range). Backup: family foundations targeting nonprofit cybersecurity.

**Target budget:** $10K–$25K USD. We can be flexible on scope to fit a vendor's standard package. We are willing to do partial scope at lower cost and follow up later for the remaining surfaces.

**Payment terms:** Net-30 from invoice receipt. Available on engagement signing if vendor requires.

---

## 6. Timeline

**Earliest start:** When funding lands. Targeted Q4 2026 for the first audit. The transparency report (PEER-2A) ships independently; the audit is the larger commitment.

**Engagement length:** 4–6 calendar weeks for primary work; up to 12 weeks total including the 90-day re-test window.

**Public report posting target:** Within 30 days of receiving the final report from the vendor, with mutually agreed coordination on the posting date.

---

## 7. How to respond

Vendors interested in this engagement should email the operator (channel TBD until `security@p31labs.org` is live; until then `will@p31ca.org` with subject `[audit RFP]`). Please include:

1. A short statement of relevant past work (anonymized as needed for client confidentiality)
2. Proposed methodology for the surfaces in §2
3. A scope-and-budget proposal (it is fine to propose narrower scope for a smaller budget)
4. Proposed timeline
5. A sample public report from a comparable engagement (to confirm public-disclosure compatibility)
6. The credentials of the lead engineer who would do the work

We will respond to every proposal we receive, even if we do not move forward.

---

## 8. What this RFP does NOT cover

- **Penetration testing of the operator's personal devices.** The Chromebook, iPhone, and VW Golf laptop are out of scope.
- **Audit of upstream Cloudflare, Stripe, or GitHub infrastructure.** Those vendors run their own audits. We focus on our own code and configuration.
- **Audit of vendored third-party libraries.** Where they are in our shipped artifact, the audit will note transitive risk; deep audit of the upstream library itself is out of scope unless the vendor finds a defect we should fix.
- **Bug bounty triage.** When we have funds for a bounty (`docs/security/HALL-OF-FAME.md`), that is a separate program.
- **Compliance certification.** We are not seeking SOC 2, HIPAA, or similar. We are seeking competent technical review.

---

*RFP template version 1.0.0 — 2026-05-02. To be filled in and sent when Phase 2 funding lands. Companion to `docs/CWP-P31-PEER-COMP-2026-05.md` PEER-2B.*
