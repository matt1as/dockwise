import { deserializeScenario, serializeScenario } from './physics.js';

export const STORAGE_KEY = 'dockwise-v2';
export const LEGACY_KEY = 'dockwise-scenario';
export const MAX_SCENARIOS = 50;

const freshDocument = () => ({
  version: 2,
  onboardingComplete: false,
  lastMode: 'learn',
  lessonProgress: {},
  scenarios: [],
});
const clone = (value) => JSON.parse(JSON.stringify(value));

function safeScenario(value) {
  try {
    return deserializeScenario(typeof value === 'string' ? value : serializeScenario(value));
  } catch {
    return null;
  }
}

function sanitizeProgress(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).flatMap(([id, progress]) => {
    if (!id || !progress || typeof progress !== 'object') return [];
    const attempts = Math.max(0, Math.floor(Number(progress.attempts) || 0));
    return [[id, {
      completed: Boolean(progress.completed),
      attempts,
      ...(progress.best && typeof progress.best === 'object' ? { best: clone(progress.best) } : {}),
    }]];
  }));
}

function sanitizeDocument(value) {
  const clean = freshDocument();
  if (!value || value.version !== 2 || typeof value !== 'object') return clean;
  clean.onboardingComplete = Boolean(value.onboardingComplete);
  clean.lastMode = ['learn', 'sandbox'].includes(value.lastMode) ? value.lastMode : 'learn';
  clean.lessonProgress = sanitizeProgress(value.lessonProgress);
  if (Array.isArray(value.scenarios)) {
    clean.scenarios = value.scenarios.flatMap((entry, index) => {
      const restored = safeScenario(entry?.scenario);
      if (!restored) return [];
      return [{
        id: typeof entry.id === 'string' && entry.id ? entry.id : `scenario-${index + 1}`,
        name: String(entry.name || restored.name || 'Saved scenario').slice(0, 100),
        scenario: restored,
      }];
    }).slice(-MAX_SCENARIOS);
  }
  return clean;
}

export function createDockwiseStore(adapter) {
  if (!adapter?.getItem || !adapter?.setItem) throw new Error('A storage adapter is required');
  let document;
  try {
    document = sanitizeDocument(JSON.parse(adapter.getItem(STORAGE_KEY) || 'null'));
  } catch {
    document = freshDocument();
  }

  const persist = () => {
    const serialized = JSON.stringify(document);
    adapter.setItem(STORAGE_KEY, serialized);
    const verified = sanitizeDocument(JSON.parse(adapter.getItem(STORAGE_KEY)));
    document = verified;
    return clone(document);
  };

  if (!adapter.getItem(STORAGE_KEY)) persist();
  const legacy = adapter.getItem(LEGACY_KEY);
  if (legacy && document.scenarios.length === 0) {
    const restored = safeScenario(legacy);
    if (restored) {
      document.scenarios.push({ id: 'scenario-1', name: String(restored.name || 'Migrated scenario').slice(0, 100), scenario: restored });
      persist();
      if (adapter.getItem(STORAGE_KEY) && adapter.removeItem) adapter.removeItem(LEGACY_KEY);
    }
  }

  const update = (mutator) => { mutator(document); return persist(); };
  const nextScenarioId = () => {
    const maximum = document.scenarios.reduce((max, entry) => Math.max(max, Number(entry.id.match(/(\d+)$/)?.[1]) || 0), 0);
    return `scenario-${maximum + 1}`;
  };

  return {
    getDocument: () => clone(document),
    setMode(mode) {
      if (!['learn', 'sandbox'].includes(mode)) throw new Error('Invalid mode');
      return update((value) => { value.lastMode = mode; });
    },
    completeOnboarding: () => update((value) => { value.onboardingComplete = true; }),
    getProgress: (lessonId) => clone(document.lessonProgress[lessonId] || { completed: false, attempts: 0 }),
    recordAttempt: (lessonId) => update((value) => {
      const previous = value.lessonProgress[lessonId] || { completed: false, attempts: 0 };
      value.lessonProgress[lessonId] = { ...previous, attempts: previous.attempts + 1 };
    }),
    recordCompletion: (lessonId, best) => update((value) => {
      const previous = value.lessonProgress[lessonId] || { completed: false, attempts: 0 };
      value.lessonProgress[lessonId] = { ...previous, completed: true, ...(best ? { best: clone(best) } : {}) };
    }),
    listScenarios: () => clone(document.scenarios),
    saveScenario(value) {
      const restored = safeScenario(value);
      if (!restored) throw new Error('Invalid scenario');
      const entry = { id: nextScenarioId(), name: String(restored.name || 'Saved scenario').slice(0, 100), scenario: restored };
      update((doc) => { doc.scenarios.push(entry); doc.scenarios = doc.scenarios.slice(-MAX_SCENARIOS); });
      return clone(entry);
    },
    renameScenario(id, name) {
      const entry = document.scenarios.find((value) => value.id === id);
      if (!entry) return false;
      update(() => { entry.name = String(name || 'Saved scenario').slice(0, 100); entry.scenario.name = entry.name; });
      return true;
    },
    deleteScenario(id) {
      const size = document.scenarios.length;
      update((value) => { value.scenarios = value.scenarios.filter((entry) => entry.id !== id); });
      return document.scenarios.length < size;
    },
  };
}
