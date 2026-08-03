const BERTH_MODES = new Set(['alongside', 'bow-to', 'stern-to']);
const PRESETS = new Set(['clear', 'aft-spring', 'mid-spring', 'four-lines']);
const BOAT_CLEATS = new Set(['aft', 'middle', 'forward']);
const DOCK_CLEAT = /^D[1-6]$/;

const setups = {
  momentum: { berthMode: 'alongside', preset: 'clear', state: { x: -4, y: 2.8, heading: 0 }, controls: { engine: 0, throttle: 0.35, rudderDeg: 0, propWalk: 0.65 }, wind: { speed: 0, directionDeg: 0 }, current: { speed: 0, directionDeg: 0 } },
  rudder: { berthMode: 'alongside', preset: 'clear', state: { x: -3, y: 3, heading: 0 }, controls: { engine: 0, throttle: 0.4, rudderDeg: 0, propWalk: 0.65 }, wind: { speed: 0, directionDeg: 0 }, current: { speed: 0, directionDeg: 0 } },
  reverse: { berthMode: 'alongside', preset: 'clear', state: { x: 2, y: 3, heading: 0 }, controls: { engine: 0, throttle: 0.35, rudderDeg: 0, propWalk: 0.65 }, wind: { speed: 0, directionDeg: 0 }, current: { speed: 0, directionDeg: 0 } },
  pivot: { berthMode: 'alongside', preset: 'clear', state: { x: 0, y: 3, heading: 0 }, controls: { engine: 0, throttle: 0.4, rudderDeg: 0, propWalk: 0.65 }, wind: { speed: 0, directionDeg: 0 }, current: { speed: 0, directionDeg: 0 } },
  spring: { berthMode: 'alongside', preset: 'aft-spring', state: { x: 0, y: 0, heading: 0 }, controls: { engine: 0, throttle: 0.35, rudderDeg: 0, propWalk: 0.65 }, wind: { speed: 0, directionDeg: 0 }, current: { speed: 0, directionDeg: 0 } },
  wind: { berthMode: 'alongside', preset: 'aft-spring', state: { x: 0, y: 0, heading: 0 }, controls: { engine: 0, throttle: 0.4, rudderDeg: 0, propWalk: 0.65 }, wind: { speed: 5, directionDeg: 90 }, current: { speed: 0, directionDeg: 0 } },
  arrive: { berthMode: 'alongside', preset: 'clear', state: { x: -6, y: 2.5, heading: 0 }, controls: { engine: 0, throttle: 0.3, rudderDeg: 0, propWalk: 0.65 }, wind: { speed: 2, directionDeg: 270 }, current: { speed: 0, directionDeg: 0 } },
  bow: { berthMode: 'bow-to', preset: 'clear', state: { x: 0, y: 3, heading: -Math.PI / 2 }, controls: { engine: 0, throttle: 0.3, rudderDeg: 0, propWalk: 0.65 }, wind: { speed: 0, directionDeg: 0 }, current: { speed: 0, directionDeg: 0 }, lines: [{ boatCleat: 'forward', boatSide: 'port', dockCleat: 'D4', slackPercent: 4 }, { boatCleat: 'forward', boatSide: 'starboard', dockCleat: 'D3', slackPercent: 4 }] },
  stern: { berthMode: 'stern-to', preset: 'clear', state: { x: 0, y: 3, heading: Math.PI / 2 }, controls: { engine: 0, throttle: 0.3, rudderDeg: 0, propWalk: 0.65 }, wind: { speed: 0, directionDeg: 0 }, current: { speed: 0, directionDeg: 0 }, lines: [{ boatCleat: 'aft', boatSide: 'port', dockCleat: 'D4', slackPercent: 4 }, { boatCleat: 'aft', boatSide: 'starboard', dockCleat: 'D3', slackPercent: 4 }] },
  mixed: { berthMode: 'alongside', preset: 'clear', state: { x: -5, y: 3.5, heading: 0.12 }, controls: { engine: 0, throttle: 0.35, rudderDeg: 0, propWalk: 0.65 }, wind: { speed: 4, directionDeg: 235 }, current: { speed: 0.35, directionDeg: 320 } },
};

function lesson(id, order, title, briefing, setup, target, steps, hints, failure = {}) {
  return {
    id, order, title, durationLabel: order < 5 ? '2 min' : '3 min', briefing, steps,
    setup,
    success: { target, maxSpeed: order < 7 ? 0.3 : 0.2, stableFor: 1 },
    failure: { collision: true, maxLineLoad: 9000, maxDuration: 180, ...failure },
    hints,
  };
}

