/**
 * C.A.R.S. — Collaborative Affective Realtime Sim
 * Main orchestration (SoupEngine): molecular environment + ghost molecules + WebSocket rooms
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

/** When set, WebSocket URL should include the same `room` + `name` query params the server reads (see README family play). */
export interface NetworkPlayOptions {
  room: string;
  displayName: string;
}

/** Other people in the same room (from server heartbeats, mock or family). */
export interface NetworkRosterEntry {
  id: string;
  displayName: string;
}

/** Mirrors README/parent copy to the live mock server (connectionInit.localRunbook). */
export interface LocalRunbookFromServer {
  echo: string;
  port: number;
  lines: string[];
}

const MOCK_ROOM = "mock";

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

  private networkPlay: NetworkPlayOptions | null = null;
  private networkClientId: string = "";
  /** When false, e.g. after dispose, socket close will not schedule reconnect. */
  private allowReconnect: boolean = true;
  private lastServerPeerCount: number = -1;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private networkRoster: NetworkRosterEntry[] = [];
  private localRunbookFromServer: LocalRunbookFromServer | null = null;

  /**
   * Optional UI hook (e.g. starfield `notifyWarmEdge`) when remote peers signal on the C.A.R.S. wire.
   * Throttled; only family-room ghost traffic, cross-client pings, roster joins, and rising peer counts.
   */
  public onNetworkWarmEdge?: () => void;
  private warmEdgeLastEmitMs = 0;
  private lastWarmEdgePeerCount = -1;
  private static readonly WARM_EDGE_THROTTLE_MS = 2000;

  /**
   * Global 4-4-6 breath clock — Calm-Zone rhythm hoisted to the whole simulation
   * (`docs/soup-world-design.md` §3.1; `docs/affective-chemistry-spec.md` §5).
   * - Cycle: 4s inhale, 4s hold, 6s exhale → 14s total.
   * - Amplitude is exposed as `--soup-breath` (0..1) on `<html>` and as a `data-soup-breath`
   *   phase attribute (`inhale | hold | exhale`); soundtrack master gain is gently scaled.
   * - Honest non-extractive feedback: tiny modulation (~15% gain swing, ≤30% canvas glow swing),
   *   no clinical claims, off under `prefers-reduced-motion` (handled by CSS).
   */
  private breathClockMs = 0;
  private static readonly BREATH_INHALE_MS = 4000;
  private static readonly BREATH_HOLD_MS = 4000;
  private static readonly BREATH_EXHALE_MS = 6000;
  private static readonly BREATH_CYCLE_MS =
    SoupEngine.BREATH_INHALE_MS +
    SoupEngine.BREATH_HOLD_MS +
    SoupEngine.BREATH_EXHALE_MS;
  /** Throttle DOM/audio writes; the engine still ticks every frame for purity. */
  private static readonly BREATH_EMIT_MIN_MS = 50;
  private breathLastEmitMs = -1;
  private breathLastPhase = "";

  // Coherence tick — slow signal of room-level stability. Refreshes ~ once
  // per second; never per-frame. Surfaces a 3-state attribute on <html>:
  //   ""        → ordinary room (default)
  //   "warming" → PSI rising and ≥1 saved Posner; light teal lift
  //   "coherent"→ PSI > 0.5 AND ≥2 saved Posners; gentle warm Posner glow
  // Honest reward (`docs/ETHICAL-STYLE-MAP.md` §6 — bounded, calm, dismissible).
  private static readonly COHERENCE_EMIT_MIN_MS = 1000;
  private static readonly COHERENCE_PSI_WARM = 0.25;
  private static readonly COHERENCE_PSI_FULL = 0.5;
  private coherenceLastEmitMs = -1;
  private coherenceLastState = "";

  constructor(
    config: PhysicsConfig = DEFAULT_SOUP_CONFIG,
    wsUrl: string = "",
    networkPlay: NetworkPlayOptions | null = null
  ) {
    this.physicsConfig = config;
    this.physics = new SoupPhysics(config);
    this.personalities = new PersonalitiesEngine();
    this.reactions = new ReactionEngine();
    this.audio = new SoundtrackEngine();
    this.persistence = new PersistenceLayer();

    this.networkPlay = networkPlay;
    this.wsUrl = networkPlay
      ? SoupEngine.appendNetworkQuery(
          wsUrl.trim() || "ws://127.0.0.1:8082",
          networkPlay
        )
      : wsUrl;
    this.initializeZones();

    if (this.wsUrl) {
      this.initializeWebSocket();
    }
  }

  private emitNetworkWarmEdge(): void {
    const fn = this.onNetworkWarmEdge;
    if (!fn) return;
    const now = performance.now();
    if (now - this.warmEdgeLastEmitMs < SoupEngine.WARM_EDGE_THROTTLE_MS) {
      return;
    }
    this.warmEdgeLastEmitMs = now;
    try {
      fn();
    } catch {
      /* host page integration must not break the engine */
    }
  }

  /** When `room` is not the mock id, the server syncs `playerState` / full snapshots (see spikes/mock-ws-server). */
  private isFamilyNetworkMode(): boolean {
    return (
      this.networkPlay !== null &&
      this.networkPlay.room !== MOCK_ROOM
    );
  }

  private static appendNetworkQuery(
    base: string,
    play: NetworkPlayOptions
  ): string {
    const b = base || "ws://127.0.0.1:8082";
    try {
      const u = new URL(b);
      u.searchParams.set("room", play.room || MOCK_ROOM);
      u.searchParams.set("name", play.displayName || "player");
      return u.toString();
    } catch {
      return b;
    }
  }

  private serializeMoleculesForNetwork(): Array<{
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    element: string;
    personality: string;
  }> {
    const out: Array<{
      id: string;
      x: number;
      y: number;
      vx: number;
      vy: number;
      element: string;
      personality: string;
    }> = [];
    const cap = 400;
    let sent = 0;
    for (const mol of this.molecules.values()) {
      if (sent++ >= cap) break;
      const atoms = mol.atoms;
      if (atoms.length === 0) continue;
      let x = 0;
      let y = 0;
      let vx = 0;
      let vy = 0;
      const atomCount = atoms.length;
      for (const a of atoms) {
        x += a.x;
        y += a.y;
        vx += a.vx;
        vy += a.vy;
      }
      x /= atomCount;
      y /= atomCount;
      vx /= atomCount;
      vy /= atomCount;
      out.push({
        id: mol.id,
        x,
        y,
        vx,
        vy,
        element: atoms[0]?.element || "O",
        personality: mol.personality,
      });
    }
    return out;
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

  private clearWebSocketInstance(): void {
    if (!this.ws) {
      this.isWsConnected = false;
      return;
    }
    const s = this.ws;
    s.onopen = null;
    s.onmessage = null;
    s.onerror = null;
    s.onclose = null;
    try {
      s.close(1000, "cleared");
    } catch {
      /* ignore */
    }
    this.ws = null;
    this.isWsConnected = false;
  }

  /**
   * Initialize WebSocket connection for multiplayer synchronization
   */
  private initializeWebSocket(): void {
    this.clearWebSocketInstance();
    try {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        this.isWsConnected = true;
        this.wsReconnectAttempts = 0;
        this.lastServerPeerCount = -1;
        this.lastWarmEdgePeerCount = -1;
        this.networkRoster = [];
        this.localRunbookFromServer = null;
        this.wsLastHeartbeat = performance.now();
        this.wsLastNetworkUpdate =
          performance.now() - this.wsNetworkUpdateInterval;
        this.dbg("WebSocket connected:", this.wsUrl);
        this.clearReconnectTimer();
        this.sendMoleculeStates();
      };

      this.ws.onmessage = (event) => {
        this.handleWebSocketMessage(event.data);
      };

      this.ws.onclose = () => {
        this.isWsConnected = false;
        this.localRunbookFromServer = null;
        this.clearWebSocketInstance();
        if (this.allowReconnect) {
          this.dbg("WebSocket disconnected, attempting to reconnect…");
          this.scheduleReconnect();
        } else {
          this.dbg("WebSocket closed (no reconnect).");
        }
      };

      this.ws.onerror = (error) => {
        this.dbgw("WebSocket error:", error);
        this.isWsConnected = false;
      };
    } catch (error) {
      this.dbgw("Failed to create WebSocket:", error);
      this.isWsConnected = false;
      if (this.allowReconnect) {
        this.scheduleReconnect();
      }
    }
  }

  /**
   * Schedule a reconnection attempt with exponential backoff
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer != null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private scheduleReconnect(): void {
    this.clearReconnectTimer();
    if (!this.allowReconnect) {
      return;
    }
    // Calculate delay with exponential backoff and jitter
    const baseDelay = Math.min(
      this.wsReconnectInterval * Math.pow(2, this.wsReconnectAttempts),
      this.wsMaxReconnectInterval
    );
    const jitter = Math.random() * 0.1 * baseDelay; // ±10% jitter
    const delay = baseDelay + jitter;

    this.wsReconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.isWsConnected || !this.wsUrl || !this.allowReconnect) {
        return;
      }
      this.dbg(
        `Reconnecting to WebSocket (attempt ${this.wsReconnectAttempts})…`
      );
      this.initializeWebSocket();
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
        case "connectionInit":
          this.handleConnectionInit(message.data);
          break;
        case "heartbeat":
          this.applyServerHeartbeat(message);
          break;
        default:
          this.dbgw("Unknown WebSocket message type:", message.type);
      }
    } catch (error) {
      this.dbgw('Failed to parse WebSocket message:', error, data);
    }
  }

  /**
   * Handle molecule state updates from other players
   */
  private static parseRosterArray(r: unknown): NetworkRosterEntry[] {
    if (!Array.isArray(r)) {
      return [];
    }
    return r
      .map((e: unknown) => {
        if (!e || typeof e !== "object") return null;
        const o = e as { id?: unknown; displayName?: unknown };
        const id = typeof o.id === "string" ? o.id.slice(0, 64) : "";
        const displayName =
          typeof o.displayName === "string"
            ? o.displayName.slice(0, 32)
            : "";
        if (!id) return null;
        return { id, displayName: displayName || "player" };
      })
      .filter((x): x is NetworkRosterEntry => x != null);
  }

  private applyServerHeartbeat(message: {
    clientCount?: number;
    peerCount?: number;
    roster?: unknown;
  }): void {
    let peerNorm = -1;
    const pRaw = message?.peerCount;
    if (typeof pRaw === "number" && Number.isFinite(pRaw) && pRaw >= 0) {
      peerNorm = pRaw;
      this.lastServerPeerCount = pRaw;
    } else {
      const c = message?.clientCount;
      if (typeof c === "number" && Number.isFinite(c) && c >= 0) {
        peerNorm = Math.max(0, c - 1);
        this.lastServerPeerCount = peerNorm;
      }
    }
    if (message?.roster !== undefined) {
      this.networkRoster = SoupEngine.parseRosterArray(message.roster);
    }

    if (
      peerNorm >= 0 &&
      this.lastWarmEdgePeerCount >= 0 &&
      peerNorm > this.lastWarmEdgePeerCount &&
      this.networkClientId
    ) {
      this.emitNetworkWarmEdge();
    }
    if (peerNorm >= 0) {
      this.lastWarmEdgePeerCount = peerNorm;
    }
  }

  private static clampNetworkNumber(v: unknown, fallback: number): number {
    const n = typeof v === "number" ? v : parseFloat(String(v));
    if (!Number.isFinite(n)) return fallback;
    return n;
  }

  private handleMoleculeStateUpdate(data: any): void {
    if (data == null) return;
    if (!Array.isArray(data) && data.molecules === undefined && !data.fullSnapshot) {
      return;
    }

    if (typeof data === "object" && !Array.isArray(data) && data.fullSnapshot) {
      this.ghostMolecules.clear();
    }

    const molecules: any[] = Array.isArray(data) ? data : data.molecules ?? [];
    const { width: wmax, height: hmax } = this.physics.getWorldSize();

    let sawOtherClientMolecule = false;

    molecules.forEach((moleculeData: any) => {
      const { id, personality, element } = moleculeData;
      if (id == null || String(id).length > 200) {
        return;
      }
      const sid = String(id);
      const x = SoupEngine.clampNetworkNumber(moleculeData.x, 0);
      const y = SoupEngine.clampNetworkNumber(moleculeData.y, 0);
      const cx = Math.max(0, Math.min(wmax, x));
      const cy = Math.max(0, Math.min(hmax, y));

      // Get or create ghost molecule entry
      let ghost = this.ghostMolecules.get(sid);
      if (!ghost) {
        ghost = {
          networkX: cx,
          networkY: cy,
          lastNetworkX: cx,
          lastNetworkY: cy,
          interpolatedX: cx,
          interpolatedY: cy,
          interpolationProgress: 0,
          isInterpolating: false,
          lastUpdate: performance.now(),
          element: element || "O",
          personality: personality || "mediator"
        };
        this.ghostMolecules.set(sid, ghost);
      } else {
        // Store last known position for interpolation
        ghost.lastNetworkX = ghost.interpolatedX;
        ghost.lastNetworkY = ghost.interpolatedY;

        // Update network target
        ghost.networkX = cx;
        ghost.networkY = cy;
        ghost.lastUpdate = performance.now();
        ghost.element = element || ghost.element;
        ghost.personality = personality || ghost.personality;

        // Start interpolation
        ghost.interpolationProgress = 0;
        ghost.isInterpolating = true;
      }

      if (
        this.isFamilyNetworkMode() &&
        this.networkClientId &&
        sid.includes("/")
      ) {
        const owner = sid.slice(0, sid.indexOf("/"));
        if (owner && owner !== this.networkClientId) {
          sawOtherClientMolecule = true;
        }
      }
    });

    if (sawOtherClientMolecule) {
      this.emitNetworkWarmEdge();
    }
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

    if (
      typeof senderId === "string" &&
      senderId &&
      senderId !== this.networkClientId
    ) {
      this.emitNetworkWarmEdge();
    }
  }

  /**
   * Handle event log entries from other players
   */
  private handleEventLog(data: any): void {
    const pushOne = (event: {
      id?: string;
      type?: string;
      actorId?: string;
      targetId?: string | null;
      message?: string;
      timestamp?: number;
    }) => {
      const actorId =
        typeof event.actorId === "string" ? event.actorId : "";
      if (
        actorId &&
        this.networkClientId &&
        actorId !== this.networkClientId
      ) {
        this.emitNetworkWarmEdge();
      }
      this.eventLog.push({
        id: event.id || `event_${Date.now()}`,
        type: event.type || "event",
        actorId,
        targetId: event.targetId ?? null,
        message: event.message || "",
        timestamp: event.timestamp || Date.now(),
      });
    };

    if (Array.isArray(data)) {
      data.forEach((event) => pushOne(event));
    } else {
      pushOne(data);
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
    this.dbg("Received connection init from server:", data);

    if (data && typeof data.clientId === "string") {
      this.networkClientId = data.clientId;
    }

    this.ghostMolecules.clear();

    if (data.molecules && data.molecules.length > 0) {
      this.handleMoleculeStateUpdate({
        fullSnapshot: true,
        molecules: data.molecules,
      });
    }

    if (data.eventLog) {
      this.handleEventLog(data.eventLog);
    }

    if (data && data.roster !== undefined) {
      this.networkRoster = SoupEngine.parseRosterArray(data.roster);
    }

    this.localRunbookFromServer = SoupEngine.parseLocalRunbook(data?.localRunbook);

    this.dbg(`Initialized with ${this.ghostMolecules.size} ghost molecules`);

    if (this.networkRoster.length > 0) {
      this.emitNetworkWarmEdge();
    }
  }

  private static parseLocalRunbook(raw: unknown): LocalRunbookFromServer | null {
    if (!raw || typeof raw !== "object") {
      return null;
    }
    const o = raw as { echo?: unknown; port?: unknown; lines?: unknown };
    const lines = Array.isArray(o.lines)
      ? o.lines
          .filter((x): x is string => typeof x === "string")
          .map((s) => s.slice(0, 600))
      : [];
    if (lines.length === 0) {
      return null;
    }
    return {
      echo:
        typeof o.echo === "string"
          ? o.echo.slice(0, 64)
          : "as-above-so-below",
      port:
        typeof o.port === "number" && Number.isFinite(o.port) ? o.port : 0,
      lines,
    };
  }

  /**
   * Send current molecule states to other players
   * This would be called at 2Hz interval
   */
  private sendMoleculeStates(): void {
    if (
      !this.isWsConnected ||
      !this.ws ||
      this.ws.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    const now = performance.now();
    if (now - this.wsLastNetworkUpdate < this.wsNetworkUpdateInterval) {
      return;
    }

    this.wsLastNetworkUpdate = now;
    this.sendNetworkFrame(now);
  }

  private sendNetworkFrame(now: number): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    if (this.isFamilyNetworkMode()) {
      const payload = {
        type: "playerState" as const,
        molecules: this.serializeMoleculesForNetwork(),
        timestamp: now,
      };
      try {
        this.ws.send(JSON.stringify(payload));
      } catch (error) {
        this.dbgw("Failed to send playerState:", error);
        this.isWsConnected = false;
        this.clearWebSocketInstance();
        this.scheduleReconnect();
      }
      return;
    }

    const heartbeat = {
      type: "heartbeat" as const,
      timestamp: now,
    };
    try {
      this.ws.send(JSON.stringify(heartbeat));
    } catch (error) {
      this.dbgw("Failed to send WebSocket message:", error);
      this.isWsConnected = false;
      this.clearWebSocketInstance();
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
   * Create a new molecule in the sim
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

    // Check for reactions — supply Arrhenius/Le Chatelier context so reaction
    // rates respond to the local zone temperature and the Fuel-flood feedback
    // loop (`docs/affective-chemistry-spec.md` §5–6).
    const allBonds = this.physics.getBonds();
    const fuelFraction = this.computeFuelFraction();
    const reactionCandidates = this.reactions.findPotentialReactions(
      allAtoms,
      allBonds,
      {
        temperatureAt: (x, y) => this.zoneTemperatureAt(x, y),
        fuelFraction,
      }
    );

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

    // Advance the global 4-4-6 breath clock and emit to UI + audio
    this.tickBreath(deltaTime);
    this.tickCoherence();

    // Send our own molecule state at 2Hz (if connected)
    this.sendMoleculeStatesIfDue(currentTime);

    this.lastUpdate = currentTime;
  }

  /**
   * Advance the breath clock and (throttled) emit:
   *  - `--soup-breath` 0..1 amplitude on `<html>`
   *  - `data-soup-breath` phase attribute on `<html>`
   *  - master-gain modulation on the soundtrack engine (audio-rate ramp)
   * Pure: no DOM/audio writes when running off-DOM (tests, headless).
   */
  private tickBreath(deltaTimeMs: number): void {
    if (!Number.isFinite(deltaTimeMs) || deltaTimeMs <= 0) {
      return;
    }
    this.breathClockMs =
      (this.breathClockMs + deltaTimeMs) % SoupEngine.BREATH_CYCLE_MS;
    const state = this.computeBreathState(this.breathClockMs);

    // Audio: tiny gain swing tied to phase (always safe to call; engine no-ops if no AudioContext).
    try {
      this.audio.setBreathAmplitude(state.amplitude);
    } catch {
      /* audio is best-effort */
    }

    if (typeof document === "undefined") {
      return;
    }
    const now = performance.now();
    if (
      this.breathLastEmitMs >= 0 &&
      now - this.breathLastEmitMs < SoupEngine.BREATH_EMIT_MIN_MS &&
      state.phase === this.breathLastPhase
    ) {
      return;
    }
    this.breathLastEmitMs = now;
    try {
      const root = document.documentElement;
      root.style.setProperty("--soup-breath", state.amplitude.toFixed(4));
      if (state.phase !== this.breathLastPhase) {
        root.setAttribute("data-soup-breath", state.phase);
        this.breathLastPhase = state.phase;
      }
    } catch {
      /* ignore — host page integration must not break the engine */
    }
  }

  /**
   * Coherence tick — surface a 3-state `data-soup-coherent` attribute and
   * `--soup-psi` CSS variable on `<html>`. Cheap (~ once / second), null-safe
   * when not running in a browser. Anti-extractive: never escalates beyond
   * "coherent"; never adds badges, streaks, or notifications.
   */
  private tickCoherence(): void {
    if (typeof document === "undefined") return;
    const now = performance.now();
    if (
      this.coherenceLastEmitMs >= 0 &&
      now - this.coherenceLastEmitMs < SoupEngine.COHERENCE_EMIT_MIN_MS
    ) {
      return;
    }
    this.coherenceLastEmitMs = now;

    const psi = this.getPosnerStabilityIndex();
    let state = "";
    if (
      psi.psi >= SoupEngine.COHERENCE_PSI_FULL &&
      psi.savedPosners >= 2
    ) {
      state = "coherent";
    } else if (
      psi.psi >= SoupEngine.COHERENCE_PSI_WARM &&
      psi.savedPosners >= 1
    ) {
      state = "warming";
    }

    try {
      const root = document.documentElement;
      root.style.setProperty("--soup-psi", psi.psi.toFixed(4));
      if (state !== this.coherenceLastState) {
        if (state) {
          root.setAttribute("data-soup-coherent", state);
        } else {
          root.removeAttribute("data-soup-coherent");
        }
        this.coherenceLastState = state;
      }
    } catch {
      /* host page integration must not break the engine */
    }
  }

  /**
   * Compute the breath envelope at a given clock position (ms within `BREATH_CYCLE_MS`).
   * Inhale + exhale use a smoothstep curve so the perceived rhythm feels diaphragmatic,
   * not triangular. Hold sustains at 1.0.
   */
  private computeBreathState(
    clockMs: number
  ): { phase: "inhale" | "hold" | "exhale"; amplitude: number; cycleMs: number } {
    const t = ((clockMs % SoupEngine.BREATH_CYCLE_MS) + SoupEngine.BREATH_CYCLE_MS) %
      SoupEngine.BREATH_CYCLE_MS;
    if (t < SoupEngine.BREATH_INHALE_MS) {
      const u = t / SoupEngine.BREATH_INHALE_MS;
      return {
        phase: "inhale",
        amplitude: SoupEngine.smoothstep01(u),
        cycleMs: SoupEngine.BREATH_CYCLE_MS,
      };
    }
    if (t < SoupEngine.BREATH_INHALE_MS + SoupEngine.BREATH_HOLD_MS) {
      return {
        phase: "hold",
        amplitude: 1,
        cycleMs: SoupEngine.BREATH_CYCLE_MS,
      };
    }
    const exhaleStart =
      SoupEngine.BREATH_INHALE_MS + SoupEngine.BREATH_HOLD_MS;
    const u = (t - exhaleStart) / SoupEngine.BREATH_EXHALE_MS;
    return {
      phase: "exhale",
      amplitude: 1 - SoupEngine.smoothstep01(u),
      cycleMs: SoupEngine.BREATH_CYCLE_MS,
    };
  }

  private static smoothstep01(u: number): number {
    const x = Math.max(0, Math.min(1, u));
    return x * x * (3 - 2 * x);
  }

  /**
   * Public read of the current breath state (UI / tests / starfield can subscribe).
   */
  public getBreathState(): {
    phase: "inhale" | "hold" | "exhale";
    amplitude: number;
    cycleMs: number;
    clockMs: number;
  } {
    const s = this.computeBreathState(this.breathClockMs);
    return { ...s, clockMs: this.breathClockMs };
  }

  /**
   * Read saved-molecule metadata for a live molecule, or `null` when the
   * molecule has never been saved (or persistence is unavailable). Pure read.
   *
   * Surfaces `name`, `emotionalContext`, `zone`, `generation`, `significance`
   * and a derived `isPosner` flag. Powers the "Saved" row in Exhibit A so the
   * room can say "I remember this one" rather than treating every interaction
   * as fresh extraction.
   */
  public getSavedMoleculeMeta(moleculeId: string): {
    name: string;
    emotionalContext: string;
    zone: string;
    generation: number;
    creationTime: number;
    significance: number;
    isPosner: boolean;
  } | null {
    if (!moleculeId || typeof moleculeId !== "string") return null;
    const saved = this.persistence.loadMolecule(moleculeId);
    if (!saved) return null;
    const archive = this.persistence.getGlobalArchive();
    const isPosner = archive.posnerMolecules.some((m) => m.id === saved.id);
    return {
      name: saved.name,
      emotionalContext: saved.emotionalContext,
      zone: saved.zone,
      generation: saved.generation || 0,
      creationTime: saved.creationTime,
      significance: saved.significance,
      isPosner,
    };
  }

  /**
   * Read the heritage chain of a molecule — its lineage of parents through
   * reactions. Returns an empty array when no heritage is recorded (free atom,
   * unsynthesized, or never saved). Bounded by `maxHops` so the room cannot
   * unbound-scroll a family tree (anti-extractive).
   *
   * Powers the "Lineage" section in Exhibit A: shows literal **connect** —
   * how this molecule came to exist via prior molecules + reaction types.
   */
  public getMoleculeHeritage(
    moleculeId: string,
    maxHops: number = 8
  ): Array<{
    parentId: string;
    parentName: string | null;
    reactionType: string;
    timestamp: number;
    emotionalContext: string;
  }> {
    if (!moleculeId || typeof moleculeId !== "string") return [];
    const archive = this.persistence.getGlobalArchive();
    const chain = archive.heritageChains.get(moleculeId);
    if (!chain || chain.length === 0) return [];
    const cap = Math.max(1, Math.min(64, maxHops));
    return chain.slice(-cap).map((rec) => {
      const parent = this.persistence.loadMolecule(rec.parentId);
      return {
        parentId: rec.parentId,
        parentName: parent ? parent.name : null,
        reactionType: rec.reactionType,
        timestamp: rec.timestamp,
        emotionalContext: rec.emotionalContext,
      };
    });
  }

  /**
   * Save the current geometry of a live molecule (operator action). Returns
   * the saved id, or `null` if the molecule no longer exists. Composition,
   * personality, and zone are read from the engine; emotional context is
   * caller-supplied and defaults to a neutral phrase.
   *
   * Side effect: the persistence layer may file this under
   * `globalArchive.posnerMolecules` (if the geometry meets the AX₄ / 39-atom
   * Posner test) or `communityHighlights` (if `significance > 0.8`).
   */
  public saveLiveMolecule(
    moleculeId: string,
    opts: { emotionalContext?: string; significance?: number } = {}
  ): string | null {
    const mol = this.molecules.get(moleculeId);
    if (!mol) return null;
    const cx = mol.atoms.reduce((s, a) => s + a.x, 0) / mol.atoms.length;
    const cy = mol.atoms.reduce((s, a) => s + a.y, 0) / mol.atoms.length;
    const zone = this.getCurrentZone(cx, cy);
    const bonds = this.physics.getBonds().filter((b) => {
      const ids = new Set(mol.atoms.map((a) => a.id));
      return ids.has(b.atom1.id) && ids.has(b.atom2.id);
    });
    return this.persistence.saveMolecule({
      id: mol.id,
      atoms: mol.atoms,
      bonds,
      personality: mol.personality,
      zone: zone ? zone.name : "open",
      emotionalContext:
        opts.emotionalContext ||
        "Operator marked this geometry — I want to come back to it.",
      significance:
        typeof opts.significance === "number"
          ? Math.max(0, Math.min(1, opts.significance))
          : mol.atoms.length === 4
          ? 0.7
          : 0.5,
    });
  }

  /**
   * Cognitive Escrow residue (`docs/CONCEPT-COGNITIVE-ESCROW.md`).
   *
   * On return, the room offers back the geometry the user left behind — a single
   * calm line, no dashboard. Read-only over `PersistenceLayer.getGlobalArchive()`.
   *
   * Returns `null` when there is no archived residue (first visit or cleared
   * archive). Otherwise:
   *   - `posners`: count of saved Posner-eligible structures
   *   - `highlights`: count of saved highlights (capped at 20 in archive)
   *   - `totalSyntheses`: lifetime synthesis counter
   *   - `lastUpdate`: ms timestamp of last archive write
   *   - `ageMs`: how long since last update (for "X days ago")
   *   - `heritageDepth`: deepest parent→child chain in heritage map
   *
   * Anti-extractive: this is **memory return**, not engagement bait. The HTML
   * surface that consumes it MUST: (a) be one bounded line, (b) have a single
   * dismiss control, (c) not auto-refresh, (d) not link to a streak.
   */
  public getEscrowResidue(nowMs: number = Date.now()): {
    posners: number;
    highlights: number;
    totalSyntheses: number;
    lastUpdate: number;
    ageMs: number;
    heritageDepth: number;
  } | null {
    const archive = this.persistence.getGlobalArchive();
    const posners = archive.posnerMolecules.length;
    const highlights = archive.communityHighlights.length;
    const totalSyntheses = archive.totalSyntheses || 0;
    if (
      posners === 0 &&
      highlights === 0 &&
      totalSyntheses === 0 &&
      archive.heritageChains.size === 0
    ) {
      return null;
    }
    let heritageDepth = 0;
    for (const chain of archive.heritageChains.values()) {
      if (chain.length > heritageDepth) heritageDepth = chain.length;
    }
    return {
      posners,
      highlights,
      totalSyntheses,
      lastUpdate: archive.lastUpdate,
      ageMs: Math.max(0, nowMs - archive.lastUpdate),
      heritageDepth,
    };
  }

  /**
   * Zone temperatures (dimensionless; baseline = 1.0 → matches legacy
   * reaction probability). Calmer zones increase the effective activation
   * barrier; the Lab is warmer; the Deep is coolest. Numbers from
   * `docs/soup-world-design.md` §3 (Calm Zone +20% Eₐ, Deep 0.6× speed).
   */
  private static readonly ZONE_TEMPERATURES: Record<string, number> = {
    calm: 0.7,
    deep: 0.6,
    lab: 1.2,
    kitchen: 1.0,
  };
  private static readonly ROOM_BASELINE_T = 1.0;

  private zoneTemperatureAt(x: number, y: number): number {
    const zone = this.getCurrentZone(x, y);
    if (!zone) return SoupEngine.ROOM_BASELINE_T;
    const t = SoupEngine.ZONE_TEMPERATURES[zone.name];
    return typeof t === "number" ? t : SoupEngine.ROOM_BASELINE_T;
  }

  /**
   * Public read of the local zone temperature at a world-space coordinate.
   * Used by the dev panel; agents and tests can read directly.
   */
  public getZoneTemperatureAt(x: number, y: number): number {
    return this.zoneTemperatureAt(x, y);
  }

  /**
   * Fraction of live molecules carrying the Fuel archetype — drives the
   * Le Chatelier compensatory bias. Cheap O(n) over the molecule map.
   */
  private computeFuelFraction(): number {
    const total = this.molecules.size;
    if (total === 0) return 0;
    let fuel = 0;
    for (const m of this.molecules.values()) {
      if (m.personality === "fuel") fuel++;
    }
    return fuel / total;
  }

  /**
   * Public read of the Le Chatelier driver — Fuel-archetype fraction (0..1).
   */
  public getFuelFraction(): number {
    return this.computeFuelFraction();
  }

  /**
   * Molecule fade lifecycle (`docs/soup-world-design.md` §6.4).
   *
   * Behaviour:
   *  - **Fresh** for `FADE_HALF_LIFE_MS` (30 days) → alpha 1.0
   *  - **Fading** over `FADE_DURATION_MS` (7 days) → alpha 1.0 → 0.3 linearly
   *  - **Ghost** thereafter → alpha pinned at 0.3 (stays visible as memory)
   *
   * No deletion: faded molecules are emotional archaeology, tappable for the
   * Exhibit-A card. The decay curve is intentional and bounded — anti-extractive
   * (`docs/ETHICAL-STYLE-MAP.md` §6: rewards decay or dismiss; never variable-ratio).
   */
  public static readonly FADE_HALF_LIFE_MS = 30 * 24 * 60 * 60 * 1000;
  public static readonly FADE_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
  public static readonly FADE_GHOST_ALPHA = 0.3;

  public static computeMoleculeFadeAlpha(
    creationTime: number,
    nowMs: number = Date.now()
  ): number {
    if (!Number.isFinite(creationTime)) return 1;
    const age = Math.max(0, nowMs - creationTime);
    if (age <= SoupEngine.FADE_HALF_LIFE_MS) return 1;
    const fadeAge = age - SoupEngine.FADE_HALF_LIFE_MS;
    if (fadeAge >= SoupEngine.FADE_DURATION_MS) {
      return SoupEngine.FADE_GHOST_ALPHA;
    }
    const u = fadeAge / SoupEngine.FADE_DURATION_MS;
    return 1 - u * (1 - SoupEngine.FADE_GHOST_ALPHA);
  }

  /**
   * Convenience: alpha for a specific live molecule by id, or 1 if unknown.
   */
  public getMoleculeFadeAlpha(moleculeId: string, nowMs?: number): number {
    const mol = this.molecules.get(moleculeId);
    if (!mol) return 1;
    return SoupEngine.computeMoleculeFadeAlpha(mol.creationTime, nowMs);
  }

  /**
   * Hit-test the molecule under a world-space coordinate. Returns the molecule
   * whose nearest atom is within `paddingPx` (atom radius + padding), or null.
   * Used by `soup.html` canvas click → Exhibit A card.
   */
  public getMoleculeAt(
    worldX: number,
    worldY: number,
    paddingPx: number = 6
  ): Molecule | null {
    if (!Number.isFinite(worldX) || !Number.isFinite(worldY)) return null;
    let bestMol: Molecule | null = null;
    let bestDist = Infinity;
    for (const mol of this.molecules.values()) {
      for (const atom of mol.atoms) {
        const dx = atom.x - worldX;
        const dy = atom.y - worldY;
        const d = Math.sqrt(dx * dx + dy * dy);
        const reach = atom.radius + paddingPx;
        if (d <= reach && d < bestDist) {
          bestDist = d;
          bestMol = mol;
        }
      }
    }
    return bestMol;
  }

  /**
   * Operator probe: backdate every live molecule's `creationTime` by N days so
   * the fade lifecycle is testable without waiting calendar days. No-op when
   * `daysBack <= 0`. Logs nothing (engine purity).
   */
  public applyFadeProbe(daysBack: number): number {
    if (!Number.isFinite(daysBack) || daysBack <= 0) return 0;
    const offset = daysBack * 24 * 60 * 60 * 1000;
    let touched = 0;
    for (const mol of this.molecules.values()) {
      mol.creationTime -= offset;
      touched++;
    }
    return touched;
  }

  /**
   * Find event-log entries that reference a given molecule (by atom id or
   * molecule id). Powers Exhibit A — the inline card surfaced when a faded
   * molecule is tapped (`docs/soup-world-design.md` §4 spatial chat).
   */
  public findEventsForMolecule(moleculeId: string): Array<{
    id: string;
    type: string;
    actorId: string;
    targetId: string | null;
    message: string;
    timestamp: number;
  }> {
    const mol = this.molecules.get(moleculeId);
    if (!mol) return [];
    const atomIds = new Set(mol.atoms.map((a) => a.id));
    return this.eventLog.filter(
      (e) =>
        e.targetId === moleculeId ||
        (e.targetId != null && atomIds.has(e.targetId))
    );
  }

  /**
   * Posner Stability Index (PSI) — the **only** room-level stat the soup needs.
   * Replaces engagement metrics with a defensible structural read of the bowl.
   *
   * Definition (`docs/affective-chemistry-spec.md` §7, `docs/soup-world-design.md`):
   *   PSI = clamp01(`tetraWeight` × tetrahedralFraction + `posnerWeight` × min(1, savedPosners))
   *   where:
   *     - tetrahedralFraction = (live molecules with exactly 4 atoms — the AX₄
   *       VSEPR archetype, lowest potential energy in the system) / (live molecule count)
   *     - savedPosners = persisted Ca₉(PO₄)₆-eligible structures
   *       (`PersistenceLayer.isPosnerMolecule` in `persistence.ts`)
   *     - tetraWeight = 0.6, posnerWeight = 0.4
   *
   * The two terms are deliberate: PSI rewards both **the room's current geometry**
   * and **the room's history of integration**. Returns 0..1 plus raw inputs so the
   * UI can show the reasoning, not just the score (Cognitive Escrow §1: holding
   * geometrically, not narratively).
   */
  public getPosnerStabilityIndex(): {
    psi: number;
    tetrahedralFraction: number;
    tetrahedralCount: number;
    moleculeCount: number;
    savedPosners: number;
  } {
    const moleculeCount = this.molecules.size;
    let tetrahedralCount = 0;
    for (const mol of this.molecules.values()) {
      if (mol.atoms.length === 4) {
        tetrahedralCount++;
      }
    }
    const tetrahedralFraction =
      moleculeCount > 0 ? tetrahedralCount / moleculeCount : 0;
    const archive = this.persistence.getGlobalArchive();
    const savedPosners = archive.posnerMolecules.length;
    const tetraWeight = 0.6;
    const posnerWeight = 0.4;
    const psi = Math.max(
      0,
      Math.min(
        1,
        tetraWeight * tetrahedralFraction +
          posnerWeight * Math.min(1, savedPosners)
      )
    );
    return {
      psi,
      tetrahedralFraction,
      tetrahedralCount,
      moleculeCount,
      savedPosners,
    };
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
      if (currentTime - this.wsLastNetworkUpdate < this.wsNetworkUpdateInterval) {
        return;
      }

      this.wsLastNetworkUpdate = currentTime;

      if (this.isWsConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.sendNetworkFrame(currentTime);
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
   * Read-only pass-through to the persistence global archive (Posners,
   * highlights, heritage, last-update). Used by the memory panel to tag
   * canonical structures without re-deriving thresholds.
   */
  getGlobalArchive() {
    return this.persistence.getGlobalArchive();
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
      X: '#95a5a6',
      Li: '#c8c8ff',
      V: '#c9a227',
      LOV: '#6ee7b7'
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
      Cl: { r: 6, m: 35, c: -1 },
      Li: { r: 5, m: 7, c: 1 },
      V: { r: 6, m: 51, c: 0 },
      LOV: { r: 7, m: 58, c: 1 }
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

      // Self-echo into incomingPings so the *sender* also sees the bubble fly
      // (the mock server only forwards to other clients in the room, by design,
      // so without this echo the operator would see nothing happen on click).
      // Honest UX: action → visible response. Bounded by the same 10s lifetime.
      const selfEchoPing = {
        id: `ping_local_${Date.now()}_${Math.random()}`,
        targetId,
        emoji,
        position: { x: centerX, y: centerY },
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      };
      this.incomingPings.push(selfEchoPing);
      this.eventLog.push({
        id: `event_${Date.now()}`,
        type: "ping",
        actorId: "you",
        targetId,
        message: `you pinged ${targetId} with ${emoji}`,
        timestamp: Date.now(),
      });
      if (this.eventLog.length > 50) {
        this.eventLog = this.eventLog.slice(-50);
      }
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
  getConnectionStatus(): {
    connected: boolean;
    url: string;
    reconnectAttempts: number;
    familyMode: boolean;
    room: string;
    displayName: string;
    clientId: string;
    roomPeers: number;
    roster: NetworkRosterEntry[];
    localRunbook: LocalRunbookFromServer | null;
  } {
    const play = this.networkPlay;
    return {
      connected: this.isWsConnected,
      url: this.wsUrl,
      reconnectAttempts: this.wsReconnectAttempts,
      familyMode: this.isFamilyNetworkMode(),
      room: play?.room ?? "",
      displayName: play?.displayName ?? "",
      clientId: this.networkClientId,
      roomPeers: this.lastServerPeerCount,
      roster: this.networkRoster.slice(),
      localRunbook: this.localRunbookFromServer,
    };
  }

  /**
   * Resume audio context (call after user interaction)
   */
  async resumeAudio() {
    await this.audio.resume();
  }

  /**
   * Easter egg: spawn Li + V near the lab zone so a Li+V → "LOV" synthesis can occur
   * (see reactions.ts). Trigger from soup.html with `?egglov=1`.
   */
  spawnEggLovSandbox(): { liMoleculeId: string; vMoleculeId: string } {
    const lab = this.zones.find((z) => z.name === 'lab');
    const { width: w, height: h } = this.physics.getWorldSize();
    const cx = lab ? lab.x : w * 0.5;
    const cy = lab ? lab.y : h * 0.25;
    const t = Date.now();
    const li: Atom = {
      id: `egg_li_${t}`,
      x: cx - 3,
      y: cy,
      vx: 0,
      vy: 0,
      element: 'Li',
      color: this.elementColor('Li'),
      radius: 5,
      mass: 7,
      charge: 1,
    };
    const v: Atom = {
      id: `egg_v_${t}`,
      x: cx + 10,
      y: cy,
      vx: 0,
      vy: 0,
      element: 'V',
      color: this.elementColor('V'),
      radius: 6,
      mass: 51,
      charge: 0,
    };
    const idLi = this.createMolecule([li], [], 'builder');
    const idV = this.createMolecule([v], [], 'builder');
    return { liMoleculeId: idLi, vMoleculeId: idV };
  }

  /**
   * Cleanup all resources
   */
  dispose() {
    this.allowReconnect = false;
    this.clearReconnectTimer();
    this.clearWebSocketInstance();

    this.audio.dispose();
    this.molecules.clear();
    this.ghostMolecules.clear();
    this.incomingPings = [];
    this.outgoingPings = [];
    this.eventLog = [];
    this.reactions.clearHistory();
    this.localRunbookFromServer = null;
  }
}