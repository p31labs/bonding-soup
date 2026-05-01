# P31 deep dive — what's actually in the box

A short tour of the parts of the codebase that survive contact with reality, told as a curator's walk. Every claim points at a file you can `rg` to verify. **No hype, only invariants.**

> **Audience:** future operators, grant reviewers, journalists, you-three-months-from-now. If you are sharing P31 to people who don't know it yet, this is the right doc to forward.

## 1. The shape of the system

P31 is a hybrid web2 / web3 / edge / family-mesh project for one operator with hypoparathyroidism and AuDHD, running on a zero-budget serverless edge. The architecture is **K₄** (the complete graph on four vertices) — every member touches every other member directly, no central hub, no advertiser in the middle. See `.cursorrules` § 2 and `docs/SIC-POVM-K4-ARCHITECTURE.md`.

Three K₄ instances coexist:

- **Family cage:** `will · S.J. · W.J. · christyn`. Source of truth: the `k4-cage` Cloudflare KV namespace; URL pin in `p31-constants.json` `mesh.k4PersonalWorkerUrl`.
- **Personal scope:** four pillars `a · b · c · d`, isolated KV. Same JSON shape, different namespace. Forms the second K₄.
- **Hub product mesh:** the static `p31ca.org` site exposes 8 product satellites around the family tetrahedron. See `andromeda/04_SOFTWARE/p31ca/public/connect.html` (Three.js K₄ navigator).

## 2. One source, many surfaces (Fuller's ephemeralization)

Counts taken at the time of this writing — they grow:

| Artifact | Count | File |
|---|---|---|
| Alignment **sources** | **111** | `p31-alignment.json` |
| Alignment **derivations** (one-way edges) | **53** | same |
| `verify` pipeline gates | **45+** | `package.json` `verify` script |
| Operator-locked constants (leaf keys) | **77** | `p31-constants.json` |
| Files referencing the Larmor `863 Hz` canon | **40+** | `rg "larmorHz"` |
| Smart contracts (SMART suite) | **5** | `packages/p31-sovereign-chain/src/` |
| Sovereign layers documented | **12** | `p31-sovereign-layers.json` |
| JSON schema contracts in registry | **36** | `contracts/p31-contract-registry.json` |
| EVM ABIs in registry | **5** | same |
| Live workers / probes (glass) | **14** | `p31-ecosystem.json` |
| Reports kinds | **6** | `morning · midday · evening · urgent · weekly · custom` |
| Launch readiness lanes | **10** | `p31-launch-readiness-config.json` |

If you change one source, the registry tells you which downstream artefacts to regenerate. **`npm run verify` is the proof.** No parallel lore; no "documentation drift"; no "ask Will what the real number is."

## 3. Mind-bending primitives (gallery)

These are the pieces that make people *pause* when they understand them. Each gets a visual demo in `demos/`.

### a) **K₄ family mesh** — `demos/k4-mesh.html`

Why mind-bending: the topology of a family is **not** a tree. A complete graph K₄ has 4 nodes and 6 edges; that's the family — every member directly touches every other, no hub. Putting a family on a centralized social platform forces a star topology with the platform at the center; that's a different graph and a different power structure. We chose K₄ on purpose.

Files: `andromeda/04_SOFTWARE/k4-personal/`, `p31-constants.json` `mesh.k4PersonalWorkerUrl`, `cars-contract/p31.carsWire.json`.

### b) **Larmor 863 Hz heartbeat** — `demos/larmor-pulse.html`

