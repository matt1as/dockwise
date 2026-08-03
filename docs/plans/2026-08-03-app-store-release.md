# Dockwise $4.99 App Store Release Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Turn Dockwise into a credible one-time $4.99 iPhone/iPad training app with guided lessons, touch-first controls, offline operation, native feedback, and App Store-ready quality while preserving the free browser sandbox and deterministic physics.

**Architecture:** Keep `src/physics.js` as the single qualitative simulation engine. Add pure lesson/evaluation and storage modules around it, then integrate them into the existing browser UI. Use Vite to produce one bundled `dist/` build and Capacitor 8 to package that build inside iOS; native behavior stays behind a small platform adapter so the same application continues to work on GitHub Pages.

**Tech Stack:** Vanilla ES modules, Canvas 2D, Node test runner, Vite, Capacitor 8 (`core`, `ios`, `haptics`, `preferences`), Xcode/iOS Simulator, existing Chrome DevTools browser verifier.

---

## Product decisions

- Sell Dockwise for **$4.99 once**; no subscription, ads, account, analytics, or cloud service in v1.
- Keep the current public web sandbox available. The paid app sells convenience, offline use, guided training, local progress, and native polish—not artificial DRM.
- Ship both **Learn** and **Sandbox** modes.
- Include ten guided lessons in English for v1.
- Report **Control**, **Smoothness**, and **Accuracy** separately. Do not invent a single “scientific” score from qualitative physics.
- Keep the model disclaimer visible. The app trains cause-and-effect reasoning and procedure; it is not a certified navigation or hydrodynamics tool.
- Support portrait and landscape on iPhone and iPad. Optimize the simulator for landscape without making portrait unusable.
- Use bundle identifier `io.nacka.dockwise` only after confirming it is available in the user’s Apple Developer account.

## Explicit v1 non-goals

- No Android release.
- No multiplayer, leaderboards, user accounts, telemetry, or push notifications.
- No StoreKit subscription or in-app purchases.
- No CFD or claim of exact real-boat prediction.
- No custom arbitrary boat editor beyond a small set of tested presets.
- No localization until the English TestFlight build is stable.

## Guided lesson catalog

1. **Momentum and neutral** — accelerate gently, select neutral, and stop without contact.
2. **Rudder needs flow** — compare centered boat behavior with rudder authority from ahead prop wash.
3. **Reverse prop walk** — observe and control the configured stern tendency in astern.
4. **Controlled pivot** — rotate through a target heading while staying inside a safe radius.
5. **Leave on an aft spring** — use one line and ahead power, then release into clear water.
6. **Leave in an offshore wind** — repeat the spring departure with environmental force.
7. **Arrive alongside** — enter a target pose slowly without dock contact or excessive line load.
8. **Bow-to control** — approach and stabilize using paired forward lines.
9. **Stern-to control** — reverse into the berth and stabilize using paired aft lines.
10. **Final mixed-conditions challenge** — choose controls and lines under wind/current with no step-by-step prompts.

Each lesson must define a deterministic setup, short briefing, completion criteria, failure conditions, coaching hints, and a result summary.

---

### Task 1: Record release scope and acceptance gates

**Objective:** Make the paid-v1 promise testable before writing feature code.

**Files:**
- Create: `docs/product/app-store-v1.md`
- Modify: `README.md`

**Step 1: Write the product brief**

Document the decisions and lesson catalog above. Add these release gates:

```markdown
- [ ] Ten lessons can be completed without opening Sandbox controls.
- [ ] Existing Sandbox behavior and saved scenarios remain compatible.
- [ ] App launches and completes lessons with network disabled.
- [ ] Collision, overload, completion, and retry states are accessible without color alone.
- [ ] No personal data or analytics leave the device.
- [ ] All Node, browser, and iOS build gates pass.
- [ ] TestFlight smoke test passes on one iPhone and one iPad form factor.
```

**Step 2: Add product positioning to README**

Explain the free web sandbox and planned paid app without advertising an unreleased App Store listing.

**Step 3: Review against YAGNI**

Confirm accounts, cloud sync, subscriptions, Android, leaderboards, and localization are listed as non-goals.

**Step 4: Commit**

```bash
git add docs/product/app-store-v1.md README.md
git commit -m "docs: define Dockwise App Store v1"
```

---

### Task 2: Install and select the native toolchain

