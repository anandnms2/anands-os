// Links (Linkwarden) inside the OS: server proxy, settings, app page, Suite tile, Desktop icon.
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
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-lk-')), port = 20000 + Math.floor(Math.random() * 20000), B = `http://127.0.0.1:${port}`;
import { start as fakeLinks, TOKEN, links } from './fixtures/fake-links.mjs';
const fport = port + 1, fake = await fakeLinks(fport);
const srv = spawn('node', ['server/index.js'], { cwd: root, stdio: 'ignore', env: { ...process.env, PORT: String(port), DATA_DIR: data, SUITE_DIR: path.join(root, 'test/fixtures/suite'), APP_PASSWORD: 'pw' } });
for (let i = 0; i < 50; i++) { try { if ((await fetch(B + '/healthz')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
let pass = 0, failed = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { failed++; console.log('FAIL ' + n + '\n     ' + (e.stack || e).toString().split('\n').slice(0, 5).join('\n     ')); } };
const browser = await chromium.launch({ args: ['--no-sandbox'] }); const errs = [];
try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const lr = await ctx.request.post(B + '/auth/password', { data: { password: 'pw' }, headers: { 'x-aos': '1' } }); assert.ok(lr.ok());
  const H = { 'x-aos': '1' }; const get = async (p) => { const r = await ctx.request.get(B + '/api/bookmarks' + p); return { s: r.status(), j: await r.json().catch(() => ({})) }; };
  const page = await ctx.newPage(); page.on('pageerror', (e) => errs.push(e.message));
  await t('needs the token, rejects a wrong one, never echoes it', async () => {
    await ctx.request.put(B + '/api/settings', { data: { bookmarks: { url: 'http://127.0.0.1:' + fport } }, headers: H });
    let r = await get('/status'); assert.equal(r.j.connected, false); assert.match(r.j.reason, /token/i);
    await ctx.request.put(B + '/api/settings', { data: { bookmarks: { token: 'wrong' } }, headers: H });
    r = await get('/status'); assert.match(r.j.reason, /refused the token/i);
    const s = await (await ctx.request.get(B + '/api/settings')).json(); assert.equal(s.bookmarks.tokenSet, true); assert.ok(!JSON.stringify(s).includes('wrong'));
    await ctx.request.put(B + '/api/settings', { data: { bookmarks: { token: TOKEN } }, headers: H });
    r = await get('/status'); assert.equal(r.j.connected, true); assert.equal(r.j.collections, 2);
    const tr = await (await ctx.request.post(B + '/api/settings/test', { data: { target: 'bookmarks' }, headers: H })).json(); assert.equal(tr.connected, true);
  });
  await t('lists, searches and filters links', async () => {
    assert.equal((await get('/links')).j.results.length, 3);
    assert.equal((await get('/links?q=coolify')).j.results.length, 1);
    assert.equal((await get('/links?collection=2')).j.results[0].host, 'example.com');
    assert.equal((await get('/links?tag=2')).j.results.length, 1);
    assert.equal((await get('/links?pinned=1')).j.results.length, 1);
    const m = (await get('/meta')).j; assert.equal(m.collections.length, 2); assert.equal(m.tags.length, 2);
  });
  await t('adds and deletes a link, rejects bad addresses', async () => {
    let r = await ctx.request.post(B + '/api/bookmarks/links', { data: { url: 'javascript:alert(1)' }, headers: H }); assert.equal(r.status(), 400);
    r = await ctx.request.post(B + '/api/bookmarks/links', { data: { url: 'https://anands.pro', tags: 'a, b', collection: 2 }, headers: H }); assert.equal(r.status(), 201); assert.equal(links.length, 4);
    const id = (await r.json()).id; r = await ctx.request.delete(B + '/api/bookmarks/links/' + id, { headers: H }); assert.equal(r.status(), 200); assert.equal(links.length, 3);
  });
  await t('app page shows links without exposing the token, and can add one', async () => {
    await page.goto(B + '/#bookmarks'); await page.waitForSelector('.appframe'); const fr = page.frameLocator('.appframe');
    await fr.locator('.pl-doc').first().waitFor(); assert.equal(await fr.locator('.pl-doc').count(), 3); assert.ok(!(await page.content()).includes(TOKEN));
    await fr.locator('#lkq').fill('sourdough'); await fr.locator('.pl-doc').nth(0).waitFor(); await page.waitForTimeout(700); assert.equal(await fr.locator('.pl-doc').count(), 1);
    await fr.locator('.pl-t', { hasText: 'Reading' }).click(); await page.waitForTimeout(300);
    await fr.locator('#mfab').click(); await fr.locator('#au').fill('https://example.org/new'); await fr.locator('#aok').click(); await page.waitForTimeout(600); assert.equal(links.length, 4);
  });
  await t('Collections and Tags pages like Linkwarden', async () => {
    await page.goto(B + '/#bookmarks'); await page.waitForSelector('.appframe'); const fr = page.frameLocator('.appframe');
    await fr.locator('[data-tab="collections"]').click(); await fr.locator('.lk-card').first().waitFor(); assert.equal(await fr.locator('.lk-card').count(), 2);
    await fr.locator('.lk-card', { hasText: 'Dev tools' }).click(); await fr.locator('.pl-doc').first().waitFor(); assert.equal(await fr.locator('.pl-doc').count(), 2); assert.match(await fr.locator('h1').innerText(), /Dev tools/);
    await fr.locator('[data-tab="tags"]').click(); await fr.locator('.lk-tags .mchip').first().waitFor();
    await fr.locator('.lk-tags .mchip', { hasText: 'api' }).click(); await fr.locator('.pl-doc').first().waitFor(); assert.equal(await fr.locator('.pl-doc').count(), 1); assert.match(await fr.locator('h1').innerText(), /#api/);
  });
  await t('Suite tile, Home tile and Desktop icon exist', async () => {
    await page.goto(B + '/#apps'); await page.waitForSelector('.appcat'); assert.equal(await page.locator('.app', { hasText: 'Links' }).count(), 1);
    await page.goto(B + '/'); await page.waitForSelector('.svc'); assert.ok(await page.locator('.svc', { hasText: 'Links' }).count() >= 1);
    await page.goto(B + '/#desktop'); await page.waitForSelector('#dkfab'); assert.equal(await page.locator('#dkicons [data-w="tool:bookmarks"]').count(), 1);
  });
  await t('settings card saves the token', async () => {
    await page.goto(B + '/#settings'); await page.waitForSelector('#s_bt'); await page.locator('#s_bt').fill(TOKEN); await page.locator('[data-k="bookmarks"]').click(); await page.locator('#r_bookmarks', { hasText: 'Connected' }).waitFor();
  });
  await t('no page errors', async () => { assert.deepEqual(errs, []); });
} finally { await browser.close(); srv.kill(); fake.close(); }
console.log(`\n${pass} passed, ${failed} failed`); process.exit(failed ? 1 : 0);
