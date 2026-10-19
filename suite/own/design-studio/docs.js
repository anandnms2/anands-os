/* Docs: a rich-text document editor that saves to Files › Designs › Docs */
const page=$('#page'),tools=$('#tools');
const FONTS=['Instrument Sans','Inter','Open Sans','Poppins','Montserrat','Lora','Merriweather','Playfair Display','Source Serif 4','Roboto Slab','Caveat','Space Mono','Georgia','Arial','Times New Roman','Courier New'];
const SIZES=[10,11,12,14,16,18,20,24,28,32,40,48];
const ALLOWED_TAGS=new Set('P DIV SPAN BR H1 H2 H3 H4 H5 H6 B STRONG I EM U S STRIKE DEL SUB SUP A UL OL LI BLOCKQUOTE PRE CODE TABLE THEAD TBODY TR TD TH COLGROUP COL IMG HR MARK'.split(' '));
const STYLE_OK=/^(color|background-color|background|font-size|font-family|font-weight|font-style|text-decoration|text-decoration-line|text-align|line-height|margin-left|padding-left|width|height|vertical-align|text-indent|float|margin|display)$/;
const CLASS_OK=new Set(['check','done','pb','tbl']);
function cleanStyle(s){return String(s||'').split(';').map(x=>x.trim()).filter(Boolean).filter(x=>{const i=x.indexOf(':');if(i<0)return false;const k=x.slice(0,i).trim().toLowerCase(),v=x.slice(i+1).toLowerCase();return STYLE_OK.test(k)&&!/url\(|expression|javascript|@import|behavior/.test(v)}).join(';')}
function sanitize(html){
  const d=new DOMParser().parseFromString('<body>'+html+'</body>','text/html');
  const walk=(src,dst)=>{src.childNodes.forEach(n=>{
    if(n.nodeType===3){dst.append(document.createTextNode(n.nodeValue));return}
    if(n.nodeType!==1)return;const tag=n.tagName;
    if(!ALLOWED_TAGS.has(tag)){if(!/^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED|LINK|META|TITLE|NOSCRIPT|SVG|MATH|FORM|INPUT|BUTTON|TEXTAREA|SELECT)$/.test(tag))walk(n,dst);return}
    const c=document.createElement(tag.toLowerCase());
    for(const a of n.attributes){const k=a.name.toLowerCase(),v=a.value;
      if(k==='style'){const s=cleanStyle(v);if(s)c.setAttribute('style',s)}
      else if(k==='class'){const cl=v.split(/\s+/).filter(x=>CLASS_OK.has(x)).join(' ');if(cl)c.setAttribute('class',cl)}
      else if(k==='href'&&tag==='A'){if(/^(https?:|mailto:|tel:|#)/i.test(v.trim()))c.setAttribute('href',v.trim())}
      else if(k==='src'&&tag==='IMG'){if(/^data:image\/(png|jpe?g|gif|webp|svg\+xml);/i.test(v)||/^https:/i.test(v))c.setAttribute('src',v)}
      else if(['alt','colspan','rowspan','width','height','title'].includes(k)&&!/^on/.test(k))c.setAttribute(k,v)}
    if(tag==='IMG'&&!c.getAttribute('src'))return;
    if(tag==='A')c.setAttribute('rel','noopener noreferrer');
    walk(n,c);dst.append(c)})};
  const out=document.createElement('div');walk(d.body,out);return out.innerHTML}

const ed=startEditor('doc',{blank:()=>({v:1,type:'doc',id:uid(),name:'Untitled document',html:'<h1>Untitled document</h1><p><br></p>',opts:{size:'a4',font:'Instrument Sans',fs:16,lh:1.6}}),
  onLoad:r=>{page.innerHTML=sanitize(r.html||'');r.opts=Object.assign({size:'a4',font:'Instrument Sans',fs:16,lh:1.6},r.opts||{});applyOpts();refresh();if(!$('#st').textContent)$('#st').textContent=''},
  collect:r=>{r.html=sanitize(page.innerHTML);r.words=countWords()}});
const changed=()=>{refresh();ed.queue()};
page.addEventListener('input',changed);
function applyOpts(){const o=ed.rec.opts;page.style.fontFamily=`"${o.font}",sans-serif`;page.style.fontSize=o.fs+'px';page.style.lineHeight=o.lh;page.classList.toggle('wide',o.size==='wide');page.style.setProperty('--pw',o.size==='letter'?'816px':o.size==='wide'?'1100px':'794px');page.style.minHeight=o.size==='wide'?'700px':o.size==='letter'?'1056px':'1123px'}
function countWords(){const t=page.innerText.trim();return t?t.split(/\s+/).length:0}
function refresh(){const w=countWords();$('#foot').textContent=`${w} word${w===1?'':'s'} · ${page.innerText.length} characters · ~${Math.max(1,Math.round(w/220))} min read`;page.classList.toggle('empty',!page.textContent.trim()&&!page.querySelector('img,table,hr'));
  const ol=$('#ol');ol.innerHTML='';$$('h1,h2,h3',page).forEach(h=>{ol.append(el('a',{class:'l'+h.tagName[1],onclick:()=>h.scrollIntoView({behavior:'smooth',block:'center'})},h.textContent||'(empty heading)'))});if(!ol.children.length)ol.append(el('span',{class:'note'},'Headings you add show up here.'))}

/* formatting */
document.execCommand('styleWithCSS',false,true);
const run=(c,v=null)=>{page.focus();document.execCommand(c,false,v);changed();syncTools()};
function setSize(px){page.focus();document.execCommand('fontSize',false,'7');$$('font[size="7"]',page).forEach(f=>{const s=el('span',{style:`font-size:${px}px`});while(f.firstChild)s.append(f.firstChild);f.replaceWith(s)});$$('span[style*="xxx-large"]',page).forEach(s=>{s.style.fontSize=px+'px'});changed()}
const btn=(label,title,fn,key)=>{const b=el('button',{title,'aria-label':title,'data-k':key||'',onclick:fn,html:label});tools.append(b);return b};
const sep=()=>tools.append(el('span',{class:'sep'}));
const sel=(title,opts,fn,w)=>{const s=el('select',{'aria-label':title,title,style:w?`width:${w}px`:'',onchange:()=>{fn(s.value);s.selectedIndex=0}},el('option',{value:''},title),...opts.map(([v,l])=>el('option',{value:v},l)));tools.append(s);return s};
btn('↶','Undo (Ctrl+Z)',()=>run('undo'));btn('↷','Redo (Ctrl+Shift+Z)',()=>run('redo'));sep();
sel('Style',[['p','Paragraph'],['h1','Heading 1'],['h2','Heading 2'],['h3','Heading 3'],['blockquote','Quote'],['pre','Code block']],v=>run('formatBlock',v),110);
sel('Font',FONTS.map(f=>[f,f]),v=>run('fontName',v),110);
sel('Size',SIZES.map(s=>[s,s+' px']),v=>setSize(+v),70);sep();
const fmts=[['<b>B</b>','Bold (Ctrl+B)','bold'],['<i>I</i>','Italic (Ctrl+I)','italic'],['<u>U</u>','Underline (Ctrl+U)','underline'],['<s>S</s>','Strikethrough','strikeThrough'],['x²','Superscript','superscript'],['x₂','Subscript','subscript']];
fmts.forEach(([l,t,c])=>btn(l,t,()=>run(c),c));
const col=(title,cmd,init)=>{const i=el('input',{type:'color',title,'aria-label':title,value:init});i.addEventListener('input',()=>run(cmd,i.value));tools.append(i)};
col('Text colour','foreColor','#1f1c19');col('Highlight','hiliteColor','#ffe066');sep();
[['⯇','Align left','justifyLeft'],['≡','Centre','justifyCenter'],['⯈','Align right','justifyRight'],['☰','Justify','justifyFull']].forEach(([l,t,c])=>btn(l,t,()=>run(c),c));sep();
btn('• List','Bullet list',()=>run('insertUnorderedList'));btn('1. List','Numbered list',()=>run('insertOrderedList'));
btn('☑','Checklist',()=>{run('insertUnorderedList');const li=curEl('li');if(li&&li.parentElement.tagName==='UL')li.parentElement.classList.add('check');changed()});
btn('⇥','Indent',()=>run('indent'));btn('⇤','Outdent',()=>run('outdent'));sep();
btn('🔗','Link (Ctrl+K)',()=>addLink());btn('🖼','Insert picture',()=>{const r=saveRange();pickImage(d=>{restoreRange(r);page.focus();document.execCommand('insertImage',false,d);changed()},1600)});
btn('▦','Insert table',()=>askTable());btn('—','Horizontal line',()=>run('insertHorizontalRule'));btn('⏎','Page break',()=>{run('insertHTML','<hr class="pb"><p><br></p>')});
btn('🎨','Insert a design',()=>insertDesign());sep();
btn('⌫','Clear formatting',()=>run('removeFormat'));
const tblBar=el('span',{id:'tblbar',hidden:true});tools.append(tblBar);
[['＋Row','Add row below',()=>tbl('addRow')],['＋Col','Add column right',()=>tbl('addCol')],['−Row','Delete row',()=>tbl('delRow')],['−Col','Delete column',()=>tbl('delCol')],['✕Table','Delete table',()=>tbl('delTbl')]].forEach(([l,t,f])=>tblBar.append(el('button',{title:t,'aria-label':t,onclick:f},l)));
function syncTools(){['bold','italic','underline','strikeThrough','justifyLeft','justifyCenter','justifyRight','justifyFull'].forEach(c=>{const b=$(`[data-k="${c}"]`,tools);if(b)try{b.setAttribute('aria-pressed',document.queryCommandState(c))}catch(e){}});tblBar.hidden=!curEl('td,th')}
document.addEventListener('selectionchange',()=>{if(page.contains(document.getSelection().anchorNode))syncTools()});
function curEl(sel_){let n=document.getSelection().anchorNode;if(n&&n.nodeType===3)n=n.parentElement;return n&&page.contains(n)?n.closest(sel_):null}
let saved=null;const saveRange=()=>{const s=document.getSelection();return s.rangeCount&&page.contains(s.anchorNode)?s.getRangeAt(0).cloneRange():null};
const restoreRange=r=>{if(!r)return;const s=document.getSelection();s.removeAllRanges();s.addRange(r)};
function addLink(){const r=saveRange(),a=curEl('a');askText('Link address',a?a.getAttribute('href'):'https://',  'Add link',v=>{restoreRange(r);page.focus();let u=v.trim();if(!/^(https?:|mailto:|tel:|#)/i.test(u))u='https://'+u;document.execCommand('createLink',false,u);changed()})}
function askTable(){const r=saveRange(),R=el('input',{class:'f',type:'number',min:1,max:20,value:3,'aria-label':'Rows'}),C=el('input',{class:'f',type:'number',min:1,max:10,value:3,'aria-label':'Columns'});
  openModal(el('div',{style:'display:grid;gap:10px'},el('h2',{},'Insert table'),el('label',{},'Rows',R),el('label',{},'Columns',C),el('div',{class:'row',style:'justify-content:flex-end'},el('button',{class:'btn',onclick:closeModal},'Cancel'),el('button',{class:'btn pri',onclick:()=>{const rr=clamp(+R.value||3,1,20),cc=clamp(+C.value||3,1,10);closeModal();restoreRange(r);page.focus();let h='<table class="tbl"><tbody>';for(let i=0;i<rr;i++){h+='<tr>'+Array.from({length:cc},()=>i?'<td><br></td>':'<th><br></th>').join('')+'</tr>'}h+='</tbody></table><p><br></p>';document.execCommand('insertHTML',false,h);changed()}},'Insert'))))}
function tbl(op){const td=curEl('td,th');if(!td)return;const tr=td.parentElement,t=td.closest('table'),ci=[...tr.children].indexOf(td);
  if(op==='addRow'){const n=tr.cloneNode(true);[...n.children].forEach(c=>{const x=document.createElement('td');x.innerHTML='<br>';c.replaceWith(x)});tr.after(n)}
  else if(op==='addCol'){[...t.rows].forEach(r=>{const c=document.createElement(r.rowIndex===0&&r.cells[0].tagName==='TH'?'th':'td');c.innerHTML='<br>';r.cells[Math.min(ci,r.cells.length-1)].after(c)})}
  else if(op==='delRow'){if(t.rows.length<2)t.remove();else tr.remove()}
  else if(op==='delCol'){if(tr.children.length<2)t.remove();else [...t.rows].forEach(r=>r.cells[Math.min(ci,r.cells.length-1)]&&r.cells[Math.min(ci,r.cells.length-1)].remove())}
  else if(op==='delTbl')t.remove();changed()}
async function insertDesign(){
  const r=saveRange();let items=[];try{items=(await PUT().fs.readdir('/Designs')).filter(i=>!i.is_dir&&/\.design$/i.test(i.name))}catch(e){}
  const grid=el('div',{style:'display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;max-height:60vh;overflow:auto'});
  openModal(el('div',{style:'display:grid;gap:10px;min-width:min(520px,86vw)'},el('h2',{},'Insert a design'),items.length?grid:el('p',{class:'note'},'No designs yet. Make one in Design Studio first.'),el('div',{class:'row',style:'justify-content:flex-end'},el('button',{class:'btn',onclick:closeModal},'Close'))));
  for(const it of items.slice(0,60)){try{const x=await readJSON(it.path);if(!x.thumb)continue;grid.append(el('button',{class:'btn',style:'flex-direction:column;padding:6px',onclick:()=>{closeModal();restoreRange(r);page.focus();document.execCommand('insertImage',false,x.thumb);changed()}},el('img',{src:x.thumb,alt:'',style:'width:100%;height:90px;object-fit:contain;background:#fff;border-radius:6px'}),el('small',{},x.name)))}catch(e){}}}

/* images: click to resize / align / remove */
const imgbar=el('div',{id:'imgbar',hidden:true,role:'toolbar','aria-label':'Picture'});document.body.append(imgbar);let curImg=null;
function showImg(im){$$('img.sel',page).forEach(x=>x.classList.remove('sel'));curImg=im;if(!im){imgbar.hidden=true;return}im.classList.add('sel');imgbar.innerHTML='';
  const w=p=>{im.style.width=p+'%';im.style.height='auto';changed();place()};
  [['25%',25],['50%',50],['75%',75],['100%',100]].forEach(([l,p])=>imgbar.append(el('button',{onclick:()=>w(p)},l)));
  [['⯇','left'],['≡','center'],['⯈','right']].forEach(([l,a])=>imgbar.append(el('button',{title:'Align '+a,onclick:()=>{im.style.display='block';im.style.marginLeft=a==='left'?'0':'auto';im.style.marginRight=a==='right'?'0':'auto';changed()}},l)));
  imgbar.append(el('button',{onclick:()=>{im.remove();showImg(null);changed()}},'Delete'));place()}
function place(){if(!curImg)return;const r=curImg.getBoundingClientRect();imgbar.hidden=false;imgbar.style.left=Math.max(8,r.left)+'px';imgbar.style.top=Math.max(60,r.top-42)+'px'}
page.addEventListener('click',e=>{if(e.target.tagName==='IMG')showImg(e.target);else showImg(null);
  const li=e.target.closest&&e.target.closest('ul.check>li');if(li&&e.offsetX<24&&e.target===li){li.classList.toggle('done');changed()}
  const a=e.target.closest&&e.target.closest('a');if(a&&(e.ctrlKey||e.metaKey)){window.open(a.href,'_blank','noopener')}});
$('#scroll').addEventListener('scroll',place);
/* paste: keep structure, drop anything unsafe; pictures become embedded */
page.addEventListener('paste',async e=>{const cd=e.clipboardData;if(!cd)return;const f=[...cd.files].find(x=>/^image\//.test(x.type));
  if(f){e.preventDefault();try{document.execCommand('insertImage',false,await fileToDataURL(f,1600));changed()}catch(x){}return}
  const h=cd.getData('text/html');if(h){e.preventDefault();document.execCommand('insertHTML',false,sanitize(h));changed()}});
page.addEventListener('drop',async e=>{const f=[...(e.dataTransfer.files||[])].find(x=>/^image\//.test(x.type));if(f){e.preventDefault();try{document.execCommand('insertImage',false,await fileToDataURL(f,1600));changed()}catch(x){}}});
page.addEventListener('keydown',e=>{const m=e.ctrlKey||e.metaKey;if(m&&e.key.toLowerCase()==='k'){e.preventDefault();addLink()}else if(m&&e.key.toLowerCase()==='s'){e.preventDefault();ed.save()}else if(m&&e.key.toLowerCase()==='f'){e.preventDefault();toggleFind(true)}
  else if(m&&e.altKey&&/^[1-3]$/.test(e.key)){e.preventDefault();run('formatBlock','h'+e.key)}
  else if(e.key==='Tab'){const td=curEl('td,th');if(td){e.preventDefault();const n=e.shiftKey?td.previousElementSibling||(td.parentElement.previousElementSibling&&td.parentElement.previousElementSibling.lastElementChild):td.nextElementSibling||(td.parentElement.nextElementSibling&&td.parentElement.nextElementSibling.firstElementChild);if(n){const r=document.createRange();r.selectNodeContents(n);r.collapse(false);restoreRange(r)}else if(!e.shiftKey)tbl('addRow')}else if(curEl('li')){e.preventDefault();run(e.shiftKey?'outdent':'indent')}}
  else if(e.key==='Enter'&&!e.shiftKey){const li=curEl('li');if(li&&li.parentElement.classList.contains('check')){setTimeout(()=>{const n=curEl('li');if(n)n.classList.remove('done')},0)}}});

/* find & replace */
function toggleFind(on){const w=$('#findwrap');if(!on&&w.children.length){w.innerHTML='';return}if(w.children.length){$('input',w).focus();return}
  const f=el('input',{class:'f','aria-label':'Find',placeholder:'Find'}),r=el('input',{class:'f','aria-label':'Replace with',placeholder:'Replace with'}),info=el('span',{class:'note'});
  const marks=()=>$$('mark.fnd',page);const clear=()=>{marks().forEach(m=>{m.replaceWith(document.createTextNode(m.textContent));});page.normalize()};
  const hl=()=>{clear();const q=f.value;if(!q){info.textContent='';return}const rx=new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi');const tw=document.createTreeWalker(page,NodeFilter.SHOW_TEXT);const ns=[];while(tw.nextNode())ns.push(tw.currentNode);let n=0;
    ns.forEach(t=>{if(!rx.test(t.nodeValue))return;rx.lastIndex=0;const fr=document.createDocumentFragment();let last=0,m;while((m=rx.exec(t.nodeValue))){fr.append(document.createTextNode(t.nodeValue.slice(last,m.index)));const mk=el('mark',{class:'fnd'},m[0]);fr.append(mk);last=m.index+m[0].length;n++;if(!m[0].length)rx.lastIndex++}fr.append(document.createTextNode(t.nodeValue.slice(last)));t.replaceWith(fr)});info.textContent=n+' found';const first=marks()[0];if(first)first.scrollIntoView({block:'center'})};
  f.addEventListener('input',hl);
  const bar=el('div',{id:'find'},f,r,el('button',{class:'btn sm',onclick:()=>{const m=marks()[0];if(m){m.replaceWith(document.createTextNode(r.value));page.normalize();hl();changed()}}},'Replace'),el('button',{class:'btn sm',onclick:()=>{marks().forEach(m=>m.replaceWith(document.createTextNode(r.value)));page.normalize();hl();changed()}},'Replace all'),info,el('span',{class:'grow'}),el('button',{class:'btn sm',onclick:()=>{clear();w.innerHTML=''}},'Close'));
  w.append(bar);f.focus()}
$('#bFind').onclick=()=>toggleFind();
const cleanedHTML=()=>{$$('mark.fnd',page).forEach(m=>m.replaceWith(document.createTextNode(m.textContent)));return sanitize(page.innerHTML)};

/* page setup */
const setup=el('select',{'aria-label':'Page setup',title:'Page setup',onchange:()=>{const v=setup.value;if(!v)return;const o=ed.rec.opts;if(v.startsWith('size:'))o.size=v.slice(5);else if(v.startsWith('fs:'))o.fs=+v.slice(3);else if(v.startsWith('lh:'))o.lh=+v.slice(3);applyOpts();ed.queue();setup.selectedIndex=0}},el('option',{value:''},'Page'),...[['size:a4','A4 page'],['size:letter','US Letter'],['size:wide','Wide (no page)'],['fs:14','Text 14 px'],['fs:16','Text 16 px'],['fs:18','Text 18 px'],['lh:1.3','Tight lines'],['lh:1.6','Normal lines'],['lh:2','Double lines']].map(([v,l])=>el('option',{value:v},l)));
tools.append(el('span',{class:'sep'}),setup);

/* export */
const DOC_CSS=`body{margin:0;background:#fff;color:#1f1c19;font:16px/1.6 "Instrument Sans",system-ui,sans-serif}article{max-width:780px;margin:0 auto;padding:48px 22px}h1{font-size:2em;margin:.8em 0 .3em;line-height:1.2}h2{font-size:1.5em;margin:.9em 0 .3em}h3{font-size:1.2em}p{margin:0 0 .7em}blockquote{margin:.8em 0;padding:.2em 1em;border-left:4px solid #e8590c;color:#555;background:#faf6f1}pre{background:#1f1c19;color:#f3efe8;padding:12px 14px;border-radius:8px;white-space:pre-wrap;overflow:auto}table{border-collapse:collapse;width:100%}td,th{border:1px solid #cfc8bd;padding:6px 9px;vertical-align:top}th{background:#f3eee6}img{max-width:100%;height:auto}hr{border:0;border-top:1px solid #cfc8bd}hr.pb{display:none}ul.check{list-style:none;padding-left:4px}ul.check li::before{content:'☐ '}ul.check li.done::before{content:'☑ '}mark{background:#ffe066}@media print{article{padding:0}hr.pb{display:block;border:0;break-after:page}}`;
const fontLink=()=>{const o=ed.rec.opts;return '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family='+encodeURIComponent(o.font).replace(/%20/g,'+')+':wght@400;700&display=swap">'};
function docHTML(){const t=esc($('#title').value||'Document'),o=ed.rec.opts;return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${t}</title>${fontLink()}<style>${DOC_CSS}article{font-family:"${o.font}",sans-serif;font-size:${o.fs}px;line-height:${o.lh}}</style></head><body><article>${cleanedHTML()}</article></body></html>`}
function toMarkdown(){const out=[];const inl=n=>{if(n.nodeType===3)return n.nodeValue.replace(/ /g,' ');if(n.nodeType!==1)return'';const t=n.tagName,c=[...n.childNodes].map(inl).join('');
    if(t==='B'||t==='STRONG'||/font-weight:\s*(bold|[6-9]00)/.test(n.getAttribute('style')||''))return c.trim()?'**'+c+'**':c;if(t==='I'||t==='EM'||/italic/.test(n.getAttribute('style')||''))return c.trim()?'*'+c+'*':c;if(t==='S'||t==='STRIKE'||t==='DEL')return '~~'+c+'~~';if(t==='CODE')return '`'+c+'`';
    if(t==='A')return `[${c}](${n.getAttribute('href')||''})`;if(t==='IMG')return `![${n.getAttribute('alt')||''}](${(n.getAttribute('src')||'').startsWith('data:')?'embedded-image':n.getAttribute('src')})`;if(t==='BR')return '\n';return c};
  const blk=(n,depth=0)=>{if(n.nodeType===3){if(n.nodeValue.trim())out.push(n.nodeValue.trim(),'');return}if(n.nodeType!==1)return;const t=n.tagName;
    if(/^H[1-6]$/.test(t))out.push('#'.repeat(+t[1])+' '+inl(n).trim(),'');
    else if(t==='UL'||t==='OL'){[...n.children].forEach((li,i)=>{const chk=n.classList.contains('check')?(li.classList.contains('done')?'[x] ':'[ ] '):'';const own=[...li.childNodes].filter(x=>!/^(UL|OL)$/.test(x.tagName||'')).map(inl).join('').trim();out.push('  '.repeat(depth)+(t==='OL'?(i+1)+'. ':'- ')+chk+own);[...li.children].filter(x=>/^(UL|OL)$/.test(x.tagName)).forEach(x=>blk(x,depth+1))});if(!depth)out.push('')}
    else if(t==='BLOCKQUOTE')out.push(inl(n).trim().split('\n').map(l=>'> '+l).join('\n'),'');else if(t==='PRE')out.push('```',n.textContent,'```','');
    else if(t==='HR')out.push(n.classList.contains('pb')?'<!-- page break -->':'---','');
    else if(t==='TABLE'){const rows=[...n.rows].map(r=>[...r.cells].map(c=>inl(c).trim().replace(/\|/g,'\\|').replace(/\n/g,' ')));if(rows.length){out.push('| '+rows[0].join(' | ')+' |','|'+rows[0].map(()=>' --- ').join('|')+'|',...rows.slice(1).map(r=>'| '+r.join(' | ')+' |'),'')}}
    else if(t==='DIV'&&[...n.children].some(c=>/^(P|DIV|H[1-6]|UL|OL|TABLE|BLOCKQUOTE|PRE)$/.test(c.tagName)))[...n.childNodes].forEach(c=>blk(c,depth));
    else{const s=inl(n).trim();if(s)out.push(s,'')}};
  [...page.childNodes].forEach(n=>blk(n));return out.join('\n').replace(/\n{3,}/g,'\n\n').trim()+'\n'}

/* .docx writer (headings, runs, lists, tables, links, pictures, page breaks) */
async function toDocx(){
  const z=new JSZip(),rels=[],media=[];let rid=10,imgN=0;const X=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const hexOf=c=>{const m=String(c||'').match(/^#([0-9a-f]{6})$/i)||String(c||'').match(/^#([0-9a-f]{3})$/i);if(m){let h=m[1];if(h.length===3)h=h.split('').map(x=>x+x).join('');return h.toUpperCase()}const r=String(c||'').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);return r?[r[1],r[2],r[3]].map(v=>(+v).toString(16).padStart(2,'0')).join('').toUpperCase():null};
  const rpr=f=>{let s='';if(f.font)s+=`<w:rFonts w:ascii="${X(f.font)}" w:hAnsi="${X(f.font)}"/>`;if(f.b)s+='<w:b/>';if(f.i)s+='<w:i/>';if(f.u)s+='<w:u w:val="single"/>';if(f.s)s+='<w:strike/>';if(f.color)s+=`<w:color w:val="${f.color}"/>`;if(f.sz)s+=`<w:sz w:val="${f.sz}"/>`;if(f.hl)s+=`<w:shd w:val="clear" w:color="auto" w:fill="${f.hl}"/>`;if(f.sup)s+='<w:vertAlign w:val="superscript"/>';if(f.sub)s+='<w:vertAlign w:val="subscript"/>';if(f.link)s+='<w:rStyle w:val="Hyperlink"/>';return s?`<w:rPr>${s}</w:rPr>`:''};
  const runText=(t,f)=>t?`<w:r>${rpr(f)}<w:t xml:space="preserve">${X(t)}</w:t></w:r>`:'';
  function imgRun(im){const src=im.getAttribute('src')||'';const m=/^data:image\/(png|jpe?g|gif);base64,(.+)$/i.exec(src);if(!m)return runText('[picture]',{});imgN++;const ext=m[1].toLowerCase().replace('jpeg','jpg'),name=`image${imgN}.${ext}`;z.file('word/media/'+name,m[2],{base64:true});const id='rId'+(rid++);rels.push(`<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${name}"/>`);media.push(ext);
    let w=im.naturalWidth||im.width||400,h=im.naturalHeight||im.height||300;const pw=page.clientWidth-160;let dw=im.style.width&&/%/.test(im.style.width)?pw*parseFloat(im.style.width)/100:Math.min(w,pw);const dh=dw*h/w;const cx=Math.round(dw*9525),cy=Math.round(dh*9525);
    return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${imgN}" name="Picture ${imgN}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${imgN}" name="${name}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${id}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`}
  function runs(n,f){if(n.nodeType===3)return runText(n.nodeValue.replace(/ /g,' '),f);if(n.nodeType!==1)return'';const t=n.tagName,g={...f},st=n.style||{};
    if(t==='B'||t==='STRONG'||/^(bold|[6-9]00)$/.test(st.fontWeight))g.b=true;if(t==='I'||t==='EM'||st.fontStyle==='italic')g.i=true;if(t==='U'||/underline/.test(st.textDecorationLine||st.textDecoration||''))g.u=true;if(t==='S'||t==='STRIKE'||t==='DEL'||/line-through/.test(st.textDecorationLine||st.textDecoration||''))g.s=true;if(t==='SUP')g.sup=true;if(t==='SUB')g.sub=true;
    if(st.color){const c=hexOf(st.color);if(c)g.color=c}if(st.backgroundColor||t==='MARK'){const c=hexOf(st.backgroundColor)||'FFE066';g.hl=c}if(st.fontSize&&/px/.test(st.fontSize))g.sz=Math.round(parseFloat(st.fontSize)*1.5);if(st.fontFamily)g.font=st.fontFamily.replace(/["']/g,'').split(',')[0].trim();
    if(t==='BR')return '<w:r><w:br/></w:r>';if(t==='IMG')return imgRun(n);
    if(t==='A'&&/^https?:|^mailto:/i.test(n.getAttribute('href')||'')){const id='rId'+(rid++);rels.push(`<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${X(n.getAttribute('href'))}" TargetMode="External"/>`);return `<w:hyperlink r:id="${id}">${[...n.childNodes].map(c=>runs(c,{...g,link:true,color:'0563C1',u:true})).join('')}</w:hyperlink>`}
    return [...n.childNodes].map(c=>runs(c,g)).join('')}
  const align=n=>{const a=(n.style&&n.style.textAlign)||'';return a==='center'?'center':a==='right'?'right':a==='justify'?'both':''};
  const para=(n,{style,num,ind,f={},pre,extra=''}={})=>{const ppr=(style?`<w:pStyle w:val="${style}"/>`:'')+(num?`<w:numPr><w:ilvl w:val="${num[1]}"/><w:numId w:val="${num[0]}"/></w:numPr>`:'')+extra+(ind?`<w:ind w:left="${ind}"/>`:'')+(align(n)?`<w:jc w:val="${align(n)}"/>`:'');return `<w:p>${ppr?`<w:pPr>${ppr}</w:pPr>`:''}${[...n.childNodes].filter(c=>!/^(UL|OL)$/.test(c.tagName||'')).map(c=>runs(c,f)).join('')}</w:p>`};
  function blocks(n,ctx={}){if(n.nodeType===3){return n.nodeValue.trim()?`<w:p>${runText(n.nodeValue,{})}</w:p>`:''}if(n.nodeType!==1)return'';const t=n.tagName;
    if(/^H[1-3]$/.test(t))return para(n,{style:'Heading'+t[1]});if(/^H[4-6]$/.test(t))return para(n,{style:'Heading3'});
    if(t==='UL'||t==='OL'){const lvl=ctx.lvl||0,chk=n.classList.contains('check');
      return [...n.children].map(li=>{const mark=chk?runText(li.classList.contains('done')?'☑ ':'☐ ',{}):'';
        const ppr='<w:pStyle w:val="ListParagraph"/>'+(chk?`<w:ind w:left="${720+lvl*360}"/>`:`<w:numPr><w:ilvl w:val="${Math.min(lvl,3)}"/><w:numId w:val="${t==='UL'?1:2}"/></w:numPr>`);
        const inner=[...li.childNodes].filter(c=>!/^(UL|OL)$/.test(c.tagName||'')).map(c=>runs(c,{})).join('');
        return `<w:p><w:pPr>${ppr}</w:pPr>${mark}${inner}</w:p>`+[...li.children].filter(c=>/^(UL|OL)$/.test(c.tagName)).map(c=>blocks(c,{lvl:lvl+1})).join('')}).join('')}
    if(t==='BLOCKQUOTE')return para(n,{ind:720,f:{i:true,color:'555555'}});if(t==='PRE')return `<w:p><w:pPr><w:shd w:val="clear" w:color="auto" w:fill="EEEAE3"/></w:pPr>${n.textContent.split('\n').map((l,i)=>(i?'<w:r><w:br/></w:r>':'')+runText(l,{font:'Courier New',sz:20})).join('')}</w:p>`;
    if(t==='HR')return n.classList.contains('pb')?'<w:p><w:r><w:br w:type="page"/></w:r></w:p>':'<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="BBBBBB"/></w:pBdr></w:pPr></w:p>';
    if(t==='TABLE'){const rows=[...n.rows];const cols=Math.max(...rows.map(r=>r.cells.length));const w=Math.floor(9000/cols);return `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders>${['top','left','bottom','right','insideH','insideV'].map(b=>`<w:${b} w:val="single" w:sz="4" w:space="0" w:color="BBBBBB"/>`).join('')}</w:tblBorders></w:tblPr><w:tblGrid>${Array.from({length:cols},()=>`<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>${rows.map(r=>`<w:tr>${[...r.cells].map(c=>`<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${c.tagName==='TH'?'<w:shd w:val="clear" w:color="auto" w:fill="F3EEE6"/>':''}</w:tcPr>${para(c,{f:c.tagName==='TH'?{b:true}:{}})}</w:tc>`).join('')}</w:tr>`).join('')}</w:tbl><w:p/>`}
    if(t==='DIV'&&[...n.children].some(c=>/^(P|DIV|H[1-6]|UL|OL|TABLE|BLOCKQUOTE|PRE|HR)$/.test(c.tagName)))return [...n.childNodes].map(c=>blocks(c,ctx)).join('');
    if(t==='IMG')return `<w:p>${imgRun(n)}</w:p>`;
    return para(n)}
  const body=[...page.childNodes].map(n=>blocks(n)).join('')||'<w:p/>';
  const NS='xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"';
  z.file('[Content_Types].xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="jpg" ContentType="image/jpeg"/><Default Extension="gif" ContentType="image/gif"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/></Types>`);
  z.file('_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  z.file('word/_rels/document.xml.rels',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>${rels.join('')}</Relationships>`);
  const o=ed.rec.opts,pgW=o.size==='letter'?12240:11906,pgH=o.size==='letter'?15840:16838;
  z.file('word/document.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${NS}><w:body>${body}<w:sectPr><w:pgSz w:w="${pgW}" w:h="${pgH}"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`);
  const hd=(id,sz,sp)=>`<w:style w:type="paragraph" w:styleId="Heading${id}"><w:name w:val="heading ${id}"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="${sp}" w:after="120"/><w:outlineLvl w:val="${id-1}"/></w:pPr><w:rPr><w:b/><w:sz w:val="${sz}"/></w:rPr></w:style>`;
  z.file('word/styles.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="${X(o.font)}" w:hAnsi="${X(o.font)}" w:cs="${X(o.font)}"/><w:sz w:val="${Math.round(o.fs*1.5)}"/><w:lang w:val="en-US"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="140" w:line="${Math.round(o.lh*240)}" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>${hd(1,48,360)}${hd(2,36,300)}${hd(3,28,240)}<w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="40"/></w:pPr></w:style><w:style w:type="character" w:styleId="Hyperlink"><w:name w:val="Hyperlink"/><w:rPr><w:color w:val="0563C1"/><w:u w:val="single"/></w:rPr></w:style></w:styles>`);
  const lvl=(i,fmt,txt)=>`<w:lvl w:ilvl="${i}"><w:start w:val="1"/><w:numFmt w:val="${fmt}"/><w:lvlText w:val="${txt}"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="${720+i*360}" w:hanging="360"/></w:pPr></w:lvl>`;
  z.file('word/numbering.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:abstractNum w:abstractNumId="1">${[0,1,2,3].map(i=>lvl(i,'bullet','•')).join('')}</w:abstractNum><w:abstractNum w:abstractNumId="2">${[0,1,2,3].map(i=>lvl(i,'decimal','%'+(i+1)+'.')).join('')}</w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="1"/></w:num><w:num w:numId="2"><w:abstractNumId w:val="2"/></w:num></w:numbering>`);
  return await z.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'})}

$('#bAI').onclick=async()=>{const range=saveRange();const sel=(window.getSelection()||'').toString().trim();const st=await aiReady();if(!st.text||!st.text.ready){toast((st.text&&st.text.reason)||'Connect your AI in Settings first',4500);return}
  const ta=el('textarea',{class:'f',rows:3,'aria-label':'What should it write?',placeholder:sel?'Or describe a change, e.g. make it warmer':'e.g. a friendly one-page proposal for a warehouse lease'});const out=el('textarea',{class:'f',rows:8,'aria-label':'Result',placeholder:'The result appears here. You can edit it before adding it.'});const status=el('p',{class:'note',role:'status'},sel?'Selected text: “'+sel.slice(0,70)+(sel.length>70?'…':'')+'”':'Nothing selected, so it will write new text at the cursor.');let busy=false;
  const run=async(task,body)=>{if(busy)return;busy=true;status.textContent='Thinking…';try{const r=await aiCall(task,body);out.value=r.text;status.textContent='Done ('+(r.provider==='anthropic'?'Anthropic':'your AI')+'). Edit it if you like, then add it.'}catch(e){status.textContent=e.message}busy=false};
  const chips=['Make it shorter','Make it longer','Fix spelling and grammar','More professional','More friendly','Simplify the words'];
  const toHtml=t=>t.split(/\n{2,}/).map(p=>'<p>'+esc(p).replace(/\n/g,'<br>')+'</p>').join('');
  const put=(replace)=>{if(!out.value.trim())return;closeModal();page.focus();restoreRange(range);document.execCommand('insertHTML',false,sanitize(toHtml(out.value)));changed()};
  openModal(el('div',{style:'display:grid;gap:10px;min-width:min(480px,86vw)'},el('h2',{},'Write with AI'),ta,el('div',{class:'row'},el('button',{class:'btn pri',id:'aiWrite',onclick:()=>{const t=ta.value.trim();if(sel&&t)run('rewrite',{text:sel,instruction:t});else if(t)run('write',{prompt:t,kind:'a section of a document'});else status.textContent='Say what you want first.'}},sel&&ta.value.trim()?'Rewrite':'Write'),el('button',{class:'btn',disabled:!sel,onclick:()=>run('summarize',{text:sel})},'Summarize selection')),
    el('div',{class:'chips'},chips.map(c=>el('button',{class:'chip',disabled:!sel,title:sel?c:'Select some text first',onclick:()=>run('rewrite',{text:sel,instruction:c})},c)),['Swahili','Hindi','French','Arabic'].map(l=>el('button',{class:'chip',disabled:!sel,onclick:()=>run('translate',{text:sel,language:l})},'To '+l))),status,out,el('div',{class:'row',style:'justify-content:flex-end'},el('button',{class:'btn',onclick:closeModal},'Cancel'),el('button',{class:'btn pri',id:'aiUse',onclick:()=>put()},sel?'Replace selection':'Add to document'))))};
$('#bDl').onclick=e=>{const r=e.currentTarget.getBoundingClientRect(),name=safe($('#title').value);ctxMenu(r.left,r.bottom+4,[{label:'Version history',go:()=>openHistory(ed)},'-',
  {label:'Word document (.docx)',go:async()=>{try{download(name+'.docx',await toDocx());toast('Saved '+name+'.docx')}catch(x){toast('Could not make the .docx: '+x.message)}}},
  {label:'PDF (print window)',go:()=>{toggleFind(false);window.print()}},{label:'Web page (.html)',go:()=>download(name+'.html',new Blob([docHTML()],{type:'text/html'}))},
  {label:'Markdown (.md)',go:()=>download(name+'.md',new Blob([toMarkdown()],{type:'text/markdown'}))},{label:'Plain text (.txt)',go:()=>download(name+'.txt',new Blob([page.innerText],{type:'text/plain'}))},'-',
  {label:'Save a copy to Files',go:async()=>{await ed.save();toast('Saved in Files › Designs › Docs')}},'-',{label:'Move to trash',go:()=>askTrash(ed,'doc',$('#title').value||'Untitled')}])};
$('#bShare').onclick=()=>{const r=ed.rec;const draw=()=>{const body=el('div',{style:'display:grid;gap:12px;min-width:min(420px,84vw)'},el('h2',{},'Share this document'));
  if(r.pub){const url=location.origin+r.pub.path;body.append(el('p',{class:'note'},'Anyone with this link can read the page. They cannot edit it.'),el('input',{class:'f',readonly:true,value:url,'aria-label':'Public link',onclick:e=>e.target.select()}),el('div',{class:'row'},el('button',{class:'btn pri',onclick:async()=>{try{await navigator.clipboard.writeText(url);toast('Link copied')}catch(e){toast(url,6000)}}},'Copy link'),el('button',{class:'btn',onclick:async()=>{await doPub();draw()}},'Update with latest changes'),el('button',{class:'btn danger',onclick:async()=>{await unpublish(r.pub.token);r.pub=null;ed.queue();draw()}},'Stop sharing')))}
  else body.append(el('p',{class:'note'},'Publish a read-only web page of this document. You can stop sharing at any time.'),el('div',{class:'row'},el('button',{class:'btn pri',onclick:async()=>{await doPub();draw()}},'Publish a link')));
  body.append(el('div',{class:'row',style:'justify-content:flex-end'},el('button',{class:'btn',onclick:closeModal},'Close')));openModal(body)};
  const doPub=async()=>{try{const j=await publishPages(r.name||$('#title').value,{index:docHTML()},r.pub&&r.pub.token);r.pub={token:j.token,path:j.path};ed.queue();toast('Published')}catch(e){toast(e.message,4000)}};draw()};
