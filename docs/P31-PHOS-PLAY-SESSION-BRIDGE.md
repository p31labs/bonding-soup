# Phos play session bridge (Pollination Courier → `garden_state`)

**Normative pairing:** `p31.phos.gardenState/1.0.0` (Garden Log) + optional `p31.playSession/1.0.0` (Courier snapshot).

## Where it lives

- **UI:** `andromeda/04_SOFTWARE/p31ca/public/quantum-family.html` — Garden Log checkbox *Include Courier play session* merges a snapshot into `garden_state.play_session` and sets `garden_state._handoff_bridge` to `p31.phos.gardenState/1.0.0+p31.playSession/1.0.0`.
- **Worker:** `simplex-v7/src/skills/phos-handler.ts` — passes `garden_state` through to the model as JSON; no extra server schema required.
- **Model behavior:** `simplex-v7/src/skills/phos-prompt.ts` — instructs Phos to treat `play_session` as non-evaluative context (counts / local audit sample), never as scores or competition.

## `play_session` shape (v1)

Opaque to Phos except as context; intended to mirror the page’s local session manifest posture (no PII, no network).

| Field | Meaning |
|--------|--------|
| `schema` | `p31.playSession/1.0.0` |
| `surface` | e.g. `quantum-family/pollination-courier` |
| `generatedAt` | ISO timestamp |
| `privacy` | Same object as wellness manifest (`networkTransport`, `storesPersonallyIdentifiableInformation`, `childDirectedPosture`) |
| `session` | `wallClockMs`, `aggregates` (`helps`, `breeze`, `cloudPct`, `streakMax`) |
| `events` | Trimmed local event log (same cap as copyable manifest) |

## Verify

`npm run verify:phos-play-session-bridge` (skips if `quantum-family.html` is absent).
