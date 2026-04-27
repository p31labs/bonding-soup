# Supplement C — ECO, CWP, and integration handoff pointers (for Gemini / Opus)

**Purpose:** Route reviewers to **controlled work packages** and **integration** docs. Does **not** duplicate full CWP text.

**Last updated:** 2026-04-26 (C.1b PAR / Soup; C.1c Initial Build CWP)

---

## C.1 p31ca ecosystem CWP (Ring A / catalog)

| Document | Path | Role |
|----------|------|------|
| ECO CWP | `andromeda/04_SOFTWARE/p31ca/docs/CONTROLLED-WORK-PACKAGE-ECOSYSTEM-INTEGRATION.md` | `CWP-P31-ECO-2026-01` — hub, registry, ground truth, Cockpit; **excludes** merging `phosphorus31.org` without a separate CWP. |
| Operator UI CWP | `andromeda/04_SOFTWARE/p31ca/docs/CONTROLLED-WORK-PACKAGE-INTERACTIVE-OPERATOR-UI.md` | `CWP-P31-UI-2026-01` — `/ops/` shell, glass box, tag in/out, cognitive load; **sister** to ECO (Ring A); **excludes** Worker security in static HTML. Home pointer: `docs/CWP-POINTER-INTERACTIVE-OPERATOR-UI.md`. |
| Parallel agents | `andromeda/04_SOFTWARE/p31ca/docs/PARALLEL_AGENT_COORDINATION.md` | Coordination for `index.astro`, ground truth, parallel tracks. |
| ECO snapshot | `andromeda/04_SOFTWARE/p31ca/docs/ECO-P0-1-SNAPSHOT.md` | Drift / console expectations (e.g. mvpData vs Cockpit). |

---

## C.1b Personal Agent Room (PAR) — BONDING Soup + k4-personal

**Sister** to ECO (catalog) and SUPER-CENTAUR (Ring D); **does not** merge those tracks. Owns stable `subject_id` → `k4-personal` Durable Object + p31ca static onboard/mesh-start.

| Document | Path |
|----------|------|
| PAR CWP | `andromeda/04_SOFTWARE/integration-handoff/CONTROLLED-WORK-PACKAGE-PERSONAL-AGENT-ROOM.md` |
| Handoff bundle | `andromeda/04_SOFTWARE/integration-handoff/CWP-31/README.md` |
| Mesh / start pages | `docs/MESH-MAP-PERSONAL-START-PAGES.md` |
| Dev entry (home) | `soup.html` → links to `andromeda/04_SOFTWARE/p31ca/public/planetary-onboard.html` and `mesh-start.html` under **`npm run demo`** |

**Verify from P31 home:** `npm run verify:mesh` (k4-personal wrangler dry-run + live API vs `p31-constants.json`).

---

## C.1c Initial Build (IB) — CWP (production)

**Issued** `CWP-P31-IB-2026-01` — first-run: intake → cryptographic `subject_id` → `PUT` profile + `PUT` personal tetra (`p31.personalTetra/1.0.0`) → handoff to `mesh-start` / PAR. **Sister** to ECO, PAR, and SC; **excludes** cage bridge and Super-Centaur server work.

| Document | Path |
|----------|------|
| IB CWP | `andromeda/04_SOFTWARE/integration-handoff/CONTROLLED-WORK-PACKAGE-INITIAL-BUILD.md` |
| Strict plan (appendix) | `andromeda/04_SOFTWARE/integration-handoff/INITIAL-BUILD-SITE-STRICT-PLAN.md` |
| Handoff | `andromeda/04_SOFTWARE/integration-handoff/CWP-32/README.md` |
| Public shell | `andromeda/04_SOFTWARE/p31ca/public/initial-build.html` — **https://p31ca.org/build** (301) |

**Verify:** `npm run verify:ground-truth` (p31ca) includes `initialBuild` route and `/build` redirect; see `CWP-32/deliverables-matrix.json` for D-IB*.

