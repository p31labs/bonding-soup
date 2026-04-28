# Ollama — local inference fleet (P31)

This folder is the **local inference tier** for P31: a zero-cloud fallback that mirrors the SIMPLEX v7 agent roles and the Triad lanes.

## Quick start

1. Install and run Ollama (GPU optional; AMD ROCm notes below).
2. Create the P31 models:

```bash
bash ollama/scripts/setup.sh
```

3. Smoke-test the fleet:

```bash
bash ollama/scripts/verify.sh
```

## Fleet

- `p31-mechanic` → React/TS/Vite/Vitest/CF Workers
- `p31-firmware` → ESP-IDF + LVGL + Node Zero
- `p31-counsel` → Georgia O.C.G.A. research + pro se drafting (research only; verify citations)
- `p31-narrator` → grants + research synthesis
- `p31-triage` → strict JSON voltage classification
- `p31-quick` → fast utility (commit messages, one-liners)

## AMD ROCm (RX 6600 XT, gfx1032) notes

If you see GPU detection issues on RDNA2, this repo’s current CWP assumes:

- ROCm **6.4.1** (avoid known regressions)
- systemd overrides:
  - `HSA_OVERRIDE_GFX_VERSION=10.3.0`
  - `OLLAMA_FLASH_ATTENTION=false`

See the full CWP in `docs/CWP-P31-OLLAMA-2026-01.md`.

