# GeodesicRoom — TRIPER Pre-flight Checklist

**Wire protocol version is immutable. Shape cap is a hard constraint.**

## Structural (automated — `npm run test:triper:geodesic`)
- [ ] geodesicRoomWorkerUrl is HTTPS + trimtab-signal
- [ ] Wire schema: p31.geodesicRoomWire/0.2.1 (locked)
- [ ] All 4 message types: ADD_SHAPE, MOVE_SHAPE, REMOVE_SHAPE, RESET_SHAPES
- [ ] 50-shape cap defined
- [ ] Glass probes cover geodesic-room
- [ ] Geodesic spike or source present (no ghost URL)

## Execution (automated — `npm run triper:exec geodesic`)
- [ ] verify:geodesic-wire-fixtures passes
- [ ] verify:quantum-deck passes

## Manual (operator sign-off)
- [ ] GeodesicRoom demo server starts (`npm run demo:geodesic-preview`)
- [ ] WebSocket upgrades correctly (https → wss)
- [ ] ADD_SHAPE message adds shape to shared state
- [ ] MOVE_SHAPE updates pose including rotY
- [ ] 50-shape cap enforced (51st shape rejected)
- [ ] RESET_SHAPES clears room correctly
- [ ] Maxwell rigidity maintained after shape operations

## Regression Guards
- [ ] Wire schema version NOT bumped past 0.2.1 without updating all clients
- [ ] MOVE_SHAPE NOT renamed
- [ ] geodesicRoomWorkerUrl domain unchanged
- [ ] verify:geodesic-wire-fixtures not removed

## Sign-off
```
Operator: W.JOHNSON-001
Date: ___________
Wire version confirmed: p31.geodesicRoomWire/0.2.1
TRIPER cert: PASS / FAIL
Notes: ___________
```
