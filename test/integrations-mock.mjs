// In-memory stand-ins for Beszel (PocketBase), wg-easy v15 and Card Scan, for tests.
import http from 'node:http';
const send = (res, code, body, h = {}) => { const s = typeof body === 'string' ? body : JSON.stringify(body); res.writeHead(code, { 'content-type': typeof body === 'string' ? 'text/plain' : 'application/json', ...h }); res.end(s); };
const body = (req) => new Promise((r) => { let b = ''; req.on('data', (d) => (b += d)); req.on('end', () => { try { r(JSON.parse(b || '{}')); } catch { r({}); } }); });
const listen = (srv) => new Promise((r) => srv.listen(0, '127.0.0.1', () => r(srv)));

export const beszel = { logins: 0, alerts: [{ id: 'alr1xxxxxx', system: 'sysbbb222', name: 'Status', value: 1, min: 10, triggered: true }] };
export async function startBeszel() {
  return listen(http.createServer(async (req, res) => {
    const u = new URL(req.url, 'http://x'), p = u.pathname;
    if (p === '/api/collections/users/auth-with-password') { const b = await body(req); if (b.identity === 'ro@x.io' && b.password === 'pw') { beszel.logins++; return send(res, 200, { token: 'T' + beszel.logins, record: { id: 'usr000001' } }); } return send(res, 400, { message: 'bad' }); }
    if (req.headers.authorization !== 'T' + beszel.logins) return send(res, 401, { message: 'no' });
    if (p === '/api/collections/systems/records') return send(res, 200, { items: [
      { id: 'sysaaa111', name: 'oracle-1', host: '10.0.0.1', status: 'up', updated: '2026-10-15 10:00:00Z', info: { cpu: 12.34, mp: 45.6, dp: 61, u: 360000, la: [0.1, 0.2, 0.3], v: '0.12', sv: [10, 1] } },
      { id: 'sysbbb222', name: 'home-nas', host: '10.0.0.2', status: 'down', updated: '2026-10-14 10:00:00Z', info: {} }] });
    if (p === '/api/collections/alerts/records' && req.method === 'GET') { const f = u.searchParams.get('filter') || ''; const sy = /system="([^"]+)"/.exec(f), nm = /name="([^"]+)"/.exec(f); return send(res, 200, { items: beszel.alerts.filter((a) => (!sy || a.system === sy[1]) && (!nm || a.name === nm[1])) }); }
    if (p === '/api/collections/alerts/records' && req.method === 'POST') { const b = await body(req); const a = { id: 'alr' + (beszel.alerts.length + 10) + 'xxxxx', ...b, triggered: false }; beszel.alerts.push(a); return send(res, 200, a); }
    let am = p.match(/^\/api\/collections\/alerts\/records\/([a-z0-9]+)$/); if (am) { const i = beszel.alerts.findIndex((a) => a.id === am[1]); if (i < 0) return send(res, 404, {}); if (req.method === 'DELETE') { beszel.alerts.splice(i, 1); return send(res, 204, ''); } if (req.method === 'PATCH') { Object.assign(beszel.alerts[i], await body(req)); return send(res, 200, beszel.alerts[i]); } }
    if (p === '/api/collections/alerts_history/records') return send(res, 200, { items: [{ id: 'h1', system: 'sysbbb222', name: 'Status', value: 0, created: '2026-10-14 10:00:00Z', resolved: null }] });
    if (p === '/api/collections/quiet_hours/records') return send(res, 200, { items: [{ id: 'q1', system: '', type: 'daily', start: '22:00', end: '06:00' }] });
    if (p === '/api/collections/network_monitors/records') return send(res, 200, { items: [{ id: 'm1', name: 'Site', target: 'example.com', protocol: 'http', interval: 60, system: 'sysaaa111', success_count: 99, total_count: 100, res_sum: 5000, res_min: 20, res_max: 120 }, { id: 'm2', name: 'https://ai.example', target: 'https://ai.example', protocol: 'http', interval: 30, system: 'sysaaa111' }] });
    if (p === '/api/collections/network_monitor_stats/records') return send(res, 200, { items: [{ id: 's1', system: 'sysaaa111', type: '1m', created: '2026-10-16 10:00:00', stats: { m2: [40, 30, 90, 0] } }, { id: 's2', system: 'sysaaa111', type: '1m', created: '2026-10-16 10:01:00', stats: { m2: [60, 35, 120, 10] } }, { id: 's3', system: 'sysaaa111', type: '10m', created: '2026-10-16 09:00:00', stats: { m2: [999, 999, 999, 100] } }] });
    if (p === '/api/collections/container_stats/records') return send(res, 200, { items: [{ created: '2026-10-15 10:01:00Z', stats: [{ n: 'immich', c: 5, m: 300, b: [10, 20] }, { n: 'db', c: 1, m: 100 }] }, { created: '2026-10-15 10:00:00Z', stats: [{ n: 'immich', c: 3, m: 290 }] }] });
    if (p === '/api/collections/systemd_services/records') return send(res, 200, { items: [{ name: 'ssh.service', state: 0, sub: 1, cpu: 0.1, cpuPeak: 1, memory: 5000000, memPeak: 9000000 }, { name: 'bad.service', state: 2, sub: 3, cpu: 0, memory: 0 }] });
    if (p === '/api/collections/smart_devices/records') return send(res, 200, { items: [{ id: 'd1', name: '/dev/nvme0', model: 'Samsung 980', state: 'PASSED', capacity: 500107862016, temp: 38, hours: 1200, cycles: 50, type: 'nvme', attributes: [{ id: 5, n: 'Reallocated_Sector_Ct', v: 100, w: 100, t: 10, rv: 0 }] }] });
    if (p === '/api/collections/systems/records/sysaaa111') return send(res, 200, { id: 'sysaaa111', name: 'oracle-1', host: '10.0.0.1', status: 'up', info: { cpu: 12 } });
    if (p === '/api/collections/system_stats/records') return send(res, 200, { items: [{ created: '2026-10-15 10:01:00Z', stats: { cpu: 20, mp: 50, dp: 61, mu: 4, m: 8, du: 60, d: 100, b: [1000, 2000], t: { cpu: 55, nvme: 41 }, la: [1, 2, 3], cpub: [10, 5, 1, 0, 84], cpus: [20, 10, 30, 5], efs: { sdb: { d: 100, du: 40, r: 1, w: 2 } }, ni: { eth0: [100, 200, 1000, 2000] } } }, { created: '2026-10-15 10:00:00Z', stats: { cpu: 10, mp: 40 } }] });
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
  return extendCards(await listen(http.createServer(async (req, res) => {
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
  })));
}

/* ---- Card Scan extras ---- */
csState.mine = [{ id: '88888888-8888-8888-8888-888888888880', name: 'Anand Shah', title: 'Director', company: 'Anands', phone: '+255700000000', whatsapp: '+255700000000', email: 'anand@anands.xyz', theme: 'forest', active: true, view_count: 4, share_token: 'anand', social_links: [], showcase_items: [], custom_fields: [] }];
csState.notes = []; csState.reminders = []; csState.notifications = [{ id: 'n1', type: 'x', message: 'Reminder due', read: false, created_at: '2026-10-15T00:00:00Z' }]; csState.calls = [];
export function extendCards(srv) {
  const orig = srv.listeners('request')[0]; srv.removeAllListeners('request');
  srv.on('request', async (req, res) => {
    const u = new URL(req.url, 'http://x'), p = u.pathname;
    if (p !== '/api/auth/login' && !(req.headers.cookie || '').includes('cs_session=S' + csState.logins)) return orig(req, res);
    let m;
    if (p === '/api/cards' && req.method === 'POST') { const b = await body(req); csState.lastCreate = b; const c = { id: cid(csState.cards.length + 50), name: b.name, company: b.company, group_id: b.groupId, tags: b.tags || [], created_at: new Date().toISOString() }; csState.cards.push(c); return send(res, 201, { card: c }); }
    if (p === '/api/cards/check-duplicate') { const ph = u.searchParams.get('phone'); return send(res, 200, { matches: csState.cards.filter((c) => ph && c.phone === ph).map((c) => ({ id: c.id, name: c.name, company: c.company, image_thumb: '/img/t.png', matched_phone: true })) }); }
    if (p === '/api/cards/export') { res.writeHead(200, { 'content-type': 'text/csv' }); return res.end('Name,Company\n' + csState.cards.map((c) => c.name + ',' + (c.company || '')).join('\n')); }
    if (p === '/api/cards/bulk-delete') { const b = await body(req); csState.cards = csState.cards.filter((c) => !b.ids.includes(c.id)); return send(res, 200, { deleted: b.ids.length }); }
    if (p === '/api/cards/bulk-move') { const b = await body(req); csState.lastMove = b; return send(res, 200, { moved: b.ids.length }); }
    if (p === '/api/cards/merge') { const b = await body(req); csState.lastMerge = b; csState.cards = csState.cards.filter((c) => c.id !== b.duplicateId); return send(res, 200, { card: csState.cards.find((c) => c.id === b.primaryId) }); }
    if ((m = p.match(/^\/api\/cards\/([0-9a-f-]{36})\/(timeline|notes|reminders|share)$/))) {
      if (m[2] === 'timeline') return send(res, 200, { createdAt: '2026-10-01', events: [...csState.notes.map((n) => ({ kind: 'note', id: n.id, note: n.note, userName: 'Anand', createdAt: n.at })), { kind: 'activity', action: 'create', label: 'Amina', userName: 'Anand', createdAt: '2026-10-01' }] });
      if (m[2] === 'notes') { const b = await body(req); const n = { id: 'nt' + csState.notes.length, note: b.note, at: new Date().toISOString() }; csState.notes.push(n); return send(res, 200, { note: n }); }
      if (m[2] === 'reminders') { const b = await body(req); csState.reminders.push({ id: '99999999-9999-9999-9999-99999999999' + csState.reminders.length, card_id: m[1], note: b.note, due_date: b.dueDate, card_name: 'Amina', card_image_thumb: '/img/t.png' }); return send(res, 200, { ok: true }); }
      if (m[2] === 'share') { if (req.method === 'DELETE') return send(res, 200, { ok: true }); const b = await body(req); csState.lastShare = b; return send(res, 200, { shareToken: 'tok123', expiresAt: '2026-11-01', maxViews: b.maxViews }); }
    }
    if (p === '/api/reminders') return send(res, 200, { reminders: csState.reminders });
    if ((m = p.match(/^\/api\/reminders\/([0-9a-f-]{36})$/)) && req.method === 'PATCH') { const b = await body(req); csState.lastRem = b; csState.reminders = csState.reminders.filter((r) => r.id !== m[1] || !b.done); return send(res, 200, { ok: true }); }
    if (p === '/api/notifications') return send(res, 200, { notifications: csState.notifications, unreadCount: csState.notifications.filter((n) => !n.read).length });
    if (p === '/api/notifications/mark-read') { csState.notifications.forEach((n) => (n.read = true)); return send(res, 200, { ok: true }); }
    /* My Cards */
    if (p === '/api/my-cards' && req.method === 'GET') return send(res, 200, { cards: csState.mine });
    if (p === '/api/my-cards' && req.method === 'POST') { const b = await body(req); csState.lastMineCreate = b; const c = { id: '88888888-8888-8888-8888-88888888888' + csState.mine.length, active: true, view_count: 0, share_token: null, theme: 'classic', ...b }; csState.mine.push(c); return send(res, 201, { card: c }); }
    let mc; if ((mc = p.match(/^\/api\/my-cards\/([0-9a-f-]{36})(?:\/(share))?$/i))) {
      const c = csState.mine.find((x) => x.id === mc[1]); if (!c) return send(res, 404, { error: 'Not found.' });
      if (mc[2]) { if (req.method === 'POST') { c.share_token = 'mtok' + csState.mine.indexOf(c); c.active = true; return send(res, 200, { shareToken: c.share_token, url: '/m/' + c.share_token }); } const b = await body(req); c.share_token = b.customSlug; return send(res, 200, { shareToken: c.share_token }); }
      if (req.method === 'GET') return send(res, 200, { card: c });
      if (req.method === 'PATCH') { const b = await body(req); Object.assign(c, b); csState.lastMinePatch = b; return send(res, 200, { card: c }); }
      if (req.method === 'DELETE') { csState.mine = csState.mine.filter((x) => x !== c); return send(res, 200, { ok: true }); }
    }
    if (p === '/api/ai/status') return send(res, 200, { configured: true });
    if (p === '/api/ai/extract-card') { const b = await body(req); csState.lastExtract = b; return send(res, 200, { fields: { name: 'Zed Test', company: 'ZedCo', phone: '+255700000001', email: 'zed@zedco.com' }, model: 'm' }); }
    return orig(req, res);
  });
  return srv;
}

/* ---- Pulse (read-only /api/v1) ---- */
export const pulseState = { calls: [] };
export async function startPulse() {
  return listen(http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x'), p = u.pathname; pulseState.calls.push(req.method + ' ' + p + u.search);
    if (req.headers.authorization !== 'Bearer pulse_testtokentesttokentest') return send(res, 401, { error: 'bad token' });
    if (req.method !== 'GET') return send(res, 405, { error: 'read-only' });
    if (p === '/api/v1/today') return send(res, 200, { date: '2026-10-15', unread_items: 7, urgent: [{ id: 'w1', from: 'Joseph', what: 'Truck T482DKP stuck' }], overdue_tasks: [], meetings: [] });
    if (p === '/api/v1/tasks') return send(res, 200, { count: 1, tasks: [{ id: 't1', title: 'Approve fuel advance', priority: 'high', due: '2026-10-16', status: 'open' }] });
    if (p === '/api/v1/waiting') return send(res, 200, { count: 1, waiting: [{ id: 'q1', what: 'POD for T482', from: 'Clearing desk', asked_hours_ago: 30, overdue: true }] });
    if (p === '/api/v1/chats') return send(res, 200, { count: 1, chats: [{ chat_id: 'g12', name: 'Ops line', unread: 4, urgent: 1, asks: 2 }] });
    if (p === '/api/v1/chats/g12/messages') return send(res, 200, { chat: 'Ops line', chat_id: 'g12', members: 5, messages: [{ at: '2026-10-15T08:00:00Z', from: 'Joseph', text: 'Truck stuck at border' }] });
    if (p === '/api/v1/search') return send(res, 200, { understood: [], count: 1, results: [{ id: 'e5', source: 'email', from: 'a@b.c', where: 'Invoice', at: '2026-10-14T10:00:00Z' }], q: u.searchParams.get('q') });
    if (p === '/api/v1/tracked') return send(res, 200, { count: 1, items: [{ key: 'plate:T482DKP', name: 'T 482 DKP', kind: 'vehicle', mentions: 9 }] });
    if (p.startsWith('/api/v1/tracked/')) return send(res, 200, { key: decodeURIComponent(p.slice(16)), name: 'T 482 DKP', timeline: [{ at: '2026-10-15T08:00:00Z', who: 'Joseph' }] });
    if (p === '/api/v1/lists') return send(res, 200, { lists: [] });
    if (p === '/api/v1/health') return send(res, 200, { ok: true, problems: [] });
    if (p === '/api/v1/me') return send(res, 200, { name: 'Anand', read_only: true });
    send(res, 404, { error: 'Unknown endpoint' });
  }));
}

/* ---- Pulse session API ---- */
export const psState = { logins: 0, calls: [], mode: 'personal', tasks: [{ id: 't1', title: 'Approve fuel advance', status: 'open', key: 'today', due: 'Today', dom: 'work', pri: 'high', src: 'e12' }], read: [] };
export async function startPulseSession() {
  const items = () => [
    { id: 'e12', ch: 'EO', from: 'Kilimo Logistics', subj: 'Invoice 5521 overdue', snip: 'Please settle', text: 'Please settle', ts: '2026-10-15 08:10', read: psState.read.includes('e12'), cls: 'urgent', reply: true, att: [{ name: 'inv.pdf' }] },
    { id: 'w34', ch: 'WA', g: 'g7', from: 'Joseph', sum: 'Truck stuck at border', snip: 'Truck stuck at border', text: 'Truck stuck at border', ts: '2026-10-15 07:50', read: false, cls: 'normal', chat: true, stats: { unread: 3, urgent: 1 } }];
  return listen(http.createServer(async (req, res) => {
    const u = new URL(req.url, 'http://x'), p = u.pathname; psState.calls.push(req.method + ' ' + p);
    if (p === '/api/auth/login') { const b = await body(req); if (b.email === 'anand@pulse.io' && b.password === 'pupw') { psState.logins++; return send(res, 200, { ok: true }, { 'set-cookie': 'am_session=P' + psState.logins + '; Path=/; HttpOnly' }); } return send(res, 401, { error: 'Wrong email or password.' }); }
    if (!(req.headers.cookie || '').includes('am_session=P' + psState.logins) || !psState.logins) return send(res, 401, { error: 'Not signed in.' });
    if (p === '/api/p/bootstrap') return send(res, 200, { now: { today: '2026-10-15', monday: '2026-10-12', tz: 'Africa/Dar_es_Salaam' }, items: items(), itemsMore: false, tasks: psState.tasks, events: [{ id: 'ev1', d: '2026-10-15', s: 14, e: 15, title: 'Fleet review', loc: 'Office' }], notes: [], groups: [{ id: 'g7', name: 'Ops line', ch: 'WA', last: '07:50', today: 5 }], sources: [], sched: [], sent: [], links: [], waits: 1, waitsList: [{ id: 'q1', title: 'POD for T482', who: 'Clearing desk', overdue: true }], health: { ok: true }, settings: { mode: psState.mode, names: { EO: 'Office mail', EP: 'Personal mail', WA: 'WhatsApp' } } });
    if (p === '/api/p/groups/g7/messages') return send(res, 200, { digest: null, group: { id: 'g7', name: 'Ops line', ch: 'WA' }, earlier: false, messages: [{ id: 'm1', at: '2026-10-15', ts: '2026-10-15 07:40', from: 'Joseph', mine: false, text: 'Truck stuck at border', read: false }, { id: 'm2', at: '2026-10-15', ts: '2026-10-15 07:45', from: 'Me', mine: true, text: 'On it', read: true }] });
    let m;
    if ((m = p.match(/^\/api\/p\/items\/(e12|w34)$/)) && req.method === 'GET') return send(res, 200, { ...items().find((i) => i.id === m[1]), text: 'Hello, invoice is overdue.', sum: 'Invoice chase', files: [{ idx: 0, name: 'inv.pdf', size: 2048 }], html: true });
    if ((m = p.match(/^\/api\/p\/items\/(e12|w34)\/read$/))) { psState.read.push(m[1]); return send(res, 200, { ok: true }); }
    if ((m = p.match(/^\/api\/p\/items\/(e12|w34)\/handled$/))) return send(res, 200, { ok: true });
    if (p === '/api/p/tasks' && req.method === 'POST') { const b = await body(req); psState.lastTask = b; psState.tasks.push({ id: 't' + (psState.tasks.length + 1), title: b.title, status: 'open', key: 'today', due: 'Today', dom: 'work' }); return send(res, 200, { ok: true }); }
    if ((m = p.match(/^\/api\/p\/tasks\/(t\d+)$/))) { const b = await body(req); const t = psState.tasks.find((x) => x.id === m[1]); if (req.method === 'PATCH' && t) { Object.assign(t, b); psState.lastTaskPatch = b; } if (req.method === 'DELETE') psState.tasks = psState.tasks.filter((x) => x !== t); return send(res, 200, { ok: true }); }
    if (p === '/api/p/settings' && req.method === 'PUT') { const b = await body(req); psState.mode = b.mode; return send(res, 200, { ok: true, mode: b.mode }); }
    if (p === '/api/p/waits') return send(res, 200, { waits: [] });
    if (p === '/api/p/lists') return send(res, 200, { lists: [] });
    if (p === '/api/p/entities') return send(res, 200, { entities: [] });
    if (p === '/api/p/health') return send(res, 200, { ok: true });
    if (p.startsWith('/api/emails/') && p.endsWith('/html')) { res.writeHead(200, { 'content-type': 'text/html' }); return res.end('<p>Mail body</p>'); }
    send(res, 404, { error: 'Unknown' });
  }));
}
