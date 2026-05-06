# P31 ALIGNMENT INDEX — Master Document

**Document:** P31-ALIGNMENT-INDEX  
**Date:** 2026-05-06  
**Scope:** Index of all alignment documents + unified WCD dependency graph + critical path  
**For:** Any Composer session, any agent. Read this first.

---

## 1. DOCUMENT REGISTRY

| # | Document | File | Scope |
|---|----------|------|-------|
| 1 | **CARS Connect Mesh Alignment** | P31-CARS-CONNECT-MESH-ALIGNMENT.md | SoupEngine, wire protocol, relay, ghost molecules, connect surface |
| 2 | **SIMPLEX Agent Fleet Alignment** | P31-SIMPLEX-AGENT-FLEET-ALIGNMENT.md | 11 agents, D1 schema, Worker routes, deploy sequence, SENTINEL |
| 3 | **Design Doctrine & Token Alignment** | P31-DESIGN-DOCTRINE-TOKEN-ALIGNMENT.md | Gray Rock → Alive, CSS generation, token sweep, soup-quantum.css |
| 4 | **Spaceship Earth Merge Alignment** | P31-SPACESHIP-EARTH-MERGE-ALIGNMENT.md | Three.js shell + /simplex dashboard, room routing, coherence feed |
| 5 | **Product Naming Canon** | P31-PRODUCT-NAMING-CANON.md | All product names, retired names, domain map, naming rules |
| 6 | **Node Zero Firmware Alignment** | P31-NODE-ZERO-FIRMWARE-ALIGNMENT.md | ESP-IDF, LVGL, pin map, SENTINEL bridge, milestones |
| 7 | **Verify Pipeline Alignment** | P31-VERIFY-PIPELINE-ALIGNMENT.md | 22 verify steps, gaps, proposed additions, DAG structure |
| 8 | **Worker Fleet Alignment** | P31-WORKER-FLEET-ALIGNMENT.md | 10+ CF Workers, routes, KV namespaces, deploy order, probes |
| 9 | **CogPass Schema Alignment** | P31-COGPASS-SCHEMA-ALIGNMENT.md | Schema, 8 profiles, generator, cross-system bindings |
| 10 | **Corporate Compliance Alignment** | P31-CORPORATE-COMPLIANCE-ALIGNMENT.md | GA nonprofit formation, compliance calendar, governance, WCDs |

---

## 2. UNIFIED WCD COUNT

| Document | WCDs | Total Effort | Completed |
|----------|------|-------------|-----------|
| CARS | 12 WCDs | ~10.5 days | CARS-ALIGN-01 ✅ |
| SIMPLEX | 8 WCDs | ~7 days | — |
| Design Doctrine | 5 WCDs | ~3 days | DESIGN-01 ✅, DESIGN-02 ✅ |
| Spaceship Earth | 7 WCDs | ~9 days | — |
| Node Zero | 7 WCDs | ~7.5 days | — |
| Verify Pipeline | (embedded in other WCDs) | — | +3 gates ✅ |
| Worker Fleet | 6 WCDs | ~5.5 days | FLEET-01 ✅ |
| CogPass | 6 WCDs | ~5.5 days | COGPASS-01 ✅, COGPASS-02 ✅, COGPASS-06 (partial) ✅ |
| **Naming Canon** | 1 WCD | 0.5 day | NAMING-01 ✅ (active src clean) |
| **Corporate** | 13 WCDs | ~4 days | CORP-04 ✅, CORP-05 ✅, CORP-06 ✅, CORP-07 ✅, CORP-08 ✅, CORP-09 ✅, CORP-10 ✅ |
| **TOTAL** | **65 WCDs** | **~52.5 days** | **~16 WCDs complete** |

