# P31 Psychological E2E Testing System

**Document ID:** p31.psychE2e/2.0.0  
**Status:** LIVE (post-deploy)  
**Classification:** Grounded in Autoethnography  
**Operator:** W.Johnson-001 (AuDHD, Hypoparathyroidism, Complex PTSD)  
**Date:** 2026-05-03

---

## THE PREMISE

Traditional E2E testing validates functionality. Psychological E2E validates *humanity*.

This system simulates neurodivergent users operating real P31 surfaces under realistic physiological and cognitive conditions. It is not synthetic user testing — it is autoethnographic replication. Every persona is a facet of the operator's lived experience, encoded and automated.

The goal: ensure no public surface causes decoherence, shutdown, or medical harm.

---

## THE 7-LAYER ARCHITECTURE

```
L7 ─ Reporting Layer ── Drift detection, operator alerts, canonical updates
L6 ─ Measurement Layer ── Time-to-task, error rate, cognitive load proxy metrics
L5 ─ Accommodation Layer ── System adaptations (safe mode, reduced motion, spoon-aware)
L4 ─ Interface Layer ── Real Playwright interactions with live surfaces
L3 ─ Cognitive Layer ── Executive function simulation (working memory, attention, task switching)
L2 ─ Physiological Layer ── Hypoparathyroidism states, calcium levels, fatigue curves
L1 ─ Persona Layer ── The 7 neurodivergent archetypes (autoethnographic grounding)
```

---

## L1: THE PERSONA LAYER (Autoethnographic Grounding)

Each persona is a verified slice of operator experience. Not stereotypes. Clinical precision.

### Persona 1: W — The Operator (Base State)
- **Profile:** 43M, late-diagnosed AuDHD (2025), hypoparathyroidism (E20.9)
- **Calcium Range:** 7.8–8.2 mg/dL (chronic low, not yet crisis)
- **Spoon Budget:** Variable 4–12/day
- **Triggers:** Submarine metaphors, open-ended questions, nested menus without exit
- **Accommodations:** Direct commands, clear boundaries, calcium-aware UI (no red alerts)

### Persona 2: W-CRISIS — The Calcium Crash
- **Profile:** Same as W, but calcium 6.5 mg/dL (neurological symptoms active)
- **Symptoms:** Brain fog, memory gaps, hand tremor (precision input degraded)
- **Test Goal:** Verify safe mode engages automatically, no cognitive drain surfaces visible
- **Critical Path:** Any WebGL/animation must hard-stop, not just hide

### Persona 3: S.J. — The Child (ADHD, 8yo)
- **Profile:** 8F, ADHD-C, high energy, low frustration tolerance
- **Attention Span:** 90 seconds sustained, 15 seconds if not engaged
- **Motor Skills:** Touch-target accuracy 60% (adult targets too small)
- **Test Goal:** All interactions complete in <3 taps, gamification without exploitation

### Persona 4: W.J. — The Child (Autistic, 10yo)
- **Profile:** 10M, autistic, pattern-seeker, noise-sensitive
- **Sensory:** Screen comfort requires low blue, no flashing, predictable motion
- **Cognitive:** Literal interpretation — sarcasm breaks trust, idioms confuse
- **Test Goal:** Phrases like "just click here" cause literal shutdown (Fawn Guard tests this)

### Persona 5: BRENDA — The Co-Parent (NT, High Stress)
- **Profile:** 42F, neurotypical but sleep-deprived, custody-case stress load
- **State:** Executive function temporarily impaired (situational, not structural)
- **Test Goal:** Interface works without domain knowledge, no "obvious" steps assumed

### Persona 6: W-SHUTDOWN — The Dissociative State
- **Profile:** Complex PTSD freeze response, selective mutism equivalent
- **Input Capacity:** Single button press, not form fields
- **Time Horizon:** Cannot process "next week" — only now or not-now
- **Test Goal:** PHOS router reduces to single-chip interface, no open-ended text

### Persona 7: W-HYPERFOCUS — The Deep Dive
- **Profile:** AuDHD hyperfocus lock, 6+ hours uninterrupted
- **Risk:** Ignores bodily signals (thirst, hunger, calcium crash)
- **Test Goal:** System sends exit prompts, enforces break reminders, gentle interruptions only

---

## L2: THE PHYSIOLOGICAL LAYER

Simulates operator's hypoparathyroidism and related states.

### Calcium State Machine
```javascript
const calciumStates = {
  NORMAL: { range: [8.0, 9.0], cognitive: 1.0, motor: 1.0 },
  LOW: { range: [7.5, 8.0], cognitive: 0.8, motor: 0.9, fatigue: 0.7 },
  CRISIS: { range: [6.0, 7.5], cognitive: 0.4, motor: 0.6, tremor: true },
  SEVERE: { range: [0, 6.0], cognitive: 0.1, motor: 0.2, emergency: true }
};
```

