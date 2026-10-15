// In-memory stand-ins for Beszel (PocketBase), wg-easy v15 and Card Scan, for tests.
import http from 'node:http';
const send = (res, code, body, h = {}) => { const s = typeof body === 'string' ? body : JSON.stringify(body); res.writeHead(code, { 'content-type': typeof body === 'string' ? 'text/plain' : 'application/json', ...h }); res.end(s); };
const body = (req) => new Promise((r) => { let b = ''; req.on('data', (d) => (b += d)); req.on('end', () => { try { r(JSON.parse(b || '{}')); } catch { r({}); } }); });
const listen = (srv) => new Promise((r) => srv.listen(0, '127.0.0.1', () => r(srv)));

export const beszel = { logins: 0 };
export async function startBeszel() {
  return listen(http.createServer(async (req, res) => {
    const u = new URL(req.url, 'http://x'), p = u.pathname;
    if (p === '/api/collections/users/auth-with-password') { const b = await body(req); if (b.identity === 'ro@x.io' && b.password === 'pw') { beszel.logins++; return send(res, 200, { token: 'T' + beszel.logins }); } return send(res, 400, { message: 'bad' }); }
    if (req.headers.authorization !== 'T' + beszel.logins) return send(res, 401, { message: 'no' });
    if (p === '/api/collections/systems/records') return send(res, 200, { items: [
      { id: 'sysaaa111', name: 'oracle-1', host: '10.0.0.1', status: 'up', updated: '2026-10-15 10:00:00Z', info: { cpu: 12.34, mp: 45.6, dp: 61, u: 360000, la: [0.1, 0.2, 0.3], v: '0.12', sv: [10, 1] } },
      { id: 'sysbbb222', name: 'home-nas', host: '10.0.0.2', status: 'down', updated: '2026-10-14 10:00:00Z', info: {} }] });
    if (p === '/api/collections/alerts/records') return send(res, 200, { items: [{ system: 'sysbbb222', name: 'Status', value: 0, triggered: true }] });
    if (p === '/api/collections/systems/records/sysaaa111') return send(res, 200, { id: 'sysaaa111', name: 'oracle-1', host: '10.0.0.1', status: 'up', info: { cpu: 12 } });
    if (p === '/api/collections/system_stats/records') return send(res, 200, { items: [{ created: '2026-10-15 10:01:00Z', stats: { cpu: 20, mp: 50, dp: 61, mu: 4, m: 8, du: 60, d: 100 } }, { created: '2026-10-15 10:00:00Z', stats: { cpu: 10, mp: 40 } }] });
    if (p === '/api/collections/containers/records') return send(res, 200, { items: [{ id: 'c1', name: 'immich', status: 'running', health: 1, cpu: 2.5, memory: 300 }] });
    if (p === '/api/collections/system_details/records') return send(res, 200, { items: [{ hostname: 'oracle-1', os_name: 'Ubuntu 24.04', kernel: '6.8', cpu: 'ARM Neoverse', cores: 4 }] });
    send(res, 404, { message: 'nope' });
  }));
}

export const wgState = { clients: [
  { id: 1, name: 'Anand phone', enabled: true, ipv4Address: '10.8.0.2', ipv6Address: 'fdcc::2', expiresAt: null, createdAt: '2026-01-01T00:00:00Z', latestHandshakeAt: new Date().toISOString(), endpoint: '1.2.3.4:5555', transferRx: 1000, transferTx: 2000, publicKey: 'PK', privateKey: 'SK', persistentKeepalive: 25, dns: null },
  { id: 2, name: 'Laptop', enabled: false, ipv4Address: '10.8.0.3', ipv6Address: 'fdcc::3', expiresAt: null, createdAt: '2026-01-02T00:00:00Z', latestHandshakeAt: null, endpoint: null, transferRx: null, transferTx: null, publicKey: 'PK2', privateKey: 'SK2' }], calls: [] };
