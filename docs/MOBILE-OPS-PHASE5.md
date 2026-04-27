# Mobile ops — Phase 5 (Connect / ship: mesh, passkey, BONDING)

**CWP:** `CWP-P31-MOBILE-OPS-2026-01`  
**Goal:** **Connect** = identity + mesh + BONDING relay — all **edge**, reachable from iPhone Safari as well as Chromebook.

## Surfaces (production)

| Track | What | Live URL (canonical) |
|--------|------|------------------------|
| Hub + connect | CAGE / passkey client | [https://p31ca.org/connect](https://p31ca.org/connect) (static + APIs) |
| Passkey API | `POST` WebAuthn | `https://p31ca.org` + `mesh.passkeyApiBasePath` (see `p31-constants.json`) + `/register-begin`, etc. |
| BONDING site | Game | [https://bonding.p31ca.org/](https://bonding.p31ca.org/) |
| Relay | Multiplayer / health | [https://bonding-relay.trimtab-signal.workers.dev/health](https://bonding-relay.trimtab-signal.workers.dev/health) |
| Personal mesh | k4-personal | From `p31-constants` `mesh.k4PersonalWorkerUrl` + `/api/health` |

**Passkey (iPhone):** Registration is **Face ID / Touch ID** in Safari — [manual] only. Expect: **GET** on register-begin → **405**; **POST** with JSON → **200** + challenge payload when edge is up.

**BONDING:** Two clients on the same **site** (bonding.p31ca.org) use the **relay** for room sync — both must have internet; LAN alone is not enough for cloud relay.

## Automated check (edge, no device)

```bash
npm run mobile-ops:phase5
```

Probes: connect page, BONDING public URL, relay `/health`, k4-personal `/api/health`, passkey `GET` (expect **405**), passkey `POST` register-begin (expect **200** + JSON). Use **`--skip-passkey-post`** if debugging CORS or payload changes.

**Version:** 1.0.0 — 2026-04-28
