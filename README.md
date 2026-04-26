# BONDING Soup

TypeScript molecular / affective sim (`src/`), built to `dist/`. Entry for local play: **`soup-demo.html`**.

**Workspace context:** this directory also holds **Andromeda**, **phosphorus31.org**, spikes, and docs. For how those paths relate without merging repos, read **`P31-ROOT-MAP.md`**. For agents/IDE: **`AGENTS.md`**.

## Local run

```bash
npm install
npm run build
npm run demo
```

Then open **http://127.0.0.1:8080/soup-demo.html** (or the path your server shows).

- **Cognitive Passport (generator):** with the same server, open **http://127.0.0.1:8080/cognitive-passport/index.html** — exports a compact MD / JSON / agent block for tool context (see **`P31-ROOT-MAP.md`**; full life doc remains **`P31 COGNITIVE PASSPORT — v5.md`**). After editing the generator, run **`npm run sync:passport`** to refresh **`andromeda/04_SOFTWARE/p31ca/public/passport-generator.html`**, or from that app directory **`npm run passport:sync`**. Confirm: **`npm run verify:passport`** / **`npm run passport:verify`**. Broader check: **`npm run verify`** (passport + constants + p31ca contracts + `tsc` when monorepo present). **`npm run validate:full`** (or **`./validate-p31-full.sh`**) includes passport, constants, p31ca contracts (when present), and remote mesh checks; **`p31ca`** **`npm run deploy`** runs **`passport:verify`** before build (see `p31ca/DEPLOY.md`). In Cursor/VS Code, **Run Task** exposes **P31: sync passport → p31ca** and related tasks (`.vscode/tasks.json`). When you open generator or mirror files, **`.cursor/rules/cognitive-passport-mirror.mdc`** nudges sync/verify. **`soup-demo.html`** links to the passport page under `npm run demo`.
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
