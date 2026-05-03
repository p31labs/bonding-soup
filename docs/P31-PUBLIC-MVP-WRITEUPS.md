# P31 Public-Facing MVP Write-ups
**Production Products — Live as of May 3, 2026**

---

## 1. PHOS (Phosphorus31 Operating System)
**URL:** `https://p31ca.org/phos`  
**Status:** LIVE  
**Tagline:** *"Whose mesh are we building today?"*

### What It Is
PHOS is the voice-first, inference-driven navigation wrapper for p31ca.org. It replaces traditional website navigation with intent-based routing — users say or select what they need, and PHOS routes them to the right destination. Think of it as a "psychic router" that asks 20 questions to get you where you need to be.

### How It Works
- **Deterministic Routing:** Pattern-matches voice or text input against an intent catalog (SELF, FAMILY, PRO, CRISIS)
- **No LLM Hallucination:** Uses confidence thresholds and explicit pattern matching, not probabilistic AI
- **Progressive Disclosure:** Shows only what you need — three clear choices or voice input
- **Safe Mode:** One tap removes all stimulation for sensory overwhelm (Gray Rock mode)

### Key Features
- Voice recognition via Web Speech API ("I need help with my kid's IEP")
- Three clear entry points: For Myself (/passport), For My Family (/lab), I'm a Professional (/glass-box)
- Crisis detection auto-triggers safe mode for sensory overwhelm
- 800ms auto-advance from greeting to choices (cognitive pacing)

### Technical Stack
- Vanilla JavaScript, no frameworks
- Web Speech API with graceful degradation
- Deterministic intent inference (pattern matching, not ML)
- CSS animations respect `prefers-reduced-motion`

---

## 2. Cognitive Passport
**URL:** `https://p31ca.org/passport`  
**Status:** LIVE  
**Tagline:** *"Answer once, share with anyone"*

### What It Is
A free, no-login tool that creates a one-page cognitive accommodation summary for doctors, teachers, agents, or tools. Your data stays in your browser. It's the "TL;DR for your brain" — your cognitive preferences, formatted for humans and machines.

### How It Works
1. Answer questions about your cognitive style (sensory preferences, attention patterns, executive function needs)
2. Generate a machine-readable JSON (`p31.cognitivePassport/1.0.0`)
3. Export as Markdown, JSON, or simple text
4. Share with anyone who needs to understand how you work best

### Key Features
- **Machine-readable output:** Standardized JSON schema for tool integration
- **Human-readable format:** Clean markdown for email, print, or reference
- **Privacy-first:** All data stays in browser localStorage — no server, no tracking
- **Quick generate:** Most people complete in under 5 minutes
- **8 profile types:** AuDHD, autism, anxiety, depression, PTSD, TBI, chronic illness, and custom

### Use Cases
- Send to new therapists ("Here's how I communicate best")
- Share with teachers ("This is how I learn")
- Give to doctors ("These are my sensory sensitivities")
- Feed into compatible tools for personalized UI

### Technical Stack
- Static HTML/JS, no backend
- localStorage persistence
- Open Graph optimized for social sharing
- Mobile-first responsive design

---

## 3. BONDING (C.A.R.S. / Social Molecules)
**URL:** `https://bonding.p31ca.org`  
**Status:** LIVE (shipped March 10, 2026)  
**Tagline:** *"Molecular Social Protocol"*

### What It Is
A collaborative molecular simulator where families build emotional connections as shared molecules. It's the heart of C.A.R.S. (Collaborative Affective Realtime Sim) — a persistent, breathing world where every bond represents a real relationship moment.

### How It Works
1. Create or join a private room (just a shared string — no public matchmaking)
2. Place molecular nodes representing family members
3. Drag to bond when proximity allows — each bond logs a timestamp
4. Watch the Soup evolve: molecules drift, react, and form an emotional landscape
5. Export session JSON for court-admissible evidence of engagement

### Key Features
- **K₄ impedance matching:** Every bond is a complete graph edge, not a directed arrow (relationships are mutual)
- **424 automated tests** across 32 suites — production quality enforcement
- **Ghost molecules:** See other players' molecules in real-time (2 Hz WebSocket updates)
- **Timestamped bonds:** Every connection logs for evidence documentation
- **Offline mode:** localStorage mock relay for two-tab local testing
- **6 Eras of evolution:** Primordial → Simple → Organic → Complex → Living → Consciousness (100+ molecules or Posner synthesis)

### The Soup Physics
- **4000×4000 pixel world:** Pan and zoom through your family's emotional history
- **Polarity forces:** "Water finds water" — similar emotions gravitate together
- **Mass-velocity relationship:** Complex emotions move slowly, simple ones zip around
- **Reaction system:** Compatible molecules can merge and create new compounds
- **The Deep:** Outer zone hums at 863 Hz (Larmor frequency of ³¹P)

