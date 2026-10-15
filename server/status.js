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
  tok = { t: r.data.token, key: c.base + '|' + c.user + '|' + c.pass }; return tok.t;
}
async function pb(path) {
  const c = conn(); const key = c.base + '|' + c.user + '|' + c.pass;
  const stale = tok && tok.key === key ? tok.t : null;
  let t = stale || await login(c);
  let r = await rawFetch(c.base + path, { headers: { authorization: t } });
  if (r.status === 401 || r.status === 403) { t = tok && tok.t !== t ? tok.t : await login(c); r = await rawFetch(c.base + path, { headers: { authorization: t } }); }
  if (!r.ok) throw httpError(502, 'Status answered ' + r.status, 'upstream_' + r.status);
  return r.data;
}
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
export async function detail(id) {
  rid(id);
  const [sys, st, cont, det] = await Promise.all([
    pb('/api/collections/systems/records/' + id),
    pb('/api/collections/system_stats/records' + qs({ perPage: 60, sort: '-created', filter: `system="${id}" && type="1m"` })).catch(() => ({ items: [] })),
    pb('/api/collections/containers/records' + qs({ perPage: 100, sort: 'name', filter: `system="${id}"` })).catch(() => ({ items: [] })),
    pb('/api/collections/system_details/records' + qs({ perPage: 1, filter: `system="${id}"` })).catch(() => ({ items: [] }))
  ]);
  const series = (st.items || []).slice().reverse().map((x) => ({ t: x.created, cpu: round(num(x.stats?.cpu)), mem: round(num(x.stats?.mp)), disk: round(num(x.stats?.dp)), rx: num(x.stats?.nr), tx: num(x.stats?.ns), temp: x.stats?.t ? round(Math.max(...Object.values(x.stats.t).map(Number))) : null }));
  const last = (st.items || [])[0]?.stats || {};
  const d0 = (det.items || [])[0] || {};
  return {
    system: shape(sys, []), series,
    now: { memUsed: round(num(last.mu), 2), memTotal: round(num(last.m), 2), diskUsed: round(num(last.du), 1), diskTotal: round(num(last.d), 1), swapUsed: round(num(last.su), 2), temps: last.t || null },
    info: { host: d0.hostname || sys.host, os: d0.os_name || d0.os || '', kernel: d0.kernel || '', cpu: d0.cpu || d0.cpu_model || '', cores: d0.cores || null, memory: d0.memory || null },
    containers: (cont.items || []).map((c) => ({ id: c.id, name: c.name, status: c.status, health: c.health, cpu: round(num(c.cpu), 1), mem: round(num(c.memory), 1), image: c.image || '' }))
  };
}
export async function handleStatus(req, res, url) {
  if (url.pathname === '/api/status') return json(res, 200, await overview(url.searchParams.get('refresh') === '1'));
  if (url.pathname === '/api/status/system') return json(res, 200, await detail(url.searchParams.get('id')));
  throw httpError(404, 'Unknown status route');
}
export async function test() { tok = null; cache = null; try { const d = await overview(true); return { configured: true, connected: true, resources: d.systems.length, unit: 'systems' }; } catch (e) { return { configured: e.code !== 'not_configured', connected: false, reason: e.message }; } }
export async function statusContext() { try { const d = await overview(false); return { systems: d.systems.map((s) => ({ name: s.name, status: s.status, cpu: s.cpu, mem: s.mem, disk: s.disk, uptimeHours: s.uptime != null ? Math.round(s.uptime / 3600) : null })), alertsFiring: d.alertsFiring }; } catch { return null; } }
export const clearStatusCache = () => { cache = null; tok = null; };
