# SIMPLEX v7 — `simplex-worker` deploy runbook

Closes **WCD-SIMPLEX-01** (D1 schema), **WCD-SIMPLEX-02** (HTTP + HMAC), **WCD-SIMPLEX-03** (scheduled worker) once this Worker is live on your edge route (e.g. **`https://api.phosphorus31.org`**).

**Prerequisites:** Node 20+, `wrangler` ≥ 3, `wrangler login`, account with Workers + D1 + KV + Queues enabled.

**Context / audience matrix:** **`GET /api/spoons`** uses layered SENTINEL resolution (**KV `system_state` → D1 → KV `operator_context_override` → static**); **`get_sentinel_context`** tool matches. See **`docs/COGNITIVE-PASSPORT-AUDIENCE-MATRIX.md`** and **`simplex-v7/src/lib/context-fallback.ts`**.

**`GET /api/state` → `state`:** same merge also attaches **public remembrance** for ambient clients (no auth, no names): `bereavement_active`, `bereavement_until_ms`, `remembered_vertex_count`, `remembrance_fixed_stars` (normalized x,y,a from SHA-256 of vertex id). Starfield consumes these via **`resolveStarfieldConfig`** → **`mergeApiTouchHints`**.

---

## 0. Automated bootstrap (recommended)

From **repo root** (after `npm install` in `simplex-v7/` at least once, and **`wrangler login`**):

| Command | Effect |
|---------|--------|
| **`npm run simplex:bootstrap`** | Print usage |
| **`npm run simplex:bootstrap:dry`** | Print `wrangler` steps (no Cloudflare API calls) |
| **`npm run simplex:bootstrap:apply`** | If `wrangler.toml` still has **`REPLACE_WITH_D1_ID`** / **`REPLACE_WITH_KV_ID`**: `wrangler d1 create` + `kv namespace create` with **`--update-config`**, then **`queues create`**, then **`d1 execute … --remote --file=src/db/schema.sql`** |
| **`npm run simplex:bootstrap:schema`** | Remote schema apply only (after D1 exists) |
| **`npm run simplex:bootstrap:apply -- --deploy`** | Same as apply, then **`wrangler deploy`** (set secrets per §3 first) |

Manual equivalents remain in **§1–4** if you prefer dashboard copy-paste.

---

## 1. Create Cloudflare resources

Run from **`simplex-v7/`** (or pass `--cwd`).

### D1

```bash
wrangler d1 create simplex
```

Copy **`database_id`** from the output.

### KV (binding `SIMPLEX_STATE` in `wrangler.toml`)

```bash
wrangler kv namespace create SIMPLEX_STATE
```

Copy the **`id`** (not the preview id unless you only use preview).

### Queue (producer binding `AGENT_QUEUE`)

```bash
wrangler queues create simplex-agent-queue
```

The queue **name** must stay **`simplex-agent-queue`** to match `wrangler.toml`.

---

## 2. Edit `wrangler.toml`

Paste:

| Field | Source |
|--------|--------|
| `[[d1_databases]]` → `database_id` | `wrangler d1 create` output |
| `[[kv_namespaces]]` → `id` | `wrangler kv namespace create` output |
| Queue | Already named `simplex-agent-queue` in file; create step above must succeed |

Do not commit real IDs if this file is ever copied to a public fork; in this repo it is tracked for the operator machine.

---

## 3. Secrets (production)

From **`simplex-v7/`**:

```bash
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put DEVICE_SECRET
wrangler secret put OPERATOR_SECRET
wrangler secret put HOSTILE_SENDERS
wrangler secret put HA_TOKEN
wrangler secret put HA_BASE_URL
wrangler secret put PHOS_HMAC_SECRET
```

| Secret | Role |
|--------|------|
| `ANTHROPIC_API_KEY` | Agent crew LLM runs + operator skill routes (`/api/braindump`, `/api/legal/preflight`, …) |
| `DEVICE_SECRET` | HMAC for `/api/hardware`, optional `/api/biometric`, `/api/device/meshtastic` when signature sent |
| `OPERATOR_SECRET` | When set, skill routes require `Authorization: Bearer …` or `X-Operator-Token` (omit in local dev only) |
| `HOSTILE_SENDERS` | Newline-separated emails for hostile-path handling (tomograph); can be minimal until email Worker lands |
| `HA_TOKEN` | Home Assistant long-lived token (SENTINEL HA REST) |
| `HA_BASE_URL` | HTTPS URL reachable by the Worker (tunnel tailscale or public hostname) |
| `PHOS_HMAC_SECRET` | Optional but recommended for **`POST /api/phos/respond`**: HMAC body with **`X-Phos-Signature`** (hex, same algorithm as device routes) |
| `PHOS_CHILD_IDS` | Optional secret or var: allowlisted **`child_id`** strings (use with HMAC for defense in depth) |

