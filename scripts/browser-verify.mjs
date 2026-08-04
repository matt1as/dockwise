import fs from 'node:fs/promises';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const appUrl = process.env.DOCKWISE_URL || 'http://127.0.0.1:4173';
const target = await (await fetch(`http://127.0.0.1:9222/json/new?${encodeURIComponent(appUrl)}`, { method: 'PUT' })).json();
if (!target?.webSocketDebuggerUrl) throw new Error('Could not create isolated Dockwise browser target');

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true });
  ws.addEventListener('error', reject, { once: true });
});

let nextId = 0;
const pending = new Map();
const exceptions = [];
ws.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message)); else resolve(message.result);
  }
  if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails.text);
});

function send(method, params = {}) {
  const id = ++nextId;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function evaluate(expression, awaitPromise = false) {
  const result = await send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}

function assert(condition, message) {
  if (!condition) throw new Error(`Browser assertion failed: ${message}`);
}

await send('Runtime.enable');
await send('Page.enable');
await send('Console.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await evaluate(`localStorage.clear()`);
await send('Page.reload', { ignoreCache: true });
await sleep(900);

const initial = await evaluate(`({
  title: document.title,
  ready: document.readyState,
  boatModel: document.querySelector('.model-pill').textContent.trim(),
  slogan: document.querySelector('.brand div span').textContent.trim(),
  modes: [...document.querySelectorAll('[data-app-mode]')].map(button => button.textContent.trim()),
  learnVisible: !document.querySelector('#learnScreen')?.hidden,
  sandboxHidden: document.querySelector('#sandboxScreen').hidden,
  lessonCount: document.querySelectorAll('[data-lesson-id]').length,
  storage: window.__dockwise.getStorageState()
})`);
assert(initial.ready === 'complete', 'page must finish loading');
assert(initial.title.includes('Dockwise'), 'title should identify Dockwise');
assert(initial.boatModel.includes('32 ft') && initial.boatModel.includes('adjustable prop walk'), 'boat model should be visible');
assert(initial.slogan === 'Trust the process', 'Dockwise slogan should match the requested wording');
assert(initial.modes.join(',') === 'Learn,Sandbox', 'Learn and Sandbox navigation should be visible');
assert(initial.learnVisible && initial.sandboxHidden, 'Learn should be the first-run default');
assert(initial.lessonCount === 10, 'Learn should list exactly ten lessons');
assert(!initial.storage.onboardingComplete && initial.storage.lastMode === 'learn', 'first-run store should preserve Learn onboarding state');
await fs.mkdir('test-artifacts', { recursive: true });
const learnShot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
await fs.writeFile('test-artifacts/dockwise-learn.png', Buffer.from(learnShot.data, 'base64'));

const lessonStart = await evaluate(`(() => {
  document.querySelector('#startFirstLesson').click();
  const before = window.__dockwise.getTrainingState();
  window.__dockwise.step(0.05);
  const after = window.__dockwise.getTrainingState();
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  const synchronized = {
    engine: document.querySelector('[data-engine="1"]').classList.contains('active') && document.querySelector('[data-lesson-engine="1"]').classList.contains('active'),
    rudder: document.querySelector('#rudder').value,
    touchRudder: document.querySelector('[data-lesson-rudder="35"]').classList.contains('active')
  };
  const input = document.querySelector('#lessonThrottle');
  input.value = 42;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  const throttle = { sandbox: document.querySelector('#throttle').value, lesson: input.value, output: document.querySelector('#lessonThrottleValue').textContent };
  document.querySelector('[data-lesson-engine="0"]').click();
  const formInput = document.querySelector('#scenarioName');
  formInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
  const formInputIgnored = document.querySelector('[data-lesson-engine="0"]').classList.contains('active');
  return {
    before, after, synchronized, throttle, formInputIgnored,
    coachVisible: !document.querySelector('#lessonCoach').hidden,
    helmVisible: !document.querySelector('#lessonHelm').hidden,
    explanation: document.querySelector('#lessonExplanation').textContent.trim(),
    experiment: document.querySelector('#lessonExperiment').textContent.trim(),
    dock: document.querySelector('#lessonDock').textContent.trim(),
    start: document.querySelector('#lessonStart').textContent.trim(),
    done: document.querySelector('#lessonDone').textContent.trim(),
    steps: document.querySelectorAll('#lessonSteps li').length,
    lineAssistHidden: document.querySelector('#connectLessonLines').hidden,
    objective: document.querySelector('#lessonObjective').textContent.trim(),
    hint: document.querySelector('#lessonHint').textContent.trim(),
    progress: document.querySelector('#lessonProgress').textContent.trim(),
    attempts: window.__dockwise.getStorageState().lessonProgress['momentum-neutral'].attempts
  };
})()`);
assert(lessonStart.before.lesson.id === 'momentum-neutral' && lessonStart.before.status === 'running', 'first lesson should start paused and deterministically');
assert(!lessonStart.before.running && lessonStart.after.elapsed === 0.05, 'fixed steps should be observed by the training evaluator');
assert(lessonStart.coachVisible && lessonStart.helmVisible, 'active lesson should expose coach and touch helm');
assert(lessonStart.explanation.length >= 80 && lessonStart.experiment.length >= 40, 'active lesson should explain the cause and suggest an experiment');
assert(lessonStart.dock.includes('dock') && lessonStart.dock.includes('fixed'), 'active lesson should explain the dock and its role');
assert(lessonStart.start.length >= 30 && lessonStart.done.length >= 40 && lessonStart.steps === 3, 'active lesson should show start, ordered steps, and completion guidance');
assert(lessonStart.lineAssistHidden, 'line setup aid should stay hidden when the lesson has no prescribed lines');
assert(lessonStart.objective && lessonStart.hint && lessonStart.progress, 'lesson objective, hint, and progress should be accessible');
assert(lessonStart.synchronized.engine && lessonStart.synchronized.rudder === '35' && lessonStart.synchronized.touchRudder, 'keyboard helm should synchronize lesson and Sandbox controls');
assert(lessonStart.throttle.sandbox === '42' && lessonStart.throttle.lesson === '42' && lessonStart.throttle.output === '42%', 'touch throttle should synchronize both control surfaces');
assert(lessonStart.formInputIgnored, 'lesson keyboard controls should ignore shortcuts from form inputs');
assert(lessonStart.attempts === 1, 'starting a lesson should persist one attempt');

const retry = await evaluate(`(() => {
  document.querySelector('#retryLesson').click();
  const training = window.__dockwise.getTrainingState();
  const state = window.__dockwise.getState();
  const attempts = window.__dockwise.getStorageState().lessonProgress['momentum-neutral'].attempts;
  window.__dockwise.step(181);
  const failure = {
    training: window.__dockwise.getTrainingState(),
    role: document.querySelector('#lessonCoach').getAttribute('role'),
    progress: document.querySelector('#lessonProgress').textContent,
    dimensions: [...document.querySelectorAll('#lessonResult .result-dimension strong')].map(node => node.textContent)
  };
  document.querySelector('#exitLesson').click();
  return { training, state, attempts, failure, learnVisible: !document.querySelector('#learnScreen').hidden };
})()`);
assert(retry.training.elapsed === 0 && !retry.training.running, 'Retry should restore the deterministic paused lesson');
assert(retry.state.x === -4 && retry.state.y === 2.8 && retry.state.heading === 0, 'Retry should restore the lesson setup through shared setters');
assert(retry.failure.training.status === 'failed' && retry.failure.training.failureReason === 'time-limit', 'lesson failure should be deterministic after an observed fixed step');
assert(retry.failure.role === 'alert' && retry.failure.progress.includes('time-limit'), 'lesson failure should be announced accessibly');
assert(retry.failure.dimensions.length === 3 && retry.failure.dimensions[0].startsWith('Control:') && retry.failure.dimensions[1].startsWith('Smoothness:') && retry.failure.dimensions[2].startsWith('Accuracy:'), 'lesson result should keep Control, Smoothness, and Accuracy separate');
assert(retry.attempts === 2 && retry.learnVisible, 'Retry should persist another attempt and Exit should return to Learn');

const targetGuidance = await evaluate(`(() => {
  window.__dockwise.startLesson('controlled-pivot');
  return {
    title: document.querySelector('#lessonTitle').textContent.trim(),
    target: document.querySelector('#lessonTarget')?.textContent.trim() || ''
  };
})()`);
assert(targetGuidance.title === 'Controlled pivot', 'controlled-pivot lesson should be selectable');
assert(targetGuidance.target.includes('090°') && targetGuidance.target.includes('±15°'), 'controlled-pivot should show its target heading and tolerance');
await evaluate(`document.querySelector('#exitLesson').click()`);

const springGuidance = await evaluate(`(() => {
  window.__dockwise.startLesson('aft-spring-departure');
  return { lines: window.__dockwise.getLines().length, visible: !document.querySelector('#connectLessonLines').hidden };
})()`);
assert(springGuidance.lines === 1 && springGuidance.visible, 'aft-spring tutorial should expose its prescribed line and connection action');
await evaluate(`document.querySelector('#exitLesson').click()`);

const lineAssist = await evaluate(`(() => {
  window.__dockwise.startLesson('bow-to-control');
  const prescribed = window.__dockwise.getLines();
  document.querySelector('#connectLessonLines').click();
  const restored = window.__dockwise.getLines();
  return {
    visible: !document.querySelector('#connectLessonLines').hidden,
    label: document.querySelector('#connectLessonLines').textContent.trim(),
    note: document.querySelector('#lessonLineNote').textContent.trim(),
    prescribed: prescribed.map(line => line.boatCleat + ':' + line.boatSide + '->' + line.dockCleat),
    restored: restored.map(line => line.boatCleat + ':' + line.boatSide + '->' + line.dockCleat),
    elapsed: window.__dockwise.getTrainingState().elapsed,
    status: window.__dockwise.getTrainingState().status
  };
})()`);
assert(lineAssist.visible, 'line setup aid should be visible when a lesson prescribes lines');
assert(lineAssist.label === 'Connect tutorial lines', 'line setup aid should explain that it connects the tutorial lines');
assert(lineAssist.note.includes('exact lines') && lineAssist.note.includes('still have to dock'), 'line setup aid should explain its limits');
assert(lineAssist.restored.length === 2 && lineAssist.restored.join(',') === lineAssist.prescribed.join(','), 'line setup aid should restore every prescribed line at its configured cleat');
assert(lineAssist.elapsed === 0 && lineAssist.status === 'running', 'line setup aid should reset the lesson attempt without advancing it');
await evaluate(`document.querySelector('#exitLesson').click()`);

const rudderDirection = await evaluate(`(() => {
  window.__dockwise.startLesson('rudder-flow');
  document.querySelector('[data-lesson-engine="1"]').click();
  document.querySelector('[data-lesson-rudder="-35"]').click();
  for (let index = 0; index < 20; index += 1) window.__dockwise.step(0.05);
  const portHeading = window.__dockwise.getState().heading;
  window.__dockwise.startLesson('rudder-flow');
  document.querySelector('[data-lesson-engine="1"]').click();
  document.querySelector('[data-lesson-rudder="35"]').click();
  for (let index = 0; index < 20; index += 1) window.__dockwise.step(0.05);
  return { portHeading, starboardHeading: window.__dockwise.getState().heading };
})()`);
assert(rudderDirection.portHeading < 0 && rudderDirection.starboardHeading > 0, 'Port and Starboard rudder controls should turn in their named directions');
await evaluate(`document.querySelector('#exitLesson').click()`);

await evaluate(`document.querySelector('#skipToSandbox').click()`);
await sleep(300);
const sandboxInitial = await evaluate(`({
  mode: window.__dockwise.getAppMode(),
  storage: window.__dockwise.getStorageState(),
  lines: window.__dockwise.getLines().length,
  canvasWidth: document.querySelector('#simCanvas').width,
  canvasHeight: document.querySelector('#simCanvas').height,
  guidanceTitle: document.querySelector('#motionTitle').textContent.trim()
})`);
assert(sandboxInitial.mode === 'sandbox' && sandboxInitial.storage.onboardingComplete && sandboxInitial.storage.lastMode === 'sandbox', 'Skip should enter and persist Sandbox mode');
assert(sandboxInitial.lines === 1, 'aft-spring preset should start with one line');
assert(sandboxInitial.canvasWidth > 500 && sandboxInitial.canvasHeight > 400, `canvas should be rendered at useful resolution (measured ${sandboxInitial.canvasWidth}×${sandboxInitial.canvasHeight})`);
assert(sandboxInitial.guidanceTitle.includes('Holding'), 'plain-language maneuver guidance should be visible');
await send('Page.reload', { ignoreCache: true });
await sleep(500);
const persistedMode = await evaluate(`({ mode: window.__dockwise.getAppMode(), sandboxVisible: !document.querySelector('#sandboxScreen').hidden, canvasWidth: document.querySelector('#simCanvas').width, canvasHeight: document.querySelector('#simCanvas').height })`);
assert(persistedMode.mode === 'sandbox' && persistedMode.sandboxVisible, 'Sandbox choice should survive reload');
assert(persistedMode.canvasWidth > 500 && persistedMode.canvasHeight > 400, 'persisted Sandbox should restore a useful canvas');

const endOnBerths = await evaluate(`(() => {
  window.__dockwise.setBerthMode('bow-to');
  const bow = { mode: window.__dockwise.getBerthMode(), state: window.__dockwise.getState(), lines: window.__dockwise.getLines() };
  window.__dockwise.setBerthMode('stern-to');
  const stern = { mode: window.__dockwise.getBerthMode(), state: window.__dockwise.getState(), lines: window.__dockwise.getLines() };
  window.__dockwise.setBerthMode('alongside');
  return { bow, stern };
})()`);
assert(endOnBerths.bow.mode === 'bow-to', 'bow-to button should select bow-to mode');
assert(Math.abs(endOnBerths.bow.state.heading + Math.PI / 2) < 1e-6, 'bow-to should point the bow at the quay');
assert(endOnBerths.bow.lines.length === 2 && endOnBerths.bow.lines.some(line => line.boatSide === 'starboard'), 'bow-to should create mirrored forward lines');
assert(endOnBerths.stern.mode === 'stern-to', 'stern-to button should select stern-to mode');
assert(Math.abs(endOnBerths.stern.state.heading - Math.PI / 2) < 1e-6, 'stern-to should point the stern at the quay');
assert(endOnBerths.stern.lines.length === 2 && endOnBerths.stern.lines.every(line => line.boatCleat === 'aft'), 'stern-to should create paired aft lines');
assert(!endOnBerths.bow.state.collision && !endOnBerths.stern.state.collision, 'end-on starting positions should be clear of the quay');

const fourLines = await evaluate(`(() => {
  window.__dockwise.applyPreset('four-lines');
  return { modelLines: window.__dockwise.getLines().length, uiLines: document.querySelectorAll('.line-item').length };
})()`);
assert(fourLines.modelLines === 4 && fourLines.uiLines === 4, 'four-lines preset should connect four visible lines');

const reverseResult = await evaluate(`(() => {
  window.__dockwise.applyPreset('clear');
  document.querySelector('#throttle').value = 100;
  window.__dockwise.setEngine(-1);
  for (let i = 0; i < 40; i += 1) window.__dockwise.step(0.05);
  return window.__dockwise.getState();
})()`);
assert(reverseResult.x < -0.05, 'astern power should move the boat backward');
assert(reverseResult.y < -0.001, 'reverse port prop walk should move the stern/boat toward port');

const starboardWalk = await evaluate(`(() => {
  window.__dockwise.applyPreset('clear');
  const slider = document.querySelector('#propWalk');
  document.querySelector('[data-prop-walk-direction="0"]').click();
  const offDisabled = slider.disabled;
  document.querySelector('[data-prop-walk-direction="-1"]').click();
  slider.value = 100;
  slider.dispatchEvent(new Event('input', { bubbles: true }));
  document.querySelector('#throttle').value = 100;
  window.__dockwise.setEngine(-1);
  for (let i = 0; i < 40; i += 1) window.__dockwise.step(0.05);
  return {
    state: window.__dockwise.getState(),
    label: document.querySelector('#propWalkValue').textContent,
    activeDirection: document.querySelector('[data-prop-walk-direction].active').textContent,
    guidance: document.querySelector('#motionSummary').textContent,
    offDisabled
  };
})()`);
assert(starboardWalk.state.y > 0.001, 'starboard prop walk should reverse lateral motion');
assert(starboardWalk.label.includes('starboard'), 'prop-walk output should name the selected direction');
assert(starboardWalk.activeDirection.includes('Starboard'), 'starboard direction button should show as selected');
assert(starboardWalk.offDisabled, 'Off should disable the prop-walk strength slider');
assert(starboardWalk.guidance.includes('starboard sideways push'), 'guidance should explain the selected prop-walk response');

const runResult = await evaluate(`(async () => {
  window.__dockwise.applyPreset('clear');
  document.querySelector('[data-engine="1"]').click();
  document.querySelector('#throttle').value = 60;
  document.querySelector('#playPause').click();
  await new Promise(resolve => setTimeout(resolve, 350));
  document.querySelector('#playPause').click();
  return { state: window.__dockwise.getState(), label: document.querySelector('#playPause').textContent };
})()`, true);
assert(runResult.state.time > 0.15, 'Run button should advance simulation time');
assert(runResult.state.x > 0, 'ahead engine should move the boat forward');
assert(runResult.label.includes('Run'), 'second click should pause the simulation');

const persistence = await evaluate(`(() => {
  window.__dockwise.applyPreset('four-lines');
  document.querySelector('#scenarioName').value = 'Browser verified departure';
  document.querySelector('#saveScenario').click();
  window.__dockwise.applyPreset('clear');
  document.querySelector('#loadScenario').click();
  return {
    lines: window.__dockwise.getLines().length,
    name: document.querySelector('#scenarioName').value,
    status: document.querySelector('#saveStatus').textContent,
    propDirection: document.querySelector('[data-prop-walk-direction].active').textContent.trim()
  };
})()`);
assert(persistence.lines === 4, 'load should restore four lines');
assert(persistence.name === 'Browser verified departure', 'load should restore scenario name');
assert(persistence.status.includes('Loaded'), 'UI should confirm loading');
assert(persistence.propDirection === 'Starboard', 'load should restore the user-friendly prop-walk direction choice');

const scenarioManagement = await evaluate(`(() => {
  document.querySelector('#scenarioName').value = '<img src=x onerror="window.__unsafe=1">';
  document.querySelector('#renameScenario').click();
  const renamed = {
    text: document.querySelector('#scenarioLibrary option:checked').textContent,
    injectedImage: Boolean(document.querySelector('#scenarioLibrary img')),
    unsafe: window.__unsafe || 0
  };
  window.confirm = () => true;
  document.querySelector('#deleteScenario').click();
  return { renamed, remaining: window.__dockwise.getStorageState().scenarios.length, status: document.querySelector('#saveStatus').textContent };
})()`);
assert(scenarioManagement.renamed.text.startsWith('<img') && !scenarioManagement.renamed.injectedImage && !scenarioManagement.renamed.unsafe, 'scenario names should render as safe text');
assert(scenarioManagement.remaining === 0 && scenarioManagement.status.includes('deleted'), 'scenario rename and delete should update the v2 store and UI');

const analysisToggle = await evaluate(`(() => {
  const button = document.querySelector('#analysisToggle');
  button.click();
  return { pressed: button.getAttribute('aria-pressed'), label: button.textContent };
})()`);
assert(analysisToggle.pressed === 'false' && analysisToggle.label.includes('off'), 'analysis toggle should update state and accessibility attribute');

await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await sleep(300);
const mobile = await evaluate(`({
  innerWidth,
  scrollWidth: document.documentElement.scrollWidth,
  canvasHeight: document.querySelector('.canvas-wrap').getBoundingClientRect().height,
  controlsBelowCanvas: document.querySelector('.controls-panel').getBoundingClientRect().top > document.querySelector('.sim-area').getBoundingClientRect().top
})`);
assert(mobile.scrollWidth <= mobile.innerWidth + 1, 'mobile layout should not overflow horizontally');
assert(mobile.canvasHeight >= 450, 'mobile simulation canvas should remain usable');
assert(mobile.controlsBelowCanvas, 'mobile controls should stack below the canvas');

const mobileShot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
await fs.writeFile('test-artifacts/dockwise-mobile.png', Buffer.from(mobileShot.data, 'base64'));

await evaluate(`document.querySelector('.prop-walk-direction').scrollIntoView({ block: 'center' })`);
await sleep(200);
const mobileControls = await evaluate(`(() => {
  const buttons = [...document.querySelectorAll('[data-prop-walk-direction]')].map(button => {
    const rect = button.getBoundingClientRect();
    return { width: rect.width, height: rect.height, label: button.textContent.trim() };
  });
  const slider = document.querySelector('#propWalk').getBoundingClientRect();
  return { buttons, sliderVisible: slider.top >= 0 && slider.bottom <= innerHeight };
})()`);
assert(mobileControls.buttons.every(button => button.height >= 42 && button.width >= 80), 'mobile prop-walk choices should be touch-friendly');
assert(mobileControls.sliderVisible, 'mobile prop-walk strength should remain visible with its direction choices');
const mobileControlsShot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
await fs.writeFile('test-artifacts/dockwise-mobile-controls.png', Buffer.from(mobileControlsShot.data, 'base64'));

await evaluate(`document.querySelector('.guidance-card').scrollIntoView({ block: 'center' })`);
await sleep(200);
const mobileGuidance = await evaluate(`(() => {
  const card = document.querySelector('.guidance-card').getBoundingClientRect();
  return {
    visible: card.top >= 0 && card.bottom <= innerHeight,
    width: card.width,
    summary: document.querySelector('#motionSummary').textContent.trim()
  };
})()`);
assert(mobileGuidance.visible && mobileGuidance.width <= mobile.innerWidth, 'mobile guidance card should be fully readable');
assert(mobileGuidance.summary.length > 40, 'mobile guidance should contain a useful explanation');
const mobileGuidanceShot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
await fs.writeFile('test-artifacts/dockwise-mobile-guidance.png', Buffer.from(mobileGuidanceShot.data, 'base64'));

await evaluate(`window.__dockwise.startLesson('bow-to-control')`);
await sleep(200);
await evaluate(`document.querySelector('#lessonCoach').scrollIntoView({ block: 'start' })`);
await sleep(150);
const portraitLesson = await evaluate(`(() => ({
  overflow: document.documentElement.scrollWidth - innerWidth,
  targets: [...document.querySelectorAll('#lessonHelm button')].map(button => {
    const rect = button.getBoundingClientRect();
    return { label: button.textContent.trim(), width: rect.width, height: rect.height };
  }),
  coachVisible: !document.querySelector('#lessonCoach').hidden,
  coachBottom: document.querySelector('#lessonCoach').getBoundingClientRect().bottom,
  canvasTop: document.querySelector('.canvas-wrap').getBoundingClientRect().top,
  helmVisible: !document.querySelector('#lessonHelm').hidden
}))()`);
assert(portraitLesson.overflow <= 1, 'portrait lesson layout should not overflow horizontally');
assert(portraitLesson.coachVisible && portraitLesson.helmVisible, 'portrait lesson should keep coach and touch helm visible');
assert(portraitLesson.coachBottom <= portraitLesson.canvasTop + 1, 'tutorial instructions must remain outside the simulation canvas');
assert(portraitLesson.targets.length === 6 && portraitLesson.targets.every(target => target.width >= 44 && target.height >= 44), 'portrait lesson helm targets should be at least 44px');
const portraitLessonShot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
await fs.writeFile('test-artifacts/dockwise-mobile-lesson.png', Buffer.from(portraitLessonShot.data, 'base64'));

await send('Emulation.setDeviceMetricsOverride', { width: 844, height: 390, deviceScaleFactor: 2, mobile: true });
await sleep(250);
await evaluate(`document.querySelector('#lessonHelm').scrollIntoView({ block: 'center' })`);
await sleep(150);
const landscapeLesson = await evaluate(`(() => ({
  innerWidth,
  scrollWidth: document.documentElement.scrollWidth,
  targets: [...document.querySelectorAll('#lessonHelm button')].map(button => {
    const rect = button.getBoundingClientRect();
    return { label: button.textContent.trim(), width: rect.width, height: rect.height };
  })
}))()`);
assert(landscapeLesson.scrollWidth <= landscapeLesson.innerWidth + 1, 'landscape lesson layout should not overflow horizontally');
assert(landscapeLesson.targets.length === 6 && landscapeLesson.targets.every(target => target.width >= 44 && target.height >= 44), 'landscape lesson helm targets should be at least 44px');
const landscapeLessonShot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
await fs.writeFile('test-artifacts/dockwise-landscape-lesson.png', Buffer.from(landscapeLessonShot.data, 'base64'));
await evaluate(`document.querySelector('#exitLesson').click(); window.__dockwise.setAppMode('sandbox')`);

await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await sleep(300);
await evaluate(`(() => {
  scrollTo(0, 0);
  document.querySelector('#scenarioName').value = 'My departure';
  document.querySelector('#saveStatus').textContent = 'Stored locally in this browser.';
  const analysis = document.querySelector('#analysisToggle');
  if (analysis.getAttribute('aria-pressed') === 'false') analysis.click();
})()`);
await evaluate(`window.__dockwise.setBerthMode('bow-to')`);
await sleep(150);
const bowShot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
await fs.writeFile('test-artifacts/dockwise-bow-to.png', Buffer.from(bowShot.data, 'base64'));
await evaluate(`window.__dockwise.setBerthMode('stern-to')`);
await sleep(150);
const sternShot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
await fs.writeFile('test-artifacts/dockwise-stern-to.png', Buffer.from(sternShot.data, 'base64'));
await evaluate(`window.__dockwise.setBerthMode('alongside')`);
const desktopShot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
await fs.writeFile('test-artifacts/dockwise-desktop.png', Buffer.from(desktopShot.data, 'base64'));

assert(exceptions.length === 0, `runtime exceptions: ${exceptions.join('; ')}`);
console.log(JSON.stringify({
  status: 'PASS',
  initial,
  lessonStart,
  retry,
  endOnBerths: {
    bow: { heading: endOnBerths.bow.state.heading, lines: endOnBerths.bow.lines.length },
    stern: { heading: endOnBerths.stern.state.heading, lines: endOnBerths.stern.lines.length }
  },
  fourLines,
  reverse: { x: reverseResult.x, y: reverseResult.y, heading: reverseResult.heading },
  starboardWalk: { y: starboardWalk.state.y, label: starboardWalk.label, guidance: starboardWalk.guidance },
  run: { time: runResult.state.time, x: runResult.state.x },
  persistence,
  scenarioManagement,
  mobile,
  mobileControls,
  mobileGuidance,
  portraitLesson,
  landscapeLesson,
  exceptions,
  screenshots: [
    'test-artifacts/dockwise-learn.png',
    'test-artifacts/dockwise-desktop.png',
    'test-artifacts/dockwise-mobile.png',
    'test-artifacts/dockwise-mobile-controls.png',
    'test-artifacts/dockwise-mobile-guidance.png',
    'test-artifacts/dockwise-mobile-lesson.png',
    'test-artifacts/dockwise-landscape-lesson.png',
    'test-artifacts/dockwise-bow-to.png',
    'test-artifacts/dockwise-stern-to.png'
  ]
}, null, 2));
ws.close();
await fetch(`http://127.0.0.1:9222/json/close/${target.id}`);