### Technical Stack
- React 19 + Three.js R3F (React Three Fiber)
- Zustand v5 for state management
- Vitest 4 for testing (424 tests)
- Cloudflare Workers KV for relay (3–10s polling)
- CF Pages deployment

---

## 4. Lab / Tools Explorer
**URL:** `https://p31ca.org/lab`  
**Status:** LIVE  
**Tagline:** *"Explore the tools"*

### What It Is
The directory of all P31 tools and utilities. A clear, categorized interface for discovering what's available. For families, professionals, and operators.

### Categories
- **Personal:** Passport, Buffer, Somatic Anchor, Medical Tracker
- **Family:** BONDING, Appointment Tracker, Book, Bridge
- **Professional:** Glass Box, Dome, Cortex, EDE
- **Tools:** Attractor, Signal, Prism, Forge

### Key Features
- Filter by status (LIVE, BUILDING, HARDWARE, RESEARCH, TOOL)
- Search by tag or description
- Direct links to about pages and live tools
- Mobile-optimized card grid

---

## 5. Glass Box (Transparency Terminal)
**URL:** `https://p31ca.org/glass-box`  
**Status:** LIVE  
**Tagline:** *"Public transparency terminal"*

### What It Is
Live infrastructure health dashboard showing the operational status of all P31 systems. Synthetic CLI playbacks, verify pulse, and promoted reports. No auth, no tracking — complete operational transparency.

### What It Shows
- Live probes from `p31-ecosystem.json` (13+ endpoints)
- System pulse: k4-personal, orchestrator, command-center health
- EIN verification, 501(c)(3) status tracking
- Recent verification reports and promoted findings
- Fleet status (4/4 vertices online)

### Key Features
- **No authentication required:** Anyone can view
- **Auto-refreshing:** Probes run from your browser
- **Synthetic CLI:** Terminal-style interface for operator familiarity
- **Exportable:** Full report available as JSON

---

## 6. Dome / Cockpit
**URL:** `https://p31ca.org/dome`  
**Status:** LIVE  
**Tagline:** *"See the whole mesh at once"*

### What It Is
A Three.js r183 K₄ cage navigator showing the family tetrahedron plus 8 product satellites. The Sovereign Cockpit — a 3D visualization of the mesh topology.

### Visual Elements
- **Central tetrahedron:** 4 vertices (will, S.J., W.J., christyn)
- **8 satellites:** Product nodes orbiting the family core
- **Q-Factor readout:** Live coherence score
- **EBC footer:** Build / Create / Connect mission links

### Technical Specs
- Three.js r160 (specified in ground-truth)
- 16 face nodes
- Real-time mesh health indicators
- Responsive 3D camera controls

---

## 7. /welcome (Family Onboarding)
**URL:** `https://p31ca.org/welcome`  
**Status:** LIVE  
**Tagline:** *"For every family figuring it out as they go"*

### What It Is
The threshold entry point for families. Warm, approachable, and immediately actionable. No walls of text — just three clear paths forward.

### Layout
- P31 logo (44px SVG)
- Headline: "For every family figuring it out as they go"
- Promise: "Free tools that carry the context for you — no account needed"
- **Primary CTA:** "Create your context card →" (teal, full width)
- **Secondary CTAs:** "Explore the tools →", "See what's live →"
- Quick links: Context card, Lab, Glass Box, Join mesh, EDE
- Footer: Free · No login · No tracking · Georgia nonprofit · EIN 42-1888158

### Key Features
- PHOS chips mount (inference-based suggestions)
- Mobile-optimized touch targets
- Fast first paint (< 1.5s)
- Gray Rock default (wakes on interaction)

---

## 8. Social Molecules (C.A.R.S. Interface)
**URL:** `https://p31ca.org/social-molecules.html`  
**Status:** LIVE  
**Tagline:** *"Collaborative Affective Realtime Sim"*

### What It Is
The operator shell for C.A.R.S. — boot screen, load menu, and field chat staging. It's the cockpit framing the live Soup simulation.

### Load Menu Options
- **Live C.A.R.S. sim:** Full molecular simulation
- **Mesh assistant:** AI companion interface
- **Sovereign Lab:** /lab tools in same-origin frame
- **Browser slicer:** Kiri:Moto embedded for FDM/CAM
- **Field chat:** Glass transcript with role chips

### Key Features
- **Boot veil:** Dismiss to enter
- **Settings:** Reduced motion, compact density, ethics strip visibility
- **Live edge ribbon:** /p31-mesh-constants.json + health probes
- **Neuro-inclusive defaults:** prefers-reduced-motion detection, skip link, Escape key handling
- **Keyboard:** Escape closes overlays, Tab navigates

