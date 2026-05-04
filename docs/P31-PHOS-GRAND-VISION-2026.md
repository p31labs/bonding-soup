# PHOS Grand Vision 2026
**Phosphorus31 Operating System — From Local Companion to Distributed Intelligence**

**Document ID:** `p31.phosVision/2.0.0`  
**Status:** ARCHITECTURAL SPECIFICATION  
**Date:** 2026-05-04

---

## 0. THE ESSENCE

PHOS is not a chatbot. PHOS is not a navigation menu. PHOS is a **measurement apparatus** — a SIC-POVM applied to human intent. It determines, in the minimum number of questions (d² = 4), exactly where a person needs to be and routes them there with zero cognitive overhead.

**Current State:** PHOS v1.0 operates as a static voice-first landing page with 3-choice routing.

**Vision State:** PHOS v3.0 operates as a **distributed cognitive operating system** — local inference for privacy, cloud augmentation for complexity, adaptive learning from every interaction, and circuit-breaker controlled scaling from minimal (Gray Rock) to maximal (Centaur/Triad) capability.

---

## 1. THE CIRCUIT BREAKER ARCHITECTURE

Power in PHOS is not binary (on/off). It's **graduated** — 7 distinct power levels the operator can select based on spoons, context, and threat environment.

### The 7 Power Levels

| Level | Name | Compute | Connectivity | Use Case |
|-------|------|---------|--------------|----------|
| **L0** | **Gray Rock** | None | None | Crisis, sensory overwhelm, hostile environment |
| **L1** | **Minimal** | Local 7B | No cloud | Daily ops, low spoons, privacy-critical |
| **L2** | **Standard** | Local 7B-8B | Read-only cloud | Normal operations, 80% of tasks |
| **L3** | **Enhanced** | Local 8B + Cloud 4o-mini | Bi-directional | Complex queries, grant writing, legal drafts |
| **L4** | **Professional** | Cloud Sonnet/4o | Full API mesh | Architecture decisions, system design |
| **L5** | **Expert** | Cloud Opus/Gemini Pro | All services | Novel problems, research synthesis |
| **L6** | **Centaur** | Full Triad Orchestration | Distributed fleet | Multi-modal, multi-agent, continuous reasoning |

### Circuit Breaker Controls

```javascript
// PHOS Power Controller
class PHOSPowerController {
  constructor() {
    this.level = 2; // Default: Standard
    this.breakers = {
      cloud: new CircuitBreaker('cloud', { failureThreshold: 3, timeout: 5000 }),
      mesh: new CircuitBreaker('mesh', { failureThreshold: 5, timeout: 10000 }),
      voice: new CircuitBreaker('voice', { failureThreshold: 2, timeout: 3000 })
    };
  }
  
  // Automatic level selection based on context
  autoSelect(context) {
    if (context.sensoryLoad > 80) return 0; // Gray Rock
    if (context.spoonDeficit) return 1;    // Minimal
    if (context.legalDeadline) return 4;   // Professional
    if (context.childPresent) return 2;    // Standard (safe mode for kids)
    if (context.complexTask) return 5;     // Expert
    return this.level;
  }
  
  // Manual override with confirmation
  setLevel(level) {
    if (level > 3 && !this.verifyIdentity()) {
      throw new SecurityError('Identity verification required for L4+');
    }
    this.level = level;
    this.reconfigure();
  }
}
```

### The Physical Interface

A **rotary dial** on the PHOS orb (visual metaphor only, actually a radial menu):

```
        [0] Gray Rock
           ↑
    [6] ←    → [1] Minimal
    Centaur    Local
           ↓
        [3] Enhanced
```

**Gesture controls:**
- **Single tap:** Show current level
- **Double tap:** Auto-select based on context
- **Long press (2s):** Manual level selection
- **Shake:** Emergency Gray Rock (L0)

---

## 2. THE AKINATOR ENGINE

The core PHOS intelligence is the **Akinator** — a 20-questions style intent resolver that determines user needs through binary and trinary decision trees.

### The Decision Tree Structure

