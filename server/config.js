import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const env = process.env;
export const PORT = Number(env.PORT || 8080);
export const DATA = path.resolve(env.DATA_DIR || path.join(here, '..', 'data'));
export const WEB = path.resolve(env.WEB_DIR || path.join(here, '..', 'web'));
export const SUITE = path.resolve(env.SUITE_DIR || path.join(here, '..', 'suite', 'dist'));
export const SHIM = path.resolve(env.SHIM_FILE || path.join(here, '..', 'suite', 'shim', 'puter.js'));
export const PUBLIC_URL = (env.PUBLIC_URL || '').replace(/\/+$/, '');
fs.mkdirSync(DATA, { recursive: true });

function readOrCreate(file, make) {
  const p = path.join(DATA, file);
  try { return fs.readFileSync(p, 'utf8').trim(); } catch {}
  const v = make(); fs.writeFileSync(p, v + '\n', { mode: 0o600 }); return v;
}
export const SECRET = env.SESSION_SECRET || readOrCreate('secret', () => crypto.randomBytes(32).toString('hex'));

/* ---- login method ---- */
export const OIDC = env.OIDC_ISSUER && env.OIDC_CLIENT_ID ? {
  issuer: env.OIDC_ISSUER.replace(/\/+$/, ''), clientId: env.OIDC_CLIENT_ID, clientSecret: env.OIDC_CLIENT_SECRET || '',
  scope: env.OIDC_SCOPE || 'openid email profile',
  allowed: (env.OIDC_ALLOWED || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
} : null;
export const OWNER = env.OWNER_NAME || 'Anand';
let pw = env.APP_PASSWORD || '';
let generated = false;
if (!OIDC && !pw) { pw = readOrCreate('initial-password', () => crypto.randomBytes(9).toString('base64url')); generated = true; }
export const PASSWORD = pw;
export const PASSWORD_GENERATED = generated;

/* ---- connection settings: env gives defaults, the UI overrides and stores them in /data/settings.json ---- */
const sfile = path.join(DATA, 'settings.json');
let stored = {};
try { stored = JSON.parse(fs.readFileSync(sfile, 'utf8')); } catch {}
const clean = (v) => (typeof v === 'string' ? v.trim() : '');
const urlOk = (v) => { try { const u = new URL(v); return /^https?:$/.test(u.protocol); } catch { return false; } };

export function effective() {
  const s = stored;
  return {
    immich: { url: clean(s.immich?.url) || clean(env.IMMICH_URL), key: clean(s.immich?.key) || clean(env.IMMICH_API_KEY) },
    coolify: { url: clean(s.coolify?.url) || clean(env.COOLIFY_URL), token: clean(s.coolify?.token) || clean(env.COOLIFY_TOKEN) },
    status: { url: clean(s.status?.url) || clean(env.STATUS_URL), user: clean(s.status?.user) || clean(env.STATUS_USER), pass: clean(s.status?.pass) || clean(env.STATUS_PASSWORD) },
    vpn: { url: clean(s.vpn?.url) || clean(env.VPN_URL), user: clean(s.vpn?.user) || clean(env.VPN_USER), pass: clean(s.vpn?.pass) || clean(env.VPN_PASSWORD) },
    cards: { url: clean(s.cards?.url) || clean(env.CARDS_URL), user: clean(s.cards?.user) || clean(env.CARDS_USER), pass: clean(s.cards?.pass) || clean(env.CARDS_PASSWORD) },
    google: { clientId: clean(s.google?.clientId) || clean(env.GOOGLE_CLIENT_ID), clientSecret: clean(s.google?.clientSecret) || clean(env.GOOGLE_CLIENT_SECRET) },
    pulse: { url: clean(s.pulse?.url) || clean(env.PULSE_URL), token: clean(s.pulse?.token) || clean(env.PULSE_TOKEN) },
    dav: { url: clean(s.dav?.url) || clean(env.DAV_URL), user: clean(s.dav?.user) || clean(env.DAV_USER), pass: clean(s.dav?.pass) || clean(env.DAV_PASSWORD) },
    vault: { url: clean(s.vault?.url) || clean(env.VAULT_URL) },
    mail: { host: clean(s.mail?.host) || clean(env.SMTP_HOST), port: Number(s.mail?.port || env.SMTP_PORT || 0) || 0, security: clean(s.mail?.security) || clean(env.SMTP_SECURITY) || 'starttls', user: clean(s.mail?.user) || clean(env.SMTP_USER), pass: clean(s.mail?.pass) || clean(env.SMTP_PASSWORD), from: clean(s.mail?.from) || clean(env.SMTP_FROM), fromName: clean(s.mail?.fromName) || clean(env.SMTP_FROM_NAME), dailyCap: Math.min(2000, Math.max(1, Number(s.mail?.dailyCap || env.SMTP_DAILY_CAP || 0) || 200)) },
    public: { url: clean(s.public?.url) || PUBLIC_URL },
    turn: { urls: clean(s.turn?.urls) || clean(env.TURN_URLS), secret: clean(s.turn?.secret) || clean(env.TURN_SECRET), stun: clean(s.turn?.stun) || clean(env.STUN_URLS) },
    llm: { base: clean(s.llm?.base) || clean(env.LLM_BASE_URL), key: clean(s.llm?.key) || clean(env.LLM_API_KEY), model: clean(s.llm?.model) || clean(env.LLM_MODEL) || 'gpt-4o-mini' }
  };
}
export function publicSettings() {
  const e = effective();
  return {
    immich: { url: e.immich.url, keySet: !!e.immich.key },
    coolify: { url: e.coolify.url, tokenSet: !!e.coolify.token },
    status: { url: e.status.url, user: e.status.user, passSet: !!e.status.pass },
    vpn: { url: e.vpn.url, user: e.vpn.user, passSet: !!e.vpn.pass },
    cards: { url: e.cards.url, user: e.cards.user, passSet: !!e.cards.pass },
    pulse: { url: e.pulse.url, tokenSet: !!e.pulse.token },
    google: { clientId: e.google.clientId, secretSet: !!e.google.clientSecret },
    dav: { url: e.dav.url, user: e.dav.user, passSet: !!e.dav.pass },
    vault: { url: e.vault.url },
    mail: { host: e.mail.host, port: e.mail.port, security: e.mail.security, user: e.mail.user, passSet: !!e.mail.pass, from: e.mail.from, fromName: e.mail.fromName, dailyCap: e.mail.dailyCap },
    public: { url: e.public.url },
    turn: { urls: e.turn.urls, secretSet: !!e.turn.secret, stun: e.turn.stun },
    llm: { base: e.llm.base, keySet: !!e.llm.key, model: e.llm.model }
  };
}
/* patch: {immich:{url,key}, coolify:{url,token}, llm:{base,key,model}}. A blank secret keeps the stored one. */
export function updateSettings(patch) {
  const next = JSON.parse(JSON.stringify(stored));
  const set = (group, field, v, secret) => {
    if (v === undefined) return;
    v = clean(v);
    if (secret && v === '') return;
    if (!secret && v && !['model', 'user', 'host', 'fromName'].includes(field) && !urlOk(v)) throw Object.assign(new Error(`${group} address must start with http:// or https://`), { status: 400 });
    next[group] = next[group] || {}; next[group][field] = v;
  };
  const p = patch || {};
  set('immich', 'url', p.immich?.url); set('immich', 'key', p.immich?.key, true);
  set('coolify', 'url', p.coolify?.url); set('coolify', 'token', p.coolify?.token, true);
  for (const g of ['status', 'vpn', 'cards']) { set(g, 'url', p[g]?.url); set(g, 'user', p[g]?.user); set(g, 'pass', p[g]?.pass, true); }
  set('google', 'clientId', p.google?.clientId); set('google', 'clientSecret', p.google?.clientSecret, true);
  set('pulse', 'url', p.pulse?.url); set('pulse', 'token', p.pulse?.token, true);
  set('dav', 'url', p.dav?.url); set('dav', 'user', p.dav?.user); set('dav', 'pass', p.dav?.pass, true);
  set('vault', 'url', p.vault?.url);
  if (p.mail) {
    const m = p.mail;
    set('mail', 'host', m.host === undefined ? undefined : String(m.host).replace(/^[a-z]+:\/\//i, '').replace(/[\/\s].*$/, ''));
    if (m.port !== undefined) { const n = Number(m.port); if (m.port !== '' && (!Number.isInteger(n) || n < 1 || n > 65535)) throw Object.assign(new Error('Mail port must be a number from 1 to 65535'), { status: 400 }); next.mail = next.mail || {}; next.mail.port = m.port === '' ? 0 : n; }
    if (m.security !== undefined) { if (!['starttls', 'ssl', 'none'].includes(m.security)) throw Object.assign(new Error('Mail security must be starttls, ssl or none'), { status: 400 }); next.mail = next.mail || {}; next.mail.security = m.security; }
    set('mail', 'user', m.user); set('mail', 'pass', m.pass, true); set('mail', 'fromName', m.fromName === undefined ? undefined : String(m.fromName).replace(/[\r\n<>"]/g, ''));
    if (m.from !== undefined) { const f = clean(m.from); if (f && !/^[^\s@<>",;]+@[^\s@<>",;]+\.[^\s@<>",;]+$/.test(f)) throw Object.assign(new Error('The From address must look like name@example.com'), { status: 400 }); next.mail = next.mail || {}; next.mail.from = f; }
    if (m.dailyCap !== undefined && m.dailyCap !== '') { const n = Number(m.dailyCap); if (!Number.isInteger(n) || n < 1 || n > 2000) throw Object.assign(new Error('Daily email limit must be between 1 and 2000'), { status: 400 }); next.mail = next.mail || {}; next.mail.dailyCap = n; }
  }
  if (p.turn) {
    const clean_ = (v) => String(v).split(',').map((x) => x.trim()).filter(Boolean);
    for (const f of ['urls', 'stun']) if (p.turn[f] !== undefined) { const l = clean_(p.turn[f]); if (l.some((x) => !/^(stun|turn|turns):[^\s,]+$/i.test(x))) throw Object.assign(new Error('Relay addresses look like turn:host:3478 or stun:host:3478, separated by commas'), { status: 400 }); next.turn = next.turn || {}; next.turn[f] = l.join(','); }
    set('turn', 'secret', p.turn.secret, true);
  }
  set('public', 'url', p.public?.url === undefined ? undefined : String(p.public.url).replace(/\/+$/, ''));
  set('llm', 'base', p.llm?.base); set('llm', 'key', p.llm?.key, true); set('llm', 'model', p.llm?.model);
  stored = next;
  const tmp = sfile + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(stored, null, 2), { mode: 0o600 }); fs.renameSync(tmp, sfile);
}
export function clearSecret(group, field) { if (stored[group]) { delete stored[group][field]; fs.writeFileSync(sfile, JSON.stringify(stored, null, 2), { mode: 0o600 }); } }

/* Origins that may be shown inside the OS in a frame: the full Pulse and Card Scan apps. */
export function frameOrigins() { const e = effective(); const o = []; for (const u of [e.pulse.url, e.cards.url]) { try { o.push(new URL(u).origin); } catch {} } return o; }
