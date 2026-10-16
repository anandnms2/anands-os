// Full browser proxy: signed-in owner only, adds the container login, strips framing headers, rewrites redirects, relays WebSockets.
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import http from 'node:http'; import net from 'node:net'; import crypto from 'node:crypto';
import assert from 'node:assert/strict'; import { spawn } from 'node:child_process'; import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const seen = []; const up = http.createServer((q, r) => {
  seen.push({ url: q.url, auth: q.headers.authorization, cookie: q.headers.cookie, host: q.headers.host });
  if (q.url === '/old') { r.writeHead(302, { location: '/new' }); return r.end(); }
  if (q.url === '/denied') { r.writeHead(401, { 'www-authenticate': 'Basic realm=x' }); return r.end(); }
  r.writeHead(200, { 'content-type': 'text/html', 'x-frame-options': 'DENY', 'set-cookie': 'a=b', 'content-security-policy': "frame-ancestors 'none'" }); r.end('<title>Kasm</title>hello ' + q.url);
});
up.on('upgrade', (q, s) => {
  seen.push({ ws: q.url, auth: q.headers.authorization, origin: q.headers.origin, cookie: q.headers.cookie });
  const acc = crypto.createHash('sha1').update(q.headers['sec-websocket-key'] + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  s.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + acc + '\r\n\r\n'); s.write(Buffer.from([0x81, 0x05, ...Buffer.from('hello')]));
});
await new Promise((r) => up.listen(0, '127.0.0.1', r)); const UP = 'http://127.0.0.1:' + up.address().port;
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-rbp-')), port = 20000 + Math.floor(Math.random() * 20000), B = `http://127.0.0.1:${port}`;
const srv = spawn('node', ['server/index.js'], { cwd: root, stdio: 'ignore', env: { ...process.env, PORT: String(port), DATA_DIR: data, SUITE_DIR: path.join(root, 'test/fixtures/suite'), APP_PASSWORD: 'pw', REMOTE_BROWSER_URL: UP, REMOTE_BROWSER_PASSWORD: 'secret' } });
for (let i = 0; i < 50; i++) { try { if ((await fetch(B + '/healthz')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
let pass = 0, failed = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { failed++; console.log('FAIL ' + n + '\n     ' + (e.stack || e).toString().split('\n').slice(0, 4).join('\n     ')); } };
try {
  const login = await fetch(B + '/auth/password', { method: 'POST', headers: { 'content-type': 'application/json', 'x-aos': '1' }, body: JSON.stringify({ password: 'pw' }) });
  const cookie = login.headers.getSetCookie().map((c) => c.split(';')[0]).join('; '); assert.ok(cookie);
  await t('signed-out visitors get nothing from /rb/', async () => { const r = await fetch(B + '/rb/', { redirect: 'manual' }); assert.equal(r.status, 401); assert.equal(seen.length, 0); });
  await t('owner: page is passed through with the container login added and framing headers removed', async () => {
    const r = await fetch(B + '/rb/app/x.js?a=1', { headers: { cookie } }); assert.equal(r.status, 200); assert.match(await r.text(), /hello \/app\/x\.js\?a=1/);
    assert.equal(r.headers.get('x-frame-options'), null); assert.equal(r.headers.get('set-cookie'), null); assert.ok(!/frame-ancestors 'none'/.test(r.headers.get('content-security-policy') || ''));
    const s = seen.at(-1); assert.equal(s.auth, 'Basic ' + Buffer.from('kasm_user:secret').toString('base64')); assert.equal(s.cookie, undefined); assert.equal(s.host, UP.slice(7));
  });
  await t('redirects stay under /rb/ and a refused password is explained', async () => {
    const r = await fetch(B + '/rb/old', { headers: { cookie }, redirect: 'manual' }); assert.equal(r.status, 302); assert.equal(r.headers.get('location'), '/rb/new');
    const d = await fetch(B + '/rb/denied', { headers: { cookie } }); assert.equal(d.status, 502); assert.equal((await d.json()).code, 'rb_auth');
  });
  await t('status says reachable, and a stopped container is reported', async () => {
    const ok = await (await fetch(B + '/api/rb/status', { headers: { cookie } })).json(); assert.equal(ok.available, true); assert.equal(ok.up, true);
  });
  await t('websocket: needs the owner session and a same-site origin, then relays bytes with the login added', async () => {
    const hs = (extra) => new Promise((ok) => { const s = net.connect(port, '127.0.0.1'); let buf = Buffer.alloc(0); s.on('data', (d) => { buf = Buffer.concat([buf, d]); }); s.on('close', () => ok(buf)); s.on('connect', () => s.write('GET /rb/websockify HTTP/1.1\r\nHost: 127.0.0.1:' + port + '\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\nSec-WebSocket-Version: 13\r\n' + extra + '\r\n')); setTimeout(() => { s.destroy(); }, 700); });
    assert.match((await hs('')).toString(), /^HTTP\/1.1 403/);
    assert.match((await hs('Cookie: ' + cookie + '\r\nOrigin: https://evil.example\r\n')).toString(), /^HTTP\/1.1 403/);
    const good = (await hs('Cookie: ' + cookie + '\r\nOrigin: http://127.0.0.1:' + port + '\r\n')).toString('latin1'); assert.match(good, /^HTTP\/1.1 101/); assert.ok(good.includes('hello'));
    const w = seen.find((x) => x.ws); assert.equal(w.ws, '/websockify'); assert.equal(w.auth, 'Basic ' + Buffer.from('kasm_user:secret').toString('base64')); assert.equal(w.cookie, undefined);
  });
  up.close(); up.closeAllConnections?.();
  await t('stopped container: clear message, not a blank page', async () => {
    const s = await (await fetch(B + '/api/rb/status', { headers: { cookie } })).json(); assert.equal(s.up, false); assert.match(s.reason, /cannot reach/);
    const r = await fetch(B + '/rb/', { headers: { cookie } }); assert.equal(r.status, 502); assert.equal((await r.json()).code, 'rb_down');
  });
} finally { srv.kill(); up.close(); }
console.log(`\n${pass} passed, ${failed} failed`); process.exit(failed ? 1 : 0);
