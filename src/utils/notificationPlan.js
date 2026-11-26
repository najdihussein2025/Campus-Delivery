// What to notify and when. Pure functions: the OS scheduling lives in services/notifications.js.
import { toMinutes } from './time';
import { getDayStatus } from './calendar';

// Three order notifications (Preparing, On the way, Delivered), only those still in the future.
// `at` is an absolute real-time timestamp, the same one the order's statusSchedule uses.
export const buildOrderPlan = ({ order, storeName, slotLabel, buildingName, completesCard, nowMs }) => {
  const count = order.items.reduce((sum, i) => sum + i.qty, 0);
  const items = `${count} ${count === 1 ? 'item' : 'items'}`;
  const steps = [
    {
      step: 'preparing',
      at: order.statusSchedule.preparing,
      title: `☕ ${storeName} is preparing your order`,
      body: `${items} · arriving ${slotLabel} at ${order.room}`,
    },
    {
      step: 'onTheWay',
      at: order.statusSchedule.onTheWay,
      title: '🛵 Your order is on the way',
      body: `${order.courier} is heading to ${buildingName ? `${buildingName} · ` : ''}Room ${order.room}`,
    },
    {
      step: 'delivered',
      at: order.statusSchedule.delivered,
      title: `✅ Delivered to ${buildingName ? `${buildingName}, ` : ''}Room ${order.room}`,
      body: `${slotLabel ? `Scheduled for the ${slotLabel} break. ` : ''}Tap to rate your order.${completesCard ? ' You also earned a free coffee 🎁' : ''}`,
    },
  ];
  return steps
    .map((s) => ({ ...s, seconds: Math.ceil((s.at - nowMs) / 1000) }))
    .filter((s) => s.seconds >= 1);
};

// Open university days (no weekends, holidays or semester breaks) starting today, `count` of them
export const nextWeekdays = (now, count = 5) => {
  const days = [];
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (let guard = 0; days.length < count && guard < 400; guard += 1) {
    if (getDayStatus(cursor).open) days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
};

// Break reminders for the next 5 weekdays, in REAL time (the OS knows nothing about the demo clock).
// Past times are skipped, and so are today's breaks that already have an active order (busySlotIds).
export const buildBreakReminders = (slots, now, leadMinutes, busySlotIds = []) => {
  const todayKey = now.toDateString();
  const reminders = [];
  nextWeekdays(now, 5).forEach((day) => {
    slots.forEach((slot) => {
      const mins = toMinutes(slot.start) - leadMinutes;
      const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(mins / 60), mins % 60, 0, 0);
      if (at.getTime() <= now.getTime() + 1000) return;
      if (day.toDateString() === todayKey && busySlotIds.includes(slot.id)) return;
      reminders.push({ at, slotId: slot.id, title: `⏰ Break at ${slot.start}`, body: 'Order now to get it in class' });
    });
  });
  return reminders;
};
