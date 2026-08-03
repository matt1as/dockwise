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
await send('Page.reload', { ignoreCache: true });
await sleep(900);

const initial = await evaluate(`({
  title: document.title,
  ready: document.readyState,
  lines: window.__dockwise.getLines().length,
  canvasWidth: document.querySelector('#simCanvas').width,
  canvasHeight: document.querySelector('#simCanvas').height,
  boatModel: document.querySelector('.model-pill').textContent.trim(),
  slogan: document.querySelector('.brand div span').textContent.trim(),
  guidanceTitle: document.querySelector('#motionTitle').textContent.trim()
})`);
assert(initial.ready === 'complete', 'page must finish loading');
assert(initial.title.includes('Dockwise'), 'title should identify Dockwise');
assert(initial.lines === 1, 'aft-spring preset should start with one line');
assert(initial.canvasWidth > 500 && initial.canvasHeight > 400, 'canvas should be rendered at useful resolution');
assert(initial.boatModel.includes('32 ft') && initial.boatModel.includes('adjustable prop walk'), 'boat model should be visible');
assert(initial.slogan === 'Trust the process', 'Dockwise slogan should match the requested wording');
assert(initial.guidanceTitle.includes('Holding'), 'plain-language maneuver guidance should be visible');

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
await fs.mkdir('test-artifacts', { recursive: true });
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

await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await sleep(300);
await evaluate(`scrollTo(0, 0)`);
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
  endOnBerths: {
    bow: { heading: endOnBerths.bow.state.heading, lines: endOnBerths.bow.lines.length },
    stern: { heading: endOnBerths.stern.state.heading, lines: endOnBerths.stern.lines.length }
  },
  fourLines,
  reverse: { x: reverseResult.x, y: reverseResult.y, heading: reverseResult.heading },
  starboardWalk: { y: starboardWalk.state.y, label: starboardWalk.label, guidance: starboardWalk.guidance },
  run: { time: runResult.state.time, x: runResult.state.x },
  persistence,
  mobile,
  mobileControls,
  mobileGuidance,
  exceptions,
  screenshots: [
    'test-artifacts/dockwise-desktop.png',
    'test-artifacts/dockwise-mobile.png',
    'test-artifacts/dockwise-mobile-controls.png',
    'test-artifacts/dockwise-mobile-guidance.png',
    'test-artifacts/dockwise-bow-to.png',
    'test-artifacts/dockwise-stern-to.png'
  ]
}, null, 2));
ws.close();
await fetch(`http://127.0.0.1:9222/json/close/${target.id}`);
