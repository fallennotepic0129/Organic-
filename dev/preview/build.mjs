// Static preview renderer for the Mian Dairies theme.
// Renders the real Liquid templates with mock store data so the design can be
// reviewed (and screenshotted) without a Shopify store. Not used by Shopify.
//
//   cd dev && npm install && npm run preview   → dev/preview/dist/*.html

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Liquid, Tag, Hash } from 'liquidjs';
import { products, cartFilled, cartEmpty, previewOverrides } from './mock-data.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(__dirname, 'dist');

const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
// liquidjs doesn't accept "?" in property names.
const preprocess = (src) => src.replace(/posted_successfully\?/g, 'posted_successfully');

const liquidFs = {
  exists: async (f) => fs.existsSync(f),
  existsSync: (f) => fs.existsSync(f),
  readFile: async (f) => preprocess(fs.readFileSync(f, 'utf8')),
  readFileSync: (f) => preprocess(fs.readFileSync(f, 'utf8')),
  resolve: (dir, file, ext) => path.resolve(dir, file.endsWith(ext) ? file : file + ext),
  contains: () => true,
  dirname: (f) => path.dirname(f),
  sep: path.sep,
};

const engine = new Liquid({
  root: [path.join(ROOT, 'snippets')],
  partials: [path.join(ROOT, 'snippets')],
  extname: '.liquid',
  fs: liquidFs,
  strictFilters: true,
  strictVariables: false,
  jsTruthy: false,
});

/* ---------- schema helpers ---------- */
const schemaCache = new Map();
function schemaFor(type) {
  if (!schemaCache.has(type)) {
    const src = read(`sections/${type}.liquid`);
    const m = src.match(/{%-?\s*schema\s*-?%}([\s\S]*?){%-?\s*endschema\s*-?%}/);
    schemaCache.set(type, m ? JSON.parse(m[1]) : {});
  }
  return schemaCache.get(type);
}
function resolveSetting(def, value) {
  if (def?.type === 'product') return typeof value === 'string' ? products[value] || null : value ?? null;
  if (def?.type === 'product_list') return (value || []).map((h) => products[h]).filter(Boolean);
  if (def?.type === 'link_list') return value || '';
  return value;
}
function buildSettings(defs = [], values = {}) {
  const out = {};
  for (const d of defs) {
    if (!d.id) continue;
    const v = Object.prototype.hasOwnProperty.call(values, d.id) ? values[d.id] : d.default;
    out[d.id] = resolveSetting(d, v);
  }
  return out;
}
function buildSection(type, id, data = {}) {
  const schema = schemaFor(type);
  const blockDefs = Object.fromEntries((schema.blocks || []).map((b) => [b.type, b]));
  let blocks;
  if (data.blocks) {
    const order = data.block_order || Object.keys(data.blocks);
    blocks = order.map((key) => {
      const b = data.blocks[key];
      return { id: key, type: b.type, shopify_attributes: '', settings: buildSettings(blockDefs[b.type]?.settings, b.settings) };
    });
  } else {
    const defaults = schema.default?.blocks || [];
    blocks = defaults.map((b, i) => ({ id: `${type}-${i}`, type: b.type, shopify_attributes: '', settings: buildSettings(blockDefs[b.type]?.settings, b.settings) }));
  }
  return { id, type, settings: buildSettings(schema.settings, data.settings), blocks, schema };
}

let globals = {};

async function renderSection(type, id, data) {
  const section = buildSection(type, id, data);
  const src = preprocess(read(`sections/${type}.liquid`));
  const html = await engine.parseAndRender(src, { ...globals, section }, { globals });
  const tag = section.schema.tag || 'div';
  return `<${tag} id="shopify-section-${id}" class="shopify-section ${section.schema.class || ''}">${html}</${tag}>`;
}

/* ---------- Shopify tags ---------- */
class IgnoreBlock extends Tag {
  constructor(token, remainTokens, liquid) {
    super(token, remainTokens, liquid);
    while (remainTokens.length) {
      const t = remainTokens.shift();
      if (t.name === `end${token.name}`) return;
    }
    throw new Error(`unclosed ${token.name}`);
  }
  *render() {}
}
['schema', 'stylesheet', 'javascript'].forEach((n) => engine.registerTag(n, IgnoreBlock));

