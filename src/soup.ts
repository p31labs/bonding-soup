/**
 * BONDING Soup Engine
 * Main orchestration layer for The Soup molecular environment
 * Integrates physics, personalities, reactions, and audio systems
 */

import { SoupPhysics, Atom, Bond, DEFAULT_SOUP_CONFIG, PhysicsConfig } from './soupPhysics';
import { PersonalitiesEngine } from './personalities';
import { ReactionEngine, ReactionCandidate, ReactionEvent } from './reactions';
import { SoundtrackEngine } from './soundtrack';
import { particleSystem } from './particles';
import { PersistenceLayer, SavedMolecule } from './persistence';

export interface Zone {
  name: string;
  x: number;
  y: number;
  radius: number;
  effects: {
    velocityMultiplier: number;
    cognitiveLoadModifier: number;
    arousalModifier: number;
  };
  visualEffects?: {
    breathingRhythm?: {
      enabled: boolean;
      pattern: number[]; // [inhale, hold, exhale] in seconds
      phase: number;
      amplitude: number;
    };
    particleDensity?: number;
    lighting?: {
      brightness: number;
      color: string;
    };
    uiOverlays?: {
      enabled: boolean;
      stats?: boolean;
      builderStation?: boolean;
    };
  };
}

export interface Molecule {
  id: string;
  atoms: Atom[];
  bonds: Bond[];
  personality: string;
  creationTime: number;
}

export class SoupEngine {
  private physics: SoupPhysics;
  private personalities: PersonalitiesEngine;
  private reactions: ReactionEngine;
  private audio: SoundtrackEngine;
  private persistence: PersistenceLayer;
  private readonly physicsConfig: PhysicsConfig;

  private molecules: Map<string, Molecule> = new Map();
  private zones: Zone[] = [];
  private lastUpdate: number = 0;
  
  // WebSocket connection properties
  private ws: WebSocket | null = null;
  private wsUrl: string = '';
  private isWsConnected: boolean = false;
  private wsReconnectInterval: number = 5000; // Start at 5 seconds
  private wsMaxReconnectInterval: number = 30000; // Max 30 seconds
  private wsReconnectAttempts: number = 0;
  private wsHeartbeatInterval: number = 5000; // 5 seconds
  private wsLastHeartbeat: number = 0;
  private wsLastNetworkUpdate: number = 0;
  private wsNetworkUpdateInterval: number = 500; // 2Hz = 500ms
  
  // Ghost molecule tracking
  private ghostMolecules: Map<string, { 
    networkX: number; 
    networkY: number; 
    lastNetworkX: number; 
    lastNetworkY: number; 
    interpolatedX: number; 
    interpolatedY: number; 
    interpolationProgress: number; 
    isInterpolating: boolean;
    lastUpdate: number;
    element: string;
    personality: string;
  }> = new Map();
  
  // Ping tracking
  private outgoingPings: { 
    targetId: string; 
    emoji: string; 
    timestamp: number; 
  }[] = [];
  
  private incomingPings: { 
    id: string; 
    targetId: string; 
    emoji: string; 
    position: { x: number; y: number }; 
    createdAt: number; 
    expiresAt: number; 
  }[] = [];
  
  // Event log
  private eventLog: { 
    id: string; 
    type: string; 
    actorId: string; 
    targetId: string | null; 
    message: string; 
    timestamp: number; 
  }[] = [];

  // Event callbacks
  public onReaction?: (event: ReactionEvent) => void;
  public onMoleculeCreated?: (molecule: Molecule) => void;
  public onMoleculeDestroyed?: (moleculeId: string) => void;

  constructor(config: PhysicsConfig = DEFAULT_SOUP_CONFIG, wsUrl: string = '') {
    this.physicsConfig = config;
    this.physics = new SoupPhysics(config);
    this.personalities = new PersonalitiesEngine();
    this.reactions = new ReactionEngine();
    this.audio = new SoundtrackEngine();
    this.persistence = new PersistenceLayer();

    this.wsUrl = wsUrl;
    this.initializeZones();
    
    // Initialize WebSocket connection if URL provided
    if (this.wsUrl) {
      this.initializeWebSocket();
    }
  }

  private dbg(...args: unknown[]): void {
    if (this.physicsConfig.debug) {
      console.log(...args);
    }
  }

  private dbgw(...args: unknown[]): void {
    if (this.physicsConfig.debug) {
      console.warn(...args);
    }
  }

