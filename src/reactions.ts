/**
 * BONDING Reaction Engine
 * Chemical reaction system for emotional events
 * Implements 6 reaction types from affective chemistry spec
 */

import { Atom, Bond } from './soupPhysics';

export enum ReactionType {
  SYNTHESIS = 'synthesis',           // A + B → AB (falling in love)
  DECOMPOSITION = 'decomposition',   // AB → A + B (grief, burnout)
  DISPLACEMENT = 'displacement',     // A + BC → AC + B (rebound)
  COMBUSTION = 'combustion',         // A + O₂ → CO₂ + H₂O (anger)
  ACID_BASE = 'acid_base',           // Neutralization (conflict resolution)
  REDOX = 'redox'                    // Power dynamics (electron transfer)
}

export interface ReactionCandidate {
  type: ReactionType;
  reactants: Atom[];
  products: Atom[];
  probability: number;
  energyChange: number;
}

export interface ReactionEvent {
  type: ReactionType;
  reactants: Atom[];
  products: Atom[];
  position: { x: number; y: number };
  timestamp: number;
  emotionalImpact: string;
  reactantMolecules?: string[]; // IDs of reactant molecules
  productMolecules?: string[]; // IDs of product molecules
}

export class ReactionEngine {
  private reactionHistory: ReactionEvent[] = [];
  private activationEnergy = 0.5; // Base activation energy (0-1 scale)

  // Reaction rate constants (higher = more likely)
  private reactionRates = {
    [ReactionType.SYNTHESIS]: 0.3,
    [ReactionType.DECOMPOSITION]: 0.2,
    [ReactionType.DISPLACEMENT]: 0.4,
    [ReactionType.COMBUSTION]: 0.1,
    [ReactionType.ACID_BASE]: 0.5,
    [ReactionType.REDOX]: 0.3
  };

  /**
   * Find potential reactions between nearby molecules
   */
  findPotentialReactions(atoms: Atom[], bonds: Bond[]): ReactionCandidate[] {
    const candidates: ReactionCandidate[] = [];

    // Check each pair of atoms for reaction potential
    for (let i = 0; i < atoms.length; i++) {
      for (let j = i + 1; j < atoms.length; j++) {
        const atom1 = atoms[i];
        const atom2 = atoms[j];

        const distance = this.distance(atom1, atom2);
        const combinedRadius = atom1.radius + atom2.radius;

        // Only consider atoms within interaction range
        if (distance <= combinedRadius * 1.5) {
          const reactions = this.checkReactionPotential(atom1, atom2, atoms, bonds);
          candidates.push(...reactions);
        }
      }
    }

    return candidates;
  }

  /**
   * Check if two atoms can undergo a reaction
   */
  private checkReactionPotential(
    atom1: Atom,
    atom2: Atom,
    allAtoms: Atom[],
    allBonds: Bond[]
  ): ReactionCandidate[] {
    const candidates: ReactionCandidate[] = [];

    // Check each reaction type
    Object.values(ReactionType).forEach(reactionType => {
      const candidate = this.evaluateReactionType(
        reactionType,
        atom1,
        atom2,
        allAtoms,
        allBonds
      );

      if (candidate && candidate.probability > this.activationEnergy) {
        candidates.push(candidate);
      }
    });

    return candidates;
  }

  /**
   * Evaluate specific reaction type potential
   */
  private evaluateReactionType(
    type: ReactionType,
    atom1: Atom,
    atom2: Atom,
    allAtoms: Atom[],
    allBonds: Bond[]
  ): ReactionCandidate | null {
    switch (type) {
      case ReactionType.SYNTHESIS:
        return this.evaluateSynthesis(atom1, atom2, allAtoms);
      case ReactionType.DECOMPOSITION:
        return this.evaluateDecomposition(atom1, atom2, allBonds);
      case ReactionType.DISPLACEMENT:
        return this.evaluateDisplacement(atom1, atom2, allAtoms, allBonds);
      case ReactionType.COMBUSTION:
        return this.evaluateCombustion(atom1, atom2, allAtoms);
      case ReactionType.ACID_BASE:
        return this.evaluateAcidBase(atom1, atom2);
      case ReactionType.REDOX:
        return this.evaluateRedox(atom1, atom2);
      default:
        return null;
    }
  }

