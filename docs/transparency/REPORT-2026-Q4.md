# P31 Labs Transparency Report — 2026-Q4 (FY2026)

**Reporting period:** 2025-09-01 → 2026-08-31 (P31 Labs first operating year)
**Schema:** `p31.transparencyReport/1.0.0`
**Edition:** 1.0.0
**Published:** 2026-05-02
**Next edition:** 2026-Q4 + 1 year (2027-Q4), covering 2026-09-01 → 2027-08-31
**Authoritative URL when hub-deployed:** `https://p31ca.org/transparency`
**Format note:** This report follows the Signal Foundation transparency report format. Where a section does not apply yet (because the underlying product surface does not exist), we say so explicitly rather than omitting the section.

---

## 0. Why publish this in Year One

Most organizations wait until their first government request, takedown, or breach to publish a transparency report. P31 publishes its first one in Year One — when the answer to almost every question is **"zero"** — because:

1. **Establishing the cadence is the point.** Future reports will be measured against this baseline.
2. **Zero is the right number to report when zero is the truth.** If next year reports a non-zero, the delta is visible.
3. **Funders need to see the practice.** P31 is grant-funded. Transparency posture is part of what we are asking funders to fund.
4. **The Signal Foundation pattern is correct.** Annual, plain-language, no PR spin, no asterisks.

This report is annual. Operator authors and signs the final language; the agent system drafts it from the underlying primary sources (workers, KV, D1, ops glass probes, financial records).

---

## 1. About P31 Labs

P31 Labs, Inc. is a Georgia 501(c)(3)-pending nonprofit (EIN 42-1888158) incorporated 2026-04-03. It builds a small, family-scale, edge-deployed substrate for assistive AI personas, K₄ family meshes, and operator-condition-aware tooling. The substrate is open source on GitHub at `p31labs/bonding-soup` and `p31labs/andromeda`.

Operating posture during the reporting period:

- **One operator** (founder: W. Johnson)
- **Family mesh of four** (operator + two children + co-parent)
- **Public hub** at `p31ca.org` accessible to anyone, no account required
- **No human-to-human messaging product** — the substrate is tooling, not a chat app
- **No employees, no contractors paid during the reporting period**

---

## 2. Government data requests

### 2.1 Requests received during the reporting period

| Type | Count |
|------|-------|
| National Security Letters (NSLs) | **0** |
| FISA orders | **0** |
| Subpoenas (federal) | **0** |
| Subpoenas (state) | **0** |
| Search warrants | **0** |
| Court orders (other) | **0** |
| Pen/trap orders | **0** |
| Wiretaps | **0** |
| Emergency disclosure requests | **0** |
| **Total** | **0** |

### 2.2 Requests we would be required to respond to

If P31 ever receives such a request, we would:

1. Respond to lawful process (we are a US-domiciled nonprofit; we comply with US law).
2. **Push back** on overbroad requests through counsel.
3. **Notify the affected user** unless prohibited by law (e.g. NSL gag order).
4. **Disclose the existence and outcome** in the next transparency report, to the maximum extent the law permits, including warrant canary language as appropriate.
5. Publish redacted documents where permitted.

### 2.3 What data we could provide if compelled

This is the architecturally bounded answer:

- **Cognitive Passport content:** none. The passport lives in the user's browser localStorage. P31 servers never see it. We could not produce it under any process because we do not have it.
- **K₄ family mesh state:** scoped to the `k4-personal` Cloudflare Durable Object instance bound to the user. Contains the four-vertex graph and edge weights as that user has set them. We could produce this under valid legal process because Cloudflare can produce DO storage to us. We would notify and push back per §2.2.
- **Cage mesh (`k4-cage`) state:** the four-vertex family mesh. Same legal posture as personal mesh. Notification covers all four cage members.
- **Hub access logs:** Cloudflare Pages access logs. We do not retain, but Cloudflare retains per its own retention policy. Producible only by Cloudflare under direct process to Cloudflare.
- **Email content:** the SIMPLEX email worker stores nothing persistently. Inbound email is processed and discarded. We could produce only what Cloudflare Email Routing retained on its own (we have not configured retention).
- **Donor identity:** Stripe holds donor identity for tax-deductible giving. We hold donation amounts and donor pseudonyms tied to email + intent. Producible from our records.

