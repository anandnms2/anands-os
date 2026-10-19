/* Website templates: 45 categories x 5 looks = 225 starting points. Pictures are painted in code (site-art.js) in the theme's three
   colours and stored as "art:<scene>:<seed>", so they stay small and recolour when the theme changes. */
const LOOKS=['Classic','Bold','Vibrant','Editorial','Fresh'];
/* each category gets a more specific scene than the first version used */
const M2={saas:'laptop',app:'phone',startup:'rocket',agency:'paint',bakery:'fruit',portfolio:'frame',band:'music',conference:'city',course:'laptop',salon:'scissors',boutique:'shop',hotel:'beach',logistics:'port',wedding:'heart',catering:'fruit',charity:'heart',cleaning:'bloom',church:'hills',construction:'house',cv:'person',solar:'solar'};
CATS.forEach(C=>{if(M2[C.id])C.m=M2[C.id]});
const POOL={Business:['city','chart','laptop','hills','bars','grid'],Tech:['laptop','phone','rocket','grid','circles','chart'],Food:['plate','fruit','cup','bloom','shop','hills'],Creative:['paint','camera','frame','music','film','circles'],Events:['balloon','gift','heart','bloom','music','city'],Personal:['laptop','book','person','mountain','circles','hills'],Education:['book','balloon','music','person','laptop','hills'],Community:['heart','hills','field','person','house','bloom'],Health:['stones','bloom','leaf','fruit','bars','waves'],Retail:['shop','gift','diamond','bloom','fruit','scissors'],Services:['car','paw','scissors','field','house','shop'],Travel:['savanna','beach','mountain','waves','road','hills']};
const lum=c=>{const [r,g,b]=hx(c);return(.299*r+.587*g+.114*b)/255};
const fitDark=c=>{let n=0;while(lum(c)>.55&&n++<8)c=mix(c,'#000000',.12);return c};
const fitLight=c=>{let n=0;while(lum(c)<.45&&n++<8)c=mix(c,'#ffffff',.14);return c};
const SERIF=[1,3,4,7,9],FRESH=[0,2,6,8],VIB=[0,2,6,5];
function themeFor(C,v){const b=C.p;let p,f;
  if(v===0){p=fitDark(b);f=FONTPAIRS[C.f%FONTPAIRS.length];return {p,p2:rot(p,40,1.15),p3:rot(p,-50,1.15),bg:mix(p,'#ffffff',.97),alt:mix(p,'#ffffff',.88),tx:mix(p,'#000000',.86),dark:false,head:f[0],body:f[1],radius:14,pop:true}}
  if(v===1){p=fitLight(mix(b,'#ffffff',.2));f=FONTPAIRS[(C.f+3)%FONTPAIRS.length];return {p,p2:rot(p,45,1.1),p3:rot(p,-55,1.1),bg:mix(b,'#000000',.9),alt:mix(b,'#000000',.82),tx:'#f4f1ec',dark:true,head:f[0],body:f[1],radius:22,grad:true,deco:true}}
  if(v===2){p=fitDark(rot(b,25,1.25));const p2=rot(p,60,1.1),p3=rot(p,-60,1.1);f=FONTPAIRS[VIB[C.f%4]];return {p,p2,p3,bg:mix(p3,'#ffffff',.93),alt:mix(p2,'#ffffff',.84),tx:mix(p,'#000000',.88),dark:false,head:f[0],body:f[1],radius:26,grad:true,pop:true,deco:true}}
  if(v===3){p=fitDark(mix(b,'#000000',.15));f=FONTPAIRS[SERIF[C.f%5]];return {p,p2:rot(p,30,.8),p3:rot(p,-30,.7),bg:'#fbf7f0',alt:'#f1e9dc',tx:'#201a14',dark:false,head:f[0],body:f[1],radius:2}}
  p=fitDark(rot(b,-30,1.15,.02));const q2=rot(p,70,1.1),q3=rot(p,-70,1.1);f=FONTPAIRS[FRESH[C.f%4]];
  return {p,p2:q2,p3:q3,bg:mix(q2,'#ffffff',.92),alt:mix(p,'#ffffff',.85),tx:mix(p,'#000000',.85),dark:false,head:f[0],body:f[1],radius:30,pop:true,deco:true}}
