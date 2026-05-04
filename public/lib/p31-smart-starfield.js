/**
 * P31 Smart Starfield Module
 * Document ID: p31.smartStarfield/1.0.0
 * 
 * Reusable K4 mesh visualization for all P31 surfaces.
 * Features: 150 stars, distance-based connections, coherence-synced pulsing,
 * Gray Rock destruction protocol, BroadcastChannel mesh sync.
 */

class SmartStarfield {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.warn(`[SmartStarfield] Canvas #${canvasId} not found`);
      return;
    }
    
    this.ctx = this.canvas.getContext('2d');
    this.stars = [];
    this.animationId = null;
    this.isActive = false;
    this.meshChannel = null;
    
    // Configuration with defaults
    this.config = {
      starCount: options.starCount || 150,
      connectionDistance: options.connectionDistance || 100,
      maxConnections: options.maxConnections || 3,
      coherenceSource: options.coherenceSource || null, // Element ID
      pulseSync: options.pulseSync !== false, // default true
      meshSync: options.meshSync !== false, // default true
      surfaceId: options.surfaceId || `surface-${Math.random().toString(36).substr(2, 9)}`,
      color: options.color || '#4db8a8', // p31-cyan
      backgroundAlpha: options.backgroundAlpha || 0.3,
      starColor: options.starColor || '216, 214, 208', // p31-cloud RGB
      ...options
    };
    
    this.time = 0;
    this.width = 0;
    this.height = 0;
    this.dpr = window.devicePixelRatio || 1;
    
    // Coherence value (0-100) for pulse synchronization
    this.coherence = 92;
    
    this.init();
  }
  
  init() {
    this.resize();
    this.initStars();
    this.setupMeshSync();
    this.setupEventListeners();
    
    console.log(`[SmartStarfield] Initialized on ${this.config.surfaceId} with ${this.config.starCount} stars`);
  }
  
  resize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    
    this.width = parent.clientWidth;
    this.height = parent.clientHeight;
    
    // Handle retina displays
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.scale(this.dpr, this.dpr);
  }
  
  initStars() {
    this.stars = [];
    for (let i = 0; i < this.config.starCount; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.3,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.5 + Math.random() * 0.5
      });
    }
  }
  
  setupMeshSync() {
    if (!this.config.meshSync) return;
    
    try {
      this.meshChannel = new BroadcastChannel('p31_starfield');
      this.meshChannel.onmessage = (e) => this.handleMeshMessage(e.data);
    } catch (err) {
      // Fallback to localStorage for older browsers
      window.addEventListener('storage', (e) => {
        if (e.key === 'p31_starfield_sync') {
          this.handleMeshMessage(JSON.parse(e.newValue));
        }
      });
    }
  }
  
  handleMeshMessage(msg) {
    if (!msg || msg.source === this.config.surfaceId) return;
    
    switch (msg.type) {
      case 'coherence:update':
        this.coherence = msg.payload.coherence;
        break;
      case 'starfield:ping':
        // Respond with our state
        this.broadcast('starfield:pong', {
          starCount: this.stars.length,
          coherence: this.coherence
        });
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
      // localStorage fallback
      localStorage.setItem('p31_starfield_sync', JSON.stringify(msg));
    }
  }
  
  setupEventListeners() {
    // Resize handling
    window.addEventListener('resize', () => {
      this.resize();
      this.initStars();
    });
    
    // Visibility handling (pause when hidden)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      } else if (this.isActive) {
        this.resume();
      }
    });
    
    // Safe mode detection
    const safeModeObserver = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        if (m.type === 'attributes' && m.attributeName === 'class') {
          const isSafe = document.body.classList.contains('safe-mode');
          if (isSafe) {
            this.destroy();
          } else if (!this.isActive) {
            this.resume();
          }
        }
      });
    });
    
    safeModeObserver.observe(document.body, { attributes: true });
  }
  
  updateCoherence() {
    // Read from DOM element if specified
    if (this.config.coherenceSource) {
      const el = document.getElementById(this.config.coherenceSource);
      if (el) {
        const val = parseInt(el.textContent) || 92;
        if (val !== this.coherence) {
          this.coherence = val;
          this.broadcast('coherence:update', { coherence: val });
        }
      }
    }
  }
  
  draw() {
    if (!this.isActive) return;
    
    // Clear with fade trail effect
    this.ctx.fillStyle = `rgba(15, 17, 21, ${this.config.backgroundAlpha})`;
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    this.time = Date.now() * 0.001;
    this.updateCoherence();
    
    // Update star positions
    this.stars.forEach(star => {
      star.x += star.vx;
      star.y += star.vy;
      
      // Wrap around edges
      if (star.x < 0) star.x = this.width;
      if (star.x > this.width) star.x = 0;
      if (star.y < 0) star.y = this.height;
      if (star.y > this.height) star.y = 0;
    });
    
    // Draw connections (K4 mesh visualization)
    this.drawConnections();
    
    // Draw stars
    this.drawStars();
    
    // Continue loop
    this.animationId = requestAnimationFrame(() => this.draw());
  }
  
  drawConnections() {
    this.ctx.lineWidth = 0.5;
    
    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];
      let connections = 0;
      
      for (let j = i + 1; j < this.stars.length && connections < this.config.maxConnections; j++) {
        const other = this.stars[j];
        const dx = star.x - other.x;
        const dy = star.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < this.config.connectionDistance) {
          // Coherence affects connection brightness
          const coherenceMultiplier = 0.5 + (this.coherence / 200);
          const alpha = (1 - dist / this.config.connectionDistance) * 0.15 * coherenceMultiplier;
          
          this.ctx.beginPath();
          this.ctx.moveTo(star.x, star.y);
          this.ctx.lineTo(other.x, other.y);
          this.ctx.strokeStyle = `rgba(${this.config.starColor}, ${alpha})`;
          this.ctx.stroke();
          connections++;
        }
      }
    }
  }
  
  drawStars() {
    this.stars.forEach((star, idx) => {
      // Calculate pulsing alpha based on coherence
      let pulseAlpha;
      if (this.config.pulseSync) {
        // Synchronized pulsing based on coherence
        const pulseSpeed = 0.5 + (this.coherence / 200);
        pulseAlpha = star.alpha + Math.sin(this.time * pulseSpeed + star.pulse) * 0.1;
      } else {
        // Independent pulsing
        pulseAlpha = star.alpha + Math.sin(this.time * star.pulseSpeed + star.pulse) * 0.1;
      }
      
      // Draw star
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${this.config.starColor}, ${Math.max(0.1, pulseAlpha)})`;
      this.ctx.fill();
      
      // Add glow to every 5th star
      if (idx % 5 === 0) {
        this.ctx.beginPath();
        this.ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(${this.config.starColor.replace('216, 214, 208', '77, 184, 168')}, ${pulseAlpha * 0.15})`;
        this.ctx.fill();
      }
    });
  }
  
  start() {
    if (this.isActive) return;
    this.isActive = true;
    this.draw();
    this.broadcast('starfield:start', { surfaceId: this.config.surfaceId });
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
    // Gray Rock destruction protocol
    this.pause();
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    if (this.meshChannel) {
      this.meshChannel.close();
    }
    
    console.log(`[SmartStarfield] Destroyed on ${this.config.surfaceId}`);
  }
  
  // Static method for easy initialization
  static init(canvasId, options = {}) {
    const sf = new SmartStarfield(canvasId, options);
    sf.start();
    return sf;
  }
}

// Auto-export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SmartStarfield;
}
