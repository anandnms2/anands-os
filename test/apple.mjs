// Apple Notes and Reminders pushed by an iPhone Shortcut into Suite Notes, with an access token limited to /api/apple.
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import assert from 'node:assert/strict'; import { spawn } from 'node:child_process'; import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-apple-')); const port = 20000 + Math.floor(Math.random() * 20000);
const srv = spawn('node', ['server/index.js'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, PORT: String(port), DATA_DIR: data, SUITE_DIR: path.join(root, 'test/fixtures/suite'), APP_PASSWORD: 'pw', SESSION_SECRET: 'x'.repeat(40) } });
let log = ''; srv.stdout.on('data', (d) => (log += d)); srv.stderr.on('data', (d) => (log += d));
const B = `http://127.0.0.1:${port}`; for (let i = 0; i < 50; i++) { try { if ((await fetch(B + '/healthz')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
let pass = 0, failed = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { failed++; console.log('FAIL ' + n + '\n     ' + (e.stack || e).toString().split('\n').slice(0, 5).join('\n     ')); } };
let cookie = ''; { const r = await fetch(B + '/auth/password', { method: 'POST', headers: { 'content-type': 'application/json', 'x-aos': '1' }, body: JSON.stringify({ password: 'pw' }) }); cookie = (r.headers.getSetCookie() || []).map((c) => c.split(';')[0]).join('; '); }
const api = async (m, p, b, h) => { const r = await fetch(B + p, { method: m, headers: { ...(h || { cookie, 'x-aos': '1' }), ...(b ? { 'content-type': 'application/json' } : {}) }, body: b ? JSON.stringify(b) : undefined }); let j = null; try { j = await r.json(); } catch {} return { s: r.status, j }; };
const NB = path.join(data, 'fs', 'notes'), rj = (f) => JSON.parse(fs.readFileSync(path.join(NB, f), 'utf8'));
const nbOf = () => rj('notebooks/' + rj('library.json').notebooks[0] + '.json');
const pages = () => nbOf().sections.flatMap((s) => s.pages.map((p) => ({ ...p, section: s.name })));
const html = (title) => rj('pages/' + pages().find((p) => p.title === title).id + '.json').outlines[0].html;
let tok = '', auth = null;
try {
  await t('an access token can be limited to Apple Notes and Reminders', async () => { const r = await api('POST', '/api/security/token', { name: 'iPhone Shortcut', scope: 'apple' }); assert.equal(r.s, 200, JSON.stringify(r.j)); tok = r.j.token; auth = { authorization: 'Bearer ' + tok }; });
  await t('the token reaches the import endpoint and nothing else', async () => { assert.equal((await api('GET', '/api/money/tx', null, auth)).s, 403); assert.equal((await api('GET', '/api/settings', null, auth)).s, 403); assert.equal((await api('POST', '/api/apple/import', { notes: [] }, auth)).s, 200); });
  await t('one note per request, as the Shortcut sends it', async () => {
    let r = await api('POST', '/api/apple/import', { type: 'note', title: 'Fuel budget', body: 'Diesel plan\nCheck rates', folder: 'Notes', created: '2026-10-01T08:00:00Z', modified: '2026-10-02T09:00:00Z' }, auth); assert.equal(r.j.added, 1);
    assert.equal(nbOf().name, 'Apple'); assert.deepEqual(pages().map((p) => p.section + '/' + p.title), ['Notes/Fuel budget']); assert.match(html('Fuel budget'), /<p>Diesel plan<\/p><p>Check rates<\/p>/);
    r = await api('POST', '/api/apple/import', { type: 'note', title: 'Fuel budget (renamed)', body: 'Diesel plan v2', folder: 'Notes', created: '2026-10-01T08:00:00Z', modified: '2026-10-03T09:00:00Z' }, auth);
    assert.equal(r.j.updated, 1); assert.equal(r.j.added, 0); assert.equal(pages().length, 1); assert.equal(pages()[0].title, 'Fuel budget (renamed)'); assert.match(html('Fuel budget (renamed)'), /v2/);
  });
  await t('sending the same note again changes nothing', async () => { const r = await api('POST', '/api/apple/import', { type: 'note', title: 'Fuel budget (renamed)', body: 'Diesel plan v2', folder: 'Notes', created: '2026-10-01T08:00:00Z' }, auth); assert.equal(r.j.added + r.j.updated, 0); assert.equal(pages().length, 1); });
  await t('reminders sent one at a time build up one page per list', async () => {
    await api('POST', '/api/apple/import', { type: 'reminder', title: 'Call Brian', list: 'Errands', due: '2026-10-20T09:00:00Z', created: 'c1' }, auth);
    await api('POST', '/api/apple/import', { type: 'reminder', title: 'Renew licence', list: 'Errands', done: 'true', created: 'c2' }, auth);
    const r = await api('POST', '/api/apple/import', { type: 'reminder', title: 'Book trip', list: 'Errands', done: 'false', created: 'c3', notes: 'Kili flights' }, auth); assert.equal(r.s, 200);
    assert.equal(pages().filter((p) => p.title === 'Errands').length, 1); const h = html('Errands'); assert.match(h, /☐ Call Brian/); assert.match(h, /2026-10-20 09:00/); assert.match(h, /☐ Book trip/); assert.match(h, /Kili flights/); assert.match(h, /<h3>Done<\/h3><p>☑ Renew licence/);
    await api('POST', '/api/apple/import', { type: 'reminder', title: 'Renew licence', list: 'Errands', done: 'false', created: 'c2' }, auth); assert.ok(!/Done<\/h3>/.test(html('Errands'))); assert.equal(pages().filter((p) => p.title === 'Errands').length, 1);
  });
  await t('lists of notes and reminders in one request also work', async () => { const r = await api('POST', '/api/apple/import', { notes: [{ id: 'a', title: 'A', body: 'x', folder: 'Work' }, { id: 'b', title: 'B', body: 'y', folder: 'Work' }], reminders: [{ title: 'Pay rent', list: 'Home', created: 'h1' }] }, auth); assert.equal(r.j.added, 3); assert.ok(nbOf().sections.some((s) => s.name === 'Work')); assert.ok(pages().some((p) => p.section === 'Work' && p.title === 'B')); });
  await t('hostile html is cleaned and the status shows the last run', async () => { await api('POST', '/api/apple/import', { type: 'note', title: 'X', html: '<script>alert(1)</script><p onclick="x()">hi <a href="javascript:evil()">l</a></p><img src=x onerror=y>', created: 'z' }, auth); const h = html('X'); assert.ok(!/script|onclick|javascript|<img|onerror/i.test(h), h); const s = await api('GET', '/api/apple'); assert.ok(s.j.last); });
  await t('needs sign-in', async () => { assert.equal((await fetch(B + '/api/apple')).status, 401); });
} finally { srv.kill(); }
console.log(`\n${pass} passed, ${failed} failed`); if (failed) { console.log(log.slice(-1500)); process.exit(1); } process.exit(0);
