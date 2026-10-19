/* Links: the OS talks to your Linkwarden (links.example.com) with an access token and shows bookmarks in its own app.
   The token stays on the server. Owner only. */
import { effective } from './config.js';
import { json, readJson, httpError } from './util.js';

const base = () => String(effective().bookmarks?.url || '').replace(/\/+$/, '');
const token = () => effective().bookmarks?.token || '';
const intOr = (v, d) => { const n = parseInt(v, 10); return Number.isFinite(n) && n > 0 ? n : d; };

function conf() {
  if (!base()) throw httpError(409, 'Add your Links address in Settings', 'not_configured');
  if (!token()) throw httpError(409, 'Add a Links access token in Settings', 'no_token');
}
async function lw(path, init = {}, timeout = 20000) {
  conf(); const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), timeout);
  try {
    const r = await fetch(base() + '/api/v1' + path, { ...init, signal: ctl.signal, headers: { authorization: 'Bearer ' + token(), accept: 'application/json', ...(init.headers || {}) } });
    if (r.status === 401 || r.status === 403) throw httpError(409, 'Links refused the token. Create a new one in Links (Settings, Access Tokens) and save it here', 'bad_token');
    const text = await r.text(); let d = null; try { d = text ? JSON.parse(text) : null; } catch { d = null; }
    if (!r.ok) throw httpError(r.status === 404 ? 404 : 502, (d && typeof d.response === 'string' && d.response) || 'Links returned ' + r.status, 'upstream');
    return d ? d.response : null;
  } catch (e) {
    if (e.status) throw e;
    throw httpError(502, e.name === 'AbortError' ? 'Links did not answer in time' : 'Could not reach Links: ' + (e.cause?.code || e.message), 'unreachable');
  } finally { clearTimeout(t); }
}
const view = (l) => ({
  id: l.id, name: l.name || l.url || 'Untitled', url: l.url || '', description: String(l.description || '').slice(0, 300), host: (() => { try { return new URL(l.url).hostname.replace(/^www\./, ''); } catch { return ''; } })(),
  collection: l.collection ? { id: l.collection.id, name: l.collection.name, color: l.collection.color || '' } : null,
  tags: (l.tags || []).map((t) => ({ id: t.id, name: t.name })), created: String(l.createdAt || '').slice(0, 10), pinned: Array.isArray(l.pinnedBy) ? l.pinnedBy.length > 0 : false
});

export async function bookmarksTest() {
  if (!base()) return { configured: false, connected: false, reason: 'Add the Links address first.' };
  if (!token()) return { configured: true, connected: false, reason: 'Add a Links access token.' };
  try { const c = await lw('/collections'); return { configured: true, connected: true, resources: (c || []).length, unit: 'collections' }; } catch (e) { return { configured: true, connected: false, reason: e.message }; }
}
export async function handleBookmarks(req, res, url, sess) {
  if (sess && sess.role && sess.role !== 'owner') throw httpError(403, 'Links is private to the owner', 'forbidden');
  const p = url.pathname.replace(/^\/api\/bookmarks/, '') || '/', m = req.method, q = url.searchParams; let x;
  if (p === '/status' && m === 'GET') {
    const out = { configured: !!base(), tokenSet: !!token(), url: base(), connected: false, reason: '' };
    if (!out.configured) out.reason = 'Add your Links address in Settings.'; else if (!out.tokenSet) out.reason = 'Add a Links access token in Settings.';
    else { try { const c = await lw('/collections'); out.connected = true; out.collections = (c || []).length; } catch (e) { out.reason = e.message; } }
    return json(res, 200, out);
  }
  if (p === '/meta' && m === 'GET') {
    const [cols, tags] = await Promise.all([lw('/collections'), lw('/tags')]);
    return json(res, 200, {
      collections: (cols || []).map((c) => ({ id: c.id, name: c.name, color: c.color || '', parent: c.parentId || null, count: c._count?.links ?? 0 })),
      tags: (tags || []).map((t) => ({ id: t.id, name: t.name, count: t._count?.links ?? 0 }))
    });
  }
  if (p === '/links' && m === 'GET') {
    const sp = new URLSearchParams(); const query = String(q.get('q') || '').trim().slice(0, 200);
    if (query) { sp.set('searchQueryString', query); for (const f of ['searchByName', 'searchByUrl', 'searchByDescription', 'searchByTextContent', 'searchByTags']) sp.set(f, 'true'); }
    const col = intOr(q.get('collection'), 0), tag = intOr(q.get('tag'), 0), cur = intOr(q.get('cursor'), 0);
    if (col) sp.set('collectionId', col); if (tag) sp.set('tagId', tag); if (cur) sp.set('cursor', cur);
    if (q.get('pinned') === '1') sp.set('pinnedOnly', 'true');
    sp.set('sort', q.get('sort') === 'old' ? '1' : '0');
    const list = (await lw('/links?' + sp.toString())) || [];
    return json(res, 200, { results: list.map(view), next: list.length >= 24 ? list[list.length - 1].id : null });
  }
  if (p === '/links' && m === 'POST') {
    const b = await readJson(req, 16 * 1024), u = String(b.url || '').trim();
    let ok = false; try { ok = /^https?:$/.test(new URL(u).protocol); } catch { ok = false; }
    if (!ok) throw httpError(400, 'Enter a full web address starting with http:// or https://', 'bad_request');
    const col = intOr(b.collection, 0), tags = String(b.tags || '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 20).map((name) => ({ name: name.slice(0, 50) }));
    const r = await lw('/links', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: u, name: String(b.name || '').trim().slice(0, 200), description: String(b.description || '').slice(0, 1000), type: 'url', tags, collection: col ? { id: col } : { name: 'Unorganized' } }) });
    return json(res, 201, view(r || {}));
  }
  if ((x = p.match(/^\/links\/(\d+)$/)) && m === 'DELETE') { await lw('/links/' + x[1], { method: 'DELETE' }); return json(res, 200, { ok: true }); }
  throw httpError(404, 'Unknown Links route');
}
