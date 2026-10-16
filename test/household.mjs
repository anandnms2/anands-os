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
  const api = async (m, p, b) => { const r = await ctx.request.fetch(B + '/api/house' + p, { method: m, data: b, headers: H }); assert.ok(r.ok(), m + ' ' + p + ' ' + r.status() + ' ' + await r.text()); return r.json(); };
  const page = await ctx.newPage(); page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/ERR_TUNNEL|ERR_NAME|ERR_INTERNET/.test(m.text())) errs.push(m.text()); });
  await t('pantry stock is used oldest-first and cannot go negative', async () => {
    let s = await api('POST', '/products', { name: 'Rice', unit: 'kg', min: 2, stock: 1, expires: '2027-01-01' }); const id = s.products[0].id;
    await api('POST', '/products/' + id + '/stock', { delta: 3, expires: '2026-12-01' }); s = await api('POST', '/products/' + id + '/stock', { delta: -2 });
    const p = s.products[0]; assert.equal(p.stock, 2); assert.deepEqual(p.batches.map((b) => b.exp + ':' + b.qty), ['2026-12-01:1', '2027-01-01:1'].map((x, i) => i ? x : '2026-12-01:1'));
    const bad = await ctx.request.post(B + '/api/house/products/' + id + '/stock', { data: { delta: -9 }, headers: H }); assert.equal(bad.status(), 400);
  });
  await t('low stock fills the shopping list and buying restocks', async () => {
    let s = await api('POST', '/products/' + (await api('GET', '/state')).products[0].id + '/stock', { delta: -1 }); assert.equal(s.summary.low, 1);
    const r = await api('POST', '/shopping/missing', {}); assert.equal(r.added, 1); assert.equal((await api('POST', '/shopping/missing', {})).added, 0);
    s = await api('POST', '/shopping/' + r.state.shopping[0].id + '/bought', {}); assert.equal(s.products[0].stock, 2); assert.equal(s.summary.toBuy, 0);
  });
  await t('belongings page: add an item with a warranty and see it in Warranties', async () => {
    await page.goto(B + '/tools/home.html#belong'); await page.waitForSelector('.mempty'); await page.click('text=Add your first item'); await page.fill('#in', 'Standing desk'); await page.fill('#iw', '2027-03-01'); await page.fill('#iv', '450');
    await page.setInputFiles('#ir', { name: 'receipt.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test') }); await page.click('#iok'); await page.waitForFunction(() => document.querySelector('#mmodal').hidden); await page.waitForSelector('.mrow');
    const s = await api('GET', '/state'); assert.equal(s.items.length, 1); assert.ok(s.items[0].receipt.startsWith('/Receipts/')); const f = await fetch(B + '/_local/fs/get?path=' + encodeURIComponent(s.items[0].receipt), { headers: { cookie: ck } }); assert.equal(f.status, 200);
    await page.click('#mnav [data-tab=warranty]'); await page.waitForSelector('text=Standing desk'); assert.ok((await page.locator('#mmain').innerText()).includes('days left'));
  });
  await t('household page: shopping list add and bought', async () => {
    await page.goto(B + '/tools/home.html#house'); await page.waitForSelector('text=Rice'); await page.click('#mnav [data-tab=shop]'); await page.fill('#shn', 'Milk'); await page.click('#shf button'); await page.waitForSelector('text=Milk');
    await page.click('[data-a=bought]'); await page.waitForFunction(() => /Bought/.test(document.querySelector('#mmain').innerText)); assert.equal((await api('GET', '/state')).summary.toBuy, 0);
  });
  await t('opens in the OS as Belongings and Household pages, and Suite lists the built-in apps', async () => {
    const o = await ctx.newPage(); o.on('pageerror', (e) => errs.push(e.message)); await o.goto(B + '/#house'); await o.waitForSelector('iframe[src*="home.html#house"]'); assert.ok(await o.locator('.winbar a', { hasText: 'New tab' }).count() === 1); await o.frameLocator('iframe').locator('#mmain h1').waitFor();
    await o.goto(B + '/#apps'); await o.waitForSelector('.appcat'); const cat = (c) => o.locator('.appcat', { has: o.locator('h2', { hasText: c }) }); for (const [n, c] of [['Money', 'Finance'], ['Belongings', 'Productivity'], ['Terminal', 'Developer Tools'], ['Recorder', 'Creative Tools'], ['Servers', 'Engineering']]) assert.ok(await cat(c).locator('.app', { hasText: n }).count() >= 1, n + ' in ' + c); await o.close();
  });
  await t('Desktop shows the floating assistant button above windows', async () => {
    const d = await ctx.newPage(); d.on('pageerror', (e) => errs.push(e.message)); await d.goto(B + '/#desktop'); await d.waitForSelector('#dkfab'); await d.evaluate(() => AOSDesk.tool('editor')); await d.waitForSelector('.dkw'); const fab = d.locator('#dkfab'); assert.ok(await fab.isVisible());
    const box = await fab.boundingBox(); const top = await d.evaluate((b) => document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2).closest('#dkfab') !== null, box); assert.ok(top, 'button is on top');
    await fab.click(); await d.waitForSelector('.dkw .dk-ai'); await d.close();
  });
  await t('Desktop windows get an open-in-new-tab button and the Start menu sorts apps into categories', async () => {
    const d = await ctx.newPage(); d.on('pageerror', (e) => errs.push(e.message)); await d.goto(B + '/#desktop'); await d.waitForSelector('#dkfab'); await d.evaluate(() => AOSDesk.tool('money')); await d.waitForSelector('.dkw'); 
    const btn = d.locator('.dkw [data-dk=wtab]'); assert.ok(await btn.isVisible()); const [pop] = await Promise.all([d.context().waitForEvent('page'), btn.click()]); await pop.waitForLoadState(); assert.ok(pop.url().includes('/tools/money.html')); await pop.close();
    await d.click('.dk-start'); await d.waitForSelector('#dkmenu:not([hidden])'); const heads = await d.$$eval('#dkmenu .dk-mc', (x) => x.map((y) => y.textContent.trim())); for (const c of ['System', 'Finance', 'Developer Tools']) assert.ok(heads.includes(c), c + ' in ' + heads.join(','));
    const sys = await d.evaluate(() => { const h = [...document.querySelectorAll('#dkmenu .dk-mc')].find((x) => x.textContent.trim() === 'System'); return h ? [...h.nextElementSibling.querySelectorAll('.dk-mi')].length : 0; }); assert.ok(sys <= 4, 'System has ' + sys); await d.close();
  });
  await t('Documents (Paperless) is a tile on Home, in Suite and on the Desktop and opens its own address', async () => {
    await ctx.request.put(B + '/api/settings', { data: { links: { paperless: 'https://paperless.example.com' } }, headers: H });
    const o = await ctx.newPage(); o.on('pageerror', (e) => errs.push(e.message)); await o.goto(B + '/'); await o.waitForSelector('.svc'); assert.equal(await o.locator('a.svc', { hasText: 'Documents' }).getAttribute('href'), 'https://paperless.example.com');
    await o.goto(B + '/#apps'); await o.waitForSelector('.appcat'); assert.equal(await o.locator('a.app', { hasText: 'Documents' }).getAttribute('href'), 'https://paperless.example.com');
    await o.goto(B + '/#desktop'); await o.waitForSelector('#dkfab'); assert.equal(await o.locator('#dkicons [data-w="link:paperless"]').count(), 1);
    await o.close();
  });
  await t('no page errors', async () => { assert.deepEqual(errs, []); });
} finally { await browser.close(); srv.kill(); }
console.log(`\n${pass} passed, ${failed} failed`); process.exit(failed ? 1 : 0);
