# Mesh map — personal start pages & worker agents

**Updated:** 2026-04-26  
**Audience:** Operator, product, agents implementing onboarding + edge.

## Vision

Every **mesh member** (family, friends who opt in, public participants you invite) gets:

1. **Their own starting page** — one URL that feels like *home* for them: dial, copy, and next actions matched to role (child, elder, builder, guest), not a generic catalog.
2. **Their own personal worker agent** — an isolated **Durable Object** (SQLite state) that holds chat history, profile, spoon/energy model, reminders, scrub rules, and optional bio telemetry — scoped so it does not bleed into the family cage unless they explicitly bridge.

This is **not** “one chatbot for everyone.” It is **one agent instance per stable identity**, behind a **routing contract** the hub and onboarding flows honor.

## What already exists (ground in repo)

| Piece | Location / behavior |
|--------|---------------------|
| **Personal agent (DO)** | `andromeda/04_SOFTWARE/k4-personal` — `PersonalAgent` with `/chat`, `/state`, `/reminders`, `/energy`, `/bio`, etc. Router: **`/agent/:userId/...`** maps to `PERSONAL_AGENT.idFromName(userId)`. |
| **Archetype onboarding (static)** | `p31ca/public/planetary-onboard.html` — `?a=child \| elder \| default`; Phase 5 persists `p31_subject_id` + `p31_onboard_meta` in `localStorage` and redirects to **`/mesh-start.html`** (short **`/start`**). |
| **Personal landing (MVP)** | `p31ca/public/mesh-start.html` — probes `k4-personal` `/health`, `/agent/:id/health`, `/energy`; seeds `PUT .../state`; simple `POST .../chat`; `?agent=` overrides worker origin (default prod worker URL). |
| **Family cage (shared)** | `k4-cage` and related workers — **shared** topology and edges; distinct from **personal** scope. |
| **Passport / advocacy** | Cognitive Passport generator (`p31ca.org/passport`) — portable **human** context; complements the **machine** agent profile in DO `state.profile`. |
| **Agent rules (docs)** | `CLAUDE.md` / tools: *personal K₄ mesh (pillars a–d), isolated KV* — same **shape** as cage personal scope; implementation path may be KV + DO together over time. |

## Target model (packages per person)

| Layer | Deliverable | Notes |
|--------|-------------|--------|
| **Identity** | Stable **`subject_id`** (passkey credential id hash, or signed session from your passkey worker; avoid raw email as DO name in URLs) | Binds `idFromName(subject_id)` to exactly one DO. |
| **Starting page** | **Personal landing** — static shell + JSON config | Options: (a) `start.p31ca.org/?s=<token>` → edge resolves config from KV; (b) `/me/<subject_id>` behind auth; (c) per-subdomain later. Config drives: archetype, CTAs, visible hubs, dial defaults. |
| **Personal agent** | Same worker: `GET/POST .../agent/{subject_id}/chat` (and siblings) | Profile seed from passport JSON or onboarding Phase “Pact” — **operator-controlled** what syncs into `state.profile`. |
| **Bridge to cage** | Explicit **opt-in** API or hub action | Personal DO never reads cage KV by default; “share edge with family” is a deliberate mutation. |

## Rings (who gets which package)

| Ring | Starting page emphasis | Agent emphasis |
|------|-------------------------|----------------|
| **Family (cage)** | Child vs elder variants; minimal text; big CTAs; optional “already set up” path | Spoon tracking, reminders, medication hooks already in schema; calcium alerts aligned with operator medical context in agent rules |
| **Friends / builders** | Registry, geodesic, BONDING, docs links; “your worker health” | Tool lists in chat payload (`tools` in `/chat`); later: registry lookups, deploy status (read-only) |
| **Public / invite** | Planetary onboard → delta → connect; no cage data | Thin agent or **disabled** until passkey/invite completes; rate limits + no PII in URLs |

## Phased delivery

**Phase 1 — Contract** *(in progress)*  
`subject_id` derivation (passkey `rawId` hash → `u_<hex>`, skip/guest → `guest_<random>`), `k4-personal` CORS for p31ca / bonding / phosphorus31 / localhost / `*.pages.dev`, onboard redirect target **`/mesh-start.html`**. Ground truth: `meshStart` route + **`/start`** redirect in `p31.ground-truth.json` / `_redirects`.

**Phase 2 — Personal landing MVP** *(partial)*  
**Shipped:** static `mesh-start.html` + dial query param; **next:** KV `START_CONFIG:{subject_id}` and edge merge for per-user copy beyond localStorage.

**Phase 3 — Bind onboard → agent** *(partial)*  
Onboard → localStorage → mesh-start → `.../agent/{subject_id}/chat` wired; deepen pact → profile sync and thread UX.

**Phase 4 — Cage bridge (optional)**  
CWP / mesh-bridge pattern: copy `integration-handoff/CWP-30/mesh-bridge.ts` ideas into `phosphorus31.org` or cage only when SUPER-CENTAUR doc says so.

## Success criteria

- A **new** member can open **one** bookmarked URL and see **their** dial and next step, not the full hub catalog.
- Their **agent** remembers profile + energy across sessions without sharing that state with another member’s DO.
- Auditors can read this file + `k4-personal` routes and understand **isolation** vs **cage**.

## Related docs

- `docs/MVP-DELIVERABLES-INVENTORY.md` — what is live today.  
- `P31-ROOT-MAP.md` — site tracks (p31ca vs phosphorus31.org vs home vertical).  
- `docs/GEODESIC-CAMPAIGN.md` — progressive on-ramp pattern to mirror on **start pages** (short steps, skip OK).  
- `andromeda/04_SOFTWARE/integration-handoff/` — SUPER-CENTAUR / mesh bridge handoff.
