# BONDING Soup

TypeScript molecular / affective sim (`src/`), built to `dist/`. Entry for local play: **`soup.html`**.

**Workspace context:** this directory also holds **Andromeda**, **phosphorus31.org**, spikes, and docs. For how those paths relate without merging repos, read **`P31-ROOT-MAP.md`**. For agents/IDE: **`AGENTS.md`**. **Personal command/repo cheat sheet:** **`docs/P31-PERSONAL-HOW-TO.md`** (interactive UI: **`p31-personal-howto.html`**, e.g. with **`npm run demo`**).

**Engineering standard:** before merge or deploy, follow **`docs/P31-ENGINEERING-STANDARD.md`** (`npm run verify`, `npm run release:check` when the full tree is present). Andromeda monorepo bar: **`andromeda/docs/ENTERPRISE_QUALITY.md`**.

## First-time / clean machine setup

Use **Node 20** (see `.nvmrc`). One command aligns dependencies, regenerates operator constants into ground-truth / generated files, and runs the same **`verify`** bar as CI (when `andromeda/` is present it also installs `p31ca` deps):

```bash
npm run setup
```

This also sets **`core.hooksPath`** to **`.githooks`** when possible so commits that touch payment or creator-economy files run **`npm run verify:monetary`** (bypass: **`P31_SKIP_MONETARY_HOOK=1 git commit …`**). To set hooks only: **`npm run git:hooks`**. **UI:** **`npm run command-center`** (localhost buttons for hooks, remotes, verify, PR) or Cursor/VS Code **Run Task: “P31: local command center”**. **Opt-in auto-push after each commit:** **`npm run git:autopush:on`** (or **`export P31_AUTO_PUSH=1`**) with **`P31_NO_AUTO_PUSH=1`** to skip; main/master stay manual unless **`P31_AUTO_PUSH_MAIN=1`**.

**Git remotes (automation):** **`npm run git:remotes`** reads **`p31-github.json`** and sets **`origin`** for the home repo when configured, and ensures nested **`andromeda/`** points at **`p31labs/andromeda`**. **PR + auto-merge:** **`pnpm pr`** in **`andromeda/`**, or **`npm run pr`** at P31 home (uses **`andromeda/`** when present); **`npm run fix:gh`** if **`gh`** and Git credentials conflict. Full flags: **`gh:pr:automerge`** in **`package.json`**.

For the **whole Andromeda pnpm workspace** (optional, large): `npm run setup:andromeda`. Release parity before merge: `npm run release:check` (includes p31ca build when the hub tree exists). Quick check after fee/URL changes: **`npm run verify:monetary`**.

## Local run

```bash
npm install
npm run build
npm run demo
```

Then open **http://127.0.0.1:8080/soup.html** (or the path your server shows).

- **Document library (search home `docs/` + root Markdown):** **http://127.0.0.1:8080/docs/doc-library/** — **`npm run build:doc-index`** (included in **`npm run verify`**). Proofs: **`npm run verify:doc-index`**. **Headless E2E:** **`npm run test:doc-library:e2e`** (first time: **`npx playwright install chromium`**); part of **`npm run p31:all`** unless **`--skip-e2e`**. Optional: **`?q=mesh`** to open with a search query.
- **Cognitive Passport (generator):** with the same server, open **http://127.0.0.1:8080/cognitive-passport/index.html** — exports a compact MD / JSON / agent block for tool context (see **`P31-ROOT-MAP.md`**; full life doc remains **`P31 COGNITIVE PASSPORT — v5.md`**). After editing the generator, run **`npm run sync:passport`** to refresh **`andromeda/04_SOFTWARE/p31ca/public/passport-generator.html`**, or from that app directory **`npm run passport:sync`**. Confirm: **`npm run verify:passport`** / **`npm run passport:verify`**. Broader check: **`npm run verify`** (passport + constants + p31ca contracts + `tsc` when monorepo present). **`npm run validate:full`** (or **`./validate-p31-full.sh`**) includes passport, constants, p31ca contracts (when present), and remote mesh checks; **`p31ca`** **`npm run deploy`** runs **`passport:verify`** before build (see `p31ca/DEPLOY.md`). In Cursor/VS Code, **Run Task** exposes **P31: sync passport → p31ca** and related tasks (`.vscode/tasks.json`). When you open generator or mirror files, **`.cursor/rules/cognitive-passport-mirror.mdc`** nudges sync/verify. **`soup.html`** links to the passport page under `npm run demo`.
- **Personal Agent Room (onboard → k4-personal):** **`soup.html`** also links to **`andromeda/04_SOFTWARE/p31ca/public/planetary-onboard.html`** and **`mesh-start.html`** (dev, same static server) and to the live hub. Controlled work package: **`andromeda/04_SOFTWARE/integration-handoff/CONTROLLED-WORK-PACKAGE-PERSONAL-AGENT-ROOM.md`** + **`integration-handoff/CWP-31/`**; product map **`docs/MESH-MAP-PERSONAL-START-PAGES.md`**. Edge check: **`npm run verify:mesh`** (k4-personal dry-run + live `/api/health` + `/api/mesh` vs **`p31-constants.json`**).
- **Initial Build (CWP, production):** Live **`https://p31ca.org/build`** ( **`initial-build.html`** ). **`andromeda/04_SOFTWARE/integration-handoff/CONTROLLED-WORK-PACKAGE-INITIAL-BUILD.md`** + **`CWP-32/`**; normative **`INITIAL-BUILD-SITE-STRICT-PLAN.md`**. Ground truth + `_redirects` are part of `npm run verify:ground-truth` (p31ca) when the tree is present.
- **`npm run dev`** — `tsc --watch` while editing `src/`.
- **`?debug`** — append to the demo URL to enable verbose engine logs (WebSocket, LOD). Example: `soup.html?debug`

