# How to report a security issue to P31 Labs

**Companion:** `docs/CWP-P31-PEER-COMP-2026-05.md` PEER-1C; Manifesto Commitment C1; `docs/security/advisories/README.md`.

If you believe you have found a security issue in any P31 Labs product — the home repository, the p31ca hub, the Cloudflare Workers, the Cognitive Passport, the local Ollama fleet, the Andromeda monorepo, or any subdomain we operate — we want to hear from you. This page tells you how, what to expect, and what we will and will not do in return.

---

## What counts as a security issue

A defect is a security issue if any of the following apply:

- It allows an unauthorized party to read, modify, or destroy data they should not have access to
- It allows denial of service against a P31 surface by means a casual user could not reasonably trigger
- It defeats or weakens a cryptographic primitive, an authentication path, or a key-management routine we ship
- It exposes user data (a Cognitive Passport, a mesh state, a session) outside the user's intended audience
- It is a defect in a vendored library or shipped dependency that affects users of our deployed products

If you are not sure whether something is a security issue, report it anyway and we will sort it. There is no penalty for reporting a non-issue, and we would much rather hear about a borderline case than miss a real one.

---

## How to report

### Preferred: GitHub Security Advisory (private)

Open a private security advisory at:

```
https://github.com/p31labs/bonding-soup/security/advisories/new
```

This is the preferred channel. It is private to the maintainers, gives you a thread to respond on, and produces a commit-history record we can both reference. If you do not have a GitHub account, see the email channel below.

If the issue is in the Andromeda monorepo (the p31ca hub, the workers, the design tokens), use:

```
https://github.com/p31labs/andromeda/security/advisories/new
```

We monitor both.

### Email

Once `security@p31labs.org` is live (target: end of Q3 2026), email is the second channel. Until then, the operator-direct address is:

```
will@p31ca.org
```

Subject line should start with `[security]`. We will respond within 72 hours.

If you need encrypted email, we can move to a Signal conversation or to a PGP-protected exchange — say so in your first message and we will set it up.

### In-person crisis or imminent threat

If the security issue is being actively exploited and you have evidence that a user's safety is at immediate risk, **call your local emergency services first** (911 in the United States), then notify us via the channels above.

---

## What to include in your report

The more of the following you include, the faster we can triage:

1. **What you were trying to do** when you encountered the issue
2. **What you observed** — error messages, unexpected behavior, unauthorized access, etc.
3. **Steps to reproduce** — as specific as you can make them
4. **The URL or commit hash** of the affected surface
5. **Your environment** — browser and version, operating system, time of day, IP region (only if relevant)
6. **A proof-of-concept** if you have one (snippet of code, screenshot, video — whatever helps)
7. **Your preferred name and contact** for credit on the Hall of Fame, or `anonymous` if you would rather not be named

You do not need to provide a fix, a CVSS score, or a patched version. Those are our job. Your job is to tell us what you saw.

---

## What you can expect from us

| Stage | Response time | Action |
|-------|---------------|--------|
| Acknowledgment | Within 72 hours | We confirm we received your report |
| Triage decision | Within 7 days | We tell you whether we treat it as a security issue, what severity we assign, and our intended timeline |
| Fix or update | Variable, depending on severity | Critical and High: prioritized over feature work; Moderate and Low: scheduled in the regular cadence |
| Public disclosure | Within 30 days of the fix shipping | A `P31SA-YYYY-NNN` advisory is committed to `docs/security/advisories/` with credit to you (unless you asked for anonymity) |

We aim to be in touch every step. If a week passes with no update from us, please ping the same thread.

---

## What we will not do

- We will not retaliate against a good-faith reporter. Reporting is a service to the community.
- We will not threaten legal action against a researcher who followed the guidelines on this page.
- We will not require you to sign a non-disclosure agreement before we will engage. We may ask you to delay public posting until our fix is out — this is a request, not a contract.
- We will not pay a bounty in cash today (we do not have the funds; the Hall of Fame is the recognition path until grants land — see `docs/security/HALL-OF-FAME.md`).
- We will not ignore a report. Every report gets a response.

---

## Safe harbor

If you follow the guidelines on this page — report through one of the channels above, do not access data beyond what is necessary to demonstrate the issue, do not destroy or alter data, do not pivot from the original surface to other systems, and give us a reasonable opportunity to fix the issue before public posting — we will treat your research as authorized. We will not pursue legal action against you, we will not refer the matter to law enforcement, and we will defend your right to do this work in good faith.

This is the same safe harbor language adopted by Mozilla, Signal, and the [Disclose.io](https://disclose.io) common framework. We endorse it and will defend it.

---

## Out of scope

The following are not in scope for this reporting channel:

- **Issues in third-party services we use but do not operate** (Cloudflare itself, Stripe Checkout, GitHub, Google Fonts, npm). Report those to the vendor directly. If a third-party issue is reachable through a P31 surface in a way that increases its impact, that part **is** in scope and we want to hear it.
- **Operator-personal devices** (the Chromebook, the iPhone, the VW Golf laptop). The home folder lives on those devices, but the surface for this reporting channel is the published code and deployed services, not the operator's hardware.
- **The Discord server** (none today; structure when shipped will get its own moderation channel separate from security reports).
- **General bug reports** that are not security issues. Use the public issue tracker on the relevant GitHub repository for those.

---

## After the fix

Once the fix ships, we publish a `P31SA-YYYY-NNN` advisory in `docs/security/advisories/`. It includes:

- A plain-language description of the defect
- Affected versions and fixed-in commit/version
- Credit to you (with whatever name and contact you asked us to use)
- References to the commits that fix the defect

You will see a draft of the advisory before we publish — you can request changes to the credit text or the description. We have final say on the technical content, but we will not publish anything you would object to.

---

## A note from the operator

The operator running this channel today is one person (W. Johnson), with hypoparathyroidism and AuDHD. On a low-spoon day a 72-hour acknowledgment turns into 96 hours. If you are waiting on a response that is overdue, please ping again — it is not personal, it is bandwidth. We are working on getting more humans onto the security desk and will name them on this page when they join.

---

*Page version 1.0.0 — 2026-05-02. Companion to `docs/security/HALL-OF-FAME.md`, `docs/security/advisories/README.md`, and `.github/SECURITY.md`.*
