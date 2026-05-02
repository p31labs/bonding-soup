# P31 Security Advisories

**Schema:** `p31.securityAdvisories/1.0.0`  ·  **Stable URL pattern:** `docs/security/advisories/P31SA-YYYY-NNN.md`  ·  **Companion:** `docs/CWP-P31-PEER-COMP-2026-05.md` PEER-1B; Manifesto Commitment C1.

This directory contains every public security advisory issued by P31 Labs. The format borrows the structure of Mozilla Foundation Security Advisories (MFSA), Apple Security Releases, and Signal's published security audits — adapted to the P31 scale.

We will **fix in public**. The same posture applies to a security bug as to any other bug: it gets a dated, identified, public record. The only thing we do not publish is the exact reproduction details before the fix is in users' hands — and we say so when that delay applies.

---

## Identifier scheme

```
P31SA-YYYY-NNN
```

- **`P31SA`** — the prefix. Stands for "P31 Security Advisory."
- **`YYYY`** — the calendar year the advisory was published.
- **`NNN`** — a zero-padded three-digit sequence, restarting at `001` each year.

Examples:

- `P31SA-2026-001` — first advisory of 2026
- `P31SA-2026-014` — fourteenth advisory of 2026
- `P31SA-2027-001` — first advisory of 2027 (sequence resets)

---

## What gets an advisory

We file an advisory for any of the following:

1. A defect that allows an unauthorized party to read, modify, or destroy data they should not have access to
2. A defect that allows denial of service against a P31 surface (worker, hub page, edge endpoint) by means a casual user could not reasonably trigger
3. A defect in a cryptographic primitive, key-management routine, or authentication path
4. A defect in a P31 dependency that we ship to users (vendored library, transitive npm dependency that ships in `dist/`) once we have applied the fix locally

We **do not** file an advisory for:

- Bugs that affect only the operator's local development environment and are not reachable from any network endpoint
- Hardening improvements that close a theoretical class of attack with no known reachable instance (those go to the changelog and the engineering standard)
- Dependency CVEs that we have suppressed in `andromeda/04_SOFTWARE/p31ca/security/audit-suppressions.json` with a documented non-applicability rationale (the suppressions file is itself the public record)

---

## Severity

We use a four-level severity scale, modeled on Mozilla Foundation Security Advisories:

| Severity | Meaning |
|----------|---------|
| **Critical** | Allows execution of attacker code without user interaction, or full read/write access to a target's data |
| **High** | Allows attacker code execution with user interaction, or unauthorized access to a target's data with non-trivial preconditions |
| **Moderate** | Allows escalation of privilege, leak of partial information, or denial of service that requires meaningful effort to trigger |
| **Low** | Theoretical impact, or impact requiring physical access, or impact gated by the user's own configuration choices |

Each advisory states the severity explicitly. We do not use CVSS scores in the advisory body — they create false precision at our scale — but we will provide a CVSS vector on request from a user or auditor.

---

## Disclosure timeline

- **Day 0:** Bug report received (via the channels in `docs/security/REPORTING.md`).
- **Day 1–7:** Triage, severity assignment, fix scoping. The reporter is acknowledged within 72 hours.
- **Day 7–30:** Fix development and testing.
- **Day of fix release:** Advisory file is committed to this directory with the full description, the affected versions, the fix commit hash(es), and credit to the reporter (or "anonymous reporter" if they prefer).
- **Day of fix release + 14 days:** Reproduction details may be published if they were withheld; the advisory file is updated with a link.

For Low-severity advisories with no exploit risk, we may publish the advisory on the same day as the fix without delay. For Critical and High, we may delay publication briefly to give downstream consumers (other family meshes who may have forked the code) time to upgrade.

---

## Advisory template

Copy `_template.md` (in this directory) as `P31SA-YYYY-NNN.md` and fill in the fields. Required fields:

- **ID** (matches filename without the `.md`)
- **Title** (one line, plain English; not a marketing headline)
- **Severity** (Critical | High | Moderate | Low)
- **Affected versions** (commit range or version range)
- **Fixed in** (commit hash + version, where applicable)
- **Date published**
- **Reporter** (name, handle, or "anonymous" by reporter preference)
- **Description** (what the defect is, in plain language)
- **Impact** (what the defect lets an attacker do)
- **Mitigations** (what users can do until they upgrade, if anything)
- **Credit** (acknowledgment to the reporter, with their preferred contact link)
- **References** (links to commits, related CVEs, related advisories, and external coverage)

---

## Where this directory is referenced

- The Manifesto (`docs/P31-MANIFESTO.md`) — Commitment C1
- The Code of Conduct (`docs/CODE-OF-CONDUCT.md`) — §6 reporting channel
- The Roadmap (`docs/ROADMAP.md`) — Q3 2026 PEER-1B
- The Hall of Fame (`docs/security/HALL-OF-FAME.md`) — credits per advisory
- The Reporting page (`docs/security/REPORTING.md`) — the "what happens after I report" section links here
- `.github/SECURITY.md` — the GitHub-facing reporting policy

---

## Verifying an advisory

To verify an advisory is the file we say it is, compare its commit hash:

```sh
git log --pretty=format:"%H %s" -- docs/security/advisories/P31SA-YYYY-NNN.md
```

The commit message for an advisory file should match the advisory title.

---

*Schema and template version 1.0.0 — 2026-05-02. Updates to the framework itself bump this README's edition; individual advisories use their own date in the filename.*
