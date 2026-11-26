import { formatTime } from './time';

const deliveryDateFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

export const isPastOrder = (status) => status === 'Delivered' || status === 'Cancelled';

export const deliveryBreakLabel = (slot) => {
  if (!slot?.label) return '';
  return slot.label.replace(/\s*\(long break\)(?:\s+break)?\s*$/i, ' · Long break');
};

export const scheduledEta = (order) => !order.cancelled && order.scheduledDelivery
  ? formatTime(new Date(order.scheduledDelivery.delivered)) : '';

export const deliveryDateLabel = (order) => {
  const [year, month, day] = (order.deliveryDate || '').split('-').map(Number);
  const placed = order.placedAt ?? order.placedAtMs;
  const date = year && month && day ? new Date(year, month - 1, day) : placed != null ? new Date(placed) : null;
  return date && Number.isFinite(date.getTime()) ? deliveryDateFormat.format(date) : '';
};

export const orderTotals = (order) => ({
  gross: order.gross ?? order.subtotal + (order.discount ?? 0),
  subtotal: order.subtotal,
  discount: order.discount ?? 0,
  deliveryFee: order.deliveryFee,
  total: order.total,
});
