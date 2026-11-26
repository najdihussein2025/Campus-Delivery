import { positiveWholeNumber } from './validation';

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
  const deliveryFee = gross === 0 || subtotal > FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE;
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

export const calcPrintPrice = ({ pages, copies, color, binding, doubleSided }, printPrices) => {
  const p = positiveWholeNumber(pages);
  const c = positiveWholeNumber(copies);
  const rate = color ? printPrices.color : printPrices.bw;
  // Nothing to print (0 or invalid pages / copies): no printing and no binding charge
  const bindingPrice = printPrices.binding[binding] || 0;
  const printedPages = p * c;
  const sheets = (doubleSided ? Math.ceil(p / 2) : p) * c;
  const printing = printedPages * rate;
  const bindingTotal = printedPages ? bindingPrice * c : 0;
  return { rate, printedPages, sheets, printing, bindingPrice, bindingTotal, total: printing + bindingTotal };
};
