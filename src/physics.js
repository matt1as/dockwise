export const BOAT_PRESET = Object.freeze({
  name: '32 ft fin-keel S-drive',
  lengthFt: 32,
  length: 9.7536,
  beam: 3.2,
  mass: 5200,
  inertia: 52000,
  // Default mooring lines are treated as low-stretch yacht lines. Individual
  // scenarios may override stiffness/damping when modelling softer rope.
  lineStiffness: 14000,
  lineDamping: 9000,
  lineMaxLoad: 9000,
  propWalkDirection: 'port',
  cleats: Object.freeze({
    aft: Object.freeze({ x: -4.05, y: -1.25, label: 'Aft' }),
    middle: Object.freeze({ x: 0, y: -1.48, label: 'Middle' }),
    forward: Object.freeze({ x: 3.85, y: -1.15, label: 'Forward' }),
  }),
});

const EPSILON = 1e-9;
const DEG = Math.PI / 180;

export function createInitialState(overrides = {}) {
  return {
    x: 0,
    y: 0,
    heading: 0,
    vx: 0,
    vy: 0,
    omega: 0,
    time: 0,
    collision: false,
    speed: 0,
    lateralSpeed: 0,
    yawRateDeg: 0,
    ...overrides,
  };
}

export function createBerthState(mode = 'alongside', dockBoundaryY = -3.47, gap = 0.65) {
  const headings = { alongside: 0, 'bow-to': -Math.PI / 2, 'stern-to': Math.PI / 2 };
  if (!Object.hasOwn(headings, mode)) throw new Error(`Unsupported berth mode: ${mode}`);
  const heading = headings[mode];
  if (mode === 'alongside') return createInitialState({ heading });
  const halfLength = BOAT_PRESET.length * 0.5;
  const halfBeam = BOAT_PRESET.beam * 0.5;
  const hullExtent = Math.abs(Math.sin(heading)) * halfLength + Math.abs(Math.cos(heading)) * halfBeam;
  return createInitialState({ y: dockBoundaryY + hullExtent + Math.max(0.1, Number(gap) || 0.65), heading });
}

export function rotate(point, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: point.x * c - point.y * s, y: point.x * s + point.y * c };
}

export function boatPointToWorld(state, localPoint) {
  const rotated = rotate(localPoint, state.heading);
  return { x: state.x + rotated.x, y: state.y + rotated.y };
}

export function worldToBoatVector(vector, heading) {
  return rotate(vector, -heading);
}

function add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y };
}

function subtract(a, b) {
  return { x: a.x - b.x, y: a.y - b.y };
}

function scale(v, amount) {
  return { x: v.x * amount, y: v.y * amount };
}

function magnitude(v) {
  return Math.hypot(v.x, v.y);
}

function cross(a, b) {
  return a.x * b.y - a.y * b.x;
}

function vectorFromDirection(speed, directionDeg) {
  const angle = Number(directionDeg || 0) * DEG;
  return { x: Number(speed || 0) * Math.cos(angle), y: Number(speed || 0) * Math.sin(angle) };
}

function velocityAtPoint(state, worldOffset) {
  return {
    x: state.vx - state.omega * worldOffset.y,
    y: state.vy + state.omega * worldOffset.x,
  };
}

export function computeLineForce(boatPoint, dockPoint, line, boatPointVelocity = { x: 0, y: 0 }) {
  const delta = subtract(dockPoint, boatPoint);
  const distance = magnitude(delta);
  const restLength = Math.max(0, Number(line.restLength ?? distance));
  const stretch = distance - restLength;

  if (stretch <= 0 || distance < EPSILON) {
    return { force: { x: 0, y: 0 }, tension: 0, stretch: Math.max(0, stretch), overloaded: false };
  }

  const direction = scale(delta, 1 / distance);
  const separatingSpeed = -(boatPointVelocity.x * direction.x + boatPointVelocity.y * direction.y);
  const elastic = Math.max(0, Number(line.stiffness ?? BOAT_PRESET.lineStiffness)) * stretch;
  const damping = Math.max(0, Number(line.damping ?? BOAT_PRESET.lineDamping)) * Math.max(0, separatingSpeed);
  const tension = Math.max(0, elastic + damping);
  const maxLoad = Math.max(0, Number(line.maxLoad ?? BOAT_PRESET.lineMaxLoad));

  return {
    force: scale(direction, tension),
    tension,
    stretch,
    overloaded: maxLoad > 0 && tension > maxLoad,
  };
}

