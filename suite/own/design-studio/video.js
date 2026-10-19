/* Video editor: a timeline with video, picture, audio and title clips, captions (typed, .srt or automatic), WebM export */
const RATIOS={'16:9':[1280,720],'9:16':[720,1280],'1:1':[1080,1080],'4:5':[1080,1350]};
const cv=$('#cv'),cx=cv.getContext('2d');
let V=null,sel=null,t=0,playing=false,pps=60,undo=[],redo=[],urls={},els={},imgs={},actx=null,gains={},master=null,mon=null,dest=null,base=0,t0=0,raf=0,exporting=null,tab='media';
const ed=startEditor('video',{blank:()=>({v:1,type:'video',id:uid(),name:'Untitled video',ratio:'16:9',media:{},clips:[],cap:{size:44,color:'#ffffff',bg:'#000000aa',pos:86}}),
  onLoad:r=>{V=r;V.cap=Object.assign({size:44,color:'#ffffff',bg:'#000000aa',pos:86},V.cap);V.clips=V.clips||[];V.media=V.media||{};setRatio(V.ratio||'16:9');V.clips.forEach(prep);build()},collect:()=>{}});
const fmt=(s,ms)=>{s=Math.max(0,s);const m=Math.floor(s/60),x=s-m*60;return m+':'+(x<10?'0':'')+x.toFixed(ms?1:0)};
const total=()=>{let m=0;(V?V.clips:[]).forEach(c=>{if(c.kind!=='cap')m=Math.max(m,c.start+c.dur)});if(!m)(V?V.clips:[]).forEach(c=>{m=Math.max(m,c.start+c.dur)});return m};
const byId=id=>V.clips.find(c=>c.id===id);
function snap(){undo.push(JSON.stringify([V.clips,V.cap]));if(undo.length>100)undo.shift();redo=[]}
function restore(s){const [c,cp]=JSON.parse(s);V.clips=c;V.cap=cp;if(sel&&!byId(sel))sel=null;V.clips.forEach(prep);changed()}
$('#bUndo').onclick=()=>{if(undo.length){redo.push(JSON.stringify([V.clips,V.cap]));restore(undo.pop())}};
$('#bRedo').onclick=()=>{if(redo.length){undo.push(JSON.stringify([V.clips,V.cap]));restore(redo.pop())}};
function changed(){sync();draw();renderTL();renderPane();ed.queue()}
function setRatio(r){V.ratio=RATIOS[r]?r:'16:9';const [w,h]=RATIOS[V.ratio];cv.width=w;cv.height=h;$('#ratio').value=V.ratio;fit();draw()}
function fit(){const p=$('#prev'),r=p.getBoundingClientRect(),[w,h]=RATIOS[V?V.ratio:'16:9'],k=Math.min((r.width-20)/w,(r.height-20)/h);if(k>0){cv.style.width=Math.floor(w*k)+'px';cv.style.height=Math.floor(h*k)+'px'}}
addEventListener('resize',fit);new ResizeObserver(fit).observe($('#prev'));
$('#ratio').onchange=e=>{snap();setRatio(e.target.value);ed.queue()};

/* media files live in Files next to the project; each clip keeps a reference */
const getURL=mid=>urls[mid]||(urls[mid]=(async()=>{const m=V.media[mid];try{const b=await PUT().fs.read(m.path);return URL.createObjectURL(new Blob([b],{type:m.mime||b.type}))}catch(e){m.missing=true;return null}})());
async function prep(c){if(c.kind==='video'||c.kind==='audio'){if(els[c.id]||!V.media[c.mid])return;const u=await getURL(c.mid);if(!u){renderTL();return}const e=document.createElement(c.kind==='video'?'video':'audio');e.preload='auto';e.playsInline=true;e.src=u;e.addEventListener('seeked',()=>draw());e.addEventListener('loadeddata',()=>draw());els[c.id]=e;wire(c)}
  else if(c.kind==='image'&&V.media[c.mid]&&!imgs[c.mid]){const u=await getURL(c.mid);if(!u)return;const im=new Image();im.onload=()=>draw();im.src=u;imgs[c.mid]=im}}
function wire(c){if(!actx||!els[c.id]||gains[c.id])return;const s=actx.createMediaElementSource(els[c.id]),g=actx.createGain();g.gain.value=c.vol==null?1:c.vol;s.connect(g);g.connect(master);gains[c.id]=g}
function audio(){if(actx)return;actx=new (window.AudioContext||window.webkitAudioContext)();master=actx.createGain();mon=actx.createGain();dest=actx.createMediaStreamDestination();master.connect(mon);mon.connect(actx.destination);master.connect(dest);V.clips.forEach(wire)}
async function probe(file){const kind=file.type.startsWith('video')?'video':file.type.startsWith('audio')?'audio':'image';const u=URL.createObjectURL(file);
  try{if(kind==='image'){const im=new Image();im.src=u;await im.decode();return{kind,w:im.naturalWidth,h:im.naturalHeight,dur:0}}
    const e=document.createElement(kind);e.preload='metadata';e.src=u;await new Promise((ok,no)=>{e.onloadedmetadata=ok;e.onerror=()=>no(new Error('bad'));setTimeout(()=>no(new Error('slow')),15000)});return{kind,w:e.videoWidth||0,h:e.videoHeight||0,dur:isFinite(e.duration)?e.duration:0}}finally{URL.revokeObjectURL(u)}}
