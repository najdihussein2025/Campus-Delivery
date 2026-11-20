// University calendar: weekends, closed days (holidays, extra days off) and the time between semesters.
// The data lives in src/data/uaCalendar.json (day convention: JS getDay(), Sunday = 0 … Saturday = 6).
// Pure functions: every date comes from the caller (the demo clock), never from `new Date()`.
import defaultCalendar from '../data/uaCalendar.json';

const pad = (n) => String(n).padStart(2, '0');
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_MS = 86400000;

export const dateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
export const parseKey = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (date, n) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
export const isValidDateKey = (key) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const d = parseKey(key);
  return dateKey(d) === key;
};

export const weekdayName = (date) => WEEKDAYS[date.getDay()];
// "Monday 4 Jan"
export const longDayLabel = (date) => `${weekdayName(date)} ${date.getDate()} ${MONTHS[date.getMonth()]}`;

// "tomorrow", "Monday" (within the week) or "Monday 4 Jan"
export const describeDay = (date, now) => {
  const diff = Math.round((parseKey(dateKey(date)) - parseKey(dateKey(now))) / DAY_MS);
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  if (diff < 7) return weekdayName(date);
  return longDayLabel(date);
};

// The closure that covers this date: { name, type, source, estimated, label } or null.
// Entries with closesCampus: false are only events, so they never close anything.
export const getClosure = (date, calendar = defaultCalendar) => {
  const key = dateKey(date);
  const found = (calendar.closedDays || []).find((c) => {
    if (c.closesCampus === false) return false;
    const from = c.from || c.date;
    const to = c.to || c.date;
    return from && key >= from && key <= to;
  });
  if (!found) return null;
  return {
    name: found.name,
    type: found.type,
    source: found.type === 'national' ? 'Lebanese public holiday' : 'UA calendar',
    estimated: Boolean(found.estimated),
    label: found.estimated ? `${found.name} (date may change)` : found.name,
  };
};

const teachingPeriodOf = (key, calendar) =>
  (calendar.teachingPeriods || []).find((p) => key >= p.start && key <= p.end) || null;

// Status of one day, without looking for the next open day: { open, reason, closure }
export const getDayStatus = (date, calendar = defaultCalendar) => {
  const dow = date.getDay();
  if (dow === 0 || dow === 6) return { open: false, reason: 'UA is closed on weekends', closure: null };
  const closure = getClosure(date, calendar);
  if (closure) return { open: false, reason: closure.label, closure };
  if (calendar.closeBetweenSemesters && (calendar.teachingPeriods || []).length) {
    const key = dateKey(date);
    if (!teachingPeriodOf(key, calendar)) {
      const next = calendar.teachingPeriods.find((p) => p.start > key);
      const summer = !next || /^fall/i.test(next.name);
      return { open: false, reason: summer ? 'Summer break' : 'No classes – semester break', closure: null };
    }
  }
  return { open: true, reason: '', closure: null };
};

// The teaching period that contains a date (or null): { name, start, end, estimated }
export const getTeachingPeriod = (date, calendar = defaultCalendar) => teachingPeriodOf(dateKey(date), calendar);

// First open day after `date` (searches up to 2 years ahead)
export const nextOpenDay = (date, calendar = defaultCalendar) => {
  for (let i = 1; i <= 730; i += 1) {
    const day = addDays(date, i);
    if (getDayStatus(day, calendar).open) return day;
  }
  return null;
};

// { open, reason, nextOpenDate }  (nextOpenDate is only set when the university is closed)
export const isUniversityOpen = (date, calendar = defaultCalendar) => {
  const status = getDayStatus(date, calendar);
  return { open: status.open, reason: status.reason, nextOpenDate: status.open ? null : nextOpenDay(date, calendar) };
};
