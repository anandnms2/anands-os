'use strict';
/* ---------- utils ---------- */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const uid=()=>Math.random().toString(36).slice(2,9);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const el=(tag,attrs={},...kids)=>{const e=document.createElement(tag);for(const k in attrs){const v=attrs[k];if(k==='class')e.className=v;else if(k==='html')e.innerHTML=v;else if(k.startsWith('on'))e.addEventListener(k.slice(2),v);else if(typeof v==='boolean'&&k.startsWith('aria-'))e.setAttribute(k,String(v));else if(v===true)e.setAttribute(k,'');else if(v!==false&&v!=null)e.setAttribute(k,v)}for(const c of kids.flat())if(c!=null&&c!==false)e.append(c.nodeType?c:document.createTextNode(c));return e};
const IC={
undo:'<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
redo:'<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
tpl:'<rect x="3" y="3" width="18" height="8" rx="1.5"/><rect x="3" y="14" width="8" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
shapes:'<circle cx="8.5" cy="8.5" r="5"/><rect x="11" y="11" width="10" height="10" rx="1.5"/>',
text:'<path d="M5 7V4h14v3"/><path d="M12 4v16"/><path d="M9 20h6"/>',
upload:'<path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
draw:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
bg:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="m3 16 5-5 5 5 3-3 5 5"/>',
layers:'<path d="m12 3 9 5-9 5-9-5Z"/><path d="m3 13 9 5 9-5"/>',
brand:'<path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 2-2 0-1.6-1-1.8-1-3s1-2 2.5-2H18a3 3 0 0 0 3-3c0-4.4-4-8-9-8Z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7" r="1"/>',
magic:'<path d="m12 3 1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8Z"/><path d="M19 15v5M16.5 17.5h5"/>',
props:'<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
plus:'<path d="M12 5v14M5 12h14"/>',minus:'<path d="M5 12h14"/>',
trash:'<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/>',
copy:'<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/>',
lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
unlock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/>',
eye:'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
eyeoff:'<path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.5 6.6C3.7 8.4 2 12 2 12s3.6 7 10 7a9.700 9.700 0 0 0 4-.9"/>',
fwd:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 14V6a2 2 0 0 1 2-2h8"/>',
back:'<rect x="4" y="4" width="12" height="12" rx="2"/><path d="M20 10v8a2 2 0 0 1-2 2h-8"/>',
top:'<path d="M5 4h14"/><path d="m7 14 5-5 5 5"/><path d="M12 9v11"/>',
bottom:'<path d="M5 20h14"/><path d="m7 10 5 5 5-5"/><path d="M12 15V4"/>',
group:'<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/><path d="M7 11v2a2 2 0 0 0 2 2h4M17 13v-2a2 2 0 0 0-2-2h-4" stroke-dasharray="2 2"/>',
ungroup:'<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/>',
flipH:'<path d="M12 3v18"/><path d="M8 7 3 12l5 5z"/><path d="m16 7 5 5-5 5z"/>',
flipV:'<path d="M3 12h18"/><path d="M7 8l5-5 5 5z"/><path d="m7 16 5 5 5-5z"/>',
bold:'<path d="M7 4h6a4 4 0 0 1 0 8H7zM7 12h7a4 4 0 0 1 0 8H7z"/>',
italic:'<path d="M10 4h8M6 20h8M15 4 9 20"/>',
underline:'<path d="M7 4v7a5 5 0 0 0 10 0V4M5 21h14"/>',
strike:'<path d="M4 12h16"/><path d="M16 6a4 4 0 0 0-4-2c-2.500 0-4 1.200-4 3 0 4 8 2 8 6 0 1.800-1.700 3-4 3a5 5 0 0 1-4.500-2"/>',
list:'<path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4.500" cy="6" r=".8"/><circle cx="4.500" cy="12" r=".8"/><circle cx="4.500" cy="18" r=".8"/>',
listnum:'<path d="M10 6h11M10 12h11M10 18h11M4 5l1-1v4M4 11.500h2l-2 3h2M4 17.500h2v1H4.500l1.500 1.500H4"/>',
alignL:'<path d="M4 6h16M4 10h10M4 14h16M4 18h10"/>',alignC:'<path d="M4 6h16M7 10h10M4 14h16M7 18h10"/>',alignR:'<path d="M4 6h16M10 10h10M4 14h16M10 18h10"/>',
aL:'<path d="M4 3v18"/><rect x="7" y="6" width="12" height="4" rx="1"/><rect x="7" y="14" width="7" height="4" rx="1"/>',
aC:'<path d="M12 3v18"/><rect x="5" y="6" width="14" height="4" rx="1"/><rect x="8" y="14" width="8" height="4" rx="1"/>',
aR:'<path d="M20 3v18"/><rect x="5" y="6" width="12" height="4" rx="1"/><rect x="10" y="14" width="7" height="4" rx="1"/>',
aT:'<path d="M3 4h18"/><rect x="6" y="7" width="4" height="12" rx="1"/><rect x="14" y="7" width="4" height="7" rx="1"/>',
aM:'<path d="M3 12h18"/><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="8" width="4" height="8" rx="1"/>',
aB:'<path d="M3 20h18"/><rect x="6" y="5" width="4" height="12" rx="1"/><rect x="14" y="10" width="4" height="7" rx="1"/>',
dH:'<path d="M4 3v18M20 3v18"/><rect x="9.500" y="7" width="5" height="10" rx="1"/>',
dV:'<path d="M3 4h18M3 20h18"/><rect x="7" y="9.500" width="10" height="5" rx="1"/>',
play:'<path d="M7 4v16l13-8z"/>',
download:'<path d="M12 4v12"/><path d="m7 11 5 5 5-5"/><path d="M4 20h16"/>',
sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.900 4.900l1.400 1.400M17.700 17.700l1.400 1.400M2 12h2M20 12h2M4.900 19.100l1.400-1.400M17.700 6.300l1.400-1.400"/>',
moon:'<path d="M20 14.500A8 8 0 1 1 9.500 4 6.500 6.500 0 0 0 20 14.500Z"/>',
close:'<path d="M6 6l12 12M18 6 6 18"/>',
search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.500-3.500"/>',
home:'<path d="M4 11 12 4l8 7v9H4z"/>',
left:'<path d="m15 5-7 7 7 7"/>',right:'<path d="m9 5 7 7-7 7"/>',
pen:'<path d="M3 21c4-1 6-4 8-8s5-2 4-6-6-3-5 1"/>',
marker:'<path d="m4 20 2-6 9-9a2.800 2.800 0 0 1 4 4l-9 9z"/><path d="M13 7l4 4"/>',
hl:'<path d="m9 11 4 4"/><path d="m5 19 3-1 9-9-3-3-9 9z"/><path d="M3 21h8"/>',
eraser:'<path d="m7 21-4-4a2 2 0 0 1 0-3l10-10a2 2 0 0 1 3 0l5 5a2 2 0 0 1 0 3L12 21z"/><path d="M8 11l7 7"/>',
crop:'<path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M2 6h14a2 2 0 0 1 2 2v14"/>',
image:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.800"/><path d="m21 16-5-5-8 8"/>',
qr:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v0M14 20h3M20 17v4"/>',
chart:'<path d="M4 20V4"/><path d="M4 20h16"/><rect x="7" y="12" width="3" height="6"/><rect x="12" y="8" width="3" height="10"/><rect x="17" y="14" width="3" height="4"/>',
table:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16M15 4v16"/>',
check:'<path d="m5 12 5 5 9-10"/>',
more:'<circle cx="5" cy="12" r="1.500"/><circle cx="12" cy="12" r="1.500"/><circle cx="19" cy="12" r="1.500"/>',
pick:'<path d="m3 21 6-2 9-9-4-4-9 9z"/><path d="m14 6 4 4M16 4l1.500-1.500a2 2 0 0 1 3 3L19 7"/>',
grid:'<path d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18"/>',
sparkle:'<path d="m12 3 1.800 4.700L18.500 9.500l-4.700 1.800L12 16l-1.800-4.700L5.500 9.500l4.700-1.800Z"/>'
};
const ic=(n,s)=>`<svg class="i" viewBox="0 0 24 24"${s?` style="width:${s}px;height:${s}px"`:''}>${IC[n]||''}</svg>`;
function toast(m,ms=2200){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('on'),ms)}

/* ---------- constants ---------- */
const FONTS=['Instrument Sans','Poppins','Montserrat','Raleway','Work Sans','Nunito','Quicksand','Fredoka','Oswald','Playfair Display','Lora','Merriweather','Roboto Slab','Cormorant Garamond','DM Serif Display','Abril Fatface','Anton','Bebas Neue','Archivo Black','Bricolage Grotesque','Righteous','Bangers','Pacifico','Lobster','Caveat','Dancing Script','Satisfy','Permanent Marker','Space Mono'];
const SIZES=[{n:'Instagram post',w:1080,h:1080},{n:'Instagram story',w:1080,h:1920},{n:'Facebook post',w:1200,h:630},{n:'YouTube thumbnail',w:1280,h:720},{n:'Presentation 16:9',w:1920,h:1080},{n:'X / Twitter post',w:1600,h:900},{n:'LinkedIn banner',w:1584,h:396},{n:'Pinterest pin',w:1000,h:1500},{n:'A4 document',w:1240,h:1754},{n:'US Letter',w:1275,h:1650},{n:'Flyer A5',w:874,h:1240},{n:'Poster 18×24 in',w:1800,h:2400},{n:'Business card',w:1050,h:600},{n:'Logo',w:800,h:800},{n:'Invitation 5×7 in',w:1050,h:1470},{n:'Desktop wallpaper',w:1920,h:1080}];
const SWATCH=['#000000','#545454','#a6a6a6','#d9d9d9','#ffffff','#e03131','#f76707','#f59f00','#ffd43b','#94d82d','#2f9e44','#12b886','#1098ad','#1971c2','#4263eb','#7048e8','#ae3ec9','#d6336c','#e8590c','#fff3bf','#d3f9d8','#d0ebff','#e5dbff','#ffdeeb'];
const GRADS=[['#ff7a29','#d6336c',135],['#4263eb','#12b886',135],['#7048e8','#ae3ec9',45],['#f59f00','#e03131',90],['#0b132b','#3a506b',160],['#fdf6e3','#f4c7a1',180],['#a8edea','#fed6e3',135],['#141e30','#243b55',90],['#ff9a9e','#fad0c4',45],['#43e97b','#38f9d7',135]];
const EMOJI={Faces:'😀😁😂🤣😊😍🥰😎🤩🥳😇🤔😴😭😡🤯🙌👏👍👎🙏💪✌️🤝👀🔥',Nature:'🌸🌼🌻🌹🌿🍀🌴🌵🍁🌈☀️🌙⭐✨⚡❄️🌊🐶🐱🦊🐼🦋🐝🐢🦄',Food:'🍎🍊🍋🍉🍓🍍🥑🍕🍔🍟🌮🍣🍩🍪🎂🍰☕🍷🍺🥂',Objects:'🎉🎁🎈🎯🏆💡📌📎🔔📣💼📈💰🛍️🏷️🔑📷🎧🎮🚀✈️🚗🏠❤️💙💚💛💜🖤',Symbols:'✅❌⚠️❓❗➕➖✔️➡️⬅️⬆️⬇️🔄♻️💯🆕🆓🔝🔴🟠🟡🟢🔵🟣⚫⚪'};

/* ---------- state ---------- */
let D,cur=0,sel=[],tool='select',view={z:1,px:0,py:0},hover=null,guides=[],snapOn=true,gridOn=false;
let brand={colors:['#e8590c','#1f1c19','#fdf6e3','#12b886'],head:'Poppins',body:'Instrument Sans',logo:null};
try{const b=JSON.parse(localStorage.getItem('ds.brand')||'null');if(b&&b.colors)brand=Object.assign(brand,b)}catch(e){}
const saveBrand=()=>{try{localStorage.setItem('ds.brand',JSON.stringify({colors:brand.colors,head:brand.head,body:brand.body}))}catch(e){}};
const newPage=()=>({id:uid(),bg:{t:'solid',c:'#ffffff'},objs:[]});
const newDoc=(w,h,name)=>({id:uid(),name:name||'Untitled design',w,h,pages:[newPage()],assets:{}});
D=newDoc(1080,1080,'Untitled design');
const P=()=>D.pages[cur];
const objs=()=>P().objs;
const selObjs=()=>objs().filter(o=>sel.includes(o.id));
const unit=()=>Math.max(.4,Math.min(D.w,D.h)/1080);

/* ---------- history ---------- */
let hist=[],hi=-1,hTimer=0,dirty=false;
const snap=()=>JSON.stringify({w:D.w,h:D.h,pages:D.pages},(k,v)=>k[0]==='_'?undefined:v);
function touch(){dirty=true;render();clearTimeout(hTimer);hTimer=setTimeout(commit,320)}
function commit(){clearTimeout(hTimer);if(!dirty)return;dirty=false;const s=snap();if(hist[hi]===s)return;hist=hist.slice(0,hi+1);hist.push(s);if(hist.length>150)hist.shift();hi=hist.length-1;afterCommit()}
function resetHistory(){hist=[snap()];hi=0;dirty=false;updUndo()}
function undo(){commit();if(hi<=0)return;hi--;restore(hist[hi])}
function redo(){commit();if(hi>=hist.length-1)return;hi++;restore(hist[hi])}
function restore(s){const o=JSON.parse(s);D.w=o.w;D.h=o.h;D.pages=o.pages;cur=clamp(cur,0,D.pages.length-1);sel=sel.filter(id=>objs().some(x=>x.id===id));renderAll();afterCommit(true)}
function updUndo(){$('#btnUndo').disabled=hi<=0;$('#btnRedo').disabled=hi>=hist.length-1}
let saveT=0;
function afterCommit(noHist){updUndo();renderStrip();clearTimeout(saveT);saveT=setTimeout(saveDoc,900)}

function usedAssets(){const m=JSON.stringify(D.pages).match(/"a_[a-z0-9]+"/g)||[];const a={};m.forEach(x=>{const k=x.slice(1,-1);if(D.assets[k])a[k]=D.assets[k]});if(brand.logo&&D.assets[brand.logo])a[brand.logo]=D.assets[brand.logo];return a}

/* ---------- drawing engine ---------- */
const imgCache=new Map();
function getImg(id){let i=imgCache.get(id);if(!i){i=new Image();i.onload=()=>render();i.src=D.assets[id]||id;imgCache.set(id,i)}return i}
const fontSeen=new Set();
function useFont(f,w,it){const k=f+w+it;if(fontSeen.has(k))return;fontSeen.add(k);try{document.fonts.load(`${it?'italic ':''}${w} 20px "${f}"`).then(()=>render())}catch(e){}}
const poly=(n,rot=-90,inner=1)=>{let d='';const m=inner<1?n*2:n;for(let i=0;i<m;i++){const r=(inner<1&&i%2)?inner*50:50;const a=(rot+i*360/m)*Math.PI/180;d+=(i?'L':'M')+(50+r*Math.cos(a)).toFixed(2)+' '+(50+r*Math.sin(a)).toFixed(2)}return d+'Z'};
const SP={
 ellipse:'M0 50A50 50 0 1 0 100 50A50 50 0 1 0 0 50Z',tri:'M50 0L100 100L0 100Z',rtri:'M0 0L100 100L0 100Z',diamond:'M50 0L100 50L50 100L0 50Z',
 pent:poly(5),hex:poly(6,0),oct:poly(8,22.5),star:poly(5,-90,.42),star4:poly(4,-90,.38),star6:poly(6,-90,.55),burst:poly(12,-90,.8),burst2:poly(20,-90,.86),
 heart:'M50 92C8 62 0 36 14 18C27 3 45 9 50 24C55 9 73 3 86 18C100 36 92 62 50 92Z',
 arrow:'M0 32H58V8L100 50L58 92V68H0Z',chevron:'M0 0H60L100 50L60 100H0L40 50Z',plus:'M35 0H65V35H100V65H65V100H35V65H0V35H35Z',
 bubble:'M10 0H90Q100 0 100 10V60Q100 70 90 70H42L22 96L26 70H10Q0 70 0 60V10Q0 0 10 0Z',
 cloud:'M26 82C4 82 -2 54 20 50C14 24 46 12 56 34C68 14 98 26 90 52C106 58 100 82 78 82Z',
 blob:'M50 4C82 -2 102 26 95 56C89 86 60 102 34 93C8 85 -3 55 8 30C16 12 33 7 50 4Z',blob2:'M60 3C88 8 100 36 94 62C88 88 60 99 36 92C10 84 2 58 8 36C14 14 38 -1 60 3Z',
 para:'M22 0H100L78 100H0Z',trap:'M20 0H80L100 100H0Z',semi:'M0 100A50 100 0 0 1 100 100Z',bolt:'M62 0L14 56H44L34 100L86 40H56Z',moon:'M62 0A50 50 0 1 0 62 100A40 40 0 1 1 62 0Z',
 drop:'M50 0C50 0 90 46 90 66A40 40 0 0 1 10 66C10 46 50 0 50 0Z',flag:'M10 0V100M10 6H88L70 32L88 58H10',ring:'M50 0A50 50 0 1 0 50 100A50 50 0 1 0 50 0ZM50 22A28 28 0 1 1 50 78A28 28 0 1 1 50 22Z',
 tag:'M0 10Q0 0 10 0H62L100 50L62 100H10Q0 100 0 90Z',check:'M8 52L36 80L92 20L80 8L36 56L20 40Z',cross:'M20 0L50 30L80 0L100 20L70 50L100 80L80 100L50 70L20 100L0 80L30 50L0 20Z'
};
const SHAPE_LIST=[['rect','Square'],['ellipse','Circle'],['tri','Triangle'],['rtri','Right triangle'],['diamond','Diamond'],['pent','Pentagon'],['hex','Hexagon'],['oct','Octagon'],['star','Star'],['star4','4-point star'],['star6','6-point star'],['burst','Burst'],['burst2','Seal'],['heart','Heart'],['arrow','Arrow'],['chevron','Chevron'],['plus','Plus'],['cross','Cross'],['bubble','Speech'],['cloud','Cloud'],['blob','Blob'],['blob2','Blob 2'],['para','Parallelogram'],['trap','Trapezoid'],['semi','Half circle'],['bolt','Bolt'],['moon','Moon'],['drop','Drop'],['ring','Ring'],['tag','Tag'],['check','Check']];
const spCache={};
function shapePath(o){
  const w=o.w,h=o.h,k=o.kind,p=new Path2D();
  if(k==='rect'||!SP[k]){const r=Math.min(o.r||0,w/2,h/2);if(r>0)p.roundRect(0,0,w,h,r);else p.rect(0,0,w,h);return p}
  const b=spCache[k]||(spCache[k]=new Path2D(SP[k]));
  p.addPath(b,new DOMMatrix([w/100,0,0,h/100,0,0]));return p;
}
function paint(ctx,f,w,h){
  if(!f)return null;if(typeof f==='string')return f;
  if(f.t==='rad'){const g=ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,Math.hypot(w,h)/2);g.addColorStop(0,f.c1);g.addColorStop(1,f.c2);return g}
  const a=(f.a||0)*Math.PI/180,dx=Math.sin(a),dy=-Math.cos(a),L=Math.abs(w*dx)+Math.abs(h*dy);
  const g=ctx.createLinearGradient(w/2-dx*L/2,h/2-dy*L/2,w/2+dx*L/2,h/2+dy*L/2);g.addColorStop(0,f.c1);g.addColorStop(1,f.c2);return g;
}
const dashOf=(o)=>o.dash==='dash'?[o.sw*3,o.sw*2]:o.dash==='dot'?[.1,o.sw*2]:[];
const mctx=document.createElement('canvas').getContext('2d');

/* --- shapes / lines --- */
function drawShape(ctx,o){
  if(o.kind==='line')return drawLine(ctx,o);
  const p=shapePath(o);
  if(o.fill){ctx.fillStyle=paint(ctx,o.fill,o.w,o.h);ctx.fill(p,o.kind==='ring'?'evenodd':'nonzero')}
  if(o.sw>0&&o.stroke){ctx.lineWidth=o.sw;ctx.strokeStyle=o.stroke;ctx.setLineDash(dashOf(o));ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke(p)}
}
function drawLine(ctx,o){
  const y=o.h/2,sw=o.sw||4;ctx.strokeStyle=o.stroke||'#000';ctx.fillStyle=o.stroke||'#000';ctx.lineWidth=sw;ctx.lineCap=o.dash==='dot'?'round':'butt';ctx.setLineDash(dashOf(o));
  const hs=sw*3.2,s0=o.a0&&o.a0!=='none'?hs:0,s1=o.a1&&o.a1!=='none'?hs:0;
  ctx.beginPath();ctx.moveTo(s0*.6,y);ctx.lineTo(o.w-s1*.6,y);ctx.stroke();ctx.setLineDash([]);
  const head=(x,dir,kind)=>{if(!kind||kind==='none')return;ctx.beginPath();if(kind==='arrow'){ctx.moveTo(x,y);ctx.lineTo(x-dir*hs,y-hs*.55);ctx.lineTo(x-dir*hs,y+hs*.55);ctx.closePath();ctx.fill()}else if(kind==='dot'){ctx.arc(x-dir*hs*.4,y,hs*.45,0,7);ctx.fill()}else if(kind==='bar'){ctx.moveTo(x,y-hs*.6);ctx.lineTo(x,y+hs*.6);ctx.stroke()}};
  head(o.w,1,o.a1);head(0,-1,o.a0);
}

/* --- text --- */
const wt=o=>o.bold?700:(o.wt||400);
function setFont(ctx,o){useFont(o.font,wt(o),!!o.italic);ctx.font=`${o.italic?'italic ':''}${wt(o)} ${o.size}px "${o.font}", system-ui, sans-serif`;ctx.letterSpacing=((o.ls||0)/100*o.size)+'px'}
function layoutText(o){
  const ctx=mctx;setFont(ctx,o);const lh=o.size*(o.lh||1.2),lines=[];
  const src=o.upper?o.text.toUpperCase():o.text;const paras=src.split('\n');
  paras.forEach((para,pi)=>{
    const prefix=o.list==='bullet'?'•':o.list==='num'?(pi+1)+'.':'';const ind=prefix?ctx.measureText(prefix+' ').width:0;const maxW=Math.max(10,o.w-ind);
    const words=para.split(/(?<=\s)/);let line='',first=true;
    const push=(t,end)=>{lines.push({t:t.replace(/\s+$/,''),w:ctx.measureText(t.replace(/\s+$/,'')).width,ind,pre:first?prefix:'',}); first=false};
    for(const wd of words){const t=line+wd;if(line&&ctx.measureText(t.replace(/\s+$/,'')).width>maxW){push(line);line=wd}else line=t}
    push(line);
  });
  const pad=o.fx==='background'?o.size*.3:0;
  if(o.curve){const txt=lines.map(l=>l.t).join(' ');const total=ctx.measureText(txt).width;const th=Math.max(.08,Math.abs(o.curve)/100*Math.PI*1.6);const R=total/th;o.h=lh+R*(1-Math.cos(th/2));return {lines,lh,curve:{txt,total,th,R}}}
  o.h=Math.max(lh,lines.length*lh);return {lines,lh,pad};
}
function drawTextPass(ctx,o,L,mode,style,lw,dx=0,dy=0){
  ctx.textBaseline='top';
  L.lines.forEach((ln,i)=>{
    const y=i*L.lh+(L.lh-o.size)/2+dy;let x;
    const al=o.list&&o.list!=='none'?'left':o.align;
    ctx.textAlign=al==='right'?'right':al==='center'?'center':'left';
    x=(al==='right'?o.w:al==='center'?o.w/2+ln.ind/2:ln.ind)+dx;
    if(ln.pre){ctx.textAlign='left';if(mode==='fill'){ctx.fillStyle=style;ctx.fillText(ln.pre,dx,y)}else{ctx.strokeStyle=style;ctx.lineWidth=lw;ctx.strokeText(ln.pre,dx,y)}ctx.textAlign=al==='right'?'right':al==='center'?'center':'left'}
    if(mode==='fill'){ctx.fillStyle=style;ctx.fillText(ln.t,x,y)}else{ctx.strokeStyle=style;ctx.lineWidth=lw;ctx.lineJoin='round';ctx.strokeText(ln.t,x,y)}
  });
}
function drawText(ctx,o,opt){
  const L=layoutText(o);if(o._edit)return;const s=opt.s||1;setFont(ctx,o);
  const col=paint(ctx,o.color,o.w,o.h)||'#000',fx=o.fx||'none',v=(o.fxv??50)/50,sz=o.size;
  if(L.curve){drawCurved(ctx,o,L,col);return}
  if(fx==='background'){ctx.fillStyle=o.fxc||'#ffe066';const ac=o.align;L.lines.forEach((ln,i)=>{const px=sz*.35,w=ln.w+ln.ind+px*2;let x=ac==='right'?o.w-w+px:ac==='center'?(o.w-w)/2+px:-px;ctx.beginPath();ctx.roundRect(x,i*L.lh+(L.lh-sz)/2-sz*.1,w,sz*1.2,sz*.2);ctx.fill()})}
  const sh=ctx.shadowColor,sb=ctx.shadowBlur,sx=ctx.shadowOffsetX,sy=ctx.shadowOffsetY;
  const noSh=()=>{ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetX=ctx.shadowOffsetY=0};
  if(fx==='shadow'){ctx.shadowColor='rgba(0,0,0,.4)';ctx.shadowBlur=sz*.08*s*v;ctx.shadowOffsetX=sz*.06*s*v;ctx.shadowOffsetY=sz*.06*s*v;drawTextPass(ctx,o,L,'fill',col)}
  else if(fx==='lift'){ctx.shadowColor='rgba(0,0,0,.28)';ctx.shadowBlur=sz*.3*s*v;ctx.shadowOffsetY=sz*.07*s*v;drawTextPass(ctx,o,L,'fill',col)}
  else if(fx==='hollow'){drawTextPass(ctx,o,L,'stroke',typeof col==='string'?col:(o.fxc||'#000'),Math.max(1.5,sz*.035))}
  else if(fx==='outline'){drawTextPass(ctx,o,L,'stroke',o.fxc||'#000',sz*.12*v);drawTextPass(ctx,o,L,'fill',col)}
  else if(fx==='splice'){drawTextPass(ctx,o,L,'stroke',o.fxc||'#000',Math.max(1.5,sz*.03),sz*.07*v,sz*.07*v);drawTextPass(ctx,o,L,'fill',col)}
  else if(fx==='neon'){const c=o.fxc||'#ff2bd6';for(const b of [.6,.3,.12]){ctx.shadowColor=c;ctx.shadowBlur=sz*b*s*v;drawTextPass(ctx,o,L,'fill',col)}noSh();drawTextPass(ctx,o,L,'fill',col)}
  else if(fx==='echo'){const c=o.fxc||'#e8590c';ctx.globalAlpha*=.25;drawTextPass(ctx,o,L,'fill',c,0,sz*.14*v,sz*.14*v);ctx.globalAlpha*=2;ctx.globalAlpha=Math.min(1,ctx.globalAlpha)*1;ctx.globalAlpha=(o.op??1)*.5;drawTextPass(ctx,o,L,'fill',c,0,sz*.07*v,sz*.07*v);ctx.globalAlpha=o.op??1;drawTextPass(ctx,o,L,'fill',col)}
  else if(fx==='glitch'){const d=sz*.04*v;ctx.globalAlpha=(o.op??1)*.85;drawTextPass(ctx,o,L,'fill','#ff004d',0,-d,0);drawTextPass(ctx,o,L,'fill','#00e5ff',0,d,0);ctx.globalAlpha=o.op??1;drawTextPass(ctx,o,L,'fill',col)}
  else drawTextPass(ctx,o,L,'fill',col);
  noSh();
  if(o.ul||o.st){ctx.fillStyle=typeof col==='string'?col:'#000';L.lines.forEach((ln,i)=>{const y0=i*L.lh+(L.lh-sz)/2;const al=o.align;const x=al==='right'?o.w-ln.w:al==='center'?(o.w-ln.w)/2+ln.ind/2:ln.ind;if(o.ul)ctx.fillRect(x,y0+sz*.98,ln.w,Math.max(1,sz*.06));if(o.st)ctx.fillRect(x,y0+sz*.55,ln.w,Math.max(1,sz*.06))})}
}
function drawCurved(ctx,o,L,col){
  const {txt,total,th,R}=L.curve,dir=o.curve>0?1:-1,lh=L.lh;ctx.fillStyle=col;ctx.textBaseline='middle';ctx.textAlign='center';
  const cy=dir>0?lh/2+R:lh/2-R*Math.cos(th/2);ctx.save();ctx.translate(o.w/2,cy);
  let acc=0;for(const ch of txt){const cw=ctx.measureText(ch).width;const a=(acc+cw/2-total/2)/R;acc+=cw+ (parseFloat(ctx.letterSpacing)||0);
    ctx.save();if(dir>0){ctx.translate(R*Math.sin(a),-R*Math.cos(a));ctx.rotate(a)}else{ctx.translate(R*Math.sin(a),R*Math.cos(a));ctx.rotate(-a)}ctx.fillText(ch,0,0);ctx.restore()}
  ctx.restore();
}