---

## 9. EDE (Everything Development Environment)
**URL:** `https://p31ca.org/ede.html`  
**Status:** LIVE  
**Tagline:** *"Code in the browser, zero npm"*

### What It Is
A browser-based development environment for JSX/React prototyping — no build toolchain required. Babel transpiles on-keypress in a Web Worker.

### Key Features
- **JSX transpilation:** Babel Standalone, zero npm
- **Samson's Law linter:** Flags cognitive overload patterns (entropy detection)
- **Q Distribution spoon tracking:** 4-tier progressive disclosure — interface simplifies as cognitive load rises
- **Sandboxed iframe execution:** Null origin, postMessage bridge, live error recovery
- **Offline-first:** IndexedDB autosaves drafts

### How It Works
1. Editor loads with starter JSX component
2. Write/paste JSX — Babel transpiles on keypress
3. Live preview updates in sandbox pane
4. Watch spoon meter: at 4 spoons UI collapses to essentials; at 1 spoon enters breathing mode

### Technical Stack
- Babel Standalone (Web Worker)
- Sandboxed iframe (null origin)
- Q Distribution (discrete probability model over cognitive load states)
- IndexedDB persistence

---

## 10. The Buffer
**URL:** `https://p31ca.org/buffer.html`  
**Status:** LIVE  
**Tagline:** *"Message Guardian & Fawn Guard"*

### What It Is
An educational drafting aid for analyzing message tone and detecting people-pleasing patterns. Not therapy or legal advice — a tool for self-awareness in communication.

### Key Features
- **Voltage scoring:** Urgency / emotional charge / cognitive load ratings for any pasted message
- **Fawn Guard:** Detects codependency patterns and people-pleasing signals in drafts
- **BLUF extraction:** Pulls the Bottom Line Up Front + action items
- **4-2-6 breathing:** Activates when voltage exceeds threshold
- **Draft mode:** Write a reply, run Fawn Guard before sending

### Use Case
1. Paste incoming message → see voltage scores
2. Switch to Draft mode, write response
3. Run Fawn Guard before sending
4. If voltage is high, click breathing button — 4-2-6 cycle before reply

---

## 11. Appointment Tracker
**URL:** `https://p31ca.org/appointment-tracker`  
**Status:** LIVE  
**Tagline:** *"Legal & Family Calendar"*

### What It Is
A zero-cloud calendar for legal, medical, and family appointments. All data in localStorage — nothing leaves the device.

### Key Features
- **Color-coded categories:** Legal (red), kids (blue), medical (purple), personal (green)
- **Recurring events:** RRULE-style repetition — never miss a court date
- **CSV export:** For your own scheduling/filing workflows
- **Local notifications:** 24h and 1h before legal appointments
- **Zero cloud:** Pure localStorage, offline-capable

### Technical Stack
- Cloudflare Worker ( lightweight )
- localStorage persistence
- Recurrence rule engine
- Notification API

---

## 12. p31-cortex (AI Agent Orchestration)
**URL:** `https://p31ca.org/cortex.html`  
**Status:** LIVE  
**Tagline:** *"Six autonomous agents"*

### What It Is
Six specialized AI agents running on Cloudflare infrastructure: benefits, finance, grant, legal, content, and ko-fi management. Persistent state across cold starts.

### Key Features
- **Six agents:** Each with specialized domain knowledge
- **Durable Objects:** Persistent state across Worker restarts
- **D1 database:** Agent memory and decision history
- **CF AI Bindings:** Edge inference — no external LLM API calls
- **Agent-to-agent messaging:** Service Bindings for coordination

### Technical Stack
- Cloudflare Durable Objects
- D1 Database
- CF AI Bindings (edge inference)
- Workers Analytics

---

## 13. NANO-07 Attractor
**URL:** `https://p31ca.org/attractor.html`  
**Status:** LIVE  
**Tagline:** *"Kenosis Mesh Visualizer"*

### What It Is
A real-time visualization of 1500 human VFD (Virtual Family Device) agents tethered to a 7-node Cloudflare Worker mesh. Watch Byzantine fault recovery in real-time.

### Key Features
- **1500 agent particles:** Each tethered to nearest online Worker node
- **Byzantine fault recovery:** Kill any node, mesh self-heals within 3 hops
- **Chaos injector:** Simulate network partitions and latency spikes
- **Cosmic Snapshot:** Recalibration animation when fault threshold crossed
- **SIC-POVM state vectors:** Color gradients on each agent particle

### Technical Stack
- Pure Three.js (no React wrapper)
- Float32Array for agent positions (minimal GC)
- requestAnimationFrame loop
- Shared array buffer for positions

---

