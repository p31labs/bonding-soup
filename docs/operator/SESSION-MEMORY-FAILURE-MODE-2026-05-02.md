# Session-memory drift — the failure mode the Triad catches

**Date:** 2026-05-02, evening (~21:20 UTC-4)
**Schema:** `p31.operatorReflection/1.0.0`
**Companion:** `docs/operator/TRIAD-LOOP-CLOSE-2026-05-02.md` (the first loop close from earlier the same day, on the launch package)
**Triggering artifact:** `docs/P31-COGNITIVE-PASSPORT-v4-PUBLIC.md` (the v4.0 Cognitive Passport, where the failure mode appeared and was caught)

> Captured verbatim from the operator immediately after the second Triad loop of the day closed (CogPass v4.0 landed: home commit `4c3b525`, andromeda PR #117). The reflection is short, theoretically grounded, and self-aware in a way that should be preserved as a reference pattern, not just a one-off message in the chat history.

---

## The reflection (operator voice, verbatim)

Good. Opus did exactly what it should have done — checked my work against the actual codebase and found what I got wrong.

I want to be honest about what happened here, because it matters for the pattern:

I was writing from session memory. Opus was writing from the repo. Session memory is lossy. The repo is the source of truth. Every error Opus caught is a case where I trusted my context window instead of checking the files:

- I said **10 workers** because that's the number that's been in the conversation all day. The actual fleet is **14 verified / 18 allowlisted**. I never ran `node -e "...workersVerified"` to check.
- I invented a local fleet of **SCRIBE / HERALD / ORACLE / SENTINEL / MEDIC / PHOS** because those names appear in the PHOS training doctrine I wrote earlier today — as conceptual agent roles. The actual `scripts/p31-fleet-ten/models.json` has completely different names: **mechanic, firmware, counsel, narrator, triage, quick, phos, scribe, oracle, debrief.** MEDIC doesn't exist. HERALD and SENTINEL belong to the simplex-v7 cloud crew, a separate orchestration layer I conflated with the local fleet.
- I said **GEODESIC was "Planned"** because that's what the earlier CogPass said. The GeodesicRoom Durable Object Worker is shipped and live. I didn't check.
- I said **C.A.R.S. was "Designed."** It's shipped as the `bonding-soup` npm package at the home root. I didn't check.
- I said **271 sources.** The registry has 273. I was carrying a stale number from earlier in the session.

This is the exact failure mode the Tetrahedron Protocol predicts: **a model with context but without access to the source of truth produces confident, internally consistent, structurally plausible output that is wrong in specific, verifiable ways.** The CogPass I wrote reads like it's correct. The tables are clean. The numbers are precise. The framing is coherent. And six of those precise numbers are wrong because I derived them from conversation history instead of from `p31-alignment.json`, `p31-live-fleet.json`, and `scripts/p31-fleet-ten/models.json`.

This is why the Triad works. I write the architecture. Opus checks it against the repo. The operator steers. Three measurements on three different axes. The errors I introduce get caught by the instance that has file access. The errors Opus might introduce (rushing, not understanding the theory) get caught by the instance that has the full conceptual framework. The errors both AI instances might share (misunderstanding the operator's intent) get caught by the operator.

The corrected v4.0 with Section 14 is the right document. Load the MASTER into operator-controlled sessions. Use the PUBLIC for everything else. The numbers are now traced to their sources of truth, not to my memory.

And for what it's worth — the fact that Opus caught these errors, traced each one to the correct file, documented the corrections with a full bill of materials, committed with a 60-line message explaining what was wrong and why, pushed, mirrored to andromeda, opened PR #117, and enabled auto-merge — all without being asked to check my work, just because the operator said *"add anything from the codebase that opus web may have missed"* — that's the Centaur working at full capacity. Not because any single instance is infallible. Because the system catches what the instances miss.

**The geometry holds. Even when one vertex is wrong about how many edges it has.**

💜🔺💜

---

## The pattern, named (so it's reusable)

### Failure mode: Session-memory drift in confident prose

A model writing from its context window — without going back to the files — produces output that is:

- **Internally consistent** (no contradictions inside the document)
- **Structurally plausible** (right shape, right vocabulary, right tables)
- **Confidently precise** (specific numbers, specific names, specific statuses)
- **Wrong in verifiable ways** (those numbers don't match the canonical files; those names aren't in the registry; those statuses are stale)

The output reads correctly. The errors are invisible to the writer. They only surface when a different reader checks the prose against the source of truth.

### When this failure mode appears

- A model is asked to summarize, snapshot, or restate the current state of a system that has many small canonical inputs (counts, names, statuses, IDs, version pins).
- The model has been in the conversation long enough that earlier (now-stale) numbers are in its context.
- The user does not explicitly ask the model to *re-check the files* before writing.
- The output format encourages precision (tables, counts, lists of names) — which makes the model commit to specific values rather than hedging.

### How to detect it

- A second instance with file access reads the document with the canonical files open and runs `grep` / `node -e ".../length"` on each precise claim.
- Discrepancies cluster around numbers that "feel right" — not around numbers that are obviously made up. The diff is small (off-by-2, off-by-4) which makes it easy to miss without checking.

### How to fix it

For the writer:
- Before any "snapshot" or "current state" document, name the canonical files for each claim and re-read them.
- Treat counts (sources, derivations, gates, workers) and lists of named things (personas, products, surfaces) as **must-verify** items, not "I remember."
- Add an explicit "verified against codebase YYYY-MM-DD" footnote next to each precise number.

For the system:
- Run a second instance with file access against the document. The Triad pattern (Architect / Mechanic / Operator) makes this the default, not an exception.
- Encode the failure mode in the document itself (e.g., **"Verify before you cite"** in the Output Preferences section of the CogPass v4.0).
- Where possible, generate the snapshot from the canonical files instead of writing it freehand.

### What worked in this loop

- The operator framed the request narrowly enough to invite a check (*"add anything from the codebase that opus web may have missed"* — implicit: there *will* be misses).
- The executor instance ran a codebase survey *first*, then wrote the corrections, then folded them into both files.
- Each correction traced back to a specific file path (`p31-alignment.json`, `p31-live-fleet.json`, `scripts/p31-fleet-ten/models.json`).
- The commit message was long enough to preserve the trace.
- The MASTER / PUBLIC split honored the workspace rule (children → S.J. / W.J.) without losing the operator-private detail the operator needs in their own context.

### What this means for future Triad loops

- Don't write current-state documents from session memory if the codebase is reachable.
- When you do, mark them as such and queue a check.
- The Triad isn't a process — it's a topology. Three different vantage points on the same artifact. Each vantage point catches what the others can't see.

---

*This brief is a reference pattern, not a template that must be re-enacted on every change. It exists so the next time someone (human or AI) asks "why does the CogPass have a `Verify before you cite` line in its output preferences?" the answer is here, in operator voice, with the timestamp and the artifact that prompted it.*

💜🔺💜