  /**
   * Evaluate synthesis reaction (A + B → AB)
   * Two atoms combining into a more complex molecule - "falling in love" emotional event
   */
  private evaluateSynthesis(atom1: Atom, atom2: Atom, allAtoms: Atom[]): ReactionCandidate | null {
    // Check if atoms are compatible for bonding
    if (!this.canBond(atom1, atom2)) return null;

    // Check if both atoms have available valence electrons (simplified)
    const valence1 = this.getValenceElectrons(atom1.element);
    const valence2 = this.getValenceElectrons(atom2.element);
    const currentBonds1 = this.getCurrentBonds(atom1, allAtoms);
    const currentBonds2 = this.getCurrentBonds(atom2, allAtoms);

    if (currentBonds1 >= valence1 || currentBonds2 >= valence2) return null;

    // Enhanced compatibility calculation considering emotional states
    const compatibility = this.getElementCompatibility(atom1.element, atom2.element);

    // Bonus for complementary emotional profiles (personality synergy)
    const personalityBonus = this.getPersonalitySynergy(atom1, atom2);

    const probability = (compatibility + personalityBonus) * this.reactionRates[ReactionType.SYNTHESIS];

    // Create product molecule with inherited traits
    const product = this.createSynthesisProduct(atom1, atom2);

    return {
      type: ReactionType.SYNTHESIS,
      reactants: [atom1, atom2],
      products: [product],
      probability,
      energyChange: -0.3 // Exothermic (releases energy)
    };
  }

  /**
   * Create synthesis product with trait inheritance
   */
  private createSynthesisProduct(atom1: Atom, atom2: Atom): Atom {
    // Determine product element and properties based on reactants
    const productElement = this.determineProductElement(atom1.element, atom2.element);
    const productMass = atom1.mass + atom2.mass;
    const productCharge = atom1.charge + atom2.charge;

    // Position at center of mass
    const centerX = (atom1.x * atom1.mass + atom2.x * atom2.mass) / productMass;
    const centerY = (atom1.y * atom1.mass + atom2.y * atom2.mass) / productMass;

    // Momentum conservation (simplified)
    const productVx = (atom1.vx * atom1.mass + atom2.vx * atom2.mass) / productMass;
    const productVy = (atom1.vy * atom1.mass + atom2.vy * atom2.mass) / productMass;

    // Visual properties inherit from more stable reactant
    const stability1 = this.getElementStability(atom1.element);
    const stability2 = this.getElementStability(atom2.element);
    const primaryAtom = stability1 >= stability2 ? atom1 : atom2;
    const secondaryAtom = stability1 >= stability2 ? atom2 : atom1;

    const productColor = this.blendColors(primaryAtom.color, secondaryAtom.color);
    const productRadius = Math.max(primaryAtom.radius, secondaryAtom.radius) + 3; // Slightly larger

    return {
      id: `synthesis_${atom1.id}_${atom2.id}_${Date.now()}`,
      x: centerX,
      y: centerY,
      vx: productVx,
      vy: productVy,
      element: productElement,
      color: productColor,
      radius: productRadius,
      mass: productMass,
      charge: productCharge
    };
  }

  /**
   * Determine product element from synthesis reaction
   */
  private determineProductElement(elem1: string, elem2: string): string {
    // Simple synthesis rules
    if ((elem1 === 'H' && elem2 === 'O') || (elem1 === 'O' && elem2 === 'H')) {
      return 'H2O'; // Water
    }
    if ((elem1 === 'H' && elem2 === 'C') || (elem1 === 'C' && elem2 === 'H')) {
      return 'CH'; // Hydrocarbon fragment
    }
    if ((elem1 === 'Ca' && elem2 === 'O') || (elem1 === 'O' && elem2 === 'Ca')) {
      return 'CaO'; // Calcium oxide
    }
    // Default compound naming
    return `${elem1}${elem2}`;
  }

  /**
   * Calculate personality synergy bonus for synthesis
   */
  private getPersonalitySynergy(atom1: Atom, atom2: Atom): number {
    // This would ideally access personality data, but for now we'll use element-based heuristics
    // In a full implementation, this would check personality compatibility

    // Simple synergy based on element complementarity
    const complementaryPairs = [
      ['H', 'O'], ['H', 'N'], ['C', 'O'], ['Ca', 'O']
    ];

    const isComplementary = complementaryPairs.some(([a, b]) =>
      (atom1.element === a && atom2.element === b) ||
      (atom1.element === b && atom2.element === a)
    );

    return isComplementary ? 0.2 : 0; // 20% bonus for complementary pairs
  }

