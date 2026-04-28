# C.A.R.S. — when-scale plan (not if)

**Naming:** **`docs/CARS-NAMING.md`**.

**Assumption:** Small-circle, co-presence interfaces **will** eat a growing share of what people mean by “social.” C.A.R.S. is an early **reference implementation** of that shift — bounded rooms, ethical UX, mesh-backed identity. This doc is the **execution spine**: plan the work, work the plan, prove it with **`verify`** and deploy discipline.

**Entry points:** Linked from **`soup.html`**, **`poets-room.html`**, **`p31-personal-howto.html`**, **`docs/doc-library/index.html`**, **`docs/physics-learn/index.html`**, **`cognitive-passport/index.html`** (footer), **`fleet-portal.html`** (footer); command-center **ribbon** (`scripts/p31-local-command-center.mjs`). **`AGENTS.md`** §1c for agents.

**North star:** Same bowl, same room — **your people first**; no stranger scoreboard; economics and copy stay **public and ethical** (`docs/ETHICAL-STYLE-MAP.md`, `docs/P31-CREATE-CONNECT-ETHICAL-MONETIZATION.md`).

---

## Scale (what we’re growing)

**Scale** here means **more trusted co-presence without turning the bowl into a stadium** — bounded rooms, honest roster, edge budgets, and **no** engagement hacks. Three axes:

| Axis | Target posture | Proof / anchor |
|------|----------------|----------------|
| **Room depth** | Small groups (family / invite-only); roster + WS honest in UI (`data-soup-*` on `soup.html`) | `src/soup.ts` WS + reconnect; `spikes/mock-ws-server/` family `room=` mode; **`docs/wcd-32-websocket-spec.md`** |
| **Edge / bandwidth** | Low Hz state sync, interpolation on client; stay inside mobile-ish budgets in WCD-32 | WCD-32 §2–3; Cloudflare Worker limits when Soup moves off mock-only |
| **Product surface** | More **doors** into the same room (hub card, passport, bonding URL) — ephemeralize copy via **`apply:constants`**, not hand-wavy marketing | **`docs/P31-HUB-CARD-ECOSYSTEM.md`**, **`p31-constants.json`**, **`verify:mesh`** |

**Spec hygiene (track, don’t ignore):** WCD-32 §2.1 cites **500ms** initial reconnect backoff; **`src/soup.ts`** currently starts at **5s**. When scaling hardens, **either** align the spec to the shipped constant **or** change the constant and test — don’t let three sources drift silently.

**Phase 1 “scale” exits (concrete):**

1. **Document** the live path: mock dev (`?ws=`), family room query params, and where production WS will live — one short section in **`README.md`** (Soup vertical) or WCD-32 pointer from **`P31-ROOT-MAP.md`**.
2. **Exercise** reconnect + roster: **`npm run soup:room-scale`** (probe) + manual **`docs/SOUP-ROOM-SCALE-RUNBOOK.md`** (two tabs, stop/start server).
3. **UI truth:** disconnected vs reconnecting vs live must match engine state (no fake “live” badge).

---

## Cadence (operator)

| Rhythm | Action |
|--------|--------|
| **Weekly** | Ship one visible improvement OR one reliability fix; run **`npm run verify`** before merge. |
| **Per release** | **`release:check`** / **`polish`** per `AGENTS.md`; bonding deploy when Soup surface changes (`npm run sync:soup-bonding` when that path is in scope). |
| **Quarterly** | Re-read **assumptions** below; adjust dates and scope; archive superseded bullets in git history, not duplicate docs. |

---

## Phases (sequential; each exits with gates)

### Phase 0 — **Proof and parity** (now)

| Work | Done when |
|------|-----------|
| Ethical baseline locked | Soup + `soup-quantum.css` align **`docs/ETHICAL-STYLE-MAP.md`**; no new extractive patterns. |
| Tooling trusted | Root **`npm run verify`** green on main; doc index current (`build:doc-index`). |
| Deploy path clear | Bonding Soup URL and sync story documented in **`P31-ROOT-MAP.md`** / runbooks; no drift vs **`p31-constants.json`** for named URLs. |
| **When:** | **Continuous** — default bar for every PR touching Soup or mesh. |

### Phase 1 — **Room scale** (tight groups)

| Work | Done when |
|------|-----------|
| Co-presence reliability | **`docs/SOUP-ROOM-SCALE-RUNBOOK.md`** + **`npm run soup:room-scale`**; reconnect and “who’s here” honest in UI. |
| Room boundaries | Family / invite model matches K₄ / PAR story (`docs/MESH-MAP-PERSONAL-START-PAGES.md`, cage docs) — no accidental global discovery. |
| Metrics | Only **bounded, informational** feedback (ethical map §6); no variable-ratio “rewards.” |
| **When:** | **Next** after Phase 0 is stable — target window recorded in git tag or release note, not guessed here. |

### Phase 2 — **Mesh scale** (P31 stack)

| Work | Done when |
|------|-----------|
| Hub + passport on-ramps | Clear paths from hub cards / passport to Soup or bonding — one **`appUrl`**, one story (`docs/P31-HUB-CARD-ECOSYSTEM.md`). |
| Live mesh | **`p31-constants.json`** URLs and **`verify:mesh`** / personal Worker checks match what operators actually run. |
| Monetization | Donate / creator flows only through **verified** contracts (`verify:monetary`, creator-economy JSON). |
| **When:** | **After** Phase 1 room story is credible with real users in one circle. |

### Phase 3 — **Interop** (posture, not promise)

| Work | Done when |
|------|-----------|
| Federation / export | ADR or CWP when a concrete protocol is chosen; until then, **no** fake “open” claims in marketing. |
| **When:** | **When** Phase 2 surfaces stable APIs or data shapes worth bridging — document the trigger in an ADR. |

---

## Ephemeralization rule for this plan

- **One** plan file (this). Roadmap detail lives in **issues / CWPs / ADRs**; don’t fork competing “vision” markdown.
- When mission or phases change, **edit this file** and run **`npm run build:doc-index`** so the library stays searchable.

---

## See also

| Doc | Role |
|-----|------|
| `docs/ETHICAL-STYLE-MAP.md` | Non-extractive UX law |
| `docs/P31-CREATE-CONNECT-ETHICAL-MONETIZATION.md` | Create / connect + ethical money |
| `docs/P31-ALIGNMENT-SYSTEM.md` | Sources, derivations, verify |
| `docs/SIC-POVM-K4-ARCHITECTURE.md` | Four-vector framing |
| `P31-ROOT-MAP.md` | Where Soup lives in the multi-root tree |
| `docs/wcd-32-websocket-spec.md` | WS cadence, payloads, mobile budgets |
| `spikes/mock-ws-server/README.md` | Local multiplayer / family room dev |
| `docs/SOUP-ROOM-SCALE-RUNBOOK.md` | Phase 1 manual + automated gate (`soup:room-scale`) |
| `tests/soup-room-scale/README.md` | Reserved for future Playwright room tests |

**Version:** 1.2.0 — **scaffold:** room-scale runbook, `soup:room-scale`, `tests/soup-room-scale/`.
