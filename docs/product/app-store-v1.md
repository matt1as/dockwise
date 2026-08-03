# Dockwise v1 product scope

Dockwise is a browser-based, qualitative low-speed docking trainer for a 32 ft fin-keel sailboat. The current v1 web experience combines guided lessons with the existing free-form simulator. It is **not an App Store release** and this document does not claim that Apple review, signing, or publication has occurred.

## Modes

### Learn

- First-run default with a short onboarding choice.
- Exactly ten deterministic lessons, from momentum and rudder flow through alongside, bow-to, stern-to, and mixed-condition practice.
- Lessons start paused and can be retried or exited without losing the user's prior Sandbox setup.
- The coach exposes the current objective, hint, stable-target progress, and success or failure state.
- Results report three separate dimensions: Control, Smoothness, and Accuracy.
- During a lesson, synchronized touch controls provide engine, throttle, and rudder input. Keyboard controls work outside form fields: Up/Down for engine, Space for neutral, Left/Right for rudder, and C to center.

### Sandbox

- Preserves the existing Alongside, Bow-to, and Stern-to setups, line presets, custom lines, wind/current controls, prop-walk configuration, force analysis, telemetry, and run/pause/step/reset behavior.
- The Learn/Sandbox choice persists locally after onboarding.

## Local data

Dockwise stores a versioned `dockwise-v2` document in browser local storage. It contains:

- onboarding completion and last mode;
- lesson attempts, completions, and best summaries;
- a bounded scenario library with save, load, rename, and delete operations.

A valid legacy `dockwise-scenario` value migrates into the v2 scenario library. Invalid documents recover to safe defaults. Scenario names are rendered with DOM text nodes rather than interpreted as HTML.

## Verification scope

The automated suite covers unit behavior, production bundling, built-artifact verification, and a real headless-Chrome interaction run. Browser checks begin in Learn, deliberately enter Sandbox before applying legacy canvas assertions, verify lesson retry/failure and persistence, exercise existing berth/prop-walk/scenario behavior, and measure lesson touch targets in portrait and landscape.

## Safety and model limits

Dockwise is a qualitative rehearsal tool, not CFD, a certified navigation aid, or a substitute for instruction and real-world practice. Engine thrust, resistance, rudder authority, line elasticity, contact, windage, current, and prop walk are simplified approximations.
