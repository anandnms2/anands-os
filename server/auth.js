import { profileOf } from './profile.js';
import crypto from 'node:crypto';
import { OIDC, PASSWORD, PUBLIC_URL, OWNER } from './config.js';
import { sign, verify, SESSION_COOKIE, sessionOf } from './session.js';
import { createSession, logEvent, endSession } from './sessions.js';
import { redeem, findByEmail, permOf } from './team.js';
import { peekPair, redeemPair } from './pair.js';
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
  if (p.startsWith('/auth/pair/') && (req.method === 'GET' || req.method === 'POST')) {
    const ip = clientIp(req); if (limited(ip)) throw httpError(429, 'Too many attempts. Wait 15 minutes.', 'rate_limited');
    const tok = decodeURIComponent(p.slice(11)), page = (h, code = 200) => { res.writeHead(code, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'referrer-policy': 'no-referrer', 'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'" }); return res.end('<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>Pair this phone</title><body style="font:16px system-ui;padding:2.5rem 1.25rem;max-width:26rem;margin:auto;background:#0e0e10;color:#f4f4f5"><h1 style="font-size:1.4rem;margin:0 0 .6rem">' + h + '</body>'); };
    if (req.method === 'GET') { const v = peekPair(tok); if (!v) { noteFail(ip); logEvent(req, 'login_denied', { method: 'pair' }); return page('Link expired</h1><p>Pairing links last five minutes and work once. Make a new one in Security on your computer.</p>', 403); } return page('Sign in this phone?</h1><p style="color:#b4b4bb">This links <b>' + v.label.replace(/[&<>"]/g, '') + '</b> to your Anands OS. You can sign it out any time from Security on your computer.</p><form method=post><button style="font:inherit;font-weight:600;padding:.8rem 1.2rem;border:0;border-radius:12px;background:#f68712;color:#1a1000;width:100%">Sign in this phone</button></form>'); }
    const v = redeemPair(tok); if (!v) { noteFail(ip); logEvent(req, 'login_denied', { method: 'pair' }); return page('Link expired</h1><p>Make a new one in Security on your computer.</p>', 403); }
    setCookie(res, SESSION_COOKIE, sign({ u: 'owner', n: OWNER, sid: createSession(req, { u: 'owner', n: OWNER, method: 'paired', label: v.label }) }, TTL), { maxAge: TTL, secure });
    res.writeHead(302, { location: '/' }); return res.end();
  }
  if (p.startsWith('/auth/invite/') && req.method === 'GET') {
    const ip = clientIp(req); if (limited(ip)) throw httpError(429, 'Too many attempts. Wait 15 minutes.', 'rate_limited');
    const r = redeem(decodeURIComponent(p.slice(13)));
    if (r.err) { noteFail(ip); logEvent(req, 'login_denied', { method: 'invite' }); res.writeHead(403, { 'content-type': 'text/html; charset=utf-8' }); return res.end('<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><body style="font:16px system-ui;padding:2.5rem 1.25rem;max-width:30rem;margin:auto"><h1 style="font-size:1.4rem">Invitation</h1><p>' + r.err.replace(/[<>&]/g, '') + '</p>'); }
    const m = r.m, ttl = m.expires ? Math.max(60, Math.min(TTL, Math.floor((m.expires - Date.now()) / 1000))) : TTL;
    setCookie(res, SESSION_COOKIE, sign({ u: 'm_' + m.id, n: m.name, role: m.role, mid: m.id, sid: createSession(req, { u: 'm_' + m.id, n: m.name, role: m.role, mid: m.id, method: 'invite' }) }, ttl), { maxAge: ttl, secure });
    logEvent(req, 'invite_used', { user: m.name });
    res.writeHead(302, { location: '/' }); return res.end();
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
    const isOwner = !OIDC.allowed.length || OIDC.allowed.includes(email) || OIDC.allowed.includes(String(info.preferred_username || '').toLowerCase());
    const mem = isOwner ? null : findByEmail(email);
    if (!isOwner && !mem) { logEvent(req, 'login_denied', { user: email || id, method: 'sso' }); throw httpError(403, 'This account is not allowed here'); }
    if (mem) {
      setCookie(res, 'aos_oidc', '', { maxAge: 0, secure });
      setCookie(res, SESSION_COOKIE, sign({ u: 'm_' + mem.id, n: mem.name, e: email, role: mem.role, mid: mem.id, sid: createSession(req, { u: 'm_' + mem.id, n: mem.name, role: mem.role, mid: mem.id, method: 'sso' }) }, TTL), { maxAge: TTL, secure });
      res.writeHead(302, { location: '/' }); return res.end();
    }
    setCookie(res, 'aos_oidc', '', { maxAge: 0, secure });
    const nm = info.name || info.preferred_username || id;
    setCookie(res, SESSION_COOKIE, sign({ u: id, n: nm, e: email || null, sid: createSession(req, { u: id, n: nm, method: 'sso' }) }, TTL), { maxAge: TTL, secure });
    res.writeHead(302, { location: '/' }); return res.end();
  }
  return false;
}
export function sessionInfo(req) {
  const s = sessionOf(req);
  if (s && s.role && s.role !== 'owner') { const perm = permOf(s); return { user: { name: s.n || s.u, email: s.e || null, avatar: null, title: s.role === 'guest' ? 'Guest' : 'Team member', role: s.role, perm }, ...loginInfo() }; }
  const pf = s ? profileOf() : null;
  return { user: s ? { name: (pf.name || s.n || s.u), email: (pf.email || s.e || null), avatar: pf.avatar, title: pf.title, role: 'owner' } : null, ...loginInfo() };
}
