# CWP-P31-MOBILE-OPS-2026-01: Full Chromebook + iPhone Operation

**Document:** Controlled Work Package  
**Author:** Will Johnson / Opus (Architect)  
**Date:** 2026-04-28  
**Status:** OPEN  
**Predecessor:** CWP-P31-DEPLOY-2026-02 (CLOSED), CWP-P31-PHASE-D Tracks A+B (CLOSED)  
**Hardware:** Acer Chromebook Spin 713 (dev), iPhone (mobile command)  
**Scope:** End-to-end mobile-first operation — from "open the lid" to "production is deployed and glass is green" — on two devices over Wi-Fi  

---

## 0. What This CWP Delivers

When this CWP is closed, the following is true:

- **Chromebook opens → one command → local command center is live on LAN**
- **iPhone opens Safari → taps PWA icon → full operator dashboard, glass, shift control**
- **Every p31ca surface (dome, connect, education, ops, BONDING) works touch-first at 380px**
- **Deploy pipeline runs from Chromebook terminal: verify → build → wrangler deploy**
- **`npm run p31:converge` is the single pre-flight gate for any deploy**
- **No second device required for any operation. iPhone is additive, not required.**

The three operational modes map to the mission trio:

| Mode | Verb | What it does | Primary surface |
|------|------|-------------|-----------------|
| **Command** | Operate | Glass, shift, fleet status, deploy | `/ops/`, command center PWA, `ecosystem:glass` |
| **Create** | Build | Code, verify, dome, geodesic, education content | Chromebook terminal, `/dome/`, `/geodesic.html` |
| **Connect** | Ship | Mesh, passkey, identity, BONDING, relay | `/connect`, `/mesh`, `bonding.p31ca.org` |

---

## 1. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Edge                            │
│  p31ca.org (Pages)  ·  bonding.p31ca.org (Pages)            │
│  command-center Worker  ·  p31-passkey Worker                │
│  bonding-relay Worker  ·  k4-personal Worker                 │
│  donate-api Worker  ·  geodesic-room Worker                  │
└─────────────────┬───────────────────────────────────────────┘
                  │ HTTPS (production)
                  │
┌─────────────────┴───────────────────────────────────────────┐
│              Home Wi-Fi Network                              │
│                                                              │
│  ┌──────────────────────┐    ┌────────────────────────┐     │
│  │  Chromebook Spin 713 │    │  iPhone (Safari PWA)   │     │
│  │                      │    │                        │     │
│  │  • Terminal (Linux)  │◄──►│  • Command center PWA  │     │
│  │  • Node.js / npm     │LAN │  • p31ca.org surfaces  │     │
│  │  • Git / gh CLI      │    │  • Glass dashboard     │     │
│  │  • Wrangler CLI      │    │  • Shift control       │     │
│  │  • Command center    │    │                        │     │
│  │    (port 3131)       │    └────────────────────────┘     │
│  │  • Astro dev server  │                                    │
│  │    (port 4321)       │                                    │
│  └──────────────────────┘                                    │
└─────────────────────────────────────────────────────────────┘
```

**Two networks, two purposes:**
- **LAN (local):** Chromebook command center → iPhone. Development, preview, operator tools. No internet required for local glass/shift/status.
- **Edge (production):** All deployed surfaces. Passkey, BONDING, education, mesh. Internet required.

---

## 2. Phase 1 — Chromebook Server Setup

**Objective:** From a cold boot, one script brings up the full local environment.

### 2.1 Prerequisites (one-time)

| Dependency | Install | Verify |
|-----------|---------|--------|
| Node.js 20+ | Chromebook Linux (Crostini) ships it, or `nvm install 20` | `node -v` |
| npm 10+ | Comes with Node | `npm -v` |
| Git | `sudo apt install git` | `git --version` |
| GitHub CLI | `sudo apt install gh` or snap | `gh auth status` |
| Wrangler | `npm install -g wrangler` | `wrangler --version` |
| pnpm (if monorepo) | `npm install -g pnpm` | `pnpm -v` |
| Chromium/Playwright | For e2e: `npx playwright install chromium` | `npx playwright --version` |

### 2.2 Repo Setup (one-time)

```bash
# Home repo
cd ~
git clone https://github.com/p31labs/bonding-soup.git p31
cd p31
npm install
npm run setup  # runs soup:prep after install

