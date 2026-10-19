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

/* ---------- stock photos ---------- */
const HOSTS = new Set(['images.pexels.com', 'images.unsplash.com', 'plus.unsplash.com']);
const clip = (v, n) => String(v == null ? '' : v).slice(0, n);
export async function stockSearch(q, page, source, fetcher = fetch) {
  const k = effective().stock || {}; q = clip(q, 120).trim(); page = Math.max(1, Math.min(50, parseInt(page, 10) || 1));
  const want = source === 'unsplash' ? 'unsplash' : source === 'pexels' ? 'pexels' : (k.pexels ? 'pexels' : 'unsplash');
  if (want === 'pexels') {
    if (!k.pexels) throw httpError(400, 'Add a Pexels key in Settings to search stock photos', 'no_key');
    const u = q ? PEXELS + '/search?per_page=24&page=' + page + '&query=' + encodeURIComponent(q) : PEXELS + '/curated?per_page=24&page=' + page;
    let r; try { r = await fetcher(u, { headers: { authorization: k.pexels }, signal: AbortSignal.timeout(12000) }); } catch { throw httpError(502, 'Could not reach Pexels. Check this server can reach the internet.'); } if (!r.ok) throw httpError(502, r.status === 401 ? 'Pexels did not accept that key' : 'Pexels is not answering (' + r.status + ')');
    const j = await r.json();
    return { source: 'pexels', page, items: (j.photos || []).map((p) => ({ id: 'px' + p.id, thumb: p.src && p.src.medium, full: p.src && (p.src.large2x || p.src.large || p.src.original), w: p.width, h: p.height, by: clip(p.photographer, 80), link: clip(p.url, 300), alt: clip(p.alt, 120) })).filter((x) => x.thumb && x.full) };
  }
  if (!k.unsplash) throw httpError(400, 'Add an Unsplash key in Settings to search stock photos', 'no_key');
  const u = q ? UNSPLASH + '/search/photos?per_page=24&page=' + page + '&query=' + encodeURIComponent(q) : UNSPLASH + '/photos?per_page=24&page=' + page;
  let r; try { r = await fetcher(u, { headers: { authorization: 'Client-ID ' + k.unsplash, 'accept-version': 'v1' }, signal: AbortSignal.timeout(12000) }); } catch { throw httpError(502, 'Could not reach Unsplash. Check this server can reach the internet.'); } if (!r.ok) throw httpError(502, r.status === 401 ? 'Unsplash did not accept that key' : 'Unsplash is not answering (' + r.status + ')');
  const j = await r.json(); const list = Array.isArray(j) ? j : (j.results || []);
  return { source: 'unsplash', page, items: list.map((p) => ({ id: 'us' + p.id, thumb: p.urls && p.urls.small, full: p.urls && p.urls.regular, w: p.width, h: p.height, by: clip(p.user && p.user.name, 80), link: clip(p.links && p.links.html, 300), alt: clip(p.alt_description, 120), dl: clip(p.links && p.links.download_location, 300) })).filter((x) => x.thumb && x.full) };
}
async function stockImage(res, u) {
  let t; try { t = new URL(u); } catch { throw httpError(400, 'Bad address'); }
  if (t.protocol !== 'https:' || !HOSTS.has(t.hostname)) throw httpError(400, 'That address is not a stock photo');
  let r; try { r = await fetch(t, { redirect: 'error', signal: AbortSignal.timeout(20000) }); } catch { throw httpError(502, 'The photo could not be loaded'); } if (!r.ok) throw httpError(502, 'The photo could not be loaded');
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
  if (p === '/design/stockstatus') { const k = effective().stock || {}; return json(res, 200, { pexels: !!k.pexels, unsplash: !!k.unsplash }); }
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
