// Built-in browser: token-gated page and tunnel, then a real page loaded through the service worker and Wisp tunnel.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import net from 'node:net';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let chromium = null; for (const base of [root + '/', '/opt/npm-tools/node_modules/']) { try { chromium = createRequire(base)('playwright').chromium; break; } catch {} }
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-sj-')); const port = 20000 + Math.floor(Math.random() * 20000), B = `http://127.0.0.1:${port}`;
const site = http.createServer((q, r) => { r.writeHead(200, { 'content-type': 'text/html' }); r.end('<!doctype html><title>Fixture Site</title><h1 id="hi">Hello from the fixture</h1><script>document.getElementById("hi").dataset.js="ran"</script>'); });
await new Promise((r) => site.listen(0, '127.0.0.1', r)); const SITE = `http://127.0.0.1:${site.address().port}/`;
const srv = spawn('node', ['server/index.js'], { cwd: root, stdio: 'ignore', env: { ...process.env, PORT: String(port), DATA_DIR: data, SUITE_DIR: path.join(root, 'test/fixtures/suite'), APP_PASSWORD: 'pw', SESSION_SECRET: 'x'.repeat(40), SJ_ALLOW_PRIVATE: '1' } });
for (let i = 0; i < 50; i++) { try { if ((await fetch(B + '/healthz')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
let pass = 0, failed = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { failed++; console.log('FAIL ' + n + '\n     ' + (e.stack || e).toString().split('\n').slice(0, 5).join('\n     ')); } };
const H = { 'x-aos': '1', 'content-type': 'application/json' };
try {
  const lr = await fetch(B + '/auth/password', { method: 'POST', headers: H, body: JSON.stringify({ password: 'pw' }) });
  const cookie = (lr.headers.getSetCookie() || []).map((c) => c.split(';')[0]).join(';');
  await t('the open call needs a signed-in owner and hands back a tokened address', async () => {
    assert.equal((await fetch(B + '/api/sj/open')).status, 401);
    const j = await (await fetch(B + '/api/sj/open', { headers: { cookie } })).json(); assert.equal(j.ok, true); assert.match(j.src, /^\/sj\/\?t=/);
  });
  await t('the page, and the tunnel, refuse a missing or forged token', async () => {
    assert.equal((await fetch(B + '/sj/')).status, 403); assert.equal((await fetch(B + '/sj/?t=abc.def')).status, 403);
    const j = await (await fetch(B + '/api/sj/open', { headers: { cookie } })).json(); assert.equal((await fetch(B + j.src)).status, 200);
    for (const q of ['', 'bad/', 'a.b/']) {
      const code = await new Promise((res) => { const s = net.connect(port, '127.0.0.1', () => s.write('GET /sj/wisp/' + q + ' HTTP/1.1\r\nHost: x\r\nConnection: Upgrade\r\nUpgrade: websocket\r\nSec-WebSocket-Version: 13\r\nSec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n\r\n')); let b = ''; s.on('data', (d) => { b += d; if (b.includes('\r\n')) { res(b.split(' ')[1]); s.destroy(); } }); s.on('close', () => res(b.split(' ')[1] || 'closed')); });
      assert.equal(code, '403');
    }
  });
  await t('the engine files are served and the service worker may take the /sj/ scope', async () => {
    for (const f of ['/sj/scram/scramjet.all.js', '/sj/scram/scramjet.wasm.wasm', '/sj/baremux/worker.js', '/sj/libcurl/index.mjs', '/sj/app.js', '/sj/sw.js']) assert.equal((await fetch(B + f)).status, 200, f);
    assert.equal((await fetch(B + '/sj/sw.js')).headers.get('service-worker-allowed'), '/sj/');
    assert.equal((await fetch(B + '/sj/../api/settings')).status, 401);
  });
  if (!chromium) console.log('skip  Playwright not installed');
  else {
    const br = await chromium.launch({ args: ['--no-sandbox'] }), ctx = await br.newContext(), p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    try {
      const j = await (await fetch(B + '/api/sj/open', { headers: { cookie } })).json();
      await t('a page opens through the tunnel and its scripts run', async () => {
        await p.goto(B + j.src); await p.locator('#url').fill(SITE); await p.keyboard.press('Enter');
        const fr = p.frameLocator('#stage iframe'); await fr.locator('#hi').waitFor({ timeout: 30000 });
        assert.equal(await fr.locator('#hi').textContent(), 'Hello from the fixture'); assert.equal(await fr.locator('#hi').getAttribute('data-js'), 'ran');
        await p.waitForFunction(() => /Fixture Site/.test(document.querySelector('.tab.on span')?.textContent || ''), null, { timeout: 8000 });
      });
      await t('the Desktop Browser window shows the whole browser, full size, and opens a link in it', async () => {
        const c2 = await br.newContext({ viewport: { width: 1440, height: 860 } }); await c2.request.post(B + '/auth/password', { data: { password: 'pw' }, headers: { 'x-aos': '1' } });
        const d = await c2.newPage(); await d.goto(B + '/'); await d.waitForSelector('#rail .nav'); await d.click('#top .deskbtn'); await d.waitForSelector('#desk:not([hidden])');
        await d.click('.dk-ic[data-w="browser"]'); const w = d.locator('.dkw[aria-label="Browser"]'); const f = w.locator('iframe.dk-rbf'); await f.waitFor({ timeout: 8000 });
        assert.match(await f.getAttribute('src'), /^\/sj\/\?t=/); const box = await f.boundingBox(), win = await w.boundingBox(); assert.ok(box.width > win.width * 0.95 && box.height > win.height * 0.7, JSON.stringify([box, win]));
        const inner = d.frameLocator('.dkw[aria-label="Browser"] iframe.dk-rbf'); await inner.locator('#url').fill(SITE); await d.keyboard.press('Enter');
        await inner.frameLocator('#stage iframe').locator('#hi').waitFor({ timeout: 30000 }); await c2.close();
      });
      await t('new tabs and closing work', async () => {
        await p.click('#newtab'); assert.equal(await p.locator('.tab').count(), 2); assert.ok(await p.locator('#home').isVisible());
        await p.locator('.tab b').last().click(); assert.equal(await p.locator('.tab').count(), 1);
      });
      await t('no page errors', async () => { assert.deepEqual(errs, []); });
    } finally { await br.close(); }
  }
} finally { srv.kill(); site.close(); fs.rmSync(data, { recursive: true, force: true }); console.log(`\n${pass} passed, ${failed} failed`); process.exit(failed ? 1 : 0); }
