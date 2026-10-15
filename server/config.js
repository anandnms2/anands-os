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
    dav: { url: clean(s.dav?.url) || clean(env.DAV_URL), user: clean(s.dav?.user) || clean(env.DAV_USER), pass: clean(s.dav?.pass) || clean(env.DAV_PASSWORD) },
    vault: { url: clean(s.vault?.url) || clean(env.VAULT_URL) },
    llm: { base: clean(s.llm?.base) || clean(env.LLM_BASE_URL), key: clean(s.llm?.key) || clean(env.LLM_API_KEY), model: clean(s.llm?.model) || clean(env.LLM_MODEL) || 'gpt-4o-mini' }
  };
}
export function publicSettings() {
  const e = effective();
  return {
    immich: { url: e.immich.url, keySet: !!e.immich.key },
    coolify: { url: e.coolify.url, tokenSet: !!e.coolify.token },
    dav: { url: e.dav.url, user: e.dav.user, passSet: !!e.dav.pass },
    vault: { url: e.vault.url },
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
    if (!secret && v && field !== 'model' && field !== 'user' && !urlOk(v)) throw Object.assign(new Error(`${group} address must start with http:// or https://`), { status: 400 });
    next[group] = next[group] || {}; next[group][field] = v;
  };
  const p = patch || {};
  set('immich', 'url', p.immich?.url); set('immich', 'key', p.immich?.key, true);
  set('coolify', 'url', p.coolify?.url); set('coolify', 'token', p.coolify?.token, true);
  set('dav', 'url', p.dav?.url); set('dav', 'user', p.dav?.user); set('dav', 'pass', p.dav?.pass, true);
  set('vault', 'url', p.vault?.url);
  set('llm', 'base', p.llm?.base); set('llm', 'key', p.llm?.key, true); set('llm', 'model', p.llm?.model);
  stored = next;
  const tmp = sfile + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(stored, null, 2), { mode: 0o600 }); fs.renameSync(tmp, sfile);
}
export function clearSecret(group, field) { if (stored[group]) { delete stored[group][field]; fs.writeFileSync(sfile, JSON.stringify(stored, null, 2), { mode: 0o600 }); } }
