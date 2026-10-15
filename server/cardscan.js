/* Anands Card Scan: browse, edit and delete business cards from inside the OS.
 * Card Scan signs in with email and password and keeps a cookie session; this server does that login and keeps the cookie. */
import { effective } from './config.js';
import { json, rawFetch, httpError, readJson } from './util.js';

let sess = null;
const conn = () => {
  const s = effective().cards;
  if (!s.url || !s.user || !s.pass) throw httpError(409, 'Card Scan is not connected. Add its address, email and password in Settings.', 'not_configured');
  return { base: s.url.replace(/\/+$/, ''), user: s.user, pass: s.pass };
};
let inflight = null;
function login(c) { return inflight || (inflight = doLogin(c).finally(() => { inflight = null; })); }
async function doLogin(c) {
  const r = await rawFetch(c.base + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json', 'user-agent': 'Mozilla/5.0 AnandsOS' }, body: JSON.stringify({ email: c.user, password: c.pass }) });
  if (r.status === 401) throw httpError(502, 'Card Scan rejected the email or password', 'upstream_auth');
  const sc = r.headers.getSetCookie ? r.headers.getSetCookie() : [];
  const cookie = sc.map((x) => x.split(';')[0]).filter(Boolean).join('; ');
  if (!r.ok || !cookie) throw httpError(502, 'Card Scan answered ' + r.status + ' to the sign-in. Is this the Card Scan address?', 'upstream_error');
  sess = { cookie, key: c.base + '|' + c.user + '|' + c.pass }; return cookie;
}
async function csRaw(path, init = {}) {
  const c = conn(); const key = c.base + '|' + c.user + '|' + c.pass;
  const go = (cookie) => rawFetch(c.base + path, { ...init, headers: { cookie, ...(init.body ? { 'content-type': 'application/json' } : {}) } }, 30000);
  const used = sess && sess.key === key ? sess.cookie : await login(c);
  let r = await go(used);
  if (r.status === 401) r = await go(sess && sess.cookie !== used ? sess.cookie : await login(c));
  return r;
}
async function cs(path, init = {}) {
  const r = await csRaw(path, init);
  if (!r.ok) throw httpError([400, 403, 404, 409, 413, 429, 503].includes(r.status) ? r.status : 502, r.data?.error || 'Card Scan answered ' + r.status, r.data?.code || 'upstream_' + r.status);
  return r.data;
}
/* Photos may be stored as data: URLs or as links to object storage. The OS only allows images from itself, so links are fetched here and inlined. */
const imgCache = new Map();
async function inline(v, base) {
  if (typeof v !== 'string' || !v || v.startsWith('data:')) return v || null;
  let u; try { u = new URL(v, base + '/'); } catch { return null; }
  if (!/^https?:$/.test(u.protocol)) return null;
  const k = u.href; if (imgCache.has(k)) return imgCache.get(k);
  let out = null;
  try { const r = await rawFetch(k, {}, 12000); const ct = String(r.headers.get('content-type') || '').split(';')[0]; if (r.ok && /^image\//.test(ct) && r.buf && r.buf.length < 8 * 1024 * 1024) out = 'data:' + ct + ';base64,' + r.buf.toString('base64'); } catch {}
  if (out && out.length < 400000) { imgCache.set(k, out); if (imgCache.size > 400) imgCache.delete(imgCache.keys().next().value); }
  return out;
}
async function inlineCard(c, base, keys) { if (!c) return c; await Promise.all(keys.map(async (k) => { if (k in c) c[k] = await inline(c[k], base); })); return c; }
const uid = (v) => { if (!/^[0-9a-f-]{36}$/i.test(String(v || ''))) throw httpError(400, 'Bad card id'); return v; };
const FIELDS = ['name', 'designation', 'company', 'phone', 'phone2', 'phone3', 'email', 'email2', 'email3', 'whatsapp', 'website', 'address', 'notes'];
const IMG_KEYS = ['image', 'image_back', 'image_thumb', 'image_back_thumb'];
const PICK = (b, keys) => { const o = {}; for (const k of keys) if (k in b) o[k] = b[k]; return o; };
export async function handleCards(req, res, url) {
  const p = url.pathname, m = req.method;
  const base = () => conn().base;
  /* ---- Card Scan's other endpoints, under /api/cs/ ---- */
  if (p.startsWith('/api/cs/')) {
    const r = p.slice(7);
    if (m === 'GET' && r === '/reminders') { const d = await cs('/api/reminders'); await Promise.all((d.reminders || []).map((x) => inlineCard(x, base(), ['card_image_thumb']))); return json(res, 200, d); }
    let mm = r.match(/^\/reminders\/([0-9a-f-]{36})$/i);
    if (mm && m === 'PATCH') { const b = await readJson(req, 4096); return json(res, 200, await cs('/api/reminders/' + mm[1], { method: 'PATCH', body: JSON.stringify(PICK(b, ['done', 'snoozeToDate'])) })); }
    if (m === 'GET' && r === '/notifications') return json(res, 200, await cs('/api/notifications'));
    if (m === 'POST' && r === '/notifications/mark-read') { await readJson(req, 4096); return json(res, 200, await cs('/api/notifications/mark-read', { method: 'POST', body: '{}' })); }
    if (m === 'GET' && r === '/ai/status') return json(res, 200, await cs('/api/ai/status'));
    if (m === 'POST' && r === '/ai/extract-card') { const b = await readJson(req, 12 * 1024 * 1024); return json(res, 200, await cs('/api/ai/extract-card', { method: 'POST', body: JSON.stringify(PICK(b, ['front', 'back'])) })); }
    throw httpError(404, 'Unknown cards route');
  }
  /* ---- cards ---- */
  if (p === '/api/cards' && m === 'GET') {
    const q = new URLSearchParams(); for (const k of ['q', 'group', 'tag', 'limit', 'offset']) { const v = url.searchParams.get(k); if (v) q.set(k, v); }
    const [list, groups, stats] = await Promise.all([cs('/api/cards?' + q), cs('/api/groups').catch(() => ({ groups: [] })), cs('/api/cards/stats').catch(() => null)]);
    await Promise.all((list.cards || []).map((c) => inlineCard(c, base(), ['image_thumb'])));
    return json(res, 200, { ...list, groups: groups.groups || [], role: groups.role, stats });
  }
  if (p === '/api/cards' && m === 'POST') {
    const b = await readJson(req, 16 * 1024 * 1024); const out = {};
    for (const k of FIELDS) if (k in b) out[k] = String(b[k] ?? '').slice(0, 2000);
    for (const k of ['image', 'imageBack', 'imageThumb', 'imageBackThumb']) if (typeof b[k] === 'string' && b[k].startsWith('data:image/')) out[k] = b[k];
    if (b.groupId) out.groupId = String(b.groupId);
    if (Array.isArray(b.tags)) out.tags = b.tags.map((t) => String(t).slice(0, 40)).slice(0, 30);
    return json(res, 201, await cs('/api/cards', { method: 'POST', body: JSON.stringify(out) }));
  }
  if (p === '/api/cards/stats' && m === 'GET') return json(res, 200, await cs('/api/cards/stats'));
  if (p === '/api/cards/check-duplicate' && m === 'GET') {
    const q = new URLSearchParams(); for (const k of ['phone', 'email']) { const v = url.searchParams.get(k); if (v) q.set(k, v); }
    const d = await cs('/api/cards/check-duplicate?' + q); await Promise.all((d.matches || []).map((x) => inlineCard(x, base(), ['image_thumb']))); return json(res, 200, d);
  }
  if (p === '/api/cards/export' && m === 'GET') {
    const q = new URLSearchParams(); for (const k of ['groupId', 'ids']) { const v = url.searchParams.get(k); if (v) q.set(k, v); }
    const r = await csRaw('/api/cards/export?' + q); if (!r.ok) throw httpError(502, 'Card Scan could not export', 'upstream_' + r.status);
    res.writeHead(200, { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="contacts.csv"', 'cache-control': 'no-store' }); return res.end(r.buf);
  }
  if (p === '/api/cards/merge' && m === 'POST') { const b = await readJson(req, 64 * 1024); return json(res, 200, await cs('/api/cards/merge', { method: 'POST', body: JSON.stringify(PICK(b, ['primaryId', 'duplicateId', 'fields', 'groupId', 'keepImage'])) })); }
  if ((p === '/api/cards/bulk-move' || p === '/api/cards/bulk-delete') && m === 'POST') {
    const b = await readJson(req, 64 * 1024); const ids = (Array.isArray(b.ids) ? b.ids : []).filter((x) => /^[0-9a-f-]{36}$/i.test(String(x))).slice(0, 500);
    return json(res, 200, await cs(p, { method: 'POST', body: JSON.stringify(p.endsWith('move') ? { ids, groupId: String(b.groupId || '') } : { ids }) }));
  }
  const mm = p.match(/^\/api\/cards\/([0-9a-f-]{36})(?:\/(timeline|back-thumb|notes|reminders|share))?$/i);
  if (!mm) throw httpError(404, 'Unknown cards route');
  const id = uid(mm[1]), sub = mm[2];
  if (!sub) {
    if (m === 'GET') { const d = await cs('/api/cards/' + id); await inlineCard(d.card, base(), IMG_KEYS); return json(res, 200, d); }
    if (m === 'PATCH') {
      const b = await readJson(req, 16 * 1024 * 1024); const out = {};
      for (const k of FIELDS) if (k in b) out[k] = String(b[k] ?? '').slice(0, 2000);
      for (const k of ['image', 'imageBack', 'imageThumb', 'imageBackThumb']) if (k in b) out[k] = typeof b[k] === 'string' && b[k].startsWith('data:image/') ? b[k] : null;
      if (b.groupId) out.groupId = String(b.groupId);
      if (Array.isArray(b.tags)) out.tags = b.tags.map((t) => String(t).slice(0, 40)).slice(0, 30);
      if (b.markContacted === true) out.markContacted = true;
      const d = await cs('/api/cards/' + id, { method: 'PATCH', body: JSON.stringify(out) }); await inlineCard(d.card, base(), IMG_KEYS); return json(res, 200, d);
    }
    if (m === 'DELETE') { await cs('/api/cards/' + id, { method: 'DELETE' }); return json(res, 200, { ok: true }); }
  }
  if (sub === 'timeline' && m === 'GET') return json(res, 200, await cs(`/api/cards/${id}/timeline`));
  if (sub === 'back-thumb' && m === 'GET') { const d = await cs(`/api/cards/${id}/back-thumb`); return json(res, 200, { imageBackThumb: await inline(d.imageBackThumb, base()) }); }
  if (sub === 'notes' && m === 'POST') { const b = await readJson(req, 8192); return json(res, 200, await cs(`/api/cards/${id}/notes`, { method: 'POST', body: JSON.stringify({ note: String(b.note || '') }) })); }
  if (sub === 'reminders' && m === 'POST') { const b = await readJson(req, 8192); return json(res, 200, await cs(`/api/cards/${id}/reminders`, { method: 'POST', body: JSON.stringify({ dueDate: String(b.dueDate || ''), note: String(b.note || '').slice(0, 500) }) })); }
  if (sub === 'share' && m === 'POST') { const b = await readJson(req, 4096); const d = await cs(`/api/cards/${id}/share`, { method: 'POST', body: JSON.stringify({ validityDays: Number(b.validityDays), maxViews: b.maxViews == null ? null : Number(b.maxViews) }) }); return json(res, 200, { ...d, url: base() + '/c/' + d.shareToken }); }
  if (sub === 'share' && m === 'DELETE') { await cs(`/api/cards/${id}/share`, { method: 'DELETE' }); return json(res, 200, { ok: true }); }
  throw httpError(405, 'Method not allowed');
}
export async function test() { sess = null; try { const d = await cs('/api/cards/stats'); return { configured: true, connected: true, resources: d?.total ?? 0, unit: 'cards' }; } catch (e) { return { configured: e.code !== 'not_configured', connected: false, reason: e.message }; } }
export const clearCardsCache = () => { sess = null; };
