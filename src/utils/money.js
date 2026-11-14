export const MIN_ORDER = 200;
export const FREE_DELIVERY_OVER = 1000;
export const DELIVERY_FEE = 50;

export const formatMoney = (cents) => {
  const sign = cents < 0 ? '-' : '';
  return `${sign}$${(Math.abs(cents) / 100).toFixed(2)}`;
};

// Business rules: minimum order $2, free delivery above $10, otherwise $0.50.
// `discount` is the loyalty reward: the minimum and the free-delivery threshold use the subtotal AFTER it.
export const calcCartTotals = (items, discount = 0) => {
  const gross = items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  const applied = Math.min(Math.max(0, discount), gross);
  const subtotal = gross - applied;
  const deliveryFee = subtotal === 0 || subtotal > FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE;
  return {
    gross,
    discount: applied,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    count: items.reduce((sum, item) => sum + item.qty, 0),
    missingForMinimum: Math.max(0, MIN_ORDER - subtotal),
    missingForFreeDelivery: subtotal > FREE_DELIVERY_OVER ? 0 : FREE_DELIVERY_OVER + 1 - subtotal,
  };
};

export const calcPrintPrice = ({ pages, copies, color, binding }, printPrices) => {
  const p = parseInt(pages, 10) || 0;
  const c = parseInt(copies, 10) || 0;
  const rate = color ? printPrices.color : printPrices.bw;
  const bindingPrice = printPrices.binding[binding] || 0;
  const printing = p * c * rate;
  const bindingTotal = bindingPrice * c;
  return { rate, printing, bindingPrice, bindingTotal, total: printing + bindingTotal };
};