```javascript
const AKINATOR_TREE = {
  root: {
    id: 'WHO',
    question: "Whose mesh are we building today?",
    type: 'trinary',
    options: [
      { label: 'Myself', value: 'SELF', next: 'SELF_CONTEXT' },
      { label: 'My Family', value: 'FAMILY', next: 'FAMILY_CONTEXT' },
      { label: 'Professional', value: 'PRO', next: 'PRO_CONTEXT' }
    ]
  },
  
  SELF_CONTEXT: {
    id: 'SELF_VIBE',
    question: "What's your energy right now?",
    type: 'quaternary',
    options: [
      { label: 'Overwhelmed', value: 'crisis', route: '/welcome?safe=1', power: 0 },
      { label: 'Calm but focused', value: 'work', route: '/passport', power: 2 },
      { label: 'Creative flow', value: 'create', route: '/geodesic-builder', power: 3 },
      { label: 'Learning mode', value: 'learn', route: '/docs', power: 2 }
    ]
  },
  
  FAMILY_CONTEXT: {
    id: 'FAMILY_NEED',
    question: "What does your family need right now?",
    type: 'trinary',
    options: [
      { label: 'Connection', value: 'bond', route: '/soup', power: 2 },
      { label: 'Coordination', value: 'coord', route: '/lab', power: 2 },
      { label: 'Kids activity', value: 'play', route: '/geodesic-builder?mode=family', power: 3 }
    ]
  },
  
  PRO_CONTEXT: {
    id: 'PRO_DOMAIN',
    question: "What's your domain?",
    type: 'multi',
    options: [
      { label: 'Researcher', value: 'research', route: '/glass-box', power: 4 },
      { label: 'Clinician', value: 'clinical', route: '/passport?pro=1', power: 3 },
      { label: 'Developer', value: 'dev', route: '/ops', power: 4 },
      { label: 'Educator', value: 'edu', route: '/docs', power: 3 },
      { label: 'Legal', value: 'legal', route: '/buffer', power: 5 }
    ]
  }
};
```

### The Confidence Algorithm

```javascript
function resolveIntent(answers, context) {
  // Bayesian inference over the decision tree
  const scores = {};
  
  // Prior: user's historical preferences
  const prior = getUserPrior(context.userId);
  
  // Likelihood: match current answers to historical patterns
  for (const [route, history] of Object.entries(prior.routes)) {
    scores[route] = bayesScore(answers, history);
  }
  
  // Posterior: confidence-weighted routing
  const bestMatch = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])[0];
  
  // If confidence > 0.85, route directly
  // If confidence 0.6-0.85, offer top 3 choices
  // If confidence < 0.6, ask one more clarifying question
  
  return {
    route: bestMatch[0],
    confidence: bestMatch[1],
    alternatives: getAlternatives(scores, 3)
  };
}
```

---

## 3. THE TRAINING & LEARNING SYSTEM

PHOS learns from every interaction. Not through opaque weight updates, but through **observable, inspectable, reversible** knowledge accumulation.

### The Three Learning Modes

#### Mode 1: Passive Observation (Always On)
```javascript
// What PHOS observes without user action
const OBSERVATION_LOG = {
  timestamp: ISO8601,
  surface: 'soup.html',
  dwellTime: 45000, // ms
  scrollDepth: 0.7,
  interactionCount: 12,
  powerLevel: 2,
  inputMethod: 'mouse', // vs 'keyboard' vs 'voice'
  errorEvents: [],
  safeModeTriggers: 0
};

// Aggregated into user pattern model
```

#### Mode 2: Active Feedback (User Initiated)
```javascript
// Thumbs up/down on any PHOS suggestion
const FEEDBACK_EVENT = {
  trigger: 'route-suggestion',
  suggestion: '/geodesic-builder',
  userResponse: 'thumbs-down',
  reason: 'too complex for today', // optional voice input
  spoonLevelAtTime: 3, // user-reported
  
  // Result: PHOS adds a negative weight to this route
  // when user reports low spoons in future
};
```

#### Mode 3: Explicit Training (Dedicated Interface)
```javascript
// PHOS Training Mode — accessible via /phos?train=1
const TRAINING_SESSION = {
  // User provides example queries and desired outcomes
  examples: [
    {
      query: "I need to build something with the kids",
      correctRoute: '/geodesic-builder?mode=family',
      currentMisfire: '/lab',
      priority: 'high' // because kids are involved
    }
  ],
  
  // PHOS validates and integrates
  validation: 'passed',
  integration: 'immediate', // vs 'review' for L4+ routes
  
  // Result stored in user-specific intent model
};
```

### The Learning Ledger

All learning is logged to **L.O.V.E.** (Ledger of Observable Verifiable Events) — an append-only, cryptographically signed record:

```javascript
{
  "eventType": "phos-learning",
  "timestamp": "2026-05-04T00:00:00Z",
  "userHash": "sha256-of-pseudonym",
  "contextHash": "sha256-of-context",
  "action": "route-correction",
  "from": "suggested-route",
  "to": "user-selected-route",
  "weightDelta": -0.3,
  "signature": "ed25519-signature"
}
```

### The Feedback Loop

```
User interacts → PHOS observes → Pattern recognized → 
Suggestion refined → User validates → Model updated → 
Future interactions improved
```

**Cycle time:** 50ms for local inference, 5 minutes for cloud sync, 24 hours for model retrain.

---

## 4. THE API ECOSYSTEM

