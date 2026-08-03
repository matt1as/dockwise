import {
  BOAT_PRESET,
  createInitialState,
  createBerthState,
  boatPointToWorld,
  computeForces,
  stepSimulation,
  serializeScenario,
  deserializeScenario,
} from './physics.js';

const canvas = document.querySelector('#simCanvas');
const ctx = canvas.getContext('2d');
const dockY = -3.65;
const dockCleats = [
  { id: 'D1', x: -7.5, y: dockY }, { id: 'D2', x: -4.5, y: dockY },
  { id: 'D3', x: -1.5, y: dockY }, { id: 'D4', x: 1.5, y: dockY },
  { id: 'D5', x: 4.5, y: dockY }, { id: 'D6', x: 7.5, y: dockY },
];
const colors = ['#4cc9e7', '#ffbb55', '#a88cff', '#70e0bb', '#ff7d8b', '#b7d867'];
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const clone = (value) => JSON.parse(JSON.stringify(value));

let state = createInitialState({ x: 0, y: 0, heading: 0 });
let lines = [];
let lineCounter = 0;
let engine = 0;
let propWalkDirection = 1;
let berthMode = 'alongside';
let running = false;
let analysis = true;
let lastFrame = performance.now();
let accumulator = 0;
let trail = [];
let dragging = false;
let view = { width: 0, height: 0, scale: 42, originX: 0, originY: 0, dpr: 1 };

const controls = {
  throttle: $('#throttle'), rudder: $('#rudder'), propWalk: $('#propWalk'),
  windSpeed: $('#windSpeed'), windDirection: $('#windDirection'),
  currentSpeed: $('#currentSpeed'), currentDirection: $('#currentDirection'),
  simSpeed: $('#simSpeed'),
};

for (const cleat of dockCleats) {
  const option = document.createElement('option');
  option.value = cleat.id;
  option.textContent = `${cleat.id} (${cleat.x > 0 ? '+' : ''}${cleat.x} m)`;
  $('#dockCleat').append(option);
}

function currentControls() {
  return {
    engine,
    throttle: Number(controls.throttle.value) / 100,
    rudderDeg: Number(controls.rudder.value),
    propWalk: propWalkDirection * Number(controls.propWalk.value) / 100,
    wind: { speed: Number(controls.windSpeed.value), directionDeg: Number(controls.windDirection.value) },
    current: { speed: Number(controls.currentSpeed.value), directionDeg: Number(controls.currentDirection.value) },
    berthMode,
    dockBoundaryY: dockY + 0.18,
    lines,
  };
}

function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function dockCleat(id) { return dockCleats.find((cleat) => cleat.id === id); }

function makeLine(boatCleat, dockId, slackPercent = 3, boatSide = 'port') {
  const dock = dockCleat(dockId);
  const station = BOAT_PRESET.cleats[boatCleat];
  const localBoatPoint = { x: station.x, y: boatSide === 'starboard' ? Math.abs(station.y) : -Math.abs(station.y) };
  const boatPoint = boatPointToWorld(state, localBoatPoint);
  const length = distance(boatPoint, dock);
  lineCounter += 1;
  return {
    id: `L${lineCounter}`,
    active: true,
    boatCleat,
    boatSide,
    boatPoint: localBoatPoint,
    dockCleat: dockId,
    dockPoint: { x: dock.x, y: dock.y },
    restLength: length * (1 + slackPercent / 100),
    stiffness: 3600,
    damping: 800,
    maxLoad: 9000,
    color: colors[(lineCounter - 1) % colors.length],
  };
}

function resetBoat() {
  state = createBerthState(berthMode, dockY + 0.18, 0.65);
  running = false;
  trail = [];
  accumulator = 0;
  $('#playPause').textContent = '▶ Run';
  updateOutputs();
}

function setBerthMode(mode) {
  berthMode = mode;
  resetBoat();
  lineCounter = 0;
  if (mode === 'bow-to') {
    lines = [makeLine('forward', 'D4', 4, 'port'), makeLine('forward', 'D3', 4, 'starboard')];
  } else if (mode === 'stern-to') {
    lines = [makeLine('aft', 'D4', 4, 'port'), makeLine('aft', 'D3', 4, 'starboard')];
  } else {
    lines = [makeLine('aft', 'D4', 2, 'port')];
  }
  $$('[data-berth]').forEach((button) => button.classList.toggle('active', button.dataset.berth === mode));
  $$('.preset').forEach((button) => button.classList.remove('active'));
  resizeCanvas();
  renderLineList();
  updateOutputs();
}

