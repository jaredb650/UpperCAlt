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


  // Portfolio roster driven by data/portfolio.js (synced from Google Sheets via scripts/sync-portfolio.py).
  const PORTFOLIO = (window.UPPER_PORTFOLIO && Array.isArray(window.UPPER_PORTFOLIO.companies))
    ? window.UPPER_PORTFOLIO.companies
    : [];
  const INITIAL_LIMIT = 15;
  const STAGE_RANK = {
    'pre-seed': 1, 'seed': 2, 'series a': 3, 'series b': 4,
    'series c': 5, 'series d': 6, 'series e': 7, 'series f': 8,
  };
  const OUTCOME_RANK = { public: 1, acquired: 2, realized: 3, active: 4 };
  const OUTCOME_LABEL = {
    public: '◆ PUBLIC',
    acquired: '◇ ACQUIRED',
    realized: '◇ REALIZED',
    active: '● ACTIVE',
  };

  const isExit = co => co.outcomeType === 'public' || co.outcomeType === 'acquired' || co.outcomeType === 'realized';

  // Populate dynamic proof metrics from the active roster.
  const metricsEl = document.getElementById('roster-metrics');
  if (metricsEl && PORTFOLIO.length) {
    const years = PORTFOLIO.map(c => c.year).filter(Boolean);
    const minYear = years.length ? Math.min(...years) : 2012;
    const setMetric = (name, value) => {
      const el = metricsEl.querySelector(`[data-metric="${name}"]`);
      if (el) el.textContent = String(value);
    };
    setMetric('total', PORTFOLIO.length);
    setMetric('exits', PORTFOLIO.filter(isExit).length);
    setMetric('early', PORTFOLIO.filter(c => c.early).length);
    const vintageEl = metricsEl.querySelector('[data-metric="vintage"]');
    if (vintageEl) {
      vintageEl.textContent = String(minYear);
      const dash = document.createElement('span');
      dash.className = 'accent';
      dash.textContent = '—';
      vintageEl.append(dash);
    }
  }

  // Render flagship spotlights (only companies currently included in the sheet).
  const spotlightsWrap = document.getElementById('roster-spotlights');
  const spotlightsGrid = document.getElementById('spotlights-grid');
  const spotlights = PORTFOLIO
    .filter(c => c.spotlight)
    .sort((a, b) => (a.spotlight.order || 99) - (b.spotlight.order || 99));

  if (spotlightsWrap && spotlightsGrid) {
    if (!spotlights.length) {
      spotlightsWrap.hidden = true;
    } else {
      spotlightsGrid.replaceChildren(...spotlights.map((co, idx) => {
        const card = document.createElement('article');
        card.className = 'spotlight reveal';

        const meta = document.createElement('div');
        meta.className = 'spotlight__meta';
        const id = document.createElement('span');
        id.className = 'spotlight__id';
        id.textContent = `${String(idx + 1).padStart(2, '0')} // ${co.spotlight.tag || 'FEATURED'}`;
        const sec = document.createElement('span');
        sec.className = 'spotlight__sector';
        sec.textContent = co.segment;
        meta.append(id, sec);

        const title = document.createElement('h3');
        title.className = 'spotlight__name';
        title.textContent = co.name;

        const path = document.createElement('div');
        path.className = 'spotlight__path';
        const entry = document.createElement('span');
        entry.className = 'spotlight__entry';
        entry.textContent = `ENTRY · ${co.stage ? `${co.stage.toUpperCase()} · ` : ''}${co.year || '—'}`;
        const arrow = document.createElement('span');
        arrow.className = 'spotlight__arrow';
        arrow.setAttribute('aria-hidden', 'true');
        arrow.textContent = '→';
        const outcome = document.createElement('span');
        outcome.className = 'spotlight__outcome';
        outcome.textContent = co.spotlight.outcome || co.subline || co.status;
        path.append(entry, arrow, outcome);

        const story = document.createElement('p');
        story.className = 'spotlight__story';
        story.textContent = co.spotlight.story || '';

        const links = document.createElement('div');
        links.className = 'spotlight__links';
        [['SITE ↗', co.site], ['CRUNCHBASE ↗', co.crunchbase]].forEach(([label, href]) => {
          if (!href) return;
          const a = document.createElement('a');
          a.href = href;
          a.textContent = label;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          links.append(a);
        });

        card.append(meta, title, path, story);
        if (links.childNodes.length) card.append(links);
        return card;
      }));
    }
  }

  // Interactive directory state & controls.
  const rosterBody = document.getElementById('roster-body');
  const rosterHeads = [...document.querySelectorAll('.roster__table th')];
  const rosterTabs = [...document.querySelectorAll('.roster__tab')];
  const rosterSectors = document.getElementById('roster-sectors');
  const rosterSearch = document.getElementById('roster-search');
  const rosterCount = document.getElementById('roster-count');
  const rosterMore = document.getElementById('roster-more');
  const rosterToggle = document.getElementById('roster-toggle');
  const rosterToggleLabel = document.getElementById('roster-toggle-label');
  const rosterToggleArrow = rosterToggle ? rosterToggle.querySelector('.roster__toggle-arrow') : null;

  let activeView = 'all';
  let activeSector = 'all';
  let searchQuery = '';
  let sortKey = null; // null = curated highlights-first order
  let sortDir = 1;
  let expanded = false;

  // Fill view tab counts dynamically.
  const viewCounts = {
    all: PORTFOLIO.length,
    featured: PORTFOLIO.filter(c => c.featured).length,
    exits: PORTFOLIO.filter(isExit).length,
    early: PORTFOLIO.filter(c => c.early).length,
  };
  Object.entries(viewCounts).forEach(([key, val]) => {
    const el = document.querySelector(`[data-count-view="${key}"]`);
    if (el) el.textContent = `[${val}]`;
  });

  // Build sector chips dynamically from active data.
  const sectorTotals = new Map();
  PORTFOLIO.forEach(co => sectorTotals.set(co.segment, (sectorTotals.get(co.segment) || 0) + 1));
  const sortedSectors = [...sectorTotals.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  function renderSectorButtons() {
    if (!rosterSectors) return;
    const items = [['all', 'ALL SECTORS', PORTFOLIO.length], ...sortedSectors.map(([seg, n]) => [seg, seg, n])];
    rosterSectors.replaceChildren(...items.map(([value, label, count]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'roster__sector' + (activeSector === value ? ' is-active' : '');
      btn.dataset.sector = value;
      btn.setAttribute('aria-pressed', String(activeSector === value));
      btn.textContent = value === 'all' ? label : `${label} (${count})`;
      btn.addEventListener('click', () => {
        activeSector = value;
        renderSectorButtons();
        renderRoster();
      });
      return btn;
    }));
  }

  function compareCompanies(a, b) {
    if (!sortKey) {
      // Curated order: spotlights first, then featured/exits, then alphabetical.
      const aSpot = a.spotlight ? a.spotlight.order : 999;
      const bSpot = b.spotlight ? b.spotlight.order : 999;
      if (aSpot !== bSpot) return aSpot - bSpot;
      const aTier = (a.featured ? 0 : 2) + (isExit(a) ? 0 : 1);
      const bTier = (b.featured ? 0 : 2) + (isExit(b) ? 0 : 1);
      if (aTier !== bTier) return aTier - bTier;
      return a.name.localeCompare(b.name);
    }
    if (sortKey === 'stage') {
      const ra = STAGE_RANK[(a.stage || '').toLowerCase()] || 99;
      const rb = STAGE_RANK[(b.stage || '').toLowerCase()] || 99;
      if (ra === 99 && rb !== 99) return 1;
      if (rb === 99 && ra !== 99) return -1;
      return (ra - rb) * sortDir || a.name.localeCompare(b.name);
    }
    if (sortKey === 'year') {
      const ya = a.year || 0;
      const yb = b.year || 0;
      if (!ya && yb) return 1;
      if (!yb && ya) return -1;
      return (ya - yb) * sortDir || a.name.localeCompare(b.name);
    }
    if (sortKey === 'outcomeType') {
      const oa = OUTCOME_RANK[a.outcomeType] || 9;
      const ob = OUTCOME_RANK[b.outcomeType] || 9;
      return (oa - ob) * sortDir || a.name.localeCompare(b.name);
    }
    const va = String(a[sortKey] || '');
    const vb = String(b[sortKey] || '');
    return va.localeCompare(vb) * sortDir || a.name.localeCompare(b.name);
  }

  function resetFilters() {
    activeView = 'all';
    activeSector = 'all';
    searchQuery = '';
    if (rosterSearch) rosterSearch.value = '';
    rosterTabs.forEach(tab => {
      const active = tab.dataset.view === 'all';
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    renderSectorButtons();
    renderRoster();
  }

  function renderRoster() {
    if (!rosterBody) return;
    const q = searchQuery.trim().toLowerCase();
    const filtered = PORTFOLIO.filter(co => {
      if (activeView === 'featured' && !co.featured) return false;
      if (activeView === 'exits' && !isExit(co)) return false;
      if (activeView === 'early' && !co.early) return false;
      if (activeSector !== 'all' && co.segment !== activeSector) return false;
      if (q) {
        const hay = `${co.name} ${co.segment} ${co.industry} ${co.stage} ${co.year || ''} ${co.subline || ''} ${co.status}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort(compareCompanies);

    const isDefaultUnfiltered = activeView === 'all' && activeSector === 'all' && !q;
    const shouldTruncate = isDefaultUnfiltered && !expanded && filtered.length > INITIAL_LIMIT;
    const visible = shouldTruncate ? filtered.slice(0, INITIAL_LIMIT) : filtered;

    if (!visible.length) {
      const tr = document.createElement('tr');
      tr.className = 'roster__empty';
      const td = document.createElement('td');
      td.colSpan = 6;
      td.textContent = '> 0_MATCHES_FOUND';
      const resetBtn = document.createElement('button');
      resetBtn.type = 'button';
      resetBtn.className = 'roster__reset';
      resetBtn.textContent = 'RESET_FILTERS';
      resetBtn.addEventListener('click', resetFilters);
      td.append(resetBtn);
      tr.append(td);
      rosterBody.replaceChildren(tr);
    } else {
      rosterBody.replaceChildren(...visible.map(co => {
        const tr = document.createElement('tr');
        if (co.featured) tr.className = 'is-featured';

        // 1. Company + outcome/rename subline
        const tdName = document.createElement('td');
        const nameEl = document.createElement('span');
        nameEl.className = 'roster__name';
        nameEl.textContent = co.name;
        tdName.append(nameEl);
        if (co.subline) {
          const sub = document.createElement('span');
          sub.className = 'roster__sub' + (isExit(co) || co.spotlight ? ' roster__sub--outcome' : '');
          sub.textContent = co.subline;
          tdName.append(sub);
        }

        // 2. Sector + Industry
        const tdSector = document.createElement('td');
        tdSector.dataset.label = 'SECTOR';
        const seg = document.createElement('span');
        seg.className = 'roster__seg';
        seg.textContent = co.segment;
        tdSector.append(seg);
        if (co.industry) {
          const ind = document.createElement('span');
          ind.className = 'roster__ind';
          ind.textContent = co.industry;
          tdSector.append(ind);
        }

        // 3. First round
        const tdStage = document.createElement('td');
        tdStage.className = 'roster__stage';
        tdStage.dataset.label = 'FIRST ROUND';
        tdStage.textContent = co.stage || '—';

        // 4. Vintage year
        const tdYear = document.createElement('td');
        tdYear.className = 'roster__year';
        tdYear.dataset.label = 'YEAR';
        tdYear.textContent = co.year ? String(co.year) : '—';

        // 5. Status badge
        const tdStatus = document.createElement('td');
        tdStatus.dataset.label = 'STATUS';
        const badge = document.createElement('span');
        badge.className = `status-badge status-badge--${co.outcomeType || 'active'}`;
        badge.textContent = OUTCOME_LABEL[co.outcomeType] || '● ACTIVE';
        tdStatus.append(badge);

        // 6. External links
        const tdLinks = document.createElement('td');
        tdLinks.className = 'roster__links';
        tdLinks.dataset.label = 'LINKS';
        const linkList = [['SITE ↗', co.site], ['CRUNCHBASE ↗', co.crunchbase]].filter(([, href]) => Boolean(href));
        if (linkList.length) {
          linkList.forEach(([label, href]) => {
            const a = document.createElement('a');
            a.href = href;
            a.textContent = label;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            tdLinks.append(a);
          });
        } else {
          const dash = document.createElement('span');
          dash.className = 'roster__nolink';
          dash.textContent = '—';
          tdLinks.append(dash);
        }

        tr.append(tdName, tdSector, tdStage, tdYear, tdStatus, tdLinks);
        return tr;
      }));
    }

    if (rosterCount) {
      rosterCount.textContent = filtered.length === PORTFOLIO.length
        ? `SHOWING ${visible.length} OF ${PORTFOLIO.length}`
        : `${filtered.length} MATCH${filtered.length === 1 ? '' : 'ES'} OF ${PORTFOLIO.length}`;
    }

    if (rosterMore && rosterToggle && rosterToggleLabel) {
      const showToggle = isDefaultUnfiltered && filtered.length > INITIAL_LIMIT;
      rosterMore.hidden = !showToggle;
      if (showToggle) {
        const remaining = filtered.length - INITIAL_LIMIT;
        rosterToggle.setAttribute('aria-expanded', String(expanded));
        rosterToggleLabel.textContent = expanded
          ? `COLLAPSE_INDEX [ SHOW TOP ${INITIAL_LIMIT} ]`
          : `SHOW_ALL_COMPANIES [ +${remaining} MORE ]`;
        if (rosterToggleArrow) rosterToggleArrow.textContent = expanded ? '↑' : '↓';
      }
    }

    rosterHeads.forEach(th => {
      const key = th.querySelector('button')?.dataset.key;
      if (sortKey && key === sortKey) th.setAttribute('aria-sort', sortDir > 0 ? 'ascending' : 'descending');
      else th.removeAttribute('aria-sort');
    });

    dirty = true;
    if (paused && typeof measureScroll === 'function') measureScroll();
  }

  rosterHeads.forEach(th => th.querySelector('button')?.addEventListener('click', e => {
    const key = e.currentTarget.dataset.key;
    sortDir = key === sortKey ? -sortDir : 1;
    sortKey = key;
    renderRoster();
  }));

  rosterTabs.forEach(tab => tab.addEventListener('click', () => {
    activeView = tab.dataset.view || 'all';
    rosterTabs.forEach(t => {
      const isCurrent = t === tab;
      t.classList.toggle('is-active', isCurrent);
      t.setAttribute('aria-selected', String(isCurrent));
    });
    renderRoster();
  }));

  if (rosterSearch) {
    rosterSearch.addEventListener('input', e => {
      searchQuery = e.target.value;
      renderRoster();
    });
  }

  if (rosterToggle) {
    rosterToggle.addEventListener('click', () => {
      expanded = !expanded;
      renderRoster();
    });
  }

  renderSectorButtons();
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