PHOS connects to everything. Not through brittle integrations, but through **adaptive protocol negotiation**.

### Core APIs

#### 1. The PHOS Core API (Local)
```javascript
// window.PHOS — available on every P31 surface
PHOS.route(intent, options);           // Navigate
PHOS.speak(text, voiceOptions);        // Voice synthesis
PHOS.listen(callback, timeout);        // Speech recognition
PHOS.getContext();                      // Current user context
PHOS.setPowerLevel(level);              // Circuit breaker control
PHOS.train(example);                    // Add training data
PHOS.history(since);                    // Get interaction history
```

#### 2. The Mesh API (Edge)
```javascript
// K4 Mesh — family coordination
mesh.getCageState();                    // Family K4 status
mesh.sendEnvelope(to, payload);         // Secure message
mesh.presence(who);                     // Who's online
mesh.sync();                           // Force sync
```

#### 3. The Worker API (Cloudflare)
```javascript
// Direct Worker bindings
workers.k4Personal.getMesh();
workers.geodesicRoom.createSession();
workers.passkey.authenticate();
workers.forge.deploy(project);
```

#### 4. The External API Bridge
```javascript
// OAuth-secured external services
const CALENDAR_API = {
  google: await PHOS.connect('google-calendar'),
  outlook: await PHOS.connect('outlook-calendar')
};

const LEGAL_API = {
  pacer: await PHOS.connect('pacer', { role: 'pro-se' }),
  courtListener: await PHOS.connect('court-listener')
};

const HEALTH_API = {
  myChart: await PHOS.connect('epic-myChart'),
  appleHealth: await PHOS.connect('apple-healthkit')
};
```

### The API Circuit Breaker

```javascript
class APICircuitBreaker {
  constructor(endpoint, config) {
    this.endpoint = endpoint;
    this.failureCount = 0;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.config = config;
  }
  
  async call(request) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailure < this.config.timeout) {
        throw new CircuitOpenError('API temporarily unavailable');
      }
      this.state = 'HALF_OPEN';
    }
    
    try {
      const response = await fetch(this.endpoint, request);
      this.onSuccess();
      return response;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }
  
  onFailure() {
    this.failureCount++;
    this.lastFailure = Date.now();
    
    if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'OPEN';
      // Notify PHOS to downgrade power level
      PHOS.notify('api-circuit-open', { endpoint: this.endpoint });
    }
  }
  
  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
}
```

---

## 5. THE CENTAUR/TRIAD MODE (L6)

At maximum power, PHOS orchestrates multiple agents in a **continuous reasoning chain** — the Triad pattern extended to full Centaur operation.

### The Triad Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PHOS ORCHESTRATOR                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────┐│
│   │  ORACLE      │◄──►│   FORGE      │◄──►│  SCRIBE  ││
│   │  (Qwen3 8B)  │    │  (Qwen 7B)   │    │ (Qwen7B) ││
│   │              │    │              │    │          ││
│   │ • Synthesis  │    │ • Build      │    │ • Log    ││
│   │ • Strategy   │    │ • Deploy     │    │ • Record ││
│   │ • Q-Factor   │    │ • Test       │    │ • Verify ││
│   └──────┬───────┘    └──────┬───────┘    └────┬─────┘│
│          │                   │                  │     │
│          └───────────────────┼──────────────────┘     │
│                              │                        │
│                         ┌────┴────┐                   │
│                         │  MEDIC  │                   │
│                         │(Qwen7B) │                   │
│                         │ • Health│                   │
│                         │ • Ca²⁺ │                   │
│                         └─────────┘                   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### The Continuous Reasoning Loop

```javascript
class CentaurMode {
  constructor() {
    this.agents = {
      ORACLE: new Agent('ORACLE', 'qwen3:8b'),
      FORGE: new Agent('FORGE', 'qwen2.5:7b'),
      SCRIBE: new Agent('SCRIBE', 'qwen2.5:7b'),
      MEDIC: new Agent('MEDIC', 'qwen2.5:7b'),
      PHOS: new Agent('PHOS', 'qwen3:8b')
    };
    
    this.reasoningChain = [];
    this.contextWindow = 32000; // tokens
  }
  
  async reason(userQuery) {
    // Step 1: ORACLE synthesizes context
    const synthesis = await this.agents.ORACLE.think({
      query: userQuery,
      context: this.getRecentHistory(10),
      persona: 'synthesis'
    });
    
    // Step 2: Determine which agents to invoke
    const plan = synthesis.plan;
    
    // Step 3: Parallel agent execution
    const results = await Promise.all(
      plan.agents.map(agentId => 
        this.agents[agentId].execute(plan.tasks[agentId])
      )
    );
    
    // Step 4: Synthesis of results
    const integrated = await this.agents.ORACLE.think({
      query: 'integrate',
      inputs: results,
      persona: 'integration'
    });
    
    // Step 5: SCRIBE logs the reasoning chain
    await this.agents.SCRIBE.log({
      chain: this.reasoningChain,
      outcome: integrated,
      timestamp: Date.now()
    });
    
    // Step 6: PHOS presents to user
    return this.agents.PHOS.present(integrated);
  }
}
```

