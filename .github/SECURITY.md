# Security Policy

P31 Labs takes the security of its software and the safety of its users seriously. This file is the GitHub-facing entry point for security disclosures. The full policy lives in [`docs/security/REPORTING.md`](../docs/security/REPORTING.md).

## Reporting a vulnerability

**Preferred channel:** Open a private security advisory at:

→ <https://github.com/p31labs/bonding-soup/security/advisories/new>

For issues in the Andromeda monorepo (`p31ca` hub, Workers, design tokens):

→ <https://github.com/p31labs/andromeda/security/advisories/new>

**Email channel:** Until `security@p31labs.org` is live (target: end of Q3 2026), email the operator at `will@p31ca.org` with subject `[security]`. Encrypted email available on request.

## Acknowledgment time

We acknowledge every report within **72 hours**. We commit to a triage decision within **7 days**. See [`docs/security/REPORTING.md`](../docs/security/REPORTING.md) for the full timeline.

## Safe harbor

If you follow the guidelines in [`docs/security/REPORTING.md`](../docs/security/REPORTING.md) — report through the channels above, do not access data beyond what is necessary, give us a reasonable chance to fix before public posting — we treat your research as authorized. We will not pursue legal action and we will defend your right to do this work in good faith.

## Where we publish

Every security issue that produces a fix gets a public advisory at:

→ [`docs/security/advisories/`](../docs/security/advisories/)

Identifier scheme: `P31SA-YYYY-NNN`. First advisory: [`P31SA-2026-001`](../docs/security/advisories/P31SA-2026-001.md).

## Hall of Fame

Reporters are credited at [`docs/security/HALL-OF-FAME.md`](../docs/security/HALL-OF-FAME.md). We do not yet have funds for a paid bug bounty; recognition on the Hall of Fame and a real, dated public advisory are the recognition path until grants land.

## Supported versions

| Version | Supported |
|---------|-----------|
| Latest `main` | Yes — security fixes land on `main` and we recommend tracking it |
| Tagged releases (when published) | Yes — for the most recent two minor versions |
| Older versions | No — we do not maintain a long-term-support branch today |

For the home repository (`bonding-soup`), the working version is whatever is on `main`. There are no formal release tags as of 2026-05-02; this will change as the project matures.

---

*Policy version 1.0.0 — 2026-05-02. Companion to [`docs/P31-MANIFESTO.md`](../docs/P31-MANIFESTO.md) Commitment C1 and [`docs/CWP-P31-PEER-COMP-2026-05.md`](../docs/CWP-P31-PEER-COMP-2026-05.md) PEER-1C.*
