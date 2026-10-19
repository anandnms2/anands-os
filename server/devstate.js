/* Look and layout kept in the browser (desktop icons, pins, custom wallpaper picture, view choices) so the desktop app can show the same.
 * The web version pushes each change here; the desktop app copies this file with its other data and applies it. Owner only.
 * Never stored: anything of the Vault, queued captures, and the offline switch. */
import fs from 'node:fs';
import path from 'node:path';
import { DATA } from './config.js';
import { json, readJson, httpError } from './util.js';

const F = path.join(DATA, 'devstate.json');
const OK = (k) => typeof k === 'string' && /^aos\.[A-Za-z0-9._-]{1,60}$/.test(k) && !/^aos\.(vault\.|capq$|offline$|__)/.test(k);
const LIMIT = 3 * 1024 * 1024;
const load = () => { try { const j = JSON.parse(fs.readFileSync(F, 'utf8')); return { t: Number(j.t) || 0, items: j.items && typeof j.items === 'object' ? j.items : {} }; } catch { return { t: 0, items: {} }; } };
export async function handleDevstate(req, res, owner) {
  if (!owner) throw httpError(403, 'Only the owner can use this', 'forbidden');
  if (req.method === 'GET') return json(res, 200, load());
  if (req.method !== 'PUT') throw httpError(405, 'Method not allowed');
  const b = await readJson(req, LIMIT + 4096), cur = load();
  for (const [k, v] of Object.entries(b.set || {})) if (OK(k) && typeof v === 'string' && v.length <= 2 * 1024 * 1024) cur.items[k] = v;
  for (const k of Array.isArray(b.del) ? b.del : []) if (OK(k)) delete cur.items[k];
  if (JSON.stringify(cur.items).length > LIMIT) throw httpError(413, 'Too much saved layout data');
  cur.t = Date.now(); const tmp = F + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(cur), { mode: 0o600 }); fs.renameSync(tmp, F);
  return json(res, 200, { t: cur.t });
}
