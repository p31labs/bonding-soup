# WCD-32: WebSocket Synchronization & Network State Specification

## 1. Core Architecture and Networking Overview

This specification defines the multiplayer networking layer for C.A.R.S. (“The Soup” sim in code). Building upon the validated local simulation engine (WCD-31), this layer enables real-time sharing of molecular states between players while maintaining strict mobile performance constraints.

The core architecture relies on a persistent WebSocket connection with a 2Hz update frequency for molecular state synchronization. This low-frequency update is made visually smooth through client-side Hermite spline interpolation (validated in SPIKE-03), which upsamples the 2Hz network stream to the local 60fps render loop.

This specification serves as the technical foundation for implementing cross-player molecule visibility, spatial emoji pings, and persistent social logs ("Exhibit A") while adhering to strict mobile bandwidth (<5KB/s) and CPU (<1ms/frame for 50 molecules) constraints.

## 2. WebSocket Connection Layer

### 2.1 Connection Management
* **Protocol:** Persistent full-duplex WebSocket connection with automatic heartbeat mechanism
* **Heartbeat:** Ping/pong frames exchanged every 5 seconds to detect connection liveness
* **Reconnection Logic:** Exponential backoff starting at 500ms, doubling on each failure up to 30-second maximum
* **Connection States:** CONNECTING, CONNECTED, RECONNECTING, DISCONNECTED (with appropriate UI feedback)

### 2.2 Update Frequency and Payload Structure
* **Update Rate:** Fixed 2Hz (500ms interval) for molecular state synchronization
* **Outgoing Payload:** Delta-compressed JSON containing only changed molecular states since last update
* **Molecular State Fields:**
  * `id`: Unique molecule identifier (string)
  * `x`: X-coordinate (float, 0-4000)
  * `y`: Y-coordinate (float, 0-4000)
  * `vx`: X-velocity (float, pixels/ms)
  * `vy`: Y-velocity (float, pixels/ms)
  * `personality`: Archetype enum (mediator, rock, loner, fuel, messenger, builder, oracle)
  * `element`: Chemical element string (H, O, C, Ca, etc.)
* **Payload Optimization:** Only transmit molecules that have moved >1px or changed state since last update

