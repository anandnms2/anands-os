import { profileOf } from './profile.js';
import crypto from 'node:crypto';
import { OIDC, PASSWORD, PUBLIC_URL, OWNER } from './config.js';
import { sign, verify, SESSION_COOKIE, sessionOf } from './session.js';
import { createSession, logEvent, endSession } from './sessions.js';
import { json, readJson, setCookie, cookies, clientIp, isHttps, fetchJson, httpError } from './util.js';

const TTL = 14 * 24 * 3600;
const fails = new Map();
function limited(ip) { const now = Date.now(); const a = (fails.get(ip) || []).filter((t) => now - t < 15 * 60e3); fails.set(ip, a); return a.length >= 6; }
function noteFail(ip) { const a = fails.get(ip) || []; a.push(Date.now()); fails.set(ip, a); }
const eq = (a, b) => { const x = crypto.createHash('sha256').update(a).digest(), y = crypto.createHash('sha256').update(b).digest(); return crypto.timingSafeEqual(x, y); };
const origin = (req) => PUBLIC_URL || `${isHttps(req) ? 'https' : 'http'}://${req.headers.host}`;

let disco = null;
async function discovery() {
  if (disco && disco.t > Date.now() - 3600e3) return disco.d;
  const d = await fetchJson(OIDC.issuer + '/.well-known/openid-configuration');
  disco = { t: Date.now(), d }; return d;
}
const pkce = () => { const v = crypto.randomBytes(32).toString('base64url'); return { v, c: crypto.createHash('sha256').update(v).digest('base64url') }; };

export function loginInfo() { return { method: OIDC ? 'oidc' : 'password', passwordToo: !!(OIDC && PASSWORD) }; }

export async function handleAuth(req, res, url) {
  const p = url.pathname;
  const secure = isHttps(req, PUBLIC_URL);
  if (p === '/auth/password' && req.method === 'POST') {
    if (OIDC && !PASSWORD) throw httpError(404, 'Password sign-in is off');
    const ip = clientIp(req);
    if (limited(ip)) throw httpError(429, 'Too many attempts. Wait 15 minutes.', 'rate_limited');
    const { password } = await readJson(req, 4096);
    if (typeof password !== 'string' || !PASSWORD || !eq(password, PASSWORD)) { noteFail(ip); logEvent(req, 'login_failed', { method: 'password' }); throw httpError(401, 'Wrong password', 'bad_password'); }
    setCookie(res, SESSION_COOKIE, sign({ u: 'owner', n: OWNER, sid: createSession(req, { u: 'owner', n: OWNER, method: 'password' }) }, TTL), { maxAge: TTL, secure });
    return json(res, 200, { ok: true });
  }
  if (p === '/auth/logout') {
    try { endSession(req, (sessionOf(req) || {}).sid); } catch {}
    setCookie(res, SESSION_COOKIE, '', { maxAge: 0, secure });
    res.writeHead(302, { location: '/' }); return res.end();
  }
  if (p === '/auth/login' && OIDC) {
    const d = await discovery();
    const state = crypto.randomBytes(16).toString('base64url'); const k = pkce();
    setCookie(res, 'aos_oidc', sign({ s: state, v: k.v }, 600), { maxAge: 600, secure });
    const q = new URLSearchParams({ response_type: 'code', client_id: OIDC.clientId, redirect_uri: origin(req) + '/auth/callback', scope: OIDC.scope, state, code_challenge: k.c, code_challenge_method: 'S256' });
    res.writeHead(302, { location: d.authorization_endpoint + '?' + q }); return res.end();
  }
  if (p === '/auth/callback' && OIDC) {
    const c = verify(cookies(req).aos_oidc);
    if (!c || c.s !== url.searchParams.get('state') || !url.searchParams.get('code')) throw httpError(400, 'Sign-in expired. Go back and try again.');
    const d = await discovery();
    const body = new URLSearchParams({ grant_type: 'authorization_code', code: url.searchParams.get('code'), redirect_uri: origin(req) + '/auth/callback', client_id: OIDC.clientId, code_verifier: c.v });
    if (OIDC.clientSecret) body.set('client_secret', OIDC.clientSecret);
    const tok = await fetchJson(d.token_endpoint, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body });
    const info = await fetchJson(d.userinfo_endpoint, { headers: { authorization: 'Bearer ' + tok.access_token } });
    const email = String(info.email || '').toLowerCase();
    const id = info.preferred_username || email || info.sub;
    if (!id) throw httpError(403, 'Your SSO account has no usable identity');
    if (OIDC.allowed.length && !OIDC.allowed.includes(email) && !OIDC.allowed.includes(String(info.preferred_username || '').toLowerCase())) { logEvent(req, 'login_denied', { user: email || id, method: 'sso' }); throw httpError(403, 'This account is not allowed here'); }
    setCookie(res, 'aos_oidc', '', { maxAge: 0, secure });
    const nm = info.name || info.preferred_username || id;
    setCookie(res, SESSION_COOKIE, sign({ u: id, n: nm, e: email || null, sid: createSession(req, { u: id, n: nm, method: 'sso' }) }, TTL), { maxAge: TTL, secure });
    res.writeHead(302, { location: '/' }); return res.end();
  }
  return false;
}
export function sessionInfo(req) {
  const s = sessionOf(req);
  const pf = s ? profileOf() : null;
  return { user: s ? { name: (pf.name || s.n || s.u), email: (pf.email || s.e || null), avatar: pf.avatar, title: pf.title } : null, ...loginInfo() };
}
