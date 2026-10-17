/* Life: your journal and notes, personal documents with expiry dates, net worth beyond the bank accounts, one search across everything,
   and the Daily Brief. One small JSON store; everything is private to the owner. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DATA } from './config.js';
import { json, readJson, httpError } from './util.js';
import * as money from './money.js';
import * as house from './household.js';
import { findFiles } from './search.js';
import { pulseContext } from './pulse.js';

const FILE = path.join(DATA, 'life.json');
const id = () => crypto.randomBytes(5).toString('hex');
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const utcToday = () => new Date().toISOString().slice(0, 10);
const need = (c, m) => { if (!c) throw httpError(400, m, 'bad_request'); };
const str = (v, n = 80) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f<>]/g, ' ').trim().slice(0, n);
const num = (v, d = 0) => { const n = Number(String(v == null ? '' : v).replace(/,/g, '')); return Number.isFinite(n) && Math.abs(n) < 1e13 ? n : d; };
const dOr = (v) => (DATE.test(v || '') && !Number.isNaN(Date.parse(v + 'T12:00:00Z')) ? v : '');
const daysBetween = (a, b) => Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 864e5);
const pathOk = (v) => (typeof v === 'string' && v.startsWith('/') && !v.includes('..') ? v.slice(0, 300) : '');
const cur3 = (v, d = '') => { const c = String(v || d).toUpperCase(); return /^[A-Z]{3,5}$/.test(c) ? c : d; };

let S = null;
const fresh = () => ({ v: 1, notes: [], docs: [], assets: [], debts: [], snaps: [] });
function load() { if (S) return S; try { S = { ...fresh(), ...JSON.parse(fs.readFileSync(FILE, 'utf8')) }; } catch { S = fresh(); save(); } return S; }
function save() { fs.mkdirSync(path.dirname(FILE), { recursive: true }); const t = FILE + '.tmp'; fs.writeFileSync(t, JSON.stringify(S), { mode: 0o600 }); fs.renameSync(t, FILE); }

/* ---------- journal and notes ---------- */
const NOTE_KINDS = ['journal', 'note'];
const tagsOf = (body, extra) => { const out = new Set(); for (const m of String(body).matchAll(/(^|\s)#([\p{L}\p{N}_-]{1,30})/gu)) out.add(m[2].toLowerCase()); for (const t of Array.isArray(extra) ? extra : []) { const s = str(t, 30).toLowerCase().replace(/^#/, '').replace(/\s+/g, '-'); if (s) out.add(s); } return [...out].slice(0, 20); };
const linksOf = (body) => [...new Set([...String(body).matchAll(/\[\[([^\]\n]{1,80})\]\]/g)].map((m) => m[1].trim()).filter(Boolean))].slice(0, 30);
function noteIn(b, cur) {
  const o = {};
  if (b.kind !== undefined || !cur) o.kind = NOTE_KINDS.includes(b.kind) ? b.kind : (cur ? cur.kind : 'note');
  if (b.title !== undefined) o.title = str(b.title, 120);
  if (b.body !== undefined) { o.body = String(b.body == null ? '' : b.body).replace(/\u0000/g, '').slice(0, 50000); }
  if (b.date !== undefined || !cur) o.date = dOr(b.date) || (cur ? cur.date : utcToday());
  if (b.mood !== undefined) { const m = Math.round(num(b.mood)); o.mood = m >= 1 && m <= 5 ? m : 0; }
  if (b.pinned !== undefined) o.pinned = !!b.pinned;
  const f = { ...(cur || {}), ...o };
  need((f.title || '').length || (f.body || '').trim().length, 'Write something first');
  o.tags = tagsOf((f.title || '') + ' ' + (f.body || ''), b.tags !== undefined ? b.tags : (cur ? cur.tags : []));
  return o;
}
const noteTitle = (n) => n.title || (n.kind === 'journal' ? n.date : String(n.body || '').split('\n')[0].replace(/^#+\s*/, '').slice(0, 60)) || 'Untitled';
const excerpt = (n) => String(n.body || '').replace(/\[\[|\]\]/g, '').replace(/\s+/g, ' ').trim().slice(0, 140);
const pubNote = (n, full) => ({ id: n.id, kind: n.kind, title: n.title || '', name: noteTitle(n), date: n.date, mood: n.mood || 0, pinned: !!n.pinned, tags: n.tags || [], excerpt: excerpt(n), ...(full ? { body: n.body || '', links: linksOf(n.body).map((t) => { const o = S.notes.find((x) => x.id !== n.id && noteTitle(x).toLowerCase() === t.toLowerCase()); return { title: t, id: o ? o.id : '' }; }), back: S.notes.filter((x) => x.id !== n.id && linksOf(x.body).some((t) => t.toLowerCase() === noteTitle(n).toLowerCase())).map((x) => ({ id: x.id, name: noteTitle(x) })) } : {}), updated: n.updated, created: n.created });
const noteSort = (a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.date.localeCompare(a.date) || (b.updated || 0) - (a.updated || 0);
function noteList(sp) {
  const q = String(sp.get('q') || '').toLowerCase().split(/\s+/).filter(Boolean), tag = str(sp.get('tag'), 30).toLowerCase(), kind = sp.get('kind');
  let l = S.notes.filter((n) => (!kind || n.kind === kind) && (!tag || (n.tags || []).includes(tag)) && q.every((w) => (noteTitle(n) + ' ' + n.body + ' ' + (n.tags || []).join(' ')).toLowerCase().includes(w)));
  l = [...l].sort(noteSort); const total = l.length, lim = Math.min(200, Math.max(1, parseInt(sp.get('limit'), 10) || 100)), off = Math.max(0, parseInt(sp.get('offset'), 10) || 0);
  const tags = {}; for (const n of S.notes) for (const t of n.tags || []) tags[t] = (tags[t] || 0) + 1;
  const dates = new Set(S.notes.filter((n) => n.kind === 'journal').map((n) => n.date));
  let streak = 0; { let d = utcToday(); if (!dates.has(d)) d = shift(d, -1); while (dates.has(d)) { streak++; d = shift(d, -1); } }
  return { total, items: l.slice(off, off + lim).map((n) => pubNote(n)), tags: Object.entries(tags).sort((a, b) => b[1] - a[1]).slice(0, 40).map(([t, c]) => ({ tag: t, count: c })), streak, journalDays: dates.size };
}
const shift = (d, n) => { const t = new Date(d + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };

/* ---------- documents with expiry dates ---------- */
const DOC_KINDS = ['Passport', 'Visa', 'ID card', 'Driving licence', 'Insurance', 'Vehicle', 'Certificate', 'Membership', 'Contract', 'Medical', 'Tax', 'Other'];
const REMIND = [90, 30, 7];
function docIn(b, cur) {
  const o = {};
  if (b.name !== undefined || !cur) { o.name = str(b.name, 80); need(o.name, 'Give the document a name'); }
  if (b.kind !== undefined) o.kind = DOC_KINDS.includes(b.kind) ? b.kind : 'Other';
  if (b.holder !== undefined) o.holder = str(b.holder, 60); if (b.number !== undefined) o.number = str(b.number, 60); if (b.issuer !== undefined) o.issuer = str(b.issuer, 80);
  if (b.issued !== undefined) o.issued = dOr(b.issued); if (b.expires !== undefined) o.expires = dOr(b.expires);
  if (b.notes !== undefined) o.notes = str(b.notes, 500); if (b.file !== undefined) o.file = pathOk(b.file);
  const f = { ...(cur || {}), ...o }; if (f.issued && f.expires) need(f.expires >= f.issued, 'The expiry date is before the issue date');
  return o;
}
function docStatus(days) { if (days == null) return 'none'; if (days < 0) return 'expired'; if (days <= 7) return 'week'; if (days <= 30) return 'month'; if (days <= 90) return 'quarter'; return 'ok'; }
const pubDoc = (x, today) => { const days = x.expires ? daysBetween(today, x.expires) : null; return { id: x.id, name: x.name, kind: x.kind || 'Other', holder: x.holder || '', number: x.number || '', issuer: x.issuer || '', issued: x.issued || '', expires: x.expires || '', days, status: docStatus(days), remindAt: days != null && days >= 0 ? REMIND.filter((r) => days <= r).slice(-1)[0] || null : null, notes: x.notes || '', file: x.file || '', created: x.created }; };
const docsView = (today) => { const l = S.docs.map((x) => pubDoc(x, today)).sort((a, b) => (a.days == null ? 1e9 : a.days) - (b.days == null ? 1e9 : b.days) || a.name.localeCompare(b.name)); return { kinds: DOC_KINDS, today, items: l, summary: { total: l.length, expired: l.filter((x) => x.status === 'expired').length, soon: l.filter((x) => ['week', 'month'].includes(x.status)).length, quarter: l.filter((x) => x.status === 'quarter').length } }; };

/* ---------- net worth: Money (accounts and investments) plus what you own and owe ---------- */
const ASSET_KINDS = ['Property', 'Vehicle', 'Cash', 'Gold and valuables', 'Business stake', 'Retirement', 'Other'];
const DEBT_KINDS = ['Mortgage', 'Loan', 'Credit card', 'Owed to someone', 'Other'];
function entryIn(b, cur, kinds, amountKey) {
  const o = {};
  if (b.name !== undefined || !cur) { o.name = str(b.name, 80); need(o.name, 'Give it a name'); }
  if (b.kind !== undefined) o.kind = kinds.includes(b.kind) ? b.kind : 'Other';
  if (b[amountKey] !== undefined || !cur) { const v = num(b[amountKey], NaN); need(Number.isFinite(v) && v >= 0, 'Enter an amount of zero or more'); o[amountKey] = Math.round(v * 100) / 100; }
  if (b.currency !== undefined) o.currency = cur3(b.currency, ''); if (b.note !== undefined) o.note = str(b.note, 200);
  if (b.rate !== undefined) o.rate = Math.max(0, Math.min(100, num(b.rate)));
  return o;
}
function worthView(snapOk = true) {
  const mv = money.lifeView(), base = mv.base, today = utcToday(), miss = new Set();
  const inBase = (amount, cu) => { const c = cu || base; if (c === base) return amount; const v = mv.convert(amount, c); if (v == null) { miss.add(c); return amount; } return v; };
  const assets = S.assets.map((a) => ({ ...a, kind: a.kind || 'Other', currency: a.currency || base, base: Math.round(inBase(a.value, a.currency) * 100) / 100 }));
  const debts = S.debts.map((a) => ({ ...a, kind: a.kind || 'Other', currency: a.currency || base, base: Math.round(inBase(a.balance, a.currency) * 100) / 100 }));
  const tA = assets.reduce((s, a) => s + a.base, 0), tD = debts.reduce((s, a) => s + a.base, 0), bank = mv.netWorth.accounts || 0, inv = mv.netWorth.investments || 0;
  const total = Math.round((bank + inv + tA - tD) * 100) / 100;
  if (snapOk) { const mth = today.slice(0, 7), last = S.snaps[S.snaps.length - 1]; if (!last || last.date.slice(0, 7) !== mth) { S.snaps.push({ date: today, total, base }); S.snaps = S.snaps.slice(-240); save(); } }
  return { base, today, kinds: { asset: ASSET_KINDS, debt: DEBT_KINDS }, bank, investments: inv, assets, debts, totalAssets: Math.round((bank + inv + tA) * 100) / 100, totalDebts: Math.round(tD * 100) / 100, total, missingRates: [...miss], goals: mv.goals, snaps: S.snaps.slice(-60), moneyAccounts: mv.accounts };
}

/* ---------- search across your life ---------- */
async function searchAll(q) {
  const w = q.toLowerCase().split(/\s+/).filter(Boolean), today = utcToday(); if (!w.length) return { q, groups: [] };
  const has = (s) => w.every((x) => String(s).toLowerCase().includes(x));
  const notes = S.notes.filter((n) => has(noteTitle(n) + ' ' + n.body + ' ' + (n.tags || []).join(' '))).sort(noteSort).slice(0, 8).map((n) => { const body = String(n.body || '').replace(/\s+/g, ' '), i = body.toLowerCase().indexOf(w[0]); return { id: n.id, name: noteTitle(n), sub: (n.kind === 'journal' ? 'Journal · ' : 'Note · ') + n.date + (i > 60 ? ' · …' + body.slice(i - 40, i + 80) : (body ? ' · ' + body.slice(0, 100) : '')) }; });
  const docs = S.docs.filter((x) => has([x.name, x.kind, x.holder, x.number, x.issuer, x.notes].join(' '))).slice(0, 8).map((x) => { const p = pubDoc(x, today); return { id: x.id, name: x.name, sub: [p.kind, p.expires ? (p.days < 0 ? 'expired ' : 'expires ') + p.expires : ''].filter(Boolean).join(' · ') }; });
  const [files] = await Promise.all([findFiles(q).catch(() => [])]);
  const groups = [['notes', 'Journal and notes', notes], ['docs', 'Documents', docs], ['things', 'Belongings and pantry', house.lifeSearch(q).map((t) => ({ id: t.id, name: t.name, sub: t.sub, kind: t.kind }))],
    ['money', 'Money', money.lifeSearch(q).map((t) => ({ id: t.id, name: t.payee || t.note || t.type, sub: t.date + ' · ' + t.amount + ' ' + t.currency + (t.note && t.payee ? ' · ' + t.note : '') }))],
    ['files', 'Files', files.slice(0, 8).map((f) => ({ id: f.p, name: f.n, sub: f.src + ' · ' + f.p }))]].filter((g) => g[2].length).map((g) => ({ key: g[0], title: g[1], items: g[2] }));
  return { q, groups, total: groups.reduce((s, g) => s + g.items.length, 0) };
}

/* ---------- Daily Brief ---------- */
async function brief(today) {
  const out = { today, sections: [], greeting: '' };
  const add = (key, title, items) => { if (items.length) out.sections.push({ key, title, items }); };
  const pulse = await Promise.race([pulseContext().catch(() => null), new Promise((r) => setTimeout(() => r(null), 4000))]);
  if (pulse && pulse.connected !== false) {
    add('today', 'Today', (pulse.events || []).filter((e) => e.date === today).map((e) => ({ text: e.title, sub: e.from + (e.location ? ' · ' + e.location : ''), go: 'pulse' })));
    add('tasks', 'Tasks due', (pulse.openTasks || []).filter((t) => t.due && t.due <= today).slice(0, 6).map((t) => ({ text: t.title, sub: t.due < today ? 'overdue since ' + t.due : 'due today', go: 'pulse' })));
    add('reply', 'Needs a reply', (pulse.needReply || []).slice(0, 4).map((m) => ({ text: m.from + (m.where ? ' · ' + m.where : ''), sub: m.summary, go: 'pulse' })));
    out.pulse = { unread: pulse.unread ?? null, connected: true };
  } else out.pulse = { connected: false };
  load();
  add('docs', 'Documents', S.docs.map((x) => pubDoc(x, today)).filter((x) => x.days != null && x.days <= 30).map((x) => ({ text: x.name, sub: x.days < 0 ? 'expired ' + (-x.days) + ' day' + (x.days === -1 ? '' : 's') + ' ago' : x.days === 0 ? 'expires today' : 'expires in ' + x.days + ' day' + (x.days === 1 ? '' : 's'), tone: x.days < 8 ? 'bad' : 'warn', go: 'docs' })));
  const hb = house.lifeBrief();
  add('home', 'At home', [...hb.warranty.map((x) => ({ text: x.name, sub: 'warranty ends in ' + x.days + ' day' + (x.days === 1 ? '' : 's'), go: 'belong' })), ...hb.expiring.map((x) => ({ text: x.name, sub: x.days < 0 ? 'expired' : 'best before in ' + x.days + ' day' + (x.days === 1 ? '' : 's'), go: 'house' })), ...(hb.low.length ? [{ text: hb.low.length + ' pantry item' + (hb.low.length === 1 ? '' : 's') + ' running low', sub: hb.low.slice(0, 3).join(', '), go: 'house' }] : []), ...(hb.toBuy ? [{ text: hb.toBuy + ' on the shopping list', sub: '', go: 'house' }] : [])]);
  let mv = null; try { mv = money.lifeView(); } catch {}
  if (mv) {
    add('renew', 'Renewing soon', mv.subs.filter((s) => s.days >= 0 && s.days <= 7).map((s) => ({ text: s.name, sub: (s.days === 0 ? 'today' : 'in ' + s.days + ' day' + (s.days === 1 ? '' : 's')) + ' · ' + s.amount + ' ' + s.currency, go: 'subs' })));
    add('goals', 'Goals', mv.goals.filter((g) => g.target > 0).slice(0, 3).map((g) => ({ text: g.name, sub: Math.round(Math.min(100, g.saved / g.target * 100)) + '% · ' + g.saved + ' of ' + g.target + ' ' + g.currency, go: 'money' })));
  }
  const ago = (n) => { const [y, m, d] = today.split('-').map(Number); return (y - n) + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0'); };
  add('past', 'On this day', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].flatMap((n) => S.notes.filter((x) => x.kind === 'journal' && x.date === ago(n)).map((x) => ({ text: n + ' year' + (n === 1 ? '' : 's') + ' ago', sub: excerpt(x), id: x.id, go: 'journal' }))).slice(0, 3));
  const jt = S.notes.find((n) => n.kind === 'journal' && n.date === today); out.journal = { today: !!jt, id: jt ? jt.id : '', streak: noteList(new URLSearchParams()).streak };
  return out;
}

export async function handleLife(req, res, url, sess) {
  if (sess && sess.role && sess.role !== 'owner') throw httpError(403, 'Life is private to the owner', 'forbidden');
  load(); const p = url.pathname.replace(/^\/api\/life/, '') || '/', m = req.method, sp = url.searchParams; let x; const body = async () => readJson(req, 512 * 1024);
  const dayParam = () => dOr(sp.get('d')) || utcToday();
  if (p === '/brief' && m === 'GET') return json(res, 200, await brief(dayParam()));
  if (p === '/search' && m === 'GET') { const q = str(sp.get('q'), 100); return json(res, 200, await searchAll(q)); }
  /* notes */
  if (p === '/notes' && m === 'GET') return json(res, 200, noteList(sp));
  if (p === '/notes' && m === 'POST') { const b = await body(); const n = { id: id(), created: Date.now(), updated: Date.now(), ...noteIn(b, null) }; S.notes.push(n); save(); return json(res, 201, { note: pubNote(n, true) }); }
  if ((x = p.match(/^\/notes\/([0-9a-f]{10})$/))) {
    const n = S.notes.find((y) => y.id === x[1]); if (!n) throw httpError(404, 'No such entry');
    if (m === 'GET') return json(res, 200, { note: pubNote(n, true) });
    if (m === 'PUT') { Object.assign(n, noteIn(await body(), n), { updated: Date.now() }); save(); return json(res, 200, { note: pubNote(n, true) }); }
    if (m === 'DELETE') { S.notes = S.notes.filter((y) => y !== n); save(); return json(res, 200, { ok: true }); }
  }
  if (p === '/journal/today' && m === 'POST') { const d = dayParam(); let n = S.notes.find((y) => y.kind === 'journal' && y.date === d); if (!n) { n = { id: id(), created: Date.now(), updated: Date.now(), kind: 'journal', title: '', body: '', date: d, mood: 0, pinned: false, tags: [] }; S.notes.push(n); save(); } return json(res, 200, { note: pubNote(n, true) }); }
  /* documents */
  if (p === '/docs' && m === 'GET') return json(res, 200, docsView(dayParam()));
  if (p === '/docs' && m === 'POST') { const b = await body(); S.docs.push({ id: id(), created: Date.now(), kind: 'Other', ...docIn(b, null) }); save(); return json(res, 201, docsView(dayParam())); }
  if ((x = p.match(/^\/docs\/([0-9a-f]{10})$/))) {
    const dd = S.docs.find((y) => y.id === x[1]); if (!dd) throw httpError(404, 'No such document');
    if (m === 'PUT') { Object.assign(dd, docIn(await body(), dd)); save(); return json(res, 200, docsView(dayParam())); }
    if (m === 'DELETE') { S.docs = S.docs.filter((y) => y !== dd); save(); return json(res, 200, docsView(dayParam())); }
  }
  /* net worth */
  if (p === '/worth' && m === 'GET') return json(res, 200, worthView());
  if (p === '/assets' && m === 'POST') { const b = await body(); S.assets.push({ id: id(), ...entryIn(b, null, ASSET_KINDS, 'value') }); save(); return json(res, 201, worthView()); }
  if ((x = p.match(/^\/assets\/([0-9a-f]{10})$/))) { const a = S.assets.find((y) => y.id === x[1]); if (!a) throw httpError(404, 'No such asset'); if (m === 'PUT') { Object.assign(a, entryIn(await body(), a, ASSET_KINDS, 'value')); save(); return json(res, 200, worthView()); } if (m === 'DELETE') { S.assets = S.assets.filter((y) => y !== a); save(); return json(res, 200, worthView()); } }
  if (p === '/debts' && m === 'POST') { const b = await body(); S.debts.push({ id: id(), ...entryIn(b, null, DEBT_KINDS, 'balance') }); save(); return json(res, 201, worthView()); }
  if ((x = p.match(/^\/debts\/([0-9a-f]{10})$/))) { const a = S.debts.find((y) => y.id === x[1]); if (!a) throw httpError(404, 'No such debt'); if (m === 'PUT') { Object.assign(a, entryIn(await body(), a, DEBT_KINDS, 'balance')); save(); return json(res, 200, worthView()); } if (m === 'DELETE') { S.debts = S.debts.filter((y) => y !== a); save(); return json(res, 200, worthView()); } }
  if (p === '/worth/snapshot' && m === 'POST') { const v = worthView(false), t = utcToday(); S.snaps = S.snaps.filter((s) => s.date !== t); S.snaps.push({ date: t, total: v.total, base: v.base }); S.snaps.sort((a, b) => a.date.localeCompare(b.date)); save(); return json(res, 200, worthView(false)); }
  throw httpError(404, 'Unknown Life route');
}
