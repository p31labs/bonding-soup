# Affective Chemistry Technical Specification

## 1. Core Thesis and Architectural Overview

This specification establishes the theoretical and mechanical framework for "Affective Chemistry" within the P31 universe. The core thesis of this engine is that **emotions are molecular, and regulation is chemistry.** The game teaches emotional regulation by manifesting it as literal, observable phenomena within a simulated chemical system.

In this paradigm, a volatile molecule is a 1:1 representation of a volatile emotional state—it is fast, highly reactive, and structurally unstable. Conversely, a stable molecule represents a grounded, regulated emotional state—it is slow, structurally sound, and acts as an anchor. Any reaction between molecules constitutes an emotional event, and catalysts represent the people, contexts, or interventions that trigger or enable a state change. This document serves as the bridge between the theoretical psychology of the game and the concrete implementation found in our engine modules.

The Affective Chemistry system interfaces directly with the `personalities.ts` engine module, which continuously calculates emotional kinematics based on archetype assignments. Each molecule instantiated in the system carries a personality archetype that determines its baseline behavior, interaction patterns, and regulatory potential. The system treats emotional states not as abstract status effects but as physical properties with mass, velocity, charge, and three-dimensional spatial presence.

## 2. Emotional Kinematics

Emotional Kinematics dictates how feelings (molecules) move through the simulation space. Movement is not random; it is heavily parameterized by the personality archetype assigned to the molecule. The `personalities.ts` engine module handles the continuous calculation of these vectors, updating position, velocity, and drift patterns at each physics tick.

We map the seven core personality types to specific emotional archetypes, defining their baseline velocity ($v$), drift patterns, and interaction radii ($r_i$).

### 2.1 Mediator
* **Emotional Archetype:** The Peacemaker / People-Pleaser
* **Velocity & Drift:** Low velocity ($v \approx 0.3$ units/tick). Drift pattern is orbital; mediators naturally seek to circle heavier, more stable molecules without colliding. The kinematic algorithm applies a tangential force vector that maintains orbital distance while minimizing angular momentum.
* **Interaction Radius:** Large ($r_i = 180$px). Mediators detect tension from afar and alter their path to intercept or buffer reacting pairs. They function as living dampeners, absorbing kinetic energy from volatile interactions.

### 2.2 Rock
* **Emotional Archetype:** The Stoic / Grounded State
* **Velocity & Drift:** Near-zero baseline velocity ($v \approx 0.05$ units/tick). No active drift; rocks only move when acted upon by significant external forces. The kinematic model treats them as having effectively infinite mass for momentum transfer calculations.
* **Interaction Radius:** Small ($r_i = 45$px). They do not seek interaction, but act as gravitational anchors for volatile molecules in their immediate vicinity. Rocks create zones of emotional stability where reaction rates decrease exponentially with proximity.

### 2.3 Loner
* **Emotional Archetype:** The Avoidant / Overwhelmed
* **Velocity & Drift:** Medium velocity ($v \approx 0.8$ units/tick). Drift pattern is actively repulsive; the kinematic algorithm actively vectors loners away from clusters or high-density areas. A repulsion field emanates from loners, growing stronger as local molecule density increases.
* **Interaction Radius:** Medium ($r_i = 90$px). Their radius acts as a boundary; if breached by another molecule, their velocity spikes to escape velocity ($v_{escape} \approx 2.5$ units/tick) for 20 ticks.

### 2.4 Fuel
* **Emotional Archetype:** The Anxious / Reactive
* **Velocity & Drift:** High velocity ($v \approx 1.5$ units/tick). Drift pattern is erratic and heavily influenced by Brownian motion parameters with amplitude $\sigma = 0.4$. Fuel molecules bounce rapidly off system boundaries and exhibit stochastic pathing.
* **Interaction Radius:** Large ($r_i = 200$px). Fuel molecules are highly seeking and will aggressively snap toward potential reaction partners with acceleration $a = 0.2$ units/tick² when within 1.5$\times$ their interaction radius of a compatible molecule.