**Objective:** Establish a reproducible iOS build environment before Capacitor files are generated.

**Files:**
- Create: `docs/ios-development.md`

**Prerequisite discovered on 2026-08-03:** `xcodebuild` currently resolves only to `/Library/Developer/CommandLineTools`; full Xcode is not selected.

**Step 1: Install full Xcode**

Install the current stable Xcode from the Mac App Store. Do not continue until installation finishes.

**Step 2: Select and initialize Xcode**

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -license accept
xcodebuild -runFirstLaunch
```

**Step 3: Verify the toolchain**

```bash
xcodebuild -version
xcrun simctl list devices available
```

Expected: an Xcode version and at least one available iOS Simulator runtime.

**Step 4: Record prerequisites**

Document Xcode, Node, npm, Apple Developer Program membership, signing team, and bundle-ID requirements in `docs/ios-development.md`. Never commit signing certificates, provisioning profiles, account credentials, or App Store Connect API secrets.

**Step 5: Commit**

```bash
git add docs/ios-development.md
git commit -m "docs: add iOS development prerequisites"
```

---

### Task 3: Add a deterministic Vite build without changing behavior

**Objective:** Produce a bundled `dist/` directory suitable for both GitHub Pages and Capacitor.

**Files:**
- Modify: `package.json`
- Create: `vite.config.js`
- Create: `package-lock.json`
- Modify: `.gitignore`
- Modify: `README.md`
- Test: `scripts/browser-verify.mjs`

**Step 1: Add a failing build smoke check**

Create `scripts/verify-build.mjs` that asserts these files exist after build and contain no remote runtime dependency:

```js
import fs from 'node:fs/promises';

for (const path of ['dist/index.html', 'dist/assets']) {
  await fs.access(path);
}
const html = await fs.readFile('dist/index.html', 'utf8');
if (!html.includes('Dockwise') || !html.includes('Trust the process')) {
  throw new Error('dist does not contain the Dockwise application');
}
```

Run before implementation:

```bash
node scripts/verify-build.mjs
```

Expected: FAIL because `dist/` does not exist.

**Step 2: Install Vite and add scripts**

```bash
npm install --save-dev vite
```

Use these scripts:

```json
{
  "start": "vite --host 127.0.0.1 --port 4173",
  "build": "vite build",
  "preview": "vite preview --host 127.0.0.1 --port 4173",
  "verify:build": "node scripts/verify-build.mjs",
  "test": "node --test",
  "test:browser": "node scripts/browser-verify.mjs"
}
```

Set Vite `base: './'` so bundled assets work inside both GitHub Pages and Capacitor.

**Step 3: Ignore generated output**

Add `dist/` to `.gitignore`; the source repository remains authoritative.

**Step 4: Build and verify**

```bash
npm run build
npm run verify:build
npm test
```

Expected: build and existing 17 physics tests pass.

**Step 5: Run the browser suite against the preview build**

Start `npm run preview`, launch headless Chrome as documented, then run:

```bash
npm run test:browser
```

Expected: PASS with the existing slogan, berth, prop-walk, persistence, desktop, and mobile assertions.

**Step 6: Commit**

```bash
git add package.json package-lock.json vite.config.js .gitignore README.md scripts/verify-build.mjs
git commit -m "build: add bundled web output"
```

---

### Task 4: Implement the pure training-session evaluator

**Objective:** Track lesson progress and results without coupling evaluation to DOM or animation timing.

**Files:**
- Create: `src/training.js`
- Create: `tests/training.test.js`

**Step 1: Write failing tests**

Cover session creation, collision failure, overload failure, stable target completion, and deterministic summaries:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createTrainingSession, observeTrainingStep } from '../src/training.js';

const lesson = {
  id: 'test-arrival',
  success: {
    target: { x: 2, y: 1, radius: 0.5, heading: 0, headingToleranceDeg: 8 },
    maxSpeed: 0.15,
    stableFor: 1,
  },
  failure: { collision: true, maxLineLoad: 9000 },
};

test('target must remain stable for the configured duration', () => {
  let session = createTrainingSession(lesson, { x: 0, y: 0, heading: 0, time: 0 });
  session = observeTrainingStep(session, lesson, {
    state: { x: 2, y: 1, heading: 0, speed: 0.1, time: 0.5, collision: false, lineResults: [] },
    dt: 0.5,
  });
  assert.equal(session.status, 'running');
  session = observeTrainingStep(session, lesson, {
    state: { x: 2, y: 1, heading: 0, speed: 0.1, time: 1, collision: false, lineResults: [] },
    dt: 0.5,
  });
  assert.equal(session.status, 'completed');
});
```