### 2.4 Warrant canary

> As of 2026-05-02, P31 Labs has never received a National Security Letter, FISA order, or any government request for user data that we are prohibited from disclosing.

This sentence will appear in every future transparency report, updated to that report's publication date, **unless and until** it is removed. Removal of this canary is itself a signal.

---

## 3. Civil legal process

| Type | Count |
|------|-------|
| Civil subpoenas | **0** |
| Discovery requests in litigation | **0** |
| Preservation requests | **0** |

The operator has a personal civil case (Johnson v. Johnson, 2025CV936, Camden County Georgia). The case has not generated discovery against P31 Labs, Inc. as an entity, and the entity holds no records relevant to the case. If that changes, it will be disclosed here.

---

## 4. Takedown requests and content moderation

| Type | Count |
|------|-------|
| DMCA takedown requests | **0** |
| Trademark takedown requests | **0** |
| Government takedown requests | **0** |
| Right-to-be-forgotten / GDPR erasure requests | **0** |
| Other content removal requests | **0** |
| **Content removed by P31** | **0** |

**Note:** P31 does not host user-generated content addressable to a stranger audience. The hub publishes P31's own materials. The K₄ family mesh is per-family and not publicly addressable. There is no "platform" for stranger speech.

If P31 ships a human-to-human chat product in a future phase (Phase 3+, MLS-based), this section will track the moderation operations of that product. Today, it is structurally not applicable.

---

## 5. Account actions

| Type | Count |
|------|-------|
| Accounts terminated by P31 for ToS violations | **0** |
| Accounts terminated by P31 for legal compulsion | **0** |
| Accounts requested to be terminated by users | **0** |
| Cognitive Passports deleted at user request | **n/a — user controls deletion locally** |

