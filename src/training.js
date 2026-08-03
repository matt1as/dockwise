const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const round = (value, digits = 2) => Number(finite(value).toFixed(digits));

export function angleDifference(a, b) {
  return Math.atan2(Math.sin(finite(a) - finite(b)), Math.cos(finite(a) - finite(b)));
}

export function createTrainingSession(lesson, initialState = {}) {
  if (!lesson?.id) throw new Error('A lesson with an id is required');
  return {
    lessonId: lesson.id,
    status: 'running',
    failureReason: null,
    elapsed: 0,
    collisionCount: 0,
    peakSpeed: Math.abs(finite(initialState.speed)),
    peakLineLoad: 0,
    stableTargetDuration: 0,
    throttleReversals: 0,
    previousEngine: 0,
    wasColliding: false,
    finalState: { ...initialState },
  };
}

function targetSatisfied(success, state) {
  const target = success?.target;
  if (!target) return false;
  const distance = Math.hypot(finite(state.x) - target.x, finite(state.y) - target.y);
  const headingErrorDeg = Math.abs(angleDifference(state.heading, target.heading ?? state.heading)) * 180 / Math.PI;
  return distance <= finite(target.radius)
    && headingErrorDeg <= finite(target.headingToleranceDeg, 180)
    && Math.abs(finite(state.speed)) <= finite(success.maxSpeed, Infinity);
}

export function observeTrainingStep(session, lesson, observation = {}) {
  if (session.status !== 'running') return session;
  const dt = Math.max(0, finite(observation.dt));
  const state = observation.state || {};
  const lineResults = observation.lineResults || state.lineResults || [];
  const collision = Boolean(state.collision);
  const peakLineLoad = Math.max(0, ...lineResults.map((line) => finite(line.tension)));
  const engine = Math.sign(finite(observation.controls?.engine));
  const throttleReversal = engine && session.previousEngine && engine !== session.previousEngine ? 1 : 0;
  const stableTargetDuration = targetSatisfied(lesson.success, state)
    ? session.stableTargetDuration + dt
    : 0;
  const next = {
    ...session,
    elapsed: session.elapsed + dt,
    collisionCount: session.collisionCount + (collision && !session.wasColliding ? 1 : 0),
    peakSpeed: Math.max(session.peakSpeed, Math.abs(finite(state.speed))),
    peakLineLoad: Math.max(session.peakLineLoad, peakLineLoad),
    stableTargetDuration,
    throttleReversals: session.throttleReversals + throttleReversal,
    previousEngine: engine || session.previousEngine,
    wasColliding: collision,
    finalState: { ...state },
  };
  if (lesson.failure?.collision && collision) {
    return { ...next, status: 'failed', failureReason: 'collision' };
  }
  const maximumLoad = finite(lesson.failure?.maxLineLoad, Infinity);
  if (peakLineLoad > maximumLoad || lineResults.some((line) => line.overloaded)) {
    return { ...next, status: 'failed', failureReason: 'line-overload' };
  }
  if (lesson.failure?.maxDuration && next.elapsed > lesson.failure.maxDuration) {
    return { ...next, status: 'failed', failureReason: 'time-limit' };
  }
  const requiredStableTime = Math.max(0, finite(lesson.success?.stableFor));
  if (lesson.success?.target && stableTargetDuration >= requiredStableTime) {
    return { ...next, status: 'completed' };
  }
  return next;
}

export function summarizeTrainingSession(session, lesson) {
  const target = lesson.success?.target;
  const final = session.finalState || {};
  const distance = target ? Math.hypot(finite(final.x) - target.x, finite(final.y) - target.y) : null;
  const headingError = target
    ? Math.abs(angleDifference(final.heading, target.heading ?? final.heading)) * 180 / Math.PI
    : null;
  return {
    status: session.status,
    elapsed: round(session.elapsed, 1),
    control: {
      label: session.collisionCount === 0 && session.peakLineLoad <= finite(lesson.failure?.maxLineLoad, Infinity) ? 'Clean' : 'Needs care',
      collisions: session.collisionCount,
      peakLineLoad: round(session.peakLineLoad, 0),
    },
    smoothness: {
      label: session.throttleReversals === 0 ? 'Steady' : 'Abrupt',
      peakSpeed: round(session.peakSpeed, 2),
      throttleReversals: session.throttleReversals,
    },
    accuracy: {
      label: distance === null ? 'Procedure' : distance <= finite(target.radius) ? 'On target' : 'Outside target',
      distance: distance === null ? null : round(distance, 2),
      headingErrorDeg: headingError === null ? null : round(headingError, 1),
    },
  };
}
