// Desktop Browser: Full mode shows the container at /rb/, and a clear message with Try again when it is down.
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import http from 'node:http'; import assert from 'node:assert/strict'; import { spawn } from 'node:child_process'; import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let chromium = null; for (const base of [root + '/', '/opt/npm-tools/node_modules/']) { try { chromium = createRequire(base)('playwright').chromium; break; } catch {} }
if (!chromium) { console.log('skip  Playwright not installed'); process.exit(0); }
const up = http.createServer((q, r) => { r.writeHead(200, { 'content-type': 'text/html' }); r.end('<title>Kasm</title><h1 id=k>Remote Chrome here</h1>'); });
await new Promise((r) => up.listen(0, '127.0.0.1', r)); const UP = 'http://127.0.0.1:' + up.address().port;
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-rbu-')), port = 20000 + Math.floor(Math.random() * 20000), B = `http://127.0.0.1:${port}`;
const srv = spawn('node', ['server/index.js'], { cwd: root, stdio: 'ignore', env: { ...process.env, PORT: String(port), DATA_DIR: data, SUITE_DIR: path.join(root, 'test/fixtures/suite'), APP_PASSWORD: 'pw', REMOTE_BROWSER_URL: UP, REMOTE_BROWSER_PASSWORD: 'x' } });
for (let i = 0; i < 50; i++) { try { if ((await fetch(B + '/healthz')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
let pass = 0, failed = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { failed++; console.log('FAIL ' + n + '\n     ' + (e.stack || e).toString().split('\n').slice(0, 4).join('\n     ')); } };
const browser = await chromium.launch({ args: ['--no-sandbox'] }); const errs = [];
try {
  const ctx = await browser.newContext({ viewport: { width: 1300, height: 800 } }); await ctx.request.post(B + '/auth/password', { data: { password: 'pw' }, headers: { 'x-aos': '1' } });
  const p = await ctx.newPage(); p.setDefaultTimeout(6000); p.on('pageerror', (e) => errs.push(e.message)); await p.goto(B + '/'); await p.waitForSelector('#top .deskbtn'); await p.click('#top .deskbtn'); await p.waitForSelector('#desk:not([hidden])');
  await t('Browser opens in Full mode and shows the container through /rb/', async () => {
    await p.click('.dk-ic[data-w="browser"]'); const w = p.locator('.dkw[aria-label="Browser"]'); await w.waitFor(); await w.locator('iframe.dk-rbf').waitFor();
    assert.match(await w.locator('iframe.dk-rbf').getAttribute('src'), /^\/rb\//); assert.ok(await w.frameLocator('iframe.dk-rbf').locator('#k').isVisible());
  });
  await t('when the container is down, Full says what is wrong and Simple tabs still works', async () => {
    up.close(); up.closeAllConnections?.(); await p.reload(); await p.waitForSelector('#desk:not([hidden])');
    await p.evaluate(() => { document.querySelectorAll('.dkw .dk-wc [data-dk="wclose"]').forEach((b) => b.click()); });
    await p.click('.dk-ic[data-w="browser"]'); const w = p.locator('.dkw[aria-label="Browser"]'); const m = w.locator('.dk-rbmsg'); await m.waitFor(); assert.match(await m.innerText(), /not reachable/); assert.match(await m.innerText(), /cannot reach|did not answer/);
    await m.locator('[data-dk="bfull"]').click(); await w.locator('.dk-barw .dk-url').waitFor(); assert.equal(await w.locator('.dk-rbmsg').count(), 0);
  });
  await t('no page errors', async () => assert.deepEqual(errs, []));
} finally { await browser.close(); srv.kill(); up.close(); }
console.log(`\n${pass} passed, ${failed} failed`); process.exit(failed ? 1 : 0);
