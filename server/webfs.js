/* "Anands Web": your online Anands OS (its files, Drive and Google Drive) as a drive inside the desktop app, while this computer is online.
 * The desktop app passes WEB_URL and WEB_PASSWORD; calls go to the web server's own file API. Offline, calls fail quickly and Files shows the folder as unreachable. */
import { httpError } from './util.js';

const url = () => (process.env.WEB_URL || '').replace(/\/+$/, '');
export const configured = () => process.env.AOS_DESKTOP === '1' && !!url() && !!process.env.WEB_PASSWORD;
let cookie = '', login = null;
const NF = () => httpError(404, 'Not found', 'subject_does_not_exist');
async function signIn() {
  if (!login) login = (async () => {
    let r; try { r = await fetch(url() + '/auth/password', { method: 'POST', headers: { 'content-type': 'application/json', 'x-aos': '1' }, body: JSON.stringify({ password: process.env.WEB_PASSWORD }), signal: AbortSignal.timeout(8000) }); } catch { throw httpError(503, 'Anands Web is not reachable. Check your internet connection.', 'offline'); }
    if (!r.ok) throw httpError(r.status === 401 || r.status === 403 ? 401 : 502, r.status === 401 || r.status === 403 ? 'Anands Web did not accept the saved password. Reconnect it from the app menu.' : 'Anands Web is not available right now.', 'web_auth');
    cookie = r.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
  })().finally(() => { login = null; }); return login;
}
async function call(path, init = {}, retry = true) {
  if (!configured()) throw httpError(404, 'Not found', 'subject_does_not_exist');
  if (!cookie) await signIn();
  let r; try { r = await fetch(url() + '/_local' + path, { ...init, headers: { 'x-aos': '1', cookie, ...(init.headers || {}) }, signal: init.signal || AbortSignal.timeout(init.timeout || 20000) }); } catch { throw httpError(503, 'Anands Web is not reachable. Check your internet connection.', 'offline'); }
  if (r.status === 401 && retry) { cookie = ''; return call(path, init, false); }
  if (!r.ok) { let m = ''; try { m = (await r.json()).message || ''; } catch {} throw httpError(r.status === 404 ? 404 : r.status >= 500 ? 502 : r.status, m || 'Anands Web refused that', r.status === 404 ? 'subject_does_not_exist' : undefined); }
  return r;
}
const post = (p, body) => call(p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
const norm = (rel) => '/' + String(rel).split('/').filter(Boolean).join('/');
const entry = (e) => ({ path: norm(e.path), name: e.name, dir: !!e.is_dir, size: e.size || 0, modified: e.modified || 0 });
export async function stat(rel) { return entry(await (await post('/fs/stat', { path: norm(rel) })).json()); }
export async function list(rel) { return (await (await post('/fs/readdir', { path: norm(rel) })).json()).map(entry); }
export async function read(rel, range) { return call('/fs/get?path=' + encodeURIComponent(norm(rel)), { headers: range ? { range } : {}, timeout: 120000 }); }
export async function write(rel, buf, type) { await call('/fs/write?overwrite=1&path=' + encodeURIComponent(norm(rel)), { method: 'POST', headers: { 'content-type': type || 'application/octet-stream' }, body: buf, timeout: 600000 }); }
export async function mkdir(rel, parents) { await post('/fs/mkdir', { path: norm(rel), parents: !!parents }); }
export async function remove(rel) { await post('/fs/delete', { path: norm(rel), recursive: true }); }
export async function moveCopy(method, from, to) { await post(method === 'COPY' ? '/fs/copy' : '/fs/move', { from: norm(from), to: norm(to) }); }
export async function ping() { if (!configured()) return { configured: false, connected: false }; try { await stat('/'); return { configured: true, connected: true }; } catch (e) { return { configured: true, connected: false, reason: e.message }; } }
