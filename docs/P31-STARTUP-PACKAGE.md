# P31 startup package — frictionless + informative

**One goal:** from **zero** to **shipped** with the fewest decisions and the right links.  
**Node:** 20+ (see repo **`.nvmrc`**). **Repos:** C.A.R.S. = this tree; `andromeda/` = separate git (ignored from home, clone beside this repo). **Production snapshot + gate numbers:** `docs/PRODUCTION-STATE-2026-04-28.md` — paired tags **`production-2026-04-28`** (bonding-soup + andromeda). Prior clean-room tag: `clean-room-2026-04-27`.

---

## Chromebook + iPhone ↔ local command center (**3131**)

Everything below is **`npm run command-center`** (Node on the machine that holds this repo).

| Surface | Hook up |
|---------|---------|
| **Desktop · loopback** | `npm run command-center` → **http://127.0.0.1:3131/** (`P31_CMD_CENTER_NO_OPEN=1` skips auto-browser) |
| **Chromebook (Crostini / Linux)** | Same command in Linux → Chrome `:3131` · LAN to another PC: **`P31_CMD_CENTER_LAN=1`** on the host · printouts in **`docs/P31-CHROMEBOOK-COMMAND-READINESS.md`** |
| **iPhone · trusted Wi‑Fi** | **`P31_CMD_CENTER_LAN=1 npm run command-center`** → header badge **`phone:`** URL in Safari → **Add to Home Screen** · **`docs/P31-IPHONE-COMMAND-READINESS.md`** |
| **Static walkthrough (:8080)** | One spine: **`docs/P31-DEVICE-SETUP-CHROMEBOOK-MOBILE.md`** · same content as **`npm run demo`** → **`http://127.0.0.1:8080/p31-device-setup.html`** |

---

## `p31` on your PATH (any terminal — Chromebook Linux / penguin)

`npm link` only works if npm’s global **`bin`** directory is on **`PATH`** (often missing on Crostini). One-shot:

| Step | Command |
|------|--------|
| 1. From the **home repo root** | `npm run p31:link` |
| 2. If the installer says `p31` is not found | `echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc` then **open a new terminal** (or `source ~/.bashrc`) |
| 3. Test | `p31 --version` · `p31 boot` |

This installs **`~/.local/bin/p31`** → `scripts/p31-launcher.sh` (realpath resolves the repo no matter **cwd**).

---

## 60-second path

| Step | Command / action |
|------|-------------------|
| 1. Clone + enter | `git clone` home + `git clone` Andromeda into `~/p31/andromeda` (see `npm run git:remotes`) |
| 2. One-shot setup | `npm run setup` — installs root + `p31ca`, `apply:constants` / `apply:p31-style` when present, runs **`npm run verify`** |
| 3. Big monorepo deps (optional) | `npm run setup:andromeda` *or* `cd andromeda/04_SOFTWARE && pnpm install` |
| 4. Devices + LAN CC | Rows above (`3131`). Optional: **`npm run demo`** (:8080) for **`p31-device-setup.html`** |
| 5. Daily driver | `npm run morning` — pull, `p31:converge`, **`P31_CMD_CENTER_LAN=1`** command center for Safari / LAN Chrome |
| 6. Ship hub | `npm run deploy:p31ca` (needs `CLOUDFLARE_API_TOKEN` or `wrangler login`) |

---

## What to read (order)

1. **`P31-ROOT-MAP.md`** — which folder is Soup vs hub vs org site.
1b. **`docs/P31-DEVICE-SETUP-CHROMEBOOK-MOBILE.md`** (or `p31-device-setup.html` under `npm run demo`) — Chromebook + mobile operator layout (**supersedes lone-device guesswork when both apply**).
2. **`AGENTS.md`** — full ship bar, command center, CI, alignment.  
2b. **`docs/P31-DESIGN-DOCTRINE.md`** — Gray Rock → Alive visual rules, canonical layouts, passport-driven prefs.  
3. **`docs/cwp-convergence/INDEX.md`** — convergence CWP scorecard (what’s closed vs open).  
4. **Mobile ops:** `docs/MOBILE-OPS-PHASE2.md` … `PHASE6.md` + `npm run mobile-ops:full`.  
5. **Production matrix:** `docs/ECOSYSTEM-PRODUCTION-11.md` (glass, deploy order).  
6. **Engineering standard:** `docs/P31-ENGINEERING-STANDARD.md` (merge/deploy bar).

