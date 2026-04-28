# `simplex-v7` — Worker + D1 scaffold

Cloudflare **simplex-worker** package (TypeScript). Lives at repo root so **bonding-soup** tracks it; merge into **Andromeda** `04_SOFTWARE` when coordinating with hub deploys.

**Production deploy:** **[`DEPLOY.md`](./DEPLOY.md)** — D1, KV, Queue, secrets, **`api.phosphorus31.org`** route, probes, tail.

## Prerequisites

- Node 20+
- `wrangler` authenticated (`wrangler login`)

## One-time Cloudflare

Full sequence (CLI + dashboard cues): **`DEPLOY.md`**. Summary:

1. `wrangler d1 create simplex`, `wrangler kv namespace create SIMPLEX_STATE`, `wrangler queues create simplex-agent-queue`.
2. Paste **`database_id`** and KV **`id`** into `wrangler.toml` (worker name **`simplex-worker`**).
3. **`wrangler secret put`** — see **`DEPLOY.md`** table (`ANTHROPIC_API_KEY`, `DEVICE_SECRET`, `HOSTILE_SENDERS`, `HA_TOKEN`, `HA_BASE_URL`).

## Apply schema (WCD-SIMPLEX-01)

```bash
wrangler d1 execute simplex --remote --file=src/db/schema.sql
# local dev DB:
wrangler d1 execute simplex --local --file=src/db/schema.sql
```

Then **`npm run deploy`** or **`wrangler deploy`** — see **`DEPLOY.md`** §5–§7.

**OQE:** `SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'` → **22** rows after apply (physical layer: `device_states`, `biometric_log`, `home_events`, `automation_rules`, `mqtt_log`).

## Dev / typecheck / tests (WCD-SIMPLEX-06)

```bash
npm install
npm run simplex:bootstrap:dry   # preview wrangler commands (no API)
npm run simplex:bootstrap:apply # D1/KV (--update-config) + queue + remote schema (`wrangler login` first)
npm run typecheck
npm run test        # Vitest — context-fallback, HMAC, voltage, FERS, Q, biometric spoons, registry, schema
npm run dev
```

**Layer 1 (live URLs, read-only):**

```bash
npm run discover:sites
```

Fails only if **all** four probes fail; blocked `api.phosphorus31.org` from a sandbox still prints `ERR` for triage.

## Sentinel Context (**S** semantics)

GET **`/api/spoons`** and **`GET /api/state`** `state` use the same layered resolution (**KV** `system_state` → **D1** last `spoons` → **KV** `operator_context_override` → **static**) via **`mergeKvSystemStateWithSentinel`** / **`resolveSentinelContext`** in **`src/lib/context-fallback.ts`**. **`get_sentinel_context`** (SENTINEL tool) returns the sentinel slice alone. Normative doc: **`docs/COGNITIVE-PASSPORT-AUDIENCE-MATRIX.md`** (column **S** / SENTINEL bridge).

## Routes (WCD-SIMPLEX-02 matrix)

| Method | Path |
|--------|------|
| GET | `/api/state` — merged `system_state` + sentinel spoon fields (never raw KV-only) |
| GET | `/api/agents` |
| GET | `/api/deadlines` |
| GET | `/api/spoons` — envelope includes `sentinel_context_source`, `sentinel_stale_ms`, optional `operator_note` |
| POST | `/api/hardware` — body string + header `X-Device-Signature` hex HMAC-SHA256 |
| POST | `/api/medical` `{ "medication": "Vyvanse" }` |
| POST | `/api/spoons` `{ "activity": "email", "cost": 2 }` |
| POST | `/api/agent/:AGENT` — runs one crew member |
| POST | `/api/chaos` `{ "text": "...", "sender": "..." }` — assess + HERALD run |
| POST | `/api/biometric` — GadgetBridge / HA push; optional `X-Device-Signature`; D1 `biometric_log`; queues **SENTINEL** |
| GET | `/api/home/state` — KV + D1 snapshot for dashboard |
| POST | `/api/home` — HA / bridge events → `home_events` |
| POST | `/api/home/scene` — queue manual scene action |
| POST | `/api/device/meshtastic` — mesh status push (HMAC when configured) |

CORS allowlist: `https://p31ca.org` (adjust for preview origins if needed).

## Topology

- **SENTINEL** — outward bridge: HA scenes, TTS, haptics, MQTT/Meshtastic mirrors; **`*/5 * * * *`** cron when bound in `wrangler.toml`. See **`docs/SENTINEL-PHYSICAL-LAYER.md`** and **`home-assistant/README.md`** (reference YAML + secrets list).
- **Delta:** `post_agent_message` → D1 `agent_messages` (queue consumer stub until wired).
- **Spoon gates:** Implemented in `agents/runner.ts`; MEDIC / FORGE baseline **0** cost.
- **Cron:** `handleScheduled` maps `*/5 * * * *` → **SENTINEL**; `handleCron` maps other **UTC** hours — shift expressions if you need Eastern civil time.

## Next

- **Machine alignment:** **`p31-alignment.json`** — **`simplex-v7-worker`** source + **`simplex-v7-worker-suite`** derivation; root **`npm run verify`** runs **`verify:simplex`**, **`verify:simplex-email`**, and **`verify:simplex-bootstrap`** after the doc index steps.
- **`verify:simplex-email`** (typecheck **[`simplex-email/`](../simplex-email/)** — inbound Email Worker) — WCD-SIMPLEX-04; **`../simplex-email/README.md`**.
- **`verify:simplex-bootstrap`** — proves **`scripts/simplex-bootstrap.mjs`** dry-run stays aligned with **`wrangler.toml`** (no live Cloudflare calls in CI). Real bring-up: **`npm run simplex:bootstrap:apply`** (**`DEPLOY.md`** §0).
- Dashboard — WCD-SIMPLEX-05 against `api.phosphorus31.org` routes (align with **live** Worker name/routes after discovery).

See **`docs/SIMPLEX-V7-COMPOSER-BRIEFING.md`**.
