# Node Zero Firmware — Alignment & Integration

**Document:** P31-NODE-ZERO-FIRMWARE-ALIGNMENT  
**Date:** 2026-05-06  
**Scope:** Waveshare ESP32-S3-Touch-LCD-3.5B firmware state, display pipeline, SENTINEL bridge, milestone tracking  
**Agent lane:** DeepSeek (4%) + KwaiPilot (execution)

---

## 0. HARDWARE SPEC

| Component | Part | Interface | Notes |
|-----------|------|-----------|-------|
| MCU | ESP32-S3R8 (8MB PSRAM) | — | 512KB SRAM, dual-core Xtensa LX7 |
| Display | 3.5" 480×320 | QSPI (AXS15231B controller) | Pins 9-14 |
| Touch | Integrated capacitive | I2C @ 0x3B | Integrated into display module |
| Audio codec | ES8311 | I2C + I2S | Pins 1-5, 12 (CANNOT conflict with display) |
| PSRAM | Octal, 8MB | GPIO 33–37 | **KILL ZONE — these pins are electrically occupied** |
| LoRa (future) | SX1262 | SPI3_HOST | Validated safe pins: GPIO 38–42 (camera DVP range) |
| Haptic (future) | DRV2605L + LRA | I2C | Separate from display I2C bus |
| Security (future) | NXP SE050 | I2C | Does NOT support post-quantum crypto (50KB flash insufficient) |

**Critical pin constraints:**
- GPIO 33–37: Octal PSRAM. Dead. Do not touch. They're physically broken out on the board but electrically occupied.
- GPIO 1–5, 12: ES8311 audio codec. Cannot overlap with display QSPI.
- GPIO 9–14: AXS15231B QSPI display. The working pin set.
- SX1262 link budget: ~170 dB (not 178 dB).

---

## 1. FIRMWARE STATE

**Toolchain:** ESP-IDF 5.5.3 + LVGL 8.4  
**Repo:** andromeda/05_FIRMWARE/maker-variant/  
**Display driver:** espressif/esp_lcd_axs15231b v2.1.0

### Root Cause History

| Issue | Root Cause | Fix | Status |
|-------|-----------|-----|--------|
| LVGL crash on boot | `lv_init()` not called before `lv_disp_drv_register()` | Call `lv_init()` first | ✅ Fixed |
| Display static/noise | Wrong QSPI pins (hitting audio codec pins) | Correct pins: 9-14 | ✅ Fixed |
| DMA corruption | Direct buffer path (no staging) | Chunked flush with `dma_buf1`/`dma_buf2` staging | ✅ Fixed |
| SPI race conditions | `trans_queue_depth > 1` | Set to 1 (synchronous) + semaphore wait | ✅ Fixed |
| Partial-width rendering | Column addressing untested on this panel | `full_refresh = 1` (full-width 480px strips) | ✅ Workaround |
| Kconfig warnings | Broken `LV_MEM_CUSTOM_ALLOC`/`FREE`/`REALLOC` strings | Removed from sdkconfig.defaults | ✅ Fixed |

### Current Working Parameters

```
SPI clock: 20 MHz (conservative — test higher after stable)
Trans queue depth: 1 (synchronous)
Full refresh: 1 (full-width strips)
Cache line: 64 bytes
DMA internal: 65536 bytes reserved
Fonts: All Montserrat sizes enabled
LVGL version: 8.4 (NOT 9.x — 8.4 is stable on ESP32-S3)
```

---

## 2. MILESTONES

| ID | Milestone | Verify | Status |
|----|-----------|--------|--------|
| NZ-01 | Display renders test screen | Visual + boot log | ✅ Setup screen rendered |
| NZ-02 | Touch input registers | Touch event in serial | In progress |
| NZ-03 | Audio plays test tone | Audible confirmation | Not started |
| NZ-04 | Display + touch + audio integration | Combined boot test | Blocked by NZ-02, NZ-03 |
| NZ-05 | P31 UI (K₄ tetrahedron, 863 Hz ref) | Visual confirmation | Blocked by NZ-04 |
| NZ-06 | MQTT heartbeat to SENTINEL | Message received in HA | Blocked by HA hardware |
| NZ-07 | Haptic response from SENTINEL command | LRA vibration confirmed | Blocked by DRV2605L wiring |
| NZ-08 | OTA A/B partition update | Successful OTA cycle | Not started |

