# P31 launch readiness

**Single command for solo operator:** `npm run launch:audit` — read-only, ten lanes, one score, one "next thing."

## Files

| File | Role |
|------|------|
| **`p31-launch-readiness-config.json`** | `p31.launchReadinessConfig/0.1.0` — ten lanes, weighted to 100. |
| **`p31-launch-checklist.json`** | `p31.launchChecklist/0.1.0` — human-gate sign-offs (legal, secrets, treasury, rest). |
| **`scripts/p31-launch-readiness.mjs`** | Runner: ten lanes, three modes, JSON + HTML + JSONL log. |
| **`scripts/p31-launch-checklist.mjs`** | Flip a gate (`met` / `pending` / `blocked`). |
| **`scripts/lib/launch/lane-runners.mjs`** | Six check kinds: `cmd`, `file-exists`, `json-key`, `no-glob`, `glass-probe`, `human-checklist`. |
| **`scripts/lib/launch/narrate.mjs`** | "Next one thing" picker (gate / actionable / glass / non-critical / warning). |
| **`scripts/verify-launch-readiness-config.mjs`** | Static schema gate; runs in `npm run verify`. |

## Ten lanes (weights sum to 100)

| Lane | Covers |
|------|--------|
| `alignment` | `verify:alignment`, `verify:contract-registry`, `verify:sovereign-layers` |
| `integrity` | `verify:facts`, `verify:constants`, `verify:p31-env`, `verify:shipbox` |
| `governance` | PRS launchGovernance + lane manifest |
| `identity` | Cognitive Passport schema, Passkey worker, `mesh.passkeyApiBasePath` |
| `mesh` | `verify:mesh-canon`, `verify:ecosystem`, `verify:k4-personal` |
| `payments` | `verify:monetary`, creator-economy mirror, donate-api glass probe |
| `security` | `p31ca security:check` (when present), no `.env` at root |
| `on-chain` | SMART suite (`p31-smart-evm.json`) + chain anchor + `verify:sovereign-chain` |
| `content` | doc-index, fleet-portal, runbooks |
| `human-gate` | All ten checklist rows (5 critical, 5 non-critical) |

## Modes

| Mode | Command | Behavior |
|------|---------|----------|
| **audit** | `npm run launch:audit` | Default. Read-only. Uses cached `/tmp/p31_glass_report.json`. |
| **rehearsal** | `npm run launch:rehearsal` | Runs `ecosystem:glass` first, then full lane sweep. |
| **gate** | `npm run launch:gate` | Audit + every critical checklist row must be `met`. Non-zero exit otherwise. |

### Spoon-mode helpers

| Command | What |
|---------|------|
| `npm run launch:next` | Single line — the one most useful next action. |
| `npm run launch:check` | Human-gate table. |
| `npm run launch:check <id> met --note '…'` | Flip a gate (appends to `~/.p31/launch-log.jsonl`). |
| `npm run launch:sync` | Heal: `apply:constants` + rebuild contract registry + chain anchor mirror + fleet portal + doc index. |

## Outputs

- **JSON report** — `/tmp/p31_launch_readiness.json` (override `P31_LAUNCH_REPORT`).
- **HTML dashboard** — `launch-readiness.html` (root) and `andromeda/04_SOFTWARE/p31ca/public/launch-readiness.html` when present.
- **Logbook** — append-only JSONL at `~/.p31/launch-log.jsonl` (skip with `--no-log`).

## Exit codes

- **audit / rehearsal:** non-zero only if any blocker (so re-runs are safe in scripts).
- **gate:** non-zero unless `summary.ready === true`.

## Adding a check

1. Pick a lane in `p31-launch-readiness-config.json`; add a row of one of the six `kind` types.
2. Adjust weights (must still sum to 100).
3. Run `npm run verify:launch-readiness-config`.
4. Run `npm run launch:audit` to confirm.

## Adding a human gate

1. Add an entry to `p31-launch-checklist.json` under `gates`. Required: `id`, `title`, `kind`, `critical`, `status`.
2. `npm run verify:launch-readiness-config`.

## Related

- **`p31-launch-lane.json`** + **`docs/runbooks/RUNBOOK-WORKER-GOVERNED-LANE.md`** — PRS governed lane (different artifact, used by this audit).
- **`p31-sovereign-layers.json`** + **`docs/P31-SOVEREIGN-LAYERS.md`** — twelve-layer sovereign stack.
- **`contracts/p31-contract-registry.json`** + **`/contract-builder`** — JSON + SMART (EVM) contracts; visible in the hub.
