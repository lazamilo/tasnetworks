(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof gsap !== 'undefined';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  if (!hasGsap) { document.documentElement.classList.add('no-js'); return; }
  gsap.registerPlugin(ScrollTrigger);

  /* Smooth scroll */
  let lenis = null;
  if (!reduce && typeof Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollTo = (target) => lenis ? lenis.scrollTo(target, { offset: -80 }) : target.scrollIntoView({ behavior: 'smooth' });
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const t = $(id); if (!t) return;
    e.preventDefault(); closeAll(); scrollTo(t);
  }));

  /* Split hero + manifesto words */
  $$('.reveal-words').forEach(el => {
    el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
  });

  /* Loader + hero intro */
  const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
  if (!reduce) {
    intro
      .to('.loader__mark img', { opacity: 1, y: 0, duration: .8 })
      .to('.loader__bar span', { scaleX: 1, duration: 1.1, ease: 'power2.inOut' }, '<.1')
      .to('.loader', { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut' })
      .set('.loader', { display: 'none' })
      .fromTo('.hero__video', { scale: 1.25 }, { scale: 1.12, duration: 2.4, ease: 'expo.out' }, '-=.75')
      .from('.hero__title .line > span', { yPercent: 110, duration: 1.3, stagger: .1, ease: 'expo.out' }, '<.15')
      .from('.hero__aside > *', { y: 30, opacity: 0, duration: 1, stagger: .1 }, '<.4')
      .from('.quick__item', { y: 40, opacity: 0, duration: .9, stagger: .07 }, '<.1')
      .from('.hdr', { y: -30, opacity: 0, duration: .9 }, '<');
  } else {
    gsap.set('.loader', { display: 'none' });
  }

  /* Hero parallax */
  gsap.to('.hero__media', { yPercent: 22, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__content', { yPercent: -30, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: '30% top', end: 'bottom top', scrub: true } });

  /* Make sure the video plays (Chrome/Firefox) */
  const v = $('.hero__video');
  if (v) { v.muted = true; const p = v.play(); if (p && p.catch) p.catch(() => {}); }

  /* Header state */
  const hdr = $('.hdr');
  let lastY = 0;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: self => {
      const y = self.scroll();
      const darkZone = isOverDark();
      hdr.classList.toggle('is-solid', y > 40 && !darkZone);
      hdr.classList.toggle('is-dark', y > 40 && darkZone);
      hdr.classList.toggle('is-hidden', y > 400 && y > lastY && !hdr.classList.contains('mega-open'));
      lastY = y;
      gsap.set('.progress span', { scaleX: self.progress });
    }
  });
  function isOverDark() {
    const els = $$('.hero, .stats, .projects, .feature, .ftr');
    return els.some(el => { const r = el.getBoundingClientRect(); return r.top <= 40 && r.bottom > 40; });
  }

  /* Mega menu */
  const mega = $('.mega');
  let megaTimer;
  const openMega = (key) => {
    clearTimeout(megaTimer);
    $$('.mega__panel').forEach(p => p.classList.toggle('is-active', p.dataset.panel === key));
    $$('.nav-btn').forEach(b => b.classList.toggle('is-active', b.dataset.menu === key));
    mega.classList.add('is-open'); hdr.classList.add('mega-open');
  };
  const closeMega = () => {
    mega.classList.remove('is-open'); hdr.classList.remove('mega-open');
    $$('.nav-btn').forEach(b => b.classList.remove('is-active'));
  };
  $$('.nav-btn').forEach(b => {
    b.addEventListener('mouseenter', () => openMega(b.dataset.menu));
    b.addEventListener('click', () => mega.classList.contains('is-open') && b.classList.contains('is-active') ? closeMega() : openMega(b.dataset.menu));
  });
  hdr.addEventListener('mouseleave', () => { megaTimer = setTimeout(closeMega, 180); });
  mega.addEventListener('mouseenter', () => clearTimeout(megaTimer));

  /* Mobile nav */
  const burger = $('.burger'), mnav = $('.mnav');
  burger.addEventListener('click', () => {
    const open = !mnav.classList.contains('is-open');
    mnav.classList.toggle('is-open', open); burger.classList.toggle('is-open', open);
    hdr.style.color = open ? '#fff' : '';
    open ? lenis && lenis.stop() : lenis && lenis.start();
  });

  /* Search */
  const search = $('.search');
  $('[data-search]').addEventListener('click', () => { search.classList.add('is-open'); setTimeout(() => $('input', search).focus(), 100); lenis && lenis.stop(); });
  $('.search__close').addEventListener('click', () => closeAll());
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });
  function closeAll() {
    search.classList.remove('is-open'); closeMega();
    mnav.classList.remove('is-open'); burger.classList.remove('is-open'); hdr.style.color = '';
    lenis && lenis.start();
  }

  /* Manifesto word reveal */
  gsap.to('.manifesto__text .w', {
    opacity: 1, stagger: .08, ease: 'none',
    scrollTrigger: { trigger: '.manifesto__text', start: 'top 80%', end: 'bottom 45%', scrub: true }
  });

  /* Parallax inside frames */
  $$('[data-parallax]').forEach(img => {
    gsap.fromTo(img, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* Generic reveals */
  const reveal = (sel, opts = {}) => $$(sel).forEach(el => {
    gsap.from(el, { y: 50, opacity: 0, duration: 1.2, ease: 'expo.out', ...opts, scrollTrigger: { trigger: el, start: 'top 88%' } });
  });
  reveal('.sos__left > *', { stagger: .1 });
  reveal('.sos__num');
  reveal('.manifesto__media .frame');
  reveal('.manifesto__note');
  reveal('.outages__body > *');
  reveal('.safety__head > *, .community__head > *, .news__head > *');
  reveal('.srows li', { duration: 1 });
  reveal('.ftr__ack p, .ftr__grid > div');
  gsap.from('.tile', { y: 60, opacity: 0, duration: 1.2, stagger: .08, ease: 'expo.out', scrollTrigger: { trigger: '.bento', start: 'top 85%' } });
  gsap.from('.ncard', { y: 60, opacity: 0, duration: 1.2, stagger: .08, ease: 'expo.out', scrollTrigger: { trigger: '.news__grid', start: 'top 88%' } });
  gsap.from('.stats__title', { y: 60, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.stats__title', start: 'top 85%' } });
  gsap.from('.feature h2, .feature__cols', { y: 60, opacity: 0, duration: 1.4, stagger: .12, ease: 'expo.out', scrollTrigger: { trigger: '.feature__inner', start: 'top 85%' } });
  gsap.from('.ftr__big', { yPercent: 60, opacity: 0, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.ftr__big', start: 'top 95%' } });

  /* Counters */
  $$('[data-count]').forEach(el => {
    const end = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), comma = el.dataset.format === 'comma';
    const o = { v: 0 };
    const fmt = n => comma ? Math.round(n).toLocaleString('en-AU') : n.toFixed(dec);
    el.textContent = fmt(0);
    gsap.to(o, { v: end, duration: 2.2, ease: 'power3.out', onUpdate: () => el.textContent = fmt(o.v), onComplete: () => el.textContent = fmt(end),
      scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });
  gsap.from('.stat', { y: 40, opacity: 0, duration: 1.2, stagger: .1, ease: 'expo.out', scrollTrigger: { trigger: '.stats__grid', start: 'top 92%' } });

  /* Tabs with sliding pill */
  const tabs = $('.tabs');
  const pill = document.createElement('span'); pill.className = 'pill'; tabs.prepend(pill);
  const movePill = (t) => { pill.style.width = t.offsetWidth + 'px'; pill.style.transform = `translateX(${t.offsetLeft}px)`; };
  $$('.tab').forEach(t => t.addEventListener('click', () => {
    $$('.tab').forEach(x => x.classList.toggle('is-active', x === t));
    $$('.pane').forEach(p => p.classList.toggle('is-active', p.dataset.pane === t.dataset.tab));
    movePill(t);
  }));
  const syncPill = () => movePill($('.tab.is-active'));
  document.fonts ? document.fonts.ready.then(syncPill) : syncPill();
  addEventListener('resize', syncPill);

  /* Horizontal projects */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 701px)', () => {
    const track = $('.projects__track');
    const dist = () => track.scrollWidth - innerWidth;
    gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: '.projects', start: 'top top', end: () => '+=' + dist(), pin: '.projects__pin', scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 }
    });
  });
  mm.add('(max-width: 700px)', () => {
    $('.projects__track').style.cssText = 'width:auto;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch';
    $('.projects__pin').style.height = 'auto';
  });

  /* Safety hover image */
  const float = $('.srows__float'), fimg = $('img', float);
  if (matchMedia('(hover: hover)').matches) {
    const xTo = gsap.quickTo(float, 'x', { duration: .6, ease: 'power3' });
    const yTo = gsap.quickTo(float, 'y', { duration: .6, ease: 'power3' });
    $$('.srows a').forEach(a => {
      a.addEventListener('mouseenter', () => { fimg.src = a.dataset.img; float.classList.add('is-on'); });
      a.addEventListener('mouseleave', () => float.classList.remove('is-on'));
    });
    addEventListener('mousemove', e => { xTo(e.clientX + 30); yTo(e.clientY - 110); });
  }

  addEventListener('load', () => ScrollTrigger.refresh());
})();
