# Dockwise

A working top-down browser simulator for rehearsing low-speed departures with a 32 ft fin-keel sailboat, single S-drive, aft/middle/forward boat cleats, and port prop walk in reverse.

## Public app

[https://matt1as.github.io/dockwise/](https://matt1as.github.io/dockwise/)

## Run locally

```bash
cd /Users/krabban/src/sailboat-docking-simulator
npm start
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173).

## Use

1. Select a preset or connect your own lines between the aft, middle, or forward boat cleat and dock cleats D1–D6.
2. Select **Astern**, **Neutral**, or **Ahead**, then set throttle and rudder.
3. Optionally set wind/current speed and the direction each vector moves **toward**.
4. Press **Run**, **Pause**, **Step**, or **Reset** and watch the boat, force vectors, line tensions, telemetry, and warnings.
5. Release a line with its × button or save/load the full scenario locally.

The boat can also be dragged to a new starting position while paused.

## Test

```bash
npm test
```

The browser verification script uses Chrome DevTools Protocol and expects:

- the app at `http://127.0.0.1:4173`, and
- headless Chrome with remote debugging on port `9222`.

It validates rendered canvas dimensions, presets, four active lines, ahead/astern motion, port prop walk, run/pause, scenario persistence, accessibility state, mobile responsiveness, and runtime exceptions.

## Model limitations

This is a qualitative low-speed rigid-body model, not CFD and not a certified navigation aid. Engine thrust, hull resistance, rudder effectiveness, line elasticity, contact response, windage, and prop walk are approximations. Calibrate the coefficients against controlled observations before treating magnitudes as representative of the real boat.
