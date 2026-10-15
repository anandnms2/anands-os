/* Google Drive as a file system with the same calls as webdav.js (stat, list, read, write, mkdir, remove, moveCopy), so Files treats it like any other drive.
 * Paths are names (/Folder/Report.docx); they are turned into Google file ids by walking the folders. Google Docs, Sheets and Slides show up with an Office extension
 * and are exported when opened. Deleting moves to the Google Drive trash. */
import crypto from 'node:crypto';
import { httpError } from './util.js';
import { gapi, gConnected, gConfigured, FOLDER, EXPORT, shape, onConnect } from './gdrive.js';

const FIELDS = 'id,name,mimeType,size,modifiedTime,parents';
let cache = new Map(); onConnect(() => cache.clear());
const norm = (rel) => '/' + String(rel).split('/').filter(Boolean).join('/');
const parts = (rel) => norm(rel).split('/').filter(Boolean);
export const configured = () => gConfigured() && gConnected();

async function children(id) {
  const hit = cache.get(id); if (hit && Date.now() - hit.t < 8000) return hit.l;
  let l = [], tok = '';
  for (let i = 0; i < 6; i++) {
    const r = await gapi('/drive/v3/files?' + new URLSearchParams({ q: `'${id}' in parents and trashed=false`, pageSize: '1000', orderBy: 'folder,name', fields: `nextPageToken,files(${FIELDS})`, supportsAllDrives: 'true', includeItemsFromAllDrives: 'true', ...(tok ? { pageToken: tok } : {}) }));
    l = l.concat(r.data.files || []); tok = r.data.nextPageToken || ''; if (!tok) break;
  }
  if (cache.size > 300) cache.clear(); cache.set(id, { t: Date.now(), l }); return l;
}
const nameOf = (f) => shape(f).name;
async function resolve(rel) {
  let cur = { id: 'root', mimeType: FOLDER, name: '' };
  for (const part of parts(rel)) {
    if (cur.mimeType !== FOLDER) throw httpError(404, 'Not found', 'subject_does_not_exist');
    const kids = await children(cur.id); const hit = kids.find((f) => nameOf(f) === part) || kids.find((f) => f.name === part);
    if (!hit) throw httpError(404, 'Not found', 'subject_does_not_exist'); cur = hit;
  }
  return cur;
}
const entry = (f, rel) => ({ path: norm(rel), name: rel === '/' ? '/' : nameOf(f), dir: f.mimeType === FOLDER, size: Number(f.size) || 0, modified: f.modifiedTime ? Math.floor(Date.parse(f.modifiedTime) / 1000) : 0 });
export async function stat(rel) { const f = await resolve(rel); return entry(f, rel); }
export async function list(rel) { const f = await resolve(rel); if (f.mimeType !== FOLDER) throw httpError(400, 'Not a folder'); return (await children(f.id)).map((k) => entry(k, norm(rel + '/' + nameOf(k)))); }

