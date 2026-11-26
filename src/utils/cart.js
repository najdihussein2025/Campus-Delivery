import { calcPrintPrice, formatMoney } from './money';
import { positiveWholeNumber } from './validation';

export const hasProductOptions = (product) => Boolean(
  product?.options?.sizes?.length || product?.options?.coverColors?.length || product?.options?.extras?.length
);

export const prepareReorder = (order, getProduct, printPrices) => {
  const items = [];
  const skipped = [];
  const adjusted = [];
  order.items.forEach((item) => {
    if (item.type === 'print') {
      const print = printOptionsFor(item);
      items.push({ ...item, unitPrice: print && printPrices ? calcPrintPrice(print, printPrices).total : item.unitPrice });
      return;
    }
    const product = getProduct(item.productId);
    if (!product?.inStock || product.storeId !== order.storeId) {
      skipped.push(item.name);
      return;
    }
    const [, legacyVariant, legacyExtras] = item.key?.split('|') || [];
    const variantLabel = item.configuration?.variant?.label || legacyVariant;
    const savedExtras = item.configuration?.extras?.map(({ label }) => label) || legacyExtras?.split(',').filter(Boolean) || [];
    const variants = product.options?.coverColors || product.options?.sizes || [];
    const variant = variants.find(({ label }) => label === variantLabel) || variants[0] || null;
    const extras = (product.options?.extras || [])
      .filter(({ label }) => savedExtras.includes(label)).sort((a, b) => a.label.localeCompare(b.label));
    if ((variant?.label || '') !== (variantLabel || '') || extras.length !== savedExtras.length) adjusted.push(product.name);
    items.push({
      ...item,
      key: `${product.id}|${variant?.label || ''}|${extras.map(({ label }) => label).sort().join(',')}`,
      name: product.name,
      category: product.category,
      loyalty: product.loyalty || null,
      details: [variant?.label, ...extras.map(({ label }) => label)].filter(Boolean).join(' · '),
      configuration: {
        variant: variant ? { label: variant.label, extra: variant.extra } : null,
        extras: extras.map(({ label, extra }) => ({ label, extra })),
      },
      unitPrice: product.price + (variant?.extra ?? 0) + extras.reduce((sum, { extra }) => sum + extra, 0),
    });
  });
  return { items, skipped, adjusted };
};

export const printOptionsFor = (item) => {
  const details = item.details || '';
  const pages = item.file?.pages ?? item.printOptions?.pages ?? /\b(\d+) pages?\b/.exec(details)?.[1];
  if (item.printOptions) return { ...item.printOptions, pages: Number(pages) };
  const copies = /\b(\d+) cop(?:y|ies)\b/.exec(details)?.[1];
  if (!pages || !copies) return null;
  return {
    pages: Number(pages),
    copies: Number(copies),
    color: /\bColor\b/i.test(details),
    doubleSided: /\bDouble-sided\b/i.test(details),
    binding: /\bspiral\b/i.test(details) ? 'spiral' : /\bstaple\b/i.test(details) ? 'staple' : 'none',
  };
};

export const countPrintedPages = (items) => items.reduce((total, item) => {
  if (item.type !== 'print') return total;
  const print = printOptionsFor(item);
  const pages = positiveWholeNumber(print?.pages);
  const copies = positiveWholeNumber(print?.copies);
  const quantity = positiveWholeNumber(item.qty);
  return pages && copies && quantity ? total + pages * copies * quantity : Infinity;
}, 0);

export const getPrintOrderIssue = (items, maxPages) => {
  const total = countPrintedPages(items);
  if (!Number.isFinite(total)) return 'Prepare the print jobs again with valid page and copy counts.';
  return total > maxPages ? 'The order is limited to ' + maxPages + ' printed pages across all jobs.' : '';
};

export const getCartItemIssue = (item, getProduct, maxPrintPages, storeId) => {
  if (item.type === 'product') {
    const product = getProduct(item.productId);
    if (!product?.inStock || product.storeId !== storeId) return 'Out of stock or no longer available.';
  }
  const print = item.type === 'print' ? printOptionsFor(item) : null;
  if (item.type === 'print' && !print) return 'Prepare this print job again.';
  if (print) {
    const pages = positiveWholeNumber(print.pages);
    const copies = positiveWholeNumber(print.copies);
    if (!pages || !copies || pages * copies > maxPrintPages) {
      return `Prepare this print job again. The limit is ${maxPrintPages} printed pages per job.`;
    }
  }
  return '';
};

export const bagItemDetails = (item) => {
  const print = item.type === 'print' ? printOptionsFor(item) : null;
  if (print?.pages) {
    const { pages, copies, color, doubleSided, binding } = print;
    return [
      `${pages} ${pages === 1 ? 'page' : 'pages'} per copy · ${copies} ${copies === 1 ? 'copy' : 'copies'}`,
      `${color ? 'Color' : 'Black & White'} · ${doubleSided ? 'Double-sided' : 'Single-sided'}`,
      { none: 'No binding', staple: 'Staple', spiral: 'Spiral' }[binding],
    ].filter(Boolean).join('\n');
  }
  if (item.configuration) {
    const { variant, extras } = item.configuration;
    return [variant, ...(extras || [])].filter(Boolean)
      .map(({ label, extra }) => extra ? `${label} (+${formatMoney(extra)})` : label)
      .join(' · ');
  }
  return item.details || '';
};
