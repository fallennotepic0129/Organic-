// Preview only: fakes Shopify's AJAX cart so the cart drawer works in the static preview.
(() => {
  const realFetch = window.fetch.bind(window);
  let count = 0;
  const reply = (body) => Promise.resolve(new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } }));
  const drawer = () => (count > 0 ? window.__PREVIEW_CART__.filled : window.__PREVIEW_CART__.empty);
  window.fetch = (url, opts = {}) => {
    const u = String(url);
    if (u.includes('/cart/add.js')) { count = 1; return reply({ sections: { 'cart-drawer': drawer() } }); }
    if (u.includes('/cart/change.js')) {
      const { quantity } = JSON.parse(opts.body || '{}');
      count = quantity > 0 ? 1 : 0;
      return reply({ sections: { 'cart-drawer': drawer() } });
    }
    if (u.includes('sections=cart-drawer')) return reply({ 'cart-drawer': drawer() });
    return realFetch(url, opts);
  };
})();
