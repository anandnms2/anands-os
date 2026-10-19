/* Whiteboard: an infinite canvas with sticky notes, shapes, connectors, drawing, pictures and frames */
const cv=$('#cv'),cx=cv.getContext('2d'),stage=$('#stage');
const STICKY=['#fff3a3','#ffd6a5','#ffadad','#caffbf','#9bf6ff','#bdb2ff','#ffc6ff','#ffffff'],FILLS=['#ffffff','#fff3a3','#ffd6a5','#ffadad','#caffbf','#9bf6ff','#bdb2ff','#ffc6ff','#e8590c','#1971c2','#2f9e44','#212529'],INKS=['#1f1c19','#e03131','#e8590c','#f08c00','#2f9e44','#1971c2','#7048e8','#868e96'];
const SHAPES=[['rect','▭','Rectangle'],['round','▢','Rounded'],['ellipse','◯','Ellipse'],['diamond','◇','Diamond'],['triangle','△','Triangle'],['hex','⬡','Hexagon'],['star','☆','Star'],['arrowr','⇨','Arrow'],['cloud','☁','Cloud']];
let B=null,view={x:0,y:0,z:1},tool='select',shapeKind='rect',sel=[],drag=null,undo=[],redo=[],editing=null,space=false,imgs=new Map(),clip=[];
const ed=startEditor('board',{blank:()=>({v:1,type:'board',id:uid(),name:'Untitled whiteboard',items:[],view:{x:-400,y:-260,z:1}}),
  onLoad:r=>{B=r;view=Object.assign({x:-400,y:-260,z:1},r.view);if(!B.items.length&&!B._seeded){B._seeded=true}resize();draw();ctxBar()},collect:r=>{r.view={...view}}});
const items=()=>B.items,byId=id=>items().find(i=>i.id===id);
function snap(){undo.push(JSON.stringify(B.items));if(undo.length>120)undo.shift();redo=[]}
function changed(){draw();ed.queue();ctxBar()}
function doUndo(){if(!undo.length)return;redo.push(JSON.stringify(B.items));B.items=JSON.parse(undo.pop());sel=sel.filter(id=>byId(id));changed()}
function doRedo(){if(!redo.length)return;undo.push(JSON.stringify(B.items));B.items=JSON.parse(redo.pop());sel=sel.filter(id=>byId(id));changed()}
$('#bUndo').onclick=doUndo;$('#bRedo').onclick=doRedo;

/* geometry */
const toW=(sx,sy)=>({x:sx/view.z+view.x,y:sy/view.z+view.y}),toS=(x,y)=>({x:(x-view.x)*view.z,y:(y-view.y)*view.z});
const evW=e=>{const r=cv.getBoundingClientRect();return toW(e.clientX-r.left,e.clientY-r.top)};
function resize(){const r=stage.getBoundingClientRect(),d=devicePixelRatio||1;cv.width=Math.round(r.width*d);cv.height=Math.round(r.height*d);draw()}
addEventListener('resize',resize);
function box(i){if(i.t==='line'){const [a,b]=ends(i);return{x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),w:Math.abs(a.x-b.x),h:Math.abs(a.y-b.y)}}
  if(i.t==='pen'){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;i.pts.forEach(p=>{x0=Math.min(x0,p[0]);y0=Math.min(y0,p[1]);x1=Math.max(x1,p[0]);y1=Math.max(y1,p[1])});return{x:x0,y:y0,w:x1-x0,h:y1-y0}}
  if(i.t==='text'){return{x:i.x,y:i.y,w:i.w,h:textH(i)}}return{x:i.x,y:i.y,w:i.w,h:i.h}}
function wrap(text,w,font){cx.save();cx.font=font;const out=[];String(text||'').split('\n').forEach(par=>{let line='';par.split(' ').forEach(word=>{const t=line?line+' '+word:word;if(cx.measureText(t).width>w&&line){out.push(line);line=word}else line=t});out.push(line)});cx.restore();return out}
const fontOf=(i,fs)=>`${i.bold?'700 ':''}${fs||i.fs||18}px ${i.hand?'Caveat':'"Instrument Sans"'},sans-serif`;
function textH(i){return Math.max((i.fs||24)*1.3,wrap(i.text||' ',i.w,fontOf(i)).length*(i.fs||24)*1.25+6)}
function ends(l){const get=(e,o)=>{const it=e.id&&byId(e.id);if(!it)return{x:e.x,y:e.y};const b=box(it),c={x:b.x+b.w/2,y:b.y+b.h/2};const oc=o.id&&byId(o.id)?(()=>{const ob=box(byId(o.id));return{x:ob.x+ob.w/2,y:ob.y+ob.h/2}})():{x:o.x,y:o.y};
    const dx=oc.x-c.x,dy=oc.y-c.y;if(!dx&&!dy)return c;const k=Math.min(Math.abs(dx)>1e-6?(b.w/2)/Math.abs(dx):1e9,Math.abs(dy)>1e-6?(b.h/2)/Math.abs(dy):1e9);return{x:c.x+dx*k,y:c.y+dy*k}};
  return[get(l.a,l.b),get(l.b,l.a)]}
function hit(i,p,pad){const t=pad;if(i.t==='line'){const[a,b]=ends(i);return segDist(p,a,b)<=Math.max(8/view.z,(i.sw||3)/2+t)}
  if(i.t==='pen'){for(let k=1;k<i.pts.length;k++)if(segDist(p,{x:i.pts[k-1][0],y:i.pts[k-1][1]},{x:i.pts[k][0],y:i.pts[k][1]})<=Math.max(8/view.z,(i.sw||3)/2+t))return true;return false}
  const b=box(i);if(i.t==='frame'){return p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y-30/view.z&&p.y<=b.y+b.h&&(p.y<=b.y+6/view.z||Math.min(p.x-b.x,b.x+b.w-p.x,b.y+b.h-p.y)<8/view.z)}
  return p.x>=b.x-t&&p.x<=b.x+b.w+t&&p.y>=b.y-t&&p.y<=b.y+b.h+t}
function segDist(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy;let t=l?((p.x-a.x)*dx+(p.y-a.y)*dy)/l:0;t=Math.max(0,Math.min(1,t));return Math.hypot(p.x-(a.x+t*dx),p.y-(a.y+t*dy))}
const pick=p=>{const l=items();for(let k=l.length-1;k>=0;k--)if(l[k].t!=='frame'&&hit(l[k],p,2/view.z))return l[k];for(let k=l.length-1;k>=0;k--)if(l[k].t==='frame'&&hit(l[k],p,2/view.z))return l[k];return null};

