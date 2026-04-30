# Phone-as-datacenter survey ↔ P31 codebase alignment

**Purpose:** Map an external “phone + Cloudflare + mesh” stack survey (e.g. 2026 mobile-first / edge narrative) to **what this repository actually documents and ships**. This file does **not** verify third-party pricing, carrier rankings, or OS/browser version claims — those remain **external** unless cited to a primary source.

---

## Strong alignment (already canonical here)

| Survey theme | P31 ground truth |
|--------------|------------------|
| Phone as **viewport**, heavy work on a **Chromebook / tmux host** | `docs/P31-OPERATOR-SETUP-GUIDE.md` § Mobile client + Terminal access; `docs/P31-DEVICE-SETUP-CHROMEBOOK-MOBILE.md` |
| **Mosh + tmux + Tailscale** for resilient operator access | Operator setup guide; archived deep-dive `docs/_archive/mobile/2026-04-30-termius-blink-architecture.md` |
| **iPhone → LAN or Tailscale → command center** (3131) | `docs/P31-IPHONE-COMMAND-READINESS.md`, `docs/P31-CHROMEBOOK-COMMAND-READINESS.md`, `AGENTS.md` (command center) |
| **Edge-first backend** (Workers, KV, DO, static hub) | `docs/MESH-ARCHITECTURE-CANON.md`, K₄ Workers, `p31ca` Pages; workspace rules: **10 ms CPU** / subrequest caps on Workers (normative constraint in `.cursorrules` / `CLAUDE.md`) |
| **Passkeys / WebAuthn** as phone-backed auth pattern | `andromeda/04_SOFTWARE/p31ca/workers/passkey/`, hub static surfaces; mesh start / passport docs |
| **Browser-first / ethical** surfaces (PWA optional, not mandatory) | `docs/ETHICAL-STYLE-MAP.md`, `docs/P31-DEVICE-SETUP-CHROMEBOOK-MOBILE.md` principles |
| **Local Ollama fleet** (personas, MCP, lanes) | `.cursor/rules/p31-ollama-fleet.mdc`, `docs/P31-OPERATOR-SETUP-GUIDE.md` § Local sovereign AI |
| **Reduced motion / accessibility** as first-class | Design canon, `prefers-reduced-motion` in multiple static surfaces (e.g. GEODESIC, command center styling) |

---

## Partial alignment (same direction, different scope)

| Survey theme | P31 note |
|--------------|----------|
| **PWA** as full app shell on iOS | Hub and bonding patterns support add-to-home and manifests; **authoritative state** for mesh remains **edge + DO/KV**, consistent with “thin client” framing. |
| **WebGPU** / in-browser 1–3B models | Repo ships **WebGL**-heavy experiences (Soup, GEODESIC, starfield); **not** the same as “MediaPipe LLM in tab” — local LLM path here is **Ollama + fleet**, not browser weights. |
| **D1 / R2 / Queues / AI Gateway** as full SaaS spine | **Shipped:** Workers, DO (e.g. geodesic-room, passkey), KV, Pages, ecosystem allowlists. **Not exhaustively documented** in home `docs/` as a single “CF catalog” — see `p31ca` security/runbooks and per-package READMEs. |
| **Chromebook Ollama** (Crostini, CPU vs NPU) | Device doc covers **Linux + Node + verify**; **not** a hardware matrix for Gemma/Qwen tiers — operator guide points at `ollama serve` in tmux layout. |

---

## Survey claims this repo does **not** certify

- Specific **iOS / Safari version numbers**, EU push rules, Cache API megabyte caps, or **WebKit policy** timelines.
- **Tailscale** pricing / plan changes (e.g. 2026 date-bound bullets).
- **US MVNO** rankings, dollar amounts, or “minimum viable cellular” — operator economics are **out of repo scope**.
- **Cloudflare Workers AI** model catalog, **D1** dollar pricing, **free-tier** numeric limits beyond what Wrangler / dashboard enforces for *this* org’s deployed workers.
- **FIPS / PCI** HSM requirements vs passkeys — legal/compliance posture is **not** asserted here.

Treat those as **reference material** for architecture talks, not as P31 engineering requirements.

---

## Load-bearing walls (survey + P31 agree in spirit)

1. **Authoritative state on the edge** — mesh canon and hub design assume the **phone is not the system of record** for cage/personal scope.
2. **CPU and consistency boundaries** — heavy transforms belong in **batch / local / paid tier**, not in a free-tier Worker hot path; **DO/KV semantics** match “strong vs eventual” split described in generic CF literature.
3. **iOS as constrained web host** — P31 iPhone docs assume **Safari**, Home Screen, LAN/Tailscale; they do **not** promise background agents or peripheral APIs on iOS PWAs.

---

## Where to extend P31 docs (optional backlog)

- **Done:** **Ollama on Crostini** — `docs/P31-DEVICE-SETUP-CHROMEBOOK-MOBILE.md` § 5a. **CF map** — `docs/P31-DEPLOY-CANON.md` § Cloudflare primitives → monorepo paths.

---

**Version:** 1.0.0 — alignment note only; revise when repo topology or CF bindings change materially.
