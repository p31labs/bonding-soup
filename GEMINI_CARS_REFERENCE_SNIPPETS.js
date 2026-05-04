/**
 * C.A.R.S. Visual Reference Snippets for Gemini
 * These are advanced Canvas 2D techniques for stunning visual effects
 */

// ============================================
// 1. BEZIER CURVE EDGES (Organic, flowing)
// ============================================
function drawCurvedEdge(n1, n2, controlOffset = 20) {
  // Calculate midpoint with slight offset for organic curve
  const midX = (n1.x + n2.x) / 2;
  const midY = (n1.y + n2.y) / 2;
  
  // Add perpendicular offset for curve
  const dx = n2.x - n1.x;
  const dy = n2.y - n1.y;
  const len = Math.sqrt(dx*dx + dy*dy);
  const perpX = -dy / len * controlOffset;
  const perpY = dx / len * controlOffset;
  
  const cpX = midX + perpX;
  const cpY = midY + perpY;
  
  ctx.beginPath();
  ctx.moveTo(n1.x, n1.y);
  ctx.quadraticCurveTo(cpX, cpY, n2.x, n2.y);
  ctx.stroke();
  
  // Return curve path for particle following
  return { cpX, cpY };
}

// ============================================
// 2. MULTI-PARTICLE STREAM (Flowing energy)
// ============================================
class ParticleStream {
  constructor(edge, count = 5) {
    this.edge = edge;
    this.particles = [];
    for(let i = 0; i < count; i++) {
      this.particles.push({
        offset: (i / count) * 100, // percentage along edge
        speed: 0.2 + Math.random() * 0.3,
        size: 2 + Math.random() * 2
      });
    }
  }
  
  update() {
    this.particles.forEach(p => {
      p.offset += p.speed;
      if(p.offset > 100) p.offset = 0;
    });
  }
  
  draw(n1, n2) {
    this.particles.forEach(p => {
      const t = p.offset / 100;
      const x = n1.x + (n2.x - n1.x) * t;
      const y = n1.y + (n2.y - n1.y) * t;
      
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + (p.size / 4) * 0.6})`;
      ctx.fill();
    });
  }
}

// ============================================
// 3. PULSING ENERGY WAVE (Traveling pulse)
// ============================================
function drawEnergyWave(n1, n2, time, speed = 100) {
  const dist = Math.hypot(n2.x - n1.x, n2.y - n1.y);
  const wavePos = (time * speed) % dist;
  const waveX = n1.x + (n2.x - n1.x) * (wavePos / dist);
  const waveY = n1.y + (n2.y - n1.y) * (wavePos / dist);
  
  // Draw expanding ring at wave position
  const ringRadius = 5 + Math.sin(time * 10) * 2;
  const alpha = 0.6 - (Math.sin(time * 10) + 1) / 4;
  
  ctx.beginPath();
  ctx.arc(waveX, waveY, ringRadius, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(77, 184, 168, ${alpha})`;
  ctx.lineWidth = 2;
  ctx.stroke();
}

// ============================================
// 4. 3D SPHERE WITH SPECULAR HIGHLIGHT
// ============================================
function draw3DSphere(x, y, radius, baseColor, lightDir = {x: -0.5, y: -0.5}) {
  // Base gradient (ambient)
  const grad = ctx.createRadialGradient(
    x - radius * 0.3, y - radius * 0.3, 0,
    x, y, radius
  );
  grad.addColorStop(0, lightenColor(baseColor, 60));
  grad.addColorStop(0.3, baseColor);
  grad.addColorStop(1, darkenColor(baseColor, 40));
  
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  
  // Specular highlight (the "shiny" spot)
  const highlightX = x + lightDir.x * radius * 0.4;
  const highlightY = y + lightDir.y * radius * 0.4;
  const highlightSize = radius * 0.25;
  
  const highlightGrad = ctx.createRadialGradient(
    highlightX, highlightY, 0,
    highlightX, highlightY, highlightSize
  );
  highlightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
  highlightGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
  highlightGrad.addColorStop(1, 'transparent');
  
  ctx.beginPath();
  ctx.arc(highlightX, highlightY, highlightSize, 0, Math.PI * 2);
  ctx.fillStyle = highlightGrad;
  ctx.fill();
}

// ============================================
// 5. CONCENTRIC ORBITAL RINGS
// ============================================
function drawOrbitalRings(x, y, time, color) {
  const rings = [
    { radius: 45, speed: 0.3, dash: [15, 10], width: 1 },
    { radius: 38, speed: -0.5, dash: [8, 8], width: 1.5 },
    { radius: 52, speed: 0.2, dash: [20, 15], width: 0.5 }
  ];
  
  rings.forEach((ring, idx) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(time * ring.speed + idx * Math.PI / 3);
    
    ctx.beginPath();
    ctx.arc(0, 0, ring.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `${color}${30 + idx * 10}`; // varying opacity
    ctx.lineWidth = ring.width;
    ctx.setLineDash(ring.dash);
    ctx.stroke();
    
    ctx.restore();
  });
}

// ============================================
// 6. AURA PARTICLES (Close orbit particles)
// ============================================
function drawAuraParticles(x, y, time, color, count = 6) {
  for(let i = 0; i < count; i++) {
    const angle = (time * 0.5 + (i / count) * Math.PI * 2);
    const dist = 28 + Math.sin(time * 2 + i) * 3;
    const px = x + Math.cos(angle) * dist;
    const py = y + Math.sin(angle) * dist;
    
    ctx.beginPath();
    ctx.arc(px, py, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

// ============================================
// 7. LABEL WITH BACKGROUND PILL
// ============================================
function drawLabelWithPill(x, y, text, subtext, color) {
  ctx.font = 'bold 13px "JetBrains Mono", monospace';
  const textWidth = ctx.measureText(text).width;
  const padding = 8;
  const pillWidth = textWidth + padding * 2;
  const pillHeight = 22;
  
  // Background pill
  ctx.fillStyle = 'rgba(11, 13, 16, 0.85)';
  ctx.beginPath();
  ctx.roundRect(x - pillWidth/2, y - pillHeight/2, pillWidth, pillHeight, 4);
  ctx.fill();
  
  // Border
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // Text
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  
  // Subtext (label)
  if(subtext) {
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(216, 214, 208, 0.7)';
    ctx.fillText(subtext, x, y + 28);
  }
}

// ============================================
// 8. QUANTUM FOAM BACKGROUND
// ============================================
class QuantumFoam {
  constructor(count = 50) {
    this.particles = [];
    for(let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2,
        life: Math.random() * 100
      });
    }
  }
  
  update() {
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.5;
      
      if(p.life <= 0 || p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
        p.x = Math.random() * width;
        p.y = Math.random() * height;
        p.life = 100;
      }
    });
  }
  
