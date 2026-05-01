# CWP-P31-K4-AGENT-HUB-WS-FANOUT — WebSocket fanout: broadcast call events to docked clients

> **Status:** v1.0.0 closed — hibernatable WS API; call-event broadcast; `ws-events.js` pure module; 4 new tests.
>
> **Schema:** `p31.k4HubStream/1.0.0`
>
> **Parent CWP:** `CWP-K4-AGENT-HUB` (v1.1.0 foundation).

## 0. Plain-language summary

Each hub's `/v1/{hub}/stream` WebSocket connection previously only handled ping/pong.
This CWP promotes it to a real-time fanout channel: when a skill call completes,
the hub broadcasts a typed event to all connected WebSocket clients.

The implementation uses the **Cloudflare Workers Hibernatable WebSocket API**
(`this.ctx.acceptWebSocket(server)` / `this.ctx.getWebSockets()`) so connections
survive the DO's 30s inactivity eviction without polling.

## 1. Event schema (`p31.k4HubStream/1.0.0`)

All events have:
```json
{
  "schema": "p31.k4HubStream/1.0.0",
  "kind": "hello|pong|dock|call|fanout|echo|parse-error",
  "ts": 1714000000000,
  ...payload
}
```

| kind | payload | when |
|------|---------|------|
| `hello` | `{ hub }` | on WS connection accepted |
| `pong`  | `{ hub }` | in response to `{ kind: "ping" }` |
| `call`  | `{ hub, skillId, sessionId, dispatcher }` | after every skill dispatch |
| `echo`  | `{ hub, msg }` | unrecognized message echoed back |
| `parse-error` | `{ hub }` | non-JSON message |

## 2. Files changed

- `packages/k4-agent-hub/src/ws-events.js` (NEW) — `WS_EVENT_SCHEMA`, `buildBroadcastEvent()`, `buildDockEvent()`, `buildCallEvent()`; pure functions, no Cloudflare deps
- `packages/k4-agent-hub/src/hub-base.js` — upgraded `_handleWebSocket` to hibernatable API (`ctx.acceptWebSocket`); added `webSocketMessage`, `webSocketClose`, `webSocketError` lifecycle methods; added `_broadcast(kind, event)` helper; call `_broadcast` after each `_handleCall` dispatch
- `packages/k4-agent-hub/test/ws-fanout.test.mjs` (NEW) — 4 tests

## 3. Client usage

```javascript
const ws = new WebSocket("wss://k4-agent-hub.<sub>.workers.dev/v1/forge/stream");

ws.onmessage = (evt) => {
  const event = JSON.parse(evt.data);
  if (event.kind === "call") {
    console.log("Forge dispatched:", event.skillId, "via", event.dispatcher);
  }
};

// Heartbeat
ws.send(JSON.stringify({ kind: "ping" }));
// → { schema: "p31.k4HubStream/1.0.0", kind: "pong", hub: "forge", ts: ... }
```

## 4. Test counts

| Package | Tests | Suites |
|---------|-------|--------|
| k4-agent-hub (ws-fanout.test.mjs) | 4 | 3 |
| **New total** | **4** | **3** |

Cumulative: k4-agent-hub 50/50 · k4-agent-hub-client 13/13.

## 5. Known follow-ups

| Follow-up | Tag |
|-----------|-----|
| Dock events broadcast via main Worker (cross-hub fanout) | `CWP-P31-K4-AGENT-HUB-WS-DOCK-FANOUT` |
| K₄ family Worker integration (k4-cage vertices dock too) | `CWP-P31-K4-AGENT-HUB-FAMILY-CAGE-WIRE` |