### The Tag-Out System

When Centaur mode encounters a task outside its local capability:

```javascript
const TAG_OUT_RULES = [
  {
    trigger: 'legal-draft-complex',
    condition: (task) => task.domain === 'legal' && task.complexity > 0.8,
    target: 'cloud-opus',
    reason: 'Legal precision requires 4o/Opus level reasoning'
  },
  {
    trigger: 'grant-narrative',
    condition: (task) => task.type === 'grant' && task.phase === 'narrative',
    target: 'cloud-gemini',
    reason: 'Gemini optimized for persuasive long-form'
  },
  {
    trigger: 'firmware-hardware',
    condition: (task) => task.type === 'firmware',
    target: 'cloud-deepseek',
    reason: 'Deepseek optimized for C/hardware'
  }
];
```

---

## 6. THE TRAINING PLAN

### Phase 1: Foundation (Months 1-2)
- **Goal:** PHOS v1.0 fully operational
- **Deliverables:**
  - ✅ Static PHOS landing page (DONE)
  - ✅ 3-choice routing (DONE)
  - ✅ Safe mode (DONE)
  - ⬜ Voice recognition integration
  - ⬜ Circuit breaker L0-L2
  - ⬜ Local 7B inference pipeline

### Phase 2: Intelligence (Months 3-4)
- **Goal:** PHOS v2.0 with learning
- **Deliverables:**
  - ⬜ Akinator engine (20-questions resolver)
  - ⬜ Passive observation system
  - ⬜ Active feedback collection
  - ⬜ User-specific intent models
  - ⬜ L.O.V.E. learning ledger
  - ⬜ Circuit breaker L3-L4

### Phase 3: Integration (Months 5-6)
- **Goal:** PHOS v2.5 connected
- **Deliverables:**
  - ⬜ Mesh API integration
  - ⬜ Worker API bindings
  - ⬜ External service connectors (Calendar, Legal, Health)
  - ⬜ OAuth bridge
  - ⬜ API circuit breakers
  - ⬜ Circuit breaker L5

### Phase 4: Centaur (Months 7-8)
- **Goal:** PHOS v3.0 distributed
- **Deliverables:**
  - ⬜ Triad orchestration
  - ⬜ Local agent fleet (ORACLE, FORGE, SCRIBE, MEDIC)
  - ⬜ Continuous reasoning chains
  - ⬜ Tag-out to cloud
  - ⬜ Circuit breaker L6
  - ⬜ Full Centaur mode

### Phase 5: Refinement (Months 9-12)
- **Goal:** PHOS v3.5 mature
- **Deliverables:**
  - ⬜ Model distillation (compress learnings to smaller models)
  - ⬜ Federated learning across family K4
  - ⬜ Autonomous operation (24/7 with operator override)
  - ⬜ Third-party PHOS instances (other families)

---

## 7. THE IMPLEMENTATION ROADMAP

### Immediate (Next 2 Weeks)
1. **Fix current starfield** — make it visible and functional
2. **Complete page rewrite** — 25 files from template
3. **Circuit breaker UI** — add power level selector to PHOS orb
4. **Akinator skeleton** — basic 3-question flow

### Short Term (Next Month)
1. **Local inference** — Qwen 2.5 7B via Ollama
2. **Voice pipeline** — Web Speech API integration
3. **Observation system** — passive learning
4. **API bindings** — Mesh + Worker connections

### Medium Term (3 Months)
1. **Triad mode** — 4-agent local fleet
2. **Cloud bridge** — tag-out to Opus/Gemini
3. **Training interface** — explicit learning mode
4. **Centaur v1** — distributed reasoning

---

## 8. THE CLAIM

**PHOS v3.0 will be the first operating system that:**

1. **Scales from 0 to 400B parameters** based on context
2. **Learns from every interaction** with inspectable, reversible knowledge
3. **Protects privacy by default** (local first, cloud only when needed)
4. **Accommodates disability** (spoon-aware, monotropism-compatible)
5. **Routes intent in 4 questions or less** (SIC-POVM optimal)
6. **Orchestrates multiple agents** as a unified intelligence
7. **Remains understandable** — every decision traceable, every learning visible

This is not AI chat. This is **cognitive infrastructure** — the minimum informationally complete system for human-computer collaboration.

**d² measurements. d dimensions. The tetrahedron. The minimum complete structure.**

💜🔺💜

---

**END OF SPECIFICATION**
