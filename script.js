/* CONVICTION: native scroll, a layered Matrix code rain, progressive enhancement. */
(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(pointer: fine)');
  const canvas = document.getElementById('signal-canvas');
  const ctx = canvas.getContext('2d');
  const toggle = document.querySelector('.motion-toggle');
  const hero = document.querySelector('.hero');
  const lines = [...document.querySelectorAll('.hero__headline .line')];
  const progress = document.querySelector('.reading-progress');
  const statement = document.querySelector('.decode-text');
  const navLinks = [...document.querySelectorAll('.nav__links a')];
  const sections = [...document.querySelectorAll('main section[id]')];
  const contact = document.getElementById('contact');
  const scramble = document.querySelector('[data-scramble]');
  const target = scramble.dataset.scramble;
  document.querySelector('h1').setAttribute('aria-label', 'We invest in entrepreneurs who change the world.');
  let paused = reduced.matches;
  try { paused = reduced.matches || sessionStorage.getItem('upper-motion') === 'off'; } catch { /* Storage is optional. */ }
  let width = innerWidth, height = innerHeight, heroHeight = hero.offsetHeight;
  let time = 0, last = 0, lastPaint = 0, raf = 0, dirty = true;
  let y = scrollY, targetY = scrollY, px = 0, py = 0, mx = 0, my = 0;
  let scene = 1, readAmount = 0, scrambleDone = paused, lastScramble = 0;
  const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v));
  const chars = '01<>/{}[]+=:アカサタナハマヤラワ';
  const counters = [];

  // Preserve emphasis and line breaks, with a stable accessible heading.
  statement.setAttribute('aria-label', 'We’ve been in your chair.');
  const walker = document.createTreeWalker(statement, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  textNodes.forEach(node => {
    const fragment = document.createDocumentFragment();
    node.textContent.split(/(\s+)/).forEach(text => {
      if (!text.trim()) fragment.append(document.createTextNode(text));
      else { const word = document.createElement('span'); word.className = 'word'; word.textContent = text; word.setAttribute('aria-hidden', 'true'); fragment.append(word); }
    });
    node.replaceWith(fragment);
  });
  const words = [...statement.querySelectorAll('.word')];


  // Portfolio roster. PLACEHOLDER rows: replace with real companies from the client.
  const PORTFOLIO = [
    { name: 'PORTFOLIO_CO_01', field: 'AI / ASI', stage: 'Seed', year: 2024, site: '#', crunchbase: '#' },
    { name: 'PORTFOLIO_CO_02', field: 'Infrastructure', stage: 'Growth', year: 2021, site: '#', crunchbase: '#' },
    { name: 'PORTFOLIO_CO_03', field: 'Software', stage: 'Seed', year: 2019, site: '#', crunchbase: '#' },
    { name: 'PORTFOLIO_CO_04', field: 'Ecommerce', stage: 'Growth', year: 2016, site: '#', crunchbase: '#' },
  ];
  const rosterBody = document.getElementById('roster-body');
  const rosterHeads = [...document.querySelectorAll('.roster__table th')];
  let sortKey = 'name', sortDir = 1;
  function renderRoster() {
    const rows = [...PORTFOLIO].sort((a, b) => (a[sortKey] > b[sortKey] ? 1 : a[sortKey] < b[sortKey] ? -1 : 0) * sortDir);
    rosterBody.replaceChildren(...rows.map(co => {
      const tr = document.createElement('tr');
      [co.name, co.field, co.stage, co.year].forEach(v => { const td = document.createElement('td'); td.textContent = v; tr.append(td); });
      const links = document.createElement('td');
      [['SITE ↗', co.site], ['CRUNCHBASE ↗', co.crunchbase]].forEach(([label, href]) => {
        if (!href) return;
        const a = document.createElement('a'); a.href = href; a.textContent = label; a.target = '_blank'; a.rel = 'noopener'; links.append(a);
      });
      tr.append(links);
      return tr;
    }));
    rosterHeads.forEach(th => {
      const key = th.querySelector('button')?.dataset.key;
      if (key === sortKey) th.setAttribute('aria-sort', sortDir > 0 ? 'ascending' : 'descending');
      else th.removeAttribute('aria-sort');
    });
  }
  rosterHeads.forEach(th => th.querySelector('button')?.addEventListener('click', e => {
    const key = e.currentTarget.dataset.key;
    sortDir = key === sortKey ? -sortDir : 1; sortKey = key;
    renderRoster();
  }));
  renderRoster();

  document.querySelectorAll('.section-index, .focus__intro, .team h2, .contact__layout').forEach(el => el.classList.add('reveal'));
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      const number = entry.target.querySelector('[data-count]');
      if (number && !paused) counters.push({ el: number, value: Number(number.dataset.count), start: time });
      observer.unobserve(entry.target);
    }), { threshold: .12 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    root.classList.add('motion-ready');
  }

  function measureScroll() {
    dirty = false;
    targetY = scrollY;
    const max = root.scrollHeight - height;
    progress.style.transform = `scaleX(${max > 0 ? targetY / max : 0})`;
    const rect = statement.getBoundingClientRect();
    readAmount = clamp((height * .85 - rect.top) / (height * .45));
    words.forEach((word, i) => word.classList.toggle('is-lit', readAmount > i / words.length));
    let active = '';
    sections.forEach(section => { if (section.getBoundingClientRect().top < height * .45) active = section.id; });
    navLinks.forEach(link => {
      if (link.hash === `#${active}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    const contactRect = contact.getBoundingClientRect();
    scene = Math.max(clamp(1 - targetY / (heroHeight * .95)), clamp((height - contactRect.top) / height) * .7);
  }
  addEventListener('scroll', () => { dirty = true; if (paused) { measureScroll(); draw(); } }, { passive: true });
  // Changes to disclosure height update page progress and scene bounds.
  const disclosures = [...document.querySelectorAll('.focus-item')];
  disclosures.forEach(item => item.addEventListener('toggle', () => {
    dirty = true;
    if (paused) measureScroll();
  }));

  let seed = 712;
  function random() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
  // Depth layers of independent streams: crisp leading glyphs, dimmer trails.
  // Time-based positions keep speed consistent at different refresh rates.
  const streams = Array.from({ length: 96 }, (_, i) => ({
    x: random(), offset: random() * 2400, speed: 28 + random() * 58,
    length: 9 + Math.floor(random() * 19), depth: i % 3,
    seed: Math.floor(random() * 500),
  }));
  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    if (scene < .015) return;
    const mobile = width < 600;
    const count = mobile ? 34 : Math.min(96, Math.ceil(width / 16));
    const clock = paused ? 18 : time / 1000;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i < count; i++) {
      const stream = streams[i];
      const depth = stream.depth;
      const size = (mobile ? 10 : 11) + depth * 2;
      const step = size * 1.35;
      const tail = stream.length * step;
      const head = ((clock * stream.speed * (1 + depth * .2) + stream.offset) % (height + tail + 120)) - 40;
      const x = stream.x * width + (paused ? 0 : mx * (depth + 1) * 9);
      // Keep the text side quiet; the right side carries the brighter code.
      const side = mobile ? .46 : .2 + clamp(x / width - .3) * 1.05;
      const strength = (.28 + depth * .16) * side * scene;
      ctx.font = `500 ${size}px monospace`;
      for (let j = 0; j < stream.length; j++) {
        const gy = head - j * step;
        if (gy < -size || gy > height) continue;
        const fade = (1 - j / stream.length) ** 1.4;
        const change = Math.floor(clock * (j === 0 ? 7 : 1.8));
        const char = chars[(stream.seed + j * 17 + change) % chars.length];
        ctx.fillStyle = j === 0
          ? `rgba(243,185,255,${strength * 1.5})`
          : `rgba(192,38,217,${strength * fade})`;
        ctx.fillText(char, x, gy);
        if (j === 0 && depth === 2) {
          ctx.fillStyle = `rgba(192,38,217,${strength * .07})`;
          ctx.fillRect(x - size, gy - 4, size * 2, size * 1.8);
        }
      }
    }
  }
  function resize() {
    width = innerWidth; height = innerHeight; heroHeight = hero.offsetHeight;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    measureScroll(); draw();
  }
  addEventListener('resize', resize, { passive: true });
  addEventListener('pointermove', e => {
    if (!fine.matches || paused) return;
    px = e.clientX / width - .5; py = e.clientY / height - .5;
  }, { passive: true });

  function frame(now) {
    raf = 0;
    if (paused || document.hidden) return;
    const dt = last ? Math.min(now - last, 50) : 16;
    last = now; time += dt;
    if (dirty) measureScroll();
    y += (targetY - y) * (1 - Math.exp(-dt / 100));
    mx += (px - mx) * .06; my += (py - my) * .06;
    if (targetY < heroHeight) {
      const p = clamp(y / heroHeight);
      lines.forEach((line, i) => { line.style.transform = `translate3d(${p * (i % 2 ? 24 : -12)}px, ${p * -16}px, 0)`; });
    }
    if (!scrambleDone && time - lastScramble > 70) {
      lastScramble = time;
      scramble.textContent = [...target].map((c, i) => time > 180 + i * 75 ? c : chars[Math.floor(random() * chars.length)]).join('');
      if (time > 800) { scramble.textContent = target; scrambleDone = true; }
    }
    for (let i = counters.length - 1; i >= 0; i--) {
      const c = counters[i], p = clamp((time - c.start) / 1400);
      c.el.textContent = Math.round(c.value * (1 - (1 - p) ** 3));
      if (p === 1) counters.splice(i, 1);
    }
    if (now - lastPaint > 32) { draw(); lastPaint = now; }
    raf = requestAnimationFrame(frame);
  }
  function start() { last = 0; if (!raf && !paused && !document.hidden) raf = requestAnimationFrame(frame); }
  function setMotion(value, save = false) {
    paused = value;
    root.classList.toggle('motion-paused', paused);
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.setAttribute('aria-label', paused ? 'Enable animations' : 'Pause animations');
    toggle.querySelector('span').textContent = paused ? 'OFF' : 'ON';
    if (save) { try { sessionStorage.setItem('upper-motion', paused ? 'off' : 'on'); } catch { /* Optional preference. */ } }
    if (paused) {
      cancelAnimationFrame(raf); raf = 0;
      scramble.textContent = target; scrambleDone = true;
      counters.splice(0).forEach(c => { c.el.textContent = c.value; });
      lines.forEach(line => { line.style.transform = ''; });
      draw();
    } else { dirty = true; start(); }
  }
  toggle.addEventListener('click', () => setMotion(!paused, true));
  reduced.addEventListener('change', e => setMotion(e.matches));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
    else { tick(); dirty = true; start(); }
  });
  function tick() { document.getElementById('footer-time').textContent = new Date().toISOString().slice(11,19) + ' UTC'; }
  document.getElementById('year').textContent = new Date().getFullYear();
  tick(); setInterval(() => { if (!document.hidden) tick(); }, 1000);
  resize(); setMotion(paused);
})();
