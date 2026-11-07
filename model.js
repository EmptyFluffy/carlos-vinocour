// The home (2026-11-06): each project as a line model of 6,000 segments (assets/geo/<id>.bin, tools/models.py), drawn
// full bleed behind the project's name; one model turns into the next. The slideshow pauses on hover, on drag, with
// its button or the space bar; the arrow keys step through it; ?p=<id> opens on a project. app.js writes the page
// with window.V2.homeHTML() and starts it with window.V2.init(root), which stops by itself when the page is replaced.
(() => {
  const ROWS = [
    ['zha', 'Mohari Villas', '2021–2023', 'zha/int-bedroom'],
    ['predock', 'Bahías', '2021–2025', 'bahias/cluster-7-8-9'],
    ['museum', 'Military museum', '2018', 'museum/aerial'],
    ['stair', 'Capital Group', '2018', 'stair/perspective'],
    ['mall', 'Mall of the Emirates', '2018', 'mall/exterior'],
    ['mecca', 'Jabal Omar', '2016', 'mecca/terrace'],
    ['nya', 'NYA', '2018', 'nya/town-center'],
    ['tamarindo', 'Tamarindo 2050', '2017', 'tamarindo/render'],
    ['shade', 'Pavilion', '2016', 'shade/dusk-card'],
    ['facades', 'Facade studies', '2023', 'hcp/facades-still'],
    ['surface', 'Porous field', '2024', 'surface-cover'],
  ].map(([id, name, yr, cover]) => ({ id, name, yr, cover }));
  const MORE = [['papagayo-404', 'Papagayo 404', '2020', 'p404/1'], ['housing', 'Living system', '2017', 'housing/night'],
    ['la-perla', 'La Perla', '2021', 'la-perla/stack'], ['prizma', 'Prizma', '2026', 'prizma/mockup']];
  const ALPHA = { mecca: 0.4, predock: 0.6, nya: 0.75, museum: 0.8, zha: 0.85 };
  const N = 6000, DWELL = 7000, MORPH = 1700, ISO = 0.6155, GEO = '/assets/geo/';
  const pad = (n) => String(n).padStart(2, '0');

  const cardHTML = ([id, nm, yr, c]) => `<a class="card" href="/work/${id}"><span class="ph"><img src="assets/${c}.webp" alt="" loading="lazy" decoding="async"></span><span class="cap"><span>${nm}</span><b>${yr}</b></span></a>`;
  const homeHTML = () => `
  <h1 class="vh">Carlos Vinocour, architect and computational designer</h1>
  <section class="hero" data-hero aria-roledescription="carousel" aria-label="Selected work, as models">
    <canvas data-canvas aria-hidden="true"></canvas>
    <div class="title">
      <p class="code mono"><span data-code>W01</span><span data-yr></span></p>
      <div class="headline">
        <h2 class="name" aria-live="polite"><a data-name href="/work/zha"><span>Mohari Villas</span></a></h2>
        <a class="go" data-open href="/work/zha">View project <span aria-hidden="true">→</span></a>
      </div>
    </div>
    <ol class="rail" data-rail aria-label="Projects">${ROWS.map((r, i) => `<li><a href="/work/${r.id}" data-i="${i}">${r.name}<b>${pad(i + 1)}</b></a><i></i></li>`).join('')}</ol>
    <div class="controls mono">
      <a class="down" href="#work" aria-label="Down to the work"><svg viewBox="0 0 26 16" aria-hidden="true"><path d="M2 3l11 11L24 3"/></svg></a>
      <div class="step" role="group" aria-label="Change project">
        <button type="button" data-prev aria-label="Previous project"><svg viewBox="0 0 16 26" aria-hidden="true"><path d="M13 2 3 13l10 11"/></svg></button>
        <span data-count>01 / ${pad(ROWS.length)}</span>
        <button type="button" data-next aria-label="Next project"><svg viewBox="0 0 16 26" aria-hidden="true"><path d="M3 2l10 11-10 11"/></svg></button>
        <button type="button" class="pause" data-pause aria-pressed="false" aria-label="Pause the slideshow"><i></i></button>
      </div>
    </div>
    <p class="hint mono" data-hint>Drag to orbit</p>
  </section>
  <div class="v2-home">
    <section class="sec" id="work">
      <p class="code mono">W</p>
      <h2 class="big">Selected work.</h2>
      <div class="cards">${[...ROWS.map((r) => [r.id, r.name, r.yr, r.cover]), ...MORE].map(cardHTML).join('')}</div>
      <a class="more" href="/work">All 74 projects in the index <span aria-hidden="true">→</span></a>
    </section>
    <section class="sec" id="about">
      <p class="code mono">A1</p>
      <h2 class="big">Architect and computational designer in Costa Rica, ten years across design, documentation and construction.</h2>
      <div class="cols">
        <p>I have worked on the architect-of-record team for houses by Zaha Hadid Architects and Antoine Predock at Peninsula Papagayo, on competitions and built work at Gensler New York, and as design lead in my own studio.</p>
        <p>I lead coordination between design architects, consultants and site, and I write the Grasshopper and Dynamo tools that carry complex geometry into Revit and construction documents. <a href="/about">More, and the CV</a>.</p>
      </div>
    </section>
    <section class="sec" id="contact">
      <p class="code mono">C1</p>
      <h2 class="big">For collaborations and conversations.</h2>
      <a class="mail" href="mailto:vinocouralvarez@gmail.com">vinocouralvarez@gmail.com</a>
      <p class="links"><a href="https://www.linkedin.com/in/carlos-vinocour-alvarez-086a88b9" target="_blank" rel="noopener">LinkedIn ↗</a><a href="https://cava.design/" target="_blank" rel="noopener">Studio CAVA ↗</a></p>
    </section>
  </div>`;

  // models, shared by every start of the page
  const meta = fetch(GEO + 'meta.json').then((r) => r.json());
  const cache = {};
  const load = (id) => cache[id] || (cache[id] = Promise.all([fetch(`${GEO}${id}.bin`).then((r) => r.arrayBuffer()), meta]).then(([buf, m]) => {
    const u = new Uint16Array(buf), p = new Float32Array(u.length);
    let r = 0, zmin = 1;
    for (let i = 0; i < u.length; i++) p[i] = u[i] / 65535 - 0.5;
    for (let i = 0; i < p.length; i += 3) { r = Math.max(r, Math.hypot(p[i], p[i + 1], p[i + 2])); zmin = Math.min(zmin, p[i + 2]); }
    const info = m.models[id];
    return { id, p, r, zmin, metres: Math.max(...info.size), info, alpha: ALPHA[id] || 1 };
  }));

  function init(root) {
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const $ = (s) => root.querySelector(s);
    const hero = $('[data-hero]'), cv = $('[data-canvas]'), ctx = cv.getContext('2d'), rail = $('[data-rail]');
    const items = [...rail.children];
    rail.style.setProperty('--dwell', DWELL + 'ms');
    const nameA = $('[data-name]'), open = $('[data-open]'), code = $('[data-code]'), yr = $('[data-yr]'), count = $('[data-count]');
    const pauseB = $('[data-pause]'), hint = $('[data-hint]');
    const cur = new Float32Array(N * 6), from = new Float32Array(N * 6), sx = new Float32Array(N * 4), dep = new Float32Array(N), bin = new Uint8Array(N);
    let model = null, prev = null, t0 = 0, morphing = false, active = -1, W = 0, H = 0, dpr = 1, rNow = 1, aNow = 1, raf = 0;
    let yaw = -Math.PI / 4, pitch = ISO, visible = true, held = false, paused = still, next = 0, drag = null;

    const size = () => { dpr = Math.min(devicePixelRatio || 1, 2); W = cv.clientWidth; H = cv.clientHeight; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); };
    const ro = new ResizeObserver(size); ro.observe(cv);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }); io.observe(hero);
    const ease = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
    const nice = (v) => [0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500].reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));

    // the ground: snap crosses at the grid's crossings, in the model's own plane and spacing, under its footprint
    function ground(m, a, s, cx, cy) {
      if (!m || a <= 0.01) return;
      const step = nice(m.metres / 10) / m.metres, n = Math.floor(0.56 / step), z = m.zmin;
      const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      ctx.beginPath();
      for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) {
        const x = i * step, y = j * step, X = cx + s * (x * cyw - y * syw), Y = cy - s * (z * cp + (x * syw + y * cyw) * sp);
        ctx.moveTo(X - 2.5, Y); ctx.lineTo(X + 2.5, Y); ctx.moveTo(X, Y - 2.5); ctx.lineTo(X, Y + 2.5);
      }
      ctx.strokeStyle = `rgba(18,18,21,${0.22 * a})`; ctx.lineWidth = 0.8; ctx.stroke();
    }
    function gizmo(ox, oy) {
      const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), L = 16;
      ctx.font = '9px "Geist Mono", monospace'; ctx.lineWidth = 1.2; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const [x, y, z, c, t] of [[1, 0, 0, '#d2453a', 'x'], [0, 1, 0, '#3a9d4f', 'y'], [0, 0, 1, '#3f6fd8', 'z']]) {
        const X = x * cyw - y * syw, Y = z * cp + (x * syw + y * cyw) * sp;
        ctx.strokeStyle = c; ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + X * L, oy - Y * L); ctx.stroke();
        ctx.fillText(t, ox + X * (L + 7), oy - Y * (L + 7));
      }
    }

    function frame(now) {
      if (!cv.isConnected) return stop();   // the page was replaced: stop drawing and let go of the window
      raf = requestAnimationFrame(frame);
      if (!model || !visible || document.hidden) return;
      if (!held && !paused && now > next) select((active + 1) % ROWS.length);
      if (!still && !drag) yaw += 0.001;
      const e = morphing ? Math.min(1, (now - t0) / MORPH) : 1;
      if (morphing) {
        const p = model.p;
        for (let i = 0; i < N; i++) {
          const w = ease(Math.min(1, Math.max(0, (e - (i / N) * 0.4) / 0.6))), j = i * 6;
          for (let k = 0; k < 6; k++) cur[j + k] = from[j + k] + (p[j + k] - from[j + k]) * w;
        }
        if (e >= 1) morphing = false;
      }
      const g = ease(e), r = prev ? prev.r + (model.r - prev.r) * g : model.r;
      // the model in the middle of the page, above the name
      const s = (0.46 * Math.min(W * 0.58, H * 0.7)) / r, cx = W / 2, cy = W > 820 ? H * 0.46 : H / 2;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      ground(prev, 1 - g, s, cx, cy); ground(model, g, s, cx, cy);
      const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      let dmin = 1e9, dmax = -1e9;
      for (let i = 0; i < N; i++) {
        const j = i * 6, q = i * 4;
        for (let h = 0; h < 2; h++) {
          const x = cur[j + h * 3], y = cur[j + h * 3 + 1], z = cur[j + h * 3 + 2], yr = x * syw + y * cyw;
          sx[q + h * 2] = cx + s * (x * cyw - y * syw); sx[q + h * 2 + 1] = cy - s * (z * cp + yr * sp);
          if (h === 0) dep[i] = -yr * cp + z * sp;
        }
        if (dep[i] < dmin) dmin = dep[i]; if (dep[i] > dmax) dmax = dep[i];
      }
      const span = dmax - dmin + 1e-6;
      for (let i = 0; i < N; i++) bin[i] = Math.min(2, Math.floor(((dep[i] - dmin) / span) * 3));
      const am = prev ? prev.alpha + (model.alpha - prev.alpha) * g : model.alpha;
      rNow = r; aNow = am;
      ctx.lineCap = 'round'; ctx.lineWidth = 0.85;
      [0.16, 0.34, 0.72].forEach((a, b) => {
        ctx.beginPath();
        for (let i = 0; i < N; i++) if (bin[i] === b) { const q = i * 4; ctx.moveTo(sx[q], sx[q + 1]); ctx.lineTo(sx[q + 2], sx[q + 3]); }
        ctx.strokeStyle = `rgba(18,18,21,${Math.min(1, a * am)})`; ctx.stroke();
      });
      gizmo(W > 820 ? W - 60 : W - 34, W > 820 ? H * 0.2 : H - 34);
    }

    // the name changes like a split-flap: the old one rises out, the new one rises in. The one sent out is always the
    // one on show, and any still leaving goes at once, or quick changes left names stacked up the page (2026-11-06)
    function setName(text, href) {
      nameA.querySelectorAll('span.out').forEach((s) => s.remove());
      const old = nameA.querySelector('span');
      nameA.href = href;
      if (still || !old || active < 0) { nameA.innerHTML = `<span>${text}</span>`; return; }
      const nu = document.createElement('span'); nu.textContent = text; nu.className = 'in';
      old.classList.add('out'); old.style.position = 'absolute';
      nameA.style.position = 'relative'; nameA.appendChild(nu);
      requestAnimationFrame(() => requestAnimationFrame(() => nu.classList.remove('in')));
      setTimeout(() => old.remove(), 560);   // a no-op if the next change already took it
    }

    async function select(i, byHand) {
      if (i === active) return;
      const first = active < 0; active = i; next = performance.now() + DWELL;
      const row = ROWS[i];
      items.forEach((li, k) => li.classList.toggle('on', k === i));
      if (first) nameA.innerHTML = `<span>${row.name}</span>`; else setName(row.name, `/work/${row.id}`);
      nameA.href = open.href = `/work/${row.id}`; code.textContent = `W${pad(i + 1)}`; yr.textContent = row.yr;
      count.textContent = `${pad(i + 1)} / ${pad(ROWS.length)}`;
      if (byHand) history.replaceState(history.state, '', `?p=${row.id}`);
      const m = await load(row.id);
      if (active !== i || !cv.isConnected) return;
      from.set(model ? cur : intro(m)); prev = model ? { ...model, r: rNow, alpha: aNow } : m; model = m;
      t0 = performance.now(); morphing = !still; if (still) cur.set(m.p);
      [i - 1, i + 1].forEach((k) => load(ROWS[(k + ROWS.length) % ROWS.length].id));
    }
    function intro(m) { const f = Float32Array.from(m.p); for (let j = 2; j < f.length; j += 3) f[j] = m.zmin; return f; }
    const step = (d) => select((active + d + ROWS.length) % ROWS.length, true);
    function restartTick() { const li = items[active]; if (!li) return; li.classList.remove('on'); void li.offsetWidth; li.classList.add('on'); }
    function setPaused(p) {
      paused = p; pauseB.setAttribute('aria-pressed', String(p)); pauseB.setAttribute('aria-label', p ? 'Play the slideshow' : 'Pause the slideshow');
      hero.classList.toggle('held', p || held); if (!p) { next = performance.now() + DWELL; restartTick(); }
    }

    items.forEach((li, i) => { const a = li.querySelector('a'); a.addEventListener('mouseenter', () => select(i, true)); a.addEventListener('focus', () => select(i, true)); });
    rail.addEventListener('mouseenter', () => { held = true; hero.classList.add('held'); });
    rail.addEventListener('mouseleave', () => { held = false; hero.classList.toggle('held', paused); next = performance.now() + DWELL; restartTick(); });
    $('[data-prev]').addEventListener('click', () => step(-1));
    $('[data-next]').addEventListener('click', () => step(1));
    pauseB.addEventListener('click', () => setPaused(!paused));
    // the chevron down scrolls to the work itself: followed as a link, #work would reach app.js as a popstate and
    // redraw the home at the top
    $('.down').addEventListener('click', (e) => { e.preventDefault(); root.querySelector('#work').scrollIntoView({ behavior: still ? 'auto' : 'smooth' }); });
    const onKey = (e) => {
      if (e.target.closest('input,textarea,select,dialog') || e.metaKey || e.ctrlKey || e.altKey || !visible) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
      else if (e.key === ' ' && (e.target === document.body || e.target.closest('main') === e.target)) { e.preventDefault(); setPaused(!paused); }
    };
    addEventListener('keydown', onKey);

    cv.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY }; cv.setPointerCapture(e.pointerId); cv.classList.add('drag'); held = true; hero.classList.add('held'); hint.classList.add('gone'); });
    cv.addEventListener('pointermove', (e) => {
      if (!drag) return;
      yaw += (e.clientX - drag.x) * 0.008; pitch = Math.min(1.5, Math.max(0.05, pitch + (e.clientY - drag.y) * 0.006));
      drag = { x: e.clientX, y: e.clientY };
    });
    const up = () => { if (!drag) return; drag = null; cv.classList.remove('drag'); held = false; hero.classList.toggle('held', paused); next = performance.now() + DWELL; restartTick(); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('dblclick', () => { yaw = -Math.PI / 4; pitch = ISO; });
    setTimeout(() => hint.classList.add('gone'), 6000);
    function stop() { cancelAnimationFrame(raf); removeEventListener('keydown', onKey); ro.disconnect(); io.disconnect(); }

    const want = new URLSearchParams(location.search).get('p'), start = Math.max(0, ROWS.findIndex((r) => r.id === want));
    size(); setPaused(paused); select(start); raf = requestAnimationFrame(frame);
  }

  // the sheet number of a project: the home's order first, then the rest in projects.js order
  const order = [...ROWS.map((r) => r.id), ...MORE.map((m) => m[0])];
  const sheet = (id) => { const i = order.indexOf(id); return i < 0 ? '' : `W${pad(i + 1)}`; };
  window.V2 = { homeHTML, init, cardHTML, sheet, rows: ROWS, more: MORE };
})();
