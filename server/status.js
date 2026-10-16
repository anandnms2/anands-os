/* Anands Status (Beszel) for Insights. Beszel is a PocketBase app: sign in with a user, then read the systems, stats, containers and alerts collections.
 * The login stays on this server. Use a read-only Beszel user. */
import { effective } from './config.js';
import { json, rawFetch, httpError, readJson } from './util.js';

let tok = null;
let cache = null;
const conn = () => {
  const s = effective().status;
  if (!s.url || !s.user || !s.pass) throw httpError(409, 'Status (Beszel) is not connected. Add its address and a read-only user in Settings.', 'not_configured');
  return { base: s.url.replace(/\/+$/, ''), user: s.user, pass: s.pass };
};
let inflight = null;
function login(c) { return inflight || (inflight = doLogin(c).finally(() => { inflight = null; })); }
async function doLogin(c) {
  const r = await rawFetch(c.base + '/api/collections/users/auth-with-password', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ identity: c.user, password: c.pass }) });
  if (r.status === 400 || r.status === 401 || r.status === 403) throw httpError(502, 'Status rejected the email or password', 'upstream_auth');
  if (!r.ok || !r.data?.token) throw httpError(502, 'Status answered ' + r.status + ' to the sign-in. Is this the Beszel address?', 'upstream_error');
  tok = { t: r.data.token, uid: r.data.record?.id || '', key: c.base + '|' + c.user + '|' + c.pass }; return tok.t;
}
async function pb(path, init = {}) {
  const c = conn(); const key = c.base + '|' + c.user + '|' + c.pass;
  const stale = tok && tok.key === key ? tok.t : null;
  let t = stale || await login(c);
  const go = (tk) => rawFetch(c.base + path, { ...init, headers: { authorization: tk, ...(init.body ? { 'content-type': 'application/json' } : {}) } });
  let r = await go(t);
  if (r.status === 401) { t = tok && tok.t !== t ? tok.t : await login(c); r = await go(t); }
  if (!r.ok) {
    const msg = r.data?.message || '';
    if (r.status === 403 || r.status === 400 && init.method) throw httpError(403, init.method ? 'Beszel will not let this user do that' + (msg ? ': ' + msg : '. Sign in with a user that can change alerts.') : 'This Beszel user cannot read that', 'upstream_forbidden');
    throw httpError(r.status === 404 ? 404 : 502, 'Status answered ' + r.status + (msg ? ': ' + msg : ''), 'upstream_' + r.status);
  }
  return r.data;
}
const uidOf = () => (tok && tok.uid) || '';
const qs = (o) => '?' + Object.entries(o).map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&');
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);
const round = (v, n = 1) => (v == null ? null : Math.round(v * 10 ** n) / 10 ** n);