/* --- images --- */
const FILTERS={none:{},mono:{gs:100,c:10},sepia:{sp:80,c:5},vivid:{s:45,c:15},warm:{sp:25,s:20,h:-8},cool:{h:12,s:10,b:3},fade:{c:-18,b:12,s:-20},drama:{c:35,b:-8,s:15},noir:{gs:100,c:40,b:-8},pop:{s:70,c:12,b:6}};
function filterStr(o,s){
  const f=o.flt||{};const p=FILTERS[o.fp||'none']||{};const g=(k)=>(f[k]||0)+(p[k]||0)*((o.fpv??100)/100);
  const parts=[];const b=g('b'),c=g('c'),sa=g('s'),h=g('h'),bl=f.bl||0,gs=g('gs'),sp=g('sp');
  if(b)parts.push(`brightness(${100+b}%)`);if(c)parts.push(`contrast(${100+c}%)`);if(sa)parts.push(`saturate(${Math.max(0,100+sa)}%)`);if(h)parts.push(`hue-rotate(${h}deg)`);if(gs)parts.push(`grayscale(${gs}%)`);if(sp)parts.push(`sepia(${sp}%)`);if(bl)parts.push(`blur(${bl*s}px)`);
  return parts.join(' ')||'none';
}
function maskPath(o){if(o.mask&&o.mask!=='none'){return shapePath({kind:o.mask,w:o.w,h:o.h,r:o.r||o.w*.08})}if(o.r){const p=new Path2D();p.roundRect(0,0,o.w,o.h,Math.min(o.r,o.w/2,o.h/2));return p}return null}
function drawImage(ctx,o,opt){
  const p=maskPath(o);ctx.save();if(p)ctx.clip(p);else{ctx.beginPath();ctx.rect(0,0,o.w,o.h);ctx.clip()}
  const img=o.src&&getImg(o.src);
  if(!img||!img.complete||!img.naturalWidth){ctx.fillStyle='#d7d2ca';ctx.fillRect(0,0,o.w,o.h);ctx.strokeStyle='#9d968b';ctx.lineWidth=Math.max(2,o.w*.01);const m=Math.min(o.w,o.h);ctx.beginPath();ctx.arc(o.w/2-m*.12,o.h/2-m*.1,m*.07,0,7);ctx.moveTo(o.w/2-m*.28,o.h/2+m*.22);ctx.lineTo(o.w/2-m*.05,o.h/2);ctx.lineTo(o.w/2+m*.1,o.h/2+m*.14);ctx.lineTo(o.w/2+m*.2,o.h/2+m*.06);ctx.lineTo(o.w/2+m*.3,o.h/2+m*.22);ctx.stroke()}
  else{
    const iw=img.naturalWidth,ih=img.naturalHeight,fit=o.fit==='contain'?Math.min(o.w/iw,o.h/ih):Math.max(o.w/iw,o.h/ih),sc=fit*(o.z||1),dw=iw*sc,dh=ih*sc;
    const dx=(o.w-dw)/2+(o.ox||0)*o.w,dy=(o.h-dh)/2+(o.oy||0)*o.h;
    const fs=filterStr(o,opt.s||1);if(fs!=='none')ctx.filter=fs;ctx.drawImage(img,dx,dy,dw,dh);ctx.filter='none';
    if(o.vig>0){const g=ctx.createRadialGradient(o.w/2,o.h/2,Math.min(o.w,o.h)*.25,o.w/2,o.h/2,Math.hypot(o.w,o.h)/2);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,`rgba(0,0,0,${o.vig/100})`);ctx.fillStyle=g;ctx.fillRect(0,0,o.w,o.h)}
    if(o.tint&&o.tintv>0){ctx.globalAlpha=o.tintv/100;ctx.fillStyle=o.tint;ctx.globalCompositeOperation='multiply';ctx.fillRect(0,0,o.w,o.h);ctx.globalCompositeOperation='source-over'}
  }
  ctx.restore();
  if(o.sw>0&&o.stroke){ctx.lineWidth=o.sw;ctx.strokeStyle=o.stroke;if(p)ctx.stroke(p);else ctx.strokeRect(0,0,o.w,o.h)}
}

/* --- free drawing path --- */
function drawPathObj(ctx,o){
  const pts=o.pts;if(!pts||!pts.length)return;const sx=o.w/(o.pw||1),sy=o.h/(o.ph||1);
  ctx.strokeStyle=o.stroke;ctx.fillStyle=o.stroke;ctx.lineWidth=o.sw;ctx.lineCap='round';ctx.lineJoin='round';
  if(o.hl)ctx.globalCompositeOperation='multiply';
  const P=pts.map(p=>[p[0]*sx,p[1]*sy]);
  if(P.length<2){ctx.beginPath();ctx.arc(P[0][0],P[0][1],o.sw/2,0,7);ctx.fill();return}
  ctx.beginPath();ctx.moveTo(P[0][0],P[0][1]);
  for(let i=1;i<P.length-1;i++){const mx=(P[i][0]+P[i+1][0])/2,my=(P[i][1]+P[i+1][1])/2;ctx.quadraticCurveTo(P[i][0],P[i][1],mx,my)}
  ctx.lineTo(P[P.length-1][0],P[P.length-1][1]);ctx.stroke();ctx.globalCompositeOperation='source-over';
}

/* --- QR / chart / table --- */
const qrCache={};
function drawQR(ctx,o){
  let key=(o.ec||'M')+'|'+(o.data||' ');let m=qrCache[key];
  if(!m){try{const q=qrcode(0,o.ec||'M');q.addData(o.data||' ');q.make();const n=q.getModuleCount();m=[];for(let r=0;r<n;r++){m.push([]);for(let c=0;c<n;c++)m[r].push(q.isDark(r,c))}qrCache[key]=m}catch(e){ctx.fillStyle='#ddd';ctx.fillRect(0,0,o.w,o.h);return}}
  const n=m.length,pad=o.pad??2,cells=n+pad*2,cs=Math.min(o.w,o.h)/cells;
  if(o.bgc)ctx.fillStyle=o.bgc,ctx.fillRect(0,0,o.w,o.h);
  ctx.fillStyle=o.fg||'#000';
  for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(m[r][c]){if(o.dots){ctx.beginPath();ctx.arc((c+pad+.5)*cs,(r+pad+.5)*cs,cs*.46,0,7);ctx.fill()}else ctx.fillRect((c+pad)*cs,(r+pad)*cs,cs+.5,cs+.5)}
}
const CHART_PAL=['#e8590c','#1971c2','#2f9e44','#f59f00','#7048e8','#d6336c','#12b886','#868e96'];
function parseData(t){return (t||'').split('\n').map(l=>l.split(/[,:;\t]/)).filter(a=>a.length>=2&&isFinite(parseFloat(a[a.length-1]))).map(a=>({l:a.slice(0,-1).join(',').trim(),v:parseFloat(a[a.length-1])}))}
function drawChart(ctx,o){
  const d=parseData(o.dtext);const w=o.w,h=o.h,pal=o.pal&&o.pal.length?o.pal:CHART_PAL;
  if(o.bgc){ctx.fillStyle=o.bgc;ctx.beginPath();ctx.roundRect(0,0,w,h,12);ctx.fill()}
  if(!d.length)return;const fs=Math.max(10,Math.min(w,h)*.045);ctx.font=`500 ${fs}px "Instrument Sans",sans-serif`;ctx.fillStyle=o.tc||'#333';ctx.strokeStyle=o.tc||'#333';
  const max=Math.max(...d.map(x=>Math.abs(x.v)),1e-9),k=o.kind;
  if(k==='pie'||k==='donut'){const tot=d.reduce((a,x)=>a+Math.abs(x.v),0)||1,r=Math.min(w,h)/2-fs*1.6,cx=w/2,cy=h/2;let a0=-Math.PI/2;d.forEach((x,i)=>{const a1=a0+Math.abs(x.v)/tot*Math.PI*2;ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,a0,a1);ctx.closePath();ctx.fillStyle=pal[i%pal.length];ctx.fill();const am=(a0+a1)/2;ctx.fillStyle=o.tc||'#333';ctx.textAlign='center';ctx.textBaseline='middle';if(a1-a0>.25)ctx.fillText(x.l,cx+Math.cos(am)*(r+fs*.9),cy+Math.sin(am)*(r+fs*.9));a0=a1});
    if(k==='donut'){ctx.save();ctx.globalCompositeOperation='destination-out';ctx.beginPath();ctx.arc(cx,cy,r*.55,0,7);ctx.fill();ctx.restore();if(o.bgc){ctx.fillStyle=o.bgc;ctx.beginPath();ctx.arc(cx,cy,r*.55,0,7);ctx.fill()}}return}
  const L=fs*2.2,B=fs*2.2,T=fs,Rr=fs,pw=w-L-Rr,ph=h-B-T;ctx.globalAlpha*=.25;ctx.lineWidth=1;for(let i=0;i<=4;i++){const y=T+ph*i/4;ctx.beginPath();ctx.moveTo(L,y);ctx.lineTo(w-Rr,y);ctx.stroke()}ctx.globalAlpha=o.op??1;
  ctx.textAlign='right';ctx.textBaseline='middle';for(let i=0;i<=4;i++)ctx.fillText(+(max*(4-i)/4).toFixed(1),L-6,T+ph*i/4);
  const n=d.length,bw=pw/n;ctx.textAlign='center';ctx.textBaseline='top';
  if(k==='line'){ctx.beginPath();d.forEach((x,i)=>{const px=L+bw*(i+.5),py=T+ph*(1-x.v/max);i?ctx.lineTo(px,py):ctx.moveTo(px,py)});ctx.strokeStyle=pal[0];ctx.lineWidth=Math.max(3,fs*.25);ctx.lineJoin='round';ctx.stroke();d.forEach((x,i)=>{const px=L+bw*(i+.5),py=T+ph*(1-x.v/max);ctx.fillStyle=pal[0];ctx.beginPath();ctx.arc(px,py,fs*.35,0,7);ctx.fill();ctx.fillStyle=o.tc||'#333';ctx.fillText(x.l,px,T+ph+6)})}
  else d.forEach((x,i)=>{const bh=ph*Math.abs(x.v)/max,px=L+bw*i+bw*.15;ctx.fillStyle=o.multi?pal[i%pal.length]:pal[0];ctx.beginPath();ctx.roundRect(px,T+ph-bh,bw*.7,bh,[6,6,0,0]);ctx.fill();ctx.fillStyle=o.tc||'#333';ctx.fillText(x.l,L+bw*(i+.5),T+ph+6)});
}
function drawTable(ctx,o){
  const rows=o.rows||[],R=rows.length,C=R?rows[0].length:0;if(!R||!C)return;const cw=o.w/C,rh=o.h/R,fs=o.size||26;
  rows.forEach((row,r)=>row.forEach((t,c)=>{const hd=o.hdr&&r===0;ctx.fillStyle=hd?(o.c1||'#1f1c19'):(o.band&&r%2===0?(o.c2||'#f1ece4'):(o.c3||'#fff'));ctx.fillRect(c*cw,r*rh,cw+.5,rh+.5);
    ctx.strokeStyle=o.bc||'#cfc8bc';ctx.lineWidth=2;ctx.strokeRect(c*cw,r*rh,cw,rh);
    ctx.save();ctx.beginPath();ctx.rect(c*cw+4,r*rh,cw-8,rh);ctx.clip();ctx.fillStyle=hd?'#fff':(o.tc||'#1f1c19');ctx.font=`${hd?700:400} ${fs}px "${o.font||'Instrument Sans'}",sans-serif`;ctx.textBaseline='middle';ctx.textAlign='left';ctx.fillText(t,c*cw+14,r*rh+rh/2);ctx.restore()}));
}

/* --- generic object --- */
function drawObj(ctx,o,opt){
  if(o.hidden)return;ctx.save();
  ctx.translate(o.x+o.w/2,o.y+o.h/2);if(o.rot)ctx.rotate(o.rot*Math.PI/180);ctx.scale(o.fx_?-1:1,o.fy_?-1:1);ctx.translate(-o.w/2,-o.h/2);
  ctx.globalAlpha=o.op??1;const s=opt.s||1,sh=o.shadow;
  if(sh&&sh.on){ctx.shadowColor=sh.c;ctx.shadowBlur=sh.b*s;ctx.shadowOffsetX=sh.x*s;ctx.shadowOffsetY=sh.y*s}
  switch(o.type){case 'shape':drawShape(ctx,o);break;case 'text':drawText(ctx,o,opt);break;case 'image':drawImage(ctx,o,opt);break;case 'path':drawPathObj(ctx,o);break;case 'qr':drawQR(ctx,o);break;case 'chart':drawChart(ctx,o);break;case 'table':drawTable(ctx,o);break;
    case 'group':ctx.scale(o.w/o.gw,o.h/o.gh);for(const k of o.kids)drawObj(ctx,k,opt);break}
  ctx.restore();
}
const patCache={};
function patternFor(ctx,bg){
  const sz=bg.size||40,key=[bg.kind,bg.c1,bg.c2,sz].join('|');let c=patCache[key];
  if(!c){c=document.createElement('canvas');c.width=c.height=sz*2;const g=c.getContext('2d');g.fillStyle=bg.c1;g.fillRect(0,0,sz*2,sz*2);g.fillStyle=g.strokeStyle=bg.c2;g.lineWidth=sz*.1;const k=bg.kind;
    if(k==='dots'){for(const[x,y]of[[.5,.5],[1.5,1.5]]){g.beginPath();g.arc(x*sz,y*sz,sz*.14,0,7);g.fill()}}
    else if(k==='stripes'){g.save();g.rotate(Math.PI/4);for(let i=-4;i<8;i++)g.fillRect(i*sz*.5,-sz*3,sz*.22,sz*8);g.restore()}
    else if(k==='grid'){g.beginPath();g.moveTo(0,0);g.lineTo(sz*2,0);g.moveTo(0,sz);g.lineTo(sz*2,sz);g.moveTo(0,0);g.lineTo(0,sz*2);g.moveTo(sz,0);g.lineTo(sz,sz*2);g.stroke()}
    else if(k==='check'){g.fillRect(0,0,sz,sz);g.fillRect(sz,sz,sz,sz)}
    else if(k==='cross'){for(const[x,y]of[[.5,.5],[1.5,1.5]]){g.beginPath();g.moveTo(x*sz-sz*.15,y*sz);g.lineTo(x*sz+sz*.15,y*sz);g.moveTo(x*sz,y*sz-sz*.15);g.lineTo(x*sz,y*sz+sz*.15);g.stroke()}}
    else if(k==='waves'){g.lineWidth=sz*.08;for(let y=0;y<=2;y++){g.beginPath();for(let x=0;x<=sz*2;x+=4)g.lineTo(x,y*sz+Math.sin(x/sz*Math.PI*2)*sz*.18+sz*.5);g.stroke()}}
    patCache[key]=c}
  return ctx.createPattern(c,'repeat');
}
function drawBg(ctx,bg,W,H,opt){
  if(!bg)bg={t:'solid',c:'#fff'};
  if(bg.t==='solid'){if(bg.c&&bg.c!=='transparent'){ctx.fillStyle=bg.c;ctx.fillRect(0,0,W,H)}}
  else if(bg.t==='grad'){ctx.fillStyle=paint(ctx,{t:bg.k||'lin',c1:bg.c1,c2:bg.c2,a:bg.a},W,H);ctx.fillRect(0,0,W,H)}
  else if(bg.t==='pat'){ctx.fillStyle=patternFor(ctx,bg);ctx.fillRect(0,0,W,H)}
  else if(bg.t==='img'){ctx.fillStyle=bg.c||'#fff';ctx.fillRect(0,0,W,H);const img=getImg(bg.src);if(img.complete&&img.naturalWidth){const iw=img.naturalWidth,ih=img.naturalHeight,sc=Math.max(W/iw,H/ih);ctx.drawImage(img,(W-iw*sc)/2,(H-ih*sc)/2,iw*sc,ih*sc)}}
}
async function ensureAssets(){
  const ids=new Set();(JSON.stringify(D.pages).match(/"a_[a-z0-9]+"/g)||[]).forEach(m=>ids.add(m.slice(1,-1)));
  const fonts=new Set();const walk=os=>os.forEach(o=>{if(o.type==='text')fonts.add(`${o.italic?'italic ':''}${wt(o)} 20px "${o.font}"`);if(o.kids)walk(o.kids)});D.pages.forEach(p=>walk(p.objs));
  await Promise.all([...ids].map(async id=>{const i=getImg(id);try{await i.decode()}catch(e){}}));
  await Promise.all([...fonts].map(f=>document.fonts.load(f).catch(()=>0)));
}
function renderPageTo(page,scale,opt={}){
  const c=document.createElement('canvas');c.width=Math.max(1,Math.round(D.w*scale));c.height=Math.max(1,Math.round(D.h*scale));
  const ctx=c.getContext('2d');ctx.scale(scale,scale);drawPageContent(ctx,page,D.w,D.h,{s:scale,transparent:opt.transparent});return c;
}
async function thumbOf(page,maxW){const sc=Math.min(1,maxW/Math.max(D.w,D.h));const c=renderPageTo(page,sc);return c.toDataURL('image/jpeg',.8)}

/* ---------- geometry ---------- */
const rad=d=>d*Math.PI/180;
function corners(o){const cx=o.x+o.w/2,cy=o.y+o.h/2,a=rad(o.rot||0),c=Math.cos(a),s=Math.sin(a);return [[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>{const lx=x*o.w/2,ly=y*o.h/2;return [cx+lx*c-ly*s,cy+lx*s+ly*c]})}
function aabb(o){const cs=corners(o);const xs=cs.map(p=>p[0]),ys=cs.map(p=>p[1]);const x=Math.min(...xs),y=Math.min(...ys);return {x,y,w:Math.max(...xs)-x,h:Math.max(...ys)-y}}
function unionBox(list){if(!list.length)return null;const bs=list.map(aabb);const x=Math.min(...bs.map(b=>b.x)),y=Math.min(...bs.map(b=>b.y)),r=Math.max(...bs.map(b=>b.x+b.w)),bt=Math.max(...bs.map(b=>b.y+b.h));return {x,y,w:r-x,h:bt-y}}
function toLocal(o,px,py){const cx=o.x+o.w/2,cy=o.y+o.h/2,a=-rad(o.rot||0),c=Math.cos(a),s=Math.sin(a),dx=px-cx,dy=py-cy;return [dx*c-dy*s,dx*s+dy*c]}
function hitObj(o,px,py,pad=0){if(o.hidden)return false;const [lx,ly]=toLocal(o,px,py);const p=o.kind==='line'?Math.max(pad,10):pad;return Math.abs(lx)<=o.w/2+p&&Math.abs(ly)<=o.h/2+p}
function pickAt(px,py){const os=objs();for(let i=os.length-1;i>=0;i--)if(hitObj(os[i],px,py,4/view.z))return os[i];return null}

/* ---------- main render ---------- */
let rafM=0,rafU=0;
function render(){if(!rafM)rafM=requestAnimationFrame(()=>{rafM=0;paintMain();paintUI()})}
function renderUI(){if(!rafU)rafU=requestAnimationFrame(()=>{rafU=0;paintUI()})}
function sizeCanvases(){const w=$('#work'),dpr=window.devicePixelRatio||1,W=w.clientWidth,H=w.clientHeight;for(const id of ['cv','ui']){const c=$('#'+id);if(c.width!==Math.round(W*dpr)||c.height!==Math.round(H*dpr)){c.width=Math.round(W*dpr);c.height=Math.round(H*dpr)}}}
function paintMain(){
  sizeCanvases();const cv=$('#cv'),ctx=cv.getContext('2d'),dpr=window.devicePixelRatio||1,{z,px,py}=view;
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cv.width,cv.height);ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.save();ctx.translate(px,py);ctx.scale(z,z);
  ctx.shadowColor='rgba(0,0,0,.28)';ctx.shadowBlur=26*dpr;ctx.shadowOffsetY=6*dpr;ctx.fillStyle='#fff';ctx.fillRect(0,0,D.w,D.h);
  ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  ctx.beginPath();ctx.rect(0,0,D.w,D.h);ctx.clip();
  drawPageContent(ctx,P(),D.w,D.h,{s:z*dpr,t:animT});
  if(gridOn){ctx.strokeStyle='rgba(120,120,120,.35)';ctx.lineWidth=1/z;const g=Math.round(D.w/20);ctx.beginPath();for(let x=g;x<D.w;x+=g){ctx.moveTo(x,0);ctx.lineTo(x,D.h)}for(let y=g;y<D.h;y+=g){ctx.moveTo(0,y);ctx.lineTo(D.w,y)}ctx.stroke()}
  ctx.restore();
  $('#zVal').textContent=Math.round(z*100)+'%';
}
const ACC=()=>getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()||'#e8590c';
function handlePts(o){
  const z=view.z,cx=view.px+(o.x+o.w/2)*z,cy=view.py+(o.y+o.h/2)*z,a=rad(o.rot||0),c=Math.cos(a),s=Math.sin(a);
  const hw=o.w*z/2,hh=o.h*z/2,out=[];
  const defs=o.kind==='line'?[[-1,0],[1,0]]:[[-1,-1],[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0]];
  for(const [ax,ay] of defs){const lx=ax*hw,ly=ay*hh;out.push({ax,ay,x:cx+lx*c-ly*s,y:cy+lx*s+ly*c})}
  const ry=-hh-30,rot={x:cx+0*c-ry*s*-1*-1,y:0};
  const rx=cx+(0)*c-(ry)*s,ryy=cy+(0)*s+(ry)*c;
  return {h:out,rot:{x:rx,y:ryy},cx,cy};
}
function paintUI(){
  if(animT!=null){const u=$("#ui"),c=u.getContext("2d");c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,u.width,u.height);return}
  const ui=$('#ui'),ctx=ui.getContext('2d'),dpr=window.devicePixelRatio||1;sizeCanvases();
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,ui.width,ui.height);ctx.setTransform(dpr,0,0,dpr,0,0);
  const acc=ACC(),z=view.z;
  const outline=(o,lw,dash)=>{const cs=corners(o).map(p=>[view.px+p[0]*z,view.py+p[1]*z]);ctx.beginPath();cs.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.lineWidth=lw;ctx.setLineDash(dash||[]);ctx.stroke()};
  if(hover&&!sel.includes(hover)){const o=objs().find(x=>x.id===hover);if(o){ctx.strokeStyle=acc;ctx.globalAlpha=.7;outline(o,1.5);ctx.globalAlpha=1}}
  const so=selObjs();
  ctx.strokeStyle=acc;ctx.fillStyle='#fff';
  if(so.length===1){
    const o=so[0];outline(o,o.locked?1:1.5,o.locked?[4,3]:null);
    if(!o.locked&&!drag?.hideH){const hp=handlePts(o);
      ctx.setLineDash([]);ctx.lineWidth=1.5;ctx.beginPath();const top=hp.h.length>2?hp.h[1]:null;if(top){ctx.moveTo(top.x,top.y);ctx.lineTo(hp.rot.x,hp.rot.y);ctx.stroke()}
      for(const h of hp.h){ctx.beginPath();if(h.ax&&h.ay||o.kind==='line'){ctx.arc(h.x,h.y,6,0,7)}else{ctx.roundRect(h.x-5,h.y-5,10,10,3)}ctx.fillStyle='#fff';ctx.fill();ctx.stroke()}
      if(o.kind!=='line'||true){ctx.beginPath();ctx.arc(hp.rot.x,hp.rot.y,8,0,7);ctx.fillStyle='#fff';ctx.fill();ctx.stroke();ctx.beginPath();ctx.arc(hp.rot.x,hp.rot.y,3.2,0,Math.PI*1.5);ctx.stroke()}}
    if(o.type==='image'&&cropMode===o.id){ctx.setLineDash([6,4]);ctx.strokeStyle='#fff';ctx.lineWidth=2;outline(o,2,[6,4])}
  }else if(so.length>1){
    so.forEach(o=>{ctx.strokeStyle=acc;ctx.globalAlpha=.8;outline(o,1,[]);ctx.globalAlpha=1});
    const b=unionBox(so);ctx.setLineDash([5,4]);ctx.lineWidth=1.5;ctx.strokeRect(view.px+b.x*z,view.py+b.y*z,b.w*z,b.h*z);ctx.setLineDash([]);
  }
  if(guides.length){ctx.strokeStyle='#f0f';ctx.lineWidth=1;ctx.setLineDash([]);guides.forEach(g=>{ctx.beginPath();if(g.v){ctx.moveTo(view.px+g.p*z,view.py+g.a*z);ctx.lineTo(view.px+g.p*z,view.py+g.b*z)}else{ctx.moveTo(view.px+g.a*z,view.py+g.p*z);ctx.lineTo(view.px+g.b*z,view.py+g.p*z)}ctx.stroke()})}
  if(drag&&drag.k==='marquee'){const m=drag;ctx.fillStyle='rgba(232,89,12,.12)';ctx.strokeStyle=acc;ctx.lineWidth=1;ctx.setLineDash([]);const x=Math.min(m.sx,m.cx),y=Math.min(m.sy,m.cy);ctx.fillRect(x,y,Math.abs(m.cx-m.sx),Math.abs(m.cy-m.sy));ctx.strokeRect(x,y,Math.abs(m.cx-m.sx),Math.abs(m.cy-m.sy))}
  if(drag&&drag.label&&so.length){const b=unionBox(so);const t=drag.label;ctx.font='600 11px system-ui';const tw=ctx.measureText(t).width+14,x=view.px+(b.x+b.w/2)*z-tw/2,y=view.py+(b.y+b.h)*z+14;ctx.fillStyle=acc;ctx.beginPath();ctx.roundRect(x,y,tw,20,10);ctx.fill();ctx.fillStyle='#fff';ctx.textBaseline='middle';ctx.textAlign='center';ctx.fillText(t,x+tw/2,y+10.5)}
  if(tool==='draw'&&penPos){ctx.strokeStyle=acc;ctx.lineWidth=1;ctx.beginPath();ctx.arc(penPos.x,penPos.y,Math.max(2,pen.size*z/2),0,7);ctx.stroke()}
  placeQbar();
}
let drag=null,cropMode=null,penPos=null;

/* ---------- view ---------- */
let userView=false;
function fit(){const w=$('#work');const W=w.clientWidth,H=w.clientHeight;if(!W)return;const m=W<600?24:56;const z=clamp(Math.min((W-m*2)/D.w,(H-m*2)/D.h),.03,4);view.z=z;view.px=(W-D.w*z)/2;view.py=(H-D.h*z)/2;userView=false;render()}
function zoomAt(f,cx,cy){const w=$('#work'),W=w.clientWidth,H=w.clientHeight;cx=cx??W/2;cy=cy??H/2;const nz=clamp(view.z*f,.03,8);const k=nz/view.z;view.px=cx-(cx-view.px)*k;view.py=cy-(cy-view.py)*k;view.z=nz;userView=true;render()}
function toDoc(cx,cy){const r=$('#work').getBoundingClientRect();return {x:(cx-r.left-view.px)/view.z,y:(cy-r.top-view.py)/view.z,sx:cx-r.left,sy:cy-r.top}}

