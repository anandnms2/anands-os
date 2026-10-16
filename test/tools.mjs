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
  const put = (p, body, type = 'text/plain') => ctx.request.post(B + '/_local/fs/write?path=' + encodeURIComponent(p) + '&overwrite=1', { data: body, headers: { ...H, 'content-type': type } });
  await ctx.request.post(B + '/_local/fs/mkdir', { data: { path: '/Work', parents: true }, headers: H });
  await put('/Work/app.js', 'const answer = 42;\nfunction hi() { return "hello"; }\n'); await put('/Work/notes.md', '# Notes\n');
  const wav = Buffer.alloc(44 + 16000); wav.write('RIFF', 0); wav.writeUInt32LE(36 + 16000, 4); wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22); wav.writeUInt32LE(8000, 24); wav.writeUInt32LE(8000, 28); wav.writeUInt16LE(1, 32); wav.writeUInt16LE(8, 34); wav.write('data', 36); wav.writeUInt32LE(16000, 40); wav.fill(128, 44);
  await ctx.request.post(B + '/_local/fs/mkdir', { data: { path: '/Music', parents: true }, headers: H }); await put('/Music/tone.wav', wav, 'audio/wav'); await put('/Music/second.wav', wav, 'audio/wav');

  await t('files can be fetched in slices so media can seek', async () => {
    const r = await fetch(B + '/_local/fs/get?path=' + encodeURIComponent('/Music/tone.wav'), { headers: { cookie: ck, range: 'bytes=100-199' } });
    assert.equal(r.status, 206); assert.equal(r.headers.get('content-range'), 'bytes 100-199/' + wav.length); assert.equal((await r.arrayBuffer()).byteLength, 100);
    const bad = await fetch(B + '/_local/fs/get?path=' + encodeURIComponent('/Music/tone.wav'), { headers: { cookie: ck, range: 'bytes=999999-' } }); assert.equal(bad.status, 416);
  });

  const page = await ctx.newPage(); page.on('pageerror', (e) => errs.push(e.message));
  await t('editor opens a file with colours, edits and saves with Ctrl+S', async () => {
    await page.goto(B + '/tools/editor.html?path=' + encodeURIComponent('/Work/app.js')); await page.waitForSelector('.CodeMirror');
    assert.ok((await page.locator('.CodeMirror').innerText()).includes('answer')); assert.ok(await page.locator('.cm-keyword').count() >= 2, 'keywords coloured');
    await page.locator('.CodeMirror').click(); await page.keyboard.press('Control+End'); await page.keyboard.type('// edited'); assert.ok(await page.locator('.etab.dirty').count() === 1, 'dirty dot');
    await page.keyboard.press('Control+s'); await page.waitForFunction(() => !document.querySelector('.etab.dirty'));
    const saved = await (await fetch(B + '/_local/fs/get?path=' + encodeURIComponent('/Work/app.js'), { headers: { cookie: ck } })).text(); assert.ok(saved.includes('// edited') && saved.includes('answer'));
  });
  await t('editor lists folders, opens a second tab and creates a new file', async () => {
    await page.locator('.trow', { hasText: 'notes.md' }).click(); await page.waitForFunction(() => document.querySelectorAll('.etab').length === 2);
    await page.click('#bnew'); await page.fill('#newname', 'fresh.sh'); await page.click('#newok'); await page.waitForFunction(() => document.querySelectorAll('.etab').length === 3);
    await page.locator('.CodeMirror:visible').first().click(); await page.keyboard.type('echo hi'); await page.keyboard.press('Control+s'); await page.waitForFunction(() => !document.querySelector('.etab.dirty'));
    const r = await fetch(B + '/_local/fs/get?path=' + encodeURIComponent('/Work/fresh.sh'), { headers: { cookie: ck } }); assert.equal(await r.text(), 'echo hi');
  });

  await t('player lists music, plays it and keeps a queue and playlists', async () => {
    const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message)); await p.goto(B + '/tools/player.html'); await p.waitForSelector('.trow');
    await p.locator('.trow', { hasText: 'Music' }).click(); await p.waitForSelector('text=Play all 2'); await p.locator('.trow', { hasText: 'tone.wav' }).locator('span').first().click();
    await p.waitForFunction(() => document.querySelector('#ptitle').textContent === 'tone'); await p.waitForFunction(() => document.querySelector('#bplay').getAttribute('aria-label') === 'Pause', null, { timeout: 8000 });
    await p.click('.ptabs [data-t=q]'); assert.equal(await p.locator('.trow').count(), 1);
    await p.click('.ptabs [data-t=lib]'); await p.click('[data-a=addall]'); await p.click('.ptabs [data-t=q]'); await p.waitForFunction(() => document.querySelectorAll('#pbody .trow').length === 2);
    await p.click('[data-a=saveq]'); await p.fill('#plname', 'Road trip'); await p.click('[data-a=plok]'); await p.waitForSelector('text=Road trip');
    const j = JSON.parse(await (await fetch(B + '/_local/fs/get?path=' + encodeURIComponent('/Playlists/playlists.json'), { headers: { cookie: ck } })).text()); assert.equal(j['Road trip'].length, 2);
    await p.click('#bnext'); await p.waitForFunction(() => document.querySelector('#ptitle').textContent === 'tone'); await p.close();
  });

  await t('recorder records your voice and saves it to your files', async () => {
    const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message)); await p.goto(B + '/tools/recorder.html'); await p.waitForSelector('[data-m=voice]'); await p.click('[data-m=voice]');
    await p.click('[data-a=start]'); await p.waitForSelector('.recdot', { timeout: 8000 }); await sleep(1500); await p.click('[data-a=stop]'); await p.waitForSelector('#rsave:not([hidden])', { timeout: 8000 });
    await p.fill('#rfn', 'Test voice'); await p.click('#rsv'); await p.waitForSelector('.rrow', { timeout: 8000 }); assert.ok((await p.locator('.rrow').first().innerText()).includes('Test voice'));
    const l = await (await ctx.request.post(B + '/_local/fs/readdir', { data: { path: '/Recordings' }, headers: H })).json(); assert.ok(l.some((f) => /^Test voice\./.test(f.name) && f.size > 500)); await p.close();
  });

  const post = (p, b) => fetch(B + '/api/term' + p, { method: 'POST', headers: { cookie: ck, 'x-aos': '1', 'content-type': 'application/json' }, body: JSON.stringify(b || {}) });
  await t('terminal needs the password and the word OPEN', async () => {
    assert.equal((await fetch(B + '/api/term/status')).status, 401);
    assert.equal((await post('/open', { target: 'local', confirm: 'OPEN', password: 'nope' })).status, 401);
    assert.equal((await post('/open', { target: 'local', confirm: 'nah', password: 'pw' })).status, 400);
    assert.equal((await post('/open', { target: 'host', confirm: 'OPEN', password: 'pw' })).status, 400, 'server not set up yet');
  });
  await t('terminal runs commands and the session is logged', async () => {
    const r = await post('/open', { target: 'local', confirm: 'OPEN', password: 'pw', cols: 90, rows: 20 }); assert.equal(r.status, 200); const { id } = await r.json();
    const out = await fetch(B + '/api/term/' + id + '/out', { headers: { cookie: ck } }); const rd = out.body.getReader(); let text = '';
    const pump = (async () => { for (;;) { const { value, done } = await rd.read(); if (done) break; text += Buffer.from(String.fromCharCode(...value).split('\n').filter((l) => l.startsWith('data: ')).map((l) => l.slice(6)).join(''), 'base64').toString(); } })();
    await sleep(600); await post('/' + id + '/in', { d: 'echo hello-$((6*7)); stty size\n' }); for (let i = 0; i < 30 && !/hello-42/.test(text); i++) await sleep(150);
    assert.ok(/hello-42/.test(text), 'got: ' + JSON.stringify(text.slice(-200))); await post('/' + id + '/resize', { cols: 120, rows: 40 }); await post('/' + id + '/in', { d: 'stty size\n' }); for (let i = 0; i < 30 && !/40 120/.test(text); i++) await sleep(150); assert.ok(/40 120/.test(text), 'resized');
    assert.equal((await fetch(B + '/api/term/' + id, { method: 'DELETE', headers: { cookie: ck, 'x-aos': '1' } })).status, 200); await pump.catch(() => {});
    const sec = await (await fetch(B + '/api/security', { headers: { cookie: ck } })).json(); assert.ok(sec.history.some((e) => e.ev === 'term_open') && sec.history.some((e) => e.ev === 'term_close'));
  });
  await t('terminal window works in the browser', async () => {
    const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message)); await p.goto(B + '/tools/terminal.html'); await p.waitForSelector('#of');
    await p.fill('#op', 'pw'); await p.fill('#oc', 'OPEN'); await p.click('#of button[type=submit]'); await p.waitForSelector('.xterm', { timeout: 8000 }); await sleep(800); await p.keyboard.type('echo ui-$((5+5))\n');
    await p.waitForFunction(() => /ui-10/.test(document.querySelector('.xterm-rows').innerText), null, { timeout: 8000 }); await p.click('#tclose'); await p.waitForSelector('#of'); await p.close();
  });
  await t('guests cannot use the terminal', async () => {
    const inv = await (await fetch(B + '/api/team', { method: 'POST', headers: { cookie: ck, 'x-aos': '1', 'content-type': 'application/json' }, body: JSON.stringify({ name: 'G', role: 'guest', apps: ['chat'] }) })).json();
    const g = await fetch(inv.link, { redirect: 'manual' }); const gc = g.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
    assert.equal((await fetch(B + '/api/term/status', { headers: { cookie: gc } })).status, 403);
  });
  await t('the Desktop opens each tool in a window with its own icon and Start menu entry', async () => {
    const d = await ctx.newPage(); d.on('pageerror', (e) => errs.push(e.message)); await d.goto(B + '/#desktop'); await d.waitForSelector('#desk', { state: 'attached' }); await d.waitForFunction(() => window.AOSDesk && AOSDesk.state.open, null, { timeout: 8000 }).catch(async () => { await d.evaluate(() => AOSDesk.show()); });
    for (const id of ['editor', 'player', 'recorder', 'terminal']) { await d.evaluate((x) => AOSDesk.tool(x), id); await d.waitForSelector('.dkw iframe[src*="/tools/' + id + '.html"]'); }
    assert.equal(await d.locator('.dkw').count(), 4); assert.ok(await d.locator('.dkw-t img[src="/oicons/terminal.svg"]').count() === 1);
    await d.evaluate(() => AOSDesk.tool('editor', '/Work/app.js')); await sleep(800); await d.evaluate(() => { document.querySelector('.dk-start, [data-dk=start]') && document.querySelector('.dk-start, [data-dk=start]').click(); });
    assert.equal(await d.locator('.dkw').count(), 4, 'editor reused'); await d.close();
  });
  await t('no page errors', async () => { assert.deepEqual(errs, []); });
} finally { await browser.close(); srv.kill(); }
console.log(`\n${pass} passed, ${failed} failed`); process.exit(failed ? 1 : 0);