**Step 2: Verify failure**

```bash
node --test tests/training.test.js
```

Expected: FAIL because `src/training.js` does not exist.

**Step 3: Implement the minimal pure API**

Export:

```js
createTrainingSession(lesson, initialState)
observeTrainingStep(session, lesson, observation)
summarizeTrainingSession(session, lesson)
angleDifference(a, b)
```

The session records elapsed time, collision count, peak speed, peak line load, stable-target duration, status, and failure reason. Never read `performance.now()` inside the module; use simulation time/`dt` supplied by the caller.

**Step 4: Verify determinism and edge cases**

```bash
node --test tests/training.test.js
npm test
```

Expected: all training and existing physics tests pass.

**Step 5: Commit**

```bash
git add src/training.js tests/training.test.js
git commit -m "feat: add deterministic lesson evaluator"
```

---

### Task 5: Define and validate the lesson catalog

**Objective:** Store lesson setups and coaching content as data rather than scattering conditionals through `app.js`.

**Files:**
- Create: `src/lessons.js`
- Create: `tests/lessons.test.js`

**Step 1: Write failing catalog tests**

Assert ten unique IDs, valid berth modes, finite numeric setup values, valid cleat IDs, at least one success criterion, and concise text fields.

**Step 2: Define a stable lesson shape**

```js
export const LESSONS = Object.freeze([
  {
    id: 'momentum-neutral',
    order: 1,
    title: 'Momentum and neutral',
    durationLabel: '2 min',
    briefing: 'Build gentle headway, select neutral, and stop under control.',
    steps: [
      'Select Ahead and use no more than 45% throttle.',
      'At 0.4 kn, return the engine to Neutral.',
      'Finish below 0.1 kn without dock contact.',
    ],
    setup: {
      berthMode: 'alongside',
      preset: 'clear',
      state: { x: -4, y: 2.8, heading: 0 },
      controls: { engine: 0, throttle: 0.35, rudderDeg: 0, propWalk: 0.65 },
      wind: { speed: 0, directionDeg: 0 },
      current: { speed: 0, directionDeg: 0 },
    },
    success: { sequence: ['reach-speed', 'neutral-and-stop'], maxSpeed: 0.45 },
    failure: { collision: true },
    hints: ['Neutral removes thrust; it does not remove momentum.'],
  },
]);
```

Do not make lesson content user-editable in v1.

**Step 3: Implement validation**

Export `validateLesson()` and call it for every lesson during module initialization in development/test builds.

**Step 4: Run tests**

```bash
node --test tests/lessons.test.js
npm test
```

Expected: ten valid lessons and all prior tests pass.

**Step 5: Commit**

```bash
git add src/lessons.js tests/lessons.test.js
git commit -m "feat: define guided docking lessons"
```

---

### Task 6: Add Learn/Sandbox navigation and first-run onboarding

**Objective:** Give a new customer an obvious starting point while preserving direct access to the existing simulator.

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `src/app.js`
- Modify: `scripts/browser-verify.mjs`

**Step 1: Add failing browser assertions**

Assert that:

- Learn and Sandbox choices are visible.
- Learn is the first-run default.
- The lesson list shows ten lessons.
- “Skip to Sandbox” works.
- Returning users restore their last mode.
- Focus moves into the selected lesson panel.

Run `npm run test:browser`; expected FAIL.

**Step 2: Add accessible screen containers**

Add:

```html
<nav class="mode-switch" aria-label="Dockwise mode">
  <button data-app-mode="learn" aria-pressed="true">Learn</button>
  <button data-app-mode="sandbox" aria-pressed="false">Sandbox</button>
</nav>
<section id="learnScreen" aria-labelledby="learnTitle"></section>
```

Use `hidden`, `aria-pressed`, headings, and ordinary buttons—not a custom inaccessible carousel.

**Step 3: Add onboarding copy**

Keep it to three ideas:

1. Go slowly.
2. Watch which force acts where.
3. Retry safely; the simulator is qualitative.

Provide **Start first lesson** and **Skip to Sandbox** actions.

**Step 4: Preserve Sandbox**

