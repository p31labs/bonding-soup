# Family sovereign pack — production handoff

**Updated:** 2026-04-26  
**Audience:** Household onboarding (print, PDF, or share link); operator leaves this after a setup night.  
**Share in one tap:** [https://p31ca.org/family-pack](https://p31ca.org/family-pack) (301 → printable page; same content as [family-sovereign-pack.html](https://p31ca.org/family-sovereign-pack.html)).  
**Canonical machine index:** [p31-super-centaur-pack.json](https://p31ca.org/p31-super-centaur-pack.json) (`p31.superCentaurStarterPack/1.0.0`).  
**Mesh URLs:** `p31-constants.json` → `mesh.*` (run `npm run verify:constants` after any edit).

---

## 0. Delivery kit (physical)

| Item | Why |
|------|-----|
| One device with **mobile data or known-good Wi‑Fi** | Rule out captive portals before the family blames the mesh. |
| **QR codes** (optional) | Generate from `https://p31ca.org/family-pack` and `https://p31ca.org/planetary-onboard.html` (any QR tool; no repo binary required). |
| **Printed** this doc **or** the live page (browser Print → PDF) | Works offline after first load; print view on the live page expands URLs. |
| **Household roster** (first names only) | Track who finished onboard → mesh-start; no full names in chat logs you don’t control. |

---

## 1. Tonight’s order (~25 minutes)

1. Open **[p31ca.org](https://p31ca.org/)** and **[delta.html](https://p31ca.org/delta.html)** on the **host’s** phone; confirm both load.
2. Save **household bookmarks**: hub, delta, [connect](https://p31ca.org/connect.html), [BONDING](https://bonding.p31ca.org), [geodesic](https://p31ca.org/geodesic.html) if you want a “curriculum” surface.
3. **Per person** (youngest first if attention is tight): pick a **welcome path** (section 3) → **planetary onboard** through **Pact** → **[mesh-start](https://p31ca.org/mesh-start.html)** (short [`/start`](https://p31ca.org/start)).
4. **Adults optional:** [Cognitive Passport](https://p31ca.org/passport) JSON for advocacy (not a medical record).
5. **Say out loud:** personal agent memory lives in **k4-personal**; it does **not** read the **family cage** until someone **explicitly** bridges. See `docs/MESH-MAP-PERSONAL-START-PAGES.md`.

---

## 2. Household bookmarks (lobby)

| What | URL |
|------|-----|
| Technical hub | https://p31ca.org/ |
| Resilience narrative (delta) | https://p31ca.org/delta.html |
| Family K₄ navigator | https://p31ca.org/connect.html |
| Planetary onboard | https://p31ca.org/planetary-onboard.html · short `/onboard` |
| Personal landing (after onboard) | https://p31ca.org/mesh-start.html · short `/start` |
| **This pack (live)** | https://p31ca.org/family-pack |
| Cognitive Passport | https://p31ca.org/passport |
| Creator economy (public contract) | https://p31ca.org/creator-economy.json |
| BONDING (3D builder) | https://bonding.p31ca.org |
| Geodesic coach | https://p31ca.org/geodesic.html |
| Initial Build intake | https://p31ca.org/build |
| Welcome packages (data) | https://p31ca.org/p31-welcome-packages.json |

### Trust & governance (generic public)

| Page | URL |
|------|-----|
| Public surface manifest (JSON) | https://p31ca.org/p31-public-surface.json |
| Privacy | https://p31ca.org/privacy |
| Terms | https://p31ca.org/terms |
| Contact / imprint | https://p31ca.org/contact |
| Accessibility | https://p31ca.org/accessibility |
| Security disclosure | https://p31ca.org/security |
| Open source | https://p31ca.org/oss |
| security.txt | https://p31ca.org/.well-known/security.txt |

---

## 3. Welcome packages → onboard (tone + docks)

Schema: `p31.welcomePackages/1.0.0`. Use **`?welcome=`** on **planetary-onboard** so copy and tetra defaults match the person.

| Package | Open |
|---------|------|
| Kid / teen | https://p31ca.org/planetary-onboard.html?welcome=kid |
| Adult · solo | https://p31ca.org/planetary-onboard.html?welcome=adult |
| Parent / caregiver | https://p31ca.org/planetary-onboard.html?welcome=parent |
| Neuro-inclusive | https://p31ca.org/planetary-onboard.html?welcome=neuro |
| Builder | https://p31ca.org/planetary-onboard.html?welcome=builder |
| Default | https://p31ca.org/planetary-onboard.html?welcome=default |

After onboard, **mesh-start** can keep the same key when you pass **`?welcome=`** through (see ground-truth `routes.meshStart`).

---

## 4. Edge anchors (from `p31-constants.json`)

Use for “where does my data live?” and **liveness** checks. Do not swap hosts without updating constants and dependents.

| Role | Key | Example base (verify in your clone) |
|------|-----|-------------------------------------|
| Personal K₄ + agent | `mesh.k4PersonalWorkerUrl` | `https://k4-personal.trimtab-signal.workers.dev` |
| Family cage | `mesh.k4CageWorkerUrl` | `https://k4-cage.trimtab-signal.workers.dev` |
| Hub fusion | `mesh.k4HubsWorkerUrl` | `https://k4-hubs.trimtab-signal.workers.dev` |

**Liveness:** see `p31-ecosystem.json` glass probes (e.g. personal **`/api/health`**). Do not invent fleet KPIs.

---

## 5. Copy-paste — invite to the household

```
We set up P31 — a private “room” per person on the mesh plus a shared hub.
Your link pack (open on Wi-Fi): https://p31ca.org/family-pack
Start your path: https://p31ca.org/planetary-onboard.html
Questions? Reply here — we can screen-share.
```

---

## 6. If something fails

| Symptom | Try |
|---------|-----|
| Blank / infinite load | Different browser; pause strict blockers for `p31ca.org` and the Worker host from constants. |
| Agent / mesh errors | `GET {k4PersonalWorkerUrl}/api/health`; align `mesh.*` in `p31-constants.json` with the deployed Worker. |
| SOULSAFE chat | Adults only until the household understands multi-call fusion (`docs/SOULSAFE-TETRA-SPEC.md`). |
| Passkeys | May still use stubs; see `AGENTS.md` for deploy state. |

---

## 7. Documentation stack (deeper reading)

| Order | Doc |
|-------|-----|
| 1 | `docs/README-REVIEW-DOCS.md` (index) |
| 2 | `docs/MVP-DELIVERABLES-INVENTORY.md` (what is LIVE vs roadmap) |
| 3 | `docs/MESH-MAP-PERSONAL-START-PAGES.md` |
| 4 | `docs/PERSONAL-TETRA-UNIFIED-WORKER.md` |
| 5 | `docs/P31-ENGINEERING-STANDARD.md` (if they develop locally) |

Repo layout: `P31-ROOT-MAP.md`. Agent rules: `AGENTS.md`.

---

## 8. Operator — how this pack was verified

From repo root (with Andromeda + p31ca present):

```bash
npm run release:all
```

**Definition of done:** root `verify` green, k4-personal wrangler dry-run green, `MESH_LIVE_STRICT=1` mesh probe green, p31ca `astro build` + `verify-p31ca-dist` green, p31ca `security:check` passed per current policy.

**Deploy hub:** `p31ca/dist/` → Cloudflare Pages (`AGENTS.md` → `deploy:p31ca`).

---

## 9. Scope limits (do not over-promise)

- **phosphorus31.org** is a parallel site; MAP/donate wiring is separate from the technical hub.
- **Passkey Worker** and other edge pieces may be staged; follow `AGENTS.md` and CWPs for deploy state.
- Default personal-tetra docks may still link out to p31ca static paths while same-origin bundling progresses (`docs/PERSONAL-TETRA-UNIFIED-WORKER.md`).

---

*Human companion to `p31-super-centaur-pack.json`; the JSON remains the machine index.*