/* drawing */
function shapePath(c,k,x,y,w,h){c.beginPath();const m=(a,b)=>c.moveTo(a,b),l=(a,b)=>c.lineTo(a,b);
  if(k==='rect')c.rect(x,y,w,h);else if(k==='round')c.roundRect(x,y,w,h,Math.min(w,h)*.18);else if(k==='ellipse')c.ellipse(x+w/2,y+h/2,Math.abs(w/2),Math.abs(h/2),0,0,7);
  else if(k==='diamond'){m(x+w/2,y);l(x+w,y+h/2);l(x+w/2,y+h);l(x,y+h/2);c.closePath()}else if(k==='triangle'){m(x+w/2,y);l(x+w,y+h);l(x,y+h);c.closePath()}
  else if(k==='hex'){m(x+w*.25,y);l(x+w*.75,y);l(x+w,y+h/2);l(x+w*.75,y+h);l(x+w*.25,y+h);l(x,y+h/2);c.closePath()}
  else if(k==='star'){for(let i=0;i<10;i++){const r=i%2?.42:1,a=-Math.PI/2+i*Math.PI/5,px=x+w/2+Math.cos(a)*w/2*r,py=y+h/2+Math.sin(a)*h/2*r;i?l(px,py):m(px,py)}c.closePath()}
  else if(k==='arrowr'){m(x,y+h*.3);l(x+w*.6,y+h*.3);l(x+w*.6,y);l(x+w,y+h/2);l(x+w*.6,y+h);l(x+w*.6,y+h*.7);l(x,y+h*.7);c.closePath()}
  else if(k==='cloud'){m(x+w*.25,y+h*.8);c.bezierCurveTo(x-w*.05,y+h*.8,x-w*.05,y+h*.4,x+w*.22,y+h*.42);c.bezierCurveTo(x+w*.2,y+h*.05,x+w*.55,y+h*.05,x+w*.58,y+h*.32);c.bezierCurveTo(x+w*.75,y+h*.1,x+w*1.02,y+h*.3,x+w*.85,y+h*.55);c.bezierCurveTo(x+w*1.05,y+h*.75,x+w*.9,y+h*.9,x+w*.72,y+h*.8);c.closePath()}
  else c.rect(x,y,w,h)}
function drawText(c,i,x,y,w,h,{center=true,color}={}){const fs=i.fs||18,lines=wrap(i.text||'',w-16,fontOf(i,fs));c.font=fontOf(i,fs);c.fillStyle=color||i.tc||'#1f1c19';c.textBaseline='top';c.textAlign=center?'center':'left';const lh=fs*1.25,th=lines.length*lh,y0=center?y+Math.max(6,(h-th)/2):y+8;lines.forEach((ln,k)=>c.fillText(ln,center?x+w/2:x+8,y0+k*lh))}
function drawItem(c,i,opt={}){
  c.save();
  if(i.t==='sticky'){c.shadowColor='rgba(0,0,0,.22)';c.shadowBlur=14;c.shadowOffsetY=5;c.fillStyle=i.fill||'#fff3a3';c.fillRect(i.x,i.y,i.w,i.h);c.shadowColor='transparent';drawText(c,i,i.x,i.y,i.w,i.h,{center:false})}
  else if(i.t==='text'){drawText(c,i,i.x,i.y,i.w,textH(i),{center:false,color:i.tc})}
  else if(i.t==='shape'){shapePath(c,i.k,i.x,i.y,i.w,i.h);c.fillStyle=i.fill||'#fff';c.fill();c.lineWidth=i.sw||3;c.strokeStyle=i.stroke||'#1f1c19';c.stroke();if(i.text)drawText(c,i,i.x+i.w*.08,i.y,i.w*.84,i.h)}
  else if(i.t==='frame'){c.fillStyle=i.fill||'rgba(255,255,255,.35)';c.fillRect(i.x,i.y,i.w,i.h);c.lineWidth=2;c.strokeStyle='#8a8378';c.setLineDash([10,6]);c.strokeRect(i.x,i.y,i.w,i.h);c.setLineDash([]);c.font='600 18px "Instrument Sans",sans-serif';c.fillStyle='#6f685f';c.textBaseline='bottom';c.textAlign='left';c.fillText(i.title||'Frame',i.x,i.y-6)}
  else if(i.t==='image'){const im=getImg(i.src);if(im&&im.complete&&im.naturalWidth){c.drawImage(im,i.x,i.y,i.w,i.h)}else{c.fillStyle='#d7d2ca';c.fillRect(i.x,i.y,i.w,i.h)}}
  else if(i.t==='pen'){c.strokeStyle=i.color||'#1f1c19';c.lineWidth=i.sw||4;c.lineCap=c.lineJoin='round';c.globalAlpha=i.hl?.4:1;c.beginPath();i.pts.forEach((p,k)=>k?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));if(i.pts.length===1)c.lineTo(i.pts[0][0]+.1,i.pts[0][1]);c.stroke()}
  else if(i.t==='line'){const[a,b]=ends(i);c.strokeStyle=i.color||'#1f1c19';c.fillStyle=c.strokeStyle;c.lineWidth=i.sw||3;c.lineCap='round';if(i.dash)c.setLineDash([i.sw*3,i.sw*2]);c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();c.setLineDash([]);
    const head=(p,q)=>{const ang=Math.atan2(p.y-q.y,p.x-q.x),s=Math.max(12,(i.sw||3)*4);c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x-s*Math.cos(ang-.45),p.y-s*Math.sin(ang-.45));c.lineTo(p.x-s*Math.cos(ang+.45),p.y-s*Math.sin(ang+.45));c.closePath();c.fill()};
    if(i.arrow==='end'||i.arrow==='both')head(b,a);if(i.arrow==='both')head(a,b);if(i.text){const m={x:(a.x+b.x)/2,y:(a.y+b.y)/2};c.font=fontOf(i,i.fs||16);c.textAlign='center';c.textBaseline='middle';const w=c.measureText(i.text).width+12;c.fillStyle='#fff';c.fillRect(m.x-w/2,m.y-12,w,24);c.fillStyle='#1f1c19';c.fillText(i.text,m.x,m.y)}}
  c.restore()}