Why mind-bending: there is **one** number, `863 Hz` (the canonical Larmor frequency of ³¹P phosphorus in Earth's magnetic field), and it appears in 40+ files — UI labels, science-museum exhibits, tests, the egg-hunt CI gate. **You can edit it in exactly one place** (`p31-constants.json`) and `npm run apply:constants && npm run verify:constants` propagates and proves it. The demo visualizes that propagation as a circulatory system pulsing at 863 Hz (downsampled for human eyes).

Files: `p31-constants.json` `physics.larmorHz`, `scripts/apply-constants.mjs`, `scripts/verify-constants.mjs`, `scripts/verify-quantum-clock.mjs`.

### c) **Alignment graph (ephemeralization)** — `demos/alignment-graph.html`

Why mind-bending: 111 sources × 53 derivations is a small, finite, *legible* graph — not a black-box ML model, not a closed proprietary platform. A force-directed render on the public web is the entire epistemology of the project, visible in 60 seconds. **Edit one node, see which leaves update; that's the system promise.**

Files: `p31-alignment.json`, `docs/P31-ALIGNMENT-SYSTEM.md`, `scripts/verify-alignment.mjs`.

### d) **Glass Box (already shipped)** — `glass-box.html` + `glass-box-widget.html`

Why mind-bending: a public, read-only terminal that streams synthetic-but-faithful playbacks of the operator's CLI tools, plus *real* heartbeat (`docs/verify-pulse.json`) and *real* published reports (`docs/reports/promoted/index.json`). Takes the scary out of AI by showing every wire. See `docs/P31-GLASS-BOX.md`.

### e) **12 sovereign layers** — `p31-sovereign-layers.json`

Why mind-bending: most "decentralized" projects ship one layer. P31 maps **twelve**, from edge compute (L1) to on-chain governance/indexing (L11–L12), with explicit primitives, status, and contracts at each level. The hybrid-by-design philosophy is laid out as a finite stack rather than vibes.

Files: `p31-sovereign-layers.json`, `docs/P31-SOVEREIGN-LAYERS.md`.

### f) **SMART EVM suite** — `packages/p31-sovereign-chain/src/`

Why mind-bending: only 5 contracts (Sovereign / Manifest / Access / Root / Treasury), but together they anchor the entire JSON-contract universe on-chain. Permissionless transparency for digests + URIs; nothing more, nothing less. Boring on purpose; resilient by accident.

Files: `packages/p31-sovereign-chain/src/P31{TransparencyAnchor,ManifestRegistry,AccessAllowlist,ContentRoot,TreasuryConfig}.sol`, `p31-chain-anchor.json`, `contracts/p31-smart-evm.json`.

### g) **Reports + simulation + automation**

Why mind-bending: the operator can drop a `.txt` into `~/.p31/inbox/urgent/` from any synced folder and an urgent report files itself. The launch-readiness suite has 10 lanes with weighted scores. The reports daemon backfills missed slots. All of it is shippable because it's **scoped to one person**. See `docs/P31-LAUNCH-READINESS.md`, `docs/P31-REPORTS.md`.

## 4. What this is not

- **Not** a "founder mode" project. The whole point is `verify` — the system tells you when it's lying to you.
- **Not** a streak / engagement / FOMO surface. See `docs/ETHICAL-STYLE-MAP.md` for the design rules.
- **Not** an LLM wrapper. Local Ollama fleet is for operator privacy (legal drafting, hostile-mail triage); the cloud crew (`simplex-v7`) is the orchestration layer for non-private work.
- **Not** "decentralized" as a marketing word. The sovereign-chain layer is genuinely permissionless; the rest is honest about being Cloudflare-hosted edge compute. Layer 1 is "trust Cloudflare". We say so.

## 5. Where to start (operators)

```bash
git clone <repo>
npm install
npm run setup       # root + p31ca install + apply:constants + verify
npm run demo        # http://127.0.0.1:8080 — soup, glass-box, demos, …
npm run command-center  # http://127.0.0.1:3131
npm run verify      # full ship bar
```

For visuals, open `demos/index.html` (also live at `https://p31ca.org/visuals` after deploy).

## 6. Where to start (visitors)

- `https://p31ca.org/glass-box` — watch the system run
- `https://p31ca.org/visuals` — the four demos linked from this doc
- `https://p31ca.org/connect` — interactive K₄ family-mesh navigator
- `https://p31ca.org/onboard` — the four-door planetary onboarding (understand · use · build · know someone)

## 7. Where to start (journalists / grants)

- `docs/MVP-DELIVERABLES-INVENTORY.md` — tiered inventory.
- `docs/README-REVIEW-DOCS.md` — review bundle.
- `docs/DELIVERABLE-P31-FACTS.md` — incorporation facts (P31 Labs, Inc., GA 2026; EIN 42-1888158; 501(c)(3) pending).
- `docs/MORNING-OPERATOR-ARC.md` — what a typical day actually looks like.
- This file (`docs/P31-DEEP-DIVE.md`) — the curator's walk.

---

*Updated 2026-04-30. Counts grow. Re-derive any number with `rg` — that is the point of this design.*
