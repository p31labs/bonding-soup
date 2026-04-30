# CONCEPT — Cognitive Escrow

**Status:** stub. Tier A pattern-naming. Agent drafted skeleton; operator fills the prose. One page. Done.

**Pattern, in one sentence:** *The system holds state geometrically so the brain doesn't have to.*

---

## The pattern

> TODO — operator voice (one paragraph). Executive dysfunction is a serialization bottleneck, not an intelligence limit. When the working memory shelf is full, the operator's choices are: (a) drop the load, (b) recurse on it, or (c) hand it to a structure that will hold it without deforming. P31 is built on (c). The K₄ cage holds family bonds. The hub registry holds product canon. The Cognitive Passport holds the operator profile. The alignment registry holds derivation graphs. Every system surface that holds state on the operator's behalf — without leaking, without surveilling, without demanding attention until the load is ready to come back — is a Cognitive Escrow.

## Three properties

A surface is Cognitive Escrow only if it satisfies all three:

1. **Holds geometrically, not narratively.** The structure *is* the data (K₄ cage, geodesic dome, doc-library nav tree). Pulling state back doesn't require re-reading prose; the shape of the system tells the operator where things are.
2. **Returns intact.** State written to escrow comes back unmodified, in the same units, on operator demand. No silent normalization. No "we improved your data."
3. **No surveillance / no extraction.** The system holds the state because the operator can't, not because the system wants to mine it. (See `docs/ETHICAL-STYLE-MAP.md` — the "creation, not extraction" axiom.)

## Examples in the canon

| Escrow surface | What it holds | Geometry |
|---|---|---|
| K₄ cage | Family bonds (will / S.J. / W.J. / christyn + LOVE totals) | Tetrahedron |
| Personal K₄ | Pillars a/b/c/d (isolated personal scope) | Tetrahedron |
| `p31-alignment.json` | Source → derivation → verify edges | Directed graph |
| Cognitive Passport | Operator cognitive profile + audience matrix | Slice manifest |
| `p31-shared-surface.css` (frozen) | Doc surface design canon | Token lattice |
| Hub registry / `hub-app-ids.mjs` | Product card invariants | Set |

> TODO — operator voice. Add the lived examples (the things you actually feel held by). The above is the agent's reading; sign or rewrite.

## Anti-patterns (what is NOT escrow)

- A todo list app. (Demands attention. Re-narrates the load back at you.)
- A timeline / feed. (Surveills + extracts, replaces geometry with chronology.)
- A "second brain" that requires constant gardening. (The garden becomes the load.)
- Anything that quantifies the operator into a "score." (Scoring violates the ethics axiom.)

## How design decisions hook on this

When evaluating any new surface in the P31 ecosystem, ask:

1. Does it hold state for the operator, or demand it?
2. Is the holding shape geometric (returns intact, no narrative drift)?
3. Does it pass the no-extraction test? (Would it survive an audit by someone whose only question is "what does this learn about the operator?")

Three yeses → ship it. Any no → redesign or park.

---

## Authoring contract

- Tier A. Operator signs every paragraph.
- One page. Resist scope creep.
- Sibling to: `docs/PLAN-WYE-DELTA-PHASE-SHIFT.md`.
- Linked from: `AGENTS.md` §0 (after this lands), `docs/ETHICAL-STYLE-MAP.md`, `docs/SIC-POVM-K4-ARCHITECTURE.md`.