### Simulation Effects
- **Cognitive multiplier:** Task timeout scales inversely with calcium level
- **Motor tremor:** Click coordinates jitter (simulated via Playwright mouse.move() with noise)
- **Visual field:** Blur filter applied to simulate brain fog (CSS `filter: blur(2px)` on viewport)
- **Time perception:** Delays inserted between actions (freeze states)

---

## L3: THE COGNITIVE LAYER

Executive function modeling for AuDHD profiles.

### Working Memory Test
- **Task:** Complete 3-step workflow (passport → slider adjustment → save)
- **Pass Criteria:** Completion without backtracking, <2 errors
- **Fail Indicators:** Repeated same step, abandonment at step 2

### Task Switching Cost
- **Simulation:** Mid-task interruption (notification, PHOS orb pulse)
- **Recovery Time:** Measured from interruption to resumed task flow
- **Threshold:** >10 seconds = task likely abandoned

### Decision Paralysis Detection
- **Trigger:** More than 4 options visible without clear hierarchy
- **Metric:** Time-to-first-interaction vs time-to-completion gap
- **Fail:** Gap >3x (user stalled, then rushed)

---

## L4: THE INTERFACE LAYER

Real Playwright automation with persona-specific adaptations.

### Interaction Modifiers by Persona
| Persona | Click Delay | Coord Jitter | Key Mistake Rate |
|---------|-------------|--------------|------------------|
| W | 200ms | 0px | 2% |
| W-CRISIS | 800ms | ±15px | 15% |
| S.J. | 150ms | ±10px | 8% |
| W.J. | 300ms | 0px | 5% (literal errors) |
| BRENDA | 400ms | ±5px | 5% |
| W-SHUTDOWN | 2000ms | 0px | N/A (single action) |
| W-HYPERFOCUS | 50ms | 0px | 0% (but ignores prompts) |