function setEngine(value) {
  engine = Number(value);
  $$('[data-engine]').forEach((button) => button.classList.toggle('active', Number(button.dataset.engine) === engine));
  updateGuidance();
}

function setPropWalkDirection(value) {
  propWalkDirection = Math.max(-1, Math.min(1, Number(value)));
  $$('[data-prop-walk-direction]').forEach((button) => {
    const active = Number(button.dataset.propWalkDirection) === propWalkDirection;
    button.classList.toggle('active', active);
    button.ariaPressed = String(active);
  });
  controls.propWalk.disabled = propWalkDirection === 0;
  updateRangeOutputs();
  updateGuidance();
}

function applyPreset(name) {
  resetBoat();
  lineCounter = 0;
  if (name === 'aft-spring') {
    lines = [makeLine('aft', 'D4', 2)];
    setEngine(0);
  } else if (name === 'mid-spring') {
    lines = [makeLine('middle', 'D4', 2)];
    setEngine(0);
  } else if (name === 'four-lines') {
    lines = [makeLine('aft', 'D1', 4), makeLine('aft', 'D3', 3), makeLine('forward', 'D4', 3), makeLine('forward', 'D6', 4)];
    setEngine(0);
  } else {
    lines = [];
    setEngine(0);
  }
  $$('.preset').forEach((button) => button.classList.toggle('active', button.dataset.preset === name));
  renderLineList();
  updateOutputs();
}

function updateRangeOutputs() {
  $('#throttleValue').textContent = `${controls.throttle.value}%`;
  const rudder = Number(controls.rudder.value);
  $('#rudderValue').textContent = `${rudder > 0 ? '+' : ''}${rudder}°`;
  const propWalk = Number(controls.propWalk.value);
  $('#propWalkValue').textContent = propWalkDirection === 0
    ? 'Off'
    : `${propWalk}% ${propWalkDirection > 0 ? 'port' : 'starboard'}`;
  $('#lineSlackValue').textContent = `${$('#lineSlack').value}%`;
}

function updateGuidance() {
  const throttle = Number(controls.throttle.value);
  const rudder = Number(controls.rudder.value);
  const wind = Number(controls.windSpeed.value);
  const current = Number(controls.currentSpeed.value);
  const modeName = { alongside: 'alongside', 'bow-to': 'bow-to', 'stern-to': 'stern-to' }[berthMode];
  const motion = engine > 0 ? 'Ahead' : engine < 0 ? 'Astern' : 'Holding';
  $('#motionTitle').textContent = `${motion} · ${modeName}`;

  const sentences = [];
  if (engine === 0) {
    sentences.push('Engine neutral: there is no propeller thrust.');
  } else if (engine > 0) {
    sentences.push(`Ahead at ${throttle}% pushes the boat forward.`);
  } else {
    sentences.push(`Astern at ${throttle}% pulls the boat backward.`);
    if (propWalkDirection === 0 || Number(controls.propWalk.value) === 0) {
      sentences.push('Prop walk is off.');
    } else {
      sentences.push(`Prop walk adds a ${propWalkDirection > 0 ? 'port' : 'starboard'} sideways push.`);
    }
  }
  if (Math.abs(rudder) < 1) {
    sentences.push('Rudder centered.');
  } else {
    sentences.push(`Rudder ${Math.abs(rudder)}° to ${rudder > 0 ? 'starboard' : 'port'}; its effect grows with boat speed and propeller wash.`);
  }
  if (lines.length) sentences.push(`${lines.length} connected ${lines.length === 1 ? 'line is' : 'lines are'} restraining the boat.`);
  else sentences.push('No lines are connected; the boat is free to move.');
  $('#motionSummary').textContent = sentences.join(' ');

  const facts = [
    modeName,
    `${lines.length} ${lines.length === 1 ? 'line' : 'lines'}`,
    engine === 0 ? 'engine neutral' : `${throttle}% ${engine > 0 ? 'ahead' : 'astern'}`,
  ];
  if (wind > 0) facts.push(`wind ${wind} m/s`);
  if (current > 0) facts.push(`current ${current} m/s`);
  const factNodes = facts.map((fact) => {
    const chip = document.createElement('span');
    chip.textContent = fact;
    return chip;
  });
  $('#motionFacts').replaceChildren(...factNodes);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const rest = (seconds % 60).toFixed(1).padStart(4, '0');
  return `${minutes}:${rest}`;
}

