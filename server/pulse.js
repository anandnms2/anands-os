/* Anands Pulse (control.anands.xyz) read access. Pulse has a read-only REST API with per-tool tokens (Settings, Automation, Access for your AI tools).
 * The token stays on this server. Nothing here can send, change or delete anything in Pulse. */
import { effective } from './config.js';
import { json, rawFetch, httpError } from './util.js';

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
export async function test() { cache.clear(); try { await get('/me', 0); let n = null; try { n = (await get('/today', 0)).unread_items; } catch {} return { configured: true, connected: true, resources: n ?? undefined, unit: 'unread items' }; } catch (e) { return { configured: e.code !== 'not_configured', connected: false, reason: e.message }; } }
export async function pulseContext() {
  try { const [today, tasks, waiting, chats] = await Promise.all([get('/today'), get('/tasks?status=open&limit=25'), get('/waiting?limit=20'), get('/chats?limit=15')]); return { today, openTasks: tasks.tasks, waitingOnOthers: waiting.waiting, unreadChats: chats.chats }; } catch (e) { return e.code === 'not_configured' ? null : { connected: false, note: e.message }; }
}
export const clearPulseCache = () => cache.clear();
