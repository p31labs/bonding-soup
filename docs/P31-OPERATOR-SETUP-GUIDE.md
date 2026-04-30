# P31 Operator Setup Guide (personal) — control panel, telemetry, mobile

**Goal:** full ecosystem up and running with a live local control panel, verifiers reachable from one place, telemetry visible, and **human-in-the-loop intervention switches** that prevent accidental runs.

This guide is **commands + URLs**. When in doubt, the contract is **`npm run verify`**.

---

## Operator contract (non‑negotiables)

- **Local control panel is local**: `npm run command-center` binds to `127.0.0.1:3131` unless you explicitly enable LAN mode.
- **Runs are whitelist-only**: the server only executes pre-registered actions (no arbitrary shell).
- **Human in the loop**: the UI starts **locked**; you must arm before any run. (Defense in depth.)
- **No second “source of truth”**: change operator-locked facts in `p31-constants.json`, then run `npm run apply:constants`.
- **Mobile is web-first**: browser access + Add to Home Screen is optional; no forced native install.

---

## 1) Cold start (new machine or clean clone)

From repo root (the folder with `package.json` name `bonding-soup`):

```bash
npm run setup
```

What it does (high level): installs deps, applies constants/style when present, runs the full verify bar.

If you want the CLI on your PATH (recommended for “on the go”):

```bash
npm run p31:link
export PATH="$HOME/.local/bin:$PATH"
p31 --version
```

Reference: `docs/P31-STARTUP-PACKAGE.md`.

---

## 2) Bring up the local operator control panel (the “panel”)

### Desktop (loopback only)

```bash
npm run command-center
```

Open:

- **Control panel (runs + gate):** `http://127.0.0.1:3131/`
- **Operator desk (read-only telemetry):** `http://127.0.0.1:3131/desk`

Shortcuts:

```bash
npm run command-center:open
npm run command-center:open-desk
```

### Phone / tablet on trusted Wi‑Fi (LAN bind)

On the host machine running the repo:

```bash
P31_CMD_CENTER_LAN=1 npm run command-center
```

Then on the phone, open the `http://<LAN-IP>:3131/` URL shown by the command center (“phone:” badge), and optionally **Add to Home Screen**.

Reference: `docs/P31-DEVICE-SETUP-CHROMEBOOK-MOBILE.md` (+ iPhone/Chromebook readiness docs linked there).

---

## 3) Live “test suite from the panel” (what to run daily)

From the control panel, use the Essentials section (or run directly):

### Must-pass local proofs

```bash
npm run verify
```

### Mesh (local + optional live checks depending on flags)

```bash
npm run verify:mesh
```

### Glass (fleet probes; writes report to `/tmp/p31_glass_report.json`)

```bash
npm run ecosystem:glass
```

### CI parity (strict mode when you want to match the build gates)

```bash
MESH_LIVE_STRICT=1 npm run p31:ci:all
```

Notes:
- `npm run p31:all` is heavier (includes e2e/lint/validate paths). Use before a big release, not every morning.

---

## 4) Telemetry you should keep visible (two panes)

Keep these two open:

- **Pane A (runs + gate):** `http://127.0.0.1:3131/`
- **Pane B (read-only desk):** `http://127.0.0.1:3131/desk`

Why: the desk stays calm and readable; the control panel is where you deliberately arm and run.

---

## 5) Intervention switches (operator authority)

These are the practical “switches” that keep you safe:

- **Session lock (UI)**: don’t arm until you’re ready to run an action.
- **LAN bind is explicit**: only enable `P31_CMD_CENTER_LAN=1` on trusted Wi‑Fi.
- **Strict vs relaxed live probes**:
  - Local/offline-friendly: `MESH_LIVE_STRICT=0` (default for some local flows)
  - CI parity: `MESH_LIVE_STRICT=1`
- **Port conflict escape hatch**:

```bash
P31_CMD_CENTER_PORT=0 npm run command-center
```

---

## 6) Mobile client (on-network and off-network)

### On-network (fastest operator loop)

- Run LAN command center (`P31_CMD_CENTER_LAN=1 …`) on the host.
- Use Safari/Chrome on the phone to access the panel and desk.
- Add to Home Screen if you want a “one-tap” tile.

### Off-network (no LAN)