function updateOutputs() {
  const knot = 1.94384;
  $('#speedValue').textContent = (state.speed * knot).toFixed(2);
  $('#lateralValue').textContent = (state.lateralSpeed * knot).toFixed(2);
  $('#headingValue').textContent = ((state.heading * 180 / Math.PI + 360) % 360).toFixed(0).padStart(3, '0');
  $('#yawValue').textContent = state.yawRateDeg.toFixed(1);
  $('#timeValue').textContent = formatTime(state.time);
  const overloaded = (state.lineResults || []).some((line) => line.overloaded);
  const warning = $('#warning');
  if (state.collision) {
    warning.hidden = false;
    warning.textContent = 'Dock contact detected — simplified fender response applied';
  } else if (overloaded) {
    warning.hidden = false;
    warning.textContent = 'Line working load exceeded';
  } else {
    warning.hidden = true;
  }
  renderLineList();
  updateGuidance();
}

function renderLineList() {
  const container = $('#lineList');
  const resultMap = new Map((state.lineResults || []).map((result) => [result.id, result]));
  if (!lines.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-lines';
    empty.textContent = 'No lines connected. The boat is free.';
    container.replaceChildren(empty);
    return;
  }
  container.replaceChildren(...lines.map((line) => {
    const result = resultMap.get(line.id);
    const item = document.createElement('div');
    item.className = `line-item${result?.overloaded ? ' overload' : ''}`;
    item.dataset.lineId = line.id;
    const dot = document.createElement('i'); dot.style.background = line.color;
    const text = document.createElement('div');
    const tension = result ? `${(result.tension / 1000).toFixed(1)} kN` : '0.0 kN';
    const title = document.createElement('strong');
    title.textContent = `${BOAT_PRESET.cleats[line.boatCleat].label} ${line.boatSide || 'port'} → ${line.dockCleat}`;
    const detail = document.createElement('span');
    detail.textContent = `${tension} · ${line.restLength.toFixed(1)} m`;
    text.append(title, detail);
    const remove = document.createElement('button'); remove.type = 'button'; remove.ariaLabel = `Release ${line.id}`; remove.textContent = '×';
    remove.addEventListener('click', () => { lines = lines.filter((entry) => entry.id !== line.id); renderLineList(); updateGuidance(); });
    item.append(dot, text, remove);
    return item;
  }));
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  const widthScale = Math.max(27, Math.min(48, rect.width / 19));
  const scale = berthMode === 'alongside'
    ? widthScale
    : Math.max(24, Math.min(38, widthScale, (rect.height - 145) / 11));
  const dockEdge = berthMode === 'alongside'
    ? Math.max(175, Math.min(235, rect.height * 0.34))
    : Math.max(105, Math.min(145, rect.height * 0.25));
  view = {
    width: rect.width,
    height: rect.height,
    dpr,
    scale,
    originX: rect.width * 0.49,
    originY: dockEdge - (dockY + 0.18) * scale,
  };
}

function toScreen(point) {
  return { x: view.originX + point.x * view.scale, y: view.originY + point.y * view.scale };
}

function toWorld(point) {
  return { x: (point.x - view.originX) / view.scale, y: (point.y - view.originY) / view.scale };
}

function drawWater() {
  ctx.fillStyle = '#071b24'; ctx.fillRect(0, 0, view.width, view.height);
  ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(94,157,166,.08)';
  const grid = view.scale;
  for (let x = view.originX % grid; x < view.width; x += grid) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, view.height); ctx.stroke(); }
  for (let y = view.originY % grid; y < view.height; y += grid) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(view.width, y); ctx.stroke(); }
  for (let i = 0; i < 7; i += 1) {
    const y = view.height * (0.55 + i * 0.065);
    ctx.strokeStyle = `rgba(76,201,231,${0.025 + i * 0.006})`;
    ctx.beginPath();
    for (let x = 0; x <= view.width; x += 12) {
      const wave = Math.sin(x * 0.025 + i * 1.7 + state.time * 0.25) * 2.5;
      if (x === 0) ctx.moveTo(x, y + wave); else ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }
}

