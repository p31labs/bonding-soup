# SIMPLEX v7 — Agent Fleet Alignment & Integration

**Document:** P31-SIMPLEX-AGENT-FLEET-ALIGNMENT  
**Date:** 2026-05-06  
**Scope:** 11-agent SIMPLEX crew, D1 schema, Worker route contracts, deploy sequence, verify pipeline  
**Baseline:** simplex-v7/ scaffold (82 tests, 44 sources, 32 derivations, tsc clean)

---

## 0. NAMING RESOLUTION

| Legacy Name | Current Canonical | Status |
|------------|------------------|--------|
| PHENIX Navigator | SIMPLEX | Retired — grep and remove from active docs |
| Cognitive Shield | HERALD agent (Tomograph) | Retired — `assessVoltagePure` in lib/voltage.ts is the surviving code |
| The Buffer (~85%) | HERALD agent | Buffer as standalone product is retired. HERALD IS the Buffer. The communication processing, Fawn Guard, voltage assessment — all live inside the HERALD agent now. |
| SIMPLEX v6 (GAS) | SIMPLEX v7 (CF Worker + D1) | v6 was Google Apps Script. v7 is Cloudflare Worker + D1. GAS code is not in active repo. |

---

## 1. THE CREW (11 AGENTS)

| # | Agent | Domain | Core Function | Key Tables |
|---|-------|--------|---------------|------------|
| 1 | STEWARD | Economy | Spoon allocation, LOVE minting, daily budget | spoons, love_ledger |
| 2 | HERALD | Communication | Tomograph voltage scoring, Fawn Guard, message buffering | messages, voltage_scores |
| 3 | SCRIBE | Logging | Telemetry ingestion, session logs, Exhibit A events | telemetry, sessions |
| 4 | MEDIC | Medical | Medication tracking, calcium gap detection, dose reminders | medications, med_log |
| 5 | WARDEN | Security | Rate limiting, anomaly detection, access control | access_log, anomalies |
| 6 | ORACLE | Synthesis | Cross-domain Q-Factor, session synthesis, trimtab identification | synthesis, q_factor |
| 7 | MASON | Infrastructure | Worker health, KV maintenance, deploy verification | worker_health |
| 8 | REGENT | Governance | Policy enforcement, ethical guardrails, consent management | policies, consent |
| 9 | HERALD-ECHO | Async Comms | Deferred message delivery, scheduled sends | deferred_messages |
| 10 | CARTOGRAPHER | Navigation | Hub card registry sync, product status, sitemap | products, navigation |
| 11 | SENTINEL | Physical Layer | Home Assistant bridge, GadgetBridge, Node Zero MQTT, Meshtastic | device_state, scenes |

---

## 2. D1 SCHEMA (22 TABLES)

17 core tables + 5 physical layer tables (SENTINEL).

**Deploy command (the trimtab):**
```bash
wrangler d1 create simplex
```

One command. 22 tables materialize. 11 agents start firing on cron. SENTINEL starts polling. The dashboard has endpoints to hit.

**Schema location:** `simplex-v7/src/db/schema.sql`  
**Verify:** `npm run verify:simplex`

**Physical layer tables (SENTINEL-specific):**

| Table | Purpose | Source |
|-------|---------|--------|
| device_state | Current device readings (Node Zero, wearable, HA entities) | MQTT / HTTP |
| scenes | P31 Home Assistant scene definitions | scenes.reference.yaml |
| mesh_nodes | Meshtastic mesh node inventory | Meshtastic HTTP API |
| sensor_history | Time-series sensor data (rolling 30-day window) | HA / GadgetBridge |
| device_config | Per-device configuration (poll intervals, alert thresholds) | Operator |

---

## 3. WORKER ROUTE CONTRACT

**Deploy target:** api.phosphorus31.org  
**Current state:** Existing Worker lives at this route. Route conflict must be discovered before deploy.

**Gap:** No automated discovery of current live routes. The existing Worker's routes are undocumented.

**Resolution:** `simplex-v7/scripts/discover-current-api-routes.mjs` — fetches known endpoint patterns from the live Worker, compares to simplex-v7 route table. Run before deploy. If conflicts found, either namespace the new routes under `/api/v7/` or merge and deprecate old routes.

**SIMPLEX v7 route table (15 routes):**

| Route | Method | Agent | Purpose |
|-------|--------|-------|---------|
| /api/state | GET | STEWARD | Current system state (spoons, LOVE, level) |
| /api/spoons | POST | STEWARD | Spend/refill spoons |
| /api/spoons/history | GET | STEWARD | Spoon allocation history |
| /api/love | GET | STEWARD | LOVE balance and recent ledger |
| /api/messages | POST | HERALD | Ingest message for voltage scoring |
| /api/messages/buffer | GET | HERALD | Buffered (high-voltage) messages |
| /api/biometric | POST | MEDIC | Log biometric event (calcium, sleep, mood) |
| /api/medications | GET | MEDIC | Current medication schedule |
| /api/medications/log | POST | MEDIC | Log dose taken/missed |
| /api/telemetry | POST | SCRIBE | Ingest telemetry event |
| /api/sessions | GET | SCRIBE | Session log |
| /api/synthesis | GET | ORACLE | Latest Q-Factor synthesis |
| /api/health | GET | MASON | Worker health + agent status |
| /api/home | POST | SENTINEL | Trigger Home Assistant scene/action |
| /api/devices | GET | SENTINEL | Device state inventory |