Move existing UI into the Sandbox screen without changing IDs or behavior. Existing browser tests must continue to pass.

**Step 5: Verify responsive behavior**

Test 390×844 portrait, a landscape iPhone-size viewport, and 1024×1366 iPad portrait. Require no horizontal overflow and 44 px primary touch targets.

**Step 6: Commit**

```bash
git add index.html styles.css src/app.js scripts/browser-verify.mjs
git commit -m "feat: add Learn and Sandbox entry flow"
```

---

### Task 7: Connect lesson setups to the existing simulator

**Objective:** Start, retry, and exit a lesson through one tested setup path.

**Files:**
- Modify: `src/app.js`
- Modify: `src/lessons.js`
- Modify: `scripts/browser-verify.mjs`

**Step 1: Add failing browser coverage**

Select “Momentum and neutral” and assert the expected berth mode, position, heading, lines, environment, controls, lesson title, and paused state.

**Step 2: Add one application function**

Implement:

```js
function startLesson(lessonId) {
  const lesson = getLesson(lessonId);
  trainingSession = createTrainingSession(lesson, lesson.setup.state);
  applyLessonSetup(lesson.setup);
  activeLesson = lesson;
  running = false;
  renderLessonCoach();
  updateOutputs();
}
```

`applyLessonSetup()` must use the same internal state/control setters as Sandbox. Do not synthesize button clicks.

**Step 3: Add Retry and Exit**

Retry creates a fresh deterministic session from the original setup. Exit pauses simulation and returns to the lesson list without overwriting saved Sandbox scenarios.

**Step 4: Expose test hooks**

Extend `window.__dockwise` with read-only `getTrainingState()` and command `startLesson(id)`; never expose mutable internals.

**Step 5: Run tests**

```bash
npm test
npm run test:browser
```

Expected: existing Sandbox suite and new lesson setup checks pass.

**Step 6: Commit**

```bash
git add src/app.js src/lessons.js scripts/browser-verify.mjs
git commit -m "feat: start and retry guided lessons"
```

---

### Task 8: Display live coaching, completion, and honest results

**Objective:** Convert simulator telemetry into understandable learner feedback.

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `src/app.js`
- Modify: `src/training.js`
- Modify: `tests/training.test.js`
- Modify: `scripts/browser-verify.mjs`

**Step 1: Add failing evaluator and browser tests**

Cover one completed lesson, collision failure, overload warning, and retry. Assert results remain the same for identical fixed-step input.

**Step 2: Observe each fixed physics step**

Immediately after `stepSimulation()` inside the fixed-step loop, call:

```js
trainingSession = observeTrainingStep(trainingSession, activeLesson, {
  state,
  controls: currentControls(),
  lineResults: state.lineResults || [],
  dt: 1 / 60,
});
```

Do not evaluate once per animation frame; that would make outcomes frame-rate dependent.

**Step 3: Add coach states**

Render:

- Current objective
- One next-action hint
- Progress condition(s)
- Clear success/failure banner
- Retry and Next lesson buttons

Use `aria-live="polite"` for coaching and `role="alert"` only for collision/overload failure.

**Step 4: Add result dimensions**

- **Control:** collisions and overloads
- **Smoothness:** peak speed and abrupt throttle reversals
- **Accuracy:** final position and heading relative to the lesson target

Show measured values and plain-language labels. Do not show false precision beyond one decimal where appropriate.

**Step 5: Verify**

```bash
npm test
npm run test:browser
```

Expected: deterministic pass/fail, accessible results, and unchanged Sandbox behavior.

**Step 6: Commit**

```bash
git add index.html styles.css src/app.js src/training.js tests/training.test.js scripts/browser-verify.mjs
git commit -m "feat: add live coaching and lesson results"
```

---

### Task 9: Add a touch-first helm overlay

**Objective:** Make active maneuvering comfortable on iPhone without removing advanced controls.

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `src/app.js`
- Modify: `scripts/browser-verify.mjs`

**Step 1: Add failing mobile interaction tests**

Require:

- Astern, Neutral, and Ahead controls at least 44×44 CSS px.
- Port, Center, and Starboard helm controls at least 44×44 CSS px.
- Current throttle and rudder values visible.
- Pressing helm controls updates the existing rudder control and simulation.
- Keyboard controls remain available on desktop.

**Step 2: Add a compact helm**

