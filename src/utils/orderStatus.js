import { formatTime, minutesToTime, toMinutes } from './time';

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

// Orders saved before the schedule existed fall back to 12 s steps from their creation time
const startMs = (order) => order.placedAtMs ?? order.createdAt ?? 0;
const scheduleOf = (order) => order.statusSchedule || buildStatusSchedule(startMs(order), LEGACY_STEP_SECONDS);

// [Received, Preparing, On the way, Delivered] start times
export const getStepTimes = (order) => {
  const s = scheduleOf(order);
  return [startMs(order), s.preparing, s.onTheWay, s.delivered];
};

// Times SHOWN to the student. The status itself changes on the fast demo timer, but the story must match the
// chosen break, so the displayed times are computed from the slot:
//   Received   = real placement time (demo clock)
//   Preparing  = break start − store prep time
//   On the way = break start − 5 min
//   Delivered  = the break window ("15:15–15:30")
// Orders without a known slot fall back to the real step times.
export const getDisplayTimes = (order, slot, store) => {
  const received = formatTime(new Date(order.placedAt ?? startMs(order)));
  if (!slot) return getStepTimes(order).map((t, i) => (i === 0 ? received : formatTime(new Date(t))));
  const start = toMinutes(slot.start);
  const prep = store ? store.prepTime : 10;
  return [received, minutesToTime(start - prep), minutesToTime(start - 5), slot.label];
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
