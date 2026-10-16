// Money: accounts, transactions, budgets, subscriptions, investments, rates. API level, with mock price and rate services.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mock = http.createServer((q, r) => {
  const u = new URL(q.url, 'http://x'); r.writeHead(200, { 'content-type': 'application/json' });
  if (u.pathname.startsWith('/rates/')) return r.end(JSON.stringify({ result: 'success', rates: { USD: 1, TZS: 2500, INR: 80, EUR: 0.9 } }));
  if (u.pathname.startsWith('/chart/')) { const s = decodeURIComponent(u.pathname.slice(7)); return r.end(JSON.stringify(s === 'AAPL' ? { chart: { result: [{ meta: { regularMarketPrice: 200, currency: 'USD' } }] } } : { chart: { result: null } })); }
  r.end('{}');
});
await new Promise((r) => mock.listen(0, '127.0.0.1', r)); const MP = mock.address().port;
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-mn-')), port = 20000 + Math.floor(Math.random() * 20000), B = `http://127.0.0.1:${port}`;
const srv = spawn('node', ['server/index.js'], { cwd: root, stdio: 'ignore', env: { ...process.env, PORT: String(port), DATA_DIR: data, SUITE_DIR: path.join(root, 'test/fixtures/suite'), APP_PASSWORD: 'pw', MONEY_RATES_URL: `http://127.0.0.1:${MP}/rates/`, MONEY_PRICE_URL: `http://127.0.0.1:${MP}/chart/` } });
for (let i = 0; i < 50; i++) { try { if ((await fetch(B + '/healthz')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
let pass = 0, failed = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { failed++; console.log('FAIL ' + n + '\n     ' + (e.stack || e).toString().split('\n').slice(0, 4).join('\n     ')); } };
try {
  const lr = await fetch(B + '/auth/password', { method: 'POST', headers: { 'content-type': 'application/json', 'x-aos': '1' }, body: JSON.stringify({ password: 'pw' }) }); const ck = lr.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
  const call = async (m, p, b, cookie = ck) => { const r = await fetch(B + '/api/money' + p, { method: m, headers: { cookie, 'x-aos': '1', 'content-type': 'application/json' }, body: b ? JSON.stringify(b) : undefined }); const ct = r.headers.get('content-type') || ''; return { status: r.status, j: ct.includes('json') ? await r.json() : await r.text() }; };
  const month = new Date().toISOString().slice(0, 7), D = (n) => month + '-' + String(n).padStart(2, '0'), cat = (st, n) => st.categories.find((c) => c.name === n).id;
  let st, bank, cash, tzs;
  await t('needs sign-in and starts with sensible categories', async () => {
    assert.equal((await fetch(B + '/api/money/state')).status, 401); st = (await call('GET', '/state')).j; assert.ok(st.categories.length >= 15 && st.categories.some((c) => c.name === 'Groceries' && c.kind === 'expense')); assert.equal(st.settings.base, 'USD'); assert.equal(st.accounts.length, 0);
  });
  await t('accounts: create, validate, update', async () => {
    assert.equal((await call('POST', '/accounts', { name: '', currency: 'USD' })).status, 400); assert.equal((await call('POST', '/accounts', { name: 'X', currency: 'dollars!' })).status, 400);
    st = (await call('POST', '/accounts', { name: 'CRDB Current', type: 'bank', currency: 'USD', opening: 1000 })).j; bank = st.accounts[0];
    st = (await call('POST', '/accounts', { name: 'Wallet', type: 'cash', currency: 'USD', opening: 50 })).j; cash = st.accounts[1];
    st = (await call('POST', '/accounts', { name: 'M-Pesa', type: 'mobile', currency: 'TZS', opening: 250000 })).j; tzs = st.accounts[2];
    assert.equal(st.accounts.length, 3); assert.equal((await call('PUT', '/accounts/' + cash.id, { note: 'daily' })).j.accounts[1].note, 'daily');
  });
  await t('transactions move balances, transfers work across currencies', async () => {
    const g = cat(st, 'Groceries'), sal = cat(st, 'Salary');
    assert.equal((await call('POST', '/tx', { type: 'expense', date: D(1), amount: 0, acct: bank.id })).status, 400); assert.equal((await call('POST', '/tx', { type: 'expense', date: 'bad', amount: 5, acct: bank.id })).status, 400); assert.equal((await call('POST', '/tx', { type: 'expense', date: D(1), amount: 5, acct: 'nope' })).status, 400);
    await call('POST', '/tx', { type: 'income', date: D(1), amount: 3000, acct: bank.id, cat: sal, payee: 'Usangu' }); await call('POST', '/tx', { type: 'expense', date: D(2), amount: 120.5, acct: bank.id, cat: g, payee: 'Shoppers' });
    await call('POST', '/tx', { type: 'transfer', date: D(3), amount: 100, acct: bank.id, to: cash.id });
    const x = (await call('POST', '/tx', { type: 'transfer', date: D(3), amount: 100, acct: bank.id, to: tzs.id, toAmount: 250000 })).j.tx; assert.equal(x.toAmount, 250000);
    st = (await call('GET', '/state')).j; const b = Object.fromEntries(st.accounts.map((a) => [a.name, a.balance]));
    assert.equal(b['CRDB Current'], 1000 + 3000 - 120.5 - 100 - 100); assert.equal(b['Wallet'], 150); assert.equal(b['M-Pesa'], 500000);
    assert.equal((await call('POST', '/tx', { type: 'transfer', date: D(3), amount: 5, acct: bank.id, to: bank.id })).status, 400);
  });
  await t('exchange rates: refresh from the service, convert, warn when one is missing', async () => {
    assert.deepEqual(st.missingRates, ['TZS']); st = (await call('POST', '/rates/refresh')).j; assert.equal(st.rates.map.TZS, 2500); assert.deepEqual(st.missingRates, []);
    const m = st.accounts.find((a) => a.name === 'M-Pesa'); assert.equal(m.balanceBase, 200); assert.equal(st.netWorth.accounts, 3679.5 + 150 + 200);
    st = (await call('PUT', '/rates', { map: { TZS: 2600 } })).j; assert.equal(st.rates.map.TZS, 2600); assert.equal((await call('PUT', '/rates', { map: { TZS: -1 } })).status, 400);
  });
  await t('list, filter and search transactions', async () => {
    let r = (await call('GET', '/tx')).j; assert.equal(r.total, 4); assert.equal(r.items[0].date >= r.items[3].date, true);
    r = (await call('GET', '/tx?type=expense')).j; assert.equal(r.total, 1); assert.equal(r.expense, 120.5);
    r = (await call('GET', '/tx?q=shop')).j; assert.equal(r.total, 1); r = (await call('GET', '/tx?acct=' + cash.id)).j; assert.equal(r.total, 1); r = (await call('GET', '/tx?cat=none')).j; assert.equal(r.items.every((x) => !x.cat), true);
  });
  await t('edit and delete a transaction', async () => {
    const id = (await call('GET', '/tx?type=expense')).j.items[0].id; const u = (await call('PUT', '/tx/' + id, { amount: 100, note: 'edited' })).j.tx; assert.equal(u.amount, 100); assert.equal(u.note, 'edited');
    assert.equal((await call('DELETE', '/tx/' + id)).status, 200); assert.equal((await call('GET', '/tx?type=expense')).j.total, 0); assert.equal((await call('DELETE', '/tx/' + id)).status, 404);
    await call('POST', '/tx', { type: 'expense', date: D(2), amount: 120.5, acct: bank.id, cat: cat(st, 'Groceries'), payee: 'Shoppers' });
  });
  await t('budgets show progress for the month', async () => {
    st = (await call('PUT', '/budgets', { cat: cat(st, 'Groceries'), month: 'default', amount: 200 })).j; assert.equal((await call('PUT', '/budgets', { cat: cat(st, 'Salary'), amount: 5 })).status, 400);
    const r = (await call('GET', '/report?to=' + D(28))).j; const g = r.budgets.find((x) => x.name === 'Groceries'); assert.equal(g.budget, 200); assert.equal(g.spent, 120.5); assert.equal(g.left, 79.5); assert.equal(Math.round(g.pct), 60);
    assert.equal(r.income, 3000); assert.equal(r.expense, 120.5); assert.equal(r.net, 2879.5); assert.equal(r.categories[0].name, 'Groceries'); assert.equal(r.months.length, 12); assert.equal(r.months[11].expense, 120.5); assert.equal(r.payees[0].name, 'Shoppers');
    st = (await call('PUT', '/budgets', { cat: cat(st, 'Groceries'), month: 'default', amount: null })).j; assert.deepEqual(st.budgets, {});
  });
  await t('rules file new transactions under a category by payee', async () => {
    st = (await call('PUT', '/rules', { rules: [{ match: 'uber', type: 'expense', cat: cat(st, 'Transport') }] })).j; const x = (await call('POST', '/tx', { type: 'expense', date: D(4), amount: 7, acct: cash.id, payee: 'UBER trip' })).j.tx; assert.equal(x.cat, cat(st, 'Transport'));
  });
  await t('CSV import skips rows you already have', async () => {
    const rows = [{ date: D(5), amount: -45.2, payee: 'Total Fuel' }, { date: D(6), amount: 900, payee: 'Client A' }, { date: D(5), amount: -45.2, payee: 'Total Fuel' }, { date: 'nope', amount: 1, payee: 'x' }];
    let r = (await call('POST', '/tx/bulk', { acct: bank.id, rows })).j; assert.deepEqual([r.added, r.skipped, r.invalid], [2, 1, 1]); r = (await call('POST', '/tx/bulk', { acct: bank.id, rows: rows.slice(0, 2) })).j; assert.deepEqual([r.added, r.skipped], [0, 2]);
    const csv = (await call('GET', '/tx/export.csv')).j; assert.ok(csv.startsWith('date,type,amount,currency,account') && csv.includes('Total Fuel') && csv.includes('CRDB Current'));
  });
  await t('subscriptions: totals, mark paid, and automatic posting', async () => {
    st = (await call('POST', '/subs', { name: 'Netflix', amount: 15, currency: 'USD', cycle: 'monthly', next: D(28), acct: bank.id, cat: cat(st, 'Subscriptions') })).j; (await call('POST', '/subs', { name: 'Domain', amount: 24, currency: 'USD', cycle: 'yearly', next: '2027-02-01' }));
    st = (await call('GET', '/state')).j; assert.equal(st.subTotals.count, 2); assert.equal(st.subTotals.monthly, 17); assert.equal(st.subTotals.yearly, 204);
    const nf = st.subs.find((s) => s.name === 'Netflix'); const before = (await call('GET', '/tx')).j.total; st = (await call('POST', `/subs/${nf.id}/paid`, {})).j; assert.notEqual(st.subs.find((s) => s.name === 'Netflix').next, D(28)); assert.equal((await call('GET', '/tx')).j.total, before + 1);
    assert.equal((await call('POST', '/subs', { name: 'Auto', amount: 5, cycle: 'monthly', next: '2026-01-15', auto: true })).status, 400);
    st = (await call('POST', '/subs', { name: 'Gym', amount: 30, currency: 'USD', cycle: 'monthly', next: '2026-08-10', acct: bank.id, auto: true })).j; const gym = st.subs.find((s) => s.name === 'Gym'); assert.ok(gym.next > new Date().toISOString().slice(0, 10), 'caught up: ' + gym.next);
    const posted = (await call('GET', '/tx?q=Gym')).j; assert.ok(posted.total >= 2, 'gym payments posted: ' + posted.total);
  });
  await t('investments: average cost, sells, dividends, allocation', async () => {
    st = (await call('POST', '/holdings', { symbol: 'AAPL', name: 'Apple', kind: 'stock', currency: 'USD', price: 180 })).j; const h = st.invest.holdings[0];
    await call('POST', `/holdings/${h.id}/trades`, { type: 'buy', date: '2026-01-10', qty: 10, price: 100, fee: 5 }); await call('POST', `/holdings/${h.id}/trades`, { type: 'buy', date: '2026-02-10', qty: 10, price: 140 });
    st = (await call('POST', `/holdings/${h.id}/trades`, { type: 'sell', date: '2026-03-10', qty: 5, price: 200 })).j; let v = st.invest.holdings[0];
    assert.equal(v.qty, 15); assert.equal(Math.round(v.avg * 100) / 100, 120.25); assert.equal(Math.round(v.invested * 100) / 100, 1803.75); assert.equal(v.value, 2700); assert.equal(Math.round(v.realized * 100) / 100, 398.75);
    assert.equal((await call('POST', `/holdings/${h.id}/trades`, { type: 'sell', date: '2026-03-11', qty: 99, price: 1 })).status, 400);
    st = (await call('POST', `/holdings/${h.id}/trades`, { type: 'dividend', date: '2026-04-01', qty: 15, price: 0.5 })).j; assert.equal(st.invest.holdings[0].dividends, 7.5);
    assert.equal(st.invest.totals.value, 2700); assert.equal(st.netWorth.total, st.netWorth.accounts + 2700); assert.equal(st.invest.alloc[0].kind, 'stock');
  });
  await t('prices refresh from the market service, and one symbol that is unknown just fails quietly', async () => {
    st = (await call('POST', '/holdings', { symbol: 'NOPE', name: 'Unknown', kind: 'stock', currency: 'USD', price: 10 })).j; const r = (await call('POST', '/prices/refresh')).j; assert.equal(r.updated, 1); assert.equal(r.failed, 1);
    assert.equal(r.state.invest.holdings.find((x) => x.symbol === 'AAPL').price, 200);
  });
  await t('goals track saving', async () => {
    st = (await call('POST', '/goals', { name: 'New laptop', target: 1500, saved: 200, currency: 'USD', date: '2027-03-01' })).j; const g = st.goals[0]; st = (await call('PUT', '/goals/' + g.id, { add: 300 })).j; assert.equal(st.goals[0].saved, 500);
  });
  await t('changing the base currency restarts rates, deleting accounts needs care', async () => {
    assert.equal((await call('DELETE', '/accounts/' + bank.id)).status, 409); st = (await call('DELETE', '/accounts/' + bank.id + '?force=1')).j; assert.equal(st.accounts.some((a) => a.name === 'CRDB Current'), false); assert.equal((await call('GET', '/tx?acct=' + bank.id)).j.total, 0);
    st = (await call('PUT', '/settings', { base: 'TZS' })).j; assert.equal(st.settings.base, 'TZS'); assert.ok(st.missingRates.length > 0);
  });
  await t('data survives a restart of the file store and guests are shut out', async () => {
    assert.ok(fs.existsSync(path.join(data, 'money.json'))); assert.equal(fs.statSync(path.join(data, 'money.json')).mode & 0o077, 0, 'private file');
    const inv = await (await fetch(B + '/api/team', { method: 'POST', headers: { cookie: ck, 'x-aos': '1', 'content-type': 'application/json' }, body: JSON.stringify({ name: 'G', role: 'guest', apps: ['cards'] }) })).json(); const gc = (await fetch(inv.link, { redirect: 'manual' })).headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
    assert.equal((await call('GET', '/state', null, gc)).status, 403);
  });
} finally { srv.kill(); mock.close(); }
console.log(`\n${pass} passed, ${failed} failed`); process.exit(failed ? 1 : 0);
