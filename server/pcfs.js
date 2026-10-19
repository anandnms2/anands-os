/* "This PC": folders on the computer that runs the desktop app, shown in Files as one drive (same calls as webdav.js and gfs.js).
 * Only the desktop app turns this on (AOS_DESKTOP=1). The folders it may open are listed in <data>/pc-folders.json by the app; nothing outside them is reachable. */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { DATA } from './config.js';
import { httpError } from './util.js';

const FILE = path.join(DATA, 'pc-folders.json');
const MIME = { txt: 'text/plain', md: 'text/markdown', html: 'text/html', css: 'text/css', json: 'application/json', csv: 'text/csv', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', pdf: 'application/pdf', mp3: 'audio/mpeg', wav: 'audio/wav', mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime' };
const roots = () => { if (process.env.AOS_DESKTOP !== '1') return []; try { const l = JSON.parse(fs.readFileSync(FILE, 'utf8')); const seen = new Set(); return l.filter((r) => r && r.name && r.path && fs.existsSync(r.path) && !seen.has(r.name) && seen.add(r.name)); } catch { return []; } };
export const configured = () => process.env.AOS_DESKTOP === '1' && roots().length > 0;
const NF = () => httpError(404, 'Not found', 'subject_does_not_exist');
const norm = (rel) => '/' + String(rel).split('/').filter(Boolean).join('/');
/* "/Documents/a/b.txt" -> { root, abs }; "/" -> null (the list of folders) */
function locate(rel) {
  const ps = norm(rel).split('/').filter(Boolean); if (!ps.length) return null;
  if (ps.some((x) => x === '..')) throw httpError(400, 'Bad path', 'bad_path');
  const r = roots().find((x) => x.name === ps[0]); if (!r) throw NF();
  const base = path.resolve(r.path), abs = path.join(base, ...ps.slice(1));
  if (abs !== base && !abs.startsWith(base + path.sep)) throw httpError(400, 'Bad path', 'bad_path');
  return { root: r, base, abs, rel: norm(rel) };
}
const entry = (rel, name, st) => ({ path: norm(rel), name, dir: st.isDirectory(), size: st.isDirectory() ? 0 : st.size, modified: Math.floor(st.mtimeMs / 1000) });
const rootEntry = (r) => ({ path: '/' + r.name, name: r.name, dir: true, size: 0, modified: 0 });
const need = (l) => { if (!l) throw httpError(400, 'Choose a folder first'); return l; };
export async function stat(rel) { const l = locate(rel); if (!l) return { path: '/', name: '/', dir: true, size: 0, modified: 0 }; try { return entry(rel, l.abs === l.base ? l.root.name : path.basename(l.abs), await fsp.stat(l.abs)); } catch { throw NF(); } }
export async function list(rel) {
  const l = locate(rel); if (!l) return roots().map(rootEntry);
  let names; try { names = await fsp.readdir(l.abs); } catch { throw NF(); }
  const out = []; for (const n of names) { try { out.push(entry(path.posix.join(norm(rel), n), n, await fsp.stat(path.join(l.abs, n)))); } catch {} } return out;
}
export async function read(rel, range) {
  const l = need(locate(rel)); let st; try { st = await fsp.stat(l.abs); } catch { throw NF(); } if (st.isDirectory()) throw httpError(400, 'Is a directory');
  const type = MIME[path.extname(l.abs).slice(1).toLowerCase()] || 'application/octet-stream', m = range && /^bytes=(\d*)-(\d*)$/.exec(range), h = new Headers({ 'content-type': type, 'accept-ranges': 'bytes' });
  let start = 0, end = st.size - 1, status = 200;
  if (m && (m[1] || m[2])) { start = m[1] === '' ? Math.max(0, st.size - Number(m[2])) : Number(m[1]); end = m[1] === '' || m[2] === '' ? st.size - 1 : Math.min(st.size - 1, Number(m[2])); if (start <= end && start < st.size) { status = 206; h.set('content-range', `bytes ${start}-${end}/${st.size}`); } else { start = 0; end = st.size - 1; } }
  h.set('content-length', String(st.size ? end - start + 1 : 0));
  return new Response(st.size ? Readable.toWeb(fs.createReadStream(l.abs, { start, end })) : null, { status, headers: h });
}
export async function write(rel, buf) { const l = need(locate(rel)); if (l.abs === l.base) throw httpError(400, 'Bad path'); try { if (!(await fsp.stat(path.dirname(l.abs))).isDirectory()) throw 0; } catch { throw httpError(404, 'Parent folder does not exist', 'subject_does_not_exist'); } await fsp.writeFile(l.abs, buf); }
export async function mkdir(rel, parents) { const l = need(locate(rel)); try { await fsp.mkdir(l.abs, { recursive: !!parents }); } catch (e) { if (e.code === 'EEXIST') { if (!parents) throw httpError(409, 'Already exists', 'item_with_same_name_exists'); } else if (e.code === 'ENOENT') throw httpError(404, 'Parent folder does not exist', 'subject_does_not_exist'); else throw e; } }
export async function remove(rel) { const l = need(locate(rel)); if (l.abs === l.base) throw httpError(400, 'Cannot delete a shared folder here'); try { await fsp.stat(l.abs); } catch { throw NF(); } await fsp.rm(l.abs, { recursive: true, force: true }); }
export async function moveCopy(method, from, to) {
  const a = need(locate(from)), z = need(locate(to)); if (a.abs === a.base) throw httpError(400, 'Cannot move a shared folder here'); try { await fsp.stat(a.abs); } catch { throw NF(); }
  await fsp.mkdir(path.dirname(z.abs), { recursive: true });
  if (method === 'COPY') await fsp.cp(a.abs, z.abs, { recursive: true }); else { try { await fsp.rename(a.abs, z.abs); } catch (e) { if (e.code === 'EXDEV') { await fsp.cp(a.abs, z.abs, { recursive: true }); await fsp.rm(a.abs, { recursive: true, force: true }); } else throw e; } }
}
export async function ping() { return { configured: configured(), connected: configured() }; }
