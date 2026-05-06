# Cloudflare Worker Fleet — Alignment & Integration

**Document:** P31-WORKER-FLEET-ALIGNMENT  
**Date:** 2026-05-06  
**Scope:** All 10+ CF Workers, route contracts, KV namespaces, Pages sites, deploy order, health probes  
**Baseline:** 10-worker production fleet + KV-backed status dashboard live

---

## 1. PRODUCTION FLEET

### 1.1 Workers

| # | Worker | Domain/Route | Repo Location | Status | KV Namespaces |
|---|--------|-------------|--------------|--------|---------------|
| 1 | **command-center** | command-center.trimtab-signal.workers.dev | andromeda/04_SOFTWARE/cloudflare-worker/command-center/ | ✅ Live | system_state |
| 2 | **bonding-relay** | bonding-relay.trimtab-signal.workers.dev | andromeda/04_SOFTWARE/cloudflare-worker/bonding-relay/ | ✅ Live | relay_rooms |
| 3 | **k4-cage** | (Worker route) | andromeda/04_SOFTWARE/cloudflare-worker/k4-cage/ | ✅ Live | — |
| 4 | **k4-personal** | (Worker route) | andromeda/04_SOFTWARE/k4-personal/ | ✅ Deployed | KV for personal state |
| 5 | **social-engine** | social.p31ca.org | Social broadcast Worker | ✅ Live | WAVE_CONTENT |
| 6 | **api.phosphorus31.org** | api.phosphorus31.org | Existing Worker (pre-SIMPLEX) | ✅ Live | Mixed |
| 7 | **passkey** | (not deployed) | andromeda/04_SOFTWARE/cloudflare-worker/passkey/ | 🔴 Repo only | — |
| 8 | **simplex-worker** | api.phosphorus31.org (pending) | simplex-v7/ | 🔴 Scaffolded | D1: simplex |
| 9 | **simplex-email** | (not built) | WCD-SIMPLEX-04 | 🔴 Planned | — |
| 10 | **Stripe Worker** | api.phosphorus31.org/stripe | Shared with api Worker | ✅ Live | — |

### 1.2 Pages Sites

| Site | Domain | Repo | Build |
|------|--------|------|-------|
| p31ca.org | p31ca.org | andromeda/04_SOFTWARE/p31ca/ | Astro |
| phosphorus31.org | phosphorus31.org | phosphorus31.org/ | Astro 5 |
| bonding.p31ca.org | bonding.p31ca.org | andromeda/04_SOFTWARE/bonding/ | Vite |

---

## 2. ROUTE CONFLICTS

**Critical conflict: api.phosphorus31.org**

