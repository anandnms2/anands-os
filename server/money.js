/* Money: accounts, transactions, budgets, goals, subscriptions and investments for one person.
 * Amounts are stored as whole minor units (x100) so sums never drift; the API speaks plain decimals. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DATA } from './config.js';
import { json, readJson, httpError, rawFetch } from './util.js';

const FILE = path.join(DATA, 'money.json');
const DAY = 864e5;
const id = () => crypto.randomBytes(5).toString('hex');
const c = (x) => Math.round(Number(x) * 100);          // decimal to stored units
const d = (x) => Math.round(x) / 100;                    // stored units to decimal
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const CUR = /^[A-Z]{3,5}$/;
const today = () => new Date().toISOString().slice(0, 10);
const ymOf = (s) => s.slice(0, 7);
const need = (cond, msg) => { if (!cond) throw httpError(400, msg, 'bad_request'); };
const str = (v, n = 80) => String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, n);
const num = (v, msg) => { const n = Number(v); need(Number.isFinite(n) && Math.abs(n) < 1e12, msg || 'Enter a valid amount'); return n; };

const COLORS = ['#f68712', '#3b82f6', '#10b981', '#a855f7', '#ef4444', '#eab308', '#06b6d4', '#ec4899', '#84cc16', '#6366f1', '#f97316', '#14b8a6'];
const SEED_EXP = ['Groceries', 'Transport', 'Fuel', 'Rent', 'Utilities', 'Dining out', 'Health', 'Education', 'Entertainment', 'Shopping', 'Travel', 'Subscriptions', 'Family', 'Business', 'Other'];
const SEED_INC = ['Salary', 'Consulting', 'Investments', 'Gifts', 'Other income'];
const ACCT_TYPES = ['cash', 'bank', 'savings', 'mobile', 'credit', 'investment', 'loan', 'asset', 'other'];
const CYCLES = ['weekly', 'monthly', 'quarterly', 'yearly'];

let S = null;
function fresh() {
  const cats = [...SEED_EXP.map((n, i) => ({ id: id(), name: n, kind: 'expense', color: COLORS[i % COLORS.length] })), ...SEED_INC.map((n, i) => ({ id: id(), name: n, kind: 'income', color: COLORS[(i + 3) % COLORS.length] }))];
  return { v: 1, settings: { base: 'USD', startOfMonth: 1 }, rates: { base: 'USD', map: { USD: 1 }, at: 0 }, accounts: [], categories: cats, tx: [], budgets: {}, rules: [], goals: [], subs: [], hold: [], created: Date.now() };
}
function load() { if (S) return S; try { S = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { S = fresh(); save(); } return S; }
function save() { fs.mkdirSync(path.dirname(FILE), { recursive: true }); const tmp = FILE + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(S), { mode: 0o600 }); fs.renameSync(tmp, FILE); }

/* ---------- rates ---------- */
function rate(cur) { // how many base units one unit of cur is worth
  const { base, map } = S.rates; cur = String(cur || base).toUpperCase(); if (cur === S.settings.base) return 1;
  const a = map[cur], b = map[S.settings.base]; if (!a || !b) return null; return b / a;   // map is units of currency per 1 of rates.base
}
const toBase = (cents, cur) => { const r = rate(cur); return r == null ? cents : cents * r; };
const fmtCur = (cur) => cur;

/* ---------- dates ---------- */
function addCycle(dt, cycle, n = 1) {
  const [y, m, da] = dt.split('-').map(Number); const t = new Date(Date.UTC(y, m - 1, da));
  if (cycle === 'weekly') t.setUTCDate(t.getUTCDate() + 7 * n);
  else { const months = cycle === 'yearly' ? 12 * n : cycle === 'quarterly' ? 3 * n : n; const day = t.getUTCDate(); t.setUTCDate(1); t.setUTCMonth(t.getUTCMonth() + months); const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate(); t.setUTCDate(Math.min(day, last)); }
  return t.toISOString().slice(0, 10);
}
const perMonth = (cents, cycle) => cycle === 'weekly' ? cents * 52 / 12 : cycle === 'quarterly' ? cents / 3 : cycle === 'yearly' ? cents / 12 : cents;
const daysTo = (dt) => Math.round((Date.parse(dt + 'T00:00:00Z') - Date.parse(today() + 'T00:00:00Z')) / DAY);