const getImg=src=>{let im=imgs.get(src);if(!im){im=new Image();im.onload=()=>draw();im.src=src;imgs.set(src,im)}return im};
function draw(){if(!B)return;const d=devicePixelRatio||1,W=cv.width/d,H=cv.height/d;cx.setTransform(d,0,0,d,0,0);cx.clearRect(0,0,W,H);
  const dark=matchMedia('(prefers-color-scheme:dark)').matches&&document.documentElement.dataset.theme!=='light'||document.documentElement.dataset.theme==='dark';
  cx.fillStyle=dark?'#1d1b19':'#f4f1ec';cx.fillRect(0,0,W,H);
  const g=40*view.z;if(g>9){const ox=-(view.x*view.z)%g,oy=-(view.y*view.z)%g;cx.fillStyle=dark?'#3a3632':'#cfc8bd';for(let x=ox;x<W;x+=g)for(let y=oy;y<H;y+=g)cx.fillRect(x-1,y-1,2,2)}
  cx.save();cx.scale(view.z,view.z);cx.translate(-view.x,-view.y);
  items().forEach(i=>{if(editing&&editing.id===i.id&&i.t!=='line'){const t=i.text;i.text='';drawItem(cx,i);i.text=t}else drawItem(cx,i)});
  sel.forEach(id=>{const i=byId(id);if(!i)return;const b=box(i);cx.strokeStyle='#e8590c';cx.lineWidth=2/view.z;cx.setLineDash([]);if(i.t==='line'){const[a,c2]=ends(i);[a,c2].forEach(p=>{cx.fillStyle='#fff';cx.beginPath();cx.arc(p.x,p.y,6/view.z,0,7);cx.fill();cx.stroke()})}else{cx.strokeRect(b.x,b.y,b.w,b.h);if(sel.length===1&&i.t!=='pen')handles(b).forEach(h=>{cx.fillStyle='#fff';cx.fillRect(h.x-5/view.z,h.y-5/view.z,10/view.z,10/view.z);cx.strokeRect(h.x-5/view.z,h.y-5/view.z,10/view.z,10/view.z)})}});
  if(drag&&drag.k==='marquee'){cx.fillStyle='rgba(232,89,12,.1)';cx.strokeStyle='#e8590c';cx.lineWidth=1/view.z;const m=drag;cx.fillRect(Math.min(m.x0,m.x1),Math.min(m.y0,m.y1),Math.abs(m.x1-m.x0),Math.abs(m.y1-m.y0));cx.strokeRect(Math.min(m.x0,m.x1),Math.min(m.y0,m.y1),Math.abs(m.x1-m.x0),Math.abs(m.y1-m.y0))}
  if(drag&&drag.k==='draft'&&drag.item){drawItem(cx,drag.item)}
  cx.restore();$('#zv').textContent=Math.round(view.z*100)+'%'}
const handles=b=>[[0,0],[.5,0],[1,0],[0,.5],[1,.5],[0,1],[.5,1],[1,1]].map(([a,c])=>({x:b.x+b.w*a,y:b.y+b.h*c,ax:a,ay:c}));
function handleAt(i,p){if(i.t==='line'||i.t==='pen')return null;const b=box(i);return handles(b).find(h=>Math.abs(h.x-p.x)<9/view.z&&Math.abs(h.y-p.y)<9/view.z)||null}
function lineEndAt(i,p){if(i.t!=='line')return null;const[a,b]=ends(i);if(Math.hypot(p.x-a.x,p.y-a.y)<10/view.z)return'a';if(Math.hypot(p.x-b.x,p.y-b.y)<10/view.z)return'b';return null}

/* tools */
const TOOLS=[['select','➤','Select (V)'],['hand','✋','Pan (H)'],['sticky','🗒','Sticky note (S)'],['text','T','Text (T)'],['shape','▭','Shapes (R)'],['line','↗','Connector (C)'],['pen','✎','Pen (P)'],['hl','▬','Highlighter'],['eraser','⌫','Eraser (E)'],['frame','▣','Frame (F)'],['image','🖼','Picture (I)']];
const left=$('#left');let shapesBox=null;
function buildTools(){left.innerHTML='';TOOLS.forEach(([k,ic_,t],n)=>{if(n===2||n===9)left.append(el('hr'));left.append(el('button',{title:t,'aria-label':t,'aria-pressed':tool===k,onclick:()=>setTool(k)},k==='shape'?(SHAPES.find(s=>s[0]===shapeKind)||SHAPES[0])[1]:ic_))})}
function setTool(k){if(k==='image'){pickImage(src=>{snap();const im=getImg(src);const add=()=>{const w=Math.min(420,im.naturalWidth||420),h=w*(im.naturalHeight||300)/(im.naturalWidth||420);const c=toW(cv.clientWidth/2,cv.clientHeight/2);const it={id:uid(),t:'image',x:c.x-w/2,y:c.y-h/2,w,h,src};items().push(it);sel=[it.id];changed()};im.complete&&im.naturalWidth?add():im.addEventListener('load',add,{once:true})},1600);return}
  if(k==='shape'&&tool==='shape'){toggleShapes();return}tool=k;sel=k==='select'?sel:[];closeShapes();if(k==='shape')toggleShapes(true);buildTools();cv.style.cursor=k==='hand'?'grab':k==='select'?'default':'crosshair';draw();ctxBar()}
function closeShapes(){if(shapesBox){shapesBox.remove();shapesBox=null}}
function toggleShapes(on){if(shapesBox&&!on){closeShapes();return}closeShapes();shapesBox=el('div',{id:'shapes',role:'menu'},SHAPES.map(([k,g,t])=>el('button',{title:t,'aria-label':t,onclick:()=>{shapeKind=k;tool='shape';closeShapes();buildTools();cv.style.cursor='crosshair'}},g)));stage.append(shapesBox)}
buildTools();

/* pointer handling */
let spaceDown=false;
addEventListener('keydown',e=>{if(e.code==='Space'&&!editing&&document.activeElement===document.body||e.code==='Space'&&document.activeElement===cv){spaceDown=true;e.preventDefault();cv.style.cursor='grab'}});
addEventListener('keyup',e=>{if(e.code==='Space'){spaceDown=false;cv.style.cursor=tool==='hand'?'grab':tool==='select'?'default':'crosshair'}});
cv.addEventListener('pointerdown',e=>{cv.focus();closeShapes();if(editing)commitEdit();const p=evW(e);cv.setPointerCapture(e.pointerId);const sx=e.clientX,sy=e.clientY;
  if(e.button===1||e.button===2&&false||spaceDown||tool==='hand'){drag={k:'pan',sx,sy,vx:view.x,vy:view.y};cv.style.cursor='grabbing';return}
  if(e.button===2)return;
  if(tool==='select'){
    if(sel.length===1){const i=byId(sel[0]);const h=i&&handleAt(i,p);if(h){snap();drag={k:'resize',i,h,o:{...box(i)},p0:p,fs0:i.fs};return}const le=i&&lineEndAt(i,p);if(le){snap();drag={k:'lend',i,which:le};return}}
    const it=pick(p);
    if(it){if(e.shiftKey){sel=sel.includes(it.id)?sel.filter(x=>x!==it.id):[...sel,it.id]}else if(!sel.includes(it.id))sel=[it.id];snap();const mv=new Set(sel);sel.forEach(id=>{const f=byId(id);if(f&&f.t==='frame'){items().forEach(o=>{if(o!==f&&o.t!=='frame'||0){const b=box(o);if(b.x>=f.x&&b.y>=f.y&&b.x+b.w<=f.x+f.w&&b.y+b.h<=f.y+f.h)mv.add(o.id)}})}});drag={k:'move',p0:p,ids:[...mv],orig:[...mv].map(id=>JSON.stringify(byId(id))),moved:false};if(e.altKey){drag.dup=true}}
    else{if(!e.shiftKey)sel=[];drag={k:'marquee',x0:p.x,y0:p.y,x1:p.x,y1:p.y}}
    draw();ctxBar();return}
  if(tool==='sticky'){snap();const it={id:uid(),t:'sticky',x:p.x-90,y:p.y-90,w:180,h:180,fill:STICKY[(items().filter(i=>i.t==='sticky').length)%7],text:'',fs:20,hand:true};items().push(it);sel=[it.id];tool='select';buildTools();changed();startEdit(it);return}
  if(tool==='text'){snap();const it={id:uid(),t:'text',x:p.x,y:p.y,w:260,text:'',fs:28,tc:'#1f1c19'};items().push(it);sel=[it.id];tool='select';buildTools();changed();startEdit(it);return}
  if(tool==='shape'||tool==='frame'){drag={k:'draft',p0:p,item:null,kind:tool}}
  else if(tool==='line'){const s=pick(p);drag={k:'draft',kind:'line',p0:p,fromId:s&&s.t!=='line'&&s.t!=='pen'?s.id:null,item:{t:'line',a:{x:p.x,y:p.y,id:s&&s.t!=='line'&&s.t!=='pen'?s.id:undefined},b:{x:p.x,y:p.y},arrow:'end',color:'#1f1c19',sw:3}}}
  else if(tool==='pen'||tool==='hl'){drag={k:'draft',kind:'pen',item:{t:'pen',pts:[[p.x,p.y]],color:tool==='hl'?'#ffd43b':penColor,sw:tool==='hl'?22/view.z:Math.max(3,4/view.z),hl:tool==='hl'}}}
  else if(tool==='eraser'){snap();drag={k:'erase'};eraseAt(p)}
  draw()});