---

## C.2 SUPER-CENTAUR / mesh-bridge

| Document | Path |
|----------|------|
| SUPER-CENTAUR CWP (handoff) | `andromeda/04_SOFTWARE/integration-handoff/CONTROLLED-WORK-PACKAGE-SUPER-CENTAUR.md` |
| mesh bridge (copy) | `andromeda/04_SOFTWARE/integration-handoff/CWP-30/mesh-bridge.ts` |

**Ring D** (phosphorus / SUPER-CENTAUR) is **sister** to p31ca ECO — inventory alignment per ECO R9, not automatic code merge.

---

## C.3 Monetary CWP + donate

| Area | Path / surface |
|------|----------------|
| Monetary CWP | `andromeda/04_SOFTWARE/docs/CONTROLLED-WORK-PACKAGE-MONETARY-PIPELINE.md` |
| donate-api | `andromeda/04_SOFTWARE/donate-api/` |
| verify-monetary-surface | `andromeda/scripts/verify-monetary-surface.mjs` (as referenced from monorepo verify) |
| Stripe Checkout | **`donate-api.phosphorus31.org`** (`donate-api` Worker) — **HCB pivot** April 2026 |
| Ko-fi | `ko-fi.com/trimtab69420` |

---

## C.4 EPCP report paths

| Artifact | Location |
|----------|----------|
| EPCP reports | `andromeda/04_SOFTWARE/cloudflare-worker/command-center/EPCP_COMPLETE.md`, `EPCP_FINAL_REPORT.md`, etc. |
| Runtime D1 / R2 | Per deployed Worker names in `wrangler.toml` and Cloudflare account |

---

## C.5 Master Ops Manual (reference)

Canonical work control: **1,445 lines, 11 CWPs, 41 WCDs** per operator record. **WCD Batch 3 (WCDs 26–32)** — closed, `tsc` clean, as of April 2026 snapshot.

---

## C.6 Research publication inventory (DOIs)

| Item | Title / description | DOI / ID | Status (Apr 2026) |
|------|--------------------|---------|--------------------|
| Papers I–III | P31 research series | Zenodo DOIs under ORCID 0009-0002-2492-9079 | Complete |
| Paper IV | “Universal Bridge at the Phase Transition” | **10.5281/zenodo.19503542** | Published Apr 10, 2026 |
| Paper XII | Sovereign Stack | **10.5281/zenodo.19782969** | Published 2026-04-26; optional Zenodo metadata `cites` refresh vs XI/XIX |
| Defensive | “The Tetrahedron Protocol” | **10.5281/zenodo.18627420** | Zenodo + Internet Archive |

**ORCID:** 0009-0002-2492-9079

---

## C.7 Node Zero firmware (DeepSeek / KwaiPilot handoff)

- **Board:** Waveshare **ESP32-S3-Touch-LCD-3.5B**
- **Stack:** ESP-IDF **5.5.3**, LVGL **8.4**, **AXS15231B** QSPI display driver
- **LoRa SPI:** Validated safe mapping (camera DVP pins) — e.g. **GPIO 38–42**, **SPI3_HOST** (confirm against current WCD)
- **Hard constraint:** **Octal PSRAM “kill zone” (GPIO 33–37) — do not use** for user peripherals

Tag **DeepSeek** (firmware) and **KwaiPilot** (Node Zero execution) for WCDs touching this stack.

---

## C.8 Andromeda entry docs

| File | Path |
|------|------|
| `CONTRIBUTING.md` | `andromeda/CONTRIBUTING.md` |
| `REPOSITORY_LAYOUT.md` | `andromeda/docs/REPOSITORY_LAYOUT.md` |
| `04_SOFTWARE/README.md` | `andromeda/04_SOFTWARE/README.md` |

---

*End of supplement C. Return to `README-REVIEW-DOCS.md` for reading order.*
