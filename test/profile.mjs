// Own profile: avatar menu, edit details, upload and remove a picture, persists across reloads.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { PNG } from './png.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let chromium = null; for (const base of [root + '/', '/opt/npm-tools/node_modules/']) { try { chromium = createRequire(base)('playwright').chromium; break; } catch {} }
if (!chromium) { console.log('skip  Playwright not installed'); process.exit(0); }
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-pf-')); const port = 20000 + Math.floor(Math.random() * 20000);
const srv = spawn('node', ['server/index.js'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, PORT: String(port), DATA_DIR: data, SUITE_DIR: path.join(root, 'test/fixtures/suite'), APP_PASSWORD: 'pw', SESSION_SECRET: 'x'.repeat(40), PUBLIC_URL: `http://127.0.0.1:${port}` } });
const B = `http://127.0.0.1:${port}`; for (let i = 0; i < 50; i++) { try { if ((await fetch(B + '/healthz')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
let pass = 0, failed = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { failed++; console.log('FAIL ' + n + '\n     ' + (e.stack || e).toString().split('\n').slice(0, 5).join('\n     ')); } };
const browser = await chromium.launch({ args: ['--no-sandbox'] }); const errs = [];
try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } }); await ctx.request.post(B + '/auth/password', { data: { password: 'pw' }, headers: { 'x-aos': '1' } });
  const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message)); await p.goto(B + '/'); await p.waitForSelector('#avatar');
  await t('profile API needs sign-in and rejects bad input', async () => {
    assert.equal((await fetch(B + '/api/profile')).status, 401);
    const r = await ctx.request.put(B + '/api/profile', { data: { email: 'nope' }, headers: { 'x-aos': '1' } }); assert.equal(r.status(), 400);
    const bad = await ctx.request.post(B + '/api/profile/avatar', { data: Buffer.from('not an image'), headers: { 'x-aos': '1', 'content-type': 'image/png' } }); assert.equal(bad.status(), 400);
  });
  await t('avatar opens an account menu', async () => {
    await p.click('#avatar'); await p.waitForSelector('#pfmenu'); assert.ok(await p.locator('#pfmenu a[href="/auth/logout"]').isVisible()); await p.keyboard.press('Escape'); assert.equal(await p.locator('#pfmenu').count(), 0);
  });
  await t('edit profile: details save and show up', async () => {
    await p.click('#avatar'); await p.click('[data-pf="edit"]'); await p.waitForSelector('.pfm');
    await p.fill('[data-pfin="name"]', 'Anand S'); await p.fill('[data-pfin="title"]', 'GM Operations'); await p.fill('[data-pfin="bio"]', 'Logistics and automation');
    await p.click('[data-pf="save"]'); await p.waitForSelector('.pfm', { state: 'detached' });
    await p.reload(); await p.waitForSelector('#avatar'); assert.equal((await p.locator('#avatar').innerText()).trim(), 'A'); await p.click('#avatar'); assert.match(await p.locator('.pfhead').innerText(), /Anand S[\s\S]*GM Operations/);
  });
  await t('upload a picture: it replaces the initial, survives reload, can be removed', async () => {
    await p.keyboard.press('Escape'); await p.click('#avatar'); await p.click('[data-pf="edit"]'); await p.waitForSelector('.pfm');
    const png = path.join(data, 'me.png'); fs.writeFileSync(png, PNG);
    const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('.pfbig')]); await fc.setFiles(png);
    await p.waitForSelector('#avatar img'); const src = await p.locator('#avatar img').getAttribute('src'); assert.match(src, /\/api\/profile\/avatar/);
    const r = await ctx.request.get(B + src); assert.equal(r.status(), 200); assert.equal(r.headers()['content-type'], 'image/jpeg');
    await p.reload(); await p.waitForSelector('#avatar img'); assert.ok(await p.evaluate(() => { const i = document.querySelector('#avatar img'); return i.complete && i.naturalWidth > 0; }));
    await p.click('#avatar'); await p.click('[data-pf="edit"]'); await p.click('[data-pf="rmpic"]'); await p.waitForFunction(() => !document.querySelector('#avatar img')); assert.equal((await ctx.request.get(B + '/api/profile/avatar')).status(), 404);
  });
  await t('no page errors', async () => assert.deepEqual(errs, []));
} finally { await browser.close(); srv.kill(); }
console.log(`\n${pass} passed, ${failed} failed`); process.exit(failed ? 1 : 0);
