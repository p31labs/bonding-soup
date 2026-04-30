# Termius & Blink — mobile terminal architecture (archived)

**Status:** archived 2026-04-30. Triage record below. Salvaged content lives in `docs/P31-OPERATOR-SETUP-GUIDE.md` § Mobile. Parked items live in `docs/PARKING-LOT.md`.

> ⚠️ This document specifies software that **does not exist**. Read the triage section first; treat the body as raw material, not canon.

---

## Triage record (2026-04-30)

### Salvaged (kept, with destination)

| Item | Why kept | Destination |
|---|---|---|
| Mosh + tmux + Tailscale = mobile stack | Real, proven, matches operator's Tailscale mesh | `docs/P31-OPERATOR-SETUP-GUIDE.md` § Mobile / Terminal |
| Blink for dev, Termius for ops (dual posture) | Correct tool selection based on actual capabilities | Same |
| tmux session layout (4 windows: command-center, verify --watch, ollama serve, shell) | Actionable today on the Chromebook | Same |
| iOS background-kill → Mosh+tmux solution (phone is a viewport, not the host) | Real iOS constraint, real solution | Same |
| ~$20/yr total cost (Blink $19.99 + Termius free) | Matches the budget target | Same |

### Rejected (with reason)

| Item | Why rejected |
|---|---|
| All `p31ctl` commands (mesh scan, amber simulate, health posture, sov bank, …) | Software does not exist |
| Termius "snippet packages by zone" (Physics / Poets / FindYourself / Sovereignty) | Zones don't exist in this form; commands they invoke don't exist |
| Termius REST API host auto-registration via Python provisioning module | No P31 provisioning system exists |
| Readiness-gated SSH certificates via SIC-POVM entropy threshold | Quantum-coherence-gated auth is metaphor, not engineering pattern (see `docs/PARKING-LOT.md`) |
| iOS Shortcuts → `xcall` Blink → posture-check Shortcut | Health monitoring system doesn't exist |
| Style Token verification snippet, Go Binder, Rego policies, gRPC API | None of these are in the repo |
| "Japanese dev community validation" anecdote | Validates a generic pattern, not anything P31-specific |
| Section 4 (Integration with the P31 Mobile Runtime) in its entirety | Integrates with systems that don't exist |

### The three-sentence reduction

If the entire document had to be reduced to three sentences:

1. Mosh + tmux + Tailscale: the phone is a viewport, not the host.
2. Blink for dev sessions that survive sleep. Termius for one-tap ops snippets.
3. ~$20/year for full mobile sovereignty.

Everything else was scaffold.

---

## Original document (raw — do not edit)

# Termius & Blink: Mobile Terminal Operations for the P31 Ecosystem

## Strategic Overview

Both Termius and Blink are best-in-class iOS SSH clients, but they serve **fundamentally different operational philosophies** within the P31 mobile-only architecture. Rather than an either/or decision, P31 Mobile adopts a **dual-terminal posture**: Termius for the practitioner tier and Blink for the developer tier, with a shared backend of Mosh + tmux + Tailscale that both can leverage.

---

## 1. Comparative Deep-Dive

### 1.1 Termius — The P31 Practitioner's Terminal

**Pricing (2026):** Free Starter plan; Pro at ~$10/month or ~$96/year.

**Core capabilities relevant to P31:**

| Capability | P31 Mapping |
|---|---|
| **Snippets** — Saved shell scripts executable across multiple hosts simultaneously | P31 "Snippet Packages" organized by zone: Physics Zone snippets (sensor ingest, systemctl), Poets Zone snippets (creative deploy, style‑token batch), Find Yourself Zone snippets (health‑check, readiness poll) |
| **AI‑powered autocomplete** — Natural language → bash command | Directly mirrors the Composer 2 meta‑agent's intent‑to‑command translation layer. A user describing "check my cognitive readiness score" gets the bash one‑liner to poll the Go Binder's `/readyz` endpoint. |
| **REST API** (`api.termius.com/v1/hosts`) | Enables **programmatic host lifecycle management**. When P31 provisions a new Cursor cloud agent or spins up a remote inference node, the Go Binder calls the Termius API to register the host, inject the SSH key, and tag it with the appropriate zone and privacy tier. |
| **ML‑DSA key generation** (post‑quantum, v7.3.3) | Future‑proofs the P31 cryptographic layer. |
| **CLI coding agent integration** (Gemini, Claude Code, OpenCode) | Termius detects when a host is configured for an AI coding agent and launches it automatically on connection. |
| **E2E encrypted Cloud Vault sync** | Host configurations, keys, and Snippets stay synchronized across devices. |

