(() => {
  const root = document.documentElement;
  root.classList.remove('no-js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // language
  const setLang = (l) => {
    root.lang = l;
    document.querySelectorAll('.lang button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.l === l)));
    try { localStorage.setItem('aso-lang', l); } catch (e) {}
  };
  let saved = null;
  try { saved = localStorage.getItem('aso-lang'); } catch (e) {}
  setLang(saved || (/^tr/i.test(navigator.language) ? 'tr' : 'en'));
  document.querySelectorAll('.lang button').forEach(b => b.addEventListener('click', () => setLang(b.dataset.l)));

  // nav border
  const nav = document.querySelector('nav.top');
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 20);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // reveal + route + counters
  const io = new IntersectionObserver((es) => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in'); io.unobserve(e.target);
  }), { threshold: .12 });
  document.querySelectorAll('.rv, .route').forEach(el => io.observe(el));

  const cio = new IntersectionObserver((es) => es.forEach(e => {
    if (!e.isIntersecting) return;
    cio.unobserve(e.target);
    if (reduce) return;
    const el = e.target, end = +el.dataset.count, t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / 1400), v = Math.round(end * (1 - Math.pow(1 - p, 3)));
      el.textContent = v;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }), { threshold: .6 });
  document.querySelectorAll('[data-count]').forEach(el => cio.observe(el));

  // decorative price-field canvas (abstract random walk, not market data)
  const cv = document.getElementById('field');
  if (cv) {
    const ctx = cv.getContext('2d');
    let w, h, dpr, candles = [], off = 0, vis = true, seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const CW = 11, GAP = 5;
    const build = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.ceil(w / (CW + GAP)) + 24; candles = []; let p = h * .62;
      for (let i = 0; i < n; i++) {
        const o = p, c = o + (rnd() - .5) * 26 - 1.1; // gentle upward drift
        candles.push({ o, c, hi: Math.min(o, c) - rnd() * 14, lo: Math.max(o, c) + rnd() * 14 }); p = c;
      }
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const step = CW + GAP, shift = off % step, first = Math.floor(off / step);
      for (let i = 0; i < candles.length; i++) {
        const c = candles[(first + i) % candles.length], x = i * step - shift;
        const up = c.c <= c.o;
        ctx.strokeStyle = ctx.fillStyle = up ? '#0165fa' : '#0c1223';
        ctx.globalAlpha = up ? .9 : .55;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x + CW / 2, c.hi); ctx.lineTo(x + CW / 2, c.lo); ctx.stroke();
        ctx.fillRect(x, Math.min(c.o, c.c), CW, Math.max(3, Math.abs(c.o - c.c)));
      }
    };
    const loop = () => { if (vis) { off += .35; draw(); } requestAnimationFrame(loop); };
    build(); draw();
    new ResizeObserver(() => { build(); draw(); }).observe(cv);
    new IntersectionObserver(([e]) => { vis = e.isIntersecting; }).observe(cv);
    if (!reduce) requestAnimationFrame(loop);
  }
})();