  draw() {
    this.particles.forEach(p => {
      const alpha = Math.min(1, p.life / 20) * 0.3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(77, 184, 168, ${alpha})`;
      ctx.fill();
    });
  }
}

// ============================================
// 9. DRAG TRAIL EFFECT
// ============================================
class DragTrail {
  constructor(maxPoints = 10) {
    this.points = [];
    this.maxPoints = maxPoints;
  }
  
  addPoint(x, y) {
    this.points.push({x, y, age: 0});
    if(this.points.length > this.maxPoints) {
      this.points.shift();
    }
  }
  
  update() {
    this.points.forEach(p => p.age++);
    this.points = this.points.filter(p => p.age < this.maxPoints);
  }
  
  draw() {
    if(this.points.length < 2) return;
    
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for(let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    
    ctx.strokeStyle = 'rgba(77, 184, 168, 0.3)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
}

// ============================================
// 10. COHERENCE BURST (Particle spray on drag)
// ============================================
function drawCoherenceBurst(x, y, intensity = 1) {
  const particleCount = 8 * intensity;
  
  for(let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2;
    const speed = 2 + Math.random() * 3;
    const px = x + Math.cos(angle) * speed * 5;
    const py = y + Math.sin(angle) * speed * 5;
    
    ctx.beginPath();
    ctx.arc(px, py, 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fill();
  }
}

// ============================================
// COLOR UTILITIES (Required)
// ============================================
function lightenColor(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
  const B = Math.min(255, (num & 0x0000FF) + amt);
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

function darkenColor(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
  const B = Math.max(0, (num & 0x0000FF) - amt);
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

// ============================================
// EXAMPLE: Complete Upgraded Node Draw
// ============================================
function drawUpgradedNode(n, idx, time) {
  const pulseScale = 1 + Math.sin(time * 2 + idx) * 0.03;
  
  // 1. Outer orbital rings
  drawOrbitalRings(n.x, n.y, time, n.color);
  
  // 2. Aura particles
  drawAuraParticles(n.x, n.y, time, n.color, 8);
  
  // 3. 3D sphere with highlight
  draw3DSphere(n.x, n.y, 25 * pulseScale, n.color);
  
  // 4. Label with pill
  drawLabelWithPill(n.x, n.y, n.id, n.label, n.color);
}

// ============================================
// EXAMPLE: Complete Upgraded Edge Draw
// ============================================
function drawUpgradedEdge(e, idx, time) {
  const n1 = nodes[e.source];
  const n2 = nodes[e.target];
  
  // 1. Curved connection with gradient
  const curve = drawCurvedEdge(n1, n2, 15);
  
  // 2. Energy wave traveling down
  drawEnergyWave(n1, n2, time + idx, 80);
  
  // 3. Multiple particle streams
  const stream = new ParticleStream(e, 5);
  stream.update();
  stream.draw(n1, n2);
}
