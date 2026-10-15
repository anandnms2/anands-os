// Photos: when Immich has no usable thumbnail or the video cannot play in a browser, the server converts it.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-pm-')); const mp4 = path.join(tmp, 'v.mp4');
const ff = spawnSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc=d=2:s=320x240:r=15', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', mp4]);
if (ff.status !== 0) { console.log('skip (no ffmpeg)'); process.exit(0); }
const ID = '11111111-1111-4111-8111-111111111111';
const imm = http.createServer((q, r) => {
  if (q.headers['x-api-key'] !== 'k') { r.writeHead(401); return r.end(); }
  if (q.url.startsWith('/api/assets/' + ID + '/thumbnail')) { r.writeHead(404); return r.end(); }
  if (q.url === '/api/assets/' + ID + '/video/playback') { r.writeHead(404); return r.end(); }
  if (q.url === '/api/assets/' + ID + '/original') { r.writeHead(200, { 'content-type': 'video/quicktime' }); return fs.createReadStream(mp4).pipe(r); }
  if (q.url === '/api/assets/' + ID) { r.writeHead(200, { 'content-type': 'application/json' }); return r.end(JSON.stringify({ id: ID, type: 'VIDEO' })); }
  r.writeHead(404); r.end();
});
await new Promise((r) => imm.listen(0, '127.0.0.1', r));
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-pm2-')), port = 20000 + Math.floor(Math.random() * 20000), B = `http://127.0.0.1:${port}`;
const srv = spawn('node', ['server/index.js'], { cwd: root, stdio: 'ignore', env: { ...process.env, PORT: String(port), DATA_DIR: data, SUITE_DIR: path.join(root, 'test/fixtures/suite'), APP_PASSWORD: 'pw', SESSION_SECRET: 'x'.repeat(40), PUBLIC_URL: B, IMMICH_URL: `http://127.0.0.1:${imm.address().port}`, IMMICH_API_KEY: 'k' } });
for (let i = 0; i < 50; i++) { try { if ((await fetch(B + '/healthz')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
let pass = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { console.log('FAIL ' + n + '\n     ' + e.message); process.exitCode = 1; } };
try {
  const lr = await fetch(B + '/auth/password', { method: 'POST', headers: { 'content-type': 'application/json', 'x-aos': '1' }, body: JSON.stringify({ password: 'pw' }) });
  const cookie = lr.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
  await t('a video with no Immich thumbnail still gets a picture (frame from the video)', async () => { const r = await fetch(`${B}/api/photos/asset/${ID}/thumb`, { headers: { cookie } }); assert.equal(r.status, 200); assert.equal(r.headers.get('content-type'), 'image/jpeg'); const b = Buffer.from(await r.arrayBuffer()); assert.ok(b.length > 500 && b[0] === 0xff && b[1] === 0xd8); });
  await t('preview works the same way', async () => { const r = await fetch(`${B}/api/photos/asset/${ID}/preview`, { headers: { cookie } }); assert.equal(r.status, 200); assert.equal(r.headers.get('content-type'), 'image/jpeg'); });
  await t('playback falls back to the original, and ?tx=1 converts to browser-friendly MP4', async () => {
    const r = await fetch(`${B}/api/photos/asset/${ID}/video`, { headers: { cookie } }); assert.equal(r.status, 200);
    const x = await fetch(`${B}/api/photos/asset/${ID}/video?tx=1`, { headers: { cookie } }); assert.equal(x.status, 200); assert.equal(x.headers.get('content-type'), 'video/mp4'); const b = Buffer.from(await x.arrayBuffer()); assert.ok(b.length > 1000); assert.equal(b.subarray(4, 8).toString(), 'ftyp');
  });
} finally { srv.kill(); imm.close(); console.log(pass + ' passed'); setTimeout(() => process.exit(process.exitCode || 0), 100); }
