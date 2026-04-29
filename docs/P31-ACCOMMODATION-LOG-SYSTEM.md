# P31 Accommodation Log — SIMPLEX v7

Normative system doc: the accommodation log is **machine-derived evidence**, not a blank form. Manual entry is optional and minimal; the default path is **D1 telemetry → `accommodation_log` rows** with stable `source_ref` keys for idempotency.

## Legal / operational intent

- **SSA / FERS / family court / self-attestation:** each row states what prosthetic support was applied, which functional limitation it addressed, and what the observable outcome was, grounded in **system records** (`agent_runs`, `tomograph_events`, `medications`, `spoons`, `biometric_log`) where possible.
- **IRWE:** subscription receipts (ecosystem audit) state cost; this table states **what** was accommodated. Together they support impairment-related work expense reasoning — consult qualified counsel for filing language.
- **Gray Rock UX:** no nagging UI in the Worker; ingestion runs on schedule. The operator opts in to review or export.

## Schema (`simplex-v7/src/db/schema.sql`)

Table **`accommodation_log`**: maps to the classic nine-column brief as **`entry_date` / `entry_time` / `task` / `tool` / `accommodation` / `duration_min` / `limitation` / `alternative` / `outcome`**, plus **`source`** (e.g. `SCRIBE_sync`, `SCRIBE_manual`), **`is_auto`** (1 machine, 0 operator-assisted), **`limitation_kind`** (`executive` | `serialization` | `medical` | `sensory`), **`source_ref`** (unique when present: `agent_run:…`, `tomograph:…`, `medication:…`, `spoons_day:YYYY-MM-DD`, `biometric_day:YYYY-MM-DD`, `manual:uuid`), **`created_at`** (epoch ms).

## Ingest

- **Library:** `simplex-v7/src/lib/accommodation-sync.ts` — `syncAccommodationInterval(env, startMs, endMs)` (half-open range).
- **Schedule:** `wrangler.toml` cron **`5 0 * * *`** (00:05 UTC). `handleScheduled` in `src/agents/runner.ts` ingests the **previous complete UTC calendar day** so the window includes the prior evening’s **ORACLE** hour (20 UTC) and all crew activity through 23:59 UTC.
- **Civil time:** comments in `README.md` note UTC; adjust crons if a specific US timezone “9pm” close is required.

## HTTP

- **GET** `/api/accommodation-log?days=14` — JSON rows (max **days** 90, cap 2000 rows), ordered by `created_at` desc.
- **POST** `/api/accommodation-log` — body `{ "task_line", "tool", "limitation_kind" }` same semantics as SCRIBE tool **`log_manual_accommodation`** (CORS as other routes).

## SCRIBE

Tool **`log_manual_accommodation`** — three fields; system fills accommodation/limitation/alternative templates from `limitation_kind`.

## Export / Genesis (phase 2)

Timeline UI, PDF/DOCX “Export for filing,” and SHA-256 over export payload are **not** in this Worker slice yet; this document locks the **D1 contract** and ingestion spine first.

## OQE

After `wrangler d1 execute … --file=src/db/schema.sql`, `sqlite_master` user table count should match the header comment in `schema.sql` (**23** including `accommodation_log`).