**Verification:** `verify:simplex` asserts all 15 routes exist and return expected shapes. `verify:simplex-routes` (new) compares to live API.

---

## 4. CONTEXT RESOLUTION CHAIN

Spoon state is the most-read value in the system. Multiple consumers need it. Before SIMPLEX v7, each consumer had its own KV read logic with different fallbacks.

**Canonical chain (post-refactor):**

```
D1 → resolveSentinelContext() → mergeKvSystemStateWithSentinel() → response
```

**Action required:** Grep ALL code (not just simplex-v7/) for `system_state` and `current_spoons`. Any reader not going through the context-fallback chain needs refactoring or a documented exception.

Known consumers outside simplex-v7:
- Spaceship Earth dashboard (apps/web/) — needs wiring to `/api/state`
- BONDING relay (spoon-gated features) — currently reads KV directly
- Command Center V2 (essentials strip) — already wired to `/api/health`
- k4-personal (agent context) — needs CogPass → SIMPLEX bridge

---

## 5. SENTINEL — PHYSICAL LAYER INTEGRATION

SENTINEL is the only outward-flowing agent. It bridges from the digital mesh to the physical world.

### 5.1 Home Assistant

**Hardware decision (open):** Where does HA run? Raspberry Pi 4 ($35-50), old laptop, or HA Yellow board.

**Scene contract:**

| Scene Entity | P31 Context | HA YAML |
|-------------|-------------|---------|
| scene.p31_focus | Deep Work block | Lights dim, Do Not Disturb, music cue |
| scene.p31_reset | Midday Reset | Lights up, notification clear |
| scene.p31_kids | Kids Block | Warm lighting, tablet charging, gentle music |
| scene.p31_wind_down | Evening | Low blue, review prompt, breathing cue |

**Verify gap:** `verify:ha-scenes` must parse `scenes.reference.yaml` entity IDs and compare to `P31_SCENE_ENTITY` constant in `sentinel.ts`. Any drift = fail.

### 5.2 Node Zero MQTT

**Topics (when firmware + HA are wired):**

| Topic | Direction | Payload |
|-------|-----------|---------|
| p31/node-zero/heartbeat | Device → SENTINEL | { battery, uptime, display_state } |
| p31/node-zero/touch | Device → SENTINEL | { x, y, gesture, timestamp } |
| p31/node-zero/haptic | SENTINEL → Device | { pattern, intensity, duration_ms } |
| p31/node-zero/display | SENTINEL → Device | { screen, data } |

**Verify gap:** `verify:mqtt-topics` — when firmware and HA are wired, compare topic strings in firmware `main.cpp` to SENTINEL's subscription list. Not blocking now.

### 5.3 GadgetBridge (Wearable)

**Hardware recommendation:** Bangle.js 2 (~£50). Open firmware, GadgetBridge native, programmable vibration.

**Data flow:** Bangle.js → GadgetBridge → HA → SENTINEL → MEDIC (heart rate, steps, sleep).

---

## 6. DEPLOY SEQUENCE

Ordered. Each step gates the next.

| Step | Command | Gates |
|------|---------|-------|
| 1. Create D1 | `wrangler d1 create simplex` | Everything |
| 2. Set D1 ID | Update `wrangler.toml` with D1 database ID | Deploy |
| 3. Run migrations | `wrangler d1 migrations apply simplex` | Agent function |
| 4. Deploy Worker | `wrangler deploy` | API routes |
| 5. Verify routes | `npm run verify:simplex-routes` | Dashboard |
| 6. Wire DNS | Point api.phosphorus31.org to new Worker | External access |
| 7. Deploy dashboard | WCD-SIMPLEX-05 (React /simplex) | Operator visibility |
| 8. Wire SENTINEL | HA hardware + MQTT + GadgetBridge | Physical layer |

**Step 1 is the trimtab.** Everything else follows.

---

## 7. WCD SEQUENCE

| WCD | Scope | Effort | Dep |
|-----|-------|--------|-----|
| WCD-SIMPLEX-01 | D1 create + migrations | 15 min | None |
| WCD-SIMPLEX-02 | Worker deploy + route verification | 1 hr | 01 |
| WCD-SIMPLEX-03 | DNS + live route comparison | 30 min | 02 |
| WCD-SIMPLEX-04 | simplex-email Worker scaffold + deploy | 2 hr | 02 |
| WCD-SIMPLEX-05 | React /simplex dashboard (4 components) | 1 day | 02 |
| WCD-SENTINEL-01 | HA hardware install + scene YAML | 2 hr | Hardware decision |
| WCD-SENTINEL-02 | MQTT topic wiring (Node Zero ↔ SENTINEL) | 1 day | NZ firmware + HA |
| WCD-SENTINEL-03 | GadgetBridge → HA → MEDIC pipeline | 1 day | HA + wearable |

---

*One command. 22 tables. 11 agents. The trimtab hasn't changed.*
