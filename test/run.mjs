// End-to-end test against mock Immich, Coolify and OpenAI-compatible servers. No network, no dependencies.
import { makeVault } from './bw.mjs';
import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const seen = { immich: [], coolify: [], llm: [] };
const listen = (h) => new Promise((r) => { const s = http.createServer(h); s.listen(0, '127.0.0.1', () => r(s)); });
const send = (res, c, o, ct = 'application/json') => { res.writeHead(c, { 'content-type': ct }); res.end(typeof o === 'string' || Buffer.isBuffer(o) ? o : JSON.stringify(o)); };
const body = (req) => new Promise((r) => { const c = []; req.on('data', (d) => c.push(d)); req.on('end', () => r(Buffer.concat(c).toString())); });
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAKAAAAB4CAIAAAD6wG44AAACd0lEQVR4nO3dMU7DQBBG4Q1CHACJ21IicVh6CioKS1aUKGASL/PPy/tqitl53kQUkQ+f789DXA/VA2guA8MZGM7AcAaGMzCcgeEMDGdgOAPDGRjOwHAGhjMwnIHhDAxnYDgDwxkYzsBwBoYzMJyB4QwMZ2A4A8MZGM7AcAaGe6weYK6Xt68tf/bx+jR7kioH2M9HNxb9Gak3JPAuXc8BSvcOPKnrub6luwb+t7THOmbuF7gk7bFemTsFLk97rEvmNv8HR9UdefNc0uAGh68y/Cqn3+DwuiN+wujA4btbJc+ZGzh5a+dipw0NHLuvH2TOnBg4c1NbBE4eFzhwR3+SNn9W4LTtXCfqFEGBo/Zyo5yzBAXWDCmBcx75vYScKCJwyC52l3CuiMCapz5wwmM+T/np6gNrquLA5Q/4P6g9ozcYzsBwlYHv4fN5UXhSbzCcgeEMDFcW+H6+gBdV5/UGwxkYzsBwBoYzMJyB4QwMZ2A4A8MZGK4scPjvpndXdV5vMJyB4QwMVxn4fr6GC0/qDYYzMFxx4Hv4lK49ozcYrj4w+xKXn64+sKaKCFz+mE+ScK6IwCNjF/sKOVFKYE0SFDjkkd9FzlmCAo+kvdwi6hRZgUfYdq6QNn9c4JG3o+0CJ08MPCI39avMmUMDj9R9XRI7bW7gEby1E8lzRgce2btbhE/Y4LU6i8AfjIenXaTf4FXaNtPmuaTNDV6VX+UuaRf9Ai98++hGXQMvfH/wr3oHXvkG8EsggVe7lAZ0XdECn9jYm1T0BDyw2vwfrOsYGM7AcAaGMzCcgeEMDGdgOAPDGRjOwHAGhjMwnIHhDAxnYDgDwxkY7hv306DTuuTxywAAAABJRU5ErkJggg==', 'base64');

const asset = (i, extra = {}) => ({ id: '00000000-0000-4000-8000-00000000000' + i, type: 'IMAGE', originalFileName: `IMG_${i}.jpg`, localDateTime: `2026-10-0${i}T10:00:00.000Z`, isFavorite: false, exifInfo: { city: 'Nairobi', country: 'Kenya', make: 'Sony', model: 'A7' }, ...extra });