### 2.5 Messenger
* **Emotional Archetype:** The Communicative / Projecting
* **Velocity & Drift:** High velocity ($v \approx 1.8$ units/tick). Drift pattern is strictly directional. Messengers move in straight lines until they hit a target, bouncing with perfect elasticity (coefficient of restitution $e = 1.0$).
* **Interaction Radius:** Small ($r_i = 30$px). They must make direct, near-physical contact to transfer their "message" (kinetic energy or state data). The kinematic model prioritizes linear momentum conservation over all other forces.

### 2.6 Builder
* **Emotional Archetype:** The Nurturing / Structuring
* **Velocity & Drift:** Medium velocity ($v \approx 0.6$ units/tick). Drift pattern is attractive toward unconnected atoms or fragmented molecules. Builders exhibit a tractor-beam-like force toward molecules with incomplete valence shells.
* **Interaction Radius:** Large ($r_i = 160$px). Builders scan for incomplete valence shells within their radius and apply a slow attractive force ($F_{attract} = k/r^2$ where $k = 0.15$) to facilitate synthesis reactions.

### 2.7 Oracle
* **Emotional Archetype:** The Intuitive / Dissociated
* **Velocity & Drift:** Extremely low velocity ($v \approx 0.1$ units/tick). Drift pattern is a slow, global wandering that ignores standard collision physics with molecules of lesser archetypes. Oracles are treated as having negative effective mass for repulsion calculations.
* **Interaction Radius:** Immense ($r_i = 350$px). The Oracle exerts a passive, calming dampening field over a massive area, reducing the velocity of all molecules within its radius by a factor of $1 - (r_i - d)/r_i$ where $d$ is distance from the Oracle.

## 3. VSEPR as Emotional Geometry

Valence Shell Electron Pair Repulsion (VSEPR) theory dictates molecular shape based on electron pair repulsion. In Affective Chemistry, this maps directly to emotional geometry. Electron pair repulsion represents competing emotional needs that naturally push away from one another, creating spatial separation. Bond angles dictate the shape and strain of a relationship, while lone pairs represent unmet needs that still occupy psychological space and exert invisible pressure on the system's overall geometry.

The engine dynamically assigns emotional patterns based on the calculated geometry, which is determined by the number of bonding pairs and lone pairs in the molecule's valence shell.

### 3.1 Linear Geometry (180°)
* **Configuration:** 2 bonding pairs, 0 lone pairs (AX₂)
* **Emotional Pattern:** Single-focus. This represents a state of extreme clarity or dangerous obsession. There is no nuance; the entity is pulled equally in exactly two opposite directions, or completely aligned on a single axis. Linear molecules exhibit maximum directional momentum but zero capacity for lateral emotional processing. They are either perfectly clear or dangerously fixated.

### 3.2 Bent Geometry (<120° or <109.5°)
* **Configuration:** 2 bonding pairs, 1-2 lone pairs (AX₂E or AX₂E₂)
* **Emotional Pattern:** Tension. The presence of lone pairs (unmet needs) pushes the visible bonds (relationships/actions) out of alignment. This geometry represents an individual under pressure, bending to accommodate invisible emotional weight. The bond angle decreases as lone pair count increases, representing escalating internal tension despite outward relationship maintenance.

### 3.3 Trigonal Planar Geometry (120°)
* **Configuration:** 3 bonding pairs, 0 lone pairs (AX₃)
* **Emotional Pattern:** Balanced but flat. This is a surface-level stability. While the competing needs are equally spaced and ostensibly harmonious, the emotional state lacks depth. It is easily disrupted by out-of-plane forces. Trigonal planar molecules are vulnerable to catalysts that can introduce lone pairs, converting them to bent geometries.

### 3.4 Tetrahedral Geometry (109.5°)
* **Configuration:** 4 bonding pairs, 0 lone pairs (AX₄)
* **Emotional Pattern:** Fully dimensional and stable. This represents a healthy, robust emotional state. The needs are distributed perfectly in three-dimensional space, providing structural integrity against external emotional kinematics. Tetrahedral molecules have the lowest potential energy in the system and serve as the foundation for complex synthesis reactions.

### 3.5 Octahedral Geometry (90°)
* **Configuration:** 6 bonding pairs, 0 lone pairs (AX₆)
* **Emotional Pattern:** Complex, many bonds, high-functioning. This represents an individual managing a massive cognitive and emotional load successfully. It is dense and requires high energy to maintain, but provides maximum interaction potential. Octahedral molecules are rare and typically only form in the presence of multiple catalysts or under extreme pressure conditions.

