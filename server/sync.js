/* Desktop sync (owner only): lets the desktop app copy this account's data (files, mail, calendar and app data, saved connection settings)
 * so it can run the same account offline. Never includes sign-in material: sessions, the session secret, API tokens, team members. */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { DATA } from './config.js';
import { httpError } from './util.js';

const DIRS = ['fs', 'kv'];
const FILES = ['settings.json', 'profile.json', 'prefs.json', 'desk.json', 'household.json', 'money.json', 'contacts-map.json', 'mailboxes.json', 'mail-sent.json', 'avatar.bin', 'gdrive.json', 'rates.json'];
const MAX = 200 * 1024 * 1024;
const send = (res, code, o) => { const b = JSON.stringify(o); res.writeHead(code, { 'content-type': 'application/json', 'content-length': Buffer.byteLength(b), 'cache-control': 'no-store' }); res.end(b); };

async function walk(abs, rel, out) {
  let ents; try { ents = await fsp.readdir(abs, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    const a = path.join(abs, e.name), r = rel + '/' + e.name;
    if (e.isSymbolicLink() || /\.part$/.test(e.name)) continue;
    if (e.isDirectory()) { await walk(a, r, out); continue; }
    if (!e.isFile()) continue;
    let st; try { st = await fsp.stat(a); } catch { continue; }
    if (st.size > MAX) { out.skipped.push(r.slice(1)); continue; }
    out.files.push({ p: r.slice(1), size: st.size, mtime: Math.floor(st.mtimeMs) });
  }
}
export async function manifest() {
  const out = { files: [], skipped: [] };
  for (const d of DIRS) await walk(path.join(DATA, d), '/' + d, out);
  for (const f of FILES) { try { const st = await fsp.stat(path.join(DATA, f)); if (st.isFile()) out.files.push({ p: f, size: st.size, mtime: Math.floor(st.mtimeMs) }); } catch {} }
  return out;
}
function target(p) {
  p = String(p || ''); if (!p || p.includes('\0') || p.split('/').some((x) => x === '..' || x === '')) return null;
  if (!(FILES.includes(p) || DIRS.some((d) => p.startsWith(d + '/')))) return null;
  const abs = path.join(DATA, p); return abs.startsWith(DATA + path.sep) ? abs : null;
}
export async function handleSync(req, res, url, owner) {
  if (!owner) throw httpError(403, 'Only the owner can sync the desktop app', 'forbidden');
  if (req.method !== 'GET') throw httpError(405, 'Method not allowed');
  if (url.pathname === '/api/sync/manifest') return send(res, 200, await manifest());
  const abs = target(url.searchParams.get('p')); if (!abs) throw httpError(400, 'Bad path');
  let st; try { st = fs.lstatSync(abs); } catch { throw httpError(404, 'Not found'); }
  if (!st.isFile() || st.size > MAX) throw httpError(404, 'Not found');
  res.writeHead(200, { 'content-type': 'application/octet-stream', 'content-length': st.size, 'cache-control': 'no-store' });
  fs.createReadStream(abs).on('error', () => res.destroy()).pipe(res);
}