## 14. Discord Bot (p31-bot)
**URL:** `https://p31ca.org/discord-bot-about.html`  
**Status:** LIVE  
**Tagline:** *"Community Command Plane"*

### What It Is
A Discord bot with 20+ slash commands covering the full P31 ecosystem. Spoon ledger, egg tokens, telemetry, and more.

### Key Commands
- `/spoon` — Log and query Q Distribution spoon ledger
- `/egg` — Track and award egg tokens
- `/quantum-egg-hunt` — Seasonal hunt with clues
- `/telemetry` — Live infrastructure status
- `/help` — Full command list

### Technical Stack
- Discord.js v14
- TypeScript
- Railway Deploy
- Cloudflare Workers KV (state persistence across restarts)

---

## 15. Mother Nature & Father Time (Book)
**URL:** `https://p31ca.org/book.html`  
**Status:** LIVE  
**Tagline:** *"Children's Picture Book"*

### What It Is
A 14-page illustrated digital reader dedicated to S.J. and W.J. Touch-native navigation for bedtime reading.

### Key Features
- **14 illustrated pages:** Dedicated to the operator's children
- **Touch-native:** Swipe or tap to turn, pinch to zoom
- **Dark-mode native:** Comfortable for bedtime (no blue light)
- **Bilingual-ready:** Externalized strings for translation
- **Offline-capable:** Service Worker, works on planes

### Technical Stack
- Vite 8 + React 19
- CF Pages
- JSON manifest for translations
- Service Worker offline support

---

## 16. Fleet Portal
**URL:** `https://p31ca.org/fleet-portal.html`  
**Status:** LIVE  
**Tagline:** *"Every ship in view"*

### What It Is
URL index and health status for all P31 infrastructure. A commander's view of the entire fleet.

### What It Shows
- All live service URLs
- Health status indicators
- Ecosystem topology
- Quick links to ops, glass, demos, docs

---

## 17. Document Library
**URL:** `https://p31ca.org/doc-library/`  
**Status:** LIVE  
**Tagline:** *"Searchable documentation"*

### What It Is
Full-text searchable archive of all P31 documentation. Built from markdown sources, indexed for instant search.

### Key Features
- Full-text search across all docs
- Category filtering
- Canonical URL references
- Offline-readable

---

## 18. Geodesic Math
**URL:** `https://p31ca.org/geodesic-math/`  
**Status:** LIVE  
**Tagline:** *"Icosa subdivision stats"*

### What It Is
Mathematical reference for geodesic dome construction. Same math as /dome shell.

### Content
- Icosahedron subdivision statistics
- Frequency calculations (v1, v2, v3)
- Strut length tables
- Hub angle references

---

## Technical Standards (All MVPs)

### Universal Design Tokens
```css
--p31-void: #0f1115;        /* Deep background */
--p31-surface: #161920;      /* Cards, panels */
--p31-teal: #25897d;        /* Trust, links */
--p31-coral: #cc6247;       /* CTAs, warmth */
--p31-cloud: #d8d6d0;       /* Primary text */
--p31-phosphorus: #3ba372;   /* Success, belonging */
```

### Accessibility Requirements
- WCAG 2.1 AA compliant
- Color contrast ≥ 4.5:1
- Keyboard navigable
- `prefers-reduced-motion` respected
- Screen reader tested

### Performance Targets
- First paint < 1.5s (mobile)
- Time to interactive < 3s
- Lighthouse accessibility = 100
- Works offline where applicable

---

## Summary Table

| MVP | URL | Core Value | Audience |
|-----|-----|------------|----------|
| PHOS | /phos | Voice-first navigation | All |
| Cognitive Passport | /passport | Self-advocacy tool | Neurodivergent |
| BONDING | bonding.p31ca.org | Family connection | Families |
| Lab | /lab | Tool discovery | All |
| Glass Box | /glass-box | Transparency | Public |
| Dome | /dome | Mesh visualization | Operators |
| Welcome | /welcome | Family onboarding | Families |
| Social Molecules | /social-molecules.html | C.A.R.S. shell | Families |
| EDE | /ede.html | Browser coding | Developers |
| Buffer | /buffer.html | Communication aid | All |
| Appointment Tracker | /appointment-tracker | Legal calendar | Parents |
| Cortex | /cortex.html | AI agents | Operators |
| Attractor | /attractor.html | Mesh viz | Public |
| Discord Bot | (Discord) | Community | Discord users |
| Book | /book.html | Children's story | S.J. & W.J. |
| Fleet Portal | /fleet-portal.html | Infrastructure | Operators |
| Doc Library | /doc-library/ | Documentation | All |
| Geodesic Math | /geodesic-math/ | Dome math | Builders |

---

**Last Updated:** May 3, 2026  
**Contact:** P31 Labs, Inc. · EIN 42-1888158 · p31ca.org
