/* Team and guests: people you let into parts of Anands OS. The owner can do everything; a member or guest only reaches the areas and Suite apps you tick.
 * The list lives on the server and is checked on every request, so removing someone or changing their access takes effect immediately. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DATA, PUBLIC_URL } from './config.js';
import { json, readJson, httpError, isHttps } from './util.js';
import { revokeMember, logEvent } from './sessions.js';

const F = path.join(DATA, 'team.json');
let st; try { st = JSON.parse(fs.readFileSync(F, 'utf8')); } catch { st = {}; } st.members = st.members || {};
const save = () => { const t = F + '.tmp'; fs.writeFileSync(t, JSON.stringify(st), { mode: 0o600 }); fs.renameSync(t, F); };
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');

/* what can be granted. 'shares' tells the owner whose data it shows. */
export const AREAS = [
  ['suite', 'Suite apps', 'Docs, Meeting and the other apps. Each person gets their own private storage.', 'own'],
  ['vault', 'Vault', 'The password manager. Each person signs in with their own Vaultwarden account.', 'own'],
  ['chat', 'Assistant', 'The AI assistant. It answers without seeing your photos, mail or servers.', 'own'],
  ['photos', 'Photos', 'Your Immich library.', 'yours'],
  ['drive', 'Drive and Files', 'Your Cloudreve and Google Drive.', 'yours'],
  ['cards', 'Cards', 'Your business-card contacts.', 'yours'],
  ['pulse', 'Pulse', 'Your inbox, WhatsApp, tasks and calendar.', 'yours'],
  ['insights', 'Insights, Servers and AI', 'Coolify, server health and AI usage.', 'yours'],
  ['vpn', 'VPN', 'Your WireGuard clients.', 'yours']
];
const KEYS = AREAS.map((a) => a[0]);

