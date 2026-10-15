/* Google Drive, full access: browse, open, upload, create folders, rename, move, copy and delete (to the Google trash). It appears as "Google Drive" next to Drive
 * in Files. OAuth happens here; the refresh token stays in the data volume and never reaches the browser. */
import fs from 'node:fs';
import path from 'node:path';
import { DATA, effective } from './config.js';
import { json, httpError, rawFetch, isHttps } from './util.js';
import { sign, verify } from './session.js';
import { publicOrigin } from './origin.js';
import * as dav from './webdav.js';

const API = () => (process.env.GDRIVE_API_BASE || 'https://www.googleapis.com').replace(/\/+$/, '');
const AUTH = () => process.env.GOOGLE_OAUTH_AUTH || 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN = () => process.env.GOOGLE_OAUTH_TOKEN || 'https://oauth2.googleapis.com/token';
const FILE = path.join(DATA, 'gdrive.json');
let tok = null; try { tok = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch {}
let access = null;
const save = () => { try { if (tok) fs.writeFileSync(FILE, JSON.stringify(tok), { mode: 0o600 }); else fs.rmSync(FILE, { force: true }); } catch {} };
const g = () => effective().google;
export const gConfigured = () => !!(g().clientId && g().clientSecret);
export const gConnected = () => !!(tok && tok.refresh);
const redirectUri = (req) => (publicOrigin() || (req ? (isHttps(req, '') ? 'https' : 'http') + '://' + req.headers.host : '')) + '/auth/google/callback';
const SCOPE = 'openid email https://www.googleapis.com/auth/drive';

async function accessToken() {
  if (!gConfigured()) throw httpError(409, 'Google Drive is not set up. Add the Google client ID and secret in Settings.', 'not_configured');
  if (!gConnected()) throw httpError(409, 'Google Drive is not connected. Connect it in Settings.', 'not_connected');
  if (access && access.exp > Date.now() + 30000) return access.t;
  const body = new URLSearchParams({ client_id: g().clientId, client_secret: g().clientSecret, refresh_token: tok.refresh, grant_type: 'refresh_token' });
  const r = await rawFetch(TOKEN(), { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body }, 15000);
  if (!r.ok || !r.data?.access_token) { if (r.status === 400 || r.status === 401) { tok = null; save(); } throw httpError(502, 'Google rejected the saved connection. Connect Google Drive again in Settings.', 'upstream_auth'); }
  access = { t: r.data.access_token, exp: Date.now() + (r.data.expires_in || 3000) * 1000 }; return access.t;
}
export async function gapi(p, init = {}, timeout = 25000) {
  const t = await accessToken(); const r = await rawFetch(API() + p, { ...init, headers: { authorization: 'Bearer ' + t, ...(init.headers || {}) } }, timeout);
  if (r.status === 401) { access = null; throw httpError(502, 'Google rejected the request. Connect again in Settings.', 'upstream_auth'); }
  if (r.status === 404) throw httpError(404, 'Not found', 'subject_does_not_exist');
  if (!r.ok) throw httpError(502, r.data?.error?.message || 'Google answered ' + r.status, 'upstream_' + r.status);
  return r;
}
export const FOLDER = 'application/vnd.google-apps.folder';
export const EXPORT = { 'application/vnd.google-apps.document': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx'], 'application/vnd.google-apps.spreadsheet': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.xlsx'], 'application/vnd.google-apps.presentation': ['application/vnd.openxmlformats-officedocument.presentationml.presentation', '.pptx'], 'application/vnd.google-apps.drawing': ['application/pdf', '.pdf'] };
export const shape = (f) => ({ id: f.id, name: f.name + (EXPORT[f.mimeType] && !f.name.toLowerCase().endsWith(EXPORT[f.mimeType][1]) ? EXPORT[f.mimeType][1] : ''), is_dir: f.mimeType === FOLDER, size: Number(f.size) || 0, modified: f.modifiedTime ? Math.floor(Date.parse(f.modifiedTime) / 1000) : null, mime: f.mimeType });
const gid = (v) => { v = String(v || ''); if (!/^[A-Za-z0-9_-]{1,120}$/.test(v)) throw httpError(400, 'Bad id'); return v; };

async function fetchFile(id) {
  const meta = (await gapi('/drive/v3/files/' + id + '?fields=id,name,mimeType,size&supportsAllDrives=true')).data;
  const ex = EXPORT[meta.mimeType];
  if (meta.mimeType === FOLDER) throw httpError(400, 'That is a folder');
  const r = ex ? await gapi('/drive/v3/files/' + id + '/export?mimeType=' + encodeURIComponent(ex[0]), {}, 120000) : await gapi('/drive/v3/files/' + id + '?alt=media&supportsAllDrives=true', {}, 120000);
  return { buf: r.buf, type: ex ? ex[0] : (meta.mimeType || 'application/octet-stream'), name: shape(meta).name };
}