# Andromeda (inside home)
cd ~/p31
git clone https://github.com/p31labs/andromeda.git andromeda
cd andromeda
pnpm install  # or npm install depending on lockfile

# p31ca specifically
cd 04_SOFTWARE/p31ca
npm install
npm run verify  # confirm everything builds

# Wrangler auth
wrangler login
wrangler whoami  # confirm correct account
```

### 2.3 Daily Startup Script

Create `~/p31/scripts/p31-morning.sh`:

```bash
#!/bin/bash
# P31 Morning Boot — one command to rule them all
set -e

echo "═══ P31 Morning Boot ═══"
cd ~/p31

# Pull latest
echo "→ Pulling repos..."
git pull origin main --ff-only 2>/dev/null || echo "  home: up to date or diverged"
cd andromeda && git fetch origin && git pull origin main --ff-only 2>/dev/null || echo "  andromeda: up to date or diverged"
cd ..

# Quick verify (not full p31:all — that's for pre-deploy)
echo "→ Running converge gate..."
P31_CONVERGE_SKIP_PASSKEY=1 npm run p31:converge

# Start command center on LAN
echo "→ Starting command center..."
P31_CMD_CENTER_LAN=1 node scripts/p31-local-command-center.mjs &
CMD_PID=$!
echo "  Command center PID: $CMD_PID"
echo "  Local: http://127.0.0.1:3131"

# Get LAN IP for iPhone
LAN_IP=$(hostname -I | awk '{print $1}')
echo "  iPhone: http://${LAN_IP}:3131"
echo ""
echo "═══ Ready. iPhone can connect at http://${LAN_IP}:3131 ═══"
echo "═══ Stop with: kill $CMD_PID ═══"
```

```bash
chmod +x ~/p31/scripts/p31-morning.sh
```

**Usage:** Open terminal → `~/p31/scripts/p31-morning.sh` → done.

### 2.4 Composer Prompt — Phase 1

```
## Task: CWP-MOBILE-OPS Phase 1 — Chromebook server setup

### Step 1: Create morning boot script

Create `scripts/p31-morning.sh` with the following behavior:
1. `cd` to home repo root
2. `git pull --ff-only` on both home and andromeda (non-fatal if diverged)
3. Run `P31_CONVERGE_SKIP_PASSKEY=1 npm run p31:converge` — if it fails, warn but continue
4. Start `P31_CMD_CENTER_LAN=1 node scripts/p31-local-command-center.mjs` in background
5. Print the LAN IP for iPhone access
6. Print the PID for cleanup

Make it executable. Add to package.json as `"morning": "bash scripts/p31-morning.sh"`.

### Step 2: Verify command center serves on LAN

1. Start: `P31_CMD_CENTER_LAN=1 node scripts/p31-local-command-center.mjs &`
2. Test local: `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3131`
3. Test LAN: `curl -s -o /dev/null -w "%{http_code}" http://$(hostname -I | awk '{print $1}'):3131`
4. Check manifest: `curl -s http://127.0.0.1:3131/manifest.webmanifest | head -5`
5. Check touch icon: `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3131/apple-touch-icon.png`
6. Kill: `kill %1`

All should return 200.

### Step 3: Verify responsive CSS

Confirm `p31-responsive-surface.css` is served:
```bash
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3131/assets/p31-responsive-surface.css
```

