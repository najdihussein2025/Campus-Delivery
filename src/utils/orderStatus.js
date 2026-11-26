export const STATUS_STEPS = ['Received', 'Preparing', 'On the way', 'Delivered'];

// Tracking speed (seconds per step), chosen in Demo settings. "Demo" leaves time to lock the phone.
export const TRACKING_SPEEDS = [
  { id: 'fast', label: 'Fast', seconds: 8 },
  { id: 'demo', label: 'Demo', seconds: 20 },
  { id: 'slow', label: 'Slow', seconds: 60 },
];
export const DEFAULT_SPEED = 'demo';
export const LEGACY_STEP_SECONDS = 12;

export const secondsForSpeed = (speedId) =>
  (TRACKING_SPEEDS.find((s) => s.id === speedId) || TRACKING_SPEEDS[1]).seconds;

// Absolute real-time timestamps (ms) at which each status begins. The OS notifications use the same times.
export const buildStatusSchedule = (placedAtMs, stepSeconds) => ({
  preparing: placedAtMs + stepSeconds * 1000,
  onTheWay: placedAtMs + 2 * stepSeconds * 1000,
  delivered: placedAtMs + 3 * stepSeconds * 1000,
});

export const getCampusStatusTime = (order, realTimestamp) =>
  realTimestamp + ((order.placedAt ?? startMs(order)) - startMs(order));

// Orders saved before the schedule existed fall back to 12 s steps from their creation time
const startMs = (order) => order.placedAtMs ?? order.createdAt ?? 0;
const scheduleOf = (order) => order.statusSchedule || buildStatusSchedule(startMs(order), order.stepSeconds || LEGACY_STEP_SECONDS);

// [Received, Preparing, On the way, Delivered] start times
export const getStepTimes = (order) => {
  const s = scheduleOf(order);
  return [startMs(order), s.preparing, s.onTheWay, s.delivered];
};

// Pure: the latest step whose timestamp has passed. Stays correct after the app was closed.
export const getStepIndex = (order, nowMs) => {
  const times = getStepTimes(order);
  let index = 0;
  times.forEach((t, i) => {
    if (nowMs >= t) index = i;
  });
  return index;
};

export const getOrderStatus = (order, nowMs) => {
  if (order.cancelled) return 'Cancelled';
  return STATUS_STEPS[getStepIndex(order, nowMs)];
};

export const getStepProgress = (order, nowMs) => {
  const index = getStepIndex(order, nowMs);
  const times = getStepTimes(order);
  const done = index === STATUS_STEPS.length - 1;
  return {
    index,
    done,
    secondsToNext: done ? 0 : Math.max(0, Math.ceil((times[index + 1] - nowMs) / 1000)),
    stepTimes: times,
  };
};

// 0..1 along the store → room route
export const getRouteProgress = (order, nowMs) => {
  if (order.cancelled) return 0;
  const times = getStepTimes(order);
  const total = times[3] - times[0];
  return total > 0 ? Math.min(1, Math.max(0, (nowMs - times[0]) / total)) : 1;
};
