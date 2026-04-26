# Supplement B — `wrangler.toml` packages and edge map (for Gemini / Opus)

**Purpose:** Inventory of **Cloudflare Worker / Pages**-style packages under `andromeda/04_SOFTWARE/` that use **`wrangler.toml`**, plus a clear **“which command center is which”** map. The `name =` in each `wrangler.toml` is the default Worker (or project) name; **routes and hosts** are per-file.

**Caveat:** Deployed URLs (`*.workers.dev`, custom hosts) are **not guaranteed** by this list — read each `wrangler.toml`, `README`, and `DEPLOY.md`. Examples: `command-center.trimtab-signal.workers.dev`, `k4-cage.trimtab-signal.workers.dev`.

**Last updated:** 2026-04-25

---

## B.1 Packages with `wrangler.toml` (indicative — re-scan with `find`)

Paths are under `andromeda/04_SOFTWARE/` unless noted.

| Path | Role | Auth (typical) |
|------|------|-----------------|
| `k4-cage/` | **K₄ mesh** — `/api/*`, `/ws/*`, health, admin | `ADMIN_TOKEN`, `INTERNAL_FANOUT_TOKEN`, service bindings |
| `cloudflare-worker/command-center/` | **EPCP** — fleet, D1, R2, panic | Cloudflare Access JWT + `ADMIN_TOKEN` |
| `k4-hubs/` | Hubs; bindings to k4-cage | Service bindings |
| `k4-personal/` | Personal cage | Gated |
| `kenosis-mesh/` | 7-node mesh | `AUTH_TOKEN` / Bearer |
| `p31-agent-hub/` | Agent ↔ cage | Bindings |
| `bonding/` | BONDING / relay (per package) | Varies |
| `workers/` | General Workers | Varies |
| `telemetry-worker/` | Telemetry | Internal tokens |
| `p31-cortex/`, `p31-forge/`, `p31-state/`, `p31-hearing-ops/` | Service Workers | Bearer |
| `donate-api/` | Donations | Stripe + admin |
| `genesis-gate/` | Governance / telemetry | `ADMIN_TOKEN` |
| `cloudflare-worker/bouncer/` | Bouncer | `BOUNCER_GATE_TOKEN` |
| `cloudflare-worker/social-drop-automation/` | Social | Per package |
| `p31ca/` | **Pages** deploy (`wrangler pages deploy` in `package.json`) | Pages token |
| `spaceship-earth/`, `packages/quantum-edge/`, `packages/node-zero/pwa/` | As configured | Varies |
| `unified-k4-cage/` | Alternate / unified k4 | Per docs |

**`api.phosphorus31.org`:** logical payment API host — **implementation package** is whatever Worker the operator deployed for Stripe direct; **confirm** in monorepo and Cloudflare dashboard.

**Fleet count (April 2026):** operator docs cite **~10** production Workers in the managed fleet; exact membership changes with deploys.

---

## B.2 Which “command center” is which

| Surface | Stack | URL pattern (example) | Role |
|---------|--------|------------------------|------|
| **EPCP command-center** | Worker + static UI in `cloudflare-worker/command-center/` | `…command-center….workers.dev` | **Primary** glass pane: fleet, audit, forensics, panic (per EPCP reports). |
| **sovereign-command-center** | **Next.js** app | Not necessarily `*.workers.dev` | Social / mobile-first dashboard — **separate** product; not the EPCP Worker. |
| **p31ca** (orchestrator, dome) | Astro + static | `p31ca.org` | **Public** technical hub — catalog, passport, dome — not the operator EPCP. |
| **Spaceship Earth** | PWA | Own host | In-app cognitive UX — **depth** app, not EPCP. |

**Intent:** EPCP Worker is the **unified** operator plane; other UIs are **depth surfaces** or legacy unless explicitly merged in a CWP.

---

## B.3 Auth summary

| Pattern | Use |
|---------|-----|
| Cloudflare Access JWT | Human operator gate on sensitive routes. |
| Bearer / `ADMIN_TOKEN` | Worker admin and telemetry append. |
| `INTERNAL_FANOUT_TOKEN` | k4-cage → room broadcast. |
| `BOUNCER_GATE_TOKEN` | Bouncer. |
| Service bindings | DO / Worker RPC on Cloudflare. |
| Stripe keys | `donate-api`, `api.phosphorus31.org` patterns. |

No **single** OAuth2 “P31 login” in-repo for all products; identity is **edge-native** (Access + secrets).

---

## B.4 Data stores (typical)

| Store | Role |
|-------|------|
| D1 (`epcp-audit` or project-specific) | Append-only events |
| KV | Config, status, room/spoon metadata |
| R2 | Forensics, exports |
| Durable Objects | k4-cage topology + family room |

---

## B.5 WCD-33 / archive

WCD-33 and **`wcd33-global-archive/`** (at **P31 home root**, not only `04_SOFTWARE/`) cover the **Soup archive** Worker; see `wcd33-global-archive/DEPLOY.md`.

---

*See `REVIEW-SUPPLEMENT-C` for CWP, research DOIs, and Node Zero handoff.*