**P31‑specific Snippet hierarchy:**

```
Vault: P31_Personal
├── Package: Physics_Zone
│   ├── readiness_poll       → curl -s localhost:9090/readyz
│   ├── entropy_report       → curl -s localhost:9090/metrics | grep entropy
│   ├── mesh_scan            → p31ctl mesh scan --json
│   └── amber_mode_trigger   → p31ctl amber --simulate
├── Package: Poets_Zone
│   ├── style_token_verify   → p31ctl token verify --input $1
│   ├── creative_deploy      → scp output/*.mid user@printer:/queue/
│   └── postcrow_publish     → p31ctl postcrow --zone poets --file $1
├── Package: FindYourself_Zone
│   ├── posture_check        → p31ctl health posture --json
│   ├── yoga_trigger         → p31ctl health yoga --protocol shoulder-release
│   └── hrv_log              → p31ctl health hrv --window 5m
└── Package: Sovereignty
    ├── bank_balance         → p31ctl sov bank --summary
    ├── legal_review         → p31ctl sov legal --contract $1
    ├── tax_proof_generate   → p31ctl sov tax --year 2026 --format zkp
    └── mesh_token_swap      → p31ctl sov mesh --swap
```

### 1.2 Blink Shell — The P31 Developer's Terminal

**Pricing (2026):** $19.99/year for Blink Shell; Blink Build add‑on at $7.99/month.

**Core capabilities relevant to P31:**

| Capability | P31 Mapping |
|---|---|
| **Mosh (Mobile Shell)** — UDP‑based, survives IP changes, device reboots | The **unbreakable tether** to the P31 Binder. |
| **Mosh + Tailscale integration** | Every P31 node reachable via a single `mosh hostname` through Tailscale. |
| **tmux native integration** | Canonical workflow: `Blink → Mosh → tmux session → Claude Code / Openclaw agent`. |
| **`xcall` command** — x‑callback‑URL automation | Glue between iOS Shortcuts and the P31 CLI. |
| **Blink Code** — VS Code integration | Edit Go Binder source from the phone. |
| **Secure Enclave Keys** | Root of the P31 biometric‑bound key hierarchy. |
| **Files.app integration for SFTP** | Remote P31 hosts appear as folders in the iOS Files app. |

**The canonical P31‑Blink stack:**

```
iPhone (Blink Shell)
    │  Mosh (UDP, survives everything)
    ▼
Tailscale VPN (mesh overlay)
    │
    ▼
P31 Home Hub (tmux session)
    ├── window 0: p31-binder (journalctl -f)
    ├── window 1: composer2 orchestrate --interactive
    ├── window 2: ollama run llama3:70b
    ├── window 3: p31ctl mesh monitor
    └── window 4: claude-code --project p31/
```

### 1.3 Head‑to‑Head Comparison Matrix

| Dimension | Termius | Blink Shell | P31 Recommendation |
|---|---|---|---|
| iOS platform | universal | iOS/iPadOS only | Both |
| Android | yes | no | Termius for cross‑platform |
| Connection resilience | Mosh support | Mosh first‑class, survives reboot | Blink for persistence |
| Multi‑host execution | Snippets on multiple hosts | manual per‑session | Termius for ops |
| Programmatic API | REST API | xcall only | Termius |
| AI integration | autocomplete + agent detection | relies on remote tools | Termius for AI ops |
| Code editing | none | Blink Code (VS Code) | Blink for development |
| Secure Enclave keys | no | hardware‑bound | Blink for root key material |
| Team collaboration | shared vaults | individual | Termius for co‑ops |
| Pricing | Free / $10 mo Pro | $19.99 yr / +$7.99 mo Build | Blink for solo dev |
| Cross‑platform | macOS, Windows, Linux, iOS, Android | iOS only | Termius for multi‑device |

---

## 2. P31 Mobile Terminal Architecture

### 2.1 Dual‑Terminal Posture

The P31 Mobile Runtime is **terminal‑agnostic** — it exposes a gRPC/REST API and CLI (`p31ctl`) that any SSH client can invoke.

- **Practitioner tasks** → **Termius**
- **Developer tasks** → **Blink**

Both connect to the same backend: `Tailscale VPN → P31 Home Hub → tmux → p31ctl`.

### 2.2 The Persistent Background Connection Problem

iOS kills background network connections after ~20 seconds unless the app uses a special entitlement.