---

## 3. SENTINEL BRIDGE

Node Zero connects to the SIMPLEX fleet via SENTINEL (agent #11).

**Transport:** MQTT (via Home Assistant MQTT broker)

**Topic contract:**

| Topic | Direction | Schema |
|-------|-----------|--------|
| `p31/nz/heartbeat` | NZ → SENTINEL | `{ battery_pct, uptime_s, display_on, touch_active, fw_version }` |
| `p31/nz/touch` | NZ → SENTINEL | `{ x, y, gesture: "tap"|"long"|"swipe", ts_ms }` |
| `p31/nz/sensor` | NZ → SENTINEL | `{ temp_c, humidity_pct, lux }` (if environmental sensor added) |
| `p31/nz/haptic` | SENTINEL → NZ | `{ pattern: "pulse"|"ramp"|"buzz", intensity: 0-127, duration_ms }` |
| `p31/nz/display` | SENTINEL → NZ | `{ screen: "coherence"|"spoons"|"breathing", data: {...} }` |
| `p31/nz/ota` | SENTINEL → NZ | `{ url, sha256, partition: "a"|"b" }` |

**Verify:** `verify:mqtt-topics` (future) — parse topic strings in firmware `main.cpp` and compare to SENTINEL subscription list in `sentinel.ts`.

---

## 4. LVGL 8.4 vs 9.x DECISION

**Decision: Stay on LVGL 8.4.**

| Factor | 8.4 | 9.x |
|--------|-----|-----|
| Stability on ESP32-S3 | Proven | Experimental |
| ESP-IDF 5.5.3 compat | Native | Requires patches |
| Memory footprint | ~180KB | ~220KB |
| Breaking changes | None | Renderer rewrite, API breaks |
| Community drivers | Extensive | Sparse |
| AXS15231B driver support | Official component | Untested |

Upgrade to 9.x only when: (a) official Espressif component supports it, (b) a feature in 9.x is required, (c) community has validated ESP32-S3 stability.

---

## 5. NODE ONE RELATIONSHIP

Node Zero is the maker variant. Node One (The Totem) is the production device targeting FDA Class II exempt under 21 CFR §890.3710.

| Aspect | Node Zero | Node One |
|--------|-----------|----------|
| Board | Waveshare dev board | Custom PCB (future) |
| Firmware | Shared codebase, maker config | Shared codebase, production config |
| LoRa | Future add-on via SPI3 | Integrated on PCB |
| Haptic | Future add-on via I2C | Integrated (DRV2605L + LRA) |
| Security | SE050 via I2C (future) | SE050 integrated |
| FDA | No classification | Class II exempt (21 CFR §890.3710) |
| Xiaozhi | v2 firmware base | v2 firmware base |

**No FDA classification claimed for Node Zero.** 21 CFR §890.3710 applies to Node One only.

---

## 6. WCD SEQUENCE

| WCD | Scope | Effort | Agent | Dep |
|-----|-------|--------|-------|-----|
| WCD-NZ-01 | Touch input (I2C @ 0x3B, LVGL indev) | 1 day | DeepSeek | NZ-01 done |
| WCD-NZ-02 | Audio codec (ES8311 I2S init, test tone) | 1 day | DeepSeek | NZ-01 done |
| WCD-NZ-03 | Integration test (display + touch + audio) | 0.5 day | KwaiPilot | NZ-01, NZ-02 |
| WCD-NZ-04 | P31 UI screen (K₄ viz, coherence arc) | 2 days | KwaiPilot | NZ-03 |
| WCD-NZ-05 | MQTT client + heartbeat topic | 1 day | DeepSeek | HA hardware |
| WCD-NZ-06 | Haptic driver (DRV2605L LRA, I2C) | 1 day | DeepSeek | Hardware wiring |
| WCD-NZ-07 | OTA A/B partition setup | 1 day | DeepSeek | NZ-04 |

---

*The maker variant proves the firmware. Node One inherits. The display renders. The touch will follow.*
