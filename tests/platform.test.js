import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlatformBridge, createRuntimePlatform } from '../src/platform.js';

function memory(seed = {}) {
  const values = new Map(Object.entries(seed));
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    values,
  };
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

test('non-native runtime does not load Capacitor plugin modules', async () => {
  let loadCalls = 0;
  const bridge = await createRuntimePlatform({
    capacitor: { isNativePlatform: () => false },
    loadNativePlugins: async () => {
      loadCalls += 1;
      return {};
    },
  });

  assert.equal(bridge.isNative, false);
  assert.equal(loadCalls, 0);
});

test('native runtime uses injected Capacitor plugin dependencies', async () => {
  const dependencies = {
    haptics: { impact: async () => {} },
    preferences: { get: async () => ({ value: null }) },
  };
  let loadCalls = 0;
  const bridge = await createRuntimePlatform({
    capacitor: { isNativePlatform: () => true },
    loadNativePlugins: async () => {
      loadCalls += 1;
      return dependencies;
    },
  });

  assert.equal(bridge.isNative, true);
  assert.equal(loadCalls, 1);
  assert.equal(bridge.haptics, dependencies.haptics);
  assert.equal(bridge.preferences, dependencies.preferences);
});

test('browser bridge leaves storage local and haptics silent', async () => {
  const local = memory({ 'dockwise-v2': 'browser-value' });
  const calls = [];
  const bridge = createPlatformBridge({
    isNative: false,
    preferences: { get: async () => ({ value: 'native-value' }), set: async (value) => calls.push(value) },
    haptics: { impact: async (value) => calls.push(value) },
  });

  await bridge.restoreStorage(local);
  bridge.storage(local).setItem('dockwise-v2', 'next');
  bridge.updateHaptics({ collision: true, overload: true, lessonStatus: 'completed' });
  await tick();

  assert.equal(local.getItem('dockwise-v2'), 'next');
  assert.deepEqual(calls, []);
});

test('native bridge restores Preferences before exposing mirrored storage', async () => {
  const local = memory({ 'dockwise-v2': 'stale-browser-value' });
  const writes = [];
  const bridge = createPlatformBridge({
    isNative: true,
    preferences: {
      get: async ({ key }) => ({ value: key === 'dockwise-v2' ? 'native-value' : null }),
      set: async (entry) => writes.push(entry),
      remove: async (entry) => writes.push({ removed: entry.key }),
    },
  });

  await bridge.restoreStorage(local);
  assert.equal(local.getItem('dockwise-v2'), 'native-value');

  const mirrored = bridge.storage(local);
  mirrored.setItem('dockwise-v2', 'fresh-value');
  mirrored.removeItem('dockwise-v2');
  await tick();

  assert.deepEqual(writes, [
    { key: 'dockwise-v2', value: 'fresh-value' },
    { removed: 'dockwise-v2' },
  ]);
});

test('native haptics fire once when meaningful states are entered', async () => {
  let now = 1000;
  const calls = [];
  const bridge = createPlatformBridge({
    isNative: true,
    now: () => now,
    haptics: {
      impact: async (options) => calls.push(['impact', options]),
      notification: async (options) => calls.push(['notification', options]),
    },
  });

  bridge.updateHaptics({ collision: false, overload: false, lessonStatus: 'running' });
  bridge.updateHaptics({ collision: true, overload: false, lessonStatus: 'running' });
  bridge.updateHaptics({ collision: true, overload: false, lessonStatus: 'running' });
  now += 700;
  bridge.updateHaptics({ collision: false, overload: true, lessonStatus: 'running' });
  now += 700;
  bridge.updateHaptics({ collision: false, overload: true, lessonStatus: 'completed' });
  now += 700;
  bridge.updateHaptics({ collision: false, overload: false, lessonStatus: 'failed' });
  await tick();

  assert.deepEqual(calls, [
    ['impact', { style: 'Heavy' }],
    ['impact', { style: 'Medium' }],
    ['notification', { type: 'Success' }],
    ['notification', { type: 'Error' }],
  ]);
});

test('haptic cooldown suppresses different loop transitions that arrive too quickly', async () => {
  let now = 1000;
  const calls = [];
  const bridge = createPlatformBridge({
    isNative: true,
    now: () => now,
    haptics: { impact: async (options) => calls.push(options) },
  });

  bridge.updateHaptics({ collision: true, overload: false, lessonStatus: 'running' });
  now += 50;
  bridge.updateHaptics({ collision: false, overload: true, lessonStatus: 'running' });
  await tick();

  assert.deepEqual(calls, [{ style: 'Heavy' }]);
});
