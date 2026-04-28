# Create, connect — ephemeralization and ethical monetization

**Purpose:** Tie P31’s **mission verbs** (build, **create**, **connect**) to **operational** practice: one canonical source per concern (**ephemeralization**), and money that stays **transparent, creator-fair, and non-extractive** (**ethical monetization**).

**Machine surfaces (same intent, user-visible):** **`andromeda/04_SOFTWARE/p31ca/src/data/p31-mission-trio.json`** (hub copy + mission footer / EBC via **`sync-connect-mission-ebc`**) and **`/creator-economy.json`** (`transparency.missionLink`). Web app manifests: **`p31-mesh.webmanifest`**, home **`p31-bonding.webmanifest`**.

**Status:** Normative *intent*; machine proof stays in **`p31-alignment.json`**, **`npm run verify`**, and the **creator economy** verifier — not in this prose alone.

### Keystone (read this first)

| Mission verb | Key operational idea | What “good” looks like |
|--------------|----------------------|------------------------|
| **Create** | **Ephemeralization** (Fuller) | One **source** per concern; **derivations** and **`apply:*` / `verify:*`** — no hand-maintained duplicate lore. |
| **Connect** | **Same story everywhere** | Mesh, hubs, and static pages all read the **same** constants, **ground-truth**, and public JSON — including **how money works**. |
| **(Economic side of connect)** | **Ethical monetization** | **creator-economy.json** invariants (CI); **ETHICAL-STYLE-MAP** for pay/support UX — **autonomy, dignity, proportion** — not extraction or dark patterns. |
| **Organize** | **Maps + registry + index** | **`P31-ROOT-MAP.md`** (which tree to edit), **`p31-alignment.json`** (sources, derivations, **`verifyPipeline`**), **`docs/doc-library`**, **`fleet-portal`**, **`AGENTS.md`** sections — not ad-hoc folders. |

**In one line:** *Create* without duplication; *connect* with integrity; *monetize* only with **public, verified** economics and **ethical** surface behavior; *organize* so everyone knows **where** and **what** is canonical.

```text
  CREATE   ──►  ephemeralization      ──►  sources + derivations + verify
  CONNECT  ──►  trust + mesh         ──►  one contract across surfaces
  MONEY    ──►  ethical monetization ──►  creator-economy.json + style map
  ORGANIZE ──►  map + registry       ──►  ROOT-MAP, alignment, doc index, fleet-portal
```

---

## 1. Create

- **Create** is *shipping* artifacts people can use: code, static surfaces, Workers, docs — with **proof** (`verify`, tests, review), not vibes-only.
- **Ephemeralization** means you **do not** hand-maintain a second copy of the same truth. You add or extend a **source**, register or reuse a **derivation**, run **`apply:*`** where it exists, and let **`verify:*`** catch drift. See **`docs/P31-ALIGNMENT-SYSTEM.md`** and **`p31-alignment.json`** (`ephemeralization` field).
- **Create** without alignment debt: new one-way dependencies get a **`derivations`** row and, if on the ship bar, a matching **`verifyPipeline`** step.

---

## 2. Connect

- **Connect** is *mesh-shaped*: family and operator contexts (K₄, hubs, personal scope) — **network** and **UX** vectors in **`docs/SIC-POVM-K4-ARCHITECTURE.md`**, not a single vendor lock-in.
- **Connect** is also *economically honest*: when users move money (donate, support, future creator flows), they see the **same** fee and share story the repo **proves** in **`verify:economy`** — that is **ethical monetization** as part of the trust fabric, not a separate silo.
- Surfaces **connect** to the same contracts: constants, ground-truth, public JSON — so a phone browser, a hub card, and an edge Worker do not tell **three different stories** about URLs, fees, or mission.
- Transport (Tailscale, SSH, plain HTTPS) is **policy**; the repo stays agnostic except where **`p31-constants.json`** names real endpoints. See **`docs/AGENTIC-VIBE-INFRASTRUCTURE.md`** for thin-client / remote patterns.

---

## 3. Ephemeralization (Fuller) — operational definition

| Idea | Here |
|------|------|
| **More outcome, less duplication** | One mission snippet in **`p31-constants.json`**, mirrored by **`apply:constants`** — not three markdown “about” pages edited by hand. |
| **Healing is scripted** | Prefer **`npm run apply:*`** + **`npm run verify:*`** over “remember to update X.” |
| **No parallel lore** | If two files disagree, **`verify`** or **`verify:alignment`** should fail, or you have not finished the derivation row. |

Alignment **creates the map**; CI and humans **connect** edits to proof.

---

## 4. Ethical monetization

**Principles**

- **Transparency:** Public, CI-checked contract — hub **`creator-economy.json`** / ground-truth mirror; no hidden fee stacks in copy.
- **Creator-fair:** Contract versions enforce shares and notice policy; changing economics requires an intentional commit and **`npm run verify:economy`** (in p31ca) / **`npm run verify:monetary`** (home gate for payment + ecosystem + economy).
- **Non-extractive UX:** Treat payments like any other sensitive control: **autonomy, dignity, proportion** — **`docs/ETHICAL-STYLE-MAP.md`** (no dark patterns, no shame/FOMO levers for tipping or access).

**Concrete hooks**

| Concern | Where |
|---------|--------|
| Fee / share invariants | **`andromeda/04_SOFTWARE/p31ca/ground-truth/creator-economy.json`** (schema **`p31.creatorEconomy/1.0.0`**) + public mirror; **`verify:economy`** |
| Payment / donate URLs | **`p31-constants.json`** → `payment.*`; **`verify:constants`**, **`verify:ecosystem`**, **`verify:monetary`** |
| Fleet / glass | **`p31-live-fleet.json`**, **`docs/ECOSYSTEM-PRODUCTION-11.md`** |

