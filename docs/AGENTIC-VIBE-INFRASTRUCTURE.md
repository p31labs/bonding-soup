# Agentic + “vibe” development — P31 map (no fluff)

**Status:** **Normative** for *how this workspace ties NL-driven dev to ship bars*. **Not** a vendor white paper. Tool names are **examples**; pricing, quotas, and model IDs change—read the vendor.

---

## 1. Definitions (operational)

| Term | Meaning here |
|------|----------------|
| **Vibe / NL-first** | You steer with intent and diffs; the model drafts code. You still own architecture and **proof** (tests, `verify`, review). |
| **Agentic** | Multi-step tool use (terminal, PRs, MCP)—**bounded** by repo rules, CI, and human merge. |
| **Ground truth** | `p31-constants.json` (operator-locked numbers), `andromeda/04_SOFTWARE/p31ca/ground-truth/p31.ground-truth.json` where applicable, **`npm run verify`** / **`release:check`** — not prose in chat. |

**Embedded / hardware:** LLMs are weak on vendor silicon quirks. **Vibe** there still requires **hardware-in-the-loop** tests, pinned IDF, and a **small** human review for anything safety-related. This file does **not** spec firmware (see CWP / WCDs under the hardware package when they exist).

---

## 2. What this repo already enforces (implement this)

| Gate | Where |
|------|--------|
| **Ship bar** | `docs/P31-ENGINEERING-STANDARD.md` — at minimum **`npm run verify`**, often **`release:check`**, secrets hygiene |
| **BONDING test baseline** | `p31-constants.json` → `testBaseline` (**424** tests / **32** suites as of current lock) — do not drift; see `docs/CANONICAL-NUMBERING.md` |
| **Multi-root** | `P31-ROOT-MAP.md` + `AGENTS.md` — which tree to edit (Soup vs Andromeda vs `phosphorus31.org/`) |
| **Agent rules** | `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `.cursor/rules/*.mdc` — **shorter rules win**; use globs + `alwaysApply` so context matches the file you touch |
| **Edge / hub contract** | p31ca `ground-truth` + `verify:ground-truth` — redirects, registry invariants, pins |

**Do not** publish **credential archaeology** (e.g. “key X was in commit history”) in public docs. **Rotate** exposed secrets; fix history in private playbooks if needed.

---

## 3. Topology metaphor (Wye → Delta)

Use **`docs/SIC-POVM-K4-ARCHITECTURE.md`** and **`docs/EGG-HUNT.md`** for the K₄ / decentralization *story* aligned with code. There is **no** requirement that a file live at a particular Astro/Starlight path—**search the repo** for Wye/Delta/GEODESIC copy when you add marketing pages.

---

## 4. Remote / mobile “command center” (optional pattern)

| Layer | Pattern |
|-------|---------|
| **Transport** | WireGuard-class overlay (e.g. Tailscale) or plain SSH with keys—**your** threat model |
| **Fragile links** | Mosh and/or `tmux` on the **server** so sessions survive client sleep |
| **Work** | SSH into a **real dev host**; static analysis and tests run **there** or in CI—not on the phone’s sandbox |

**No** device is canonical (no “iPhone 11” requirement). Treat mobile as a **thin client** to a proper repo + toolchain.

---

## 5. Tooling (categories, not endorsements)

| Category | Role |
|----------|------|
| **IDE-integrated** (e.g. Cursor-class) | Fast localized edits, visual diffs, rules in workspace |
| **Terminal agents** (e.g. Claude Code-class) | Repo-wide refactors, scripted checks—still subject to the same `verify` + PR review |
| **Git host automation** | Actions on `push`/`pull_request`—**path filters** to avoid useless builds; required checks in branch protection where configured |
| **MCP** | Standard way to attach tools (filesystem, HTTP, **Wrangler**-backed cloud ops) to an agent host—**enable only** servers you trust; scope tokens |

**Pricing / tier tables** do not belong in this repo as fact—link vendor docs or keep numbers in private runbooks.

---

## 6. What we intentionally omit here

- Invented file paths, artifact counts, or “paper bundle” stats not backed by a **committed manifest** in-tree  
- **Samson / PID / “Mark 1 attractor”** / custom mesh stacks—unless a **WCD** lands them in a real package with tests  
- **NEO4J_*,** SoftAP PSKs, or any **real** network identifiers  
- “Medical-grade” claims—this workspace includes **wellness** and **passport** UX; **regulatory** text needs counsel

---

## 7. See also

| Doc | Use |
|-----|-----|
| `docs/PLAN-KIDS-VIBE-CODING.md` | **Household** kid/teen local-first vibe path |
| `docs/SIC-POVM-K4-ARCHITECTURE.md` | Four-vector (physical / net / compliance / UX) without essay length |
| `P31-ROOT-MAP.md` | Where to work |
| `docs/P31-ENGINEERING-STANDARD.md` | Definition of done |
