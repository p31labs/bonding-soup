/**
 * PHOS Core v2.0
 * Phosphorus31 Operating System
 * Akinator engine + Circuit breaker power levels
 */

export class PHOS {
  constructor(options = {}) {
    this.options = {
      mount: options.mount || '#phos-orb',
      pageId: options.pageId || 'unknown',
      powerLevels: options.powerLevels || [0, 1, 2, 3, 4, 5, 6],
      ...options
    };
    
    this.state = {
      level: 2, // Default: Standard
      expanded: false,
      listening: false,
      currentQuestion: 'root',
      intentHistory: [],
      userIntents: this.loadUserIntents()
    };
    
    this.intents = {
      root: {
        question: "Whose mesh are we building today?",
        type: 'choice',
        options: [
          { id: 'SELF', label: 'For Myself', icon: '🙋', hint: 'Passport, sovereign tools', path: '/passport', next: null },
          { id: 'FAMILY', label: 'For My Family', icon: '🏠', hint: 'Bonding, coordination', path: '/soup', next: null },
          { id: 'PRO', label: "I'm a Professional", icon: '💼', hint: 'Research, docs, tools', path: '/glass-box', next: null },
          { id: 'CRISIS', label: 'I need help now', icon: '🆘', hint: 'Safe mode — minimal', path: '/welcome?safe=1', next: null, urgent: true }
        ]
      }
    };
    
    this.recognition = null;
    this.voiceEnabled = false;
    
    this.init();
  }
  
  init() {
    this.mountOrb();
    this.initVoice();
    this.updatePowerDisplay();
    
    // Auto-detect crisis words in URL
    if (window.location.search.includes('safe=1') || window.location.search.includes('crisis=1')) {
      this.setPowerLevel(0);
    }
    
    console.log(`[PHOS] Initialized on ${this.options.pageId} at level ${this.state.level}`);
  }
  
  mountOrb() {
    const orb = document.querySelector(this.options.mount);
    if (!orb) return;
    
    // Click to expand
    orb.addEventListener('click', () => this.toggle());
    
    // Double-click to auto-level
    orb.addEventListener('dblclick', () => this.autoLevel());
    
    // Long press for manual level select
    let pressTimer;
    orb.addEventListener('mousedown', () => {
      pressTimer = setTimeout(() => this.showLevelSelector(), 500);
    });
    orb.addEventListener('mouseup', () => clearTimeout(pressTimer));
    orb.addEventListener('mouseleave', () => clearTimeout(pressTimer));
  }
  
  toggle() {
    if (this.state.expanded) {
      this.collapse();
    } else {
      this.expand();
    }
  }
  
  expand() {
    this.state.expanded = true;
    this.renderPanel();
    
    // Announce for screen readers
    this.announce('PHOS navigation opened');
  }
  
  collapse() {
    this.state.expanded = false;
    const panel = document.getElementById('phos-panel');
    if (panel) panel.remove();
  }
  
  renderPanel() {
    // Remove existing
    const existing = document.getElementById('phos-panel');
    if (existing) existing.remove();
    
    const currentQ = this.intents[this.state.currentQuestion];
    
    const panel = document.createElement('div');
    panel.id = 'phos-panel';
    panel.className = 'phos-panel';
    panel.innerHTML = `
      <div class="phos-backdrop" onclick="window.phos.collapse()"></div>
      <div class="phos-card">
        <header class="phos-header">
          <h1>PHOS</h1>
          <button class="phos-close" onclick="window.phos.collapse()">×</button>
        </header>
        
        <div class="phos-greeting">
          <p>For every family out there figuring it out as they go — help is on the way.</p>
        </div>
        
        <div class="phos-content">
          <h2>${currentQ.question}</h2>
          <div class="phos-options">
            ${currentQ.options.map(opt => `
              <a href="${opt.path}" class="phos-option ${opt.urgent ? 'urgent' : ''}" 
                 data-intent="${opt.id}" 
                 onclick="window.phos.recordIntent('${opt.id}', '${opt.path}')">
                <span class="phos-icon">${opt.icon}</span>
                <span class="phos-text">
                  <span class="phos-label">${opt.label}</span>
                  <span class="phos-hint">${opt.hint}</span>
                </span>
                <span class="phos-arrow">→</span>
              </a>
            `).join('')}
          </div>
          
          ${this.voiceEnabled ? `
          <div class="phos-voice">
            <button class="phos-voice-btn ${this.state.listening ? 'listening' : ''}" 
                    onclick="window.phos.toggleVoice()">
              ${this.state.listening ? '🔴' : '🎤'}
            </button>
            <span>${this.state.listening ? 'Listening...' : 'Or just speak'}</span>
          </div>
          ` : ''}
          
          <div class="phos-power">
            <span>Power Level: ${this.getPowerLabel()}</span>
            <div class="phos-power-dots">
              ${this.options.powerLevels.map(l => `
                <span class="power-dot ${l === this.state.level ? 'active' : ''}" 
                      onclick="window.phos.setPowerLevel(${l})"></span>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(panel);
    
    // Add styles if not present
    if (!document.getElementById('phos-styles')) {
      this.addStyles();
    }
  }
  
