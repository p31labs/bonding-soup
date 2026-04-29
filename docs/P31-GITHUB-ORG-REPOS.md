# P31 Labs GitHub organization — public map

Canonical **hub source** for contributors: clone **[p31labs/andromeda](https://github.com/p31labs/andromeda)** and work in **`04_SOFTWARE/p31ca`** (deployed **https://p31ca.org**). The standalone **[p31labs/p31ca](https://github.com/p31labs/p31ca)** repo, if maintained, should state its relationship (mirror, release branch, or alternate) in its README; machine-readable defaults live in **[`p31-github.json`](../p31-github.json)** → `hubCanonical`.

**P31 home** (this repo when checked out as **[bonding-soup](https://github.com/p31labs/bonding-soup)**): alignment, passport authoring, verify tooling, C.A.R.S. See root **[README.md](../README.md)**.

**Org profile** (Zenodo, Sponsors): implemented per **[`GITHUB_ORG_DOI_BADGE_PATCH.md`](../GITHUB_ORG_DOI_BADGE_PATCH.md)** in the special **`.github`** repository (`profile/README.md` on **https://github.com/p31labs**).

---

## Bundle for `p31labs/.github`

Copy files from **[`docs/github-org-bundle/`](github-org-bundle/)** into the org’s `.github` repository (commit **`REPOS.md`** at repo root; merge **`profile-repository-map.md`** into **`profile/README.md`** below existing content).

### Automation (`gh` + local clone)

1. One-time: `git clone https://github.com/p31labs/.github.git` (or your org’s profile-repo slug from **`p31-github.json`** → `orgDotGithubRepository`) into e.g. `~/p31-dotgithub`.
2. **Dry run:** `npm run github:org:sync -- --repo-dir ~/p31-dotgithub --dry-run`
3. **Commit + push map:** `npm run github:org:sync -- --repo-dir ~/p31-dotgithub --push`  
   Or set **`P31_GITHUB_ORG_REPO`** to that path and use **`P31_GITHUB_ORG_PUSH=1`**.
4. **GitHub About + topics** (Tier 1–2 from **`repos-metadata.json`**): `npm run github:org:metadata` (requires `gh auth login` with **repo** scope).
5. **Both:** `npm run github:org:publish -- --repo-dir ~/p31-dotgithub --push`

Override org/repo slug: **`P31_ORG_DOTGITHUB`** (for clone URLs in error text only today; the script reads **`orgDotGithubRepository`** from **`p31-github.json`**).

---

## Tier 1 — Showcase (high polish)

| Repository | Suggested GitHub **About** (one line) | Suggested topics |
|------------|----------------------------------------|------------------|
| [bonding-soup](https://github.com/p31labs/bonding-soup) | P31 home: C.A.R.S. sim, cognitive passport authoring, alignment, verify tooling. Pairs with [andromeda](https://github.com/p31labs/andromeda) for the hub. | `p31-labs`, `typescript`, `cognitive-accessibility`, `family-mesh` |
| [andromeda](https://github.com/p31labs/andromeda) | P31 Labs monorepo: Cloudflare hub (p31ca), Workers, shared packages. Hub path `04_SOFTWARE/p31ca`. Live https://p31ca.org | `p31-labs`, `cloudflare-workers`, `monorepo`, `typescript`, `family-mesh` |
| [p31ca](https://github.com/p31labs/p31ca) | Technical hub source or mirror for https://p31ca.org — see README for relation to [andromeda](https://github.com/p31labs/andromeda) `04_SOFTWARE/p31ca`. | `p31-labs`, `cloudflare-pages`, `astro`, `family-mesh` |
| [phosphorus31.org](https://github.com/p31labs/phosphorus31.org) | P31 Labs public programs / org site (parallel track to the technical hub). | `p31-labs`, `static-site`, `nonprofit` |
| [.github / org profile](https://github.com/p31labs/.github) | (already set) Org profile + navigation — extend with bundle below. | — |

Paste-ready README paragraphs for repos not in this checkout: **[`github-org-bundle/tier1-readme-supplements.md`](github-org-bundle/tier1-readme-supplements.md)**.

**Default license for new public repos:** MIT (this home repo now ships **[`LICENSE`](../LICENSE)**). Use Apache-2.0 only when matching an existing ecosystem requirement.

---

## Tier 2 — Active lab / protocol (medium polish)

Honest **Status** in README (`experimental`, `protocol sketch`, `used by …`). Add **LICENSE** (MIT or Apache-2.0) if missing.

| Repository | Notes |
|------------|--------|
| [node-zero](https://github.com/p31labs/node-zero) | Identity, bond, vault protocol — keep description; add LICENSE if absent. |
| [love-ledger](https://github.com/p31labs/love-ledger) | LOVE ledger — same. |
| [game-engine](https://github.com/p31labs/game-engine) | Geodesic / assistive stack — same. |
| [family-link-os](https://github.com/p31labs/family-link-os) | Mesh narrative — same. |
| [cognitive-prosthetic](https://github.com/p31labs/cognitive-prosthetic) | Local-first centaur — same. |
| [the-buffer](https://github.com/p31labs/the-buffer) | Python / Node Zero membrane — same. |

**Checklist:** [ ] `LICENSE` at repo root [ ] GitHub **About** filled [ ] 5–7 topics [ ] README links to Tier 1 spine (andromeda / bonding-soup) where relevant.

Template: **[`github-org-bundle/LICENSE-MIT.template`](github-org-bundle/LICENSE-MIT.template)** (replace copyright year/name if needed).

---

## Tier 3 — Legacy / archive (low noise)

Prefer **GitHub Archive** + short README tombstone, or a **Superseded by** section at top of README.

| Repository | Recommendation |
|------------|------------------|
| [p31ca.org](https://github.com/p31labs/p31ca.org) | Already archived — ensure README first line: *Superseded by [p31ca](https://github.com/p31labs/p31ca) / canonical monorepo path [andromeda](https://github.com/p31labs/andromeda) `04_SOFTWARE/p31ca`.* |
| [phenix-os-quantum](https://github.com/p31labs/phenix-os-quantum) | Mark as **research lineage** or archive; avoid competing “current stack” wording with p31ca/mesh. |
| [sovereign-life-os](https://github.com/p31labs/sovereign-life-os) | Same. |
| [neuromaker-os](https://github.com/p31labs/neuromaker-os) | Same. |
| [neuromaker-oss](https://github.com/p31labs/neuromaker-oss) | Add About or archive; add README if empty. |
| [cognitive-shield](https://github.com/p31labs/cognitive-shield) | README status + link to **cognitive-prosthetic** or Tier 1 as appropriate. |

Tombstone snippet:

```markdown
> **Status:** Legacy / research. Not the primary deployment path for P31 Labs.
> **Current stack:** [bonding-soup](https://github.com/p31labs/bonding-soup) (home) · [andromeda](https://github.com/p31labs/andromeda) (hub + Workers) · [phosphorus31.org](https://github.com/p31labs/phosphorus31.org) (org site).
```

---

## Voice (Tier 1)

Prefer plain language (*technical hub*, *family mesh*, *verify pipeline*) in About lines and org profile. Reserve Phenix / membrane vocabulary for Tier 2 README body where it helps specialists.
