# P31SA-YYYY-NNN: [One-line title — plain English, no marketing]

| Field | Value |
|-------|-------|
| **ID** | `P31SA-YYYY-NNN` |
| **Title** | (one-line title — plain English) |
| **Severity** | (Critical \| High \| Moderate \| Low) |
| **Affected versions** | (commit range or version range, e.g. `bonding-soup@<= 0.1.0` or commits `abc1234..def5678`) |
| **Fixed in** | (commit hash + tag/version, e.g. `9d16fee` / `v0.1.1`) |
| **Date reported** | YYYY-MM-DD |
| **Date published** | YYYY-MM-DD |
| **Reporter** | (Name / handle / link, or `Anonymous` by reporter preference) |
| **CVE** | (CVE-YYYY-NNNNN if assigned, otherwise `None assigned`) |
| **CVSS vector** | (Optional. Available on request if not in advisory.) |

---

## Description

Plain-language explanation of the defect. What was wrong. Why it was wrong. Avoid jargon where a sentence will do.

## Impact

What the defect allowed an attacker to do. Be concrete. If the impact required preconditions (a specific user role, a specific browser, a specific configuration), name them.

## Reproduction

Either:

- **Public:** Step-by-step reproduction. Code snippets where they help.
- **Withheld until [DATE]:** Reproduction details are held until users have had time to upgrade. The full details will be published in this section on the date above.

## Mitigations (for users on affected versions)

What a user can do until they have applied the fix. Often this is "upgrade to the fixed version." Sometimes there is a configuration change or a temporary workaround that buys time.

## Fix

Link to the commit(s) that fix the defect. One-line summary of the fix approach.

- Commit `<hash>` — `<one-line summary>`

## Credit

Thanks to the reporter for finding and responsibly disclosing this issue. If the reporter wants their name on the Hall of Fame (`docs/security/HALL-OF-FAME.md`), it goes there.

## References

- Original report: (link to issue / advisory / email thread, redacted as needed)
- Related advisories: (P31SA-prior-NNN if any)
- External coverage: (links to blog posts, other vendor advisories, CVE database entries)

---

*Advisory committed to `docs/security/advisories/`. Schema: `p31.securityAdvisories/1.0.0`. See `docs/security/advisories/README.md` for the framework and `docs/CWP-P31-PEER-COMP-2026-05.md` PEER-1B for the Phase 1 work this is part of.*
