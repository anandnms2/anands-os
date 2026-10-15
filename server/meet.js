/* Live meetings and peer-to-peer apps, on your own server.
 *  - Signalling: a small relay that hands connection set-up messages between two browsers (the media and data then flow directly).
 *    Server-sent events carry messages down, plain POSTs carry them up. Nothing here sees audio, video or app data.
 *  - Rooms: the directory that maps a meeting link (abc-defg-hij) to the host's current invite, so a link keeps working all day.
 *  - Relays: STUN, and optionally your own TURN server (coturn), for guests behind strict firewalls.
 * Guests need no account: a meeting link and a random invite are the only capabilities, and every route is rate limited. */
import crypto from 'node:crypto';
import { effective } from './config.js';
import { sign, verify, sessionOf, userFromSession } from './session.js';
import { json, readJson, httpError, clientIp, UUID } from './util.js';

/* ---------- small helpers ---------- */
const rand = (n) => crypto.randomBytes(n).toString('base64url');
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const eq = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const hits = new Map();
function limited(ip, key, max, windowMs = 60000) {
  const now = Date.now(), k = ip + '|' + key, a = (hits.get(k) || []).filter((t) => now - t < windowMs); a.push(now); hits.set(k, a);
  return a.length > max;
}
setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (!v.length || now - v[v.length - 1] > 120000) hits.delete(k); }, 60000).unref();
const tooMany = (res) => { res.setHeader('retry-after', '30'); throw httpError(429, 'Too many requests. Try again in a moment.', 'rate_limited'); };

/* ---------- rooms: meeting link -> current invite ---------- */
const CODE = /^(?:[a-z]{3}-[a-z]{4}-[a-z]{3}|[a-z]{4}-[a-z]{4}-[a-z]{4})$/;
const HOLD_MS = 75000, IDLE_MS = 6 * 3600 * 1000, MAX_ROOMS = 2000;
const rooms = new Map();
const roomView = (r) => r ? { host: r.host, participants: r.participants, startedAt: r.startedAt, age: Date.now() - r.updated, ...(r.invite ? { invite: r.invite, grant: r.grant } : {}) } : null;
setInterval(() => { const now = Date.now(); for (const [k, r] of rooms) if (now - r.updated > IDLE_MS) rooms.delete(k); }, 5 * 60000).unref();

export async function handleRooms(req, res, url) {
  const m = /^\/v1\/rooms\/([^/]+?)(\/end)?$/.exec(url.pathname); if (!m) throw httpError(404, 'Not found');
  let code; try { code = decodeURIComponent(m[1]); } catch { code = ''; }
  const ip = clientIp(req); if (limited(ip, 'room', 240)) tooMany(res);
  if (!CODE.test(code)) throw httpError(400, 'Bad meeting code', 'bad_code');
  const cur = rooms.get(code);
  if (req.method === 'GET' && !m[2]) return json(res, 200, { ok: true, room: roomView(cur) });
  if (req.method !== 'POST') throw httpError(405, 'Method not allowed');
  const b = await readJson(req, 4096);
  const secret = typeof b.secret === 'string' && b.secret.length >= 8 && b.secret.length <= 200 ? sha(b.secret) : null; if (!secret) throw httpError(400, 'A secret is needed', 'bad_request');
  const term = Number.isInteger(b.term) && b.term >= 0 ? b.term : 0;
  if (m[2]) { // end
    if (cur && eq(cur.secret, secret) && term >= cur.term) { rooms.delete(code); return json(res, 200, { ok: true, ended: true }); }
    return json(res, 200, { ok: true, ended: false });
  }
  if (limited(ip, 'roomw', 90)) tooMany(res);
  const fresh = cur && Date.now() - cur.updated < HOLD_MS;
  if (cur && fresh && !eq(cur.secret, secret)) return json(res, 409, { ok: false, reason: 'held', room: roomView(cur) });
  if (cur && term < cur.term) return json(res, 409, { ok: false, reason: 'stale_term', room: roomView(cur) });
  if (!cur && rooms.size >= MAX_ROOMS) throw httpError(503, 'Too many meetings right now', 'busy');
  const str = (v, n) => (typeof v === 'string' && v && v.length <= n ? v : null);
  const next = {
    secret, term, updated: Date.now(),
    invite: str(b.invite, 512), grant: str(b.grant, 512), host: typeof b.host === 'string' && b.host ? b.host.slice(0, 80) : (cur?.host || null),
    participants: Number.isInteger(b.participants) && b.participants > 0 && b.participants < 1000 ? b.participants : 1,
    startedAt: cur && eq(cur.secret, secret) && cur.startedAt ? cur.startedAt : Date.now()
  };
  rooms.set(code, next);
  return json(res, 200, { ok: true, room: roomView(next) });
}