function shape(s, alerts) {
  const i = s.info || {};
  return {
    id: s.id, name: s.name, host: s.host, status: s.status || 'pending', updated: s.updated,
    cpu: round(num(i.cpu)), mem: round(num(i.mp)), disk: round(num(i.dp)), gpu: i.g != null ? round(num(i.g)) : null, temp: i.dt != null ? round(num(i.dt)) : null,
    uptime: num(i.u), load: Array.isArray(i.la) ? i.la.map((x) => round(num(x), 2)) : null, agent: i.v || '',
    net: num(i.bb), services: Array.isArray(i.sv) ? { total: i.sv[0], failed: i.sv[1] } : null, updates: Array.isArray(i.pu) ? { total: i.pu[0], security: i.pu[1] ?? null } : null,
    alerts: alerts.filter((a) => a.system === s.id).map((a) => ({ name: a.name, value: a.value, triggered: !!a.triggered }))
  };
}
export async function overview(force) {
  if (!force && cache && Date.now() - cache.t < 15000) return cache.d;
  const [sys, al] = await Promise.all([
    pb('/api/collections/systems/records' + qs({ perPage: 100, sort: 'name' })),
    pb('/api/collections/alerts/records' + qs({ perPage: 200 })).catch(() => ({ items: [] }))
  ]);
  const alerts = al.items || [];
  const systems = (sys.items || []).map((s) => shape(s, alerts));
  const d = { takenAt: new Date().toISOString(), systems, up: systems.filter((s) => s.status === 'up').length, down: systems.filter((s) => s.status === 'down').length, alertsFiring: alerts.filter((a) => a.triggered).length };
  cache = { t: Date.now(), d }; return d;
}
const rid = (v) => { if (!/^[a-z0-9]{6,32}$/i.test(String(v || ''))) throw httpError(400, 'Bad system id'); return v; };
/* Beszel keeps one row per interval: 1m for the last hour, 10m for 12 hours, 20m for a day, 120m for a week, 480m for a month. */
const RANGES = { '1m': 60, '10m': 72, '20m': 72, '120m': 84, '480m': 90 };
const rng = (v) => (RANGES[v] ? v : '1m');
const maxOf = (o) => (o && typeof o === 'object' ? Math.max(0, ...Object.values(o).map(Number).filter(Number.isFinite)) : null);
function point(x) {
  const st = x.stats || {};
  return {
    t: x.created, cpu: round(num(st.cpu)), cpum: round(num(st.cpum)), mp: round(num(st.mp)), mu: round(num(st.mu), 2), mm: round(num(st.mm), 2), mb: round(num(st.mb), 2), mz: round(num(st.mz), 2), su: round(num(st.su), 2), dp: round(num(st.dp)), du: round(num(st.du), 1),
    dr: num(st.dr), dw: num(st.dw), dio: st.dio || null, dios: st.dios || null, b: st.b || (st.ns != null || st.nr != null ? [Math.round((st.ns || 0) * 1048576), Math.round((st.nr || 0) * 1048576)] : null), bm: st.bm || null,
    la: st.la || null, temp: st.t ? round(maxOf(st.t)) : null, t_all: st.t || null, gpu: st.g || null, efs: st.efs || null, ni: st.ni || null, cpub: st.cpub || null, cpus: st.cpus || null, fans: st.f || null, bat: st.bat || null, bats: st.bats || null, zfs: st.z || null, wifi: st.wf || null
  };
}
export async function detail(id, range) {
  rid(id); range = rng(range);
  const [sys, st, cont, det] = await Promise.all([
    pb('/api/collections/systems/records/' + id),
    pb('/api/collections/system_stats/records' + qs({ perPage: RANGES[range], sort: '-created', filter: `system="${id}" && type="${range}"` })).catch(() => ({ items: [] })),
    pb('/api/collections/containers/records' + qs({ perPage: 200, sort: 'name', filter: `system="${id}"` })).catch(() => ({ items: [] })),
    pb('/api/collections/system_details/records' + qs({ perPage: 1, filter: `system="${id}"` })).catch(() => ({ items: [] }))
  ]);
  const series = (st.items || []).slice().reverse().map(point);
  const d0 = (det.items || [])[0] || {}; const i = sys.info || {};
  return {
    range, system: shape(sys, []), series, last: series[series.length - 1] || null,
    info: { host: d0.hostname || sys.host, os: d0.os_name || '', kernel: d0.kernel || '', cpu: d0.cpu || '', arch: d0.arch || '', cores: d0.cores || i.c || null, threads: d0.threads || i.t || null, memory: d0.memory || null, podman: !!d0.podman, connection: i.ct === 1 ? 'SSH' : i.ct === 2 ? 'WebSocket' : '', loadThreshold: i.t || null, battery: i.bat || null, wifi: i.wf || null, journal: !!i.jl, updates: Array.isArray(i.pu) ? { total: i.pu[0], security: i.pu[1] ?? null } : null, rootDisk: i.rdn || '' },
    containers: (cont.items || []).map((c) => ({ id: c.id, name: c.name, status: c.status, health: c.health, cpu: round(num(c.cpu), 1), mem: round(num(c.memory), 1), net: num(c.net), image: c.image || '', ports: c.ports || '', updatable: !!c.updatable, updated: c.updated }))
  };
}
/* Per-container history: each container_stats row is an array of {n, c(cpu %), m(memory MB), b([sent, received] bytes)}. */
export async function containerSeries(id, range) {
  rid(id); range = rng(range);
  const r = await pb('/api/collections/container_stats/records' + qs({ perPage: RANGES[range], sort: '-created', filter: `system="${id}" && type="${range}"` })).catch(() => ({ items: [] }));
  const rows = (r.items || []).slice().reverse(); const names = new Map();
  for (const x of rows) for (const c of Array.isArray(x.stats) ? x.stats : []) { const n = names.get(c.n) || { cpu: 0, mem: 0, k: 0 }; n.cpu += c.c || 0; n.mem += c.m || 0; n.k++; names.set(c.n, n); }
  const top = [...names.entries()].sort((a, b) => (b[1].cpu + b[1].mem / 100) / b[1].k - (a[1].cpu + a[1].mem / 100) / a[1].k).slice(0, 12).map(([n]) => n);
  return { range, names: top, t: rows.map((x) => x.created), cpu: Object.fromEntries(top.map((n) => [n, rows.map((x) => { const c = (Array.isArray(x.stats) ? x.stats : []).find((y) => y.n === n); return c ? round(num(c.c)) : null; })])), mem: Object.fromEntries(top.map((n) => [n, rows.map((x) => { const c = (Array.isArray(x.stats) ? x.stats : []).find((y) => y.n === n); return c ? round(num(c.m)) : null; })])), net: Object.fromEntries(top.map((n) => [n, rows.map((x) => { const c = (Array.isArray(x.stats) ? x.stats : []).find((y) => y.n === n); return c && c.b ? c.b[0] + c.b[1] : null; })])) };
}
const SVC_STATE = ['active', 'inactive', 'failed', 'activating', 'deactivating', 'reloading'], SVC_SUB = ['dead', 'running', 'exited', 'failed', 'unknown'];
export async function services(id) {
  rid(id); const r = await pb('/api/collections/systemd_services/records' + qs({ perPage: 500, sort: 'name', filter: `system="${id}"` }));
  return { services: (r.items || []).map((x) => ({ name: x.name, state: SVC_STATE[x.state] ?? String(x.state), sub: SVC_SUB[x.sub] ?? String(x.sub), cpu: round(num(x.cpu), 2), cpuPeak: round(num(x.cpuPeak), 2), mem: num(x.memory), memPeak: num(x.memPeak), updated: x.updated })) };
}
export async function smart(id) {
  rid(id); const r = await pb('/api/collections/smart_devices/records' + qs({ perPage: 100, sort: 'name', filter: `system="${id}"` })).catch(() => ({ items: [] }));
  return { devices: (r.items || []).map((x) => ({ id: x.id, name: x.name, model: x.model, state: x.state, capacity: num(x.capacity), temp: num(x.temp), firmware: x.firmware, serial: x.serial, type: x.type, hours: num(x.hours), cycles: num(x.cycles), attributes: (Array.isArray(x.attributes) ? x.attributes : []).slice(0, 80).map((a) => ({ id: a.id, name: a.n || a.name, value: a.v ?? a.value, worst: a.w ?? a.worst, threshold: a.t ?? a.threshold, raw: a.rv ?? a.raw_value ?? a.rawValue, flags: a.f || a.flags, fail: a.wf || a.whenFailed })) })) };
}
const ALERT_NAMES = { Status: 'Status (up or down)', CPU: 'CPU', Memory: 'Memory', Disk: 'Disk', Bandwidth: 'Bandwidth', Temperature: 'Temperature', LoadAvg1: 'Load average, 1 min', LoadAvg5: 'Load average, 5 min', LoadAvg15: 'Load average, 15 min', Battery: 'Battery', GPU: 'GPU', Swap: 'Swap', DiskIO: 'Disk I/O', Network: 'Network' };
export async function alertsAll() {
  const [rules, hist, sys, quiet] = await Promise.all([
    pb('/api/collections/alerts/records' + qs({ perPage: 500 })).catch(() => ({ items: [] })),
    pb('/api/collections/alerts_history/records' + qs({ perPage: 100, sort: '-created' })).catch(() => ({ items: [] })),
    pb('/api/collections/systems/records' + qs({ perPage: 100, sort: 'name', fields: 'id,name' })).catch(() => ({ items: [] })),
    pb('/api/collections/quiet_hours/records' + qs({ perPage: 100 })).catch(() => ({ items: [] }))
  ]);
  const names = Object.fromEntries((sys.items || []).map((x) => [x.id, x.name]));
  return {
    kinds: ALERT_NAMES, canEdit: !!uidOf(),
    rules: (rules.items || []).map((a) => ({ id: a.id, system: a.system, systemName: names[a.system] || '', name: a.name, value: a.value, min: a.min, triggered: !!a.triggered })),
    history: (hist.items || []).map((h) => ({ id: h.id, system: h.system, systemName: names[h.system] || '', name: h.name, value: h.value, created: h.created, resolved: h.resolved || null, monitor: h.monitor_name || '' })),
    quiet: (quiet.items || []).map((q) => ({ id: q.id, system: q.system, systemName: q.system ? names[q.system] || '' : 'All servers', type: q.type, start: q.start, end: q.end }))
  };
}
/* Probe results are not on the probe record. Beszel keeps them in a stats collection whose name changed between versions, so try the known names.
 * A row is either one probe per row (probe id plus avg, min, max, loss) or one row per system with a map of probe id to [avg, min, max, loss]. */
