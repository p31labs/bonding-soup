# P31 PHOS — Complete Technical Specification
**Phosphorus31 Operating System**  
**Voice-first, inference-driven navigation wrapper**  
**Version:** 1.0.0  
**Date:** 2026-05-03

---

## 1. OVERVIEW

PHOS (Phosphorus31 Operating System) is a voice-first, inference-driven navigation wrapper that serves as the primary entry point for p31ca.org. It replaces traditional navigation with intent-based routing — users say or select what they need, and PHOS handles the rest.

### Core Philosophy

1. **Voice-First:** Speak your intent. No hunting through menus.
2. **Progressive Disclosure:** Show only what's needed, when it's needed.
3. **Deterministic Routing:** Pattern matching, not LLM hallucination.
4. **Gray Rock First:** Everything starts inert. Wake on interaction.
5. **Safe Mode:** One tap removes all stimulation for sensory overwhelm.

### Tagline
> *"Whose mesh are we building today?"*

---

## 2. ARCHITECTURE

### 2.1 System Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              PHOS WRAPPER                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────┐                                                   │
│  │  VOICE INPUT     │◄── Web Speech API                                  │
│  │  (optional)      │                                                   │
│  └────────┬─────────┘                                                   │
│           │                                                             │
│           ▼                                                             │
│  ┌──────────────────┐      ┌──────────────────┐      ┌─────────────────┐ │
│  │  INFERENCE       │      │  STATE MACHINE   │      │  UI SHELL       │ │
│  │  ENGINE          │◄────►│                  │◄────►│                 │ │
│  │                  │      │  • GREETING      │      │  • Header       │ │
│  │  Pattern         │      │  • INTENT        │      │  • Question     │ │
│  │  matching        │      │  • ROUTING       │      │  • Choices      │ │
│  │  Confidence      │      │  • CONTENT       │      │  • Voice btn    │ │
│  │  thresholds      │      │  • URGENT        │      │  • Safe mode    │ │
│  └────────┬─────────┘      └──────────────────┘      └─────────────────┘ │
│           │                                                             │
│           ▼                                                             │
│  ┌──────────────────┐      ┌──────────────────┐                       │
│  │  INTENT CATALOG  │      │  DESTINATION     │                       │
│  │                  │      │                  │                       │
│  │  • SELF          ├─────►│  /passport       │                       │
│  │  • FAMILY        ├─────►│  /lab            │                       │
│  │  • PRO           ├─────►│  /glass-box      │                       │
│  │  • CRISIS        ├─────►│  /welcome        │                       │
│  │                  │      │                  │                       │
│  └──────────────────┘      └──────────────────┘                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 State Machine

```javascript
const PHOS_STATES = {
  GREETING: 'GREETING',    // "Hello." (auto-advances 800ms)
  INTENT: 'INTENT',        // "Whose mesh are we building today?"
  ROUTING: 'ROUTING',      // "Calibrating to [destination]..."
  CONTENT: 'CONTENT',      // Showing loaded content
  URGENT: 'URGENT',        // Safe mode — minimal UI
};
```

**Transitions:**
- `GREETING` → `INTENT` (after 800ms)
- `INTENT` → `ROUTING` (on choice/voice selection)
- `ROUTING` → `CONTENT` (after 800ms delay for cognitive pacing)
- `INTENT` → `URGENT` (safe mode button, crisis words, URL param)
- Any → `INTENT` (reset/home)

---

## 3. INFERENCE ENGINE

### 3.1 Intent Catalog

| ID | Patterns | Label | Destination | Confidence | Urgent |
|----|----------|-------|-------------|------------|--------|
| `SELF` | myself, me, i, personal, alone, individual, self, passport | For Myself | /passport | 0.9 | No |
| `FAMILY` | family, household, kids, children, parents, home, together, us, we, partner | For My Family | /lab | 0.85 | No |
| `PRO` | professional, work, job, career, developer, engineer, doctor, therapist | I'm a Professional | /glass-box | 0.8 | No |
| `CRISIS` | help, crisis, overwhelm, panic, anxiety, emergency, stop | I need help now | /welcome | 1.0 | Yes |

### 3.2 Pattern Matching Algorithm

```javascript
function inferIntent(input, context = {}) {
  if (!input || typeof input !== 'string') {
    return { intent: null, confidence: 0, chips: [] };
  }

  const normalized = input.toLowerCase().trim();
  const words = normalized.split(/\s+/);
  
  let bestMatch = null;
  let bestScore = 0;
  
  for (const intent of INTENT_CATALOG) {
    let score = 0;
    
    // Pattern matching (substring)
    for (const pattern of intent.patterns) {
      if (normalized.includes(pattern)) {
        score += pattern.length >= 5 ? 0.3 : 0.2;
      }
    }
    
    // Word boundary matches
    for (const word of words) {
      if (intent.patterns.includes(word)) {
        score += 0.25;
      }
    }
    
    // Exact match bonus
    if (intent.patterns.some(p => p === normalized)) {
      score += 0.5;
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = intent;
    }
  }

  // Crisis override
  const crisisWords = ['help', 'crisis', 'panic', 'emergency', 'stop', 'overwhelm'];
  if (crisisWords.some(w => normalized.includes(w))) {
    return {
      intent: CRISIS_INTENT,
      confidence: 1.0,
      urgent: true,
      chips: generateChips(CRISIS_INTENT),
    };
  }

  // Confidence threshold (lower when screen comfort is low)
  const threshold = context.screenComfort < 30 ? 0.3 : 0.5;
  
  if (bestScore < threshold || !bestMatch) {
    return {
      intent: null,
      confidence: 0,
      chips: generateStandardChips(),
    };
  }

  return {
    intent: bestMatch,
    confidence: Math.min(bestScore + bestMatch.confidence * 0.3, 1.0),
    chips: generateChips(bestMatch),
  };
}
```

