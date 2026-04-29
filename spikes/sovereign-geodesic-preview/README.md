# Sovereign Geodesic preview (spike)

Read-only viewer for **GeodesicRoom** `GET /api/geodesic/:room/state` — same JSON as external game engines in **`docs/GEODESIC-GAME-ENGINE-INTEGRATION.md`**.

## Run

```bash
cd spikes/sovereign-geodesic-preview
npm install
npm run dev
```

Opens **http://127.0.0.1:5174** (see `vite.config.ts`). Requests use **`/api/...`** relative to the dev server; Vite **proxies** to `https://geodesic-room.trimtab-signal.workers.dev` so the browser does not hit cross-origin CORS.

Override Worker origin:

```bash
GEODESIC_ROOM_ORIGIN=https://your-worker.workers.dev npm run dev
```

## Query params

- `?room=my-room` — seed room id (1–64 chars `[a-zA-Z0-9_-]`).

## Monorepo types

When **`andromeda/04_SOFTWARE/packages/shared`** exists, you may add:

```json
"@p31/shared": "file:../../../andromeda/04_SOFTWARE/packages/shared"
```

and replace `src/types.ts` imports with `import type { GeodesicRoomStateSnapshot } from '@p31/shared/geodesic-room-wire'` (adjust export path to match that package). This spike ships **standalone** types so the home-only clone still builds.

## Build / preview

```bash
npm run build
npm run preview
```

Use **localhost** so requests stay proxied. Opening `dist/index.html` from disk uses direct Worker URL and may fail until the Worker sends `Access-Control-Allow-Origin` for your origin.

## Related

- **`../../p31-sovereign-lab.html`** — local Three dome + serial/voice.
- **Hub:** `https://p31ca.org/geodesic?room=…`
