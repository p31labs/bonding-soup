# SOULSAFE tetrahedron — production specification

**Status:** v0.1 shipped in `k4-personal` (fusion path + audit).  
**Schema:** `p31.soulsafeTetra/0.1.0`  
**Canon:** SOULSAFE = high-reliability human–AI symbiosis (Zenodo XIX, Cognitive Passport); SIC-POVM metaphor = four rank-1 “effects” (specialists) fused into one coherent response.

## 1. Goals

| Goal | Mechanism |
|------|-----------|
| **Personal / private** | All inference orchestrated inside `PersonalAgent` DO; memory stays SQLite; no second public agent surface for minors’ primary path. |
| **Four synced specialists** | **Five** Workers AI `AI.run` calls per user message when fusion runs: **four** parallel specialist lenses (structure, connection, rhythm, creation) + **one** fusion call. Cost/latency: keep `SOULSAFE_CHAT_DEFAULT=0` or gate with spoons until budget is comfortable. |
| **SOULSAFE gates** | If `energy.spoons < 3`, fusion mode is **not** used (single-shot path only) to avoid cognitive overload. |
| **Audit** | `soulsafe_runs` table stores effect outputs + model id + timestamp (no duplicate of full user text beyond `messages`). |
| **Backward compatible** | Default `POST /chat` behavior unchanged unless `soulsafe: true` or `SOULSAFE_CHAT_DEFAULT=1`. |

## 2. Architecture

- **Worker:** `andromeda/04_SOFTWARE/k4-personal`
- **Routes:** `POST /agent/:userId/chat` (JSON body)
- **Module:** `src/soulsafe-tetra.js` — prompts, `runSoulsafeTetra()`, `DEFAULT_SOULSAFE_MODEL_ID` (shared with `POST /chat` fusion path)
- **UI — tetra shell:** `GET /u/:userId/home` ( `tetra-home-html.js` ) — “SOULSAFE tetra” checkbox on quick chat; loads `soulsafe_prefs` from `GET /agent/:id/state` on boot, `PUT` on change, and a boot-time push so the DO matches the shell (default remains **on** in HTML until state says otherwise, so new visitors get fusion when spoons allow; mesh users with `default: false` see the box unchecked after pull).
- **UI — hub:** `p31ca/public/mesh-start.html` — optional checkbox (default off; `localStorage` `p31_mesh_soulsafe`); `PUT /state` with `soulsafe_prefs: { default: <bool> }` on change and after init so `GET /agent/:id/manifest` `soulsafeTetra.chatDefault` matches the user; also passes `soulsafe: true` on `POST /chat` when enabled; appends effect JSON or `soulsafeSkipped` to the reply view.
- **Contract example:** `contracts/p31.soulsafe-tetra-0.1.0.example.json`

## 3. API

### `POST /agent/:userId/chat`

**Body (existing fields):**

- `message` (string, required)
- `scope` (string, optional)
- `tools` (array, optional)

**Body (SOULSAFE):**

- `soulsafe` (boolean, optional) — when `true`, run four-effect fusion if energy allows.

**Response (SOULSAFE on):**

```json
{
  "reply": "fused assistant text",
  "energy": { "spoons": 8, "max": 12 },
  "soulsafe": {
    "schema": "p31.soulsafeTetra/0.1.0",
    "effects": {
      "structure": "…",
      "connection": "…",
      "rhythm": "…",
      "creation": "…"
    },
    "modelId": "@cf/meta/llama-3.1-8b-instruct-fast"
  }
}
```

**Response (SOULSAFE requested but spoons &lt; 3, or `soulsafe: false` with default-off):** legacy single-shot `reply` + `energy`. When fusion was **wanted** (default-on or `soulsafe: true`) but energy &lt; 3, response includes `soulsafeSkipped: { "reason": "low_energy", "minSpoons": 3 }` so clients can show transparency in the tetra shell.

## 4. Configuration

| Variable | Where | Meaning |
|----------|--------|---------|
| `SOULSAFE_CHAT_DEFAULT` | `wrangler.toml` `[vars]` | `"1"` → treat `soulsafe` as true when body omits `soulsafe`. |
| `soulsafe_prefs.default` | `PUT /agent/:userId/state` | `true` → same as `SOULSAFE_CHAT_DEFAULT=1` for that DO (per-user override). |
| `AI` binding | `wrangler.toml` `[ai]` | Required for fusion path. |

## 5. Operations

- **Deploy:** `pnpm --filter k4-personal verify` / `deploy` from `04_SOFTWARE`.
- **Health:** existing `/api/health`, `/agent/:id/health`.
- **Audit export:** SQL in DO (future: operator-only export route behind Access — not in v0.1).

## 6. Security

- CORS unchanged; **no** new public mutation routes.
- Specialist inputs use same **scrub** rules as legacy `_chat`.
- Trust boundary: **`EDGE-SECURITY`** patterns for any future audit HTTP API.

## 7. Roadmap

1. **v0.2:** Per-effect model routing (small/fast vs large), confidence scores, structured fusion JSON.
2. **v0.3:** Optional HITL via `p31-orchestrator` when fusion variance &gt; threshold.
3. **v0.4:** Align dock labels in manifest with last-run effect summaries.

## 8. Related docs

- `docs/PERSONAL-TETRA-UNIFIED-WORKER.md` — single-worker personal tetra shell.
- `docs/MESH-MAP-PERSONAL-START-PAGES.md` — isolation vs cage.
- `docs/egg-hunt-manifest.json` — SIC-POVM / K₄ metaphor.

*Updated: 2026-04-26.*
