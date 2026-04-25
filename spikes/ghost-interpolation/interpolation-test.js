/**
 * Ghost Molecule Interpolation Test
 * Tests various interpolation strategies for smooth 2Hz -> 60fps rendering
 */

// Performance API fallback for Node.js
let performance;
if (typeof window !== 'undefined' && window.performance) {
    performance = window.performance;
} else {
    const perf_hooks = require('perf_hooks');
    performance = perf_hooks.performance;
}

class InterpolationTest {
  constructor() {
    this.molecules = [];
    this.networkUpdateInterval = 500; // 2Hz = 500ms
    this.lastNetworkUpdate = 0;
    this.networkUpdateAccumulator = 0;
    
    // Test metrics
    this.frameCount = 0;
    this.lastFpsTime = performance.now();
    this.fps = 0;
    
    // Initialize test molecules
    this.initializeTestMolecules();
  }
  
  initializeTestMolecules() {
    // Create 50 test molecules with random initial positions and velocities
    for (let i = 0; i < 50; i++) {
      this.molecules.push({
        id: `ghost_${i}`,
        // Network position (updated every 500ms from server)
        networkX: Math.random() * 1600,
        networkY: Math.random() * 900,
        networkVx: (Math.random() - 0.5) * 2,
        networkVy: (Math.random() - 0.5) * 2,
        // Last known network position
        lastNetworkX: Math.random() * 1600,
        lastNetworkY: Math.random() * 900,
        // Interpolated position (what we render)
        renderX: Math.random() * 1600,
        renderY: Math.random() * 900,
        // Interpolation state
        interpolationProgress: 0,
        isInterpolating: false
      });
    }
  }
  
  /**
   * Simulate receiving network update at 2Hz
   */
  simulateNetworkUpdate(currentTime) {
    if (currentTime - this.lastNetworkUpdate >= this.networkUpdateInterval) {
      this.lastNetworkUpdate = currentTime;
      
      // Update network positions with some random movement
      this.molecules.forEach(mol => {
        // Store last known good position
        mol.lastNetworkX = mol.networkX;
        mol.lastNetworkY = mol.networkY;
        
        // Update network position with new velocity (simulating server update)
        mol.networkX += mol.networkVx * (this.networkUpdateInterval / 1000);
        mol.networkY += mol.networkVy * (this.networkUpdateInterval / 1000);
        
        // Add some randomness to simulate network variance
        mol.networkX += (Math.random() - 0.5) * 0.5;
        mol.networkY += (Math.random() - 0.5) * 0.5;
        
        // Boundary checking
        if (mol.networkX < 0) mol.networkX = 0;
        if (mol.networkX > 1600) mol.networkX = 1600;
        if (mol.networkY < 0) mol.networkY = 0;
        if (mol.networkY > 900) mol.networkY = 900;
        
        // Start interpolation from last position to new position
        mol.interpolationProgress = 0;
        mol.isInterpolating = true;
      });
    }
  }
  
  /**
   * Linear interpolation
   */
  linearInterpolate(start, end, t) {
    return start + (end - start) * t;
  }
  
  /**
   * Hermite spline interpolation (smoother)
   */
  hermiteInterpolate(start, end, t) {
    // Smoothstep function: t*t*(3-2*t)
    const smoothT = t * t * (3 - 2 * t);
    return start + (end - start) * smoothT;
  }
  
  /**
   * Update interpolated positions
   */
  updateInterpolations(currentTime, method = 'linear') {
    this.molecules.forEach(mol => {
      if (mol.isInterpolating) {
        // Update interpolation progress (0 to 1 over network interval)
        mol.interpolationProgress += (16.67 / this.networkUpdateInterval); // ~60fps step
        
        if (mol.interpolationProgress >= 1) {
          mol.interpolationProgress = 1;
          mol.isInterpolating = false;
          
          // Snap to network position to prevent drift
          mol.renderX = mol.networkX;
          mol.renderY = mol.networkY;
        } else {
          // Interpolate position
          const t = method === 'linear' 
            ? mol.interpolationProgress 
            : this.hermiteInterpolate(0, 1, mol.interpolationProgress);
            
          mol.renderX = this.linearInterpolate(mol.lastNetworkX, mol.networkX, t);
          mol.renderY = this.linearInterpolate(mol.lastNetworkY, mol.networkY, t);
        }
      }
    });
  }
  
  /**
   * Update test and measure performance
   */
  update(currentTime) {
    const deltaTime = currentTime - this.lastFpsTime;
    
    // Simulate network updates
    this.simulateNetworkUpdate(currentTime);
    
    // Update interpolations
    this.updateInterpolations(currentTime, 'hermite'); // Test hermite by default
    
    // Update FPS counter
    this.frameCount++;
    if (deltaTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / deltaTime);
      this.frameCount = 0;
      this.lastFpsTime = currentTime;
    }
  }
  
  /**
   * Get test metrics
   */
  getMetrics() {
    return {
      fps: this.fps,
      moleculeCount: this.molecules.length,
      interpolatingCount: this.molecules.filter(m => m.isInterpolating).length,
      avgInterpolationProgress: this.molecules.reduce((sum, m) => sum + m.interpolationProgress, 0) / this.molecules.length
    };
  }
}

// Export for use in test harness
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InterpolationTest;
}