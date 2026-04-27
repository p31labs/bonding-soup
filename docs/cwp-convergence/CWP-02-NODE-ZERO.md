# CWP-02 — Node Zero firmware (hardware)

**Id:** `P31-CONVERGE-02-NODE-ZERO`  
**Status:** OPEN  
**Scope:** off-monorepo firmware; `packages/node-zero` in Andromeda is the **PWA/pointer** only unless you fold builds in.

## Objective

Milestones **NZ-01** (display) → **NZ-05** (P31 chrome) on Waveshare ESP32-S3 + LVGL; reproducible `idf.py build`; flash/monitor = human.

## In scope

- Firmware tree location documented (separate clone OK).
- `sdkconfig`, display/touch/audio bring-up, boot logs captured in doc or WCD.
- Optional: registry row remains **RESEARCH/PROTOTYPE** until a named release.

## Out of scope

- Shipping p31ca build inside ESP-IDF; cloud deploy of Node Zero = OTA story (future CWP addendum).

## Phases

| # | Milestone | Done when |
|---|-----------|-----------|
| 1 | NZ-01 | LVGL test pattern on display |
| 2 | NZ-02 | Touch events on serial |
| 3 | NZ-03 | Test tone on codec |
| 4 | NZ-04 | Combined bring-up |
| 5 | NZ-05 | P31 branding on device |

## Dependencies

- None (parallel all software tracks).
- **Materials:** board, USB, Chromebook/flash host.

## Production convergence (software boundary)

- [ ] `packages/node-zero` README or hub card text matches real firmware **version/branch** (if published).
- [ ] No fake “LIVE” in hub until product decision; use **RESEARCH/PROTOTYPE** per registry rules.
- [ ] If OTA or API later: new CWP + Worker allowlist + this file updated.

**Convergence note:** “Production” = **device + signed tag**; mesh “fleet” for hardware is out-of-band to Pages.
