# P31 — Everything Cheat Sheet

> **Operator command cheat sheet · v1**
> Single page, every command. The thing you keep open while you work.
>
> When this disagrees with `npm run verify`, fix this — the gate is canonical.

**Visual version (recommended):** [p31-cheat-sheet.html](../p31-cheat-sheet.html) — load via `npm run demo`, then open <http://127.0.0.1:8080/p31-cheat-sheet.html>.

**Operator self-care gate (always):** Calcium 8.0–9.0 mg/dL critical. Spoon assessment before any P0 push. Hydration. *This is NOT on fire.* The geometry holds whether you push tonight or tomorrow.

---

## §1 · If you remember nothing else — the five commands

When executive function is low, these five still work.

| # | Command | What it does |
|---|---------|--------------|
| 1 | `npm run verify` | The ship bar. ~84 gates. Green = the geometry holds. |
| 2 | `npm run launch -- --full` | 31 steps. Every deliverable + every probe. Rainbow finale on green. ~85s warm. |
| 3 | `npm run command-center` | Local control plane on `:3131`. Every whitelisted action one click. |
| 4 | `p31 doctor` | Health snapshot — remotes, ports, key files. `-- --verify` / `-- --mesh`. |
| 5 | `npm run pr` | Auto-branch, commit, push, `gh pr` with auto-merge. |

---

## §2 · Boot — new machine / new clone

| Tier | Command | Purpose |
|---|---|---|
| read | `npm run startup` | Print the ~54-line startup package. |
| build | `npm run setup` | Root + p31ca install + apply:constants + apply:p31-style + verify. |
| read | `p31 boot` | Splash + boot summary. `P31_CLI_MINIMAL=1` for headless. |
| read | `p31 doctor` | Remotes · git · key files · ports. |
| read | `p31 connect` | CONNECTION spine. |
| ship | `npm run p31:link` | Symlink `p31` → `~/.local/bin`. |
| build | `npm run git:hooks` | Set `core.hooksPath .githooks`. |
| build | `npm run office:install` | Install p31-office + p31-foundry into `Discovery/.venv`. |

---

## §3 · Verify gates — the ship bar

| Tier | Command | Purpose |
|---|---|---|
| read | `npm run verify` | **The ship bar.** ~84 ordered gates. |
| read | `npm run verify:alignment` | Registry coherent — 277 sources, 77 derivations. |
| read | `npm run verify:facts` | Structural invariants. |
| read | `npm run verify:constants` | Larmor, K₄, ³¹P canon. |
| read | `npm run verify:passport` | CogPass mirror byte-match. |
| read | `npm run verify:public-voice` | Identity-first guardrails. |
| read | `npm run verify:public-sanitization` | No kid names / PII on public surfaces. |
| read | `npm run verify:demos` | Two consolidated demo artifacts. |
| read | `npm run verify:pwa` | 4 PWA manifests + 4 surfaces. |
| read | `npm run verify:mesh` | k4-personal Worker dry-run + live edge. |
| read | `npm run verify:fleet-ten` | 10-persona Ollama fleet bundle. |
| read | `npm run verify:simplex` | SIMPLEX v7 + SENTINEL. |
| read | `npm run verify:contract-registry` | 62 JSON + 5 EVM. Fingerprint-cached. |
| ship | `npm run release:check` | Pre-deploy local: verify + p31ca build (when present). |
| ship | `npm run release:public` | verify + strict mesh + hub:ci + security:check. |
| ship | `npm run release:all` | Strict mesh + hub verify + security:check. |
| ship | `npm run p31:all` | Everything: release:all + validate:full + e2e + fleet probe + Semgrep. |
| ship | `npm run validate:full` | Extended shell validation + quantum egg + scorecard. |

---

## §4 · Launch — the rainbow tier (CWP-P31-LAUNCH-2026-05)

**Five doors, one pipeline.** `--full` shits rainbows.

