// Local product photos and store logos (free licences, see assets/CREDITS.md).
// Metro needs STATIC require() calls, so there is one line per file, and only for files that exist in assets/.
// (campus.json cannot hold require(), which is why the images are mapped here by id.)
// A product or store without a line here falls back to the gradient tile with a category icon.
//
// To add or replace a photo: drop assets/products/<id>.jpg (600x600, under 80 KB), add one line below
// and add its credit to assets/CREDITS.md and src/data/credits.js.

export const productImages = {
  p01: require('../../assets/products/p01.jpg'),
  p02: require('../../assets/products/p02.jpg'),
  p03: require('../../assets/products/p03.jpg'),
  p04: require('../../assets/products/p04.jpg'),
  p05: require('../../assets/products/p05.jpg'),
  p06: require('../../assets/products/p06.jpg'),
  p07: require('../../assets/products/p07.jpg'),
  p08: require('../../assets/products/p08.jpg'),
  p09: require('../../assets/products/p09.jpg'),
  p10: require('../../assets/products/p10.jpg'),
  p11: require('../../assets/products/p11.jpg'),
  p12: require('../../assets/products/p12.jpg'),
  p13: require('../../assets/products/p13.jpg'),
  p14: require('../../assets/products/p14.jpg'),
  p15: require('../../assets/products/p15.jpg'),
  p16: require('../../assets/products/p16.jpg'),
  p17: require('../../assets/products/p17.jpg'),
  'coffee-decaf-demo': require('../../assets/products/coffee-decaf-demo.jpg'),
  p18: require('../../assets/products/p18.jpg'),
  p19: require('../../assets/products/p19.jpg'),
  p20: require('../../assets/products/p20.jpg'),
  p21: require('../../assets/products/p21.jpg'),
  p22: require('../../assets/products/p22.jpg'),
  p23: require('../../assets/products/p23.jpg'),
  p24: require('../../assets/products/p24.jpg'),
  p25: require('../../assets/products/p25.jpg'),
  p26: require('../../assets/products/p26.jpg'),
  p27: require('../../assets/products/p27.jpg'),
  p28: require('../../assets/products/p28.jpg'),
};

export const storeLogos = {
  cafeteria: require('../../assets/stores/cafeteria.jpg'),
  coffee: require('../../assets/stores/coffee.jpg'),
  bookstore: require('../../assets/stores/bookstore.jpg'),
  printing: require('../../assets/stores/printing.jpg'),
};

// Compact views share these derivatives; cards and detail screens keep the original photos.
const productThumbnails = {
  p01: require('../../assets/products/thumbnails/p01.jpg'),
  p02: require('../../assets/products/thumbnails/p02.jpg'),
  p03: require('../../assets/products/thumbnails/p03.jpg'),
  p04: require('../../assets/products/thumbnails/p04.jpg'),
  p05: require('../../assets/products/thumbnails/p05.jpg'),
  p06: require('../../assets/products/thumbnails/p06.jpg'),
  p07: require('../../assets/products/thumbnails/p07.jpg'),
  p08: require('../../assets/products/thumbnails/p08.jpg'),
  p09: require('../../assets/products/thumbnails/p09.jpg'),
  p10: require('../../assets/products/thumbnails/p10.jpg'),
  p11: require('../../assets/products/thumbnails/p11.jpg'),
  p12: require('../../assets/products/thumbnails/p12.jpg'),
  p13: require('../../assets/products/thumbnails/p13.jpg'),
  p14: require('../../assets/products/thumbnails/p14.jpg'),
  p15: require('../../assets/products/thumbnails/p15.jpg'),
  p16: require('../../assets/products/thumbnails/p16.jpg'),
  p17: require('../../assets/products/thumbnails/p17.jpg'),
  'coffee-decaf-demo': require('../../assets/products/thumbnails/coffee-decaf-demo.jpg'),
  p18: require('../../assets/products/thumbnails/p18.jpg'),
  p19: require('../../assets/products/thumbnails/p19.jpg'),
  p20: require('../../assets/products/thumbnails/p20.jpg'),
  p21: require('../../assets/products/thumbnails/p21.jpg'),
  p22: require('../../assets/products/thumbnails/p22.jpg'),
  p23: require('../../assets/products/thumbnails/p23.jpg'),
  p24: require('../../assets/products/thumbnails/p24.jpg'),
  p25: require('../../assets/products/thumbnails/p25.jpg'),
  p26: require('../../assets/products/thumbnails/p26.jpg'),
  p27: require('../../assets/products/thumbnails/p27.jpg'),
  p28: require('../../assets/products/thumbnails/p28.jpg'),
};

const storeThumbnails = {
  cafeteria: require('../../assets/stores/thumbnails/cafeteria.jpg'),
  coffee: require('../../assets/stores/thumbnails/coffee.jpg'),
  bookstore: require('../../assets/stores/thumbnails/bookstore.jpg'),
  printing: require('../../assets/stores/thumbnails/printing.jpg'),
};

export const getProductThumbnail = (id) => productThumbnails[id] || null;
export const getStoreThumbnail = (id) => storeThumbnails[id] || null;

export const getProductImage = (productId) => (productId && productImages[productId]) || null;
export const getStoreLogo = (storeId) => (storeId && storeLogos[storeId]) || null;
