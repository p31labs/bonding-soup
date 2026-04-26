# Family sovereign pack — production handoff

**Updated:** 2026-04-26  
**Audience:** Household onboarding (print or PDF); operator leaves this with the family after setup night.  
**Canonical machine index:** `https://p31ca.org/p31-super-centaur-pack.json` (`p31.superCentaurStarterPack/1.0.0`).  
**Mesh URLs:** `p31-constants.json` → `mesh.*` (run `npm run verify:constants` after any edit).

---

## 1. Household bookmarks (lobby)

| What | URL |
|------|-----|
| Technical hub | https://p31ca.org/ |
| Resilience narrative (delta) | https://p31ca.org/delta.html |
| Family K₄ navigator | https://p31ca.org/connect.html |
| Planetary onboard (start here for new members) | https://p31ca.org/planetary-onboard.html |
| Personal landing (after onboard) | https://p31ca.org/mesh-start.html |
| Short URL to mesh-start | https://p31ca.org/start |
| Cognitive Passport | https://p31ca.org/passport |
| Creator economy (public contract) | https://p31ca.org/creator-economy.json |
| BONDING (3D builder) | https://bonding.p31ca.org |
| Geodesic coach | https://p31ca.org/geodesic.html |
| Initial Build intake | https://p31ca.org/build |

---

## 2. Edge anchors (from `p31-constants.json`)

Use these for health checks and “where does my data live?” explanations. Do not substitute other hosts without updating constants and redeploying dependents.

| Role | Key | Production base (snapshot) |
|------|-----|----------------------------|
| Personal K₄ + agent | `mesh.k4PersonalWorkerUrl` | https://k4-personal.trimtab-signal.workers.dev |
| Family cage | `mesh.k4CageWorkerUrl` | https://k4-cage.trimtab-signal.workers.dev |
| Hub fusion | `mesh.k4HubsWorkerUrl` | https://k4-hubs.trimtab-signal.workers.dev |

**Liveness (examples):** `GET …/api/health` on k4-personal (see `p31-ecosystem.json` glass probes).  
**Privacy:** Personal Durable Object state does not read family cage KV by default; cage bridge is explicit opt-in. Details: `docs/MESH-MAP-PERSONAL-START-PAGES.md`, `docs/PERSONAL-TETRA-UNIFIED-WORKER.md`.

---

## 3. Per-person checklist (repeat for each member)

1. Open **planetary onboard**; use `?a=child` or `?a=elder` when it fits.
2. Complete flow through **Pact**; identity lands in browser storage per onboard design.
3. Open **mesh-start**; confirm dial and optional agent health.
4. Optional: generate a **Cognitive Passport** JSON for advocacy or care coordination (not a medical record).
5. Optional **SOULSAFE** chat: adults only until the household understands multi-call fusion; see `docs/SOULSAFE-TETRA-SPEC.md`.

---

## 4. Documentation stack (deeper reading)

| Order | Doc |
|-------|-----|
| 1 | `docs/README-REVIEW-DOCS.md` (index) |
| 2 | `docs/MVP-DELIVERABLES-INVENTORY.md` (what is LIVE vs roadmap) |
| 3 | `docs/MESH-MAP-PERSONAL-START-PAGES.md` |
| 4 | `docs/PERSONAL-TETRA-UNIFIED-WORKER.md` |
| 5 | `docs/P31-ENGINEERING-STANDARD.md` (if they develop locally) |

Repo layout: `P31-ROOT-MAP.md`. Agent rules: `AGENTS.md`.

---

## 5. Operator — how this pack was verified

From repo root (with Andromeda + p31ca present):

```bash
npm run release:all
```

**Definition of done:** root `verify` green, k4-personal wrangler dry-run green, `MESH_LIVE_STRICT=1` mesh probe green, p31ca `astro build` + `verify-p31ca-dist` green, p31ca `security:check` passed per current policy.

**Deploy hub (operator):** `p31ca/dist/` → Cloudflare Pages (see `AGENTS.md` → `deploy:p31ca`).

---

## 6. Scope limits (do not over-promise)

- **phosphorus31.org** is a parallel site; MAP/donate wiring is separate from the technical hub.
- **Passkey Worker** and other edge pieces may be staged; follow `AGENTS.md` and CWPs for deploy state.
- Default personal-tetra docks may still link out to p31ca static paths while same-origin bundling progresses (`docs/PERSONAL-TETRA-UNIFIED-WORKER.md`).

---

*This file is the human-facing companion to `p31-super-centaur-pack.json`; the JSON remains the machine index.*
