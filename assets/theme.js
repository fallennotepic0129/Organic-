/* Mian Dairies — core storefront behaviour (works without the motion layer). */
(() => {
  const MD = (window.MD = window.MD || {});
  MD.routes = MD.routes || { root: '/', cart: '/cart', cartAdd: '/cart/add', cartChange: '/cart/change' };
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---------- money ---------- */
  const delimit = (n, decimals, thousands = ',', decimal = '.') => {
    const [int, frac] = n.toFixed(decimals).split('.');
    return int.replace(/\B(?=(\d{3})+(?!\d))/g, thousands) + (frac ? decimal + frac : '');
  };
  MD.formatMoney = (cents) => {
    const value = cents / 100;
    const format = MD.moneyFormat || 'Rs.{{amount}}';
    return format.replace(/\{\{\s*(\w+)\s*\}\}/, (_, key) => {
      switch (key) {
        case 'amount_no_decimals': return delimit(value, 0);
        case 'amount_with_comma_separator': return delimit(value, 2, '.', ',');
        case 'amount_no_decimals_with_comma_separator': return delimit(value, 0, '.', ',');
        default: return delimit(value, 2);
      }
    });
  };
  MD.money = (cents) => MD.formatMoney(cents).replace(/[.,]00(?!\d)/, '');

  /* ---------- scroll lock (cooperates with Lenis) ---------- */
  const lock = (on) => {
    document.documentElement.style.overflow = on ? 'hidden' : '';
    if (MD.lenis) on ? MD.lenis.stop() : MD.lenis.start();
  };

  /* ---------- cart ---------- */
  const drawer = () => $('[data-cart-drawer]');
  MD.cart = {
    open() {
      const d = drawer();
      if (!d) { window.location.href = MD.routes.cart; return; }
      d.classList.add('is-open');
      d.setAttribute('aria-hidden', 'false');
      lock(true);
      setTimeout(() => $('.drawer__panel', d)?.focus(), 60);
    },
    close() {
      const d = drawer();
      if (!d || !d.classList.contains('is-open')) return;
      d.classList.remove('is-open');
      d.setAttribute('aria-hidden', 'true');
      lock(false);
    },
    render(html) {
      if (!html) return;
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const fresh = $('[data-cart-drawer-inner]', doc);
      const current = $('[data-cart-drawer-inner]');
      if (fresh && current) current.replaceWith(fresh);
      const count = parseInt(fresh?.dataset.itemCount || '0', 10);
      $$('[data-cart-count]').forEach((el) => {
        el.textContent = count;
        el.classList.toggle('is-empty', count === 0);
        el.classList.remove('is-bump');
        void el.offsetWidth;
        el.classList.add('is-bump');
      });
      document.dispatchEvent(new CustomEvent('md:cart-updated', { detail: { count } }));
    },
    async refresh() {
      const res = await fetch(`${MD.routes.root.replace(/\/$/, '')}/?sections=cart-drawer`);
      const data = await res.json();
      this.render(data['cart-drawer']);
    },
    async add(form) {
      const body = new FormData(form);
      body.append('sections', 'cart-drawer');
      body.append('sections_url', window.location.pathname);
      const res = await fetch(`${MD.routes.cartAdd}.js`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body,
      });
      const data = await res.json();
      if (!res.ok || data.status) throw new Error(data.description || data.message || 'Could not add to cart');
      if (data.sections && data.sections['cart-drawer']) this.render(data.sections['cart-drawer']);
      else await this.refresh();
      this.open();
    },
    async change(key, quantity) {
      const res = await fetch(`${MD.routes.cartChange}.js`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id: key, quantity, sections: ['cart-drawer'], sections_url: window.location.pathname }),
      });
      const data = await res.json();
      if (data.sections) this.render(data.sections['cart-drawer']);
    },
  };

  const flashError = (form, message) => {
    let el = $('.form-error', form);
    if (!el) {
      el = document.createElement('p');
      el.className = 'form-error errors';
      el.setAttribute('role', 'alert');
      form.appendChild(el);
    }
    el.textContent = message;
    setTimeout(() => el.remove(), 5000);
  };

  document.addEventListener('submit', async (event) => {
    const form = event.target.closest('[data-product-form]');
    if (!form) return;
    event.preventDefault();
    const buttons = $$(`[type="submit"]`, form).concat(form.id ? $$(`[form="${form.id}"]`) : []);
    buttons.forEach((b) => { b.classList.add('is-loading'); b.setAttribute('aria-busy', 'true'); });
    try {
      await MD.cart.add(form);
    } catch (err) {
      flashError(form, err.message);
    } finally {
      buttons.forEach((b) => { b.classList.remove('is-loading'); b.removeAttribute('aria-busy'); });
    }
  });

  /* ---------- delegated clicks ---------- */
  document.addEventListener('click', (event) => {
    const t = event.target;
    if (t.closest('[data-cart-open]')) {
      event.preventDefault();
      MD.cart.open();
      return;
    }
    if (t.closest('[data-cart-close]')) {
      const link = t.closest('a[href]');
      if (!link) event.preventDefault();
      MD.cart.close();
      return;
    }
    const change = t.closest('[data-line-change]');
    if (change) {
      const key = change.closest('[data-line-key]')?.dataset.lineKey;
      if (key) {
        change.disabled = true;
        MD.cart.change(key, parseInt(change.dataset.lineChange, 10));
      }
      return;
    }
    const step = t.closest('[data-qty-step]');
    if (step) {
      const input = $('input', step.closest('[data-qty]'));
      input.value = Math.max(1, (parseInt(input.value, 10) || 1) + parseInt(step.dataset.qtyStep, 10));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }
    const wa = t.closest('[data-whatsapp-order]');
    if (wa) {
      const section = wa.closest('[data-product-section]') || document;
      const variant = $('[data-sticky-variant]', section)?.textContent.replace(/·\s*$/, '').trim();
      const qty = $('input[name="quantity"]', section)?.value || 1;
      const price = $('[data-sticky-price]', section)?.textContent.trim();
      const lines = [
        "Assalam o Alaikum! I'd like to order:",
        `• ${wa.dataset.productTitle}${variant ? ` — ${variant}` : ''} × ${qty}${price ? ` (${price} each)` : ''}`,
        wa.dataset.productUrl,
        '',
        'Name:',
        'City & address:',
      ];
      window.open(`https://wa.me/${MD.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener');
      return;
    }
    const thumb = t.closest('[data-pdp-thumb]');
    if (thumb) {
      const section = thumb.closest('[data-product-section]');
      const photo = $('[data-pdp-photo]', section);
      $$('[data-pdp-thumb]', section).forEach((b) => b.classList.toggle('is-active', b === thumb));
      if (thumb.dataset.pdpThumb === 'visual') {
        photo.hidden = true;
      } else {
        photo.innerHTML = '';
        const img = new Image();
        img.src = thumb.dataset.pdpThumb;
        img.alt = thumb.dataset.alt || '';
        photo.appendChild(img);
        photo.hidden = false;
      }
      return;
    }
    const lb = t.closest('[data-lightbox-open]');
    if (lb) {
      openLightbox(lb);
      return;
    }
    if (t.closest('[data-lightbox-close]') || t.matches('dialog[data-lightbox]')) {
      t.closest('dialog')?.close();
      return;
    }
    const recover = t.closest('[data-toggle-recover]');
    if (recover) {
      event.preventDefault();
      $('[data-recover-panel]').hidden = false;
      $('[data-login-panel]').hidden = true;
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    MD.cart.close();
    if (document.documentElement.classList.contains('menu-open')) toggleMenu(false);
  });

  /* ---------- lightbox ---------- */
  function openLightbox(trigger) {
    const dialog = trigger.closest('section')?.querySelector('[data-lightbox]') || $('[data-lightbox]');
    if (!dialog) return;
    const body = $('[data-lightbox-body]', dialog);
    const file = $('[data-lightbox-file]', dialog);
    $('[data-lightbox-title]', dialog).textContent = trigger.dataset.title || '';
    body.innerHTML = '';
    if (trigger.dataset.src) {
      const img = new Image();
      img.src = trigger.dataset.src;
      img.alt = trigger.dataset.title || '';
      body.appendChild(img);
    } else if (trigger.dataset.file && /\.pdf(\?|$)/i.test(trigger.dataset.file)) {
      const frame = document.createElement('iframe');
      frame.src = trigger.dataset.file;
      frame.title = trigger.dataset.title || 'Certificate';
      body.appendChild(frame);
    }
    file.hidden = !trigger.dataset.file;
    if (trigger.dataset.file) file.href = trigger.dataset.file;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else if (trigger.dataset.file) window.open(trigger.dataset.file, '_blank', 'noopener');
  }

  /* ---------- mobile menu ---------- */
  function toggleMenu(force) {
    const html = document.documentElement;
    const open = typeof force === 'boolean' ? force : !html.classList.contains('menu-open');
    html.classList.toggle('menu-open', open);
    $$('[data-menu-toggle]').forEach((b) => b.setAttribute('aria-expanded', String(open)));
    $('[data-mobile-menu]')?.setAttribute('aria-hidden', String(!open));
    lock(open);
  }
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-menu-toggle]')) toggleMenu();
    else if (e.target.closest('[data-mobile-menu] a')) toggleMenu(false);
  });

  /* ---------- header: scrolled / hidden / on-dark ---------- */
  function initHeader() {
    const header = $('[data-header]');
    if (!header) return;
    const announce = $('[data-announce]');
    const setAnnounce = () => document.documentElement.style.setProperty('--announce-h', `${announce ? announce.offsetHeight : 0}px`);
    setAnnounce();
    window.addEventListener('resize', setAnnounce);
    let lastY = window.scrollY;
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const overlay = header.classList.contains('site-header--overlay');
      header.classList.toggle('is-scrolled', y > (overlay ? (announce?.offsetHeight || 0) + 10 : 10));
      const menuOpen = document.documentElement.classList.contains('menu-open');
      if (!menuOpen) header.classList.toggle('is-hidden', y > lastY && y > 400);
      lastY = y;
      const probe = header.offsetHeight / 2;
      const onDark = $$('[data-header-theme="dark"]').some((el) => {
        const r = el.getBoundingClientRect();
        return r.top <= probe && r.bottom >= probe;
      });
      header.classList.toggle('on-dark', onDark);
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ---------- announcement rotator ---------- */
  function initAnnounce() {
    const items = $$('.announce__item');
    if (items.length < 2) return;
    let i = 0;
    setInterval(() => {
      const prev = items[i];
      i = (i + 1) % items.length;
      prev.classList.remove('is-active');
      prev.classList.add('is-leaving');
      items[i].classList.remove('is-leaving');
      items[i].classList.add('is-active');
      setTimeout(() => prev.classList.remove('is-leaving'), 700);
    }, 4200);
  }

  /* ---------- product: variant picker, sticky bar, delivery ---------- */
  function initProduct(section) {
    const picker = $('[data-variant-picker]', section);
    if (picker) {
      const variants = JSON.parse($('[data-variants-json]', picker).textContent);
      picker.addEventListener('change', () => {
        const selected = [];
        $$('input[type="radio"]:checked', picker).forEach((input) => {
          selected[parseInt(input.dataset.optionIndex, 10)] = input.value;
          const label = $(`[data-option-label="${input.dataset.optionIndex}"]`, picker);
          if (label) label.textContent = input.value;
        });
        const variant = variants.find((v) => v.options.every((o, idx) => o === selected[idx]));
        updateVariant(section, variant);
      });
      if (variants[0] && variants[0].options.length === 1) {
        $$('input[type="radio"]', picker).forEach((input) => {
          const v = variants.find((x) => x.options[0] === input.value);
          input.classList.toggle('is-unavailable', !v || !v.available);
        });
      }
    }

    const qtyInput = $('input[name="quantity"]', section);
    qtyInput?.addEventListener('change', () => { if (parseInt(qtyInput.value, 10) < 1 || !qtyInput.value) qtyInput.value = 1; });

    const delivery = $('[data-delivery]', section);
    if (delivery) {
      const addWorkingDays = (days) => {
        const d = new Date();
        let added = 0;
        while (added < days) {
          d.setDate(d.getDate() + 1);
          if (d.getDay() !== 0) added += 1;
        }
        return d;
      };
      const fmt = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
      $('[data-delivery-range]', delivery).textContent = `${fmt.format(addWorkingDays(+delivery.dataset.min))} – ${fmt.format(addWorkingDays(+delivery.dataset.max))}`;
    }

    const sticky = $('[data-sticky-buy]', section);
    const mainBtn = $('.buy [data-add-button]', section);
    if (sticky && mainBtn && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(([entry]) => {
        const show = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        sticky.classList.toggle('is-visible', show);
        sticky.setAttribute('aria-hidden', String(!show));
        $('[data-add-button]', sticky).tabIndex = show ? 0 : -1;
        document.documentElement.classList.toggle('has-sticky-buy', show);
      });
      io.observe(mainBtn);
    }
  }

  function updateVariant(section, variant) {
    const buttons = $$('[data-add-button]', section);
    if (!variant) {
      buttons.forEach((b) => { b.disabled = true; $('[data-add-label]', b).textContent = MD.strings?.unavailable || 'Unavailable'; });
      return;
    }
    $$('[data-variant-id]', section).forEach((input) => { input.value = variant.id; });
    const price = MD.money(variant.price);
    $$('.pdp__price [data-price]', section).forEach((el) => { el.textContent = price; });
    const compare = $('.pdp__price [data-compare-price]', section);
    const badge = $('.pdp__price [data-sale-badge]', section);
    const onSale = variant.compare_at_price > variant.price;
    if (compare) { compare.hidden = !onSale; compare.textContent = onSale ? MD.money(variant.compare_at_price) : ''; }
    if (badge) { badge.hidden = !onSale; badge.textContent = onSale ? `Save ${MD.money(variant.compare_at_price - variant.price)}` : ''; }
    $$('[data-add-price]', section).forEach((el) => { el.textContent = `· ${price}`; });
    $$('[data-sticky-price]', section).forEach((el) => { el.textContent = price; });
    $$('[data-sticky-variant]', section).forEach((el) => { el.textContent = `${variant.title} · `; });
    buttons.forEach((b) => {
      b.disabled = !variant.available;
      $('[data-add-label]', b).textContent = variant.available ? (MD.strings?.addToCart || 'Add to cart') : (MD.strings?.soldOut || 'Sold out');
    });
    const url = new URL(window.location.href);
    url.searchParams.set('variant', variant.id);
    window.history.replaceState({}, '', url.toString());
    section.dispatchEvent(new CustomEvent('md:variant', { detail: variant, bubbles: true }));
  }

  /* ---------- product card chips ---------- */
  document.addEventListener('change', (e) => {
    const chip = e.target.closest('[data-chip-price]');
    if (!chip) return;
    const target = $('[data-chip-target]', chip.closest('[data-pcard]'));
    if (target) target.textContent = chip.dataset.chipPrice;
  });

  /* ---------- accordions (animated details) ---------- */
  function initAccordions(root) {
    $$('[data-accordion]', root).forEach((details) => {
      if (details.dataset.ready) return;
      details.dataset.ready = '1';
      const summary = $('summary', details);
      const content = $('.accordion__content', details);
      summary.addEventListener('click', (e) => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !content.animate) return;
        e.preventDefault();
        if (details.open) {
          const anim = content.animate([{ height: `${content.offsetHeight}px`, opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 380, easing: 'cubic-bezier(.65,0,.35,1)' });
          anim.onfinish = () => { details.open = false; ScrollTriggerRefresh(); };
        } else {
          details.open = true;
          const h = content.offsetHeight;
          content.animate([{ height: '0px', opacity: 0 }, { height: `${h}px`, opacity: 1 }], { duration: 480, easing: 'cubic-bezier(.16,1,.3,1)' }).onfinish = ScrollTriggerRefresh;
        }
      });
    });
  }
  const ScrollTriggerRefresh = () => window.ScrollTrigger && window.ScrollTrigger.refresh();

  /* ---------- track order ---------- */
  document.addEventListener('submit', (e) => {
    const form = e.target.closest('[data-track-form]');
    if (!form) return;
    e.preventDefault();
    const template = form.courier.value;
    const n = form.tracking.value.trim();
    if (!template || !n) return;
    window.open(template.replace('{n}', encodeURIComponent(n)), '_blank', 'noopener');
  });

  /* ---------- init ---------- */
  function init(root = document) {
    $$('[data-product-section]', root).forEach(initProduct);
    initAccordions(root);
  }
  const start = () => {
    initHeader();
    initAnnounce();
    init(document);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  document.addEventListener('shopify:section:load', (e) => init(e.target));
  document.addEventListener('shopify:section:select', (e) => {
    if (e.target.querySelector('[data-cart-drawer]')) MD.cart.open();
  });
  document.addEventListener('shopify:section:deselect', (e) => {
    if (e.target.querySelector('[data-cart-drawer]')) MD.cart.close();
  });
})();
