/* The rest of Immich for the Photos screen: people, places, archive, trash, duplicates, memories, shared links, albums (create, edit, share),
 * tags, filtered search, downloads, plus a pass-through to the Immich API for anything else. Everything runs with the API key kept here. */
import { Readable } from 'node:stream';
import { json, readJson, readBody, httpError, rawFetch, UUID } from './util.js';
import { conn_ as conn, mapAsset, iapi, live } from './immich.js';

const isoOk = (v) => (v && !Number.isNaN(Date.parse(v)) ? new Date(v).toISOString() : undefined);
const ids = (v) => (Array.isArray(v) ? v : []).filter((x) => typeof x === 'string' && UUID.test(x)).slice(0, 500);
const id1 = (v) => { if (!UUID.test(String(v || ''))) throw httpError(400, 'Bad id', 'bad_id'); return String(v); };

/* one request to Immich that keeps its error message */
async function up(method, path, body, ms = 30000) {
  const c = conn(); const init = { method, headers: { 'x-api-key': c.key, accept: 'application/json' } };
  if (body !== undefined) { init.headers['content-type'] = 'application/json'; init.body = JSON.stringify(body); }
  const r = await rawFetch(c.url + '/api' + path, init, ms);
  if (!r.ok) { const m = r.data && (Array.isArray(r.data.message) ? r.data.message.join(', ') : r.data.message); throw httpError(r.status >= 400 && r.status < 500 && r.status !== 401 ? r.status : 502, m || 'Immich answered ' + r.status, 'upstream_' + r.status); }
  return r.data;
}
const SEARCH = { size: 60, order: 'desc', withExif: true };
async function find(extra, n, keep = live) {
  const r = await up('POST', '/search/metadata', { ...SEARCH, withDeleted: false, ...extra, page: n || 1 });
  return { items: (r.assets?.items || []).filter(keep).map(mapAsset), next: r.assets?.nextPage ? Number(r.assets.nextPage) : null };
}
async function setArchive(list, v) {
  try { await up('PUT', '/assets', { ids: list, visibility: v ? 'archive' : 'timeline' }); }
  catch (e) { if (e.status === 400 || e.status === 422) await up('PUT', '/assets', { ids: list, isArchived: v }); else throw e; }
}
const archived = async (n) => { try { return await find({ visibility: 'archive' }, n); } catch (e) { if (e.status === 400 || e.status === 422) return find({ isArchived: true }, n); throw e; } };
const trashed = (n) => find({ withDeleted: true, trashedAfter: '2000-01-01T00:00:00.000Z' }, n, (a) => !a.isOffline);
const link = (l) => ({ id: l.id, key: l.key, type: l.type, desc: l.description || '', created: l.createdAt, expires: l.expiresAt || null, download: l.allowDownload !== false, album: l.album ? { id: l.album.id, name: l.album.albumName } : null, count: (l.assets || []).length, url: conn().url + '/share/' + l.key, password: !!l.password });
const BLOCK = /^\/(api-keys|auth|oauth|admin|sessions|users\/me\/(api|oauth))(\/|$)/;

