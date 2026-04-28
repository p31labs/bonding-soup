# SIMPLEX v7 — Composer / operator briefing

**Status:** Scaffold + WCD map (Apr 28, 2026). **Not** a deployment runbook — for **D1/KV/Queue/wrangler** use **`simplex-v7/DEPLOY.md`**; for **Layer 1 discovery** (`docs/SIMPLEX-V7-PROMPT-LAYERS.md`) before `wrangler deploy`.

## Find first (Layer 1)

1. **Live surfaces (verify, do not guess):**  
   `https://p31ca.org` · `https://phosphorus31.org` · `https://bonding.p31ca.org` · `https://api.phosphorus31.org` — plus full **Worker** fleet from **`wrangler.toml` inventory** (Andromeda checkout or Cloudflare dashboard).

2. **Repo layout:** Canonical app code may live in **`andromeda/`** (separate git remote; often **not** in a home-only clone). This home repo tracks **`simplex-v7/`** at the root — merge into Andromeda **`04_SOFTWARE/simplex-worker`** when the operator merges tracks.

3. **Bindings:** Never create duplicate D1/KV/Queue names — map existing namespaces **before** `wrangler d1 create`.

## Constraints (Layer 3)

| Constraint | Rule |
|------------|------|
| **BONDING** | **424 tests / 32 files** baseline — regression is **P0** (`bonding.p31ca.org`). |
| **Secrets** | **SOP-03:** `DEVICE_SECRET`, `ANTHROPIC_API_KEY`, **hostile sender routing** → **`wrangler secret put …` only.** Add **`HA_TOKEN`** + **`HA_BASE_URL`** on the Worker when **SENTINEL** talks to Home Assistant. No secrets committed to source — **`HOSTILE_SENDERS`** is newline-separated emails on the Worker secret. |
| **Litigation / grants** | No public case narrative or grant-impact copy without operator review. |
| **Topologies** | **K₄ / delta** — coordination via D1 `agent_messages`, not a master “hub agent.” |

## WCDs & OQE (Layer 4)

| WCD | Close (OQE shorthand) |
|-----|------------------------|
| **WCD-SIMPLEX-01** | D1 seeded: **`sqlite_master` lists 22 user tables** (core crew + **SENTINEL** physical tables — see `src/db/schema.sql` header). |
| **WCD-SIMPLEX-02** | HTTP matrix: `/api/state`, `/api/deadlines`, `/api/spoons`, `/api/hardware` (HMAC), `/api/chaos`, **`/api/biometric`**, **`/api/home`**, **`/api/home/state`**, **`/api/device/meshtastic`**; optional HMAC paths per `src/index.ts`. |
| **WCD-SIMPLEX-03** | Crons `wrangler tail` + `agent_runs` rows; **UTC** schedule — adjust for local civil time if needed. |
| **WCD-SIMPLEX-04** | **Email Worker** + Email Routing — tomograph row + voltage; **no raw delivery** for hostile / CRITICAL. **Scaffold:** repo root **`simplex-email/`**; **`verify:simplex-email`** on ship bar. |
| **WCD-SIMPLEX-05** | React `/simplex` (or SE shell): **SpoonGauge**, **LOVELedger**, **TomographFeed**, **AbdicationCountdown** → **FERS deadline `2026-09-30`** America/New_York (**155d** from Apr 28, 2026 baseline in briefing). |
| **WCD-SIMPLEX-06** | **Vitest** in `simplex-v7/` — `npm run test` + `npm run typecheck`; covered by root **`npm run verify`** as **`verify:simplex`** (after **`verify:doc-index`**). |

**Bootstrap (Layer 2):** from repo root, **`npm run simplex:bootstrap:dry`** / **`simplex:bootstrap:apply`** (**`simplex-v7/DEPLOY.md`** §0) — **`verify:simplex-bootstrap`** on the ship bar keeps the scripted dry-run contract aligned (no CF API in CI).

## Scaffold location

- **Code:** `simplex-v7/` — `npm install` · `npm run typecheck` · **`npm run simplex:bootstrap:*`** (**`DEPLOY.md`** §0) · **`wrangler dev`** after **`REPLACE_*`** in `wrangler.toml` unless bootstrap **`--update-config`** filled ids.
- **Inbound email (HERALD path):** **`simplex-email/`** (repo root) — **`npm run typecheck`** (`verify:simplex-email`); **`wrangler deploy`** after Email Routing routes exist.
- **Trimtab:** Default **registry prompts are short** — paste full operator prose from your vault into `src/agents/registry.ts` when you are ready (keep secrets out).
- **Physical layer:** **`docs/SENTINEL-PHYSICAL-LAYER.md`**, **`simplex-v7/home-assistant/`** (reference YAML aligned with **`set_home_scene`** / **`scene.p31_*`**).

## Agents (eleven SME lanes)

**Ten** inward delta lanes plus **SENTINEL** (physical outward bridge — **`*/5 * * * *`**, HA REST, biometric → spoons, MQTT/Meshtastic). See **`simplex-v7/src/agents/registry.ts`** for cron and spoon gates; ORACLE / STEWARD / HERALD unchanged in shape.

---

*"With the right context I'm an absolute genius…"* — this file + **`docs/SIMPLEX-V7-PROMPT-LAYERS.md`** exist so Composer hits **WCD-SIMPLEX-01** with discovery already encoded.
