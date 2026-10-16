/* Look and feel settings (theme, accent, widgets, shortcuts) kept on the server so every device of yours matches. */
import fs from 'node:fs';
import path from 'node:path';
import { DATA } from './config.js';
import { json, readJson, httpError } from './util.js';

const F = path.join(DATA, 'prefs.json');
let cache = null;
const load = () => { if (cache) return cache; try { cache = JSON.parse(fs.readFileSync(F, 'utf8')) || {}; } catch { cache = {}; } return cache; };
const num = (v, lo, hi, d) => { const n = Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };
function clean(b) {
  const o = {};
  if (['system', 'light', 'dark'].includes(b.mode)) o.mode = b.mode;
  if (/^#[0-9a-f]{6}$/i.test(b.accent || '')) o.accent = b.accent.toLowerCase(); else if (b.accent === 'default') o.accent = 'default';
  if (typeof b.oswall === 'boolean') o.oswall = b.oswall;
  if (b.fs !== undefined) o.fs = num(b.fs, 13, 19, 15);
  if (typeof b.keys === 'boolean') o.keys = b.keys;
  if (b.wall && /^[a-z0-9-]{1,20}$/.test(b.wall)) o.wall = b.wall;
  if (b.widgets && typeof b.widgets === 'object') { o.widgets = {}; for (const [k, v] of Object.entries(b.widgets).slice(0, 12)) if (/^[a-z]{2,12}$/.test(k) && v && typeof v === 'object') o.widgets[k] = { on: !!v.on, x: num(v.x, -100, 6000, 0), y: num(v.y, -100, 4000, 0) }; }
  return o;
}
export async function handlePrefs(req, res) {
  if (req.method === 'GET') return json(res, 200, load());
  if (req.method === 'PUT') { const b = await readJson(req, 8 * 1024); const next = { ...clean(b), t: Date.now() }; cache = next; const t = F + '.tmp'; fs.writeFileSync(t, JSON.stringify(next), { mode: 0o600 }); fs.renameSync(t, F); return json(res, 200, next); }
  throw httpError(405, 'Method not allowed');
}