let penColor='#1f1c19';
cv.addEventListener('pointermove',e=>{if(!drag){return}const p=evW(e);
  if(drag.k==='pan'){view.x=drag.vx-(e.clientX-drag.sx)/view.z;view.y=drag.vy-(e.clientY-drag.sy)/view.z;draw();return}
  if(drag.k==='move'){let dx=p.x-drag.p0.x,dy=p.y-drag.p0.y;if(!drag.moved&&Math.hypot(dx,dy)*view.z<3)return;drag.moved=true;drag.ids.forEach((id,n)=>{const o=JSON.parse(drag.orig[n]),i=byId(id);if(!i)return;if(i.t==='pen'){i.pts=o.pts.map(q=>[q[0]+dx,q[1]+dy])}else if(i.t==='line'){if(!o.a.id){i.a.x=o.a.x+dx;i.a.y=o.a.y+dy}if(!o.b.id){i.b.x=o.b.x+dx;i.b.y=o.b.y+dy}}else{i.x=o.x+dx;i.y=o.y+dy}});draw();ctxBar();return}
  if(drag.k==='marquee'){drag.x1=p.x;drag.y1=p.y;const r={x:Math.min(drag.x0,drag.x1),y:Math.min(drag.y0,drag.y1),w:Math.abs(drag.x1-drag.x0),h:Math.abs(drag.y1-drag.y0)};sel=items().filter(i=>{const b=box(i);return b.x<r.x+r.w&&b.x+b.w>r.x&&b.y<r.y+r.h&&b.y+b.h>r.y&&(i.t!=='frame'||(b.x>=r.x&&b.y>=r.y&&b.x+b.w<=r.x+r.w&&b.y+b.h<=r.y+r.h))}).map(i=>i.id);draw();return}
  if(drag.k==='resize'){const i=drag.i,o=drag.o,h=drag.h;let x0=o.x,y0=o.y,x1=o.x+o.w,y1=o.y+o.h;if(h.ax===0)x0=p.x;if(h.ax===1)x1=p.x;if(h.ay===0)y0=p.y;if(h.ay===1)y1=p.y;if(e.shiftKey&&h.ax!==.5&&h.ay!==.5){const k=o.w/o.h,w=Math.abs(x1-x0),hh=Math.abs(y1-y0);if(w/hh>k){const nh=w/k;if(h.ay===0)y0=y1-nh;else y1=y0+nh}else{const nw=hh*k;if(h.ax===0)x0=x1-nw;else x1=x0+nw}}
    const nx=Math.min(x0,x1),ny=Math.min(y0,y1),nw=Math.max(24,Math.abs(x1-x0)),nh=Math.max(i.t==='text'?0:24,Math.abs(y1-y0));i.x=nx;i.y=ny;i.w=nw;if(i.t!=='text')i.h=nh;if(i.t==='text'&&drag.fs0&&h.ay!==.5)i.fs=Math.max(8,Math.round(drag.fs0*nw/o.w));draw();ctxBar();return}
  if(drag.k==='lend'){const s=pick(p);const e2=drag.which==='a'?drag.i.a:drag.i.b;if(s&&s!==drag.i&&s.t!=='line'&&s.t!=='pen'){e2.id=s.id;delete e2.x;delete e2.y}else{const pt=ends(drag.i)[drag.which==='a'?0:1];delete e2.id;e2.x=p.x;e2.y=p.y}draw();return}
  if(drag.k==='draft'){if(drag.kind==='pen'){drag.item.pts.push([p.x,p.y])}else if(drag.kind==='line'){const s=pick(p);drag.item.b=s&&s.id!==drag.fromId&&s.t!=='line'&&s.t!=='pen'?{id:s.id,x:p.x,y:p.y}:{x:p.x,y:p.y}}else{const x=Math.min(drag.p0.x,p.x),y=Math.min(drag.p0.y,p.y),w=Math.abs(p.x-drag.p0.x),h=Math.abs(p.y-drag.p0.y);drag.item=drag.kind==='frame'?{id:'d',t:'frame',x,y,w,h,title:'Frame'}:{id:'d',t:'shape',k:shapeKind,x,y,w,h,fill:'#ffffff',stroke:'#1f1c19',sw:3,fs:20}}draw();return}
  if(drag.k==='erase'){eraseAt(p);draw()}});
cv.addEventListener('pointerup',e=>{if(!drag)return;const d=drag;drag=null;cv.style.cursor=tool==='hand'?'grab':tool==='select'?'default':'crosshair';
  if(d.k==='move'){if(!d.moved){undo.pop()}else if(d.dup){/* alt-drag duplicates the originals in place */const copies=d.ids.map((id,n)=>{const c=JSON.parse(d.orig[n]);c.id=uid();return c});items().splice(items().indexOf(byId(d.ids[0])),0,...copies)}ed.queue()}
  else if(d.k==='draft'&&d.item){const it=d.item;if(it.t==='pen'){snap();it.id=uid();items().push(it)}else if(it.t==='line'){const[a,b]=ends(it);if(Math.hypot(a.x-b.x,a.y-b.y)>8/view.z){snap();it.id=uid();items().push(it);sel=[it.id]}}else if(it.w>8/view.z&&it.h>8/view.z){snap();it.id=uid();items().push(it);sel=[it.id];if(it.t==='shape')startEdit(it)}else if(it.t==='shape'||it.t==='frame'){snap();it.w=it.t==='frame'?640:160;it.h=it.t==='frame'?420:110;it.id=uid();items().push(it);sel=[it.id]}
    if(it.t!=='pen'&&tool!=='pen'){tool='select';buildTools()}}
  else if(d.k==='erase'||d.k==='resize'||d.k==='lend')ed.queue();
  changed()});