### Report
- Morning script location and `npm run morning` wired
- All curl status codes
- LAN IP printed correctly
```

---

## 3. Phase 2 — iPhone PWA Setup

**Objective:** iPhone has a home screen PWA that connects to the Chromebook command center over LAN, and all production surfaces work touch-first.

### 3.1 Add to Home Screen (one-time, manual)

1. **Connect iPhone to same Wi-Fi as Chromebook**
2. Open Safari → navigate to `http://<chromebook-lan-ip>:3131`
3. Tap Share → "Add to Home Screen"
4. Name: "P31 Command" (or whatever)
5. The PWA launches fullscreen with the P31 icon

### 3.2 PWA Requirements (already partially shipped)

From the agent sessions, the command center already has:
- `/manifest.webmanifest` with icons
- `/apple-touch-icon.png` (180x180)
- Apple meta tags in HTML
- Safe areas for notch/home indicator
- 48px touch targets
- `interactive-widget=resizes-content` viewport

**Gaps to verify:**

| Requirement | Check | Fix if missing |
|-------------|-------|----------------|
| `apple-mobile-web-app-capable` meta | Grep command center HTML | Add `<meta name="apple-mobile-web-app-capable" content="yes">` |
| `apple-mobile-web-app-status-bar-style` | Grep command center HTML | Add `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">` |
| Manifest `display: standalone` | Check manifest.webmanifest | Set to `standalone` |
| Manifest `start_url` | Check manifest.webmanifest | Set to `/` |
| Manifest `scope` | Check manifest.webmanifest | Set to `/` |
| 192px + 512px icons | Check manifest icons array | Generate from BONDING icon set |
| Touch targets ≥ 48px | Visual inspection on iPhone | CSS min-height/min-width on interactive elements |
| No hover-dependent UI | Visual inspection | Replace hover with focus-visible + active states |
| Viewport lock (no pinch zoom on controls) | Check viewport meta | `user-scalable=no` on command surfaces only |
| Offline fallback | Service worker or static | At minimum: show "offline" not a browser error |

### 3.3 Production surfaces on iPhone

