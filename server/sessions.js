/* Sign-in sessions you can see and revoke, plus a short sign-in history. Stored in the data folder. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DATA } from './config.js';

const F = path.join(DATA, 'sessions.json');
let st; try { st = JSON.parse(fs.readFileSync(F, 'utf8')); } catch { st = {}; }
st.sessions = st.sessions || {}; st.log = st.log || []; st.revokedAll = st.revokedAll || 0;
let timer = null;
function save() { if (timer) return; timer = setTimeout(() => { timer = null; try { const t = F + '.tmp'; fs.writeFileSync(t, JSON.stringify(st), { mode: 0o600 }); fs.renameSync(t, F); } catch {} }, 1500); timer.unref?.(); }
const ipOf = (req) => (String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || '').replace(/^::ffff:/, '').slice(0, 64);
const uaOf = (req) => String(req.headers['user-agent'] || '').slice(0, 220);
export function logEvent(req, ev, extra = {}) {
  st.log.unshift({ t: Date.now(), ev, ip: ipOf(req), ua: uaOf(req), ...extra }); st.log.length = Math.min(st.log.length, 200); save();
}
export function createSession(req, { u, n, role, method, mid }) {
  const id = crypto.randomBytes(9).toString('base64url'); const now = Date.now();
  st.sessions[id] = { id, u, n, role: role || 'owner', mid: mid || '', method, ip: ipOf(req), ua: uaOf(req), created: now, seen: now };
  const ids = Object.keys(st.sessions); if (ids.length > 100) for (const k of ids.sort((a, b) => st.sessions[a].seen - st.sessions[b].seen).slice(0, ids.length - 100)) delete st.sessions[k];
  logEvent(req, 'login', { user: n || u, method }); save(); return id;
}
/* null when the session was revoked */
export function check(tok, req) {
  if (tok.sid) { const s = st.sessions[tok.sid]; if (!s) return false; const now = Date.now(); if (now - s.seen > 60e3) { s.seen = now; s.ip = ipOf(req) || s.ip; save(); } return true; }
  return !st.revokedAll;
}
export function listSessions(currentSid) {
  const out = Object.values(st.sessions).sort((a, b) => b.seen - a.seen).map((s) => ({ id: s.id, current: s.id === currentSid, name: s.n, role: s.role, method: s.method, ip: s.ip, ua: s.ua, created: s.created, seen: s.seen }));
  return out;
}
export function revoke(req, id, byName) { const s = st.sessions[id]; if (!s) return false; delete st.sessions[id]; logEvent(req, 'revoked', { user: s.n || s.u, by: byName }); save(); return true; }
export function revokeOthers(req, keepSid, byName) { let n = 0; for (const k of Object.keys(st.sessions)) if (k !== keepSid) { delete st.sessions[k]; n++; } st.revokedAll = Date.now(); logEvent(req, 'revoked_all', { count: n, by: byName }); save(); return n; }
export function revokeMember(req, mid, byName) { let n = 0; for (const k of Object.keys(st.sessions)) if (st.sessions[k].mid === mid) { delete st.sessions[k]; n++; } if (n) { logEvent(req, 'revoked', { user: 'team member', by: byName, count: n }); save(); } return n; }
export function endSession(req, sid) { if (sid && st.sessions[sid]) { logEvent(req, 'logout', { user: st.sessions[sid].n }); delete st.sessions[sid]; save(); } }
export const history = () => st.log.slice(0, 100);