### 2.3 Connection Security and Reliability
* **WSS Protocol:** All connections use WebSocket Secure (WSS://) for encryption
* **Message Acknowledgement:** Critical state changes (molecule creation/deletion) require ACK
* **Sequence Numbering:** All messages include monotonically increasing sequence numbers for gap detection
* **Error Handling:** Graceful degradation to local-only mode when connection is unavailable

## 3. Ghost Molecule System (SPIKE-03 Implementation)

### 3.1 Interpolation Engine
* **Algorithm:** Hermite spline interpolation using smoothstep function (t*t*(3-2*t)) for smooth 2Hz → 60fps rendering
* **State Tracking:** Each ghost molecule maintains:
  * Last known network position (`lastNetworkX`, `lastNetworkY`)
  * Target network position (`targetNetworkX`, `targetNetworkY`)
  * Interpolation progress (`interpolationProgress`: 0.0 to 1.0)
  * Interpolation state flag (`isInterpolating`: boolean)
* **Update Logic:** 
  * On network update: Store current position as last known, set new target, reset progress to 0
  * Each render frame: Advance interpolation progress by (16.67ms / 500ms) = 0.0333
  * On progress ≥ 1.0: Snap to target position, set isInterpolating = false

### 3.2 Jitter Buffering
* **Buffer Depth:** Shallow 100ms-250ms buffer (2-5 network packets) to handle variance
* **Buffer Management:** 
  * Incoming packets timestamped and inserted into time-ordered buffer
  * Render loop consumes oldest buffered state for interpolation base
  * Prevents "teleportation" during temporary network delay spikes
* **Late Packet Handling:** Packets arriving >250ms late are discarded to maintain causality

### 3.3 Viewport Culling Optimization
* **Culling Radius:** 1.5x current viewport dimensions (1200x900px for 1600x900 canvas)
* **Dynamic Update:** Recalculate visible molecule set each frame based on player viewport
* **Performance Impact:** Reduces interpolation calculations by ~60% in typical gameplay scenarios
* **Edge Handling:** Molecules entering/exiting viewport fade in/out over 200ms to prevent popping

## 4. Spatial Emoji Ping System

### 4.1 Outgoing Ping Logic
* **Trigger:** Tap/click on any visible molecule (local or ghost)
* **Payload:** Minimal JSON `{type: "ping", targetId: string, emoji: string, timestamp: number}`
* **Rate Limiting:** Maximum 5 pings per 10 seconds per player to prevent spam
* **Emoji Set:** Curated set of 16 emotionally relevant emojis (❤️, 👍, 😊, 😢, 😠, 😮, 🙏, 🎉, etc.)

### 4.2 Incoming Ping Processing
* **Event Handling:** Convert network ping to local particle system trigger
* **Visual Effect:** Spawn orbiting emoji particle system around target molecule
* **Orbit Parameters:** 
  * Radius: 25-40px (based on molecule size)
  * Speed: 0.5-1.5 rad/s
  * Lifetime: 8-12 seconds with exponential opacity fade
* **Rendering:** Utilizes existing particle system with emoji sprite rendering

### 4.3 Persistence and Deduplication
* **Duplicate Suppression:** Ignore pings targeting same molecule within 3 seconds
* **Visual Queue:** Maximum 3 simultaneous pings per molecule to prevent clutter
* **Global Limit:** Server enforces maximum 50 simultaneous pings per connection

## 5. "Exhibit A" Social Logs

### 5.1 Event Feed Architecture
* **UI Component:** Collapsible sidebar showing chronological interaction history
* **Event Types:** 
  * Ping events: `"Alice pinged Bob's H₂O 💧"`
  * Synthesis events: `"Alice and Charlie created CH₄ together"` (when molecules synthesize)
  * Zone entry: `"Alice entered the Calm Zone"`
  * Achievement milestones: `"Alice created her 100th molecule"`
* **Display Format:** 
  * Timestamp (HH:MM)
  * Actor name (color-coded by personality)
  * Action verb
  * Target description (molecule name + formula)
  * Emoji visual
  * Fade-out after 30 seconds of inactivity

### 5.2 Event Reconstruction and Persistence
* **Server-Side Storage:** Maintain last 50 events per connection for 24 hours
* **Reconnection Sync:** On reconnect, fetch missed events since last known timestamp
* **Local Storage:** Cache last 20 events for offline viewing and faster startup
* **Event Deduplication:** Server-side unique ID prevents duplicate event delivery
* **Privacy Controls:** Players can disable event sharing in settings (defaults to on)

## 6. Performance Safeguards and Optimization

### 6.1 Bandwidth Management
* **Target Budget:** <5KB/s per connection (validated in SPIKE-03)
* **Compression Strategies:**
  * Delta compression: Only transmit changed states
  * Quantization: Reduce coordinate precision to 0.1px (sufficient for visual fidelity)
  * Personality/element lookup: Transmit IDs instead of strings
  * Silent periods: Reduce to 1Hz when no state changes detected
* **Adaptive Rate:** Drop to 1Hz during high packet loss (>5%) to maintain stability

### 6.2 CPU Overhead Optimization
* **Interpolation Cost:** Validated at <0.3ms/frame for 50 molecules (SPIKE-03)
* **Culling Benefits:** Viewport culling reduces active interpolation set by 40-60%
* **Object Pooling:** Reuse molecule state objects to minimize garbage collection
* **Fixed Timestep Alignment:** Network interpolation aligned to physics 30Hz tick where possible

### 6.2 Fallback Mechanisms
* **Packet Loss >10%:** Automatically reduce to 1Hz update rate
* **High Jitter (>100ms):** Increase buffer depth to 500ms temporarily
* **Severe Degradation:** Fallback to local-only mode with reconnection attempts
* **User Notification:** Subtle UI indicator showing connection quality (green/yellow/red)

## 7. Integration Points with Existing Systems

### 7.1 soupPhysics.ts Extension
* **Network State Interface:** 
  ```typescript
  interface NetworkState {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    personality: PersonalityType;
    element: string;
    timestamp: number;
  }
  ```
* **Ghost Molecule Tracking:** Separate storage for network states vs local physics state
* **Interpolation Application:** During physics update, apply interpolated position to ghost molecules before force calculations
* **Collision Handling:** Ghost molecules participate in spatial hashing but with reduced collision response

### 7.2 soup.ts Orchestration Enhancements
* **Connection Management:** WebSocket connection lifecycle handling
* **Event Translation:** 
  * Local molecule events → Network updates (creation, destruction, personality change)
  * Network updates → Local events (ghost molecule creation/update/destruction)
* **State Synchronization:** 
  * On connection: Request full state snapshot from server
  * On disconnection: Preserve last known states for quick resumption
  * On reconnect: Interpolate from last known to current state to prevent jumps

### 7.3 particles.ts Extension
* **New Method:** `triggerEmojiPing(targetId: string, emoji: string, position: {x: number, y: number})`
* **Orbit Parameters:** Configurable radius/speed/lifetime based on emoji type
* **Rendering Integration:** Emoji particles rendered alongside molecular effects in same canvas pass
* **Cleanup:** Automatic removal after lifetime expiration

### 7.4 UI Layer Additions
* **Connection Status Indicator:** Color-coded dot (green/yellow/red) with tooltip
* **Ping Button:** Tap-to-ping UI overlay near molecule (appears on hover/focus)
* **Exhibit A Sidebar:** Collapsible panel with scrollable event history
* **Settings Toggle:** Option to disable event sharing and pings for privacy

## 8. Success Criteria and Validation Metrics

### 8.1 Fluidity Criteria
* **Visual Smoothness:** Ghost molecules exhibit zero perceptible rubber-banding or jitter
* **Position Accuracy:** Final interpolated position within 2px of last network position
* **Latency Perception:** End-to-end delay feels responsive (<200ms perceived lag)

### 8.2 Performance Benchmarks
* **Frame Rate:** Maintain 60fps ±2fps with 50 ghost molecules on Snapdragon 675 target
* **Bandwidth Usage:** Sustain <4KB/s average during active gameplay
* **CPU Overhead:** <0.8ms/frame for ghost molecule interpolation system
* **Memory Usage:** <10MB additional for networking state and buffers

### 8.3 Reliability Measures
* **Reconnection Success:** >95% success rate within 5 seconds of network interruption
* **Event Persistence:** >99% of Exhibit A events survive reconnection
* **State Consistency:** <0.1% position desync between client and server after 10 minutes

## 9. Implementation Roadmap

### 9.1 Phase 1: Connection Foundation
* Implement WebSocket connection management with heartbeat/reconnect
* Test basic molecule state serialization and deserialization
* Validate delta compression and bandwidth usage

### 9.2 Phase 2: Ghost Molecule System
* Implement Hermite spline interpolation engine
* Add viewport culling and jitter buffering
* Validate smoothness and accuracy metrics

### 9.3 Phase 3: Social Systems
* Implement emoji ping system with particle effects
* Build Exhibit A event feed and storage system
* Test event reconstruction and persistence

### 9.4 Phase 4: Optimization and Polish
* Implement adaptive rate limiting and fallback mechanisms
* Add UI indicators and connection quality feedback
* Performance tuning for target hardware

## 10. Conclusion

The WCD-32 specification defines a robust, performant multiplayer layer that enables true social connection in The Soup while respecting mobile constraints. By building on the validated SPIKE-03 interpolation results and implementing careful performance safeguards, this system will allow players to share meaningful molecular interactions without compromising the core 60fps experience.

The specification provides a complete technical foundation for implementation, validation, and deployment of the multiplayer networking system.