async function importFiles(files,at){for(const f of files){if(!/^(video|audio|image)\//.test(f.type)){toast('“'+f.name+'” is not a video, sound or picture');continue}if(f.size>600*1048576){toast('“'+f.name+'” is over 600 MB');continue}
  try{const pr=await probe(f);const mid=uid(),path=`/Designs/Videos/media/${mid}-${safe(f.name.replace(/\.[^.]+$/,''))}${(f.name.match(/\.[^.]+$/)||[''])[0].slice(0,8)}`;toast('Adding “'+f.name+'”…');await PUT().fs.write(path,f,{createMissingParents:true,overwrite:true});
    V.media[mid]={name:f.name,kind:pr.kind,mime:f.type,path,dur:pr.dur,w:pr.w,h:pr.h};snap();addClip(mid,at);ed.queue()}catch(e){toast('Could not add “'+f.name+'”: '+(e.message==='bad'?'this browser cannot play it':e.message))}}}
function addClip(mid,at){const m=V.media[mid],end=at==null?total():at,c={id:uid(),mid,kind:m.kind,track:m.kind==='audio'?'a':'v',start:end,in:0,dur:m.kind==='image'?4:Math.max(.2,m.dur||4),vol:1};V.clips.push(c);sel=c.id;prep(c);changed();tab='clip';renderPane();setTab('clip')}
$('#fMedia').onchange=e=>{importFiles([...e.target.files]);e.target.value=''};

/* drawing */
function wrapT(text,maxW){const out=[];String(text||'').split('\n').forEach(par=>{let line='';par.split(/\s+/).forEach(w=>{const tt=line?line+' '+w:w;if(cx.measureText(tt).width>maxW&&line){out.push(line);line=w}else line=tt});out.push(line)});return out}
function drawText(str,xp,yp,size,color,bg,maxW){cx.save();cx.font=`700 ${size}px "Instrument Sans",sans-serif`;cx.textAlign='center';cx.textBaseline='middle';const lines=wrapT(str,maxW),lh=size*1.25,h=lines.length*lh,cxp=cv.width*xp/100,cyp=cv.height*yp/100;
  if(bg){const w=Math.max(...lines.map(l=>cx.measureText(l).width))+size*.8;cx.fillStyle=bg;const x=cxp-w/2,y=cyp-h/2-size*.2,r=size*.25;cx.beginPath();cx.roundRect?cx.roundRect(x,y,w,h+size*.4,r):cx.rect(x,y,w,h+size*.4);cx.fill()}
  cx.fillStyle=color;cx.shadowColor='#000a';cx.shadowBlur=bg?0:8;lines.forEach((l,i)=>cx.fillText(l,cxp,cyp-h/2+lh*(i+.5)));cx.restore()}
function drawCaption(cap){const W=cv.width,size=V.cap.size*(W/1280>1?W/1280:1),st=V.cap.style||'box',xp=50,yp=V.cap.pos;
  if(st==='box'){drawText(cap.text,xp,yp,size,V.cap.color,V.cap.bg,W*.86);return}
  cx.save();cx.font=`800 ${size}px "Instrument Sans",sans-serif`;cx.textAlign='left';cx.textBaseline='middle';cx.lineJoin='round';
  const words=String(cap.text).split(/\s+/),maxW=W*.86,lines=[];let cur=[];words.forEach((w,i)=>{const test=[...cur,w].map(x=>x.w||x).join(' ');cur.length&&cx.measureText(test).width>maxW?(lines.push(cur),cur=[{w,i}]):cur.push({w,i})});if(cur.length)lines.push(cur);
  const act=st==='karaoke'?Math.min(words.length-1,Math.floor((t-cap.start)/cap.dur*words.length)):-1,lh=size*1.25,y0=cv.height*yp/100-(lines.length*lh)/2;
  lines.forEach((ln,li)=>{const full=ln.map(x=>x.w).join(' '),sp=cx.measureText(' ').width,tw=cx.measureText(full).width;let x=W/2-tw/2;const y=y0+lh*(li+.5);
    ln.forEach(o=>{const w=cx.measureText(o.w).width;cx.lineWidth=size*.22;cx.strokeStyle='#000';cx.strokeText(o.w,x,y);cx.fillStyle=o.i===act?(V.cap.hi||'#ffd43b'):V.cap.color;cx.fillText(o.w,x,y);x+=w+sp})});cx.restore()}
function draw(){if(!V)return;const W=cv.width,H=cv.height;cx.fillStyle='#000';cx.fillRect(0,0,W,H);
  const act=V.clips.filter(c=>c.kind!=='audio'&&c.kind!=='cap'&&t>=c.start-1e-3&&t<c.start+c.dur);
  [...act.filter(c=>c.track!=='o'),...act.filter(c=>c.track==='o')].forEach(c=>{
    if(c.kind==='text'){drawText(c.text||'',c.x==null?50:c.x,c.y==null?50:c.y,c.size||72,c.color||'#fff',c.bg||null,W*.86);return}
    const src=c.kind==='video'?els[c.id]:imgs[c.mid];if(!src)return;const sw=c.kind==='video'?src.videoWidth:src.naturalWidth,sh=c.kind==='video'?src.videoHeight:src.naturalHeight;if(!sw||!sh||(c.kind==='video'&&src.readyState<2))return;
    const main=c.track!=='o',k=main?Math.min(W/sw,H/sh)*(c.zoom||1):(W*(c.sc||.35))/sw,dw=sw*k,dh=sh*k,px=main?50:(c.x==null?70:c.x),py=main?50:(c.y==null?30:c.y);
    cx.save();cx.globalAlpha=Math.min(1,Math.max(0,fade(c)));try{cx.drawImage(src,W*px/100-dw/2,H*py/100-dh/2,dw,dh)}catch(e){}cx.restore()});
  const cap=V.clips.find(c=>c.kind==='cap'&&t>=c.start&&t<c.start+c.dur);if(cap)drawCaption(cap);
  $('#time').textContent=fmt(t,1)+' / '+fmt(total(),1);const ph=$('#ph');if(ph)ph.style.left=(t*pps)+'px'}
function fade(c){const f=c.fade||0;if(!f)return 1;return Math.min((t-c.start)/f,(c.start+c.dur-t)/f,1)}

/* playback */
function sync(){if(!V)return;for(const c of V.clips){const e=els[c.id];if(!e)continue;const on=t>=c.start-1e-3&&t<c.start+c.dur;if(!on){if(!e.paused)e.pause();continue}
  const sp=c.speed||1,want=c.in+(t-c.start)*sp;if(e.playbackRate!==sp)e.playbackRate=sp;if(playing){if(e.paused){e.currentTime=want;e.play().catch(()=>{})}else if(Math.abs(e.currentTime-want)>.3)e.currentTime=want}else{if(Math.abs(e.currentTime-want)>.04)e.currentTime=want;if(!e.paused)e.pause()}
  if(gains[c.id])gains[c.id].gain.value=c.mute?0:(c.vol==null?1:c.vol)*(c.fade?Math.max(0,fade(c)):1)}}
function tick(now){if(!playing)return;t=base+(now-t0)/1000;const end=total();if(t>=end){t=end;stop();if(exporting)finishExport();else{draw();placePh()}return}sync();draw();placePh();raf=requestAnimationFrame(tick)}
function play(){if(!V||!total())return toast('Add a video, picture or sound first');audio();if(actx.state==='suspended')actx.resume();if(t>=total()-.05)t=0;playing=true;base=t;t0=performance.now();$('#bPlay').textContent='⏸';raf=requestAnimationFrame(tick)}
function stop(){playing=false;cancelAnimationFrame(raf);$('#bPlay').textContent='▶';for(const k in els)els[k].pause()}
function seek(x){t=clamp(x,0,Math.max(total(),0.0001));if(playing){base=t;t0=performance.now()}sync();draw();placePh()}
$('#bPlay').onclick=()=>playing?(exporting?cancelExport():stop()):play();$('#bBeg').onclick=()=>{stop();seek(0)};
const placePh=()=>{const ph=$('#ph');if(ph){ph.style.left=(t*pps)+'px';const sc=$('#scroll');if(playing&&t*pps>sc.scrollLeft+sc.clientWidth-30)sc.scrollLeft=t*pps-40}};

/* timeline */
const ROWS=[['o','Overlay'],['v','Video'],['a','Audio'],['c','Captions']];
function renderTL(){if(!V)return;const tin=$('#tin'),len=Math.max(total()+12,30);tin.style.width=(len*pps)+'px';tin.innerHTML='';
  const ruler=el('div',{id:'ruler'});const step=pps>=100?1:pps>=40?5:pps>=20?10:30;for(let s=0;s<len;s+=step)ruler.append(el('span',{style:'left:'+(s*pps)+'px'},fmt(s)));tin.append(ruler);
  const scrub=e=>{const r=tin.getBoundingClientRect();seek((e.clientX-r.left)/pps)};ruler.addEventListener('pointerdown',e=>{ruler.setPointerCapture(e.pointerId);scrub(e);const mv=ev=>scrub(ev),up=()=>{ruler.removeEventListener('pointermove',mv);ruler.removeEventListener('pointerup',up)};ruler.addEventListener('pointermove',mv);ruler.addEventListener('pointerup',up)});
  ROWS.forEach(([k,lab])=>{const mine=V.clips.filter(c=>(c.kind==='cap'?'c':c.kind==='audio'?'a':c.track==='o'?'o':'v')===k);const row=el('div',{class:'trk','data-row':k},mine.length?'':el('span',{class:'lab'},lab));row.addEventListener('pointerdown',e=>{if(e.target===row){sel=null;renderTL();renderPane()}});
    V.clips.filter(c=>(c.kind==='cap'?'c':c.kind==='audio'?'a':c.track==='o'?'o':'v')===k).forEach(c=>{const m=V.media[c.mid];const n=el('div',{class:'clip'+(sel===c.id?' on':'')+(m&&m.missing?' miss':''),'data-k':c.kind,'data-id':c.id,style:`left:${c.start*pps}px;width:${Math.max(6,c.dur*pps)}px`,title:c.kind==='cap'||c.kind==='text'?c.text:(m?m.name:'')},el('span',{},c.kind==='cap'||c.kind==='text'?(c.text||'(empty)'):(m?m.name:'Missing file')),el('i',{class:'h l'}),el('i',{class:'h r'}));
      n.addEventListener('pointerdown',e=>clipDown(e,c,e.target.classList.contains('l')?'l':e.target.classList.contains('r')?'r':'move',n));row.append(n)});tin.append(row)});
  tin.append(el('div',{id:'ph',style:'left:'+(t*pps)+'px'}));if(!V.clips.length)tin.append(el('div',{class:'empty',style:'position:absolute;left:0;right:0;top:60px'},'Add media on the right, or drop a video here.'))}
function snapT(x,self){const cands=[0,t];V.clips.forEach(c=>{if(c!==self){cands.push(c.start,c.start+c.dur)}});let best=x,bd=8/pps;cands.forEach(v=>{if(Math.abs(v-x)<bd){bd=Math.abs(v-x);best=v}});return best}
function clipDown(e,c,mode,node){e.stopPropagation();e.preventDefault();stop();if(sel!==c.id){sel=c.id;renderTL();node=$(`.clip[data-id="${c.id}"]`);renderPane();if(V.media[c.mid]===undefined&&c.kind!=='text'&&c.kind!=='cap'){}}
  snap();const x0=e.clientX,s0=c.start,i0=c.in||0,d0=c.dur,media=c.kind==='video'||c.kind==='audio',sp=c.speed||1,maxD=media?(((V.media[c.mid]&&V.media[c.mid].dur)||1e9)-i0)/sp+i0/sp:1e9;let moved=false;
  const mv=ev=>{moved=true;const dt=(ev.clientX-x0)/pps;
    if(mode==='move'){let ns=Math.max(0,s0+dt);const a=snapT(ns,c),b=snapT(ns+d0,c)-d0;ns=Math.abs(a-ns)<=Math.abs(b-ns)?a:b;c.start=Math.max(0,ns)}
    else if(mode==='l'){let d=snapT(Math.max(0,s0+dt),c)-s0;if(media)d=Math.max(d,-i0/sp);if(c.start+d<0)d=-s0;d=Math.min(d,d0-.1);c.start=s0+d;if(media)c.in=i0+d*sp;c.dur=d0-d}
    else{c.dur=Math.max(.1,Math.min(snapT(s0+d0+dt,c)-s0,media?(maxD*sp-i0)/sp:1e9))}
    renderTL();sync();draw()};
  const up=()=>{removeEventListener('pointermove',mv);removeEventListener('pointerup',up);if(moved)changed();else{undo.pop();renderPane()}};addEventListener('pointermove',mv);addEventListener('pointerup',up)}
$('#zoom').oninput=e=>{pps=+e.target.value;renderTL()};
function split(){const at=t;const list=sel?[byId(sel)]:V.clips.filter(c=>c.kind!=='cap');const tgt=list.filter(c=>c&&at>c.start+.05&&at<c.start+c.dur-.05);if(!tgt.length)return toast('Put the playhead inside a clip first');snap();
  tgt.forEach(c=>{const n={...c,id:uid(),start:at,in:(c.in||0)+(at-c.start)*(c.speed||1),dur:c.start+c.dur-at};c.dur=at-c.start;V.clips.push(n);prep(n);if(c.id===sel)sel=n.id});changed()}
$('#bSplit').onclick=split;
function del(){if(!sel||!byId(sel))return toast('Select a clip first');snap();const c=byId(sel);if(els[c.id]){els[c.id].pause();delete els[c.id]}V.clips=V.clips.filter(x=>x.id!==sel);sel=null;changed()}
$('#bDel').onclick=del;
$('#bTitle').onclick=()=>{snap();const c={id:uid(),kind:'text',track:'o',start:t,in:0,dur:3,text:'Your title',size:84,color:'#ffffff',x:50,y:50,fade:.4};V.clips.push(c);sel=c.id;changed();setTab('clip')};
addEventListener('keydown',e=>{if(/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)||!V)return;const k=e.key;
  if(k===' '){e.preventDefault();$('#bPlay').click()}else if(k==='s'||k==='S'){if(!e.ctrlKey&&!e.metaKey)split()}else if(k==='Delete'||k==='Backspace'){e.preventDefault();del()}
  else if(k==='ArrowLeft'){seek(t-(e.shiftKey?1:.1))}else if(k==='ArrowRight'){seek(t+(e.shiftKey?1:.1))}
  else if((e.ctrlKey||e.metaKey)&&k.toLowerCase()==='z'){e.preventDefault();(e.shiftKey?$('#bRedo'):$('#bUndo')).click()}});
