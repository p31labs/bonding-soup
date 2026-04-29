# The Morning — operator experience arc

**Status:** experience specification (narrative + scope ladder)  
**Updated:** 2026-04-29  
**Audience:** Operator, product, agents — ties **Gray Rock → Alive** to **lived time**, not only UI tokens.  
**Mesh canon:** `docs/MESH-ARCHITECTURE-CANON.md` — substrate vs projection; this file is the **projection onto one human day**.

---

## How to read this document

| Tag | Meaning |
|-----|--------|
| **Shipped (tree)** | Behaviour or artefact you can point to in **this repository** (paths below). |
| **Shipped (deploy)** | Cloudflare / D1 / KV behaviour **when** the operator’s `simplex-v7` (or successor) Worker is deployed with the same routes the code exposes — **not** guaranteed from prose alone. |
| **Partial** | Credible assembly using **documented** integrations (`docs/P31-INTEGRATIONS-BRIDGE.md`, HA, MQTT, wearables) where **your** home YAML, secrets, and hardware may differ. |
| **Vision** | North-star scene — **do not** cite as deployed fact in grants, CI, or legal filings without a trace to code or logs. |

**Children in-repo naming:** This document uses **S.J.** / **W.J.** for minors (workspace convention). The operator’s original scene used a first name; the intent is unchanged.

---

## Repo anchors (verify before you quote)

- **`simplex-v7/README.md`** — OQE table count, `POST /api/biometric`, D1 `biometric_log`, accommodation story.  
- **`simplex-v7/src/index.ts`** — `/api/biometric`, KV `biometric_current`, merge into `/api/state` style responses where implemented, `daily_briefing` read path.  
- **`simplex-v7/src/agents/registry.ts`** — **STEWARD** (briefing, deadlines), **SENTINEL** (outward bridge: HA / MQTT / haptics posture in prompt text), **MEDIC**, **FORGE**, **HERALD**, **SCRIBE**, crew list.  
- **`simplex-v7/src/agents/runner.ts`** — cron-style **hour === 6** → `runAgent('STEWARD', …)` (exact schedule is code, not this prose).  
- **`simplex-v7/src/lib/accommodation-sync.ts`** + **`docs/P31-ACCOMMODATION-LOG-SYSTEM.md`** — machine rows from `biometric_log`, `medications`, `agent_runs`, etc.  
- **`docs/MESH-ARCHITECTURE-CANON.md`** — personal DO vs cage; no live family-edge glow from a BONDING ping unless that path is wired and observed.

If a beat below is not listed here, treat it as **Partial** or **Vision** per the tag on the subsection.

---

## 5:47 — Before the system *(Vision + Partial)*

The house is dark. The operator is asleep. A wearable has been tracking sleep; data stays on-device until a push policy says otherwise (**Partial** — GadgetBridge / Bangle-class posture appears in SENTINEL registry text; **not** every operator build pushes overnight).

**Node Zero** on the nightstand: screen off, haptic still, MCU in low draw (**Vision** — firmware and power numbers live in hardware repo / WCDs, not asserted here).

**Home Assistant** + **Mosquitto**: broker quiet; automations with names like `p31_biometric_morning_push` are **Vision** unless your `configuration.yaml` matches (**Partial** when you paste them).

**Cloudflare edge:** Workers are always on; **simplex-v7** implements routes and agents in-tree (**Shipped (tree)**). KV may still hold yesterday’s spoon default until today’s ingest (**Shipped (deploy)** when Worker + KV exist).

**Mesh:** K₄ exists as **potential** — cage + personal Workers **when** deployed; see mesh canon. No live “all vertices dark” telemetry is claimed from this file.

---

## 6:00 — STEWARD fires *(Shipped (tree) cadence; Vision detail)*

A cron-shaped path runs **STEWARD** around the morning hour in **`runner.ts`** — verify the exact trigger in **`simplex-v7/wrangler.toml`** / scheduler config, not this narrative.

STEWARD’s job in **registry** is briefing, deadlines, WCD scope. A KV key **`daily_briefing`** is read in **`index.ts`** — the JSON shape in a grant should be copied from **live KV or tests**, not from fiction.

**Cost / duration / Jacksonville edge node** — **Vision** (ops colour).

---

## 6:05 — Biometric morning push *(Shipped (tree) route; Partial transport)*

**`POST /api/biometric`** accepts a payload, writes **`biometric_log`**, calls **`update_spoons_from_biometric`**, updates KV **`biometric_current`**, queues messages — **`simplex-v7/src/index.ts`**.

**GadgetBridge → HA → `rest_command` → `api.phosphorus31.org`** — **Partial** until your LAN, DNS, TLS, and secrets mirror the operator stack.