| Tier | Command | Purpose |
|---|---|---|
| read | `npm run launch:status` | Read-only — last sweep + deliverables panel. |
| read | `npm run launch:dry` | Preview — no writes. |
| ship | `npm run launch` | **Standard.** 14 steps → readiness JSON. |
| read | `npm run launch:full:dry` | Preview every step in `--full` mode. |
| ship | `npm run launch:full` | **FULL.** 31 steps + rainbow finale on green. ~85s warm. |
| push | `P31_LAUNCH_PUBLISH=I_UNDERSTAND npm run launch -- --full` | Adds `git push origin main` after assembly. |
| read | `p31 launch --full` | Same via CLI. |

**Five entry points:** npm script · `p31` CLI · VS Code task ("P31: launch — FULL ASSEMBLY (rainbows, ~2-3min)") · command-center button `home-launch-full` · `npm run launch:status`.

The rainbow fires on **assembly completeness**, not probe completeness. Command-center down on this machine ≠ ship not ready.

---

## §5 · Connect / mesh — the spine

| Tier | Command | Purpose |
|---|---|---|
| read | `npm run connection` | CONNECTION spine — deploy canon, runbooks, env, edge. |
| read | `npm run verify:mesh` | k4-personal Worker dry-run + live `/api/health` `/api/mesh`. |
| read | `npm run verify:k4-personal` | k4-personal Worker bundle check. |
| read | `MESH_LIVE_STRICT=1 npm run p31:ci` | Strict mesh parity. |
| read | `p31 budgets` | Mesh + glass SLOs (no network). |
| read | `npm run inventory:cf` | Cloudflare wrangler inventory. |
| read | `npm run ecosystem:plan` | Ordered deploy list (dry). |
| read | `npm run ecosystem:glass` | Live HTTP probes against ecosystem deployables. |
| push | `P31_ECOSYSTEM_DEPLOY=I_UNDERSTAND npm run ecosystem:deploy` | Sequential ecosystem deploy. |

---

## §6 · Command center — local control plane (`:3131`)

| Tier | Command | Purpose |
|---|---|---|
| ship | `npm run command-center` | Foreground server on `:3131`. |
| ship | `npm run command-center:open` | Auto-start + open browser. |
| ship | `npm run command-center:auto` | Ephemeral port if 3131 taken. |
| ship | `npm run command-center:open-desk` | Open `/desk` (read-first). |
| ship | `P31_CMD_CENTER_LAN=1 npm run command-center` | Bind to LAN (phone access). |
| read | `curl -s http://127.0.0.1:3131/api/health` | Health probe. |
| read | `npm run verify:command-center` | 37/37 tests. |

`/desk` is read-only — CONNECTION glass + SIMPLEX poll.
Whitelisted action buttons live at `/`.

---

## §7 · Local services — demo, Ollama, MCP bridge

### Static demo + Cognitive Passport

| Tier | Command | Purpose |
|---|---|---|
| ship | `npm run demo` | Static server on `:8080`. |
| build | `npm run sync:passport` | Regenerate p31ca passport mirror. |
| read | `npm run verify:passport` | Byte-match home → p31ca mirror. |

### Local Ollama fleet — 10 personas (canonical)

| Persona | Base model | Use for |
|---|---|---|
| `p31-mechanic` | qwen2.5-coder:7b | TS / Worker / Pages / D1 |
| `p31-firmware` | qwen2.5-coder:7b | ESP-IDF / Node Zero hardware |
| `p31-counsel` | qwen3:8b | Pro se Georgia drafting |
| `p31-narrator` | qwen3:8b | Grants + research synthesis |
| `p31-triage` | qwen3:8b | Hostile-mail voltage classification |
| `p31-quick` | phi4-mini:latest | Commit messages / one-liners |
| `p31-phos` | qwen3:8b | Children companion |
| `p31-scribe` | qwen3:8b | Accommodation log + WCD synthesis |
| `p31-oracle` | qwen3:8b | Q-factor / trimtab patterns |
| `p31-debrief` | qwen3:8b | Post-incident processing |

