/**
 * C.A.R.S. Demo
 * Demonstration of the integrated molecular physics engine (SoupEngine)
 */

import { SoupEngine } from './soup';
import { DEFAULT_SOUP_CONFIG } from './soupPhysics';
import { particleSystem } from './particles';

// Logging function
function log(message: string) {
  console.log(message);
}

// Create a simple water molecule (H2O)
function createWaterMolecule(x: number, y: number): { atoms: any[], bonds: any[] } {
  const oxygen = {
    id: `O_${Date.now()}_${Math.random()}`,
    x: x,
    y: y,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    element: 'O',
    color: '#e94b3c',
    radius: 6,
    mass: 16,
    charge: -2
  };

  const hydrogen1 = {
    id: `H1_${Date.now()}_${Math.random()}`,
    x: x - 15,
    y: y - 10,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    element: 'H',
    color: '#ffffff',
    radius: 4,
    mass: 1,
    charge: 1
  };

  const hydrogen2 = {
    id: `H2_${Date.now()}_${Math.random()}`,
    x: x + 15,
    y: y - 10,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    element: 'H',
    color: '#ffffff',
    radius: 4,
    mass: 1,
    charge: 1
  };

  const bonds = [
    { atom1: oxygen, atom2: hydrogen1, restLength: 15, strength: 0.8 },
    { atom1: oxygen, atom2: hydrogen2, restLength: 15, strength: 0.8 }
  ];

  return { atoms: [oxygen, hydrogen1, hydrogen2], bonds };
}

/**
 * Create a simple hydrocarbon fragment (CH)
 */
function createHydrocarbonMolecule(x: number, y: number): { atoms: any[], bonds: any[] } {
  const carbon = {
    id: `C_${Date.now()}_${Math.random()}`,
    x: x,
    y: y,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    element: 'C',
    color: '#2c3e50',
    radius: 5,
    mass: 12,
    charge: 0
  };

  const hydrogen = {
    id: `H_${Date.now()}_${Math.random()}`,
    x: x + 12,
    y: y,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    element: 'H',
    color: '#ffffff',
    radius: 4,
    mass: 1,
    charge: 1
  };

  const bonds = [
    { atom1: carbon, atom2: hydrogen, restLength: 12, strength: 0.7 }
  ];

  return { atoms: [carbon, hydrogen], bonds };
}

/**
 * Create a calcium oxide molecule (CaO)
 */
function createCalciumOxideMolecule(x: number, y: number): { atoms: any[], bonds: any[] } {
  const calcium = {
    id: `Ca_${Date.now()}_${Math.random()}`,
    x: x,
    y: y,
    vx: (Math.random() - 0.5) * 0.2,
    vy: (Math.random() - 0.5) * 0.2,
    element: 'Ca',
    color: '#ff6b35',
    radius: 8,
    mass: 40,
    charge: 2
  };

  const oxygen = {
    id: `O_${Date.now()}_${Math.random()}`,
    x: x + 18,
    y: y,
    vx: (Math.random() - 0.5) * 0.2,
    vy: (Math.random() - 0.5) * 0.2,
    element: 'O',
    color: '#e94b3c',
    radius: 6,
    mass: 16,
    charge: -2
  };

  const bonds = [
    { atom1: calcium, atom2: oxygen, restLength: 18, strength: 0.9 }
  ];

  return { atoms: [calcium, oxygen], bonds };
}

// Create the Soup engine with WebSocket connection to mock server
const soup = new SoupEngine(DEFAULT_SOUP_CONFIG, 'ws://localhost:8082');

// Set up event listeners for synthesis demonstrations
soup.onMoleculeCreated = (molecule) => {
  console.log(`🧪 Created ${molecule.personality} molecule (${molecule.atoms.length} atoms)`);
};

soup.onReaction = (event) => {
  log(`⚗️  ${event.type.toUpperCase()} REACTION: ${event.emotionalImpact}`);
  log(`   ${event.reactants.length} reactants → ${event.products.length} products`);
  log(`   Emotional event: "${event.emotionalImpact}"`);

  // Trigger particle effect based on reaction type
  particleSystem.triggerReactionEffect(event.type, event.position);

  // Log personality inheritance for synthesis
  if (event.type === 'synthesis') {
    log(`💕 Synthesis: ${event.reactants.length} reactants → ${event.products.length} products`);
    if (event.products.length > 0) {
      log(`   New compound: ${event.products[0].element}`);
    }
  }
};

