# BONDING Mock WebSocket Server (SPIKE-04)

## Purpose
Test the WCD-32 multiplayer implementation with a simulated multiplayer environment. This server provides:
- 8 mock players with 2-4 molecules each (total ~20-32 molecules) in **`room=mock`** (or default)
- **Family / explicit `room=…`** (not `mock`): no NPCs, **`playerState`** from each browser, `moleculeStateUpdate` with `fullSnapshot` to peers
- A **roster** (who else is in the room) on every **`connectionInit`** and **`heartbeat`**
- 2Hz molecule position updates (mock) + 500ms family rebroadcasts
- Social event broadcasting (pings) and **per-room** event log tails
- **Port:** set **`MOCK_WS_PORT`** (default `8082`). Root repo: **`npm run test:mock-ws`** spawns a random port and runs an integration probe.
- **As above / so below:** every **`connectionInit`** includes **`localRunbook`** (echo `as-above-so-below`, live **port**, same **lines** as startup `console.log`) so docs, UI, and terminal stay aligned.

## Usage

### Start the Server
```bash
cd spikes/mock-ws-server
node server.js
```

### Connect from Demo
1. Open `soup.html` in your browser
2. The demo will automatically connect to `ws://localhost:8082`
3. Watch ghost molecules appear and move smoothly
4. Send pings to test social event broadcasting

## Server Features

### Mock Players
- **8 simulated players** with different personalities
- **16-32 total molecules** with realistic movement patterns
- **Personality-based colors** for visual distinction
- **Boundary wrapping** to keep molecules in viewport

### Network Simulation
- **2Hz updates** (500ms intervals) matching target specifications
- **Hermite interpolation** validation on client side
- **Realistic movement** with velocity damping and randomness
- **Connection stability** testing with heartbeat mechanism

### Social Events
- **Ping broadcasting** - client pings are echoed to all connected clients
- **Event logging** - maintains social interaction history
- **Particle effects** - pings trigger visual effects on receiving clients

## Performance Testing

### Metrics Tracked
- **Connection count** and stability
- **Message throughput** (molecules/second)
- **Event broadcasting** efficiency
- **Memory usage** with multiple clients

### Test Scenarios
1. **Single Client**: Basic interpolation and rendering
2. **Multiple Clients**: Social event broadcasting
3. **Network Stress**: High molecule counts and rapid pings
4. **Reconnection**: Automatic client reconnection handling

## Files
- `server.js` - Main WebSocket server implementation
- `README.md` - This documentation

## Integration with WCD-32
This server validates the complete WCD-32 implementation:
- WebSocket connection management
- Ghost molecule interpolation
- Social event handling
- Performance within <5KB/s bandwidth target

## Next Steps
After validating with this mock server, implement the real WebSocket server for production multiplayer functionality.