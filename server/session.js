import crypto from 'node:crypto';
import { SECRET } from './config.js';
import { cookies } from './util.js';
import { check } from './sessions.js';

const b64 = (b) => Buffer.from(b).toString('base64url');
const mac = (s) => crypto.createHmac('sha256', SECRET).update(s).digest('base64url');
export function sign(obj, ttlSec) {
  const body = b64(JSON.stringify({ ...obj, exp: Math.floor(Date.now() / 1000) + ttlSec }));
  return body + '.' + mac(body);
}
export function verify(tok) {
  if (!tok || typeof tok !== 'string') return null;
  const i = tok.lastIndexOf('.'); if (i < 1) return null;
  const body = tok.slice(0, i), m = tok.slice(i + 1);
  const want = mac(body);
  if (m.length !== want.length || !crypto.timingSafeEqual(Buffer.from(m), Buffer.from(want))) return null;
  try { const o = JSON.parse(Buffer.from(body, 'base64url').toString()); return o.exp > Date.now() / 1000 ? o : null; } catch { return null; }
}
export const SESSION_COOKIE = 'aos_session';
export function sessionOf(req) { const s = verify(cookies(req)[SESSION_COOKIE]); return s && s.u && check(s, req) ? s : null; }
export function userFromSession(s) {
  const id = crypto.createHash('sha256').update('anands:' + s.u).digest('hex');
  return { uuid: id.slice(0, 8) + '-' + id.slice(8, 12) + '-' + id.slice(12, 16) + '-' + id.slice(16, 20) + '-' + id.slice(20, 32), username: s.n || s.u, email: s.e || null, is_temp: false };
}
