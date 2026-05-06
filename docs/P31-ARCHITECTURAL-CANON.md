# P31 ARCHITECTURAL CANON
**Document ID:** `P31-CANON-V3.2.0-2026-05-06`  
**Status:** LOCKED & IMMUTABLE  
**Classification:** P0 — Core Architectural Master  
**Authority:** All future deployments, expansions, or modifications must align with the invariants below.
---
## I. SYSTEM PHILOSOPHY: PHOS-FOR-US
The P31 Ecosystem rejects standard Web 2.0 hierarchical folder trees. It is a sovereign, local-first, biologically-anchored digital nervous system designed specifically to accommodate the neurodivergent operator and their family (The Triad Fleet: Will, S.J., W.J.).
The Core Axiom: The technology must adapt to the human's cognitive and physiological state in real-time. The human must never be forced to adapt to the technology.
The SOULSAFE Protocol: When the operator's cognitive load exceeds working memory capacity (Miller's Law: 7±2 chunks), or calcium drops below 7.8 mg/dL, the system automatically sheds all extraneous load — cancelAnimationFrame(), ctx.clearRect(), display:none !important — degrading gracefully to a static, high-contrast, silent CSS grid.
---
## II. SPATIAL TOPOLOGY: Ca₉(PO₄)₆ POSNER MOLECULE
Traditional sitemaps are banned. The ecosystem operates on a Radial Orbital Topology modeled after the Posner Molecule (9 Ca²⁺ ions, 1 Phosphorus core).
The Phosphorus Core (PHOS):
- Lives at src/pages/index.astro (Z=40)
- K₄ Tetrahedron SVG (polygon elements, not circle)
- Pupils track cursor via Math.atan2()
- Parallax float via JS trigonometric math (decoupled from CSS to prevent layout thrashing)
- Click → Opens Akinator Bayesian intent router
The 9 Calcium Nodes (Z=10, DOM layer):
Ring 1 (Inner, Fast CW):  🧠 Passport │ 🍲 C.A.R.S. │ 👶 Garden
Ring 2 (Middle, CCW):  🌐 Ops Desk │ 🛡️ Buffer │ 📊 Transparency
Ring 3 (Outer, Slow):  ⚒️ Geodesic │ 🔮 Vibe IDE │ 📚 Library
The 3 Orbital Rings (Canvas Z=5):
- DPR-scaled <canvas> via ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
- Organic quadratic Bezier tethers: ctx.quadraticCurveTo(cpx, cpy, s.x, s.y)
- Animated dash offset (ctx.lineDashOffset = -t * 26)
- Packet class: Light streaks flowing along tethers toward core (new Packet(ring))
---
## III. TOKEN SANCTITY & DESIGN SYSTEM
All interfaces must inherit from the Quantum Material U (QMU) canonical tokens. Hardcoded hex values and unapproved fonts are strictly prohibited and will fail the verify:p31-style CI/CD gate.
Typography:
- Sans (UI): Atkinson Hyperlegible — engineered for maximum character distinction (dyslexia-friendly)
- Mono (Telemetry/Math): JetBrains Mono
Core Palette (CSS Custom Properties):
:root {
  --p31-void:       #0f1115;  /* Page background */
  --p31-surface:    #161920;  /* Panel backgrounds */
  --p31-surface2:   #1c2028;  /* Secondary surfaces */
  --p31-teal:       #5DCAA5;  /* Primary/Healthy */
  --p31-coral:      #cc6247;  /* Critical/Alert */
  --p31-amber:      #cda852;  /* Warning/Yield */
  --p31-lavender:   #8b7cc9;  /* Creative/Deep */
  --p31-phosphorus: #3ba372;  /* Success/Phosphorus */
  --p31-cyan:       #4db8a8;  /* Secondary CTAs */
  --p31-cloud:      #d8d6d0;  /* Primary text */
  --p31-muted:      #6b7280;  /* Secondary text */
  --p31-border:     rgba(255,255,255,0.08);
}
---
## IV. L7 PSYCHOLOGICAL TELEMETRY & SOULSAFE
The UI actively measures its own cognitive toll using a zero-dependency mathematical engine (`science-core.mjs`).
**Math Engine:**
- **Fitts' Law:** `MT = a + b·log₂(D/W + 1)` — Mean time to click target
- **Hick's Law:** `RT = b·log₂(n + 1)` — Decision fatigue
- **Cognitive Load Index:** `CLI = IL + EL + GL` — must never exceed Working Memory Capacity
- **Shannon Entropy:** `H = −Σ p·log₂(p)` — Text normalization
- **Bayesian Frustration:** `P(F|O) = [P(O|F)·P(F)] / [P(O|F)·P(F) + P(O|¬F)·P(¬F)]`
**SOULSAFE Triggers (ORR Directive 4):**
- Operator clicks Safe Mode button
- System detects `prefers-reduced-motion`
- Cognitive passport dictates `screenComfort === 0`
- **Action:** `cancelAnimationFrame(raf)`, `ctx.clearRect(0,0,W,H)`, GPU/CPU → ~0%, canvases receive `display:none !important`
---
## V. SOVEREIGN DATA ARCHITECTURE
Edge & Cloud Stack:
- Cloudflare Pages: p31ca.org (Astro AppShell, static gen)
- Cloudflare Workers: 14 edge services (q-factor, fhir, command-center, etc.)
- Cloudflare D1: SQLite at edge (p31-telemetry database)
- Cloudflare KV: SIMPLEX_STATE namespace
- Cloudflare R2: Object storage (backups, encrypted with AES-256-GCM)
- Hetzner VPS: Matrix homeserver (Synapse + PostgreSQL)
- Local-First: PGLite backed by IndexedDB → last-write-wins sync to D1
Secrets Management (ORR Directive 3):
- Master file: .env.master (never committed, gitignored)
- Automation: scripts/bootstrap-secrets.sh → loops 14 workers, pushes via npx wrangler secret put
- Inventory: docs/SECRETS-INVENTORY.md (35 secrets across 4 tiers)
- Rotation: openssl rand -hex 24 → edit .env.master → re-run bootstrap script
---
## VI. OPERATIONAL READINESS REVIEW (ORR)
Directive 1: Game Day (Chaos Engineering)
- Break staging D1 → time R2 decryption + restore pipeline
- Nuke Hetzner instance → test cloud-init bare-metal recovery
- Cloudflare outage → verify PGLite offline-reads cached medical protocols
Directive 2: Signal-to-Noise Ratio (Alert Fatigue)
- SEV-0 CRITICAL: Calcium < 7.8, Node Zero offline > 5min → haptics + Discord/SMS
- SEV-1 WARNING: Matrix bridge disconnect, Worker 500s → silent Ops Desk notification
- SEV-2 INFO: Background syncs, routine backups → log only, no alert
- Silence false positives: fleet-telemetry.ts CORS fix, 48-hour soak test
Directive 3: Zero-Trust Key Rotation Drill
- Assume STRIPE_SECRET_KEY or EPIC_CLIENT_ID leaks
- Revoke in developer portal → generate new → paste to .env.master → bash scripts/bootstrap-secrets.sh
- Verify recovery within 120 seconds
Directive 4: Graceful Degradation Testing
- Network: Chrome DevTools "Slow 3G" → UI degrades smoothly (no lockup)
- CPU: 6x slowdown → requestAnimationFrame loop doesn't burn battery; <30fps → Safe Mode
- atmosphere.astro: FPS guard warns <30fps, throttles particles <15fps
Directive 5: "Hit by a Bus" Runbook
- Brenda (or trusted proxy) has physical access to SOVEREIGN_SECRETS.age or 1Password vault
- Ops Desk (/god) has one-click diagnostic buttons (no SSH required)
- Matrix bridge dies → Ops Desk button fires worker to restart systemctl services on Hetzner
---
## VII. DEPLOYMENT MANIFEST
To deploy from cold start:
# 1. Verify environment
npm run verify          # Gates: passport, p31-style, style-alignment, surface-canon
npm run build
# 2. Commit & push
git add . && git commit -m "chore(release): v3.1.0-CINCO-DE-MAYO"
git push origin main
# 3. Deploy Pages
cd andromeda/04_SOFTWARE/p31ca && npm run deploy
# 4. Push secrets (if .env.master updated)
bash scripts/bootstrap-secrets.sh
# 5. Provision VPS (if HETZNER_API_TOKEN set)
export HETZNER_API_TOKEN=<token>
bash scripts/provision-matrix-vps.sh
Post-Deploy Verification:
1. Navigate to / → Verify 9 DOM nodes orbit PHOS core
2. Hover a node → Verify Whisper Panel types intent
3. Click Safe Mode → Verify animations halt, CSS grid appears
4. Navigate to /psych-e2e-live.html → Verify 4-persona cycle every 9 seconds
5. Navigate to /atmosphere → Verify 6-surface starfield adapts
---
The woodshop is locked. The tools are racked. The CI/CD pipeline glows a solid, unbroken green.
Happy Cinco de Mayo. 🌮🍹