soup.onMoleculeDestroyed = (moleculeId) => {
  log(`💥 Molecule destroyed: ${moleculeId}`);
};

soup.onMoleculeCreated = (molecule) => {
  console.log(`🧪 Created ${molecule.personality} molecule (${molecule.atoms.length} atoms)`);
};

soup.onMoleculeDestroyed = (moleculeId) => {
  console.log(`💥 Molecule destroyed: ${moleculeId}`);
};

// Demo initialization
async function initializeSynthesisDemo() {
  console.log('🚀 Starting C.A.R.S. — Synthesis Reactions Demo');
  console.log('===================================================');

  // Resume audio context
  await soup.resumeAudio();

  // Create complementary molecule pairs for synthesis reactions
  console.log('\n🧪 Creating molecule pairs designed for synthesis reactions...');

  // Pair 1: H + O → H2O (Water formation - "falling in love")
  console.log('\n💕 Pair 1: Hydrogen + Oxygen → Water (Classic synthesis)');
  const h1 = {
    id: `H_synth1_${Date.now()}`,
    x: 200, y: 200,
    vx: 0.5, vy: 0,
    element: 'H', color: '#ffffff', radius: 4, mass: 1, charge: 1
  };
  const o1 = {
    id: `O_synth1_${Date.now()}`,
    x: 220, y: 200,
    vx: -0.5, vy: 0,
    element: 'O', color: '#e94b3c', radius: 6, mass: 16, charge: -2
  };

  soup.createMolecule([h1], [], 'fuel');      // Reactive hydrogen
  soup.createMolecule([o1], [], 'mediator');  // Seeking oxygen
  // These should collide and potentially form H2O with blended personality

  // Pair 2: C + H → CH (Hydrocarbon formation)
  console.log('\n🔗 Pair 2: Carbon + Hydrogen → Hydrocarbon (Building blocks)');
  const c1 = {
    id: `C_synth2_${Date.now()}`,
    x: 400, y: 300,
    vx: 0.3, vy: 0,
    element: 'C', color: '#2c3e50', radius: 5, mass: 12, charge: 0
  };
  const h2 = {
    id: `H_synth2_${Date.now()}`,
    x: 420, y: 300,
    vx: -0.3, vy: 0,
    element: 'H', color: '#ffffff', radius: 4, mass: 1, charge: 1
  };

  soup.createMolecule([c1], [], 'builder');   // Growth-oriented carbon
  soup.createMolecule([h2], [], 'loner');     // Independent hydrogen

  // Pair 3: Ca + O → CaO (Ionic compound formation)
  console.log('\n💪 Pair 3: Calcium + Oxygen → Calcium Oxide (Stable bonding)');
  const ca1 = {
    id: `Ca_synth3_${Date.now()}`,
    x: 600, y: 400,
    vx: 0.2, vy: 0,
    element: 'Ca', color: '#ff6b35', radius: 8, mass: 40, charge: 2
  };
  const o2 = {
    id: `O_synth3_${Date.now()}`,
    x: 620, y: 400,
    vx: -0.2, vy: 0,
    element: 'O', color: '#e94b3c', radius: 6, mass: 16, charge: -2
  };

  soup.createMolecule([ca1], [], 'rock');      // Stable calcium
  soup.createMolecule([o2], [], 'oracle');     // Intuitive oxygen

  console.log('\n🎭 Watch for synthesis reactions!');
  console.log('When molecules collide with complementary elements, they may form new compounds');
  console.log('Each synthesis inherits a blended personality from the reactants');
  console.log('Look for the "falling in love" emotional events in the console');

  // Start the simulation
  const animate = () => {
    soup.update(1/60); // 60fps
    particleSystem.update(16.67); // ~60fps delta time in ms
    requestAnimationFrame(animate);
  };
  animate();
}

// Export for browser use
if (typeof window !== 'undefined') {
  (window as any).SoupDemo = {
    soup,
    createWaterMolecule,
    createHydrocarbonMolecule,
    createCalciumOxideMolecule,
    initializeSynthesisDemo
  };

  // Auto-initialize demo
  initializeSynthesisDemo();
}