# CWP-P31-PHASE-D-2026-02: Education E3+ · Node Zero · Hygiene

**Type:** Controlled Work Package (continuation)  
**Predecessor:** `CWP-P31-DEPLOY-2026-02` (closed), `CWP-P31-PHASE-D-2026-01` Tracks A & B (closed in production)  
**Date:** 2026-04-28  
**Status:** OPEN

---

## 0. Executive summary

**Done before this CWP (do not re-litigate):** Hub single source of truth (legacy `legacy-mvp-hub.html` removed, `301` → `/`), passkey **Worker** at `andromeda/04_SOFTWARE/p31ca/workers/passkey/`, `connect.html` CAGE **LIVE**, home alignment + egg-hunt + ADR updated, `npm run p31:converge` as parallel gate, production deploy with **verify** bar.

**This package:** (1) **Track C** — E3+ education portal behind policy + engineering gates; (2) **Track D** — Node Zero firmware milestones in parallel, hardware-bound; (3) **Hygiene** — reduce repo friction (stale PRs, optional merge settings) without weakening security.

**Hard rule:** no E3 runtime code until **policy block** in §1 is written and frozen for v1. Engineering may spike designs or ADRs, not production PII.

---

## 1. Track C — E3+ education portal

**Normative plan:** `docs/PLAN-P31-LABS-EDUCATION-SITE.md` (E0–E2 shipped; E3+ gated).

### 1.1 Policy block (operator — one sitting)

Answer briefly; store in repo (e.g. `docs/EDU-E3-POLICY-2026-01.md` or ADR) when frozen:

| # | Question | Why it blocks code |
|---|----------|--------------------|
| 1 | **Youth / COPPA-style posture** — out of scope (13+ only), no accounts under 13, or verifiable parent consent? | Drives `subject_id` schema, copy, and whether E3 is public-only. |
| 2 | **Data location** — progress only in **IndexedDB** (local-first), only **D1/DO** at edge, or hybrid? | Schema + Worker scope + retention story. |
| 3 | **Auth path** — passkey **only** for E3, or passkey + optional email recovery (different Worker surface)? | Extends or stays separate from `workers/passkey/`. |
| 4 | **PII surface** — what fields may ever hit Workers (name, email, cohort id)? | D1 table design, privacy policy pointer. |
| 5 | **“Done” for E3 v1** — e.g. “one signed-in user completes one module and sees persisted progress in two browsers” (define acceptance). | Stops scope creep. |

**Gate:** C3 code opens only when §1.1 is committed in git (short doc, not a chat-only decision).

### 1.2 Engineering phases (after §1.1)

| Phase | Deliverable | Verify |
|-------|-------------|--------|
| **C0** | ADR or short design: routes, Worker name, bindings, **no** secrets in static | `verify:ground-truth` if routes added; `security:workers` if new Worker |
| **C1** | D1/DO schema + migration story; read-only `GET` health from Worker (optional) | `wrangler` dry-run; allowlist row |
| **C2** | E3 portal static shell: `/education/portal/*` or as designed; passkey client uses same-origin ` /api/passkey/*` | Manual + e2e when ready |
| **C3** | Progress write path + RLS/authorization in Worker; rate limits | `security:check`, no credentialed CORS `*` for auth routes |

**Convergence with rest of P31:** extend `p31-alignment.json` derivations; run **`npm run release:public`** (root) for hub + security bar when C ships with hub changes.

**Composer prompt:** generate **after** §1.1 is in-repo — one prompt for C0–C1 design, a second for C2–C3 implementation, to keep reviewable PRs.

---

## 2. Track D — Node Zero (parallel)

**Reality check:** Firmware lives **outside** this p31ca monorepo (ESP-IDF / LVGL). No shared `verify` with Pages.

**Milestones (unchanged intent):** NZ-01 display → NZ-02 touch → NZ-03 audio → NZ-04 combined → NZ-05 P31 chrome.

**CWP process:** one milestone per work session; human flash + device proof; log commit hash in `docs/` or hardware log if you keep one.

**Optional:** single “node-zero pointer” in `p31ca` (registry `RESEARCH` + docs link) — only if you want the hub to reflect a firmware **release**, not every WIP.

---

## 3. Hygiene & friction (this sprint, low risk)

| Item | Action |
|------|--------|
| **Andromeda stash** | `cd andromeda && git stash list` — `drop` if WIP is obsolete |
| **Stale PRs** | Triage #57, #16, #33, #34 (close, rebase+merge, or convert to draft) — goal: open PRs = active work |
| **Auto-merge** | Org/repo: **Settings → General → Allow auto-merge**; branch rules: require checks, optional merge queue; PRs **Update branch** when `main` moves |
| **Umbrella doc** | Update `CWP-P31-PHASE-D-2026-01` header to **“Tracks A–B closed — see 2026-02”** when you touch it (optional) |

**Security note:** auto-merge and merge queue **do not** bypass required checks; they remove click friction after CI is green.

---

## 4. Program dependency (updated)

```
Policy §1.1  ──►  C0 design  ──►  C1–C3 build  ──►  deploy + glass
     │
     └── (parallel) Track D Node Zero — no dependency on C
```

---

## 5. Definition of done (this CWP)

- **Track C:** §1.1 in repo; E3 v1 acceptance met or explicitly deferred to **CWP next** with a written reason.
- **Track D:** At least one milestone (e.g. NZ-01) **verified on device** or explicitly blocked with a single-line reason (hardware, time).
- **Hygiene:** Stale PRs triaged (closed or active); stash cleared or documented.
- **Bar:** `npm run verify` (root) and `p31:converge` (with passkey skip for speed if offline) when touching home automation scripts.

---

## 6. References

- `docs/PLAN-P31-LABS-EDUCATION-SITE.md`  
- `andromeda/04_SOFTWARE/p31ca/workers/passkey/README.md`  
- `docs/P31-ENGINEERING-STANDARD.md`, `andromeda/04_SOFTWARE/p31ca/docs/SECURITY-RUNBOOK.md`  
- `CWP-P31-PHASE-D-2026-01.md` (historical A/B detail)

---

*Next Composer action:* **(1)** Write `docs/EDU-E3-POLICY-2026-01.md` (or ADR) with §1.1 answers → **(2)** request **Composer prompt: Track C0–C1** (design + ground-truth/security hooks only).