## 4. Reaction Types as Emotional Events

When interaction radii overlap and activation thresholds are met, the engine triggers a reaction. These chemical reactions are literal manifestations of emotional events, governing how the player's internal state evolves over time. The `personalities.ts` module calculates reaction probabilities based on archetype compatibility and current emotional geometry.

### 4.1 Synthesis Reactions ($A + B \rightarrow AB$)
* **Emotional Event:** Falling in love, forming a deep friendship, or integrating a new core belief. Two distinct states combine to form a new, heavier, and typically slower (more grounded) entity. The resulting molecule inherits a personality archetype that is a weighted average of its parents, biased toward the more stable archetype. Synthesis reactions release moderate heat (kinetic energy) and increase the system's overall stability metric.

### 4.2 Decomposition Reactions ($AB \rightarrow A + B$)
* **Emotional Event:** Grief, burnout, or dissociation. A complex state shatters under pressure or over time, splitting into its constituent, often more volatile, base emotions. Decomposition requires activation energy to break bonds but releases stored emotional energy as the molecule fragments. The resulting molecules inherit the original archetypes if they were combined, or default to Fuel archetypes if the decomposition represents complete breakdown.

### 4.3 Displacement Reactions ($A + BC \rightarrow AC + B$)
* **Emotional Event:** The Rebound, or shifting fixation. A new input rapidly replaces an existing bond, ejecting the former partner/fixation into the void as a highly reactive lone product. The displacing molecule (A) must have higher kinetic energy than the bond strength of BC. The ejected molecule (B) gains additional velocity equal to the difference, often becoming Fuel or Loner archetype.

### 4.4 Combustion Reactions ($A + O_2 \rightarrow CO_2 + H_2O + \text{Energy}$)
* **Emotional Event:** Anger, mania, or catharsis. A rapid, violent release of trapped energy. The molecule is fundamentally destroyed, leaving behind basic, stable byproducts (typically Rock or Mediator archetypes), but violently accelerating all surrounding molecules via the released kinetic energy. Combustion requires a critical mass of Fuel archetypes and an oxidizing catalyst. The reaction propagates through a chain reaction mechanism.

### 4.5 Acid-Base Reactions (Neutralization)
* **Emotional Event:** Conflict resolution. Two opposing, highly corrosive states (one proton donor, one proton acceptor) interact. Their opposition cancels out, resulting in "water and salt"—a stable, harmless, grounded emotional baseline. In the engine, acid-base reactions are modeled as proton transfer events that equalize charge states. The resulting molecules have reduced interaction radii and velocity.

### 4.6 Redox Reactions (Reduction-Oxidation)
* **Emotional Event:** Power dynamics and boundary setting. The literal transfer of electrons represents the transfer of power or emotional labor. One molecule is oxidized (loses energy/boundaries) while the other is reduced (gains energy/control). Redox reactions require a redox potential difference greater than 0.5V (simulated units). The oxidized molecule typically shifts toward Loner or Fuel archetypes, while the reduced molecule shifts toward Rock or Builder.

## 5. Catalysis and Activation Energy

Not all emotional events happen spontaneously. The engine utilizes the concepts of Activation Energy ($E_a$) and Catalysis to model the friction of emotional regulation.

### 5.1 Activation Energy ($E_a$)
Activation Energy represents the raw effort required to *start* regulating. A player may have the correct molecules (intentions) present, but if the $E_a$ is too high, the reaction will not trigger. The engine models this as an energy barrier that must be overcome for molecules to transition from reactants to products. The Arrhenius equation governs reaction rates: $k = A e^{-E_a/RT}$ where $k$ is the rate constant, $A$ is the pre-exponential factor, $R$ is the universal gas constant (simulated), and $T$ is the system temperature (emotional intensity).

### 5.2 Executive Dysfunction
We model "Executive Dysfunction" as a state of infinite (or near-infinite) activation energy, where no amount of internal kinetic energy can overcome the barrier. In this state, molecules remain kinetically trapped regardless of favorable reaction conditions. The `personalities.ts` module implements this as a hard cap on reaction probability, effectively setting $E_a = \infty$ for certain archetype combinations when the player's cognitive load exceeds threshold.

