import { effective } from './config.js';
import tls from 'node:tls';
import { json, fetchJson, httpError } from './util.js';
import { overview as beszelOverview, detail as beszelDetail } from './status.js';

let cache = null;
function conn() {
  const { url, token } = effective().coolify;
  if (!url || !token) throw httpError(409, 'Coolify is not connected. Add its address and a read-only API token in Settings.', 'not_configured');
  return { base: url.replace(/\/+$/, '').replace(/\/api(\/v1)?$/, '') + '/api/v1', token };
}
const get = (c, path) => fetchJson(c.base + path, { headers: { authorization: 'Bearer ' + c.token, accept: 'application/json' } }, 20000);
const list = (x, ...keys) => (Array.isArray(x) ? x : keys.map((k) => x?.[k]).find(Array.isArray) || []);

export function health(status) {
  const s = String(status || '').toLowerCase();
  if (/unhealthy|exited|stopped|degraded|restarting|error|failed|crash/.test(s)) return 'bad';
  if (/healthy/.test(s)) return 'ok';
  if (/running/.test(s)) return 'nohc';
  return 'bad';
}
const host = (f) => String(f || '').split(',')[0].replace(/^https?:\/\//, '').replace(/\/+$/, '');
const secs = (a, b) => { const x = Date.parse(a), y = Date.parse(b); return x && y && y >= x ? Math.round((y - x) / 1000) : null; };


/* ---------- extra insights: deploy reliability, backups, domains and certificates, the server itself ---------- */
function deployStats(all, apps) {
  const now = Date.now(), DAY = 86400e3, recent = all.filter((x) => now - Date.parse(x.at) <= 30 * DAY);
  const done = recent.filter((x) => x.status === 'finished' || x.status === 'failed');
  const timed = done.filter((x) => x.sec != null && x.status === 'finished');
  const perDay = Array(30).fill(0), failDay = Array(30).fill(0);
  for (const x of recent) { const i = 29 - Math.floor((now - Date.parse(x.at)) / DAY); if (i >= 0 && i < 30) { perDay[i]++; if (x.status === 'failed') failDay[i]++; } }
  const slow = timed.slice().sort((a, b) => b.sec - a.sec)[0] || null;
  const trend = all.filter((x) => x.status === 'finished' && x.sec != null).slice(0, 24).reverse().map((x) => ({ app: x.app, sec: x.sec, at: x.at }));
  const last = apps.map((a) => { const x = all.find((y) => y.app === a.n); return { app: a.n, at: x ? x.at : null }; }).sort((a, b) => String(a.at || '').localeCompare(String(b.at || '')));
  return {
    window: 30, count: recent.length, failed: recent.filter((x) => x.status === 'failed').length, rate: done.length ? Math.round(done.filter((x) => x.status === 'finished').length / done.length * 1000) / 10 : null,
    avgSec: timed.length ? Math.round(timed.reduce((a, x) => a + x.sec, 0) / timed.length) : null, slowest: slow ? { app: slow.app, sec: slow.sec, msg: slow.msg, at: slow.at } : null, perDay, failDay, trend, last
  };
}
async function backupInfo(c, dbs) {
  const out = [];
  await Promise.all(list(dbs).map(async (d) => {
    const sched = list(await get(c, '/databases/' + d.uuid + '/backups').catch(() => null), 'backups', 'data');
    let last = null;
    for (const b of sched.slice(0, 3)) {
      const ex = list(await get(c, '/databases/' + d.uuid + '/backups/' + b.uuid + '/executions').catch(() => null), 'executions', 'data');
      for (const e of ex) if (!last || String(e.created_at) > String(last.at)) last = { at: e.created_at, status: e.status, size: Number(e.size) || null };
    }
    out.push({ name: d.name, type: d.type || d.database_type || '', scheduled: sched.filter((b) => b.enabled !== false).length, last });
  }));
  return out.sort((a, b) => a.name.localeCompare(b.name));
}
const certCache = new Map();
function certDays(hostname) {
  const hit = certCache.get(hostname); if (hit && Date.now() - hit.t < 6 * 3600e3) return Promise.resolve(hit.v);
  return new Promise((resolve) => {
    const done = (v) => { certCache.set(hostname, { t: Date.now(), v }); resolve(v); };
    try {
      const sock = tls.connect({ host: hostname, port: 443, servername: hostname, timeout: 4000, rejectUnauthorized: false }, () => {
        const cert = sock.getPeerCertificate(); sock.end();
        const end = cert && cert.valid_to ? Date.parse(cert.valid_to) : NaN; done(Number.isFinite(end) ? Math.floor((end - Date.now()) / 86400e3) : null);
      });
      sock.on('error', () => done(null)); sock.on('timeout', () => { sock.destroy(); done(null); });
    } catch { done(null); }
  });
}
async function domainInfo(apps) {
  const rows = list(apps).map((a) => ({ app: a.name, hosts: String(a.fqdn || '').split(',').map((h) => h.trim()).filter(Boolean) }));
  const withDom = rows.filter((r) => r.hosts.length), none = rows.filter((r) => !r.hosts.length).map((r) => r.app);
  const certs = (await Promise.all(withDom.map(async (r) => { const h = r.hosts[0].replace(/^https?:\/\//, '').replace(/\/.*$/, ''); return { app: r.app, host: h, https: /^https:/i.test(r.hosts[0]), days: /^https:/i.test(r.hosts[0]) ? await certDays(h) : null }; }))).sort((a, b) => (a.days == null ? 1e9 : a.days) - (b.days == null ? 1e9 : b.days));
  return { total: rows.length, withDomain: withDom.length, none, certs };
}
async function boxInfo() {
  try {
    const o = await beszelOverview(false); const s = o.systems.find((x) => x.status === 'up') || o.systems[0]; if (!s) return null;
    let d = null; try { d = await beszelDetail(s.id, '1m'); } catch { /* the server card still works without the container list */ }
    const cs = d ? d.containers.slice().sort((a, b) => (b.mem || 0) - (a.mem || 0)) : [];
    return { name: s.name, status: s.status, cpu: s.cpu, mem: s.mem, disk: s.disk, uptime: s.uptime, load: s.load, temp: s.temp, updates: s.updates, services: s.services, imageUpdates: cs.filter((x) => x.updatable).length, containers: cs.length, top: cs.slice(0, 5).map((x) => ({ name: x.name, mem: x.mem })) };
  } catch { return null; }
}
export async function insights(force) {
  if (!force && cache && Date.now() - cache.t < 30000) return cache.d;
  const c = conn();
  const [servers, projects, apps, services, dbs] = await Promise.all([
    get(c, '/servers').catch((e) => { if (e.status === 504 || /unreachable|401|403/.test(e.code || '')) throw e; return []; }),
    get(c, '/projects').catch(() => []), get(c, '/applications').catch(() => []), get(c, '/services').catch(() => []), get(c, '/databases').catch(() => [])
  ]);
  const envProject = new Map();
  await Promise.all(list(projects).slice(0, 30).map(async (p) => {
    const d = await get(c, '/projects/' + p.uuid).catch(() => null);
    for (const e of list(d?.environments || p.environments)) envProject.set(e.id, p.name);
  }));
  const pj = (x) => envProject.get(x.environment_id) || x.project_name || 'Coolify';
  const resources = [
    ...list(apps).map((a) => ({ n: a.name, t: 'App', p: pj(a), s: health(a.status), st: a.status, d: host(a.fqdn), r: a.git_repository || '', uuid: a.uuid })),
    ...list(services).map((a) => ({ n: a.name, t: 'Service', p: pj(a), s: health(a.status), st: a.status, d: '', r: '', uuid: a.uuid })),
    ...list(dbs).map((a) => ({ n: a.name, t: 'Database', p: pj(a), s: health(a.status), st: a.status, d: '', r: a.type || a.database_type || '', uuid: a.uuid }))
  ];
  const deploys = []; const totals = []; const all = [];
  const apps2 = resources.filter((r) => r.t === 'App' && r.r).slice(0, 14);
  await Promise.all(apps2.map(async (r) => {
    const d = await get(c, `/deployments/applications/${r.uuid}?skip=0&take=25`).catch(() => null);
    const arr = list(d, 'deployments', 'data');
    if (typeof d?.count === 'number') totals.push({ app: r.n, n: d.count });
    for (const x of arr) all.push({ app: r.n, at: x.created_at, sec: secs(x.created_at, x.finished_at || x.updated_at), msg: x.commit_message || x.commit || '', status: x.status, sha: String(x.commit || '').slice(0, 12) });
  }));
  all.sort((a, b) => String(b.at).localeCompare(String(a.at)));
  deploys.push(...all.slice(0, 16));
  totals.sort((a, b) => b.n - a.n);
  const [backups, domains, box] = await Promise.all([backupInfo(c, dbs), domainInfo(apps), boxInfo()]);
  const stats = deployStats(all, apps2);
  const s0 = list(servers)[0] || {};
  const data = {
    takenAt: new Date().toISOString(),
    server: { name: s0.name || 'Server', ip: s0.ip || null, reachable: s0.is_reachable ?? s0.settings?.is_reachable ?? null, count: list(servers).length },
    projects: [...new Set(resources.map((r) => r.p))].length,
    resources: resources.map(({ uuid, ...r }) => r), deploys, totals, stats, backups, domains, box
  };
  cache = { t: Date.now(), d: data };
  return data;
}
export async function handleInsights(req, res, url) { return json(res, 200, await insights(url.searchParams.get('refresh') === '1')); }
export async function insightsContext() { try { return await insights(false); } catch (e) { return { connected: false, note: e.message }; } }
export const clearInsightsCache = () => { cache = null; };