/* ---------- relays (STUN / TURN) ---------- */
const GRANT_TTL = 12 * 3600;
function stunList() { const l = String(effective().turn?.stun || '').split(',').map((s) => s.trim()).filter(Boolean); return l.length ? l : ['stun:stun.l.google.com:19302', 'stun:stun.cloudflare.com:3478']; }
function iceServers(allowTurn) {
  const out = [{ urls: stunList() }]; const t = effective().turn || {};
  const urls = String(t.urls || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (allowTurn && urls.length && t.secret) { // coturn "use-auth-secret": short-lived credentials
    const exp = Math.floor(Date.now() / 1000) + 6 * 3600, username = exp + ':' + rand(6);
    out.push({ urls, username, credential: crypto.createHmac('sha1', t.secret).update(username).digest('base64') });
  }
  return out;
}
const grantOk = (g) => { const o = verify(g); return !!(o && o.k === 'turn'); };

/* ---------- signalling ---------- */
const hosts = new Map();   // invite -> host
const eps = new Map();     // endpoint id -> { id, key, kind, host, q, lost, res }
const QUEUE_KEEP_MS = 60000, LOST_MS = 45000, MAX_HOSTS = 400, MAX_CLIENTS = 60;

function push(ep, msg) {
  const item = { id: ++ep.seq, at: Date.now(), data: JSON.stringify(msg) }; ep.q.push(item); if (ep.q.length > 400) ep.q.shift();
  if (ep.res) { try { ep.res.write(`id: ${item.id}\ndata: ${item.data}\n\n`); } catch {} }
}
function drop(ep, why) {
  if (!eps.has(ep.id)) return; eps.delete(ep.id);
  try { ep.res?.end(); } catch {}
  if (ep.kind === 'host') {
    hosts.delete(ep.invite);
    for (const cid of [...ep.clients]) { const c = eps.get(cid); if (c) { push(c, { t: 'host-gone', reason: why }); setTimeout(() => drop(c, 'host-gone'), 2000).unref(); } }
  } else { const h = eps.get(ep.hostId); if (h) { h.clients.delete(ep.id); push(h, { t: 'client-gone', cid: ep.id }); } }
}
setInterval(() => {
  const now = Date.now();
  for (const ep of [...eps.values()]) {
    if (ep.res) { try { ep.res.write('data: {"t":"hb"}\n\n'); } catch {} }
    else if (ep.lost && now - ep.lost > LOST_MS) drop(ep, 'signal-lost');
    while (ep.q.length && now - ep.q[0].at > QUEUE_KEEP_MS) ep.q.shift();
  }
}, 15000).unref();

function who(req, b) {
  const s = sessionOf(req);
  if (s) { const u = userFromSession(s); return { uuid: u.uuid, username: u.username, signedIn: true }; }
  const t = typeof b?.anonToken === 'string' && UUID.test(b.anonToken) ? b.anonToken : null;
  if (!t) throw httpError(401, 'Sign in, or join as a guest', 'auth_required');
  return { uuid: t, username: 'anonymous', signedIn: false };
}
const need = (b) => { const ep = eps.get(String(b?.id || '')); if (!ep || !eq(ep.key, String(b?.key || ''))) throw httpError(404, 'Unknown connection', 'unknown_endpoint'); return ep; };

export async function handlePeer(req, res, url) {
  const p = url.pathname, ip = clientIp(req);
  if (p === '/_peer/events' && req.method === 'GET') {
    if (limited(ip, 'ev', 120)) tooMany(res);
    const ep = eps.get(url.searchParams.get('id') || ''); if (!ep || !eq(ep.key, url.searchParams.get('key') || '')) { res.writeHead(404, { 'content-type': 'text/plain' }); return res.end('unknown'); }
    try { ep.res?.end(); } catch {}
    res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store, no-transform', connection: 'keep-alive', 'x-accel-buffering': 'no' });
    res.write('retry: 1500\n\n'); ep.res = res; ep.lost = 0;
    const last = Number(req.headers['last-event-id'] || url.searchParams.get('last') || 0) || 0;
    for (const it of ep.q) if (it.id > last) res.write(`id: ${it.id}\ndata: ${it.data}\n\n`);
    req.on('close', () => { if (ep.res === res) { ep.res = null; ep.lost = Date.now(); } });
    return;
  }
  if (req.method !== 'POST') throw httpError(405, 'Method not allowed');
  if (req.headers['x-aos'] !== '1') throw httpError(403, 'Missing x-aos header', 'csrf');
  if (limited(ip, 'pw', 600)) tooMany(res);
  const b = await readJson(req, 96 * 1024);

  if (p === '/_peer/serve') {
    const user = who(req, b);
    if (b.id && b.key) { const old = eps.get(String(b.id)); if (old && old.kind === 'host' && eq(old.key, String(b.key))) return json(res, 200, { id: old.id, key: old.key, inviteCode: old.invite, resumed: true, user }); }
    if (limited(ip, 'serve', 30, 600000)) tooMany(res);
    if (hosts.size >= MAX_HOSTS) throw httpError(503, 'Too many live sessions right now', 'busy');
    const ep = { id: 'h_' + rand(9), key: rand(24), kind: 'host', invite: 'pi' + rand(10).replace(/[-_]/g, 'x'), user, clients: new Set(), q: [], seq: 0, lost: Date.now(), res: null };
    eps.set(ep.id, ep); hosts.set(ep.invite, ep);
    return json(res, 200, { id: ep.id, key: ep.key, inviteCode: ep.invite, resumed: false, user });
  }
  if (p === '/_peer/connect') {
    const user = who(req, b); if (limited(ip, 'conn', 120)) tooMany(res);
    const h = hosts.get(String(b.invite || ''));
    if (!h) throw httpError(404, 'Invalid invite code', 'invalid_invite');
    if (h.clients.size >= MAX_CLIENTS) throw httpError(503, 'This session is full', 'full');
    const ep = { id: 'c_' + rand(9), key: rand(24), kind: 'client', hostId: h.id, user, q: [], seq: 0, lost: Date.now(), res: null };
    eps.set(ep.id, ep); h.clients.add(ep.id);
    push(h, { t: 'join', cid: ep.id, user: { uuid: user.uuid, username: user.username } });
    return json(res, 200, { id: ep.id, key: ep.key, owner: { uuid: h.user.uuid, username: h.user.username } });
  }
  if (p === '/_peer/signal') {
    const ep = need(b); const data = b.data; if (data == null || JSON.stringify(data).length > 64 * 1024) throw httpError(400, 'Bad message', 'bad_request');
    if (ep.kind === 'client') { const h = eps.get(ep.hostId); if (!h) throw httpError(410, 'The session has ended', 'invalid_invite'); push(h, { t: 'sig', cid: ep.id, data }); }
    else { const c = eps.get(String(b.to || '')); if (!c || c.hostId !== ep.id) throw httpError(404, 'That guest has left', 'unknown_endpoint'); push(c, { t: 'sig', data }); }
    return json(res, 200, { ok: true });
  }
  if (p === '/_peer/close') { const ep = need(b); drop(ep, String(b.reason || 'closed').slice(0, 100)); return json(res, 200, { ok: true }); }
  if (p === '/_peer/ice') {
    const allow = !!sessionOf(req) || (typeof b.turnGrant === 'string' && grantOk(b.turnGrant));
    return json(res, 200, { iceServers: iceServers(allow), relay: allow && iceServers(true).length > 1 });
  }
  if (p === '/_peer/grant') {
    if (!sessionOf(req)) throw httpError(401, 'Sign in first', 'auth_required');
    const ttl = GRANT_TTL; return json(res, 200, { grant: sign({ k: 'turn' }, ttl), expiresAt: Math.floor(Date.now() / 1000) + ttl });
  }
  throw httpError(404, 'Not found');
}

export const isPeerPath = (p) => p.startsWith('/_peer/');
export const isRoomPath = (p) => p.startsWith('/v1/rooms/');
export const stats = () => ({ rooms: rooms.size, hosts: hosts.size, endpoints: eps.size });
