/* AI insights from FreeLLMAPI. The dashboard API sits behind a login (POST /api/auth/login gives a bearer token), so this server signs in once,
 * keeps the token here and reads /api/analytics/*, /api/keys and /api/models for the AI tab in Insights. The login never reaches the browser. */
import { effective } from './config.js';
import { json, rawFetch, httpError } from './util.js';

let tok = null, inflight = null;
const cache = new Map();
const conn = () => {
  const e = effective(); const a = e.aiusage || {};
  const base = String(a.url || String(e.llm?.base || '').replace(/\/v1\/?$/, '')).replace(/\/+$/, '');
  if (!base || !a.user || !a.pass) throw httpError(409, 'AI insights are not connected. Add your FreeLLMAPI dashboard address, email and password in Settings.', 'not_configured');
  return { base, user: a.user, pass: a.pass };
};
const key = (c) => c.base + '|' + c.user + '|' + c.pass;
function login(c) { return inflight || (inflight = doLogin(c).finally(() => { inflight = null; })); }
async function doLogin(c) {
  const r = await rawFetch(c.base + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: c.user, password: c.pass }) });
  if (r.status === 401 || r.status === 400) throw httpError(502, 'FreeLLMAPI rejected the email or password', 'upstream_auth');
  if (r.status === 429) throw httpError(502, 'FreeLLMAPI locked this login for a while after failed tries. Check the password, then try again in 15 minutes.', 'upstream_auth');
  if (!r.ok || !r.data?.token) throw httpError(502, 'FreeLLMAPI answered ' + r.status + ' to the sign-in. Is this the dashboard address (without /v1)?', 'upstream_error');
  tok = { t: r.data.token, k: key(c) }; return tok.t;
}
async function fl(path) {
  const c = conn(); let t = tok && tok.k === key(c) ? tok.t : await login(c);
  const go = (tk) => rawFetch(c.base + path, { headers: { authorization: 'Bearer ' + tk, accept: 'application/json' } }, 20000);
  let r = await go(t);
  if (r.status === 401) { t = await login(c); r = await go(t); }
  if (!r.ok) throw httpError(r.status === 404 ? 404 : 502, 'FreeLLMAPI answered ' + r.status + (r.data?.error ? ': ' + (r.data.error.message || r.data.error) : ''), 'upstream_' + r.status);
  return r.data;
}
const RANGES = ['24h', '7d', '30d', '90d'];
const rng = (v) => (RANGES.includes(v) ? v : '7d');
const iso = (s) => { if (s == null) return null; const t = String(s); if (/^\d+$/.test(t)) return new Date(Number(t) < 1e12 ? Number(t) * 1000 : Number(t)).toISOString(); return /[zZ]|[+-]\d\d:?\d\d$/.test(t) ? t : t.replace(' ', 'T') + 'Z'; };
async function cached(k, ms, fn) { const h = cache.get(k); if (h && Date.now() - h.t < ms) return h.d; const d = await fn(); cache.set(k, { t: Date.now(), d }); return d; }
const soft = (p, d) => p.catch((e) => { if (e.code === 'upstream_auth' || e.code === 'not_configured') throw e; return d; });

