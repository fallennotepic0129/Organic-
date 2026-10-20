// Mock store data for the static preview. Prices and copy are placeholders —
// the live store takes these from Shopify admin.

let nextId = 4100;
function makeProduct({ handle, title, type, tags = [], options = 'Size', variants, description }) {
  const vs = variants.map(([vTitle, price, compare = 0]) => ({
    id: nextId++,
    title: vTitle,
    price,
    compare_at_price: compare,
    available: true,
    options: [vTitle],
    option1: vTitle,
    sku: `${handle}-${vTitle}`.toUpperCase().replace(/\s+/g, ''),
    url: `/products/${handle}?variant=${nextId}`,
  }));
  const selected = vs[Math.min(1, vs.length - 1)];
  return {
    id: nextId++,
    handle,
    title,
    type,
    tags,
    url: `/products/${handle}`,
    available: true,
    description,
    has_only_default_variant: false,
    price: selected.price,
    price_min: Math.min(...vs.map((v) => v.price)),
    price_varies: vs.length > 1,
    options: [options],
    options_with_values: [{ name: options, selected_value: selected.title, values: vs.map((v) => v.title) }],
    variants: vs,
    selected_or_first_available_variant: selected,
    media: [],
    featured_image: null,
    metafields: { reviews: {}, custom: {} },
  };
}

export const products = {
  'desi-ghee': makeProduct({
    handle: 'desi-ghee',
    title: 'Bilona Desi Ghee',
    type: 'Ghee',
    variants: [['500 g', 195000], ['1 kg', 370000], ['2 kg', 720000, 740000]],
    description: '<p>Made from the curd of grass-fed cows, hand-churned with a wooden madhani and slow-cooked over a wood fire until golden and danedar. Nothing added — ever.</p>',
  }),
  shilajit: makeProduct({
    handle: 'shilajit',
    title: 'Himalayan Shilajit',
    type: 'Shilajit',
    tags: ['shilajit'],
    variants: [['10 g', 250000], ['20 g', 450000], ['30 g', 620000, 650000]],
    description: '<p>Pure shilajit resin gathered by hand from high cliffs in Gilgit-Baltistan, dissolved in spring water, filtered and slowly sun-dried.</p>',
  }),
};
products['ghee-shilajit-bundle'] = {
  ...makeProduct({ handle: 'ghee-shilajit-bundle', title: 'The Karakoram Ritual Bundle', type: 'Bundle', variants: [['Default Title', 790000, 820000]], description: '' }),
  has_only_default_variant: true,
};

const ghee1kg = products['desi-ghee'].variants[1];
export const cartFilled = {
  item_count: 1,
  total_price: ghee1kg.price,
  note: '',
  currency: { iso_code: 'PKR' },
  items: [{
    key: `${ghee1kg.id}:preview`,
    product_id: products['desi-ghee'].id,
    product: products['desi-ghee'],
    variant: ghee1kg,
    title: 'Bilona Desi Ghee - 1 kg',
    url: '/products/desi-ghee',
    quantity: 1,
    image: null,
    final_price: ghee1kg.price,
    final_line_price: ghee1kg.price,
    url_to_remove: '/cart',
  }],
};
export const cartEmpty = { item_count: 0, total_price: 0, note: '', currency: { iso_code: 'PKR' }, items: [] };

// Preview-only content, clearly marked as samples.
const sampleReviews = [
  [5, 'The smell when I opened the jar took me straight back to my nani\'s kitchen. Proper danedar ghee.', 'Ayesha K.', 'Lahore', 'Bilona Desi Ghee'],
  [5, 'Dissolves completely in warm water, no grit at all. Packaging was beautiful too.', 'Hamza R.', 'Islamabad', 'Himalayan Shilajit'],
  [5, 'We switched from the supermarket brand and the difference in our parathas is unreal.', 'Sana M.', 'Karachi', 'Bilona Desi Ghee'],
  [4, 'Delivered in 3 days with cash on delivery. Will order the 2 kg jar next time.', 'Bilal A.', 'Faisalabad', 'Bilona Desi Ghee'],
  [5, 'Loved that they publish the lab reports. Finally a shilajit I trust.', 'Usman T.', 'Rawalpindi', 'Himalayan Shilajit'],
  [5, 'Ordered the bundle as a gift for my father. He has asked for a second one already.', 'Mahnoor F.', 'Multan', 'The Karakoram Ritual Bundle'],
];
const reviewBlocks = Object.fromEntries(sampleReviews.map(([rating, quote, name, city, product_name], i) => [`r${i}`, { type: 'testimonial', settings: { rating, quote, name, city, product_name, verified: true } }]));

const sampleLab = {
  blocks: {
    a: { type: 'row', settings: { test: 'Fulvic acid', result: '62%', standard: 'Per lab report', pass: true } },
    b: { type: 'row', settings: { test: 'Lead (Pb)', result: '< 0.5 ppm', standard: 'Within safe limit', pass: true } },
    c: { type: 'row', settings: { test: 'Mercury (Hg)', result: 'Not detected', standard: 'Within safe limit', pass: true } },
    d: { type: 'row', settings: { test: 'Arsenic (As)', result: 'Not detected', standard: 'Within safe limit', pass: true } },
    e: { type: 'row', settings: { test: 'Solubility in water', result: '100%', standard: 'Fully soluble', pass: true } },
  },
  settings: { eyebrow: 'Shilajit · sample values', heading: 'Purity & heavy-metal analysis', lab: 'Your lab name', batch: 'KN-SJ-0001', date: '—' },
};
const sampleGheeLab = {
  blocks: {
    a: { type: 'row', settings: { test: 'Moisture', result: '0.1%', standard: 'Per PFA standard', pass: true } },
    b: { type: 'row', settings: { test: 'Free fatty acids', result: '0.8%', standard: 'Per PFA standard', pass: true } },
    c: { type: 'row', settings: { test: 'B.R. reading at 40 °C', result: '42.0', standard: 'Per PFA standard', pass: true } },
    d: { type: 'row', settings: { test: 'Vegetable oil (adulteration)', result: 'Not detected', standard: 'Not detected', pass: true } },
    e: { type: 'row', settings: { test: 'Added colour', result: 'Not detected', standard: 'Not detected', pass: true } },
  },
  settings: { eyebrow: 'Desi ghee · sample values', heading: 'Ghee purity analysis', lab: 'Your lab name', batch: 'KN-GH-0001', date: '—' },
};

export const previewOverrides = {
  index: { reviews: { type: 'reviews', settings: { eyebrow: 'Sample reviews — replace with real ones' }, blocks: reviewBlocks } },
  'page.reviews': { reviews: { type: 'reviews', settings: { eyebrow: 'Sample reviews — replace with real ones', heading: 'What others are saying.' }, blocks: reviewBlocks } },
  'product.shilajit': { lab: { type: 'lab-results', ...sampleLab } },
  'page.lab-reports': { ghee: { type: 'lab-results', ...sampleGheeLab }, shilajit: { type: 'lab-results', ...sampleLab } },
};
