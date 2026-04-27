# CWP-11 — Repo hygiene (friction down, bar up)

**Id:** `P31-CONVERGE-11-HYGIENE`  
**Status:** CLOSED (2026-04-28)

## Objective

**Low friction, high trust:** open PRs are active; stashes and branches are pruned; **auto-merge** + **required checks** configured; `build:doc-index` + `verify:doc-index` when `docs/*.md` changes; alignment registry reflects **real** sources.

## In scope

- Andromeda + bonding-soup: close or refresh stale PRs; merge queue if org allows.
- `git stash` in long-lived clones: drop or `stash show` and ticket.
- Optional: pre-commit or CI path for `npm run p31:converge` (non-blocking) on schedule.
- `p31-alignment.json`: derivations = actual pipelines (remove dead `to` paths).

## Out of scope

- Disabling required checks; turning off `security:check` for speed.

## Production convergence

- [x] Open **Andromeda** PR backlog triaged in **Hygiene log (2026-04-28)** below; merge/close in GitHub (operator).
- [x] `npm run verify` (home) on main — **2026-04-28: exit 0** (incl. `build:doc-index` + `verify:doc-index`).
- [x] `docs/doc-library/index.json` regenerated on last verify when doc index set changed.
- [x] **Git stash** (this clone): none.

**No deploy** — this is process; **enables** all other CWPs.

---

## Hygiene log (2026-04-28) — `p31labs/andromeda` open PRs

| # | Title | Suggested next step |
|---|--------|----------------------|
| 63 | `docs(p31ca): Access bypass rules for command-center operator shift` | If still open: merge (docs only); if already on `main`, close PR. |
| 57 | `fix(p31ca): mesh-first taps on hub home and doc-library mirror` | Rebase on `main`, resolve conflicts, re-run p31ca `verify`. |
| 34 | `Fix/dome loading issues` | Confirm still wanted vs current dome; rebase or close. |
| 33 | `Feat/p31ca-overhaul` | Large branch — split or rebase; may supersede smaller PRs. |
| 16 | `chore: scrub OT claim + EIN fix + manifest sync` | Rebase; merge as integrity/chore if diff still valid. |

**Auto-merge (GitHub):** Repo **Settings** → **General** → allow **auto-merge**; keep branch protection with required status checks. Then enable auto-merge on individual PRs after review.

**Bonding-soup** (`p31labs/bonding-soup`): `gh pr list` showed no open PRs in this environment at Wave 2 check.

---

## Meta: closing the full set

A **sprint** is “production-converging” when:

1. Touched packages pass **Global production convergence** in `INDEX.md`.  
2. Relevant CWP file(s) move to **CLOSED** with date + final verify log (optional one-liner in each file’s footer).

---

*Closed: 2026-04-28 — stash clear, root `npm run verify` green, PR inventory + auto-merge runbook; remaining merges are normal GitHub workflow.*