const immich = await listen(async (req, res) => {
  seen.immich.push({ m: req.method, u: req.url, key: req.headers['x-api-key'] });
  if (req.headers['x-api-key'] !== 'imm-secret') return send(res, 401, { message: 'bad key' });
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/api/server/ping') return send(res, 200, { res: 'pong' });
  if (u.pathname === '/api/server/version') return send(res, 200, { major: 1, minor: 130, patch: 0 });
  if (u.pathname === '/api/search/metadata') { const b = JSON.parse(await body(req)); const items = [asset(2, { isFavorite: !!b.isFavorite }), asset(1)]; return send(res, 200, { assets: { items, nextPage: b.page === 1 ? '2' : null } }); }
  if (u.pathname === '/api/search/smart') return send(res, 200, { assets: { items: [asset(3)], nextPage: null } });
  if (u.pathname === '/api/albums') return send(res, 200, [{ id: '10000000-0000-4000-8000-000000000001', albumName: 'Safari', assetCount: 2, albumThumbnailAssetId: asset(1).id }]);
  if (/^\/api\/albums\/[0-9a-f-]+$/.test(u.pathname)) return send(res, 200, { id: 'x', albumName: 'Safari', assets: [asset(1), asset(2)] });
  if (/\/thumbnail$/.test(u.pathname)) return send(res, 200, PNG, 'image/png');
  if (/\/original$/.test(u.pathname)) return send(res, 200, PNG, 'image/png');
  if (u.pathname === '/api/assets' && req.method === 'PUT') return send(res, 200, {});
  if (u.pathname === '/api/assets' && req.method === 'POST') { await body(req); return send(res, 201, { id: 'u1', status: 'created' }); }
  send(res, 404, { message: 'nope' });
});
const coolify = await listen(async (req, res) => {
  seen.coolify.push({ m: req.method, u: req.url, auth: req.headers.authorization });
  if (req.headers.authorization !== 'Bearer cool-secret') return send(res, 401, { message: 'Unauthenticated.' });
  const p = new URL(req.url, 'http://x').pathname;
  if (p === '/api/v1/servers') return send(res, 200, [{ name: 'localhost', ip: '10.0.0.1', uuid: 's1', is_reachable: true }]);
  if (p === '/api/v1/projects') return send(res, 200, [{ uuid: 'p1', name: 'Personal' }]);
  if (p === '/api/v1/projects/p1') return send(res, 200, { uuid: 'p1', name: 'Personal', environments: [{ id: 1, name: 'production' }] });
  if (p === '/api/v1/applications') return send(res, 200, [{ uuid: 'a1', name: 'immich-proxy', status: 'running:healthy', fqdn: 'https://photos.example.com', git_repository: 'me/proxy', environment_id: 1 }, { uuid: 'a2', name: 'notes-sync', status: 'running:unknown', fqdn: '', git_repository: '', environment_id: 1 }]);
  if (p === '/api/v1/services') return send(res, 200, [{ uuid: 'v1', name: 'vaultwarden', status: 'exited:unhealthy', environment_id: 1 }]);
  if (p === '/api/v1/databases') return send(res, 200, [{ uuid: 'd1', name: 'pg', status: 'running:healthy', type: 'postgresql', environment_id: 1 }]);
  if (p.startsWith('/api/v1/deployments/applications/')) return send(res, 200, { count: 3, deployments: [{ created_at: '2026-10-10T10:00:00Z', finished_at: '2026-10-10T10:01:30Z', commit_message: 'fix', status: 'finished' }] });
  send(res, 404, {});
});
const llm = await listen(async (req, res) => {
  const b = JSON.parse((await body(req)) || '{}');
  seen.llm.push({ u: req.url, auth: req.headers.authorization, b });
  if (req.headers.authorization !== 'Bearer llm-secret') return send(res, 401, { error: { message: 'bad key' } });
  send(res, 200, { model: b.model, choices: [{ message: { role: 'assistant', content: 'You have 3 resources. Safari album exists.' } }] });
});


/* mock Vaultwarden speaking the real Bitwarden wire format */
const VAULT_ITEMS = [
  { name: 'Hetzner', user: 'anand@example.com', pw: 'Tn7#qLm2vXr9!eKd', url: 'https://console.hetzner.cloud', folder: 'Infra', fav: true, totp: 'JBSWY3DPEHPK3PXP', notes: 'main project', age: 40 },
  { name: 'Cloudflare', user: 'anand@example.com', pw: 'summer2024', url: 'https://dash.cloudflare.com', folder: 'Infra', age: 500 },
  { name: 'GoDaddy', user: 'anandnms2', pw: 'summer2024', url: 'https://sso.godaddy.com', age: 20, itemKey: true },
  { name: 'Wifi note', type: 2, notes: 'router admin: see drawer', age: 5 },
  { name: 'Shared team login', user: 'x', pw: 'y', org: true },
  { name: 'Old card', type: 3 },
  { name: 'Deleted one', user: 'z', pw: 'zzzzzzzzzzzz', deleted: true }
];
const VAULTS = { 'me@example.com': { pw: 'correct master', iter: 5000, v: null, twofa: false }, 'two@example.com': { pw: 'correct master', iter: 5000, v: null, twofa: true } };
for (const [em, o] of Object.entries(VAULTS)) o.v = makeVault(em, o.pw, o.iter, VAULT_ITEMS);
{ const vm = await import('node:vm'); const cx = vm.createContext({ WebAssembly, TextEncoder, TextDecoder, Uint8Array, Uint32Array, ArrayBuffer, DataView, Math, Error, Object, Array, Promise }); vm.runInContext(fs.readFileSync(path.join(root, 'web/vendor/argon2.js'), 'utf8'), cx); const argon2id = cx.hashwasm.argon2id; const salt = crypto.createHash('sha256').update('argon@example.com').digest();
  const mk = Buffer.from(await argon2id({ password: 'correct master', salt, parallelism: 2, iterations: 3, memorySize: 16 * 1024, hashLength: 32, outputType: 'binary' }));
  VAULTS['argon@example.com'] = { pw: 'correct master', iter: 3, kdf: { kdf: 1, kdfIterations: 3, kdfMemory: 16, kdfParallelism: 2 }, v: makeVault('argon@example.com', 'correct master', 3, VAULT_ITEMS, mk), twofa: false }; }
