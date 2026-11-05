// Project pages built from layout blocks (2026-10-27). Each project lists its blocks in LAYOUTS; app.js renders the
// page through window.RENDER[id] and adds the footer. Image proportions come from assets/sizes.js (tools/sizes.py).
//   hero(img, caption)                      one image across the column, the page's lead
//   side(text, img, caption, {flip, small}) text beside an image; small keeps a low-resolution image at its own size
//   row([[img, caption], ...], {max})       images side by side at one height, filling the width
//   carousel(title, [[img, caption], ...])  drawings on white, one height, scrolled with arrows
//   panel(img, caption)                     a single drawing on white
//   canvas(img, caption, {label})           a script canvas that opens in the zoom viewer
//   group(title, note, html)                blocks under one heading
//   steps(title, note, [[...], ...])        a process: words, whole canvas, detail, one row per step
//   row(..., {ink})                         ink: drawings on white, multiplied into the paper
// Image names are paths under assets/ without .webp ('p404/1'); a name with an extension is used as given.
window.RENDER = {};
const E = value => String(value).replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const SRC = name => `assets/${name}${/\.\w+$/.test(name) ? '' : '.webp'}`;
const SIZE = name => (window.SIZES || {})[SRC(name)] || [1600, 1000];
const RATIO = name => { const [w, h] = SIZE(name); return (w / h).toFixed(4); };
function shot(name, caption, style = '') {
  const [w, h] = SIZE(name);
  return `<button class="image-button" data-image="${SRC(name)}" data-caption="${E(caption)}" aria-label="Enlarge image: ${E(caption)}"><img src="${SRC(name)}" alt="${E(caption)}" loading="lazy" width="${w}" height="${h}" style="${style}"></button>`;
}
const cap = caption => caption ? `<figcaption class="image-caption">${E(caption)}</figcaption>` : '';
const prose = t => `<div class="b-text">${t.eyebrow ? `<p class="eyebrow">${E(t.eyebrow)}</p>` : ''}${t.h ? `<h2>${E(t.h)}</h2>` : ''}${(t.p || []).filter(Boolean).map(x => `<p>${E(x)}</p>`).join('')}${t.html || ''}</div>`;

const hero = (name, caption, pos = '50% 50%') => `<figure class="b-hero">${shot(name, caption, `--r:${RATIO(name)};object-position:${pos}`)}${cap(caption)}</figure>`;
const side = (text, name, caption, o = {}) => `<section class="b-side${o.flip ? ' flip' : ''}${o.small ? ' small' : ''}${o.ink ? ' ink' : ''}${o.soft ? ' soft' : ''}">${prose(text)}<figure${o.small ? ` style="max-width:${SIZE(name)[0]}px"` : ''}>${shot(name, caption)}${cap(caption)}</figure></section>`;
const row = (items, o = {}) => `<div class="b-row${o.ink ? ' ink' : ''}"${o.max ? ` style="max-width:${o.max}px"` : ''}>${items.map(([n, c]) => `<figure style="--r:${RATIO(n)};--w:${SIZE(n)[0]}px">${shot(n, c)}${cap(c)}</figure>`).join('')}</div>`;
const carousel = (title, items) => `<section class="b-car"><div class="b-car-head"><p class="eyebrow">${E(title)}</p><div class="b-car-nav"><span class="b-car-count">01 / ${String(items.length).padStart(2, '0')}</span><button data-car="-1" aria-label="Previous">←</button><button data-car="1" aria-label="Next">→</button></div></div><div class="b-car-track" tabindex="0" aria-label="${E(title)}">${items.map(([n, c]) => `<figure class="b-slide" style="--r:${RATIO(n)}">${shot(n, c)}${cap(c)}</figure>`).join('')}</div></section>`;
// a live page in a frame (Prizma's canvas): the frame takes the page's own height, on load and whenever it changes
const live = (src, caption, title) => `<figure class="b-live"><iframe src="${src}" title="${E(title)}" scrolling="no"></iframe>${cap(caption)}</figure>`;
// a sheet: small diagrams in one grid, the same cell for every step, numbered, on the page's paper (BIG's evolution
// diagrams: the argument read at a glance instead of one slide at a time)
const sheet = (title, items, o = {}) => {
  const rs = items.map(([n]) => +RATIO(n)).sort((a, b) => a - b), r = o.ratio || rs[Math.floor(rs.length / 2)].toFixed(4);   // the median cell
  const cols = o.strip ? (o.cols || items.length) : (o.cols || 2);
  return `<section class="b-sheet${o.dark ? ' dark' : ''}${o.strip ? ' strip' : ''}" style="--cols:${cols};--cols-m:${Math.ceil(cols / 2)};--r:${r}"><p class="eyebrow">${E(title)}</p><div class="b-sheet-grid">${items.map(([n, c], i) => `<figure>${shot(n, c)}<figcaption><span class="card-number">${o.numbers === false ? '' : String(i + 1).padStart(2, '0')}</span><span>${E(c)}</span></figcaption></figure>`).join('')}</div></section>`;
};
const text = t => `<section class="b-textblock">${prose(t)}</section>`;
const panel = (name, caption) => `<figure class="b-panel">${shot(name, caption)}${cap(caption)}</figure>`;
// a canvas too big to read in the column (a Grasshopper definition, a Dynamo graph): it opens in the zoom viewer
// of hcp.js (drag to pan, + and − to zoom) instead of the lightbox
const canvas = (name, caption, o = {}) => {
  const [w, h] = SIZE(name);
  return `<figure class="b-canvas"><button class="canvas-button" data-canvas="${SRC(name)}" data-w="${w}" data-h="${h}" data-label="${E(o.label || 'Canvas')}" data-caption="${E(caption)}" aria-label="Open in the zoom viewer: ${E(caption)}"><img src="${SRC(name)}" alt="${E(caption)}" loading="lazy" width="${w}" height="${h}"><span>zoom ↗</span></button>${cap(caption)}</figure>`;
};
// a group of figures under one heading, with a sentence before them if it needs one
const group = (title, note, inner) => `<section class="b-group"><p class="eyebrow">${E(title)}</p>${note ? `<p class="b-group-note">${E(note)}</p>` : ''}${inner}</section>`;
// a process in steps, one row each: the words, the whole canvas with a box on the part that does the step, that part
const steps = (title, note, items) => group(title, note, items.map(([t, body, all, ca, zoom, cz, label], i) =>
  `<div class="b-step"><div class="b-step-text"><span class="card-number">${String(i + 1).padStart(2, '0')}</span><h3>${E(t)}</h3><p>${E(body)}</p></div>${canvas(all, ca, { label })}${canvas(zoom, cz, { label })}</div>`).join(''));