function eraseAt(p){const l=items();for(let k=l.length-1;k>=0;k--){const i=l[k];if((i.t==='pen'||i.t==='line')&&hit(i,p,6/view.z)){l.splice(k,1)}else if(i.t!=='frame'&&i.t!=='pen'&&i.t!=='line'&&0){}}sel=sel.filter(id=>byId(id))}
cv.addEventListener('dblclick',e=>{const p=evW(e);const it=pick(p);if(it&&it.t!=='pen'&&it.t!=='image'){startEdit(it)}else if(!it&&tool==='select'){snap();const s={id:uid(),t:'sticky',x:p.x-90,y:p.y-90,w:180,h:180,fill:STICKY[items().filter(i=>i.t==='sticky').length%7],text:'',fs:20,hand:true};items().push(s);sel=[s.id];changed();startEdit(s)}});
cv.addEventListener('wheel',e=>{e.preventDefault();if(e.ctrlKey||e.metaKey){const r=cv.getBoundingClientRect(),sx=e.clientX-r.left,sy=e.clientY-r.top,w0=toW(sx,sy),nz=clamp(view.z*Math.exp(-e.deltaY*.0022),.1,4);view.z=nz;view.x=w0.x-sx/nz;view.y=w0.y-sy/nz}else{view.x+=(e.shiftKey?e.deltaY:e.deltaX)/view.z;view.y+=(e.shiftKey?0:e.deltaY)/view.z}draw();ed.queue()},{passive:false});
function zoomBy(f){const r=cv.getBoundingClientRect(),sx=r.width/2,sy=r.height/2,w0=toW(sx,sy);view.z=clamp(view.z*f,.1,4);view.x=w0.x-sx/view.z;view.y=w0.y-sy/view.z;draw();ed.queue()}
$('#zi').onclick=()=>zoomBy(1.25);$('#zo').onclick=()=>zoomBy(.8);$('#zf').onclick=fit;
function fit(){const l=items();if(!l.length){view={x:-400,y:-260,z:1};draw();return}let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;l.forEach(i=>{const b=box(i);x0=Math.min(x0,b.x);y0=Math.min(y0,b.y-24);x1=Math.max(x1,b.x+b.w);y1=Math.max(y1,b.y+b.h)});const r=cv.getBoundingClientRect(),z=clamp(Math.min((r.width-160)/(x1-x0||1),(r.height-120)/(y1-y0||1)),.1,1.5);view.z=z;view.x=(x0+x1)/2-r.width/2/z;view.y=(y0+y1)/2-r.height/2/z;draw();ed.queue()}
/* touch pinch */
const pts=new Map();cv.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'){pts.set(e.pointerId,e);if(pts.size===2){drag=null}}},true);
cv.addEventListener('pointermove',e=>{if(e.pointerType!=='touch'||!pts.has(e.pointerId))return;const prev=pts.get(e.pointerId);pts.set(e.pointerId,e);if(pts.size===2){const [a,b]=[...pts.values()];const o=[...pts.values()].find(x=>x.pointerId!==e.pointerId);const d0=Math.hypot(prev.clientX-o.clientX,prev.clientY-o.clientY),d1=Math.hypot(e.clientX-o.clientX,e.clientY-o.clientY);if(d0>0){const r=cv.getBoundingClientRect(),sx=(e.clientX+o.clientX)/2-r.left,sy=(e.clientY+o.clientY)/2-r.top,w0=toW(sx,sy);view.z=clamp(view.z*d1/d0,.1,4);view.x=w0.x-sx/view.z;view.y=w0.y-sy/view.z;draw()}}},true);
['pointerup','pointercancel'].forEach(t=>cv.addEventListener(t,e=>pts.delete(e.pointerId),true));

/* text editing overlay */
function startEdit(i){if(i.t==='line'&&!i.text)i.text='';editing=i;const b=box(i),s=toS(b.x,b.y),fs=(i.fs||18)*view.z;const ta=el('textarea',{id:'editor','aria-label':'Edit text',value:i.text||'',style:`left:${s.x}px;top:${s.y}px;width:${Math.max(80,b.w*view.z)}px;height:${Math.max(40,(i.t==='text'?textH(i):b.h)*view.z)}px;font-size:${fs}px;font-family:${i.hand?'Caveat':'"Instrument Sans"'},sans-serif;${i.t==='shape'?'text-align:center;':''}`});ta.value=i.text||'';stage.append(ta);ta.focus();ta.select();
  const done=()=>commitEdit();ta.addEventListener('blur',done);ta.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();ta.value=i.text||'';ta.blur()}else if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){ta.blur()}e.stopPropagation()});ta.addEventListener('input',()=>{if(i.t==='text'){ta.style.height='auto';ta.style.height=Math.max(40,ta.scrollHeight)+'px'}});draw()}
function commitEdit(){const ta=$('#editor');if(!ta||!editing)return;const i=editing;editing=null;const v=ta.value;ta.remove();if((i.text||'')!==v){snap();i.text=v}if(i.t==='text'&&!v.trim()){const k=items().indexOf(i);if(k>=0)items().splice(k,1);sel=sel.filter(x=>x!==i.id)}changed()}