### 3.3 Confidence Thresholds

| Context | Threshold | Behavior |
|---------|-----------|----------|
| Normal | 0.5 | Route to best match |
| Low comfort | 0.3 | Route even with weak match |
| Below threshold | — | Show all options as chips |

### 3.4 Generated Chips

```javascript
function generateChips(bestIntent, allScores, context) {
  const chips = [
    {
      id: bestIntent.id,
      label: bestIntent.label,
      icon: bestIntent.icon,
      path: bestIntent.destination,
      primary: true,
      confidence: bestIntent.confidence,
    }
  ];
  
  // Add top 2 secondary matches
  const secondary = allScores
    .filter(s => s.intent.id !== bestIntent.id && s.score > 0.1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
  
  for (const { intent } of secondary) {
    chips.push({
      id: intent.id,
      label: intent.label,
      icon: intent.icon,
      path: intent.destination,
      primary: false,
    });
  }
  
  // Always include decision helper
  chips.push({
    id: 'DECIDE',
    label: 'Help me decide →',
    icon: '❓',
    action: 'decide',
  });
  
  return chips;
}
```

---

## 4. VOICE RECOGNITION

### 4.1 Web Speech API Wrapper

```javascript
class PHOSVoice {
  constructor(onResult, onError) {
    this.recognition = null;
    this.onResult = onResult;
    this.onError = onError;
    this.isListening = false;
    this.init();
  }
  
  init() {
    if (typeof window === 'undefined') return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('PHOS: Speech recognition not supported');
      return;
    }
    
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
    
    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      this.isListening = false;
      if (this.onResult) this.onResult(transcript);
    };
    
    this.recognition.onerror = (event) => {
      this.isListening = false;
      if (this.onError) this.onError(event.error);
    };
    
    this.recognition.onend = () => {
      this.isListening = false;
    };
  }
  
  start() {
    if (!this.recognition) {
      this.onError?.('Speech recognition not available');
      return false;
    }
    
    try {
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (err) {
      this.onError?.(err.message);
      return false;
    }
  }
  
  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
}
```

### 4.2 Voice Button States

| State | Visual | Text |
|-------|--------|------|
| Idle | 🎤 Microphone icon | "Or just speak" |
| Listening | 🔴 Pulsing red ring | "Listening..." |
| Processing | Spinner | Transcript appears |
| Error | ⚠️ | "Didn't catch that. Try again?" |

### 4.3 Voice Integration Flow

```
User taps voice button
         │
         ▼
[LISTENING] ──────► Voice API active
         │
         ▼
Speech detected
         │
         ▼
[PROCESSING] ──────► Transcript shown
         │
         ▼
Intent matched ──────► Route to destination
         │
         ▼
[ROUTING] ──────► 800ms transition
         │
         ▼
[CONTENT] ──────► Destination loaded
```

---

## 5. UI COMPONENTS

### 5.1 Layout Structure

```
┌─────────────────────────────────────────┐
│ [P31] PHOS              [Safe Mode]     │  ← Header (fixed)
├─────────────────────────────────────────┤
│                                         │
│         Hello.                          │  ← Greeting (800ms)
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Whose mesh are we building today?      │  ← Question (persistent)
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🙋  For Myself               →  │   │
│  │     Passport, sovereign tools   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🏠  For My Family            →  │   │
│  │     Bonding, coordination         │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 💼  I'm a Professional       →  │   │
│  │     Research, documentation     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │         [🔴]                   │   │
│  │    Or just speak                │   │
│  │    "I need help with my IEP"    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  "I need help..." → For My Family       │  ← Transcript
│                                         │
├─────────────────────────────────────────┤
│  P31 Labs · Hub · Welcome               │  ← Footer
└─────────────────────────────────────────┘
```

### 5.2 Header Component

```html
<header class="phos-header">
  <a href="/" class="phos-logo">
    <div class="phos-mark">P31</div>
    <span class="phos-logo-text">PHOS</span>
  </a>
  <button class="phos-safe" id="safeBtn">Safe Mode</button>
</header>
```

```css
.phos-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
  padding-top: 0.5rem;
}

.phos-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: inherit;
}

.phos-mark {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: linear-gradient(135deg, #25897d 0%, #1a6b62 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
}

.phos-logo-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  opacity: 0.7;
}

.phos-safe {
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(255, 100, 100, 0.3);
  border-radius: 6px;
  background: rgba(255, 100, 100, 0.08);
  color: #ff8080;
  font-size: 0.7rem;
  font-family: 'JetBrains Mono', monospace;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.2s ease;
}

.phos-safe:hover {
  background: rgba(255, 100, 100, 0.15);
  border-color: rgba(255, 100, 100, 0.5);
}
```

### 5.3 Choice Card Component