engine.registerTag('section', class extends Tag {
  constructor(token, remainTokens, liquid) {
    super(token, remainTokens, liquid);
    this.type = token.args.trim().replace(/^['"]|['"]$/g, '');
  }
  *render(ctx, emitter) {
    emitter.write(yield renderSection(this.type, this.type, {}));
  }
});

engine.registerTag('form', class extends Tag {
  constructor(token, remainTokens, liquid) {
    super(token, remainTokens, liquid);
    const args = token.args;
    this.formType = (args.match(/^\s*['"]([^'"]+)['"]/) || [])[1];
    const rest = args.replace(/^\s*['"][^'"]+['"]\s*,?\s*/, '').replace(/^[\w.]+\s*(,|$)/, (m) => (m.includes(':') ? m : ''));
    this.hash = new Hash(rest);
    this.templates = [];
    const stream = liquid.parser.parseStream(remainTokens)
      .on('tag:endform', () => stream.stop())
      .on('template', (tpl) => this.templates.push(tpl))
      .on('end', () => { throw new Error('form not closed'); });
    stream.start();
  }
  *render(ctx, emitter) {
    const hash = yield this.hash.render(ctx);
    const actions = { product: '/cart/add', contact: '/contact', customer: '/contact', storefront_password: '/password' };
    const attrs = Object.entries(hash).map(([k, v]) => `${k}="${v ?? ''}"`).join(' ');
    emitter.write(`<form method="post" action="${actions[this.formType] || '/account'}" accept-charset="UTF-8" ${attrs}>`);
    ctx.push({ form: { posted_successfully: false, errors: null } });
    yield this.liquid.renderer.renderTemplates(this.templates, ctx, emitter);
    ctx.pop();
    emitter.write('</form>');
  }
});

engine.registerTag('paginate', class extends Tag {
  constructor(token, remainTokens, liquid) {
    super(token, remainTokens, liquid);
    this.templates = [];
    const stream = liquid.parser.parseStream(remainTokens)
      .on('tag:endpaginate', () => stream.stop())
      .on('template', (tpl) => this.templates.push(tpl))
      .on('end', () => { throw new Error('paginate not closed'); });
    stream.start();
  }
  *render(ctx, emitter) {
    ctx.push({ paginate: { pages: 1 } });
    yield this.liquid.renderer.renderTemplates(this.templates, ctx, emitter);
    ctx.pop();
  }
});

/* ---------- Shopify filters ---------- */
const locale = JSON.parse(read('locales/en.default.json'));
const named = (args) => Object.fromEntries(args.filter(Array.isArray));
const money = (cents, trim) => {
  const v = (Number(cents) || 0) / 100;
  const s = v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `Rs.${trim ? s.replace(/\.00$/, '') : s}`;
};
const filters = {
  asset_url: (v) => `assets/${v}`,
  stylesheet_tag: (v) => `<link href="${v}" rel="stylesheet" type="text/css" media="all" />`,
  money: (v) => money(v),
  money_without_trailing_zeros: (v) => money(v, true),
  money_without_currency: (v) => ((Number(v) || 0) / 100).toFixed(2),
  t(key, ...args) {
    const vars = named(args);
    const val = key.split('.').reduce((o, k) => (o ? o[k] : undefined), locale);
    return String(val ?? key).replace(/{{\s*(\w+)\s*}}/g, (_, k) => vars[k] ?? '');
  },
  image_url: (v) => (v && v.src) || '',
  image_tag: (v, ...args) => {
    const n = named(args);
    return v ? `<img src="${v}" alt="${n.alt || ''}" class="${n.class || ''}" loading="${n.loading || 'lazy'}">` : '';
  },
  handleize: (v) => String(v).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
  default_pagination: () => '',
  default_errors: () => '',
  format_address: (v) => String(v || ''),
  format_code: (v) => v,
  payment_button: () => '<button type="button" class="btn btn--outline btn--block shopify-payment-button__button"><span class="btn__label">Buy it now</span></button>',
  at_least: (v, n) => Math.max(Number(v), Number(n)),
  at_most: (v, n) => Math.min(Number(v), Number(n)),
};
Object.entries(filters).forEach(([k, fn]) => engine.registerFilter(k, fn));

/* ---------- globals ---------- */
const settingsSchema = JSON.parse(read('config/settings_schema.json'));
const settingsData = JSON.parse(read('config/settings_data.json'));
const settingDefs = settingsSchema.flatMap((g) => g.settings || []);
const themeSettings = {
  ...buildSettings(settingDefs, settingsData.presets[settingsData.current] || {}),
  upsell_product: products.shilajit,
  social_instagram: 'https://instagram.com/',
  social_facebook: 'https://facebook.com/',
  social_tiktok: 'https://tiktok.com/',
};

const shop = {
  name: 'Mian Dairies',
  url: 'https://miandairies.pk',
  description: 'Pure bilona desi ghee and Himalayan shilajit.',
  money_format: 'Rs.{{amount}}',
  customer_accounts_enabled: true,
  password_message: '',
  policies: [
    { title: 'Refund policy', url: '/policies/refund-policy' },
    { title: 'Shipping policy', url: '/policies/shipping-policy' },
    { title: 'Privacy policy', url: '/policies/privacy-policy' },
  ],
};
const routes = {
  root_url: '/', cart_url: '/cart', cart_add_url: '/cart/add', cart_change_url: '/cart/change',
  all_products_collection_url: '/collections/all', account_url: '/account', account_login_url: '/account/login',
  account_register_url: '/account/register', account_logout_url: '/account/logout', account_addresses_url: '/account/addresses',
  search_url: '/search', collections_url: '/collections',
};

/* ---------- pages ---------- */
const pages = [
  { out: 'index.html', template: 'index', name: 'index', title: 'Mian Dairies — Pure desi ghee & Himalayan shilajit' },
  { out: 'product-ghee.html', template: 'product', name: 'product', product: 'desi-ghee', title: 'Bilona Desi Ghee' },
  { out: 'product-shilajit.html', template: 'product.shilajit', name: 'product', suffix: 'shilajit', product: 'shilajit', title: 'Himalayan Shilajit' },
  { out: 'lab-reports.html', template: 'page.lab-reports', name: 'page', suffix: 'lab-reports', page: 'Lab reports & certificates' },
  { out: 'our-story.html', template: 'page.our-story', name: 'page', suffix: 'our-story', page: 'Our story' },
  { out: 'reviews.html', template: 'page.reviews', name: 'page', suffix: 'reviews', page: 'Reviews' },
  { out: 'faq.html', template: 'page.faq', name: 'page', suffix: 'faq', page: 'FAQ' },
  { out: 'contact.html', template: 'page.contact', name: 'page', suffix: 'contact', page: 'Contact' },
  { out: 'track-order.html', template: 'page.track-order', name: 'page', suffix: 'track-order', page: 'Track your order' },
  { out: 'shop.html', template: 'collection', name: 'collection', title: 'Shop all' },
  { out: 'cart.html', template: 'cart', name: 'cart', title: 'Your cart', cart: 'filled' },
  { out: '404.html', template: '404', name: '404', title: 'Page not found' },
];

const linkMap = [
  [/href="\/products\/desi-ghee(#[^"]*)?"/g, 'href="product-ghee.html$1"'],
  [/href="\/products\/shilajit(#[^"]*)?"/g, 'href="product-shilajit.html$1"'],
  [/href="\/products\/ghee-shilajit-bundle"/g, 'href="shop.html"'],
  [/href="\/pages\/([\w-]+)"/g, 'href="$1.html"'],
  [/href="\/collections\/all"/g, 'href="shop.html"'],
  [/href="\/cart"/g, 'href="cart.html"'],
  [/href="\/"/g, 'href="index.html"'],
];
const rewrite = (html) => linkMap.reduce((h, [re, to]) => h.replace(re, to), html)
  .replace('<script src="assets/theme.js" defer></script>', '<script src="preview-shim.js"></script>\n    <script src="assets/theme.js" defer></script>');