function forceRecord(name, force, point, extra = {}) {
  return { name, force, point, ...extra };
}

export function computeForces(state, controls = {}) {
  const engine = Math.max(-1, Math.min(1, Number(controls.engine || 0)));
  const throttle = Math.max(0, Math.min(1, Number(controls.throttle || 0)));
  const rudderDeg = Math.max(-40, Math.min(40, Number(controls.rudderDeg || 0)));
  const propWalk = Math.max(-2, Math.min(2, Number(controls.propWalk ?? 0.65)));
  const records = [];
  const lineResults = [];
  let totalForce = { x: 0, y: 0 };
  let totalTorque = 0;

  const apply = (name, localPoint, localForce, extra = {}) => {
    const worldOffset = rotate(localPoint, state.heading);
    const worldForce = rotate(localForce, state.heading);
    totalForce = add(totalForce, worldForce);
    totalTorque += cross(worldOffset, worldForce);
    records.push(forceRecord(name, worldForce, add({ x: state.x, y: state.y }, worldOffset), extra));
  };

  if (engine !== 0 && throttle > 0) {
    const thrust = engine * throttle * 3400;
    apply('Engine thrust', { x: -1.25, y: 0 }, { x: thrust, y: 0 });
    if (engine < 0 && Math.abs(propWalk) > 0) {
      const direction = propWalk > 0 ? 'Port' : 'Starboard';
      apply(`${direction} prop walk`, { x: -1.25, y: 0 }, { x: 0, y: -1100 * throttle * propWalk });
    }
  }

  const current = vectorFromDirection(controls.current?.speed, controls.current?.directionDeg);
  const waterVelocityWorld = subtract({ x: state.vx, y: state.vy }, current);
  const waterVelocityLocal = worldToBoatVector(waterVelocityWorld, state.heading);

  const rudderFlow = waterVelocityLocal.x + engine * throttle * 0.8;
  if (Math.abs(rudderDeg) > EPSILON && Math.abs(rudderFlow) > 0.04) {
    const flow = rudderFlow;
    const rudderForce = Math.sign(flow || 1) * Math.abs(flow) * Math.abs(flow) * Math.sin(rudderDeg * DEG) * 1200;
    apply('Rudder', { x: -4.15, y: 0 }, { x: 0, y: rudderForce });
  }

  const localDrag = {
    x: -waterVelocityLocal.x * Math.abs(waterVelocityLocal.x) * 850,
    y: -waterVelocityLocal.y * Math.abs(waterVelocityLocal.y) * 4200,
  };
  apply('Hull resistance', { x: 0, y: 0 }, localDrag);

  const wind = vectorFromDirection(controls.wind?.speed, controls.wind?.directionDeg);
  const apparentWind = subtract(wind, { x: state.vx, y: state.vy });
  const localWind = worldToBoatVector(apparentWind, state.heading);
  const windForce = { x: localWind.x * Math.abs(localWind.x) * 22, y: localWind.y * Math.abs(localWind.y) * 62 };
  apply('Wind', { x: 0.4, y: 0 }, windForce);

  totalTorque += -state.omega * Math.abs(state.omega) * 105000;

  for (const line of controls.lines || []) {
    if (!line.active) continue;
    const localPoint = line.boatPoint || BOAT_PRESET.cleats[line.boatCleat];
    if (!localPoint || !line.dockPoint) continue;
    const boatPoint = boatPointToWorld(state, localPoint);
    const worldOffset = subtract(boatPoint, { x: state.x, y: state.y });
    const result = computeLineForce(boatPoint, line.dockPoint, line, velocityAtPoint(state, worldOffset));
    totalForce = add(totalForce, result.force);
    totalTorque += cross(worldOffset, result.force);
    const record = {
      ...result,
      id: line.id,
      boatCleat: line.boatCleat,
      dockPoint: line.dockPoint,
      boatPoint,
    };
    lineResults.push(record);
    records.push(forceRecord(`Line ${line.id}`, result.force, boatPoint, { tension: result.tension, overloaded: result.overloaded }));
  }

  return { force: totalForce, torque: totalTorque, records, lines: lineResults };
}