All p31ca.org surfaces should already work on iPhone (they're static HTML served from Cloudflare Pages with responsive CSS). Verify the critical ones:

| Surface | URL | Touch test |
|---------|-----|-----------|
| Hub home | `https://p31ca.org/` | Scroll, tap cards, mission trio footer |
| Dome | `https://p31ca.org/dome/` | Touch-drag rotate, tap nodes, deep links |
| Connect | `https://p31ca.org/connect` | 3D graph renders, tap nodes, passkey flow |
| Ops | `https://p31ca.org/ops/` | Glass table scrolls horizontally, shift line visible |
| Education | `https://p31ca.org/education/` | Cards, track navigation, module pages |
| BONDING | `https://bonding.p31ca.org/` | Full game: drag atoms, tap palette, achievements |
| Delta hiring | `https://p31ca.org/delta-hiring/` | Proof export, hash routes |
| K4 Market | `https://p31ca.org/k4market.html` | 3D scene, toolbar buttons |

### 3.4 Composer Prompt — Phase 2

```
## Task: CWP-MOBILE-OPS Phase 2 — iPhone PWA verification

### Step 1: Audit command center PWA metadata

```bash
# Check the command center HTML for required PWA meta tags
CCHTML=$(find /home/p31 -name "p31-local-command-center.mjs" -exec grep -l "html" {} \;)
grep -i "apple-mobile-web-app-capable\|apple-mobile-web-app-status-bar-style\|theme-color\|viewport" scripts/p31-local-command-center.mjs | head -10

# Check manifest
node -e "
const cc = require('fs').readFileSync('scripts/p31-local-command-center.mjs','utf8');
const m = cc.match(/manifest/i);
console.log('manifest mentioned:', !!m);
"

# If command center generates HTML inline, search for the meta tags:
grep -c "apple-touch-icon\|apple-mobile-web-app\|manifest" scripts/p31-local-command-center.mjs
```

Report what PWA meta tags exist and what's missing.

### Step 2: Check touch icon pipeline

```bash
ls -la scripts/command-center/apple-touch-180.png 2>/dev/null || \
find /home/p31 -name "apple-touch*" 2>/dev/null | head -5
```

If the 180x180 icon exists: confirm the command center serves it.
If missing: check BONDING icons for a source to resize from.

### Step 3: Production surface responsive check

For each critical URL, fetch and check for responsive viewport + no fixed-width:
```bash
for url in \
  "https://p31ca.org/" \
  "https://p31ca.org/dome/" \
  "https://p31ca.org/connect" \
  "https://p31ca.org/ops/" \
  "https://p31ca.org/education/" \
  "https://bonding.p31ca.org/"; do
  printf "%-45s " "$url"
  curl -sL "$url" | grep -c "viewport" | xargs printf "viewport:%s "
  curl -sL "$url" | grep -c "p31-responsive-surface\|p31-shell" | xargs printf "responsive:%s\n"
done
```

### Step 4: Fix any missing PWA metadata

If apple-mobile-web-app-capable or manifest display:standalone are missing,
add them to the command center HTML generation. Do NOT break existing functionality.

### Report
- PWA meta tags: present/missing for each required tag
- Touch icon: exists Y/N, served Y/N
- Responsive check: viewport + responsive CSS count per surface
- Fixes applied (if any)
```

---

## 4. Phase 3 — Command Mode (Operate)

**Objective:** Full operator control from either device.

### 4.1 Command Center Dashboard

The local command center should surface:
- **Glass status:** All probes from `p31-ecosystem.json` with UP/DOWN/SKIP
- **Operator shift:** Current state from `GET /api/operator/shift`
- **Fleet status:** Workers health summary
- **Quick actions:** Links to deploy, verify, converge
- **Recent git:** Last 5 commits on main (both repos)

### 4.2 Deploy from Chromebook

The deploy pipeline (verified today) is:

```bash
# Full deploy (p31ca)
cd ~/p31/andromeda/04_SOFTWARE/p31ca
npm run deploy  # predeploy (verify) → build → wrangler pages deploy

# Quick deploy (skip verify if you just ran it)
npm run build && npx wrangler pages deploy dist/ --project-name=p31ca --branch=production
```

### 4.3 Glass from Anywhere

```bash
# From Chromebook terminal
cd ~/p31 && npm run ecosystem:glass

# From iPhone (via command center)
# The command center should surface glass results in the dashboard
# No terminal needed on iPhone
```

### 4.4 Shift Control

```bash
# Check shift status
curl -s https://command-center.trimtab-signal.workers.dev/api/operator/shift | jq .

# From home repo
npm run operator:shift-status
npm run operator:shift-in
npm run operator:shift-out
```

### 4.5 Composer Prompt — Phase 3

```
## Task: CWP-MOBILE-OPS Phase 3 — Command mode verification

### Step 1: Verify all operator scripts exist

```bash
cd /home/p31
grep -E "operator:shift|ecosystem:glass|p31:converge|p31:all|morning" package.json | head -10
```

Report which scripts exist. If `morning` is missing (from Phase 1), note it.

### Step 2: Verify deploy pipeline

```bash
cd andromeda/04_SOFTWARE/p31ca
grep '"deploy"' package.json
grep '"predeploy"' package.json
```

Confirm: `deploy` calls `predeploy` (verify) then `wrangler pages deploy`.

### Step 3: Verify glass covers all critical surfaces

```bash
cd /home/p31
npm run ecosystem:glass 2>&1 | tail -30
```

Report: total probes, UP count, DOWN count, SKIP count.
Flag any DOWN that should be UP.

### Step 4: Verify shift endpoint

```bash
curl -s "https://command-center.trimtab-signal.workers.dev/api/operator/shift" | head -c 200
```

Expected: JSON with schema p31.operatorShift/1.0.0

### Report
- All operator scripts confirmed Y/N
- Deploy pipeline verified Y/N
- Glass: N up / N down / N skip
- Shift endpoint: 200 + JSON Y/N
```

---

## 5. Phase 4 — Create Mode (Build)

**Objective:** Development workflow optimized for Chromebook constraints.

### 5.1 Chromebook Constraints

| Constraint | Impact | Mitigation |
|-----------|--------|------------|
| Limited RAM (~8GB) | Can't run many dev servers simultaneously | One dev server at a time; use production URLs for non-active surfaces |
| ARM or low-power CPU | Builds are slower (Astro build ~5-8s, Vitest ~10s) | 120s Vitest timeout already configured; don't parallelize heavy builds |
| Small SSD | Node modules are large | Single pnpm store; `.gitignore` aggressive |
| No GPU (Crostini) | Playwright headless can flake | `P31_K4MARKET_SMOKE_SKIP_ON_LAUNCH_FAIL=1` for WebGL tests |
| Linux container (Crostini) | Port forwarding to Chrome OS required for LAN | Crostini forwards automatically; verify with `ss -tlnp` |

### 5.2 Development Workflow

```bash
# Start p31ca dev server (Astro)
cd ~/p31/andromeda/04_SOFTWARE/p31ca
npm run dev  # Astro dev on port 4321

# Start BONDING dev server
cd ~/p31/andromeda/04_SOFTWARE/bonding
npm run dev  # Vite on port 5173

# Run tests (BONDING)
cd ~/p31/andromeda/04_SOFTWARE/bonding
npm test  # 424 tests / 32 suites

# Run verify (p31ca)
cd ~/p31/andromeda/04_SOFTWARE/p31ca
npm run verify

# Full gate (home)
cd ~/p31
npm run p31:all  # everything
npm run p31:converge  # parallel tracks only (faster)
```

### 5.3 Editor

Cursor on Chromebook (or VS Code if Cursor isn't available on ARM):
- Open `~/p31` as workspace
- Terminal pane for commands
- Cursor Composer for agent-driven work

---

## 6. Phase 5 — Connect Mode (Ship)

**Objective:** Mesh, identity, and BONDING multiplayer all work from mobile devices.

### 6.1 Passkey Flow (iPhone)

The passkey Worker is live (`p31ca.org/api/passkey/*`). On iPhone:
1. User navigates to `https://p31ca.org/connect`
2. Taps "Register" → Safari triggers WebAuthn
3. iPhone Face ID / Touch ID creates credential
4. `subject_id` (`u_` + SHA-256 of rawId) is minted
5. k4-personal binds the identity

**Verify on iPhone:** Navigate to connect page, trigger registration ceremony. Face ID prompt should appear. This is a manual test — no automation possible for biometric.

### 6.2 BONDING Multiplayer (iPhone → Chromebook)

1. Both devices navigate to `https://bonding.p31ca.org/`
2. Create/join room with 6-char code
3. Build molecules independently
4. PING reactions cross devices via relay

**Verify:** `bonding-relay.trimtab-signal.workers.dev/health` → 200 (already confirmed).

### 6.3 Mesh Surfaces

All mesh surfaces (`/connect`, `/delta.html`, `/mesh-observatory/`, `/tomography.html`) should render and navigate on iPhone. The responsive CSS + p31-mesh-tap is already deployed.

---

## 7. Phase 6 — Integration Test

**Objective:** End-to-end proof that both devices work together.

### 7.1 The Integration Checklist

Run this from Chromebook with iPhone on the same Wi-Fi:

```
CHROMEBOOK
[ ] Terminal: ~/p31/scripts/p31-morning.sh → converge green, command center live
[ ] Terminal: LAN IP printed, iPhone URL shown
[ ] Browser: http://127.0.0.1:3131 → command center loads
[ ] Terminal: npm run ecosystem:glass → 24+ UP
[ ] Terminal: npm run operator:shift-status → JSON response
[ ] Browser: https://p31ca.org/ → hub loads, cards visible
[ ] Browser: https://p31ca.org/dome/ → dome renders, touch-drag works
[ ] Browser: https://bonding.p31ca.org/ → BONDING loads
[ ] Terminal: cd andromeda/04_SOFTWARE/p31ca && npm run verify → exit 0
[ ] Terminal: npm run deploy → predeploy + build + wrangler success

iPHONE (same Wi-Fi)
[ ] Safari: http://<lan-ip>:3131 → command center loads
[ ] Add to Home Screen → PWA icon appears
[ ] PWA: tap icon → launches standalone, no Safari chrome
[ ] PWA: glass status visible (or link to /ops/)
[ ] Safari: https://p31ca.org/ → hub loads, scroll + tap works
[ ] Safari: https://p31ca.org/dome/ → dome renders, touch works
[ ] Safari: https://p31ca.org/connect → connect page, CAGE WORKER LIVE
[ ] Safari: https://p31ca.org/ops/ → glass table, horizontal scroll
[ ] Safari: https://p31ca.org/education/ → education hub, cards navigate
[ ] Safari: https://bonding.p31ca.org/ → BONDING loads, touch atoms work
[ ] Safari: passkey registration → Face ID prompt (manual test)
```

### 7.2 Composer Prompt — Integration Test (Chromebook side only)

```
## Task: CWP-MOBILE-OPS Phase 6 — Integration test (Chromebook side)

Run the Chromebook half of the integration checklist.

### Step 1: Morning boot

```bash
cd /home/p31
# If morning script exists:
npm run morning 2>&1 | head -20
# If not, run manually:
P31_CONVERGE_SKIP_PASSKEY=1 npm run p31:converge
P31_CMD_CENTER_LAN=1 node scripts/p31-local-command-center.mjs &
echo "LAN: http://$(hostname -I | awk '{print $1}'):3131"
```

### Step 2: Command center health

```bash
curl -s -o /dev/null -w "local: %{http_code}\n" http://127.0.0.1:3131
curl -s -o /dev/null -w "manifest: %{http_code}\n" http://127.0.0.1:3131/manifest.webmanifest
curl -s -o /dev/null -w "touch-icon: %{http_code}\n" http://127.0.0.1:3131/apple-touch-icon.png
curl -s -o /dev/null -w "responsive: %{http_code}\n" http://127.0.0.1:3131/assets/p31-responsive-surface.css
LAN_IP=$(hostname -I | awk '{print $1}')
curl -s -o /dev/null -w "lan: %{http_code}\n" http://${LAN_IP}:3131
```

### Step 3: Glass + shift

```bash
npm run ecosystem:glass 2>&1 | grep -cE "^UP" | xargs printf "UP probes: %s\n"
npm run ecosystem:glass 2>&1 | grep -cE "^DOWN" | xargs printf "DOWN probes: %s\n"
curl -s "https://command-center.trimtab-signal.workers.dev/api/operator/shift" | head -c 100
```

### Step 4: Production surface sweep

```bash
for url in \
  "https://p31ca.org/" \
  "https://p31ca.org/dome/" \
  "https://p31ca.org/connect" \
  "https://p31ca.org/ops/" \
  "https://p31ca.org/education/" \
  "https://bonding.p31ca.org/" \
  "https://p31ca.org/api/passkey/register-begin"; do
  printf "%-55s %s\n" "$url" "$(curl -sL -o /dev/null -w '%{http_code}' --max-time 10 "$url")"
done
```

Expected: all 200 except passkey register-begin → 405 (GET on POST endpoint).

### Step 5: Verify + deploy readiness

```bash
cd andromeda/04_SOFTWARE/p31ca
npm run verify 2>&1 | tail -5
echo "VERIFY_EXIT=$?"
```

### Step 6: Kill command center

```bash
kill %1 2>/dev/null || echo "no background job"
```

### Report
- Morning boot: converge exit code
- Command center: all 5 curl status codes
- Glass: UP count / DOWN count
- Shift: 200 + JSON Y/N
- Surface sweep: table of URLs + status codes
- Verify: exit code
```

---

## 8. Definition of Done

| # | Criterion | Verify |
|---|-----------|--------|
| 1 | Morning boot script exists and runs | `npm run morning` → converge green + command center live |
| 2 | Command center serves on LAN | `curl http://<lan-ip>:3131` → 200 |
| 3 | iPhone PWA installs from command center | Manual: Add to Home Screen → standalone launch |
| 4 | All production surfaces return 200 | Surface sweep script → all green |
| 5 | Glass shows 24+ probes UP | `npm run ecosystem:glass` |
| 6 | Shift endpoint responds | `curl /api/operator/shift` → JSON |
| 7 | Deploy pipeline works from terminal | `npm run deploy` in p31ca → success |
| 8 | Passkey route live | GET → 405, POST → 200 |
| 9 | BONDING loads on mobile | `bonding.p31ca.org` → 200 + touch works |
| 10 | `p31:converge` is the pre-flight gate | `npm run p31:converge` → exit 0 |

---

## 9. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Crostini port forwarding breaks on Chrome OS update | Medium | LAN access dies | Verify after OS updates; fallback: `penguin.linux.test` hostname |
| iPhone Safari PWA doesn't persist after reboot | Low | Minor inconvenience | Re-add to Home Screen; no data loss (all state is edge) |
| Wrangler auth expires | Medium | Deploy blocked | `wrangler login` as part of morning boot if token expired |
| Chromebook RAM pressure with dev server + command center | Medium | OOM kills processes | Run one dev server at a time; command center is lightweight |
| WebGL doesn't render on iPhone (dome, k4market, connect) | Low | Visual degradation | These surfaces already have WebGL fallbacks; test on actual device |
| LAN security (HTTP, not HTTPS) | Medium | Local network exposure | `P31_CMD_CENTER_LAN=1` is explicit opt-in; only serves on home Wi-Fi; no secrets in command center responses |

---

## 10. Sprint Checklist

```
PHASE 1 — CHROMEBOOK SERVER SETUP
[ ] Node.js 20+ installed and verified
[ ] Both repos cloned and npm install complete
[ ] wrangler login + whoami confirmed
[ ] Morning boot script created and executable
[ ] npm run morning → converge green + command center live
[ ] LAN IP printed correctly

PHASE 2 — iPHONE PWA
[ ] PWA meta tags present in command center HTML
[ ] apple-touch-icon served at 180x180
[ ] manifest.webmanifest with display:standalone
[ ] iPhone: Add to Home Screen works
[ ] iPhone: PWA launches standalone (no Safari chrome)
[ ] iPhone: command center dashboard loads over LAN

PHASE 3 — COMMAND MODE
[ ] ecosystem:glass → 24+ UP
[ ] operator:shift-status → JSON
[ ] npm run deploy → success from terminal
[ ] /ops/ loads and shows glass data

PHASE 4 — CREATE MODE
[ ] Astro dev server starts (port 4321)
[ ] BONDING dev server starts (port 5173)
[ ] npm test (BONDING) → 424/32
[ ] npm run verify (p31ca) → exit 0
[ ] p31:converge → exit 0

PHASE 5 — CONNECT MODE
[ ] p31ca.org/connect loads, CAGE WORKER LIVE
[ ] Passkey register-begin: GET 405, POST 200
[ ] bonding.p31ca.org loads on mobile
[ ] bonding-relay /health → 200

PHASE 6 — INTEGRATION
[ ] Full Chromebook checklist passes
[ ] Full iPhone checklist passes
[ ] Both devices on same Wi-Fi, command center accessible
```

---

## 11. Closure

**Closed by:** _______________  
**Date:** _______________  
**Morning boot time:** ___ seconds  
**Glass probe count:** ___ UP / ___ DOWN / ___ SKIP  
**iPhone PWA installed:** [ ] Yes  
**All surfaces 200 on iPhone:** [ ] Yes / [ ] No (list exceptions)  

---

*CWP-P31-MOBILE-OPS-2026-01 — Full Chromebook + iPhone Operation*  
*"Two devices. One mesh. Zero friction."*