- **Hub surfaces:** use TLS URLs (e.g. `https://p31ca.org`).
- **Local static docs/tools:** `npm run demo` for `http://127.0.0.1:8080/...` on the host (not reachable from phone unless you separately expose that server to LAN).

Reference spine: `docs/P31-DEVICE-SETUP-CHROMEBOOK-MOBILE.md`.

### Terminal access (phone → tmux on the hub)

The phone is a viewport, not the host. Long-running work lives in `tmux` on the Chromebook; the phone reattaches.

- **Stack:** Mosh + tmux + Tailscale. On-network, SSH directly. Off-network, Mosh through Tailscale.
- **Blink Shell (iOS, $19.99/yr)** — for dev sessions that survive sleep. Mosh + Secure Enclave SSH keys + tmux.
- **Termius (free tier sufficient)** — for one-tap snippet execution across hosts.
- **`tmux` layout on the hub** (always running):
  - window 0: `npm run command-center`
  - window 1: `npm run verify --watch` (or ad hoc shell)
  - window 2: `ollama serve` (when fleet is active)
  - window 3: shell
- **Reattach from phone:** `mosh hub`, then `tmux attach`. The session is exactly where you left it.
- **Total cost:** ~$20/yr (Blink) + free Termius. Full mobile sovereignty.

> Aspirational mobile-runtime spec (`p31ctl` zone snippets, readiness-gated certs, etc.) is parked: `docs/PARKING-LOT.md` § Mobile / terminal — revisit when `p31ctl` ships.

---

## 7) Local sovereign AI (Ollama fleet) + safe routing

This repo already ships the canonical **ten-persona local fleet** and three integration lanes.

### Lane A (recommended): MCP bridge (local)

- Setup fleet (pull/build personas):

```bash
npm run ollama:setup
```

- Smoke verify (needs `ollama serve` + weights):

```bash
npm run ollama:verify
```

- Verify MCP bridge wiring:

```bash
npm run verify:ollama-mcp
```

### Lane B (opt-in): tunnel for model picker

- Start tunnel:

```bash
npm run ollama:tunnel
```

Hard rule: **do not route** sensitive personas (notably `p31-counsel`, `p31-triage`, `p31-phos`) through the tunnel lane.

### Lane C: Continue.dev sidebar (local)

Use when prompt contents must not traverse cloud tooling.

Reference: `docs/CWP-P31-OLLAMA-FLEET-2026-04.md` and `.cursor/rules/p31-ollama-fleet.mdc`.

---

## 8) “Pro model access” (cloud) without breaking the posture

Keep the separation clean:

- **Public / non-sensitive drafting + coding**: cloud models are fine.
- **Operator-confidential material**: use **Lane A or C** for local inference.

If you want this encoded as a habit: use the **operator desk** for status, and treat “run actions” as deliberate, local-only operations.

---

## 9) The minimal daily loop (10 minutes)

```bash
git pull --ff-only
npm run verify
npm run ecosystem:glass
P31_CMD_CENTER_LAN=1 npm run command-center
```

Then keep:
- `:3131/desk` open for calm telemetry
- `:3131/` open for deliberate runs

---

## 10) Troubleshooting (fast)

- **3131 won’t start**: `P31_CMD_CENTER_PORT=0 npm run command-center`
- **Phone can’t reach panel**: confirm same Wi‑Fi + `P31_CMD_CENTER_LAN=1` + correct LAN IP
- **Verify fails**: run the failing script directly from the error output; don’t guess
- **Heavy runs on thin hardware**: plug in AC power; reduce parallel load; don’t expect sustained turbo

---

## Appendix A — “Keep / Trash” from the consolidation + WebGL memo (practical extraction)

**Keep (grounded and implementable)**
- **One canvas, one WebGL context** for all dome-adjacent instruments.
- **Persistent atmosphere** + route-driven parameter morphing.
- **Strict z-index + pointer-events discipline** for bottom sheets vs persistent nav.
- **Tabs that don’t spam history** (`replaceState`).

**Trash / rewrite (not safely actionable as-is)**
- Anything that invents new hard numbers without a traceable verifier.
- Anything that requires edge redirects to carry `#hash` fragments (they don’t).
- Any copy or metaphors that increase legal/clinical friction; keep language plain and specific.

