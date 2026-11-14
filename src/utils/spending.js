// Spending insights for the Wallet. Spending = every non-cancelled order (wallet AND cash), dated by placedAt (demo clock).
const DAY = 86400000;
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const toDate = (now) => (now instanceof Date ? now : new Date(now));
export const startOfDay = (ms) => {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};
const dateKey = (ms) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};
// Calendar-day arithmetic that survives daylight-saving changes
const addDays = (ms, n) => {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n).getTime();
};

export const countedOrders = (orders) => orders.filter((o) => !o.cancelled);
const placedOf = (o) => o.placedAt ?? o.placedAtMs ?? o.createdAt;

const sumRange = (orders, from, to) =>
  countedOrders(orders).reduce((sum, o) => (placedOf(o) >= from && placedOf(o) < to ? sum + o.total : sum), 0);

// Day columns ending today (oldest first)
export const dailyTotals = (orders, now, days = 7) => {
  const today = startOfDay(toDate(now).getTime());
  return Array.from({ length: days }, (_, i) => {
    const start = addDays(today, -(days - 1 - i));
    const date = new Date(start);
    return {
      date: dateKey(start),
      label: DAY_NAMES[date.getDay()],
      fullLabel: FULL_DAY_NAMES[date.getDay()],
      cents: sumRange(orders, start, addDays(start, 1)),
      isCurrent: i === days - 1,
    };
  });
};

// Rolling 7-day windows ending today (oldest first); the last one is "This week"
export const weeklyTotals = (orders, now, weeks = 4) => {
  const tomorrow = addDays(startOfDay(toDate(now).getTime()), 1);
  return Array.from({ length: weeks }, (_, i) => {
    const end = addDays(tomorrow, -(weeks - 1 - i) * 7);
    const start = addDays(end, -7);
    const d = new Date(start);
    const isCurrent = i === weeks - 1;
    return {
      date: dateKey(start),
      label: isCurrent ? 'This week' : `${MONTHS[d.getMonth()]} ${d.getDate()}`,
      fullLabel: isCurrent ? 'This week' : `Week of ${MONTHS[d.getMonth()]} ${d.getDate()}`,
      cents: sumRange(orders, start, end),
      isCurrent,
    };
  });
};

// Difference and % change; pct is null when there is nothing to compare with
export const compare = (current, previous) => ({
  diff: current - previous,
  pct: previous > 0 ? Math.round(((current - previous) / previous) * 100) : null,
  direction: current > previous ? 'up' : current < previous ? 'down' : 'same',
});

// Current and previous period for "week" (7 days) or "month" (last 4 weeks = 28 days)
export const periodRange = (kind, now) => {
  const length = kind === 'month' ? 28 : 7;
  const to = addDays(startOfDay(toDate(now).getTime()), 1);
  const from = addDays(to, -length);
  return { from, to, prevFrom: addDays(from, -length), prevTo: from, noun: kind === 'month' ? 'month' : 'week' };
};

export const periodOrders = (orders, from, to) =>
  countedOrders(orders).filter((o) => placedOf(o) >= from && placedOf(o) < to);

export const periodStats = (orders, range) => {
  const current = periodOrders(orders, range.from, range.to);
  const total = current.reduce((s, o) => s + o.total, 0);
  const prevTotal = periodOrders(orders, range.prevFrom, range.prevTo).reduce((s, o) => s + o.total, 0);
  return {
    total,
    prevTotal,
    count: current.length,
    average: current.length ? Math.round(total / current.length) : 0,
    change: compare(total, prevTotal),
  };
};

// Spending per store in the range, biggest first: [{ storeId, name, cents, share }]
export const byStore = (orders, range, stores = []) => {
  const totals = {};
  periodOrders(orders, range.from, range.to).forEach((o) => {
    totals[o.storeId] = (totals[o.storeId] || 0) + o.total;
  });
  const sum = Object.values(totals).reduce((s, v) => s + v, 0);
  return Object.entries(totals)
    .map(([storeId, cents]) => {
      const store = stores.find((s) => s.id === storeId);
      return { storeId, name: store ? store.name : storeId, category: store ? store.category : null, cents, share: sum ? cents / sum : 0 };
    })
    .sort((a, b) => b.cents - a.cents);
};

// One human sentence about the period
export const insightLine = (orders, range, stores) => {
  const parts = byStore(orders, range, stores);
  if (!parts.length) return `You haven't ordered this ${range.noun}`;
  const top = parts[0];
  if (parts.length === 1) return `All of your spending went to ${top.name}`;
  return `Most of your spending goes to ${top.name} (${Math.round(top.share * 100)}%)`;
};
