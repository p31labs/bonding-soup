# Personal tetrahedron — everything in *one* Worker / agent (architecture)

**Intent:** Each person (including S.J. and W.J.) has **one** logical home: the **k4-personal** Cloudflare Worker plus **one** `PersonalAgent` Durable Object per `userId`. “Everything” — mesh state, tetra docks, coding play, assistant memory — should **hang off that boundary** instead of scattering across unrelated origins and products.

**Ground truth today (already in repo):**

| Layer | What it is |
|--------|------------|
| **Worker `k4-personal`** | Public routes: `GET /api/mesh`, `/api/health`, presence/ping, `/viz` — **personal K₄** (vertices **a–d**), KV keys `k4s:personal:*`. |
| **DO `PersonalAgent`** | Per-user SQLite: `/agent/:userId/chat`, `/state`, `/reminders`, `/energy`, `/tetra`, … — **this is their agent**. |
| **`p31.personalTetra/1.0.0`** | Four docks (structure, connection, rhythm, creation). Defaults in `k4-personal/src/personal-tetra.js` point **out** to **`p31ca.org`** static paths (`/ede.html`, `/connect.html`, …). Docks may use `kind: "link"` or **`kind: "worker"`** (schema already allows it). |

So the **personal tetra worker/agent already exists**; what you want is to **pull the experience inward** so docks and tools are **same-trust, same-origin** (or explicitly proxied) under that Worker, not a grab bag of hub pages.

---

## Target picture: “one tetra, one agent, one origin”

```
Browser tab (kid)
    → https://k4-personal....workers.dev (or custom host)
         /api/mesh              personal K₄
         /agent/{userId}/*      PersonalAgent (chat, state, tetra, code, …)
         /u/{userId}/…          optional: static shell or deep links (same worker)
```

**Principles**

1. **Identity:** Stable `userId` → `PERSONAL_AGENT.idFromName(userId)` — already the model in `k4-personal/src/index.js`.
2. **Tetra = UI + meaning:** The four vertices are not decorative; they map to **capabilities** stored in `state.personalTetra` and served via `GET/PUT /tetra` inside the DO.
3. **“Vibe coding” inside the tetra:** Heavy work (Monaco, WebContainer, Pyodide) stays **in the browser**; the **agent** stores **snippets, projects metadata, preferences** in SQLite — not raw trust in a third-party “cloud IDE” for minors.
4. **No silent bridge to family cage:** Personal DO does not read cage KV by default (unchanged from `docs/MESH-MAP-PERSONAL-START-PAGES.md`).

---

## Shipped (scaffold) — in this repo

| Route | Notes |
|--------|--------|
| **`GET /u/:userId/home`** | HTML shell: four in-page docks + p31ca.org links; loads **`GET /agent/:userId/tetra`**; **`POST /agent/:userId/chat`**. `k4-personal/src/tetra-home-html.js` |
| **`GET /agent/:userId/manifest`** | `p31.personalAgentManifest/0.1.0` — `personalTetra`, `profile`, `energy`, **`soulsafeTetra`**, **`retention`** (`p31.agentRetention/0.1.0`, `chatMessagesMaxRows`, `strategy: delete_oldest_over_cap`), `service` |
| **`POST /agent/:userId/chat` + SOULSAFE** | Optional fusion: `{ "soulsafe": true }` or default via `SOULSAFE_CHAT_DEFAULT` / `state.soulsafe_prefs.default` — four parallel specialist `AI.run` calls + fusion; skipped if spoons &lt; 3. Audit: `soulsafe_runs`. **Spec:** `docs/SOULSAFE-TETRA-SPEC.md`. **Hub** `mesh-start.html` and **tetra shell** sync `soulsafe_prefs` with `PUT /state`. Skipped if spoons are below 3. |
| **CORS** | `*.workers.dev` (and existing origins) for same-origin fetches from the shell |

**Next:** default `personalTetra` `href`s → worker paths; bundle EDE under `/static/…`; enrich manifest with `codeProjects` when stored.

---

## What to build (phased)

### Phase 1 — **Docks point at the Worker, not only p31ca** *(shell done; defaults still p31ca in `defaultPersonalTetra`)*

- **Done:** **`GET /u/:userId/home`** — one page on **`k4-personal`**; tetra copy can be overridden with **`PUT /agent/:userId/tetra`**.
- **Next:** change **default** `personalTetra.docks[].href` (or seed on first open) to worker URLs; optional `/static/ede/` on same host.

### Phase 2 — **Bundle “EDE / code play” as Worker assets**

- Add **static assets** to the `k4-personal` bundle (or **R2** binding) for the mini-IDE / EDE slice so **creation** dock is `kind: "worker"` with `href: "/static/ede/"` on the **same** worker host.
- **CPU limits:** keep compile/run **client-side**; Worker only saves **files metadata** or small text in DO storage.

### Phase 3 — **Single “home” API for any client** *(manifest v0.1.0 done)*

- **Done:** **`GET /agent/:userId/manifest`** — `personalTetra`, `profile`, `energy`, `soulsafeTetra` (see **SOULSAFE** below), `retention` (message row cap), `service`.
- **Next:** add mesh summary + `codeProjects` (when stored) for one round-trip to replace multiple fetches in `mesh-start.html` / native shells.

### Phase 4 — **AI only through the agent (optional)**

- If you use Workers AI for “vibe help,” call **`@cf/...` from inside `PersonalAgent._chat`** (already uses `env.AI`) — **not** a separate public agent-hub tab for kids.  
- **p31-agent-hub** remains for **internal** / **adult** orchestration; kids’ path = **k4-personal only**.

---

## Security & privacy (non-negotiables)

- **TLS + CF edge** on the Worker; **no secrets** in URLs; `userId` must not be PII (prefer subject id from passkey hash per existing handoff docs).
- **SQLite in DO** is the **only** long-lived memory for that user in this stack; define **retention / export** for minors with the operator.
- **CORS:** already allowlisted for p31ca / localhost; if you add a **first-party** domain for k4-personal, add it to `corsHeaders` in `k4-personal/src/index.js`.

---

## Files to touch when implementing

| Area | Path |
|------|------|
| Tetra defaults & validation | `andromeda/04_SOFTWARE/k4-personal/src/personal-tetra.js` |
| Router + new routes | `andromeda/04_SOFTWARE/k4-personal/src/index.js` |
| DO routes (tetra, chat, future code) | `andromeda/04_SOFTWARE/k4-personal/src/index.js` (`PersonalAgent`) |
| Mesh package (optional API shape) | `andromeda/04_SOFTWARE/packages/k4-mesh-core/personal-handlers.js` |
| Hub static (temporary) | `p31ca/public/mesh-start.html` — point at **Worker shell URL** when ready |
| Constants | `p31-constants.json` `mesh.k4PersonalWorkerUrl` — **single** public base for that worker |

---

## Success criteria

- A kid opens **one URL** on **k4-personal**, authenticates (or guest) as **their** `userId`, and gets **mesh + tetra + code + chat** without leaving that **Worker/DO** trust zone.
- **p31ca.org** remains the **front door**; **k4-personal** becomes the **room** — not seven different products for one child.

*See also: `docs/MESH-MAP-PERSONAL-START-PAGES.md`, `docs/PLAN-KIDS-VIBE-CODING.md`, `k4-personal/README.md`, **`docs/SOULSAFE-TETRA-SPEC.md`** (four-effect fusion + audit in `PersonalAgent`).*