export function stepSimulation(state, controls, dt = 1 / 60) {
  const safeDt = Math.max(0.001, Math.min(0.1, Number(dt) || 1 / 60));
  const { force, torque, records, lines } = computeForces(state, controls);
  const mass = Number(controls.mass || BOAT_PRESET.mass);
  const inertia = Number(controls.inertia || BOAT_PRESET.inertia);

  let vx = state.vx + (force.x / mass) * safeDt;
  let vy = state.vy + (force.y / mass) * safeDt;
  let omega = state.omega + (torque / inertia) * safeDt;
  let x = state.x + vx * safeDt;
  let y = state.y + vy * safeDt;
  let heading = state.heading + omega * safeDt;
  let collision = false;

  const dockBoundaryY = Number(controls.dockBoundaryY);
  if (Number.isFinite(dockBoundaryY)) {
    const halfLength = BOAT_PRESET.length * 0.5;
    const halfBeam = BOAT_PRESET.beam * 0.5;
    const portExtent = Math.abs(Math.sin(heading)) * halfLength + Math.abs(Math.cos(heading)) * halfBeam;
    const portClearance = y - portExtent;
    if (portClearance < dockBoundaryY) {
      y += dockBoundaryY - portClearance;
      if (vy < 0) vy *= -0.12;
      omega *= 0.7;
      collision = true;
    }
  }

  heading = Math.atan2(Math.sin(heading), Math.cos(heading));
  const localVelocity = worldToBoatVector({ x: vx, y: vy }, heading);
  return {
    ...state,
    x,
    y,
    heading,
    vx,
    vy,
    omega,
    time: state.time + safeDt,
    collision,
    speed: Math.hypot(vx, vy),
    lateralSpeed: localVelocity.y,
    yawRateDeg: omega / DEG,
    forces: records,
    lineResults: lines,
  };
}

function allFinite(value) {
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(allFinite);
  if (value && typeof value === 'object') return Object.values(value).every(allFinite);
  return true;
}

export function serializeScenario(scenario) {
  if (!scenario || typeof scenario !== 'object' || !allFinite(scenario)) throw new Error('Invalid scenario');
  return JSON.stringify(scenario);
}

export function deserializeScenario(serialized) {
  try {
    const parsed = JSON.parse(serialized);
    if (!parsed || typeof parsed !== 'object' || !parsed.state || !allFinite(parsed)) throw new Error('Invalid scenario');
    for (const key of ['x', 'y', 'heading']) {
      if (!Number.isFinite(parsed.state[key])) throw new Error('Invalid scenario');
    }
    for (const key of ['vx', 'vy', 'omega', 'time', 'speed', 'lateralSpeed', 'yawRateDeg']) {
      if (key in parsed.state && !Number.isFinite(parsed.state[key])) throw new Error('Invalid scenario');
    }
    if (parsed.lines !== undefined) {
      if (!Array.isArray(parsed.lines) || parsed.lines.length > 24) throw new Error('Invalid scenario');
      for (const line of parsed.lines) {
        const validBoatCleat = line && Object.hasOwn(BOAT_PRESET.cleats, line.boatCleat);
        const validDockCleat = typeof line?.dockCleat === 'string' && /^D[1-6]$/.test(line.dockCleat);
        const validDockPoint = line?.dockPoint && Number.isFinite(line.dockPoint.x) && Number.isFinite(line.dockPoint.y);
        const validBoatPoint = line?.boatPoint === undefined
          || (Number.isFinite(line.boatPoint?.x) && Number.isFinite(line.boatPoint?.y));
        const validLength = Number.isFinite(line?.restLength) && line.restLength >= 0;
        if (!validBoatCleat || !validDockCleat || !validDockPoint || !validBoatPoint || !validLength) throw new Error('Invalid scenario');
      }
    }
    return parsed;
  } catch (error) {
    if (error.message === 'Invalid scenario') throw error;
    throw new Error('Invalid scenario');
  }
}
