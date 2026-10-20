/* Karakoram Naturals — motion layer (GSAP + ScrollTrigger + SplitText + Lenis).
   Every scene is progressive: markup renders a complete, static layout and
   this file only adds animation on top. Reduced-motion visitors keep the static version. */
(() => {
  const MD = (window.MD = window.MD || {});
  const html = document.documentElement;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const designMode = !!(window.Shopify && window.Shopify.designMode);

  const removePreloader = () => document.querySelectorAll('[data-preloader]').forEach((el) => el.remove());
  // Safety net: never leave the preloader up.
  setTimeout(removePreloader, 9000);

  // Homepage loader: ghee pours into a jar while the counter runs to 100%, then the curtain lifts.
  // Plays on every homepage visit (the theme editor skips it).
  function runPreloader(gsap) {
    const el = document.querySelector('[data-preloader]');
    if (!el) return Promise.resolve();
    if (designMode) { el.remove(); return Promise.resolve(); }
    html.style.overflow = 'hidden';
    MD.lenis?.stop();
    return new Promise((resolve) => {
      const one = (sel) => el.querySelector(sel);
      const count = one('[data-preloader-count]');
      const o = { v: 0 };
      const done = () => { el.remove(); html.style.overflow = ''; MD.lenis?.start(); };
      gsap.to(one('.jar__wave'), { x: -60, duration: 1.6, ease: 'none', repeat: -1 });
      el.querySelectorAll('.jar__ripple').forEach((r, i) => gsap.fromTo(r, { scale: 0.3, opacity: 0.9, transformOrigin: '50% 50%' }, { scale: 2.8, opacity: 0, duration: 1.2, repeat: -1, delay: i * 0.6 }));
      gsap.set(one('.jar__stream'), { scaleY: 0, opacity: 1, transformOrigin: '50% 0%' });
      gsap.set(one('.jar__stream-inner'), { scaleY: 1, transformOrigin: '50% 100%' });
      gsap.timeline({ onComplete: done })
        .from(one('.preloader__jar'), { y: 40, autoAlpha: 0, duration: 0.7, ease: 'expo.out' }, 0)
        .from(one('.preloader__brand'), { autoAlpha: 0, letterSpacing: '0.8em', duration: 1.4, ease: 'expo.out' }, 0.1)
        .to(one('.jar__lid'), { y: -90, x: 60, rotation: 24, autoAlpha: 0, duration: 0.5, ease: 'power2.in' }, 0.3)
        .to(one('.jar__stream'), { scaleY: 1, duration: 0.35, ease: 'power1.in' }, 0.55)
        .to(one('.jar__ripples'), { opacity: 1, duration: 0.2 }, 0.85)
        .fromTo(one('.jar__fill'), { y: 290 }, { y: 0, duration: 1.9, ease: 'power1.inOut' }, 0.85)
        .to(o, { v: 100, duration: 1.9, ease: 'power1.inOut', onUpdate: () => { count.textContent = Math.round(o.v); } }, 0.85)
        .to(one('.jar__stream-inner'), { scaleY: 0, duration: 0.35, ease: 'power1.in' }, 2.6)
        .to(one('.jar__ripples'), { opacity: 0, duration: 0.3 }, 2.8)
        .to(one('.jar__lid'), { y: 0, x: 0, rotation: 0, autoAlpha: 1, duration: 0.5, ease: 'back.out(1.6)' }, 2.85)
        .to(one('.preloader__inner'), { y: -30, autoAlpha: 0, duration: 0.5, ease: 'power2.in' }, 3.5)
        .to(one('.preloader__brand'), { autoAlpha: 0, duration: 0.4 }, 3.5)
        .to(el, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1, ease: 'expo.inOut' }, 3.75)
        .add(resolve, 4.0);
    });
  }

  const ready = (fn) => (document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn());

  ready(() => {
    const { gsap, ScrollTrigger, SplitText, Lenis } = window;
    if (!gsap || !ScrollTrigger) { removePreloader(); return; }
    if (reduce) {
      html.classList.add('reduced-motion');
      runPreloader(gsap);
      return;
    }
    const preloading = runPreloader(gsap);
    gsap.registerPlugin(ScrollTrigger);
    if (SplitText) gsap.registerPlugin(SplitText);

    /* ---------- smooth scroll ---------- */
    if (MD.motion?.smooth && Lenis && !designMode) {
      const lenis = new Lenis({ lerp: 0.09, smoothWheel: true, anchors: { offset: -80 } });
      MD.lenis = lenis;
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    const contexts = new Map();
    const q = (sel, root) => Array.from(root.querySelectorAll(sel));
    const one = (sel, root) => root.querySelector(sel);

    /* ======================================================================
       Shared jar ambience: sloshing surface + ripples
       ====================================================================== */
    function jarAmbient(root) {
      q('.jar__wave', root).forEach((wave) => {
        const period = wave.closest('[data-jar="shilajit"]') ? 120 : 60;
        gsap.to(wave, { x: -period, duration: period / 34, ease: 'none', repeat: -1 });
      });
      q('.jar__ripple', root).forEach((r, i) => {
        gsap.fromTo(r, { scale: 0.3, opacity: 0.9, transformOrigin: '50% 50%' }, { scale: 2.8, opacity: 0, duration: 1.3, ease: 'power1.out', repeat: -1, delay: (i % 2) * 0.65 });
      });
    }

    /* ======================================================================
       Generic effects
       ====================================================================== */
    function splitReveals(root) {
      if (!SplitText) return;
      q('[data-split]', root).forEach((el) => {
        if (el.closest('[data-scene="golden-pour"]')) return;
        SplitText.create(el, {
          type: 'lines',
          mask: 'lines',
          linesClass: 'split-line',
          autoSplit: true,
          onSplit(self) {
            return gsap.from(self.lines, {
              yPercent: 110,
              duration: 1.15,
              ease: 'expo.out',
              stagger: 0.09,
              scrollTrigger: { trigger: el, start: 'top 88%', once: true },
            });
          },
        });
      });
    }

    function reveals(root) {
      const els = q('[data-reveal]', root);
      if (!els.length) return;
      gsap.set(els, { y: 40, autoAlpha: 0 });
      ScrollTrigger.batch(els, {
        start: 'top 90%',
        once: true,
        onEnter: (batch) => gsap.to(batch, { y: 0, autoAlpha: 1, duration: 1.1, ease: 'expo.out', stagger: 0.09, overwrite: true }),
      });
    }

    function parallax(root) {
      q('[data-parallax]', root).forEach((el) => {
        const speed = parseFloat(el.dataset.parallax) || 0.1;
        gsap.to(el, { yPercent: speed * 100, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
      q('[data-parallax-img] img', root).forEach((img) => {
        gsap.fromTo(img, { yPercent: -12 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    }

    function counters(root) {
      q('[data-count-to]', root).forEach((el) => {
        const end = parseFloat(el.dataset.countTo) || 0;
        const decimals = parseInt(el.dataset.decimals || '0', 10);
        const obj = { v: 0 };
        const fmt = (v) => v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
        el.textContent = fmt(0);
        gsap.to(obj, {
          v: end,
          duration: 2.2,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          onUpdate: () => { el.textContent = fmt(obj.v); },
        });
      });
    }

    function drawIcons(root) {
      q('[data-draw]', root).forEach((wrap) => {
        const shapes = q('path, circle, rect', wrap).filter((s) => s.getAttribute('fill') !== 'currentColor');
        shapes.forEach((s) => {
          const len = s.getTotalLength ? s.getTotalLength() : 100;
          gsap.set(s, { strokeDasharray: len, strokeDashoffset: len });
        });
        gsap.to(shapes, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', stagger: 0.1, scrollTrigger: { trigger: wrap, start: 'top 90%', once: true } });
      });
    }

    function tilt(root) {
      if (!finePointer) return;
      q('[data-tilt]', root).forEach((card) => {
        const depthEls = q('[data-tilt-depth]', card);
        const rx = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3' });
        const ry = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3' });
        gsap.set(card, { transformPerspective: 1100 });
        card.addEventListener('mousemove', (e) => {
          const r = card.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5;
          const y = (e.clientY - r.top) / r.height - 0.5;
          ry(x * 9);
          rx(-y * 9);
          depthEls.forEach((d) => gsap.to(d, { x: x * (+d.dataset.tiltDepth || 20), y: y * (+d.dataset.tiltDepth || 20), duration: 0.6, ease: 'power3' }));
        });
        card.addEventListener('mouseleave', () => {
          rx(0); ry(0);
          depthEls.forEach((d) => gsap.to(d, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, .5)' }));
        });
      });
    }

    function magnetic(root) {
      if (!finePointer) return;
      q('[data-magnetic]', root).forEach((el) => {
        if (el.dataset.magneticReady) return;
        el.dataset.magneticReady = '1';
        const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
        const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
        el.addEventListener('mousemove', (e) => {
          const r = el.getBoundingClientRect();
          xTo((e.clientX - r.left - r.width / 2) * 0.28);
          yTo((e.clientY - r.top - r.height / 2) * 0.4);
        });
        el.addEventListener('mouseleave', () => {
          gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, .4)' });
        });
      });
    }

    function marquees(root) {
      q('[data-marquee]', root).forEach((el) => {
        const track = one('[data-marquee-track]', el);
        const loop = gsap.to(track, { xPercent: -50, duration: parseFloat(el.dataset.speed) || 26, ease: 'none', repeat: -1 });
        const skew = gsap.quickTo(track, 'skewX', { duration: 0.4, ease: 'power3' });
        let dir = 1;
        ScrollTrigger.create({
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          onUpdate(self) {
            dir = self.direction;
            const v = self.getVelocity();
            const boost = Math.min(Math.abs(v) / 350, 5);
            gsap.to(loop, { timeScale: dir * (1 + boost), duration: 0.15, overwrite: true });
            gsap.to(loop, { timeScale: dir, duration: 1.2, delay: 0.15, ease: 'power2.out' });
            skew(gsap.utils.clamp(-8, 8, -v / 300));
          },
          onLeave: () => skew(0),
          onLeaveBack: () => skew(0),
        });
      });
    }

    function footerMark(root) {
      q('[data-footer-mark]', root).forEach((el) => {
        const span = one('span', el);
        gsap.fromTo(span, { backgroundPosition: '0% 100%', yPercent: 40 }, {
          backgroundPosition: '0% 0%',
          yPercent: 0,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom bottom', scrub: true },
        });
      });
    }

    /* ======================================================================
       Scene: Golden pour hero
       ====================================================================== */
    function goldenPour(el) {
      const pin = one('[data-gp-pin]', el);
      const lid = one('.jar__lid', el);
      const ladle = one('[data-gp-ladle]', el);
      const streamOuter = one('.jar__stream', el);
      const streamInner = one('.jar__stream-inner', el);
      const fill = one('.jar__fill', el);
      const ripples = one('.jar__ripples', el);
      const labelMask = one('.jar__label-mask', el);
      const notes = q('[data-gp-note]', el);
      const card = one('[data-gp-card]', el);
      const meter = one('[data-gp-meter]', el);
      const giant = one('[data-gp-giant]', el);
      const glow = one('[data-gp-glow]', el);
      const stage = one('[data-gp-stage]', el);
      const copy = one('.gp__copy', el);
      const pinLength = parseFloat(el.dataset.pinLength) || 260;

      el.classList.add('is-animated');
      jarAmbient(el);
      gsap.to(one('.gp__svg', el), { y: -10, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });

      const mm = gsap.matchMedia();
      mm.add({ isMobile: '(max-width: 899px)', isDesktop: '(min-width: 900px)' }, (ctx) => {
        const { isMobile } = ctx.conditions;
        const meterObj = { v: 0 };
        gsap.set(fill, { y: 290 });
        gsap.set(streamOuter, { scaleY: 0, transformOrigin: '50% 0%' });
        gsap.set(streamInner, { scaleY: 1, transformOrigin: '50% 100%' });
        gsap.set(ladle, { y: -700, autoAlpha: 0, rotation: -10, transformOrigin: '99% 73.5%' });
        gsap.set(labelMask, { attr: { width: 0 } });
        gsap.set(card, { autoAlpha: 0, x: isMobile ? 0 : 70, y: isMobile ? 80 : 0 });
        gsap.set(notes, { autoAlpha: 0, x: isMobile ? 0 : -16, y: isMobile ? 12 : 0 });
        gsap.set(q('.gp__note-line', el), { scaleX: 0 });
        meter.textContent = '0';

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: pin,
            start: 'top top',
            end: () => `+=${window.innerHeight * (pinLength / 100)}`,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        tl.to(lid, { y: -170, x: 130, rotation: 32, autoAlpha: 0, duration: 0.9, ease: 'power2.in' }, 0)
          .to(one('.gp__cue', el), { autoAlpha: 0, duration: 0.4 }, 0)
          .to(ladle, { y: 0, autoAlpha: 1, rotation: 0, duration: 0.9, ease: 'power3.out' }, 0.2)
          .to(ladle, { rotation: 36, duration: 0.6, ease: 'power1.inOut' }, 1.0)
          .to(streamOuter, { scaleY: 1, duration: 0.5, ease: 'power1.in' }, 1.25)
          .to(ripples, { opacity: 1, duration: 0.2 }, 1.7)
          .to(fill, { y: 0, duration: 3.6 }, 1.7)
          .to(meterObj, { v: 100, duration: 3.6, onUpdate: () => { meter.textContent = Math.round(meterObj.v); } }, 1.7);

        notes.forEach((note, i) => {
          const at = 1.9 + i * 0.85;
          tl.to(note, { autoAlpha: 1, x: 0, y: 0, duration: 0.35, ease: 'power2.out' }, at)
            .to(one('.gp__note-line', note), { scaleX: 1, duration: 0.35, ease: 'power2.out' }, at);
          if (isMobile && i < notes.length - 1) tl.to(note, { autoAlpha: 0, y: -12, duration: 0.3 }, at + 0.65);
        });

        tl.to(streamInner, { scaleY: 0, duration: 0.45, ease: 'power1.in' }, 5.3)
          .to(ripples, { opacity: 0, duration: 0.3 }, 5.6)
          .to(ladle, { rotation: 0, duration: 0.4 }, 5.35)
          .to(ladle, { y: -700, autoAlpha: 0, duration: 0.6, ease: 'power2.in' }, 5.7)
          .to(lid, { y: 0, x: 0, rotation: 0, autoAlpha: 1, duration: 0.7, ease: 'power3.out' }, 5.9)
          .to(labelMask, { attr: { width: 220 }, duration: 0.7, ease: 'power2.inOut' }, 6.4)
          .to(notes, { autoAlpha: 0, duration: 0.4 }, 6.4)
          .to(card, { autoAlpha: 1, x: 0, y: 0, duration: 0.8, ease: 'power3.out' }, 6.9)
          .to(giant, { xPercent: -28, duration: 7.7 }, 0)
          .to(glow, { scale: 1.35, opacity: 0.9, duration: 7.7 }, 0);

        if (isMobile) {
          tl.to(one('.gp__sub', el), { autoAlpha: 0, duration: 0.3 }, 0.1)
            .to(stage, { scale: 0.62, y: () => -copy.offsetHeight + 8, transformOrigin: '50% 0%', duration: 0.8, ease: 'power2.inOut' }, 6.6)
            .to(copy, { autoAlpha: 0, y: -30, duration: 0.6 }, 6.4);
        } else {
          tl.to(stage, { xPercent: -8, duration: 0.8, ease: 'power2.inOut' }, 6.8);
        }
        tl.to({}, { duration: 0.6 });
      });
    }

    function heroIntro() {
      const el = document.querySelector('[data-scene="golden-pour"]');
      if (!el) return;
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      if (SplitText) {
        const split = SplitText.create(q('.gp__line', el), { type: 'lines', mask: 'lines' });
        tl.from(split.lines, { yPercent: 115, duration: 1.4, stagger: 0.12 }, 0);
      }
      tl.from(q('[data-gp-intro]', el), { y: 24, autoAlpha: 0, duration: 1.2, stagger: 0.08 }, 0.25)
        .from(one('[data-gp-stage]', el), { y: 120, autoAlpha: 0, duration: 1.8 }, 0.1)
        .from(one('[data-gp-giant]', el), { xPercent: 20, autoAlpha: 0, duration: 2.2 }, 0);
    }

    /* ======================================================================
       Scene: From the peaks (shilajit)
       ====================================================================== */
    function peaks(el) {
      const pin = one('[data-peaks-pin]', el);
      const far = one('[data-peaks-far]', el);
      const mid = one('[data-peaks-mid]', el);
      const rock = one('[data-peaks-rock]', el);
      const sky = one('.peaks__sky', el);
      const title = one('[data-peaks-title]', el);
      const captions = q('[data-peaks-caption]', el);
      const altEl = one('[data-peaks-alt]', el);
      const ruler = one('[data-peaks-ruler]', el);
      const crackline = one('.peaks__crackline', el);
      const halo = one('.peaks__crackhalo', el);
      const ooze = one('.peaks__ooze', el);
      const bulb = one('.peaks__bulb', el);
      const shine = one('.peaks__shine', el);
      const drop = one('[data-peaks-drop]', el);
      const jar = one('[data-peaks-jar]', el);
      const splash = one('[data-peaks-splash]', el);
      const jarFill = one('.jar__fill', jar);
      const jarRipples = one('.jar__ripples', jar);
      const jarGlow = one('.jar__glow', jar);
      const card = one('[data-peaks-card]', el);
      const altFrom = parseFloat(el.dataset.altFrom) || 5800;
      const altTo = parseFloat(el.dataset.altTo) || 4200;
      const pinLength = parseFloat(el.dataset.pinLength) || 320;

      el.classList.add('is-animated');
      jarAmbient(jar);

      const mm = gsap.matchMedia();
      mm.add({ isMobile: '(max-width: 899px)', isDesktop: '(min-width: 900px)' }, (ctx) => {
        const { isMobile } = ctx.conditions;
        const ZOOM = isMobile ? 2.2 : 2.6;
        const alt = { v: altFrom };
        const fmtAlt = (v) => Math.round(v).toLocaleString('en-US');
        altEl.textContent = fmtAlt(altFrom);

        gsap.set(rock, { yPercent: 58, scale: 1, autoAlpha: 1, transformOrigin: '50% 50%' });
        gsap.set(mid, { yPercent: 18 });
        gsap.set([far, mid], { transformOrigin: '50% 70%' });
        gsap.set(captions, { autoAlpha: 0, y: 20 });
        gsap.set(jar, { yPercent: 140, xPercent: 0, scale: 1 });
        gsap.set(card, { autoAlpha: 0, x: isMobile ? 0 : 70, y: isMobile ? 80 : 0 });
        gsap.set(drop, { autoAlpha: 0 });
        gsap.set([crackline, halo, shine], { opacity: 0 });
        gsap.set(ooze, { attr: { ry: 3, cy: 464 } });
        gsap.set(bulb, { attr: { r: 0, cy: 470 } });
        gsap.set(jarFill, { y: 120 });

        // Positions in pin space; recomputed on refresh.
        const sliceScale = () => Math.max(pin.offsetWidth / 1600, pin.offsetHeight / 900);
        const DROP_H = 39; // matches .peaks__drop height (SVG elements have no offsetHeight)
        const dropStart = () => pin.offsetHeight / 2 + (494 - 450) * sliceScale() * ZOOM - DROP_H * 0.55;
        const dropEnd = () => jar.offsetTop + jar.offsetHeight * 0.42 - DROP_H;

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: pin,
            start: 'top top',
            end: () => `+=${window.innerHeight * (pinLength / 100)}`,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        // 1 — descent through the range
        tl.to(title, { yPercent: -70, autoAlpha: 0, duration: 1.4 }, 0.4)
          .to(sky, { yPercent: -25, duration: 3 }, 0)
          .to(far, { yPercent: -14, duration: 3 }, 0)
          .to(mid, { yPercent: -6, duration: 3 }, 0)
          .to(rock, { yPercent: 0, duration: 3, ease: 'power1.out' }, 0)
          .to(alt, { v: altTo, duration: 3, onUpdate: () => { altEl.textContent = fmtAlt(alt.v); } }, 0)
          .fromTo(ruler, { backgroundPosition: '0px 0px' }, { backgroundPosition: '0px 420px', duration: 3 }, 0);

        // 2 — close in on the crack
        tl.to(rock, { scale: ZOOM, duration: 1.6, ease: 'power2.inOut' }, 3)
          .to([far, mid], { scale: 1.35, autoAlpha: 0.2, duration: 1.6 }, 3)
          .to(halo, { opacity: 1, duration: 1 }, 3.6)
          .to(crackline, { opacity: 1, duration: 0.6 }, 3.8);

        // 3 — resin seeps and gathers
        tl.to(ooze, { attr: { ry: 15, cy: 475 }, duration: 0.7 }, 4.4)
          .to(bulb, { attr: { r: 9, cy: 493 }, duration: 0.8 }, 4.7)
          .to(shine, { opacity: 0.9, duration: 0.3 }, 5.0)
          .to(jar, { yPercent: 0, duration: 1.2, ease: 'power2.out' }, 4.3);

        // 4 — the drop falls into the jar
        tl.set(bulb, { attr: { r: 0 } }, 5.55)
          .set(shine, { opacity: 0 }, 5.55)
          .fromTo(drop, { autoAlpha: 1, y: dropStart, scaleX: 1, scaleY: 1 }, { y: dropEnd, scaleX: 0.85, scaleY: 1.3, duration: 0.8, ease: 'power2.in', immediateRender: false }, 5.55)
          .to(ooze, { attr: { ry: 4, cy: 466 }, duration: 0.4 }, 5.55)
          .set(drop, { autoAlpha: 0 }, 6.35)
          .fromTo(splash, { scale: 0.4, opacity: 0.9 }, { scale: 1.7, opacity: 0, duration: 0.5, immediateRender: false }, 6.35)
          .to(jarRipples, { opacity: 1, duration: 0.1 }, 6.35)
          .to(jarRipples, { opacity: 0, duration: 0.4 }, 6.9)
          .to(jarFill, { y: 30, duration: 0.8, ease: 'power2.out' }, 6.35)
          .to(jarGlow, { opacity: 0.4, duration: 0.4 }, 6.35)
          .to(jarGlow, { opacity: 0.14, duration: 0.8 }, 6.8);

        // captions ride along
        const capAt = isMobile ? [1.8, 3.4, 5.0] : [0.8, 3.4, 5.4];
        captions.forEach((c, i) => {
          tl.to(c, { autoAlpha: 1, y: 0, duration: 0.4 }, capAt[i] ?? 5.4);
          if (isMobile && i < captions.length - 1) tl.to(c, { autoAlpha: 0, y: -14, duration: 0.3 }, (capAt[i + 1] ?? 6) - 0.4);
        });

        // 5 — reveal the product
        tl.to(jar, { xPercent: isMobile ? 0 : -18, yPercent: isMobile ? -150 : -10, scale: isMobile ? 0.72 : 1.1, duration: 1, ease: 'power2.inOut' }, 6.9)
          .to(rock, { autoAlpha: 0.5, duration: 1 }, 6.9)
          .to(halo, { opacity: 0.45, duration: 1 }, 6.9)
          .to(card, { autoAlpha: 1, x: 0, y: 0, duration: 0.8, ease: 'power3.out' }, 7.3);
        if (isMobile) tl.to(captions, { autoAlpha: 0, duration: 0.3 }, 6.9);
        tl.to({}, { duration: 0.6 });
      });
    }

    /* ======================================================================
       Scene: Bilona process (horizontal)
       ====================================================================== */
    function bilona(el) {
      const pin = one('[data-bilona-pin]', el);
      const track = one('[data-bilona-track]', el);
      const bar = one('[data-bilona-bar]', el);
      const dots = q('[data-bilona-dot]', el);
      const steps = q('[data-step]', el);
      const mm = gsap.matchMedia();

      mm.add('(min-width: 900px)', () => {
        el.classList.add('is-animated');
        const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
        const tween = gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: pin,
            start: 'top top',
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate(self) {
              gsap.set(bar, { scaleX: self.progress });
              const active = Math.round(self.progress * (dots.length - 1));
              dots.forEach((d, i) => d.classList.toggle('is-active', i <= active));
            },
          },
        });
        steps.forEach((step) => {
          const art = one('[data-step-art] > svg', step);
          const halo = one('.step__halo', step);
          const text = q('.step__text > *', step);
          const st = { trigger: step, containerAnimation: tween, start: 'left 78%', toggleActions: 'play none none reverse' };
          gsap.from(art, { scale: 0.6, rotation: -8, autoAlpha: 0, duration: 1.1, ease: 'back.out(1.7)', scrollTrigger: st });
          gsap.from(halo, { scale: 0.2, autoAlpha: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { ...st } });
          gsap.from(text, { y: 36, autoAlpha: 0, duration: 0.9, ease: 'expo.out', stagger: 0.07, scrollTrigger: { ...st } });
        });
        return () => el.classList.remove('is-animated');
      });

      mm.add('(max-width: 899px)', () => {
        steps.forEach((step) => {
          gsap.from(step, { y: 70, autoAlpha: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: step, start: 'top 88%', once: true } });
          const art = one('[data-step-art] > svg', step);
          gsap.from(art, { scale: 0.7, rotation: -6, duration: 1.2, ease: 'back.out(1.6)', scrollTrigger: { trigger: step, start: 'top 80%', once: true } });
        });
      });
    }

    /* ======================================================================
       Scene: Purity (stamps)
       ====================================================================== */
    function purity(el) {
      q('[data-cert]', el).forEach((cert, i) => {
        const seal = one('[data-cert-seal]', cert);
        const paper = one('.cert__paper', cert);
        gsap.set(seal, { scale: 2.8, rotation: -40, autoAlpha: 0 });
        const tl = gsap.timeline({ scrollTrigger: { trigger: cert, start: 'top 82%', once: true }, delay: (i % 4) * 0.16 });
        tl.from(paper, { y: 80, autoAlpha: 0, rotation: i % 2 ? 5 : -5, duration: 1.1, ease: 'expo.out' })
          .to(seal, { scale: 1, rotation: 0, autoAlpha: 1, duration: 0.36, ease: 'power4.in' }, '-=0.45')
          .add(() => cert.classList.add('is-stamped'))
          .fromTo(paper, { x: -4, scale: 0.985 }, { x: 0, scale: 1, duration: 0.6, ease: 'elastic.out(1, .3)' });
      });
    }

    /* ======================================================================
       Scene: Bundle (jars clink)
       ====================================================================== */
    function bundle(el) {
      const left = one('[data-bundle-left]', el);
      const right = one('[data-bundle-right]', el);
      jarAmbient(el);
      gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 68%', once: true } })
        .from(left, { xPercent: -70, rotation: -16, autoAlpha: 0, duration: 1.2, ease: 'expo.out' })
        .from(right, { xPercent: 70, rotation: 16, autoAlpha: 0, duration: 1.2, ease: 'expo.out' }, '<')
        .to(left, { rotation: 5, duration: 0.16, yoyo: true, repeat: 1, ease: 'power1.inOut', transformOrigin: '50% 100%' }, '-=0.35')
        .to(right, { rotation: -5, duration: 0.16, yoyo: true, repeat: 1, ease: 'power1.inOut', transformOrigin: '50% 100%' }, '<')
        .from(one('[data-bundle-plus]', el), { scale: 0, rotation: -180, duration: 0.8, ease: 'back.out(2.2)' }, '<')
        .from(one('[data-bundle-burst]', el), { scale: 0.3, autoAlpha: 0, duration: 1.4, ease: 'expo.out' }, '<');
      gsap.to([left, right], { y: -8, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: 0.8, delay: 2 });
    }

    /* ======================================================================
       Scene: product page stage
       ====================================================================== */
    function pdp(el) {
      const stage = one('[data-pdp-stage]', el);
      const visual = one('[data-pdp-visual]', el);
      const fill = one('.jar__fill', visual);
      const isShilajit = !!one('[data-jar="shilajit"]', visual);
      jarAmbient(visual);
      gsap.from(visual, { y: 90, scale: 0.9, autoAlpha: 0, duration: 1.6, ease: 'expo.out', delay: 0.1 });
      if (fill) gsap.from(fill, { y: isShilajit ? 210 : 290, duration: 2.4, ease: 'power3.inOut', delay: 0.35 });
      gsap.from(q('[data-pdp-info] > *', el), { y: 30, autoAlpha: 0, duration: 1, ease: 'expo.out', stagger: 0.05, delay: 0.15 });

      if (finePointer && stage) {
        const xTo = gsap.quickTo(visual, 'x', { duration: 0.8, ease: 'power3' });
        const yTo = gsap.quickTo(visual, 'y', { duration: 0.8, ease: 'power3' });
        const rTo = gsap.quickTo(visual, 'rotation', { duration: 0.8, ease: 'power3' });
        stage.addEventListener('mousemove', (e) => {
          const r = stage.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5;
          const y = (e.clientY - r.top) / r.height - 0.5;
          xTo(x * 30); yTo(y * 24); rTo(x * 6);
        });
        stage.addEventListener('mouseleave', () => { xTo(0); yTo(0); rTo(0); });
      }

      el.addEventListener('md:variant', () => {
        gsap.fromTo(visual, { scale: 0.94 }, { scale: 1, duration: 0.9, ease: 'elastic.out(1, .45)' });
        const ripples = one('.jar__ripples', visual);
        if (ripples) gsap.fromTo(ripples, { opacity: 1 }, { opacity: 0, duration: 1.2, delay: 0.2 });
      });
    }

    function pageHero(el) {
      const art = q('.page-hero__jar, .page-hero__seal', el);
      if (!art.length) return;
      gsap.from(art, { y: 120, rotation: (i) => (i ? 10 : -10), autoAlpha: 0, duration: 1.6, ease: 'expo.out', stagger: 0.15, delay: 0.1 });
      jarAmbient(el);
    }

    const scenes = { 'golden-pour': goldenPour, peaks, bilona, purity, bundle, pdp, 'page-hero': pageHero };

    /* ======================================================================
       Cursor
       ====================================================================== */
    function cursor() {
      const c = document.querySelector('.cursor');
      if (!c || !finePointer || !MD.motion?.cursor) return;
      html.classList.add('has-cursor');
      const dot = one('.cursor__dot', c);
      const ring = one('.cursor__ring', c);
      const label = one('.cursor__label', c);
      const dx = gsap.quickSetter(dot, 'x', 'px');
      const dy = gsap.quickSetter(dot, 'y', 'px');
      const rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' });
      const ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });
      window.addEventListener('mousemove', (e) => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); c.classList.remove('is-hidden'); });
      document.addEventListener('mouseleave', () => c.classList.add('is-hidden'));
      document.addEventListener('mouseover', (e) => {
        const labelled = e.target.closest('[data-cursor]');
        const interactive = e.target.closest('a, button, label, summary, input, select, textarea');
        c.classList.toggle('is-label', !!labelled);
        c.classList.toggle('is-hover', !labelled && !!interactive);
        label.textContent = labelled ? labelled.dataset.cursor : '';
      });
    }

    /* ======================================================================
       Boot
       ====================================================================== */
    function initRoot(root) {
      const ctx = gsap.context(() => {
        q('[data-scene]', root).concat(root.matches?.('[data-scene]') ? [root] : []).forEach((el) => {
          const fn = scenes[el.dataset.scene];
          if (fn) fn(el);
        });
        splitReveals(root);
        reveals(root);
        parallax(root);
        counters(root);
        drawIcons(root);
        tilt(root);
        magnetic(root);
        marquees(root);
        footerMark(root);
      }, root);
      contexts.set(root, ctx);
    }

    const boot = () => {
      cursor();
      initRoot(document.body);
      preloading.then(() => {
        heroIntro();
        ScrollTrigger.refresh();
      });
    };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(boot);
    else boot();

    window.addEventListener('load', () => ScrollTrigger.refresh());
    document.addEventListener('md:cart-updated', () => magnetic(document));

    document.addEventListener('shopify:section:load', (e) => {
      initRoot(e.target);
      ScrollTrigger.refresh();
    });
    document.addEventListener('shopify:section:unload', (e) => {
      const ctx = contexts.get(e.target);
      if (ctx) { ctx.revert(); contexts.delete(e.target); }
    });
  });
})();
