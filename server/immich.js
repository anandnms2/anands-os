import { Readable } from 'node:stream';
import { effective } from './config.js';
import { json, readJson, readBody, fetchJson, httpError, UUID } from './util.js';

function conn() {
  const { url, key } = effective().immich;
  if (!url || !key) throw httpError(409, 'Immich is not connected. Add its address and an API key in Settings.', 'not_configured');
  return { url: url.replace(/\/+$/, ''), key };
}
const api = (path, init = {}, t) => { const c = conn(); return fetchJson(c.url + '/api' + path, { ...init, headers: { 'x-api-key': c.key, accept: 'application/json', ...(init.headers || {}) } }, t); };
const post = (path, body) => api(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

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
  if ((m = p.match(/^\/asset\/([^/]+)\/(thumb|preview|original)$/))) {
    if (!UUID.test(m[1])) throw httpError(400, 'Bad asset id');
    const c = conn();
    const target = m[2] === 'original' ? `/assets/${m[1]}/original` : `/assets/${m[1]}/thumbnail?size=${m[2] === 'preview' ? 'preview' : 'thumbnail'}`;
    const headers = { 'x-api-key': c.key }; if (req.headers.range) headers.range = req.headers.range;
    let r;
    try { r = await fetch(c.url + '/api' + target, { headers }); } catch (e) { throw httpError(502, 'Could not reach Immich', 'upstream_unreachable'); }
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
