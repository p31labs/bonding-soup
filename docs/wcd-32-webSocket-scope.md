# WCD-32: WebSocket Synchronization & Network State Scope

## Goal
Implement a high-performance, asynchronous multiplayer layer that allows players to see each other's molecular "ghosts" in real-time while maintaining strict mobile battery and bandwidth constraints.

## 1. WebSocket Connection Layer
* **Protocol:** Persistent full-duplex connection with automatic heartbeat and exponential backoff reconnection logic.
* **Update Frequency:** 2Hz (one packet every 500ms) for molecular state updates.
* **Outgoing Payload:** Delta-compressed state containing `{id, x, y, vx, vy, personality, element}`.

## 2. Ghost Molecule System (The SPIKE-03 Integration)
* **Interpolation Engine:** Implementation of the **Hermite Spline** algorithm to upsample 2Hz incoming data to 60fps local rendering.
* **Jitter Buffering:** A shallow 100ms-250ms buffer to handle network variance and prevent the "teleportation" of molecules during packet late-arrival.
* **Viewport Culling:** The engine will only calculate interpolation for ghost molecules within a 1.5x radius of the player's current viewport to save CPU cycles.

## 3. Spatial Emoji Ping System
* **Outgoing:** Tap-to-ping logic that broadcasts an emoji particle to a specific target molecule ID.
* **Incoming:** Event listener that triggers the `particles.ts` system to spawn orbiting emoji around the targeted local ghost.
* **Persistence:** Pings have a 10-second visual lifetime before fading to transparency.

## 4. "Exhibit A" Social Logs
* **Event Feed:** A UI sidebar that logs cross-player interactions (e.g., *"Will pinged Bash’s Water 💚"*).
* **Event Reconstruction:** Logic to fetch historical interaction data upon reconnection so the social feed remains persistent.

## 5. Performance Safeguards
* **Bandwidth Cap:** Target usage of **<5KB/s** per connection.
* **CPU Overhead:** Target **<1ms/frame** for the interpolation of 50 ghost molecules (already validated as feasible by SPIKE-03).
* **Fallback Mode:** If the connection quality drops (high packet loss), the engine will automatically drop interpolation quality to Linear to preserve the frame rate.

## Integration Points
* **`soupPhysics.ts`:** Will be extended to accept "Network States" which override standard drift for ghost-tagged molecules.
* **`soup.ts`:** Will act as the primary listener for WebSocket events, spawning or destroying ghost molecules as players enter/leave the simulation area.
* **`soundtrack.ts`:** No changes (audio remains local).
* **`particles.ts`:** Will receive new `triggerEmojiPing` methods to handle the multiplayer visual layer.
* **UI Layer:** New components for connection status, ping buttons, Exhibit A feed.

## Success Criteria
1.  **Fluidity:** Ghost molecules move as smoothly as local molecules (zero visual jitter).
2.  **Accuracy:** Final interpolated positions must match the last received network position within a 2-pixel margin of error.
3.  **Efficiency:** No impact on the local 60fps target on the Snapdragon 675 hardware.