/* keyboard */
addEventListener('keydown',e=>{if(editing||/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)||$('.modal'))return;const m=e.ctrlKey||e.metaKey,k=e.key.toLowerCase();
  if(m&&k==='z'){e.preventDefault();e.shiftKey?doRedo():doUndo()}else if(m&&k==='y'){e.preventDefault();doRedo()}
  else if(m&&k==='a'){e.preventDefault();sel=items().map(i=>i.id);changed()}
  else if(m&&k==='c'){clip=sel.map(id=>JSON.parse(JSON.stringify(byId(id))));toast('Copied')}
  else if(m&&k==='v'){if(!clip.length)return;e.preventDefault();snap();const ids={};const n=clip.map(c=>{const x=JSON.parse(JSON.stringify(c));ids[c.id]=x.id=uid();return x});n.forEach(x=>{if(x.t==='pen')x.pts=x.pts.map(q=>[q[0]+30,q[1]+30]);else if(x.t==='line'){['a','b'].forEach(w=>{if(x[w].id&&ids[x[w].id])x[w].id=ids[x[w].id];else if(x[w].id)delete x[w].id;if(x[w].x!=null){x[w].x+=30;x[w].y+=30}})}else{x.x+=30;x.y+=30}});items().push(...n);sel=n.map(x=>x.id);changed()}
  else if(m&&k==='d'){e.preventDefault();dup()}
  else if(e.key==='Delete'||e.key==='Backspace'){if(sel.length){e.preventDefault();del()}}
  else if(e.key==='Escape'){sel=[];setTool('select')}
  else if(e.key.startsWith('Arrow')&&sel.length){e.preventDefault();snap();const s=(e.shiftKey?10:1),dx=e.key==='ArrowLeft'?-s:e.key==='ArrowRight'?s:0,dy=e.key==='ArrowUp'?-s:e.key==='ArrowDown'?s:0;sel.forEach(id=>{const i=byId(id);if(!i)return;if(i.t==='pen')i.pts=i.pts.map(q=>[q[0]+dx,q[1]+dy]);else if(i.t==='line'){if(!i.a.id){i.a.x+=dx;i.a.y+=dy}if(!i.b.id){i.b.x+=dx;i.b.y+=dy}}else{i.x+=dx;i.y+=dy}});changed()}
  else if(e.key==='Enter'&&sel.length===1){const i=byId(sel[0]);if(i&&i.t!=='pen'&&i.t!=='image'){e.preventDefault();startEdit(i)}}
  else if(!m&&!e.altKey){const mp={v:'select',h:'hand',s:'sticky',t:'text',r:'shape',c:'line',p:'pen',e:'eraser',f:'frame',i:'image'}[k];if(mp)setTool(mp)}});
function del(){snap();const s=new Set(sel);B.items=items().filter(i=>!s.has(i.id)).map(i=>{if(i.t==='line'){['a','b'].forEach(w=>{if(i[w].id&&s.has(i[w].id)){const it=byId(i[w].id),[a,b]=ends(i);const p=w==='a'?a:b;i[w]={x:p.x,y:p.y}}})}return i});sel=[];changed()}
function dup(){if(!sel.length)return;snap();const ids={},n=sel.map(id=>{const x=JSON.parse(JSON.stringify(byId(id)));ids[id]=x.id=uid();return x});n.forEach(x=>{if(x.t==='pen')x.pts=x.pts.map(q=>[q[0]+30,q[1]+30]);else if(x.t==='line'){['a','b'].forEach(w=>{if(x[w].id&&ids[x[w].id])x[w].id=ids[x[w].id];else{if(x[w].id)delete x[w].id;if(x[w].x!=null){x[w].x+=30;x[w].y+=30}}})}else{x.x+=30;x.y+=30}});items().push(...n);sel=n.map(x=>x.id);changed()}
function order(dir){snap();const s=new Set(sel),l=items();if(dir==='front')B.items=[...l.filter(i=>!s.has(i.id)),...l.filter(i=>s.has(i.id))];else B.items=[...l.filter(i=>s.has(i.id)),...l.filter(i=>!s.has(i.id))];changed()}

/* contextual toolbar */
function ctxBar(){let bar=$('#ctxbar');if(bar)bar.remove();if(!B||!sel.length||editing||(drag&&drag.k==='move'&&drag.moved)||drag&&drag.k==='resize')return;
  const its=sel.map(byId).filter(Boolean);if(!its.length)return;const f=its[0];let x0=1e9,y0=1e9,x1=-1e9;its.forEach(i=>{const b=box(i);x0=Math.min(x0,b.x);y0=Math.min(y0,b.y);x1=Math.max(x1,b.x+b.w)});const s=toS((x0+x1)/2,y0);
  bar=el('div',{id:'ctxbar',role:'toolbar','aria-label':'Selection'});
  const sw=(cols,get,set,label)=>cols.forEach(c=>bar.append(el('button',{class:'sw',title:label+' '+c,'aria-label':label+' '+c,'aria-pressed':get()===c,style:'background:'+c,onclick:()=>{snap();set(c);changed()}})));
  const fillable=its.every(i=>['sticky','shape','frame'].includes(i.t)),inkable=its.every(i=>['line','pen','shape'].includes(i.t)),texty=its.every(i=>['sticky','text','shape','line'].includes(i.t));
  if(fillable){sw(f.t==='sticky'?STICKY:FILLS,()=>f.fill,c=>its.forEach(i=>i.fill=c),'Fill');bar.append(el('span',{class:'sep'}))}
  if(its.every(i=>i.t==='text')){sw(INKS,()=>f.tc,c=>its.forEach(i=>i.tc=c),'Text colour');bar.append(el('span',{class:'sep'}))}
  if(inkable){sw(INKS,()=>f.t==='shape'?f.stroke:f.color,c=>its.forEach(i=>{if(i.t==='shape')i.stroke=c;else i.color=c}),'Line colour');bar.append(el('button',{class:'t',title:'Thinner',onclick:()=>{snap();its.forEach(i=>i.sw=Math.max(1,(i.sw||3)-1));changed()}},'−'),el('button',{class:'t',title:'Thicker',onclick:()=>{snap();its.forEach(i=>i.sw=Math.min(24,(i.sw||3)+1));changed()}},'+'),el('span',{class:'sep'}))}
  if(its.every(i=>i.t==='line')){bar.append(el('button',{class:'t',onclick:()=>{snap();const n={none:'end',end:'both',both:'none'};its.forEach(i=>i.arrow=n[i.arrow||'none']);changed()}},'Arrow: '+(f.arrow||'none')),el('button',{class:'t',onclick:()=>{snap();its.forEach(i=>i.dash=!i.dash);changed()}},f.dash?'Solid':'Dashed'),el('button',{class:'t',onclick:()=>startEdit(f)},'Label'),el('span',{class:'sep'}))}
  if(texty&&!its.every(i=>i.t==='line')){bar.append(el('button',{class:'t',title:'Smaller text',onclick:()=>{snap();its.forEach(i=>i.fs=Math.max(8,(i.fs||18)-2));changed()}},'A−'),el('button',{class:'t',title:'Larger text',onclick:()=>{snap();its.forEach(i=>i.fs=Math.min(120,(i.fs||18)+2));changed()}},'A+'),el('button',{class:'t',title:'Bold',onclick:()=>{snap();its.forEach(i=>i.bold=!i.bold);changed()}},'B'),el('span',{class:'sep'}))}
  if(f.t==='frame')bar.append(el('button',{class:'t',onclick:()=>askText('Frame title',f.title||'','Save',v=>{snap();f.title=v;changed()})},'Title'),el('span',{class:'sep'}));
  bar.append(el('button',{class:'t',title:'Duplicate (Ctrl+D)',onclick:dup},'⧉'),el('button',{class:'t',title:'Bring to front',onclick:()=>order('front')},'⬆'),el('button',{class:'t',title:'Send to back',onclick:()=>order('back')},'⬇'),el('button',{class:'t',title:'Delete',style:'color:var(--danger)',onclick:del},'🗑'));
  stage.append(bar);const r=bar.getBoundingClientRect(),sr=stage.getBoundingClientRect();bar.style.left=clamp(s.x-r.width/2,8,sr.width-r.width-8)+'px';bar.style.top=clamp(s.y-r.height-12,8,sr.height-r.height-8)+'px'}
