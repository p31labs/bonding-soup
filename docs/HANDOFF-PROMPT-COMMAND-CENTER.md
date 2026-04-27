# Agent handoff prompt — finish the P31 command center

**Copy everything below the line into a new agent session** (or attach this file). The operator (W.J.) wants a **detailed implementation handoff** to complete the “command center” work—this is **not** a generic request; it ties to concrete paths in the Andromeda monorepo.

---

## Role and success criteria

You are a **senior full-stack engineer** working the **P31 Andromeda** tree at `andromeda/04_SOFTWARE/`. Your job is to **review**, **close gaps**, and **ship** a coherent **operator command center story** across:

1. **EPCP Command Center** — Cloudflare Worker (fleet, D1, R2, Access, dashboards)  
2. **Sovereign Cockpit / Orchestrator** — static hub UI on p31ca that talks to the **orchestrator Worker**  
3. Optional alignment with **hub registry / ground truth** and **security runbook** expectations  

**Definition of done (operator-facing):**

- One clear mental model: **where to go** (URLs), **what is secured how** (Access vs Worker secrets), and **no world-writable mutation** on production orchestrator routes.  
- **Noisy debug behavior** removed or gated (e.g. logging every request in production).  
- **Wrangler / bindings** match what `src/index.js` actually uses (no dead routes that 503 forever because bindings are missing).  
- **Docs** updated in-repo so the next human does not guess.  
- **`npm run verify`** / **`npm run p31:all`** (home root) still pass after your changes, or you document why a path is skipped in partial clones.

**Hard rules (workspace):**

- Read **`AGENTS.md`**, **`P31-ROOT-MAP.md`**, and **`p31ca/docs/EDGE-SECURITY.md`** before editing.  
- Do **not** invent live mesh numbers; use **`p31-constants.json`** → **`apply:constants`** / verifiers for URLs.  
- Use initials **S.J.** / **W.J.** for children; no naval metaphors.  
- **Minimal diffs**—only what serves the command center handoff.  
- Children’s full names: never.

---

## Architecture map (which “command center” is which)

| Surface | Path | Role |
|--------|------|------|
| **EPCP Command Center** | `andromeda/04_SOFTWARE/cloudflare-worker/command-center/` | Worker: **main** operator glass — `STATUS_KV`, **D1** `epcp-audit`, **R2** forensics buckets, cron fleet ping, `/cloud` Cloud resource hub, RBAC, SSE, CRDT-related routes, `buildGodDashboardHtml()` for default HTML. Deploy: **`command-center`** in `wrangler.toml`. |
| **Sovereign Cockpit (Orchestrator UI)** | `andromeda/04_SOFTWARE/p31ca/src/pages/orchestrator.astro` + `src/components/OrchestratorDashboard.astro` | **Static** Astro page; fetches orchestrator API from **`orchestratorWorkerUrl`** (from `src/data/p31-mesh-constants.json`, generated from home **`p31-constants.json`** via `npm run apply:constants`). |
| **Orchestrator Worker (backend)** | *Not* under `p31ca/`—separate Worker repo/package (e.g. `p31-orchestrator` on `*.workers.dev`). | Implements `/api/orchestrator/status`, `/queue`, `/manual-review`, `/audit-log`, `/approve/:id` (see `OrchestratorDashboard.astro` fetch paths). **Auth must be enforced here** for mutations (see EDGE-SECURITY). |
| **sovereign-command-center** (if present) | separate Next.js app in monorepo | **Different product** per `docs/REVIEW-SUPPLEMENT-B-*.md` — do not merge with EPCP unless product asks. |
| **Mission control / wonky** | `p31ca/public/*.html` | Prototype / legacy MVP links — not the EPCP Worker. |

**Canonical URLs (verify in `p31-constants.json` and ground truth, do not trust prose alone):**

- Orchestrator base: `mesh.orchestratorWorkerUrl` (e.g. `https://p31-orchestrator.trimtab-signal.workers.dev`)  
- EPCP: `https://command-center.trimtab-signal.workers.dev` (and custom domain in Access if configured) per `command-center/STATUS.md`

---

## Code review notes (as of 2026-04-25)

### EPCP Worker (`cloudflare-worker/command-center/src/index.js`)

- **Request logging:** Every fetch logs `console.log([WORKER] ${method} ${path}...)` (line ~175). This is **operator-noisy** and may leak traffic patterns. **Gate** with `env.ENVIRONMENT === 'development'` or a `DEBUG_ACCESS_LOG` var, or sample at low rate.  
- **CRDT / Durable Objects:** Code paths use `env.CRDT_SESSION_DO` and `CrdtQueueProcessor` / `CrdtSessionDO` (imports). **The checked-in `wrangler.toml` does not define `[[durable_objects]]` or migrations** — so `/api/crdt/session` may **503** with `CRDT_SESSION_DO not bound` in dev/prod unless another config is used. **Reconcile:** either add DO bindings + migrations to `wrangler.toml` and document, or mark routes experimental and return a clear 501 until bound.  
- **Authentication:** `authenticate` / `withAccess` / `isAdmin` — Access JWT + email role mapping. **Review** for consistency on routes that use only `Cf-Access-Authenticated-User-Email` vs full `withAccess`.  
- **Fleet ping:** `pingFleet` + cron — synthetic `rps` uses `Math.random()` for glow UI — **document** that this is illustrative, not metrics.  
- **`handleCfSummary`:** Requires `Authorization: Bearer` match to `env.STATUS_TOKEN` — ensure **CLOUD_HUB** / secrets docs list required secrets.  
- **DEFAULT_STATUS:** Large embedded JSON (legal/financial/dates) — **stale content risk**; consider driving critical dates from D1 or a single config file to avoid legal copy drift.  
- **Admin route `/api/admin/crdt-access-bypass`:** Patches Cloudflare Access app via API — **high power**; confirm logging and admin-only gating; ensure errors do not surface tokens.