Skip `HA_*` until SENTINEL talks to HA from the edge.

**Operator skills (HTTP):** After `d1 execute … schema.sql`, new tables include `knowledge_edges`, `caught_thoughts`, `debrief_log`, `time_capsules`, `calibrator_proposals`. Optional plain **`[vars]`** in `wrangler.toml`: `SKILL_DAILY_LIMIT_PER_IP` (default 80) to throttle skill calls per IP per day (KV counter).

**Skill route index:** `GET /api/context/composer`, `GET /api/knowledge-graph?q=`, `GET /api/time-capsule` (list upcoming) and `?deliver=1` (mark due opened), `GET /api/trimtab-spin`, `GET /api/mesh-breath`, `GET /api/lucky-byte` — plus `POST` on `/api/braindump`, `/api/legal/preflight`, `/api/medical/interaction`, `/api/email/draft-check`, `/api/wcd/generate`, `/api/debrief`, `/api/message/kid-safe`, `/api/grant/section`, `/api/accommodation/narrative`, `/api/git/describe`, `/api/spoons/forecast`, `/api/catch`, `/api/context-card`, `/api/oracle/synthesize`, `/api/calibrator/suggest`, `/api/time-capsule`, `/api/constellation-whisper`, `/api/parallel-thoughts`. All use the same CORS allowlist as the rest of the worker.

**Phos (garden companion for children):** `POST /api/phos/respond` — **bypasses** `OPERATOR_SECRET` (children’s clients do not carry the operator bearer). Configure **at least one** gate: `PHOS_HMAC_SECRET` (recommended: wrangler secret; client sends **`X-Phos-Signature`** = hex HMAC-SHA256 over the **exact raw JSON body**) and/or **`PHOS_CHILD_IDS`** (comma- or space-separated allowlisted `child_id` values). If neither is set, the endpoint returns **503** `phos_not_configured`. Optional **`[vars]`**: `PHOS_WAKE_START` / `PHOS_WAKE_END` (default `7` and `20`, local hour 0–23 from JSON `local_hour`), `PHOS_MAX_EXCHANGES` (default `10`). Request JSON: `child_id`, `garden_state` (object), optional `input`, `input_type`, `pre_reader`, `exchange_count`, `local_hour`. **No Phos conversation text is persisted in D1** — only the HTTP response. Same `ANTHROPIC_API_KEY` as the rest of the worker. Product copy and ethics for Phos live in code: `src/skills/phos-prompt.ts` + `src/skills/phos-safety.ts`.

**Sign a Phos body (operator machine):** from **`simplex-v7/`**, `PHOS_HMAC_SECRET='…' npm run phos:sign` (optional body path argument; default `scripts/phos-example-body.json`). Optionally `PHOS_URL=https://your-worker.example` to print the matching curl. Repo root: **`npm run phos:sign`**.

**One-shot POST:** repo root **`PHOS_HMAC_SECRET='…' PHOS_URL='https://…' npm run phos:probe`** (optional path to body JSON; default `simplex-v7/scripts/phos-example-body.json`). **`npm run p31 -- phos probe`** is the same.

**Static probe UI:** **`garden-phos-probe.html`** at repo root — **`npm run p31 -- open phos`** (starts :8080 demo if needed) or open from **`npm run demo`**.

**Remembrance mesh (grief / consecrated vertices):** `POST /api/remember/consecrate` (JSON: `display_name`, optional `memorial_line`, `date_born`, `date_passed`, `edges_summary`, `last_warm_at`, `start_bereavement_days`, **`log_accommodation`: true** to append one `accommodation_log` row via SCRIBE manual tool); `GET /api/remember/list`; `GET /api/remember/status`; `GET /api/remember/context` (markdown block for humans); **`GET /api/remember/vertex?id=<uuid>`** (one row); `POST /api/remember/bereavement` with `{ "days": 30 }` or `{ "clear": true }`. Same operator auth + rate limits as other skill routes. D1: `remembered_vertices`, `bereavement_periods`; KV: `mesh_bereavement_until` (epoch ms). **Canon color:** `p31-constants.json` → `mesh.remembranceWarmWhite`; starfield exports **`P31_REMEMBRANCE_WARM_WHITE`** / **`REMEMBRANCE_RGB`** in `design-assets/starfield/p31-starfield.js` (run **`npm run apply:constants`** after editing constants). **CLI:** `OPERATOR_SECRET=… npm run remember:probe status` (or `context`, or `vertex <uuid>`); **`npm run p31 -- remember status`**. **ORACLE Q:** pass lowered daily allocation as `spoonMax` into `energyVertexScore` / `computeQFactorPure` (`src/lib/q-factor.ts`) during bereavement.

