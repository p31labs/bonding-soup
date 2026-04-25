# Posner Molecule Stability Spike (SPIKE-01)

## Goal
Determine if a single 39-atom structure ($Ca_9(PO_4)_6$) can maintain geometric stability at a 30Hz physics tick without causing frame drops or collision detection cascades.

## Implementation
- **Physics Engine:** Fixed 30Hz timestep with spatial hashing collision detection
- **Molecule Structure:** Simplified calcium cage with orbiting phosphate groups
- **Collision System:** Spatial grid reduces complexity from O(n²) to O(n)
- **Ionic Bonding:** Spring-based bonds between phosphorus and oxygen atoms

## Test Metrics
- Frame rate stability (target: 60fps)
- Physics tick consistency (30Hz)
- Collision detection overhead
- Memory usage
- Visual stability of molecular structure

## Running the Spike
```bash
cd spikes/posner-stable
node server.js
```
Then open http://localhost:8080 in your browser.

## Expected Outcomes
- **Pass:** Molecule maintains stable structure with <5% frame drops
- **Fail:** Excessive collision cascades or >10% frame drops

## Files
- `index.html` - Main HTML page
- `script.js` - Physics simulation and rendering
- `server.js` - Simple HTTP server