# Sailboat Docking Simulator Implementation Plan

> **For Hermes:** Implement task-by-task with strict test-first development and verify in a real browser.

**Goal:** Build a standalone responsive web app that simulates a 32 ft fin-keel S-drive sailboat leaving a dock using different boat cleats, dock cleats, and mooring lines.

**Architecture:** A dependency-free ES-module physics engine drives a Canvas-based top-down UI. Fixed-step rigid-body integration models thrust, port prop walk in reverse, rudder, damping, wind/current, mooring-line tension, yaw moments, and simplified dock contact. Browser state and scenarios use JSON/localStorage.

**Tech Stack:** HTML5 Canvas, CSS, vanilla JavaScript ES modules, Node.js built-in test runner, Python static server, Chromium browser verification.

---

### Task 1: Physics engine
- Create `tests/physics.test.js` first and confirm missing-module failure.
- Create `src/physics.js` with vector helpers, attachment transforms, line-force calculation, force/torque accumulation, fixed-step integration, and telemetry.
- Verify prop walk, line slack/tension, yaw direction, and rudder behavior.

### Task 2: Simulator UI
- Create `index.html`, `styles.css`, and `src/app.js`.
- Render the 32 ft boat, dock, six dock cleats, and aft/middle/forward boat cleats.
- Allow line toggling via a connection matrix, engine/rudder/wind/current controls, presets, run/pause/step/reset, and analysis vectors.
- Save/load scenarios in localStorage.

### Task 3: Integration and browser verification
- Run the full Node test suite.
- Start a local static server.
- Exercise spring-line and reverse prop-walk scenarios in Chromium.
- Verify controls, canvas updates, telemetry, save/load, reset, mobile-responsive layout, and absence of console errors.

### Task 4: Final review
- Compare the implementation against MVP acceptance criteria.
- Fix any critical gaps found through browser use.
- Document exact run command, test result, browser checks, and known modeling limitations.