---

## 4. Apply D1 schema

**Remote** (recommended for first prod attach):

```bash
wrangler d1 execute simplex --remote --file=src/db/schema.sql
```

**Local** (Wrangler `--local` dev only):

```bash
wrangler d1 execute simplex --local --file=src/db/schema.sql
```

**OQE:** expect **30** user tables (see header comment in `src/db/schema.sql`).

---

## 5. Deploy the Worker

```bash
npm run typecheck
npm run test
wrangler deploy
```

Note the **`*.workers.dev`** URL from the deploy output for smoke tests before custom domains.

---

## 6. Attach `api.phosphorus31.org` (operator)

In **Cloudflare dashboard** → Workers & Pages → this Worker → **Triggers** → **Custom Domains** / **Routes**:

- Route pattern: **`api.phosphorus31.org/*`** (or zone-specific equivalent).
- Ensure **DNS** for `api.phosphorus31.org` points at the Workers/proxy chain you use for phosphorus31 Workers.

Terraform / double-remote may live in Andromeda; this home repo carries the Worker source only until merged.

---

## 7. Post-deploy probes

Replace `ORIGIN` with `https://api.phosphorus31.org` (or your `workers.dev` URL first).

### Read-only (no secrets)

```bash
curl -sS -o /dev/null -w "%{http_code}\n" "$ORIGIN/api/state"
# Optional: confirm remembrance keys exist on `state` (counts may be 0)
curl -sS "$ORIGIN/api/state" | head -c 1200
curl -sS "$ORIGIN/api/agents" | head -c 400
curl -sS "$ORIGIN/api/deadlines" | head -c 200
```

Expect **200** and JSON bodies (empty tables are fine on fresh D1).

### HMAC sanity (optional)

```bash
# Body must match DEVICE_SECRET derivation in worker (see Vitest / index.ts).
curl -sS -X POST "$ORIGIN/api/hardware" \
  -H "Content-Type: text/plain" \
  -H "X-Device-Signature: <valid_hex_hmac>" \
  -d "probe"
```

### Biometric (unsigned allowed when signature omitted — lock down route in prod if needed)

```bash
curl -sS -X POST "$ORIGIN/api/biometric" \
  -H "Content-Type: application/json" \
  -d '{"sleep_score":72,"hrv_ms":35,"resting_hr":62,"source":"deploy-probe"}'
```

### Cron

Confirm schedules in **`wrangler.toml`** `[triggers]`, then:

```bash
wrangler tail simplex-worker
```

Watch for **`*/5`** (SENTINEL) and other UTC crons — adjust mentally for Eastern civil time.

---

## 8. Troubleshooting

| Symptom | Check |
|---------|------|
| 500 / D1 errors | Schema applied? `database_id` matches binding? |
| KV miss | Namespace id in `wrangler.toml` matches **production** id |
| Queue errors | Queue exists; producer name **`simplex-agent-queue`** |
| HA calls fail | `HA_TOKEN` + `HA_BASE_URL` reachable from Cloudflare egress (not localhost-only unless tunneled) |
| Sandbox `ERR` on probe | Workers route not public from CI; probe from laptop or **`npm run discover:sites`** at home |

---

## 9. `simplex-email` (WCD-SIMPLEX-04)

Sibling package at **`../simplex-email/`** (repo root): Cloudflare **Email Worker** — envelope log + forward to **`MAIL_FORWARD_DESTINATION`** (verified inbox). Deploy after **`simplex-worker`** if herding mail through the Worker; **`npm run verify:simplex-email`** (root) typechecks it.

---

## 10. After deploy

- Root **`npm run verify`** runs **`verify:simplex`** (tsc + Vitest), **`verify:simplex-email`** (tsc), and **`verify:simplex-bootstrap`** (CI guard: bootstrap script dry-run output vs `wrangler.toml`).
- **Alignment:** `p31-alignment.json` → source **`simplex-v7-worker`**, derivation **`simplex-v7-worker-suite`**.
- **Next WCDs:** **`simplex-email`** scaffold (zone route + secrets), **WCD-SIMPLEX-05** (React `/simplex` against live **`ORIGIN`**).

---

*Human-in-the-loop: deploy only after operator review of secrets and zone routes.*
