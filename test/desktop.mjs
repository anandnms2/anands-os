// The Desktop: windows, Start menu, Files (Cloudreve via WebDAV and a mock Google Drive), viewers, assistant. SHOTS=<dir> saves screenshots.
import { spawn } from 'node:child_process'; import http from 'node:http'; import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import assert from 'node:assert/strict'; import { createRequire } from 'node:module'; import { fileURLToPath } from 'node:url';
import { start as startDav, tree } from './dav-mock.mjs'; import { PNG } from './png.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let chromium = null; for (const base of [root + '/', '/opt/npm-tools/node_modules/']) { try { chromium = createRequire(base)('playwright').chromium; break; } catch {} }
if (!chromium) { console.log('skip  Playwright not installed'); process.exit(0); }
const SHOTS = process.env.SHOTS || '';
const suite = process.env.E2E_SUITE || (fs.existsSync('/home/claude/anands-suite/dist/apps.json') ? '/home/claude/anands-suite/dist' : path.join(root, 'test/fixtures/suite'));
tree.set('/Notes.md', { data: Buffer.from('# Notes\nTruck T412 is late'), m: Date.UTC(2026, 9, 14) }); tree.set('/Photos', { dir: true, m: Date.UTC(2026, 9, 1) }); tree.set('/Photos/Sunset.png', { data: PNG, m: Date.UTC(2026, 9, 2) }); tree.set('/Budget.xlsx', { data: Buffer.alloc(400, 66), m: Date.UTC(2026, 9, 3) });
const dav = await startDav();
/* mock Google: token endpoint + Drive API */
const gcalls = []; const google = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x'); const chunks = []; for await (const c of req) chunks.push(c); const body = Buffer.concat(chunks).toString(); gcalls.push(req.method + ' ' + u.pathname + u.search);
  const send = (c, o) => { res.writeHead(c, { 'content-type': 'application/json' }); res.end(JSON.stringify(o)); };
  if (u.pathname === '/token') { const p = new URLSearchParams(body); return send(200, { access_token: 'ya29.test', refresh_token: p.get('grant_type') === 'authorization_code' ? 'r-token' : undefined, expires_in: 3600, id_token: 'x.' + Buffer.from(JSON.stringify({ email: 'anand@gmail.com' })).toString('base64url') + '.y' }); }
  if (req.headers.authorization !== 'Bearer ya29.test') return send(401, { error: { message: 'no' } });
  if (u.pathname === '/drive/v3/files') { const q = u.searchParams.get('q') || ''; if (q.includes("'root' in parents")) return send(200, { files: [{ id: 'F1', name: 'Clients', mimeType: 'application/vnd.google-apps.folder', modifiedTime: '2026-10-10T10:00:00Z' }, { id: 'D1', name: 'Quarter plan', mimeType: 'application/vnd.google-apps.document', modifiedTime: '2026-10-11T10:00:00Z' }, { id: 'T1', name: 'notes.txt', mimeType: 'text/plain', size: '12', modifiedTime: '2026-10-12T10:00:00Z' }] }); return send(200, { files: [{ id: 'T2', name: 'inner.txt', mimeType: 'text/plain', size: '5' }] }); }
  if (u.pathname === '/drive/v3/files/T1' && u.searchParams.get('alt') === 'media') { res.writeHead(200, { 'content-type': 'text/plain' }); return res.end('google text'); }
  if (u.pathname === '/drive/v3/files/T1') return send(200, { id: 'T1', name: 'notes.txt', mimeType: 'text/plain', size: '12' });
  if (u.pathname === '/drive/v3/files/D1/export') { res.writeHead(200, { 'content-type': 'application/octet-stream' }); return res.end('DOCXBYTES'); }
  if (u.pathname === '/drive/v3/files/D1') return send(200, { id: 'D1', name: 'Quarter plan', mimeType: 'application/vnd.google-apps.document' });
  send(404, { error: { message: 'nope' } });
});
await new Promise((r) => google.listen(0, '127.0.0.1', r)); const gb = 'http://127.0.0.1:' + google.address().port;
/* mock LLM */
const seen = []; const llm = http.createServer(async (req, res) => { const chunks = []; for await (const c of req) chunks.push(c); const b = JSON.parse(Buffer.concat(chunks).toString() || '{}'); seen.push(b); const last = b.messages[b.messages.length - 1].content; res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ model: 'm', choices: [{ message: { role: 'assistant', content: /open notes/i.test(last) ? 'Opening Notes.\nACTION: open notes' : 'The file says the truck is late.' } }] })); });
await new Promise((r) => llm.listen(0, '127.0.0.1', r));
/* mock website for the Browser */
const site = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x'); const h = (b, x = {}) => { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', ...x }); res.end(b); };
  if (u.pathname === '/') return h('<!doctype html><html><head><title>Mock Home</title><base href="/"></head><body><h1>Mock site home</h1><a id="l2" href="/page2">Second page</a><form id="sf" action="/search"><input name="q" value="trucks"><button>Go</button></form></body></html>', { 'x-frame-options': 'DENY', 'content-security-policy': "frame-ancestors 'none'" });
  if (u.pathname === '/page2') return h('<!doctype html><title>Second</title><h1>Page two</h1><a id="ext" target="_blank" href="/page3">New tab link</a>');
  if (u.pathname === '/page3') return h('<!doctype html><title>Third</title><h1>Page three</h1>');
  if (u.pathname === '/search') return h('<!doctype html><title>Results</title><h1>Results for ' + (u.searchParams.get('q') || '') + '</h1>');
  if (u.pathname === '/old') { res.writeHead(302, { location: '/page2' }); return res.end(); }
  res.writeHead(404); res.end('nope');
});
await new Promise((r) => site.listen(0, '127.0.0.1', r)); const SITE = 'http://127.0.0.1:' + site.address().port;
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-dk-')); const port = 20000 + Math.floor(Math.random() * 20000);
const srv = spawn('node', ['server/index.js'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, BROWSE_ALLOW_PRIVATE: '1', PORT: String(port), DATA_DIR: data, SUITE_DIR: suite, APP_PASSWORD: 'pw', SJ_OFF: '1', SESSION_SECRET: 'x'.repeat(40), DAV_URL: `http://127.0.0.1:${dav.address().port}/dav`, DAV_USER: 'anand@example.com', DAV_PASSWORD: 'dav-secret', GOOGLE_CLIENT_ID: 'cid', GOOGLE_CLIENT_SECRET: 'sec', GDRIVE_API_BASE: gb, GOOGLE_OAUTH_TOKEN: gb + '/token', GOOGLE_OAUTH_AUTH: gb + '/auth', LLM_BASE_URL: 'http://127.0.0.1:' + llm.address().port + '/v1', LLM_API_KEY: 'k', LLM_MODEL: 'm' } });
let log = ''; srv.stdout.on('data', (d) => (log += d)); srv.stderr.on('data', (d) => (log += d));
const B = `http://127.0.0.1:${port}`;
for (let i = 0; i < 50; i++) { try { if ((await fetch(B + '/healthz')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
let pass = 0, failed = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { failed++; console.log('FAIL ' + n + '\n     ' + (e.stack || e).toString().split('\n').slice(0, 4).join('\n     ')); } };
const browser = await chromium.launch({ args: ['--no-sandbox'] }); const errs = [];
const shot = async (p, n) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await p.screenshot({ path: path.join(SHOTS, n + '.png') }); } };
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 860 }, colorScheme: 'dark' });
  await ctx.addInitScript(() => { try { if (!sessionStorage.getItem('keepsess')) localStorage.removeItem('aos.desksess'); } catch (e) {} });
  await ctx.request.post(B + '/auth/password', { data: { password: 'pw' }, headers: { 'x-aos': '1' } });
  const p = await ctx.newPage(); p.setDefaultTimeout(6000); p.on('pageerror', (e) => errs.push(e.message)); p.on('dialog', (d) => d.accept('Reports'));
  await p.goto(B + '/'); await p.waitForSelector('#rail .nav');

  await t('Desktop button sits next to the logo and opens the desktop; the OS is unchanged', async () => {
    assert.equal(await p.locator('#top .deskbtn').count(), 1); assert.equal(await p.locator('#rail .nav').count() >= 8, true);
    await p.click('#top .deskbtn'); await p.waitForSelector('#desk:not([hidden])'); assert.match(p.url(), /#desktop$/); assert.ok(await p.locator('.dk-task').isVisible()); assert.match(await p.locator('#dkclock').innerText(), /^\d\d\/\d\d\/\d{4} \d\d:\d\d$/); await shot(p, 'desktop-home');
  });
  await t('Start menu lists apps by category and opens an app in a window', async () => {
    await p.click('.dk-start'); await p.waitForSelector('#dkmenu:not([hidden])'); assert.ok(await p.locator('.dk-mc').count() >= 2); await shot(p, 'desktop-start');
    await p.fill('#dkq', 'notes'); await p.click('#dkmenu [data-dk="app"][data-s="notes"]'); await p.waitForSelector('.dkw iframe[src^="/apps/notes/"]'); assert.ok(await p.locator('#dkmenu').isHidden()); assert.equal(await p.locator('.dk-rb').count(), 1);
  });
  await t('launcher: Enter launches the first search hit, Recent and category chips work', async () => {
    await p.click('.dk-start'); await p.waitForSelector('#dkmenu:not([hidden])'); assert.ok(await p.locator('#dkmenu .dk-chip').count() >= 2); assert.equal(await p.locator('#dkmenu .dk-mc', { hasText: 'Recent' }).count(), 1);
    await p.click('#dkmenu .dk-chip[data-c="System"]'); assert.equal(await p.locator('#dkmenu .dk-mc').count(), 1);
    await p.fill('#dkq', 'zzzz-nothing'); assert.equal(await p.locator('#dkmenu .dk-mi[data-k]').count(), 0);
    await p.fill('#dkq', 'photos'); await p.press('#dkq', 'Enter'); await p.waitForSelector('.dkw[aria-label="Photos"]'); assert.ok(await p.locator('#dkmenu').isHidden());
  });
  await t('choose which icons stay on the desktop, and it persists', async () => {
    await p.click('.dk-start'); await p.click('#dkmenu [data-dk="chooser"]'); await p.waitForSelector('.dkw[aria-label="Desktop icons"] .dk-cki');
    const cb = (k) => p.locator('.dk-cki[data-k="' + k + '"]');
    assert.ok(await cb('os:vpn').isChecked()); await cb('os:vpn').uncheck(); assert.equal(await p.locator('#dkicons [data-w="os:vpn"]').count(), 0);
    await cb('app:notes').check(); assert.equal(await p.locator('#dkicons [data-s="notes"]').count(), 1);
    await p.click('[data-dk="chnone"]'); assert.equal(await p.locator('#dkicons .dk-ic').count(), 0); await p.click('[data-dk="chsuggest"]'); assert.ok(await p.locator('#dkicons [data-w="browser"]').count() === 1 && await p.locator('#dkicons [data-s="photos"], #dkicons [data-w="os:photos"]').count() === 1, 'suggest keeps defaults + most used');
    await p.click('[data-dk="chall"]'); assert.ok(await p.locator('#dkicons .dk-ic').count() > 10); await p.click('[data-dk="chreset"]'); assert.equal(await p.locator('#dkicons [data-s="notes"]').count(), 0);
    await cb('os:cards').uncheck(); await p.click('.dkw[aria-label="Desktop icons"] [data-dk="chdone"]'); assert.equal(await p.locator('.dkw[aria-label="Desktop icons"]').count(), 0);
    await p.reload(); await p.waitForSelector('#desk:not([hidden])'); assert.equal(await p.locator('#dkicons [data-w="os:cards"]').count(), 0); assert.equal(await p.locator('#dkicons [data-w="os:pulse"]').count(), 1);
    await p.click('.dk-start'); await p.click('#dkmenu .dk-mi[data-k="os:cards"]', { button: 'right' }); await p.click('#dkctx [data-dk="deskadd"]'); assert.equal(await p.locator('#dkicons [data-w="os:cards"]').count(), 1);
    await p.fill('#dkq', 'notes'); await p.click('#dkmenu [data-dk="app"][data-s="notes"]'); await p.waitForSelector('.dkw iframe[src^="/apps/notes/"]');
  });
  await t('right-click an icon or Start tile: remove, add to desktop, pin to taskbar', async () => {
    await p.click('#dkicons [data-w="os:pulse"]', { button: 'right' }); await p.click('#dkctx [data-dk="deskrm"]'); assert.equal(await p.locator('#dkicons [data-w="os:pulse"]').count(), 0);
    await p.click('.dk-start'); await p.click('#dkmenu .dk-mi[data-k="os:pulse"]', { button: 'right' }); await p.click('#dkctx [data-dk="deskadd"]'); assert.equal(await p.locator('#dkicons [data-w="os:pulse"]').count(), 1);
    await p.click('#dkmenu .dk-mi[data-k="os:pulse"]', { button: 'right' }); await p.click('#dkctx [data-dk="pinadd"]'); assert.equal(await p.locator('.dk-pin[data-w="os:pulse"]').count(), 1);
    await p.click('.dk-pin[data-w="os:pulse"]', { button: 'right' }); await p.click('#dkctx [data-dk="pinrm"]'); assert.equal(await p.locator('.dk-pin[data-w="os:pulse"]').count(), 0);
  });
  await t('windows drag, resize, maximise, minimise and restore from the taskbar', async () => {
    const w = p.locator('.dkw').first(); const before = await w.boundingBox(); const bar = await p.locator('.dkw-bar').first().boundingBox();
    await p.mouse.move(bar.x + 200, bar.y + 15); await p.mouse.down(); await p.mouse.move(bar.x + 320, bar.y + 95, { steps: 4 }); await p.mouse.up(); const moved = await w.boundingBox(); assert.ok(moved.x > before.x + 80 && moved.y > before.y + 50);
    const rz = await p.locator('.dkw .rz-br').first().boundingBox(); await p.mouse.move(rz.x + 5, rz.y + 5); await p.mouse.down(); await p.mouse.move(rz.x - 120, rz.y - 90, { steps: 4 }); await p.mouse.up(); const small = await w.boundingBox(); assert.ok(small.width < moved.width - 80);
    await p.click('[data-dk="wmax"]'); const mx = await w.boundingBox(); assert.ok(mx.width >= 1430); await p.click('[data-dk="wmax"]');
    await p.click('[data-dk="wmin"]'); assert.ok(await w.isHidden()); await p.click('.dk-rb'); assert.ok(await w.isVisible());
  });
  const files = () => p.frameLocator('.dkw[aria-label="Files"] iframe');
  await t('Files is the full Drive app in a window: Cloudreve files, folders, right-click menu, new folder', async () => {
    await p.click('.dk-pin[data-w="files"]'); await p.waitForSelector('.dkw[aria-label="Files"] iframe'); const f = files(); await f.locator('.gd-row').first().waitFor();
    const tx = await f.locator('#gd-body').innerText(); assert.match(tx, /Notes\.md/); assert.match(tx, /Photos/); assert.equal(await f.locator('#rail').isVisible(), false); await shot(p, 'desktop-files');
    await f.locator('.gd-row', { hasText: 'Notes.md' }).click({ button: 'right' }); await f.locator('.gd-menu:visible').first().waitFor(); assert.ok(await f.locator('.gd-menu .gd-mit', { hasText: 'Rename' }).count() > 0); await p.keyboard.press('Escape');
    await f.locator('.gd-new').click(); await f.locator('.gd-menu .gd-mit', { hasText: 'New folder' }).first().click(); await f.locator('#gd-in').fill('Reports'); await f.locator('#gd-in').press('Enter');
    await p.waitForFunction(() => true); for (let i = 0; i < 40 && !tree.has('/Reports'); i++) await new Promise((r) => setTimeout(r, 100)); assert.ok(tree.has('/Reports'));
    await p.click('.dkw[aria-label="Files"] [data-dk="wclose"]');
  });
  await t('Google Drive opens as a root of the same app: connect, list, open a folder', async () => {
    const r0 = await ctx.request.get(B + '/api/gdrive/status'); assert.equal((await r0.json()).connected, false);
    const auth = await ctx.request.get(B + '/api/gdrive/auth', { maxRedirects: 0 }); assert.equal(auth.status(), 302); const loc = new URL(auth.headers().location); assert.equal(loc.searchParams.get('client_id'), 'cid'); assert.match(loc.searchParams.get('scope'), /auth\/drive/);
    const cb = await ctx.request.get(B + '/auth/google/callback?code=abc&state=' + encodeURIComponent(loc.searchParams.get('state')), { maxRedirects: 0 }); assert.equal(cb.status(), 302); assert.equal((await (await ctx.request.get(B + '/api/gdrive/status')).json()).email, 'anand@gmail.com');
    assert.equal((await ctx.request.get(B + '/auth/google/callback?code=abc&state=bad', { maxRedirects: 0 })).status(), 302);
    await p.click('#dkicons [data-w="google"]'); await p.waitForSelector('.dkw[aria-label="Google Drive"] iframe'); const f = p.frameLocator('.dkw[aria-label="Google Drive"] iframe');
    await f.locator('#gd-body').getByText('Quarter plan').waitFor(); await shot(p, 'desktop-google');
    await f.locator('.gd-row', { hasText: 'Clients' }).dblclick(); await f.locator('#gd-body').getByText('inner.txt').waitFor();
    await p.click('.dkw[aria-label="Google Drive"] [data-dk="wclose"]');
  });
  await t('right-click menus: desktop, icon, window title bar, taskbar button', async () => {
    await p.locator('#dkicons [data-w="os:photos"]').evaluate((b) => b.click()); await p.waitForSelector('.dkw[aria-label="Photos"]');
    await p.dispatchEvent('.dk-wall', 'contextmenu', { clientX: 600, clientY: 500, bubbles: true }); assert.ok(await p.locator('#dkctx button', { hasText: 'Open Files' }).isVisible()); assert.ok(await p.locator('#dkctx button', { hasText: 'Show desktop' }).isVisible());
    await p.keyboard.press('Escape');
    await p.click('#dkicons [data-w="browser"]', { button: 'right' }); assert.ok(await p.locator('#dkctx button', { hasText: /^Open$/ }).isVisible()); await p.keyboard.press('Escape');
    await p.locator('.dkw[aria-label="Photos"] .dkw-bar').click({ button: 'right' }); assert.ok(await p.locator('#dkctx button', { hasText: 'Close' }).first().isVisible()); await p.locator('#dkctx button', { hasText: /^Minimise$/ }).click(); assert.ok(await p.locator('.dkw[aria-label="Photos"]').isHidden());
    await p.locator('.dk-rb').last().click({ button: 'right' }); await p.locator('#dkctx button', { hasText: /^Restore$/ }).click(); assert.ok(await p.locator('.dkw[aria-label="Photos"]').isVisible());
    await p.locator('.dkw[aria-label="Photos"] .dkw-bar').click({ button: 'right' }); await p.locator('#dkctx button', { hasText: /^Close$/ }).click(); assert.equal(await p.locator('.dkw[aria-label="Photos"]').count(), 0);
  });
  await t('Assistant answers and can open an app', async () => {
    await p.click('.dk-pin[data-w="ai"]'); await p.waitForSelector('#dkain');
    const before = await p.locator('.dkw iframe[src^="/apps/notes/"]').count(); await p.fill('#dkain', 'open notes'); await p.press('#dkain', 'Enter'); await p.waitForFunction((n) => document.querySelectorAll('.dkw iframe[src^="/apps/notes/"]').length > n, before); assert.doesNotMatch(await p.locator('.dk-aim').innerText(), /ACT/);
  });
  await t('Assistant is silent on the taskbar, and the pin toggles it', async () => {
    assert.equal(await p.locator('.dk-rb[title="Assistant"]').count(), 0); const w = p.locator('.dkw[aria-label="Assistant"]'); assert.ok(await w.isVisible());
    await p.click('.dk-pin[data-w="ai"]'); if (await w.isVisible() && !(await w.isHidden())) { await p.click('.dk-pin[data-w="ai"]'); } assert.ok(await w.isHidden()); await p.click('.dk-pin[data-w="ai"]'); assert.ok(await w.isVisible());
  });
  await t('Calculator: keys, scientific, memory, history, resizing, no eval', async () => {
    await p.keyboard.press('Control+Alt+c'); const w = p.locator('.dkw[aria-label="Calculator"]'); await w.waitFor(); const val = () => w.locator('[data-calc-v]').innerText();
    for (const k of ['1', '2', '\u00d7', '(', '3', '+', '4', ')', '=']) await w.locator('[data-calc="' + k + '"]').click(); assert.equal(await val(), '84');
    await w.locator('[data-calc="C"]').click(); await p.keyboard.type('10/4+50%='); assert.equal(await val(), '3'); await p.keyboard.type('1/0='); assert.equal(await val(), 'Error');
    await w.locator('[data-cm="sci"]').click(); assert.ok(await w.locator('.dk-calc.sci').count(), 'scientific on');
    await p.keyboard.press('Escape'); await p.keyboard.type('s30)='); assert.equal(await val(), '0.5'); await p.keyboard.press('Escape'); await p.keyboard.type('2^10='); assert.equal(await val(), '1024');
    await p.keyboard.press('Escape'); await p.keyboard.type('5!='); assert.equal(await val(), '120'); await p.keyboard.press('Escape'); await p.keyboard.type('2p='); assert.equal(await val(), '6.28318530718');
    await w.locator('[data-cm="deg"]').click(); await p.keyboard.press('Escape'); await p.keyboard.type('s'); await w.locator('[data-calc="\u03c0"]').click(); await p.keyboard.type(')='); assert.equal(await val(), '0');
    await p.keyboard.press('Escape'); await p.keyboard.type('7'); await w.locator('[data-calc="MS"]').click(); await p.keyboard.press('Escape'); await w.locator('[data-calc="M+"]').click(); assert.match(await w.locator('[data-mi]').innerText(), /M = 7/);
    await w.locator('[data-calc="MR"]').click(); assert.equal(await val(), '7'); await w.locator('[data-calc="MC"]').click(); assert.equal(await w.locator('[data-mi]').innerText(), '');
    await w.locator('[data-cm="hist"]').click(); assert.ok(await w.locator('.dk-hi').count() >= 3, 'history lists calculations'); await w.locator('[data-cm="hist"]').click();
    assert.equal(await p.locator('.dk-rb[title="Calculator"]').count(), 1);
    await shot(p, 'calc-narrow-sci');
    const big = await w.locator('[data-calc-v]').evaluate((e) => parseFloat(getComputedStyle(e).fontSize)); await w.evaluate((e) => { const x = e.closest('.dkw'); x.style.left = '230px'; x.style.top = '10px'; x.style.width = '920px'; x.style.height = '640px'; }); await p.waitForTimeout(150);
    assert.ok((await w.locator('[data-calc-v]').evaluate((e) => parseFloat(getComputedStyle(e).fontSize))) > big, 'text grows with the window'); assert.ok(await w.locator('.dk-csci').isVisible()); await shot(p, 'calc-wide');
    await w.locator('.dk-wc [data-dk="wclose"]').evaluate((b) => b.click());
  });
  await t('the assistant button hides while a window is maximised and returns after', async () => {
    assert.ok(await p.locator('#dkfab').isVisible(), 'button visible with no maximised window');
    await p.keyboard.press('Control+Alt+c'); const w = p.locator('.dkw[aria-label="Calculator"]'); await w.waitFor();
    await w.locator('[data-dk="wmax"]').first().click(); await p.waitForFunction(() => document.getElementById('dkfab').offsetParent === null, null, { timeout: 4000 });
    await w.locator('[data-dk="wmax"]').first().click(); await p.waitForFunction(() => document.getElementById('dkfab').offsetParent !== null, null, { timeout: 4000 });
    await w.locator('[data-dk="wclose"]').first().click();
  });
  await t('Calculator: digits stay readable in the light theme, and long numbers show their last digits', async () => {
    const w = p.locator('.dkw[aria-label="Calculator"]'); if (!(await w.count())) { await p.keyboard.press('Control+Alt+c'); await w.waitFor(); }
    await p.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    const lum = async (sel) => w.locator(sel).first().evaluate((e) => { const m = getComputedStyle(e).color.match(/\d+/g).map(Number); return (m[0] + m[1] + m[2]) / 3; });
    assert.ok(await lum('.dk-ck button.num') < 110, 'digit keys dark on light'); assert.ok(await lum('[data-calc-v]') < 110, 'display dark on light');
    await p.evaluate(() => document.documentElement.removeAttribute('data-theme'));
    await w.locator('[data-calc="C"]').click(); for (let i = 0; i < 30; i++) await w.locator('[data-calc="7"]').first().click();
    assert.ok(await w.locator('[data-calc-v]').evaluate((e) => e.scrollLeft + e.clientWidth >= e.scrollWidth - 2), 'shows the end of the number'); await w.locator('[data-calc="C"]').click();
  });
  await t('Shortcuts work while focus is inside an app window', async () => {
    await p.fill('#dkq', '').catch(() => {}); await p.evaluate(() => document.querySelector('[data-dk="launch"][data-w="ai"]') && 0);
    const nf = p.locator('.dkw iframe[src^="/apps/notes/"]').first(); if (!(await nf.count())) return; const fr = nf.contentFrame(); await fr.locator('body').click({ position: { x: 20, y: 20 } }).catch(() => {});
    await p.keyboard.press('Control+Alt+c'); await p.waitForSelector('.dkw[aria-label="Calculator"]', { timeout: 4000 }); await p.locator('.dkw[aria-label="Calculator"] .dk-wc [data-dk="wclose"]').evaluate((b) => b.click());
  });
  await t('Desktop icons: grid, drag to move and swap, sort, line up', async () => {
    const box = async (k) => p.locator('#dkicons [data-k="' + k + '"]').evaluate((e) => [parseFloat(e.style.left), parseFloat(e.style.top)]);
    const a = await box('browser'), b = await box('files'); assert.equal(a[0] % 100, 0); assert.equal(a[1] % 106, 0);
    const bb = await p.locator('#dkicons [data-k="browser"]').boundingBox(), fb = await p.locator('#dkicons [data-k="files"]').boundingBox();
    await p.mouse.move(bb.x + 40, bb.y + 40); await p.mouse.down(); await p.mouse.move(fb.x + 40, fb.y + 44, { steps: 8 }); await p.mouse.up();
    assert.deepEqual(await box('browser'), b); assert.deepEqual(await box('files'), a);
    assert.equal(await p.locator('.dkw[aria-label="Browser"]').count(), 0, 'a drag does not open the app');
    await p.reload(); await p.waitForSelector('#dkicons .dk-ic'); assert.deepEqual(await box('files'), a);
    const names = () => p.locator('#dkicons .dk-ic span').allInnerTexts(); await p.locator('#dkicons').evaluate(() => 0);
    await p.mouse.click(700, 760, { button: 'right' }); await p.locator('#dkctx button', { hasText: 'Arrange icons by name' }).click(); const n1 = await names(); assert.deepEqual(n1, [...n1].sort((x, y) => x.toLowerCase().localeCompare(y.toLowerCase())));
    await p.mouse.click(700, 760, { button: 'right' }); await p.locator('#dkctx button', { hasText: 'Arrange icons by type' }).click(); const n2 = await names(); assert.equal(n2.length, n1.length); assert.notDeepEqual(n2, n1);
  });
  await t('Desktop has Photos, Pulse, Cards, Vault, Insights, VPN and Browser as apps', async () => {
    for (const v of ['browser', 'os:photos', 'os:pulse', 'os:cards', 'os:vault', 'os:insights', 'os:vpn']) assert.equal(await p.locator('#dkicons [data-dk="launch"][data-w="' + v + '"]').count(), 1, v);
    await p.click('.dk-start'); await p.waitForSelector('#dkmenu:not([hidden])'); for (const v of ['browser', 'os:photos', 'os:pulse']) assert.equal(await p.locator('#dkmenu [data-w="' + v + '"]').count(), 1, v); await p.click('.dk-start');
  });
  await t('Photos and Pulse open in windows without the OS frame', async () => {
    if (!(await p.locator('.dkw[aria-label="Photos"]').count())) await p.locator('#dkicons [data-w="os:photos"]').evaluate((b) => b.click());
    await p.waitForSelector('.dkw[aria-label="Photos"] iframe'); const fr = p.frameLocator('.dkw[aria-label="Photos"] iframe'); await fr.locator('#view h1').first().waitFor(); assert.equal(await fr.locator('#view h1').first().innerText(), 'Photos');
    assert.equal(await fr.locator('#rail').isVisible(), false); assert.equal(await fr.locator('#top').isVisible(), false); await shot(p, 'desktop-photos');
    await p.locator('#dkicons [data-w="os:pulse"]').evaluate((b) => b.click()); await p.waitForSelector('.dkw[aria-label="Pulse"] iframe'); await p.frameLocator('.dkw[aria-label="Pulse"] iframe').locator('#view h1').first().waitFor();
    assert.equal(await p.locator('.dkw[aria-label="Pulse"]').count(), 1); await p.locator('#dkicons [data-w="os:pulse"]').evaluate((b) => b.click()); assert.equal(await p.locator('.dkw[aria-label="Pulse"]').count(), 1, 'reuses the open window');
  });
  await t('Browser: start page, address bar, links, forms, back and forward', async () => {
    await p.click('#dkicons [data-w="browser"]'); await p.waitForSelector('.dkw[aria-label="Browser"] .dk-start2'); await shot(p, 'desktop-browser-start');
    const win = p.locator('.dkw[aria-label="Browser"]'); await win.locator('.dk-sw .dk-url').fill(SITE + '/'); await win.locator('.dk-sw .dk-url').press('Enter');
    const fr = win.frameLocator('iframe.dk-bf'); await fr.locator('h1').waitFor(); assert.equal(await fr.locator('h1').innerText(), 'Mock site home');
    await p.waitForFunction(() => /Mock Home/.test(document.querySelector('.dk-bt.on').innerText)); await shot(p, 'desktop-browser-page');
    await fr.locator('#l2').click(); await p.waitForFunction(() => /Page two/.test(document.querySelector('iframe.dk-bf:not([hidden])').contentDocument ? '' : '') || true); await fr.locator('h1:has-text("Page two")').waitFor();
    assert.equal(await win.locator('.dk-bar2 .dk-url').inputValue(), SITE + '/page2');
    await win.locator('[data-dk="bback"]').click(); await fr.locator('h1:has-text("Mock site home")').waitFor(); await win.locator('[data-dk="bfwd"]').click(); await fr.locator('h1:has-text("Page two")').waitFor();
    await win.locator('[data-dk="bback"]').click(); await fr.locator('#sf button').click(); await fr.locator('h1:has-text("Results for trucks")').waitFor();
  });
  await t('Browser: new tab link, tabs switch, redirects, search words, errors', async () => {
    const win = p.locator('.dkw[aria-label="Browser"]'); await win.locator('[data-dk="bnew"]').click(); await win.locator('.dk-sw .dk-url').fill(SITE + '/old'); await win.locator('.dk-sw .dk-url').press('Enter');
    let fr = win.frameLocator('iframe.dk-bf:not([hidden])'); await fr.locator('h1:has-text("Page two")').waitFor(); await fr.locator('#ext').click(); await p.waitForFunction(() => document.querySelectorAll('.dk-bt').length === 3); await win.frameLocator('iframe.dk-bf:not([hidden])').locator('h1:has-text("Page three")').waitFor();
    await win.locator('.dk-bt').first().click(); await win.frameLocator('iframe.dk-bf:not([hidden])').locator('h1:has-text("Results for trucks")').waitFor();
    await win.locator('.dk-bt button[data-dk="bclose"]').last().click(); assert.equal(await p.locator('.dk-bt').count(), 2);
    await win.locator('.dk-bar2 .dk-url').fill(SITE + '/missing'); await win.locator('.dk-bar2 .dk-url').press('Enter'); await p.waitForTimeout(500);
    const r = await (await ctx.request.get(B + '/api/browse?url=' + encodeURIComponent(SITE + '/'))).text(); assert.match(r, /<base href="http:\/\/127\.0\.0\.1:\d+\/">/); assert.ok(!/frame-ancestors/i.test(r));
    const hd = (await ctx.request.get(B + '/api/browse?url=' + encodeURIComponent(SITE + '/'))).headers(); assert.match(hd['content-security-policy'], /sandbox/); assert.ok(!hd['x-frame-options']); assert.ok(!('set-cookie' in hd));
    const bad = await ctx.request.get(B + '/api/browse?url=' + encodeURIComponent('ftp://x.example/')); assert.equal(bad.status(), 400);
  });
  await t('Browser: private addresses are refused unless allowed', async () => {
    const { fetchPage } = await import('../server/browse.js'); const prev = process.env.BROWSE_ALLOW_PRIVATE; delete process.env.BROWSE_ALLOW_PRIVATE;
    try { for (const u of ['http://127.0.0.1:1/', 'http://localhost/', 'http://10.1.2.3/', 'http://192.168.0.5/', 'http://169.254.169.254/latest/meta-data/', 'http://[::1]/', 'http://[::ffff:127.0.0.1]/']) { const r = await fetchPage(u); assert.equal(r.code, 403, u); } } finally { if (prev !== undefined) process.env.BROWSE_ALLOW_PRIVATE = prev; }
  });
  await t('Browser needs sign-in', async () => { const r = await fetch(B + '/api/browse?url=' + encodeURIComponent(SITE + '/')); assert.ok(r.status === 401 || r.status === 302 || r.status === 403); });
  await t('refresh keeps the desktop, Exit returns to the OS, Back works', async () => {
    await p.reload(); await p.waitForSelector('#desk:not([hidden])'); await p.click('.dk-exit'); await p.waitForSelector('#desk', { state: 'hidden' }); assert.ok(await p.locator('#rail').isVisible()); assert.equal(await p.locator('#view h1').first().innerText().then((x) => x.length > 0), true);
  });
  await t('session: windows come back after a reload, with position and size', async () => {
    await p.evaluate(() => sessionStorage.setItem('keepsess', '1')); await p.click('.dk-exit').catch(() => {}); await p.goto(B + '/#desktop'); await p.waitForSelector('#desk:not([hidden])');
    await p.evaluate(() => { document.querySelectorAll('[data-dk="closeall"]'); }); await p.evaluate(() => window.AOSDesk && 0);
    await p.click('.dk-ic[data-w="files"]'); await p.waitForSelector('.dkw[aria-label="Files"]');
    await p.evaluate(() => { const e = document.querySelector('.dkw[aria-label="Files"]'); e.style.left = '120px'; });
    const before = await p.evaluate(() => [...document.querySelectorAll('.dkw')].map(e => e.getAttribute('aria-label')).sort());
    await p.waitForTimeout(600); const stored = await p.evaluate(() => localStorage.getItem('aos.desksess')); assert.ok(stored && stored.includes('files'));
    await p.reload(); await p.waitForSelector('#desk:not([hidden])'); await p.waitForSelector('.dkw[aria-label="Files"]');
    const after = await p.evaluate(() => [...document.querySelectorAll('.dkw')].map(e => e.getAttribute('aria-label')).sort()); assert.deepEqual(after, before);
    await p.locator('.dkw[aria-label="Files"] [data-dk="wclose"]').first().click(); await p.waitForTimeout(600); await p.reload(); await p.waitForSelector('#desk:not([hidden])'); await p.waitForTimeout(300);
    assert.equal(await p.locator('.dkw[aria-label="Files"]').count(), 0); await p.evaluate(() => sessionStorage.removeItem('keepsess'));
  });
  await t('browser: full settings (search, home, bookmarks, history, privacy, reset)', async () => {
    await p.click('.dk-ic[data-w="browser"], .dk-ic[data-k="browser"]').catch(() => {}); const win = p.locator('.dkw[aria-label="Browser"]').first(); await win.waitFor();
    await win.locator('[data-dk="bset"]').click(); await win.locator('.bsx').waitFor();
    for (const n of ['General', 'Search', 'Appearance', 'Bookmarks', 'History', 'Privacy and data', 'Advanced']) assert.ok(await win.locator('.bsnav button', { hasText: n }).count() >= 1, n);
    await shot(p, 'browser-settings-general'); await win.locator('.bsnav button', { hasText: 'Search' }).click(); await win.locator('#bsse').selectOption('bing'); assert.equal(await p.evaluate(() => localStorage.getItem('aos.brsearch')), '"bing"');
    await win.locator('#bsse').selectOption('custom'); await win.locator('#bscust').fill('https://search.example/?q=%s'); await win.locator('#bscust').press('Tab'); assert.equal(await p.evaluate(() => localStorage.getItem('aos.brsearchcustom')), '"https://search.example/?q=%s"');
    await win.locator('.bsnav button', { hasText: 'General' }).click(); await win.locator('#bshome').fill('https://example.com/'); await win.locator('#bshome').press('Tab'); assert.equal(await p.evaluate(() => localStorage.getItem('aos.brhome')), '"https://example.com/"');
    await win.locator('.bsnav button', { hasText: 'Appearance' }).click(); assert.ok(await win.locator('.bsmain', { hasText: 'Available in the Full browser' }).count() >= 1);
    await win.locator('[data-bs="close"]').click(); assert.equal(await win.locator('.bsx').count(), 0);
    /* bookmark a page, see it in the bar and in settings, then clear */
    await win.locator('.dk-start2 [data-dk="bgo"]').first().click(); await p.waitForTimeout(600); await win.locator('.dk-star').click(); await win.locator('.dk-bm').first().waitFor();
    assert.ok(await win.locator('.dk-star.on').count() === 1);
    await win.locator('[data-dk="bset"]').click(); await win.locator('.bsnav button', { hasText: 'Bookmarks' }).click(); assert.equal(await win.locator('.bsl2 li').count(), 1);
    await win.locator('.bsnav button', { hasText: 'History' }).click(); assert.ok(await win.locator('.bsl2 li').count() >= 1); await shot(p, 'browser-settings-history');
    await win.locator('.bsnav button', { hasText: 'Privacy and data' }).click(); await win.locator('[data-bs="clearall"]').click(); await p.waitForTimeout(300);
    assert.equal(await p.evaluate(() => localStorage.getItem('aos.brbm')), '[]'); assert.equal(await win.locator('.dk-bm').count(), 0);
    await win.locator('.bsnav button', { hasText: 'Advanced' }).click(); await win.locator('[data-bs="reset"]').click(); assert.equal(await p.evaluate(() => localStorage.getItem('aos.brsearch')), '"ddg"');
    await win.locator('[data-bs="close"]').click();
  });
  await t('desktop apps: sticky notes are created, typed into, moved, coloured and saved on the server', async () => {
    await p.evaluate(() => { document.querySelectorAll('.dkw').forEach((w) => w.querySelector('.dk-wc [data-dk="wclose"]') && w.querySelector('.dk-wc [data-dk="wclose"]').click()); });
    await p.keyboard.press('Control+Alt+n'); await p.waitForSelector('.dk-sn');
    const body = p.locator('.dk-sn .dk-sn-b').first(); await body.click(); await p.keyboard.type('Call Lusaka depot about T412');
    const bar = await p.locator('.dk-sn .dk-sn-t').first().boundingBox(); await p.mouse.move(bar.x + bar.width - 50, bar.y + 8); await p.mouse.down(); await p.mouse.move(bar.x + 280, bar.y + 160, { steps: 6 }); await p.mouse.up();
    await p.locator('.dk-sn .dk-sn-cs button[data-c="g"]').first().evaluate((b) => b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
    await p.waitForTimeout(1100); const j = await (await ctx.request.get(B + '/api/desk')).json();
    assert.equal(j.notes.length, 1); assert.match(j.notes[0].t, /T412/); assert.equal(j.notes[0].c, 'g'); assert.ok(j.notes[0].x > 150, 'note moved: ' + j.notes[0].x);
    await shot(p, 'desktop-sticky');
    const x = p.locator('.dk-sn .dk-sn-x').first(); await x.dispatchEvent('pointerdown'); assert.match(await x.innerText(), /Delete/); await x.dispatchEvent('pointerdown'); await p.waitForTimeout(1000);
    assert.equal((await (await ctx.request.get(B + '/api/desk')).json()).notes.length, 0);
  });
  await t('desktop apps: clock popover shows world clocks, saves alarms, runs timer and stopwatch', async () => {
    await p.click('#dkclock'); await p.waitForSelector('#dkclockpop');
    const txt = await p.locator('#dkclockpop').innerText(); for (const c of ['Dar es Salaam', 'Lusaka', 'Kinshasa', 'Kampala', 'Nairobi', 'Johannesburg', 'Dubai', 'Kochi']) assert.ok(txt.includes(c), c);
    await shot(p, 'desktop-clock');
    await p.click('#dkclockpop [data-t="alarm"]'); await p.fill('#dkclockpop input[name="l"]', 'Border call'); await p.click('#dkclockpop button[type="submit"]'); await p.waitForTimeout(1000);
    assert.equal((await (await ctx.request.get(B + '/api/desk')).json()).alarms.length, 1); assert.ok((await p.locator('#dkclockpop').innerText()).includes('Border call'));
    await p.click('#dkclockpop [data-cp="adel"]'); await p.waitForTimeout(1000); assert.equal((await (await ctx.request.get(B + '/api/desk')).json()).alarms.length, 0);
    await p.click('#dkclockpop [data-t="timer"]'); await p.click('#dkclockpop [data-s="60"]'); assert.match(await p.locator('#dkcpt').innerText(), /^1:00$/); await p.click('#dkclockpop [data-cp="tgo"]'); await p.waitForTimeout(1300); assert.match(await p.locator('#dkcpt').innerText(), /^0:5\d$/); await p.click('#dkclockpop [data-cp="tgo"]');
    await p.click('#dkclockpop [data-t="sw"]'); await p.click('#dkclockpop [data-cp="sgo"]'); await p.waitForTimeout(700); await p.click('#dkclockpop [data-cp="slap"]'); await p.click('#dkclockpop [data-cp="sgo"]'); assert.equal(await p.locator('.dk-cp-laps li').count(), 1);
    await p.click('#dkclockpop [data-t="pf"]'); assert.match(await p.locator('#dkcpp').innerText(), /^25:00$/);
    await p.keyboard.press('Escape'); assert.equal(await p.locator('#dkclockpop').count(), 0);
  });
  await t('desktop apps: converter handles truck units and currencies', async () => {
    await p.route('**/api/rates', (r) => r.fulfill({ json: { base: 'USD', rates: { USD: 1, TZS: 2600, EUR: 0.9 }, updated: Date.now(), stale: false } }));
    await p.evaluate(() => window.AOSDeskX.open('conv')); const w = p.locator('.dkw[aria-label="Converter"]'); await w.waitFor();
    assert.equal((await w.locator('.dk-cv-r').innerText()).replace(/\s/g, ''), '1,000'); await w.locator('.dk-cv-v').fill('2.5'); assert.equal((await w.locator('.dk-cv-r').innerText()).replace(/\s/g, ''), '2,500');
    await w.locator('[data-c="Fuel and volume"]').click(); await w.locator('.dk-cv-f').selectOption('barrel'); await w.locator('.dk-cv-t').selectOption('litre'); assert.match(await w.locator('.dk-cv-r').innerText(), /397/);
    await w.locator('[data-c="Currency"]').click(); await w.locator('.dk-cv-v').fill('10'); await p.waitForFunction(() => /26,000/.test(document.querySelector('.dkw[aria-label="Converter"] .dk-cv-r').textContent)); await shot(p, 'desktop-converter');
    await w.locator('.dk-wc [data-dk="wclose"]').evaluate((b) => b.click());
  });
  await t('desktop apps: quick launcher finds apps, calculates, converts, makes notes and timers', async () => {
    await p.keyboard.press('Control+Space'); await p.waitForSelector('#dkql input'); const q = p.locator('#dkql input');
    await q.fill('calc'); assert.ok((await p.locator('.dk-ql-x', { hasText: 'Calculator' }).count()) >= 1);
    await q.fill('12*7+3'); assert.match(await p.locator('.dk-ql-x').first().innerText(), /87/);
    await q.fill('5 t to kg'); assert.match(await p.locator('.dk-ql-x').first().innerText(), /5,000/);
    await q.fill('100 usd to tzs'); await p.waitForTimeout(300); assert.match(await p.locator('.dk-ql-x').first().innerText(), /260,000/);
    await shot(p, 'desktop-launcher');
    await q.fill('note buy tyres'); await p.keyboard.press('Enter'); await p.waitForSelector('.dk-sn'); assert.equal(await p.locator('#dkql').count(), 0); assert.match(await p.locator('.dk-sn-b').last().innerText(), /buy tyres/, await p.locator('.dk-sn-b').allInnerTexts().then((a) => JSON.stringify(a)));
    await p.keyboard.press('Control+Space'); await p.locator('#dkql input').fill('timer 5'); assert.match(await p.locator('.dk-ql-x').first().innerText(), /5:00/); await p.keyboard.press('Escape'); assert.equal(await p.locator('#dkql').count(), 0);
    await p.evaluate(() => { const n = document.querySelector('.dk-sn .dk-sn-x'); n.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); n.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); });
  });
  await t('desktop apps: snip bar captures the desktop and saves to Drive and as a download', async () => {
    await p.click('.dk-tray[data-dk="snip"]'); await p.waitForSelector('#dksp'); assert.ok((await p.locator('#dksp').innerText()).includes('Region')); await shot(p, 'desktop-snip');
    const saved = await p.evaluate(async () => { const c = document.createElement('canvas'); c.width = 8; c.height = 8; const b = await new Promise((r) => c.toBlob(r, 'image/png')); return window.AOSDeskX.saveShot(b, 'drive'); });
    assert.match(saved, /^Screenshot .*\.png$/); assert.ok([...tree.keys()].some((k) => /^\/Screenshots\/Screenshot .*\.png$/.test(k)), [...tree.keys()].join(','));
    await p.selectOption('#dksp [data-sp="dest"]', 'dl'); const dl = p.waitForEvent('download', { timeout: 8000 }); await p.click('#dksp [data-sp="go"]'); const d = await dl; assert.match(d.suggestedFilename(), /^Screenshot .*\.png$/);
    await p.waitForSelector('#dksp', { state: 'detached' });
  });
  await t('launcher and Suite list Email and Meeting by plain names', async () => {
    const L = await (await ctx.request.get(B + '/apps.json')).json(); const nm = (x) => (L.find((a) => a.slug === x) || {}).name;
    if (nm('email') !== undefined) assert.equal(nm('email'), 'Email'); if (nm('meetings') !== undefined) assert.equal(nm('meetings'), 'Meeting');
  });
  await t('mobile: desktop windows open maximised', async () => {
    const m = await browser.newContext({ viewport: { width: 390, height: 780 }, colorScheme: 'dark' }); await m.request.post(B + '/auth/password', { data: { password: 'pw' }, headers: { 'x-aos': '1' } });
    const q = await m.newPage(); await q.goto(B + '/'); await q.waitForSelector('#top .deskbtn'); await q.click('#top .deskbtn'); await q.waitForSelector('#desk:not([hidden])');  await q.click('.dk-ic[data-w="files"]', { timeout: 5000 }); await q.waitForSelector('.dkw');
    const bb = await q.locator('.dkw').boundingBox(); assert.ok(bb.width >= 385); const tk = await q.locator('.dk-task').boundingBox(); assert.ok(Math.abs(tk.y + tk.height - 780) <= 1, 'taskbar sits at the bottom of the screen'); assert.ok(Math.abs(bb.y + bb.height - tk.y) <= 1, 'window fills the space above the taskbar'); assert.ok(await q.evaluate(() => getComputedStyle(document.querySelector('.dkw-body')).overscrollBehaviorY === 'contain')); assert.ok(await q.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)); await shot(q, 'desktop-mobile'); await m.close();
  });
  await t('no page errors', async () => assert.deepEqual(errs, []));
} finally { await browser.close(); srv.kill(); dav.close(); google.close(); llm.close(); site.close(); }
console.log(`\n${pass} passed, ${failed} failed`); if (failed) console.log(log.slice(-1500)); process.exit(failed ? 1 : 0);