Place it below/over the canvas only during an active lesson:

```html
<div class="lesson-helm" aria-label="Lesson helm controls">
  <div class="engine-pad" role="group" aria-label="Engine direction">…</div>
  <input id="lessonThrottle" type="range" min="0" max="100" aria-label="Throttle">
  <div class="rudder-pad" role="group" aria-label="Rudder">…</div>
</div>
```

Keep the existing detailed panel as the advanced/Sandbox editor. Both surfaces must call the same setters and stay synchronized.

**Step 3: Add keyboard handling**

Support arrow keys only when focus is not in an input/select:

- Up: ahead
- Down: astern
- Space: neutral
- Left/right: port/starboard rudder
- `C`: center rudder

Show shortcuts in desktop help; do not rely on them on mobile.

**Step 4: Verify mobile ergonomics**

Run the browser test at portrait and landscape sizes and inspect screenshots. Controls must not cover warnings or the boat.

**Step 5: Commit**

```bash
git add index.html styles.css src/app.js scripts/browser-verify.mjs
git commit -m "feat: add touch-first lesson helm"
```

---

### Task 10: Persist progress and multiple custom scenarios safely

**Objective:** Replace the single raw `localStorage` slot with versioned storage that works on web and iOS.

**Files:**
- Create: `src/storage.js`
- Create: `tests/storage.test.js`
- Modify: `src/app.js`
- Modify: `scripts/browser-verify.mjs`

**Step 1: Write failing storage tests**

Cover default state, v1 migration from `dockwise-scenario`, malformed data recovery, lesson completion, retry count, scenario list limits, rename, and delete.

**Step 2: Define a versioned document**

```js
{
  version: 2,
  onboardingComplete: true,
  lastMode: 'learn',
  lessonProgress: {
    'momentum-neutral': { completed: true, attempts: 2, best: { control: 'clean' } }
  },
  scenarios: []
}
```

**Step 3: Implement injectable storage**

Export `createDockwiseStore(adapter)`. Tests use an in-memory adapter; the web runtime uses `localStorage`. Validate all parsed data and cap custom scenarios at a documented number such as 50.

**Step 4: Migrate without data loss**

On first launch, import the existing `dockwise-scenario` value through `deserializeScenario()`, then store it in the v2 scenario list. Do not delete the old value until the new document has been written and read back successfully.

**Step 5: Integrate progress UI**

Show Completed, attempts, and best result per lesson. Add scenario rename/delete with confirmation.

**Step 6: Verify**

```bash
node --test tests/storage.test.js
npm test
npm run test:browser
```

Expected: migration and browser reload preserve both lesson progress and custom scenarios.

**Step 7: Commit**

```bash
git add src/storage.js tests/storage.test.js src/app.js scripts/browser-verify.mjs
git commit -m "feat: persist lessons and scenario library"
```

---

### Task 11: Add the native platform adapter and haptics

**Objective:** Add restrained iOS feedback without leaking Capacitor concerns into simulation code.

**Files:**
- Create: `src/platform.js`
- Create: `tests/platform.test.js`
- Modify: `src/app.js`
- Modify: `package.json`
- Modify: `package-lock.json`

**Step 1: Install plugins**

Use the same Capacitor major for all packages:

```bash
npm install @capacitor/core@8 @capacitor/haptics@8 @capacitor/preferences@8
npm install --save-dev @capacitor/cli@8 @capacitor/ios@8
```

Versions observed during planning: core/ios 8.5.0, haptics 8.0.2, preferences 8.0.1. Let `package-lock.json` pin the exact resolved releases used during implementation.

**Step 2: Write failing adapter tests**

Test that browser mode is a no-op, repeated collision frames do not create repeated haptics, and each semantic event maps once:

- control tap → light impact
- line overload → warning notification
- dock collision → error notification
- lesson completion → success notification

**Step 3: Implement the adapter**

```js
export function createPlatform({ native, haptics, preferences }) {
  return {
    isNative: native,
    impact: async (style = 'Light') => native && haptics.impact({ style }),
    notify: async (type) => native && haptics.notification({ type }),
    preferences,
  };
}
```

Production wiring may import Capacitor plugins, but physics and training modules must never import them.

**Step 4: Debounce semantic events**

Trigger haptics only on state transitions, not every 1/60-second simulation step.

**Step 5: Verify web fallback**

