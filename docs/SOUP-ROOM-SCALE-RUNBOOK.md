# Soup — room scale runbook (scaffold)

**Purpose:** Repeatable **Phase 1** checks for BONDING Soup co-presence — after **`npm run verify`**, before you call “room scale” done. Part of **`docs/PLAN-BONDING-SOUP-WHEN-SCALE.md`**.

**Fast gate (automated):** from repo root:

```bash
npm run soup:room-scale
```

That runs the WebSocket **protocol probe** (`npm run test:mock-ws`). If it fails, fix wire/protocol before manual steps.

---

## A. Environment

| Step | Command / URL |
|------|----------------|
| Static server | `npm run demo` → **http://127.0.0.1:8080/** |
| Mock WS | `cd spikes/mock-ws-server && npm install ws && node server.js` (default **:8082**) |
| Optional debug | Append **`?debug`** to `soup.html` for verbose logs |

---

## B. Family room (two browsers)

1. **Browser A:** open  
   `http://127.0.0.1:8080/soup.html?ws=ws://127.0.0.1:8082&room=runbook-test&name=SJ`
2. **Browser B:** same `room`, different `name`, e.g. `name=WJ`
3. **Expect:** both show **live** / connected state; **roster** or presence UI lists the other player (mock server sends roster on `connectionInit` + heartbeat — see **`spikes/mock-ws-server/README.md`**).
4. **Expect:** `document.documentElement` **`data-soup-live`** / **`data-soup-peers`** (when wired) match reality — no “live” when WS is down.

---

## C. Reconnect stress (manual)

1. With both browsers connected, **stop** the mock server (`Ctrl+C` in its terminal).
2. **Expect:** UI moves to **disconnected** / reconnecting — not a silent success.
3. **Restart** `node server.js`.
4. **Expect:** clients **reconnect** without a full page reload (see **`src/soup.ts`** backoff); roster recovers after handshake.

Record **approximate** time-to-reconnect for your network; compare later if you change **`wsReconnectInterval`**.

---

## D. Spec vs code (hygiene)

- **`docs/wcd-32-websocket-spec.md`** §2.1 vs **`src/soup.ts`** initial reconnect delay — document any intentional drift in a PR or align both.

---

## E. Future automation (scaffold)

Placeholder directory **`tests/soup-room-scale/`** — intended for **Playwright** (two browser contexts, same `room`) when you promote this from manual to CI. Until then, this runbook is the source of truth.

---

## See also

| Doc / path | Role |
|------------|------|
| `docs/PLAN-BONDING-SOUP-WHEN-SCALE.md` | When-scale phases |
| `README.md` | Multiplayer quick start |
| `docs/wcd-32-websocket-spec.md` | Payloads & budgets |
| `scripts/bonding-mock-ws-probe.mjs` | Headless protocol check |

**Version:** 1.0.0 (2026) — extend when Playwright lands in `tests/soup-room-scale/`.
