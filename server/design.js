/* Design Studio server parts: stock photo search (Unsplash / Pixabay through this server so keys stay private), the cached
   background-remover files, and share links for finished designs. */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { DATA, effective } from './config.js';
import { json, readBody, readJson, httpError, clientIp } from './util.js';
import * as mail from './mail.js';
import { llmChat } from './chat.js';
import { isOwner } from './team.js';

/* ---------- background remover files: fetched once, then served from the data folder ---------- */
const BG = path.join(DATA, 'bgdata');
const ORT = process.env.BG_ORT_BASE ? [process.env.BG_ORT_BASE.replace(/\/*$/, '/')] : ['https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.3/dist/', 'https://unpkg.com/onnxruntime-web@1.17.3/dist/'];
const PEXELS = (process.env.PEXELS_API_BASE || 'https://api.pexels.com/v1').replace(/\/+$/, ''), UNSPLASH = (process.env.UNSPLASH_API_BASE || 'https://api.unsplash.com').replace(/\/+$/, '');
const BGSRC = {
  'ort.min.js': [ORT.map((b) => b + 'ort.min.js'), 'application/javascript', 2e6],
  'ort-wasm.wasm': [ORT.map((b) => b + 'ort-wasm.wasm'), 'application/wasm', 2e7],
  'ort-wasm-simd.wasm': [ORT.map((b) => b + 'ort-wasm-simd.wasm'), 'application/wasm', 2e7],
  'u2netp.onnx': [[process.env.BG_MODEL_URL, 'https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx'].filter(Boolean), 'application/octet-stream', 3e7]
};
const pending = new Map();
async function ensureBg(name) {
  const f = path.join(BG, name);
  try { await fsp.access(f); return f; } catch {}
  if (pending.has(name)) return pending.get(name);
  const [urls, , max] = BGSRC[name];
  const job = (async () => {
    let last = 'no address'; let buf = null;
    for (const url of urls) {
      try { const r = await fetch(url, { signal: AbortSignal.timeout(120000), redirect: 'follow' }); if (!r.ok) { last = 'HTTP ' + r.status; continue; } const b = Buffer.from(await r.arrayBuffer()); if (b.length < 1000 || b.length > max) { last = 'unexpected file'; continue; } buf = b; break; }
      catch (e) { last = String((e && e.cause && e.cause.code) || (e && e.message) || e); }
    }
    if (!buf) throw httpError(502, 'Could not download the background remover (' + last + '). Check this server can reach the internet, then try again.');
    await fsp.mkdir(BG, { recursive: true }); const tmp = f + '.' + process.pid + '.tmp'; await fsp.writeFile(tmp, buf); await fsp.rename(tmp, f); return f;
  })().finally(() => pending.delete(name));
  pending.set(name, job); return job;
}

/* ---------- stock photos: Unsplash and Pixabay (free keys) ---------- */
const UA = 'AnandsOS-DesignStudio/1.0 (self-hosted; https://github.com/anandnms2/anands-os)';
const PIXABAY = (process.env.PIXABAY_API_BASE || 'https://pixabay.com/api').replace(/\/+$/, '');
const hostOk = (h) => HOSTS.has(h);
const HOSTS = new Set(['images.unsplash.com', 'plus.unsplash.com', 'pixabay.com', 'cdn.pixabay.com']);
const clip = (v, n) => String(v == null ? '' : v).slice(0, n);
const plain = (h, n) => clip(String(h || '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim(), n);
export const stockStatus = () => { const k = effective().stock || {}; return { unsplash: !!k.unsplash, pixabay: !!k.pixabay }; };
async function getJson(name, url, headers, fetcher) {
  let r; try { r = await fetcher(url, { headers: { 'user-agent': UA, accept: 'application/json', ...headers }, signal: AbortSignal.timeout(15000) }); } catch { throw httpError(502, 'Could not reach ' + name + '. Check this server can reach the internet.'); }
  if (r.status === 401 || r.status === 403) throw httpError(502, name + ' did not accept that key');
  if (r.status === 429) throw httpError(502, name + ' is limiting requests right now. Try again in a minute.');
  if (!r.ok) throw httpError(502, name + ' is not answering (' + r.status + ')');
  try { return await r.json(); } catch { throw httpError(502, name + ' sent something unexpected'); }
}
const needKey = (n) => httpError(400, 'Add a ' + n + ' key in Settings to search it', 'no_key');
export async function stockSearch(q, page, source, fetcher = fetch, kind0 = '') {
  const k = effective().stock || {}; q = clip(q, 100).trim(); page = Math.max(1, Math.min(50, parseInt(page, 10) || 1));
  const want = ['unsplash', 'pixabay'].includes(source) ? source : (k.unsplash ? 'unsplash' : k.pixabay ? 'pixabay' : 'unsplash');
  const enc = encodeURIComponent;
  if (want === 'unsplash') {
    if (!k.unsplash) throw needKey('Unsplash');
    const j = await getJson('Unsplash', q ? UNSPLASH + '/search/photos?per_page=24&page=' + page + '&query=' + enc(q) : UNSPLASH + '/photos?per_page=24&page=' + page, { authorization: 'Client-ID ' + k.unsplash, 'accept-version': 'v1' }, fetcher); const list = Array.isArray(j) ? j : (j.results || []);
    return { source: want, page, items: list.map((p) => ({ id: 'us' + p.id, thumb: p.urls && p.urls.small, full: p.urls && p.urls.regular, w: p.width, h: p.height, by: clip(p.user && p.user.name, 80), link: clip(p.links && p.links.html, 300), alt: clip(p.alt_description, 120), dl: clip(p.links && p.links.download_location, 300), lic: 'Unsplash license' })).filter((x) => x.thumb && x.full) };
  }
  if (want === 'pixabay') {
    if (!k.pixabay) throw needKey('Pixabay');
    const j = await getJson('Pixabay', PIXABAY + '/?key=' + enc(k.pixabay) + '&image_type=photo&safesearch=true&per_page=24&page=' + page + (q ? '&q=' + enc(q) : ''), {}, fetcher);
    return { source: want, page, items: (j.hits || []).map((p) => ({ id: 'pb' + p.id, thumb: p.webformatURL, full: p.largeImageURL || p.webformatURL, w: p.imageWidth, h: p.imageHeight, by: clip(p.user, 80), link: clip(p.pageURL, 300), alt: clip(p.tags, 120), lic: 'Pixabay license' })).filter((x) => x.thumb && x.full) };
  }
  throw httpError(400, 'Unknown photo source');
}
async function stockImage(res, u) {
  let t; try { t = new URL(u); } catch { throw httpError(400, 'Bad address'); }
  let r = null;
  for (let hop = 0; hop < 4; hop++) {
    if (t.protocol !== 'https:' || !hostOk(t.hostname)) throw httpError(400, 'That address is not a stock photo');
    try { r = await fetch(t, { redirect: 'manual', headers: { 'user-agent': UA }, signal: AbortSignal.timeout(20000) }); } catch { throw httpError(502, 'The photo could not be loaded'); }
    if (r.status >= 300 && r.status < 400 && r.headers.get('location')) { try { t = new URL(r.headers.get('location'), t); } catch { throw httpError(502, 'The photo could not be loaded'); } continue; }
    break;
  }
  if (!r || !r.ok) throw httpError(502, 'The photo could not be loaded');
  const type = String(r.headers.get('content-type') || ''); if (!/^image\/(jpeg|png|webp)/.test(type)) throw httpError(502, 'Unexpected file type');
  const buf = Buffer.from(await r.arrayBuffer()); if (buf.length > 20e6) throw httpError(413, 'Photo is too large');
  res.writeHead(200, { 'content-type': type.split(';')[0], 'content-length': buf.length, 'cache-control': 'private, max-age=86400' }); res.end(buf);
}

const FONTC = new Map();
async function fontFile(res, fam, w, it) {
  if (!/^[A-Za-z0-9][A-Za-z0-9 ]{0,59}$/.test(fam)) throw httpError(400, 'Bad font name');
  w = Math.max(100, Math.min(900, Math.round((+w || 400) / 100) * 100)); const key = fam + '|' + w + '|' + (it ? 1 : 0);
  let buf = FONTC.get(key);
  if (!buf) {
    const spec = it ? 'ital,wght@1,' + w : 'wght@' + w, q = (sp) => 'https://fonts.googleapis.com/css2?family=' + fam.replace(/ /g, '+') + ':' + sp;
    let css = '';
    for (const sp of [spec, 'wght@' + w, '']) {
      if (sp === '' && w !== 400) break;
      try { const r = await fetch(sp ? q(sp) : 'https://fonts.googleapis.com/css2?family=' + fam.replace(/ /g, '+'), { headers: { 'user-agent': 'curl/8.4.0' }, signal: AbortSignal.timeout(15000) }); if (r.ok) { css = await r.text(); break; } } catch { throw httpError(502, 'Fonts could not be reached'); }
      if (it && sp === spec) it = false;
    }
    const m = /url\((https:\/\/fonts\.gstatic\.com\/[^)\s]+?\.ttf)\)/.exec(css); if (!m) throw httpError(404, 'Font not found');
    let r; try { r = await fetch(m[1], { headers: { 'user-agent': 'curl/8.4.0' }, signal: AbortSignal.timeout(30000) }); } catch { throw httpError(502, 'Fonts could not be reached'); }
    if (!r.ok) throw httpError(502, 'Font could not be loaded');
    buf = Buffer.from(await r.arrayBuffer()); if (buf.length > 15e6 || buf.length < 100) throw httpError(502, 'Unexpected font file');
    if (FONTC.size >= 60) FONTC.delete(FONTC.keys().next().value); FONTC.set(key, buf);
  }
  res.writeHead(200, { 'content-type': 'font/ttf', 'content-length': buf.length, 'cache-control': 'private, max-age=604800' }); res.end(buf);
}

/* ---------- share links ---------- */
const SF = path.join(DATA, 'design-shares'), SI = path.join(DATA, 'design-shares.json');
const EXT = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', pdf: 'application/pdf', svg: 'image/svg+xml', gif: 'image/gif', mp4: 'video/mp4', webm: 'video/webm' };
const readIdx = () => { try { return JSON.parse(fs.readFileSync(SI, 'utf8')) || {}; } catch { return {}; } };
const writeIdx = (o) => { fs.mkdirSync(path.dirname(SI), { recursive: true }); const t = SI + '.tmp'; fs.writeFileSync(t, JSON.stringify(o), { mode: 0o600 }); fs.renameSync(t, SI); };
const who = (s) => (isOwner(s) ? 'owner' : 'm' + s.mid);
async function sweep(idx) { let ch = false; for (const [t, v] of Object.entries(idx)) if (v.exp && v.exp < Date.now()) { delete idx[t]; ch = true; try { await fsp.rm(path.join(SF, t)); } catch {} } if (ch) writeIdx(idx); return idx; }
export async function publicShare(req, res, p) {
  const t = p.slice(3).split('/')[0].replace(/[^A-Za-z0-9_-]/g, ''); const idx = await sweep(readIdx()); const e = idx[t];
  if (!t || t.length < 20 || !e) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); return res.end('This link has expired or was removed.'); }
  let st; try { st = await fsp.stat(path.join(SF, t)); } catch { res.writeHead(404, { 'content-type': 'text/plain' }); return res.end('Not found'); }
  const type = EXT[e.ext] || 'application/octet-stream', dl = /^(1|true)$/.test(new URL(req.url, 'http://x').searchParams.get('dl') || '');
  res.writeHead(200, { 'content-type': type, 'content-length': st.size, 'content-disposition': (dl ? 'attachment' : 'inline') + '; filename="' + e.name.replace(/[^\w.\- ]/g, '_') + '.' + e.ext + '"', 'x-content-type-options': 'nosniff', 'cache-control': 'no-store', 'referrer-policy': 'no-referrer', 'content-security-policy': "default-src 'none'; img-src 'self' data:; media-src 'self'; style-src 'unsafe-inline'; sandbox" });
  if (req.method === 'HEAD') return res.end(); fs.createReadStream(path.join(SF, t)).on('error', () => res.destroy()).pipe(res);
}


/* ---------- review links: a public page where reviewers pin comments on a design ---------- */
const RF = path.join(DATA, 'design-reviews');
const RT = (t) => String(t || '').replace(/[^A-Za-z0-9_-]/g, '');
const rFile = (t) => path.join(RF, RT(t) + '.json');
const readRev = (t) => { try { const j = JSON.parse(fs.readFileSync(rFile(t), 'utf8')); return j && (!j.exp || j.exp > Date.now()) ? j : null; } catch { return null; } };
const writeRev = (t, j) => { fs.mkdirSync(RF, { recursive: true, mode: 0o700 }); const f = rFile(t); fs.writeFileSync(f + '.tmp', JSON.stringify(j), { mode: 0o600 }); fs.renameSync(f + '.tmp', f); };
const revHits = new Map();
const REVIEW_PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Design review</title><style>
:root{color-scheme:light dark;--bg:#f6f3ee;--fg:#1f1c19;--card:#fff;--line:#ddd6cc;--acc:#e8590c}@media(prefers-color-scheme:dark){:root{--bg:#1a1816;--fg:#f3efe8;--card:#26231f;--line:#3a3631}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.45 system-ui,sans-serif}header{padding:14px 16px;border-bottom:1px solid var(--line);display:flex;gap:12px;align-items:center;flex-wrap:wrap}h1{font-size:17px;margin:0;flex:1}
main{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:16px;padding:16px;max-width:1200px;margin:0 auto}@media(max-width:820px){main{grid-template-columns:1fr}}
.pg{position:relative;margin:0 0 18px;background:var(--card);border:1px solid var(--line);border-radius:10px;overflow:hidden}.pg img{display:block;width:100%;height:auto;cursor:crosshair}
.pin{position:absolute;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;background:#f59f00;color:#fff;font-weight:700;display:grid;place-items:center;border:2px solid #fff;box-shadow:0 1px 6px #0004;font-size:12px}.pin.done{background:#868e96}
aside{position:sticky;top:12px;align-self:start;display:grid;gap:10px}.c{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:8px 10px;font-size:14px}.c small{opacity:.65;display:block}
input,textarea,button{font:inherit;color:inherit;background:var(--card);border:1px solid var(--line);border-radius:8px;padding:8px 10px;width:100%}button{background:var(--acc);color:#fff;border:0;cursor:pointer;font-weight:600}
.note{opacity:.7;font-size:13px}#form{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);width:min(420px,92vw);background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px;display:grid;gap:8px;box-shadow:0 8px 30px #0005}[hidden]{display:none!important}
</style></head><body><header><h1 id="t">Design review</h1><span class="note">Click on the design to leave a comment.</span></header><main><div id="pages"></div><aside><div id="list"></div></aside></main>
<div id="form" hidden role="dialog" aria-label="Add a comment"><input id="nm" placeholder="Your name" maxlength="40" aria-label="Your name"><textarea id="tx" rows="3" maxlength="600" placeholder="Your comment" aria-label="Comment"></textarea><div style="display:flex;gap:8px"><button id="ok">Add comment</button><button id="no" style="background:#868e96">Cancel</button></div></div>
<script>
(()=>{const T=location.pathname.split('/')[2];let data=null,at=null;const $=s=>document.querySelector(s);
const load=async()=>{const r=await fetch('/r/'+T+'/data');if(!r.ok){document.body.textContent='This review link has expired or was removed.';return}data=await r.json();draw()};
const draw=()=>{$('#t').textContent=data.name;const P=$('#pages');P.innerHTML='';data.pages.forEach((src,i)=>{const d=document.createElement('div');d.className='pg';const im=new Image();im.src=src;im.alt='Page '+(i+1);im.onclick=e=>{const r=im.getBoundingClientRect();at={page:i,x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height};$('#form').hidden=false;try{$('#nm').value=localStorage.getItem('rv.name')||''}catch(x){}($('#nm').value?$('#tx'):$('#nm')).focus()};d.append(im);
 data.comments.filter(c=>c.page===i).forEach(c=>{const n=data.comments.indexOf(c)+1;const p=document.createElement('div');p.className='pin'+(c.done?' done':'');p.style.left=c.x*100+'%';p.style.top=c.y*100+'%';p.textContent=n;p.title=c.text;d.append(p)});P.append(d)});
 const L=$('#list');L.innerHTML='';if(!data.comments.length){const n=document.createElement('p');n.className='note';n.textContent='No comments yet.';L.append(n)}data.comments.forEach((c,i)=>{const d=document.createElement('div');d.className='c';const b=document.createElement('b');b.textContent=(i+1)+'. '+(c.by||'Reviewer');const t=document.createElement('div');t.textContent=c.text;const s=document.createElement('small');s.textContent='Page '+(c.page+1)+' · '+new Date(c.ts).toLocaleString()+(c.done?' · resolved':'');d.append(b,t,s);L.append(d)})};
$('#no').onclick=()=>{$('#form').hidden=true};
$('#ok').onclick=async()=>{const text=$('#tx').value.trim(),by=$('#nm').value.trim()||'Reviewer';if(!text||!at)return;try{localStorage.setItem('rv.name',by)}catch(x){}const r=await fetch('/r/'+T+'/comment',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...at,text,by})});if(r.ok){$('#tx').value='';$('#form').hidden=true;load()}else alert((await r.json().catch(()=>({}))).error||'Could not add the comment')};
load();setInterval(load,30000)})();
</script></body></html>`;
export async function publicReview(req, res, p) {
  const parts = p.split('/'), t = RT(parts[2]), sub = parts[3] || '';
  const gone = () => { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); return res.end('This review link has expired or was removed.'); };
  if (!t || t.length < 20) return gone();
  const j = readRev(t); if (!j) return gone();
  const sec = { 'x-content-type-options': 'nosniff', 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' };
  if (!sub && (req.method === 'GET' || req.method === 'HEAD')) { res.writeHead(200, { ...sec, 'content-type': 'text/html; charset=utf-8', 'content-security-policy': "default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'" }); return res.end(req.method === 'HEAD' ? undefined : REVIEW_PAGE); }
  if (sub === 'data' && req.method === 'GET') return json(res, 200, { name: j.name, pages: j.pages, comments: j.comments });
  if (sub === 'comment' && req.method === 'POST') {
    const now = Date.now(), a = (revHits.get(t) || []).filter((x) => now - x < 600000); if (a.length >= 30) throw httpError(429, 'Too many comments. Try again in a few minutes.'); a.push(now); revHits.set(t, a);
    const b = await readJson(req, 8192); const text = String(b.text || '').trim().slice(0, 600); if (!text) throw httpError(400, 'Write a comment first');
    if (j.comments.length >= 200) throw httpError(400, 'This review has reached its comment limit');
    const num = (v) => Math.max(0, Math.min(1, Number(v) || 0));
    j.comments.push({ id: crypto.randomBytes(6).toString('hex'), page: Math.max(0, Math.min(j.pages.length - 1, parseInt(b.page, 10) || 0)), x: num(b.x), y: num(b.y), text, by: String(b.by || 'Reviewer').trim().slice(0, 40) || 'Reviewer', ts: now, done: false }); writeRev(t, j);
    return json(res, 200, { ok: true });
  }
  throw httpError(404, 'Not found');
}


/* ---------- published pages (Docs and Websites): static, script-free, public by link ---------- */
const WF = path.join(DATA, 'design-sites');
const wFile = (t) => path.join(WF, RT(t) + '.json');
const readSite = (t) => { try { return JSON.parse(fs.readFileSync(wFile(t), 'utf8')); } catch { return null; } };
/* ---------- website contact forms: stored for the site's owner, optionally mailed to them ---------- */
const FF = path.join(DATA, 'design-forms'); const formHits = new Map(); const mailDay = new Map();
const VS = path.join(DATA, 'design-visits'); const sFile = (t) => path.join(VS, RT(t) + '.json'); const seenDay = new Map();
const readStats = (t) => { try { return JSON.parse(fs.readFileSync(sFile(t), 'utf8')); } catch { return { days: {} }; } };
function countVisit(req, t, slug) { const ua = String(req.headers['user-agent'] || ''); if (!ua || /bot|crawl|spider|slurp|preview|monitor|curl|wget/i.test(ua)) return; try { const day = new Date().toISOString().slice(0, 10), st = readStats(t), d = st.days[day] || (st.days[day] = { views: 0, uniq: 0, pages: {} }); const k = day + '|' + t + '|' + crypto.createHash('sha256').update(clientIp(req) + ua + day).digest('hex').slice(0, 16); d.views++; d.pages[slug] = (d.pages[slug] || 0) + 1; if (!seenDay.has(k)) { seenDay.set(k, 1); d.uniq++; if (seenDay.size > 50000) seenDay.clear(); } const keep = Object.keys(st.days).sort().slice(-90); st.days = Object.fromEntries(keep.map((x) => [x, st.days[x]])); fs.mkdirSync(VS, { recursive: true, mode: 0o700 }); fs.writeFileSync(sFile(t) + '.tmp', JSON.stringify(st), { mode: 0o600 }); fs.renameSync(sFile(t) + '.tmp', sFile(t)); } catch {} }
const fFile = (t) => path.join(FF, RT(t) + '.json');
const readForms = (t) => { try { return JSON.parse(fs.readFileSync(fFile(t), 'utf8')); } catch { return []; } };
const escH = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const thanks = (res, code, msg, back) => { res.writeHead(code, { 'content-type': 'text/html; charset=utf-8', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', 'cache-control': 'no-store', 'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'" }); res.end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Message</title><body style="font:18px system-ui;display:grid;place-items:center;min-height:90vh;text-align:center;padding:20px"><div><h1 style="margin:0 0 8px">' + escH(msg) + '</h1><p><a href="' + escH(back) + '">Back to the website</a></p></div>'); };
async function receiveForm(req, res, t) {
  const j = readSite(t); const back = req.headers.referer && /^https?:\/\//.test(req.headers.referer) ? '.' : '.';
  if (!j || !j.forms) return thanks(res, 404, 'This form is not available.', back);
  const ip = clientIp(req), key = ip + '|' + t, now = Date.now(); const a = (formHits.get(key) || []).filter((x) => now - x < 600000); if (a.length >= 5) return thanks(res, 429, 'Too many messages. Please try again in a few minutes.', back); a.push(now); formHits.set(key, a);
  let body; try { body = (await readBody(req, 16 * 1024)).toString('utf8'); } catch { return thanks(res, 413, 'That message is too long.', back); }
  const q = new URLSearchParams(body); if (q.get('website')) return thanks(res, 200, 'Thank you. Your message was sent.', back); // honeypot
  const m = { id: crypto.randomBytes(6).toString('hex'), at: now, name: clip(q.get('name'), 120).trim(), email: clip(q.get('email'), 200).trim(), message: clip(q.get('message'), 4000).trim() };
  if (!m.message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email)) return thanks(res, 400, 'Please fill in your email and a message.', back);
  fs.mkdirSync(FF, { recursive: true, mode: 0o700 }); const all = readForms(t); if (all.length >= 500) all.shift(); all.push(m); fs.writeFileSync(fFile(t) + '.tmp', JSON.stringify(all), { mode: 0o600 }); fs.renameSync(fFile(t) + '.tmp', fFile(t));
  const to = clip(j.formTo, 200); const day = t + '|' + new Date().toISOString().slice(0, 10); const sent = mailDay.get(day) || 0;
  if (to && /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(to) && sent < 20) { try { if (mail.configured()) { mailDay.set(day, sent + 1); await mail.sendMail({ to: [to], subject: 'New message from your website: ' + clip(j.name, 60), text: 'From: ' + m.name + ' <' + m.email + '>\n\n' + m.message + '\n\n(Sent through your Anands Design Studio website.)', replyTo: m.email }); } } catch {} }
  return thanks(res, 200, 'Thank you. Your message was sent.', back);
}
export async function publicSite(req, res, p) {
  const parts = p.split('/'), t = RT(parts[2]);
  if (req.method === 'POST' && parts[3] === '_form' && t && t.length >= 20) return receiveForm(req, res, t);
  const  slug = String(parts[3] || 'index').toLowerCase().replace(/\.html$/, '').replace(/[^a-z0-9-]/g, '');
  const gone = () => { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); return res.end('This page is not published.'); };
  if (!t || t.length < 20 || (req.method !== 'GET' && req.method !== 'HEAD')) return gone();
  const j = readSite(t); if (!j) return gone(); const html = j.pages[slug] || (slug === 'index' ? Object.values(j.pages)[0] : null); if (!html) return gone();
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', 'cache-control': 'no-cache', 'x-frame-options': 'DENY',
    'content-security-policy': "default-src 'none'; script-src 'none'; img-src data: https:; media-src data: https:; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com data:; frame-src https://www.youtube-nocookie.com https://player.vimeo.com; form-action 'self' https: mailto:; base-uri 'none'; frame-ancestors 'none'" });
  if (req.method === 'GET') countVisit(req, t, slug);
  res.end(req.method === 'HEAD' ? undefined : html);
}


/* ---------- AI text (Magic Write) and speech to text: the built-in AI gateway by default, or your own Anthropic key ---------- */
const aiHits = new Map();
function aiLimit(who) { const now = Date.now(), a = (aiHits.get(who) || []).filter((t) => now - t < 600000); if (a.length >= 60) throw httpError(429, 'Too many AI requests. Try again in a few minutes.', 'rate_limited'); a.push(now); aiHits.set(who, a); }
export function aiProvider() {
  const e = effective(), a = e.ai || {}, hasGw = !!(e.llm && e.llm.base), hasG = !!a.geminiKey, hasAn = !!a.key;
  const want = a.provider || 'auto'; const has = { builtin: hasGw, gemini: hasG, anthropic: hasAn };
  const use = want === 'auto' ? (hasGw ? 'builtin' : hasG ? 'gemini' : hasAn ? 'anthropic' : '') : (has[want] ? want : '');
  const model = use === 'anthropic' ? a.model : use === 'gemini' ? a.geminiModel : use === 'builtin' ? e.llm.model : '';
  return { provider: use, want, ready: !!use, model, reason: use ? '' : want === 'anthropic' ? 'Add your Anthropic key in Settings › AI for Design Studio' : want === 'gemini' ? 'Add your Gemini key in Settings › AI for Design Studio' : 'Connect your AI in Settings › Assistant, or add a Gemini or Anthropic key in Settings › AI for Design Studio' };
}
const GEM = () => (process.env.GEMINI_API_BASE || 'https://generativelanguage.googleapis.com').replace(/\/+$/, '');
async function gemini(model, body, fetcher = fetch, ms = 90000) {
  const a = effective().ai; let r;
  try { r = await fetcher(GEM() + '/v1beta/models/' + encodeURIComponent(model) + ':generateContent', { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': a.geminiKey }, body: JSON.stringify(body), signal: AbortSignal.timeout(ms) }); } catch { throw httpError(502, 'Could not reach Gemini. Check this server can reach the internet.'); }
  if (r.status === 400 || r.status === 401 || r.status === 403) { let m = ''; try { m = (await r.json()).error?.message || ''; } catch {} throw httpError(502, 'Gemini did not accept that' + (m ? ': ' + clip(m, 160) : ' (key or request)')); }
  if (r.status === 429) throw httpError(502, 'Gemini’s free limit is reached for now. Try again in a minute, or tomorrow.');
  if (!r.ok) throw httpError(502, 'Gemini could not answer (' + r.status + ')');
  return r.json();
}
const gemText = (j) => ((j.candidates || [])[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
export async function aiText(system, user, { maxTokens = 1200, fetcher = fetch } = {}) {
  const st = aiProvider(); if (!st.ready) throw httpError(400, st.reason, 'no_ai');
  if (st.provider === 'builtin') { const r = await llmChat([{ role: 'system', content: system }, { role: 'user', content: user }], { temperature: 0.7, max_tokens: maxTokens }); return { text: String(r.text || '').trim(), provider: 'builtin', model: r.model }; }
  if (st.provider === 'gemini') { const j = await gemini(effective().ai.geminiModel, { systemInstruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts: [{ text: user }] }], generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 } }, fetcher); const text = gemText(j); if (!text) throw httpError(502, 'Gemini sent an empty answer'); return { text, provider: 'gemini', model: effective().ai.geminiModel }; }
  const a = effective().ai; let r;
  try { r = await fetcher((process.env.ANTHROPIC_API_BASE || 'https://api.anthropic.com') + '/v1/messages', { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': a.key, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: a.model, max_tokens: maxTokens, system, messages: [{ role: 'user', content: user }] }), signal: AbortSignal.timeout(60000) }); } catch { throw httpError(502, 'Could not reach Anthropic. Check this server can reach the internet.'); }
  if (r.status === 401 || r.status === 403) throw httpError(502, 'Anthropic did not accept the key'); if (r.status === 429) throw httpError(502, 'Anthropic is limiting requests right now. Try again in a minute.');
  if (!r.ok) { let m = ''; try { m = (await r.json()).error?.message || ''; } catch {} throw httpError(502, 'Anthropic could not answer' + (m ? ': ' + clip(m, 160) : ' (' + r.status + ')')); }
  const j = await r.json(); const text = (j.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('').trim(); if (!text) throw httpError(502, 'Anthropic sent an empty answer');
  return { text, provider: 'anthropic', model: j.model || a.model };
}
const AI_SYS = 'You help people make designs, documents and websites. Reply with only the requested text, no preface, no quotes, no markdown unless asked. Match the language of the input. Keep it natural and specific.';
const AI_TASKS = {
  write: (b) => ['Write ' + clip(b.kind || 'text', 40) + ' for this request. ' + (b.length ? 'Length: ' + clip(b.length, 40) + '. ' : '') + (b.tone ? 'Tone: ' + clip(b.tone, 40) + '.' : ''), clip(b.prompt, 2000)],
  rewrite: (b) => ['Rewrite the text as instructed. Keep the meaning and facts. Instruction: ' + clip(b.instruction || 'improve the writing', 200), clip(b.text, 8000)],
  translate: (b) => ['Translate the text into ' + clip(b.language || 'English', 40) + '. Keep line breaks.', clip(b.text, 8000)],
  summarize: (b) => ['Summarize the text in a few short bullet points starting with "- ".', clip(b.text, 12000)],
  headline: (b) => ['Write 5 short headline options for the topic, one per line, no numbering.', clip(b.prompt || b.text, 1000)],
  json: (b) => ['You edit website copy. The user message has a JSON object of text fields. Return ONLY a JSON object with exactly the same keys, with the text rewritten for this request: ' + clip(b.instruction, 400) + '. Keep each value about the same length as the original unless asked. Do not add keys.', JSON.stringify(b.fields || {}).slice(0, 8000)]
};

/* ---------- routes under /_local ---------- */
/* ---------- AI images (Magic Edit, BG Generator): Pollinations (no key), any OpenAI-compatible endpoint, or Hugging Face ---------- */
const POLL = (process.env.POLLINATIONS_BASE || 'https://image.pollinations.ai').replace(/\/+$/, ''), HF = (process.env.HF_API_BASE || 'https://api-inference.huggingface.co').replace(/\/+$/, '');
export const imgProv = () => { const p = (effective().image || {}).provider || 'auto'; return p === 'auto' ? ((effective().ai || {}).geminiKey ? 'gemini' : 'pollinations') : p; };
export const imageStatus = () => { const i = effective().image || {}; const prov = imgProv(); const gk = !!(effective().ai || {}).geminiKey; const gw = !!(effective().llm || {}).base; const ok = prov === 'pollinations' || (prov === 'gemini' && gk) || (prov === 'openai' && !!i.url) || (prov === 'gateway' && gw) || (prov === 'huggingface' && !!i.key); return { provider: prov, ready: ok, edit: (prov === 'openai' && !!i.url) || (prov === 'gateway' && gw) || (prov === 'gemini' && gk), reason: ok ? '' : prov === 'openai' ? 'Add the image service address in Settings › Design Studio AI images' : prov === 'gateway' ? 'Connect your AI gateway in Settings › Assistant first' : prov === 'gemini' ? 'Add your Gemini key in Settings › AI for Design Studio' : 'Add a Hugging Face token in Settings › Design Studio AI images' }; };
const imgHits = new Map();
function imgLimit(who) { const now = Date.now(), a = (imgHits.get(who) || []).filter((t) => now - t < 600000); if (a.length >= 40) throw httpError(429, 'Too many AI image requests. Try again in a few minutes.', 'rate_limited'); a.push(now); imgHits.set(who, a); }
const dataUrl = (buf, type) => 'data:' + type + ';base64,' + buf.toString('base64');
const parseData = (d, max) => { const m = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(d || '')); if (!m) throw httpError(400, 'That image could not be read'); const b = Buffer.from(m[2], 'base64'); if (!b.length || b.length > max) throw httpError(400, 'That image is too large'); return { type: m[1], buf: b }; };
const safeHttps = (u) => { try { const x = new URL(u); if (x.protocol !== 'https:') return false; const h = x.hostname; if (/^(localhost|.*\.local|.*\.internal)$/i.test(h) || /^[\d.]+$/.test(h) || h.includes(':')) return false; return true; } catch { return false; } };
async function fetchImg(r, name) { if (!r.ok) { if (r.status === 401 || r.status === 403) throw httpError(502, name + ' did not accept the key'); if (r.status === 429) throw httpError(502, name + ' is limiting requests right now. Try again in a minute.'); let m = ''; try { m = (await r.json()).error?.message || ''; } catch {} throw httpError(502, name + ' could not make that image' + (m ? ': ' + clip(m, 160) : ' (' + r.status + ')')); } const type = (r.headers.get('content-type') || '').split(';')[0]; if (!/^image\/(png|jpeg|webp)$/.test(type)) throw httpError(502, name + ' sent something that is not an image'); const b = Buffer.from(await r.arrayBuffer()); if (b.length > 12e6) throw httpError(502, 'That image is too large'); return dataUrl(b, type); }
export async function imageGen(body, who, fetcher = fetch) {
  imgLimit(who);
  const i = effective().image || {}, st = imageStatus(), prov = imgProv(); if (!st.ready) throw httpError(400, st.reason, 'no_image_ai');
  const prompt = clip(body.prompt, 900).trim(); if (!prompt) throw httpError(400, 'Describe what you want first');
  const w = Math.max(256, Math.min(1536, Math.round((parseInt(body.w, 10) || 1024) / 64) * 64)), h = Math.max(256, Math.min(1536, Math.round((parseInt(body.h, 10) || 1024) / 64) * 64)), seed = parseInt(body.seed, 10) || Math.floor(Math.random() * 1e9);
  const edit = body.mode === 'edit';
  try {
    if (prov === 'pollinations') {
      if (edit) throw httpError(400, 'Pollinations makes new images but cannot edit one. Choose an OpenAI-compatible image service in Settings for true Magic Edit.', 'no_edit');
      const u = POLL + '/prompt/' + encodeURIComponent(prompt) + '?width=' + w + '&height=' + h + '&seed=' + seed + '&nologo=true&model=' + encodeURIComponent(i.model || 'flux') + '&private=true';
      const r = await fetcher(u, { headers: { 'user-agent': UA, ...(i.key ? { authorization: 'Bearer ' + i.key } : {}) }, signal: AbortSignal.timeout(90000) });
      return { image: await fetchImg(r, 'Pollinations'), provider: 'pollinations' };
    }
    if (prov === 'huggingface') {
      if (edit) throw httpError(400, 'Hugging Face text-to-image cannot edit an image. Choose an OpenAI-compatible image service for Magic Edit.', 'no_edit');
      const r = await fetcher(HF + '/models/' + (i.model || 'black-forest-labs/FLUX.1-schnell'), { method: 'POST', headers: { authorization: 'Bearer ' + i.key, 'content-type': 'application/json', accept: 'image/png', 'user-agent': UA }, body: JSON.stringify({ inputs: prompt, parameters: { width: w, height: h, seed } }), signal: AbortSignal.timeout(90000) });
      return { image: await fetchImg(r, 'Hugging Face'), provider: 'huggingface' };
    }
    if (prov === 'gemini') {
      const a = effective().ai, parts = [{ text: edit ? 'Edit the first image as described. If a second image is given it is a mask: change only the white area and keep everything else exactly the same. Description: ' + prompt : prompt + '. Aspect ratio ' + (Math.abs(w / h - 1) < .2 ? '1:1' : w > h ? '3:2' : '2:3') + '.' }];
      if (edit) { const im = parseData(body.image, 8e6), mk = body.mask ? parseData(body.mask, 8e6) : null; parts.push({ inlineData: { mimeType: im.type, data: im.buf.toString('base64') } }); if (mk) parts.push({ inlineData: { mimeType: mk.type, data: mk.buf.toString('base64') } }); }
      const j = await gemini(a.geminiImageModel || 'gemini-2.5-flash-image', { contents: [{ role: 'user', parts }], generationConfig: { responseModalities: ['IMAGE'] } }, fetcher, 120000);
      const pt = ((j.candidates || [])[0]?.content?.parts || []).find((x) => (x.inlineData || x.inline_data)); const idt = pt && (pt.inlineData || pt.inline_data); if (!idt) throw httpError(502, 'Gemini did not return a picture. Its free image limit may be used up, or the model name is wrong (Settings › AI for Design Studio).');
      const type = idt.mimeType || idt.mime_type || 'image/png'; if (!/^image\/(png|jpeg|webp)$/.test(type)) throw httpError(502, 'Gemini sent something that is not an image'); return { image: dataUrl(Buffer.from(idt.data, 'base64'), type), provider: 'gemini' };
    }
    // OpenAI-compatible
    const gwc = prov === 'gateway' ? effective().llm : null; const base = gwc ? (gwc.base.replace(/\/+$/, '').replace(/\/v1$/, '') + '/v1') : i.url, model = i.model || 'gpt-image-1', i_key = gwc ? gwc.key : i.key, size = Math.abs(w / h - 1) < .2 ? '1024x1024' : w > h ? '1536x1024' : '1024x1536';
    let r;
    if (edit) {
      const im = parseData(body.image, 8e6), mk = parseData(body.mask, 8e6), fd = new FormData();
      fd.append('model', model); fd.append('prompt', prompt); fd.append('size', size); fd.append('n', '1');
      fd.append('image', new Blob([im.buf], { type: im.type }), 'image.' + im.type.slice(6)); fd.append('mask', new Blob([mk.buf], { type: mk.type }), 'mask.' + mk.type.slice(6));
      r = await fetcher(base + '/images/edits', { method: 'POST', headers: { ...(i_key ? { authorization: 'Bearer ' + i_key } : {}), 'user-agent': UA }, body: fd, signal: AbortSignal.timeout(120000) });
    } else r = await fetcher(base + '/images/generations', { method: 'POST', headers: { ...(i_key ? { authorization: 'Bearer ' + i_key } : {}), 'content-type': 'application/json', 'user-agent': UA }, body: JSON.stringify({ model, prompt, size, n: 1 }), signal: AbortSignal.timeout(120000) });
    if (!r.ok) return { image: await fetchImg(r, 'The image service'), provider: 'openai' };
    const j = await r.json().catch(() => ({})), d = j && j.data && j.data[0];
    if (d && d.b64_json) return { image: dataUrl(Buffer.from(d.b64_json, 'base64'), 'image/png'), provider: 'openai' };
    if (d && d.url && safeHttps(d.url)) { const r2 = await fetcher(d.url, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(60000) }); return { image: await fetchImg(r2, 'The image service'), provider: 'openai' }; }
    throw httpError(502, 'The image service sent something unexpected');
  } catch (e) { if (e && e.status) throw e; throw httpError(502, 'Could not reach the image service'); }
}

export async function handleDesign(req, res, url, p, s) {
  if (p.startsWith('/bgdata/')) {
    if (req.method !== 'GET' && req.method !== 'HEAD') throw httpError(405, 'Method not allowed');
    const name = decodeURIComponent(p.slice(8)); if (!Object.prototype.hasOwnProperty.call(BGSRC, name)) throw httpError(404, 'Not found');
    const f = await ensureBg(name), st = await fsp.stat(f);
    res.writeHead(200, { 'content-type': BGSRC[name][1], 'content-length': st.size, 'cache-control': 'private, max-age=31536000, immutable' });
    if (req.method === 'HEAD') return res.end(); return fs.createReadStream(f).pipe(res);
  }
  if (p === '/design/font' && req.method === 'GET') return fontFile(res, url.searchParams.get('f') || '', url.searchParams.get('w'), url.searchParams.get('i') === '1');
  if (p === '/design/stockimg' && req.method === 'GET') return stockImage(res, url.searchParams.get('u') || '');
  if (req.method !== 'POST') throw httpError(405, 'Method not allowed');
  if (p === '/design/stockstatus') return json(res, 200, { ...stockStatus(), image: imageStatus() });
  if (p === '/design/genimage') { const b = await readJson(req, 20 * 1024 * 1024); return json(res, 200, await imageGen(b, who(s))); }
  if (p === '/design/stock') { const b = await readJson(req, 4096); return json(res, 200, await stockSearch(b.q, b.page, b.source, fetch, b.kind)); }
  if (p === '/design/stockuse') { const b = await readJson(req, 4096), k = effective().stock || {}; try { const u = new URL(b.dl); if (u.hostname === 'api.unsplash.com' && k.unsplash) await fetch(u, { headers: { authorization: 'Client-ID ' + k.unsplash }, signal: AbortSignal.timeout(8000) }); } catch {} return json(res, 200, { ok: true }); }
  if (p === '/design/share') {
    const q = url.searchParams, ext = String(q.get('ext') || '').toLowerCase(); if (!EXT[ext]) throw httpError(400, 'That file type cannot be shared');
    const days = Math.max(1, Math.min(365, parseInt(q.get('days'), 10) || 30)), body = await readBody(req, 60 * 1024 * 1024); if (!body.length) throw httpError(400, 'Nothing to share');
    const idx = await sweep(readIdx()), mine = Object.values(idx).filter((v) => v.by === who(s)).length; if (mine >= 200) throw httpError(400, 'Too many active links. Remove some first.');
    const t = crypto.randomBytes(24).toString('base64url'); await fsp.mkdir(SF, { recursive: true, mode: 0o700 }); await fsp.writeFile(path.join(SF, t), body, { mode: 0o600 });
    idx[t] = { name: clip(q.get('name') || 'design', 60).replace(/[^\w\- ]/g, '').trim() || 'design', ext, by: who(s), at: Date.now(), exp: Date.now() + days * 864e5, size: body.length }; writeIdx(idx);
    return json(res, 200, { token: t, path: '/d/' + t, exp: idx[t].exp });
  }
  if (p === '/design/aistatus') { const e = effective(); return json(res, 200, { text: aiProvider(), image: imageStatus(), stt: { ready: !!(e.llm && e.llm.base) || !!(e.ai && e.ai.geminiKey), via: e.llm && e.llm.base ? 'gateway' : e.ai && e.ai.geminiKey ? 'gemini' : '' } }); }
  if (p === '/design/aichat') { const b = await readJson(req, 128 * 1024); aiLimit(who(s)); const pr = clip(b.prompt, 60000).trim(); if (!pr) throw httpError(400, 'Nothing to ask'); return json(res, 200, await aiText(clip(b.system, 4000) || 'Follow the instructions exactly. When asked for JSON, reply with only JSON.', pr, { maxTokens: 3500 })); }
  if (p === '/design/aitext') { const b = await readJson(req, 64 * 1024); aiLimit(who(s)); const f = AI_TASKS[b.task]; if (!f) throw httpError(400, 'Unknown AI task'); const [sys, usr] = f(b); if (!String(usr).trim() || usr === '{}') throw httpError(400, 'Write or select some text first');
    const r = await aiText(AI_SYS + ' ' + sys, usr, { maxTokens: b.task === 'write' ? 1600 : 1200 }); return json(res, 200, r); }
  if (p === '/design/speak') {
    const b = await readJson(req, 16 * 1024); aiLimit(who(s)); const e = effective(); const text = clip(b.text, 3000).trim(); if (!text) throw httpError(400, 'Type what should be said');
    if (!(e.llm && e.llm.base)) throw httpError(400, 'Narration needs your AI gateway with a text-to-speech model (such as tts-1). Gemini and Anthropic keys do not provide it here. You can record a voice-over instead.', 'no_tts');
    const voice = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'].includes(b.voice) ? b.voice : 'alloy'; let r;
    try { r = await fetch(e.llm.base.replace(/\/+$/, '').replace(/\/v1$/, '') + '/v1/audio/speech', { method: 'POST', headers: { 'content-type': 'application/json', ...(e.llm.key ? { authorization: 'Bearer ' + e.llm.key } : {}) }, body: JSON.stringify({ model: e.ai.ttsModel || 'tts-1', input: text, voice, response_format: 'mp3' }), signal: AbortSignal.timeout(120000) }); } catch { throw httpError(502, 'Could not reach your AI gateway'); }
    if (!r.ok) throw httpError(502, 'Your AI gateway could not make speech (' + r.status + '). It needs a text-to-speech model such as tts-1.', 'tts_failed');
    const buf = Buffer.from(await r.arrayBuffer()); if (!buf.length || buf.length > 20e6) throw httpError(502, 'The speech came back empty', 'tts_failed'); return json(res, 200, { audio: 'data:audio/mpeg;base64,' + buf.toString('base64') });
  }
  if (p === '/design/transcribe') {
    const b = await readJson(req, 34 * 1024 * 1024); aiLimit(who(s)); const e = effective(); const viaGem = !(e.llm && e.llm.base) && !!(e.ai && e.ai.geminiKey); if (!(e.llm && e.llm.base) && !viaGem) throw httpError(400, 'Automatic captions need your AI gateway with speech-to-text, or a Gemini key (Settings › AI for Design Studio). Anthropic does not transcribe audio. You can type captions or import an .srt file instead.', 'no_stt');
    const m = /^data:(audio\/[\w.+-]+|video\/[\w.+-]+);base64,([A-Za-z0-9+/=]+)$/.exec(String(b.audio || '')); if (!m) throw httpError(400, 'That sound could not be read'); const buf = Buffer.from(m[2], 'base64'); if (!buf.length || buf.length > 24e6) throw httpError(400, 'That sound is too large. Use a clip under 24 MB.');
    if (viaGem) {
      const lang = b.language ? ' The language is ' + clip(b.language, 8).replace(/[^a-z-]/gi, '') + '.' : '';
      const j = await gemini(e.ai.geminiModel, { contents: [{ role: 'user', parts: [{ text: 'Transcribe this audio.' + lang + ' Reply with ONLY a JSON array of caption segments: [{"start":seconds,"end":seconds,"text":"..."}]. Each segment is one short sentence or phrase, under 12 words, in time order. Use numbers for seconds.' }, { inlineData: { mimeType: m[1], data: m[2] } }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0 } }, fetch, 170000);
      let arr = []; try { arr = JSON.parse(gemText(j)); } catch { const mm = gemText(j).match(/\[[\s\S]*\]/); try { arr = JSON.parse(mm ? mm[0] : '[]'); } catch {} }
      const segs = (Array.isArray(arr) ? arr : []).map((x) => ({ start: +x.start || 0, end: +x.end || 0, text: clip(x.text, 300).trim() })).filter((x) => x.text && x.end >= x.start);
      if (!segs.length) throw httpError(502, 'Gemini could not find speech in that clip', 'stt_failed'); return json(res, 200, { text: segs.map((x) => x.text).join(' ').slice(0, 20000), segments: segs, via: 'gemini' });
    }
    const fd = new FormData(); fd.append('file', new Blob([buf], { type: m[1] }), 'audio.' + (m[1].split('/')[1] || 'webm').replace(/[^a-z0-9]/gi, '')); fd.append('model', e.ai.sttModel || 'whisper-1'); fd.append('response_format', 'verbose_json'); if (b.language) fd.append('language', clip(b.language, 8).replace(/[^a-z-]/gi, ''));
    let r; try { r = await fetch(e.llm.base.replace(/\/+$/, '').replace(/\/v1$/, '') + '/v1/audio/transcriptions', { method: 'POST', headers: e.llm.key ? { authorization: 'Bearer ' + e.llm.key } : {}, body: fd, signal: AbortSignal.timeout(180000) }); } catch { throw httpError(502, 'Could not reach your AI gateway'); }
    if (!r.ok) { let t = ''; try { t = (await r.json()).error?.message || ''; } catch {} throw httpError(502, 'Your AI gateway could not transcribe that' + (t ? ': ' + clip(t, 160) : ' (' + r.status + ')') + '. It needs a speech-to-text model such as whisper-1; set the model name in Settings › AI for Design Studio.', 'stt_failed'); }
    const j = await r.json(); const segs = (j.segments || []).map((x) => ({ start: +x.start || 0, end: +x.end || 0, text: clip(x.text, 300).trim() })).filter((x) => x.text); return json(res, 200, { text: clip(j.text, 20000), segments: segs.length ? segs : (j.text ? [{ start: 0, end: +j.duration || 5, text: clip(j.text, 300) }] : []) });
  }
  if (p === '/design/publish') {
    const b = await readJson(req, 30 * 1024 * 1024), pages = {}; let n = 0, total = 0;
    for (const [k, v] of Object.entries(b.pages || {})) { const slug = String(k).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40); if (!slug || typeof v !== 'string') continue; if (++n > 30) throw httpError(400, 'A site can have up to 30 pages'); total += v.length; pages[slug] = v; }
    if (!n) throw httpError(400, 'Nothing to publish'); if (total > 28 * 1024 * 1024) throw httpError(400, 'This is too large to publish. Use smaller pictures.');
    let t = RT(b.token); const old = t ? readSite(t) : null;
    if (old && old.by !== who(s) && !isOwner(s)) throw httpError(403, 'That page belongs to someone else');
    if (!old) { t = crypto.randomBytes(24).toString('base64url'); fs.mkdirSync(WF, { recursive: true, mode: 0o700 }); const mine = fs.readdirSync(WF).map((f) => { try { return JSON.parse(fs.readFileSync(path.join(WF, f), 'utf8')); } catch { return null; } }).filter((x) => x && x.by === who(s)).length; if (mine >= 30) throw httpError(400, 'Too many published pages. Unpublish some first.'); }
    const rec = { name: clip(b.name || 'Page', 60), by: old ? old.by : who(s), at: Date.now(), pages, forms: !!b.forms, formTo: clip(b.formTo, 200) }; fs.writeFileSync(wFile(t) + '.tmp', JSON.stringify(rec), { mode: 0o600 }); fs.renameSync(wFile(t) + '.tmp', wFile(t));
    return json(res, 200, { token: t, path: '/w/' + t + '/' });
  }
  if (p === '/design/unpublish') { const b = await readJson(req, 1024), t = RT(b.token), j = readSite(t); if (j && (j.by === who(s) || isOwner(s))) { try { await fsp.rm(wFile(t)); } catch {} } return json(res, 200, { ok: true }); }
  if (p === '/design/stats') { const b = await readJson(req, 2048), t = RT(b.token), j = readSite(t); if (!j || (j.by !== who(s) && !isOwner(s))) throw httpError(404, 'That website is not published'); const st = readStats(t), days = Object.keys(st.days).sort().slice(-30); const sum = (n) => days.slice(-n).reduce((a, d) => ({ views: a.views + st.days[d].views, uniq: a.uniq + st.days[d].uniq }), { views: 0, uniq: 0 }); const pages = {}; days.forEach((d) => Object.entries(st.days[d].pages).forEach(([k, v]) => { pages[k] = (pages[k] || 0) + v; })); return json(res, 200, { today: sum(1), week: sum(7), month: sum(30), pages: Object.entries(pages).sort((a, b) => b[1] - a[1]).slice(0, 8), series: days.map((d) => [d, st.days[d].views]), forms: readForms(t).length }); }
  if (p === '/design/library') {
    const b = await readJson(req, 3 * 1024 * 1024), LD = path.join(DATA, 'design-library'), kinds = ['site', 'doc', 'board']; fs.mkdirSync(LD, { recursive: true, mode: 0o700 });
    const all = () => fs.readdirSync(LD).filter((f) => /^[a-f0-9]{12}\.json$/.test(f)).map((f) => { try { return JSON.parse(fs.readFileSync(path.join(LD, f), 'utf8')); } catch { return null; } }).filter(Boolean);
    if (b.op === 'add') { if (!kinds.includes(b.kind)) throw httpError(400, 'Unknown kind'); const data = b.data; if (!data || typeof data !== 'object') throw httpError(400, 'Nothing to save'); const clean = JSON.parse(JSON.stringify(data)); for (const k of ['pub', 'comments', '_trash', 'id', 'updated']) delete clean[k];
      if (all().length >= 200) throw httpError(400, 'The shared library is full. Delete something first.'); const e = { id: crypto.randomBytes(6).toString('hex'), kind: b.kind, name: clip(b.name, 80).trim() || 'Untitled template', by: who(s), at: Date.now(), data: clean }; if (JSON.stringify(e).length > 2.5e6) throw httpError(400, 'That is too large for the library. Use smaller pictures.'); fs.writeFileSync(path.join(LD, e.id + '.json'), JSON.stringify(e), { mode: 0o600 }); return json(res, 200, { id: e.id }); }
    if (b.op === 'del') { const id = String(b.id || ''); if (!/^[a-f0-9]{12}$/.test(id)) throw httpError(400, 'Bad id'); const f = path.join(LD, id + '.json'); let e; try { e = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { throw httpError(404, 'Not found'); } if (e.by !== who(s) && !isOwner(s)) throw httpError(403, 'Only the person who shared it, or the owner, can remove it'); fs.rmSync(f); return json(res, 200, { ok: true }); }
    if (b.op === 'get') { const id = String(b.id || ''); if (!/^[a-f0-9]{12}$/.test(id)) throw httpError(400, 'Bad id'); try { return json(res, 200, JSON.parse(fs.readFileSync(path.join(LD, id + '.json'), 'utf8'))); } catch { throw httpError(404, 'Not found'); } }
    const l = all().filter((e) => !b.kind || e.kind === b.kind).sort((x, y) => y.at - x.at).map((e) => ({ id: e.id, kind: e.kind, name: e.name, by: e.by, at: e.at, mine: e.by === who(s) || isOwner(s) })); return json(res, 200, { items: l });
  }
  if (p === '/design/forms') { const b = await readJson(req, 2048), t = RT(b.token), j = readSite(t); if (!j || (j.by !== who(s) && !isOwner(s))) throw httpError(404, 'That website is not published'); let all = readForms(t); if (b.del) { all = all.filter((x) => x.id !== String(b.del)); fs.mkdirSync(FF, { recursive: true, mode: 0o700 }); fs.writeFileSync(fFile(t), JSON.stringify(all), { mode: 0o600 }); } if (b.clear) { all = []; try { fs.rmSync(fFile(t)); } catch {} } return json(res, 200, { messages: all.slice().reverse(), mail: mail.configured() }); }
  if (p === '/design/review') {
    const q = url.searchParams, days = Math.max(1, Math.min(60, parseInt(q.get('days'), 10) || 14)), b = await readJson(req, 40 * 1024 * 1024);
    const pages = (Array.isArray(b.pages) ? b.pages : []).slice(0, 40).map((d) => { const m = /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.exec(String(d || '')); if (!m) throw httpError(400, 'A page image could not be read'); return m[0]; });
    if (!pages.length) throw httpError(400, 'Nothing to review');
    fs.mkdirSync(RF, { recursive: true, mode: 0o700 }); const mine = fs.readdirSync(RF).map((f) => { try { return JSON.parse(fs.readFileSync(path.join(RF, f), 'utf8')); } catch { return null; } }).filter((x) => x && x.by === who(s) && (!x.exp || x.exp > Date.now())).length; if (mine >= 30) throw httpError(400, 'Too many active review links. Remove some first.');
    const t = crypto.randomBytes(24).toString('base64url'); writeRev(t, { name: clip(b.name || 'Design', 60).replace(/[^\w\- ]/g, '').trim() || 'Design', by: who(s), at: Date.now(), exp: Date.now() + days * 864e5, pages, comments: (Array.isArray(b.comments) ? b.comments : []).slice(0, 100).map((c) => ({ id: String(c.id || crypto.randomBytes(6).toString('hex')).slice(0, 24), page: Math.max(0, Math.min(pages.length - 1, parseInt(c.page, 10) || 0)), x: Math.max(0, Math.min(1, Number(c.x) || 0)), y: Math.max(0, Math.min(1, Number(c.y) || 0)), text: String(c.text || '').slice(0, 600), by: String(c.by || 'You').slice(0, 40), ts: Number(c.ts) || Date.now(), done: !!c.done })) });
    return json(res, 200, { token: t, path: '/r/' + t, exp: Date.now() + days * 864e5 });
  }
  if (p === '/design/reviewpull') {
    const b = await readJson(req, 1024), j = readRev(RT(b.token)); if (!j || (j.by !== who(s) && !isOwner(s))) throw httpError(404, 'That review link is gone');
    return json(res, 200, { comments: j.comments });
  }
  if (p === '/design/reviewend') {
    const b = await readJson(req, 1024), t = RT(b.token), j = readRev(t); if (j && (j.by === who(s) || isOwner(s))) { try { await fsp.rm(rFile(t)); } catch {} } return json(res, 200, { ok: true });
  }
  if (p === '/design/shares') { const idx = await sweep(readIdx()); return json(res, 200, { items: Object.entries(idx).filter(([, v]) => v.by === who(s) || isOwner(s)).map(([t, v]) => ({ token: t, path: '/d/' + t, name: v.name, ext: v.ext, at: v.at, exp: v.exp, size: v.size })).sort((a, b) => b.at - a.at) }); }
  if (p === '/design/unshare') { const b = await readJson(req, 1024), idx = readIdx(), t = String(b.token || ''); const e = idx[t]; if (e && (e.by === who(s) || isOwner(s))) { delete idx[t]; writeIdx(idx); try { await fsp.rm(path.join(SF, t.replace(/[^A-Za-z0-9_-]/g, ''))); } catch {} } return json(res, 200, { ok: true }); }
  throw httpError(404, 'Not found');
}