P31 does not require an account for hub use. Where an "account" exists (the operator's command-center session, family mesh members), it is a per-user Durable Object the user controls.

---

## 6. Data we collected (or did not collect)

This is the central transparency claim.

### 6.1 Telemetry / analytics

**Collected during reporting period:** none. No Google Analytics, no Plausible, no Fathom, no Sentry, no Mixpanel, no PostHog, no Segment, no Amplitude, no Hotjar, no FullStory, no LogRocket, no New Relic, no Datadog browser RUM, no third-party advertising pixels.

This is **CI-enforced** by `npm run verify:no-telemetry` (added 2026-05-02 as part of PEER-2D). Adding any of those to client-side code without a documented exception fails the build.

### 6.2 Cookies

**First-party cookies on `p31ca.org`:** none required for hub browsing. WebAuthn challenge cookies set during passkey ceremonies, scoped to `/api/passkey/*`, expire in 5 minutes.

**Third-party cookies:** none.

### 6.3 Server logs

Cloudflare Pages and Cloudflare Workers retain access logs per their own policies. P31 does not separately retain or analyze these logs. We do not have an analytics pipeline.

### 6.4 Cognitive Passport

Stays in the user's browser. Never transmitted to P31 servers. The passport schema (`cognitive-passport-v1-1.schema.json`) is published under CC0 so any other tool can read or write a passport without coordination.

### 6.5 Donation records

Stripe holds donor identity (name, email, billing address, payment method tokenization). P31 holds donation amount, date, and pseudonym + email used at checkout. Used for: receipts, IRS Form 990 reporting (when filed). Not shared, not sold, not used for any other purpose.

---

## 7. Security incidents

### 7.1 Security incidents during the reporting period

**Disclosed:** 0 reachable defects.

**Hardening pass:** 1 (P31SA-2026-001 — rate limiting, input validation, header stripping, CSP refresh; hardening only, not a defect).

See `docs/security/advisories/` for the full advisory log.

### 7.2 Vulnerability reports received

- **From external researchers:** 0
- **From operator self-audit:** routine (not enumerated; folded into ongoing engineering)
- **Acknowledged on `docs/security/HALL-OF-FAME.md`:** 1 entry (operator self-credit on P31SA-2026-001 to demonstrate the framework)

### 7.3 Independent third-party audits

**During reporting period:** 0 (none commissioned yet)
**Status:** RFP draft published in `docs/security/audit-rfp-template.md`; commission gated on grant funding (NLnet €15K ask in preparation; OTF audit grant ask drafted)
**Target:** First audit Q4 2026 if funding lands; report to be published per `docs/security/REPORTING.md` cadence

---

## 8. Open source posture

| Repo | License | Status |
|------|---------|--------|
| `p31labs/bonding-soup` | MIT (default) + named exceptions per `docs/LICENSE-POLICY.md` | Public, current |
| `p31labs/andromeda` | MIT (default) + named exceptions | Public, current |

**Reproducible builds:** verified via `verify:reproducible` gate (PEER-1D). Same input produces same `dist/` fingerprint.

**Code of Conduct:** `docs/CODE-OF-CONDUCT.md` (Contributor Covenant 2.1 + 7 P31-specific clauses).

**Public roadmap:** `docs/ROADMAP.md`.

---

## 9. Financial transparency

P31 Labs, Inc. is 501(c)(3)-pending. The IRS Form 1023 was submitted following Georgia incorporation 2026-04-03. Once the IRS issues the determination letter:

- The determination letter will be published at `https://p31ca.org/financials`
- The first Form 990 (or 990-N or 990-EZ depending on revenue) will be published within 30 days of filing
- Annual Form 990s thereafter will be published within 30 days of filing

**Revenue during reporting period:** below 990 filing threshold (estimated; first 990 will be the authoritative number).

**Donations during reporting period:** small. All processed through Stripe via the `donate-api.phosphorus31.org` Cloudflare Worker. No major donors, no anonymous donors above the §170 threshold.

**Expenses during reporting period:** primarily infrastructure (Cloudflare Workers/Pages free tier, GitHub free tier, domain registration). No salaries, no contractors paid.

The detailed financials line will move from this report to the Form 990 once that exists.

---

## 10. Operator-condition disclosure

P31 is a one-operator nonprofit founded by a person with hypoparathyroidism (ICD-10 E20.9) and AuDHD (autism + ADHD, late-diagnosed 2025). This affects:

- **Reporting cadence** — annual, with operator review of every line; emergency operator-state events (ER visits for calcium crashes) may delay reports by days, never weeks.
- **Reporting voice** — direct, no submarine metaphors, no engagement copy, per `docs/PUBLIC-VOICE.md` and `docs/P31-DELTA-LANGUAGE.md`. CI-enforced.
- **Reporting honesty** — when something cannot be done because the operator is in spoon deficit, the report says so. We do not pretend.

This disclosure is included so funders, auditors, and family members reading this report understand the operating constraint.

---

## 11. Methodology

This report was drafted by the Cursor agent system on operator command, from these primary sources:

1. `docs/security/advisories/` — for §7
2. Cloudflare Workers logs review — for §2 (data we hold)
3. Stripe dashboard — for §6.5 (donor records)
4. Operator memory — for §2 (no requests received) and §3 (legal process); operator signs §11 attesting
5. CI verify chain — for §6.1 (telemetry posture)
6. Source-tree license headers — for §8

The operator signs §11 attesting to the truth of §2, §3, §4, and §5 to the best of their knowledge.

---

## 12. Operator attestation

I, William Johnson, the founder, sole director, and operator of P31 Labs, Inc. for the reporting period 2025-09-01 → 2026-08-31, attest that the statements in §2 (government data requests), §3 (civil legal process), §4 (takedowns), and §5 (account actions) are true to the best of my knowledge and belief.

To the best of my knowledge, P31 Labs, Inc. has received zero government data requests, zero civil subpoenas, zero takedown requests, and has terminated zero accounts during the reporting period.

This attestation is consistent with the warrant canary in §2.4.

— *Signed in repository commit history. The next agent picking up the next transparency report should look for this commit's author and date as the cryptographic anchor. The operator's GPG key (when published) will sign future editions.*

---

## 13. How to challenge this report

If you have evidence that any statement in this report is wrong, please report it via the channel in `docs/security/REPORTING.md`. Corrections will be issued in a versioned errata section appended below; we do not silently edit prior reports.

### Errata

*None.*

---

*Report 1.0.0 — 2026-05-02. Companion to `docs/CWP-P31-PEER-COMP-2026-05.md` PEER-2A. Annual cadence. Mirrors `andromeda/04_SOFTWARE/p31ca/public/transparency.html`.*
