/**
 * BONDING Soup Physics Engine
 * Core physics simulation for The Soup molecular environment
 * Based on SPIKE-01 validated Posner molecule stability
 */

export interface Atom {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  element: string;
  color: string;
  radius: number;
  mass: number;
  charge: number;
}

export interface Bond {
  atom1: Atom;
  atom2: Atom;
  restLength: number;
  strength: number;
}

export interface PhysicsConfig {
  width: number;
  height: number;
  physicsHz: number;
  renderHz: number;
  cellSize: number;
  /** When true, engine emits verbose console output (WebSocket, LOD, etc.) */
  debug?: boolean;
  lodThresholds: {
    fpsLow: number;
    consecutiveFrames: number;
  };
}

export class SoupPhysics {
  private atoms: Atom[] = [];
  private bonds: Bond[] = [];
  private spatialGrid = new Map<string, Atom[]>();
  private physicsAccumulator = 0;
  private lodLevel = 0;
  private consecutiveLowFps = 0;
  private lastFps = 60;

  // Performance monitoring
  private frameCount = 0;
  private physicsCount = 0;
  private lastFrameTime = performance.now();

  constructor(private config: PhysicsConfig) {}

  getWorldSize(): { width: number; height: number } {
    return { width: this.config.width, height: this.config.height };
  }

  /**
   * Add a molecule to the simulation
   */
  addMolecule(atoms: Atom[], bonds: Bond[] = []) {
    this.atoms.push(...atoms);
    this.bonds.push(...bonds);
  }

  /**
   * Remove a molecule from the simulation
   */
  removeMolecule(atomIds: string[]) {
    this.atoms = this.atoms.filter(atom => !atomIds.includes(atom.id));
    this.bonds = this.bonds.filter(bond =>
      !atomIds.includes(bond.atom1.id) && !atomIds.includes(bond.atom2.id)
    );
  }

