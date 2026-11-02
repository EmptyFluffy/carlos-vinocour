// The home page's field (2026-10-30, after a reference Carlos sent): soft shapes drifting east through a grid of fine
// marks, 14 px a second, changing slowly as they go; the ends fade. A two-octave noise, stretched sideways, is read at
// every cell and taken as a height. Every mark has a reason (Carlos: the characters should shade, not dirty it): the
// shapes are lit from the upper left, and the tone of a cell (how far inside the shape, how much in shadow) picks its
// mark, from a fine dot on the lit edges through dashes to '=' and '#' in the deepest shadow; a '+' marks the top of
// each shape, like a spot height. Every visit starts somewhere new (Carlos: "me aburre que siempre empiece igual"):
// a fresh seed, and the size, cover and pace of the shapes drawn from narrow ranges, so it changes but stays itself.
// (The tear every seven seconds went, 2026-10-30: the one mark without a reason.) Canvas, drawn in
// six darkness levels. Stops when the page leaves, pauses off screen, one still frame for reduced motion. (2026-11-01: moved beside
// the headline, as tall as the intro; the top and bottom now fade like the ends.)
// (Earlier: a runoff field on Carlos's terrain, c2c0298; three demo effects in type, f8b021b; a dirtier pass, 1140b4d.)
(function(){
const CW=6,CH=8,MARK=2.2,FPS=30,LEVELS=6,EDGE=.12,VEDGE=.24;
let SEED=0;
const hash=(x,y,z)=>{let n=x*374761393+y*668265263+z*1274126177+SEED|0;n=Math.imul(n^n>>>13,1274126177);return ((n^n>>>16)>>>0)/4294967295;};
const fade=t=>t*t*t*(t*(t*6-15)+10);
function noise(x,y,z){
  const xi=Math.floor(x),yi=Math.floor(y),zi=Math.floor(z),fx=fade(x-xi),fy=fade(y-yi),fz=fade(z-zi);
  const l=(a,b,t)=>a+(b-a)*t,c=(i,j,k)=>hash(xi+i,yi+j,zi+k);
  return l(l(l(c(0,0,0),c(1,0,0),fx),l(c(0,1,0),c(1,1,0),fx),fy),l(l(c(0,0,1),c(1,0,1),fx),l(c(0,1,1),c(1,1,1),fx),fy),fz);
}
const smooth=(a,b,v)=>{const t=Math.min(1,Math.max(0,(v-a)/(b-a)));return t*t*(3-2*t);};

window.initField=function(fig){
  const field=fig.querySelector('.field'),canvas=field.querySelector('canvas'),ctx=canvas.getContext('2d');
  const style=getComputedStyle(fig),still=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ink=style.color,font=`8px ${style.getPropertyValue('--mono')||'monospace'}`;
  const pick=(a,b)=>a+Math.random()*(b-a),WIDE=pick(280,400),TALL=pick(95,135),COVER=pick(.47,.54),SPEED=pick(10,16);
  SEED=Math.random()*2**31|0;
  let w=0,h=0,cols=0,rows=0,raw=null,top=null,visible=true,last=0,t=pick(0,500);
  function layout(){
    const dpr=Math.min(2,devicePixelRatio||1);w=field.clientWidth;h=field.clientHeight;
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    cols=Math.floor(w/CW);rows=Math.floor(h/CH);raw=new Float32Array(cols*rows);top=new Float32Array(cols*rows);
  }
  function draw(){
    ctx.clearRect(0,0,w,h);
    const ox=(w-cols*CW)/2,oy=(h-rows*CH)/2,shift=t*SPEED,z=t*.035;
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
      const u=(ox+c*CW-shift)/WIDE,v=(oy+r*CH+CH/2)/TALL,k=r*cols+c;
      top[k]=noise(u,v,z);raw[k]=top[k]*.72+noise(u*3.1,v*2.3,z*1.7+9)*.28;
    }
    const paths=[],glyphs=[];for(let i=0;i<LEVELS;i++){paths.push(new Path2D());glyphs.push([]);}
    const at=(a,c,r)=>a[Math.min(rows-1,Math.max(0,r))*cols+Math.min(cols-1,Math.max(0,c))];
    let marks=0;
    for(let r=0;r<rows;r++){
      const y=oy+r*CH+CH/2,fy=smooth(0,VEDGE,y/h)*smooth(0,VEDGE,1-y/h);   // top and bottom fade too, since the band beside the headline is short
      for(let c=0;c<cols;c++){
        const k=r*cols+c,x=ox+c*CW,X=x;
        const n=smooth(COVER,COVER+.28,raw[k])*smooth(0,EDGE,x/w)*smooth(0,EDGE,1-x/w)*fy;
        if(n<.05)continue;
        marks++;
        const slope=(at(top,c+1,r)-at(top,c-1,r))/4+(at(top,c,r+1)-at(top,c,r-1))/2,shadow=smooth(0,.025,-slope);   // the large form's face turned from the light
        const tone=Math.min(1,n*(.55+.45*shadow)+.12*shadow*smooth(.3,.7,n)),lv=Math.min(LEVELS-1,Math.floor(tone*LEVELS));   // shadow's push .25 -> .12 (2026-11-01)
        let peak=n>.55;
        for(let i=0;peak&&i<8;i++){const a=i*Math.PI/4,ca=Math.round(Math.cos(a)),sa=Math.round(Math.sin(a));
          if(at(top,c+ca,r+sa)>=top[k]||at(top,c+ca*4,r+sa*3)>top[k])peak=false;}   // one cell: higher than its neighbours and the ring around
        if(peak)glyphs[LEVELS-1].push(x+CW/2,y,'+');
        else if(tone<.08)paths[lv].rect(X+2.2,y-.7,1.4,1.4);
        else if(tone<.16)paths[lv].rect(X+1.6,y-1,2.2,2.2);
        else if(tone<.84)paths[lv].rect(X,y-MARK/2,1.4+tone*(CW-2.4),MARK);
        else glyphs[lv].push(X+CW/2,y,tone<.97?'=':'#');   // '#' only in the deepest shadow (.94 -> .97, 2026-11-01: beside the headline a core of them was too heavy)
      }
    }
    ctx.fillStyle=ink;ctx.font=font;ctx.textAlign='center';ctx.textBaseline='middle';
    for(let k=0;k<LEVELS;k++){
      ctx.globalAlpha=.25+.75*(k+1)/LEVELS;ctx.fill(paths[k]);
      const g=glyphs[k];for(let i=0;i<g.length;i+=3)ctx.fillText(g[i+2],g[i],g[i+1]);
    }
    ctx.globalAlpha=1;
    return marks;
  }
  function frame(now){
    if(!fig.isConnected)return;
    requestAnimationFrame(frame);
    if(!visible||document.hidden||now-last<1000/FPS)return;
    last=now;t+=1/FPS;draw();
  }
  layout();
  for(let i=0,m;((m=draw())<cols*rows*.06||m>cols*rows*.5)&&i<8;i++)t=pick(0,500);   // open on a band neither empty nor full (it sits beside the headline): else try another start
  if(document.fonts)document.fonts.load(font).then(()=>fig.isConnected&&draw());
  if(still)return;
  new IntersectionObserver(e=>{visible=e[0].isIntersecting;}).observe(field);
  new ResizeObserver(()=>{if(field.clientWidth!==w||field.clientHeight!==h){layout();draw();}}).observe(field);
  requestAnimationFrame(frame);
};
})();
