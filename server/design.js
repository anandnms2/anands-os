/* Design Studio server parts: stock photo search (Pexels / Unsplash through this server so keys stay private), the cached
   background-remover files, and share links for finished designs. */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { DATA, effective } from './config.js';
import { json, readBody, readJson, httpError } from './util.js';
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

/* ---------- stock photos: Pexels, Unsplash, Pixabay (free keys) and Openverse, Wikimedia Commons (no key) ---------- */
const UA = 'AnandsOS-DesignStudio/1.0 (self-hosted; https://github.com/anandnms2/anands-os)';
const PIXABAY = (process.env.PIXABAY_API_BASE || 'https://pixabay.com/api').replace(/\/+$/, ''), OPENVERSE = (process.env.OPENVERSE_API_BASE || 'https://api.openverse.org/v1').replace(/\/+$/, ''), WIKI = process.env.WIKIMEDIA_API_BASE || 'https://commons.wikimedia.org/w/api.php';
const HOSTS = new Set(['images.pexels.com', 'images.unsplash.com', 'plus.unsplash.com', 'upload.wikimedia.org', 'api.openverse.org', 'pixabay.com', 'cdn.pixabay.com']);
const clip = (v, n) => String(v == null ? '' : v).slice(0, n);
const plain = (h, n) => clip(String(h || '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim(), n);
export const stockStatus = () => { const k = effective().stock || {}; return { pexels: !!k.pexels, unsplash: !!k.unsplash, pixabay: !!k.pixabay, openverse: true, wikimedia: true }; };
async function getJson(name, url, headers, fetcher) {
  let r; try { r = await fetcher(url, { headers: { 'user-agent': UA, accept: 'application/json', ...headers }, signal: AbortSignal.timeout(15000) }); } catch { throw httpError(502, 'Could not reach ' + name + '. Check this server can reach the internet.'); }
  if (r.status === 401 || r.status === 403) throw httpError(502, name + ' did not accept that key');
  if (r.status === 429) throw httpError(502, name + ' is limiting requests right now. Try again in a minute.');
  if (!r.ok) throw httpError(502, name + ' is not answering (' + r.status + ')');
  try { return await r.json(); } catch { throw httpError(502, name + ' sent something unexpected'); }
}
const needKey = (n) => httpError(400, 'Add a ' + n + ' key in Settings to search it', 'no_key');
export async function stockSearch(q, page, source, fetcher = fetch) {
  const k = effective().stock || {}; q = clip(q, 100).trim(); page = Math.max(1, Math.min(50, parseInt(page, 10) || 1));
  const want = ['pexels', 'unsplash', 'pixabay', 'openverse', 'wikimedia'].includes(source) ? source : (k.pexels ? 'pexels' : k.unsplash ? 'unsplash' : k.pixabay ? 'pixabay' : 'openverse');
  const enc = encodeURIComponent;
  if (want === 'pexels') {
    if (!k.pexels) throw needKey('Pexels');
    const j = await getJson('Pexels', q ? PEXELS + '/search?per_page=24&page=' + page + '&query=' + enc(q) : PEXELS + '/curated?per_page=24&page=' + page, { authorization: k.pexels }, fetcher);
    return { source: want, page, items: (j.photos || []).map((p) => ({ id: 'px' + p.id, thumb: p.src && p.src.medium, full: p.src && (p.src.large2x || p.src.large || p.src.original), w: p.width, h: p.height, by: clip(p.photographer, 80), link: clip(p.url, 300), alt: clip(p.alt, 120), lic: 'Pexels license' })).filter((x) => x.thumb && x.full) };
  }
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
  if (want === 'openverse') {
    const j = await getJson('Openverse', OPENVERSE + '/images/?page_size=24&page=' + page + '&mature=false&license_type=commercial&q=' + enc(q || 'nature'), {}, fetcher);
    return { source: want, page, items: (j.results || []).map((p) => { const t = p.thumbnail || (p.id ? OPENVERSE + '/images/' + p.id + '/thumb/' : ''); return { id: 'ov' + p.id, thumb: t, full: t, w: p.width, h: p.height, by: clip(p.creator, 80), link: clip(p.foreign_landing_url, 300), alt: clip(p.title, 120), lic: clip(('CC ' + (p.license || '') + ' ' + (p.license_version || '')).trim().toUpperCase(), 40), lowres: true }; }).filter((x) => x.thumb) };
  }
  const j = await getJson('Wikimedia Commons', WIKI + '?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=24&gsroffset=' + (page - 1) * 24 + '&gsrsearch=' + enc((q || 'nature landscape') + ' filetype:bitmap') + '&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=1280&iiextmetadatafilter=Artist|LicenseShortName', {}, fetcher);
  const pages = Object.values((j.query && j.query.pages) || {}).sort((a, b) => (a.index || 0) - (b.index || 0));
  return { source: want, page, items: pages.map((p) => { const i = (p.imageinfo || [])[0]; if (!i || !/^image\/(jpeg|png|webp)$/.test(i.mime || '') || !i.thumburl) return null; const m = i.extmetadata || {};
    return { id: 'wm' + p.pageid, thumb: i.thumburl.replace(/\/\d+px-/, '/320px-'), full: i.thumburl, w: i.width, h: i.height, by: plain(m.Artist && m.Artist.value, 80) || 'Wikimedia contributor', link: clip(i.descriptionurl, 300), alt: clip(String(p.title || '').replace(/^File:/, '').replace(/\.\w+$/, '').replace(/_/g, ' '), 120), lic: plain(m.LicenseShortName && m.LicenseShortName.value, 40) }; }).filter(Boolean) };
}
async function stockImage(res, u) {
  let t; try { t = new URL(u); } catch { throw httpError(400, 'Bad address'); }
  let r = null;
  for (let hop = 0; hop < 4; hop++) {
    if (t.protocol !== 'https:' || !HOSTS.has(t.hostname)) throw httpError(400, 'That address is not a stock photo');
    try { r = await fetch(t, { redirect: 'manual', headers: { 'user-agent': UA }, signal: AbortSignal.timeout(20000) }); } catch { throw httpError(502, 'The photo could not be loaded'); }
    if (r.status >= 300 && r.status < 400 && r.headers.get('location')) { try { t = new URL(r.headers.get('location'), t); } catch { throw httpError(502, 'The photo could not be loaded'); } continue; }
    break;
  }
  if (!r || !r.ok) throw httpError(502, 'The photo could not be loaded');
  const type = String(r.headers.get('content-type') || ''); if (!/^image\/(jpeg|png|webp)/.test(type)) throw httpError(502, 'Unexpected file type');
  const buf = Buffer.from(await r.arrayBuffer()); if (buf.length > 20e6) throw httpError(413, 'Photo is too large');
  res.writeHead(200, { 'content-type': type.split(';')[0], 'content-length': buf.length, 'cache-control': 'private, max-age=86400' }); res.end(buf);
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

/* ---------- routes under /_local ---------- */
/* ---------- AI images (Magic Edit, BG Generator): Pollinations (no key), any OpenAI-compatible endpoint, or Hugging Face ---------- */
const POLL = (process.env.POLLINATIONS_BASE || 'https://image.pollinations.ai').replace(/\/+$/, ''), HF = (process.env.HF_API_BASE || 'https://api-inference.huggingface.co').replace(/\/+$/, '');
export const imageStatus = () => { const i = effective().image || {}; const prov = i.provider || 'pollinations'; const ok = prov === 'pollinations' || (prov === 'openai' && !!i.url) || (prov === 'huggingface' && !!i.key); return { provider: prov, ready: ok, edit: prov === 'openai' && !!i.url, reason: ok ? '' : prov === 'openai' ? 'Add the image service address in Settings › Design Studio AI images' : 'Add a Hugging Face token in Settings › Design Studio AI images' }; };
const imgHits = new Map();
function imgLimit(who) { const now = Date.now(), a = (imgHits.get(who) || []).filter((t) => now - t < 600000); if (a.length >= 40) throw httpError(429, 'Too many AI image requests. Try again in a few minutes.', 'rate_limited'); a.push(now); imgHits.set(who, a); }
const dataUrl = (buf, type) => 'data:' + type + ';base64,' + buf.toString('base64');
const parseData = (d, max) => { const m = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(d || '')); if (!m) throw httpError(400, 'That image could not be read'); const b = Buffer.from(m[2], 'base64'); if (!b.length || b.length > max) throw httpError(400, 'That image is too large'); return { type: m[1], buf: b }; };
const safeHttps = (u) => { try { const x = new URL(u); if (x.protocol !== 'https:') return false; const h = x.hostname; if (/^(localhost|.*\.local|.*\.internal)$/i.test(h) || /^[\d.]+$/.test(h) || h.includes(':')) return false; return true; } catch { return false; } };
async function fetchImg(r, name) { if (!r.ok) { if (r.status === 401 || r.status === 403) throw httpError(502, name + ' did not accept the key'); if (r.status === 429) throw httpError(502, name + ' is limiting requests right now. Try again in a minute.'); let m = ''; try { m = (await r.json()).error?.message || ''; } catch {} throw httpError(502, name + ' could not make that image' + (m ? ': ' + clip(m, 160) : ' (' + r.status + ')')); } const type = (r.headers.get('content-type') || '').split(';')[0]; if (!/^image\/(png|jpeg|webp)$/.test(type)) throw httpError(502, name + ' sent something that is not an image'); const b = Buffer.from(await r.arrayBuffer()); if (b.length > 12e6) throw httpError(502, 'That image is too large'); return dataUrl(b, type); }
export async function imageGen(body, who, fetcher = fetch) {
  imgLimit(who);
  const i = effective().image || {}, st = imageStatus(); if (!st.ready) throw httpError(400, st.reason, 'no_image_ai');
  const prompt = clip(body.prompt, 900).trim(); if (!prompt) throw httpError(400, 'Describe what you want first');
  const w = Math.max(256, Math.min(1536, Math.round((parseInt(body.w, 10) || 1024) / 64) * 64)), h = Math.max(256, Math.min(1536, Math.round((parseInt(body.h, 10) || 1024) / 64) * 64)), seed = parseInt(body.seed, 10) || Math.floor(Math.random() * 1e9);
  const edit = body.mode === 'edit';
  try {
    if (i.provider === 'pollinations') {
      if (edit) throw httpError(400, 'Pollinations makes new images but cannot edit one. Choose an OpenAI-compatible image service in Settings for true Magic Edit.', 'no_edit');
      const u = POLL + '/prompt/' + encodeURIComponent(prompt) + '?width=' + w + '&height=' + h + '&seed=' + seed + '&nologo=true&model=' + encodeURIComponent(i.model || 'flux') + '&private=true';
      const r = await fetcher(u, { headers: { 'user-agent': UA, ...(i.key ? { authorization: 'Bearer ' + i.key } : {}) }, signal: AbortSignal.timeout(90000) });
      return { image: await fetchImg(r, 'Pollinations'), provider: 'pollinations' };
    }
    if (i.provider === 'huggingface') {
      if (edit) throw httpError(400, 'Hugging Face text-to-image cannot edit an image. Choose an OpenAI-compatible image service for Magic Edit.', 'no_edit');
      const r = await fetcher(HF + '/models/' + (i.model || 'black-forest-labs/FLUX.1-schnell'), { method: 'POST', headers: { authorization: 'Bearer ' + i.key, 'content-type': 'application/json', accept: 'image/png', 'user-agent': UA }, body: JSON.stringify({ inputs: prompt, parameters: { width: w, height: h, seed } }), signal: AbortSignal.timeout(90000) });
      return { image: await fetchImg(r, 'Hugging Face'), provider: 'huggingface' };
    }
    // OpenAI-compatible
    const base = i.url, model = i.model || 'gpt-image-1', size = Math.abs(w / h - 1) < .2 ? '1024x1024' : w > h ? '1536x1024' : '1024x1536';
    let r;
    if (edit) {
      const im = parseData(body.image, 8e6), mk = parseData(body.mask, 8e6), fd = new FormData();
      fd.append('model', model); fd.append('prompt', prompt); fd.append('size', size); fd.append('n', '1');
      fd.append('image', new Blob([im.buf], { type: im.type }), 'image.' + im.type.slice(6)); fd.append('mask', new Blob([mk.buf], { type: mk.type }), 'mask.' + mk.type.slice(6));
      r = await fetcher(base + '/images/edits', { method: 'POST', headers: { ...(i.key ? { authorization: 'Bearer ' + i.key } : {}), 'user-agent': UA }, body: fd, signal: AbortSignal.timeout(120000) });
    } else r = await fetcher(base + '/images/generations', { method: 'POST', headers: { ...(i.key ? { authorization: 'Bearer ' + i.key } : {}), 'content-type': 'application/json', 'user-agent': UA }, body: JSON.stringify({ model, prompt, size, n: 1 }), signal: AbortSignal.timeout(120000) });
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
  if (p === '/design/stockimg' && req.method === 'GET') return stockImage(res, url.searchParams.get('u') || '');
  if (req.method !== 'POST') throw httpError(405, 'Method not allowed');
  if (p === '/design/stockstatus') return json(res, 200, { ...stockStatus(), image: imageStatus() });
  if (p === '/design/genimage') { const b = await readJson(req, 20 * 1024 * 1024); return json(res, 200, await imageGen(b, who(s))); }
  if (p === '/design/stock') { const b = await readJson(req, 4096); return json(res, 200, await stockSearch(b.q, b.page, b.source)); }
  if (p === '/design/stockuse') { const b = await readJson(req, 4096), k = effective().stock || {}; try { const u = new URL(b.dl); if (u.hostname === 'api.unsplash.com' && k.unsplash) await fetch(u, { headers: { authorization: 'Client-ID ' + k.unsplash }, signal: AbortSignal.timeout(8000) }); } catch {} return json(res, 200, { ok: true }); }
  if (p === '/design/share') {
    const q = url.searchParams, ext = String(q.get('ext') || '').toLowerCase(); if (!EXT[ext]) throw httpError(400, 'That file type cannot be shared');
    const days = Math.max(1, Math.min(365, parseInt(q.get('days'), 10) || 30)), body = await readBody(req, 60 * 1024 * 1024); if (!body.length) throw httpError(400, 'Nothing to share');
    const idx = await sweep(readIdx()), mine = Object.values(idx).filter((v) => v.by === who(s)).length; if (mine >= 200) throw httpError(400, 'Too many active links. Remove some first.');
    const t = crypto.randomBytes(24).toString('base64url'); await fsp.mkdir(SF, { recursive: true, mode: 0o700 }); await fsp.writeFile(path.join(SF, t), body, { mode: 0o600 });
    idx[t] = { name: clip(q.get('name') || 'design', 60).replace(/[^\w\- ]/g, '').trim() || 'design', ext, by: who(s), at: Date.now(), exp: Date.now() + days * 864e5, size: body.length }; writeIdx(idx);
    return json(res, 200, { token: t, path: '/d/' + t, exp: idx[t].exp });
  }
  if (p === '/design/shares') { const idx = await sweep(readIdx()); return json(res, 200, { items: Object.entries(idx).filter(([, v]) => v.by === who(s) || isOwner(s)).map(([t, v]) => ({ token: t, path: '/d/' + t, name: v.name, ext: v.ext, at: v.at, exp: v.exp, size: v.size })).sort((a, b) => b.at - a.at) }); }
  if (p === '/design/unshare') { const b = await readJson(req, 1024), idx = readIdx(), t = String(b.token || ''); const e = idx[t]; if (e && (e.by === who(s) || isOwner(s))) { delete idx[t]; writeIdx(idx); try { await fsp.rm(path.join(SF, t.replace(/[^A-Za-z0-9_-]/g, ''))); } catch {} } return json(res, 200, { ok: true }); }
  throw httpError(404, 'Not found');
}
