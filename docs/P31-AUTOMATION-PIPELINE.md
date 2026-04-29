# P31 automation — test, merge, clean, deploy

**Autotest:** [`.github/workflows/p31-ci.yml`](../.github/workflows/p31-ci.yml) — every push/PR to `main`/`master` runs **`npm run verify`** then **`p31:all`** (preflight dedupe). Branch protection should require **P31 / root verify** (and recommended: **P31 / full stack**).

**Automerge:** [`.github/workflows/p31-automerge-after-ci.yml`](../.github/workflows/p31-automerge-after-ci.yml) — when **P31 CI** succeeds on a **same-repo** `pull_request`, runs **`gh pr merge --auto --merge`** for the open PR from that head branch. Requires repo **Settings → General → Allow auto-merge**. Fork PRs are skipped. **Opt out:** label **`no-automerge`** on the PR, or set repository **Variable** **`P31_DISABLE_AUTOMERGE`** to `true` or `1`.

Pairs with [`.github/workflows/p31-pr-on-push.yml`](../.github/workflows/p31-pr-on-push.yml) (opens a PR when you push a feature branch) and locally **`npm run git:autopr:on`** / **`npm run git:autopush:on`** (see **AGENTS.md**).

**Autodeploy (hub, production):** [`.github/workflows/p31-autodeploy-hub.yml`](../.github/workflows/p31-autodeploy-hub.yml) — when **P31 CI** succeeds on a **push** to `main`/`master`, runs **`node scripts/p31-ci.mjs --skip-root-verify`** and, if **`andromeda/04_SOFTWARE/p31ca/dist/`** exists and **`CLOUDFLARE_API_TOKEN`** is set, **`wrangler pages deploy … --branch=main`**. Partial clones without Andromeda skip deploy (notice in log). **Opt out:** repository **Variable** **`P31_DISABLE_AUTODEPLOY`** = `true` or `1`. Manual path + prod smoke: **P31 Pages deploy + prod smoke** workflow.

**Deploy on PR (preview):** [`.github/workflows/p31-pages-pr-preview.yml`](../.github/workflows/p31-pages-pr-preview.yml) — when **P31 CI** succeeds on a **`pull_request`** from the **same repo** (not a fork), builds the hub and runs **`wrangler pages deploy … --branch=<slug>`** so Cloudflare attaches a **preview** deployment (production branch / `p31ca.org` unchanged). Posts a **PR comment** with the `*.pages.dev` URL when wrangler prints one. Skips **`dependabot/*`** heads, **`main`/`master`** heads, and missing dist. **Opt out:** repository **Variable** **`P31_DISABLE_PR_PREVIEW_DEPLOY`** = `true` or `1`. Needs the same **`CLOUDFLARE_API_TOKEN`** as production autodeploy.

**Autoclean (local):** **`npm run automation:autoclean`** (dry-run) · **`npm run automation:autoclean:apply`** — drop local branches already merged into **`P31_AUTOCLEAN_BASE`** (default `main`). Command center: **Git** section. CLI: **`p31 automation autoclean`**.
