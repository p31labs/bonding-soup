# GitHub org bundle (`p31labs`)

Machine + human source for **org profile** (`REPOS.md`, `profile-repository-map.md`) and **`repos-metadata.json`** (GitHub About + topics via `gh`).

## Commands (from bonding-soup root)

| Script | Purpose |
|--------|---------|
| `npm run github:org:verify` | Validate `repos-metadata.json` (optional strict `REPOS.md` — set `P31_GITHUB_ORG_STRICT_REPOS_MD=1`). |
| `npm run github:org:check` | Same as CI: strict `REPOS.md` cross-check + JSON rules. |
| `npm run github:org:bootstrap` | Clone `p31labs/.github` → `.p31-work/dotgithub-sync` if missing (for sync/publish). |
| `npm run github:org:plan` | `check` + bootstrap + `metadata --dry-run` + `sync --dry-run` (no writes). |
| `npm run github:org:apply -- --yes` | `check` + bootstrap + full publish (metadata + `sync --push`). Or `P31_GITHUB_ORG_APPLY=1`. |
| `npm run p31 -- github-org check` | CLI alias for `github:org:check` / `plan` / `apply` / `bootstrap`. |
| `npm run github:org:metadata` | Apply descriptions/topics (`gh api`). Runs verify first (unless `P31_SKIP_GITHUB_ORG_VERIFY=1`). |
| `npm run github:org:sync -- --push` | Copy bundle into clone of `p31labs/.github`, commit, optional push. Default repo dir: `.p31-work/dotgithub-sync` if present. |
| `npm run github:org:publish` / `github:org:ship` | Verify → metadata → sync (`all`) — use when clone already exists; prefer `github:org:apply` for one-shot. |

## Social ops · valve · fleet hooks

- **Valve** (`~/.p31/github-org-valve.json` or `P31_GITHUB_ORG_VALVE_MODE`): **`closed`** | **`dry-run`** | **`apply`**. Default **closed**. **`github:org:apply`** runs only when valve is **apply** or **`P31_GITHUB_ORG_VALVE_BYPASS=1`** (break-glass).
- **Event log** (`~/.p31/p31-events.jsonl`): append-only **`p31.socialEvent/1.0.0`** lines for check/plan/apply/auto — operator desk **`GET /api/github-org-status`** shows valve + tail (same host as command center).
- **Auto** (`npm run github:org:auto`): cron/git-hook shaped; **never** applies live metadata — **`closed`** skips; **`dry-run`** / **`apply`** runs **`github-org:plan`** only.

## Environment

| Variable | Meaning |
|----------|---------|
| `P31_GITHUB_ORG_REPO` | Path to clone of `p31labs/.github` (overrides default `.p31-work/dotgithub-sync`). |
| `P31_GITHUB_ORG_PUSH=1` or `--push` | Push after sync commit. |
| `P31_ORG_DOTGITHUB` | Override org/repo slug for error hints (default in `p31-github.json` → `orgDotGithubRepository`). |
| `P31_SKIP_GITHUB_ORG_VERIFY=1` | Skip JSON validation in automation (not recommended). |
| `P31_GITHUB_ORG_STRICT_REPOS_MD=1` | Require every non-skipped repo in `repos-metadata.json` to appear as `org/name` in `REPOS.md` (CI enables this). |
| `P31_GITHUB_ORG_VALVE_MODE` | Override valve without editing file: `closed` \| `dry-run` \| `apply`. |
| `P31_GITHUB_ORG_VALVE_BYPASS=1` | Allow **`github:org:apply`** when valve is not `apply` (operator-only break-glass). |

## GitHub Actions (bonding-soup)

Workflow **`.github/workflows/p31-github-org.yml`**:

- **PR / push** (paths above): job **verify** with strict `REPOS.md` check.
- **Schedule** (weekly): same verify.
- **workflow_dispatch**: optional **apply** — set booleans and add repo secret **`P31_ORG_METADATA_TOKEN`** (PAT with rights to PATCH org repos and push `p31labs/.github` if sync enabled).

Fine-grained PATs need per-repo permissions; a **classic PAT** with `repo` for the repos you touch is simpler for small orgs.

## Skipped repos

`repos-metadata.json` entries with `"skip": true` (e.g. archived `p31ca.org`) are not sent to the API.