export async function handleX(req, res, url) {
  const p = url.pathname.replace(/^\/api\/photos\/x/, '') || '/', q = url.searchParams, m = req.method; let x;
  const page = Number(q.get('page')) || 1;
  const body = async () => (m === 'GET' || m === 'HEAD' ? {} : await readJson(req, 256 * 1024));

  if (p === '/people' && m === 'GET') {
    const r = await up('GET', '/people?withHidden=false&size=300&page=' + page);
    return json(res, 200, { people: (r.people || []).filter((x) => !x.isHidden).map((x) => ({ id: x.id, name: x.name || '', fav: !!x.isFavorite })), next: r.hasNextPage ? page + 1 : null, total: r.total || 0 });
  }
  if ((x = /^\/person\/([^/]+)(?:\/(assets))?$/.exec(p))) {
    const pid = id1(x[1]);
    if (x[2] === 'assets') return json(res, 200, await find({ personIds: [pid] }, page));
    if (m === 'PUT') { const b = await body(); const r = await up('PUT', '/people/' + pid, { name: String(b.name || '').slice(0, 120) }); return json(res, 200, { id: pid, name: r?.name ?? b.name }); }
    const r = await up('GET', '/people/' + pid); return json(res, 200, { id: pid, name: r.name || '' });
  }
  if (p === '/places') {
    const r = await up('GET', '/search/cities'); const seen = new Set(), out = [];
    for (const a of r || []) { const e = a.exifInfo || {}; if (!e.city) continue; const k = e.city + '|' + (e.country || ''); if (seen.has(k)) continue; seen.add(k); out.push({ city: e.city, country: e.country || '', thumb: a.id }); }
    return json(res, 200, out.sort((a, b) => a.city.localeCompare(b.city)));
  }
  if (p === '/place') return json(res, 200, await find({ city: q.get('city') || undefined, country: q.get('country') || undefined }, page));
  if (p === '/archive' && m === 'GET') return json(res, 200, await archived(page));
  if (p === '/archive' && m === 'POST') { const b = await body(); const l = ids(b.ids); if (!l.length) throw httpError(400, 'No assets given'); await setArchive(l, !!b.value); return json(res, 200, { ok: true }); }
  if (p === '/trash' && m === 'GET') return json(res, 200, await trashed(page));
  if (p === '/trash' && m === 'POST') { const b = await body(); const l = ids(b.ids); if (!l.length) throw httpError(400, 'No assets given'); await up('DELETE', '/assets', { ids: l, force: false }); return json(res, 200, { ok: true }); }
  if (p === '/restore' && m === 'POST') { const b = await body(); const l = ids(b.ids); if (!l.length) throw httpError(400, 'No assets given'); await up('POST', '/trash/restore/assets', { ids: l }); return json(res, 200, { ok: true }); }
  if (p === '/delete-forever' && m === 'POST') { const b = await body(); const l = ids(b.ids); if (!l.length) throw httpError(400, 'No assets given'); await up('DELETE', '/assets', { ids: l, force: true }); return json(res, 200, { ok: true }); }
  if (p === '/trash-empty' && m === 'POST') { await up('POST', '/trash/empty'); return json(res, 200, { ok: true }); }

  /* albums */
  if (p === '/albums' && m === 'POST') { const b = await body(); const name = String(b.name || '').trim().slice(0, 120); if (!name) throw httpError(400, 'Give the album a name'); const a = await up('POST', '/albums', { albumName: name, assetIds: ids(b.ids) }); return json(res, 200, { id: a.id, name: a.albumName }); }
  if ((x = /^\/albums\/([^/]+)(?:\/(add|remove|info|users))?$/.exec(p))) {
    const aid = id1(x[1]), act = x[2];
    if (!act && m === 'PATCH') { const b = await body(); const patch = {}; if (b.name != null) patch.albumName = String(b.name).slice(0, 120); if (b.description != null) patch.description = String(b.description).slice(0, 1000); await up('PATCH', '/albums/' + aid, patch); return json(res, 200, { ok: true }); }
    if (!act && m === 'DELETE') { await up('DELETE', '/albums/' + aid); return json(res, 200, { ok: true }); }
    if (act === 'add' && m === 'POST') { const b = await body(); const r = await up('PUT', '/albums/' + aid + '/assets', { ids: ids(b.ids) }); return json(res, 200, { ok: true, added: (r || []).filter((z) => z.success).length, dup: (r || []).filter((z) => z.error === 'duplicate').length }); }
    if (act === 'remove' && m === 'POST') { const b = await body(); await up('DELETE', '/albums/' + aid + '/assets', { ids: ids(b.ids) }); return json(res, 200, { ok: true }); }
    if (act === 'info') { const a = await up('GET', '/albums/' + aid); return json(res, 200, { id: a.id, name: a.albumName, description: a.description || '', owner: a.owner ? { id: a.owner.id, name: a.owner.name, email: a.owner.email } : null, users: (a.albumUsers || []).map((u) => ({ id: u.user?.id, name: u.user?.name, email: u.user?.email, role: u.role })), shared: !!a.shared }); }
    if (act === 'users' && m === 'PUT') { const b = await body(); const list = (Array.isArray(b.users) ? b.users : []).filter((u) => UUID.test(String(u.userId))).map((u) => ({ userId: u.userId, role: u.role === 'viewer' ? 'viewer' : 'editor' })); await up('PUT', '/albums/' + aid + '/users', { albumUsers: list }); return json(res, 200, { ok: true }); }
  }
  if (p === '/users') { const l = await up('GET', '/users'); return json(res, 200, (l || []).map((u) => ({ id: u.id, name: u.name, email: u.email }))); }

  /* shared links */
  if (p === '/links' && m === 'GET') return json(res, 200, ((await up('GET', '/shared-links')) || []).map(link));
  if (p === '/links' && m === 'POST') {
    const b = await body(); const days = Math.max(0, Math.min(3650, Number(b.days) || 0));
    const dto = { type: b.albumId ? 'ALBUM' : 'INDIVIDUAL', allowDownload: b.download !== false, allowUpload: false, showMetadata: b.metadata !== false };
    if (b.albumId) dto.albumId = id1(b.albumId); else { dto.assetIds = ids(b.ids); if (!dto.assetIds.length) throw httpError(400, 'No assets given'); }
    if (days) dto.expiresAt = new Date(Date.now() + days * 864e5).toISOString(); if (b.description) dto.description = String(b.description).slice(0, 200); if (b.password) dto.password = String(b.password).slice(0, 100);
    return json(res, 200, link(await up('POST', '/shared-links', dto)));
  }
  if ((x = /^\/links\/([^/]+)$/.exec(p)) && m === 'DELETE') { await up('DELETE', '/shared-links/' + id1(x[1])); return json(res, 200, { ok: true }); }

  /* one asset */
  if ((x = /^\/asset\/([^/]+)\/info$/.exec(p))) {
    const a = await up('GET', '/assets/' + id1(x[1])); const e = a.exifInfo || {};
    return json(res, 200, { id: a.id, name: a.originalFileName, path: a.originalPath || '', type: a.type === 'VIDEO' ? 'video' : 'image', takenAt: a.localDateTime || a.fileCreatedAt, desc: e.description || '', fav: !!a.isFavorite, archived: a.isArchived === true || a.visibility === 'archive', w: e.exifImageWidth || null, h: e.exifImageHeight || null, bytes: e.fileSizeInByte || null,
      camera: [e.make, e.model].filter(Boolean).join(' ') || null, lens: e.lensModel || null, exposure: { f: e.fNumber || null, iso: e.iso || null, time: e.exposureTime || null, mm: e.focalLength || null },
      place: [e.city, e.state, e.country].filter(Boolean).join(', ') || null, lat: e.latitude ?? null, lon: e.longitude ?? null, duration: a.duration || null,
      people: (a.people || []).map((z) => ({ id: z.id, name: z.name || '' })), tags: (a.tags || []).map((z) => ({ id: z.id, name: z.value || z.name })), stack: a.stack ? { count: (a.stack.assetCount || 0) } : null });
  }
  if ((x = /^\/asset\/([^/]+)$/.exec(p)) && m === 'PATCH') {
    const b = await body(), patch = {}; if (b.description != null) patch.description = String(b.description).slice(0, 2000); const d = isoOk(b.takenAt); if (d) patch.dateTimeOriginal = d;
    if (b.lat != null && b.lon != null && Number.isFinite(+b.lat) && Number.isFinite(+b.lon)) { patch.latitude = +b.lat; patch.longitude = +b.lon; }
    if (!Object.keys(patch).length) throw httpError(400, 'Nothing to change'); await up('PUT', '/assets/' + id1(x[1]), patch); return json(res, 200, { ok: true });
  }
  if (p === '/tag' && m === 'POST') {
    const b = await body(), name = String(b.name || '').trim().slice(0, 100), l = ids(b.ids); if (!name || !l.length) throw httpError(400, 'Give a tag and some photos');
    const tags = (await up('GET', '/tags')) || []; let t = tags.find((z) => (z.value || z.name || '').toLowerCase() === name.toLowerCase()); if (!t) t = await up('POST', '/tags', { name });
    await up('PUT', '/tags/assets', { assetIds: l, tagIds: [t.id] }); return json(res, 200, { id: t.id, name });
  }
  if (p === '/tags' && m === 'GET') return json(res, 200, ((await up('GET', '/tags')) || []).map((t) => ({ id: t.id, name: t.value || t.name })));
  if ((x = /^\/tags\/([^/]+)\/assets$/.exec(p))) return json(res, 200, await find({ tagIds: [id1(x[1])] }, page));
  if (p === '/untag' && m === 'POST') { const b = await body(); await up('DELETE', '/tags/' + id1(b.tagId) + '/assets', { ids: ids(b.ids) }); return json(res, 200, { ok: true }); }

  /* discovery */
  if (p === '/memories') {
    const l = (await up('GET', '/memories')) || [];
    return json(res, 200, l.map((z) => ({ id: z.id, year: z.data?.year || null, at: z.memoryAt, items: (z.assets || []).filter(live).map(mapAsset) })).filter((z) => z.items.length).slice(0, 30));
  }
  if (p === '/duplicates' && m === 'GET') { const l = (await up('GET', '/duplicates')) || []; return json(res, 200, l.slice(0, 60).map((g) => ({ id: g.duplicateId, items: (g.assets || []).map(mapAsset) }))); }
  if (p === '/duplicates' && m === 'POST') {
    const b = await body(); const gid = id1(b.id); const drop = ids(b.drop);
    if (drop.length) await up('DELETE', '/assets', { ids: drop, force: false });
    try { await up('DELETE', '/duplicates/' + gid); } catch {} return json(res, 200, { ok: true });
  }
  if (p === '/stats') {
    const [s, al] = await Promise.all([up('GET', '/assets/statistics').catch(() => null), up('GET', '/albums').catch(() => [])]);
    return json(res, 200, { images: s?.images ?? null, videos: s?.videos ?? null, total: s?.total ?? null, albums: (al || []).length });
  }
  if (p === '/find' && m === 'POST') {
    const b = await body(), f = {}; const text = String(b.q || '').trim().slice(0, 200);
    if (b.type === 'image') f.type = 'IMAGE'; if (b.type === 'video') f.type = 'VIDEO'; if (b.favorite) f.isFavorite = true;
    const a = isoOk(b.from), z = isoOk(b.to); if (a) f.takenAfter = a; if (z) f.takenBefore = z;
    if (b.city) f.city = String(b.city).slice(0, 100); if (b.country) f.country = String(b.country).slice(0, 100);
    if (b.make) f.make = String(b.make).slice(0, 100); if (b.model) f.model = String(b.model).slice(0, 100);
    const pe = ids(b.people); if (pe.length) f.personIds = pe;
    if (text) { try { const r = await up('POST', '/search/smart', { ...f, query: text, page: Number(b.page) || 1, size: 100, withExif: true }); return json(res, 200, { items: (r.assets?.items || []).filter(live).map(mapAsset), next: r.assets?.nextPage ? Number(r.assets.nextPage) : null, mode: 'smart' }); } catch { f.originalFileName = text; } }
    return json(res, 200, { ...(await find(f, Number(b.page) || 1)), mode: text ? 'filename' : 'filter' });
  }
  if (p === '/download' && m === 'POST') {
    const b = await body(), l = ids(b.ids); if (!l.length) throw httpError(400, 'No assets given'); const c = conn();
    let r; try { r = await fetch(c.url + '/api/download/archive', { method: 'POST', headers: { 'x-api-key': c.key, 'content-type': 'application/json' }, body: JSON.stringify({ assetIds: l }) }); } catch { throw httpError(502, 'Could not reach Immich', 'upstream_unreachable'); }
    if (!r.ok) throw httpError(502, 'Immich could not make the download (' + r.status + ')', 'upstream_' + r.status);
    res.writeHead(200, { 'content-type': 'application/zip', 'content-disposition': 'attachment; filename="photos.zip"', 'cache-control': 'no-store' }); return Readable.fromWeb(r.body).on('error', () => res.destroy()).pipe(res);
  }
  throw httpError(404, 'Unknown photos route');
}