| Tier | Command | Purpose |
|---|---|---|
| ship | `ollama serve` | Daemon on `:11434`. |
| read | `curl -s http://127.0.0.1:11434/api/tags` | List loaded models. |
| build | `bash scripts/p31-fleet-ten/setup.sh` | Build / refresh all 10. |
| read | `bash scripts/p31-fleet-ten/verify.sh` | Smoke-test all 10. |
| read | `npm run verify:fleet-ten` | Static gate. |
| ship | `cd scripts/ollama-mcp && npm run start` | MCP bridge — 10 personas as tool calls. |
| read | `npm run ollama:mcp:verify` | Bridge static config check. |
| ship | `bash scripts/ollama-tunnel.sh` | Cloudflared tunnel — model picker. |

**Hard ban:** Never route `p31-counsel`, `p31-triage`, or `p31-phos` through the tunnel — Cursor's verification round-trips prompts through cloud servers, breaking operator-confidential posture.

---

## §8 · `p31` CLI verbs

Install: `npm run p31:link` → `~/.local/bin/p31` on `PATH`. Headless: `P31_CLI_MINIMAL=1`. No color: `NO_COLOR=1`.

| Verb | Purpose |
|---|---|
| `p31` | Splash + boot summary. |
| `p31 boot` | Headless-safe boot summary. |
| `p31 doctor [-- --verify] [-- --mesh]` | Health + remotes + ports. |
| `p31 connect` | CONNECTION spine. |
| `p31 verify` | `npm run verify`. |
| `p31 ci` | `npm run p31:ci`. |
| `p31 cc` | Open command center. |
| `p31 launch [--dry-run\|--status\|--full\|--verbose]` | Backed by `scripts/p31-launch.mjs`. |
| `p31 hub-diff` | p31ca `hub:diff`. |
| `p31 effective-bar` | Which verify steps run / skip / degrade. |
| `p31 voice` | `npm run verify:public-voice`. |
| `p31 delta-lang` | `npm run verify:delta-language`. |
| `p31 mirror-fixer [-- --apply]` | Doc-library hub mirror dry-run / apply. |
| `p31 office-ready` | Office stack readiness. |
| `p31 budgets` | Mesh + glass SLOs. |
| `p31 facts` | `npm run verify:facts`. |
| `p31 chat` | P31 terminal — chat with personas + run whitelisted commands. |
| `p31 triper [cert\|status\|exec\|<suite>]` | MVP cert system. |
| `p31 fun [--many N] [--bowl] [--roll]` | Joy lines. |
| `p31 art` | Decorative ASCII (always exits 0). |
| `p31 open passport [--print-only]` | Open / print URL of cognitive-passport. |
| `p31 open desk` | Open operator desk. |

---

## §9 · Office / foundry — Python tools

One-shot install: `npm run office:install` → `Discovery/.venv`.

| Tier | Command | Purpose |
|---|---|---|
| read | `p31 office-ready` | Discovery readiness. |
| ship | `p31-office discovery assemble` | Assemble supplemental-exhibits packet. |
| read | `p31-office discovery doctor` | Health-check. |
| read | `p31-office zenodo scan` | Scan deposits / metadata. |
| ship | `p31-foundry ingest` | Ingest a document. |
| ship | `p31-foundry manifest` | Generate / refresh manifest. |
| ship | `p31-foundry job create <...>` | Foundry jobs (also `job get`, `job list`). |
| ship | `npm run foundry` | Equivalent of `p31-foundry`. |
| ship | `npm run foundry:worker:dev` | Local Worker dev. |
| read | `npm run foundry:worker:check` | Worker wrangler dry-run. |

Spec: [P31-DOCUMENT-FOUNDRY.md](P31-DOCUMENT-FOUNDRY.md).

---

## §10 · Git / PR

