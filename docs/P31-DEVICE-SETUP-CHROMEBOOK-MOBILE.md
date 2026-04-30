# P31 — device setup: Chromebook (Acer Spin 7xx) + mobile

**Schema:** operator runbook · hub appearance · local-first  
**Interactive (same content, P31 tokens):** `p31-device-setup.html` (open with `npm run demo`)  
**Companion:** `docs/SOUP-LOCAL-DEMO.md` (static server path + port) · `docs/SOUP-PERF-BUDGET.md` (frame budget)  
**Ethical surface:** `docs/ETHICAL-STYLE-MAP.md` (browser-first mesh; no forced native install)

---

## 1. What this is

A **single spine** for:

- **Acer Chromebook Spin 7xx** (or similar): Chrome OS + **Linux (Crostini / `penguin`)** for Node, git, and this repo.
- **Phone** (iOS or Android): **TLS live hub** + optional **LAN command center** to the Chromebook on trusted Wi‑Fi.

**Rule:** Ship bar and machine checks win over any doc — `npm run verify` is the contract.

---

## 2. Principles (P31)

| Principle | In practice |
|------------|-------------|
| **Clarity** | One clone path, one demo URL pattern, one command center port (**3131**). |
| **Autonomy** | Mobile mesh and hub access through the **web**; add-to-home is optional, not mandatory. |
| **Proportion** | Long builds (`verify`, `pnpm install`) = **AC power** + ventilation; do not expect fanless sustained turbo. |
| **Access** | Respect **system reduced motion**; static pages use canon tokens and readable type (Atkinson / JetBrains in hub surfaces). |

---

## 3. Full setup checklist (order matters)

1. **Chrome OS** — current stable channel, reboot after major updates.
2. **Backups** — Google account sync for what you care about; know that **Linux** has a **separate** disk area (Crostini).
3. **Enable Linux** — Settings → **Developers** → **Linux development environment** → install; give **enough disk** (resize if offered; `node_modules` + Andromeda is not tiny).
4. **Linux apps** — `git`, `curl` (usually present). **Node 20+** (see **`.nvmrc`** in repo): `nvm` in Linux home or NodeSource — match what `AGENTS.md` expects.
5. **Clone** — P31 home (e.g. `bonding-soup`) into a path under the **Linux** home, e.g. `~/p31` or `~/dev/p31`. **Andromeda** is a second clone **beside** it (`~/p31/andromeda`) if you need the monorepo; see `P31-ROOT-MAP.md` and `npm run git:remotes`.
6. **One-shot align** — from repo root: `npm run setup` (install, `soup:prep`, `apply:constants`, `apply:p31-style` when design tokens exist, `verify` when Andromeda present).
7. **Daily driver** (optional) — `npm run morning` if you use the scripted pull + converge + command-center pattern.
8. **Bookmarks (Chrome)**  
   - Local: `http://127.0.0.1:8080/soup.html` (after `npm run demo`)  
   - Hub: `https://p31ca.org`  
   - BONDING: `https://bonding.p31ca.org/soup`  
   - This runbook: `http://127.0.0.1:8080/p31-device-setup.html` when demo is up.

---

## 4. Acer Spin 7xx — hardware notes (generic)

- **2-in-1:** Tablet mode is ideal for **reading** `docs/` and the doc library; **clamshell** + external power for **builds**.
- **Stylus (USI):** Optional by SKU; not required for P31 dev.
- **i/o:** Prefer **AC** during `npm run verify`, `pnpm install`, or `p31:all` — thermals and time limits are real on thin convertibles.
- **Display:** 1080p or 1440p — for Soup perf, see **`docs/SOUP-PERF-BUDGET.md`**; measure on device, not only DevTools throttle.

---

## 5. Linux (`penguin`) — repo and commands

- **Path discipline:** `cd` to the directory that contains **`soup.html`** and **`package.json`** before `npm run …`.  
- **From anywhere:** `npm run demo --prefix /path/to/p31` (see **`docs/SOUP-LOCAL-DEMO.md`**).  
- **Port 8080 busy:** `P31_DEMO_PORT=8090 npm run demo` (or any free high port).  
- **Crostini time / DNS** — if `git` or `npm` is flaky, check **Chrome OS and Linux** help; time skew breaks TLS.