**Completed this session (2026-05-06):**
- DESIGN-01: --p31-butter → --p31-amber in soup-quantum.css (both copies)
- DESIGN-02: `verify:design-tokens` gate wired (95 gates)
- NAMING-01: `verify:product-names` gate + EDE/The Buffer renamed in active p31ca src
- CARS-ALIGN-01: BONDING vs C.A.R.S. canonical distinction in CARS-NAMING.md
- FLEET-01: P31-KV-NAMESPACE-MAP.md key schema doc written
- FLEET-02: Mesh headers (X-P31-QFactor, X-P31-Routing-Protocol) on command-center, bonding-relay, simplex-worker
- COGPASS-01: `COGPASS_CONSUMER_REGISTRY` in @p31/shared
- COGPASS-02: `verify:cognitive-passport-schema` extended with consumer registry checks
- COGPASS-06 (partial): Profile ID discrepancy documented in alignment doc
- +NEW: `verify:simplex-routes` gate (21 routes, 30 skills verified)
- +NEW: `SCHEMA_VERSIONS` registry in @p31/shared
- CORP-04: Executive Compensation Policy (docs/board/EXECUTIVE-COMPENSATION-POLICY.md)
- CORP-05: Document Retention Policy (docs/board/DOCUMENT-RETENTION-POLICY.md) ← existed
- CORP-06: Whistleblower Policy (docs/board/WHISTLEBLOWER-POLICY.md) ← existed
- CORP-07: Gift Acceptance Policy (docs/board/GIFT-ACCEPTANCE-POLICY.md)
- CORP-08: Amended Bylaws — multi-member board, Founder Protection, O.C.G.A. §14-3-840 (docs/board/BYLAWS-AMENDED-2026.md)
- CORP-09: Board Meeting Minutes Template (docs/board/BOARD-MEETING-MINUTES-TEMPLATE.md)
- CORP-10: Compliance Calendar ICS — Jul 2 hard wall + 1023-EZ + FERS + recurring (docs/board/P31-COMPLIANCE-CALENDAR.ics)

Not 52.5 sequential days. Many tracks run in parallel. See §3 for the actual critical path.

---

## 3. CRITICAL PATH

```
                    ┌─── CARS-OPT-01..04 (parallel, 2 days) ───────┐
                    │                                                │
                    ├─── DESIGN-01..05 (parallel, 3 days) ──────────┤
                    │                                                │
START ──────────────┼─── NAMING-01 (0.5 day) ───────────────────────┤
                    │                                                │
                    ├─── FLEET-01..03 (parallel, 2 days) ───────────┤
                    │                                                │
                    ├─── COGPASS-01..02 (parallel, 1 day) ──────────┤
                    │                                                │
                    ├─── CORP-01..02 (CRITICAL: Jul 2, 57 days) ────┤
                    │                                                │
                    └─── NZ-01..03 (serial, 2.5 days) ─────────────┘
                                                                     │
                                                                     ▼
                    SIMPLEX-01 ─── "wrangler d1 create simplex" ────── THE TRIMTAB
                         │
                         ▼
              ┌──── SIMPLEX-02 (Worker deploy, 1 hr) ────┐
              │                                            │
              ├──── FLEET-04 (Passkey deploy, 2 days) ────┤
              │          │                                 │
              │          ▼                                 │
              │    CARS-CONNECT-01..03 (3.5 days) ────────┤
              │          │                                 │
              │          ▼                                 │
              │    COGPASS-04..05 (2 days) ────────────────┤
              │                                            │
              └──── SIMPLEX-05 + SE-03 (dashboard, 4 days)┘
                                                           │
                                                           ▼
                    SE-02, SE-04..07 (rooms, 6 days) ──────│
                                                           │
                    NZ-04..07 (P31 UI + MQTT, 5 days) ─────│
                                                           │
                    SENTINEL-01..03 (HA + MQTT + wear) ────│
                                                           │
                    CORP-03..13 (governance, 1023-EZ) ─────│
                                                           │
                                                           ▼
                                                        SHIP ALL
```

**The trimtab is unchanged: `wrangler d1 create simplex`.**