  /**
   * Get element stability rating (affects inheritance)
   */
  private getElementStability(element: string): number {
    const stabilityMap: { [key: string]: number } = {
      'Ca': 0.9, // Very stable
      'O': 0.7,  // Moderately stable
      'C': 0.6,  // Moderate
      'N': 0.5,  // Moderate
      'P': 0.4,  // Less stable
      'H': 0.3,  // Reactive
      'Na': 0.2, // Very reactive
      'Cl': 0.1  // Highly reactive
    };

    return stabilityMap[element] || 0.5;
  }

  /**
   * Evaluate decomposition reaction (AB → A + B)
   * Complex molecule breaking apart under stress
   */
  private evaluateDecomposition(atom1: Atom, atom2: Atom, allBonds: Bond[]): ReactionCandidate | null {
    // Look for existing bonds between these atoms
    const existingBond = allBonds.find(bond =>
      (bond.atom1.id === atom1.id && bond.atom2.id === atom2.id) ||
      (bond.atom1.id === atom2.id && bond.atom2.id === atom1.id)
    );

    if (!existingBond) return null;

    // Decomposition becomes more likely under stress (high velocity)
    const stressFactor = (Math.abs(atom1.vx) + Math.abs(atom1.vy) +
                         Math.abs(atom2.vx) + Math.abs(atom2.vy)) / 4;

    const probability = stressFactor * this.reactionRates[ReactionType.DECOMPOSITION];

    // Products are the original atoms with added kinetic energy
    const product1: Atom = { ...atom1, vx: atom1.vx * 1.2, vy: atom1.vy * 1.2 };
    const product2: Atom = { ...atom2, vx: atom2.vx * 1.2, vy: atom2.vy * 1.2 };

    return {
      type: ReactionType.DECOMPOSITION,
      reactants: [atom1, atom2],
      products: [product1, product2],
      probability,
      energyChange: 0.2 // Endothermic (requires energy)
    };
  }

  /**
   * Evaluate displacement reaction (A + BC → AC + B)
   * One atom displacing another in a bond
   */
  private evaluateDisplacement(atom1: Atom, atom2: Atom, allAtoms: Atom[], allBonds: Bond[]): ReactionCandidate | null {
    // Find if atom2 is bonded to another atom
    const bond = allBonds.find(b =>
      b.atom1.id === atom2.id || b.atom2.id === atom2.id
    );

    if (!bond) return null;

    const atom3 = bond.atom1.id === atom2.id ? bond.atom2 : bond.atom1;

    // Check if atom1 can displace atom3 from atom2
    const bondStrength = this.getBondStrength(atom2.element, atom3.element);
    const displacementStrength = this.getBondStrength(atom1.element, atom2.element);

    if (displacementStrength <= bondStrength) return null;

    const probability = (displacementStrength - bondStrength) * this.reactionRates[ReactionType.DISPLACEMENT];

    // Products: atom1 bonds with atom2, atom3 is ejected
    const product1: Atom = {
      ...atom1,
      x: (atom1.x + atom2.x) / 2,
      y: (atom1.y + atom2.y) / 2
    };

    const product2: Atom = {
      ...atom2,
      x: (atom1.x + atom2.x) / 2,
      y: (atom1.y + atom2.y) / 2
    };

    const ejectedAtom: Atom = {
      ...atom3,
      vx: atom3.vx + (Math.random() - 0.5) * 2,
      vy: atom3.vy + (Math.random() - 0.5) * 2
    };

    return {
      type: ReactionType.DISPLACEMENT,
      reactants: [atom1, atom2],
      products: [product1, product2, ejectedAtom],
      probability,
      energyChange: 0.1
    };
  }

