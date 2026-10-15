// Browser proxy: cookies are kept per session, form POSTs work, and the Origin check stops cross-site posts.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = http.createServer((q, r) => {
  let b = ''; q.on('data', (c) => (b += c)); q.on('end', () => {
    if (q.url === '/login' && q.method === 'POST') { r.writeHead(303, { location: '/home', 'set-cookie': 'sid=abc123; Path=/; HttpOnly' }); return r.end(); }
    if (q.url === '/home') { r.writeHead(200, { 'content-type': 'text/html' }); return r.end('<title>t</title>cookie=' + (q.headers.cookie || 'none')); }
    if (q.url === '/echo') { r.writeHead(200, { 'content-type': 'text/html' }); return r.end('<form method=post></form>' + q.method + ':' + b); }
    r.writeHead(404); r.end();
  });
});
await new Promise((r) => site.listen(0, '127.0.0.1', r)); const sp = site.address().port;
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-br-')), port = 20000 + Math.floor(Math.random() * 20000);
const srv = spawn('node', ['server/index.js'], { cwd: root, stdio: 'ignore', env: { ...process.env, PORT: String(port), DATA_DIR: data, SUITE_DIR: path.join(root, 'test/fixtures/suite'), APP_PASSWORD: 'pw', SESSION_SECRET: 'x'.repeat(40), PUBLIC_URL: `http://127.0.0.1:${port}`, BROWSE_ALLOW_PRIVATE: '1' } });
const B = `http://127.0.0.1:${port}`; for (let i = 0; i < 50; i++) { try { if ((await fetch(B + '/healthz')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
let pass = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { console.log('FAIL ' + n + '\n     ' + e.message); process.exitCode = 1; } };
try {
  const lr = await fetch(B + '/auth/password', { method: 'POST', headers: { 'content-type': 'application/json', 'x-aos': '1' }, body: JSON.stringify({ password: 'pw' }) });
  const cookie = lr.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
  const u = (p) => `${B}/api/browse?url=${encodeURIComponent('http://127.0.0.1:' + sp + p)}`;
  await t('a POST form logs in, the cookie is kept and sent on the next page', async () => {
    const r = await fetch(u('/login'), { method: 'POST', headers: { cookie, origin: B, 'content-type': 'application/x-www-form-urlencoded' }, body: 'u=a&p=b' }); const h = await r.text(); assert.match(h, /cookie=sid=abc123/);
    const r2 = await fetch(u('/home'), { headers: { cookie } }); assert.match(await r2.text(), /cookie=sid=abc123/);
  });
  await t('the site cookie never reaches this app and POST bodies are forwarded', async () => { const r = await fetch(u('/echo'), { method: 'POST', headers: { cookie, origin: B }, body: 'q=1' }); assert.ok(!(r.headers.get('set-cookie') || '').includes('sid')); assert.match(await r.text(), /POST:q=1/); });
  await t('a POST from another site is refused', async () => { const r = await fetch(u('/echo'), { method: 'POST', headers: { cookie, origin: 'https://evil.example' }, body: 'q=1' }); assert.equal(r.status, 403); });
  await t('signed-out requests are refused', async () => { assert.equal((await fetch(u('/home'))).status, 401); });
} finally { srv.kill(); site.close(); console.log(pass + ' passed'); setTimeout(() => process.exit(process.exitCode || 0), 100); }
