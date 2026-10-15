// More Immich in Photos: server routes (people, places, archive, trash, albums, links, tags, find, download, pass-through) and the UI (select bar, tabs). Mock Immich.
import { spawn } from 'node:child_process';
import http from 'node:http'; import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { PNG } from './png.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let chromium = null; for (const base of [root + '/', '/opt/npm-tools/node_modules/']) { try { chromium = createRequire(base)('playwright').chromium; break; } catch {} }
const ID = (i) => '00000000-0000-4000-8000-00000000000' + i, PID = '20000000-0000-4000-8000-000000000001', AL = '10000000-0000-4000-8000-000000000001';
const asset = (i, e = {}) => ({ id: ID(i), type: 'IMAGE', originalFileName: `IMG_${i}.jpg`, localDateTime: `2026-10-0${i}T10:00:00.000Z`, isFavorite: false, exifInfo: { city: 'Arusha', country: 'Tanzania', make: 'Canon', model: 'R5', fileSizeInByte: 1000 * i }, ...e });
const calls = []; let archivedIds = [];
const imm = http.createServer(async (req, res) => {
  const c = []; for await (const d of req) c.push(d); const raw = Buffer.concat(c).toString(); const b = raw ? (() => { try { return JSON.parse(raw); } catch { return raw; } })() : null; const u = new URL(req.url, 'http://x'); calls.push({ m: req.method, p: u.pathname, b });
  const send = (code, o, ct = 'application/json') => { res.writeHead(code, { 'content-type': ct }); res.end(Buffer.isBuffer(o) || typeof o === 'string' ? o : JSON.stringify(o)); };
  if (req.headers['x-api-key'] !== 'k') return send(401, { message: 'bad key' });
  const p = u.pathname;
  if (p === '/api/server/ping') return send(200, { res: 'pong' }); if (p === '/api/server/version') return send(200, { major: 1, minor: 130, patch: 0 });
  if (p === '/api/search/metadata') { if (b.visibility === 'timeline' || (!b.visibility && !b.isArchived && !b.withDeleted && !b.personIds && !b.city)) return send(200, { assets: { items: [asset(1), asset(2), asset(3)], nextPage: null } }); if (b.visibility === 'archive') return send(400, { message: ['visibility unsupported'] }); if (b.isArchived) return send(200, { assets: { items: [asset(4)], nextPage: null } }); if (b.withDeleted) return send(200, { assets: { items: [asset(5, { isTrashed: true, deletedAt: 'x' })], nextPage: null } }); if (b.personIds) return send(200, { assets: { items: [asset(2)], nextPage: null } }); return send(200, { assets: { items: [asset(3)], nextPage: null } }); }
  if (p === '/api/search/smart') return send(200, { assets: { items: [asset(1)], nextPage: null } });
  if (p === '/api/search/cities') return send(200, [asset(1), asset(2)]);
  if (p === '/api/people') return send(200, { people: [{ id: PID, name: 'Amina', isHidden: false }], hasNextPage: false, total: 1 });
  if (p === '/api/people/' + PID && req.method === 'PUT') return send(200, { id: PID, name: b.name });
  if (p === '/api/people/' + PID + '/thumbnail') return send(200, PNG, 'image/png');
  if (p === '/api/assets' && req.method === 'PUT') { if (b.visibility) return send(400, { message: ['property visibility should not exist'] }); archivedIds = b.ids; return send(200, {}); }
  if (p === '/api/assets' && req.method === 'DELETE') return send(204, '');
  if (p === '/api/trash/restore/assets' || p === '/api/trash/empty') return send(200, { count: 1 });
  if (p === '/api/albums' && req.method === 'POST') return send(201, { id: AL, albumName: b.albumName });
  if (p === '/api/albums' && req.method === 'GET') return send(200, [{ id: AL, albumName: 'Safari', assetCount: 2, albumThumbnailAssetId: ID(1) }]);
  if (p === '/api/albums/' + AL + '/assets') return send(200, (b.ids || []).map((id) => ({ id, success: true })));
  if (p === '/api/albums/' + AL && req.method === 'GET') return send(200, { id: AL, albumName: 'Safari', albumUsers: [], assets: [asset(1)], owner: { id: 'o', name: 'Me' } });
  if (p === '/api/albums/' + AL + '/users') return send(200, {});
  if (p === '/api/albums/' + AL) return send(200, {});
  if (p === '/api/shared-links' && req.method === 'POST') return send(201, { id: '40000000-0000-4000-8000-000000000001', key: 'abc', type: b.type, allowDownload: b.allowDownload, assets: [], createdAt: '2026-10-10T00:00:00Z', expiresAt: b.expiresAt });
  if (p === '/api/shared-links') return send(200, [{ id: '40000000-0000-4000-8000-000000000001', key: 'abc', type: 'ALBUM', album: { id: AL, albumName: 'Safari' }, assets: [], allowDownload: true, createdAt: '2026-10-10T00:00:00Z' }]);
  if (p === '/api/shared-links/40000000-0000-4000-8000-000000000001') return send(200, {});
  if (p === '/api/tags' && req.method === 'GET') return send(200, []); if (p === '/api/tags' && req.method === 'POST') return send(201, { id: 'tg1', value: b.name });
  if (p === '/api/tags/assets') return send(200, {});
  if (p === '/api/memories') return send(200, [{ id: 'm1', data: { year: 2024 }, memoryAt: '2026-10-15', assets: [asset(1), asset(2)] }]);
  if (p === '/api/duplicates') return send(200, [{ duplicateId: '50000000-0000-4000-8000-000000000001', assets: [asset(1), asset(2)] }]);
  if (p === '/api/duplicates/50000000-0000-4000-8000-000000000001') return send(200, {});
  if (p === '/api/assets/statistics') return send(200, { images: 3, videos: 1, total: 4 });
  if (p === '/api/users') return send(200, [{ id: 'u2', name: 'Sam', email: 's@x' }]);
  if (p === '/api/download/archive') return send(200, Buffer.from('PK-zip'), 'application/zip');
  if (p === '/api/assets/' + ID(1)) return send(200, { ...asset(1), exifInfo: { ...asset(1).exifInfo, description: 'Nice', latitude: -3.4, longitude: 36.7, fNumber: 2.8, iso: 100 }, people: [{ id: PID, name: 'Amina' }], tags: [] });
  if (/\/thumbnail$/.test(p)) return send(200, PNG, 'image/png');
  if (p === '/api/api-keys') return send(200, []);
  send(404, { message: 'nope ' + p });
});
await new Promise((r) => imm.listen(0, '127.0.0.1', r));
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-px-')); const port = 20000 + Math.floor(Math.random() * 20000);
const srv = spawn('node', ['server/index.js'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, PORT: String(port), DATA_DIR: data, SUITE_DIR: process.env.E2E_SUITE || path.join(root, 'test/fixtures/suite'), APP_PASSWORD: 'pw', SESSION_SECRET: 'x'.repeat(40), IMMICH_URL: 'http://127.0.0.1:' + imm.address().port, IMMICH_API_KEY: 'k' } });
let log = ''; srv.stdout.on('data', (d) => (log += d)); srv.stderr.on('data', (d) => (log += d));
const B = `http://127.0.0.1:${port}`; for (let i = 0; i < 50; i++) { try { if ((await fetch(B + '/healthz')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
let pass = 0, failed = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { failed++; console.log('FAIL ' + n + '\n     ' + (e.stack || e).toString().split('\n').slice(0, 8).join('\n     ')); } };
let cookie = ''; const call = (p, o = {}) => fetch(B + p, { redirect: 'manual', ...o, headers: { 'x-aos': '1', cookie, 'content-type': 'application/json', ...(o.headers || {}) } });
const X = async (p, b, m) => { const r = await call('/api/photos/x/' + p, b === undefined ? {} : { method: m || 'POST', body: JSON.stringify(b) }); return { s: r.status, j: await r.json().catch(() => null), r }; };
let browser;
try {
  const l = await fetch(B + '/auth/password', { method: 'POST', body: JSON.stringify({ password: 'pw' }), headers: { 'content-type': 'application/json', 'x-aos': '1' } }); cookie = l.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
  await t('people, person photos, rename; places and a place', async () => {
    const pe = await X('people'); assert.equal(pe.j.people[0].name, 'Amina'); assert.equal((await X('person/' + PID + '/assets')).j.items.length, 1);
    assert.equal((await X('person/' + PID, { name: 'Amina K' }, 'PUT')).j.name, 'Amina K'); assert.ok(calls.some((c) => c.p === '/api/people/' + PID && c.b.name === 'Amina K'));
    const pl = await X('places'); assert.deepEqual(pl.j.map((x) => x.city), ['Arusha']); assert.equal((await X('place?city=Arusha&country=Tanzania')).j.items.length, 1);
  });
  await t('archive falls back to isArchived for older Immich; archive list works', async () => {
    assert.equal((await X('archive', { ids: [ID(1)], value: true })).s, 200); assert.deepEqual(archivedIds, [ID(1)]);
    const a = await X('archive'); assert.equal(a.j.items[0].name, 'IMG_4.jpg');
  });
  await t('trash, restore, delete forever, empty trash', async () => {
    assert.equal((await X('trash', { ids: [ID(1)] })).s, 200); assert.ok(calls.some((c) => c.m === 'DELETE' && c.p === '/api/assets' && c.b.force === false));
    assert.equal((await X('delete-forever', { ids: [ID(1)] })).s, 200); assert.ok(calls.some((c) => c.m === 'DELETE' && c.b && c.b.force === true));
    const tr = await X('trash'); assert.equal(tr.j.items[0].name, 'IMG_5.jpg'); assert.equal((await X('restore', { ids: [ID(5)] })).s, 200); assert.equal((await X('trash-empty', {})).s, 200);
    assert.equal((await X('trash', { ids: ['../x'] })).s, 400);
  });
  await t('albums: create, add, remove, rename, info, share users, delete', async () => {
    assert.equal((await X('albums', { name: 'Safari', ids: [ID(1)] })).j.id, AL); const add = await X('albums/' + AL + '/add', { ids: [ID(2)] }); assert.equal(add.j.added, 1);
    assert.equal((await X('albums/' + AL + '/remove', { ids: [ID(2)] })).s, 200); assert.equal((await X('albums/' + AL, { name: 'Safari 2' }, 'PATCH')).s, 200); assert.equal((await X('albums/' + AL + '/info')).j.name, 'Safari');
    assert.equal((await X('albums/' + AL + '/users', { users: [{ userId: '30000000-0000-4000-8000-000000000001', role: 'viewer' }] }, 'PUT')).s, 200); assert.equal((await X('users')).j[0].name, 'Sam'); assert.equal((await X('albums/' + AL, {}, 'DELETE')).s, 200);
    assert.equal((await X('albums', { name: ' ' })).s, 400);
  });
  await t('shared links: create for photos and an album, list, delete', async () => {
    const l1 = await X('links', { ids: [ID(1)], days: 7, password: 'pw' }); assert.equal(l1.j.url.endsWith('/share/abc'), true); const post = calls.filter((c) => c.p === '/api/shared-links' && c.m === 'POST').pop(); assert.equal(post.b.type, 'INDIVIDUAL'); assert.ok(post.b.expiresAt);
    await X('links', { albumId: AL }); assert.equal(calls.filter((c) => c.p === '/api/shared-links' && c.m === 'POST').pop().b.type, 'ALBUM');
    assert.equal((await X('links')).j[0].album.name, 'Safari'); assert.equal((await X('links/40000000-0000-4000-8000-000000000001', {}, 'DELETE')).s, 200);
  });
  await t('asset info, edit description, tags, memories, duplicates, stats, filtered find', async () => {
    const i = await X('asset/' + ID(1) + '/info'); assert.equal(i.j.desc, 'Nice'); assert.equal(i.j.people[0].name, 'Amina'); assert.equal(i.j.lat, -3.4);
    assert.equal((await X('asset/' + ID(1), { description: 'Hi' }, 'PATCH')).s, 200); assert.ok(calls.some((c) => c.m === 'PUT' && c.p === '/api/assets/' + ID(1) && c.b.description === 'Hi'));
    assert.equal((await X('tag', { ids: [ID(1)], name: 'Safari' })).j.id, 'tg1'); assert.equal((await X('memories')).j[0].items.length, 2);
    assert.equal((await X('duplicates')).j[0].items.length, 2); assert.equal((await X('duplicates', { id: '50000000-0000-4000-8000-000000000001', drop: [ID(2)] })).s, 200); assert.equal((await X('stats')).j.total, 4);
    const f = await X('find', { q: 'lion', type: 'video', city: 'Arusha' }); assert.equal(f.j.mode, 'smart'); assert.equal(calls.filter((c) => c.p === '/api/search/smart').pop().b.type, 'VIDEO');
    const f2 = await X('find', { city: 'Arusha', favorite: true }); assert.equal(f2.j.mode, 'filter');
  });
  await t('download zip and the general Immich pass-through (key stays here, secrets blocked)', async () => {
    const d = await call('/api/photos/x/download', { method: 'POST', body: JSON.stringify({ ids: [ID(1)] }) }); assert.equal(d.headers.get('content-type'), 'application/zip'); assert.equal(await d.text(), 'PK-zip');
    const g = await call('/api/immich/assets/statistics'); assert.equal((await g.json()).total, 4); assert.equal((await call('/api/immich/api-keys')).status, 403);
    const th = await call('/api/immich/people/' + PID + '/thumbnail'); assert.equal(th.status, 200); assert.equal((await fetch(B + '/api/immich/assets/statistics')).status, 401);
  });
  if (chromium) {
    browser = await chromium.launch({ args: ['--no-sandbox'] }); const ctx = await browser.newContext({ viewport: { width: 1360, height: 860 } }); await ctx.addInitScript(() => { try { localStorage.setItem('aos.pulsenative', 'false'); } catch (e) {} });
    await ctx.request.post(B + '/auth/password', { data: { password: 'pw' }, headers: { 'x-aos': '1' } }); const p = await ctx.newPage(); p.setDefaultTimeout(6000); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    await p.goto(B + '/#photos'); await p.waitForSelector('.ph');
    await t('UI: memories row, select photos, bar actions', async () => {
      await p.waitForSelector('.pxmcard'); await p.click('[data-phx="selmode"]'); await p.click('.ph >> nth=0'); await p.click('.ph >> nth=1'); await p.waitForSelector('#pxbar'); assert.match(await p.locator('#pxbar').innerText(), /2 selected/);
      await p.click('#pxbar [data-phx="toalbum"]'); await p.waitForSelector('[data-phx="pickalbum"]'); await p.click('[data-phx="pickalbum"]'); await p.waitForFunction(() => !document.querySelector('#pxbar')); assert.ok(calls.some((c) => c.m === 'PUT' && c.p === '/api/albums/' + AL + '/assets' && c.b.ids.length === 2));
    });
    await t('UI: People, Places, Archive, Trash, Shared and Duplicates tabs', async () => {
      for (const [tab, sel] of [['people', '.pxperson'], ['places', '[data-phx="place"]'], ['archive', '.ph'], ['trash', '.ph'], ['links', '[data-phx="dellink"]'], ['dups', '[data-phx="keep"]']]) { await p.click('[data-act="ptab"][data-t="' + tab + '"]'); await p.waitForSelector(sel); }
      await p.click('[data-act="ptab"][data-t="people"]'); await p.click('.pxperson'); await p.waitForSelector('.ph'); await p.click('[data-phx="back"]'); await p.waitForSelector('.pxperson');
    });
    await t('UI: viewer has details, people, description and extra actions', async () => {
      await p.click('[data-act="ptab"][data-t="timeline"]'); await p.waitForSelector('.ph'); await p.click('.ph [data-act="lb"] >> nth=0'); await p.waitForSelector('#lb [data-phx="lbalbum"]'); await p.waitForSelector('#lb #pxdesc'); assert.equal(await p.inputValue('#pxdesc'), 'Nice');
      assert.ok(await p.locator('#lb .pxchip', { hasText: 'Amina' }).count()); await p.click('#lb [data-act="lbx"]');
    });
    await t('UI: filters dialog runs a filtered search', async () => {
      await p.click('[data-phx="filters"]'); await p.waitForSelector('#pxf1'); await p.selectOption('#pxf1', 'video'); await p.fill('#pxf4', 'Arusha'); await p.click('[data-phx="mok"]'); await p.waitForFunction(() => /Filtered results/.test(document.body.innerText)); await p.click('[data-phx="clearfilters"]');
    });
    await t('UI: nothing threw', async () => assert.deepEqual(errs, []));
  }
} finally { if (browser) await browser.close(); srv.kill(); imm.close(); console.log(`\n${pass} passed, ${failed} failed`); if (failed) console.log(log.slice(-1200)); process.exit(failed ? 1 : 0); }
