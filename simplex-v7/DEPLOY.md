# SIMPLEX v7 — `simplex-worker` deploy runbook

Closes **WCD-SIMPLEX-01** (D1 schema), **WCD-SIMPLEX-02** (HTTP + HMAC), **WCD-SIMPLEX-03** (scheduled worker) once this Worker is live on your edge route (e.g. **`https://api.phosphorus31.org`**).

**Prerequisites:** Node 20+, `wrangler` ≥ 3, `wrangler login`, account with Workers + D1 + KV + Queues enabled.

**Context / audience matrix:** **`GET /api/spoons`** uses layered SENTINEL resolution (**KV `system_state` → D1 → KV `operator_context_override` → static**); **`get_sentinel_context`** tool matches. See **`docs/COGNITIVE-PASSPORT-AUDIENCE-MATRIX.md`** and **`simplex-v7/src/lib/context-fallback.ts`**.

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
wrangler secret put HOSTILE_SENDERS
wrangler secret put HA_TOKEN
wrangler secret put HA_BASE_URL
```

| Secret | Role |
|--------|------|
| `ANTHROPIC_API_KEY` | Agent crew LLM runs |
| `DEVICE_SECRET` | HMAC for `/api/hardware`, optional `/api/biometric`, `/api/device/meshtastic` when signature sent |
| `HOSTILE_SENDERS` | Newline-separated emails for hostile-path handling (tomograph); can be minimal until email Worker lands |
| `HA_TOKEN` | Home Assistant long-lived token (SENTINEL HA REST) |
| `HA_BASE_URL` | HTTPS URL reachable by the Worker (tunnel tailscale or public hostname) |

Skip `HA_*` until SENTINEL talks to HA from the edge.

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

**OQE:** expect **22** user tables (see header comment in `src/db/schema.sql`).

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
