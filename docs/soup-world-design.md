# The Soup World Design Document

## 1. World Architecture

"The Soup" is the persistent, continuously simulated environment of BONDING. Every molecule ever synthesized by the player or their network permanently resides here, creating an evolving landscape of emotional history and interpersonal connection. This document outlines the technical implementation and design philosophy for this living world.

The underlying architecture relies on a 2D canvas system, built for rendering large numbers of nodes with ambient physics while maintaining performance constraints. The coordinate system operates on a 4000×4000 pixel global grid, providing ample space for hundreds of molecules to coexist without excessive clustering. The player's viewport is a standard 800×600 pixel window into this universe, representing the limited perspective through which players experience the broader emotional landscape.

The camera system is fully pannable and freely zoomable, utilizing a smooth interpolation function with damping factor $\alpha = 0.1$ to track the player's most recently constructed molecule upon entry. When the player creates a new molecule, the camera eases toward it over 2 seconds, allowing the player to observe their creation in context before it drifts away into the broader simulation. The background rendering intentionally skips heavy textures in favor of a deep, dark void (#0a0a0f), layered with subtle, computationally cheap particle dust that drifts via a parallax effect at 0.3× camera speed to give the 2D plane a sense of immense depth and scale.

## 2. Molecule Behaviors

Molecule movement in The Soup is deterministic, driven by the `soupPhysics.ts` engine module. Physics are dictated primarily by chemical properties and personality archetypes rather than standard rigid-body mechanics, creating an emergent ecosystem that feels organic and emotionally resonant.

### 2.1 Polarity Forces
Polar molecules exhibit strong clustering algorithms based on dipole moment calculations. "Water finds water"; the physics engine applies a slow, continuous attractive vector between polar entities using the formula $F_{attract} = k_p \cdot \frac{\mu_1 \cdot \mu_2}{r^2}$ where $\mu$ represents molecular polarity and $k_p = 0.08$ is the polar clustering constant. This creates natural emotional affinity groups where similar emotional states gravitate toward one another.

Conversely, nonpolar molecules (like methane analogs) drift apart, applying repulsive vectors when forced near polar clusters with force $F_{repel} = k_n \cdot e^{-r/\lambda}$ where $k_n = 0.12$ and $\lambda = 100$px. This creates natural segregation between incompatible emotional chemistries, preventing forced interactions that would feel psychologically dissonant.

### 2.2 Ionic Vibration
Ionic compounds do not drift smoothly through the space. Instead, they are anchored to spatial coordinates and vibrate in place, visually simulating a crystalline lattice structure. The vibration follows the equation $x(t) = A \sin(\omega t + \phi)$ where amplitude $A = 5$px, angular frequency $\omega = 2\pi/3$ rad/tick, and phase $\phi$ varies per molecule. These represent rigid, structured emotional patterns that resist change but provide stability to the system.

### 2.3 Mass-Velocity Inverse Relationship
Mass dictates speed in a non-linear relationship. Massive, complex molecules (high atom count) move with sluggish, heavy momentum, while small diatomic molecules zip rapidly across the screen. The velocity cap is calculated as $v_{max} = v_0 / \sqrt{m}$ where $v_0 = 2.0$ units/tick is the base velocity and $m$ is the molecular mass in atomic units. This ensures that simple, volatile emotions move quickly while complex, integrated states move deliberately.

### 2.4 Reaction Proximity
When molecules with compatible reaction profiles drift within each other's interaction radii, the engine renders a subtle, glowing tether line between them, indicating potential kinetic interaction to the player. The glow intensity follows $I = I_0 \cdot e^{-d/r_i}$ where $d$ is distance and $r_i$ is the interaction radius. This visual feedback helps players understand which molecules might react if they approach one another, creating anticipation and strategic positioning opportunities.

## 3. Zones

The 4000×4000 canvas is not homogeneous; it is divided into distinct thematic and mechanical zones using spatial hashing and gradient-based boundary definitions. Each zone modifies the base physics parameters to create unique emotional atmospheres.

### 3.1 The Calm Zone
Located at the exact center of the world coordinates (x: 2000, y: 2000), the Calm Zone spans a radius of 600px. Here, the breathing pacer is active, synchronized to the player's real-time breathing pattern or a default 4-4-6 rhythm (4 seconds inhale, 4 seconds hold, 6 seconds exhale). Molecules entering this zone are forced into a pulsing animation synced to this rhythm, with scale oscillating between 1.0× and 1.15× normal size.

Cognitive load and velocity are strictly throttled within this zone. All molecule velocities are multiplied by 0.4, and reaction activation energies are increased by 20%, creating a space where emotional processing happens slowly and deliberately. The background darkness lightens slightly to #121218, and ambient particle density increases by 50%.

