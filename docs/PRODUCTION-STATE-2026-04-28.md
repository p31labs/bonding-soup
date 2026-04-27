# P31 production state — 2026-04-28

**Tags:** `production-2026-04-28` (bonding-soup) · `production-2026-04-28` (andromeda)  
**Prior baseline:** `clean-room-2026-04-27`

---

## What shipped

### Design doctrine (Gray Rock → Alive)

- `docs/P31-DESIGN-DOCTRINE.md` — normative visual architecture.
- Generated `p31-style.css` (passport + hub canon path) — doctrine-linked layout and component patterns; **`npm run verify:p31-style`** is the proof hook.
- `p31-subject-prefs.js` — passport → CSS bridge (contrast / density / motion / temperature).
- Cognitive Passport: Screen Comfort fields → `uiComfort` in exported JSON where applicable.
- `.cursor/rules/p31-hub-html-style.mdc` — agent pre-read with anti-patterns.

### Soup

- Gray Rock first paint (`soup-app--gray-rock`, removed on first interaction).
- `?perf=1` frame time probe (rolling average to console).
- `?alive=1` bypass for testing where wired.

### Hub (p31ca)

- BaseLayout + `global.css` on canon tokens (`data-p31-appearance`, theme-color).
- Full hub landing + static pages aligned with **Gray Rock → Alive** doctrine (token sweep on `src/` surfaces committed in Andromeda `main` prior to this tag).
- Fleet portal + passport hub mirror paths per **`npm run polish`** / **`sync:passport`** conventions.

### Mesh

- k4-cage live: **`qFactor: 1`**, **`routing_protocol: custom_dsdv`** (verified via `GET /api/mesh`).
- `validate-p31-full.sh`: stdin/file mesh JSON, **`metadata.q_factor`** fallback for link quality.
- Scorecard: **100%** graded (**29** PASS / **0** FAIL of **29** graded checks).

### Tooling verified this release

- Doc-library Playwright e2e: **`input#q`** waits **`attached`** + **`fill(..., { force: true })`** to avoid headless “visibility” flakes (`scripts/doc-library-e2e.mjs`).
- Andromeda: passport footer **CONNECTION** link to deploy canon; CI workflow notes (`social-dispatch` manual-only).

---

## Numbers (gates on 2026-04-27 UTC workspace run)

| Metric | Value |
|--------|-------|
| Glass probes | **UP: 23**, **DOWN: 0**, **skip: 1** (HA LAN — empty `integrations.endpoints.homeAssistantLanBase`) |
| BONDING tests | **424** tests / **32** files (`pnpm --filter @p31/bonding test`) |
| Mesh scorecard | **100%** (29 graded PASS / 29 graded total; 39 rows overall — 9 INFO, 1 SKIP) |
| Doc library index | **109** documents (`build-doc-index` / `verify:doc-index`, includes this file) |
| Hub registry (prebuild) | **53** products, **3** prototypes (`hub/build-landing-data.mjs`) |
| p31:all runtime | **~398 s** (~6.6 min) wall time (this machine; includes e2e + validate + glass) |
| p31ca build (`verify-p31ca-dist`) | **157** top-level HTML + `lib/` + `_redirects`; internal link scan **187** HTML files |

---

## Verify from zero

```bash
git clone https://github.com/p31labs/bonding-soup.git ~/p31 && cd ~/p31
git checkout production-2026-04-28
npm ci
# Andromeda is a separate git clone (ignored by home .gitignore):
git clone https://github.com/p31labs/andromeda.git ~/p31/andromeda && cd ~/p31/andromeda && git checkout production-2026-04-28
cd ~/p31/andromeda/04_SOFTWARE && pnpm install

cd ~/p31
npm run verify
MESH_LIVE_STRICT=1 npm run p31:all
```

Deploy hub (requires Cloudflare credentials): `npm run deploy:p31ca` from `~/p31` or `andromeda/04_SOFTWARE/p31ca`.

---

## What’s still open (by design)

| Item | Blocker | Next |
|------|---------|------|
| E3+ education portal | Policy (TBDs in `docs/EDU-E3-POLICY-2026-01.md`) | Fill decisions → CWP-01 P1 |
| Node Zero firmware | Hardware | Board on desk → NZ-01 milestone |
| 08 Security | Recurring | `security:check` on Worker/dep changes |
| Soup room-scale / WS | Doctrine proof → profiling → room gate | `npm run soup:room-scale` when ready |

---

## Proof hooks

| Claim | Command |
|-------|---------|
| Home bar | `npm run verify` |
| CI parity + hub + security | `MESH_LIVE_STRICT=1 npm run p31:ci:all` |
| Full release incl. e2e | `MESH_LIVE_STRICT=1 npm run p31:all` |
| Mesh scorecard | `bash validate-p31-full.sh` |
| Glass | `MESH_LIVE_STRICT=1 npm run ecosystem:glass` |
| BONDING | `cd andromeda/04_SOFTWARE && pnpm --filter @p31/bonding test` |
