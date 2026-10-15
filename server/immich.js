import { Readable } from 'node:stream';
import { spawn } from 'node:child_process';
import fsp from 'node:fs/promises';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { effective, DATA } from './config.js';
import { json, readJson, readBody, fetchJson, httpError, UUID } from './util.js';

function conn() {
  const { url, key } = effective().immich;
  if (!url || !key) throw httpError(409, 'Immich is not connected. Add its address and an API key in Settings.', 'not_configured');
  return { url: url.replace(/\/+$/, ''), key };
}
const api = (path, init = {}, t) => { const c = conn(); return fetchJson(c.url + '/api' + path, { ...init, headers: { 'x-api-key': c.key, accept: 'application/json', ...(init.headers || {}) } }, t); };
const post = (path, body) => api(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });


/* Pictures and videos the browser cannot show as they are (HEIC, HEVC .mov) are converted here when Immich has no usable preview. */
const CACHE = path.join(DATA, 'cache', 'media');
const run = (cmd, args, ms = 60000) => new Promise((ok, no) => { let err = ''; const c = spawn(cmd, args, { stdio: ['ignore', 'ignore', 'pipe'] }); const t = setTimeout(() => { c.kill('SIGKILL'); no(new Error('timed out')); }, ms); c.stderr.on('data', (d) => (err = (err + d).slice(-400))); c.on('error', (e) => { clearTimeout(t); no(e); }); c.on('close', (code) => { clearTimeout(t); code === 0 ? ok() : no(new Error(err || 'exit ' + code)); }); });
const hdrArg = (c) => 'x-api-key: ' + c.key + '\r\n';
async function convertedImage(c, id, kind, isVideo) {
  await fsp.mkdir(CACHE, { recursive: true }); const out = path.join(CACHE, `${id}-${kind}.jpg`), w = kind === 'thumb' ? 360 : 1600;
  try { await fsp.access(out); return out; } catch {}
  const tmp = out + '.' + crypto.randomBytes(3).toString('hex') + '.jpg', src = path.join(CACHE, `${id}.src`);
  try {
    if (isVideo) await run('ffmpeg', ['-v', 'error', '-y', '-headers', hdrArg(c), '-ss', '1', '-i', `${c.url}/api/assets/${id}/original`, '-frames:v', '1', '-vf', `scale='min(${w},iw)':-2`, tmp]);
    else {
      const r = await fetch(`${c.url}/api/assets/${id}/original`, { headers: { 'x-api-key': c.key } }); if (!r.ok) throw httpError(404, 'No such picture');
      const len = Number(r.headers.get('content-length') || 0); if (len > 80 * 1024 * 1024) throw httpError(413, 'Too large to convert');
      await fsp.writeFile(src, Buffer.from(await r.arrayBuffer()));
      try { await run('heif-convert', ['-q', '85', src, tmp]); } catch { await run('ffmpeg', ['-v', 'error', '-y', '-i', src, '-frames:v', '1', '-vf', `scale='min(${w},iw)':-2`, tmp]); }
      if (w < 1600) { const small = tmp + '.s.jpg'; try { await run('ffmpeg', ['-v', 'error', '-y', '-i', tmp, '-vf', `scale='min(${w},iw)':-2`, small]); await fsp.rename(small, tmp); } catch {} }
    }
    await fsp.rename(tmp, out); return out;
  } catch (e) { throw httpError(e.status || 502, e.status ? e.message : 'This picture could not be converted', 'convert_failed'); }
  finally { fsp.rm(src, { force: true }).catch(() => {}); fsp.rm(tmp, { force: true }).catch(() => {}); }
}
function transcode(c, id, req, res) {
  const f = spawn('ffmpeg', ['-v', 'error', '-headers', hdrArg(c), '-i', `${c.url}/api/assets/${id}/original`, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '27', '-pix_fmt', 'yuv420p', '-vf', "scale='min(1280,iw)':-2", '-c:a', 'aac', '-b:a', '128k', '-movflags', 'frag_keyframe+empty_moov+default_base_moof', '-f', 'mp4', 'pipe:1'], { stdio: ['ignore', 'pipe', 'ignore'] });
  let started = false; f.on('error', () => { if (!res.headersSent) { res.writeHead(502, { 'content-type': 'application/json' }); res.end('{"error":"Video conversion is not available on this server"}'); } });
  f.stdout.once('data', () => { started = true; }); res.writeHead(200, { 'content-type': 'video/mp4', 'cache-control': 'no-store' }); f.stdout.pipe(res);
  const kill = () => { try { f.kill('SIGKILL'); } catch {} }; res.on('close', kill); req.on('aborted', kill);
}