function buildCategorySite(ci,v){
  const C=CATS[ci];const th=themeFor(C,v);const sd=ci*11+v*5;
  const slug=C.id;const mk=(type,d,over={})=>{const b=mkBlock(type);b.d=Object.assign({},b.d,d);Object.assign(b,over);return b};
  const names=['Neema K.','Baraka M.','Zawadi S.'],roles={Food:'Guest',Travel:'Guest',Health:'Client',Education:'Parent',Community:'Member',Tech:'User',Creative:'Client',Events:'Guest',Retail:'Customer',Personal:'Colleague',Business:'Client',Services:'Customer'};
  const scenes=[C.m].concat((POOL[C.g]||POOL.Business).filter(x=>x!==C.m));
  const art=(m,n)=>`art:${m||C.m}:${sd+n}`,sc=(i,n)=>art(scenes[i%scenes.length],n);
  const nav=()=>mk('nav',{logo:C.n,btn:C.cta[2],btnLink:'page:contact'},{v:v===3?'center':'left',bg:'bg'});
  const heroText={eyebrow:C.tag.toUpperCase(),title:C.h[0],sub:C.h[1],btn:C.cta[2],btnLink:'page:contact',btn2:'Learn more',btn2Link:''};
  const hero=()=>v===0?mk('hero',{...heroText,img:sc(0,1),img2:sc(1,2),img3:sc(2,3)},{v:'collage',bg:'alt'}):
    v===1?mk('hero',{...heroText,img:sc(0,1)},{v:'cover',bg:'alt'}):
    v===2?mk('hero',{...heroText,btn2:'',img:sc(0,1)},{v:'split',bg:'bg'}):
    v===3?mk('hero',{...heroText,btn2:'',img:''},{v:'center',bg:'bg'}):
    mk('hero',{...heroText,img:sc(0,1)},{v:'arch',bg:'bg'});
  const feats=()=>mk('features',{eyebrow:'WHAT WE DO',title:'Why choose '+C.n.split(' ')[0],sub:'',items:C.ft.map((f,i)=>({icon:C.ic[i],title:f[0],text:f[1]}))},{v:v===3?'plain':'cards',bg:'bg'});
  const cards=(ov)=>mk('cards',{eyebrow:'HIGHLIGHTS',title:v===3?'What we are known for':'See what we do',sub:'',items:C.ft.map((f,i)=>({img:sc(i+1,10+i),title:f[0],text:f[1]}))},{v:ov?'overlay':'grid',bg:v===2||v===4?'alt':'bg'});
  const about=(rev,a)=>mk('split',{eyebrow:'ABOUT US',title:C.ab[0],text:C.ab[1],btn:C.cta[2],btnLink:'page:contact',img:sc(1,2)},{v:(a?'arch':'')+(rev?(a?'left':'left'):(a?'':'right')),bg:'bg'});
  const gal=(kind,n)=>mk('gallery',{items:Array.from({length:n},(_,i)=>({img:sc(i,30+i)}))},{v:kind,bg:'bg'});
  const stats=()=>mk('stats',{items:[0,2,4,6].map(i=>({num:C.st[i],label:C.st[i+1]}))},{bg:'primary'});
  const quotes=()=>mk('testimonials',{title:'What people say',items:C.q.map((q,i)=>({quote:q,name:names[i],role:roles[C.g]||'Customer'}))},{bg:'alt'});
  const faq=()=>mk('faq',{title:'Questions, answered',items:[{q:'How do I get started?',a:'Send us a message or call, and we will reply within one working day.'},{q:'Where are you based?',a:'Dar es Salaam, Tanzania. We also work with people across the region.'},{q:'How can I pay?',a:'Bank transfer, mobile money or cash. We will confirm everything in writing first.'}]},{bg:'bg'});
  const cta=()=>mk('cta',{title:C.cta[0],sub:C.cta[1],btn:C.cta[2],btnLink:'page:contact'},{bg:'primary'});
  const contact=()=>mk('contact',{title:'Get in touch',sub:'We usually reply within one working day.',email:'hello@'+slug+'.example',phone:'+255 700 000 000',address:'Dar es Salaam, Tanzania',formTo:'',btn:'Send message'},{bg:'alt'});
  const footer=()=>mk('footer',{brand:C.n,text:C.h[1].slice(0,70),copy:'© 2026 '+C.n+'. All rights reserved.'},{bg:v===2||v===4?'primary':'dark'});
  const mid=(gk)=>{const k=C.k;if(k==='menu')return mk('menu',{title:'Our menu',sub:'Fresh, made to order.',items:C.it.map(x=>({name:x[0],desc:x[1],price:x[2]}))},{bg:'bg'});
    if(k==='pricing')return mk('pricing',{eyebrow:'PRICING',title:'Simple, clear prices',sub:'Pick what suits you.',items:C.it.map((x,i)=>({name:x[0],price:x[1],per:x[2],features:x[3],btn:'Choose '+x[0],btnLink:'page:contact',hl:i===1}))},{bg:'bg'});
    if(k==='team')return mk('team',{title:'Meet the team',items:C.it.map((x,i)=>({name:x[0],role:x[1],photo:`art:person:${sd+10+i}`}))},{bg:'bg'});
    if(k==='steps')return mk('steps',{eyebrow:'HOW IT WORKS',title:'Simple from start to finish',items:C.it.map(x=>({title:x[0],text:x[1]}))},{bg:'bg'});
    const g=gal(gk||'grid',gk==='mosaic'?8:gk==='strip'?4:6);g.d.title='Gallery';return g};
  const P=(title,sl,blocks)=>({id:uid(),title,slug:sl,desc:'',blocks});
  const isG=C.k==='gallery';
  let home,second;
  if(v===0){home=[nav(),hero(),cards(false),about(false,false),mid('grid'),stats(),quotes(),cta(),footer()];
    second=P('About','about',[nav(),about(true,false),C.k==='team'?mid():feats(),gal('masonry',6),stats(),footer()])}
  else if(v===1){home=[nav(),hero(),feats(),cards(true),isG?null:gal('mosaic',8),mid('mosaic'),stats(),quotes(),faq(),cta(),footer()].filter(Boolean);second=null}
  else if(v===2){home=[nav(),hero(),feats(),about(true,true),isG?null:gal('mosaic',8),mid('mosaic'),stats(),quotes(),cta(),footer()].filter(Boolean);second=P('More','more',[nav(),cards(false),faq(),footer()])}
  else if(v===3){home=[nav(),hero(),gal('strip',4),mk('text',{title:C.ab[0],text:C.ab[1]},{v:'narrow',bg:'bg'}),cards(true),mid('masonry'),quotes(),cta(),footer()];second=null}
  else{home=[nav(),hero(),feats(),about(true,true),cards(false),mid('masonry'),isG?null:gal('masonry',6),quotes(),cta(),footer()].filter(Boolean);second=P('About','about',[nav(),about(false,true),stats(),faq(),footer()])}
  const pages=[P('Home','index',home)];if(second)pages.push(second);pages.push(P('Contact','contact',[nav(),contact(),v===0||v===4?faq():null,footer()].filter(Boolean)));
  pages.forEach(p=>p.blocks.forEach(b=>{if(b.type==='gallery'&&!b.d.title)delete b.d.title}));
  return {v:1,type:'site',id:uid(),name:C.n,desc:C.h[1],theme:th,pages}}