window.BLOCKS = { hero, side, row, carousel, panel, prose, live, sheet, text, canvas, group, steps };
document.addEventListener('click', e => {
  const b = e.target.closest('[data-canvas]'); if (!b || typeof openScript !== 'function') return;
  const w = +b.dataset.w, h = +b.dataset.h;
  openScript({ src: b.dataset.canvas, w, h, box: [0, 0, w, h], label: b.dataset.label, caption: b.dataset.caption });
});

// the carousels: arrows step one slide, the counter follows the scroll; no arrows when every slide already fits
const slides = track => [...track.children];
function currentSlide(track) {
  if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 2) return slides(track).length - 1;
  const x0 = track.firstElementChild.offsetLeft; let best = 0;
  slides(track).forEach((s, i) => { if (Math.abs(s.offsetLeft - x0 - track.scrollLeft) < Math.abs(slides(track)[best].offsetLeft - x0 - track.scrollLeft)) best = i; });
  return best;
}
function count(track) {
  const el = track.closest('.b-car').querySelector('.b-car-count');
  el.textContent = `${String(currentSlide(track) + 1).padStart(2, '0')} / ${String(slides(track).length).padStart(2, '0')}`;
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-car]'); if (!b) return;
  const track = b.closest('.b-car').querySelector('.b-car-track');
  const i = Math.max(0, Math.min(slides(track).length - 1, currentSlide(track) + Number(b.dataset.car)));
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  track.scrollTo({ left: slides(track)[i].offsetLeft - track.firstElementChild.offsetLeft, behavior: still ? 'instant' : 'smooth' });
});
document.addEventListener('scroll', e => { if (e.target.classList && e.target.classList.contains('b-car-track')) count(e.target); }, true);
window.BLOCKS_INIT = root => {
  const fit = () => root.querySelectorAll('.b-car-track').forEach(t => { t.closest('.b-car').classList.toggle('fits', t.scrollWidth <= t.clientWidth + 2); count(t); });
  fit(); root.querySelectorAll('.b-car img').forEach(i => i.addEventListener('load', fit, { once: true }));
  root.querySelectorAll('.b-live iframe').forEach(f => f.addEventListener('load', () => {
    const doc = f.contentDocument; if (!doc) return;
    const size = () => { f.style.height = `${doc.documentElement.scrollHeight}px`; };
    size(); new ResizeObserver(size).observe(doc.body);
  }, { once: true }));
};

// the page around the blocks
// the type of work and its year, from the index (data.js), in the key's colours; a title's part after the slash in grey
const KIND_COLOR = { built: 'var(--built)', competition: 'var(--competition)', thesis: 'var(--study)', research: 'var(--study)', course: 'var(--study)', software: 'var(--software)', experiment: 'var(--software)' };
window.KIND_COLOR = KIND_COLOR;
window.kindOf = id => (window.WORK_INDEX || []).find(r => r.page === id);
window.kindHTML = id => { const r = window.kindOf(id); return r ? `<span class="kind" style="color:${KIND_COLOR[r.type] || 'var(--ink)'}">${E(r.type)}</span><span class="yr">${E(r.year)}</span>` : ''; };
window.titleHTML = t => { const [a, ...b] = String(t).split(' / '); return b.length ? `${E(a)}<span class="sub"> / ${E(b.join(' / '))}</span>` : E(t); };
const eyebrowOf = (p, eyebrow) => { const r = window.kindOf(p.id), first = String(eyebrow).split(' · ')[0];
  return r ? `${window.kindHTML(p.id)}${first.toLowerCase() === r.type ? '' : `<span> · ${E(first)}</span>`}` : E(eyebrow); };
const header = (p, eyebrow, lede) => `<a class="back" href="/">← Selected work</a><header class="project-header"><p class="eyebrow">${eyebrowOf(p, eyebrow)}</p><h1>${window.titleHTML(p.title)}</h1>${lede ? `<p class="lede">${E(lede)}</p>` : ''}<dl class="metadata"><div><dt>Place</dt><dd>${E(p.place)}</dd></div><div><dt>Context</dt><dd>${E(p.context)}</dd></div><div><dt>Contribution</dt><dd>${E(p.role)}</dd></div></dl></header>`;
const credit = text => text ? `<p class="image-caption b-credit">${E(text)}</p>` : '';
const nextLink = next => `<a class="next-project" href="/work/${next.id}"><span><small>Next in the collection</small>${window.titleHTML(next.title)}</span><span aria-hidden="true">→</span></a>`;
const capOf = (p, name) => (p.images.find(i => i[0] === name) || [])[1] || p.alt;
const closer = p => ({ h: 'A closer look', p: [p.body, p.body2] });

