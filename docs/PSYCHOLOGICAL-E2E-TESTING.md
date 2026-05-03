# Psychological E2E User Testing System

Comprehensive end-to-end testing that simulates different personality types using the site, detecting neurodivergent "tick" issues.

## Overview

This system tests the P31 home workspace by simulating different personality types with varying cognitive styles, needs, and behaviors. It generates random navigation paths, grades the experience for each personality, and produces flow charts.

## Files Created

- **`scripts/personality-types.mjs`** - Defines 10 personality types with criteria
- **`scripts/rating-guide.mjs`** - Grading system and rating guide
- **`scripts/psychological-e2e.mjs`** - Main test runner
- **`scripts/neurodivergent-swarm-e2e.mjs`** - Neurodivergent-focused swarm test

## Personality Types

1. **Power User** - Developer/researcher, impatient, keyboard-heavy
2. **ADHD User** - Needs focus, minimal distractions, reduced motion
3. **Autistic User** - Predictability and consistency needed
4. **Elderly User** - Larger text, high contrast, simple navigation
5. **Child User** - Simple language, visual learning, parental controls
6. **Screen Reader User** - ARIA-dependent, linear navigation
7. **Impatient User** - Instant results, abandons slow experiences
8. **Methodical User** - Thorough, reads carefully, needs details
9. **Stressed User** - Under pressure, needs help, easily confused
10. **Curious Explorer** - Exploratory, clicks everything, discovers features

## Usage

### Quick Test (3 random personalities)
```bash
npm run test:psychological-e2e
```

### Custom Configuration
```bash
PSYCH_SESSIONS=10 PSYCH_SESSIONS=5 node scripts/psychological-e2e.mjs
```

Environment variables:
- `PSYCH_SESSIONS` - Number of personality sessions (default: 3)
- `PSYCH_SESSIONS` - Number of paths per personality (default: random 3-7)

### Neurodivergent Swarm Test
```bash
npm run test:neurodivergent-swarm:e2e
```

With custom settings:
```bash
SWARM_USERS=50 SWARM_PATHS=3 SWARM_DURATION=300000 node scripts/neurodivergent-swarm-e2e.mjs
```

## Test Criteria

Each personality type has specific criteria:

- **maxWaitTime** - Maximum acceptable page load time
- **maxAnimations** - Maximum simultaneous animations
- **reducedMotionRequired** - Whether reduced motion must be respected
- **ariaLabelsRequired** - Whether ARIA labels are required
- **keyboardNavRequired** - Whether keyboard navigation must work
- **minFontSize** - Minimum font size for readability

## Rating System

- **Excellent (90-100)** - Perfect match for user needs
- **Good (70-89)** - Mostly meets needs with minor issues
- **Fair (50-69)** - Notable issues for this personality
- **Poor (30-49)** - Significant problems
- **Failed (0-29)** - Unusable for this personality

## Output

### Console Report
```
=== FINAL REPORT ===
Total Sessions: 6
Total Steps: 36
Average Score: 98.3/100

By Grade:
  Excellent: 36 steps
  Good: 0 steps

By Personality:
  Autistic User (methodical): 100.0/100
  Methodical User (exploratory): 100.0/100
```

### Flow Charts
Generated in `test-results/flow-charts/`:
- JSON files with full session data
- HTML visualization files

Open the HTML files in a browser to see the navigation flow with grades for each step.

## Integration with CI

The test is integrated into the full test suite:

```bash
npm run p31:all  # Includes psychological e2e testing
```

## Detected Issues

The system checks for:
- Motion violations (reduced motion not respected)
- ARIA violations (missing accessible names)
- Cognitive overload (too many animations)
- Autoplay media (videos/audio auto-playing)
- Missing skip links
- Font size issues
- Focus indicator problems

## Extending

To add a new personality type, edit `scripts/personality-types.mjs`:

```javascript
NEW_TYPE: {
  name: "New Type",
  description: "Description",
  traits: ["trait1", "trait2"],
  criteria: { /* specific criteria */ },
  navigationPattern: "pattern-name",
  frustrationTriggers: ["trigger1"],
  successFactors: ["factor1"],
}
```

## License

Part of the P31 home workspace, licensed under the project license.
