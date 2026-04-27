# Deliverable: P31 Shipbox snapshot

**Status:** shipped in-repo  
**What:** A **machine-emitted JSON handoff** (`p31.shipbox/1.0.0`) with package name/version, **git** short head + dirty flag, **public** slices of `p31-constants.json` (org, mesh, bonding, physics), and **file-present** booleans for core paths. No secrets; evidence for grants and operator shift.

| Artifact | Role |
|----------|------|
| `scripts/p31-shipbox.mjs` | Builds the object; exports `buildShipbox`, `assertShipbox`. |
| `npm run p31:shipbox` | Prints JSON to **stdout** (pipe to file for evidence). |
| `npm run verify:shipbox` | Asserts schema and required fields — **no write**. |
| `p31-alignment.json` | Sources `p31-shipbox-script`; derivation `p31-shipbox-snapshot`; `verifyPipeline` includes `verify:shipbox` after `verify:facts`. |
| `p31-facts.json` | `pathsMustExist` includes `scripts/p31-shipbox.mjs`. |

**Run:** `npm run verify:shipbox` (or full `npm run verify`).

**Extend:** Change **`p31-shipbox.mjs`** only when adding new public fields; keep **`assertShipbox`** in sync; document new keys here. Do not put tokens, API keys, or full `wrangler` secrets in the snapshot.

**Related:** **`docs/DELIVERABLE-P31-FACTS.md`** (structural path/URL invariants); **`P31-ROOT-MAP.md`** §1 *Handoff snapshot*; **`AGENTS.md`** verify prelude.
