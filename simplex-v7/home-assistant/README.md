# Home Assistant — P31 / SENTINEL reference

Copy fragments into your HA config tree after aligning entity IDs with your LAN. Do not commit secrets.

| File | Purpose |
|------|---------|
| `configuration.snippet.yaml` | MQTT, `homeassistant:` block, `rest_command.*` toward `api.phosphorus31.org` |
| `scenes.reference.yaml` | `scene.p31_*` set — maps 1:1 to `simplex-v7/src/agents/tools/sentinel.ts` `P31_SCENE_ENTITY` |
| `automations.reference.yaml` | Webhooks (`p31_wearable_haptic` → **`automation.p31_wearable_haptic`**), morning biometric push, watchdog |
| `secrets.example.list` | Key names to create in HA Secrets |

## Worker contract

- **Biometric:** `POST /api/biometric` — JSON body; HMAC header optional if `DEVICE_SECRET` unset or omitted (see `simplex-v7/src/index.ts`). For signed pushes from a phone, prefer **Tasker**; for HA-only, use unsigned POST and protect the route (Access / allowlist).
- **Mesh:** `POST /api/device/meshtastic` — HMAC when `DEVICE_SECRET` + signature present.
- **HA REST from Worker:** `wrangler secret put HA_TOKEN` + `HA_BASE_URL` (HTTPS URL your Worker can reach: Cloudflare Tunnel, Tailscale, or public hostname).

## MQTT topics (Node Zero / bridge)

Examples for MQTT integration — subscribe in HA or forward to Worker:

- `p31/node_zero/status`
- `p31/meshtastic/nodes`
- `p31/bonding/session`

## Includes

In `configuration.yaml`:

```yaml
homeassistant:
  packages: !include_dir_named packages/
# or
automation: !include automations.yaml
scene: !include scenes.yaml
```

Split reference files into your chosen layout; IDs must stay stable if you rely on `automation.p31_*` entity names from this repo.