// La Perla's film, its readings and its typologies
const READINGS = [
  ['terrain', 'Terrain', 'Modelled from the topographic survey.'],
  ['contours', 'Contours', 'Lifted into three dimensions.'],
  ['elevation', 'Elevation', 'Every point by its height.'],
  ['slope', 'Slope', 'Gentle ground costs least to build on.'],
  ['runoff', 'Runoff', 'The paths the rain takes.'],
  ['streets', 'Streets', 'One road that keeps its grade gentle.'],
  ['modules', 'Lots and houses', '33 houses in four types.'],
  ['modules-runoff', 'Houses over runoff', 'Each house checked against the water.'],
];
const perlaFilm = () => {
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return `<section class="film"><video src="assets/la-perla/layers.mp4" poster="assets/la-perla/layers-poster.webp" ${still ? 'controls' : 'autoplay loop'} muted playsinline preload="metadata" aria-label="The eight readings of the land, plan and axonometric, cut together"></video>
    ${prose({ h: 'Eight readings, one plan.', p: [
      'The land was modelled from the topographic survey and read in layers: contours lifted into three dimensions, elevation, slope and runoff. Each reading answers a practical question. Gentle ground is where a road or a house costs least to build, the steepest is left as it is, and where the rain gathers the water has to be led away and kept clear of buildings.',
      'The road follows the gentlest ground in a single loop that ends in a turning circle. The houses sit in rows along one side and in a fan around the circle, and each was checked against the paths of the water before the plan was fixed.'],
      html: '<p class="image-caption">Analysis in Rhino and Grasshopper. The film was drawn frame by frame in code from the same layers: plan and axonometric of each reading, cut together on a beat.</p>' })}</section>`;
};
const perlaReadings = () => `<section class="readings-wrap"><p class="eyebrow">The readings</p><div class="readings">${READINGS.map(([key, name, line], i) => `<figure class="reading">${shot(`la-perla/plan-${key}`, `${name}, plan. ${line}`)}${shot(`la-perla/axo-${key}`, `${name}, axonometric. ${line}`)}<figcaption><span class="card-number">${String(i + 1).padStart(2, '0')}</span><span><b>${E(name)}</b>${E(line)}</span></figcaption></figure>`).join('')}</div></section>`;
const TYPES = '<ul class="types"><li><b>A</b>400 m² × 3</li><li><b>B</b>250 m² × 11</li><li><b>C</b>160 m² × 11</li><li><b>D</b>100 m² × 8</li></ul>';

// Mohari, villa 346 into Revit (as on page 8 of the C1 portfolio; assets from tools/mohari_steps.py)
const MOHARI_STEPS = [
  ['The live model', 'ZHCODE delivered each canopy as a live Grasshopper model, one group per canopy, ending in its construction planes, section profiles and beam geometry.',
    'zha/step-1-all', 'ZHCODE\'s live model, whole.', 'zha/step-1-zoom', 'The foot of the two canopy groups: planes, profiles and beam geometry.', 'Grasshopper: the live model (ZHCODE)'],
  ['My pass', 'I baked villa 346 out of the live model and split the canopy linework by layer: centrelines, hoops and section marks, each on its own.',
    'zha/step-2-all', 'The canopy linework, baked by layer.', 'zha/step-2-zoom', 'Where the left trunk opens into the canopy.', 'Rhino: the canopy linework'],
  ['Layers to curves', 'Dynamo read the linked drawing by layer name and drew each canopy layer in Revit as model curves, with bimorphNodes.',
    'zha/step-3-all', 'Dynamo: layers to curves, whole.', 'zha/step-3-zoom', 'CAD.CurvesFromCADLayers.', 'Dynamo: layers to curves'],
  ['Curves to beams', 'Each curve became a structural beam, set on its level and given its glulam framing type.',
    'zha/step-4-all', 'Dynamo: curves to beams, whole.', 'zha/step-4-zoom', 'StructuralFraming.BeamByCurve.', 'Dynamo: curves to beams'],
  ['Solids to families', 'The solids came in from SAT files and synced as Revit families, set up once in the input group, so Revit could schedule and draw them.',
    'zha/step-5-all', 'Dynamo: SAT solids to families, whole.', 'zha/step-5-zoom', 'K-Family Insert.', 'Dynamo: solids to families'],
];

const STAIR_STEPS = [
  ['From the height to the risers', 'The floor-to-floor height is divided by the maximum riser, 7 inches, and rounded up: that is the number of risers. The riser is the height over that number, the treads are one fewer, and the run on the walkline is the treads times an 11-inch going.',
    'stair/step-1-all', 'The definition, whole.', 'stair/step-1-zoom', 'Groups 01 and 02: the inputs, then the risers from the height.', 'Grasshopper: risers from the height'],
  ['The run finds its own end', 'The walkline is an ellipse. Measured along it, the length of the run gives the point where the stair stops, so a taller floor carries the stair further round. The run is then divided into equal goings.',
    'stair/step-2-all', 'The definition, whole.', 'stair/step-2-zoom', 'Group 03: the ellipse, measured to the length of the run.', 'Grasshopper: the walkline'],
  ['Edges, treads and risers', 'The walkline sits 12 inches from the inner edge. Both edges are offset from it, each division is carried across to them as a tread line, and each tread is lifted one riser above the last.',
    'stair/step-3-all', 'The definition, whole.', 'stair/step-3-zoom', 'Groups 04 and 05: the tread lines in plan, then the treads and risers.', 'Grasshopper: treads and risers'],
  ['Guard, handrail and the table', 'The nosings along each edge make the stringers. The handrail follows them 42 inches up, with a baluster every 4 inches, and the last group lists every nosing, inner and outer, in x, y and z for the fabricator.',
    'stair/step-4-all', 'The definition, whole.', 'stair/step-4-zoom', 'Groups 06 and 07: the guard, then the set-out table.', 'Grasshopper: guard and set-out'],
];

