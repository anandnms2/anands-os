/* Anands Pulse (control.anands.xyz) read access. Pulse has a read-only REST API with per-tool tokens (Settings, Automation, Access for your AI tools).
 * The token stays on this server. Nothing here can send, change or delete anything in Pulse. */
import { effective } from './config.js';
import { json, rawFetch, httpError, readJson } from './util.js';

const conn = () => {
  const s = effective().pulse;
  if (!s.url || !s.token) throw httpError(409, 'Pulse is not connected: ' + (!s.url && !s.token ? 'the address and the token are both empty' : !s.url ? 'the address is empty' : 'the token is empty (paste the pulse_ token and save again)') + '. Add them in Settings.', 'not_configured');
  return { base: s.url.replace(/\/+$/, ''), token: s.token };
};
let cache = new Map();
async function get(path, ttl = 15000) {
  const c = conn(); const key = c.base + path; const hit = cache.get(key);
  if (hit && Date.now() - hit.t < ttl) return hit.d;
  const r = await rawFetch(c.base + '/api/v1' + path, { headers: { authorization: 'Bearer ' + c.token, accept: 'application/json' } }, 20000);
  if (r.status >= 300 && r.status < 400) throw httpError(502, 'Pulse redirected to ' + (r.headers.get('location') || 'another address') + '. Use that address in Settings (usually https:// and no path).', 'upstream_redirect');
  if (r.status === 403 || (r.ok && r.data == null)) throw httpError(502, r.status === 403 ? 'Pulse (or a proxy in front of it) refused the request with 403. If Pulse sits behind a login page or firewall, /api/v1 must be allowed through.' : 'That address did not answer like the Pulse API (got a web page). Check the address and that Pulse has the Access for your AI tools feature deployed.', 'upstream_403');
  if (r.status === 401) throw httpError(502, 'Pulse rejected the token. Create a new one in Pulse: Settings, Automation, Access for your AI tools.', 'upstream_auth');
  if (r.status === 429) throw httpError(429, 'Pulse says too many requests. Try again in a moment.', 'rate_limited');
  if (!r.ok) throw httpError(r.status === 404 ? 404 : 502, r.data?.error || 'Pulse answered ' + r.status, 'upstream_' + r.status);
  if (cache.size > 200) cache.clear();
  cache.set(key, { t: Date.now(), d: r.data }); return r.data;
}
const num = (v, d, max) => Math.min(max, Math.max(1, parseInt(v, 10) || d));
export async function handlePulse(req, res, url) {
  const p = url.pathname.replace(/^\/api\/pulse/, '') || '/', sp = url.searchParams;
  if (p === '/status') { const c = effective().pulse; return json(res, 200, { url: !!c.url, token: !!c.token, session: !!(c.url && c.user && c.pass) }); }
  if (p.startsWith('/s/') || p === '/s') return handleSession(req, res, url, p.slice(2));
  if (req.method !== 'GET') throw httpError(405, 'Pulse is read-only from here');
  if (p === '/me') return json(res, 200, await get('/me'));
  if (p === '/today') return json(res, 200, await get('/today'));
  if (p === '/health') return json(res, 200, await get('/health', 10000));
  if (p === '/lists') return json(res, 200, await get('/lists'));
  if (p === '/waiting') return json(res, 200, await get('/waiting?limit=' + num(sp.get('limit'), 50, 100)));
  if (p === '/tasks') return json(res, 200, await get('/tasks?status=' + (['open', 'done', 'all'].includes(sp.get('status')) ? sp.get('status') : 'open') + '&limit=' + num(sp.get('limit'), 100, 100)));
  if (p === '/chats') return json(res, 200, await get('/chats?limit=' + num(sp.get('limit'), 50, 50) + (sp.get('all') === '1' ? '&all=1' : '')));
  if (p === '/search') { const q = String(sp.get('q') || '').slice(0, 200); if (!q.trim()) throw httpError(400, 'Type something to search for'); return json(res, 200, await get('/search?limit=' + num(sp.get('limit'), 30, 50) + '&q=' + encodeURIComponent(q), 5000)); }
  if (p === '/tracked') return json(res, 200, await get('/tracked?q=' + encodeURIComponent(String(sp.get('q') || '').slice(0, 60))));
  let m = p.match(/^\/tracked\/(.{1,120})$/); if (m) return json(res, 200, await get('/tracked/' + encodeURIComponent(decodeURIComponent(m[1])) + '?limit=40'));
  m = p.match(/^\/chats\/([A-Za-z0-9_-]{1,40})\/messages$/); if (m) return json(res, 200, await get('/chats/' + m[1] + '/messages?limit=' + num(sp.get('limit'), 60, 100), 5000));
  throw httpError(404, 'Unknown Pulse route');
}
export async function test() {
  cache.clear(); scache.clear(); sess = null; const c = effective().pulse, out = [];
  if (c.url && c.user && c.pass) { try { const b = await sjson('/api/p/bootstrap'); return { configured: true, connected: true, resources: (b.items || []).length, unit: 'messages in your inbox' + (c.token ? '' : ''), reason: undefined }; } catch (e) { return { configured: true, connected: false, reason: e.message }; } }
  try { await get('/me', 0); let n = null; try { n = (await get('/today', 0)).unread_items; } catch {} return { configured: true, connected: true, resources: n ?? undefined, unit: 'unread items' }; } catch (e) { return { configured: e.code !== 'not_configured', connected: false, reason: e.message }; }
}
export async function pulseContext() {
  const c = effective().pulse;
  if (c.url && c.user && c.pass) {
    try {
      const b = await sjson('/api/p/bootstrap', null, 20000), its = (b.items || []).filter((i) => !i.handled), td = b.now?.today;
      const row = (i) => ({ from: i.from, where: i.id[0] === 'e' ? i.subj : (b.groups || []).find((g) => g.id === i.g)?.name, summary: String(i.sum || i.snip || '').slice(0, 160), at: i.ts, channel: (b.settings?.names || {})[i.ch] || i.ch, urgent: i.cls === 'urgent' || undefined });
      return { mode: b.settings?.mode === 'work' ? 'work' : 'personal', today: td, unread: its.filter((i) => !i.read && i.cls !== 'noise').length, urgent: its.filter((i) => i.cls === 'urgent').slice(0, 12).map(row), needReply: its.filter((i) => i.reply).slice(0, 12).map(row), latest: its.slice(0, 25).map(row),
        openTasks: (b.tasks || []).filter((t) => t.status !== 'done').slice(0, 30).map((t) => ({ title: t.title, due: t.due, priority: t.pri, area: t.dom })), events: (b.events || []).filter((e) => e.d >= td).slice(0, 20).map((e) => ({ title: e.title, date: e.d, from: e.allDay ? 'all day' : e.s, location: e.loc })),
        waitingOnOthers: (b.waitsList || []).slice(0, 15).map((w) => ({ what: w.title, from: w.who || w.where, overdue: w.overdue })) };
    } catch (e) { if (!effective().pulse.token) return e.code === 'not_configured' ? null : { connected: false, note: e.message }; }
  }
  try { const [today, tasks, waiting, chats] = await Promise.all([get('/today'), get('/tasks?status=open&limit=25'), get('/waiting?limit=20'), get('/chats?limit=15')]); return { today, openTasks: tasks.tasks, waitingOnOthers: waiting.waiting, unreadChats: chats.chats }; } catch (e) { return e.code === 'not_configured' ? null : { connected: false, note: e.message }; }
}
export const clearPulseCache = () => { cache.clear(); sess = null; };

