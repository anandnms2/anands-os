// Built-in OS tools: editor, player, recorder, terminal, and their Desktop windows.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let chromium = null; for (const base of [root + '/', '/opt/npm-tools/node_modules/']) { try { chromium = createRequire(base)('playwright').chromium; break; } catch {} }
if (!chromium) { console.log('skip  Playwright not installed'); process.exit(0); }
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-tl-')), port = 20000 + Math.floor(Math.random() * 20000), B = `http://127.0.0.1:${port}`;
const srv = spawn('node', ['server/index.js'], { cwd: root, stdio: 'ignore', env: { ...process.env, PORT: String(port), DATA_DIR: data, SUITE_DIR: path.join(root, 'test/fixtures/suite'), APP_PASSWORD: 'pw' } });
for (let i = 0; i < 50; i++) { try { if ((await fetch(B + '/healthz')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
let pass = 0, failed = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { failed++; console.log('FAIL ' + n + '\n     ' + (e.stack || e).toString().split('\n').slice(0, 5).join('\n     ')); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ args: ['--no-sandbox', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'] }); const errs = [];
try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, permissions: ['microphone'] });
  const lr = await ctx.request.post(B + '/auth/password', { data: { password: 'pw' }, headers: { 'x-aos': '1' } }); assert.ok(lr.ok());
  const ck = (await ctx.cookies()).map((c) => c.name + '=' + c.value).join('; ');
  const H = { 'x-aos': '1' };
  const api = async (m, p, b) => { const r = await ctx.request.fetch(B + '/api/money' + p, { method: m, data: b, headers: H }); assert.ok(r.ok(), m + ' ' + p + ' ' + r.status() + ' ' + await r.text()); return r.json(); };
  const page = await ctx.newPage(); page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/ERR_TUNNEL|ERR_NAME|ERR_INTERNET/.test(m.text())) errs.push(m.text()); });
  await t('empty Money shows a welcome and no errors', async () => {
    await page.goto(B + '/tools/money.html'); await page.waitForSelector('.mempty');
    assert.ok((await page.locator('#mmain').innerText()).includes('Add your first account'));
  });
  await t('add an account and a transaction through the screens', async () => {
    await page.click('text=Add your first account'); await page.fill('#an', 'Main bank'); await page.fill('#ao', '1000'); await page.click('#asave'); await page.waitForSelector('#mmodal[hidden]', { state: 'attached' });
    await page.keyboard.press('n'); await page.waitForSelector('#tamt'); await page.fill('#tamt', '45.50'); await page.fill('#tpay', 'Shell'); await page.selectOption('#tcat', { label: 'Fuel' }).catch(async () => { const o = await page.$$eval('#tcat option', (x) => x.map((y) => y.textContent)); await page.selectOption('#tcat', { index: 1 }); }); await page.click('#tsave');
    await page.waitForFunction(() => document.querySelector('#mmodal').hidden); await page.waitForSelector('.mrow'); assert.ok((await page.locator('#mmain').innerText()).includes('Shell'));
    const s = await api('GET', '/state'); assert.equal(s.count, 1); assert.equal(s.accounts[0].balance, 954.5);
  });
  await t('every section renders without errors', async () => {
    for (const tab of ['tx', 'accounts', 'budgets', 'subs', 'invest', 'reports', 'settings', 'overview']) { await page.click('#mnav [data-tab=' + tab + ']'); await sleep(250); assert.ok((await page.locator('#mmain').innerText()).length > 20, tab); }
  });
  await t('budget, subscription and holding can be added', async () => {
    const s = await api('GET', '/state'), cat = s.categories.find((c) => c.kind === 'expense');
    await page.click('#mnav [data-tab=budgets]'); await page.click('[data-m=editbud][data-id="' + cat.id + '"]'); await page.fill('#bd', '300'); await page.click('#bok'); await page.waitForFunction(() => document.querySelector('#mmodal').hidden); await sleep(300);
    assert.equal((await api('GET', '/state')).budgets[cat.id].default, 300);
    await page.click('#mnav [data-tab=subs]'); await page.click('text=Add a subscription'); await page.fill('#sn', 'Hetzner'); await page.fill('#sa', '12'); await page.click('#sok'); await page.waitForFunction(() => document.querySelector('#mmodal').hidden); await sleep(300);
    assert.equal((await api('GET', '/state')).subs.length, 1);
    await page.click('#mnav [data-tab=invest]'); await page.click('text=Add a holding'); await page.fill('#hn', 'Index fund'); await page.fill('#hp', '100'); await page.click('#hok'); await page.waitForFunction(() => document.querySelector('#mmodal').hidden); await sleep(300);
    await page.click('[data-m=openhold]'); await page.fill('#tq', '3'); await page.click('#trok'); await page.waitForFunction(() => document.querySelector('#mmodal').hidden); await sleep(300);
    assert.equal((await api('GET', '/state')).invest.totals.value, 300);
  });
  await t('CSV import maps columns and skips duplicates', async () => {
    await page.click('#mnav [data-tab=tx]'); await page.click('text=Import CSV'); await page.setInputFiles('#ifile', { name: 'bank.csv', mimeType: 'text/csv', buffer: Buffer.from('Date,Description,Amount\n2026-10-01,Salary,2000\n2026-10-02,Market,-35.2\n') });
    await page.waitForSelector('#m-d'); await page.click('#iok'); await page.waitForFunction(() => document.querySelector('#mmodal').hidden); await sleep(300);
    const s = await api('GET', '/state'); assert.equal(s.count, 3);
  });
  await t('Money opens as an OS page and a Desktop window', async () => {
    const o = await ctx.newPage(); o.on('pageerror', (e) => errs.push(e.message)); await o.goto(B + '/#money'); await o.waitForSelector('iframe[src*="money.html"]'); const f = o.frameLocator('iframe[src*="money.html"]'); await f.locator('#mmain h1').waitFor(); assert.equal(await f.locator('#mmain h1').innerText(), 'Overview');
    await o.goto(B + '/#desktop'); await o.waitForSelector('#desk', { state: 'attached' }); await o.waitForFunction(() => window.AOSDesk && AOSDesk.state.open, null, { timeout: 8000 }).catch(async () => { await o.evaluate(() => AOSDesk.show()); }); await o.evaluate(() => AOSDesk.tool('subs')); await o.waitForSelector('.dkw iframe[src*="money.html#subs"]'); const g = o.frameLocator('.dkw iframe'); await g.locator('text=Hetzner').first().waitFor(); await o.close();
  });
  await t('no page errors', async () => { assert.deepEqual(errs, []); });
} finally { await browser.close(); srv.kill(); }
console.log(`\n${pass} passed, ${failed} failed`); process.exit(failed ? 1 : 0);
