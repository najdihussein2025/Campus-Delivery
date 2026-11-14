import { getOrderStatus } from './orderStatus';

// Loyalty stamps: every 10th coffee is free. Pure functions, no React.
export const STAMPS_PER_REWARD = 10;

export const emptyLoyalty = () => ({ stamps: 0, rewards: 0, history: [] });

const entry = (type, count, orderId, at) => ({
  id: `h${at}${Math.floor(Math.random() * 100000)}`,
  type,
  count,
  orderId,
  at,
});

// Number of coffee cups in a list of cart/order items (quantity counts)
export const coffeeCount = (items) =>
  items.reduce((sum, item) => sum + (item.loyalty === 'coffee' ? item.qty : 0), 0);

// Stamps an order earns: one per coffee, and the free coffee itself does not earn one
export const stampsForOrder = (order) => Math.max(0, coffeeCount(order.items) - (order.rewardUsed ? 1 : 0));

// The free coffee is the most expensive single coffee in the bag (size included, extras paid)
export const rewardDiscount = (items) =>
  items.reduce((best, item) => (item.loyalty === 'coffee' ? Math.max(best, item.unitPrice) : best), 0);

export const canUseReward = (items, loyalty) => loyalty.rewards > 0 && coffeeCount(items) > 0;

// Add stamps; every 10 become a reward and the remainder carries over
export const addStamps = (loyalty, count, orderId, at) => {
  if (count <= 0) return { loyalty, completed: false };
  const total = loyalty.stamps + count;
  const newRewards = Math.floor(total / STAMPS_PER_REWARD);
  return {
    completed: newRewards > 0,
    loyalty: {
      stamps: total % STAMPS_PER_REWARD,
      rewards: loyalty.rewards + newRewards,
      history: [entry('earned', count, orderId, at), ...loyalty.history],
    },
  };
};

// The reward is used when the order is placed...
export const consumeReward = (loyalty, orderId, at) => ({
  ...loyalty,
  rewards: Math.max(0, loyalty.rewards - 1),
  history: [entry('redeemed', 1, orderId, at), ...loyalty.history],
});

// ...and given back if that order is cancelled
export const refundReward = (loyalty, orderId, at) => ({
  ...loyalty,
  rewards: loyalty.rewards + 1,
  history: [entry('refunded', 1, orderId, at), ...loyalty.history],
});

// Idempotent: credits every Delivered order not yet credited, then flags it, so running it twice changes nothing.
// Returns { changed, orders, loyalty, credited: [{ orderId, stamps, completed }] }
export const settleDeliveredOrders = (orders, loyalty, nowMs) => {
  let nextLoyalty = loyalty;
  const credited = [];
  let changed = false;
  const nextOrders = orders.map((order) => {
    if (order.stampsCredited || getOrderStatus(order, nowMs) !== 'Delivered') return order;
    changed = true;
    const stamps = stampsForOrder(order);
    if (stamps > 0) {
      const result = addStamps(nextLoyalty, stamps, order.id, nowMs);
      nextLoyalty = result.loyalty;
      credited.push({ orderId: order.id, stamps, completed: result.completed });
    }
    return { ...order, stampsCredited: true };
  });
  return { changed, orders: changed ? nextOrders : orders, loyalty: nextLoyalty, credited };
};

// Will this order complete a card? Counts earlier uncredited orders too. Used for the "Delivered" notification.
export const willCompleteCard = (loyalty, orders, order) => {
  const pending = orders
    .filter((o) => o.id !== order.id && !o.cancelled && !o.stampsCredited && o.placedAtMs < order.placedAtMs)
    .reduce((sum, o) => sum + stampsForOrder(o), 0);
  const earned = stampsForOrder(order);
  return earned > 0 && ((loyalty.stamps + pending) % STAMPS_PER_REWARD) + earned >= STAMPS_PER_REWARD;
};

export const describeProgress = (loyalty) => {
  if (loyalty.rewards > 0) {
    return loyalty.rewards === 1 ? '🎁 You have 1 free coffee' : `🎁 You have ${loyalty.rewards} free coffees`;
  }
  const left = STAMPS_PER_REWARD - loyalty.stamps;
  return `${loyalty.stamps} / ${STAMPS_PER_REWARD} – ${left} more ${left === 1 ? 'coffee' : 'coffees'} for a free one`;
};
