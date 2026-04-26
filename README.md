# BONDING Soup

TypeScript molecular / affective sim (`src/`), built to `dist/`. Entry for local play: **`soup-demo.html`**.

**Workspace context:** this directory also holds **Andromeda**, **phosphorus31.org**, spikes, and docs. For how those paths relate without merging repos, read **`P31-ROOT-MAP.md`**. For agents/IDE: **`AGENTS.md`**.

**Engineering standard:** before merge or deploy, follow **`docs/P31-ENGINEERING-STANDARD.md`** (`npm run verify`, `npm run release:check` when the full tree is present). Andromeda monorepo bar: **`andromeda/docs/ENTERPRISE_QUALITY.md`**.

## First-time / clean machine setup

Use **Node 20** (see `.nvmrc`). One command aligns dependencies, regenerates operator constants into ground-truth / generated files, and runs the same **`verify`** bar as CI (when `andromeda/` is present it also installs `p31ca` deps):

```bash
npm run setup
```

This also sets **`core.hooksPath`** to **`.githooks`** when possible so commits that touch payment or creator-economy files run **`npm run verify:monetary`** (bypass: **`P31_SKIP_MONETARY_HOOK=1 git commit …`**). To set hooks only: **`npm run git:hooks`**. **Opt-in auto-push after each commit:** **`npm run git:autopush:on`** (or **`export P31_AUTO_PUSH=1`**) with **`P31_NO_AUTO_PUSH=1`** to skip; main/master stay manual unless **`P31_AUTO_PUSH_MAIN=1`**.

**Git remotes (automation):** **`npm run git:remotes`** reads **`p31-github.json`** and sets **`origin`** for the home repo when configured, and ensures nested **`andromeda/`** points at **`p31labs/andromeda`**. **PR + auto-merge:** **`pnpm pr`** in **`andromeda/`**, or **`npm run pr`** at P31 home (uses **`andromeda/`** when present); **`npm run fix:gh`** if **`gh`** and Git credentials conflict. Full flags: **`gh:pr:automerge`** in **`package.json`**.

For the **whole Andromeda pnpm workspace** (optional, large): `npm run setup:andromeda`. Release parity before merge: `npm run release:check` (includes p31ca build when the hub tree exists). Quick check after fee/URL changes: **`npm run verify:monetary`**.

## Local run

```bash
npm install
npm run build
npm run demo
```

Then open **http://127.0.0.1:8080/soup-demo.html** (or the path your server shows).

- **Cognitive Passport (generator):** with the same server, open **http://127.0.0.1:8080/cognitive-passport/index.html** — exports a compact MD / JSON / agent block for tool context (see **`P31-ROOT-MAP.md`**; full life doc remains **`P31 COGNITIVE PASSPORT — v5.md`**). After editing the generator, run **`npm run sync:passport`** to refresh **`andromeda/04_SOFTWARE/p31ca/public/passport-generator.html`**, or from that app directory **`npm run passport:sync`**. Confirm: **`npm run verify:passport`** / **`npm run passport:verify`**. Broader check: **`npm run verify`** (passport + constants + p31ca contracts + `tsc` when monorepo present). **`npm run validate:full`** (or **`./validate-p31-full.sh`**) includes passport, constants, p31ca contracts (when present), and remote mesh checks; **`p31ca`** **`npm run deploy`** runs **`passport:verify`** before build (see `p31ca/DEPLOY.md`). In Cursor/VS Code, **Run Task** exposes **P31: sync passport → p31ca** and related tasks (`.vscode/tasks.json`). When you open generator or mirror files, **`.cursor/rules/cognitive-passport-mirror.mdc`** nudges sync/verify. **`soup-demo.html`** links to the passport page under `npm run demo`.
- **Personal Agent Room (onboard → k4-personal):** **`soup-demo.html`** also links to **`andromeda/04_SOFTWARE/p31ca/public/planetary-onboard.html`** and **`mesh-start.html`** (dev, same static server) and to the live hub. Controlled work package: **`andromeda/04_SOFTWARE/integration-handoff/CONTROLLED-WORK-PACKAGE-PERSONAL-AGENT-ROOM.md`** + **`integration-handoff/CWP-31/`**; product map **`docs/MESH-MAP-PERSONAL-START-PAGES.md`**. Edge check: **`npm run verify:mesh`** (k4-personal dry-run + live `/api/health` + `/api/mesh` vs **`p31-constants.json`**).
- **Initial Build (CWP, production):** Live **`https://p31ca.org/build`** ( **`initial-build.html`** ). **`andromeda/04_SOFTWARE/integration-handoff/CONTROLLED-WORK-PACKAGE-INITIAL-BUILD.md`** + **`CWP-32/`**; normative **`INITIAL-BUILD-SITE-STRICT-PLAN.md`**. Ground truth + `_redirects` are part of `npm run verify:ground-truth` (p31ca) when the tree is present.
- **`npm run dev`** — `tsc --watch` while editing `src/`.
- **`?debug`** — append to the demo URL to enable verbose engine logs (WebSocket, LOD). Example: `soup-demo.html?debug`

## Multiplayer / mock WebSocket (WCD-32)

Terminal 1: `npm run demo` from the repo root. Terminal 2:

```bash
cd spikes/mock-ws-server
npm install ws
node server.js
```

The mock server listens on **port 8082**. Open the demo with a **`ws`** query parameter (and optional `debug`):

**http://127.0.0.1:8080/soup-demo.html?ws=ws://localhost:8082**

## Global archive (WCD-33)

Optional cloud sync: deploy the Worker under **`wcd33-global-archive/`** and set the game origin to the Worker (see **`wcd33-global-archive/DEPLOY.md`**). In `soup-demo.html`, set `window.BONDING_ARCHIVE_URL` to that Worker’s URL (no trailing slash).

**Local archive API** (Wrangler) — install deps once, then from the repo root:

```bash
cd wcd33-global-archive && npm install
cd ..
npm run archive:dev
```

Uncomment `window.BONDING_ARCHIVE_URL = 'http://127.0.0.1:8787'` in `soup-demo.html` if that matches the URL printed by Wrangler. From root you can also run `npm run archive:tail`, `npm run archive:deploy`, and `npm run archive:typecheck`.

## Layout

| Path | Role |
|------|------|
| `src/` | Engine, persistence, memory panel, demo wiring |
| `dist/` | Compiler output (commit or regenerate with `npm run build`) |
| `cognitive-passport/` | Static Cognitive Passport generator (MD / JSON for agents) |
| `wcd33-global-archive/` | Cloudflare Worker: archive API, rate limits, CORS |
