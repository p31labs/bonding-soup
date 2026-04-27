# P31 integrations bridge — smart home, wearables, operator OSS

**Normative data:** P31 home `p31-constants.json` → `integrations` (schema `p31.integrationsBridge/1.0.0`). **Apply:** `npm run apply:constants` writes `andromeda/04_SOFTWARE/p31ca/src/data/p31-integrations.json` and `public/p31-integrations.json`. **UI:** `https://p31ca.org/integrations` (Astro). **Registry:** `p31-alignment.json`, `p31-live-fleet.json` `sources`.

## Rules

1. **No secrets in git** — `endpoints.*` in constants stay empty in the shared branch; use a private overlay, SOPS+age, or 1Password CLI locally.
2. **LAN first** — Home Assistant, Mosquitto, and Node-RED should run on your network; Cloudflare Workers are **not** a MQTT broker.
3. **Minimization** — If you forward home or wearable data to `k4-personal`, use **aggregates** and explicit consent; see `docs/ETHICAL-STYLE-MAP.md` and `p31ca/docs/EDGE-SECURITY.md`.
4. **Wearables** — Most devices are closed; **Gadgetbridge** (Android) and self-hosted **Fasten** (FHIR) are open-adjacent. Vendor APIs require OAuth and are out of this static catalog.

## Wiring pattern

| Step | Action |
|------|--------|
| 1 | Install catalog tools (e.g. Home Assistant + Mosquitto) on LAN. |
| 2 | Optional: Node-RED or n8n subscribes to MQTT → HTTP POST to a **private** bridge that signs requests to your Worker. |
| 3 | k4-personal: use documented routes in `k4-personal/README.md` for agent/bio; never hand-edit `p31-integrations.json` in p31ca — it is generated. |
| 4 | EPCP operator actions remain on `command-center` Worker with Access. |

**Version:** 1.0.0 (2026)
