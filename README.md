# Dockwise

A working top-down browser trainer for learning and rehearsing low-speed docking with a 32 ft fin-keel sailboat, single S-drive, aft/middle/forward boat cleats, and adjustable prop walk.

## Public browser app

[https://matt1as.github.io/dockwise/](https://matt1as.github.io/dockwise/)

## Run locally

```bash
cd sailboat-docking-simulator
npm start
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173).

## Local Supabase backend

The browser app can run entirely offline/local, or use the local Supabase instance for optional accounts and progress sync. OrbStack must be running with its Docker context selected.

```bash
# Start the local Supabase services and apply migrations
npm run db:start

# Copy the public local API values from `npm run db:status` into .env.local:
# VITE_SUPABASE_URL=http://127.0.0.1:54321
# VITE_SUPABASE_ANON_KEY=[local public key]

npm start
```

Open the app at [http://127.0.0.1:4173](http://127.0.0.1:4173). The **Optional cloud progress** panel on the Learn screen supports local email/password signup and sign-in. The local migration creates `profiles`, `lesson_progress`, and `lesson_attempts` with per-user RLS policies. Reset the disposable local database with `npm run db:reset`; stop services with `npm run db:stop`. Never use local Supabase keys or the local database password in production.

The Supabase CLI is invoked through `npx supabase@latest`, so it does not need to be installed globally. The initial local setup may report unhealthy Vector/Auth/Storage health checks under OrbStack while still starting the API and database; `db:start` intentionally uses `--ignore-health-check`, and the REST/Auth end-to-end check is the authoritative verification for this project slice.

## Use

First-time visitors start in **Learn**, which contains ten guided, retryable lessons. Lesson attempts and completions remain in this browser. During an active lesson, use the touch helm or the keyboard: Up/Down selects engine direction, Space selects neutral, Left/Right sets rudder, and C centers it. Keyboard shortcuts are ignored while typing in a form field.

Choose **Sandbox** for free-form practice:

1. Choose **Alongside**, **Bow-to**, or **Stern-to**. End-on modes start perpendicular to the quay with mirrored port/starboard line pairs.
2. Select a line preset or connect your own lines between the aft, middle, or forward boat cleat, its port/starboard side, and dock cleats D1–D6.
3. Select **Astern**, **Neutral**, or **Ahead**, then set throttle and rudder. Choose **Port**, **Off**, or **Starboard** for prop-walk direction and adjust its strength separately; 65% port matches the default boat profile.
4. Optionally set wind/current speed and the direction each vector moves **toward**.
5. Press **Run**, **Pause**, **Step**, or **Reset** and watch the boat, force vectors, line tensions, telemetry, and warnings.
6. Release a line with its × button or save, load, rename, and delete scenarios in the local scenario library.

The boat can also be dragged to a new starting position while paused.

## Test

```bash
npm test
npm run build
npm run verify:build
npm run test:browser
```

The browser verification script uses Chrome DevTools Protocol and expects:

- the app at `http://127.0.0.1:4173`, and
- headless Chrome with remote debugging on port `9222`.

It validates first-run Learn onboarding, all ten lesson cards, deterministic lesson start/retry/failure, synchronized keyboard/touch controls, mode persistence, rendered Sandbox canvas dimensions, presets, berth modes, ahead/astern motion, signed prop walk, run/pause, safe scenario persistence/rename/delete, portrait and landscape 44 px lesson targets, mobile responsiveness, and runtime exceptions.

## iOS setup and verification

The Capacitor project targets iPhone and iPad on iOS 15 or later. From a clean checkout, install dependencies, verify the web app, build it, sync the built files and native plugins, then inspect the generated project:

```bash
npm ci
npm test
npm run build
npm run verify:build
npm run cap:sync
npm run verify:ios
```

Run `npm run cap:sync` after every web or Capacitor dependency change. On a Mac with full Xcode installed, open the generated project with `npm run ios:open` and configure signing before creating an archive. App Store signing, an App Store Connect record, TestFlight upload, and device/TestFlight validation have **not** been completed yet.

## GitHub Pages deployment

`.github/workflows/pages.yml` tests and builds the Vite app, then deploys `dist` to GitHub Pages. After the repository's Pages source is switched to **GitHub Actions**, the bundled browser app and its `/privacy.html` and `/support.html` pages are served together. This repository change does not alter the live Pages setting by itself.

## Model limitations

This is a qualitative low-speed rigid-body model, not CFD and not a certified navigation aid. Engine thrust, hull resistance, rudder effectiveness, line elasticity, contact response, windage, and prop walk are approximations. Calibrate the coefficients against controlled observations before treating magnitudes as representative of the real boat.