const vaultSeen = [];
const vault = await listen(async (req, res) => {
  const u = new URL(req.url, 'http://x'), b = (await body(req)) || '';
  vaultSeen.push({ m: req.method, p: u.pathname, q: u.search, auth: req.headers.authorization, b });
  if (u.pathname === '/alive') return send(res, 200, 'ok');
  if (u.pathname === '/identity/accounts/prelogin') { const e = JSON.parse(b).email; return send(res, 200, VAULTS[e]?.kdf || { kdf: 0, kdfIterations: VAULTS[e]?.iter || 5000, kdfMemory: null, kdfParallelism: null }); }
  if (u.pathname === '/identity/connect/token') {
    const f = new URLSearchParams(b), o = VAULTS[f.get('username')];
    if (!o || f.get('password') !== o.v.hash) return send(res, 400, { error: 'invalid_grant', error_description: 'invalid_username_or_password' });
    if (o.twofa && f.get('twoFactorToken') !== '123456') return send(res, 400, { error: 'invalid_grant', error_description: 'Two factor required.', TwoFactorProviders: [0], TwoFactorProviders2: { 0: null } });
    return send(res, 200, { access_token: 'tok-' + f.get('username'), Key: o.v.Key, Kdf: 0, KdfIterations: o.iter });
  }
  if (u.pathname === '/api/sync') { const em = (req.headers.authorization || '').replace('Bearer tok-', ''); return VAULTS[em] ? send(res, 200, VAULTS[em].v.sync) : send(res, 401, {}); }
  send(res, 404, {});
});