Cheat sheet (commands only): **`docs/P31-PERSONAL-HOW-TO.md`**.

---

## Command vocabulary (the ones you’ll actually use)

| Command | Purpose |
|--------|---------|
| `npm run morning` | Cold start: pull, `p31:converge`, **LAN** command center |
| `npm run p31:converge` | Fast parallel preflight (ECO, education, node-zero check, constants) |
| `npm run verify` | **Home** full bar — alignment, facts, passport, ecosystem, p31ca contracts, doc index, `tsc`, soup prep |
| `MESH_LIVE_STRICT=1 npm run p31:ci:all` | CI parity: above + k4 + **p31ca** build + **security:check** |
| `npm run mobile-ops:full` | Production sweep + command check + BONDING/p31ca script sanity + **connect** edge (passkey, relay, k4) |
| `npm run ecosystem:glass` | All **glass** probes (report + `/tmp/p31_glass_report.json`) |
| `npm run p31:all` | Heaviest: CI+security, `validate:full`, e2e, glass soft, lint soft — use before a big release |
| `bash validate-p31-full.sh` | Extended **validate:full** scorecard (mesh + quantum egg + more) |
| `npm run deploy:p31ca` | **p31ca** `predeploy` (verify) → `wrangler pages deploy` |
| `npm run doctor` | Node, remotes, `gh`, Andromeda presence — when something’s weird |
| `npm run command-center` | Local **3131** UI — **`P31_CMD_CENTER_LAN=1`** for Chromebook LAN / iPhone (see top of file) |

**npm run startup** echoes the **first ~54 lines** here (Chromebook + iPhone paths included).

**BONDING (game) tests:** `cd andromeda/04_SOFTWARE && pnpm --filter @p31/bonding test` — expect **424 tests / 32 files** when green.

**p31ca** alone: `cd andromeda/04_SOFTWARE/p31ca && npm run hub:ci` (full hub pipeline) or `npm run verify` + `npm run build`.

---

## Directories (don’t mix by accident)

| Place | What |
|--------|------|
| Repo root | Soup, `cognitive-passport/`, `scripts/`, `docs/`, `p31-constants.json` |
| `andromeda/04_SOFTWARE/p31ca/` | **p31ca.org** Astro hub, `public/`, `wrangler` Pages deploy from **`dist/`** |
| `andromeda/04_SOFTWARE/bonding/` | BONDING app (Vite; dev port **5188**) |
| `phosphorus31.org/` (if present) | **Separate** org site — not the technical hub; see `P31-ROOT-MAP.md` |

---

## Credentials (no secrets in repo)

- **Cloudflare / Pages / Workers:** `wrangler login` or **`CLOUDFLARE_API_TOKEN`** with Pages deploy + Workers as needed.  
- **GitHub `gh`:** `npm run fix:gh` if git and `gh` disagree.

---

## What’s still open (by design)

| Item | Blocker | Next |
|------|---------|------|
| **E3+ education portal** | Policy | Fill **`docs/EDU-E3-POLICY-2026-01.md`**, then CWP-01 P1 |
| **Node Zero** | Hardware | CWP-02 / NZ-* milestones when the board is up |
| **08 Security** | — | **Ongoing** — `security:check` on releases that touch Workers or deps |

---

## If something fails

- **Offline / mesh relax:** `MESH_LIVE_STRICT=0` for local `p31:ci` / `release:local` (see `AGENTS.md`).  
- **Partial clone (no Andromeda):** root `verify` **skips** p31ca-specific steps.  
- **Playwright (e2e):** `npx playwright install chromium` once.  
- **Andromeda pnpm** warns about “ignored build scripts” — `pnpm approve-builds` in `04_SOFTWARE` if you need those scripts.

---

## Doc library

Searchable index: build with **`npm run build:doc-index`** (in **`verify`**). Open locally with **`npm run demo`** → `docs/doc-library/index.html`. **~97** documents when last indexed.

---

**Version:** 1.2.0 — 2026-04-28 ( **`npm run p31:link`** · `~/.local/bin/p31` on PATH) · prior: Chromebook + iPhone + CC · aligns with **`npm run startup`** (**54-line** teaser; extend file for full steps) + **`npm run verify`** spine.
