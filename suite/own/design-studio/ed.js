/* shared helpers for the Docs, Whiteboard and Website editors */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
function el(tag,attrs,...kids){const n=document.createElement(tag);for(const [k,v] of Object.entries(attrs||{})){if(v===false||v==null)continue;if(k==='class')n.className=v;else if(k==='html')n.innerHTML=v;else if(k==='style')n.style.cssText=v;else if(k.startsWith('on'))n.addEventListener(k.slice(2),v);else if(v===true)n.setAttribute(k,'');else n.setAttribute(k,v)}kids.flat(9).forEach(c=>{if(c!=null&&c!==false)n.append(c.nodeType?c:document.createTextNode(c))});return n}
const uid=()=>Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-4);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(m,ms=2200){let t=$('#toast');if(!t){t=el('div',{id:'toast',role:'status'});document.body.append(t)}t.textContent=m;t.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('on'),ms)}
try{const th=localStorage.getItem('ds.theme');if(th)document.documentElement.dataset.theme=th}catch(e){}
const PUT=()=>window.puter;
const KIND={doc:{dir:'/Designs/Docs',ext:'ddoc',label:'Document',home:'docs'},board:{dir:'/Designs/Whiteboards',ext:'dboard',label:'Whiteboard',home:'boards'},site:{dir:'/Designs/Websites',ext:'dsite',label:'Website',home:'sites'},video:{dir:'/Designs/Videos',ext:'dvideo',label:'Video',home:'videos'}};
const safe=n=>String(n||'Untitled').replace(/[\\/:*?"<>|\u0000-\u001f]+/g,'').replace(/\s+/g,' ').trim().slice(0,60)||'Untitled';
async function readJSON(p){const b=await PUT().fs.read(p);return JSON.parse(await b.text())}
function closeModal(){const m=$('.modal');if(m)m.remove()}
function openModal(node){closeModal();const m=el('div',{class:'modal',onmousedown:e=>{if(e.target===m)closeModal()}},el('div',{class:'dlg',role:'dialog','aria-modal':'true'},node));document.body.append(m);const f=$('button,input,textarea',m);if(f)f.focus();return m}
function askText(title,val,ok,go){const i=el('input',{class:'f',value:val||'','aria-label':title});const run=()=>{const v=i.value.trim();if(!v)return;closeModal();go(v)};i.addEventListener('keydown',e=>{if(e.key==='Enter')run()});openModal(el('div',{style:'display:grid;gap:12px;min-width:min(300px,80vw)'},el('h2',{},title),i,el('div',{class:'row',style:'justify-content:flex-end'},el('button',{class:'btn',onclick:closeModal},'Cancel'),el('button',{class:'btn pri',onclick:run},ok))));setTimeout(()=>{i.focus();i.select()},30)}
function askSure(msg,ok,go){openModal(el('div',{style:'display:grid;gap:12px;max-width:340px'},el('p',{style:'margin:0'},msg),el('div',{class:'row',style:'justify-content:flex-end'},el('button',{class:'btn',onclick:closeModal},'Cancel'),el('button',{class:'btn pri danger',onclick:()=>{closeModal();go()}},ok))))}
function ctxMenu(x,y,items){$$('.menu').forEach(m=>m.remove());const m=el('div',{class:'menu',role:'menu'});items.forEach(it=>{if(it==='-'){m.append(el('hr'));return}m.append(el('button',{role:'menuitem',disabled:!!it.off,onclick:()=>{m.remove();it.go()}},it.label,it.key?el('small',{class:'note'},it.key):''))});document.body.append(m);const r=m.getBoundingClientRect();m.style.left=Math.min(x,innerWidth-r.width-6)+'px';m.style.top=Math.min(y,innerHeight-r.height-6)+'px';const away=e=>{if(!m.contains(e.target)){m.remove();removeEventListener('pointerdown',away,true)}};setTimeout(()=>addEventListener('pointerdown',away,true),0)}
function download(name,blob){const a=el('a',{href:URL.createObjectURL(blob),download:name});document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)}
async function fileToDataURL(file,maxSide=1600,q=.86){if(!/^image\//.test(file.type))throw new Error('Not an image');if(file.type==='image/svg+xml'||file.type==='image/gif'){return await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(file)})}
  const url=URL.createObjectURL(file);try{const im=new Image();im.src=url;await im.decode();const k=Math.min(1,maxSide/Math.max(im.naturalWidth,im.naturalHeight)),c=document.createElement('canvas');c.width=Math.round(im.naturalWidth*k);c.height=Math.round(im.naturalHeight*k);const x=c.getContext('2d');x.drawImage(im,0,0,c.width,c.height);return c.toDataURL(file.type==='image/png'?'image/png':'image/jpeg',q)}finally{URL.revokeObjectURL(url)}}
function pickImage(cb,maxSide){const i=el('input',{type:'file',accept:'image/*'});i.onchange=async()=>{if(i.files[0]){try{cb(await fileToDataURL(i.files[0],maxSide))}catch(e){toast('Could not read that picture')}}};i.click()}
async function publishPages(name,pages,token,extra){const r=await fetch('/_local/design/publish',{method:'POST',credentials:'same-origin',headers:{'x-aos':'1','content-type':'application/json'},body:JSON.stringify({name,pages,token,...(extra||{})})});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Could not publish');return j}
async function unpublish(token){await fetch('/_local/design/unpublish',{method:'POST',credentials:'same-origin',headers:{'x-aos':'1','content-type':'application/json'},body:JSON.stringify({token})})}

/* A file-backed editor shell: loads ?f=, autosaves, handles the title and status text. */
function startEditor(kind,{blank,onLoad,collect}){
  const K=KIND[kind],q=new URLSearchParams(location.search);let path=q.get('f'),rec=null,dirty=false,timer=0,saving=false;
  const title=$('#title'),st=$('#st');
  const status=t=>{if(st)st.textContent=t};
  const save=async()=>{if(!rec||saving)return;saving=true;clearTimeout(timer);try{collect(rec);rec.name=title.value.trim()||'Untitled';rec.updated=Date.now();if(!path)path=`${K.dir}/${safe(rec.name)} [${rec.id.slice(-5)}].${K.ext}`;
      const body=JSON.stringify(rec);await PUT().fs.write(path,body,{createMissingParents:true,overwrite:true});dirty=false;status('Saved to Files');snapshot(body);history.replaceState(null,'','?f='+encodeURIComponent(path))}catch(e){status('Not saved')}finally{saving=false}if(dirty)queue()};
  let lastSnap=0;const vdir=()=>K.dir.replace('/Designs','/Designs/.versions');
  const snapshot=async(body,force)=>{if(!rec||(!force&&Date.now()-lastSnap<3e5))return;lastSnap=Date.now();try{await PUT().fs.write(`${vdir()}/${rec.id}-${Date.now()}.${K.ext}`,body,{createMissingParents:true,overwrite:true});const l=(await PUT().fs.readdir(vdir())).filter(x=>x.name.startsWith(rec.id+'-')).sort((a,b)=>a.name.localeCompare(b.name));for(const x of l.slice(0,Math.max(0,l.length-20)))try{await PUT().fs.delete(vdir()+'/'+x.name)}catch(e){}}catch(e){}};
  const queue=()=>{dirty=true;status('Saving…');clearTimeout(timer);timer=setTimeout(save,900)};
  title.addEventListener('input',queue);
  addEventListener('beforeunload',e=>{if(dirty){save();e.preventDefault();e.returnValue=''}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&dirty)save()});
  (async()=>{for(let i=0;i<50&&!PUT();i++)await new Promise(r=>setTimeout(r,100));
    try{rec=path?await readJSON(path):blank()}catch(e){toast('Could not open that file');rec=blank();path=null}
    await Promise.resolve();title.value=rec.name||'Untitled';onLoad(rec);status(path?'Saved to Files':'')})();
  $('#btnTheme')&&($('#btnTheme').onclick=()=>{const r=document.documentElement;const dark=r.dataset.theme?r.dataset.theme==='dark':matchMedia('(prefers-color-scheme:dark)').matches;const n=dark?'light':'dark';r.dataset.theme=n;try{localStorage.setItem('ds.theme',n)}catch(e){}});
  return {queue,save,snapshot,vdir,K,get rec(){return rec},get path(){return path}}
}

/* Move the open file to the shared trash (30 days, restorable from Home) and go back to Home. */
async function trashEditor(ed,kind){const home={doc:'docs',board:'boards',site:'sites',video:'videos'}[kind];await ed.save();const path=ed.path,rec=ed.rec;if(!path||!rec){location.href='./#'+home;return}
  const k=home,base=path.split('/').pop();const j=JSON.parse(JSON.stringify(rec));j._trash={kind:k,from:path,at:Date.now()};if(j.pub){try{await unpublish(j.pub.token)}catch(e){}delete j.pub}
  await PUT().fs.write('/Designs/.trash-ed/'+k+'__'+base,JSON.stringify(j),{createMissingParents:true,overwrite:true});await PUT().fs.delete(path);location.href='./#'+home}
const askTrash=(ed,kind,name)=>askSure('Move “'+name+'” to the trash? You can restore it from Home for 30 days.','Move to trash',()=>trashEditor(ed,kind).catch(()=>toast('Could not move it')));

/* AI helpers shared by Docs and Websites: the server uses your connected AI by default, or your Anthropic key. */
async function aiCall(task,body){const r=await fetch('/_local/design/aitext',{method:'POST',credentials:'same-origin',headers:{'x-aos':'1','content-type':'application/json'},body:JSON.stringify({task,...body})});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'The AI did not answer');return j}
async function aiReady(){try{const r=await fetch('/_local/design/aistatus',{method:'POST',credentials:'same-origin',headers:{'x-aos':'1','content-type':'application/json'},body:'{}'});return await r.json()}catch(e){return {text:{ready:false,reason:'Could not check the AI'}}}}

/* Version history: a snapshot is kept at most every 5 minutes (20 newest); restoring keeps the current version as a snapshot first. */
async function openHistory(ed){await ed.save();let l=[];try{l=(await PUT().fs.readdir(ed.vdir())).filter(x=>ed.rec&&x.name.startsWith(ed.rec.id+'-')).sort((a,b)=>b.name.localeCompare(a.name))}catch(e){}
  const rows=l.map(x=>{const ts=+x.name.slice(ed.rec.id.length+1).replace(/\..*$/,'');return el('div',{class:'row',style:'justify-content:space-between;gap:12px;border:1px solid var(--line);border-radius:9px;padding:7px 10px'},el('span',{},new Date(ts).toLocaleString([], {dateStyle:'medium',timeStyle:'short'})),el('button',{class:'btn sm','data-restore':x.name,onclick:()=>askSure('Go back to this version? Your current one is kept in the history.','Restore',async()=>{try{const b=await PUT().fs.read(ed.vdir()+'/'+x.name);const txt=typeof b==='string'?b:await b.text();await ed.snapshot(JSON.stringify(ed.rec),true);await PUT().fs.write(ed.path,txt,{overwrite:true});location.reload()}catch(err){toast('Could not restore that version')}})},'Restore'))});
  openModal(el('div',{style:'display:grid;gap:10px;min-width:min(380px,84vw)'},el('h2',{},'Version history'),el('p',{class:'note',style:'margin:0'},'Earlier versions are saved automatically while you work (the 20 newest are kept).'),...(rows.length?rows:[el('p',{class:'note'},'No earlier versions yet. They appear after your next save.')]),el('div',{class:'row',style:'justify-content:flex-end'},el('button',{class:'btn',onclick:closeModal},'Close'))))}