/* ---------- balances ---------- */
function balances(upTo) {
  const b = {}; for (const a of S.accounts) b[a.id] = a.opening || 0;
  for (const t of S.tx) {
    if (upTo && t.date > upTo) continue;
    if (t.type === 'income') b[t.acct] = (b[t.acct] || 0) + t.amt;
    else if (t.type === 'expense') b[t.acct] = (b[t.acct] || 0) - t.amt;
    else if (t.type === 'transfer') { b[t.acct] = (b[t.acct] || 0) - t.amt; if (t.to) b[t.to] = (b[t.to] || 0) + (t.toAmt != null ? t.toAmt : t.amt); }
  }
  return b;
}
const acctBy = (i) => S.accounts.find((a) => a.id === i);

/* ---------- holdings maths (average cost) ---------- */
function holdingStats(h) {
  let qty = 0, cost = 0, realized = 0, divs = 0, fees = 0;
  const tr = [...h.trades].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  for (const t of tr) {
    if (t.type === 'buy') { cost += t.qty * t.price + (t.fee || 0); qty += t.qty; fees += t.fee || 0; }
    else if (t.type === 'sell') { const avg = qty > 0 ? cost / qty : 0, q = Math.min(t.qty, qty); realized += q * t.price - (t.fee || 0) - q * avg; cost -= q * avg; qty -= q; fees += t.fee || 0; }
    else if (t.type === 'dividend') divs += t.qty * t.price;   // qty=1, price=amount, or qty=shares and price=per share
  }
  if (qty < 1e-9) { qty = 0; cost = 0; }
  const price = h.price || 0, value = qty * price, gain = value - cost;
  return { qty, avg: qty ? cost / qty : 0, invested: cost, value, gain, gainPct: cost ? gain / cost * 100 : 0, realized, dividends: divs, fees };
}
function holdingsView() {
  const out = []; let totalBase = 0, costBase = 0, divBase = 0, realBase = 0;
  for (const h of S.hold) {
    const st = holdingStats(h), r = rate(h.currency) ?? 1;
    out.push({ ...pubHolding(h), ...st, valueBase: d(st.value * 100 * r), investedBase: d(st.invested * 100 * r) });
    totalBase += st.value * 100 * r; costBase += st.invested * 100 * r; divBase += st.dividends * 100 * r; realBase += st.realized * 100 * r;
  }
  const alloc = {}; for (const h of out) { const k = h.kind; alloc[k] = (alloc[k] || 0) + h.valueBase; }
  return { holdings: out, totals: { value: d(totalBase), invested: d(costBase), gain: d(totalBase - costBase), gainPct: costBase ? (totalBase - costBase) / costBase * 100 : 0, dividends: d(divBase), realized: d(realBase) }, alloc: Object.entries(alloc).map(([kind, v]) => ({ kind, value: d(v), pct: totalBase ? v / totalBase * 100 : 0 })).sort((a, b) => b.value - a.value) };
}
const pubHolding = (h) => ({ id: h.id, symbol: h.symbol, name: h.name, kind: h.kind, currency: h.currency, acct: h.acct || '', price: h.price || 0, priceAt: h.priceAt || 0, trades: [...h.trades].sort((a, b) => b.date.localeCompare(a.date)).map((t) => ({ id: t.id, date: t.date, type: t.type, qty: t.qty, price: t.price, fee: t.fee || 0 })) });

/* ---------- public shapes ---------- */
const pubAcct = (a, bal) => ({ id: a.id, name: a.name, type: a.type, currency: a.currency, opening: d(a.opening || 0), balance: d(bal[a.id] || 0), balanceBase: d(toBase(bal[a.id] || 0, a.currency)), archived: !!a.archived, net: a.net !== false, note: a.note || '', color: a.color || '' });
const pubTx = (t) => ({ id: t.id, date: t.date, type: t.type, amount: d(t.amt), acct: t.acct, to: t.to || '', toAmount: t.toAmt != null ? d(t.toAmt) : null, cat: t.cat || '', payee: t.payee || '', note: t.note || '' });
const pubSub = (s) => { const days = daysTo(s.next); return { id: s.id, name: s.name, amount: d(s.amt), currency: s.currency, cycle: s.cycle, next: s.next, acct: s.acct || '', cat: s.cat || '', active: s.active !== false, url: s.url || '', note: s.note || '', remind: s.remind ?? 3, auto: !!s.auto, days, overdue: s.active !== false && days < 0, monthlyBase: d(toBase(perMonth(s.amt, s.cycle), s.currency)), color: s.color || '' }; };
const pubGoal = (g) => ({ id: g.id, name: g.name, target: d(g.target), saved: d(g.saved || 0), currency: g.currency, date: g.date || '', acct: g.acct || '' });