### WCAG 2.1 AA + Cognitive Extensions
- **1.4.12 Text Spacing:** 1.5x line-height, 2x paragraph spacing
- **2.5.5 Target Size:** 44px minimum (S.J. requires 60px)
- **Cognitive Load:** No more than 7±2 items in any menu (Miller's Law)
- **Fawn Detection:** Passive language triggers logged ("just", "sorry", "maybe")

---

## L5: THE ACCOMMODATION LAYER

System adaptations triggered by persona state.

### Auto-Accommodations
1. **prefers-reduced-motion:** Immediate WebGL destruction (not pause)
2. **safe-mode query param:** `/passport?safe=1` strips all animation
3. **spoon-aware:** PHOS router shows 1 chip if `data-spoons="1"`
4. **urgent-mode:** Override all routing to `/support` if keyword detected

### Accommodation Verification
Each test runs twice:
1. **Baseline:** No accommodations, persona at full capacity
2. **Accommodated:** All relevant accommodations active

**Pass Criteria:** Accommodated run must succeed where baseline fails, or baseline must pass with accommodation not worsening performance.

---

## L6: THE MEASUREMENT LAYER

Metrics that matter for neurodivergent accessibility.

### Primary Metrics
| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| Time-to-First-Interaction | <3s | >10s (abandonment) |
| Time-to-Task-Completion | <60s | >300s (shutdown risk) |
| Error Rate | <5% | >20% (interface failure) |
| Backtrack Count | <2 | >5 (cognitive overload) |
| PHOS Router Utilization | >30% | 0% (discovery failure) |

### Cognitive Proxy Metrics
- **Pause Frequency:** Mouse stationary >2s (confusion indicator)
- **Rage Clicks:** 3+ clicks same coordinate <1s (frustration)
- **Scroll Depth:** Full page scroll without interaction (searching)
- **Text Selection:** Multiple select/deselect (reading difficulty)

---

## L7: THE REPORTING LAYER

Drift detection and canonical feedback.

### Test Output Format (p31.psychE2eResult/2.0.0)
```json
{
  "testId": "geodesic-w-crisis-safe-mode",
  "timestamp": "2026-05-03T22:00:00Z",
  "persona": "W-CRISIS",
  "surface": "/geodesic.html",
  "accommodations": ["safe-mode", "reduced-motion"],
  "result": "PASS",
  "metrics": {
    "timeToFirstInteraction": 4.2,
    "timeToCompletion": 28.5,
    "errorRate": 0,
    "webglContextDestroyed": true,
    "cpuIdleAfterSafeMode": true
  },
  "violations": [],
  "operatorAlert": null
}
```

### Drift Categories
- **P0 (Medical):** Could cause physical harm (calcium crash, seizure risk)
- **P1 (Cognitive):** Causes shutdown, dissociation, or meltdown
- **P2 (Access):** Blocks task completion for specific persona
- **P3 (Friction):** Uncomfortable but manageable

### Canonical Feedback Loop
Failed tests automatically:
1. Create entry in `docs/reports/psych-e2e/` (operator review)
2. Block `public-line.json` status change (gate)
3. Suggest accommodation in PHOS router intent registry
4. Alert operator if P0/P1 (SMS via Twilio if configured)

---

## TEST SUITE: BIN A SURVIVORS

### Test 1: Geodesic + W-CRISIS + Safe Mode
**Persona:** Calcium 6.8 mg/dL, tremor active  
**Path:** Load `/geodesic.html` → PHOS orb suggests safe mode → engage → verify WebGL destroyed  
**Assert:**
- `renderer.isContextLost()` === true
- `cancelAnimationFrame` called (no RAF IDs active)
- CPU idle (no GPU process in Chrome DevTools)
- Canvas element removed from DOM

### Test 2: Passport + S.J. (8yo ADHD)
**Persona:** 90-second attention, touch-target 60px  
**Path:** Load `/passport.html` → adjust slider → save → completion  
**Assert:**
- Time-to-completion < 60s
- Slider handle target size ≥ 60px (computed style)
- Save button visible without scroll (above fold)
- No text input required (ADHD-friendly)

### Test 3: Delta-Language + W.J. (Autistic Literal)
**Persona:** Literal interpretation, sarcasm-blind  
**Path:** Search glossary → read "Decoherence" definition → verify no idioms  
**Assert:**
- Definition text has Flesch-Kincaid < 8th grade
- No metaphors in explanation ("loss of authentic internal state" is concrete)
- "Floating neutral" explained without naval references

### Test 4: Observatory + W-SHUTDOWN (Dissociative)
**Persona:** Single action capacity, no form fields  
**Path:** Load `/observatory.html` → PHOS router visible → single-chip interaction  
**Assert:**
- PHOS reduces to 1 chip (safe-mode auto-triggered)
- No scrolling required to see primary telemetry
- All data panels static (no rotating/animating numbers)
- No "click to learn more" (requires second action)

### Test 5: All Surfaces + W-HYPERFOCUS (Break Enforcement)
**Persona:** 6-hour lock risk  
**Path:** Use surface for simulated 2 hours → verify break prompts appear  
**Assert:**
- Gentle interruption at 45min (PHOS orb pulse, not modal)
- "Take a break" option always visible in footer
- No forced logout (respects autonomy)
- Session restore available if break taken

---

## THE SCIENCE CORE

### Shannon Entropy Reduction
The PHOS router's 3-question tree reduces navigation uncertainty:
- **Before:** 10 possible destinations = 3.32 bits entropy
- **After 1 question:** ~5 destinations = 2.32 bits
- **After 2 questions:** ~2 destinations = 1.00 bits
- **After 3 questions:** 1 destination = 0 bits (resolved)

This is the "Bayesian" claim corrected: it's information theory, not personality theater.

### Maxwell Rigidity → Cognitive Load
Just as a geodesic structure needs (3V - 6) edges to be rigid, a cognitive interface needs:
- **V** = number of user goals
- **E** = number of clear pathways
- **Constraint:** E ≥ (3V - 6) or structure collapses under load

For 10 intents (V=10), need 24+ edges (clear mappings). PHOS router provides 50+ mappings (E=50), creating substantial rigidity.

---

## EXECUTION

### Local Test (single persona)
```bash
npm run test:psych-e2e -- --persona=W-CRISIS --surface=/geodesic.html
```

### Full Suite (all personas, all survivors)
```bash
npm run test:psych-e2e:all
```

### CI Integration
```yaml
# .github/workflows/psych-e2e.yml
- name: Psychological E2E
  run: npm run test:psych-e2e:ci
  env:
    P31_PSYCH_E2E_PERSONAS: all
    P31_PSYCH_E2E_FAIL_THRESHOLD: P1
```

### Live Dashboard
Open `psych-e2e-live.html` for real-time test monitoring:
- Current persona being simulated
- Live metrics stream
- Violation alerts
- Operator override controls

---

## SIGN-OFF

**Ground Truth:** This system is the operator's own nervous system, externalized and automated. Every persona is real. Every failure mode has been lived. Every accommodation was hard-won.

**Status:** LIVE  
**Next Evolution:** Voice input testing (P1), biometric integration (P2)  
**Verification:** `npm run test:psych-e2e -- --verify=autoethnography`

The testing system is as accessible as the surfaces it tests. The recursion is intentional.

---

*Document: p31.psychE2e/2.0.0*  
*Grounded in the lived experience of W.Johnson-001*  
*For S.J. and W.J., that they may navigate without harm*