/* anything else in the Immich API, with the key added here: /api/immich/<path> reaches <immich>/api/<path> */
export async function handleImmichProxy(req, res, url) {
  const sub = url.pathname.replace(/^\/api\/immich/, '') || '/'; if (BLOCK.test(sub) || sub.includes('..')) throw httpError(403, 'That part of Immich is not available here', 'blocked');
  const c = conn(); const init = { method: req.method, headers: { 'x-api-key': c.key, accept: req.headers.accept || 'application/json' } };
  if (req.headers.range) init.headers.range = req.headers.range;
  if (req.method !== 'GET' && req.method !== 'HEAD') { init.body = await readBody(req, 50 * 1024 * 1024); if (init.body.length) init.headers['content-type'] = req.headers['content-type'] || 'application/json'; else delete init.body; }
  let r; try { r = await fetch(c.url + '/api' + sub + url.search, init); } catch { throw httpError(502, 'Could not reach Immich', 'upstream_unreachable'); }
  const out = { 'content-type': r.headers.get('content-type') || 'application/octet-stream', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
  for (const h of ['content-length', 'content-range', 'accept-ranges', 'content-disposition']) if (r.headers.get(h)) out[h] = r.headers.get(h);
  res.writeHead(r.status, out); if (!r.body || req.method === 'HEAD') return res.end(); return Readable.fromWeb(r.body).on('error', () => res.destroy()).pipe(res);
}