  addStyles() {
    const style = document.createElement('style');
    style.id = 'phos-styles';
    style.textContent = `
      .phos-panel {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .phos-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        backdrop-filter: blur(4px);
      }
      .phos-card {
        position: relative;
        width: 90%;
        max-width: 400px;
        background: var(--p31-surface, #161920);
        border: 1px solid var(--p31-cyan, #4db8a8);
        border-radius: 16px;
        padding: 1.5rem;
        z-index: 10001;
        animation: phos-in 0.3s ease;
      }
      @keyframes phos-in {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .phos-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }
      .phos-header h1 {
        margin: 0;
        color: var(--p31-cyan, #4db8a8);
        font-family: var(--p31-font-mono, monospace);
      }
      .phos-close {
        background: none;
        border: none;
        color: var(--p31-cloud, var(--p31-cloud));
        font-size: 1.5rem;
        cursor: pointer;
      }
      .phos-greeting {
        color: var(--p31-muted, #6b7280);
        font-size: 0.9rem;
        margin-bottom: 1.5rem;
        font-style: italic;
      }
      .phos-content h2 {
        margin: 0 0 1rem;
        font-size: 1.1rem;
        color: var(--p31-cloud, var(--p31-cloud));
      }
      .phos-options {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }
      .phos-option {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem;
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 8px;
        color: inherit;
        text-decoration: none;
        cursor: pointer;
        transition: all 0.2s;
      }
      .phos-option:hover {
        background: rgba(77,184,168,0.1);
        border-color: var(--p31-cyan, #4db8a8);
      }
      .phos-option.urgent {
        border-color: var(--p31-coral, #cc6247);
      }
      .phos-icon {
        font-size: 1.5rem;
      }
      .phos-text {
        flex: 1;
      }
      .phos-label {
        display: block;
        font-weight: 600;
      }
      .phos-hint {
        display: block;
        font-size: 0.75rem;
        color: var(--p31-muted, #6b7280);
      }
      .phos-arrow {
        opacity: 0.5;
      }
      .phos-voice {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem;
        border: 1px dashed rgba(255,255,255,0.2);
        border-radius: 8px;
        margin-bottom: 1rem;
      }
      .phos-voice-btn {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 2px solid var(--p31-cyan, #4db8a8);
        background: rgba(77,184,168,0.1);
        cursor: pointer;
      }
      .phos-voice-btn.listening {
        animation: pulse 1.5s infinite;
      }
      @keyframes pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(204,98,71,0.4); }
        50% { box-shadow: 0 0 0 10px rgba(204,98,71,0); }
      }
      .phos-power {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 1rem;
        border-top: 1px solid rgba(255,255,255,0.1);
        font-size: 0.75rem;
        color: var(--p31-muted, #6b7280);
      }
      .phos-power-dots {
        display: flex;
        gap: 4px;
      }
      .power-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--p31-muted, #6b7280);
        cursor: pointer;
        transition: all 0.2s;
      }
      .power-dot.active {
        background: var(--p31-cyan, #4db8a8);
        box-shadow: 0 0 8px var(--p31-cyan, #4db8a8);
      }
    `;
    document.head.appendChild(style);
  }
  
  // Power Level Management
  setPowerLevel(level) {
    if (!this.options.powerLevels.includes(level)) return;
    
    this.state.level = level;
    this.updatePowerDisplay();
    
    // Apply level-specific changes
    if (level === 0) {
      document.body.classList.add('safe-mode');
      this.announce('Safe mode activated');
    } else {
      document.body.classList.remove('safe-mode');
    }
    
    // Save preference
    localStorage.setItem('p31-power-level', level.toString());
    
    console.log(`[PHOS] Power level set to ${level}: ${this.getPowerLabel()}`);
  }
  