The existing Worker (Worker #6) serves routes at api.phosphorus31.org. SIMPLEX v7 (Worker #8) wants to deploy to the same domain with 15 new routes.

**Options:**
- **A. Replace:** Deploy simplex-worker as the sole Worker on api.phosphorus31.org. Existing routes either get ported into simplex-worker or deprecated.
- **B. Namespace:** Deploy simplex-worker routes under `/api/v7/`. Existing routes remain. Gradual migration.
- **C. Merge:** Port existing Worker routes into simplex-worker codebase. Deploy unified Worker.

**Recommendation:** Option C (merge). One Worker per domain. The discovery script (`discover-current-api-routes.mjs`) inventories what's live, and simplex-worker absorbs those routes. Stripe remains as a sub-route.

**Action:** Run discovery, document existing routes, add them to simplex-worker, verify parity, deploy.

---

## 3. KV NAMESPACE MAP

| Namespace | Used By | Key Pattern | Purpose |
|-----------|---------|-------------|---------|
| system_state | command-center, simplex-worker | `spoons`, `love`, `q_factor`, etc. | Operator system state |
| relay_rooms | bonding-relay | `room:{code}` | BONDING multiplayer room state |
| WAVE_CONTENT | social-engine | `queue:{platform}` | Social media post queue |
| (personal) | k4-personal | `subject:{id}` | Personal agent state |

**Gap (resolved — WCD-FLEET-01 ✅):** `P31-KV-NAMESPACE-MAP.md` added to docs. Key schema declared for all 4 namespaces: `system_state`, `relay_rooms`, `WAVE_CONTENT`, `k4-personal`.

---

## 4. HEALTH PROBES (GLASS)

The glass probe system in `p31-ecosystem.json` monitors fleet health.

| Probe | Target | Method | Expected |
|-------|--------|--------|----------|
| command-center | /api/health | GET | 200 + JSON health object |
| bonding-relay | /health | GET | 200 |
| k4-cage | HEAD | HEAD | 200 + COOP/CORP headers |
| social-engine | /health | GET | 200 |
| api.phosphorus31.org | / | GET | 200 |
| p31ca.org | / | GET | 200 |
| phosphorus31.org | / | GET | 200 |
| bonding.p31ca.org | / | GET | 200 |

**Missing probes:**

| Proposed Probe | Target | Why |
|---------------|--------|-----|
| passkey-roundtrip | passkey Worker | WebAuthn ceremony e2e |
| cars-engine | bonding.p31ca.org/soup | SoupEngine tick health |
| simplex-agents | api.phosphorus31.org/api/health | 11-agent status grid |
| relay-room-active | bonding-relay | Active room count |

**Current glass state:** 23+ UP, 0 DOWN (at production-2026-04-28 tag).

---

## 5. MESH HEADERS

The k4-cage Worker established the mesh header standard:

| Header | Value | Purpose |
|--------|-------|---------|
| Cross-Origin-Opener-Policy | same-origin | Isolation |
| Cross-Origin-Resource-Policy | same-origin | Resource sharing |
| X-P31-QFactor | 1 | Mesh quality factor |
| X-P31-Routing-Protocol | custom_dsdv | Mesh routing identifier |

**Standard (resolved — WCD-FLEET-02 ✅):** `X-P31-QFactor: 1` and `X-P31-Routing-Protocol: custom_dsdv` now set on command-center (jsonResponse), bonding-relay (CORS_HEADERS), and simplex-worker (http-json.ts jsonResponse). All 4 production Workers now carry mesh headers.

---

## 6. DEPLOY ORDER

Workers have deploy dependencies. This is the safe order:

```
1. command-center (no deps — health endpoint for everything else)
2. k4-cage (no deps — mesh headers, qFactor)
3. bonding-relay (deps: KV namespace only)
4. social-engine (deps: platform API keys in secrets)
5. k4-personal (deps: k4-cage for identity)
6. passkey (deps: k4-personal for subject_id binding)
7. simplex-worker (deps: D1 created, existing API routes discovered)
8. simplex-email (deps: CF Email Routing configured, simplex-worker live)
```

Pages sites deploy independently via git push → CF Pages auto-build.

---

## 7. SECRETS MANAGEMENT

**Rule:** No secrets in chat, docs, or code. Secrets go directly into Workers via `wrangler secret put`.

| Secret | Worker | Set Via |
|--------|--------|---------|
| Twitter tokens | social-engine | `wrangler secret put TWITTER_*` |
| Zenodo PAT | GitHub Actions | `gh secret set ZENODO_TOKEN` |
| Stripe keys | api Worker | `wrangler secret put STRIPE_*` |
| D1 database ID | simplex-worker | `wrangler.toml` (not a secret, but deploy-time config) |

**Incident note:** Twitter and Zenodo tokens were accidentally posted in plaintext in a chat session (April 2026). All were rotated immediately. New tokens injected directly via CLI. No chat exposure since.

---

## 8. WCD SEQUENCE

| WCD | Scope | Effort | Dep |
|-----|-------|--------|-----|
| WCD-FLEET-01 | KV namespace inventory doc | 0.5 day | None | ✅ Done — P31-KV-NAMESPACE-MAP.md |
| WCD-FLEET-02 | Standard mesh headers on all Workers | 0.5 day | None | ✅ Done — command-center, bonding-relay, simplex-worker |
| WCD-FLEET-03 | api.phosphorus31.org route discovery + merge plan | 1 day | None |
| WCD-FLEET-04 | Passkey Worker deploy (4 WebAuthn routes) | 2 days | None |
| WCD-FLEET-05 | Glass probe additions (4 new probes) | 0.5 day | Relevant Workers deployed |
| WCD-FLEET-06 | simplex-worker deploy (D1 + 15 routes) | 1 day | D1 created |

---

*10 workers. One mesh. Every route contracted. Every probe green.*