```html
<a href="/passport" class="phos-choice" data-choice="self">
  <span class="phos-choice-icon">🙋</span>
  <span class="phos-choice-text">
    <span class="phos-choice-label">For Myself</span>
    <span class="phos-choice-hint">Passport, sovereign tools</span>
  </span>
  <span class="phos-choice-arrow">→</span>
</a>
```

```css
.phos-choice {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  color: inherit;
  text-decoration: none;
  cursor: pointer;
  transition: all 200ms ease;
}

.phos-choice:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(37, 137, 125, 0.5);
  transform: translateY(-2px);
}

.phos-choice-icon {
  font-size: 1.75rem;
  flex-shrink: 0;
}

.phos-choice-text {
  flex: 1;
}

.phos-choice-label {
  display: block;
  font-size: 1.1rem;
  font-weight: 600;
}

.phos-choice-hint {
  display: block;
  font-size: 0.85rem;
  color: #888;
  font-family: 'JetBrains Mono', monospace;
}

.phos-choice-arrow {
  font-size: 1.25rem;
  opacity: 0.4;
  transition: opacity 200ms ease;
}

.phos-choice:hover .phos-choice-arrow {
  opacity: 0.8;
}
```

### 5.4 Voice Input Component

```html
<div class="phos-voice">
  <button class="phos-voice-btn" id="voiceBtn" aria-label="Speak to navigate">🎤</button>
  <span class="phos-voice-label">Or just speak</span>
  <span class="phos-voice-hint">"I need help with my kid's IEP"</span>
</div>
```

```css
.phos-voice {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);
}

.phos-voice-btn {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 2px solid rgba(37, 137, 125, 0.4);
  background: rgba(37, 137, 125, 0.1);
  color: #4db8a8;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.phos-voice-btn:hover {
  background: rgba(37, 137, 125, 0.2);
  border-color: rgba(37, 137, 125, 0.6);
  transform: scale(1.05);
}

.phos-voice-btn.listening {
  background: rgba(204, 98, 71, 0.2);
  border-color: rgba(204, 98, 71, 0.6);
  animation: pulse-ring 1.5s ease-out infinite;
}

@keyframes pulse-ring {
  0% { box-shadow: 0 0 0 0 rgba(204, 98, 71, 0.4); }
  100% { box-shadow: 0 0 0 20px rgba(204, 98, 71, 0); }
}

.phos-voice-label {
  font-size: 0.8rem;
  color: #666;
  font-family: 'JetBrains Mono', monospace;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.phos-voice-hint {
  font-size: 0.85rem;
  color: #555;
  font-style: italic;
}
```

---

## 6. SAFE MODE (URGENT STATE)

### 6.1 Triggers

- **Button:** "Safe Mode" in header
- **URL param:** `?safe=1`, `?urgent=1`, `?crisis=1`
- **Voice:** Crisis words detected ("help", "panic", "overwhelm")
- **Passport:** `screenComfort < 20`

### 6.2 Safe Mode UI

```
┌─────────────────────────────────────────┐
│ [P31] PHOS                              │
├─────────────────────────────────────────┤
│                                         │
│              🛡️                         │
│         Safe Mode                       │
│   Minimal interface. No animations.     │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Go to welcome page           →  │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ Open Cognitive Passport      →  │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ Start grounding exercise     →  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Exit Safe Mode (hold 2 seconds)]      │
│                                         │
└─────────────────────────────────────────┘
```

### 6.3 Safe Mode Implementation

```javascript
function enterSafeMode() {
  state.safeMode = true;
  document.getElementById('question').classList.add('hidden');
  document.getElementById('greeting').classList.add('hidden');
  document.getElementById('safeMode').classList.add('active');
  document.body.style.background = '#050505';
  
  // Remove all animations
  document.documentElement.classList.add('phos-gray-rock');
}

function exitSafeMode() {
  state.safeMode = false;
  document.getElementById('safeMode').classList.remove('active');
  document.getElementById('question').classList.remove('hidden');
  document.body.style.background = '';
  document.documentElement.classList.remove('phos-gray-rock');
}
```

### 6.4 Exit Safe Mode

Requires holding button for 2 seconds (prevents accidental exit):

```javascript
let exitTimer = null;
const exitBtn = document.getElementById('exitSafe');

exitBtn.addEventListener('mousedown', () => {
  exitBtn.style.opacity = '1';
  exitTimer = setTimeout(() => {
    exitSafeMode();
  }, 2000);
});

exitBtn.addEventListener('mouseup', () => {
  clearTimeout(exitTimer);
  exitBtn.style.opacity = '';
});
```

---

## 7. COMPLETE IMPLEMENTATION

### 7.1 Full phos.html