function drawDock() {
  const edge = toScreen({ x: 0, y: dockY + 0.18 }).y;
  const gradient = ctx.createLinearGradient(0, 0, 0, edge);
  gradient.addColorStop(0, '#49392b'); gradient.addColorStop(1, '#8b6648');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, view.width, edge);
  ctx.strokeStyle = '#c79b69'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, edge); ctx.lineTo(view.width, edge); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,230,190,.1)'; ctx.lineWidth = 1;
  for (let x = -10; x < 15; x += 1.2) { const sx = toScreen({ x, y: 0 }).x; ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx - 38, edge); ctx.stroke(); }
  for (const cleat of dockCleats) {
    const p = toScreen(cleat);
    ctx.fillStyle = '#172229'; ctx.strokeStyle = '#efc58c'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(p.x - 10, p.y - 6, 20, 9, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f2d6aa'; ctx.font = '500 9px DM Mono, monospace'; ctx.textAlign = 'center'; ctx.fillText(cleat.id, p.x, p.y - 12);
  }
}

function drawTrail() {
  if (trail.length < 2) return;
  ctx.strokeStyle = 'rgba(112,224,187,.22)'; ctx.lineWidth = 2; ctx.setLineDash([2, 7]); ctx.beginPath();
  trail.forEach((point, index) => { const p = toScreen(point); if (index === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
  ctx.stroke(); ctx.setLineDash([]);
}

function transformBoatPoint(local) {
  const c = Math.cos(state.heading); const s = Math.sin(state.heading);
  return toScreen({ x: state.x + local.x * c - local.y * s, y: state.y + local.x * s + local.y * c });
}

function drawBoat() {
  const shape = [{ x: 4.88, y: 0 }, { x: 3.7, y: 1.25 }, { x: -3.9, y: 1.55 }, { x: -4.8, y: 1.15 }, { x: -4.8, y: -1.15 }, { x: -3.9, y: -1.55 }, { x: 3.7, y: -1.25 }];
  const points = shape.map(transformBoatPoint);
  const gradient = ctx.createLinearGradient(points[0].x, points[0].y, points[3].x, points[3].y);
  gradient.addColorStop(0, '#f4f1df'); gradient.addColorStop(1, '#b9c8c5');
  ctx.fillStyle = gradient; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 16;
  ctx.beginPath(); points.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y)); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
  const centerlineA = transformBoatPoint({ x: -4.2, y: 0 }); const centerlineB = transformBoatPoint({ x: 4.35, y: 0 });
  ctx.strokeStyle = 'rgba(9,39,46,.45)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(centerlineA.x, centerlineA.y); ctx.lineTo(centerlineB.x, centerlineB.y); ctx.stroke();
  const bow = transformBoatPoint({ x: 4.15, y: 0 });
  ctx.fillStyle = '#0a3840'; ctx.font = '700 9px Manrope'; ctx.textAlign = 'center'; ctx.fillText('BOW', bow.x, bow.y + 3);
  const saildrive = transformBoatPoint({ x: -1.25, y: 0 });
  ctx.fillStyle = '#173f46'; ctx.beginPath(); ctx.arc(saildrive.x, saildrive.y, 5, 0, Math.PI * 2); ctx.fill();
  const rudderAngle = Number(controls.rudder.value) * Math.PI / 180;
  const rudderA = transformBoatPoint({ x: -4.2, y: 0 });
  const rudderB = transformBoatPoint({ x: -5.0, y: Math.sin(rudderAngle) * 1.0 });
  ctx.strokeStyle = '#ffbb55'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(rudderA.x, rudderA.y); ctx.lineTo(rudderB.x, rudderB.y); ctx.stroke();
  for (const [name, cleat] of Object.entries(BOAT_PRESET.cleats)) {
    for (const side of [-1, 1]) {
      const point = transformBoatPoint({ x: cleat.x, y: Math.abs(cleat.y) * side });
      ctx.fillStyle = '#071b24'; ctx.strokeStyle = side < 0 ? '#70e0bb' : '#4cc9e7'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(point.x, point.y, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#15353c'; ctx.font = '600 8px Manrope'; ctx.fillText(name[0].toUpperCase(), point.x, point.y + 3);
    }
  }
}

function drawLines() {
  const resultMap = new Map((state.lineResults || []).map((result) => [result.id, result]));
  for (const line of lines) {
    const a = toScreen(boatPointToWorld(state, line.boatPoint || BOAT_PRESET.cleats[line.boatCleat]));
    const b = toScreen(line.dockPoint);
    const result = resultMap.get(line.id);
    ctx.strokeStyle = result?.overloaded ? '#ff6e66' : line.color; ctx.lineWidth = result?.tension > 10 ? 2.5 : 1.6;
    ctx.setLineDash(result?.tension > 10 ? [] : [6, 5]); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.setLineDash([]);
    const mx = (a.x + b.x) / 2; const my = (a.y + b.y) / 2;
    ctx.fillStyle = '#06151d'; ctx.beginPath(); ctx.roundRect(mx - 18, my - 8, 36, 16, 4); ctx.fill();
    ctx.fillStyle = line.color; ctx.font = '500 8px DM Mono'; ctx.textAlign = 'center'; ctx.fillText(result ? `${(result.tension / 1000).toFixed(1)}kN` : line.id, mx, my + 3);
  }
}

function drawArrow(fromWorld, force, color, label) {
  const magnitude = Math.hypot(force.x, force.y);
  if (magnitude < 25) return;
  const start = toScreen(fromWorld);
  const length = Math.min(74, 15 + Math.log10(magnitude) * 14);
  const angle = Math.atan2(force.y, force.x);
  const end = { x: start.x + Math.cos(angle) * length, y: start.y + Math.sin(angle) * length };
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(end.x, end.y); ctx.lineTo(end.x - Math.cos(angle - .45) * 8, end.y - Math.sin(angle - .45) * 8); ctx.lineTo(end.x - Math.cos(angle + .45) * 8, end.y - Math.sin(angle + .45) * 8); ctx.closePath(); ctx.fill();
  ctx.font = '500 8px DM Mono'; ctx.textAlign = 'left'; ctx.fillText(label, end.x + 5, end.y - 4);
}

function drawForces() {
  if (!analysis) return;
  const forceSet = computeForces(state, currentControls());
  const palette = { 'Engine thrust': '#70e0bb', 'Port prop walk': '#ffbb55', 'Starboard prop walk': '#ffbb55', Rudder: '#ff8f6b', Wind: '#a88cff', 'Hull resistance': '#6d9299' };
  for (const record of forceSet.records) {
    if (record.name.startsWith('Line')) continue;
    drawArrow(record.point, record.force, palette[record.name] || '#d6e0df', record.name);
  }
  const wind = currentControls().wind;
  const current = currentControls().current;
  if (wind.speed > 0) drawArrow({ x: -7, y: 4.3 }, { x: Math.cos(wind.directionDeg * Math.PI / 180) * 200, y: Math.sin(wind.directionDeg * Math.PI / 180) * 200 }, '#a88cff', 'Wind →');
  if (current.speed > 0) drawArrow({ x: -7, y: 5.3 }, { x: Math.cos(current.directionDeg * Math.PI / 180) * 200, y: Math.sin(current.directionDeg * Math.PI / 180) * 200 }, '#4cc9e7', 'Current →');
}

function render() {
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  ctx.clearRect(0, 0, view.width, view.height);
  drawWater(); drawDock(); drawTrail(); drawLines(); drawBoat(); drawForces();
}

function tick(now) {
  const elapsed = Math.min(0.1, (now - lastFrame) / 1000);
  lastFrame = now;
  if (running) {
    accumulator += elapsed * Number(controls.simSpeed.value);
    while (accumulator >= 1 / 60) {
      state = stepSimulation(state, currentControls(), 1 / 60);
      accumulator -= 1 / 60;
    }
    if (!trail.length || distance(trail[trail.length - 1], state) > 0.08) {
      trail.push({ x: state.x, y: state.y }); if (trail.length > 260) trail.shift();
    }
    updateOutputs();
  }
  render();
  requestAnimationFrame(tick);
}

$$('[data-engine]').forEach((button) => button.addEventListener('click', () => setEngine(button.dataset.engine)));
$$('[data-prop-walk-direction]').forEach((button) => button.addEventListener('click', () => setPropWalkDirection(button.dataset.propWalkDirection)));
$$('[data-berth]').forEach((button) => button.addEventListener('click', () => setBerthMode(button.dataset.berth)));
$$('[data-preset]').forEach((button) => button.addEventListener('click', () => applyPreset(button.dataset.preset)));
Object.values(controls).forEach((element) => element.addEventListener('input', () => { updateRangeOutputs(); updateGuidance(); }));
$('#lineSlack').addEventListener('input', updateRangeOutputs);
$('#addLine').addEventListener('click', () => {
  lines.push(makeLine($('#boatCleat').value, $('#dockCleat').value, Number($('#lineSlack').value), $('#boatSide').value));
  $$('.preset').forEach((button) => button.classList.remove('active'));
  renderLineList();
  updateGuidance();
});
$('#playPause').addEventListener('click', () => {
  running = !running;
  $('#playPause').textContent = running ? 'Ⅱ Pause' : '▶ Run';
});
$('#step').addEventListener('click', () => {
  running = false; $('#playPause').textContent = '▶ Run';
  state = stepSimulation(state, currentControls(), 0.05); updateOutputs();
});
$('#reset').addEventListener('click', resetBoat);
$('#analysisToggle').addEventListener('click', () => {
  analysis = !analysis; $('#analysisToggle').ariaPressed = String(analysis); $('#analysisToggle').textContent = `Analysis ${analysis ? 'on' : 'off'}`;
});
$('#saveScenario').addEventListener('click', () => {
  const scenario = { name: $('#scenarioName').value || 'Saved departure', state: clone(state), controls: { ...currentControls(), lines: undefined }, lines: clone(lines) };
  localStorage.setItem('dockwise-scenario', serializeScenario(scenario));
  $('#saveStatus').textContent = `Saved “${scenario.name}”.`;
});
$('#loadScenario').addEventListener('click', () => {
  const saved = localStorage.getItem('dockwise-scenario');
  if (!saved) { $('#saveStatus').textContent = 'No saved scenario yet.'; return; }
  try {
    const scenario = deserializeScenario(saved);
    const c = scenario.controls || {};
    berthMode = ['alongside', 'bow-to', 'stern-to'].includes(c.berthMode) ? c.berthMode : 'alongside';
    state = createInitialState(scenario.state); lines = scenario.lines || [];
    lineCounter = lines.reduce((max, line) => Math.max(max, typeof line.id === 'string' ? Number(line.id.slice(1)) || 0 : 0), 0);
    $$('[data-berth]').forEach((button) => button.classList.toggle('active', button.dataset.berth === berthMode));
    setEngine(c.engine || 0);
    if (Number.isFinite(c.throttle)) controls.throttle.value = c.throttle * 100;
    if (Number.isFinite(c.rudderDeg)) controls.rudder.value = c.rudderDeg;
    if (Number.isFinite(c.propWalk)) {
      controls.propWalk.value = Math.abs(c.propWalk) * 100;
      setPropWalkDirection(Math.sign(c.propWalk));
    }
    if (c.wind) { controls.windSpeed.value = c.wind.speed; controls.windDirection.value = c.wind.directionDeg; }
    if (c.current) { controls.currentSpeed.value = c.current.speed; controls.currentDirection.value = c.current.directionDeg; }
    $('#scenarioName').value = scenario.name || 'Loaded departure';
    running = false; $('#playPause').textContent = '▶ Run'; resizeCanvas(); updateRangeOutputs(); updateOutputs();
    $('#saveStatus').textContent = `Loaded “${scenario.name}”.`;
  } catch { $('#saveStatus').textContent = 'Saved scenario is invalid.'; }
});

canvas.addEventListener('pointerdown', (event) => {
  if (running) return;
  const rect = canvas.getBoundingClientRect();
  const world = toWorld({ x: event.clientX - rect.left, y: event.clientY - rect.top });
  if (distance(world, state) < BOAT_PRESET.length * 0.55) { dragging = true; canvas.setPointerCapture(event.pointerId); }
});
canvas.addEventListener('pointermove', (event) => {
  if (!dragging || running) return;
  const rect = canvas.getBoundingClientRect();
  const world = toWorld({ x: event.clientX - rect.left, y: event.clientY - rect.top });
  const hullExtent = Math.abs(Math.sin(state.heading)) * BOAT_PRESET.length * 0.5
    + Math.abs(Math.cos(state.heading)) * BOAT_PRESET.beam * 0.5;
  state = createInitialState({ x: world.x, y: Math.max(dockY + 0.18 + hullExtent + 0.2, world.y), heading: state.heading });
  trail = []; updateOutputs();
});
canvas.addEventListener('pointerup', () => { dragging = false; });
window.addEventListener('resize', resizeCanvas);

window.__dockwise = {
  getState: () => clone(state),
  getLines: () => clone(lines),
  getBerthMode: () => berthMode,
  setBerthMode,
  setEngine,
  setPropWalkDirection,
  applyPreset,
  step: (seconds = 0.05) => { state = stepSimulation(state, currentControls(), seconds); updateOutputs(); return clone(state); },
};

resizeCanvas(); updateRangeOutputs(); applyPreset('aft-spring'); requestAnimationFrame(tick);
