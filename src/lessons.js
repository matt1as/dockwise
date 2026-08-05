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

const lessonExplanations = {
  'momentum-neutral': {
    explanation: 'Ahead creates forward thrust and builds momentum. When you select Neutral, the propeller stops adding thrust, but the boat keeps moving because its mass is already in motion. Water resistance gradually removes that momentum; the earlier you select Neutral, the more gently you arrive at the target.',
    experiment: 'Run once with Neutral and notice that time advances but the boat stays still. Then select Ahead, run briefly, and select Neutral to feel the difference between thrust and coasting.',
  },
  'rudder-flow': {
    explanation: 'The rudder is not a steering wheel in the water: it needs water flowing across it. With the engine stopped and the boat stationary, helm input has very little effect. Ahead creates prop wash over the rudder, and forward motion creates flow along the hull, so the same rudder angle becomes more effective.',
    experiment: 'Try the same rudder angle first in Neutral, then with a short Ahead pulse. Watch the turn-rate readout and compare how quickly the heading responds.',
  },
  'reverse-prop-walk': {
    explanation: 'In reverse, the propeller accelerates water sideways as well as astern. That sideways reaction is prop walk, and on this boat the calibrated default is toward port. It is strongest during the first moments of an astern pulse, before the boat has built much sternway.',
    experiment: 'Use a short Astern pulse, return to Neutral, and observe the sideways displacement. Repeat with prop walk Off to separate prop-walk motion from ordinary reverse motion.',
  },
  'controlled-pivot': {
    explanation: 'At low speed the boat can turn around its underwater resistance and thrust points. Rudder, prop wash, and the hull’s resistance do not act at the same point, so they create a turning moment. Short inputs let you feel that moment without allowing speed or yaw to build beyond control.',
    experiment: 'Hold a small helm angle, then center it before the target heading. Compare that with holding full helm; the second attempt shows why counter-steering and early neutral matter.',
  },
  'aft-spring-departure': {
    explanation: 'This stern-side spring runs forward to the dock. Astern thrust moves the stern away from the forward dock cleat until the spring takes the load; the stern is restrained and the bow swings away from the dock. Once the bow is clear, release the line and leave normally.',
    experiment: 'Connect the tutorial line, use gentle Astern, and watch the bow open before releasing. Then repeat without the spring to see how the turning geometry changes.',
  },
  'offshore-wind-departure': {
    explanation: 'The wind is already pushing the boat away from the dock, so it can help the spring departure. The stern-side spring and a short Astern pulse create a controlled pivot while the wind adds separation. Too much engine or leaving the line too late can still create unnecessary load.',
    experiment: 'Use the wind as assistance: add only enough Astern to open the bow, monitor line load, and release while the boat is still slow.',
  },
  'arrive-alongside': {
    explanation: 'An alongside arrival is mainly a momentum-management exercise. Thrust gets you close, but Neutral gives the water and hull resistance time to remove speed. A parallel final heading leaves fewer sideways corrections and keeps the boat clear of the dock.',
    experiment: 'Approach once while carrying extra speed, then repeat at walking pace with an earlier Neutral. Compare peak speed, sideways speed, and how much correction is needed near the dock.',
  },
  'bow-to-control': {
    explanation: 'Bow-to lines share load only when the approach is balanced. If one forward line takes most of the tension, the boat can yaw around that line instead of settling straight. Small corrections and low speed keep both lines working as a pair.',
    experiment: 'Use the line setup button, approach slowly, and compare the two live line loads. Add power only after checking whether one line is already carrying the maneuver.',
  },
  'stern-to-control': {
    explanation: 'Stern-to reversing combines three effects: astern thrust, port prop walk, and the restoring forces from the paired aft lines. Short reverse pulses make each effect visible. Neutral pauses let momentum decay before the next correction, which is easier to control than continuous reverse.',
    experiment: 'Connect both aft lines, pulse Astern, pause in Neutral, and watch the line loads and sideways motion before choosing the next correction.',
  },
  'mixed-conditions': {
    explanation: 'Wind and current add forces even when the engine is Neutral. Their direction matters as much as their strength, and the force arrows show the qualitative balance. Plan the approach around the environmental drift, then use small engine and rudder inputs instead of trying to overpower everything.',
    experiment: 'Pause with Analysis on and identify where wind and current point. Make a low-speed approach, then use Neutral early and check whether the remaining drift is carrying you toward or away from the target.',
  },
};