### p31ca Orchestrator UI (`OrchestratorDashboard.astro`)

- Fetches from **`orchestratorBase`** only; **no client-side auth** — consistent with EDGE-SECURITY: **Worker must gate mutations**.  
- **Egg-hunt:** Comment references hostname for `verify-egg-hunt` — if you change URLs, run root **`npm run verify`** and **`apply:constants`**.  
- UI shows “System Online” badge **statically**; consider wiring to first successful `/api/orchestrator/status` or error state.  
- `public/dev-workbench.html` duplicates orchestrator URL concept — if you add hub links, keep **one** source of truth (`p31-constants.json`).

### Security policy (must read)

**`p31ca/docs/EDGE-SECURITY.md`** (Orchestrator section):

- Static page is **not** an auth layer.  
- **p31-orchestrator Worker** must enforce: Cloudflare **Access** and/or **Bearer** secret, **rate limits**, **audit** for approvals/mutations.  
- **POST / approve / queue** must not be world-writable.  
- Policy reference: “**F8: closed**” — implementation is **in the orchestrator worker deploy**, not in Astro HTML alone.

**Your task likely includes** verifying the **p31-orchestrator** Worker repository (if it is in the same monorepo under a different path, find it; if external, state that and list exact API contract from `OrchestratorDashboard.astro`).

---

## Suggested work order (for the next agent)

1. **Inventory** all routes in `command-center/src/index.js` and **map** to bindings in `wrangler.toml` and secrets — produce a small table in `command-center/CLOSURE.md` or update `STATUS.md` with “known gaps.”  
2. **CRDT / DO:** Either wire DOs in wrangler + migrations **or** explicitly disable and document.  
3. **Logging:** Reduce production noise.  
4. **Orchestrator Worker:** Read `OrchestratorDashboard.astro` for **exact** HTTP methods and paths; implement/verify **auth + rate limit + audit** per EDGE-SECURITY.  
5. **Hub alignment:** If product wants one entry point, add a **registry** / **ground-truth** link row for EPCP vs Orchestrator (follow existing patterns in `p31ca/ground-truth/p31.ground-truth.json` — do not hand-edit public mirrors without verifiers).  
6. **Tests:** In `command-center/`, `npm test` / `npm run test:integration` as appropriate; in `p31ca`, e2e may hit `/` not necessarily `/orchestrator` — add a **smoke** if requested and stable.  
7. **Run** from home: `npm run verify` and, with full tree, `npm run p31:all` (or `p31:ci:all` for lighter). Fix regressions.  

---

## UX / product north star (optional)

The file **`Neuro-Inclusive Mesh Dashboard Design.txt`** (repo root) describes **P31 Command Center** UX goals (AuDHD envelope, density modulation, K₄ spatial chunking, “calcium cage” metaphor for overload — **user-facing copy should avoid internal metaphors** where inappropriate). If you polish UI, prefer **accessibility, contrast, and predictable density** over decorative complexity.

---

## Deliverables

1. **PR-ready commits** with clear messages.  
2. **Short `STATUS.md` or `CLOSURE.md` update** in `command-center/` listing what was finished vs deferred.  
3. If you touch `p31-constants.json`, run **`npm run apply:constants`** and **`npm run verify:constants`**.  
4. If you touch the passport or hub contracts, run **`npm run verify:passport`** and **`p31ca` verifiers** as per `AGENTS.md`.

---

## Quick file index

- `andromeda/04_SOFTWARE/cloudflare-worker/command-center/src/index.js` — main Worker  
- `andromeda/04_SOFTWARE/cloudflare-worker/command-center/wrangler.toml` — bindings (verify DO vs code)  
- `andromeda/04_SOFTWARE/cloudflare-worker/command-center/STATUS.md` — live status narrative  
- `andromeda/04_SOFTWARE/p31ca/src/components/OrchestratorDashboard.astro` — hub orchestrator UI  
- `andromeda/04_SOFTWARE/p31ca/src/pages/orchestrator.astro` — page shell  
- `p31-constants.json` (home) — `mesh.orchestratorWorkerUrl`  
- `p31ca/docs/EDGE-SECURITY.md` — orchestrator trust boundary  
- `docs/REVIEW-SUPPLEMENT-B-WORKERS-AND-PACKAGES.md` — “which command center is which”

---

*Generated for operator handoff. Scope: “finish the command center” = close Worker/UI/security/binding gaps above; adjust if the operator names a different priority (e.g. only EPCP or only Orchestrator).*
