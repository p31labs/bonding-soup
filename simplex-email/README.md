# `simplex-email` — WCD-SIMPLEX-04

Cloudflare **Email Worker** for **HERALD** / tomograph pipelines: inbound mail hits this Worker first; envelope metadata is logged; the message is **forwarded** to one **verified** destination address (operator inbox), never to raw hostile paths.

**Sibling:** [`../simplex-v7/`](../simplex-v7/) (`simplex-worker` HTTP + D1 + SENTINEL). Wire HTTP fan-out (queue or `fetch` to `api.phosphorus31.org`) in a later revision.

## Prerequisites

- Node 20+
- `wrangler login`
- Zone on Cloudflare with **Email Routing** enabled

## Configure

```bash
cd simplex-email
npm install
```

### Secrets

```bash
wrangler secret put MAIL_FORWARD_DESTINATION
```

Use a destination address already **verified** in Email Routing (same pattern as dashboard “destination addresses”).

## Deploy

```bash
npm run typecheck
wrangler deploy
```

## Email Routing

1. Dashboard → Email Routing → add route that sends matching mail to **this Worker**.
2. Test with a benign message to the custom address; confirm arrival at `MAIL_FORWARD_DESTINATION`.

If the secret is missing at runtime, inbound mail is **rejected** with a clear SMTP diagnostic (forces misconfiguration-visible during bring-up).

## SIMPLEX tomograph fan-out (optional)

When inbound mail arrives, this Worker can **also** POST a signed JSON envelope to **simplex-worker** so HERALD’s tomograph (`tomograph_events`) gets a row before you read mail in the inbox.

1. On **simplex-worker**: `wrangler secret put SIMPLEX_EMAIL_INGEST_SECRET` (long random string).
2. On **simplex-email** Worker: set the **same** secret — `wrangler secret put SIMPLEX_EMAIL_INGEST_SECRET` — and a **var** (not secret) `SIMPLEX_INGEST_URL` = `https://<your-simplex-host>/api/ingest/email` (no trailing junk).

The Email Worker signs the **exact** JSON body with HMAC-SHA256 (`X-Simplex-Email-Signature`, lowercase hex). If ingest fails, mail **still forwards** to `MAIL_FORWARD_DESTINATION` when configured.

## OQE

- `npm run typecheck` passes from repo root (`npm run verify:simplex-email`).
