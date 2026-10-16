/* Security center API: who is signed in, sign-in history, and Authentik login events. Owner only. */
import { effective, PUBLIC_URL } from './config.js';
import { createPair } from './pair.js';
import { json, readJson, rawFetch, httpError, isHttps } from './util.js';
import { listSessions, revoke, revokeOthers, history, logEvent } from './sessions.js';

async function authentikEvents() {
  const a = effective().authentik;
  if (!a.url || !a.token) return { configured: false, url: a.url, events: [] };
  const base = a.url.replace(/\/+$/, '');
  const get = async (action) => {
    const r = await rawFetch(base + '/api/v3/events/events/?ordering=-created&page_size=25&action=' + action, { headers: { authorization: 'Bearer ' + a.token, accept: 'application/json' } }, 15000);
    if (r.status === 401 || r.status === 403) throw httpError(502, 'Authentik rejected the token. Create an API token in Authentik (Directory, Tokens and App passwords) for a user that can view events.', 'upstream_auth');
    if (!r.ok || !r.data) throw httpError(502, 'Authentik answered ' + r.status + '. Check the address.', 'upstream_error');
    return (r.data.results || []).map((e) => ({ t: Date.parse(e.created), ev: e.action, user: e.user?.username || e.context?.username || '', ip: e.client_ip || '', app: e.context?.authorized_application?.name || e.app || '', method: e.context?.auth_method || '', ua: e.context?.http_request?.user_agent || '' }));
  };
  try { const [ok, bad] = await Promise.all([get('login'), get('login_failed')]); return { configured: true, url: a.url, events: ok.concat(bad).sort((x, y) => y.t - x.t).slice(0, 40) }; }
  catch (e) { return { configured: true, url: a.url, events: [], error: e.message }; }
}
export async function handleSecurity(req, res, url, sess) {
  if (sess.role && sess.role !== 'owner') throw httpError(403, 'Only the owner can open the security center', 'forbidden');
  const p = url.pathname.replace(/^\/api\/security/, '') || '/';
  if (p === '/' && req.method === 'GET') return json(res, 200, { sessions: listSessions(sess.sid), history: history(), method: process.env.OIDC_ISSUER ? 'sso' : 'password', legacy: !sess.sid, authentik: { configured: !!(effective().authentik.url && effective().authentik.token), url: effective().authentik.url } });
  if (p === '/pair' && req.method === 'POST') { const b = await readJson(req, 512); const r = createPair(b.label, sess.n); const base = PUBLIC_URL || ((isHttps(req, '') ? 'https://' : 'http://') + String(req.headers['x-forwarded-host'] || req.headers.host || '')); logEvent(req, 'pair_started', { user: sess.n }); return json(res, 200, { url: base + '/auth/pair/' + r.tok, expires: r.expires }); }
  if (p === '/authentik' && req.method === 'GET') return json(res, 200, await authentikEvents());
  if (p === '/revoke' && req.method === 'POST') { const { id } = await readJson(req, 512); if (id === sess.sid) throw httpError(400, 'That is this device. Use Sign out instead.'); if (!revoke(req, String(id), sess.n)) throw httpError(404, 'That session is already gone'); return json(res, 200, { ok: true }); }
  if (p === '/revoke-others' && req.method === 'POST') { await readJson(req, 512); return json(res, 200, { ok: true, count: revokeOthers(req, sess.sid, sess.n) }); }
  throw httpError(404, 'Unknown security route');
}
