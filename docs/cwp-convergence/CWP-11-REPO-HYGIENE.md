# CWP-11 — Repo hygiene (friction down, bar up)

**Id:** `P31-CONVERGE-11-HYGIENE`  
**Status:** OPEN

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

- [ ] Open PR list triaged (target: < N active; your N).
- [ ] `npm run verify` (home) on clean main after big merges.
- [ ] `docs/doc-library/index.json` regenerated when markdown index set changes.
- [ ] Stash list empty or each stash has a one-line reason in a ticket/ADR.

**No deploy** — this is process; **enables** all other CWPs.

---

## Meta: closing the full set

A **sprint** is “production-converging” when:

1. Touched packages pass **§ Global production convergence** in `INDEX.md`.  
2. Relevant CWP file(s) move to **CLOSED** with date + final verify log (optional one-liner in each file’s footer).