## Multiplayer / mock WebSocket (WCD-32)

Terminal 1: `npm run demo` from the repo root. Terminal 2:

```bash
cd spikes/mock-ws-server
npm install ws
node server.js
```

The mock server listens on **port 8082**. Open the demo with a **`ws`** query parameter (and optional `debug`):

**http://127.0.0.1:8080/soup.html?ws=ws://localhost:8082**

**Family play (real peers, no mock NPCs):** use a shared `room` that is not the literal string `mock`, and a different `name` in each browser. If you omit `ws`, the demo uses `ws://127.0.0.1:8082` when `room` is set. Examples:

- `http://127.0.0.1:8080/soup.html?room=kitchen&name=SJ`
- `http://127.0.0.1:8080/soup.html?room=kitchen&name=WJ`

With an explicit WebSocket base, the client still appends the same `room` and `name` query parameters: `soup.html?ws=ws://localhost:8082&room=kitchen&name=SJ`. Server: **`spikes/mock-ws-server/server.js`**.

**Presence:** each client gets a **roster of other people in the same room** on **connection** and on every **heartbeat** (display names, stable mock `client_…` ids). The demo shows them as “Mesh · presence” chips over the canvas, plus a **New private room** button (new random `room` in the URL, clears `name` for a fresh label). **Copy invite link** still copies a shareable URL (same `room`, optional `ws`, omits `name`). Pings and the event log are **scoped per room** on the mock server.

**Port:** the server uses **`process.env.MOCK_WS_PORT`**, default **8082** (so a second copy or the automated probe can use another port without colliding).

**Integration test (spawns its own server):** from the repo root, **`npm run test:mock-ws`** — two `ws` clients, family `playerState` sync, full snapshot, **roster** in the second client’s `connectionInit`. Fails the process with a clear error if the protocol regresses.

**Bigger, clearer mode for S.J. & W.J. (initials in UI only):** open **`soup.html?kids=1`** (or `&mode=kids`) — the playfield is **scaled up** on screen, type is larger (DM Sans + monospace fallbacks), dev-only footnotes are **hidden**, and a short **“Play as S.J. / W.J.”** bar sets a **name** and default **`our-house` room** + **WebSocket** so they can get into family play in one click. Copy and “new private room” keep `kids=1` in the URL.

**Parents & guardians:** open **`soup.html?parents=1`** (or `&mode=parents`) — a **runbook** at the top (`npm run demo`, `node spikes/mock-ws-server/server.js`), **local-first / not public matchmaking** reminder, and actions to **open** or **copy** a **kid-friendly link** (`kids=1` + `parents=1`) for a child device or second tab. **If you use `?kids=1&parents=1` together**, the big UI stays for the child, but **dev links and the performance dashboard stay visible** so the grown-up in the room keeps full controls. Invite and new-room URLs preserve `parents=1` when present.

**As above / so below:** the mock server sends **`connectionInit.localRunbook`** (same lines it **prints at startup**), with **echo** `as-above-so-below` and the real **port**. The demo shows a **one-line echo** in the stats bar when connected, and **full lines** in the parent panel. **README ↔ wire ↔ terminal** stay aligned; `npm run test:mock-ws` asserts the payload.

## Global archive (WCD-33)

Optional cloud sync: deploy the Worker under **`wcd33-global-archive/`** and set the game origin to the Worker (see **`wcd33-global-archive/DEPLOY.md`**). In `soup.html`, set `window.BONDING_ARCHIVE_URL` to that Worker’s URL (no trailing slash).

**Local archive API** (Wrangler) — install deps once, then from the repo root:

```bash
cd wcd33-global-archive && npm install
cd ..
npm run archive:dev
```

Uncomment `window.BONDING_ARCHIVE_URL = 'http://127.0.0.1:8787'` in `soup.html` if that matches the URL printed by Wrangler. From root you can also run `npm run archive:tail`, `npm run archive:deploy`, and `npm run archive:typecheck`.

## Layout

| Path | Role |
|------|------|
| `src/` | Engine, persistence, memory panel, demo wiring |
| `dist/` | Compiler output (commit or regenerate with `npm run build`) |
| `scripts/bonding-mock-ws-probe.mjs` | Family WebSocket protocol smoke test (`npm run test:mock-ws`) |
| `cognitive-passport/` | Static Cognitive Passport generator (MD / JSON for agents) |
| `wcd33-global-archive/` | Cloudflare Worker: archive API, rate limits, CORS |