document.addEventListener('dragover',e=>e.preventDefault());document.addEventListener('drop',e=>{e.preventDefault();if(e.dataTransfer.files.length)importFiles([...e.dataTransfer.files])});

/* side panel */
function setTab(k){tab=k;$$('#tabs button').forEach(b=>b.setAttribute('aria-selected',b.dataset.tab===k));renderPane()}
$$('#tabs button').forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
const num=(label,get,set,min,max,step)=>{const i=el('input',{class:'f',type:'number',min,max,step:step||.1,value:+(+get()).toFixed(2)});i.onchange=()=>{snap();set(clamp(+i.value||0,min,max));changed()};return el('label',{},label,i)};
function renderPane(){if(!V)return;const p=$('#pane');p.innerHTML='';$$('#tabs button').forEach(b=>b.setAttribute('aria-selected',b.dataset.tab===tab));
  if(tab==='media'){p.append(el('button',{class:'btn pri',onclick:()=>$('#fMedia').click()},'＋ Add video, sound or pictures'),el('p',{class:'note',style:'margin:0'},'Drop files anywhere on this page. Click one below to add it at the end of the timeline. Files are kept in your Files under Designs ▸ Videos.'));
    p.append(el('button',{class:'btn',id:'bVO',onclick:recordVO},'🎙 Record voice-over'));
    Object.entries(V.media).forEach(([mid,m])=>p.append(el('button',{class:'media',onclick:()=>{snap();addClip(mid)}},el('i',{},m.kind==='video'?'🎞':m.kind==='audio'?'🎵':'🖼'),el('span',{},m.name),el('small',{},m.missing?'missing':m.dur?fmt(m.dur):''))));return}
  if(tab==='clip'){const c=sel&&byId(sel);if(!c){p.append(el('p',{class:'note'},'Select a clip on the timeline to change it.'));return}
    p.append(el('b',{},c.kind==='text'?'Title':c.kind==='cap'?'Caption':(V.media[c.mid]||{}).name||'Clip'));
    if(c.kind==='text'||c.kind==='cap'){const ta=el('textarea',{class:'f',rows:3});ta.value=c.text||'';ta.oninput=()=>{c.text=ta.value;draw();ed.queue();const n=$(`.clip[data-id="${c.id}"] span`);if(n)n.textContent=c.text||'(empty)'};ta.onfocus=()=>snap();p.append(el('label',{},'Text',ta))}
    p.append(num('Starts at (seconds)',()=>c.start,v=>c.start=v,0,36000),num('Length (seconds)',()=>c.dur,v=>c.dur=Math.max(.1,c.kind==='video'||c.kind==='audio'?Math.min(v,((V.media[c.mid].dur||1e9)-(c.in||0))/(c.speed||1)):v),.1,36000));
    if(c.kind==='video'||c.kind==='audio'){const sps=[.25,.5,.75,1,1.5,2,3];p.append(el('label',{},'Speed',el('select',{class:'f',id:'spd',onchange:e=>{snap();c.speed=+e.target.value;const md=(V.media[c.mid].dur||1e9);c.dur=Math.max(.1,Math.min(c.dur,(md-(c.in||0))/c.speed));changed()}},...sps.map(v=>el('option',{value:v,selected:(c.speed||1)===v},v+'×')))))}
    if(c.kind==='video'||c.kind==='audio'){const r=el('input',{type:'range',min:0,max:2,step:.05,value:c.vol==null?1:c.vol});r.oninput=()=>{c.vol=+r.value;if(gains[c.id])gains[c.id].gain.value=c.vol};r.onchange=()=>{ed.queue()};r.onpointerdown=snap;p.append(el('label',{},'Volume',r),el('label',{style:'display:flex;gap:8px;align-items:center'},el('input',{type:'checkbox',checked:!!c.mute,onchange:e=>{snap();c.mute=e.target.checked;changed()}}),'Mute this clip'))}
    if(c.kind==='video'||c.kind==='image'){const s=el('select',{class:'f',onchange:e=>{snap();c.track=e.target.value;changed()}},el('option',{value:'v',selected:c.track!=='o'},'Main picture'),el('option',{value:'o',selected:c.track==='o'},'Overlay (small, on top)'));p.append(el('label',{},'Layer',s));
      if(c.track==='o')p.append(num('Size (% of width)',()=>(c.sc||.35)*100,v=>c.sc=v/100,5,100,1),num('Left–right (%)',()=>c.x==null?70:c.x,v=>c.x=v,0,100,1),num('Up–down (%)',()=>c.y==null?30:c.y,v=>c.y=v,0,100,1));else p.append(num('Zoom (1 = fit)',()=>c.zoom||1,v=>c.zoom=v,.2,4,.05))}
    if(c.kind==='text'){p.append(num('Size',()=>c.size||72,v=>c.size=v,10,300,2),num('Left–right (%)',()=>c.x==null?50:c.x,v=>c.x=v,0,100,1),num('Up–down (%)',()=>c.y==null?50:c.y,v=>c.y=v,0,100,1),el('label',{},'Colour',el('input',{type:'color',value:c.color||'#ffffff',oninput:e=>{c.color=e.target.value;draw();ed.queue()},onfocus:snap})),el('label',{style:'display:flex;gap:8px;align-items:center'},el('input',{type:'checkbox',checked:!!c.bg,onchange:e=>{snap();c.bg=e.target.checked?'#000000aa':null;changed()}}),'Dark box behind the text'))}
    if(c.kind!=='cap')p.append(num('Fade in/out (seconds)',()=>c.fade||0,v=>c.fade=v,0,5,.1));
    p.append(el('div',{class:'row'},el('button',{class:'btn',onclick:split},'✂ Split'),el('button',{class:'btn danger',onclick:del},'Delete')));return}
  /* captions */
  const caps=V.clips.filter(c=>c.kind==='cap').sort((a,b)=>a.start-b.start);
  p.append(el('div',{class:'row'},el('button',{class:'btn pri',id:'bAuto',onclick:autoCaptions},'✨ Auto-captions'),el('button',{class:'btn',onclick:()=>{snap();const c={id:uid(),kind:'cap',track:'c',start:t,in:0,dur:2,text:'New caption'};V.clips.push(c);sel=c.id;changed()}},'＋ Add'),el('button',{class:'btn',onclick:()=>$('#fSrt').click()},'Import .srt'),el('button',{class:'btn',onclick:exportSrt},'Export .srt')),
    el('p',{class:'note',style:'margin:0'},'Auto-captions listen to the sound on your timeline using your connected AI (speech-to-text) or your Gemini key. You can fix any line below.'));
  const lang=el('select',{class:'f',id:'trLang','aria-label':'Language'},...['Swahili','English','French','Arabic','Hindi','Portuguese','Spanish','German','Chinese','Malayalam'].map(l=>el('option',{},l)));
  p.append(el('div',{class:'row'},lang,el('button',{class:'btn',id:'bTr',onclick:()=>translateCaps(lang.value)},'🌐 Translate captions')));
  const sz=el('input',{class:'f',type:'number',min:16,max:120,value:V.cap.size,onchange:e=>{V.cap.size=clamp(+e.target.value||44,16,120);draw();ed.queue()}}),ps=el('input',{class:'f',type:'number',min:10,max:95,value:V.cap.pos,onchange:e=>{V.cap.pos=clamp(+e.target.value||86,10,95);draw();ed.queue()}});
  p.append(el('label',{},'Caption style',el('select',{class:'f',id:'capStyle',onchange:e=>{V.cap.style=e.target.value;draw();ed.queue()}},...[['box','Classic (dark box)'],['bold','Bold outline'],['karaoke','Karaoke (current word lit)']].map(([v,l])=>el('option',{value:v,selected:(V.cap.style||'box')===v},l)))),el('div',{class:'row'},el('label',{style:'flex:1'},'Size',sz),el('label',{style:'flex:1'},'Height (%)',ps),el('label',{},'Colour',el('input',{type:'color',value:V.cap.color,oninput:e=>{V.cap.color=e.target.value;draw();ed.queue()}}))),
    el('label',{style:'display:flex;gap:8px;align-items:center'},el('input',{type:'checkbox',checked:!!V.cap.bg,onchange:e=>{V.cap.bg=e.target.checked?'#000000aa':null;draw();ed.queue()}}),'Dark box behind captions'));
  if(!caps.length)p.append(el('p',{class:'note'},'No captions yet.'));
  caps.forEach(c=>{const s=el('input',{type:'number',step:.1,min:0,value:+c.start.toFixed(2),'aria-label':'Start'}),e2=el('input',{type:'number',step:.1,min:0,value:+(c.start+c.dur).toFixed(2),'aria-label':'End'}),tx=el('input',{value:c.text,'aria-label':'Caption text'});
    s.onchange=()=>{snap();const end=c.start+c.dur;c.start=Math.max(0,+s.value||0);c.dur=Math.max(.1,end-c.start);changed()};e2.onchange=()=>{snap();c.dur=Math.max(.1,(+e2.value||0)-c.start);changed()};tx.onfocus=()=>{sel=c.id;seek(c.start+.01)};tx.oninput=()=>{c.text=tx.value;draw();ed.queue()};
    p.append(el('div',{class:'capr'+(sel===c.id?' on':'')},s,e2,tx,el('button',{class:'btn sm',title:'Delete caption','aria-label':'Delete caption',onclick:()=>{snap();V.clips=V.clips.filter(x=>x!==c);if(sel===c.id)sel=null;changed()}},'✕')))})}
