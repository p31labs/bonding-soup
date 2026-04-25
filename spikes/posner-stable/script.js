class PosnerSpike {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        // Physics constants
        this.PHYSICS_HZ = 30;
        this.PHYSICS_DT = 1 / this.PHYSICS_HZ;
        this.RENDER_HZ = 60;
        this.RENDER_DT = 1 / this.RENDER_HZ;

        // Performance and stability settings
        this.LOD_LEVEL = 0; // 0=full detail, 1=medium, 2=low
        this.LAST_FPS = 60;
        this.FRAME_DROP_THRESHOLD = 50; // fps
        this.CONSECUTIVE_LOW_FPS = 0;
        this.MAX_CONSECUTIVE_LOW_FPS = 3;

        // Spatial hashing for collision detection
        this.CELL_SIZE = 50;
        this.spatialGrid = new Map();

        // Performance tracking
        this.frameCount = 0;
        this.physicsCount = 0;
        this.lastFrameTime = performance.now();
        this.fps = 0;
        this.physicsTime = 0;
        this.renderTime = 0;

        // Molecule state
        this.atoms = [];
        this.bonds = [];
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;

        this.initPosnerMolecule();
        this.start();
    }

    initPosnerMolecule() {
        // Posner molecule: Ca9(PO4)6
        // 9 Calcium atoms + 6 Phosphate groups (P + 4O each) = 39 atoms total
        const calciumAtoms = [];
        const phosphateGroups = [];

        // Create calcium cage structure (simplified hexagonal arrangement)
        for (let i = 0; i < 9; i++) {
            const angle = (i / 9) * Math.PI * 2;
            const radius = 120;
            const x = this.centerX + Math.cos(angle) * radius;
            const y = this.centerY + Math.sin(angle) * radius;

            calciumAtoms.push(this.createAtom(x, y, 'Ca', '#ff6b35', 12));
        }

        // Create phosphate groups orbiting around calcium atoms
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const radius = 80;
            const centerX = this.centerX + Math.cos(angle) * radius;
            const centerY = this.centerY + Math.sin(angle) * radius;

            // Phosphate group: P + 4O in tetrahedral arrangement
            const pAtom = this.createAtom(centerX, centerY, 'P', '#4a90e2', 8);
            phosphateGroups.push(pAtom);

            // Oxygen atoms around phosphorus
            for (let o = 0; o < 4; o++) {
                const oAngle = (o / 4) * Math.PI * 2;
                const oRadius = 25;
                const oX = centerX + Math.cos(oAngle) * oRadius;
                const oY = centerY + Math.sin(oAngle) * oRadius;

                const oAtom = this.createAtom(oX, oY, 'O', '#e94b3c', 6);
                phosphateGroups.push(oAtom);

                // Create bond between P and O
                this.bonds.push({
                    atom1: pAtom,
                    atom2: oAtom,
                    restLength: oRadius,
                    strength: 0.8
                });
            }
        }

        this.atoms = [...calciumAtoms, ...phosphateGroups];
        console.log(`Initialized Posner molecule with ${this.atoms.length} atoms`);
    }

    createAtom(x, y, element, color, radius) {
        return {
            id: Math.random().toString(36).substr(2, 9),
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            element: element,
            color: color,
            radius: radius,
            mass: radius, // Simplified mass based on radius
            charge: element === 'Ca' ? 2 : (element === 'P' ? 5 : -2) // Ionic charges
        };
    }

    start() {
        this.physicsAccumulator = 0;
        this.lastTime = performance.now();
        this.running = true;

        const loop = (currentTime) => {
            if (!this.running) return;

            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;

            // Accumulate time for fixed physics timestep
            this.physicsAccumulator += deltaTime / 1000;

            // Run physics at 30Hz (skip if we're lagging too much)
            const physicsStart = performance.now();
            let physicsTicks = 0;
            while (this.physicsAccumulator >= this.PHYSICS_DT && physicsTicks < 5) {
                this.updatePhysics(this.PHYSICS_DT);
                this.physicsAccumulator -= this.PHYSICS_DT;
                this.physicsCount++;
                physicsTicks++;
            }
            this.physicsTime = performance.now() - physicsStart;

            // Render at target fps
            const renderStart = performance.now();
            this.render();
            this.renderTime = performance.now() - renderStart;

            // Update FPS counter and performance monitoring
            this.frameCount++;
            if (currentTime - this.lastFrameTime >= 1000) {
                this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFrameTime));
                this.updatePerformanceMonitoring();
                this.frameCount = 0;
                this.lastFrameTime = currentTime;
            }

            requestAnimationFrame(loop);
        };

        requestAnimationFrame(loop);
    }

    updatePerformanceMonitoring() {
        // Adaptive performance management
        if (this.fps < this.FRAME_DROP_THRESHOLD) {
            this.CONSECUTIVE_LOW_FPS++;
            if (this.CONSECUTIVE_LOW_FPS >= this.MAX_CONSECUTIVE_LOW_FPS) {
                this.decreaseLOD();
                this.CONSECUTIVE_LOW_FPS = 0;
            }
        } else {
            this.CONSECUTIVE_LOW_FPS = 0;
            // Gradually increase quality if performance is good
            if (this.fps > 55 && this.LOD_LEVEL > 0) {
                this.increaseLOD();
            }
        }

        this.LAST_FPS = this.fps;
    }

    decreaseLOD() {
        if (this.LOD_LEVEL < 2) {
            this.LOD_LEVEL++;
            console.log(`Performance degradation detected. Reducing detail to LOD level ${this.LOD_LEVEL}`);

            // Reduce collision detection frequency
            this.CELL_SIZE = Math.max(25, this.CELL_SIZE * 1.5);

            // Reduce bond updates
            this.bonds.forEach(bond => {
                bond.strength *= 0.8;
            });

            // Add visual indicator
            this.showLODIndicator();
        }
    }

    increaseLOD() {
        if (this.LOD_LEVEL > 0) {
            this.LOD_LEVEL--;
            console.log(`Performance recovered. Increasing detail to LOD level ${this.LOD_LEVEL}`);

            // Restore collision detection
            this.CELL_SIZE = Math.max(25, this.CELL_SIZE / 1.5);

            // Restore bond strength
            this.bonds.forEach(bond => {
                bond.strength /= 0.8;
            });
        }
    }

    showLODIndicator() {
        // Visual feedback for LOD changes
        this.lodFlashTime = performance.now();
    }

    updatePhysics(dt) {
        // Clear spatial grid
        this.spatialGrid.clear();

        // Update atom positions and build spatial grid
        this.atoms.forEach(atom => {
            // Apply ionic vibration (harmonic oscillator)
            const distanceFromCenter = Math.sqrt(
                Math.pow(atom.x - this.centerX, 2) +
                Math.pow(atom.y - this.centerY, 2)
            );

            // Simple harmonic motion toward equilibrium position
            const forceX = (this.centerX - atom.x) * 0.001;
            const forceY = (this.centerY - atom.y) * 0.001;

            atom.vx += forceX / atom.mass;
            atom.vy += forceY / atom.mass;

            // Apply damping
            atom.vx *= 0.98;
            atom.vy *= 0.98;

            // Update position
            atom.x += atom.vx * dt * 100; // Scale for visibility
            atom.y += atom.vy * dt * 100;

            // Add to spatial grid
            const cellX = Math.floor(atom.x / this.CELL_SIZE);
            const cellY = Math.floor(atom.y / this.CELL_SIZE);
            const cellKey = `${cellX},${cellY}`;

            if (!this.spatialGrid.has(cellKey)) {
                this.spatialGrid.set(cellKey, []);
            }
            this.spatialGrid.get(cellKey).push(atom);
        });

        // Handle bonds (spring forces)
        this.bonds.forEach(bond => {
            const dx = bond.atom2.x - bond.atom1.x;
            const dy = bond.atom2.y - bond.atom1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0) {
                const force = (distance - bond.restLength) * bond.strength;
                const fx = (dx / distance) * force;
                const fy = (dy / distance) * force;

                bond.atom1.vx += fx / bond.atom1.mass;
                bond.atom1.vy += fy / bond.atom1.mass;
                bond.atom2.vx -= fx / bond.atom2.mass;
                bond.atom2.vy -= fy / bond.atom2.mass;
            }
        });

        // Collision detection using spatial hashing
        const processedPairs = new Set();

        this.atoms.forEach(atom => {
            const cellX = Math.floor(atom.x / this.CELL_SIZE);
            const cellY = Math.floor(atom.y / this.CELL_SIZE);

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

                            this.handleCollision(atom, otherAtom);
                        });
                    }
                }
            }
        });
    }

    handleCollision(atom1, atom2) {
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

            // Apply repulsive force
            const force = overlap * 0.1;
            const fx = (dx / distance) * force;
            const fy = (dy / distance) * force;

            atom1.vx -= fx / atom1.mass;
            atom1.vy -= fy / atom1.mass;
            atom2.vx += fx / atom2.mass;
            atom2.vy += fy / atom2.mass;
        }
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#0a0a0f';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // LOD visual indicator
        if (this.lodFlashTime && performance.now() - this.lodFlashTime < 2000) {
            const alpha = Math.max(0, 1 - (performance.now() - this.lodFlashTime) / 2000);
            this.ctx.fillStyle = `rgba(255, 255, 0, ${alpha * 0.2})`;
            this.ctx.fillRect(0, 0, this.width, this.height);
        }

        // Draw bonds (skip some at higher LOD levels)
        const bondSkip = this.LOD_LEVEL;
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = Math.max(0.5, 1 - this.LOD_LEVEL * 0.3);
        this.bonds.forEach((bond, index) => {
            if (index % (bondSkip + 1) === 0) {
                this.ctx.beginPath();
                this.ctx.moveTo(bond.atom1.x, bond.atom1.y);
                this.ctx.lineTo(bond.atom2.x, bond.atom2.y);
                this.ctx.stroke();
            }
        });

        // Draw atoms (smaller at higher LOD levels)
        const atomScale = 1 - this.LOD_LEVEL * 0.2;
        this.atoms.forEach(atom => {
            this.ctx.fillStyle = atom.color;
            this.ctx.beginPath();
            this.ctx.arc(atom.x, atom.y, atom.radius * atomScale, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw atom label only at full detail
            if (this.LOD_LEVEL === 0) {
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '10px monospace';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(atom.element, atom.x, atom.y + 3);
            }
        });

        // Draw center marker
        this.ctx.strokeStyle = '#ff6b35';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, 5, 0, Math.PI * 2);
        this.ctx.stroke();

        // Enhanced performance info
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'left';

        const fpsColor = this.fps < 50 ? '#ff6b6b' : this.fps < 55 ? '#ffa726' : '#66bb6a';
        this.ctx.fillStyle = fpsColor;
        this.ctx.fillText(`FPS: ${this.fps}`, 10, 20);
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(`LOD: ${this.LOD_LEVEL}`, 10, 35);
        this.ctx.fillText(`Physics: ${this.PHYSICS_HZ}Hz`, 10, 50);
        this.ctx.fillText(`Atoms: ${this.atoms.length}`, 10, 65);
        this.ctx.fillText(`Bonds: ${this.bonds.length}`, 10, 80);

        // Performance timing
        this.ctx.fillText(`Phys Time: ${this.physicsTime.toFixed(2)}ms`, 10, 95);
        this.ctx.fillText(`Render Time: ${this.renderTime.toFixed(2)}ms`, 10, 110);
    }

    stop() {
        this.running = false;
        console.log('Posner spike stopped gracefully');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas');
    new PosnerSpike(canvas);
});