**Do not** ship “medical-grade” or regulatory claims in monetization copy without counsel; wellness and passport UX are not a substitute for legal review.

---

## 5. One loop

1. **Create** in a **source** registered in **`p31-alignment.json`** (or extend the registry).
2. **Connect** downstream via an **`apply`** + **`verify`** pair (derivation row).
3. If money or public promises move, touch **creator economy** + **constants** / **ecosystem** as needed and run **`verify:monetary`**.
4. If UI touches paywalls, tips, or “support us,” pass **`docs/ETHICAL-STYLE-MAP.md`** checklist — **especially** autonomy and anti-FOMO.

---

## 6. Scale

**Scale** here means *more people, more surfaces, more agents* — not *more secret spreadsheets or more copies of the same truth*.

| Pillar | How it scales (healthy) | How it fails (stop and fix) |
|--------|-------------------------|-----------------------------|
| **Ephemeralization** | New work adds **one** source (or extends one) + a **derivation** row + **verify**; `apply:*` multiplies the edit. | Parallel “shadow” docs or hand-updated URL lists that **`verify` doesn’t read**. |
| **Connect** | More hubs, Workers, and static pages all **ingest the same** constants / ground-truth / public JSON; **fleet + glass** stay honest. | Each team invents its own fee story or endpoint set “for speed.” |
| **Ethical monetization** | **Volume and reach** grow under the **same** published contract; v1.0.0 invariants until a **versioned, committed** change + **notice** (per **`creator-economy.json`**). | Scaling “revenue” by **silent** fee or share changes, or by dark-pattern UX. |

**Rule of thumb:** If scaling requires **hiding** economics or **forking** truth without a derivation row, you are not scaling the system — you are evading it.

**Execution spine (co-presence + Soup cadence):** **`docs/PLAN-BONDING-SOUP-WHEN-SCALE.md`**. **Production + monetary row:** **`docs/ECOSYSTEM-PRODUCTION-11.md`**.

---

## 7. Organize

**Organize** is *where work lives* and *how we find the lever* without tribal memory — the complement to **ephemeralization** (which kills duplicate *truth*). You still need **one clear filing system** for trees, indices, and agent entry.

| Question | First place to look | Why |
|----------|---------------------|-----|
| Which **directory** (home Soup vs `andromeda` vs p31ca vs `phosphorus31.org`)? | **`P31-ROOT-MAP.md`** | Stops cross-repo mix-ups and “wrong `package.json`” edits. |
| What is a **source** vs a **derivation**? | **`p31-alignment.json`** + **`docs/P31-ALIGNMENT-SYSTEM.md`** | Registry + `derivations` + `verifyPipeline` — the machine map. |
| How do I **search prose** in `docs/*.md`? | **`docs/doc-library/index.html`** (rebuild: **`npm run build:doc-index`**) | Full-text + parity with **`verify:doc-index`**; not unindexed markdown sprawl. |
| What are all the **live URLs**? | Home **`fleet-portal.html`** / **`npm run build:fleet-portal`**; hub **`/fleet-portal`** | One generated index; polish mirrors to p31ca. |
| What do **agents** read first? | **`AGENTS.md`** (numbered: mesh, create/connect, doc library, etc.) + **`docs/P31-PERSONAL-HOW-TO.md`** (operator cheat sheet) | Consistent on-ramp; same bar as **`.cursorrules`**. |
| **Hub products** and **id** / **appUrl** rules? | **`docs/P31-HUB-CARD-ECOSYSTEM.md`**, **`p31ca` `registry.mjs` + `hub-app-ids.mjs`** (same change) | No orphan cards; ecosystem integrity. |

**Rule of thumb:** If a new document or app **doesn’t** hook into **map**, **alignment**, or an **index** people actually run, it will go stale. Prefer extending existing tables and **`verify`** hooks over another orphan README.

**See:** **`docs/P31-ALIGNMENT-SYSTEM.md`** (ephemeralization as organization), **`docs/PLAN-DOCUMENT-LIBRARY.md`** (doc index plan).

---

## See also

| Doc | Role |
|-----|------|
| **`docs/P31-MISSION-SYSTEM-DELIVERABLE.md`** | **Final handoff** — prep, assemble, definition of done, one manifest |
| **`docs/PLAN-BONDING-SOUP-WHEN-SCALE.md`** | C.A.R.S. — phased **when** plan (cadence, gates, mesh scale) |
| **`P31-ROOT-MAP.md`** | Which tree to edit (home / Andromeda / hub / org) |
| **`docs/PLAN-DOCUMENT-LIBRARY.md`** | Searchable `docs/` index — `build:doc-index` |
| **`docs/P31-ALIGNMENT-SYSTEM.md`** | Ephemeralization mechanics |
| **`docs/ETHICAL-STYLE-MAP.md`** | Ethical UI / rewards / copy |
| **`docs/P31-ENGINEERING-STANDARD.md`** | Ship bar |
| **`docs/AGENTIC-VIBE-INFRASTRUCTURE.md`** | Agentic dev + verify culture |
| **`docs/ECOSYSTEM-PRODUCTION-11.md`** | Contracts + monetary row in production map |
| **`docs/SIC-POVM-K4-ARCHITECTURE.md`** | Four-vector product framing |