const LAYOUTS = {
  'la-perla': {
    eyebrow: 'Master plan · Site analysis',
    lede: 'A condominium on 5.7 hectares at Matapalo, planned from the ground: its height, its slope and the paths of the rain were read before a single lot was drawn.',
    blocks: () => [
      hero('la-perla/plan-collage', 'The master plan as an illustrative collage over an aerial of the land.'),
      perlaFilm(), perlaReadings(),
      side({ h: 'The plan.', p: ['33 houses in four types, 6,510 m², and four shared buildings, 610 m²: a clubhouse inside the loop, a lookout on the high edge, a bathhouse and a garden kitchen.'], html: TYPES },
        'la-perla/massing-circle', 'Massing model: houses in a fan around the turning circle.'),
      row([['la-perla/massing-road', 'The road curving between rows of houses down the slope.'], ['la-perla/massing-climb', 'Houses on both sides of the road as it climbs the land.']]),
    ],
    credit: 'Studio CAVA (Carlos Vinocour, Melissa Araya). A master plan study, not built; the collage is illustrative.',
  },
  prizma: {
    eyebrow: 'Software · Studio operations',
    lede: 'A live model of an architecture firm. People, projects and fees are connected on a canvas, and every change recalculates capacity, yield and pricing across the practice.',
    blocks: () => [
      hero('prizma/mockup', 'Prizma on a laptop: the live canvas.'),   // tools/prizma_mockup.mjs (2026-11-01)
      live('prizma-live.html', 'The live model from heyprizma.com, with demo data.', 'Prizma, the live canvas'),
      side({ h: 'What can this firm safely absorb next?', p: [
        'Most studios decide whether to take a new project with a spreadsheet and a feeling. A spreadsheet holds the formulas but cannot show what moves when one thing changes. In Prizma the information lives in the connections: give a person a new project and the others lose hours, change a fee and the team\'s multiplier moves, lose a senior and a project is left without supervision.',
        'The model is deterministic. Hours are derived from fees, phases and rates, so a principal can test a decision before making it: another hotel, a resignation, a different fee.'],
        html: '<p class="links"><a class="text-link" href="https://emptyfluffy.github.io/prizma-demo/" target="_blank" rel="noopener">Open the demo ↗</a><a class="text-link" href="https://heyprizma.com/" target="_blank" rel="noopener">heyprizma.com ↗</a></p>' },
        'prizma/firm', 'The whole firm on one canvas: staff, projects, teams by typology and the studio, with notes beside the model.'),
      row([['prizma/team', 'A team selected: its multiplier, profit, utilisation and stability margin.'], ['prizma/effort', 'Effort EQ: one person\'s hours slid between projects; burn, room left and fees recalculate through every team it touches.']]),
      side({ h: 'The product page.', p: ['heyprizma.com explains the model to the principal who would buy it: the five questions it answers, why it is not a project management tool, and the arithmetic underneath.'] },
        'prizma/l-hero', 'heyprizma.com: the opening, with a live model you can pull.', { flip: true }),
      sheet('heyprizma.com', [['prizma/l-questions', 'The five questions a principal asks'], ['prizma/l-instrument', 'The model is the workspace']], { cols: 2 }),
    ],
    credit: 'React and TypeScript. The canvas and the model are written from scratch, without a graph library; the model is its own tested package, and a firm brief exports to Excel.',
  },
  'papagayo-404': {
    blocks: p => [
      hero('p404/1', 'The house on its slanted steel columns, above the pool and the decks.'),
      side({ h: 'A closer look', p: [p.body] }, 'p404/4', 'The pool, the jacuzzi and the decks under the raised bedrooms.'),
      row([['p404/3', 'The pool deck under the house.'], ['p404/7', 'The double-height living room.']]),
      side({ h: 'The sunken terrace', p: [p.body2] }, 'p404/2', 'The sunken terrace at dusk.', { flip: true }),
      row([['p404/5', 'The built-in seating round the fire pit.'], ['p404/6', 'The jacuzzi at sunset.']]),
      group('From the schematic design', '', panel('p404/sd-deck-elevations', 'Two elevations through the deck: the house on its slanted columns over the slope.') +
        row([['p404/sd-kitchen-living', 'The kitchen and living room: plan and interior elevations.'], ['p404/sd-terrace-stair', 'The terrace seating: the given dimensions, and our proposal.']], { ink: true })),
      sheet('From the construction set', [['p404/site-plan', 'Site plan'], ['p404/terrace-section', 'The sunken terrace, section'], ['p404/terrace-plan', 'The sunken terrace, plan'], ['p404/bbq-plan', 'The outdoor kitchen, plan']], { cols: 2 }),
    ],
  },
  museum: {
    blocks: () => [
      hero('museum/aerial', 'The canopies along the edge of the headland, above the bay and its islands.'),
      side({ h: 'A roof that began with sails.', p: [
        'The roof began with sails: light cloth held in tension, curving two ways at once. A run of canopies follows the edge of the headland, and masts carry the cloth over the stone terraces and the path along the cliff.',
        'Under the canopies the museum stays open to the sea air and the view, in shade through the day and lit from below at night.'] },
        'museum/evening', 'The canopies lit at dusk, over the path along the headland.'),
      group('The canopy, form-found', 'The cloth was relaxed in Kangaroo between the masts until each canopy curved two ways at once, like a sail.',
        row([['museum/rhino-model', 'The competition model in Rhino, the roof over the terraces.'], ['museum/mesh-axo-2', 'The canopy mesh as Kangaroo relaxed it between the masts.']], { ink: true }) +
        canvas('museum/gh-canvas', 'My Grasshopper definition: the ribs, the masts, the canopy relaxed in Kangaroo and the facade. Moved to Kangaroo 2 in 2026.', { label: 'Grasshopper: the canopy definition' })),
      `<section><p class="eyebrow">Inspiration</p>${row([
        ['museum/sail-defender', 'Defender, 1895. Photograph: John S. Johnston.'],
        ['museum/sail-shamrock-ii', 'Shamrock II, 1901. Photograph: Detroit Publishing Co.'],
        ['museum/sail-atalanta', 'Atalanta, 1887. Photograph: Nathaniel L. Stebbins.'],
        ['museum/sail-valkyrie-vigilant', 'Valkyrie II and Vigilant, 1893. Photograph: Henry G. Peabody.']])}</section>`,
    ],
    credit: 'Competition entry by Carlos Vinocour and Joshua Chaves. Visualization: Emanuel Baizán. Sail photographs: Wikimedia Commons, public domain.',
  },
  zha: {
    eyebrow: 'Residential · Design development',
    lede: 'Eight hillside villas by Zaha Hadid Architects on the Papagayo Peninsula, each under a timber shell that rises from a single trunk. I was on the architect-of-record team that made the shells buildable.',
    blocks: p => [
      hero('zha/render-undercroft', 'Under the shell, at the foot of a trunk. Visualization: Zaha Hadid Architects.', '60% 50%'),
      side(closer(p), 'zha/render-pool', 'The pool terrace under the shells. Visualization: Zaha Hadid Architects.'),
      row([['zha/render-arrival', 'Arrival. Visualization: Zaha Hadid Architects.'], ['zha/render-aerial', 'Villa 346 above the dry forest. Visualization: Zaha Hadid Architects.']]),
      group('The villas, drawn by Zaha Hadid Architects', '', panel('zha/d-350-plan', 'Villa 350, level B01.') +
        panel('zha/s555-b', 'Villa 555, section B, through both shells and down the slope.') +
        row([['zha/s350-a', 'Villa 350, section A.'], ['zha/s350-c', 'Section C.'], ['zha/s350-d', 'Section D.']], { ink: true })),
      sheet('The canopy in design development', [['zha/c-stages', 'From concept to design development'], ['zha/c-parts', 'The parts of a canopy: glulam beams, backer panels and timber battens'],
        ['zha/c-undercroft', 'The timber undercroft: battens of five types, set in tiers'], ['zha/c-shape', 'Shape analysis'], ['zha/c-collider', 'Collider check'],
        ['zha/c-family', 'One family: plan, perspective, profiles'], ['zha/c-grid', 'Grid set-out optimisation'], ['zha/c-fenet', 'The structure, member by member']], { cols: 4 }),
      group('Villa 555: the stairs', '', row([['zha/stair-plan', 'The residential wing stair from above.'], ['zha/stair-up', 'Looking up from the B2 corridor.'],
        ['zha/stair-living', 'The living area stair round the trunk, the canopy ghosted.']], { ink: true })),
      hero('zha/int-kitchen', 'Villa 555: the living room and kitchen, the stair round the trunk. Visualization: Zaha Hadid Architects.', '50% 45%'),
      row([['zha/int-bedroom', 'A bedroom at night, seen from the garden. Visualization: Zaha Hadid Architects.'], ['zha/int-sitting', 'The formal sitting area. Visualization: Zaha Hadid Architects.'], ['zha/int-library', 'The library. Visualization: Zaha Hadid Architects.']]),
      side({ h: 'From the live model to Revit.', p: [
        'The shells came from ZHCODE, the computational group at Zaha Hadid Architects, as a live Grasshopper model: a mesh, a planar grid, centrelines with their IDs, construction planes and section profiles for every glulam beam.',
        'In July 2022 I carried villa 346 from that model toward the construction model. The output was baked to 5,403 curves and lines, and the canopy linework was split by layer, 5,444 curves in all, so Dynamo could read it from CAD layers, frame it and keep the geometry in sync with its Revit families.'] },
        'zha/linework-plan', 'Villa 346, the two canopies in plan, on separate layers for Revit. From my working file.', { ink: true }),
      steps('Villa 346, July 2022: the live model into Revit, in five steps', 'Each canvas is shown whole, with a box on the part that does the step, and then that part. Open either to zoom.', MOHARI_STEPS),
      sheet('The live model (ZHCODE)', [['zha/l-mesh', 'Mesh and planar grid'], ['zha/l-ids', 'Centrelines and IDs'], ['zha/l-planes', 'Construction planes'], ['zha/l-beams', 'Beam geometry']], { cols: 4 }),
      sheet('My working models', [['zha/linework-axo-k', 'Villa 346, the canopy linework'], ['zha/live-model-axo-k', 'My pass on the live model'],
        ['zha/facade-555-axo-k', 'Villa 555, the curved facade'], ['zha/shell-setout-k', 'Villa 346, glulam and steel set-out']], { cols: 4 }),
      text({ h: 'Villa 328: the glass, unit by unit.', p: [
        'The facade of villa 328 was set out in Rhino as a curtain system on a 1.5 by 3 m grid, with its columns and glass lines, then every insulated glass unit was measured and scheduled: 32 in the main space and 21 in the den, no two the same size. The opaque panels were scheduled in the same pass, by volume and length.'] }),
      sheet('Villa 328', [['zha/facade-328-axo-k', 'The facade model'], ['zha/glazing-schedule', 'The glazing schedule, every unit to scale']], { cols: 2 }),
    ],
    credit: 'Architectural design, drawings, renders, the stair views and the interiors: Zaha Hadid Architects; the live model: ZHCODE. Layers to curves is a bimorphNodes sample graph. Drawings of the Rhino models, the glazing schedule and the canvases: Carlos Vinocour, from his working files, July 2022.',
  },
  shade: {
    blocks: p => [
      hero('shade/dusk', 'The pavilion at dusk, lit through its openings.'),
      side({ h: 'A closer look', p: [p.body] }, 'shade/close', 'The shell up close: each cell deepens into an opening.'),
      sheet('From experiment to module', [['shade/experiment-1-bw', 'Foam and membranes'], ['shade/module-k', 'The formwork'], ['shade/module-sequence-k', 'The module family'],
        ['shade/casts-k', 'A cast piece'], ['shade/formwork-k', 'Assembly'], ['shade/site-k', 'Site massing'], ['shade/shadows-k', 'Range of shadows']], { cols: 4 }),
      side({ p: [p.body2] }, 'shade/square', 'The shell where it meets the square.', { flip: true }),
      sheet('The definition and the vault', [['shade/definition-k', 'The Grasshopper definition'], ['shade/vault-k', 'The vault it makes']], { cols: 2 }),
    ],
  },
  stair: {
    blocks: p => [
      hero('stair/perspective', 'The stair from above.'),
      side(closer(p), 'stair/perspective-2', 'The run between floors.'),
      sheet('The stair in plan', [['stair/plan-35-duo', '35th floor'], ['stair/plan-34-duo', '34th floor']], { cols: 2 }),   // duotone as in the C1 (tools/site_duotone.py)
      text({ p: ['The stair stands in the same place on every floor, beside the reception and the cafe, so each floor reads as a landing.'] }),
      row([['stair/interior', 'The stair on the 34th floor. Rendering: Gensler.'], ['stair/reception-34', 'The 34th floor reception. Rendering: Gensler.']]),
      sheet('From sketch to steel', [['stair/sketch-1-k', 'Concept sketch'], ['stair/sketch-2-k', 'The landing'], ['stair/rhino-k', 'Modelled in Rhino'], ['stair/rhino-setout-k', 'The elliptical run']], { cols: 4 }),
      row([['stair/view-1', 'Through the three floors.'], ['stair/view-2', 'Another view.']], { max: 760 }),
      // the set-out definition, rebuilt in 2026 (tools/stair_steps.py): the original file belongs to Gensler
      group('The set-out, rebuilt', '',
        canvas('stair/gh-canvas', 'The set-out definition, rebuilt in 2026: seven groups, from the height to the fabricator\'s table.', { label: 'Grasshopper: the stair set-out (rebuilt 2026)' })),
      sheet('One input, three heights', [['stair/run-12ft', '12 ft: 21 risers, 20 treads, 5.60 m of run'], ['stair/run-14ft', '14 ft: 24 risers, 23 treads, 6.44 m of run'], ['stair/run-16ft', '16 ft: 28 risers, 27 treads, 7.56 m of run']], { cols: 3 }),
      steps('The set-out in four steps', 'Each canvas is shown whole, with a box on the groups that do the step, and then those groups. Open either to zoom.', STAIR_STEPS),
      row([['stair/setout-plan', 'The set-out in plan at 14 ft: the two edges and the 24 tread lines.']], { max: 760, ink: true }),
    ],
    credit: 'Architecture and interiors: Gensler New York. Renderings: Gensler. Built. The set-out definition rebuilt by Carlos Vinocour in 2026.',
  },
  tamarindo: {
    cls: 'muted',   // the thesis's analysis sheets were graded hot: less saturation and contrast, as in the C1 portfolio (not the renders, redone 2026-10-30)
    blocks: p => [
      hero('tamarindo/render', 'The public building on the dry plain, raised above the seasonal water.'),
      side(closer(p), 'tamarindo/site-plan', 'The public building, its green roof and the water garden, in plan.', { soft: true }),
      group('The runoff and slope definition', 'Rain is followed down the terrain: 1,303 points scattered over it are moved down and pulled back onto the surface, 200 times in a loop, and their paths are the runoff. The same mesh is coloured by its slope.',
        canvas('tamarindo/gh-runoff', 'My Grasshopper definition: the runoff loop and the slope of the mesh.', { label: 'Grasshopper: runoff and slope' })),
      sheet('Reading the water', [
        ['tamarindo/l-01', 'The site'], ['tamarindo/l-02', 'Runoff from the terrain'], ['tamarindo/l-04', 'Main drainage lines'], ['tamarindo/l-05', 'Blocks between them'],
        ['tamarindo/l-06', 'Open spaces along the water'], ['tamarindo/l-07', 'Blocks by type'], ['tamarindo/l-08', 'Built volumes'], ['tamarindo/l-09', 'Volumes against the runoff']], { cols: 4, dark: true }),
      sheet('The street network', [['tamarindo/connectivity', 'Connectivity'], ['tamarindo/integration', 'Integration']], { cols: 2, dark: true }),
      side({ h: 'The building closes the cycle.', html: '<ol class="b-steps-list"><li>A green roof catches the rain, slows it and filters it.</li><li>Steel downpipes in the columns carry it to eight 50,000-litre tanks under the ground.</li><li>Gravity takes it on to a constructed lagoon for biological treatment.</li><li>It is pumped back into the building for use.</li><li>Greywater runs down the natural slope into a two-stage filter.</li><li>Filtered greywater joins the rainwater for final purification.</li></ol>' },
        'tamarindo/water-cycle-duo', 'The water cycle of the building, in six steps.', { flip: true }),   // the duotone carries the paper; multiply would darken it
      sheet('Slope, sun and water', [['tamarindo/mesh-slope', 'The terrain by slope'], ['tamarindo/solar-1-k', 'Sun paths'], ['tamarindo/solar-2', 'Shadows through the year'], ['tamarindo/water-sections-k', 'Water in section']], { cols: 4 }),
    ],
  },
  housing: {
    blocks: p => [
      hero('housing/night', 'The units at night, along a shared walk.'),
      side({ h: 'A closer look', p: [p.body] }, 'housing/day', 'A unit by day.'),
      sheet('Assembly', [['housing/seq-1-k', 'Volume'], ['housing/seq-2-k', 'Gable'], ['housing/seq-3-k', 'Frames'],
        ['housing/seq-4-k', 'Joined'], ['housing/seq-5-k', 'Closed'], ['housing/seq-6-k', 'Program']], { strip: true }),
      sheet('Transport and structure', [['housing/transport-k', 'Frames sized for a standard trailer'], ['housing/structure-k', 'The structural system']], { cols: 2 }),
      side({ p: [p.body2] }, 'housing/interior', 'Inside a unit.', { flip: true }),
      sheet('Drawings', [['housing/section-1-k', 'Section through the living room'], ['housing/section-2-k', 'Section through the bedroom'], ['housing/front-k', 'Front elevation'], ['housing/airflow-k', 'Air flow']], { cols: 4 }),
    ],
  },
  predock: {
    blocks: p => [
      hero('bahias/cluster-7-8-9', 'Houses 7, 8 and 9 in the dry forest canopy. Rendering: BINYAN, courtesy of Peninsula Papagayo.'),
      side({ h: 'One continuous event, not thirteen houses.', p: [
        'Bahías is a community of 13 houses, each on its own site, along a ridge 80 metres above the Gulf of Papagayo, between the Pacific and Culebra Bay, in the tropical dry forest.',
        'A stone wall Antoine Predock calls the necklace anchors the houses along the ridge lane. Above it the copper roofs float on their own and never touch, one undulating line whose blue-green patina takes the colour of the trees and the sea. The concrete is pigmented with the soil and the beach sand; almost every specimen tree stayed and no boulder was moved.'],
        html: '<p class="image-caption">From Vladimir Belogolovsky\'s interview with Antoine Predock, <a class="text-link" href="https://www.archdaily.com/962912/i-wanted-to-dance-here-in-conversation-with-antoine-predock-about-bahias-a-community-of-13-houses-in-costa-rica" target="_blank" rel="noopener">ArchDaily, June 2021 ↗</a></p>' },
        'bahias/b6-forest', 'Bahías 6 in the forest. Photograph: Alex Fradkin.'),
      text({ h: 'From the drawings to the site.', p: [
        'Garnier Arquitectos and MAZ were the architect of record in Costa Rica. As project coordinator I ran the coordination between Antoine Predock\'s studio, the consultants and the local team, and followed the houses through construction.',
        'I was also the project\'s geometry lead: the floating copper roofs were carried from Rhino into Revit through Conveyor, with Grasshopper and Dynamo scripts that kept the geometry, the documents and the consultants\' models in step.',
        'The roofs are doubly curved and no two houses are alike, so the geometry had to travel without loss between the design architect\'s models, the consultants\' models and the construction set.'] }),
      row([['bahias/house-7-rear-2', 'House 7 on the ridge. Rendering: BINYAN, courtesy of Peninsula Papagayo.'], ['bahias/outdoor-living', 'The roof edge over the terrace and the bay. Rendering: BINYAN, courtesy of Peninsula Papagayo.']]),
      sheet('Bahías 6, built', [['bahias/b6-roof', 'The copper roof over the necklace wall'], ['bahias/b6-canopy', 'The roof edge over the terrace'],
        ['bahias/b6-overhang', 'The overhang toward the bay'], ['bahias/b6-bay', 'Looking out over Culebra Bay']], { cols: 2, dark: true, ratio: '1.33' }),
      hero('bahias/aerial', 'The thirteen houses along the ridge, between the Pacific and Culebra Bay. Rendering: BINYAN, courtesy of Peninsula Papagayo.'),
      sheet('Built', [['bahias/b2-forest', 'Bahías 2 in the canopy'], ['bahias/built-above', 'Bahías 13 and its pool, from above'],
        ['bahias/b13-terrace', 'Bahías 13, the terrace and pool under the roof'], ['bahias/b2-lounge', 'Toward the gulf']], { cols: 2, dark: true, ratio: '1.5' }),
      sheet('The plans', [['bahias/plan-b2-lower-k', 'Bahías 2, lower level'], ['bahias/plan-b2-upper-k', 'Bahías 2, upper level'],
        ['bahias/plan-b4-lower-k', 'Bahías 4, lower level'], ['bahias/plan-b4-upper-k', 'Bahías 4, upper level']], { cols: 2 }),
      sheet('The design, 2021', [['bahias/house-9-front', 'House 9'], ['bahias/house-7-front', 'House 7 from the lane'],
        ['bahias/house-9-vignette', 'The roof over a terrace'], ['bahias/house-11-front', 'House 11']], { cols: 4, dark: true, ratio: '1.6' }),
    ],
    credit: 'Architecture: Antoine Predock Architect. Architect of record: Garnier Arquitectos with MAZ. Photographs of Bahías 6: Alex Fradkin; other photographs and plans courtesy of Peninsula Papagayo; renderings: BINYAN, courtesy of Peninsula Papagayo, as published on ArchDaily (2021).',
  },
  nya: {
    blocks: p => [
      hero('nya/town-center', 'The town centre under its canopy.'),
      side(closer(p), 'nya/bungalows', 'Houses in the forest.'),
      row([['nya/semi-aerial', 'The lagoon and the town.'], ['nya/aerial', 'The whole development, from above.']]),
    ],
  },
  mall: {
    blocks: p => [
      hero('mall/exterior', 'A facade of nickel-plated tubes, opened by LED-glass screens where the programme pushes out.'),
      side({ h: 'A closer look', p: [p.body] }, 'mall/atrium', 'The atrium.'),
      group('The skin: tubes, light and screens', 'The skin never reads the same twice: the nickel answers the sun and the viewer, and the screens set into it change with the programme.',
        row([['mall/skin-screen', 'Where the programme pushes out, the tubes part around a screen.'], ['mall/skin-field', 'The field of tubes around the middle screen.'], ['mall/skin-tubes', 'Tube by tube, each catching the light at its own angle.']])),
      sheet('Screen tests on the same frame', [['mall/test-white', 'White'], ['mall/test-pink', 'A pink wave'], ['mall/test-blue', 'A blue wave']], { cols: 3, dark: true }),
      sheet('Shadow studies of the tube field, in V-Ray', [['mall/scrim-1', 'Study 1'], ['mall/scrim-2', 'Study 2'], ['mall/scrim-3', 'Study 3'], ['mall/scrim-4', 'Study 4']], { cols: 4, dark: true }),
      sheet('From geometry to documentation', [['mall/rhino-k', 'The connection in Rhino'], ['mall/connector', 'The glazed connector'], ['mall/glazing-2', 'The glazed roof'], ['mall/revit-family-k', 'As a Revit family']], { cols: 4 }),
      sheet('Elevation and section', [['mall/elevation-1-k', 'Front elevation'], ['mall/section-long-k', 'Longitudinal section']], { cols: 2 }),
      side({ p: [p.body2] }, 'mall/connection', 'Inside the connection.', { flip: true }),
      sheet('The atrium ceiling as a screen', [['mall/ceiling-roses', 'One study'], ['mall/ceiling-ambient', 'Another']], { cols: 2, dark: true }),
    ],
  },
  mecca: {
    blocks: p => [
      hero('mecca/terrace', 'A hotel terrace facing the Haram at sunset.'),   // the opening image since 2026-11-01 (Carlos)
      side({ h: 'A closer look', p: [p.body, p.body2] }, 'mecca/site-plan', 'Site plan, between the city and the Grand Mosque.'),
      side({ h: 'Views as a design input.', p: ['One script scored every room by what it could see of the Haram; a second set the openings and balconies from that score, tower by tower.',
        'The massing was worked out in ten steps, from the platform over the levels of the site to the towers set on the line to the Kaaba, each step checked against the view.'] }, 'mecca/orientation-k', 'The towers on the line to the Kaaba.', { ink: true, flip: true }),
      sheet('Design generation', Array.from({ length: 10 }, (_, i) => [`mecca/gen-${String(i + 1).padStart(2, '0')}-k`, `Step ${String(i + 1).padStart(2, '0')}`]), { strip: true, cols: 5, numbers: false }),
      row([['mecca/aerial', 'The scheme in the city at night.'], ['mecca/tower', 'The hotel and residential towers at dusk.']]),
      // the view script, rebuilt in 2026 on simplified massing (tools/gh-build/jabal.py): the original belongs to Gensler
      group('The view script, rebuilt', '', canvas('mecca/gh-canvas', 'The view script, rebuilt in 2026 on simplified massing: rays from 1,365 rooms to the Kaaba and the courtyard, a score for each room, then its opening and balcony.', { label: 'Grasshopper: views to the Haram (rebuilt 2026)' })),
      sheet('Rays, score, openings', [['mecca/rays', 'Rays to the Kaaba: gold where they get through, red where the city or another tower is in the way'],
        ['mecca/score', 'The score on the five fronts, seen from the Kaaba'], ['mecca/balconies', 'Openings and balconies from the score']], { cols: 3 }),
    ],
    credit: 'Invited competition: Gensler, 2016. The view script rebuilt by Carlos Vinocour in 2026, on simplified massing.',
  },
};
for (const [id, L] of Object.entries(LAYOUTS)) {
  window.RENDER[id] = (p, next) => header(p, L.eyebrow || p.category, L.lede || p.intro) + `<div class="blocks${L.cls ? ` ${L.cls}` : ''}">${L.blocks(p).join('')}</div>` + credit(L.credit || p.credit) + nextLink(next);
}
