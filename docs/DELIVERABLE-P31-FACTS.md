# Deliverable: P31 Facts Contract

**Status:** shipped in-repo  
**What:** A machine-checkable set of invariants (paths, `p31-constants.json` fields, mesh HTTPS URLs, org strings, policy-file substring bans, optional mesh SLO numbers). No marketing prose—if `npm run verify:facts` passes, those claims are structurally true for this workspace.

| Artifact | Role |
|----------|------|
| `p31-facts.json` | Schema `p31.facts/1.0.0` — the contract you extend when a grant or spec cites “what the repo guarantees.” |
| `scripts/verify-facts.mjs` | Enforces the contract from the file above + reads `p31-constants.json`. |
| `p31-alignment.json` | `sources[]` id `p31-facts`; derivation `p31-facts-registry` with `verify: npm run verify:facts`. |
| `package.json` | `verify:facts` script; `npm run verify` runs it immediately after `verify:alignment`. |

**Run:** `npm run verify:facts` (or full `npm run verify`).

**Extend:** Edit only `p31-facts.json` (add `pathsMustExist`, keys under `constants`, or `forbiddenSubstringsInFiles`—then run verify). **Do not** assert clinical hardware or counts not enforced by a script; those belong in narrative docs, not this contract.

**Related:** Deeper value checks live in `npm run verify:constants` and mesh live probes in `npm run verify:mesh` / `verify:mesh-live`.

**Prep & assemble (closeout checklist)**

1. `npm run verify:facts` — must exit 0.  
2. `npm run build:doc-index` — if you changed tracked markdown (doc library search).  
3. Map of record: **`P31-ROOT-MAP.md`** §1 table row *Machine-claim invariants* points here.  
4. Full ship: `npm run verify` (when ready).  
5. Commit: `p31-facts.json`, `scripts/verify-facts.mjs`, `p31-alignment.json`, `package.json` verify chain, and this file together.
