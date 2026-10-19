// Built-in OS tools: editor, player, recorder, terminal, and their Desktop windows.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let chromium = null; for (const base of [root + '/', '/opt/npm-tools/node_modules/']) { try { chromium = createRequire(base)('playwright').chromium; break; } catch {} }
if (!chromium) { console.log('skip  Playwright not installed'); process.exit(0); }
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-tl-')), port = 20000 + Math.floor(Math.random() * 20000), B = `http://127.0.0.1:${port}`;
import { start as fakePaperless, TOKEN, uploads } from './fixtures/fake-paperless.mjs';
const fport = port + 1, fake = await fakePaperless(fport);
const srv = spawn('node', ['server/index.js'], { cwd: root, stdio: 'ignore', env: { ...process.env, PORT: String(port), DATA_DIR: data, SUITE_DIR: path.join(root, 'test/fixtures/suite'), APP_PASSWORD: 'pw' } });
for (let i = 0; i < 50; i++) { try { if ((await fetch(B + '/healthz')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
let pass = 0, failed = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { failed++; console.log('FAIL ' + n + '\n     ' + (e.stack || e).toString().split('\n').slice(0, 5).join('\n     ')); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ args: ['--no-sandbox', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'] }); const errs = [];
const shots = process.env.SHOTS || '';
try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const lr = await ctx.request.post(B + '/auth/password', { data: { password: 'pw' }, headers: { 'x-aos': '1' } }); assert.ok(lr.ok());
  const H = { 'x-aos': '1' }; const get = async (p) => { const r = await ctx.request.get(B + '/api/paperless' + p); return { s: r.status(), j: await r.json().catch(() => ({})) }; };
  const page = await ctx.newPage(); page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/ERR_TUNNEL|ERR_NAME|ERR_INTERNET|409/.test(m.text())) errs.push(m.text()); });
  await t('not connected until the address and token are saved', async () => {
    let r = await get('/status'); assert.equal(r.j.connected, false); assert.match(r.j.reason, /token/i);
    await ctx.request.put(B + '/api/settings', { data: { links: { paperless: 'http://127.0.0.1:' + fport } }, headers: H });
    r = await get('/status'); assert.match(r.j.reason, /token/i);
    await ctx.request.put(B + '/api/settings', { data: { paperless: { token: 'wrong' } }, headers: H });
    r = await get('/status'); assert.equal(r.j.connected, false); assert.match(r.j.reason, /refused the token/i);
    const s = await (await ctx.request.get(B + '/api/settings')).json(); assert.equal(s.paperless.tokenSet, true); assert.ok(!JSON.stringify(s).includes('wrong'));
    await ctx.request.put(B + '/api/settings', { data: { paperless: { token: TOKEN } }, headers: H });
    r = await get('/status'); assert.equal(r.j.connected, true); assert.equal(r.j.total, 6); assert.equal(r.j.inbox, 1);
    await ctx.request.put(B + '/api/settings', { data: { links: { paperless: 'http://127.0.0.1:' + fport + '/accounts/oidc/authentik/login/?process=login' } }, headers: H });
    r = await get('/status'); assert.equal(r.j.connected, true); assert.equal(r.j.total, 6);
    const web = http.createServer((q, rs) => { rs.writeHead(200, { 'content-type': 'text/html' }); rs.end('<html>Sign in</html>'); }); await new Promise((ok) => web.listen(0, '127.0.0.1', ok));
    await ctx.request.put(B + '/api/settings', { data: { links: { paperless: 'http://127.0.0.1:' + web.address().port } }, headers: H });
    r = await get('/status'); assert.equal(r.j.connected, false); assert.match(r.j.reason, /not with Paperless data/i); assert.ok(!/undefined|null/.test(r.j.reason)); web.close();
    await ctx.request.put(B + '/api/settings', { data: { links: { paperless: 'http://127.0.0.1:' + fport } }, headers: H });
  });
  await t('documents are searched, filtered and previewed through the server', async () => {
    let r = await get('/documents'); assert.equal(r.j.count, 6); assert.equal(r.j.results[0].title.startsWith('Scan 2026'), true);
    r = await get('/documents?q=customs'); assert.equal(r.j.count, 0);
    r = await get('/documents?q=insurance'); assert.equal(r.j.count, 4); assert.match(r.j.results[0].hit.snippet, /<mark>insurance<\/mark>/i);
    r = await get('/documents?tags=1,3'); assert.equal(r.j.count, 1); r = await get('/documents?inbox=1'); assert.equal(r.j.count, 1);
    r = await get('/meta'); assert.equal(r.j.tags.length, 5); assert.equal(r.j.correspondents[0].name, 'Jubilee Insurance');
    const th = await ctx.request.get(B + '/api/paperless/documents/1/thumb'); assert.equal(th.status(), 200); assert.match(th.headers()['content-type'], /image/);
    const pv = await ctx.request.get(B + '/api/paperless/documents/1/preview'); assert.equal(pv.headers()['content-type'], 'application/pdf'); assert.equal(pv.headers()['content-disposition'], 'inline');
    const p = await ctx.request.patch(B + '/api/paperless/documents/2', { data: { title: 'Renewal notice 2026', tags: [1, 4] }, headers: H }); assert.equal((await p.json()).title, 'Renewal notice 2026');
  });
  await t('upload goes to Paperless and the token never reaches the browser', async () => {
    const r = await ctx.request.post(B + '/api/paperless/upload?name=scan.pdf', { data: Buffer.from('%PDF-1.4 test'), headers: { ...H, 'content-type': 'application/pdf' } }); assert.equal(r.status(), 201); assert.equal(uploads.length, 1);
    await page.goto(B + '/#paperless'); await page.waitForSelector('.appframe'); const html = await page.content(); assert.ok(!html.includes(TOKEN));
    const nc = await ctx.request.post(B + '/api/paperless/upload?name=x.pdf', { data: Buffer.from('x'), headers: { 'content-type': 'application/pdf' } }); assert.equal(nc.status() >= 400, true);
  });
  await t('Paperless is an app inside the OS, in Suite and on Home, in our look', async () => {
    await page.goto(B + '/#paperless'); const fr = page.frameLocator('.appframe');
    await fr.locator('.pl-doc').first().waitFor(); assert.equal(await fr.locator('.pl-doc').count(), 6);
    assert.ok(await fr.locator('.brand img[src="/oicons/paperless.svg"]').count()); assert.match(await page.locator('.winbar').innerText(), /Local mode/);
    await fr.locator('#plq').fill('customs'); await page.waitForTimeout(600); assert.equal(await fr.locator('.pl-doc').count(), 0);
    await fr.locator('#plq').fill('insurance'); await fr.locator('.pl-doc .pl-sn mark').first().waitFor(); assert.equal(await fr.locator('.pl-doc').count(), 4);
    if (shots) await page.screenshot({ path: shots + '/os-paperless.png' });
    await fr.locator('.pl-doc').first().click(); await fr.locator('.pl-view iframe').waitFor(); assert.ok((await fr.locator('#vt').inputValue()).length > 3);
    if (shots) await page.screenshot({ path: shots + '/os-paperless-doc.png' });
    await fr.locator('[data-a="close"]').click();
    await page.goto(B + '/#apps'); await page.waitForSelector('.appcat'); assert.equal(await page.locator('.app', { hasText: 'Paperless' }).count(), 1); if (shots) await page.screenshot({ path: shots + '/suite-paperless.png' });
    await page.goto(B + '/'); await page.waitForSelector('.svc'); await page.locator('.svc', { hasText: 'Paperless' }).first().click(); await page.waitForSelector('.appframe');
  });
  await t('Paperless opens as a Desktop window; documents can be tagged', async () => {
    await page.goto(B + '/#desktop'); await page.waitForSelector('#dkfab'); await page.locator('#dkicons [data-w="tool:paperless"]').dblclick().catch(() => {}); if (!(await page.locator('.dkw').count())) await page.locator('#dkicons [data-w="tool:paperless"]').click();
    const fr = page.frameLocator('.dkw iframe'); await fr.locator('.pl-doc').first().waitFor();
    await fr.locator('.pl-doc').nth(1).click(); await fr.locator('#vtg button').first().waitFor(); await fr.locator('#vt').fill('Renamed by test'); await fr.locator('#vok').click(); await fr.locator('.pl-doc', { hasText: 'Renamed by test' }).waitFor();
    if (shots) await page.screenshot({ path: shots + '/desktop-paperless.png' });
  });
  await t('keyboard shortcuts work on the Desktop like Windows and Linux', async () => {
    await page.goto(B + '/#desktop'); await page.waitForSelector('#dkfab'); await page.reload(); await page.waitForSelector('#dkfab');
    const kp = async (k) => { await page.keyboard.press(k); await page.waitForTimeout(150); };
    const nwin = () => page.locator('.dkw:not([hidden])').count();
    await kp('Control+Alt+KeyE'); await page.waitForSelector('.dkw'); await kp('Control+Alt+KeyB'); await page.waitForTimeout(300);
    const before = await page.locator('.dkw').count(); assert.ok(before >= 2, 'two windows ' + before);
    /* Alt+Tab: hold Alt, tab, release */
    await page.keyboard.down('Alt'); await kp('Tab'); await page.waitForSelector('#dkalt .dk-alti.on'); assert.ok(await page.locator('#dkalt .dk-alti').count() >= 2);
    if (shots) await page.screenshot({ path: shots + '/desktop-alttab.png' });
    await page.keyboard.up('Alt'); await page.waitForTimeout(150); assert.equal(await page.locator('#dkalt').count(), 0);
    /* snap, maximise, minimise, show desktop */
    await kp('Control+Alt+ArrowLeft'); const box = await page.locator('.dkw.act').boundingBox(); assert.ok(box.x < 5 && box.width < 700, 'snapped left ' + JSON.stringify(box));
    await kp('Control+Alt+ArrowUp'); const mb = await page.locator('.dkw.act').boundingBox(); assert.ok(mb.width > 1000, 'maximised');
    await kp('Control+Alt+ArrowDown'); await kp('Control+Alt+KeyD'); assert.equal(await nwin(), 0); await kp('Control+Alt+KeyD'); assert.ok((await nwin()) >= 1);
    await kp('Control+Alt+Digit1'); await kp('Alt+F10');
    await kp('Control+Escape'); await page.waitForSelector('#dkmenu:not([hidden])'); await kp('Control+Escape'); await page.waitForSelector('#dkmenu[hidden]', { state: 'attached' });
    await kp('Meta'); await page.waitForSelector('#dkmenu:not([hidden])'); await kp('Escape');
    await kp('F1'); await page.waitForSelector('#dkhelp:not([hidden])'); assert.match(await page.locator('#dkhelp').innerText(), /Alt \+ Tab/); if (shots) await page.screenshot({ path: shots + '/desktop-keys.png' }); await kp('Escape');
    const n0 = await page.locator('.dkw').count(); await kp('Alt+F4'); assert.equal(await page.locator('.dkw').count(), n0 - 1);
    await kp('Control+Alt+KeyP'); const fr = page.frameLocator('.dkw iframe').last(); await fr.locator('.pl-doc').first().waitFor();
    /* keys pressed inside an app window still reach the Desktop */
    await fr.locator('#plq').click(); await kp('Alt+F4'); await page.waitForTimeout(200);
    const left = await page.locator('.dkw').count(); assert.equal(left, n0 - 1, 'Alt+F4 inside a window closed it');
  });
  if (shots) await t('screenshots of Settings and the connect screen', async () => {
    await page.goto(B + '/#settings'); await page.waitForSelector('#s_pt'); await page.locator('#s_pt').scrollIntoViewIfNeeded(); await page.screenshot({ path: shots + '/settings-paperless.png' });
    await page.goto(B + '/'); await page.waitForSelector('.svc'); await page.screenshot({ path: shots + '/home-paperless.png' });
    await ctx.request.put(B + '/api/settings', { data: { paperless: { token: 'expired' } }, headers: H });
    await page.goto(B + '/#paperless'); await page.waitForSelector('.appframe'); await page.frameLocator('.appframe').locator('.pl-setup').waitFor(); await page.screenshot({ path: shots + '/paperless-setup.png' });
  });
  await t('no page errors', async () => { assert.deepEqual(errs, []); });
} finally { await browser.close(); srv.kill(); fake.close(); }
console.log(`\n${pass} passed, ${failed} failed`); process.exit(failed ? 1 : 0);