  /**
   * Evaluate combustion reaction (rapid energy release)
   */
  private evaluateCombustion(atom1: Atom, atom2: Atom, allAtoms: Atom[]): ReactionCandidate | null {
    // Combustion requires high-energy conditions (high velocity atoms nearby)
    const nearbyAtoms = allAtoms.filter(atom =>
      atom.id !== atom1.id && atom.id !== atom2.id &&
      this.distance(atom, atom1) < 100
    );

    const avgVelocity = nearbyAtoms.reduce((sum, atom) =>
      sum + Math.sqrt(atom.vx * atom.vx + atom.vy * atom.vy), 0
    ) / nearbyAtoms.length;

    if (avgVelocity < 1.0) return null; // Not enough energy

    const probability = (avgVelocity / 2) * this.reactionRates[ReactionType.COMBUSTION];

    // Products: energy release (simplified as smaller, faster atoms)
    const product1: Atom = {
      id: `ash_${atom1.id}`,
      x: atom1.x,
      y: atom1.y,
      vx: atom1.vx * 0.5 + (Math.random() - 0.5) * 3,
      vy: atom1.vy * 0.5 + (Math.random() - 0.5) * 3,
      element: 'C',
      color: '#2c2c2c',
      radius: atom1.radius * 0.6,
      mass: atom1.mass * 0.4,
      charge: 0
    };

    const product2: Atom = {
      id: `gas_${atom2.id}`,
      x: atom2.x,
      y: atom2.y,
      vx: atom2.vx * 0.3 + (Math.random() - 0.5) * 4,
      vy: atom2.vy * 0.3 + (Math.random() - 0.5) * 4,
      element: 'O',
      color: '#87ceeb',
      radius: atom2.radius * 0.4,
      mass: atom2.mass * 0.2,
      charge: 0
    };

    return {
      type: ReactionType.COMBUSTION,
      reactants: [atom1, atom2],
      products: [product1, product2],
      probability,
      energyChange: -0.8 // Highly exothermic
    };
  }

  /**
   * Evaluate acid-base reaction (neutralization)
   */
  private evaluateAcidBase(atom1: Atom, atom2: Atom): ReactionCandidate | null {
    // Simplified: opposite charges attract
    if (atom1.charge * atom2.charge >= 0) return null; // Same charge

    const chargeDifference = Math.abs(atom1.charge - atom2.charge);
    const probability = chargeDifference * this.reactionRates[ReactionType.ACID_BASE];

    // Products: neutralized compounds
    const product1: Atom = {
      ...atom1,
      charge: 0,
      element: `${atom1.element}(neutral)`,
      color: this.neutralizeColor(atom1.color)
    };

    const product2: Atom = {
      ...atom2,
      charge: 0,
      element: `${atom2.element}(neutral)`,
      color: this.neutralizeColor(atom2.color)
    };

    return {
      type: ReactionType.ACID_BASE,
      reactants: [atom1, atom2],
      products: [product1, product2],
      probability,
      energyChange: -0.2
    };
  }

  /**
   * Evaluate redox reaction (electron transfer)
   */
  private evaluateRedox(atom1: Atom, atom2: Atom): ReactionCandidate | null {
    // Simplified: elements with different electronegativity
    const electro1 = this.getElectronegativity(atom1.element);
    const electro2 = this.getElectronegativity(atom2.element);

    if (Math.abs(electro1 - electro2) < 0.5) return null;

    const probability = Math.abs(electro1 - electro2) * this.reactionRates[ReactionType.REDOX];

    // Determine which atom loses/gains electrons
    const [oxidized, reduced] = electro1 > electro2 ?
      [atom2, atom1] : [atom1, atom2];

    const product1: Atom = { ...oxidized, charge: oxidized.charge + 1 };
    const product2: Atom = { ...reduced, charge: reduced.charge - 1 };

    return {
      type: ReactionType.REDOX,
      reactants: [atom1, atom2],
      products: [product1, product2],
      probability,
      energyChange: -0.1
    };
  }

  /**
   * Execute a reaction
   */
  executeReaction(candidate: ReactionCandidate): ReactionEvent {
    const event: ReactionEvent = {
      type: candidate.type,
      reactants: candidate.reactants,
      products: candidate.products,
      position: {
        x: candidate.reactants.reduce((sum, atom) => sum + atom.x, 0) / candidate.reactants.length,
        y: candidate.reactants.reduce((sum, atom) => sum + atom.y, 0) / candidate.reactants.length
      },
      timestamp: Date.now(),
      emotionalImpact: this.getEmotionalImpact(candidate.type)
    };

    this.reactionHistory.push(event);
    return event;
  }

