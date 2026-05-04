/**
 * PhosOS OMNI-WRAPPER CORE (v2.1.0)
 * Bayesian Shannon Entropy Reduction & Global Ribbon Anchor
 */
class PhosOS {
  constructor() {
    this.state = { status: 'IDLE', spoons: 8, activeAgent: 'FORGE', activePool: [], history: [] };
    this.intents = [
      { id: 'PASSPORT', label: 'Cognitive Passport', path: '/passport.html' },
      { id: 'OPS', label: 'Operator Desk (G.O.D.)', path: '/ops.html' },
      { id: 'GARDEN', label: 'The Garden (S.J/W.J)', path: '/garden.html' },
      { id: 'BUFFER', label: 'The Buffer', path: '/buffer.html' },
      { id: 'VIBE', label: 'Vibe Environment', path: '/vibe.html' },
      { id: 'GEODESIC', label: 'Geodesic Builder', path: '/geodesic.html' },
      { id: 'LIBRARY', label: 'Document Library', path: '/doc-library.html' },
      { id: 'CORTEX', label: 'Centaur Pack', path: '/cortex.html' },
      { id: 'BUILD', label: 'WCD Intake', path: '/build.html' },
      { id: 'OBSERVATORY', label: 'Static Data Dome', path: '/observatory.html' }
    ];
    this.questions = [
      { id: 'Q_CHILD', text: "Are the children with you?", yes: ['GARDEN', 'GEODESIC'], no: ['OPS', 'BUFFER', 'VIBE', 'PASSPORT', 'LIBRARY', 'CORTEX', 'BUILD', 'OBSERVATORY'] },
      { id: 'Q_LEGAL', text: "Is there an external deadline/voltage?", yes: ['BUFFER', 'OPS', 'CORTEX'], no: ['GARDEN', 'GEODESIC', 'VIBE', 'PASSPORT', 'LIBRARY', 'BUILD', 'OBSERVATORY'] },
      { id: 'Q_TECH', text: "Are we in 'Mechanic' mode?", yes: ['OPS', 'VIBE', 'GEODESIC', 'CORTEX', 'BUILD', 'OBSERVATORY'], no: ['GARDEN', 'PASSPORT', 'BUFFER', 'LIBRARY'] }
    ];
    this.init();
  }

  async init() { this.syncWithCogPass(); this.injectStyles(); this.injectFace(); this.resetBrain(); }

  syncWithCogPass() {
    try {
      const pass = JSON.parse(localStorage.getItem('p31_cognitive_passport') || '{}');
      this.state.spoons = pass.preferences?.informationDensity / 10 || 8;
      if (pass.preferences?.screenComfort === 0) document.body.classList.add('safe-mode');
    } catch(e) {}
  }

  injectStyles() {
    if (document.getElementById('phos-styles')) return;
    const s = document.createElement('style');
    s.id = 'phos-styles';
    s.textContent = `
      .phos-container { position: fixed; bottom: 2rem; right: 2rem; z-index: 10000; display: flex; flex-direction: column; align-items: flex-end; }
      .phos-orb { width: 60px; height: 60px; background: rgba(10,12,15,0.9); border: 1px solid rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 0 20px rgba(93,202,165,0.3); transition: all 0.4s ease; }
      .phos-orb:hover { transform: scale(1.1); box-shadow: 0 0 30px rgba(93,202,165,0.6); }
      .k4-icon { width: 50%; height: 50%; stroke: #5DCAA5; stroke-width: 2; fill: none; transition: all 0.5s ease; }
      .status-THINKING .k4-icon { animation: jitterbug 0.8s infinite; stroke: #cda852; }
      @keyframes jitterbug { 0%, 100% { transform: rotate(0deg) scale(1); } 33% { transform: rotate(5deg) scale(1.1); } 66% { transform: rotate(-5deg) scale(0.9); } }
      .phos-bubble { position: absolute; bottom: 80px; right: 0; width: 320px; background: rgba(15,17,21,0.98); border: 1px solid rgba(255,255,255,0.1); border-radius: 1.5rem; padding: 1.5rem; opacity: 0; pointer-events: none; transform: translateY(10px); transition: all 0.4s cubic-bezier(0.19,1,0.22,1); font-family: "JetBrains Mono", monospace; color: #fff; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
      .phos-bubble.active { opacity: 1; pointer-events: auto; transform: translateY(0); }
      .phos-btn { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); color: #d8d6d0; padding: 0.8rem; border-radius: 0.75rem; font-size: 0.8rem; cursor: pointer; text-align: left; transition: all 0.2s; width: 100%; margin-bottom: 0.5rem; }
      .phos-btn:hover { background: rgba(93,202,165,0.1); border-color: #5DCAA5; color: #fff; }
      body.safe-mode .phos-container { filter: grayscale(1); }
    `;
    document.head.appendChild(s);
  }

