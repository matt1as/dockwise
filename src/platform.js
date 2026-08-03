export const NATIVE_STORAGE_KEY = 'dockwise-v2';
const HAPTIC_COOLDOWN_MS = 500;

async function loadCapacitorPlugins() {
  const [{ Haptics: haptics }, { Preferences: preferences }] = await Promise.all([
    import('@capacitor/haptics'),
    import('@capacitor/preferences'),
  ]);
  return { haptics, preferences };
}

export async function createRuntimePlatform({
  capacitor = globalThis.Capacitor,
  loadNativePlugins = loadCapacitorPlugins,
  now,
} = {}) {
  const isNative = Boolean(capacitor?.isNativePlatform?.());
  if (!isNative) return createPlatformBridge({ isNative });
  const { haptics, preferences } = await loadNativePlugins();
  return createPlatformBridge({ isNative, haptics, preferences, now });
}

export function createPlatformBridge({
  isNative = false,
  preferences,
  haptics,
  now = () => Date.now(),
} = {}) {
  let previous = { collision: false, overload: false, lessonStatus: 'running' };
  let lastHapticAt = Number.NEGATIVE_INFINITY;

  const safely = (operation) => {
    try {
      Promise.resolve(operation()).catch(() => {});
    } catch {
      // Native feedback and mirroring are enhancements; the web app remains authoritative.
    }
  };

  async function restoreStorage(localStorage) {
    if (!isNative || !preferences?.get) return;
    try {
      const { value } = await preferences.get({ key: NATIVE_STORAGE_KEY });
      if (typeof value === 'string') localStorage.setItem(NATIVE_STORAGE_KEY, value);
    } catch {
      // Keep the WebView's local copy when native preferences cannot be read.
    }
  }

  function storage(localStorage) {
    if (!isNative || !preferences) return localStorage;
    return {
      get length() { return localStorage.length; },
      key: localStorage.key?.bind(localStorage),
      getItem: localStorage.getItem.bind(localStorage),
      setItem(key, value) {
        localStorage.setItem(key, value);
        if (key === NATIVE_STORAGE_KEY && preferences.set) {
          safely(() => preferences.set({ key, value: String(value) }));
        }
      },
      removeItem(key) {
        localStorage.removeItem(key);
        if (key === NATIVE_STORAGE_KEY && preferences.remove) {
          safely(() => preferences.remove({ key }));
        }
      },
      clear() {
        localStorage.clear();
        if (preferences.remove) safely(() => preferences.remove({ key: NATIVE_STORAGE_KEY }));
      },
    };
  }

  function emitHaptic(kind) {
    const timestamp = now();
    if (!isNative || timestamp - lastHapticAt < HAPTIC_COOLDOWN_MS) return;
    const operations = {
      collision: () => haptics?.impact?.({ style: 'Heavy' }),
      overload: () => haptics?.impact?.({ style: 'Medium' }),
      completed: () => haptics?.notification?.({ type: 'Success' }),
      failed: () => haptics?.notification?.({ type: 'Error' }),
    };
    if (!operations[kind] || !haptics) return;
    lastHapticAt = timestamp;
    safely(operations[kind]);
  }

  function updateHaptics(signals = {}) {
    const next = {
      collision: Boolean(signals.collision),
      overload: Boolean(signals.overload),
      lessonStatus: signals.lessonStatus || 'running',
    };
    if (next.collision && !previous.collision) emitHaptic('collision');
    else if (next.overload && !previous.overload) emitHaptic('overload');
    else if (next.lessonStatus !== previous.lessonStatus && ['completed', 'failed'].includes(next.lessonStatus)) {
      emitHaptic(next.lessonStatus);
    }
    previous = next;
  }

  return { isNative, haptics, preferences, restoreStorage, storage, updateHaptics };
}
