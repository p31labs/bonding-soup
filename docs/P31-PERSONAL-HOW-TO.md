# P31 personal how-to (commands + repositories)

**For:** you, on your machine, when “which folder is this again?” hits.  
**Interactive HTML (tabs + search + copy):** open **`p31-personal-howto.html`** in the browser (with **`npm run demo`:** `http://127.0.0.1:8080/p31-personal-howto.html`).  
**Normative ship bar still lives in** **`docs/P31-ENGINEERING-STANDARD.md`**. **Repo topology** (which tree owns what): **`P31-ROOT-MAP.md`**. **Agent/IDE defaults:** **`AGENTS.md`**.

---

## 1. The short mental model

You are not juggling twenty products—you are juggling **three layers**:

| Layer | What it is | Typical path (this workspace) |
|--------|------------|--------------------------------|
| **P31 home** | The **bonding-soup** git repo at the workspace **root**: constants, scripts, passport source, soup demo, hooks, CI that runs `npm run verify`. | `/` of this clone (e.g. `~/p31`) |
| **Andromeda** | A **separate** git repo: big pnpm monorepo (Workers, `p31ca`, donate-api, command-center, etc.). Often checked out as **`andromeda/`** next to home; may be **gitignored** from the home repo’s view. | `andromeda/` (e.g. `~/p31/andromeda` or `~/andromeda`) |
| **Live sites** | Deployed URLs (e.g. **p31ca.org**, Workers on `*.workers.dev`). You don’t “cd” there—you **build** in a repo and **deploy** with wrangler/Pages. | Browser |

**Rule of thumb:** edit **operator numbers and home scripts** at **P31 home**; edit **hub, Workers, BONDING app packages** under **Andromeda** `04_SOFTWARE/`. If unsure, open **`P31-ROOT-MAP.md`** and search the feature name.

---

## 2. “I want to…” → command (run from **P31 home** root unless noted)

| Goal | Command | Notes |
|------|---------|--------|
| **New machine / clean clone** | `npm run setup` | Installs, `apply:constants`, `verify`, p31ca deps when tree exists, optional git hooks. |
| **Sanity check (same bar as CI root job)** | `npm run verify` | Includes ecosystem, MAP pipeline (if `andromeda/` present), p31ca contract checks, egg-hunt, `tsc`. |
| **Full local + live audits** | `npm run validate:full` | Shell script + report under `/tmp/`; stricter than `verify` alone. |
| **Release-style check (verify + hub build when p31ca exists)** | `npm run release:check` | Uses `scripts/p31-ci.mjs`. |
| **Everything including mesh strict + glass (when configured)** | `npm run p31:all` | Heavier; see `AGENTS.md`. |
| **Change EIN, Ca band, mesh URLs, payment health URL, etc.** | Edit **`p31-constants.json`** → `npm run apply:constants` → `npm run verify`** | Single source of truth for operator-locked fields. |
| **Passport generator → p31ca mirror** | `npm run sync:passport` then `npm run verify:passport` | Don’t hand-edit the p31ca mirror. |
| **Payment / creator-economy files only (fast)** | `npm run verify:monetary` | Ecosystem + constants + Andromeda MAP + `verify:economy` in p31ca. |
| **MAP only (donate-api + donate page + secret scan)** | `npm run verify:map-pipeline` | Part of default `verify`; use alone for a quick Andromeda-only check. |
| **Mesh (k4-personal bundle + live API)** | `npm run verify:mesh` | Dry-run + optional live `MESH_LIVE_STRICT`. |
| **Clickable local buttons (hooks, verify, PR)** | `npm run command-center` | Opens **http://127.0.0.1:3131** (keep terminal open; Ctrl+C stops). |
| **Install git hooks (home)** | `npm run git:hooks` | `core.hooksPath=.githooks` (monetary pre-commit, optional auto-push). |
| **PR + auto-merge (low friction)** | `npm run pr` at home **or** `pnpm pr` **inside** `andromeda/` | See `AGENTS.md` for `fix:gh` / credentials. |
| **Remotes (origin + andromeda)** | `npm run git:remotes` | Uses `p31-github.json` when present. |
| **Soup + passport in browser** | `npm run demo` → open **`soup-demo.html`**, **`cognitive-passport/index.html`** | Port **8080** default. |

---

## 3. “I want to…” → where in the **Andromeda** repo (`andromeda/`)

Run **`pnpm install`** from **`andromeda/04_SOFTWARE`** (or follow that tree’s README) once; after that use package scripts from the right package.

| Goal | Where to work | Typical command |
|------|----------------|-----------------|
| **Technical hub (p31ca.org)** | `andromeda/04_SOFTWARE/p31ca` | `npm run verify`, `npm run build`, `npm run deploy` (see `DEPLOY.md`) |
| **EPCP / G.O.D. edge dashboard** | `andromeda/04_SOFTWARE/cloudflare-worker/command-center` | `wrangler deploy` (see Worker README / `STATUS.md`) |
| **Donate / Stripe MAP checks** | Andromeda root has **`scripts/verify-monetary-surface.mjs`**; donate worker under `04_SOFTWARE/donate-api` | Invoked from home as `verify:map-pipeline` |
| **pnpm workspace wide** | `andromeda/04_SOFTWARE` | `pnpm turbo run …`, `pnpm run quality` (see monorepo docs) |
| **Install git hooks (Andromeda clone)** | `andromeda/` root | `npm run git:hooks` (if that repo’s `package.json` defines it; see `CONTRIBUTING.md`) |

---

## 4. Three URLs to bookmark (operator “shells”)

These are **different** trust boundaries; together they are the **G.O.D. pattern** (local + hub + edge):

1. **Local (this computer):** **http://127.0.0.1:3131** after `npm run command-center` — runs **whitelisted** npm actions only on your machine.
2. **Public hub glass:** **https://p31ca.org/ops/** — read-mostly health table; no secrets.
3. **Edge EPCP:** **https://command-center.trimtab-signal.workers.dev/** — fleet / operator glass; Access for sensitive actions.

You can’t merge them into one browser origin; the guide is “**open the right shell for the job**,” not one magic domain.

---

## 5. Which **git** repo am I in?

- **`git rev-parse --show-toplevel`** — shows the root of the current repo.
- **Home** clone: often has `package.json` with `"name": "bonding-soup"`.
- **Andromeda** clone: often has `"name": "p31-andromeda"` at **andromeda** root, and **`04_SOFTWARE/pnpm-workspace.yaml`** inside it.

If `andromeda/` is **nested** inside home: two remotes, two histories—commit and push **in the directory where `.git` applies** to that change.

---

## 6. Cursor / VS Code

**Run Task** (Terminal → Run Task…) lists **P31:** tasks: verify, monetary, MAP pipeline, passport sync, mesh, local command center, etc. See **`.vscode/tasks.json`**.

---

## 7. One-line emergencies

| Situation | Command |
|-----------|---------|
| “CI says verify failed” | From P31 home: `npm run verify` and read the first red script. |
| “I changed payment URLs” | `npm run verify:monetary` (or full `verify`). |
| “gh / git credential weirdness” | `npm run fix:gh` (home); in Andromeda `npm run fix:gh` if defined. |
| “I need the map of folders again” | Open **`P31-ROOT-MAP.md`**. |

---

*This file is a map, not a legal contract—when `verify` and **`docs/P31-ENGINEERING-STANDARD.md`** disagree with prose, trust the machine gates.*