async function build() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });
  for (const f of fs.readdirSync(path.join(ROOT, 'assets'))) fs.copyFileSync(path.join(ROOT, 'assets', f), path.join(OUT, 'assets', f));

  const layout = preprocess(read('layout/theme.liquid'));
  for (const p of pages) {
    const product = p.product ? products[p.product] : null;
    globals = {
      settings: themeSettings, shop, routes, linklists: {},
      cart: p.cart === 'filled' ? cartFilled : cartEmpty,
      request: { locale: { iso_code: 'en' }, page_type: p.name, origin: shop.url, design_mode: false },
      template: { name: p.name, suffix: p.suffix || null },
      product,
      collection: p.name === 'collection' ? { title: 'Shop all', description: '', products: [products['desi-ghee'], products.shilajit] } : null,
      page: p.page ? { title: p.page, content: '', handle: p.suffix } : null,
      page_title: p.title || p.page || product?.title,
      page_description: shop.description,
      canonical_url: `${shop.url}/`,
      content_for_header: '',
    };
    const tpl = JSON.parse(read(`templates/${p.template}.json`));
    const overrides = previewOverrides[p.template] || {};
    let body = '';
    for (const id of tpl.order) {
      const data = overrides[id] ? { ...tpl.sections[id], ...overrides[id], block_order: overrides[id].block_order } : tpl.sections[id];
      if (data.disabled) continue;
      body += await renderSection(data.type, id, data);
    }
    const html = await engine.parseAndRender(layout, { ...globals, content_for_layout: body }, { globals });
    fs.writeFileSync(path.join(OUT, p.out), rewrite(html));
    console.log('✓', p.out);
  }

  // Cart drawer states for the preview shim (fake AJAX cart).
  globals = { ...globals, cart: cartFilled, template: { name: 'index' } };
  const filled = await renderSection('cart-drawer', 'cart-drawer', {});
  globals = { ...globals, cart: cartEmpty };
  const empty = await renderSection('cart-drawer', 'cart-drawer', {});
  fs.writeFileSync(path.join(OUT, 'preview-shim.js'), `${fs.readFileSync(path.join(__dirname, 'preview-shim.js'), 'utf8')}
window.__PREVIEW_CART__ = ${JSON.stringify({ filled, empty })};`);
  console.log('✓ preview-shim.js');
}

build().catch((e) => { console.error(e); process.exit(1); });
