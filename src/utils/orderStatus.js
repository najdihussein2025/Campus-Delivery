export const STATUS_STEPS = ['Received', 'Preparing', 'On the way', 'Delivered'];
export const STEP_SECONDS = 12;

// Status is computed from elapsed time, so it stays correct after leaving the screen or restarting
export const getStepIndex = (order, nowMs) => {
  const elapsed = Math.max(0, nowMs - order.createdAt) / 1000;
  return Math.min(STATUS_STEPS.length - 1, Math.floor(elapsed / STEP_SECONDS));
};

export const getOrderStatus = (order, nowMs) => {
  if (order.cancelled) return 'Cancelled';
  return STATUS_STEPS[getStepIndex(order, nowMs)];
};

export const getStepProgress = (order, nowMs) => {
  const index = getStepIndex(order, nowMs);
  const done = index === STATUS_STEPS.length - 1;
  const nextStepAt = order.createdAt + (index + 1) * STEP_SECONDS * 1000;
  return {
    index,
    done,
    secondsToNext: done ? 0 : Math.max(0, Math.ceil((nextStepAt - nowMs) / 1000)),
    stepTimes: STATUS_STEPS.map((_, i) => order.createdAt + i * STEP_SECONDS * 1000),
  };
};