```html
<!DOCTYPE html>
<html lang="en" data-p31-appearance="hub" style="color-scheme: dark;">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#0b0d10" />
  <meta name="description" content="PHOS — Voice-first navigation. Tell us what you need, we'll show you the door." />
  <title>PHOS · P31 Labs</title>
  <link rel="canonical" href="https://p31ca.org/phos" />
  
  <meta property="og:type" content="website" />
  <meta property="og:title" content="PHOS · P31 Labs" />
  <meta property="og:description" content="Voice-first navigation. Tell us what you need, we'll show you the door." />
  <meta property="og:url" content="https://p31ca.org/phos" />
  
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/p31-style.css" />
  
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    html, body {
      min-height: 100vh;
      background: #0b0d10;
      color: #e8e6e1;
      font-family: 'Atkinson Hyperlegible', system-ui, sans-serif;
      line-height: 1.5;
    }
    
    .phos-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      padding: 1.5rem;
      max-width: 600px;
      margin: 0 auto;
    }
    
    .phos-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 3rem;
      padding-top: 0.5rem;
    }
    
    .phos-logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
      color: inherit;
    }
    
    .phos-mark {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: linear-gradient(135deg, #25897d 0%, #1a6b62 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      color: #fff;
    }
    
    .phos-logo-text {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      opacity: 0.7;
    }
    
    .phos-safe {
      padding: 0.5rem 0.75rem;
      border: 1px solid rgba(255, 100, 100, 0.3);
      border-radius: 6px;
      background: rgba(255, 100, 100, 0.08);
      color: #ff8080;
      font-size: 0.7rem;
      font-family: 'JetBrains Mono', monospace;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .phos-safe:hover {
      background: rgba(255, 100, 100, 0.15);
      border-color: rgba(255, 100, 100, 0.5);
    }
    
    .phos-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    
    .phos-greeting {
      text-align: center;
      animation: fadeIn 0.8s ease-out;
    }
    
    .phos-greeting h1 {
      font-size: 2.5rem;
      font-weight: 400;
      margin-bottom: 0.5rem;
      letter-spacing: -0.02em;
    }
    
    .phos-greeting p {
      color: #888;
      font-size: 1rem;
    }
    
    .phos-question {
      animation: fadeInUp 0.5s ease-out;
    }
    
    .phos-question h2 {
      font-size: clamp(1.5rem, 5vw, 2rem);
      font-weight: 400;
      margin-bottom: 2.5rem;
      line-height: 1.3;
      color: #fff;
    }
    
    .phos-choices {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 2rem;
    }
    
    .phos-choice {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.03);
      color: inherit;
      text-decoration: none;
      cursor: pointer;
      transition: all 200ms ease;
    }
    
    .phos-choice:hover {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(37, 137, 125, 0.5);
      transform: translateY(-2px);
    }
    
    .phos-choice-icon {
      font-size: 1.75rem;
      flex-shrink: 0;
    }
    
    .phos-choice-text {
      flex: 1;
    }
    
    .phos-choice-label {
      display: block;
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }
    
    .phos-choice-hint {
      display: block;
      font-size: 0.85rem;
      color: #888;
      font-family: 'JetBrains Mono', monospace;
    }
    
    .phos-choice-arrow {
      font-size: 1.25rem;
      opacity: 0.4;
      transition: opacity 200ms ease;
    }
    
    .phos-choice:hover .phos-choice-arrow {
      opacity: 0.8;
    }
    
    .phos-voice {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      padding: 1.5rem;
      border: 1px dashed rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.02);
    }
    
    .phos-voice-btn {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      border: 2px solid rgba(37, 137, 125, 0.4);
      background: rgba(37, 137, 125, 0.1);
      color: #4db8a8;
      font-size: 1.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .phos-voice-btn:hover {
      background: rgba(37, 137, 125, 0.2);
      border-color: rgba(37, 137, 125, 0.6);
      transform: scale(1.05);
    }
    
    .phos-voice-btn.listening {
      background: rgba(204, 98, 71, 0.2);
      border-color: rgba(204, 98, 71, 0.6);
      animation: pulse-ring 1.5s ease-out infinite;
    }
    
    @keyframes pulse-ring {
      0% { box-shadow: 0 0 0 0 rgba(204, 98, 71, 0.4); }
      100% { box-shadow: 0 0 0 20px rgba(204, 98, 71, 0); }
    }
    
    .phos-voice-label {
      font-size: 0.8rem;
      color: #666;
      font-family: 'JetBrains Mono', monospace;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    
    .phos-voice-hint {
      font-size: 0.85rem;
      color: #555;
      font-style: italic;
    }
    
    .phos-safe-mode {
      display: none;
      animation: fadeIn 0.3s ease-out;
    }
    
    .phos-safe-mode.active {
      display: block;
    }
    
    .phos-safe-header {
      text-align: center;
      margin-bottom: 3rem;
    }
    
    .phos-safe-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }
    
    .phos-safe-title {
      font-size: 1.75rem;
      margin-bottom: 0.5rem;
    }
    
    .phos-safe-desc {
      color: #888;
      font-size: 1rem;
    }
    
    .phos-safe-actions {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .phos-safe-btn {
      padding: 1.25rem;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.05);
      color: inherit;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      justify-content: space-between;
      align-items: center;
      text-decoration: none;
    }
    
    .phos-safe-btn:hover {
      background: rgba(255, 255, 255, 0.08);
    }
    
    .phos-safe-btn.primary {
      background: rgba(37, 137, 125, 0.2);
      border-color: rgba(37, 137, 125, 0.4);
    }
    
    .phos-transcript {
      margin-top: 1rem;
      padding: 1rem;
      border-radius: 8px;
      background: rgba(37, 137, 125, 0.1);
      border: 1px solid rgba(37, 137, 125, 0.3);
      font-size: 0.95rem;
      color: #4db8a8;
      min-height: 3rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .phos-transcript:empty {
      display: none;
    }
    
    .phos-transcript::before {
      content: '"';
      opacity: 0.5;
      margin-right: 0.25rem;
    }
    
    .phos-transcript::after {
      content: '"';
      opacity: 0.5;
      margin-left: 0.25rem;
    }
    
    .hidden { display: none !important; }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    }
    
    .phos-footer {
      margin-top: auto;
      padding-top: 2rem;
      text-align: center;
      font-size: 0.75rem;
      color: #555;
      font-family: 'JetBrains Mono', monospace;
    }
    
    .phos-footer a {
      color: #25897d;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="phos-container" id="phosApp">
    <header class="phos-header">
      <a href="/" class="phos-logo">
        <div class="phos-mark">P31</div>
        <span class="phos-logo-text">PHOS</span>
      </a>
      <button class="phos-safe" id="safeBtn">Safe Mode</button>
    </header>
    
    <main class="phos-main">
      <div id="greeting" class="phos-greeting">
        <h1>Hello.</h1>
        <p>Initializing...</p>
      </div>
      
      <div id="question" class="phos-question hidden">
        <h2>Whose mesh are we building today?</h2>
        
        <div class="phos-choices">
          <a href="/passport" class="phos-choice" data-choice="self">
            <span class="phos-choice-icon">🙋</span>
            <span class="phos-choice-text">
              <span class="phos-choice-label">For Myself</span>
              <span class="phos-choice-hint">Cognitive passport, sovereign tools</span>
            </span>
            <span class="phos-choice-arrow">→</span>
          </a>
          
          <a href="/lab" class="phos-choice" data-choice="family">
            <span class="phos-choice-icon">🏠</span>
            <span class="phos-choice-text">
              <span class="phos-choice-label">For My Family</span>
              <span class="phos-choice-hint">Bonding, coordination, shared tools</span>
            </span>
            <span class="phos-choice-arrow">→</span>
          </a>
          
          <a href="/glass-box" class="phos-choice" data-choice="pro">
            <span class="phos-choice-icon">💼</span>
            <span class="phos-choice-text">
              <span class="phos-choice-label">I'm a Professional</span>
              <span class="phos-choice-hint">Research, documentation, operator tools</span>
            </span>
            <span class="phos-choice-arrow">→</span>
          </a>
        </div>
        
        <div class="phos-voice">
          <button class="phos-voice-btn" id="voiceBtn" aria-label="Speak to navigate">🎤</button>
          <span class="phos-voice-label">Or just speak</span>
          <span class="phos-voice-hint">"I need help with my kid's IEP"</span>
        </div>
        
        <div id="transcript" class="phos-transcript hidden"></div>
      </div>
      
      <div id="safeMode" class="phos-safe-mode">
        <div class="phos-safe-header">
          <div class="phos-safe-icon">🛡️</div>
          <h2 class="phos-safe-title">Safe Mode</h2>
          <p class="phos-safe-desc">Minimal interface. No animations.</p>
        </div>
        
        <div class="phos-safe-actions">
          <a href="/welcome" class="phos-safe-btn primary">
            <span>Go to welcome page</span>
            <span>→</span>
          </a>
          <a href="/passport" class="phos-safe-btn">
            <span>Open Cognitive Passport</span>
            <span>→</span>
          </a>
          <a href="/layer0" class="phos-safe-btn">
            <span>Start grounding exercise</span>
            <span>→</span>
          </a>
        </div>
        
        <button id="exitSafe" class="phos-safe-btn" style="margin-top: 2rem; justify-content: center; opacity: 0.6;">
          Exit Safe Mode (hold 2 seconds)
        </button>
      </div>
    </main>
    
    <footer class="phos-footer">
      P31 Labs, Inc. · <a href="/">Hub</a> · <a href="/welcome">Welcome</a>
    </footer>
  </div>
  
  <script>
    // PHOS State
    const state = {
      isListening: false,
      recognition: null,
      safeMode: false
    };
    
    // Intent Catalog
    const intents = [
      { 
        id: 'self', 
        patterns: ['myself', 'me', 'my', 'personal', 'alone', 'individual', 'self', 'i am', 'passport'],
        url: '/passport',
        label: 'For Myself'
      },
      { 
        id: 'family', 
        patterns: ['family', 'household', 'kids', 'children', 'parents', 'home', 'together', 'us', 'we', 'partner', 'kid', 'my child', 'my kid'],
        url: '/lab',
        label: 'For My Family'
      },
      { 
        id: 'pro', 
        patterns: ['professional', 'work', 'job', 'career', 'developer', 'engineer', 'doctor', 'therapist', 'clinician', 'researcher', 'teacher', 'educator'],
        url: '/glass-box',
        label: 'For Professionals'
      },
      { 
        id: 'help', 
        patterns: ['help', 'support', 'emergency', 'crisis', 'panic', 'anxiety', 'overwhelm', 'too much'],
        url: '/welcome',
        label: 'Help'
      }
    ];
    
    // Elements
    const greeting = document.getElementById('greeting');
    const question = document.getElementById('question');
    const safeModeScreen = document.getElementById('safeMode');
    const voiceBtn = document.getElementById('voiceBtn');
    const safeBtn = document.getElementById('safeBtn');
    const transcript = document.getElementById('transcript');
    const exitSafeBtn = document.getElementById('exitSafe');
    
    // Initialize
    function init() {
      const params = new URLSearchParams(window.location.search);
      if (params.has('safe') || params.has('urgent') || params.has('crisis')) {
        enterSafeMode();
        return;
      }
      
      setTimeout(() => {
        greeting.classList.add('hidden');
        question.classList.remove('hidden');
      }, 800);
      
      initVoice();
    }
    
    // Voice Recognition
    function initVoice() {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        voiceBtn.style.display = 'none';
        return;
      }
      
      state.recognition = new SpeechRecognition();
      state.recognition.continuous = false;
      state.recognition.interimResults = false;
      state.recognition.lang = 'en-US';
      
      state.recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        handleVoiceInput(text);
        stopListening();
      };
      
      state.recognition.onerror = () => {
        stopListening();
        transcript.textContent = "Didn't catch that. Try again?";
        transcript.classList.remove('hidden');
      };
      
      state.recognition.onend = () => {
        stopListening();
      };
    }
    
    function startListening() {
      if (!state.recognition) return;
      
      try {
        state.recognition.start();
        state.isListening = true;
        voiceBtn.classList.add('listening');
        voiceBtn.textContent = '🔴';
        transcript.textContent = 'Listening...';
        transcript.classList.remove('hidden');
      } catch (err) {
        console.error('Failed to start listening:', err);
      }
    }
    
    function stopListening() {
      state.isListening = false;
      voiceBtn.classList.remove('listening');
      voiceBtn.textContent = '🎤';
    }
    
    function handleVoiceInput(text) {
      transcript.textContent = text;
      transcript.classList.remove('hidden');
      
      const normalized = text.toLowerCase().trim();
      let matchedIntent = null;
      let bestScore = 0;
      
      for (const intent of intents) {
        let score = 0;
        for (const pattern of intent.patterns) {
          if (normalized.includes(pattern)) {
            score += pattern.length > 4 ? 0.3 : 0.2;
          }
        }
        if (score > bestScore) {
          bestScore = score;
          matchedIntent = intent;
        }
      }
      
      const crisisWords = ['help', 'crisis', 'panic', 'emergency', 'stop', 'overwhelm'];
      if (crisisWords.some(w => normalized.includes(w))) {
        enterSafeMode();
        return;
      }
      
      if (matchedIntent && bestScore > 0.2) {
        transcript.innerHTML = `${text} <span style="opacity:0.6">→ ${matchedIntent.label}</span>`;
        setTimeout(() => {
          window.location.href = matchedIntent.url;
        }, 800);
      } else {
        transcript.textContent = `${text} — try "myself", "family", or "professional"`;
      }
    }
    
    // Safe Mode
    function enterSafeMode() {
      state.safeMode = true;
      question.classList.add('hidden');
      greeting.classList.add('hidden');
      safeModeScreen.classList.add('active');
      document.body.style.background = '#050505';
    }
    
    function exitSafeMode() {
      state.safeMode = false;
      safeModeScreen.classList.remove('active');
      question.classList.remove('hidden');
      document.body.style.background = '';
    }
    
    // Event Listeners
    voiceBtn.addEventListener('click', () => {
      if (state.isListening) {
        state.recognition?.stop();
        stopListening();
      } else {
        startListening();
      }
    });
    
    safeBtn.addEventListener('click', enterSafeMode);
    
    let exitTimer = null;
    exitSafeBtn.addEventListener('mousedown', () => {
      exitSafeBtn.style.opacity = '1';
      exitTimer = setTimeout(() => {
        exitSafeMode();
      }, 2000);
    });
    
    exitSafeBtn.addEventListener('mouseup', () => {
      clearTimeout(exitTimer);
      exitSafeBtn.style.opacity = '';
    });
    
    exitSafeBtn.addEventListener('mouseleave', () => {
      clearTimeout(exitTimer);
      exitSafeBtn.style.opacity = '';
    });
    
    exitSafeBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      exitSafeBtn.style.opacity = '1';
      exitTimer = setTimeout(() => {
        exitSafeMode();
      }, 2000);
    });
    
    exitSafeBtn.addEventListener('touchend', () => {
      clearTimeout(exitTimer);
      exitSafeBtn.style.opacity = '';
    });
    
    // Start
    init();
  </script>
</body>
</html>
```

