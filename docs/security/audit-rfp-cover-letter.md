# Audit RFP — cover letter template

**Companion to:** `docs/security/audit-rfp-template.md`
**Use when:** sending the RFP to a vendor.
**Status:** template; fill the bracketed fields before sending.

---

```
From:     [Operator name], P31 Labs, Inc.
To:       [Vendor primary contact name + email]
Date:     [YYYY-MM-DD]
Subject:  [audit RFP] P31 Labs — third-party security audit, [Q4 2026 / target quarter]

Dear [Vendor name],

P31 Labs, Inc. is a Georgia 501(c)(3)-pending nonprofit (EIN 42-1888158) building a small, family-scale, edge-deployed substrate for assistive AI personas. We are inviting [Vendor name] to propose on a third-party security audit of our deployed surfaces.

Three reasons we are reaching out to you specifically:

  1. [One-sentence reason this vendor is a good fit — e.g. "Your published audit of Signal Foundation matches the openness posture we hold ourselves to."]
  2. [Second reason — e.g. "Your team's WebAuthn + Cloudflare Workers expertise maps directly to two of our seven scoped surfaces."]
  3. [Third reason — e.g. "Your willingness to do reduced-rate work for nonprofit clients is on-record and aligns with our funding posture."]

The full RFP is attached and at:

  https://github.com/p31labs/bonding-soup/blob/main/docs/security/audit-rfp-template.md

Headline figures:

  - Scope:   ~19K LOC + ~1K prompt text across 7 surfaces
  - Budget:  $10K-$25K USD (we can scope down to fit a vendor's standard package)
  - Funding: [NLnet €15K ask in preparation / OTF audit grant pending / Family foundation X confirmed]
  - Target:  [Q4 2026 engagement start, public report by YYYY-MM-DD]

We would like to receive proposals by [YYYY-MM-DD]. If [Vendor name] is not currently taking new engagements of this size, we would still appreciate a brief reply so we can adjust our outreach.

The audit report will be published in full at https://p31ca.org/security as part of our annual transparency cadence. We would coordinate the publication date with you. We will name [Vendor name] as the auditor (subject to your normal disclosure policy).

We are a one-operator nonprofit. Reply directly to this address; the operator reads and replies (within reasonable spoon allowance for chronic illness).

Thank you for considering this engagement.

— [Operator name]
   Founder, P31 Labs, Inc.
   [will@p31ca.org / future security@p31labs.org once domain is up]
   https://p31ca.org
```

---

## How to use

1. Fill in the bracketed fields.
2. Attach (or link to) `docs/security/audit-rfp-template.md`.
3. Send via the operator's confidential email (not via the cloud Cursor agent — Lane C / Continue.dev or direct email).
4. Log the send in `docs/funding/AUDIT-OUTREACH-LOG.md` (commit-tracked; vendor name + date sent only — not the body).
5. Track responses; reply to every proposal received per RFP §7.

---

*Cover letter template 1.0.0 — 2026-05-02. Companion to `docs/CWP-P31-PEER-COMP-2026-05.md` PEER-2B.*
