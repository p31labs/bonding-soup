# SENTINEL — physical layer (topology)

## Role

**SIMPLEX v7 topology:** eleven SME agents remain **delta** — no hub. **SENTINEL** is the only lane whose dominant flow is **outward**: MQTT, Home Assistant REST, GadgetBridge payloads, Meshtastic mesh status, haptics, TTS (`send_tts`), scene/actuator commands. Other agents mostly **consume** shared state and enqueue D1/KV inward; **SENTINEL** mirrors crew state (`safe_mode`, `Q-Factor`, medication windows) onto **local** HA scenes/automations.

## Privacy framing

Biometric aggregates stay **local-first** (HA ± Tasker). The Worker stores **D1** `biometric_log` rows plus `biometric_current` KV summary — no raw waveforms in KV, no third‑party forwarding from this scaffold without a separate WCD.

## LAN host (open question)

Home Assistant needs a persistent machine on the operator LAN (e.g. Raspberry Pi 4, NUC, HA Yellow). Topology at the address in the operator vault is **not** decided in-repo; pick hardware, UPS, and Ethernet vs Wi‑Fi as part of WCD-SENTINEL-INFRA.

Deploy the Worker (`simplex-worker`) so SENTINEL routes and **`/api/biometric`** reach live D1/KV: **`simplex-v7/DEPLOY.md`**.

Further wiring: **`simplex-v7/home-assistant/`** holds **`scenes.reference.yaml`**, **`automations.reference.yaml`**, **`configuration.snippet.yaml`**, and **`secrets.example.list`** aligned with D1 `automation_rules` seeds.