```bash
npm test
npm run build
npm run test:browser
```

Expected: web behavior is unchanged and no unavailable-plugin exception appears.

**Step 6: Commit**

```bash
git add src/platform.js tests/platform.test.js src/app.js package.json package-lock.json
git commit -m "feat: add native storage and haptic adapter"
```

---

### Task 12: Generate the offline Capacitor iOS application

**Objective:** Bundle `dist/` locally so Dockwise launches and trains with airplane mode enabled.

**Files:**
- Create: `capacitor.config.ts`
- Create: `ios/` via Capacitor
- Modify: `package.json`
- Modify: `.gitignore`
- Modify: `docs/ios-development.md`

**Step 1: Configure Capacitor**

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.nacka.dockwise',
  appName: 'Dockwise',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
  },
};

export default config;
```

Do not configure a remote `server.url`; that would make the paid app a network wrapper and break offline use.

**Step 2: Add scripts**

```json
{
  "cap:sync": "npm run build && cap sync ios",
  "ios:open": "npm run cap:sync && cap open ios",
  "ios:build": "npm run cap:sync && xcodebuild -workspace ios/App/App.xcworkspace -scheme App -configuration Debug -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build"
}
```

**Step 3: Generate iOS project**

```bash
npx cap add ios
npm run cap:sync
```

**Step 4: Build without signing**

```bash
npm run ios:build
```

Expected: `** BUILD SUCCEEDED **`.

**Step 5: Prove offline behavior**

Launch in Simulator, disable network, terminate the app, relaunch, start a lesson, complete fixed-step interactions, save progress, terminate, and verify progress after relaunch.

**Step 6: Commit**

Commit the Capacitor config and generated iOS project, but exclude `DerivedData`, build products, local signing settings, and user-specific Xcode files.

```bash
git add capacitor.config.ts package.json package-lock.json .gitignore ios docs/ios-development.md
git commit -m "feat: add offline iOS application shell"
```

---

### Task 13: Apply iPhone/iPad layout, safe-area, and lifecycle polish

**Objective:** Make the packaged build behave as a real iOS app across supported form factors.

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `src/app.js`
- Modify: `ios/App/App/Info.plist`
- Modify: `scripts/browser-verify.mjs`

**Step 1: Add viewport and safe-area support**

Use:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

Apply `env(safe-area-inset-top/right/bottom/left)` to the app shell and lesson helm.

**Step 2: Test lifecycle behavior**

Pause simulation on `visibilitychange`/app background. Restore the exact paused lesson state on return. Never advance based on time spent backgrounded.

**Step 3: Test orientation changes**

On resize/orientation change, resize the canvas without resetting lesson state, controls, trail, or lines.

**Step 4: Add reduced-motion and contrast support**

Respect `prefers-reduced-motion`. Ensure warnings and success states use icons/text as well as color. Maintain visible keyboard focus.

**Step 5: Verify matrices**

Browser emulation:

- 390×844 portrait
- 844×390 landscape
- 1024×1366 iPad portrait
- 1366×1024 iPad landscape

Simulator checks: current small iPhone, current large iPhone, and current iPad Simulator.

**Step 6: Commit**

```bash
git add index.html styles.css src/app.js ios/App/App/Info.plist scripts/browser-verify.mjs
git commit -m "fix: polish Dockwise for iPhone and iPad"
```

---

### Task 14: Finish all ten lesson scripts and calibration

**Objective:** Turn the training shell into a coherent short curriculum rather than ten arbitrary challenges.

**Files:**
- Modify: `src/lessons.js`
- Modify: `tests/lessons.test.js`
- Create: `docs/lesson-authoring.md`
- Create: `docs/lesson-qa.md`

**Step 1: Author lessons in increasing difficulty**

For each lesson, record:

- What concept it teaches
- Starting setup
- Required user action
- Success/failure criteria
- Why each hint appears
- Expected completion time
- Qualitative model limitation relevant to that lesson

**Step 2: Add deterministic reference traces**

Create test helpers that run a known sequence of controls at 1/60-second steps. Each lesson must have one passing reference trace and at least one representative failure trace.

**Step 3: Tune criteria, not physics, first**

If a lesson is frustrating, adjust target radius, stable duration, briefing, or setup before changing global physics coefficients. Physics changes require separate regression justification.

**Step 4: Human QA**

Have at least one novice and one experienced sailor attempt the first three lessons without verbal coaching. Record confusion in `docs/lesson-qa.md`; fix wording and flow before adding visual effects.

**Step 5: Verify**

```bash
npm test
npm run test:browser
npm run ios:build
```

Expected: all ten reference traces pass deterministically.

**Step 6: Commit**

```bash
git add src/lessons.js tests/lessons.test.js docs/lesson-authoring.md docs/lesson-qa.md
git commit -m "content: complete Dockwise training curriculum"
```

---

### Task 15: Add privacy, support, disclaimer, and App Store assets

**Objective:** Prepare truthful customer-facing and review material.

**Files:**
- Create: `privacy.html`
- Create: `support.html`
- Create: `assets/app-icon.svg`
- Create: `assets/app-icon-1024.png`
- Create: `docs/app-store/metadata.md`
- Create: `docs/app-store/review-notes.md`
- Create: `docs/app-store/screenshot-plan.md`
- Modify: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- Modify: `README.md`

**Step 1: Publish privacy and support pages**

Privacy policy must truthfully state that v1 has no account, analytics, advertising SDK, tracking, or server upload; progress and scenarios remain on-device. Support must provide a contact route, current version, troubleshooting, model disclaimer, and data-reset instructions.

**Step 2: Create the app icon**

Use original Dockwise artwork with no transparency in the final 1024×1024 App Store icon. Verify legibility at small sizes and do not use another product’s maritime marks.

**Step 3: Draft metadata**

Include:

- Name: Dockwise
- Subtitle: Trust the process
- Price: USD 4.99 equivalent, one-time paid app
- Category: Education (primary), Simulation/Games only if App Store Connect permits the chosen secondary category
- Keywords centered on sailboat docking, berthing, prop walk, spring lines, and boat handling
- Explicit “qualitative training simulator” language

**Step 4: Draft review notes**

Tell App Review that:

- Simulation and lessons are bundled and work offline.
- No login is required.
- No personal data is collected.
- Native haptics provide event feedback.
- Learn and Sandbox modes are available immediately.
- The app does not claim certified navigation accuracy.

**Step 5: Capture screenshots**

Capture current required iPhone and iPad sizes from the final TestFlight-equivalent build. Show Learn mode, active guided maneuver, line forces, result screen, and Sandbox configuration. Re-check current App Store Connect size requirements at submission time rather than hard-coding stale dimensions.

**Step 6: Commit and deploy web legal pages**

```bash
git add privacy.html support.html assets docs/app-store ios/App/App/Assets.xcassets README.md
git commit -m "docs: add App Store assets and customer policies"
```

Deploy GitHub Pages and verify public HTTPS URLs for privacy and support.

---

### Task 16: Create the release regression and quality gate

**Objective:** Make a release impossible without evidence from unit, browser, build, offline, and native checks.

**Files:**
- Modify: `package.json`
- Modify: `scripts/browser-verify.mjs`
- Create: `scripts/release-check.mjs`
- Modify: `docs/acceptance.md`

**Step 1: Extend browser verification**

Cover:

- First-run onboarding
- Learn/Sandbox switching
- One complete passing lesson
- One failure/retry flow
- Lesson progress persistence
- Custom scenario migration
- Touch helm in portrait and landscape
- No horizontal overflow
- No runtime exceptions

**Step 2: Add release command**

`npm run release:check` must run, in order:

```bash
npm test
npm run build
npm run verify:build
node --check src/app.js
node --check src/physics.js
node --check src/training.js
node --check src/lessons.js
npm run test:browser
npm run ios:build
git diff --check
```

The script must stop on the first failure and print which gate failed.

**Step 3: Add stress verification**

Run a ten-minute accelerated deterministic maneuver with extreme permitted controls. Assert all state values remain finite, storage remains valid, and line/session arrays remain bounded.

**Step 4: Record actual evidence**

Update `docs/acceptance.md` with commands, device/simulator models, versions, pass counts, offline result, and known limitations. Never write “passed” before executing the command.

**Step 5: Independent review**

Review for:

- App Store minimum-functionality risk
- Privacy declaration accuracy
- Unsafe dynamic HTML
- Storage migration/data loss
- Fixed-step determinism
- Accessibility and touch targets
- Native build/signing cleanliness

**Step 6: Commit**

```bash
git add package.json scripts docs/acceptance.md
git commit -m "test: add App Store release quality gate"
```

---

### Task 17: Run TestFlight acceptance

**Objective:** Validate the signed app with real installation and representative users before sale.

**Files:**
- Create: `docs/app-store/testflight-checklist.md`
- Modify: `docs/lesson-qa.md`
- Modify: `docs/acceptance.md`

**Step 1: Configure signing in Xcode**

Select the user’s team, confirm `io.nacka.dockwise`, use automatic signing unless there is a specific reason not to, and create the App Store Connect record. Do not commit team IDs if the repository should remain generic.

**Step 2: Archive and upload**

Use Xcode Organizer to archive the Release scheme, validate, and upload. Resolve warnings rather than bypassing them.

**Step 3: Internal TestFlight smoke test**

Test:

- Fresh install and first lesson
- Airplane-mode launch
- Background/foreground pause
- Portrait/landscape rotation
- Haptics on physical hardware
- Lesson completion and persistence after force quit
- Custom scenario save/load/delete
- No unexpected network or privacy prompts
- Ten-minute simulation stability

**Step 4: External usability test**

Ask a small group including at least one novice and one experienced sailor to complete lessons 1, 3, and 5 without live coaching. Collect only voluntary written feedback; do not add analytics to solve this.

**Step 5: Fix blockers and rerun the full gate**

Any crash, progress loss, unintelligible lesson, inaccessible control, or offline failure blocks release.

**Step 6: Commit acceptance evidence**

```bash
git add docs/app-store/testflight-checklist.md docs/lesson-qa.md docs/acceptance.md
git commit -m "test: record TestFlight acceptance"
```

---

### Task 18: Submit the one-time paid App Store release

**Objective:** Submit a truthful $4.99 v1 and verify the production listing after approval.

**Files:**
- Modify: `docs/app-store/metadata.md`
- Modify: `docs/app-store/review-notes.md`
- Modify: `docs/acceptance.md`

**Step 1: Complete commercial prerequisites**

In App Store Connect, complete the Paid Apps agreement, banking, and tax information. Set the one-time app price to USD 4.99 and review automatically generated regional prices.

**Step 2: Complete privacy labels**

Declare “Data Not Collected” only after confirming the final binary contains no analytics, advertising, tracking, crash-reporting upload, account system, or server logging controlled by Dockwise.

**Step 3: Attach final build and metadata**

Provide screenshots, description, keywords, support URL, privacy URL, copyright, age rating, review contact, and review notes.

**Step 4: Submit for review**

Do not promise approval. If Apple raises Guideline 4.2, respond with concrete functionality: bundled deterministic simulator, ten offline lessons, native haptics, persistent progress, custom scenarios, and touch-specific controls. If rejected, address the cited issue and record the actual resolution.

**Step 5: Verify production after approval**

Install the public App Store binary—not a local/TestFlight build—and rerun the short smoke test. Verify price, screenshots, privacy/support links, version, offline launch, and lesson progress.

**Step 6: Tag the release**

```bash
git tag -a v1.0.0 -m "Dockwise iOS 1.0.0"
git push origin main --follow-tags
```

Only tag after the submitted commit and public binary are known to match.

---

## Final release gate

Every item must be backed by actual output or device observation:

- [ ] Existing physics regressions pass.
- [ ] Training, lesson, storage, and platform tests pass.
- [ ] All ten deterministic reference lesson traces pass.
- [ ] Browser suite passes against source preview and deployed GitHub Pages.
- [ ] iOS Simulator Debug and Release builds succeed.
- [ ] App works after cold launch with network disabled.
- [ ] Progress survives force quit and versioned migration.
- [ ] Physical-device haptics and safe areas are verified.
- [ ] No crashes or state corruption in the stress run.
- [ ] Novice usability test can complete lesson 1 without live help.
- [ ] Privacy/support pages are publicly reachable over HTTPS.
- [ ] App privacy label matches the final binary.
- [ ] TestFlight checklist has no release blockers.
- [ ] Production App Store binary is smoke-tested after approval.

## Recommended execution order

Implement Tasks 1–10 as the **product milestone** and test the complete curriculum in the browser before doing native work. Proceed with Tasks 11–16 as the **iOS milestone** only when guided lessons are genuinely useful. Tasks 17–18 are the **commercial release milestone** and require the user’s Apple Developer account, signing, legal agreements, TestFlight decisions, and final submission approval.