async function translateCaps(language){const caps=V.clips.filter(c=>c.kind==='cap').sort((a,b)=>a.start-b.start);if(!caps.length)return toast('No captions to translate');const b=$('#bTr');b.disabled=true;b.textContent='Translating…';
  try{const r=await aiCall('translate',{language,text:caps.map(c=>c.text.replace(/\s*\n\s*/g,' ')).join('\n')});const out=String(r.text||'').split('\n').map(x=>x.trim()).filter(Boolean);if(out.length!==caps.length)throw new Error('The translation came back with '+out.length+' lines instead of '+caps.length+'. Nothing was changed; try again.');snap();caps.forEach((c,i)=>c.text=out[i]);toast('Translated to '+language);changed()}
  catch(e){toast(e.message,6000)}finally{b.disabled=false;b.textContent='🌐 Translate captions'}}
function parseSrt(txt){const out=[];txt.replace(/\r/g,'').split(/\n\s*\n/).forEach(b=>{const l=b.trim().split('\n');const i=l.findIndex(x=>x.includes('-->'));if(i<0)return;const m=l[i].match(/(?:(\d+):)?(\d+):(\d+)[.,](\d+)\s*-->\s*(?:(\d+):)?(\d+):(\d+)[.,](\d+)/);if(!m)return;const T=(h,mi,s,ms)=>(+h||0)*3600+ +mi*60+ +s+ +('0.'+ms);const s=T(m[1],m[2],m[3],m[4]),e=T(m[5],m[6],m[7],m[8]);const text=l.slice(i+1).join('\n').replace(/<[^>]+>/g,'').trim();if(text&&e>s)out.push({start:s,dur:e-s,text})});return out}
$('#fSrt').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;const segs=parseSrt(await f.text());if(!segs.length)return toast('No captions found in that file');snap();V.clips=V.clips.filter(c=>c.kind!=='cap');segs.forEach(s=>V.clips.push({id:uid(),kind:'cap',track:'c',in:0,...s}));toast(segs.length+' captions added');changed()};
function exportSrt(){const caps=V.clips.filter(c=>c.kind==='cap').sort((a,b)=>a.start-b.start);if(!caps.length)return toast('No captions yet');const T=s=>{const ms=Math.round(s*1000),h=Math.floor(ms/3600000),m=Math.floor(ms/60000)%60,x=Math.floor(ms/1000)%60;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(x).padStart(2,'0')},${String(ms%1000).padStart(3,'0')}`};
  download(safe($('#title').value)+'.srt',new Blob([caps.map((c,i)=>`${i+1}\n${T(c.start)} --> ${T(c.start+c.dur)}\n${c.text}\n`).join('\n')],{type:'text/plain'}))}

let vo=null;
async function recordVO(){const b=$('#bVO');if(vo){vo.rec.stop();return}if(!navigator.mediaDevices||!window.MediaRecorder)return toast('This browser cannot record sound');
  let stream;try{stream=await navigator.mediaDevices.getUserMedia({audio:true})}catch(e){return toast('Allow the microphone to record a voice-over')}
  const at=t,chunks=[],rec=new MediaRecorder(stream);vo={rec};rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};if(b)b.textContent='⏹ Stop recording';
  rec.onstop=async()=>{stream.getTracks().forEach(x=>x.stop());vo=null;stop();const blob=new Blob(chunks,{type:rec.mimeType||'audio/webm'});if(!blob.size)return;const f=new File([blob],'Voice-over '+fmt(at)+'.webm',{type:'audio/webm'});await importFiles([f],at);renderPane()};
  rec.start(250);if(total())play()}
/* automatic captions: mix everything audible into a 16 kHz mono clip and ask the server to transcribe it */
async function mixWav(){const len=total();if(len>720)throw new Error('Auto-captions work on up to 12 minutes at a time. Split the video or trim it first.');const SR=16000,off=new OfflineAudioContext(1,Math.max(SR,Math.ceil(len*SR)),SR),dc=new (window.AudioContext||window.webkitAudioContext)();let any=false;
  for(const c of V.clips){if((c.kind!=='video'&&c.kind!=='audio')||c.mute)continue;const u=await getURL(c.mid);if(!u)continue;let buf;try{buf=await dc.decodeAudioData(await (await fetch(u)).arrayBuffer())}catch(e){continue}
    const s=off.createBufferSource();s.buffer=buf;const g=off.createGain();g.gain.value=c.vol==null?1:c.vol;s.connect(g);g.connect(off.destination);s.playbackRate.value=c.speed||1;s.start(c.start,c.in||0,c.dur*(c.speed||1));any=true}
  dc.close();if(!any)throw new Error('There is no sound on the timeline to listen to.');const r=await off.startRendering(),d=r.getChannelData(0),ab=new ArrayBuffer(44+d.length*2),v=new DataView(ab);const W=(o,s)=>[...s].forEach((ch,i)=>v.setUint8(o+i,ch.charCodeAt(0)));
  W(0,'RIFF');v.setUint32(4,36+d.length*2,true);W(8,'WAVEfmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,SR,true);v.setUint32(28,SR*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);W(36,'data');v.setUint32(40,d.length*2,true);
  for(let i=0;i<d.length;i++)v.setInt16(44+i*2,Math.max(-1,Math.min(1,d[i]))*32767,true);return new Blob([ab],{type:'audio/wav'})}
const blobToDataURL=b=>new Promise((ok,no)=>{const f=new FileReader();f.onload=()=>ok(f.result);f.onerror=no;f.readAsDataURL(b)});
function autoCaptions(){if(!total())return toast('Add a video or sound first');if(V.clips.some(c=>c.kind==='cap'))askSure('Replace the captions you already have?','Replace',runAuto);else runAuto()}
async function runAuto(){const b=$('#bAuto');
  b.disabled=true;b.textContent='Listening…';try{const wav=await mixWav(),audio=await blobToDataURL(wav);const r=await fetch('/_local/design/transcribe',{method:'POST',credentials:'same-origin',headers:{'x-aos':'1','content-type':'application/json'},body:JSON.stringify({audio})});const j=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(j.error||'Could not make captions ('+r.status+')');let segs=(j.segments||[]).filter(s=>s.text);if(!segs.length&&j.text)segs=[{start:0,end:total(),text:j.text}];if(!segs.length)throw new Error('No speech was found.');
    snap();V.clips=V.clips.filter(c=>c.kind!=='cap');segs.forEach(s=>{const st=Math.max(0,+s.start||0);V.clips.push({id:uid(),kind:'cap',track:'c',in:0,start:st,dur:Math.max(.4,(+s.end||st+2)-st),text:String(s.text).trim()})});toast(segs.length+' captions added'+(j.via?' (via '+j.via+')':''));changed()}
  catch(e){toast(e.message,6000)}finally{b.disabled=false;b.textContent='✨ Auto-captions'}}

/* export: play the timeline once into a MediaRecorder (picture from the canvas, sound from the mixer) */
async function startExport(){if(!total())return toast('Nothing to export yet');if(!window.MediaRecorder)return toast('This browser cannot record video. Try Chrome, Edge or Firefox.');stop();audio();if(actx.state==='suspended')await actx.resume();
  const type=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(x=>MediaRecorder.isTypeSupported(x));const stream=cv.captureStream(30);dest.stream.getAudioTracks().forEach(tr=>stream.addTrack(tr));
  const rec=new MediaRecorder(stream,{mimeType:type,videoBitsPerSecond:6e6}),chunks=[];rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};exporting={rec,chunks,type};mon.gain.value=0;
  rec.onstop=()=>{mon.gain.value=1;const ex=exporting;exporting=null;$('#bEx').textContent='Export ▾';if(ex&&ex.cancel)return;const blob=new Blob(chunks,{type:'video/webm'});download(safe($('#title').value)+'.webm',blob);toast('Exported '+(blob.size/1048576).toFixed(1)+' MB WebM')};
  rec.start(500);$('#bEx').textContent='Recording…';t=0;sync();draw();play()}
function finishExport(){const ex=exporting;if(!ex)return;setTimeout(()=>{try{ex.rec.stop()}catch(e){}},400)}
function cancelExport(){const ex=exporting;if(!ex)return;ex.cancel=true;stop();try{ex.rec.stop()}catch(e){}toast('Export cancelled')}
$('#bEx').onclick=e=>{if(exporting)return cancelExport();const r=e.currentTarget.getBoundingClientRect();ctxMenu(r.left,r.bottom+4,[{label:'Video (.webm)',go:startExport},{label:'Captions (.srt)',go:exportSrt},'-',{label:'Move to trash',go:()=>askTrash(ed,'video',$('#title').value||'this video')}])};
function build(){renderTL();setTab(V.clips.length?'clip':'media');if(!V.clips.length)setTab('media');draw()}
addEventListener('beforeunload',()=>{for(const k in urls)urls[k].then&&urls[k].then(u=>u&&URL.revokeObjectURL(u))});
