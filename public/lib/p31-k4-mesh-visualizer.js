/**
 * P31 K₄ Mesh Visualizer
 * Document ID: p31.k4meshVisualizer/1.0.0
 * 
 * Embeddable 3D physics visualization for any K4 tetrahedron mesh.
 * Renders family cages, personal hubs, or custom K4 configurations.
 * 
 * Features:
 * - Configurable vertices (labels, colors, weights)
 * - Live spring physics (Coulomb + Hooke)
 * - Bezier edges with particle streams
 * - 3D sphere nodes with orbital rings
 * - Drag interaction
 * - Safe mode destruction
 * - Mesh entanglement sync
 */

class K4MeshVisualizer {
  constructor(canvasId, config = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.warn(`[K4MeshVisualizer] Canvas #${canvasId} not found`);
      return;
    }
    
    this.ctx = this.canvas.getContext('2d');
    this.animationId = null;
    this.isActive = false;
    this.time = 0;
    this.draggedNode = null;
    this.mouseTrail = [];
    
    // Default K4 configuration (family cage)
    this.config = {
      // Vertices: 4 nodes of the tetrahedron
      vertices: config.vertices || [
        { id: 'will', label: 'FORGE', color: '#5DCAA5', role: 'parent' },
        { id: 'sj', label: 'COUNSEL', color: '#cc6247', role: 'child' },
        { id: 'wj', label: 'SCHOLAR', color: '#3ba372', role: 'child' },
        { id: 'christyn', label: 'SCRIBE', color: '#8b7cc9', role: 'parent' }
      ],
      
      // Edges: 6 connections (complete graph K4)
      edges: config.edges || [
        { source: 0, target: 1, weight: 8 },   // will-sj
        { source: 0, target: 2, weight: 10 },  // will-wj
        { source: 0, target: 3, weight: 7 },   // will-christyn
        { source: 1, target: 2, weight: 6 },   // sj-wj
        { source: 1, target: 3, weight: 9 },   // sj-christyn
        { source: 2, target: 3, weight: 5 }     // wj-christyn
      ],
      
      // Physics parameters
      repulsionStrength: config.repulsionStrength || 6000,
      springStrength: config.springStrength || 0.03,
      friction: config.friction || 0.85,
      centerGravity: config.centerGravity || 0.003,
      
      // Visual parameters
      nodeRadius: config.nodeRadius || 24,
      baseDistance: config.baseDistance || 280,
      weightMultiplier: config.weightMultiplier || 12,
      showLabels: config.showLabels !== false,
      showOrbitalRings: config.showOrbitalRings !== false,
      particleStreams: config.particleStreams !== false,
      
      // Mesh sync
      meshSync: config.meshSync !== false,
      surfaceId: config.surfaceId || `k4-${Math.random().toString(36).substr(2, 9)}`,
      
      // Callbacks
      onDragStart: config.onDragStart || null,
      onDrag: config.onDrag || null,
      onDragEnd: config.onDragEnd || null,
      onCoherenceChange: config.onCoherenceChange || null
    };
    
    // Initialize physics state
    this.nodes = this.config.vertices.map((v, i) => ({
      ...v,
      x: 0, y: 0,
      vx: 0, vy: 0,
      index: i
    }));
    
    this.edges = this.config.edges.map((e, i) => ({
      ...e,
      stream: this.config.particleStreams ? new K4ParticleStream(5) : null,
      index: i
    }));
    
    this.dpr = window.devicePixelRatio || 1;
    this.width = 0;
    this.height = 0;
    this.coherence = 0;
    