### 5a. Ollama (local fleet) on Crostini

The **Spin-class** Chromebook runs Ollama inside **Linux (`penguin`)**, not on Chrome OS itself.

| Expectation | Why |
|-------------|-----|
| **AC power** for pulls and first model downloads | Large weights + thermal headroom; same discipline as `npm run verify`. |
| **CPU inference by default** | Many units **do not** expose a GPU Ollama can use from Crostini — logs may show no NVIDIA/AMD GPU; that is normal. Sub‑1B–3B models are usable; larger models get slow or impractical. Premium tiers (e.g. Snapdragon X / Core Ultra with documented NPU/Ollama paths) can improve this; do not assume without checking `ollama ps` / docs for **your** SKU. |
| **Canonical P31 fleet** | Ten personas from repo: **`npm run ollama:setup`**, smoke **`npm run ollama:verify`** (needs `ollama serve` + weights), MCP **`npm run verify:ollama-mcp`**. Full operator layout (tmux window + lanes): **`docs/P31-OPERATOR-SETUP-GUIDE.md`** § Local sovereign AI. |
| **Phone stays thin** | Long-running **`ollama serve`** and agent sessions belong on the **Chromebook** (or another host), with the phone as viewport via Mosh/tmux per operator guide — not as the inference server. |

---

## 6. Mobile phone (same operator, not a second source of truth)

| Goal | How |
|------|-----|
| **Read hub / connect surfaces** | Browser: `https://p31ca.org` (TLS). |
| **C.A.R.S. (deployed)** | `https://bonding.p31ca.org/soup` — PWA install optional (`p31-bonding.webmanifest` pattern on local pages). |
| **Tap operator actions against the Chromebook (LAN only)** | On the **Spin**, run `P31_CMD_CENTER_LAN=1 npm run command-center` (default **3131**). On the phone, open `http://<CHROMEBOOK_LAN_IP>:3131` — the UI shows a **phone:** URL. **Trusted network only**; no port exposure beyond LAN. iOS: Safari → **Add to Home Screen** for a home-screen tile (see `docs/MOBILE-OPS-PHASE2.md`). |

**Get LAN IP (Linux on Chromebook):** e.g. `hostname -I | awk '{print $1}'` (pick the Wi‑Fi address).

---

## 7. Security and secrets

- **No API tokens in git** — Cloudflare, GitHub, etc. via env or host tooling (`wrangler login`, `gh auth`, see `P31-ENGINEERING-STANDARD.md`).
- **LAN command center** — only on **home or trusted** Wi‑Fi; not a public bind.

---

## 8. Troubleshooting (short)

| Symptom | Check |
|--------|--------|
| `cd ... No such file` | You used a **placeholder** path — use real `~/...` where the clone lives. |
| `Address already in use` (8080) | `P31_DEMO_PORT=8090 npm run demo` or free the process on 8080 (`ss` / `fuser`). |
| `verify` OOM or killed | More Linux disk; close other apps; run heavy steps on AC power; `MESH_LIVE_STRICT=0` for offline pass per `AGENTS.md`. |
| Phone cannot open `:3131` | Same Wi‑Fi, firewall, correct LAN IP, `P31_CMD_CENTER_LAN=1` on the Chromebook. |

---

## 9. Further reading

- `AGENTS.md` — ship bar, command center, CI.  
- `docs/P31-STARTUP-PACKAGE.md` — 60-second path, vocabulary.  
- `docs/P31-CHROMEBOOK-COMMAND-READINESS.md` — **command center only** on Chrome OS (PWA, LAN).  
- `docs/P31-IPHONE-COMMAND-READINESS.md` — **command center only** from iPhone (LAN, Home Screen).  
- `docs/MOBILE-OPS-PHASE2.md` — iPhone + command center (wider mobile-ops).  
- `docs/ECOSYSTEM-PRODUCTION-11.md` — full-fleet context.  
- `docs/P31-PHONE-DATACENTER-SURVEY-ALIGNMENT.md` — maps external “phone + edge + mesh” surveys to **this repo’s** canonical paths (no third-party pricing/OS truth in-tree).

---

**Version:** 1.0.1 — 2026-04-30 (§5a Ollama on Crostini)
