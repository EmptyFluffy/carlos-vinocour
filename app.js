const content = document.querySelector('main');
const lightbox = document.querySelector('#lightbox');
const projects = window.PROJECTS;
const still = matchMedia('(prefers-reduced-motion: reduce)');
// 2026-11-04: real paths (/work/zha) in place of #/ routes, so every page has an address a search engine or an LLM can
// read; the deploy also writes each one out as HTML (tools/prerender.mjs). An old #/ link becomes its path on arrival.
if (location.hash.startsWith('#/')) history.replaceState(null, '', location.hash.slice(1).replace(/^\/index$/, '/work'));
document.querySelector('.skip').addEventListener('click', e => {e.preventDefault();content.focus();content.scrollIntoView();});
const esc = value => String(value).replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const asset = name => `assets/${name}.webp`;
// the smaller copies for the browser to choose from (tools/site_variants.py; their widths are the fourth value in sizes.js)
const srcset = src => { const s=(window.SIZES||{})[src]; return s&&s[3]?[...s[3].map(w=>`assets/w/${w}/${src.slice(7)} ${w}w`),`${src} ${s[0]}w`].join(', '):''; };
const imgSrc = (src,sizes) => { const set=srcset(src); return `src="${src}"${set?` srcset="${set}" sizes="${sizes}"`:''}`; };
// a lazy image is sized by its own layout (auto); the first, which loads at once, by the column it usually fills
const LEAD_SIZES='(max-width:700px) 100vw, 75vw', PAGE_SIZES='auto, '+LEAD_SIZES;
// every page goes in through here: images without a srcset get one, the first image loads first (it is usually the
// largest paint), and a page the deploy already wrote into the HTML is kept as it arrived instead of being built again
const html=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');
let keep=false;
Object.defineProperty(content,'innerHTML',{get(){return html.get.call(this);},set(v){
 if(keep){keep=false;return;}
 let first=true;
 html.set.call(this,v.replace(/<img\b[^>]*>/g,tag=>{
  const lead=first;first=false;
  if(lead)tag=tag.replace(' loading="lazy"',' fetchpriority="high"');
  const m=!/\ssrcset=/.test(tag)&&tag.match(/\ssrc="(assets\/[^"]+)"/);
  return m?tag.replace(m[0],' '+imgSrc(m[1],lead?LEAD_SIZES:PAGE_SIZES)):tag;
 }));
}});
const footer = () => `<footer class="foot mono"><span>Carlos Vinocour, architect (CFIA)</span><span>San José, Costa Rica</span><a href="mailto:vinocouralvarez@gmail.com">vinocouralvarez@gmail.com</a></footer>`;
const cardName = p => p.title.split(' / ')[0];
// since 2026-11-06 the home is the model (model.js: the projects as line models, one turning into the next, with the
// images below); /architecture and /computation keep a sheet of cards
function home(filter='all') {
  if(filter==='all'){content.innerHTML=window.V2.homeHTML()+footer();window.V2.init(content);return;}
  const headings={architecture:'Spaces, landscapes, and the work between.',computation:'Rules, material, and emerging forms.'};
  const cards=projects.filter(p=>p.tags.includes(filter)).map(p=>window.V2.cardHTML([p.id,cardName(p),(window.kindOf(p.id)||{}).year||'',p.coverStill||p.cover])).join('');
  content.innerHTML=`<section class="sheet-page"><p class="code mono">W · ${filter}</p><h1 class="big">${headings[filter]}</h1><div class="cards">${cards}</div></section>${footer()}`;
}
function figure(name,caption,wide=false) {
  return `<figure class="${wide?'wide':''}"><button class="image-button" data-image="${asset(name)}" data-caption="${esc(caption)}" aria-label="Enlarge image: ${esc(caption)}"><img src="${asset(name)}" alt="${esc(caption)}" loading="lazy"></button><figcaption class="image-caption">${esc(caption)}</figcaption></figure>`;
}
function project(id) {
  if(id==='hcp'){history.replaceState(null,'','/work/facades');return project('facades');}   // renamed 2026-11-02 (Carlos: not for HCP, an experiment)
  const p=projects.find(p=>p.id===id);if(!p)return missing();
  if(id==='surface'){content.innerHTML=renderSurface()+footer();document.title='Porous field · Carlos Vinocour';initSurface();return;}
  if(id==='facades'){content.innerHTML=window.renderHCP()+footer();document.title='Facade studies · Carlos Vinocour';window.initHCP();return;}
  const next=projects[(projects.indexOf(p)+1)%projects.length];
  if(window.RENDER&&window.RENDER[id]){content.innerHTML=window.RENDER[id](p,next)+footer();document.title=`${p.title} · Carlos Vinocour`;return;}
  content.innerHTML=`<a class="back" href="/">← Selected work</a><header class="project-header"><p class="eyebrow">${esc(p.category)}</p><h1>${esc(p.title)}</h1><p class="lede">${esc(p.intro)}</p><dl class="metadata"><div><dt>Place</dt><dd>${esc(p.place)}</dd></div><div><dt>Context</dt><dd>${esc(p.context)}</dd></div><div><dt>Contribution</dt><dd>${esc(p.role)}</dd></div></dl></header><div class="project-hero">${figure(p.cover,p.alt)}</div><section class="project-body"><h2>A closer look</h2><p>${esc(p.body)}</p><p>${esc(p.body2)}</p></section><div class="project-images">${p.images.map(i=>figure(i[0],i[1],i[2]==='wide')).join('')}</div><p class="image-caption" style="margin-top:35px;max-width:680px">${esc(p.credit)}</p><a class="next-project" href="/work/${next.id}"><span><small>Next in the collection</small>${esc(next.title)}</span><span aria-hidden="true">→</span></a>${footer()}`;
  document.title=`${p.title} · Carlos Vinocour`;
}
// about: the CV comes from data.js (tools/site_data.py, from pdf/cv.py), so it says what the PDF CV says
function about() {
 const cv=window.CV,row=(when,body)=>`<div class="cv-row"><p class="cv-when">${esc(when)}</p><div>${body}</div></div>`;
 const jobs=cv.experience.map(j=>row(j.years,`<h3>${esc(j.role)}, ${esc(j.company)}</h3><p class="cv-place">${esc(j.place)}</p><ul>${j.points.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`)).join('');
 const edu=cv.education.map(e=>row(e.years,`<p>${esc(e.title)}</p><p class="cv-place">${esc(e.place)}</p>`)).join('');
 const tools=cv.skills.map(s=>row(s.group,`<p>${esc(s.tools)}</p>`)).join('');
 content.innerHTML=`<article class="about"><p class="eyebrow">A little context</p><h1>Architecture is my starting point.</h1><p class="lede">I’m Carlos, an architect and computational designer based in Costa Rica, with ten years across design, documentation and construction.</p><p>I have worked on the architect-of-record team for houses by Zaha Hadid Architects and Antoine Predock at Peninsula Papagayo, on competitions and built work at Gensler New York, and as design lead in my own studio. I lead coordination between design architects, consultants and site, and I write the Grasshopper and Dynamo tools that carry complex geometry into Revit and construction documents.</p><p>Alongside architecture I build software: Prizma, a live model of an architecture practice, and PivotHop, a platform that reads live job postings.</p><section class="cv"><h2>Experience</h2>${jobs}</section><section class="cv"><h2>Education</h2>${edu}</section><section class="cv"><h2>Tools</h2>${tools}</section><section class="cv"><h2>Recognition</h2><ul class="cv-list">${cv.recognition.map(r=>`<li>${esc(r)}</li>`).join('')}</ul></section><div class="about-grid"><section><h2>Beyond the archive</h2><p>For architecture projects in Costa Rica, visit Studio CAVA.</p><a class="text-link" href="https://cava.design/" target="_blank" rel="noopener">Studio CAVA ↗</a><p style="margin-top:30px">Everything I have worked on since 2013, with or without a page here:</p><a class="text-link" href="/work">The index →</a></section><section><h2>Get in touch</h2><p>For collaborations and conversations:</p><a class="text-link" href="mailto:vinocouralvarez@gmail.com">vinocouralvarez@gmail.com ↗</a><p style="margin-top:30px">Or on LinkedIn:</p><a class="text-link" href="https://www.linkedin.com/in/carlos-vinocour-alvarez-086a88b9" target="_blank" rel="noopener">Carlos Vinocour ↗</a></section></div><section class="project-body"><h2>About this edition</h2><p>Selected work, 2016 to 2026. Each collaborative project states my role and credits its design architects.</p></section></article>${footer()}`;
}
// the index of work as in the portfolio (pdf/build.py, editions C and C1): blueprint ink, each type in its colour,
// the rows with a page here in full ink, newest first; the rows come from data.js (pdf/index.json)
const TYPE_COL=window.KIND_COLOR;   // more.js: the key's colours
function workIndex() {
 const rows=window.WORK_INDEX,no=id=>String(projects.findIndex(p=>p.id===id)+1).padStart(2,'0');
 const key=[['built',TYPE_COL.built],['competition',TYPE_COL.competition],['design development, documentation, master plan, interiors','var(--ink)'],['thesis, research, course',TYPE_COL.thesis],['software, experiment',TYPE_COL.software]].map(([t,c])=>`<span style="color:${c}">${t}</span>`).join('');
 const tr=r=>`<tr${r.page?' class="in"':''}><td class="ix-type" style="color:${TYPE_COL[r.type]||'var(--ink)'}">${esc(r.type)}</td><td class="ix-title">${r.page?`<a href="/work/${r.page}">${esc(r.title)}</a>`:esc(r.title)}</td><td class="ix-with">${esc(r.with||'')}</td><td class="ix-place">${esc(r.place||'')}</td><td class="ix-year">${esc(r.year)}</td><td class="ix-no">${r.page?`<a href="/work/${r.page}" aria-label="${esc(r.title)}, project ${no(r.page)}">${no(r.page)}</a>`:''}</td></tr>`;
 content.innerHTML=`<section class="ix-page"><h1>Index</h1><p class="ix-lead">All my work since 2013.</p><p class="ix-lbl">key</p><p class="ix-key">${key}</p><table class="ix"><thead><tr><th class="ix-type">type</th><th class="ix-title">project</th><th class="ix-with">with</th><th class="ix-place">place</th><th class="ix-year">year</th><th class="ix-no">no.</th></tr></thead><tbody>${rows.map(tr).join('')}</tbody></table></section>${footer()}`;
 document.title='Index · Carlos Vinocour';
}
function notes() {
 content.innerHTML=`<header class="intro"><h1>Notes from an<br>evolving practice.</h1><p>Questions, working ideas & unfinished threads</p></header><section class="note-list"><a class="note-link" href="/notes/site-studies"><small>01<br><br>IDEA</small><div><h2>Site Studies</h2><p>A modular toolkit for reading a site before placing a building.</p></div><span aria-hidden="true">↗</span></a></section>${footer()}`;
}
function note() {
 content.innerHTML=`<a class="back" href="/notes">← All notes</a><article class="note-body"><p class="eyebrow">Working idea · October 2026</p><h1>Site Studies</h1><p class="lede">What if the first design move was a clearer understanding of the ground?</p><p>I’m exploring the idea of a modular Grasshopper toolkit that brings terrain, trees and planning constraints into a shared site model. The aim is to compare possible locations for a building and make the reasoning visible.</p><div class="study-diagram" aria-label="Proposed workflow"><span>Terrain + trees</span><span>Constraints</span><span>Suitable areas</span><span>Alternatives</span></div><h2>Several components, one conversation</h2><p>Each component would remain useful on its own: reading terrain, mapping slopes, protecting trees, defining constraints or comparing footprints. The architect could change priorities and inspect the consequences.</p><ul><li>Separate mandatory constraints from design preferences.</li><li>Compare alternatives for earthworks, tree preservation and access.</li><li>Show the source and assumptions behind each input.</li></ul><p>This is a project concept, not a released plugin. The first experiment would use a single site with verified inputs and a limited family of footprints.</p><p>It continues a thread from the <a class="text-link" href="/work/tamarindo">Tamarindo water and urbanism study ↗</a>.</p></article>${footer()}`;
}
function missing(){content.innerHTML=`<header class="intro"><h1>This page isn’t in the archive.</h1><a class="text-link" href="/">Back to selected work →</a></header>`;}
// 2026-11-06: each page gets its sheet code (W05 a project, I the index, A1 about, N notes), and a project's page
// splits in two, its head (the text and the data sheet) held still on the left and the work on the right (theme.css).
// The blocks are already started (BLOCKS_INIT); moving them keeps their listeners.
const bar=document.querySelector('[data-bar]'),menuBtn=document.querySelector('[data-menu]');
function decorate(path){
 const isHome=path==='/';
 document.body.classList.toggle('is-home',isHome);bar.classList.toggle('solid',!isHome||scrollY>40);
 const tag=(el,code)=>{if(el&&code&&!el.querySelector(':scope > .code'))el.insertAdjacentHTML('afterbegin',`<p class="code mono">${code}</p>`);};
 if(path.startsWith('/work/')){
  const head=content.querySelector(':scope > header.project-header'),back=content.querySelector(':scope > a.back');
  tag(head,window.V2.sheet(location.pathname.split('/')[2]));
  if(head&&!content.querySelector(':scope > .split')){
   const split=document.createElement('div'),l=document.createElement('aside'),r=document.createElement('div');
   split.className='split';l.className='split-l';r.className='split-r';l.setAttribute('aria-label','About this project');
   const rest=[...content.children].filter(e=>e!==head&&e!==back&&!e.matches('footer'));
   if(back)l.append(back);l.append(head);r.append(...rest);split.append(l,r);content.prepend(split);
  }
 }
 else if(path==='/work')tag(content.querySelector('.ix-page'),'I');
 else if(path==='/about')tag(content.querySelector('.about'),'A1');
 else if(path.startsWith('/notes'))tag(content.querySelector('.intro, .note-body'),path==='/notes'?'N':'N1');
}
// the bar: clear over the model, solid once the page moves or anywhere else; on a phone its links sit behind Menu
addEventListener('scroll',()=>bar.classList.toggle('solid',!document.body.classList.contains('is-home')||scrollY>40),{passive:true});
const setMenu=open=>{document.body.classList.toggle('menu-open',open);menuBtn.setAttribute('aria-expanded',String(open));menuBtn.textContent=open?'Close':'Menu';};
menuBtn.addEventListener('click',()=>setMenu(!document.body.classList.contains('menu-open')));
document.querySelector('#main-nav').addEventListener('click',e=>{if(e.target.closest('a'))setMenu(false);});
addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('menu-open')){setMenu(false);menuBtn.focus();}});
let booted=false;
function route(){
 if(lightbox.open)lightbox.close();
 const scriptModal=document.querySelector('#script-modal');if(scriptModal.open)scriptModal.close();
 const path=location.pathname.replace(/(\/index)?\.html$/,'').replace(/\/+$/,'')||'/';
 keep=!booted&&content.dataset.pre===path&&!still.matches;booted=true;const fresh=!keep;
 let section='all';document.title='Carlos Vinocour · Selected work';
 const titled=t=>{document.title=`${t} · Carlos Vinocour`;};
 if(path==='/')home();
 else if(path==='/architecture'||path==='/computation'){section=path.slice(1);home(section);titled(section[0].toUpperCase()+section.slice(1));}
 else if(path.startsWith('/work/'))project(path.split('/')[2]);
 else if(path==='/work'||path==='/index'){if(path==='/index')history.replaceState(null,'','/work');section='index';workIndex();}
 else if(path==='/about'){section='about';about();titled('About');}
 else if(path==='/notes'){section='notes';notes();titled('Notes');}
 else if(path==='/notes/site-studies'){section='notes';note();titled('Site Studies');}
 else{missing();titled('Not found');}
 keep=false;
 window.BLOCKS_INIT&&window.BLOCKS_INIT(content);
 decorate(path);
 // 2026-11-03: an image still on its way fades in over its ground instead of popping in (a failed one shows anyway);
 // not on a page that arrived written out, whose images may already be on screen
 if(fresh)content.querySelectorAll('img').forEach(img=>{if(img.complete)return;img.classList.add('ld');const done=()=>img.classList.remove('ld');img.addEventListener('load',done,{once:true});img.addEventListener('error',done,{once:true});});
 document.querySelectorAll('[data-nav]').forEach(a=>{const active=a.dataset.nav===section;a.classList.toggle('active',active);active?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current');});
 window.scrollTo({top:0,behavior:'instant'});
}
content.addEventListener('click',e=>{const b=e.target.closest('[data-image]');if(!b)return;lightbox.querySelector('img').src=b.dataset.image;lightbox.querySelector('img').alt=b.dataset.caption;lightbox.querySelector('p').textContent=b.dataset.caption;lightbox.showModal();});
lightbox.querySelector('button').addEventListener('click',()=>lightbox.close());
lightbox.addEventListener('click',e=>{if(e.target===lightbox){const r=lightbox.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)lightbox.close();}});
// 2026-11-03: one page gives way to the next (the View Transitions API, style.css); without it, or with reduced motion,
// the swap is instant. A link to a path of the site changes the page here, and the scroll position goes into history,
// so Back returns to the same place in the grid
history.scrollRestoration='manual';
const go=(y=0)=>{const run=()=>{route();if(y)scrollTo(0,y);content.focus({preventScroll:true});};document.startViewTransition&&!still.matches?document.startViewTransition(run):run();};
document.addEventListener('click',e=>{const a=e.target.closest('a[href^="/"]');if(!a||a.target||e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();if(a.pathname===location.pathname)return;history.replaceState({y:scrollY},'');history.pushState(null,'',a.pathname);go();});
addEventListener('popstate',e=>go(e.state&&e.state.y));
addEventListener('hashchange',()=>{if(location.hash.startsWith('#/')){history.replaceState(null,'',location.hash.slice(1).replace(/^\/index$/,'/work'));go();}});
route();