export async function startWg() {
  const auth = 'Basic ' + Buffer.from('admin:wgpw').toString('base64');
  return listen(http.createServer(async (req, res) => {
    const u = new URL(req.url, 'http://x'), p = u.pathname;
    if (req.headers.authorization !== auth) return send(res, 401, { statusMessage: 'Unauthorized' });
    wgState.calls.push(req.method + ' ' + p);
    if (p === '/api/client' && req.method === 'GET') return send(res, 200, wgState.clients);
    if (p === '/api/client' && req.method === 'POST') { const b = await body(req); const id = wgState.clients.length + 1; wgState.clients.push({ id, name: b.name, enabled: true, ipv4Address: '10.8.0.' + (id + 1), expiresAt: b.expiresAt, createdAt: new Date().toISOString() }); return send(res, 200, { success: true, clientId: id }); }
    let m = p.match(/^\/api\/client\/(\d+)\/(enable|disable)$/); if (m) { const c = wgState.clients.find((x) => x.id == m[1]); if (!c) return send(res, 404, { statusMessage: 'Client not found' }); c.enabled = m[2] === 'enable'; return send(res, 200, { success: true }); }
    m = p.match(/^\/api\/client\/(\d+)\/configuration$/); if (m) return send(res, 200, '[Interface]\nPrivateKey = SK\nAddress = 10.8.0.2/24\n', { 'content-type': 'application/octet-stream' });
    m = p.match(/^\/api\/client\/(\d+)\/qrcode\.svg$/); if (m) return send(res, 200, '<svg xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1"/></svg>', { 'content-type': 'image/svg+xml' });
    m = p.match(/^\/api\/client\/(\d+)$/);
    if (m) { const i = wgState.clients.findIndex((x) => x.id == m[1]); if (i < 0) return send(res, 404, { statusMessage: 'Client not found' });
      if (req.method === 'GET') return send(res, 200, wgState.clients[i]);
      if (req.method === 'DELETE') { wgState.clients.splice(i, 1); return send(res, 200, { success: true }); }
      if (req.method === 'POST') { const b = await body(req); wgState.lastUpdate = b; Object.assign(wgState.clients[i], { name: b.name }); return send(res, 200, { success: true }); } }
    send(res, 404, {});
  }));
}

export const csState = { logins: 0, cards: [], groups: [{ id: '11111111-1111-1111-1111-111111111111', name: 'Fleet' }, { id: '22222222-2222-2222-2222-222222222222', name: 'Suppliers' }] };
const cid = (n) => '00000000-0000-0000-0000-' + String(n).padStart(12, '0');
export function resetCards() { csState.cards = [
  { id: cid(1), name: 'Amina Wanjiru', designation: 'Fleet Manager', company: 'Kilimo Logistics', phone: '+254700111222', email: 'amina@kilimo.co.ke', website: 'kilimo.co.ke', address: 'Nairobi', notes: 'Met at expo', tags: ['fleet'], group_id: csState.groups[0].id, group_name: 'Fleet', image: 'data:image/png;base64,AAAA', image_thumb: 'data:image/png;base64,AAAA', has_back: false, created_at: '2026-10-01T10:00:00Z', last_contacted_at: null },
  { id: cid(2), name: 'Brian Otieno', designation: 'Sales', company: 'Tyre Hub', phone: '+254700333444', email: 'b@tyrehub.co.ke', tags: [], group_id: csState.groups[1].id, group_name: 'Suppliers', image_thumb: '/img/t.png', has_back: false, created_at: '2026-10-02T10:00:00Z', last_contacted_at: null }]; }
resetCards();
export async function startCards() {
  return listen(http.createServer(async (req, res) => {
    const u = new URL(req.url, 'http://x'), p = u.pathname;
    if (p === '/img/t.png') { res.writeHead(200, { 'content-type': 'image/png' }); return res.end(Buffer.from('iVBORw0KGgo=', 'base64')); }
    if (p === '/api/auth/login') { const b = await body(req); if (b.email === 'anand@x.io' && b.password === 'cspw') { csState.logins++; return send(res, 200, { user: { id: 1 } }, { 'set-cookie': 'cs_session=S' + csState.logins + '; Path=/; HttpOnly' }); } return send(res, 401, { error: 'Incorrect email or password.' }); }
    if (!(req.headers.cookie || '').includes('cs_session=S' + csState.logins)) return send(res, 401, { error: 'Not authenticated.' });
    if (p === '/api/groups') return send(res, 200, { groups: csState.groups, role: 'admin' });
    if (p === '/api/cards/stats') return send(res, 200, { total: csState.cards.length, addedThisWeek: 2, companies: 2 });
    if (p === '/api/cards' && req.method === 'GET') { const q = (u.searchParams.get('q') || '').toLowerCase(), g = u.searchParams.get('group'); let l = csState.cards.filter((c) => (!q || JSON.stringify(c).toLowerCase().includes(q)) && (!g || c.group_id === g)); return send(res, 200, { cards: l.map(({ image, notes, ...r }) => r), total: l.length }); }
    const m = p.match(/^\/api\/cards\/([0-9a-f-]{36})$/);
    if (m) { const i = csState.cards.findIndex((c) => c.id === m[1]); if (i < 0) return send(res, 404, { error: 'Not found.' });
      if (req.method === 'GET') return send(res, 200, { card: csState.cards[i] });
      if (req.method === 'DELETE') { csState.cards.splice(i, 1); return send(res, 200, { ok: true }); }
      if (req.method === 'PATCH') { const b = await body(req); csState.lastPatch = b; const c = csState.cards[i]; for (const k of Object.keys(b)) { if (k === 'markContacted') c.last_contacted_at = new Date().toISOString(); else if (k === 'groupId') { c.group_id = b[k]; c.group_name = csState.groups.find((g) => g.id === b[k])?.name; } else c[k] = b[k]; } return send(res, 200, { card: c }); } }
    send(res, 404, { error: 'nope' });
  }));
}