### 5.3 Catalysts
A catalyst lowers the $E_a$ required for a reaction. In the game world, catalysts are representations of safe people, therapists, structured environments, or medication. They participate in the reaction to guide it, but are not consumed by it. Mechanically, catalysts provide an alternative reaction pathway with lower activation energy. The Oracle archetype functions as a natural catalyst, reducing $E_a$ by 40% for all reactions within its interaction radius.

### 5.4 The Buffer
Deeply tied to catalysis is "The Buffer." The Buffer represents pre-processing communication or emotional padding. Mechanically, deploying a Buffer in the engine temporarily lowers the global $E_a$ of a specific spatial zone by a factor of 0.6, allowing synthesis and acid-base reactions to occur between molecules that would otherwise just collide and bounce away. The Buffer is implemented as a temporary modification to the interaction radius calculation, effectively increasing the effective radius for low-energy reactions.

## 6. Equilibrium and Le Chatelier's Principle

The overarching simulation operates on Le Chatelier's Principle: systems inherently resist change and strive for homeostasis. The engine maintains a dynamic equilibrium constant ($K_{eq}$) for reversible reactions, calculated as the ratio of product concentrations to reactant concentrations at equilibrium.

### 6.1 System Homeostasis
If the player introduces a massive amount of "stress" (e.g., a flood of Fuel molecules), the engine calculates the equilibrium shift and forces the system to compensate, often by accelerating synthesis reactions to trap the volatile molecules into heavier, slower structures. The equilibrium position shifts to minimize the disturbance, following the mathematical relationship $Q/K_{eq}$ where $Q$ is the reaction quotient.

### 6.2 Stress Response
Conversely, if a stressor or support is abruptly removed, the system violently shifts back. This maps directly to the psychological reality of why removing a structural support (such as a custody arrangement, daily routine, or medication) causes immediate emotional instability. The engine ensures that adding structure creates long-term stability by increasing the forward reaction rate, but removing it triggers a cascade of decomposition reactions as the system hunts for a new baseline. The rate of this shift is governed by the system's relaxation time constant ($\tau$), which varies based on the current molecular composition.

## 7. The Posner Molecule as Cognitive Coherence

The pinnacle of Affective Chemistry is the Posner Molecule, calcium phosphate cluster: $Ca_9(PO_4)_6$. 

### 7.1 Structural Properties
Within the engine, this molecule represents the "most regulated" state achievable. It consists of 39 atoms locked in perfect symmetry. The Posner molecule has a highly specific geometric structure with calcium atoms arranged in a cage-like formation around phosphate groups. This structure requires all elemental archetypes working in perfect concert—no lone pairs, all bonding pairs satisfied, achieving perfect tetrahedral and octahedral sub-geometries simultaneously.

### 7.2 Quantum Cognition Framework
According to Matthew Fisher's theory of quantum cognition, the Posner molecule's unique structure allows it to protect the quantum spin states of phosphorus nuclei, effectively acting as a neural qubit and enabling quantum coherence in the brain. In our emotional mapping, this coherence equates to absolute clarity of thought and profound emotional integration. The Posner requires all elemental archetypes working in perfect concert, representing the integration of intellect (calcium), communication (phosphorus), and structure (oxygen).

### 7.3 Game Mechanics
Building the Posner in-game is not merely the ultimate quest because it is structurally difficult to assemble; it is the ultimate quest because its synthesis signifies the successful integration of all lower-level emotional regulation systems. Once synthesized, the Posner molecule's presence globally stabilizes the simulation, drastically lowering the volatility of all nearby elements. The Posner emits a stabilizing field that reduces $E_a$ for all reactions within 500px by 50% and increases the equilibrium constant for synthesis reactions by a factor of 3, effectively making the entire system more resilient to emotional perturbations.

The Posner molecule serves as both a gameplay objective and a mechanical representation of therapeutic integration—the moment when fragmented emotional states achieve coherent, stable function. Its perfect symmetry represents the ideal state of emotional regulation: not the absence of feeling, but the perfect orchestration of all feelings into a unified, stable whole.