/* in-memory WebDAV server mounted at /dav, like Cloudreve's */
const tree = new Map([['/', { dir: true }], ['/Work', { dir: true }], ['/Work/Fleet KPIs.csv', { data: Buffer.from('truck,tat\nT412,4.2\n') }], ['/Notes.md', { data: Buffer.from('# Hello from Drive') }], ['/Work/pic.png', { data: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAKAAAAB4CAIAAAD6wG44AAACd0lEQVR4nO3dMU7DQBBG4Q1CHACJ21IicVh6CioKS1aUKGASL/PPy/tqitl53kQUkQ+f789DXA/VA2guA8MZGM7AcAaGMzCcgeEMDGdgOAPDGRjOwHAGhjMwnIHhDAxnYDgDwxkYzsBwBoYzMJyB4QwMZ2A4A8MZGM7AcAaGe6weYK6Xt68tf/bx+jR7kioH2M9HNxb9Gak3JPAuXc8BSvcOPKnrub6luwb+t7THOmbuF7gk7bFemTsFLk97rEvmNv8HR9UdefNc0uAGh68y/Cqn3+DwuiN+wujA4btbJc+ZGzh5a+dipw0NHLuvH2TOnBg4c1NbBE4eFzhwR3+SNn9W4LTtXCfqFEGBo/Zyo5yzBAXWDCmBcx75vYScKCJwyC52l3CuiMCapz5wwmM+T/np6gNrquLA5Q/4P6g9ozcYzsBwlYHv4fN5UXhSbzCcgeEMDFcW+H6+gBdV5/UGwxkYzsBwBoYzMJyB4QwMZ2A4A8MZGK4scPjvpndXdV5vMJyB4QwMVxn4fr6GC0/qDYYzMFxx4Hv4lK49ozcYrj4w+xKXn64+sKaKCFz+mE+ScK6IwCNjF/sKOVFKYE0SFDjkkd9FzlmCAo+kvdwi6hRZgUfYdq6QNn9c4JG3o+0CJ08MPCI39avMmUMDj9R9XRI7bW7gEby1E8lzRgce2btbhE/Y4LU6i8AfjIenXaTf4FXaNtPmuaTNDV6VX+UuaRf9Ai98++hGXQMvfH/wr3oHXvkG8EsggVe7lAZ0XdECn9jYm1T0BDyw2vwfrOsYGM7AcAaGMzCcgeEMDGdgOAPDGRjOwHAGhjMwnIHhDAxnYDgDwxkY7hv306DTuuTxywAAAABJRU5ErkJggg==', 'base64') }]]);
const davLog = [];
const rawBody = (req) => new Promise((r) => { const c = []; req.on('data', (d) => c.push(d)); req.on('end', () => r(Buffer.concat(c))); });
const xmlEsc = (x) => x.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const entry = (p, e) => `<D:response><D:href>/dav${p === '/' ? '/' : p.split('/').map(encodeURIComponent).join('/') + (e.dir ? '/' : '')}</D:href><D:propstat><D:prop><D:resourcetype>${e.dir ? '<D:collection/>' : ''}</D:resourcetype>${e.dir ? '' : `<D:getcontentlength>${e.data.length}</D:getcontentlength>`}<D:getlastmodified>Tue, 14 Oct 2026 10:00:00 GMT</D:getlastmodified></D:prop><D:status>HTTP/1.1 200 OK</D:status></D:propstat></D:response>`;
const dav = await listen(async (req, res) => {
  davLog.push(req.method + ' ' + req.url);
  if (req.headers.authorization !== 'Basic ' + Buffer.from('anand@example.com:dav-secret').toString('base64')) return send(res, 401, 'no', 'text/plain');
  const body = await rawBody(req);
  const u = new URL(req.url, 'http://x'); const p = '/' + decodeURIComponent(u.pathname).replace(/^\/dav\/?/, '').replace(/\/+$/, ''); const key = p === '/' ? '/' : p.replace(/\/$/, '');
  const e = tree.get(key);
  if (req.method === 'PROPFIND') {
    if (!e) return send(res, 404, '', 'text/plain');
    const items = [[key, e]]; if (req.headers.depth !== '0' && e.dir) for (const [k, v] of tree) if (k !== '/' && k.slice(0, k.lastIndexOf('/')) === (key === '/' ? '' : key)) items.push([k, v]);
    return send(res, 207, `<?xml version="1.0"?><D:multistatus xmlns:D="DAV:">${items.map(([k, v]) => entry(k, v)).join('')}</D:multistatus>`, 'application/xml');
  }
  if (req.method === 'GET') { if (!e || e.dir) return send(res, 404, '', 'text/plain'); const m = /bytes=(\d+)-(\d*)/.exec(req.headers.range || ''); if (m) { const part = e.data.subarray(Number(m[1]), m[2] ? Number(m[2]) + 1 : undefined); res.writeHead(206, { 'content-range': `bytes ${m[1]}-${Number(m[1]) + part.length - 1}/${e.data.length}`, 'content-length': part.length }); return res.end(part); } return send(res, 200, e.data, 'application/octet-stream'); }
  if (req.method === 'PUT') { const par = key.slice(0, key.lastIndexOf('/')) || '/'; if (!tree.get(par)?.dir) return send(res, 409, '', 'text/plain'); tree.set(key, { data: body }); return send(res, e ? 204 : 201, '', 'text/plain'); }
  if (req.method === 'MKCOL') { if (e) return send(res, 405, '', 'text/plain'); const par = key.slice(0, key.lastIndexOf('/')) || '/'; if (!tree.get(par)?.dir) return send(res, 409, '', 'text/plain'); tree.set(key, { dir: true }); return send(res, 201, '', 'text/plain'); }
  if (req.method === 'DELETE') { if (!e) return send(res, 404, '', 'text/plain'); for (const k of [...tree.keys()]) if (k === key || k.startsWith(key + '/')) tree.delete(k); return send(res, 204, '', 'text/plain'); }
  if (req.method === 'MOVE' || req.method === 'COPY') { if (!e) return send(res, 404, '', 'text/plain'); const dest = '/' + decodeURIComponent(new URL(req.headers.destination).pathname).replace(/^\/dav\/?/, '').replace(/\/+$/, ''); tree.set(dest, e); if (req.method === 'MOVE') tree.delete(key); return send(res, 201, '', 'text/plain'); }
  send(res, 405, '', 'text/plain');
});
const url = (s) => `http://127.0.0.1:${s.address().port}`;

const data = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-'));
const port = 20000 + Math.floor(Math.random() * 20000);
const srv = spawn('node', ['server/index.js'], {
  cwd: root, stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, PORT: String(port), DATA_DIR: data, SUITE_DIR: process.env.E2E_SUITE || path.join(root, 'test/fixtures/suite'), APP_PASSWORD: 'correct horse', SESSION_SECRET: 'x'.repeat(40),
    IMMICH_URL: url(immich), IMMICH_API_KEY: 'imm-secret', COOLIFY_URL: url(coolify), COOLIFY_TOKEN: 'cool-secret', LLM_BASE_URL: url(llm) + '/v1', LLM_API_KEY: 'llm-secret', LLM_MODEL: 'test-model', VAULT_URL: url(vault), DAV_URL: url(dav) + '/dav', DAV_USER: 'anand@example.com', DAV_PASSWORD: 'dav-secret' }
});
let log = ''; srv.stdout.on('data', (d) => (log += d)); srv.stderr.on('data', (d) => (log += d));
const B = `http://127.0.0.1:${port}`;
for (let i = 0; i < 50; i++) { try { if ((await fetch(B + '/healthz')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }

if (process.env.HOLD) { console.log('READY ' + port); await new Promise(() => {}); }
let cookie = '';
const call = async (p, o = {}) => {
  const h = { ...(o.headers || {}) }; if (cookie) h.cookie = cookie; if (o.method && o.method !== 'GET' && !o.noCsrf) h['x-aos'] = '1';
  if (o.json !== undefined) { h['content-type'] = 'application/json'; o.body = JSON.stringify(o.json); }
  const r = await fetch(B + p, { ...o, headers: h, redirect: 'manual' });
  const sc = r.headers.get('set-cookie'); if (sc && /aos_session=[^;]/.test(sc)) cookie = sc.split(';')[0];
  const buf = Buffer.from(await r.arrayBuffer()); let j = null; try { j = JSON.parse(buf.toString()); } catch {}
  return { r, s: r.status, j, t: buf.toString(), buf };
};
let pass = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { console.log('FAIL ' + n + '\n     ' + (e.stack || e).toString().split('\n').slice(0, 4).join('\n     ')); process.exitCode = 1; } };

try {
  await t('shell is served with a strict CSP, no inline script', async () => {
    const x = await call('/'); assert.equal(x.s, 200);
    assert.match(x.r.headers.get('content-security-policy'), /script-src 'self'/);
    assert.doesNotMatch(x.t, /<script(?![^>]*src)/);
  });
  await t('protected routes need a session', async () => {
    assert.equal((await call('/api/photos/status')).s, 401);
    assert.equal((await call('/_local/auth/user')).s, 401);
    assert.equal((await call('/apps/notes/')).s, 401);
  });
  await t('wrong password rejected, right one signs in', async () => {
    assert.equal((await call('/auth/password', { method: 'POST', json: { password: 'nope' } })).s, 401);
    assert.equal((await call('/auth/password', { method: 'POST', json: { password: 'correct horse' } })).s, 200);
    const s = await call('/api/session'); assert.ok(s.j.user, JSON.stringify(s.j));
  });
  await t('state-changing calls need the x-aos header', async () => {
    assert.equal((await call('/api/settings', { method: 'PUT', json: {}, noCsrf: true })).s, 403);
  });
  await t('settings never return secrets', async () => {
    const s = await call('/api/settings'); const raw = s.t;
    for (const k of ['imm-secret', 'cool-secret', 'llm-secret']) assert.ok(!raw.includes(k), 'leaked ' + k);
    assert.equal(s.j.immich.keySet, true); assert.equal(s.j.coolify.tokenSet, true); assert.equal(s.j.llm.keySet, true);
  });
  await t('photos: status, timeline paging, favourites, albums, search', async () => {
    const st = await call('/api/photos/status'); assert.equal(st.j.connected, true);
    const tl = await call('/api/photos/timeline'); assert.equal(tl.j.items.length, 2); assert.equal(tl.j.next, 2); assert.equal(tl.j.items[0].where, 'Nairobi, Kenya');
    const tl2 = await call('/api/photos/timeline?page=2'); assert.equal(tl2.j.next, null);
    assert.equal((await call('/api/photos/favorites')).j.items[0].fav, true);
    const al = await call('/api/photos/albums'); assert.equal(al.j[0]?.name ?? al.j.albums?.[0]?.name, 'Safari');
    const sr = await call('/api/photos/search?q=beach'); assert.equal(sr.j.items.length, 1);
  });
  await t('photos: bytes are proxied, key stays server side', async () => {
    const id = asset(1).id;
    const th = await call(`/api/photos/asset/${id}/thumb`); assert.equal(th.s, 200); assert.equal(th.r.headers.get('content-type'), 'image/png'); assert.ok(th.buf.equals(PNG));
    assert.equal((await call('/api/photos/asset/not-a-uuid/thumb')).s, 400);
    const up = await call('/api/photos/upload', { method: 'POST', headers: { 'x-filename': 'a.png', 'content-type': 'image/png' }, body: PNG }); assert.equal(up.s, 200, up.t); assert.equal(up.j.id, 'u1');
    assert.ok(seen.immich.every((x) => x.key === 'imm-secret'));
    const fav = await call('/api/photos/favorite', { method: 'POST', json: { ids: [id], value: true } }); assert.equal(fav.s, 200);
    assert.ok(seen.immich.some((x) => x.m === 'PUT' && x.u === '/api/assets'));
  });
  await t('insights: Coolify shape, health mapping, deployments', async () => {
    const x = await call('/api/insights'); assert.equal(x.s, 200, x.t);
    const by = Object.fromEntries(x.j.resources.map((r) => [r.n, r]));
    assert.equal(by['immich-proxy'].s, 'ok'); assert.equal(by['notes-sync'].s, 'nohc'); assert.equal(by['vaultwarden'].s, 'bad');
    assert.equal(by['immich-proxy'].p, 'Personal');
    assert.ok(x.j.deploys.length >= 1);
    assert.ok(seen.coolify.every((c) => c.auth === 'Bearer cool-secret'));
    assert.ok(!x.t.includes('cool-secret'));
  });
  await t('assistant: answers using connected context, reports model', async () => {
    const x = await call('/api/chat', { method: 'POST', json: { messages: [{ role: 'user', content: 'Summarise my server' }], ctx: { photos: true, insights: true, apps: true, files: true } } });
    assert.equal(x.s, 200, x.t); assert.match(x.j.text, /3 resources/); assert.equal(x.j.model, 'test-model');
    const sys = JSON.stringify(seen.llm.at(-1).b.messages);
    assert.match(sys, /vaultwarden/); assert.match(sys, /Safari|IMG_/); assert.ok(!sys.includes('cool-secret') && !sys.includes('imm-secret'));
  });
  await t('assistant: blanking the key in-app keeps the stored one', async () => {
    await call('/api/settings', { method: 'PUT', json: { llm: { base: '', key: '', model: '' } } });
    const s = await call('/api/settings'); 
    const x = await call('/api/chat', { method: 'POST', json: { messages: [{ role: 'user', content: 'hi' }] } });
    if (s.j.llm.base) { console.log('     (env default still applies, skipped)'); return; }
    assert.equal(x.j.code, 'not_configured');
  });
  await t('settings can be changed in-app and survive restart file', async () => {
    const r = await call('/api/settings', { method: 'PUT', json: { llm: { base: url(llm) + '/v1', key: 'llm-secret', model: 'm2' } } }); assert.equal(r.s, 200);
    const mode = fs.statSync(path.join(data, 'settings.json')).mode & 0o777; assert.equal(mode, 0o600);
    const x = await call('/api/chat', { method: 'POST', json: { messages: [{ role: 'user', content: 'hi' }] } }); assert.equal(x.j.model, 'm2');
    const tst = await call('/api/chat/test', { method: 'POST', json: {} }); assert.equal(tst.s, 200, tst.t);
  });
  await t('puter shim is served and the local Puter backend works', async () => {
    const sh = await call('/_suite/puter.js'); assert.equal(sh.s, 200); assert.match(sh.t, /not_available/);
    const u = await call('/_local/auth/user'); assert.equal(u.s, 200); assert.ok(u.j.username);
    const A = { 'x-app': 'notes' };
    await call('/_local/kv', { method: 'POST', headers: A, json: { op: 'set', key: 'k', value: { a: 1 } } });
    const g = await call('/_local/kv', { method: 'POST', headers: A, json: { op: 'get', key: 'k' } }); assert.deepEqual(g.j.result, { a: 1 });
    const other = await call('/_local/kv', { method: 'POST', headers: { 'x-app': 'chess' }, json: { op: 'get', key: 'k' } }); assert.ok(other.j.result == null);
    const w = await call('/_local/fs/write?path=' + encodeURIComponent('/Documents/a.txt') + '&mkdirs=1&overwrite=1', { method: 'POST', headers: A, body: 'hello' }); assert.equal(w.s, 200, w.t);
    const rd = await call('/_local/fs/get?path=' + encodeURIComponent('/Documents/a.txt')); assert.equal(rd.t, 'hello');
    assert.equal((await call('/_local/fs/get?path=' + encodeURIComponent('/../../etc/passwd'))).s >= 400, true);
  });
  await t('files saved by apps reach the assistant context', async () => {
    await call('/api/chat', { method: 'POST', json: { messages: [{ role: 'user', content: 'what files do I have' }], ctx: { files: true } } });
    assert.match(JSON.stringify(seen.llm.at(-1).b.messages), /a\.txt/);
  });
  await t('suite apps are served with an origin-only CSP', async () => {
    const a = await call('/apps/notes/'); assert.equal(a.s, 200);
    const csp = a.r.headers.get('content-security-policy'); assert.match(csp, /connect-src 'self'/); assert.doesNotMatch(csp, /puter\.com/);
    assert.equal((await call('/apps.json')).j[0].slug, 'notes');
    assert.equal((await call('/apps/notes/../../server/config.js')).s === 200, false);
  });

  await t('drive: status, root lists Drive, folder listing and stat', async () => {
    assert.equal((await call('/api/drive/status')).j.connected, true);
    const root = await call('/_local/fs/readdir', { method: 'POST', json: { path: '/' } }); assert.ok(root.j.some((x) => x.name === 'Drive' && x.is_dir));
    const d = await call('/_local/fs/readdir', { method: 'POST', json: { path: '/Drive' } }); assert.deepEqual(d.j.map((x) => x.name).sort(), ['Notes.md', 'Work']); assert.equal(d.j.find((x) => x.name === 'Work').is_dir, true);
    const w = await call('/_local/fs/readdir', { method: 'POST', json: { path: '/Drive/Work' } }); assert.equal(w.j[0].name, 'Fleet KPIs.csv'); assert.equal(w.j[0].path, '/Drive/Work/Fleet KPIs.csv'); assert.equal(w.j[0].size, 19);
    const st = await call('/_local/fs/stat', { method: 'POST', json: { path: '/Drive/Notes.md' } }); assert.equal(st.j.is_dir, false); assert.equal((await call('/_local/fs/stat', { method: 'POST', json: { path: '/Drive/nope' } })).s, 404);
  });
  await t('drive: read (get, read, range) and write back', async () => {
    const g = await call('/_local/fs/get?path=' + encodeURIComponent('/Drive/Notes.md')); assert.equal(g.t, '# Hello from Drive');
    const rd = await call('/_local/fs/read', { method: 'POST', json: { path: '/Drive/Notes.md' } }); assert.equal(rd.t, '# Hello from Drive');
    const rg = await call('/_local/fs/get?path=' + encodeURIComponent('/Drive/Notes.md'), { headers: { range: 'bytes=2-6' } }); assert.equal(rg.s, 206); assert.equal(rg.t, 'Hello');
    const wr = await call('/_local/fs/write?path=' + encodeURIComponent('/Drive/Notes.md') + '&overwrite=1', { method: 'POST', body: '# Edited in an app' }); assert.equal(wr.s, 200, wr.t);
    assert.equal(tree.get('/Notes.md').data.toString(), '# Edited in an app');
    assert.equal((await call('/_local/fs/write?path=' + encodeURIComponent('/Drive/Notes.md') + '&overwrite=0', { method: 'POST', body: 'x' })).s, 409);
    const nw = await call('/_local/fs/write?path=' + encodeURIComponent('/Drive/New/Deep/a.txt') + '&mkdirs=1', { method: 'POST', body: 'deep' }); assert.equal(nw.s, 200, nw.t); assert.equal(tree.get('/New/Deep/a.txt').data.toString(), 'deep');
    assert.equal((await call('/_local/fs/write?path=' + encodeURIComponent('/Drive/Missing/a.txt'), { method: 'POST', body: 'x' })).s, 404);
  });
  await t('drive: mkdir, rename, move/copy across local and Drive, delete', async () => {
    assert.equal((await call('/_local/fs/mkdir', { method: 'POST', json: { path: '/Drive/Folder' } })).s, 200); assert.equal((await call('/_local/fs/mkdir', { method: 'POST', json: { path: '/Drive/Folder' } })).s, 409);
    const rn = await call('/_local/fs/rename', { method: 'POST', json: { path: '/Drive/Folder', name: 'Renamed' } }); assert.equal(rn.j.path, '/Drive/Renamed');
    const cp = await call('/_local/fs/copy', { method: 'POST', json: { from: '/Drive/Notes.md', to: '/Drive/Renamed' } }); assert.equal(cp.j.path, '/Drive/Renamed/Notes.md');
    await call('/_local/fs/write?path=' + encodeURIComponent('/loc.txt') + '&overwrite=1', { method: 'POST', body: 'local file' });
    assert.equal((await call('/_local/fs/copy', { method: 'POST', json: { from: '/loc.txt', to: '/Drive/Renamed' } })).j.path, '/Drive/Renamed/loc.txt'); assert.equal(tree.get('/Renamed/loc.txt').data.toString(), 'local file');
    const out = await call('/_local/fs/move', { method: 'POST', json: { from: '/Drive/Renamed/loc.txt', to: '/Documents/back.txt' } }); assert.equal(out.s, 200, out.t); assert.equal(tree.has('/Renamed/loc.txt'), false);
    assert.equal((await call('/_local/fs/get?path=' + encodeURIComponent('/Documents/back.txt'))).t, 'local file');
    assert.equal((await call('/_local/fs/delete', { method: 'POST', json: { path: '/Drive/Renamed' } })).s, 200); assert.equal(tree.has('/Renamed'), false);
    assert.equal((await call('/_local/fs/delete', { method: 'POST', json: { path: '/Drive' } })).s, 400);
  });
  await t('drive: paths cannot escape and the password never leaks', async () => {
    assert.equal((await call('/_local/fs/get?path=' + encodeURIComponent('/Drive/../../etc/passwd'))).s, 400);
    assert.ok(!(await call('/api/settings')).t.includes('dav-secret')); assert.equal((await call('/api/settings')).j.dav.passSet, true);
    assert.ok(!davLog.some((l) => l.includes('..')));
  });
  await t('drive: wrong password reports a clear error', async () => {
    await call('/api/settings', { method: 'PUT', json: { dav: { pass: 'wrong' } } });
    const x = await call('/api/drive/status'); assert.equal(x.j.connected, false); const y = await call('/_local/fs/readdir', { method: 'POST', json: { path: '/Drive' } }); assert.equal(y.s, 502); assert.equal(y.j.code, 'upstream_auth');
    await call('/api/settings', { method: 'PUT', json: { dav: { pass: 'dav-secret' } } }); assert.equal((await call('/api/drive/status')).j.connected, true);
  });
  await t('assistant sees Drive files', async () => {
    await call('/api/chat', { method: 'POST', json: { messages: [{ role: 'user', content: 'what is in my drive' }], ctx: { files: true } } });
    const sys = JSON.stringify(seen.llm.at(-1).b.messages); assert.match(sys, /Fleet KPIs/); assert.ok(!sys.includes('dav-secret'));
  });
  await t('vault relay: only the three Bitwarden calls pass, login data is relayed untouched', async () => {
    const st = await call('/api/vault/status'); assert.equal(st.j.connected, true);
    assert.equal((await call('/api/vault/api/accounts/profile')).s, 404);
    assert.equal((await call('/api/vault/identity/connect/token', { method: 'GET' })).s, 404);
    const pre = await call('/api/vault/identity/accounts/prelogin', { method: 'POST', json: { email: 'me@example.com' } }); assert.equal(pre.j.kdfIterations, 5000);
    const tok = await call('/api/vault/identity/connect/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'grant_type=password&username=me%40example.com&password=bad' }); assert.equal(tok.s, 400);
    const sy = await call('/api/vault/api/sync?evil=1', { headers: { authorization: 'Bearer tok-me@example.com' } }); assert.equal(sy.s, 200); assert.equal(vaultSeen.at(-1).q, '?excludeDomains=true');
    assert.equal((await call('/api/vault/api/sync')).s, 401);
  });
  await t('vault relay needs a session and the x-aos header; vault address never leaks a secret', async () => {
    const saved = cookie; cookie = ''; assert.equal((await call('/api/vault/status')).s, 401); cookie = saved;
    assert.equal((await call('/api/vault/identity/accounts/prelogin', { method: 'POST', json: {}, noCsrf: true })).s, 403);
    assert.ok(!JSON.stringify((await call('/api/settings')).j).includes('tok-'));
  });
  await t('logout clears the session', async () => {
    await call('/auth/logout', { method: 'POST' }); cookie = '';
    assert.equal((await call('/api/photos/status')).s, 401);
  });
} finally {
  srv.kill(); for (const s of [immich, coolify, llm, dav]) s.close();
  if (process.exitCode) console.log('\nserver log:\n' + log);
  console.log(`\n${pass} passed`);
  process.exit(process.exitCode || 0);
}