| Tier | Command | Purpose |
|---|---|---|
| read | `npm run git:remotes` | List home + andromeda remotes. |
| push | `npm run pr` | Auto-branch + commit + push + `gh pr` with auto-merge. |
| push | `npm run gh:pr:automerge` | Direct gh PR auto-merge. |
| ship | `npm run git:hooks` | Set `core.hooksPath .githooks`. |
| ship | `npm run git:autopush:on` | Post-commit auto-push. Off: `P31_NO_AUTO_PUSH=1`. |
| ship | `npm run fix:gh` | `gh auth setup-git`. |
| ship | `npm run github:org:plan` | Dry-run org repo automation. |
| push | `npm run github:org:apply -- --yes` | Bootstrap + metadata + profile push. |
| ship | `npm run automation:autoclean` | Clean local feature branches after CI. |

PR flags: `P31_PR_IN_HOME=1`, `P31_PR_IN_ANDROMEDA=1`, `P31_PR_NO_AUTO_BRANCH=1`.

---

## §11 · Build / deploy — beyond `launch`

### Derivation rebuilds

| Tier | Command | Purpose |
|---|---|---|
| build | `npm run apply:constants` | Propagate `p31-constants.json` everywhere. |
| build | `npm run apply:p31-style` | Regenerate hub style + Tailwind extend + cognitive-passport mirror. |
| build | `npm run build:doc-index` | Rebuild searchable doc library + auto-mirror. |
| build | `npm run build:fleet-portal` | Generate `fleet-portal.html`. |
| build | `npm run build:contract-registry` | 62 JSON + SMART suite. Fingerprint-cached. |
| build | `npm run build:smart-evm` | SMART EVM ABI manifest. Bypass: `P31_FORCE_SMART_EVM_BUILD=1`. |
| build | `npm run build:phos-voice` | PHOS voice JSON. |
| build | `npm run build:glass-box` | Glass-box surface + promoted reports. |
| build | `npm run build:demos` | Two consolidated demo artifacts. |
| build | `npm run build:social-cards` | 10-card kit. |
| build | `npm run build:pwa` | Mirror SW + script + icon to all 4 PWAs. |
| build | `npm run sync:all` | Idempotent omnibus. |
| build | `npm run polish` | apply:constants + build:fleet-portal + p31ca public + sync:doc-library:p31ca + release:local. |

### Deploy

| Tier | Command | Purpose |
|---|---|---|
| ship | `npm run release:public` | Pre-deploy gate. |
| push | `CLOUDFLARE_API_TOKEN=… npm run deploy:p31ca` | Wrangler Pages deploy of p31ca dist. |
| push | `cd andromeda/04_SOFTWARE/k4-personal && pnpm deploy` | Personal K₄ Worker deploy. |
| read | `cd andromeda/04_SOFTWARE/k4-personal && pnpm verify` | Wrangler dry-run. |
| read | `npm run inventory:cf` | Cloudflare wrangler inventory. |

---

## §12 · TRIPER — MVP certification

9 suites + combined cross-MVP gate + 70 mutation sentinels. `release:public` requires cert age <24h. Sections: T-ask · R-esilience · I-nterface · P-urity · E-nd-to-end · R-egression.

| Tier | Command | Purpose |
|---|---|---|
| ship | `npm run test:triper:cert` | All suites + combined + sentinels + cert log. |
| read | `npm run triper:status` | Last cert result + age. |
| ship | `npm run test:triper:<suite>` | Per-suite run. |
| read | `npm run test:triper:sentinels` | Mutation sentinels only (70 tests). |
| ship | `p31 triper cert` | Same as above via CLI. |
| read | `p31 triper status` | CLI status. |
| ship | `p31 triper exec` | Full executable suite. |

Architecture: [P31-TRIPER-SYSTEM.md](P31-TRIPER-SYSTEM.md).

---

## §13 · Joy + self-care — the trim tab

