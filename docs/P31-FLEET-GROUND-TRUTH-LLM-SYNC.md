# P31 fleet ↔ ground truth ↔ large LLMs — mandatory cadence

**Version:** 1.0.0 · **Status:** normative (operator + CI)

## Why this exists

The **local fleet** (`p31-*` Ollama personas, MCP bridge, Continue lane C) is the **contractual** automation surface: prompts, parameters, triage JSON, and pairing notes live in **this repo** and pass **`npm run verify`**.

**Large cloud LLMs** (e.g. Cursor’s default model, hosted APIs) are high-capacity **reasoning and drafting** tools. They are **not** authoritative for:

- Mesh URLs, worker names, glass probes, or hub routes — use **`p31-constants.json`**, **`p31-live-fleet.json`**, **`p31-ecosystem.json`**, **`p31.ground-truth.json`** (p31ca), and **`npm run verify:ecosystem`** / **`verify:constants`**.
- Legal facts, docket state, or third-party pricing — never invent; cite operator-bound sources or say unknown.
- Fleet persona IDs, tool names, or lane bans — use **`scripts/p31-fleet-ten/models.json`**, **`.cursor/rules/p31-ollama-fleet.mdc`**, and **`verify:fleet-llm-bridge`**.

**Reconciliation rule:** Any production-impacting conclusion from a cloud LLM must be **re-proven** with the matching repo verifier (or live binding) before merge or deploy.

## Ground truth stack (machine)

| Layer | Artefact | Proof (examples) |
|-------|-----------|------------------|
| Hub contract | `andromeda/04_SOFTWARE/p31ca/ground-truth/p31.ground-truth.json` | `npm run verify:ground-truth` (p31ca package) |
| Operator numbers | `p31-constants.json` | `npm run verify:constants` |
| Live fleet lines | `p31-live-fleet.json` | `npm run verify:ecosystem` |
| Registry map | `p31-alignment.json` | `npm run verify:alignment` |
| Fleet ten | `scripts/p31-fleet-ten/models.json` + prompts | `npm run verify:fleet-ten` |
| Fleet ↔ Continue ↔ policy | Same + `continue-p31/config.yaml` + rule doc | **`npm run verify:fleet-llm-bridge`** |
| MCP bridge | `scripts/ollama-mcp/` | `npm run verify:ollama-mcp` |

## Mandatory periodic synchronization

### Weekly (automated)

GitHub Actions workflow **`.github/workflows/p31-fleet-ground-truth.yml`** runs on a **weekly schedule** (Mondays 06:00 UTC) and **`workflow_dispatch`**. It executes a **fixed bar** (no Ollama daemon required):

`verify:fleet-ten` → **`verify:fleet-llm-bridge`** → `verify:ollama-mcp` → `verify:alignment` → `verify:constants` → `verify:ecosystem`

**Intent:** Catch drift between the **internal fleet bundle** and **downstream configs** (Continue, alignment) plus **ecosystem/constants** truth before operators lean on cloud models for a week.

### On every PR that touches fleet or cloud-crew edges

The same workflow runs when PRs change paths under:

- `scripts/p31-fleet-ten/**`
- `andromeda/04_SOFTWARE/continue-p31/**`
- `.cursor/rules/p31-ollama-fleet.mdc`
- `simplex-v7/src/agents/registry.ts`

### Monthly (human, calendar)

Operator checklist (15–30 min):

1. Read **`.cursor/rules/p31-ollama-fleet.mdc`** pairing table vs **`simplex-v7/src/agents/registry.ts`** — note any renames or new lanes; open a PR to align docs/rules if needed.
2. Run **`npm run ecosystem:glass`** when online; decide whether **`build:fleet-portal:live`** is warranted (glass merge) vs static **`build:fleet-portal`** — see **`docs/P31-ENGINEERING-STANDARD.md`**.
3. Confirm **`p31-alignment.json`** `verifyPipeline` still matches root **`package.json` `verify`** (`npm run verify:alignment -- --verify` on a full checkout).
4. If p31ca tree is present: **`npm run verify:ground-truth`** from **`andromeda/04_SOFTWARE/p31ca`** (or full **`npm run release:check`** before a hub deploy).

## Large LLM usage posture (non-optional)

- **Implementation & refactors:** Prefer **local fleet** (MCP / Continue) for repo-shaped work so parameters and stops stay on **`models.json`**.
- **Architecture / long reasoning:** Cloud models are fine **if** outputs are treated as drafts until **`verify`** green.
- **Confidential lanes:** Never route counsel / triage / phos through tunnel + model picker (Lane B); see fleet rule doc.

## Related

- **`docs/P31-ALIGNMENT-SYSTEM.md`** — ephemeralization map.
- **`docs/AGENTIC-VIBE-INFRASTRUCTURE.md`** — ground truth vs vibe.
- **`docs/P31-ENGINEERING-STANDARD.md`** — ship bar.
