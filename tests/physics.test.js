import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BOAT_PRESET,
  createInitialState,
  createBerthState,
  boatPointToWorld,
  computeLineForce,
  computeForces,
  stepSimulation,
  serializeScenario,
  deserializeScenario,
} from '../src/physics.js';

const near = (actual, expected, epsilon = 1e-6) =>
  assert.ok(Math.abs(actual - expected) <= epsilon, `${actual} not within ${epsilon} of ${expected}`);

test('32 ft preset has aft, middle, and forward cleats', () => {
  assert.equal(BOAT_PRESET.lengthFt, 32);
  assert.deepEqual(Object.keys(BOAT_PRESET.cleats), ['aft', 'middle', 'forward']);
  assert.equal(BOAT_PRESET.propWalkDirection, 'port');
});

test('berth states orient the boat alongside, bow-to, and stern-to', () => {
  const alongside = createBerthState('alongside');
  const bowTo = createBerthState('bow-to');
  const sternTo = createBerthState('stern-to');
  near(alongside.heading, 0);
  near(bowTo.heading, -Math.PI / 2);
  near(sternTo.heading, Math.PI / 2);
});

test('end-on berth states start clear of the dock boundary', () => {
  const boundary = -3.47;
  for (const mode of ['bow-to', 'stern-to']) {
    const state = createBerthState(mode, boundary, 0.65);
    const hullExtent = Math.abs(Math.sin(state.heading)) * BOAT_PRESET.length * 0.5
      + Math.abs(Math.cos(state.heading)) * BOAT_PRESET.beam * 0.5;
    near(state.y - hullExtent, boundary + 0.65);
  }
});

test('boat attachment point rotates into world coordinates', () => {
  const state = createInitialState({ x: 10, y: 20, heading: Math.PI / 2 });
  const point = boatPointToWorld(state, { x: 2, y: 0 });
  near(point.x, 10);
  near(point.y, 22);
});

test('a slack line produces no force', () => {
  const result = computeLineForce(
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { restLength: 3, stiffness: 20, damping: 1, maxLoad: 100 },
    { x: 0, y: 0 }
  );
  near(result.tension, 0);
  assert.deepEqual(result.force, { x: 0, y: 0 });
});

test('default mooring lines use the stiff boat preset', () => {
  assert.ok(BOAT_PRESET.lineStiffness > 3500);
  const result = computeLineForce(
    { x: 0, y: 0 },
    { x: 3, y: 0 },
    { restLength: 2, damping: 0, maxLoad: 100000 },
    { x: 0, y: 0 }
  );
  near(result.tension, BOAT_PRESET.lineStiffness);
});

test('line stiffness remains configurable per line', () => {
  const result = computeLineForce(
    { x: 0, y: 0 },
    { x: 3, y: 0 },
    { restLength: 2, stiffness: 100, damping: 0, maxLoad: 100000 },
    { x: 0, y: 0 }
  );
  near(result.tension, 100);
});

test('a taut line pulls toward the dock cleat and reports overload', () => {
  const result = computeLineForce(
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { restLength: 2, stiffness: 20, damping: 0, maxLoad: 30 },
    { x: 0, y: 0 }
  );
  near(result.force.x, 40);
  near(result.force.y, 0);
  near(result.tension, 40);
  assert.equal(result.overloaded, true);
});

test('a forward spring line attached aft creates a predictable yaw moment', () => {
  const state = createInitialState({ x: 0, y: 0, heading: 0 });
  const line = {
    id: 'spring', active: true, boatCleat: 'aft', dockPoint: { x: 1, y: -3 },
    restLength: 1, stiffness: 10, damping: 0, maxLoad: 1000,
  };
  const forces = computeForces(state, { lines: [line], engine: 0, throttle: 0, rudderDeg: 0, wind: { speed: 0, directionDeg: 0 }, current: { speed: 0, directionDeg: 0 } });
  assert.ok(forces.torque > 0, `expected positive yaw torque, got ${forces.torque}`);
  assert.ok(forces.lines[0].tension > 0);
});

test('mirrored end-on lines use their explicit boat-side attachment points', () => {
  const state = createBerthState('bow-to');
  const forward = BOAT_PRESET.cleats.forward;
  const lines = [
    { id: 'port', active: true, boatCleat: 'forward', boatPoint: { x: forward.x, y: -Math.abs(forward.y) }, dockPoint: { x: 1.5, y: -3.65 }, restLength: 0, stiffness: 10, damping: 0, maxLoad: 1000 },
    { id: 'starboard', active: true, boatCleat: 'forward', boatPoint: { x: forward.x, y: Math.abs(forward.y) }, dockPoint: { x: -1.5, y: -3.65 }, restLength: 0, stiffness: 10, damping: 0, maxLoad: 1000 },
  ];
  const forces = computeForces(state, { lines, engine: 0, throttle: 0, rudderDeg: 0, wind: { speed: 0, directionDeg: 0 }, current: { speed: 0, directionDeg: 0 } });
  near(forces.torque, 0, 1e-6);
  near(forces.lines[0].tension, forces.lines[1].tension, 1e-6);
});