const PROBE_STATS = ['network_monitor_stats', 'network_probe_stats', 'probe_stats', 'network_monitors_stats'];
const PICK = (o, ...ks) => { for (const k of ks) if (o && o[k] != null && o[k] !== '') return o[k]; return null; };
function fold(rows, ids) {
  const acc = {};
  const add = (id, v) => { if (!ids.has(id) || !v) return; const a = acc[id] || (acc[id] = { avg: [], min: [], max: [], loss: [], ok: [], n: 0 }); const n = (x) => (x == null || x === '' || !Number.isFinite(Number(x)) ? null : Number(x)); const f = (k, x) => { if (n(x) != null) a[k].push(n(x)); };
    if (Array.isArray(v)) { f('avg', v[0]); f('min', v[1]); f('max', v[2]); f('loss', v[3]); } else if (typeof v === 'object') { f('avg', PICK(v, 'avg', 'res', 'latency', 'ms', 'a')); f('min', PICK(v, 'min', 'res_min', 'mn')); f('max', PICK(v, 'max', 'res_max', 'mx')); f('loss', PICK(v, 'loss', 'packet_loss', 'l')); const ok = PICK(v, 'success', 'up', 'ok'); if (ok != null) a.ok.push(ok === true || ok === 1 || ok === '1' ? 1 : 0); } else f('avg', v);
    a.n++; };
  for (const r of rows) {
    const direct = PICK(r, 'probe', 'monitor', 'network_monitor', 'probe_id');
    if (direct && !Array.isArray(r.stats)) add(direct, r.stats && typeof r.stats === 'object' ? r.stats : r);
    else if (r.stats && typeof r.stats === 'object' && !Array.isArray(r.stats)) for (const [id, v] of Object.entries(r.stats)) add(id, v);
  }
  const mean = (l) => (l.length ? l.reduce((x, y) => x + y, 0) / l.length : null);
  return Object.fromEntries(Object.entries(acc).map(([id, a]) => {
    const loss = mean(a.loss), okRate = a.ok.length ? mean(a.ok) * 100 : null;
    return [id, { avg: round(mean(a.avg)), min: a.min.length ? round(Math.min(...a.min)) : null, max: a.max.length ? round(Math.max(...a.max)) : null, ok: loss != null ? round(100 - loss) : okRate != null ? round(okRate) : null, samples: a.n }];
  }));
}
export async function probes(debug) {
  const [m, sys] = await Promise.all([pb('/api/collections/network_monitors/records' + qs({ perPage: 200 })).catch((e) => (e.status === 404 ? { items: [], none: true } : Promise.reject(e))), pb('/api/collections/systems/records' + qs({ perPage: 100, fields: 'id,name' })).catch(() => ({ items: [] }))]);
  const names = Object.fromEntries((sys.items || []).map((x) => [x.id, x.name]));
  const items = m.items || [], ids = new Set(items.map((x) => x.id));
  let stats = {}, source = null, sample = null;
  for (const c of PROBE_STATS) {
    const r = await pb('/api/collections/' + c + '/records' + qs({ perPage: 120, sort: '-created' })).catch(() => null);
    if (!r) continue; source = c; sample = (r.items || [])[0] || null;
    let rows = r.items || []; const t = rows.find((x) => x.type); if (t) { const want = rows.filter((x) => x.type === (rows.some((y) => y.type === '1m') ? '1m' : t.type)); if (want.length) rows = want; }
    stats = fold(rows, ids); break;
  }
  const out = { probes: items.map((x) => { const st = stats[x.id] || {};
    const own = (x.success_count != null && x.total_count ? Math.round(x.success_count / x.total_count * 1000) / 10 : null);
    return { id: x.id, name: x.name || x.target, target: x.target, protocol: x.protocol, port: x.port, interval: x.interval, system: x.system, systemName: names[x.system] || '', ok: own ?? st.ok ?? null, avg: (x.res_sum && x.total_count ? Math.round(x.res_sum / x.total_count) : null) ?? st.avg ?? null, min: x.res_min ?? st.min ?? null, max: x.res_max ?? st.max ?? null, cert: x.cert || null, enabled: x.enabled !== false, samples: st.samples || 0 }; }), statsFrom: source };
  if (debug) out.debug = { monitorKeys: items[0] ? Object.keys(items[0]) : [], monitor: items[0] || null, statsCollection: source, statsSample: sample };
  return out;
}
const ALERT_KEYS = Object.keys(ALERT_NAMES);
export async function saveAlert(b) {
  rid(b.system); const name = String(b.name || ''); if (!ALERT_KEYS.includes(name)) throw httpError(400, 'Unknown alert type');
  const value = name === 'Status' ? 1 : Number(b.value); if (!Number.isFinite(value)) throw httpError(400, 'Enter a number for the threshold');
  const min = Math.min(60, Math.max(1, Math.round(Number(b.min) || 10)));
  const ex = await pb('/api/collections/alerts/records' + qs({ perPage: 1, filter: `system="${b.system}" && name="${name}"` })).catch(() => ({ items: [] }));
  clear();
  if (ex.items?.[0]) return pb('/api/collections/alerts/records/' + ex.items[0].id, { method: 'PATCH', body: JSON.stringify({ value, min }) });
  await pb('/api/collections/alerts/records' + qs({ perPage: 1 })).catch(() => {}); // make sure the sign-in is fresh so the user id is known
  return pb('/api/collections/alerts/records', { method: 'POST', body: JSON.stringify({ system: b.system, user: uidOf(), name, value, min }) });
}
export async function deleteAlert(id) { rid(id); clear(); await pb('/api/collections/alerts/records/' + id, { method: 'DELETE' }); return { ok: true }; }
export async function setPaused(id, paused) { rid(id); clear(); await pb('/api/collections/systems/records/' + id, { method: 'PATCH', body: JSON.stringify({ status: paused ? 'paused' : 'pending' }) }); return { ok: true }; }
const clear = () => { cache = null; };
export async function handleStatus(req, res, url) {
  const p = url.pathname, m = req.method, sp = url.searchParams;
  if (p === '/api/status' && m === 'GET') return json(res, 200, await overview(sp.get('refresh') === '1'));
  if (p === '/api/status/system' && m === 'GET') return json(res, 200, await detail(sp.get('id'), sp.get('range')));
  if (p === '/api/status/containers' && m === 'GET') return json(res, 200, await containerSeries(sp.get('id'), sp.get('range')));
  if (p === '/api/status/services' && m === 'GET') return json(res, 200, await services(sp.get('id')));
  if (p === '/api/status/smart' && m === 'GET') return json(res, 200, await smart(sp.get('id')));
  if (p === '/api/status/alerts' && m === 'GET') return json(res, 200, await alertsAll());
  if (p === '/api/status/probes' && m === 'GET') return json(res, 200, await probes(sp.get('debug') === '1'));
  if (p === '/api/status/alerts' && m === 'POST') { await saveAlert(await readJson(req, 4096)); return json(res, 200, await alertsAll()); }
  if (p === '/api/status/alerts' && m === 'DELETE') { await deleteAlert(sp.get('id')); return json(res, 200, await alertsAll()); }
  if (p === '/api/status/pause' && m === 'POST') { const b = await readJson(req, 1024); return json(res, 200, await setPaused(b.id, !!b.paused)); }
  throw httpError(404, 'Unknown status route');
}
export async function test() { tok = null; cache = null; try { const d = await overview(true); return { configured: true, connected: true, resources: d.systems.length, unit: 'systems' }; } catch (e) { return { configured: e.code !== 'not_configured', connected: false, reason: e.message }; } }
export async function statusContext() { try { const d = await overview(false); return { systems: d.systems.map((s) => ({ name: s.name, status: s.status, cpu: s.cpu, mem: s.mem, disk: s.disk, uptimeHours: s.uptime != null ? Math.round(s.uptime / 3600) : null })), alertsFiring: d.alertsFiring }; } catch { return null; } }
export const clearStatusCache = () => { cache = null; tok = null; };