export function mapAsset(a) {
  const e = a.exifInfo || {};
  return {
    id: a.id, name: a.originalFileName || a.id, type: a.type === 'VIDEO' ? 'video' : 'image',
    takenAt: a.localDateTime || a.fileCreatedAt || a.createdAt, fav: !!a.isFavorite,
    w: e.exifImageWidth || null, h: e.exifImageHeight || null,
    where: [e.city, e.country].filter(Boolean).join(', ') || null,
    camera: [e.make, e.model].filter(Boolean).join(' ') || null, bytes: e.fileSizeInByte || null
  };
}
const SEARCH = { size: 60, order: 'desc', withExif: true, withDeleted: false, isOffline: false };
/* Deleted (trashed) and offline (file gone from an external library) assets must not show here. */
const live = (a) => !a.isTrashed && !a.isOffline && !a.deletedAt;
async function page(extra, n) { const r = await post('/search/metadata', { ...SEARCH, ...extra, page: n }); return { items: (r.assets?.items || []).filter(live).map(mapAsset), next: r.assets?.nextPage ? Number(r.assets.nextPage) : null }; }

export async function status() {
  const { url, key } = effective().immich;
  if (!url || !key) return { configured: false, connected: false };
  try {
    await api('/server/ping', {}, 6000);
    const v = await api('/server/version', {}, 6000).catch(() => null);
    return { configured: true, connected: true, version: v ? `${v.major}.${v.minor}.${v.patch}` : null };
  } catch (e) { return { configured: true, connected: false, reason: e.code || e.message }; }
}

