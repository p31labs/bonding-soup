# P31 Security Hall of Fame

**Schema:** `p31.securityHallOfFame/1.0.0`  ·  **Companion:** `docs/security/REPORTING.md`, `docs/security/advisories/README.md`, `docs/CWP-P31-PEER-COMP-2026-05.md` PEER-1C.

This page recognizes the people who have helped P31 Labs find and fix security issues through responsible disclosure. We do not yet have funds for a paid bug bounty (Manifesto Commitment C1; tracked in `docs/FUNDING-GATED-ACTION-ITEMS.md`). What we have is this page, real credit on the public record, and the gratitude of every family that runs on top of the substrate you helped harden.

If you reported an issue and your name is missing from this page, please ping us on the same channel as your report — credit oversights are bugs and we will fix them.

---

## How to be listed here

Report a security issue through the channels in `docs/security/REPORTING.md`. If we agree it is a security issue and we ship a fix, you get a row on this page (with whatever name, handle, and link you want us to use), unless you asked us not to publish your name.

You do not need to be a professional security researcher. You need to find a real defect and report it. That is the entire bar.

---

## Recognition policy

For each reporter we list:

| Field | Description |
|-------|-------------|
| **Name / handle** | Whatever you asked us to use. We accept real names, professional handles, GitHub usernames, or "Anonymous reporter" if you prefer not to be named at all. |
| **Advisory** | The `P31SA-YYYY-NNN` identifier of the advisory your report produced. |
| **Date** | When the advisory was published (not when you reported, to keep the timeline tied to the public record). |
| **Note** | An optional short line. Up to you. |

We do not list individual defect details on this page — those live in the advisory file. This page is the credits roll.

---

## 2026

| Reporter | Advisory | Date | Note |
|----------|----------|------|------|
| _Operator (internal review)_ | [`P31SA-2026-001`](./advisories/P31SA-2026-001.md) | 2026-05-02 | Inaugural advisory — exercised the new framework end-to-end. Defense-in-depth class, no reachable defect. |
| _(your name could go here)_ | _(advisory ID)_ | _(date)_ | _(your note, if any)_ |

---

## Future bounty

When P31 Labs has a sustained funding stream sufficient to support a modest bug bounty (the rough threshold is $5K/year of recurring donor revenue earmarked for security), we will:

1. Update `docs/security/REPORTING.md` to name the bounty amount and tier structure
2. Backport bounty payment to any qualifying past report listed here, where the reporter is reachable
3. Document the bounty in the next `docs/ROADMAP.md` quarterly update

The bounty will be modest by industry standards — we will never compete with Apple's $1M maximum or Meta's $300K maximum. We will be in the range of "real money for real work" at small-charity scale ($100–$1000 typical, depending on severity), funded entirely by donor money earmarked for the purpose.

Until then, this page is the bounty.

---

*Hall of Fame version 1.0.0 — 2026-05-02. Updates as advisories are published; no quarterly cadence required.*
