/* Desktop sync (owner only): lets the desktop app copy this account's data (files, mail, calendar and app data, saved connection settings)
 * so it can run the same account offline. Never includes sign-in material: sessions, the session secret, API tokens, team members. */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { DATA, effective } from './config.js';
import { httpError } from './util.js';

const DIRS = ['fs', 'kv'];
const FILES = ['settings.json', 'profile.json', 'prefs.json', 'desk.json', 'household.json', 'money.json', 'contacts-map.json', 'devstate.json', 'mailboxes.json', 'mail-sent.json', 'avatar.bin', 'gdrive.json', 'rates.json'];
/* settings.json for the desktop = what the web server actually uses: saved settings plus values that only come from environment variables
 * (API keys and tokens set in the host's environment never appear in the saved file). Web address and sign-in setup are left out. */
const SKIP = new Set(['public', 'oidc']);
function settingsPayload() {
  let saved = {}; try { saved = JSON.parse(fs.readFileSync(path.join(DATA, 'settings.json'), 'utf8')); } catch {}
  const out = JSON.parse(JSON.stringify(saved)); for (const g of SKIP) delete out[g];
  const eff = effective();
  for (const [g, o] of Object.entries(eff)) {
    if (SKIP.has(g) || !o || typeof o !== 'object') continue;
    for (const [k, v] of Object.entries(o)) { if (v === '' || v === undefined || v === null || (Array.isArray(v) && !v.length)) continue; out[g] = out[g] || {}; if (out[g][k] === undefined || out[g][k] === '') out[g][k] = v; }
  }
  const buf = Buffer.from(JSON.stringify(out, null, 2));
  let mt = 0; try { mt = Math.floor(fs.statSync(path.join(DATA, 'settings.json')).mtimeMs); } catch {}
  return { buf, h: crypto.createHash('sha1').update(buf).digest('hex'), mtime: mt || 1 };
}
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
  for (const f of FILES) { if (f === 'settings.json') { const sp = settingsPayload(); out.files.push({ p: f, size: sp.buf.length, mtime: sp.mtime, h: sp.h }); continue; } try { const st = await fsp.stat(path.join(DATA, f)); if (st.isFile()) out.files.push({ p: f, size: st.size, mtime: Math.floor(st.mtimeMs) }); } catch {} }
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
  if (url.searchParams.get('p') === 'settings.json') { const sp = settingsPayload(); res.writeHead(200, { 'content-type': 'application/octet-stream', 'content-length': sp.buf.length, 'cache-control': 'no-store' }); return res.end(sp.buf); }
  let st; try { st = fs.lstatSync(abs); } catch { throw httpError(404, 'Not found'); }
  if (!st.isFile() || st.size > MAX) throw httpError(404, 'Not found');
  res.writeHead(200, { 'content-type': 'application/octet-stream', 'content-length': st.size, 'cache-control': 'no-store' });
  fs.createReadStream(abs).on('error', () => res.destroy()).pipe(res);
}