const catalog = [
  lesson('momentum-neutral', 1, 'Momentum and neutral', 'Build gentle headway, select neutral, and stop under control.', setups.momentum, { x: -2, y: 2.8, radius: 0.8, heading: 0, headingToleranceDeg: 12 }, ['Select Ahead below 45% throttle.', 'Return to Neutral before the target.', 'Settle without dock contact.'], ['Neutral removes thrust; it does not remove momentum.']),
  lesson('rudder-flow', 2, 'Rudder needs flow', 'Feel how rudder authority grows with headway and propeller wash.', setups.rudder, { x: -1.5, y: 3.4, radius: 1, heading: 0.2, headingToleranceDeg: 18 }, ['Try helm while neutral.', 'Use gentle Ahead and repeat.', 'Center the rudder as the bow turns.'], ['A rudder needs water flowing across it.']),
  lesson('reverse-prop-walk', 3, 'Reverse prop walk', 'Use a short astern pulse and observe the configured stern tendency.', setups.reverse, { x: 0.5, y: 2.5, radius: 1.2, heading: 0, headingToleranceDeg: 20 }, ['Select Astern.', 'Watch the sideways movement.', 'Return to Neutral and settle.'], ['A short pulse shows prop walk without building excess speed.']),
  lesson('controlled-pivot', 4, 'Controlled pivot', 'Rotate toward the target heading while remaining inside the safe area.', setups.pivot, { x: 0, y: 3, radius: 1.5, heading: Math.PI / 2, headingToleranceDeg: 15 }, ['Use low power and helm.', 'Counter the turn early.', 'Finish nearly stopped.'], ['Alternate short inputs instead of holding full power.']),
  lesson('aft-spring-departure', 5, 'Leave on aft spring', 'Use one aft spring to move the bow clear before releasing into open water.', setups.spring, { x: 2, y: 1.5, radius: 1.4, heading: 0.2, headingToleranceDeg: 22 }, ['Apply gentle Ahead against the spring.', 'Wait for the bow to open.', 'Release and leave slowly.'], ['The spring restrains the stern while thrust creates a turning moment.']),
  lesson('offshore-wind-departure', 6, 'Leave in offshore wind', 'Repeat the spring departure while an offshore wind moves the boat away.', setups.wind, { x: 2, y: 2.2, radius: 1.5, heading: 0.15, headingToleranceDeg: 24 }, ['Use the aft spring briefly.', 'Allow for wind drift.', 'Release before line load rises.'], ['The wind is assistance, not a reason to add speed.']),
  lesson('arrive-alongside', 7, 'Arrive alongside', 'Approach the target pose slowly and stop clear of dock contact.', setups.arrive, { x: 0, y: 0, radius: 1, heading: 0, headingToleranceDeg: 12 }, ['Approach below walking pace.', 'Select Neutral early.', 'Settle parallel to the dock.'], ['Accuracy comes from low momentum and early neutral.']),
  lesson('bow-to-control', 8, 'Bow-to control', 'Approach bow-to and stabilize with balanced forward lines.', setups.bow, { x: 0, y: 2, radius: 0.9, heading: -Math.PI / 2, headingToleranceDeg: 10 }, ['Approach bow first.', 'Use paired forward lines.', 'Settle with balanced load.'], ['Compare both line loads before adding power.']),
  lesson('stern-to-control', 9, 'Stern-to control', 'Reverse stern-to while controlling prop walk and paired aft lines.', setups.stern, { x: 0, y: 2, radius: 0.9, heading: Math.PI / 2, headingToleranceDeg: 10 }, ['Reverse in short pulses.', 'Counter sideways tendency early.', 'Stabilize on both aft lines.'], ['Pause in Neutral to see what momentum is doing.']),
  lesson('mixed-conditions', 10, 'Final mixed-conditions challenge', 'Plan an alongside arrival under combined wind and current without step-by-step prompts.', setups.mixed, { x: 0, y: 0, radius: 1.1, heading: 0, headingToleranceDeg: 14 }, ['Assess the force directions.', 'Choose a low-speed approach.', 'Finish stopped and clear.'], ['Watch the force arrows, then trust the process.']),
];

function assertFinite(value, path = 'setup') {
  if (typeof value === 'number' && !Number.isFinite(value)) throw new Error(`${path} values must be finite`);
  if (Array.isArray(value)) value.forEach((entry, index) => assertFinite(entry, `${path}[${index}]`));
  else if (value && typeof value === 'object') Object.entries(value).forEach(([key, entry]) => assertFinite(entry, `${path}.${key}`));
}

export function validateLesson(value) {
  if (!value || typeof value.id !== 'string' || !value.id.trim()) throw new Error('Lesson id is required');
  if (!BERTH_MODES.has(value.setup?.berthMode)) throw new Error('Invalid berth mode');
  if (!PRESETS.has(value.setup?.preset)) throw new Error('Invalid preset');
  assertFinite(value.setup);
  for (const line of value.setup.lines || []) {
    if (!BOAT_CLEATS.has(line.boatCleat)) throw new Error('Invalid boat cleat');
    if (!DOCK_CLEAT.test(line.dockCleat)) throw new Error('Invalid dock cleat');
    if (!['port', 'starboard'].includes(line.boatSide)) throw new Error('Invalid boat side');
  }
  if (!value.success || Object.keys(value.success).length === 0) throw new Error('At least one success criterion is required');
  assertFinite(value.success);
  if (!Array.isArray(value.steps) || !value.steps.length || !Array.isArray(value.hints) || !value.hints.length) throw new Error('Coaching content is required');
  return true;
}

catalog.forEach(validateLesson);
export const LESSONS = Object.freeze(catalog.map((value) => Object.freeze(value)));

export function getLesson(id) {
  const found = LESSONS.find((value) => value.id === id);
  if (!found) throw new Error(`Unknown lesson: ${id}`);
  return found;
}