  /**
   * Update physics simulation
   * Call this from your main game loop
   */
  update(deltaTime: number) {
    // Accumulate time for fixed physics timestep
    this.physicsAccumulator += deltaTime / 1000;

    // Run physics at target Hz (skip if we're lagging)
    let physicsTicks = 0;
    while (this.physicsAccumulator >= (1 / this.config.physicsHz) && physicsTicks < 5) {
      this.fixedUpdate(1 / this.config.physicsHz);
      this.physicsAccumulator -= (1 / this.config.physicsHz);
      this.physicsCount++;
      physicsTicks++;
    }

    // Update performance monitoring
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFrameTime >= 1000) {
      this.lastFps = Math.round((this.frameCount * 1000) / (now - this.lastFrameTime));
      this.updateLOD();
      this.frameCount = 0;
      this.lastFrameTime = now;
    }
  }

  /**
   * Fixed timestep physics update
   */
  private fixedUpdate(dt: number) {
    // Clear spatial grid
    this.spatialGrid.clear();

    // Update atom positions and build spatial grid
    this.atoms.forEach(atom => {
      this.updateAtomPhysics(atom, dt);

      // Add to spatial grid
      const cellX = Math.floor(atom.x / this.config.cellSize);
      const cellY = Math.floor(atom.y / this.config.cellSize);
      const cellKey = `${cellX},${cellY}`;

      if (!this.spatialGrid.has(cellKey)) {
        this.spatialGrid.set(cellKey, []);
      }
      this.spatialGrid.get(cellKey)!.push(atom);
    });

    // Update bonds
    this.bonds.forEach(bond => {
      this.updateBond(bond);
    });

    // Handle collisions using spatial hashing
    this.handleCollisions();
  }

  /**
   * Update individual atom physics
   */
  private updateAtomPhysics(atom: Atom, dt: number) {
    // Apply velocity damping based on LOD
    const damping = 0.98 - (this.lodLevel * 0.05);
    atom.vx *= damping;
    atom.vy *= damping;

    // Update position
    atom.x += atom.vx * dt * 100;
    atom.y += atom.vy * dt * 100;

    // Boundary wrapping (The Soup is infinite)
    if (atom.x < 0) atom.x += this.config.width;
    if (atom.x >= this.config.width) atom.x -= this.config.width;
    if (atom.y < 0) atom.y += this.config.height;
    if (atom.y >= this.config.height) atom.y -= this.config.height;
  }

  /**
   * Update bond physics (spring forces)
   */
  private updateBond(bond: Bond) {
    const dx = bond.atom2.x - bond.atom1.x;
    const dy = bond.atom2.y - bond.atom1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      const force = (distance - bond.restLength) * bond.strength * (1 - this.lodLevel * 0.2);
      const fx = (dx / distance) * force;
      const fy = (dy / distance) * force;

      bond.atom1.vx += fx / bond.atom1.mass;
      bond.atom1.vy += fy / bond.atom1.mass;
      bond.atom2.vx -= fx / bond.atom2.mass;
      bond.atom2.vy -= fy / bond.atom2.mass;
    }
  }

  /**
   * Handle collisions using spatial hashing
   */
  private handleCollisions() {
    const processedPairs = new Set<string>();

    this.atoms.forEach(atom => {
      const cellX = Math.floor(atom.x / this.config.cellSize);
      const cellY = Math.floor(atom.y / this.config.cellSize);

      // Check neighboring cells (3x3 grid)
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const neighborCellKey = `${cellX + dx},${cellY + dy}`;
          const neighbors = this.spatialGrid.get(neighborCellKey);

          if (neighbors) {
            neighbors.forEach(otherAtom => {
              if (atom.id === otherAtom.id) return;

              const pairKey = [atom.id, otherAtom.id].sort().join('-');
              if (processedPairs.has(pairKey)) return;
              processedPairs.add(pairKey);

              this.resolveCollision(atom, otherAtom);
            });
          }
        }
      }
    });
  }

  /**
   * Resolve collision between two atoms
   */
  private resolveCollision(atom1: Atom, atom2: Atom) {
    const dx = atom2.x - atom1.x;
    const dy = atom2.y - atom1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = atom1.radius + atom2.radius;

    if (distance < minDistance && distance > 0) {
      // Separate overlapping atoms
      const overlap = minDistance - distance;
      const separationX = (dx / distance) * overlap * 0.5;
      const separationY = (dy / distance) * overlap * 0.5;

      atom1.x -= separationX;
      atom1.y -= separationY;
      atom2.x += separationX;
      atom2.y += separationY;

      // Apply repulsive force (reduced at higher LOD)
      const force = overlap * 0.1 * (1 - this.lodLevel * 0.3);
      const fx = (dx / distance) * force;
      const fy = (dy / distance) * force;

      atom1.vx -= fx / atom1.mass;
      atom1.vy -= fy / atom1.mass;
      atom2.vx += fx / atom2.mass;
      atom2.vy += fy / atom2.mass;
    }
  }

  /**
   * Update Level of Detail based on performance
   */
  private updateLOD() {
    if (this.lastFps < this.config.lodThresholds.fpsLow) {
      this.consecutiveLowFps++;
      if (this.consecutiveLowFps >= this.config.lodThresholds.consecutiveFrames) {
        this.decreaseLOD();
        this.consecutiveLowFps = 0;
      }
    } else {
      this.consecutiveLowFps = 0;
      // Gradually increase quality if performance is good
      if (this.lastFps > this.config.lodThresholds.fpsLow + 10 && this.lodLevel > 0) {
        this.increaseLOD();
      }
    }
  }

  /**
   * Decrease level of detail for better performance
   */
  private decreaseLOD() {
    if (this.lodLevel < 2) {
      this.lodLevel++;
      if (this.config.debug) {
        console.log(`Performance degradation detected. Reducing detail to LOD level ${this.lodLevel}`);
      }

      // Increase cell size for coarser collision detection
      this.config.cellSize = Math.min(100, this.config.cellSize * 1.5);
    }
  }

  /**
   * Increase level of detail when performance allows
   */
  private increaseLOD() {
    if (this.lodLevel > 0) {
      this.lodLevel--;
      if (this.config.debug) {
        console.log(`Performance recovered. Increasing detail to LOD level ${this.lodLevel}`);
      }

      // Decrease cell size for finer collision detection
      this.config.cellSize = Math.max(25, this.config.cellSize / 1.5);
    }
  }

  /**
   * Get current atoms for rendering
   */
  getAtoms(): Atom[] {
    return this.atoms;
  }

  /**
   * Get current bonds for rendering
   */
  getBonds(): Bond[] {
    return this.bonds;
  }

  /**
   * Get current LOD level
   */
  getLODLevel(): number {
    return this.lodLevel;
  }

  /**
   * Get current FPS
   */
  getFPS(): number {
    return this.lastFps;
  }

  /**
   * Get performance stats
   */
  getStats() {
    return {
      atoms: this.atoms.length,
      bonds: this.bonds.length,
      lodLevel: this.lodLevel,
      fps: this.lastFps,
      physicsHz: this.physicsCount,
      cellSize: this.config.cellSize
    };
  }
}

// Default configuration for The Soup
export const DEFAULT_SOUP_CONFIG: PhysicsConfig = {
  width: 4000,
  height: 4000,
  physicsHz: 30,
  renderHz: 60,
  cellSize: 50,
  lodThresholds: {
    fpsLow: 50,
    consecutiveFrames: 3
  }
};