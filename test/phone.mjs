// Phone app: manifest, share target, offline mode, install card.
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
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-ph-')); const port = 20000 + Math.floor(Math.random() * 20000);
const srv = spawn('node', ['server/index.js'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, PORT: String(port), DATA_DIR: data, SUITE_DIR: path.join(root, 'test/fixtures/suite'), APP_PASSWORD: 'pw', SESSION_SECRET: 'x'.repeat(40), PUBLIC_URL: `http://127.0.0.1:${port}` } });
const B = `http://127.0.0.1:${port}`; for (let i = 0; i < 50; i++) { try { if ((await fetch(B + '/healthz')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
let pass = 0, failed = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { failed++; console.log('FAIL ' + n + '\n     ' + (e.stack || e).toString().split('\n').slice(0, 5).join('\n     ')); } };
const browser = await chromium.launch({ args: ['--no-sandbox'] }); const errs = [];
try {
  const ctx = await browser.newContext({ viewport: { width: 400, height: 800 }, serviceWorkers: 'allow' }); await ctx.request.post(B + '/auth/password', { data: { password: 'pw' }, headers: { 'x-aos': '1' } });
  const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message)); await p.goto(B + '/'); await p.waitForSelector('#avatar');
  await p.evaluate(() => navigator.serviceWorker.ready); await p.reload(); await p.waitForSelector('#avatar'); await p.waitForFunction(() => !!navigator.serviceWorker.controller);
  await t('manifest declares share target, shortcuts and maskable icons', async () => {
    const m = await (await fetch(B + '/manifest.webmanifest')).json(); assert.equal(m.share_target.action, '/share-target'); assert.equal(m.share_target.method, 'POST'); assert.ok(m.share_target.params.files[0].accept.includes('image/*'));
    assert.ok(m.shortcuts.length >= 3); assert.ok(m.icons.some((x) => x.purpose === 'maskable')); for (const x of m.icons) assert.equal((await fetch(B + x.src)).status, 200);
  });
  await t('something shared from the phone opens a chooser; saving a file puts it in Files', async () => {
    await p.evaluate(async () => { const fd = new FormData(); fd.set('title', 'Border queue update'); fd.set('text', 'Chirundu is moving, about 3 hours'); fd.set('url', 'https://example.com/queue'); fd.append('files', new File(['hello pod'], 'POD 4412.txt', { type: 'text/plain' })); await fetch('/share-target', { method: 'POST', body: fd }); await AOSShare.check(); });
    await p.waitForSelector('.shr'); const txt = await p.locator('.shr').innerText(); assert.match(txt, /Border queue update/); assert.match(txt, /POD 4412\.txt/); assert.match(txt, /Make a task/);
    await p.click('[data-sh="files"]'); await p.waitForSelector('.shr', { state: 'detached' });
    const dir = path.join(data, 'fs', 'Captures'); for (let i = 0; i < 30 && !(fs.existsSync(dir) && fs.readdirSync(dir).some((x) => /POD 4412/.test(x))); i++) await p.waitForTimeout(100); const f = fs.readdirSync(dir).find((x) => /POD 4412/.test(x)); assert.ok(f); assert.equal(fs.readFileSync(path.join(dir, f), 'utf8'), 'hello pod');
  });
  await t('the share is cleared after use and a link can become a task', async () => {
    assert.equal(await p.evaluate(() => caches.has('aos-share')), false);
    await p.evaluate(async () => { const fd = new FormData(); fd.set('text', 'Renew road licence for T412'); fd.set('url', 'https://example.com/lic'); await fetch('/share-target', { method: 'POST', body: fd }); await AOSShare.check(); });
    await p.waitForSelector('.shr'); await p.click('[data-sh="task"]'); await p.waitForSelector('.shr', { state: 'detached' }); const dir = path.join(data, 'fs', 'Captures');
    for (let i = 0; i < 30 && !fs.readdirSync(dir).some((x) => /Renew road licence/.test(x)); i++) await p.waitForTimeout(100); assert.ok(fs.readdirSync(dir).some((x) => /Renew road licence/.test(x)));
  });
  await t('without signal the app still opens with the last saved views and says so', async () => {
    await p.goto(B + '/'); await p.waitForSelector('#avatar'); await p.waitForTimeout(600); await ctx.setOffline(true); await p.reload(); await p.waitForSelector('#avatar', { timeout: 15000 });
    assert.ok(await p.locator('#offbar').isVisible()); assert.match(await p.locator('#offbar').innerText(), /offline/i); assert.ok((await p.locator('#view').innerText()).length > 20);
    await ctx.setOffline(false); await p.waitForFunction(() => document.getElementById('offbar').hidden);
  });
  await t('capture queues a note while offline and files it when back online', async () => {
    await p.evaluate(() => { window.__off = true; }); await ctx.setOffline(true); await p.evaluate(() => AOSCapture.addNote('Offline thought about Tunduma')); await p.waitForTimeout(400);
    assert.equal(await p.evaluate(() => JSON.parse(localStorage.getItem('aos.capq') || '[]').length), 1); await ctx.setOffline(false); await p.evaluate(() => window.dispatchEvent(new Event('online')));
    const dir = path.join(data, 'fs', 'Captures'); for (let i = 0; i < 40 && !fs.readdirSync(dir).some((x) => /Offline thought/.test(x)); i++) await p.waitForTimeout(150); assert.ok(fs.readdirSync(dir).some((x) => /Offline thought/.test(x)));
  });
  await t('appearance has the phone app card and the offline switch clears saved copies', async () => {
    await p.evaluate(() => AOS.go('appearance')); await p.waitForSelector('[data-sh="offline"]'); assert.ok(await p.locator('.apc', { hasText: 'Phone app' }).count());
    await p.uncheck('[data-sh="offline"]'); await p.waitForTimeout(500); assert.equal(await p.evaluate(() => caches.has('aos-api-1')), false); await p.check('[data-sh="offline"]');
  });
  await t('signing out removes the saved copies', async () => {
    await p.goto(B + '/'); await p.waitForSelector('#avatar'); await p.waitForTimeout(600); assert.equal(await p.evaluate(() => caches.has('aos-api-1')), true);
    await p.goto(B + '/auth/logout'); await p.waitForTimeout(900); const left = await p.evaluate(async () => { const c = await caches.open('aos-api-1'); const ks = (await c.keys()).map((k) => new URL(k.url).pathname); const sess = await c.match('/api/session'); return { ks, user: sess ? (await sess.json()).user : 'none' }; });
    assert.ok(!left.ks.includes('/api/settings') && !left.ks.includes('/api/profile') && !left.ks.includes('/api/pulse/s/bootstrap'), left.ks.join(',')); assert.ok(left.user === null || left.user === 'none');
  });
  await t('no page errors', async () => assert.deepEqual(errs, []));
} finally { await browser.close(); srv.kill(); }
console.log(`\n${pass} passed, ${failed} failed`); process.exit(failed ? 1 : 0);