export async function handlePhotos(req, res, url) {
  const p = url.pathname.replace(/^\/api\/photos/, '') || '/';
  const q = url.searchParams;
  if (p === '/status') return json(res, 200, await status());
  if (p === '/timeline') return json(res, 200, await page({}, Number(q.get('page')) || 1));
  if (p === '/favorites') return json(res, 200, await page({ isFavorite: true }, Number(q.get('page')) || 1));
  if (p === '/albums') {
    const l = await api('/albums');
    return json(res, 200, (l || []).map((a) => ({ id: a.id, name: a.albumName, count: a.assetCount, thumb: a.albumThumbnailAssetId, start: a.startDate || null, end: a.endDate || null })));
  }
  let m;
  if ((m = p.match(/^\/albums\/([^/]+)$/))) {
    if (!UUID.test(m[1])) throw httpError(400, 'Bad album id');
    const a = await api('/albums/' + m[1]);
    const items = (a.assets || []).filter(live).map(mapAsset).sort((x, y) => String(y.takenAt).localeCompare(String(x.takenAt)));
    return json(res, 200, { id: a.id, name: a.albumName, items, next: null });
  }
  if (p === '/search') {
    const text = (q.get('q') || '').trim().slice(0, 200);
    if (!text) return json(res, 200, { items: [], next: null });
    try { const r = await post('/search/smart', { query: text, page: 1, size: 100, withExif: true }); return json(res, 200, { items: (r.assets?.items || []).filter(live).map(mapAsset), next: null, mode: 'smart' }); }
    catch { const r = await page({ originalFileName: text }, 1); return json(res, 200, { ...r, next: null, mode: 'filename' }); }
  }
  if ((m = p.match(/^\/asset\/([^/]+)\/(thumb|preview|original|video)$/))) {
    if (!UUID.test(m[1])) throw httpError(400, 'Bad asset id');
    const c = conn();
    const kind = m[2], headers = { 'x-api-key': c.key }; if (req.headers.range) headers.range = req.headers.range;
    if (kind === 'video' && url.searchParams.get('tx') === '1') return transcode(c, m[1], req, res);
    const get = async (t) => { try { return await fetch(c.url + '/api' + t, { headers }); } catch { throw httpError(502, 'Could not reach Immich', 'upstream_unreachable'); } };
    const tries = kind === 'original' ? ['/assets/' + m[1] + '/original'] : kind === 'video' ? ['/assets/' + m[1] + '/video/playback', '/assets/' + m[1] + '/original'] : kind === 'preview' ? ['preview', 'fullsize', 'thumbnail'].map((z) => `/assets/${m[1]}/thumbnail?size=${z}`) : ['thumbnail', 'preview', 'fullsize'].map((z) => `/assets/${m[1]}/thumbnail?size=${z}`);
    let r = null;
    for (const t of tries) { const x = await get(t); const ct = x.headers.get('content-type') || ''; if (x.ok && (kind === 'original' || kind === 'video' || /^image\//.test(ct)) && x.status !== 204) { r = x; break; } if (x.status === 416) { r = x; break; } try { await x.arrayBuffer(); } catch {} }
    if (!r && (kind === 'thumb' || kind === 'preview')) {
      let isVideo = false; try { isVideo = (await api('/assets/' + m[1])).type === 'VIDEO'; } catch {}
      const f = await convertedImage(c, m[1], kind, isVideo); const st = await fsp.stat(f);
      res.writeHead(200, { 'content-type': 'image/jpeg', 'content-length': st.size, 'cache-control': 'private, max-age=86400' }); return fs.createReadStream(f).on('error', () => res.destroy()).pipe(res);
    }
    if (!r) throw httpError(404, 'Not available', 'no_media');
    const out = { 'content-type': r.headers.get('content-type') || 'application/octet-stream', 'cache-control': r.ok ? 'private, max-age=86400' : 'no-store' };
    for (const h of ['content-length', 'content-range', 'accept-ranges']) if (r.headers.get(h)) out[h] = r.headers.get(h);
    res.writeHead(r.status, out);
    if (!r.body) return res.end();
    return Readable.fromWeb(r.body).on('error', () => res.destroy()).pipe(res);
  }
  if (p === '/favorite' && req.method === 'POST') {
    const b = await readJson(req, 64 * 1024);
    const ids = (Array.isArray(b.ids) ? b.ids : []).filter((x) => typeof x === 'string' && UUID.test(x)).slice(0, 200);
    if (!ids.length) throw httpError(400, 'No assets given');
    await api('/assets', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ids, isFavorite: !!b.value }) });
    return json(res, 200, { ok: true });
  }
  if (p === '/upload' && req.method === 'POST') {
    const name = decodeURIComponent(String(req.headers['x-filename'] || 'upload')).replace(/[\\/]/g, '_').slice(0, 200);
    const created = new Date(Number(req.headers['x-created']) || Date.now()).toISOString();
    const buf = await readBody(req, 200 * 1024 * 1024);
    if (!buf.length) throw httpError(400, 'Empty file');
    const f = new FormData();
    f.set('deviceAssetId', `${name}-${buf.length}-${created}`); f.set('deviceId', 'anands-os');
    f.set('fileCreatedAt', created); f.set('fileModifiedAt', created);
    f.set('assetData', new Blob([buf], { type: String(req.headers['content-type'] || 'application/octet-stream') }), name);
    const r = await api('/assets', { method: 'POST', body: f }, 180000);
    return json(res, 200, { id: r.id, status: r.status });
  }
  throw httpError(404, 'Unknown photos route');
}

/* compact summary for the assistant */
export async function photoContext() {
  const s = await status();
  if (!s.configured) return { connected: false, note: 'Immich is not connected.' };
  if (!s.connected) return { connected: false, note: 'Immich is configured but unreachable right now.' };
  const [albums, recent] = await Promise.all([api('/albums').catch(() => []), page({}, 1).catch(() => ({ items: [] }))]);
  return {
    connected: true,
    albums: (albums || []).slice(0, 80).map((a) => ({ name: a.albumName, photos: a.assetCount, from: a.startDate?.slice(0, 10), to: a.endDate?.slice(0, 10) })),
    latest: recent.items.slice(0, 25).map((a) => ({ file: a.name, taken: String(a.takenAt).slice(0, 10), favourite: a.fav, place: a.where, type: a.type }))
  };
}