**The corporate hard wall: Initial Annual Registration by Jul 2, 2026 (57 days).**

Everything above the trimtab line can start NOW and runs in parallel. Everything below it is gated by the D1 database existing.

**Realistic timeline with one operator + AI mesh:**

| Phase | Duration | Parallel Tracks |
|-------|----------|----------------|
| Phase 0: Parallel prep | 3 days | CARS-OPT, DESIGN, NAMING, FLEET discovery, COGPASS registry, NZ touch/audio, CORP-01..02 |
| Phase 1: Trimtab | 15 min | `wrangler d1 create simplex` |
| Phase 2: Deploy wave | 3 days | SIMPLEX Worker, Passkey, CARS-CONNECT |
| Phase 3: Dashboard + Rooms | 5 days | SE-03 (dashboard), SE-02 (coherence), COGPASS generator |
| Phase 4: Physical layer | 5 days | SENTINEL HA, NZ MQTT, wearable |
| Phase 5: Polish + verify | 2 days | All new verify steps, glass probes, tag |
| **Total critical path** | **~18 working days** | — |

---

## 4. OPERATOR DECISIONS REQUIRED

These cannot be made by any agent. Operator decides.

| # | Decision | Blocks | Options |
|---|----------|--------|---------|
| 1 | HA hardware at location | SENTINEL-01, NZ-05 | Pi 4, NUC, HA Yellow |
| 2 | api.phosphorus31.org route strategy | SIMPLEX-02, FLEET-03 | Replace, namespace, or merge |
| 3 | Passkey storage backend | FLEET-04 | KV (simple) vs D1 (relational) |
| 4 | Ko-fi product catalog finalization | FLEET-05 (kofi probe) | Draft → final names |
| 5 | Paper XII release gate | Manual | Operator-only decision |
| 6 | Board expansion candidates (Tyler, Hunter) | CORP-03, 1023-EZ | Outreach required |
| 7 | Accounting system | CORP-11 | Wave (free) vs GnuCash |

---

## 5. AGENT LANE ASSIGNMENTS

| Agent | Documents Owned | WCDs |
|-------|----------------|------|
| **Sonnet/CC (Mechanic 80%)** | CARS-OPT, DESIGN, SE, SIMPLEX-05, FLEET-02, CORP docs/templates | ~40 WCDs |
| **Gemini (Narrator 15%)** | NAMING (grep), COGPASS-03 (generator UX narrative) | ~3 WCDs |
| **DeepSeek (Firmware 4%)** | NZ-01..03, NZ-05..07 | ~6 WCDs |
| **KwaiPilot (FW execution)** | NZ-03, NZ-04 | ~2 WCDs |
| **Opus (Architect 1%)** | This index, verify pipeline design, QA audits | ~2 WCDs |
| **Operator** | SIMPLEX-01 (trimtab), decisions, deploy commands, CORP-01..02 (sign) | ~12 WCDs |

---

## 6. HOW TO USE THESE DOCUMENTS

**New Composer session?** Read this index. Then read the specific document for your task lane.

**Need to understand the full ecosystem?** Read in this order:
1. This index (2 min)
2. Product Naming Canon (2 min) — know what everything is called
3. Verify Pipeline (3 min) — know how to prove it works
4. The specific alignment doc for your track

**Executive dysfunction hit?** Pick the first WCD in your lane that has no blocking dependency. Execute it. Don't decide — just build.

**Don't know which agent lane you're in?** You're in Sonnet/CC (Mechanic). 80% of all WCDs are yours. Pick any CARS-OPT, DESIGN, SE, or FLEET WCD and start.

**Corporate compliance** — Jul 2 hard wall. WCD-CORP-01 (Board Resolution) and WCD-CORP-02 (Initial Annual Registration) are operator-executable in under 3 hours total.

---

*65 WCDs. 10 documents. 18 days critical path. One trimtab. Jul 2 hard wall. The mesh holds.*