/* ---------- object factories ---------- */
function place(o){o.x=o.x??(D.w-o.w)/2;o.y=o.y??(D.h-o.h)/2;return o}
function mkText(txt,over={}){const u=unit();return Object.assign({id:uid(),type:'text',x:undefined,y:undefined,w:560*u,h:80,rot:0,text:txt,font:brand.body,size:Math.round(64*u),bold:false,wt:400,italic:false,ul:false,st:false,align:'left',color:'#1f1c19',lh:1.2,ls:0,upper:false,list:'none',fx:'none',fxc:'#e8590c',fxv:50,curve:0,op:1},over)}
function mkShape(kind,over={}){const u=unit();const s=Math.round(300*u);return Object.assign({id:uid(),type:'shape',kind,x:undefined,y:undefined,w:s,h:s,rot:0,fill:brand.colors[0]||'#e8590c',stroke:'#000000',sw:0,dash:'solid',r:0,op:1},over)}
function mkLine(over={}){const u=unit();return Object.assign({id:uid(),type:'shape',kind:'line',x:undefined,y:undefined,w:Math.round(400*u),h:0,rot:0,stroke:'#1f1c19',sw:Math.round(6*u),dash:'solid',a0:'none',a1:'none',op:1},over)}
function mkImage(src,nw,nh,over={}){const u=unit();let w=Math.min(D.w*.6,nw||600),h=w*(nh||400)/(nw||600);if(h>D.h*.7){h=D.h*.7;w=h*(nw||600)/(nh||400)}return Object.assign({id:uid(),type:'image',src,x:undefined,y:undefined,w,h,rot:0,fit:'cover',z:1,ox:0,oy:0,mask:'none',r:0,sw:0,stroke:'#fff',flt:{},fp:'none',fpv:100,vig:0,op:1},over)}
function addObj(o,opts={}){place(o);objs().push(o);if(opts.keep!==true)sel=[o.id];touch();selChanged();return o}
function addObjs(list){list.forEach(o=>{place(o);objs().push(o)});sel=list.map(o=>o.id);touch();selChanged()}
function cloneObj(o,dx=0,dy=0){const c=JSON.parse(JSON.stringify(o,(k,v)=>k[0]==='_'?undefined:v));c.id=uid();c.x+=dx;c.y+=dy;if(c.kids)c.kids.forEach(k=>k.id=uid());return c}
function makeGroup(list){
  const b=unionBox(list);const kids=list.map(o=>{const c=cloneObj(o);c.x=o.x-b.x;c.y=o.y-b.y;return c});
  return {id:uid(),type:'group',x:b.x,y:b.y,w:b.w,h:b.h,gw:b.w,gh:b.h,rot:0,kids,op:1,name:'Group'};
}
function groupSel(){const so=selObjs();if(so.length<2)return;const os=objs();const idx=Math.min(...so.map(o=>os.indexOf(o)));const g=makeGroup(so);objs().splice(0,objs().length,...os.filter(o=>!sel.includes(o.id)));objs().splice(Math.min(idx,objs().length),0,g);sel=[g.id];touch();selChanged()}
function ungroupSel(){const out=[];let list=objs();const ids=[];
  for(const o of selObjs()){if(o.type!=='group')continue;const sx=o.w/o.gw,sy=o.h/o.gh,a=rad(o.rot||0),c=Math.cos(a),s=Math.sin(a),gcx=o.x+o.w/2,gcy=o.y+o.h/2;
    const kids=o.kids.map(k=>{const kc={x:(k.x+k.w/2)*sx-o.w/2,y:(k.y+k.h/2)*sy-o.h/2};const n=cloneObj(k);n.w=k.w*sx;n.h=k.h*sy;if(n.type==='text'){n.size*=sx;n.w=k.w*sx}const wx=gcx+kc.x*c-kc.y*s,wy=gcy+kc.x*s+kc.y*c;n.x=wx-n.w/2;n.y=wy-n.h/2;n.rot=(k.rot||0)+(o.rot||0);return n});
    const i=list.indexOf(o);list.splice(i,1,...kids);ids.push(...kids.map(k=>k.id))}
  if(ids.length){sel=ids;touch();selChanged()}}
function removeSel(){if(!sel.length)return;const os=objs();for(let i=os.length-1;i>=0;i--)if(sel.includes(os[i].id)&&!os[i].locked)os.splice(i,1);sel=[];touch();selChanged()}
function dupSel(){const so=selObjs();if(!so.length)return;const n=so.map(o=>cloneObj(o,30*unit(),30*unit()));n.forEach(o=>objs().push(o));sel=n.map(o=>o.id);touch();selChanged()}
function order(kind){const os=objs();const so=os.filter(o=>sel.includes(o.id));if(!so.length)return;
  if(kind==='front'){const rest=os.filter(o=>!sel.includes(o.id));os.splice(0,os.length,...rest,...so)}
  else if(kind==='back'){const rest=os.filter(o=>!sel.includes(o.id));os.splice(0,os.length,...so,...rest)}
  else if(kind==='fwd'){for(let i=os.length-2;i>=0;i--)if(sel.includes(os[i].id)&&!sel.includes(os[i+1].id)){[os[i],os[i+1]]=[os[i+1],os[i]]}}
  else if(kind==='bwd'){for(let i=1;i<os.length;i++)if(sel.includes(os[i].id)&&!sel.includes(os[i-1].id)){[os[i],os[i-1]]=[os[i-1],os[i]]}}
  touch();renderLayersIfOpen()}
function alignSel(k){
  const so=selObjs().filter(o=>!o.locked);if(!so.length)return;const ref=so.length>1?unionBox(so):{x:0,y:0,w:D.w,h:D.h};
  so.forEach(o=>{const b=aabb(o);let dx=0,dy=0;
    if(k==='l')dx=ref.x-b.x;if(k==='c')dx=ref.x+ref.w/2-(b.x+b.w/2);if(k==='r')dx=ref.x+ref.w-(b.x+b.w);
    if(k==='t')dy=ref.y-b.y;if(k==='m')dy=ref.y+ref.h/2-(b.y+b.h/2);if(k==='b')dy=ref.y+ref.h-(b.y+b.h);o.x+=dx;o.y+=dy});
  touch();syncPos();
}
function distSel(axis){const so=selObjs().filter(o=>!o.locked);if(so.length<3)return;const key=axis==='h'?'x':'y',sz=axis==='h'?'w':'h';
  const arr=so.map(o=>({o,b:aabb(o)})).sort((a,b)=>a.b[key]-b.b[key]);const first=arr[0].b,last=arr[arr.length-1].b;
  const total=(last[key]+last[sz])-first[key],used=arr.reduce((s,a)=>s+a.b[sz],0),gap=(total-used)/(arr.length-1);let pos=first[key];
  arr.forEach(a=>{const d=pos-a.b[key];a.o[key]+=d;pos+=a.b[sz]+gap});touch();syncPos()}

/* ---------- snapping ---------- */
function snapMove(box,skipIds){
  const thr=7/view.z,xs=[0,D.w/2,D.w],ys=[0,D.h/2,D.h];
  for(const o of objs()){if(skipIds.includes(o.id)||o.hidden)continue;const b=aabb(o);xs.push(b.x,b.x+b.w/2,b.x+b.w);ys.push(b.y,b.y+b.h/2,b.y+b.h)}
  const mx=[box.x,box.x+box.w/2,box.x+box.w],my=[box.y,box.y+box.h/2,box.y+box.h];let bx=null,by=null;
  for(const m of mx)for(const t of xs){const d=t-m;if(Math.abs(d)<thr&&(bx===null||Math.abs(d)<Math.abs(bx.d)))bx={d,t}}
  for(const m of my)for(const t of ys){const d=t-m;if(Math.abs(d)<thr&&(by===null||Math.abs(d)<Math.abs(by.d)))by={d,t}}
  const g=[];if(bx)g.push({v:1,p:bx.t,a:-20,b:D.h+20});if(by)g.push({v:0,p:by.t,a:-20,b:D.w+20});
  return {dx:bx?bx.d:0,dy:by?by.d:0,guides:g};
}

/* ---------- pointer interaction ---------- */
const pointers=new Map();let spaceDown=false;
function handleHit(o,sx,sy){
  const hp=handlePts(o),R=(window.matchMedia('(pointer:coarse)').matches?16:9);
  if(Math.hypot(sx-hp.rot.x,sy-hp.rot.y)<R+3)return {k:'rotate'};
  for(const h of hp.h)if(Math.hypot(sx-h.x,sy-h.y)<R)return {k:'resize',ax:h.ax,ay:h.ay};
  return null;
}
function cursorFor(h){if(h.k==='rotate')return 'grab';if(h.ax&&h.ay)return h.ax*h.ay>0?'nwse-resize':'nesw-resize';return h.ax?'ew-resize':'ns-resize'}
const ui$=()=>$('#ui');
function onDown(e){
  if(editing&&e.target.id!=='te'){endEdit()}
  const w=$('#work');w.focus?.();
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  ui$().setPointerCapture(e.pointerId);
  if(pointers.size===2){const [a,b]=[...pointers.values()];drag={k:'pinch',d0:Math.hypot(a.x-b.x,a.y-b.y),z0:view.z,px0:view.px,py0:view.py,cx:(a.x+b.x)/2,cy:(a.y+b.y)/2};return}
  const p=toDoc(e.clientX,e.clientY);
  closePop();
  if(tool==='draw'){startPen(e,p);return}
  if(e.button===1||spaceDown||tool==='pan'){drag={k:'pan',x:e.clientX,y:e.clientY,px:view.px,py:view.py};ui$().style.cursor='grabbing';return}
  const so=selObjs();
  if(so.length===1&&!so[0].locked){const h=handleHit(so[0],p.sx,p.sy);if(h){const o=so[0];
    if(h.k==='rotate')drag={k:'rotate',o,orig:JSON.parse(JSON.stringify(o))};
    else drag={k:'resize',o,orig:JSON.parse(JSON.stringify(o)),ax:h.ax,ay:h.ay,p0:p,shift:e.shiftKey};
    return}}
  const hit=pickAt(p.x,p.y);
  if(hit){
    if(e.shiftKey){sel=sel.includes(hit.id)?sel.filter(i=>i!==hit.id):[...sel,hit.id];selChanged();renderUI();drag=null;return}
    if(!sel.includes(hit.id)){sel=[hit.id];selChanged()}
    if(hit.locked){drag={k:'none'};renderUI();return}
    if(cropMode===hit.id&&hit.type==='image'){drag={k:'crop',o:hit,p0:p,ox:hit.ox||0,oy:hit.oy||0};return}
    cropMode=null;
    drag={k:'move',p0:p,start:selObjs().filter(o=>!o.locked).map(o=>({o,x:o.x,y:o.y})),moved:false};
  }else{
    cropMode=null;
    if(!e.shiftKey&&sel.length){sel=[];selChanged()}
    if(e.pointerType==='touch'){drag={k:'pan',x:e.clientX,y:e.clientY,px:view.px,py:view.py}}
    else drag={k:'marquee',sx:p.sx,sy:p.sy,cx:p.sx,cy:p.sy,base:e.shiftKey?[...sel]:[]};
  }
  renderUI();
}
function onMove(e){
  if(pointers.has(e.pointerId))pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  const p=toDoc(e.clientX,e.clientY);
  if(tool==='draw'){penPos={x:p.sx,y:p.sy};if(drag&&drag.k==='pen')penMove(p);renderUI();return}
  if(!drag){ // hover
    const so=selObjs();let cur='default';
    if(so.length===1&&!so[0].locked){const h=handleHit(so[0],p.sx,p.sy);if(h)cur=cursorFor(h)}
    if(cur==='default'){const hit=pickAt(p.x,p.y);const hid=hit?hit.id:null;if(hid!==hover){hover=hid;renderUI()}if(hit)cur=hit.locked?'not-allowed':'move'}
    ui$().style.cursor=spaceDown?'grab':cur;return}
  if(drag.k==='pinch'&&pointers.size===2){const [a,b]=[...pointers.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);const r=$('#work').getBoundingClientRect();const cx=(a.x+b.x)/2-r.left,cy=(a.y+b.y)/2-r.top;const nz=clamp(drag.z0*d/drag.d0,.03,8);const k=nz/drag.z0;userView=true;view.z=nz;view.px=cx-(drag.cx-r.left-drag.px0)*k;view.py=cy-(drag.cy-r.top-drag.py0)*k;render();return}
  if(drag.k==='pan'){view.px=drag.px+e.clientX-drag.x;view.py=drag.py+e.clientY-drag.y;userView=true;render();return}
  if(drag.k==='marquee'){drag.cx=p.sx;drag.cy=p.sy;const x1=Math.min(drag.sx,drag.cx),y1=Math.min(drag.sy,drag.cy),x2=Math.max(drag.sx,drag.cx),y2=Math.max(drag.sy,drag.cy);
    const hits=objs().filter(o=>{if(o.hidden)return false;const b=aabb(o);const sx1=view.px+b.x*view.z,sy1=view.py+b.y*view.z,sx2=sx1+b.w*view.z,sy2=sy1+b.h*view.z;return sx2>=x1&&sx1<=x2&&sy2>=y1&&sy1<=y2}).map(o=>o.id);
    const ns=[...new Set([...drag.base,...hits])];if(ns.join()!==sel.join()){sel=ns;selChanged(true)}renderUI();return}
  if(drag.k==='move'){
    let dx=(p.x-drag.p0.x),dy=(p.y-drag.p0.y);if(!drag.moved&&Math.hypot(dx,dy)*view.z<3)return;drag.moved=true;
    if(e.shiftKey){if(Math.abs(dx)>Math.abs(dy))dy=0;else dx=0}
    drag.start.forEach(s=>{s.o.x=s.x+dx;s.o.y=s.y+dy});
    guides=[];
    if(snapOn&&!e.altKey&&drag.start.length){const b=unionBox(drag.start.map(s=>s.o));const sn=snapMove(b,drag.start.map(s=>s.o.id));drag.start.forEach(s=>{s.o.x+=sn.dx;s.o.y+=sn.dy});guides=sn.guides}
    touch();syncPos();return}
  if(drag.k==='crop'){const o=drag.o;o.ox=drag.ox+(p.x-drag.p0.x)/o.w;o.oy=drag.oy+(p.y-drag.p0.y)/o.h;touch();return}
  if(drag.k==='rotate'){const o=drag.o,cx=view.px+(o.x+o.w/2)*view.z,cy=view.py+(o.y+o.h/2)*view.z;let a=Math.atan2(p.sy-cy,p.sx-cx)*180/Math.PI+90;a=((a%360)+360)%360;
    if(e.shiftKey)a=Math.round(a/15)*15;else for(const t of [0,45,90,135,180,225,270,315,360])if(Math.abs(a-t)<3)a=t%360;
    o.rot=Math.round(a*10)/10;drag.label=Math.round(o.rot)+'°';touch();syncPos();return}
  if(drag.k==='resize'){doResize(e,p);return}
}
function doResize(e,p){
  const {o,orig,ax,ay}=drag,a=rad(orig.rot||0),c=Math.cos(a),s=Math.sin(a);
  const dx0=p.x-drag.p0.x,dy0=p.y-drag.p0.y,dx=dx0*c+dy0*s,dy=-dx0*s+dy0*c;
  const min=Math.max(8,12/view.z),corner=ax!==0&&ay!==0;
  let nw=orig.w+ax*dx,nh=orig.h+ay*dy;
  if(o.kind==='line'){o.w=Math.max(min,nw);o.h=0;nh=0;nw=o.w}
  else if(o.type==='text'){
    if(corner){const sc=clamp(nw/orig.w,.05,30);o.size=Math.max(4,Math.round(orig.size*sc*10)/10);nw=Math.max(20,orig.w*sc)}
    else if(ax){nw=Math.max(40,nw)}
    else{const sc=clamp(nh/orig.h,.1,30);o.size=Math.max(4,Math.round(orig.size*sc*10)/10);nw=orig.w*sc}
    o.w=nw;layoutText(o);nh=o.h;
  }else{
    if((corner&&!e.altKey)||o.type==='qr'){const sx=nw/orig.w,sy=nh/orig.h,sc=Math.abs(sx-1)>Math.abs(sy-1)?sx:sy;const k=Math.max(sc,min/Math.min(orig.w,orig.h));nw=orig.w*k;nh=orig.h*k}
    else{nw=Math.max(min,nw);nh=Math.max(min,nh)}
    o.w=nw;o.h=nh;
  }
  const awx=orig.x+orig.w/2+(-ax*orig.w/2)*c-(-ay*orig.h/2)*s,awy=orig.y+orig.h/2+(-ax*orig.w/2)*s+(-ay*orig.h/2)*c;
  const ncx=awx+(ax*o.w/2)*c-(ay*o.h/2)*s,ncy=awy+(ax*o.w/2)*s+(ay*o.h/2)*c;
  o.x=ncx-o.w/2;o.y=ncy-o.h/2;
  drag.label=Math.round(o.w)+' × '+Math.round(o.h);
  touch();syncPos();
}
function onUp(e){
  pointers.delete(e.pointerId);
  try{ui$().releasePointerCapture(e.pointerId)}catch(_){}
  if(drag&&drag.k==='pinch'){if(pointers.size<2)drag=null;return}
  if(drag&&drag.k==='pen')penEnd();
  if(drag&&drag.k==='pan')ui$().style.cursor=spaceDown?'grab':'default';
  if(drag&&drag.k==='marquee'){selChanged()}
  if(drag&&drag.k==='move'&&drag.moved)selChanged(true);
  drag=null;guides=[];renderUI();
}

/* ---------- text editing overlay ---------- */
let editing=null;
function posTE(){
  if(!editing)return;const o=editing,ta=$('#te');if(!ta)return;layoutText(o);const z=view.z;
  Object.assign(ta.style,{left:(view.px+o.x*z)+'px',top:(view.py+o.y*z)+'px',width:(o.w*z)+'px',height:(o.h*z)+'px',font:`${o.italic?'italic ':''}${wt(o)} ${o.size*z}px "${o.font}", system-ui, sans-serif`,lineHeight:(o.size*(o.lh||1.2)*z)+'px',letterSpacing:((o.ls||0)/100*o.size*z)+'px',textAlign:o.align,textTransform:o.upper?'uppercase':'none',transform:`rotate(${o.rot||0}deg)`,color:typeof o.color==='string'?o.color:(o.color?.c1||'#000'),textDecoration:[o.ul?'underline':'',o.st?'line-through':''].join(' ')});
}
function editText(o){
  endEdit();editing=o;o._edit=true;render();
  const ta=el('textarea',{id:'te',spellcheck:'false','aria-label':'Edit text'});ta.value=o.text;$('#work').append(ta);posTE();ta.focus();ta.select();
  ta.addEventListener('input',()=>{o.text=ta.value;posTE();touch();syncPos()});
  ta.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape'){e.preventDefault();endEdit()}});
  ta.addEventListener('blur',()=>setTimeout(endEdit,0));
}
function endEdit(){
  if(!editing)return;const o=editing;editing=null;delete o._edit;$('#te')?.remove();
  if(!o.text.trim()){const i=objs().indexOf(o);if(i>=0)objs().splice(i,1);sel=sel.filter(i=>i!==o.id)}
  touch();selChanged();
}

/* ---------- freehand drawing ---------- */
const pen={kind:'pen',size:10,color:'#1f1c19'};
function startPen(e,p){
  if(pen.kind==='eraser'){drag={k:'pen',erase:true};penMove(p);return}
  drag={k:'pen',pts:[[p.x,p.y]]};
}
function penMove(p){
  if(drag.erase){const os=objs();for(let i=os.length-1;i>=0;i--){const o=os[i];if(o.type!=='path'||o.locked)continue;const sx=o.w/(o.pw||1),sy=o.h/(o.ph||1);if(o.pts.some(q=>Math.hypot(o.x+q[0]*sx-p.x,o.y+q[1]*sy-p.y)<(o.sw/2+14/view.z))){os.splice(i,1);touch()}}return}
  const l=drag.pts[drag.pts.length-1];if(Math.hypot(l[0]-p.x,l[1]-p.y)*view.z<2.5)return;drag.pts.push([p.x,p.y]);drag.live=true;drawLive();
}
function drawLive(){const ui=$('#ui'),ctx=ui.getContext('2d'),dpr=window.devicePixelRatio||1;paintUI();ctx.setTransform(dpr,0,0,dpr,0,0);
  const pts=drag.pts;if(pts.length<2)return;ctx.save();ctx.strokeStyle=pen.color;ctx.lineWidth=pen.size*view.z*(pen.kind==='hl'?2.2:1);ctx.lineCap=ctx.lineJoin='round';ctx.globalAlpha=pen.kind==='hl'?.45:1;ctx.beginPath();pts.forEach((q,i)=>{const x=view.px+q[0]*view.z,y=view.py+q[1]*view.z;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke();ctx.restore()}
function penEnd(){
  if(drag.erase)return;const pts=drag.pts;if(!pts||!pts.length)return;
  const sw=pen.size*(pen.kind==='hl'?2.2:1);const xs=pts.map(q=>q[0]),ys=pts.map(q=>q[1]);const x=Math.min(...xs)-sw/2,y=Math.min(...ys)-sw/2,w=Math.max(...xs)-Math.min(...xs)+sw,h=Math.max(...ys)-Math.min(...ys)+sw;
  const o={id:uid(),type:'path',x,y,w:Math.max(w,1),h:Math.max(h,1),pw:Math.max(w,1),ph:Math.max(h,1),rot:0,pts:pts.map(q=>[q[0]-x,q[1]-y]),stroke:pen.color,sw,hl:pen.kind==='hl',op:pen.kind==='hl'?.5:1,name:'Drawing'};
  objs().push(o);touch();
}

/* ---------- selection side effects ---------- */
function selChanged(light){
  if(sel.length!==1||cropMode&&!sel.includes(cropMode))cropMode=sel.length===1&&cropMode===sel[0]?cropMode:null;
  renderInsp();renderUI();renderLayersIfOpen();updateQbarSoon();
}
function syncPos(){
  const so=selObjs();if(so.length!==1)return;const o=so[0];
  $$('[data-pos]').forEach(i=>{if(document.activeElement===i)return;const k=i.dataset.pos;i.value=Math.round((k==='rot'?(o.rot||0):o[k])*10)/10});
  const t=$('[data-sz]');if(t&&o.type==='text'&&document.activeElement!==t)t.value=Math.round(o.size);
}

/* ---------- floating quick bar ---------- */
let qbT=0;
function updateQbarSoon(){clearTimeout(qbT);qbT=setTimeout(()=>{placeQbar()},0)}
function placeQbar(){
  const q=$('#qbar');const so=selObjs();
  if(!so.length||(drag&&drag.k!=='none'&&drag.k!=='pan'&&drag.k!=='pinch'&&drag.moved!==false&&drag.k!=='marquee')||editing||tool==='draw'){q.hidden=true;return}
  const b=unionBox(so),z=view.z;const lockedAll=so.every(o=>o.locked);
  q.innerHTML='';
  const btn=(i,t,f)=>{const bt=el('button',{title:t,'aria-label':t,html:ic(i),onclick:f});q.append(bt);return bt};
  if(!lockedAll){btn('copy','Duplicate',dupSel);btn('trash','Delete',removeSel)}
  btn(lockedAll?'lock':'unlock',lockedAll?'Unlock':'Lock',()=>{const v=!lockedAll;so.forEach(o=>o.locked=v);touch();selChanged()});
  if(so.length>1)btn('group','Group',groupSel);
  if(so.length===1&&so[0].type==='group')btn('ungroup','Ungroup',ungroupSel);
  if(so.length===1&&so[0].type==='text')btn('text','Edit text',()=>editText(so[0]));
  if(matchMedia('(max-width:900px)').matches)btn('props','Properties',()=>toggleSheet('insp'));
  q.hidden=false;
  const w=$('#work'),qw=q.offsetWidth,qh=q.offsetHeight;let x=view.px+(b.x+b.w/2)*z-qw/2,y=view.py+b.y*z-qh-40;
  if(y<6)y=view.py+(b.y+b.h)*z+46;
  x=clamp(x,6,w.clientWidth-qw-6);y=clamp(y,6,w.clientHeight-qh-6);q.style.left=x+'px';q.style.top=y+'px';
}

/* ---------- keyboard / clipboard ---------- */
let clip=[];let pasteN=0;
function copySel(){const so=selObjs();if(!so.length)return;clip=so.map(o=>JSON.parse(JSON.stringify(o,(k,v)=>k[0]==='_'?undefined:v)));pasteN=0;try{navigator.clipboard.writeText('DSOBJ:'+uid()).catch(()=>{})}catch(e){}}
function pasteClip(){if(!clip.length)return;pasteN++;const n=clip.map(o=>{const c=cloneObj(o,30*pasteN*unit(),30*pasteN*unit());return c});n.forEach(o=>objs().push(o));sel=n.map(o=>o.id);touch();selChanged()}
function isTyping(t){return t&&(t.tagName==='INPUT'&&!['range','checkbox','color','button'].includes(t.type)||t.tagName==='TEXTAREA'||t.tagName==='SELECT'||t.isContentEditable)}
document.addEventListener('keydown',e=>{
  if(isTyping(e.target)){return}
  const mod=e.ctrlKey||e.metaKey,k=e.key.toLowerCase();
  if(!$('#modal').hidden&&k!=='escape')return;
  if(e.key===' '&&!spaceDown){spaceDown=true;ui$().style.cursor='grab';e.preventDefault();return}
  if(mod&&k==='z'){e.preventDefault();e.shiftKey?redo():undo();return}
  if(mod&&k==='y'){e.preventDefault();redo();return}
  if(mod&&k==='c'){copySel();return}
  if(mod&&k==='x'){copySel();removeSel();return}
  if(mod&&k==='v'){return} // paste event handles it
  if(mod&&k==='d'){e.preventDefault();dupSel();return}
  if(mod&&k==='a'){e.preventDefault();sel=objs().filter(o=>!o.locked&&!o.hidden).map(o=>o.id);selChanged();return}
  if(mod&&k==='g'){e.preventDefault();e.shiftKey?ungroupSel():groupSel();return}
  if(mod&&k==='s'){e.preventDefault();commit();saveDoc();toast('Saved in this browser');return}
  if(mod&&(k==='='||k==='+')){e.preventDefault();zoomAt(1.2);return}
  if(mod&&k==='-'){e.preventDefault();zoomAt(1/1.2);return}
  if(mod&&k==='0'){e.preventDefault();fit();return}
  if(mod&&k===']'){e.preventDefault();order(e.shiftKey?'front':'fwd');return}
  if(mod&&k==='['){e.preventDefault();order(e.shiftKey?'back':'bwd');return}
  if(mod&&k==='b'&&sel.length){e.preventDefault();toggleTextProp('bold');return}
  if(mod&&k==='i'&&sel.length){e.preventDefault();toggleTextProp('italic');return}
  if(mod&&k==='u'&&sel.length){e.preventDefault();toggleTextProp('ul');return}
  if(e.key==='Delete'||e.key==='Backspace'){if(sel.length){e.preventDefault();removeSel()}return}
  if(e.key==='Escape'){if(!$('#modal').hidden){closeModal();return}if(tool!=='select'){setTool('select');return}cropMode=null;sel=[];selChanged();return}
  if(e.key.startsWith('Arrow')&&sel.length){e.preventDefault();const d=(e.shiftKey?10:1);const dx=e.key==='ArrowLeft'?-d:e.key==='ArrowRight'?d:0,dy=e.key==='ArrowUp'?-d:e.key==='ArrowDown'?d:0;selObjs().forEach(o=>{if(!o.locked){o.x+=dx;o.y+=dy}});touch();syncPos();return}
  if(mod||e.altKey)return;
  if(['t','r','o','l','p','?','h'].includes(k))e.preventDefault();
  if(k==='t'){addObj(mkText('Add a heading',{size:Math.round(96*unit()),bold:true,font:brand.head,w:D.w*.7}));editText(selObjs()[0])}
  else if(k==='r')addObj(mkShape('rect'));
  else if(k==='o')addObj(mkShape('ellipse'));
  else if(k==='l')addObj(mkLine());
  else if(k==='p'){setTool('draw',true)}
  else if(k==='?'||k==='h')openHelp();
});
document.addEventListener('keyup',e=>{if(e.key===' '){spaceDown=false;ui$().style.cursor='default'}});
document.addEventListener('paste',async e=>{
  if(isTyping(e.target))return;
  const files=[...(e.clipboardData?.files||[])].filter(f=>f.type.startsWith('image/'));
  if(files.length){e.preventDefault();for(const f of files)await addImageFile(f);return}
  const txt=e.clipboardData?.getData('text/plain')||'';
  if(!txt||txt.startsWith('DSOBJ:')){if(clip.length){e.preventDefault();pasteClip()}return}
  e.preventDefault();addObj(mkText(txt.slice(0,2000),{w:D.w*.6}));
});
function toggleTextProp(p){const t=selObjs().filter(o=>o.type==='text');if(!t.length)return;const v=!t[0][p];t.forEach(o=>o[p]=v);touch();renderInsp()}

/* ---------- drag & drop files ---------- */
['dragover','dragenter'].forEach(ev=>$('#work').addEventListener(ev,e=>{if([...(e.dataTransfer?.types||[])].includes('Files')){e.preventDefault()}}));
$('#work').addEventListener('drop',async e=>{const fs=[...(e.dataTransfer?.files||[])].filter(f=>f.type.startsWith('image/'));if(!fs.length)return;e.preventDefault();const p=toDoc(e.clientX,e.clientY);
  const hit=pickAt(p.x,p.y);for(const f of fs){const a=await ingestImage(f);if(!a)continue;if(hit&&hit.type==='image'&&fs.length===1){hit.src=a.id;touch();renderInsp()}else{addImageAsset(a,{x:p.x-100,y:p.y-100})}}});
$('#work').addEventListener('wheel',e=>{e.preventDefault();if(e.ctrlKey||e.metaKey){const r=$('#work').getBoundingClientRect();zoomAt(Math.exp(-e.deltaY*.01),e.clientX-r.left,e.clientY-r.top)}else{view.px-=e.shiftKey?e.deltaY:e.deltaX;view.py-=e.shiftKey?0:e.deltaY;userView=true;render()}},{passive:false});
const uiEl=$('#ui');['pointerdown'].forEach(()=>uiEl.addEventListener('pointerdown',onDown));uiEl.addEventListener('pointermove',onMove);uiEl.addEventListener('pointerup',onUp);uiEl.addEventListener('pointercancel',onUp);
uiEl.addEventListener('pointerleave',()=>{if(hover){hover=null;renderUI()}penPos=null;});
uiEl.addEventListener('dblclick',e=>{
  if(tool!=='select')return;const p=toDoc(e.clientX,e.clientY);const hit=pickAt(p.x,p.y);if(!hit||hit.locked)return;
  if(hit.type==='text'){drag=null;sel=[hit.id];selChanged();editText(hit)}
  else if(hit.type==='image'){cropMode=cropMode===hit.id?null:hit.id;toast(cropMode?'Crop: drag the image inside its frame. Double-click again to finish.':'Crop finished');renderUI()}
});
uiEl.addEventListener('contextmenu',e=>e.preventDefault());
window.addEventListener('resize',()=>{render();posTE()});
if(window.ResizeObserver)new ResizeObserver(()=>{if(!userView&&$('#work').clientWidth)fit();else render()}).observe($('#work'));

/* ---------- image intake ---------- */
function fileToDataURL(f){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(f)})}
async function ingestImage(f){
  try{
    let url=await fileToDataURL(f);
    const img=new Image();img.src=url;await img.decode();
    let nw=img.naturalWidth||800,nh=img.naturalHeight||600;
    if(f.type!=='image/svg+xml'&&(Math.max(nw,nh)>2600||f.size>3e6)){const sc=Math.min(1,2600/Math.max(nw,nh));const c=document.createElement('canvas');c.width=Math.round(nw*sc);c.height=Math.round(nh*sc);c.getContext('2d').drawImage(img,0,0,c.width,c.height);url=c.toDataURL(f.type==='image/jpeg'?'image/jpeg':'image/webp',.9);nw=c.width;nh=c.height}
    if(f.type==='image/svg+xml'&&(!img.naturalWidth||nw<10)){nw=800;nh=800}
    const id='a_'+uid();D.assets[id]=url;(D.uploads||(D.uploads=[])).push(id);return {id,nw,nh};
  }catch(e){toast('Could not read that image');return null}
}
function addImageAsset(a,pos){const o=mkImage(a.id,a.nw,a.nh);if(pos){o.x=pos.x;o.y=pos.y}const empty=selObjs().find(s=>s.type==='image'&&!s.src);if(empty){empty.src=a.id;touch();renderInsp();renderPanel();return}addObj(o);renderPanel()}
async function addImageFile(f){const a=await ingestImage(f);if(a)addImageAsset(a)}

