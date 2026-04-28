# P31 ecosystem alignment — EDE Composer prompts

Parallel AI threads (Composer, etc.) can use these prompts to extend the **EDE (Everything Development Environment)** visual system. They anchor to **`/p31-style.css`**, **Atkinson Hyperlegible** (prose/UI), **JetBrains Mono** (data/kickers/code), **`p31-tailwind-extend.js`** / `window.P31_TAILWIND_EXTEND`, and **`npm run verify:style-alignment`** / **`npm run build`** (p31ca).

Tracks are intentionally split by domain to reduce merge conflict: **Hub (Astro)**, **fleet generator + passport**, **doc-library static UI**.

---

## Parallel Track A — Hub & Astro app

**Targets:** `andromeda/04_SOFTWARE/p31ca/src/pages/index.astro`, `andromeda/04_SOFTWARE/p31ca/src/layouts/BaseLayout.astro`

**Goal:** Transition the main registry-driven landing into EDE **mission-control** polish without breaking the Astro build or registry loops.

### Copy/paste prompt

**Role:** Lead UI engineer — P31 Hub landing EDE upgrade.

**Context:** Visual identity uses a single surface: **`/p31-style.css`** and the Tailwind extension **`window.P31_TAILWIND_EXTEND`** (linked as `/p31-tailwind-extend.js` on static surfaces). Dark mode uses **`var(--p31-void)`**. Prose/UI: Atkinson Hyperlegible. Instruments: JetBrains Mono.

**Task:** Improve the Hub index and base layout toward EDE parity with `public/p31-super-centaur-starter.html` (grid, radial veil, mono kickers, no second palette).

**Directives:**

1. **Grid & veil:** Implement the EDE **40px line grid** and **soft teal radial** via CSS variables — no duplicate void hex outside token/Tailwind map.
2. **Header:** Remove legacy headline gradients where they fight EDE; use crisp **Atkinson** for hero titles + **mono** uppercase kickers.
3. **Product grid:** Registry cards remain data-driven — tighten to **dense glass panels** using `color-mix(in srgb, var(--p31-surface) …)` patterns consistent with existing hub cards (no marketing-only chrome).
4. **Status badges:** Keep **LIVE / RESEARCH / TOOL** semantics; use mono token-backed badges (`phosphorus`, `teal`, `butter`, etc.) aligned with **`verify:style-alignment`**.

**Execution:** Preserve all **registry-driven** URLs, **`hubLanding` / hub-landing.json** mappings, **`id`s** used by **`landing-cockpit.ts`**, filters, and inline scripts. **Do not** add serif fonts or ad-hoc hex maps. Confirm **`npm run verify:style-alignment`** and **`npm run build`** (p31ca) succeed.

---

## Parallel Track B — Fleet portal generator & Cognitive Passport

**Targets:**  
- `scripts/build-fleet-portal.mjs` (authoritative HTML template — root `fleet-portal.html` is generated here; mirror to `andromeda/04_SOFTWARE/p31ca/public/fleet-portal.html` follows **`npm run polish`** / path rewrites documented in **`scripts/p31-polish.mjs`**).  
- `cognitive-passport/index.html` (then **`npm run sync:passport`** for the p31ca mirror).

**Goal:** High-utility “instrumentation” surfaces — dense, mono-forward, token-only color.

### Copy/paste prompt

**Role:** Instrumentation UX — P31 EDE on utility pages.

**Context:** Fonts and color come only from **`p31-style.css`** + mono/sans stacks already loaded.

**Tasks:**

**Fleet portal (`build-fleet-portal.mjs`):**

- Edit the **template literal** inside the script (do not maintain `fleet-portal.html` by hand unless you also reconcile the generator).
- Style like a **dense URL / probe index**: mono-first tables, clear column rhythm, teal/cyan links, restrained borders.
- **Do not invent** IDs that downstream scripts rely on unless you verify usages — grep **`fleet-portal`** / **`fp-`** consumers before adding **`id="app-list"`** or similar; align with **actual** current markup if the brief mentions a specific ID (prefer matching **existing** structure + rebuild).

**Cognitive Passport (`cognitive-passport/index.html`):**

- Form + output panels: **EDE inputs** — dark surface, backdrop blur where already used, **teal** bottom border shifting to **cyan** on `:focus-visible`.
- Keep **`/p31-style.css`**, **`/lib/p31-subject-prefs.js`**, passport **IDs** and export/copy hooks **unchanged**.

**Execution:** Run **`npm run build:fleet-portal`** from repo root after editing the generator; run **`npm run sync:passport`** after passport edits. Do not break **`verify:passport`** / **`npm run verify:p31-style`**.

---

## Parallel Track C — Doc library search terminal

**Target:** `docs/doc-library/index.html` (mirror to p31ca **`public/doc-library/`** via **`npm run sync:doc-library:p31ca`** when needed).

**Goal:** Keyboard-forward, mono-heavy retrieval UI — not marketing-page search.

### Copy/paste prompt

**Role:** Search UI architect — doc library EDE terminal.

**Context:** **`docs/doc-library/index.json`** is produced by **`npm run build:doc-index`**. Search uses **Minisearch** + **`doc-search-worker.js`** — contract unchanged.

**Task:** Adjust **HTML/CSS** in **`docs/doc-library/index.html`** only.

**Directives:**

1. **Keyboard-first:** Primary search entry reads as an **oversized CLI-style** control (prompt affordance **`➜`**, clear focus rings).
2. **Surface:** **`var(--p31-void)`** background + EDE grid/radial if already present — **remove** ornamental conic/neon orbs unless reduced to trivial opacity.
3. **Results:** Hit rows as **terminal output blocks**: **JetBrains Mono** for titles/paths where appropriate; **`var(--p31-cyan)`** for match highlighting (existing highlight hooks preserved).
4. **Optional split pane:** Preview pane only if implementable **without** new dependencies and without breaking **`app.js`** selectors — otherwise keep single-column and document the limitation.

**Execution:** Preserve **worker URL**, **`index.json` load**, and **script** blocks verbatim except for unavoidable hook IDs. Run **`npm run build:doc-index`** after manifest-level changes elsewhere; **`npm run verify:doc-index`** before ship.

---

## Verify bar (reference)

After changes in each track:

| Area | Typical commands |
|------|------------------|
| Home / passport | Root: **`npm run verify:p31-style`**, **`npm run verify:passport`** |
| Fleet | **`npm run build:fleet-portal`**, polish mirror when applicable |
| Doc library | **`npm run build:doc-index`**, **`npm run verify:doc-index`** |
| p31ca Hub / about | **`cd andromeda/04_SOFTWARE/p31ca`** → **`npm run verify:style-alignment`**, **`npm run verify:ground-truth`**, **`npm run build`** |

---

## Ground rules (all tracks)

- **No second void color** outside **`--p31-*`** / generated Tailwind theme.
- **No serif stack** unless operator re-opens canon in design tokens + **`apply:p31-style`**.
- **Ground truth:** Do not rename **`p31ca/ground-truth/p31.ground-truth.json`** routes/structure unless the task explicitly includes contract + **`verify:ground-truth`**.
- **EBC footer** blocks (`<!-- P31:mission-ebc:start -->` … **`end`**): preserve markup **`href`**s (**`/build`**, **`/geodesic.html`**, **`/mesh`**) when present.