cv.addEventListener('contextmenu',e=>{e.preventDefault();const p=evW(e),it=pick(p);if(it&&!sel.includes(it.id)){sel=[it.id];draw();ctxBar()}const has=!!sel.length;
  ctxMenu(e.clientX,e.clientY,[...(has?[{label:'Edit text',off:!sel.length||['pen','image'].includes((byId(sel[0])||{}).t),go:()=>startEdit(byId(sel[0]))},{label:'Duplicate',key:'Ctrl D',go:dup},{label:'Copy',key:'Ctrl C',go:()=>{clip=sel.map(id=>JSON.parse(JSON.stringify(byId(id))));toast('Copied')}},{label:'Bring to front',go:()=>order('front')},{label:'Send to back',go:()=>order('back')},{label:'Delete',key:'Del',go:del},'-']:[]),
    {label:'Add sticky note here',go:()=>{snap();const s={id:uid(),t:'sticky',x:p.x-90,y:p.y-90,w:180,h:180,fill:STICKY[items().length%7],text:'',fs:20,hand:true};items().push(s);sel=[s.id];changed();startEdit(s)}},{label:'Paste',key:'Ctrl V',off:!clip.length,go:()=>dispatchEvent(new KeyboardEvent('keydown',{key:'v',ctrlKey:true}))},{label:'Select all',key:'Ctrl A',go:()=>{sel=items().map(i=>i.id);changed()}},{label:'Fit to screen',go:fit}])});