Spoon math (sleep bands, HRV −1, “8 spoons”) — **Shipped (tree)** only where implemented in **`simplex-v7`** spoon/biometric helpers and tests; **Vision** when this doc gives example integers.

**`agent_message` to MEDIC / STEWARD** — align with actual queue schema in code before treating as contract.

---

## 6:10 — House speaks (barely) *(Partial + Vision)*

TTS at whisper volume reading only the **trimtab** line — **Vision** (requires HA + Google cast + `input_text` plumbing).

**`morning` scene** lights — **Partial** (your scenes, your lux values).

Reading **`/api/state`** merged briefing — **Shipped (deploy)** when API matches `simplex-v7` merge behaviour; **Vision** when HA template invents field names not in JSON.

---

## 6:20 — The alarm that isn’t the system *(Vision boundary)*

Phone alarm is **outside** P31 by design in this story — good boundary to keep in real product copy.

**Node Zero** wakes on motion; three lines (**spoons / med due / Q**) — **Vision** UI; MEDIC escalation timer — **Vision** unless coded in firmware + Worker pairing.

---

## 6:25 — Medication ritual *(Shipped (tree) medical route if deployed; Partial HA flash)*

**`POST /api/medical`** (or equivalent documented route) and **`medications`** table — see **`simplex-v7`** and schema tests.

**Calcium / Vyvanse window** — **Shipped (tree)** where `vyvanseBlockedByCalciumGap` (or current name) exists in code; grep before citing in court-facing text.

**Kitchen flash green** — **Partial** (HA).

**DRV2605L `confirmation` pattern over MQTT** — **Partial** (Node Zero + bridge).

---

## 6:30–8:30 — Handwritten brain dump *(Vision boundary — sacred)*

No agents, no captures, no haptics — **recommended product ethic**. Not enforced by CI; enforced by operator policy and UI discipline.

---

## 7:15 — Calcium clock *(Partial scene)*

Green kitchen wash for absorption window — **Partial** (HA scene). API block remains authoritative (**Shipped (tree)** where implemented).

---

## 7:30 — MEDIC cron *(Shipped (tree) agent exists; Vision timing)*

MEDIC checks and **suppresses** Vyvanse nag when window logic says so — **Shipped (tree)** only if that branch exists; confirm in **`simplex-v7`** MEDIC tools/tests before legal claims.

---

## 8:00 — FORGE *(Shipped (tree) agent; Vision metrics)*

FORGE health checks, PR notes to STEWARD — **registry** + runner behaviour; exact cron `0 */4` is **Vision** until `wrangler.toml` / cron matches.

---

## 8:30 — QBD / Triad *(Vision workflow)*

Opus / Composer / Gemini split and percentages — **operator workflow**, not repo law. Accommodation language belongs in **`accommodation_log`** schema and SCRIBE policy when automated.

---

## 8:45 — Dome check *(Shipped (p31ca dome); Vision HUD copy)*

**`p31ca` dome** is a real surface; **Gray Rock first paint** and exact HUD strings evolve with **`dome-cockpit.ts`**. Q vs spoons merge from live **`/api/state`** when wired — **Shipped (deploy)** per integration, not this doc.

---

## 9:00 — Deep work *(Partial HA + Vision HERALD coupling)*

`deep-work` scene, DND, HERALD threshold tied to scene — **Vision** until `SENTINEL` reads HA state in production.

**HRV → `decompression` scene** — **Vision** (requires wearable stream + policy).

---

## 10:25 — Calcium window opens *(Partial haptics + scene)*

**Vision** timing tied to your logged Calcium/Mg time.

---

## 11:47 — A ping from the mesh *(Vision edge; Shipped BONDING direction)*

S.J. taps 💚 in **BONDING**; Dad feels **`ping`** haptic; cage edge **`will→sj`** warms — **Vision** end-to-end. **k4-cage** + **BONDING** are real products; **live** edge telemetry and haptic bridge are **Shipped (deploy)** + **Partial** assembly.

SCRIBE / Genesis / court-admissible framing — **docs/P31-ACCOMMODATION-LOG-SYSTEM.md**; do not over-claim hash chain properties without reading implementation.

---

## 12:00 — Midday reset *(Vision)*

Spoon spend rates, “system doesn’t log lunch” — **product ethic**; not enforced in-repo unless you add explicit scope gates.

---

## The arc in one paragraph

From pre-dawn to noon, the stack is supposed to **compute in silence**, **surface in atoms** (light, haptic, six-word TTS, three OLED lines), and **stay dark** while the operator does human work — handwriting, parenting edges, deep work. **S.J.’s** 💚 is the mesh as **felt** warmth, not another inbox. The cage holds structure; the morning holds the human.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-04-29 | Initial arc: narrative + shipped/partial/vision ladder; S.J. initials; repo pointers only. |