    this.init();
  }
  
  init() {
    this.resize();
    this.initPositions();
    this.setupEventListeners();
    this.setupMeshSync();
    console.log(`[K4MeshVisualizer] Initialized ${this.config.surfaceId}`);
  }
  
  resize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    
    this.width = parent.clientWidth;
    this.height = parent.clientHeight;
    
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.scale(this.dpr, this.dpr);
  }
  
  initPositions() {
    // Arrange in circle around center
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const radius = Math.min(this.width, this.height) * 0.25;
    
    this.nodes.forEach((n, i) => {
      const angle = (i * Math.PI * 2) / 4;
      n.x = centerX + Math.cos(angle) * radius;
      n.y = centerY + Math.sin(angle) * radius;
    });
  }
  
  setupEventListeners() {
    // Mouse interactions
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    window.addEventListener('mouseup', () => this.handleMouseUp());
    window.addEventListener('resize', () => {
      this.resize();
      this.initPositions();
    });
    
    // Safe mode observer
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        if (m.type === 'attributes' && m.attributeName === 'class') {
          const isSafe = document.body.classList.contains('safe-mode');
          if (isSafe) this.destroy();
          else if (!this.isActive) this.start();
        }
      });
    });
    observer.observe(document.body, { attributes: true });
    
    // Visibility handling
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.pause();
      else if (this.isActive) this.resume();
    });
  }
  
  setupMeshSync() {
    if (!this.config.meshSync) return;
    
    try {
      this.meshChannel = new BroadcastChannel('p31_k4mesh');
      this.meshChannel.onmessage = (e) => this.handleMeshMessage(e.data);
    } catch (err) {
      // localStorage fallback
      window.addEventListener('storage', (e) => {
        if (e.key === 'p31_k4mesh_sync') {
          this.handleMeshMessage(JSON.parse(e.newValue));
        }
      });
    }
  }
  
  handleMeshMessage(msg) {
    if (!msg || msg.source === this.config.surfaceId) return;
    
    switch (msg.type) {
      case 'k4:nodeDrag':
        // Sync node positions from other surfaces
        if (msg.payload.nodeIndex !== undefined) {
          const node = this.nodes[msg.payload.nodeIndex];
          if (node && !this.draggedNode) {
            node.x = msg.payload.x;
            node.y = msg.payload.y;
          }
        }
        break;
      case 'k4:coherence':
        this.coherence = msg.payload.coherence;
        break;
    }
  }
  
  broadcast(type, payload) {
    const msg = {
      type,
      payload,
      source: this.config.surfaceId,
      timestamp: Date.now()
    };
    
    if (this.meshChannel) {
      this.meshChannel.postMessage(msg);
    } else {
      localStorage.setItem('p31_k4mesh_sync', JSON.stringify(msg));
    }
  }
  
  handleMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * this.dpr;
    const my = (e.clientY - rect.top) * this.dpr;
    
    // Find clicked node
    this.draggedNode = this.nodes.find(n => 
      Math.hypot(n.x - mx, n.y - my) < this.config.nodeRadius * 1.5
    );
    
    if (this.draggedNode) {
      this.coherenceBurst(this.draggedNode.x, this.draggedNode.y);
      if (this.config.onDragStart) {
        this.config.onDragStart(this.draggedNode);
      }
    }
  }
  
  handleMouseMove(e) {
    if (!this.draggedNode) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * this.dpr;
    const my = (e.clientY - rect.top) * this.dpr;
    
    this.draggedNode.x = mx;
    this.draggedNode.y = my;
    
    // Add to trail
    this.mouseTrail.push({ x: mx, y: my, age: 0 });
    if (this.mouseTrail.length > 10) this.mouseTrail.shift();
    
    // Broadcast position
    this.broadcast('k4:nodeDrag', {
      nodeIndex: this.draggedNode.index,
      x: mx,
      y: my
    });
    
    if (this.config.onDrag) {
      this.config.onDrag(this.draggedNode);
    }
  }
  
  handleMouseUp() {
    if (this.draggedNode && this.config.onDragEnd) {
      this.config.onDragEnd(this.draggedNode);
    }
    this.draggedNode = null;
  }
  
  physicsStep() {
    const center = { x: this.width / 2, y: this.height / 2 };
    
    // Coulomb repulsion (nodes push apart)
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const dx = this.nodes[j].x - this.nodes[i].x;
        const dy = this.nodes[j].y - this.nodes[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = this.config.repulsionStrength / (dist * dist);
        
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        
        this.nodes[i].vx -= fx;
        this.nodes[i].vy -= fy;
        this.nodes[j].vx += fx;
        this.nodes[j].vy += fy;
      }
    }
    
    // Hooke spring attraction (edges pull together)
    this.edges.forEach(e => {
      const n1 = this.nodes[e.source];
      const n2 = this.nodes[e.target];
      const dx = n2.x - n1.x;
      const dy = n2.y - n1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Stronger weight = closer target distance
      const targetDist = this.config.baseDistance - (e.weight * this.config.weightMultiplier);
      const force = (dist - targetDist) * this.config.springStrength;
      
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      
      n1.vx += fx;
      n1.vy += fy;
      n2.vx -= fx;
      n2.vy -= fy;
    });
    
    // Center gravity + integration
    this.nodes.forEach(n => {
      if (n !== this.draggedNode) {
        // Pull toward center
        n.vx += (center.x - n.x) * this.config.centerGravity;
        n.vy += (center.y - n.y) * this.config.centerGravity;
        
        // Friction
        n.vx *= this.config.friction;
        n.vy *= this.config.friction;
        
        // Update position
        n.x += n.vx;
        n.y += n.vy;
      }
    });
    
    // Update trail
    this.mouseTrail.forEach(p => p.age++);
    this.mouseTrail = this.mouseTrail.filter(p => p.age < 10);
    
    // Calculate coherence
    const totalWeight = this.edges.reduce((sum, e) => sum + e.weight, 0);
    const maxWeight = 60; // 6 edges * 10 max
    this.coherence = Math.round((totalWeight / maxWeight) * 100);
    
    if (this.config.onCoherenceChange) {
      this.config.onCoherenceChange(this.coherence);
    }
  }
  
  draw() {
    if (!this.isActive) return;
    
    this.time = Date.now() * 0.001;
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Physics
    this.physicsStep();
    
    // Draw trail
    this.drawTrail();
    
    // Draw edges
    this.edges.forEach((e, i) => this.drawEdge(e, i));
    
    // Draw nodes
    this.nodes.forEach((n, i) => this.drawNode(n, i));
    
    this.animationId = requestAnimationFrame(() => this.draw());
  }
  
  drawTrail() {
    if (this.mouseTrail.length < 2) return;
    
    this.ctx.beginPath();
    this.ctx.moveTo(this.mouseTrail[0].x, this.mouseTrail[0].y);
    for (let i = 1; i < this.mouseTrail.length; i++) {
      this.ctx.lineTo(this.mouseTrail[i].x, this.mouseTrail[i].y);
    }
    
    this.ctx.strokeStyle = 'rgba(77, 184, 168, 0.4)';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.stroke();
  }
  
  drawEdge(edge, idx) {
    const n1 = this.nodes[edge.source];
    const n2 = this.nodes[edge.target];
    
    // Calculate bezier control point
    const midX = (n1.x + n2.x) / 2;
    const midY = (n1.y + n2.y) / 2;
    const dx = n2.x - n1.x;
    const dy = n2.y - n1.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const dir = idx % 2 === 0 ? 1 : -1;
    const controlOffset = 30 * dir;
    const cpX = midX + (-dy / len * controlOffset);
    const cpY = midY + (dx / len * controlOffset);
    
    // Gradient line
    const grad = this.ctx.createLinearGradient(n1.x, n1.y, n2.x, n2.y);
    grad.addColorStop(0, `${n1.color}66`);
    grad.addColorStop(0.5, `rgba(77, 184, 168, ${Math.min(1, edge.weight / 10)})`);
    grad.addColorStop(1, `${n2.color}66`);
    
    this.ctx.beginPath();
    this.ctx.moveTo(n1.x, n1.y);
    this.ctx.quadraticCurveTo(cpX, cpY, n2.x, n2.y);
    this.ctx.strokeStyle = grad;
    this.ctx.lineWidth = edge.weight;
    this.ctx.lineCap = 'round';
    this.ctx.stroke();
    
    // Energy wave
    const wavePos = (this.time * 100 + idx * 50) % len;
    const t = wavePos / len;
    const waveX = (1 - t) * (1 - t) * n1.x + 2 * (1 - t) * t * cpX + t * t * n2.x;
    const waveY = (1 - t) * (1 - t) * n1.y + 2 * (1 - t) * t * cpY + t * t * n2.y;
    
    this.ctx.beginPath();
    this.ctx.arc(waveX, waveY, 4 + edge.weight / 2, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    
    // Particle stream
    if (edge.stream) {
      edge.stream.update();
      edge.stream.draw(n1, n2, cpX, cpY, this.ctx);
    }
    
    // Store control point for mesh sync
    edge.cpX = cpX;
    edge.cpY = cpY;
  }
  
  drawNode(node, idx) {
    const pulseScale = 1 + Math.sin(this.time * 3 + idx) * 0.05;
    const r = this.config.nodeRadius * pulseScale;
    
    // Orbital rings
    if (this.config.showOrbitalRings) {
      const rings = [
        { rad: r + 15, speed: 0.5, dash: [10, 8], w: 1, alpha: 0.4 },
        { rad: r + 8, speed: -0.8, dash: [4, 4], w: 1.5, alpha: 0.6 }
      ];
      
      rings.forEach(ring => {
        this.ctx.save();
        this.ctx.translate(node.x, node.y);
        this.ctx.rotate(this.time * ring.speed + idx);
        this.ctx.beginPath();
        this.ctx.arc(0, 0, ring.rad, 0, Math.PI * 2);
        this.ctx.strokeStyle = `rgba(255, 255, 255, ${ring.alpha})`;
        this.ctx.lineWidth = ring.w;
        this.ctx.setLineDash(ring.dash);
        this.ctx.stroke();
        this.ctx.restore();
      });
    }
    
    // Aura particles
    for (let i = 0; i < 5; i++) {
      const angle = this.time + (i * Math.PI * 2 / 5) + idx;
      const dist = r + 4 + Math.sin(this.time * 5 + i) * 2;
      this.ctx.beginPath();
      this.ctx.arc(
        node.x + Math.cos(angle) * dist,
        node.y + Math.sin(angle) * dist,
        1.5, 0, Math.PI * 2
      );
      this.ctx.fillStyle = node.color;
      this.ctx.fill();
    }
    
    // 3D sphere core
    const grad = this.ctx.createRadialGradient(
      node.x - r * 0.3, node.y - r * 0.3, 0,
      node.x, node.y, r
    );
    grad.addColorStop(0, this.adjustColor(node.color, 60));
    grad.addColorStop(0.4, node.color);
    grad.addColorStop(1, this.adjustColor(node.color, -50));
    
    this.ctx.beginPath();
    this.ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
    this.ctx.fillStyle = grad;
    this.ctx.fill();
    
    // Specular highlight
    const hGrad = this.ctx.createRadialGradient(
      node.x - r * 0.35, node.y - r * 0.35, 0,
      node.x - r * 0.35, node.y - r * 0.35, r * 0.4
    );
    hGrad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    hGrad.addColorStop(1, 'transparent');
    this.ctx.beginPath();
    this.ctx.arc(node.x - r * 0.35, node.y - r * 0.35, r * 0.4, 0, Math.PI * 2);
    this.ctx.fillStyle = hGrad;
    this.ctx.fill();
    
    // Label
    if (this.config.showLabels) {
      this.ctx.font = 'bold 12px "JetBrains Mono", monospace';
      const tw = this.ctx.measureText(node.id).width;
      
      // Label pill background
      this.ctx.fillStyle = 'rgba(11, 13, 16, 0.85)';
      this.ctx.beginPath();
      this.ctx.roundRect(node.x - tw / 2 - 6, node.y - 10, tw + 12, 20, 4);
      this.ctx.fill();
      this.ctx.strokeStyle = node.color;
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
      
      // Label text
      this.ctx.fillStyle = '#fff';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(node.id, node.x, node.y);
      
      // Full label below
      this.ctx.font = '10px "JetBrains Mono", monospace';
      this.ctx.fillStyle = 'rgba(216, 214, 208, 0.8)';
      this.ctx.fillText(node.label, node.x, node.y + r + 22);
    }
  }
  
  coherenceBurst(x, y) {
    // Visual burst effect
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      // Could add particle system here
    }
  }
  
  adjustColor(color, amount) {
    return '#' + color.replace(/^#/, '').match(/.{2}/g).map(c =>
      Math.max(0, Math.min(255, parseInt(c, 16) + amount))).map(c =>
      c.toString(16).padStart(2, '0')).join('');
  }
  
  start() {
    if (this.isActive) return;
    this.isActive = true;
    this.draw();
  }
  
  pause() {
    this.isActive = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
  
  resume() {
    if (!this.isActive && !document.body.classList.contains('safe-mode')) {
      this.start();
    }
  }
  
  destroy() {
    this.pause();
    this.ctx.clearRect(0, 0, this.width, this.height);
    if (this.meshChannel) this.meshChannel.close();
  }
  
  // Static factory methods
  static familyCage(canvasId, options = {}) {
    return new K4MeshVisualizer(canvasId, {
      vertices: [
        { id: 'will', label: 'FORGE', color: '#5DCAA5', role: 'parent' },
        { id: 'sj', label: 'SCHOLAR', color: '#cc6247', role: 'child' },
        { id: 'wj', label: 'SCRIBE', color: '#3ba372', role: 'child' },
        { id: 'christyn', label: 'COUNSEL', color: '#8b7cc9', role: 'parent' }
      ],
      edges: [
        { source: 0, target: 1, weight: 8 },
        { source: 0, target: 2, weight: 10 },
        { source: 0, target: 3, weight: 7 },
        { source: 1, target: 2, weight: 6 },
        { source: 1, target: 3, weight: 9 },
        { source: 2, target: 3, weight: 5 }
      ],
      ...options
    });
  }
  
  static personalHub(canvasId, hubType, options = {}) {
    // Hub-specific configurations
    const hubConfigs = {
      'forge': { color: '#5DCAA5', label: 'FORGE Hub' },
      'counsel': { color: '#cc6247', label: 'COUNSEL Hub' },
      'scholar': { color: '#3ba372', label: 'SCHOLAR Hub' },
      'scribe': { color: '#8b7cc9', label: 'SCRIBE Hub' }
    };
    
    const config = hubConfigs[hubType] || hubConfigs['forge'];
    
    return new K4MeshVisualizer(canvasId, {
      vertices: [
        { id: 'core', label: config.label, color: config.color, role: 'core' },
        { id: 'a', label: 'Dock A', color: config.color, role: 'dock' },
        { id: 'b', label: 'Dock B', color: config.color, role: 'dock' },
        { id: 'c', label: 'Dock C', color: config.color, role: 'dock' }
      ],
      edges: [
        { source: 0, target: 1, weight: 8 },
        { source: 0, target: 2, weight: 8 },
        { source: 0, target: 3, weight: 8 },
        { source: 1, target: 2, weight: 5 },
        { source: 1, target: 3, weight: 5 },
        { source: 2, target: 3, weight: 5 }
      ],
      ...options
    });
  }
}

// Particle stream helper class
class K4ParticleStream {
  constructor(count = 5) {
    this.particles = Array.from({ length: count }, (_, i) => ({
      offset: (i / count) * 100,
      speed: 0.15 + Math.random() * 0.2,
      size: 1.5 + Math.random() * 1.5
    }));
  }
  
  update() {
    this.particles.forEach(p => {
      p.offset += p.speed;
      if (p.offset > 100) p.offset = 0;
    });
  }
  
  draw(n1, n2, cpX, cpY, ctx) {
    this.particles.forEach(p => {
      const t = p.offset / 100;
      const x = (1 - t) * (1 - t) * n1.x + 2 * (1 - t) * t * cpX + t * t * n2.x;
      const y = (1 - t) * (1 - t) * n1.y + 2 * (1 - t) * t * cpY + t * t * n2.y;
      
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + (p.size / 3) * 0.5})`;
      ctx.fill();
    });
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { K4MeshVisualizer, K4ParticleStream };
}