  /**
   * Get emotional impact description for reaction type
   */
  private getEmotionalImpact(type: ReactionType): string {
    const impacts = {
      [ReactionType.SYNTHESIS]: 'feeling of connection and growth',
      [ReactionType.DECOMPOSITION]: 'experience of loss and fragmentation',
      [ReactionType.DISPLACEMENT]: 'shift in relationships and priorities',
      [ReactionType.COMBUSTION]: 'intense emotional release and catharsis',
      [ReactionType.ACID_BASE]: 'conflict resolution and emotional balance',
      [ReactionType.REDOX]: 'power dynamics shift and boundary changes'
    };

    return impacts[type];
  }

  // Utility methods
  private distance(atom1: Atom, atom2: Atom): number {
    const dx = atom2.x - atom1.x;
    const dy = atom2.y - atom1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private canBond(atom1: Atom, atom2: Atom): boolean {
    // Simplified bonding rules
    const compatiblePairs = [
      ['H', 'O'], ['H', 'C'], ['C', 'O'], ['C', 'N'],
      ['N', 'H'], ['O', 'Na'], ['Ca', 'O'], ['P', 'O']
    ];

    return compatiblePairs.some(([a, b]) =>
      (atom1.element === a && atom2.element === b) ||
      (atom1.element === b && atom2.element === a)
    );
  }

  private getValenceElectrons(element: string): number {
    const valenceMap: { [key: string]: number } = {
      'H': 1, 'C': 4, 'N': 3, 'O': 2, 'P': 3, 'Ca': 2, 'Na': 1, 'Cl': 1
    };
    return valenceMap[element] || 1;
  }

  private getCurrentBonds(atom: Atom, allAtoms: Atom[]): number {
    // Simplified: count nearby atoms within bonding distance
    return allAtoms.filter(other =>
      other.id !== atom.id &&
      this.distance(atom, other) < atom.radius + other.radius + 10
    ).length;
  }

  private getElementCompatibility(elem1: string, elem2: string): number {
    // Simplified compatibility matrix
    if (elem1 === elem2) return 0.8; // Same elements bond well
    if ((elem1 === 'H' && ['O', 'N', 'C'].includes(elem2)) ||
        (elem2 === 'H' && ['O', 'N', 'C'].includes(elem1))) return 0.9;
    if ((elem1 === 'O' && ['H', 'Ca', 'Na'].includes(elem2)) ||
        (elem2 === 'O' && ['H', 'Ca', 'Na'].includes(elem1))) return 0.7;
    return 0.3; // Default low compatibility
  }

  private getBondStrength(elem1: string, elem2: string): number {
    // Simplified bond strength (higher = stronger)
    const electronegativity: { [key: string]: number } = {
      'H': 2.1, 'C': 2.5, 'N': 3.0, 'O': 3.5, 'P': 2.1, 'Ca': 1.0, 'Na': 0.9, 'Cl': 3.2
    };

    const e1 = electronegativity[elem1] || 2.0;
    const e2 = electronegativity[elem2] || 2.0;

    return Math.abs(e1 - e2); // Difference indicates bond strength
  }

  private getElectronegativity(element: string): number {
    const electronegativity: { [key: string]: number } = {
      'H': 2.1, 'C': 2.5, 'N': 3.0, 'O': 3.5, 'P': 2.1, 'Ca': 1.0, 'Na': 0.9, 'Cl': 3.2
    };
    return electronegativity[element] || 2.0;
  }

  private blendColors(color1: string, color2: string): string {
    // Simplified color blending - in practice you'd parse hex colors
    return color1; // Return first color for now
  }

  private neutralizeColor(color: string): string {
    // Simplified color neutralization
    return '#888888'; // Gray for neutralized
  }

  /**
   * Adjust activation energy (affects reaction likelihood)
   */
  setActivationEnergy(energy: number) {
    this.activationEnergy = Math.max(0, Math.min(1, energy));
  }

  /**
   * Get reaction history
   */
  getReactionHistory(): ReactionEvent[] {
    return this.reactionHistory;
  }

  /**
   * Clear reaction history
   */
  clearHistory() {
    this.reactionHistory = [];
  }
}