export async function read(rel, range) {
  const f = await resolve(rel); if (f.mimeType === FOLDER) throw httpError(400, 'Is a directory');
  const ex = EXPORT[f.mimeType];
  const r = ex ? await gapi('/drive/v3/files/' + f.id + '/export?mimeType=' + encodeURIComponent(ex[0]), {}, 120000) : await gapi('/drive/v3/files/' + f.id + '?alt=media&supportsAllDrives=true', {}, 120000);
  let buf = r.buf, status = 200; const h = new Headers({ 'content-type': ex ? ex[0] : (f.mimeType || 'application/octet-stream'), 'accept-ranges': 'bytes' });
  const m = range && /^bytes=(\d*)-(\d*)$/.exec(range);
  if (m && (m[1] || m[2])) { const total = buf.length, a = m[1] === '' ? Math.max(0, total - Number(m[2])) : Number(m[1]), z = m[1] === '' || m[2] === '' ? total - 1 : Math.min(total - 1, Number(m[2])); if (a <= z && a < total) { h.set('content-range', `bytes ${a}-${z}/${total}`); buf = buf.subarray(a, z + 1); status = 206; } }
  h.set('content-length', String(buf.length)); return new Response(buf, { status, headers: h });
}
const JSONH = { 'content-type': 'application/json' };
async function mkfolder(name, parent) { const r = await gapi('/drive/v3/files?supportsAllDrives=true&fields=' + FIELDS, { method: 'POST', headers: JSONH, body: JSON.stringify({ name, mimeType: FOLDER, parents: [parent] }) }); cache.clear(); return r.data; }
export async function mkdir(rel, parentsOk) {
  const ps = parts(rel); let cur = { id: 'root', mimeType: FOLDER };
  for (let i = 0; i < ps.length; i++) {
    const last = i === ps.length - 1, kids = await children(cur.id), hit = kids.find((f) => nameOf(f) === ps[i]);
    if (hit) { if (last && !parentsOk) throw httpError(409, 'Already exists', 'item_with_same_name_exists'); if (hit.mimeType !== FOLDER) throw httpError(409, 'A file with that name exists', 'item_with_same_name_exists'); cur = hit; continue; }
    if (!last && !parentsOk) throw httpError(404, 'Parent folder does not exist', 'subject_does_not_exist');
    cur = await mkfolder(ps[i], cur.id);
  }
}
export async function write(rel, buf, type) {
  const ps = parts(rel); if (!ps.length) throw httpError(400, 'Bad path'); const name = ps.pop(); let parent; try { parent = await resolve('/' + ps.join('/')); } catch (e) { if (e.status === 404) throw httpError(404, 'Parent folder does not exist', 'subject_does_not_exist'); throw e; }
  if (parent.mimeType !== FOLDER) throw httpError(404, 'Parent folder does not exist', 'subject_does_not_exist');
  const kids = await children(parent.id), ex = kids.find((f) => nameOf(f) === name && f.mimeType !== FOLDER && !EXPORT[f.mimeType]), ct = type || 'application/octet-stream';
  if (ex) { await gapi('/upload/drive/v3/files/' + ex.id + '?uploadType=media&supportsAllDrives=true', { method: 'PATCH', headers: { 'content-type': ct }, body: buf }, 600000); }
  else {
    const bd = 'b' + crypto.randomBytes(12).toString('hex'), meta = JSON.stringify({ name, parents: [parent.id] });
    const body = Buffer.concat([Buffer.from(`--${bd}\r\ncontent-type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${bd}\r\ncontent-type: ${ct}\r\n\r\n`), buf, Buffer.from(`\r\n--${bd}--`)]);
    await gapi('/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true', { method: 'POST', headers: { 'content-type': `multipart/related; boundary=${bd}` }, body }, 600000);
  }
  cache.clear();
}
export async function remove(rel) { const f = await resolve(rel); if (f.id === 'root') throw httpError(400, 'Cannot delete the root'); await gapi('/drive/v3/files/' + f.id + '?supportsAllDrives=true', { method: 'PATCH', headers: JSONH, body: JSON.stringify({ trashed: true }) }); cache.clear(); }
const stripExt = (f, n) => { const e = EXPORT[f.mimeType]; return e && n.toLowerCase().endsWith(e[1]) ? n.slice(0, -e[1].length) : n; };
export async function moveCopy(method, from, to) {
  const f = await resolve(from); if (f.id === 'root') throw httpError(400, 'Cannot move the root');
  const tp = parts(to), nn = tp.pop(); const dest = await resolve('/' + tp.join('/')); if (dest.mimeType !== FOLDER) throw httpError(404, 'Not found', 'subject_does_not_exist');
  const name = stripExt(f, nn);
  if (method === 'COPY') { if (f.mimeType === FOLDER) throw httpError(400, 'Folders cannot be copied in Google Drive. Move it, or copy the files inside.'); await gapi('/drive/v3/files/' + f.id + '/copy?supportsAllDrives=true', { method: 'POST', headers: JSONH, body: JSON.stringify({ name, parents: [dest.id] }) }); }
  else { const old = (f.parents || []).join(','); await gapi('/drive/v3/files/' + f.id + '?supportsAllDrives=true&addParents=' + dest.id + (old ? '&removeParents=' + old : ''), { method: 'PATCH', headers: JSONH, body: JSON.stringify({ name }) }); }
  cache.clear();
}
export async function ping() { if (!gConfigured()) return { configured: false, connected: false }; if (!gConnected()) return { configured: true, connected: false, reason: 'Not connected yet' }; try { await children('root'); return { configured: true, connected: true }; } catch (e) { return { configured: true, connected: false, reason: e.message }; } }
