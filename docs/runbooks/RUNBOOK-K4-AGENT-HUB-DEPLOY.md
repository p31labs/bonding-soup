# RUNBOOK: k4-agent-hub production deploy

**Worker:** k4-agent-hub  
**Schema:** p31.k4AgentHub/1.1.0  
**Source:** packages/k4-agent-hub/  
**Target:** k4-agent-hub.trimtab-signal.workers.dev  
**Prerequisite:** `npm run launch:gate` exits 0 (all 5 critical gates met)

---

## Pre-deploy checklist

- [ ] All 5 critical launch gates met (`npm run launch:gate`)
- [ ] TRIPER cert fresh (`npm run test:triper:cert`)
- [ ] `npm run release:public` passes
- [ ] Wrangler authenticated (`wrangler whoami`)
- [ ] KV namespace `K4_AGENT_HUB` provisioned (see Step 1)

---

## Step 1 — Provision KV namespace

Run once. Creates the shared KV namespace for sessions + dock registry + anchor pacts + peer registry.

```bash
cd packages/k4-agent-hub
npx wrangler kv:namespace create K4_AGENT_HUB
```

Output will include an `id` field. Copy it.

```bash
# Example output:
# 🌀 Creating namespace with title "k4-agent-hub-K4_AGENT_HUB"
# ✨ Success!
# Add the following to your configuration file in your kv_namespaces list:
# { binding = "K4_AGENT_HUB", id = "abcdef1234567890abcdef1234567890" }
```

Edit `packages/k4-agent-hub/wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "K4_AGENT_HUB"
id = "PASTE_REAL_ID_HERE"   # replace REPLACE_BEFORE_DEPLOY_ZX0001
```

Commit the updated wrangler.toml:

```bash
git add packages/k4-agent-hub/wrangler.toml
git commit -m "chore(k4-agent-hub): wire KV namespace id for production deploy"
```

---

## Step 2 — Harden for production

In `wrangler.toml`, set:

```toml
REQUIRE_SIGNED_DOCK = "1"   # was "0" — enforce Ed25519 signed dock envelopes
```

This means dock requests without a valid Ed25519 signature will be rejected. The client (`@p31/k4-agent-hub-client`) already signs all requests — this just enforces it server-side.

Commit:

```bash
git add packages/k4-agent-hub/wrangler.toml
git commit -m "chore(k4-agent-hub): require signed dock in production"
```

---

## Step 3 — (Optional) Set Ollama or Simplex endpoint

If you have a local Ollama tunnel or simplex-v7 URL:

```bash
# Ollama tunnel (if cloudflared tunnel is running)
wrangler secret put OLLAMA_BASE_URL
# → paste: https://ollama-tunnel.your-domain.workers.dev

# Simplex-v7 cloud fallback
wrangler secret put SIMPLEX_OPERATOR_SECRET
# → paste your shared operator secret
```

If neither is set, skills fall through to `structuredEcho` (returns structured stub responses). This is safe for initial launch — real skill dispatch can be wired after.

---

## Step 4 — Deploy

```bash
cd packages/k4-agent-hub
npx wrangler deploy
```

Expected output includes:

```
✨  Built successfully
✨  Uploaded k4-agent-hub (X.XX sec)
✨  Published k4-agent-hub (X.XX sec)
  https://k4-agent-hub.trimtab-signal.workers.dev
Current Deployment ID: ...
```

---

## Step 5 — Verify

```bash
# Manifest (no auth needed)
curl -s https://k4-agent-hub.trimtab-signal.workers.dev/v1/manifest | python3 -m json.tool | head -20

# Topology
curl -s https://k4-agent-hub.trimtab-signal.workers.dev/v1/topology | python3 -m json.tool | head -10

# Forge health
curl -s https://k4-agent-hub.trimtab-signal.workers.dev/v1/forge/health
```

All three should return JSON with no error fields.

Then run ecosystem glass to confirm probes go green:

```bash
npm run ecosystem:glass 2>&1 | grep k4-agent-hub
```

Expected:
```
UP    200   xxx    mesh    k4-agent-hub-manifest    https://k4-agent-hub.trimtab-signal.workers.dev/v1/manifest
UP    200   xxx    mesh    k4-agent-hub-topology    https://k4-agent-hub.trimtab-signal.workers.dev/v1/topology
UP    200   xxx    mesh    k4-agent-hub-federation  https://k4-agent-hub.trimtab-signal.workers.dev/v1/federation
```

---

## Step 6 — Update p31-live-fleet.json `liveReachable`

After probes are green, update the PRS score in `p31-production-readiness.json`:

```bash
# Edit: change liveReachable from 7 → 10 for k4-agent-hub item
python3 - <<'EOF'
import json
p = 'p31-production-readiness.json'
d = json.load(open(p))
item = next(i for i in d['items'] if i['id'] == 'k4-agent-hub')
item['score']['liveReachable'] = 10
with open(p, 'w') as f:
    json.dump(d, f, indent=2, ensure_ascii=False)
    f.write('\n')
print('Updated k4-agent-hub liveReachable to 10')
EOF

npm run verify:production-readiness
```

The k4-agent-hub total score should move from 89 → 92.

---

## Step 7 — Tag and release

```bash
# From repo root
npm run test:triper:cert          # ensure cert is fresh
git tag v1.1.0-k4-agent-hub-launch
git push origin main --tags
```

---

## Post-deploy verification script

```bash
# Full smoke sequence
node scripts/k4-agent-hub-smoke.mjs https://k4-agent-hub.trimtab-signal.workers.dev
```

---

## Rollback

k4-agent-hub is stateless between requests (DO state persists). To roll back:

```bash
# Redeploy previous version from git
git checkout <prior-sha> -- packages/k4-agent-hub/src/
npx wrangler deploy
```

Session state in KV will survive the rollback. DO SQLite state is durable — no data loss.

---

## Related

- `packages/k4-agent-hub/wrangler.toml` — Worker config
- `p31-k4-agent-hub.json` — canonical manifest
- `scripts/verify-k4-agent-hub.mjs` — pre-deploy canon check
- `docs/CWP-P31-K4-AGENT-HUB-FAMILY-CAGE-WIRE.md` — v1.6.0 CWP