const lessonInstructions = {
  'momentum-neutral': {
    start: 'Leave the engine in Neutral. Set throttle to about 35%.',
    done: 'You are done when the boat is inside the target circle, stopped, and has not touched the dock.',
  },
  'rudder-flow': {
    start: 'Leave the rudder centered. First try turning in Neutral, then repeat with a short Ahead pulse.',
    done: 'You are done when the boat reaches the target with a small speed and the bow is pointing within the target angle.',
  },
  'reverse-prop-walk': {
    start: 'Set the throttle to about 35%. Keep the rudder centered so the sideways reverse effect is easy to see.',
    done: 'You are done when the boat settles near the target after a short reverse pulse, without building excess speed.',
  },
  'controlled-pivot': {
    start: 'Start stopped with low throttle. Use small helm and engine inputs; do not hold full power.',
    done: 'You are done when the heading reads about 090°, the boat is within 1.5 m of the target, and speed is low.',
  },
  'aft-spring-departure': {
    start: 'Click Connect tutorial lines first. The stern-side spring is attached; select Astern at low throttle.',
    done: 'You are done when the bow has opened, the line is not overloaded, and the boat is moving away slowly.',
  },
  'offshore-wind-departure': {
    start: 'Click Connect tutorial lines first. Select Astern gently and let the offshore wind help create separation.',
    done: 'You are done when the boat is clear of the dock, the spring is not overloaded, and speed remains low.',
  },
  'arrive-alongside': {
    start: 'Begin well clear of the dock. Select Ahead briefly, then use Neutral early rather than carrying speed in.',
    done: 'You are done when the boat is alongside, parallel, stopped, and inside the target area without contact.',
  },
  'bow-to-control': {
    start: 'Click Connect tutorial lines first. Approach bow-first at walking pace and keep both forward lines balanced.',
    done: 'You are done when the bow is in the target, the heading is within tolerance, and neither line is overloaded.',
  },
  'stern-to-control': {
    start: 'Click Connect tutorial lines first. Reverse in short pulses and pause in Neutral between corrections.',
    done: 'You are done when the stern is in the target, the heading is within tolerance, and both aft lines share the load.',
  },
  'mixed-conditions': {
    start: 'Turn Analysis on and look at the wind/current arrows. Choose a slow approach before selecting Ahead or Astern.',
    done: 'You are done when the boat is in the target, stopped and clear, with no collision or overloaded line.',
  },
};

function lesson(id, order, title, briefing, setup, target, steps, hints, failure = {}) {
  const coaching = lessonExplanations[id];
  const instructions = lessonInstructions[id];
  return {
    id, order, title, durationLabel: order < 5 ? '2 min' : '3 min', briefing,
    explanation: coaching.explanation, experiment: coaching.experiment,
    startHere: instructions.start, doneWhen: instructions.done, steps,
    setup,
    success: { target, maxSpeed: order < 7 ? 0.3 : 0.2, stableFor: 1 },
    failure: { collision: true, maxLineLoad: 9000, maxDuration: 180, ...failure },
    hints,
  };
}

const catalog = [
  lesson('momentum-neutral', 1, 'Momentum and neutral', 'Run starts the clock, but Ahead creates the thrust: build gentle headway, then select Neutral and stop under control.', setups.momentum, { x: -2, y: 2.8, radius: 0.8, heading: 0, headingToleranceDeg: 12 }, ['Select Ahead below 45% throttle.', 'Return to Neutral before the target.', 'Settle without dock contact.'], ['Neutral removes thrust; it does not remove momentum.']),
  lesson('rudder-flow', 2, 'Rudder needs flow', 'Feel how rudder authority grows with headway and propeller wash.', setups.rudder, { x: -1.5, y: 3.4, radius: 1, heading: 0.2, headingToleranceDeg: 18 }, ['Try helm while neutral.', 'Use gentle Ahead and repeat.', 'Center the rudder as the bow turns.'], ['A rudder needs water flowing across it.']),
  lesson('reverse-prop-walk', 3, 'Reverse prop walk', 'Use a short astern pulse and observe the configured stern tendency.', setups.reverse, { x: 0.5, y: 2.5, radius: 1.2, heading: 0, headingToleranceDeg: 20 }, ['Select Astern.', 'Watch the sideways movement.', 'Return to Neutral and settle.'], ['A short pulse shows prop walk without building excess speed.']),
  lesson('controlled-pivot', 4, 'Controlled pivot', 'Rotate toward the target heading while remaining inside the safe area.', setups.pivot, { x: 0, y: 3, radius: 1.5, heading: Math.PI / 2, headingToleranceDeg: 15 }, ['Use low power and helm.', 'Counter the turn early.', 'Finish nearly stopped.'], ['Alternate short inputs instead of holding full power.']),
  lesson('aft-spring-departure', 5, 'Leave on aft spring', 'Use one stern-side spring and gentle Astern to move the bow clear before releasing into open water.', setups.spring, { x: 2, y: 1.5, radius: 1.4, heading: 0.2, headingToleranceDeg: 22 }, ['Apply gentle Astern against the spring.', 'Wait for the bow to open.', 'Release and leave slowly.'], ['The spring restrains the stern while Astern creates a turning moment.']),
  lesson('offshore-wind-departure', 6, 'Leave in offshore wind', 'Repeat the spring departure with gentle Astern while an offshore wind moves the boat away.', setups.wind, { x: 2, y: 2.2, radius: 1.5, heading: 0.15, headingToleranceDeg: 24 }, ['Use the stern-side spring briefly.', 'Allow for wind drift.', 'Release before line load rises.'], ['The wind is assistance, not a reason to add speed.']),
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
  if (!Array.isArray(value.steps) || !value.steps.length || !Array.isArray(value.hints) || !value.hints.length || typeof value.explanation !== 'string' || value.explanation.length < 80 || typeof value.experiment !== 'string' || value.experiment.length < 40 || typeof value.startHere !== 'string' || value.startHere.length < 30 || typeof value.doneWhen !== 'string' || value.doneWhen.length < 40) throw new Error('Coaching content is required');
  return true;
}

catalog.forEach(validateLesson);
export const LESSONS = Object.freeze(catalog.map((value) => Object.freeze(value)));

export function getLesson(id) {
  const found = LESSONS.find((value) => value.id === id);
  if (!found) throw new Error(`Unknown lesson: ${id}`);
  return found;
}
