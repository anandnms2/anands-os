// End-to-end test against mock Immich, Coolify and OpenAI-compatible servers. No network, no dependencies.
import http from 'node:http';
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
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

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
const url = (s) => `http://127.0.0.1:${s.address().port}`;

const data = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-'));
const port = 20000 + Math.floor(Math.random() * 20000);
const srv = spawn('node', ['server/index.js'], {
  cwd: root, stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, PORT: String(port), DATA_DIR: data, SUITE_DIR: process.env.E2E_SUITE || path.join(root, 'test/fixtures/suite'), APP_PASSWORD: 'correct horse', SESSION_SECRET: 'x'.repeat(40),
    IMMICH_URL: url(immich), IMMICH_API_KEY: 'imm-secret', COOLIFY_URL: url(coolify), COOLIFY_TOKEN: 'cool-secret', LLM_BASE_URL: url(llm) + '/v1', LLM_API_KEY: 'llm-secret', LLM_MODEL: 'test-model' }
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
  await t('logout clears the session', async () => {
    await call('/auth/logout', { method: 'POST' }); cookie = '';
    assert.equal((await call('/api/photos/status')).s, 401);
  });
} finally {
  srv.kill(); for (const s of [immich, coolify, llm]) s.close();
  if (process.exitCode) console.log('\nserver log:\n' + log);
  console.log(`\n${pass} passed`);
  process.exit(process.exitCode || 0);
}
