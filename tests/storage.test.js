import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, serializeScenario } from '../src/physics.js';
import { createDockwiseStore, STORAGE_KEY, LEGACY_KEY, MAX_SCENARIOS } from '../src/storage.js';

function memory(seed = {}) {
  const values = new Map(Object.entries(seed));
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    values,
  };
}

const scenario = (name = 'Test') => ({ name, state: createInitialState(), controls: {}, lines: [] });

test('new stores return a safe versioned v2 document', () => {
  const store = createDockwiseStore(memory());
  assert.deepEqual(store.getDocument(), {
    version: 2, onboardingComplete: false, lastMode: 'learn', lessonProgress: {}, scenarios: [],
  });
});

test('legacy scenario migrates through validation and remains available', () => {
  const adapter = memory({ [LEGACY_KEY]: serializeScenario(scenario('Legacy departure')) });
  const store = createDockwiseStore(adapter);
  assert.equal(store.listScenarios()[0].name, 'Legacy departure');
  assert.ok(adapter.getItem(STORAGE_KEY));
  assert.equal(adapter.getItem(LEGACY_KEY), null);
});

test('malformed documents and legacy values recover without throwing', () => {
  const adapter = memory({ [STORAGE_KEY]: '{broken', [LEGACY_KEY]: '{"state":{"x":"bad"}}' });
  const store = createDockwiseStore(adapter);
  assert.deepEqual(store.listScenarios(), []);
  assert.equal(store.getDocument().version, 2);
});

test('attempts and completion progress are persisted', () => {
  const adapter = memory();
  let store = createDockwiseStore(adapter);
  store.recordAttempt('momentum-neutral');
  store.recordAttempt('momentum-neutral');
  store.recordCompletion('momentum-neutral', { control: 'Clean' });
  store = createDockwiseStore(adapter);
  assert.deepEqual(store.getProgress('momentum-neutral'), {
    completed: true, attempts: 2, best: { control: 'Clean' },
  });
});

test('scenario library is limited, renameable, and deletable', () => {
  const store = createDockwiseStore(memory());
  for (let index = 0; index < MAX_SCENARIOS + 3; index += 1) store.saveScenario(scenario(`Scenario ${index}`));
  assert.equal(store.listScenarios().length, MAX_SCENARIOS);
  const id = store.listScenarios()[0].id;
  store.renameScenario(id, '<b>Safe name</b>');
  assert.equal(store.listScenarios()[0].name, '<b>Safe name</b>');
  assert.equal(store.deleteScenario(id), true);
  assert.equal(store.listScenarios().some((entry) => entry.id === id), false);
});

test('mode and onboarding choices survive reconstruction', () => {
  const adapter = memory();
  createDockwiseStore(adapter).setMode('sandbox');
  const store = createDockwiseStore(adapter);
  store.completeOnboarding();
  assert.equal(store.getDocument().lastMode, 'sandbox');
  assert.equal(createDockwiseStore(adapter).getDocument().onboardingComplete, true);
});