/* ---------- auto actions: subscriptions that post themselves ---------- */
function tick() {
  let changed = false; const t0 = today();
  for (const s of S.subs) {
    if (s.active === false || !s.auto || !s.acct || !acctBy(s.acct)) continue;
    for (let i = 0; i < 36 && s.next <= t0; i++) { S.tx.push({ id: id(), date: s.next, type: 'expense', amt: s.amt, acct: s.acct, cat: s.cat || '', payee: s.name, note: 'Subscription', sub: s.id }); s.next = addCycle(s.next, s.cycle); changed = true; }
  }
  if (changed) save();
}

/* ---------- report ---------- */
function monthsBack(n, end) { const out = []; let [y, m] = end.split('-').map(Number); for (let i = 0; i < n; i++) { out.unshift(`${y}-${String(m).padStart(2, '0')}`); m--; if (m === 0) { m = 12; y--; } } return out; }
function report(q) {
  const to = DATE.test(q.to || '') ? q.to : today(), mTo = ymOf(to);
  const from = DATE.test(q.from || '') ? q.from : mTo + '-01';
  let inc = 0, exp = 0; const byCat = {}, byPayee = {}, months = {};
  const mlist = monthsBack(12, mTo); for (const m of mlist) months[m] = { m, income: 0, expense: 0 };
  for (const t of S.tx) {
    if (t.type === 'transfer') continue; const a = acctBy(t.acct); const v = toBase(t.amt, a ? a.currency : S.settings.base), m = ymOf(t.date);
    if (months[m]) months[m][t.type] += v;
    if (t.date >= from && t.date <= to) {
      if (t.type === 'income') inc += v; else { exp += v; const k = t.cat || ''; byCat[k] = (byCat[k] || 0) + v; const p = (t.payee || '').trim(); if (p) byPayee[p] = (byPayee[p] || 0) + v; }
    }
  }
  const cats = Object.entries(byCat).map(([cid, v]) => { const cc = S.categories.find((x) => x.id === cid); return { id: cid, name: cc ? cc.name : 'No category', color: cc ? cc.color : '#8a8a92', amount: d(v), pct: exp ? v / exp * 100 : 0 }; }).sort((a, b) => b.amount - a.amount);
  // budgets for the month of "to"
  const spentIn = {}; for (const t of S.tx) { if (t.type !== 'expense' || ymOf(t.date) !== mTo) continue; const a = acctBy(t.acct); spentIn[t.cat || ''] = (spentIn[t.cat || ''] || 0) + toBase(t.amt, a ? a.currency : S.settings.base); }
  const budgets = []; for (const cc of S.categories) { if (cc.kind !== 'expense') continue; const bm = S.budgets[cc.id] || {}; const amt = bm[mTo] ?? bm.default; if (amt == null) continue; const sp = spentIn[cc.id] || 0; budgets.push({ id: cc.id, name: cc.name, color: cc.color, budget: d(amt), spent: d(sp), left: d(amt - sp), pct: amt ? sp / amt * 100 : 0 }); }
  // net worth series (month ends); holdings are valued at today's prices
  const hv = holdingsView().totals.value, series = [];
  for (const m of mlist) { const end = m + '-31'; const b = balances(end); let nw = 0; for (const a of S.accounts) if (a.net !== false && !a.archived) nw += toBase(b[a.id] || 0, a.currency); series.push({ m, value: d(nw) + hv }); }
  return { from, to, base: S.settings.base, income: d(inc), expense: d(exp), net: d(inc - exp), saveRate: inc ? (inc - exp) / inc * 100 : 0, categories: cats, months: mlist.map((m) => ({ m, income: d(months[m].income), expense: d(months[m].expense) })), budgets: budgets.sort((a, b) => b.pct - a.pct), payees: Object.entries(byPayee).map(([n, v]) => ({ name: n, amount: d(v) })).sort((a, b) => b.amount - a.amount).slice(0, 8), netWorth: series };
}