| Tier | Command | Purpose |
|---|---|---|
| read | `npm run fun` | One operator-joy line. |
| read | `npm run fun:bowl` | ASCII bowl. |
| read | `npm run fun:shower` | Eight rolled lines. |
| read | `p31 fun --many 5` | Five lines via CLI. |
| read | `p31 art` | Always-safe ASCII art. |
| ship | `npm run operator:shift-in` | Log on-call focus. |
| ship | `npm run operator:shift-out` | Log off. |
| ship | `npm run morning` | Morning orchestrator. |
| read | `npm run morning:quick` | Minimum-viable open. |
| read | `npm run morning:spoons` | Spoon-deficit mode — health-first. |

Joy is a ship-bar feature, not a decoration. Skip with `P31_SKIP_JOY=1` or in CI.

---

## §14 · 911 / e-stop — when something is on fire

**First:** Is this actually on fire? Most P31 issues are not. *"this is NOT on fire"* is on every launch banner for a reason.

| Tier | Command | Purpose |
|---|---|---|
| stop | `pkill -f "scripts/command-center/server"` | Kill all command-center servers. |
| stop | `pkill -f "ollama-mcp/server.mjs"` | Kill the MCP bridge. |
| stop | `pkill ollama` | Kill local Ollama daemon. |
| stop | `lsof -ti:3131 \| xargs -r kill` | Kill whoever holds port 3131. |
| stop | `lsof -ti:8080 \| xargs -r kill` | Kill whoever holds port 8080. |
| read | `git status && git stash list` | What's uncommitted? Stashed? |
| read | `git reflog \| head -20` | Recover lost commits. |
| stop | `git reset --hard HEAD@{1}` | Undo last reset / rebase / merge. **Destructive.** |
| read | `npm run doctor` | What's actually broken. |
| read | `tail -50 ~/.p31/launch-log.jsonl` | Recent launch results. |

**Operator 911 (medical):** Hypoparathyroidism — Ca limits 8.0–9.0 mg/dL critical. Calcium first. Hydration. Symptoms before code. Always.

---

## §15 · Canonical numbers — verified, not memorized

Every number on this page is in `p31-constants.json`. When in doubt: `node -e 'console.log(require("./p31-constants.json"))'`. Don't quote from session memory.

| Domain | Value | Note |
|---|---|---|
| P31 ³¹P Larmor (1.0 T) | 17.235 MHz | `p31-constants.json`. |
| K₄ family vertices | will · S.J. · W.J. · christyn | Cage. Kids: initials only on public surfaces. |
| K₄ personal pillars | a · b · c · d | Isolated personal scope. |
| BONDING window | 424 / 32 | Operator canon. |
| Operator Ca critical | 8.0 – 9.0 mg/dL | ICD-10 E20.9 (hypoparathyroidism). |
| P31 Labs EIN | 42-1888158 | GA nonprofit, 501(c)(3) pending. |
| Mesh budget | k4 = 20000 ms · glass = 15000 ms | `verify:facts`. |
| Worker CPU limit | 10 ms · 1000 internal subrequests | Cloudflare Workers constraint. |
| Verify gates | ~84 | `verify:wiring-ci-ladder`. |
| Alignment registry | 277 sources · 77 derivations | `verify:alignment`. |
| Workers (verified / allowlisted) | 14 / 18 | `p31-live-fleet.json` + `p31ca/security/worker-allowlist.json`. |
| Local Ollama personas | 10 | `scripts/p31-fleet-ten/models.json`. |
| Smart contract registry | 62 JSON + 5 EVM | `contracts/p31-contract-registry.json`. |
| Doc library | ~280 documents | `docs/doc-library/index.json`. |
| Creator-economy fee | 0% | `p31ca/ground-truth/creator-economy.json` v1.0.0. |

**Session-memory drift is real.** See [SESSION-MEMORY-FAILURE-MODE-2026-05-02.md](operator/SESSION-MEMORY-FAILURE-MODE-2026-05-02.md). When you (or any AI) cite a number from chat without checking the file, you will be wrong in specific verifiable ways. Verify before you cite.

---

P31 Labs, Inc. · EIN 42-1888158 · GA · 501(c)(3) pending.
The phosphorus is for all of us. The cage holds. The geometry holds. 💜🔺🌈