/* ---------- full Pulse: sign in with your Pulse email and password (like Card Scan) so the OS can show mail, WhatsApp, tasks and calendar ----------
 * Only a fixed list of Pulse routes is reachable from here. Nothing can send mail or WhatsApp messages or change Pulse settings except the Personal/Work switch. */
let sess = null, inflight = null;
function sconn() {
  const s = effective().pulse;
  if (!s.url || !s.user || !s.pass) throw httpError(409, 'Add your Pulse address, email and password in Settings to see mail, WhatsApp, tasks and the calendar here.', 'not_configured');
  return { base: s.url.replace(/\/+$/, ''), user: s.user, pass: s.pass };
}
function slogin(c) { return inflight || (inflight = doLogin(c).finally(() => { inflight = null; })); }
async function doLogin(c) {
  const r = await rawFetch(c.base + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json', 'user-agent': 'Mozilla/5.0 AnandsOS' }, body: JSON.stringify({ email: c.user, password: c.pass }) }, 20000);
  if (r.status >= 300 && r.status < 400) throw httpError(502, 'Pulse redirected to ' + (r.headers.get('location') || 'another address') + '. Use that address in Settings.', 'upstream_redirect');
  if (r.status === 401 || r.status === 403) throw httpError(502, (r.data && r.data.error) || 'Pulse rejected the email or password', 'upstream_auth');
  if (r.status === 429) throw httpError(429, 'Pulse says too many sign-in attempts. Wait a few minutes.', 'rate_limited');
  const sc = r.headers.getSetCookie ? r.headers.getSetCookie() : [];
  const cookie = sc.map((x) => x.split(';')[0]).filter(Boolean).join('; ');
  if (!r.ok || !cookie) throw httpError(502, 'Pulse answered ' + r.status + ' to the sign-in. Is this the Pulse address?', 'upstream_error');
  sess = { cookie, key: c.base + '|' + c.user + '|' + c.pass }; return cookie;
}
async function sraw(path, init, timeout = 30000) {
  init = init || {};
  const c = sconn(), key = c.base + '|' + c.user + '|' + c.pass;
  const go = (cookie) => rawFetch(c.base + path, { ...init, headers: { cookie, accept: '*/*', ...(init.body ? { 'content-type': 'application/json' } : {}), ...(init.headers || {}) } }, timeout);
  const used = sess && sess.key === key ? sess.cookie : await slogin(c);
  let r = await go(used);
  if (r.status === 401) r = await go(sess && sess.cookie !== used ? sess.cookie : await slogin(c));
  return r;
}
const scache = new Map();
async function sjson(path, init, ttl = 0) {
  const k = !init && ttl ? path : null, hit = k && scache.get(k); if (hit && Date.now() - hit.t < ttl) return hit.d;
  const r = await sraw(path, init);
  if (!r.ok) throw httpError(r.status === 404 ? 404 : [400, 403, 409, 413, 422, 429].includes(r.status) ? r.status : 502, (r.data && r.data.error) || 'Pulse answered ' + r.status, 'upstream_' + r.status);
  if (r.data == null) throw httpError(502, 'Pulse did not answer with data. Is the address right?', 'upstream_html');
  if (k) { if (scache.size > 100) scache.clear(); scache.set(k, { t: Date.now(), d: r.data }); }
  return r.data;
}
const REF = /^[ew]\d{1,12}$/, GID = /^g\d{1,12}$/, TID = /^t\d{1,12}$/, NUM = /^\d{1,12}$/;
const qs = (sp, keys) => { const o = new URLSearchParams(); for (const k of keys) { const v = sp.get(k); if (v != null && v !== '') o.set(k, String(v).slice(0, 200)); } const t = o.toString(); return t ? '?' + t : ''; };
async function stream(res, r, extra = {}) {
  if (!r.ok) throw httpError(r.status === 404 ? 404 : 502, (r.data && r.data.error) || 'Pulse answered ' + r.status, 'upstream_' + r.status);
  const out = { 'content-type': r.headers.get('content-type') || 'application/octet-stream', 'cache-control': 'private, max-age=300', 'x-content-type-options': 'nosniff', ...extra };
  const cd = r.headers.get('content-disposition'); if (cd) out['content-disposition'] = cd;
  res.writeHead(200, out); res.end(r.buf);
}
async function handleSession(req, res, url, p) {
  const sp = url.searchParams, m = req.method; let x;
  if (m === 'GET') {
    if (p === '/bootstrap') return json(res, 200, await sjson('/api/p/bootstrap', null, 8000));
    if (p === '/items') return json(res, 200, await sjson('/api/p/items' + qs(sp, ['q', 'before', 'limit'])));
    if ((x = p.match(/^\/item\/([ew]\d+)$/))) return json(res, 200, await sjson('/api/p/items/' + x[1]));
    if ((x = p.match(/^\/chat\/(g\d+)$/))) return json(res, 200, await sjson('/api/p/groups/' + x[1] + '/messages' + qs(sp, ['before', 'around', 'limit'])));
    if ((x = p.match(/^\/media\/(\d+)(\/thumb)?$/))) { const r = await sraw('/api/p/media/' + x[1] + (x[2] || '') + (sp.get('download') === '1' ? '?download=1' : ''), {}, 60000); return stream(res, r); }
    if ((x = p.match(/^\/mailhtml\/(\d+)$/))) {
      const r = await sraw('/api/emails/' + x[1] + '/html?images=' + (sp.get('images') === '1' ? '1' : '0')); if (!r.ok) throw httpError(404, 'No formatted version of this email', 'upstream_' + r.status);
      return void (res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'private, max-age=60', 'x-frame-options': 'SAMEORIGIN', 'referrer-policy': 'no-referrer', 'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; img-src data:" + (sp.get('images') === '1' ? ' https:' : '') + "; font-src data:; sandbox allow-popups allow-popups-to-escape-sandbox; base-uri 'none'; form-action 'none'" }), res.end(r.buf));
    }
    if ((x = p.match(/^\/att\/(\d+)\/(\d+)$/))) { const r = await sraw('/api/p/emails/' + x[1] + '/att/' + x[2] + (sp.get('download') === '1' ? '?download=1' : ''), {}, 90000); return stream(res, r); }
    if (p === '/waits') return json(res, 200, await sjson('/api/p/waits', null, 8000));
    if (p === '/lists') return json(res, 200, await sjson('/api/p/lists', null, 8000));
    if (p === '/entities') return json(res, 200, await sjson('/api/p/entities' + qs(sp, ['q', 'days']), null, 8000));
    if ((x = p.match(/^\/entity\/(.{1,120})$/))) return json(res, 200, await sjson('/api/p/entity/' + encodeURIComponent(decodeURIComponent(x[1])) + qs(sp, ['limit'])));
    if (p === '/health') return json(res, 200, await sjson('/api/p/health', null, 8000));
    if (p === '/test') { sess = null; const b = await sjson('/api/p/bootstrap'); return json(res, 200, { ok: true, items: (b.items || []).length, user: b.user && b.user.email }); }
  }
  if (m === 'POST' || m === 'PUT' || m === 'PATCH' || m === 'DELETE') {
    const post = (path, body) => sjson(path, { method: 'POST', body: JSON.stringify(body || {}) });
    scache.clear();
    if (m === 'POST' && (x = p.match(/^\/item\/([ew]\d+)\/(read|handled|task)$/))) { await readJson(req, 4096); return json(res, 200, await post('/api/p/items/' + x[1] + '/' + x[2])); }
    if (m === 'POST' && (x = p.match(/^\/chat\/(g\d+)\/action$/))) { const b = await readJson(req, 4096); if (!['done', 'read', 'unread'].includes(b.action)) throw httpError(400, 'Unknown action'); return json(res, 200, await post('/api/p/chats/' + x[1] + '/action', { action: b.action })); }
    if (m === 'POST' && (x = p.match(/^\/media\/(\d+)\/load$/))) { await readJson(req, 4096); return json(res, 200, await post('/api/p/media/' + x[1] + '/load')); }
    if (m === 'POST' && p === '/task') { const b = await readJson(req, 8192); const o = { title: String(b.title || '').slice(0, 200), dom: b.dom === 'Personal' ? 'Personal' : 'Work', pri: ['low', 'normal', 'high', 'urgent'].includes(b.pri) ? b.pri : 'normal' }; if (/^\d{4}-\d\d-\d\d$/.test(b.due_date || '')) o.due_date = b.due_date; if (/^\d\d:\d\d$/.test(b.due_time || '')) o.due_time = b.due_time; return json(res, 200, await post('/api/p/tasks', o)); }
    if (m === 'PATCH' && (x = p.match(/^\/task\/(t\d+)$/))) { const b = await readJson(req, 8192); const o = {}; if (['todo', 'doing', 'done'].includes(b.status)) o.status = b.status; if (typeof b.title === 'string') o.title = b.title.slice(0, 200); if (['low', 'normal', 'high', 'urgent'].includes(b.pri)) o.pri = b.pri; if ('due_date' in b) o.due_date = /^\d{4}-\d\d-\d\d$/.test(b.due_date || '') ? b.due_date : null; if ('due_time' in b) o.due_time = /^\d\d:\d\d$/.test(b.due_time || '') ? b.due_time : null; return json(res, 200, await sjson('/api/p/tasks/' + x[1], { method: 'PATCH', body: JSON.stringify(o) })); }
    if (m === 'DELETE' && (x = p.match(/^\/task\/(t\d+)$/))) return json(res, 200, await sjson('/api/p/tasks/' + x[1], { method: 'DELETE' }));
    if (m === 'PUT' && p === '/mode') { const b = await readJson(req, 1024); if (!['personal', 'work'].includes(b.mode)) throw httpError(400, 'Choose personal or work'); return json(res, 200, await sjson('/api/p/settings', { method: 'PUT', body: JSON.stringify({ mode: b.mode }) })); }
  }
  throw httpError(404, 'Unknown Pulse route');
}
