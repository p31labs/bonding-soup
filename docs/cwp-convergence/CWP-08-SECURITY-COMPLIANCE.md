# CWP-08 — Security + compliance (p31ca + home)

**Id:** `P31-CONVERGE-08-SECURITY`  
**Status:** **ONGOING** (recurring gate — not a one-time “CLOSED”)

## Objective

Every release that touches **Workers, deps, CORS, or static headers** runs the **documented** bar: p31ca `npm run security:check`, allowlist updates, PQC test gate, Semgrep (reporting), SCA suppressions reviewed. **Edge** document: `p31ca/docs/EDGE-SECURITY.md`.

## In scope

- `security/worker-allowlist.json` before new Worker name deploys.
- `docs/P31-ENGINEERING-STANDARD.md` + `ENTERPRISE_QUALITY` (Andromeda) for binary/secrets.
- Access / Cloudflare WAF: document **bypasses** (e.g. public GET) in ops runbook, not in chat only.
- Weekly `p31-security` workflow: triage; don’t let P0s drift.

## Out of scope

- SOC2 audit; full pen test (external).

## Production convergence (recurring)

- [x] `npm run security:check` in p31ca on hub PRs that touch public or Workers (run in CI and before deploy when scope warrants).
- [x] `npm run release:public` or `p31:all` for full stack when operator cuts release.
- [x] New Worker: `security:workers` + allowlist + PR checklist item (discipline, not a single close date).

**Enables:** 01, 03, 04, 05, 06 (all need this bar when their surface changes).

### How to treat CWP-08 in planning

- **Do not** mark this package **CLOSED** on a calendar date. Instead, count **passing** `security:check` on the **release** you care about, and file issues for P0’s.

---

*Ongoing: 2026-04-28 — status clarified as perpetual gate; same checks as `AGENTS.md` + `docs/SECURITY-RUNBOOK` (p31ca) on each relevant ship.*
