# BONDING Implementation Backlog

## Epic: Molecular Physics Foundation

### Description
Implement the core physics engine that powers The Soup, based on validated Posner spike results. This epic establishes the spatial hashing, LOD system, and molecular simulation framework.

### Stories
- **BP-001:** Implement spatial hashing collision detection in `soupPhysics.ts`
  - Adaptive cell sizing (25-75px based on LOD)
  - O(n) complexity collision checks
  - Neighbor cell scanning optimization
- **BP-002:** Port LOD (Level of Detail) degradation system
  - Automatic FPS monitoring and LOD triggers
  - Progressive quality reduction (LOD 0→1→2)
  - Visual degradation indicators
- **BP-003:** Implement fixed 30Hz physics timestep
  - Accumulator-based frame skipping protection
  - Clean decoupling from 60fps render loop
  - Performance timing instrumentation
- **BP-004:** Create molecule data structures
  - Atom properties (position, velocity, element, charge)
  - Bond relationships and spring physics
  - Memory-efficient storage patterns

### Acceptance Criteria
- [ ] 39-atom Posner molecule renders stably at 30Hz
- [ ] LOD system prevents FPS drops below 45fps
- [ ] Spatial collision detection handles 200 molecules efficiently
- [ ] Memory usage remains under 50MB on target hardware

## Epic: Emotional Kinematics Engine

### Description
Implement the personality-based movement system that makes molecules behave according to the 7 emotional archetypes defined in the affective chemistry spec.

### Stories
- **EK-001:** Implement 7 personality archetypes
  - Mediator (orbital, high interaction radius)
  - Rock (near-zero velocity, gravitational anchor)
  - Loner (repulsive drift patterns)
  - Fuel (high velocity, erratic motion)
  - Messenger (directional, linear movement)
  - Builder (attractive toward incomplete structures)
  - Oracle (global dampening field)
- **EK-002:** Integrate personalities with physics
  - Archetype-based velocity calculations
  - Interaction radius modifications
  - Collision behavior variations
- **EK-003:** Add Brownian motion variations
  - Personality-specific noise patterns
  - Environmental influence factors
  - Stability vs reactivity balancing

### Acceptance Criteria
- [ ] All 7 archetypes exhibit distinct movement patterns
- [ ] Personality traits affect molecule interactions
- [ ] Physics simulation remains stable with personality variations

## Epic: Reaction Chemistry System

### Description
Implement the 6 chemical reaction types that manifest emotional events, creating the core gameplay loop of molecular transformation.

### Stories
- **RC-001:** Implement synthesis reactions ($A + B \rightarrow AB$)
  - Falling in love emotional event
  - Mass and velocity conservation
  - Product molecule generation
- **RC-002:** Implement decomposition reactions ($AB \rightarrow A + B$)
  - Grief/burnout emotional event
  - Bond breaking mechanics
  - Fragment velocity distribution
- **RC-003:** Implement displacement reactions ($A + BC \rightarrow AC + B$)
  - Rebound relationship dynamics
  - Competitive bonding logic
  - Ejected molecule handling
- **RC-004:** Implement remaining reaction types
  - Combustion (anger catharsis)
  - Acid-base (conflict resolution)
  - Redox (power dynamics)
- **RC-005:** Add reaction visualization
  - Particle effects for transformations
  - Audio cues for reaction events
  - UI feedback for emotional events

### Acceptance Criteria
- [ ] All 6 reaction types trigger correctly
- [ ] Emotional events map to appropriate reactions
- [ ] Visual/audio feedback enhances emotional impact

## Epic: The Soup World Zones

### Description
Implement the 4 distinct spatial zones that create emotional atmospheres and gameplay areas in The Soup.

### Stories
- **WZ-001:** Implement The Calm Zone
  - Center coordinate detection
  - 4-4-6 breathing rhythm synchronization
  - Velocity throttling and cognitive load reduction
- **WZ-002:** Implement The Lab
  - Molecule spawn point management
  - Full UI statistics overlay
  - High cognitive load zone effects
- **WZ-003:** Implement The Kitchen
  - Food-related molecule clustering
  - Gravitational attractor fields
  - Quest chain zone demarcation
- **WZ-004:** Implement The Deep
  - Posner molecule orbital mechanics
  - 863Hz Larmor frequency integration
  - Extreme edge boundary detection

### Acceptance Criteria
- [ ] All 4 zones have distinct visual/audio characteristics
- [ ] Zone transitions affect molecule behavior
- [ ] Player can navigate between zones smoothly

## Epic: Multiplayer Synchronization

### Description
Implement the asynchronous multiplayer system that allows players to see each other's molecules in real-time.

### Stories
- **MS-001:** Implement WebSocket connection management
  - 2Hz update rate synchronization
  - Connection state handling
  - Player color assignment
- **MS-002:** Add ghost molecule rendering
  - Other players' molecule visualization
  - Interpolation smoothing
  - Performance optimization for 50+ ghost molecules
- **MS-003:** Implement ping system
  - Emoji particle generation
  - Target molecule orbiting
  - Interaction feedback

### Acceptance Criteria
- [ ] Real-time multiplayer molecule visibility
- [ ] Smooth interpolation prevents rubber-banding
- [ ] Ping system enables player interaction

## Epic: Audio Landscape Integration

### Description
Implement the generative audio system that creates the immersive soundscape of The Soup.

### Stories
- **AL-001:** Implement molecule chord generation
  - Elemental composition to chord mapping
  - Geometric structure audio variations
  - Real-time chord updates
- **AL-002:** Add zone-based audio overrides
  - Calm Zone 4-4-6 breathing rhythm
  - Deep zone 863Hz Larmor frequency
  - Dynamic audio layering
- **AL-003:** Implement 8-oscillator Web Audio constraints
  - Voice stealing for oscillator management
  - Priority-based audio allocation
  - Performance monitoring

### Acceptance Criteria
- [ ] Each molecule produces unique audio signature
- [ ] Zone transitions change audio landscape
- [ ] Performance stays within 8 oscillator limit