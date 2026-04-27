# Plan: documentation cleanup + interactive document library

**Status:** MVP **shipped** — static UI + worker + vendored Minisearch, `build:doc-index` / `verify:doc-index` on root `verify`, `npm run test:doc-library:e2e` (Playwright) and in **`p31:all`** unless `--skip-e2e`. CI: Playwright cache + 60m timeout (`.github/workflows/p31-ci.yml`). **Phase 3** — **p31ca public mirror** live: `npm run sync:doc-library:p31ca` → `andromeda/04_SOFTWARE/p31ca/public/doc-library/`, short **`/doc-library`**, `p31.ground-truth` route **`docLibraryHub`**. Re-sync after index-changing doc edits. **Audience:** operators and agents. **Version:** 0.4.0

---

## 1. Inventory (scan summary)

Approximate **markdown scope** in this home directory **excluding** `node_modules`, `.git`, and common build outputs — on the order of **1,600+** `.md` files. Density is not uniform:

| Area | Role | Notes |
|------|------|--------|
| **`docs/` (home, ~50+ files)** | Normative P31: engineering standard, alignment, ethical style, WCD, geodesic, CWP pointers | Primary **human + agent** canon; highest ROI for search-first UX |
| **Root (`README.md`, `AGENTS.md`, `P31-ROOT-MAP.md`, …)** | Entry points | Must be first-class in the library |
| **`andromeda/docs/`** | Monorepo narrative, legal/corporate, social, files | Often edited outside home CI |
| **`andromeda/04_SOFTWARE/p31ca/docs/`** | Hub runbooks, security, CWPs | Tied to **`npm run verify`** / deploy |
| **`andromeda/04_SOFTWARE/**` (other packages)** | Package READMEs, integration handoff | Per-package truth |
| **`phosphorus31.org/**`** | Large parallel tree (firmware, grants, SUPER-CENTAUR, etc.) | **Separate** product line; include as optional tier or exclude v1 |
| **`.claude/`, `.cursor/`, `spikes/`** | Tooling, experiments | Low priority or exclude from v1 index |

**Existing pattern:** `p31-personal-howto.html` is static **interactive** (tabs + search) and is opened via **`npm run demo`**. Reuse that UX model for a doc library (single-page or small static bundle) before adopting a full VitePress/Docusaurus site.

---

## 2. Documentation cleanup (before / alongside the library)

Work in **waves**; do not block the library on a full dedupe of 1,600+ files.

### 2.1 Triage tags (apply in front matter or a machine manifest)

- **`status: canonical`** — ship bar, still maintained  
- **`status: snapshot`** — review bundle, handover, one-time (keep, link from index)  
- **`status: deprecated`** — point to replacement; consider moving under `docs/archive/`  
- **`audience: agent` | `operator` | `public`** — drives search facets  

### 2.2 High-confidence cleanup candidates (home `docs/`)

- **Duplicate or superseded narrative:** e.g. multiple “review supplement” and “handoff” files — add a **single** `docs/README.md` (index) that lists **which file is current** for each concern (or merge table in `P31-ROOT-MAP.md`).  
- **Sprint / execution logs** (`sprint-1`, `sprint-2`, `PLAN-11-10-EXECUTION-LOG`, patch notes): move to `docs/history/` or tag `snapshot` so the library can **down-rank** them in default search.  
- **WCD lineage:** keep in one vertical column in the index (links only); avoid content duplication.  

### 2.3 Alignment

- New canonical files: register in **`p31-alignment.json`** `sources` when they become **one-way** inputs to tools or site copy.  
- Ethical and visual norms: **`docs/ETHICAL-STYLE-MAP.md`**.

### 2.4 Verification (optional `verify:docs`)

- **Link check** (internal `docs/` and root-relative paths) on a allowlist.  
- **Front matter schema** (if introduced): small JSON schema + script.  
- **No** requirement to run on all of `phosphorus31.org` in v1.

---

## 3. Interactive searchable document library — product definition

### 3.1 MVP (recommended)

- **Scope:** P31 home **`docs/*.md`**, root **`*.md`**, and optionally **`cognitive-passport/**` readmes** only.  
- **UI:** one **static** shell (e.g. `doc-library.html` or `docs/doc-library/index.html`) served by the same **Python** demo server as today (`npm run demo` → port 8080).  
- **Search:** **client-side** full-text on a **prebuilt JSON index** (e.g. **Flexsearch** or **Minisearch**; **Pagefind** is an alternative if you emit HTML per doc).  
- **Features:**  
  - Search box + **snippet** + path  
  - **Filter** by tag / audience (from manifest)  
  - “Open in repo” path display (not necessarily raw GitHub for local-first)  
- **Build:** `node scripts/build-doc-index.mjs` — walks allowlist, strips markdown to plain text, outputs **`docs/doc-library/index.json`** (or `cognitive-passport/…` if you want verify to pick it up).  
- **Storage:** **committed JSON index** (small) + **HTML/JS** in `docs/doc-library/`; **or** gitignored `index.json` + generate in `npm run setup` / `verify` (tradeoff: fresh clone has no index until script runs).  

