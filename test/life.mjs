// Life: journal and notes, documents with expiry, net worth, search, Daily Brief.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let chromium = null; for (const base of [root + '/', '/opt/npm-tools/node_modules/']) { try { chromium = createRequire(base)('playwright').chromium; break; } catch {} }
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-life-')); const port = 20000 + Math.floor(Math.random() * 20000), B = `http://127.0.0.1:${port}`;
const srv = spawn('node', ['server/index.js'], { cwd: root, stdio: 'ignore', env: { ...process.env, PORT: String(port), DATA_DIR: data, SUITE_DIR: path.join(root, 'test/fixtures/suite'), APP_PASSWORD: 'pw', SESSION_SECRET: 'x'.repeat(40) } });
for (let i = 0; i < 50; i++) { try { if ((await fetch(B + '/healthz')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
let pass = 0, failed = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { failed++; console.log('FAIL ' + n + '\n     ' + (e.stack || e).toString().split('\n').slice(0, 5).join('\n     ')); } };
const H = { 'x-aos': '1', 'content-type': 'application/json' };
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const errs = [];
try {
  const lr = await fetch(B + '/auth/password', { method: 'POST', headers: H, body: JSON.stringify({ password: 'pw' }) });
  const cookie = (lr.headers.getSetCookie() || []).map((c) => c.split(';')[0]).join(';');
  const api = async (m, p, b) => { const r = await fetch(B + '/api/life' + p, { method: m, headers: { ...H, cookie }, body: b ? JSON.stringify(b) : undefined }); return { status: r.status, j: await r.json().catch(() => null) }; };
  const ymd = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

  await t('everything needs the signed-in owner', async () => {
    for (const p of ['/notes', '/docs', '/worth', '/brief', '/search?q=a']) assert.equal((await fetch(B + '/api/life' + p)).status, 401);
  });
  await t('notes: tags come from the text, [[links]] resolve both ways, bad input is refused', async () => {
    assert.equal((await api('POST', '/notes', { body: '   ' })).status, 400);
    const a = (await api('POST', '/notes', { kind: 'note', title: 'Trip plan', body: 'Pack light #travel #Family' })).j.note; assert.deepEqual(a.tags.sort(), ['family', 'travel']);
    const b = (await api('POST', '/notes', { kind: 'journal', body: 'Booked it, see [[Trip plan]] and [[Nothing yet]]', date: ymd(0) })).j.note;
    assert.equal(b.links.find((l) => l.title === 'Trip plan').id, a.id); assert.equal(b.links.find((l) => l.title === 'Nothing yet').id, '');
    assert.deepEqual((await api('GET', '/notes/' + a.id)).j.note.back.map((x) => x.id), [b.id]);
    const list = (await api('GET', '/notes?tag=travel')).j; assert.equal(list.total, 1); assert.ok(list.tags.some((x) => x.tag === 'family'));
    assert.equal((await api('GET', '/notes?q=booked')).j.total, 1); assert.equal((await api('POST', '/journal/today?d=' + ymd(0))).j.note.id, b.id, 'today\'s journal is reused');
    assert.equal((await api('GET', '/notes')).j.streak, 1);
    assert.equal((await api('PUT', '/notes/' + a.id, { pinned: true, mood: 4 })).j.note.mood, 4); assert.equal((await api('GET', '/notes')).j.items[0].id, a.id, 'pinned first');
  });
  await t('documents: expiry maths, reminder bands, validation', async () => {
    assert.equal((await api('POST', '/docs', { name: '' })).status, 400);
    assert.equal((await api('POST', '/docs', { name: 'X', issued: '2026-05-01', expires: '2026-04-01' })).status, 400);
    for (const [n, d] of [['Passport', 20], ['Licence', 5], ['Insurance', -3], ['Visa', 200], ['Library card', null]]) await api('POST', '/docs', { name: n, kind: n === 'Passport' ? 'Passport' : 'Other', expires: d == null ? '' : ymd(d) });
    const v = (await api('GET', '/docs?d=' + ymd(0))).j, by = Object.fromEntries(v.items.map((x) => [x.name, x]));
    assert.equal(by.Passport.status, 'month'); assert.equal(by.Passport.days, 20); assert.equal(by.Licence.status, 'week'); assert.equal(by.Insurance.status, 'expired'); assert.equal(by.Visa.status, 'ok'); assert.equal(by['Library card'].status, 'none');
    assert.equal(v.items[0].name, 'Insurance', 'soonest first'); assert.equal(v.summary.expired, 1); assert.equal(v.summary.soon, 2);
  });
  await t('net worth: assets, debts and snapshots add up; bad amounts refused', async () => {
    assert.equal((await api('POST', '/assets', { name: 'Car', value: '-5' })).status, 400);
    await api('POST', '/assets', { name: 'Car', kind: 'Vehicle', value: '9,000', currency: 'USD' }); await api('POST', '/assets', { name: 'Flat', kind: 'Property', value: 100000 });
    const d = (await api('POST', '/debts', { name: 'Car loan', kind: 'Loan', balance: 4000, rate: 7.5 })).j;
    assert.equal(d.totalAssets, 109000); assert.equal(d.totalDebts, 4000); assert.equal(d.total, 105000); assert.equal(d.snaps.length, 1, 'a monthly snapshot is saved automatically');
    const s = (await api('POST', '/worth/snapshot')).j; assert.equal(s.snaps.length, 1, 'one snapshot per day');
  });
  await t('search finds notes, documents and belongings by words', async () => {
    const r = (await api('GET', '/search?q=passport')).j; assert.equal(r.groups[0].key, 'docs');
    const n = (await api('GET', '/search?q=pack light')).j; assert.equal(n.groups[0].key, 'notes');
    assert.equal((await api('GET', '/search?q=zzzzqq')).j.total, 0);
  });
  await t('Daily Brief lists documents running out, and the journal streak', async () => {
    const b = (await api('GET', '/brief?d=' + ymd(0))).j, docs = b.sections.find((s) => s.key === 'docs'); assert.ok(docs, 'documents section'); const names = docs.items.map((i) => i.text); assert.ok(names.includes('Licence') && names.includes('Insurance'));
    assert.equal(b.journal.today, true); assert.equal(b.pulse.connected, false);
  });

  const ctx = await browser.newContext({ viewport: { width: 1200, height: 800 }, colorScheme: 'dark' }); await ctx.request.post(B + '/auth/password', { data: { password: 'pw' }, headers: { 'x-aos': '1' } });
  const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await t('Journal: write today, it saves by itself, shows in the list, tags and links appear', async () => {
    await p.goto(B + '/tools/life.html#journal'); await p.waitForSelector('.jr');
    await p.click('[data-a="today-entry"] >> nth=0'); await p.waitForSelector('#jb');
    await p.fill('#jb', 'A quiet evening. Reading about #books and [[Trip plan]]'); await p.waitForFunction(() => document.getElementById('jst') && document.getElementById('jst').textContent === 'Saved', null, { timeout: 8000 });
    await p.waitForSelector('.lchips button:has-text("#books")'); await p.waitForSelector('.meta .lchip:has-text("Trip plan")');
    const saved = (await api('GET', '/notes?q=quiet+evening')).j; assert.equal(saved.total, 1); assert.ok(saved.items[0].tags.includes('books'));
    await p.fill('#jq', 'books'); await p.waitForFunction(() => document.querySelectorAll('.jn').length === 1);
  });
  await t('Journal: a new note autosaves, and deleting asks first', async () => {
    await p.fill('#jq', ''); await p.click('[data-a="new-note"]'); await p.fill('#jt', 'Gift ideas'); await p.fill('#jb', 'Watch strap'); await p.waitForFunction(() => document.getElementById('jst').textContent === 'Saved', null, { timeout: 8000 });
    assert.equal((await api('GET', '/notes?q=gift+ideas')).j.total, 1);
    await p.click('[data-a="del-note"]'); await p.click('#dly'); await p.waitForFunction(() => !document.getElementById('jb'));
    assert.equal((await api('GET', '/notes?q=gift+ideas')).j.total, 0);
  });
  await t('Documents: add one in the form, see its band, expired ones flagged', async () => {
    await p.click('[data-tab="docs"]'); await p.waitForSelector('.lsum'); assert.ok(await p.locator('.pillx.bad:has-text("Expired")').count() >= 1);
    await p.click('[data-a="new-doc"] >> nth=0'); await p.fill('#dn', 'Driving licence TZ'); await p.selectOption('#dk', 'Driving licence'); await p.fill('#dex', ymd(60)); await p.click('#dok');
    await p.waitForSelector('.mrow:has-text("Driving licence TZ") .pillx:has-text("Under 90 days")');
  });
  await t('Net worth: totals and the asset list show; adding in the form updates the total', async () => {
    await p.click('[data-tab="worth"]'); await p.waitForSelector('.nwbig'); assert.match(await p.locator('.nwbig').innerText(), /105,000/);
    await p.click('[data-a="new-asset"]'); await p.fill('#en', 'Watch'); await p.fill('#ev', '1000'); await p.click('#eok'); await p.waitForFunction(() => /106,000/.test(document.querySelector('.nwbig').textContent));
  });
  await t('Search: one box finds across notes, documents and belongings', async () => {
    await p.click('[data-tab="search"]'); await p.fill('#sq', 'licence'); await p.waitForSelector('.lcard h2:has-text("Documents")');
    await p.fill('#sq', 'quiet evening'); await p.waitForSelector('.lcard h2:has-text("Journal and notes")'); await p.click('.lrow[data-g="notes"]'); await p.waitForSelector('#jb'); assert.match(await p.inputValue('#jb'), /quiet evening/i);
  });
  await t('Home shows the Daily Brief card; the launcher and Desktop list the new apps', async () => {
    await p.goto(B + '/'); await p.waitForSelector('.dbrief .dbr'); assert.ok(await p.locator('.dbrief').innerText().then((x) => /Insurance|Licence/.test(x)));
    await p.click('.dbrief .dbj'); await p.waitForSelector('iframe.appframe'); const src = await p.locator('iframe.appframe').getAttribute('src'); assert.match(src, /life\.html#journal/);
    await p.goto(B + '/#apps'); await p.waitForSelector('.app, .tile, button');
    const names = await p.locator('body').innerText(); for (const n of ['Daily Brief', 'Journal and notes', 'Documents', 'Net worth', 'Life Search']) assert.ok(names.includes(n), n + ' in the launcher');
    await p.goto(B + '/#desktop'); await p.waitForSelector('#dkicons .dk-ic'); await p.click('#dkicons [data-w="tool:journal"]'); await p.waitForSelector('.dkw iframe[src*="life.html#journal"]');
  });
  await t('phone: Life pages fit a 390 px screen without sideways scroll', async () => {
    const m = await browser.newContext({ viewport: { width: 390, height: 780 }, colorScheme: 'dark', isMobile: true, hasTouch: true }); await m.request.post(B + '/auth/password', { data: { password: 'pw' }, headers: { 'x-aos': '1' } });
    const q = await m.newPage();
    for (const tab of ['today', 'journal', 'docs', 'worth', 'search']) { await q.goto(B + '/tools/life.html#' + tab); await q.waitForSelector('#mmain > *'); await q.waitForTimeout(500); assert.ok(await q.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tab + ' overflows'); }
    await q.goto(B + '/tools/life.html#journal'); await q.waitForSelector('.jn'); await q.click('.jn >> nth=0'); await q.waitForSelector('#jb'); assert.equal(await q.locator('.jl').isVisible(), false); await q.click('[data-a="back"]'); await q.waitForSelector('.jl');
    await m.close();
  });
  await t('no page errors', async () => assert.deepEqual(errs, []));
} finally { await browser.close(); srv.kill(); }
console.log(`\n${pass} passed, ${failed} failed`); process.exit(failed ? 1 : 0);
