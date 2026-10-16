/* Desktop extras kept on the server: sticky notes and alarms (per person), and currency rates for the converter. */
import fs from 'node:fs';
import path from 'node:path';
import { DATA } from './config.js';
import { json, readJson, httpError } from './util.js';
import { isOwner } from './team.js';

const F = path.join(DATA, 'desk.json');
let cache = null;
const load = () => { if (cache) return cache; try { cache = JSON.parse(fs.readFileSync(F, 'utf8')) || {}; } catch { cache = {}; } return cache; };
const save = () => { const t = F + '.tmp'; fs.writeFileSync(t, JSON.stringify(cache), { mode: 0o600 }); fs.renameSync(t, F); };
const num = (v, lo, hi, d) => { const n = Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : d; };
const COLORS = ['y', 'o', 'p', 'g', 'b'];

export function cleanDesk(b) {
  const notes = (Array.isArray(b.notes) ? b.notes : []).slice(0, 60).map((n) => ({
    id: String(n.id || '').replace(/[^a-z0-9]/gi, '').slice(0, 16) || Math.random().toString(36).slice(2, 10),
    x: num(n.x, -200, 6000, 40), y: num(n.y, -100, 4000, 40), w: num(n.w, 150, 800, 230), h: num(n.h, 110, 800, 190), z: num(n.z, 0, 99999, 1),
    c: COLORS.includes(n.c) ? n.c : 'y', t: String(n.t || '').slice(0, 4000)
  }));
  const alarms = (Array.isArray(b.alarms) ? b.alarms : []).slice(0, 30).map((a) => ({
    id: String(a.id || '').replace(/[^a-z0-9]/gi, '').slice(0, 16) || Math.random().toString(36).slice(2, 10),
    h: num(a.h, 0, 23, 7), m: num(a.m, 0, 59, 0), label: String(a.label || '').slice(0, 80), on: !!a.on,
    days: [...new Set((Array.isArray(a.days) ? a.days : []).map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort()
  }));
  return { notes, alarms };
}

const WANT = ['USD', 'TZS', 'ZMW', 'CDF', 'KES', 'UGX', 'RWF', 'ZAR', 'MZN', 'MWK', 'BWP', 'AOA', 'AED', 'INR', 'EUR', 'GBP', 'CNY'];
const RF = path.join(DATA, 'rates.json'); let rates = null; const TTL = 6 * 3600 * 1000;
function readRates() { if (rates) return rates; try { rates = JSON.parse(fs.readFileSync(RF, 'utf8')); } catch { rates = null; } return rates; }
export async function getRates(force) {
  const cur = readRates();
  if (cur && !force && Date.now() - cur.fetched < TTL) return { ...cur, stale: false };
  const url = process.env.RATES_URL || 'https://open.er-api.com/v6/latest/USD';
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { accept: 'application/json' } }); if (!r.ok) throw new Error('status ' + r.status);
    const j = await r.json(); const src = j.rates || j.conversion_rates; if (!src || typeof src.TZS !== 'number') throw new Error('no rates');
    const out = {}; for (const k of WANT) if (typeof src[k] === 'number' && src[k] > 0) out[k] = src[k]; out.USD = 1;
    rates = { base: 'USD', rates: out, updated: j.time_last_update_unix ? j.time_last_update_unix * 1000 : Date.now(), fetched: Date.now() };
    try { fs.writeFileSync(RF + '.tmp', JSON.stringify(rates)); fs.renameSync(RF + '.tmp', RF); } catch {}
    return { ...rates, stale: false };
  } catch (e) {
    if (cur) return { ...cur, stale: true };
    throw httpError(502, 'Could not get exchange rates right now');
  }
}

export async function handleDesk(req, res, url, s) {
  const p = url.pathname;
  if (p === '/api/rates') { if (req.method !== 'GET') throw httpError(405, 'Method not allowed'); return json(res, 200, await getRates(false)); }
  const key = isOwner(s) ? 'owner' : 'm' + s.mid, db = load();
  if (req.method === 'GET') return json(res, 200, db[key] || { notes: [], alarms: [] });
  if (req.method === 'PUT') { const b = await readJson(req, 256 * 1024); db[key] = { ...cleanDesk(b), t: Date.now() }; save(); return json(res, 200, db[key]); }
  throw httpError(405, 'Method not allowed');
}