/* ---------- validation of records ---------- */
function acctIn(b, cur) {
  const o = {}; if (b.name !== undefined || !cur) { o.name = str(b.name, 60); need(o.name, 'Give the account a name'); }
  if (b.type !== undefined || !cur) { o.type = ACCT_TYPES.includes(b.type) ? b.type : 'bank'; }
  if (b.currency !== undefined || !cur) { o.currency = String(b.currency || S.settings.base).toUpperCase(); need(CUR.test(o.currency), 'Currency should be a code such as USD or TZS'); }
  if (b.opening !== undefined) o.opening = c(num(b.opening)); if (b.note !== undefined) o.note = str(b.note, 200); if (b.archived !== undefined) o.archived = !!b.archived; if (b.net !== undefined) o.net = !!b.net; if (b.color !== undefined) o.color = str(b.color, 9);
  return o;
}
function txIn(b, cur) {
  const o = {};
  if (b.type !== undefined || !cur) { need(['expense', 'income', 'transfer'].includes(b.type), 'Choose expense, income or transfer'); o.type = b.type; }
  if (b.date !== undefined || !cur) { need(DATE.test(b.date || ''), 'Use a date like 2026-10-16'); o.date = b.date; }
  if (b.amount !== undefined || !cur) { const n = num(b.amount); need(n > 0, 'The amount must be more than zero'); o.amt = c(n); }
  if (b.acct !== undefined || !cur) { need(acctBy(b.acct), 'Choose an account'); o.acct = b.acct; }
  if (b.to !== undefined) { if (b.to) need(acctBy(b.to), 'Choose the account the money goes to'); o.to = b.to || ''; }
  if (b.toAmount !== undefined) o.toAmt = b.toAmount === null || b.toAmount === '' ? undefined : c(num(b.toAmount));
  if (b.cat !== undefined) { need(!b.cat || S.categories.some((x) => x.id === b.cat), 'Unknown category'); o.cat = b.cat || ''; }
  if (b.payee !== undefined) o.payee = str(b.payee, 80); if (b.note !== undefined) o.note = str(b.note, 300);
  const f = { ...(cur || {}), ...o }; if (f.type === 'transfer') { need(f.to && f.to !== f.acct, 'Choose a different account to move money to'); } else { o.to = ''; o.toAmt = undefined; }
  return o;
}
function autoCat(t) { if (t.cat || t.type === 'transfer') return; const p = (t.payee || '').toLowerCase(); if (!p) return; const r = S.rules.find((x) => x.type === t.type && p.includes(x.match.toLowerCase())); if (r) t.cat = r.cat; }
const clean = (o) => { for (const k of Object.keys(o)) if (o[k] === undefined) delete o[k]; return o; };