---

## 8. PHOS CORE MODULE (ES Module Version)

### 8.1 p31-phos-core.mjs

```javascript
/**
 * PHOS (Phosphorus31 Operating System) — Voice-first, inference-driven navigation
 * Core architecture: deterministic routing, progressive disclosure, crisis mode
 * @version 1.0.0
 */

export const PHOS_STATES = {
  GREETING: 'GREETING',
  INTENT: 'INTENT',
  ROUTING: 'ROUTING',
  CONTENT: 'CONTENT',
  URGENT: 'URGENT',
};

export const PHOS_PROFILES = {
  STANDARD: {
    bg: 'bg-slate-950',
    text: 'text-slate-200',
    accent: 'text-cyan-400',
    border: 'border-cyan-500/30',
    animation: true,
  },
  GRAY_ROCK: {
    bg: 'bg-black',
    text: 'text-gray-300',
    accent: 'text-gray-100',
    border: 'border-gray-800',
    animation: false,
  },
};

export const INTENT_CATALOG = [
  {
    id: 'SELF',
    patterns: ['myself', 'me', 'i', 'my', 'personal', 'alone', 'individual', 'self'],
    label: 'For Myself',
    icon: '🙋',
    hint: 'Passport, Sovereign Tools',
    destination: '/passport',
    confidence: 0.9,
  },
  {
    id: 'FAMILY',
    patterns: ['family', 'household', 'kids', 'children', 'parents', 'home', 'together', 'us', 'we', 'partner', 'spouse'],
    label: 'For My Family',
    icon: '🏠',
    hint: 'Bonding, Social Molecules',
    destination: '/lab',
    confidence: 0.85,
  },
  {
    id: 'PRO',
    patterns: ['professional', 'work', 'job', 'career', 'developer', 'engineer', 'doctor', 'therapist', 'clinician', 'researcher'],
    label: "I'm a Professional",
    icon: '💼',
    hint: 'Research, Docs, Operator',
    destination: '/glass-box',
    confidence: 0.8,
  },
  {
    id: 'CRISIS',
    patterns: ['help', 'crisis', 'overwhelm', 'panic', 'anxiety', 'emergency', 'too much', 'stop', 'safe', 'calm'],
    label: 'I need help now',
    icon: '🆘',
    hint: 'Safe mode — minimal stimulation',
    destination: '/welcome',
    confidence: 1.0,
    urgent: true,
  },
];

export function inferIntent(input, context = {}) {
  if (!input || typeof input !== 'string') {
    return { intent: null, confidence: 0, chips: [] };
  }

  const normalized = input.toLowerCase().trim();
  const words = normalized.split(/\s+/);
  
  let bestMatch = null;
  let bestScore = 0;
  const scores = [];

  for (const intent of INTENT_CATALOG) {
    let score = 0;
    
    for (const pattern of intent.patterns) {
      if (normalized.includes(pattern)) {
        score += pattern.length >= 5 ? 0.3 : 0.2;
      }
    }
    
    for (const word of words) {
      if (intent.patterns.includes(word)) {
        score += 0.25;
      }
    }
    
    if (intent.patterns.some(p => p === normalized)) {
      score += 0.5;
    }
    
    scores.push({ intent, score });
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = intent;
    }
  }

  const crisisWords = ['help', 'crisis', 'panic', 'emergency', 'stop', 'overwhelm'];
  if (crisisWords.some(w => normalized.includes(w))) {
    const crisisIntent = INTENT_CATALOG.find(i => i.id === 'CRISIS');
    if (crisisIntent) {
      return {
        intent: crisisIntent,
        confidence: 1.0,
        urgent: true,
        chips: generateChips(crisisIntent, scores, context),
      };
    }
  }

  const confidenceThreshold = context.screenComfort < 30 ? 0.3 : 0.5;
  
  if (bestScore < confidenceThreshold || !bestMatch) {
    return {
      intent: null,
      confidence: 0,
      chips: generateStandardChips(scores, context),
    };
  }

  return {
    intent: bestMatch,
    confidence: Math.min(bestScore + bestMatch.confidence * 0.3, 1.0),
    chips: generateChips(bestMatch, scores, context),
  };
}

function generateChips(bestIntent, allScores, context) {
  const chips = [
    {
      id: bestIntent.id,
      label: bestIntent.label,
      icon: bestIntent.icon,
      path: bestIntent.destination,
      primary: true,
      confidence: bestIntent.confidence,
    }
  ];
  
  const secondary = allScores
    .filter(s => s.intent.id !== bestIntent.id && s.score > 0.1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
  
  for (const { intent } of secondary) {
    chips.push({
      id: intent.id,
      label: intent.label,
      icon: intent.icon,
      path: intent.destination,
      primary: false,
    });
  }
  
  chips.push({
    id: 'DECIDE',
    label: 'Help me decide →',
    icon: '❓',
    action: 'decide',
    primary: false,
  });
  
  return chips;
}

function generateStandardChips(scores, context) {
  return INTENT_CATALOG
    .filter(i => i.id !== 'CRISIS')
    .map(intent => ({
      id: intent.id,
      label: intent.label,
      icon: intent.icon,
      path: intent.destination,
      primary: false,
    }));
}

export class PHOSVoice {
  constructor(onResult, onError) {
    this.recognition = null;
    this.onResult = onResult;
    this.onError = onError;
    this.isListening = false;
    this.init();
  }
  
  init() {
    if (typeof window === 'undefined') return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('PHOS: Speech recognition not supported');
      return;
    }
    
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
    
    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      this.isListening = false;
      if (this.onResult) this.onResult(transcript);
    };
    
    this.recognition.onerror = (event) => {
      this.isListening = false;
      if (this.onError) this.onError(event.error);
    };
    
    this.recognition.onend = () => {
      this.isListening = false;
    };
  }
  
  start() {
    if (!this.recognition) {
      this.onError?.('Speech recognition not available');
      return false;
    }
    
    try {
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (err) {
      this.onError?.(err.message);
      return false;
    }
  }
  
  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
}

export class PHOSController {
  constructor(options = {}) {
    this.state = PHOS_STATES.GREETING;
    this.profile = PHOS_PROFILES.STANDARD;
    this.currentIntent = null;
    this.contentCache = new Map();
    this.listeners = new Set();
    this.voice = null;
    this.urgentMode = false;
    
    this.context = {
      screenComfort: 100,
      soundComfort: 100,
      hasPassport: false,
      ...options.context,
    };
    
    this.init();
  }
  
  init() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('urgent') || params.has('safe') || this.context.screenComfort < 20) {
      this.enterUrgentMode();
    }
    
    if (this.state === PHOS_STATES.GREETING) {
      setTimeout(() => {
        if (this.state === PHOS_STATES.GREETING) {
          this.transitionTo(PHOS_STATES.INTENT);
        }
      }, 2500);
    }
  }
  
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  notify() {
    const state = {
      state: this.state,
      profile: this.profile,
      intent: this.currentIntent,
      context: this.context,
      urgent: this.urgentMode,
    };
    
    for (const listener of this.listeners) {
      listener(state);
    }
    
    window.dispatchEvent(new CustomEvent('p31:phos-state', { detail: state }));
  }
  
  transitionTo(newState, data = {}) {
    const oldState = this.state;
    this.state = newState;
    
    if (data.intent) {
      this.currentIntent = data.intent;
    }
    
    this.notify();
    console.log(`PHOS: ${oldState} → ${newState}`);
    
    if (newState === PHOS_STATES.CONTENT && data.destination) {
      this.loadContent(data.destination);
    }
  }
  
  enterUrgentMode() {
    this.urgentMode = true;
    this.profile = PHOS_PROFILES.GRAY_ROCK;
    this.transitionTo(PHOS_STATES.URGENT);
    document.documentElement.classList.add('phos-gray-rock');
    document.documentElement.style.setProperty('--phos-animation', 'none');
  }
  
  exitUrgentMode() {
    this.urgentMode = false;
    this.profile = PHOS_PROFILES.STANDARD;
    document.documentElement.classList.remove('phos-gray-rock');
    document.documentElement.style.removeProperty('--phos-animation');
    this.transitionTo(PHOS_STATES.INTENT);
  }
  
  handleVoiceInput(transcript) {
    const inference = inferIntent(transcript, this.context);
    
    if (inference.urgent || inference.intent?.urgent) {
      this.enterUrgentMode();
      return;
    }
    
    if (inference.intent && inference.confidence >= 0.5) {
      this.transitionTo(PHOS_STATES.ROUTING, { intent: inference.intent });
      
      setTimeout(() => {
        this.transitionTo(PHOS_STATES.CONTENT, { 
          destination: inference.intent.destination,
          intent: inference.intent,
        });
      }, 1500);
    } else {
      this.currentIntent = { chips: inference.chips };
      this.notify();
    }
  }
  
  handleChipSelection(chip) {
    if (chip.action === 'decide') {
      this.currentIntent = {
        chips: [
          { label: 'For myself', path: '/passport', icon: '🙋' },
          { label: 'For my family', path: '/lab', icon: '🏠' },
          { label: 'As a professional', path: '/glass-box', icon: '💼' },
          { label: '← Back', action: 'back', icon: '←' },
        ],
      };
      this.notify();
      return;
    }
    
    if (chip.action === 'back') {
      this.transitionTo(PHOS_STATES.INTENT);
      return;
    }
    
    if (chip.path) {
      this.transitionTo(PHOS_STATES.ROUTING, { intent: chip });
      
      setTimeout(() => {
        this.transitionTo(PHOS_STATES.CONTENT, { 
          destination: chip.path,
          intent: chip,
        });
      }, 800);
    }
  }
  
  startVoice() {
    if (!this.voice) {
      this.voice = new PHOSVoice(
        (transcript) => this.handleVoiceInput(transcript),
        (error) => console.error('PHOS Voice error:', error)
      );
    }
    
    return this.voice.start();
  }
  
  stopVoice() {
    if (this.voice) {
      this.voice.stop();
    }
  }
}

export function createPHOS(options = {}) {
  const phos = new PHOSController(options);
  
  if (typeof window !== 'undefined') {
    window.phos = phos;
  }
  
  return phos;
}

export default { createPHOS, PHOSController, PHOSVoice, inferIntent, INTENT_CATALOG, PHOS_STATES, PHOS_PROFILES };
```

