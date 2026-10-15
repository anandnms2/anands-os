import { effective } from './config.js';
import { json, fetchJson, httpError } from './util.js';

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
  const deploys = []; const totals = [];
  await Promise.all(resources.filter((r) => r.t === 'App' && r.r).slice(0, 12).map(async (r) => {
    const d = await get(c, `/deployments/applications/${r.uuid}?skip=0&take=4`).catch(() => null);
    const arr = list(d, 'deployments', 'data');
    if (typeof d?.count === 'number') totals.push({ app: r.n, n: d.count });
    for (const x of arr.slice(0, 4)) deploys.push({ app: r.n, at: x.created_at, sec: secs(x.created_at, x.finished_at || x.updated_at), msg: x.commit_message || x.commit || '', status: x.status });
  }));
  deploys.sort((a, b) => String(b.at).localeCompare(String(a.at)));
  totals.sort((a, b) => b.n - a.n);
  const s0 = list(servers)[0] || {};
  const data = {
    takenAt: new Date().toISOString(),
    server: { name: s0.name || 'Server', ip: s0.ip || null, reachable: s0.is_reachable ?? s0.settings?.is_reachable ?? null, count: list(servers).length },
    projects: [...new Set(resources.map((r) => r.p))].length,
    resources: resources.map(({ uuid, ...r }) => r), deploys: deploys.slice(0, 10), totals
  };
  cache = { t: Date.now(), d: data };
  return data;
}
export async function handleInsights(req, res, url) { return json(res, 200, await insights(url.searchParams.get('refresh') === '1')); }
export async function insightsContext() { try { return await insights(false); } catch (e) { return { connected: false, note: e.message }; } }
export const clearInsightsCache = () => { cache = null; };