export async function handleGdrive(req, res, url) {
  const p = url.pathname.replace(/^\/api\/gdrive/, '') || '/', sp = url.searchParams;
  if (p === '/status') return json(res, 200, { configured: gConfigured(), connected: gConnected(), email: tok?.email || '', redirectUri: redirectUri(req) });
  if (p === '/auth') {
    if (!gConfigured()) throw httpError(409, 'Add the Google client ID and secret in Settings first.', 'not_configured');
    const state = sign({ g: 1 }, 600);
    const u = new URL(AUTH()); u.search = new URLSearchParams({ client_id: g().clientId, redirect_uri: redirectUri(req), response_type: 'code', scope: SCOPE, include_granted_scopes: 'true', access_type: 'offline', prompt: 'consent', state }).toString();
    res.writeHead(302, { location: u.toString() }); return res.end();
  }
  if (p === '/disconnect' && req.method === 'POST') { tok = null; access = null; save(); return json(res, 200, { ok: true }); }
  if (p === '/list' && req.method === 'GET') {
    const folder = sp.get('folder') && sp.get('folder') !== 'root' ? gid(sp.get('folder')) : 'root', q = String(sp.get('q') || '').replace(/['\\]/g, ' ').slice(0, 100).trim();
    const where = q ? `name contains '${q}' and trashed=false` : `'${folder}' in parents and trashed=false`;
    const r = await gapi('/drive/v3/files?' + new URLSearchParams({ q: where, pageSize: '200', orderBy: 'folder,name', fields: 'files(id,name,mimeType,size,modifiedTime)', supportsAllDrives: 'true', includeItemsFromAllDrives: 'true' }));
    return json(res, 200, { files: (r.data.files || []).map(shape) });
  }
  if (p === '/file' && req.method === 'GET') {
    const f = await fetchFile(gid(sp.get('id'))); const dl = sp.get('dl') === '1';
    res.writeHead(200, { 'content-type': f.type, 'content-length': f.buf.length, 'content-disposition': (dl ? 'attachment' : 'inline') + "; filename*=UTF-8''" + encodeURIComponent(f.name), 'cache-control': 'private, max-age=60', 'content-security-policy': "default-src 'none'; img-src 'self' data:; media-src 'self'; style-src 'unsafe-inline'; sandbox" });
    return res.end(f.buf);
  }
  if (p === '/import' && req.method === 'POST') {
    const b = JSON.parse((await (await import('./util.js')).readBody(req, 8192)).toString() || '{}'); const f = await fetchFile(gid(b.id));
    if (!dav.configured()) throw httpError(409, 'Connect Cloudreve Drive in Settings first.', 'not_configured');
    const dir = '/Google Drive'; try { await dav.mkdir(dir, true); } catch {}
    const safe = f.name.replace(/[\\/:*?"<>|]/g, '_').slice(0, 150) || 'file'; await dav.write(dir + '/' + safe, f.buf, f.type);
    return json(res, 200, { path: '/Drive' + dir + '/' + safe, name: safe });
  }
  throw httpError(404, 'Unknown Google Drive route');
}

/* The browser comes back here from Google with ?code=...&state=... (the caller has already checked the sign-in session). */
export async function googleCallback(req, res, url) {
  const back = (ok, msg) => { res.writeHead(302, { location: '/?g=' + (ok ? 'ok' : 'err') + (msg ? '&m=' + encodeURIComponent(String(msg).slice(0, 300)) : '') + '#settings' }); res.end(); };
  try {
    const st = verify(url.searchParams.get('state') || ''); if (!st || !st.g) return back(false, 'That sign-in link expired. Press Connect Google Drive again.');
    const code = url.searchParams.get('code'); if (!code) return back(false, url.searchParams.get('error') === 'access_denied' ? 'Google said access was denied. If the app is in Testing mode, add your Google address under Test users in the Google Cloud consent screen.' : 'Google did not return a code (' + (url.searchParams.get('error') || 'cancelled') + ').');
    const body = new URLSearchParams({ code, client_id: g().clientId, client_secret: g().clientSecret, redirect_uri: redirectUri(req), grant_type: 'authorization_code' });
    const r = await rawFetch(TOKEN(), { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body }, 15000);
    if (!r.ok) return back(false, 'Google refused the sign-in: ' + (r.data?.error_description || r.data?.error || r.status) + '. Check that the client ID and secret are right and that ' + redirectUri(req) + ' is listed as an authorised redirect URI.');
    if (!r.data?.refresh_token) return back(false, 'Google did not give a long-lived connection. Remove this app at myaccount.google.com/permissions and connect again.');
    let email = ''; try { const id = r.data.id_token && JSON.parse(Buffer.from(r.data.id_token.split('.')[1], 'base64url').toString()); email = id?.email || ''; } catch {}
    tok = { refresh: r.data.refresh_token, email }; access = { t: r.data.access_token, exp: Date.now() + (r.data.expires_in || 3000) * 1000 }; save(); gcacheClear?.(); back(true, email);
  } catch (e) { back(false, e.message); }
}
let gcacheClear = null; export const onConnect = (f) => { gcacheClear = f; };
