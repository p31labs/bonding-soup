/**
 * P31 Starfield Module v2.0
 * Canvas 2D K4 mesh visualization
 * Actually renders, actually works
 */

export class Starfield {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.warn(`[Starfield] Canvas #${canvasId} not found`);
      return;
    }
    
    this.ctx = this.canvas.getContext('2d');
    this.config = {
      starCount: options.starCount || 100,
      connectionDistance: options.connectionDistance || 120,
      maxConnections: options.maxConnections || 3,
      color: options.color || '#4db8a8',
      meshSync: options.meshSync !== false,
      surfaceId: options.surfaceId || 'unknown',
      ...options
    };
    
    this.stars = [];
    this.animationId = null;
    this.time = 0;
    this.width = 0;
    this.height = 0;
    this.dpr = window.devicePixelRatio || 1;
    this.meshChannel = null;
    this.coherence = 92;
    
    this.init();
  }
  
  init() {
    this.resize();
    this.createStars();
    this.setupMeshSync();
    this.setupSafeMode();
    
    window.addEventListener('resize', () => this.resize());
    
    this.start();
    console.log(`[Starfield] Initialized on ${this.config.surfaceId} with ${this.config.starCount} stars`);
  }
  
  resize() {
    const parent = this.canvas.parentElement || document.body;
    this.width = parent.clientWidth;
    this.height = parent.clientHeight;
    
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    
    this.ctx.scale(this.dpr, this.dpr);
  }
  
  createStars() {
    this.stars = [];
    for (let i = 0; i < this.config.starCount; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 1,
        baseAlpha: Math.random() * 0.5 + 0.3,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.02
      });
    }
  }
  
  setupMeshSync() {
    if (!this.config.meshSync) return;
    
    try {
      this.meshChannel = new BroadcastChannel('p31_starfield');
      this.meshChannel.onmessage = (e) => {
        if (e.data.type === 'coherence') {
          this.coherence = e.data.value;
        }
      };
      
      // Announce presence
      this.meshChannel.postMessage({
        type: 'join',
        surface: this.config.surfaceId,
        timestamp: Date.now()
      });
    } catch (err) {
      // BroadcastChannel not supported, use localStorage fallback
      window.addEventListener('storage', (e) => {
        if (e.key === 'p31_starfield_coherence') {
          this.coherence = parseFloat(e.newValue);
        }
      });
    }
  }
  
  setupSafeMode() {
    // Listen for safe mode
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          if (document.body.classList.contains('safe-mode')) {
            this.stop();
          } else {
            this.start();
          }
        }
      });
    });
    
    observer.observe(document.body, { attributes: true });
  }
  
  update() {
    this.time += 0.016;
    
    // Update star positions
    for (const star of this.stars) {
      star.x += star.vx;
      star.y += star.vy;
      
      // Wrap around edges
      if (star.x < 0) star.x = this.width;
      if (star.x > this.width) star.x = 0;
      if (star.y < 0) star.y = this.height;
      if (star.y > this.height) star.y = 0;
      
      // Update pulse phase
      star.pulsePhase += star.pulseSpeed;
    }
  }
  
  draw() {
    // Clear with transparent background (shows page background)
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Draw connections first (behind stars)
    this.drawConnections();
    
    // Draw stars
    for (const star of this.stars) {
      this.drawStar(star);
    }
  }
  
  drawStar(star) {
    const pulse = Math.sin(star.pulsePhase) * 0.3 + 0.7;
    const alpha = star.baseAlpha * pulse * (this.coherence / 100);
    
    this.ctx.beginPath();
    this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    this.ctx.fillStyle = this.hexToRgba(this.config.color, alpha);
    this.ctx.fill();
    
    // Glow effect
    this.ctx.beginPath();
    this.ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
    this.ctx.fillStyle = this.hexToRgba(this.config.color, alpha * 0.2);
    this.ctx.fill();
  }
  
  drawConnections() {
    for (let i = 0; i < this.stars.length; i++) {
      const starA = this.stars[i];
      let connections = 0;
      
      for (let j = i + 1; j < this.stars.length; j++) {
        if (connections >= this.config.maxConnections) break;
        
        const starB = this.stars[j];
        const dist = Math.hypot(starA.x - starB.x, starA.y - starB.y);
        
        if (dist < this.config.connectionDistance) {
          const alpha = (1 - dist / this.config.connectionDistance) * 0.3;
          
          this.ctx.beginPath();
          this.ctx.moveTo(starA.x, starA.y);
          this.ctx.lineTo(starB.x, starB.y);
          this.ctx.strokeStyle = this.hexToRgba(this.config.color, alpha);
          this.ctx.lineWidth = 1;
          this.ctx.stroke();
          
          connections++;
        }
      }
    }
  }
  
  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  
  broadcastCoherence() {
    if (!this.config.meshSync) return;
    
    const msg = { type: 'coherence', value: this.coherence };
    
    if (this.meshChannel) {
      this.meshChannel.postMessage(msg);
    }
    
    // localStorage fallback
    try {
      localStorage.setItem('p31_starfield_coherence', this.coherence.toString());
    } catch (e) {}
  }
  
  animate() {
    this.update();
    this.draw();
    this.animationId = requestAnimationFrame(() => this.animate());
  }
  
  start() {
    if (this.animationId) return;
    this.animate();
  }
  
  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    // Clear canvas when stopped
    this.ctx.clearRect(0, 0, this.width, this.height);
  }
  
  destroy() {
    this.stop();
    if (this.meshChannel) {
      this.meshChannel.close();
    }
  }
}

// Default export
export default Starfield;