export async function overview(range, force) {
  range = rng(range);
  return cached('ov|' + range, force ? 0 : 15000, async () => {
    const q = '?range=' + range, iv = range === '24h' ? 'hour' : 'day';
    const [summary, timeline, byModel, byPlatform, byClient, byKey, errDist, errors, keys, models] = await Promise.all([
      fl('/api/analytics/summary' + q),
      soft(fl('/api/analytics/timeline' + q + '&interval=' + iv), []),
      soft(fl('/api/analytics/by-model' + q), []), soft(fl('/api/analytics/by-platform' + q), []), soft(fl('/api/analytics/by-client' + q), []), soft(fl('/api/analytics/by-key' + q), []),
      soft(fl('/api/analytics/error-distribution' + q), { byCategory: [], byPlatform: [], detailed: [] }), soft(fl('/api/analytics/errors' + q), []),
      soft(fl('/api/keys'), []), soft(fl('/api/models'), [])
    ]);
    const now = Date.now();
    const keyRows = (Array.isArray(keys) ? keys : []).map((k) => ({ id: k.id, platform: k.platform, label: k.label, masked: k.maskedKey, status: k.status, enabled: k.enabled !== false, keyless: !!k.keyless, base: k.baseUrl || '', checked: iso(k.lastCheckedAt), error: k.lastHealthError || '', cooldowns: (k.cooldowns || []).filter((c) => c.expiresAtMs > now).map((c) => ({ model: c.modelId, left: Math.round(c.remainingMs / 1000) })) }));
    const modelRows = (Array.isArray(models) ? models : []).map((m) => ({ id: m.id, platform: m.platform, model: m.modelId, name: m.displayName, enabled: !!m.enabled, fallback: !!m.fallbackEnabled, priority: m.priority, keys: m.keyCount, rpm: m.rpmLimit, rpd: m.rpdLimit, tpm: m.tpmLimit, tpd: m.tpdLimit, ctx: m.contextWindow, vision: !!m.supportsVision, tools: !!m.supportsTools, source: m.source, size: m.sizeLabel, intel: m.intelligenceRank }));
    return {
      range, takenAt: new Date().toISOString(), interval: iv, summary,
      timeline: (Array.isArray(timeline) ? timeline : []).map((x) => ({ t: iso(x.timestamp), requests: x.requests || 0, ok: x.successCount || 0, fail: x.failureCount || 0, inTok: x.inputTokens || 0, outTok: x.outputTokens || 0 })),
      byModel: Array.isArray(byModel) ? byModel : [], byPlatform: Array.isArray(byPlatform) ? byPlatform : [], byClient: Array.isArray(byClient) ? byClient : [], byKey: Array.isArray(byKey) ? byKey : [],
      errorDist: errDist && typeof errDist === 'object' ? errDist : { byCategory: [], byPlatform: [], detailed: [] },
      errors: (Array.isArray(errors) ? errors : []).map((e) => ({ ...e, createdAt: iso(e.createdAt) })),
      keys: keyRows, models: modelRows
    };
  });
}
export async function requests(sp) {
  const p = new URLSearchParams({ range: rng(sp.get('range')), limit: String(Math.min(200, Math.max(1, Number(sp.get('limit')) || 50))), offset: String(Math.max(0, Number(sp.get('offset')) || 0)) });
  const st = sp.get('status'); if (['success', 'error', 'canceled'].includes(st)) p.set('status', st);
  const pv = sp.get('provider'); if (pv && /^[\w.:\/-]{1,200}$/.test(pv)) p.set('provider', pv);
  const d = await fl('/api/analytics/requests?' + p);
  return { total: d.total || 0, rows: (d.rows || []).map((r) => ({ ...r, createdAt: iso(r.createdAt) })) };
}
export async function request(id) {
  if (!/^\d{1,12}$/.test(String(id))) throw httpError(400, 'Bad request id');
  const d = await fl('/api/analytics/requests/' + id); return { ...d, createdAt: iso(d.createdAt) };
}
export async function handleAiUsage(req, res, url) {
  const p = url.pathname, sp = url.searchParams;
  if (req.method !== 'GET') throw httpError(405, 'Read only');
  if (p === '/api/aiusage') return json(res, 200, await overview(sp.get('range'), sp.get('refresh') === '1'));
  if (p === '/api/aiusage/requests') return json(res, 200, await requests(sp));
  if (p === '/api/aiusage/request') return json(res, 200, await request(sp.get('id')));
  throw httpError(404, 'Unknown AI route');
}
export async function test() { tok = null; cache.clear(); try { const d = await overview('7d', true); return { configured: true, connected: true, resources: d.summary?.totalRequests ?? 0, unit: 'requests this week' }; } catch (e) { return { configured: e.code !== 'not_configured', connected: false, reason: e.message }; } }
export const clearAiUsageCache = () => { cache.clear(); tok = null; };
export async function aiContext() { try { const d = await overview('7d', false); const s = d.summary || {}; return { requests7d: s.totalRequests, successRate: s.successRate, tokensIn: s.totalInputTokens, tokensOut: s.totalOutputTokens, avgLatencyMs: s.avgLatencyMs, topModels: d.byModel.slice(0, 5).map((m) => ({ model: m.displayName || m.modelId, requests: m.requests })) }; } catch { return null; } }
