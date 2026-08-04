import test from 'node:test';
import assert from 'node:assert/strict';
import { LESSONS, getLesson, validateLesson } from '../src/lessons.js';

const expectedTitles = [
  'Momentum and neutral',
  'Rudder needs flow',
  'Reverse prop walk',
  'Controlled pivot',
  'Leave on aft spring',
  'Leave in offshore wind',
  'Arrive alongside',
  'Bow-to control',
  'Stern-to control',
  'Final mixed-conditions challenge',
];

test('catalog contains exactly ten ordered lessons with unique ids and required titles', () => {
  assert.equal(LESSONS.length, 10);
  assert.equal(new Set(LESSONS.map(({ id }) => id)).size, 10);
  assert.deepEqual(LESSONS.map(({ title }) => title), expectedTitles);
  assert.deepEqual(LESSONS.map(({ order }) => order), [1,2,3,4,5,6,7,8,9,10]);
});

test('every lesson has a valid deterministic setup and coaching content', () => {
  for (const lesson of LESSONS) {
    assert.equal(validateLesson(lesson), true, lesson.id);
    assert.ok(lesson.briefing.length >= 20);
    assert.ok(lesson.explanation.length >= 80);
    assert.ok(lesson.experiment.length >= 40);
    assert.ok(lesson.steps.length > 0);
    assert.ok(lesson.hints.length > 0);
    assert.ok(Object.keys(lesson.success).length > 0);
    assert.ok(Object.keys(lesson.failure).length > 0);
  }
});

test('validation rejects invalid berth modes, values, cleats, and criteria', () => {
  const valid = structuredClone(LESSONS[0]);
  assert.throws(() => validateLesson({ ...valid, setup: { ...valid.setup, berthMode: 'flying' } }), /berth mode/);
  assert.throws(() => validateLesson({ ...valid, setup: { ...valid.setup, state: { ...valid.setup.state, x: Infinity } } }), /finite/);
  assert.throws(() => validateLesson({ ...valid, setup: { ...valid.setup, lines: [{ boatCleat: 'mast', dockCleat: 'D1' }] } }), /boat cleat/);
  assert.throws(() => validateLesson({ ...valid, success: {} }), /success criterion/);
});

test('getLesson returns known lessons and rejects unknown ids', () => {
  assert.equal(getLesson('momentum-neutral').title, 'Momentum and neutral');
  assert.throws(() => getLesson('missing'), /Unknown lesson/);
});
