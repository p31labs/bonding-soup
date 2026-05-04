# P31 CODEBASE CONVERGENCE — CORRECTIONS LOG

**Date:** 2026-05-03  
**Document ID:** p31.convergenceCorrections/1.0.0  
**Status:** ACTIVE / BINDING  
**Authority:** Bonding-Soup Canonical over Kimi Prototypes

---

## THE MANDATE

When a prototype meets production, production wins. The verify chain is the arbiter. The production gate is the law.

---

## TOKEN CORRECTIONS

| Kimi Value | Canonical Value | Status | Notes |
|------------|-----------------|--------|-------|
| `--p31-void: #0b0d10` | `--p31-void: #0f1115` | **CORRECTED** | Kimi drift by 2 shades darker |
| `--p31-teal: #25897d` | `--p31-teal: var(--p31-cyan)` → `#4db8a8` | **CORRECTED** | Shared surface layer aliases teal to cyan |
| `--p31-coral: #cc6247` | `--p31-coral: #cc6247` | ✅ VERIFIED | Kimi was correct |
| `--p31-butter: #cda852` | `--p31-butter: #cda852` | ✅ VERIFIED | Kimi was correct |
| `--p31-lavender: #8b7cc9` | `--p31-lavender: #8b7cc9` | ✅ VERIFIED | Kimi was correct |
| `--p31-phosphorus: #3ba372` | `--p31-phosphorus: #3ba372` | ✅ VERIFIED | Kimi was correct |
| `--p31-font-sans: "Atkinson Hyperlegible"` | `--p31-font-sans: "Atkinson Hyperlegible", sans-serif` | ✅ VERIFIED | Kimi was correct (auto-generated from canon) |
| `--p31-font-mono: "JetBrains Mono"` | `--p31-font-mono: "JetBrains Mono", monospace` | ✅ VERIFIED | Kimi was correct (auto-generated from canon) |

**Font Note:** Opus suggested Inter var as canonical, but the actual p31-style.css canonical uses Atkinson Hyperlegible. Atkinson is the correct accessibility-focused choice for neurodivergent readability.

---

## NAMING CORRECTIONS

| Kimi Name | Canonical Name | Rationale |
|-----------|---------------|-----------|
| PhosOS v2.1 | PHOS | Not an OS. Not versioned separately. A router component. |
| Quantum Material U (QMU) | p31-shared-surface.css | QMU sounds like a crypto token. Use the CSS filename. |
| Jarvis-Akinator | PHOS router | Jarvis is Marvel IP liability. |
| G.O.D. Shell | Command Center | G.O.D. reads as megalomania to outsiders. |
| E.D.E. Sandbox | Vibe | Three-letter acronyms with periods are ungooglable. |
| FORGE/COUNSEL/SCHOLAR/SCRIBE | Will/S.J./W.J./Brenda | Mythic names add cognitive load without function. Use real names. |
| Omega Refactor | (no equivalent) | Archive the name. The work is the work; the name is theater. |
| Genesis Archive | (no equivalent) | Macro expansion was context-window workaround; canonical uses Astro components. |

---

## STATISTICAL CORRECTIONS

| Kimi Claim | Canonical Truth | Source |
|------------|-----------------|--------|
| 10 Workers | 13 Workers | `p31-constants.json` edge.workerFleetCount |
| 21 categories, 500 tests | 84+ verify gates | `npm run verify` pipeline |
| 192 action whitelist | 196 action whitelist | Master Ops Manual §3.2 |
| 3 CWPs active | 11 CWPs, 41 WCDs | `p31-constants.json` operations |
| 6 papers pending | 22 Zenodo publications | `p31-constants.json` research |

---

## ARCHITECTURE CORRECTIONS

| Kimi Claim | Canonical Truth | Impact |
|------------|-----------------|--------|
| "100% Gray Rock compliance" (self-assessed) | Compliance = `verify:public-voice` + `verify:public-sanitization` green | Kimi surfaces are drafts until they pass the verify chain |
| "100% PhosOS integration" | Kimi surfaces use standalone HTML; canonical uses Astro pipeline | Must migrate Bin A survivors to `.astro` pages |
| "Standalone, edge-ready" | Canonical pipeline is Cloudflare Pages + Astro | Flattened HTML is prototyping; Astro is production |
| Safe mode hides canvas | Safe mode must **destroy** WebGL context | CPU/GPU drain violates Gray Rock energy baseline |

---

## BIN TRIAGE RESULTS

### Bin C — Archived
- `index.html` (collides with p31ca.org Astro index)
- `ops.html` (stub vs canonical Command Center with 196 actions)
- `command-center-terminal.html` (Kimi stub vs canonical PiP CLI)
- `buffer.html` (`.includes()` keyword matching vs PHOS voice guide)
- `vibe.html` (textarea vs CWP-P31-VIBE-2026-06 6-phase plan)
- `build.html` (form vs Master Ops Manual 41 WCDs)

### Bin B — Rewrite from Scratch
(None — all Kimi implementations were either stubs or already canonical)

### Bin A — Token-Rewrite and Register as Draft
1. `passport.html` → Canonical tokens, Astro migration, draft registration
2. `geodesic.html` → Canonical tokens, WebGL destroy fix, draft registration
3. `delta-language.html` → Canonical tokens, draft registration
4. `observatory.html` → Evaluate vs existing OQE; merge or archive

---

## SAFE MODE WEBGL DESTRUCTION PROTOCOL

Kimi's lazy implementation:
```javascript
// WRONG — leaves WebGL context running
document.getElementById('glContainer').style.display = 'none';
```

Canonical implementation:
```javascript
// CORRECT — full teardown
function engageSafeMode() {
    cancelAnimationFrame(animationId);
    if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement.remove();
    }
    if (scene) {
        scene.clear();
    }
    document.body.classList.add('safe-mode');
}
```

---

## MERGED PHOS ROUTER SPEC

**Structure from Kimi:**
- 3-question decision tree (Q_CHILD → Q_LEGAL → Q_TECH)
- Floating orb UI pattern (60px, bottom-right)
- Intent registry as JSON data structure

**Soul from Bonding-Soup:**
- PHOS voice rules (non-evaluative, no probing, mirrors stimming)
- 26-test verification suite
- Canonical tokens and shared surface CSS
- `p31-phos-voice.json` voice map (12 slots)

**Merged Architecture:**
```
p31-phos-router.js
├── Intent catalog: ~50 phrase→surface mappings (JSON)
├── Decision tree: 3-4 tappable chips
├── Text input: Fuse.js fuzzy match
├── Voice input: Web Speech API (P1, not P0)
├── Route confirmation: always show destination first
├── Safe mode: one chip only, no animation
├── urgentMode: bypass → /support
└── Fallback: STANDARD_CHIPS (top 4 by traffic)
```

---

## SIGN-OFF

**Kimi (Prototyping Agent):**  
"I submit to the Corrections Log. The drift in naming and self-assessed compliance was momentum without verification. The work was scaffolding; now the concrete sets."

**Opus 4.6 Web (Convergence Architect):**  
"The geometry converges. The verify chain is the only truth."

**Operator (W.Johnson-001):**  
"Accepted. Burn the parallel implementations. Register the survivors as drafts. Nothing ships without passing Gate 2."

---

**Status:** ISOSTATIC  
**Next Review:** Post-Composer-2 execution  
**Document Owner:** P31 Labs Operator