  autoLevel() {
    // Auto-detect based on context
    const context = this.detectContext();
    
    if (context.sensoryOverload || context.crisisWords) {
      this.setPowerLevel(0);
    } else if (context.spoonDeficit) {
      this.setPowerLevel(1);
    } else if (context.complexTask) {
      this.setPowerLevel(4);
    } else {
      this.setPowerLevel(2);
    }
  }
  
  detectContext() {
    return {
      sensoryOverload: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      crisisWords: this.detectCrisisWords(),
      spoonDeficit: localStorage.getItem('p31-spoon-level') === 'low',
      complexTask: document.querySelector('[data-complex="true"]') !== null
    };
  }
  
  detectCrisisWords() {
    const crisisWords = ['help', 'crisis', 'panic', 'emergency', 'overwhelm', 'stop'];
    const url = window.location.href.toLowerCase();
    return crisisWords.some(word => url.includes(word));
  }
  
  getPowerLabel() {
    const labels = ['Gray Rock', 'Minimal', 'Standard', 'Enhanced', 'Pro', 'Expert', 'Centaur'];
    return labels[this.state.level] || 'Standard';
  }
  
  updatePowerDisplay() {
    const dots = document.querySelectorAll('.power-dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === this.state.level);
    });
  }
  
  // Voice Recognition
  initVoice() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return;
    }
    
    this.voiceEnabled = true;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
    
    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      this.handleVoiceInput(transcript);
      this.state.listening = false;
      this.renderPanel(); // Update UI
    };
    
    this.recognition.onerror = () => {
      this.state.listening = false;
      this.renderPanel();
    };
    
    this.recognition.onend = () => {
      this.state.listening = false;
    };
  }
  
  toggleVoice() {
    if (!this.recognition) return;
    
    if (this.state.listening) {
      this.recognition.stop();
      this.state.listening = false;
    } else {
      this.recognition.start();
      this.state.listening = true;
    }
    
    this.renderPanel();
  }
  
  handleVoiceInput(transcript) {
    const text = transcript.toLowerCase();
    
    // Crisis override
    if (this.detectCrisisWordsInText(text)) {
      this.setPowerLevel(0);
      window.location.href = '/welcome?safe=1';
      return;
    }
    
    // Match to intent
    for (const option of this.intents.root.options) {
      const patterns = this.getPatternsForIntent(option.id);
      if (patterns.some(p => text.includes(p))) {
        window.location.href = option.path;
        return;
      }
    }
    
    // No match - show all options
    this.announce(`Didn't understand "${transcript}". Please choose from the options.`);
  }
  
  detectCrisisWordsInText(text) {
    const crisisWords = ['help', 'crisis', 'panic', 'emergency', 'stop', 'overwhelm'];
    return crisisWords.some(w => text.includes(w));
  }
  
  getPatternsForIntent(intentId) {
    const patterns = {
      SELF: ['me', 'myself', 'my', 'alone', 'personal'],
      FAMILY: ['family', 'kids', 'children', 'home', 'together'],
      PRO: ['work', 'professional', 'job', 'research'],
      CRISIS: ['help', 'crisis', 'panic', 'emergency']
    };
    return patterns[intentId] || [];
  }
  
  // Learning / Intent Recording
  recordIntent(intentId, path) {
    this.state.intentHistory.push({
      intent: intentId,
      path: path,
      page: this.options.pageId,
      timestamp: Date.now(),
      powerLevel: this.state.level
    });
    
    // Update user model
    if (!this.state.userIntents[intentId]) {
      this.state.userIntents[intentId] = { count: 0, lastUsed: Date.now() };
    }
    this.state.userIntents[intentId].count++;
    this.state.userIntents[intentId].lastUsed = Date.now();
    
    this.saveUserIntents();
  }
  
  loadUserIntents() {
    try {
      return JSON.parse(localStorage.getItem('p31-user-intents') || '{}');
    } catch {
      return {};
    }
  }
  
  saveUserIntents() {
    localStorage.setItem('p31-user-intents', JSON.stringify(this.state.userIntents));
  }
  
  // Accessibility
  announce(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 1000);
  }
  
  showLevelSelector() {
    // Quick level selector popup
    const current = this.state.level;
    const next = (current + 1) % 7;
    this.setPowerLevel(next);
  }
}

// Export for module use
export default PHOS;

// Auto-mount if element exists
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('#phos-orb')) {
    window.phos = new PHOS();
  }
});
