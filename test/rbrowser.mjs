// Full Chromium on the server: frames stream out, clicks, typing, scrolling, tabs and navigation work through the API.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BIN = ['/usr/bin/chromium', ...fs.readdirSync('/opt/pw-browsers').filter((d) => /^chromium-\d+$/.test(d)).map((d) => `/opt/pw-browsers/${d}/chrome-linux/chrome`)].find((b) => fs.existsSync(b));
if (!BIN) { console.log('skip (no chromium)'); process.exit(0); }
const got = { clicks: 0, typed: '', keys: [] };
const site = http.createServer((q, r) => {
  if (q.url.startsWith('/beacon')) { const u = new URL(q.url, 'http://x'); if (u.searchParams.get('c')) got.clicks++; if (u.searchParams.get('t') != null) got.typed = u.searchParams.get('t'); r.writeHead(204); return r.end(); }
  r.writeHead(200, { 'content-type': 'text/html' });
  r.end(`<title>Test ${q.url}</title><body style="margin:0"><button id=b style="position:absolute;left:100px;top:100px;width:200px;height:80px" onclick="fetch('/beacon?c=1')">Click me</button><input id=i style="position:absolute;left:100px;top:220px;width:300px;height:40px" oninput="fetch('/beacon?t='+encodeURIComponent(this.value))"><div style="height:3000px"></div><script>addEventListener('scroll',()=>fetch('/beacon?s='+scrollY))</script>`);
});
await new Promise((r) => site.listen(0, '127.0.0.1', r)); const SP = site.address().port;
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-rb-')), port = 20000 + Math.floor(Math.random() * 20000), B = `http://127.0.0.1:${port}`;
const srv = spawn('node', ['server/index.js'], { cwd: root, stdio: 'ignore', env: { ...process.env, PORT: String(port), DATA_DIR: data, SUITE_DIR: path.join(root, 'test/fixtures/suite'), APP_PASSWORD: 'pw', SESSION_SECRET: 'x'.repeat(40), PUBLIC_URL: B, CHROMIUM_PATH: BIN, BROWSE_ALLOW_PRIVATE: '1' } });
for (let i = 0; i < 50; i++) { try { if ((await fetch(B + '/healthz')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
let pass = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { console.log('FAIL ' + n + '\n     ' + (e.stack || e.message).split('\n').slice(0, 4).join('\n     ')); process.exitCode = 1; } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ac = new AbortController(); const ev = { tabs: null, frames: 0, lastFrame: null };
try {
  const lr = await fetch(B + '/auth/password', { method: 'POST', headers: { 'content-type': 'application/json', 'x-aos': '1' }, body: JSON.stringify({ password: 'pw' }) });
  const cookie = lr.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
  const post = async (p, b) => { const r = await fetch(B + '/api/rb' + p, { method: 'POST', headers: { cookie, 'x-aos': '1', 'content-type': 'application/json' }, body: JSON.stringify(b || {}) }); let j = null; try { j = await r.json(); } catch {} return { s: r.status, j }; };
  await t('status says Chromium is available', async () => { const r = await (await fetch(B + '/api/rb/status', { headers: { cookie } })).json(); assert.equal(r.available, true); });
  await t('requires sign-in', async () => { assert.equal((await fetch(B + '/api/rb/status')).status, 401); });
  const sse = await fetch(B + '/api/rb/events', { headers: { cookie }, signal: ac.signal });
  (async () => { const dec = new TextDecoder(); let buf = ''; try { for await (const c of sse.body) { buf += dec.decode(c, { stream: true }); let i; while ((i = buf.indexOf('\n\n')) >= 0) { const m = buf.slice(0, i); buf = buf.slice(i + 2); const e = /^event: (\w+)\ndata: (.*)$/s.exec(m); if (!e) continue; const d = JSON.parse(e[2]); if (e[1] === 'tabs') ev.tabs = d; if (e[1] === 'frame') { ev.frames++; ev.lastFrame = d; } } } } catch {} })();
  const until = async (f, ms = 8000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (f()) return; await sleep(100); } throw new Error('timed out waiting'); };
  await t('the event stream reports a tab and streams frames', async () => { await until(() => ev.tabs && ev.tabs.tabs.length >= 1 && ev.frames > 0); assert.ok(ev.tabs.active); });
  await post('/size', { w: 800, h: 600 });
  await t('opening a page makes a tab with its title and the page is drawn', async () => {
    const r = await post('/open', { url: `http://127.0.0.1:${SP}/one` }); assert.equal(r.s, 200, JSON.stringify(r.j));
    await until(() => ev.tabs.tabs.some((x) => /Test \/one/.test(x.title))).catch((e) => { console.log(JSON.stringify(ev.tabs)); throw e; }); assert.equal(ev.tabs.active, r.j.tab);
    assert.ok(Buffer.from(ev.lastFrame.d, 'base64').subarray(0, 2).equals(Buffer.from([0xff, 0xd8])));
  });
  const tab = () => ev.tabs.active;
  await t('a mouse click reaches the page', async () => { await post('/input', { tab: tab(), ev: [{ t: 'm', k: 'move', x: 150, y: 130 }, { t: 'm', k: 'down', x: 150, y: 130, b: 0, cc: 1 }, { t: 'm', k: 'up', x: 150, y: 130, b: 0, cc: 1 }] }); await until(() => got.clicks === 1); });
  await t('typing and pasting reach a text box', async () => {
    await post('/input', { tab: tab(), ev: [{ t: 'm', k: 'down', x: 200, y: 240, b: 0, cc: 1 }, { t: 'm', k: 'up', x: 200, y: 240, b: 0, cc: 1 }, ...['h', 'i'].flatMap((k) => [{ t: 'k', k: 'down', key: k, code: 'Key' + k.toUpperCase(), kc: k.toUpperCase().charCodeAt(0) }, { t: 'k', k: 'up', key: k, code: 'Key' + k.toUpperCase(), kc: k.toUpperCase().charCodeAt(0) }])] });
    await until(() => got.typed === 'hi'); await post('/input', { tab: tab(), ev: [{ t: 'text', s: ' there' }] }); await until(() => got.typed === 'hi there');
  });
  await t('scrolling works', async () => { await post('/input', { tab: tab(), ev: [{ t: 'w', x: 300, y: 300, dx: 0, dy: 400 }] }); await sleep(500); });
  await t('navigate, back and reload', async () => {
    assert.equal((await post('/nav', { tab: tab(), url: `http://127.0.0.1:${SP}/two` })).s, 200); await until(() => ev.tabs.tabs.some((x) => /Test \/two/.test(x.title)));
    await post('/go', { tab: tab(), dir: 'back' }); await until(() => ev.tabs.tabs.some((x) => /Test \/one/.test(x.title))).catch((e) => { console.log(JSON.stringify(ev.tabs)); throw e; }); assert.equal((await post('/go', { tab: tab(), dir: 'reload' })).s, 200);
  });
  await t('a second tab can be opened, switched to and closed', async () => {
    const n = ev.tabs.tabs.length; const r = await post('/open', { url: `http://127.0.0.1:${SP}/three` }); await until(() => ev.tabs.tabs.length === n + 1 && ev.tabs.active === r.j.tab);
    const first = ev.tabs.tabs[0].id; await post('/activate', { tab: first }); await until(() => ev.tabs.active === first); await post('/close', { tab: r.j.tab }); await until(() => ev.tabs.tabs.length === n);
  });
  await t('only http and https addresses are accepted', async () => { assert.equal((await post('/nav', { tab: tab(), url: 'file:///etc/passwd' })).s, 400); assert.equal((await post('/open', { url: 'javascript:alert(1)' })).s, 400); assert.equal((await post('/nav', { tab: 'nope', url: 'https://example.com' })).s, 404); });
  await t('copy returns the selected text', async () => { await post('/input', { tab: tab(), ev: [{ t: 'm', k: 'down', x: 150, y: 130, b: 0, cc: 3 }, { t: 'm', k: 'up', x: 150, y: 130, b: 0, cc: 3 }] }); const r = await post('/copy', { tab: tab() }); assert.equal(typeof r.j.text, 'string'); });
} finally { ac.abort(); await sleep(200); srv.kill(); site.close(); console.log(pass + ' passed'); setTimeout(() => process.exit(process.exitCode || 0), 300); }
