# Review documentation for Gemini / Opus (and humans)

**Last updated:** 2026-04-26 — **`P31-ENGINEERING-STANDARD.md`** added as normative ship bar; MVP inventory reflects Zenodo V–XX batch.

This folder contains **handoff-quality** documentation for external model review of the P31 workspace. Read in this order:

| Order | File | Purpose |
|-------|------|---------|
| − | **`P31-ENGINEERING-STANDARD.md`** | **Ship bar** — verify/release commands, secrets, canon/constants, Andromeda `ENTERPRISE_QUALITY` pointer |
| 0 | **`CANONICAL-NUMBERING.md`** | **Normative** — what each kind of “v1 / 5.1 / WCD-33 / DOI” means (read before reconciling version drift) |
| 1 | **`GEMINI-OPUS-REVIEW-BUNDLE.md`** | **Primary** — orientation, architecture, commands, edge surface, agent rules, glossary |
| 2 | **`REVIEW-SUPPLEMENT-A-WORKFLOWS.md`** | GitHub Actions inventory (home root + Andromeda); what each file is for |
| 3 | **`REVIEW-SUPPLEMENT-B-WORKERS-AND-PACKAGES.md`** | Cloudflare `wrangler.toml` packages under `andromeda/04_SOFTWARE` + mental map |
| 4 | **`REVIEW-SUPPLEMENT-C-ECO-CWP-AND-INTEGRATIONS.md`** | ECO CWP, SUPER-CENTAUR handoff, monetary CWP, EPCP report paths |
| 5 | **`MVP-DELIVERABLES-INVENTORY.md`** | Tiered MVP list — LIVE hub/products, 10-worker fleet, adjacent sprint items, active dev, concepts; grant-ready five-bullet summary |
| 6 | **`ENTERPRISE-LAUNCH-PREP.md`** | **Launch** — verify gates, secret rotation, Andromeda merge/deploy path, Zenodo/constants alignment vs Genesis SOPs |

**Also authoritative (pre-existing, not duplicated in full here):**

- **`P31-ROOT-MAP.md`** — top-level directory guide for the multi-root workspace.
- **`AGENTS.md`** — agent rules, tag-out system, WCD discipline.
- **`andromeda/04_SOFTWARE/p31ca/ground-truth/p31.ground-truth.json`** — canonical machine-readable registry.
- **`docs/GEODESIC-CAMPAIGN.md`** — p31ca `geodesic.html`: progressive 5-track coach, tool unlocks, K4 live Durable Object room; `routes.geodesic` in ground-truth.
- **`docs/CANONICAL-NUMBERING.md`** — **normative** version namespaces (GT, CogPass edition, WCD, papers, etc.).
- **P31 COGNITIVE PASSPORT — v5.md** — long-form CogPass; **authoritative edition = H1** (e.g. **5.1**), not filename alone. See **CANONICAL-NUMBERING** §5.
- **Master Ops Manual** — 1,445 lines, 11 CWPs, 41 WCDs (canonical reference for work control).

---

## What changed in this refresh (April 25–26, 2026)

| Area | Previous state | Current state |
|------|---------------|---------------|
| Entity | HCB fiscal sponsor pending | **P31 Labs, Inc.** incorporated Apr 3, 2026 (GA domestic nonprofit); EIN 42-1888158 assigned Apr 13 |
| BONDING | Shipping March 10 | **Shipped** March 10 — 413 tests / 30 suites canonical; multiplayer relay, 3D molecule builder live |
| Research | Papers I–III + defensive pub | **Papers I–IV** + **V–XX** on Zenodo (batch **2026-04-26**); DOIs in **`p31-constants.json`** → `research.papers`; log **`andromeda/docs/files/zenodo_results.json`**. Paper IV **10.5281/zenodo.19503542** (Apr 10). |
| Node Zero | Concept / early HW | **Active firmware sprint** — Waveshare ESP32-S3-Touch-LCD-3.5B, ESP-IDF 5.5.3, LVGL 8.4, AXS15231B QSPI driver |
| Edge fleet | Workers deploying | **10-worker Cloudflare production fleet live** — unified telemetry, KV-backed status dashboard, shared spoon state |
| WCDs | Batch 2 in progress | **WCD Batch 3 (26–32) all closed**, `tsc` clean |
| Legal | March 12 hearing upcoming | April 16 contempt hearing passed; April 30 Camden County wellness baseline due; contempt defense centered on void order (O.C.G.A. § 9-11-58(b)) |
| Triad | 4 agents | **5 agents** — KwaiPilot added for Node Zero FW execution |
| HCB | Pending (ref 4XDUXX) | **Confirmed unresponsive** — pivoting to Stripe direct via `api.phosphorus31.org` Cloudflare Worker |
| Grants | Pipeline forming | Awesome Foundation $1K submitted (April deliberation); ESG now potentially unlocked with EIN |
| CogPass | Chat drift (v4.0) | **5.1** (H1); namespaces in **`CANONICAL-NUMBERING.md`** — **v4.0 non-canonical** |
| Paper XII | Gated / Zenodo-ready | **Published** — DOI **10.5281/zenodo.19782969** (2026-04-26) |
| MVP inventory | (spread across bundle) | **`MVP-DELIVERABLES-INVENTORY.md`** — five tiers + funder summary; aligned with **`p31-constants.json`**, synergetic verify, CogPass **5.1** |

---

*For the exact text to splice into `P31-ROOT-MAP.md` and `AGENTS.md` in a live clone, see **`PATCH-NOTES-REVIEW-2026-04-25.md`**. When those patches are already applied, this index is the source of truth.*