/* which area a request belongs to: a key, 'owner' (owner only), or 'open' (any signed-in person) */
export function areaOf(p, method) {
  if (p === '/api/session' || p === '/api/prefs' && method === 'GET') return 'open';
  if (p === '/api/desk' || p === '/api/rates') return 'open';
  if (p === '/api/sj/open') return 'owner';
  if (p === '/api/chrome/open' || p === '/api/chrome/fit') return 'owner';
  if (p === '/api/profile') return method === 'GET' ? 'open' : 'owner';
  if (p === '/api/settings') return method === 'GET' ? 'open' : 'owner';
  if (/^\/api\/(photos|immich)(\/|$)/.test(p)) return 'photos';
  if (/^\/api\/(drive|gdrive)(\/|$)/.test(p) || p === '/api/search/files') return 'drive';
  if (p.startsWith('/api/vault/')) return 'vault';
  if (p === '/api/pulse' || p.startsWith('/api/pulse/')) return 'pulse';
  if (p === '/api/cards' || p === '/api/my-cards' || /^\/api\/(my-cards|cards|cs)\//.test(p)) return 'cards';
  if (p === '/api/insights' || p === '/api/aiusage' || p.startsWith('/api/aiusage/') || p === '/api/status' || p.startsWith('/api/status/')) return 'insights';
  if (p === '/api/vpn' || p.startsWith('/api/vpn/')) return 'vpn';
  if (p === '/api/chat') return 'chat';
  if (p.startsWith('/_local/')) return 'suite';
  if (p.startsWith('/apps/')) return 'suite';
  if (p.startsWith('/api/')) return 'owner';
  return 'open';
}
export const isOwner = (s) => !s.role || s.role === 'owner';
export function memberOf(s) {
  if (isOwner(s)) return null; const m = st.members[s.mid];
  if (!m || m.disabled || (m.expires && m.expires < Date.now())) return false; return m;
}
/* may this person use this area? (suite apps are checked separately by slug) */
export function allowed(s, area) {
  if (isOwner(s)) return true; const m = memberOf(s); if (!m) return false;
  if (area === 'open') return true; if (area === 'owner') return false; return m.apps.includes(area);
}
export function suiteOk(s, slug) { if (isOwner(s)) return true; const m = memberOf(s); if (!m || !m.apps.includes('suite')) return false; return m.suite.includes('*') || m.suite.includes(slug); }
export function permOf(s) { if (isOwner(s)) return null; const m = memberOf(s); return m ? { apps: m.apps, suite: m.suite, expires: m.expires || 0 } : { apps: [], suite: [] }; }
export function findByEmail(email) { email = String(email || '').toLowerCase(); if (!email) return null; return Object.values(st.members).find((m) => m.email && m.email === email && !m.disabled && (!m.expires || m.expires > Date.now())) || null; }

const tokenOf = () => crypto.randomBytes(24).toString('base64url');
export function redeem(token) {
  const h = sha(token); const m = Object.values(st.members).find((x) => x.tok && x.tok === h);
  if (!m) return { err: 'This invitation link is not valid any more. Ask for a new one.' };
  if (m.disabled) return { err: 'This access has been turned off.' };
  if (m.expires && m.expires < Date.now()) return { err: 'This invitation has expired. Ask for a new one.' };
  if (m.uses >= m.maxUses) return { err: 'This invitation link has already been used. Ask for a new one.' };
  m.uses++; m.seen = Date.now(); save(); return { m };
}
export function touch(m) { m.seen = Date.now(); }
const origin = (req) => PUBLIC_URL || `${isHttps(req) ? 'https' : 'http'}://${req.headers.host}`;
const view = (m) => ({ id: m.id, name: m.name, email: m.email || '', role: m.role, apps: m.apps, suite: m.suite, created: m.created, expires: m.expires || 0, disabled: !!m.disabled, seen: m.seen || 0, hasLink: !!m.tok, uses: m.uses || 0, maxUses: m.maxUses || 0 });
function fields(b, cur) {
  const o = {};
  if (b.name !== undefined) { const n = String(b.name).replace(/[\r\n<>]/g, '').trim().slice(0, 60); if (!n) throw httpError(400, 'Give this person a name'); o.name = n; }
  if (b.email !== undefined) { const e = String(b.email).trim().toLowerCase(); if (e && !/^[^\s@<>",;]+@[^\s@<>",;]+\.[^\s@<>",;]+$/.test(e)) throw httpError(400, 'That email address does not look right'); o.email = e; }
  if (b.role !== undefined) { if (!['member', 'guest'].includes(b.role)) throw httpError(400, 'Role must be member or guest'); o.role = b.role; }
  if (b.apps !== undefined) { if (!Array.isArray(b.apps)) throw httpError(400, 'Bad access list'); o.apps = [...new Set(b.apps.filter((x) => KEYS.includes(x)))]; }
  if (b.suite !== undefined) { if (!Array.isArray(b.suite)) throw httpError(400, 'Bad app list'); o.suite = [...new Set(b.suite.map(String).filter((x) => x === '*' || /^[a-z0-9-]{1,40}$/.test(x)))].slice(0, 200); if (o.suite.includes('*')) o.suite = ['*']; }
  if (b.days !== undefined) { const d = Number(b.days); o.expires = d > 0 ? Date.now() + Math.min(d, 365) * 864e5 : 0; }
  if (b.disabled !== undefined) o.disabled = !!b.disabled;
  if (b.maxUses !== undefined) o.maxUses = Math.min(20, Math.max(1, Number(b.maxUses) || 1));
  if (b.disabled !== undefined) o.disabled = !!b.disabled;
  return o;
}
export async function handleTeam(req, res, url, sess) {
  if (!isOwner(sess)) throw httpError(403, 'Only the owner can manage the team', 'forbidden');
  const p = url.pathname.replace(/^\/api\/team/, '') || '/', m = req.method; let x;
  if (p === '/' && m === 'GET') return json(res, 200, { members: Object.values(st.members).sort((a, b) => b.created - a.created).map(view), areas: AREAS.map((a) => ({ key: a[0], name: a[1], note: a[2], shares: a[3] })) });
  if (p === '/' && m === 'POST') {
    const b = await readJson(req, 4096); const f = fields({ role: 'guest', apps: [], suite: [], days: 7, maxUses: 3, ...b }, null);
    const id = crypto.randomBytes(6).toString('hex'); const rec = { id, created: Date.now(), uses: 0, maxUses: 3, apps: [], suite: [], email: '', expires: 0, ...f };
    if (!rec.name) throw httpError(400, 'Give this person a name');
    let link = null; if (!rec.email || b.link) { const t = tokenOf(); rec.tok = sha(t); link = origin(req) + '/auth/invite/' + t; }
    st.members[id] = rec; save(); logEvent(req, 'invite_created', { user: rec.name, by: sess.n }); return json(res, 201, { member: view(rec), link });
  }
  if ((x = p.match(/^\/([0-9a-f]{12})$/))) {
    const rec = st.members[x[1]]; if (!rec) throw httpError(404, 'No such person');
    if (m === 'PUT') { const f = fields(await readJson(req, 4096), rec); Object.assign(rec, f); if (rec.disabled) revokeMember(req, rec.id, sess.n); save(); return json(res, 200, { member: view(rec) }); }
    if (m === 'DELETE') { revokeMember(req, rec.id, sess.n); delete st.members[rec.id]; save(); return json(res, 200, { ok: true }); }
  }
  if ((x = p.match(/^\/([0-9a-f]{12})\/link$/)) && m === 'POST') {
    const rec = st.members[x[1]]; if (!rec) throw httpError(404, 'No such person'); const b = await readJson(req, 1024); const t = tokenOf(); rec.tok = sha(t); rec.uses = 0;
    if (b.days !== undefined) rec.expires = Number(b.days) > 0 ? Date.now() + Math.min(Number(b.days), 365) * 864e5 : 0; rec.disabled = false; save(); return json(res, 200, { member: view(rec), link: origin(req) + '/auth/invite/' + t });
  }
  throw httpError(404, 'Unknown team route');
}