**Recommendation:** commit the index for **zero-install** search after clone; add **`npm run build:doc-index`** to `setup` or document clearly.

### 3.2 Phase 2 (broader)

- Add **`andromeda/04_SOFTWARE/p31ca/docs/**/*.md`** and **`andromeda/docs/**/*.md`** to the allowlist (longer build; larger index).  
- Optional **sidebar** from heading outline (parse `##` in build step).  
- **Deep link** to `https://github.com/p31labs/.../blob/...` when `P31_HOME_GITHUB` or remote is known.

### 3.3 Phase 3 (full fleet)

- **phosphorus31.org** opt-in module (separate index file).  
- **Deploy:** static assets to **R2** or **p31ca** `public/doc-library/**` for **https://p31ca.org/doc-library/** (requires ground-truth route + `verify-p31ca-dist` check).  
- **Auth:** not required for public docs; private docs stay out of the index.

### 3.4 Alternatives considered

| Option | Pros | Cons |
|--------|------|------|
| **VitePress / Docusaurus** | Mature nav, search plugins | Second site; overlaps Astro p31ca; high migration cost |
| **Pagefind** | Great static search | Needs HTML per page build pipeline |
| **Astro content collections** in p31ca | One deploy | Binds home `docs/` to monorepo checkout |
| **Minisearch + one HTML** (MVP) | Fast, local-first, no new framework | Limited doc formatting in browser |

**Direction:** MVP = **Minisearch/Flexsearch + static `doc-library` + build script**.

---

## 4. Full build plan (creation + storage)

### 4.1 Files to add (MVP)

| Path | Purpose |
|------|---------|
| `docs/doc-library/index.html` | Shell UI (P31 tokens via existing `cognitive-passport/p31-style.css` or inline minimal CSS) |
| `docs/doc-library/app.js` | Load `index.json`, run client search, render results |
| `docs/doc-index.manifest.json` | List of glob roots + weights + `exclude` patterns |
| `scripts/build-doc-index.mjs` | Read manifest → find files → parse md → output `index.json` |
| `docs/doc-library/index.json` | Generated: `{ id, path, title, text, tags, h2[] }` entries (shape TBD) |

### 4.2 `package.json` scripts

- `"build:doc-index": "node scripts/build-doc-index.mjs"`  
- Optional: `"verify:doc-index": "node scripts/verify-doc-index.mjs"` (size, JSON validity, required fields)  
- Wire **`build:doc-index`** into **`docs:prep`** or **`setup`** as needed.

### 4.3 Storage

| Layer | What |
|--------|------|
| **Source of truth** | Markdown in git (unchanged) |
| **Derived index** | `docs/doc-library/index.json` (committed **or** gitignored + CI artifact) |
| **Runtime** | Static files; no server DB |
| **Remote** | Optional copy to **p31ca `public/doc-library/`** in Phase 3; **R2** only if you need CDN versioning separate from Pages |

### 4.4 CI (GitHub Actions / home `p31-ci.yml`)

- Run **`node scripts/build-doc-index.mjs`** and **`git diff --exit-code`** *if* you require index freshness on every PR, **or** run **`verify:doc-index`** only when `docs/**` or script changes.  
- Keep **fast** — do not block on 1,600 files in v1; allowlist stays small.

### 4.5 Discoverability

- **`P31-ROOT-MAP.md`** — one row: “Doc library (search): …”  
- **`AGENTS.md`** — bullet under item 0 or 2.  
- **`docs/README-REVIEW-DOCS.md`** — cross-link (review bundle still separate).

---

## 5. Phased schedule (suggested)

| Week | Milestone |
|------|-----------|
| **W1** | Manifest + `build-doc-index.mjs` + `index.html` + Minisearch MVP for **home `docs/` + root** only; `build:doc-index` script |
| **W2** | `verify:doc-index` + `docs/README.md` hub table (canonical vs snapshot); triage 5–10 obvious deprecations |
| **W3** | Add **p31ca + andromeda/docs** to allowlist if clone present; optional deploy path sketched |
| **W4+** | **phosphorus** module, p31ca.org hosting, R2 if needed |

---

## 6. Open decisions

- **`index.json`:** **committed** so clones have search without an extra step; fingerprint keeps `generatedAt` stable when content is unchanged.  
- **Public deploy:** still **dev/local** (8080) for v1; **p31ca** `public/doc-library/` remains optional (Phase 3).  
- **Language scope:** English-only v1; i18n later.  

---

## 7. Related

- **`docs/P31-ALIGNMENT-SYSTEM.md`** — sources vs derivations (doc index is a *derived* view of source markdown).  
- **`p31-personal-howto.html`** — prior art for **interactive** static from this repo.  
- **`docs/P31-ENGINEERING-STANDARD.md`** — doc index is on the root **`verify`** bar (`build:doc-index` → `verify:doc-index`).  

---

**Next step (post-MVP):** Optional **p31ca** static mirror + `_redirects` entry when you want **https://p31ca.org/doc-library/**; W2 triage (`docs/README.md` hub table) per schedule above.