  injectFace() {
    const c = document.createElement('div');
    c.className = 'phos-container';
    c.id = 'phos-jarvis';
    c.innerHTML = `
      <div class="phos-bubble" id="phos-bubble">
        <div style="font-size:0.95rem; margin-bottom:1.5rem;" id="phos-display"></div>
        <div id="phos-options"></div>
      </div>
      <div class="phos-orb" onclick="window.phosOS.toggle()">
        <svg class="k4-icon" viewBox="0 0 100 100">
          <path d="M50 15 L15 80 L85 80 Z M50 15 L50 55 M15 80 L50 55 M85 80 L50 55" />
        </svg>
      </div>
    `;
    document.body.appendChild(c);
  }

  resetBrain() { this.state.activePool = [...this.intents]; this.state.history = []; this.state.status = 'IDLE'; }

  toggle() {
    const b = document.getElementById('phos-bubble');
    if (b.classList.contains('active')) { b.classList.remove('active'); this.state.status = 'IDLE'; }
    else { b.classList.add('active'); this.state.status = 'LISTENING'; this.think(); }
    document.getElementById('phos-jarvis').className = `phos-container status-${this.state.status}`;
  }

  async think() {
    this.state.status = 'THINKING';
    document.getElementById('phos-jarvis').className = `phos-container status-${this.state.status}`;
    await new Promise(r => setTimeout(r, 600));
    if (this.state.activePool.length === 1) return this.presentResult(this.state.activePool[0]);
    const nextQ = this.questions.find(q => !this.state.history.includes(q.id));
    if (nextQ) this.ask(nextQ);
    else this.presentAmbiguous();
  }

  ask(q) {
    this.state.status = 'LISTENING';
    document.getElementById('phos-jarvis').className = `phos-container status-${this.state.status}`;
    document.getElementById('phos-display').innerHTML = `<span style="color:#5DCAA5">[PROBE]</span> ${q.text}`;
    document.getElementById('phos-options').innerHTML = `
      <button class="phos-btn" onclick="window.phosOS.handle(true, '${q.id}')">Affirmative</button>
      <button class="phos-btn" onclick="window.phosOS.handle(false, '${q.id}')">Negative</button>
    `;
  }

  handle(isYes, qId) {
    const q = this.questions.find(x => x.id === qId);
    this.state.history.push(q.id);
    const filterSet = isYes ? q.yes : q.no;
    this.state.activePool = this.state.activePool.filter(i => filterSet.includes(i.id));
    this.think();
  }

  presentResult(intent) {
    this.state.status = 'IDLE';
    document.getElementById('phos-jarvis').className = `phos-container status-${this.state.status}`;
    document.getElementById('phos-display').innerHTML = `<span style="color:#5DCAA5">[RESOLVED]</span> Routing to <strong>${intent.label}</strong>.`;
    document.getElementById('phos-options').innerHTML = `
      <button class="phos-btn" style="border-color:#5DCAA5" onclick="window.location.href='${intent.path}'">Initialize Shift →</button>
    `;
  }

  presentAmbiguous() {
    document.getElementById('phos-display').innerHTML = `<span style="color:#5DCAA5">[AMBIGUOUS]</span> Coordinate unclear. Select destination:`;
    document.getElementById('phos-options').innerHTML = this.state.activePool.map(i =>
      `<button class="phos-btn" onclick="window.location.href='${i.path}'">${i.label}</button>`
    ).join('') + `<button class="phos-btn" onclick="window.phosOS.resetBrain(); window.phosOS.think();">Reset</button>`;
  }
}

if (typeof window !== 'undefined') window.phosOS = new PhosOS();