test('reverse thrust adds port-side prop walk', () => {
  const state = createInitialState({ x: 0, y: 0, heading: 0 });
  const forces = computeForces(state, { lines: [], engine: -1, throttle: 1, rudderDeg: 0, propWalk: 1, wind: { speed: 0, directionDeg: 0 }, current: { speed: 0, directionDeg: 0 } });
  assert.ok(forces.force.x < 0, 'reverse thrust should push astern');
  assert.ok(forces.force.y < 0, 'port prop walk should push toward local port');
});

test('negative prop-walk setting reverses the effect toward starboard', () => {
  const state = createInitialState({ x: 0, y: 0, heading: 0 });
  const forces = computeForces(state, { lines: [], engine: -1, throttle: 1, rudderDeg: 0, propWalk: -1, wind: { speed: 0, directionDeg: 0 }, current: { speed: 0, directionDeg: 0 } });
  assert.ok(forces.force.x < 0, 'reverse thrust should still push astern');
  assert.ok(forces.force.y > 0, 'negative prop walk should push toward local starboard');
  assert.ok(forces.records.some((record) => record.name === 'Starboard prop walk'));
});

test('rudder creates opposite lateral force for opposite helm angles when moving ahead', () => {
  const portHelm = createInitialState({ vx: 1 });
  const starboardHelm = createInitialState({ vx: 1 });
  const base = { lines: [], engine: 0, throttle: 0, propWalk: 1, wind: { speed: 0, directionDeg: 0 }, current: { speed: 0, directionDeg: 0 } };
  const left = computeForces(portHelm, { ...base, rudderDeg: -25 });
  const right = computeForces(starboardHelm, { ...base, rudderDeg: 25 });
  assert.ok(left.force.y < 0);
  assert.ok(right.force.y > 0);
});

test('rudder receives prop wash at rest when the engine is ahead', () => {
  const state = createInitialState();
  const forces = computeForces(state, {
    lines: [], engine: 1, throttle: 0.7, rudderDeg: 25,
    wind: { speed: 0, directionDeg: 0 }, current: { speed: 0, directionDeg: 0 },
  });
  const rudder = forces.records.find((record) => record.name === 'Rudder');
  assert.ok(rudder, 'expected a rudder force from prop wash');
  assert.ok(Math.abs(rudder.force.y) > 0);
});

test('fixed simulation step changes position and returns finite telemetry', () => {
  const state = createInitialState();
  const next = stepSimulation(state, { lines: [], engine: 1, throttle: 0.6, rudderDeg: 0, propWalk: 1, wind: { speed: 0, directionDeg: 0 }, current: { speed: 0, directionDeg: 0 } }, 0.05);
  assert.ok(next.x > state.x);
  assert.ok(Number.isFinite(next.speed));
  assert.ok(Number.isFinite(next.yawRateDeg));
});

test('rotated bow contact is detected against the dock boundary', () => {
  const state = createInitialState({ y: 1, heading: Math.PI / 2 });
  const next = stepSimulation(state, {
    lines: [], engine: 0, throttle: 0, rudderDeg: 0,
    wind: { speed: 0, directionDeg: 0 }, current: { speed: 0, directionDeg: 0 },
    dockBoundaryY: -3.47,
  }, 0.01);
  assert.equal(next.collision, true);
});

test('scenario serialization round-trips finite setup data', () => {
  const scenario = {
    name: 'Aft spring',
    state: createInitialState({ heading: 0.2 }),
    controls: { engine: -1, throttle: 0.4 },
    lines: [{
      id: 'L1', active: true, boatCleat: 'aft', dockCleat: 'D4',
      dockPoint: { x: 1.5, y: -3.65 }, restLength: 6, stiffness: 3600,
      damping: 800, maxLoad: 9000, color: '#4cc9e7',
    }],
  };
  const restored = deserializeScenario(serializeScenario(scenario));
  assert.deepEqual(restored, scenario);
  assert.throws(() => deserializeScenario('{"state":{"x":"bad"}}'), /Invalid scenario/);
});

test('scenario deserialization rejects unsupported cleat identifiers', () => {
  const scenario = {
    state: createInitialState(),
    lines: [{
      id: 'L1', active: true, boatCleat: '<img src=x onerror=alert(1)>', dockCleat: 'D4',
      dockPoint: { x: 1.5, y: -3.65 }, restLength: 6,
    }],
  };
  assert.throws(() => deserializeScenario(JSON.stringify(scenario)), /Invalid scenario/);
});

test('scenario deserialization rejects non-numeric velocity state', () => {
  const scenario = { state: createInitialState({ vx: 'bad' }), lines: [] };
  assert.throws(() => deserializeScenario(JSON.stringify(scenario)), /Invalid scenario/);
});