  /**
   * Initialize WebSocket connection for multiplayer synchronization
   */
  private initializeWebSocket(): void {
    try {
      this.ws = new WebSocket(this.wsUrl);
      
      this.ws.onopen = () => {
        this.isWsConnected = true;
        this.wsReconnectAttempts = 0;
        this.wsLastHeartbeat = performance.now();
        this.wsLastNetworkUpdate = performance.now();
        this.dbg('WebSocket connected:', this.wsUrl);
        
        // Send initial state (in a real implementation, this would be more sophisticated)
        this.sendMoleculeStates();
      };
      
      this.ws.onmessage = (event) => {
        this.handleWebSocketMessage(event.data);
      };
      
      this.ws.onclose = () => {
        this.isWsConnected = false;
        this.dbg('WebSocket disconnected, attempting to reconnect...');
        this.scheduleReconnect();
      };
      
      this.ws.onerror = (error) => {
        this.dbgw('WebSocket error:', error);
        this.isWsConnected = false;
        // Don't schedule reconnect here - onclose will handle it
      };
    } catch (error) {
      this.dbgw('Failed to create WebSocket:', error);
      this.isWsConnected = false;
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule a reconnection attempt with exponential backoff
   */
  private scheduleReconnect(): void {
    // Calculate delay with exponential backoff and jitter
    const baseDelay = Math.min(
      this.wsReconnectInterval * Math.pow(2, this.wsReconnectAttempts),
      this.wsMaxReconnectInterval
    );
    const jitter = Math.random() * 0.1 * baseDelay; // ±10% jitter
    const delay = baseDelay + jitter;
    
    this.wsReconnectAttempts++;
    
    setTimeout(() => {
      if (!this.isWsConnected && this.wsUrl) {
        this.dbg(`Reconnecting to WebSocket (attempt ${this.wsReconnectAttempts})...`);
        this.initializeWebSocket();
      }
    }, delay);
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleWebSocketMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      
      // Handle different message types
      switch (message.type) {
        case 'moleculeStateUpdate':
          this.handleMoleculeStateUpdate(message.data);
          break;
        case 'ping':
          this.handleIncomingPing(message.data);
          break;
        case 'eventLog':
          this.handleEventLog(message.data);
          break;
        case 'connectionInit':
          this.handleConnectionInit(message.data);
          break;
        default:
          this.dbgw('Unknown WebSocket message type:', message.type);
      }
    } catch (error) {
      this.dbgw('Failed to parse WebSocket message:', error, data);
    }
  }

  /**
   * Handle molecule state updates from other players
   */
  private handleMoleculeStateUpdate(data: any): void {
    if (!Array.isArray(data) && !data.molecules) return;

    const molecules = Array.isArray(data) ? data : data.molecules;

    molecules.forEach((moleculeData: any) => {
      const { id, x, y, vx, vy, personality, element } = moleculeData;

      // Get or create ghost molecule entry
      let ghost = this.ghostMolecules.get(id);
      if (!ghost) {
        ghost = {
          networkX: x,
          networkY: y,
          lastNetworkX: x,
          lastNetworkY: y,
          interpolatedX: x,
          interpolatedY: y,
          interpolationProgress: 0,
          isInterpolating: false,
          lastUpdate: performance.now(),
          element: element || 'O',
          personality: personality || 'mediator'
        };
        this.ghostMolecules.set(id, ghost);
      } else {
        // Store last known position for interpolation
        ghost.lastNetworkX = ghost.interpolatedX;
        ghost.lastNetworkY = ghost.interpolatedY;

        // Update network target
        ghost.networkX = x;
        ghost.networkY = y;
        ghost.lastUpdate = performance.now();
        ghost.element = element || ghost.element;
        ghost.personality = personality || ghost.personality;

        // Start interpolation
        ghost.interpolationProgress = 0;
        ghost.isInterpolating = true;
      }
    });
  }

  /**
   * Handle incoming ping events
   */
  private handleIncomingPing(data: any): void {
    const { targetId, emoji, position, senderId } = data;

    // Add to incoming pings array
    const ping = {
      id: `ping_${Date.now()}_${Math.random()}`,
      targetId,
      emoji,
      position,
      createdAt: Date.now(),
      expiresAt: Date.now() + 10000 // 10 second lifetime
    };

    this.incomingPings.push(ping);

    // Trigger particle effect
    if (particleSystem) {
      particleSystem.triggerReactionEffect('ping', position);
    }

    // Add to event log
    this.eventLog.push({
      id: `event_${Date.now()}`,
      type: 'ping',
      actorId: senderId,
      targetId,
      message: `pinged ${targetId} with ${emoji}`,
      timestamp: Date.now()
    });

    // Keep event log limited to prevent memory issues
    if (this.eventLog.length > 50) {
      this.eventLog = this.eventLog.slice(-50);
    }
  }

  /**
   * Handle event log entries from other players
   */
  private handleEventLog(data: any): void {
    if (Array.isArray(data)) {
      data.forEach(event => {
        this.eventLog.push({
          id: event.id || `event_${Date.now()}`,
          type: event.type,
          actorId: event.actorId,
          targetId: event.targetId,
          message: event.message,
          timestamp: event.timestamp || Date.now()
        });
      });
    } else {
      this.eventLog.push({
        id: data.id || `event_${Date.now()}`,
        type: data.type,
        actorId: data.actorId,
        targetId: data.targetId,
        message: data.message,
        timestamp: data.timestamp || Date.now()
      });
    }

    // Keep event log limited
    if (this.eventLog.length > 50) {
      this.eventLog = this.eventLog.slice(-50);
    }
  }

  /**
   * Handle initial connection state from server
   */
  private handleConnectionInit(data: any): void {
    this.dbg('Received connection init from server:', data);

    // Clear existing ghost molecules
    this.ghostMolecules.clear();

    // Initialize with server snapshot
    if (data.molecules) {
      this.handleMoleculeStateUpdate(data.molecules);
    }

    if (data.eventLog) {
      this.handleEventLog(data.eventLog);
    }

    this.dbg(`Initialized with ${this.ghostMolecules.size} ghost molecules`);
  }

  /**
   * Send current molecule states to other players
   * This would be called at 2Hz interval
   */
  private sendMoleculeStates(): void {
    if (!this.isWsConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }
    
    // Throttle to 2Hz update rate
    const now = performance.now();
    if (now - this.wsLastNetworkUpdate < this.wsNetworkUpdateInterval) {
      return;
    }
    
    this.wsLastNetworkUpdate = now;
    
    // In a full implementation, this would:
    // 1. Collect current molecule states (position, velocity, etc.)
    // 2. Compress/delta-compress the data
    // 3. Send as WebSocket message
    
    // For now, we'll just send a heartbeat to keep connection alive
    const heartbeat = {
      type: 'heartbeat',
      timestamp: now
    };
    
    try {
      this.ws.send(JSON.stringify(heartbeat));
    } catch (error) {
      this.dbgw('Failed to send WebSocket message:', error);
      this.isWsConnected = false;
      this.scheduleReconnect();
    }
  }

  /**
   * Start the WebSocket update loop (2Hz for sending state)
   */
  private startWebSocketLoop(): void {
    // This would be called after connection establishes
    // For now, we'll just note that the heartbeat handles timing
  }

  /**
   * Four zones laid out in a diamond within the physics bounds (Calm L, Lab top, Kitchen R, Deep bottom).
   */
  private initializeZones() {
    const { width: w, height: h } = this.physics.getWorldSize();
    const r = Math.min(w, h) * 0.28;

    this.zones = [
      {
        name: 'calm',
        x: w * 0.2,
        y: h * 0.5,
        radius: r,
        effects: {
          velocityMultiplier: 0.4,
          cognitiveLoadModifier: -0.3,
          arousalModifier: -0.2
        },
        visualEffects: {
          breathingRhythm: {
            enabled: true,
            pattern: [4, 4, 6],
            phase: 0,
            amplitude: 0.15
          },
          particleDensity: 1.5,
          lighting: {
            brightness: 1.2,
            color: '#1a1a2a'
          }
        }
      },
      {
        name: 'lab',
        x: w * 0.5,
        y: h * 0.25,
        radius: r,
        effects: {
          velocityMultiplier: 1.0,
          cognitiveLoadModifier: 0.2,
          arousalModifier: 0.1
        },
        visualEffects: {
          particleDensity: 0.8,
          lighting: {
            brightness: 1.3,
            color: '#2a2a3a'
          },
          uiOverlays: {
            enabled: true,
            builderStation: true,
            stats: true
          }
        }
      },
      {
        name: 'kitchen',
        x: w * 0.8,
        y: h * 0.5,
        radius: r,
        effects: {
          velocityMultiplier: 1.0,
          cognitiveLoadModifier: 0.1,
          arousalModifier: -0.1
        },
        visualEffects: {
          particleDensity: 1.2,
          lighting: {
            brightness: 1.1,
            color: '#3a2a1a'
          }
        }
      },
      {
        name: 'deep',
        x: w * 0.5,
        y: h * 0.75,
        radius: r,
        effects: {
          velocityMultiplier: 0.6,
          cognitiveLoadModifier: 0.3,
          arousalModifier: 0.0
        },
        visualEffects: {
          particleDensity: 0.3,
          lighting: {
            brightness: 0.7,
            color: '#0a0a1a'
          }
        }
      }
    ];
  }

  /**
   * Create a new molecule in The Soup
   */
  createMolecule(atoms: Atom[], bonds: Bond[] = [], personality: string = 'mediator'): string {
    const moleculeId = `molecule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Add to physics simulation
    this.physics.addMolecule(atoms, bonds);

    // Assign personalities to atoms
    atoms.forEach(atom => {
      this.personalities.assignPersonality(atom.id, personality as any);
    });

    // Register with audio system
    atoms.forEach(atom => {
      this.audio.registerMolecule(atom.id, atom.element, atom.x, atom.y);
    });

    // Create molecule record
    const molecule: Molecule = {
      id: moleculeId,
      atoms: [...atoms],
      bonds: [...bonds],
      personality,
      creationTime: Date.now()
    };

    this.molecules.set(moleculeId, molecule);

    if (this.onMoleculeCreated) {
      this.onMoleculeCreated(molecule);
    }

    return moleculeId;
  }

  /**
   * Destroy a molecule
   */
  destroyMolecule(moleculeId: string) {
    const molecule = this.molecules.get(moleculeId);
    if (!molecule) return;

    // Remove from physics
    this.physics.removeMolecule(molecule.atoms.map(a => a.id));

    // Remove from audio
    molecule.atoms.forEach(atom => {
      this.audio.removeMoleculeAudio(atom.id);
    });

    // Remove from molecules
    this.molecules.delete(moleculeId);

    if (this.onMoleculeDestroyed) {
      this.onMoleculeDestroyed(moleculeId);
    }
  }

  /**
   * Main update loop
   */
  update(deltaTime: number) {
    const currentTime = performance.now();

    // Update physics
    this.physics.update(deltaTime);

    // Update personalities and emotional states
    const allAtoms = this.physics.getAtoms();
    allAtoms.forEach(atom => {
      // Get current zone effects
      const zone = this.getCurrentZone(atom.x, atom.y);
      const zoneEffects = zone ? {
        arousalModifier: zone.effects.arousalModifier,
        cognitiveModifier: zone.effects.cognitiveLoadModifier
      } : {};

      // Update personality behavior
      this.personalities.updateAtomBehavior(atom, allAtoms, deltaTime);

      // Update emotional state
      const nearbyAtoms = this.getNearbyAtoms(atom, allAtoms, 100); // 100px radius for social context
      this.personalities.updateEmotionalState(atom.id, nearbyAtoms, zoneEffects);
    });

    // Update ghost molecule interpolations
    this.updateGhostMolecules(deltaTime);

    // Check for reactions
    const allBonds = this.physics.getBonds();
    const reactionCandidates = this.reactions.findPotentialReactions(allAtoms, allBonds);

    if (reactionCandidates.length > 0) {
      // Execute the most probable reaction
      const bestCandidate = reactionCandidates.reduce((best, current) =>
        current.probability > best.probability ? current : best
      );

      if (bestCandidate.probability > 0.3) { // Threshold for reaction
        const reactionEvent = this.reactions.executeReaction(bestCandidate);

        // Handle reaction consequences
        this.handleReaction(reactionEvent);

        if (this.onReaction) {
          this.onReaction(reactionEvent);
        }
      }
    }

    // Update audio positions
    const atomPositions = allAtoms.map(atom => ({
      id: atom.id,
      x: atom.x,
      y: atom.y,
      element: atom.element
    }));
    this.audio.updateAllMoleculeAudio(atomPositions);

    this.cleanExpiredPings(currentTime);

    // Send our own molecule state at 2Hz (if connected)
    this.sendMoleculeStatesIfDue(currentTime);

    this.lastUpdate = currentTime;
  }

  /**
   * Handle reaction consequences
   */
  private handleReaction(event: ReactionEvent) {
    // Find reactant molecules
    const reactantMolecules: string[] = [];
    event.reactants.forEach(atom => {
      for (const [moleculeId, molecule] of this.molecules) {
        if (molecule.atoms.some(a => a.id === atom.id)) {
          if (!reactantMolecules.includes(moleculeId)) {
            reactantMolecules.push(moleculeId);
          }
          break;
        }
      }
    });

    // Get personalities of reactant molecules for inheritance
    const reactantPersonalities = reactantMolecules.map(id => {
      const molecule = this.molecules.get(id);
      return molecule ? molecule.personality : 'fuel';
    });

    // Blend personalities for synthesis reactions
    let productPersonality = 'fuel'; // Default
    if (event.type === 'synthesis' && reactantPersonalities.length >= 2) {
      productPersonality = this.blendPersonalities(reactantPersonalities[0], reactantPersonalities[1]);
    }

    // Lineage for WCD-33: capture before reactants are removed from the sim
    const heritageParentIds = reactantMolecules.slice();

    // Remove reactant molecules
    reactantMolecules.forEach(moleculeId => {
      this.destroyMolecule(moleculeId);
    });

    // Create product molecules
    if (event.products.length > 0) {
      // Group products into new molecules
      const newMolecule = this.createMolecule(event.products, [], productPersonality);

      // Check if this molecule should be saved (significant emotional events)
      const shouldSave = this.shouldSaveMolecule(event, productPersonality);
      if (shouldSave) {
        setTimeout(() => {
          // Small delay to ensure molecule is fully created
          this.saveSignificantMolecule(newMolecule, event, heritageParentIds);
        }, 100);
      }

      // Record synthesis event
      this.persistence.recordSynthesis();
    }
  }

  /**
   * Blend two personalities for synthesis product inheritance
   */
  private blendPersonalities(personality1: string, personality2: string): string {
    // Personality blending matrix based on emotional compatibility
    const blendMatrix: { [key: string]: { [key: string]: string } } = {
      'mediator': {
        'mediator': 'mediator',    // Double mediator = enhanced peacemaking
        'rock': 'builder',         // Mediator + Rock = nurturing stability
        'loner': 'oracle',         // Mediator + Loner = intuitive understanding
        'fuel': 'messenger',       // Mediator + Fuel = communicative energy
        'messenger': 'mediator',   // Enhanced mediation
        'builder': 'mediator',     // Enhanced mediation
        'oracle': 'mediator'       // Enhanced mediation
      },
      'rock': {
        'mediator': 'builder',     // Rock + Mediator = nurturing stability
        'rock': 'rock',           // Double rock = maximum stability
        'loner': 'rock',          // Rock + Loner = stable independence
        'fuel': 'builder',        // Rock + Fuel = stable growth
        'messenger': 'rock',      // Rock + Messenger = stable communication
        'builder': 'rock',        // Enhanced stability
        'oracle': 'rock'          // Enhanced stability
      },
      'loner': {
        'mediator': 'oracle',     // Loner + Mediator = intuitive understanding
        'rock': 'rock',           // Loner + Rock = stable independence
        'loner': 'loner',         // Double loner = enhanced independence
        'fuel': 'fuel',           // Loner + Fuel = reactive independence
        'messenger': 'oracle',    // Loner + Messenger = intuitive communication
        'builder': 'builder',     // Loner + Builder = independent growth
        'oracle': 'loner'         // Enhanced independence
      },
      'fuel': {
        'mediator': 'messenger',   // Fuel + Mediator = communicative energy
        'rock': 'builder',        // Fuel + Rock = stable growth
        'loner': 'fuel',          // Fuel + Loner = reactive independence
        'fuel': 'fuel',           // Double fuel = maximum energy
        'messenger': 'fuel',      // Enhanced energy
        'builder': 'fuel',        // Enhanced energy
        'oracle': 'oracle'        // Fuel + Oracle = intuitive energy
      },
      'messenger': {
        'mediator': 'mediator',   // Messenger + Mediator = enhanced mediation
        'rock': 'rock',           // Messenger + Rock = stable communication
        'loner': 'oracle',        // Messenger + Loner = intuitive communication
        'fuel': 'fuel',           // Messenger + Fuel = enhanced energy
        'messenger': 'messenger', // Double messenger = maximum communication
        'builder': 'messenger',   // Enhanced communication
        'oracle': 'messenger'     // Enhanced communication
      },
      'builder': {
        'mediator': 'mediator',   // Builder + Mediator = enhanced mediation
        'rock': 'rock',           // Builder + Rock = enhanced stability
        'loner': 'builder',       // Builder + Loner = independent growth
        'fuel': 'fuel',           // Builder + Fuel = enhanced energy
        'messenger': 'messenger', // Builder + Messenger = enhanced communication
        'builder': 'builder',     // Double builder = maximum growth
        'oracle': 'builder'       // Enhanced growth
      },
      'oracle': {
        'mediator': 'mediator',   // Oracle + Mediator = enhanced mediation
        'rock': 'rock',           // Oracle + Rock = enhanced stability
        'loner': 'loner',         // Oracle + Loner = enhanced independence
        'fuel': 'oracle',         // Oracle + Fuel = intuitive energy
        'messenger': 'messenger', // Oracle + Messenger = enhanced communication
        'builder': 'builder',     // Oracle + Builder = enhanced growth
        'oracle': 'oracle'        // Double oracle = maximum intuition
      }
    };

    // Ensure personality1 is the key and personality2 is looked up
    const blend = blendMatrix[personality1]?.[personality2];
    return blend || personality1; // Fallback to first personality if no blend defined
  }

  /**
   * Get current zone for position
   */
  private getCurrentZone(x: number, y: number): Zone | null {
    for (const zone of this.zones) {
      const dx = x - zone.x;
      const dy = y - zone.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= zone.radius) {
        return zone;
      }
    }
    return null;
  }

  /**
   * Update individual atom physics
   */
  private updateAtomPhysics(atom: Atom, dt: number) {
    // Apply zone-specific forces
    this.applyZoneForces(atom, dt);

    // Apply velocity damping based on LOD
    const physicsStats = this.physics.getStats();
    const damping = 0.98 - (physicsStats.lodLevel * 0.05);
    atom.vx *= damping;
    atom.vy *= damping;

    // Update position
    atom.x += atom.vx * dt * 100;
    atom.y += atom.vy * dt * 100;

    // Toroidal world bounds (match SoupPhysics)
    const { width, height } = this.physics.getWorldSize();
    if (atom.x < 0) atom.x += width;
    if (atom.x >= width) atom.x -= width;
    if (atom.y < 0) atom.y += height;
    if (atom.y >= height) atom.y -= height;
  }

  /**
   * Apply zone-specific forces to atoms
   */
  private applyZoneForces(atom: Atom, dt: number) {
    this.zones.forEach(zone => {
      const dx = zone.x - atom.x;
      const dy = zone.y - atom.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= zone.radius && distance > 0) {
        // Kitchen zone gravitational attractor for food-related molecules
        if (zone.name === 'kitchen' && this.isFoodRelated(atom.element)) {
          const force = 0.05 / (distance + 1); // F = k/r attraction
          const normalizedDx = dx / distance;
          const normalizedDy = dy / distance;

          atom.vx += normalizedDx * force * dt;
          atom.vy += normalizedDy * force * dt;
        }
      }
    });
  }

    /**
     * Check if an element is food-related (for Kitchen zone clustering)
     */
    private isFoodRelated(element: string): boolean {
      // Simplified food-related elements (could be expanded based on molecule composition)
      const foodElements = ['H', 'O', 'C', 'Ca', 'Na', 'P']; // Basic nutrients
      return foodElements.includes(element);
    }

    /**
     * Update ghost molecule interpolations based on network state
     */
    private updateGhostMolecules(deltaTime: number): void {
      this.ghostMolecules.forEach((ghost, id) => {
        if (ghost.isInterpolating) {
          // Update interpolation progress (0 to 1 over network interval)
          ghost.interpolationProgress += (deltaTime / this.wsNetworkUpdateInterval); // deltaTime in ms
          
          if (ghost.interpolationProgress >= 1) {
            ghost.interpolationProgress = 1;
            ghost.isInterpolating = false;
            
            // Snap to network position to prevent drift
            ghost.interpolatedX = ghost.networkX;
            ghost.interpolatedY = ghost.networkY;
          } else {
            // Hermite spline interpolation (smoothstep function: t*t*(3-2*t))
            const t = ghost.interpolationProgress;
            const smoothT = t * t * (3 - 2 * t);
            
            ghost.interpolatedX = ghost.lastNetworkX + (ghost.networkX - ghost.lastNetworkX) * smoothT;
            ghost.interpolatedY = ghost.lastNetworkY + (ghost.networkY - ghost.lastNetworkY) * smoothT;
          }
        }
      });
    }

    /**
     * Send our own molecule states to other players at 2Hz rate
     */
    private sendMoleculeStatesIfDue(currentTime: number): void {
      // Throttle to 2Hz update rate
      if (currentTime - this.wsLastNetworkUpdate < this.wsNetworkUpdateInterval) {
        return;
      }
      
      this.wsLastNetworkUpdate = currentTime;
      
      // In a full implementation, this would:
      // 1. Collect current molecule states (position, velocity, etc.)
      // 2. Compress/delta-compress the data
      // 3. Send as WebSocket message
      
      // For now, we'll just send a heartbeat to keep connection alive
      if (this.isWsConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
        const heartbeat = {
          type: 'heartbeat',
          timestamp: currentTime
        };
        
        try {
          this.ws.send(JSON.stringify(heartbeat));
        } catch (error) {
          this.dbgw('Failed to send WebSocket message:', error);
          this.isWsConnected = false;
          this.scheduleReconnect();
        }
      }
    }

  /**
   * Get atoms near a specific atom within radius
   */
  private getNearbyAtoms(centerAtom: Atom, allAtoms: Atom[], radius: number): Atom[] {
    return allAtoms.filter(atom => {
      if (atom.id === centerAtom.id) return false;
      const dx = atom.x - centerAtom.x;
      const dy = atom.y - centerAtom.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= radius;
    });
  }

  /**
   * Determine if a molecule should be automatically saved
   */
  private shouldSaveMolecule(event: ReactionEvent, personality: string): boolean {
    // Save molecules from significant emotional events
    const significantReactions = ['synthesis'];
    const significantPersonalities = ['mediator', 'oracle', 'builder'];

    return significantReactions.includes(event.type) &&
           significantPersonalities.includes(personality);
  }

  /**
   * Save a significant molecule with emotional context and heritage
   * @param reactionParentMoleculeIds - Reactant molecule IDs (must be supplied for synthesis after parents are destroyed)
   */
  private saveSignificantMolecule(
    moleculeId: string,
    event: ReactionEvent,
    reactionParentMoleculeIds?: string[]
  ): void {
    const molecule = this.molecules.get(moleculeId);
    if (!molecule) return;

    // Determine emotional context based on reaction and zone
    const zone = this.getCurrentZone(
      molecule.atoms.reduce((sum, atom) => sum + atom.x, 0) / molecule.atoms.length,
      molecule.atoms.reduce((sum, atom) => sum + atom.y, 0) / molecule.atoms.length
    );

    let emotionalContext = '';
    let significance = 0.5;
    let reactionType = '';

    switch (event.type) {
      case 'synthesis':
        emotionalContext = `Born from ${event.reactants.length} reactants in the ${zone?.name || 'unknown'} zone`;
        significance = zone?.name === 'calm' ? 0.9 : zone?.name === 'deep' ? 0.8 : 0.7;
        reactionType = 'synthesis';
        break;
      case 'decomposition':
        emotionalContext = `Transformed through separation in the ${zone?.name || 'unknown'} zone`;
        significance = 0.6;
        reactionType = 'decomposition';
        break;
      case 'displacement':
        emotionalContext = `Reformed through competition in the ${zone?.name || 'unknown'} zone`;
        significance = 0.7;
        reactionType = 'displacement';
        break;
      default:
        emotionalContext = `Evolved through chemical change in the ${zone?.name || 'unknown'} zone`;
        significance = 0.5;
        reactionType = event.type;
    }

    // Parent IDs: prefer pre-capture from the reaction (reactants are often destroyed before this runs)
    let parentIds: string[] = [];
    if (reactionParentMoleculeIds && reactionParentMoleculeIds.length > 0) {
      parentIds = reactionParentMoleculeIds.filter((id) => id !== moleculeId);
    } else {
      const reactantAtomIds = new Set(event.reactants.map((atom) => atom.id));
      for (const [molId, mol] of this.molecules) {
        if (molId === moleculeId) continue;
        const molAtomIds = new Set(mol.atoms.map((atom) => atom.id));
        const intersection = new Set(
          [...reactantAtomIds].filter((id) => molAtomIds.has(id))
        );
        if (intersection.size > 0) {
          parentIds.push(molId);
        }
      }
    }

    this.persistence.saveMolecule({
      id: moleculeId,
      atoms: molecule.atoms,
      bonds: molecule.bonds,
      personality: molecule.personality,
      zone: zone?.name || 'unknown',
      emotionalContext,
      significance,
      parentIds: parentIds.length > 0 ? parentIds : undefined,
      reactionType: reactionType || undefined
    });
  }

  /**
   * Get saved molecules
   */
  getSavedMolecules(): SavedMolecule[] {
    return this.persistence.getSavedMolecules();
  }

  /**
   * Load a saved molecule
   */
  loadSavedMolecule(id: string): SavedMolecule | null {
    return this.persistence.loadMolecule(id);
  }

  /**
   * Rehydrate a saved molecule into the live Soup: new atom ids, fresh bond wiring,
   * cluster placement at a zone (torus-wrapped). Returns the new live molecule id, or null.
   */
  rehydrateSavedMolecule(
    id: string,
    options?: { targetZone?: 'calm' | 'lab' | 'kitchen' | 'deep' | 'center' }
  ): string | null {
    const saved = this.persistence.loadMolecule(id);
    if (!saved || !saved.atoms || saved.atoms.length === 0) return null;
    const zoneName = options?.targetZone ?? 'calm';
    const center = this.getRehydrationSpawnPoint(zoneName);
    const { atoms, bonds } = this.buildRehydratedAtomsAndBonds(saved, center);
    if (atoms.length === 0) return null;
    const newId = this.createMolecule(atoms, bonds, saved.personality);

    const heritageN = saved.heritage?.length ?? 0;
    const msg = `Rehydrated "${saved.name}" in ${zoneName} (Gen ${saved.generation ?? 0}, ${heritageN} heritage link(s)) → ${newId}`;
    this.eventLog.push({
      id: `rehydration_${Date.now()}`,
      type: 'rehydration',
      actorId: 'memory',
      targetId: newId,
      message: msg,
      timestamp: Date.now()
    });
    if (this.eventLog.length > 50) this.eventLog = this.eventLog.slice(-50);

    if (particleSystem) {
      particleSystem.triggerReactionEffect('synthesis', { x: center.x, y: center.y });
    }
    return newId;
  }

  private getRehydrationSpawnPoint(
    zoneName: 'calm' | 'lab' | 'kitchen' | 'deep' | 'center'
  ): { x: number; y: number } {
    const { width: w, height: h } = this.physics.getWorldSize();
    if (zoneName === 'center') {
      return { x: w * 0.5, y: h * 0.5 };
    }
    const z = this.zones.find((zz) => zz.name === zoneName) || this.zones.find((zz) => zz.name === 'calm');
    if (!z) return { x: w * 0.5, y: h * 0.5 };
    const cx = ((z.x % w) + w) % w;
    const cy = ((z.y % h) + h) % h;
    return { x: cx, y: cy };
  }

  private elementColor(element: string): string {
    const c: { [k: string]: string } = {
      H: '#f0f0f0',
      C: '#2c3e50',
      N: '#3498db',
      O: '#e94b3c',
      P: '#e67e22',
      Ca: '#ff6b35',
      Na: '#9b59b6',
      Cl: '#1abc9c',
      S: '#f1c40f',
      F: '#7fffd4',
      X: '#95a5a6'
    };
    return c[element] || '#bdc3c2';
  }

  private elementRadiusMassCharge(element: string): { r: number; m: number; c: number } {
    const table: { [k: string]: { r: number; m: number; c: number } } = {
      H: { r: 4, m: 1, c: 1 },
      C: { r: 5, m: 12, c: 0 },
      N: { r: 5, m: 14, c: 0 },
      O: { r: 6, m: 16, c: -2 },
      P: { r: 7, m: 31, c: 0 },
      Ca: { r: 8, m: 40, c: 2 },
      Na: { r: 7, m: 23, c: 1 },
      Cl: { r: 6, m: 35, c: -1 }
    };
    return table[element] || { r: 5, m: 10, c: 0 };
  }

  private buildRehydratedAtomsAndBonds(
    saved: SavedMolecule,
    center: { x: number; y: number }
  ): { atoms: Atom[]; bonds: Bond[] } {
    const raw = saved.atoms;
    const n = raw.length;
    const ring = Math.min(100, 14 + n * 0.45);
    const idMap = new Map<string, string>();
    const newAtoms: Atom[] = [];
    for (let i = 0; i < n; i++) {
      const old = raw[i] as any;
      const el = old && old.element != null ? String(old.element) : 'C';
      const angle = (2 * Math.PI * i) / Math.max(n, 1);
      const x = center.x + Math.cos(angle) * ring;
      const y = center.y + Math.sin(angle) * ring;
      const tid = `atom_r_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 8)}`;
      const { r: radius, m: mass, c: charge } = this.elementRadiusMassCharge(el);
      const a: Atom = {
        id: tid,
        x,
        y,
        vx: 0,
        vy: 0,
        element: el,
        color: this.elementColor(el),
        radius: typeof old.radius === 'number' ? old.radius : radius,
        mass: typeof old.mass === 'number' ? old.mass : mass,
        charge: typeof old.charge === 'number' ? old.charge : charge
      };
      newAtoms.push(a);
      const oid = old && typeof old.id === 'string' ? old.id : `legacy_${i}`;
      idMap.set(oid, tid);
    }

    const byId = (atomId: string) => newAtoms.find((at) => at.id === atomId);
    const newBonds: Bond[] = [];
    if (Array.isArray(saved.bonds)) {
      for (const b of saved.bonds) {
        if (!b || typeof b !== 'object') continue;
        const brec = b as { atom1?: any; atom2?: any; restLength?: number; strength?: number };
        const o1 = brec.atom1 && typeof brec.atom1.id === 'string' ? brec.atom1.id : null;
        const o2 = brec.atom2 && typeof brec.atom2.id === 'string' ? brec.atom2.id : null;
        if (!o1 || !o2) continue;
        const n1 = idMap.get(o1);
        const n2 = idMap.get(o2);
        if (!n1 || !n2) continue;
        const a1 = byId(n1);
        const a2 = byId(n2);
        if (!a1 || !a2) continue;
        const dx = a2.x - a1.x;
        const dy = a2.y - a1.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        newBonds.push({
          atom1: a1,
          atom2: a2,
          restLength: typeof brec.restLength === 'number' ? brec.restLength : dist,
          strength: typeof brec.strength === 'number' ? brec.strength : 0.35
        });
      }
    }
    return { atoms: newAtoms, bonds: newBonds };
  }

  /**
   * Get persistence statistics
   */
  getPersistenceStats() {
    return this.persistence.getStats();
  }

  /**
   * Get molecules by generation
   */
  getMoleculesByGeneration(generation: number): SavedMolecule[] {
    return this.persistence.getMoleculesByGeneration(generation);
  }

  /**
   * Get molecular heritage chain
   */
  getMolecularHeritage(moleculeId: string) {
    return this.persistence.getMolecularHeritage(moleculeId);
  }

  /**
   * Sync with global archive
   */
  async syncGlobalArchive(): Promise<void> {
    return this.persistence.syncGlobalArchive();
  }

  /**
   * Calculate distance between atoms
   */
  private distance(atom1: Atom, atom2: Atom): number {
    const dx = atom2.x - atom1.x;
    const dy = atom2.y - atom1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get atoms for rendering (includes ghost molecules)
   */
  getAtoms(): Atom[] {
    const localAtoms = this.physics.getAtoms();
    const ghostAtoms: Atom[] = [];

    // Convert ghost molecules to atom format for rendering
    this.ghostMolecules.forEach((ghost, id) => {
      ghostAtoms.push({
        id: `ghost_${id}`,
        x: ghost.interpolatedX,
        y: ghost.interpolatedY,
        vx: 0, // Ghosts don't have velocity for rendering
        vy: 0,
        element: ghost.element,
        color: this.getGhostColor(ghost.personality),
        radius: this.getGhostRadius(ghost.element),
        mass: 1, // Simplified mass for ghosts
        charge: 0 // Simplified charge for ghosts
      });
    });

    return [...localAtoms, ...ghostAtoms];
  }

  /**
   * Get color for ghost molecules based on personality
   */
  private getGhostColor(personality: string): string {
    const colors: { [key: string]: string } = {
      mediator: '#87ceeb',   // Sky blue
      rock: '#a0522d',       // Sienna brown
      loner: '#9370db',      // Medium purple
      fuel: '#ff6347',       // Tomato red
      messenger: '#daa520',  // Goldenrod
      builder: '#32cd32',    // Lime green
      oracle: '#8a2be2'      // Blue violet
    };
    return colors[personality] || '#cccccc'; // Default gray
  }

  /**
   * Get radius for ghost molecules based on element
   */
  private getGhostRadius(element: string): number {
    const radii: { [key: string]: number } = {
      'H': 4, 'C': 5, 'N': 5, 'O': 6, 'P': 7, 'Ca': 8, 'Na': 7, 'Cl': 6
    };
    return radii[element] || 5;
  }

  /**
   * Get bonds for rendering
   */
  getBonds(): Bond[] {
    return this.physics.getBonds();
  }

  /**
   * Get all molecules
   */
  getMolecules(): Molecule[] {
    return Array.from(this.molecules.values());
  }

  /**
   * Update zone visual effects (breathing rhythms, etc.)
   */
  private updateZoneEffects(deltaTime: number) {
    this.zones.forEach(zone => {
      if (zone.visualEffects?.breathingRhythm?.enabled) {
        const rhythm = zone.visualEffects.breathingRhythm;
        const totalCycle = rhythm.pattern.reduce((a, b) => a + b, 0); // Total cycle time

        // Update phase
        rhythm.phase = (rhythm.phase + deltaTime) % totalCycle;

        // Calculate current breathing amplitude based on phase
        let currentAmplitude = 0;
        let accumulatedTime = 0;

        for (let i = 0; i < rhythm.pattern.length; i++) {
          const segmentStart = accumulatedTime;
          const segmentEnd = accumulatedTime + rhythm.pattern[i];

          if (rhythm.phase >= segmentStart && rhythm.phase < segmentEnd) {
            const segmentProgress = (rhythm.phase - segmentStart) / rhythm.pattern[i];

            // Different amplitude curves for inhale/hold/exhale
            if (i === 0) { // Inhale: smooth increase
              currentAmplitude = segmentProgress * rhythm.amplitude;
            } else if (i === 1) { // Hold: maintain peak
              currentAmplitude = rhythm.amplitude;
            } else if (i === 2) { // Exhale: smooth decrease
              currentAmplitude = (1 - segmentProgress) * rhythm.amplitude;
            }
            break;
          }

          accumulatedTime = segmentEnd;
        }

        // Store current breathing amplitude for rendering
        (zone as any).currentBreathingAmplitude = currentAmplitude;
      }
    });
  }

  /**
   * Get zone information with current visual effects
   */
  getZones(): Zone[] {
    return this.zones;
  }

  /**
   * Get current breathing amplitude for a zone (0-1 scale)
   */
  getZoneBreathingAmplitude(zoneName: string): number {
    const zone = this.zones.find(z => z.name === zoneName);
    return zone && (zone as any).currentBreathingAmplitude ?
           (zone as any).currentBreathingAmplitude : 0;
  }

  /**
   * Check if a position is in the Lab zone for UI overlay rendering
   */
  isInLabZone(x: number, y: number): boolean {
    const labZone = this.zones.find(z => z.name === 'lab');
    if (!labZone) return false;

    const dx = x - labZone.x;
    const dy = y - labZone.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= labZone.radius;
  }

  /**
   * Get performance stats
   */
  getStats() {
    return {
      physics: this.physics.getStats(),
      audio: this.audio.getAudioStats(),
      molecules: this.molecules.size,
      reactionHistory: this.reactions.getReactionHistory().length
    };
  }

  /**
   * Adjust activation energy for reactions
   */
  setReactionActivationEnergy(energy: number) {
    this.reactions.setActivationEnergy(energy);
  }

  /**
   * Get reaction history
   */
  getReactionHistory() {
    return this.reactions.getReactionHistory();
  }

  /**
   * Send a ping to a target molecule
   */
  sendPing(targetId: string, emoji: string = '💧'): void {
    if (!this.isWsConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.dbgw('Cannot send ping: WebSocket not connected');
      return;
    }

    // Find target molecule position
    const targetMolecule = Array.from(this.molecules.values()).find(m =>
      m.atoms.some(atom => atom.id === targetId)
    );

    if (!targetMolecule) {
      this.dbgw('Cannot send ping: target molecule not found');
      return;
    }

    // Calculate center position of target molecule
    const centerX = targetMolecule.atoms.reduce((sum, atom) => sum + atom.x, 0) / targetMolecule.atoms.length;
    const centerY = targetMolecule.atoms.reduce((sum, atom) => sum + atom.y, 0) / targetMolecule.atoms.length;

    const pingData = {
      type: 'ping',
      targetId,
      emoji,
      position: { x: centerX, y: centerY },
      timestamp: Date.now()
    };

    try {
      this.ws.send(JSON.stringify(pingData));

      // Add to outgoing pings for local tracking
      this.outgoingPings.push({
        targetId,
        emoji,
        timestamp: Date.now()
      });
    } catch (error) {
      this.dbgw('Failed to send ping:', error);
    }
  }

  /**
   * Clean up expired pings
   */
  private cleanExpiredPings(currentTime: number): void {
    this.incomingPings = this.incomingPings.filter(ping =>
      ping.expiresAt > currentTime
    );

    this.outgoingPings = this.outgoingPings.filter(ping =>
      currentTime - ping.timestamp < 10000 // Keep for 10 seconds
    );
  }

  /**
   * Get current event log
   */
  getEventLog(): typeof this.eventLog {
    return this.eventLog;
  }

  /**
   * Get current pings
   */
  getIncomingPings(): typeof this.incomingPings {
    return this.incomingPings;
  }

  /**
   * Get ghost molecules
   */
  getGhostMolecules(): Map<string, any> {
    return this.ghostMolecules;
  }

  /**
   * Get WebSocket connection status
   */
  getConnectionStatus(): { connected: boolean; url: string; reconnectAttempts: number } {
    return {
      connected: this.isWsConnected,
      url: this.wsUrl,
      reconnectAttempts: this.wsReconnectAttempts
    };
  }

  /**
   * Resume audio context (call after user interaction)
   */
  async resumeAudio() {
    await this.audio.resume();
  }

  /**
   * Cleanup all resources
   */
  dispose() {
    // Close WebSocket connection
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.audio.dispose();
    this.molecules.clear();
    this.ghostMolecules.clear();
    this.incomingPings = [];
    this.outgoingPings = [];
    this.eventLog = [];
    this.reactions.clearHistory();
  }
}