/* ---------- csv ---------- */
const csvq = (v) => /[",\n]/.test(v) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v);
function exportCsv() { const names = Object.fromEntries(S.accounts.map((a) => [a.id, a.name])), cats = Object.fromEntries(S.categories.map((x) => [x.id, x.name])); return 'date,type,amount,currency,account,to_account,category,payee,note\n' + [...S.tx].sort((a, b) => a.date.localeCompare(b.date)).map((t) => [t.date, t.type, d(t.amt), (acctBy(t.acct) || {}).currency || '', names[t.acct] || '', names[t.to] || '', cats[t.cat] || '', t.payee || '', t.note || ''].map(csvq).join(',')).join('\n') + '\n'; }

/* ---------- prices and rates from the internet (best effort; everything also works by hand) ---------- */
const PRICE_URL = () => process.env.MONEY_PRICE_URL || 'https://query1.finance.yahoo.com/v8/finance/chart/';
const RATE_URL = () => process.env.MONEY_RATES_URL || 'https://open.er-api.com/v6/latest/';
async function refreshRates() {
  const base = S.settings.base, r = await rawFetch(RATE_URL() + encodeURIComponent(base), { headers: { accept: 'application/json' } }, 12000);
  const m = r.data && (r.data.rates || r.data.conversion_rates); if (!r.ok || !m || typeof m !== 'object') throw httpError(502, 'The exchange rate service did not answer. You can type rates in by hand.', 'upstream');
  S.rates = { base, map: Object.fromEntries(Object.entries(m).filter(([k, v]) => CUR.test(k) && Number(v) > 0).map(([k, v]) => [k, Number(v)])), at: Date.now() }; save(); return S.rates;
}
async function refreshPrices() {
  let ok = 0, fail = 0;
  for (const h of S.hold) {
    if (!h.symbol || h.kind === 'cash' || h.kind === 'other') continue;
    try { const r = await rawFetch(PRICE_URL() + encodeURIComponent(h.symbol) + '?range=1d&interval=1d', { headers: { 'user-agent': 'Mozilla/5.0', accept: 'application/json' } }, 10000); const m = r.data && r.data.chart && r.data.chart.result && r.data.chart.result[0] && r.data.chart.result[0].meta; if (m && Number(m.regularMarketPrice) > 0) { h.price = Number(m.regularMarketPrice); h.priceAt = Date.now(); if (m.currency && CUR.test(String(m.currency).toUpperCase()) && !h.currencyLocked) h.currency = String(m.currency).toUpperCase(); ok++; } else fail++; } catch { fail++; }
  }
  save(); return { updated: ok, failed: fail };
}

/* ---------- state ---------- */
function stateView() {
  const bal = balances(); const accts = S.accounts.map((a) => pubAcct(a, bal));
  const net = accts.filter((a) => a.net && !a.archived).reduce((s, a) => s + a.balanceBase, 0); const hv = holdingsView();
  const subs = S.subs.map(pubSub), active = subs.filter((s) => s.active);
  return {
    settings: S.settings, rates: { base: S.rates.base, at: S.rates.at, map: S.rates.map }, accounts: accts, categories: S.categories, rules: S.rules, budgets: Object.fromEntries(Object.entries(S.budgets).map(([k, v]) => [k, Object.fromEntries(Object.entries(v).map(([m, n]) => [m, d(n)]))])), goals: S.goals.map(pubGoal),
    subs, subTotals: { monthly: d(active.reduce((s, x) => s + x.monthlyBase * 100, 0)), yearly: d(active.reduce((s, x) => s + x.monthlyBase * 1200, 0)), count: active.length },
    missingRates: [...new Set([...S.accounts.map((a) => a.currency), ...S.hold.map((h) => h.currency), ...S.subs.map((x) => x.currency)])].filter((cu) => rate(cu) == null),
    invest: hv, netWorth: { accounts: d(net * 100), investments: hv.totals.value, total: d(net * 100) + hv.totals.value }, today: today(), count: S.tx.length
  };
}

/* ---------- http ---------- */
export async function handleMoney(req, res, url, sess) {
  if (sess && sess.role && sess.role !== 'owner') throw httpError(403, 'Money is private to the owner', 'forbidden');
  load(); tick(); const p = url.pathname.replace(/^\/api\/money/, '') || '/', m = req.method; let x;
  const body = async () => readJson(req, 4 * 1024 * 1024);
  if (p === '/state' && m === 'GET') return json(res, 200, stateView());
  if (p === '/settings' && m === 'PUT') {
    const b = await body(); if (b.base !== undefined) { const cu = String(b.base).toUpperCase(); need(CUR.test(cu), 'Currency should be a code such as USD or TZS'); if (cu !== S.settings.base) { S.settings.base = cu; S.rates = { base: cu, map: { [cu]: 1 }, at: 0 }; } }
    save(); return json(res, 200, stateView());
  }
  /* accounts */
  if (p === '/accounts' && m === 'POST') { const b = await body(); const a = { id: id(), ...acctIn(b, null) }; S.accounts.push(a); save(); return json(res, 201, stateView()); }
  if ((x = p.match(/^\/accounts\/([0-9a-f]{10})$/))) {
    const a = acctBy(x[1]); if (!a) throw httpError(404, 'No such account');
    if (m === 'PUT') { Object.assign(a, acctIn(await body(), a)); save(); return json(res, 200, stateView()); }
    if (m === 'DELETE') { const used = S.tx.some((t) => t.acct === a.id || t.to === a.id); if (used && url.searchParams.get('force') !== '1') throw httpError(409, 'This account has transactions. Archive it instead, or delete with its history.', 'in_use'); S.tx = S.tx.filter((t) => t.acct !== a.id && t.to !== a.id); S.accounts = S.accounts.filter((y) => y !== a); S.hold.forEach((h) => { if (h.acct === a.id) h.acct = ''; }); S.subs.forEach((s) => { if (s.acct === a.id) { s.acct = ''; s.auto = false; } }); save(); return json(res, 200, stateView()); }
  }
  /* categories, rules */
  if (p === '/categories' && m === 'POST') { const b = await body(); need(['expense', 'income'].includes(b.kind), 'Choose expense or income'); const n = str(b.name, 40); need(n, 'Give the category a name'); S.categories.push({ id: id(), name: n, kind: b.kind, color: /^#[0-9a-f]{6}$/i.test(b.color || '') ? b.color : COLORS[S.categories.length % COLORS.length] }); save(); return json(res, 201, stateView()); }
  if ((x = p.match(/^\/categories\/([0-9a-f]{10})$/))) {
    const cc = S.categories.find((y) => y.id === x[1]); if (!cc) throw httpError(404, 'No such category');
    if (m === 'PUT') { const b = await body(); if (b.name !== undefined) { cc.name = str(b.name, 40); need(cc.name, 'Give the category a name'); } if (/^#[0-9a-f]{6}$/i.test(b.color || '')) cc.color = b.color; save(); return json(res, 200, stateView()); }
    if (m === 'DELETE') { S.tx.forEach((t) => { if (t.cat === cc.id) t.cat = ''; }); S.subs.forEach((s) => { if (s.cat === cc.id) s.cat = ''; }); S.rules = S.rules.filter((r) => r.cat !== cc.id); delete S.budgets[cc.id]; S.categories = S.categories.filter((y) => y !== cc); save(); return json(res, 200, stateView()); }
  }
  if (p === '/rules' && m === 'PUT') { const b = await body(); need(Array.isArray(b.rules) && b.rules.length <= 100, 'Bad rules'); S.rules = b.rules.map((r) => ({ match: str(r.match, 60), type: r.type === 'income' ? 'income' : 'expense', cat: String(r.cat || '') })).filter((r) => r.match && S.categories.some((cc) => cc.id === r.cat)); save(); return json(res, 200, stateView()); }
  /* transactions */
  if (p === '/tx' && m === 'GET') {
    const q = url.searchParams, from = q.get('from') || '0000-01-01', to = q.get('to') || '9999-12-31', acct = q.get('acct'), cat = q.get('cat'), type = q.get('type'), s = (q.get('q') || '').toLowerCase();
    const lim = Math.min(500, Math.max(1, Number(q.get('limit')) || 100)), off = Math.max(0, Number(q.get('offset')) || 0);
    let l = S.tx.filter((t) => t.date >= from && t.date <= to && (!acct || t.acct === acct || t.to === acct) && (cat === null || cat === '' || (cat === 'none' ? !t.cat : t.cat === cat)) && (!type || t.type === type) && (!s || (t.payee + ' ' + t.note).toLowerCase().includes(s)));
    l.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)); const total = l.length;
    let inc = 0, exp = 0; for (const t of l) { if (t.type === 'transfer') continue; const a = acctBy(t.acct), v = toBase(t.amt, a ? a.currency : S.settings.base); if (t.type === 'income') inc += v; else exp += v; }
    return json(res, 200, { total, income: d(inc), expense: d(exp), items: l.slice(off, off + lim).map(pubTx) });
  }
  if (p === '/tx' && m === 'POST') { const t = { id: id(), ...clean(txIn(await body(), null)) }; autoCat(t); S.tx.push(t); save(); return json(res, 201, { tx: pubTx(t) }); }
  if (p === '/tx/bulk' && m === 'POST') {
    const b = await body(); need(Array.isArray(b.rows) && b.rows.length <= 5000, 'Send up to 5000 rows at a time'); need(acctBy(b.acct), 'Choose the account these belong to');
    const seen = new Set(S.tx.filter((t) => t.acct === b.acct).map((t) => `${t.date}|${t.amt}|${t.type}|${(t.payee || '').toLowerCase()}`)); let added = 0, skipped = 0, bad = 0;
    for (const r of b.rows) {
      try {
        const n = num(r.amount); if (n === 0) { bad++; continue; } const o = clean(txIn({ type: r.type === 'income' || r.type === 'expense' ? r.type : n < 0 ? 'expense' : 'income', date: r.date, amount: Math.abs(n), acct: b.acct, payee: r.payee, note: r.note, cat: r.cat && S.categories.some((cc) => cc.id === r.cat) ? r.cat : '' }, null));
        const k = `${o.date}|${o.amt}|${o.type}|${(o.payee || '').toLowerCase()}`; if (seen.has(k) && !b.keepDuplicates) { skipped++; continue; } seen.add(k); const t = { id: id(), ...o }; autoCat(t); S.tx.push(t); added++;
      } catch { bad++; }
    }
    save(); return json(res, 200, { added, skipped, invalid: bad });
  }
  if (p === '/tx/export.csv' && m === 'GET') { res.writeHead(200, { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="anands-money.csv"', 'cache-control': 'no-store' }); return res.end(exportCsv()); }
  if ((x = p.match(/^\/tx\/([0-9a-f]{10})$/))) {
    const t = S.tx.find((y) => y.id === x[1]); if (!t) throw httpError(404, 'No such transaction');
    if (m === 'PUT') { Object.assign(t, txIn(await body(), t)); clean(t); save(); return json(res, 200, { tx: pubTx(t) }); }
    if (m === 'DELETE') { S.tx = S.tx.filter((y) => y !== t); save(); return json(res, 200, { ok: true }); }
  }
  if (p === '/report' && m === 'GET') return json(res, 200, report(Object.fromEntries(url.searchParams)));
  /* budgets */
  if (p === '/budgets' && m === 'PUT') {
    const b = await body(); need(S.categories.some((cc) => cc.id === b.cat && cc.kind === 'expense'), 'Choose an expense category'); const month = b.month === 'default' || /^\d{4}-\d{2}$/.test(b.month || '') ? b.month : 'default';
    S.budgets[b.cat] = S.budgets[b.cat] || {}; if (b.amount === null || b.amount === '') delete S.budgets[b.cat][month]; else { const n = num(b.amount); need(n >= 0, 'A budget cannot be negative'); S.budgets[b.cat][month] = c(n); }
    if (!Object.keys(S.budgets[b.cat]).length) delete S.budgets[b.cat]; save(); return json(res, 200, stateView());
  }
  /* goals */
  if (p === '/goals' && m === 'POST') { const b = await body(); const n = str(b.name, 60); need(n, 'Give the goal a name'); const cu = String(b.currency || S.settings.base).toUpperCase(); need(CUR.test(cu), 'Currency should be a code'); S.goals.push({ id: id(), name: n, target: c(num(b.target)), saved: c(num(b.saved || 0)), currency: cu, date: DATE.test(b.date || '') ? b.date : '', acct: b.acct && acctBy(b.acct) ? b.acct : '' }); save(); return json(res, 201, stateView()); }
  if ((x = p.match(/^\/goals\/([0-9a-f]{10})$/))) {
    const g = S.goals.find((y) => y.id === x[1]); if (!g) throw httpError(404, 'No such goal');
    if (m === 'PUT') { const b = await body(); if (b.name !== undefined) g.name = str(b.name, 60) || g.name; if (b.target !== undefined) g.target = c(num(b.target)); if (b.saved !== undefined) g.saved = c(num(b.saved)); if (b.add !== undefined) g.saved = (g.saved || 0) + c(num(b.add)); if (b.date !== undefined) g.date = DATE.test(b.date) ? b.date : ''; save(); return json(res, 200, stateView()); }
    if (m === 'DELETE') { S.goals = S.goals.filter((y) => y !== g); save(); return json(res, 200, stateView()); }
  }
  /* subscriptions */
  const subIn = (b, cur) => {
    const o = {}; if (b.name !== undefined || !cur) { o.name = str(b.name, 60); need(o.name, 'Give the subscription a name'); }
    if (b.amount !== undefined || !cur) { const n = num(b.amount); need(n >= 0, 'The amount cannot be negative'); o.amt = c(n); }
    if (b.currency !== undefined || !cur) { o.currency = String(b.currency || S.settings.base).toUpperCase(); need(CUR.test(o.currency), 'Currency should be a code'); }
    if (b.cycle !== undefined || !cur) { need(CYCLES.includes(b.cycle || 'monthly'), 'Choose weekly, monthly, quarterly or yearly'); o.cycle = b.cycle || 'monthly'; }
    if (b.next !== undefined || !cur) { need(DATE.test(b.next || ''), 'Use the next payment date like 2026-11-01'); o.next = b.next; }
    if (b.acct !== undefined) { need(!b.acct || acctBy(b.acct), 'Unknown account'); o.acct = b.acct || ''; } if (b.cat !== undefined) { need(!b.cat || S.categories.some((cc) => cc.id === b.cat), 'Unknown category'); o.cat = b.cat || ''; }
    if (b.active !== undefined) o.active = !!b.active; if (b.url !== undefined) o.url = /^https?:\/\//i.test(b.url) ? str(b.url, 200) : ''; if (b.note !== undefined) o.note = str(b.note, 200); if (b.remind !== undefined) o.remind = Math.min(60, Math.max(0, Math.round(Number(b.remind) || 0))); if (b.auto !== undefined) o.auto = !!b.auto; if (b.color !== undefined) o.color = str(b.color, 9);
    if ((o.auto ?? cur?.auto)) need((o.acct ?? cur?.acct), 'Choose the account it is paid from to record payments automatically'); return o;
  };
  if (p === '/subs' && m === 'POST') { S.subs.push({ id: id(), ...subIn(await body(), null) }); save(); tick(); return json(res, 201, stateView()); }
  if ((x = p.match(/^\/subs\/([0-9a-f]{10})(\/paid)?$/))) {
    const s = S.subs.find((y) => y.id === x[1]); if (!s) throw httpError(404, 'No such subscription');
    if (x[2] && m === 'POST') { const b = await body(); if (b.record !== false && s.acct && acctBy(s.acct)) S.tx.push({ id: id(), date: s.next <= today() ? s.next : today(), type: 'expense', amt: s.amt, acct: s.acct, cat: s.cat || '', payee: s.name, note: 'Subscription', sub: s.id }); s.next = addCycle(s.next, s.cycle); save(); return json(res, 200, stateView()); }
    if (m === 'PUT') { Object.assign(s, subIn(await body(), s)); save(); tick(); return json(res, 200, stateView()); }
    if (m === 'DELETE') { S.subs = S.subs.filter((y) => y !== s); save(); return json(res, 200, stateView()); }
  }
  /* investments */
  const KINDS = ['stock', 'fund', 'crypto', 'bond', 'cash', 'property', 'other'];
  if (p === '/holdings' && m === 'POST') {
    const b = await body(); const sym = str(b.symbol, 20).toUpperCase(), name = str(b.name, 60) || sym; need(sym || name, 'Give it a symbol or a name'); const cu = String(b.currency || S.settings.base).toUpperCase(); need(CUR.test(cu), 'Currency should be a code');
    const h = { id: id(), symbol: sym, name, kind: KINDS.includes(b.kind) ? b.kind : 'stock', currency: cu, acct: b.acct && acctBy(b.acct) ? b.acct : '', price: b.price ? num(b.price) : 0, priceAt: b.price ? Date.now() : 0, trades: [], currencyLocked: true };
    S.hold.push(h); save(); return json(res, 201, stateView());
  }
  if ((x = p.match(/^\/holdings\/([0-9a-f]{10})(\/trades(?:\/([0-9a-f]{10}))?)?$/))) {
    const h = S.hold.find((y) => y.id === x[1]); if (!h) throw httpError(404, 'No such holding');
    if (x[2] && m === 'POST') { const b = await body(); need(['buy', 'sell', 'dividend'].includes(b.type), 'Choose buy, sell or dividend'); need(DATE.test(b.date || ''), 'Use a date like 2026-10-16'); const q = num(b.qty); need(q > 0, 'Enter how many'); const pr = num(b.price); need(pr >= 0, 'The price cannot be negative'); if (b.type === 'sell') { const st = holdingStats(h); need(q <= st.qty + 1e-9, 'You only hold ' + st.qty); } h.trades.push({ id: id(), date: b.date, type: b.type, qty: q, price: pr, fee: Math.max(0, Number(b.fee) || 0) }); if (b.setPrice && b.type !== 'dividend') { h.price = pr; h.priceAt = Date.now(); } save(); return json(res, 200, stateView()); }
    if (x[3] && m === 'DELETE') { h.trades = h.trades.filter((t) => t.id !== x[3]); save(); return json(res, 200, stateView()); }
    if (!x[2] && m === 'PUT') { const b = await body(); if (b.name !== undefined) h.name = str(b.name, 60) || h.name; if (b.symbol !== undefined) h.symbol = str(b.symbol, 20).toUpperCase(); if (b.kind !== undefined && KINDS.includes(b.kind)) h.kind = b.kind; if (b.price !== undefined && b.price !== '') { h.price = num(b.price); h.priceAt = Date.now(); } if (b.currency !== undefined) { const cu = String(b.currency).toUpperCase(); need(CUR.test(cu), 'Currency should be a code'); h.currency = cu; h.currencyLocked = true; } if (b.acct !== undefined) h.acct = b.acct && acctBy(b.acct) ? b.acct : ''; save(); return json(res, 200, stateView()); }
    if (!x[2] && m === 'DELETE') { S.hold = S.hold.filter((y) => y !== h); save(); return json(res, 200, stateView()); }
  }
  if (p === '/prices/refresh' && m === 'POST') { const r = await refreshPrices(); return json(res, 200, { ...r, state: stateView() }); }
  /* exchange rates */
  if (p === '/rates/refresh' && m === 'POST') { await refreshRates(); return json(res, 200, stateView()); }
  if (p === '/rates' && m === 'PUT') { const b = await body(); need(b.map && typeof b.map === 'object', 'Send the rates'); const mp = { ...S.rates.map }; for (const [k, v] of Object.entries(b.map)) { const kk = k.toUpperCase(); need(CUR.test(kk), 'Bad currency code ' + k); const n = Number(v); need(n > 0 && Number.isFinite(n), 'Rates must be more than zero'); mp[kk] = n; } mp[S.rates.base] = 1; S.rates = { ...S.rates, map: mp, at: Date.now() }; save(); return json(res, 200, stateView()); }
  throw httpError(404, 'Unknown money route');
}
export const _money = { holdingStats, addCycle };

/* read-only views for Life (net worth, Daily Brief, Life Search) */
export function lifeView() {
  load(); tick(); const v = stateView();
  return { base: v.settings.base, netWorth: v.netWorth, goals: v.goals, subs: v.subs.filter((s) => s.active), accounts: v.accounts.filter((a) => !a.archived).length, convert: (amount, cur) => { const r = rate(cur); return r == null ? null : amount * r; } };
}
export function lifeSearch(q) {
  load(); const w = String(q || '').toLowerCase().split(/\s+/).filter(Boolean); if (!w.length) return [];
  return [...S.tx].sort((a, b) => b.date.localeCompare(a.date)).filter((t) => { const h = ((t.payee || '') + ' ' + (t.note || '')).toLowerCase(); return w.every((x) => h.includes(x)); }).slice(0, 6)
    .map((t) => ({ id: t.id, date: t.date, type: t.type, amount: d(t.amt), currency: (acctBy(t.acct) || {}).currency || S.settings.base, payee: t.payee || '', note: t.note || '' }));
}
