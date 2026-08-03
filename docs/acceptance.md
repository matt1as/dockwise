# Acceptance Verification

**App:** Dockwise sailboat docking simulator  
**Verified:** 2026-08-03  
**Local URL:** http://127.0.0.1:4173

## Automated physics checks

Command: `npm test`

Result: **PASS — 16/16 tests**

Covered behavior:

- 32 ft fin-keel S-drive preset
- aft/middle/forward cleat geometry
- alongside, bow-to, and stern-to initial orientation
- safe end-on clearance from the quay
- mirrored port/starboard end-on attachment forces
- slack and taut line forces
- line overload detection
- spring-line yaw moment
- reverse thrust and port prop walk
- opposite rudder directions while moving
- rudder response to ahead prop wash from rest
- fixed-step rigid-body integration
- heading-aware dock contact
- scenario round-trip persistence
- invalid cleat rejection
- malformed numeric-state rejection

## Real browser checks

Command: `npm run test:browser`

Browser: installed Google Chrome, headless Chromium mode through Chrome DevTools Protocol.

Result: **PASS**

Verified:

- page and canvas render at desktop dimensions
- default aft-spring line appears
- four-line preset creates four model and UI lines
- astern command moves the boat backward
- port prop walk moves the boat toward local port in reverse
- ahead command advances the boat
- run/pause advances and stops simulation time
- scenario save/load restores four lines and its name
- analysis toggle updates its accessible state
- mobile viewport is 390 px wide with no horizontal document overflow
- controls stack below a usable 460 px-high canvas on mobile
- no runtime JavaScript exceptions

Observed reverse test result after simulated input: x = -1.252 m, y = -0.271 m, heading = 0.034 rad.

## Stress check

A 60-second simulation with four lines, full reverse, maximum tested port prop walk, hard port rudder, 12 m/s wind, and 2 m/s current remained finite and stable. Dock contact was reported.

## Visual inspection

Desktop and mobile screenshots were inspected for clipping, overlap, readability, dock/boat/cleat visibility, line rendering, telemetry, and responsive stacking. No blocking visual defects were found.

## Limits

This verifies implementation consistency, not hydrodynamic accuracy. The simulator remains a qualitative low-speed planning/training model. Real boat calibration is still required for thrust, prop walk strength, windage, damping, rudder effectiveness, and line properties.
