export const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const pad = (n) => String(n).padStart(2, '0');

export const formatTime = (date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

export const formatDate = (ms) => {
  const d = new Date(ms);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} · ${formatTime(d)}`;
};

// Demo clock: every time rule uses getNow so the presenter can choose the hour
export const getNow = (timeOffsetMs = 0) => new Date(Date.now() + timeOffsetMs);

export const nowMinutes = (timeOffsetMs) => {
  const now = getNow(timeOffsetMs);
  return now.getHours() * 60 + now.getMinutes();
};

export const isValidTime = (hhmm) => /^([01]\d|2[0-3]):[0-5]\d$/.test(hhmm);

// Offset needed so that getNow() shows the given HH:MM today
export const offsetForTime = (hhmm) => {
  const target = new Date();
  const [h, m] = hhmm.split(':').map(Number);
  target.setHours(h, m, 0, 0);
  return target.getTime() - Date.now();
};

export const isStoreOpen = (store, timeOffsetMs) => {
  const now = nowMinutes(timeOffsetMs);
  return toMinutes(store.openTime) <= now && now < toMinutes(store.closeTime);
};

// Returns { disabled, reason } for one delivery slot
export const getSlotState = (slot, store, timeOffsetMs) => {
  const now = nowMinutes(timeOffsetMs);
  const start = toMinutes(slot.start);
  if (start <= now) return { disabled: true, reason: 'Passed' };
  if (store && start >= toMinutes(store.closeTime)) return { disabled: true, reason: 'Store closed' };
  if (store && now + store.prepTime > start) {
    return { disabled: true, reason: `Too close – needs ${store.prepTime} min` };
  }
  return { disabled: false, reason: '' };
};

export const getNextSlot = (slots, timeOffsetMs) => {
  const now = nowMinutes(timeOffsetMs);
  return slots.find((slot) => toMinutes(slot.start) > now) || null;
};

export const getGreeting = (timeOffsetMs) => {
  const hour = getNow(timeOffsetMs).getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

export const formatFloor = (floor) => {
  if (floor === 0) return 'Ground';
  if (floor === 1) return '1st';
  if (floor === 2) return '2nd';
  if (floor === 3) return '3rd';
  return `${floor}th`;
};

export const formatFloorLong = (floor) => (floor === 0 ? 'Ground floor' : `${formatFloor(floor)} floor`);

export const minutesUntil = (hhmm, timeOffsetMs) => toMinutes(hhmm) - nowMinutes(timeOffsetMs);

const fromMinutes = (mins) => `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;

// Latest time an order must be placed to make a slot ("Order by 11:00")
export const orderByTime = (slot, store) => fromMinutes(toMinutes(slot.start) - (store ? store.prepTime : 0));

export const dayLabel = (ms, timeOffsetMs = 0) => {
  const d = new Date(ms);
  const today = getNow(timeOffsetMs);
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOf(today) - startOf(d)) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return formatDate(ms).split(' · ')[0];
};