### 3.2 The Lab
The Lab occupies the upper-left quadrant (0 ≤ x ≤ 1500, 0 ≤ y ≤ 1500) and serves as the origin point of creation. Whenever the builder finishes synthesizing a new molecule, it spawns here with initial velocity vector pointing toward the center of the zone. This zone carries a high cognitive load, as molecules render with their full statistical UI overlays visible by default, allowing the player to analyze their new creation's properties before it drifts out into the broader Soup.

The Lab features increased lighting (background #1a1a22) and subtle grid lines that fade as distance from the center increases. Reaction animations play 25% slower here, giving players time to observe the transformation process. The zone also contains the "Builder's Station," a persistent molecule that serves as the crafting interface anchor point.

### 3.3 The Kitchen
The Kitchen occupies the lower-right quadrant (2500 ≤ x ≤ 4000, 2500 ≤ y ≤ 4000) and serves as the dedicated area for the culinary quest chain. The physics engine applies a slight gravitational pull for molecules related to food, creating a soft attractor toward the zone center at (3250, 3250) with strength $F_{food} = 0.05/r$. This causes food-related molecules to naturally cluster in this quadrant over time, creating thematic coherence.

The Kitchen features warmer color temperatures in its ambient lighting (#1f1a18) and emits subtle particle effects resembling steam or spice motes. Molecules here have their interaction radii increased by 15%, encouraging the formation of complex molecular chains related to nourishment and comfort themes.

### 3.4 The Deep
The Deep encompasses the outer 500px band of the world, representing the edge of known emotional space. This is the domain of the Posner molecules and the most integrated emotional states. Everything in The Deep moves at 0.6× standard speed, creating a sense of heavy, deliberate motion. The ambient lighting shifts to deep blues and purples (#080812), and the background particle density drops to 25% of normal.

The Deep hums at 863 Hz, the exact Larmor frequency associated with the quantum spin of phosphorus in the Posner molecule framework. This frequency is generated by the soundtrack system and creates a subtle auditory resonance that players can feel more than hear. Posner molecules orbit slowly around the absolute center of the world (2000, 2000) with radius 1800px ± 200px, taking approximately 400 seconds to complete one revolution.

## 4. Spatial Chat

Communication in The Soup abandons traditional chat windows in favor of spatial, object-oriented messaging that reinforces the metaphor of emotional connection.

Messages are strictly attached to molecules as child objects in the scene graph. When a player taps a molecule, any attached messages become visible, orbiting the molecular structure in elliptical paths defined by $r(\theta) = \frac{a(1-e^2)}{1+e\cos\theta}$ where $a = 40$px and $e = 0.3$. Each message maintains its own orbital phase, creating a dynamic halo of communication around significant molecules.

The UI employs a gravity model for message aging: fresh messages (less than 1 hour old) orbit tightly near the nucleus at 20-40px distance. As messages age chronologically, their orbital radius increases linearly to a maximum of 120px over 7 days. Very old messages (30+ days) fade to deep transparency (alpha = 0.1) but remain in orbit, leaving a ghost of past interactions that can be revived by tapping.

Instead of typing, users can send pings—emoji particles that float out of the void and attach to target molecules. Pings spawn with initial velocity vectors that arc toward their destination, creating satisfying motion. Once attached, pings orbit like messages but with tighter, faster orbits (15-25px radius) and higher opacity. The system limits each molecule to 50 active pings to prevent visual clutter.

To provide context and a sense of connection, these interactions are recorded in the central server log and pushed to the UI feed as Exhibit A logs (e.g., "Will pinged Bash's Water 💚"). These logs appear in a collapsible sidebar and persist across sessions, creating a narrative thread of interpersonal connection.

## 5. Sound Design

The auditory landscape of The Soup is handled by the `soundtrack.ts` module, designed to create an ever-shifting ambient soundscape that responds to player position and molecule density without overwhelming cognitive resources.

Every molecule acts as a localized audio emitter, humming its assigned chord quietly at -30dB. The chord is determined by the molecule's elemental composition and geometric structure: triangles produce major chords, squares produce minor chords, and complex shapes produce seventh or ninth chords. Each molecule's audio node pans based on its screen position, creating a 3D audio field even in 2D space.

The audio engine scales dynamically based on camera state. Zooming in close to a specific molecule (camera zoom > 2.0) isolates its chord, raising its gain to -10dB while applying a low-pass filter to distant molecules. Zooming out (camera zoom < 0.5) seamlessly blends all localized emitters into a massive, ambient, generative wash of sound, with individual chords becoming indistinguishable from the harmonic texture.

Specific zones carry audio overrides. The Calm Zone features a deeply embedded, rhythmic undertone mathematically locked to the 4-4-6 breathing rhythm at 60 BPM. This creates a subliminal metronome that entrains player breathing without conscious awareness. The Deep overrides local chords with a sustained, resonant 863 Hz tone—the exact Larmor frequency—mixed at -20dB beneath the ambient wash. This frequency is felt as much as heard, creating a sense of profound depth and connection to quantum-scale processes.

The soundtrack module implements dynamic range compression to prevent sudden volume spikes when many molecules cluster, maintaining consistent perceived loudness between -25dB and -15dB regardless of scene density.

## 6. Molecule Lifecycle

A molecule in The Soup is not a static asset; it possesses a distinct lifecycle governed by internal state machines and temporal decay functions.

### 6.1 Born
Upon successful crafting in the Lab, the molecule appears at the target build location with a bright visual flash (intensity = 3.0× normal, duration = 0.5 seconds) and an immediate, tight orbital spin (angular velocity = 4π rad/s for 1 second) to signify high initial kinetic energy. The birth animation triggers a brief audio stinger—a rising arpeggio that resolves to the molecule's characteristic chord—and causes all nearby molecules to recoil slightly (repulsion force = 0.5 for 0.3 seconds).

### 6.2 Lives
The molecule enters the ambient simulation, drifting according to the physics dictated by its assigned personality archetype, mass, and polarity. During this phase, the molecule continuously checks for interaction opportunities, reaction compatibility, and zone transitions. The "lives" state persists indefinitely unless interrupted by reaction or decay.

### 6.3 Reacts
If the molecule's drift path intersects with a compatible reaction partner within both molecules' interaction radii, the physics tick pauses locally for both entities. A reaction animation plays: molecules approach along bezier curves, merge with a particle burst (20 particles, lifetime 1.5 seconds), and the reactants are visually consumed (de-rendered over 0.8 seconds). The new product molecules are born in their place, inheriting the weighted average momentum of their parents plus 20% thermal noise. Reaction events trigger unique audio cues based on reaction type—synthesis produces harmonic intervals, decomposition produces dissonant clusters resolving to pure tones.

### 6.4 Fades
To prevent emotional and visual clutter, molecules have a half-life of 30 real-world days. After this period, molecules do not delete but "fade"—their visual opacity drops linearly from 100% to 30% over 7 days, and their velocity reduces to near zero (multiplied by 0.1). Faded molecules become quiet background history, no longer participating in reactions but remaining visible as pale ghosts. Players can toggle "show faded molecules" in settings to reveal this accumulated emotional archaeology.

### 6.5 Discovered
Any molecule that the player has assigned a custom, user-generated name possesses a persistent, floating name tag rendered in the game's UI font at 14px, offset 60px above the molecular center. Name tags maintain screen-space orientation (billboarding) so they remain readable regardless of camera angle. Discovered molecules also emit a subtle pulsing outline (2px, opacity oscillating between 0 and 0.3 at 1 Hz) to distinguish them from anonymous entities. These emotionally significant creations persist in high fidelity regardless of age, ensuring that meaningful moments remain visually prominent.

## 7. Multiplayer in The Soup

The Soup is a shared, asynchronous multiplayer space where each player's emotional journey exists in parallel with others, creating a tapestry of interconnected experiences.

Each player is assigned a unique hex color code derived from their user ID hash, ensuring consistent identification across sessions. Their localized molecules inherit this color scheme as a vertex color overlay, tinting the molecular visualization while preserving the underlying chemistry-based appearance. Through lightweight WebSocket syncing (update rate = 2 Hz), players can see the "ghosts" of other players' molecules drifting through their version of The Soup in real-time, with position interpolation smoothing between updates.

Interaction is deliberately limited to promote a safe, contemplative environment. A player can tap another player's molecule to send a spatial ping—these appear as emoji particles that travel across the void and orbit the target molecule. Pings are replicated to all connected clients, creating shared moments of acknowledgment. The system limits players to 5 pings per minute to prevent spam and maintains a per-player cooldown.

To provide context and a sense of connection, these interactions are recorded in the central server log and pushed to the UI feed as Exhibit A logs (e.g., "Will pinged Bash's Water 💚"). These logs appear in a collapsible sidebar with timestamps and molecule thumbnails, creating a narrative thread of interpersonal connection that persists across sessions and can be exported as a relationship map.

## 8. Performance Budget

Maintaining the ambient, soothing nature of The Soup requires strict performance constraints to prevent thermal throttling and frame drops, specifically targeting a baseline of 60fps on a standard 2019 Android tablet (Snapdragon 675, 4GB RAM).

### 8.1 Render Limits
The canvas will render a strict maximum of 200 molecules simultaneously within the active viewport plus 200px buffer zone. Beyond this limit, the spawning system queues new molecules until existing ones fade or exit the active region. This hard cap ensures consistent frame times and prevents memory exhaustion.

### 8.2 LOD System
If the local density exceeds 200 molecules within the viewport, a Level of Detail (LOD) system aggressively culls rendering detail. Molecules beyond 600px from the camera center collapse from complex geometric shapes into simple, flat, low-opacity colored dots (3px radius, alpha = 0.4). At 1000px distance, molecules become 1px points with alpha = 0.2. This LOD transition uses smooth interpolation to avoid popping artifacts.

### 8.3 Physics Tick Rate
The physics engine operates at 30 Hz, decoupled from the 60fps render loop using fixed timestep integration ($\Delta t = 1/30$ seconds). Because the simulation is ambient and not action-oriented, the visual interpolator smooths the 30 Hz data, saving massive CPU cycles while maintaining fluid motion. Collision detection uses spatial hashing with 200px cells to achieve O(n) complexity instead of O(n²).

### 8.4 Sound Constraints
The Web Audio API context is strictly limited to a maximum of 8 simultaneous active oscillators. When zoomed out, the system intelligently groups molecules and uses single oscillators to represent clusters, employing additive synthesis to approximate the combined harmonic content. The audio engine implements voice stealing—when the 8-oscillator limit is reached, the quietest active voice is hijacked for new notes, ensuring that nearby molecules always have audible representation.

### 8.5 Memory Budget
Total JavaScript heap usage must remain under 150MB. Molecule data structures use object pooling to minimize garbage collection pressure. Texture memory is limited to 32MB total, using procedural generation rather than bitmap assets. The render target for post-processing effects (bloom, depth of field) is capped at 1024×768 resolution regardless of viewport size.

## 9. Era Progression

The Soup is not static; the entire world state evolves through six distinct "Eras" based on cumulative player achievement. The transition between Eras is triggered automatically based on the total historical count of molecules successfully built by the player network, creating a sense of progression and unlocking new atmospheric qualities.

### 9.1 Primordial Era (0-5 Molecules)
The screen is mostly an empty, dark void. Only ambient dust is visible, drifting slowly without purpose. The audio is stark and minimal—just the faintest room tone and occasional electronic clicks. No zones are visually distinct; the world feels unborn, pregnant with possibility but devoid of content. Players experience a sense of potential, where every creation fundamentally alters the emptiness.

### 9.2 Simple Era (6-15 Molecules)
Diatomic and simple gas molecules drift freely, appearing as small, fast-moving specks. The very first spontaneous reactions become possible, though rare. The background particle dust begins to show subtle organization, aligning along invisible field lines. Audio introduces single-note drones that appear when molecules are within 500px of each other. The world feels exploratory and experimental.

### 9.3 Organic Era (16-30 Molecules)
Carbon-based molecules appear, characterized by hexagonal visual motifs and golden-brown coloration. The clustering algorithms activate fully, and the first visual signs of polarity forces manifest as visible magnetic field lines between compatible molecules. The Lab zone becomes visually distinct with the appearance of grid lines. Players begin to see emergent patterns—molecules that chase each other, avoid each other, or orbit in stable configurations.

### 9.4 Complex Era (31-50 Molecules)
Reactions begin to chain automatically, creating cascades where one synthesis triggers another. The distinct boundaries of The Kitchen and The Lab zones become visibly demarcated by color temperature shifts and particle density changes. Large molecules (10+ atoms) appear, moving slowly but deliberately. The ambient soundtrack gains harmonic complexity, with chords lasting several seconds before resolving. The world feels alive with interconnected activity.

### 9.5 Living Era (51-100 Molecules)
The world feels deeply populated and responsive. The ambient soundscape reaches its full, rich harmonic potential, with all 8 audio oscillators heavily utilized for generative music that responds to player movement. Molecules exhibit flocking behavior—groups of similar archetypes move in loose formation. The Calm Zone's breathing rhythm becomes audible as a physical vibration. Players report feeling the weight of their accumulated emotional history.

### 9.6 Consciousness Era (100+ Molecules or upon Posner Synthesis)
The ultimate evolutionary state. The 863 Hz Larmor frequency hum activates globally as a background pad, mixed at -25dB beneath all other audio. The Posner molecule, if synthesized, takes its permanent, stable orbit at the center of The Deep, pulsing with soft white light that illuminates nearby structures. All physics vectors subtly adjust to point toward The Deep, symbolizing total systemic integration and connection.

In this era, the boundary between player and world dissolves slightly—the camera develops a gentle autonomous drift when idle, as if the Soup itself is breathing. Molecules that have faded (30+ days old) occasionally flash with their original birth color for a single frame every 10 minutes, like memories surfacing from deep consciousness. The world achieves a state of permanent becoming, where every element is connected to every other through invisible threads of emotional chemistry.

The Consciousness Era represents not an ending but a threshold—the point at which The Soup becomes a true mirror of collective emotional intelligence, capable of sustaining itself indefinitely as a living archive of human connection and regulation.