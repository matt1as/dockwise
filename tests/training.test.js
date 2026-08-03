import test from 'node:test';
import assert from 'node:assert/strict';
import {
  angleDifference,
  createTrainingSession,
  observeTrainingStep,
  summarizeTrainingSession,
} from '../src/training.js';

const lesson = {
  id: 'test-arrival',
  success: {
    target: { x: 2, y: 1, radius: 0.5, heading: 0, headingToleranceDeg: 8 },
    maxSpeed: 0.15,
    stableFor: 1,
  },
  failure: { collision: true, maxLineLoad: 9000 },
};

const observation = (overrides = {}) => ({
  state: { x: 2, y: 1, heading: 0, speed: 0.1, time: 0.5, collision: false, lineResults: [], ...overrides },
  controls: { engine: 0, throttle: 0.2 },
  dt: 0.5,
});

test('target must remain stable for the configured duration', () => {
  let session = createTrainingSession(lesson, { x: 0, y: 0, heading: 0, time: 0 });
  session = observeTrainingStep(session, lesson, observation());
  assert.equal(session.status, 'running');
  assert.equal(session.stableTargetDuration, 0.5);
  session = observeTrainingStep(session, lesson, observation({ time: 1 }));
  assert.equal(session.status, 'completed');
});

test('leaving the target resets stable duration', () => {
  let session = createTrainingSession(lesson, { x: 0, y: 0, heading: 0 });
  session = observeTrainingStep(session, lesson, observation());
  session = observeTrainingStep(session, lesson, observation({ x: 3 }));
  assert.equal(session.stableTargetDuration, 0);
  assert.equal(session.status, 'running');
});

test('collision and overload fail with distinct deterministic reasons', () => {
  const initial = createTrainingSession(lesson, { x: 0, y: 0, heading: 0 });
  const collision = observeTrainingStep(initial, lesson, observation({ collision: true }));
  assert.equal(collision.status, 'failed');
  assert.equal(collision.failureReason, 'collision');
  assert.equal(collision.collisionCount, 1);

  const overloaded = observeTrainingStep(initial, lesson, {
    ...observation(),
    state: { ...observation().state, lineResults: [{ tension: 9001, overloaded: true }] },
  });
  assert.equal(overloaded.status, 'failed');
  assert.equal(overloaded.failureReason, 'line-overload');
  assert.equal(overloaded.peakLineLoad, 9001);
});

test('summaries are deterministic and keep result dimensions separate', () => {
  const run = () => {
    let session = createTrainingSession(lesson, { x: 0, y: 0, heading: 0 });
    session = observeTrainingStep(session, lesson, observation());
    session = observeTrainingStep(session, lesson, observation({ time: 1 }));
    return summarizeTrainingSession(session, lesson);
  };
  assert.deepEqual(run(), run());
  const summary = run();
  assert.deepEqual(Object.keys(summary), ['status', 'elapsed', 'control', 'smoothness', 'accuracy']);
  assert.equal('score' in summary, false);
  assert.equal(summary.control.collisions, 0);
  assert.equal(summary.accuracy.distance, 0);
});

test('angleDifference uses the shortest wrapped angle', () => {
  assert.ok(Math.abs(angleDifference(Math.PI * 1.9, 0) + Math.PI * 0.1) < 1e-9);
});