const TEMPLATES=[];CATS.forEach((C,ci)=>LOOKS.forEach((L0,v)=>TEMPLATES.push({id:C.id+'-'+L0.toLowerCase(),name:C.tag+' · '+L0,group:C.g,ci,v,words:(C.tag+' '+C.g+' '+C.n+' '+L0).toLowerCase()})));

/* ---------- hand-designed templates (added in batches: site-tpl-b01.js, b02 ...) ----------
   Each one has its own palette, fonts, layout and copy. Write them with the short helpers below. */
const BESPOKE=[];
const a_=(scene,seed)=>`art:${scene}:${seed}`;
const B_={
 nav:(logo,btn,v='left',link='page:contact')=>['nav',{logo,btn,btnLink:link},{v,bg:'bg'}],
 hero:(v,eyebrow,title,sub,btn,btn2,imgs=[],bg='bg')=>['hero',{eyebrow,title,sub,btn,btnLink:'page:contact',btn2:btn2||'',btn2Link:'',img:imgs[0]||'',img2:imgs[1]||'',img3:imgs[2]||''},{v,bg}],
 feats:(eyebrow,title,sub,items,v='cards',bg='bg')=>['features',{eyebrow,title,sub,items:items.map(([icon,title,text])=>({icon,title,text}))},{v,bg}],
 split:(v,eyebrow,title,text,btn,img,bg='bg',link='page:contact')=>['split',{eyebrow,title,text,btn,btnLink:link,img},{v,bg}],
 gal:(v,title,imgs,bg='bg')=>['gallery',title?{title,items:imgs.map(img=>({img}))}:{items:imgs.map(img=>({img}))},{v,bg}],
 stats:(items,bg='primary')=>['stats',{items:items.map(([num,label])=>({num,label}))},{bg}],
 quotes:(title,items,bg='alt')=>['testimonials',{title,items:items.map(([quote,name,role])=>({quote,name,role}))},{bg}],
 price:(eyebrow,title,sub,items,bg='bg')=>['pricing',{eyebrow,title,sub,items:items.map(([name,price,per,features,hl])=>({name,price,per,features,btn:'Choose '+name,btnLink:'page:contact',hl:!!hl}))},{bg}],
 faq:(title,items,bg='bg')=>['faq',{title,items:items.map(([q,a])=>({q,a}))},{bg}],
 cta:(title,sub,btn,bg='primary')=>['cta',{title,sub,btn,btnLink:'page:contact'},{bg}],
 contact:(title,sub,email,phone,address,btn='Send message',bg='alt')=>['contact',{title,sub,email,phone,address,formTo:'',btn},{bg}],
 footer:(brand,text,bg='dark')=>['footer',{brand,text,copy:'© 2026 '+brand+'. All rights reserved.'},{bg}],
 team:(title,items,bg='bg')=>['team',{title,items:items.map(([name,role,seed])=>({name,role,photo:a_('person',seed)}))},{bg}],
 cards:(v,eyebrow,title,sub,items,bg='bg')=>['cards',{eyebrow,title,sub,items:items.map(([img,title,text])=>({img,title,text}))},{v,bg}],
 menu:(title,sub,items,bg='bg')=>['menu',{title,sub,items:items.map(([name,desc,price])=>({name,desc,price}))},{bg}],
 steps:(eyebrow,title,items,bg='bg')=>['steps',{eyebrow,title,items:items.map(([title,text])=>({title,text}))},{bg}],
 text:(title,text,v='narrow',bg='bg')=>['text',{title,text},{v,bg}],
 logos:(title,names,bg='bg')=>['logos',{title,items:names.map(name=>({name}))},{bg}],
 blog:(title,sub,items,v='cards',bg='bg')=>['blog',{title,sub,items:items.map(([title,date,text])=>({title,date,text}))},{v,bg}],
 wa:(title,sub,btn,phone,msg,bg='alt')=>['whatsapp',{title,sub,btn,phone,msg},{bg}],
 pg:(title,slug,blocks)=>[title,slug,blocks]};
function addBespoke(spec){spec.b=BESPOKE.length;BESPOKE.push(spec);TEMPLATES.push({id:spec.id,name:spec.tag+' · '+spec.name,group:spec.g,b:spec.b,v:-1,words:(spec.tag+' '+spec.g+' '+spec.name+' '+(spec.kw||'')).toLowerCase()})}
function buildBespoke(spec){const mk=(type,d,over={})=>{const b=mkBlock(type);b.d=Object.assign({},b.d,d);Object.assign(b,over);return b};
  const pages=spec.pages.map(([title,slug,blocks])=>({id:uid(),title,slug,desc:'',blocks:blocks.map(([type,d,o])=>mk(type,d,o))}));
  pages.forEach(p=>p.blocks.forEach(b=>{if(b.type==='gallery'&&!b.d.title)delete b.d.title}));
  return {v:1,type:'site',id:uid(),name:spec.name,desc:spec.desc||'',theme:Object.assign({radius:14},spec.th),pages}}
const buildSiteTemplate=t=>t.b!=null?buildBespoke(BESPOKE[t.b]):buildCategorySite(t.ci,t.v);
