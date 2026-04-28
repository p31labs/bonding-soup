# CWP — C.A.R.S. product sequence (MVP) — 2026-01

**Status:** planning / execution spine (home repo).  
**Does not replace:** `docs/PLAN-BONDING-SOUP-WHEN-SCALE.md` (ephemeralize one when-scale plan; this doc is *sequencing* advice layered on it).  
**North star:** Same bowl, same room — your people first; bounded co-presence; ethical surface (`docs/ETHICAL-STYLE-MAP.md`).

---

## Why this CWP exists

After platform work (deploy bar, mobile ops, design-token enforcement on the hub), **Soup** is the **product** surface the household touches first. This file captures **agreed priority order** and **defers** work that *feels* like progress but does not make the sim or the room more compelling (e.g. custom static server before measured need).

---

## Current baseline (do not re-litigate)

- **Tokens:** `soup.html` already loads `cognitive-passport/p31-style.css` and `p31-responsive-surface.css`; `soup-quantum.css` is built on `--p31-*` and canon typography. “Art direction pass” = **tighten** (glass, motion, `data-p31-appearance`, manifest/icons), not necessarily net-new CSS from zero.
- **When-scale contract:** Phases 0–1 in `PLAN-BONDING-SOUP-WHEN-SCALE.md` — room reliability, runbook, honest UI vs mock WS; WCD-32 alignment with `src/soup.ts` (reconnect backoff: reconcile spec vs implementation).
- **Local server:** `python3 -m http.server` / `npm run demo` is **acceptable** until a **Chromebook perf profile** shows static delivery as the bottleneck (see order below).

---

## Priority order (Opus + repo alignment)

| # | Work | Outcome / gate |
|---|--------|-----------------|
| **1** | **Soup design alignment (polish pass)** | Hub-adjacent look: one session on `soup.html` + `soup-quantum.css` — `data-p31-appearance="hub"`, audit inline styles, single glass/hero read, `prefers-reduced-motion` respected. Re-run `npm run apply:p31-style` if canon touched; `soup:prep:check` after. |
| **2** | **Chromebook perf profile + frame budget** | Real device (or throttled 6x CPU in DevTools); target **~16.7ms** / acceptable **~33ms**; **spec** `docs/SOUP-PERF-BUDGET.md` — on-device (or 6×) **measurement** still required to mark the gate green. |
| **3** | **Sim core from data** | Fix **measured** hot paths (allocations, draw calls, physics substeps) — not speculative micro-optimizations. |
| **4** | **Room / WS — Phase 1 close** | `soup:room-scale` + `docs/SOUP-ROOM-SCALE-RUNBOOK.md`; reconnect + roster **honest** in UI; WCD-32 vs code reconciled. |
| **5** | **PWA shell for Soup** | Reuse the pattern from mobile ops: `p31-bonding.webmanifest` (already linked), `apple-touch-icon`, safe-area; verify install path on one phone. |
| **6** | **Tailscale household — ADR + runbook** | Same **pattern** as LAN command center on tailnet: document WS host + `100.x` URL; no global discovery; one ADR in `docs/ADR-*.md`. |
| **7** | **Custom static server (replace http.server)** | **Only if** (2) shows TTFB / static transfer as a top issue; else defer. |

---

## Relationship to the rest of P31

- **k4 / mesh / onboard:** on-ramps and identity; **not** a prerequisite to **credible** Soup in one home (`docs/MESH-MAP-PERSONAL-START-PAGES.md` phases).
- **Bonding deploy:** `npm run sync:soup-bonding` when the Soup vertical ships surface changes; URL truth in `p31-constants.json` / `apply:constants`.

---

## Ephemeralization

- **Parallel hub / mesh / operator work** without blocking Soup sequencing — **`docs/P31-PARALLEL-WORK-TRACKS.md`**.
- One CWP for this **sequence**; update this file when order or gates change.
- Ship bar: any change touching `soup.html` / `src/soup.ts` / `soup-quantum.css` — **`npm run verify`** and **`soup:prep`** (or `soup:prep:check` after verify).

**Version:** 1.0.0 — 2026-04-28