/* ---------- popovers ---------- */
let popAnchor=null;
function closePop(){const p=$('#pop');if(p){p.remove();popAnchor=null}}
function showPop(anchor,content,width){
  closePop();const p=el('div',{id:'pop',role:'dialog'});if(width)p.style.width=width+'px';p.append(...[].concat(content));document.body.append(p);popAnchor=anchor;
  const r=anchor.getBoundingClientRect(),pw=p.offsetWidth,ph=p.offsetHeight;
  let x=r.left-pw-10;if(x<8)x=Math.min(r.left,innerWidth-pw-8);let y=r.top;if(y+ph>innerHeight-8)y=Math.max(8,innerHeight-ph-8);
  if(innerWidth<=900){x=Math.max(8,(innerWidth-pw)/2);y=Math.max(8,innerHeight-ph-80)}
  p.style.left=Math.max(8,x)+'px';p.style.top=y+'px';return p;
}
document.addEventListener('pointerdown',e=>{const p=$('#pop');if(p&&!p.contains(e.target)&&!(popAnchor&&popAnchor.contains(e.target)))closePop()},true);
function docColors(){const set=new Set();const walk=os=>os.forEach(o=>{[o.fill,o.stroke,o.color,o.fxc,o.fg,o.bgc].forEach(c=>{if(typeof c==='string'&&c[0]==='#')set.add(c.toLowerCase());else if(c&&c.c1){set.add(c.c1.toLowerCase());set.add(c.c2.toLowerCase())}});if(o.kids)walk(o.kids)});D.pages.forEach(p=>{walk(p.objs);if(p.bg&&p.bg.c)set.add(p.bg.c.toLowerCase())});return [...set].slice(0,16)}
function swatchRow(title,cols,pick){if(!cols.length)return null;return el('div',{},el('h4',{class:'sh'},title),el('div',{class:'swatches'},cols.map(c=>el('button',{class:'sw',style:`background:${c}`,title:c,'aria-label':c,onclick:()=>pick(c)}))))}
function openColor(anchor,value,onPick,{none=false}={}){
  const v0=typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value)?value:'#e8590c';
  const nat=el('input',{type:'color',value:v0,style:'width:100%;height:38px;border:0;padding:0;background:none;cursor:pointer','aria-label':'Pick color'});
  const hex=el('input',{class:'f',value:v0,maxlength:7,'aria-label':'Hex color'});
  const apply=c=>{nat.value=c;hex.value=c;onPick(c)};
  nat.addEventListener('input',()=>{hex.value=nat.value;onPick(nat.value)});
  hex.addEventListener('input',()=>{let t=hex.value.trim();if(/^[0-9a-f]{6}$/i.test(t))t='#'+t;if(/^#[0-9a-f]{6}$/i.test(t)){nat.value=t;onPick(t)}});
  const parts=[nat,el('div',{class:'row'},hex,window.EyeDropper?el('button',{class:'btn sm',title:'Pick from screen',html:ic('pick',16),onclick:async()=>{try{const r=await new EyeDropper().open();apply(r.sRGBHex)}catch(e){}}}):null)];
  if(none)parts.push(el('button',{class:'btn sm',onclick:()=>{onPick(null);closePop()}},'No color'));
  parts.push(swatchRow('Brand kit',brand.colors,apply),swatchRow('In this design',docColors(),apply),swatchRow('Palette',SWATCH,apply));
  showPop(anchor,parts.filter(Boolean));
}
function openFontPop(anchor,current,pick){
  const q=el('input',{class:'f',placeholder:'Search fonts',type:'search','aria-label':'Search fonts'});
  const list=el('div',{class:'fontlist'});
  const draw=()=>{list.innerHTML='';FONTS.filter(f=>f.toLowerCase().includes(q.value.toLowerCase())).forEach(f=>list.append(el('button',{style:`font-family:"${f}",sans-serif`,'aria-pressed':f===current,onclick:()=>{pick(f);closePop()}},f)))};
  q.addEventListener('input',draw);draw();showPop(anchor,[q,list],270);setTimeout(()=>q.focus(),0);
}

/* ---------- inspector kit ---------- */
const each=(fn,types)=>{selObjs().forEach(o=>{if(!types||types.includes(o.type))fn(o)});touch();syncPos()};
const first=(types)=>selObjs().find(o=>!types||types.includes(o.type));
function sec(title,...kids){return el('div',{class:'sec'},title?el('h4',{},title):null,...kids)}
function row(label,ctl){return el('div',{class:'row'},label?el('label',{},label):null,el('div',{class:'grow'},ctl))}
function seg(items,get,set){
  const d=el('div',{class:'seg',role:'group'});
  const draw=()=>{d.innerHTML='';items.forEach(it=>d.append(el('button',{title:it.t||it.l||'','aria-label':it.t||it.l||'','aria-pressed':get()===it.v,html:it.i?ic(it.i,16):null,onclick:()=>{set(it.v);draw()}},it.i?null:it.l)))};
  draw();return d;
}
function toggleBtn(icon,title,get,set){const b=el('button',{class:'btn sm',title,'aria-label':title,'aria-pressed':!!get(),html:ic(icon,16),style:'padding:6px 8px'});const paint=()=>{b.style.background=get()?'var(--accent-soft)':'';b.style.color=get()?'var(--accent)':'';b.style.borderColor=get()?'var(--accent)':''};paint();b.onclick=()=>{set(!get());paint()};return b}
function nfield(get,set,{min=-1e5,max=1e5,step=1,unit='',pos,sz}={}){
  const i=el('input',{type:'number',min,max,step,value:Math.round(get()*10)/10,'data-pos':pos,'data-sz':sz,'aria-label':pos||'value'});
  i.addEventListener('input',()=>{const v=parseFloat(i.value);if(isFinite(v))set(clamp(v,min,max))});
  return el('div',{class:'nf'},unit?el('span',{},unit):null,i);
}
function slider(label,get,set,{min=0,max=100,step=1,suffix=''}={}){
  const out=el('span',{style:'width:42px;text-align:right;color:var(--mut);font-variant-numeric:tabular-nums;font-size:12px'},Math.round(get()*100)/100+suffix);
  const r=el('input',{type:'range',min,max,step,value:get(),'aria-label':label});
  r.addEventListener('input',()=>{const v=parseFloat(r.value);set(v);out.textContent=Math.round(v*100)/100+suffix});
  return el('div',{class:'row'},el('label',{},label),el('div',{class:'grow'},r),out);
}
function colorBtn(get,set,opt={}){
  const b=el('button',{class:'sw',title:'Color','aria-label':'Choose color'});
  const paintSw=()=>{const v=get();b.style.background=!v?'':typeof v==='string'?v:`linear-gradient(135deg,${v.c1},${v.c2})`;b.classList.toggle('none',!v)};
  paintSw();b.onclick=()=>openColor(b,get(),v=>{set(v);paintSw()},opt);return b;
}
function fillEditor(get,set,{none=true,grad=true,label='Fill'}={}){
  const wrap=el('div',{class:'sec'});
  const draw=()=>{wrap.innerHTML='';const v=get();const mode=!v?'none':typeof v==='string'?'solid':'grad';
    const items=[{v:'solid',l:'Solid'}];if(grad)items.push({v:'grad',l:'Gradient'});if(none)items.push({v:'none',l:'None'});
    const c1=typeof v==='string'?v:(v&&v.c1)||'#e8590c';
    wrap.append(el('div',{class:'row'},el('label',{},label),seg(items,()=>mode,m=>{set(m==='none'?null:m==='solid'?c1:{t:'lin',c1,c2:'#7048e8',a:135});draw()})));
    if(mode==='solid')wrap.append(el('div',{class:'row'},el('label',{}),colorBtn(get,set)));
    if(mode==='grad'){
      wrap.append(el('div',{class:'row'},el('label',{}),colorBtn(()=>get().c1,c=>set({...get(),c1:c})),colorBtn(()=>get().c2,c=>set({...get(),c2:c})),seg([{v:'lin',l:'Linear'},{v:'rad',l:'Radial'}],()=>get().t,t=>set({...get(),t}))));
      wrap.append(slider('Angle',()=>get().a||0,a=>set({...get(),a}),{min:0,max:360,suffix:'°'}));
      wrap.append(el('div',{class:'swatches'},GRADS.map(g=>el('button',{class:'sw',style:`background:linear-gradient(135deg,${g[0]},${g[1]})`,title:'Preset','aria-label':'Gradient preset',onclick:()=>{set({t:'lin',c1:g[0],c2:g[1],a:g[2]});draw()}}))));
    }
  };
  draw();return wrap;
}
const imgInput=el('input',{type:'file',accept:'image/*',multiple:true,hidden:true,id:'fileIn'});document.body.append(imgInput);
let fileMode='add';
imgInput.addEventListener('change',async()=>{const fs=[...imgInput.files];imgInput.value='';
  for(const f of fs){const a=await ingestImage(f);if(!a)continue;
    if(fileMode==='replace'){const o=first(['image']);if(o){o.src=a.id;touch();renderInsp()}}
    else if(fileMode==='bg'){P().bg={t:'img',src:a.id,c:'#fff'};touch();renderInsp()}
    else if(fileMode==='logo'){brand.logo=a.id;renderPanel()}
    else addImageAsset(a)}
  if(fileMode==='add')renderPanel();});
function pickFile(mode){fileMode=mode;imgInput.click()}

/* ---------- inspector ---------- */
let ratioLock=true;
function renderInsp(){
  const b=$('#inspBody');if(!b)return;const keepScroll=$('#insp').scrollTop;b.innerHTML='';
  const so=selObjs();
  if(!so.length){b.append(...pageInsp());return}
  const types=new Set(so.map(o=>o.type)),one=so.length===1?so[0]:null;
  b.append(el('div',{class:'row'},el('h3',{class:'ph',style:'flex:1'},one?typeName(one):so.length+' selected'),el('button',{class:'btn sm',onclick:()=>{sel=[];selChanged()}},'Done')));
  if(types.has('text'))b.append(...textInsp());
  if(types.has('shape'))b.append(...shapeInsp());
  if(types.has('image'))b.append(...imageInsp(),...(one&&one.type==='image'?[bgInsp(one)]:[]));
  if(types.has('path'))b.append(sec('Stroke',row('Color',colorBtn(()=>first(['path']).stroke,c=>each(o=>o.stroke=c,['path']))),slider('Opacity',()=>(first(['path']).op??1)*100,v=>each(o=>o.op=v/100,['path']),{min:5,max:100,suffix:'%'})));
  if(types.has('qr'))b.append(...qrInsp());
  if(types.has('chart'))b.append(...chartInsp());
  if(types.has('table'))b.append(...tableInsp());
  if(types.has('group'))b.append(sec('Group',el('button',{class:'btn wide',onclick:ungroupSel,html:ic('ungroup',16)+' Ungroup'})));
  b.append(...commonInsp(so),animInsp(so));
  $('#insp').scrollTop=keepScroll;
}
const typeName=o=>({text:'Text',shape:o.kind==='line'?'Line':'Shape',image:o.src?'Image':'Image frame',path:'Drawing',qr:'QR code',chart:'Chart',table:'Table',group:'Group'}[o.type]||'Element');

function textInsp(){
  const T=['text'],o=first(T);const out=[];
  const fontBtn=el('button',{class:'f',style:`text-align:left;font-family:"${o.font}",sans-serif;font-size:15px`,onclick:()=>openFontPop(fontBtn,first(T).font,f=>{each(x=>x.font=f,T);fontBtn.textContent=f;fontBtn.style.fontFamily=`"${f}"`})},o.font);
  const sizeIn=nfield(()=>first(T).size,v=>each(x=>x.size=v,T),{min:4,max:1200,sz:1});
  out.push(sec('Text',
    el('button',{class:'btn wide',html:ic('text',16)+' Edit text',onclick:()=>editText(o)}),
    fontBtn,
    el('div',{class:'row'},el('label',{},'Size'),el('button',{class:'btn sm',html:ic('minus',14),'aria-label':'Smaller',onclick:()=>{each(x=>x.size=Math.max(4,Math.round(x.size*.9)),T);renderInsp()}}),sizeIn,el('button',{class:'btn sm',html:ic('plus',14),'aria-label':'Larger',onclick:()=>{each(x=>x.size=Math.round(x.size*1.1),T);renderInsp()}})),
    el('div',{class:'row',style:'flex-wrap:wrap'},toggleBtn('bold','Bold',()=>first(T).bold,v=>each(x=>x.bold=v,T)),toggleBtn('italic','Italic',()=>first(T).italic,v=>each(x=>x.italic=v,T)),toggleBtn('underline','Underline',()=>first(T).ul,v=>each(x=>x.ul=v,T)),toggleBtn('strike','Strikethrough',()=>first(T).st,v=>each(x=>x.st=v,T)),el('button',{class:'btn sm',title:'UPPERCASE','aria-pressed':!!o.upper,style:'padding:6px 8px;'+(o.upper?'background:var(--accent-soft);color:var(--accent);border-color:var(--accent)':''),onclick:e=>{const v=!first(T).upper;each(x=>x.upper=v,T);e.currentTarget.style.cssText='padding:6px 8px;'+(v?'background:var(--accent-soft);color:var(--accent);border-color:var(--accent)':'')}},'Aa')),
    el('div',{class:'row'},seg([{v:'left',i:'alignL',t:'Align left'},{v:'center',i:'alignC',t:'Center'},{v:'right',i:'alignR',t:'Align right'}],()=>first(T).align,v=>each(x=>x.align=v,T)),seg([{v:'none',l:'—',t:'No list'},{v:'bullet',i:'list',t:'Bullets'},{v:'num',i:'listnum',t:'Numbered'}],()=>first(T).list||'none',v=>each(x=>x.list=v,T))),
    fillEditor(()=>first(T).color,v=>each(x=>x.color=v||'#000',T),{none:false,label:'Color'}),
    slider('Spacing',()=>first(T).ls||0,v=>each(x=>x.ls=v,T),{min:-20,max:100}),
    slider('Line height',()=>first(T).lh||1.2,v=>each(x=>x.lh=v,T),{min:.7,max:3,step:.05}),
    slider('Curve',()=>first(T).curve||0,v=>each(x=>x.curve=v,T),{min:-100,max:100}),
    (brand.head||brand.body)?el('div',{class:'row'},el('button',{class:'btn sm grow',onclick:()=>{each(x=>x.font=brand.head,T);renderInsp()}},'Brand heading font'),el('button',{class:'btn sm grow',onclick:()=>{each(x=>x.font=brand.body,T);renderInsp()}},'Brand body font')):null));
  const fxs=[['none','None'],['shadow','Shadow'],['lift','Lift'],['hollow','Hollow'],['outline','Outline'],['splice','Splice'],['neon','Neon'],['echo','Echo'],['glitch','Glitch'],['background','Highlight']];
  const fxBox=sec('Effects');
  const drawFx=()=>{fxBox.innerHTML='';fxBox.append(el('h4',{},'Effects'),el('div',{class:'chips'},fxs.map(([v,l])=>el('button',{class:'chip','aria-pressed':(first(T).fx||'none')===v,onclick:()=>{each(x=>x.fx=v,T);drawFx()}},l))));
    const f=first(T).fx;if(['outline','splice','neon','echo','background','hollow'].includes(f))fxBox.append(row('Effect color',colorBtn(()=>first(T).fxc,c=>each(x=>x.fxc=c||'#000',T))));
    if(['shadow','lift','outline','splice','neon','echo','glitch'].includes(f))fxBox.append(slider('Intensity',()=>first(T).fxv??50,v=>each(x=>x.fxv=v,T),{min:5,max:100}))};
  drawFx();out.push(fxBox);return out;
}
function shapeInsp(){
  const S=['shape'],o=first(S),out=[];
  if(o.kind==='line'){
    out.push(sec('Line',row('Color',colorBtn(()=>first(S).stroke,c=>each(x=>x.stroke=c||'#000',S))),slider('Weight',()=>first(S).sw,v=>each(x=>x.sw=v,S),{min:1,max:80}),
      row('Style',seg([{v:'solid',l:'Solid'},{v:'dash',l:'Dashed'},{v:'dot',l:'Dotted'}],()=>first(S).dash||'solid',v=>each(x=>x.dash=v,S))),
      row('Start',seg([{v:'none',l:'None'},{v:'arrow',l:'Arrow'},{v:'dot',l:'Dot'},{v:'bar',l:'Bar'}],()=>first(S).a0||'none',v=>each(x=>x.a0=v,S))),
      row('End',seg([{v:'none',l:'None'},{v:'arrow',l:'Arrow'},{v:'dot',l:'Dot'},{v:'bar',l:'Bar'}],()=>first(S).a1||'none',v=>each(x=>x.a1=v,S)))));
    return out}
  out.push(sec('Shape',fillEditor(()=>first(S).fill,v=>each(x=>x.fill=v,S),{label:'Fill'}),
    row('Border',colorBtn(()=>first(S).stroke,c=>each(x=>{x.stroke=c||'#000';if(!x.sw)x.sw=4},S))),
    slider('Border width',()=>first(S).sw||0,v=>each(x=>x.sw=v,S),{min:0,max:60}),
    row('Border style',seg([{v:'solid',l:'Solid'},{v:'dash',l:'Dashed'},{v:'dot',l:'Dotted'}],()=>first(S).dash||'solid',v=>each(x=>x.dash=v,S))),
    o.kind==='rect'?slider('Corners',()=>first(S).r||0,v=>each(x=>x.r=v,S),{min:0,max:Math.round(Math.min(o.w,o.h)/2)||200}):null));
  return out;
}
function imageInsp(){
  const I=['image'],o=first(I),out=[];
  const fl=(k)=>()=>(first(I).flt||{})[k]||0,setf=(k)=>v=>each(x=>{(x.flt||(x.flt={}))[k]=v},I);
  out.push(sec('Image',el('div',{class:'row'},el('button',{class:'btn grow',html:ic('upload',16)+(o.src?' Replace':' Add image'),onclick:()=>pickFile('replace')}),el('button',{class:'btn grow',html:ic('crop',16)+' Crop',onclick:()=>{cropMode=cropMode===o.id?null:o.id;toast(cropMode?'Drag the image inside its frame, or use Zoom':'Crop finished');renderUI()}})),
    slider('Zoom',()=>first(I).z||1,v=>each(x=>x.z=v,I),{min:1,max:4,step:.01}),
    el('div',{class:'row'},seg([{v:'cover',l:'Fill'},{v:'contain',l:'Fit'}],()=>first(I).fit||'cover',v=>each(x=>x.fit=v,I)),el('button',{class:'btn sm',onclick:()=>each(x=>{x.ox=0;x.oy=0;x.z=1},I)},'Reset position'))));
  out.push(sec('Filters',el('div',{class:'chips'},Object.keys(FILTERS).map(k=>el('button',{class:'chip','aria-pressed':(first(I).fp||'none')===k,onclick:e=>{each(x=>x.fp=k,I);$$('.chip',e.currentTarget.parentNode).forEach(c=>c.setAttribute('aria-pressed',c===e.currentTarget))}},k[0].toUpperCase()+k.slice(1)))),
    slider('Intensity',()=>first(I).fpv??100,v=>each(x=>x.fpv=v,I),{min:0,max:100,suffix:'%'}),
    slider('Brightness',fl('b'),setf('b'),{min:-80,max:80}),slider('Contrast',fl('c'),setf('c'),{min:-80,max:80}),slider('Saturation',fl('s'),setf('s'),{min:-100,max:150}),slider('Hue',fl('h'),setf('h'),{min:-180,max:180}),slider('Blur',fl('bl'),setf('bl'),{min:0,max:30,step:.5}),
    slider('Vignette',()=>first(I).vig||0,v=>each(x=>x.vig=v,I),{min:0,max:90}),
    el('div',{class:'row'},el('label',{},'Tint'),colorBtn(()=>first(I).tint||'#e8590c',c=>each(x=>{x.tint=c;if(!x.tintv)x.tintv=30},I)),el('div',{class:'grow'},slider('',()=>first(I).tintv||0,v=>each(x=>x.tintv=v,I),{min:0,max:100}).querySelector('input'))),
    el('button',{class:'btn sm',onclick:()=>{each(x=>{x.flt={};x.fp='none';x.vig=0;x.tintv=0},I);renderInsp()}},'Reset filters')));
  const masks=[['none','None'],['rect','Rounded'],['ellipse','Circle'],['diamond','Diamond'],['tri','Triangle'],['hex','Hexagon'],['star','Star'],['heart','Heart'],['blob','Blob'],['cloud','Cloud']];
  out.push(sec('Frame & border',el('div',{class:'chips'},masks.map(([v,l])=>el('button',{class:'chip','aria-pressed':(first(I).mask||'none')===v,onclick:e=>{each(x=>{x.mask=v;if(v==='rect'&&!x.r)x.r=Math.min(x.w,x.h)*.1},I);$$('.chip',e.currentTarget.parentNode).forEach(c=>c.setAttribute('aria-pressed',c===e.currentTarget))}},l))),
    slider('Corners',()=>first(I).r||0,v=>each(x=>{x.r=v;if(!x.mask||x.mask==='none')x.mask=v?'rect':'none'},I),{min:0,max:Math.round(Math.min(o.w,o.h)/2)||200}),
    row('Border',colorBtn(()=>first(I).stroke,c=>each(x=>{x.stroke=c||'#fff';if(!x.sw)x.sw=8},I))),slider('Border width',()=>first(I).sw||0,v=>each(x=>x.sw=v,I),{min:0,max:60})));
  return out;
}
function qrInsp(){const Q=['qr'];const ta=el('textarea',{class:'f',rows:3,'aria-label':'QR content'});ta.value=first(Q).data||'';ta.addEventListener('input',()=>each(x=>x.data=ta.value,Q));
  return [sec('QR code',el('label',{class:'note'},'Link or text'),ta,row('Color',colorBtn(()=>first(Q).fg,c=>each(x=>x.fg=c||'#000',Q))),row('Background',colorBtn(()=>first(Q).bgc,c=>each(x=>x.bgc=c,Q),{none:true})),row('Style',seg([{v:false,l:'Squares'},{v:true,l:'Dots'}],()=>!!first(Q).dots,v=>each(x=>x.dots=v,Q))),row('Accuracy',seg([{v:'L',l:'L'},{v:'M',l:'M'},{v:'Q',l:'Q'},{v:'H',l:'H'}],()=>first(Q).ec||'M',v=>each(x=>x.ec=v,Q))))]}
function chartInsp(){const C=['chart'],o=first(C);const ta=el('textarea',{class:'f',rows:6,'aria-label':'Chart data'});ta.value=o.dtext||'';ta.addEventListener('input',()=>each(x=>x.dtext=ta.value,C));
  return [sec('Chart',row('Type',seg([{v:'bar',l:'Bar'},{v:'line',l:'Line'},{v:'pie',l:'Pie'},{v:'donut',l:'Donut'}],()=>first(C).kind,v=>each(x=>x.kind=v,C))),el('label',{class:'note'},'Data — one "label, value" per line'),ta,
    el('div',{class:'row'},el('label',{},'Colors'),el('div',{class:'swatches'},(o.pal||CHART_PAL).slice(0,6).map((c,i)=>colorBtn(()=>(first(C).pal||CHART_PAL)[i],v=>each(x=>{x.pal=[...(x.pal||CHART_PAL)];x.pal[i]=v||'#999'},C))))),
    row('Bar colors',seg([{v:false,l:'One'},{v:true,l:'Each'}],()=>!!first(C).multi,v=>each(x=>x.multi=v,C))),row('Text',colorBtn(()=>first(C).tc||'#333',c=>each(x=>x.tc=c||'#333',C))),row('Background',colorBtn(()=>first(C).bgc,c=>each(x=>x.bgc=c,C),{none:true})))]}
function tableInsp(){const Tb=['table'],o=first(Tb);const ta=el('textarea',{class:'f',rows:6,'aria-label':'Table cells'});ta.value=o.rows.map(r=>r.join(', ')).join('\n');
  ta.addEventListener('input',()=>{const rows=ta.value.split('\n').map(l=>l.split(',').map(s=>s.trim()));const C=Math.max(1,...rows.map(r=>r.length));rows.forEach(r=>{while(r.length<C)r.push('')});each(x=>{x.rows=rows;x.h=Math.max(rows.length,1)*(x.size||26)*2.2},Tb)});
  return [sec('Table',el('label',{class:'note'},'Cells — comma separated, one row per line'),ta,slider('Text size',()=>first(Tb).size||26,v=>each(x=>x.size=v,Tb),{min:10,max:80}),row('Header',seg([{v:true,l:'On'},{v:false,l:'Off'}],()=>!!first(Tb).hdr,v=>each(x=>x.hdr=v,Tb))),row('Header color',colorBtn(()=>first(Tb).c1,c=>each(x=>x.c1=c||'#000',Tb))),row('Stripes',seg([{v:true,l:'On'},{v:false,l:'Off'}],()=>!!first(Tb).band,v=>each(x=>x.band=v,Tb))),row('Border',colorBtn(()=>first(Tb).bc,c=>each(x=>x.bc=c||'#ccc',Tb))))]}

function commonInsp(so){
  const one=so.length===1?so[0]:null,out=[];
  if(one){
    const setW=v=>{const k=one.h?v/one.w:1;one.w=v;if(one.type==='text')layoutText(one);else if(ratioLock&&one.h&&one.kind!=='line')one.h*=k;touch();syncPos()};
    const setH=v=>{if(one.type==='text'||one.kind==='line')return;const k=v/one.h;one.h=v;if(ratioLock)one.w*=k;touch();syncPos()};
    out.push(sec('Position',el('div',{class:'row2'},row('X',nfield(()=>one.x,v=>{one.x=v;touch()},{pos:'x'})),row('Y',nfield(()=>one.y,v=>{one.y=v;touch()},{pos:'y'}))),
      el('div',{class:'row2'},row('W',nfield(()=>one.w,setW,{pos:'w',min:1})),row('H',nfield(()=>one.h,setH,{pos:'h',min:1}))),
      el('div',{class:'row'},row('Angle',nfield(()=>one.rot||0,v=>{one.rot=v;touch()},{pos:'rot',min:-360,max:360})),toggleBtn('lock','Keep proportions',()=>ratioLock,v=>ratioLock=v))));
  }
  out.push(sec('Arrange',el('div',{class:'row',style:'flex-wrap:wrap'},
    ...[['fwd','Forward','fwd'],['back','Backward','bwd'],['top','To front','front'],['bottom','To back','back']].map(([i,t,k])=>el('button',{class:'btn sm',title:t,'aria-label':t,html:ic(i,16),onclick:()=>order(k)})),
    el('button',{class:'btn sm',title:'Flip horizontal','aria-label':'Flip horizontal',html:ic('flipH',16),onclick:()=>{each(o=>o.fx_=!o.fx_)}}),el('button',{class:'btn sm',title:'Flip vertical','aria-label':'Flip vertical',html:ic('flipV',16),onclick:()=>{each(o=>o.fy_=!o.fy_)}})),
    el('div',{class:'row',style:'flex-wrap:wrap'},...[['aL','Align left','l'],['aC','Align center','c'],['aR','Align right','r'],['aT','Align top','t'],['aM','Align middle','m'],['aB','Align bottom','b']].map(([i,t,k])=>el('button',{class:'btn sm',title:t+(so.length>1?' (to each other)':' (to page)'),'aria-label':t,html:ic(i,16),onclick:()=>alignSel(k)}))),
    so.length>2?el('div',{class:'row'},el('button',{class:'btn sm grow',html:ic('dH',16)+' Space across',onclick:()=>distSel('h')}),el('button',{class:'btn sm grow',html:ic('dV',16)+' Space down',onclick:()=>distSel('v')})):null,
    so.length>1?el('button',{class:'btn wide',html:ic('group',16)+' Group',onclick:groupSel}):null));
  const sh0=()=>first().shadow||(first().shadow={on:false,c:'#000000',b:20,x:0,y:10});
  const shBox=sec('Shadow & opacity');
  const drawSh=()=>{shBox.innerHTML='';shBox.append(el('h4',{},'Shadow & opacity'),slider('Opacity',()=>(first().op??1)*100,v=>each(o=>o.op=v/100),{min:0,max:100,suffix:'%'}),
    row('Shadow',seg([{v:true,l:'On'},{v:false,l:'Off'}],()=>!!(first().shadow&&first().shadow.on),v=>{each(o=>{o.shadow=o.shadow||{on:false,c:'#00000066',b:20,x:0,y:10};o.shadow.on=v});drawSh()})));
    if(first().shadow&&first().shadow.on){const g=k=>()=>first().shadow[k],s=k=>v=>each(o=>{o.shadow[k]=v});shBox.append(slider('Blur',g('b'),s('b'),{min:0,max:100}),slider('X offset',g('x'),s('x'),{min:-80,max:80}),slider('Y offset',g('y'),s('y'),{min:-80,max:80}),row('Color',colorBtn(g('c'),c=>each(o=>o.shadow.c=c||'#000')))); }};
  drawSh();out.push(shBox);
  out.push(sec('',el('div',{class:'row'},el('button',{class:'btn grow',html:ic('copy',16)+' Duplicate',onclick:dupSel}),el('button',{class:'btn grow',html:ic(so.every(o=>o.locked)?'lock':'unlock',16)+(so.every(o=>o.locked)?' Unlock':' Lock'),onclick:()=>{const v=!so.every(o=>o.locked);so.forEach(o=>o.locked=v);touch();selChanged()}})),el('button',{class:'btn wide danger',html:ic('trash',16)+' Delete',onclick:removeSel})));
  return out;
}

/* ---------- page inspector (nothing selected) ---------- */
function pageInsp(){
  const out=[];const pg=P();
  out.push(el('h3',{class:'ph'},'Page '+(cur+1)+' of '+D.pages.length));
  const bgBox=sec('Background');
  const drawBg2=()=>{bgBox.innerHTML='';bgBox.append(el('h4',{},'Background'));
    if(pg.bg.t==='solid'||pg.bg.t==='grad'){bgBox.append(fillEditor(()=>pg.bg.t==='solid'?pg.bg.c:{t:pg.bg.k||'lin',c1:pg.bg.c1,c2:pg.bg.c2,a:pg.bg.a},v=>{if(!v)pg.bg={t:'solid',c:'transparent'};else if(typeof v==='string')pg.bg={t:'solid',c:v};else pg.bg={t:'grad',k:v.t,c1:v.c1,c2:v.c2,a:v.a};touch()},{none:false,label:'Color'}))}
    else bgBox.append(el('p',{class:'note'},pg.bg.t==='img'?'Image background':'Pattern background'));
    bgBox.append(el('div',{class:'row'},el('button',{class:'btn sm grow',onclick:()=>{pg.bg={t:'solid',c:'#ffffff'};touch();renderInsp()}},'Reset'),el('button',{class:'btn sm grow',onclick:()=>openTab('bg')},'More backgrounds')),
      el('button',{class:'btn sm wide',onclick:()=>{D.pages.forEach(p=>p.bg=JSON.parse(JSON.stringify(pg.bg)));touch();toast('Applied to all pages')}},'Apply to all pages'))};
  drawBg2();out.push(bgBox);
  const cw=nfield(()=>D.w,()=>{},{min:20,max:8000}),ch=nfield(()=>D.h,()=>{},{min:20,max:8000});
  const wi=$('input',cw),hi_=$('input',ch);
  const dd=el('select',{class:'f','aria-label':'Size preset'},el('option',{value:''},'Choose a size…'),SIZES.map((s,i)=>el('option',{value:i},`${s.n} — ${s.w}×${s.h}`)));
  dd.onchange=()=>{if(dd.value!==''){wi.value=SIZES[dd.value].w;hi_.value=SIZES[dd.value].h}};
  out.push(sec('Canvas size',el('div',{class:'row2'},row('W',cw),row('H',ch)),dd,
    el('button',{class:'btn pri wide',html:ic('sparkle',16)+' Magic resize',title:'Scale every element to the new size',onclick:()=>resizeDoc(+wi.value,+hi_.value,'magic')}),
    el('button',{class:'btn wide',onclick:()=>resizeDoc(+wi.value,+hi_.value,'canvas')},'Change canvas only'),
    el('p',{class:'note'},'Magic resize rescales and re-centres everything on every page.')));
  out.push(sec('Page',el('div',{class:'row'},el('button',{class:'btn grow',onclick:()=>addPage()},'Add page'),el('button',{class:'btn grow',onclick:()=>dupPage(cur)},'Duplicate')),D.pages.length>1?el('button',{class:'btn wide danger',onclick:()=>delPage(cur)},'Delete page'):null));
  out.push(pageDurSec());out.push(sec('View',row('Snap guides',seg([{v:true,l:'On'},{v:false,l:'Off'}],()=>snapOn,v=>snapOn=v)),row('Grid',seg([{v:true,l:'On'},{v:false,l:'Off'}],()=>gridOn,v=>{gridOn=v;render()})),el('button',{class:'btn sm',onclick:openHelp},'Keyboard shortcuts')));
  return out;
}
function resizeDoc(nw,nh,mode){
  nw=Math.round(clamp(nw||D.w,20,8000));nh=Math.round(clamp(nh||D.h,20,8000));const ow=D.w,oh=D.h;
  if(mode==='magic'){const k=Math.min(nw/ow,nh/oh);const walk=(os)=>os.forEach(o=>{const cx=(o.x+o.w/2)/ow*nw,cy=(o.y+o.h/2)/oh*nh;o.w*=k;o.h*=k;if(o.type==='text'){o.size*=k}if(o.sw)o.sw*=k;if(o.r)o.r*=k;if(o.shadow){o.shadow.b*=k;o.shadow.x*=k;o.shadow.y*=k}if(o.type==='table')o.size=(o.size||26)*k;o.x=cx-o.w/2;o.y=cy-o.h/2});D.pages.forEach(p=>walk(p.objs))}
  D.w=nw;D.h=nh;touch();fit();renderInsp();toast('Resized to '+nw+' × '+nh);
}

/* ---------- rail & panel shell ---------- */
const TABS=[['tpl','tpl','Templates'],['el','shapes','Elements'],['text','text','Text'],['up','upload','Uploads'],['stock','image','Photos'],['draw','draw','Draw'],['bg','bg','Background'],['layers','layers','Layers'],['brand','brand','Brand'],['ai','magic','Magic']];
let tab='tpl';
function renderRail(){
  const r=$('#rail');r.innerHTML='';r.setAttribute('role','tablist');
  TABS.forEach(([k,i,l])=>r.append(el('button',{role:'tab','aria-selected':tab===k,title:l,'data-tab':k,html:ic(i,20)+`<span>${l}</span>`,onclick:()=>{if(matchMedia('(max-width:900px)').matches&&tab===k&&document.body.classList.contains('sheet-panel')){toggleSheet(null);return}openTab(k)}})));
  r.append(el('button',{class:'mob',title:'Properties','aria-label':'Properties',html:ic('props',20)+'<span>Edit</span>',onclick:()=>toggleSheet('insp')}));
}
function toggleSheet(which){const b=document.body;const was=b.classList.contains('sheet-'+which);b.classList.remove('sheet-panel','sheet-insp');if(which&&!was)b.classList.add('sheet-'+which);setTimeout(()=>{fit()},230)}
function openTab(k){
  if(tool==='draw'&&k!=='draw')setTool('select',true);
  tab=k;$$('#rail button[data-tab]').forEach(b=>b.setAttribute('aria-selected',b.dataset.tab===k));
  if(matchMedia('(max-width:900px)').matches){document.body.classList.remove('sheet-insp');document.body.classList.add('sheet-panel')}
  if(k==='draw')setTool('draw',true);
  renderPanel();
}
function setTool(t,fromTab){tool=t;ui$().style.cursor=t==='draw'?'crosshair':'default';if(t==='draw'){sel=[];selChanged()}else{penPos=null;if(tab==='draw'&&!fromTab)openTab('el')}renderUI()}
const renderLayersIfOpen=()=>{if(tab==='layers')renderPanel()};
const panelBody=()=>$('#panelBody');
function renderPanel(){
  const b=panelBody();if(!b)return;const sc=$('#panel').scrollTop;b.innerHTML='';
  ({tpl:pTemplates,el:pElements,text:pText,up:pUploads,stock:pStock,draw:pDraw,bg:pBackground,layers:pLayers,brand:pBrand,ai:pMagic})[tab](b);
  $('#panel').scrollTop=sc;
}
const searchBox=(ph,onInput)=>{const i=el('input',{class:'f',type:'search',placeholder:ph,'aria-label':ph,style:'padding-left:30px'});i.addEventListener('input',()=>onInput(i.value));return el('div',{class:'search'},el('span',{html:ic('search',16)}),i)};

/* ---------- templates ---------- */
const TX=(t,x,y,w,size,o={})=>mkText(t,Object.assign({x,y,w,size,font:'Poppins',color:'#1f1c19'},o));
const SH=(k,x,y,w,h,fill,o={})=>mkShape(k,Object.assign({x,y,w,h,fill},o));
const TEMPLATES=[
 {n:'Mega sale',c:'Social',b:(W,H,u)=>({bg:{t:'solid',c:'#e8590c'},objs:[SH('ellipse',W*.6,-H*.12,W*.62,W*.62,'#ff8a4a',{op:.5}),SH('ellipse',-W*.2,H*.62,W*.55,W*.55,'#c2410c',{op:.55}),TX('MEGA',W*.08,H*.14,W*.84,u*28,{font:'Anton',color:'#fff',lh:.95}),TX('SALE',W*.08,H*.14+u*27,W*.84,u*28,{font:'Anton',color:'#1f1c19',lh:.95}),TX('Up to 60% off everything in store',W*.08,H*.7,W*.84,u*5,{bold:true,color:'#fff'}),SH('rect',W*.08,H*.82,W*.36,u*11,'#fff',{r:u*5.5}),TX('SHOP NOW',W*.08,H*.82+u*3,W*.36,u*4.6,{bold:true,align:'center',color:'#e8590c'})]})},
 {n:'Soft quote',c:'Social',b:(W,H,u)=>({bg:{t:'solid',c:'#f4ece1'},objs:[SH('ellipse',W*.62,H*.06,u*34,u*34,'#e9d5bd'),TX('“',W*.1,H*.1,W*.3,u*40,{font:'Playfair Display',color:'#e8590c'}),TX('Make something people want to come back to.',W*.12,H*.32,W*.76,u*9.5,{font:'Playfair Display',color:'#2b2118',lh:1.25}),SH('rect',W*.12,H*.74,u*14,u*.9,'#e8590c'),TX('ANAND',W*.12,H*.78,W*.5,u*3.6,{bold:true,ls:20,color:'#6f5d4c'})]})},
 {n:'Neon night',c:'Social',b:(W,H,u)=>({bg:{t:'grad',k:'lin',c1:'#0b0420',c2:'#2a0a4a',a:160},objs:[SH('ellipse',W*.5-u*30,H*.5-u*30,u*60,u*60,'#ff2bd6',{op:.12}),TX('OPEN',0,H*.3,W,u*22,{font:'Righteous',color:'#fff',align:'center',fx:'neon',fxc:'#ff2bd6',fxv:70}),TX('ALL NIGHT',0,H*.3+u*22,W,u*13,{font:'Righteous',color:'#fff',align:'center',fx:'neon',fxc:'#00e5ff',fxv:70}),TX('Fri · Sat · 10pm — late',0,H*.78,W,u*5,{align:'center',color:'#e5d9ff',ls:12})]})},
 {n:'Clean announcement',c:'Social',b:(W,H,u)=>({bg:{t:'solid',c:'#ffffff'},objs:[SH('rect',0,0,u*3,H,'#e8590c'),TX('Announcing',W*.1,H*.2,W*.8,u*5,{color:'#e8590c',bold:true,ls:15,upper:true}),TX('Something new is coming this autumn',W*.1,H*.27,W*.8,u*10,{font:'Bricolage Grotesque',bold:true,lh:1.08}),TX('Join the waitlist and be first to know. Early members get the founding price.',W*.1,H*.72,W*.8,u*4.2,{color:'#6f685f',lh:1.4})]})},
 {n:'Photo spotlight',c:'Social',b:(W,H,u)=>({bg:{t:'solid',c:'#fde6d6'},objs:[mkImage('',400,400,{x:W*.5-u*30,y:H*.1,w:u*60,h:u*60,mask:'ellipse',sw:u*1.6,stroke:'#fff'}),SH('ellipse',W*.5-u*34,H*.1-u*4,u*68,u*68,null,{stroke:'#e8590c',sw:u*.6}),TX('Meet the maker',0,H*.7,W,u*9,{font:'DM Serif Display',align:'center'}),TX('Handmade ceramics, small batch, big heart.',W*.15,H*.82,W*.7,u*4.2,{align:'center',color:'#6f5d4c'})]})},
 {n:'Event poster',c:'Print',b:(W,H,u)=>({bg:{t:'solid',c:'#0f3d3e'},objs:[SH('ellipse',-u*20,H*.5,u*80,u*80,'#145a5b',{op:.8}),SH('ellipse',W-u*40,-u*20,u*70,u*70,'#f2c94c',{op:.9}),TX('LIVE',W*.08,H*.1,W*.5,u*7,{font:'Poppins',bold:true,color:'#f2c94c',ls:30}),TX('Summer\nJazz\nNight',W*.08,H*.17,W*.84,u*17,{font:'Abril Fatface',color:'#fff7e0',lh:1}),TX('SAT 14 JUNE · 7 PM\nThe Garden Terrace',W*.08,H*.76,W*.8,u*4.6,{color:'#f2c94c',bold:true,lh:1.5}),TX('Tickets at the door',W*.08,H*.89,W*.8,u*3.4,{color:'#b7d3d3'})]})},
 {n:'Product launch',c:'Social',b:(W,H,u)=>({bg:{t:'grad',k:'lin',c1:'#4263eb',c2:'#7048e8',a:135},objs:[SH('rect',W*.1,H*.36,W*.8,H*.5,'#ffffff',{r:u*4,shadow:{on:true,c:'#00000055',b:u*8,x:0,y:u*3}}),TX('NEW',W*.1,H*.12,W*.8,u*8,{font:'Poppins',bold:true,color:'#fff',ls:30,align:'center'}),TX('Meet Pulse',W*.1,H*.2,W*.8,u*10,{font:'Bricolage Grotesque',bold:true,color:'#fff',align:'center'}),TX('The smartest way to plan your week.',W*.16,H*.44,W*.68,u*6,{bold:true,align:'center'}),TX('Available now for iOS and Android',W*.16,H*.62,W*.68,u*4,{align:'center',color:'#6f685f'}),SH('rect',W*.3,H*.74,W*.4,u*9,'#4263eb',{r:u*4.5}),TX('Get the app',W*.3,H*.74+u*2.2,W*.4,u*4.4,{bold:true,color:'#fff',align:'center'})]})},
 {n:'Podcast cover',c:'Social',b:(W,H,u)=>({bg:{t:'solid',c:'#1f1c19'},objs:[SH('ring',W*.5-u*34,H*.5-u*34,u*68,u*68,'#e8590c'),SH('ellipse',W*.5-u*14,H*.5-u*14,u*28,u*28,'#e8590c'),TX('THE',0,H*.08,W,u*5,{align:'center',color:'#e8590c',ls:50,bold:true}),TX('Late Shift',0,H*.13,W,u*12,{font:'Bricolage Grotesque',bold:true,color:'#fff',align:'center'}),TX('Conversations after hours',0,H*.86,W,u*4,{align:'center',color:'#a39b91',ls:10})]})},
 {n:'Thank you',c:'Social',b:(W,H,u)=>({bg:{t:'solid',c:'#d0ebff'},objs:[SH('blob',-u*10,-u*10,u*55,u*50,'#ffd43b'),SH('blob2',W-u*45,H-u*50,u*60,u*55,'#ffa8a8'),SH('star',W*.72,H*.12,u*14,u*14,'#4263eb'),TX('Thank',W*.1,H*.3,W*.8,u*20,{font:'Pacifico',color:'#1c3f77'}),TX('you!',W*.1,H*.3+u*17,W*.8,u*20,{font:'Pacifico',color:'#e8590c'}),TX('Your support means the world to us.',W*.1,H*.76,W*.7,u*4.6,{color:'#1c3f77'})]})},
 {n:'Business card',c:'Print',b:(W,H,u)=>({bg:{t:'solid',c:'#fdf6e3'},objs:[SH('rect',0,0,W*.34,H,'#1f1c19'),SH('ellipse',W*.17-u*10,H*.5-u*10,u*20,u*20,'#e8590c'),TX('Anand',W*.4,H*.2,W*.55,u*10,{font:'Playfair Display',bold:true}),TX('Founder & Designer',W*.4,H*.2+u*13,W*.55,u*4.4,{color:'#e8590c',bold:true}),TX('hello@example.com\n+00 000 000 000\nexample.com',W*.4,H*.62,W*.55,u*4.2,{color:'#4a4339',lh:1.6})]})},
 {n:'Title slide',c:'Slides',b:(W,H,u)=>({bg:{t:'solid',c:'#10141f'},objs:[SH('rect',W*.07,H*.28,u*1.4,H*.36,'#e8590c'),TX('Quarterly\nBusiness Review',W*.11,H*.26,W*.8,u*14,{font:'Bricolage Grotesque',bold:true,color:'#fff',lh:1.08}),TX('Q3 2026 · Growth, product and what’s next',W*.11,H*.7,W*.7,u*4.6,{color:'#9aa4b8'}),SH('circle'==='x'?'rect':'ellipse',W*.82,H*.62,u*30,u*30,'#e8590c',{op:.18})]})},
 {n:'Agenda slide',c:'Slides',b:(W,H,u)=>({bg:{t:'solid',c:'#fdf6e3'},objs:[TX('Agenda',W*.08,H*.1,W*.5,u*12,{font:'Bricolage Grotesque',bold:true}),SH('rect',W*.08,H*.1+u*14,u*14,u*1,'#e8590c'),TX('Where we are\nWhat we learned\nWhat we’re building next\nHow you can help',W*.08,H*.38,W*.55,u*6.4,{list:'num',lh:1.7,color:'#2b2118'}),SH('rect',W*.7,0,W*.3,H,'#e8590c'),TX('01',W*.7,H*.34,W*.3,u*30,{font:'Anton',color:'#fff',align:'center'})]})},
 {n:'Flyer',c:'Print',b:(W,H,u)=>({bg:{t:'solid',c:'#ffffff'},objs:[SH('rect',0,0,W,H*.42,'#12b886'),SH('ellipse',W*.62,-u*14,u*60,u*60,'#0ca678'),TX('GRAND\nOPENING',W*.08,H*.07,W*.8,u*15,{font:'Anton',color:'#fff',lh:1}),TX('Fresh bakes. Warm coffee. Good neighbours.',W*.08,H*.5,W*.8,u*6,{bold:true,lh:1.3}),TX('Saturday 20 September · 9am–5pm\n12 Market Street',W*.08,H*.68,W*.8,u*4.6,{color:'#6f685f',lh:1.6}),SH('rect',W*.08,H*.84,W*.5,u*9,'#1f1c19',{r:u*4.5}),TX('Free coffee for the first 50',W*.08,H*.84+u*2.4,W*.5,u*4,{color:'#fff',align:'center',bold:true})]})}
];
function buildTemplate(t,W,H){const u=Math.min(W,H)/100;const r=t.b(W,H,u);r.objs.forEach(o=>{o.id=uid();if(o.type==='text')layoutText(o)});return r}
let tplCat='All';
function pTemplates(b){
  b.append(el('h3',{class:'ph'},'Templates'));
  const cats=['All','Social','Slides','Print'];
  b.append(el('div',{class:'chips'},cats.map(c=>el('button',{class:'chip','aria-pressed':tplCat===c,onclick:()=>{tplCat=c;renderPanel()}},c))));
  b.append(el('p',{class:'note'},'Applies to the current page and adapts to your canvas size.'));
  const g=el('div',{class:'grid2'});
  TEMPLATES.filter(t=>tplCat==='All'||t.c===tplCat).forEach(t=>{
    const built=buildTemplate(t,D.w,D.h);const pg={bg:built.bg,objs:built.objs};
    const sc=200/Math.max(D.w,D.h);const c=document.createElement('canvas');c.width=Math.round(D.w*sc);c.height=Math.round(D.h*sc);const ctx=c.getContext('2d');ctx.scale(sc,sc);drawPageContent(ctx,pg,D.w,D.h,{s:sc});
    g.append(el('button',{class:'tpl','aria-label':'Apply template '+t.n,onclick:()=>applyTemplate(t)},c,el('span',{},t.n)));
  });
  b.append(g);
}
function applyTemplate(t){const built=buildTemplate(t,D.w,D.h);P().bg=built.bg;P().objs=built.objs;sel=[];touch();selChanged();toast('Template applied — everything is editable')}
let fontsT=0;try{document.fonts.addEventListener('loadingdone',()=>{if(tab!=='tpl')return;clearTimeout(fontsT);fontsT=setTimeout(renderPanel,250)})}catch(e){}

/* ---------- elements ---------- */
function shapeIcon(k){return k==='rect'?'<svg viewBox="0 0 100 100"><rect x="8" y="8" width="84" height="84" rx="6" fill="currentColor"/></svg>':`<svg viewBox="-4 -4 108 108"><path d="${SP[k]}" fill="currentColor" fill-rule="evenodd"/></svg>`}
const GRAPHICS=[
 ['Badge',(u)=>[SH('burst2',0,0,u*30,u*30,brand.colors[0]),TX('NEW',0,u*10.5,u*30,u*8,{font:'Poppins',bold:true,color:'#fff',align:'center'})]],
 ['Price tag',(u)=>[SH('tag',0,0,u*34,u*20,'#ffd43b'),TX('$49',u*3,u*5,u*22,u*10,{font:'Anton',color:'#1f1c19'})]],
 ['Best seller',(u)=>[SH('para',0,0,u*44,u*11,'#1f1c19'),TX('BEST SELLER',0,u*2.7,u*44,u*4.6,{bold:true,color:'#fff',align:'center',ls:10})]],
 ['Speech',(u)=>[SH('bubble',0,0,u*38,u*26,'#ffffff',{stroke:'#1f1c19',sw:u*.8}),TX('Hello!',0,u*6,u*38,u*8,{font:'Caveat',bold:true,align:'center'})]],
 ['Wave underline',(u)=>{const pts=[];for(let i=0;i<=40;i++)pts.push([i*u*1.2,Math.sin(i/40*Math.PI*6)*u*1.4+u*2]);return [{id:uid(),type:'path',x:0,y:0,w:u*48,h:u*4,pw:u*48,ph:u*4,rot:0,pts,stroke:brand.colors[0],sw:u*1,op:1,name:'Underline'}]}],
 ['Divider',(u)=>[0,1,2].map(i=>SH('ellipse',i*u*6,0,u*3,u*3,i===1?brand.colors[0]:'#1f1c19'))],
 ['Sparkles',(u)=>[SH('star4',0,u*6,u*14,u*14,'#ffd43b'),SH('star4',u*14,0,u*8,u*8,'#ffa8a8'),SH('star4',u*20,u*12,u*6,u*6,'#74c0fc')]],
 ['Border frame',(u)=>[SH('rect',0,0,D.w-u*12,D.h-u*12,null,{stroke:brand.colors[1]||'#1f1c19',sw:u*.8,x:u*6,y:u*6})]],
 ['Circle stack',(u)=>[SH('ellipse',0,0,u*30,u*30,brand.colors[0],{op:.9}),SH('ellipse',u*14,u*8,u*30,u*30,'#4263eb',{op:.7}),SH('ellipse',u*7,u*16,u*30,u*30,'#ffd43b',{op:.7})]],
 ['Arrow doodle',(u)=>[mkLine({w:u*30,sw:u*.8,stroke:brand.colors[1]||'#1f1c19',a1:'arrow'})]]
];
function pElements(b){
  const u=unit()*10.8;
  b.append(el('h3',{class:'ph'},'Elements'));
  const q=searchBox('Search shapes & stickers',()=>{});const fq=$('input',q);
  b.append(q);
  const body=el('div',{style:'display:grid;gap:14px'});b.append(body);
  const draw=()=>{body.innerHTML='';const s=fq.value.toLowerCase();
    const shp=SHAPE_LIST.filter(([k,n])=>!s||n.toLowerCase().includes(s));
    if(shp.length)body.append(el('div',{},el('h4',{class:'sh'},'Shapes'),el('div',{class:'grid5'},shp.map(([k,n])=>el('button',{class:'cell',title:n,'aria-label':n,html:shapeIcon(k),onclick:()=>addObj(mkShape(k,k==='ring'||k==='check'?{}:{}))})))));
    if(!s||'line arrow'.includes(s))body.append(el('div',{},el('h4',{class:'sh'},'Lines'),el('div',{class:'grid4'},[['solid','none','none'],['dash','none','none'],['solid','none','arrow'],['solid','dot','arrow']].map(([d,a0,a1])=>el('button',{class:'cell',style:'aspect-ratio:2/1',title:'Line','aria-label':'Line',html:`<svg viewBox="0 0 60 20"><line x1="${a0==='dot'?10:4}" y1="10" x2="${a1==='arrow'?48:56}" y2="10" stroke="currentColor" stroke-width="3" ${d==='dash'?'stroke-dasharray="7 5"':''}/>${a1==='arrow'?'<path d="M46 3l10 7-10 7z" fill="currentColor"/>':''}${a0==='dot'?'<circle cx="6" cy="10" r="3" fill="currentColor"/>':''}</svg>`,onclick:()=>addObj(mkLine({dash:d,a0,a1}))})))));
    if(!s||'frame photo'.includes(s))body.append(el('div',{},el('h4',{class:'sh'},'Photo frames'),el('div',{class:'grid4'},['none','rect','ellipse','heart','star','hex','blob','diamond'].map(m=>el('button',{class:'cell',title:'Frame: '+m,'aria-label':'Frame '+m,html:m==='none'?'<svg viewBox="0 0 100 100"><rect x="8" y="8" width="84" height="84" fill="none" stroke="currentColor" stroke-width="5" stroke-dasharray="9 6"/></svg>':m==='rect'?'<svg viewBox="0 0 100 100"><rect x="8" y="8" width="84" height="84" rx="14" fill="none" stroke="currentColor" stroke-width="5"/></svg>':`<svg viewBox="-4 -4 108 108"><path d="${SP[m]}" fill="none" stroke="currentColor" stroke-width="5"/></svg>`,onclick:()=>addObj(mkImage('',800,800,{w:D.w*.45,h:D.w*.45,mask:m,r:m==='rect'?60:0}))})))));
    if(!s||'graphic badge sticker'.includes(s))body.append(el('div',{},el('h4',{class:'sh'},'Graphics'),el('div',{class:'grid2'},GRAPHICS.map(([n,f])=>{const parts=f(unit()*10.8);return el('button',{class:'btn',onclick:()=>{const list=f(unit()*10.8);const g=list.length>1?makeGroup(list):list[0];if(list.length>1)g.name=n;g.x=(D.w-g.w)/2;g.y=(D.h-g.h)/2;addObj(g)}},n)}))));
    const em=el('div',{});em.append(el('h4',{class:'sh'},'Stickers'));
    for(const [cat,str] of Object.entries(EMOJI)){const arr=[...new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(str)].map(x=>x.segment);const f=arr.filter(x=>!s||cat.toLowerCase().includes(s));if(!f.length)continue;em.append(el('p',{class:'note',style:'margin:6px 0 4px'},cat),el('div',{class:'grid5'},f.map(ch=>el('button',{class:'cell em',title:ch,'aria-label':'Sticker '+ch,onclick:()=>addObj(mkText(ch,{size:Math.round(160*unit()),w:Math.round(220*unit()),align:'center',font:'Instrument Sans'}))},ch))))}
    body.append(em);
    if(!s||'chart qr table'.includes(s))body.append(el('div',{},el('h4',{class:'sh'},'Charts, QR & tables'),el('div',{class:'grid2'},
      el('button',{class:'btn',html:ic('chart',16)+' Bar chart',onclick:()=>addObj({id:uid(),type:'chart',kind:'bar',w:Math.round(640*unit()),h:Math.round(420*unit()),rot:0,dtext:'Jan, 12\nFeb, 19\nMar, 15\nApr, 27\nMay, 32',pal:null,tc:'#1f1c19',bgc:'#ffffff',op:1})}),
      el('button',{class:'btn',html:ic('chart',16)+' Line chart',onclick:()=>addObj({id:uid(),type:'chart',kind:'line',w:Math.round(640*unit()),h:Math.round(420*unit()),rot:0,dtext:'Jan, 12\nFeb, 19\nMar, 15\nApr, 27\nMay, 32',pal:null,tc:'#1f1c19',bgc:'#ffffff',op:1})}),
      el('button',{class:'btn',html:ic('chart',16)+' Pie chart',onclick:()=>addObj({id:uid(),type:'chart',kind:'pie',w:Math.round(520*unit()),h:Math.round(460*unit()),rot:0,dtext:'Design, 40\nBuild, 35\nLaunch, 25',pal:null,tc:'#1f1c19',bgc:'#ffffff',op:1})}),
      el('button',{class:'btn',html:ic('chart',16)+' Donut',onclick:()=>addObj({id:uid(),type:'chart',kind:'donut',w:Math.round(520*unit()),h:Math.round(460*unit()),rot:0,dtext:'Design, 40\nBuild, 35\nLaunch, 25',pal:null,tc:'#1f1c19',bgc:'#ffffff',op:1})}),
      el('button',{class:'btn',html:ic('qr',16)+' QR code',onclick:()=>addObj({id:uid(),type:'qr',w:Math.round(320*unit()),h:Math.round(320*unit()),rot:0,data:'https://example.com',fg:'#000000',bgc:'#ffffff',ec:'M',op:1})}),
      el('button',{class:'btn',html:ic('table',16)+' Table',onclick:()=>addObj({id:uid(),type:'table',w:Math.round(760*unit()),h:Math.round(300*unit()),rot:0,size:Math.round(30*unit()),hdr:true,band:true,c1:brand.colors[0],c2:'#f1ece4',c3:'#ffffff',tc:'#1f1c19',bc:'#cfc8bc',rows:[['Item','Qty','Price'],['Design','2','$40'],['Print','10','$25'],['Total','','$65']],op:1})}))));
  };
  fq.addEventListener('input',draw);draw();
}

/* ---------- text ---------- */
const COMBOS=[['Playfair Display','Lora','Elegant serif'],['Bebas Neue','Work Sans','Bold & clean'],['Pacifico','Nunito','Friendly script'],['Archivo Black','Instrument Sans','Punchy'],['Cormorant Garamond','Montserrat','Luxury'],['Anton','Poppins','Impact'],['DM Serif Display','Raleway','Editorial'],['Oswald','Merriweather','News']];
const FXPRESETS=[['Neon',{fx:'neon',fxc:'#ff2bd6',color:'#ffffff',bold:true,font:'Righteous'},'#0b0420'],['Hollow',{fx:'hollow',color:'#e8590c',bold:true,font:'Anton'},null],['Shadow',{fx:'shadow',color:'#1f1c19',bold:true,font:'Poppins'},null],['Outline',{fx:'outline',fxc:'#1f1c19',color:'#ffd43b',font:'Archivo Black'},null],['Splice',{fx:'splice',fxc:'#e8590c',color:'#fff',font:'Poppins',bold:true},'#1f1c19'],['Glitch',{fx:'glitch',color:'#ffffff',font:'Space Mono',bold:true},'#111'],['Highlight',{fx:'background',fxc:'#ffe066',color:'#1f1c19',font:'Poppins',bold:true},null],['Echo',{fx:'echo',fxc:'#e8590c',color:'#1f1c19',font:'Anton'},null]];
function pText(b){
  const u=unit();
  b.append(el('h3',{class:'ph'},'Text'));
  const add=(t,o)=>{addObj(mkText(t,o));editText(selObjs()[0])};
  b.append(el('div',{class:'txtp'},
    el('button',{style:`font:800 24px "${brand.head}",sans-serif`,onclick:()=>add('Add a heading',{size:Math.round(110*u),bold:true,font:brand.head,w:D.w*.8})},'Add a heading'),
    el('button',{style:`font:600 17px "${brand.head}",sans-serif`,onclick:()=>add('Add a subheading',{size:Math.round(60*u),font:brand.head,wt:600,w:D.w*.7})},'Add a subheading'),
    el('button',{style:`font:400 14px "${brand.body}",sans-serif`,onclick:()=>add('Add a little bit of body text',{size:Math.round(36*u),font:brand.body,w:D.w*.6})},'Add a little bit of body text')));
  b.append(el('div',{},el('h4',{class:'sh'},'Font combinations'),el('div',{class:'txtp'},COMBOS.map(([h,bd,n])=>el('button',{onclick:()=>{const t1=mkText('Big Idea',{font:h,size:Math.round(120*u),bold:h==='Archivo Black'||h==='Anton'?false:true,w:D.w*.8,color:brand.colors[1]||'#1f1c19'});const t2=mkText('A supporting line that sets the scene.',{font:bd,size:Math.round(40*u),w:D.w*.6,color:'#6f685f'});t1.x=(D.w-t1.w)/2;t1.y=D.h*.38;t2.x=(D.w-t2.w)/2;t2.y=D.h*.38+t1.size*1.5;addObjs([t1,t2])}},el('span',{style:`font:700 20px "${h}",serif;display:block`},'Big Idea'),el('span',{style:`font:400 12px "${bd}",sans-serif;color:var(--mut)`},n+' — '+h+' + '+bd))))));
  b.append(el('div',{},el('h4',{class:'sh'},'Text styles'),el('div',{class:'grid2'},FXPRESETS.map(([n,o,bg])=>el('button',{class:'btn',style:`font-family:"${o.font}";font-size:18px;${bg?`background:${bg};color:#fff;`:''}`,onclick:()=>add(n,Object.assign({size:Math.round(100*u),w:D.w*.7,align:'center'},o))},n)))));
  const fl=el('div',{class:'fontlist'});
  b.append(el('div',{},el('h4',{class:'sh'},'All fonts'),fl));
  FONTS.forEach(f=>fl.append(el('button',{style:`font-family:"${f}",sans-serif`,onclick:()=>{const t=selObjs().filter(o=>o.type==='text');if(t.length){t.forEach(o=>o.font=f);touch();renderInsp()}else add(f,{font:f,size:Math.round(90*u),w:D.w*.7})}},f)));
}

/* ---------- uploads ---------- */
function pUploads(b){
  b.append(el('h3',{class:'ph'},'Uploads'));
  const dz=el('div',{class:'drop'},el('span',{html:ic('upload',26)}),el('div',{},'Drop images here, paste them, or'),el('button',{class:'btn pri',onclick:()=>pickFile('add')},'Upload images'),el('span',{class:'note'},'PNG, JPG, WebP, SVG, GIF'));
  ['dragover','dragenter'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.add('over')}));dz.addEventListener('dragleave',()=>dz.classList.remove('over'));
  dz.addEventListener('drop',async e=>{e.preventDefault();dz.classList.remove('over');for(const f of [...e.dataTransfer.files].filter(f=>f.type.startsWith('image/')))await addImageFile(f)});
  b.append(dz);
  const ups=(D.uploads||[]).filter(id=>D.assets[id]);
  if(ups.length){b.append(el('h4',{class:'sh'},'Your images'),el('div',{class:'grid2'},ups.map(id=>el('div',{style:'display:grid;gap:4px'},el('button',{class:'cell',style:'aspect-ratio:4/3;padding:0;overflow:hidden',title:'Add to design','aria-label':'Add image to design',onclick:()=>{const i=getImg(id);const go=()=>addImageAsset({id,nw:i.naturalWidth,nh:i.naturalHeight});i.complete&&i.naturalWidth?go():i.addEventListener('load',go,{once:true})}},el('img',{src:D.assets[id],alt:'',style:'width:100%;height:100%;object-fit:cover'})),el('button',{class:'btn sm',onclick:()=>{P().bg={t:'img',src:id,c:'#fff'};touch();renderInsp()}},'Use as background')))))}
  else b.append(el('p',{class:'note'},'Nothing uploaded yet. Images stay in this browser.'));
}

/* ---------- draw ---------- */
function pDraw(b){
  b.append(el('h3',{class:'ph'},'Draw'),el('p',{class:'note'},'Drag on the canvas to draw. Each stroke becomes an object you can move, resize and recolour.'));
  const kinds=[['pen','pen','Pen'],['marker','marker','Marker'],['hl','hl','Highlighter'],['eraser','eraser','Eraser']];
  const sizes={pen:6,marker:18,hl:16,eraser:20};
  b.append(el('div',{class:'seg'},kinds.map(([k,i,t])=>el('button',{title:t,'aria-label':t,'aria-pressed':pen.kind===k,html:ic(i,18)+' '+t,onclick:()=>{pen.kind=k;pen.size=sizes[k]*unit();renderPanel()}}))));
  b.append(slider('Size',()=>pen.size,v=>pen.size=v,{min:1,max:80,step:1}));
  b.append(el('div',{class:'row'},el('label',{},'Color'),colorBtn(()=>pen.color,c=>pen.color=c||'#000')));
  b.append(el('div',{class:'swatches'},[...brand.colors,'#000000','#ffffff','#e03131','#f59f00','#2f9e44','#1971c2','#7048e8'].map(c=>el('button',{class:'sw',style:`background:${c}`,'aria-label':c,onclick:()=>{pen.color=c;renderPanel()}}))));
  b.append(el('button',{class:'btn wide',onclick:()=>setTool('select')},'Done drawing'));
}

/* ---------- background ---------- */
function pBackground(b){
  b.append(el('h3',{class:'ph'},'Background'));
  const setBg=v=>{P().bg=v;touch();renderInsp()};
  b.append(el('div',{},el('h4',{class:'sh'},'Colors'),el('div',{class:'swatches'},[...brand.colors,...SWATCH].map(c=>el('button',{class:'sw',style:`background:${c}`,'aria-label':c,onclick:()=>setBg({t:'solid',c})})))));
  b.append(el('div',{},el('h4',{class:'sh'},'Gradients'),el('div',{class:'grid5'},GRADS.map(g=>el('button',{class:'cell',style:`background:linear-gradient(${g[2]}deg,${g[0]},${g[1]})`,'aria-label':'Gradient',onclick:()=>setBg({t:'grad',k:'lin',c1:g[0],c2:g[1],a:g[2]})})))));
  const pats=['dots','stripes','grid','check','cross','waves'];const c1=brand.colors[2]||'#fdf6e3',c2=brand.colors[0]||'#e8590c';
  b.append(el('div',{},el('h4',{class:'sh'},'Patterns'),el('div',{class:'grid3'},pats.map(k=>{const cv=document.createElement('canvas');cv.width=cv.height=90;const x=cv.getContext('2d');x.fillStyle=patternFor(x,{kind:k,c1,c2,size:22});x.fillRect(0,0,90,90);return el('button',{class:'cell',style:'padding:0;overflow:hidden',title:k,'aria-label':'Pattern '+k,onclick:()=>setBg({t:'pat',kind:k,c1,c2,size:Math.round(40*unit())})},cv)})),
    P().bg.t==='pat'?el('div',{class:'row',style:'margin-top:8px'},el('label',{},'Colors'),colorBtn(()=>P().bg.c1,c=>{P().bg.c1=c;touch()}),colorBtn(()=>P().bg.c2,c=>{P().bg.c2=c;touch()}),el('div',{class:'grow'},slider('',()=>P().bg.size,v=>{P().bg.size=v;touch()},{min:12,max:160}).querySelector('input'))):null));
  const ups=(D.uploads||[]).filter(id=>D.assets[id]);
  b.append(el('div',{},el('h4',{class:'sh'},'Image'),el('button',{class:'btn wide',html:ic('upload',16)+' Upload background image',onclick:()=>pickFile('bg')}),ups.length?el('div',{class:'grid3',style:'margin-top:8px'},ups.map(id=>el('button',{class:'cell',style:'padding:0;overflow:hidden',onclick:()=>setBg({t:'img',src:id,c:'#fff'}),'aria-label':'Use as background'},el('img',{src:D.assets[id],alt:'',style:'width:100%;height:100%;object-fit:cover'})))):null));
  b.append(el('button',{class:'btn wide',onclick:()=>setBg({t:'solid',c:'transparent'})},'Transparent (for PNG export)'));
}

/* ---------- layers ---------- */
function layerName(o){return o.name||(o.type==='text'?(o.text||'Text').slice(0,24):o.type==='shape'?(SHAPE_LIST.find(s=>s[0]===o.kind)||[0,o.kind==='line'?'Line':'Shape'])[1]:typeName(o))}
function pLayers(b){
  b.append(el('h3',{class:'ph'},'Layers'));
  const os=objs();if(!os.length){b.append(el('p',{class:'note'},'This page is empty. Add something from Elements or Text.'));return}
  const wrap=el('div',{style:'display:grid;gap:2px'});
  [...os].reverse().forEach(o=>{
    wrap.append(el('div',{class:'lay','aria-selected':sel.includes(o.id)},
      el('button',{title:o.hidden?'Show':'Hide','aria-label':o.hidden?'Show layer':'Hide layer',html:ic(o.hidden?'eyeoff':'eye',16),onclick:()=>{o.hidden=!o.hidden;touch();renderPanel()}}),
      el('div',{class:'nm',onclick:e=>{sel=e.shiftKey?(sel.includes(o.id)?sel.filter(i=>i!==o.id):[...sel,o.id]):[o.id];selChanged()}},el('span',{html:ic(o.type==='text'?'text':o.type==='image'?'image':o.type==='group'?'group':o.type==='path'?'draw':o.type==='chart'?'chart':o.type==='qr'?'qr':o.type==='table'?'table':'shapes',15)}),layerName(o)),
      el('button',{title:'Move up','aria-label':'Move layer up',html:ic('top',15),onclick:()=>{sel=[o.id];order('fwd');renderPanel()}}),
      el('button',{title:o.locked?'Unlock':'Lock','aria-label':o.locked?'Unlock layer':'Lock layer',html:ic(o.locked?'lock':'unlock',15),onclick:()=>{o.locked=!o.locked;touch();renderPanel()}})));
  });
  b.append(wrap);
}

/* ---------- brand ---------- */
function pBrand(b){
  b.append(el('h3',{class:'ph'},'Brand kit'),el('p',{class:'note'},'Saved in this browser and used across every design.'));
  const cols=el('div',{class:'swatches'});
  const draw=()=>{cols.innerHTML='';brand.colors.forEach((c,i)=>cols.append(el('div',{style:'position:relative'},colorBtn(()=>brand.colors[i],v=>{brand.colors[i]=v||c;saveBrand()}),el('button',{title:'Remove','aria-label':'Remove color',style:'position:absolute;top:-6px;right:-6px;width:16px;height:16px;border-radius:50%;background:var(--panel);border:1px solid var(--line);font-size:11px;line-height:1',onclick:()=>{brand.colors.splice(i,1);saveBrand();draw()}},'×'))));
    cols.append(el('button',{class:'sw',style:'display:grid;place-items:center;color:var(--mut)',title:'Add color','aria-label':'Add color',html:ic('plus',14),onclick:()=>{brand.colors.push('#7048e8');saveBrand();draw()}}))};
  draw();b.append(el('div',{},el('h4',{class:'sh'},'Colors'),cols));
  const fb=(k,l)=>{const bt=el('button',{class:'f',style:`text-align:left;font-family:"${brand[k]}"`,onclick:()=>openFontPop(bt,brand[k],f=>{brand[k]=f;saveBrand();bt.textContent=f;bt.style.fontFamily=`"${f}"`})},brand[k]);return row(l,bt)};
  b.append(el('div',{class:'sec'},el('h4',{},'Fonts'),fb('head','Heading'),fb('body','Body')));
  const logo=brand.logo&&D.assets[brand.logo];
  b.append(el('div',{class:'sec'},el('h4',{},'Logo'),logo?el('img',{src:logo,alt:'Brand logo',style:'max-height:70px;max-width:100%;object-fit:contain;background:var(--panel2);border-radius:8px;padding:8px'}):el('p',{class:'note'},'No logo yet for this design.'),
    el('div',{class:'row'},el('button',{class:'btn grow',onclick:()=>pickFile('logo')},logo?'Change logo':'Upload logo'),logo?el('button',{class:'btn grow',onclick:()=>{const i=getImg(brand.logo);addImageAsset({id:brand.logo,nw:i.naturalWidth||400,nh:i.naturalHeight||400})}},'Add to page'):null)));
  b.append(el('div',{class:'sec'},el('h4',{},'Apply'),el('button',{class:'btn wide',onclick:()=>{let n=0;P().objs.forEach(o=>{if(o.type==='text'){o.font=(o.size>=D.w*.045||o.bold)?brand.head:brand.body;n++}});touch();toast(n+' text layers updated')}},'Use brand fonts on this page'),
    el('button',{class:'btn wide',onclick:()=>{if(brand.colors.length<2)return;const bg=P().bg;if(bg.t==='solid')bg.c=brand.colors[2]||bg.c;touch();renderInsp();toast('Background updated')}},'Set background to brand color')));
}

/* ---------- magic (AI) ---------- */
let aiBusy=false;
function pMagic(b){
  b.append(el('h3',{class:'ph'},'Magic'));
  const status=el('p',{class:'note'},'');
  const note=(t)=>status.textContent=t;
  aiSample().then(s=>{if(!s)note('AI actions need an AI model. Add one in Anands OS Settings. Everything else works without it.')});
  const prompt=el('textarea',{class:'f',rows:3,placeholder:'e.g. Summer menu poster for a beach café, warm colours'});
  const run=async(fn)=>{if(aiBusy)return;const s=await aiSample();if(!s){note('Magic needs an AI model. Add one in Anands OS Settings.');return}aiBusy=true;note('Thinking…');try{await fn(s)}catch(e){note(e&&e.code==='ai_off'?(e.message||'AI is not set up'):'That did not work — try rephrasing.')}aiBusy=false};
  b.append(el('div',{class:'sec'},el('h4',{},'Magic design'),prompt,el('button',{class:'btn pri wide',html:ic('sparkle',16)+' Generate a design',onclick:()=>{const t=prompt.value.trim();if(!t){note('Describe what you want first.');return}run(async s=>{
    const ask=`You are a graphic designer. Create ONE design for a ${D.w}x${D.h}px canvas. Reply with ONLY JSON: {"bg":"#hex" or {"c1":"#hex","c2":"#hex","a":0-360},"objs":[...]}. Each obj is either {"type":"text","text":"..","x":0-100,"y":0-100,"w":10-100,"size":2-30,"font":one of ${JSON.stringify(FONTS)},"color":"#hex","bold":bool,"align":"left|center|right","upper":bool} or {"type":"shape","kind":one of rect|ellipse|tri|diamond|hex|star|heart|blob|burst|ring|pent,"x":-20-100,"y":-20-100,"w":1-120,"h":1-120,"fill":"#hex","r":0-50,"op":0-1}. x,y,w,h are percents of canvas width/height; size is percent of the canvas shorter side. Put shapes first (back to front), then text. 6-14 objects, strong contrast, margins of at least 6%, real wording not placeholders. Brief: ${t}`;
    const r=await s.json(ask,{modelTier:'default',cache:false});applyAI(r);note('Done — everything is editable. Undo with Ctrl+Z.')})}}),status));
  b.append(el('div',{class:'sec'},el('h4',{},'Magic write'),el('p',{class:'note'},'Select a text layer, then choose what to do with it.'),el('div',{class:'chips'},['Make it shorter','Make it longer','Fix spelling & grammar','More playful','More professional','Translate to Spanish','Translate to Hindi','Translate to French'].map(a=>el('button',{class:'chip',onclick:()=>{const so=selObjs().filter(o=>o.type==='text');if(!so.length){note('Select a text layer first.');return}run(async s=>{for(const o of so){const r=await s(`Rewrite this text for a graphic design. Task: ${a}. Keep line breaks where sensible. Reply with ONLY the new text.\n\n${o.text}`,{cache:false,modelTier:'quick'});o.text=r.text.trim().replace(/^["“]|["”]$/g,'');}touch();renderInsp();note('Updated '+so.length+' text layer'+(so.length>1?'s':''))})}},a)))));
  const idea=el('input',{class:'f',placeholder:'Topic, e.g. coffee shop opening'});
  const out=el('div',{class:'txtp'});
  b.append(el('div',{class:'sec'},el('h4',{},'Headline ideas'),idea,el('button',{class:'btn wide',onclick:()=>{const t=idea.value.trim();if(!t){note('Give me a topic.');return}run(async s=>{const r=await s.json(`Give 6 short punchy headlines (max 7 words) for a design about: ${t}. Reply ONLY with a JSON array of strings.`,{cache:false,modelTier:'quick'});out.innerHTML='';(Array.isArray(r)?r:[]).slice(0,8).forEach(h=>out.append(el('button',{onclick:()=>{addObj(mkText(String(h),{font:brand.head,bold:true,size:Math.round(90*unit()),w:D.w*.8}))}},String(h))));note('Click an idea to add it.')})}},'Suggest headlines'),out));
  const pal=el('input',{class:'f',placeholder:'Mood, e.g. calm ocean morning'});
  b.append(el('div',{class:'sec'},el('h4',{},'Color palette'),pal,el('button',{class:'btn wide',onclick:()=>{const t=pal.value.trim();if(!t){note('Describe a mood first.');return}run(async s=>{const r=await s.json(`Create a 5 color palette for: ${t}. Reply ONLY with a JSON array of 5 hex strings.`,{cache:false,modelTier:'quick'});const cols=(Array.isArray(r)?r:[]).filter(c=>/^#[0-9a-f]{6}$/i.test(c)).slice(0,6);if(!cols.length)throw 0;brand.colors=cols;saveBrand();note('Palette set as your brand colors — see Brand and the color pickers.')})}},'Generate palette')));
}
function applyAI(r){
  const W=D.w,H=D.h,m=Math.min(W,H);if(!r||!Array.isArray(r.objs))throw 0;
  const hex=c=>typeof c==='string'&&/^#[0-9a-f]{3,8}$/i.test(c)?c:null;
  if(typeof r.bg==='string'&&hex(r.bg))P().bg={t:'solid',c:r.bg};else if(r.bg&&hex(r.bg.c1)&&hex(r.bg.c2))P().bg={t:'grad',k:'lin',c1:r.bg.c1,c2:r.bg.c2,a:+r.bg.a||135};
  const list=[];
  r.objs.slice(0,24).forEach(a=>{
    if(a.type==='text'&&a.text){const o=mkText(String(a.text).slice(0,400),{x:(+a.x||0)/100*W,y:(+a.y||0)/100*H,w:clamp((+a.w||60),5,100)/100*W,size:clamp(+a.size||6,1.5,40)/100*m,font:FONTS.includes(a.font)?a.font:brand.body,color:hex(a.color)||'#1f1c19',bold:!!a.bold,align:['left','center','right'].includes(a.align)?a.align:'left',upper:!!a.upper});o.size=Math.round(o.size);list.push(o)}
    else if(a.type==='shape'){const k=(SHAPE_LIST.find(s=>s[0]===a.kind)||[0])[0]||'rect';list.push(mkShape(k,{x:(+a.x||0)/100*W,y:(+a.y||0)/100*H,w:clamp(+a.w||20,1,140)/100*W,h:clamp(+a.h||20,1,140)/100*H,fill:hex(a.fill)||'#e8590c',r:(+a.r||0)/100*m,op:clamp(a.op??1,0,1)}))}
  });
  P().objs=list;sel=[];touch();selChanged();
}

/* ---------- pages ---------- */
function renderStrip(){
  const s=$('#pages');if(!s)return;s.innerHTML='';
  D.pages.forEach((p,i)=>{
    const sc=76/Math.max(D.w,D.h);let c;try{c=renderPageTo(p,sc)}catch(e){c=document.createElement('canvas');c.width=c.height=60}
    const th=el('button',{class:'th','aria-label':'Go to page '+(i+1),onclick:()=>switchPage(i)},c);
    const btn=(ico,t,f)=>el('button',{title:t,'aria-label':t,html:ic(ico,14),onclick:e=>{e.stopPropagation();f()}});
    s.append(el('div',{class:'pg','aria-current':i===cur},th,el('small',{},'Page '+(i+1)),el('div',{class:'pa'},btn('left','Move earlier',()=>movePage(i,-1)),btn('copy','Duplicate page',()=>dupPage(i)),D.pages.length>1?btn('trash','Delete page',()=>delPage(i)):null,btn('right','Move later',()=>movePage(i,1)))));
  });
  s.append(el('button',{class:'addpg',title:'Add page','aria-label':'Add page',html:ic('plus',20),onclick:()=>addPage()}));
}
function renderAll(){render();renderInsp();renderStrip();renderPanel();updUndo();placeQbar()}
function switchPage(i){commit();cur=clamp(i,0,D.pages.length-1);sel=[];cropMode=null;renderAll()}
function addPage(){commit();D.pages.splice(cur+1,0,newPage());cur++;sel=[];dirty=true;commit();renderAll()}
function dupPage(i){commit();const p=JSON.parse(JSON.stringify(D.pages[i],(k,v)=>k[0]==='_'?undefined:v));p.id=uid();p.objs.forEach(o=>{o.id=uid();if(o.kids)o.kids.forEach(k=>k.id=uid())});D.pages.splice(i+1,0,p);cur=i+1;sel=[];dirty=true;commit();renderAll()}
function delPage(i){if(D.pages.length<2)return;commit();D.pages.splice(i,1);cur=clamp(cur>=i?cur-1:cur,0,D.pages.length-1);sel=[];dirty=true;commit();renderAll()}
function movePage(i,d){const j=i+d;if(j<0||j>=D.pages.length)return;commit();[D.pages[i],D.pages[j]]=[D.pages[j],D.pages[i]];cur=j;dirty=true;commit();renderAll()}

/* ---------- modal ---------- */
function openModal(node,narrow){const m=$('#modal');m.innerHTML='';m.append(el('div',{class:'dlg'+(narrow?' narrow':''),role:'dialog','aria-modal':'true'},node));m.hidden=false;const f=$('button,input,select',m);setTimeout(()=>f&&f.focus&&f.focus(),0)}
function closeModal(){const m=$('#modal');m.hidden=true;m.innerHTML=''}
$('#modal').addEventListener('pointerdown',e=>{if(e.target.id==='modal')closeModal()});
const dlgHead=(t)=>el('header',{},el('h2',{},t),el('button',{class:'btn sm','aria-label':'Close',html:ic('close',16),onclick:closeModal}));

/* ---------- new design ---------- */
function newDesign(w,h,name){
  commit();saveDoc();D=newDoc(w,h,name);cur=0;sel=[];$('#title').value=D.name;resetHistory();fit();renderAll();closeModal();openTab('tpl');
}
function openNew(){
  const cw=el('input',{class:'f',type:'number',value:1080,min:20,max:8000,'aria-label':'Width'}),ch=el('input',{class:'f',type:'number',value:1080,min:20,max:8000,'aria-label':'Height'});
  openModal(el('div',{style:'display:grid;gap:16px'},dlgHead('Create a design'),
    el('div',{class:'sizes'},SIZES.map(s=>el('button',{onclick:()=>newDesign(s.w,s.h,s.n)},el('b',{},s.n),el('small',{},`${s.w} × ${s.h} px`)))),
    el('div',{class:'row'},el('label',{style:'flex:0 0 auto'},'Custom size'),cw,el('span',{},'×'),ch,el('button',{class:'btn pri',onclick:()=>newDesign(clamp(+cw.value||1080,20,8000),clamp(+ch.value||1080,20,8000),'Custom design')},'Create'))));
}

/* ---------- help ---------- */
function openHelp(){
  const rows=[['Text / Rectangle / Circle / Line / Pen','T · R · O · L · P'],['Undo · Redo','Ctrl+Z · Ctrl+Shift+Z'],['Copy · Cut · Paste · Duplicate','Ctrl+C · X · V · D'],['Select all','Ctrl+A'],['Group · Ungroup','Ctrl+G · Ctrl+Shift+G'],['Forward · Backward · Front · Back','Ctrl+] · Ctrl+[ (+Shift)'],['Bold · Italic · Underline','Ctrl+B · I · U'],['Nudge (×10 with Shift)','Arrow keys'],['Edit text · Crop image','Double-click'],['Pan','Space + drag, or scroll'],['Zoom','Ctrl + scroll · pinch · Ctrl +/−'],['Fit to screen','Ctrl+0'],['Disable snapping while dragging','Hold Alt'],['Constrain angle / axis','Hold Shift'],['Delete','Delete / Backspace']];
  openModal(el('div',{style:'display:grid;gap:12px'},dlgHead('Keyboard shortcuts'),el('div',{style:'display:grid;gap:6px'},rows.map(([a,b])=>el('div',{class:'row',style:'justify-content:space-between;border-bottom:1px solid var(--line);padding:5px 0'},el('span',{},a),el('span',{class:'kbd'},b))))),true);
}

/* ---------- resize layout hook & top bar ---------- */
function resizeLayoutHook(){}
$('#btnUndo').onclick=undo;$('#btnRedo').onclick=redo;
$('#zIn').onclick=()=>zoomAt(1.2);$('#zOut').onclick=()=>zoomAt(1/1.2);$('#zFit').onclick=fit;
$('#btnExport').onclick=openExport;$('#btnPresent').onclick=present;$('#btnHome').onclick=openDesigns;$('#btnNew').onclick=openNew;
$('#title').addEventListener('input',e=>{D.name=e.target.value;dirty=true;clearTimeout(hTimer);hTimer=setTimeout(commit,320);clearTimeout(saveT);saveT=setTimeout(saveDoc,900)});
$('#btnTheme').onclick=()=>{const r=document.documentElement;const dark=r.dataset.theme?r.dataset.theme==='dark':matchMedia('(prefers-color-scheme:dark)').matches;const n=dark?'light':'dark';r.dataset.theme=n;try{localStorage.setItem('ds.theme',n)}catch(e){}$('#btnTheme').innerHTML=ic(n==='dark'?'sun':'moon',18);renderUI();render()};
try{const t=localStorage.getItem('ds.theme');if(t)document.documentElement.dataset.theme=t}catch(e){}
{const r=document.documentElement;const dark=r.dataset.theme?r.dataset.theme==='dark':matchMedia('(prefers-color-scheme:dark)').matches;$('#btnTheme').innerHTML=ic(dark?'sun':'moon',18)}
$('#btnUndo').innerHTML=ic('undo',18);$('#btnRedo').innerHTML=ic('redo',18);$('#zIn').innerHTML=ic('plus',16);$('#zOut').innerHTML=ic('minus',16);
$('#btnPresent').innerHTML=ic('play',16)+'<span class="hide-sm"> Present</span>';$('#btnExport').innerHTML=ic('download',16)+'<span> Download</span>';$('#btnNew').innerHTML=ic('plus',16)+'<span class="hide-sm"> New</span>';
$('#hint').textContent='Double-click text to edit · Space+drag to pan · Ctrl+scroll to zoom · ? for shortcuts';

window.addEventListener('beforeunload',()=>{commit();saveDoc()});
document.fonts&&document.fonts.ready.then(()=>{render();renderStrip()});

/* =====================================================================
   Anands OS integration + the studio's advanced features
   (files, background remover, animation, stock photos, SVG/vector, video/GIF, share links)
   ===================================================================== */
var animT=null;
const PUT=()=>window.puter;
const DIR='/Designs';
const enc=encodeURIComponent;
Object.assign(IC,{
  share:'<circle cx="6" cy="12" r="2.600"/><circle cx="17" cy="6" r="2.600"/><circle cx="17" cy="18" r="2.600"/><path d="m8.300 10.800 6.400-3.600M8.300 13.200l6.400 3.600"/>',
  film:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M17 9h4M3 15h4M17 15h4"/>',
  link:'<path d="M10 14a4 4 0 0 0 5.700 0l3-3a4 4 0 0 0-5.700-5.700l-1 1"/><path d="M14 10a4 4 0 0 0-5.700 0l-3 3a4 4 0 0 0 5.700 5.700l1-1"/>',
  folder:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'
});
const toBlob=(c,type,q)=>new Promise(r=>c.toBlob(r,type,q));
const api=async(path,body)=>{const r=await fetch('/_local'+path,{method:'POST',credentials:'same-origin',headers:{'x-aos':'1','content-type':'application/json'},body:JSON.stringify(body||{})});const j=await r.json().catch(()=>({}));if(!r.ok)throw Object.assign(new Error(j.error||j.message||('Error '+r.status)),{code:j.code});return j};
const loadScript=src=>new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=()=>rej(new Error('Could not load '+src));document.head.append(s)});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const baseName=()=>(D.name||'design').replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'-')||'design';

/* ---------- saving: every design is a file in Files › Designs ---------- */
var ready=false;
const fileCache=new Map();
const safeName=n=>String(n||'Untitled design').replace(/[\\/:*?"<>|\u0000-\u001f]+/g,'').replace(/\s+/g,' ').trim().slice(0,60)||'Untitled design';
const fileFor=()=>`${DIR}/${safeName(D.name)} [${D.id.slice(-5)}].design`;
let saveQ=Promise.resolve();
function setSaveState(s){const e=document.getElementById('saveState');if(e)e.textContent=s}
function saveDoc(){saveQ=saveQ.then(doSave,doSave);return saveQ}
async function doSave(){
  if(!ready||!PUT())return;
  try{
    setSaveState('Saving…');
    const th=await thumbOf(D.pages[0],240);
    const rec={v:1,id:D.id,name:D.name,updated:Date.now(),w:D.w,h:D.h,pages:D.pages,assets:usedAssets(),thumb:th};
    const f=fileFor(),old=D._file;
    await PUT().fs.write(f,new Blob([JSON.stringify(rec,(k,v)=>k[0]==='_'?undefined:v)],{type:'application/json'}),{createMissingParents:true,overwrite:true});
    if(old&&old!==f){try{await PUT().fs.delete(old)}catch(e){}}
    D._file=f;fileCache.delete(f);try{localStorage.setItem('ds.last',f)}catch(e){}
    setSaveState('Saved to Files');
  }catch(e){setSaveState('Not saved')}
}
async function readDesign(path){const b=await PUT().fs.read(path);const r=JSON.parse(await b.text());if(!r||!Array.isArray(r.pages)||!r.w||!r.h)throw new Error('Not a design');r._file=path;return r}
function loadRec(r){D={id:r.id||uid(),name:r.name||'Untitled design',w:r.w,h:r.h,pages:r.pages,assets:r.assets||{}};D._file=r._file||null;cur=0;sel=[];$('#title').value=D.name;resetHistory();fit();renderAll();setSaveState(D._file?'Saved to Files':'')}
async function listDocs(){
  let items=[];try{items=await PUT().fs.readdir(DIR)}catch(e){return []}
  items=items.filter(i=>!i.is_dir&&/\.design$/i.test(i.name));const out=[];let k=0;
  await Promise.all(Array.from({length:4},async()=>{while(k<items.length){const it=items[k++];const key=it.path+'|'+(it.modified||0)+'|'+(it.size||0);let c=fileCache.get(it.path);
    if(!c||c.key!==key){try{const r=await readDesign(it.path);c={key,meta:{id:r.id,name:r.name,w:r.w,h:r.h,pages:r.pages.length,updated:r.updated||0,thumb:r.thumb||''}};fileCache.set(it.path,c)}catch(e){continue}}
    out.push({...c.meta,_file:it.path})}}));
  return out.sort((a,b)=>b.updated-a.updated);
}
async function openDesignFile(path){commit();await saveDoc();try{loadRec(await readDesign(path));closeModal()}catch(e){toast('Could not open that design')}}
function importRec(j,name){if(!j||!Array.isArray(j.pages)||!j.w)throw new Error('bad');commit();saveDoc();loadRec({id:uid(),name:j.name||name||'Imported design',w:j.w,h:j.h,pages:j.pages,assets:j.assets||{}});saveDoc()}
async function openDesigns(){
  commit();await saveDoc();
  const body=el('div',{style:'display:grid;gap:16px'});openModal(body);
  const imp=el('input',{type:'file',accept:'.design,.json,application/json',hidden:true});
  imp.onchange=async()=>{const f=imp.files[0];if(!f)return;try{importRec(JSON.parse(await f.text()),f.name.replace(/\.\w+$/,''));closeModal();toast('Design imported')}catch(e){toast('That file is not a design')}};
  body.append(dlgHead('Your designs'),el('p',{class:'note'},'Designs save automatically to Files › Designs.'));
  const list=await listDocs();
  const grid=el('div',{class:'dsg'});
  list.forEach(r=>{let armed=false;const del=el('button',{class:'btn sm danger',onclick:async()=>{if(!armed){armed=true;del.textContent='Click again to delete';return}try{await PUT().fs.delete(r._file);fileCache.delete(r._file)}catch(e){}openDesigns()}},'Delete');
    const dup=el('button',{class:'btn sm',onclick:async()=>{try{const x=await readDesign(r._file);x.id=uid();x.name=r.name+' copy';x._file=null;await saveDoc();loadRec(x);await saveDoc();closeModal();toast('Duplicated')}catch(e){toast('Could not duplicate')}}},'Duplicate');
    grid.append(el('div',{class:'dcard'},el('button',{class:'tc','aria-label':'Open '+r.name,onclick:()=>r.id===D.id?closeModal():openDesignFile(r._file)},r.thumb?el('img',{src:r.thumb,alt:''}):null),el('b',{},r.name+(r.id===D.id?' (open)':'')),el('small',{},`${r.w}×${r.h} · ${r.pages} page${r.pages>1?'s':''} · ${new Date(r.updated).toLocaleDateString()}`),r.id===D.id?null:el('div',{class:'row'},dup,del)))});
  body.append(el('div',{class:'row'},el('button',{class:'btn pri',onclick:openNew,html:ic('plus',16)+' New design'}),el('button',{class:'btn',onclick:()=>imp.click(),html:ic('upload',16)+' Import file'}),imp),list.length?grid:el('p',{class:'note'},'Nothing saved yet — your first change creates the file.'));
}

/* ---------- image helpers ---------- */
const dataToCanvas=async(url,maxSide)=>{const i=new Image();i.src=url;await i.decode();const k=maxSide?Math.min(1,maxSide/Math.max(i.naturalWidth,i.naturalHeight)):1;const c=document.createElement('canvas');c.width=Math.max(1,Math.round(i.naturalWidth*k));c.height=Math.max(1,Math.round(i.naturalHeight*k));c.getContext('2d').drawImage(i,0,0,c.width,c.height);return c};
function newAsset(url){const id='a_'+uid();D.assets[id]=url;(D.uploads||(D.uploads=[])).push(id);return id}

/* ---------- background remover ---------- */
let sessP=null;
async function bgSession(status){
  if(sessP)return sessP;
  sessP=(async()=>{
    status('Getting the cut-out model ready (first time only, then it works offline)…');
    await loadScript('/_local/bgdata/ort.min.js');
    ort.env.wasm.wasmPaths='/_local/bgdata/';ort.env.wasm.numThreads=1;ort.env.wasm.proxy=false;
    const r=await fetch('/_local/bgdata/u2netp.onnx',{credentials:'same-origin'});
    if(!r.ok){let m='';try{m=(await r.json()).error}catch(e){}throw new Error(m||'The cut-out model could not be downloaded')}
    return ort.InferenceSession.create(await r.arrayBuffer(),{executionProviders:['wasm']});
  })().catch(e=>{sessP=null;throw e});
  return sessP;
}
async function cutOut(url,status){
  const sess=await bgSession(status);status('Cutting out…');
  const src=await dataToCanvas(url,2200),S=320,sm=document.createElement('canvas');sm.width=sm.height=S;
  const sx=sm.getContext('2d');sx.drawImage(src,0,0,S,S);const d=sx.getImageData(0,0,S,S).data;
  let mx=1;for(let i=0;i<d.length;i+=4)mx=Math.max(mx,d[i],d[i+1],d[i+2]);
  const f=new Float32Array(3*S*S),mean=[.485,.456,.406],std=[.229,.224,.225];
  for(let i=0;i<S*S;i++)for(let c=0;c<3;c++)f[c*S*S+i]=(d[i*4+c]/mx-mean[c])/std[c];
  const out=await sess.run({[sess.inputNames[0]]:new ort.Tensor('float32',f,[1,3,S,S])});
  const m=out[sess.outputNames[0]].data;let lo=Infinity,hi=-Infinity;for(let i=0;i<S*S;i++){lo=Math.min(lo,m[i]);hi=Math.max(hi,m[i])}
  const mk=document.createElement('canvas');mk.width=mk.height=S;const mc=mk.getContext('2d'),id=mc.createImageData(S,S);
  for(let i=0;i<S*S;i++){let v=(m[i]-lo)/Math.max(1e-6,hi-lo);v=Math.min(1,Math.max(0,(v-.12)/.76));v=v*v*(3-2*v);id.data[i*4]=id.data[i*4+1]=id.data[i*4+2]=0;id.data[i*4+3]=Math.round(v*255)}
  mc.putImageData(id,0,0);
  const res=document.createElement('canvas');res.width=src.width;res.height=src.height;const rc=res.getContext('2d');
  rc.drawImage(src,0,0);rc.globalCompositeOperation='destination-in';rc.imageSmoothingEnabled=true;rc.imageSmoothingQuality='high';rc.drawImage(mk,0,0,res.width,res.height);
  return res.toDataURL('image/png');
}
async function plainBg(url,tol){
  const c=await dataToCanvas(url,2200),x=c.getContext('2d'),W=c.width,H=c.height,im=x.getImageData(0,0,W,H),d=im.data;
  const px=(X,Y)=>{const i=(Y*W+X)*4;return [d[i],d[i+1],d[i+2]]};
  const cs=[px(0,0),px(W-1,0),px(0,H-1),px(W-1,H-1)],bg=[0,1,2].map(k=>Math.round(cs.reduce((a,v)=>a+v[k],0)/4));
  const near=i=>Math.hypot(d[i]-bg[0],d[i+1]-bg[1],d[i+2]-bg[2])<tol;
  const seen=new Uint8Array(W*H),q=new Int32Array(W*H);let qh=0,qt=0;
  const push=(X,Y)=>{const p=Y*W+X;if(seen[p]||!near(p*4))return;seen[p]=1;q[qt++]=p};
  for(let X=0;X<W;X++){push(X,0);push(X,H-1)}for(let Y=0;Y<H;Y++){push(0,Y);push(W-1,Y)}
  while(qh<qt){const p=q[qh++],X=p%W,Y=(p/W)|0;if(X>0)push(X-1,Y);if(X<W-1)push(X+1,Y);if(Y>0)push(X,Y-1);if(Y<H-1)push(X,Y+1)}
  for(let p=0;p<W*H;p++)if(seen[p])d[p*4+3]=0;
  for(let Y=1;Y<H-1;Y++)for(let X=1;X<W-1;X++){const p=Y*W+X;if(seen[p])continue;if(seen[p-1]||seen[p+1]||seen[p-W]||seen[p+W])d[p*4+3]=Math.min(d[p*4+3],150)}
  x.putImageData(im,0,0);return c.toDataURL('image/png');
}
function bgInsp(o){
  const st=el('p',{class:'note'},o.orig?'Background removed.':'Cut the subject out of its background. Works on this device — your photo is not uploaded.');
  const set=t=>{st.textContent=t};let busy=false;
  const run=async(fn,done)=>{if(busy||!o.src)return;busy=true;try{const url=await fn(D.assets[o.src]);const id=newAsset(url);if(!o.orig)o.orig=o.src;o.src=id;touch();renderInsp();renderPanel();toast(done)}catch(e){set((e&&e.message)||'That did not work')}busy=false};
  return sec('Remove background',
    el('button',{class:'btn pri wide',html:ic('sparkle',16)+' Remove background',onclick:()=>run(u=>cutOut(u,set),'Background removed')}),
    el('button',{class:'btn wide',onclick:()=>run(u=>plainBg(u,48),'Plain background removed')},'Remove a plain color background'),
    o.orig?el('button',{class:'btn wide',onclick:()=>{const cur_=o.src;o.src=o.orig;o.orig=null;touch();renderInsp()}},'Restore original'):null,st);
}

/* ---------- animation ---------- */
const AN_IN=[['none','None'],['fade','Fade'],['rise','Rise up'],['drop','Drop in'],['left','From left'],['right','From right'],['zoom','Zoom in'],['pop','Pop'],['spin','Spin in']];
const AN_OUT=[['none','None'],['fade','Fade'],['rise','Rise up'],['drop','Drop down'],['left','To the left'],['right','To the right'],['zoom','Shrink'],['spin','Spin out']];
const AN_LOOP=[['none','None'],['float','Float'],['pulse','Pulse'],['sway','Sway'],['spin','Spin']];
const ease=t=>1-Math.pow(1-t,3),backE=t=>{const c=2.70158,u=t-1;return 1+c*u*u*u+1.70158*u*u};
function animFrame(o,t,pd,W,H){
  const a=o.an;if(!a)return null;const du=Math.max(.1,a.du||.8),d=a.d||0;let am=1,dx=0,dy=0,s=1,r=0;
  const kind=(k,e,p)=>{ // e: 0 = hidden .. 1 = shown
    switch(k){case 'fade':am*=e;break;case 'rise':am*=e;dy+=(1-e)*H*.12;break;case 'drop':am*=e;dy-=(1-e)*H*.12;break;
      case 'left':am*=e;dx-=(1-e)*W*.2;break;case 'right':am*=e;dx+=(1-e)*W*.2;break;case 'zoom':am*=e;s*=.5+.5*e;break;
      case 'pop':s*=Math.max(0,backE(p));am*=Math.min(1,p*4);break;case 'spin':am*=e;r-=(1-e)*180;s*=.6+.4*e;break}};
  if(a.i&&a.i!=='none'){const p=clamp((t-d)/du,0,1);kind(a.i,ease(p),p)}
  if(a.o&&a.o!=='none'){const p=clamp((t-(pd-du))/du,0,1);if(p>0){const e=1-ease(p);kind(a.o==='drop'?'rise':a.o==='rise'?'drop':a.o==='left'?'right':a.o==='right'?'left':a.o,e,1-p)}}
  if(a.l&&a.l!=='none'&&t>=d){const w=Math.PI*2;if(a.l==='float')dy+=Math.sin(t*w/2.4)*H*.012;else if(a.l==='pulse')s*=1+.04*Math.sin(t*w/1.6);else if(a.l==='sway')r+=3*Math.sin(t*w/2.4);else if(a.l==='spin')r+=t*60}
  return {am,dx,dy,s,r};
}
function drawAnimObj(ctx,o,t,pd,W,H,opt){
  const f=animFrame(o,t,pd,W,H);if(!f){drawObj(ctx,o,opt);return}
  if(f.am<=.003||f.s<=.003)return;
  ctx.save();const cx=o.x+o.w/2,cy=o.y+o.h/2;ctx.translate(cx+f.dx,cy+f.dy);ctx.rotate(f.r*Math.PI/180);ctx.scale(f.s,f.s);ctx.translate(-cx,-cy);
  const op=o.op;o.op=(op??1)*f.am;try{drawObj(ctx,o,opt)}finally{o.op=op}ctx.restore();
}
function drawPageContent(ctx,page,W,H,opt){
  if(!opt.transparent)drawBg(ctx,page.bg,W,H,opt);
  if(opt.t!=null){const pd=page.dur||4;for(const o of page.objs)drawAnimObj(ctx,o,opt.t,pd,W,H,opt);return}
  for(const o of page.objs)drawObj(ctx,o,opt);
}
const pageHasAnim=p=>p.objs.some(o=>o.an&&((o.an.i&&o.an.i!=='none')||(o.an.o&&o.an.o!=='none')||(o.an.l&&o.an.l!=='none')));
let animRun=false;
function playAnim(){
  if(animRun){animRun=false;return}
  const pd=P().dur||4,t0=performance.now();animRun=true;toast('Playing — press Esc or the button again to stop',1500);
  const step=()=>{if(!animRun){animT=null;render();return}const t=(performance.now()-t0)/1000;if(t>=pd){animRun=false;animT=null;render();return}animT=t;render();requestAnimationFrame(step)};
  requestAnimationFrame(step);
}
addEventListener('keydown',e=>{if(e.key==='Escape'&&animRun){animRun=false}},true);
function animInsp(so){
  const sel1=(label,list,key)=>row(label,el('select',{class:'f','aria-label':label,onchange:e=>{each(o=>{(o.an||(o.an={}))[key]=e.target.value})}},list.map(([v,l])=>el('option',{value:v,selected:((first().an||{})[key]||'none')===v},l))));
  return sec('Animate',sel1('Enter',AN_IN,'i'),sel1('Exit',AN_OUT,'o'),sel1('Loop',AN_LOOP,'l'),
    slider('Delay',()=>(first().an||{}).d||0,v=>each(o=>{(o.an||(o.an={})).d=v}),{min:0,max:15,step:.1,suffix:' s'}),
    slider('Speed',()=>(first().an||{}).du||.8,v=>each(o=>{(o.an||(o.an={})).du=v}),{min:.2,max:4,step:.1,suffix:' s'}),
    el('div',{class:'row'},el('button',{class:'btn grow',html:ic('play',16)+' Preview page',onclick:playAnim}),el('button',{class:'btn grow',onclick:()=>{const a=JSON.parse(JSON.stringify(first().an||{}));P().objs.forEach(o=>{o.an=JSON.parse(JSON.stringify(a))});touch();toast('Applied to every layer on this page')}},'Apply to page')),
    el('p',{class:'note'},'Animations play in Present, and export as video or GIF. Page length is under Page.'));
}
function pageDurSec(){
  return sec('Animation',slider('Page length',()=>P().dur||4,v=>{P().dur=v;touch()},{min:1,max:30,step:.5,suffix:' s'}),
    el('button',{class:'btn wide',html:ic('play',16)+' Preview animation',onclick:playAnim}),
    el('p',{class:'note'},'Select a layer to give it an entrance, exit or loop.'));
}

/* ---------- stock photos ---------- */
const stock={q:'',page:1,items:[],src:'',status:null,busy:false,err:'',more:true};
const stockImg=u=>'/_local/design/stockimg?u='+enc(u);
async function stockLoad(reset){
  if(stock.busy)return;stock.busy=true;stock.err='';if(reset){stock.page=1;stock.items=[];stock.more=true}
  try{const r=await api('/design/stock',{q:stock.q,page:stock.page,source:stock.src});stock.items=stock.items.concat(r.items);stock.more=r.items.length>=12;stock.page++;stock.srcUsed=r.source}
  catch(e){stock.err=e.message||'Search failed'}
  stock.busy=false;if(tab==='stock')renderPanel();
}
async function addStock(it,btn){
  try{toast('Adding photo…',8000);const r=await fetch(stockImg(it.full),{credentials:'same-origin'});if(!r.ok)throw new Error('The photo could not be loaded');const b=await r.blob();
    const f=new File([b],'photo.jpg',{type:b.type||'image/jpeg'});const a=await ingestImage(f);if(a){addImageAsset(a);toast('Photo by '+(it.by||'the photographer')+' · '+(stock.srcUsed==='unsplash'?'Unsplash':'Pexels'));if(it.dl)api('/design/stockuse',{dl:it.dl}).catch(()=>{})}}
  catch(e){toast(e.message||'Could not add that photo')}
}
async function pickFromFiles(){
  try{const items=await PUT().ui.showOpenFilePicker({multiple:true,accept:'image/*'});for(const it of [].concat(items||[])){const b=await it.read();const a=await ingestImage(new File([b],it.name,{type:b.type||'image/png'}));if(a)addImageAsset(a)}}catch(e){if(!e||e.code!=='cancelled')toast('Could not open that file')}
}
function pStock(b){
  b.append(el('h3',{class:'ph'},'Photos'));
  const inp=el('input',{class:'f',type:'search',placeholder:'Search free photos',value:stock.q,'aria-label':'Search photos',style:'padding-left:30px'});
  inp.addEventListener('keydown',e=>{if(e.key==='Enter'){stock.q=inp.value.trim();stockLoad(true)}});
  b.append(el('div',{class:'search'},el('span',{html:ic('search',16)}),inp),el('button',{class:'btn wide',html:ic('folder',16)+' Add from Files',onclick:pickFromFiles}));
  if(!stock.status){api('/design/stockstatus').then(s=>{stock.status=s;if(!s.pexels&&!s.unsplash){if(tab==='stock')renderPanel()}else if(!stock.items.length)stockLoad(true);else if(tab==='stock')renderPanel()}).catch(()=>{stock.status={}});b.append(el('p',{class:'note'},'Loading…'));return}
  if(!stock.status.pexels&&!stock.status.unsplash){b.append(el('p',{class:'note'},'Free stock photos need a Pexels or Unsplash key. Add one under Settings › Stock photos in Anands OS (both are free), then search here.'),el('button',{class:'btn sm',onclick:()=>{stock.status=null;renderPanel()}},'Check again'));return}
  if(stock.status.pexels&&stock.status.unsplash)b.append(el('div',{class:'chips'},[['','Auto'],['pexels','Pexels'],['unsplash','Unsplash']].map(([v,l])=>el('button',{class:'chip','aria-pressed':stock.src===v,onclick:()=>{stock.src=v;stockLoad(true);renderPanel()}},l))));
  if(stock.err)b.append(el('p',{class:'note',style:'color:var(--danger,#c92a2a)'},stock.err));
  const g=el('div',{class:'grid2'});
  stock.items.forEach(it=>g.append(el('button',{class:'cell',style:'aspect-ratio:4/3;padding:0;overflow:hidden',title:(it.alt||'Photo')+' — '+(it.by||''),'aria-label':'Add photo: '+(it.alt||it.by||'stock photo'),onclick:()=>addStock(it)},el('img',{src:stockImg(it.thumb),alt:it.alt||'',loading:'lazy',style:'width:100%;height:100%;object-fit:cover'}))));
  b.append(g);
  if(stock.busy)b.append(el('p',{class:'note'},'Loading…'));
  else if(stock.items.length&&stock.more)b.append(el('button',{class:'btn wide',onclick:()=>stockLoad(false)},'Load more'));
  else if(!stock.items.length&&!stock.err)stockLoad(true);
  b.append(el('p',{class:'note'},'Photos from '+(stock.srcUsed==='unsplash'?'Unsplash':'Pexels')+'. Free to use; credit is appreciated.'));
}

/* ---------- SVG (vector) ---------- */
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const nf=n=>+(+n).toFixed(2);
async function loadFonts(pages){
  const need=new Set(),walk=os=>os.forEach(o=>{if(o.type==='text')need.add(`${o.italic?'italic ':''}${wt(o)} 20px "${o.font}"`);if(o.kids)walk(o.kids)});
  pages.forEach(p=>walk(p.objs));await Promise.all([...need].map(f=>document.fonts.load(f).catch(()=>{})));try{await document.fonts.ready}catch(e){}
}
function baselineOff(o){ // distance from the em-box top (what canvas 'top' uses) down to the alphabetic baseline
  const c=mctx;setFont(c,o);c.textBaseline='top';const a=c.measureText('H').actualBoundingBoxAscent;c.textBaseline='alphabetic';const b=c.measureText('H').actualBoundingBoxAscent;c.textBaseline='alphabetic';return b-a}
function pageSVG(page,pre){
  const W=D.w,H=D.h;let defs='',gid=0,body='';
  const grad=(f,w,h,gt)=>{const id=pre+'g'+(gid++);const T=gt?` gradientTransform="${gt}"`:'';
    if(f.t==='rad')defs+=`<radialGradient id="${id}"${T} gradientUnits="userSpaceOnUse" cx="${nf(w/2)}" cy="${nf(h/2)}" r="${nf(Math.hypot(w,h)/2)}"><stop offset="0" stop-color="${esc(f.c1)}"/><stop offset="1" stop-color="${esc(f.c2)}"/></radialGradient>`;
    else{const a=(f.a||0)*Math.PI/180,dx=Math.sin(a),dy=-Math.cos(a),L=Math.abs(w*dx)+Math.abs(h*dy);defs+=`<linearGradient id="${id}"${T} gradientUnits="userSpaceOnUse" x1="${nf(w/2-dx*L/2)}" y1="${nf(h/2-dy*L/2)}" x2="${nf(w/2+dx*L/2)}" y2="${nf(h/2+dy*L/2)}"><stop offset="0" stop-color="${esc(f.c1)}"/><stop offset="1" stop-color="${esc(f.c2)}"/></linearGradient>`}
    return `url(#${id})`};
  const fillOf=(f,w,h,gt)=>!f?'none':typeof f==='string'?esc(f):grad(f,w,h,gt);
  const sc=Math.min(2,3000/Math.max(W,H));
  const raster=(o)=>{const c=renderPageTo({bg:{t:'solid',c:'transparent'},objs:[o]},sc,{transparent:true});return `<image xlink:href="${c.toDataURL('image/png')}" x="0" y="0" width="${W}" height="${H}"/>`};
  const place=(o,inner)=>`<g transform="translate(${nf(o.x+o.w/2)} ${nf(o.y+o.h/2)})${o.rot?` rotate(${nf(o.rot)})`:''}${o.fx_||o.fy_?` scale(${o.fx_?-1:1} ${o.fy_?-1:1})`:''} translate(${nf(-o.w/2)} ${nf(-o.h/2)})"${(o.op??1)<1?` opacity="${nf(o.op)}"`:''}>${inner}</g>`;
  const plainShadow=o=>!(o.shadow&&o.shadow.on);
  const conv=o=>{
    if(o.hidden)return '';
    if(o.type==='shape'&&o.kind!=='line'&&plainShadow(o)){
      const w=o.w,h=o.h,k=o.kind,strokeOn=o.sw>0&&o.stroke;
      if(k==='rect'||!SP[k]){const r=Math.min(o.r||0,w/2,h/2);return place(o,`<rect width="${nf(w)}" height="${nf(h)}"${r>0?` rx="${nf(r)}"`:''} fill="${fillOf(o.fill,w,h)}"${strokeOn?` stroke="${esc(o.stroke)}" stroke-width="${nf(o.sw)}"${dashOf(o).length?` stroke-dasharray="${dashOf(o).map(nf).join(' ')}"`:''}`:''}/>`)}
      if(!strokeOn||Math.abs(w-h)<.5){const kk=100/w;return place(o,`<path transform="scale(${nf(w/100)} ${nf(h/100)})" d="${SP[k]}" fill="${fillOf(o.fill,w,h,`scale(${nf(100/w)} ${nf(100/h)})`)}"${k==='ring'?' fill-rule="evenodd"':''}${strokeOn?` stroke="${esc(o.stroke)}" stroke-width="${nf(o.sw*kk)}" stroke-linejoin="round"${dashOf(o).length?` stroke-dasharray="${dashOf(o).map(v=>nf(v*kk)).join(' ')}"`:''}`:''}/>`)}
      return raster(o);
    }
    if(o.type==='text'&&!o.curve&&(!o.fx||o.fx==='none')&&typeof o.color==='string'&&plainShadow(o)&&(!o.list||o.list==='none')){
      const L=layoutText(o);let t='';const bo=baselineOff(o),sz=o.size,ls=(o.ls||0)/100*sz,deco=[o.ul?'underline':'',o.st?'line-through':''].filter(Boolean).join(' ');
      L.lines.forEach((ln,i)=>{if(!ln.t)return;const y=i*L.lh+(L.lh-sz)/2+bo,al=o.align,x=al==='right'?o.w:al==='center'?o.w/2+ln.ind/2:ln.ind;
        t+=`<text x="${nf(x)}" y="${nf(y)}" text-anchor="${al==='right'?'end':al==='center'?'middle':'start'}" xml:space="preserve">${esc(ln.t)}</text>`});
      return place(o,`<g font-family="'${esc(o.font)}', system-ui, sans-serif" font-size="${nf(sz)}" font-weight="${wt(o)}"${o.italic?' font-style="italic"':''}${ls?` letter-spacing="${nf(ls)}"`:''}${deco?` text-decoration="${deco}"`:''} fill="${esc(o.color)}">${t}</g>`);
    }
    if(o.type==='image'&&o.src&&D.assets[o.src]&&['none','rect',undefined].includes(o.mask)&&!o.vig&&!(o.tint&&o.tintv>0)&&(o.fp||'none')==='none'&&!Object.values(o.flt||{}).some(v=>v)&&plainShadow(o)){
      const img=getImg(o.src);if(img.complete&&img.naturalWidth){
        const iw=img.naturalWidth,ih=img.naturalHeight,fit=o.fit==='contain'?Math.min(o.w/iw,o.h/ih):Math.max(o.w/iw,o.h/ih),s=fit*(o.z||1),dw=iw*s,dh=ih*s,dx=(o.w-dw)/2+(o.ox||0)*o.w,dy=(o.h-dh)/2+(o.oy||0)*o.h;
        const cid=pre+'c'+(gid++),r=o.mask==='rect'?Math.min(o.r||0,o.w/2,o.h/2):0;
        defs+=`<clipPath id="${cid}"><rect width="${nf(o.w)}" height="${nf(o.h)}"${r?` rx="${nf(r)}"`:''}/></clipPath>`;
        return place(o,`<g clip-path="url(#${cid})"><image xlink:href="${D.assets[o.src]}" x="${nf(dx)}" y="${nf(dy)}" width="${nf(dw)}" height="${nf(dh)}" preserveAspectRatio="none"/></g>${o.sw>0&&o.stroke?`<rect width="${nf(o.w)}" height="${nf(o.h)}"${r?` rx="${nf(r)}"`:''} fill="none" stroke="${esc(o.stroke)}" stroke-width="${nf(o.sw)}"/>`:''}`);
      }
    }
    return raster(o);
  };
  const bg=page.bg||{t:'solid',c:'#fff'};
  if(bg.t==='solid'){if(bg.c&&bg.c!=='transparent')body+=`<rect width="${W}" height="${H}" fill="${esc(bg.c)}"/>`}
  else if(bg.t==='grad')body+=`<rect width="${W}" height="${H}" fill="${grad({t:bg.k||'lin',c1:bg.c1,c2:bg.c2,a:bg.a},W,H)}"/>`;
  else{const c=renderPageTo({bg,objs:[]},sc);body+=`<image xlink:href="${c.toDataURL('image/png')}" x="0" y="0" width="${W}" height="${H}"/>`}
  for(const o of page.objs)body+=conv(o);
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs>${defs}</defs>${body}</svg>`;
}
async function printVector(pgs){
  await loadFonts(pgs);
  const fl=document.querySelector('link[href*="fonts.googleapis.com/css2"]');
  const html=`<!doctype html><html><head><meta charset="utf-8">${fl?`<link rel="stylesheet" href="${fl.href}">`:''}<style>@page{size:${D.w}px ${D.h}px;margin:0}html,body{margin:0;padding:0}.pg{width:${D.w}px;height:${D.h}px;overflow:hidden;break-after:page;page-break-after:always}.pg:last-child{break-after:auto;page-break-after:auto}svg{display:block}</style></head><body>${pgs.map((p,i)=>`<div class="pg">${pageSVG(p,'v'+i)}</div>`).join('')}</body></html>`;
  const fr=el('iframe',{style:`position:fixed;left:-99999px;top:0;width:${D.w}px;height:${D.h}px;border:0`,'aria-hidden':'true'});document.body.append(fr);
  fr.srcdoc=html;await new Promise(r=>{fr.onload=r});
  try{await fr.contentWindow.document.fonts.ready}catch(e){}await wait(500);
  fr.contentWindow.focus();fr.contentWindow.print();setTimeout(()=>fr.remove(),60000);
  toast('In the print window, choose “Save as PDF”.',5000);
}

/* ---------- progress ---------- */
function progress(title){
  const bar=el('div',{style:'height:8px;border-radius:99px;background:var(--line);overflow:hidden'},el('i',{style:'display:block;height:100%;width:0;background:var(--accent);transition:width .15s'}));
  const msg=el('p',{class:'note'},'Starting…');const st={cancelled:false};
  const cancel=el('button',{class:'btn',onclick:()=>{st.cancelled=true;msg.textContent='Cancelling…'}},'Cancel');
  openModal(el('div',{style:'display:grid;gap:14px'},el('h2',{},title),bar,msg,cancel),true);
  st.set=(p,t)=>{bar.firstChild.style.width=Math.round(clamp(p,0,1)*100)+'%';if(t)msg.textContent=t};st.close=()=>closeModal();return st;
}

/* ---------- video & GIF ---------- */
const evenSize=(max)=>{const k=Math.min(1,max/Math.max(D.w,D.h));return {w:Math.max(2,Math.round(D.w*k/2)*2),h:Math.max(2,Math.round(D.h*k/2)*2),k:Math.max(2,Math.round(D.w*k/2)*2)/D.w}};
function drawFrame(ctx,page,z,w,h,t){ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.setTransform(w/D.w,0,0,h/D.h,0,0);drawPageContent(ctx,page,D.w,D.h,{s:z,t})}
async function recordVideo(pgs,pg){
  if(!window.MediaRecorder)throw new Error('This browser cannot record video');
  const {w,h}=evenSize(1920),cv=document.createElement('canvas');cv.width=w;cv.height=h;const ctx=cv.getContext('2d');
  const mime=['video/mp4;codecs=avc1','video/mp4','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(m=>MediaRecorder.isTypeSupported(m));
  if(!mime)throw new Error('This browser cannot record video');
  const stream=cv.captureStream(30),rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:8e6}),chunks=[];
  rec.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
  const total=pgs.reduce((a,p)=>a+(p.dur||4),0);let done=0;
  const stopped=new Promise(r=>{rec.onstop=r});rec.start(250);
  for(const p of pgs){const pd=p.dur||4,t0=performance.now();
    await new Promise(res=>{const step=()=>{const t=(performance.now()-t0)/1000;if(pg.cancelled||t>=pd){drawFrame(ctx,p,w/D.w,w,h,pd);res();return}drawFrame(ctx,p,w/D.w,w,h,t);pg.set((done+t)/total,`Recording… ${Math.round(done+t)} of ${Math.round(total)} s`);requestAnimationFrame(step)};step()});
    done+=pd;if(pg.cancelled)break}
  await wait(120);rec.stop();await stopped;stream.getTracks().forEach(t=>t.stop());
  if(pg.cancelled)return null;
  const type=mime.split(';')[0];return {blob:new Blob(chunks,{type}),ext:type==='video/mp4'?'mp4':'webm'};
}
async function makeGif(pgs,pg){
  const G=window.GIFENC;if(!G)throw new Error('GIF encoder did not load');
  const {w,h}=evenSize(720),cv=document.createElement('canvas');cv.width=w;cv.height=h;const ctx=cv.getContext('2d',{willReadFrequently:true});
  const total=pgs.reduce((a,p)=>a+(pageHasAnim(p)?(p.dur||4):0),0);const fps=total?clamp(Math.floor(500/total),5,15):10;
  const enc_=G.GIFEncoder();let frames=0;const plan=pgs.reduce((a,p)=>a+(pageHasAnim(p)?Math.round((p.dur||4)*fps):1),0);
  for(const p of pgs){
    const n=pageHasAnim(p)?Math.round((p.dur||4)*fps):1,delay=pageHasAnim(p)?Math.round(1000/fps):Math.round((p.dur||4)*1000);
    for(let i=0;i<n;i++){if(pg.cancelled)return null;
      drawFrame(ctx,p,w/D.w,w,h,pageHasAnim(p)?i/fps:null);
      const px=ctx.getImageData(0,0,w,h).data,pal=G.quantize(px,256),idx=G.applyPalette(px,pal);
      enc_.writeFrame(idx,w,h,{palette:pal,delay});frames++;pg.set(frames/plan,`Frame ${frames} of ${plan}`);if(i%3===0)await wait(0)}
  }
  enc_.finish();return {blob:new Blob([enc_.bytes()],{type:'image/gif'}),ext:'gif'};
}

/* ---------- export ---------- */
let expo={fmt:'png',scale:1,pages:'cur',transp:false,q:.92,days:30};
const FMTS=[['png','PNG'],['jpg','JPG'],['webp','WebP'],['pdf','PDF'],['pdfv','PDF (vector)'],['svg','SVG'],['video','Video'],['gif','GIF'],['json','Project']];
async function makeExport(){
  commit();await ensureAssets();const base=baseName(),pgs=expo.pages==='all'?D.pages:[P()],f=expo.fmt;
  if(f==='json')return {name:base+'.json',blob:new Blob([JSON.stringify({v:1,name:D.name,w:D.w,h:D.h,pages:D.pages,assets:usedAssets()},(k,v)=>k[0]==='_'?undefined:v)],{type:'application/json'})};
  if(f==='pdf'){
    const {jsPDF}=window.jspdf||{};if(!jsPDF)throw new Error('PDF library did not load');
    const ori=D.w>=D.h?'l':'p',pdf=new jsPDF({orientation:ori,unit:'px',format:[D.w,D.h],hotfixes:['px_scaling'],compress:true});
    pgs.forEach((p,i)=>{if(i)pdf.addPage([D.w,D.h],ori);const c=renderPageTo(p,Math.min(expo.scale,2));pdf.addImage(c.toDataURL('image/jpeg',.92),'JPEG',0,0,D.w,D.h)});
    return {name:base+'.pdf',blob:pdf.output('blob')};
  }
  if(f==='svg'){await loadFonts(pgs);const svgs=pgs.map((p,i)=>pageSVG(p,'s'+i));
    if(svgs.length===1)return {name:base+'.svg',blob:new Blob([svgs[0]],{type:'image/svg+xml'})};
    const z=new JSZip();svgs.forEach((s,i)=>z.file(`${base}-${i+1}.svg`,s));return {name:base+'.zip',blob:await z.generateAsync({type:'blob'})};}
  if(f==='video'||f==='gif'){
    const pg=progress(f==='gif'?'Making your GIF':'Recording your video');
    try{const r=f==='gif'?await makeGif(pgs,pg):await recordVideo(pgs,pg);if(!r)return null;return {name:`${base}.${r.ext}`,blob:r.blob}}finally{pg.close()}
  }
  const mime={png:'image/png',jpg:'image/jpeg',webp:'image/webp'}[f];
  const make=async p=>{const c=renderPageTo(p,expo.scale,{transparent:expo.transp&&f==='png'});if(f==='jpg'){const x=document.createElement('canvas');x.width=c.width;x.height=c.height;const g=x.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,x.width,x.height);g.drawImage(c,0,0);return toBlob(x,mime,expo.q)}return toBlob(c,mime,expo.q)};
  if(pgs.length===1)return {name:`${base}.${f}`,blob:await make(pgs[0])};
  const z=new JSZip();for(let i=0;i<pgs.length;i++)z.file(`${base}-${i+1}.${f}`,await make(pgs[i]));
  return {name:base+'.zip',blob:await z.generateAsync({type:'blob'})};
}
function downloadBlob(name,blob){const a=el('a',{href:URL.createObjectURL(blob),download:name});document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)}
async function doExport(mode){
  try{
    if(expo.fmt==='pdfv'){commit();await ensureAssets();await printVector(expo.pages==='all'?D.pages:[P()]);return}
    if(mode==='copy'){commit();await ensureAssets();const b=await toBlob(renderPageTo(P(),expo.scale),'image/png');await navigator.clipboard.write([new ClipboardItem({'image/png':b})]);toast('Copied to clipboard');return}
    toast('Preparing…',60000);const r=await makeExport();toast('',1);if(!r)return;
    if(mode==='files'){await PUT().fs.write(`${DIR}/Exports/${r.name}`,r.blob,{createMissingParents:true,overwrite:true});toast('Saved to Files › Designs › Exports');return}
    if(mode==='share'){await createShare(r);return}
    downloadBlob(r.name,r.blob);toast('Saved '+r.name);
  }catch(e){toast('Export failed: '+(e&&e.message||e))}
}
const shareExt=n=>(n.split('.').pop()||'').toLowerCase();
async function createShare(r){
  if(!['png','jpg','webp','pdf','svg','gif','mp4','webm'].includes(shareExt(r.name))){toast('Pick a picture, PDF, SVG, GIF or video to share as a link');return}
  const res=await fetch(`/_local/design/share?ext=${shareExt(r.name)}&name=${enc(baseName())}&days=${expo.days}`,{method:'POST',credentials:'same-origin',headers:{'x-aos':'1','content-type':'application/octet-stream'},body:r.blob});
  const j=await res.json().catch(()=>({}));if(!res.ok)throw new Error(j.error||j.message||'Could not create the link');
  showLink(location.origin+j.path,j.exp);
}
function showLink(url,exp){
  const inp=el('input',{class:'f',readonly:true,value:url,'aria-label':'Share link',onfocus:e=>e.target.select()});
  openModal(el('div',{style:'display:grid;gap:14px'},dlgHead('Link ready'),inp,
    el('div',{class:'row'},el('button',{class:'btn pri grow',html:ic('copy',16)+' Copy link',onclick:async()=>{try{await navigator.clipboard.writeText(url);toast('Link copied')}catch(e){inp.select();toast('Press Ctrl+C to copy')}}}),el('button',{class:'btn grow',onclick:openLinks},'Manage links')),
    el('p',{class:'note'},`Anyone with this link can view it until ${new Date(exp).toLocaleDateString()}. They need to be able to reach this server's address.`)),true);
}
async function openLinks(){
  const body=el('div',{style:'display:grid;gap:12px'});openModal(body);body.append(dlgHead('Your share links'));
  let items=[];try{items=(await api('/design/shares')).items}catch(e){body.append(el('p',{class:'note'},e.message));return}
  if(!items.length)body.append(el('p',{class:'note'},'No links yet. Use Download › Create link.'));
  items.forEach(it=>{const url=location.origin+it.path;body.append(el('div',{class:'row',style:'border-bottom:1px solid var(--line);padding:6px 0;flex-wrap:wrap'},el('div',{class:'grow',style:'min-width:0'},el('b',{},it.name+'.'+it.ext),el('div',{class:'note'},`${(it.size/1024).toFixed(0)} KB · expires ${new Date(it.exp).toLocaleDateString()}`)),
    el('button',{class:'btn sm',onclick:async()=>{try{await navigator.clipboard.writeText(url);toast('Link copied')}catch(e){toast(url,6000)}}},'Copy'),el('button',{class:'btn sm danger',onclick:async()=>{await api('/design/unshare',{token:it.token});openLinks()}},'Remove')))});
}
function openExport(){
  commit();const body=el('div',{style:'display:grid;gap:14px'});
  const draw=()=>{body.innerHTML='';const f=expo.fmt,ras=['png','jpg','webp'].includes(f),anim=f==='video'||f==='gif';
    body.append(dlgHead('Download & share'),el('div',{class:'chips'},FMTS.map(([v,l])=>el('button',{class:'chip','aria-pressed':f===v,onclick:()=>{expo.fmt=v;draw()}},l))));
    if(ras||f==='pdf')body.append(el('div',{class:'row'},el('label',{style:'flex:0 0 70px'},'Size'),seg([{v:1,l:'1×'},{v:2,l:'2×'},{v:3,l:'3×'}].filter(x=>f!=='pdf'||x.v<3),()=>expo.scale,v=>{expo.scale=v;draw()}),el('span',{class:'note'},`${Math.round(D.w*expo.scale)} × ${Math.round(D.h*expo.scale)} px`)));
    if(D.pages.length>1&&f!=='json')body.append(el('div',{class:'row'},el('label',{style:'flex:0 0 70px'},'Pages'),seg([{v:'cur',l:'This page'},{v:'all',l:`All ${D.pages.length}`}],()=>expo.pages,v=>{expo.pages=v;draw()})));
    if(f==='png')body.append(el('div',{class:'row'},el('label',{style:'flex:0 0 70px'},'Background'),seg([{v:false,l:'As designed'},{v:true,l:'Transparent'}],()=>expo.transp,v=>{expo.transp=v})));
    if(f==='jpg'||f==='webp')body.append(slider('Quality',()=>expo.q*100,v=>expo.q=v/100,{min:40,max:100,suffix:'%'}));
    const notes={pdf:'PDF pages are high-resolution pictures of your design.',pdfv:'Text and shapes stay sharp and selectable. Your print window opens — choose “Save as PDF”.',svg:'Shapes, text and plain photos stay vector. Effects, filters and drawings are embedded as pictures. Text uses its font name, so install the fonts where you open it.',video:'Plays each page for its page length with its animations. MP4 where this browser can make it, otherwise WebM.',gif:'Looping GIF, up to 720 px wide.',json:'Saves everything, including uploaded images, so you can re-open it later.'};
    body.append(el('p',{class:'note'},notes[f]||(D.pages.length>1&&expo.pages==='all'?'Multiple pages are downloaded as a ZIP.':'Your file is made on this device.')));
    const mk=(cls,ico,t,mode)=>el('button',{class:'btn '+cls,html:ic(ico,16)+' '+t,onclick:async()=>{closeModal();await doExport(mode)}});
    if(f==='pdfv')body.append(el('div',{class:'row'},mk('pri grow','download','Open print window','download')));
    else{body.append(el('div',{class:'row',style:'flex-wrap:wrap'},mk('pri grow','download','Download','download'),mk('grow','folder','Save to Files','files')));
      if(['png','jpg','webp','pdf','svg','gif','video'].includes(f)&&expo.pages==='cur'||['video','gif'].includes(f)){
        body.append(el('div',{class:'row',style:'flex-wrap:wrap'},mk('grow','link','Create link','share'),el('select',{class:'f','aria-label':'Link lifetime',style:'flex:0 0 auto;width:auto',onchange:e=>expo.days=+e.target.value},[[7,'7 days'],[30,'30 days'],[90,'90 days'],[365,'1 year']].map(([v,l])=>el('option',{value:v,selected:expo.days===v},l))),el('button',{class:'btn sm',onclick:openLinks},'My links')))}
      if(ras&&navigator.clipboard&&window.ClipboardItem)body.append(el('button',{class:'btn',html:ic('copy',16)+' Copy image',onclick:()=>doExport('copy')}))}
  };
  draw();openModal(body,true);
}

/* ---------- present (animations play) ---------- */
function present(){
  commit();ensureAssets().then(()=>{
    let i=cur,t0=performance.now(),raf=0;const wrap=el('div',{id:'present'});const cv=el('canvas');const lab=el('span',{style:'min-width:54px;text-align:center'});
    const draw=()=>{const W=innerWidth,H=innerHeight,dp=devicePixelRatio||1,sc=Math.min(W/D.w,H/D.h)*dp;cv.width=Math.round(D.w*sc);cv.height=Math.round(D.h*sc);cv.style.width=cv.width/dp+'px';cv.style.height=cv.height/dp+'px';const x=cv.getContext('2d');x.scale(sc,sc);x.fillStyle='#fff';x.fillRect(0,0,D.w,D.h);const p=D.pages[i];drawPageContent(x,p,D.w,D.h,{s:sc,t:pageHasAnim(p)?(performance.now()-t0)/1000:null});lab.textContent=`${i+1} / ${D.pages.length}`};
    const loop=()=>{draw();raf=requestAnimationFrame(loop)};
    const go=d=>{const n=clamp(i+d,0,D.pages.length-1);if(n!==i){i=n;t0=performance.now()}};
    const end=()=>{cancelAnimationFrame(raf);document.removeEventListener('keydown',key,true);wrap.remove();try{document.fullscreenElement&&document.exitFullscreen()}catch(e){}};
    const key=e=>{if(e.key==='Escape'){e.stopPropagation();end()}else if(['ArrowRight','ArrowDown',' ','PageDown'].includes(e.key)){e.preventDefault();e.stopPropagation();go(1)}else if(['ArrowLeft','ArrowUp','PageUp'].includes(e.key)){e.preventDefault();e.stopPropagation();go(-1)}};
    document.addEventListener('keydown',key,true);
    wrap.append(cv,el('div',{class:'pc'},el('button',{'aria-label':'Previous',html:ic('left',18),onclick:()=>go(-1)}),lab,el('button',{'aria-label':'Next',html:ic('right',18),onclick:()=>go(1)}),el('button',{'aria-label':'Exit',html:ic('close',18),onclick:end})));
    cv.addEventListener('click',()=>go(1));document.body.append(wrap);loop();try{wrap.requestFullscreen&&wrap.requestFullscreen().catch(()=>{})}catch(e){}
  });
}

/* ---------- Magic (AI) through the OS's own AI settings ---------- */
function jsonOf(t){const m=String(t).match(/[\[{][\s\S]*[\]}]/);if(!m)throw new Error('The AI did not answer with data');return JSON.parse(m[0])}
async function aiSample(){
  if(!PUT()||!PUT().ai)return null;
  const s=async(input)=>{
    try{const msgs=Array.isArray(input)?input:String(input);const r=await PUT().ai.chat(msgs);const text=typeof r==='string'?r:(r&&r.message&&(typeof r.message.content==='string'?r.message.content:(r.message.content||[]).map(c=>c.text||'').join('')))||(r&&r.text)||String(r);return {text,truncated:false}}
    catch(e){throw Object.assign(new Error((e&&e.message)||'AI is not available'),{code:'ai_off'})}};
  s.json=async(input)=>jsonOf((await s(input)).text);
  return s;
}

/* ---------- hooks into the original panels & inspector ---------- */
function startFresh(){D=newDoc(1080,1080,'Untitled design');const t=buildTemplate(TEMPLATES[0],D.w,D.h);D.pages[0].bg=t.bg;D.pages[0].objs=t.objs}
async function openLaunchItems(items){
  const it=(items||[])[0];if(!it)return;
  try{
    if(/\.design$/i.test(it.name)){loadRec(Object.assign(JSON.parse(await it.text()),{_file:it.path}));return}
    if(/\.json$/i.test(it.name)){importRec(JSON.parse(await it.text()),it.name.replace(/\.\w+$/,''));return}
    if(/\.(png|jpe?g|webp|gif|svg)$/i.test(it.name)){const b=await it.read();const a=await ingestImage(new File([b],it.name,{type:b.type||'image/png'}));if(!a)return;
      const url=D.assets[a.id],k=Math.min(1,1920/Math.max(a.nw,a.nh)),w=Math.round(a.nw*k),h=Math.round(a.nh*k);commit();await saveDoc();
      D=newDoc(w,h,it.name.replace(/\.\w+$/,''));cur=0;sel=[];$('#title').value=D.name;resetHistory();fit();renderAll();
      const o=mkImage(newAsset(url),a.nw,a.nh);o.x=0;o.y=0;o.w=w;o.h=h;addObj(o);return}
  }catch(e){toast('Could not open '+it.name)}
}
(function boot(){
  renderRail();
  (async()=>{
    let rec=null;
    try{const last=localStorage.getItem('ds.last');if(last&&PUT())rec=await readDesign(last)}catch(e){}
    if(rec)loadRec(rec);else{startFresh();cur=0;$('#title').value=D.name;resetHistory();renderAll();fit()}
    ready=true;
    requestAnimationFrame(()=>{fit();renderStrip()});setTimeout(()=>{fit();renderStrip()},600);
    try{if(PUT()&&PUT().ui&&PUT().ui.onLaunchedWithItems)PUT().ui.onLaunchedWithItems(items=>openLaunchItems(items))}catch(e){}
    if(!rec)saveDoc();
  })();
})();
