/* Belongings (what you own, warranties, receipts) and Household (pantry stock and shopping lists). One small JSON store. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DATA } from './config.js';
import { json, readJson, httpError } from './util.js';

const FILE = path.join(DATA, 'household.json');
const id = () => crypto.randomBytes(5).toString('hex');
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const today = () => new Date().toISOString().slice(0, 10);
const need = (c, m) => { if (!c) throw httpError(400, m, 'bad_request'); };
const str = (v, n = 80) => String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, n);
const num = (v, d = 0) => { const n = Number(v); return Number.isFinite(n) && Math.abs(n) < 1e12 ? n : d; };
const dOr = (v) => (DATE.test(v || '') ? v : '');
const daysTo = (s) => Math.round((Date.parse(s + 'T12:00:00Z') - Date.parse(today() + 'T12:00:00Z')) / 864e5);
const UNITS = ['pcs', 'kg', 'g', 'l', 'ml', 'pack', 'box', 'bottle', 'can', 'bag'];
let S = null;
const fresh = () => ({ v: 1, locations: ['Living room', 'Kitchen', 'Bedroom', 'Office', 'Garage', 'Store room'].map((n) => ({ id: id(), name: n })), items: [], products: [], shopping: [] });
function load() { if (S) return S; try { S = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { S = fresh(); save(); } return S; }
function save() { fs.mkdirSync(path.dirname(FILE), { recursive: true }); const t = FILE + '.tmp'; fs.writeFileSync(t, JSON.stringify(S), { mode: 0o600 }); fs.renameSync(t, FILE); }
const stockOf = (p) => Math.round(p.batches.reduce((a, b) => a + b.qty, 0) * 1e6) / 1e6;
const soonest = (p) => p.batches.filter((b) => b.exp && b.qty > 0).map((b) => b.exp).sort()[0] || '';

function itemIn(b, cur) {
  const o = {};
  if (b.name !== undefined || !cur) { o.name = str(b.name, 80); need(o.name, 'Give it a name'); }
  if (b.location !== undefined) { need(!b.location || S.locations.some((l) => l.id === b.location), 'Unknown location'); o.location = b.location || ''; }
  if (b.qty !== undefined) o.qty = Math.max(0, Math.round(num(b.qty, 1)));
  if (b.category !== undefined) o.category = str(b.category, 40);
  if (b.value !== undefined) o.value = Math.max(0, num(b.value)); if (b.currency !== undefined) o.currency = str(b.currency, 5).toUpperCase();
  if (b.bought !== undefined) o.bought = dOr(b.bought); if (b.store !== undefined) o.store = str(b.store, 60);
  if (b.serial !== undefined) o.serial = str(b.serial, 60); if (b.warranty !== undefined) o.warranty = dOr(b.warranty);
  if (b.notes !== undefined) o.notes = str(b.notes, 500);
  if (b.receipt !== undefined) o.receipt = typeof b.receipt === 'string' && b.receipt.startsWith('/') && !b.receipt.includes('..') ? b.receipt.slice(0, 300) : '';
  if (b.photo !== undefined) o.photo = typeof b.photo === 'string' && b.photo.startsWith('/') && !b.photo.includes('..') ? b.photo.slice(0, 300) : '';
  return o;
}
const pubItem = (i) => { const wd = i.warranty ? daysTo(i.warranty) : null; return { id: i.id, name: i.name, location: i.location || '', qty: i.qty ?? 1, category: i.category || '', value: i.value || 0, currency: i.currency || '', bought: i.bought || '', store: i.store || '', serial: i.serial || '', warranty: i.warranty || '', warrantyDays: wd, notes: i.notes || '', receipt: i.receipt || '', photo: i.photo || '', created: i.created }; };
const pubProduct = (p) => { const st = stockOf(p), e = soonest(p); return { id: p.id, name: p.name, unit: p.unit || 'pcs', min: p.min || 0, location: p.location || '', stock: st, low: p.min > 0 && st < p.min, expires: e, expiresDays: e ? daysTo(e) : null, batches: p.batches.filter((b) => b.qty > 0).sort((a, b) => (a.exp || '9999').localeCompare(b.exp || '9999')), note: p.note || '' }; };
function view() {
  const items = S.items.map(pubItem), prods = S.products.map(pubProduct);
  const value = items.reduce((a, i) => a + i.value * (i.qty || 1), 0), cur = items.find((i) => i.currency)?.currency || '';
  return { locations: S.locations, items, products: prods, shopping: S.shopping, units: UNITS, today: today(),
    summary: { items: items.length, value, currency: cur, warrantyExpiring: items.filter((i) => i.warrantyDays != null && i.warrantyDays >= 0 && i.warrantyDays <= 60).length, warrantyExpired: items.filter((i) => i.warrantyDays != null && i.warrantyDays < 0).length, low: prods.filter((p) => p.low).length, expiring: prods.filter((p) => p.expiresDays != null && p.expiresDays <= 7 && p.stock > 0).length, toBuy: S.shopping.filter((s) => !s.done).length } };
}
function adjust(p, delta, exp) {
  if (delta > 0) { const e = dOr(exp); const b = p.batches.find((x) => x.exp === e); if (b) b.qty += delta; else p.batches.push({ id: id(), qty: delta, exp: e }); }
  else { let left = -delta; need(stockOf(p) + 1e-9 >= left, 'Only ' + stockOf(p) + ' in stock'); for (const b of [...p.batches].sort((a, b) => (a.exp || '9999').localeCompare(b.exp || '9999'))) { const t = Math.min(b.qty, left); b.qty -= t; left -= t; if (left <= 1e-9) break; } }
  p.batches = p.batches.filter((b) => b.qty > 1e-9);
}

export async function handleHousehold(req, res, url, sess) {
  if (sess && sess.role && sess.role !== 'owner') throw httpError(403, 'Household is private to the owner', 'forbidden');
  load(); const p = url.pathname.replace(/^\/api\/house/, '') || '/', m = req.method; let x; const body = async () => readJson(req, 256 * 1024);
  if (p === '/state' && m === 'GET') return json(res, 200, view());
  if (p === '/locations' && m === 'POST') { const b = await body(); const n = str(b.name, 40); need(n, 'Give the place a name'); S.locations.push({ id: id(), name: n }); save(); return json(res, 201, view()); }
  if ((x = p.match(/^\/locations\/([0-9a-f]{10})$/)) && m === 'DELETE') { S.locations = S.locations.filter((l) => l.id !== x[1]); S.items.forEach((i) => { if (i.location === x[1]) i.location = ''; }); S.products.forEach((q) => { if (q.location === x[1]) q.location = ''; }); save(); return json(res, 200, view()); }
  /* belongings */
  if (p === '/items' && m === 'POST') { const b = await body(); S.items.push({ id: id(), created: Date.now(), qty: 1, ...itemIn(b, null) }); save(); return json(res, 201, view()); }
  if ((x = p.match(/^\/items\/([0-9a-f]{10})$/))) { const it = S.items.find((i) => i.id === x[1]); if (!it) throw httpError(404, 'No such item'); if (m === 'PUT') { Object.assign(it, itemIn(await body(), it)); save(); return json(res, 200, view()); } if (m === 'DELETE') { S.items = S.items.filter((i) => i !== it); save(); return json(res, 200, view()); } }
  /* pantry */
  if (p === '/products' && m === 'POST') { const b = await body(); const n = str(b.name, 60); need(n, 'Give it a name'); const q = { id: id(), name: n, unit: UNITS.includes(b.unit) ? b.unit : 'pcs', min: Math.max(0, num(b.min)), location: S.locations.some((l) => l.id === b.location) ? b.location : '', note: str(b.note, 200), batches: [] }; if (num(b.stock) > 0) adjust(q, num(b.stock), b.expires); S.products.push(q); save(); return json(res, 201, view()); }
  if ((x = p.match(/^\/products\/([0-9a-f]{10})(\/stock)?$/))) {
    const q = S.products.find((y) => y.id === x[1]); if (!q) throw httpError(404, 'No such product');
    if (x[2] && m === 'POST') { const b = await body(); const dl = num(b.delta); need(dl !== 0, 'Enter an amount'); adjust(q, dl, b.expires); save(); return json(res, 200, view()); }
    if (m === 'PUT') { const b = await body(); if (b.name !== undefined) q.name = str(b.name, 60) || q.name; if (b.unit !== undefined && UNITS.includes(b.unit)) q.unit = b.unit; if (b.min !== undefined) q.min = Math.max(0, num(b.min)); if (b.location !== undefined) q.location = S.locations.some((l) => l.id === b.location) ? b.location : ''; if (b.note !== undefined) q.note = str(b.note, 200); save(); return json(res, 200, view()); }
    if (m === 'DELETE') { S.products = S.products.filter((y) => y !== q); S.shopping.forEach((s) => { if (s.product === q.id) s.product = ''; }); save(); return json(res, 200, view()); }
  }
  /* shopping list */
  if (p === '/shopping' && m === 'POST') { const b = await body(); const pr = S.products.find((y) => y.id === b.product); const n = str(b.name || (pr && pr.name), 60); need(n, 'What do you need?'); S.shopping.push({ id: id(), name: n, qty: Math.max(0, num(b.qty, 1)) || 1, product: pr ? pr.id : '', done: false }); save(); return json(res, 201, view()); }
  if (p === '/shopping/missing' && m === 'POST') { let n = 0; for (const q of S.products) { const st = stockOf(q); if (q.min > 0 && st < q.min && !S.shopping.some((s) => !s.done && s.product === q.id)) { S.shopping.push({ id: id(), name: q.name, qty: Math.ceil((q.min - st) * 100) / 100, product: q.id, done: false }); n++; } } save(); return json(res, 200, { added: n, state: view() }); }
  if (p === '/shopping/done' && m === 'DELETE') { S.shopping = S.shopping.filter((s) => !s.done); save(); return json(res, 200, view()); }
  if ((x = p.match(/^\/shopping\/([0-9a-f]{10})(\/bought)?$/))) {
    const s = S.shopping.find((y) => y.id === x[1]); if (!s) throw httpError(404, 'No such entry');
    if (x[2] && m === 'POST') { const b = await body(), q = S.products.find((y) => y.id === s.product); if (q && b.stock !== false) adjust(q, s.qty, b.expires); s.done = true; save(); return json(res, 200, view()); }
    if (m === 'PUT') { const b = await body(); if (b.name !== undefined) s.name = str(b.name, 60) || s.name; if (b.qty !== undefined) s.qty = Math.max(0, num(b.qty, 1)) || 1; if (b.done !== undefined) s.done = !!b.done; save(); return json(res, 200, view()); }
    if (m === 'DELETE') { S.shopping = S.shopping.filter((y) => y !== s); save(); return json(res, 200, view()); }
  }
  throw httpError(404, 'Unknown household route');
}
