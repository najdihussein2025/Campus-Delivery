// Demo account seed: ~3 weeks of past delivered orders so the Wallet insights are never empty.
// The coffee orders add up to 8 cups, so the demo card starts at 8 / 10 stamps.
import { calcCartTotals } from './money';
import { buildStatusSchedule } from './orderStatus';
import { toMinutes } from './time';

const DAY = 86400000;

// [daysAgo, slotId, storeId, [[productId, qty, sizeLabel?, extraLabels?]], payment, courier]
const SEED_ORDERS = [
  [1, 's2', 'coffee', [['p14', 2, 'Large', ['Oat milk']]], 'wallet', 'Rami'],
  [2, 's1', 'cafeteria', [['p03', 1]], 'cash', 'Nour'],
  [3, 's3', 'coffee', [['p15', 1, 'Large', ['Extra shot']]], 'wallet', 'Maya'],
  [5, 's2', 'cafeteria', [['p02', 1]], 'wallet', 'Karim'],
  [6, 's5', 'bookstore', [['p21', 1], ['p24', 1], ['p26', 1]], 'wallet', 'Elie'],
  [8, 's2', 'coffee', [['p18', 2, 'Large']], 'wallet', 'Jad'],
  [9, 's1', 'cafeteria', [['p05', 2], ['p08', 1]], 'cash', 'Rami'],
  [10, 's2', 'coffee', [['p12', 2, 'Large']], 'cash', 'Nour'],
  [13, 's3', 'cafeteria', [['p09', 1]], 'wallet', 'Maya'],
  [15, 's2', 'coffee', [['p14', 1, 'Large'], ['p17', 1]], 'wallet', 'Karim'],
  [17, 's4', 'bookstore', [['p23', 1], ['p25', 1]], 'wallet', 'Elie'],
  [19, 's2', 'cafeteria', [['p07', 2]], 'cash', 'Jad'],
];

const buildItem = (product, qty, sizeLabel, extraLabels = []) => {
  const size = (product.options?.sizes || []).find((s) => s.label === sizeLabel);
  const extras = (product.options?.extras || []).filter((e) => extraLabels.includes(e.label));
  const unitPrice = product.price + (size ? size.extra : 0) + extras.reduce((sum, e) => sum + e.extra, 0);
  const sortedExtras = extras.map((e) => e.label).sort();
  return {
    key: `${product.id}|${size ? size.label : ''}|${sortedExtras.join(',')}`,
    type: 'product',
    productId: product.id,
    name: product.name,
    unitPrice,
    qty,
    details: [size ? size.label : null, ...sortedExtras].filter(Boolean).join(' · '),
    category: product.category,
    loyalty: product.loyalty || null,
  };
};

// demoNowMs = the demo clock now; offsetMs = demo clock offset (placedAtMs is real time = demo time - offset)
export const buildDemoSeed = (campus, demoNowMs, offsetMs = 0) => {
  const orders = [];
  const transactions = [];
  const history = [];
  SEED_ORDERS.forEach(([daysAgo, slotId, storeId, lines, payment, courier], index) => {
    const slot = campus.deliverySlots.find((s) => s.id === slotId);
    const day = new Date(demoNowMs - daysAgo * DAY);
    const startMins = toMinutes(slot.start) - 20;
    const placedAt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(startMins / 60), startMins % 60).getTime();
    const placedAtMs = placedAt - offsetMs;
    const items = lines.map(([pid, qty, size, extras]) => buildItem(campus.products.find((p) => p.id === pid), qty, size, extras));
    const totals = calcCartTotals(items);
    const id = `seed${index + 1}`;
    const number = String(40000 + index * 137).slice(-5);
    const stepSeconds = 20;
    orders.push({
      id,
      number,
      storeId,
      items,
      gross: totals.gross,
      discount: 0,
      subtotal: totals.subtotal,
      deliveryFee: totals.deliveryFee,
      total: totals.total,
      building: 'baabda-D',
      room: 'D.2.8',
      slotId,
      payment,
      courier,
      placedAt,
      placedAtMs,
      createdAt: placedAtMs,
      stepSeconds,
      statusSchedule: buildStatusSchedule(placedAtMs, stepSeconds),
      notificationIds: [],
      cancelled: false,
      rewardUsed: false,
      stampsCredited: true,
      isSeed: true,
    });
    if (payment === 'wallet') {
      transactions.push({
        id: `seedt${index + 1}`,
        type: 'payment',
        amount: totals.total,
        label: `Order #${number} · ${campus.stores.find((s) => s.id === storeId).name}`,
        date: placedAt,
      });
    }
    const cups = items.reduce((sum, i) => sum + (i.loyalty === 'coffee' ? i.qty : 0), 0);
    if (cups > 0) history.push({ id: `seedh${index + 1}`, type: 'earned', count: cups, orderId: id, at: placedAt + 5 * 60000 });
  });
  // Newest first, as the app keeps them
  orders.sort((a, b) => b.placedAtMs - a.placedAtMs);
  transactions.sort((a, b) => b.date - a.date);
  history.sort((a, b) => b.at - a.at);
  const paid = transactions.reduce((sum, t) => sum + t.amount, 0);
  const startingCredit = 8000;
  transactions.push(
    { id: 'seedt-topup', type: 'topup', amount: 3000, label: 'Wallet top-up', date: demoNowMs - 12 * DAY },
    { id: 'seedt-welcome', type: 'topup', amount: 5000, label: 'Welcome credit', date: demoNowMs - 21 * DAY }
  );
  transactions.sort((a, b) => b.date - a.date);
  const stamps = history.reduce((sum, h) => sum + h.count, 0);
  return {
    orders,
    wallet: { balance: startingCredit - paid, transactions },
    loyalty: { stamps: stamps % 10, rewards: Math.floor(stamps / 10), history },
  };
};
