// Dietary filters and seasonal banners. Pure functions, no React.
export const DIET_TAGS = [
  { id: 'vegetarian', label: 'Vegetarian', emoji: '🥗' },
  { id: 'vegan', label: 'Vegan', emoji: '🌱' },
  { id: 'siyami', label: 'Siyami', emoji: '✝️' },
  { id: 'halal', label: 'Halal', emoji: '☪️' },
  { id: 'iftar', label: 'Iftar', emoji: '🌙' },
];

export const tagMeta = (id) => DIET_TAGS.find((t) => t.id === id);
export const tagLabel = (id) => (tagMeta(id) ? tagMeta(id).label : id);

// The product must have ALL selected tags
export const matchesDiet = (product, selectedTags) => {
  if (!selectedTags || selectedTags.length === 0) return true;
  const tags = product.tags || [];
  return selectedTags.every((tag) => tags.includes(tag));
};

const pad = (n) => String(n).padStart(2, '0');
export const toDateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// Seasons whose [start, end] range includes the (demo clock) date. Several can be active at once.
export const activeSeasons = (seasons, now) => {
  const key = toDateKey(now instanceof Date ? now : new Date(now));
  return (seasons || []).filter((s) => s.start <= key && key <= s.end);
};

export const SEASON_BANNERS = {
  lent: { text: 'Lent – Siyami options are marked ✝️', icon: 'leaf' },
  ramadan: { text: 'Ramadan Kareem 🌙 – order an iftar pack before sunset', icon: 'moon' },
};

// Info line for the product sheet: "Contains: nuts, gluten"
export const allergenLine = (product) =>
  product.allergens && product.allergens.length ? `Contains: ${product.allergens.join(', ')}` : '';
