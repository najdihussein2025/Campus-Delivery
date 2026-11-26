import { addDays, describeDay, getDayStatus, getTeachingPeriod, nextOpenDay, parseKey } from './calendar';

// Shown when no open day exists in the calendar any more (e.g. after the last teaching period)
export const REOPENS_TEXT = 'when the next semester starts';

export const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const MINUTE_MS = 60_000;

const timeOnDay = (date, hhmm) => {
  const time = new Date(date);
  const [hours, minutes] = hhmm.split(':').map(Number);
  return time.setHours(hours, minutes, 0, 0);
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

// Offset so that getNow() shows the given date (YYYY-MM-DD) and time (HH:MM)
export const offsetForDateTime = (dateStr, hhmm) => {
  const day = parseKey(dateStr);
  const [h, m] = hhmm.split(':').map(Number);
  day.setHours(h, m, 0, 0);
  return day.getTime() - Date.now();
};

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const opensOnDay = (store, date) => (store.days || ALL_DAYS).includes(date.getDay());

// Open = the university is open today, the store works on this weekday, and the time is inside its hours
const isStoreOpenAt = (store, date) => {
  if (!getDayStatus(date).open || !opensOnDay(store, date)) return false;
  const now = date.getTime();
  return timeOnDay(date, store.openTime) <= now && now < timeOnDay(date, store.closeTime);
};

export const isStoreOpen = (store, timeOffsetMs) => isStoreOpenAt(store, getNow(timeOffsetMs));

// When the store opens next, e.g. "07:30" (later today), "tomorrow 07:30" or "Monday 07:30"
export const storeOpensText = (store, timeOffsetMs) => {
  const date = getNow(timeOffsetMs);
  const mins = date.getHours() * 60 + date.getMinutes();
  if (getDayStatus(date).open && opensOnDay(store, date) && mins < toMinutes(store.openTime)) return store.openTime;
  for (let i = 1; i <= 400; i += 1) {
    const day = addDays(date, i);
    if (getDayStatus(day).open && opensOnDay(store, day)) return `${describeDay(day, date)} ${store.openTime}`;
  }
  return REOPENS_TEXT;
};

// Badge text: "Open · until 22:00" / "Closed · opens Monday 07:30" / "Closed for Independence Day · opens Tuesday 07:30"
export const storeStatusLabel = (store, timeOffsetMs) => {
  if (isStoreOpen(store, timeOffsetMs)) return `Open · until ${store.closeTime}`;
  const status = getDayStatus(getNow(timeOffsetMs));
  const why = status.closure ? `Closed for ${status.closure.label}` : 'Closed';
  return `${why} · opens ${storeOpensText(store, timeOffsetMs)}`;
};

// Why nobody can order right now because of the CALENDAR (not the store hours): null when the university is open.
// { reason: "UA is closed – Christmas & New Year's", opensText: "Monday 4 Jan at 09:45", emoji }
export const getOrderingBlock = (timeOffsetMs, slots = []) => {
  const date = getNow(timeOffsetMs);
  const status = getDayStatus(date);
  if (status.open) return null;
  const next = nextOpenDay(date);
  const first = slots[0] ? slots[0].start : '09:45';
  const estimated = next && getTeachingPeriod(next)?.estimated;
  const opensText = next ? `${describeDay(next, date)} at ${first}${estimated ? ' (dates may change)' : ''}` : REOPENS_TEXT;
  const name = status.reason;
  const reason = status.closure ? `UA is closed – ${name}` : name;
  let emoji = '🏫';
  if (/Christmas/i.test(name)) emoji = '🎄';
  else if (/Easter/i.test(name)) emoji = '🐣';
  else if (/Independence|Army|Liberation|Labor|Mourning/i.test(name)) emoji = '🇱🇧';
  else if (/weekend/i.test(name)) emoji = '🌴';
  else if (/break/i.test(name)) emoji = '🏖️';
  return { reason, opensText, emoji, closure: status.closure };
};

// One sentence for a button / hint when ordering is impossible right now ('' when it is possible):
// calendar closure first, then the store's own hours
export const closedReason = (store, slots, timeOffsetMs) => {
  const block = getOrderingBlock(timeOffsetMs, slots);
  if (block) return `${block.reason} · ordering opens ${block.opensText}`;
  if (store && !isStoreOpen(store, timeOffsetMs)) return `${store.name} opens ${storeOpensText(store, timeOffsetMs)}`;
  return '';
};

// First day (after today, or today when still before the first break) with orders possible: "tomorrow at 09:45"
export const nextOrderingText = (slots, timeOffsetMs) => {
  const date = getNow(timeOffsetMs);
  const first = slots[0] ? slots[0].start : '09:45';
  const next = nextOpenDay(date);
  if (!next) return REOPENS_TEXT;
  return `${describeDay(next, date)} at ${first}${getTeachingPeriod(next)?.estimated ? ' (dates may change)' : ''}`;
};

// Returns { disabled, reason } for one delivery slot.
const getSlotStateAt = (slot, store, date) => {
  if (!getDayStatus(date).open) return { disabled: true, reason: 'UA is closed today' };
  if (store && !opensOnDay(store, date)) return { disabled: true, reason: 'Store closed today' };
  const start = timeOnDay(date, slot.start);
  const remaining = start - date.getTime();
  if (remaining <= 0) return { disabled: true, reason: 'Passed' };
  if (store && start >= timeOnDay(date, store.closeTime)) return { disabled: true, reason: 'Store closed' };
  if (store && remaining < store.prepTime * MINUTE_MS) {
    return { disabled: true, reason: `Too close – needs ${store.prepTime} min` };
  }
  return { disabled: false, reason: '' };
};

export const getSlotState = (slot, store, timeOffsetMs) =>
  getSlotStateAt(slot, store, getNow(timeOffsetMs));

export const getNextSlot = (slots, timeOffsetMs) => {
  const date = getNow(timeOffsetMs);
  if (!getDayStatus(date).open) return null;
  return slots.find((slot) => timeOnDay(date, slot.start) > date.getTime()) || null;
};

// First break a student can still order for, with countdowns to the cutoff and the start.
export const getNextAvailableSlot = (slots, stores, timeOffsetMs) => {
  const date = getNow(timeOffsetMs);
  const now = date.getTime();
  if (!getDayStatus(date).open) return null;
  const openStores = stores.filter((store) => isStoreOpenAt(store, date));
  let skipped = null;
  for (const slot of slots) {
    const start = timeOnDay(date, slot.start);
    if (start <= now) continue;
    const makers = openStores.filter((store) => !getSlotStateAt(slot, store, date).disabled);
    if (makers.length) {
      const prep = Math.min(...makers.map((store) => store.prepTime));
      const minutesToStart = (start - now) / MINUTE_MS;
      return {
        slot,
        minutesLeft: Math.ceil(minutesToStart - prep),
        minutesUntilStart: Math.ceil(minutesToStart),
        skipped,
      };
    }
    if (!skipped) skipped = slot;
  }
  return null;
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

export const minutesToTime = (mins) => `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
const fromMinutes = minutesToTime;

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
