// Desktop extras API: sticky notes and alarms kept per person, and currency rates with a six hour cache.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-dsk-')), port = 20000 + Math.floor(Math.random() * 20000), B = `http://127.0.0.1:${port}`;
let hits = 0, fail = false;
const fx = http.createServer((q, r) => { hits++; if (fail) { r.writeHead(500); return r.end('no'); } r.writeHead(200, { 'content-type': 'application/json' }); r.end(JSON.stringify({ result: 'success', time_last_update_unix: 1760600000, rates: { USD: 1, TZS: 2610.5, ZMW: 27.4, CDF: 2840, KES: 129.2, ZAR: 17.6, INR: 84.1, XXX: 9 } })); }).listen(port + 1);
const srv = spawn('node', ['server/index.js'], { cwd: root, stdio: 'ignore', env: { ...process.env, PORT: String(port), DATA_DIR: data, SUITE_DIR: path.join(root, 'test/fixtures/suite'), APP_PASSWORD: 'pw', RATES_URL: `http://127.0.0.1:${port + 1}/` } });
for (let i = 0; i < 50; i++) { try { if ((await fetch(B + '/healthz')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
let pass = 0, failed = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { failed++; console.log('FAIL ' + n + '\n     ' + (e.stack || e).toString().split('\n').slice(0, 4).join('\n     ')); } };
try {
  const H = { 'x-aos': '1', 'content-type': 'application/json' }; let cookie = '';
  const lr = await fetch(B + '/auth/password', { method: 'POST', headers: H, body: JSON.stringify({ password: 'pw' }) }); cookie = (lr.headers.getSetCookie() || []).map((c) => c.split(';')[0]).join('; ');
  const call = async (m, p, b) => { const r = await fetch(B + p, { method: m, headers: { ...H, cookie }, body: b ? JSON.stringify(b) : undefined }); return { s: r.status, j: await r.json().catch(() => ({})) }; };
  await t('signed out is refused', async () => { const r = await fetch(B + '/api/desk'); assert.equal(r.status, 401); });
  await t('notes and alarms start empty, then save and come back cleaned', async () => {
    let r = await call('GET', '/api/desk'); assert.equal(r.s, 200, JSON.stringify(r)); assert.deepEqual(r.j, { notes: [], alarms: [] }, JSON.stringify(r.j));
    r = await call('PUT', '/api/desk', { notes: [{ id: 'n1', x: 120.4, y: 80, w: 20, h: 9999, c: 'zz', t: 'Call Tunduma' }, { id: 'n2', x: 5, y: 5, c: 'g', t: 'x'.repeat(9000) }], alarms: [{ id: 'a1', h: 6, m: 30, days: [1, 2, 2, 9, 3], label: 'Briefing', on: true }] });
    assert.equal(r.s, 200); assert.equal(r.j.notes[0].x, 120); assert.equal(r.j.notes[0].w, 150); assert.equal(r.j.notes[0].h, 800); assert.equal(r.j.notes[0].c, 'y'); assert.equal(r.j.notes[1].t.length, 4000); assert.deepEqual(r.j.alarms[0].days, [1, 2, 3]);
    r = await call('GET', '/api/desk'); assert.equal(r.j.notes.length, 2); assert.equal(r.j.alarms[0].label, 'Briefing');
    r = await call('PUT', '/api/desk', { notes: Array.from({ length: 80 }, (_, i) => ({ id: 'q' + i, t: 'a' })) }); assert.equal(r.j.notes.length, 60);
    assert.equal((await call('POST', '/api/desk', {})).s, 405);
  });
  await t('rates: only wanted currencies, cached for six hours, stale copy when the source fails', async () => {
    let r = await call('GET', '/api/rates'); assert.equal(r.s, 200); assert.equal(r.j.rates.TZS, 2610.5); assert.equal(r.j.rates.XXX, undefined); assert.equal(r.j.rates.USD, 1); assert.equal(r.j.stale, false); assert.equal(r.j.updated, 1760600000000);
    const h = hits; await call('GET', '/api/rates'); assert.equal(hits, h, 'second call is served from the cache');
    assert.equal((await call('POST', '/api/rates', {})).s, 405);
  });
} finally { srv.kill(); fx.close(); }
console.log(`\n${pass} passed, ${failed} failed`); process.exit(failed ? 1 : 0);
