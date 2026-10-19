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
const FONTS=['Rozha One','Tiro Devanagari Hindi','Yatra One','Great Vibes','Cinzel Decorative','Kalam','Hind','Teko','Noto Sans Tamil','Noto Sans Telugu','Noto Sans Malayalam','Noto Sans Bengali','Noto Sans Gurmukhi','Noto Sans Gujarati','Instrument Sans','Poppins','Montserrat','Raleway','Work Sans','Nunito','Quicksand','Fredoka','Oswald','Playfair Display','Lora','Merriweather','Roboto Slab','Cormorant Garamond','DM Serif Display','Abril Fatface','Anton','Bebas Neue','Archivo Black','Bricolage Grotesque','Righteous','Bangers','Pacifico','Lobster','Caveat','Dancing Script','Satisfy','Permanent Marker','Space Mono'];
const SIZES=[
{g:'Social media',n:'Instagram post',w:1080,h:1080},{g:'Social media',n:'Instagram portrait',w:1080,h:1350},{g:'Social media',n:'Instagram story',w:1080,h:1920},{g:'Social media',n:'WhatsApp status',w:1080,h:1920},{g:'Social media',n:'Facebook post',w:1200,h:630},{g:'Social media',n:'Facebook cover',w:1640,h:624},{g:'Social media',n:'Facebook ad',w:1200,h:628},{g:'Social media',n:'LinkedIn post',w:1200,h:1200},{g:'Social media',n:'LinkedIn banner',w:1584,h:396},{g:'Social media',n:'X / Twitter post',w:1600,h:900},{g:'Social media',n:'X / Twitter header',w:1500,h:500},{g:'Social media',n:'Pinterest pin',w:1000,h:1500},{g:'Social media',n:'YouTube thumbnail',w:1280,h:720},{g:'Social media',n:'YouTube channel art',w:2560,h:1440},{g:'Social media',n:'Twitch banner',w:1200,h:480},{g:'Social media',n:'Instagram highlight cover',w:1080,h:1920},{g:'Social media',n:'Podcast cover',w:1800,h:1800},
{g:'Video & presentations',n:'Presentation 16:9',w:1920,h:1080},{g:'Video & presentations',n:'Presentation 4:3',w:1600,h:1200},{g:'Video & presentations',n:'Video',w:1920,h:1080},{g:'Video & presentations',n:'Mobile video / Reel',w:1080,h:1920},{g:'Video & presentations',n:'Zoom background',w:1920,h:1080},{g:'Video & presentations',n:'Desktop wallpaper',w:1920,h:1080},{g:'Video & presentations',n:'Phone wallpaper',w:1170,h:2532},
{g:'Cards & invitations',n:'Invitation 5×7 in',w:1050,h:1470},{g:'Cards & invitations',n:'Wedding invitation',w:1050,h:1470},{g:'Cards & invitations',n:'Greeting card',w:1050,h:1470},{g:'Cards & invitations',n:'Postcard',w:1200,h:800},{g:'Cards & invitations',n:'Business card',w:1050,h:600},{g:'Cards & invitations',n:'Thank-you card',w:1050,h:750},{g:'Cards & invitations',n:'Gift certificate',w:1800,h:800},{g:'Cards & invitations',n:'Event ticket',w:1650,h:600},{g:'Cards & invitations',n:'Name tag',w:900,h:1200},{g:'Cards & invitations',n:'Bookmark',w:600,h:1800},
{g:'Print & documents',n:'A4 document',w:1240,h:1754},{g:'Print & documents',n:'A4 landscape',w:1754,h:1240},{g:'Print & documents',n:'US Letter',w:1275,h:1650},{g:'Print & documents',n:'Resume',w:1240,h:1754},{g:'Print & documents',n:'Invoice',w:1240,h:1754},{g:'Print & documents',n:'Letterhead',w:1240,h:1754},{g:'Print & documents',n:'Certificate',w:1754,h:1240},{g:'Print & documents',n:'Menu',w:1240,h:1754},{g:'Print & documents',n:'Brochure',w:1754,h:1240},{g:'Print & documents',n:'Flyer A5',w:874,h:1240},{g:'Print & documents',n:'Flyer A4',w:1240,h:1754},{g:'Print & documents',n:'Poster A3',w:1754,h:2480},{g:'Print & documents',n:'Poster 18×24 in',w:1800,h:2400},{g:'Print & documents',n:'Wall calendar',w:1240,h:1754},{g:'Print & documents',n:'Planner page',w:1240,h:1754},{g:'Print & documents',n:'Worksheet',w:1240,h:1754},{g:'Print & documents',n:'Infographic',w:800,h:2000},{g:'Print & documents',n:'Book cover',w:1600,h:2560},{g:'Print & documents',n:'Album cover',w:1800,h:1800},{g:'Print & documents',n:'Banner 2:1',w:2400,h:1200},
{g:'Marketing & brand',n:'Logo',w:800,h:800},{g:'Marketing & brand',n:'Sticker',w:1000,h:1000},{g:'Marketing & brand',n:'Label',w:900,h:900},{g:'Marketing & brand',n:'T-shirt print',w:2400,h:2880},{g:'Marketing & brand',n:'Mug wrap',w:2700,h:1100},{g:'Marketing & brand',n:'Photo collage',w:1080,h:1080},{g:'Marketing & brand',n:'Mood board',w:1920,h:1080},{g:'Marketing & brand',n:'Email header',w:1200,h:400},{g:'Marketing & brand',n:'Website hero',w:1920,h:800},{g:'Marketing & brand',n:'Web banner 728×90',w:728,h:90},{g:'Marketing & brand',n:'Etsy shop banner',w:3360,h:840}
];
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

const FONT_GROUPS={"Handwriting": ["Amatic SC", "Annie Use Your Telescope", "Architects Daughter", "Bad Script", "Cabin Sketch", "Caveat", "Caveat Brush", "Cedarville Cursive", "Charm", "Charmonman", "Comic Neue", "Coming Soon", "Covered By Your Grace", "Dekko", "Delicious Handrawn", "Edu NSW ACT Foundation", "Fuzzy Bubbles", "Gaegu", "Gamja Flower", "Give You Glory", "Gloria Hallelujah", "Gochi Hand", "Grape Nuts", "Hachi Maru Pop", "Handlee", "Homemade Apple", "Indie Flower", "Itim", "Julee", "Just Another Hand", "Just Me Again Down Here", "Kalam", "Klee One", "Kranky", "Kristi", "La Belle Aurore", "Londrina Sketch", "Londrina Solid", "Loved by the King", "Mali", "Mansalva", "Marck Script", "Merienda", "Mynerve", "Nanum Brush Script", "Nanum Pen Script", "Neucha", "Nothing You Could Do", "Oooh Baby", "Over the Rainbow", "Pangolin", "Patrick Hand", "Permanent Marker", "Playpen Sans", "Rancho", "Redressed", "Reenie Beanie", "Rock Salt", "Rubik Scribble", "Sacramento", "Schoolbell", "Sedgwick Ave", "Shadows Into Light", "Shantell Sans", "Short Stack", "Sriracha", "Sue Ellen Francisco", "Swanky and Moo Moo", "The Girl Next Door", "Waiting for the Sunrise", "Walter Turncoat", "Yomogi", "Zeyada"], "Script & calligraphy": ["Alex Brush", "Allura", "Arizonia", "Babylonica", "Ballet", "Birthstone", "Birthstone Bounce", "Carattere", "Comforter", "Cookie", "Corinthia", "Courgette", "Damion", "Dancing Script", "Ephesis", "Estonia", "Euphoria Script", "Explora", "Fuggles", "Great Vibes", "Grey Qo", "Gwendolyn", "Herr Von Muellerhoff", "Hurricane", "Imperial Script", "Inspiration", "Island Moments", "Italianno", "Kaushan Script", "Kolker Brush", "Leckerli One", "Licorice", "Lobster", "Lobster Two", "Lovers Quarrel", "Luxurious Script", "Mea Culpa", "Meddon", "Monsieur La Doulaise", "Moon Dance", "Mr Dafoe", "Mrs Saint Delafield", "Niconne", "Norican", "Ole", "Pacifico", "Parisienne", "Passions Conflict", "Petit Formal Script", "Pinyon Script", "Playball", "Qwigley", "Rouge Script", "Satisfy", "Seaweed Script", "Send Flowers", "Sofia", "Splash", "Square Peg", "Style Script", "Tangerine", "Tapestry", "The Nautigal", "Updock", "Vujahday Script", "Water Brush", "Waterfall", "Whisper", "Yellowtail", "Yesteryear"], "Display & bold": ["Abril Fatface", "Alfa Slab One", "Anton", "Archivo Black", "Audiowide", "Baloo 2", "Bangers", "Bebas Neue", "Bevan", "Big Shoulders Display", "Black Ops One", "Bowlby One", "Bungee", "Bungee Shade", "Carter One", "Ceviche One", "Chango", "Chewy", "Cinzel", "Cinzel Decorative", "Climate Crisis", "Coiny", "Concert One", "Creepster", "Dela Gothic One", "Emilys Candy", "Ewert", "Fascinate", "Faster One", "Fjalla One", "Fredericka the Great", "Fredoka", "Fugaz One", "Gloock", "Knewave", "League Spartan", "Lemon", "Lilita One", "Limelight", "Luckiest Guy", "Michroma", "Mochiy Pop One", "Modak", "Monoton", "Oi", "Orbitron", "Oswald", "Passion One", "Pathway Gothic One", "Paytone One", "Press Start 2P", "Rammetto One", "Rampart One", "Righteous", "Rubik Glitch", "Rubik Mono One", "Russo One", "Sansita", "Shrikhand", "Sigmar One", "Special Elite", "Squada One", "Staatliches", "Syne", "Teko", "Titan One", "Ultra", "Unbounded", "Vast Shadow"], "Serif": ["Alegreya", "Arvo", "Bitter", "Bodoni Moda", "Cardo", "Cormorant", "Cormorant Garamond", "Cormorant Infant", "Crimson Text", "DM Serif Display", "Domine", "EB Garamond", "Frank Ruhl Libre", "Fraunces", "Gelasio", "Ibarra Real Nova", "Instrument Serif", "Libre Baskerville", "Libre Bodoni", "Libre Caslon Text", "Lora", "Marcellus", "Merriweather", "Newsreader", "Noto Serif", "Old Standard TT", "Playfair Display", "Playfair Display SC", "Prata", "Roboto Slab", "Rufina", "Source Serif 4", "Spectral", "Vollkorn", "Young Serif", "Zilla Slab"], "Sans serif": ["Albert Sans", "Archivo", "Asap", "Barlow", "Barlow Condensed", "Be Vietnam Pro", "Bricolage Grotesque", "Cabin", "Commissioner", "DM Sans", "Epilogue", "Exo 2", "Familjen Grotesk", "Figtree", "Golos Text", "Hanken Grotesk", "Heebo", "IBM Plex Sans", "Instrument Sans", "Inter", "Josefin Sans", "Jost", "Karla", "Kumbh Sans", "Lato", "Lexend", "Lexend Deca", "Manrope", "Montserrat", "Mulish", "Noto Sans", "Nunito", "Onest", "Open Sans", "Outfit", "Overpass", "Plus Jakarta Sans", "Public Sans", "Quicksand", "Raleway", "Readex Pro", "Red Hat Display", "Roboto", "Rubik", "Schibsted Grotesk", "Sora", "Source Sans 3", "Space Grotesk", "Titillium Web", "Ubuntu", "Urbanist", "Work Sans"], "Indian & regional": ["Amita", "Anek Bangla", "Anek Devanagari", "Anek Gujarati", "Anek Gurmukhi", "Anek Kannada", "Anek Malayalam", "Anek Tamil", "Anek Telugu", "Arya", "Baloo Bhai 2", "Baloo Bhaina 2", "Baloo Chettan 2", "Baloo Paaji 2", "Baloo Tamma 2", "Baloo Thambi 2", "Biryani", "Cambay", "Catamaran", "Chilanka", "Eczar", "Gidugu", "Halant", "Hind", "Hind Madurai", "Hind Siliguri", "Hind Vadodara", "Karma", "Khand", "Kurale", "Laila", "Mandali", "Manjari", "Martel", "Meera Inimai", "Mukta", "Noto Sans Bengali", "Noto Sans Devanagari", "Noto Sans Gujarati", "Noto Sans Gurmukhi", "Noto Sans Kannada", "Noto Sans Malayalam", "Noto Sans Oriya", "Noto Sans Tamil", "Noto Sans Telugu", "Noto Serif Devanagari", "Noto Serif Tamil", "Noto Serif Telugu", "Palanquin", "Pavanam", "Poppins", "Pragati Narrow", "Rajdhani", "Ramabhadra", "Rozha One", "Sahitya", "Sura", "Suranna", "Tillana", "Tiro Devanagari Hindi", "Vesper Libre", "Yantramanav", "Yatra One"], "Monospace": ["Courier Prime", "DM Mono", "Fira Code", "IBM Plex Mono", "Inconsolata", "JetBrains Mono", "Roboto Mono", "Source Code Pro", "Space Mono"]};
FONTS.push(...(["Patrick Hand", "Indie Flower", "Shadows Into Light", "Gloria Hallelujah", "Reenie Beanie", "Covered By Your Grace", "Homemade Apple", "Nanum Pen Script", "Rock Salt", "Just Another Hand", "Architects Daughter", "Sue Ellen Francisco", "Coming Soon", "Schoolbell", "Handlee", "Neucha", "Gaegu", "Gochi Hand", "Amatic SC", "Sriracha", "Itim", "Mansalva", "Nothing You Could Do", "Over the Rainbow", "La Belle Aurore", "Zeyada", "Waiting for the Sunrise", "The Girl Next Door", "Swanky and Moo Moo", "Cedarville Cursive", "Dekko", "Kristi", "Loved by the King", "Short Stack", "Annie Use Your Telescope", "Walter Turncoat", "Sedgwick Ave", "Just Me Again Down Here", "Rancho", "Delicious Handrawn", "Caveat Brush", "Shantell Sans", "Fuzzy Bubbles", "Playpen Sans", "Edu NSW ACT Foundation", "Gamja Flower", "Nanum Brush Script", "Yomogi", "Klee One", "Marck Script", "Bad Script", "Merienda", "Mynerve", "Oooh Baby", "Comic Neue", "Grape Nuts", "Give You Glory", "Londrina Solid", "Hachi Maru Pop", "Redressed", "Londrina Sketch", "Rubik Scribble", "Kranky", "Cabin Sketch", "Julee", "Charm", "Charmonman", "Mali", "Pangolin", "Sacramento", "Allura", "Alex Brush", "Parisienne", "Tangerine", "Italianno", "Pinyon Script", "Monsieur La Doulaise", "Rouge Script", "Yesteryear", "Courgette", "Kaushan Script", "Norican", "Playball", "Cookie", "Damion", "Leckerli One", "Sofia", "Lobster Two", "Style Script", "Yellowtail", "Mr Dafoe", "Arizonia", "Euphoria Script", "Herr Von Muellerhoff", "Niconne", "Petit Formal Script", "Meddon", "Mrs Saint Delafield", "Seaweed Script", "Birthstone", "Mea Culpa", "Whisper", "Comforter", "Explora", "Estonia", "Fuggles", "Gwendolyn", "Send Flowers", "Splash", "Waterfall", "Updock", "Vujahday Script", "Ballet", "Qwigley", "Hurricane", "Licorice", "Ole", "Square Peg", "Water Brush", "Imperial Script", "Corinthia", "Birthstone Bounce", "Carattere", "Ephesis", "Luxurious Script", "The Nautigal", "Island Moments", "Inspiration", "Moon Dance", "Passions Conflict", "Grey Qo", "Lovers Quarrel", "Tapestry", "Kolker Brush", "Babylonica", "Bungee", "Lilita One", "Luckiest Guy", "Bowlby One", "Fugaz One", "Monoton", "Shrikhand", "Chewy", "Black Ops One", "Alfa Slab One", "Ultra", "Titan One", "Paytone One", "Passion One", "Russo One", "Squada One", "Staatliches", "Fredericka the Great", "Cinzel", "Limelight", "Rubik Mono One", "Press Start 2P", "Special Elite", "Creepster", "League Spartan", "Syne", "Unbounded", "Gloock", "Rammetto One", "Modak", "Baloo 2", "Concert One", "Sansita", "Chango", "Bungee Shade", "Rampart One", "Big Shoulders Display", "Oi", "Climate Crisis", "Rubik Glitch", "Faster One", "Audiowide", "Orbitron", "Michroma", "Bevan", "Vast Shadow", "Sigmar One", "Knewave", "Ewert", "Emilys Candy", "Fascinate", "Lemon", "Mochiy Pop One", "Dela Gothic One", "Carter One", "Ceviche One", "Coiny", "Fjalla One", "Pathway Gothic One", "Libre Baskerville", "Crimson Text", "EB Garamond", "Spectral", "Bitter", "Cardo", "Zilla Slab", "Cormorant", "Cormorant Infant", "Libre Caslon Text", "Source Serif 4", "Noto Serif", "Frank Ruhl Libre", "Vollkorn", "Old Standard TT", "Prata", "Bodoni Moda", "Fraunces", "Newsreader", "Gelasio", "Rufina", "Marcellus", "Playfair Display SC", "Young Serif", "Instrument Serif", "Libre Bodoni", "Ibarra Real Nova", "Alegreya", "Domine", "Arvo", "Inter", "DM Sans", "Manrope", "Space Grotesk", "Lexend", "Urbanist", "Figtree", "Epilogue", "Rubik", "Barlow", "Barlow Condensed", "Josefin Sans", "Outfit", "Plus Jakarta Sans", "Sora", "Jost", "Mulish", "Karla", "Open Sans", "Lato", "Roboto", "Noto Sans", "Source Sans 3", "Ubuntu", "Cabin", "Titillium Web", "Exo 2", "Albert Sans", "Red Hat Display", "Be Vietnam Pro", "Public Sans", "IBM Plex Sans", "Archivo", "Overpass", "Hanken Grotesk", "Onest", "Readex Pro", "Schibsted Grotesk", "Familjen Grotesk", "Golos Text", "Kumbh Sans", "Lexend Deca", "Asap", "Heebo", "Commissioner", "Amita", "Sahitya", "Laila", "Tillana", "Sura", "Eczar", "Khand", "Rajdhani", "Pragati Narrow", "Mukta", "Martel", "Arya", "Palanquin", "Yantramanav", "Kurale", "Karma", "Halant", "Vesper Libre", "Biryani", "Cambay", "Noto Serif Devanagari", "Noto Sans Devanagari", "Noto Serif Tamil", "Noto Serif Telugu", "Noto Sans Kannada", "Noto Sans Oriya", "Anek Devanagari", "Baloo Bhai 2", "Baloo Tamma 2", "Baloo Chettan 2", "Baloo Thambi 2", "Baloo Paaji 2", "Baloo Bhaina 2", "Hind Siliguri", "Hind Madurai", "Hind Vadodara", "Mandali", "Ramabhadra", "Gidugu", "Suranna", "Pavanam", "Meera Inimai", "Catamaran", "Chilanka", "Manjari", "Anek Tamil", "Anek Malayalam", "Anek Bangla", "Anek Telugu", "Anek Gujarati", "Anek Kannada", "Anek Gurmukhi", "JetBrains Mono", "IBM Plex Mono", "Fira Code", "Courier Prime", "DM Mono", "Roboto Mono", "Source Code Pro", "Inconsolata"]));
const fontIO=typeof IntersectionObserver!=='undefined'?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){const b=e.target;b.style.fontFamily=`"${b.dataset.f}",sans-serif`;fontIO.unobserve(b)}}),{rootMargin:'120px'}):null;
function fontButtons(box,query,current,pick){box.innerHTML='';const q=(query||'').toLowerCase();let any=false;
  for(const [g,list] of Object.entries(FONT_GROUPS)){const fl=list.filter(f=>!q||f.toLowerCase().includes(q)||(g.toLowerCase().includes(q)));if(!fl.length)continue;any=true;
    box.append(el('p',{class:'note',style:'margin:8px 0 2px;font-weight:600'},g+' · '+fl.length));
    fl.forEach(f=>{const b=el('button',{'aria-pressed':f===current,'data-f':f,onclick:()=>pick(f)},f);if(fontIO)fontIO.observe(b);else b.style.fontFamily=`"${f}",sans-serif`;box.append(b)})}
  if(!any)box.append(el('p',{class:'note'},'No fonts match.'))}

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
  if(o.fill){ctx.fillStyle=paint(ctx,o.fill,o.w,o.h);ctx.fill(p,(o.kind==='ring'||String(o.kind).startsWith('ic_'))?'evenodd':'nonzero')}
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
    const fs=filterStr(o,opt.s||1);if(o.duo&&o.duo.a&&typeof duoDraw==='function')duoDraw(ctx,img,o,dx,dy,dw,dh,fs);else{if(fs!=='none')ctx.filter=fs;ctx.drawImage(img,dx,dy,dw,dh);ctx.filter='none'}
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
  if(typeof drawPrintGuides==='function'){drawPrintGuides(ctx,z);drawCommentPins(ctx,z)}
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
  if(typeof placeComment==='function'&&placeComment(e))return;
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
uiEl.addEventListener('contextmenu',e=>canvasMenu(e));
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
    const id='a_'+uid();D.assets[id]=url;(D.uploads||(D.uploads=[])).push(id);if(typeof libSave==='function')libSave(url,'upload');return {id,nw,nh};
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
  const draw=()=>fontButtons(list,q.value,current,f=>{pick(f);closePop()});
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
  if(types.has('image'))b.append(...imageInsp(),...(one&&one.type==='image'?[bgInsp(one),magicInsp(one)]:[]));
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
    duoUI(I),paletteUI(I),
    el('button',{class:'btn sm',onclick:()=>{each(x=>{x.flt={};x.fp='none';x.vig=0;x.tintv=0;x.duo=null},I);renderInsp()}},'Reset filters')));
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
  out.push(linkUI(so));
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
  out.push(pageExtras());
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
let tplCat="All";let fontsT=0;try{document.fonts.addEventListener('loadingdone',()=>{if(tab!=='tpl')return;clearTimeout(fontsT);fontsT=setTimeout(renderPanel,250)})}catch(e){}

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
  const q=searchBox('Search icons, frames, shapes, stickers',()=>{});const fq=$('input',q);
  b.append(q);
  const body=el('div',{style:'display:grid;gap:14px'});b.append(body);
  const draw=()=>{body.innerHTML='';const s=fq.value.toLowerCase();
    const shp=SHAPE_LIST.filter(([k,n])=>!s||n.toLowerCase().includes(s));
    if(shp.length)body.append(el('div',{},el('h4',{class:'sh'},'Shapes'),el('div',{class:'grid5'},shp.map(([k,n])=>el('button',{class:'cell',title:n,'aria-label':n,html:shapeIcon(k),onclick:()=>addObj(mkShape(k,k==='ring'||k==='check'?{}:{}))})))));
    if(!s||'line arrow'.includes(s))body.append(el('div',{},el('h4',{class:'sh'},'Lines'),el('div',{class:'grid4'},[['solid','none','none'],['dash','none','none'],['solid','none','arrow'],['solid','dot','arrow']].map(([d,a0,a1])=>el('button',{class:'cell',style:'aspect-ratio:2/1',title:'Line','aria-label':'Line',html:`<svg viewBox="0 0 60 20"><line x1="${a0==='dot'?10:4}" y1="10" x2="${a1==='arrow'?48:56}" y2="10" stroke="currentColor" stroke-width="3" ${d==='dash'?'stroke-dasharray="7 5"':''}/>${a1==='arrow'?'<path d="M46 3l10 7-10 7z" fill="currentColor"/>':''}${a0==='dot'?'<circle cx="6" cy="10" r="3" fill="currentColor"/>':''}</svg>`,onclick:()=>addObj(mkLine({dash:d,a0,a1}))})))));
    {const fs_=framesSection(s),ms_=mockupsSection(s),is_=iconsSection(s),cl_=collageSection(s);if(is_)body.append(is_);if(cl_)body.append(cl_);if(fs_)body.append(fs_);if(ms_)body.append(ms_)}
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
  fontButtons(fl,'',null,f=>{const t=selObjs().filter(o=>o.type==='text');if(t.length){t.forEach(o=>o.font=f);touch();renderInsp()}else add(f,{font:f,size:Math.round(90*u),w:D.w*.7})});
}

/* ---------- uploads ---------- */
function pUploads(b){
  b.append(el('h3',{class:'ph'},'Uploads'));
  const dz=el('div',{class:'drop'},el('span',{html:ic('upload',26)}),el('div',{},'Drop images here, paste them, or'),el('button',{class:'btn pri',onclick:()=>pickFile('add')},'Upload images'),el('span',{class:'note'},'PNG, JPG, WebP, SVG, GIF'));
  ['dragover','dragenter'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.add('over')}));dz.addEventListener('dragleave',()=>dz.classList.remove('over'));
  dz.addEventListener('drop',async e=>{e.preventDefault();dz.classList.remove('over');for(const f of [...e.dataTransfer.files].filter(f=>f.type.startsWith('image/')))await addImageFile(f)});
  b.append(dz);
  const libBox=el('div',{style:'display:grid;gap:8px'});b.append(libBox);
  drawLibrary(libBox);
  const ups=(D.uploads||[]).filter(id=>D.assets[id]);
  if(ups.length){b.append(el('h4',{class:'sh'},'In this design'),el('div',{class:'grid3'},ups.map(id=>el('button',{class:'cell',style:'aspect-ratio:1;padding:0;overflow:hidden',title:'Add to design','aria-label':'Add image to design',onclick:()=>{const i=getImg(id);const go=()=>addImageAsset({id,nw:i.naturalWidth,nh:i.naturalHeight});i.complete&&i.naturalWidth?go():i.addEventListener('load',go,{once:true})}},el('img',{src:D.assets[id],alt:'',style:'width:100%;height:100%;object-fit:cover'})))))}
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
  b.append(el('h3',{class:'ph'},'Brand kit'),el('p',{class:'note'},'Saved in this browser and used across every design.'),kitsUI(()=>renderPanel()));
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
  b.append(el('h3',{class:'ph'},'Magic'));b.append(el('div',{class:'sec'},el('h4',{},'Magic Studio'),el('div',{class:'grid2'},el('button',{class:'btn',html:ic('image',16)+' Magic Media',onclick:()=>openMagicMedia()}),el('button',{class:'btn',html:ic('bg',16)+' BG Generator',onclick:()=>openBgGenerator()})),el('p',{class:'note'},'Select a picture in your design to also use Magic Eraser, Magic Edit, Upscale, Magic Layers and Image to video.')));
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
  commit();saveDoc();D=newDoc(w,h,name);cur=0;sel=[];$('#title').value=D.name;resetHistory();fit();renderAll();closeModal();openTab('tpl');hideHome();
}
function openNew(){
  const cw=el('input',{class:'f',type:'number',value:1080,min:20,max:8000,'aria-label':'Width'}),ch=el('input',{class:'f',type:'number',value:1080,min:20,max:8000,'aria-label':'Height'});
  const q=el('input',{class:'f',type:'search',placeholder:'Search design types, e.g. resume, story, certificate','aria-label':'Search design types'}),list=el('div',{style:'display:grid;gap:14px;max-height:52vh;overflow:auto;padding-right:4px'});
  const draw=()=>{list.innerHTML='';const s=q.value.trim().toLowerCase();const groups=[...new Set(SIZES.map(x=>x.g))];groups.forEach(g=>{const items=SIZES.filter(x=>x.g===g&&(!s||x.n.toLowerCase().includes(s)||g.toLowerCase().includes(s)));if(!items.length)return;list.append(el('div',{},el('h4',{class:'sh'},g),el('div',{class:'sizes'},items.map(x=>el('button',{onclick:()=>newDesign(x.w,x.h,x.n)},el('b',{},x.n),el('small',{},`${x.w} × ${x.h} px`))))))});if(!list.children.length)list.append(el('p',{class:'note'},'No design type matches that. Use a custom size below.'))};
  q.addEventListener('input',draw);draw();
  openModal(el('div',{style:'display:grid;gap:16px'},dlgHead('Create a design'),q,list,
    el('div',{class:'row'},el('label',{style:'flex:0 0 auto'},'Custom size'),cw,el('span',{},'×'),ch,el('button',{class:'btn pri',onclick:()=>newDesign(clamp(+cw.value||1080,20,8000),clamp(+ch.value||1080,20,8000),'Custom design')},'Create'))));
  setTimeout(()=>q.focus(),30);
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
$('#btnExport').onclick=openExport;$('#btnPresent').onclick=present;$('#btnHome').onclick=showHome;$('#btnNew').onclick=openNew;
$('#title').addEventListener('input',e=>{D.name=e.target.value;dirty=true;clearTimeout(hTimer);hTimer=setTimeout(commit,320);clearTimeout(saveT);saveT=setTimeout(saveDoc,900)});
$('#btnTheme').onclick=()=>{const r=document.documentElement;const dark=r.dataset.theme?r.dataset.theme==='dark':matchMedia('(prefers-color-scheme:dark)').matches;const n=dark?'light':'dark';r.dataset.theme=n;try{localStorage.setItem('ds.theme',n)}catch(e){}$('#btnTheme').innerHTML=ic(n==='dark'?'sun':'moon',18);renderUI();render()};
try{const t=localStorage.getItem('ds.theme');if(t)document.documentElement.dataset.theme=t}catch(e){}
{const r=document.documentElement;const dark=r.dataset.theme?r.dataset.theme==='dark':matchMedia('(prefers-color-scheme:dark)').matches;$('#btnTheme').innerHTML=ic(dark?'sun':'moon',18)}
$('#btnUndo').innerHTML=ic('undo',18);$('#btnRedo').innerHTML=ic('redo',18);$('#zIn').innerHTML=ic('plus',16);$('#zOut').innerHTML=ic('minus',16);
$('#btnPresent').innerHTML=ic('play',16)+'<span class="hide-sm"> Present</span>';$('#btnExport').innerHTML=ic('download',16)+'<span> Download</span>';$('#btnNew').innerHTML=ic('plus',16)+'<span class="hide-sm"> New</span>';
$('#hint').textContent='Double-click text to edit · Space+drag to pan · Ctrl+scroll to zoom · ? for shortcuts';

window.addEventListener('beforeunload',()=>{commit();saveDoc()});
document.fonts&&document.fonts.ready.then(()=>{render();renderStrip()});

/* ---------- illustration library: parametric SVG art used by templates ---------- */
const ART={},ARTAR={};
const f2=n=>Math.round(n*100)/100;
const rot=(a,cx,cy)=>`transform="rotate(${a} ${cx} ${cy})"`;
function prng(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296}}
function petalPath(cx,cy,r1,r2,wd){return `M${cx} ${cy-r1} C${cx+wd} ${cy-r1-(r2-r1)*.15} ${cx+wd*.7} ${cy-r2+(r2-r1)*.3} ${cx} ${cy-r2} C${cx-wd*.7} ${cy-r2+(r2-r1)*.3} ${cx-wd} ${cy-r1-(r2-r1)*.15} ${cx} ${cy-r1}Z`}
function ring(n,fn){let s='';for(let i=0;i<n;i++)s+=fn(360/n*i,i);return s}
const DEF=(id,stops,type='radial',extra='')=>`<${type}Gradient id="${id}" ${extra}>${stops.map(([o,c,op])=>`<stop offset="${o}" stop-color="${c}"${op!=null?` stop-opacity="${op}"`:''}/>`).join('')}</${type}Gradient>`;
function reg(name,ar,fn){ART[name]=fn;ARTAR[name]=ar}

reg('mandala',1,c=>{const [a,b,l]=c;let s='';
  s+=`<circle cx="50" cy="50" r="49" fill="none" stroke="${a}" stroke-width=".6"/><circle cx="50" cy="50" r="46.5" fill="none" stroke="${a}" stroke-width=".3" stroke-dasharray="1 1.6"/>`;
  s+=ring(36,(g)=>`<circle cx="50" cy="3.5" r=".9" fill="${b}" ${rot(g,50,50)}/>`);
  s+=ring(24,(g)=>`<path d="${petalPath(50,50,38,49,5)}" fill="none" stroke="${a}" stroke-width=".7" ${rot(g,50,50)}/>`);
  s+=ring(16,(g)=>`<path d="${petalPath(50,50,28,43,7.5)}" fill="${b}" fill-opacity=".9" stroke="${a}" stroke-width=".5" ${rot(g,50,50)}/>`);
  s+=ring(16,(g)=>`<circle cx="50" cy="19" r="1.5" fill="${l}" ${rot(g,50,50)}/>`);
  s+=ring(12,(g)=>`<path d="${petalPath(50,50,17,33,8)}" fill="${a}" ${rot(g,50,50)}/>`);
  s+=ring(12,(g)=>`<path d="${petalPath(50,50,22,29,3)}" fill="${l}" ${rot(g,50,50)}/>`);
  s+=ring(8,(g)=>`<path d="${petalPath(50,50,8,22,6)}" fill="${l}" stroke="${b}" stroke-width=".5" ${rot(g,50,50)}/>`);
  s+=`<circle cx="50" cy="50" r="8" fill="${b}"/><circle cx="50" cy="50" r="5" fill="${a}"/><circle cx="50" cy="50" r="2" fill="${l}"/>`;
  return s});
reg('rangoli',1,c=>{let s='';const n=c.length;
  s+=ring(40,(g)=>`<circle cx="50" cy="2.5" r="1.1" fill="${c[0]}" ${rot(g,50,50)}/>`);
  s+=ring(20,(g,i)=>`<path d="${petalPath(50,50,36,48,6)}" fill="${c[i%n]}" ${rot(g,50,50)}/>`);
  s+=ring(20,(g,i)=>`<circle cx="50" cy="13" r="1.6" fill="${c[(i+2)%n]}" ${rot(g,50,50)}/>`);
  s+=ring(12,(g,i)=>`<path d="${petalPath(50,50,22,38,9)}" fill="${c[(i+1)%n]}" stroke="#fff" stroke-opacity=".5" stroke-width=".4" ${rot(g,50,50)}/>`);
  s+=ring(12,(g,i)=>`<path d="${petalPath(50,50,26,34,3.5)}" fill="${c[(i+3)%n]}" ${rot(g,50,50)}/>`);
  s+=ring(8,(g,i)=>`<path d="${petalPath(50,50,8,24,7)}" fill="${c[(i+2)%n]}" ${rot(g,50,50)}/>`);
  s+=ring(8,(g,i)=>`<circle cx="50" cy="38" r="1.7" fill="#fff" fill-opacity=".85" ${rot(g,50,50)}/>`);
  s+=`<circle cx="50" cy="50" r="7" fill="${c[0]}"/><circle cx="50" cy="50" r="4" fill="${c[n-1]}"/><circle cx="50" cy="50" r="1.6" fill="#fff"/>`;return s});
reg('diya',.82,c=>{const [fl,body,glow]=c,dk='#00000030';
  return `<defs>${DEF('g',[[0,glow,.95],[1,glow,0]])}${DEF('f',[[0,'#fff6c8'],[.5,fl],[1,fl,.9]],'linear','x1="0" y1="1" x2="0" y2="0"')}</defs>
  <circle cx="50" cy="26" r="26" fill="url(#g)"/>
  <path d="M50 4C60 18 66 28 50 40 34 28 40 18 50 4Z" fill="url(#f)"/><path d="M50 18c4 7 6 11 0 17-6-6-4-10 0-17Z" fill="#fffbe6" opacity=".95"/>
  <path d="M49 38h2v6h-2z" fill="#4a2c18"/>
  <path d="M6 46C12 46 18 52 22 56 30 66 40 72 50 72 60 72 70 66 78 56 82 52 88 46 94 46 92 64 74 78 50 78 26 78 8 64 6 46Z" fill="${body}"/>
  <path d="M6 46C12 46 18 52 22 56 30 66 40 72 50 72 60 72 70 66 78 56 82 52 88 46 94 46 92 64 74 78 50 78 26 78 8 64 6 46Z" fill="${dk}"/>
  <ellipse cx="50" cy="48" rx="36" ry="7" fill="${body}"/><ellipse cx="50" cy="48" rx="31" ry="5" fill="#2b1608"/><ellipse cx="50" cy="47" rx="28" ry="3.6" fill="${fl}" opacity=".55"/>
  ${[26,38,50,62,74].map(x=>`<circle cx="${x}" cy="67" r="1.7" fill="${fl}"/>`).join('')}`});
reg('lotus',.72,c=>{const [a,b,l]=c;let s='';
  const pet=(ang,len,wd,fill,op)=>`<path d="M50 70C${50-wd} ${70-len*.35} ${50-wd*.7} ${70-len*.8} 50 ${70-len} ${50+wd*.7} ${70-len*.8} ${50+wd} ${70-len*.35} 50 70Z" fill="${fill}" fill-opacity="${op}" stroke="${l}" stroke-width=".5" ${rot(ang,50,70)}/>`;
  [-72,72].forEach(g=>s+=pet(g,48,17,b,.95));[-48,48].forEach(g=>s+=pet(g,56,17,a,.95));[-24,24].forEach(g=>s+=pet(g,62,16,b,1));s+=pet(0,66,16,a,1);
  [-14,14].forEach(g=>s+=pet(g,40,10,l,.9));s+=`<ellipse cx="50" cy="70" rx="16" ry="3.5" fill="${a}"/>`;
  s+=`<path d="M18 71c10 5 22 7 32 7s22-2 32-7c-6 8-18 12-32 12s-26-4-32-12Z" fill="#3aa86b"/>`;return s});
reg('toran',.17,c=>{const [m,y,g]=c;let s=`<path d="M0 3C50 12 150 12 200 3" fill="none" stroke="${g}" stroke-width="1.4"/>`;
  for(let i=0;i<11;i++){const x=9+i*18,yy=3+Math.sin((x/200)*Math.PI)*8.4;
    s+=`<path d="M${x} ${yy+1}v4" stroke="${g}" stroke-width=".6"/>`;
    [0,1].forEach(k=>s+=`<circle cx="${x}" cy="${yy+7+k*5.4}" r="${3.5-k*.4}" fill="${k%2?y:m}"/><circle cx="${x}" cy="${yy+7+k*5.4}" r="1.3" fill="${k%2?m:y}"/>`);
    s+=`<path d="M${x} ${yy+16}c-3 2-3 7 0 10 3-3 3-8 0-10Z" fill="${g}"/>`}
  return s});
reg('kite',1.7,c=>{const [a,b,t]=c;return `<path d="M30 2 58 36 30 70 2 36Z" fill="${a}"/><path d="M30 2 58 36 30 36Z" fill="${b}"/><path d="M2 36 30 36 30 70Z" fill="${b}"/><path d="M30 2V70M2 36H58" stroke="#fff" stroke-opacity=".7" stroke-width=".9"/><path d="M30 2 58 36 30 70 2 36Z" fill="none" stroke="#00000033" stroke-width=".8"/>
  <path d="M30 70c-8 8 8 12 0 20s8 8 0 14" fill="none" stroke="${t}" stroke-width="1"/>${[78,90,102].map((y,i)=>`<path d="M${i%2?33:27} ${y}l${i%2?5:-5} -3v6z" fill="${i%2?a:b}"/>`).join('')}`});
reg('firework',1,c=>{const [a,b,l]=c;let s='';
  s+=ring(18,(g,i)=>`<path d="M50 14V${i%2?24:30}" stroke="${a}" stroke-width="1.6" stroke-linecap="round" ${rot(g,50,50)}/><circle cx="50" cy="${i%2?9:7}" r="1.8" fill="${a}" ${rot(g,50,50)}/>`);
  s+=ring(18,(g,i)=>`<path d="M50 34V${i%2?40:43}" stroke="${b}" stroke-width="1.3" stroke-linecap="round" ${rot(g+10,50,50)}/>`);
  s+=ring(9,(g)=>`<circle cx="50" cy="${22}" r="1.4" fill="${l}" ${rot(g+20,50,50)}/>`);return s+`<circle cx="50" cy="50" r="3" fill="${l}"/>`});
reg('paisley',1.3,c=>{const [a,b,l]=c;return `<path d="M30 76C6 70 2 40 22 24 32 16 34 8 30 2 46 8 58 28 52 48 48 64 40 74 30 76Z" fill="${a}"/><path d="M30 66C14 62 12 42 24 32 32 26 36 22 36 16 44 24 46 40 42 52 40 60 36 65 30 66Z" fill="none" stroke="${l}" stroke-width="1.1"/>${[[24,46],[30,52],[36,46],[30,40],[30,60]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1.7" fill="${b}"/>`).join('')}<circle cx="30" cy="30" r="3.5" fill="${b}"/>`});
reg('kalash',1.18,c=>{const [pot,band,leaf]=c;let s='';
  s+=ring(7,(g)=>`<path d="M50 40C36 26 40 10 50 4 60 10 64 26 50 40Z" fill="${leaf}" stroke="#00000022" stroke-width=".5" ${rot(g-90+90,50,44)}/>`).replace(/rotate\((-?\d+(\.\d+)?)/g,(m,x)=>`rotate(${f2(+x*0.42-76)}`);
  s+=`<circle cx="50" cy="32" r="12" fill="#a8672f"/><circle cx="50" cy="32" r="12" fill="url(#cn)" opacity=".4"/><circle cx="46" cy="29" r="1.4" fill="#4a2c18"/><circle cx="54" cy="29" r="1.4" fill="#4a2c18"/><circle cx="50" cy="35" r="1.4" fill="#4a2c18"/>`;
  s+=`<path d="M36 46h28l-2 8c10 4 18 14 18 26 0 16-14 26-30 26S20 96 20 80c0-12 8-22 18-26Z" fill="${pot}"/><path d="M34 54h32" stroke="${band}" stroke-width="3"/><path d="M22 80h56" stroke="${band}" stroke-width="3"/>`;
  s+=ring(9,(g)=>`<path d="${petalPath(50,92,0,10,3.4)}" fill="${band}" ${rot(g*.0,50,92)} transform="translate(${f2(Math.sin(g*Math.PI/180)*0)} 0)"/>`).slice(0,0);
  s+=[30,40,50,60,70].map((x,i)=>`<circle cx="${x}" cy="${i%2?64:68}" r="2.4" fill="${band}"/>`).join('');
  s+=`<path d="M38 46c4-4 20-4 24 0v4H38Z" fill="#c1121f"/>`;return `<defs>${DEF('cn',[[0,'#fff',.7],[1,'#000',0]])}</defs>`+s});
reg('crescent',1,c=>{const [a,b]=c;const st=(cx,cy,R,r)=>{let p='';for(let i=0;i<10;i++){const rr=i%2?r:R,an=-Math.PI/2+i*Math.PI/5;p+=(i?'L':'M')+f2(cx+Math.cos(an)*rr)+' '+f2(cy+Math.sin(an)*rr)}return p+'Z'};
  return `<defs>${DEF('cg',[[0,b],[1,a]],'linear','x1="0" y1="0" x2="1" y2="1"')}</defs><path d="M64 10A42 42 0 1 0 64 90 34 34 0 1 1 64 10Z" fill="url(#cg)"/><path d="${st(70,42,12,5)}" fill="${b}"/><circle cx="84" cy="64" r="2" fill="${b}"/><circle cx="26" cy="20" r="1.4" fill="${b}"/><circle cx="88" cy="22" r="1.4" fill="${b}"/>`});
reg('lantern',1.7,c=>{const [a,b,l]=c;return `<path d="M30 2v10" stroke="${l}" stroke-width="1.4"/><circle cx="30" cy="3" r="2" fill="${l}"/><path d="M18 14h24l-3-4H21Z" fill="${l}"/><path d="M16 14h28c8 12 8 36 0 48H16C8 50 8 26 16 14Z" fill="${a}"/><path d="M30 14c-8 12-8 36 0 48 8-12 8-36 0-48Z" fill="${b}" fill-opacity=".85"/><path d="M23 14c-6 12-6 36 0 48M37 14c6 12 6 36 0 48" fill="none" stroke="${l}" stroke-width=".8"/><path d="M16 62h28v5H16Z" fill="${l}"/><path d="M30 67v14" stroke="${l}" stroke-width="1.2"/><path d="M26 81h8l-2 12h-4Z" fill="${b}"/><circle cx="30" cy="38" r="6" fill="#fff6c8" opacity=".9"/>`});
reg('gulal',1,(c,seed=7)=>{const r=prng(seed);let s='';const pts=[[34,36,24],[66,32,20],[50,60,26],[24,68,16],[78,64,17],[50,24,14],[62,82,12],[16,40,11]];
  pts.forEach(([x,y,R],i)=>{s+=`<circle cx="${x}" cy="${y}" r="${R}" fill="${c[i%c.length]}" fill-opacity=".72"/>`});
  for(let i=0;i<90;i++){const an=r()*6.283,d=18+r()*34;s+=`<circle cx="${f2(50+Math.cos(an)*d)}" cy="${f2(50+Math.sin(an)*d)}" r="${f2(.5+r()*1.7)}" fill="${c[(i+1)%c.length]}"/>`}return s});
reg('xtree',1.2,c=>{const [g1,g2,st]=c;let s='';
  s+=`<rect x="44" y="102" width="12" height="14" fill="#7a4a21"/>`;
  [[8,66,92,52],[16,44,84,40],[24,24,76,34],[32,6,68,28]].slice(0,0);
  s+=`<path d="M50 14 80 50H64l22 28H66l26 28H8l26-28H14l22-28H20Z" fill="${g1}"/><path d="M50 14 80 50H64l22 28H66l26 28H50Z" fill="${g2}" fill-opacity=".55"/>`;
  s+=`<path d="M50 2l3.4 7.4 8 .8-6 5.4 1.8 7.8L50 19l-7.2 4.4 1.8-7.8-6-5.4 8-.8Z" fill="${st}"/>`;
  [[40,52,'#e63946'],[60,60,'#ffd166'],[34,80,'#ffd166'],[56,86,'#e63946'],[70,96,'#90e0ef'],[26,98,'#e63946'],[48,70,'#fff']].forEach(([x,y,f])=>s+=`<circle cx="${x}" cy="${y}" r="3.4" fill="${f}"/><circle cx="${x-1}" cy="${y-1.2}" r="1" fill="#fff" opacity=".7"/>`);return s});
reg('snow',1,c=>{const [a]=c;let s='';s+=ring(6,(g)=>`<g ${rot(g,50,50)} stroke="${a}" stroke-width="2.4" stroke-linecap="round" fill="none"><path d="M50 50V6"/><path d="M50 18 40 8M50 18 60 8M50 32 38 22M50 32 62 22"/></g>`);return s+`<circle cx="50" cy="50" r="4" fill="${a}"/>`});
reg('balloons',1.3,c=>{const [a,b,d]=c;const bl=(x,y,col,rx,ry)=>`<path d="M${x} ${y+ry}C${x-10} ${y+ry+10} ${x-6} ${y+ry+22} ${x} ${y+ry+34}" fill="none" stroke="#888" stroke-width=".7"/><ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${col}"/><path d="M${x-2} ${y+ry}l2 3.4 2-3.4Z" fill="${col}"/><ellipse cx="${x-rx*.35}" cy="${y-ry*.4}" rx="${rx*.2}" ry="${ry*.3}" fill="#fff" fill-opacity=".45" transform="rotate(-25 ${x-rx*.35} ${y-ry*.4})"/>`;
  return bl(30,34,a,19,24)+bl(66,28,b,19,24)+bl(50,60,d,19,24)});
reg('gift',1,c=>{const [a,b,r]=c;return `<rect x="12" y="42" width="76" height="50" rx="3" fill="${a}"/><rect x="8" y="30" width="84" height="18" rx="3" fill="${b}"/><rect x="44" y="30" width="12" height="62" fill="${r}"/><path d="M50 30C36 6 14 18 28 28 36 32 46 30 50 30ZM50 30C64 6 86 18 72 28 64 32 54 30 50 30Z" fill="${r}"/><circle cx="50" cy="29" r="5" fill="${r}"/>`});
reg('cake',.95,c=>{const [a,b,cr]=c;return `<rect x="26" y="8" width="3" height="18" fill="#ffe8a3"/><rect x="48.5" y="8" width="3" height="18" fill="#ffe8a3"/><rect x="71" y="8" width="3" height="18" fill="#ffe8a3"/>${[27.5,50,72.5].map(x=>`<path d="M${x} 1c3 5 3 7 0 8-3-1-3-3 0-8Z" fill="#ff9f1c"/>`).join('')}<rect x="14" y="26" width="72" height="22" rx="4" fill="${a}"/><path d="M14 36c6 6 10-4 16 2s10-4 16 2 10-4 16 2 10-4 16 2 8-2 8-2v-6H14Z" fill="${cr}"/><rect x="6" y="48" width="88" height="30" rx="5" fill="${b}"/><path d="M6 58c8 6 12-4 20 2s12-4 20 2 12-4 20 2 12-4 20 2 8-2 8-2v-8H6Z" fill="${cr}"/><rect x="2" y="78" width="96" height="9" rx="4" fill="${a}"/>${[22,40,58,76].map(x=>`<circle cx="${x}" cy="68" r="2.4" fill="${cr}"/>`).join('')}`});
reg('arch',1.4,c=>{const [a,b]=c;const p=(m,col,w)=>`<path d="M${m} 140V${58-m*.2}C${m} ${34-m*.2} ${m+26} ${22} 50 ${2+m*.8} ${74-m-26} 22 ${100-m} ${34-m*.2} ${100-m} ${58-m*.2}V140" fill="none" stroke="${col}" stroke-width="${w}" stroke-linejoin="round"/>`;
  let s=p(3,a,2.6)+p(8,b,.9)+p(12,a,.9);
  for(let i=1;i<14;i++){const t=i/14,x=t*100,y=58-Math.sin(t*Math.PI)*44+(Math.abs(t-.5)<.1?0:0);if(i%2)s+=`<circle cx="${f2(x)}" cy="${f2(y+9)}" r="1.1" fill="${b}"/>`}
  return s+`<path d="M50 -1l2.4 4-2.4 4-2.4-4Z" fill="${b}"/>`});
reg('feather',2.6,c=>{const [a,b,l]=c;return `<path d="M20 130C22 100 18 70 20 40" fill="none" stroke="${l}" stroke-width="1.6"/><ellipse cx="20" cy="36" rx="17" ry="30" fill="${b}"/><ellipse cx="20" cy="36" rx="13" ry="25" fill="${a}"/><ellipse cx="20" cy="33" rx="9" ry="16" fill="${l}"/><ellipse cx="20" cy="33" rx="6" ry="11" fill="${b}"/><ellipse cx="20" cy="32" rx="3.2" ry="6" fill="#0b2a4a"/>${ring(12,(g)=>`<path d="M20 36L20 8" stroke="${l}" stroke-width=".5" ${rot(g*.6-30,20,36)}/>`)}`});
reg('chakra',1,c=>{const [a]=c;let s=`<circle cx="50" cy="50" r="46" fill="none" stroke="${a}" stroke-width="3.4"/><circle cx="50" cy="50" r="8" fill="${a}"/>`;
  s+=ring(24,(g)=>`<path d="M50 50V6" stroke="${a}" stroke-width="1.4" ${rot(g,50,50)}/><circle cx="50" cy="12" r="1.7" fill="${a}" ${rot(g+7.5,50,50)}/>`);return s+ring(24,(g)=>`<path d="M48.4 10 50 6l1.6 4Z" fill="${a}" ${rot(g,50,50)}/>`)});
reg('flag',.67,c=>`<path d="M0 6C16 -2 26 14 42 6S74 -2 90 6V30C74 22 58 38 42 30S16 22 0 30Z" fill="#FF9933"/><path d="M0 30C16 22 26 38 42 30S74 22 90 30V54C74 46 58 62 42 54S16 46 0 54Z" fill="#fff"/><path d="M0 54C16 46 26 62 42 54S74 46 90 54V78C74 70 58 86 42 78S16 70 0 78Z" fill="#138808"/><g transform="translate(26 24) scale(.32)" stroke="#000080" fill="#000080"><circle cx="50" cy="50" r="44" fill="none" stroke-width="5"/>${ring(24,g=>`<path d="M50 50V8" stroke-width="2" ${rot(g,50,50)}/>`)}<circle cx="50" cy="50" r="7" stroke="none"/></g>`);
reg('sun',1,c=>{const [a,b]=c;let s=ring(16,(g,i)=>`<path d="M50 2l${i%2?4:6} 14h-${i%2?8:12}Z" fill="${a}" ${rot(g,50,50)}/>`);return s+`<circle cx="50" cy="50" r="28" fill="${b}"/><circle cx="50" cy="50" r="22" fill="${a}" fill-opacity=".35"/>`});
reg('pot',1,c=>{const [pot,band,foam]=c;return `${[[30,26,12],[44,20,14],[58,22,13],[70,28,11],[50,28,10]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${foam}"/>`).join('')}<path d="M18 36h64l-2 4c10 6 14 16 14 28 0 18-18 28-44 28S6 86 6 68c0-12 4-22 14-28Z" fill="${pot}"/><ellipse cx="50" cy="38" rx="32" ry="5" fill="${band}"/><path d="M12 66h76M14 76h72" stroke="${band}" stroke-width="2.6"/>${ring(8,(g)=>'').slice(0,0)}${[24,36,48,60,72].map(x=>`<path d="M${x} 56l4 4-4 4-4-4Z" fill="${band}"/>`).join('')}<path d="M22 14c-8-8 4-12 0-20M50 8c-8-8 4-12 0-20" stroke="#fff" stroke-opacity=".5" fill="none" stroke-width="1.4"/>`});
reg('cane',2,c=>{const [a,l]=c;return [0,1,2].map(i=>{const x=20+i*30;return `<rect x="${x-5}" y="10" width="10" height="190" rx="4" fill="${a}"/>${[40,80,120,160].map(y=>`<rect x="${x-6}" y="${y}" width="12" height="4" rx="2" fill="#00000030"/>`).join('')}<path d="M${x} 30c-20-14-30-26-34-34M${x} 50c22-12 30-20 34-30" fill="none" stroke="${l}" stroke-width="3.4" transform="translate(0 ${i*8})"/>`}).join('')});
reg('kolam',1,c=>{const [a,b]=c;let s='';const rows=[1,3,5,3,1];rows.forEach((n,r)=>{for(let i=0;i<n;i++)s+=`<circle cx="${50+(i-(n-1)/2)*14}" cy="${22+r*14}" r="1.9" fill="${b}"/>`});
  s+=ring(4,(g)=>`<ellipse cx="50" cy="50" rx="30" ry="13" fill="none" stroke="${a}" stroke-width="1.6" ${rot(g*.5,50,50)}/>`);
  s+=ring(4,(g)=>`<path d="M50 22c-18 6-18 22 0 28 18-6 18-22 0-28Z" fill="none" stroke="${a}" stroke-width="1.4" ${rot(g,50,50)}/>`);return s});
reg('jaali',1,(c,W=100,H=100)=>{const [a]=c,t=16,n=Math.ceil(W/t)+1,m=Math.ceil(H/t)+1;let d='';return `<defs><pattern id="jp" width="${t}" height="${t}" patternUnits="userSpaceOnUse"><path d="M8 0 12 4 16 8 12 12 8 16 4 12 0 8 4 4Z" fill="none" stroke="${a}" stroke-width=".7"/><path d="M8 3.6 12.4 8 8 12.4 3.6 8Z" fill="${a}" fill-opacity=".5"/><circle cx="0" cy="0" r="1.2" fill="${a}"/><circle cx="16" cy="16" r="1.2" fill="${a}"/></pattern></defs><rect width="${W}" height="${H}" fill="url(#jp)"/>`});
reg('dots',1,(c,W=100,H=100)=>{const [a,b]=c;return `<defs><pattern id="dp" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.5" fill="${a}"/><circle cx="9" cy="9" r="1.5" fill="${b||a}"/></pattern></defs><rect width="${W}" height="${H}" fill="url(#dp)"/>`});
reg('vine',.1,c=>{const [a,b]=c;let s=`<path d="M0 5C12 -1 25 11 37 5S62 -1 75 5 88 11 100 5" fill="none" stroke="${a}" stroke-width="1"/>`;
  for(let i=0;i<4;i++){const x=12.5+i*25;const up=i%2;s+=`<path d="M${x} ${up?8:2}c-4 ${up?5:-5} 2 ${up?9:-9} 6 ${up?4:-4}" fill="none" stroke="${b}" stroke-width=".8"/><path d="M${x} ${up?8:2}c2 ${up?-1:1} 5 ${up?6:-6} 0 ${up?8:-8}-5 ${up?-2:2}-3 ${up?-6:6} 0 ${up?-8:8}Z" fill="${b}"/>`}
  return s});
reg('rings',1.2,c=>{const [a,b]=c;return `<circle cx="38" cy="64" r="26" fill="none" stroke="${a}" stroke-width="5"/><circle cx="62" cy="64" r="26" fill="none" stroke="${b}" stroke-width="5"/><path d="M50 44.6a26 26 0 0 1 0 38.8" fill="none" stroke="${a}" stroke-width="5"/><path d="M50 14l8 10-8 10-8-10Z" fill="${b}"/><path d="M42 24h16" stroke="#fff" stroke-opacity=".7" stroke-width="1"/>`});
reg('heart',.92,c=>{const [a,b]=c;return `<path d="M50 90C14 62 2 40 12 22 22 6 42 10 50 26 58 10 78 6 88 22 98 40 86 62 50 90Z" fill="${a}"/><path d="M26 24c4-6 12-7 18-2" stroke="${b}" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-opacity=".7"/>`});
reg('sparkle',1,c=>{const [a,b]=c;const sp=(x,y,r,f)=>`<path d="M${x} ${y-r}C${x+r*.1} ${y-r*.1} ${x+r*.1} ${y-r*.1} ${x+r} ${y}C${x+r*.1} ${y+r*.1} ${x+r*.1} ${y+r*.1} ${x} ${y+r}C${x-r*.1} ${y+r*.1} ${x-r*.1} ${y+r*.1} ${x-r} ${y}C${x-r*.1} ${y-r*.1} ${x-r*.1} ${y-r*.1} ${x} ${y-r}Z" fill="${f}"/>`;return sp(46,52,40,a)+sp(82,20,14,b)+sp(80,84,10,a)+sp(14,16,8,b)});
reg('confetti',1,(c,W=100,H=100,seed=3)=>{const r=prng(seed);let s='';for(let i=0;i<Math.round(W*H/160);i++){const x=r()*W,y=r()*H,col=c[i%c.length],k=r();s+=k<.4?`<rect x="${f2(x)}" y="${f2(y)}" width="${f2(1.4+r()*1.6)}" height="${f2(3+r()*3)}" fill="${col}" transform="rotate(${f2(r()*360)} ${f2(x)} ${f2(y)})"/>`:k<.75?`<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(.9+r()*1.3)}" fill="${col}"/>`:`<path d="M${f2(x)} ${f2(y)}l2 3.4 -4 0z" fill="${col}" transform="rotate(${f2(r()*360)} ${f2(x)} ${f2(y)})"/>`}return s});
reg('book',.8,c=>{const [a,b,l]=c;return `<path d="M50 20C36 10 18 10 4 16v64c14-6 32-6 46 4Z" fill="${a}"/><path d="M50 20c14-10 32-10 46-4v64c-14-6-32-6-46 4Z" fill="${b}"/><path d="M50 20v64" stroke="${l}" stroke-width="1.4"/>${[28,38,48,58].map(y=>`<path d="M12 ${y}c10-3 24-3 32 2M88 ${y}c-10-3-24-3-32 2" stroke="${l}" stroke-width="1.2" stroke-opacity=".6" fill="none"/>`).join('')}`});
reg('cap',.72,c=>{const [a,b]=c;return `<path d="M50 6 96 28 50 50 4 28Z" fill="${a}"/><path d="M22 40v20c8 8 20 12 28 12s20-4 28-12V40L50 54Z" fill="${b}"/><path d="M90 31v26" stroke="${a}" stroke-width="2.4"/><circle cx="90" cy="60" r="3.4" fill="${b}"/>`});
reg('bulb',1.2,c=>{const [a,b]=c;return `<path d="M50 4C28 4 16 20 16 38c0 12 6 20 12 28 4 6 6 10 6 16h32c0-6 2-10 6-16 6-8 12-16 12-28C84 20 72 4 50 4Z" fill="${a}"/><path d="M38 46l8 10 4-14 4 14 8-10" fill="none" stroke="${b}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><rect x="34" y="86" width="32" height="8" rx="3" fill="${b}"/><rect x="38" y="97" width="24" height="7" rx="3" fill="${b}"/>`});
reg('rocket',1.5,c=>{const [a,b,f]=c;return `<path d="M50 4C70 22 72 56 64 84H36C28 56 30 22 50 4Z" fill="${a}"/><circle cx="50" cy="40" r="9" fill="${b}" stroke="#fff" stroke-width="3"/><path d="M36 60 16 82 16 98 36 84ZM64 60 84 82 84 98 64 84Z" fill="${b}"/><path d="M38 88h24l-6 22H44Z" fill="${f}"/><path d="M44 110l6 30 6-30Z" fill="#ffd166"/>`});
reg('laptop',.66,c=>{const [a,b]=c;return `<rect x="14" y="6" width="72" height="46" rx="4" fill="${a}"/><rect x="19" y="11" width="62" height="36" rx="2" fill="${b}"/><path d="M4 56h92l-6 8H10Z" fill="${a}"/><path d="M24 36l10-10 8 8 14-16 14 18" fill="none" stroke="#fff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" opacity=".9"/>`});
reg('bars',.7,c=>{const [a,b,l]=c;return `<path d="M6 66H96" stroke="${l}" stroke-width="1.6"/>${[[10,34],[34,22],[58,44],[78,8]].map(([x,h],i)=>`<rect x="${x}" y="${66-h}" width="14" height="${h}" rx="2.5" fill="${i%2?b:a}"/>`).join('')}`});
reg('cup',.95,c=>{const [a,b]=c;return `<path d="M14 30h60v30c0 14-12 24-30 24S14 74 14 60Z" fill="${a}"/><path d="M74 38h8c10 0 10 20 0 20h-8" fill="none" stroke="${a}" stroke-width="5"/><path d="M26 18c-6-6 6-8 0-14M44 18c-6-6 6-8 0-14M62 18c-6-6 6-8 0-14" stroke="${b}" stroke-width="2.4" fill="none" stroke-linecap="round"/><ellipse cx="44" cy="30" rx="30" ry="4" fill="${b}"/>`});
reg('leaf',1,c=>{const [a,b]=c;return `<path d="M10 90C6 40 40 8 92 8c2 52-30 84-82 82Z" fill="${a}"/><path d="M12 88C34 60 56 38 84 16" stroke="${b}" stroke-width="2" fill="none"/>${[[28,70,40,52],[40,58,58,52],[52,46,70,38],[24,56,34,40]].map(([x,y,x2,y2])=>`<path d="M${x} ${y}L${x2} ${y2}" stroke="${b}" stroke-width="1.2"/>`).join('')}`});
reg('house',.9,c=>{const [a,b,l]=c;return `<path d="M50 6 4 46h12v42h68V46h12Z" fill="${a}"/><rect x="40" y="56" width="20" height="32" rx="2" fill="${b}"/><rect x="22" y="52" width="14" height="14" fill="${l}"/><rect x="64" y="52" width="14" height="14" fill="${l}"/><path d="M50 6 4 46h92Z" fill="${b}" fill-opacity=".35"/>`});
reg('building',1.4,c=>{const [a,b,l]=c;let s=`<rect x="10" y="4" width="44" height="136" fill="${a}"/><rect x="54" y="40" width="36" height="100" fill="${b}"/>`;for(let y=0;y<10;y++){for(let x=0;x<3;x++)s+=`<rect x="${16+x*12}" y="${12+y*13}" width="7" height="8" fill="${l}" fill-opacity="${(x+y)%3?.9:.35}"/>`;if(y<7)for(let x=0;x<2;x++)s+=`<rect x="${60+x*14}" y="${48+y*13}" width="8" height="8" fill="${l}" fill-opacity="${(x+y)%2?.9:.4}"/>`}return s});
reg('dumbbell',.72,c=>{const [a,b]=c;return `<rect x="6" y="26" width="12" height="40" rx="3" fill="${a}"/><rect x="18" y="12" width="12" height="56" rx="3" fill="${a}"/><rect x="30" y="34" width="40" height="12" fill="${b}"/><rect x="70" y="12" width="12" height="56" rx="3" fill="${a}"/><rect x="82" y="20" width="12" height="40" rx="3" fill="${a}"/>`});
reg('pulse',.5,c=>{const [a,b]=c;return `<path d="M2 28H28L36 8 50 48 62 18 70 28H98" fill="none" stroke="${a}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`});
reg('plane',.8,c=>{const [a,b]=c;return `<path d="M96 10 8 44l24 8 8 28 12-16 20 14Z" fill="${a}"/><path d="M96 10 32 52l10 28 4-14Z" fill="${b}" fill-opacity=".85"/><path d="M96 10 42 62" stroke="#fff" stroke-width="1.2" stroke-opacity=".7"/>`});
reg('camera',.78,c=>{const [a,b,l]=c;return `<path d="M30 8h30l6 10h22a8 8 0 0 1 8 8v44a8 8 0 0 1-8 8H8a8 8 0 0 1-8-8V26a8 8 0 0 1 8-8h16Z" fill="${a}"/><circle cx="47" cy="48" r="22" fill="${b}"/><circle cx="47" cy="48" r="15" fill="${l}"/><circle cx="47" cy="48" r="9" fill="${b}"/><circle cx="82" cy="28" r="3" fill="${l}"/>`});
reg('gem',.9,c=>{const [a,b,l]=c;return `<path d="M26 8h48l22 28L50 92 4 36Z" fill="${a}"/><path d="M4 36h92M26 8l14 28L50 92M74 8 60 36 50 92M40 36 50 8 60 36" fill="none" stroke="${l}" stroke-width="1.6" stroke-linejoin="round"/><path d="M26 8 40 36 4 36ZM74 8 60 36 96 36Z" fill="${b}" fill-opacity=".7"/>`});
reg('thali',1,c=>{const [pl,a,b]=c;let s=`<circle cx="50" cy="50" r="48" fill="${pl}"/><circle cx="50" cy="50" r="44" fill="none" stroke="#ffffff66" stroke-width="1.6"/><circle cx="50" cy="50" r="38" fill="none" stroke="#ffffff33" stroke-width="1"/>`;
  [[50,26],[72,38],[72,62],[50,74],[28,62],[28,38]].forEach(([x,y],i)=>s+=`<circle cx="${x}" cy="${y}" r="11" fill="#ffffff55"/><circle cx="${x}" cy="${y}" r="9" fill="${[a,b,'#e76f51','#2a9d8f','#f4a261','#e9c46a'][i]}"/><circle cx="${x-2}" cy="${y-2}" r="3" fill="#fff" fill-opacity=".35"/>`);return s+`<circle cx="50" cy="50" r="12" fill="#f8edd2"/><circle cx="46" cy="46" r="2.4" fill="#fff"/>`});
reg('bag',.95,c=>{const [a,b]=c;return `<path d="M14 30h72l6 62H8Z" fill="${a}"/><path d="M34 40V24c0-12 32-12 32 0v16" fill="none" stroke="${b}" stroke-width="5" stroke-linecap="round"/><circle cx="34" cy="40" r="3.6" fill="${b}"/><circle cx="66" cy="40" r="3.6" fill="${b}"/>`});
reg('pin',1.4,c=>{const [a,b]=c;return `<path d="M50 4C28 4 12 20 12 42c0 28 38 60 38 60s38-32 38-60C88 20 72 4 50 4Z" fill="${a}"/><circle cx="50" cy="42" r="14" fill="${b}"/>`});
reg('trophy',1.1,c=>{const [a,b]=c;return `<path d="M26 8h48v30c0 16-10 26-24 26S26 54 26 38Z" fill="${a}"/><path d="M26 16H10c0 22 8 30 20 32M74 16h16c0 22-8 30-20 32" fill="none" stroke="${a}" stroke-width="5"/><rect x="44" y="62" width="12" height="18" fill="${b}"/><rect x="28" y="80" width="44" height="12" rx="3" fill="${a}"/><path d="M40 20c0 14 4 22 10 26" stroke="#fff" stroke-opacity=".5" stroke-width="3" fill="none"/>`});
reg('seal',1.3,c=>{const [a,b]=c;let s=`<path d="M30 70 18 128l22-12 12 14L58 70Z" fill="${b}"/><path d="M70 70l12 58-22-12-12 14-6-60Z" fill="${b}"/>`;
  s+=ring(24,(g)=>`<circle cx="50" cy="12" r="6.4" fill="${a}" ${rot(g,50,50)}/>`)+`<circle cx="50" cy="50" r="40" fill="${a}"/><circle cx="50" cy="50" r="32" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.6"/><path d="M50 30l5.6 11.6 12.6 1.8-9.2 9 2.2 12.6L50 59l-11.2 6 2.2-12.6-9.2-9 12.6-1.8Z" fill="#fff" fill-opacity=".9"/>`;return s});
reg('crown',.75,c=>{const [a,b]=c;return `<path d="M6 76 2 22l26 24L50 8l22 38 26-24-4 54Z" fill="${a}"/><rect x="6" y="76" width="88" height="10" rx="3" fill="${b}"/>${[[2,22],[50,8],[98,22]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="4" fill="${b}"/>`).join('')}`});
reg('bell',1.1,c=>{const [a,b]=c;return `<circle cx="50" cy="8" r="5" fill="${b}"/><path d="M50 12C28 12 20 30 20 50c0 14-6 22-12 28h84c-6-6-12-14-12-28 0-20-8-38-30-38Z" fill="${a}"/><path d="M40 84a10 10 0 0 0 20 0Z" fill="${b}"/>`});
reg('bokeh',1,(c,W=100,H=100,seed=11)=>{const r=prng(seed);let s='';for(let i=0;i<26;i++){const x=r()*W,y=r()*H,R=4+r()*Math.min(W,H)*.1;s+=`<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(R)}" fill="${c[i%c.length]}" fill-opacity="${f2(.12+r()*.25)}"/>`}return s});
reg('stars',1,(c,W=100,H=100,seed=5)=>{const r=prng(seed);let s='';for(let i=0;i<Math.round(W*H/140);i++){const x=r()*W,y=r()*H,R=.5+r()*1.4;s+=`<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(R)}" fill="${c[i%c.length]}" fill-opacity="${f2(.4+r()*.6)}"/>`}return s});
reg('wave',.22,c=>{const [a,b]=c;return `<path d="M0 8C16 -2 34 -2 50 8S84 18 100 8V22H0Z" fill="${b}" fill-opacity=".55"/><path d="M0 14C18 4 34 4 50 14S84 24 100 14V22H0Z" fill="${a}"/>`});
reg('blobbg',1,c=>{const [a]=c;return `<path d="M82 20C98 40 96 70 74 86 52 100 20 90 8 66 -4 42 14 14 40 8 58 4 72 8 82 20Z" fill="${a}"/>`});

reg('rakhi',1.35,c=>{const [a,b,l]=c;let s=`<path d="M38 52C14 38 4 52 8 66S28 80 40 62" fill="none" stroke="${b}" stroke-width="2.4"/><path d="M62 52C86 38 96 52 92 66S72 80 60 62" fill="none" stroke="${b}" stroke-width="2.4"/><path d="M42 56C26 56 20 66 28 74M58 56C74 56 80 66 72 74" fill="none" stroke="${l}" stroke-width="1.2" stroke-dasharray="1.2 2.4"/>`;
  s+=[[10,60],[7,68],[14,73],[90,60],[93,68],[86,73]].map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="3" fill="${i%2?a:l}"/>`).join('');
  s+=ring(12,(g)=>`<circle cx="50" cy="30" r="6" fill="${a}" ${rot(g,50,50)}/>`).replace(/cy="30"/g,'cy="22"');
  return s.replace(/rotate\((-?[\d.]+) 50 50\)/g,'rotate($1 50 50)')+`<circle cx="50" cy="50" r="22" fill="${b}"/><circle cx="50" cy="50" r="17" fill="${a}"/><circle cx="50" cy="50" r="11" fill="${l}"/><circle cx="50" cy="50" r="5" fill="${b}"/>`});
reg('flame',1.1,c=>{const [a,b,l]=c;return `<rect x="8" y="88" width="84" height="9" rx="4" fill="#6b3f1d" transform="rotate(-6 50 92)"/><rect x="8" y="88" width="84" height="9" rx="4" fill="#8a5326" transform="rotate(7 50 92)"/><path d="M50 4C62 26 86 38 82 66 80 82 66 92 50 92S20 82 18 66C16 44 36 36 50 4Z" fill="${a}"/><path d="M50 26C58 42 72 50 70 68 68 80 60 88 50 88S32 80 30 68C28 52 42 46 50 26Z" fill="${b}"/><path d="M50 52C55 62 62 66 60 74 58 82 54 84 50 84S42 82 40 74C38 66 45 62 50 52Z" fill="${l}"/>`});
reg('wheat',2,c=>{const [a,b]=c;let s=`<path d="M50 200C48 150 52 90 50 22" fill="none" stroke="${b}" stroke-width="2.4"/>`;for(let i=0;i<9;i++){const y=30+i*14;s+=`<ellipse cx="42" cy="${y+6}" rx="4" ry="9" fill="${a}" transform="rotate(-28 42 ${y+6})"/><ellipse cx="58" cy="${y+6}" rx="4" ry="9" fill="${a}" transform="rotate(28 58 ${y+6})"/>`}return s+`<ellipse cx="50" cy="14" rx="4" ry="10" fill="${a}"/>`});
reg('dandiya',2.4,c=>{const [a,b,l]=c;const st=(r)=>`<g transform="rotate(${r} 50 120)"><rect x="46" y="10" width="8" height="220" rx="4" fill="${a}"/>${[30,60,90,170,200].map((y,i)=>`<rect x="45" y="${y}" width="10" height="6" fill="${i%2?l:b}"/>`).join('')}${[120,130,140].map(y=>`<circle cx="50" cy="${y}" r="2.4" fill="${b}"/>`).join('')}</g>`;return st(-18)+st(18)});
reg('moon',1,c=>{const [a,b]=c;return `<defs>${DEF('mn',[[0,'#fff'],[1,a]])}</defs><circle cx="50" cy="50" r="46" fill="${b}" fill-opacity=".25"/><circle cx="50" cy="50" r="38" fill="url(#mn)"/><circle cx="38" cy="40" r="6" fill="#00000012"/><circle cx="60" cy="56" r="9" fill="#00000010"/><circle cx="48" cy="68" r="4" fill="#00000012"/>`});
reg('ribbon',.28,c=>{const [a,b]=c;return `<path d="M0 8h100l-8 12 8 12H0l8-12Z" fill="${a}"/><path d="M0 8l8 12-8 12" fill="none" stroke="${b}" stroke-width="1.4"/>`});
reg('leafrow',.14,c=>{const [a,b]=c;let s='';for(let i=0;i<12;i++){const x=4+i*8.2;s+=`<path d="M${x} 12c4-6 4-12 0-12-4 0-4 6 0 12Z" fill="${i%2?a:b}"/>`}return s});
reg('frame',1,(c,W=100,H=100)=>{const [a,b]=c,m=Math.min(W,H)*.04;const rr=(i,col,w)=>`<rect x="${f2(m+i)}" y="${f2(m+i)}" width="${f2(W-2*(m+i))}" height="${f2(H-2*(m+i))}" fill="none" stroke="${col}" stroke-width="${w}"/>`;
  let s=rr(0,a,.9)+rr(m*.35,b,.4);const cs=[[m,m,0],[W-m,m,90],[W-m,H-m,180],[m,H-m,270]];cs.forEach(([x,y,r])=>s+=`<g transform="translate(${f2(x)} ${f2(y)}) rotate(${r})"><path d="M0 0h${f2(m*3)}v${f2(m*.35)}H${f2(m*.35)}v${f2(m*3)}H0Z" fill="${a}"/><circle cx="${f2(m*.6)}" cy="${f2(m*.6)}" r="${f2(m*.5)}" fill="${b}"/></g>`);return s});
const svgURI=(name,cols,W,H,seed)=>{const ar=ARTAR[name];const vw=100,vh=(W&&H)?100*H/W:ar*100;
  const body=ART[name](cols,vw,vh,seed);return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vw} ${f2(vh)}">${body}</svg>`)};
/* an image layer drawn from the library; width w, height follows the art's own proportions (or h when W/H pattern art) */
function AI(name,x,y,w,cols,o={}){
  const pat=!!o.fill,h=pat?o.fill:w*ARTAR[name];const src=svgURI(name,cols,pat?w:0,pat?h:0,o.seed);
  const r=Object.assign({id:uid(),type:'image',src,x,y,w,h,rot:0,fit:'cover',z:1,ox:0,oy:0,mask:'none',r:0,sw:0,stroke:'#fff',flt:{},fp:'none',fpv:100,vig:0,op:1,name:o.nm||name,nw:1000,nh:Math.round(1000*h/w),art:name},o);delete r.fill;delete r.seed;delete r.nm;return r}

const TCATS=['Festivals','Wedding & Events','Birthday & Party','Business','Social','Slides','Print','Resume & Docs','Education','Food','Real estate','Fitness','Fashion & Jewellery','YouTube','Travel','Logos'];
/* ---------- template engine: festival layouts + design families ---------- */
const DC={diya:['#ffb703','#c8553d','#ffd166'],kalash:['#c8793a','#ffd166','#2f9e44'],lotus:['#f783ac','#e64980','#fff0f6'],kite:['#e03131','#ffd43b','#555555'],crescent:['#e9b949','#fff3bf'],lantern:['#e03131','#ffd166','#c99700'],gulal:['#e03131','#f59f00','#7048e8','#2f9e44','#1c7ed6','#d6336c'],rangoli:['#e03131','#f59f00','#7048e8','#2f9e44','#1c7ed6','#d6336c'],xtree:['#1b7f4a','#0f5d33','#ffd43b'],snow:['#ffffff'],gift:['#e03131','#2f9e44','#ffd43b'],balloons:['#e03131','#ffd43b','#339af0'],cake:['#f783ac','#a5d8ff','#ffffff'],feather:['#1098ad','#1864ab','#2f9e44'],chakra:['#000080'],flag:[],sun:['#ffb703','#fb8500'],pot:['#c8793a','#ffd166','#ffffff'],cane:['#7048e8','#2f9e44'],kolam:['#ffffff','#ffd166'],firework:['#ffd166','#ff5d8f','#ffffff'],heart:['#e03131','#ffffff'],sparkle:['#ffd43b','#ff8787'],bell:['#ffd43b','#e8590c'],rakhi:['#ffd166','#e03131','#fff3bf'],flame:['#e8590c','#ffb703','#fff3bf'],wheat:['#e9b949','#7a8f2a'],dandiya:['#c8553d','#ffd166','#2f9e44'],moon:['#ffe9a8','#ffffff'],book:['#4263eb','#f59f00','#ffffff'],cap:['#1f1c19','#e8590c'],bulb:['#ffd43b','#1f1c19'],trophy:['#ffd43b','#e8590c'],gem:['#339af0','#74c0fc','#ffffff'],rings:['#ffd166','#e9b949'],crown:['#ffd43b','#e8590c'],cup:['#7a4a21','#bbbbbb'],leaf:['#2f9e44','#b2f2bb'],paisley:['#c2410c','#ffd166','#fff3bf'],feathers:['#1098ad'],thali:['#cfcfcf','#e03131','#ffd43b'],leafrow:['#2f9e44','#74c69d'],toran:['#fb8500','#ffd60a','#2d9d4f'],vine:['#2f9e44','#c99700'],ribbon:['#e03131','#ffd166'],plane:['#4263eb','#1b3a8a'],pin:['#e03131','#ffffff'],camera:['#343a40','#4263eb','#ffffff'],cap2:['#1f1c19','#e8590c'],bag:['#e8590c','#ffffff'],house:['#4263eb','#1b3a8a','#ffd43b'],building:['#4263eb','#1b3a8a','#ffffff'],dumbbell:['#e8590c','#333333'],pulse:['#e03131'],laptop:['#343a40','#4263eb'],bars:['#4263eb','#e8590c','#999999'],rocket:['#e8590c','#4263eb','#e03131'],seal:['#c99700','#e03131'],arch:['#c99700','#ffd166'],wave:['#4263eb','#74c0fc']};
const colA=(F,n)=>(F&&F.hc&&F.hc[n])||((n==='mandala'||n==='jaali'||n==='dots'||n==='frame'||n==='stars'||n==='bokeh'||n==='confetti')&&F&&F.p?F.p:DC[n]||['#ffd166','#e8590c','#fff3bf']);
const fitA=(n,mw,mh)=>{const ar=ARTAR[n];let w=mw,h=w*ar;if(h>mh){h=mh;w=h/ar}return [w,h]};
function artAt(F,n,cx,cy,mw,mh,o={},cols){const [w,h]=fitA(n,mw,mh);return AI(n,cx-w/2,cy-h/2,w,cols||colA(F,n),o)}
const T_=(t,x,y,w,s,o)=>{const e=TX(t,x,y,w,s,o);layoutText(e);return e};
function flowT(x,w,y,items,u,limit){let k=1,res;
  const build=k=>{const out=[];let cy=y;for(const it of items){if(typeof it==='number'){cy+=it*u*k;continue}const [t,sz,o]=it;const e=T_(t,x,cy,w,sz*k,Object.assign({align:'center'},o||{}));out.push(e);cy+=e.h}return {o:out,end:cy}};
  for(let i=0;i<3;i++){res=build(k);if(!limit||res.end<=limit)break;k=Math.max(.5,k*(limit-y)/(res.end-y)*.97)}return res}
const bgOf=F=>F.lt?{t:'grad',k:'lin',c1:F.d[0],c2:F.d[1]||F.d[0],a:170}:{t:'grad',k:'lin',c1:F.d[0],c2:F.d[1]||F.d[0],a:165};
const inkOf=F=>F.lt?(F.k||'#2b2118'):'#ffffff';
function heroCluster(F,o,cx,cy,s){
  const H=F.H||['diya'];const [m,l,r]=H;
  if(l)o.push(artAt(F,l,cx-s*.66,cy+s*.2,s*.5,s*.62,{rot:-9}));
  if(r)o.push(artAt(F,r,cx+s*.66,cy+s*.2,s*.5,s*.62,{rot:9}));
  o.push(artAt(F,m,cx,cy,s,s*1.05));
}
function bgDecor(F,o,W,H,u){
  if(F.lt)o.push(AI(F.pat||'jaali',0,0,W,[F.p[0]],{fill:H,op:F.pat==='dots'?.09:.07,nm:'Pattern'}));
  else o.push(AI('stars',0,0,W,[F.p[2],F.p[0]],{fill:H,seed:(F.n.length*7)+3,op:.75,nm:'Sparkle field'}));
}
const natF=(F,u,sz)=>F.hi?{t:F.hi,f:F.hf||'Rozha One',s:sz||(F.hi.length>18?8:F.hi.length>12?10.5:13)}:null;

const LAY={
 center:F=>(W,H,u)=>{const o=[],cx=W/2,ink=inkOf(F);bgDecor(F,o,W,H,u);
  o.push(AI(F.M||'mandala',cx-W*.6,H*.47-W*.6,W*1.2,colA(F,F.M||'mandala'),{op:F.lt?.16:.18,nm:'Mandala'}));
  if(F.top)o.push(AI(F.top,0,0,W,colA(F,F.top),{nm:'Garland'}));
  const hs=u*33;heroCluster(F,o,cx,H*.33,hs);
  const nf=natF(F,u),items=[];
  if(nf)items.push([nf.t,u*nf.s,{font:nf.f,color:F.p[0],lh:1.1}],1.2);
  items.push([F.en,u*(F.en.length>14?9:12),{font:F.script||'Great Vibes',color:ink,lh:1.05}],1.8,[F.msg,u*3.3,{color:ink,op:.88,lh:1.45,font:'Poppins'}]);
  const fl=flowT(W*.1,W*.8,H*.54,items,u,H*.9);o.push(...fl.o);
  o.push(SH('rect',cx-u*8,H*.93,u*16,u*.5,F.p[0]),T_('With best wishes',0,H*.945,W,u*3,{align:'center',color:ink,op:.75,ls:14,upper:true,font:'Poppins'}));
  return {bg:bgOf(F),objs:o}},
 frame:F=>(W,H,u)=>{const o=[],cx=W/2,ink=inkOf(F);bgDecor(F,o,W,H,u);
  o.push(AI('frame',0,0,W,[F.p[0],F.p[1]],{fill:H,nm:'Border'}));
  if(F.top)o.push(AI(F.top,W*.1,H*.055,W*.8,colA(F,F.top),{nm:'Garland'}));
  heroCluster(F,o,cx,H*.3,u*30);
  const nf=natF(F,u,F.hi&&F.hi.length>14?7.4:10.5),items=[];
  if(nf)items.push([nf.t,u*nf.s,{font:nf.f,color:F.p[0],lh:1.1}],1);
  items.push([F.en.toUpperCase(),u*(F.en.length>14?4.6:6),{font:'Cinzel Decorative',bold:true,color:ink,ls:6,lh:1.2}],1.6,[F.msg,u*3.2,{color:ink,op:.85,lh:1.5,font:'Lora',italic:true}]);
  const fl=flowT(W*.14,W*.72,H*.5,items,u,H*.82);o.push(...fl.o);
  o.push(AI('ribbon',W*.5-u*18,H*.84,u*36,[F.p[0],F.p[2]],{}),T_('FROM: YOUR NAME',W*.5-u*18,H*.84+u*2.6,u*36,u*2.8,{align:'center',color:F.lt?'#ffffff':'#1f1c19',bold:true,ls:10,font:'Poppins'}));
  return {bg:bgOf(F),objs:o}},
 story:F=>(W,H,u)=>{const o=[],cx=W/2,ink=inkOf(F);bgDecor(F,o,W,H,u);
  o.push(AI(F.M||'mandala',cx-W*.8,H*.64-W*.8,W*1.6,colA(F,F.M||'mandala'),{op:F.lt?.15:.2,nm:'Mandala'}));
  if(F.top)o.push(AI(F.top,0,0,W,colA(F,F.top),{nm:'Garland'}));
  heroCluster(F,o,cx,H*.26,W*.62);
  const nf=natF(F,u,F.hi&&F.hi.length>16?9:13),items=[];
  if(nf)items.push([nf.t,u*nf.s,{font:nf.f,color:F.p[0],lh:1.1}],1.4);
  items.push([F.en,u*(F.en.length>14?10:13),{font:F.script||'Great Vibes',color:ink,lh:1.05}],2,[F.msg,u*3.4,{color:ink,op:.88,lh:1.5,font:'Poppins'}]);
  const fl=flowT(W*.09,W*.82,H*.48,items,u,H*.86);o.push(...fl.o);
  o.push(SH('rect',W*.2,H*.88,W*.6,u*10,F.p[0],{r:u*5}),T_('Your name · Your brand',W*.2,H*.88+u*2.6,W*.6,u*4,{align:'center',bold:true,color:F.lt?'#ffffff':'#1f1c19',font:'Poppins'}));
  return {bg:bgOf(F),objs:o}},
 sale:F=>(W,H,u)=>{const o=[],ink=inkOf(F);bgDecor(F,o,W,H,u);
  o.push(AI(F.M||'mandala',W*.38,H*.3,W*.9,colA(F,F.M||'mandala'),{op:.5,nm:'Mandala'}));
  heroCluster(F,o,W*.74,H*.66,u*36);
  o.push(T_(F.n.toUpperCase(),W*.08,H*.1,W*.8,u*4.4,{bold:true,color:F.p[0],ls:30,font:'Poppins'}));
  const a=T_(F.hd||'FESTIVE\nSALE',W*.08,H*.15,W*.84,u*(F.hd?14:20),{font:'Anton',color:ink,lh:.98});o.push(a);
  const y=a.y+a.h+u*3;o.push(SH('rect',W*.08,y,u*58,u*13,F.p[0],{r:u*3}),T_(F.off||'FLAT 50% OFF',W*.08,y+u*2.6,u*58,u*7.4,{font:'Anton',color:F.lt?'#ffffff':'#1f1c19',align:'center',ls:2}));
  o.push(T_(F.hd?F.msg:'On all products · '+F.en+'!',W*.08,y+u*17,W*.5,u*3.4,{color:ink,op:.85,lh:1.5,font:'Poppins'}));
  o.push(SH('rect',W*.08,H*.88,u*36,u*8.4,ink,{r:u*4.2}),T_(F.cta||'SHOP NOW',W*.08,H*.88+u*2,u*36,u*4.4,{bold:true,align:'center',color:F.lt?'#ffffff':F.d[0],ls:6,font:'Poppins'}));
  return {bg:bgOf(F),objs:o}},
 invite:F=>(W,H,u)=>{const o=[],cx=W/2,ink=inkOf(F);bgDecor(F,o,W,H,u);
  o.push(AI('arch',W*.08,H*.05,W*.84,[F.p[0],F.p[1]],{nm:'Arch'}));
  o.push(artAt(F,F.H[0],cx,H*.2,W*.36,H*.17));
  const nf=natF(F,u,F.hi&&F.hi.length>16?5.6:8),items=[[F.kick||'YOU ARE INVITED TO',u*2.6,{color:ink,op:.8,ls:22,font:'Poppins',bold:true}],1.2];
  if(nf)items.push([nf.t,u*nf.s,{font:nf.f,color:F.p[0],lh:1.15}],.8);
  items.push([F.en,u*(F.en.length>14?7:9),{font:F.script||'Great Vibes',color:ink,lh:1.05}],2.4,[F.when||'SATURDAY · 12 NOVEMBER · 7 PM',u*2.8,{color:F.p[0],bold:true,ls:10,font:'Poppins'}],1,[F.where||'Your Venue Name, City',u*3,{color:ink,op:.85,font:'Lora',italic:true}],1.6,[F.line||'Join us for an evening of lights, music and sweets.',u*2.8,{color:ink,op:.8,lh:1.5,font:'Poppins'}]);
  const fl=flowT(W*.18,W*.64,H*.36,items,u,H*.86);o.push(...fl.o);
  o.push(SH('rect',cx-u*15,H*.88,u*30,u*7,F.p[0],{r:u*3.5}),T_(F.rsvp||'RSVP · +00 000 000 000',cx-u*15,H*.88+u*1.9,u*30,u*3,{align:'center',bold:true,color:F.lt?'#ffffff':'#1f1c19',font:'Poppins'}));
  return {bg:bgOf(F),objs:o}},
 banner:F=>(W,H,u)=>{const o=[],ink=inkOf(F);bgDecor(F,o,W,H,u);
  o.push(AI(F.M||'mandala',W*.56,-H*.4,H*1.8,colA(F,F.M||'mandala'),{op:.35,nm:'Mandala'}));
  heroCluster(F,o,W*.8,H*.52,H*.66);
  const nf=natF(F,u),items=[];if(nf)items.push([nf.t,H*(F.hi.length>16?.12:.17),{font:nf.f,color:F.p[0],align:'left',lh:1.1}],.4);
  items.push([F.en,H*(F.en.length>14?.15:.19),{font:F.script||'Great Vibes',color:ink,align:'left',lh:1.05}],.5,[F.msg,H*.052,{color:ink,op:.88,align:'left',lh:1.45,font:'Poppins'}]);
  const fl=flowT(W*.06,W*.5,H*.14,items,H/100,H*.9);o.push(...fl.o);return {bg:bgOf(F),objs:o}},
 poster:F=>(W,H,u)=>{const o=[],cx=W/2,ink=inkOf(F);bgDecor(F,o,W,H,u);
  o.push(AI(F.M||'mandala',cx-W*.7,H*.34-W*.7,W*1.4,colA(F,F.M||'mandala'),{op:.2,nm:'Mandala'}));
  if(F.top)o.push(AI(F.top,0,0,W,colA(F,F.top),{nm:'Garland'}));
  heroCluster(F,o,cx,H*.3,W*.5);
  const nf=natF(F,u,F.hi&&F.hi.length>16?8:12),items=[];
  if(nf)items.push([nf.t,u*nf.s,{font:nf.f,color:F.p[0],lh:1.1}],1);
  items.push([F.en.toUpperCase(),u*(F.en.length>14?7:10),{font:'Anton',color:ink,ls:4,lh:1}],2,[F.msg,u*2.8,{color:ink,op:.88,lh:1.5,font:'Poppins'}]);
  const fl=flowT(W*.1,W*.8,H*.54,items,u,H*.84);o.push(...fl.o);
  o.push(SH('rect',W*.1,H*.86,W*.8,u*.35,F.p[0]),T_('Your Business Name',W*.1,H*.875,W*.5,u*3.2,{bold:true,color:ink,font:'Poppins'}),T_('www.yourwebsite.com  ·  +00 000 000 000',W*.1,H*.905,W*.8,u*2.6,{color:ink,op:.75,font:'Poppins'}));
  return {bg:bgOf(F),objs:o}},
 minimal:F=>(W,H,u)=>{const o=[],cx=W/2,ink=inkOf(F);
  o.push(SH('rect',0,0,W,H,F.lt?F.d[0]:F.d[0]));o.push(AI(F.pat||'dots',0,0,W,[F.p[0],F.p[1]],{fill:H,op:F.lt?.12:.18}));
  o.push(AI('wave',0,H*.78,W,[F.p[0],F.p[1]],{nm:'Wave',h:W*.3,fit:'cover',op:.9}));
  o.push(artAt(F,F.H[0],cx,H*.18,W*.24,H*.2));
  const nf=natF(F,u,F.hi&&F.hi.length>16?10:16),items=[];
  if(nf)items.push([nf.t,u*nf.s,{font:nf.f,color:F.p[0],lh:1.15}],2);
  items.push([F.en.toUpperCase(),u*4.6,{font:'Poppins',bold:true,color:ink,ls:14}],2,[F.msg,u*3.2,{color:ink,op:.85,lh:1.5,font:'Lora',italic:true}]);
  const fl=flowT(W*.1,W*.8,H*.32,items,u,H*.76);o.push(...fl.o);return {bg:{t:'solid',c:F.d[0]},objs:o}}
};

const FEST=[
 {n:'Diwali',en:'Happy Diwali',hi:'शुभ दीपावली',msg:'May the festival of lights fill your home with joy, prosperity and endless sweetness.',d:['#2b0a4e','#0d0220'],p:['#ffb703','#fb8500','#ffe8a3'],H:['diya','diya','diya'],top:'toran',M:'mandala',big:1},
 {n:'Dhanteras',en:'Happy Dhanteras',hi:'शुभ धनतेरस',msg:'May Goddess Lakshmi bless you with wealth, health and happiness.',d:['#5c0a14','#1f0207'],p:['#ffc300','#ff9f1c','#fff0b3'],H:['kalash','gem','diya'],top:'toran',M:'mandala'},
 {n:'Bhai Dooj',en:'Happy Bhai Dooj',hi:'भाई दूज की शुभकामनाएं',msg:'For the bond that never breaks — a tilak of love, a promise of protection.',d:['#fff0f5','#ffd6e6'],lt:1,k:'#6b0f3a',p:['#c2255c','#f06595','#ffd6e6'],H:['diya','sparkle','gift'],top:'vine',M:'rangoli'},
 {n:'Holi',en:'Happy Holi',hi:'होली की शुभकामनाएं',msg:'May your life be painted in the brightest colours of love, laughter and joy.',d:['#ffffff','#fff3d9'],lt:1,k:'#2b1b4b',p:['#d6336c','#7048e8','#f59f00'],H:['gulal','sparkle','balloons'],M:'rangoli',pat:'dots',big:1,hc:{gulal:['#e03131','#f59f00','#7048e8','#2f9e44','#1c7ed6','#d6336c']}},
 {n:'Navratri',en:'Happy Navratri',hi:'शुभ नवरात्रि',msg:'Nine nights of devotion, dance and divine blessings. Jai Mata Di!',d:['#7a0c1e','#2a0309'],p:['#ffc300','#ff6b35','#ffe8a3'],H:['rangoli','dandiya','diya'],top:'toran',M:'rangoli',big:1},
 {n:'Dussehra',en:'Happy Dussehra',hi:'शुभ विजयादशमी',msg:'May good always triumph over evil. Wishing you victory in everything you do.',d:['#3b0a0a','#150303'],p:['#ff9f1c','#e63946','#ffe0b2'],H:['flame','bell','firework'],top:'toran',M:'mandala'},
 {n:'Durga Puja',en:'Shubho Durga Puja',hi:'दुर्गा पूजा की शुभकामनाएं',msg:'May Maa Durga bless you with strength, courage and endless happiness.',d:['#fff7f0','#ffe1d0'],lt:1,k:'#7a0c1e',p:['#c1121f','#e85d04','#ffd6a5'],H:['lotus','bell','diya'],top:'vine',M:'mandala',big:1},
 {n:'Ganesh Chaturthi',en:'Ganpati Bappa Morya',hi:'गणपति बप्पा मोरया',msg:'May Lord Ganesha remove all obstacles and bless your home with wisdom and joy.',d:['#ff9f1c','#e85d04'],p:['#fffbe6','#7a0c1e','#ffe8a3'],H:['kalash','lotus','bell'],top:'toran',M:'mandala',big:1},
 {n:'Raksha Bandhan',en:'Happy Raksha Bandhan',hi:'रक्षाबंधन की शुभकामनाएं',msg:'For the thread of love that binds hearts forever. Happy Rakhi!',d:['#fff3e0','#ffd9a8'],lt:1,k:'#7a2e00',p:['#e03131','#f59f00','#fff3bf'],H:['rakhi','sparkle','gift'],top:'vine',M:'mandala'},
 {n:'Janmashtami',en:'Happy Janmashtami',hi:'जन्माष्टमी की शुभकामनाएं',msg:'May Lord Krishna fill your life with love, music and blessings.',d:['#0b2a5b','#04122b'],p:['#ffd60a','#4cc9f0','#fff3bf'],H:['feather','pot','lotus'],M:'mandala',hc:{feather:['#1098ad','#1864ab','#2f9e44']}},
 {n:'Karwa Chauth',en:'Happy Karwa Chauth',hi:'करवा चौथ की शुभकामनाएं',msg:'For love that waits under the moon — blessings of a lifetime together.',d:['#5c0a2f','#220413'],p:['#ffd166','#ef476f','#ffe8a3'],H:['moon','diya','sparkle'],M:'mandala',top:'toran'},
 {n:'Maha Shivaratri',en:'Maha Shivaratri',hi:'महाशिवरात्रि की शुभकामनाएं',msg:'Om Namah Shivaya. May the night of Shiva bring peace, power and light.',d:['#0f1b4d','#050a24'],p:['#8ecae6','#e0aaff','#e0f4ff'],H:['crescent','lotus','bell'],M:'mandala'},
 {n:'Ram Navami',en:'Happy Ram Navami',hi:'राम नवमी की शुभकामनाएं',msg:'Jai Shri Ram. May the values of Lord Ram guide your every step.',d:['#ffb703','#f77f00'],p:['#7a0c1e','#fffbe6','#ffe8a3'],H:['sun','bell','diya'],top:'toran',M:'mandala'},
 {n:'Hanuman Jayanti',en:'Hanuman Jayanti',hi:'हनुमान जयंती की शुभकामनाएं',msg:'May the strength and devotion of Hanuman ji be with you always.',d:['#d62828','#7a0c1e'],p:['#ffd166','#fffbe6','#ffe8a3'],H:['sun','bell','flame'],M:'mandala',top:'toran'},
 {n:'Makar Sankranti',en:'Happy Makar Sankranti',hi:'मकर संक्रांति की शुभकामनाएं',msg:'Let your dreams soar high like a kite. Til-gul ghya, god god bola!',d:['#a5d8ff','#e7f5ff'],lt:1,k:'#0b3d91',p:['#e8590c','#f59f00','#fff3bf'],H:['kite','kite','sun'],M:'mandala',pat:'dots',big:1,hc:{kite:['#e03131','#ffd43b','#444444']}},
 {n:'Lohri',en:'Happy Lohri',hi:'ਲੋਹੜੀ ਦੀਆਂ ਲੱਖ ਲੱਖ ਵਧਾਈਆਂ',hf:'Noto Sans Gurmukhi',msg:'Warmth of the bonfire, sweetness of gajak, joy of dance. Happy Lohri!',d:['#3b0d0d','#140404'],p:['#ff9f1c','#ffd166','#fff0b3'],H:['flame','wheat','sparkle'],M:'mandala'},
 {n:'Pongal',en:'Happy Pongal',hi:'இனிய பொங்கல் நல்வாழ்த்துக்கள்',hf:'Noto Sans Tamil',msg:'May the harvest bring overflowing happiness. Pongalo Pongal!',d:['#fff8e1','#ffe9a8'],lt:1,k:'#4a2c0b',p:['#e8590c','#2f9e44','#ffe9a8'],H:['pot','cane','sun'],top:'leafrow',M:'kolam',big:1},
 {n:'Baisakhi',en:'Happy Baisakhi',hi:'ਵਿਸਾਖੀ ਦੀਆਂ ਵਧਾਈਆਂ',hf:'Noto Sans Gurmukhi',msg:'A golden harvest, a new beginning. Wishing you joy and abundance.',d:['#fff3bf','#ffd43b'],lt:1,k:'#5c3a00',p:['#e8590c','#2f9e44','#fff3bf'],H:['wheat','sun','wheat'],M:'mandala',pat:'dots'},
 {n:'Onam',en:'Happy Onam',hi:'ഓണാശംസകൾ',hf:'Noto Sans Malayalam',msg:'May Maveli bring you prosperity, a feast of joy and a pookalam of smiles.',d:['#fffaf0','#ffe8b3'],lt:1,k:'#5a2d0c',p:['#e8590c','#2f9e44','#ffe8b3'],H:['rangoli','lotus','diya'],top:'leafrow',M:'rangoli',big:1},
 {n:'Ugadi',en:'Happy Ugadi',hi:'ఉగాది శుభాకాంక్షలు',hf:'Noto Sans Telugu',msg:'A new year, new hopes. May it taste of sweet, sour and everything in between.',d:['#fff8e1','#ffe0b2'],lt:1,k:'#4a2c0b',p:['#e8590c','#2f9e44','#ffe0b2'],H:['kalash','leaf','sparkle'],top:'leafrow',M:'mandala'},
 {n:'Gudi Padwa',en:'Happy Gudi Padwa',hi:'गुढीपाडव्याच्या हार्दिक शुभेच्छा',msg:'May the Gudi of victory bring joy and prosperity to your home.',d:['#ff9f1c','#e85d04'],p:['#fffbe6','#7a0c1e','#ffe8a3'],H:['kalash','leaf','sun'],top:'toran',M:'mandala'},
 {n:'Vishu',en:'Happy Vishu',hi:'വിഷു ആശംസകൾ',hf:'Noto Sans Malayalam',msg:'May the Vishukkani bring a year full of light and plenty.',d:['#fff7cc','#ffe066'],lt:1,k:'#4a2c0b',p:['#e8590c','#2f9e44','#fff7cc'],H:['kalash','diya','sparkle'],top:'vine',M:'mandala'},
 {n:'Poila Boishakh',en:'Shubho Noboborsho',hi:'শুভ নববর্ষ',hf:'Noto Sans Bengali',msg:'Wishing you a new year of peace, prosperity and sweet beginnings.',d:['#ffffff','#ffe3e3'],lt:1,k:'#7a0c1e',p:['#d62828','#f77f00','#ffe3e3'],H:['rangoli','sun','diya'],top:'vine',M:'kolam'},
 {n:'Guru Nanak Jayanti',en:'Guru Nanak Jayanti',hi:'ਗੁਰਪੁਰਬ ਦੀਆਂ ਲੱਖ ਲੱਖ ਵਧਾਈਆਂ',hf:'Noto Sans Gurmukhi',msg:'Waheguru ji ka Khalsa, Waheguru ji ki Fateh. Wishing you peace and light.',d:['#0a3d91','#041a45'],p:['#ffd60a','#ffffff','#fff3bf'],H:['sun','diya','sparkle'],M:'mandala'},
 {n:'Buddha Purnima',en:'Happy Buddha Purnima',hi:'बुद्ध पूर्णिमा की शुभकामनाएं',msg:'May the light of Buddha guide you to peace, compassion and wisdom.',d:['#2a1b4d','#0d0722'],p:['#ffd166','#e0aaff','#fff3bf'],H:['moon','lotus','lotus'],M:'mandala'},
 {n:'Mahavir Jayanti',en:'Mahavir Jayanti',hi:'महावीर जयंती की शुभकामनाएं',msg:'Live and let live. May Lord Mahavir’s teachings guide you.',d:['#fff7e0','#ffe9b0'],lt:1,k:'#5c3a00',p:['#e8590c','#c99700','#ffe9b0'],H:['lotus','lotus','sparkle'],top:'vine',M:'mandala'},
 {n:'Eid al-Fitr',en:'Eid Mubarak',hi:'ईद मुबारक',msg:'May Allah accept your prayers and fill your life with peace and happiness.',d:['#06402b','#021d13'],p:['#ffd166','#80ed99','#fff3bf'],H:['crescent','lantern','lantern'],M:'mandala',big:1},
 {n:'Eid al-Adha',en:'Eid al-Adha Mubarak',hi:'ईद-उल-अज़हा मुबारक',msg:'May the spirit of sacrifice and sharing bless you and your family.',d:['#0b3c5d','#04192a'],p:['#ffd166','#8ecae6','#fff3bf'],H:['crescent','lantern','moon'],M:'mandala'},
 {n:'Ramadan',en:'Ramadan Kareem',hi:'रमज़ान मुबारक',msg:'A month of mercy, reflection and togetherness. Ramadan Mubarak.',d:['#1b2a49','#080e1f'],p:['#ffd166','#c7f9cc','#fff3bf'],H:['lantern','crescent','lantern'],M:'mandala'},
 {n:'Christmas',en:'Merry Christmas',hi:'मेरी क्रिसमस',hf:'Yatra One',msg:'Wishing you peace, joy and a season full of warmth and wonder.',d:['#7a0c14','#33040a'],p:['#ffd43b','#ffffff','#fff3bf'],H:['xtree','gift','bell'],M:'mandala',pat:'dots',big:1,script:'Pacifico'},
 {n:'New Year',en:'Happy New Year',hi:'नव वर्ष की शुभकामनाएं',msg:'New dreams, new goals, new memories. Cheers to a brighter year ahead!',d:['#0b1a3b','#02050f'],p:['#ffd166','#ff5d8f','#ffffff'],H:['firework','sparkle','firework'],M:'mandala',big:1},
 {n:'Republic Day',en:'Happy Republic Day',hi:'गणतंत्र दिवस की शुभकामनाएं',msg:'Proud of our Constitution, proud to be Indian. Jai Hind!',d:['#ffffff','#f1fff0'],lt:1,k:'#0a2a66',p:['#FF9933','#138808','#000080'],H:['chakra','flag','chakra'],M:'mandala',pat:'dots',big:1,hc:{mandala:['#FF9933','#138808','#000080']}},
 {n:'Independence Day',en:'Happy Independence Day',hi:'स्वतंत्रता दिवस की शुभकामनाएं',msg:'Freedom is a responsibility we carry with pride. Jai Hind!',d:['#ffffff','#fff1e0'],lt:1,k:'#0a2a66',p:['#FF9933','#138808','#000080'],H:['flag','chakra','kite'],M:'mandala',pat:'dots',big:1,hc:{mandala:['#FF9933','#138808','#000080']}},
 {n:'Gandhi Jayanti',en:'Gandhi Jayanti',hi:'गांधी जयंती',msg:'Be the change you wish to see in the world.',d:['#fbf3e0','#efe0b8'],lt:1,k:'#3a2d12',p:['#c2410c','#138808','#efe0b8'],H:['chakra','leaf','sparkle'],M:'mandala'},
 {n:'Teachers’ Day',en:'Happy Teachers’ Day',hi:'शिक्षक दिवस की शुभकामनाएं',msg:'Thank you for lighting the path to knowledge. You shape the future.',d:['#e7f5ff','#c5e4ff'],lt:1,k:'#0b2a5b',p:['#1c7ed6','#f59f00','#e7f5ff'],H:['book','cap','bulb'],M:'mandala',pat:'dots',hc:{book:['#4263eb','#f59f00','#ffffff']}},
 {n:'Children’s Day',en:'Happy Children’s Day',hi:'बाल दिवस की शुभकामनाएं',msg:'Stay curious, stay joyful, stay young at heart!',d:['#e3fafc','#fff3bf'],lt:1,k:'#0b3d4a',p:['#f06595','#339af0','#ffd43b'],H:['balloons','kite','sparkle'],M:'rangoli',pat:'dots',script:'Pacifico'},
 {n:'Women’s Day',en:'Happy Women’s Day',hi:'अंतर्राष्ट्रीय महिला दिवस की शुभकामनाएं',msg:'Here’s to strong women. May we know them, be them, raise them.',d:['#fff0f6','#fcc2d7'],lt:1,k:'#6b0f3a',p:['#c2255c','#7048e8','#ffd6e6'],H:['lotus','crown','heart'],top:'vine',M:'mandala'},
 {n:'Mother’s Day',en:'Happy Mother’s Day',hi:'मातृ दिवस की शुभकामनाएं',msg:'For the love that never asks for anything in return. Thank you, Maa.',d:['#fff0f6','#ffc9de'],lt:1,k:'#6b0f3a',p:['#e03177','#f783ac','#ffe3ef'],H:['heart','lotus','sparkle'],top:'vine',M:'mandala'},
 {n:'Father’s Day',en:'Happy Father’s Day',hi:'पितृ दिवस की शुभकामनाएं',msg:'Thank you for being my strength, my guide and my hero.',d:['#102a43','#061826'],p:['#ffd166','#4cc9f0','#ffffff'],H:['trophy','cup','sparkle'],M:'mandala'},
 {n:'Valentine’s Day',en:'Happy Valentine’s Day',hi:'',msg:'You are my today and all of my tomorrows.',d:['#7a0c3a','#2b0416'],p:['#ff8fab','#ffd6e0','#ffffff'],H:['heart','rings','sparkle'],M:'mandala',script:'Great Vibes'},
 {n:'Friendship Day',en:'Happy Friendship Day',hi:'मित्रता दिवस की शुभकामनाएं',msg:'Friends are the family we choose. Thank you for being mine.',d:['#fff4e6','#ffd8a8'],lt:1,k:'#6a2c00',p:['#e8590c','#7048e8','#ffd43b'],H:['balloons','sparkle','heart'],M:'rangoli',pat:'dots'},
 {n:'Akshaya Tritiya',en:'Happy Akshaya Tritiya',hi:'अक्षय तृतीया की शुभकामनाएं',msg:'May your prosperity never diminish. Blessings of gold, growth and good fortune.',d:['#4a0d0d','#1a0404'],p:['#ffc300','#ff9f1c','#fff0b3'],H:['kalash','gem','sparkle'],top:'toran',M:'mandala'},
 {n:'Basant Panchami',en:'Happy Basant Panchami',hi:'बसंत पंचमी की शुभकामनाएं',msg:'May Maa Saraswati bless you with wisdom, art and knowledge.',d:['#fff3bf','#ffe066'],lt:1,k:'#5c3a00',p:['#e8590c','#f59f00','#fff3bf'],H:['lotus','book','sparkle'],top:'vine',M:'mandala',hc:{lotus:['#ffffff','#f59f00','#fff7cc']}}
];
const FEST_LAYOUTS=['center','frame','story','sale'],BIG_EXTRA=['invite','banner','poster'];
const LAYSZ={center:[1080,1080],frame:[1080,1080],story:[1080,1920],sale:[1080,1080],invite:[1050,1470],banner:[1640,624],poster:[1240,1754],minimal:[1080,1080]};
const LAYNAME={center:'Greeting',frame:'Classic card',story:'Story',sale:'Festive offer',invite:'Invitation',banner:'Facebook cover',poster:'Poster',minimal:'Minimal'};
FEST.forEach((F,i)=>{const L=FEST_LAYOUTS.slice();L[(i%2)?1:3]=L[(i%2)?1:3];if(i%3===0)L.push('minimal');if(F.big)L.push(...BIG_EXTRA);
  L.forEach(l=>TEMPLATES.push({n:`${F.n} ${LAYNAME[l]}`,c:'Festivals',g:F.n,tag:`indian festival ${F.n} ${F.en} greeting wishes`,s:LAYSZ[l],b:LAY[l](F)}))});

const tplSize=t=>t.s||(t.n==='Business card'?[1050,600]:t.c==='Slides'?[1920,1080]:t.n==='Flyer'||t.n==='Event poster'?[1240,1754]:[1080,1080]);
const tplThumbs=new Map(),tplDrawn=new Set();
const fontsOf=objs=>{const s=new Set();objs.forEach(o=>{if(o.type==='text'&&o.font)s.add(`${o.bold?700:400} 40px "${o.font}"`)});return [...s]};
const waitImgs=(objs,ms)=>Promise.race([Promise.all(objs.filter(o=>o.type==='image'&&o.src).map(o=>new Promise(res=>{const i=getImg(o.src);if(i.complete&&i.naturalWidth)return res();i.addEventListener('load',res,{once:true});i.addEventListener('error',res,{once:true})}))),new Promise(r=>setTimeout(r,ms))]);
async function paintThumb(c,t){
  const [W,H]=tplSize(t);let built;try{built=buildTemplate(t,W,H)}catch(e){return}
  try{await Promise.race([Promise.all(fontsOf(built.objs).map(f=>document.fonts.load(f,'Aa आ'))),new Promise(r=>setTimeout(r,1500))])}catch(e){}
  await waitImgs(built.objs,2500);
  try{built=buildTemplate(t,W,H);const k=c.width/W,x=c.getContext('2d');x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,c.width,c.height);x.scale(k,k);x.fillStyle='#fff';x.fillRect(0,0,W,H);drawPageContent(x,built,W,H,{s:k});tplDrawn.add(c)}catch(e){}
}
let thumbIO=null;
function tplThumb(t){
  let c=tplThumbs.get(t);if(c)return c;
  const [W,H]=tplSize(t),k=Math.min(2,(devicePixelRatio||1))*300/Math.max(W,H);c=document.createElement('canvas');c.width=Math.round(W*k);c.height=Math.round(H*k);c.title=t.n;c.style.aspectRatio=W+'/'+H;
  tplThumbs.set(t,c);c._t=t;
  if('IntersectionObserver' in window){if(!thumbIO)thumbIO=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){thumbIO.unobserve(e.target);paintThumb(e.target,e.target._t)}}),{rootMargin:'300px'});thumbIO.observe(c)}else paintThumb(c,t);
  return c;
}
/* ---------- editor side panel + applying a template ---------- */
function adoptArt(objs){const m=new Map(),walk=l=>l.forEach(o=>{if(o.type==='image'&&typeof o.src==='string'&&o.src.startsWith('data:')){let id=m.get(o.src);if(!id){id='a_'+uid();D.assets[id]=o.src;m.set(o.src,id)}o.src=id}if(o.kids)walk(o.kids)});walk(objs)}
function applyTemplate(t){const built=buildTemplate(t,D.w,D.h);adoptArt(built.objs);P().bg=built.bg;P().objs=built.objs;sel=[];touch();selChanged();toast('Template applied — everything is editable')}
let tplQ='';
function pTemplates(b){
  b.append(el('h3',{class:'ph'},'Templates'));
  const q=searchBox('Search: Diwali, wedding, resume…',v=>{tplQ=v;draw()});$('input',q).value=tplQ;b.append(q);
  const cats=['All',...TCATS.filter(c=>TEMPLATES.some(t=>t.c===c))];
  b.append(el('div',{class:'chips'},cats.map(c=>el('button',{class:'chip','aria-pressed':tplCat===c,onclick:()=>{tplCat=c;renderPanel()}},c))));
  b.append(el('p',{class:'note'},'Applies to the current page and adapts to your canvas size.'));
  const g=el('div',{class:'grid2'});b.append(g);
  function draw(){g.innerHTML='';const s=tplQ.trim().toLowerCase();TEMPLATES.filter(t=>(tplCat==='All'||t.c===tplCat)&&(!s||(t.n+' '+t.c+' '+(t.g||'')+' '+(t.tag||'')).toLowerCase().includes(s))).slice(0,150).forEach(t=>{const [w,h]=tplSize(t);g.append(el('button',{class:'tpl','aria-label':'Apply template '+t.n,onclick:()=>applyTemplate(t)},el('div',{style:'display:grid;place-items:center;height:128px;width:100%'},tplThumb(t)),el('span',{},t.n)))});if(!g.children.length)g.append(el('p',{class:'note'},'No templates match.'))}
  draw();
}

/* ---------- more template families: events, business, slides, print, social ---------- */
const add=(c,n,s,b,tag)=>TEMPLATES.push({n,c,s,b,tag:tag||''});
const dkInk='#1f1c19';
const pill=(x,y,w,h,fill,txt,tc,u,o={})=>[SH('rect',x,y,w,h,fill,{r:h/2}),T_(txt,x,y+(h-u*4.2)/2-u*.2,w,u*4.2,Object.assign({align:'center',bold:true,color:tc,font:'Poppins'},o))];

/* ---- events & weddings: reuse the festival layouts with event wording ---- */
const EVENTS=[
 {c:'Wedding & Events',n:'Royal wedding',en:'Rahul & Priya',hi:'शुभ विवाह',kick:'TOGETHER WITH THEIR FAMILIES',when:'SUNDAY · 14 DECEMBER 2026 · 6 PM',where:'The Grand Palace, Udaipur',line:'request the pleasure of your company at the wedding ceremony.',msg:'Together with their families, request the pleasure of your company at the wedding.',d:['#4a0e1c','#1d040a'],p:['#e9b949','#ffd166','#fff0c2'],H:['rings','paisley','paisley'],top:'vine',M:'mandala',script:'Great Vibes',L:['invite','frame','story'],tag:'shaadi vivah marriage'},
 {c:'Wedding & Events',n:'Floral wedding',en:'Aarav & Meera',hi:'शुभ विवाह',kick:'SAVE THE DATE',when:'SATURDAY · 21 FEBRUARY 2027',where:'Kochi, Kerala',line:'Join us as we begin our forever.',msg:'Join us as we begin our forever.',d:['#fff5f7','#ffdfe8'],lt:1,k:'#6b2442',p:['#c2255c','#e599b4','#ffe3ec'],H:['lotus','heart','leaf'],top:'vine',M:'rangoli',script:'Great Vibes',L:['invite','frame'],tag:'shaadi marriage'},
 {c:'Wedding & Events',n:'Save the date',en:'Save the Date',hi:'',kick:'WE ARE GETTING MARRIED',when:'12 · 12 · 2026',where:'Ananya & Karthik',line:'Formal invitation to follow.',msg:'Formal invitation to follow.',d:['#0f3d3e','#05191a'],p:['#e9c46a','#2a9d8f','#fff3c4'],H:['rings','sparkle','sparkle'],M:'mandala',script:'Great Vibes',L:['invite','center'],tag:'wedding'},
 {c:'Wedding & Events',n:'Haldi ceremony',en:'Haldi Ceremony',hi:'हल्दी की रस्म',kick:'YOU ARE INVITED TO THE',when:'FRIDAY · 11 DECEMBER · 10 AM',where:'Sharma Residence, Delhi',line:'Dress in yellow and come ready to play.',msg:'Dress in yellow. Come ready to celebrate with turmeric, music and joy.',d:['#fff3a8','#ffd43b'],lt:1,k:'#5c3a00',p:['#e8590c','#2f9e44','#fff7cc'],H:['sun','sparkle','leaf'],top:'leafrow',M:'rangoli',pat:'dots',script:'Pacifico',L:['invite','story'],tag:'wedding ceremony'},
 {c:'Wedding & Events',n:'Mehendi night',en:'Mehendi Night',hi:'मेहंदी की रात',kick:'YOU ARE INVITED TO',when:'FRIDAY · 11 DECEMBER · 6 PM',where:'Garden Lawn, Jaipur',line:'An evening of henna, folk songs and good food.',msg:'An evening of henna, music and laughter.',d:['#0f3b1e','#04170a'],p:['#ffd166','#80ed99','#f1fbd9'],H:['paisley','lotus','paisley'],top:'vine',M:'rangoli',script:'Great Vibes',L:['invite','center'],tag:'wedding ceremony henna'},
 {c:'Wedding & Events',n:'Sangeet night',en:'Sangeet Night',hi:'संगीत की शाम',kick:'DANCE · MUSIC · CELEBRATION',when:'FRIDAY · 11 DECEMBER · 8 PM',where:'The Ballroom, Mumbai',line:'Bring your best dance moves!',msg:'Dance, music and celebration — bring your best moves!',d:['#3b0a5c','#12021f'],p:['#ff5d8f','#ffd166','#ffffff'],H:['firework','sparkle','balloons'],M:'mandala',script:'Pacifico',L:['invite','story','sale'],tag:'wedding ceremony'},
 {c:'Wedding & Events',n:'Engagement',en:'We’re Engaged!',hi:'सगाई',kick:'YOU ARE INVITED TO OUR',when:'SUNDAY · 6 SEPTEMBER · 5 PM',where:'Taj Banquet Hall, Pune',line:'Celebrate our engagement with us.',msg:'Celebrate our engagement with us.',d:['#1b2a49','#08101f'],p:['#e9c46a','#f4a261','#fff3c4'],H:['rings','sparkle','sparkle'],M:'mandala',script:'Great Vibes',L:['invite','frame'],tag:'ring ceremony'},
 {c:'Wedding & Events',n:'Reception',en:'Wedding Reception',hi:'',kick:'DINNER · MUSIC · CELEBRATION',when:'MONDAY · 15 DECEMBER · 7:30 PM',where:'The Leela Palace',line:'Join us to celebrate the newlyweds.',msg:'Join us to celebrate the newlyweds.',d:['#fff9f0','#f5e6cc'],lt:1,k:'#4a3320',p:['#b8860b','#d4a017','#f5e6cc'],H:['rings','crown','sparkle'],top:'vine',M:'mandala',script:'Great Vibes',L:['invite','frame'],tag:'wedding'},
 {c:'Wedding & Events',n:'Anniversary',en:'Happy Anniversary',hi:'',kick:'CELEBRATING',when:'25 YEARS OF LOVE',where:'Raj & Sunita',line:'',msg:'Here’s to love that grows deeper with every year.',d:['#5c0a2f','#220413'],p:['#ffd166','#ff8fab','#fff0f5'],H:['heart','rings','sparkle'],M:'mandala',script:'Great Vibes',L:['center','frame'],tag:'wedding'},
 {c:'Wedding & Events',n:'Baby shower',en:'Baby Shower',hi:'गोद भराई',kick:'PLEASE JOIN US FOR A',when:'SATURDAY · 10 OCTOBER · 4 PM',where:'Home of Neha & Varun',line:'Little feet are on the way!',msg:'Little feet are on the way! Join us for games, blessings and cake.',d:['#e3f6fc','#c9ecf7'],lt:1,k:'#0b4f6c',p:['#1c9ac8','#f06595','#ffd43b'],H:['balloons','gift','sparkle'],pat:'dots',M:'rangoli',script:'Pacifico',L:['invite','center'],tag:'godh bharai baby'},
 {c:'Wedding & Events',n:'Naming ceremony',en:'Naamkaran',hi:'नामकरण संस्कार',kick:'YOU ARE INVITED TO THE',when:'SUNDAY · 18 OCTOBER · 11 AM',where:'Nair Residence, Kochi',line:'Bless our little one as we welcome a name.',msg:'Bless our little one as we choose a name.',d:['#fff3e0','#ffe0b2'],lt:1,k:'#5c3a00',p:['#e8590c','#2f9e44','#ffe0b2'],H:['diya','lotus','sparkle'],top:'toran',M:'mandala',script:'Great Vibes',L:['invite','frame'],tag:'baby ceremony cradle'},
 {c:'Wedding & Events',n:'Griha Pravesh',en:'Griha Pravesh',hi:'गृह प्रवेश',kick:'YOU ARE INVITED TO OUR',when:'THURSDAY · 5 NOVEMBER · 9 AM',where:'New Home, Sector 21',line:'Join us for puja and lunch at our new home.',msg:'Join us for puja and lunch at our new home.',d:['#ffb703','#f77f00'],p:['#7a0c1e','#fffbe6','#ffe8a3'],H:['kalash','diya','house'],top:'toran',M:'mandala',L:['invite','frame'],tag:'housewarming house warming new home'},
 {c:'Birthday & Party',n:'Kids birthday',en:'It’s My Birthday!',hi:'',kick:'YOU ARE INVITED TO MY',when:'SATURDAY · 7 NOVEMBER · 4 PM',where:'Fun Zone Play Park',line:'Games, cake and loads of fun!',msg:'Games, cake and loads of fun!',d:['#fff3bf','#ffd8a8'],lt:1,k:'#7a2e00',p:['#e8590c','#339af0','#f06595'],H:['balloons','cake','gift'],pat:'dots',M:'rangoli',script:'Pacifico',L:['invite','center','story'],tag:'birthday kids party'},
 {c:'Birthday & Party',n:'First birthday',en:'1st Birthday',hi:'',kick:'JOIN US TO CELEBRATE',when:'SUNDAY · 22 NOVEMBER · 5 PM',where:'Garden Banquet',line:'One year of smiles and giggles.',msg:'One year of smiles, giggles and sleepless nights!',d:['#e7f5ff','#d0ebff'],lt:1,k:'#0b3d91',p:['#1c7ed6','#fcc419','#f06595'],H:['cake','balloons','sparkle'],pat:'dots',M:'rangoli',script:'Pacifico',L:['invite','center'],tag:'birthday baby'},
 {c:'Birthday & Party',n:'Golden birthday',en:'Happy Birthday',hi:'',kick:'CELEBRATING',when:'50 GLORIOUS YEARS',where:'',line:'',msg:'Cheers to many more years of health, love and happiness.',d:['#0a0a0a','#2a2200'],p:['#ffd700','#ffb703','#fff3b0'],H:['cake','balloons','firework'],M:'mandala',script:'Great Vibes',L:['center','frame','story'],tag:'birthday milestone'},
 {c:'Birthday & Party',n:'Pastel birthday',en:'Happy Birthday',hi:'',kick:'',when:'',where:'',line:'',msg:'Wishing you a day filled with love, laughter and cake.',d:['#ffe3ec','#e6e0ff'],lt:1,k:'#5b2a86',p:['#f06595','#7048e8','#ffd43b'],H:['balloons','gift','cake'],pat:'dots',M:'rangoli',script:'Pacifico',L:['center','story','minimal'],tag:'birthday wishes'},
 {c:'Birthday & Party',n:'Retirement party',en:'Happy Retirement',hi:'',kick:'JOIN US TO CELEBRATE',when:'FRIDAY · 30 OCTOBER · 6 PM',where:'Club House',line:'Thirty-five years of dedication.',msg:'Thirty-five years of dedication. Time for the next chapter!',d:['#14213d','#050a18'],p:['#fca311','#e5e5e5','#ffffff'],H:['trophy','cup','sparkle'],M:'mandala',script:'Great Vibes',L:['invite','center'],tag:'party farewell'},
 {c:'Birthday & Party',n:'Graduation party',en:'Congratulations Graduate',hi:'',kick:'JOIN US TO CELEBRATE',when:'SATURDAY · 6 JUNE · 5 PM',where:'Home',line:'The tassel was worth the hassle!',msg:'The tassel was worth the hassle!',d:['#1f2a44','#0a0f1d'],p:['#ffd43b','#e8590c','#ffffff'],H:['cap','book','sparkle'],M:'mandala',script:'Pacifico',L:['center','invite'],tag:'party convocation'},
 {c:'Birthday & Party',n:'Party night',en:'Party Night',hi:'',kick:'ONE NIGHT ONLY',when:'SATURDAY · 10 PM TILL LATE',where:'The Rooftop Lounge',line:'DJ · Dance · Drinks',msg:'DJ · Dance · Drinks. Free entry before 11 PM.',d:['#12002e','#33005c'],p:['#ff2bd6','#00e5ff','#ffffff'],H:['firework','sparkle','balloons'],M:'mandala',script:'Righteous',L:['sale','story','poster'],tag:'club dj night'},
 {c:'Birthday & Party',n:'Diwali party',en:'Diwali Party',hi:'दिवाली मिलन',kick:'YOU ARE INVITED TO OUR',when:'SATURDAY · 7 NOVEMBER · 7 PM',where:'Our Home, Bandra',line:'Lights, cards, food and fireworks.',msg:'Lights, cards, food and fireworks. Dress up in your best!',d:['#2b0a4e','#0d0220'],p:['#ffb703','#fb8500','#ffe8a3'],H:['diya','lantern','firework'],top:'toran',M:'mandala',L:['invite','story'],tag:'festival diwali milan card party'}
];
EVENTS.forEach(E=>{E.hd=E.hd||E.n.toUpperCase().replace(' ','\n');E.off=E.off||(E.when||'').split(' · ').slice(1,3).join(' · ')||'JOIN US';E.cta='RSVP NOW'});
EVENTS.forEach(E=>E.L.forEach(l=>add(E.c,`${E.n} ${l==='invite'?'invitation':l==='frame'?'card':l==='story'?'story':l==='center'?'post':l==='sale'?'flyer':l==='poster'?'poster':'minimal'}`,LAYSZ[l]||[1080,1080],LAY[l](E),E.tag)));

/* ---- business & marketing promos ---- */
function promo(sp){return (W,H,u)=>{const o=[],ink=sp.ink||'#fff',bg=sp.bg2?{t:'grad',k:'lin',c1:sp.bg,c2:sp.bg2,a:sp.ang||150}:{t:'solid',c:sp.bg};
  if(sp.pat)o.push(AI(sp.pat,0,0,W,[sp.a,sp.a2||sp.a],{fill:H,op:sp.patop||.12,nm:'Pattern'}));
  const ac=sp.artc||undefined,L=sp.layout||'left',fd=sp.font||'Anton';
  if(L==='left'){
    if(sp.art)o.push(artAt(null,sp.art,W*.79,H*.6,W*.42,H*.6,{},ac));
    const fl=flowT(W*.08,W*.52,H*.12,[[sp.kick||'LIMITED TIME',u*3,{bold:true,color:sp.a,ls:18,align:'left',font:'Poppins'}],1.4,[sp.big,u*(sp.bs||15),{font:fd,color:ink,align:'left',lh:1}],2,[sp.sub||'',u*3.5,{color:ink,op:.85,align:'left',lh:1.45,font:'Poppins'}]],u,H*.76);o.push(...fl.o);
    o.push(...pill(W*.08,H*.8,u*38,u*10.5,sp.a,sp.cta||'SHOP NOW',sp.cc||'#fff',u,{ls:6}));
  }else if(L==='center'){
    if(sp.art)o.push(artAt(null,sp.art,W/2,H*.2,W*.34,H*.28,{},ac));
    const fl=flowT(W*.08,W*.84,H*.36,[[sp.kick||'LIMITED TIME',u*3.4,{bold:true,color:sp.a,ls:22,font:'Poppins'}],1.4,[sp.big,u*(sp.bs||14),{font:fd,color:ink,lh:1}],2,[sp.sub||'',u*3.8,{color:ink,op:.85,lh:1.45,font:'Poppins'}]],u,H*.8);o.push(...fl.o);
    o.push(...pill(W/2-u*19,H*.84,u*38,u*10.5,sp.a,sp.cta||'SHOP NOW',sp.cc||'#fff',u,{ls:6}));
  }else if(L==='badge'){
    o.push(SH('burst2',W*.58,H*.06,W*.36,W*.36,sp.a,{rot:12}),T_(sp.badge||'50%\nOFF',W*.58,H*.06+W*.12,W*.36,u*(sp.bb||10),{font:'Anton',color:sp.cc||'#fff',align:'center',lh:.95,rot:12}));
    if(sp.art)o.push(artAt(null,sp.art,W*.76,H*.66,W*.4,H*.4,{},ac));
    const fl=flowT(W*.08,W*.5,H*.1,[[sp.kick||'MEGA SALE',u*3,{bold:true,color:sp.a,ls:18,align:'left',font:'Poppins'}],1.2,[sp.big,u*(sp.bs||12),{font:fd,color:ink,align:'left',lh:1}],1.6,[sp.sub||'',u*3.3,{color:ink,op:.85,align:'left',lh:1.45,font:'Poppins'}]],u,H*.78);o.push(...fl.o);
    o.push(...pill(W*.08,H*.82,u*34,u*9.6,sp.a,sp.cta||'SHOP NOW',sp.cc||'#fff',u,{ls:6}));
  }else{
    o.push(SH('rect',0,0,W,H*.58,sp.a),AI('wave',0,H*.58-W*.2,W,[sp.bg,sp.bg],{h:W*.22,fit:'cover'}));
    if(sp.art)o.push(artAt(null,sp.art,W*.8,H*.3,W*.34,H*.38,{},ac));
    const fl=flowT(W*.08,W*.55,H*.1,[[sp.kick||'NEW',u*3,{bold:true,color:sp.cc||'#fff',ls:18,align:'left',font:'Poppins'}],1,[sp.big,u*(sp.bs||13),{font:fd,color:sp.cc||'#fff',align:'left',lh:1}]],u,H*.5);o.push(...fl.o);
    o.push(T_(sp.sub||'',W*.08,H*.66,W*.84,u*3.8,{color:ink,op:.9,lh:1.5,font:'Poppins',align:'left'}),...pill(W*.08,H*.82,u*38,u*10.5,sp.a,sp.cta||'LEARN MORE',sp.cc||'#fff',u,{ls:6}));
  }
  return {bg,objs:o}}}
const PROMOS=[
 ['Flash sale',{bg:'#1f1c19',a:'#e8590c',kick:'24 HOURS ONLY',big:'FLASH\nSALE',sub:'Up to 70% off sitewide. Ends midnight.',art:'bag',artc:['#e8590c','#ffffff'],layout:'left',pat:'dots'}],
 ['Mega discount',{bg:'#d6336c',bg2:'#7048e8',a:'#ffd43b',cc:'#1f1c19',kick:'MEGA SALE',big:'BIG\nSAVINGS',sub:'Your favourites, now at unbeatable prices.',art:'gift',layout:'badge',badge:'60%\nOFF'}],
 ['New arrivals',{bg:'#f1ece4',a:'#1f1c19',ink:'#1f1c19',kick:'JUST LANDED',big:'New\nArrivals',font:'Playfair Display',bs:16,sub:'Fresh styles for the new season are here.',art:'bag',artc:['#e8590c','#ffffff'],cta:'EXPLORE',layout:'left'}],
 ['Grand opening',{bg:'#12b886',bg2:'#0b7285',a:'#ffd43b',cc:'#1f1c19',kick:'WE’RE OPEN',big:'GRAND\nOPENING',sub:'Join us this Saturday for gifts, snacks and surprises.',art:'balloons',layout:'center',cta:'VISIT US'}],
 ['We are hiring',{bg:'#364fc7',a:'#ffd43b',cc:'#1f1c19',kick:'JOIN OUR TEAM',big:'WE’RE\nHIRING',sub:'Send your CV to careers@yourcompany.com',art:'laptop',artc:['#ffffff','#4263eb'],layout:'left',cta:'APPLY NOW',pat:'dots'}],
 ['Product showcase',{bg:'#fff3e0',a:'#e8590c',ink:'#3b2a1a',kick:'INTRODUCING',big:'Fresh\nBrew',font:'Playfair Display',bs:17,sub:'Small-batch coffee roasted for you.',art:'cup',layout:'left',cta:'ORDER NOW'}],
 ['Coupon code',{bg:'#2b8a3e',a:'#ffd43b',cc:'#1f1c19',kick:'EXCLUSIVE',big:'EXTRA 20%\nOFF',sub:'Use code WELCOME20 at checkout.',art:'gift',layout:'badge',badge:'CODE\nWELCOME20',bb:6.5}],
 ['Free delivery',{bg:'#fff',a:'#e8590c',ink:'#1f1c19',kick:'THIS WEEKEND',big:'FREE\nDELIVERY',sub:'On all orders above ₹499. No code needed.',art:'pin',layout:'center',cta:'ORDER NOW'}],
 ['Weekend offer',{bg:'#7048e8',bg2:'#d6336c',a:'#ffd43b',cc:'#1f1c19',kick:'ONLY THIS WEEKEND',big:'BUY 1\nGET 1',sub:'On selected items. Hurry, while stocks last.',art:'sparkle',layout:'split',cta:'GRAB IT'}],
 ['Announcement',{bg:'#0b7285',a:'#ffd43b',cc:'#1f1c19',kick:'BIG NEWS',big:'WE’VE\nMOVED',sub:'Find us at our new, bigger store on MG Road.',art:'pin',layout:'split',cta:'GET DIRECTIONS'}],
 ['Black sale',{bg:'#0a0a0a',a:'#ffd700',cc:'#0a0a0a',kick:'THE BIGGEST SALE',big:'BLACK\nFRIDAY',sub:'Up to 80% off. Everything must go.',art:'bag',artc:['#ffd700','#0a0a0a'],layout:'left',pat:'dots',patop:.07}],
 ['Summer sale',{bg:'#ffd43b',bg2:'#ff922b',a:'#1f1c19',ink:'#1f1c19',cc:'#ffffff',kick:'HOT DEALS',big:'SUMMER\nSALE',sub:'Cool prices on everything you love.',art:'sun',layout:'left',cta:'SHOP NOW'}],
 ['Monsoon offer',{bg:'#1971c2',bg2:'#0b3d91',a:'#ffd43b',cc:'#1f1c19',kick:'RAIN OR SHINE',big:'MONSOON\nOFFER',sub:'Stay dry. Save big.',art:'leaf',layout:'center',cta:'SHOP NOW'}],
 ['Clearance',{bg:'#e03131',a:'#ffffff',cc:'#e03131',kick:'FINAL DAYS',big:'CLEARANCE\nSALE',sub:'Everything under ₹999. No returns.',art:'gift',layout:'badge',badge:'UP TO\n80%'}],
 ['Webinar',{bg:'#10141f',a:'#4dabf7',cc:'#10141f',kick:'FREE LIVE WEBINAR',big:'GROW YOUR\nBUSINESS',sub:'Thursday 7 PM IST · Register free',art:'laptop',artc:['#4263eb','#ffffff'],layout:'left',cta:'REGISTER',font:'Bricolage Grotesque',pat:'dots',patop:.08}],
 ['Workshop',{bg:'#fff4e6',a:'#e8590c',ink:'#3b1f0a',kick:'JOIN US LIVE',big:'Design\nWorkshop',font:'Playfair Display',bs:15,sub:'Sunday 11 AM · Limited seats',art:'bulb',layout:'center',cta:'BOOK A SEAT'}],
 ['Open now',{bg:'#e64980',a:'#fff3bf',cc:'#e64980',kick:'COME ON IN',big:'WE’RE\nOPEN',sub:'Mon–Sat · 10 AM – 9 PM',art:'cup',layout:'left',cta:'VISIT US'}],
 ['Thank you customers',{bg:'#fff0f6',a:'#d6336c',ink:'#6b0f3a',kick:'FROM ALL OF US',big:'Thank\nYou!',font:'Pacifico',bs:15,sub:'For being part of our journey. We couldn’t do it without you.',art:'heart',layout:'center',cta:'SEE OFFERS'}],
 ['Gift voucher',{bg:'#2b2d42',a:'#ffd166',cc:'#2b2d42',kick:'THE PERFECT GIFT',big:'GIFT\nVOUCHER',sub:'Worth ₹2,000 · Valid 12 months',art:'gift',layout:'left',cta:'BUY NOW'}],
 ['App launch',{bg:'#4263eb',bg2:'#7048e8',a:'#ffd43b',cc:'#1f1c19',kick:'NOW AVAILABLE',big:'GET THE\nAPP',sub:'Download free on iOS and Android.',art:'rocket',layout:'split',cta:'DOWNLOAD',font:'Bricolage Grotesque'}],
 ['Subscribe',{bg:'#f03e3e',a:'#ffffff',cc:'#f03e3e',kick:'DON’T MISS OUT',big:'SUBSCRIBE\nNOW',sub:'New videos every week.',art:'bell',artc:['#ffd43b','#ffffff'],layout:'center',cta:'FOLLOW'}]
];
PROMOS.forEach(([n,sp])=>{add('Business',n,[1080,1080],promo(sp),'sale offer marketing promo '+sp.kick);});
PROMOS.slice(0,8).forEach(([n,sp])=>{add('Business',n+' story',[1080,1920],promo(Object.assign({},sp,{layout:sp.layout==='left'?'center':sp.layout})),'story sale offer')});

/* ---- quotes & good-morning style wishes ---- */
function quote(sp){return (W,H,u)=>{const o=[],bg=sp.bg2?{t:'grad',k:'lin',c1:sp.bg,c2:sp.bg2,a:sp.ang||160}:{t:'solid',c:sp.bg};
  if(sp.pat)o.push(AI(sp.pat,0,0,W,[sp.a,sp.a],{fill:H,op:.1}));
  if(sp.art)o.push(artAt(null,sp.art,W*(sp.ax||.5),H*(sp.ay||.18),W*(sp.aw||.3),H*.22,{op:sp.ao||1},sp.artc));
  if(sp.frame)o.push(AI('frame',0,0,W,[sp.a,sp.a],{fill:H,op:.9}));
  const fl=flowT(W*.12,W*.76,H*(sp.y||.34),[[sp.q,u*(sp.qs||8),{font:sp.font||'Playfair Display',color:sp.ink||'#fff',lh:1.25,italic:!!sp.it}],3,['— '+(sp.by||'Your Name'),u*3.6,{color:sp.a,bold:true,font:'Poppins',ls:8,upper:true}]],u,H*.88);o.push(...fl.o);return {bg,objs:o}}}
const QUOTES=[
 ['Quote · dark',{bg:'#10141f',a:'#e8590c',q:'Do something today that your future self will thank you for.',art:'sparkle',artc:['#e8590c','#ffd43b'],pat:'dots'}],
 ['Quote · cream',{bg:'#f4ece1',a:'#c2410c',ink:'#2b2118',q:'Make something people want to come back to.',art:'leaf',artc:['#c2410c','#e8a87c'],frame:1}],
 ['Quote · sunrise',{bg:'#ff922b',bg2:'#d6336c',a:'#fff3bf',q:'Every morning is a fresh chance to begin again.',art:'sun',artc:['#ffd43b','#fff3bf'],aw:.28,ao:.9}],
 ['Quote · ocean',{bg:'#0b7285',bg2:'#1864ab',a:'#ffd43b',q:'Calm seas never made a skilled sailor.',art:'wave',artc:['#74c0fc','#a5d8ff'],ay:.9,aw:1,ax:.5}],
 ['Quote · bold',{bg:'#ffd43b',a:'#1f1c19',ink:'#1f1c19',q:'DREAM BIG.\nWORK HARD.\nSTAY HUMBLE.',font:'Anton',qs:11,y:.28}],
 ['Quote · lotus',{bg:'#fff0f6',a:'#c2255c',ink:'#6b0f3a',q:'Rise above the mud. Bloom with grace.',art:'lotus',artc:['#f783ac','#e64980','#fff0f6'],aw:.34,pat:'jaali'}]
];
QUOTES.forEach(([n,sp])=>add('Social',n,[1080,1080],quote(sp),'quote motivation'));
const GM=[
 ['Good morning · sunrise',{bg:'#ffb703',bg2:'#fb8500',a:'#ffffff',q:'Good Morning!\nHave a beautiful day.',art:'sun',artc:['#fff3bf','#ffd43b'],aw:.5,ay:.2,font:'Pacifico',qs:9,y:.38,by:'Your Name'}],
 ['Good morning · lotus',{bg:'#ffe3ec',bg2:'#ffc9de',a:'#c2255c',ink:'#6b0f3a',q:'सुप्रभात!\nआपका दिन शुभ हो',art:'lotus',artc:['#f783ac','#e64980','#fff0f6'],aw:.5,ay:.2,font:'Yatra One',qs:10,y:.4,by:'Your Name'}],
 ['Good night · moon',{bg:'#0b1a3b',bg2:'#1d2f66',a:'#ffd166',q:'Good Night\nSweet dreams',art:'moon',artc:['#ffe9a8','#ffffff'],aw:.4,ay:.22,font:'Pacifico',qs:10,y:.42,by:'Your Name',pat:'stars'}],
 ['Happy weekend',{bg:'#7048e8',bg2:'#d6336c',a:'#ffd43b',q:'Happy\nWeekend!',art:'balloons',aw:.34,ay:.2,font:'Pacifico',qs:11,y:.4,by:'Enjoy every moment'}]
];
GM.forEach(([n,sp])=>add('Social',n,[1080,1920],quote(sp),'whatsapp status wishes good morning'));

/* ---------- slides, print, resumes, thumbnails, banners, logos and industry sets ---------- */
const LS_=[1920,1080];
function slideT(sp){return (W,H,u)=>{const o=[],ink=sp.ink||'#fff',K=sp.kind,a=sp.a,bg=sp.bg2?{t:'grad',k:'lin',c1:sp.bg,c2:sp.bg2,a:sp.ang||135}:{t:'solid',c:sp.bg};
  const T=(t,x,y,w,s,oo)=>{const e=T_(t,x,y,w,s,Object.assign({color:ink,font:sp.font||'Bricolage Grotesque',align:'left'},oo||{}));o.push(e);return e};
  if(sp.pat)o.push(AI(sp.pat,0,0,W,[a,a],{fill:H,op:.1}));
  if(K==='title'){if(sp.art)o.push(artAt(null,sp.art,W*.78,H*.5,W*.4,H*.7,{},sp.artc));o.push(SH('rect',W*.07,H*.3,u*1.4,H*.34,a));T(sp.t,W*.1,H*.28,W*.6,u*11,{bold:true,lh:1.05});T(sp.s||'',W*.1,H*.72,W*.6,u*4,{font:'Poppins',op:.8})}
  else if(K==='agenda'){T('Agenda',W*.08,H*.1,W*.5,u*11,{bold:true});o.push(SH('rect',W*.08,H*.1+u*14,u*14,u*1,a));T(sp.items.join('\n'),W*.08,H*.38,W*.52,u*6,{list:'num',lh:1.75,font:'Poppins'});o.push(SH('rect',W*.7,0,W*.3,H,a));T('01',W*.7,H*.32,W*.3,u*28,{font:'Anton',align:'center',color:sp.cc||'#fff'})}
  else if(K==='stat'){T(sp.big,0,H*.2,W,u*34,{font:'Anton',align:'center',color:a});T(sp.t,W*.15,H*.62,W*.7,u*6,{align:'center',font:'Poppins',lh:1.35})}
  else if(K==='two'){T(sp.t,W*.07,H*.1,W*.86,u*9,{bold:true});[0,1].forEach(i=>{const x=W*.07+i*W*.45;o.push(SH('rect',x,H*.34,W*.4,H*.5,i?a:'#ffffff',{r:u*3,op:i?1:.1}));T(sp.cols[i][0],x+u*3,H*.38,W*.4-u*6,u*5,{bold:true,color:i?sp.cc||'#fff':ink,font:'Poppins'});T(sp.cols[i][1],x+u*3,H*.5,W*.4-u*6,u*3.6,{color:i?sp.cc||'#fff':ink,font:'Poppins',lh:1.5,op:.9})})}
  else if(K==='team'){T('Meet the team',W*.07,H*.1,W*.7,u*9,{bold:true});['Aarav','Meera','Rohan','Ananya'].forEach((n,i)=>{const x=W*.07+i*W*.225;o.push(SH('ellipse',x+W*.02,H*.34,W*.17,W*.17,i%2?a:'#adb5bd',{op:1}),T_(n,x,H*.34+W*.19,W*.21,u*4.2,{align:'center',bold:true,color:ink,font:'Poppins'}),T_(['CEO','Design','Engineering','Marketing'][i],x,H*.34+W*.19+u*6,W*.21,u*3,{align:'center',color:ink,op:.7,font:'Poppins'}))})}
  else if(K==='pricing'){T('Pricing',W*.07,H*.08,W*.6,u*9,{bold:true});[['Starter','₹499'],['Growth','₹1,499'],['Scale','₹3,999']].forEach(([n,p],i)=>{const x=W*.07+i*W*.3,hl=i===1;o.push(SH('rect',x,H*.28,W*.27,H*.6,hl?a:'#ffffff',{r:u*3,op:hl?1:.1}),T_(n,x,H*.33,W*.27,u*4.4,{align:'center',bold:true,color:hl?sp.cc||'#fff':ink,font:'Poppins'}),T_(p,x,H*.43,W*.27,u*9,{align:'center',font:'Anton',color:hl?sp.cc||'#fff':ink}),T_('per month\n5 projects\nEmail support',x,H*.62,W*.27,u*3.4,{align:'center',color:hl?sp.cc||'#fff':ink,op:.85,lh:1.7,font:'Poppins'}))})}
  else if(K==='timeline'){T('Roadmap',W*.07,H*.1,W*.6,u*9,{bold:true});o.push(SH('rect',W*.07,H*.52,W*.86,u*.8,a));['Q1','Q2','Q3','Q4'].forEach((q,i)=>{const x=W*.07+i*W*.27;o.push(SH('ellipse',x,H*.52-u*2,u*5,u*5,a),T_(q,x-u*2,H*.4,u*9,u*4.4,{bold:true,color:ink,font:'Poppins'}),T_(['Research','Prototype','Launch','Scale'][i],x-u*2,H*.62,W*.22,u*4,{color:ink,font:'Poppins'}),T_('Key milestone and notes go here.',x-u*2,H*.7,W*.22,u*3,{color:ink,op:.7,font:'Poppins',lh:1.4}))})}
  else if(K==='quote'){o.push(AI('sparkle',W*.07,H*.1,u*16,[a,a],{}));T(sp.t,W*.12,H*.3,W*.76,u*8.4,{font:'Playfair Display',lh:1.3,italic:true});T('— '+(sp.by||'Name Surname'),W*.12,H*.76,W*.7,u*3.8,{color:a,bold:true,font:'Poppins'})}
  else if(K==='thanks'){if(sp.art)o.push(artAt(null,sp.art,W*.5,H*.28,W*.2,H*.3,{},sp.artc));T('Thank you',0,H*.42,W,u*17,{align:'center',bold:true,font:sp.font||'Bricolage Grotesque'});T('hello@yourcompany.com  ·  +91 00000 00000',0,H*.7,W,u*3.6,{align:'center',font:'Poppins',op:.85})}
  else if(K==='section'){T('02',W*.08,H*.12,W*.3,u*30,{font:'Anton',color:a});T(sp.t,W*.08,H*.56,W*.7,u*10,{bold:true});T(sp.s||'',W*.08,H*.76,W*.6,u*3.8,{font:'Poppins',op:.8})}
  return {bg,objs:o}}}
const SLIDES=[
 ['Title · dark',{kind:'title',bg:'#10141f',a:'#e8590c',t:'Quarterly\nBusiness Review',s:'Q3 2026 · Growth, product and what’s next',art:'bars',artc:['#e8590c','#4263eb','#555555']}],
 ['Title · gradient',{kind:'title',bg:'#4263eb',bg2:'#7048e8',a:'#ffd43b',t:'Product\nStrategy 2027',s:'Prepared by the Strategy team',art:'rocket'}],
 ['Title · warm',{kind:'title',bg:'#fff4e6',a:'#e8590c',ink:'#3b1f0a',t:'Annual\nReport',s:'FY 2025–26 highlights',art:'building',artc:['#e8590c','#9c3a06','#ffd43b'],font:'Playfair Display'}],
 ['Title · Indian festival',{kind:'title',bg:'#3b0a5c',bg2:'#12021f',a:'#ffb703',t:'Festive\nCampaign Plan',s:'Diwali season · Marketing strategy',art:'diya',pat:'jaali'}],
 ['Agenda',{kind:'agenda',bg:'#fdf6e3',a:'#e8590c',ink:'#2b2118',items:['Where we are','What we learned','What we’re building next','How you can help']}],
 ['Agenda · dark',{kind:'agenda',bg:'#10141f',a:'#4dabf7',cc:'#10141f',items:['Overview','Market','Product','Roadmap','Ask']}],
 ['Big number',{kind:'stat',bg:'#10141f',a:'#ffd43b',big:'₹120 Cr',t:'in revenue this year — up 48% year on year'}],
 ['Big number · light',{kind:'stat',bg:'#e7f5ff',a:'#1c7ed6',ink:'#0b2a5b',big:'3.2M',t:'customers trust us across 14 states'}],
 ['Comparison',{kind:'two',bg:'#10141f',a:'#e8590c',t:'Before and after',cols:[['Before','Manual processes\nSlow approvals\nLost leads'],['After','Automated workflows\nSame-day approvals\nEvery lead tracked']]}],
 ['Team',{kind:'team',bg:'#fff',a:'#e8590c',ink:'#1f1c19'}],
 ['Pricing',{kind:'pricing',bg:'#10141f',a:'#e8590c'}],
 ['Roadmap',{kind:'timeline',bg:'#f8f9fa',a:'#4263eb',ink:'#1f1c19'}],
 ['Quote slide',{kind:'quote',bg:'#0b7285',a:'#ffd43b',t:'The best way to predict the future is to create it.',by:'Peter Drucker'}],
 ['Section break',{kind:'section',bg:'#d6336c',bg2:'#7048e8',a:'#ffd43b',t:'Our Strategy',s:'How we plan to win in the next 12 months'}],
 ['Thank you slide',{kind:'thanks',bg:'#10141f',a:'#e8590c',art:'heart',artc:['#e8590c','#ffffff']}],
 ['Thank you · warm',{kind:'thanks',bg:'#fff4e6',ink:'#3b1f0a',a:'#e8590c',art:'lotus',artc:['#f783ac','#e64980','#fff0f6'],font:'Playfair Display'}]
];
SLIDES.forEach(([n,sp])=>add('Slides',n,LS_,slideT(sp),'presentation deck pitch slide'));

/* ---- business cards ---- */
function bcard(sp){return (W,H,u)=>{const o=[],ink=sp.ink||'#fff',a=sp.a,bg={t:'solid',c:sp.bg};const T=(t,x,y,w,s,oo)=>{const e=T_(t,x,y,w,s,Object.assign({color:ink,font:'Poppins',align:'left'},oo||{}));o.push(e);return e};
  const L=sp.layout;
  if(L==='band'){o.push(SH('rect',0,0,W*.34,H,a),AI(sp.art||'mandala',-W*.1,H*.2,W*.5,[ink,ink,ink],{op:.2}));o.push(artAt(null,sp.art||'diya',W*.17,H*.5,W*.22,H*.4,{},sp.artc));T(sp.nm,W*.4,H*.2,W*.55,u*10,{font:sp.font||'Playfair Display',bold:true});T(sp.role,W*.4,H*.2+u*13,W*.55,u*4.4,{color:a,bold:true});T('hello@example.com\n+91 00000 00000\nwww.example.com',W*.4,H*.62,W*.55,u*4.2,{lh:1.6,op:.85})}
  else if(L==='center'){o.push(AI('frame',0,0,W,[a,a],{fill:H,op:.9}));o.push(artAt(null,sp.art||'lotus',W*.5,H*.25,W*.16,H*.3,{},sp.artc));T(sp.nm,0,H*.4,W,u*9,{font:sp.font||'Playfair Display',bold:true,align:'center'});T(sp.role,0,H*.4+u*12,W,u*3.8,{color:a,align:'center',bold:true,ls:12,upper:true});T('hello@example.com  ·  +91 00000 00000',0,H*.78,W,u*3.4,{align:'center',op:.85})}
  else if(L==='split'){o.push(SH('rect',0,0,W,H*.5,a),AI('wave',0,H*.4,W,[a,sp.bg],{h:W*.14,fit:'cover'}));T(sp.nm,W*.07,H*.14,W*.8,u*10,{font:sp.font||'Bricolage Grotesque',bold:true,color:sp.cc||'#fff'});T(sp.role,W*.07,H*.14+u*13,W*.8,u*4.2,{color:sp.cc||'#fff',op:.9});T('hello@example.com\n+91 00000 00000\nwww.example.com',W*.07,H*.62,W*.6,u*4,{lh:1.6});o.push(artAt(null,sp.art||'laptop',W*.82,H*.76,W*.2,H*.34,{},sp.artc))}
  else{o.push(SH('ellipse',W*.66,-H*.35,H*1.3,H*1.3,a,{op:.9}));T(sp.nm,W*.07,H*.2,W*.6,u*10,{font:sp.font||'Bricolage Grotesque',bold:true});T(sp.role,W*.07,H*.2+u*13,W*.6,u*4.2,{color:a,bold:true});T('hello@example.com\n+91 00000 00000\nwww.example.com',W*.07,H*.62,W*.6,u*4,{lh:1.6,op:.85});o.push(artAt(null,sp.art||'gem',W*.83,H*.5,W*.18,H*.5,{},sp.artc))}
  return {bg,objs:o}}}
[['Indian · Gold',{bg:'#2a0a14',a:'#e9b949',layout:'band',nm:'Rajesh Kumar',role:'Director',art:'diya'}],['Lotus · Classic',{bg:'#fff8ec',ink:'#3b2a1a',a:'#c2410c',layout:'center',nm:'Priya Nair',role:'Interior designer',art:'lotus',artc:['#f783ac','#e64980','#fff0f6']}],['Modern · Split',{bg:'#ffffff',ink:'#1f1c19',a:'#4263eb',layout:'split',nm:'Aarav Mehta',role:'Software engineer'}],['Bold circle',{bg:'#1f1c19',a:'#e8590c',layout:'circle',nm:'Meera Iyer',role:'Founder',art:'gem'}],['Green · Eco',{bg:'#f1fbf1',ink:'#14532d',a:'#2f9e44',layout:'band',nm:'Sandeep Rao',role:'Organic farmer',art:'leaf',artc:['#2f9e44','#b2f2bb'],font:'Lora'}],['Teal · Medical',{bg:'#ffffff',ink:'#073b4c',a:'#06a77d',layout:'split',nm:'Dr. Ananya Sen',role:'Cardiologist',art:'pulse',artc:['#ffffff']}]].forEach(([n,sp])=>add('Print','Business card · '+n,[1050,600],bcard(sp),'business card visiting card'));

/* ---- certificates ---- */
function cert(sp){return (W,H,u)=>{const o=[],ink=sp.ink,a=sp.a;o.push(AI('frame',0,0,W,[a,sp.b||a],{fill:H}),AI(sp.pat||'jaali',0,0,W,[a],{fill:H,op:.05}));
  o.push(artAt(null,'seal',W*.5,H*.2,W*.1,H*.2,{},[a,sp.b||'#c1121f']));
  const fl=flowT(W*.1,W*.8,H*.32,[[sp.t,u*(sp.ts||9),{font:'Cinzel Decorative',bold:true,color:ink,ls:4}],1.4,['THIS CERTIFICATE IS PROUDLY PRESENTED TO',u*2.6,{color:ink,op:.75,ls:14,font:'Poppins'}],2,['Recipient Name',u*10,{font:'Great Vibes',color:a}],1,[sp.m,u*2.8,{color:ink,op:.85,lh:1.6,font:'Lora',italic:true}]],u,H*.8);o.push(...fl.o);
  o.push(SH('rect',W*.14,H*.84,W*.24,u*.3,ink),T_('DATE',W*.14,H*.85,W*.24,u*2.4,{align:'center',color:ink,ls:12,font:'Poppins'}),SH('rect',W*.62,H*.84,W*.24,u*.3,ink),T_('SIGNATURE',W*.62,H*.85,W*.24,u*2.4,{align:'center',color:ink,ls:12,font:'Poppins'}));
  return {bg:{t:'solid',c:sp.bg},objs:o}}}
[['Achievement · Gold',{bg:'#fffaf0',ink:'#3b2a1a',a:'#b8860b',t:'Certificate of Achievement',m:'in recognition of outstanding performance, dedication and excellence.'}],['Appreciation · Royal',{bg:'#0f1b4d',ink:'#ffffff',a:'#ffd166',b:'#e9b949',t:'Certificate of Appreciation',m:'with sincere gratitude for your valuable contribution and support.'}],['Participation · Modern',{bg:'#ffffff',ink:'#1f1c19',a:'#e8590c',t:'Certificate of Participation',m:'for active participation and enthusiasm shown in the programme.'}],['Completion · Green',{bg:'#f1fbf1',ink:'#14532d',a:'#2f9e44',b:'#e9b949',t:'Certificate of Completion',m:'has successfully completed the course with distinction.'}],['Merit · Indian',{bg:'#fff3e0',ink:'#5c1a0a',a:'#c2410c',b:'#e9b949',t:'Certificate of Merit',m:'awarded for exemplary academic and extracurricular excellence.',pat:'jaali'}]].forEach(([n,sp])=>add('Education','Certificate · '+n,[1754,1240],cert(sp),'certificate award'));

/* ---- resumes ---- */
function resume(sp){return (W,H,u)=>{const o=[],a=sp.a,bg={t:'solid',c:'#ffffff'};const T=(t,x,y,w,s,oo)=>{const e=T_(t,x,y,w,s,Object.assign({color:'#1f1c19',font:'Poppins',align:'left'},oo||{}));o.push(e);return e};
  const sec=(x,y,w,t,body)=>{T(t.toUpperCase(),x,y,w,u*2.2,{bold:true,color:a,ls:14});o.push(SH('rect',x,y+u*3.4,w,u*.2,a,{op:.4}));return T(body,x,y+u*4.6,w,u*2.2,{lh:1.55,color:'#3a3a3a'})};
  const exp='Senior Manager · Company Name  2021 – Present\nLed a team of 12, improved delivery times by 30%.\n\nManager · Previous Company  2017 – 2021\nOwned operations across three regions.';
  if(sp.layout==='side'){o.push(SH('rect',0,0,W*.34,H,a));o.push(SH('ellipse',W*.17-u*9,H*.045,u*18,u*18,'#ffffff',{op:.9}));
    T('YOUR NAME',W*.04,H*.2,W*.27,u*4.6,{bold:true,color:'#fff',lh:1.15,font:sp.font||'Poppins'});T('Job Title',W*.04,H*.26,W*.27,u*2.6,{color:'#fff',op:.85});
    T('CONTACT',W*.04,H*.38,W*.27,u*2.2,{bold:true,color:'#fff',ls:14});T('+91 00000 00000\nname@email.com\nCity, India',W*.04,H*.41,W*.27,u*2.1,{color:'#fff',lh:1.7,op:.9});
    T('SKILLS',W*.04,H*.58,W*.27,u*2.2,{bold:true,color:'#fff',ls:14});T('Operations\nLeadership\nAnalytics\nNegotiation',W*.04,H*.61,W*.27,u*2.1,{color:'#fff',lh:1.7,op:.9});
    T('PROFILE',W*.4,H*.07,W*.54,u*2.2,{bold:true,color:a,ls:14});T('Results-driven professional with 10+ years of experience building teams and delivering outcomes.',W*.4,H*.1,W*.54,u*2.2,{lh:1.55,color:'#3a3a3a'});
    sec(W*.4,H*.2,W*.54,'Experience',exp);sec(W*.4,H*.5,W*.54,'Education','MBA · University Name  2015\nB.Com · College Name  2013');sec(W*.4,H*.66,W*.54,'Achievements','Won Best Manager Award 2023\nReduced costs by ₹1.2 Cr')}
  else if(sp.layout==='top'){o.push(SH('rect',0,0,W,H*.17,a));T('YOUR NAME',W*.07,H*.04,W*.6,u*7,{bold:true,color:'#fff',font:sp.font||'Bricolage Grotesque'});T('Job Title  ·  City, India',W*.07,H*.04+u*9.5,W*.6,u*2.8,{color:'#fff',op:.9});T('+91 00000 00000\nname@email.com\nlinkedin.com/in/name',W*.66,H*.045,W*.28,u*2.3,{color:'#fff',lh:1.6,align:'right'});
    sec(W*.07,H*.21,W*.86,'Profile','Results-driven professional with 10+ years of experience building teams and delivering outcomes.');sec(W*.07,H*.33,W*.86,'Experience',exp);sec(W*.07,H*.62,W*.4,'Education','MBA · University Name  2015\nB.Com · College Name  2013');sec(W*.53,H*.62,W*.4,'Skills','Operations · Leadership\nAnalytics · Negotiation\nExcel · SAP')}
  else{T('YOUR NAME',W*.08,H*.06,W*.84,u*8.4,{bold:true,font:sp.font||'Playfair Display'});o.push(SH('rect',W*.08,H*.06+u*11.5,u*18,u*.8,a));T('Job Title  ·  +91 00000 00000  ·  name@email.com',W*.08,H*.06+u*13.5,W*.84,u*2.4,{color:'#555'});
    sec(W*.08,H*.2,W*.84,'Summary','Results-driven professional with 10+ years of experience building teams and delivering outcomes.');sec(W*.08,H*.32,W*.84,'Experience',exp);sec(W*.08,H*.6,W*.84,'Education','MBA · University Name  2015\nB.Com · College Name  2013');sec(W*.08,H*.76,W*.84,'Skills','Operations · Leadership · Analytics · Negotiation · Excel · SAP')}
  return {bg,objs:o}}}
[['Sidebar · Orange',{layout:'side',a:'#e8590c'}],['Sidebar · Navy',{layout:'side',a:'#1c3d6e'}],['Header · Teal',{layout:'top',a:'#0b7285'}],['Header · Plum',{layout:'top',a:'#862e9c'}],['Classic',{layout:'clean',a:'#1f1c19'}],['Classic · Green',{layout:'clean',a:'#2f9e44',font:'Lora'}]].forEach(([n,sp])=>add('Resume & Docs','Resume · '+n,[1240,1754],resume(sp),'resume cv curriculum vitae job'));

/* ---- documents: invoice, letterhead, menu, flyer ---- */
add('Resume & Docs','Invoice · Clean',[1240,1754],(W,H,u)=>{const o=[],a='#e8590c',T=(t,x,y,w,s,oo)=>{const e=T_(t,x,y,w,s,Object.assign({color:'#1f1c19',font:'Poppins',align:'left'},oo||{}));o.push(e);return e};
  o.push(SH('rect',0,0,W,u*3,a));T('INVOICE',W*.08,H*.06,W*.5,u*8,{bold:true,font:'Bricolage Grotesque'});T('Invoice No: 0001\nDate: 01 Nov 2026\nDue: 15 Nov 2026',W*.62,H*.065,W*.3,u*2.3,{lh:1.7,align:'right'});
  T('BILLED TO',W*.08,H*.16,W*.4,u*2.2,{bold:true,color:a,ls:14});T('Client Name\nClient Address, City\nGSTIN: 00AAAAA0000A1Z5',W*.08,H*.185,W*.4,u*2.3,{lh:1.6});T('FROM',W*.55,H*.16,W*.37,u*2.2,{bold:true,color:a,ls:14});T('Your Business\nYour Address, City\nGSTIN: 00BBBBB0000B1Z5',W*.55,H*.185,W*.37,u*2.3,{lh:1.6});
  o.push(SH('rect',W*.08,H*.3,W*.84,u*6,'#1f1c19'));T('DESCRIPTION',W*.1,H*.3+u*1.7,W*.4,u*2.2,{color:'#fff',bold:true,ls:8});T('QTY',W*.55,H*.3+u*1.7,W*.1,u*2.2,{color:'#fff',bold:true});T('RATE',W*.66,H*.3+u*1.7,W*.1,u*2.2,{color:'#fff',bold:true});T('AMOUNT',W*.78,H*.3+u*1.7,W*.12,u*2.2,{color:'#fff',bold:true,align:'right'});
  [['Design services','2','₹10,000','₹20,000'],['Development','1','₹35,000','₹35,000'],['Hosting (1 year)','1','₹5,000','₹5,000']].forEach((r,i)=>{const y=H*.3+u*8+i*u*7;o.push(SH('rect',W*.08,y+u*5.6,W*.84,u*.15,'#cccccc'));T(r[0],W*.1,y,W*.4,u*2.4,{});T(r[1],W*.55,y,W*.1,u*2.4,{});T(r[2],W*.66,y,W*.12,u*2.4,{});T(r[3],W*.78,y,W*.12,u*2.4,{align:'right'})});
  o.push(SH('rect',W*.58,H*.55,W*.34,u*10,a,{r:u*1.4}));T('TOTAL',W*.6,H*.55+u*3,W*.14,u*2.6,{color:'#fff',bold:true,ls:8});T('₹60,000',W*.7,H*.55+u*2.6,W*.2,u*4,{color:'#fff',bold:true,align:'right'});
  T('Payment: Bank transfer · A/c 0000 0000 0000 · IFSC XXXX0000000\nThank you for your business!',W*.08,H*.9,W*.84,u*2.2,{color:'#666',lh:1.6});return {bg:{t:'solid',c:'#fff'},objs:o}},'invoice bill gst');
add('Resume & Docs','Letterhead · Classic',[1240,1754],(W,H,u)=>{const o=[];o.push(SH('rect',0,0,W,u*2.4,'#4263eb'),AI('wave',0,H-W*.18,W,['#4263eb','#74c0fc'],{h:W*.18,fit:'cover'}),artAt(null,'building',W*.12,H*.07,W*.08,H*.06,{},['#4263eb','#1b3a8a','#fff']),T_('YOUR COMPANY',W*.2,H*.045,W*.5,u*4.4,{bold:true,font:'Bricolage Grotesque',color:'#1b3a8a'}),T_('Tagline goes here',W*.2,H*.045+u*6.4,W*.5,u*2.4,{color:'#777',font:'Poppins'}),T_('Date: __________\n\nTo,\n\n\nDear Sir/Madam,',W*.1,H*.2,W*.6,u*2.4,{color:'#333',lh:1.7,font:'Poppins'}),T_('www.yourcompany.com   ·   hello@yourcompany.com   ·   +91 00000 00000',W*.1,H*.93,W*.8,u*2.2,{color:'#fff',font:'Poppins',align:'center'}));return {bg:{t:'solid',c:'#fff'},objs:o}},'letterhead letter');
function menuT(sp){return (W,H,u)=>{const o=[],ink=sp.ink||'#fff',a=sp.a;if(sp.pat)o.push(AI(sp.pat,0,0,W,[a,a],{fill:H,op:.07}));o.push(AI('frame',0,0,W,[a,a],{fill:H}));
  if(sp.art)o.push(artAt(null,sp.art,W*.5,H*.12,W*.2,H*.16,{},sp.artc));
  const items=sp.items;const T=(t,x,y,w,s,oo)=>{const e=T_(t,x,y,w,s,Object.assign({color:ink,font:'Poppins',align:'center'},oo||{}));o.push(e);return e};
  T(sp.t,0,H*.2,W,u*8,{font:sp.font||'Playfair Display',bold:true,color:a});T(sp.sub||'',0,H*.2+u*10.4,W,u*2.8,{ls:16,upper:true,op:.8});
  items.forEach(([h,list],i)=>{const col=i%2,row=Math.floor(i/2),x=W*(.1+col*.43),y=H*(.34+row*.28);T(h,x,y,W*.37,u*3.6,{bold:true,color:a,align:'left',ls:10,upper:true});o.push(SH('rect',x,y+u*5.4,W*.37,u*.2,a,{op:.6}));T(list,x,y+u*6.8,W*.37,u*2.6,{align:'left',lh:1.8})});
  return {bg:{t:'solid',c:sp.bg},objs:o}}}
[['Restaurant · Dark',{bg:'#1f1c19',a:'#e9b949',t:'The Spice Table',sub:'Modern Indian Kitchen',art:'diya',items:[['Starters','Paneer Tikka  ·  ₹320\nHara Bhara Kebab  ·  ₹280\nChicken 65  ·  ₹360'],['Mains','Butter Chicken  ·  ₹420\nDal Makhani  ·  ₹320\nLamb Rogan Josh  ·  ₹520'],['Breads & Rice','Garlic Naan  ·  ₹80\nTandoori Roti  ·  ₹40\nBiryani  ·  ₹380'],['Desserts','Gulab Jamun  ·  ₹140\nRasmalai  ·  ₹180\nKulfi  ·  ₹120']]}],
 ['Thali · Warm',{bg:'#fff3e0',ink:'#4a2c0b',a:'#c2410c',t:'Maharaja Thali',sub:'Pure vegetarian · Since 1985',art:'thali',artc:['#d0d0d0','#e03131','#ffd43b'],pat:'jaali',items:[['Thali','Dal · Sabzi · Raita\nRoti · Rice · Papad\nSweet of the day  ·  ₹380'],['Special thali','Paneer · Kofta · Kadhi\nNaan · Pulao · Salad\nGulab Jamun  ·  ₹520'],['Drinks','Masala Chaas  ·  ₹60\nLassi  ·  ₹90\nNimbu Pani  ·  ₹50'],['Sweets','Jalebi  ·  ₹80\nKheer  ·  ₹100\nHalwa  ·  ₹90']],font:'Rozha One'}],
 ['Cafe · Pastel',{bg:'#fff0f6',ink:'#5a2a3f',a:'#d6336c',t:'Sunday Café',sub:'Coffee · Bakes · Brunch',art:'cup',artc:['#7a4a21','#d6336c'],items:[['Coffee','Espresso  ·  ₹120\nCappuccino  ·  ₹180\nCold Brew  ·  ₹200'],['Bakes','Croissant  ·  ₹140\nBrownie  ·  ₹120\nCheesecake  ·  ₹220'],['Brunch','Avocado Toast  ·  ₹320\nPancakes  ·  ₹280\nOmelette  ·  ₹240'],['Cold drinks','Iced Tea  ·  ₹150\nSmoothie  ·  ₹220\nLemonade  ·  ₹120']],font:'Pacifico'}],
 ['Sweet shop',{bg:'#7a0c1e',a:'#ffd166',t:'Mithai Ghar',sub:'Festive sweets & snacks',art:'kalash',pat:'jaali',items:[['Mithai','Kaju Katli  ·  ₹900/kg\nMotichoor Laddu  ·  ₹600/kg\nSoan Papdi  ·  ₹500/kg'],['Bengali','Rasgulla  ·  ₹40/pc\nSandesh  ·  ₹50/pc\nMishti Doi  ·  ₹60'],['Namkeen','Bhujia  ·  ₹320/kg\nChakli  ·  ₹360/kg\nMathri  ·  ₹300/kg'],['Gift boxes','Diwali Box  ·  ₹1,200\nPremium Box  ·  ₹2,500\nCustom hamper']],font:'Rozha One'}]].forEach(([n,sp])=>add('Food','Menu · '+n,[1240,1754],menuT(sp),'menu restaurant food'));

/* ---- YouTube thumbnails + wide banners ---- */
function thumbT(sp){return (W,H,u)=>{const o=[],bg=sp.bg2?{t:'grad',k:'lin',c1:sp.bg,c2:sp.bg2,a:sp.ang||120}:{t:'solid',c:sp.bg};
  if(sp.pat)o.push(AI(sp.pat,0,0,W,[sp.a,sp.a],{fill:H,op:.14}));
  o.push(SH('ellipse',W*.5,-H*.2,H*1.4,H*1.4,sp.a,{op:.25}));
  if(sp.art)o.push(artAt(null,sp.art,W*.78,H*.52,W*.42,H*.88,{},sp.artc));
  const e1=T_(sp.t,W*.04,H*.1,W*.6,u*(sp.ts||17),{font:sp.font||'Anton',color:'#fff',lh:.98,fx:'outline',fxc:'#000000',fxv:60});o.push(e1);
  const e2=T_(sp.t2||'',W*.04,e1.y+e1.h+u*1.2,W*.6,u*(sp.ts2||12),{font:sp.font||'Anton',color:sp.a,lh:1,fx:'shadow'});o.push(e2);
  const bw=u*Math.max(30,8+(sp.badge||'').length*3.3);if(sp.badge)o.push(SH('rect',W*.04,H*.84,bw,u*8,sp.a,{r:u*2}),T_(sp.badge,W*.04,H*.84+u*1.4,bw,u*5,{font:'Poppins',bold:true,color:sp.cc||'#fff',align:'center',ls:4}));
  return {bg,objs:o}}}
[['How to · Bold',{bg:'#10141f',bg2:'#273469',a:'#ffd43b',t:'HOW TO',t2:'GROW FAST',art:'rocket',badge:'FULL GUIDE',cc:'#1f1c19'}],['Tech review',{bg:'#0b7285',bg2:'#10141f',a:'#ffd43b',t:'HONEST',t2:'REVIEW',art:'laptop',artc:['#ffffff','#4263eb'],badge:'WORTH IT?',cc:'#1f1c19'}],['Vlog · Travel',{bg:'#e8590c',bg2:'#d6336c',a:'#ffd43b',t:'MY INDIA',t2:'TRIP',art:'plane',badge:'EPIC VLOG',cc:'#1f1c19'}],['Cooking',{bg:'#c2410c',bg2:'#7a0c1e',a:'#ffd43b',t:'EASY',t2:'BIRYANI',art:'thali',artc:['#d0d0d0','#e03131','#ffd43b'],badge:'IN 20 MINUTES',cc:'#1f1c19',pat:'jaali'}],['Fitness',{bg:'#10141f',bg2:'#e03131',a:'#ffd43b',t:'30 DAY',t2:'CHALLENGE',art:'dumbbell',artc:['#ffd43b','#ffffff'],badge:'NO EQUIPMENT',cc:'#1f1c19'}],['Finance',{bg:'#0b3d2e',bg2:'#10141f',a:'#69db7c',t:'MAKE',t2:'₹1 LAKH',art:'bars',artc:['#69db7c','#ffd43b','#cccccc'],badge:'STEP BY STEP',cc:'#10141f'}],['Education',{bg:'#364fc7',bg2:'#7048e8',a:'#ffd43b',t:'LEARN',t2:'FAST',art:'bulb',badge:'TOP 5 TIPS',cc:'#1f1c19'}],['Diwali special',{bg:'#2b0a4e',bg2:'#0d0220',a:'#ffb703',t:'DIWALI',t2:'SPECIAL',art:'diya',badge:'HOME DECOR IDEAS',cc:'#1f1c19',pat:'jaali'}]].forEach(([n,sp])=>add('YouTube','YouTube thumbnail · '+n,[1280,720],thumbT(sp),'thumbnail youtube video'));
function wideT(sp){return (W,H,u)=>{const o=[],bg=sp.bg2?{t:'grad',k:'lin',c1:sp.bg,c2:sp.bg2,a:sp.ang||110}:{t:'solid',c:sp.bg},s=H;
  if(sp.pat)o.push(AI(sp.pat,0,0,W,[sp.a,sp.a],{fill:H,op:.1}));o.push(SH('ellipse',W*.62,-H*.6,H*2.2,H*2.2,sp.a,{op:.18}));
  if(sp.art)o.push(artAt(null,sp.art,W*.84,H*.5,W*.22,H*.86,{},sp.artc));
  const fl=flowT(W*.06,W*.58,H*.2,[[sp.t,s*.22,{font:sp.font||'Bricolage Grotesque',bold:true,color:sp.ink||'#fff',align:'left',lh:1.05}],.5,[sp.s,s*.075,{font:'Poppins',color:sp.ink||'#fff',op:.85,align:'left',lh:1.4}]],H/100,H*.9);o.push(...fl.o);return {bg,objs:o}}}
[['LinkedIn',[1584,396],{bg:'#0b2a5b',bg2:'#1c7ed6',a:'#ffd43b',t:'Helping businesses grow',s:'Strategy · Operations · Technology',art:'bars',artc:['#ffd43b','#ffffff','#cccccc']}],['LinkedIn · Warm',[1584,396],{bg:'#fff4e6',a:'#e8590c',ink:'#3b1f0a',t:'Your Name · Consultant',s:'Building teams and processes that scale',art:'building',artc:['#e8590c','#9c3a06','#ffd43b'],font:'Playfair Display'}],['Facebook cover',[1640,624],{bg:'#364fc7',bg2:'#7048e8',a:'#ffd43b',t:'Welcome to our page',s:'Follow for offers, news and updates',art:'sparkle'}],['Facebook cover · Shop',[1640,624],{bg:'#e03131',bg2:'#c2255c',a:'#ffd43b',t:'Festive Collection is here',s:'Shop the season’s best',art:'bag',artc:['#ffd43b','#ffffff']}],['Twitter header',[1500,500],{bg:'#10141f',bg2:'#273469',a:'#4dabf7',t:'Thoughts on tech & business',s:'Daily · Opinions are my own',art:'laptop',artc:['#4263eb','#ffffff']}],['YouTube channel art',[2560,1440],{bg:'#10141f',bg2:'#d6336c',a:'#ffd43b',t:'Your Channel Name',s:'New videos every week',art:'camera',artc:['#ffffff','#e03131','#ffd43b']}],['Twitch banner',[1200,480],{bg:'#2b1055',bg2:'#7048e8',a:'#ffd43b',t:'Live every night',s:'Games · Chill · Community',art:'sparkle'}],['Email header',[1200,400],{bg:'#e8590c',bg2:'#d6336c',a:'#ffd43b',t:'This week’s newsletter',s:'News, tips and offers',art:'bell',artc:['#ffd43b','#ffffff']}],['Website hero',[1920,800],{bg:'#fff4e6',a:'#e8590c',ink:'#3b1f0a',t:'We make beautiful things',s:'Design · Branding · Websites',art:'rocket',font:'Playfair Display'}]].forEach(([n,s,sp])=>add('Social',n,s,wideT(sp),'banner cover header'));

/* ---------- logos + industry sets ---------- */
function logoT(sp){return (W,H,u)=>{const o=[],bg={t:'solid',c:sp.bg||'#ffffff'},cx=W/2,ink=sp.ink||'#1f1c19',a=sp.a;
  const mono=(ch,x,y,r,fill,tc)=>[SH('ellipse',x-r,y-r,r*2,r*2,fill),T_(ch,x-r,y-r*.56,r*2,r*1.15,{font:sp.font||'Bricolage Grotesque',bold:true,color:tc,align:'center',lh:1})];
  if(sp.kind==='mono'){o.push(...mono(sp.m,cx,H*.38,W*.2,a,sp.cc||'#fff'));o.push(T_(sp.nm,0,H*.65,W,u*9,{font:sp.font||'Bricolage Grotesque',bold:true,color:ink,align:'center'}),T_(sp.tag,0,H*.65+u*11,W,u*3.2,{font:'Poppins',color:ink,op:.7,align:'center',ls:18,upper:true}))}
  else if(sp.kind==='icon'){o.push(artAt(null,sp.art,cx,H*.38,W*.42,H*.4,{},sp.artc),T_(sp.nm,0,H*.65,W,u*9.4,{font:sp.font||'Playfair Display',bold:true,color:ink,align:'center'}),T_(sp.tag,0,H*.65+u*11.6,W,u*3.2,{font:'Poppins',color:a,bold:true,align:'center',ls:18,upper:true}))}
  else if(sp.kind==='badge'){o.push(SH('ellipse',W*.1,H*.1,W*.8,W*.8,a),SH('ellipse',W*.14,H*.14,W*.72,W*.72,null,{stroke:'#ffffff',sw:u*.8,op:.8}),artAt(null,sp.art,cx,H*.38,W*.34,H*.3,{},sp.artc),T_(sp.nm,W*.14,H*.56,W*.72,u*6.4,{font:'Anton',color:'#fff',align:'center',ls:6}),T_(sp.tag,W*.14,H*.56+u*8.2,W*.72,u*2.8,{font:'Poppins',color:'#fff',align:'center',ls:14,upper:true,op:.9}))}
  else{o.push(SH('rect',W*.1,H*.12,W*.8,H*.76,a,{r:u*4}),artAt(null,sp.art,cx,H*.38,W*.3,H*.3,{},sp.artc),T_(sp.nm,W*.1,H*.6,W*.8,u*8,{font:sp.font||'Bricolage Grotesque',bold:true,color:sp.cc||'#fff',align:'center'}),T_(sp.tag,W*.1,H*.6+u*10,W*.8,u*3,{font:'Poppins',color:sp.cc||'#fff',op:.9,align:'center',ls:14,upper:true}))}
  return {bg,objs:o}}}
[['Monogram · Orange',{kind:'mono',a:'#e8590c',m:'A',nm:'Anand & Co.',tag:'Consulting'}],['Monogram · Navy',{kind:'mono',a:'#1b3a8a',m:'S',nm:'Sharma Group',tag:'Since 1992'}],['Lotus spa',{kind:'icon',art:'lotus',artc:['#f783ac','#e64980','#fff0f6'],a:'#c2255c',nm:'Padma Spa',tag:'Wellness & Ayurveda'}],['Diya brand',{kind:'icon',art:'diya',a:'#c2410c',nm:'Deepam',tag:'Handmade Candles'}],['Leaf organic',{kind:'icon',art:'leaf',artc:['#2f9e44','#b2f2bb'],a:'#2f9e44',nm:'Green Roots',tag:'Organic Store',font:'Lora'}],['Coffee badge',{kind:'badge',art:'cup',artc:['#fff3e0','#ffd8a8'],a:'#7a4a21',nm:'FILTER KAAPI',tag:'Chennai · Est. 1998'}],['Tech tile',{kind:'tile',art:'rocket',a:'#4263eb',nm:'Launchpad',tag:'Startup studio'}],['Gem jeweller',{kind:'icon',art:'gem',a:'#1c7ed6',nm:'Ratna Jewels',tag:'Fine jewellery',font:'Playfair Display'}]].forEach(([n,sp])=>add('Logos','Logo · '+n,[800,800],logoT(sp),'logo brand identity'));

/* ---- industry sets built on the promo/quote engines ---- */
const IND=[
 ['Education','Admissions open',{bg:'#4263eb',bg2:'#7048e8',a:'#ffd43b',cc:'#1f1c19',kick:'ADMISSIONS 2026–27',big:'ENROL\nNOW',sub:'Classes 1–12 · Limited seats · Call +91 00000 00000',art:'cap',layout:'left',cta:'APPLY TODAY',font:'Bricolage Grotesque'}],
 ['Education','Tuition classes',{bg:'#fff3bf',a:'#e8590c',ink:'#3b1f0a',kick:'BOARD EXAM BATCH',big:'MATHS &\nSCIENCE',sub:'Expert teachers · Small batches · Doubt classes',art:'book',layout:'left',cta:'JOIN BATCH',font:'Anton'}],
 ['Education','Online course',{bg:'#0b2a5b',bg2:'#1c7ed6',a:'#ffd43b',cc:'#1f1c19',kick:'LIVE ONLINE',big:'LEARN\nPYTHON',sub:'8 weeks · Certificate · Weekend batches',art:'laptop',artc:['#ffffff','#4263eb'],layout:'center',cta:'ENROL'}],
 ['Education','Study timetable',{bg:'#e7f5ff',a:'#1c7ed6',ink:'#0b2a5b',kick:'WEEKLY PLAN',big:'STUDY\nPLANNER',sub:'Plan · Focus · Revise',art:'bulb',layout:'split',cta:'GET STARTED'}],
 ['Real estate','For sale',{bg:'#10141f',a:'#ffd43b',cc:'#1f1c19',kick:'JUST LISTED',big:'DREAM HOME\nFOR SALE',sub:'3 BHK · 1,450 sq ft · Prime location',art:'house',layout:'left',cta:'BOOK A VISIT',bs:12}],
 ['Real estate','Open house',{bg:'#fff',a:'#e8590c',ink:'#1f1c19',kick:'OPEN HOUSE',big:'SUNDAY\n11 AM – 4 PM',sub:'Tour the show flat. Refreshments served.',art:'building',artc:['#4263eb','#1b3a8a','#ffffff'],layout:'center',cta:'RSVP',bs:12}],
 ['Real estate','Property launch',{bg:'#0b3d2e',bg2:'#10141f',a:'#ffd43b',cc:'#1f1c19',kick:'PRE-LAUNCH OFFER',big:'LUXURY\nAPARTMENTS',sub:'Starting ₹85 Lakh* · RERA registered',art:'building',artc:['#69db7c','#2b8a3e','#ffffff'],layout:'left',cta:'ENQUIRE',bs:12}],
 ['Real estate','Rent',{bg:'#e64980',a:'#fff3bf',cc:'#e64980',kick:'AVAILABLE NOW',big:'FLAT\nFOR RENT',sub:'2 BHK · Fully furnished · Near metro',art:'house',artc:['#fff3bf','#ffffff','#e64980'],layout:'badge',badge:'₹25K\n/MONTH',bb:8}],
 ['Fitness','Gym membership',{bg:'#10141f',a:'#e8590c',kick:'NEW YEAR OFFER',big:'GET FIT\nTHIS YEAR',sub:'Flat 40% off on annual membership.',art:'dumbbell',artc:['#e8590c','#ffffff'],layout:'left',cta:'JOIN NOW',pat:'dots',patop:.08}],
 ['Fitness','Yoga day',{bg:'#e7f5ff',bg2:'#d0ebff',a:'#1c7ed6',ink:'#0b2a5b',kick:'21 JUNE',big:'INTERNATIONAL\nYOGA DAY',sub:'Join our free community session at 6 AM.',art:'lotus',layout:'center',cta:'REGISTER',font:'Bricolage Grotesque',bs:10}],
 ['Fitness','Workout plan',{bg:'#364fc7',a:'#ffd43b',cc:'#1f1c19',kick:'7-DAY PLAN',big:'FULL BODY\nWORKOUT',sub:'No equipment. 20 minutes a day.',art:'pulse',artc:['#ffd43b'],layout:'split',cta:'START NOW'}],
 ['Fitness','Healthy eating',{bg:'#ebfbee',a:'#2f9e44',ink:'#14532d',kick:'EAT WELL',big:'HEALTHY\nMEAL PLAN',sub:'Balanced diets made simple. Free consultation.',art:'leaf',layout:'left',cta:'BOOK NOW',font:'Playfair Display'}],
 ['Food','Biryani special',{bg:'#7a0c1e',bg2:'#3b0409',a:'#ffd43b',cc:'#1f1c19',kick:'TODAY ONLY',big:'BIRYANI\nSPECIAL',sub:'Hyderabadi dum biryani · Free raita',art:'thali',artc:['#d0d0d0','#e03131','#ffd43b'],layout:'left',cta:'ORDER NOW',pat:'jaali',patop:.08}],
 ['Food','Cafe offer',{bg:'#fff3e0',a:'#7a4a21',ink:'#3b2a1a',kick:'MORNING DEAL',big:'COFFEE +\nCROISSANT',sub:'₹199 only · 8 AM to 11 AM',art:'cup',layout:'center',cta:'VISIT US',font:'Playfair Display',bs:11}],
 ['Food','Sweets box',{bg:'#5c0a14',a:'#ffc300',cc:'#1f1c19',kick:'FESTIVE GIFTING',big:'MITHAI\nHAMPERS',sub:'Hand-packed boxes. Free delivery above ₹999.',art:'gift',layout:'left',cta:'ORDER',font:'Rozha One',pat:'jaali',patop:.08}],
 ['Food','Pizza night',{bg:'#e03131',bg2:'#c2255c',a:'#ffd43b',cc:'#1f1c19',kick:'EVERY FRIDAY',big:'PIZZA\nNIGHT',sub:'Buy 1 get 1 free on all large pizzas.',art:'sparkle',layout:'badge',badge:'BUY 1\nGET 1',bb:9}],
 ['Fashion & Jewellery','Saree collection',{bg:'#7a0c1e',bg2:'#33040a',a:'#ffd166',cc:'#1f1c19',kick:'NEW COLLECTION',big:'SILK\nSAREES',sub:'Kanjivaram · Banarasi · Chanderi',art:'paisley',artc:['#ffd166','#e03131','#fff3bf'],layout:'left',cta:'EXPLORE',font:'Rozha One',pat:'jaali',patop:.07}],
 ['Fashion & Jewellery','Gold jewellery',{bg:'#10141f',a:'#ffc300',cc:'#10141f',kick:'AKSHAYA TRITIYA',big:'GOLD\nOFFER',sub:'Zero making charges on select designs.',art:'gem',layout:'left',cta:'VISIT STORE',font:'Playfair Display',bs:16}],
 ['Fashion & Jewellery','Fashion sale',{bg:'#f1ece4',a:'#1f1c19',ink:'#1f1c19',cc:'#ffffff',kick:'END OF SEASON',big:'UP TO\n70% OFF',sub:'Men · Women · Kids',art:'bag',artc:['#1f1c19','#ffffff'],layout:'left',cta:'SHOP NOW',font:'Playfair Display',bs:13}],
 ['Fashion & Jewellery','Salon offer',{bg:'#fff0f6',a:'#d6336c',ink:'#6b0f3a',kick:'BEAUTY SALON',big:'GLOW UP\nPACKAGE',sub:'Facial · Hair spa · Manicure · ₹1,999',art:'sparkle',layout:'center',cta:'BOOK NOW',font:'Playfair Display',bs:11}],
 ['Travel','Incredible India',{bg:'#e8590c',bg2:'#d6336c',a:'#ffd43b',cc:'#1f1c19',kick:'EXPLORE',big:'INCREDIBLE\nINDIA',sub:'Kerala · Rajasthan · Goa · Himachal',art:'plane',layout:'left',cta:'PLAN A TRIP',bs:12}],
 ['Travel','Holiday package',{bg:'#0b7285',bg2:'#1864ab',a:'#ffd43b',cc:'#1f1c19',kick:'HOLIDAY PACKAGE',big:'GOA\n4D / 3N',sub:'Hotel · Breakfast · Sightseeing · ₹12,999',art:'sun',layout:'badge',badge:'₹12,999',bb:8}],
 ['Travel','Weekend getaway',{bg:'#fff3bf',a:'#2b8a3e',ink:'#1f3d2b',kick:'ESCAPE THE CITY',big:'WEEKEND\nGETAWAY',sub:'Hill stations within 5 hours of your city.',art:'pin',layout:'center',cta:'BOOK NOW'}],
 ['Social','Podcast cover · Bold',{bg:'#1f1c19',a:'#e8590c',kick:'EPISODE 01',big:'THE\nCONVERSATION',sub:'Hosted by Your Name',art:'bell',layout:'center',cta:'LISTEN',bs:11}],
 ['Social','Pinterest tips',{bg:'#fff0f6',a:'#d6336c',ink:'#6b0f3a',kick:'SAVE THIS',big:'10 TIPS FOR\nBETTER SKIN',sub:'Simple habits that make a big difference.',art:'heart',layout:'center',cta:'READ MORE',bs:10,font:'Playfair Display'}],
 ['Social','Carousel cover',{bg:'#10141f',a:'#4dabf7',cc:'#10141f',kick:'SWIPE →',big:'5 MISTAKES\nTO AVOID',sub:'A quick guide for first-time founders.',art:'bulb',layout:'left',cta:'SWIPE',bs:12,font:'Bricolage Grotesque'}],
 ['Business','Testimonial',{bg:'#fff4e6',a:'#e8590c',ink:'#3b1f0a',kick:'HAPPY CLIENT',big:'“Best decision\nwe made.”',sub:'— Client Name, CEO, Company',art:'heart',layout:'center',cta:'READ STORY',font:'Playfair Display',bs:10}],
 ['Business','Tips list',{bg:'#364fc7',a:'#ffd43b',cc:'#1f1c19',kick:'TIPS & TRICKS',big:'5 WAYS TO\nSAVE TIME',sub:'1. Plan ahead  2. Batch tasks  3. Say no\n4. Automate  5. Take breaks',art:'bulb',layout:'left',cta:'SAVE THIS',bs:12}]
];
IND.forEach(([c,n,sp])=>add(c,n,[1080,1080],promo(sp),'offer poster '+(sp.kick||'')));
add('Print','Poster · Concert',[1240,1754],(W,H,u)=>({bg:{t:'grad',k:'lin',c1:'#12002e',c2:'#33005c',a:160},objs:[AI('stars',0,0,W,['#ffffff','#ff2bd6'],{fill:H,op:.8}),SH('ellipse',W*.1,H*.2,W*.8,W*.8,'#ff2bd6',{op:.18}),artAt(null,'firework',W/2,H*.3,W*.8,H*.34,{},['#ffd166','#ff2bd6','#ffffff']),T_('LIVE IN CONCERT',0,H*.52,W,u*3.4,{align:'center',font:'Poppins',bold:true,color:'#ffd166',ls:30}),T_('NIGHT OF\nMUSIC',W*.08,H*.56,W*.84,u*15,{align:'center',font:'Righteous',color:'#ffffff',lh:1,fx:'neon',fxc:'#ff2bd6',fxv:70}),T_('SAT · 12 DEC · 7 PM\nNehru Stadium, New Delhi',W*.08,H*.83,W*.84,u*3.6,{align:'center',font:'Poppins',color:'#ffffff',bold:true,lh:1.6}),T_('Tickets on yourticketsite.com',W*.08,H*.92,W*.84,u*2.6,{align:'center',font:'Poppins',color:'#ffffffaa'})]}),'poster concert event music');
add('Print','Poster · Sale',[1240,1754],promo({bg:'#e8590c',bg2:'#c2255c',a:'#ffd43b',cc:'#1f1c19',kick:'BIGGEST SALE OF THE YEAR',big:'FLAT 50%\nOFF',sub:'Everything in store · This week only',art:'bag',layout:'center',cta:'VISIT US',bs:20}),'poster sale');
add('Print','Flyer · Clean',[1240,1754],(W,H,u)=>({bg:{t:'solid',c:'#fff'},objs:[SH('rect',0,0,W,H*.42,'#12b886'),AI('wave',0,H*.36,W,['#ffffff','#e6fcf5'],{h:W*.16,fit:'cover'}),T_('GRAND\nOPENING',W*.08,H*.07,W*.8,u*15,{font:'Anton',color:'#fff',lh:1}),T_('Fresh bakes. Warm coffee. Good neighbours.',W*.08,H*.5,W*.8,u*5.4,{bold:true,lh:1.3,font:'Poppins'}),T_('Saturday 20 September · 9am–5pm\n12 Market Street',W*.08,H*.68,W*.8,u*4,{color:'#6f685f',lh:1.6,font:'Poppins'}),...pill(W*.08,H*.84,W*.5,u*9,'#1f1c19','Free coffee for the first 50','#fff',u)]}),'flyer');
add('Print','Brochure cover',[1754,1240],(W,H,u)=>({bg:{t:'grad',k:'lin',c1:'#0b2a5b',c2:'#1c7ed6',a:130},objs:[AI('dots',0,0,W,['#ffffff','#ffffff'],{fill:H,op:.08}),artAt(null,'building',W*.78,H*.5,W*.3,H*.86,{},['#ffd43b','#e8590c','#ffffff']),T_('COMPANY PROFILE 2026',W*.07,H*.2,W*.6,u*3.2,{font:'Poppins',bold:true,color:'#ffd43b',ls:22}),T_('Building a\nbetter tomorrow',W*.07,H*.27,W*.6,u*12,{font:'Bricolage Grotesque',bold:true,color:'#fff',lh:1.05}),T_('Your Company Name · www.yourcompany.com',W*.07,H*.78,W*.6,u*3,{font:'Poppins',color:'#ffffffcc'})]}),'brochure company profile');
add('Print','Tri-fold brochure',[1754,1240],(W,H,u)=>({bg:{t:'solid',c:'#ffffff'},objs:[SH('rect',0,0,W/3,H,'#e8590c'),SH('rect',W/3,0,W/3,H,'#fff4e6'),SH('rect',W*2/3,0,W/3,H,'#ffffff'),artAt(null,'lotus',W/6,H*.3,W*.2,H*.3,{},['#ffffff','#ffd8a8','#fff0f6']),T_('Wellness\nRetreat',W*.03,H*.5,W*.3,u*9,{font:'Playfair Display',bold:true,color:'#fff',align:'center',lh:1.05}),T_('About us',W*.37,H*.12,W*.26,u*5,{font:'Playfair Display',bold:true,color:'#3b1f0a'}),T_('Write a short introduction here. Describe who you are, what you do and why customers choose you.',W*.37,H*.24,W*.26,u*2.2,{font:'Poppins',color:'#3b1f0a',lh:1.7}),T_('Contact',W*.71,H*.12,W*.26,u*5,{font:'Playfair Display',bold:true,color:'#3b1f0a'}),T_('Your Address, City\n+91 00000 00000\nhello@yourcompany.com',W*.71,H*.24,W*.26,u*2.4,{font:'Poppins',color:'#3b1f0a',lh:1.8})]}),'brochure trifold');

/* ---------- Magic Studio: Eraser, Edit, Upscale, Layers, BG Generator, Image to video ---------- */
const yieldUI=()=>new Promise(r=>setTimeout(r,0));
const canvasOf=(w,h)=>{const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w));c.height=Math.max(1,Math.round(h));return c};
const urlOfCanvas=(c,type)=>c.toDataURL(type||'image/png');
const imgOf=async url=>{const i=new Image();i.src=url;await i.decode();return i};
async function aiStatus(){try{const r=await api('/design/stockstatus');return r.image||{ready:false,reason:'AI images are not set up'}}catch(e){return {ready:false,reason:e.message}}}
async function aiImage(body){return api('/design/genimage',body)}
function setImageSrc(o,url){const id=newAsset(url);if(!o.orig)o.orig=o.src;o.src=id;touch();renderInsp();renderPanel();return id}

/* ---- inpainting: multi-scale push-pull fill plus matched grain (works on this device, nothing is uploaded) ---- */
function inpaintCanvas(src,mask,opts={}){
  const W=src.width,H=src.height,sx=src.getContext('2d').getImageData(0,0,W,H),md=mask.getContext('2d').getImageData(0,0,W,H).data;
  const N=W*H,known=new Float32Array(N),wasHole=new Uint8Array(N);let holes=0;
  for(let i=0;i<N;i++){const h=md[i*4+3]>40;wasHole[i]=h?1:0;if(h)holes++;known[i]=h?0:1}
  if(!holes)return src;
  // grow the hole a little so object edges and halos go too
  const grow=opts.grow==null?3:opts.grow;let cur=wasHole;
  for(let g=0;g<grow;g++){const nx=new Uint8Array(cur);for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const p=y*W+x;if(cur[p]||cur[p-1]||cur[p+1]||cur[p-W]||cur[p+W])nx[p]=1}cur=nx}
  for(let i=0;i<N;i++){known[i]=cur[i]?0:1}
  // pyramid: each cell keeps the average colour of its known pixels and the fraction that is known
  const lv=[];{const c=new Float32Array(N*3);for(let i=0;i<N;i++){c[i*3]=sx.data[i*4];c[i*3+1]=sx.data[i*4+1];c[i*3+2]=sx.data[i*4+2]}lv.push({w:W,h:H,c,k:Float32Array.from(known)})}
  while(lv[lv.length-1].w>1||lv[lv.length-1].h>1){const a=lv[lv.length-1],w=Math.max(1,a.w>>1),h=Math.max(1,a.h>>1),c=new Float32Array(w*h*3),k=new Float32Array(w*h);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){let r=0,g=0,b=0,s=0,n=0;for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){const xx=Math.min(a.w-1,x*2+dx),yy=Math.min(a.h-1,y*2+dy),p=yy*a.w+xx,kk=a.k[p];r+=a.c[p*3]*kk;g+=a.c[p*3+1]*kk;b+=a.c[p*3+2]*kk;s+=kk;n++}
      const o=y*w+x;if(s>1e-6){c[o*3]=r/s;c[o*3+1]=g/s;c[o*3+2]=b/s}k[o]=s/n}
    lv.push({w,h,c,k})}
  // pull up from the coarsest level: known cells keep their colour, unknown cells take the blurrier level above
  let up=null;for(let L=lv.length-1;L>=0;L--){const a=lv[L],oc=new Float32Array(a.w*a.h*3);
    for(let y=0;y<a.h;y++)for(let x=0;x<a.w;x++){const p=y*a.w+x,kk=Math.min(1,a.k[p]*1.0);let r=127,g=127,b=127;
      if(up){const px=Math.min(up.w-1,x>>1),py=Math.min(up.h-1,y>>1),q=(py*up.w+px)*3;r=up.c[q];g=up.c[q+1];b=up.c[q+2]}
      oc[p*3]=a.c[p*3]*kk+r*(1-kk);oc[p*3+1]=a.c[p*3+1]*kk+g*(1-kk);oc[p*3+2]=a.c[p*3+2]*kk+b*(1-kk)}
    up={w:a.w,h:a.h,c:oc}}
  const f=up;
  // grain matched to the surroundings so the patch does not look plastic
  let sd=0,cnt=0;{const ring=new Uint8Array(N);const RR=Math.max(6,Math.round(Math.min(W,H)*.02));for(let y=RR;y<H-RR;y+=2)for(let x=RR;x<W-RR;x+=2){const p=y*W+x;if(cur[p])continue;let near=false;for(let d=-RR;d<=RR&&!near;d+=RR)for(let e=-RR;e<=RR;e+=RR)if(cur[(y+d)*W+x+e]){near=true;break}if(!near)continue;const l=(q)=>sx.data[q*4]*.3+sx.data[q*4+1]*.59+sx.data[q*4+2]*.11;const m=(l(p-1)+l(p+1)+l(p-W)+l(p+W))/4;sd+=(l(p)-m)*(l(p)-m);cnt++}}
  const grain=cnt>20?Math.min(14,Math.sqrt(sd/cnt)*.9):0;
  let seed=1234567;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
  const res=sx;
  for(let i=0;i<N;i++){if(!cur[i])continue;const n=grain?((rnd()+rnd()+rnd()-1.5)*2)*grain:0;res.data[i*4]=Math.max(0,Math.min(255,f.c[i*3]+n));res.data[i*4+1]=Math.max(0,Math.min(255,f.c[i*3+1]+n));res.data[i*4+2]=Math.max(0,Math.min(255,f.c[i*3+2]+n));res.data[i*4+3]=255}
  // feather the seam: blend 2px at the border of the fill with the original
  const outC=canvasOf(W,H),oc=outC.getContext('2d');oc.putImageData(res,0,0);return outC;
}
/* mask painted on a working canvas -> full-resolution inpaint, blended back through the painted shape only */
async function eraseObjects(url,mask){
  const full=await dataToCanvas(url,2600),W=full.width,H=full.height;
  const m=canvasOf(W,H);m.getContext('2d').drawImage(mask,0,0,W,H);
  const work=Math.min(1,1400/Math.max(W,H));let res;
  if(work<1){const sw=Math.round(W*work),sh=Math.round(H*work),s=canvasOf(sw,sh),sm=canvasOf(sw,sh);s.getContext('2d').drawImage(full,0,0,sw,sh);sm.getContext('2d').drawImage(m,0,0,sw,sh);await yieldUI();const filled=inpaintCanvas(s,sm,{grow:3});
    // detail from the original outside the hole, fill from the working pass inside it
    res=canvasOf(W,H);const rc=res.getContext('2d');rc.drawImage(full,0,0);const hole=canvasOf(W,H),hc=hole.getContext('2d');hc.filter='blur('+Math.max(1,Math.round(2/work))+'px)';hc.drawImage(m,0,0);hc.filter='none';hc.globalCompositeOperation='source-in';hc.imageSmoothingQuality='high';hc.drawImage(filled,0,0,W,H);rc.drawImage(hole,0,0)}
  else res=inpaintCanvas(full,m,{grow:3});
  return urlOfCanvas(res);
}

/* ---- Lanczos upscale + gentle sharpen ---- */
function lanczosKernel(x,a){if(x===0)return 1;if(Math.abs(x)>=a)return 0;const px=Math.PI*x;return a*Math.sin(px)*Math.sin(px/a)/(px*px)}
async function upscaleCanvas(src,factor,progress){
  const sw=src.width,sh=src.height;let k=factor;const MAXSIDE=8192,MAXPX=36e6;
  while(k>1&&(sw*k>MAXSIDE||sh*k>MAXSIDE||sw*k*sh*k>MAXPX))k-=.25;
  if(k<=1.01)throw new Error('This picture is already very large — no room to upscale further');
  const dw=Math.round(sw*k),dh=Math.round(sh*k),A=3,sc=src.getContext('2d').getImageData(0,0,sw,sh).data;
  // horizontal pass
  const tmp=new Float32Array(dw*sh*4);const scaleX=sw/dw,supX=Math.max(1,scaleX);
  const wx=[];for(let x=0;x<dw;x++){const c=(x+.5)*scaleX-.5,l=Math.max(0,Math.ceil(c-A*supX)),r=Math.min(sw-1,Math.floor(c+A*supX));let ws=[],s=0;for(let i=l;i<=r;i++){const w=lanczosKernel((i-c)/supX,A);ws.push(w);s+=w}wx.push({l,ws:ws.map(w=>w/s)})}
  for(let y=0;y<sh;y++){for(let x=0;x<dw;x++){const {l,ws}=wx[x];let r=0,g=0,b=0,a=0;for(let i=0;i<ws.length;i++){const p=((y*sw)+l+i)*4,w=ws[i];r+=sc[p]*w;g+=sc[p+1]*w;b+=sc[p+2]*w;a+=sc[p+3]*w}const q=(y*dw+x)*4;tmp[q]=r;tmp[q+1]=g;tmp[q+2]=b;tmp[q+3]=a}if(y%64===0){progress&&progress(.45*y/sh);await yieldUI()}}
  // vertical pass
  const out=canvasOf(dw,dh),oc=out.getContext('2d'),od=oc.createImageData(dw,dh),scaleY=sh/dh,wy=[];
  for(let y=0;y<dh;y++){const c=(y+.5)*scaleY-.5,l=Math.max(0,Math.ceil(c-A)),r=Math.min(sh-1,Math.floor(c+A));let ws=[],s=0;for(let i=l;i<=r;i++){const w=lanczosKernel(i-c,A);ws.push(w);s+=w}wy.push({l,ws:ws.map(w=>w/s)})}
  for(let y=0;y<dh;y++){const {l,ws}=wy[y];for(let x=0;x<dw;x++){let r=0,g=0,b=0,a=0;for(let i=0;i<ws.length;i++){const p=((l+i)*dw+x)*4,w=ws[i];r+=tmp[p]*w;g+=tmp[p+1]*w;b+=tmp[p+2]*w;a+=tmp[p+3]*w}const q=(y*dw+x)*4;od.data[q]=r<0?0:r>255?255:r;od.data[q+1]=g<0?0:g>255?255:g;od.data[q+2]=b<0?0:b>255?255:b;od.data[q+3]=a<0?0:a>255?255:a}if(y%48===0){progress&&progress(.45+.4*y/dh);await yieldUI()}}
  oc.putImageData(od,0,0);
  // unsharp mask (box-blur approximation, 2 passes)
  const id=oc.getImageData(0,0,dw,dh),d=id.data,bl=new Float32Array(d.length);
  const R=Math.max(1,Math.round(k*.6));const boxH=(srcA,dst)=>{for(let y=0;y<dh;y++){for(let c=0;c<3;c++){let acc=0;const row=y*dw;for(let x=-R;x<=R;x++)acc+=srcA[(row+Math.min(dw-1,Math.max(0,x)))*4+c];for(let x=0;x<dw;x++){dst[(row+x)*4+c]=acc/(2*R+1);acc+=srcA[(row+Math.min(dw-1,x+R+1))*4+c]-srcA[(row+Math.max(0,x-R))*4+c]}}}};
  const boxV=(srcA,dst)=>{for(let x=0;x<dw;x++){for(let c=0;c<3;c++){let acc=0;for(let y=-R;y<=R;y++)acc+=srcA[(Math.min(dh-1,Math.max(0,y))*dw+x)*4+c];for(let y=0;y<dh;y++){dst[(y*dw+x)*4+c]=acc/(2*R+1);acc+=srcA[(Math.min(dh-1,y+R+1)*dw+x)*4+c]-srcA[(Math.max(0,y-R)*dw+x)*4+c]}}}};
  const t1=new Float32Array(d.length);boxH(d,t1);boxV(t1,bl);progress&&progress(.95);await yieldUI();
  const amt=.55;for(let i=0;i<d.length;i+=4){for(let c=0;c<3;c++){const v=d[i+c]+(d[i+c]-bl[i+c])*amt;d[i+c]=v<0?0:v>255?255:v}}
  oc.putImageData(id,0,0);return {canvas:out,k};
}

/* ---- brush editor shared by Magic Eraser and Magic Edit ---- */
function maskEditor({title,intro,prompt,confirm,onRun}){
  const imgObj=first();const holder=el('div',{class:'mkh'});
  let base=null,mask=null,scale=1,brush=34,erase=false,busy=false,drawing=false,last=null;
  const status=el('p',{class:'note',role:'status'},'Loading…');
  const bc=el('canvas',{class:'mkb'}),mc=el('canvas',{class:'mkm'});holder.append(bc,mc);
  const pr=prompt?el('input',{class:'f',placeholder:prompt,'aria-label':'What should appear'}):null;
  const sz=el('input',{type:'range',min:6,max:120,value:brush,'aria-label':'Brush size',oninput:e=>{brush=+e.target.value}});
  const run=el('button',{class:'btn pri grow',html:ic('sparkle',16)+' '+confirm,onclick:async()=>{
    if(busy)return;const has=mask.getContext('2d').getImageData(0,0,mask.width,mask.height).data.some((v,i)=>i%4===3&&v>0);
    if(!has){status.textContent='Paint over the area first.';return}
    if(pr&&!pr.value.trim()){status.textContent='Describe what should appear there.';pr.focus();return}
    busy=true;run.disabled=true;status.textContent='Working…';
    try{const url=await onRun({mask,prompt:pr&&pr.value.trim(),status:t=>status.textContent=t,base});setImageSrc(imgObj,url);closeModal();toast('Done — undo with Ctrl+Z')}catch(e){status.textContent=(e&&e.message)||'That did not work';busy=false;run.disabled=false}}});
  const paint=(x,y)=>{const c=mask.getContext('2d');c.globalCompositeOperation=erase?'destination-out':'source-over';c.fillStyle='rgba(255,60,90,1)';c.strokeStyle='rgba(255,60,90,1)';c.lineCap='round';c.lineJoin='round';c.lineWidth=brush/scale;c.beginPath();if(last){c.moveTo(last[0],last[1]);c.lineTo(x,y);c.stroke()}else{c.arc(x,y,brush/scale/2,0,7);c.fill()}last=[x,y];const m=mc.getContext('2d');m.clearRect(0,0,mc.width,mc.height);m.globalAlpha=.55;m.drawImage(mask,0,0);m.globalAlpha=1};
  const pos=e=>{const r=mc.getBoundingClientRect();return [(e.clientX-r.left)/r.width*mask.width,(e.clientY-r.top)/r.height*mask.height]};
  mc.addEventListener('pointerdown',e=>{if(!mask)return;e.preventDefault();mc.setPointerCapture(e.pointerId);drawing=true;last=null;paint(...pos(e))});
  mc.addEventListener('pointermove',e=>{if(drawing)paint(...pos(e))});
  ['pointerup','pointercancel'].forEach(t=>mc.addEventListener(t,()=>{drawing=false;last=null}));
  const tools=el('div',{class:'row',style:'flex-wrap:wrap'},el('label',{style:'flex:0 0 auto'},'Brush'),sz,seg([{v:false,l:'Paint'},{v:true,l:'Rub out'}],()=>erase,v=>{erase=v}),el('button',{class:'btn sm',onclick:()=>{mask.getContext('2d').clearRect(0,0,mask.width,mask.height);mc.getContext('2d').clearRect(0,0,mc.width,mc.height)}},'Clear'));
  openModal(el('div',{style:'display:grid;gap:12px'},dlgHead(title),el('p',{class:'note'},intro),holder,tools,pr||null,el('div',{class:'row'},run,el('button',{class:'btn',onclick:closeModal},'Cancel')),status));
  (async()=>{try{const c=await dataToCanvas(D.assets[imgObj.src],1400);base=c;bc.width=mc.width=c.width;bc.height=mc.height=c.height;bc.getContext('2d').drawImage(c,0,0);mask=canvasOf(c.width,c.height);scale=Math.min(1,holder.getBoundingClientRect().width/c.width)||1;status.textContent='Paint over the area, then press the button.'}catch(e){status.textContent='Could not open that picture'}})();
}
function maskBox(mask,pad){const W=mask.width,H=mask.height,d=mask.getContext('2d').getImageData(0,0,W,H).data;let x0=W,y0=H,x1=0,y1=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(d[(y*W+x)*4+3]>40){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
  if(x1<x0)return null;const m=Math.round(pad);x0=Math.max(0,x0-m);y0=Math.max(0,y0-m);x1=Math.min(W,x1+m);y1=Math.min(H,y1+m);return {x:x0,y:y0,w:x1-x0,h:y1-y0}}
const fadedMask=(mask,px)=>{const c=canvasOf(mask.width,mask.height),x=c.getContext('2d');x.filter='blur('+px+'px)';x.drawImage(mask,0,0);x.filter='none';return c};

/* Magic Eraser: local inpainting, or the AI service when one that can edit is set up */
function openEraser(){const o=first();if(!o||!o.src)return;
  maskEditor({title:'Magic Eraser',intro:'Paint over anything you want gone — a person, a sign, a blemish. The area is filled in from its surroundings, on this device.',confirm:'Erase',
    onRun:async({mask,status})=>{status('Erasing…');await yieldUI();return eraseObjects(D.assets[o.src],mask)}});
}
/* Magic Edit: change only the painted area, from a text prompt */
async function openMagicEdit(){const o=first();if(!o||!o.src)return;const st=await aiStatus();
  if(!st.ready){toast(st.reason||'Set up AI images in Settings first',3600);return}
  maskEditor({title:'Magic Edit',intro:st.edit?'Paint the part you want to change, say what should be there, and only that part is redrawn.':'Paint the area and describe it. This image service cannot edit a photo directly, so a new picture is made and blended into the painted area (approximate). For exact edits, connect an OpenAI-compatible image service in Settings.',prompt:'e.g. a bunch of marigold flowers',confirm:'Generate',
    onRun:async({mask,prompt,status,base})=>{
      const full=await dataToCanvas(D.assets[o.src],2600),W=full.width,H=full.height,m=canvasOf(W,H);m.getContext('2d').drawImage(mask,0,0,W,H);
      const bx=maskBox(m,Math.max(24,Math.min(W,H)*.06));if(!bx)throw new Error('Paint over the area first');
      const side=Math.min(Math.max(bx.w,bx.h)*1.15,Math.min(W,H)),cx=bx.x+bx.w/2,cy=bx.y+bx.h/2,sx=Math.max(0,Math.min(W-side,cx-side/2)),sy=Math.max(0,Math.min(H-side,cy-side/2)),S=Math.min(1024,Math.round(side));
      const crop=canvasOf(S,S);crop.getContext('2d').drawImage(full,sx,sy,side,side,0,0,S,S);
      status('Asking the image service…');let res;
      if(st.edit){const mk=canvasOf(S,S),mx=mk.getContext('2d');mx.fillStyle='#fff';mx.fillRect(0,0,S,S);mx.globalCompositeOperation='destination-out';mx.drawImage(m,sx,sy,side,side,0,0,S,S);
        res=await aiImage({mode:'edit',prompt,image:urlOfCanvas(crop),mask:urlOfCanvas(mk),w:S,h:S})}
      else res=await aiImage({mode:'gen',prompt:prompt+', photo realistic, matching lighting, seamless',w:S,h:S});
      const gi=await imgOf(res.image),gc=canvasOf(side,side);gc.getContext('2d').drawImage(gi,0,0,side,side);
      // blend only through the painted shape (softened), keep everything else exactly as it was
      const soft=fadedMask(m,Math.max(2,side*.006)),part=canvasOf(side,side),pc=part.getContext('2d');pc.drawImage(soft,sx,sy,side,side,0,0,side,side);pc.globalCompositeOperation='source-in';pc.drawImage(gc,0,0);
      const out=canvasOf(W,H),oc=out.getContext('2d');oc.drawImage(full,0,0);oc.drawImage(part,sx,sy);return urlOfCanvas(out)}});
}

/* Upscale */
async function doUpscale(o,factor,set){
  try{set('Reading the picture…');const src=await dataToCanvas(D.assets[o.src],0);
    const {canvas,k}=await upscaleCanvas(src,factor,p=>set('Upscaling… '+Math.round(p*100)+'%'));
    const url=urlOfCanvas(canvas,canvas.width*canvas.height>16e6?'image/jpeg':'image/png');setImageSrc(o,url);toast(`Upscaled ${Math.round(k*100)/100}× — now ${canvas.width} × ${canvas.height}px`,3200);set('')}
  catch(e){set((e&&e.message)||'Upscaling failed')}
}

/* Magic Layers: subject and background on separate layers, with the hole behind the subject filled in */
async function magicLayers(o,set){
  try{set('Finding the subject…');const url=D.assets[o.src],cut=await cutOut(url,set);
    set('Filling in the background…');await yieldUI();
    const full=await dataToCanvas(url,2600),W=full.width,H=full.height,ci=await imgOf(cut),cc=canvasOf(W,H);cc.getContext('2d').drawImage(ci,0,0,W,H);
    const m=canvasOf(W,H),mx=m.getContext('2d');mx.drawImage(cc,0,0);mx.globalCompositeOperation='source-in';mx.fillStyle='#000';mx.fillRect(0,0,W,H);
    const bgURL=await eraseObjects(url,m);
    const subj=JSON.parse(JSON.stringify(o));subj.id=uid();subj.src=newAsset(cut);subj.name='Subject';subj.orig=null;delete subj.an;
    o.orig=null;o.src=newAsset(bgURL);o.name='Background';
    const list=objs(),i=list.findIndex(x=>x.id===o.id);list.splice(i+1,0,subj);sel=[subj.id];touch();selChanged();renderPanel();toast('Split into Subject and Background layers',3200);set('')}
  catch(e){set((e&&e.message)||'That did not work')}
}

/* ---- BG Generator ---- */
const BACKDROPS=[
 ['Studio',(c,W,H)=>{const g=c.createRadialGradient(W*.5,H*.4,H*.05,W*.5,H*.5,H*.85);g.addColorStop(0,'#f4f1ec');g.addColorStop(1,'#a9a39a');c.fillStyle=g;c.fillRect(0,0,W,H)}],
 ['Dark studio',(c,W,H)=>{const g=c.createRadialGradient(W*.5,H*.38,H*.04,W*.5,H*.5,H*.9);g.addColorStop(0,'#4a4a55');g.addColorStop(1,'#08080c');c.fillStyle=g;c.fillRect(0,0,W,H)}],
 ['Sunset',(c,W,H)=>{const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,'#2b1055');g.addColorStop(.45,'#d6336c');g.addColorStop(.75,'#ff922b');g.addColorStop(1,'#ffd43b');c.fillStyle=g;c.fillRect(0,0,W,H);c.fillStyle='rgba(255,230,150,.9)';c.beginPath();c.arc(W*.5,H*.72,H*.14,0,7);c.fill()}],
 ['Bokeh',(c,W,H)=>{const g=c.createLinearGradient(0,0,W,H);g.addColorStop(0,'#1c1b3a');g.addColorStop(1,'#5b2a86');c.fillStyle=g;c.fillRect(0,0,W,H);let s=7;const r=()=>{s=(s*16807)%2147483647;return s/2147483647};for(let i=0;i<34;i++){c.fillStyle=`hsla(${30+r()*300},90%,65%,${.1+r()*.22})`;c.beginPath();c.arc(r()*W,r()*H,H*(.03+r()*.1),0,7);c.fill()}}],
 ['Festive lights',(c,W,H)=>{const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,'#2b0a4e');g.addColorStop(1,'#0d0220');c.fillStyle=g;c.fillRect(0,0,W,H);let s=11;const r=()=>{s=(s*16807)%2147483647;return s/2147483647};for(let i=0;i<60;i++){c.fillStyle=`rgba(255,${160+r()*80|0},${40+r()*60|0},${.15+r()*.5})`;c.beginPath();c.arc(r()*W,r()*H,H*(.004+r()*.03),0,7);c.fill()}}],
 ['Aurora',(c,W,H)=>{c.fillStyle='#050b1f';c.fillRect(0,0,W,H);for(let i=0;i<5;i++){const g=c.createLinearGradient(0,H*.1,0,H*.8);g.addColorStop(0,'rgba(80,255,200,0)');g.addColorStop(.5,`rgba(${60+i*30},255,${190-i*20},.28)`);g.addColorStop(1,'rgba(80,255,200,0)');c.fillStyle=g;c.beginPath();c.moveTo(0,H*.3);for(let x=0;x<=W;x+=W/20)c.lineTo(x,H*(.3+.12*Math.sin(x/W*6+i)));c.lineTo(W,H*.9);c.lineTo(0,H*.9);c.fill()}}],
 ['Paper',(c,W,H)=>{c.fillStyle='#f4ece1';c.fillRect(0,0,W,H);let s=3;const r=()=>{s=(s*16807)%2147483647;return s/2147483647};for(let i=0;i<W*H/260;i++){c.fillStyle=`rgba(120,90,50,${r()*.07})`;c.fillRect(r()*W,r()*H,1.5,1.5)}}],
 ['Pastel blobs',(c,W,H)=>{c.fillStyle='#fff0f6';c.fillRect(0,0,W,H);[['#ffd6e7',.2,.25,.4],['#d0ebff',.8,.3,.35],['#fff3bf',.5,.85,.45],['#e5dbff',.15,.8,.3]].forEach(([col,x,y,r])=>{c.fillStyle=col;c.beginPath();c.arc(W*x,H*y,H*r,0,7);c.fill()})}],
 ['Ocean',(c,W,H)=>{const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,'#a5d8ff');g.addColorStop(.55,'#4dabf7');g.addColorStop(1,'#0b3d91');c.fillStyle=g;c.fillRect(0,0,W,H);c.strokeStyle='rgba(255,255,255,.25)';c.lineWidth=3;for(let k=0;k<6;k++){c.beginPath();for(let x=0;x<=W;x+=12)c.lineTo(x,H*(.58+k*.07)+Math.sin(x/70+k)*10);c.stroke()}}],
 ['Rangoli glow',(c,W,H)=>{const g=c.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*.7);g.addColorStop(0,'#ffe8a3');g.addColorStop(.5,'#fb8500');g.addColorStop(1,'#7a0c1e');c.fillStyle=g;c.fillRect(0,0,W,H);c.strokeStyle='rgba(255,255,255,.28)';for(let r=40;r<Math.max(W,H);r+=70){c.lineWidth=2;c.beginPath();c.arc(W/2,H/2,r,0,7);c.stroke()}}]
];
function backdropURL(i,w,h){const c=canvasOf(w,h);BACKDROPS[i][1](c.getContext('2d'),w,h);return urlOfCanvas(c,'image/jpeg')}
function useBackdrop(url,asLayer,o){
  if(asLayer){const id=newAsset(url);const b=mkImage(id,D.w,D.h,{x:0,y:0,w:D.w,h:D.h,fit:'cover',name:'Backdrop'});const list=objs(),i=o?list.findIndex(x=>x.id===o.id):-1;list.splice(i>=0?i:0,0,b);touch();selChanged();renderPanel()}
  else{const id=newAsset(url);P().bg={t:'img',src:id,c:'#fff'};touch();renderInsp();renderPanel()}
}
async function openBgGenerator(){
  const o=selObjs().find(x=>x.type==='image'&&x.src)||null;const st=await aiStatus();
  let busy=false;const out=el('div',{class:'grid2'}),status=el('p',{class:'note',role:'status'},st.ready?'Describe a scene, or pick an instant backdrop.':(st.reason||'AI is not set up')+'. Instant backdrops below work without it.');
  const ta=el('textarea',{class:'f',rows:2,placeholder:'e.g. a warm Diwali evening with glowing diyas and bokeh, soft light','aria-label':'Describe the background'});
  const styles=['Photo','Illustration','Soft gradient','Festive','Studio','Watercolor'];let style='Photo';
  const chips=el('div',{class:'chips'});const rc=()=>{chips.innerHTML='';styles.forEach(s=>chips.append(el('button',{class:'chip','aria-pressed':style===s,onclick:()=>{style=s;rc()}},s)))};rc();
  const asLayerBox=o?el('label',{class:'row',style:'gap:8px'},el('input',{type:'checkbox',checked:true,id:'bgLayer'}),el('span',{},'Put it behind the selected picture')):null;
  const place=(url)=>{const behind=!asLayerBox||document.getElementById('bgLayer').checked;if(o&&behind)useBackdrop(url,true,o);else useBackdrop(url,false);closeModal();toast('Background added — undo with Ctrl+Z')};
  const gen=el('button',{class:'btn pri',html:ic('sparkle',16)+' Generate',disabled:!st.ready,onclick:async()=>{
    if(busy)return;const t=ta.value.trim();if(!t){status.textContent='Describe the background first.';return}busy=true;gen.disabled=true;out.innerHTML='';status.textContent='Creating backgrounds… this can take up to a minute.';
    const ratio=D.w/D.h,w=ratio>=1?1024:Math.round(1024*ratio),h=ratio>=1?Math.round(1024/ratio):1024;
    try{const sty={Photo:'photo realistic',Illustration:'flat vector illustration',Festive:'festive, glowing lights, rich colours','Soft gradient':'soft gradient, minimal, out of focus',Studio:'clean studio backdrop, empty',Watercolor:'watercolor painting'}[style];
      const jobs=[1,2].map(()=>aiImage({mode:'gen',prompt:`${t}, ${sty}, background only, no people, no text, empty center space for a subject`,w,h,seed:Math.floor(Math.random()*1e9)}).catch(e=>({err:e})));
      const rs=await Promise.all(jobs);const good=rs.filter(r=>r&&r.image);if(!good.length)throw rs[0].err||new Error('No image came back');
      good.forEach(r=>out.append(el('button',{class:'cell',style:'padding:0;overflow:hidden;aspect-ratio:'+D.w+'/'+D.h,'aria-label':'Use this background',onclick:()=>place(r.image)},el('img',{src:r.image,alt:'',style:'width:100%;height:100%;object-fit:cover'}))));status.textContent='Pick one to use it.'}
    catch(e){status.textContent=(e&&e.message)||'That did not work'}busy=false;gen.disabled=false}});
  const inst=el('div',{class:'grid3'},BACKDROPS.map(([n],i)=>{const u=backdropURL(i,320,Math.round(320*D.h/D.w));return el('button',{class:'cell',style:'padding:0;overflow:hidden;aspect-ratio:'+D.w+'/'+D.h+';position:relative','aria-label':'Use backdrop '+n,onclick:()=>place(backdropURL(i,Math.min(1920,D.w),Math.round(Math.min(1920,D.w)*D.h/D.w)))},el('img',{src:u,alt:'',style:'width:100%;height:100%;object-fit:cover'}),el('small',{style:'position:absolute;left:4px;bottom:3px;color:#fff;text-shadow:0 1px 3px #000;font-size:11px'},n))}));
  openModal(el('div',{style:'display:grid;gap:12px'},dlgHead('BG Generator'),ta,chips,asLayerBox,el('div',{class:'row'},gen),status,out,el('h4',{class:'sh'},'Instant backdrops (no AI needed)'),inst));
}
/* free-standing AI picture (Magic Media) */
async function openMagicMedia(){const st=await aiStatus();if(!st.ready){toast(st.reason||'Set up AI images in Settings first',3600);return}
  const ta=el('textarea',{class:'f',rows:3,placeholder:'e.g. a rangoli of marigold petals on a stone floor, top view','aria-label':'Describe the picture'}),out=el('div',{class:'grid2'}),status=el('p',{class:'note',role:'status'},'');let busy=false;
  const go=el('button',{class:'btn pri',html:ic('sparkle',16)+' Create',onclick:async()=>{if(busy)return;const t=ta.value.trim();if(!t){status.textContent='Describe the picture first.';return}busy=true;go.disabled=true;out.innerHTML='';status.textContent='Creating… up to a minute.';
    try{const rs=await Promise.all([1,2].map(()=>aiImage({mode:'gen',prompt:t,w:1024,h:1024,seed:Math.floor(Math.random()*1e9)}).catch(e=>({err:e}))));const good=rs.filter(r=>r&&r.image);if(!good.length)throw rs[0].err||new Error('No image came back');
      good.forEach(r=>out.append(el('button',{class:'cell',style:'padding:0;overflow:hidden','aria-label':'Add this picture',onclick:async()=>{const i=await imgOf(r.image);const id=newAsset(r.image);addObj(mkImage(id,i.naturalWidth,i.naturalHeight));closeModal()}},el('img',{src:r.image,alt:'',style:'width:100%;height:100%;object-fit:cover'}))));status.textContent='Pick one to add it to your design.'}catch(e){status.textContent=(e&&e.message)||'That did not work'}busy=false;go.disabled=false}});
  openModal(el('div',{style:'display:grid;gap:12px'},dlgHead('Magic Media'),el('p',{class:'note'},'Describe a picture and add it to your design.'),ta,el('div',{class:'row'},go),status,out));
}

/* ---- Image to video: camera moves and parallax on your photo ---- */
const I2V=[['Slow zoom in','kbin',.14,'The classic documentary push-in'],['Zoom out reveal','kbout',.16,'Starts close and pulls back'],['Pan left','kbl',.18,'A calm sideways glide'],['Pan right','kbr',.18,'A calm sideways glide'],['Tilt up','kbu',.16,'Drifts upward'],['Tilt down','kbd',.16,'Drifts downward'],['Parallax depth','par',.2,'Subject and background move apart (uses Magic Layers)']];
function applyKB(o,kind,amt,dur){o.an=Object.assign(o.an||{},{l:kind,ka:amt,d:0})}
async function openImageToVideo(){
  const o=first();if(!o||!o.src)return;let kind='kbin',dur=P().dur||6,fill=true,busy=false;
  const lab=el('span',{class:'note',style:'min-width:34px'},dur+' s');
  const status=el('p',{class:'note',role:'status'},'This animates your photo with camera moves — it does not invent new motion.');
  const pv=el('canvas',{style:'width:100%;border-radius:10px;background:#111;aspect-ratio:'+D.w+'/'+D.h}),pcx=pv.getContext('2d');pv.width=420;pv.height=Math.round(420*D.h/D.w);
  const list=el('div',{class:'chips'});
  const clone=JSON.parse(JSON.stringify(o));if(fill){clone.x=0;clone.y=0;clone.w=D.w;clone.h=D.h}
  let raf=0,t0=performance.now();const sample=()=>{const cur=I2V.find(x=>x[0]===kind)||I2V[0],k=cur[1]==='par'?'kbin':cur[1],tt=((performance.now()-t0)/1000)%dur;pcx.setTransform(1,0,0,1,0,0);pcx.fillStyle='#000';pcx.fillRect(0,0,pv.width,pv.height);pcx.setTransform(pv.width/D.w,0,0,pv.height/D.h,0,0);
    const c=Object.assign({},clone);c.an={l:k,ka:cur[2],d:0};drawAnimObj(pcx,c,tt,dur,D.w,D.h,{s:pv.width/D.w});raf=requestAnimationFrame(sample)};
  const draw=()=>{list.innerHTML='';I2V.forEach(([n,k,a,h])=>list.append(el('button',{class:'chip',title:h,'aria-pressed':kind===n,onclick:()=>{kind=n;draw()}},n)))};draw();
  const apply=async(exportToo)=>{if(busy)return;busy=true;const cur=I2V.find(x=>x[0]===kind);
    try{
      if(fill){o.x=0;o.y=0;o.w=D.w;o.h=D.h;o.fit='cover'}
      P().dur=dur;
      if(cur[1]==='par'){status.textContent='Separating subject and background…';const set=t=>status.textContent=t;await magicLayers(o,set);
        const L=objs(),bg=L.find(x=>x.id===o.id),sub=L[L.findIndex(x=>x.id===o.id)+1];if(bg&&sub){bg.an={l:'kbin',ka:.16,d:0};sub.an={l:'kbpar',ka:.16,d:0}}}
      else applyKB(o,cur[1],cur[2],dur);
      touch();renderInsp();cancelAnimationFrame(raf);closeModal();toast('Added motion — press Preview, or export as MP4 / GIF',3600);
      if(exportToo){expo.fmt='video';openExport()}else playAnim();
    }catch(e){status.textContent=(e&&e.message)||'That did not work'}busy=false};
  openModal(el('div',{style:'display:grid;gap:12px'},dlgHead('Image to video'),pv,list,
    el('div',{class:'row'},el('label',{style:'flex:0 0 auto'},'Length'),el('input',{type:'range',min:2,max:20,step:1,value:dur,'aria-label':'Video length',oninput:e=>{dur=+e.target.value;lab.textContent=dur+' s'}}),lab),
    el('label',{class:'row',style:'gap:8px'},el('input',{type:'checkbox',checked:true,onchange:e=>{fill=e.target.checked;Object.assign(clone,fill?{x:0,y:0,w:D.w,h:D.h}:{x:o.x,y:o.y,w:o.w,h:o.h})}}),el('span',{},'Fill the whole page with the picture')),
    el('div',{class:'row'},el('button',{class:'btn pri grow',html:ic('play',16)+' Add motion & preview',onclick:()=>apply(false)}),el('button',{class:'btn grow',html:ic('download',16)+' Add motion & export video',onclick:()=>apply(true)})),status));
  const modalObserver=new MutationObserver(()=>{if($('#modal').hidden){cancelAnimationFrame(raf);modalObserver.disconnect()}});modalObserver.observe($('#modal'),{attributes:true,attributeFilter:['hidden']});
  sample();
}

/* ---- the inspector section ---- */
function magicInsp(o){
  if(!o||!o.src)return null;const st=el('p',{class:'note',role:'status'},''),set=t=>st.textContent=t;let busy=false;
  const guard=fn=>async()=>{if(busy)return;busy=true;try{await fn()}catch(e){set((e&&e.message)||'That did not work')}busy=false};
  const b=(i,t,fn,h)=>el('button',{class:'btn',title:h,html:ic(i,16)+' '+t,onclick:guard(fn)});
  return sec('Magic Studio',
    el('div',{class:'grid2'},b('eraser','Magic Eraser',async()=>openEraser(),'Paint over something to remove it'),b('magic','Magic Edit',async()=>openMagicEdit(),'Change part of the picture from a prompt'),b('image','Upscale 2×',()=>doUpscale(o,2,set),'Sharper, larger picture'),b('image','Upscale 4×',()=>doUpscale(o,4,set),'Up to 8,192 px'),b('layers','Magic Layers',()=>magicLayers(o,set),'Split subject and background'),b('bg','BG Generator',async()=>openBgGenerator(),'New background'),b('play','Image to video',async()=>openImageToVideo(),'Camera moves and parallax')),
    st,el('p',{class:'note'},'Eraser, Upscale, Layers and Image to video work on this device. Magic Edit and BG Generator use the AI image service set in Settings.'));
}

/* ---------- icon library and photo frames (shapes that live in SP) ---------- */
const IK=100/24,nfI=v=>Math.round(v*IK*100)/100;
function scD(d){return d.replace(/([MLHVCSQTAZmlhvcsqtaz])([^MLHVCSQTAZmlhvcsqtaz]*)/g,(m,c,args)=>{if(/[Zz]/.test(c))return 'Z';const n=(args.match(/-?\d*\.?\d+(?:e-?\d+)?/gi)||[]).map(Number);let out=[];
  if(c==='A'||c==='a'){for(let i=0;i<n.length;i+=7){out.push(nfI(n[i]),nfI(n[i+1]),n[i+2],n[i+3],n[i+4],nfI(n[i+5]),nfI(n[i+6]))}}else out=n.map(nfI);return c+out.join(' ')})}
const ic_c=(x,y,r)=>`M${x-r} ${y}A${r} ${r} 0 1 0 ${x+r} ${y}A${r} ${r} 0 1 0 ${x-r} ${y}Z`;
const ic_r=(x,y,w,h,r=0)=>{r=Math.min(r,w/2,h/2);return r?`M${x+r} ${y}H${x+w-r}A${r} ${r} 0 0 1 ${x+w} ${y+r}V${y+h-r}A${r} ${r} 0 0 1 ${x+w-r} ${y+h}H${x+r}A${r} ${r} 0 0 1 ${x} ${y+h-r}V${y+r}A${r} ${r} 0 0 1 ${x+r} ${y}Z`:`M${x} ${y}H${x+w}V${y+h}H${x}Z`};
const ic_p=pts=>'M'+pts.map(p=>p.join(' ')).join('L')+'Z';
const ic_ring=(x,y,r,t)=>ic_c(x,y,r)+ic_c(x,y,r-t);
const ic_ln=(x1,y1,x2,y2,w=2)=>{const dx=x2-x1,dy=y2-y1,l=Math.hypot(dx,dy),nx=-dy/l*w/2,ny=dx/l*w/2;return ic_p([[x1+nx,y1+ny],[x2+nx,y2+ny],[x2-nx,y2-ny],[x1-nx,y1-ny]])};
const ic_pl=(pts,w=2)=>{const L=[],R=[];pts.forEach((p,i)=>{const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)];let dx=b[0]-a[0],dy=b[1]-a[1];const l=Math.hypot(dx,dy)||1;dx/=l;dy/=l;let nx=-dy*w/2,ny=dx*w/2;if(i>0&&i<pts.length-1){const p0=pts[i-1],p1=pts[i+1];const d1=[p[0]-p0[0],p[1]-p0[1]],d2=[p1[0]-p[0],p1[1]-p[1]],l1=Math.hypot(...d1),l2=Math.hypot(...d2);const n1=[-d1[1]/l1,d1[0]/l1],n2=[-d2[1]/l2,d2[0]/l2];let mx=n1[0]+n2[0],my=n1[1]+n2[1];const ml=Math.hypot(mx,my)||1;mx/=ml;my/=ml;const cs=Math.max(.5,mx*n1[0]+my*n1[1]);nx=mx*w/2/cs;ny=my*w/2/cs}L.push([p[0]+nx,p[1]+ny]);R.unshift([p[0]-nx,p[1]-ny])});return ic_p(L.concat(R))};
const ic_st=(cx,cy,ro,ri,n,rot=-90)=>ic_p(Array.from({length:n*2},(_,i)=>{const a=(rot+i*180/n)*Math.PI/180,r=i%2?ri:ro;return[+(cx+Math.cos(a)*r).toFixed(2),+(cy+Math.sin(a)*r).toFixed(2)]}));
const ic_gear=(cx,cy,ro,ri,n)=>{const pts=[];for(let i=0;i<n;i++){const a0=i*2*Math.PI/n,s=Math.PI/n;[[-.55,ri],[-.3,ro],[.3,ro],[.55,ri]].forEach(([f,r])=>{const a=a0+f*s*1;pts.push([+(cx+Math.cos(a)*r).toFixed(2),+(cy+Math.sin(a)*r).toFixed(2)])})}return ic_p(pts)};
const ICONS=[];const icon=(name,cat,kw,...parts)=>{ICONS.push({n:name,c:cat,k:kw||'',d:scD(parts.join(''))});};
const ARC=(a,b,c,d)=>'';
/* ---- interface ---- */
icon('Arrow right','Interface','next forward','M3 10.6H14V6L21 12L14 18V13.4H3Z');
icon('Arrow left','Interface','back previous','M21 10.6H10V6L3 12L10 18V13.4H21Z');
icon('Arrow up','Interface','top','M10.6 21V10H6L12 3L18 10H13.4V21Z');
icon('Arrow down','Interface','bottom','M10.6 3V14H6L12 21L18 14H13.4V3Z');
icon('Arrow up-right','Interface','external','M6 4.6H19.4V18H17V8.3L6.6 18.7L4.9 17L15.3 6.6H6Z');
icon('Chevron right','Interface','next','M8 4.5L10.2 2.3L19.9 12L10.2 21.7L8 19.5L15.5 12Z');
icon('Chevron down','Interface','dropdown','M4.5 8L2.3 10.2L12 19.9L21.7 10.2L19.5 8L12 15.5Z');
icon('Check','Interface','tick done yes','M3.5 12.5L5.8 10.2L9.5 13.9L18.2 5.2L20.5 7.5L9.5 18.5Z');
icon('Close','Interface','cross x cancel','M5 7.2L7.2 5L12 9.8L16.8 5L19 7.2L14.2 12L19 16.8L16.8 19L12 14.2L7.2 19L5 16.8L9.8 12Z');
icon('Plus','Interface','add new','M10.5 4H13.5V10.5H20V13.5H13.5V20H10.5V13.5H4V10.5H10.5Z');
icon('Minus','Interface','remove',ic_r(4,10.5,16,3,1.5));
icon('Menu','Interface','hamburger',ic_r(3,5,18,2.6,1.3),ic_r(3,10.7,18,2.6,1.3),ic_r(3,16.4,18,2.6,1.3));
icon('Search','Interface','find magnify',ic_ring(10,10,7.5,2.5),ic_ln(15.4,15.4,21,21,3));
icon('Home','Interface','house','M12 3L22 12H19V20H14.5V14H9.5V20H5V12H2Z');
icon('Settings','Interface','gear cog',ic_gear(12,12,10,7.6,8),ic_c(12,12,3.2));
icon('Bell','Interface','notification alert','M12 2.5c-.9 0-1.6.7-1.6 1.6v.6C7.6 5.4 6 7.8 6 10.5v4.2L4 17v1.5h16V17l-2-2.3v-4.2c0-2.7-1.6-5.1-4.4-5.8v-.6c0-.9-.7-1.6-1.6-1.6zM10 19.5h4a2 2 0 0 1-4 0Z');
icon('Lock','Interface','secure private',ic_r(5,10.5,14,10.5,2),ic_c(12,15,1.7),'M8 10.5V7.5a4 4 0 0 1 8 0v3h-2v-3a2 2 0 0 0-4 0v3Z');
icon('Eye','Interface','view visible','M12 5C6.5 5 2.5 9 1 12c1.5 3 5.5 7 11 7s9.5-4 11-7c-1.5-3-5.5-7-11-7Z',ic_c(12,12,4.4),ic_c(12,12,2.2));
icon('Trash','Interface','delete bin',ic_r(4,5,16,2,1),ic_r(9,2.8,6,2),'M6 8H18L17 20.5A1.5 1.5 0 0 1 15.5 22H8.5A1.5 1.5 0 0 1 7 20.5Z',ic_r(9.4,10.5,1.4,8,.7),ic_r(13.2,10.5,1.4,8,.7));
icon('Edit','Interface','pencil write','M3 17.5V21H6.5L18.5 9L15 5.5ZM15.8 4.7L17.8 2.7A1 1 0 0 1 19.2 2.7L21.3 4.8A1 1 0 0 1 21.3 6.2L19.3 8.2Z');
icon('Download','Interface','save','M10.5 3H13.5V11H17L12 17L7 11H10.5Z',ic_r(4,19,16,2.5,1));
icon('Upload','Interface','publish','M10.5 17H13.5V9H17L12 3L7 9H10.5Z',ic_r(4,19,16,2.5,1));
icon('Share','Interface','send social',ic_c(18,5.5,3),ic_c(6,12,3),ic_c(18,18.5,3),ic_ln(8.4,10.8,15.6,6.7,1.5),ic_ln(8.4,13.2,15.6,17.3,1.5));
icon('Link','Interface','chain url',ic_r(1.5,8,13,8,4)+ic_r(3.7,10.2,8.6,3.6,1.8),ic_r(9.5,8,13,8,4)+ic_r(11.7,10.2,8.6,3.6,1.8));
icon('Calendar','Interface','date schedule','M5 4.5H19A2 2 0 0 1 21 6.5V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V6.5A2 2 0 0 1 5 4.5Z'+ic_r(5,10,14,9,1),ic_r(7,2,2,4,1),ic_r(15,2,2,4,1));
icon('Clock','Interface','time hour',ic_ring(12,12,10,2.2),ic_ln(12,12,12,6.5,2),ic_ln(12,12,15.8,14.2,2));
icon('Location pin','Interface','map place gps','M12 2A7 7 0 0 0 5 9C5 14 12 22 12 22S19 14 19 9A7 7 0 0 0 12 2Z',ic_c(12,9,2.7));
icon('Star','Interface','favourite rating',ic_st(12,12.5,10.5,4.4,5));
icon('Heart','Interface','love like','M12 21.5C3.5 15 2 9.5 4.8 6C7.2 3.2 11 3.8 12 6.5C13 3.8 16.8 3.2 19.2 6C22 9.5 20.5 15 12 21.5Z');
icon('Bookmark','Interface','save later','M6 3H18V21.5L12 17L6 21.5Z');
icon('Flag','Interface','report',ic_r(5,3,2,19,1),'M7 4H19L16 8.5L19 13H7Z');
icon('Info','Interface','about help',ic_c(12,12,10),ic_r(10.8,10.5,2.4,6.5,1.1),ic_c(12,7.5,1.4));
icon('Warning','Interface','alert caution','M12 2.5L22.5 20.5H1.5Z',ic_r(10.8,8.5,2.4,6,1.1),ic_c(12,17.4,1.3));
icon('Help','Interface','question',ic_c(12,12,10),ic_c(12,17.2,1.2),'M10 9.5A2 2 0 1 1 12 11.6V13.4H10.8V11C12.2 10.8 12.2 8.7 12 8.7A1 1 0 0 0 11 9.5Z');
icon('Filter','Interface','funnel','M3 4H21L14 12.5V20L10 18V12.5Z');
icon('Grid','Interface','apps layout',ic_r(3,3,8,8,1.5),ic_r(13,3,8,8,1.5),ic_r(3,13,8,8,1.5),ic_r(13,13,8,8,1.5));
icon('List','Interface','bullets',ic_c(4.5,6,1.6),ic_r(8,5,13,2,1),ic_c(4.5,12,1.6),ic_r(8,11,13,2,1),ic_c(4.5,18,1.6),ic_r(8,17,13,2,1));
icon('Refresh','Interface','reload sync','M12 4A8 8 0 1 0 19.5 9.5H17.2A6 6 0 1 1 12 6V9L17 5L12 1Z');
icon('Power','Interface','on off','M10.8 2H13.2V12H10.8ZM7 5.2L8.5 7A6.5 6.5 0 1 0 15.5 7L17 5.2A9 9 0 1 1 7 5.2Z');
icon('Thumbs up','Interface','like good','M2 10H6V21H2ZM8 10L12 2C14 2 15.5 3.5 15 5.5L14.2 9H20A2 2 0 0 1 22 11.4L20.6 19A2 2 0 0 1 18.6 21H8Z');
icon('Fire','Interface','hot trending','M12 2C12 6 8 8 8 13A4 4 0 0 0 9 15.7C9 14 10 13 11 12.5C11 15 13 15.5 13 18A2 2 0 0 1 11 20A4.5 4.5 0 0 0 17 15.5C17 11 13 8 12 2Z');
icon('Bolt','Interface','lightning power energy','M13 2L4 14H11L10 22L20 9H13Z');
icon('Sparkle','Interface','magic new',ic_st(12,12,10.5,2.6,4),ic_st(19,5,3.5,1.1,4));
icon('Crown','Interface','premium king queen','M3 7L8 11L12 5L16 11L21 7L19 19H5Z');
icon('Gift','Interface','present surprise',ic_r(3,9,18,4,1),'M4.5 13H19.5V21H4.5ZM11 9H13V21H11Z'.replace('M11 9H13V21H11Z',''),'M12 9C10 5 6 5 6 7.5C6 9.5 9 9 12 9ZM12 9C14 5 18 5 18 7.5C18 9.5 15 9 12 9Z');
icon('Trophy','Interface','award winner','M7 3H17V9A5 5 0 0 1 12 14A5 5 0 0 1 7 9ZM4 4H7V6.5H5.5V8A2 2 0 0 0 7.5 10V11.5A3.5 3.5 0 0 1 4 8ZM20 4H17V6.5H18.5V8A2 2 0 0 1 16.5 10V11.5A3.5 3.5 0 0 0 20 8Z',ic_r(11,14,2,4),ic_r(7.5,18,9,3,1));
icon('Medal','Interface','badge award','M7 2H11L12.5 7H9.5ZM17 2H13L11.5 7H14.5Z',ic_ring(12,15,7,2),ic_c(12,15,3.2));
icon('Shield','Interface','security protect','M12 2L20 5V11C20 16 16.5 20 12 22C7.5 20 4 16 4 11V5Z');
icon('Target','Interface','goal aim',ic_ring(12,12,10,2.2),ic_ring(12,12,6.2,2.2),ic_c(12,12,1.8));
icon('Lightbulb','Interface','idea','M12 2A7 7 0 0 0 8.5 15V17H15.5V15A7 7 0 0 0 12 2ZM9 18.5H15V20H9ZM10 21H14V22H10Z');
icon('Puzzle','Interface','integration plugin','M4 8H8A2.5 2.5 0 1 1 13 8H17V12A2.5 2.5 0 1 1 17 17V20H4V16A2.5 2.5 0 1 0 4 11Z');
icon('Infinity','Interface','loop forever','M7 7A5 5 0 1 0 7 17C9.5 17 11 15 12 12C13 9 14.5 7 17 7A5 5 0 1 1 17 17C14.5 17 13 15 12 12C11 9 9.5 7 7 7ZM7 9.2C8.2 9.2 8.8 10.3 9.6 12C8.8 13.7 8.2 14.8 7 14.8A2.8 2.8 0 1 1 7 9.2ZM17 9.2A2.8 2.8 0 1 1 17 14.8C15.8 14.8 15.2 13.7 14.4 12C15.2 10.3 15.8 9.2 17 9.2Z'.replace(/Z/g,'Z'));
/* ---- media & communication ---- */
icon('Play','Media','start video','M7 4L20 12L7 20Z');
icon('Pause','Media','',ic_r(6,4,4,16,1),ic_r(14,4,4,16,1));
icon('Stop','Media','square',ic_r(5,5,14,14,2));
icon('Next track','Media','skip','M5 5L15 12L5 19Z',ic_r(16,5,3,14,1));
icon('Volume','Media','sound speaker','M3 9.5H7L12 5V19L7 14.5H3Z','M14.8 8.6L16.2 7.2A6.5 6.5 0 0 1 16.2 16.8L14.8 15.4A4.5 4.5 0 0 0 14.8 8.6Z');
icon('Microphone','Media','voice record',ic_r(9,2.5,6,12,3),'M5.5 11H7.5A4.5 4.5 0 0 0 16.5 11H18.5A6.5 6.5 0 0 1 13 17.4V20H16V22H8V20H11V17.4A6.5 6.5 0 0 1 5.5 11Z');
icon('Headphones','Media','music audio','M12 3A9 9 0 0 0 3 12V19A2 2 0 0 0 5 21H7V13H5V12A7 7 0 0 1 19 12V13H17V21H19A2 2 0 0 0 21 19V12A9 9 0 0 0 12 3Z');
icon('Music','Media','note song','M9 3L20 1V16A3.5 3.5 0 1 1 18 12.8V6L11 7.2V18A3.5 3.5 0 1 1 9 14.8Z');
icon('Camera','Media','photo',ic_r(2,6.5,20,14,2.5)+ic_c(12,13.5,4.4),ic_c(12,13.5,2.6),ic_p([[8,6.5],[9.5,3.5],[14.5,3.5],[16,6.5]]));
icon('Image','Media','photo picture',ic_r(3,4,18,16,2)+ic_r(5,6,14,12,.5),'M5 18L10 11.5L13 15.5L15 13L19 18Z',ic_c(15.5,9.5,1.7));
icon('Video','Media','film movie',ic_r(2,6,13.5,12,2.5),'M17 10L22 6.5V17.5L17 14Z');
icon('Film','Media','cinema',ic_r(3,3,18,18,2)+ic_r(7,3,10,18,0),ic_r(4.2,5,1.6,2,.3),ic_r(4.2,11,1.6,2,.3),ic_r(4.2,17,1.6,2,.3),ic_r(18.2,5,1.6,2,.3),ic_r(18.2,11,1.6,2,.3),ic_r(18.2,17,1.6,2,.3));
icon('Mail','Communication','email envelope',ic_r(2,4.5,20,15,2.5)+ic_p([[4,7.8],[12,13.8],[20,7.8],[20,17.5],[4,17.5]]));
icon('Phone','Communication','mobile',ic_r(7,2,10,20,2.5)+ic_r(8.8,5,6.4,12,.4),ic_c(12,19.5,.9));
icon('Call','Communication','telephone','M6.6 3L9.5 3.4L10.8 7.5L8.7 9A12 12 0 0 0 15 15.3L16.5 13.2L20.6 14.5L21 17.4A3 3 0 0 1 18 20.5A15.5 15.5 0 0 1 3.5 6A3 3 0 0 1 6.6 3Z');
icon('Chat','Communication','message bubble',ic_r(3,4,18,13,3),ic_p([[8,17],[8,21.5],[13,17]]));
icon('Chat dots','Communication','comment',ic_r(3,4,18,13,3)+ic_c(8,10.5,1.2)+ic_c(12,10.5,1.2)+ic_c(16,10.5,1.2),ic_p([[8,17],[8,21.5],[13,17]]));
icon('Megaphone','Communication','announce marketing','M3 9H7L14 4V20L7 15H5V20H3ZM16 8.5A4.5 4.5 0 0 1 16 15.5V13.5A2.5 2.5 0 0 0 16 10.5Z');
icon('Send','Communication','paper plane','M2 3L22 12L2 21L4 13L14 12L4 11Z');
icon('Globe','Communication','world web',ic_ring(12,12,10,1.8),'M12 2A4.6 10 0 0 0 12 22A4.6 10 0 0 0 12 2ZM12 3.8A3 8.2 0 0 1 12 20.2A3 8.2 0 0 1 12 3.8Z',ic_r(2.5,11.1,19,1.8));
icon('WiFi','Communication','wireless signal','M12 19.5A1.8 1.8 0 1 0 12 15.9A1.8 1.8 0 0 0 12 19.5ZM12 12C13.7 12 15.2 12.7 16.3 13.8L17.7 12.4A8 8 0 0 0 6.3 12.4L7.7 13.8A6 6 0 0 1 12 12ZM12 7.5A11 11 0 0 1 19.8 10.7L21.2 9.3A13 13 0 0 0 2.8 9.3L4.2 10.7A11 11 0 0 1 12 7.5Z');
icon('Rss','Communication','feed subscribe',ic_c(5.5,18.5,2.2),'M3.5 10.5A10 10 0 0 1 13.5 20.5H11A7.5 7.5 0 0 0 3.5 13ZM3.5 4A16.5 16.5 0 0 1 20 20.5H17.5A14 14 0 0 0 3.5 6.5Z');
icon('Hashtag','Communication','tag social',ic_ln(9,3,7,21,2),ic_ln(17,3,15,21,2),ic_ln(4,9,21,9,2),ic_ln(3,15,20,15,2));
icon('At sign','Communication','email address',ic_ring(12,12,10,2.2),ic_ring(12,12,4,2.2));
icon('Thumbs','Communication','',ic_c(12,12,1));
ICONS.pop();
/* ---- business & finance ---- */
icon('Briefcase','Business','work job',ic_r(3,7,18,14,2.5)+ic_r(10.5,12.5,3,2),'M9 7V4.5A1.5 1.5 0 0 1 10.5 3H13.5A1.5 1.5 0 0 1 15 4.5V7H13.2V4.8H10.8V7Z');
icon('Building','Business','office company',ic_r(5,2.5,14,19,1)+ic_r(7.5,5,2,2)+ic_r(11,5,2,2)+ic_r(14.5,5,2,2)+ic_r(7.5,9,2,2)+ic_r(11,9,2,2)+ic_r(14.5,9,2,2)+ic_r(7.5,13,2,2)+ic_r(11,13,2,2)+ic_r(14.5,13,2,2)+ic_r(10,17.5,4,4));
icon('Bar chart','Business','analytics statistics',ic_r(3.5,12,4.5,9,1),ic_r(9.8,5,4.5,16,1),ic_r(16,9,4.5,12,1));
icon('Line chart','Business','growth trend',ic_pl([[3,17],[8.5,11],[13,15],[19,8]],2.4),'M15.5 4.6H21.4V10.5Z');
icon('Pie chart','Business','report share','M11 2.1V13H21.9A10 10 0 1 1 11 2.1Z','M13 2.1A10 10 0 0 1 21.9 11H13Z');
icon('Trend up','Business','profit increase',ic_pl([[2.5,17.5],[8.5,11.5],[12.5,15.5],[18,10]],2.4),'M15 6H22V13Z');
icon('Trend down','Business','loss decrease',ic_pl([[2.5,6.5],[8.5,12.5],[12.5,8.5],[18,14]],2.4),'M15 18H22V11Z');
icon('Rupee','Finance','money inr currency india','M6 3H18V5.2H14.6A4.3 4.3 0 0 1 16.7 8.2H18V10.4H16.9A6 6 0 0 1 11 14.6H9.6L17 21H14L6.4 14.4V12.4H11A3.6 3.6 0 0 0 14.4 10.4H6V8.2H14A3 3 0 0 0 11.2 5.2H6Z');
icon('Dollar','Finance','money usd currency','M11 2H13V4.1C15.5 4.4 17 6 17 8H15C15 7 14.2 6.2 12 6.2C10 6.2 9 7 9 8C9 9 9.8 9.5 12.5 10.2C15.6 11 17.2 12 17.2 14.4C17.2 16.4 15.5 18 13 18.3V20.5H11V18.3C8.5 18 6.8 16.4 6.8 14.2H9C9 15.5 10 16.2 12 16.2C13.8 16.2 15 15.5 15 14.4C15 13.2 14 12.8 11.5 12.1C8.3 11.2 7 10.2 7 8C7 6 8.6 4.4 11 4.1Z');
icon('Wallet','Finance','payment cash','M3 6.5A2.5 2.5 0 0 1 5.5 4H18V7H5.5A.5.5 0 0 0 5 7.5V7.5L5 8H20A1 1 0 0 1 21 9V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19Z'+ic_c(17,14,1.4));
icon('Credit card','Finance','payment bank',ic_r(2,5,20,14,2.5)+ic_r(2,8.5,20,2.8,0).replace(/Z$/,'Z'),ic_r(4.5,14.5,5,2,1));
icon('Coin','Finance','money cash',ic_ring(12,12,10,2.2),'M12 7L13.2 10.2L16.5 10.4L14 12.6L14.8 15.8L12 14L9.2 15.8L10 12.6L7.5 10.4L10.8 10.2Z');
icon('Piggy bank','Finance','savings','M19 9.5A9 9 0 0 0 3 12.5A5.5 5.5 0 0 0 5.5 16.5V20H9V18.5H14V20H17.5V16.5A5.5 5.5 0 0 0 20 13.5H22V10.5Z'+ic_c(15.5,10.5,1));
icon('Handshake','Business','deal partner','M2 9L6.5 6L10.5 8L14 6L19 6L22 9L22 13L19.5 13L15 18L12 18L9.5 16L7 17L5 15L2 13Z');
icon('Contract','Business','document sign','M5 2H15L20 7V22H5Z'+ic_r(8,12,9,1.6,.5)+ic_r(8,15.5,9,1.6,.5)+ic_r(8,8.5,4,1.6,.5));
icon('Presentation','Business','slides board',ic_r(2,3,20,13,1.5)+ic_r(4,5,16,9,.5),ic_ln(12,16,12,21,2),ic_ln(7,21.5,17,21.5,1.6),ic_pl([[6,12],[10,8.5],[13,11],[18,7]],1.6));
icon('Email marketing','Business','newsletter',ic_c(12,12,9.5));ICONS.pop();
icon('Percent','Business','discount sale offer',ic_c(7,7,3.5)+ic_c(7,7,1.7),ic_c(17,17,3.5)+ic_c(17,17,1.7),ic_ln(19.5,4.5,4.5,19.5,2.2));
icon('Tag','Shopping','price label','M3 3H12.5L21 11.5L12.5 20L3.5 11.5Z'+ic_c(7.5,7.5,1.7));
icon('Cart','Shopping','shop basket','M1.5 3H5L5.8 5.5H21L18.5 13.5H7.7L8.2 15.2H19V17H6.8L4 5H1.5Z'+'',ic_c(9,20,1.7),ic_c(17.5,20,1.7));
icon('Shopping bag','Shopping','store purchase','M5 7H19L20.5 21H3.5Z'+'M9 7V6A3 3 0 0 1 15 6V7H13.2V6A1.2 1.2 0 0 0 10.8 6V7Z'.replace('M9 7V6A3 3 0 0 1 15 6V7H13.2V6A1.2 1.2 0 0 0 10.8 6V7Z',''),'M8.5 9.5V6.5A3.5 3.5 0 0 1 15.5 6.5V9.5H14V6.5A2 2 0 0 0 10 6.5V9.5Z');
icon('Store','Shopping','shop market','M3 9L4.5 3H19.5L21 9A3 3 0 0 1 15 9A3 3 0 0 1 9 9A3 3 0 0 1 3 9ZM4.5 11V21H19.5V11A4.2 4.2 0 0 1 17.4 10.7V17H6.6V10.7A4.2 4.2 0 0 1 4.5 11Z');
icon('Truck','Transport','delivery cargo logistics',ic_r(1.5,6,13,10,1.2),'M16 9H19.5L22.5 13V16H16Z',ic_c(6.5,17.5,2.4),ic_c(18,17.5,2.4));
icon('Package','Shopping','box parcel','M12 2L21 6.5V17.5L12 22L3 17.5V6.5ZM12 4.2L6 7.2L12 10.2L18 7.2Z'.replace('M12 4.2L6 7.2L12 10.2L18 7.2Z',''),'M3 6.5L12 11L21 6.5L21 7.2L12 11.7L3 7.2Z'.replace(/.*/,''));
ICONS.pop();icon('Package','Shopping','box parcel delivery',ic_p([[12,2],[21,6.5],[21,17.5],[12,22],[3,17.5],[3,6.5]])+ic_p([[12,4.4],[6.2,7.3],[12,10.2],[17.8,7.3]])+ic_p([[11,11.9],[11,19.4],[4.8,16.2],[4.8,8.8]]));
icon('Barcode','Shopping','scan',ic_r(3,4,2,16),ic_r(6.5,4,1,16),ic_r(9,4,3,16),ic_r(13.5,4,1,16),ic_r(16,4,2,16),ic_r(19.5,4,1.5,16));
icon('QR code','Shopping','scan',ic_r(3,3,7,7,1)+ic_r(5,5,3,3),ic_r(14,3,7,7,1)+ic_r(16,5,3,3),ic_r(3,14,7,7,1)+ic_r(5,16,3,3),ic_r(14,14,3,3),ic_r(18,18,3,3),ic_r(18,14,3,3).replace(/.*/,''));
/* ---- people ---- */
icon('User','People','person profile account',ic_c(12,7.5,4.5),'M3.5 21.5C3.5 16.8 7.3 14 12 14S20.5 16.8 20.5 21.5Z');
icon('Users','People','team group',ic_c(9,8,3.8),'M1.5 20C1.5 15.8 4.8 13.5 9 13.5S16.5 15.8 16.5 20Z',ic_c(17.2,8.8,3),'M18 13.7C21 13.9 22.8 16 22.8 19.5H18.2C18.2 17.3 17.4 15.2 15.8 14C16.5 13.8 17.2 13.7 18 13.7Z');
icon('Add user','People','invite',ic_c(10,8,4),'M2.5 21C2.5 16.8 6 14 10 14S17.5 16.8 17.5 21Z','M19 7H21V10H24V12H21V15H19V12H16V10H19Z'.replace('24','23.5'));
icon('Id card','People','badge identity',ic_r(2,4,20,16,2.5)+ic_c(8.5,10.5,2.3),'M4.8 17C4.8 15 6.4 14 8.5 14S12.2 15 12.2 17Z',ic_r(14,9,6,1.6,.8).replace(/.*/,m=>m),ic_r(14,12.5,6,1.6,.8));
icon('Graduation cap','Education','student degree','M12 3L23 8.5L12 14L1 8.5ZM5.5 12.5V17C5.5 18.5 8.5 20 12 20S18.5 18.5 18.5 17V12.5L12 15.8Z');
icon('Book','Education','read study','M4 3.5H11V20H5.5A1.5 1.5 0 0 1 4 18.5ZM13 3.5H20V18.5A1.5 1.5 0 0 1 18.5 20H13Z');
icon('Open book','Education','library learn','M2 5A9 3 0 0 1 12 6.5A9 3 0 0 1 22 5V19A9 3 0 0 0 12 20.5A9 3 0 0 0 2 19Z'.replace(/.*/,'M2 4.5C5 3.5 9.5 3.8 11.2 5.5V20C9.5 18.6 5 18.4 2 19.3ZM22 4.5C19 3.5 14.5 3.8 12.8 5.5V20C14.5 18.6 19 18.4 22 19.3Z'));
icon('Pencil ruler','Education','school design',ic_r(3,3,5,18,1)+ic_r(4.6,6,1.8,1.2,.2)+ic_r(4.6,9,1.8,1.2,.2)+ic_r(4.6,12,1.8,1.2,.2),'M12 21L12 7.5L15.5 3L19 7.5V21Z',ic_r(12,18.2,7,1.5,0).replace(/.*/,''));
icon('Atom','Education','science physics',ic_c(12,12,2),ic_ring(12,12,10,1.2).replace(/.*/,''),'M12 6.5C16.4 6.5 21 8.8 21 12S16.4 17.5 12 17.5S3 15.2 3 12S7.6 6.5 12 6.5ZM12 8.4C8 8.4 5 10.4 5 12S8 15.6 12 15.6S19 13.6 19 12S16 8.4 12 8.4Z');
icon('Flask','Education','chemistry lab','M9 2H15V4H14V9L19.5 19A2 2 0 0 1 17.8 22H6.2A2 2 0 0 1 4.5 19L10 9V4H9Z'+ic_c(11,16.5,1)+ic_c(14.2,18.5,.8));
icon('Globe stand','Education','geography',ic_ring(12,10,8,1.8),'M12 18V21H8V22.5H16V21H12ZM12 4C14 6 14 14 12 16C10 14 10 6 12 4Z'.replace(/.*/,m=>''),ic_r(2,9.1,20,1.8).replace(/.*/,''));
icon('Calculator','Education','math',ic_r(4,2,16,20,2.5)+ic_r(6.5,4.5,11,4.5,.8),ic_r(6.5,11,3,2.4,.6),ic_r(10.5,11,3,2.4,.6),ic_r(14.5,11,3,2.4,.6),ic_r(6.5,15,3,2.4,.6),ic_r(10.5,15,3,2.4,.6),ic_r(14.5,15,3,6.4,.6));
/* ---- health & fitness ---- */
icon('Medical cross','Health','hospital doctor','M9 3H15V9H21V15H15V21H9V15H3V9H9Z');
icon('Heartbeat','Health','pulse ecg','M12 21.5C3.5 15 2 9.5 4.8 6C7.2 3.2 11 3.8 12 6.5C13 3.8 16.8 3.2 19.2 6C22 9.5 20.5 15 12 21.5Z'.replace(/.*/,'M12 21.5C3.5 15 2 9.5 4.8 6C7.2 3.2 11 3.8 12 6.5C13 3.8 16.8 3.2 19.2 6C22 9.5 20.5 15 12 21.5ZM3 11.5H8L9.5 8.5L12 14.5L13.8 11.5H21V12.7H14.5L12 17L9.5 11.5L8.7 12.7H3Z'.replace(/ZM3[\s\S]*/,'Z')),ic_pl([[2.5,12],[8,12],[9.7,8.5],[12.3,15],[14.2,12],[21.5,12]],1.6).replace(/.*/,''));
icon('Pill','Health','medicine','M7.5 2.5A5 5 0 0 1 14.6 3.4L20.6 9.4A5 5 0 0 1 13.5 16.5L7.5 10.5A5 5 0 0 1 7.5 2.5Z'.replace(/.*/,'M10 2A5.5 5.5 0 0 1 14 3.6L20.4 10A5.5 5.5 0 0 1 12.6 17.8L6.2 11.4A5.5 5.5 0 0 1 10 2ZM9.9 4.6A3 3 0 0 0 8 9.7L9.8 11.5L13 8.3L11.5 6.2Z'));
icon('Dumbbell','Fitness','gym weight',ic_r(1.5,8.5,3,7,1),ic_r(4.5,6,3,12,1),ic_r(7.5,10.8,9,2.4),ic_r(16.5,6,3,12,1),ic_r(19.5,8.5,3,7,1));
icon('Running','Fitness','sport',ic_c(14.5,4.5,2.3),'M9 21L12 15L9.5 12.5L8 16L5 15.5L7 9.5L12 8L15 11.5L19 12.5L18.5 14.5L14 13.8L15.5 16.8L19 21L17 22L13 18Z'.replace(/.*/,'M10.5 8.5L14 7.5L16.5 11L19.5 11.8L19 14L15.2 13.2L14.2 12.4L15.3 15.8L18.5 20.3L16.7 21.5L13.5 17.2L12.3 14L9.6 20.5L7.5 19.7L10 12L8 13.3L7 16L5 15.4L6 11.5L10.5 8.5Z'));
icon('Yoga','Fitness','meditate',ic_c(12,5,2.4),'M12 8.5L16 10.5L21 9.5V11.5L16.5 13L18.5 17H22V19H6V17H8.5L7.5 13L3 11.5V9.5L8 10.5Z'.replace(/.*/,'M12 8.2C14 8.2 15.5 9 17.5 9.2L21.5 8.6L21.8 10.5L17.5 11.6L19.5 15.6L22 17.3L21 19L12 19L3 19L2 17.3L4.5 15.6L6.5 11.6L2.2 10.5L2.5 8.6L6.5 9.2C8.5 9 10 8.2 12 8.2Z'));
icon('Apple','Health','fruit diet','M12 7C10.5 5.5 6 5.5 4.5 9.5C3 13.5 5.5 20 8.5 21C10 21.5 11 20.8 12 20.8S14 21.5 15.5 21C18.5 20 21 13.5 19.5 9.5C18 5.5 13.5 5.5 12 7ZM12 6.5C12 4.5 13 2.8 15 2C15 4 14 5.8 12 6.5Z');
icon('Water drop','Health','hydration','M12 2C12 2 5 10 5 15A7 7 0 0 0 19 15C19 10 12 2 12 2Z');
/* ---- food ---- */
icon('Coffee','Food','cup tea cafe','M3 7H17V15A5 5 0 0 1 12 20H8A5 5 0 0 1 3 15ZM17 8.5H18.5A3 3 0 0 1 18.5 14.5H17V12.8H18.5A1.3 1.3 0 0 0 18.5 10.2H17ZM6 2.5H8V5H6ZM10 2.5H12V5H10ZM14 2.5H16V5H14Z');
icon('Pizza','Food','slice','M2.5 7.2C9 2.8 15 2.8 21.5 7.2L12 22ZM5 8.8L12 19.5L19 8.8C14 5.8 10 5.8 5 8.8Z'.replace(/.*/,'M2.5 7.2C9 2.8 15 2.8 21.5 7.2L12 22Z')+ic_c(9,9,1.5)+ic_c(15,9.2,1.5)+ic_c(12,14,1.5));
icon('Burger','Food','fast food','M3 10A9 7 0 0 1 21 10ZM3 12H21V14H3ZM4 15.5H20V17.5A3 3 0 0 1 17 20.5H7A3 3 0 0 1 4 17.5Z'.replace(/.*/,'M3 10.5C3 6 7 3.5 12 3.5S21 6 21 10.5ZM2.5 12.3H21.5V14.2H2.5ZM3.5 15.6H20.5V17A3.5 3.5 0 0 1 17 20.5H7A3.5 3.5 0 0 1 3.5 17Z'));
icon('Cake','Food','birthday dessert','M11 3H13V6H11ZM12 2C12.8 3 12.8 3.8 12 4.4C11.2 3.8 11.2 3 12 2ZM4 9H20V13A3 3 0 0 0 17 11.5A3 3 0 0 0 14 13A3 3 0 0 0 11 13A3 3 0 0 0 8 13A3 3 0 0 0 5 11.5A3 3 0 0 0 4 13ZM4 14.5A4.6 4.6 0 0 0 7 13.2A4.5 4.5 0 0 0 12 14.8A4.5 4.5 0 0 0 17 13.2A4.6 4.6 0 0 0 20 14.5V21H4Z'.replace(/.*/,'M11 3H13V7H11ZM12 1.5C13 2.6 13 3.4 12 4.3C11 3.4 11 2.6 12 1.5ZM5 8H19A2 2 0 0 1 21 10V13C19.5 13 19.5 14.5 18 14.5S16.5 13 15 13S13.5 14.5 12 14.5S10.5 13 9 13S7.5 14.5 6 14.5S4.5 13 3 13V10A2 2 0 0 1 5 8ZM3 15.5C4.5 15.5 4.5 17 6 17S7.5 15.5 9 15.5S10.5 17 12 17S13.5 15.5 15 15.5S16.5 17 18 17S19.5 15.5 21 15.5V20A1 1 0 0 1 20 21H4A1 1 0 0 1 3 20Z'));
icon('Fork & knife','Food','restaurant dining',ic_r(5,2,1.6,8),ic_r(8.2,2,1.6,8),ic_r(11.4,2,1.6,8),'M5 10H13A2 2 0 0 1 11 12.6V22H7V12.6A2 2 0 0 1 5 10Z','M17 2C19.5 3.5 20 8 19 12H18V22H16V2Z'.replace(/.*/,'M18.5 2C20.8 4 21 9 19.5 12.5V22H17V12.5H15.5V3A1 1 0 0 1 16.5 2Z'));
icon('Ice cream','Food','dessert sweet','M12 22L6.5 11H17.5ZM12 2A5.5 5.5 0 0 1 17.5 7.5A3 3 0 0 1 18 11.2C18 11.2 6 11.2 6 11.2A3 3 0 0 1 6.5 7.5A5.5 5.5 0 0 1 12 2Z'.replace(/.*/,'M12 22.5L6.8 11.8H17.2ZM12 2A5.4 5.4 0 0 1 17.3 6.6A3.2 3.2 0 0 1 17.2 10.2H6.8A3.2 3.2 0 0 1 6.7 6.6A5.4 5.4 0 0 1 12 2Z'));
icon('Wine glass','Food','drink party','M7 2H17V9A5 5 0 0 1 13 13.9V20H16V22H8V20H11V13.9A5 5 0 0 1 7 9Z');
icon('Leaf','Nature','eco organic plant','M20.5 3.5C20.5 11 17 18 9 19.5C7 19.8 5.5 18.8 5 17.5L3 21.5L2 21C3.2 18.5 4 16 4.8 14C4 11 7 6 11 5C14 4.3 17 4.5 20.5 3.5Z');
/* ---- nature & weather ---- */
icon('Sun','Nature','day weather',ic_c(12,12,4.8),...[0,1,2,3,4,5,6,7].map(i=>{const a=i*Math.PI/4,x1=12+Math.cos(a)*7.8,y1=12+Math.sin(a)*7.8,x2=12+Math.cos(a)*10.6,y2=12+Math.sin(a)*10.6;return ic_ln(+x1.toFixed(2),+y1.toFixed(2),+x2.toFixed(2),+y2.toFixed(2),1.9)}));
icon('Moon','Nature','night sleep','M20.5 14.5A9 9 0 1 1 9.5 3.5A7 7 0 0 0 20.5 14.5Z');
icon('Cloud','Nature','weather sky','M7 19A5 5 0 0 1 6.2 9.1A6.5 6.5 0 0 1 18.4 8.6A5.2 5.2 0 0 1 17.5 19Z');
icon('Rain','Nature','weather','M7 14A5 5 0 0 1 6.2 4.1A6.5 6.5 0 0 1 18.4 3.6A5.2 5.2 0 0 1 17.5 14ZM7.5 16L6 20L8 20L9.5 16ZM12 16L10.5 20L12.5 20L14 16ZM16.5 16L15 20L17 20L18.5 16Z');
icon('Snowflake','Nature','winter',ic_ln(12,2,12,22,1.8),ic_ln(3.3,7,20.7,17,1.8),ic_ln(3.3,17,20.7,7,1.8));
icon('Tree','Nature','forest','M12 2L18 10H15L19.5 16H13V22H11V16H4.5L9 10H6Z');
icon('Flower','Nature','bloom spring',ic_st(12,12,10.2,5,8,-90),ic_c(12,12,2.6));
icon('Mountain','Nature','hill travel','M1 20L9 6L13.5 13.5L16 10L23 20Z');
icon('Wave','Nature','sea water','M2 9C5 5 8 5 11 9C14 13 17 13 22 8V12C17 17 14 17 11 13C8 9 5 9 2 13ZM2 16C5 12 8 12 11 16C14 20 17 20 22 15V19C17 24 14 24 11 20C8 16 5 16 2 20Z'.replace(/22 19C17 24[\s\S]*/,'22 19C17 23 14 23 11 19C8 15 5 15 2 19Z'));
icon('Paw','Nature','pet animal',ic_c(6,10,2.2),ic_c(10,5.8,2.2),ic_c(14,5.8,2.2),ic_c(18,10,2.2),'M12 11C15 11 18 15 17 18C16.5 19.8 14.5 19.5 12 19.5S7.5 19.8 7 18C6 15 9 11 12 11Z');
icon('Butterfly','Nature','insect','M12 6L13 4M12 6L11 4M12 6V19M11 7C7 2 2 4 3 9C3.5 11.5 6 12.5 8 12.5C5 13.5 4.5 17 7 18.5C9 19.5 11 17 11 14Z'.replace(/.*/,'M12 6.5C13.8 1.5 21 2.5 21.5 8C21.8 11 19.5 12.2 17.8 12.5C20.5 13.5 20.2 17.8 17.2 18.8C14.5 19.6 12.5 17.5 12.5 14.5V8ZM11.5 8V14.5C11.5 17.5 9.5 19.6 6.8 18.8C3.8 17.8 3.5 13.5 6.2 12.5C4.5 12.2 2.2 11 2.5 8C3 2.5 10.2 1.5 11.5 6.5Z'));
/* ---- travel & places ---- */
icon('Plane','Travel','flight airport','M21.5 3.5C22 2.5 21 1.8 20 2.5L15.5 6.5L5.5 4.5L4 6L11 9.5L7.5 13.5L4 13L3 14L6.5 16L8.5 19.5L9.5 18.5L9 15L13 11.5L16.5 18.5L18 17L16 7.5Z'.replace(/.*/,'M21 3C21 3 22 2 21 1.5C20 1 18.5 2 17 3.5L13 7.5L4 5.5L2.5 7L9 11L6 14L3.5 13.5L2.5 14.5L6 17L9.5 20.5L10.5 19.5L10 17L13 14L17 20.5L18.5 19L16.5 10L20 6.5C20.5 5.5 21 4 21 3Z'));
icon('Car','Transport','vehicle drive','M4 9L6 4.5H18L20 9H21.5V17H19V19.5H16.5V17H7.5V19.5H5V17H2.5V9ZM7.2 6.5L6.2 9H17.8L16.8 6.5Z'+ic_c(7,13,1.4)+ic_c(17,13,1.4));
icon('Bus','Transport','public',ic_r(4,3,16,16,3)+ic_r(6,5,12,6,.8)+ic_c(8,15,1.2)+ic_c(16,15,1.2),ic_r(5,19.5,3,2.5),ic_r(16,19.5,3,2.5));
icon('Train','Transport','metro rail',ic_r(5,2,14,16,3)+ic_r(7,5,10,5,.8)+ic_c(8.8,14,1.2)+ic_c(15.2,14,1.2),ic_ln(7,22,9.5,18.5,1.8),ic_ln(17,22,14.5,18.5,1.8));
icon('Ship','Transport','boat cruise','M3 14L12 17L21 14L19 20H5ZM11 2H13V5H17V12L12 13.5L7 12V5H11Z'.replace(/.*/,'M11 2H13V4.5H17.5V12.2L12 14L6.5 12.2V4.5H11ZM3 15L12 18L21 15L19 21H5Z'));
icon('Bicycle','Transport','cycle',ic_ring(6,16,4.5,1.6),ic_ring(18,16,4.5,1.6),ic_pl([[6,16],[10,8],[16,8],[18,16]],1.4),ic_ln(10,8,9,5.5,1.6),ic_ln(15.5,8,16,5.5,1.6).replace(/.*/,''));
icon('Fuel','Transport','petrol pump',ic_r(3,3,11,18,1.5)+ic_r(5,5.5,7,4,.5),'M15 8H17.5A1.5 1.5 0 0 1 19 9.5V17A1.2 1.2 0 0 0 21 17V8L18.5 5.5L19.8 4.2L22.5 7V17A3 3 0 0 1 16.5 17V9.8H15Z');
icon('Compass','Travel','navigate direction',ic_ring(12,12,10,1.8),'M16.5 7.5L13.5 13.5L7.5 16.5L10.5 10.5Z');
icon('Map','Travel','navigation','M3 5L9 3L15 5L21 3V19L15 21L9 19L3 21ZM9.8 5.3V17.4L8.2 17V4.8ZM15.8 6.6V18.8L14.2 18.4V6.2Z'.replace(/.*/,'M3 5.5L9 3.5L15 5.5L21 3.5V18.5L15 20.5L9 18.5L3 20.5ZM8.2 5.4L4.8 6.6V17.9L8.2 16.8ZM9.8 5.4V16.8L14.2 18.2V6.8ZM15.8 6.8V18.2L19.2 17.1V5.9Z'.replace(/M8\.2[\s\S]*/,'')));
icon('Hotel bed','Travel','stay sleep','M2 6H4V13H22V19H20V16H4V19H2ZM6 8H11A2.5 2.5 0 0 1 13.5 10.5V12H6ZM14 10H19A3 3 0 0 1 22 13H14Z'.replace(/.*/,'M2 5H4V13H22V19H20V16H4V19H2ZM6 8.5H11.5A2.5 2.5 0 0 1 14 11V12H6Z'));
icon('Tent','Travel','camp outdoor','M12 3L22 20H2ZM12 8L6 18H10L12 14.5L14 18H18Z'.replace(/.*/,'M12 3L23 20H1ZM12 9L6.5 18H9.7L12 14.2L14.3 18H17.5Z'));
icon('Luggage','Travel','suitcase bag',ic_r(5,6,14,15,2.5)+ic_r(8.5,9,2,9,1)+ic_r(13.5,9,2,9,1),'M9 6V4A1.5 1.5 0 0 1 10.5 2.5H13.5A1.5 1.5 0 0 1 15 4V6H13.3V4.2H10.7V6Z');
icon('Passport','Travel','document id',ic_r(4,2,16,20,2)+ic_ring(12,10,4.2,1.4),ic_r(8,16.5,8,1.5,.7));
/* ---- tech ---- */
icon('Laptop','Tech','computer device',ic_r(4,4,16,11,1.5)+ic_r(5.8,5.8,12.4,7.4,.3),'M1.5 16.5H22.5L21.5 19A1.5 1.5 0 0 1 20 20H4A1.5 1.5 0 0 1 2.5 19Z');
icon('Monitor','Tech','desktop screen',ic_r(2,3,20,14,2)+ic_r(4,5,16,10,.5),ic_r(10.5,17,3,3),ic_r(7,20,10,1.8,.9));
icon('Tablet','Tech','ipad device',ic_r(4,2,16,20,2.5)+ic_r(6,4.5,12,13.5,.5),ic_c(12,20,.9));
icon('Code','Tech','developer programming','M8.5 6L10 7.7L5.7 12L10 16.3L8.5 18L2.5 12ZM15.5 6L21.5 12L15.5 18L14 16.3L18.3 12L14 7.7Z');
icon('Terminal','Tech','command console',ic_r(2,4,20,16,2.5)+ic_r(3.8,5.8,16.4,12.4,.5),'M6 8.5L10 12L6 15.5L7.2 16.7L12 12L7.2 7.3Z'.replace(/.*/,'M6 8L10.2 11.5L6 15L6.8 16.2L12 11.5L6.8 6.8Z'.replace(/.*/,'M6 8L10 11L6 14L6.8 15.2L12 11L6.8 6.8Z')),ic_r(12.5,14.5,5,1.4,.5));
icon('Database','Tech','server storage','M12 2C7 2 3.5 3.5 3.5 5.5V18.5C3.5 20.5 7 22 12 22S20.5 20.5 20.5 18.5V5.5C20.5 3.5 17 2 12 2ZM12 4C15.8 4 18.3 4.8 18.3 5.5S15.8 7 12 7S5.7 6.2 5.7 5.5S8.2 4 12 4ZM18.3 18.5C18.3 19.2 15.8 20 12 20S5.7 19.2 5.7 18.5V16.5C7 17.4 9.3 18 12 18S17 17.4 18.3 16.5ZM18.3 14.5C18.3 15.2 15.8 16 12 16S5.7 15.2 5.7 14.5V12.5C7 13.4 9.3 14 12 14S17 13.4 18.3 12.5ZM18.3 10.5C18.3 11.2 15.8 12 12 12S5.7 11.2 5.7 10.5V8.5C7 9.4 9.3 10 12 10S17 9.4 18.3 8.5Z');
icon('Cloud upload','Tech','sync backup','M7 19A5 5 0 0 1 6.2 9.1A6.5 6.5 0 0 1 18.4 8.6A5.2 5.2 0 0 1 17.5 19H13V13H15.5L12 9L8.5 13H11V19Z'.replace(/.*/,'M7 19A5 5 0 0 1 6.2 9.1A6.5 6.5 0 0 1 18.4 8.6A5.2 5.2 0 0 1 17.5 19H13.2V13.5H16L12 9L8 13.5H10.8V19Z'));
icon('Chip','Tech','cpu processor ai',ic_r(6,6,12,12,1.5)+ic_r(9,9,6,6,.5),...[8,11,14].flatMap(v=>[ic_r(v,2.5,2,3),ic_r(v,18.5,2,3),ic_r(2.5,v,3,2),ic_r(18.5,v,3,2)]));
icon('Robot','Tech','ai bot assistant',ic_r(4,7,16,13,3)+ic_c(9,13,1.8)+ic_c(15,13,1.8),ic_r(11,3.5,2,3.5),ic_c(12,3,1.5),ic_r(1.5,11,2,5,1),ic_r(20.5,11,2,5,1));
icon('Brain','Tech','ai mind think','M9 3A3.5 3.5 0 0 0 6 6A3.5 3.5 0 0 0 3.5 9.5A3.3 3.3 0 0 0 4.5 12.5A3.5 3.5 0 0 0 7 17.5A3.5 3.5 0 0 0 11 20.5V3.8A2.5 2.5 0 0 0 9 3ZM15 3A2.5 2.5 0 0 0 13 3.8V20.5A3.5 3.5 0 0 0 17 17.5A3.5 3.5 0 0 0 19.5 12.5A3.3 3.3 0 0 0 20.5 9.5A3.5 3.5 0 0 0 18 6A3.5 3.5 0 0 0 15 3Z');
icon('Wrench','Tech','tools settings repair','M21.5 7A5.5 5.5 0 0 1 14.5 12.6L5.8 21.3A2 2 0 0 1 3 18.5L11.7 9.8A5.5 5.5 0 0 1 17.2 2.5L14.2 5.5L15 9L18.5 9.8Z'.replace(/.*/,'M21.7 6.2L18.5 9.4L15.4 8.6L14.6 5.5L17.8 2.3A5.5 5.5 0 0 0 11.2 9.2L2.8 17.6A2.1 2.1 0 0 0 5.8 20.6L14.2 12.2A5.5 5.5 0 0 0 21.7 6.2Z'));
icon('Plug','Tech','power electric',ic_r(8.5,2,2,5),ic_r(13.5,2,2,5),'M6 7H18V12A6 6 0 0 1 13 17.9V22H11V17.9A6 6 0 0 1 6 12Z');
icon('Battery','Tech','charge',ic_r(2,7,18,10,2)+ic_r(4,9,14,6,.4),ic_r(20.5,10,1.8,4,.8),ic_r(4.5,9.5,8,5,.4).replace(/.*/,''));
icon('Shield check','Tech','secure verified','M12 2L20 5V11C20 16 16.5 20 12 22C7.5 20 4 16 4 11V5Z'.replace(/.*/,'M12 2L20 5V11C20 16 16.5 20 12 22C7.5 20 4 16 4 11V5ZM10.5 14.8L17 8.3L15.8 7.1L10.5 12.4L8.2 10.1L7 11.3Z'));
icon('Key','Tech','access login',ic_ring(8,12,5.5,2.4),'M13 11H22V15H20V13H18V15H16V13H13Z');
icon('Fingerprint','Tech','biometric',ic_ring(12,12,10,1.6),ic_ring(12,12,6.5,1.6),ic_c(12,12,2));
icon('Bug','Tech','debug','M12 7A4 4 0 0 1 16 11V15A4 4 0 0 1 8 15V11A4 4 0 0 1 12 7ZM9 5A3 3 0 0 1 15 5ZM2 10L5 11.2L4.8 13L2 12ZM22 10L19 11.2L19.2 13L22 12ZM2 17L5.3 15.5L5.6 17.3L2.4 19ZM22 17L18.7 15.5L18.4 17.3L21.6 19Z');
/* ---- home & objects ---- */
icon('Couch','Home','sofa furniture',ic_r(4,8,16,6,2.5),ic_r(1.5,10,3.5,8,1.5),ic_r(19,10,3.5,8,1.5),ic_r(5,14,14,4,1),ic_ln(5,18,5,20,1.6),ic_ln(19,18,19,20,1.6));
icon('Lamp','Home','light decor','M8 2H16L19 11H5ZM11 11H13V19H16V21H8V19H11Z');
icon('Key home','Home','property house rent','M12 3L22 12H19V20H5V12H2Z'+ic_c(12,13.5,2.2));
icon('Door','Home','entry',ic_r(5,2,14,20,1)+ic_r(7,4,10,16,.3),ic_c(14.5,12,1.1));
icon('Bathtub','Home','bath','M4 11V6A2.5 2.5 0 0 1 9 6H7.5A.7.7 0 0 0 6 6V11H22V14A5 5 0 0 1 17 19L18 21H16L15 19H9L8 21H6L7 19A5 5 0 0 1 2 14V11Z'.replace(/.*/,'M4 11V6A2.5 2.5 0 0 1 9 6H7.2A.7.7 0 0 0 5.8 6V11H22V14A5 5 0 0 1 17 19L18 21.5H16L15 19H9L8 21.5H6L7 19A5 5 0 0 1 2 14V11Z'));
icon('Scissors','Fashion','cut salon barber',ic_ring(6,6,3.2,1.6),ic_ring(6,18,3.2,1.6),'M8 8L22 19L21 21L5 9ZM8 16L22 5L21 3L5 15Z'.replace(/.*/,'M7.5 8.2L21.5 18.2L20.4 19.7L6.4 9.7ZM7.5 15.8L21.5 5.8L20.4 4.3L6.4 14.3Z'));
icon('Shirt','Fashion','clothing tshirt','M8 3L3 6L5.5 11L8 10V21H16V10L18.5 11L21 6L16 3C16 5 14.2 6 12 6S8 5 8 3Z');
icon('Diamond','Fashion','jewellery gem','M7 3H17L22 9L12 22L2 9Z'.replace(/.*/,'M7 3H17L22 9L12 22L2 9ZM9 9L12 17L15 9ZM6.3 5.2L4.3 8H8.2L9.3 5.2ZM17.7 5.2L14.7 5.2L15.8 8H19.7Z'.replace(/ZM6\.3[\s\S]*/,'Z')));
icon('Ring','Fashion','wedding engagement',ic_ring(12,15,6.5,2.2),ic_p([[9,5.5],[15,5.5],[17,3],[7,3]]),ic_p([[9,5.5],[12,8.2],[15,5.5]]).replace(/.*/,''));
icon('Dress','Fashion','woman gown','M9 2H15L14.5 8L18 21H6L9.5 8Z');
icon('Glasses','Fashion','spectacles',ic_ring(6.5,14,4.5,1.8),ic_ring(17.5,14,4.5,1.8),ic_r(10.5,12.5,3,1.7,.8),ic_ln(2,12,2.5,10,1.5).replace(/.*/,''));
icon('Palette','Creative','paint art design','M12 2A10 10 0 0 0 2 12A10 10 0 0 0 12 22A2.5 2.5 0 0 0 14 18.5C14 17 15 16.5 16.5 16.5H18A4 4 0 0 0 22 12.5A10.5 10.5 0 0 0 12 2ZM6.5 12.5A1.5 1.5 0 1 1 6.5 9.5A1.5 1.5 0 0 1 6.5 12.5Z'.replace(/.*/,'M12 2A10 10 0 0 0 2 12A10 10 0 0 0 12 22C13.4 22 14.2 21 14.2 19.8C14.2 18.5 13 18 13 17C13 16 14 15.5 15 15.5H17.5A4.5 4.5 0 0 0 22 11C22 6 17.5 2 12 2Z')+ic_c(6.8,11.5,1.6)+ic_c(9.5,7,1.6)+ic_c(15,7,1.6)+ic_c(18,10.6,1.6));
icon('Brush','Creative','paint','M20.5 2.5L21.5 3.5C22 4 22 4.8 21.5 5.3L12 15L9 12L18.7 2.5C19.2 2 20 2 20.5 2.5ZM8 13L11 16C11 19 9 21.5 4 21.5C3 21.5 2.5 20.8 3.2 20C4 19 3.8 18 4.2 16C4.8 14.5 6.5 13 8 13Z');
icon('Pen tool','Creative','vector design','M12 2L18 9L16 17H8L6 9ZM10 17H14V19.5H10ZM12 11A1.5 1.5 0 1 0 12 14A1.5 1.5 0 0 0 12 11Z'.replace(/.*/,'M12 2L19 9L16.5 17.5H7.5L5 9ZM11 18.5H13V22H11ZM12 9.5A1.8 1.8 0 1 0 12 13.1A1.8 1.8 0 0 0 12 9.5Z'));
icon('Layers','Creative','stack','M12 2L22 7.5L12 13L2 7.5ZM3.8 11L12 15.5L20.2 11L22 12L12 17.5L2 12ZM3.8 15.5L12 20L20.2 15.5L22 16.5L12 22L2 16.5Z');
icon('Crop','Creative','trim','M7 2H9V7H20V9H9V18H7V9H2V7H7ZM15 15H17V9.5H15ZM11 15H15V17H17V22H15V17H11Z'.replace(/.*/,'M7 2H9V7H19A1 1 0 0 1 20 8V18H18V9H9V18H7V9H2V7H7ZM15 15H17V22H15V17H9V15Z'.replace(/M7 2[\s\S]*/,'M7 2H9V7H20V9H9V16H7V9H2V7H7ZM11 17H15V15H17V17H22V19H17V22H15V19H9V17Z'.replace(/M7 2[\s\S]*/,'M7 2H9V16H22V18H9V22H7V18H2V16H7V9H2V7H7ZM11 7H22V9H11Z'.replace(/.*/,'M7 2H9V16H22V18H9V22H7V18H2V16H7V9H2V7H7ZM11 7H17V16H15V9H11Z')))));
icon('Type','Creative','text font typography','M3 5H21V8H19V7H13V19H15V21H9V19H11V7H5V8H3Z');
icon('Magic wand','Creative','magic ai',ic_ln(4,20,14,10,2.6),ic_st(17.5,6.5,4.5,1.4,4),ic_st(6,6,2.3,.8,4),ic_st(19,16.5,2,.7,4));
icon('Eyedropper','Creative','color picker','M20.5 3.5A2.8 2.8 0 0 0 16.5 3.5L13.5 6.5L12.5 5.5L11 7L17 13L18.5 11.5L17.5 10.5L20.5 7.5A2.8 2.8 0 0 0 20.5 3.5ZM11 9L4 16V20H8L15 13Z');
icon('Ruler','Creative','measure',ic_r(2,7,20,10,1.5)+ic_r(5,10,1.3,4)+ic_r(8.7,10,1.3,2.6)+ic_r(12.4,10,1.3,4)+ic_r(16.1,10,1.3,2.6)+ic_r(19.8,10,1.3,4));
/* ---- festival & culture ---- */
icon('Om','Festival','hindu sacred spiritual','M7.5 5C5 5 3.3 6.7 3.3 9C3.3 10.7 4.4 11.9 6 12C4.2 12.4 3 13.9 3 15.8C3 18.2 5 20 8 20C10.8 20 12.7 18.6 12.7 16.2C12.7 14.6 11.6 13.6 10.4 13.2C11.3 12.5 11.8 11.7 11.8 10.5C11.8 8.6 10.5 7.6 8.5 7.6C7.7 7.6 7.1 7.8 6.6 8.1C6.9 7.2 7.6 6.8 8.4 6.8C9.5 6.8 10.4 7.3 11.2 8.5L12.4 7.8C11.5 6 9.8 5 7.5 5ZM15.5 4.5A2 2 0 0 0 15.5 8.5A2 2 0 0 0 17.2 5.5C17.5 5.3 17.9 5.2 18.3 5.2C19.2 5.2 19.8 5.7 19.8 6.4C19.8 7.2 19.2 7.8 18.3 8.4L14 11.5C12.6 12.5 12.2 13.5 12.2 15C12.2 17.3 13.8 19.5 16.8 19.5C19.8 19.5 21.5 17.5 21.5 15L19.9 14.6C19.9 16.3 18.8 17.7 16.8 17.7C15 17.7 14 16.4 14 15C14 14.2 14.3 13.7 15.2 13.1L19.4 10.1C20.8 9.1 21.6 8.1 21.6 6.6C21.6 4.7 20.1 3.3 18.1 3.3C16.9 3.3 16 3.8 15.5 4.5Z');
icon('Diya','Festival','lamp diwali light','M12 1.5C13.5 3.5 14.5 4.8 14.5 6.3A2.5 2.5 0 0 1 9.5 6.3C9.5 4.8 10.5 3.5 12 1.5ZM2 12H22C22 17 18 21 12 21S2 17 2 12Z');
icon('Lantern','Festival','akash kandil','M10 2H14V4H10ZM7 4H17C19 7 19 15 17 18H7C5 15 5 7 7 4ZM9 18.5H15V20H9ZM11 20.5H13V22H11Z'.replace(/.*/,'M10.5 1.5H13.5V3.5H10.5ZM8 3.5H16C18.5 6.5 18.5 14 16 17H8C5.5 14 5.5 6.5 8 3.5ZM11.2 3.8V16.7H12.8V3.8Z'.replace(/M11\.2[\s\S]*/,'')+'M9.5 17.8H14.5V19.3H9.5ZM11 19.8H13V22H11Z'));
icon('Lotus','Festival','flower padma','M12 3C14.5 6 15.5 9 12 13C8.5 9 9.5 6 12 3ZM5 7C8 7.5 10.5 9.5 10.8 14C7 14.5 4.5 11.5 5 7ZM19 7C19.5 11.5 17 14.5 13.2 14C13.5 9.5 16 7.5 19 7ZM2 12C5 12 8 13.5 9.5 17C6 18.5 2.5 16.5 2 12ZM22 12C21.5 16.5 18 18.5 14.5 17C16 13.5 19 12 22 12ZM6 20H18V21.5H6Z'.replace(/M2 12[\s\S]*/,'M6 19.5H18V21H6Z'));
icon('Kalash','Festival','pot puja coconut','M9 3H15V5H9ZM10 5H14L13 7H11ZM7 8C7 7.5 8 7 12 7S17 7.5 17 8C17 12 20 14 19 17C18.5 19 16 21 12 21S5.5 19 5 17C4 14 7 12 7 8Z'.replace(/.*/,'M12 1.5C14.5 1.5 15.5 3 14.5 4.5C14 5.3 13 5.5 12 5.5S10 5.3 9.5 4.5C8.5 3 9.5 1.5 12 1.5ZM9.8 6.3H14.2V8H9.8ZM8.5 8.5H15.5C15.5 10.5 19 11.5 19 16C19 19.5 16 21.5 12 21.5S5 19.5 5 16C5 11.5 8.5 10.5 8.5 8.5Z'));
icon('Temple','Festival','mandir shrine','M12 2L13 4.5C13.6 4.5 14 5 14 5.6V7H15.5L16 9H8L8.5 7H10V5.6C10 5 10.4 4.5 11 4.5ZM7 9.5H17V11H7ZM6 11.5H18V13H18V20H15V16A3 3 0 0 0 9 16V20H6ZM4 20.5H20V22H4Z'.replace(/.*/,'M12 2L13.2 4.6H14L14.8 7.6H16L17 10.2H7L8 7.6H9.2L10 4.6H10.8ZM6 10.8H18V12.4H6ZM6.5 12.9H17.5V20H15V17A3 3 0 0 0 9 17V20H6.5ZM4 20.5H20V22H4Z'));
icon('Rangoli','Festival','kolam pattern',ic_st(12,12,10.5,4.5,8,-90),ic_st(12,12,6.2,2.8,8,-67.5),ic_c(12,12,1.5));
icon('Firework','Festival','celebration cracker',ic_ln(12,3,12,8,1.8),ic_ln(12,16,12,21,1.8),ic_ln(3,12,8,12,1.8),ic_ln(16,12,21,12,1.8),ic_ln(5.5,5.5,8.7,8.7,1.8),ic_ln(15.3,15.3,18.5,18.5,1.8),ic_ln(18.5,5.5,15.3,8.7,1.8),ic_ln(8.7,15.3,5.5,18.5,1.8),ic_c(12,12,1.6));
icon('Balloon','Festival','party birthday','M12 2A6.5 6.5 0 0 1 18.5 8.5C18.5 12.5 15 16 12 17C9 16 5.5 12.5 5.5 8.5A6.5 6.5 0 0 1 12 2ZM11 17H13L13.8 19H10.2ZM12 19.5C11 20.5 13 21 12 22',ic_pl([[12,19],[11,20.5],[13,21.5],[12,23]],.7));
icon('Party popper','Festival','celebrate confetti','M3 21L7.5 8L16 16.5ZM14 3.5H15.8V6H14ZM19 7L20.5 5.8L22 7.6L20.5 8.8ZM17.5 11H20V12.8H17.5ZM10 3L11.5 4.5L10 6L8.5 4.5Z');
icon('Gift box','Festival','present',ic_r(3,9,18,4,1)+'',ic_r(4.5,13.5,15,7.5,1),ic_ln(12,9,12,13,2).replace(/.*/,''),'M12 9C10 5 6 5 6 7.5C6 9.5 9 9 12 9ZM12 9C14 5 18 5 18 7.5C18 9.5 15 9 12 9Z');
icon('Bell temple','Festival','ghanta puja','M12 3C8 3 5 7 5 12V17H19V12C19 7 16 3 12 3ZM10.5 18H13.5A1.5 1.5 0 0 1 10.5 18ZM12 18.5A1.8 1.8 0 1 0 12 22A1.8 1.8 0 0 0 12 18.5Z'.replace(/.*/,'M12 2.5C8.3 2.5 5.5 6.2 5.5 11V16.5H18.5V11C18.5 6.2 15.7 2.5 12 2.5ZM12 18.3A2 2 0 1 0 12 22.3A2 2 0 0 0 12 18.3Z'));
icon('Moon star','Festival','eid ramadan crescent','M17 3.5A9 9 0 1 0 20.5 17A7.5 7.5 0 0 1 17 3.5Z'.replace(/.*/,'M15.5 3A9.5 9.5 0 1 0 21 18A7.7 7.7 0 0 1 15.5 3Z')+ic_st(18.5,7.5,3,1.2,5));
icon('Mosque','Festival','masjid eid','M12 1.5C12.8 2.6 13.2 3.4 13.2 4.2A1.2 1.2 0 0 1 10.8 4.2C10.8 3.4 11.2 2.6 12 1.5ZM12 6C16 6 18.5 9 18.5 12H5.5C5.5 9 8 6 12 6ZM3 12.5H5V21H3ZM19 12.5H21V21H19ZM6 12.5H18V21H14V17A2 2 0 0 0 10 17V21H6Z'.replace(/.*/,'M12 1.5C12.8 2.6 13.2 3.4 13.2 4.2A1.2 1.2 0 0 1 10.8 4.2C10.8 3.4 11.2 2.6 12 1.5ZM12 6C15.6 6 18 8.6 18.5 11.5H5.5C6 8.6 8.4 6 12 6ZM5.5 12.5H18.5V21H15V17A3 3 0 0 0 9 17V21H5.5ZM2.5 9H4V21H2.5ZM20 9H21.5V21H20Z'));
icon('Christmas tree','Festival','xmas holiday','M12 2L17 9H14.5L19 15.5H15L20 21H4L9 15.5H5L9.5 9H7ZM11 21H13V23H11Z'.replace(/.*/,'M12 1.5L16.5 8.5H14.3L18.5 14.5H15.3L20 20H4L8.7 14.5H5.5L9.7 8.5H7.5ZM10.8 20.5H13.2V22.5H10.8Z'));
icon('Cross church','Festival','christian chapel','M10.5 2H13.5V6H17V9H13.5V22H10.5V9H7V6H10.5Z');
icon('Wheel','Festival','chakra ashoka dharma',ic_ring(12,12,10.5,1.6),ic_c(12,12,2.4),...[0,1,2,3,4,5,6,7].map(i=>{const a=i*Math.PI/4;return ic_ln(+(12+Math.cos(a)*2.5).toFixed(2),+(12+Math.sin(a)*2.5).toFixed(2),+(12+Math.cos(a)*9.2).toFixed(2),+(12+Math.sin(a)*9.2).toFixed(2),1.2)}));
icon('Flag India','Festival','tiranga republic independence',ic_r(4,2,1.8,20,.9),ic_r(5.8,3,15,3.6),ic_r(5.8,6.6,15,3.6).replace(/.*/,''),ic_r(5.8,10.2,15,3.6).replace(/.*/,''),ic_ring(13.3,8.4,1.7,.5).replace(/.*/,''));
ICONS.pop();icon('Flag India','Festival','tiranga republic independence',ic_r(4,2,1.8,20,.9),ic_r(5.8,3,15,3.2),ic_r(5.8,10.4,15,3.2),ic_ring(13.3,8.3,1.8,.5));
const ICON_DROP=['Atom','Heartbeat','Fingerprint','Pencil ruler','Globe stand','Crop','Om','Gift box'];
for(let i=ICONS.length-1;i>=0;i--)if(ICON_DROP.includes(ICONS[i].n))ICONS.splice(i,1);
/* register as shapes */
ICONS.forEach(i=>{i.id='ic_'+i.n.toLowerCase().replace(/[^a-z0-9]+/g,'_');SP[i.id]=i.d});
const ICON_CATS=[...new Set(ICONS.map(i=>i.c))];

/* ---------- more photo frames (masks) and mockups ---------- */
const wv=(n,amp,rot=0,base=50,pts=120)=>{let d='';for(let i=0;i<pts;i++){const a=i/pts*Math.PI*2,r=base*(1-amp+amp*Math.cos(n*a+rot));d+=(i?'L':'M')+(50+Math.cos(a)*r).toFixed(1)+' '+(50+Math.sin(a)*r).toFixed(1)}return d+'Z'};
const FRAMES=[
 ['fr_arch','Arch','M0 100V50A50 50 0 0 1 100 50V100Z'],
 ['fr_arch_down','Arch down','M0 0H100V50A50 50 0 0 1 0 50Z'],
 ['fr_window','Arch window','M8 100V46A42 42 0 0 1 92 46V100Z'],
 ['fr_pill','Rounded big','M30 0H70A30 30 0 0 1 100 30V70A30 30 0 0 1 70 100H30A30 30 0 0 1 0 70V30A30 30 0 0 1 30 0Z'],
 ['fr_capsule','Capsule','M50 0A50 50 0 0 1 100 50V50A50 50 0 0 1 50 100A50 50 0 0 1 0 50A50 50 0 0 1 50 0Z'],
 ['fr_half','Half circle','M0 100A50 50 0 0 1 100 100Z'],
 ['fr_quarter','Quarter circle','M0 100V0A100 100 0 0 1 100 100Z'],
 ['fr_flower','Flower',wv(8,.16)],['fr_flower6','Flower 6',wv(6,.2)],['fr_petal5','Petals',wv(5,.22,-Math.PI/2)],
 ['fr_scallop','Scallop',wv(14,.05)],['fr_scallop2','Scallop 2',wv(22,.035)],['fr_cog','Cog',wv(12,.07).replace(/L/g,'L')],
 ['fr_stamp','Stamp','M0 0H6A4 4 0 0 0 14 0H22A4 4 0 0 0 30 0H38A4 4 0 0 0 46 0H54A4 4 0 0 0 62 0H70A4 4 0 0 0 78 0H86A4 4 0 0 0 94 0H100V6A4 4 0 0 0 100 14V22A4 4 0 0 0 100 30V38A4 4 0 0 0 100 46V54A4 4 0 0 0 100 62V70A4 4 0 0 0 100 78V86A4 4 0 0 0 100 94V100H94A4 4 0 0 0 86 100H78A4 4 0 0 0 70 100H62A4 4 0 0 0 54 100H46A4 4 0 0 0 38 100H30A4 4 0 0 0 22 100H14A4 4 0 0 0 6 100H0V94A4 4 0 0 0 0 86V78A4 4 0 0 0 0 70V62A4 4 0 0 0 0 54V46A4 4 0 0 0 0 38V30A4 4 0 0 0 0 22V14A4 4 0 0 0 0 6Z'],
 ['fr_ticket','Ticket','M0 8A8 8 0 0 0 8 0H92A8 8 0 0 0 100 8V38A9 9 0 0 0 100 62V92A8 8 0 0 0 92 100H8A8 8 0 0 0 0 92V62A9 9 0 0 0 0 38Z'],
 ['fr_tabbed','Tab','M0 12A12 12 0 0 1 12 0H38L50 14H88A12 12 0 0 1 100 26V88A12 12 0 0 1 88 100H12A12 12 0 0 1 0 88Z'],
 ['fr_ribbon','Ribbon','M0 10H100L88 50L100 90H0L12 50Z'],
 ['fr_banner','Banner','M0 0H100V78L50 100L0 78Z'],
 ['fr_shield','Shield','M50 0L96 14V50C96 76 76 92 50 100C24 92 4 76 4 50V14Z'],
 ['fr_drop','Teardrop','M50 0C50 0 100 50 100 68A50 32 0 0 1 0 68C0 50 50 0 50 0Z'.replace(/.*/,'M50 0C70 28 100 46 100 66A50 34 0 0 1 0 66C0 46 30 28 50 0Z')],
 ['fr_leaf','Leaf','M0 100C0 40 40 0 100 0C100 60 60 100 0 100Z'],
 ['fr_wave_b','Wave bottom','M0 0H100V78C88 70 76 70 62 78C48 86 36 86 22 78C14 74 6 72 0 76Z'],
 ['fr_wave_t','Wave top','M0 22C14 14 28 14 42 22C58 30 72 30 100 20V100H0Z'],
 ['fr_slant','Slant','M0 0H100V80L0 100Z'],['fr_slant2','Slant 2','M0 14L100 0V100L0 86Z'],
 ['fr_notch','Notch corner','M0 0H78L100 22V100H0Z'],['fr_cut','Cut corners','M16 0H84L100 16V84L84 100H16L0 84V16Z'],
 ['fr_torn','Torn edge','M0 0H100V90L94 94L88 88L82 95L74 89L66 96L58 90L50 97L42 91L34 96L26 89L18 95L10 89L4 94L0 90Z'],
 ['fr_brush','Brush stroke','M2 30C8 8 30 14 50 8C72 2 94 6 98 26C101 44 96 52 98 70C100 90 80 96 56 92C36 98 12 98 4 84C-2 70 4 48 2 30Z'],
 ['fr_blob3','Blob 3','M50 4C72 2 96 18 96 46C96 74 78 98 50 96C24 96 4 76 4 50C4 26 26 6 50 4Z'.replace(/.*/,'M52 3C78 1 98 22 96 50C94 76 76 99 48 97C22 95 3 74 4 48C5 24 26 5 52 3Z')],
 ['fr_blob4','Blob 4','M30 8C54 -4 90 8 96 38C102 66 80 96 50 96C22 96 -2 76 4 46C8 28 16 16 30 8Z'],
 ['fr_cloud2','Cloud','M26 84A22 22 0 0 1 22 40A28 28 0 0 1 74 30A24 24 0 0 1 80 84Z'],
 ['fr_speech','Speech bubble','M14 0H86A14 14 0 0 1 100 14V62A14 14 0 0 1 86 76H44L20 100V76H14A14 14 0 0 1 0 62V14A14 14 0 0 1 14 0Z'],
 ['fr_tv','TV','M12 0H88A12 12 0 0 1 100 12V76A12 12 0 0 1 88 88H12A12 12 0 0 1 0 76V12A12 12 0 0 1 12 0Z'.replace(/.*/,'M0 0H100V100H0Z').replace(/.*/,'M18 0H82A18 18 0 0 1 100 18V82A18 18 0 0 1 82 100H18A18 18 0 0 1 0 82V18A18 18 0 0 1 18 0Z')],
 ['fr_squircle','Squircle','M50 0C90 0 100 10 100 50C100 90 90 100 50 100C10 100 0 90 0 50C0 10 10 0 50 0Z'],
 ['fr_oval_v','Oval tall','M50 0C80 0 100 22 100 50C100 78 80 100 50 100C20 100 0 78 0 50C0 22 20 0 50 0Z'],
 ['fr_mughal','Mughal arch','M0 100V58C0 36 22 28 36 14C42 8 46 4 50 0C54 4 58 8 64 14C78 28 100 36 100 58V100Z'],
 ['fr_ogee','Ogee arch','M0 100V62C0 40 20 34 32 22C42 12 46 6 50 0C54 6 58 12 68 22C80 34 100 40 100 62V100Z'],
 ['fr_jharokha','Jharokha','M0 100V46C0 34 8 26 18 22C26 18 30 10 34 6C42 6 46 2 50 0C54 2 58 6 66 6C70 10 74 18 82 22C92 26 100 34 100 46V100Z'],
 ['fr_temple','Temple dome','M0 100V56C0 38 14 30 24 24C34 18 40 12 44 6L50 0L56 6C60 12 66 18 76 24C86 30 100 38 100 56V100Z'],
 ['fr_lotus','Lotus frame','M50 4C60 22 62 44 50 70C38 44 40 22 50 4ZM50 4'.replace(/.*/,'M50 2C58 18 64 32 64 46C74 36 86 30 98 30C98 56 84 82 50 98C16 82 2 56 2 30C14 30 26 36 36 46C36 32 42 18 50 2Z')],
 ['fr_paisley','Paisley','M50 0C80 4 100 28 96 58C92 84 68 100 44 96C20 92 6 72 14 52C20 36 36 36 42 46C48 56 40 66 32 62C40 74 56 70 60 56C66 36 52 22 36 24C28 25 22 16 28 10C34 4 42 0 50 0Z'],
 ['fr_octa_star','Star burst','M50 0L60 22L82 12L78 36L100 42L80 56L92 78L68 76L62 100L50 82L38 100L32 76L8 78L20 56L0 42L22 36L18 12L40 22Z'],
 ['fr_hex_h','Hexagon wide','M24 0H76L100 50L76 100H24L0 50Z'],
 ['fr_octagon_t','Octagon','M30 0H70L100 30V70L70 100H30L0 70V30Z'],
 ['fr_cross','Cross','M34 0H66V34H100V66H66V100H34V66H0V34H34Z'],
 ['fr_circle_cut','Circle cut','M50 0A50 50 0 1 1 15 85L50 50Z'.replace(/.*/,'M50 0A50 50 0 1 1 0 50L50 50Z')],
 ['fr_diamond2','Diamond','M50 0L100 50L50 100L0 50Z'],
 ['fr_kite','Kite','M50 0L90 36L50 100L10 36Z'],
 ['fr_bookmark','Bookmark','M10 0H90V100L50 76L10 100Z'],
 ['fr_arrowr','Arrow right','M0 24H60V0L100 50L60 100V76H0Z'],
 ['fr_moon2','Crescent','M70 4A48 48 0 1 0 96 66A38 38 0 0 1 70 4Z'],
 ['fr_heart2','Heart','M50 94C6 64 -4 36 12 16C26 -2 46 4 50 20C54 4 74 -2 88 16C104 36 94 64 50 94Z'],
 ['fr_star8','Star 8',wv(8,.3)],['fr_sun','Sun',wv(16,.12)],
];
FRAMES.forEach(([k,n,d])=>{SP[k]=d});
/* ---- frames that include a border or device around the picture: several layers placed together ---- */
function placeMany(list,name){const g=list.filter(Boolean);const minX=Math.min(...g.map(o=>o.x)),minY=Math.min(...g.map(o=>o.y)),maxX=Math.max(...g.map(o=>o.x+o.w)),maxY=Math.max(...g.map(o=>o.y+o.h));
  const dx=(D.w-(maxX-minX))/2-minX,dy=(D.h-(maxY-minY))/2-minY;g.forEach(o=>{o.x+=dx;o.y+=dy});addObjs(g);if(name)toast(name+' added — drop a photo onto the frame',2600)}
const emptyImg=(x,y,w,h,over={})=>mkImage('',Math.round(w),Math.round(h),Object.assign({x,y,w,h},over));
const MOCKUPS=[
 ['Polaroid',()=>{const w=D.w*.4,h=w*1.22;return [SH('rect',0,0,w,h,'#ffffff',{shadow:{on:true,c:'rgba(0,0,0,.28)',b:w*.06,x:0,y:w*.03}}),emptyImg(w*.06,w*.06,w*.88,w*.88)]}],
 ['Photo with border',()=>{const w=D.w*.42;return [SH('rect',0,0,w,w*.8,'#ffffff',{shadow:{on:true,c:'rgba(0,0,0,.25)',b:w*.05,x:0,y:w*.02}}),emptyImg(w*.04,w*.04,w*.92,w*.72)]}],
 ['Film strip',()=>{const w=D.w*.7,h=w*.34,u=h/20,o=[SH('rect',0,0,w,h,'#161616',{r:u})];const n=Math.floor(w/(u*2.4));for(let i=0;i<n;i++){o.push(SH('rect',u*.9+i*u*2.4,u*1.2,u*1.3,u*1.9,'#f3f3f3',{r:u*.3}),SH('rect',u*.9+i*u*2.4,h-u*3.1,u*1.3,u*1.9,'#f3f3f3',{r:u*.3}))}const fw=(w-u*3)/3;for(let i=0;i<3;i++)o.push(emptyImg(u*.75+i*(fw+u*.75),u*4.4,fw,h-u*8.8));return o}],
 ['Phone',()=>{const h=D.h*.62,w=h*.49,o=[SH('rect',0,0,w,h,'#111418',{r:w*.14,shadow:{on:true,c:'rgba(0,0,0,.3)',b:w*.08,x:0,y:w*.04}}),emptyImg(w*.04,w*.035,w*.92,h-w*.07,{mask:'rect',r:w*.11}),SH('rect',w*.36,w*.055,w*.28,w*.045,'#111418',{r:w*.03})];return o}],
 ['Laptop',()=>{const w=D.w*.62,h=w*.62,o=[SH('rect',0,0,w,h,'#1b1d21',{r:w*.025}),emptyImg(w*.02,w*.02,w*.96,h-w*.04,{mask:'rect',r:w*.01}),SH('rect',-w*.06,h,w*1.12,w*.035,'#c9ccd1',{r:w*.012}),SH('rect',w*.4,h,w*.2,w*.012,'#9ea2a8',{r:w*.006})];return o}],
 ['Browser window',()=>{const w=D.w*.7,h=w*.62,u=w/100,o=[SH('rect',0,0,w,h,'#ffffff',{r:u*1.6,shadow:{on:true,c:'rgba(0,0,0,.25)',b:u*3,x:0,y:u}}),SH('rect',0,0,w,u*6,'#e9ecef',{r:u*1.6}),SH('rect',0,u*3,w,u*3,'#e9ecef'),SH('ellipse',u*2,u*2,u*2,u*2,'#ff5f57'),SH('ellipse',u*5,u*2,u*2,u*2,'#febc2e'),SH('ellipse',u*8,u*2,u*2,u*2,'#28c840'),SH('rect',u*14,u*1.5,w-u*20,u*3,'#ffffff',{r:u*1.5}),emptyImg(0,u*6,w,h-u*6,{mask:'rect',r:0})];return o}],
 ['Tablet',()=>{const w=D.w*.5,h=w*1.3;return [SH('rect',0,0,w,h,'#111418',{r:w*.06,shadow:{on:true,c:'rgba(0,0,0,.3)',b:w*.06,x:0,y:w*.03}}),emptyImg(w*.045,w*.045,w*.91,h-w*.09,{mask:'rect',r:w*.02})]}],
 ['Monitor',()=>{const w=D.w*.64,h=w*.56;return [SH('rect',0,0,w,h,'#202328',{r:w*.02}),emptyImg(w*.02,w*.02,w*.96,h-w*.05,{mask:'rect',r:w*.005}),SH('rect',w*.44,h,w*.12,w*.1,'#aeb2b8'),SH('rect',w*.34,h+w*.1,w*.32,w*.02,'#9ea2a8',{r:w*.01})]}],
 ['Postage stamp',()=>{const w=D.w*.34;return [SH('rect',0,0,w,w*1.2,'#fffdf7',{shadow:{on:true,c:'rgba(0,0,0,.2)',b:w*.04,x:0,y:w*.015}}),emptyImg(w*.07,w*.07,w*.86,w*1.06,{mask:'rect'})]}],
 ['Photo booth strip',()=>{const w=D.w*.24,h=w*3.5,p=w*.07,ih=(h-p*5)/4;const o=[SH('rect',0,0,w,h,'#ffffff',{shadow:{on:true,c:'rgba(0,0,0,.25)',b:w*.05,x:0,y:w*.02}})];for(let i=0;i<4;i++)o.push(emptyImg(p,p+i*(ih+p),w-p*2,ih));return o}],
 ['Photo grid 2×2',()=>{const s=D.w*.4,g=s*.03,c=(s-g)/2,o=[];for(let r=0;r<2;r++)for(let q=0;q<2;q++)o.push(emptyImg(q*(c+g),r*(c+g),c,c));return o}],
 ['Photo grid 3',()=>{const s=D.w*.5,g=s*.025,o=[emptyImg(0,0,s*.6,s),];const c=(s-g)/2;o.push(emptyImg(s*.6+g,0,s*.4-g,c),emptyImg(s*.6+g,c+g,s*.4-g,c));return o}],
 ['Collage 5',()=>{const s=D.w*.6,g=s*.02,o=[emptyImg(0,0,s*.5-g/2,s*.6),emptyImg(s*.5+g/2,0,s*.5-g/2,s*.3-g/2),emptyImg(s*.5+g/2,s*.3+g/2,s*.25-g/2,s*.3),emptyImg(s*.75+g,s*.3+g/2,s*.25-g,s*.3),emptyImg(0,s*.6+g,s,s*.3)];return o}],
 ['Circle trio',()=>{const s=D.w*.2,o=[];[[0,s*.3],[s*.9,0],[s*1.8,s*.3]].forEach(([x,y])=>o.push(emptyImg(x,y,s,s,{mask:'ellipse',sw:s*.04,stroke:'#fff'})));return o}],
 ['Arch pair',()=>{const w=D.w*.2;return [emptyImg(0,w*.3,w,w*1.6,{mask:'fr_arch'}),emptyImg(w*1.15,0,w,w*1.6,{mask:'fr_arch'})]}],
];
function framesSection(s){
  if(s&&!'frame photo mask mockup collage polaroid phone laptop grid'.includes(s)&&!FRAMES.some(f=>f[1].toLowerCase().includes(s))&&!MOCKUPS.some(m=>m[0].toLowerCase().includes(s)))return null;
  const sh=k=>`<svg viewBox="-3 -3 106 106"><path d="${SP[k]}" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/></svg>`;
  const fl=FRAMES.filter(f=>!s||f[1].toLowerCase().includes(s)||'frame photo mask'.includes(s));
  return el('div',{},el('h4',{class:'sh'},'Photo frames · '+(fl.length+8)),el('p',{class:'note'},'Click to add an empty frame, then drop a photo on it.'),
    el('div',{class:'grid5'},[['none','No shape'],['rect','Rounded'],['ellipse','Circle'],['heart','Heart'],['star','Star'],['hex','Hexagon'],['blob','Blob'],['diamond','Diamond']].filter(f=>!s||f[1].toLowerCase().includes(s)||'frame photo mask'.includes(s)).map(([m,n])=>el('button',{class:'cell',title:n,'aria-label':'Frame '+n,html:m==='none'?'<svg viewBox="0 0 100 100"><rect x="8" y="8" width="84" height="84" fill="none" stroke="currentColor" stroke-width="5" stroke-dasharray="9 6"/></svg>':m==='rect'?'<svg viewBox="0 0 100 100"><rect x="8" y="8" width="84" height="84" rx="14" fill="none" stroke="currentColor" stroke-width="5"/></svg>':sh(m),onclick:()=>addObj(mkImage('',800,800,{w:D.w*.45,h:D.w*.45,mask:m,r:m==='rect'?60:0}))})).concat(fl.map(([k,n])=>el('button',{class:'cell',title:n,'aria-label':'Frame '+n,html:sh(k),onclick:()=>{const wide=/pill|ribbon|banner|wave|slant|tv|stamp|ticket|tabbed|torn|notch|cut|brush|speech|film|arrowr|hex_h/.test(k);addObj(mkImage('',800,wide?600:800,{w:D.w*(wide?.55:.42),h:D.w*(wide?.55:.42)*(wide?.75:1),mask:k,r:0}))}})))));
}
function mockupsSection(s){
  const ms=MOCKUPS.filter(m=>!s||m[0].toLowerCase().includes(s)||'frame mockup device collage grid'.includes(s));if(!ms.length)return null;
  return el('div',{},el('h4',{class:'sh'},'Mockups & collages'),el('div',{class:'grid2'},ms.map(([n,f])=>el('button',{class:'btn',onclick:()=>placeMany(f(),n)},n))));
}
/* ---------- icons panel ---------- */
let iconCat='All';
function iconsSection(s){
  const list=ICONS.filter(i=>(iconCat==='All'||i.c===iconCat)&&(!s||(i.n+' '+i.k+' '+i.c).toLowerCase().includes(s)));
  const cats=['All',...ICON_CATS];
  return el('div',{},el('h4',{class:'sh'},'Icons · '+ICONS.length),
    el('div',{class:'chips'},cats.map(c=>el('button',{class:'chip','aria-pressed':iconCat===c,onclick:()=>{iconCat=c;renderPanel()}},c))),
    list.length?el('div',{class:'grid5'},list.map(i=>el('button',{class:'cell',title:i.n,'aria-label':'Icon '+i.n,html:`<svg viewBox="0 0 100 100"><path d="${i.d}" fill="currentColor" fill-rule="evenodd"/></svg>`,onclick:()=>{const sz=Math.round(Math.min(D.w,D.h)*.14);addObj(mkShape(i.id,{w:sz,h:sz,fill:brand.colors[1]||'#1f1c19',name:i.n}))}}))):el('p',{class:'note'},'No icons match.'));
}

/* ---------- corporate + social design families: style themes x layouts ---------- */
const TH=[
 {n:'Navy & Gold',bg:'#0b1a3b',bg2:'#13285a',a:'#e9b949',on:'#0b1a3b',ink:'#ffffff',mut:'#b8c2db',hf:'Playfair Display',bf:'Poppins',deco:'frame',pc:['#13285a','#0b1a3b']},
 {n:'Clean Blue',bg:'#ffffff',a:'#1c7ed6',on:'#ffffff',ink:'#0b2a5b',mut:'#5c6b8a',hf:'Plus Jakarta Sans',bf:'Plus Jakarta Sans',deco:'circles',lt:1,pc:['#e7f5ff','#d0ebff']},
 {n:'Charcoal & Orange',bg:'#1f1c19',a:'#e8590c',on:'#ffffff',ink:'#ffffff',mut:'#b9b0a6',hf:'Bricolage Grotesque',bf:'Poppins',deco:'bar',pc:['#2b2724','#1f1c19']},
 {n:'Forest Green',bg:'#0f3d2e',bg2:'#0a2a20',a:'#b2f2bb',on:'#0a2a20',ink:'#f1fbf3',mut:'#9bc4ae',hf:'Fraunces',bf:'Outfit',deco:'dots',pc:['#145a42','#0f3d2e']},
 {n:'Burgundy Cream',bg:'#fdf6ec',a:'#8c1c3d',on:'#fdf6ec',ink:'#3a0f1c',mut:'#7c5560',hf:'DM Serif Display',bf:'Manrope',deco:'band',lt:1,pc:['#f3e3cf','#e9d3b8']},
 {n:'Indigo Gradient',bg:'#4338ca',bg2:'#7c3aed',a:'#fde047',on:'#1e1b4b',ink:'#ffffff',mut:'#d8d4ff',hf:'Sora',bf:'Sora',deco:'circles',ang:135,pc:['#6d5ce8','#4338ca']},
 {n:'Neon Tech',bg:'#05080f',a:'#39ff88',on:'#05080f',ink:'#eafff3',mut:'#7fb69a',hf:'Space Grotesk',bf:'Space Grotesk',deco:'dots',pc:['#0d1a14','#05080f']},
 {n:'Terracotta',bg:'#f6e8dc',a:'#c2410c',on:'#fff7ed',ink:'#431407',mut:'#8a5a44',hf:'Fraunces',bf:'Outfit',deco:'diag',lt:1,pc:['#edd3bf','#e2bfa5']},
 {n:'Ocean',bg:'#0b7285',bg2:'#0b3d91',a:'#ffe066',on:'#08323a',ink:'#ffffff',mut:'#c3e8ee',hf:'Unbounded',bf:'Manrope',deco:'circles',ang:160,pc:['#0f8aa0','#0b7285']},
 {n:'Rose & Plum',bg:'#fff0f6',a:'#a61e4d',on:'#fff0f6',ink:'#45102a',mut:'#8a5370',hf:'Playfair Display',bf:'Poppins',deco:'circles',lt:1,pc:['#ffdeeb','#fcc2d7']},
 {n:'Mono Grey',bg:'#f1f3f5',a:'#212529',on:'#f8f9fa',ink:'#212529',mut:'#6c757d',hf:'Syne',bf:'DM Sans',deco:'band',lt:1,pc:['#dee2e6','#ced4da']},
 {n:'Sunset Pop',bg:'#ff6b6b',bg2:'#feca57',a:'#1f1c19',on:'#ffffff',ink:'#1f1c19',mut:'#5b3a29',hf:'League Spartan',bf:'Poppins',deco:'diag',ang:120,pc:['#ffd8a8','#ffa94d']},
 {n:'Midnight Teal',bg:'#0f172a',a:'#2dd4bf',on:'#0f172a',ink:'#f1f5f9',mut:'#94a3b8',hf:'Manrope',bf:'Inter',deco:'frame',pc:['#1e293b','#0f172a']},
 {n:'Royal Maroon',bg:'#4a0e1c',bg2:'#2a0610',a:'#f2c14e',on:'#2a0610',ink:'#fff4dc',mut:'#e8c9a8',hf:'Rozha One',bf:'Poppins',deco:'jaali',pc:['#6b1a2b','#4a0e1c']},
 {n:'Saffron Festive',bg:'#fff4e0',a:'#e8590c',on:'#fff4e0',ink:'#3b1f0a',mut:'#8a5a2b',hf:'Yatra One',bf:'Hind',deco:'jaali',lt:1,pc:['#ffe0b2','#ffcc80']},
];
const tbg=th=>th.bg2?{t:'grad',k:'lin',c1:th.bg,c2:th.bg2,a:th.ang||150}:{t:'solid',c:th.bg};
const PHm=(x,y,w,h,o={})=>mkImage('',Math.round(w),Math.round(h),Object.assign({x,y,w,h,name:'Photo'},o));
const cardF=th=>th.lt?th.pc[0]:'#ffffff';
const NOF='rgba(0,0,0,0)';
function decoT(th,o,W,H,u){const a=th.a;
  switch(th.deco){
   case 'dots':o.push(AI('dots',0,0,W,[a,a],{fill:H,op:th.lt?.14:.1,nm:'Pattern'}));break;
   case 'jaali':o.push(AI('jaali',0,0,W,[a],{fill:H,op:th.lt?.1:.1,nm:'Pattern'}));break;
   case 'circles':o.push(SH('ellipse',W*.58,-W*.3,W*.8,W*.8,a,{op:th.lt?.13:.17}),SH('ellipse',-W*.28,H*.74,W*.6,W*.6,a,{op:th.lt?.08:.1}));break;
   case 'bar':o.push(SH('rect',0,0,u*2.4,H,a));break;
   case 'band':o.push(SH('rect',0,0,W,u*2.6,a),SH('rect',0,H-u*1.4,W,u*1.4,a,{op:.35}));break;
   case 'frame':o.push(SH('rect',u*2.6,u*2.6,W-u*5.2,H-u*5.2,NOF,{stroke:a,sw:u*.3,r:u}));break;
   case 'diag':o.push(SH('rect',W*.62,-H*.25,W*.5,H*1.6,a,{op:th.lt?.14:.2,rot:16}));break;
  }}
const kick=(th,t,x,y,u,o={})=>T_(t,x,y,W_(o),u*2.9,Object.assign({font:th.bf,bold:true,color:th.a,ls:22},o));
const W_=o=>o.w||600;
const hd=(th,t,x,y,w,s,o={})=>T_(t,x,y,w,s,Object.assign({font:th.hf,bold:!/Serif|Display|Rozha|Yatra|Fraunces|Playfair/.test(th.hf),color:th.ink,lh:1.05},o));
const bd=(th,t,x,y,w,s,o={})=>T_(t,x,y,w,s,Object.assign({font:th.bf,color:th.mut,lh:1.5},o));
const btn=(th,t,x,y,u,o={})=>{const w=u*(9+t.length*2.7);if(o.right)x-=w;return [SH('rect',x,y,w,u*8.4,th.a,{r:u*(th.rad??4.2)}),T_(t,x,y+u*2.05,w,u*3.6,{font:th.bf,bold:true,color:th.on,align:'center',ls:6})]};
const SOC={};
/* 1: announcement (square, left or centred) */
SOC.announce=(th,v)=>(W,H,u)=>{const o=[];decoT(th,o,W,H,u);const c=v==='c',al=c?'center':'left',x=W*.09,w=W*.82;
  if(th.art)o.push(c?artAt(null,th.art,W*.5,H*.62,W*.3,H*.16,{},th.artc):artAt(null,th.art,W*.8,H*.82,W*.34,H*.3,{},th.artc));
  const items=[[th.k1||(c?'WHAT’S NEW':'ANNOUNCEMENT'),u*2.8,{font:th.bf,bold:true,color:th.a,ls:24,align:al}],1.6,[th.h1||'Big news from\nour team',u*(th.hs||9.2),{font:th.hf,bold:!/Serif|Display|Rozha|Yatra|Fraunces|Playfair/.test(th.hf),color:th.ink,lh:1.05,align:al}],1.8,[th.s1||'We have something exciting to share — a faster, simpler way to work with us.',u*3.4,{font:th.bf,color:th.mut,lh:1.5,align:al}]];
  const fl=flowT(x,w,H*.14,items,u,H*.7);o.push(...fl.o);
  const b=btn(th,th.cta||'LEARN MORE',c?W/2-u*(9+(th.cta||'LEARN MORE').length*2.7)/2:x,H*.78,u);o.push(...b);
  o.push(T_('www.yourcompany.com',x,H*.9,w,u*2.8,{font:th.bf,color:th.mut,align:al}));return {bg:tbg(th),objs:o}};
/* 2: big number */
SOC.stat=(th,v)=>(W,H,u)=>{const o=[];decoT(th,o,W,H,u);
  o.push(T_('THE RESULTS ARE IN',W*.09,H*.1,W*.8,u*2.8,{font:th.bf,bold:true,color:th.a,ls:24}));
  o.push(T_('+248%',W*.06,H*.2,W*.88,u*(v==='b'?22:20),{font:th.hf,bold:true,color:th.a,lh:1}));
  o.push(bd(th,'growth in qualified leads in just 90 days',W*.09,H*.58,W*.8,u*4.2,{color:th.ink}));
  [.32,.52,.74,1].forEach((k,i)=>{const bw=u*6.4;o.push(SH('rect',W*.09+i*(bw+u*1.6),H*.9-H*.16*k,bw,H*.16*k,th.a,{r:u*.8,op:.45+.18*i}))});
  o.push(bd(th,'Q1 → Q4',W*.62,H*.86,W*.3,u*2.8,{align:'right'}));return {bg:tbg(th),objs:o}};
/* 3: quote / testimonial */
SOC.quote=(th,v)=>(W,H,u)=>{const o=[];decoT(th,o,W,H,u);
  o.push(T_('“',W*.07,H*.04,u*30,u*34,{font:th.hf,bold:true,color:th.a,lh:1}));
  const q=T_('Working with this team changed how we run our business. Results in weeks, not months.',W*.09,H*.3,W*.82,u*(v==='s'?5.6:6.4),{font:th.hf,bold:!/Serif|Display|Rozha|Yatra|Fraunces|Playfair/.test(th.hf),color:th.ink,lh:1.3});o.push(q);
  const y=q.y+q.h+u*6;o.push(PHm(W*.09,y,u*11,u*11,{mask:'ellipse'}),T_('Ananya Rao',W*.09+u*13,y+u*1.4,W*.6,u*3.8,{font:th.bf,bold:true,color:th.ink}),T_('Founder, Studio Nine',W*.09+u*13,y+u*6,W*.6,u*3,{font:th.bf,color:th.mut}));return {bg:tbg(th),objs:o}};
/* 4: tips list */
SOC.tips=(th,v)=>(W,H,u)=>{const o=[];decoT(th,o,W,H,u);
  o.push(T_('QUICK TIPS',W*.09,H*.08,W*.8,u*2.8,{font:th.bf,bold:true,color:th.a,ls:24}),hd(th,'3 ways to save\nhours every week',W*.09,H*.13,W*.82,u*7.4));
  ['Automate the repeat work','Batch your meetings','Write it down once'].forEach((t,i)=>{const y=H*.46+i*H*.16;o.push(SH('ellipse',W*.09,y,u*9,u*9,th.a),T_(String(i+1),W*.09,y+u*1.6,u*9,u*5.4,{font:th.hf,bold:true,color:th.on,align:'center'}),T_(t,W*.09+u*12,y+u*1.5,W*.66,u*4.6,{font:th.bf,bold:true,color:th.ink,lh:1.15}))});
  o.push(bd(th,'Save this post  ·  Follow for more',W*.09,H*.92,W*.82,u*2.8,{align:'left'}));return {bg:tbg(th),objs:o}};
/* 5: event / webinar */
SOC.event=(th,v)=>(W,H,u)=>{const o=[];decoT(th,o,W,H,u);
  o.push(SH('rect',W*.09,H*.1,u*21,u*24,th.a,{r:u*2.4}),T_('MAR',W*.09,H*.1+u*2.6,u*21,u*4.2,{font:th.bf,bold:true,color:th.on,align:'center',ls:20}),T_('21',W*.09,H*.1+u*7,u*21,u*14,{font:th.hf,bold:true,color:th.on,align:'center',lh:1}));
  o.push(T_('LIVE WEBINAR · 7 PM IST',W*.09+u*24,H*.1+u*3,W*.5,u*2.6,{font:th.bf,bold:true,color:th.a,ls:14}));
  const t=hd(th,'Scale your\nbusiness with AI',W*.09,H*.42,W*.82,u*8.6);o.push(t);
  o.push(bd(th,'A free 45-minute session with live Q&A. Seats are limited.',W*.09,t.y+t.h+u*2,W*.8,u*3.4));
  o.push(PHm(W*.09,H*.83,u*8,u*8,{mask:'ellipse'}),T_('Hosted by Rohan',W*.09+u*10,H*.83+u*1.6,W*.3,u*3.4,{font:th.bf,bold:true,color:th.ink}),...btn(th,'REGISTER',W*.91,H*.82,u,{right:1}));return {bg:tbg(th),objs:o}};
/* 6: hiring */
SOC.hiring=(th,v)=>(W,H,u)=>{const o=[];decoT(th,o,W,H,u);
  o.push(T_('JOIN OUR TEAM',W*.09,H*.1,W*.8,u*2.8,{font:th.bf,bold:true,color:th.a,ls:24}),hd(th,'We’re\nhiring!',W*.09,H*.15,W*.82,u*15));
  ['Product Designer','Frontend Engineer','Customer Success Lead'].forEach((t,i)=>{const y=H*.58+i*H*.1;o.push(SH('rect',W*.09,y,W*.82,u*8,cardF(th),{r:u*(th.rad??2),op:th.lt?.85:.1}),T_(t,W*.09+u*3,y+u*2.1,W*.6,u*3.8,{font:th.bf,bold:true,color:th.ink}),T_('→',W*.09,y+u*1.8,W*.82-u*3,u*4.2,{font:th.bf,bold:true,color:th.a,align:'right'}))});
  o.push(bd(th,'careers@yourcompany.com',W*.09,H*.91,W*.82,u*3));return {bg:tbg(th),objs:o}};
/* 7: feature with picture */
SOC.feature=(th,v)=>(W,H,u)=>{const o=[];decoT(th,o,W,H,u);
  o.push(PHm(W*.08,H*.07,W*.84,H*.42,{mask:'rect',r:u*(th.rad??3)}));
  o.push(T_(th.k2||'NEW FEATURE',W*.08,H*.54,W*.8,u*2.6,{font:th.bf,bold:true,color:th.a,ls:22}),hd(th,th.h2||'Smarter reports,\nready in a click',W*.08,H*.585,W*.84,u*6.8));
  o.push(bd(th,th.s2||'See what matters, share it with your team, and act on it faster.',W*.08,H*.8,W*.84,u*3.2));
  o.push(...btn(th,th.cta||'TRY IT NOW',W*.08,H*.9,u).map(e=>(e.y-=u*1.2,e)));return {bg:tbg(th),objs:o}};
/* 8: team spotlight */
SOC.spot=(th,v)=>(W,H,u)=>{const o=[];decoT(th,o,W,H,u);
  o.push(T_('TEAM SPOTLIGHT',W*.08,H*.08,W*.8,u*2.8,{font:th.bf,bold:true,color:th.a,ls:24,align:'center'}));
  o.push(SH('ellipse',W*.5-u*22,H*.17,u*44,u*44,th.a,{op:.22}),PHm(W*.5-u*19,H*.17+u*3,u*38,u*38,{mask:'ellipse',sw:u*.8,stroke:th.a}));
  o.push(hd(th,'Priya Nair',0,H*.62,W,u*9,{align:'center'}),T_('Head of Customer Success',0,H*.62+u*11.5,W,u*3.6,{font:th.bf,bold:true,color:th.a,align:'center'}),bd(th,'“Every customer story makes our work worth it.”',W*.12,H*.84,W*.76,u*3.2,{align:'center',italic:true}));return {bg:tbg(th),objs:o}};
/* 9: process steps (LinkedIn landscape) */
SOC.steps=(th,v)=>(W,H,u)=>{const o=[];decoT(th,o,W,H,u);
  o.push(T_('HOW IT WORKS',W*.06,H*.09,W*.5,u*3.6,{font:th.bf,bold:true,color:th.a,ls:24}),hd(th,'Four steps to launch',W*.06,H*.17,W*.88,u*10.5));
  ['Discover','Design','Build','Launch'].forEach((t,i)=>{const x=W*.06+i*W*.2325,w=W*.2,y=H*.5;o.push(SH('rect',x,y,w,H*.38,cardF(th),{r:u*(th.rad??2.4),op:th.lt?1:.09}),T_('0'+(i+1),x+u*3,y+u*3,w,u*12,{font:th.hf,bold:true,color:th.a,lh:1}),T_(t,x+u*3,y+u*20,w-u*4,u*6.2,{font:th.bf,bold:true,color:th.ink}))});return {bg:tbg(th),objs:o}};
/* 10: story announcement (1080x1920) */
SOC.story=(th,v)=>(W,H,u)=>{const o=[];decoT(th,o,W,H,u);
  o.push(T_('NEW',W*.09,H*.1,W*.5,u*3,{font:th.bf,bold:true,color:th.a,ls:30}));
  const t=hd(th,th.h3||'Something\nbig is\ncoming',W*.09,H*.15,W*.82,u*14);o.push(t);
  o.push(bd(th,th.s3||'Swipe up to be the first to know.',W*.09,t.y+t.h+u*4,W*.8,u*4));
  o.push(PHm(W*.09,H*.62,W*.82,H*.2,{mask:'rect',r:u*(th.rad??3)}),...btn(th,'SWIPE UP',W/2-u*(9+8*2.7)/2,H*.88,u));return {bg:tbg(th),objs:o}};
/* 11: LinkedIn / profile banner */
SOC.banner=(th,v)=>(W,H,u)=>{const o=[];decoT(th,o,W,H,u);
  const t=hd(th,'Helping businesses grow\nwith design & data',W*.06,H*.17,W*.62,u*17);o.push(t);
  o.push(bd(th,'Strategy · Branding · Automation',W*.06,t.y+t.h+u*4,W*.62,u*8,{color:th.a,bold:true}));
  o.push(PHm(W*.76,H*.08,H*.84,H*.84,{mask:'ellipse',sw:u*1.4,stroke:th.a}));return {bg:tbg(th),objs:o}};
/* 12: poll / question */
SOC.poll=(th,v)=>(W,H,u)=>{const o=[];decoT(th,o,W,H,u);
  o.push(T_('YOUR TAKE',W*.09,H*.09,W*.8,u*2.8,{font:th.bf,bold:true,color:th.a,ls:24}),hd(th,'What slows your team down the most?',W*.09,H*.14,W*.82,u*7.8));
  [['Too many meetings',68],['Unclear priorities',52],['Slow approvals',34]].forEach(([t,p],i)=>{const y=H*.5+i*H*.14;o.push(SH('rect',W*.09,y,W*.82,u*10,cardF(th),{r:u*(th.rad??2),op:th.lt?.9:.1}),SH('rect',W*.09,y,W*.82*p/100,u*10,th.a,{r:u*(th.rad??2),op:.9}),T_(t,W*.09+u*3,y+u*3,W*.5,u*3.6,{font:th.bf,bold:true,color:p>40?th.on:th.ink}),T_(p+'%',W*.09,y+u*3,W*.82-u*3,u*3.6,{font:th.bf,bold:true,color:th.ink,align:'right'}))});return {bg:tbg(th),objs:o}};
/* 13: before / after */
SOC.compare=(th,v)=>(W,H,u)=>{const o=[];decoT(th,o,W,H,u);
  o.push(hd(th,'Before vs After',W*.08,H*.08,W*.84,u*8,{align:'center'}));
  [['BEFORE','Manual follow-ups\nLost leads\nSlow replies',cardF(th),.1],['AFTER','Automated flows\nEvery lead tracked\nReplies in minutes',th.a,1]].forEach(([h,t,f,op],i)=>{const x=W*.08+i*W*.43,after=i===1;o.push(SH('rect',x,H*.28,W*.41,H*.6,f,{r:u*(th.rad??2.6),op:th.lt&&!after?.9:op}),T_(h,x,H*.32,W*.41,u*3.4,{font:th.bf,bold:true,color:after?th.on:th.a,align:'center',ls:20}),T_(t,x+u*2,H*.44,W*.41-u*4,u*4.2,{font:th.bf,color:after?th.on:th.ink,lh:1.75,align:'center'}))});return {bg:tbg(th),objs:o}};
/* 14: countdown */
SOC.count=(th,v)=>(W,H,u)=>{const o=[];decoT(th,o,W,H,u);
  o.push(T_('LAUNCHING SOON',0,H*.14,W,u*3,{font:th.bf,bold:true,color:th.a,ls:26,align:'center'}));
  [['07','DAYS'],['12','HRS'],['45','MIN']].forEach(([n,l],i)=>{const x=W*.08+i*W*.29;o.push(SH('rect',x,H*.3,W*.26,H*.3,cardF(th),{r:u*(th.rad??2.4),op:th.lt?.9:.1}),T_(n,x,H*.34,W*.26,u*15,{font:th.hf,bold:true,color:th.a,align:'center',lh:1}),T_(l,x,H*.5,W*.26,u*2.8,{font:th.bf,bold:true,color:th.mut,align:'center',ls:22}))});
  o.push(hd(th,'Mark your calendar',W*.08,H*.7,W*.84,u*7.4,{align:'center'}),bd(th,'Get early access at yourcompany.com',W*.1,H*.84,W*.8,u*3.4,{align:'center'}));return {bg:tbg(th),objs:o}};
const SOCFAM=[
 ['announce','Announcement',[1080,1080],'Social','announcement news post','l'],['announce','Announcement centred',[1080,1080],'Social','announcement news post','c'],
 ['stat','Big stat',[1080,1080],'Business','results stat metric kpi',''],['quote','Testimonial',[1080,1080],'Social','quote testimonial review',''],
 ['tips','Tips list',[1080,1080],'Social','tips carousel list',''],['event','Webinar',[1080,1080],'Business','event webinar workshop',''],
 ['hiring','Hiring',[1080,1080],'Business','hiring job recruitment careers',''],['feature','Product feature',[1080,1350],'Business','product feature launch',''],
 ['spot','Team spotlight',[1080,1080],'Social','employee team spotlight',''],['steps','Process steps',[1200,628],'Business','process steps how it works linkedin',''],
 ['story','Story',[1080,1920],'Social','instagram story reel',''],['banner','Profile banner',[1584,396],'Business','linkedin banner cover',''],
 ['poll','Poll',[1080,1080],'Social','poll question engagement',''],['compare','Before & after',[1080,1080],'Business','before after comparison',''],
 ['count','Countdown',[1080,1080],'Social','countdown launch teaser',''],
];
const THART={'Navy & Gold':'trophy','Clean Blue':'laptop','Charcoal & Orange':'rocket','Forest Green':'leaf','Burgundy Cream':'cup','Indigo Gradient':'sparkle','Neon Tech':'rocket','Terracotta':'bulb','Ocean':'plane','Rose & Plum':'heart','Mono Grey':'bars','Sunset Pop':'sun','Midnight Teal':'laptop','Royal Maroon':'diya','Saffron Festive':'lotus'};
TH.forEach(th=>{th.art=THART[th.n]});
SOCFAM.forEach(([k,label,size,cat,tags,v])=>TH.forEach(th=>add(cat,`${label} · ${th.n}`,size,SOC[k](th,v),'design post '+tags)));

/* industry flavours of the same layouts */
const IND2=[
 ['Real estate','house',{k1:'NEW LISTING',h1:'Your dream\nhome awaits',s1:'3 BHK · Prime location · Ready to move. Book a site visit this weekend.',cta:'BOOK A VISIT',k2:'FEATURED PROPERTY',h2:'Sunrise Heights,\nBandra West',s2:'3 BHK from ₹2.4 Cr · Sea view · Clubhouse & pool.',h3:'Open\nhouse\nthis Sunday',s3:'10 AM – 5 PM · Refreshments served'},[0,1,2]],
 ['Fitness','dumbbell',{k1:'JOIN TODAY',h1:'Stronger\nevery day',s1:'Personal training, group classes and nutrition plans. First week free.',cta:'START FREE',k2:'NEW BATCH',h2:'30-day body\nchallenge',s2:'Daily workouts, meal plans and a community that keeps you going.',h3:'Your\nfitness\njourney starts',s3:'Free trial · No joining fee this month'},[6,2,11]],
 ['Fashion & Jewellery','gem',{k1:'NEW COLLECTION',h1:'Festive edit\nis here',s1:'Handcrafted sarees, lehengas and jewellery for every celebration.',cta:'SHOP NOW',k2:'JUST IN',h2:'Timeless gold,\nmodern design',s2:'Explore our new bridal and festive jewellery collection.',h3:'Festive\nsale\nis live',s3:'Flat 30% off on selected styles'},[4,9,13]],
 ['Travel','plane',{k1:'HOLIDAY DEALS',h1:'Escape to\nparadise',s1:'Curated holiday packages with flights, stays and sightseeing.',cta:'BOOK NOW',k2:'TOP DESTINATION',h2:'Kerala\nbackwaters',s2:'4 nights · Houseboat stay · From ₹18,999 per person.',h3:'Pack\nyour\nbags',s3:'Early-bird offer ends Friday'},[8,11,7]],
 ['Education','cap',{k1:'ADMISSIONS OPEN',h1:'Learn.\nGrow. Lead.',s1:'Admissions open for 2026–27. Scholarships available for toppers.',cta:'APPLY NOW',k2:'NEW COURSE',h2:'Data science\nbootcamp',s2:'12 weeks · Live mentors · Job assistance.',h3:'Enrol\ntoday',s3:'Limited seats · Free demo class'},[5,1,3]],
 ['Food','cup',{k1:'NOW OPEN',h1:'Taste the\ndifference',s1:'Fresh, homestyle and made with love. Dine in or order online.',cta:'ORDER NOW',k2:'CHEF’S SPECIAL',h2:'Hyderabadi\ndum biryani',s2:'Slow-cooked, aromatic and served with raita.',h3:'Weekend\nbuffet',s3:'Unlimited food · Live counters'},[7,14,2]],
];
IND2.forEach(([cat,art,copy,ids])=>ids.forEach(i=>{const th=Object.assign({},TH[i],copy,{art});[['announce','Announcement',[1080,1080],''],['announce','Announcement centred',[1080,1080],'c'],['feature','Feature',[1080,1350],''],['story','Story',[1080,1920],'']].forEach(([k,label,size,v])=>add(cat,`${label} · ${cat} · ${TH[i].n}`,size,SOC[k](th,v),'design post '+cat.toLowerCase()))}));

/* ---------- presentation decks: 11 themes x 14 slide layouts ---------- */
const DECKS=[0,1,2,3,4,5,6,7,8,13,14].map(i=>TH[i]);
const SLD={};
const SB=(th,o,W,H,u,v)=>{decoT(Object.assign({},th,{deco:v||th.deco}),o,W,H,u)};
SLD.cover=th=>(W,H,u)=>{const o=[];SB(th,o,W,H,u,th.deco==='bar'?'none':th.deco);
  o.push(PHm(W*.54,H*.08,W*.4,H*.84,{mask:'rect',r:u*(th.rad??3)}),SH('rect',W*.54-u*1.6,H*.08+u*1.6,W*.4,H*.84,NOF,{stroke:th.a,sw:u*.3,r:u*(th.rad??3)}));
  o.push(T_('PRESENTATION',W*.07,H*.2,W*.4,u*2.7,{font:th.bf,bold:true,color:th.a,ls:26}));
  const t=hd(th,'Your big idea,\nbeautifully told',W*.07,H*.27,W*.44,u*8.6);o.push(t);
  o.push(bd(th,'A short subtitle that sets up the story',W*.07,t.y+t.h+u*2.5,W*.42,u*3.2),...btn(th,'2026 · Q3',W*.07,H*.78,u));return {bg:tbg(th),objs:o}};
SLD.cover2=th=>(W,H,u)=>{const o=[];SB(th,o,W,H,u);
  if(th.art)o.push(artAt(null,th.art,W*.5,H*.2,W*.14,H*.22,{},th.artc));
  o.push(hd(th,'Company Name\nProposal 2026',0,H*.3,W,u*13,{align:'center'}),T_('Prepared for your team · Month 2026',0,H*.74,W,u*3.4,{font:th.bf,color:th.mut,align:'center'}),SH('rect',W*.5-u*10,H*.7,u*20,u*.7,th.a));return {bg:tbg(th),objs:o}};
SLD.agenda=th=>(W,H,u)=>{const o=[];SB(th,o,W,H,u,'none');
  o.push(hd(th,'Agenda',W*.07,H*.1,W*.5,u*10),SH('rect',W*.07,H*.1+u*13.5,u*12,u*.8,th.a));
  ['Overview','Insights','Strategy','Next steps'].forEach((t,i)=>{const x=W*.07+i*W*.2325,w=W*.2,y=H*.42;o.push(SH('rect',x,y,w,H*.42,cardF(th),{r:u*(th.rad??2.6),op:th.lt?1:.09}),T_('0'+(i+1),x+u*3,y+u*3,w,u*10,{font:th.hf,bold:true,color:th.a,lh:1}),T_(t,x+u*3,y+u*17,w-u*4,u*4.4,{font:th.bf,bold:true,color:th.ink}),T_('A short line about this part of the talk.',x+u*3,y+u*23,w-u*5,u*3.4,{font:th.bf,color:th.mut,lh:1.45}))});return {bg:tbg(th),objs:o}};
SLD.section=th=>(W,H,u)=>{const o=[];SB(th,o,W,H,u,'diag');
  o.push(T_('02',W*.07,H*.08,W*.5,u*34,{font:th.hf,bold:true,color:th.a,lh:1}),hd(th,'Our strategy',W*.07,H*.6,W*.8,u*11),bd(th,'How we plan to win in the next twelve months',W*.07,H*.8,W*.7,u*3.8));return {bg:tbg(th),objs:o}};
SLD.content=th=>(W,H,u)=>{const o=[];SB(th,o,W,H,u,'none');
  o.push(PHm(W*.54,0,W*.46,H,{mask:'rect'}),SH('rect',W*.54-u*.8,0,u*.8,H,th.a));
  o.push(T_('OVERVIEW',W*.07,H*.12,W*.4,u*2.7,{font:th.bf,bold:true,color:th.a,ls:26}),hd(th,'What this means\nfor you',W*.07,H*.18,W*.44,u*7.6));
  ['Faster decisions with clear data','One place for the whole team','Support that actually answers'].forEach((t,i)=>{const y=H*.52+i*H*.13;o.push(SH('ellipse',W*.07,y+u*.6,u*3.4,u*3.4,th.a),T_(t,W*.07+u*5.4,y,W*.38,u*4.4,{font:th.bf,color:th.ink,lh:1.3}))});return {bg:tbg(th),objs:o}};
SLD.cols3=th=>(W,H,u)=>{const o=[];SB(th,o,W,H,u,'none');
  o.push(hd(th,'Three reasons to act now',W*.07,H*.1,W*.86,u*8.4));
  [['Speed','Cut turnaround time by half with simple, repeatable workflows.'],['Quality','Fewer errors and cleaner handovers across every team.'],['Savings','Lower cost per project without lowering the bar.']].forEach(([t,x_],i)=>{const x=W*.07+i*W*.2975,w=W*.27,y=H*.34;o.push(SH('rect',x,y,w,H*.52,cardF(th),{r:u*(th.rad??2.6),op:th.lt?1:.09}),SH('ellipse',x+u*3,y+u*3,u*9,u*9,th.a),T_(String(i+1),x+u*3,y+u*5,u*9,u*5.2,{font:th.hf,bold:true,color:th.on,align:'center'}),T_(t,x+u*3,y+u*15,w-u*6,u*5,{font:th.hf,bold:true,color:th.ink}),T_(x_,x+u*3,y+u*22,w-u*6,u*3.7,{font:th.bf,color:th.mut,lh:1.5}))});return {bg:tbg(th),objs:o}};
SLD.stats=th=>(W,H,u)=>{const o=[];SB(th,o,W,H,u,'none');
  o.push(hd(th,'The numbers speak',W*.07,H*.1,W*.86,u*8.4));
  [['3.2M','customers served'],['98%','on-time delivery'],['14','states covered']].forEach(([n,l],i)=>{const x=W*.07+i*W*.3,w=W*.27;o.push(T_(n,x,H*.38,w,u*17,{font:th.hf,bold:true,color:th.a,lh:1}),SH('rect',x,H*.38+u*19,u*8,u*.7,th.a),T_(l,x,H*.38+u*21,w,u*3.8,{font:th.bf,color:th.ink}))});
  o.push(bd(th,'Source: company data, FY 2025–26',W*.07,H*.9,W*.6,u*2.5));return {bg:tbg(th),objs:o}};
SLD.process=th=>(W,H,u)=>{const o=[];SB(th,o,W,H,u,'none');
  o.push(hd(th,'How it works',W*.07,H*.1,W*.86,u*8.4),SH('rect',W*.07+u*5,H*.5,W*.86-u*10,u*.6,th.a,{op:.5}));
  ['Discover','Plan','Build','Launch'].forEach((t,i)=>{const cx=W*.07+u*5+i*(W*.86-u*10)/3;o.push(SH('ellipse',cx-u*5.5,H*.5-u*5.2,u*11,u*11,th.a),T_(String(i+1),cx-u*5.5,H*.5-u*2.6,u*11,u*6,{font:th.hf,bold:true,color:th.on,align:'center'}),T_(t,cx-W*.1,H*.5+u*9,W*.2,u*4.6,{font:th.hf,bold:true,color:th.ink,align:'center'}),T_('Short description of this step.',cx-W*.09,H*.5+u*15.5,W*.18,u*3.5,{font:th.bf,color:th.mut,align:'center',lh:1.45}))});return {bg:tbg(th),objs:o}};
SLD.chart=th=>(W,H,u)=>{const o=[];SB(th,o,W,H,u,'none');
  o.push(hd(th,'Revenue is up every quarter',W*.07,H*.1,W*.86,u*8));
  const bx=W*.07,by=H*.84,bh=H*.5,bw=u*8.4;[.35,.5,.62,.9].forEach((k,i)=>{o.push(SH('rect',bx+i*(bw+u*3),by-bh*k,bw,bh*k,i===3?th.a:th.lt?th.pc[1]:'#ffffff',{r:u*.8,op:i===3?1:th.lt?1:.28}),T_('Q'+(i+1),bx+i*(bw+u*3),by+u*1.2,bw,u*3.5,{font:th.bf,color:th.mut,align:'center'}))});
  o.push(SH('rect',W*.56,H*.3,W*.37,H*.56,cardF(th),{r:u*(th.rad??2.6),op:th.lt?1:.09}),T_('+48%',W*.56+u*3,H*.34,W*.3,u*14,{font:th.hf,bold:true,color:th.a,lh:1}),T_('year-on-year growth, driven by repeat customers and a stronger product mix.',W*.56+u*3,H*.34+u*17,W*.37-u*6,u*3.4,{font:th.bf,color:th.ink,lh:1.5}));return {bg:tbg(th),objs:o}};
SLD.team=th=>(W,H,u)=>{const o=[];SB(th,o,W,H,u,'none');
  o.push(hd(th,'Meet the team',W*.07,H*.1,W*.86,u*8.4));
  [['Aarav Shah','Founder & CEO'],['Meera Iyer','Design'],['Rohan Das','Engineering'],['Ananya Rao','Growth']].forEach(([n,r],i)=>{const cx=W*.07+W*.0925+i*W*.2325,d=u*24;o.push(PHm(cx-d/2,H*.3,d,d,{mask:'ellipse',sw:u*.6,stroke:th.a}),T_(n,cx-W*.1,H*.3+d+u*3,W*.2,u*3.8,{font:th.hf,bold:true,color:th.ink,align:'center'}),T_(r,cx-W*.1,H*.3+d+u*8,W*.2,u*3.4,{font:th.bf,color:th.a,align:'center',bold:true}))});return {bg:tbg(th),objs:o}};
SLD.swot=th=>(W,H,u)=>{const o=[];SB(th,o,W,H,u,'none');
  o.push(hd(th,'Where we stand',W*.07,H*.07,W*.86,u*7.4));
  [['Strengths','Loyal customers · Strong brand'],['Weaknesses','Limited reach · Manual work'],['Opportunities','New cities · Partnerships'],['Threats','New entrants · Rising costs']].forEach(([t,x_],i)=>{const x=W*.07+(i%2)*W*.4375,y=H*.27+Math.floor(i/2)*H*.34,w=W*.4125,h=H*.31,hl=i===0;o.push(SH('rect',x,y,w,h,hl?th.a:cardF(th),{r:u*(th.rad??2.6),op:hl?1:th.lt?1:.09}),T_(t,x+u*3,y+u*2.6,w-u*6,u*4.4,{font:th.hf,bold:true,color:hl?th.on:th.ink}),T_(x_,x+u*3,y+u*9,w-u*6,u*4,{font:th.bf,color:hl?th.on:th.mut,lh:1.5}))});return {bg:tbg(th),objs:o}};
SLD.quote=th=>(W,H,u)=>{const o=[];SB(th,o,W,H,u,'circles');
  o.push(T_('“',W*.07,H*.06,u*30,u*34,{font:th.hf,bold:true,color:th.a,lh:1}));
  const q=T_('The best way to predict the future is to create it.',W*.12,H*.32,W*.76,u*8.6,{font:th.hf,bold:!/Serif|Display|Rozha|Yatra|Fraunces|Playfair/.test(th.hf),color:th.ink,lh:1.25});o.push(q,T_('— Peter Drucker',W*.12,q.y+q.h+u*5,W*.6,u*3.8,{font:th.bf,bold:true,color:th.a}));return {bg:tbg(th),objs:o}};
SLD.pricing=th=>(W,H,u)=>{const o=[];SB(th,o,W,H,u,'none');
  o.push(hd(th,'Simple pricing',W*.07,H*.08,W*.86,u*8.4));
  [['Starter','₹499'],['Growth','₹1,499'],['Scale','₹3,999']].forEach(([n,p],i)=>{const x=W*.07+i*W*.2975,w=W*.27,hl=i===1,y=H*.28;o.push(SH('rect',x,y,w,H*.6,hl?th.a:cardF(th),{r:u*(th.rad??2.6),op:hl?1:th.lt?1:.09}),T_(n,x,y+u*3,w,u*4.2,{font:th.bf,bold:true,color:hl?th.on:th.a,align:'center',ls:12}),T_(p,x,y+u*9,w,u*11,{font:th.hf,bold:true,color:hl?th.on:th.ink,align:'center'}),T_('per month\n5 projects\nEmail support',x,y+u*24,w,u*3,{font:th.bf,color:hl?th.on:th.mut,align:'center',lh:1.7}))});return {bg:tbg(th),objs:o}};
SLD.timeline=th=>(W,H,u)=>{const o=[];SB(th,o,W,H,u,'none');
  o.push(hd(th,'Roadmap',W*.07,H*.1,W*.86,u*8.4),SH('rect',W*.07,H*.5,W*.86,u*.7,th.a,{op:.55}));
  [['Q1','Research'],['Q2','Prototype'],['Q3','Launch'],['Q4','Scale']].forEach(([q,t],i)=>{const x=W*.07+i*W*.2325;o.push(SH('ellipse',x,H*.5-u*2.2,u*5,u*5,th.a),T_(q,x,H*.5-u*10,W*.2,u*4.6,{font:th.hf,bold:true,color:th.ink}),T_(t,x,H*.5+u*5,W*.2,u*4,{font:th.bf,bold:true,color:th.a}),T_('Key milestone and owner notes go here.',x,H*.5+u*10.5,W*.2,u*3.5,{font:th.bf,color:th.mut,lh:1.45}))});return {bg:tbg(th),objs:o}};
SLD.thanks=th=>(W,H,u)=>{const o=[];SB(th,o,W,H,u);
  if(th.art)o.push(artAt(null,th.art,W*.5,H*.24,W*.12,H*.22,{},th.artc));
  o.push(hd(th,'Thank you',0,H*.4,W,u*17,{align:'center'}),T_('hello@yourcompany.com  ·  +91 00000 00000  ·  yourcompany.com',0,H*.72,W,u*3.4,{font:th.bf,color:th.mut,align:'center'}));return {bg:tbg(th),objs:o}};
const SLDN=[['cover','Cover'],['cover2','Title centred'],['agenda','Agenda'],['section','Section'],['content','Content + photo'],['cols3','Three columns'],['stats','Key numbers'],['process','Process'],['chart','Chart'],['team','Team'],['swot','SWOT'],['quote','Quote'],['pricing','Pricing'],['timeline','Roadmap'],['thanks','Thank you']];
DECKS.forEach(th=>SLDN.forEach(([k,n])=>add('Slides',`Deck · ${th.n} · ${n}`,[1920,1080],SLD[k](th),'presentation deck slide '+n.toLowerCase())));

/* more one-tap photo looks */
Object.assign(FILTERS,{golden:{sp:30,s:35,b:6,h:-10},matte:{c:-12,b:8,s:-10},dream:{b:10,c:-8,s:25,h:8},cinema:{c:25,s:-15,h:-12,b:-6},vintage:{sp:45,c:-8,s:-15,b:4},icy:{h:25,s:-5,b:6,c:8},bloom:{b:12,s:30,h:-4,c:-5},moody:{c:20,b:-14,s:-20},retro:{sp:55,s:40,h:-14,c:10},softbw:{gs:100,c:-10,b:10}});

/* ---------- context menus, design/folder actions (Canva-style) ---------- */
function ctxMenu(x,y,items){
  closeCtx();const m=el('div',{class:'ctx',role:'menu',id:'ctxm'});
  const build=(host,list)=>list.forEach(it=>{
    if(it==='-'){host.append(el('hr'));return}
    if(it.sub){const w=el('div',{class:'ctxs'});const b=el('button',{role:'menuitem',class:'sub'},it.label,el('span',{},'›'));const s=el('div',{class:'ctx subm'});build(s,it.sub);w.append(b,s);host.append(w);return}
    const b=el('button',{role:'menuitem',class:it.danger?'danger':'',disabled:!!it.off,onclick:()=>{closeCtx();it.go()}},it.label,it.key?el('em',{},it.key):'');host.append(b)});
  build(m,items);document.body.append(m);
  const r=m.getBoundingClientRect();m.style.left=Math.max(6,Math.min(x,innerWidth-r.width-6))+'px';m.style.top=Math.max(6,Math.min(y,innerHeight-r.height-6))+'px';
  if(x+r.width+190>innerWidth)m.classList.add('flip');
  setTimeout(()=>{window.addEventListener('pointerdown',ctxAway,true);window.addEventListener('keydown',ctxKey,true);window.addEventListener('blur',closeCtx);window.addEventListener('resize',closeCtx)},0);
}
function ctxAway(e){if(!e.target.closest||!e.target.closest('#ctxm'))closeCtx()}
function ctxKey(e){if(e.key==='Escape'){e.stopPropagation();closeCtx()}}
function closeCtx(){const m=document.getElementById('ctxm');if(m)m.remove();window.removeEventListener('pointerdown',ctxAway,true);window.removeEventListener('keydown',ctxKey,true);window.removeEventListener('blur',closeCtx);window.removeEventListener('resize',closeCtx)}
function menuAt(btn,items){const r=btn.getBoundingClientRect();ctxMenu(r.right-170,r.bottom+4,items)}

async function renameDesignFile(r,name){
  name=String(name||'').trim().slice(0,80);if(!name)return;
  if(D._file===r._file){D.name=name;$('#title').value=name;dirty=true;await saveDoc()}
  else{const x=await readDesign(r._file);delete x._file;x.name=name;await PUT().fs.write(r._file,JSON.stringify(x),{overwrite:true});fileCache.delete(r._file)}
  refreshDocs();toast('Renamed')}
async function duplicateDesignFile(r){try{commit();await saveDoc();const x=await readDesign(r._file);x.id=uid();x.name=r.name+' copy';x._file=null;loadRec(x);await saveDoc();showHome();toast('Duplicated')}catch(e){toast('Could not duplicate')}}
function deleteDesignFile(r){askSure('Delete “'+r.name+'”? This removes the file from Files › Designs.','Delete',async()=>{try{await PUT().fs.delete(r._file);fileCache.delete(r._file);if(D._file===r._file)D._file=null}catch(e){toast('Could not delete');return}refreshDocs();toast('Deleted')})}
async function downloadDesignFile(r){try{const b=await PUT().fs.read(r._file);downloadBlob(safeName(r.name)+'.design',b)}catch(e){toast('Could not download')}}
async function moveDesignTo(r,f){try{await moveDesign(r._file,f);toast(f?'Moved to '+f:'Moved to Projects');refreshDocs()}catch(e){toast('Could not move')}}
function newFolderFor(r){askText('New folder','','Create & move',async n=>{try{const f=await makeFolder(n);if(r)await moveDesign(r._file,f);await refreshDocs();toast('Moved to '+f)}catch(e){toast('Could not create that folder')}})}
function designMenuItems(r){
  const open=()=>r.id===D.id&&!document.getElementById('home').hidden?hideHome():openDesignFile(r._file);
  const mv=[...(r.folder?[{label:'Projects (top level)',go:()=>moveDesignTo(r,'')}]:[]),...home.dirs.filter(d=>d!==r.folder).map(d=>({label:'📁 '+d,go:()=>moveDesignTo(r,d)})),{label:'＋ New folder…',go:()=>newFolderFor(r)}];
  return [{label:'Open',go:open},{label:r.starred?'Remove star':'Star',go:()=>setStar(r,!r.starred)},{label:'Rename',go:()=>askText('Rename design',r.name,'Rename',n=>renameDesignFile(r,n))},{label:'Make a copy',go:()=>duplicateDesignFile(r)},{label:'Move to folder',sub:mv},{label:'Download (.design)',go:()=>downloadDesignFile(r)},'-',{label:'Move to trash',danger:true,go:async()=>{if(await trashDesign(r)){refreshDocs();toast('Moved to trash. Restore it from Trash.')}}}]}
function folderMenuItems(d){return [{label:'Open',go:()=>{home.folder=d;renderHome()}},{label:'Rename',go:()=>askText('Rename folder',d,'Rename',async n=>{try{await renameFolder(d,n);await refreshDocs()}catch(e){toast('Could not rename')}})},'-',{label:'Delete folder',danger:true,go:()=>askSure('Delete the folder “'+d+'”? The designs inside move back to Projects; none are deleted.','Delete folder',async()=>{try{await removeFolder(d);if(home.folder===d)home.folder='';await refreshDocs();toast('Folder deleted')}catch(e){toast('Could not delete the folder')}})}]}
function wireDesignCard(card,r){
  const tn=card.querySelector('.tn');card.dataset.file=r._file;const st=el('button',{class:'star'+(r.starred?' on':''),'aria-label':(r.starred?'Remove star from ':'Star ')+r.name,'aria-pressed':!!r.starred,onclick:e=>{e.stopPropagation();setStar(r,!r.starred)}},r.starred?'★':'☆');card.append(st);if(home.selMode){card.classList.add('selmode');if(home.sel.has(r._file))card.classList.add('sel')}
  card.addEventListener('click',e=>{if(!home.selMode||e.target.closest('.dots,.star'))return;e.preventDefault();e.stopPropagation();home.sel.has(r._file)?home.sel.delete(r._file):home.sel.add(r._file);renderHome()},true);
const more=el('button',{class:'dots','aria-label':'More actions for '+r.name,title:'More',onclick:e=>{e.stopPropagation();menuAt(more,designMenuItems(r))}},'⋯');const del=el('button',{class:'delb','aria-label':'Move '+r.name+' to trash',title:'Move to trash',onclick:async e=>{e.stopPropagation();if(await trashDesign(r)){refreshDocs();toast('Moved to trash. Restore it from Trash.')}}},'🗑');card.append(del,more);
  card.addEventListener('contextmenu',e=>{e.preventDefault();ctxMenu(e.clientX,e.clientY,designMenuItems(r))});
  card.draggable=true;card.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/x-design',r._file);e.dataTransfer.effectAllowed='move';card.classList.add('drag')});card.addEventListener('dragend',()=>card.classList.remove('drag'));
}
function wireFolderCard(card,d){
  const more=el('button',{class:'dots','aria-label':'More actions for folder '+d,onclick:e=>{e.stopPropagation();menuAt(more,folderMenuItems(d))}},'⋯');card.append(more);
  card.addEventListener('contextmenu',e=>{e.preventDefault();ctxMenu(e.clientX,e.clientY,folderMenuItems(d))});
  dropTarget(card,d);
}
function dropTarget(node,folder){
  node.addEventListener('dragover',e=>{if([...e.dataTransfer.types].includes('text/x-design')){e.preventDefault();node.classList.add('over')}});
  node.addEventListener('dragleave',()=>node.classList.remove('over'));
  node.addEventListener('drop',async e=>{node.classList.remove('over');const f=e.dataTransfer.getData('text/x-design');if(!f)return;e.preventDefault();try{await moveDesign(f,folder);toast(folder?'Moved to '+folder:'Moved to Projects');refreshDocs()}catch(x){toast('Could not move')}});
}

/* right-click on the canvas */
function canvasMenu(e){
  e.preventDefault();if(typeof tool!=='undefined'&&tool!=='select')return;
  const p=toDoc(e.clientX,e.clientY);const hit=pickAt(p.x,p.y);
  if(hit&&!sel.includes(hit.id)){sel=[hit.id];selChanged()}
  const so=selObjs();const locked=so.length&&so.every(o=>o.locked);
  const items=[];
  if(so.length){
    items.push({label:'Copy',key:'Ctrl C',go:copySel},{label:'Paste',key:'Ctrl V',off:!clip.length,go:pasteClip},{label:'Duplicate',key:'Ctrl D',off:locked,go:dupSel},{label:'Delete',key:'Del',danger:true,off:locked,go:removeSel},'-');
    items.push({label:'Arrange',sub:[{label:'Bring to front',go:()=>order('front')},{label:'Bring forward',go:()=>order('fwd')},{label:'Send backward',go:()=>order('bwd')},{label:'Send to back',go:()=>order('back')}]});
    if(so.length>1)items.push({label:'Group',key:'Ctrl G',go:groupSel});
    if(so.some(o=>o.type==='group'))items.push({label:'Ungroup',go:ungroupSel});
    items.push({label:locked?'Unlock':'Lock',go:()=>{const v=!locked;so.forEach(o=>o.locked=v);touch();selChanged()}});
    if(so.length===1&&so[0].type==='image')items.push('-',{label:'Replace image…',go:()=>{const i=el('input',{type:'file',accept:'image/*'});i.onchange=async()=>{const a=i.files[0]&&await ingestImage(i.files[0]);if(a){so[0].src=a.id;touch();renderInsp()}};i.click()}});
  }else{
    items.push({label:'Paste',key:'Ctrl V',off:!clip.length,go:pasteClip},{label:'Add page',go:()=>addPage()},{label:'Duplicate this page',go:()=>dupPage(cur)});
  }
  ctxMenu(e.clientX,e.clientY,items);
}

/* ---------- Home: trash, stars, sort, list view, multi-select ---------- */
const TRASHDIR='.trash',TRASH_DAYS=30;
async function trashDesign(r){
  try{await moveDesign(r._file,TRASHDIR)}catch(e){toast('Could not move to trash');return false}
  if(D._file&&D._file.endsWith('/'+r._file.split('/').pop())){D._file=null;D.id=uid();dirty=false}
  home.sel.delete(r._file);return true}
async function listTrash(){
  let it=[];try{it=await PUT().fs.readdir(DIR+'/'+TRASHDIR)}catch(e){return []}
  const out=[],now=Date.now();
  for(const f of it.filter(i=>!i.is_dir&&/\.design$/i.test(i.name))){
    let m=f.modified||0;m=m>1e11?m:m*1000;
    if(m&&now-m>TRASH_DAYS*864e5){try{await PUT().fs.delete(f.path)}catch(e){}continue}
    try{const r=await readDesign(f.path);out.push({id:r.id,name:r.name,w:r.w,h:r.h,pages:r.pages.length,updated:r.updated||0,thumb:r.thumb||'',_file:f.path,trashed:m||now})}catch(e){}}
  return out.sort((a,b)=>b.trashed-a.trashed)}
async function restoreDesign(r){try{await moveDesign(r._file,'');toast('Restored to Projects');renderTrash()}catch(e){toast('Could not restore')}}
function purgeDesign(r){askSure('Delete “'+r.name+'” forever? This cannot be undone.','Delete forever',async()=>{try{await PUT().fs.delete(r._file);fileCache.delete(r._file)}catch(e){}renderTrash();toast('Deleted forever')})}
function emptyTrash(list){if(!list.length)return;askSure('Delete all '+list.length+' design'+(list.length>1?'s':'')+' in the trash forever?','Empty trash',async()=>{for(const r of list){try{await PUT().fs.delete(r._file)}catch(e){}}renderTrash();toast('Trash emptied')})}
async function renderTrash(){if(home.view!=='trash')return;home.trash=await listTrash();const b=document.getElementById('hsections');if(b){b.innerHTML='';b.append(...homeSections())}}
async function setStar(r,v){
  try{if(D._file===r._file){D.starred=v;dirty=true;await saveDoc()}else{const x=await readDesign(r._file);delete x._file;x.starred=v;await PUT().fs.write(r._file,JSON.stringify(x),{overwrite:true});fileCache.delete(r._file)}}catch(e){toast('Could not update');return}
  refreshDocs();toast(v?'Starred':'Removed from starred')}
function trashCard(r){
  const c=el('div',{class:'hc'},el('div',{class:'tn'},r.thumb?el('img',{src:r.thumb,alt:''}):null),el('b',{title:r.name},r.name),el('small',{},'Deleted '+fmtDate(r.trashed)+' · auto-removes after '+TRASH_DAYS+' days'),
    el('div',{class:'row',style:'display:flex;gap:6px;margin-top:6px'},el('button',{class:'btn sm',onclick:()=>restoreDesign(r)},'Restore'),el('button',{class:'btn sm danger',onclick:()=>purgeDesign(r)},'Delete forever')));
  return c}
function trashView(){
  const out=[],list=home.trash;
  out.push(el('div',{class:'hs'},el('h2',{},'Trash'),el('span',{class:'grow'}),list&&list.length?el('button',{class:'more',onclick:()=>emptyTrash(list)},'Empty trash'):null));
  if(!list){out.push(el('p',{class:'note'},'Loading…'));renderTrash();return out}
  out.push(list.length?el('div',{class:'hg big'},list.map(trashCard)):el('div',{class:'hempty'},'Trash is empty. Designs you delete stay here for '+TRASH_DAYS+' days so you can restore them.'));
  return out}
function sortDocs(list){const s=home.sort;return list.slice().sort((a,b)=>s==='name'?a.name.localeCompare(b.name):s==='size'?(b.w*b.h)-(a.w*a.h):s==='pages'?b.pages-a.pages:b.updated-a.updated)}
function projectsToolbar(){
  const chip=(k,l)=>el('button',{class:'chip','aria-pressed':home.filter===k,onclick:()=>{home.filter=k;renderHome()}},l);
  const sort=el('select',{class:'f','aria-label':'Sort designs',style:'width:auto;height:34px',onchange:()=>{home.sort=sort.value;renderHome()}},...[['updated','Last modified'],['name','Name'],['size','Canvas size'],['pages','Pages']].map(([k,l])=>el('option',{value:k,selected:home.sort===k},l)));
  const bar=el('div',{class:'hchips',style:'align-items:center;margin:2px 0 12px'},chip('all','All'),chip('starred','★ Starred'),el('span',{class:'grow'}),sort,
    el('button',{class:'chip','aria-pressed':!!home.list,'aria-label':'List view',title:'List view',onclick:()=>{home.list=!home.list;renderHome()}},home.list?'▤ List':'▦ Grid'),
    el('button',{class:'chip','aria-pressed':home.selMode,onclick:()=>{home.selMode=!home.selMode;home.sel.clear();renderHome()}},home.selMode?'Done':'Select'));
  return bar}
function selBar(list){
  if(!home.selMode)return null;
  const files=[...home.sel];const n=files.length;const byFile=Object.fromEntries((home.docs||[]).map(r=>[r._file,r]));
  const mv=el('select',{class:'f','aria-label':'Move selected to',style:'width:auto;height:34px',disabled:!n,onchange:async()=>{if(mv.value==='__')return;const t=mv.value==='__top'?'':mv.value;for(const f of files)try{await moveDesign(f,t)}catch(e){}home.sel.clear();toast('Moved '+n);refreshDocs()}},el('option',{value:'__'},'Move to…'),el('option',{value:'__top'},'Projects (top level)'),...home.dirs.map(d=>el('option',{value:d},'📁 '+d)));
  return el('div',{class:'selbar',role:'toolbar','aria-label':'Selected designs'},el('b',{},n?n+' selected':'Click designs to select them'),el('button',{class:'btn sm',onclick:()=>{list.forEach(r=>home.sel.add(r._file));renderHome()}},'Select all'),mv,
    el('button',{class:'btn sm',disabled:!n,onclick:async()=>{for(const f of files)if(byFile[f])await trashDesign(byFile[f]);home.sel.clear();toast(n+' moved to trash');refreshDocs()}},'Move to trash'))}

/* ---------- editor extras: duotone, palette, colours, links, notes, transitions, history, page grid, print guides ---------- */
const DUOS=[['Sunset','#2b1055','#ff8e53'],['Ocean','#06283d','#7dd3fc'],['Berry','#3a0ca3','#f72585'],['Forest','#0b3d2e','#d9f99d'],['Gold','#1c1c1c','#f5c542'],['Mono blue','#0a1f44','#e0ecff'],['Rose','#4a0d2a','#ffd1dc'],['Mint','#064e3b','#a7f3d0']];
const duoCache=new Map();
function hex2rgb(h){h=String(h||'#000').replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16)||0;return[n>>16&255,n>>8&255,n&255]}
function duoDraw(ctx,img,o,dx,dy,dw,dh,fs){
  const k=Math.min(1,1400/Math.max(o.w,o.h,1)),W=Math.max(2,Math.round(o.w*k)),H=Math.max(2,Math.round(o.h*k));
  const key=[img.src.length,img.src.slice(-40),W,H,Math.round(dx),Math.round(dy),Math.round(dw),o.duo.a,o.duo.b,fs].join('|');
  let c=duoCache.get(key);
  if(!c){c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');if(fs!=='none')x.filter=fs;x.drawImage(img,dx*k,dy*k,dw*k,dh*k);x.filter='none';
    const id=x.getImageData(0,0,W,H),d=id.data,A=hex2rgb(o.duo.a),B=hex2rgb(o.duo.b);
    for(let i=0;i<d.length;i+=4){const l=(d[i]*.299+d[i+1]*.587+d[i+2]*.114)/255;d[i]=A[0]+(B[0]-A[0])*l;d[i+1]=A[1]+(B[1]-A[1])*l;d[i+2]=A[2]+(B[2]-A[2])*l}
    x.putImageData(id,0,0);duoCache.set(key,c);if(duoCache.size>8)duoCache.delete(duoCache.keys().next().value)}
  ctx.drawImage(c,0,0,o.w,o.h)}
function duoUI(I){
  const f=first(I);const on=!!(f.duo&&f.duo.a);
  const set=d=>{each(x=>x.duo=d,I);renderInsp()};
  return el('div',{class:'sec'},el('h4',{},'Duotone'),el('div',{class:'chips'},el('button',{class:'chip','aria-pressed':!on,onclick:()=>set(null)},'Off'),...DUOS.map(([n,a,b])=>el('button',{class:'chip','aria-pressed':on&&f.duo.a===a&&f.duo.b===b,title:n,style:`background:linear-gradient(90deg,${a},${b});color:#fff;border-color:transparent`,onclick:()=>set({a,b})},n))),
    on?el('div',{class:'row'},el('label',{},'Shadows'),colorBtn(()=>f.duo.a,c=>each(x=>x.duo={a:c,b:(x.duo||f.duo).b},I)),el('label',{},'Highlights'),colorBtn(()=>f.duo.b,c=>each(x=>x.duo={a:(x.duo||f.duo).a,b:c},I))):null)}

/* palette from a photo */
function paletteOf(img,n=6){
  const s=64,c=document.createElement('canvas');c.width=c.height=s;const x=c.getContext('2d');x.drawImage(img,0,0,s,s);const d=x.getImageData(0,0,s,s).data;
  let px=[];for(let i=0;i<d.length;i+=4)if(d[i+3]>200)px.push([d[i],d[i+1],d[i+2]]);
  const split=(box,depth)=>{if(depth===0||box.length<2)return[box];let mn=[255,255,255],mx=[0,0,0];box.forEach(p=>{for(let k=0;k<3;k++){mn[k]=Math.min(mn[k],p[k]);mx[k]=Math.max(mx[k],p[k])}});const r=[0,1,2].map(k=>mx[k]-mn[k]),ch=r.indexOf(Math.max(...r));box=box.slice().sort((a,b)=>a[ch]-b[ch]);const m=box.length>>1;return[...split(box.slice(0,m),depth-1),...split(box.slice(m),depth-1)]};
  const boxes=split(px,3).filter(b=>b.length);
  const cols=boxes.map(b=>{const m=[0,1,2].map(k=>Math.round(b.reduce((a,p)=>a+p[k],0)/b.length));return{m,n:b.length}}).sort((a,b)=>b.n-a.n);
  const hex=m=>'#'+m.map(v=>v.toString(16).padStart(2,'0')).join('');
  const out=[];for(const c of cols){const h=hex(c.m);if(!out.some(o=>colDist(hex2rgb(o),c.m)<40))out.push(h)}
  return out.slice(0,n)}
const colDist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
const lumOf=h=>{const[r,g,b]=hex2rgb(h);return .299*r+.587*g+.114*b};
const hexOk=v=>typeof v==='string'&&/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v);
const norm6=v=>{v=v.toLowerCase();return v.length===4?'#'+v.slice(1).split('').map(c=>c+c).join(''):v};
function eachColorSlot(fn){
  const walk=o=>{['fill','color','stroke','bgc','hl','shadow','tint'].forEach(k=>{const v=o[k];if(hexOk(v))o[k]=fn(norm6(v));else if(v&&typeof v==='object'&&hexOk(v.c1)){v.c1=fn(norm6(v.c1));if(hexOk(v.c2))v.c2=fn(norm6(v.c2))}});if(o.type==='group'&&o.kids)o.kids.forEach(walk)};
  D.pages.forEach(p=>{const b=p.bg;if(b){if(hexOk(b.c))b.c=fn(norm6(b.c));if(hexOk(b.c1))b.c1=fn(norm6(b.c1));if(hexOk(b.c2))b.c2=fn(norm6(b.c2))}p.objs.forEach(walk)})}
function designColors(){const m=new Map();eachColorSlot(c=>{m.set(c,(m.get(c)||0)+1);return c});return[...m.entries()].sort((a,b)=>b[1]-a[1]).map(e=>e[0]).slice(0,16)}
function replaceColor(a,b){commit();eachColorSlot(c=>c===a?b:c);dirty=true;touch();renderAll()}
function recolorWith(pal){
  if(!pal.length)return;commit();const cols=designColors().sort((a,b)=>lumOf(a)-lumOf(b)),ps=pal.slice().sort((a,b)=>lumOf(a)-lumOf(b));
  const map=new Map();cols.forEach((c,i)=>map.set(c,ps[Math.min(ps.length-1,Math.round(i*(ps.length-1)/Math.max(1,cols.length-1)))]));
  eachColorSlot(c=>map.get(c)||c);dirty=true;touch();renderAll();toast('Design recoloured with the palette')}
function paletteUI(I){
  const f=first(I);const img=f.src&&getImg(f.src);if(!img||!img.complete||!img.naturalWidth)return null;
  let pal=[];try{pal=paletteOf(img)}catch(e){return null}
  return el('div',{class:'sec'},el('h4',{},'Colours in this photo'),el('div',{class:'row',style:'flex-wrap:wrap;gap:6px'},pal.map(h=>el('button',{class:'sw',style:'background:'+h,title:'Copy '+h,'aria-label':'Photo colour '+h,onclick:()=>{try{navigator.clipboard.writeText(h)}catch(e){}toast(h+' copied')}}))),
    el('button',{class:'btn sm',onclick:()=>recolorWith(pal)},'Recolour my design with these'),
    el('button',{class:'btn sm',onclick:()=>{pal.forEach(h=>{if(!brand.colors.includes(h))brand.colors.push(h)});saveBrand();toast('Added to your Brand Kit')}},'Add to Brand Kit'))}

/* hyperlinks */
function linkUI(so){
  if(!so.length)return null;const f=so[0];const inp=el('input',{class:'f',placeholder:'https://…  or  page:2',value:f.href||'','aria-label':'Link','aria-describedby':'lnkh'});
  inp.addEventListener('change',()=>{const v=inp.value.trim();so.forEach(o=>{if(v)o.href=/^(https?:|mailto:|tel:|page:)/i.test(v)?v:(/^page:?\d+$/i.test(v)?'page:'+v.replace(/\D/g,''):'https://'+v);else delete o.href});touch();toast(v?'Link added. It works in Present mode and exported HTML/PDF viewers that support links.':'Link removed');renderInsp()});
  return sec('Link',inp,el('small',{id:'lnkh',class:'note'},'Web address, or page:2 to jump to a page when presenting.'))}
function openHref(h){if(!h)return false;const m=String(h).match(/^page:(\d+)$/i);if(m)return{page:Math.max(0,+m[1]-1)};if(/^(https?:|mailto:|tel:)/i.test(h)){try{window.open(h,'_blank','noopener')}catch(e){}return true}return false}

/* presenter: notes, timer, transitions, laser, pen */
const TRANS=[['none','None'],['fade','Fade'],['slide','Slide'],['push','Push'],['zoom','Zoom'],['wipe','Wipe']];
function pageExtras(){
  const p=D.pages[cur];if(!p)return null;
  const notes=el('textarea',{class:'f',rows:4,placeholder:'Speaker notes for this page (shown in Present with N)','aria-label':'Speaker notes',value:p.notes||''});notes.addEventListener('input',()=>{p.notes=notes.value;dirty=true;clearTimeout(pageExtras.t);pageExtras.t=setTimeout(()=>{touch()},500)});
  const tr=el('select',{class:'f','aria-label':'Page transition',onchange:()=>{p.trans=tr.value;touch()}},...TRANS.map(([k,l])=>el('option',{value:k,selected:(p.trans||'none')===k},l)));
  const cols=designColors();
  return el('div',{class:'sec'},el('h4',{},'Present & colours'),el('label',{class:'note'},'Transition into this page'),tr,
    el('button',{class:'btn sm',onclick:()=>{D.pages.forEach(x=>x.trans=tr.value);touch();toast('Transition applied to every page')}},'Apply to all pages'),
    el('label',{class:'note'},'Speaker notes'),notes,
    cols.length?el('div',{},el('label',{class:'note'},'Colours in this design (change one to change it everywhere)'),el('div',{class:'row',style:'flex-wrap:wrap;gap:6px'},cols.map(c=>{const i=el('input',{type:'color',value:c,'aria-label':'Replace '+c,style:'width:30px;height:30px;padding:0;border:1px solid var(--line);border-radius:50%;background:none;cursor:pointer'});i.addEventListener('change',()=>replaceColor(c,i.value.toLowerCase()));return i}))):null,
    el('div',{class:'row'},el('button',{class:'btn grow',onclick:openPageGrid},'Page grid'),el('button',{class:'btn grow',onclick:openHistory},'Version history')),
    el('button',{class:'btn wide',onclick:openBulk},'Bulk create from a spreadsheet (CSV)'),commentsUI(),
    el('label',{class:'row note',style:'gap:8px'},el('input',{type:'checkbox',checked:!!D.printGuides,onchange:e=>{D.printGuides=e.target.checked;dirty=true;renderUI()}}),'Show bleed & safe-area guides'))}
function drawPrintGuides(ctx,z){
  if(!D.printGuides)return;const pm=D.w>=1500?11.81:3.78,b=3*pm,s=b+5*pm,x0=view.px,y0=view.py,w=D.w*z,h=D.h*z;
  ctx.save();ctx.lineWidth=1;ctx.setLineDash([6,4]);ctx.strokeStyle='#e03131';ctx.strokeRect(x0+b*z,y0+b*z,w-2*b*z,h-2*b*z);ctx.strokeStyle='#2f9e44';ctx.strokeRect(x0+s*z,y0+s*z,w-2*s*z,h-2*s*z);ctx.setLineDash([]);ctx.font='11px sans-serif';ctx.fillStyle='#e03131';ctx.fillText('bleed 3 mm',x0+b*z+4,y0+b*z+12);ctx.fillStyle='#2f9e44';ctx.fillText('safe area',x0+s*z+4,y0+s*z+12);ctx.restore()}

function presentShow(){
  commit();ensureAssets().then(()=>{
    let i=cur,prev=-1,tT=0,t0=performance.now(),raf=0,start=performance.now(),showNotes=false,laser=false,pen=false,mx=-1,my=-1,ink=[],stroke=null;
    const wrap=el('div',{id:'present'});const cv=el('canvas');const lab=el('span',{style:'min-width:54px;text-align:center'});const clock=el('span',{style:'min-width:46px;text-align:center;font-variant-numeric:tabular-nums;opacity:.85'});
    const notesEl=el('div',{style:'position:absolute;left:0;right:0;bottom:64px;max-height:34vh;overflow:auto;margin:0 auto;max-width:820px;background:#000c;color:#fff;border-radius:12px;padding:12px 16px;font-size:16px;line-height:1.5;white-space:pre-wrap',hidden:true});
    const lz=el('div',{style:'position:absolute;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:radial-gradient(#ff2020,#ff202080 55%,transparent 70%);pointer-events:none',hidden:true});
    const geo=()=>{const W=innerWidth,H=innerHeight,dp=devicePixelRatio||1,sc=Math.min(W/D.w,H/D.h)*dp;return{W,H,dp,sc}};
    const page=(x,idx,sc,age)=>{const p=D.pages[idx];x.fillStyle='#fff';x.fillRect(0,0,D.w,D.h);drawPageContent(x,p,D.w,D.h,{s:sc,t:pageHasAnim(p)?(performance.now()-t0)/1000:null})};
    const draw=()=>{const{W,H,dp,sc}=geo();if(cv.width!==Math.round(D.w*sc)||cv.height!==Math.round(D.h*sc)){cv.width=Math.round(D.w*sc);cv.height=Math.round(D.h*sc);cv.style.width=cv.width/dp+'px';cv.style.height=cv.height/dp+'px'}
      const x=cv.getContext('2d');x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,cv.width,cv.height);x.scale(sc,sc);
      const p=D.pages[i],tr=p.trans||'none',k=prev>=0&&tr!=='none'?Math.min(1,(performance.now()-tT)/520):1,e=1-Math.pow(1-k,3);
      if(k<1){const W0=D.w,H0=D.h;
        if(tr==='fade'){page(x,prev,sc);x.globalAlpha=e;page(x,i,sc);x.globalAlpha=1}
        else if(tr==='slide'||tr==='push'){const dir=i>prev?1:-1;if(tr==='push'){x.save();x.translate(-dir*W0*e,0);page(x,prev,sc);x.restore()}else page(x,prev,sc);x.save();x.translate(dir*W0*(1-e),0);page(x,i,sc);x.restore()}
        else if(tr==='zoom'){page(x,prev,sc);x.save();x.globalAlpha=e;x.translate(W0/2,H0/2);x.scale(.85+.15*e,.85+.15*e);x.translate(-W0/2,-H0/2);page(x,i,sc);x.restore()}
        else if(tr==='wipe'){page(x,prev,sc);x.save();x.beginPath();x.rect(0,0,W0*e,H0);x.clip();page(x,i,sc);x.restore()}
      }else page(x,i,sc);
      x.setTransform(sc,0,0,sc,0,0);ink.filter(s=>s.page===i).forEach(s=>{x.strokeStyle=s.c;x.lineWidth=s.w;x.lineCap=x.lineJoin='round';x.beginPath();s.p.forEach((q,j)=>j?x.lineTo(q[0],q[1]):x.moveTo(q[0],q[1]));x.stroke()});
      lab.textContent=`${i+1} / ${D.pages.length}`;const sec=Math.floor((performance.now()-start)/1000);clock.textContent=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');
      notesEl.hidden=!showNotes;if(showNotes)notesEl.textContent=p.notes||'No notes for this page.'};
    const loop=()=>{draw();raf=requestAnimationFrame(loop)};
    const go=d=>{const n=clamp(i+d,0,D.pages.length-1);if(n!==i){prev=i;i=n;t0=performance.now();tT=t0}};
    const jump=n=>{n=clamp(n,0,D.pages.length-1);if(n!==i){prev=i;i=n;t0=performance.now();tT=t0}};
    const end=()=>{cancelAnimationFrame(raf);document.removeEventListener('keydown',key,true);wrap.remove();try{document.fullscreenElement&&document.exitFullscreen()}catch(e){}};
    const key=e=>{const k=e.key;if(k==='Escape'){e.stopPropagation();end()}else if(['ArrowRight','ArrowDown',' ','PageDown'].includes(k)){e.preventDefault();e.stopPropagation();go(1)}else if(['ArrowLeft','ArrowUp','PageUp'].includes(k)){e.preventDefault();e.stopPropagation();go(-1)}
      else if(k==='n'||k==='N'){showNotes=!showNotes}else if(k==='l'||k==='L'){laser=!laser;lz.hidden=!laser;cv.style.cursor=laser?'none':''}else if(k==='d'||k==='D'){pen=!pen;cv.style.cursor=pen?'crosshair':''}else if(k==='e'||k==='E'){ink=ink.filter(s=>s.page!==i)}};
    document.addEventListener('keydown',key,true);
    const pt=e=>{const r=cv.getBoundingClientRect();return[(e.clientX-r.left)/r.width*D.w,(e.clientY-r.top)/r.height*D.h]};
    cv.addEventListener('pointermove',e=>{if(laser){lz.hidden=false;lz.style.left=e.clientX+'px';lz.style.top=e.clientY+'px'}if(stroke){stroke.p.push(pt(e))}});
    cv.addEventListener('pointerdown',e=>{if(pen){stroke={page:i,c:'#ff3b30',w:Math.max(4,D.w/220),p:[pt(e)]};ink.push(stroke);cv.setPointerCapture(e.pointerId)}});
    cv.addEventListener('pointerup',()=>{stroke=null});
    cv.addEventListener('click',e=>{if(pen)return;const[px,py]=pt(e);const os=D.pages[i].objs;for(let k=os.length-1;k>=0;k--){const o=os[k];if(o.href&&px>=o.x&&px<=o.x+o.w&&py>=o.y&&py<=o.y+o.h){const r=openHref(o.href);if(r&&r.page!==undefined)jump(r.page);if(r)return}}go(1)});
    const bt=(t,l,f)=>el('button',{title:t,'aria-label':t,onclick:f},l);
    wrap.append(cv,notesEl,lz,el('div',{class:'pc'},el('button',{'aria-label':'Previous',html:ic('left',18),onclick:()=>go(-1)}),lab,el('button',{'aria-label':'Next',html:ic('right',18),onclick:()=>go(1)}),clock,bt('Speaker notes (N)','Notes',()=>{showNotes=!showNotes}),bt('Laser pointer (L)','Laser',()=>{laser=!laser;lz.hidden=!laser}),bt('Draw (D), erase (E)','Pen',()=>{pen=!pen;cv.style.cursor=pen?'crosshair':''}),el('button',{'aria-label':'Exit',html:ic('close',18),onclick:end})));
    document.body.append(wrap);loop();try{wrap.requestFullscreen&&wrap.requestFullscreen().catch(()=>{})}catch(e){}
  })}

/* page grid (drag to reorder) */
function openPageGrid(){
  const body=el('div',{style:'display:grid;gap:12px;min-width:min(720px,86vw)'});openModal(body);
  const draw=()=>{body.innerHTML='';const g=el('div',{style:'display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;max-height:62vh;overflow:auto'});
    D.pages.forEach((p,n)=>{let c;try{c=renderPageTo(p,150/Math.max(D.w,D.h))}catch(e){c=document.createElement('canvas')}c.style.cssText='max-width:100%;border:1px solid var(--line);border-radius:6px;background:#fff';
      const card=el('div',{draggable:true,'aria-label':'Page '+(n+1),style:'display:grid;gap:4px;justify-items:center;padding:6px;border-radius:10px;cursor:grab;'+(n===cur?'outline:2px solid var(--accent)':'')},c,el('small',{},'Page '+(n+1)),el('div',{style:'display:flex;gap:4px'},el('button',{class:'btn sm',onclick:()=>{closeModal();switchPage(n)}},'Open'),el('button',{class:'btn sm',onclick:()=>{dupPage(n);draw()}},'Copy'),D.pages.length>1?el('button',{class:'btn sm danger',onclick:()=>{delPage(n);draw()}},'Delete'):null));
      card.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/x-page',String(n))});card.addEventListener('dragover',e=>e.preventDefault());
      card.addEventListener('drop',e=>{e.preventDefault();const f=+e.dataTransfer.getData('text/x-page');if(isNaN(f)||f===n)return;commit();const cp=D.pages[cur];const [m]=D.pages.splice(f,1);D.pages.splice(n,0,m);cur=D.pages.indexOf(cp);dirty=true;commit();renderAll();draw()});g.append(card)});
    body.append(dlgHead('Pages'),el('p',{class:'note'},'Drag a page onto another to reorder.'),g,el('div',{style:'display:flex;gap:8px;justify-content:flex-end'},el('button',{class:'btn',onclick:()=>{addPage();draw()}},'Add page'),el('button',{class:'btn primary',onclick:closeModal},'Done')))};
  draw()}

/* version history (snapshots in Files › Designs/.versions) */
const VERDIR=()=>DIR+'/.versions';
let lastSnap=0;
async function snapshotDesign(force){
  if(!D._file||!PUT()||(!force&&Date.now()-lastSnap<10*60*1000))return false;lastSnap=Date.now();
  try{const b=await PUT().fs.read(D._file);await PUT().fs.write(VERDIR()+'/'+D.id.slice(-8)+'-'+Date.now()+'.design',b,{createMissingParents:true,overwrite:true});
    const l=(await PUT().fs.readdir(VERDIR())).filter(x=>x.name.startsWith(D.id.slice(-8)+'-')).sort((a,b)=>a.name.localeCompare(b.name));for(const x of l.slice(0,Math.max(0,l.length-20)))try{await PUT().fs.delete(x.path)}catch(e){}return true}catch(e){return false}}
async function listVersions(){let l=[];try{l=await PUT().fs.readdir(VERDIR())}catch(e){return[]}l=l.filter(x=>D.id&&x.name.startsWith(D.id.slice(-8)+'-')).sort((a,b)=>b.name.localeCompare(a.name));const out=[];for(const x of l){try{const r=await readDesign(x.path);out.push({file:x.path,ts:+x.name.split('-')[1].replace('.design',''),name:r.name,thumb:r.thumb||'',pages:r.pages.length})}catch(e){}}return out}
async function openHistory(){
  commit();await saveDoc();const body=el('div',{style:'display:grid;gap:12px;min-width:min(560px,86vw)'});openModal(body);
  const draw=async()=>{const vs=await listVersions();body.innerHTML='';
    body.append(dlgHead('Version history'),el('p',{class:'note'},'A snapshot is saved automatically at most every 10 minutes while you edit. The last 20 are kept.'),el('button',{class:'btn',onclick:async()=>{await saveDoc();await snapshotDesign(true);draw();toast('Version saved')}},'Save a version now'));
    body.append(vs.length?el('div',{style:'display:grid;gap:8px;max-height:52vh;overflow:auto'},vs.map(v=>el('div',{style:'display:flex;gap:12px;align-items:center;border:1px solid var(--line);border-radius:10px;padding:6px 10px'},v.thumb?el('img',{src:v.thumb,alt:'',style:'width:64px;height:48px;object-fit:contain;background:#fff;border-radius:6px'}):null,el('div',{style:'flex:1'},el('b',{},new Date(v.ts).toLocaleString()),el('div',{class:'note'},v.pages+' page'+(v.pages>1?'s':''))),
      el('button',{class:'btn sm',onclick:()=>askSure('Restore this version? Your current design is saved as a version first.','Restore',async()=>{await snapshotDesign(true);try{const r=await readDesign(v.file);const keep=D._file,id=D.id;r.id=id;loadRec({...r,_file:keep});dirty=true;await saveDoc();closeModal();toast('Version restored')}catch(e){toast('Could not restore')}})},'Restore')))):el('div',{class:'hempty'},'No versions yet.'))};
  draw()}
setInterval(()=>{if(typeof dirty!=='undefined'&&!dirty&&D&&D._file)snapshotDesign(false)},60000);

/* ---------- collage grids, bulk create (CSV), smart template search, brand kits, comments ---------- */
const COLLAGES=[
 ['2 side by side',[[0,0,.5,1],[.5,0,.5,1]]],['2 stacked',[[0,0,1,.5],[0,.5,1,.5]]],['3 columns',[[0,0,1/3,1],[1/3,0,1/3,1],[2/3,0,1/3,1]]],['3 rows',[[0,0,1,1/3],[0,1/3,1,1/3],[0,2/3,1,1/3]]],
 ['2 × 2',[[0,0,.5,.5],[.5,0,.5,.5],[0,.5,.5,.5],[.5,.5,.5,.5]]],['1 big + 2',[[0,0,.6,1],[.6,0,.4,.5],[.6,.5,.4,.5]]],['1 big + 3',[[0,0,1,.6],[0,.6,1/3,.4],[1/3,.6,1/3,.4],[2/3,.6,1/3,.4]]],['Left big, 3 right',[[0,0,.62,1],[.62,0,.38,1/3],[.62,1/3,.38,1/3],[.62,2/3,.38,1/3]]],
 ['3 × 3',Array.from({length:9},(_,i)=>[i%3/3,Math.floor(i/3)/3,1/3,1/3])],['4 rows',Array.from({length:4},(_,i)=>[0,i/4,1,.25])],['Mosaic',[[0,0,.4,.6],[.4,0,.6,.3],[.4,.3,.3,.3],[.7,.3,.3,.3],[0,.6,.55,.4],[.55,.6,.45,.4]]],['Hero + strip',[[0,0,1,.7],[0,.7,.25,.3],[.25,.7,.25,.3],[.5,.7,.25,.3],[.75,.7,.25,.3]]],
 ['Polaroid trio',[[.05,.08,.42,.5],[.53,.08,.42,.5],[.28,.52,.44,.44]]],['Photo strip',[[.3,0,.4,.25],[.3,.25,.4,.25],[.3,.5,.4,.25],[.3,.75,.4,.25]]]];
function collageSection(s){
  const q=(s||'').toLowerCase();const list=COLLAGES.filter(([n])=>!q||(n+' collage grid layout photos').toLowerCase().includes(q));if(!list.length)return null;
  const sec_=el('div',{class:'sec'},el('h4',{},'Collage grids'),el('div',{class:'frames'},list.map(([n,cells])=>{
    const sv=`<svg viewBox="0 0 60 60" width="46" height="46">${cells.map(c=>`<rect x="${c[0]*54+3.5}" y="${c[1]*54+3.5}" width="${Math.max(1,c[2]*54-2)}" height="${Math.max(1,c[3]*54-2)}" rx="2" fill="currentColor" opacity=".55"/>`).join('')}</svg>`;
    return el('button',{class:'fr',title:n+' (add, then drop photos)','aria-label':'Collage: '+n,html:sv+'<small>'+n+'</small>',onclick:()=>{const m=D.w*.05,g=Math.min(D.w,D.h)*.012,W=D.w-2*m,H=D.h-2*m;addObjs(cells.map(c=>emptyImg(m+c[0]*W+g/2,m+c[1]*H+g/2,c[2]*W-g,c[3]*H-g,{r:g*1.2})));toast(n+' added. Drop a photo onto each cell.',2600)}})})));
  return sec_}

/* bulk create */
function parseCSV(t){const rows=[];let r=[],f='',q=false;t=String(t).replace(/^﻿/,'');for(let i=0;i<t.length;i++){const c=t[i];if(q){if(c==='"'){if(t[i+1]==='"'){f+='"';i++}else q=false}else f+=c}else if(c==='"')q=true;else if(c===','||c==='\t'||c===';'&&!/,/.test(t.split('\n')[0])){r.push(f);f=''}else if(c==='\n'||c==='\r'){if(c==='\r'&&t[i+1]==='\n')i++;r.push(f);f='';if(r.some(x=>x!==''))rows.push(r);r=[]}else f+=c}
  r.push(f);if(r.some(x=>x!==''))rows.push(r);if(!rows.length)return{head:[],rows:[]};const head=rows[0].map(h=>h.trim());return{head,rows:rows.slice(1).map(r=>Object.fromEntries(head.map((h,i)=>[h,(r[i]||'').trim()])))}}
function textLayers(list,out=[]){list.forEach(o=>{if(o.type==='text')out.push(o);else if(o.type==='group'&&o.kids)textLayers(o.kids,out)});return out}
function bulkFill(objs,row,map){const subst=s=>String(s).replace(/\{\{\s*([^}]+?)\s*\}\}/g,(m,k)=>row[k]!==undefined?row[k]:m);
  const walk=o=>{if(o.type==='text'){if(map&&map[o.id]&&row[map[o.id]]!==undefined)o.text=row[map[o.id]];else if(typeof o.text==='string')o.text=subst(o.text)}else if(o.type==='group'&&o.kids)o.kids.forEach(walk)};objs.forEach(walk)}
function openBulk(){
  commit();const body=el('div',{style:'display:grid;gap:12px;min-width:min(620px,88vw)'});openModal(body);
  const st={csv:null,map:{},mode:'pages'};
  const txt=el('textarea',{class:'f',rows:6,placeholder:'Paste rows here (first row = column names), or choose a CSV file:\nname,role\nAsha,Designer\nRavi,Manager','aria-label':'CSV data'});
  const file=el('input',{type:'file',accept:'.csv,.tsv,.txt,text/csv'});file.onchange=async()=>{if(file.files[0]){txt.value=await file.files[0].text();draw()}};
  const info=el('div'),mapUI=el('div');
  const draw=()=>{st.csv=parseCSV(txt.value);info.innerHTML='';mapUI.innerHTML='';const c=st.csv;
    if(!c.head.length||!c.rows.length){info.append(el('p',{class:'note'},'Add at least a header row and one data row.'));return}
    info.append(el('p',{class:'note'},c.rows.length+' row'+(c.rows.length>1?'s':'')+' · columns: '+c.head.join(', ')));
    const layers=textLayers(D.pages[cur].objs);const tok=layers.filter(o=>/\{\{[^}]+\}\}/.test(o.text||''));
    mapUI.append(el('p',{class:'note'},tok.length?'Text containing {{column}} placeholders is filled in automatically ('+tok.length+' found). You can also map other text layers:':'Tip: type {{column}} inside any text, or map text layers to columns here.'));
    layers.filter(o=>!/\{\{[^}]+\}\}/.test(o.text||'')).slice(0,12).forEach(o=>{const sel=el('select',{class:'f','aria-label':'Column for “'+String(o.text).slice(0,30)+'”',onchange:()=>{if(sel.value)st.map[o.id]=sel.value;else delete st.map[o.id]}},el('option',{value:''},'Keep as is'),...c.head.map(h=>el('option',{value:h,selected:st.map[o.id]===h},h)));mapUI.append(el('label',{class:'row',style:'justify-content:space-between;gap:10px'},el('span',{style:'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:55%'},String(o.text).slice(0,40)),sel))})};
  txt.addEventListener('input',draw);
  const mode=el('select',{class:'f','aria-label':'Create as',onchange:()=>{st.mode=mode.value}},el('option',{value:'pages'},'New pages in this design'),el('option',{value:'designs'},'Separate designs in a new folder'));
  const go=el('button',{class:'btn primary',onclick:async()=>{const c=st.csv;if(!c||!c.rows.length){toast('Add some rows first');return}const rows=c.rows.slice(0,500);
    try{const src=D.pages[cur];
      if(st.mode==='pages'){commit();const at=cur+1;const ps=rows.map(r=>{const p=JSON.parse(JSON.stringify(src,(k,v)=>k[0]==='_'?undefined:v));p.id=uid();p.objs.forEach(o=>{o.id=o.id});bulkFill(p.objs,r,st.map);p.notes=undefined;return p});D.pages.splice(at,0,...ps);dirty=true;commit();renderAll();closeModal();toast(rows.length+' pages created')}
      else{await saveDoc();const folder=await makeFolder('Bulk · '+safeName(D.name));let n=0;for(const r of rows){const p=JSON.parse(JSON.stringify(src,(k,v)=>k[0]==='_'?undefined:v));bulkFill(p.objs,r,st.map);const nm=(Object.values(r)[0]||'row')+'';const rec={v:1,id:uid(),name:D.name+' – '+nm,updated:Date.now(),w:D.w,h:D.h,pages:[p],assets:usedAssets(),thumb:''};
        await PUT().fs.write(DIR+'/'+folder+'/'+safeName(rec.name)+' ['+rec.id.slice(-5)+'].design',JSON.stringify(rec),{createMissingParents:true,overwrite:true});n++}
        closeModal();toast(n+' designs created in Projects › '+folder);refreshDocs()}}catch(e){toast('Could not create: '+(e&&e.message||'error'))}}},'Create');
  body.append(dlgHead('Bulk create'),el('p',{class:'note'},'Make one page or design for every row of a spreadsheet: certificates, name cards, price tags, invitations. The current page is the template.'),txt,el('div',{class:'row'},file),info,mapUI,el('label',{class:'note'},'Create as'),mode,el('div',{style:'display:flex;gap:8px;justify-content:flex-end'},el('button',{class:'btn',onclick:closeModal},'Cancel'),go));draw()}

/* smart template search */
const SYN={birthday:['bday','party','cake','celebration','balloons'],wedding:['marriage','shaadi','engagement','bride','groom','invite','invitation','save the date'],diwali:['deepavali','festival','lights','diya'],sale:['discount','offer','deal','promo','promotion','clearance'],resume:['cv','job','career'],invite:['invitation','event','party','card'],food:['restaurant','menu','cafe','recipe','biryani'],fitness:['gym','workout','health','yoga'],business:['corporate','company','professional','marketing','brand'],real:['estate','property','house','home','flat'],quote:['motivation','inspirational','saying'],youtube:['thumbnail','video','channel'],presentation:['slides','deck','pitch','ppt'],eid:['ramadan','mubarak'],christmas:['xmas','santa','holiday'],new:['year','newyear'],school:['education','class','teacher','student','course'],jewellery:['jewelry','gold','fashion','saree'],travel:['trip','holiday','tour','vacation'],logo:['brand','identity'],poster:['flyer','banner','print']};
const STOP=new Set(['a','an','the','for','my','our','of','and','to','in','on','with','me','i','want','need','make','create','design','something','like','that','this','is','it']);
function tplRank(q){
  const toks=String(q).toLowerCase().split(/[^a-z0-9ऀ-෿]+/).filter(t=>t&&!STOP.has(t));if(!toks.length)return[];
  const exp=toks.map(t=>({t,alts:[...(SYN[t]||[]),...Object.entries(SYN).filter(([k,v])=>v.includes(t)).map(([k])=>k)]}));
  return TEMPLATES.map(t=>{const hay=(t.n+' '+t.c+' '+(t.g||'')+' '+(t.tag||'')).toLowerCase();const nm=t.n.toLowerCase();let s=0;
    exp.forEach(({t:w,alts})=>{if(nm.includes(w))s+=4;else if(hay.includes(w))s+=2;else if(alts.some(a=>hay.includes(a)))s+=1});return{t,s}}).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).map(x=>x.t)}

/* brand kits */
function loadKits(){try{return JSON.parse(localStorage.getItem('ds.brandkits')||'[]')}catch(e){return[]}}
function saveKits(k){try{localStorage.setItem('ds.brandkits',JSON.stringify(k))}catch(e){}}
function kitsUI(redraw){
  const kits=loadKits();const sel=el('select',{class:'f','aria-label':'Brand kit',onchange:()=>{const k=kits.find(x=>x.name===sel.value);if(k){brand.colors=k.colors.slice();brand.head=k.head;brand.body=k.body;saveBrand();redraw();toast('Switched to '+k.name)}}},el('option',{value:''},kits.length?'Switch kit…':'No saved kits yet'),...kits.map(k=>el('option',{value:k.name},k.name)));
  return el('div',{class:'sec'},el('h4',{},'Brand kits'),sel,el('div',{class:'row'},
    el('button',{class:'btn sm grow',onclick:()=>askText('Save this brand as a kit','','Save',n=>{const ks=loadKits().filter(x=>x.name!==n);ks.push({name:n,colors:brand.colors.slice(),head:brand.head,body:brand.body});saveKits(ks);redraw();toast('Kit saved')})},'Save current as kit'),
    kits.length?el('button',{class:'btn sm danger',onclick:()=>{const n=sel.value;if(!n){toast('Pick a kit to delete first');return}askSure('Delete the kit “'+n+'”?','Delete',()=>{saveKits(loadKits().filter(x=>x.name!==n));redraw()})}},'Delete'):null))}

/* comments */
let commentMode=false;
function commentList(){return(D.comments=D.comments||[])}
function drawCommentPins(ctx,z){
  (D.comments||[]).forEach((c,i)=>{if(c.page!==cur)return;const x=view.px+c.x*z,y=view.py+c.y*z;ctx.save();ctx.beginPath();ctx.arc(x,y,12,0,7);ctx.fillStyle=c.done?'#868e96':'#f59f00';ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#fff';ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(i+1),x,y+.5);ctx.restore()})}
function placeComment(e){
  if(!commentMode)return false;commentMode=false;ui$().style.cursor='';const p=toDoc(e.clientX,e.clientY);
  askText('Comment','','Add',t=>{commentList().push({id:uid(),page:cur,x:p.x,y:p.y,text:t,ts:Date.now(),done:false});dirty=true;touch();renderUI();renderInsp()});return true}
function commentsUI(){
  const cs=commentList();
  return el('div',{class:'sec'},el('h4',{},'Comments'),reviewUI(),el('button',{class:'btn sm',onclick:()=>{commentMode=true;ui$().style.cursor='crosshair';toast('Click on the design to place a comment')}},'＋ Add comment'),
    ...cs.map((c,i)=>c.page===cur||true?el('div',{style:'display:flex;gap:8px;align-items:flex-start;border:1px solid var(--line);border-radius:8px;padding:6px 8px;'+(c.done?'opacity:.55':'')},el('b',{style:'min-width:18px'},String(i+1)),el('div',{style:'flex:1;font-size:13px'},c.text,el('div',{class:'note'},(c.by?c.by+' · ':'')+'Page '+(c.page+1)+' · '+new Date(c.ts).toLocaleDateString())),
      el('button',{class:'btn sm',title:c.done?'Reopen':'Resolve',onclick:()=>{c.done=!c.done;dirty=true;touch();renderUI();renderInsp()}},c.done?'↺':'✓'),el('button',{class:'btn sm danger',title:'Delete comment','aria-label':'Delete comment',onclick:()=>{cs.splice(i,1);dirty=true;touch();renderUI();renderInsp()}},'×')):null))}

/* ---------- print-ready PDF (bleed + crop marks, link areas) and review links ---------- */
const BLEED_MM=3,SLUG_MM=5;
const ppmOf=()=>D.w>=1500?11.81:3.78;
function bleedCanvas(c,b){const w=c.width,h=c.height,o=document.createElement('canvas');o.width=w+2*b;o.height=h+2*b;const x=o.getContext('2d');x.imageSmoothingEnabled=false;x.drawImage(c,b,b);
  x.drawImage(c,0,0,1,h,0,b,b,h);x.drawImage(c,w-1,0,1,h,w+b,b,b,h);x.drawImage(c,0,0,w,1,b,0,w,b);x.drawImage(c,0,h-1,w,1,b,h+b,w,b);
  x.drawImage(c,0,0,1,1,0,0,b,b);x.drawImage(c,w-1,0,1,1,w+b,0,b,b);x.drawImage(c,0,h-1,1,1,0,h+b,b,b);x.drawImage(c,w-1,h-1,1,1,w+b,h+b,b,b);return o}
function pdfLinks(pdf,p,pi,total,map){
  (p.objs||[]).forEach(o=>{if(!o.href||o.hidden)return;const m=String(o.href).match(/^page:(\d+)$/i);const r=map(o.x,o.y,o.w,o.h);if(!r.every(Number.isFinite)||r[2]<=0||r[3]<=0)return;
    if(m){const n=+m[1];if(n>=1&&n<=total)pdf.link(r[0],r[1],r[2],r[3],{pageNumber:n})}else if(/^(https?:|mailto:|tel:)/i.test(o.href))pdf.link(r[0],r[1],r[2],r[3],{url:o.href})})}
function makePdf(pgs){
  const {jsPDF}=window.jspdf||{};if(!jsPDF)throw new Error('PDF library did not load');const sc=Math.min(expo.scale,2),all=expo.pages==='all'&&pgs.length>1;
  if(!expo.bleed){
    const ori=D.w>=D.h?'l':'p',pdf=new jsPDF({orientation:ori,unit:'px',format:[D.w,D.h],hotfixes:['px_scaling'],compress:true});
    pgs.forEach((p,i)=>{if(i)pdf.addPage([D.w,D.h],ori);const c=renderPageTo(p,sc);pdf.addImage(c.toDataURL('image/jpeg',.92),'JPEG',0,0,D.w,D.h);pdfLinks(pdf,p,i,all?pgs.length:0,(x,y,w,h)=>[x,y,w,h])});
    return pdf.output('blob')}
  const ppm=ppmOf(),M=BLEED_MM+SLUG_MM,wmm=D.w/ppm,hmm=D.h/ppm,PW=wmm+2*M,PH=hmm+2*M,ori=PW>=PH?'l':'p';
  const pdf=new jsPDF({orientation:ori,unit:'mm',format:[PW,PH],compress:true});
  pgs.forEach((p,i)=>{if(i)pdf.addPage([PW,PH],ori);const c=renderPageTo(p,sc),b=Math.round(BLEED_MM*ppm*sc),o=bleedCanvas(c,b);
    pdf.addImage(o.toDataURL('image/jpeg',.92),'JPEG',M-BLEED_MM,M-BLEED_MM,wmm+2*BLEED_MM,hmm+2*BLEED_MM);
    pdf.setDrawColor(0,0,0);pdf.setLineWidth(.12);const a=M-BLEED_MM-.5,z=.5;
    [[M,M,-1,-1],[M+wmm,M,1,-1],[M,M+hmm,-1,1],[M+wmm,M+hmm,1,1]].forEach(([cx,cy,sx,sy])=>{pdf.line(cx+sx*(BLEED_MM+.5),cy,cx+sx*(M-.5),cy);pdf.line(cx,cy+sy*(BLEED_MM+.5),cx,cy+sy*(M-.5))});
    pdfLinks(pdf,p,i,all?pgs.length:0,(x,y,w,h)=>[M+x/ppm,M+y/ppm,w/ppm,h/ppm])});
  return pdf.output('blob')}

/* review links */
async function createReview(){
  commit();await saveDoc();await ensureAssets();toast('Preparing the review link…',60000);
  try{const k=Math.min(1,1400/Math.max(D.w,D.h));const pages=D.pages.map(p=>renderPageTo(p,k).toDataURL('image/jpeg',.82));
    const comments=(D.comments||[]).map(c=>({id:c.id,page:c.page,x:c.x/D.w,y:c.y/D.h,text:c.text,by:c.by||'You',ts:c.ts,done:c.done}));
    const r=await fetch('/_local/design/review?days=14',{method:'POST',credentials:'same-origin',headers:{'x-aos':'1','content-type':'application/json'},body:JSON.stringify({name:D.name,pages,comments})});
    const j=await r.json();if(!r.ok)throw new Error(j.error||'Could not create the link');
    D.review={token:j.token,url:location.origin+j.path,exp:j.exp};dirty=true;touch();toast('Review link ready',1500);renderInsp()}
  catch(e){toast('Review link failed: '+(e&&e.message||e),4000)}}
async function pullReview(){
  if(!D.review)return;try{const r=await fetch('/_local/design/reviewpull',{method:'POST',credentials:'same-origin',headers:{'x-aos':'1','content-type':'application/json'},body:JSON.stringify({token:D.review.token})});const j=await r.json();if(!r.ok)throw new Error(j.error||'failed');
    const cs=commentList();let n=0;j.comments.forEach(rc=>{const have=cs.find(c=>c.id===rc.id);if(have){if(have.done!==rc.done&&rc.done)have.done=true;return}cs.push({id:rc.id,page:rc.page,x:rc.x*D.w,y:rc.y*D.h,text:rc.text,by:rc.by,ts:rc.ts,done:!!rc.done,remote:true});n++});
    dirty=true;touch();renderUI();renderInsp();toast(n?n+' new comment'+(n>1?'s':'')+' from reviewers':'No new comments')}catch(e){toast('Could not fetch comments: '+(e&&e.message||e))}}
function endReview(){if(!D.review)return;askSure('Stop this review link? Reviewers will no longer be able to open it.','Stop review',async()=>{try{await fetch('/_local/design/reviewend',{method:'POST',credentials:'same-origin',headers:{'x-aos':'1','content-type':'application/json'},body:JSON.stringify({token:D.review.token})})}catch(e){}D.review=null;dirty=true;touch();renderInsp()})}
function reviewUI(){
  if(!D.review)return el('button',{class:'btn sm',title:'A public page where anyone with the link can pin comments',onclick:createReview},'Share for review (link)');
  return el('div',{style:'display:grid;gap:6px'},el('input',{class:'f',readonly:true,value:D.review.url,'aria-label':'Review link',onclick:e=>e.target.select()}),
    el('div',{class:'row'},el('button',{class:'btn sm grow',onclick:async()=>{try{await navigator.clipboard.writeText(D.review.url);toast('Link copied')}catch(e){toast(D.review.url,6000)}}},'Copy link'),el('button',{class:'btn sm grow',onclick:pullReview},'Get new comments'),el('button',{class:'btn sm danger',onclick:endReview},'Stop')),
    el('small',{class:'note'},'Expires '+new Date(D.review.exp).toLocaleDateString()+'. Reviewers see a snapshot taken now; share again after big changes.'))}

/* ---------- editor File menu, Resize dialog, delete from the editor ---------- */
async function trashCurrentDesign(){
  commit();try{await saveDoc()}catch(e){}
  const file=D._file;
  if(file){try{await moveDesign(file,TRASHDIR);fileCache.delete(file)}catch(e){toast('Could not move it to the trash');return false}}
  D=newDoc(1080,1080,'Untitled design');D._discard=true;cur=0;sel=[];$('#title').value='';resetHistory();dirty=false;renderAll();return true}
function deleteCurrentDesign(){
  askSure('Move “'+D.name+'” to the trash? You can restore it from Trash on the home screen.','Move to trash',async()=>{
    if(await trashCurrentDesign()){showHome();toast('Moved to trash. Restore it from Trash.')}})}
function makeCopyOfCurrent(){
  commit();saveDoc().then(()=>{const x=JSON.parse(JSON.stringify({id:uid(),name:D.name+' copy',w:D.w,h:D.h,pages:D.pages,assets:D.assets||{},comments:[]},(k,v)=>k[0]==='_'?undefined:v));x._file=null;loadRec(x);return saveDoc()}).then(()=>toast('Made a copy. You are now editing the copy.')).catch(()=>toast('Could not make a copy'))}
async function moveCurrentTo(folder){
  commit();await saveDoc();if(!D._file){toast('Saving first, try again in a moment');return}
  try{await moveDesign(D._file,folder);toast(folder?'Moved to '+folder:'Moved to Projects');await refreshDocs()}catch(e){toast('Could not move')}}
async function fileMenu(btn){
  const r=btn.getBoundingClientRect();let dirs=[];try{dirs=await listFolders()}catch(e){}
  const mv=[{label:'Projects (top level)',go:()=>moveCurrentTo('')},...dirs.map(d=>({label:'📁 '+d,go:()=>moveCurrentTo(d)})),{label:'＋ New folder…',go:()=>askText('New folder','','Create & move',async n=>{try{const f=await makeFolder(n);await moveCurrentTo(f)}catch(e){toast('Could not create that folder')}})}];
  ctxMenu(r.left,r.bottom+4,[
    {label:'New design…',key:'',go:()=>openNew()},{label:'All designs (home)',go:()=>showHome()},'-',
    {label:'Save now',key:'Ctrl S',go:async()=>{commit();await saveDoc();toast('Saved to Files')}},
    {label:'Rename',go:()=>{const t=$('#title');t.focus();t.select()}},{label:'Make a copy',go:makeCopyOfCurrent},{label:'Move to folder',sub:mv},
    {label:D.starred?'Remove star':'Star this design',go:()=>{D.starred=!D.starred;dirty=true;touch();saveDoc();toast(D.starred?'Starred':'Star removed')}},'-',
    {label:'Resize…',go:openResize},{label:'Download…',go:()=>openExport()},{label:'Share for review (link)',go:()=>createReview()},{label:'Present',go:()=>present()},'-',
    {label:'Version history',go:()=>openHistory()},{label:'Page grid',go:()=>openPageGrid()},{label:'Bulk create from CSV…',go:()=>openBulk()},{label:D.printGuides?'Hide bleed & safe-area guides':'Show bleed & safe-area guides',go:()=>{D.printGuides=!D.printGuides;dirty=true;renderUI()}},'-',
    {label:'Keyboard shortcuts',key:'?',go:()=>openHelp()},{label:'Move to trash',go:deleteCurrentDesign}])}
function openResize(){
  commit();const body=el('div',{style:'display:grid;gap:12px;min-width:min(420px,88vw)'});openModal(body,true);
  const w=el('input',{class:'f',type:'number',min:20,max:8000,value:D.w,'aria-label':'Width'}),h=el('input',{class:'f',type:'number',min:20,max:8000,value:D.h,'aria-label':'Height'});
  const dd=el('select',{class:'f','aria-label':'Size preset',onchange:()=>{if(dd.value!==''){w.value=SIZES[dd.value].w;h.value=SIZES[dd.value].h}}},el('option',{value:''},'Choose a size…'),SIZES.map((s,i)=>el('option',{value:i},`${s.n} — ${s.w}×${s.h}`)));
  body.append(dlgHead('Resize'),dd,el('div',{class:'row'},el('label',{style:'flex:1'},'Width',w),el('label',{style:'flex:1'},'Height',h)),
    el('button',{class:'btn pri wide',html:ic('sparkle',16)+' Magic resize',onclick:()=>{closeModal();resizeDoc(+w.value,+h.value,'magic')}}),el('button',{class:'btn wide',onclick:()=>{closeModal();resizeDoc(+w.value,+h.value,'canvas')}},'Change canvas only'),el('p',{class:'note'},'Magic resize scales and re-centres everything on every page.'))}
(function(){const b=document.getElementById('btnFile'),r=document.getElementById('btnResize');if(b)b.onclick=()=>fileMenu(b);if(r)r.onclick=openResize;
  addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'&&!document.getElementById('home').hidden===false){e.preventDefault();commit();saveDoc().then(()=>toast('Saved to Files'))}})})();

/* icons the home screen asks for that the base set lacked */
Object.assign(IC,{
 chat:'<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12Z"/><path d="M8.5 10.5h7M8.5 13.5h4.5"/>',
 heart:'<path d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.700 3.700 4.500 7 4.500c2 0 3.500 1 5 3 1.500-2 3-3 5-3 3.300 0 5.400 3.200 4.200 6.600-1.700 4.800-9.200 9.400-9.200 9.400Z"/>',
 trophy:'<path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M12 14v4M8.500 20h7"/>'});

/* Home: Docs, Whiteboards and Websites live beside designs, each in its own editor page. */
const EDKIND={docs:{dir:'/Designs/Docs',ext:'ddoc',page:'docs.html',one:'Doc',many:'Docs',color:'#2b8a3e',icon:'doc',empty:'No documents yet. Write letters, notes or proposals and export them as Word files.'},
 boards:{dir:'/Designs/Whiteboards',ext:'dboard',page:'board.html',one:'Whiteboard',many:'Whiteboards',color:'#7048e8',icon:'board',empty:'No whiteboards yet. Plan, brainstorm and map ideas with sticky notes and arrows.'},
 sites:{dir:'/Designs/Websites',ext:'dsite',page:'site.html',one:'Website',many:'Websites',color:'#e8590c',icon:'globe',empty:'No websites yet. Build a simple site from a template and publish it with a link.'}};
Object.assign(IC,{doc:'<path d="M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6"/>',board:'<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 22l4-4 4 4M7 9h4v4H7zM14 9h3"/>',globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>'});
const edCache={};
const edOpen=(k,path)=>{location.href=EDKIND[k].page+(path?'?f='+encodeURIComponent(path):'')};
function edNew(k){location.href=EDKIND[k].page}
async function edList(k){const K=EDKIND[k];let it=[];try{it=await PUT().fs.readdir(K.dir)}catch(e){return[]}
  const out=[];for(const i of it){if(i.is_dir||!i.name.endsWith('.'+K.ext))continue;const path=K.dir+'/'+i.name;let name=i.name.replace(/\s*\[[^\]]*\]\.\w+$/,'').replace(/\.\w+$/,''),updated=(i.modified||0)*(i.modified<1e12?1000:1),pub=false;
    try{const b=await PUT().fs.read(path);const t=typeof b==='string'?b:await b.text();const j=JSON.parse(t);name=j.name||name;updated=j.updated||updated;pub=!!j.pub}catch(e){}
    out.push({path,name,updated,pub})}
  return out.sort((a,b)=>b.updated-a.updated)}
async function edRefresh(k){edCache[k]=await edList(k);if(home.view===k&&!document.getElementById('home').hidden)renderHome()}
function edMenu(k,r,x,y){ctxMenu(x,y,[{label:'Open',go:()=>edOpen(k,r.path)},{label:'Rename',go:()=>askText('Rename',r.name,'Rename',async v=>{try{const b=await PUT().fs.read(r.path);const j=JSON.parse(typeof b==='string'?b:await b.text());j.name=v;await PUT().fs.write(r.path,JSON.stringify(j),{overwrite:true});edRefresh(k);toast('Renamed')}catch(e){toast('Could not rename')}})},'-',{label:'Delete',go:()=>askSure('Delete “'+r.name+'” for good? '+(r.pub?'Its public link stops working only after you take it offline from the editor.':''),'Delete',async()=>{try{await PUT().fs.delete(r.path);edRefresh(k);toast('Deleted')}catch(e){toast('Could not delete')}})}])}
function edCard(k,r){const K=EDKIND[k];
  const c=el('div',{class:'hc','data-ed':k,tabindex:0,role:'button','aria-label':'Open '+r.name,onclick:e=>{if(!e.target.closest('.dots,.delb'))edOpen(k,r.path)},onkeydown:e=>{if(e.key==='Enter')edOpen(k,r.path)},oncontextmenu:e=>{e.preventDefault();edMenu(k,r,e.clientX,e.clientY)}},
    el('div',{class:'tn',style:'display:grid;place-items:center;background:'+K.color+'18;color:'+K.color,html:ic(K.icon,56)}),el('b',{title:r.name},r.name),el('small',{},(r.pub?'Published · ':'')+'Edited '+fmtDate(r.updated)),
    el('button',{class:'dots','aria-label':'More options for '+r.name,title:'More',onclick:e=>{e.stopPropagation();const b=e.currentTarget.getBoundingClientRect();edMenu(k,r,b.left,b.bottom+4)}},'⋯'),
    el('button',{class:'delb','aria-label':'Delete '+r.name,title:'Delete',onclick:e=>{e.stopPropagation();askSure('Delete “'+r.name+'” for good?','Delete',async()=>{try{await PUT().fs.delete(r.path);edRefresh(k);toast('Deleted')}catch(e){toast('Could not delete')}})},html:ic('trash',16)}));
  return c}
function edKindView(k){const K=EDKIND[k],list=edCache[k],out=[];
  out.push(el('div',{class:'hs'},el('h2',{},K.many),el('span',{class:'grow'}),el('button',{class:'btn pri',id:'edNew',onclick:()=>edNew(k)},'+ New '+K.one.toLowerCase())));
  if(!list){out.push(el('p',{class:'note'},'Loading…'));edRefresh(k);return out}
  out.push(list.length?el('div',{class:'hg big'},list.map(r=>edCard(k,r))):el('div',{class:'hempty'},K.empty));
  return out}

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
const fileFor=()=>`${D._folder||((!D._file&&typeof home!=='undefined'&&home.folder)?DIR+'/'+home.folder:DIR)}/${safeName(D.name)} [${D.id.slice(-5)}].design`;
const folderOf=f=>{const m=String(f||'').match(/^\/Designs\/([^\/]+)\/[^\/]+$/);return m?DIR+'/'+m[1]:''};
let saveQ=Promise.resolve();
function setSaveState(s){const e=document.getElementById('saveState');if(e)e.textContent=s}
function saveDoc(){saveQ=saveQ.then(doSave,doSave);return saveQ}
async function doSave(){
  if(!ready||!PUT()||D._discard)return;
  try{
    setSaveState('Saving…');
    const th=await thumbOf(D.pages[0],240);
    const rec={v:1,id:D.id,name:D.name,updated:Date.now(),w:D.w,h:D.h,pages:D.pages,assets:usedAssets(),thumb:th,starred:!!D.starred,comments:D.comments||[],review:D.review||null};
    const f=fileFor(),old=D._file;
    await PUT().fs.write(f,new Blob([JSON.stringify(rec,(k,v)=>k[0]==='_'?undefined:v)],{type:'application/json'}),{createMissingParents:true,overwrite:true});
    if(old&&old!==f){try{await PUT().fs.delete(old)}catch(e){}}
    D._file=f;fileCache.delete(f);try{localStorage.setItem('ds.last',f)}catch(e){}
    setSaveState('Saved to Files');
  }catch(e){setSaveState('Not saved')}
}
async function readDesign(path){const b=await PUT().fs.read(path);const r=JSON.parse(await b.text());if(!r||!Array.isArray(r.pages)||!r.w||!r.h)throw new Error('Not a design');r._file=path;return r}
function loadRec(r){D={id:r.id||uid(),name:r.name||'Untitled design',w:r.w,h:r.h,pages:r.pages,assets:r.assets||{}};D._file=r._file||null;D.starred=!!r.starred;D.comments=r.comments||[];D.review=r.review||null;D._folder=folderOf(D._file);cur=0;sel=[];$('#title').value=D.name;resetHistory();fit();renderAll();setSaveState(D._file?'Saved to Files':'');hideHome()}
const RESERVED=/^(uploads|docs|whiteboards|websites|\.)/i;
async function listFolders(){let it=[];try{it=await PUT().fs.readdir(DIR)}catch(e){return []}return it.filter(i=>i.is_dir&&!RESERVED.test(i.name)).map(i=>i.name).sort((a,b)=>a.localeCompare(b))}
async function listDocs(){
  let items=[];try{items=await PUT().fs.readdir(DIR)}catch(e){return []}
  const subs=items.filter(i=>i.is_dir&&!RESERVED.test(i.name));
  for(const s of subs){try{const x=await PUT().fs.readdir(DIR+'/'+s.name);items.push(...x)}catch(e){}}
  items=items.filter(i=>!i.is_dir&&/\.design$/i.test(i.name));const out=[];let k=0;
  await Promise.all(Array.from({length:4},async()=>{while(k<items.length){const it=items[k++];const key=it.path+'|'+(it.modified||0)+'|'+(it.size||0);let c=fileCache.get(it.path);
    if(!c||c.key!==key){try{const r=await readDesign(it.path);c={key,meta:{id:r.id,name:r.name,w:r.w,h:r.h,pages:r.pages.length,updated:r.updated||0,thumb:r.thumb||'',starred:!!r.starred}};fileCache.set(it.path,c)}catch(e){continue}}
    out.push({...c.meta,_file:it.path,folder:folderOf(it.path).slice(DIR.length+1)})}}));
  return out.sort((a,b)=>b.updated-a.updated);
}
const cleanFolder=n=>String(n||'').replace(/[\\/:*?"<>|\u0000-\u001f]+/g,'').replace(/\s+/g,' ').trim().slice(0,40);
async function moveDesign(file,folder){
  const name=file.split('/').pop(),to=(folder?DIR+'/'+folder:DIR)+'/'+name;if(to===file)return file;
  const b=await PUT().fs.read(file);await PUT().fs.write(to,b,{createMissingParents:true,overwrite:true});await PUT().fs.delete(file);
  fileCache.delete(file);fileCache.delete(to);if(D._file===file){D._file=to;D._folder=folderOf(to)}return to;
}
async function makeFolder(n){n=cleanFolder(n);if(!n||RESERVED.test(n))throw new Error('Bad name');await PUT().fs.mkdir(DIR+'/'+n,{createMissingParents:true});return n}
async function removeFolder(n){const docs=(await listDocs()).filter(r=>r.folder===n);for(const r of docs)await moveDesign(r._file,'');await PUT().fs.delete(DIR+'/'+n)}
async function renameFolder(a,b){b=cleanFolder(b);if(!b||b===a||RESERVED.test(b))return a;await makeFolder(b);const docs=(await listDocs()).filter(r=>r.folder===a);for(const r of docs)await moveDesign(r._file,b);try{await PUT().fs.delete(DIR+'/'+a)}catch(e){}return b}
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


/* ---------- your upload library: kept in Files › Designs › Uploads, so it is there next time ---------- */
const LIBDIR=DIR+'/Uploads';let libList=null;const libThumbs=new Map();
async function libSave(url,tag){
  if(!PUT()||!url)return;
  try{const blob=await (await fetch(url)).blob();const t=blob.type||'image/png',ext=/svg/.test(t)?'svg':/jpe?g/.test(t)?'jpg':/webp/.test(t)?'webp':/gif/.test(t)?'gif':'png';
    const name=`${tag||'upload'}-${Date.now().toString(36)}${Math.random().toString(36).slice(2,5)}.${ext}`;
    await PUT().fs.write(`${LIBDIR}/${name}`,blob,{createMissingParents:true,overwrite:false});libList=null;if(typeof tab!=='undefined'&&tab==='up')renderPanel()}catch(e){}}
async function libLoad(force){if(libList&&!force)return libList;try{const it=await PUT().fs.readdir(LIBDIR);libList=it.filter(i=>!i.is_dir&&/\.(png|jpe?g|webp|gif|svg)$/i.test(i.name)).sort((a,b)=>(b.modified||0)-(a.modified||0))}catch(e){libList=[]}return libList}
async function libURL(path){let u=libThumbs.get(path);if(!u){const b=await PUT().fs.read(path);u=URL.createObjectURL(b);libThumbs.set(path,u)}return u}
async function libUse(path){try{const b=await PUT().fs.read(path);const url=await fileToDataURL(b);const img=new Image();img.src=url;await img.decode();const id=newAsset(url);addImageAsset({id,nw:img.naturalWidth||800,nh:img.naturalHeight||600})}catch(e){toast('Could not open that image')}}
const libIO=typeof IntersectionObserver!=='undefined'?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){const im=e.target;libIO.unobserve(im);libURL(im.dataset.p).then(u=>{im.src=u}).catch(()=>{})}}),{rootMargin:'160px'}):null;
async function drawLibrary(box){
  if(!PUT()){box.append(el('p',{class:'note'},'Open the studio inside Anands OS to keep your uploads between sessions.'));return}
  box.append(el('p',{class:'note'},'Loading your library…'));const list=await libLoad();box.innerHTML='';
  if(!list.length){box.append(el('p',{class:'note'},'Nothing in your library yet. Uploaded images are saved to Files › Designs › Uploads and are here every time you open the studio.'));return}
  box.append(el('h4',{class:'sh'},'Your library · '+list.length),el('div',{class:'grid3'},list.map(it=>{
    let armed=false;const del=el('button',{class:'btn sm danger',style:'position:absolute;right:3px;top:3px;padding:1px 6px;opacity:.9','aria-label':'Delete '+it.name,title:'Delete from library',onclick:async e=>{e.stopPropagation();if(!armed){armed=true;del.textContent='Sure?';setTimeout(()=>{armed=false;del.textContent='×'},2500);return}try{await PUT().fs.delete(it.path)}catch(er){}libList=null;libThumbs.delete(it.path);renderPanel()}},'×');
    const im=el('img',{alt:'',style:'width:100%;height:100%;object-fit:contain;background:repeating-conic-gradient(#e9e9e9 0 25%,#fff 0 50%) 0 0/14px 14px','data-p':it.path});if(libIO)libIO.observe(im);else libURL(it.path).then(u=>im.src=u);
    return el('div',{style:'position:relative'},el('button',{class:'cell',style:'aspect-ratio:1;padding:0;overflow:hidden;width:100%',title:'Add to design','aria-label':'Add '+it.name+' to design',onclick:()=>libUse(it.path)},im),del)})))}

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
/* ---- matting helpers: edge-aware, noise-free cut-outs ---- */
const sstep=x=>{x=x<0?0:x>1?1:x;return x*x*(3-2*x)};
function boxF(src,W,H,r){ // mean filter, clamped window
  const tmp=new Float32Array(W*H),out=new Float32Array(W*H);
  for(let y=0;y<H;y++){const o=y*W;let s=0;const lim=Math.min(r,W-1);for(let x=0;x<=lim;x++)s+=src[o+x];
    for(let x=0;x<W;x++){const hi=Math.min(W-1,x+r),lo=Math.max(0,x-r);if(x>0){if(x+r<=W-1)s+=src[o+x+r];if(x-r-1>=0)s-=src[o+x-r-1]}tmp[o+x]=s/(hi-lo+1)}}
  for(let x=0;x<W;x++){let s=0;const lim=Math.min(r,H-1);for(let y=0;y<=lim;y++)s+=tmp[y*W+x];
    for(let y=0;y<H;y++){const hi=Math.min(H-1,y+r),lo=Math.max(0,y-r);if(y>0){if(y+r<=H-1)s+=tmp[(y+r)*W+x];if(y-r-1>=0)s-=tmp[(y-r-1)*W+x]}out[y*W+x]=s/(hi-lo+1)}}
  return out}
function guidedF(I,p,W,H,r,eps){
  const N=W*H,mI=boxF(I,W,H,r),mp=boxF(p,W,H,r),II=new Float32Array(N),Ip=new Float32Array(N);
  for(let i=0;i<N;i++){II[i]=I[i]*I[i];Ip[i]=I[i]*p[i]}
  const cI=boxF(II,W,H,r),cIp=boxF(Ip,W,H,r),a=new Float32Array(N),b=new Float32Array(N);
  for(let i=0;i<N;i++){const v=cI[i]-mI[i]*mI[i],c=cIp[i]-mI[i]*mp[i];a[i]=c/(v+eps);b[i]=mp[i]-a[i]*mI[i]}
  const ma=boxF(a,W,H,r),mb=boxF(b,W,H,r),q=new Float32Array(N);
  for(let i=0;i<N;i++){const v=ma[i]*I[i]+mb[i];q[i]=v<0?0:v>1?1:v}return q}
function cleanMatte(a,W,H,dropFrac,holeFrac){
  const N=W*H,lab=new Int32Array(N),q=new Int32Array(N),strong=[0];let nl=0;
  const fill=(s,id,test,count)=>{let qh=0,qt=0;q[qt++]=s;lab[s]=id;while(qh<qt){const p=q[qh++];count(p);const x=p%W;
    if(x>0&&!lab[p-1]&&test(p-1)){lab[p-1]=id;q[qt++]=p-1}if(x<W-1&&!lab[p+1]&&test(p+1)){lab[p+1]=id;q[qt++]=p+1}
    if(p>=W&&!lab[p-W]&&test(p-W)){lab[p-W]=id;q[qt++]=p-W}if(p<N-W&&!lab[p+W]&&test(p+W)){lab[p+W]=id;q[qt++]=p+W}}};
  for(let s=0;s<N;s++){if(lab[s]||a[s]<=.04)continue;nl++;let st=0;fill(s,nl,p=>a[p]>.04,p=>{if(a[p]>.5)st++});strong.push(st)}
  const big=Math.max(1,...strong),min=Math.max(6,big*dropFrac);
  for(let p=0;p<N;p++){const l=lab[p];if(l&&strong[l]<min)a[p]=0}
  if(holeFrac>0){lab.fill(0);const info=[null];let n2=0;
    for(let s=0;s<N;s++){if(lab[s]||a[s]>.5)continue;n2++;let ar=0,border=false;fill(s,n2,p=>a[p]<=.5,p=>{ar++;const x=p%W,y=(p/W)|0;if(x===0||y===0||x===W-1||y===H-1)border=true});info.push({ar,border})}
    const lim=holeFrac*N;for(let p=0;p<N;p++){const l=lab[p];if(l&&!info[l].border&&info[l].ar<lim)a[p]=1}}
  return a}
function matteToCanvas(src,alpha,bgCol){ // write alpha; remove background colour spill from soft edges
  const W=src.width,H=src.height,x=src.getContext('2d'),im=x.getImageData(0,0,W,H),d=im.data,N=W*H;
  let w=new Float32Array(N),R=new Float32Array(N),G=new Float32Array(N),Bc=new Float32Array(N);
  if(bgCol){for(let i=0;i<N;i++){const a=alpha[i];if(a>0&&a<1){for(let k=0;k<3;k++){const v=(d[i*4+k]-(1-a)*bgCol[k])/Math.max(a,.04);d[i*4+k]=v<0?0:v>255?255:v}}}}
  else{for(let i=0;i<N;i++){if(alpha[i]>.97){w[i]=1;R[i]=d[i*4];G[i]=d[i*4+1];Bc[i]=d[i*4+2]}}
    const r=Math.max(3,Math.round(Math.min(W,H)*.006)),bw=boxF(w,W,H,r),br=boxF(R,W,H,r),bg=boxF(G,W,H,r),bb=boxF(Bc,W,H,r);
    for(let i=0;i<N;i++){const a=alpha[i];if(a<=.97&&bw[i]>.002){const m=a<.5?1:(1-a)/.5*.7+.3,e=[br[i]/bw[i],bg[i]/bw[i],bb[i]/bw[i]];for(let k=0;k<3;k++)d[i*4+k]=d[i*4+k]*(1-m)+e[k]*m}}}
  for(let i=0;i<N;i++)d[i*4+3]=Math.round(alpha[i]*255);
  x.putImageData(im,0,0);return src}
function borderStats(c){const W=c.width,H=c.height,d=c.getContext('2d').getImageData(0,0,W,H).data,pts=[];
  const add=(X,Y)=>{const i=(Y*W+X)*4;pts.push([d[i],d[i+1],d[i+2]])};const st=Math.max(1,Math.round(Math.max(W,H)/400));
  for(let X=0;X<W;X+=st){add(X,0);add(X,H-1);add(X,Math.min(H-1,2));add(X,Math.max(0,H-3))}for(let Y=0;Y<H;Y+=st){add(0,Y);add(W-1,Y);add(Math.min(W-1,2),Y);add(Math.max(0,W-3),Y)}
  const med=k=>{const v=pts.map(p=>p[k]).sort((a,b)=>a-b);return v[v.length>>1]},bg=[med(0),med(1),med(2)];
  let near=0;for(const p of pts)if(Math.hypot(p[0]-bg[0],p[1]-bg[1],p[2]-bg[2])<26)near++;
  const seen=new Set();let k=0;const step=Math.max(1,Math.floor(W*H/6000));for(let i=0;i<W*H;i+=step){seen.add((d[i*4]>>4)<<8|(d[i*4+1]>>4)<<4|(d[i*4+2]>>4));k++}
  return {bg,uniform:near/pts.length,colors:seen.size,samples:k}}
/* plain-colour background → soft, de-speckled matte */
async function plainBg(url,tol,opt){
  opt=opt||{};tol=tol||40;const c=await dataToCanvas(url,2000),W=c.width,H=c.height,N=W*H,x=c.getContext('2d'),d0=x.getImageData(0,0,W,H).data;
  const bs=borderStats(c),bg=bs.bg,enclosed=opt.enclosed==null?bs.colors<90:opt.enclosed;
  // a light blur before measuring distance so JPEG noise cannot punch holes
  const tmp=document.createElement('canvas');tmp.width=W;tmp.height=H;const tx=tmp.getContext('2d');tx.filter='blur(1px)';tx.drawImage(c,0,0);const sd=tx.getImageData(0,0,W,H).data;
  const dist=new Float32Array(N);for(let i=0;i<N;i++){const e=Math.hypot(d0[i*4]-bg[0],d0[i*4+1]-bg[1],d0[i*4+2]-bg[2]),f=Math.hypot(sd[i*4]-bg[0],sd[i*4+1]-bg[1],sd[i*4+2]-bg[2]);dist[i]=Math.min(e,f*1.0+e*0)}
  const t0=tol*.4,t1=tol*1.35,alpha=new Float32Array(N);
  for(let i=0;i<N;i++)alpha[i]=sstep((dist[i]-t0)/(t1-t0));
  { // edge pixels: work out how much of each is subject by unmixing against the nearby subject colour
    const wf=new Float32Array(N),fr=new Float32Array(N),fg=new Float32Array(N),fb=new Float32Array(N);
    for(let i=0;i<N;i++)if(dist[i]>t1*1.2){wf[i]=1;fr[i]=d0[i*4];fg[i]=d0[i*4+1];fb[i]=d0[i*4+2]}
    const rr=Math.max(2,Math.round(Math.min(W,H)*.004)),bw=boxF(wf,W,H,rr),br=boxF(fr,W,H,rr),bgc=boxF(fg,W,H,rr),bb=boxF(fb,W,H,rr);
    for(let i=0;i<N;i++){if(dist[i]<=t0*.6||dist[i]>t1*1.2||bw[i]<.01)continue;
      const F=[br[i]/bw[i]-bg[0],bgc[i]/bw[i]-bg[1],bb[i]/bw[i]-bg[2]],den=F[0]*F[0]+F[1]*F[1]+F[2]*F[2];if(den<900)continue;
      const dot=((d0[i*4]-bg[0])*F[0]+(d0[i*4+1]-bg[1])*F[1]+(d0[i*4+2]-bg[2])*F[2])/den;alpha[i]=dot<0?0:dot>1?1:dot}}
  if(!enclosed){ // only the background touching the border goes; same-coloured areas inside the subject stay
    const open=new Uint8Array(N),q=new Int32Array(N);let qh=0,qt=0;const lim=t1;
    const push=p=>{if(open[p]||dist[p]>=lim)return;open[p]=1;q[qt++]=p};
    for(let X=0;X<W;X++){push(X);push((H-1)*W+X)}for(let Y=0;Y<H;Y++){push(Y*W);push(Y*W+W-1)}
    while(qh<qt){const p=q[qh++],X=p%W;if(X>0)push(p-1);if(X<W-1)push(p+1);if(p>=W)push(p-W);if(p<N-W)push(p+W)}
    for(let i=0;i<N;i++)if(!open[i])alpha[i]=1}
  for(let i=0;i<N;i++)if(alpha[i]<.1)alpha[i]=0;
  cleanMatte(alpha,W,H,.002,enclosed?0:.0008);
  const out=document.createElement('canvas');out.width=W;out.height=H;out.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(d0),W,H),0,0);
  matteToCanvas(out,alpha,bg);return out.toDataURL('image/png')}
async function cutOut(url,status){
  status=status||(()=>{});const src=await dataToCanvas(url,2000),W=src.width,H=src.height;
  const bs=borderStats(src);
  if(bs.uniform>.93&&bs.colors<400){status('Plain backdrop found — cutting it out cleanly…');await yieldUI();return plainBg(url,bs.colors<90?36:44)}
  const sess=await bgSession(status);status('Cutting out…');await yieldUI();
  const S=320,sm=document.createElement('canvas');sm.width=sm.height=S;const sx=sm.getContext('2d');sx.drawImage(src,0,0,S,S);const d=sx.getImageData(0,0,S,S).data;
  let mx=1;for(let i=0;i<d.length;i+=4)mx=Math.max(mx,d[i],d[i+1],d[i+2]);
  const mean=[.485,.456,.406],std=[.229,.224,.225],run1=async flip=>{const f=new Float32Array(3*S*S);
    for(let y=0;y<S;y++)for(let x=0;x<S;x++){const si=(y*S+(flip?S-1-x:x))*4,di=y*S+x;for(let c=0;c<3;c++)f[c*S*S+di]=(d[si+c]/mx-mean[c])/std[c]}
    const out=await sess.run({[sess.inputNames[0]]:new ort.Tensor('float32',f,[1,3,S,S])});const m=Float32Array.from(out[sess.outputNames[0]].data);
    if(flip){for(let y=0;y<S;y++)for(let x=0;x<S/2;x++){const a=y*S+x,b=y*S+S-1-x,t=m[a];m[a]=m[b];m[b]=t}}return m};
  const m1=await run1(false);status('Refining the edges…');await yieldUI();const m2=await run1(true);
  let lo=Infinity,hi=-Infinity;const mm=new Float32Array(S*S);for(let i=0;i<S*S;i++){mm[i]=(m1[i]+m2[i])/2;lo=Math.min(lo,mm[i]);hi=Math.max(hi,mm[i])}
  const mk=document.createElement('canvas');mk.width=mk.height=S;const mc=mk.getContext('2d'),id=mc.createImageData(S,S);
  for(let i=0;i<S*S;i++){const v=sstep((((mm[i]-lo)/Math.max(1e-6,hi-lo))-.3)/.4);id.data[i*4]=id.data[i*4+1]=id.data[i*4+2]=v*255;id.data[i*4+3]=255}
  mc.putImageData(id,0,0);
  const up=document.createElement('canvas');up.width=W;up.height=H;const ux=up.getContext('2d');ux.imageSmoothingEnabled=true;ux.imageSmoothingQuality='high';ux.drawImage(mk,0,0,W,H);
  const ud=ux.getImageData(0,0,W,H).data,sd=src.getContext('2d').getImageData(0,0,W,H).data,N=W*H,p=new Float32Array(N),g=new Float32Array(N);
  for(let i=0;i<N;i++){p[i]=ud[i*4]/255;g[i]=(.299*sd[i*4]+.587*sd[i*4+1]+.114*sd[i*4+2])/255}
  await yieldUI();const r=Math.max(4,Math.round(Math.min(W,H)*.007));let a=guidedF(g,p,W,H,r,2e-4);
  for(let i=0;i<N;i++)a[i]=sstep((a[i]-.32)/.36);
  await yieldUI();cleanMatte(a,W,H,.05,.0015);
  matteToCanvas(src,a,null);return src.toDataURL('image/png')}

function bgInsp(o){
  const st=el('p',{class:'note'},o.orig?'Background removed.':'Cut the subject out of its background. Works on this device — your photo is not uploaded.');
  const set=t=>{st.textContent=t};let busy=false;
  const run=async(fn,done)=>{if(busy||!o.src)return;busy=true;try{const url=await fn(D.assets[o.src]);const id=newAsset(url);libSave(url,'cutout');if(!o.orig)o.orig=o.src;o.src=id;touch();renderInsp();renderPanel();toast(done)}catch(e){set((e&&e.message)||'That did not work')}busy=false};
  let tol=+(sessionStorage.getItem('ds.tol')||40),enc=null;
  const encBox=el('input',{type:'checkbox','aria-label':'Also remove enclosed areas',onchange:e=>{enc=e.target.checked}});
  return sec('Remove background',
    el('button',{class:'btn pri wide',html:ic('sparkle',16)+' Remove background',onclick:()=>run(u=>cutOut(u,set),'Background removed')}),
    el('p',{class:'note'},'Smart: a plain backdrop is cut out exactly; photos use the on-device AI model with edge refinement.'),
    el('div',{class:'sec'},el('h4',{},'Plain colour background'),
      slider('Tolerance',()=>tol,v=>{tol=v;try{sessionStorage.setItem('ds.tol',v)}catch(e){}},{min:10,max:120,step:1}),
      el('label',{class:'row',style:'gap:8px'},encBox,el('span',{},'Also remove same-coloured areas inside (rings, letters)')),
      el('button',{class:'btn wide',onclick:()=>run(u=>plainBg(u,tol,{enclosed:encBox.checked?true:enc}),'Plain background removed')},'Remove plain background')),
    o.orig?el('button',{class:'btn wide',onclick:()=>{o.src=o.orig;o.orig=null;touch();renderInsp()}},'Restore original'):null,st);
}

/* ---------- animation ---------- */
const AN_IN=[['none','None'],['fade','Fade'],['rise','Rise up'],['drop','Drop in'],['left','From left'],['right','From right'],['zoom','Zoom in'],['pop','Pop'],['spin','Spin in']];
const AN_OUT=[['none','None'],['fade','Fade'],['rise','Rise up'],['drop','Drop down'],['left','To the left'],['right','To the right'],['zoom','Shrink'],['spin','Spin out']];
const AN_LOOP=[['none','None'],['float','Float'],['pulse','Pulse'],['sway','Sway'],['spin','Spin'],['kbin','Zoom in (camera)'],['kbout','Zoom out (camera)'],['kbl','Pan left (camera)'],['kbr','Pan right (camera)'],['kbu','Tilt up (camera)'],['kbd','Tilt down (camera)'],['kbpar','Parallax drift']];
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
  let kz=1,kx=0,ky=0;
  if(a.l&&a.l.startsWith('kb')){const pr=clamp((t-d)/Math.max(.1,pd-d),0,1),e=pr*pr*(3-2*pr),A=a.ka||.12,pan=(A/2)/(1+A);
    if(a.l==='kbin')kz=1+A*e;else if(a.l==='kbout')kz=1+A*(1-e);else if(a.l==='kbpar'){kz=1+A*.35*e;kx=pan*.5*(1-2*e)}
    else{kz=1+A;if(a.l==='kbl')kx=pan*(1-2*e);else if(a.l==='kbr')kx=-pan*(1-2*e);else if(a.l==='kbu')ky=pan*(1-2*e);else if(a.l==='kbd')ky=-pan*(1-2*e)}}
  return {am,dx,dy,s,r,kz,kx,ky};
}
function drawAnimObj(ctx,o,t,pd,W,H,opt){
  const f=animFrame(o,t,pd,W,H);if(!f){drawObj(ctx,o,opt);return}
  if(f.am<=.003||f.s<=.003)return;
  ctx.save();const cx=o.x+o.w/2,cy=o.y+o.h/2;ctx.translate(cx+f.dx,cy+f.dy);ctx.rotate(f.r*Math.PI/180);ctx.scale(f.s,f.s);ctx.translate(-cx,-cy);
  const op=o.op,oz=o.z,ox=o.ox,oy=o.oy;o.op=(op??1)*f.am;if(o.type==='image'&&(f.kz!==1||f.kx||f.ky)){o.z=(oz||1)*f.kz;o.ox=(ox||0)+f.kx;o.oy=(oy||0)+f.ky}try{drawObj(ctx,o,opt)}finally{o.op=op;o.z=oz;o.ox=ox;o.oy=oy}ctx.restore();
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
    (((first().an||{}).l||'').startsWith('kb')?slider('Camera move',()=>((first().an||{}).ka||.12)*100,v=>each(o=>{(o.an||(o.an={})).ka=v/100}),{min:4,max:40,suffix:'%'}):null),
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

/* ---------- free photos: Pexels, Unsplash, Pixabay, Openverse, Wikimedia Commons ---------- */
const STOCK_SRC=[['pexels','Pexels',1],['unsplash','Unsplash',1],['pixabay','Pixabay',1],['openverse','Openverse',0],['wikimedia','Wikimedia',0],['freepik','Freepik',1],['burst','Burst',0],['stockvault','StockVault',0]];
const stock={kind:'photo',q:'',page:1,items:[],src:'',status:null,busy:false,err:'',more:true,srcUsed:''};
const stockImg=u=>'/_local/design/stockimg?u='+enc(u);
const stockName=k=>(STOCK_SRC.find(x=>x[0]===k)||[0,k])[1];
const DIRECT_HOSTS=/^https:\/\/(upload\.wikimedia\.org|api\.openverse\.org)\//;
const stockSrcUrl=u=>DIRECT_HOSTS.test(u)?u:stockImg(u);
const sPlain=(h,n)=>String(h||'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#0?39;/g,"'").replace(/\s+/g,' ').trim().slice(0,n);
async function directStock(src,q,page){ // the browser asks Openverse / Wikimedia itself, so a blocked server address cannot break search
  const ctl=new AbortController();const to=setTimeout(()=>ctl.abort(),9000);
  try{
    if(src==='openverse'){const r=await fetch('https://api.openverse.org/v1/images/?page_size=20&page='+page+'&mature=false&license_type=commercial&q='+enc(q||'nature'),{credentials:'omit',signal:ctl.signal});if(!r.ok)throw new Error('openverse '+r.status);const j=await r.json();
      return {source:src,page,items:(j.results||[]).map(p=>{const t=p.thumbnail||(p.id?'https://api.openverse.org/v1/images/'+p.id+'/thumb/':'');return {id:'ov'+p.id,thumb:t,full:t,w:p.width,h:p.height,by:String(p.creator||'').slice(0,80),link:String(p.foreign_landing_url||'').slice(0,300),alt:String(p.title||'').slice(0,120),lic:('CC '+(p.license||'')+' '+(p.license_version||'')).trim().toUpperCase(),lowres:true}}).filter(x=>x.thumb)}}
    const r=await fetch('https://commons.wikimedia.org/w/api.php?origin=*&action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=24&gsroffset='+(page-1)*24+'&gsrsearch='+enc((q||'nature landscape')+' filetype:bitmap')+'&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=1280&iiextmetadatafilter=Artist|LicenseShortName',{credentials:'omit',signal:ctl.signal});if(!r.ok)throw new Error('wikimedia '+r.status);const j=await r.json();
    const pages=Object.values((j.query&&j.query.pages)||{}).sort((a,b)=>(a.index||0)-(b.index||0));
    return {source:src,page,items:pages.map(p=>{const i=(p.imageinfo||[])[0];if(!i||!/^image\/(jpeg|png|webp)$/.test(i.mime||'')||!i.thumburl)return null;const m=i.extmetadata||{};return {id:'wm'+p.pageid,thumb:i.thumburl.replace(/\/\d+px-/,'/330px-'),full:i.thumburl,w:i.width,h:i.height,by:sPlain(m.Artist&&m.Artist.value,80)||'Wikimedia contributor',link:String(i.descriptionurl||'').slice(0,300),alt:String(p.title||'').replace(/^File:/,'').replace(/\.\w+$/,'').replace(/_/g,' ').slice(0,120),lic:sPlain(m.LicenseShortName&&m.LicenseShortName.value,40)}}).filter(Boolean)}
  }finally{clearTimeout(to)}
}
async function stockLoad(reset){
  if(stock.busy)return;stock.busy=true;stock.err='';if(reset){stock.page=1;stock.items=[];stock.more=true}
  const mine=stock.src;
  if(mine==='burst'||mine==='stockvault'){stock.busy=false;return}
  try{let r=null;
    if(mine==='openverse'||mine==='wikimedia'){try{r=await directStock(mine,stock.q,stock.page);if(!r.items.length)r=null}catch(e){r=null}}
    if(!r)r=await api('/design/stock',{q:stock.q,page:stock.page,source:mine,kind:stock.kind});
    if(mine===stock.src){stock.items=stock.items.concat(r.items);stock.more=r.items.length>=10;stock.page++;stock.srcUsed=r.source}}
  catch(e){stock.err=e.message||'Search failed'}
  stock.busy=false;if(tab==='stock')renderPanel();
}
async function addStock(it){
  try{toast('Adding photo…',8000);let b=null;if(DIRECT_HOSTS.test(it.full)){try{const r0=await fetch(it.full,{credentials:'omit'});if(r0.ok)b=await r0.blob()}catch(e){}}if(!b){const r=await fetch(stockImg(it.full),{credentials:'same-origin'});if(!r.ok)throw new Error('The photo could not be loaded');b=await r.blob()}
    const f=new File([b],'photo.jpg',{type:b.type||'image/jpeg'});const a=await ingestImage(f);if(a){addImageAsset(a);const o=selObjs()[0];if(o)o.credit=`${it.by||'Unknown'} · ${stockName(stock.srcUsed)}${it.lic?' · '+it.lic:''}`;toast(`Photo by ${it.by||'the photographer'} · ${stockName(stock.srcUsed)}${it.lic?' · '+it.lic:''}`,4000);if(it.dl)api('/design/stockuse',{dl:it.dl}).catch(()=>{})}}
  catch(e){toast(e.message||'Could not add that photo')}
}
async function pickFromFiles(){
  try{const items=await PUT().ui.showOpenFilePicker({multiple:true,accept:'image/*'});for(const it of [].concat(items||[])){const b=await it.read();const a=await ingestImage(new File([b],it.name,{type:b.type||'image/png'}));if(a)addImageAsset(a)}}catch(e){if(!e||e.code!=='cancelled')toast('Could not open that file')}
}
function pStock(b){
  b.append(el('h3',{class:'ph'},'Photos'));
  const inp=el('input',{class:'f',type:'search',placeholder:'Search free photos',value:stock.q,'aria-label':'Search photos',style:'padding-left:30px'});
  inp.addEventListener('keydown',e=>{if(e.key==='Enter'){stock.q=inp.value.trim();stockLoad(true);renderPanel()}});
  b.append(el('div',{class:'search'},el('span',{html:ic('search',16)}),inp),el('button',{class:'btn wide',html:ic('folder',16)+' Add from Files',onclick:pickFromFiles}));
  if(!stock.status){api('/design/stockstatus').then(s=>{stock.status=s;if(!stock.src)stock.src=['pexels','unsplash','pixabay'].find(k=>s[k])||'openverse';if(tab==='stock'){renderPanel()}}).catch(()=>{stock.status={openverse:true,wikimedia:true};if(!stock.src)stock.src='openverse';if(tab==='stock')renderPanel()});b.append(el('p',{class:'note'},'Loading…'));return}
  b.append(el('div',{class:'chips'},STOCK_SRC.map(([k,l,keyed])=>{const off=keyed&&!stock.status[k];return el('button',{class:'chip','aria-pressed':stock.src===k,title:off?'Add a free '+l+' key in Settings to use it':l,style:off?'opacity:.55':'',onclick:()=>{if(stock.src===k)return;stock.src=k;stock.items=[];stock.err='';stock.page=1;stock.more=true;renderPanel()}},l+(off?' 🔑':''))})));
  const off=(STOCK_SRC.find(x=>x[0]===stock.src)||[])[2]&&!stock.status[stock.src];
  if(stock.src==='burst'||stock.src==='stockvault'){}
  if(stock.src==='burst'||stock.src==='stockvault'){const nm=stockName(stock.src),q=encodeURIComponent(stock.q||'');const url=stock.src==='burst'?'https://burst.shopify.com/photos/search?q='+q:'https://www.stockvault.net/search/?q='+q;
    b.append(el('p',{class:'note'},nm+' has no public search service that this studio can call, so it opens in a new tab. Download a picture there, then use “Add from Files” above to bring it in. '+(stock.src==='burst'?'Burst pictures are free to use (CC0).':'Check each StockVault picture’s license before you use it.')),el('a',{class:'btn wide pri',id:'stockOpen',href:url,target:'_blank',rel:'noopener noreferrer'},'Search '+nm+' for “'+(stock.q||'…')+'”'));return}
  if(stock.src==='freepik'&&stock.status.freepik)b.append(el('div',{class:'chips'},[['photo','Photos'],['vector','Vectors'],['psd','PSD'],['icon','Icons']].map(([k,l])=>el('button',{class:'chip','aria-pressed':stock.kind===k,onclick:()=>{stock.kind=k;stock.items=[];stock.err='';stock.page=1;stock.more=true;renderPanel()}},l))));
  if(off){b.append(el('p',{class:'note'},`${stockName(stock.src)} needs a free key. Add it under Settings › Stock photos in Anands OS, or use Openverse or Wikimedia right now with no key.`));return}
  if(stock.err)b.append(el('p',{class:'note',style:'color:var(--danger)'},stock.err));
  const g=el('div',{class:'grid2'});
  stock.items.forEach(it=>g.append(el('button',{class:'cell',style:'aspect-ratio:4/3;padding:0;overflow:hidden',title:(it.alt||'Photo')+' — '+(it.by||''),'aria-label':'Add photo: '+(it.alt||it.by||'stock photo'),onclick:()=>addStock(it)},el('img',{src:stockSrcUrl(it.thumb),alt:it.alt||'',loading:'lazy',style:'width:100%;height:100%;object-fit:cover',onerror:e=>{const i=e.target;if(!i.dataset.retry){i.dataset.retry=1;setTimeout(()=>{i.src=stockImg(it.thumb)+'&r=1'},400)}else{i.replaceWith(el('span',{class:'note',style:'padding:6px;font-size:11px'},'Preview unavailable'))}}}))));
  b.append(g);
  if(stock.busy)b.append(el('p',{class:'note'},'Loading…'));
  else if(stock.items.length&&stock.more)b.append(el('button',{class:'btn wide',onclick:()=>stockLoad(false)},'Load more'));
  else if(!stock.items.length&&!stock.err)stockLoad(true);
  const lic={pexels:'Pexels license: free to use.',unsplash:'Unsplash license: free to use.',pixabay:'Pixabay license: free to use.',freepik:'Freepik license: free to use with credit to the author (shown when you add one). Previews are medium resolution.',openverse:'Openverse: Creative Commons images that allow commercial use. Credit the creator where the license asks. Medium resolution.',wikimedia:'Wikimedia Commons: free-licensed images. Many need credit (CC BY, CC BY-SA); the license is shown when you add one.'}[stock.src];
  b.append(el('p',{class:'note'},lic));
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
      if(!strokeOn||Math.abs(w-h)<.5){const kk=100/w;return place(o,`<path transform="scale(${nf(w/100)} ${nf(h/100)})" d="${SP[k]}" fill="${fillOf(o.fill,w,h,`scale(${nf(100/w)} ${nf(100/h)})`)}"${(k==='ring'||k.startsWith('ic_'))?' fill-rule="evenodd"':''}${strokeOn?` stroke="${esc(o.stroke)}" stroke-width="${nf(o.sw*kk)}" stroke-linejoin="round"${dashOf(o).length?` stroke-dasharray="${dashOf(o).map(v=>nf(v*kk)).join(' ')}"`:''}`:''}/>`)}
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
let expo={bleed:false,fmt:'png',scale:1,pages:'cur',transp:false,q:.92,days:30};
const FMTS=[['png','PNG'],['jpg','JPG'],['webp','WebP'],['pdf','PDF'],['pdfv','PDF (vector)'],['svg','SVG'],['video','Video'],['gif','GIF'],['json','Project']];
async function makeExport(){
  commit();await ensureAssets();const base=baseName(),pgs=expo.pages==='all'?D.pages:[P()],f=expo.fmt;
  if(f==='json')return {name:base+'.json',blob:new Blob([JSON.stringify({v:1,name:D.name,w:D.w,h:D.h,pages:D.pages,assets:usedAssets()},(k,v)=>k[0]==='_'?undefined:v)],{type:'application/json'})};
  if(f==='pdf')return {name:base+'.pdf',blob:makePdf(pgs)};
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
    if(f==='pdf')body.append(el('label',{class:'row note',style:'gap:8px'},el('input',{type:'checkbox',checked:!!expo.bleed,onchange:e=>{expo.bleed=e.target.checked;draw()}}),'Print-ready: add 3 mm bleed and crop marks'));
    if(f==='png')body.append(el('div',{class:'row'},el('label',{style:'flex:0 0 70px'},'Background'),seg([{v:false,l:'As designed'},{v:true,l:'Transparent'}],()=>expo.transp,v=>{expo.transp=v})));
    if(f==='jpg'||f==='webp')body.append(slider('Quality',()=>expo.q*100,v=>expo.q=v/100,{min:40,max:100,suffix:'%'}));
    const notes={pdf:'PDF pages are high-resolution pictures of your design. Links on objects stay clickable.'+(expo.bleed?' With bleed on, the page is sized in millimetres: 300 dpi designs print at true size.':''),pdfv:'Text and shapes stay sharp and selectable. Your print window opens — choose “Save as PDF”.',svg:'Shapes, text and plain photos stay vector. Effects, filters and drawings are embedded as pictures. Text uses its font name, so install the fonts where you open it.',video:'Plays each page for its page length with its animations. MP4 where this browser can make it, otherwise WebM.',gif:'Looping GIF, up to 720 px wide.',json:'Saves everything, including uploaded images, so you can re-open it later.'};
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
function present(){presentShow()}

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
  const it=(items||[])[0];if(!it)return;hideHome();
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
    if(!new URLSearchParams(location.search).has('open'))setTimeout(()=>{showHome();const hv={docs:'docs',boards:'boards',sites:'sites'}[(location.hash||'').slice(1)];if(hv){home.view=hv;renderHome()}},0);
  })();
})();

/* =====================================================================
   Home screen — Canva-style: sidebar, search banner, design types, recents, templates
   ===================================================================== */
const QUICK=[['Presentation','play','#7048e8',1920,1080],['Instagram post','image','#d6336c',1080,1080],['Story','sparkle','#e8590c',1080,1920],['WhatsApp status','chat','#2f9e44',1080,1920],['Video','film','#1098ad',1920,1080],['Poster','text','#2f9e44',1800,2400],['Flyer','grid','#f59f00',874,1240],['Invitation','heart','#c2255c',1050,1470],['Greeting card','sparkle','#ae3ec9',1050,1470],['Resume','text','#364fc7',1240,1754],['Certificate','trophy','#e67700',1754,1240],['Menu','grid','#e8590c',1240,1754],['YouTube thumbnail','play','#e03131',1280,720],['Facebook cover','image','#1971c2',1640,624],['Logo','brand','#ae3ec9',800,800],['Business card','tpl','#0ca678',1050,600],['Brochure','tpl','#5c940d',1754,1240],['Infographic','chart','#1098ad',800,2000],['T-shirt','tpl','#862e9c',2400,2880],['Custom size','plus','#6f685f',0,0]];
const home={folder:'',dirs:[],view:'home',q:'',cat:'All',fest:'',docs:null,mine:'',sort:'updated',filter:'all',list:false,selMode:false,sel:new Set(),trash:null};
const homeEl=()=>document.getElementById('home');
function showHome(){commit();saveDoc();home.view='home';home.q='';const h=homeEl();h.hidden=false;home.docs=null;renderHome();refreshDocs()}
function hideHome(){const h=homeEl();if(h)h.hidden=true;setTimeout(()=>{fit();renderStrip()},60)}
async function refreshDocs(){try{home.docs=await listDocs();home.dirs=await listFolders()}catch(e){home.docs=[]}if(home.folder&&!home.dirs.includes(home.folder))home.folder='';if(!homeEl().hidden)renderHome()}
function askText(title,val,ok,go){const i=el('input',{class:'f',value:val||'','aria-label':title,maxlength:40});const run=()=>{const v=i.value.trim();if(!v)return;closeModal();go(v)};i.addEventListener('keydown',e=>{if(e.key==='Enter')run()});openModal(el('div',{style:'display:grid;gap:14px;min-width:280px'},el('h2',{style:'margin:0;font-size:18px'},title),i,el('div',{class:'row',style:'display:flex;gap:8px;justify-content:flex-end'},el('button',{class:'btn',onclick:closeModal},'Cancel'),el('button',{class:'btn primary',onclick:run},ok))),true);setTimeout(()=>{i.focus();i.select()},30)}
function askSure(msg,ok,go){openModal(el('div',{style:'display:grid;gap:14px;max-width:340px'},el('p',{style:'margin:0'},msg),el('div',{style:'display:flex;gap:8px;justify-content:flex-end'},el('button',{class:'btn',onclick:closeModal},'Cancel'),el('button',{class:'btn danger',onclick:()=>{closeModal();go()}},ok))),true)}
function startSize(w,h,name){if(!w){openNew();return}newDesign(w,h,name)}
function startTemplate(t){const [w,h]=tplSize(t);newDesign(w,h,t.n);applyTemplate(t)}
function fmtDate(ts){try{return new Date(ts).toLocaleDateString(undefined,{month:'short',day:'numeric'})}catch(e){return ''}}
const hIcon=(n,s)=>ic(n,s||22);
function designCard(r,withActions){
  let armed=false;
  const open=()=>r.id===D.id&&!document.getElementById('home').hidden?(hideHome()):openDesignFile(r._file);
  const card=el('div',{class:'hc'},el('button',{class:'tn','aria-label':'Open '+r.name,onclick:open},r.thumb?el('img',{src:r.thumb,alt:''}):null),el('b',{title:r.name},r.name),el('small',{},`${r.w}×${r.h} · ${r.pages} page${r.pages>1?'s':''} · ${fmtDate(r.updated)}`));
  wireDesignCard(card,r);
  return card;
}
function templateCard(t){const th=el('button',{class:'tn','aria-label':'Use template '+t.n,onclick:()=>startTemplate(t)},tplThumb(t));const [w,h]=tplSize(t);return el('div',{class:'hc'},th,el('b',{title:t.n},t.n),el('small',{},(t.g||t.c)+' · '+w+'×'+h))}
function sizeButtons(list){return el('div',{class:'hsz'},list.map(s=>el('button',{onclick:()=>startSize(s.w,s.h,s.n)},s.n,el('small',{},`${s.w}×${s.h}`))))}
function tplList(){const q=(home.tq||'').trim().toLowerCase();return (q?tplRank(q):TEMPLATES).filter(t=>(home.cat==='All'||t.c===home.cat)&&(!home.fest||t.g===home.fest)&&true)}
const HOME_ROWS=[['Festivals','Indian festivals & greetings',t=>/Greeting$/.test(t.n)],['Wedding & Events','Weddings & celebrations'],['Business','Business & marketing'],['Social','Social media'],['YouTube','YouTube & video'],['Slides','Presentations'],['Print','Print & cards'],['Resume & Docs','Resumes & documents'],['Education','Education'],['Food','Food & restaurants'],['Fashion & Jewellery','Fashion & jewellery'],['Real estate','Real estate'],['Fitness','Fitness & wellness']];
function homeSections(){
  const q=home.q.trim().toLowerCase(),out=[];
  const docs=home.docs;
  if(home.view==='trash')return trashView();
  if(EDKIND[home.view])return edKindView(home.view);
  if(home.view==='projects'){
    const inF=r=>(r.folder||'')===home.folder,qm=home.mine.toLowerCase();
    const list=sortDocs((docs||[]).filter(r=>(qm?r.name.toLowerCase().includes(qm):(home.filter==='starred'||inF(r)))&&(home.filter!=='starred'||r.starred)));
    const s=el('input',{class:'f',type:'search',placeholder:'Search your designs',value:home.mine,'aria-label':'Search your designs',style:'max-width:360px'});
    s.addEventListener('input',()=>{home.mine=s.value;renderHome();const n=document.querySelector('#home input[aria-label="Search your designs"]');if(n){n.focus();n.setSelectionRange(n.value.length,n.value.length)}});
    const newF=el('button',{class:'more',onclick:()=>askText('New folder','','Create',async n=>{try{await makeFolder(n);await refreshDocs()}catch(e){toast('Could not create that folder')}})},'+ New folder');
    out.push(el('div',{class:'hs'},el('h2',{},home.folder?el('span',{},(()=>{const c=el('button',{class:'crumb',title:'Drop a design here to move it out of the folder',onclick:()=>{home.folder='';renderHome()}},'Projects');dropTarget(c,'');return c})(),' / '+home.folder):'Projects'),el('span',{class:'grow'}),home.folder?el('button',{class:'more',onclick:()=>askText('Rename folder',home.folder,'Rename',n=>renameFolder(home.folder,n).then(x=>{home.folder=x;refreshDocs()}).catch(()=>toast('Could not rename')))},'Rename'):null,home.folder?el('button',{class:'more',onclick:()=>askSure('Delete the folder “'+home.folder+'”? Its designs move back to All designs.','Delete folder',async()=>{try{await removeFolder(home.folder);home.folder='';await refreshDocs();toast('Folder deleted')}catch(e){toast('Could not delete')}})},'Delete folder'):null,newF,el('button',{class:'more',onclick:openLinks},'Share links')),s,el('div',{style:'height:16px'}));
    if(docs===null){out.push(el('p',{class:'note'},'Loading…'));return out}
    const dirCards=(home.folder||qm||home.filter==='starred')?[]:home.dirs.map(d=>{const n=docs.filter(r=>r.folder===d);const fc=el('div',{class:'hc'},el('button',{class:'tn fold',onclick:()=>{home.folder=d;renderHome()},'aria-label':'Open folder '+d,html:ic('folder',54)}),el('b',{title:d},d),el('small',{},n.length+' design'+(n.length===1?'':'s')));wireFolderCard(fc,d);return fc});
    out.push(projectsToolbar());if(home.selMode)out.push(selBar(list));
    out.push(list.length||dirCards.length||!home.folder?el('div',{class:'hg big'+(home.list?' list':'')},[el('div',{class:'hc'},el('button',{class:'tn new',onclick:()=>openNew(),'aria-label':'Create a design',html:ic('plus',34)}),el('b',{},'Create new')),...dirCards,...list.map(r=>designCard(r,true))]):el('div',{class:'hempty'},'This folder is empty. Drag a design onto the folder, or right-click a design › Move to folder.'));
    if(!list.length&&!dirCards.length&&!home.folder)out.push(el('div',{class:'hempty'},qm?'No designs match that search.':'Nothing here yet. Your designs save automatically to Files › Designs.'));
    return out;
  }
  if(home.view==='templates'){
    const cats=['All',...TCATS.filter(c=>TEMPLATES.some(t=>t.c===c))];
    const s=el('input',{class:'f',type:'search',placeholder:'Search templates, e.g. Diwali, wedding, resume',value:home.tq||'','aria-label':'Search templates',style:'max-width:420px'});
    s.addEventListener('input',()=>{home.tq=s.value;const g=document.getElementById('tgrid');g.innerHTML='';g.append(...tplList().map(templateCard));document.getElementById('tcount').textContent=tplList().length+' templates'});
    const list=tplList();
    out.push(el('div',{class:'hs'},el('h2',{},'Templates'),el('span',{class:'note',id:'tcount'},list.length+' templates')),s,el('div',{style:'height:12px'}),el('div',{class:'hchips'},cats.map(c=>el('button',{class:'chip','aria-pressed':home.cat===c,onclick:()=>{home.cat=c;home.fest='';renderHome()}},c))));
    if(home.cat==='Festivals')out.push(el('div',{class:'hchips',style:'margin-top:6px'},[['','All festivals'],...FEST.map(F=>[F.n,F.n])].map(([k,l])=>el('button',{class:'chip',style:'font-size:12px;padding:5px 11px','aria-pressed':home.fest===k,onclick:()=>{home.fest=k;renderHome()}},l))));
    out.push(el('div',{style:'height:10px'}),el('div',{class:'hg big',id:'tgrid'},list.map(templateCard)));
    return out;
  }
  if(q){
    const ss=[...SIZES,{n:'Video',w:1920,h:1080},{n:'Presentation',w:1920,h:1080},{n:'Document',w:1240,h:1754}].filter(s=>s.n.toLowerCase().includes(q)),ts=tplRank(q).slice(0,60),ds=(docs||[]).filter(r=>r.name.toLowerCase().includes(q));
    out.push(el('div',{class:'hs'},el('h2',{},`Results for “${home.q.trim()}”`)));
    if(ss.length)out.push(el('div',{class:'hs',style:'margin-top:6px'},el('h2',{style:'font-size:16px'},'Design types')),sizeButtons(ss));
    if(ts.length)out.push(el('div',{class:'hs'},el('h2',{style:'font-size:16px'},'Templates')),el('div',{class:'hg'},ts.map(templateCard)));
    if(ds.length)out.push(el('div',{class:'hs'},el('h2',{style:'font-size:16px'},'Your designs')),el('div',{class:'hg'},ds.map(r=>designCard(r))));
    if(!ss.length&&!ts.length&&!ds.length)out.push(el('div',{class:'hempty'},'Nothing matches that. Try “poster”, “Instagram” or “slide”.'));
    return out;
  }
  out.push(el('div',{class:'hs'},el('h2',{},'Recent designs'),(docs&&docs.length>5)?el('button',{class:'more',onclick:()=>{home.view='projects';renderHome()}},'See all'):null),
    docs===null?el('p',{class:'note'},'Loading…'):el('div',{class:'hg'},[el('div',{class:'hc'},el('button',{class:'tn new',onclick:()=>openNew(),'aria-label':'Create a design',html:ic('plus',34)}),el('b',{},'Create new')),...docs.slice(0,6).map(r=>designCard(r,true))]));
  HOME_ROWS.forEach(([c,label,f])=>{const l=TEMPLATES.filter(t=>t.c===c&&(!f||f(t)));if(!l.length)return;out.push(el('div',{class:'hs'},el('h2',{},label),el('button',{class:'more',onclick:()=>{home.view='templates';home.cat=c;home.fest='';home.tq='';renderHome()}},'See all '+TEMPLATES.filter(t=>t.c===c).length)),el('div',{class:'hg'},l.slice(0,6).map(templateCard)))});
  out.push(el('div',{class:'hs'},el('h2',{},'All sizes')),sizeButtons(SIZES.slice(0,24)),el('button',{class:'more',style:'margin-top:10px',onclick:()=>openNew()},'See all design types'));
  return out;
}
function renderHome(){
  const h=homeEl();if(!h)return;h.innerHTML='';
  const nav=el('nav',{class:'hn','aria-label':'Design Studio'},el('div',{class:'hlogo','aria-hidden':'true'},'D'));
  [['home','Home','home'],['projects','Projects','folder'],['templates','Templates','tpl'],['docs','Docs','doc'],['boards','Whiteboards','board'],['sites','Websites','globe'],['trash','Trash','trash']].forEach(([k,l,i])=>nav.append(el('button',{class:'hi','aria-current':home.view===k,onclick:()=>{home.view=k;home.q='';if(k==='trash')home.trash=null;renderHome();if(k==='projects')refreshDocs()}},el('span',{class:'ib',html:ic(i,20)}),l)));
  nav.append(el('button',{class:'hi',onclick:()=>{hideHome();openTab('brand')}},el('span',{class:'ib',html:ic('brand',20)}),'Brand'),el('span',{class:'sp'}),
    el('button',{class:'hi',onclick:()=>{hideHome()}},el('span',{class:'ib',html:ic('pen',20)}),'Editor'));
  const hero=el('section',{class:'hero'},el('h1',{},'What will you design today?'));
  const inp=el('input',{type:'search',placeholder:'Search designs, templates and sizes',value:home.q,'aria-label':'Search',autocomplete:'off'});
  inp.addEventListener('input',()=>{home.q=inp.value;home.view='home';const body=document.getElementById('hsections');body.innerHTML='';body.append(...homeSections())});
  inp.addEventListener('keydown',e=>{if(e.key==='Escape'){inp.value='';home.q='';inp.dispatchEvent(new Event('input'))}});
  hero.append(el('label',{class:'hsearch'},el('span',{html:ic('search',20)}),inp));
  const main=el('div',{class:'hm'},el('header',{class:'hh'},el('span',{class:'grow'}),el('button',{class:'tb',title:'Light / dark','aria-label':'Toggle theme',onclick:()=>{$('#btnTheme').click();renderHome()},html:$('#btnTheme').innerHTML}),el('button',{class:'hcreate',onclick:()=>openNew(),html:ic('plus',18)+' Create a design'})));
  const body=el('div',{class:'hbody'});
  if(home.view==='home'){
    body.append(hero,el('div',{class:'hq',role:'list'},QUICK.map(([n,i,c,w,hh])=>el('button',{role:'listitem',onclick:()=>startSize(w,hh,n)},el('i',{style:'background:'+c,html:ic(i,26)}),n)).concat(Object.entries(EDKIND).map(([k,v])=>el('button',{role:'listitem','data-new':k,onclick:()=>edNew(k)},el('i',{style:'background:'+v.color,html:ic(v.icon,26)}),v.one)))));
  }
  body.append(el('div',{id:'hsections'},...homeSections()));
  main.append(body);h.append(nav,main);
}
try{document.fonts.addEventListener('loadingdone',()=>{clearTimeout(home.ft);home.ft=setTimeout(()=>{[...tplDrawn].forEach(c=>c.isConnected&&paintThumb(c,c._t))},400)})}catch(e){}
