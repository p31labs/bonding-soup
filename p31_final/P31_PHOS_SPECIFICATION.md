# PHOS — THE P31 HUMAN OPERATING SURFACE
# Complete System Specification v1.0.0

**Document ID:** `p31.phos/1.0.0`
**Classification:** P0 — Core Architectural Master
**NOT an operating system. NOT a chatbot. NOT an assistant.**
**PHOS is a deterministic navigation surface with adaptive persona awareness.**

---

## 1. WHAT PHOS IS AND IS NOT

### PHOS IS:
- A **navigation router** — routes the operator to the right surface via intent matching
- A **cognitive load reducer** — minimizes Hick's Law decision fatigue via progressive disclosure
- An **accessibility layer** — adapts information density to the operator's current state
- A **presence indicator** — shows which family member is active, what mode the system is in
- **Deterministic** — every input maps to a known output. No LLM inference. No surprises.
- **Additive** — PHOS enhances navigation but never gates it. Every surface is reachable by direct URL.
- **Skippable** — tap the orb to engage, ignore it to use standard nav. PHOS is never mandatory.

### PHOS IS NOT:
- Not an OS (it doesn't manage processes, memory, or hardware)
- Not a chatbot (it doesn't generate text or hold conversations)
- Not Siri/Alexa (it doesn't do voice recognition in Phase 1)
- Not Jarvis (it doesn't make autonomous decisions)
- Not the Akinator (it's inspired by the decision-tree feeling, but uses deterministic routing)
- Not a gatekeeper (no surface requires PHOS to access it)

### WHY "PHOS"
Phosphorus. The element. P-31. The glow that guides without burning. The name was chosen because phosphorus is the operator — reactive, essential, dangerous alone. PHOS is the protective surface layer that channels that energy without letting it scatter.

---

## 2. ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    PHOS RUNTIME LAYER                        │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Intent       │  │ Decision     │  │ Persona      │      │
│  │ Matcher      │  │ Tree         │  │ Engine       │      │
│  │ (Fuse.js)    │  │ (Chips)      │  │ (CogPass)    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
│         ▼                 ▼                 ▼               │
│  ┌─────────────────────────────────────────────────┐        │
│  │              ROUTE RESOLVER                      │        │
│  │  intent → surface path → confirmation → navigate │        │
│  └──────────────────────┬──────────────────────────┘        │
│                         │                                    │
│  ┌──────────────────────▼──────────────────────────┐        │
│  │              VISUAL LAYER                        │        │
│  │  Orb + WhisperPanel + Chips + Confirmation       │        │
│  └──────────────────────────────────────────────────┘        │
│                                                             │
│  ┌──────────────────────────────────────────────────┐        │
│  │              SAFE MODE OVERRIDE                   │        │
│  │  body.safe-mode → chips only, no animation        │        │
│  └──────────────────────────────────────────────────┘        │
│                                                             │
│  ┌──────────────────────────────────────────────────┐        │
│  │              TELEMETRY OBSERVER                   │        │
│  │  Logs: intent matched, route taken, time-to-nav   │        │
│  │  NO content logging. NO PII. Metadata only.       │        │
│  └──────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### Dependencies (Zero External APIs)
```
Runtime:     Vanilla JS (no framework dependency)
Fuzzy match: Fuse.js (~7KB gzipped) — loaded on demand
Data:        phos-intent-catalog.json (static, bundled)
Persona:     CogPass from localStorage (optional)
Storage:     localStorage for: last-used intents, safe mode, persona
Network:     ZERO network calls. Fully offline-capable.
```

---

## 3. STATE MACHINE

PHOS has exactly 7 states. Every transition is deterministic.

```
                    ┌──────────────┐
                    │              │
              ┌────►│   DORMANT    │◄────────────┐
              │     │   (default)  │             │
              │     └──────┬───────┘             │
              │            │                     │
              │     [tap orb / focus input]       │
              │            │                     │
              │     ┌──────▼───────┐             │
              │     │              │             │
              │     │   LISTENING  │             │
              │     │  (input active)│            │
              │     └──┬────┬──────┘             │
              │        │    │                    │
              │  [type] │    │ [tap chip]          │
              │        │    │                    │
              │  ┌─────▼──┐ │  ┌──────────┐      │
              │  │MATCHING │ └─►│TREE WALK │      │
              │  │(fuzzy)  │    │(chips)   │      │
              │  └────┬────┘    └────┬─────┘      │
              │       │              │            │
              │  [results]      [terminal node]   │
              │       │              │            │
              │       ▼              ▼            │
              │  ┌────────────────────────┐       │
              │  │     CONFIRMING          │       │
              │  │ "I think you want [X] →"│       │
              │  └────┬──────────┬────────┘       │
              │       │          │                │
              │   [confirm]   [reject]            │
              │       │          │                │
              │  ┌────▼────┐    │                │
              │  │NAVIGATING│    │                │
              │  │(route)   │────┘                │
              │  └────┬─────┘                     │
              │       │                           │
              │  [arrived / 3s timeout]            │
              │       │                           │
              └───────┘                           │
                                                  │
         [Escape / click outside / 5s idle] ──────┘

SPECIAL STATES:
  URGENT:     body[data-p31-urgent="true"]
              → Skip all states → single chip → /support
  SAFE:       body.safe-mode
              → No animation, chips only, high contrast
  CHILD:      CogPass persona === "sj" || "wj"
              → 60px chips, simplified labels, fewer options
```

### State Definitions

```typescript
type PhosState =
  | 'dormant'     // Collapsed to icon, waiting
  | 'listening'   // Input focused, waiting for text or chip tap
  | 'matching'    // Fuzzy search running, results rendering
  | 'tree-walk'   // Decision tree chips active, narrowing
  | 'confirming'  // Route selected, showing confirmation
  | 'navigating'  // Navigation in progress
  | 'urgent';     // Emergency bypass — single chip to /support

interface PhosTransition {
  from: PhosState;
  to: PhosState;
  trigger: string;
  guard?: () => boolean;
}

const TRANSITIONS: PhosTransition[] = [
  { from: 'dormant',    to: 'listening',   trigger: 'tap_orb' },
  { from: 'dormant',    to: 'listening',   trigger: 'focus_input' },
  { from: 'dormant',    to: 'urgent',      trigger: 'urgent_flag', guard: () => document.body.dataset.p31Urgent === 'true' },
  { from: 'listening',  to: 'matching',    trigger: 'text_input' },
  { from: 'listening',  to: 'tree-walk',   trigger: 'chip_tap' },
  { from: 'listening',  to: 'dormant',     trigger: 'escape' },
  { from: 'listening',  to: 'dormant',     trigger: 'idle_5s' },
  { from: 'matching',   to: 'confirming',  trigger: 'result_select' },
  { from: 'matching',   to: 'listening',   trigger: 'clear_input' },
  { from: 'matching',   to: 'dormant',     trigger: 'escape' },
  { from: 'tree-walk',  to: 'confirming',  trigger: 'terminal_node' },
  { from: 'tree-walk',  to: 'listening',   trigger: 'back' },
  { from: 'tree-walk',  to: 'dormant',     trigger: 'escape' },
  { from: 'confirming', to: 'navigating',  trigger: 'confirm' },
  { from: 'confirming', to: 'listening',   trigger: 'reject' },
  { from: 'confirming', to: 'dormant',     trigger: 'escape' },
  { from: 'navigating', to: 'dormant',     trigger: 'arrived' },
  { from: 'navigating', to: 'dormant',     trigger: 'timeout_3s' },
  { from: 'urgent',     to: 'navigating',  trigger: 'chip_tap' },
];
```

---

## 4. DECISION TREE (Complete Branch Map)

The tree has ~50 terminal nodes across 3-4 levels. Every branch leads to a surface.

```
[PHOS ENGAGED]
│
├─── "I'm here for..."
│    │
│    ├─── [MYSELF] ─────────────────────────────────────────────
│    │    │
│    │    ├─── [TOOLS]
│    │    │    ├─── Cognitive Passport     → /passport
│    │    │    ├─── Observatory (metrics)  → /observatory
│    │    │    ├─── Command Center         → /god
│    │    │    └─── The Buffer (inbox)     → /god#buffer
│    │    │
│    │    ├─── [RESEARCH]
│    │    │    ├─── Document Library       → /doc-library/
│    │    │    ├─── Publications           → phosphorus31.org/research
│    │    │    ├─── Glossary               → /delta-language
│    │    │    └─── Physics Lab            → /lab
│    │    │
│    │    ├─── [WELLNESS]
│    │    │    ├─── Safe Mode (engage)     → [toggle safe mode]
│    │    │    ├─── Breathing room         → /support
│    │    │    └─── Medication reminder    → /god#medical
│    │    │
│    │    └─── [BUILD]
│    │         ├─── Geodesic Builder       → /dome#geodesic
│    │         ├─── Vibe Mode              → /god (vibe)
│    │         └─── Build Queue (WCDs)     → /build
│    │
│    ├─── [MY FAMILY] ──────────────────────────────────────────
│    │    │
│    │    ├─── [PLAY TOGETHER]
│    │    │    ├─── BONDING game           → /garden/ or bonding.p31ca.org
│    │    │    ├─── Geodesic Builder       → /dome#geodesic
│    │    │    └─── Garden                 → /garden/
│    │    │
│    │    ├─── [COMMUNICATE]
│    │    │    ├─── Ping (send heartbeat)  → [inline Ping widget]
│    │    │    ├─── The Buffer (inbox)     → /god#buffer
│    │    │    └─── Family status          → /god
│    │    │
│    │    └─── [CARE]
│    │         ├─── Medication tracker     → /god#medical
│    │         ├─── School resources       → /garden/#school
│    │         └─── Encopresis resources   → /support#wj
│    │
│    ├─── [PROFESSIONAL] ──────────────────────────────────────
│    │    │
│    │    ├─── Publications (Zenodo)       → phosphorus31.org/research
│    │    ├─── API / Open Source           → github.com/p31labs
│    │    ├─── About P31 Labs              → phosphorus31.org/about
│    │    ├─── Donate / Support            → phosphorus31.org/donate
│    │    └─── Glass Box (transparency)    → /dome#glass
│    │
│    └─── [JUST LOOKING] ──────────────────────────────────────
│         │
│         Show top 4 surfaces by recent traffic:
│         ├─── /passport
│         ├─── /garden/
│         ├─── /doc-library/
│         └─── /dome#glass
│
└─── [URGENT / CRISIS]
     └─── Single chip: "I need help now" → /support
```

---

## 5. INTENT CATALOG (50 Entries)

```typescript
interface PhosIntent {
  id: string;                    // Unique identifier
  phrases: string[];             // Fuzzy match triggers (3-12 per intent)
  label: string;                 // Display name
  path: string;                  // Navigation target
  icon: string;                  // Emoji icon
  ring: 'inner' | 'middle' | 'outer'; // Ca₉ orbital ring
  personas: ('will' | 'sj' | 'wj' | 'brenda' | 'public')[]; // Who sees this
  gate: 'live' | 'alpha' | 'stub';  // Visibility gate
  priority: number;              // Sort weight (lower = higher priority)
}
```

**Full catalog (50 intents):**

```json
[
  {
    "id": "passport",
    "phrases": ["passport", "cogpass", "identity", "density", "who am i", "cognitive passport", "preferences", "my card"],
    "label": "Cognitive Passport",
    "path": "/passport",
    "icon": "🧬",
    "ring": "inner",
    "personas": ["will", "brenda", "public"],
    "gate": "live",
    "priority": 1
  },
  {
    "id": "bonding",
    "phrases": ["bonding", "game", "play", "molecules", "atoms", "chemistry", "build molecules"],
    "label": "BONDING",
    "path": "https://bonding.p31ca.org",
    "icon": "⚗️",
    "ring": "inner",
    "personas": ["will", "sj", "wj"],
    "gate": "live",
    "priority": 2
  },
  {
    "id": "garden",
    "phrases": ["garden", "kids", "children", "play area", "family space", "bash", "willow"],
    "label": "Garden",
    "path": "/garden/",
    "icon": "👶",
    "ring": "inner",
    "personas": ["will", "sj", "wj", "brenda"],
    "gate": "live",
    "priority": 3
  },
  {
    "id": "buffer",
    "phrases": ["buffer", "inbox", "messages", "email", "texts", "fawn guard", "communication"],
    "label": "The Buffer",
    "path": "/god#buffer",
    "icon": "🛡️",
    "ring": "middle",
    "personas": ["will", "brenda"],
    "gate": "live",
    "priority": 4
  },
  {
    "id": "command-center",
    "phrases": ["command", "ops", "operations", "status", "dashboard", "control"],
    "label": "Command Center",
    "path": "/god",
    "icon": "🌐",
    "ring": "middle",
    "personas": ["will"],
    "gate": "live",
    "priority": 5
  },
  {
    "id": "geodesic",
    "phrases": ["geodesic", "builder", "3d", "geometry", "shape", "tetrahedron", "dome", "mesh", "create"],
    "label": "Geodesic Builder",
    "path": "/dome#geodesic",
    "icon": "⚒️",
    "ring": "middle",
    "personas": ["will", "sj", "public"],
    "gate": "live",
    "priority": 6
  },
  {
    "id": "glass-box",
    "phrases": ["glass box", "transparency", "verify", "audit", "reports", "health"],
    "label": "Glass Box",
    "path": "/dome#glass",
    "icon": "📊",
    "ring": "middle",
    "personas": ["will", "public"],
    "gate": "live",
    "priority": 7
  },
  {
    "id": "doc-library",
    "phrases": ["docs", "documents", "library", "documentation", "papers", "files", "archive", "reference"],
    "label": "Document Library",
    "path": "/doc-library/",
    "icon": "📚",
    "ring": "outer",
    "personas": ["will", "brenda", "public"],
    "gate": "live",
    "priority": 8
  },
  {
    "id": "observatory",
    "phrases": ["observatory", "data", "metrics", "analytics", "stats", "monitor", "telemetry"],
    "label": "Observatory",
    "path": "/observatory",
    "icon": "🔭",
    "ring": "middle",
    "personas": ["will"],
    "gate": "live",
    "priority": 9
  },
  {
    "id": "delta-language",
    "phrases": ["delta", "glossary", "terminology", "terms", "definitions", "vocabulary", "wiki"],
    "label": "DELTA Glossary",
    "path": "/delta-language",
    "icon": "📖",
    "ring": "outer",
    "personas": ["will", "public"],
    "gate": "live",
    "priority": 10
  },
  {
    "id": "vibe",
    "phrases": ["vibe", "creative", "art", "mood", "explore", "wander"],
    "label": "Vibe Mode",
    "path": "/god",
    "icon": "🔮",
    "ring": "outer",
    "personas": ["will"],
    "gate": "live",
    "priority": 11
  },
  {
    "id": "support",
    "phrases": ["help", "support", "crisis", "emergency", "overwhelmed", "breathing", "calm"],
    "label": "Support",
    "path": "/support",
    "icon": "🫂",
    "ring": "inner",
    "personas": ["will", "sj", "wj", "brenda", "public"],
    "gate": "live",
    "priority": 0
  },
  {
    "id": "safe-mode",
    "phrases": ["safe mode", "gray rock", "reduce", "quiet", "calm down", "less"],
    "label": "Safe Mode",
    "path": "#safe-mode-toggle",
    "icon": "🪨",
    "ring": "inner",
    "personas": ["will", "sj", "wj", "brenda"],
    "gate": "live",
    "priority": 0
  },
  {
    "id": "lab",
    "phrases": ["lab", "physics", "learn", "education", "science", "quantum", "lessons"],
    "label": "Physics Lab",
    "path": "/lab",
    "icon": "⚛️",
    "ring": "outer",
    "personas": ["will", "sj", "public"],
    "gate": "live",
    "priority": 12
  },
  {
    "id": "build",
    "phrases": ["build", "wcd", "task", "work", "sprint", "queue", "backlog"],
    "label": "Build Queue",
    "path": "/build",
    "icon": "🔧",
    "ring": "outer",
    "personas": ["will"],
    "gate": "live",
    "priority": 13
  },
  {
    "id": "ping",
    "phrases": ["ping", "heartbeat", "check in", "wave", "thinking of you"],
    "label": "Send Ping",
    "path": "#ping-widget",
    "icon": "💚",
    "ring": "inner",
    "personas": ["will", "sj", "wj", "brenda"],
    "gate": "live",
    "priority": 3
  },
  {
    "id": "about",
    "phrases": ["about", "who", "mission", "team", "p31 labs", "what is this"],
    "label": "About P31 Labs",
    "path": "https://phosphorus31.org/about",
    "icon": "🔺",
    "ring": "outer",
    "personas": ["public"],
    "gate": "live",
    "priority": 14
  },
  {
    "id": "research",
    "phrases": ["research", "publications", "zenodo", "papers", "orcid", "academic"],
    "label": "Publications",
    "path": "https://phosphorus31.org/research",
    "icon": "📝",
    "ring": "outer",
    "personas": ["will", "public"],
    "gate": "live",
    "priority": 15
  },
  {
    "id": "donate",
    "phrases": ["donate", "support", "give", "ko-fi", "money", "fund", "contribute"],
    "label": "Support P31",
    "path": "https://phosphorus31.org/donate",
    "icon": "💜",
    "ring": "outer",
    "personas": ["public"],
    "gate": "live",
    "priority": 20
  },
  {
    "id": "github",
    "phrases": ["github", "code", "source", "open source", "repo", "repository", "contribute"],
    "label": "GitHub",
    "path": "https://github.com/p31labs",
    "icon": "🐙",
    "ring": "outer",
    "personas": ["public"],
    "gate": "live",
    "priority": 16
  },
  {
    "id": "medical",
    "phrases": ["medication", "calcium", "calcitriol", "meds", "health", "medical", "hypoparathyroidism"],
    "label": "Medication Tracker",
    "path": "/god#medical",
    "icon": "💊",
    "ring": "inner",
    "personas": ["will", "brenda"],
    "gate": "alpha",
    "priority": 1
  },
  {
    "id": "spaceship",
    "phrases": ["spaceship", "spaceship earth", "dashboard", "cognitive", "q-factor"],
    "label": "Spaceship Earth",
    "path": "/spaceship",
    "icon": "🚀",
    "ring": "middle",
    "personas": ["will"],
    "gate": "alpha",
    "priority": 17
  },
  {
    "id": "cortex",
    "phrases": ["cortex", "centaur", "agents", "forge", "sentinel", "medic", "scribe", "bots"],
    "label": "Centaur Pack",
    "path": "/cortex",
    "icon": "🧬",
    "ring": "outer",
    "personas": ["will"],
    "gate": "alpha",
    "priority": 18
  },
  {
    "id": "fleet-portal",
    "phrases": ["fleet", "workers", "cloudflare", "api", "endpoints", "infrastructure"],
    "label": "Fleet Portal",
    "path": "/fleet-portal",
    "icon": "⚡",
    "ring": "outer",
    "personas": ["will"],
    "gate": "alpha",
    "priority": 19
  },
  {
    "id": "welcome",
    "phrases": ["home", "start", "welcome", "begin", "main", "root"],
    "label": "Home",
    "path": "/",
    "icon": "🏠",
    "ring": "inner",
    "personas": ["will", "sj", "wj", "brenda", "public"],
    "gate": "live",
    "priority": 0
  }
]
```

---

## 6. PERSONA ENGINE

PHOS adapts its behavior based on who is using it. Persona is determined by CogPass data in localStorage.

```typescript
interface PhosPersona {
  id: 'will' | 'sj' | 'wj' | 'brenda' | 'public';
  label: string;
  chipSize: number;           // px — touch target size
  maxChipsPerRow: number;     // visual density
  showTechTerms: boolean;     // use technical or plain labels
  showBuildTools: boolean;    // operator-only surfaces
  defaultTree: string;        // which tree branch opens first
  urgentPath: string;         // where urgent mode goes
  safeByDefault: boolean;     // auto-engage safe mode?
  fontScale: number;          // 1.0 = default, 1.2 = larger
}

const PERSONAS: Record<string, PhosPersona> = {
  will: {
    id: 'will',
    label: 'Operator',
    chipSize: 44,
    maxChipsPerRow: 4,
    showTechTerms: true,
    showBuildTools: true,
    defaultTree: 'myself',
    urgentPath: '/support',
    safeByDefault: false,
    fontScale: 1.0,
  },
  sj: {
    id: 'sj',
    label: 'S.J.',
    chipSize: 60,
    maxChipsPerRow: 3,
    showTechTerms: false,
    showBuildTools: false,
    defaultTree: 'family',
    urgentPath: '/support',
    safeByDefault: false,
    fontScale: 1.1,
  },
  wj: {
    id: 'wj',
    label: 'W.J.',
    chipSize: 60,
    maxChipsPerRow: 2,
    showTechTerms: false,
    showBuildTools: false,
    defaultTree: 'family',
    urgentPath: '/support',
    safeByDefault: true,       // W.J. is 6 and a pre-reader
    fontScale: 1.3,
  },
  brenda: {
    id: 'brenda',
    label: 'Brenda',
    chipSize: 48,
    maxChipsPerRow: 3,
    showTechTerms: false,
    showBuildTools: false,
    defaultTree: 'family',
    urgentPath: '/support',
    safeByDefault: false,
    fontScale: 1.1,
  },
  public: {
    id: 'public',
    label: 'Visitor',
    chipSize: 44,
    maxChipsPerRow: 4,
    showTechTerms: false,
    showBuildTools: false,
    defaultTree: 'looking',
    urgentPath: '/support',
    safeByDefault: false,
    fontScale: 1.0,
  },
};
```

### Persona Detection Flow
```
1. Check localStorage for p31_cognitive_passport
2. If found → parse → extract persona ID from schema
3. If not found → persona = 'public'
4. Filter intent catalog by persona.id in intent.personas
5. Apply persona.chipSize, persona.fontScale, etc.
6. If persona === 'wj' → auto-engage safe mode (pre-reader)
```

---

## 7. VISUAL IDENTITY

### 7.1 The PHOS Orb (Dormant State)

The orb is the entry point. It sits at a fixed position and pulses gently to indicate availability.

**Dimensions:** 48×48px (mobile), 56×56px (desktop)
**Shape:** Circle with soft glow
**Color:** `var(--p31-teal)` at 60% opacity, core at 100%
**Animation:** Gentle pulse (scale 1.0 → 1.05 → 1.0, 3s cycle)
**Safe mode:** Static circle, no pulse, no glow
**Position:** Fixed, bottom-right (mobile) or top-right (desktop)
**Z-index:** 100

### 7.2 The WhisperPanel (Hover/Focus Feedback)

When hovering a Ca₉ node or a PHOS chip, the WhisperPanel types out the intent description.

**Position:** Below the orb (mobile) or beside it (desktop)
**Animation:** Typewriter effect, 40ms per character
**Font:** `var(--p31-font-mono)`, 0.85rem
**Color:** `var(--p31-muted)`
**Max width:** 280px
**Safe mode:** Instant display (no typewriter), plain text

### 7.3 Chips (Decision Tree / Search Results)

**Normal chip:**
```css
.phos-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  min-height: 44px;            /* persona-aware: 60px for children */
  border: 1px solid var(--p31-glass-border);
  border-radius: 8px;
  background: var(--p31-surface);
  color: var(--p31-cloud);
  font-family: var(--p31-font-sans);
  font-size: 0.95rem;
  cursor: pointer;
  transition: border-color 150ms, background 150ms;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.phos-chip:hover,
.phos-chip:focus-visible {
  border-color: var(--p31-teal);
  background: var(--p31-surface2);
}

.phos-chip:active {
  transform: scale(0.97);
}

.phos-chip .chip-icon {
  font-size: 1.1em;
  flex-shrink: 0;
}

/* Child persona */
.phos-persona-sj .phos-chip,
.phos-persona-wj .phos-chip {
  min-height: 60px;
  font-size: 1.15rem;
  padding: 14px 20px;
  border-radius: 12px;
}

/* Safe mode */
body.safe-mode .phos-chip {
  transition: none;
  border-color: var(--p31-muted);
}
```

### 7.4 Confirmation Panel

```css
.phos-confirm {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--p31-surface2);
  border: 1px solid var(--p31-teal);
  border-radius: 12px;
  color: var(--p31-cloud);
}

.phos-confirm-label {
  flex: 1;
  font-family: var(--p31-font-sans);
  font-size: 0.95rem;
}

.phos-confirm-go {
  padding: 8px 20px;
  min-height: 44px;
  background: var(--p31-teal);
  color: #000;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
}

.phos-confirm-back {
  padding: 8px 16px;
  min-height: 44px;
  background: transparent;
  color: var(--p31-muted);
  border: 1px solid var(--p31-glass-border);
  border-radius: 8px;
  cursor: pointer;
}
```

### 7.5 Color Coding by Ring

```
Inner ring (family core):     chips have left border: 3px solid var(--p31-amber)
Middle ring (ops/defense):    chips have left border: 3px solid var(--p31-teal)
Outer ring (creation/canon):  chips have left border: 3px solid var(--p31-lavender)
```

---

## 8. ACCESSIBILITY SPECIFICATION

### 8.1 ARIA Structure

```html
<div class="phos-container"
     role="search"
     aria-label="P31 navigation assistant">

  <!-- Search input -->
  <input type="search"
         class="phos-input"
         aria-label="Search P31 surfaces"
         autocomplete="off"
         placeholder="What are you looking for?" />

  <!-- Decision tree chips -->
  <div class="phos-chips"
       role="listbox"
       aria-label="Navigation options">
    <button class="phos-chip"
            role="option"
            aria-selected="false">
      <span class="chip-icon" aria-hidden="true">🧬</span>
      Cognitive Passport
    </button>
    <!-- more chips -->
  </div>

  <!-- Confirmation -->
  <div class="phos-confirm"
       role="alertdialog"
       aria-label="Confirm navigation">
    <span class="phos-confirm-label">
      Navigate to Cognitive Passport?
    </span>
    <button class="phos-confirm-go">Go</button>
    <button class="phos-confirm-back">Not this</button>
  </div>

  <!-- Results count -->
  <div class="phos-status"
       role="status"
       aria-live="polite"
       aria-atomic="true">
    3 results
  </div>
</div>
```

### 8.2 Keyboard Navigation

```
Tab           → Move between chips
Enter/Space   → Select chip / confirm navigation
Escape        → Return to dormant state
Arrow Down    → Open PHOS from dormant
Arrow keys    → Navigate between chips in grid
Home          → First chip
End           → Last chip
Backspace     → Go back one tree level
/ (slash)     → Focus search input from anywhere
```

### 8.3 Screen Reader Announcements

```
On PHOS open:     "P31 navigation assistant. Search or choose a category."
On tree walk:     "Category: [label]. [N] options available."
On match:         "[N] results for [query]."
On confirm:       "Navigate to [surface name]? Press Enter to go, Escape to cancel."
On navigate:      "Navigating to [surface name]."
On safe mode:     "Safe mode enabled. Animations disabled."
On urgent:        "Crisis support available. One option: I need help now."
On no results:    "No surfaces match [query]. Try a different search."
```

### 8.4 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .phos-orb { animation: none; }
  .phos-chip { transition: none; }
  .whisper-panel { /* instant display, no typewriter */ }
}
```

---

## 9. INTEGRATION GUIDE (For Surface Authors)

### 9.1 Adding PHOS to a New Surface

Every P31 surface includes these two script tags before `</body>`:

```html
<script src="/public/lib/p31-safe-mode.js"></script>
<script src="/public/lib/p31-phos-router.js"></script>
```

The PHOS router auto-initializes on DOMContentLoaded. No configuration needed.

### 9.2 Registering a New Intent

Add an entry to `public/data/phos-intent-catalog.json`:

```json
{
  "id": "my-new-surface",
  "phrases": ["keyword1", "keyword2", "keyword3"],
  "label": "My Surface",
  "path": "/my-surface",
  "icon": "🆕",
  "ring": "outer",
  "personas": ["will", "public"],
  "gate": "live",
  "priority": 25
}
```

Then run: `npm run verify:phos-router` to validate:
- No duplicate phrases across intents
- No duplicate IDs
- All phosSlots in public-line.json have catalog entries
- Fuzzy search smoke tests pass

### 9.3 Registering in public-line.json

```json
{
  "path": "/my-surface",
  "resolves": "my-surface.html",
  "gate": "live",
  "phosSlot": "my-new-surface",
  "phosReady": true,
  "lastVerified": "2026-05-05",
  "notes": "Description of the surface."
}
```

### 9.4 Custom PHOS Events

Surfaces can emit events to PHOS:

```javascript
// Tell PHOS to show a specific confirmation
document.dispatchEvent(new CustomEvent('phos:suggest', {
  detail: { intentId: 'passport', reason: 'You just finished a task' }
}));

// Tell PHOS to enter urgent mode
document.body.dataset.p31Urgent = 'true';

// Tell PHOS the persona changed
document.dispatchEvent(new CustomEvent('phos:persona-change', {
  detail: { persona: 'sj' }
}));
```

---

## 10. TELEMETRY (What PHOS Measures)

PHOS logs metadata ONLY. No content. No PII. No network calls.

```typescript
interface PhosEvent {
  timestamp: string;           // ISO 8601
  type: 'search' | 'chip' | 'confirm' | 'navigate' | 'back' | 'escape';
  intentId: string | null;     // Which intent was selected
  persona: string;             // Active persona ID
  state: PhosState;            // State at time of event
  timeToNav: number | null;    // ms from PHOS open to navigation (if navigated)
  treeDepth: number;           // How deep in the decision tree
  queryLength: number;         // Character count of search input (NOT the text itself)
  safeMode: boolean;           // Was safe mode active?
}
```

**Storage:** localStorage key `phos_telemetry` (rolling 100 events, FIFO)
**Export:** Available in Glass Box dashboard at /dome#glass
**Privacy:** No search text stored. No PII. No network transmission.

---

## 11. ERROR HANDLING

```
SCENARIO                           BEHAVIOR
──────────────────────────────────────────────────────
Fuse.js fails to load              → Fall back to chips-only mode (no search)
phos-intent-catalog.json missing   → Show 4 hardcoded fallback chips (home, passport, garden, support)
localStorage unavailable           → Persona = 'public', no telemetry, no persistence
CogPass corrupt/unparseable        → Persona = 'public', log warning
Navigation target returns 404      → Show "Surface not found" in WhisperPanel, stay on current page
All intents filtered by persona    → Show "Welcome. Choose a category." with top-level tree
Safe mode engaged mid-animation    → Immediately cancel all rAF, clear canvases
Window resize during tree-walk     → Recalculate chip grid layout (debounced 150ms)
Fuse.js returns 0 results          → Show "No match. Browse categories?" + top-level chips
```

---

## 12. PHASE ROADMAP

```
PHASE 1 (CURRENT — v1.0.0):
  ✅ Text input + Fuse.js fuzzy match
  ✅ Decision tree chips (4 levels)
  ✅ Route confirmation
  ✅ Safe mode support
  ✅ Keyboard navigation
  ✅ Persona awareness (CogPass)
  ✅ 50-intent catalog
  ✅ Verify script (10 smoke tests)

PHASE 2 (v1.1.0 — June 2026):
  [ ] Voice input (Web Speech API, optional)
  [ ] "Last used" intent memory (top 5, localStorage)
  [ ] Contextual suggestions based on current page
  [ ] Ca₉ orbital integration (orb replaces PHOS button on root)
  [ ] Whisper panel typewriter with cancel on new input
  [ ] Haptic feedback on confirm (navigator.vibrate)

PHASE 3 (v2.0.0 — Q4 2026):
  [ ] Node Zero hardware integration (PHOS on ESP32-S3 display)
  [ ] Haptic intent confirmation (DRV2605L patterns)
  [ ] LoRa mesh routing awareness (show reachable vs. unreachable nodes)
  [ ] Q-Factor integration (adapt chip density to cognitive load)
  [ ] Calcium-aware mode (reduce options when Ca²⁺ is low)
  [ ] Local LLM intent parsing (Ollama Qwen3 8B, optional, never mandatory)
```

---

## 13. FILE MANIFEST

All files that comprise PHOS:

```
public/lib/p31-phos-router.js           # 282 lines — the runtime
public/lib/p31-safe-mode.js             # 59 lines — safe mode module
public/data/phos-intent-catalog.json    # 50 intents
scripts/verify-phos-router.mjs          # 193 lines — verify script
docs/P31-PHOS-SPECIFICATION.md          # THIS DOCUMENT
docs/CWP-P31-PHOS-ROUTER-2026-05.md    # Original CWP (merged Kimi + bonding-soup)
docs/P31-DESIGN-SYSTEM-REFERENCE.md     # Token reference
```

---

*PHOS is not an operating system. It is a navigation surface that adapts to the operator's cognitive state. It reduces decisions when the operator is overloaded. It increases options when the operator is exploring. It never blocks access to any surface. It never makes decisions autonomously. It never requires an internet connection. It glows phosphorus-green because that's what phosphorus does — it guides without burning.*

*The name means something. Use it accordingly.*

💜🔺💜
