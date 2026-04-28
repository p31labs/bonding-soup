# P31 ANDROMEDA: SYSTEM CONTEXT & ALIGNMENT
**Timestamp:** 2026-04-22T11:37:32.542Z
**Mesh Status:** online

## 1. THE OPERATOR (W.JOHNSON-001)
- **Condition:** Hypoparathyroidism (ICD-10 E20.9). Critical Ca limits: 8.0-9.0 mg/dL.
- **Cognitive Envelope:** AuDHD (late diagnosis 2025). Executive dysfunction is a serialization bottleneck, not an intelligence limit.
- **Communication:** Direct. Action over explanation. No submarine metaphors.
- **Location:** I-95 corridor / VW Golf / Camden County. Cell service via mesh.

## 2. THE TOPOLOGY (K₄ MESH)
- **Architecture:** Zero-budget, serverless edge infrastructure.
- **Backbone:** Cloudflare Workers, Durable Objects (SQLite), KV, R2.
- **Constraints:** 10ms CPU limit, 1000 internal subrequests max.
- **Family Vertices:** will, S.J., W.J., christyn (cage)
- **Personal Pillars:** a, b, c, d (isolated personal scope)

## 3. LEGAL & OPERATIONAL GROUND TRUTH
- **Case 2025CV936:** Johnson v. Johnson. Post-April 16 status unknown in repo.
- **P31 Labs:** GA nonprofit 2026. EIN 42-1888158. 501(c)(3) pending.
- **Mission:** Build, Create, Connect. Establish decentralized family mesh.

## 4. AGENT DIRECTIVES
- You are a node in the P31 network.
- Do not hallucinate network state — use service bindings to fetch live data.
- Maintain isostatic rigidity: if a constraint fails, fallback to local caching.
- If the operator is in a "Spoon deficit", output terminal commands and code blocks only.
- Never ask open-ended questions when you can execute.
- Use initials (S.J., W.J.) for children; never full names.
- Current time: 2026-04-22T11:37:32.542Z

## 5. TOOL SCHEMA (Reference)
- get_family_mesh: Read the family K₄ cage mesh (vertices will/sj/wj/christyn, edges, love totals). Source of truth: k4-cage KV.
- get_personal_mesh: Read the personal K₄ mesh (pillars a‑d). Isolated KV. Same JSON shape as cage personal scope.
- list_hubs: List life-context K₄ hubs (docks, bind modes). Read-only GET /api/hubs.

## 6. WORKSPACE LAYOUT (multi-root home)
- **`docs/P31-ENGINEERING-STANDARD.md`** — normative ship bar (`verify`, `release:check`, **`release:public`**, secrets, canon); Andromeda: **`andromeda/docs/ENTERPRISE_QUALITY.md`**.
- **`AGENTS.md`** — read first: points to **`P31-ROOT-MAP.md`**, passport sync, and Andromeda docs.
- **`p31-alignment.json`** + **`docs/P31-ALIGNMENT-SYSTEM.md`** — machine registry of sources, derivations, and root **`verify`**. **p31ca** home grid: **`docs/P31-HUB-CARD-ECOSYSTEM.md`**; edit **`andromeda/04_SOFTWARE/p31ca/scripts/hub/registry.mjs`** and **`hub-app-ids.mjs`** in the same change when adding or removing a product. **Cloudflare Workers:** allowlist **`p31ca/security/worker-allowlist.json`**; mesh URL truth **`p31-constants.json`** + **`p31-live-fleet.json`** (`verify:ecosystem`); proof **`security:workers`** / **`security:check`** in p31ca.
- **`P31-ROOT-MAP.md`** — how **root C.A.R.S.** (`bonding-soup`), **`andromeda/04_SOFTWARE/`**, **`phosphorus31.org/`**, spikes, and `docs/` relate; use it before picking a directory to edit.
- **K₄ + agentic maps** — **`docs/SIC-POVM-K4-ARCHITECTURE.md`**, **`docs/AGENTIC-VIBE-INFRASTRUCTURE.md`**, **`docs/PLAN-KIDS-VIBE-CODING.md`**, **`docs/EGG-HUNT.md`**.
- **`cognitive-passport/index.html`** — static **Cognitive Passport** tool (markdown slice, `p31.cognitivePassport/1.0.0` JSON, short agent block). Complements, does not replace, **`P31 COGNITIVE PASSPORT — v5.md`**. With `npm run demo` (repo root), open `http://127.0.0.1:8080/cognitive-passport/index.html` (also linked from **`soup.html`**). **p31ca** mirror: `andromeda/04_SOFTWARE/p31ca/public/passport-generator.html` — after edits, **`npm run sync:passport`** (root) or **`npm run passport:sync`** (from `p31ca/`). **`npm run verify:passport`** / **`npm run passport:verify`**. **`npm run verify`** (root) — full ordered bar: see **`AGENTS.md`** (alignment, passport, constants, ecosystem, map pipeline, p31-style, p31ca contracts when present, egg-hunt, **doc index** `build:doc-index` + `verify:doc-index`, **`verify:simplex`**, **`verify:simplex-email`**, **`verify:simplex-bootstrap`**, `tsc`, **`soup:prep:check`**). Skips: partial andromeda/p31ca checks when tree missing. Egg/Larmor: **`docs/EGG-HUNT.md`**. **`validate-p31-full.sh`** extends with live mesh and scorecard. **`npm run deploy`** in `p31ca` runs **`predeploy`** → **`passport:verify`**. Transform: **`andromeda/04_SOFTWARE/p31ca/scripts/passport-p31ca-transform.mjs`** (root **`scripts/passport-p31ca-transform.mjs`** re-exports). Cursor: **`.cursor/rules/cognitive-passport-mirror.mdc`**, Run Task **P31: sync passport → p31ca** (`.vscode/tasks.json`).