**Solution stack:**
1. **Blink + Mosh** — gold standard. UDP + SSP survives IP change.
2. **Termius** — also supports Mosh, recently improved background persistence.
3. **NaviTerm** — third-party with location-services workaround.
4. **Definitive pattern:** run long-lived process in `tmux` on the remote server; phone client can disconnect entirely; `tmux attach` restores the session.

### 2.3 Integration with the P31 Mobile Runtime

```
┌──────────────────────────────────────────────────┐
│                  iPhone Home Screen                │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │  P31 PWA │  │ Termius  │  │  Blink Shell     │ │
│  │ (UI)     │  │ (Ops)    │  │  (Dev + Mosh)    │ │
│  └────┬─────┘  └────┬─────┘  └────────┬─────────┘ │
│       │             │                  │           │
│       │    WebSocket│    SSH/Mosh      │ Mosh      │
│       ▼             ▼                  ▼           │
│  ┌──────────────────────────────────────────────┐ │
│  │        Tailscale VPN (tailnet overlay)        │ │
│  └─────────────────────┬────────────────────────┘ │
└────────────────────────┼───────────────────────────┘
                         │
            ┌────────────┼────────────┐
            ▼            ▼            ▼
     ┌──────────┐ ┌──────────┐ ┌──────────┐
     │ P31 Home │ │ Cloud    │ │ Neighbor │
     │ Hub      │ │ Cursor   │ │ Mesh GW  │
     │ (tmux)   │ │ (Lambda) │ │ (P31)    │
     └──────────┘ └──────────┘ └──────────┘
```

### 2.4 Snippet‑Driven Workflows

Termius Snippets become the automation backbone. Examples:

```bash
# amber_drill — run on all mesh nodes
p31ctl amber --simulate
p31ctl mesh health --report
p31ctl health posture --broadcast

# creative_session_start
composer2 orchestrate --zone poets --duration 45m &
p31ctl music ambient --mode flow &
p31ctl health yoga --trigger seated &

# sovereignty_morning
p31ctl sov bank --summary
p31ctl sov accountant --reconcile
p31ctl sov lawyer --pending
p31ctl sov mechanic --diagnostics
p31ctl sov carrier --usage
```

### 2.5 Blink `xcall` — iOS Automation Bridge

```
Shortcut: "P31 Morning Routine"
  1. Get current location → home?
  2. If yes: xcall blink://run?cmd=p31ctl+health+posture+--baseline
  3. Wait for callback
  4. If posture score < threshold: Open P31 PWA → FindYourself Zone
  5. Show notification: "Shoulder release recommended"
```

---

## 3. Strategic Recommendation: "Blink for Core, Termius for Ops"

### Tier 1 — Core Developer (Blink Shell)
- Stack: Blink → Mosh → Tailscale → tmux → p31ctl + Claude Code
- Cost: $19.99/year

### Tier 2 — Practitioner / Operator (Termius)
- Stack: Termius → SSH/Mosh → Tailscale → p31ctl
- Cost: Free or $10/month Pro

### Tier 3 — Combined (Both)
- Use Blink's Mosh + tmux for persistent agent sessions; Termius for one-tap mesh ops.
- Cost: ~$20/yr.

### The Minimal Viable Terminal

Free Termius Starter plan provides SSH and Mosh, Snippets, port forwarding, SFTP, modern crypto, multi-tab. Sufficient to `ssh` into a P31 Home Hub and run `p31ctl`.

---

## 4. Integration with the P31 Mobile Runtime

### 4.1 Host Auto‑Registration via Termius API

```python
import requests

def register_p31_host(label, address, vault_id, group_name, ssh_key_pub):
    resp = requests.post(
        "https://api.termius.com/api/v1/hosts",
        headers={"Authorization": f"Bearer {TERMIUS_API_TOKEN}"},
        json={
            "label": label, "address": address, "vault_id": vault_id,
            "group": group_name, "ssh_key": ssh_key_pub,
            "tags": ["p31", "mesh", "auto-provisioned"]
        }
    )
    return resp.json()
```

### 4.2 Readiness‑Gated SSH Access

```bash
p31ctl auth ssh-cert --duration 4h --require-readiness
```

### 4.3 Style Token Verification via Snippet

```bash
p31ctl token verify --file "$1" --output json | jq .
```

---

## 5. Conclusion

Termius and Blink are **complementary interfaces** to the same self‑sovereign infrastructure. Together they close the final gap in the mobile‑only P31 specification: the ability to reach beyond the phone's sandbox, through a secure overlay network, into the distributed mesh. Mosh + tmux + Tailscale, accessed through either Termius or Blink, delivers exactly that.
