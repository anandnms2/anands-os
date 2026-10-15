// Google Drive as a full file system under /Google Drive: list, read, upload, mkdir, rename, move, copy, delete, cross-mount copy. Mock Google, no browser.
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import http from 'node:http';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { start, tree } from './dav-mock.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FOLDER = 'application/vnd.google-apps.folder';
const files = new Map(); let seq = 1;
const add = (name, parent, mimeType = 'text/plain', data = '') => { const id = 'id' + seq++; files.set(id, { id, name, mimeType, parents: [parent], data: Buffer.from(data), trashed: false, modifiedTime: '2026-10-10T10:00:00Z' }); return id; };
const docs = add('Quarter plan', 'root', 'application/vnd.google-apps.document'); const clients = add('Clients', 'root', FOLDER); add('notes.txt', 'root', 'text/plain', 'google text'); add('inner.txt', clients, 'text/plain', 'inner');
const view = (f) => ({ id: f.id, name: f.name, mimeType: f.mimeType, size: String(f.data.length), modifiedTime: f.modifiedTime, parents: f.parents });
const google = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x'); const chunks = []; for await (const c of req) chunks.push(c); const raw = Buffer.concat(chunks);
  const send = (c, o) => { res.writeHead(c, { 'content-type': 'application/json' }); res.end(JSON.stringify(o)); };
  if (u.pathname === '/token') return send(200, { access_token: 'ya29.test', refresh_token: 'r', expires_in: 3600, id_token: 'x.' + Buffer.from(JSON.stringify({ email: 'a@gmail.com' })).toString('base64url') + '.y' });
  if (req.headers.authorization !== 'Bearer ya29.test') return send(401, { error: { message: 'no' } });
  const m = /^\/(upload\/)?drive\/v3\/files(?:\/([^/]+))?(?:\/(copy|export))?$/.exec(u.pathname); if (!m) return send(404, { error: { message: 'nope' } });
  const id = m[2], f = id && files.get(id);
  if (req.method === 'GET' && !id) { const pid = /'([^']+)' in parents/.exec(u.searchParams.get('q') || '')?.[1]; return send(200, { files: [...files.values()].filter((x) => !x.trashed && x.parents.includes(pid)).map(view) }); }
  if (req.method === 'GET' && f && m[3] === 'export') { res.writeHead(200, { 'content-type': 'application/octet-stream' }); return res.end('DOCXBYTES'); }
  if (req.method === 'GET' && f) { res.writeHead(200, { 'content-type': f.mimeType }); return res.end(f.data); }
  if (req.method === 'POST' && m[3] === 'copy' && f) { const body = JSON.parse(raw.toString()); const n = add(body.name, body.parents[0], f.mimeType); files.get(n).data = f.data; return send(200, view(files.get(n))); }
  if (req.method === 'POST' && !id && m[1]) { const s = raw.toString('latin1'); const parts = s.split(/--b[0-9a-f]+/); const meta = JSON.parse(parts[1].split('\r\n\r\n')[1].trim()); const n = add(meta.name, meta.parents[0]); files.get(n).data = Buffer.from(parts[2].split('\r\n\r\n')[1].replace(/\r\n$/, ''), 'latin1'); return send(200, view(files.get(n))); }
  if (req.method === 'POST' && !id) { const b = JSON.parse(raw.toString()); const n = add(b.name, b.parents[0], b.mimeType); return send(200, view(files.get(n))); }
  if (req.method === 'PATCH' && f && m[1]) { f.data = raw; return send(200, view(f)); }
  if (req.method === 'PATCH' && f) { const b = raw.length ? JSON.parse(raw.toString()) : {}; if (b.name) f.name = b.name; if (b.trashed) f.trashed = true; const add1 = u.searchParams.get('addParents'), rm = u.searchParams.get('removeParents'); if (add1) f.parents = f.parents.filter((p) => !(rm || '').split(',').includes(p)).concat(add1); return send(200, view(f)); }
  send(404, { error: { message: 'nope' } });
});
await new Promise((r) => google.listen(0, '127.0.0.1', r)); const gb = 'http://127.0.0.1:' + google.address().port;
tree.set('/dav-file.txt', { data: Buffer.from('from cloudreve'), m: Date.UTC(2026, 9, 1) });
const dav = await start();
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-gf-')); const port = 20000 + Math.floor(Math.random() * 20000);
const suite = path.join(root, 'test', 'fixtures', 'suite');
const srv = spawn('node', ['server/index.js'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, PORT: String(port), DATA_DIR: data, SUITE_DIR: fs.existsSync(suite) ? suite : (process.env.E2E_SUITE || suite), APP_PASSWORD: 'pw', SESSION_SECRET: 'x'.repeat(40), DAV_URL: `http://127.0.0.1:${dav.address().port}/dav`, DAV_USER: 'anand@example.com', DAV_PASSWORD: 'dav-secret', GOOGLE_CLIENT_ID: 'cid', GOOGLE_CLIENT_SECRET: 'sec', GDRIVE_API_BASE: gb, GOOGLE_OAUTH_TOKEN: gb + '/token', GOOGLE_OAUTH_AUTH: gb + '/auth' } });
let log = ''; srv.stdout.on('data', (d) => (log += d)); srv.stderr.on('data', (d) => (log += d));
const B = `http://127.0.0.1:${port}`;
for (let i = 0; i < 50; i++) { try { if ((await fetch(B + '/healthz')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
let pass = 0, failed = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { failed++; console.log('FAIL ' + n + '\n     ' + (e.stack || e).toString().split('\n').slice(0, 4).join('\n     ')); } };
let cookie = '';
const call = async (p, o = {}) => { const r = await fetch(B + p, { redirect: 'manual', ...o, headers: { 'x-aos': '1', cookie, ...(o.headers || {}) } }); return r; };
const fsx = async (op, b) => { const r = await call('/_local/fs/' + op, { method: 'POST', body: JSON.stringify(b), headers: { 'content-type': 'application/json' } }); const j = await r.json().catch(() => ({})); return { s: r.status, j }; };
const put = async (p, body) => call('/_local/fs/write?path=' + encodeURIComponent(p), { method: 'POST', body, headers: { 'content-type': 'text/plain' } });
try {
  const r = await fetch(B + '/auth/password', { method: 'POST', body: JSON.stringify({ password: 'pw' }), headers: { 'content-type': 'application/json', 'x-aos': '1' } }); cookie = r.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
  await t('OAuth asks for full Drive scope, uses an https redirect behind a proxy, and connects', async () => {
    const a = await call('/api/gdrive/auth', { headers: { 'x-forwarded-proto': 'https', host: 'os.example.com' } }); assert.equal(a.status, 302); const loc = new URL(a.headers.get('location'));
    assert.match(loc.searchParams.get('scope'), /auth\/drive(\s|$)/); assert.doesNotMatch(loc.searchParams.get('scope'), /readonly/);
    const st = await (await call('/api/gdrive/status')).json(); assert.equal(st.configured, true); assert.equal(st.connected, false);
    const cb = await call('/auth/google/callback?code=abc&state=' + encodeURIComponent(loc.searchParams.get('state'))); assert.equal(cb.status, 302); assert.match(cb.headers.get('location'), /^\/\?g=ok/);
    assert.equal((await (await call('/api/gdrive/status')).json()).connected, true);
  });
  await t('a failed sign-in comes back as a readable message, not raw JSON', async () => {
    const cb = await call('/auth/google/callback?code=abc&state=bad'); assert.equal(cb.status, 302); assert.match(cb.headers.get('location'), /^\/\?g=err&m=.+#settings/);
    const cb2 = await call('/auth/google/callback?error=access_denied'); assert.equal(cb2.status, 302); assert.match(decodeURIComponent(cb2.headers.get('location')), /g=err/);
  });
  await t('root lists Drive and Google Drive; Google folder lists with Office extension for Docs', async () => {
    const root0 = await fsx('readdir', { path: '/' }); const n = root0.j.map((x) => x.name); assert.ok(n.includes('Drive') && n.includes('Google Drive'), n.join());
    const l = await fsx('readdir', { path: '/Google Drive' }); const names = l.j.map((x) => x.name); assert.ok(names.includes('Clients') && names.includes('notes.txt') && names.some((x) => /^Quarter plan\.docx$/.test(x)), names.join());
    assert.equal((await fsx('readdir', { path: '/Google Drive/Clients' })).j[0].name, 'inner.txt');
    const g = await call('/_local/fs/get?path=' + encodeURIComponent('/Google Drive/notes.txt')); assert.equal(await g.text(), 'google text');
  });
  await t('make folder, upload, overwrite, rename', async () => {
    assert.equal((await fsx('mkdir', { path: '/Google Drive/New folder' })).s, 200); assert.equal((await fsx('mkdir', { path: '/Google Drive/New folder' })).s, 409);
    assert.equal((await put('/Google Drive/New folder/a.txt', 'one')).status, 200); assert.equal((await put('/Google Drive/New folder/a.txt', 'two')).status, 200);
    assert.equal(await (await call('/_local/fs/get?path=' + encodeURIComponent('/Google Drive/New folder/a.txt'))).text(), 'two');
    assert.equal((await fsx('readdir', { path: '/Google Drive/New folder' })).j.length, 1);
    const rn = await fsx('rename', { path: '/Google Drive/New folder/a.txt', name: 'b.txt' }); assert.equal(rn.j.name, 'b.txt');
    assert.equal((await fsx('stat', { path: '/Google Drive/New folder/a.txt' })).s, 404);
  });
  await t('move, copy and delete inside Google Drive', async () => {
    assert.equal((await fsx('move', { from: '/Google Drive/New folder/b.txt', to: '/Google Drive/Clients' })).s, 200);
    assert.deepEqual((await fsx('readdir', { path: '/Google Drive/Clients' })).j.map((x) => x.name).sort(), ['b.txt', 'inner.txt']);
    assert.equal((await fsx('copy', { from: '/Google Drive/Clients/b.txt', to: '/Google Drive/New folder/c.txt' })).s, 200);
    assert.equal(await (await call('/_local/fs/get?path=' + encodeURIComponent('/Google Drive/New folder/c.txt'))).text(), 'two');
    assert.equal((await fsx('delete', { path: '/Google Drive/New folder/c.txt' })).s, 200); assert.equal((await fsx('stat', { path: '/Google Drive/New folder/c.txt' })).s, 404);
    assert.ok([...files.values()].some((f) => f.name === 'c.txt' && f.trashed), 'moved to the Google trash, not erased');
  });
  await t('copy and move between Cloudreve Drive and Google Drive', async () => {
    assert.equal((await fsx('copy', { from: '/Drive/dav-file.txt', to: '/Google Drive/Clients' })).s, 200);
    assert.equal(await (await call('/_local/fs/get?path=' + encodeURIComponent('/Google Drive/Clients/dav-file.txt'))).text(), 'from cloudreve');
    assert.equal((await fsx('move', { from: '/Google Drive/Clients/b.txt', to: '/Drive' })).s, 200);
    assert.equal(await (await call('/_local/fs/get?path=' + encodeURIComponent('/Drive/b.txt'))).text(), 'two'); assert.equal((await fsx('stat', { path: '/Google Drive/Clients/b.txt' })).s, 404);
    assert.equal((await fsx('copy', { from: '/Google Drive/Clients', to: '/Drive/Clients copy' })).s, 200);
    assert.ok((await fsx('readdir', { path: '/Drive/Clients copy' })).j.some((x) => x.name === 'inner.txt'));
  });
} catch (e) { failed++; console.log('FAIL setup\n     ' + e.stack); }
srv.kill(); google.close(); dav.close();
console.log(`\n${pass} passed, ${failed} failed`); if (failed) { console.log(log.slice(-1500)); process.exit(1); }
process.exit(0);
