# Education E3+ — policy decisions (CWP-01 P0)

**Status:** Draft — **complete the “Decision” lines and merge** before E3+ application code. **Normative program:** `docs/PLAN-P31-LABS-EDUCATION-SITE.md`. **CWP:** `docs/cwp-convergence/CWP-01-EDU-E3-PORTAL.md`.

## 1. Data custody — who holds student / learner data?

**Decision:** _TBD._  
*Options to resolve:* e.g. k4-personal Durable Object only, shared D1, both with clear boundary, or other — document where PII may land and retention.

## 2. Authentication — which mechanisms are in scope for v1?

**Decision:** _TBD._  
*Examples:* passkey only; passkey + magic link; open read + optional passkey for progress.

## 3. Age / minors — what posture applies?

**Decision:** _TBD._  
*Examples:* COPPA out-of-scope by design; COPPA-compliant flow; 13+ only; adult learners only.

## 4. Content licensing — what license applies to published curriculum and user-generated content defaults?

**Decision:** _TBD._  
*Examples:* CC-BY-SA; proprietary; mixed (specify per surface).

## 5. Progress persistence — where does progress live?

**Decision:** _TBD._  
*Examples:* local-first only; edge (DO/D1); both with sync rules.

---

## Sign-off

| Role | Name | Date | Notes |
|------|------|------|--------|
| Product / operator | | | |
| Engineering | | | |

**Next:** after decisions are filled, CWP-01 P1 (ADR: routes, Worker name) may proceed. Do not ship E3+ portal auth or PII without this doc completed.
