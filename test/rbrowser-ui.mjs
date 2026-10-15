// Desktop Browser window backed by the server's Chromium: the page is drawn, typing an address opens it, clicks work, tabs work.
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import http from 'node:http'; import assert from 'node:assert/strict';
import { spawn } from 'node:child_process'; import { createRequire } from 'node:module'; import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let chromium = null; for (const base of [root + '/', '/opt/npm-tools/node_modules/']) { try { chromium = createRequire(base)('playwright').chromium; break; } catch {} }
const BIN = fs.readdirSync('/opt/pw-browsers').filter((d) => /^chromium-\d+$/.test(d)).map((d) => `/opt/pw-browsers/${d}/chrome-linux/chrome`).find((b) => fs.existsSync(b));
if (!chromium || !BIN) { console.log('skip'); process.exit(0); }
let clicked = 0;
const site = http.createServer((q, r) => { if (q.url === '/hit') { clicked++; r.writeHead(204); return r.end(); } r.writeHead(200, { 'content-type': 'text/html' }); r.end('<title>Remote page</title><body style="margin:0;background:#0a7"><button style="position:absolute;left:50px;top:50px;width:240px;height:90px;font-size:28px" onclick="fetch(\'/hit\')">Hit</button><h1 style="position:absolute;top:200px;left:50px;color:#fff">REMOTE OK</h1>'); });
await new Promise((r) => site.listen(0, '127.0.0.1', r)); const SITE = 'http://127.0.0.1:' + site.address().port;
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-rbu-')), port = 20000 + Math.floor(Math.random() * 20000), B = `http://127.0.0.1:${port}`;
const srv = spawn('node', ['server/index.js'], { cwd: root, stdio: process.env.DBG ? 'inherit' : 'ignore', env: { ...process.env, PORT: String(port), DATA_DIR: data, SUITE_DIR: path.join(root, 'test/fixtures/suite'), APP_PASSWORD: 'pw', SESSION_SECRET: 'x'.repeat(40), PUBLIC_URL: B, CHROMIUM_PATH: BIN, BROWSE_ALLOW_PRIVATE: '1' } });
for (let i = 0; i < 50; i++) { try { if ((await fetch(B + '/healthz')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
let pass = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { console.log('FAIL ' + n + '\n     ' + (e.stack || e.message).split('\n').slice(0, 4).join('\n     ')); process.exitCode = 1; } };
const br = await chromium.launch(); const errs = [];
try {
  const ctx = await br.newContext({ viewport: { width: 1280, height: 800 } }); await ctx.request.post(B + '/auth/password', { data: { password: 'pw' }, headers: { 'x-aos': '1' } });
  const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message)); await p.goto(B + '/#desktop'); await p.waitForSelector('#dkwins', { state: 'attached' }); await p.waitForTimeout(500);
  await t('Browser opens the built-in Chromium window', async () => { await p.click('.dk-pin[title="Browser"]'); await p.waitForSelector('.dk-rc'); await p.waitForSelector('.dk-url'); });
  await t('typing an address draws the page', async () => {
    await p.fill('.dkw .dk-url', SITE + '/'); await p.press('.dkw .dk-url', 'Enter');
    await p.waitForFunction(() => { const c = document.querySelector('.dk-rc'); if (!c || !c.width) return false; const d = c.getContext('2d').getImageData(10, 400, 1, 1).data; return d[1] > 120 && d[0] < 60; }, null, { timeout: 12000 });
    await p.waitForFunction(() => /Remote page/.test(document.querySelector('.dk-bt.on')?.innerText || ''));
  });
  await t('clicking the canvas clicks the page', async () => { const b = await p.locator('.dk-rc').boundingBox(); await p.mouse.click(b.x + 100, b.y + 90); await p.waitForTimeout(800); assert.equal(clicked, 1); });
  await t('a second tab opens and can be closed', async () => { await p.click('[data-dk="rbnew"]'); await p.waitForFunction(() => document.querySelectorAll('.dk-bt').length === 2); await p.click('.dk-bt.on [data-dk="rbclose"]'); await p.waitForFunction(() => document.querySelectorAll('.dk-bt').length === 1); });
  await t('full settings: page colours and zoom reach the streamed browser, cookies can be cleared', async () => {
    await p.click('[data-dk="rbset"]'); await p.waitForSelector('.bsx'); await p.click('.bsnav button:has-text("Appearance")');
    await p.click('.bsg button[data-v="dark"]'); await p.click('[data-bs="zoom"][data-d="10"]'); await p.waitForTimeout(600);
    const pr = await p.evaluate(async () => (await (await fetch('/api/rb/status', { credentials: 'same-origin' })).json()).prefs); assert.equal(pr.dark, 'dark'); assert.equal(pr.zoom, 110);
    await p.click('.bsnav button:has-text("Privacy")'); await p.click('[data-bs="clearck"]'); await p.waitForTimeout(500); await p.click('[data-bs="close"]');
    await p.click('[data-dk="rbset"]'); await p.click('.bsnav button:has-text("Advanced")'); await p.click('[data-bs="reset"]'); await p.waitForTimeout(500);
    assert.equal((await p.evaluate(async () => (await (await fetch('/api/rb/status', { credentials: 'same-origin' })).json()).prefs)).zoom, 100); await p.click('[data-bs="close"]');
  });
  await t('maximised, the window title bar goes and the browser fills the screen; controls stay reachable', async () => {
    await p.click('.dkw-bar [data-dk="wmax"]'); await p.waitForTimeout(500); assert.equal(await p.locator('.dkw .dkw-bar').isVisible(), false); assert.equal(await p.locator('.dkw .dk-wc').isVisible(), true);
    const w = await p.locator('.dkw').boundingBox(); assert.ok(w.width >= (await p.evaluate(() => innerWidth)) - 2, JSON.stringify(w)); await p.click('.dk-wc [data-dk="wmax"]'); await p.waitForTimeout(300); assert.equal(await p.locator('.dkw .dkw-bar').isVisible(), true);
  });
  await t('closing the window ends the stream and nothing threw', async () => { await p.click('.dkw-bar [data-dk="wclose"]'); await p.waitForTimeout(300); assert.deepEqual(errs, []); });
} finally { await br.close(); srv.kill(); site.close(); console.log(pass + ' passed'); setTimeout(() => process.exit(process.exitCode || 0), 200); }
