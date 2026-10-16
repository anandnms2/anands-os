// Pair a phone: single-use QR link, confirm step, named revocable device.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'aos-pr-')), port = 20000 + Math.floor(Math.random() * 20000), B = `http://127.0.0.1:${port}`;
const srv = spawn('node', ['server/index.js'], { cwd: root, stdio: 'ignore', env: { ...process.env, PORT: String(port), DATA_DIR: data, APP_PASSWORD: 'pw' } });
for (let i = 0; i < 50; i++) { try { if ((await fetch(B + '/healthz')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
let pass = 0, failed = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { failed++; console.log('FAIL ' + n + '\n     ' + (e.stack || e).toString().split('\n').slice(0, 4).join('\n     ')); } };
const H = { 'x-aos': '1', 'content-type': 'application/json' };
try {
  const lr = await fetch(B + '/auth/password', { method: 'POST', headers: H, body: JSON.stringify({ password: 'pw' }) }); const owner = lr.headers.get('set-cookie').split(';')[0];
  let link, token;
  await t('only a signed-in owner can make a pairing link', async () => {
    assert.equal((await fetch(B + '/api/security/pair', { method: 'POST', headers: H, body: '{}' })).status, 401);
    const r = await fetch(B + '/api/security/pair', { method: 'POST', headers: { ...H, cookie: owner }, body: JSON.stringify({ label: 'Anand iPhone' }) }); assert.equal(r.status, 200);
    const j = await r.json(); link = j.url; token = link.split('/auth/pair/')[1]; assert.ok(token.length >= 30); assert.ok(j.expires > Date.now());
  });
  await t('opening the link only asks; a scanner preview cannot use it up', async () => {
    const r = await fetch(B + '/auth/pair/' + token); assert.equal(r.status, 200); assert.ok(!r.headers.get('set-cookie')); assert.ok((await r.text()).includes('Anand iPhone'));
    assert.equal((await fetch(B + '/auth/pair/' + token)).status, 200);
  });
  let phone;
  await t('confirming signs the phone in once', async () => {
    const r = await fetch(B + '/auth/pair/' + token, { method: 'POST', redirect: 'manual' }); assert.equal(r.status, 302); phone = r.headers.get('set-cookie').split(';')[0];
    assert.equal((await fetch(B + '/api/session', { headers: { cookie: phone } })).status, 200);
    assert.equal((await fetch(B + '/auth/pair/' + token, { method: 'POST', redirect: 'manual' })).status, 403); assert.equal((await fetch(B + '/auth/pair/' + token)).status, 403);
  });
  await t('the phone appears by name and can be signed out', async () => {
    const d = await (await fetch(B + '/api/security', { headers: { cookie: owner } })).json(); const p = d.sessions.find((s) => s.label === 'Anand iPhone'); assert.ok(p && p.method === 'paired');
    assert.ok(d.history.some((e) => e.ev === 'phone_paired'));
    const r = await fetch(B + '/api/security/revoke', { method: 'POST', headers: { ...H, cookie: owner }, body: JSON.stringify({ id: p.id }) }); assert.equal(r.status, 200);
    const me = await fetch(B + '/api/session', { headers: { cookie: phone } }); assert.ok(me.status === 401 || !(await me.json()).user, 'phone is out');
  });
  await t('made-up and expired tokens are refused', async () => { assert.equal((await fetch(B + '/auth/pair/nope')).status, 403); });
} finally { srv.kill(); }
console.log(`\n${pass} passed, ${failed} failed`); process.exit(failed ? 1 : 0);