---

## 9. ACCESSIBILITY

### 9.1 Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Move between interactive elements |
| Enter/Space | Activate button or link |
| Escape | Exit safe mode (if held 2 seconds) |
| Arrow keys | Navigate choice cards |

### 9.2 Screen Reader Support

```html
<!-- Skip link -->
<a href="#main" class="skip-link">Skip to main content</a>

<!-- Choice cards with ARIA -->
<a href="/passport" class="phos-choice" aria-label="For Myself - Cognitive passport and sovereign tools">

<!-- Live region for voice transcript -->
<div id="transcript" class="phos-transcript" aria-live="polite" aria-atomic="true"></div>

<!-- Safe mode announcement -->
<div id="safeMode" class="phos-safe-mode" role="alert" aria-label="Safe mode activated">
```

### 9.3 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 10. DEPLOYMENT

### 10.1 File Locations

```
public/
├── phos.html                    # Main PHOS entry point
└── lib/
    ├── p31-phos-core.mjs        # Core engine (optional, for advanced use)
    └── p31-phos-ui.mjs          # UI components (optional)
```

### 10.2 Live URL

**Production:** `https://p31ca.org/phos`

### 10.3 URL Parameters

| Parameter | Effect |
|-----------|--------|
| `?safe=1` | Enter safe mode |
| `?urgent=1` | Enter safe mode |
| `?crisis=1` | Enter safe mode |

---

## 11. REFERENCES

- **This spec:** `docs/P31-PHOS-COMPLETE-SPEC.md`
- **Design system:** `docs/P31CA-DESIGN-SPECIFICATION.md`
- **Starfield:** `docs/P31-STARFIELD-COMPLETE-SPEC.md`
- **Live demo:** `https://p31ca.org/phos`

---

**END OF SPECIFICATION**
