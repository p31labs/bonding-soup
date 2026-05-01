# tetra-hub

Read-only Cloudflare Worker that **aggregates the K₄ edge trio** in one response:

| Route | Purpose |
|--------|---------|
| `GET /api/health` | Parallel health checks to `k4-cage`, `k4-personal`, `k4-hubs` (via bindings). |
| `GET /api/tetra` | Fused JSON: personal `/api/mesh` + cage `/api/mesh` + hubs `/api/hubs`. Schema: `p31.tetraHub/1.0.0`. |

**Bindings:** `K4_CAGE`, `K4_PERSONAL`, `K4_HUBS` — same Cloudflare account as the trio.

**Deploy order:** `k4-personal` → `k4-cage` → `k4-hubs` → **tetra-hub** (this Worker).

**Constants:** `mesh.tetraHubWorkerUrl` in `p31-constants.json` must match the deployed `*.workers.dev` host.

**Local verify (no deploy):** `npm run tetra-hub:check` or root `npm run verify:tetra-hub`.

**Skip CI / partial clone:** `P31_SKIP_TETRA_HUB=1`.