/* templates */
const S=(x,y,t,fill,w=180,h=180)=>({t:'sticky',x,y,w,h,fill,text:t,fs:20,hand:true});
const SH=(k,x,y,w,h,t,fill)=>({t:'shape',k,x,y,w,h,fill:fill||'#fff',stroke:'#1f1c19',sw:3,text:t,fs:20});
const TX=(x,y,t,fs=36,w=520)=>({t:'text',x,y,w,text:t,fs,bold:true,tc:'#1f1c19'});
const FR=(x,y,w,h,title)=>({t:'frame',x,y,w,h,title});
const CN=(a,b,arrow='end')=>({t:'line',a:{id:a},b:{id:b},arrow,color:'#1f1c19',sw:3});
const TEMPLATES=[
 ['Brainstorm','Capture ideas around a question',()=>[TX(0,-60,'Brainstorm: what is the question?',34,700),FR(0,0,880,520,'Ideas'),S(30,40,'Idea 1',STICKY[0]),S(240,40,'Idea 2',STICKY[1]),S(450,40,'Idea 3',STICKY[3]),S(660,40,'Idea 4',STICKY[4]),S(30,250,'Idea 5',STICKY[5]),S(240,250,'Idea 6',STICKY[2])]],
 ['Kanban','To do, doing, done',()=>[TX(0,-60,'Project board',34),...['To do','Doing','Done'].flatMap((c,k)=>[FR(k*320,0,300,560,c),S(k*320+60,40,k?'':'Task',STICKY[k*2],180,110)])]],
 ['Flowchart','Start, steps, a decision and an end',()=>{const a=SH('round',0,0,200,80,'Start','#caffbf'),b=SH('rect',0,160,200,80,'Do the first step'),c=SH('diamond',-20,320,240,130,'Is it OK?','#fff3a3'),d=SH('rect',-300,360,200,80,'Fix it'),e=SH('round',0,540,200,80,'Finish','#ffadad');[a,b,c,d,e].forEach((x,i)=>x.id='t'+i);return[a,b,c,d,e,CN('t0','t1'),CN('t1','t2'),CN('t2','t3'),CN('t3','t1'),CN('t2','t4')]}],
 ['SWOT','Strengths, weaknesses, opportunities, threats',()=>[TX(0,-60,'SWOT analysis',34),FR(0,0,420,300,'Strengths'),FR(440,0,420,300,'Weaknesses'),FR(0,320,420,300,'Opportunities'),FR(440,320,420,300,'Threats'),S(30,40,'',STICKY[3],160,160),S(470,40,'',STICKY[2],160,160),S(30,360,'',STICKY[4],160,160),S(470,360,'',STICKY[1],160,160)]],
 ['Retrospective','Went well, to improve, actions',()=>[TX(0,-60,'Team retrospective',34),...['Went well','To improve','Action items'].flatMap((c,k)=>[FR(k*320,0,300,520,c),S(k*320+60,40,'',[STICKY[3],STICKY[2],STICKY[0]][k],180,110)])]],
 ['Mind map','A central idea and branches',()=>{const c=SH('ellipse',0,0,240,120,'Main idea','#ffd6a5');c.id='m0';const bs=[[-340,-220,'Branch 1'],[340,-220,'Branch 2'],[-340,220,'Branch 3'],[340,220,'Branch 4']].map(([x,y,t],k)=>{const s=SH('round',x,y,200,80,t,STICKY[k+3]);s.id='m'+(k+1);return s});return[c,...bs,...bs.map((b,k)=>CN('m0','m'+(k+1),'none'))]}],
 ['User journey','Steps with feelings and ideas',()=>[TX(0,-60,'User journey',34),...['Discover','Try','Buy','Use','Recommend'].flatMap((c,k)=>[SH('round',k*240,0,200,70,c,'#bdb2ff'),S(k*240+10,110,'Doing…',STICKY[0],180,120),S(k*240+10,250,'Feeling…',STICKY[2],180,120),S(k*240+10,390,'Idea…',STICKY[3],180,120)])]],
 ['Priority matrix','Urgent and important',()=>[TX(0,-60,'Priority matrix',34),FR(0,0,420,300,'Do now (urgent + important)'),FR(440,0,420,300,'Plan (important)'),FR(0,320,420,300,'Delegate (urgent)'),FR(440,320,420,300,'Drop')]],
 ['Weekly planner','Monday to Sunday',()=>[TX(0,-60,'This week',34),...['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d,k)=>FR(k*210,0,190,520,d))]]];
function insertTemplate(f){snap();const list=f().map(x=>({...x}));const keymap={};list.forEach(x=>{const old=x.id;x.id=uid();if(old)keymap[old]=x.id});list.forEach(x=>{if(x.t==='line'){['a','b'].forEach(w=>{if(x[w].id)x[w].id=keymap[x[w].id]})}});
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;list.forEach(i=>{if(i.t==='line')return;const b=box(i);x0=Math.min(x0,b.x);y0=Math.min(y0,b.y);x1=Math.max(x1,b.x+b.w);y1=Math.max(y1,b.y+b.h)});
  const c=toW(cv.clientWidth/2,cv.clientHeight/2),dx=c.x-(x0+x1)/2,dy=c.y-(y0+y1)/2;list.forEach(i=>{if(i.t==='line')return;i.x+=dx;i.y+=dy});items().push(...list);sel=[];closeModal();fit()}
$('#bTpl').onclick=()=>openModal(el('div',{style:'display:grid;gap:12px;min-width:min(560px,88vw)'},el('h2',{},'Whiteboard templates'),el('div',{style:'display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px'},TEMPLATES.map(([n,d,f])=>el('button',{class:'btn',style:'flex-direction:column;align-items:flex-start;padding:12px;text-align:left',onclick:()=>insertTemplate(f)},el('b',{},n),el('small',{class:'note'},d)))),el('div',{class:'row',style:'justify-content:flex-end'},el('button',{class:'btn',onclick:closeModal},'Close'))));

/* export */
function renderCanvas(pad=40,scale=2,bg='#ffffff'){const l=items();if(!l.length)return null;let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;l.forEach(i=>{const b=box(i);x0=Math.min(x0,b.x);y0=Math.min(y0,i.t==='frame'?b.y-28:b.y);x1=Math.max(x1,b.x+b.w);y1=Math.max(y1,b.y+b.h)});
  const w=Math.ceil(x1-x0+2*pad),h=Math.ceil(y1-y0+2*pad),k=Math.min(scale,6000/Math.max(w,h)),c=document.createElement('canvas');c.width=Math.round(w*k);c.height=Math.round(h*k);const g=c.getContext('2d');if(bg){g.fillStyle=bg;g.fillRect(0,0,c.width,c.height)}g.scale(k,k);g.translate(pad-x0,pad-y0);l.forEach(i=>drawItem(g,i));return c}
const toBlob=(c,t='image/png')=>new Promise(r=>c.toBlob(r,t));
$('#bDl').onclick=e=>{const r=e.currentTarget.getBoundingClientRect(),n=safe($('#title').value);ctxMenu(r.left,r.bottom+4,[
  {label:'PNG picture',go:async()=>{const c=renderCanvas();if(!c)return toast('The board is empty');download(n+'.png',await toBlob(c))}},
  {label:'PNG with transparent background',go:async()=>{const c=renderCanvas(40,2,null);if(!c)return toast('The board is empty');download(n+'-transparent.png',await toBlob(c))}},
  {label:'PDF',go:()=>{const c=renderCanvas();if(!c)return toast('The board is empty');const {jsPDF}=window.jspdf;const w=c.width/2,h=c.height/2,pdf=new jsPDF({orientation:w>=h?'l':'p',unit:'px',format:[w,h],hotfixes:['px_scaling']});pdf.addImage(c.toDataURL('image/jpeg',.92),'JPEG',0,0,w,h);download(n+'.pdf',pdf.output('blob'))}},
  {label:'Board file (.json)',go:()=>download(n+'.json',new Blob([JSON.stringify(B)],{type:'application/json'}))},'-',{label:'Move to trash',go:()=>askTrash(ed,'board',$('#title').value||'Untitled')}])};
$('#bShare').onclick=()=>{const draw2=()=>{const body=el('div',{style:'display:grid;gap:12px;min-width:min(420px,84vw)'},el('h2',{},'Share this whiteboard'));
  if(B.pub){const url=location.origin+B.pub.path;body.append(el('p',{class:'note'},'Anyone with this link sees a picture of the board as it was when you published. They cannot edit it.'),el('input',{class:'f',readonly:true,value:url,'aria-label':'Public link',onclick:e=>e.target.select()}),el('div',{class:'row'},el('button',{class:'btn pri',onclick:async()=>{try{await navigator.clipboard.writeText(url);toast('Link copied')}catch(e){toast(url,6000)}}},'Copy link'),el('button',{class:'btn',onclick:async()=>{await pub();draw2()}},'Update snapshot'),el('button',{class:'btn danger',onclick:async()=>{await unpublish(B.pub.token);B.pub=null;ed.queue();draw2()}},'Stop sharing')))}
  else body.append(el('p',{class:'note'},'Publish a read-only picture of this board.'),el('button',{class:'btn pri',onclick:async()=>{await pub();draw2()}},'Publish a link'));
  body.append(el('div',{class:'row',style:'justify-content:flex-end'},el('button',{class:'btn',onclick:closeModal},'Close')));openModal(body)};
  const pub=async()=>{const c=renderCanvas(40,2);if(!c)return toast('The board is empty');const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc($('#title').value)}</title><style>body{margin:0;background:#f4f1ec;font:16px system-ui,sans-serif;text-align:center}h1{font-size:18px;margin:14px}img{max-width:100%;height:auto;background:#fff;box-shadow:0 6px 24px #0003;margin:0 auto 24px;display:block}</style></head><body><h1>${esc($('#title').value)}</h1><img alt="Whiteboard" src="${c.toDataURL('image/jpeg',.88)}"></body></html>`;
    try{const j=await publishPages(B.name||$('#title').value,{index:html},B.pub&&B.pub.token);B.pub={token:j.token,path:j.path};ed.queue();toast('Published')}catch(e){toast(e.message,4000)}};draw2()};
document.addEventListener('paste',async e=>{if(editing||/INPUT|TEXTAREA/.test(document.activeElement.tagName)||!B)return;const f=[...(e.clipboardData&&e.clipboardData.files||[])].find(x=>/^image\//.test(x.type));if(f){e.preventDefault();try{const src=await fileToDataURL(f,1600),im=getImg(src);const add=()=>{snap();const w=Math.min(420,im.naturalWidth),h=w*im.naturalHeight/im.naturalWidth,c=toW(cv.clientWidth/2,cv.clientHeight/2),it={id:uid(),t:'image',x:c.x-w/2,y:c.y-h/2,w,h,src};items().push(it);sel=[it.id];changed()};im.complete&&im.naturalWidth?add():im.onload=()=>{add()}}catch(x){}}});
stage.addEventListener('dragover',e=>e.preventDefault());stage.addEventListener('drop',async e=>{e.preventDefault();const f=[...e.dataTransfer.files].find(x=>/^image\//.test(x.type));if(!f||!B)return;const src=await fileToDataURL(f,1600),im=getImg(src);const r=cv.getBoundingClientRect(),p=toW(e.clientX-r.left,e.clientY-r.top);const add=()=>{snap();const w=Math.min(420,im.naturalWidth),h=w*im.naturalHeight/im.naturalWidth,it={id:uid(),t:'image',x:p.x-w/2,y:p.y-h/2,w,h,src};items().push(it);sel=[it.id];changed()};im.complete&&im.naturalWidth?add():im.onload=add});
new ResizeObserver(resize).observe(stage);
